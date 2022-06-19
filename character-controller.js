/*
this file is responsible for maintaining player state that is network-replicated.
*/
import { WsAudioDecoder } from "wsrtc/ws-codec.js";
import { ensureAudioContext, getAudioContext } from "wsrtc/ws-audio-context.js";
import { getAudioDataBuffer } from "wsrtc/ws-util.js";

import * as THREE from 'three';
import * as Z from 'zjs';
import { getRenderer, scene, camera, dolly } from './renderer.js';
import physicsManager from './physics-manager.js';
import { world } from './world.js';
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
  // groundFriction,
  // defaultVoicePackName,
  voiceEndpointBaseUrl,
  numLoadoutSlots,
} from './constants.js';
import { AppManager } from './app-manager.js';
import { CharacterPhysics } from './character-physics.js';
import { CharacterHups } from './character-hups.js';
import { CharacterSfx } from './character-sfx.js';
import { CharacterHitter } from './character-hitter.js';
import { CharacterBehavior } from './character-behavior.js';
import { CharacterFx } from './character-fx.js';
import { VoicePack, VoicePackVoicer } from './voice-output/voice-pack-voicer.js';
import { VoiceEndpoint, VoiceEndpointVoicer, getVoiceEndpointUrl } from './voice-output/voice-endpoint-voicer.js';
import { BinaryInterpolant, BiActionInterpolant, UniActionInterpolant, InfiniteActionInterpolant, PositionInterpolant, QuaternionInterpolant } from './interpolants.js';
import { applyPlayerToAvatar, makeAvatar } from './player-avatar-binding.js';
import {
  defaultPlayerName,
  defaultPlayerBio,
} from './ai/lore/lore-model.js';
import { murmurhash3 } from './procgen/murmurhash3.js';
import musicManager from './music-manager.js';
import { makeId, clone } from './util.js';
import overrides from './overrides.js';
import logger from './logger.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();
// const localQuaternion2 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const zeroVector = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);

const controlActionTypes = ["jump", "crouch", "fly", "sit"];

const _getSession = () => {
  const renderer = getRenderer();
  const session = renderer.xr.getSession();
  return session;
};

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
const heightFactor = 1.6;
const baseRadius = 0.3;
function loadPhysxCharacterController() {
  const avatarHeight = this.avatar?.height || 1;
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
    position
  );
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
    playerId = makeId(5),
    playersArray = new Z.Doc().getArray(playersMapName),
    isLocalPlayer = false
  } = {}) {
    super();
    this.playerId = playerId;
    this.playerIdInt = murmurhash3(playerId);
    this.name = name;
    this.avatar = null;
    this.detached = false;

    this.playersArray = null;
    this.playerMap = null;

    this.voicePack = null;
    this.voiceEndpoint = null;
    this.microphoneMediaStream = null;

    this.eyeballTarget = new THREE.Vector3();
    this.eyeballTargetEnabled = false;

    this.syncAvatarCancelFn = null;
    this.unbindFns = [];

    // If these weren't set on constructor (which they aren't on remote player) then set them now
    this.characterPhysics = new CharacterPhysics(this);
    this.characterHups = new CharacterHups(this);
    this.characterSfx = new CharacterSfx(this);
    this.characterFx = new CharacterFx(this);
    this.characterHitter = new CharacterHitter(this);
    this.characterBehavior = new CharacterBehavior(this);

    this.leftHand = new Hand();
    this.rightHand = new Hand();
    this.hands = [
      this.leftHand,
      this.rightHand,
    ];

    const _prepareAppManager = () => {
      this.appManager = new AppManager(isLocalPlayer);
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
    }
    _prepareAppManager();

    this.bindState(playersArray);
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
  async setVoicePack({ audioUrl, indexUrl }) {
    const self = this;
    // this.playersArray.doc.transact(function tx() {
    const voiceSpec = JSON.stringify({ audioUrl, indexUrl, endpointUrl: self.voiceEndpoint ? self.voiceEndpoint.url : '' });
    self.playerMap.set('voiceSpec', voiceSpec);
    // });
    this.loadVoicePack({ audioUrl, indexUrl })
  }

  async loadVoicePack({ audioUrl, indexUrl }) {
    this.voicePack = await VoicePack.load({
      audioUrl,
      indexUrl,
    });
    this.updateVoicer();
  }

  setVoiceEndpoint(voiceId) {
    if (!voiceId) return console.error("voice Id is null")
    const self = this;
    const url = `${voiceEndpointBaseUrl}?voice=${encodeURIComponent(voiceId)}`;
    this.playersArray.doc.transact(function tx() {
      let oldVoiceSpec = self.playerMap.get('voiceSpec');
      if (oldVoiceSpec) {
        oldVoiceSpec = JSON.parse(oldVoiceSpec);
        const voiceSpec = JSON.stringify({ audioUrl: oldVoiceSpec.audioUrl, indexUrl: oldVoiceSpec.indexUrl, endpointUrl: url });
        self.playerMap.set('voiceSpec', voiceSpec);
      } else {
        const voiceSpec = JSON.stringify({ audioUrl: self.voicePack?.audioUrl, indexUrl: self.voicePack?.indexUrl, endpointUrl: url })
        self.playerMap.set('voiceSpec', voiceSpec);
      }
    });
    this.loadVoiceEndpoint(url)
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
    if (!this.voiceEndpoint) console.error("this.voiceEndpoint is null")
    return this.voiceEndpoint || this.voicePack || console.warn("no voice endpoint set");
  }
  updateVoicer() {
    const voice = this.getVoice();
    if (voice instanceof VoicePack) {
      const { syllableFiles, audioBuffer } = voice;
      this.voicer = new VoicePackVoicer(syllableFiles, audioBuffer, this);
    } else if (voice instanceof VoiceEndpoint) {
      this.voicer = new VoiceEndpointVoicer(voice, this);
    } else if (voice === null) {
      this.voicer = null;
    } else {
      throw new Error("invalid voice");
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
  getCrouchFactor() {
    return 1 - 0.4 * this.actionInterpolants.crouch.getNormalized();
  }

  handleWearUpdate(app, wear, loadoutIndex = -1, isAppUpdate = false, isPlayerUpdate = true) {
    const param = {
      type: "wearupdate",
      app,
      player: this,
      wear
    }

    if (loadoutIndex != -1) {
      param.loadoutIndex = loadoutIndex
    }
    if (isPlayerUpdate) {
      this.dispatchEvent(param);
    }
    if (isAppUpdate) {
      app.dispatchEvent(param);
    }
  }

  wear(app, { loadoutIndex = -1 } = {}) {
    logger.log("Wear called on", app)
      const _getNextLoadoutIndex = () => {
        let nextLoadoutIndex = -1;
        const usedIndexes = Array(8).fill(false);
        for (const action of this.getActionsState()) {
          if (action.type === "wear") {
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
          physicsObject.physicsId
        );
        physx.physxWorker.disableGeometryPhysics(
          physx.physics,
          physicsObject.physicsId
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
          if (action.type === "wear" && action.loadoutIndex === loadoutIndex) {
            oldLoadoutAction = action;
            break;
          }
        }
        if (oldLoadoutAction) {
          const app = this.appManager.getAppByInstanceId(
            oldLoadoutAction.instanceId
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
            "need to transplant unowned app",
            app,
            world.appManager,
            this.appManager
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

      this.handleWearUpdate(app, true, loadoutIndex, true, true)
    }
  }
  unwear(app, {
    destroy = false,
    dropStartPosition = null,
    dropDirection = null,
  } = {}) {
    logger.log("unwear called on", app)
    const wearActionIndex = this.findActionIndex(({ type, instanceId }) => {
      return type === 'wear' && instanceId === app.instanceId;
    });

    console.log('unwear called wearActionIndex', wearActionIndex)

    const _deinitPhysics = () => {
      const physicsObjects = app.getPhysicsObjects();
      for (const physicsObject of physicsObjects) {
        physx.physxWorker.enableGeometryQueriesPhysics(
          physx.physics,
          physicsObject.physicsId
        );
        physx.physxWorker.enableGeometryPhysics(
          physx.physics,
          physicsObject.physicsId
        );
      }
    };
    _deinitPhysics();
    if (wearActionIndex !== -1) {
      const wearAction = this.getActionsState().get(wearActionIndex);
      const loadoutIndex = wearAction.loadoutIndex;
      console.log('unwear called wearActionIndex !== -1', wearActionIndex !== -1)

      if (app.getComponent("wear") && !app.getComponent("sit") && !app.getComponent("pet")) {
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
                  upVector
                )
              );
              app.scale.set(1, 1, 1);
              app.updateMatrixWorld();
            }
            app.lastMatrix.copy(app.matrixWorld);
          } else {
            const avatarHeight = this.avatar ? this.avatar.height : 0;
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
        console.log('unwear called _removeApp', app.instanceId)

        if (this.appManager.hasTrackedApp(app.instanceId)) {
          if (destroy) {
            this.appManager.removeApp(app);
          } else {
            this.appManager.transplantApp(app, world.appManager);
          }
        } else {
          console.warn(
            "need to transplant unowned app",
            app,
            this.appManager,
            world.appManager
          );
          // debugger;
        }
      };
      _removeApp();
      this.handleWearUpdate(app, false, loadoutIndex, true, true)
    } else {
      this.handleWearUpdate(app, false, -1, true, true)
    }

    app.dispatchEvent({
      type: "resettransform",
      app: app,
      player: this,
    });

  }
  isBound() {
    return !!this.playersArray;
  }
  unbindState() {
    this.playersArray = null;
    this.playerMap = null;
    if (!this.unbindFns) return;
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

    this.playersArray = nextPlayersArray;
    if (!this.playersArray) return logger.warn("this.playersArray is null")

    // note: leave the old state as is
    // it is the host's responsibility to garbage collect us when we disconnect.
    this.attachState(oldState);

    const actions = this.getActionsState();
    let lastActions = actions.toJSON();
    const observeActionsFn = (e) => {
      console.log("actions", e);
      const { added, deleted } = e.changes;

      for (const item of added.values()) {
        let action = item.content.type;
        console.log("action added", action)
        this.dispatchEvent({
          type: 'actionadd',
          action: action,
        });
        }

        for (const item of deleted.values()) {
          let action = item.content.type;
          console.log("action removed", action)
          this.dispatchEvent({
            type: 'actionremove',
            action: action,
          });
        }
      };
    actions.observe(observeActionsFn);
    this.unbindFns.push(actions.unobserve.bind(actions, observeActionsFn));

    const avatar = this.getAvatarState();

    const observeAvatarFn = async (e) => {
      let lastAvatarInstanceId = "";
      const instanceId = avatar.get("instanceId") ?? "";
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
  }
  detachState() {
    const oldActions = this.playersArray
      ? this.getActionsState()
      : new Z.Array();
    const oldAvatar = (
      this.playersArray ? this.getAvatarState() : new Z.Map()
    ).toJSON();
    const oldApps = (
      this.playersArray ? this.getAppsState() : new Z.Array()
    ).toJSON();

    // XXX need to unbind listeners when calling this

    return {
      oldActions,
      oldAvatar,
      oldApps,
    };
  }
  localVector = [0, 0, 0];
  localQuaternion = [0, 0, 0, 1];
  // serializers
  getPosition() {
    return this.position.toArray(this.localVector);
  }
  getQuaternion() {
    return this.quaternion.toArray(this.localQuaternion);
  }
  async syncAvatar() {
    if (this.syncAvatarCancelFn) {
      this.syncAvatarCancelFn.cancel();
      this.syncAvatarCancelFn = null;
    }
    const cancelFn = makeCancelFn();
    this.syncAvatarCancelFn = cancelFn;


    const instanceId = this.getAvatarState().get("instanceId") ?? "";

    if (this.avatar) {
      this.appManager.removeApp(this.avatar.app);
      this.avatar?.app?.parent?.remove(this.avatar.app);
    }

    const _setNextAvatarApp = (app) => {
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

        if (!cancelFn.isLive()) return console.log("canceling the function");
        this.avatar = avatar;
        loadPhysxCharacterController.call(this);

        if (this.isLocalPlayer) {
          physicsManager.disableGeometryQueries(this.characterController);
          avatar.isLocalPlayer = true;
        }

        this.dispatchEvent({
          type: "avatarchange",
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
            _setNextAvatarApp(null)
          }
        }
      }
    }

    this.syncAvatarCancelFn = null;
  }
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
  getActions() {
    return this.getActionsState();
  }
  getActionsState() {
    if (!this.playerMap) return []
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
    return this.isBound() ? Array.from(this.getActionsState()) : [];
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
    action.controllingBone =
      action.type === "sit" ? null : action.controllingBone;
    actions.push([action]);
  }
  destroy() {
    this.characterPhysics?.destroy();
    this.characterHups?.destroy();
    this.characterSfx?.destroy();
    this.characterFx?.destroy();

    if (this.isLocalPlayer) {
      // const wearActions = Array.from(this.getActionsState()).filter(
      //   (action) => action.type === "wear"
      // );
      // for (const wearAction of wearActions) {
      //   const instanceId = wearAction.instanceId;
      //   const app = metaversefileApi.getAppByInstanceId(instanceId);
      //   if (
      //     app.getComponent("wear") ||
      //     app.getComponent("sit") ||
      //     app.getComponent("pet")
      //   ) {
      //     app.unwear();
      //   }
      // }
    }

    this.appManager.unbindState();
    this.appManager.destroy();
  }
}

// Any player being simulated on the client is a local player
// This includes the local player, as well as non-agent NPCs
// Created in players.js and npc-manager.js respectively
class LocalPlayer extends Player {
  constructor(opts) {
    super({ ...opts, isLocalPlayer: !opts.npc });

    this.isLocalPlayer = !opts.npc;
    this.isNpcPlayer = !!opts.npc;
    this.detached = !!opts.detached;

    this.bio = defaultPlayerBio;
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
      hurt: new InfiniteActionInterpolant(() => this.hasAction("hurt"), 0),
    };
    this.actionInterpolantsArray = Object.keys(this.actionInterpolants).map(
      (k) => this.actionInterpolants[k]
    );

    this.avatarBinding = {
      position: this.position,
      quaternion: this.quaternion,
    };
  }

  updateInterpolation(timestamp, timeDiff) {
    for (const actionInterpolant of this.actionInterpolantsArray) {
      actionInterpolant.update(timestamp, timeDiff);
    }
  }

  async setPlayerSpec(playerSpec) {
    const p = this.setAvatarUrl(playerSpec.avatarUrl);

    overrides.userVoiceEndpoint.set(playerSpec.voice ?? null);
    overrides.userVoicePack.set(playerSpec.voicePack ?? null);

    await p;
  }
  async setAvatarUrl(u) {
    const avatarApp = await this.appManager.addTrackedApp(u);
    this.setAvatarAppInternal(avatarApp);
  }
  getAvatarApp() {
    const avatar = this.getAvatarState();
    const instanceId = avatar.get("instanceId");
    return this.appManager.getAppByInstanceId(instanceId);
  }
  async setAvatarApp(app) {
    if (this.isLocalPlayer) {
      world.appManager.transplantApp(app, this.appManager);
      this.setAvatarAppInternal(app);
    } else {
      console.log("Handling setAvatarApp for remote player")
    }
  }

  setAvatarAppInternal(app) {
    if (!app) return console.error("app is ", app)
    console.log("Setting setAvatarAppInternal on remote player")
    const self = this;
    const avatar = self.getAvatarState();
    const oldInstanceId = avatar.get("instanceId");
    this.playersArray.doc.transact(function tx() {
      if (oldInstanceId) {
        self.appManager.removeTrackedAppInternal(oldInstanceId);
      }

      if (app.instanceId && oldInstanceId !== app.instanceId) {
        avatar.set("instanceId", app.instanceId ?? "");
      } else {
        console.warn("Trying to set avatar app to same instanceId as before");
      }
    });
  }
  setMicMediaStream(mediaStream) {
    if (!this.avatar)
      return console.log("Can't set mic media stream, no avatar");
    if (this.microphoneMediaStream) {
      this.microphoneMediaStream.disconnect();
      this.microphoneMediaStream = null;
    }
    if (mediaStream) {
      this.avatar.setAudioEnabled(true, this);
      const audioContext = Avatar.getAudioContext();
      const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

      mediaStreamSource.connect(this.avatar.getAudioInput(true));

      this.microphoneMediaStream = mediaStreamSource;
    }
  }

  attachState(oldState) {
    const { oldActions, oldAvatar, oldApps } = oldState;
    const { instanceId } = oldAvatar;

    const self = this;
    this.playersArray.doc.transact(function tx() {
      self.playerMap = new Z.Map();
      self.playerMap.set('playerId', self.playerId);
      self.playerMap.set('name', self.name);
      self.playerMap.set('bio', self.bio);

      const packedTransform = new Float32Array(8);
      const pack3 = (v, i) => {
        packedTransform[i] = v.x;
        packedTransform[i + 1] = v.y;
        packedTransform[i + 2] = v.z;
      };
      const pack4 = (v, i) => {
        packedTransform[i] = v.x;
        packedTransform[i + 1] = v.y;
        packedTransform[i + 2] = v.z;
        packedTransform[i + 3] = v.w;
      };
      pack3(self.position, 0);
      pack4(self.quaternion, 3);
      packedTransform[7] = 0;

      self.playerMap.set("transform", packedTransform);
      const avatar = self.getAvatarState();
      avatar.set("instanceId", instanceId ?? "");

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

    this.appManager.bindState(this.getAppsState());
  }
  grab(app, hand = 'left') {
    const { position, quaternion } = _getSession() ?
      this[hand === 'left' ? 'leftHand' : 'rightHand']
      :
      camera;

    app.updateMatrixWorld();
    app.savedRotation = app.rotation.clone();
    app.startQuaternion = quaternion.clone();

    const grabAction = {
      type: "grab",
      hand,
      instanceId: app.instanceId,
      matrix: localMatrix
        .copy(app.matrixWorld)
        .premultiply(
          localMatrix2
            .compose(position, quaternion, localVector.set(1, 1, 1))
            .invert()
        )
        .toArray(),
    };
    this.addAction(grabAction);

    const physicsObjects = app.getPhysicsObjects();
    for (const physicsObject of physicsObjects) {
      //physx.physxWorker.disableGeometryPhysics(physx.physics, physicsObject.physicsId);
      physx.physxWorker.disableGeometryQueriesPhysics(
        physx.physics,
        physicsObject.physicsId
      );
    }
  }
  ungrab() {
    const actions = Array.from(this.getActionsState());
    let removeOffset = 0;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.type === "grab") {
        const app = metaversefile.getAppByInstanceId(action.instanceId);
        const physicsObjects = app.getPhysicsObjects();
        for (const physicsObject of physicsObjects) {
          physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
          // physx.physxWorker.enableGeometryPhysics(physx.physics, physicsObject.physicsId);
          //Todo: need to sync the physicsObject transform to its parent
          // physicsObject.updateMatrixWorld()
        }
        this.removeActionIndex(i + removeOffset);
        removeOffset -= 1;
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
  packed = new Float32Array(8);
  lastTimestamp = NaN;
  lastMatrix = new THREE.Matrix4();
  pushPlayerUpdates(timeDiff) {
    if (this.lastMatrix.equals(this.matrixWorld)) return;
    this.lastMatrix.copy(this.matrixWorld);

    this.packed = new Float32Array(8);
    const pack3 = (v, i) => {
      this.packed[i] = v.x;
      this.packed[i + 1] = v.y;
      this.packed[i + 2] = v.z;
    };
    const pack4 = (v, i) => {
      this.packed[i] = v.x;
      this.packed[i + 1] = v.y;
      this.packed[i + 2] = v.z;
      this.packed[i + 3] = v.w;
    };
    pack3(this.position, 0);
    pack4(this.quaternion, 3);
    this.packed[7] = timeDiff;

    const self = this;
    this.playersArray.doc.transact(function tx() {
      self.playerMap.set("transform", self.packed);
    })
  }
  updatePhysics(timestamp, timeDiff) {
    if (this.avatar) {
      const timeDiffS = timeDiff / 1000;
      this.characterPhysics.update(timestamp, timeDiffS);
    }
  }
  update(timestamp, timeDiff, frame) {
    if (!this.avatar) {
      return logger.warn("Not updating local player, no avatar")
    }

    const session = _getSession();
    const mirrors = metaversefile.getMirrors();
    applyPlayerToAvatar(this, session, this.avatar, mirrors);
    this.updateInterpolation(timeDiff);

    const timeDiffS = timeDiff / 1000;

    this.characterSfx.update(timestamp, timeDiffS, this.getActionsState());
    this.characterFx.update(timestamp, timeDiffS);
    this.characterHitter.update(timestamp, timeDiffS);
    this.characterBehavior.update(timestamp, timeDiffS);

    this.avatar.update(timestamp, timeDiff, true);

    this.pushPlayerUpdates(timeDiff);
    this.appManager.update();
  }
  /* teleportTo = (() => {
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localQuaternion = new THREE.Quaternion();
    const localMatrix = new THREE.Matrix4();
    return function (position, quaternion, { relation = "floor" } = {}) {
      const renderer = getRenderer();
      const xrCamera = renderer.xr.getSession()
        ? renderer.xr.getCamera(camera)
        : camera;

      const avatarHeight = this.avatar ? this.avatar.height : 0;
      if (renderer.xr.getSession()) {
        localMatrix
          .copy(xrCamera.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector, localQuaternion, localVector2);

        dolly.matrix
          .premultiply(
            localMatrix.makeTranslation(
              position.x - localVector.x,
              position.y - localVector.y,
              position.z - localVector.z
            )
          )
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector.x, localVector.y, localVector.z))
          .premultiply(
            localMatrix.makeTranslation(
              0,
              relation === "floor" ? avatarHeight : 0,
              0
            )
          )
          .decompose(dolly.position, dolly.quaternion, dolly.scale);
        dolly.updateMatrixWorld();
      } else {
        camera.position
          .copy(position)
          .sub(
            localVector
              .copy(cameraManager.getCameraOffset())
              .applyQuaternion(camera.quaternion)
          );
        camera.position.y += relation === "floor" ? avatarHeight : 0;
        camera.quaternion.copy(quaternion);
        camera.updateMatrixWorld();
      }

      this.resetPhysics();
    };
  })() */
}

// Any player simulated on another machine that is not this client
// Created by the players-manager class
class RemotePlayer extends Player {
  constructor(opts) {
    super(opts);

    this.audioWorkletNode = null;
    this.audioWorkerLoaded = false;

    const _setupInterpolation = () => {
      this.positionInterpolant = new PositionInterpolant(
        () => this.getPosition(),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames
      );
      this.quaternionInterpolant = new QuaternionInterpolant(
        () => this.getQuaternion(),
        avatarInterpolationTimeDelay,
        avatarInterpolationNumFrames
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
          () => this.hasAction("hurt"),
          avatarInterpolationTimeDelay,
          avatarInterpolationNumFrames
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

      this.actionInterpolantsArray = Object.keys(this.actionInterpolants).map((k) => this.actionInterpolants[k]);
    }
    _setupInterpolation();

    this.avatarBinding = {
      position: this.positionInterpolant.get(),
      quaternion: this.quaternionInterpolant.get(),
    };
   this.initRemotePlayer();
  }

  async initRemotePlayer(){
      // Called on the remote player on construction
    for (let i = 0; i < this.appManager.appsArray.length; i++) {
      const trackedApp = this.appManager.appsArray.get(i, Z.Map);
      const app = await this.appManager.importTrackedApp(trackedApp);

      if(!app) return console.error("App not found", app);
      if(!trackedApp) return console.error("App not found", trackedApp);
      this.appManager.bindTrackedApp(trackedApp, app);
      if (app.getComponent("wear")) {
        this.wear(app);
      }
    }

    await this.syncAvatar();

    const transform = this.playerMap.get("transform");
    this.position.fromArray(transform, 0);
    this.quaternion.fromArray(transform, 3);

    const nextActions = Array.from(this.getActionsState());

    for (const nextAction of nextActions) {
        this.dispatchEvent({
          type: 'actionadd',
          action: nextAction,
        });
      }
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
        "ws-output-worklet"
      );

      this.audioDecoder = new WsAudioDecoder({
        output: (data) => {
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
  update(timestamp, timeDiff) {
    if (!this.avatar) return logger.warn("Can't update remote player, avatar is null");

    const _updateInterpolation = () => {
      this.positionInterpolant.update(timeDiff);
      this.quaternionInterpolant.update(timeDiff);

      for (const actionBinaryInterpolant of this.actionBinaryInterpolantsArray) {
        actionBinaryInterpolant.update(timeDiff);
      }
      for (const actionInterpolant of this.actionInterpolantsArray) {
        actionInterpolant.update(timeDiff);
      }
    }

    _updateInterpolation();

    const mirrors = metaversefile.getMirrors();
    applyPlayerToAvatar(this, null, this.avatar, mirrors);

    const timeDiffS = timeDiff / 1000;
    this.characterSfx.update(timestamp, timeDiffS, this.getActionsState());
    this.characterFx.update(timestamp, timeDiffS);
    this.characterHitter.update(timestamp, timeDiffS);
    this.characterBehavior.update(timestamp, timeDiffS);

    this.avatar.update(timestamp, timeDiff, false);
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
      console.warn(
        "binding to nonexistent player object",
        this.playersArray.toJSON()
      );
    }

    const lastPosition = new THREE.Vector3();

    loadPhysxCharacterController.call(this);

    const observePlayerFn = (e) => {
      if (this.isLocalPlayer) return;

      if (e.changes.keys.get('voiceSpec') || e.added?.keys?.get('voiceSpec')) {
        const voiceSpec = e.changes.keys.get('voiceSpec');
        const json = JSON.parse(voiceSpec.value);
        if (json.endpointUrl)
          this.loadVoiceEndpoint(json.endpointUrl);
        if (json.audioUrl && json.indexUrl)
          this.loadVoicePack({ audioUrl: json.audioUrl, indexUrl: json.indexUrl });
      }

      if (e.changes.keys.get('name')) {
        this.name = e.changes.keys.get('name');
      }

      if (e.changes.keys.has("transform")) {
        const transform = this.playerMap.get("transform");
        if (transform) {
          const remoteTimeDiff = transform[7];
          lastPosition.copy(this.position);
          this.position.fromArray(transform, 0);

          if (this.avatar) this.characterPhysics.setPosition(this.position);

          this.quaternion.fromArray(transform, 3);

          this.positionInterpolant?.snapshot(remoteTimeDiff);
          this.quaternionInterpolant?.snapshot(remoteTimeDiff);

          for (const actionBinaryInterpolant of this
            .actionBinaryInterpolantsArray) {
            actionBinaryInterpolant.snapshot(remoteTimeDiff);
          }

          if (this.avatar) {
            this.avatar.setVelocity(
              remoteTimeDiff / 1000,
              lastPosition,
              this.position,
              this.quaternion
            );
          }
        } else {
          console.log("e", e)
        }

        

        
      }
    };

    this.playerMap.observe(observePlayerFn);
    this.unbindFns.push(
      this.playerMap.unobserve.bind(this.playerMap, observePlayerFn)
    );

    this.appManager.callBackFn = (app, event, flag) => {
      if (event == "wear") {
        if (flag === "remove") {
          this.unwear(app);
        }
        if (flag === "add") {
          this.wear(app);
        }
      }
    };
    this.appManager.bindState(this.getAppsState());
  }
  getSession() {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    return session;
  }
}

export {
  LocalPlayer,
  RemotePlayer
};