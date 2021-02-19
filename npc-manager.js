import * as THREE from './three.module.js';
import runtime from './runtime.js';
import {world} from './world.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
// import {contentIdToFile, unFrustumCull} from './util.js';

const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
const localEuler = new THREE.Euler();

class NpcManager {
  constructor() {
    this.npcs = [];
  }
  /* getNpcs() {
    return this.npcs;
  }
  setNpcs(npcs) {
    for (const newNpc of npcs) {
      if (!this.npcs.some(n => n.id === newNpc.id)) {
        this.addNpc(newNpc);
      }
    }
    const localNpcs = this.npcs.slice();
    for (const oldNpc of localNpcs) {
      if (!npcs.some(n => n.id === oldNpc.id)) {
        this.removeNpc(oldNpc);
      }
    }
  } */
  async addNpc(o, componentIndex) {
    const npc = await world.addNpc(o.contentId, null, o.position, o.quaternion);
    
    const mesh = npc;
    const animations = mesh.getAnimations();
    const component = mesh.getComponents()[componentIndex];
    let  {idleAnimation = ['idle'], aggroDistance, walkSpeed = 1} = component;
    if (idleAnimation) {
      if (!Array.isArray(idleAnimation)) {
        idleAnimation = [idleAnimation];
      }
    } else {
      idleAnimation = [];
    }

    const idleAnimationClips = idleAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
    // console.log('got clips', npc, idleAnimationClips);
    const updateFns = [];
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
      
      updateFns.push(timeDiff => {
        const deltaSeconds = timeDiff / 1000;
        mixer.update(deltaSeconds);
      });
    }

    // const smoothVelocity = new THREE.Vector3();
    updateFns.push(timeDiff => {
      timeDiff *= 1000;

      const head = rigManager.localRig.model.isVrm ? rigManager.localRig.modelBoneOutputs.Head : rigManager.localRig.model;
      const position = head.getWorldPosition(localVector);
      position.y = 0;
      const distance = mesh.position.distanceTo(position);
      const minDistance = 1;
      let moveDelta;
      if (distance > minDistance) {
        const direction = position.clone().sub(mesh.position).normalize();
        const maxMoveDistance = distance - minDistance;
        const moveDistance = Math.min(walkSpeed * timeDiff, maxMoveDistance);
        moveDelta = direction.clone().multiplyScalar(moveDistance);
        mesh.position.add(moveDelta);
        mesh.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction), 0.1);
      } else {
        moveDelta = new THREE.Vector3();
      }
      // smoothVelocity.lerp(moveDelta, 0.3);
    });
    npc.update = timeDiff => {
      for (const fn of updateFns) {
        fn(timeDiff);
      }
    };
    this.npcs.push(npc);
  }
  removeNpc(npc) {
    throw new Error('not implemented');
  }
  update(timeDiff) {
    /* const now = Date.now();
    if (document.pointerLockElement && appManager.using) {
      const collision = geometryManager.geometryWorker.collidePhysics(geometryManager.physics, radius, halfHeight, cylinderMesh.position, cylinderMesh.quaternion, 1);
      if (collision) {
        const collisionId = collision.objectId;
        const object = world.getObjectFromPhysicsId(collisionId);
        if (object) {
          const worldPosition = object.getWorldPosition(localVector);
          const {hit, died} = object.hit();
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
    cylinderMesh.quaternion.copy(quaternion); */
    
    for (const npc of this.npcs) {
      npc.update(timeDiff);
    }
  }
}
const npcManager = new NpcManager();
export default npcManager;