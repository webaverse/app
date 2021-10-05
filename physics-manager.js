import * as THREE from 'three';
import uiManager from './ui-manager.js';
import {getRenderer, camera, dolly} from './app-object.js';
import geometryManager from './geometry-manager.js';
import cameraManager from './camera-manager.js';
import ioManager from './io-manager.js';
// import {makeAnimalFactory} from './animal.js';
import {rigManager} from './rig.js';
import metaversefileApi from './metaversefile-api.js';
import {getNextPhysicsId, convertMeshToPhysicsMesh} from './util.js';

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

/* let jumpState = false;
let jumpTime = -1;
const getJumpState = () => jumpState;
physicsManager.getJumpState = getJumpState;
const getJumpTime = () => jumpTime;
physicsManager.getJumpTime = getJumpTime;
const jump = () => {
  jumpState = true;
  jumpTime = 0;
  sitState = false;
  physicsManager.velocity.y += 5;
};
physicsManager.jump = jump;

let flyState = false;
let flyTime = -1;
const getFlyState = () => flyState;
physicsManager.getFlyState = getFlyState;
const setFlyState = newFlyState => {
  const now = Date.now();
  flyState = newFlyState;
  if (newFlyState) {
    flyTime = 0;
    if (!jumpState) {
      jump();
    }
  } else {
    flyTime = -1;
    jumpTime = 0;
  }
  glideState = false;
};
physicsManager.setFlyState = setFlyState;
const getFlyTime = () => flyTime;
physicsManager.getFlyTime = getFlyTime;

let glideState = false;
const getGlideState = () => glideState;
physicsManager.getGlideState = getGlideState;
const setGlide = newGlideState => {
  glideState = newGlideState;
};
physicsManager.setGlide = setGlide;

let sitState = false;
const getSitState = () => sitState;
physicsManager.getSitState = getSitState;
const setSitState = newSitState => {
  sitState = newSitState;
};
physicsManager.setSitState = setSitState; */

let damping;
const setDamping = (newDamping = 0.7) => {
  damping = newDamping;
};
setDamping();
physicsManager.setDamping = setDamping;

let sitTarget = null;
const getSitTarget = () => sitTarget;
physicsManager.getSitTarget = getSitTarget;
const setSitTarget = newSitTarget => {
  sitTarget = newSitTarget;
};
physicsManager.setSitTarget = setSitTarget;
let sitOffset = new THREE.Vector3();
const setSitOffset = newSitOffset => {
  sitOffset.fromArray(newSitOffset);
};
physicsManager.setSitOffset = setSitOffset;

let sitController = null;
const getSitController = () => sitController;
physicsManager.getSitController = getSitController;
const setSitController = newSitController => {
  sitController = newSitController;
};
physicsManager.setSitController = setSitController;

/* let useTime = -1;
const getUseTime = () => useTime;
physicsManager.getUseTime = getUseTime;
const startUse = () => {
  useTime = 0;
};
physicsManager.startUse = startUse;
const stopUse = () => {
  useTime = -1;
};
physicsManager.stopUse = stopUse;

let danceState = null;
let danceTime = 0;
const getDanceState = () => danceState;
physicsManager.getDanceState = getDanceState;
const getDanceTime = () => danceTime;
physicsManager.getDanceTime = getDanceTime;
const setDanceState = newDanceState => {
  danceState = newDanceState;
  if (danceState) {
    danceTime = 0;
  }
};
physicsManager.setDanceState = setDanceState;

let throwState = null;
let throwTime = 0;
const getThrowState = () => throwState;
physicsManager.getThrowState = getThrowState;
const getThrowTime = () => throwTime;
physicsManager.getThrowTime = getThrowTime;
const setThrowState = newThrowState => {
  throwState = newThrowState;
  if (throwState) {
    throwTime = 0;
  }
};
physicsManager.setThrowState = setThrowState;

let crouchState = false;
let crouchTime = 1000;
const getCrouchState = () => crouchState;
physicsManager.getCrouchState = getCrouchState;
const getCrouchTime = () => crouchTime;
physicsManager.getCrouchTime = getCrouchTime;
physicsManager.setCrouchState = newCrouchState => {
  crouchState = newCrouchState;
  crouchTime = 0;
}; */

const physicsObjects = {};
const physicsUpdates = [];
const _makePhysicsObject = (position, quaternion, scale) => ({
  position: position.clone(),
  quaternion: quaternion.clone(),
  scale: scale.clone(),
});

physicsManager.addBoxGeometry = (position, quaternion, size, dynamic) => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addBoxGeometryPhysics(geometryManager.physics, position, quaternion, size, physicsId, dynamic);
  const physicsObject = _makePhysicsObject(position, quaternion, size);
  physicsObjects[physicsId] = physicsObject;
  /* physicsManager.dispatchEvent(new MessageEvent('physicsobjectadd', {
    data: {
      physicsId,
      // physicsObject
    },
  })); */
  return physicsId;
};

physicsManager.addGeometry = mesh => {
  mesh.updateMatrixWorld();
  mesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addGeometryPhysics(geometryManager.physics, mesh, physicsId);
  const physicsObject = _makePhysicsObject(localVector, localQuaternion, localVector2);
  physicsObjects[physicsId] = physicsObject;
  /* physicsManager.dispatchEvent(new MessageEvent('physicsobjectadd', {
    data: {
      physicsId,
      // physicsObject,
    },
  })); */
  return physicsId;
};
physicsManager.cookGeometry = mesh => geometryManager.geometryWorker.cookGeometryPhysics(geometryManager.physics, mesh);
physicsManager.addCookedGeometry = (buffer, position, quaternion, scale) => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addCookedGeometryPhysics(geometryManager.physics, buffer, position, quaternion, scale, physicsId);
  const physicsObject = _makePhysicsObject(position, quaternion, scale);
  physicsObjects[physicsId] = physicsObject;
  physicsManager.dispatchEvent(new MessageEvent('physicsobjectadd', {
    data: {
      physicsId,
      // physicsObject,
    },
  }));
  return physicsId;
};

physicsManager.addConvexGeometry = mesh => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addConvexGeometryPhysics(geometryManager.physics, mesh, physicsId);
  const physicsObject = _makePhysicsObject(mesh.position, mesh.quaternion, mesh.scale);
  physicsObjects[physicsId] = physicsObject;
  /* physicsManager.dispatchEvent(new MessageEvent('physicsobjectadd', {
    data: {
      physicsId,
      // physicsObject,
    },
  })); */
  return physicsId;
};
physicsManager.cookConvexGeometry = mesh => geometryManager.geometryWorker.cookConvexGeometryPhysics(geometryManager.physics, mesh);
physicsManager.addCookedConvexGeometry = (buffer, position, quaternion, scale) => {
  const physicsId = getNextPhysicsId();
  geometryManager.geometryWorker.addCookedConvexGeometryPhysics(geometryManager.physics, buffer, position, quaternion, scale, physicsId);
  const physicsObject = _makePhysicsObject(position, quaternion, scale);
  physicsObjects[physicsId] = physicsObject;
  /* physicsManager.dispatchEvent(new MessageEvent('physicsobjectadd', {
    data: {
      physicsId,
      // physicsObject,
    },
  })); */
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
physicsManager.setPhysicsTransform = (physicsId, position, quaternion, scale) => {
  const physicsObject = physicsObjects[physicsId];
  physicsObject.position.copy(position);
  physicsObject.quaternion.copy(quaternion);
  physicsObject.scale.copy(scale);
  
  physicsUpdates.push({
    id: physicsId,
    position: physicsObject.position,
    quaternion: physicsObject.quaternion,
    scale: physicsObject.scale,
  });
};
physicsManager.simulatePhysics = timeDiff => {
  const t = timeDiff/1000;
  // console.log('simulate', timeDiff, t);
  const updatesOut = geometryManager.geometryWorker.simulatePhysics(geometryManager.physics, physicsUpdates, t);
  physicsUpdates.length = 0;
  for (const updateOut of updatesOut) {
    const {id, position, quaternion, scale} = updateOut;
    const physicsObject = physicsObjects[id];
    physicsObject.position.copy(position);
    physicsObject.quaternion.copy(quaternion);
    physicsObject.scale.copy(scale);
  }
};

physicsManager.getRigTransforms = () => rigManager.getRigTransforms();

/* const makeAnimal = null;
const animals = [];
physicsManager.animals = animals; */

const gravity = new THREE.Vector3(0, -9.8, 0);
const _applyGravity = timeDiff => {
  if (rigManager.localRig) {
    // let gliding;
    const localPlayer = metaversefileApi.useLocalPlayer();
    const isFlying = localPlayer.actions.some(action => action.type === 'fly');
    if (isFlying) {
      physicsManager.velocity.multiplyScalar(0.9);
      // gliding = false;
    } else {
      localVector.copy(gravity)
        .multiplyScalar(timeDiff);

      /* if (glideState && physicsManager.velocity.y < 0) {
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
      } else { */
        // gliding = false;
      // }
      physicsManager.velocity.add(localVector);
    }
    
    if (!localPlayer.actions.some(action => action.type === 'fly') && !localPlayer.actions.some(action => action.type === 'jump') /*!jumpState || gliding*/) {
      physicsManager.velocity.x *= damping;
      physicsManager.velocity.z *= damping;
    }

    /* const terminalVelocity = 50;
    const _clampToTerminalVelocity = v => Math.min(Math.max(v, -terminalVelocity), terminalVelocity);
    physicsManager.velocity.x = _clampToTerminalVelocity(physicsManager.velocity.x);
    physicsManager.velocity.z = _clampToTerminalVelocity(physicsManager.velocity.z);
    physicsManager.velocity.y = _clampToTerminalVelocity(physicsManager.velocity.y); */
  }
};
const _getAvatarWorldObject = o => {
  const renderer = getRenderer();
  const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
  o.matrix.copy(camera.matrixWorld)
    // .premultiply(dolly.matrix)
    .decompose(o.position, o.quaternion, o.scale);
  return o;
};
physicsManager.getAvatarWorldObject = _getAvatarWorldObject;

const crouchMaxTime = 200;
const getAvatarCrouchFactor = () => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  const crouchAction = localPlayer.actions.find(action => action.type === 'crouch');
  if (crouchAction) {
    return Math.min(Math.max(crouchAction.time, 0), crouchMaxTime) / crouchMaxTime;
  } else {
    return 1;
  }
};
const getAvatarHeight = () => {
  if (rigManager.localRig) {
    const f = getAvatarCrouchFactor();
    let startValue, endValue;
    const localPlayer = metaversefileApi.useLocalPlayer();
    const isCrouched = localPlayer.actions.some(action => action.type === 'crouch');
    if (isCrouched) {
      startValue = rigManager.localRig.height;
      endValue = rigManager.localRig.height * 0.6;
    } else {
      startValue = rigManager.localRig.height * 0.6;
      endValue = rigManager.localRig.height;
    }
    return startValue*(1-f) + endValue*f;
  } else {
    return 0;
  }
};
physicsManager.getAvatarHeight = getAvatarHeight;

const _getAvatarCapsule = v => {
  v.set(0, -getAvatarHeight() * 0.5, 0); // XXX use the proper crouch height
  v.radius = 0.3;
  v.halfHeight = Math.max(rigManager.localRig ? (rigManager.localRig.height/2 - v.radius) : 0, 0);
  return v;
};
physicsManager.getAvatarCapsule = _getAvatarCapsule;
const _getAvatarCameraOffset = () => {
  const renderer = getRenderer();
  if (renderer.xr.getSession()) {
    return zeroVector;
  } else {
    return cameraManager.getCameraOffset();
  }
};
physicsManager.getAvatarCameraOffset = _getAvatarCameraOffset;
const _applyAvatarPhysics = (camera, avatarOffset, cameraBasedOffset, velocityAvatarDirection, updateRig, timeDiff) => {
  // apply offset
  camera.position.add(physicsManager.offset);
  physicsManager.offset.setScalar(0);

  // capsule physics
  const localPlayer = metaversefileApi.useLocalPlayer();
  if (!localPlayer.actions.some(action => action.type === 'sit')) {
    applyVelocity(camera.position, physicsManager.velocity, timeDiff);

    camera.updateMatrixWorld();
    camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);

    localVector4.copy(avatarOffset);
    if (cameraBasedOffset) {
      localVector4.applyQuaternion(localQuaternion);
    }
    localVector.add(localVector4);
    if (localVector.y < 0) {
      const deltaY = -localVector.y + 1;
      localVector.y += deltaY;
      camera.position.y += deltaY;
      camera.updateMatrixWorld();
    }
    const collision = _collideCapsule(localVector, localQuaternion2.set(0, 0, 0, 1));
    if (velocityAvatarDirection && physicsManager.velocity.lengthSq() > 0) {
      localQuaternion.setFromUnitVectors(localVector4.set(0, 0, -1), localVector5.set(physicsManager.velocity.x, 0, physicsManager.velocity.z).normalize());
    }

    const jumpActionIndex = localPlayer.actions.findIndex(action => action.type === 'jump');
    const _ensureJumpAction = () => {
      if (jumpActionIndex === -1) {
        const jumpAction = {
          type: 'jump',
          time: 0,
        };
        localPlayer.actions.push(jumpAction);
      } else {
        const jumpAction = localPlayer.actions[jumpActionIndex];
        jumpAction.time = 0;
      }
    };
    const _ensureNoJumpAction = () => {
      if (jumpActionIndex !== -1) {
        localPlayer.actions.splice(jumpActionIndex, 1);
      }
    };
    if (collision) {
      localVector4.fromArray(collision.direction);
      camera.position.add(localVector4);
      localVector.add(localVector4);
      if (collision.grounded) {
        physicsManager.velocity.y = 0;
        _ensureNoJumpAction();
      } else if (jumpActionIndex === -1) {
        _ensureJumpAction();
      }
    } else if (jumpActionIndex == -1 && physicsManager.velocity.y < -4) {
      _ensureJumpAction();
    }
  } else {
    physicsManager.velocity.y = 0;

    applyVelocity(sitController.position, physicsManager.velocity, timeDiff);
    if (physicsManager.velocity.lengthSq() > 0) {
      sitController.quaternion
        .setFromUnitVectors(
          localVector4.set(0, 0, -1),
          localVector5.set(physicsManager.velocity.x, 0, physicsManager.velocity.z).normalize()
        )
        .premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI));
    }
    sitController.updateMatrixWorld();

    localMatrix.copy(sitTarget.matrixWorld)
      .decompose(localVector, localQuaternion, localVector2);
    localVector.add(sitOffset);
    localVector.y += 1;
    localQuaternion.premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI));
    
    const offset = physicsManager.getAvatarCameraOffset();
    camera.position.copy(localVector)
      .sub(localVector3.copy(offset).applyQuaternion(camera.quaternion));
  }
  localMatrix.compose(localVector, localQuaternion, localVector2);

  // apply
  rigManager.setLocalRigMatrix(updateRig ? localMatrix : null);
  if (rigManager.localRig) {
    if (localPlayer.actions.some(action => action.type === 'jump')) {
      rigManager.localRig.setFloorHeight(-0xFFFFFF);
    } else {
      rigManager.localRig.setFloorHeight(localVector.y - getAvatarHeight());
    }
  }

  // collide items
  _collideItems(localMatrix);
};
const _collideCapsule = (() => {
  const localVector = new THREE.Vector3();
  return (p, q) => {
    _getAvatarCapsule(localVector);
    localVector.add(p);
    return geometryManager.geometryWorker.collidePhysics(geometryManager.physics, localVector.radius, localVector.halfHeight, localVector, q, 4);
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

  /* uiManager.hpMesh.position.lerp(localVector4.copy(localVector3).add(localVector5.set(0, 0.25, -1).applyQuaternion(localQuaternion2)), 0.1);
  uiManager.hpMesh.quaternion.slerp(localQuaternion2, 0.1); */

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

physicsManager.getGravity = () => gravity;
/* physicsManager.setGravity = g => {
  if (g === true) {
    gravity.set(0, -9.8, 0);
  } else if (g === false) {
    gravity.setScalar(0);
  } else {
    gravity.copy(g);
  }
}; */

physicsManager.convertMeshToPhysicsMesh = convertMeshToPhysicsMesh;

// const unlocked = true;
/* physicsManager.unlockControls = () => {
  debugger;
  unlocked = true;
}; */

const _copyPQS = (dst, src) => {
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dst.scale.copy(src.scale);
};
const _updatePhysics = timeDiff => {
  const localPlayer = metaversefileApi.useLocalPlayer();
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
  const useAction = localPlayer.actions.find(action => action.type === 'use');
  if (useAction) {
    useAction.time += timeDiff;
  }
  const crouchActionIndex = localPlayer.actions.findIndex(action => action.type === 'crouch');
  if (crouchActionIndex !== -1) {
    const crouchAction = localPlayer.actions[crouchActionIndex];
    if (crouchAction.direction === 'down') {
      crouchAction.time += timeDiff;
      crouchAction.time = Math.min(crouchAction.time, crouchMaxTime);
    } else if (crouchAction.direction === 'up') {
      crouchAction.time -= timeDiff;
      if (crouchAction.time < 0) {
        localPlayer.actions.splice(crouchActionIndex, 1);
      }
    }
  }

  timeDiff /= 1000; // XXX

  const avatarWorldObject = _getAvatarWorldObject(localObject);
  const avatarCameraOffset = _getAvatarCameraOffset();

  const renderer = getRenderer();
  if (renderer.xr.getSession()) {
    _applyGravity(timeDiff);

    if (ioManager.currentWalked || localPlayer.actions.some(action => action.type === 'jump')) {
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
    // if (unlocked) {
      const selectedTool = cameraManager.getMode();
      const localPlayer = metaversefileApi.useLocalPlayer();
      if (selectedTool === 'firstperson') {
        _applyGravity(timeDiff);
        _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, false, true, timeDiff);
        _copyPQS(camera, avatarWorldObject);
        camera.updateMatrixWorld();
      } else if (localPlayer.aimed || !!localPlayer.grabs[0]) {
        // console.log('yes', localPlayer.aimed, localPlayer.grabs[0]);
        _applyGravity(timeDiff);
        _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, false, true, timeDiff);
        _copyPQS(camera, avatarWorldObject);
        camera.updateMatrixWorld();
      } else if (selectedTool === 'isometric') {
        _applyGravity(timeDiff);
        _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, true, true, timeDiff);
        _copyPQS(camera, avatarWorldObject);
        camera.updateMatrixWorld();
      /* } else if (selectedTool === 'birdseye') {
        _applyGravity(timeDiff);
        _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, false, true, true, timeDiff);
        _copyPQS(camera, avatarWorldObject);
        camera.updateMatrixWorld(); */
      } else {
        throw new Error('invalid camera mode: ' + selectedTool);
      } 
    // }
  }
};
physicsManager.update = _updatePhysics;

export default physicsManager;
