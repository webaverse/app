/*
physics manager is the interface to the physics engine.
it contains code for character capsules and world simulation.
*/

import * as THREE from 'three';
// import {getRenderer, camera, dolly} from './renderer.js';
import physx from './physx.js';
// import cameraManager from './camera-manager.js';
// import ioManager from './io-manager.js';
// import {getPlayerCrouchFactor} from './character-controller.js';
import metaversefileApi from 'metaversefile';
import {getNextPhysicsId, convertMeshToPhysicsMesh} from './util.js';
// import {applyVelocity} from './util.js';
// import {groundFriction} from './constants.js';
import {CapsuleGeometry} from './CapsuleGeometry.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

// const zeroVector = new THREE.Vector3(0, 0, 0);
// const upVector = new THREE.Vector3(0, 1, 0);

const physicsManager = new EventTarget();

const physicsUpdates = [];
const _makePhysicsObject = (physicsId/*, position, quaternion, scale*/) => {
  const physicsObject = new THREE.Object3D();
  physicsObject.physicsId = physicsId;
  physicsObject.collided = false;
  physicsObject.grounded = false;
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

physicsManager.addCapsuleGeometry = (position, quaternion, radius, halfHeight, physicsMaterial, ccdEnabled) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addCapsuleGeometryPhysics(physx.physics, position, quaternion, radius, halfHeight, physicsMaterial, physicsId, ccdEnabled);
  
  const physicsObject = _makePhysicsObject(physicsId, position, quaternion);
  const physicsMesh = new THREE.Mesh(
    new CapsuleGeometry(radius, radius, halfHeight*2)
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

  const physicsMaterial = [0.5, 0.5, 0]; // staticFriction, dynamicFriction, restitution
  
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addGeometryPhysics(physx.physics, physicsMesh, physicsId, physicsMaterial);
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
  physicsMesh.updateMatrix();
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
  try {
    physx.physxWorker.removeGeometryPhysics(physx.physics, physicsObject.physicsId);
  } catch(err) {
    console.warn('failed to remove geometry', err.stack);
  }
};
/* physicsManager.getVelocity = (physicsObject, velocity) => {
  physx.physxWorker.getVelocityPhysics(physx.physics, physicsObject.physicsId, velocity);
};
physicsManager.setVelocity = (physicsObject, velocity, enableGravity) => {
  physx.physxWorker.setVelocityPhysics(physx.physics, physicsObject.physicsId, velocity, enableGravity);
}; */
physicsManager.setTransform = physicsObject => {
  physx.physxWorker.setTransformPhysics(physx.physics, physicsObject.physicsId, physicsObject.position, physicsObject.quaternion, physicsObject.scale);
};
physicsManager.createCharacterController = (radius, height, contactOffset, position, mat) => {
  const characterController = physx.physxWorker.createCharacterControllerPhysics(physx.physics, radius, height, contactOffset, position, mat);
  return characterController;
};
physicsManager.destroyCharacterController = characterController => {
  physx.physxWorker.destroyCharacterControllerPhysics(physx.physics, characterController);
};
physicsManager.moveCharacterController = (characterController, displacement, minDist, elapsedTime, position) => {
  const result = physx.physxWorker.moveCharacterControllerPhysics(physx.physics, characterController, displacement, minDist, elapsedTime, position);
  return result;
};
physicsManager.setCharacterControllerPosition = (characterController, position) => {
  const result = physx.physxWorker.setCharacterControllerPositionPhysics(physx.physics, characterController, position);
  return result;
};
/* physicsManager.getTransforms = physicsObjects => {
  //console.log(physicsObjects, "phyobjssss");
  const objs = physx.physxWorker.getTransformPhysics(physx.physics, physicsObjects);
  return objs;
}; */
physicsManager.raycast = (position, quaternion) => physx.physxWorker.raycastPhysics(physx.physics, position, quaternion);
physicsManager.raycastArray = (position, quaternion, n) => physx.physxWorker.raycastPhysicsArray(physx.physics, position, quaternion, n);
physicsManager.setAngularLockFlags = (physicsId, x, y, z) => {
  physx.physxWorker.setAngularLockFlags(physx.physics, physicsId, x, y, z);
};
physicsManager.simulatePhysics = timeDiff => {
  if (physicsManager.physicsEnabled) {
    const t = timeDiff/1000;
    const updatesOut = physx.physxWorker.simulatePhysics(physx.physics, physicsUpdates, t);
    physicsUpdates.length = 0;
    for (const updateOut of updatesOut) {
      const {id, position, quaternion} = updateOut;
      const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(id);
      if (physicsObject) {
        physicsObject.position.copy(position);
        physicsObject.quaternion.copy(quaternion);
        physicsObject.updateMatrix();
      } /* else {
        console.warn('failed to get physics object', id);
      } */
    }
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

physicsManager.physicsEnabled = false;
physicsManager.setPhysicsEnabled = physicsEnabled => {
  physicsManager.physicsEnabled = physicsEnabled;
};

const gravity = new THREE.Vector3(0, -9.8, 0);
physicsManager.getGravity = () => gravity;

export default physicsManager;
