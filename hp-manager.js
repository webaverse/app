import * as THREE from 'three';
import geometryManager from './geometry-manager.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {world} from './world.js';
import {damageMaterial} from './shaders.js';
import {scene} from './app-object.js';
import dropManager from './drop-manager.js';
import metaversefileApi from './metaversefile-api.js';

const localVector = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

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

const radius = 1;
const height = 0.2;
const halfHeight = height/2;
const offsetDistance = 0.3;
const cylinderMesh = new THREE.Mesh(
  new THREE.CylinderBufferGeometry(radius, radius, height),
  new THREE.MeshBasicMaterial({
    color: 0x00FFFF,
  })
);
cylinderMesh.startPosition = new THREE.Vector3();
const hitAnimationLength = 300;
let damageAnimation = null;
const update = (timestamp, timeDiff) => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  
  cylinderMesh.position.copy(localPlayer.position)
    .add(localVector.set(0, 0, -offsetDistance).applyQuaternion(localPlayer.quaternion));
  cylinderMesh.quaternion.copy(localPlayer.quaternion);
  cylinderMesh.startPosition.copy(localPlayer.position);
  
  const useAction = localPlayer.actions.find(action => action.type === 'use');
  if (useAction && useAction.animation === 'combo') {
    const collision = geometryManager.geometryWorker.collidePhysics(geometryManager.physics, radius, halfHeight, cylinderMesh.position, cylinderMesh.quaternion, 1);
    if (collision) {
      const collisionId = collision.objectId;
      const object = world.getObjectFromPhysicsId(collisionId);// || world.getNpcFromPhysicsId(collisionId);
      if (object) {
        const worldPosition = object.getWorldPosition(localVector);
        const {hit, died} = object.hitTracker.hit(typeof useAction.damage === 'number' ? useAction.damage : 30);
        
        if (hit) {
          /* if (damagePhysicsMesh.physicsId !== collisionId) {
            const physicsGeometry = physicsManager.getGeometryForPhysicsId(collisionId);
            let geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(physicsGeometry.positions, 3));
            geometry.setIndex(new THREE.BufferAttribute(physicsGeometry.indices, 1));
            geometry = geometry.toNonIndexed();
            geometry.computeVertexNormals();

            damagePhysicsMesh.geometry.dispose();
            damagePhysicsMesh.geometry = geometry;
            damagePhysicsMesh.physicsId = collisionId;
          } */
              
          const physicsObject = physicsManager.getPhysicsObject(collisionId);
          const {physicsMesh} = physicsObject;
          damagePhysicsMesh.geometry = physicsMesh.geometry;
          damagePhysicsMesh.matrix.copy(physicsMesh.matrixWorld);
          damagePhysicsMesh.matrixWorld.copy(physicsMesh.matrixWorld)
            .decompose(damagePhysicsMesh.position, damagePhysicsMesh.quaternion, damagePhysicsMesh.scale);
              
          damageAnimation = {
            startTime: timestamp,
            endTime: timestamp + hitAnimationLength,
          };
          
          object.dispatchEvent({
            type: 'hit',
            position: cylinderMesh.position,
            quaternion: cylinderMesh.quaternion,
            hp: object.hitTracker.hp,
            totalHp: object.hitTracker.totalHp,
          });
        }
        if (died) {
          object.dispatchEvent({
            type: 'die',
            position: cylinderMesh.position,
            quaternion: cylinderMesh.quaternion,
          });
        }
      }
    }
  }

  if (damageAnimation) {
    if (timestamp < damageAnimation.endTime) {
      const animationDuration = damageAnimation.endTime - damageAnimation.startTime;
      const f = (timestamp - damageAnimation.startTime) / animationDuration;
      damagePhysicsMesh.material.uniforms.uTime.value = 1-f;
      damagePhysicsMesh.material.uniforms.uTime.needsUpdate = true;
    } else {
      damageAnimation = null;
    }
  }
  damagePhysicsMesh.visible = !!damageAnimation;
};

const makeHitTracker = ({
  totalHp = 100,
} = {}) => {
  const jitterObject = new THREE.Object3D();
  let hitTime = -1;
  jitterObject.hp = totalHp;
  jitterObject.totalHp = totalHp;
  jitterObject.hit = damage => {
    if (hitTime === -1) {
      jitterObject.hp = Math.max(jitterObject.hp - damage, 0);
      if (jitterObject.hp > 0) {
        hitTime = 0;
        
        /* jitterObject.dispatchEvent({
          type: 'hit',
          hp,
          totalHp,
          position: cylinderMesh.startPosition.clone(),
          quaternion: cylinderMesh.quaternion.clone(),
        }); */
        return {
          hit: true,
          died: false,
        };
      } else {
        /* jitterObject.dispatchEvent({
          type: 'die',
          position: cylinderMesh.startPosition.clone(),
          quaternion: cylinderMesh.quaternion.clone(),
        }); */
        return {
          hit: true,
          died: true,
        };
      }
    } else {
      return {
        hit: false,
        died: false,
      };
    }
  };
  jitterObject.update = timeDiff => {
    if (hitTime !== -1) {
      hitTime += timeDiff;
      
      const scale = (1-hitTime/hitAnimationLength) * 0.1;
      jitterObject.position.set((-1+Math.random()*2)*scale, (-1+Math.random()*2)*scale, (-1+Math.random()*2)*scale);

      if (hitTime > hitAnimationLength) {
        hitTime = -1;
      }
    }
  };
  return jitterObject;
};

const hpManager = {
  makeHitTracker,
  update,
};
export default hpManager;