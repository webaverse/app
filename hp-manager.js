import * as THREE from 'three';
import geometryManager from './geometry-manager.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {world} from './world.js';
import {damageMaterial} from './shaders.js';
import {scene, appManager} from './app-object.js';
import dropManager from './drop-manager.js';

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
cylinderMesh.startPosition = new THREE.Vector3();
// scene.add(cylinderMesh);
let damageAnimation = null;
const update = () => {
  const now = Date.now();
  if (document.pointerLockElement && appManager.using) {
    const collision = geometryManager.geometryWorker.collidePhysics(geometryManager.physics, radius, halfHeight, cylinderMesh.position, cylinderMesh.quaternion, 1);
    if (collision) {
      const collisionId = collision.objectId;
      const object = world.getObjectFromPhysicsId(collisionId) || world.getNpcFromPhysicsId(collisionId);
      if (object) {
        const worldPosition = object.getWorldPosition(localVector);
        const {hit, died} = object.hit(40);
        if (died) {
          const deadObject = new THREE.Object3D();
          deadObject.position.copy(worldPosition);
          deadObject.position.y += 0.5;
          dropManager.drop(deadObject, {
            type: 'card',
          });
        } else if (hit) {
          const physics = physicsManager.getGeometry(collisionId);
          if (physics) {
            let geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(physics.positions, 3));
            geometry.setIndex(new THREE.BufferAttribute(physics.indices, 1));
            geometry = geometry.toNonIndexed();
            geometry.computeVertexNormals();

            damagePhysicsMesh.geometry.dispose();
            damagePhysicsMesh.geometry = geometry;
            damagePhysicsMesh.physicsId = collisionId;
            
            const physicsTransform = physicsManager.getPhysicsTransform(collisionId);
            damagePhysicsMesh.position.copy(physicsTransform.position);
            damagePhysicsMesh.quaternion.copy(physicsTransform.quaternion);
            damagePhysicsMesh.scale.copy(physicsTransform.scale);
            
            damageAnimation = {
              startTime: now,
              endTime: now + 300,
            };
          }
        }
      }
    }
  }

  if (damageAnimation) {
    if (now < damageAnimation.endTime) {
      const animationDuration = damageAnimation.endTime - damageAnimation.startTime;
      const f = (now - damageAnimation.startTime) / animationDuration;
      damagePhysicsMesh.material.uniforms.uTime.value = 1-f;
      damagePhysicsMesh.material.uniforms.uTime.needsUpdate = true;
    } else {
      damageAnimation = null;
    }
  }
  damagePhysicsMesh.visible = !!damageAnimation;
  
  const transforms = rigManager.getRigTransforms();
  const {position, quaternion} = transforms[0];
  const outPosition = localVector.copy(position)
    .add(localVector2.set(0, 0, -offsetDistance).applyQuaternion(quaternion));
  cylinderMesh.position.copy(outPosition);
  cylinderMesh.quaternion.copy(quaternion);
  cylinderMesh.startPosition.copy(position);
};

const hitAnimationLength = 300;
const makeHitTracker = ({
  totalHp = 100,
} = {}) => {
  let hp = totalHp;
  const jitterObject = new THREE.Object3D();
  let hitTime = -1;
  jitterObject.hit = (damage = 30) => {
    if (hitTime === -1) {
      hp = Math.max(hp - damage, 0);
      if (hp > 0) {
        hitTime = 0;
        
        jitterObject.dispatchEvent({
          type: 'hit',
          hp,
          totalHp,
          position: cylinderMesh.startPosition.clone(),
          quaternion: cylinderMesh.quaternion.clone(),
        });
        return {
          hit: true,
          died: false,
        };
      } else {
        jitterObject.dispatchEvent({
          type: 'die',
          position: cylinderMesh.startPosition.clone(),
          quaternion: cylinderMesh.quaternion.clone(),
        });
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