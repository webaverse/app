import THREE from '../../three.module.js';

const _makeFingers = () => {
  const result = Array(25);
  for (let i = 0; i < result.length; i++) {
    result[i] = new THREE.Object3D();
  }
  return result;
};

class VRTrackingReferences {
  constructor() {
    /* this.leftController = new Transform();
    this.rightController = new Transform();
    this.hmd = new Transform(); */
    /* this.hmd.onchange = () => {
      console.log('change 1', new Error().stack);
    }; */
    this.head = new THREE.Object3D();
    this.leftHand = new THREE.Object3D();
    this.leftHand.fingers = _makeFingers();
    this.leftHand.pointer = 0;
    this.leftHand.grip = 0;
    this.rightHand = new THREE.Object3D();
    this.rightHand.fingers = _makeFingers();
    this.rightHand.pointer = 0;
    this.rightHand.grip = 0;
    this.floorHeight = 0;
    /* this.head.onchange = () => {
      console.log('change 2', new Error().stack);
    }; */
  }
}

export default VRTrackingReferences;
