throw new Error('dead code')
import * as THREE from 'three';
import geometryManager from './geometry-manager.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {activateMaterial} from './shaders.js';
import {scene} from './app-object.js';
import totumApi from './totum-api.js';

const localVector = new THREE.Vector3();

const _makeActivatePhysicsMesh = () => {
  const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
  const material = activateMaterial.clone();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.physicsId = 0;
  return mesh;
};

const activatePhysicsMesh = _makeActivatePhysicsMesh();
activatePhysicsMesh.visible = false;
scene.add(activatePhysicsMesh);

const radius = 0.8;
const height = 0;
const halfHeight = height/2;
const offsetDistance = 0.3;
const cylinderMesh = new THREE.Mesh(
  new THREE.CylinderBufferGeometry(radius, radius, height),
  new THREE.MeshBasicMaterial({
    color: 0x00FFFF,
  })
);
// scene.add(cylinderMesh);
let currentCollisionId = null;
const getCurrentPhysicsId = () => currentCollisionId;
const update = () => {
  if (document.pointerLockElement) {
    const collision = geometryManager.geometryWorker.collidePhysics(geometryManager.physics, radius, halfHeight, cylinderMesh.position, cylinderMesh.quaternion, 1);
    if (collision) {
      const collisionId = collision.objectId;
      currentCollisionId = collisionId;
      
      /* const physics = physicsManager.getGeometry(collisionId);
      if (physics) {
        console.log('got physics', physics);
        
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(physics.positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(physics.indices, 1));
        geometry = geometry.toNonIndexed();
        geometry.computeVertexNormals();

        activatePhysicsMesh.geometry.dispose();
        activatePhysicsMesh.geometry = geometry;
        activatePhysicsMesh.physicsId = collisionId;

        const physicsTransform = physicsManager.getPhysicsTransform(collisionId);
        activatePhysicsMesh.position.copy(physicsTransform.position);
        activatePhysicsMesh.quaternion.copy(physicsTransform.quaternion);
        activatePhysicsMesh.scale.copy(physicsTransform.scale);
        activatePhysicsMesh.material.uniforms.uTime.value = (Date.now()%1500)/1500;
        activatePhysicsMesh.material.uniforms.uTime.needsUpdate = true;
        activatePhysicsMesh.visible = true;
      } */
    } else {
      currentCollisionId = null;
    }
  }
  
  const {position, quaternion} = totumApi.useLocalPlayer();
  cylinderMesh.position.copy(position)
    .add(localVector.set(0, 0, -offsetDistance).applyQuaternion(quaternion));
  cylinderMesh.quaternion.copy(quaternion);
};

const activateManager = {
  getCurrentPhysicsId,
  update,
};
export default activateManager;
