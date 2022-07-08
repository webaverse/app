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
import { getNextPhysicsId, freePhysicsId, convertMeshToPhysicsMesh } from './util.js'
// import {applyVelocity} from './util.js';
// import {groundFriction} from './constants.js';
import { CapsuleGeometry } from './geometries.js'
import physxWorkerManager from './physx-worker-manager.js';

// const localVector = new THREE.Vector3()
const localVector2 = new THREE.Vector3()
/* const localVector3 = new THREE.Vector3()
const localVector4 = new THREE.Vector3()
const localVector5 = new THREE.Vector3()
const localQuaternion = new THREE.Quaternion()
const localQuaternion2 = new THREE.Quaternion()
const localMatrix = new THREE.Matrix4() */

// fake shared material to prevent shader instantiation
const redMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  // side: THREE.DoubleSide,
});

// const zeroVector = new THREE.Vector3(0, 0, 0);
// const upVector = new THREE.Vector3(0, 1, 0);

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
};
const _updatePhysicsObjects = updatesOut => {
  for (const updateOut of updatesOut) {
    const { id, position, quaternion, collided, grounded } = updateOut
    const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(id)
    if (physicsObject) {
      // console.log('update physics object', id);

      physicsObject.position.copy(position)
      physicsObject.quaternion.copy(quaternion)
      physicsObject.updateMatrixWorld()

      physicsObject.collided = collided
      physicsObject.grounded = grounded
    } /* else {
      console.warn('failed to update unknown physics id', id);
    } */
  }
};

const physicsUpdates = [];
class PhysicsScene extends EventTarget {
  constructor() {
    super();

    this.scene = null;
    this.gravity = new THREE.Vector3(0, -9.8, 0);
    this.physicsEnabled = true;

    (async () => {
      if (!physx.loaded) {
        await physx.waitForLoad();
      }
      this.scene = physx.physxWorker.makeScene();
    })();
  }
  addCapsuleGeometry(
    position,
    quaternion,
    radius,
    halfHeight,
    material,
    dynamic,
    flags = {}
  ) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addCapsuleGeometryPhysics(
      this.scene,
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
      new CapsuleGeometry(radius, radius, halfHeight * 2),
      redMaterial
    )
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsMesh.updateMatrixWorld()
    const { bounds } = this.getGeometryForPhysicsId(physicsId)
    physicsMesh.geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(bounds, 0),
      new THREE.Vector3().fromArray(bounds, 3)
    )
    physicsObject.physicsMesh = physicsMesh
    return physicsObject
  }
  addBoxGeometry(position, quaternion, size, dynamic) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addBoxGeometryPhysics(
      this.scene,
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
    const physicsMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), redMaterial)
    physicsMesh.scale.copy(size)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.updateMatrixWorld()
    const { bounds } = this.getGeometryForPhysicsId(physicsId)
    physicsMesh.geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(bounds, 0),
      new THREE.Vector3().fromArray(bounds, 3)
    )
    physicsObject.physicsMesh = physicsMesh
    return physicsObject
  }
  extractPhysicsGeometryForId(physicsId) {
    const physicsGeometry = this.getGeometryForPhysicsId(physicsId)
    const { positions, indices, bounds } = physicsGeometry
    let geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry = geometry.toNonIndexed()
    geometry.computeVertexNormals()
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(bounds, 0),
      new THREE.Vector3().fromArray(bounds, 3)
    );
    return geometry
  }
  addGeometry(mesh) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh)
  
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addGeometryPhysics(
      this.scene,
      physicsMesh,
      physicsId
    )
    physicsMesh.geometry = this.extractPhysicsGeometryForId(physicsId)
  
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
  createMaterial(physicsMaterial) {
    return physx.physxWorker.createMaterial(this.scene, physicsMaterial)
  }
  destroyMaterial(materialAddress) {
    physx.physxWorker.destroyMaterial(this.scene, materialAddress);
  }
  cookGeometry(mesh) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh);
    const buffer = physx.physxWorker.cookGeometryPhysics(this.scene, physicsMesh);
    return buffer;
  }
  async cookGeometryAsync(mesh, {
    signal = null,
  } = {}) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh);
    const buffer = await physxWorkerManager.cookGeometry(physicsMesh);
    signal && signal.throwIfAborted();
    return buffer;
  }
  addCookedGeometry(buffer, position, quaternion, scale) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addCookedGeometryPhysics(
      this.scene,
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
    const physicsMesh = new THREE.Mesh(this.extractPhysicsGeometryForId(physicsId), redMaterial)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.physicsMesh = physicsMesh
    physicsMesh.updateMatrixWorld()
    return physicsObject
  }
  addConvexGeometry(mesh) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh)
  
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addConvexGeometryPhysics(
      this.scene,
      physicsMesh,
      physicsId
    )
    physicsMesh.geometry = this.extractPhysicsGeometryForId(physicsId)
  
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
  cookConvexGeometry(mesh) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh);
    const buffer = physx.physxWorker.cookConvexGeometryPhysics(this.scene, physicsMesh);
    return buffer;
  }
  async cookConvexGeometryAsync(mesh, {
    signal = null,
  } = {}) {
    const physicsMesh = convertMeshToPhysicsMesh(mesh);
    const buffer = await physxWorkerManager.cookConvexGeometry(physicsMesh);
    signal && signal.throwIfAborted();
    return buffer;
  }
  addCookedConvexGeometry(
    buffer,
    position,
    quaternion,
    scale
  ) {
    const physicsId = getNextPhysicsId()
    physx.physxWorker.addCookedConvexGeometryPhysics(
      this.scene,
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
    const physicsMesh = new THREE.Mesh(this.extractPhysicsGeometryForId(physicsId), redMaterial)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.physicsMesh = physicsMesh
    physicsMesh.updateMatrixWorld()
    return physicsObject
  }
  addShape(shapeAddress, position, quaternion, scale, external) {
    const physicsId = getNextPhysicsId()
  
    physx.physxWorker.addShapePhysics(
      this.scene,
      shapeAddress,
      position,
      quaternion,
      scale,
      external,
      physicsId
    );
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      scale
    )
    const physicsMesh = new THREE.Mesh(this.extractPhysicsGeometryForId(physicsId), redMaterial)
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.physicsMesh = physicsMesh;
    physicsMesh.updateMatrixWorld()
    return physicsObject
  }
  addConvexShape(shapeAddress, position, quaternion, scale, dynamic, external) {
    const physicsId = getNextPhysicsId()
  
    physx.physxWorker.addConvexShapePhysics(
      this.scene,
      shapeAddress,
      position,
      quaternion,
      scale,
      dynamic,
      external,
      physicsId
    );
  
    const physicsObject = _makePhysicsObject(
      physicsId,
      position,
      quaternion,
      scale
    )
    const geometry = this.extractPhysicsGeometryForId(physicsId);
    const physicsMesh = new THREE.Mesh(geometry, redMaterial);
  
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsObject.physicsMesh = physicsMesh;
    physicsMesh.updateMatrixWorld();
    return physicsObject
  }
  getGeometryForPhysicsId(physicsId) {
    return physx.physxWorker.getGeometryPhysics(this.scene, physicsId);
  }
  getBoundingBoxForPhysicsId(physicsId, box) {
    return physx.physxWorker.getBoundsPhysics(this.scene, physicsId, box);
  }
  enableActor(physicsObject) {
    physx.physxWorker.enableActorPhysics(this.scene, physicsObject.physicsId)
  }
  disableActor(physicsObject) {
    physx.physxWorker.disableActorPhysics(this.scene, physicsObject.physicsId)
  }
  disableGeometry(physicsObject) {
    physx.physxWorker.disableGeometryPhysics(
      this.scene,
      physicsObject.physicsId
    )
  }
  enableGeometry(physicsObject) {
    physx.physxWorker.enableGeometryPhysics(
      this.scene,
      physicsObject.physicsId
    )
  }
  disableGeometryQueries(physicsObject) {
    physx.physxWorker.disableGeometryQueriesPhysics(
      this.scene,
      physicsObject.physicsId
    )
  }
  enableGeometryQueries(physicsObject) {
    physx.physxWorker.enableGeometryQueriesPhysics(
      this.scene,
      physicsObject.physicsId
    )
  }
  setMassAndInertia(physicsObject, mass, inertia) {
    physx.physxWorker.setMassAndInertiaPhysics(
      this.scene,
      physicsObject.physicsId,
      mass,
      inertia
    )
  }
  setGravityEnabled(physicsObject, enabled) {
    physx.physxWorker.setGravityEnabledPhysics(
      this.scene,
      physicsObject.physicsId,
      enabled
    )
  }
  removeGeometry(physicsObject) {
    physx.physxWorker.removeGeometryPhysics(
      this.scene,
      physicsObject.physicsId
    )
  
    freePhysicsId(physicsObject.physicsId)
  }
  getLinearVelocity(physicsObject, velocity) {
    physx.physxWorker.getLinearVelocityPhysics(this.scene, physicsObject.physicsId, velocity);
  }
  getAngularVelocity(physicsObject, velocity) {
    physx.physxWorker.getAngularVelocityPhysics(this.scene, physicsObject.physicsId, velocity);
  }
  getGlobalPosition(physicsObject, position) {
    physx.physxWorker.getGlobalPositionPhysics(
      this.scene,
      physicsObject.physicsId,
      position
    )
  }
  addForceAtPos(physicsObject, velocity, position, autoWake) {
    physx.physxWorker.addForceAtPosPhysics(this.scene, physicsObject.physicsId, velocity, position, autoWake);
  }
  addLocalForceAtPos(physicsObject, velocity, position, autoWake) {
    physx.physxWorker.addLocalForceAtPosPhysics(this.scene, physicsObject.physicsId, velocity, position, autoWake);
  }
  addForceAtLocalPos(physicsObject, velocity, position, autoWake) {
    physx.physxWorker.addForceAtLocalPosPhysics(this.scene, physicsObject.physicsId, velocity, position, autoWake);
  }
  addLocalForceAtLocalPos(physicsObject, velocity, position, autoWake) {
    physx.physxWorker.addLocalForceAtLocalPosPhysics(this.scene, physicsObject.physicsId, velocity, position, autoWake);
  }
  addForce(physicsObject, velocity, autoWake) {
    physx.physxWorker.addForcePhysics(this.scene, physicsObject.physicsId, velocity, autoWake);
  }
  addTorque(physicsObject, velocity, autoWake) {
    physx.physxWorker.addTorquePhysics(this.scene, physicsObject.physicsId, velocity, autoWake);
  }
  setVelocity(physicsObject, velocity, autoWake) {
    physx.physxWorker.setVelocityPhysics(
      this.scene,
      physicsObject.physicsId,
      velocity,
      autoWake
    )
  }
  setAngularVelocity(physicsObject, velocity, autoWake) {
    physx.physxWorker.setAngularVelocityPhysics(
      this.scene,
      physicsObject.physicsId,
      velocity,
      autoWake
    )
  }
  setTransform(physicsObject, autoWake) {
    physx.physxWorker.setTransformPhysics(
      this.scene,
      physicsObject.physicsId,
      physicsObject.position,
      physicsObject.quaternion,
      physicsObject.scale,
      autoWake
    )
  }
  setGeometryScale(physicsId, newScale) {
    physx.physxWorker.setGeometryScale(this.scene, physicsId, newScale)
  }
  getPath(
    start,
    dest,
    isWalk,
    hy,
    heightTolerance,
    maxIterDetect,
    maxIterStep,
    ignorePhysicsIds
  ) {
    return physx.physxWorker.getPathPhysics(
      this.scene,
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
  overlapBox(hx, hy, hz, p, q) {
    return physx.physxWorker.overlapBoxPhysics(this.scene, hx, hy, hz, p, q)
  }
  overlapCapsule(radius, halfHeight, p, q) {
    return physx.physxWorker.overlapCapsulePhysics(
      this.scene,
      radius,
      halfHeight,
      p,
      q
    )
  }
  collideBox(hx, hy, hz, p, q, maxIter) {
    return physx.physxWorker.collideBoxPhysics(
      this.scene,
      hx,
      hy,
      hz,
      p,
      q,
      maxIter
    )
  }
  collideCapsule(radius, halfHeight, p, q, maxIter) {
    return physx.physxWorker.collideCapsulePhysics(
      this.scene,
      radius,
      halfHeight,
      p,
      q,
      maxIter
    )
  }
  createCharacterController(
    radius,
    height,
    contactOffset,
    stepOffset,
    position
  ) {
    const physicsId = getNextPhysicsId()
    const characterControllerId =
      physx.physxWorker.createCharacterControllerPhysics(
        this.scene,
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
      new CapsuleGeometry(radius, radius, halfHeight * 2),
      redMaterial
    )
    physicsMesh.visible = false
    physicsObject.add(physicsMesh)
    physicsMesh.updateMatrixWorld()
    const { bounds } = this.getGeometryForPhysicsId(physicsId)
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
  destroyCharacterController(characterController) {
    physx.physxWorker.destroyCharacterControllerPhysics(
      this.scene,
      characterController.characterControllerId
    )
  }
  moveCharacterController(
    characterController,
    displacement,
    minDist,
    elapsedTime,
    position
  ) {
    const result = physx.physxWorker.moveCharacterControllerPhysics(
      this.scene,
      characterController.characterControllerId,
      displacement,
      minDist,
      elapsedTime,
      position
    )
    return result
  }
  setCharacterControllerPosition(
    characterController,
    position
  ) {
    const result = physx.physxWorker.setCharacterControllerPositionPhysics(
      this.scene,
      characterController.characterControllerId,
      position
    )
    return result
  }
  raycast(position, quaternion) {
    return physx.physxWorker.raycastPhysics(this.scene, position, quaternion)
  }
  raycastArray(position, quaternion, n) {
    return physx.physxWorker.raycastPhysicsArray(this.scene, position, quaternion, n)
  }
  cutMesh(
    positions,
    numPositions,
    normals,
    numNormals,
    uvs,
    numUvs,
    faces, // Set to falsy to indicate that this is an non-indexed geometry
    numFaces,
  
    planeNormal, // normalized vector3 array
    planeDistance // number
  ) {
    return physx.physxWorker.doCut(
      positions,
      numPositions,
      normals,
      numNormals,
      uvs,
      numUvs,
      faces,
      numFaces,
  
      planeNormal,
      planeDistance
    );
  }
  setLinearLockFlags(physicsId, x, y, z) {
    physx.physxWorker.setLinearLockFlags(this.scene, physicsId, x, y, z)
  }
  setAngularLockFlags(physicsId, x, y, z) {
    physx.physxWorker.setAngularLockFlags(this.scene, physicsId, x, y, z)
  }
  sweepBox(
    origin,
    quaternion,
    halfExtents,
    direction,
    sweepDistance,
    maxHits
  ) {
    return physx.physxWorker.sweepBox(
      this.scene,
      origin,
      quaternion,
      halfExtents,
      direction,
      sweepDistance,
      maxHits
    )
  }
  sweepConvexShape(
    shapeAddress,
    origin,
    quaternion,
    direction,
    sweepDistance,
    maxHits,
  ) {
    return physx.physxWorker.sweepConvexShape(
      this.scene,
      shapeAddress,
      origin,
      quaternion,
      direction,
      sweepDistance,
      maxHits,
    )
  }
  simulatePhysics(timeDiff) {
    if (this.physicsEnabled) {
      const t = timeDiff / 1000
      const updatesOut = physx.physxWorker.simulatePhysics(
        this.scene,
        physicsUpdates,
        t
      )
      // physicsUpdates.length = 0
      _updatePhysicsObjects(updatesOut);
    }
  }
  //
  marchingCubes(dims, potential, shift, scale) {
    return physx.physxWorker.marchingCubes(dims, potential, shift, scale);
  }
  //
  createShape(buffer) {
    return physx.physxWorker.createShapePhysics(this.scene, buffer);
  }
  createConvexShape(buffer) {
    return physx.physxWorker.createConvexShapePhysics(this.scene, buffer);
  }
  getPhysicsEnabled() {
    return this.physicsEnabled;
  }
  setPhysicsEnabled(newPhysicsEnabled) {
    this.physicsEnabled = newPhysicsEnabled;
  }
  getGravity() {
    return this.gravity;
  }
}

const physicsManager = {
  scenes: new Map(),
  getScene(instance = null) {
    let scene = this.scenes.get(instance);
    if (!scene) {
      scene = new PhysicsScene({
        instance,
      });
      this.scenes.set(instance, scene);
    }
    return scene;
  },
};
export default physicsManager;