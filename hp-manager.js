import * as THREE from './three.module.js';
/* import {GLTFLoader} from './GLTFLoader.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import cameraManager from './camera-manager.js';
import uiManager from './ui-manager.js';
import ioManager from './io-manager.js';
import {loginManager} from './login.js';
import {world} from './world.js';
import * as universe from './universe.js';
import {rigManager} from './rig.js';
// import {rigAuxManager} from './rig-aux.js';
import {buildMaterial, damageMaterial} from './shaders.js';
import {makeTextMesh} from './vr-ui.js';
import {teleportMeshes} from './teleport.js';
import {appManager, renderer, scene, orthographicScene, camera, dolly} from './app-object.js';
import {inventoryAvatarScene, inventoryAvatarCamera, inventoryAvatarRenderer, update as inventoryUpdate} from './inventory.js';
import buildTool from './build-tool.js';
import * as notifications from './notifications.js';
import * as popovers from './popovers.js';
import messages from './messages.js';
import {getExt, bindUploadFileButton, updateGrabbedObject} from './util.js';
import {baseUnit, maxGrabDistance, storageHost, worldsHost} from './constants.js';
import fx from './fx.js'; */
import geometryManager from './geometry-manager.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {damageMaterial} from './shaders.js';
import {scene} from './app-object.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

const _makeDamagePhysicsMesh = () => {
  const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
  const material = damageMaterial.clone();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.physicsId = 0;
  return mesh;
};

const damagePhysicsMesh = _makeDamagePhysicsMesh();
damagePhysicsMesh.visible = false;
scene.add(damagePhysicsMesh);

const hitMelee = () => {
  if (document.pointerLockElement) {
    // cylinderMesh.position
    /* _getAvatarCapsule(localVector);
    localVector.add(p); */
    const collision = geometryManager.geometryWorker.collidePhysics(geometryManager.physics, radius, halfHeight, cylinderMesh.position, cylinderMesh.quaternion, 1);
    if (collision) {
      if (damagePhysicsMesh) {
        const collisionId = collision.id;
        const physics = physicsManager.getGeometry(collisionId);

        if (physics) {
          let geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(physics.positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(physics.indices, 1));
          geometry = geometry.toNonIndexed();
          geometry.computeVertexNormals();

          damagePhysicsMesh.geometry.dispose();
          damagePhysicsMesh.geometry = geometry;
          // damagePhysicsMesh.scale.setScalar(1.05);
          damagePhysicsMesh.physicsId = collisionId;

          const physicsTransform = physicsManager.getPhysicsTransform(collisionId);
          damagePhysicsMesh.position.copy(physicsTransform.position);
          damagePhysicsMesh.quaternion.copy(physicsTransform.quaternion);
          damagePhysicsMesh.material.uniforms.uTime.value = (Date.now()%1500)/1500;
          damagePhysicsMesh.material.uniforms.uTime.needsUpdate = true;
          damagePhysicsMesh.visible = true;
        }
      }
    }
    /* if (highlightedPhysicsObject) {
      if (highlightPhysicsMesh.physicsId !== highlightedPhysicsId) {
        const physics = physicsManager.getGeometry(highlightedPhysicsId);

        if (physics) {
          let geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(physics.positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(physics.indices, 1));
          geometry = geometry.toNonIndexed();
          geometry.computeVertexNormals();

          highlightPhysicsMesh.geometry.dispose();
          highlightPhysicsMesh.geometry = geometry;
          // highlightPhysicsMesh.scale.setScalar(1.05);
          highlightPhysicsMesh.physicsId = highlightedPhysicsId;
        }
      }

      const physicsTransform = physicsManager.getPhysicsTransform(highlightedPhysicsId);
      highlightPhysicsMesh.position.copy(physicsTransform.position);
      highlightPhysicsMesh.quaternion.copy(physicsTransform.quaternion);
      highlightPhysicsMesh.material.uniforms.uTime.value = (Date.now()%1500)/1500;
      highlightPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
      highlightPhysicsMesh.visible = true;
    } */
  }
};

const radius = 1/2;
const height = 1;
const halfHeight = height/2;
const offsetDistance = 0.3;
const cylinderMesh = new THREE.Mesh(
  new THREE.CylinderBufferGeometry(radius, radius, height),
  new THREE.MeshBasicMaterial({
    color: 0x00FFFF,
  })
);
scene.add(cylinderMesh);
const update = () => {
  const transforms = rigManager.getRigTransforms();
  const {position, quaternion} = transforms[0];
  const outPosition = localVector.copy(position)
    .add(localVector2.set(0, 0, -offsetDistance).applyQuaternion(quaternion));
  cylinderMesh.position.copy(outPosition);
  cylinderMesh.quaternion.copy(quaternion);
};

const hpManager = {
  hitMelee,
  update,
};
export default hpManager;