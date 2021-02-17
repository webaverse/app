import * as THREE from './three.module.js';
import geometryManager from './geometry-manager.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {activateMaterial} from './shaders.js';
import {scene, appManager} from './app-object.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

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
const update = () => {
  if (document.pointerLockElement) {
    const collision = geometryManager.geometryWorker.collidePhysics(geometryManager.physics, radius, halfHeight, cylinderMesh.position, cylinderMesh.quaternion, 1);
    if (collision) {
      const collisionId = collision.objectId;
      const physics = physicsManager.getGeometry(collisionId);

      if (physics) {
        /* let geometry = new THREE.BufferGeometry();
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
        activatePhysicsMesh.visible = true; */
      }
    }
  }
  
  const transforms = rigManager.getRigTransforms();
  const {position, quaternion} = transforms[0];
  const outPosition = localVector.copy(position)
    .add(localVector2.set(0, 0, -offsetDistance).applyQuaternion(quaternion));
  cylinderMesh.position.copy(outPosition);
  cylinderMesh.quaternion.copy(quaternion);
};

const activateManager = {
  update,
};
export default activateManager;