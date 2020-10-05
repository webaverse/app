import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {makeTextMesh} from './vr-ui.js';
import {makePromise, WaitQueue} from './util.js';
import {scene} from './app-object.js';
import Avatar from './avatars/avatars.js';

const localEuler = new THREE.Euler();

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
    this.localRig.textMesh = makeTextMesh('Anonymous', undefined, 0.2, 'center', 'middle');
    this.scene.add(this.localRig.textMesh);

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

  async addLocalRig(model) {
    await this.localRigQueue.lock();

    const oldLocalRig = this.localRig;
    this.scene.remove(this.localRig.model);

    this.localRig = new Avatar(model, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: model ? false : true,
    });
    this.scene.add(this.localRig.model);
    this.localRig.textMesh = oldLocalRig.textMesh;

    await this.localRigQueue.unlock();
  }

  setLocalAvatarName(name) {
    this.localRig.textMesh.text = name;
    this.localRig.textMesh.sync();
  }

  async setLocalAvatarUrl(url) {
    let o = null;
    try {
      o = await new Promise((accept, reject) => {
        new GLTFLoader().load(url, accept, xhr => {}, reject);
      });
    } catch (e) {
      console.log(e);
    }
    if (o) {
      o.scene.traverse(o => {
        if (o.isMesh) {
          o.frustumCulled = false;
        }
      });
    }
    this.addLocalRig(o);
  }
  
  isPeerRig(rig) {
    for (const peerRig of this.peerRigs.values()) {
      if (peerRig === rig) {
        return true;
      }
    }
    return false;
  }

  async addPeerRig(peerId) {
    const peerRig = new Avatar(null, {
      fingers: true,
      hair: true,
      visemes: true,
      debug: true
      // decapitate: selectedTool === 'firstperson',
    });
    this.scene.add(peerRig.model);

    peerRig.textMesh = makeTextMesh('Anonymous', undefined, 0.2, 'center', 'middle');
    this.scene.add(peerRig.textMesh);

    this.peerRigs.set(peerId, peerRig);
  }

  async removePeerRig(peerId) {
    const peerRig = this.peerRigs.get(peerId);
    this.scene.remove(peerRig.model);
    this.scene.remove(peerRig.textMesh);
    this.peerRigs.delete(peerId);
  }

  setPeerAvatarName(name, peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.textMesh.text = name;
    peerRig.textMesh.sync();
  }

  async setPeerAvatarUrl(url, peerId) {
    await this.peerRigQueue.lock();
    let o = null;
    try {
      o = await new Promise((accept, reject) => {
        new GLTFLoader().load(url, accept, xhr => {}, reject);
      });
    } catch (e) {
      console.log(e)
    }
    o.scene.traverse(o => {
      if (o.isMesh) {
        o.frustumCulled = false;
      }
    });
    const oldPeerRig = this.peerRigs.get(peerId);
    this.scene.remove(oldPeerRig.model);
    const peerRig = new Avatar(o, {
      fingers: true,
      hair: true,
      visemes: true,
      // decapitate: selectedTool === 'firstperson',
    });
    this.scene.add(peerRig.model);
    this.peerRigs.set(peerId, peerRig);

    peerRig.textMesh = oldPeerRig.textMesh;

    await this.peerRigQueue.unlock();
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

    this.localRig.textMesh.position.copy(this.localRig.inputs.hmd.position);
    this.localRig.textMesh.position.y += 0.5;
    this.localRig.textMesh.quaternion.copy(this.localRig.inputs.hmd.quaternion);
    localEuler.setFromQuaternion(this.localRig.textMesh.quaternion, 'YXZ');
    localEuler.x = 0;
    localEuler.y += Math.PI;
    localEuler.z = 0;
    this.localRig.textMesh.quaternion.setFromEuler(localEuler);
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

    peerRig.textMesh.position.copy(peerRig.inputs.hmd.position);
    peerRig.textMesh.position.y += 0.5;
    peerRig.textMesh.quaternion.copy(peerRig.inputs.hmd.quaternion);
    localEuler.setFromQuaternion(peerRig.textMesh.quaternion, 'YXZ');
    localEuler.x = 0;
    localEuler.y += Math.PI;
    localEuler.z = 0;
    peerRig.textMesh.quaternion.setFromEuler(localEuler);
  }
  
  getRigTransforms() {
    return [
      {
        position: this.localRig.inputs.leftGamepad.position,
        quaternion: this.localRig.inputs.leftGamepad.quaternion,
      },
      {
        position: this.localRig.inputs.rightGamepad.position,
        quaternion: this.localRig.inputs.rightGamepad.quaternion,
      },
    ];
  }

  update() {
    this.localRig.update();
    this.peerRigs.forEach(rig => {
      rig.update();
    })
  }
}
const rigManager = new RigManager(scene);

export {
  // RigManager,
  rigManager,
};