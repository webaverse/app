import * as THREE from 'three';
import physx from './physx.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import {damageMaterial} from './shaders.js';
import {scene} from './renderer.js';
import totumApi from 'totum';

// const localVector = new THREE.Vector3();
// const localMatrix = new THREE.Matrix4();
// const localMatrix2 = new THREE.Matrix4();

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

const hitAnimationLength = 300;
let damageAnimation = null;
const update = (timestamp, timeDiff) => {
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

const triggerDamageAnimation = collisionId => {
  const timestamp = performance.now();
  const physicsObject = totumApi.getPhysicsObjectByPhysicsId(collisionId);
  const {physicsMesh} = physicsObject;
  damagePhysicsMesh.geometry = physicsMesh.geometry;
  damagePhysicsMesh.matrix.copy(physicsMesh.matrixWorld);
  damagePhysicsMesh.matrixWorld.copy(physicsMesh.matrixWorld)
    .decompose(damagePhysicsMesh.position, damagePhysicsMesh.quaternion, damagePhysicsMesh.scale);
      
  damageAnimation = {
    startTime: timestamp,
    endTime: timestamp + hitAnimationLength,
  };
};

const makeHitTracker = ({
  totalHp = 100,
} = {}) => {
  const jitterObject = new THREE.Object3D();
  jitterObject.name = 'hitTracker';
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
  triggerDamageAnimation,
};
export default hpManager;