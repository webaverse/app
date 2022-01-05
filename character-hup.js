/* this is the character heads up player implementation.
it controls the animated dioramas that happen when players perform actions. */

import * as THREE from 'three';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

// const localOffset = new THREE.Vector3();
const localOffset2 = new THREE.Vector3();

// const localArray = [];
const localVelocity = new THREE.Vector3();

// const zeroVector = new THREE.Vector3();
// const upVector = new THREE.Vector3(0, 1, 0);

class CharacterHup {
  constructor(player) {
    this.player = player;

    // this.velocity = new THREE.Vector3();
    // this.lastGroundedTime = 0;
    // this.sitOffset = new THREE.Vector3();
  }
  applyWasd(keysDirection, timeDiff) {
    /* if (this.player.avatar && physicsManager.physicsEnabled) {
      this.velocity.add(keysDirection);
    } */
  }
}

export {
  CharacterHup,
};
