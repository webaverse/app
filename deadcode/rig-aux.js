throw new Error('dead code');
import * as THREE from 'three';
// import runtime from './runtime.js';
import physicsManager from './physics-manager.js';
import dropManager from './drop-manager.js';
import {contentIdToFile, unFrustumCull} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

export class RigAux {
  constructor({rig, scene}) {
    this.rig = rig;
    this.scene = scene;

    this.wearables = [];
    this.sittables = [];
    this.pets = [];
    
    this.nextId = 0;
  }
  getPose() {
    const _formatAuxObject = o => ({
      id: o.id,
      contentId: o.contentId,
      componentIndex: o.componentIndex,
    });
    return {
      wearables: this.wearables.map(_formatAuxObject),
      sittables: this.sittables.map(_formatAuxObject),
      pets: this.pets.map(_formatAuxObject),
    };
  }
  setPose(data) {
    const {wearables, sittables, pets} = data;
    {
      for (const newWearable of wearables) {
        if (!this.wearables.some(w => w.id === newWearable.id)) {
          this.addWearable(newWearable);
        }
      }
      const localWearables = this.wearables.slice();
      for (const oldWearable of localWearables) {
        if (!wearables.some(w => w.id === oldWearable.id)) {
          this.removeWearable(oldWearable);
        }
      }
    }

    {
      for (const newSittable of sittables) {
        if (!this.sittables.some(s => s.id === newSittable.id)) {
          this.addSittable(newSittable);
        }
      }
      const localSittables = this.sittables.slice();
      for (const oldSittable of localSittables) {
        if (!sittables.some(s => s.id === oldSittable.id)) {
          this.removeSittable(oldSittable);
        }
      }
    }

    {
      for (const newPet of pets) {
        if (!this.pets.some(p => p.id === newPet.id)) {
          this.addPet(newPet);
        }
      }
      const localPets = this.pets.slice();
      for (const oldPet of localPets) {
        if (!pets.some(o => o.id === oldPet.id)) {
          this.removePet(oldPet);
        }
      }
    }
  }
  async addWearable({id, contentId, componentIndex}) {
    const wearable = {
      id,
      contentId,
      componentIndex,
      model: null,
      update: () => {},
    };
    this.wearables.push(wearable);
    
    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    }, {
      contentId,
    });
    wearable.model = o;
    unFrustumCull(o);
    if (this.wearables.includes(wearable)) {
      this.scene.add(o);
      
      const component = o.getComponents()[componentIndex];
      const {position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], bone = 'Chest'} = component;
      wearable.update = now => {
        const chest = this.rig.model.isVrm ? this.rig.modelBones[bone] : this.rig.model;
        localMatrix.compose(localVector.fromArray(position), localQuaternion.fromArray(quaternion), localVector2.fromArray(scale))
          .premultiply(chest.matrixWorld)
          .decompose(o.position, o.quaternion, o.scale);
      };
    }

    return wearable;
  }
  removeWearable(wearable) {
    wearable.model && this.scene.remove(wearable.model);
    const index = this.wearables.indexOf(wearable);
    if (index !== -1) {
      this.wearables.splice(index, 1);
    }
  }
  async addSittable({id, contentId, componentIndex}) {
    const sittable = {
      id,
      contentId,
      componentIndex,
      model: null,
      update: () => {},
    };
    this.sittables.push(sittable);

    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    }, {
      contentId,
    });
    sittable.model = o;
    unFrustumCull(o);
    if (this.sittables.includes(sittable)) {
      this.scene.add(o);

      const root = o;
      const animations = o.getAnimations();
      const component = o.getComponents()[componentIndex];
      let {walkAnimation = ['walk'], idleAnimation = ['idle'], walkAnimationHoldTime = 0, walkAnimationSpeedFactor = 100} = component;
      if (walkAnimation) {
        if (!Array.isArray(walkAnimation)) {
          walkAnimation = [walkAnimation];
        }
      } else {
        walkAnimation = [];
      }
      if (idleAnimation) {
        if (!Array.isArray(idleAnimation)) {
          idleAnimation = [idleAnimation];
        }
      } else {
        idleAnimation = [];
      }
      const walkAnimationClips = walkAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
      const idleAnimationClips = idleAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);

      if (walkAnimationClips.length > 0 || idleAnimationClips.length > 0) {
        // hacks
        {
          root.position.y = 0;
          localEuler.setFromQuaternion(root.quaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          root.quaternion.setFromEuler(localEuler);
        }
        
        const mixer = new THREE.AnimationMixer(root);
        const walkActions = walkAnimationClips.map(walkAnimationClip => mixer.clipAction(walkAnimationClip));
        for (const walkAction of walkActions) {
          walkAction.play();
        }
        const idleActions = idleAnimationClips.map(idleAnimationClip => mixer.clipAction(idleAnimationClip));
        for (const idleAction of idleActions) {
          idleAction.play();
        }

        sittable.update = timeDiff => {
          for (const walkAction of walkActions) {
            walkAction.weight = Math.min(Math.max(physicsManager.velocity.length() * walkAnimationSpeedFactor, 0), 1);
            if (walkAnimationHoldTime) {
              walkAction.time = walkAnimationHoldTime;
            }
          }
          for (const idleAction of idleActions) {
            idleAction.weight = walkActions.length > 0 ? (1 - walkActions[0].weight) : 1;
          }

          mixer.update(timeDiff);
        };
      } /* else {
        console.warn('could not find walk animation in model: ' + JSON.stringify(walkAnimation) + '; animation available: ' + JSON.stringify(animations.map(a => a.name)));
      } */
    }
    
    return sittable;
  }
  removeSittable(sittable) {
    sittable.model && this.scene.remove(sittable.model);
    const index = this.sittables.indexOf(sittable);
    if (index !== -1) {
      this.sittables.splice(index, 1);
    }
  }
  async addPet({id, contentId, componentIndex}) {
    const pet = {
      id,
      contentId,
      componentIndex,
      model: null,
      update: () => {},
    };
    this.pets.push(pet);
    
    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    }, {
      contentId,
    });
    pet.model = o;
    unFrustumCull(o);
    if (this.pets.includes(pet)) {
      this.scene.add(o);

      const mesh = o;
      const animations = mesh.getAnimations();
      const component = mesh.getComponents()[componentIndex];
      let  {walkAnimation = ['walk'], flyAnimation = ['fly'], idleAnimation = ['idle']} = component;
      if (walkAnimation) {
        if (!Array.isArray(walkAnimation)) {
          walkAnimation = [walkAnimation];
        }
      } else {
        walkAnimation = [];
      }
      if (flyAnimation) {
        if (!Array.isArray(flyAnimation)) {
          flyAnimation = [flyAnimation];
        }
      } else {
        flyAnimation = [];
      }
      if (idleAnimation) {
        if (!Array.isArray(idleAnimation)) {
          idleAnimation = [idleAnimation];
        }
      } else {
        idleAnimation = [];
      }

      const walkAnimationClips = walkAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
      const flyAnimationClips = flyAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
      const idleAnimationClips = idleAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
      const moveAnimationClips = walkAnimationClips.concat(flyAnimationClips);
      if (moveAnimationClips.length > 0 || idleAnimationClips.length > 0) {
        // hacks
        {
          mesh.position.y = 0;
          localEuler.setFromQuaternion(mesh.quaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          mesh.quaternion.setFromEuler(localEuler);
        }
        
        const mixer = new THREE.AnimationMixer(mesh);
        const walkActions = walkAnimationClips.map(walkAnimationClip => mixer.clipAction(walkAnimationClip));
        for (const walkAction of walkActions) {
          walkAction.play();
        }
        const flyActions = flyAnimationClips.map(flyAnimationClip => mixer.clipAction(flyAnimationClip));
        for (const flyAction of flyActions) {
          flyAction.play();
        }
        const idleActions = idleAnimationClips.map(idleAnimationClip => mixer.clipAction(idleAnimationClip));
        for (const idleAction of idleActions) {
          idleAction.play();
        }

        const smoothVelocity = new THREE.Vector3();
        pet.update = timeDiff => {
          const speed = 0.003;
          timeDiff *= 1000;

          const drop = component.attractedTo === 'fruit' ? (
            dropManager.getDrops().filter(d => d.isFruit).sort((a, b) => {
              return a.position.distanceTo(pet.model.position) - b.position.distanceTo(pet.model.position);
            })[0] || null
          ) : null;
          const head = (() => {
            if (drop) {
              return drop;
            } else {
              if (this.rig.model.isVrm) {
                return this.rig.modelBones.Head;
              } else {
                return this.rig.model;
              }
            }
          })();
          const position = head.getWorldPosition(localVector);
          position.y = 0;
          const distance = mesh.position.distanceTo(position);
          const minDistance = 1;
          let moveDelta;
          if ((distance - minDistance) > 0.01) { // handle rounding errors
            // console.log('distance', distance, minDistance);
            const direction = position.clone().sub(mesh.position).normalize();
            const maxMoveDistance = distance - minDistance;
            const moveDistance = Math.min(speed * timeDiff, maxMoveDistance);
            moveDelta = direction.clone().multiplyScalar(moveDistance);
            mesh.position.add(moveDelta);
            mesh.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction), 0.1);
          } else {
            moveDelta = new THREE.Vector3();
            
            // console.log('check', head === drop, component.attractedTo === 'fruit', typeof component.eatSpeed === 'number');
            if (head === drop && component.attractedTo === 'fruit' && typeof component.eatSpeed === 'number') {
              drop.scale.subScalar(1/component.eatSpeed*timeDiff);
              // console.log('new scale', drop.scale.toArray());
              if (drop.scale.x <= 0 || drop.scale.y <= 0 || drop.scale.z <= 0) {
                dropManager.removeDrop(drop);
              }
            }
          }
          smoothVelocity.lerp(moveDelta, 0.3);
          for (const walkAction of walkActions) {
            walkAction.weight = Math.min(Math.max(smoothVelocity.length() * 100, 0), 1);
          }
          for (const idleAction of idleActions) {
            idleAction.weight = walkActions.length > 0 ? (1 - walkActions[0].weight) : 1;
          }

          const deltaSeconds = timeDiff / 1000;
          mixer.update(deltaSeconds);
        };
      } /* else {
        console.warn('could not find walk animation in model: ' + walkAnimation + '; animation available: ' + JSON.stringify(animations.map(a => a.name)));
      } */
    }
    
    return pet;
  }
  removePet(pet) {
    pet.model && this.scene.remove(pet.model);
    const index = this.pets.indexOf(pet);
    if (index !== -1) {
      this.pets.splice(index, 1);
    }
  }
  getNextId() {
    return ++this.nextId;
  }
  decapitate() {
    for (const wearable of this.wearables) {
      if (wearable.model) {
        const component = wearable.model.getComponents()[wearable.componentIndex];
        if (component.bone === 'Head') {
          wearable.model.traverse(o => {
            if (o.isMesh) {
              o.savedVisible = o.visible;
              o.visible = false;
            }
          });
        }
      }
    }
  }
  undecapitate() {
    for (const wearable of this.wearables) {
      if (wearable.model) {
        const component = wearable.model.getComponents()[wearable.componentIndex];
        if (component.bone === 'Head') {
          wearable.model.traverse(o => {
            if (o.isMesh) {
              o.visible = o.savedVisible;
            }
          });
        }
      }
    }
  }
  update(now, timeDiff) {
    for (const wearable of this.wearables) {
	    wearable.update(timeDiff);
	  }
    for (const sittable of this.sittables) {
	    sittable.update(timeDiff);
	  }
    for (const pet of this.pets) {
	    pet.update(timeDiff);
	  }
  }
  destroy() {
    {
      const localWearables = this.wearables.slice();
      for (const wearable of localWearables) {
        this.removeWearable(wearable);
      }
    }
    {    
      const localSittables = this.sittables.slice();
      for (const sittable of localSittables) {
        this.removeSittable(sittable);
      }
    }
    {    
      const localPets = this.pets.slice();
      for (const pet of localPets) {
        this.removePet(pet);
      }
    }
  }
}