/*
this file is responsible for maintaining player state that is network-replicated.
*/
import {WsAudioDecoder} from 'wsrtc/ws-codec.js';
import {ensureAudioContext, getAudioContext} from 'wsrtc/ws-audio-context.js';
import {getAudioDataBuffer} from 'wsrtc/ws-util.js';

import * as THREE from 'three';
import * as Z from 'zjs';
import {getRenderer, scene, camera, dolly} from './renderer.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import physx from './physx.js';
import Avatar from './avatars/avatars.js';
import metaversefile from 'metaversefile';
import {
  actionsMapName,
  avatarMapName,
  appsMapName,
  playersMapName,
  crouchMaxTime,
  activateMaxTime,
  // useMaxTime,
  aimTransitionMaxTime,
  avatarInterpolationFrameRate,
  avatarInterpolationTimeDelay,
  avatarInterpolationNumFrames,
  defaultPlayerSpec,
  // groundFriction,
  // defaultVoicePackName,
  voiceEndpointBaseUrl,
  numLoadoutSlots,
} from './constants.js';
import {AppManager} from './app-manager.js';
import {CharacterPhysics} from './character-physics.js';
import {CharacterHups} from './character-hups.js';
import {CharacterSfx} from './character-sfx.js';
import {CharacterHitter} from './character-hitter.js';
import {CharacterBehavior} from './character-behavior.js';
import {CharacterFx} from './character-fx.js';
import {VoicePack, VoicePackVoicer} from './voice-output/voice-pack-voicer.js';
import {VoiceEndpoint, VoiceEndpointVoicer, getVoiceEndpointUrl} from './voice-output/voice-endpoint-voicer.js';
import {BinaryInterpolant, BiActionInterpolant, UniActionInterpolant, InfiniteActionInterpolant, PositionInterpolant, QuaternionInterpolant} from './interpolants.js';
import {applyPlayerToAvatar, makeAvatar} from './player-avatar-binding.js';
import {
  defaultPlayerName,
  defaultPlayerBio,
} from './ai/lore/lore-model.js';
import {murmurhash3} from './procgen/murmurhash3.js';
import musicManager from './music-manager.js';
import {makeId, clone} from './util.js';
import overrides from './overrides.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const zeroVector = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);

const controlActionTypes = ['jump', 'crouch', 'fly', 'sit'];

function makeCancelFn() {
  let live = true;
  return {
    isLive() {
      return live;
    },
    cancel() {
      live = false;
    },
  };
}


/* function loadPhysxAuxCharacterCapsule() {
  const avatarHeight = this.avatar.height;
  const radius = baseRadius/heightFactor * avatarHeight;
  const height = avatarHeight - radius*2;
  const halfHeight = height/2;

  const position = this.position.clone()
    .add(new THREE.Vector3(0, -avatarHeight/2, 0));
  const physicsMaterial = new THREE.Vector3(0, 0, 0);

  const physicsObject = physicsManager.addCapsuleGeometry(
    position,
    localQuaternion.copy(this.quaternion)
      .premultiply(
        localQuaternion2.setFromAxisAngle(
          localVector.set(0, 0, 1),
          Math.PI/2
        )
      ),
    radius,
    halfHeight,
    physicsMaterial,
    true
  );
  physicsObject.name = 'characterCapsuleAux';
  physicsManager.setGravityEnabled(physicsObject, false);
  physicsManager.setLinearLockFlags(physicsObject.physicsId, false, false, false);
  physicsManager.setAngularLockFlags(physicsObject.physicsId, false, false, false);
  this.physicsObject = physicsObject;
} */

class Hand extends THREE.Object3D {
  constructor() {
    super();

    this.pointer = 0;
    this.grab = 0;
    this.enabled = false;
  }
}
class Player extends THREE.Object3D {
  constructor({
    name = defaultPlayerName,
    playerId = makeId(5), // random 5-digit string, must be unique per player in room
    isLocalPlayer = false, // set true by local player
  } = {}) {
    super();
    this.playerId = playerId;
    this.playerIdInt = murmurhash3(playerId); // hash the playerId for network messages
    this.name = name;
    this.bio = defaultPlayerBio;

    this.avatar = null; // reference to Avatar class instance, each player can have one

    this.localVector = [0, 0, 0];
    this.localQuaternion = [0, 0, 0, 1];

    this.playerMap = null; // Key-values for player data, such as name and ID, can have children (avatar)

    this.voicePack = null;
    this.voiceEndpoint = null;

    this.syncAvatarCancelFn = null;
    this.unbindFns = [];

    // If these weren't set on constructor (which they aren't on remote player) then set them now
    this.characterPhysics = new CharacterPhysics(this);
    this.characterHups = new CharacterHups(this);
    this.characterSfx = new CharacterSfx(this);
    this.characterFx = new CharacterFx(this);
    this.characterHitter = new CharacterHitter(this);
    this.characterBehavior = new CharacterBehavior(this);

    this.eyeballTarget = new THREE.Vector3();
    this.eyeballTargetEnabled = false;
    this.leftHand = new Hand();
    this.rightHand = new Hand();
    this.hands = [
      this.leftHand,
      this.rightHand,
    ];

    // Add listener functions to this object
    // Any time an app is added, make sure it's also added to the scene
    this.appManager = new AppManager(isLocalPlayer);
    this.appManager.addEventListener('appadd', e => {
      const app = e.data;
      scene.add(app);
    });
    this.appManager.addEventListener('appremove', e => {
      const app = e.data;
      app.parent && app.parent.remove(app);
    });
  }

  // General functions

  setSpawnPoint(position, quaternion) {
    this.position.copy(position);
    this.quaternion.copy(quaternion);

    camera.position.copy(position);
    camera.quaternion.copy(quaternion);
    camera.updateMatrixWorld();

    if (this.characterPhysics) {
      this.characterPhysics.setPosition(position);
    }
  }

  getPosition() {
    return this.position.toArray(this.localVector);
  }

  getQuaternion() {
    return this.quaternion.toArray(this.localQuaternion);
  }

  createCharacterController() {
    const heightFactor = 1.6;
    const baseRadius = 0.3;
    const avatarHeight = this.avatar.height;
    const radius = (baseRadius / heightFactor) * avatarHeight;
    const height = avatarHeight - radius * 2;

    const contactOffset = (0.1 / heightFactor) * avatarHeight;
    const stepOffset = (0.5 / heightFactor) * avatarHeight;

    const position = this.position
      .clone()
      .add(new THREE.Vector3(0, -avatarHeight / 2, 0));

    if (this.characterController) {
      physicsManager.destroyCharacterController(this.characterController);
      this.characterController = null;
    }
    this.characterController = physicsManager.createCharacterController(
      radius - contactOffset,
      height,
      contactOffset,
      stepOffset,
      position,
    );
  }

  // Actions
  // Anything a player does is an action, i.e. wearing, swinging, jumping, sitting
  // Actions are synced to the player map and handled over the network

  findAction(fn) {
    const actions = this.getActionsState();
    for (const action of actions) {
      if (fn(action)) {
        return action;
      }
    }
    return null;
  }

  findActionIndex(fn) {
    const actions = this.getActionsState();
    let i = 0;
    for (const action of actions) {
      if (fn(action)) {
        return i;
      }
      i++;
    }
    return -1;
  }

  addAction(action) {
    action = clone(action);
    action.actionId = makeId(5);
    this.getActionsState().push([action]);

    return action;
  }

  removeAction(type) {
    const actions = this.getActionsState();
    let i = 0;
    for (const action of actions) {
      if (action.type === type) {
        actions.delete(i);
        break;
      }
      i++;
    }
  }

  removeActionIndex(index) {
    this.getActionsState().delete(index);
  }

  clearActions() {
    const actionsState = this.getActionsState();
    const numActions = actionsState.length;
    for (let i = numActions - 1; i >= 0; i--) {
      this.removeActionIndex(i);
    }
  }

  setControlAction(action) {
    const actions = this.getActionsState();
    for (let i = 0; i < actions.length; i++) {
      const action = actions.get(i);
      const isControlAction = controlActionTypes.includes(action.type);
      if (isControlAction) {
        actions.delete(i);
        i--;
      }
    }
    action.controllingBone =
      action.type === 'sit' ? null : action.controllingBone;
    actions.push([action]);
  }

  getAction(type) {
    const actions = this.getActionsState();
    for (const action of actions) {
      if (action.type === type) {
        return action;
      }
    }
    return null;
  }

  getActionByActionId(actionId) {
    const actions = this.getActionsState();
    for (const action of actions) {
      if (action.actionId === actionId) {
        return action;
      }
    }
    return null;
  }

  getActionIndex(type) {
    const actions = this.getActionsState();
    let i = 0;
    for (const action of actions) {
      if (action.type === type) {
        return i;
      }
      i++;
    }
    return -1;
  }

  indexOfAction(action) {
    const actions = this.getActionsState();
    let i = 0;
    for (const a of actions) {
      if (a === action) {
        return i;
      }
      i++;
    }
    return -1;
  }

  hasAction(type) {
    const actions = this.getActionsState();
    for (const action of actions) {
      if (action.type === type) {
        return true;
      }
    }
    return false;
  }

  getActions() { return this.getActionsState(); }

  getActionsState() {
    let actionsArray = this.playerMap.has(avatarMapName)
      ? this.playerMap.get(actionsMapName, Z.Array)
      : null;
    if (!actionsArray) {
      actionsArray = new Z.Array();
      this.playerMap.set(actionsMapName, actionsArray);
    }
    return actionsArray;
  }

  getActionsArray() {
    return Array.from(this.getActionsState());
  }

  // Voice
  // Players speak using a realistic text-to-speech service ("endpoint") or gobblygook ("pack")
  // Endpoint voices play whenever a player chats or engages in dialogue
  // Hups and sounds are also covered in the voice pack

  async setVoicePack({audioUrl, indexUrl}) {
    const voiceSpec = JSON.stringify({audioUrl, indexUrl, endpointUrl: self.voiceEndpoint ? self.voiceEndpoint.url : ''});
    this.playerMap.set('voiceSpec', voiceSpec);
    this.loadVoicePack({audioUrl, indexUrl});
  }

  async loadVoicePack({audioUrl, indexUrl}) {
    this.voicePack = await VoicePack.load({
      audioUrl,
      indexUrl,
    });
    this.updateVoicer();
  }

  setVoiceEndpoint(voiceId) {
    if (!voiceId) return console.error('voice Id is null');
    const self = this;
    const url = `${voiceEndpointBaseUrl}?voice=${encodeURIComponent(voiceId)}`;
    this.playersArray.doc.transact(function tx() {
      let oldVoiceSpec = self.playerMap.get('voiceSpec');
      if (oldVoiceSpec) {
        oldVoiceSpec = JSON.parse(oldVoiceSpec);
        const voiceSpec = JSON.stringify({audioUrl: oldVoiceSpec.audioUrl, indexUrl: oldVoiceSpec.indexUrl, endpointUrl: url});
        self.playerMap.set('voiceSpec', voiceSpec);
      } else {
        const voiceSpec = JSON.stringify({audioUrl: self.voicePack?.audioUrl, indexUrl: self.voicePack?.indexUrl, endpointUrl: url});
        self.playerMap.set('voiceSpec', voiceSpec);
      }
    });
    this.loadVoiceEndpoint(url);
  }

  loadVoiceEndpoint(url) {
    if (url) {
      this.voiceEndpoint = new VoiceEndpoint(url);
    } else {
      this.voiceEndpoint = null;
    }
    this.updateVoicer();
  }

  getVoice() {
    if (!this.voiceEndpoint && !this.voicePack) throw new Error('this.voiceEndpoint is null');
    return this.voiceEndpoint || this.voicePack;
  }

  updateVoicer() {
    const voice = this.getVoice();
    if (voice instanceof VoicePack) {
      const {syllableFiles, audioBuffer} = voice;
      this.voicer = new VoicePackVoicer(syllableFiles, audioBuffer, this);
    } else if (voice instanceof VoiceEndpoint) {
      this.voicer = new VoiceEndpointVoicer(voice, this);
    } else if (voice === null) {
      this.voicer = null;
    } else {
      throw new Error('invalid voice');
    }
  }

  async fetchThemeSong() {
    const avatarApp = this.getAvatarApp();
    const npcComponent = avatarApp.getComponent('npc');
    const npcThemeSongUrl = npcComponent?.themeSongUrl;
    return await Player.fetchThemeSong(npcThemeSongUrl);
  }

  static async fetchThemeSong(npcThemeSongUrl) {
    if (npcThemeSongUrl) {
      return await musicManager.fetchMusic(npcThemeSongUrl);
    } else {
      return null;
    }
  }

  handleWearUpdate(app, wear, loadoutIndex = -1) {
    const param = {
      type: 'wearupdate',
      app,
      player: this,
      wear,
    };

    if (loadoutIndex != -1) {
      param.loadoutIndex = loadoutIndex;
    }

    this.dispatchEvent(param);
    app.dispatchEvent(param);
  }

  wear(app, {loadoutIndex = -1} = {}) {
    const _getNextLoadoutIndex = () => {
      let nextLoadoutIndex = -1;
      const usedIndexes = Array(8).fill(false);
      for (const action of this.getActionsState()) {
        if (action.type === 'wear') {
          usedIndexes[action.loadoutIndex] = true;
        }
      }
      for (let i = 0; i < usedIndexes.length; i++) {
        if (!usedIndexes[i]) {
          nextLoadoutIndex = i;
          break;
        }
      }
      return nextLoadoutIndex;
    };
    if (loadoutIndex === -1) {
      loadoutIndex = _getNextLoadoutIndex();
    }

    const _initPhysics = () => {
      const physicsObjects = app.getPhysicsObjects();
      for (const physicsObject of physicsObjects) {
        physx.physxWorker.disableGeometryQueriesPhysics(
          physx.physics,
          physicsObject.physicsId,
        );
        physx.physxWorker.disableGeometryPhysics(
          physx.physics,
          physicsObject.physicsId,
        );
      }
    };
    _initPhysics();

    if (loadoutIndex >= 0 && loadoutIndex < numLoadoutSlots) {
      const _removeOldApp = () => {
        const actions = this.getActionsState();
        let oldLoadoutAction = null;
        for (let i = 0; i < actions.length; i++) {
          const action = actions.get(i);
          if (action.type === 'wear' && action.loadoutIndex === loadoutIndex) {
            oldLoadoutAction = action;
            break;
          }
        }
        if (oldLoadoutAction) {
          const app = this.appManager.getAppByInstanceId(
            oldLoadoutAction.instanceId,
          );
          this.unwear(app, {
            destroy: true,
          });
        }
      };
      _removeOldApp();

      const _transplantNewApp = () => {
        if (world.appManager.hasTrackedApp(app.instanceId)) {
          world.appManager.transplantApp(app, this.appManager);
        } else {
          console.warn(
            'need to transplant unowned app',
            app,
            world.appManager,
            this.appManager,
          );
        }
      };
      _transplantNewApp();

      const _initPhysics = () => {
        const physicsObjects = app.getPhysicsObjects();
        for (const physicsObject of physicsObjects) {
          physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
          physx.physxWorker.disableGeometryPhysics(physx.physics, physicsObject.physicsId);
        }
      };
      _initPhysics();

      const wearComponent = app.getComponent('wear');
      const holdAnimation = wearComponent ? wearComponent.holdAnimation : null;
      const _addAction = () => {
        this.addAction({
          type: 'wear',
          instanceId: app.instanceId,
          loadoutIndex,
          holdAnimation,
        });
      };
      _addAction();

      this.handleWearUpdate(app, true, loadoutIndex);
    }
  }

  unwear(app, {
    destroy = false,
    dropStartPosition = null,
    dropDirection = null,
  } = {}) {
    const wearActionIndex = this.findActionIndex(({type, instanceId}) => {
      return type === 'wear' && instanceId === app.instanceId;
    });
    const _deinitPhysics = () => {
      const physicsObjects = app.getPhysicsObjects();
      for (const physicsObject of physicsObjects) {
        physx.physxWorker.enableGeometryQueriesPhysics(
          physx.physics,
          physicsObject.physicsId,
        );
        physx.physxWorker.enableGeometryPhysics(
          physx.physics,
          physicsObject.physicsId,
        );
      }
    };
    _deinitPhysics();
    if (wearActionIndex !== -1) {
      const wearAction = this.getActionsState().get(wearActionIndex);
      const loadoutIndex = wearAction.loadoutIndex;
      if (app.getComponent('wear') && !app.getComponent('sit') && !app.getComponent('pet')) {
        const _setAppTransform = () => {
          if (dropStartPosition && dropDirection) {
            const physicsObjects = app.getPhysicsObjects();
            if (physicsObjects.length > 0) {
              const physicsObject = physicsObjects[0];

              physicsObject.position.copy(dropStartPosition);
              physicsObject.quaternion.copy(this.quaternion);
              physicsObject.updateMatrixWorld();

              physicsManager.setTransform(physicsObject, true);
              physicsManager.setVelocity(physicsObject, localVector.copy(dropDirection).multiplyScalar(5).add(this.characterPhysics.velocity), true);
              physicsManager.setAngularVelocity(physicsObject, zeroVector, true);

              app.position.copy(physicsObject.position);
              app.quaternion.copy(physicsObject.quaternion);
              app.scale.copy(physicsObject.scale);
              app.matrix.copy(physicsObject.matrix);
              app.matrixWorld.copy(physicsObject.matrixWorld);
            } else {
              app.position.copy(dropStartPosition);
              app.quaternion.setFromRotationMatrix(
                localMatrix.lookAt(
                  localVector.set(0, 0, 0),
                  localVector2.set(dropDirection.x, 0, dropDirection.z).normalize(),
                  upVector,
                ),
              );
              app.scale.set(1, 1, 1);
              app.updateMatrixWorld();
            }
            app.lastMatrix.copy(app.matrixWorld);
          } else {
            const avatarHeight = this.avatar.height;
            app.position.copy(this.position)
              .add(localVector.set(0, -avatarHeight + 0.5, -0.5).applyQuaternion(this.quaternion));
            app.quaternion.identity();
            app.scale.set(1, 1, 1);
            app.updateMatrixWorld();
          }
        };
        _setAppTransform();
      }
      const _deinitPhysics = () => {
        const physicsObjects = app.getPhysicsObjects();
        for (const physicsObject of physicsObjects) {
          physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
          physx.physxWorker.enableGeometryPhysics(physx.physics, physicsObject.physicsId);
        }
      };
      _deinitPhysics();

      const _removeApp = () => {
        this.removeActionIndex(wearActionIndex);
        if (this.appManager.hasTrackedApp(app.instanceId)) {
          if (destroy) {
            this.appManager.removeApp(app);
          } else {
            this.appManager.transplantApp(app, world.appManager);
          }
        } else {
          throw new Error('Need to transplant unowned app', app, this.appManager, world.appManager);
        }
      };
      _removeApp();
      this.handleWearUpdate(app, false, loadoutIndex);
    } else {
      this.handleWearUpdate(app, false, -1);
    }
  }

  async syncAvatar() {
    if (this.syncAvatarCancelFn) {
      this.syncAvatarCancelFn.cancel();
      this.syncAvatarCancelFn = null;
    }
    const cancelFn = makeCancelFn();
    this.syncAvatarCancelFn = cancelFn;

    const instanceId = this.getAvatarState().get('instanceId') ?? '';

    if (this.avatar) {
      this.appManager.removeApp(this.avatar.app);
      this.avatar?.app?.parent?.remove(this.avatar.app);
    }

    const _setNextAvatarApp = app => {
      (() => {
        let avatar;
        if (app) {
          app.toggleBoneUpdates(true);
          if (!app.avatar) {
            app.avatar = makeAvatar(app);
          }
          avatar = app.avatar;
        } else {
          avatar = null;
        }

        if (!cancelFn.isLive()) return console.warn('canceling the function');
        this.avatar = avatar;
        this.createCharacterController();

        if (this.isLocalPlayer) {
          physicsManager.disableGeometryQueries(this.characterController);
          avatar.isLocalPlayer = true;
        }

        this.dispatchEvent({
          type: 'avatarchange',
          app,
          avatar,
        });
      })();
    };

    if (instanceId) {
      // add next app from player app manager
      const nextAvatarApp = this.appManager.getAppByInstanceId(instanceId);
      if (nextAvatarApp) {
        _setNextAvatarApp(nextAvatarApp);
      } else {
        // add next app from world app manager
        const nextAvatarApp = world.appManager.getAppByInstanceId(instanceId);
        if (nextAvatarApp) {
          world.appManager.transplantApp(nextAvatarApp, this.appManager);
          _setNextAvatarApp(nextAvatarApp);
        } else {
          // add next app from currently loading apps
          const addPromise = this.appManager.pendingAddPromises.get(instanceId);
          if (addPromise) {
            const nextAvatarApp = await addPromise;
            if (!cancelFn.isLive()) return;
            _setNextAvatarApp(nextAvatarApp);
          } else {
            throw new Error('Cannot set avatar to null', app);
          }
        }
      }
    }

    this.syncAvatarCancelFn = null;
  }

  getAvatarState() {
    let avatarMap = this.playerMap.has(avatarMapName)
      ? this.playerMap.get(avatarMapName, Z.Map)
      : null;
    if (!avatarMap) {
      avatarMap = new Z.Map();
      this.playerMap.set(avatarMapName, avatarMap);
    }
    return avatarMap;
  }

  getAppsState() {
    let appsArray = this.playerMap.has(appsMapName)
      ? this.playerMap.get(appsMapName, Z.Array)
      : null;
    if (!appsArray) {
      appsArray = new Z.Array();
      this.playerMap.set(appsMapName, appsArray);
    }
    return appsArray;
  }

  getAppsArray() {
    return Array.from(this.getAppsState());
  }

  // Cleanup functions

  destroy() {
    this.characterPhysics?.destroy();
    this.characterHups?.destroy();
    this.characterSfx?.destroy();
    this.characterFx?.destroy();

    this.appManager.unbindState();
    this.appManager.destroy();
  }
}

// Networked player base
// Adds network functionality via specifically state binding
// Local and remote players inherit from this
class NetworkPlayer extends Player {
  constructor(opts) {
    super(opts);
    this.playersArray = null;
  }

  // State binding
  // State is synced with ZJS and WSRTC
  // zjs follows the observer pattern where bound state is observed for changes
  // Whenever changes are set, WSRTC sends to other players
  // When messages are received, change events are sent to listeners
  bindState(nextPlayersArray) {
    // Grab the current state while unbinding it
    const oldState = this.unbindState();

    // set the new state
    this.playersArray = nextPlayersArray;

    // Handle local player state binding
    const _bindPlayer = () => {
      if (this.isLocalPlayer) {
        const {oldActions, oldAvatar, oldApps} = oldState;
        const {instanceId} = oldAvatar;

        const self = this;
        this.playersArray.doc.transact(function tx() {
          self.playerMap = new Z.Map();
          self.playerMap.set('playerId', self.playerId);
          self.playerMap.set('name', self.name);
          self.playerMap.set('bio', self.bio);

          const transform = new Float32Array(8);
          self.position.toArray(transform);
          self.quaternion.toArray(transform, 3);

          self.playerMap.set('transform', transform);

          const avatar = self.getAvatarState();
          avatar.set('instanceId', instanceId ?? '');

          const actions = self.getActionsState();
          for (const oldAction of oldActions) {
            actions.push([oldAction]);
          }

          const apps = self.getAppsState();
          for (const oldApp of oldApps) {
            const mapApp = new Z.Map();
            for (const k in oldApp) {
              const v = oldApp[k];
              mapApp.set(k, v);
            }
            apps.push([mapApp]);
          }

          self.playersArray.push([self.playerMap]);
        });
      } else {
        // Handle remote player state binding
        // Local player map is a child of playersArray, we need to bind to it
        const _setNewPlayerMap = () => {
          let index = -1;
          for (let i = 0; i < this.playersArray.length; i++) {
            const player = this.playersArray.get(i, Z.Map);
            if (player.get('playerId') === this.playerId) {
              index = i;
              break;
            }
          }

          if (index !== -1) {
            this.playerMap = this.playersArray.get(index, Z.Map);
          } else {
            throw new Error('Binding to nonexistent player object', this.playersArray.toJSON());
          }
        };
        _setNewPlayerMap();

        // Observer variables for keeping track of velocity
        const lastPosition = new THREE.Vector3();
        let lastTime = performance.now();

        // Called any time the player map is changed
        const observePlayerFn = e => {
          if (e.changes.keys.get('name')) {
            this.name = e.changes.keys.get('name');
          }

          if (e.changes.keys.get('bio')) {
            this.bio = e.changes.keys.get('bio');
          }

          if (e.changes.keys.get('voiceSpec') || e.added?.keys?.get('voiceSpec')) {
            const voiceSpec = e.changes.keys.get('voiceSpec');
            const json = JSON.parse(voiceSpec.value);
            if (json.endpointUrl) { this.loadVoiceEndpoint(json.endpointUrl); }
            if (json.audioUrl && json.indexUrl) { this.loadVoicePack({audioUrl: json.audioUrl, indexUrl: json.indexUrl}); }
          }

          if (e.changes.keys.has('transform')) {
            const transform = this.playerMap.get('transform');
            if (transform) {
              const time = performance.now();
              const timeDiff = time - lastTime;
              lastTime = time;
              this.position.fromArray(transform, 0);

              if (this.avatar) this.characterPhysics.setPosition(this.position);

              this.quaternion.fromArray(transform, 3);

              this.positionInterpolant?.snapshot(timeDiff);
              this.quaternionInterpolant?.snapshot(timeDiff);

              for (const actionBinaryInterpolant of this
                .actionBinaryInterpolantsArray) {
                actionBinaryInterpolant.snapshot(timeDiff);
              }

              if (this.avatar) {
                this.avatar.setVelocity(timeDiff / 1000, lastPosition, this.position, this.quaternion);
              }

              this.characterPhysics.applyAvatarPhysicsDetail(true, true, performance.now(), timeDiff / 1000);

              lastPosition.copy(this.position);
            } else {
              console.warn('Unhandled event', e);
            }
          }
        };

        this.playerMap.observe(observePlayerFn);
        this.unbindFns.push(
          this.playerMap.unobserve.bind(this.playerMap, observePlayerFn),
        );
      }
    };

    _bindPlayer();

    // Bind actions
    const _bindActions = () => {
      const actions = this.getActionsState();
      const observeActionsFn = e => {
        const {added, deleted} = e.changes;

        for (const item of added.values()) {
          const action = item.content.type;
          this.dispatchEvent({
            type: 'actionadd',
            action: action,
          });
        }

        for (const item of deleted.values()) {
          const action = item.content.type;
          this.dispatchEvent({
            type: 'actionremove',
            action: action,
          });
        }
      };
      actions.observe(observeActionsFn);
      this.unbindFns.push(actions.unobserve.bind(actions, observeActionsFn));
    };

    _bindActions();

    // Bind avatar
    const _bindAvatar = () => {
      const avatar = this.getAvatarState();

      const observeAvatarFn = async e => {
        let lastAvatarInstanceId = '';
        const instanceId = avatar.get('instanceId') ?? '';
        if (lastAvatarInstanceId !== instanceId) {
          lastAvatarInstanceId = instanceId;
          this.syncAvatar();
        }
      };

      avatar.observe(observeAvatarFn);
      this.unbindFns.push(avatar.unobserve.bind(avatar, observeAvatarFn));

      const _cancelSyncAvatar = () => {
        if (this.syncAvatarCancelFn) {
          this.syncAvatarCancelFn();
          this.syncAvatarCancelFn = null;
        }
      };
      this.unbindFns.push(_cancelSyncAvatar);
    };
    _bindAvatar();

    this.appManager.bindState(this.getAppsState());
  }

  // Unbind the current observers, either to remove the player or rebind to another room
  unbindState() {
    // Detatch current state
    const oldActions = this.playersArray ? this.getActionsState() : new Z.Array();
    const oldAvatar = (this.playersArray ? this.getAvatarState() : new Z.Map()).toJSON();
    const oldApps = (this.playersArray ? this.getAppsState() : new Z.Array()).toJSON();

    // Clear old state and unbind
    this.playersArray = null;
    this.playerMap = null;
    if (!this.unbindFns) return;
    for (const unbindFn of this.unbindFns) {
      unbindFn();
    }
    this.unbindFns.length = 0;
    // Return old state
    return {
      oldActions,
      oldAvatar,
      oldApps,
    };
  }

  isBound() {
    return !!this.playerMap && !!this.playersArray;
  }
}

// Local networked player
// Any player being simulated on the client is a local player
// This includes the local player, as well as NPCs
// Called from in players.js and npc-manager.js
class LocalPlayer extends NetworkPlayer {
  constructor(opts) {
    super({...opts, isLocalPlayer: !opts.npc});

    this.microphoneMediaStream = null;

    this.isLocalPlayer = !opts.npc;
    this.isNpcPlayer = !!opts.npc;

    this.lastTimestamp = NaN;
    this.lastMatrix = new THREE.Matrix4();
    this.transform = new Float32Array(7);

    this.avatarBinding = {
      position: this.position,
      quaternion: this.quaternion,
    };

    this.actionInterpolants = {
      crouch: new BiActionInterpolant(() => this.hasAction('crouch'), 0, crouchMaxTime),
      activate: new UniActionInterpolant(() => this.hasAction('activate'), 0, activateMaxTime),
      use: new InfiniteActionInterpolant(() => this.hasAction('use'), 0),
      pickUp: new InfiniteActionInterpolant(() => this.hasAction('pickUp'), 0),
      unuse: new InfiniteActionInterpolant(() => !this.hasAction('use'), 0),
      aim: new InfiniteActionInterpolant(() => this.hasAction('aim'), 0),
      aimRightTransition: new BiActionInterpolant(() => this.hasAction('aim') && this.hands[0].enabled, 0, aimTransitionMaxTime),
      aimLeftTransition: new BiActionInterpolant(() => this.hasAction('aim') && this.hands[1].enabled, 0, aimTransitionMaxTime),
      narutoRun: new InfiniteActionInterpolant(() => this.hasAction('narutoRun'), 0),
      fly: new InfiniteActionInterpolant(() => this.hasAction('fly'), 0),
      jump: new InfiniteActionInterpolant(() => this.hasAction('jump'), 0),
      dance: new BiActionInterpolant(() => this.hasAction('dance'), 0, crouchMaxTime),
      emote: new BiActionInterpolant(() => this.hasAction('emote'), 0, crouchMaxTime),
      // throw: new UniActionInterpolant(() => this.hasAction('throw'), 0, throwMaxTime),
      // chargeJump: new InfiniteActionInterpolant(() => this.hasAction('chargeJump'), 0),
      // standCharge: new InfiniteActionInterpolant(() => this.hasAction('standCharge'), 0),
      // fallLoop: new InfiniteActionInterpolant(() => this.hasAction('fallLoop'), 0),
      // swordSideSlash: new InfiniteActionInterpolant(() => this.hasAction('swordSideSlash'), 0),
      // swordTopDownSlash: new InfiniteActionInterpolant(() => this.hasAction('swordTopDownSlash'), 0),
      hurt: new InfiniteActionInterpolant(() => this.hasAction('hurt'), 0),
    };
    this.actionInterpolantsArray = Object.keys(this.actionInterpolants).map(
      k => this.actionInterpolants[k],
    );
  }

  // Initialization
  // Must be called before the player can interact with the world
  init(state) {
    this.bindState(state.getArray(playersMapName));
    if (!this.avatar) {
      this.setPlayerSpec(defaultPlayerSpec);
    }
  }

  setMicMediaStream(mediaStream) {
    if (!this.avatar) { return console.warn("Can't set mic media stream, no avatar"); }
    if (this.microphoneMediaStream) {
      this.microphoneMediaStream.disconnect();
      this.microphoneMediaStream = null;
    }
    if (mediaStream) {
      this.avatar.setAudioEnabled(true, this);
      const audioContext = Avatar.getAudioContext();
      const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

      mediaStreamSource.connect(this.avatar.getMicrophoneInput(true));

      this.microphoneMediaStream = mediaStreamSource;
    }
  }

  // Avatar Handling
  async setPlayerSpec(playerSpec) {
    await this.setAvatarUrl(playerSpec.avatarUrl);
    overrides.userVoiceEndpoint.set(playerSpec.voice);
    overrides.userVoicePack.set(playerSpec.voicePack);
  }

  async setAvatarUrl(u) {
    const avatarApp = await this.appManager.addTrackedApp(u);
    this.setAvatarAppInternal(avatarApp);
  }

  getAvatarApp() {
    const avatar = this.getAvatarState();
    const instanceId = avatar.get('instanceId');
    return this.appManager.getAppByInstanceId(instanceId);
  }

  async setAvatarApp(app) {
    if (!this.isLocalPlayer) return console.warn('Calling setAvatarApp for remote player');
    world.appManager.transplantApp(app, this.appManager);
    this.setAvatarAppInternal(app);
  }

  setAvatarAppInternal(app) {
    if (!app) return console.error('app is ', app);
    const self = this;
    const avatar = self.getAvatarState();
    const oldInstanceId = avatar.get('instanceId');
    this.playersArray.doc.transact(function tx() {
      if (oldInstanceId) {
        self.appManager.removeTrackedAppInternal(oldInstanceId);
      }

      if (app.instanceId && oldInstanceId !== app.instanceId) {
        avatar.set('instanceId', app.instanceId ?? '');
      } else {
        console.warn('Trying to set avatar app to same instanceId as before');
      }
    });
  }

  // Action handling

  getSession() {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    return session;
  }

  grab(app, hand = 'left') {
    const handString = hand === 'left' ? 'leftHand' : 'rightHand';
    const {position, quaternion} = this.getSession() ? this[handString] : camera;

    app.updateMatrixWorld();
    app.savedRotation = app.rotation.clone();
    app.startQuaternion = quaternion.clone();

    const grabAction = {
      type: 'grab',
      hand,
      instanceId: app.instanceId,
      matrix: localMatrix
        .copy(app.matrixWorld)
        .premultiply(
          localMatrix2
            .compose(position, quaternion, localVector.set(1, 1, 1))
            .invert(),
        )
        .toArray(),
    };
    this.addAction(grabAction);

    // Disable physics while grabbing the object
    const physicsObjects = app.getPhysicsObjects();
    for (const physicsObject of physicsObjects) {
      // physx.physxWorker.disableGeometryPhysics(physx.physics, physicsObject.physicsId);
      physx.physxWorker.disableGeometryQueriesPhysics(
        physx.physics,
        physicsObject.physicsId,
      );
    }
  }

  ungrab() {
    const actions = Array.from(this.getActionsState());
    let removeOffset = 0;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.type === 'grab') {
        const app = metaversefile.getAppByInstanceId(action.instanceId);

        // Enable physics while letting go of the object
        const physicsObjects = app.getPhysicsObjects();
        for (const physicsObject of physicsObjects) {
          physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
          // physx.physxWorker.enableGeometryPhysics(physx.physics, physicsObject.physicsId);
          // Todo: need to sync the physicsObject transform to its parent
          // physicsObject.updateMatrixWorld()
        }
        this.removeActionIndex(i + removeOffset);
        removeOffset -= 1;
      }
    }
  }

  getCrouchFactor() {
    return 1 - 0.4 * this.actionInterpolants.crouch.getNormalized();
  }

  // Update
  // Called in the main loop in webaverse.js
  update(timestamp, timeDiff, frame) {
    if (!this.avatar) return console.warn('Not updating local player, no avatar');
    if (!this.playersArray) return console.warn('Not updating local player, not inited');
    const session = this.getSession();
    const mirrors = metaversefile.getMirrors();
    applyPlayerToAvatar(this, session, this.avatar, mirrors);

    for (const actionInterpolant of this.actionInterpolantsArray) {
      actionInterpolant.update(timestamp, timeDiff);
    }

    const timeDiffS = timeDiff / 1000;

    this.characterSfx.update(timestamp, timeDiffS);
    this.characterFx.update(timestamp, timeDiffS);
    this.characterHitter.update(timestamp, timeDiffS);
    this.characterBehavior.update(timestamp, timeDiffS);

    this.avatar.update(timestamp, timeDiff);
    this.appManager.update(timeDiff);

    const _pushPlayerUpdates = () => {
      if (this.lastMatrix.equals(this.matrixWorld)) return;
      this.lastMatrix.copy(this.matrixWorld);

      this.position.toArray(this.transform);
      this.quaternion.toArray(this.transform, 3);

      this.playerMap.set('transform', this.transform);
    };

    _pushPlayerUpdates();
  }

  updatePhysics(timestamp, timeDiff) {
    const timeDiffS = timeDiff / 1000;
    this.characterPhysics.update(timestamp, timeDiffS);
  }
}

// Remote networked player
// Any player simulated on another machine that is not this client
// Created by the players manager class
class RemotePlayer extends NetworkPlayer {
  constructor(opts) {
    super(opts);
    this.bindState(opts.playersArray);

    this.audioWorkletNode = null;
    this.audioWorkerLoaded = false;

    const _setupInterpolation = () => {
      this.positionInterpolant = new PositionInterpolant(
        () => this.getPosition(),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      );
      this.quaternionInterpolant = new QuaternionInterpolant(
        () => this.getQuaternion(),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      );

      this.actionBinaryInterpolants = {
        crouch: new BinaryInterpolant(() => this.hasAction('crouch'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        activate: new BinaryInterpolant(() => this.hasAction('activate'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        use: new BinaryInterpolant(() => this.hasAction('use'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        pickUp: new BinaryInterpolant(() => this.hasAction('pickUp'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        aim: new BinaryInterpolant(() => this.hasAction('aim'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        narutoRun: new BinaryInterpolant(() => this.hasAction('narutoRun'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        fly: new BinaryInterpolant(() => this.hasAction('fly'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        jump: new BinaryInterpolant(() => this.hasAction('jump'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        dance: new BinaryInterpolant(() => this.hasAction('dance'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        emote: new BinaryInterpolant(() => this.hasAction('emote'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        // throw: new BinaryInterpolant(() => this.hasAction('throw'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        // chargeJump: new BinaryInterpolant(() => this.hasAction('chargeJump'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        // standCharge: new BinaryInterpolant(() => this.hasAction('standCharge'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        // fallLoop: new BinaryInterpolant(() => this.hasAction('fallLoop'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        // swordSideSlash: new BinaryInterpolant(() => this.hasAction('swordSideSlash'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        // swordTopDownSlash: new BinaryInterpolant(() => this.hasAction('swordTopDownSlash'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
        hurt: new BinaryInterpolant(
          () => this.hasAction('hurt'),
          avatarInterpolationTimeDelay,
          avatarInterpolationNumFrames,
        ),
      };
      this.actionBinaryInterpolantsArray = Object.keys(this.actionBinaryInterpolants).map(k => this.actionBinaryInterpolants[k]);
      this.actionInterpolants = {
        crouch: new BiActionInterpolant(() => this.actionBinaryInterpolants.crouch.get(), 0, crouchMaxTime),
        activate: new UniActionInterpolant(() => this.actionBinaryInterpolants.activate.get(), 0, activateMaxTime),
        use: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.use.get(), 0),
        pickUp: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.pickUp.get(), 0),
        unuse: new InfiniteActionInterpolant(() => !this.actionBinaryInterpolants.use.get(), 0),
        aim: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.aim.get(), 0),
        aimRightTransition: new BiActionInterpolant(() => this.hasAction('aim') && this.hands[0].enabled, 0, aimTransitionMaxTime),
        aimLeftTransition: new BiActionInterpolant(() => this.hasAction('aim') && this.hands[1].enabled, 0, aimTransitionMaxTime),
        narutoRun: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.narutoRun.get(), 0),
        fly: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.fly.get(), 0),
        jump: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.jump.get(), 0),
        dance: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.dance.get(), 0),
        emote: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.emote.get(), 0),
        // throw: new UniActionInterpolant(() => this.actionBinaryInterpolants.throw.get(), 0, throwMaxTime),
        // chargeJump: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.chargeJump.get(), 0),
        // standCharge: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.standCharge.get(), 0),
        // fallLoop: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.fallLoop.get(), 0),
        // swordSideSlash: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.swordSideSlash.get(), 0),
        // swordTopDownSlash: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.swordTopDownSlash.get(), 0),
        hurt: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.hurt.get(), 0),
      };

      this.actionInterpolantsArray = Object.keys(this.actionInterpolants).map(k => this.actionInterpolants[k]);
    };
    _setupInterpolation();

    this.avatarBinding = {
      position: this.positionInterpolant.get(),
      quaternion: this.quaternionInterpolant.get(),
    };

    const _syncPlayer = async () => {
      // Get all tracked apps from player's apps array and bind them
      for (let i = 0; i < this.appManager.appsArray.length; i++) {
        const trackedApp = this.appManager.appsArray.get(i, Z.Map);
        const app = await this.appManager.importTrackedApp(trackedApp);

        this.appManager.bindTrackedApp(trackedApp, app);
        // If the app can be worn, wear it
        if (app.getComponent('wear')) {
          this.wear(app);
        }
      }

      // Set the player's position
      const transform = this.playerMap.get('transform');
      if (!transform) throw new Error('Player has no transform');
      this.position.fromArray(transform, 0);
      this.quaternion.fromArray(transform, 3);

      // Sync the current actions on the player
      const actions = Array.from(this.getActionsState());
      for (const action of actions) {
        this.dispatchEvent({
          type: 'actionadd',
          action,
        });
      }

      this.syncAvatar();
    };
    _syncPlayer();
  }

  // Audio handling
  // Audio worker handles hups, voice endpoint and voice from remote players
  async prepareAudioWorker() {
    if (!this.audioWorkerLoaded) {
      this.audioWorkerLoaded = true;

      await ensureAudioContext();
      const audioContext = getAudioContext();

      this.audioWorkletNode = new AudioWorkletNode(audioContext, 'ws-output-worklet');

      this.audioDecoder = new WsAudioDecoder({
        output: data => {
          const buffer = getAudioDataBuffer(data);
          this.audioWorkletNode.port.postMessage(buffer, [buffer.buffer]);
        },
      });

      if (!this.avatar.isAudioEnabled()) {
        this.avatar.setAudioEnabled(true);
      }

      this.audioWorkletNode.connect(this.avatar.getAudioInput());
    }
  }

  // This is called by WSRTC (in world.js) when it receives new packets for this player
  processAudioData(data) {
    this.prepareAudioWorker();
    if (this.audioWorkerLoaded) {
      this.audioDecoder.decode(data.data);
    }
  }

  // Called every frame by the main loop in webaverse.js
  update(timestamp, timeDiff) {
    if (!this.avatar) throw new Error("Can't update remote player, avatar is null");

    const _updateInterpolation = () => {
      this.positionInterpolant.update(timeDiff);
      this.quaternionInterpolant.update(timeDiff);

      for (const actionBinaryInterpolant of this.actionBinaryInterpolantsArray) {
        actionBinaryInterpolant.update(timeDiff);
      }
      for (const actionInterpolant of this.actionInterpolantsArray) {
        actionInterpolant.update(timeDiff);
      }
    };

    _updateInterpolation();

    const mirrors = metaversefile.getMirrors();
    applyPlayerToAvatar(this, null, this.avatar, mirrors);

    const timeDiffS = timeDiff / 1000;
    this.characterSfx.update(timestamp, timeDiffS);
    this.characterFx.update(timestamp, timeDiffS);
    this.characterHitter.update(timestamp, timeDiffS);
    this.characterBehavior.update(timestamp, timeDiffS);

    this.avatar.update(timestamp, timeDiff);
  }
}

export {
  LocalPlayer,
  RemotePlayer,
};
