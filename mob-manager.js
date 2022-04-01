import * as THREE from 'three';
// import runtime from './runtime.js';
// import {world} from './world.js';
import {localPlayer} from './players.js';
import physicsManager from './physics-manager.js';
// import {rigManager} from './rig.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

function makeCharacterController(app) {
  /* const avatarHeight = this.avatar.height;
  const radius = baseRadius/heightFactor * avatarHeight;
  const height = avatarHeight - radius*2;

  const contactOffset = 0.1/heightFactor * avatarHeight;
  const stepOffset = 0.5/heightFactor * avatarHeight;

  const position = this.position.clone()
    .add(new THREE.Vector3(0, -avatarHeight/2, 0));
  const physicsMaterial = new THREE.Vector3(0, 0, 0);

  if (this.characterController) {
    physicsManager.destroyCharacterController(this.characterController);
    this.characterController = null;
    // this.characterControllerObject = null;
  } */
  const fullHeight = 0.5;
  const radius = 0.2;
  const height = fullHeight - radius * 2;
  const contactOffset = 0.1 * fullHeight;
  const stepOffset = 0.2 * fullHeight;

  const position = app.position.clone();
  const physicsMaterial = new THREE.Vector3(0, 0, 0);
  
  const characterController = physicsManager.createCharacterController(
    radius - contactOffset,
    height,
    contactOffset,
    stepOffset,
    position,
    physicsMaterial
  );
  // this.characterControllerObject = new THREE.Object3D();
  return characterController;
}

class Mob {
  constructor(app) {
    this.app = app;
    
    this.updateFns = [];
    this.cleanupFns = [];

    const mobComponent = app.getComponent('mob');
    if (mobComponent) {
      const mesh = app;
      const animations = app.glb.animations;
      let  {idleAnimation = ['idle'], aggroDistance, walkSpeed = 1} = mobComponent;
      if (idleAnimation) {
        if (!Array.isArray(idleAnimation)) {
          idleAnimation = [idleAnimation];
        }
      } else {
        idleAnimation = [];
      }

      const characterController = makeCharacterController(app);

      const idleAnimationClips = idleAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
      // console.log('got clips', npc, idleAnimationClips);
      if (idleAnimationClips.length > 0) {
        // hacks
        {
          mesh.position.y = 0;
          localEuler.setFromQuaternion(mesh.quaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          mesh.quaternion.setFromEuler(localEuler);
        }
        
        const mixer = new THREE.AnimationMixer(mesh);
        const idleActions = idleAnimationClips.map(idleAnimationClip => mixer.clipAction(idleAnimationClip));
        for (const idleAction of idleActions) {
          idleAction.play();
        }
        
        this.updateFns.push((timestamp, timeDiff) => {
          const deltaSeconds = timeDiff / 1000;
          mixer.update(deltaSeconds);
        });
      }

      let animation = null;
      this.updateFns.push((timestamp, timeDiff) => {
        const timeDiffS = timeDiff / 1000;
        // console.log('do update');

        /* const _updatePhysics = () => {
          const physicsIds = mesh.getPhysicsIds();
          for (const physicsId of physicsIds) {
            physicsManager.setPhysicsTransform(physicsId, mesh.position, mesh.quaternion, mesh.scale);
          }
        }; */

        if (animation) {
          mesh.position.add(localVector.copy(animation.velocity).multiplyScalar(timeDiff/1000));
          animation.velocity.add(localVector.copy(physicsManager.getGravity()).multiplyScalar(timeDiff/1000));
          if (mesh.position.y < 0) {
            animation = null;
          }

          physicsManager.setCharacterControllerPosition(characterController, mesh.position);
          
          // _updatePhysics();
        } else {
          // const head = rigManager.localRig.model.isVrm ? rigManager.localRig.modelBones.Head : rigManager.localRig.model;
          const position = localVector.copy(localPlayer.position)
          position.y = 0;
          const distance = mesh.position.distanceTo(position);
          if (distance < aggroDistance) {
            const minDistance = 1;
            if (distance > minDistance) {
              const direction = position.clone().sub(mesh.position).normalize();
              const maxMoveDistance = distance - minDistance;
              const moveDistance = Math.min(walkSpeed * timeDiff * 1000, maxMoveDistance);
              const moveDelta = direction.clone().multiplyScalar(moveDistance);
              // mesh.position.add(moveDelta);
              const minDist = 0;

              const flags = physicsManager.moveCharacterController(
                characterController,
                moveDelta,
                minDist,
                timeDiffS,
                characterController.position
              );

              mesh.position.copy(characterController.position);
              
              /* const closestNpc = this.mobs.sort((a, b) => {
                return a.app.position.distanceTo(app.position) - b.app.position.distanceTo(app.position);
              })[0];
              const moveBufferDistance = 1;
              if (closestNpc && closestNpc.position.distanceTo(app.position) >= (moveDistance + moveBufferDistance)) {
                mesh.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction), 0.1);
              } else {
                mesh.position.sub(moveDelta);
              } */
              const targetQuaternion = localQuaternion
                .setFromRotationMatrix(
                  localMatrix
                    .lookAt(
                      mesh.position,
                      localPlayer.position,
                      localVector2.set(0, 1, 0)
                    )
                );
              // .setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
              localEuler.setFromQuaternion(targetQuaternion, 'YXZ');
              localEuler.x = 0;
              localEuler.y += Math.PI;
              localEuler.z = 0;
              localQuaternion.setFromEuler(localEuler);
              mesh.quaternion.slerp(targetQuaternion, 0.1);
              
              // _updatePhysics();
            }
          }
        }
        mesh.updateMatrixWorld();
      });
      const hit = e => {
        const {hitQuaternion} = e;
        const euler = new THREE.Euler().setFromQuaternion(hitQuaternion, 'YXZ');
        euler.x = 0;
        euler.z = 0;
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        const hitSpeed = 1;
        animation = {
          velocity: new THREE.Vector3(0, 6, -5).applyQuaternion(quaternion).multiplyScalar(hitSpeed),
        };
      };
      app.addEventListener('hit', hit);
      this.cleanupFns.push(() => {
        app.removeEventListener('hit', hit);
      });
    }
  }
  update(timestamp, timeDiff) {
    for (const fn of this.updateFns) {
      fn(timestamp, timeDiff);
    }
  }
  destroy() {
    for (const fn of this.cleanupFns) {
      fn();
    }
  }
}

class MobManager {
  constructor() {
    this.mobs = [];
  }
  async addMob(app) {
    if (app.appType !== 'glb') {
      throw new Error('only glb apps can be mobs');
    }

    // const npc = await world.addNpc(o.contentId, null, o.position, o.quaternion);
    // console.log('add mob', app);

    const mob = new Mob(app);
    this.mobs.push(mob);
  }
  removeMob(app) {
    const index = this.mobs.findIndex(mob => mob.app === app);
    if (index !== -1) {
      const mob = this.mobs[index];
      mob.destroy();
      this.mobs.splice(index, 1);
    }
  }
  update(timestamp, timeDiff) {
    for (const mob of this.mobs) {
      mob.update(timestamp, timeDiff);
    }
  }
}
const mobManager = new MobManager();

export default mobManager;