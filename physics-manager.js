/*
physics manager is the interface to the physics engine.
it contains code for character capsules and world simulation.
*/

import * as THREE from 'three';
import {getRenderer, camera, dolly} from './renderer.js';
import physx from './physx.js';
import cameraManager from './camera-manager.js';
import ioManager from './io-manager.js';
import {getPlayerCrouchFactor} from './character-controller.js';
import metaversefileApi from 'metaversefile';
import {getNextPhysicsId, convertMeshToPhysicsMesh} from './util.js';
import {applyVelocity} from './util.js';
// import {groundFriction} from './constants.js';

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
const upVector = new THREE.Vector3(0, 1, 0);

const physicsManager = new EventTarget();

// const velocity = new THREE.Vector3();
// physicsManager.velocity = velocity;

const direction = new THREE.Vector3(0, 0, -1);
physicsManager.direction = direction;

// used for hookshot-style navigation
const offset = new THREE.Vector3();
physicsManager.offset = offset;

let sitTarget = null;
const getSitTarget = () => sitTarget;
physicsManager.getSitTarget = getSitTarget;
const setSitTarget = newSitTarget => {
  sitTarget = newSitTarget;
};
physicsManager.setSitTarget = setSitTarget;
let _sitOffset = new THREE.Vector3();
const setSitOffset = newSitOffset => {
  _sitOffset.fromArray(newSitOffset);
};
physicsManager.setSitOffset = setSitOffset;

let sitController = null;
const getSitController = () => sitController;
physicsManager.getSitController = getSitController;
const setSitController = newSitController => {
  sitController = newSitController;
};
physicsManager.setSitController = setSitController;

const physicsUpdates = [];
const _makePhysicsObject = (physicsId/*, position, quaternion, scale*/) => {
  const physicsObject = new THREE.Object3D();
  physicsObject.physicsId = physicsId;
  physicsObject.error = new Error().stack;
  return physicsObject;
};
const _extractPhysicsGeometryForId = physicsId => {
  const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId);
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(physicsGeometry.positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(physicsGeometry.indices, 1));
  geometry = geometry.toNonIndexed();
  geometry.computeVertexNormals();
  return geometry;
};

physicsManager.addCapsuleGeometry = (position, quaternion, radius, halfHeight, ccdEnabled) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addCapsuleGeometryPhysics(physx.physics, position, quaternion, radius, halfHeight, ccdEnabled);
  
  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, size);
  const physicsMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, radius, halfHeight*2)
  );
  physicsMesh.visible = false;
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  return physicsObject;
};

physicsManager.addBoxGeometry = (position, quaternion, size, dynamic) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addBoxGeometryPhysics(physx.physics, position, quaternion, size, physicsId, dynamic);
  
  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, size);
  const physicsMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2)
  );
  physicsMesh.visible = false;
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  return physicsObject;
};
physicsManager.addGeometry = mesh => {
  const physicsMesh = convertMeshToPhysicsMesh(mesh);
  if (mesh.parent) {
    mesh.parent.matrixWorld.decompose(
      physicsMesh.position,
      physicsMesh.quaternion,
      physicsMesh.scale
    );
    physicsMesh.updateMatrixWorld();
  }
  
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addGeometryPhysics(physx.physics, physicsMesh, physicsId);
  physicsMesh.geometry = _extractPhysicsGeometryForId(physicsId);
  
  const physicsObject = _makePhysicsObject(physicsId, localVector, localQuaternion, localVector2);
  physicsObject.add(physicsMesh);
  physicsMesh.position.set(0, 0, 0);
  physicsMesh.quaternion.set(0, 0, 0, 1);
  physicsMesh.scale.set(1, 1, 1);
  physicsMesh.updateMatrixWorld();
  physicsObject.physicsMesh = physicsMesh;
  return physicsObject;
};
physicsManager.cookGeometry = mesh => physx.physxWorker.cookGeometryPhysics(physx.physics, mesh);
physicsManager.addCookedGeometry = (buffer, position, quaternion, scale) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addCookedGeometryPhysics(physx.physics, buffer, position, quaternion, scale, physicsId);

  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, scale);
  const physicsMesh = new THREE.Mesh(_extractPhysicsGeometryForId(physicsId));
  physicsMesh.visible = false;
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  return physicsObject;
};

physicsManager.addConvexGeometry = mesh => {
  const physicsMesh = convertMeshToPhysicsMesh(mesh);
  if (mesh.parent) {
    mesh.parent.matrixWorld.decompose(
      physicsMesh.position,
      physicsMesh.quaternion,
      physicsMesh.scale
    );
    physicsMesh.updateMatrixWorld();
  }
  
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addConvexGeometryPhysics(physx.physics, physicsMesh, physicsId);
  physicsMesh.geometry = _extractPhysicsGeometryForId(physicsId);

  const physicsObject = _makePhysicsObject(physicsId, mesh.position, mesh.quaternion, mesh.scale);
  physicsObject.add(physicsMesh);
  physicsMesh.position.set(0, 0, 0);
  physicsMesh.quaternion.set(0, 0, 0, 1);
  physicsMesh.scale.set(1, 1, 1);
  physicsMesh.updateMatrixWorld();
  physicsObject.physicsMesh = physicsMesh;
  return physicsObject;
};
physicsManager.cookConvexGeometry = mesh => physx.physxWorker.cookConvexGeometryPhysics(physx.physics, mesh);
physicsManager.addCookedConvexGeometry = (buffer, position, quaternion, scale) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addCookedConvexGeometryPhysics(physx.physics, buffer, position, quaternion, scale, physicsId);
  
  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, scale);
  const physicsMesh = new THREE.Mesh(_extractPhysicsGeometryForId(physicsId));
  physicsMesh.visible = false;
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  return physicsObject;
};

physicsManager.getGeometryForPhysicsId = physicsId => physx.physxWorker.getGeometryPhysics(physx.physics, physicsId);
physicsManager.disablePhysicsObject = physicsObject => {
  physx.physxWorker.disableGeometryPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.enablePhysicsObject = physicsObject => {
  physx.physxWorker.enableGeometryPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.disableGeometryQueries = physicsObject => {
  physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.enableGeometryQueries = physicsObject => {
  physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.removeGeometry = physicsObject => {
  physx.physxWorker.removeGeometryPhysics(physx.physics, physicsObject.physicsId);
};

physicsManager.raycast = (position, quaternion) => physx.physxWorker.raycastPhysics(physx.physics, position, quaternion);
physicsManager.simulatePhysics = timeDiff => {
  const t = timeDiff/1000;
  // console.log('simulate', timeDiff, t);
  const updatesOut = physx.physxWorker.simulatePhysics(physx.physics, physicsUpdates, t);
  physicsUpdates.length = 0;
  for (const updateOut of updatesOut) {
    const {id, position, quaternion, scale} = updateOut;
    const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(id);
    physicsObject.position.copy(position);
    physicsObject.quaternion.copy(quaternion);
    // physicsObject.scale.copy(scale);
    physicsObject.updateMatrixWorld();
  }
};

physicsManager.pushUpdate = physicsObject => {
  const {physicsId, physicsMesh} = physicsObject;
  physicsMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);

  physicsUpdates.push({
    id: physicsId,
    position: localVector.clone(),
    quaternion: localQuaternion.clone(),
    scale: localVector2.clone(),
  });
};

physicsManager.getRigTransforms = () => rigManager.getRigTransforms();

const getAvatarHeight = () => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  return localPlayer.avatar ? localPlayer.avatar.height : 0;
};
physicsManager.getAvatarHeight = getAvatarHeight;

const _getAvatarCapsule = v => {
  const avatarHeight = getAvatarHeight();
  v.set(0, -avatarHeight * 0.5, 0); // XXX use the proper crouch height
  v.radius = 0.3/1.6 * avatarHeight;
  v.halfHeight = Math.max(avatarHeight * 0.5 - v.radius, 0);
  return v;
};
physicsManager.getAvatarCapsule = _getAvatarCapsule;
physicsManager.physicsEnabled = false;
physicsManager.setPhysicsEnabled = physicsEnabled => {
  physicsManager.physicsEnabled = physicsEnabled;
};
const _applyAvatarPhysics = (camera, avatarOffset, cameraBasedOffset, velocityAvatarDirection, updateRig, timeDiffS) => {
  if (physicsManager.physicsEnabled) {
    // apply offset
    camera.position.add(physicsManager.offset);
    physicsManager.offset.setScalar(0);

    // capsule physics
    const localPlayer = metaversefileApi.useLocalPlayer();
    if (!localPlayer.hasAction('sit')) {
      applyVelocity(camera.position, localPlayer.characterPhysics.velocity, timeDiffS);

      camera.updateMatrixWorld();
      camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);

      localVector4.copy(avatarOffset);
      if (cameraBasedOffset) {
        localVector4.applyQuaternion(localQuaternion);
      }
      localVector.add(localVector4);
      const collision = _collideCapsule(localVector, localQuaternion2.set(0, 0, 0, 1));
      
      // avatar facing direction
      if (velocityAvatarDirection) {
        const horizontalVelocity = localVector5.set(
          localPlayer.characterPhysics.velocity.x,
          0,
          localPlayer.characterPhysics.velocity.z
        );
        if (horizontalVelocity.lengthSq() > 0.001) {
          localQuaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              zeroVector,
              horizontalVelocity,
              upVector
            )
          );
        } else {
          localPlayer.matrixWorld.decompose(localVector4, localQuaternion, localVector5);
        }
      }

      const jumpAction = localPlayer.getAction('jump');
      const _ensureJumpAction = () => {
        if (!jumpAction) {
          const newJumpAction = {
            type: 'jump',
            time: 0,
          };
          localPlayer.addAction(newJumpAction);
        } else {
          jumpAction.set('time', 0);
        }
      };
      const _ensureNoJumpAction = () => {
        localPlayer.removeAction('jump');
      };
      if (collision) {
        const crouchOffset = getAvatarHeight() * (1 - getPlayerCrouchFactor(localPlayer)) * 0.5;
        localVector4
          .fromArray(collision.direction)
          .add(localVector5.set(0, -crouchOffset, 0));
        camera.position.add(localVector4)
        localVector.add(localVector4);
        
        if (collision.grounded) {
          localPlayer.characterPhysics.velocity.y = 0;
          _ensureNoJumpAction();
        } else if (!jumpAction) {
          _ensureJumpAction();
        }
      } else if (!jumpAction && localPlayer.characterPhysics.velocity.y < -4) {
        _ensureJumpAction();
      }
    } else {
      localPlayer.characterPhysics.velocity.y = 0;

      const sitAction = localPlayer.getAction('sit');

      const objInstanceId = sitAction.controllingId;
      const controlledApp = metaversefileApi.getAppByInstanceId(objInstanceId);
      const sitPos = sitAction.controllingBone ? sitAction.controllingBone : controlledApp;

      const sitComponent = controlledApp.getComponent('sit');
      const {sitOffset = [0, 0, 0], damping} = sitComponent;

      physicsManager.setSitOffset(sitOffset);

      applyVelocity(controlledApp.position, localPlayer.characterPhysics.velocity, timeDiffS);
      if (localPlayer.characterPhysics.velocity.lengthSq() > 0) {
        controlledApp.quaternion
          .setFromUnitVectors(
            localVector4.set(0, 0, -1),
            localVector5.set(localPlayer.characterPhysics.velocity.x, 0, localPlayer.characterPhysics.velocity.z).normalize()
          )
          .premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI));
      }
      controlledApp.updateMatrixWorld();

      localMatrix.copy(sitPos.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);
      
      localVector.add(_sitOffset);
      localVector.y += 1;
      localQuaternion.premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI));
      
      const offset = physicsManager.getAvatarCameraOffset();
      camera.position.copy(localVector)
        .sub(
          localVector3.copy(offset)
            .applyQuaternion(camera.quaternion)
        );
    }
    localMatrix.compose(localVector, localQuaternion, localVector2);

    // apply to player
    if (updateRig) {
      localPlayer.matrix.copy(localMatrix);
    } else {
      localPlayer.matrix.identity();
    }
    localPlayer.matrix
      .decompose(localPlayer.position, localPlayer.quaternion, localPlayer.scale);
    localPlayer.matrixWorld.copy(localPlayer.matrix);

    
    if (localPlayer.avatar) {
      if (localPlayer.hasAction('jump')) {
       localPlayer.avatar.setFloorHeight(-0xFFFFFF);
      } else {
        localPlayer.avatar.setFloorHeight(localVector.y - getAvatarHeight());
      }
    }
  }
};
const _collideCapsule = (() => {
  const localVector = new THREE.Vector3();
  return (p, q) => {
    _getAvatarCapsule(localVector);
    localVector.add(p);
    return physx.physxWorker.collidePhysics(physx.physics, localVector.radius, localVector.halfHeight, localVector, q, 4);
  };
})();

const gravity = new THREE.Vector3(0, -9.8, 0);
physicsManager.getGravity = () => gravity;

const _copyPQS = (dst, src) => {
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dst.scale.copy(src.scale);
};
const _updatePhysics = timeDiff => {
  const timeDiffS = timeDiff / 1000;
  const localPlayer = metaversefileApi.useLocalPlayer();
  const renderer = getRenderer();
  const session = renderer.xr.getSession();

  const avatarWorldObject = localObject;
  avatarWorldObject.matrix.copy(camera.matrixWorld)
    .decompose(avatarWorldObject.position, avatarWorldObject.quaternion, avatarWorldObject.scale);
  const avatarCameraOffset = session ? zeroVector : cameraManager.getCameraOffset();

  if (session) {
    localPlayer.updatePhysics(timeDiffS);

    if (ioManager.currentWalked || localPlayer.hasAction('jump')) {
      const originalPosition = avatarWorldObject.position.clone();

      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, false, false, false, timeDiffS);

      dolly.position.add(
        avatarWorldObject.position.clone().sub(originalPosition)
      );
    } else {
      physicsManager.velocity.y = 0;
    }
  } else {
    const selectedTool = cameraManager.getMode();
    if (selectedTool === 'firstperson') {
      localPlayer.updatePhysics(timeDiffS);
      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, false, true, timeDiffS);
      _copyPQS(camera, avatarWorldObject);
      camera.updateMatrixWorld();
    } else if (localPlayer.hasAction('aim') && !localPlayer.hasAction('narutoRun')) {
      localPlayer.updatePhysics(timeDiffS);
      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, false, true, timeDiffS);
      _copyPQS(camera, avatarWorldObject);
      camera.updateMatrixWorld();
    } else if (selectedTool === 'isometric') {
      localPlayer.updatePhysics(timeDiffS);
      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, true, true, timeDiffS);
      _copyPQS(camera, avatarWorldObject);
      camera.updateMatrixWorld();
    /* } else if (selectedTool === 'birdseye') {
      localPlayer.updatePhysics(timeDiffS);
      _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, false, true, true, timeDiffS);
      _copyPQS(camera, avatarWorldObject);
      camera.updateMatrixWorld(); */
    } else {
      throw new Error('invalid camera mode: ' + selectedTool);
    }
  }
};
physicsManager.update = _updatePhysics;

export default physicsManager;
