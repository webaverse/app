/*
physics manager is the interface to the physics engine.
it contains code for character capsules and world simulation.
*/

import * as THREE from 'three'
// import {getRenderer, camera, dolly} from './renderer.js';
import physx from './physx.js'
// import cameraManager from './camera-manager.js';
// import ioManager from './io-manager.js';
// import {getPlayerCrouchFactor} from './character-controller.js';
import metaversefileApi from 'metaversefile'
import { getNextPhysicsId, convertMeshToPhysicsMesh } from './util.js'
// import {applyVelocity} from './util.js';
// import {groundFriction} from './constants.js';
import { CapsuleGeometry } from './geometries.js'

const localVector = new THREE.Vector3()
const localVector2 = new THREE.Vector3()
const localVector3 = new THREE.Vector3()
const localVector4 = new THREE.Vector3()
const localVector5 = new THREE.Vector3()
const localQuaternion = new THREE.Quaternion()
const localQuaternion2 = new THREE.Quaternion()
const localMatrix = new THREE.Matrix4()

// const zeroVector = new THREE.Vector3(0, 0, 0);
// const upVector = new THREE.Vector3(0, 1, 0);

const physicsManager = new EventTarget()

const physicsUpdates = []
const _makePhysicsObject = (physicsId, position, quaternion, scale) => {
  const physicsObject = new THREE.Object3D()
  physicsObject.position.copy(position)
  physicsObject.quaternion.copy(quaternion)
  physicsObject.scale.copy(scale)
  physicsObject.updateMatrixWorld()
  physicsObject.physicsId = physicsId
  physicsObject.detached = false // detached physics objects do not get updated when the owning app moves
  physicsObject.collided = true
  physicsObject.grounded = true
  return physicsObject
}
const _extractPhysicsGeometryForId = (physicsId) => {
  const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId)
  const { positions, indices, bounds } = physicsGeometry
  let geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry = geometry.toNonIndexed()
  geometry.computeVertexNormals()
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3().fromArray(bounds, 0),
    new THREE.Vector3().fromArray(bounds, 3)
  )
  return geometry
}

physicsManager.addCapsuleGeometry = (
  position,
  quaternion,
  radius,
  halfHeight,
  material,
  dynamic,
  flags = {}
) => {
  const physicsId = getNextPhysicsId()
  physx.physxWorker.addCapsuleGeometryPhysics(
    physx.physics,
    position,
    quaternion,
    radius,
    halfHeight,
    physicsId,
    material,
    dynamic,
    flags
  )

  const physicsObject = _makePhysicsObject(
    physicsId,
    position,
    quaternion,
    localVector2.set(1, 1, 1)
  )
  const physicsMesh = new THREE.Mesh(
    new CapsuleGeometry(radius, radius, halfHeight * 2)
  )
  physicsMesh.visible = false
  physicsObject.add(physicsMesh)
  physicsMesh.updateMatrixWorld()
  const { bounds } = physicsManager.getGeometryForPhysicsId(physicsId)
  physicsMesh.geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3().fromArray(bounds, 0),
    new THREE.Vector3().fromArray(bounds, 3)
  )
  physicsObject.physicsMesh = physicsMesh
  return physicsObject
}

physicsManager.addBoxGeometry = (position, quaternion, size, dynamic) => {
  const physicsId = getNextPhysicsId()
  physx.physxWorker.addBoxGeometryPhysics(
    physx.physics,
    position,
    quaternion,
    size,
    physicsId,
    dynamic
  )

  const physicsObject = _makePhysicsObject(
    physicsId,
    position,
    quaternion,
    localVector2.set(1, 1, 1)
  )
  const physicsMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2))
  physicsMesh.scale.copy(size)
  physicsMesh.visible = false
  physicsObject.add(physicsMesh)
  physicsObject.updateMatrixWorld()
  const { bounds } = physicsManager.getGeometryForPhysicsId(physicsId)
  physicsMesh.geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3().fromArray(bounds, 0),
    new THREE.Vector3().fromArray(bounds, 3)
  )
  physicsObject.physicsMesh = physicsMesh
  return physicsObject
}
physicsManager.addGeometry = (mesh) => {
  const physicsMesh = convertMeshToPhysicsMesh(mesh)
  if (mesh.parent) {
    mesh.parent.matrixWorld.decompose(
      physicsMesh.position,
      physicsMesh.quaternion,
      physicsMesh.scale
    )
    physicsMesh.updateMatrixWorld()
  }

  const physicsMaterial = [0.5, 0.5, 0] // staticFriction, dynamicFriction, restitution

  const physicsId = getNextPhysicsId()
  physx.physxWorker.addGeometryPhysics(
    physx.physics,
    physicsMesh,
    physicsId,
    physicsMaterial
  )
  physicsMesh.geometry = _extractPhysicsGeometryForId(physicsId)

  const physicsObject = _makePhysicsObject(
    physicsId,
    physicsMesh.position,
    physicsMesh.quaternion,
    physicsMesh.scale
  )
  physicsObject.add(physicsMesh)
  physicsMesh.position.set(0, 0, 0)
  physicsMesh.quaternion.set(0, 0, 0, 1)
  physicsMesh.scale.set(1, 1, 1)
  physicsMesh.updateMatrixWorld()
  physicsObject.physicsMesh = physicsMesh
  return physicsObject
}
physicsManager.createMaterial = physicsMaterial =>
  physx.physxWorker.createMaterial(physx.physics, physicsMaterial);
physicsManager.destroyMaterial = materialAddress =>
  physx.physxWorker.destroyMaterial(physx.physics, materialAddress);
physicsManager.cookGeometry = (mesh) =>
  physx.physxWorker.cookGeometryPhysics(physx.physics, mesh)
physicsManager.addCookedGeometry = (buffer, position, quaternion, scale) => {
  const physicsId = getNextPhysicsId()
  physx.physxWorker.addCookedGeometryPhysics(
    physx.physics,
    buffer,
    position,
    quaternion,
    scale,
    physicsId
  )

  const physicsObject = _makePhysicsObject(
    physicsId,
    position,
    quaternion,
    scale
  )
  const physicsMesh = new THREE.Mesh(_extractPhysicsGeometryForId(physicsId))
  physicsMesh.visible = false
  physicsObject.add(physicsMesh)
  physicsObject.physicsMesh = physicsMesh
  return physicsObject
}

physicsManager.addConvexGeometry = (mesh) => {
  const physicsMesh = convertMeshToPhysicsMesh(mesh)
  if (mesh.parent) {
    mesh.parent.matrixWorld.decompose(
      physicsMesh.position,
      physicsMesh.quaternion,
      physicsMesh.scale
    )
    physicsMesh.updateMatrixWorld()
  }

  const physicsId = getNextPhysicsId()
  physx.physxWorker.addConvexGeometryPhysics(
    physx.physics,
    physicsMesh,
    physicsId
  )
  physicsMesh.geometry = _extractPhysicsGeometryForId(physicsId)

  const physicsObject = _makePhysicsObject(
    physicsId,
    mesh.position,
    mesh.quaternion,
    mesh.scale
  )
  physicsObject.add(physicsMesh)
  physicsMesh.position.set(0, 0, 0)
  physicsMesh.quaternion.set(0, 0, 0, 1)
  physicsMesh.scale.set(1, 1, 1)
  physicsMesh.updateMatrixWorld()
  physicsObject.physicsMesh = physicsMesh
  return physicsObject
}
physicsManager.cookConvexGeometry = (mesh) =>
  physx.physxWorker.cookConvexGeometryPhysics(physx.physics, mesh)
physicsManager.addCookedConvexGeometry = (
  buffer,
  position,
  quaternion,
  scale
) => {
  const physicsId = getNextPhysicsId()
  physx.physxWorker.addCookedConvexGeometryPhysics(
    physx.physics,
    buffer,
    position,
    quaternion,
    scale,
    physicsId
  )

  const physicsObject = _makePhysicsObject(
    physicsId,
    position,
    quaternion,
    scale
  )
  const physicsMesh = new THREE.Mesh(_extractPhysicsGeometryForId(physicsId))
  physicsMesh.visible = false
  physicsObject.add(physicsMesh)
  physicsObject.physicsMesh = physicsMesh;
  return physicsObject
}

physicsManager.getGeometryForPhysicsId = (physicsId) =>
  physx.physxWorker.getGeometryPhysics(physx.physics, physicsId)
physicsManager.getBoundingBoxForPhysicsId = (physicsId, box) =>
  physx.physxWorker.getBoundsPhysics(physx.physics, physicsId, box)
physicsManager.enableActor = (physicsObject) => {
  physx.physxWorker.enableActorPhysics(physx.physics, physicsObject.physicsId)
}
physicsManager.disableActor = (physicsObject) => {
  physx.physxWorker.disableActorPhysics(physx.physics, physicsObject.physicsId)
}
physicsManager.disableGeometry = (physicsObject) => {
  physx.physxWorker.disableGeometryPhysics(
    physx.physics,
    physicsObject.physicsId
  )
}
physicsManager.enableGeometry = (physicsObject) => {
  physx.physxWorker.enableGeometryPhysics(
    physx.physics,
    physicsObject.physicsId
  )
}
physicsManager.disableGeometryQueries = (physicsObject) => {
  physx.physxWorker.disableGeometryQueriesPhysics(
    physx.physics,
    physicsObject.physicsId
  )
}
physicsManager.enableGeometryQueries = (physicsObject) => {
  physx.physxWorker.enableGeometryQueriesPhysics(
    physx.physics,
    physicsObject.physicsId
  )
}
physicsManager.setMassAndInertia = (physicsObject, mass, inertia) => {
  physx.physxWorker.setMassAndInertiaPhysics(
    physx.physics,
    physicsObject.physicsId,
    mass,
    inertia
  )
}
physicsManager.setGravityEnabled = (physicsObject, enabled) => {
  physx.physxWorker.setGravityEnabledPhysics(
    physx.physics,
    physicsObject.physicsId,
    enabled
  )
}
physicsManager.removeGeometry = (physicsObject) => {
  // try {
  physx.physxWorker.removeGeometryPhysics(
    physx.physics,
    physicsObject.physicsId
  )
  /* } catch(err) {
    console.warn('failed to remove geometry', err.stack);
  } */
}
/* physicsManager.getVelocity = (physicsObject, velocity) => {
  physx.physxWorker.getVelocityPhysics(physx.physics, physicsObject.physicsId, velocity);
}; */
physicsManager.getGlobalPosition = (physicsObject, position) => {
  physx.physxWorker.getGlobalPositionPhysics(
    physx.physics,
    physicsObject.physicsId,
    position
  )
}
physicsManager.setVelocity = (physicsObject, velocity, autoWake) => {
  physx.physxWorker.setVelocityPhysics(
    physx.physics,
    physicsObject.physicsId,
    velocity,
    autoWake
  )
}
physicsManager.setAngularVelocity = (physicsObject, velocity, autoWake) => {
  physx.physxWorker.setAngularVelocityPhysics(
    physx.physics,
    physicsObject.physicsId,
    velocity,
    autoWake
  )
}
physicsManager.setTransform = (physicsObject, autoWake) => {
  physx.physxWorker.setTransformPhysics(
    physx.physics,
    physicsObject.physicsId,
    physicsObject.position,
    physicsObject.quaternion,
    physicsObject.scale,
    autoWake
  )
}
physicsManager.setGeometryScale = (physicsId, newScale) => {
  physx.physxWorker.setGeometryScale(physx.physics, physicsId, newScale);
}
physicsManager.getPath = (
  start,
  dest,
  isWalk,
  hy,
  heightTolerance,
  maxIterDetect,
  maxIterStep,
  ignorePhysicsIds
) => {
  return physx.physxWorker.getPathPhysics(
    physx.physics,
    start,
    dest,
    isWalk,
    hy,
    heightTolerance,
    maxIterDetect,
    maxIterStep,
    ignorePhysicsIds
  )
}
physicsManager.overlapBox = (hx, hy, hz, p, q) => {
  return physx.physxWorker.overlapBoxPhysics(physx.physics, hx, hy, hz, p, q)
}
physicsManager.overlapCapsule = (radius, halfHeight, p, q) => {
  return physx.physxWorker.overlapCapsulePhysics(
    physx.physics,
    radius,
    halfHeight,
    p,
    q
  )
}
physicsManager.collideBox = (hx, hy, hz, p, q, maxIter) => {
  return physx.physxWorker.collideBoxPhysics(
    physx.physics,
    hx,
    hy,
    hz,
    p,
    q,
    maxIter
  )
}
physicsManager.collideCapsule = (radius, halfHeight, p, q, maxIter) => {
  return physx.physxWorker.collideCapsulePhysics(
    physx.physics,
    radius,
    halfHeight,
    p,
    q,
    maxIter
  )
}
physicsManager.createCharacterController = (
  radius,
  height,
  contactOffset,
  stepOffset,
  position
) => {
  const physicsId = getNextPhysicsId()
  const characterControllerId =
    physx.physxWorker.createCharacterControllerPhysics(
      physx.physics,
      radius,
      height,
      contactOffset,
      stepOffset,
      position,
      physicsId
    )

  const halfHeight = height / 2
  const physicsObject = new THREE.Object3D()
  const physicsMesh = new THREE.Mesh(
    new CapsuleGeometry(radius, radius, halfHeight * 2)
  )
  physicsMesh.visible = false
  physicsObject.add(physicsMesh)
  physicsMesh.updateMatrixWorld()
  const { bounds } = physicsManager.getGeometryForPhysicsId(physicsId)
  physicsMesh.geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3().fromArray(bounds, 0),
    new THREE.Vector3().fromArray(bounds, 3)
  )
  // console.log('character controller bounds', physicsId, physicsMesh.geometry.boundingBox);
  physicsObject.physicsMesh = physicsMesh
  physicsObject.characterControllerId = characterControllerId
  physicsObject.physicsId = physicsId

  /* const physicsObject = _makePhysicsObject(physicsId, mesh.position, mesh.quaternion, mesh.scale);
  physicsObject.add(physicsMesh);
  physicsMesh.position.set(0, 0, 0);
  physicsMesh.quaternion.set(0, 0, 0, 1);
  physicsMesh.scale.set(1, 1, 1);
  physicsMesh.updateMatrixWorld();
  physicsObject.physicsMesh = physicsMesh;
  characterController.physicsObject = physicsObject;
  console.log('character controller id', physicsObject); */

  return physicsObject
}
physicsManager.destroyCharacterController = (characterController) => {
  physx.physxWorker.destroyCharacterControllerPhysics(
    physx.physics,
    characterController.characterControllerId
  )
}
physicsManager.moveCharacterController = (
  characterController,
  displacement,
  minDist,
  elapsedTime,
  position
) => {
  const result = physx.physxWorker.moveCharacterControllerPhysics(
    physx.physics,
    characterController.characterControllerId,
    displacement,
    minDist,
    elapsedTime,
    position
  )
  return result
}
physicsManager.setCharacterControllerPosition = (
  characterController,
  position
) => {
  const result = physx.physxWorker.setCharacterControllerPositionPhysics(
    physx.physics,
    characterController.characterControllerId,
    position
  )
  return result
}
/* physicsManager.getTransforms = physicsObjects => {
  //console.log(physicsObjects, "phyobjssss");
  const objs = physx.physxWorker.getTransformPhysics(physx.physics, physicsObjects);
  return objs;
}; */
physicsManager.raycast = (position, quaternion) =>
  physx.physxWorker.raycastPhysics(physx.physics, position, quaternion)
physicsManager.raycastArray = (position, quaternion, n) =>
  physx.physxWorker.raycastPhysicsArray(physx.physics, position, quaternion, n)
physicsManager.cutMesh = (
  positions,
  numPositions,
  normals,
  numNormals,
  uvs,
  numUvs,
  faces, // Set to falsy to indicate that this is an non-indexed geometry
  numFaces,

  planeNormal, // normalized vector3 array
  planeDistance, // number
) =>
  physx.physxWorker.doCut(
    positions,
    numPositions,
    normals,
    numNormals,
    uvs,
    numUvs,
    faces,
    numFaces,

    planeNormal,
    planeDistance,
  )
physicsManager.setLinearLockFlags = (physicsId, x, y, z) => {
  physx.physxWorker.setLinearLockFlags(physx.physics, physicsId, x, y, z)
}
physicsManager.setAngularLockFlags = (physicsId, x, y, z) => {
  physx.physxWorker.setAngularLockFlags(physx.physics, physicsId, x, y, z)
}

physicsManager.sweepBox = (
  origin,
  quaternion,
  halfExtents,
  direction,
  sweepDistance,
  maxHits,
) => {
  return physx.physxWorker.sweepBox(
    physx.physics,
    origin,
    quaternion,
    halfExtents,
    direction,
    sweepDistance,
    maxHits,
  )
};

physicsManager.simulatePhysics = (timeDiff) => {
  if (physicsEnabled) {
    const t = timeDiff / 1000
    const updatesOut = physx.physxWorker.simulatePhysics(
      physx.physics,
      physicsUpdates,
      t
    )
    physicsUpdates.length = 0
    for (const updateOut of updatesOut) {
      const { id, position, quaternion, collided, grounded } = updateOut
      const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(id)
      if (physicsObject) {
        physicsObject.position.copy(position)
        physicsObject.quaternion.copy(quaternion)
        physicsObject.updateMatrixWorld()

        physicsObject.collided = collided
        physicsObject.grounded = grounded
      } /* else {
        console.warn('failed to get physics object', id);
      } */
    }
  }
}

physicsManager.marchingCubes = (dims, potential, shift, scale) =>
  physx.physxWorker.marchingCubes(dims, potential, shift, scale)

physicsManager.createChunkWithDualContouring = (x, y, z, lod) => physx.physxWorker.createChunkWithDualContouring(x, y, z, lod)

physicsManager.createSeamsWithDualContouring = (x, y, z) => physx.physxWorker.createSeamsWithDualContouring(x, y, z)

physicsManager.pushUpdate = (physicsObject) => {
  const { physicsId, physicsMesh } = physicsObject
  physicsMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2)

  physicsUpdates.push({
    id: physicsId,
    position: localVector.clone(),
    quaternion: localQuaternion.clone(),
    scale: localVector2.clone(),
  })
}

let physicsEnabled = false
physicsManager.getPhysicsEnabled = () => physicsEnabled
physicsManager.setPhysicsEnabled = (newPhysicsEnabled) => {
  physicsEnabled = newPhysicsEnabled
}

const gravity = new THREE.Vector3(0, -9.8, 0)
physicsManager.getGravity = () => gravity

export default physicsManager
