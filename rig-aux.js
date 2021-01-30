import * as THREE from './three.module.js';
import runtime from './runtime.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {avatarScene} from './app-object.js';
import {contentIdToFile} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

export class RigAux {
  constructor(rig) {
    this.rig = rig;

    this.wearables = [];
    this.sittables = [];
    this.pets = [];
    
    this.nextId = 0;
  }
  getPose() {
    const _formatAuxObject = o => ({
      contentId: o.contentId,
      component: o.component,
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
          this.addWearable(newWearable.id, newWearable.contentId, newWearable.component);
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
          this.addSittable(newSittable.id, newSittable.contentId, newSittable.component);
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
          this.addPet(newPet.id, newPet.contentId, newPet.component);
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
  async addWearable(id, contentId, component) {
    const wearable = {
      id,
      contentId,
      component,
      // model: o,
      update: () => {},
    };
    this.wearables.push(wearable);
    
    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    });
    avatarScene.add(o);
    
  	// const component = o.components.find(c => c.type === 'wear');
  	const {position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], bone = 'Chest'} = component;
    wearable.update = now => {
      const chest = this.rig.modelBones[bone];
      localMatrix.compose(localVector.fromArray(position), localQuaternion.fromArray(quaternion), localVector2.fromArray(scale))
        .premultiply(chest.matrixWorld)
        .decompose(o.position, o.quaternion, o.scale);
    };
  }
  removeWearable(wearable) {
    avatarScene.remove(wearable.model);
    this.wearables.splice(this.wearables.indexOf(wearable), 1);
  }
  async addSittable(id, contentId, component) {
    const sittable = {
      id,
      contentId,
      component,
      // model: o,
      update: () => {},
    };
    this.sittables.push(sittable);

    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    });
    avatarScene.add(o);

    const root = o;
    
    let skinnedMesh = null;
    root.traverse(o => {
      if (o.isSkinnedMesh && !skinnedMesh) {
        skinnedMesh = o;
      }
    });
    if (skinnedMesh) {
      const animations = o.getAnimations();
      
      // const component = o.components.find(c => c.type === 'sit');
      const {sitBone = 'Spine', walkAnimation = 'walk'} = component;
      const animation = animations.find(a => a.name === walkAnimation);

      if (animation) {
        // hacks
        {
          root.position.y = 0;
          localEuler.setFromQuaternion(root.quaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          root.quaternion.setFromEuler(localEuler);
        }
        
        const mixer = new THREE.AnimationMixer(root);
        const clip = animation;
        const action = mixer.clipAction(clip);
        action.play();

        const {skeleton} = skinnedMesh;
        const spineBone = root.getObjectByName(sitBone);
        if (spineBone) {
          // const spine = skeleton.bones[spineBoneIndex];
          // const spineBoneMatrix = skeleton.boneMatrices[spineBoneIndex];
          // const spineBoneMatrixInverse = skeleton.boneInverses[spineBoneIndex];

          // const sitTarget = physicsManager.getSitTarget();

          sittable.update = timeDiff => {
            timeDiff *= 1000;
            
            action.weight = physicsManager.velocity.length() * 10;

            const deltaSeconds = timeDiff / 1000;
            mixer.update(deltaSeconds);
          };
        } else {
          console.warn('could not find sit bone in model: ' + sitBone + '; bones available: ' + JSON.stringify(skeleton.bones.map(b => b.name)));
        }
      } else {
        console.warn('could not find walk animation in model: ' + walkAnimation + '; animation available: ' + JSON.stringify(animations.map(a => a.name)));
      }
    } else {
      console.warn('no skinned mesh in model');
    }
  }
  removeSittable(sittable) {
    avatarScene.remove(sittable.model);
    this.sittables.splice(this.sittables.indexOf(sittable), 1);
  }
  async addPet(id, contentId, component) {
    const pet = {
      id,
      contentId,
      component,
      // model: o,
      update: () => {},
    };
    this.pets.push(pet);
    
    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    });
    avatarScene.add(o);

    const mesh = o;
    const animations = mesh.getAnimations();
      
    // const component = mesh.components.find(c => c.type === 'pet');
    const {walkAnimation = 'walk', flyAnimation = 'fly'} = component;
    
    const walkAnimationClip = animations.find(a => a.name === walkAnimation);
    const flyAnimationClip = animations.find(a => a.name === flyAnimation);
    const animation = walkAnimationClip || flyAnimationClip;
    if (animation) {
      // hacks
      {
        mesh.position.y = 0;
        localEuler.setFromQuaternion(mesh.quaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        mesh.quaternion.setFromEuler(localEuler);
      }
      
      const mixer = new THREE.AnimationMixer(mesh);
      const clip = animation;
      const action = mixer.clipAction(clip);
      action.play();

      const smoothVelocity = new THREE.Vector3();
      pet.update = timeDiff => {
        const speed = 0.003;
        timeDiff *= 1000;

        const head = this.rig.modelBones.Head;
        const position = head.getWorldPosition(localVector);
        position.y = 0;
        const distance = mesh.position.distanceTo(position);
        const minDistance = 1;
        let moveDelta;
        if (distance > minDistance) {
          const direction = position.clone().sub(mesh.position).normalize();
          const maxMoveDistance = distance - minDistance;
          const moveDistance = Math.min(speed * timeDiff, maxMoveDistance);
          moveDelta = direction.clone().multiplyScalar(moveDistance);
          mesh.position.add(moveDelta);
          mesh.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction), 0.1);
        } else {
          moveDelta = new THREE.Vector3();
        }
        smoothVelocity.lerp(moveDelta, 0.3);
        if (animation === walkAnimationClip) {
          action.weight = smoothVelocity.length() * 100;
        }

        const deltaSeconds = timeDiff / 1000;
        mixer.update(deltaSeconds);
      };
    } else {
      console.warn('could not find walk animation in model: ' + walkAnimation + '; animation available: ' + JSON.stringify(animations.map(a => a.name)));
    }
  }
  removePet(pet) {
    avatarScene.remove(pet.model);
    this.pets.splice(this.pets.indexOf(pet), 1);
  }
  getNextId() {
    return ++this.nextId;
  }
  decapitate() {
    for (const wearable of this.wearables) {
      if (wearable.component.bone === 'Head') {
        wearable.model.traverse(o => {
          if (o.isMesh) {
            o.savedVisible = o.visible;
            o.visible = false;
          }
        });
      }
    }
  }
  undecapitate() {
    for (const wearable of this.wearables) {
      if (wearable.component.bone === 'Head') {
        wearable.model.traverse(o => {
          if (o.isMesh) {
            o.visible = o.savedVisible;
          }
        });
      }
    }
  }
  update(timeDiff) {
    for (const wearable of this.wearables) {
	    wearable.update(timeDiff);
	  }
    for (const sittable of this.sittables) {
	    sittable.update(timeDiff);
	  }
    for (const pet of this.pets) {
	    pet.update(timeDiff);
	  }
    
    const sitState = this.sittables.length > 0;
    if (sitState) {
      physicsManager.setSitController(this.sittables[0].model);
      const {sitBone = 'Spine'} = this.sittables[0].component;
      const spineBone = this.sittables[0].model.getObjectByName(sitBone);
      physicsManager.setSitTarget(spineBone);
    }          
    rigManager.localRig.sitState = sitState;
    physicsManager.setSitState(sitState);
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