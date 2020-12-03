import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import cameraManager from './camera-manager.js';
import {makeTextMesh, makeRigCapsule} from './vr-ui.js';
import {makePromise, /*WaitQueue, */downloadFile} from './util.js';
import {renderer, scene, dolly, appManager} from './app-object.js';
import runtime from './runtime.js';
import Avatar from './avatars/avatars.js';
import physicsMananager from './physics-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localRaycaster = new THREE.Raycaster();

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

    this.localRig.avatarUrl = null;

    this.localRig.textMesh = makeTextMesh('Anonymous', undefined, 0.2, 'center', 'middle');
    this.scene.add(this.localRig.textMesh);

    this.localRigMatrix = new THREE.Matrix4();
    this.localRigMatrixEnabled = false;
    
    this.lastPosition = new THREE.Vector3();
    this.smoothVelocity = new THREE.Vector3();

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

  setLocalAvatarName(name) {
    this.localRig.textMesh.text = name;
    this.localRig.textMesh.sync();
  }

  async setLocalAvatarUrl(url, filename) {
    // await this.localRigQueue.lock();

    await this.setAvatar(this.localRig, newLocalRig => {
      this.localRig = newLocalRig;
    }, url, filename);

    // await this.localRigQueue.unlock();
  }

  async setAvatar(oldRig, setRig, url, filename) {
    if (oldRig.url !== url) {
      oldRig.url = url;

      let o;
      if (url) {
        const res = await fetch(url);
        const blob = await res.blob();
        blob.name = filename;
        o = await runtime.loadFile(blob);
      }

      if (oldRig.url === url) {
        this.scene.remove(oldRig.model);

        let localRig;
        if (o) {
          if (o.raw) {
            localRig = new Avatar(o.raw, {
              fingers: true,
              hair: true,
              visemes: true,
              debug: true //!o,
            });
          } else {
            localRig = new Avatar();
            localRig.model = o;
            localRig.inputs.hmd = localRig.model;
            localRig.update = () => {
              // nothing
            };
          }
        } else {
          localRig = new Avatar(null, {
            fingers: true,
            hair: true,
            visemes: true,
            debug: true,
          });
        }
        this.scene.add(localRig.model);
        localRig.textMesh = oldRig.textMesh;
        localRig.avatarUrl = oldRig.url;
        localRig.rigCapsule = oldRig.rigCapsule;

        setRig(localRig);
      }
    }
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

    peerRig.avatarUrl = null;

    peerRig.rigCapsule = makeRigCapsule();
    peerRig.rigCapsule.visible = false;
    this.scene.add(peerRig.rigCapsule);

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

  async setPeerAvatarUrl(url, filename, peerId) {
    // await this.peerRigQueue.lock();

    const oldPeerRig = this.peerRigs.get(peerId);
    await this.setAvatar(oldPeerRig, newPeerRig => {
      this.peerRigs.set(peerId, newPeerRig);
    }, url, filename);

    // await this.peerRigQueue.unlock();
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

    if (peerRig) {
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

      peerRig.rigCapsule.position.copy(peerRig.inputs.hmd.position);
    }
  }
  
  intersectPeerRigs(raycaster) {
    let closestPeerRig = null;
    let closestPeerRigDistance = Infinity;
    for (const peerRig of this.peerRigs.values()) {
      /* console.log('got peer rig', peerRig);
      if (!peerRig.rigCapsule) {
        debugger;
      } */
      localMatrix2.compose(peerRig.inputs.hmd.position, peerRig.inputs.hmd.quaternion, localVector2.set(1, 1, 1));
      localMatrix.compose(raycaster.ray.origin, localQuaternion.setFromUnitVectors(localVector2.set(0, 0, -1), raycaster.ray.direction), localVector3.set(1, 1, 1))
        .premultiply(
          localMatrix3.getInverse(
            localMatrix2
          )
        )
        .decompose(localRaycaster.ray.origin, localQuaternion, localVector2);
      localRaycaster.ray.direction.set(0, 0, -1).applyQuaternion(localQuaternion);
      const intersection = localRaycaster.ray.intersectBox(peerRig.rigCapsule.geometry.boundingBox, localVector);
      if (intersection) {
        const object = peerRig;
        const point = intersection.applyMatrix4(localMatrix2);
        return {
          object,
          point,
          uv: null,
        };
      } else {
        return null;
      }
    }
  }

  unhighlightPeerRigs() {
    for (const peerRig of this.peerRigs.values()) {
      peerRig.rigCapsule.visible = false;
    }
  }

  highlightPeerRig(peerRig) {
    peerRig.rigCapsule.visible = true;
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
    const session = renderer.xr.getSession();
    let currentPosition, currentQuaternion;
    if (!session) {
      currentPosition = this.localRig.inputs.hmd.position;
      currentQuaternion = this.localRig.inputs.hmd.quaternion;
    } else {
      currentPosition = localVector.copy(dolly.position).multiplyScalar(4);
      currentQuaternion = dolly.quaternion;
    }
    const positionDiff = localVector2.copy(this.lastPosition)
      .sub(currentPosition)
      .multiplyScalar(10);
    localEuler.setFromQuaternion(currentQuaternion, 'YXZ');
    localEuler.x = 0;
    localEuler.z = 0;
    localEuler.y += Math.PI;
    localEuler2.set(-localEuler.x, -localEuler.y, -localEuler.z, localEuler.order);
    positionDiff.applyEuler(localEuler2);
    this.smoothVelocity.lerp(positionDiff, 0.5);
    this.lastPosition.copy(currentPosition);

    this.localRig.setTopEnabled(!!session || /^(?:firstperson|thirdperson)$/.test(cameraManager.getTool()));
    this.localRig.setBottomEnabled(this.localRig.getTopEnabled() && this.smoothVelocity.length() < 0.001);
    this.localRig.direction.copy(positionDiff);
    this.localRig.velocity.copy(this.smoothVelocity);
    this.localRig.update();
    this.peerRigs.forEach(rig => {
      rig.update();
    });

    if (/^(?:camera|firstperson)$/.test(cameraManager.getTool()) || !!renderer.xr.getSession()) {
      rigManager.localRig.decapitate();
    } else {
      rigManager.localRig.undecapitate();
    }
    
    /* for (let i = 0; i < appManager.grabs.length; i++) {
      const grab = appManager.grabs[i === 0 ? 1 : 0];
      if (grab) {
        const transforms = this.getRigTransforms();
        const transform = transforms[i];
        grab.position.copy(transform.position);
        grab.quaternion.copy(transform.quaternion);
      }
    } */
  }
}
const rigManager = new RigManager(scene);

export {
  // RigManager,
  rigManager,
};