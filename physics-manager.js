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
import {CapsuleGeometry} from './geometries.js';

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
window.physicsUpdates = physicsUpdates;
const _makePhysicsObject = (physicsId, position, quaternion, scale) => {
  const physicsObject = new THREE.Object3D();
  physicsObject.position.copy(position);
  physicsObject.quaternion.copy(quaternion);
  physicsObject.scale.copy(scale);
  physicsObject.updateMatrixWorld();
  physicsObject.physicsId = physicsId;
  physicsObject.detached = false;
  physicsObject.collided = false;
  physicsObject.grounded = false;
  return physicsObject;
};
const _extractPhysicsGeometryForId = physicsId => {
  const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId);
  const {positions, indices, bounds} = physicsGeometry;
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry = geometry.toNonIndexed();
  geometry.computeVertexNormals();
  geometry.boundingBox = new THREE.Box3(new THREE.Vector3().fromArray(bounds, 0), new THREE.Vector3().fromArray(bounds, 3));
  return geometry;
};

physicsManager.addCapsuleGeometry = (position, quaternion, radius, halfHeight, physicsMaterial, flags = {}) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addCapsuleGeometryPhysics(physx.physics, position, quaternion, radius, halfHeight, physicsMaterial, physicsId, flags);
  
  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, localVector2.set(1, 1, 1));
  const physicsMesh = new THREE.Mesh(
    new CapsuleGeometry(radius, radius, halfHeight*2)
  );
  physicsMesh.visible = false;
  physicsObject.add(physicsMesh);
  physicsMesh.updateMatrixWorld();
  const {bounds} = physicsManager.getGeometryForPhysicsId(physicsId);
  physicsMesh.geometry.boundingBox = new THREE.Box3(new THREE.Vector3().fromArray(bounds, 0), new THREE.Vector3().fromArray(bounds, 3));
  physicsObject.physicsMesh = physicsMesh;
  return physicsObject;
};

physicsManager.addBoxGeometry = (position, quaternion, size, dynamic) => {
  // vismark
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addBoxGeometryPhysics(physx.physics, position, quaternion, size, physicsId, dynamic);
  
  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, localVector2.set(1, 1, 1));
  const physicsMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2)
  );
  physicsMesh.scale.copy(size);
  physicsMesh.visible = false;
  physicsObject.add(physicsMesh);
  physicsObject.updateMatrixWorld();
  const {bounds} = physicsManager.getGeometryForPhysicsId(physicsId);
  physicsMesh.geometry.boundingBox = new THREE.Box3(new THREE.Vector3().fromArray(bounds, 0), new THREE.Vector3().fromArray(bounds, 3));
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
  
  const physicsObject = _makePhysicsObject(physicsId, physicsMesh.position, physicsMesh.quaternion, physicsMesh.scale);
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
physicsManager.getBoundingBoxForPhysicsId = (physicsId, box) => physx.physxWorker.getBoundsPhysics(physx.physics, physicsId, box);
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
physicsManager.setMassAndInertia = (physicsObject, mass, inertia) => {
  physx.physxWorker.setMassAndInertiaPhysics(physx.physics, physicsObject.physicsId, mass, inertia);
};
physicsManager.setGravityEnabled = (physicsObject, enabled) => {
  physx.physxWorker.setGravityEnabledPhysics(physx.physics, physicsObject.physicsId, enabled);
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
}; */
physicsManager.getGlobalPosition = (physicsObject, position) => {
  physx.physxWorker.getGlobalPositionPhysics(physx.physics, physicsObject.physicsId, position);
};
physicsManager.setVelocity = (physicsObject, velocity, autoWake) => {
  physx.physxWorker.setVelocityPhysics(physx.physics, physicsObject.physicsId, velocity, autoWake);
};
physicsManager.setAngularVelocity = (physicsObject, velocity, autoWake) => {
  physx.physxWorker.setAngularVelocityPhysics(physx.physics, physicsObject.physicsId, velocity, autoWake);
};
physicsManager.setTransform = (physicsObject, autoWake) => {
  physx.physxWorker.setTransformPhysics(physx.physics, physicsObject.physicsId, physicsObject.position, physicsObject.quaternion, physicsObject.scale, autoWake);
};
physicsManager.collideBox = (hx, hy, hz, p, q, maxIter) => {
  return physx.physxWorker.collideBoxPhysics(physx.physics, hx, hy, hz, p, q, maxIter);
};
physicsManager.collideCapsule = (radius, halfHeight, p, q, maxIter) => {
  return physx.physxWorker.collideCapsulePhysics(physx.physics, radius, halfHeight, p, q, maxIter);
};
physicsManager.createCharacterController = (radius, height, contactOffset, stepOffset, position, mat, groupId) => {
  const characterController = physx.physxWorker.createCharacterControllerPhysics(physx.physics, radius, height, contactOffset, stepOffset, position, mat, groupId);
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
physicsManager.cutMesh = (
  positions,
  numPositions,
  normals,
  numNormals,
  uvs,
  numUvs,
  faces,
  numFaces,

  position,
  quaternion,
  scale,
) => physx.physxWorker.doCut(
  positions,
  numPositions,
  normals,
  numNormals,
  uvs,
  numUvs,
  faces,
  numFaces,

  position,
  quaternion,
  scale,
);
physicsManager.setLinearLockFlags = (physicsId, x, y, z) => {
  physx.physxWorker.setLinearLockFlags(physx.physics, physicsId, x, y, z);
};
physicsManager.setAngularLockFlags = (physicsId, x, y, z) => {
  physx.physxWorker.setAngularLockFlags(physx.physics, physicsId, x, y, z);
};
let done = 0;
window.lol = 10;
physicsManager.getNumActors = () => physx.physxWorker.getNumActorsPhysics(physx.physics);
physicsManager.simulatePhysics = timeDiff => {
  // timeDiff *= 0.0000000001;
  /* {
    const localPlayer = metaversefileApi.useLocalPlayer();
    if (localPlayer.avatar?.ragdoll) {
      if (done >= window.lol) {
        return;
      } else {
        done++;
        console.log('done', done);
      }
    } else {
      done = 0;
    }
  } */

  if (physicsEnabled) {
    const t = timeDiff/1000;
    const updatesOut = physx.physxWorker.simulatePhysics(physx.physics, physicsUpdates, t);
    // console.log(`updatesOut: ${updatesOut.length}, physicsUpdates: ${physicsUpdates.length}`);
    physicsUpdates.length = 0;
    for (const updateOut of updatesOut) {
      // vismark
      const {id, position, quaternion, collided, grounded} = updateOut;
      // console.log('physicsId', id)
      // const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(id);
      let physicsObject;

      if (id === 1) physicsObject = window.body;
      else if (id === 2) physicsObject = window.body2;
      else physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(id);

      // debugger
      if (physicsObject) {
        // debugger
        // console.log('physicsObject.name', physicsObject.name)
        // console.log('updateOut:', {physicsObject})
        if (physicsObject.name === 'vistest') {
          // debugger
          // console.log(position.x.toFixed(1) + '_' + position.y.toFixed(1) + '_' + position.z.toFixed(1))
        }
        // console.log('got position', position.toArray().join(','));
        physicsObject.position.copy(position);
        physicsObject.quaternion.copy(quaternion);
        physicsObject.updateMatrixWorld();

        if (id === 1) {
          window.mesh.matrix.copy(window.body.matrix)
          window.mesh.matrixWorld.copy(window.body.matrixWorld)
          window.mesh.matrix.decompose(window.mesh.position, window.mesh.quaternion, window.mesh.scale);
        }
        else if (id === 2) {
          window.mesh2.matrix.copy(window.body2.matrix)
          window.mesh2.matrixWorld.copy(window.body2.matrixWorld)
          window.mesh2.matrix.decompose(window.mesh2.position, window.mesh2.quaternion, window.mesh2.scale);
        }

        // console.log('set', physicsObject.name, id, physicsObject.position.toArray().join(','));

        physicsObject.collided = collided;
        physicsObject.grounded = grounded;
      } else {
        if (id !== 0 && id < 1000) {
          console.warn('failed to get physics object', id);
        }
      }
    }
  }
};

physicsManager.marchingCubes = (dims, potential, shift, scale) => physx.physxWorker.marchingCubes(dims, potential, shift, scale);

physicsManager.createSkeleton = (skeletonBuffer, groupId) => physx.physxWorker.createSkeleton(physx.physics, skeletonBuffer, groupId);
physicsManager.setSkeletonFromBuffer = (skeleton, isChildren, buffer) => physx.physxWorker.setSkeletonFromBuffer(physx.physics, skeleton, isChildren, buffer);

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

let physicsEnabled = false;
physicsManager.getPhysicsEnabled = () => physicsEnabled;
physicsManager.setPhysicsEnabled = newPhysicsEnabled => {
  physicsEnabled = newPhysicsEnabled;
};

const gravity = new THREE.Vector3(0, -9.8, 0);
physicsManager.getGravity = () => gravity;

export default physicsManager;
