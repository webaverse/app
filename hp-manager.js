import * as THREE from 'three';
// import physx from './physx.js';
// import physicsManager from './physics-manager.js';
import {world} from './world.js';
import {damageMaterial} from './shaders.js';
import {scene} from './renderer.js';
import * as sounds from './sounds.js';
import metaversefileApi from 'metaversefile';

// const localVector = new THREE.Vector3();
const localEuler = new THREE.Euler();
// const localMatrix = new THREE.Matrix4();
// const localMatrix2 = new THREE.Matrix4();

const _makeDamagePhysicsMesh = () => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
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
      const animationDuration =
        damageAnimation.endTime - damageAnimation.startTime;
      const f = (timestamp - damageAnimation.startTime) / animationDuration;
      damagePhysicsMesh.material.uniforms.uTime.value = 1 - f;
      damagePhysicsMesh.material.uniforms.uTime.needsUpdate = true;
      damagePhysicsMesh.updateMatrixWorld();
    } else {
      damageAnimation = null;
    }
  }
  damagePhysicsMesh.visible = !!damageAnimation;
};

const triggerDamageAnimation = collisionId => {
  const timestamp = performance.now();
  const physicsObject =
    metaversefileApi.getPhysicsObjectByPhysicsId(collisionId);
  const {physicsMesh} = physicsObject;
  damagePhysicsMesh.geometry = physicsMesh.geometry;
  damagePhysicsMesh.matrix.copy(physicsMesh.matrixWorld);
  damagePhysicsMesh.matrixWorld
    .copy(physicsMesh.matrixWorld)
    .decompose(
      damagePhysicsMesh.position,
      damagePhysicsMesh.quaternion,
      damagePhysicsMesh.scale,
    );
  damagePhysicsMesh.updateMatrixWorld();
  damageAnimation = {
    startTime: timestamp,
    endTime: timestamp + hitAnimationLength,
  };
};

const makeHitTracker = ({totalHp = 100} = {}) => {
  const hitTracker = new THREE.Object3D();
  hitTracker.name = 'hitTracker';

  let hitTime = -1;
  hitTracker.hp = totalHp;
  hitTracker.totalHp = totalHp;
  let currentApp = null;
  const frame = e => {
    hitTracker.update(e.data.timeDiff);
  };
  hitTracker.bind = app => {
    if (!currentApp) {
      app.parent.add(hitTracker);
      hitTracker.add(app);
      hitTracker.updateMatrixWorld();

      world.appManager.addEventListener('frame', frame);

      app.hitTracker = hitTracker;
      currentApp = app;
    } else {
      throw new Error('already bound');
    }
  };
  hitTracker.unbind = () => {
    if (currentApp) {
      if (hitTracker.parent) {
        hitTracker.parent.add(currentApp);
      } else {
        hitTracker.remove(currentApp);
      }
      currentApp.updateMatrixWorld();
      if (hitTracker.parent) {
        hitTracker.parent.remove(hitTracker);
      }

      currentApp = null;

      world.appManager.removeEventListener('frame', frame);
    } else {
      throw new Error('not bound');
    }
  };
  hitTracker.hit = (damage, opts) => {
    const result = hitTracker.damage(damage);
    const {hit, died} = result;
    if (hit) {
      const {collisionId, hitPosition, hitDirection, hitQuaternion} = opts;

      if (died) {
        triggerDamageAnimation(collisionId);

        sounds.playSoundName('enemyDeath');
      }

      {
        const damageMeshApp = metaversefileApi.createApp();
        (async () => {
          const {importModule} = metaversefileApi.useDefaultModules();
          const m = await importModule('damageMesh');
          await damageMeshApp.addModule(m);
        })();
        damageMeshApp.position.copy(hitPosition);
        localEuler.setFromQuaternion(hitQuaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        damageMeshApp.quaternion.setFromEuler(localEuler);
        damageMeshApp.updateMatrixWorld();
        scene.add(damageMeshApp);
      }

      sounds.playSoundName('enemyCut');

      const hitEvent = {
        type: 'hit',
        collisionId,
        hitPosition,
        hitDirection,
        hitQuaternion,
        // willDie,
        hp: hitTracker.hp,
        totalHp: hitTracker.totalHp,
      };
      // hitTracker.dispatchEvent(hitEvent);
      currentApp.dispatchEvent(hitEvent);
      if (died) {
        const dieEvent = {
          type: 'die',
          // position: cylinderMesh.position,
          // quaternion: cylinderMesh.quaternion,
        };
        // hitTracker.dispatchEvent();
        currentApp.dispatchEvent(dieEvent);
      }
    }
    return result;
  };

  hitTracker.damage = damage => {
    if (hitTime === -1) {
      hitTracker.hp = Math.max(hitTracker.hp - damage, 0);
      if (hitTracker.hp > 0) {
        hitTime = 0;

        /* hitTracker.dispatchEvent({
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
  // hitTracker.willDieFrom = damage => (hitTracker.hp - damage) <= 0;
  hitTracker.update = timeDiff => {
    if (hitTime !== -1) {
      hitTime += timeDiff;

      const scale = (1 - hitTime / hitAnimationLength) * 0.1;
      hitTracker.position.set(
        (-1 + Math.random() * 2) * scale,
        (-1 + Math.random() * 2) * scale,
        (-1 + Math.random() * 2) * scale,
      );
      hitTracker.updateMatrixWorld();
      if (hitTime > hitAnimationLength) {
        hitTime = -1;
      }
    }
  };
  return hitTracker;
};

const hpManager = {
  makeHitTracker,
  update,
  // triggerDamageAnimation,
};
export default hpManager;
