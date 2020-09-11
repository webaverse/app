import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.module.js';
import {
  makePromise,
} from './constants.js';
import Avatar from './avatars/avatars.js';

class WaitQueue {
  constructor() {
    this.locked = false;
    this.waiterCbs = [];
  }

  async lock() {
    if (!this.locked) {
      this.locked = true;
    } else {
      const p = makePromise();
      this.waiterCbs.push(p.accept);
      await p;
    }
  }

  async unlock() {
    if (this.waiterCbs.length > 0) {
      this.waiterCbs.pop()();
    } else {
      this.locked = false;
    }
  }
}

class RigManager {
  constructor(scene) {
    this.scene = scene;

    this.localRig = new Avatar(null, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: true,
    });
    scene.add(this.localRig.model);
    this.localRigMatrix = new THREE.Matrix4();
    this.localRigMatrixEnabled = false;

    this.localRigQueue = new WaitQueue();
    this.peerRigQueue = new WaitQueue();

    this.peerRigs = new Map();
  }

  setLocalRigMatrix(rm) {
    if (rm) {
      this.localRigMatrix.copy(rm);
      this.localRigMatrixEnabled = true;
    } else {
      this.localRigMatrixEnabled = false;
    }
  }

  async setLocalAvatarUrl(url) {
    try {
      await this.localRigQueue.lock();

      const o = await new Promise((accept, reject) => {
        new GLTFLoader().load(url, accept, xhr => {}, reject);
      });
      o.scene.traverse(o => {
        if (o.isMesh) {
          o.frustumCulled = false;
        }
      });
      this.scene.remove(this.localRig.model);
      this.localRig = new Avatar(o, {
        fingers: true,
        hair: true,
        visemes: true,
        // decapitate: selectedTool === 'firstperson',
      });
      this.scene.add(this.localRig.model);
  
      await this.localRigQueue.unlock();
    } catch (e) {
      console.log(e)
    }
  }

  async addPeerRig(peerId) {
    const peerRig = new Avatar(null, {
      fingers: true,
      hair: true,
      visemes: true,
      // decapitate: selectedTool === 'firstperson',
    });
    this.scene.add(peerRig.model);
    this.peerRigs.set(peerId, peerRig);
  }

  async removePeerRig(peerId) {
    const peerRig = this.peerRigs.get(peerId);
    this.scene.remove(peerRig.model);
    this.peerRigs.delete(peerId);
  }

  async setPeerAvatarUrl(url, peerId) {
    try {
      await this.peerRigQueue.lock();

      const o = await new Promise((accept, reject) => {
        new GLTFLoader().load(url, accept, xhr => {}, reject);
      });
      o.scene.traverse(o => {
        if (o.isMesh) {
          o.frustumCulled = false;
        }
      });
      let peerRig = this.peerRigs.get(peerId);
      this.scene.remove(peerRig.model);
      peerRig = new Avatar(o, {
        fingers: true,
        hair: true,
        visemes: true,
        // decapitate: selectedTool === 'firstperson',
      });
      this.scene.add(peerRig.model);
      this.peerRigs.set(peerId, peerRig);

      await this.peerRigQueue.unlock();
    } catch (e) {
      console.log(e)
    }
  }

  setPeerMicMediaStream(mediaStream, peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.setMicrophoneMediaStream(mediaStream);
    this.peerRigs.set(peerId, peerRig);
  }

  getLocalAvatarPose() {
    const hmdPosition = this.localRig.inputs.hmd.position.toArray();
    const hmdQuaternion = this.localRig.inputs.hmd.quaternion.toArray();

    const leftGamepadPosition = this.localRig.inputs.leftGamepad.position.toArray();
    const leftGamepadQuaternion = this.localRig.inputs.leftGamepad.quaternion.toArray();
    const leftGamepadPointer = this.localRig.inputs.leftGamepad.pointer;
    const leftGamepadGrip = this.localRig.inputs.leftGamepad.grip;

    const rightGamepadPosition = this.localRig.inputs.rightGamepad.position.toArray();
    const rightGamepadQuaternion = this.localRig.inputs.rightGamepad.quaternion.toArray();
    const rightGamepadPointer = this.localRig.inputs.rightGamepad.pointer;
    const rightGamepadGrip = this.localRig.inputs.rightGamepad.grip;

    const floorHeight = this.localRig.getFloorHeight();

    return [
      [hmdPosition, hmdQuaternion],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip],
      floorHeight,
    ];
  }

  getPeerAvatarPose(peerId) {
    const peerRig = this.peerRigs.get(peerId);

    const hmdPosition = peerRig.inputs.hmd.position.toArray();
    const hmdQuaternion = peerRig.inputs.hmd.quaternion.toArray();

    const leftGamepadPosition = peerRig.inputs.leftGamepad.position.toArray();
    const leftGamepadQuaternion = peerRig.inputs.leftGamepad.quaternion.toArray();
    const leftGamepadPointer = peerRig.inputs.leftGamepad.pointer;
    const leftGamepadGrip = peerRig.inputs.leftGamepad.grip;

    const rightGamepadPosition = peerRig.inputs.rightGamepad.position.toArray();
    const rightGamepadQuaternion = peerRig.inputs.rightGamepad.quaternion.toArray();
    const rightGamepadPointer = peerRig.inputs.rightGamepad.pointer;
    const rightGamepadGrip = peerRig.inputs.rightGamepad.grip;

    const floorHeight = peerRig.getFloorHeight();

    return [
      [hmdPosition, hmdQuaternion],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip],
      floorHeight,
    ];
  }

  setLocalAvatarPose(poseArray) {
    const [
      [hmdPosition, hmdQuaternion],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip],
    ] = poseArray;

    this.localRig.inputs.hmd.position.fromArray(hmdPosition);
    this.localRig.inputs.hmd.quaternion.fromArray(hmdQuaternion);

    this.localRig.inputs.leftGamepad.position.fromArray(leftGamepadPosition);
    this.localRig.inputs.leftGamepad.quaternion.fromArray(leftGamepadQuaternion);
    this.localRig.inputs.leftGamepad.pointer = leftGamepadPointer;
    this.localRig.inputs.leftGamepad.grip = leftGamepadGrip;

    this.localRig.inputs.rightGamepad.position.fromArray(rightGamepadPosition);
    this.localRig.inputs.rightGamepad.quaternion.fromArray(rightGamepadQuaternion);
    this.localRig.inputs.rightGamepad.pointer = rightGamepadPointer;
    this.localRig.inputs.rightGamepad.grip = rightGamepadGrip;
  }

  setPeerAvatarPose(poseArray, peerId) {
    const [
      [hmdPosition, hmdQuaternion],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip],
      floorHeight
    ] = poseArray;

    const peerRig = this.peerRigs.get(peerId);

    peerRig.inputs.hmd.position.fromArray(hmdPosition);
    peerRig.inputs.hmd.quaternion.fromArray(hmdQuaternion);

    peerRig.inputs.leftGamepad.position.fromArray(leftGamepadPosition);
    peerRig.inputs.leftGamepad.quaternion.fromArray(leftGamepadQuaternion);
    peerRig.inputs.leftGamepad.pointer = leftGamepadPointer;
    peerRig.inputs.leftGamepad.grip = leftGamepadGrip;

    peerRig.inputs.rightGamepad.position.fromArray(rightGamepadPosition);
    peerRig.inputs.rightGamepad.quaternion.fromArray(rightGamepadQuaternion);
    peerRig.inputs.rightGamepad.pointer = rightGamepadPointer;
    peerRig.inputs.rightGamepad.grip = rightGamepadGrip;

    peerRig.setFloorHeight(floorHeight);
  }

  update() {
    this.localRig.update();
    this.peerRigs.forEach(rig => {
        rig.update();
    })
  }
}
export {RigManager};
