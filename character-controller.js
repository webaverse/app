/*
this file is responisible for maintaining player state that is network-replicated.
*/

import * as THREE from 'three';
import {getRenderer, camera, dolly} from './renderer.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {world} from './world.js';
import cameraManager from './camera-manager.js';
import physx from './physx.js';
import metaversefile from './metaversefile-api.js';
import {crouchMaxTime, activateMaxTime} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

class BiActionInterpolant {
  constructor(fn, minValue, maxValue) {
    this.fn = fn;
    this.value = minValue;
    this.minValue = minValue;
    this.maxValue = maxValue;
  }
  update(timeDiff) {
    this.value += (this.fn() ? 1 : -1) * timeDiff;
    this.value = Math.min(Math.max(this.value, this.minValue), this.maxValue);
  }
  get() {
    return this.value;
  }
  getNormalized() {
    return this.value / (this.maxValue - this.minValue);
  }
  getInverse() {
    return this.maxValue - this.value;
  }
}

class PlayerHand {
  constructor() {
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
  }
}
class Player extends THREE.Object3D {
  constructor() {
    super();

    this.leftHand = new PlayerHand();
    this.rightHand = new PlayerHand();
    this.hands = [
      this.leftHand,
      this.rightHand,
    ];
    // this.playerId = 'Anonymous';
    this.grabs = [null, null];
    this.wears = [];
    this.actions = [];

    this.actionInterpolants = {
      crouch: new BiActionInterpolant(() => this.hasAction('crouch'), 0, crouchMaxTime),
    };
  }
  static controlActionTypes = [
    'jump',
    'crouch',
    'fly',
    'sit',
  ]
  getAction(type) {
    return this.actions.find(action => action.type === type);
  }
  hasAction(type) {
    return this.actions.some(action => action.type === type);
  }
  addAction(action) {
    this.actions.push(action);
  }
  removeAction(type) {
    this.actions = this.actions.filter(action => action.type !== type);
  }
  setControlAction(action) {
    this.actions = this.actions.filter(action => !Player.controlActionTypes.includes(action.type));
    this.actions.push(action);
  }
}
class LocalPlayer extends Player {
  constructor() {
    super();
  }
  setAvatar(app) {
    rigManager.setLocalAvatar(app);
    world.appManager.dispatchEvent(new MessageEvent('avatarupdate', {
      data: {
        app,
      },
    }));
  }
  wear(app) {
    app.dispatchEvent({
      type: 'wearupdate',
      wear: true,
    });
    
    const physicsObjects = app.getPhysicsObjects();
    for (const physicsObject of physicsObjects) {
      physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
    }
    
    const {instanceId} = app;
    this.wears.push({
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
    const index = this.wears.findIndex(({instanceId}) => instanceId === app.instanceId);
    if (index !== -1) {
      this.wears.splice(index, 1);
      
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
  grab(app) {
    const renderer = getRenderer();
    const {position, quaternion} = renderer.xr.getSession() ? useLocalPlayer().leftHand : camera;

    app.updateMatrixWorld();
    app.savedRotation = app.rotation.clone();
    app.startQuaternion = quaternion.clone();

    this.grabs[0] = {
      instanceId: app.instanceId,
      matrix: localMatrix.copy(app.matrixWorld)
        .premultiply(localMatrix2.compose(position, quaternion, localVector.set(1, 1, 1)).invert())
        .toArray(),
    };
    
    const physicsObjects = app.getPhysicsObjects();
    for (const physicsObject of physicsObjects) {
      // physx.physxWorker.disableGeometryPhysics(physx.physics, physicsObject.physicsId);
      physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
    }
  }
  ungrab() {
    const grabSpec = this.grabs[0];
    if (grabSpec) {
      const app = metaversefile.getAppByInstanceId(grabSpec.instanceId);
      const physicsObjects = app.getPhysicsObjects();
      for (const physicsObject of physicsObjects) {
        // physx.physxWorker.enableGeometryPhysics(physx.physics, physicsObject.physicsId);
        physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
      }
    }
    
    this.grabs[0] = null;
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
  constructor() {
    super();
  }
}

function getPlayerCrouchFactor(player) {
  let factor = 1;
  factor *= 1 - 0.4 * player.actionInterpolants.crouch.getNormalized();
  
  const activateAction = player.actions.find(action => action.type === 'activate');
  if (activateAction) {
    factor *= 1 - 0.8 * Math.pow(Math.min(Math.max(activateAction.time*2, 0), activateMaxTime) / activateMaxTime, 1);
  }
  
  return factor;
};

function update(timeDiff) {
  const localPlayer = metaversefile.useLocalPlayer();
  const jumpAction = localPlayer.actions.find(action => action.type === 'jump');
  if (jumpAction) {
    jumpAction.time += timeDiff;
  }
  const flyAction = localPlayer.actions.find(action => action.type === 'fly');
  if (flyAction) {
    flyAction.time += timeDiff;
  }
  const danceAction = localPlayer.actions.find(action => action.type === 'dansu');
  if (danceAction) {
    danceAction.time += timeDiff;
  }
  const throwAction = localPlayer.actions.find(action => action.type === 'throw');
  if (throwAction) {
    throwAction.time += timeDiff;
  }
  const narutoRunAction = localPlayer.actions.find(action => action.type === 'narutoRun');
  if (narutoRunAction) {
    narutoRunAction.time += timeDiff;
  }
  const activateAction = localPlayer.actions.find(action => action.type === 'activate');
  if (activateAction) {
    activateAction.time += timeDiff;
  }
  const useAction = localPlayer.actions.find(action => action.type === 'use');
  if (useAction) {
    useAction.time += timeDiff;
  }
  
  localPlayer.actionInterpolants.crouch.update(timeDiff);
}

export {
  LocalPlayer,
  RemotePlayer,
  getPlayerCrouchFactor,
  update,
};