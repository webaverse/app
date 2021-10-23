import * as THREE from 'three';
import {getRenderer, camera, dolly} from './renderer.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {world} from './world.js';
import cameraManager from './camera-manager.js';
import physx from './physx.js';
import metaversefile from './metaversefile-api.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

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
    const wearComponent = app.getComponent('wear');
    if (wearComponent) {
      app.dispatchEvent({
        type: 'wearupdate',
        wear: wearComponent,
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
        wear: wearComponent,
      });
    } else {
      console.warn('cannot wear app with no wear component');
    }
  }
  unwear(app) {
    const index = this.wears.findIndex(({instanceId}) => instanceId === app.instanceId);
    if (index !== -1) {
      this.wears.splice(index, 1);
      // metaversefile.removeApp(app);
      // app.destroy();
      
      app.position.copy(this.position)
        .add(localVector.set(0, -physicsManager.getAvatarHeight() + 0.2, -1).applyQuaternion(this.quaternion));
      app.quaternion.copy(this.quaternion);
      
      app.dispatchEvent({
        type: 'wearupdate',
        wear: null,
      });
      this.dispatchEvent({
        type: 'wearupdate',
        app,
        wear: null,
      });
    }
  }
  grab(object) {
    const renderer = getRenderer();
    const {position, quaternion} = renderer.xr.getSession() ? useLocalPlayer().leftHand : camera;

    object.updateMatrixWorld();
    object.savedRotation = object.rotation.clone();
    object.startQuaternion = quaternion.clone();

    this.grabs[0] = {
      instanceId: object.instanceId,
      matrix: localMatrix.copy(object.matrixWorld)
        .premultiply(localMatrix2.compose(position, quaternion, localVector.set(1, 1, 1)).invert())
        .toArray(),
    };
    
    const physicsObjects = object.getPhysicsObjects();
    for (const physicsObject of physicsObjects) {
      // physx.physxWorker.disableGeometryPhysics(physx.physics, physicsObject.physicsId);
      physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
    }
  }
  ungrab() {
    const grabSpec = this.grabs[0];
    if (grabSpec) {
      const object = world.appManager.getObjects().find(object => object.instanceId === grabSpec.instanceId);
      const physicsObjects = object.getPhysicsObjects();
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

export {
  LocalPlayer,
  RemotePlayer,
};