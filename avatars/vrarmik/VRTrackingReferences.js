import * as THREE from 'three';

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
    this.leftHand.pointer = 0;
    this.leftHand.grip = 0;
    this.leftHand.fingers = _makeFingers();
    this.leftHand.leftThumb0 = this.leftHand.fingers[1];
    this.leftHand.leftThumb1 = this.leftHand.fingers[2];
    this.leftHand.leftThumb2 = this.leftHand.fingers[3];
    this.leftHand.leftIndexFinger1 = this.leftHand.fingers[6];
    this.leftHand.leftIndexFinger2 = this.leftHand.fingers[7];
    this.leftHand.leftIndexFinger3 = this.leftHand.fingers[8];
    this.leftHand.leftMiddleFinger1 = this.leftHand.fingers[11];
    this.leftHand.leftMiddleFinger2 = this.leftHand.fingers[12];
    this.leftHand.leftMiddleFinger3 = this.leftHand.fingers[13];
    this.leftHand.leftRingFinger1 = this.leftHand.fingers[16];
    this.leftHand.leftRingFinger2 = this.leftHand.fingers[17];
    this.leftHand.leftRingFinger3 = this.leftHand.fingers[18];
    this.leftHand.leftLittleFinger1 = this.leftHand.fingers[21];
    this.leftHand.leftLittleFinger2 = this.leftHand.fingers[22];
    this.leftHand.leftLittleFinger3 = this.leftHand.fingers[23];

    this.rightHand = new THREE.Object3D();
    this.rightHand.pointer = 0;
    this.rightHand.grip = 0;
    this.rightHand.fingers = _makeFingers();
    this.rightHand.rightThumb0 = this.rightHand.fingers[1];
    this.rightHand.rightThumb1 = this.rightHand.fingers[2];
    this.rightHand.rightThumb2 = this.rightHand.fingers[3];
    this.rightHand.rightIndexFinger1 = this.rightHand.fingers[6];
    this.rightHand.rightIndexFinger2 = this.rightHand.fingers[7];
    this.rightHand.rightIndexFinger3 = this.rightHand.fingers[8];
    this.rightHand.rightMiddleFinger1 = this.rightHand.fingers[11];
    this.rightHand.rightMiddleFinger2 = this.rightHand.fingers[12];
    this.rightHand.rightMiddleFinger3 = this.rightHand.fingers[13];
    this.rightHand.rightRingFinger1 = this.rightHand.fingers[16];
    this.rightHand.rightRingFinger2 = this.rightHand.fingers[17];
    this.rightHand.rightRingFinger3 = this.rightHand.fingers[18];
    this.rightHand.rightLittleFinger1 = this.rightHand.fingers[21];
    this.rightHand.rightLittleFinger2 = this.rightHand.fingers[22];
    this.rightHand.rightLittleFinger3 = this.rightHand.fingers[23];

    this.floorHeight = 0;
    /* this.head.onchange = () => {
      console.log('change 2', new Error().stack);
    }; */
  }
}

export default VRTrackingReferences;
