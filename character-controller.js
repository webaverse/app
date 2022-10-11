/*
this file is responisible for maintaining player state that is network-replicated.
*/
import {murmurhash3} from './procgen/murmurhash3.js';
import {WsAudioDecoder} from 'wsrtc/ws-codec.js';
import {ensureAudioContext, getAudioContext} from 'wsrtc/ws-audio-context.js';
import {getAudioDataBuffer} from 'wsrtc/ws-util.js';

import * as THREE from 'three';
import * as Z from 'zjs';
import {getRenderer, scene, camera} from './renderer.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
// import cameraManager from './camera-manager.js';
// import physx from './physx.js';
import audioManager from './audio-manager.js';
import metaversefile from 'metaversefile';
import {
  actionsMapName,
  appsMapName,
  playersMapName,
  crouchMaxTime,
  activateMaxTime,
  // useMaxTime,
  aimTransitionMaxTime,
  // avatarInterpolationFrameRate,
  avatarInterpolationTimeDelay,
  avatarInterpolationNumFrames,
  // groundFriction,
  // defaultVoicePackName,
  voiceEndpointBaseUrl,
  numLoadoutSlots,
} from './constants.js';
import {AppManager} from './app-manager.js';
import {CharacterPhysics} from './character-physics.js';
import {CharacterHups} from './character-hups.js';
import {CharacterHitter} from './character-hitter.js';
import {AvatarCharacterSfx} from './character-sfx.js';
import {AvatarCharacterFace} from './character-face.js';
import {AvatarCharacterFx} from './character-fx.js';
import {VoicePack, VoicePackVoicer} from './voice-output/voice-pack-voicer.js';
import {
  VoiceEndpoint,
  VoiceEndpointVoicer,
} from './voice-output/voice-endpoint-voicer.js';
import {
  BinaryInterpolant,
  BiActionInterpolant,
  UniActionInterpolant,
  InfiniteActionInterpolant,
  PositionInterpolant,
  QuaternionInterpolant,
} from './interpolants.js';
import {applyCharacterToAvatar, switchAvatar} from './player-avatar-binding.js';
import {defaultPlayerName, defaultPlayerBio} from './ai/lore/lore-model.js';
// import * as sounds from './sounds.js';
import musicManager from './music-manager.js';
import {makeId, clone} from './util.js';
import overrides from './overrides.js';
// import * as voices from './voices.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
// const localQuaternion2 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localArray3 = [0, 0, 0];
const localArray4 = [0, 0, 0, 0];

const zeroVector = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);

const _getSession = () => {
  const renderer = getRenderer();
  const session = renderer.xr.getSession();
  return session;
};

const physicsScene = physicsManager.getScene();

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

  const physicsObject = physicsScene.addCapsuleGeometry(
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
  physicsScene.setGravityEnabled(physicsObject, false);
  physicsScene.setLinearLockFlags(physicsObject.physicsId, false, false, false);
  physicsScene.setAngularLockFlags(physicsObject.physicsId, false, false, false);
  this.physicsObject = physicsObject;
} */

class AvatarHand extends THREE.Object3D {
  constructor() {
    super();

    this.pointer = 0;
    this.grab = 0;
    this.enabled = false;
  }
}
class Character extends THREE.Object3D {
  constructor() {
    super();

    this.name = defaultPlayerName;
    this.bio = defaultPlayerBio;

    this.characterPhysics = new CharacterPhysics(this);

    this.characterHups = new CharacterHups(this);
    this.characterHitter = new CharacterHitter(this);

    this.detached = false;

    this.appManager = new AppManager({
      appsMap: null,
    });
    this.appManager.addEventListener('appadd', e => {
      if (!this.detached) {
        const app = e.data;
        scene.add(app);
      }
    });
    this.appManager.addEventListener('appremove', e => {
      if (!this.detached) {
        const app = e.data;
        app.parent && app.parent.remove(app);
      }
    });

    this.headTarget = new THREE.Vector3();
    this.headTargetInverted = false;
    this.headTargetEnabled = false;

    this.eyeballTarget = new THREE.Vector3();
    this.eyeballTargetEnabled = false;

    this.voicePack = null;
    this.voiceEndpoint = null;
  }

  setSpawnPoint(position, quaternion) {
    this.position.copy(position);
    this.quaternion.copy(quaternion);

    if (this.characterPhysics.characterController) {
      this.characterPhysics.setPosition(position);
    }
  }

  // serializers
  getPosition() {
    return this.position.toArray(localArray3) ?? [0, 0, 0];
  }

  getQuaternion() {
    return this.quaternion.toArray(localArray4) ?? [0, 0, 0, 1];
  }

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

  async setVoicePack({audioUrl, indexUrl}) {
    const self = this;
    // this.playersArray.doc.transact(function tx() {
    const voiceSpec = JSON.stringify({
      audioUrl,
      indexUrl,
      endpointUrl: self.voiceEndpoint ? self.voiceEndpoint.url : '',
    });
    self.playerMap.set('voiceSpec', voiceSpec);
    // });
    await this.loadVoicePack({audioUrl, indexUrl});
  }

  async loadVoicePack({audioUrl, indexUrl}) {
    this.voicePack = await VoicePack.load({
      audioUrl,
      indexUrl,
    });
    this.updateVoicer();
  }

  setVoiceEndpoint(voiceId) {
    if (!voiceId) throw new Error('voice Id is null');
    const self = this;
    const url = `${voiceEndpointBaseUrl}?voice=${encodeURIComponent(voiceId)}`;
    this.playersArray.doc.transact(function tx() {
      let oldVoiceSpec = self.playerMap.get('voiceSpec');
      if (oldVoiceSpec) {
        oldVoiceSpec = JSON.parse(oldVoiceSpec);
        const voiceSpec = JSON.stringify({
          audioUrl: oldVoiceSpec.audioUrl,
          indexUrl: oldVoiceSpec.indexUrl,
          endpointUrl: url,
        });
        self.playerMap.set('voiceSpec', voiceSpec);
      } else {
        const voiceSpec = JSON.stringify({
          audioUrl: self.voicePack?.audioUrl,
          indexUrl: self.voicePack?.indexUrl,
          endpointUrl: url,
        });
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
    return await Character.fetchThemeSong(npcThemeSongUrl);
  }

  static async fetchThemeSong(npcThemeSongUrl) {
    if (npcThemeSongUrl) {
      return await musicManager.fetchMusic(npcThemeSongUrl);
    } else {
      return null;
    }
  }

  getCrouchFactor() {
    return 1 - 0.4 * this.actionInterpolants.crouch.getNormalized();
    /* let factor = 1;
    factor *= 1 - 0.4 * this.actionInterpolants.crouch.getNormalized();
    return factor; */
  }

  wear(app, {loadoutIndex = -1} = {}) {
    const _getNextLoadoutIndex = () => {
      let loadoutIndex = -1;
      const usedIndexes = Array(8).fill(false);
      for (const action of this.getActionsState()) {
        if (action.type === 'wear') {
          usedIndexes[action.loadoutIndex] = true;
        }
      }
      for (let i = 0; i < usedIndexes.length; i++) {
        if (!usedIndexes[i]) {
          loadoutIndex = i;
          break;
        }
      }
      return loadoutIndex;
    };
    if (loadoutIndex === -1) {
      loadoutIndex = _getNextLoadoutIndex();
    }

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
          // console.warn('need to transplant unowned app', app, world.appManager, this.appManager);
          // debugger;
        }
      };
      _transplantNewApp();

      const _disableAppPhysics = () => {
        // don't disable physics if the app is a pet
        if (!app.hasComponent('pet')) {
          const physicsObjects = app.getPhysicsObjects();
          for (const physicsObject of physicsObjects) {
            physicsScene.disableGeometryQueries(physicsObject);
            physicsScene.disableGeometry(physicsObject);
          }
        }
      };
      _disableAppPhysics();

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

      const _emitEvents = () => {
        app.dispatchEvent({
          type: 'wearupdate',
          player: this,
          wear: true,
          loadoutIndex,
          holdAnimation,
        });
        this.dispatchEvent({
          type: 'wearupdate',
          app,
          wear: true,
          loadoutIndex,
          holdAnimation,
        });
      };
      _emitEvents();
    }
  }

  unwear(
    app,
    {destroy = false, dropStartPosition = null, dropDirection = null} = {},
  ) {
    const wearActionIndex = this.findActionIndex(({type, instanceId}) => {
      return type === 'wear' && instanceId === app.instanceId;
    });
    if (wearActionIndex !== -1) {
      const wearAction = this.getActionsState().get(wearActionIndex);
      const loadoutIndex = wearAction.loadoutIndex;

      const _setAppTransform = () => {
        if (dropStartPosition && dropDirection) {
          const physicsObjects = app.getPhysicsObjects();
          if (physicsObjects.length > 0) {
            const physicsObject = physicsObjects[0];

            physicsObject.position.copy(dropStartPosition);
            physicsObject.quaternion.copy(this.quaternion);
            physicsObject.updateMatrixWorld();

            physicsScene.setTransform(physicsObject, true);
            physicsScene.setVelocity(
              physicsObject,
              localVector
                .copy(dropDirection)
                .multiplyScalar(5) /* .add(this.characterPhysics.velocity) */,
              true,
            );
            physicsScene.setAngularVelocity(physicsObject, zeroVector, true);

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
                localVector2
                  .set(dropDirection.x, 0, dropDirection.z)
                  .normalize(),
                upVector,
              ),
            );
            app.scale.set(1, 1, 1);
            app.updateMatrixWorld();
          }
          app.lastMatrix.copy(app.matrixWorld);
        } else {
          const avatarHeight = this.avatar ? this.avatar.height : 0;
          app.position
            .copy(this.position)
            .add(
              localVector
                .set(0, -avatarHeight + 0.5, -0.5)
                .applyQuaternion(this.quaternion),
            );
          app.quaternion.identity();
          app.scale.set(1, 1, 1);
          app.updateMatrixWorld();
        }
      };
      if (!app.getComponent('sit') && !app.getComponent('pet')) {
        _setAppTransform();
      }

      const _enableAppPhysics = () => {
        if (!app.hasComponent('pet')) {
          const physicsObjects = app.getPhysicsObjects();
          for (const physicsObject of physicsObjects) {
            physicsScene.enableGeometryQueries(physicsObject);
            physicsScene.enableGeometry(physicsObject);
          }
        }
      };
      _enableAppPhysics();

      const _removeApp = () => {
        this.removeActionIndex(wearActionIndex);

        if (this.appManager.hasTrackedApp(app.instanceId)) {
          if (destroy) {
            this.appManager.removeApp(app);
            app.destroy();
          } else {
            this.appManager.transplantApp(app, world.appManager);
          }
        } else {
          // console.warn('need to transplant unowned app', app, this.appManager, world.appManager);
          // debugger;
        }
      };
      _removeApp();

      const _emitEvents = () => {
        app.dispatchEvent({
          type: 'wearupdate',
          player: this,
          wear: false,
          loadoutIndex,
        });
        this.dispatchEvent({
          type: 'wearupdate',
          app,
          wear: false,
          loadoutIndex,
        });
      };
      _emitEvents();
    }
  }

  setTarget(target) {
    // set both head and eyeball target;
    if (target) {
      this.headTarget.copy(target);
      this.headTargetInverted = true;
      this.headTargetEnabled = true;

      this.eyeballTarget.copy(target);
      this.eyeballTargetEnabled = true;
    } else {
      this.headTargetEnabled = false;
      this.eyeballTargetEnabled = false;
    }
  }

  destroy() {
    this.characterHups.destroy();
  }
}

const controlActionTypes = [
  'jump',
  'fallLoop',
  'land',
  'crouch',
  'fly',
  'sit',
  'swim',
];
class StateCharacter extends Character {
  constructor({
    playerId = makeId(5),
    playersArray = new Z.Doc().getArray(playersMapName),
  } = {}) {
    super();

    this.playerId = playerId;
    this.playerIdInt = murmurhash3(playerId);
    this.playersArray = null;
    this.playerMap = null;
    this.microphoneMediaStream = null;

    this.avatarEpoch = 0;
    this.syncAvatarCancelFn = null;
    this.unbindFns = [];

    this.transform = new Float32Array(7);
    this.bindState(playersArray);
  }

  isBound() {
    return !!this.playersArray;
  }

  unbindState() {
    if (this.isBound()) {
      this.playersArray = null;
      this.playerMap = null;
    }
  }

  detachState() {
    throw new Error('called abstract method');
  }

  attachState(oldState) {
    throw new Error('called abstract method');
  }

  bindCommonObservers() {
    const actions = this.getActionsState();
    let lastActions = actions.toJSON();
    const observeActionsFn = () => {
      const nextActions = Array.from(this.getActionsState());
      for (const nextAction of nextActions) {
        if (
          !lastActions.some(
            lastAction => lastAction.actionId === nextAction.actionId,
          )
        ) {
          this.dispatchEvent({
            type: 'actionadd',
            action: nextAction,
          });
          // console.log('add action', nextAction);
        }
      }
      for (const lastAction of lastActions) {
        if (
          !nextActions.some(
            nextAction => nextAction.actionId === lastAction.actionId,
          )
        ) {
          this.dispatchEvent({
            type: 'actionremove',
            action: lastAction,
          });
          // console.log('remove action', lastAction);
        }
      }
      // console.log('actions changed');
      lastActions = nextActions;
    };
    actions.observe(observeActionsFn);
    this.unbindFns.push(actions.unobserve.bind(actions, observeActionsFn));
  }

  unbindCommonObservers() {
    for (const unbindFn of this.unbindFns) {
      unbindFn();
    }
    this.unbindFns.length = 0;
  }

  bindState(nextPlayersArray) {
    // latch old state
    const oldState = this.detachState();

    // unbind
    this.unbindState();
    this.appManager.unbindState();
    this.unbindCommonObservers();

    // note: leave the old state as is. it is the host's responsibility to garbage collect us when we disconnect.

    // blindly add to new state
    this.playersArray = nextPlayersArray;
    this.attachState(oldState);
    this.bindCommonObservers();
  }

  getAvatarInstanceId() {
    return this.playerMap.get('avatar');
  }

  getActionsByType(type) {
    const actions = this.getActionsState();
    const typedActions = Array.from(actions).filter(
      action => action.type === type,
    );
    return typedActions;
  }

  getActions() {
    return this.getActionsState();
  }

  getActionsState() {
    let actionsArray = this.playerMap.has(actionsMapName)
      ? this.playerMap.get(actionsMapName, Z.Array)
      : null;
    if (!actionsArray) {
      actionsArray = new Z.Array();
      this.playerMap.set(actionsMapName, actionsArray);
    }
    return actionsArray;
  }

  getActionsArray() {
    return this.isBound() ? Array.from(this.getActionsState()) : [];
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
    return this.isBound() ? Array.from(this.getAppsState()) : [];
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
    actions.push([action]);
  }

  new() {
    const self = this;
    this.playersArray.doc.transact(function tx() {
      const actions = self.getActionsState();
      while (actions.length > 0) {
        actions.delete(actions.length - 1);
      }

      this.playerMap.delete('avatar');

      const apps = self.getAppsState();
      while (apps.length > 0) {
        apps.delete(apps.length - 1);
      }
    });
  }

  save() {
    const actions = this.getActionsState();
    const apps = this.getAppsState();
    return JSON.stringify({
      // actions: actions.toJSON(),
      avatar: this.getAvatarInstanceId(),
      apps: apps.toJSON(),
    });
  }

  load(s) {
    const j = JSON.parse(s);
    // console.log('load', j);
    const self = this;
    this.playersArray.doc.transact(function tx() {
      const actions = self.getActionsState();
      while (actions.length > 0) {
        actions.delete(actions.length - 1);
      }

      const avatar = self.getAvatarInstanceId();
      if (avatar) {
        this.playerMap.set('avatar', avatar);
      }

      const apps = self.getAppsState();
      if (Array.isArray(j?.apps)) {
        for (const app of j.apps) {
          apps.push([app]);
        }
      }
    });
  }

  destroy() {
    this.unbindState();
    this.appManager.unbindState();

    this.appManager.destroy();

    super.destroy();
  }
}

class AvatarCharacter extends StateCharacter {
  constructor(opts) {
    super(opts);

    this.avatar = null;
    this.controlMode = '';

    this.avatarFace = new AvatarCharacterFace(this);
    this.avatarCharacterFx = new AvatarCharacterFx(this);
    this.avatarCharacterSfx = new AvatarCharacterSfx(this);

    this.leftHand = new AvatarHand();
    this.rightHand = new AvatarHand();
    this.hands = [this.leftHand, this.rightHand];
  }

  getControlMode() {
    return this.controlMode;
  }

  setControlMode(mode) {
    this.controlMode = mode;
  }

  setSpawnPoint(position, quaternion) {
    super.setSpawnPoint(position, quaternion);

    camera.position.copy(position);
    camera.quaternion.copy(quaternion);
    camera.updateMatrixWorld();
  }

  updatePhysicsStatus() {
    if (this.getControlMode() === 'controlled') {
      physicsScene.disableGeometryQueries(
        this.characterPhysics.characterController,
      );
    } else {
      physicsScene.enableGeometryQueries(
        this.characterPhysics.characterController,
      );
    }
  }

  async syncAvatar() {
    if (this.syncAvatarCancelFn) {
      this.syncAvatarCancelFn.cancel();
      this.syncAvatarCancelFn = null;
    }
    const cancelFn = makeCancelFn();
    this.syncAvatarCancelFn = cancelFn;
    const instanceId = this.getAvatarInstanceId();

    // remove last app
    if (this.avatar) {
      const oldPeerOwnerAppManager = this.appManager.getPeerOwnerAppManager(
        this.avatar.app.instanceId,
      );
      if (oldPeerOwnerAppManager) {
        // console.log('transplant last app');
        this.appManager.transplantApp(this.avatar.app, oldPeerOwnerAppManager);
      } else {
        // console.log('remove last app', this.avatar.app);
        // this.appManager.removeTrackedApp(this.avatar.app.instanceId);
      }
    }

    const _setNextAvatarApp = app => {
      (() => {
        const avatar = switchAvatar(this.avatar, app);
        if (!cancelFn.isLive()) return;
        this.avatar = avatar;

        this.dispatchEvent({
          type: 'avatarchange',
          app,
          avatar,
        });

        const activate = () => {
          this.dispatchEvent({
            type: 'activate',
          });
        };
        app.addEventListener('activate', activate);
        this.addEventListener('avatarchange', () => {
          app.removeEventListener('activate', activate);
        });

        this.characterPhysics.loadCharacterController(
          this.avatar.shoulderWidth,
          this.avatar.height,
        );

        this.updatePhysicsStatus();
        app.addPhysicsObject(this.characterPhysics.characterController);
      })();

      this.dispatchEvent({
        type: 'avatarupdate',
        app,
      });
    };

    if (instanceId) {
      // add next app from player app manager
      const nextAvatarApp = this.appManager.getAppByInstanceId(instanceId);
      // console.log('add next avatar local', nextAvatarApp);
      if (nextAvatarApp) {
        _setNextAvatarApp(nextAvatarApp);
      } else {
        // add next app from world app manager
        const nextAvatarApp = world.appManager.getAppByInstanceId(instanceId);
        // console.log('add next avatar world', nextAvatarApp);
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
            console.warn(
              'switching avatar to instanceId that does not exist in any app manager',
              instanceId,
            );
          }
        }
      }
    }

    this.syncAvatarCancelFn = null;
  }

  destroy() {
    this.avatarFace.destroy();
    this.avatarCharacterSfx.destroy();
    this.avatarCharacterFx.destroy();

    super.destroy();
  }
}

class InterpolatedPlayer extends AvatarCharacter {
  constructor(opts) {
    super(opts);
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
      crouch: new BinaryInterpolant(
        () => this.hasAction('crouch'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      activate: new BinaryInterpolant(
        () => this.hasAction('activate'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      use: new BinaryInterpolant(
        () => this.hasAction('use'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      pickUp: new BinaryInterpolant(
        () => this.hasAction('pickUp'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      aim: new BinaryInterpolant(
        () => this.hasAction('aim'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      narutoRun: new BinaryInterpolant(
        () => this.hasAction('narutoRun'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      fly: new BinaryInterpolant(
        () => this.hasAction('fly'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      jump: new BinaryInterpolant(
        () => this.hasAction('jump'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      doubleJump: new BinaryInterpolant(
        () => this.hasAction('doubleJump'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      land: new BinaryInterpolant(
        () => this.hasAction('land'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      dance: new BinaryInterpolant(
        () => this.hasAction('dance'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      emote: new BinaryInterpolant(
        () => this.hasAction('emote'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      // throw: new BinaryInterpolant(() => this.hasAction('throw'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
      // chargeJump: new BinaryInterpolant(() => this.hasAction('chargeJump'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
      // standCharge: new BinaryInterpolant(() => this.hasAction('standCharge'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
      fallLoop: new BinaryInterpolant(
        () => this.hasAction('fallLoop'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
      // swordSideSlash: new BinaryInterpolant(() => this.hasAction('swordSideSlash'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
      // swordTopDownSlash: new BinaryInterpolant(() => this.hasAction('swordTopDownSlash'), avatarInterpolationTimeDelay, avatarInterpolationNumFrames),
      hurt: new BinaryInterpolant(
        () => this.hasAction('hurt'),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames,
      ),
    };
    this.actionBinaryInterpolantsArray = Object.keys(
      this.actionBinaryInterpolants,
    ).map(k => this.actionBinaryInterpolants[k]);
    this.actionInterpolants = {
      crouch: new BiActionInterpolant(
        () => this.actionBinaryInterpolants.crouch.get(),
        0,
        crouchMaxTime,
      ),
      activate: new UniActionInterpolant(
        () => this.actionBinaryInterpolants.activate.get(),
        0,
        activateMaxTime,
      ),
      use: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.use.get(),
        0,
      ),
      pickUp: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.pickUp.get(),
        0,
      ),
      unuse: new InfiniteActionInterpolant(
        () => !this.actionBinaryInterpolants.use.get(),
        0,
      ),
      aim: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.aim.get(),
        0,
      ),
      aimRightTransition: new BiActionInterpolant(
        () => this.hasAction('aim') && this.hands[0].enabled,
        0,
        aimTransitionMaxTime,
      ),
      aimLeftTransition: new BiActionInterpolant(
        () => this.hasAction('aim') && this.hands[1].enabled,
        0,
        aimTransitionMaxTime,
      ),
      narutoRun: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.narutoRun.get(),
        0,
      ),
      fly: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.fly.get(),
        0,
      ),
      jump: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.jump.get(),
        0,
      ),
      doubleJump: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.doubleJump.get(),
        0,
      ),
      land: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.land.get(),
        0,
      ),
      fallLoop: new InfiniteActionInterpolant(
        () => this.hasAction('fallLoop'),
        0,
      ),
      fallLoopTransition: new BiActionInterpolant(
        () => this.actionBinaryInterpolants.fallLoop.get(),
        0,
        300,
      ),
      dance: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.dance.get(),
        0,
      ),
      emote: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.emote.get(),
        0,
      ),
      // throw: new UniActionInterpolant(() => this.actionBinaryInterpolants.throw.get(), 0, throwMaxTime),
      // chargeJump: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.chargeJump.get(), 0),
      // standCharge: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.standCharge.get(), 0),
      // fallLoop: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.fallLoop.get(), 0),
      // swordSideSlash: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.swordSideSlash.get(), 0),
      // swordTopDownSlash: new InfiniteActionInterpolant(() => this.actionBinaryInterpolants.swordTopDownSlash.get(), 0),
      hurt: new InfiniteActionInterpolant(
        () => this.actionBinaryInterpolants.hurt.get(),
        0,
      ),
      movements: new InfiniteActionInterpolant(() => {
        const ioManager = metaversefile.useIoManager();
        return (
          ioManager.keys.up ||
          ioManager.keys.down ||
          ioManager.keys.left ||
          ioManager.keys.right
        );
      }, 0),
      movementsTransition: new BiActionInterpolant(
        () => {
          const ioManager = metaversefile.useIoManager();
          return (
            ioManager.keys.up ||
            ioManager.keys.down ||
            ioManager.keys.left ||
            ioManager.keys.right
          );
        },
        0,
        crouchMaxTime,
      ),
      sprint: new BiActionInterpolant(
        () => {
          const ioManager = metaversefile.useIoManager();
          return ioManager.keys.shift;
        },
        0,
        crouchMaxTime,
      ),
    };
    this.actionInterpolantsArray = Object.keys(this.actionInterpolants).map(
      k => this.actionInterpolants[k],
    );

    this.avatarBinding = {
      position: this.positionInterpolant.get(),
      quaternion: this.quaternionInterpolant.get(),
    };
  }

  /* update(timestamp, timeDiff) {
    if (!this.avatar) return; // avatar takes time to load, ignore until it does

    this.updateInterpolation(timeDiff);

    const mirrors = metaversefile.getMirrors();
    applyPlayerToAvatar(this, null, this.avatar, mirrors);

    const timeDiffS = timeDiff / 1000;
    this.characterSfx.update(timestamp, timeDiffS);
    this.characterFx.update(timestamp, timeDiffS);
    this.characterPhysics.update(timestamp, timeDiffS);
    this.characterHitter.update(timestamp, timeDiffS);
    this.avatarFace.update(timestamp, timeDiffS);

    this.avatar.update(timestamp, timeDiff);
  } */
  updateInterpolation(timeDiff) {
    this.positionInterpolant.update(timeDiff);
    this.quaternionInterpolant.update(timeDiff);
    for (const actionBinaryInterpolant of this.actionBinaryInterpolantsArray) {
      actionBinaryInterpolant.update(timeDiff);
    }
    for (const actionInterpolant of this.actionInterpolantsArray) {
      actionInterpolant.update(timeDiff);
    }
  }
}
class UninterpolatedPlayer extends AvatarCharacter {
  constructor(opts) {
    super(opts);

    UninterpolatedPlayer.init.apply(this, arguments);
  }

  static init() {
    this.actionInterpolants = {
      crouch: new BiActionInterpolant(
        () => this.hasAction('crouch'),
        0,
        crouchMaxTime,
      ),
      activate: new UniActionInterpolant(
        () => this.hasAction('activate'),
        0,
        activateMaxTime,
      ),
      use: new InfiniteActionInterpolant(() => this.hasAction('use'), 0),
      pickUp: new InfiniteActionInterpolant(() => this.hasAction('pickUp'), 0),
      unuse: new InfiniteActionInterpolant(() => !this.hasAction('use'), 0),
      aim: new InfiniteActionInterpolant(() => this.hasAction('aim'), 0),
      aimRightTransition: new BiActionInterpolant(
        () => this.hasAction('aim') && this.hands[0].enabled,
        0,
        aimTransitionMaxTime,
      ),
      aimLeftTransition: new BiActionInterpolant(
        () => this.hasAction('aim') && this.hands[1].enabled,
        0,
        aimTransitionMaxTime,
      ),
      narutoRun: new InfiniteActionInterpolant(
        () => this.hasAction('narutoRun'),
        0,
      ),
      fly: new InfiniteActionInterpolant(() => this.hasAction('fly'), 0),
      swim: new InfiniteActionInterpolant(() => this.hasAction('swim'), 0),
      jump: new InfiniteActionInterpolant(() => this.hasAction('jump'), 0),
      doubleJump: new InfiniteActionInterpolant(
        () => this.hasAction('doubleJump'),
        0,
      ),
      land: new InfiniteActionInterpolant(
        () =>
          !this.hasAction('jump') &&
          !this.hasAction('fallLoop') &&
          !this.hasAction('fly'),
        0,
      ),
      dance: new BiActionInterpolant(
        () => this.hasAction('dance'),
        0,
        crouchMaxTime,
      ),
      emote: new BiActionInterpolant(
        () => this.hasAction('emote'),
        0,
        crouchMaxTime,
      ),
      movements: new InfiniteActionInterpolant(() => {
        const ioManager = metaversefile.useIoManager();
        return (
          ioManager.keys.up ||
          ioManager.keys.down ||
          ioManager.keys.left ||
          ioManager.keys.right ||
          ioManager.keys.space ||
          ioManager.keys.ctrl
        );
      }, 0),
      movementsTransition: new BiActionInterpolant(
        () => {
          const ioManager = metaversefile.useIoManager();
          return (
            ioManager.keys.up ||
            ioManager.keys.down ||
            ioManager.keys.left ||
            ioManager.keys.right ||
            ioManager.keys.space ||
            ioManager.keys.ctrl
          );
        },
        0,
        crouchMaxTime,
      ),
      horizontalMovementsTransition: new BiActionInterpolant(
        () => {
          const ioManager = metaversefile.useIoManager();
          return (
            ioManager.keys.up ||
            ioManager.keys.down ||
            ioManager.keys.left ||
            ioManager.keys.right
          );
        },
        0,
        crouchMaxTime,
      ),
      sprint: new BiActionInterpolant(
        () => {
          const ioManager = metaversefile.useIoManager();
          return ioManager.keys.shift;
        },
        0,
        crouchMaxTime,
      ),
      // throw: new UniActionInterpolant(() => this.hasAction('throw'), 0, throwMaxTime),
      // chargeJump: new InfiniteActionInterpolant(() => this.hasAction('chargeJump'), 0),
      // standCharge: new InfiniteActionInterpolant(() => this.hasAction('standCharge'), 0),
      fallLoop: new InfiniteActionInterpolant(
        () => this.hasAction('fallLoop'),
        0,
      ),
      fallLoopTransition: new BiActionInterpolant(
        () => this.hasAction('fallLoop'),
        0,
        300,
      ),
      // swordSideSlash: new InfiniteActionInterpolant(() => this.hasAction('swordSideSlash'), 0),
      // swordTopDownSlash: new InfiniteActionInterpolant(() => this.hasAction('swordTopDownSlash'), 0),
      hurt: new InfiniteActionInterpolant(() => this.hasAction('hurt'), 0),
      cellphoneDraw: new BiActionInterpolant(
        () => this.hasAction('cellphoneDraw'),
        0,
        1000,
      ),
      cellphoneUndraw: new BiActionInterpolant(
        () => this.hasAction('cellphoneUndraw'),
        0,
        1000,
      ),
      swimUp: new BiActionInterpolant(
        () => {
          const ioManager = metaversefile.useIoManager();
          return ioManager.keys.space;
        },
        0,
        crouchMaxTime,
      ),
      swimDown: new BiActionInterpolant(
        () => {
          const ioManager = metaversefile.useIoManager();
          return ioManager.keys.ctrl;
        },
        0,
        crouchMaxTime,
      ),
      surface: new BiActionInterpolant(
        () => {
          return !this.avatar.swimmingOnSurfaceState;
        },
        0,
        crouchMaxTime,
      ),
    };
    this.actionInterpolantsArray = Object.keys(this.actionInterpolants).map(
      k => this.actionInterpolants[k],
    );

    this.avatarBinding = {
      position: this.position,
      quaternion: this.quaternion,
    };
  }

  updateInterpolation(timeDiff) {
    for (const actionInterpolant of this.actionInterpolantsArray) {
      actionInterpolant.update(timeDiff);
    }
  }
}
class LocalPlayer extends UninterpolatedPlayer {
  constructor(opts) {
    super(opts);

    if (opts.npc) {
      this.controlMode = 'npc';
    } else {
      this.controlMode = 'controlled';
    }
    this.detached = opts.detached ?? false;
  }

  async setPlayerSpec(playerSpec) {
    const p = this.loadAvatar(playerSpec.avatarUrl);

    overrides.userVoiceEndpoint.set(playerSpec.voice ?? null);
    overrides.userVoicePack.set(playerSpec.voicePack ?? null);

    await p;
  }

  getAvatarApp() {
    const instanceId = this.playerMap.get('avatar');
    return this.appManager.getAppByInstanceId(instanceId);
  }

  async loadAvatar(url, {components = []} = {}) {
    const localAvatarEpoch = ++this.avatarEpoch;
    const avatarApp = await this.appManager.addTrackedApp(
      url,
      localVector.set(0, 0, 0),
      localQuaternion.set(0, 0, 0, 1),
      localVector2.set(1, 1, 1),
      components,
    );
    // avatarApp.parent.remove(avatarApp);
    if (this.avatarEpoch !== localAvatarEpoch) {
      this.appManager.removeTrackedApp(avatarApp.instanceId);
      return;
    }
    this.#setAvatarAppFromOwnAppManager(avatarApp);
  }

  /* importAvatarApp(app, srcAppManager) {
    srcAppManager.transplantApp(app, this.appManager);
    this.#setAvatarAppFromOwnAppManager(app);
  } */
  #setAvatarAppFromOwnAppManager(app) {
    const self = this;
    this.playersArray.doc.transact(function tx() {
      const oldInstanceId = self.playerMap.get('avatar');
      if (app.instanceId) {
        self.playerMap.set('avatar', app.instanceId);
      } else {
        throw new Error('app.instanceId is invalid');
      }

      if (oldInstanceId) {
        self.appManager.removeTrackedAppInternal(oldInstanceId);
      }
      self.syncAvatar();
    });
  }

  setMicMediaStream(mediaStream) {
    if (this.microphoneMediaStream) {
      this.microphoneMediaStream.disconnect();
      this.microphoneMediaStream = null;
    }
    if (mediaStream) {
      this.avatar.setMicrophoneEnabled(true, this);
      const audioContext = audioManager.getAudioContext();
      const mediaStreamSource =
        audioContext.createMediaStreamSource(mediaStream);

      mediaStreamSource.connect(this.avatar.getMicrophoneInput(true));

      this.microphoneMediaStream = mediaStreamSource;
    }
  }

  detachState() {
    const oldActions = this.playersArray
      ? this.getActionsState()
      : new Z.Array();
    const oldAvatar = this.playersArray && this.getAvatarInstanceId();
    const oldApps = (
      this.playersArray ? this.getAppsState() : new Z.Array()
    ).toJSON();
    return {
      oldActions,
      oldAvatar,
      oldApps,
    };
  }

  attachState(oldState) {
    const {oldActions, oldAvatar, oldApps} = oldState;

    const self = this;
    this.playersArray.doc.transact(function tx() {
      self.playerMap = new Z.Map();

      self.playerMap.set('playerId', self.playerId);

      self.position.toArray(self.transform, 0);
      self.quaternion.toArray(self.transform, 3);
      self.playerMap.set('transform', self.transform);

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

      if (oldAvatar !== undefined && oldAvatar !== null && oldAvatar !== '') {
        self.playerMap.set('avatar', oldAvatar);
      }

      if (self.voiceEndpoint) {
        const voiceSpec = JSON.stringify({
          audioUrl: self.voiceEndpoint.audioUrl,
          indexUrl: self.voiceEndpoint.indexUrl,
          endpointUrl: self.voiceEndpoint ? self.voiceEndpoint.url : '',
        });
        self.playerMap.set('voiceSpec', voiceSpec);
      }
      self.playersArray.push([self.playerMap]);
      self.appManager.bindState(self.getAppsState());
    });
  }

  deletePlayerId(playerId) {
    const self = this;
    this.playersArray.doc.transact(function tx() {
      for (let i = 0; i < self.playersArray.length; i++) {
        const playerMap = self.playersArray.get(i, Z.Map);
        if (playerMap.get('playerId') === playerId) {
          self.playersArray.delete(i);
          break;
        }
      }
    });
  }

  grab(app, hand = 'left') {
    let position = null;
    let quaternion = null;

    if (_getSession()) {
      const h = this[hand === 'left' ? 'leftHand' : 'rightHand'];
      position = h.position;
      quaternion = h.quaternion;
    } else {
      position = this.position;
      quaternion = camera.quaternion;
    }

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

    physicsScene.disableAppPhysics(app);

    app.dispatchEvent({
      type: 'grabupdate',
      grab: true,
    });
  }

  ungrab() {
    const actions = Array.from(this.getActionsState());
    let removeOffset = 0;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.type === 'grab') {
        const app = metaversefile.getAppByInstanceId(action.instanceId);

        physicsScene.enableAppPhysics(app);

        this.removeActionIndex(i + removeOffset);
        removeOffset -= 1;

        app.dispatchEvent({
          type: 'grabupdate',
          grab: false,
        });
      }
    }
  }

  /* lookAt(p) {
    const cameraOffset = cameraManager.getCameraOffset();
    camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
    camera.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        camera.position,
        p,
        localVector2.set(0, 1, 0)
      )
    );
    camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
    camera.updateMatrixWorld();
  } */
  lastMatrix = new THREE.Matrix4();
  pushPlayerUpdates() {
    const self = this;
    this.playersArray.doc.transact(() => {
      if (!this.matrixWorld.equals(this.lastMatrix)) {
        self.position.toArray(self.transform);
        self.quaternion.toArray(self.transform, 3);
        self.playerMap.set('transform', self.transform);
        this.lastMatrix.copy(this.matrixWorld);
      }
    }, 'push');

    this.appManager.updatePhysics();
  }

  updatePhysics(timestamp, timeDiff) {
    if (this.avatar) {
      const timeDiffS = timeDiff / 1000;
      this.characterPhysics.update(timestamp, timeDiffS);
    }
  }

  updateAvatar(timestamp, timeDiff) {
    if (this.avatar) {
      const timeDiffS = timeDiff / 1000;
      this.avatarCharacterSfx.update(timestamp, timeDiffS);
      this.avatarCharacterFx.update(timestamp, timeDiffS);
      this.characterHitter.update(timestamp, timeDiffS);
      this.avatarFace.update(timestamp, timeDiffS);

      this.updateInterpolation(timeDiff);

      const session = _getSession();
      const mirrors = metaversefile.getMirrors();
      applyCharacterToAvatar(this, session, this.avatar, mirrors);

      this.avatar.update(timestamp, timeDiff);

      this.characterHups.update(timestamp);
    }
  }

  destroy() {
    super.destroy();
    this.characterPhysics.destroy();
  }
  /* teleportTo = (() => {
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localQuaternion = new THREE.Quaternion();
    const localMatrix = new THREE.Matrix4();
    return function(position, quaternion, {relation = 'floor'} = {}) {
      const renderer = getRenderer();
      const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;

      const avatarHeight = this.avatar ? this.avatar.height : 0;
      if (renderer.xr.getSession()) {
        localMatrix.copy(xrCamera.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector, localQuaternion, localVector2);

        dolly.matrix
          .premultiply(localMatrix.makeTranslation(position.x - localVector.x, position.y - localVector.y, position.z - localVector.z))
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector.x, localVector.y, localVector.z))
          .premultiply(localMatrix.makeTranslation(0, relation === 'floor' ? avatarHeight : 0, 0))
          .decompose(dolly.position, dolly.quaternion, dolly.scale);
        dolly.updateMatrixWorld();
      } else {
        camera.position.copy(position)
          .sub(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));
        camera.position.y += relation === 'floor' ? avatarHeight : 0;
        camera.quaternion.copy(quaternion);
        camera.updateMatrixWorld();
      }

      this.resetPhysics();
    };
  })() */
}
class RemotePlayer extends InterpolatedPlayer {
  constructor(opts) {
    super(opts);
    this.audioWorkletNode = null;
    this.audioWorkerLoaded = false;
    this.isRemotePlayer = true;
    this.lastPosition = new THREE.Vector3();
    this.controlMode = 'remote';
  }

  // The audio worker handles hups and incoming voices
  // This includes the microphone from the owner of this instance
  async prepareAudioWorker() {
    if (!this.audioWorkerLoaded) {
      this.audioWorkerLoaded = true;

      await ensureAudioContext();
      const audioContext = getAudioContext();

      this.audioWorkletNode = new AudioWorkletNode(
        audioContext,
        'ws-output-worklet',
      );

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
    if (this.audioWorkletNode) {
      this.audioDecoder.decode(data.data);
    }
  }

  detachState() {
    return null;
  }

  attachState(oldState) {
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
      throw new Error(
        'binding to nonexistent player object',
        this.playersArray.toJSON(),
      );
    }
    let lastTimestamp = performance.now();
    // let lastPosition = new THREE.Vector3();
    const observePlayerFn = e => {
      if (e.changes.keys.has('avatar')) {
        this.syncAvatar();
      }

      if (e.changes.keys.get('voiceSpec') || e.added?.keys?.get('voiceSpec')) {
        const voiceSpec = e.changes.keys.get('voiceSpec');
        const json = JSON.parse(voiceSpec.value);
        if (json.endpointUrl) {
          this.loadVoiceEndpoint(json.endpointUrl);
        }
        if (json.audioUrl && json.indexUrl) {
          this.loadVoicePack({
            audioUrl: json.audioUrl,
            indexUrl: json.indexUrl,
          });
        }
      }

      if (e.changes.keys.get('name')) {
        this.name = e.changes.keys.get('name').value;
      }

      if (e.changes.keys.has('transform')) {
        const transform = e.changes.keys.get('transform').value;
        const timestamp = performance.now();
        const timeDiff = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        this.position.fromArray(transform);
        this.quaternion.fromArray(transform, 3);

        this.positionInterpolant.snapshot(timeDiff);
        this.quaternionInterpolant.snapshot(timeDiff);

        for (const actionBinaryInterpolant of this
          .actionBinaryInterpolantsArray) {
          actionBinaryInterpolant.snapshot(timeDiff);
        }

        if (this.avatar) {
          localVector.copy(this.position);
          localVector.y -= this.avatar.height * 0.5;
          physicsScene.setCharacterControllerPosition(
            this.characterPhysics.characterController,
            localVector,
          );
        }
        this.lastPosition.copy(this.position);
      }
    };
    this.playerMap.observe(observePlayerFn);
    this.unbindFns.push(
      this.playerMap.unobserve.bind(this.playerMap, observePlayerFn),
    );
    this.appManager.bindState(this.getAppsState());
    this.appManager.loadApps().then(() => {
      if (!this.voicer || !this.voiceEndpoint) {
        const voiceSpec = JSON.parse(this.playerMap.get('voiceSpec'));
        this.loadVoiceEndpoint(voiceSpec.endpointUrl);
      }
      this.syncAvatar();
    });
  }

  update(timestamp, timeDiff) {
    if (!this.avatar) return; // console.log("no avatar"); // avatar takes time to load, ignore until it does

    this.updateInterpolation(timeDiff);

    const mirrors = metaversefile.getMirrors();
    applyCharacterToAvatar(this, null, this.avatar, mirrors);

    const timeDiffS = timeDiff / 1000;
    this.avatarCharacterSfx.update(timestamp, timeDiffS);
    this.avatarCharacterFx.update(timestamp, timeDiffS);
    this.characterHitter.update(timestamp, timeDiffS);
    this.avatarFace.update(timestamp, timeDiffS);

    this.avatar.update(timestamp, timeDiff);
  }
}
/* class StaticUninterpolatedPlayer extends UninterpolatedPlayer {
  constructor(opts) {
    super(opts);

    this.actions = [];
  }
  getActionsState() {
    return this.actions;
  }
  getActions() {
    return this.actions;
  }
  getActionsArray() {
    return this.actions;
  }
  getAction(type) {
    return this.actions.find(action => action.type === type);
  }
  getActionByActionId(actionId) {
    return this.actions.find(action => action.actionId === actionId);
  }
  hasAction(type) {
    return this.actions.some(a => a.type === type);
  }
  addAction(action) {
    this.actions.push(action);

    this.dispatchEvent({
      type: 'actionadd',
      action,
    });
  }
  removeAction(type) {
    for (let i = 0; i < this.actions.length; i++) {
      const action = this.actions[i];
      if (action.type === type) {
        this.removeActionIndex(i);
        break;
      }
    }
  }
  removeActionIndex(index) {
    const action = this.actions.splice(index, 1)[0];
    this.dispatchEvent({
      type: 'actionremove',
      action,
    });
  }
  clearActions() {
    const numActions = this.actions.length;
    for (let i = numActions - 1; i >= 0; i--) {
      this.removeActionIndex(i);
    }
  }
  updateInterpolation = UninterpolatedPlayer.prototype.updateInterpolation;
} */
/* class NpcPlayer extends LocalPlayer {
  constructor(opts) {
    super(opts);

    this.controlMode = 'npc';
  }
} */

export {
  LocalPlayer,
  RemotePlayer,
  // NpcPlayer,
};
