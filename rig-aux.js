import * as THREE from './three.module.js';
import runtime from './runtime.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import {scene} from './app-object.js';
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
    return {
      wearables: this.wearables.map(o => o.id),
      sittables: this.sittables.map(o => o.id),
      pets: this.pets.map(o => o.id),
    };
  }
  setPose(data) {
    const {wearables, sittables, pets} = data;
  }
  async addWearable(contentId, wearComponent) {
    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    });
    scene.add(o);
    
  	// const wearComponent = o.components.find(c => c.type === 'wear');
  	const {position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], bone = 'Chest'} = wearComponent;
    const update = now => {
      const {localRig} = rigManager;
      const chest = localRig.modelBones[bone];
      localMatrix.compose(localVector.fromArray(position), localQuaternion.fromArray(quaternion), localVector2.fromArray(scale))
        .premultiply(chest.matrixWorld)
        .decompose(o.position, o.quaternion, o.scale);
    };
    const id = ++this.nextId;
    this.wearables.push({
      id,
      contentId,
      update,
    });
  }
  async addSittable(contentId, sitComponent) {
    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    });
    scene.add(o);
    
    /* const srcUrl = 'https://avaer.github.io/dragon-mount/dragon.glb';
    let o = await new Promise((accept, reject) => {
      gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
    }); */
    const root = o;
    /* o = o.scene;
    // o.scale.multiplyScalar(0.2);
    scene.add(o); */
    
    let skinnedMesh = null;
    root.traverse(o => {
      if (o.isSkinnedMesh && !skinnedMesh) {
        skinnedMesh = o;
      }
    });
    if (skinnedMesh) {
      const animations = o.getAnimations();
      
      // const sitComponent = o.components.find(c => c.type === 'sit');
      const {sitBone = 'Spine', walkAnimation = 'walk'} = sitComponent;
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
        const spineBoneIndex = skeleton.bones.findIndex(b => b.name === sitBone);
        const spineBone = root.getObjectByName(sitBone);
        if (spineBoneIndex !== -1 && spineBone) {
          // const spine = skeleton.bones[spineBoneIndex];
          // const spineBoneMatrix = skeleton.boneMatrices[spineBoneIndex];
          // const spineBoneMatrixInverse = skeleton.boneInverses[spineBoneIndex];
          
          physicsManager.setSitState(true);
          // const sitTarget = physicsManager.getSitTarget();
          physicsManager.setSitController(root);
          physicsManager.setSitTarget(spineBone);
          
          rigManager.localRig.sitState = true;

          const update = timeDiff => {
            timeDiff *= 1000;
            // console.log('velocity', physicsManager.velocity.length());
            
            action.weight = physicsManager.velocity.length() * 10;

            const deltaSeconds = timeDiff / 1000;
            mixer.update(deltaSeconds);
            
            // spineBone.updateMatrixWorld();
            // const bonePosition = spineBone.getWorldPosition(new THREE.Vector3());
            
            
            // rigManager.localRig.sitTarget.matrixWorld.decompose(spine.position, spine.quaternion, localVector);
            
            // rigManager.localRigMatrix.decompose(localVector, localQuaternion, localVector2);
            // rigManager.setLocalRigMatrix(rigManager.localRigMatrix.compose(localVector, cubeMesh.quaternion, localVector2));
          };
          const id = ++this.nextId;
          this.sittables.push({
            id,
            contentId,
            update,
          });
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
  async addPet(contentId, petComponent) {
    const file = await contentIdToFile(contentId);
    const o = await runtime.loadFile(file, {
      local: true,
    });
    scene.add(o);

    const mesh = o;
    const animations = mesh.getAnimations();
      
    // const petComponent = mesh.components.find(c => c.type === 'pet');
    const {walkAnimation = 'walk'} = petComponent;
    
    const animation = animations.find(a => a.name === walkAnimation);
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
      const update = timeDiff => {
        const speed = 0.003;
        timeDiff *= 1000;
        
        const transforms = rigManager.getRigTransforms();
        let {position, quaternion} = transforms[0];
        position = position.clone();
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
        action.weight = smoothVelocity.length() * 100;
        
        const deltaSeconds = timeDiff / 1000;
        mixer.update(deltaSeconds);
      };
      const id = ++this.nextId;
      this.pets.push({
        id,
        contentId,
        update,
      });
    } else {
      console.warn('could not find walk animation in model: ' + walkAnimation + '; animation available: ' + JSON.stringify(animations.map(a => a.name)));
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
  }
}