import * as THREE from './three.module.js';
import runtime from './runtime.js';
import {world} from './world.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';

const localVector = new THREE.Vector3();
const localEuler = new THREE.Euler();

class NpcManager {
  constructor() {
    this.npcs = [];
  }
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

    updateFns.push(timeDiff => {
      timeDiff *= 1000;

      const head = rigManager.localRig.model.isVrm ? rigManager.localRig.modelBones.Head : rigManager.localRig.model;
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
        
        const physicsIds = mesh.getPhysicsIds();
        for (const physicsId of physicsIds) {
          physicsManager.setPhysicsTransform(physicsId, mesh.position, mesh.quaternion, mesh.scale);
        }
      } else {
        moveDelta = new THREE.Vector3();
      }
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
    for (const npc of this.npcs) {
      npc.update(timeDiff);
    }
  }
}
const npcManager = new NpcManager();
export default npcManager;