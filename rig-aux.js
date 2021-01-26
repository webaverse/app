import * as THREE from './three.module.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

class RigAux {
  constructor() {
    this.wearables = [];
    this.sittables = [];
  }
  addWearable(o) {
  	const wearComponent = o.components.find(c => c.type === 'wear');
  	const {position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], bone = 'Chest'} = wearComponent;
    const update = now => {
      const {localRig} = rigManager;
      const chest = localRig.modelBones[bone];
      localMatrix.compose(localVector.fromArray(position), localQuaternion.fromArray(quaternion), localVector2.fromArray(scale))
        .premultiply(chest.matrixWorld)
        .decompose(o.position, o.quaternion, o.scale);
    };
    this.wearables.push({
      update,
    });
    o.used = true;
  }
  addSittable(o) {
    /* const srcUrl = 'https://avaer.github.io/dragon-mount/dragon.glb';
    let o = await new Promise((accept, reject) => {
      gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
    }); */
    const root = o;
    /* o = o.scene;
    // o.scale.multiplyScalar(0.2);
    scene.add(o); */
    
    let mesh = null;
    root.traverse(o => {
      if (o.isSkinnedMesh && !mesh) {
        mesh = o;
      }
    });
    if (mesh) {
      const animations = o.getAnimations();
      
      const sitComponent = o.components.find(c => c.type === 'sit');
      // console.log('got sit component', sitComponent);
      const {sitBone = 'Spine', walkAnimation = 'walk'} = sitComponent;
      const animation = animations.find(a => a.name === walkAnimation);

      if (animation) {
        // hacks
        {
          root.position.y = 0;
        }
        
        const mixer = new THREE.AnimationMixer(root);
        const clip = animation;
        const action = mixer.clipAction(clip);
        action.play();

        const {skeleton} = mesh;
        const spineBoneIndex = skeleton.bones.findIndex(b => b.name === sitBone);
        const spineBone = root.getObjectByName(sitBone);
        if (spineBoneIndex !== -1 && spineBone) {
          // const spine = skeleton.bones[spineBoneIndex];
          // const spineBoneMatrix = skeleton.boneMatrices[spineBoneIndex];
          // const spineBoneMatrixInverse = skeleton.boneInverses[spineBoneIndex];
          // console.log('got spine', mesh, skeleton);
          // window.THREE = THREE;
          
          physicsManager.setSitState(true);
          // const sitTarget = physicsManager.getSitTarget();
          physicsManager.setSitController(root);
          physicsManager.setSitTarget(spineBone);
          
          rigManager.localRig.sitState = true;

          let lastTimestamp = Date.now();
          const smoothVelocity = new THREE.Vector3();
          const update = now => {
            // const speed = 0.003;
            const timeDiff = now - lastTimestamp;
            
            // console.log('velocity', physicsManager.velocity.length());
            
            action.weight = physicsManager.velocity.length() * 10;

            const deltaSeconds = timeDiff / 1000;
            mixer.update(deltaSeconds);
            lastTimestamp = now;
            
            // spineBone.updateMatrixWorld();
            // const bonePosition = spineBone.getWorldPosition(new THREE.Vector3());
            
            
            // rigManager.localRig.sitTarget.matrixWorld.decompose(spine.position, spine.quaternion, localVector);
            
            // rigManager.localRigMatrix.decompose(localVector, localQuaternion, localVector2);
            // rigManager.setLocalRigMatrix(rigManager.localRigMatrix.compose(localVector, cubeMesh.quaternion, localVector2));
          };
          this.sittables.push({
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
  update(now) {
    for (const wearable of this.wearables) {
	    wearable.update(now);
	  }
    for (const sittable of this.sittables) {
	    sittable.update(now);
	  }
  }
}
export const rigAuxManager = new RigAux();