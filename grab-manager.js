import * as THREE from 'three';
import ioManager from './io-manager.js';
import {playersManager} from './players-manager.js';
import physicsManager from './physics-manager.js';
import metaversefileApi from './metaversefile-api.js';
import * as metaverseModules from './metaverse-modules.js';
import {maxGrabDistance} from './constants.js';
import {getRenderer, sceneLowPriority, camera} from './renderer.js';
import cameraManager from './camera-manager.js';
import gameManager from './game.js';
import { world } from './world.js';
import {makeHighlightPhysicsMesh, snapPosition} from './util.js';
import {buildMaterial} from './shaders.js';


const physicsScene = physicsManager.getScene();


const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localVector8 = new THREE.Vector3();
const localVector9 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localQuaternion4 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
// const localBox = new THREE.Box3();
const localRay = new THREE.Ray();



const rotationSnap = Math.PI/6;
const highlightPhysicsMesh = makeHighlightPhysicsMesh(buildMaterial);
highlightPhysicsMesh.visible = false;
sceneLowPriority.add(highlightPhysicsMesh);
let highlightedPhysicsObject = null;
let highlightedPhysicsId = 0;
let grabUseMesh = null;

const init = () => {
  grabUseMesh = metaversefileApi.createApp();
  (async () => {
    await metaverseModules.waitForLoad();
    const {modules} = metaversefileApi.useDefaultModules();
    const m = modules['button'];
    await grabUseMesh.addModule(m);
  })();
  grabUseMesh.targetApp = null;
  grabUseMesh.targetPhysicsId = -1;
  sceneLowPriority.add(grabUseMesh);
}
Promise.resolve()
  .then(init);

const _updateGrabbedObject = (o, grabMatrix, offsetMatrix, {collisionEnabled, handSnapEnabled, gridSnap}) => {
  grabMatrix.decompose(localVector, localQuaternion, localVector2);
  offsetMatrix.decompose(localVector3, localQuaternion2, localVector4);
  const offset = localVector3.length();
  localMatrix.multiplyMatrices(grabMatrix, offsetMatrix)
    .decompose(localVector5, localQuaternion3, localVector6);


  const collision = collisionEnabled && physicsScene.raycast(localVector, localQuaternion);
  localQuaternion4.setFromAxisAngle(localVector8.set(1, 0, 0), -Math.PI * 0.5);
  const downCollision = collisionEnabled && physicsScene.raycast(localVector5, localQuaternion4);
  
  if(collision) {
    const {point} = collision;
    localVector9.fromArray(point);
  }

  if(downCollision) {
    const {point} = downCollision;
    localVector7.fromArray(point);
    if (ioManager.keys.shift) {
      o.position.copy(localVector5.setY(localVector7.y));
    } else {
      if(localVector.distanceTo(localVector9) < offset && localVector7.y < localVector9.y) localVector5.copy(localVector9);
      if(localVector5.y < localVector7.y) localVector5.setY(localVector7.y);
      o.position.copy(localVector5);
    }
  }

  const handSnap = !handSnapEnabled || offset >= maxGrabDistance || !!downCollision;
  if (handSnap) {
    snapPosition(o, gridSnap);
    o.quaternion.setFromEuler(o.savedRotation);
  } else {
    o.quaternion.copy(localQuaternion3);
  }

  o.updateMatrixWorld();

  return {
    handSnap,
  };
}

const _delete = () => {
  const grabbedObject = grabManager.getGrabbedObject(0);
  const mouseSelectedObject = gameManager.getMouseSelectedObject();
  if (grabbedObject) {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.ungrab();
    world.appManager.removeTrackedApp(grabbedObject.instanceId);
  } else if (highlightedPhysicsObject) {
    world.appManager.removeTrackedApp(highlightedPhysicsObject.instanceId);
    highlightedPhysicsObject = null;
  } else if (mouseSelectedObject) {
    world.appManager.removeTrackedApp(mouseSelectedObject.instanceId);
    if (mouseHoverObject === mouseSelectedObject) {
      gameManager.setMouseHoverObject(null);
    }
    gameManager.setMouseSelectedObject(null);
  }
};

const _click = e => {
  if (grabManager.getGrabbedObject(0)) {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.ungrab();
  } else {
    if (highlightedPhysicsObject) {
      grabManager.grab(highlightedPhysicsObject);
    }
  }
};

class Grabmanager extends EventTarget {
  constructor() {
    super();
    this.gridSnap = 0;
    this.editMode = false;
  }
  grab(object) {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.grab(object);
    
    this.gridSnap = 0;
    this.editMode = false;
  }
  getGrabUseMesh() {
    return grabUseMesh;
  }
  getGrabAction(i) {
    const targetHand = i === 0 ? 'left' : 'right';
    const localPlayer = playersManager.getLocalPlayer();
    const grabAction = localPlayer.findAction(action => action.type === 'grab' && action.hand === targetHand);
    return grabAction;
  }
  getGrabbedObject(i) {
    const grabAction = this.getGrabAction(i);
    const grabbedObjectInstanceId = grabAction?.instanceId;
    const result = grabbedObjectInstanceId ? metaversefileApi.getAppByInstanceId(grabbedObjectInstanceId) : null;
    return result;
  }
  async toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      if (!cameraManager.pointerLockElement) {
        await cameraManager.requestPointerLock();
      }
      if (gameManager.getMouseSelectedObject()) {
        gameManager.setMouseSelectedObject(null);
      }
      if (this.getGrabbedObject(0)) {
        const localPlayer = playersManager.getLocalPlayer();
        localPlayer.ungrab();
      } 
    }
  }
  menuClick(e) {
    _click(e);
  }
  menuDelete() {
    _delete();
  }
  menuGridSnap() {
    if (this.gridSnap === 0) {
      this.gridSnap = 32;
    } else if (this.gridSnap > 1) {
      this.gridSnap /= 2;
    } else {
      this.gridSnap = 0;
    }
  }
  getGridSnap() {
    if (this.gridSnap === 0) {
      return 0;
    } else {
      return 4/this.gridSnap;
    }
  }
  // canGrab() {
  //   return !!highlightedObject;
  // }
  canRotate() {
    return !!this.getGrabbedObject(0);
  }
  menuRotate(direction) {
    const object = this.getGrabbedObject(0);
    object.savedRotation.y -= direction * rotationSnap;
  }
  canPush() {
    return !!this.getGrabbedObject(0);
  }
  menuPush(direction) {
    const localPlayer = playersManager.getLocalPlayer();
    const grabAction = localPlayer.findAction(action => action.type === 'grab' && action.hand === 'left');
    if (grabAction) {
      const matrix = localMatrix.fromArray(grabAction.matrix);
      matrix
        .decompose(localVector, localQuaternion, localVector2);
      localVector.z += direction * 0.1;
      matrix
        .compose(localVector, localQuaternion, localVector2)
        .toArray(grabAction.matrix);
    } else {
      console.warn('trying to push with no grab object');
    }
  }

  update(timestamp, timeDiff) {
    const renderer = getRenderer();
    const localPlayer = playersManager.getLocalPlayer();
    
    const _updateGrab = () => {
      const _isWear = o => localPlayer.findAction(action => action.type === 'wear' && action.instanceId === o.instanceId);
      grabUseMesh.visible = false;
      if (!this.editMode) {
        const avatarHeight = localPlayer.avatar ? localPlayer.avatar.height : 0;
        localVector.copy(localPlayer.position)
          .add(localVector2.set(0, avatarHeight * (1 - localPlayer.getCrouchFactor()) * 0.5, -0.3)
          .applyQuaternion(localPlayer.quaternion));

        const radius = 1;
        const halfHeight = 0.1;
        const collision = physicsScene.getCollisionObject(radius, halfHeight, localVector, localPlayer.quaternion);
        if (collision) {
          const physicsId = collision.objectId;
          const object = metaversefileApi.getAppByPhysicsId(physicsId);
          // console.log('got collision', physicsId, object);
          const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(physicsId);
          if (object && !_isWear(object) && physicsObject) {
            grabUseMesh.position.setFromMatrixPosition(physicsObject.physicsMesh.matrixWorld);
            grabUseMesh.quaternion.copy(camera.quaternion);
            grabUseMesh.updateMatrixWorld();
            grabUseMesh.targetApp = object;
            grabUseMesh.targetPhysicsId = physicsId;
            grabUseMesh.setComponent('value', localPlayer.actionInterpolants.activate.getNormalized());
            
            grabUseMesh.visible = true;
          }
        }
      }

      for (let i = 0; i < 2; i++) {
        const grabAction = this.getGrabAction(i);
        const grabbedObject = this.getGrabbedObject(i);
        if (grabbedObject && !_isWear(grabbedObject)) {

          const avatarHeight = localPlayer.avatar ? localPlayer.avatar.height : 0;
          let position   = null,
              quaternion = null;
          if(renderer.xr.getSession()) {
            const h = localPlayer[hand === 'left' ? 'leftHand' : 'rightHand'];
            position = h.position;
            quaternion = h.quaternion;
          } else {
            position = localVector2.copy(localPlayer.position).add(localVector3.set(0, avatarHeight, 0));
            quaternion = camera.quaternion;
          }

          localMatrix.compose(position, quaternion, localVector.set(1, 1, 1));

          _updateGrabbedObject(grabbedObject, localMatrix, localMatrix3.fromArray(grabAction.matrix), {
            collisionEnabled: true,
            handSnapEnabled: true,
            gridSnap: this.getGridSnap(),
          });

          grabUseMesh.setComponent('value', localPlayer.actionInterpolants.activate.getNormalized());
        }
      }
    }
    _updateGrab();

    const _handlePush = () => {
      if (this.canPush()) {
        if (ioManager.keys.forward) {
          this.menuPush(-1);
        } else if (ioManager.keys.backward) {
          this.menuPush(1);
        }
      }
    };
    _handlePush();

    const _handlePhysicsHighlight = () => {
      highlightedPhysicsObject = null;
  
      if (this.editMode) {
        const {position, quaternion} = renderer.xr.getSession() ? localPlayer.leftHand : camera;
        const collision = physicsScene.raycast(position, quaternion);
        if (collision) {
          const physicsId = collision.objectId;
          highlightedPhysicsObject = metaversefileApi.getAppByPhysicsId(physicsId);
          highlightedPhysicsId = physicsId;
        }
      }
    };
    _handlePhysicsHighlight();
  
    const _updatePhysicsHighlight = () => {
      highlightPhysicsMesh.visible = false;
  
      if (highlightedPhysicsObject) {
        const physicsId = highlightedPhysicsId;
  
        highlightedPhysicsObject.updateMatrixWorld();
  
        const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(physicsId);
        if (physicsObject) {
          const {physicsMesh} = physicsObject;
          highlightPhysicsMesh.geometry = physicsMesh.geometry;
          highlightPhysicsMesh.matrixWorld.copy(physicsMesh.matrixWorld)
            .decompose(highlightPhysicsMesh.position, highlightPhysicsMesh.quaternion, highlightPhysicsMesh.scale);
  
          highlightPhysicsMesh.material.uniforms.uTime.value = (timestamp%1500)/1500;
          highlightPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
          highlightPhysicsMesh.material.uniforms.uColor.value.setHex(buildMaterial.uniforms.uColor.value.getHex());
          highlightPhysicsMesh.material.uniforms.uColor.needsUpdate = true;
          highlightPhysicsMesh.visible = true;
          highlightPhysicsMesh.updateMatrixWorld();
        }
      }
    };
    _updatePhysicsHighlight();
  }
}

const grabManager = new Grabmanager();
export default grabManager;