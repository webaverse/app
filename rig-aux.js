import * as THREE from './three.module.js';
import {rigManager} from './rig.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

class RigAux {
  constructor() {
    this.wearables = [];
  }
  addWearable(o) {
  	const wearComponent = o.components.find(c => c.type === 'wear');
  	const {position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1]} = wearComponent;
    const update = now => {
      const {localRig} = rigManager;
      const chest = localRig.modelBones.Chest;
      localMatrix.compose(localVector.fromArray(position), localQuaternion.fromArray(quaternion), localVector2.fromArray(scale))
        .premultiply(chest.matrixWorld)
        .decompose(o.position, o.quaternion, o.scale);
    };
    this.wearables.push({
      update,
    });
    o.used = true;
  }
  update(now) {
    for (const wearable of this.wearables) {
	    wearable.update(now);
	  }
  }
}
export const rigAuxManager = new RigAux();