import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import cameraManager from './camera-manager.js';
import {makeTextMesh, makeRigCapsule} from './vr-ui.js';
import {makePromise, WaitQueue} from './util.js';
import {renderer, scene, appManager} from './app-object.js';
import runtime from './runtime.js';
import Avatar from './avatars/avatars.js';
import {FBXLoader} from './FBXLoader.js';

let testRig = null, objects = [], animations = [], animation = null;
(async () => {
  const animationFileNames = [
    `idle.fbx`,
    `jump.fbx`,
    `left strafe walking.fbx`,
    `left strafe.fbx`,
    // `left turn 90.fbx`,
    // `left turn.fbx`,
    `right strafe walking.fbx`,
    `right strafe.fbx`,
    // `right turn 90.fbx`,
    // `right turn.fbx`,
    // `running.fbx`,
    `walking.fbx`,
    // `ybot.fbx`,
  ];
  const fbxLoader = new FBXLoader();
  for (const name of animationFileNames) {
    const u = './animations/' + name;
    let o = await new Promise((accept, reject) => {
      fbxLoader.load(u, accept, function progress() {}, reject);
    });
    objects.push(o);
    o = o.animations[0];
    o.name = name;
    animations.push(o);
    // console.log('loaded animation', o);
    /*
      mixer = new THREE.AnimationMixer( object );

      const action = mixer.clipAction( object.animations[ 0 ] );
      action.play();
    */
  }
  animation = animations.find(a => a.name === 'idle.fbx');
  animation.interpolants = {};
  animation.tracks.forEach(track => {
    const i = track.createInterpolant();
    i.name = track.name;
    animation.interpolants[track.name] = i;
    return i;
  });
  for (let i = 0; i < animation.interpolants['mixamorigHips.position'].sampleValues.length; i++) {
    animation.interpolants['mixamorigHips.position'].sampleValues[i] *= 0.01;
  }

  const gltfLoader = new GLTFLoader();
  const model = await new Promise((accept, reject) => {
    gltfLoader.load(`https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/female.vrm`, accept, function progress() {}, reject);
  });
  testRig = new Avatar(model, {
    fingers: true,
    hair: true,
    visemes: true,
    debug: true,
    absorb: false,
  });
  // testRig.model.position.z = -1;
  testRig.inputs.hmd.position.y = 1.3;
  testRig.inputs.leftGamepad.position.set(
    0.2,
    testRig.inputs.hmd.position.y - 0.2,
    -0.2
  );
  testRig.inputs.rightGamepad.position.set(
    -0.2,
    testRig.inputs.hmd.position.y - 0.2,
    -0.2
  );
  testRig.model.traverse(o => {
    if (o.isMesh) {
      o.frustumCulled = false;
    }
  });
  scene.add(testRig.model);

  window.objects = objects;
  window.animations = animations;
  window.animation = animation;
  window.testRig = testRig;
})();

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
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

    // this.localRigQueue = new WaitQueue();
    // this.peerRigQueue = new WaitQueue();

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
    this.localRig.update();
    this.peerRigs.forEach(rig => {
      rig.update();
    });

    if (/^(?:camera|firstperson)$/.test(cameraManager.getTool()) || !!renderer.xr.getSession()) {
      rigManager.localRig.decapitate();
    } else {
      rigManager.localRig.undecapitate();
    }

    if (testRig) {
      const mapping = {
        'mixamorigHips.position': testRig.outputs.hips.position,
        'mixamorigHips.quaternion': testRig.outputs.hips.quaternion,
        'mixamorigSpine.quaternion': testRig.outputs.spine.quaternion,
        'mixamorigSpine1.quaternion': null,
        'mixamorigSpine2.quaternion': testRig.outputs.chest.quaternion,
        'mixamorigNeck.quaternion': testRig.outputs.neck.quaternion,
        'mixamorigHead.quaternion': testRig.outputs.head.quaternion,

        'mixamorigLeftShoulder.quaternion': testRig.outputs.rightShoulder.quaternion,
        'mixamorigLeftArm.quaternion': testRig.outputs.rightUpperArm.quaternion,
        'mixamorigLeftForeArm.quaternion': testRig.outputs.rightLowerArm.quaternion,
        'mixamorigLeftHand.quaternion': testRig.outputs.leftHand.quaternion,
        'mixamorigLeftHandMiddle1.quaternion': testRig.outputs.leftMiddleFinger1.quaternion,
        'mixamorigLeftHandMiddle2.quaternion': testRig.outputs.leftMiddleFinger2.quaternion,
        'mixamorigLeftHandMiddle3.quaternion': testRig.outputs.leftMiddleFinger3.quaternion,
        'mixamorigLeftHandThumb1.quaternion': testRig.outputs.leftThumb0.quaternion,
        'mixamorigLeftHandThumb2.quaternion': testRig.outputs.leftThumb1.quaternion,
        'mixamorigLeftHandThumb3.quaternion': testRig.outputs.leftThumb2.quaternion,
        'mixamorigLeftHandIndex1.quaternion': testRig.outputs.leftIndexFinger1.quaternion,
        'mixamorigLeftHandIndex2.quaternion': testRig.outputs.leftIndexFinger2.quaternion,
        'mixamorigLeftHandIndex3.quaternion': testRig.outputs.leftIndexFinger3.quaternion,
        'mixamorigLeftHandRing1.quaternion': testRig.outputs.leftRingFinger1.quaternion,
        'mixamorigLeftHandRing2.quaternion': testRig.outputs.leftRingFinger2.quaternion,
        'mixamorigLeftHandRing3.quaternion': testRig.outputs.leftRingFinger3.quaternion,
        'mixamorigLeftHandPinky1.quaternion': testRig.outputs.leftLittleFinger1.quaternion,
        'mixamorigLeftHandPinky2.quaternion': testRig.outputs.leftLittleFinger2.quaternion,
        'mixamorigLeftHandPinky3.quaternion': testRig.outputs.leftLittleFinger3.quaternion,

        'mixamorigRightShoulder.quaternion': testRig.outputs.leftShoulder.quaternion,
        'mixamorigRightArm.quaternion': testRig.outputs.leftUpperArm.quaternion,
        'mixamorigRightForeArm.quaternion': testRig.outputs.leftLowerArm.quaternion,
        'mixamorigRightHand.quaternion': testRig.outputs.rightHand.quaternion,
        'mixamorigRightHandMiddle1.quaternion': testRig.outputs.rightMiddleFinger1.quaternion,
        'mixamorigRightHandMiddle2.quaternion': testRig.outputs.rightMiddleFinger2.quaternion,
        'mixamorigRightHandMiddle3.quaternion': testRig.outputs.rightMiddleFinger3.quaternion,
        'mixamorigRightHandThumb1.quaternion': testRig.outputs.rightThumb0.quaternion,
        'mixamorigRightHandThumb2.quaternion': testRig.outputs.rightThumb1.quaternion,
        'mixamorigRightHandThumb3.quaternion': testRig.outputs.rightThumb2.quaternion,
        'mixamorigRightHandIndex1.quaternion': testRig.outputs.rightIndexFinger1.quaternion,
        'mixamorigRightHandIndex2.quaternion': testRig.outputs.rightIndexFinger2.quaternion,
        'mixamorigRightHandIndex3.quaternion': testRig.outputs.rightIndexFinger3.quaternion,
        'mixamorigRightHandRing1.quaternion': testRig.outputs.rightRingFinger1.quaternion,
        'mixamorigRightHandRing2.quaternion': testRig.outputs.rightRingFinger2.quaternion,
        'mixamorigRightHandRing3.quaternion': testRig.outputs.rightRingFinger3.quaternion,
        'mixamorigRightHandPinky1.quaternion': testRig.outputs.rightLittleFinger1.quaternion,
        'mixamorigRightHandPinky2.quaternion': testRig.outputs.rightLittleFinger2.quaternion,
        'mixamorigRightHandPinky3.quaternion': testRig.outputs.rightLittleFinger3.quaternion,

        'mixamorigRightUpLeg.quaternion': testRig.outputs.leftUpperLeg.quaternion,
        'mixamorigRightLeg.quaternion': testRig.outputs.leftLowerLeg.quaternion,
        'mixamorigRightFoot.quaternion': testRig.outputs.leftFoot.quaternion,
        'mixamorigRightToeBase.quaternion': null,

        'mixamorigLeftUpLeg.quaternion': testRig.outputs.rightUpperLeg.quaternion,
        'mixamorigLeftLeg.quaternion': testRig.outputs.rightLowerLeg.quaternion,
        'mixamorigLeftFoot.quaternion': testRig.outputs.rightFoot.quaternion,
        'mixamorigLeftToeBase.quaternion': null,
      };

      /*
      */

      // -

      /* Hips: ,
      Spine: ,
      Chest: ,
      Neck: ,
      Head: ,

      Left_shoulder: ,
      Left_arm: ,
      Left_elbow: ,
      Left_wrist: ,
      Left_thumb2: ,
      Left_thumb1: ,
      Left_thumb0: ,
      Left_indexFinger3: ,
      Left_indexFinger2: ,
      Left_indexFinger1: ,
      Left_middleFinger3: ,
      Left_middleFinger2: ,
      Left_middleFinger1: ,
      Left_ringFinger3: ,
      Left_ringFinger2: ,
      Left_ringFinger1: ,
      Left_littleFinger3: ,
      Left_littleFinger2: ,
      Left_littleFinger1: ,
      Left_leg: ,
      Left_knee: ,
      Left_ankle: ,

      Right_shoulder: ,
      Right_arm: ,
      Right_elbow: ,
      Right_wrist: ,
      Right_thumb2: ,
      Right_thumb1: ,
      Right_thumb0: ,
      Right_indexFinger3: ,
      Right_indexFinger2: ,
      Right_indexFinger1: ,
      Right_middleFinger3: ,
      Right_middleFinger2: ,
      Right_middleFinger1: ,
      Right_ringFinger3: ,
      Right_ringFinger2: ,
      Right_ringFinger1: ,
      Right_littleFinger3: ,
      Right_littleFinger2: ,
      Right_littleFinger1: ,
      Right_leg: ,
      Right_knee: ,
      Right_ankle: , */

      const f = (Date.now()/1000) % animation.duration;
      for (const k in mapping) {
        const dst = mapping[k];
        if (dst) {
          const src = animation.interpolants[k];
          const v = src.evaluate(f);
          dst.fromArray(v);
        }
      }

      testRig.update();
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