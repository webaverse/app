/*
this file is responisible for maintaining player state that is network-replicated.
*/

import * as THREE from 'three';
import * as Y from 'yjs';
import {getRenderer, camera, dolly} from './renderer.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import cameraManager from './camera-manager.js';
import physx from './physx.js';
import metaversefile from './metaversefile-api.js';
import {actionsMapName, avatarMapName, playersMapName, crouchMaxTime, activateMaxTime, useMaxTime} from './constants.js';
import {AppManager} from './app-manager.js';
import {BiActionInterpolant, UniActionInterpolant, InfiniteActionInterpolant} from './interpolants.js';
import {applyPlayerToAvatar, switchAvatar} from './player-avatar-binding.js';
import {makeId, clone} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

class PlayerHand extends THREE.Object3D {
  constructor() {
    super();

    this.pointer = 0;
    this.grab = 0;
    this.enabled = false;
  }
}
class Player extends THREE.Object3D {
  constructor({
    prefix = 'player.' + makeId(5),
    state = new Y.Doc(),
  } = {}) {
    super();

    this.prefix = prefix;
    this.state = null;
    this.appManager = new AppManager({
      prefix,
      state: null,
      autoSceneManagement: false,
    });

    this.leftHand = new PlayerHand();
    this.rightHand = new PlayerHand();
    this.hands = [
      this.leftHand,
      this.rightHand,
    ];
    this.actionInterpolants = {
      crouch: new BiActionInterpolant(() => this.hasAction('crouch'), 0, crouchMaxTime),
      activate: new UniActionInterpolant(() => this.hasAction('activate'), 0, activateMaxTime),
      use: new InfiniteActionInterpolant(() => this.hasAction('use'), 0),
      narutoRun: new InfiniteActionInterpolant(() => this.hasAction('narutoRun'), 0),
      fly: new InfiniteActionInterpolant(() => this.hasAction('fly'), 0),
      jump: new InfiniteActionInterpolant(() => this.hasAction('jump'), 0),
      dance: new InfiniteActionInterpolant(() => this.hasAction('dance'), 0),
      throw: new InfiniteActionInterpolant(() => this.hasAction('throw'), 0),
    };
    
    this.avatarEpoch = 0;
    this.avatar = null;
    this.unbindStateFn = null;
    
    this.bindState(state);
  }
  static controlActionTypes = [
    'jump',
    'crouch',
    'fly',
    'sit',
  ]
  unbindState() {
    const lastState = this.state;
    if (lastState) {
      this.unbindStateFn();
      this.state = null;
      this.unbindStateFn = null;
    }
  }
  bindState(nextState) {
    // latch old state
    const oldActions = this.state ? this.getActionsArray() : [];
    const oldAvatar = this.state ? this.getAvatarState() : new Y.Map();
    // const oldPlayers = this.state ? this.getPlayersState() : [];
    
    // unbind
    this.unbindState();
    this.appManager.unbindState();
    
    // note: leave the old state as is. it is the host's responsibility to garbage collect us when we disconnect.
    
    // blindly add to new state
    this.state = nextState;
    if (this.state) {
      const self = this;
      this.state.transact(function tx() {
        const actions = self.getActionsState();
        for (const oldAction of oldActions) {
          actions.push([oldAction]);
        }
        
        const avatar = self.getAvatarState();
        const instanceId = oldAvatar.get('instanceId');
        if (instanceId !== undefined) {
          avatar.set('instanceId', instanceId);
        } /* else {
          console.warn('undefined avatar instance id when binding');
          debugger;
        } */
        
        const players = self.getPlayersState();
        players.push([self.prefix]);
        
        // XXX copy over out apps from app manager as well
      });
    }
    
    this.appManager.bindState(this.state);
    if (this.state) {
      const actions = this.getActionsState();
      let lastActions = actions.toJSON();
      const observeActionsFn = () => {
        const nextActions = Array.from(this.getActionsState());
        for (const nextAction of nextActions) {
          if (!lastActions.some(lastAction => lastAction.actionId === nextAction.actionId)) {
            this.dispatchEvent({
              type: 'actionadd',
              action: nextAction,
            });
            // console.log('add action', nextAction);
          }
        }
        for (const lastAction of lastActions) {
          if (!nextActions.some(nextAction => nextAction.actionId === lastAction.actionId)) {
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
      
      const avatar = this.getAvatarState();
      let lastAvatarInstanceId = '';
      let lastAvatarApp = null;
      let observeAvatarEpoch = 0;
      const observeAvatarFn = async () => {
        const localEpoch = ++observeAvatarEpoch;
        
        // we are in an observer and we want to perform a state transaction as a result
        // therefore we need to yeild out of the observer first or else the other transaction handlers will get confused about timing
        await Promise.resolve();
        if (observeAvatarEpoch !== localEpoch) return;
        
        const avatar = this.getAvatarState();
        const instanceId = avatar.get('instanceId') ?? '';
        if (lastAvatarInstanceId !== instanceId) {
          lastAvatarInstanceId = instanceId;
          
          // remove last app
          if (lastAvatarApp) {
            const oldPeerOwnerAppManager = this.appManager.getPeerOwnerAppManager(lastAvatarApp.instanceId);
            if (oldPeerOwnerAppManager) {
              // console.log('transplant last app');
              this.appManager.transplantApp(lastAvatarApp, oldPeerOwnerAppManager);
            } else {
              // console.log('remove last app', lastAvatarApp);
              this.appManager.removeTrackedApp(lastAvatarApp.instanceId);
            }
            lastAvatarApp = null;
          }
          
          const _setNextAvatarApp = app => {
            // console.log('set next avatar app', app);
            (async () => {
              const nextAvatar = await switchAvatar(this.avatar, app);
              if (observeAvatarEpoch !== localEpoch) return;
              this.avatar = nextAvatar;
            })();
            lastAvatarApp = app;
            
            this.dispatchEvent({
              type: 'avatarupdate',
              app,
            });
          };
          
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
              console.warn('switching avatar to instanceId that does not exist in any app manager', instanceId);
            }
          }
        }
      };
      avatar.observe(observeAvatarFn);
    
      this.unbindStateFn = () => {
        actions.unobserve(observeActionsFn);
        avatar.unobserve(observeAvatarFn);
      };
    }
  }
  getActionsState() {
    return this.state.getArray(this.prefix + '.' + actionsMapName);
  }
  getActionsArray() {
    return this.state ? Array.from(this.getActionsState()) : [];
  }
  getAvatarState() {
    return this.state.getMap(this.prefix + '.' + avatarMapName);
  }
  getPlayersState() {
    return this.state.getArray(playersMapName);
  }
  findAction(fn) {
    if (this.state) {
      const actions = this.getActionsState();
      for (const action of actions) {
        if (fn(action)) {
          return action;
        }
      }
    }
    return null;
  }
  findActionIndex(fn) {
    if (this.state) {
      const actions = this.getActionsState();
      let i = 0;
      for (const action of actions) {
        if (fn(action)) {
          return i;
        }
        i++
      }
    }
    return -1;
  }
  getAction(type) {
    if (this.state) {
      const actions = this.getActionsState();
      for (const action of actions) {
        if (action.type === type) {
          return action;
        }
      }
    }
    return null;
  }
  getActionIndex(type) {
    if (this.state) {
      const actions = this.getActionsState();
      let i = 0;
      for (const action of actions) {
        if (action.type === type) {
          return i;
        }
        i++;
      }
    }
    return -1;
  }
  indexOfAction(action) {
    if (this.state) {
      const actions = this.getActionsState();
      let i = 0;
      for (const a of actions) {
        if (a === action) {
          return i;
        }
        i++;
      }
    }
    return -1;
  }
  hasAction(type) {
    if (this.state) {
      const actions = this.getActionsState();
      for (const action of actions) {
        if (action.type === type) {
          return true;
        }
      }
    }
    return false;
  }
  addAction(action) {
    action = clone(action);
    action.actionId = makeId(5);
    this.getActionsState().push([action]);
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
  setControlAction(action) {
    const actions = this.getActionsState();
    for (let i = 0; i < actions.length; i++) {
      const action = actions.get(i);
      const isControlAction = Player.controlActionTypes.includes(action.type);
      if (isControlAction) {
        actions.delete(i);
        i--;
      }
    }
    actions.push([action]);
  }
  setMicMediaStream(mediaStream, options) {
    this.avatar.setMicrophoneMediaStream(mediaStream, options);
  }
  update(timestamp, timeDiff) {
    if (this.avatar) {
      const renderer = getRenderer();
      const session = renderer.xr.getSession();
      applyPlayerToAvatar(this, session, this.avatar);

      const timeDiffS = timeDiff / 1000;
      this.avatar.update(timestamp, timeDiffS);
    }
  }
  destroy() {
    this.cleanup();
    this.appManager.destroy();
  }
}
class LocalPlayer extends Player {
  constructor(opts) {
    super(opts);
  }
  async setAvatarUrl(u) {
    const localAvatarEpoch = ++this.avatarEpoch;
    const avatarApp = await this.appManager.addTrackedApp(u);
    if (this.avatarEpoch !== localAvatarEpoch) {
      this.appManager.removeTrackedApp(avatarApp.instanceId);
      return;
    }
    
    this.setAvatarApp(avatarApp);
  }
  setAvatarApp(app) {
    const self = this;
    this.state.transact(function tx() {
      const avatar = self.getAvatarState();
      avatar.set('instanceId', app.instanceId);
    });
  }
  wear(app) {
    app.dispatchEvent({
      type: 'wearupdate',
      wear: true,
    });
    
    if (world.appManager.hasTrackedApp(app.instanceId)) {
      world.appManager.transplantApp(app, this.appManager);
    } else {
      // console.warn('need to transplant unowned app', app, world.appManager, this.appManager);
      // debugger;
    }
    
    const physicsObjects = app.getPhysicsObjects();
    for (const physicsObject of physicsObjects) {
      physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
    }
    
    const {instanceId} = app;
    this.addAction({
      type: 'wear',
      instanceId,
    });
    this.ungrab();
    
    this.dispatchEvent({
      type: 'wearupdate',
      app,
      wear: true,
    });
  }
  unwear(app) {
    const wearActionIndex = this.findActionIndex(({type, instanceId}) => {
      return type === 'wear' && instanceId === app.instanceId;
    });
    if (wearActionIndex !== -1) {
      this.removeActionIndex(wearActionIndex);
      
      if (this.appManager.hasTrackedApp(app.instanceId)) {
        this.appManager.transplantApp(app, world.appManager);
      } else {
        // console.warn('need to transplant unowned app', app, this.appManager, world.appManager);
        // debugger;
      }
      
      const wearComponent = app.getComponent('wear');
      if (wearComponent) {
        app.position.copy(this.position)
          .add(localVector.set(0, -physicsManager.getAvatarHeight() + 0.5, -0.5).applyQuaternion(this.quaternion));
        app.quaternion.identity();
        app.scale.set(1, 1, 1);
        app.updateMatrixWorld();
      }

      const physicsObjects = app.getPhysicsObjects();
      for (const physicsObject of physicsObjects) {
        physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
      }
      
      app.dispatchEvent({
        type: 'wearupdate',
        wear: false,
      });
      this.dispatchEvent({
        type: 'wearupdate',
        app,
        wear: false,
      });
    }
  }
  grab(app, hand = 'left') {
    const renderer = getRenderer();
    const localPlayer = metaversefile.useLocalPlayer();
    const {position, quaternion} = renderer.xr.getSession() ?
      localPlayer[hand === 'left' ? 'leftHand' : 'rightHand']
    :
      camera;

    app.updateMatrixWorld();
    app.savedRotation = app.rotation.clone();
    app.startQuaternion = quaternion.clone();

    const grabAction = {
      type: 'grab',
      hand,
      instanceId: app.instanceId,
      matrix: localMatrix.copy(app.matrixWorld)
        .premultiply(localMatrix2.compose(position, quaternion, localVector.set(1, 1, 1)).invert())
        .toArray()
    };
    localPlayer.addAction(grabAction);
    
    const physicsObjects = app.getPhysicsObjects();
    for (const physicsObject of physicsObjects) {
      // physx.physxWorker.disableGeometryPhysics(physx.physics, physicsObject.physicsId);
      physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
    }
  }
  ungrab() {
    const actions = Array.from(this.getActionsState());
    let removeOffset = 0;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.type === 'grab') {
        const app = metaversefile.getAppByInstanceId(action.instanceId);
        const physicsObjects = app.getPhysicsObjects();
        for (const physicsObject of physicsObjects) {
          // physx.physxWorker.enableGeometryPhysics(physx.physics, physicsObject.physicsId);
          physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
        }
        this.removeActionIndex(i + removeOffset);
        removeOffset -= 1;
      }
    }
  }
  lookAt(p) {
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
    
    /* this.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(this.position, p, upVector)
    );
    teleportTo(this.position, this.quaternion, {
      relation: 'head',
    }); */
  }
  teleportTo = (() => {
    // const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localVector3 = new THREE.Vector3();
    // const localQuaternion = new THREE.Quaternion();
    const localQuaternion2 = new THREE.Quaternion();
    // const localQuaternion3 = new THREE.Quaternion();
    // const localQuaternion4 = new THREE.Quaternion();
    // const localEuler = new THREE.Euler();
    const localMatrix = new THREE.Matrix4();
    return function(position, quaternion, {relation = 'floor'} = {}) {
      const renderer = getRenderer();
      const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;

      if (renderer.xr.getSession()) {
        localMatrix.copy(xrCamera.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        
        dolly.matrix
          .premultiply(localMatrix.makeTranslation(position.x - localVector2.x, position.y - localVector2.y, position.z - localVector2.z))
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
          .premultiply(localMatrix.makeTranslation(0, relation === 'floor' ? physicsManager.getAvatarHeight() : 0, 0))
          .decompose(dolly.position, dolly.quaternion, dolly.scale);
        dolly.updateMatrixWorld();
      } else {
        camera.position.copy(position)
          .sub(localVector2.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));
        camera.position.y += relation === 'floor' ? physicsManager.getAvatarHeight() : 0;
        camera.quaternion.copy(quaternion);
        camera.updateMatrixWorld();
      }

      physicsManager.velocity.set(0, 0, 0);
    };
  })()
}
class RemotePlayer extends Player {
  constructor(opts) {
    super(opts);
  }
}

function getPlayerCrouchFactor(player) {
  let factor = 1;
  factor *= 1 - 0.4 * player.actionInterpolants.crouch.getNormalized();
  factor *= 1 - 0.8 * Math.min(player.actionInterpolants.activate.getNormalized() * 1.5, 1);
  return factor;
};

function update(timeDiff) {
  const localPlayer = metaversefile.useLocalPlayer();
  localPlayer.actionInterpolants.crouch.update(timeDiff);
  localPlayer.actionInterpolants.activate.update(timeDiff);
  localPlayer.actionInterpolants.use.update(timeDiff);
  localPlayer.actionInterpolants.narutoRun.update(timeDiff);
  localPlayer.actionInterpolants.fly.update(timeDiff);
  localPlayer.actionInterpolants.jump.update(timeDiff);
  localPlayer.actionInterpolants.dance.update(timeDiff);
  localPlayer.actionInterpolants.throw.update(timeDiff);
}

export {
  LocalPlayer,
  RemotePlayer,
  getPlayerCrouchFactor,
  update,
};