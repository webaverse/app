import * as THREE from './three.module.js';
import uiManager from './ui-manager.js';
import {renderer, camera, dolly} from './app-object.js';
import geometryManager from './geometry-manager.js';
import cameraManager from './camera-manager.js';
import ioManager from './io-manager.js';
// import {makeAnimalFactory} from './animal.js';
import {rigManager} from './rig.js';
import {getNextPhysicsId} from './util.js';

const leftQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0));

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localObject = new THREE.Object3D();

const zeroVector = new THREE.Vector3(0, 0, 0);

const physicsManager = new EventTarget();

const velocity = new THREE.Vector3();
physicsManager.velocity = velocity;

// used for hookshot-style navigation
const offset = new THREE.Vector3();
physicsManager.offset = offset;

let jumpState = false;
let jumpStartTime = 0;
const getJumpState = () => jumpState;
physicsManager.getJumpState = getJumpState;
const getJumpStartTime = () => jumpStartTime;
physicsManager.getJumpStartTime = getJumpStartTime;
const jump = () => {
  jumpState = true;
  jumpStartTime = Date.now();
  physicsManager.velocity.y += 5;
};
physicsManager.jump = jump;

let flyState = false;
let flyStartTime = 0;
const getFlyState = () => flyState;
physicsManager.getFlyState = getFlyState;
const setFlyState = newFlyState => {
  const now = Date.now();
  flyState = newFlyState;
  flyStartTime = now;
  if (newFlyState) {
    if (!jumpState) {
      jump();
    }
  } else {
    jumpStartTime = now;
  }
  glideState = false;
};
physicsManager.setFlyState = setFlyState;
const getFlyStartTime = () => flyStartTime;
physicsManager.getFlyStartTime = getFlyStartTime;

let glideState = false;
const getGlideState = () => glideState;
physicsManager.getGlideState = getGlideState;
const setGlide = newGlideState => {
  glideState = newGlideState;
};
physicsManager.setGlide = setGlide;

const physicsObjects = {};
const physicsUpdates = [];
const _makePhysicsObject = () => ({
  position: new THREE.Vector3(),
  quaternion: new THREE.Quaternion(),
});

physicsManager.addBoxGeometry = (position, quaternion, size, dynamic) => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addBoxGeometryPhysics(geometryManager.physics, position, quaternion, size, physicsId, dynamic);
  physicsObjects[physicsId] = _makePhysicsObject();
  return physicsId;
};

physicsManager.addGeometry = mesh => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addGeometryPhysics(geometryManager.physics, mesh, physicsId);
  physicsObjects[physicsId] = _makePhysicsObject();
  return physicsId;
};
physicsManager.cookGeometry = mesh => geometryManager.geometryWorker.cookGeometryPhysics(geometryManager.physics, mesh);
physicsManager.addCookedGeometry = (buffer, position, quaternion) => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addCookedGeometryPhysics(geometryManager.physics, buffer, position, quaternion, physicsId);
  physicsObjects[physicsId] = _makePhysicsObject();
  return physicsId;
};

physicsManager.addConvexGeometry = mesh => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addConvexGeometryPhysics(geometryManager.physics, mesh, physicsId);
  physicsObjects[physicsId] = _makePhysicsObject();
  return physicsId;
};
physicsManager.cookConvexGeometry = mesh => geometryManager.geometryWorker.cookConvexGeometryPhysics(geometryManager.physics, mesh);
physicsManager.addCookedConvexGeometry = (buffer, position, quaternion) => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addCookedConvexGeometryPhysics(geometryManager.physics, buffer, position, quaternion, physicsId);
  physicsObjects[physicsId] = _makePhysicsObject();
  return physicsId;
};

physicsManager.getGeometry = physicsId => geometryManager.geometryWorker.getGeometryPhysics(geometryManager.physics, physicsId);

physicsManager.disableGeometry = physicsId => {
  geometryManager.geometryWorker.disableGeometryPhysics(geometryManager.physics, physicsId);
};
physicsManager.enableGeometry = physicsId => {
  geometryManager.geometryWorker.enableGeometryPhysics(geometryManager.physics, physicsId);
};
physicsManager.disableGeometryQueries = physicsId => {
  geometryManager.geometryWorker.disableGeometryQueriesPhysics(geometryManager.physics, physicsId);
};
physicsManager.enableGeometryQueries = physicsId => {
  geometryManager.geometryWorker.enableGeometryQueriesPhysics(geometryManager.physics, physicsId);
};
physicsManager.removeGeometry = physicsId => {
  geometryManager.geometryWorker.removeGeometryPhysics(geometryManager.physics, physicsId);
};

physicsManager.raycast = (position, quaternion) => geometryManager.geometryWorker.raycastPhysics(geometryManager.physics, position, quaternion);
physicsManager.getPhysicsTransform = physicsId => physicsObjects[physicsId];
physicsManager.setPhysicsTransform = (physicsId, position, quaternion) => {
  const physicsObject = physicsObjects[physicsId];
  physicsObject.position.copy(position);
  physicsObject.quaternion.copy(quaternion);
  
  physicsUpdates.push({
    id: physicsId,
    position: physicsObject.position,
    quaternion: physicsObject.quaternion,
  });
};
physicsManager.simulatePhysics = timeDiff => {
  const updatesOut = geometryManager.geometryWorker.simulatePhysics(geometryManager.physics, physicsUpdates, timeDiff);
  physicsUpdates.length = 0;
  for (const updateOut of updatesOut) {
    const {id, position, quaternion} = updateOut;
    const physicsObject = physicsObjects[id];
    physicsObject.position.copy(position);
    physicsObject.quaternion.copy(quaternion);
  }
};

physicsManager.getRigTransforms = () => rigManager.getRigTransforms();

/* const makeAnimal = null;
const animals = [];
physicsManager.animals = animals; */

const gravity = new THREE.Vector3(0, -9.8, 0);
const _applyGravity = timeDiff => {
  if (flyState) {
    physicsManager.velocity.multiplyScalar(0.9);
  } else {
    localVector.copy(gravity)
      .multiplyScalar(timeDiff);

    let gliding;
    if (glideState && physicsManager.velocity.y < 0) {
      const transforms = rigManager.getRigTransforms();

      localVector
        .add(
          localVector2.copy(transforms[0].position)
            .sub(transforms[1].position)
            .normalize()
            .applyQuaternion(leftQuaternion)
            .multiplyScalar(3)
        );
      physicsManager.velocity.y *= 0.95;
      gliding = true;
    } else {
      gliding = false;
    }
    physicsManager.velocity.add(localVector);

    if (!jumpState || gliding) {
      physicsManager.velocity.x *= 0.7;
      physicsManager.velocity.z *= 0.7;
    }

    const terminalVelocity = 50;
    const _clampToTerminalVelocity = v => Math.min(Math.max(v, -terminalVelocity), terminalVelocity);
    physicsManager.velocity.x = _clampToTerminalVelocity(physicsManager.velocity.x);
    physicsManager.velocity.z = _clampToTerminalVelocity(physicsManager.velocity.z);
    physicsManager.velocity.y = _clampToTerminalVelocity(physicsManager.velocity.y);
  }
};
const _getAvatarWorldObject = o => {
  const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
  o.matrix.copy(camera.matrixWorld)
    // .premultiply(dolly.matrix)
    .decompose(o.position, o.quaternion, o.scale);
  return o;
};
physicsManager.getAvatarWorldObject = _getAvatarWorldObject;
const _getAvatarCapsule = v => {
  v.set(0, -rigManager.localRig.height/2, 0);
  v.radius = 0.3;
  v.halfHeight = Math.max(rigManager.localRig.height/2 - v.radius, 0);
  return v;
};
physicsManager.getAvatarCapsule = _getAvatarCapsule;
const _getAvatarCameraOffset = () => {
  if (renderer.xr.getSession()) {
    return zeroVector;
  } else {
    const selectedTool = cameraManager.getTool();
    if (selectedTool === 'firstperson') {
      return zeroVector;
    } else if (selectedTool === 'thirdperson') {
      return cameraManager.thirdPersonCameraOffset;
    } else if (selectedTool === 'isometric') {
      return cameraManager.isometricCameraOffset;
    } else if (selectedTool === 'birdseye') {
      return new THREE.Vector3(0, -cameraManager.birdsEyeHeight + cameraManager.getAvatarHeight(), 0);
    } else {
      return zeroVector;
    }
  }
};
physicsManager.getAvatarCameraOffset = _getAvatarCameraOffset;
const _applyAvatarPhysics = (camera, avatarOffset, cameraBasedOffset, velocityAvatarDirection, updateRig, timeDiff) => {
  const oldVelocity = localVector3.copy(physicsManager.velocity);

  applyVelocity(camera.position, physicsManager.velocity, timeDiff);

  camera.position.add(physicsManager.offset);
  physicsManager.offset.setScalar(0);

  camera.updateMatrixWorld();
  camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  localVector4.copy(avatarOffset);
  if (cameraBasedOffset) {
    localVector4.applyQuaternion(localQuaternion);
  }
  localVector.add(localVector4);
  const collision = _collideCapsule(localVector, localQuaternion2.set(0, 0, 0, 1));
  if (velocityAvatarDirection && oldVelocity.lengthSq() > 0) {
    localQuaternion.setFromUnitVectors(localVector4.set(0, 0, -1), localVector5.set(oldVelocity.x, 0, oldVelocity.z).normalize());
  }

  if (collision) {
    localVector4.fromArray(collision.direction);
    camera.position.add(localVector4);
    localVector.add(localVector4);
    if (collision.grounded) {
      physicsManager.velocity.y = 0;
      jumpState = false;
      jumpStartTime = 0;
      glideState = false;
    } else if (!jumpState) {
      jumpState = true;
      jumpStartTime = Date.now();
    }
  } else if (!jumpState) {
    jumpState = true;
    jumpStartTime = Date.now();
  }
  localMatrix.compose(localVector, localQuaternion, localVector2);

  rigManager.setLocalRigMatrix(updateRig ? localMatrix : null);

  if (rigManager.localRig) {
    if (jumpState) {
      rigManager.localRig.setFloorHeight(-0xFFFFFF);
    } else {
      rigManager.localRig.setFloorHeight(localVector.y - cameraManager.getAvatarHeight());
    }
    /* if (glideState) {
      rigManager.localRig.setGlide(glideState);
    } */
  }

  _collideItems(localMatrix);
  // _collideChunk(localMatrix);
  // camera.updateMatrixWorld();
};
const _collideCapsule = (() => {
  const localVector = new THREE.Vector3();
  return (p, q) => {
    _getAvatarCapsule(localVector);
    localVector.add(p);
    return geometryManager.geometryWorker.collidePhysics(geometryManager.physics, localVector.radius, localVector.halfHeight, localVector, q, 1);
  };
})();
const applyVelocity = (() => {
  const localVector = new THREE.Vector3();
  return (position, velocity, timeDiff) => {
    position.add(localVector.copy(velocity).multiplyScalar(timeDiff));
  };
})();
physicsManager.applyVelocity = applyVelocity;
const _collideItems = matrix => {
  matrix.decompose(localVector3, localQuaternion2, localVector4);

  uiManager.hpMesh.position.lerp(localVector4.copy(localVector3).add(localVector5.set(0, 0.25, -1).applyQuaternion(localQuaternion2)), 0.1);
  uiManager.hpMesh.quaternion.slerp(localQuaternion2, 0.1);

  if (uiManager.popupMesh.visible) {
    uiManager.popupMesh.position.lerp(localVector4.copy(localVector3).add(localVector5.set(0, -0.25, -1).applyQuaternion(localQuaternion2)), 0.1);
    uiManager.popupMesh.quaternion.slerp(localQuaternion2, 0.1);
  }

  geometryManager.updatePhysics(localVector3);
};
/* const _collideChunk = matrix => {
  matrix.decompose(localVector3, localQuaternion2, localVector4);
  geometryManager.currentChunkMesh.update(localVector3);
}; */

physicsManager.setGravity = g => {
  if (g === true) {
    gravity.set(0, -9.8, 0);
  } else if (g === false) {
    gravity.setScalar(0);
  } else {
    gravity.copy(g);
  }
};

const _copyPQS = (dst, src) => {
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dst.scale.copy(src.scale);
};
const _updatePhysics = timeDiff => {
  const avatarWorldObject = _getAvatarWorldObject(localObject);
  const avatarCameraOffset = _getAvatarCameraOffset();

  if (renderer.xr.getSession()) {
    _applyGravity(timeDiff);

    if (ioManager.currentWalked || jumpState) {
      const originalPosition = avatarWorldObject.position.clone();

      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, false, false, false, timeDiff);

      dolly.position.add(
        avatarWorldObject.position.clone().sub(originalPosition)
      );
    } else {
      physicsManager.velocity.y = 0;
      _collideItems(avatarWorldObject.matrix);
      // _collideChunk(avatarWorldObject.matrix);
      rigManager.setLocalRigMatrix(null);
    }
  } else {
    const selectedTool = cameraManager.getTool();
    if (selectedTool === 'camera') {
      // nothing
    } else if (selectedTool === 'firstperson') {
      _applyGravity(timeDiff);
      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, false, false, false, timeDiff);
      _copyPQS(camera, avatarWorldObject);
      camera.updateMatrixWorld();
    } else if (selectedTool === 'thirdperson') {
      _applyGravity(timeDiff);
      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, false, true, timeDiff);
      _copyPQS(camera, avatarWorldObject);
    } else if (selectedTool === 'isometric') {
      _applyGravity(timeDiff);
      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, true, true, timeDiff);
      _copyPQS(camera, avatarWorldObject);
    } else if (selectedTool === 'birdseye') {
      _applyGravity(timeDiff);
      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, false, true, true, timeDiff);
      _copyPQS(camera, avatarWorldObject);
    } else {
      throw new Error('invalid camera mode: ' + selectedTool);
      /* _applyGravity(timeDiff);
      _collideItems(avatarWorldObject.matrix);
      // _collideChunk(avatarWorldObject.matrix);
      rigManager.setLocalRigMatrix(null); */
    }
  }

  /* const _updateAnimals = () => {
    for (const animal of animals) {
      animal.update();
    }
  };
  _updateAnimals(); */
};
physicsManager.update = _updatePhysics;

document.getElementById('key-f').addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();

  physicsManager.setFlyState(!physicsManager.getFlyState());
});

export default physicsManager;