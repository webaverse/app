import * as THREE from './three.module.js';
import runtime from './runtime.js';
import physicsManager from './physics-manager.js';
import {contentIdToFile, unFrustumCull} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

class NpcManager {
  constructor() {
    this.npcs = [];
  }
  getNpcs() {
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
  }
  async addNpc({id, contentId, componentIndex}) {
    const npc = {
      id,
      contentId,
      componentIndex,
      model: null,
      update: () => {},
    };
    this.npcs.push(npc);
    
    const file = await (contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    }, {
      contentId,
    });
    npc.model = o;
    unFrustumCull(o);
    if (this.npcs.includes(npc)) {
      this.scene.add(o);
      
      const component = o.getComponents()[componentIndex];
      console.log('got npc component', addNpc);
      // const {position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], bone = 'Chest'} = component;
      npc.update = () => {
        /* const chest = this.rig.model.isVrm ? this.rig.modelBones[bone] : this.rig.model;
        localMatrix.compose(localVector.fromArray(position), localQuaternion.fromArray(quaternion), localVector2.fromArray(scale))
          .premultiply(chest.matrixWorld)
          .decompose(o.position, o.quaternion, o.scale); */
      };
    }

    return npc;
  }
  removeNpc(npc) {
    npc.model && this.scene.remove(npc.model);
    const index = this.npcs.indexOf(npc);
    if (index !== -1) {
      this.npcs.splice(index, 1);
    }
  }
  update() {
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
      npc.update();
    }
  }
}
const npcManager = new NpcManager();
export default npcManager;