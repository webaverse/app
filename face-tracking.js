import * as THREE from "three";
import metaversefile from "metaversefile";
import * as Kalidokit from 'kalidokit/src/index.js';
// import {Holistic} from '@mediapipe/holistic/holistic';
// import {Camera} from '@mediapipe/camera_utils/camera_utils';
// import '@tensorflow/tfjs-backend-webgl';
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// import * as poseDetection from '@tensorflow-models/pose-detection';
// import Avatar from './avatars/avatars.js';
import {world} from './world.js';
// import {fitCameraToBox} from './util.js';
import {/*makeAvatar, */switchAvatar} from './player-avatar-binding.js';
import Stats from 'stats.js';

const dimensions = {
  width: 256,
  height: 256,
};
const displayWidth = dimensions.width;
const points = {
  eye: {
    left: [130, 133, 160, 159, 158, 144, 145, 153],
    right: [263, 362, 387, 386, 385, 373, 374, 380],
  },
  brow: {
    right: [35, 244, 63, 105, 66, 229, 230, 231],
    left: [265, 464, 293, 334, 296, 449, 450, 451],
  },
  pupil: {
    right: [473, 474, 475, 476, 477],
    left: [468, 469, 470, 471, 472],
  },
};
// const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const slightLeftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.1);
const rollRightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI*0.5);

// window.clamp = (v, min, max) => Math.min(Math.max(v, min), max);

let canvas = null;
let overlayCanvas = null;
let overlayCtx = null;
let avatar = null;
let previewScene = null;
let previewCamera = null;
// let holistic = null;
let faceTrackingWorker = null;
let videoEl = null;

/* async function switchAvatar(oldAvatar, newApp) {
  let result;
  const promises = [];
  if (oldAvatar) {
    promises.push((async () => {
      await oldAvatar[appSymbol].setSkinning(false);
    })());
  }
  if (newApp) {
    promises.push((async () => {
      await newApp.setSkinning(true);

      // unwear old rig

      if (!newApp[avatarSymbol]) {
        newApp[avatarSymbol] = makeAvatar(newApp);
      }
      result = newApp[avatarSymbol];
    })());
  } else {
    result = null;
  }
  await Promise.all(promises);
  return result;
} */
/* const _lookAt = (camera, boundingBox) => {
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  camera.position.x = center.x;
  camera.position.y = center.y;
  camera.position.z = size.z / 2;
  fitCameraToBox(camera, boundingBox);
}; */

const _makeFakeAvatar = () => {
  const Root = new THREE.Object3D();
  const Hips = new THREE.Object3D();
  const Spine = new THREE.Object3D();
  const Chest = new THREE.Object3D();
  const UpperChest = new THREE.Object3D();

  const Neck = new THREE.Object3D();
  const Head = new THREE.Object3D();
  const Eye_L = new THREE.Object3D();
  const Eye_R = new THREE.Object3D();

  const Left_shoulder = new THREE.Object3D();
  const Left_elbow = new THREE.Object3D();
  const Left_arm = new THREE.Object3D();
  const Left_wrist = new THREE.Object3D();
  const Left_thumb0 = new THREE.Object3D();
  const Left_thumb1 = new THREE.Object3D();
  const Left_thumb2 = new THREE.Object3D();
  const Left_indexFinger1 = new THREE.Object3D();
  const Left_indexFinger2 = new THREE.Object3D();
  const Left_indexFinger3 = new THREE.Object3D();
  const Left_middleFinger1 = new THREE.Object3D();
  const Left_middleFinger2 = new THREE.Object3D();
  const Left_middleFinger3 = new THREE.Object3D();
  const Left_ringFinger1 = new THREE.Object3D();
  const Left_ringFinger2 = new THREE.Object3D();
  const Left_ringFinger3 = new THREE.Object3D();
  const Left_littleFinger1 = new THREE.Object3D();
  const Left_littleFinger2 = new THREE.Object3D();
  const Left_littleFinger3 = new THREE.Object3D();

  const Left_leg = new THREE.Object3D();
  const Left_knee = new THREE.Object3D();
  const Left_ankle = new THREE.Object3D();
  const Left_toe = new THREE.Object3D();

  const Right_shoulder = new THREE.Object3D();
  const Right_elbow = new THREE.Object3D();
  const Right_arm = new THREE.Object3D();
  const Right_wrist = new THREE.Object3D();
  const Right_thumb0 = new THREE.Object3D();
  const Right_thumb1 = new THREE.Object3D();
  const Right_thumb2 = new THREE.Object3D();
  const Right_indexFinger1 = new THREE.Object3D();
  const Right_indexFinger2 = new THREE.Object3D();
  const Right_indexFinger3 = new THREE.Object3D();
  const Right_middleFinger1 = new THREE.Object3D();
  const Right_middleFinger2 = new THREE.Object3D();
  const Right_middleFinger3 = new THREE.Object3D();
  const Right_ringFinger1 = new THREE.Object3D();
  const Right_ringFinger2 = new THREE.Object3D();
  const Right_ringFinger3 = new THREE.Object3D();
  const Right_littleFinger1 = new THREE.Object3D();
  const Right_littleFinger2 = new THREE.Object3D();
  const Right_littleFinger3 = new THREE.Object3D();

  const Right_leg = new THREE.Object3D();
  const Right_knee = new THREE.Object3D();
  const Right_ankle = new THREE.Object3D();
  const Right_toe = new THREE.Object3D();

  Root.add(Hips);
  Hips.add(Spine);
  Spine.add(Chest);
  Chest.add(UpperChest);

  UpperChest.add(Neck);
  Neck.add(Head);
  Head.add(Eye_L);
  Head.add(Eye_R);

  UpperChest.add(Left_shoulder);
  Left_shoulder.add(Left_arm);
  Left_arm.add(Left_elbow);
  Left_elbow.add(Left_wrist);

  Left_wrist.add(Left_thumb0);
  Left_thumb0.add(Left_thumb1);
  Left_thumb1.add(Left_thumb2);
  
  Left_wrist.add(Left_indexFinger1);
  Left_indexFinger1.add(Left_indexFinger2);
  Left_indexFinger2.add(Left_indexFinger3);

  Left_wrist.add(Left_middleFinger1);
  Left_middleFinger1.add(Left_middleFinger2);
  Left_middleFinger2.add(Left_middleFinger3);

  Left_wrist.add(Left_ringFinger1);
  Left_ringFinger1.add(Left_ringFinger2);
  Left_ringFinger2.add(Left_ringFinger3);

  Left_wrist.add(Left_littleFinger1);
  Left_littleFinger1.add(Left_littleFinger2);
  Left_littleFinger2.add(Left_littleFinger3);

  Hips.add(Left_leg);
  Left_leg.add(Left_knee);
  Left_knee.add(Left_ankle);
  Left_ankle.add(Left_toe);

  UpperChest.add(Right_shoulder);
  Right_shoulder.add(Right_arm);
  Right_arm.add(Right_elbow);
  Right_elbow.add(Right_wrist);

  Right_wrist.add(Right_thumb0);
  Right_thumb0.add(Right_thumb1);
  Right_thumb1.add(Right_thumb2);
  
  Right_wrist.add(Right_indexFinger1);
  Right_indexFinger1.add(Right_indexFinger2);
  Right_indexFinger2.add(Right_indexFinger3);

  Right_wrist.add(Right_middleFinger1);
  Right_middleFinger1.add(Right_middleFinger2);
  Right_middleFinger2.add(Right_middleFinger3);

  Right_wrist.add(Right_ringFinger1);
  Right_ringFinger1.add(Right_ringFinger2);
  Right_ringFinger2.add(Right_ringFinger3);

  Right_wrist.add(Right_littleFinger1);
  Right_littleFinger1.add(Right_littleFinger2);
  Right_littleFinger2.add(Right_littleFinger3);

  Hips.add(Right_leg);
  Right_leg.add(Right_knee);
  Right_knee.add(Right_ankle);
  Right_ankle.add(Right_toe);

  return {
    Root,

    Hips,
    Spine,
    Chest,
    UpperChest,
    Neck,
    Head,
    Eye_L,
    Eye_R,

    Left_shoulder,
    Left_arm,
    Left_elbow,
    Left_wrist,
    Left_thumb2,
    Left_thumb1,
    Left_thumb0,
    Left_indexFinger3,
    Left_indexFinger2,
    Left_indexFinger1,
    Left_middleFinger3,
    Left_middleFinger2,
    Left_middleFinger1,
    Left_ringFinger3,
    Left_ringFinger2,
    Left_ringFinger1,
    Left_littleFinger3,
    Left_littleFinger2,
    Left_littleFinger1,
    Left_leg,
    Left_knee,
    Left_ankle,

    Right_shoulder,
    Right_arm,
    Right_elbow,
    Right_wrist,
    Right_thumb2,
    Right_thumb1,
    Right_thumb0,
    Right_indexFinger3,
    Right_indexFinger2,
    Right_indexFinger1,
    Right_middleFinger3,
    Right_middleFinger2,
    Right_middleFinger1,
    Right_ringFinger3,
    Right_ringFinger2,
    Right_ringFinger1,
    Right_littleFinger3,
    Right_littleFinger2,
    Right_littleFinger1,
    Right_leg,
    Right_knee,
    Right_ankle,
    Left_toe,
    Right_toe,
  };
};
const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localVector8 = new THREE.Vector3();
const localVector9 = new THREE.Vector3();
const localTriangle = new THREE.Triangle();
const localMatrix = new THREE.Matrix4();
const zeroVector = new THREE.Vector3();
/* const _retargetAnimation = (srcAnimation, srcBaseModel, dstBaseModel) => {
  const srcModelBones = getModelBones(srcBaseModel);
  const dstModelBones = getModelBones(dstBaseModel);
  
  // console.log('retarget', srcAnimation, srcModelBones, dstModelBones); // XXX
  
  const dstAnimation = srcAnimation.clone();
  
  const numFrames = srcAnimation.interpolants['mixamorigHead.quaternion'].sampleValues.length / 4;
  for (let frame = 0; frame < numFrames; frame++) {
    const srcModelBones2 = cloneModelBones(srcModelBones);
    const dstModelBones2 = cloneModelBones(dstModelBones);
    srcModelBones2.Root.updateMatrixWorld();
    dstModelBones2.Root.updateMatrixWorld();
    
    _setSkeletonToAnimationFrame(srcModelBones2, srcAnimation, frame);
    _setSkeletonWorld(dstModelBones2, srcModelBones2);
    _setAnimationFrameToSkeleton(dstAnimation, frame, dstModelBones2);
  }
  
  decorateAnimation(dstAnimation);
  
  return dstAnimation;
}; */
const _setSkeletonWorld = (() => {
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localVector3 = new THREE.Vector3();
  const localVector4 = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  const localQuaternion2 = new THREE.Quaternion();
  const localMatrix2 = new THREE.Matrix4();
  return (dstModelBones, srcModelBones, srcModelBonesWhitelist) => {
    const srcBoneToModelNameMap = new Map();
    for (const k in srcModelBones) {
      srcBoneToModelNameMap.set(srcModelBones[k], k);
    }
    
    const _recurse = (srcModelBone, dstModelBone) => {
      if (srcModelBonesWhitelist.indexOf(srcModelBone) !== -1) {
        // srcModelBone.matrixWorld.decompose(localVector, localQuaternion, localVector2);
        localQuaternion.copy(srcModelBone.quaternion);
        // console.log('got hips', localQuaternion.toArray().join(','));
        dstModelBone.matrixWorld.decompose(localVector3, localQuaternion2, localVector4);
        
        // localQuaternion.premultiply(downRotation);
        
        dstModelBone.matrixWorld.compose(
          srcModelBone === srcModelBones.Hips ? srcModelBone.position : localVector3,
          localQuaternion,
          localVector4
        );
        dstModelBone.matrix.copy(dstModelBone.matrixWorld)
          .premultiply(localMatrix2.copy(dstModelBone.parent.matrixWorld).invert())
          .decompose(dstModelBone.position, dstModelBone.quaternion, dstModelBone.scale);
        // dstModelBone.quaternion.premultiply(dstModelBone.initialQuaternion);
        dstModelBone.updateMatrixWorld();
      }
      
      for (let i = 0; i < srcModelBone.children.length; i++) {
        const srcChild = srcModelBone.children[i];
        const modelBoneName = srcBoneToModelNameMap.get(srcChild);
        if (modelBoneName) {
          const dstChild = dstModelBones[modelBoneName];
          if (dstChild) {
            _recurse(srcChild, dstChild);
          }
        }
      }
    };
    _recurse(srcModelBones.Root, dstModelBones.Root);
  };
})();
const _solvePoseToAvatar = (() => {
  const tempAvatar = _makeFakeAvatar();
  const boneBuffers = {
    leftHip: new THREE.Vector3(),
    rightHip: new THREE.Vector3(),
    leftShoulder: new THREE.Vector3(),
    rightShoulder: new THREE.Vector3(),
    leftElbow: new THREE.Vector3(),
    rightElbow: new THREE.Vector3(),
    leftHand: new THREE.Vector3(),
    rightHand: new THREE.Vector3(),
    leftPinky: new THREE.Vector3(),
    rightPinky: new THREE.Vector3(),
    leftIndex: new THREE.Vector3(),
    rightIndex: new THREE.Vector3(),
    leftThumb: new THREE.Vector3(),
    rightThumb: new THREE.Vector3(),
  };

  return (lm3d, leftHandLm, rightHandLm, avatar) => {
    boneBuffers.leftHip.copy(lm3d[23]);
    boneBuffers.rightHip.copy(lm3d[24]);
    boneBuffers.leftShoulder.copy(lm3d[11]);
    boneBuffers.rightShoulder.copy(lm3d[12]);
    boneBuffers.leftElbow.copy(lm3d[13]);
    boneBuffers.rightElbow.copy(lm3d[14]);
    boneBuffers.leftHand.copy(lm3d[15]);
    boneBuffers.rightHand.copy(lm3d[16]);
    boneBuffers.leftPinky.copy(lm3d[17]);
    boneBuffers.rightPinky.copy(lm3d[18]);
    boneBuffers.leftIndex.copy(lm3d[19]);
    boneBuffers.rightIndex.copy(lm3d[20]);
    boneBuffers.leftThumb.copy(lm3d[21]);
    boneBuffers.rightThumb.copy(lm3d[22]);

    for (const k in boneBuffers) {
      // boneBuffers[k].x *= -1;
      boneBuffers[k].y *= -1;
      boneBuffers[k].z *= -1;
    }

    /* window.lm3d = lm3d;
    window.leftHip = leftHip;
    window.rightHip = rightHip;
    window.leftShoulder = leftShoulder;
    window.rightShoulder = rightShoulder; */

    const bodyCenter = localVector.copy(boneBuffers.leftHip)
      .add(boneBuffers.rightHip)
      .add(boneBuffers.leftShoulder)
      .add(boneBuffers.rightShoulder)
      .divideScalar(4);
    
    const leftMiddle = localVector2.copy(boneBuffers.leftPinky)
      .add(boneBuffers.leftIndex)
      .divideScalar(2);
    
    const rightMiddle = localVector3.copy(boneBuffers.rightPinky)
      .add(boneBuffers.rightIndex)
      .divideScalar(2);

    let leftWristNormal;
    if (leftHandLm) {
      localTriangle.a.copy(leftHandLm[0]);
      localTriangle.b.copy(leftHandLm[5]);
      localTriangle.c.copy(leftHandLm[17]);
      [
        localTriangle.a,
        localTriangle.b,
        localTriangle.c,
      ].forEach(v => {
        v.x *= -1;
      });
      leftWristNormal = localTriangle.getNormal(localVector4);
    } else {
      localTriangle.a.copy(boneBuffers.leftIndex);
      localTriangle.b.copy(boneBuffers.leftPinky);
      localTriangle.c.copy(boneBuffers.leftThumb);
      leftWristNormal = localTriangle.getNormal(localVector4);
    }
    /* window.lol = [
      boneBuffers.leftIndex.toArray().join(', '),
      boneBuffers.leftPinky.toArray().join(', '),
      boneBuffers.leftThumb.toArray().join(', '),
      leftWristNormal.toArray().join(', '),
    ]; */
    
    let rightWristNormal;
    if (rightHandLm) {
      localTriangle.a.copy(rightHandLm[0]);
      localTriangle.b.copy(rightHandLm[17]);
      localTriangle.c.copy(rightHandLm[5]);
      [
        localTriangle.a,
        localTriangle.b,
        localTriangle.c,
      ].forEach(v => {
        v.x *= -1;
      });
      rightWristNormal = localTriangle.getNormal(localVector5);
    } else {
      localTriangle.a.copy(boneBuffers.rightPinky);
      localTriangle.b.copy(boneBuffers.rightIndex);
      localTriangle.c.copy(boneBuffers.rightHand);
      rightWristNormal = localTriangle.getNormal(localVector5);
    }

    /* avatar.Root.updateMatrixWorld();
    const q = avatar.Left_arm.getWorldQuaternion(new THREE.Quaternion());
    console.log('got q', q);
    debugger; */

    /* const topHip = localVector6.copy(boneBuffers.leftHip)
      .add(boneBuffers.rightHip)
      .divideScalar(2)
      .add(localVector7.set(0, Math.max(boneBuffers.leftHip.y, boneBuffers.rightHip.y) + 0.1, 0)); */
    
    /* const topShoulder = localVector7.copy(boneBuffers.leftShoulder)
      .add(boneBuffers.rightShoulder)
      .divideScalar(2)
      .add(localVector8.set(0, 0.1, 0)); */

    {
      localTriangle.a.copy(bodyCenter);
      localTriangle.b.copy(boneBuffers.leftHip);
      localTriangle.c.copy(boneBuffers.rightHip);
      const hipsDirection = localTriangle.getNormal(localVector8);
      // hipsDirection.x *= -1;
      tempAvatar.Hips.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          zeroVector,
          hipsDirection,
          localVector9.set(0, 1, 0)
        )
      )
      .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    }
    {
      tempAvatar.Left_arm.quaternion.setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        boneBuffers.leftElbow.clone().sub(boneBuffers.leftShoulder).normalize(),
        localVector9.set(0, 1, 0)
      )
      // .multiply(avatar.Left_shoulder.initialQuaternion)
      // .premultiply(rollRightRotation)
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
      // window.lol = [boneBuffers.leftShoulder, boneBuffers.leftElbow];
    }
    {
      tempAvatar.Right_arm.quaternion.setFromUnitVectors(
        new THREE.Vector3(-1, 0, 0),
        boneBuffers.rightElbow.clone().sub(boneBuffers.rightShoulder).normalize(),
        localVector9.set(0, 1, 0)
      )
      // .multiply(avatar.Left_shoulder.initialQuaternion)
      // .premultiply(rollRightRotation)
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
      // window.lol = [boneBuffers.leftShoulder, boneBuffers.leftElbow];
    }
    // window.initialQuaternion = avatar.Left_shoulder.initialQuaternion;
    {
      tempAvatar.Left_elbow.quaternion.setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        boneBuffers.leftHand.clone().sub(boneBuffers.leftElbow).normalize(),
        localVector9.set(0, 1, 0)
      )
      // .multiply(avatar.Left_elbow.initialQuaternion)
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    }
    {
      tempAvatar.Right_elbow.quaternion.setFromUnitVectors(
        new THREE.Vector3(-1, 0, 0),
        boneBuffers.rightHand.clone().sub(boneBuffers.rightElbow).normalize(),
        localVector9.set(0, 1, 0)
      )
      // .multiply(avatar.Left_wrist.initialQuaternion)
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    }
    {
      tempAvatar.Left_wrist.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.leftHand,
          leftMiddle,
          leftWristNormal
        )
      )
      // .premultiply(slightLeftRotation);
      // .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5))
      // .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI))
    }
    {
      tempAvatar.Right_wrist.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.rightHand,
          rightMiddle,
          rightWristNormal
        )
      )
      // .premultiply(slightLeftRotation);
      // .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5))
      // .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI))
    }

    // console.log('normal', leftWristNormal.toArray().join(','));

    const modelBoneWhiteliest = [
      tempAvatar.Hips,
      // tempAvatar.Left_shoulder,
      tempAvatar.Left_arm,
      tempAvatar.Right_arm,
      tempAvatar.Left_elbow,
      tempAvatar.Right_elbow,
      tempAvatar.Left_wrist,
      tempAvatar.Right_wrist,
    ];
    _setSkeletonWorld(avatar, tempAvatar, modelBoneWhiteliest);
  };
})();
const _copyAvatar = (srcAvatar, dstModelBones) => {
  for (const k in srcAvatar.modelBones) {
    const srcBone = srcAvatar.modelBones[k];
    const dstBone = dstModelBones[k];
    dstBone.position.copy(srcBone.position);
    dstBone.quaternion.copy(srcBone.quaternion);
    // dstBone.initialQuaternion = srcBone.initialQuaternion.clone();
    // console.log('copy initial quaternion', dstBone.initialQuaternion.toArray().join(','));
  }
};

class FaceTrackingWorker extends EventTarget {
  constructor() {
    super();

    this.messageChannel = new MessageChannel();
    this.messagePort = this.messageChannel.port1;

    this.iframe = document.createElement('iframe');
    // this.iframe.style.visibility = 'hidden';
    this.iframe.style.cssText = `\
      position: absolute;
      top: 0;
      left: 0;
      border: 0;
      height: 30px;
      width: 30px;
      /* height: 0;
      width: 0; */
      z-index: 10;
      pointer-events: none;
    `;
    this.iframe.allow = 'cross-origin-isolated';
    // window.iframe = this.iframe;

    const l = window.location;
    const port = parseInt(l.port, 10) || (l.protocol === 'https:' ? 443 : 80);
    const auxPort = port + 3;
    const u = `${l.protocol}//${l.host.replace(/webaverse\.com$/, 'webaverse.link')}:${auxPort}/face-tracking/face-tracking.html`;
    // const targetOrigin = `https://localhost.webaverse.com`;
    this.iframe.src = u;
    // console.log('got u', u);
    // window.iframe = this.iframe;
    this.iframe.addEventListener('load', e => {
      // console.log('posting message 1', this.iframe.contentWindow);
      
      this.iframe.contentWindow.postMessage({
        // lol: 'zol',
        _webaverse: true,
        messagePort: this.messageChannel.port2,
      }, '*', [this.messageChannel.port2]);
      // console.log('posting message 2');

      this.messagePort.onmessage = e => {
        // console.log('parent got message', e);
        
        this.dispatchEvent(new MessageEvent('result', {
          data: e.data,
        }));

        /* const {error, result} = e.data;
        if (!error) {
          console.log('got result', result);
        } else {
          console.warn('error from child', error);
        } */
      };

      /* this.iframe.contentWindow.addEventListener('message', e => {
        console.log('windw')
      }); */
    }, {once: true});
    document.body.appendChild(this.iframe);
  }
  /* postMessage(m, transfers = []) {
    this.iframe.contentWindow.postMessage(m, '*', transfers);
  } */
  pushImage(image) {
    this.messagePort.postMessage({
      image,
    }, [image]);
    // console.log('image pushed', image);
  }
  async processFrame(image) {
    // console.log('process frame 0');
    this.pushImage(image);

    // console.log('process frame 1');
    const result = await new Promise((resolve, reject) => {
      this.addEventListener('result', e => {
        if (!e.data.error) {
          resolve(e.data.result);
        } else {
          reject(e.data.error);
        }
      }, {once: true});
    });
    // console.log('process frame 2');
    return result;
  }
  destroy() {
    this.iframe.remove();
  }
}

const fakeAvatar = _makeFakeAvatar();
const loadPromise = Promise.all([
  ((async () => {
    {
      const defaultAvatarUrl = './avatars/scillia.vrm';
      const avatarApp = await metaversefile.load(defaultAvatarUrl);
      avatar = await switchAvatar(null, avatarApp);
      // avatar.inputs.hmd.position.y = avatar.height;
      
      avatar.setTopEnabled(true);
      avatar.setHandEnabled(0, false);
      avatar.setHandEnabled(1, false);
      avatar.setBottomEnabled(false);
      avatar.inputs.hmd.position.y = avatar.height;
      avatar.inputs.hmd.updateMatrixWorld();
      // avatar.update(1000);

      _copyAvatar(avatar, fakeAvatar);
      fakeAvatar.Root.updateMatrixWorld();
    }
    {
      previewScene = new THREE.Scene();
        
      const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
      previewScene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
      directionalLight.position.set(1, 2, 3);
      previewScene.add(directionalLight);

      previewScene.add(avatar.model);
    }
  })()),
  ((async () => {
    /* holistic = new Holistic({locateFile: (file) => {
      return `/holistic/${file}`;
    }});
    // holistic = new Holistic();
    holistic.setOptions({
      // staticImageMode: true,
      modelComplexity: 2,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      // minDetectionConfidence: 0.9,
      // minTrackingConfidence: 0.9,
    });
    holistic.onResults(onResults); */
    /* model = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
      {
        shouldLoadIrisModel: true,
        scoreThreshold: 0.9,
        maxFaces: 1,
      },
    );
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {runtime: 'tfjs'}); */
  })()),
]).then(() => {});
function waitForLoad() {
  return loadPromise;
}
const onResults = results => {
  // console.log('lol', results);

  // do something with prediction results
  // landmark names may change depending on TFJS/Mediapipe model version
  let facelm = results.faceLandmarks;
  // let poselm = results.poseLandmarks;
  let poselm3D = results.ea;
  let rightHandlm = results.rightHandLandmarks;
  let leftHandlm = results.leftHandLandmarks;

  // window.results = results;
  
  /* for (const lms of [
    poselm3D,
    rightHandlm,
    leftHandlm
  ]) {
    if (lms) {
      console.log('got lms', lms);
      for (const lm of lms) {
        if (typeof lm.z !== 'number') {
          debugger;
        }
        lm.z *= -1;
      }
    }
  } */

  if (facelm) {
    let faceRig = Kalidokit.Face.solve(facelm,{runtime:'mediapipe',imageSize:dimensions})
    // let poseRig = Kalidokit.Pose.solve(poselm3D,poselm,{runtime:'mediapipe',video:videoEl})
    _solvePoseToAvatar(poselm3D, leftHandlm, rightHandlm, fakeAvatar);
    let rightHandRig = rightHandlm ? Kalidokit.Hand.solve(rightHandlm,"Right") : null;
    let leftHandRig = leftHandlm ? Kalidokit.Hand.solve(leftHandlm,"Left") : null;
    
    // window.faceRig = faceRig;
    // window.lm = facelm;

    const _renderOverlay = () => {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      
      const s = 5;
      const halfS = s/2;
      const _drawLm = (index, style) => {
        overlayCtx.fillStyle = style;
        const point = facelm[index];
        overlayCtx.fillRect(point.x - halfS, point.y - halfS, s, s);
      };
      _drawLm(points.pupil.left[0], '#FF0000');
      _drawLm(points.eye.left[0], '#00FF00');
      _drawLm(points.eye.left[1], '#0000FF');
      
      // _drawLm(points.pupil.right[0], '#FF0000');
      // _drawLm(points.eye.right[0], '#00FF00');
      // _drawLm(points.eye.right[1], '#0000FF');
    };
    // _renderOverlay();

    // console.log('got', faceRig, poseRig);
    if (faceRig) {
      const {eye, head, mouth} = faceRig;
      const {
        shape: {A, E, I, O, U},
      } = mouth;
      // const {degrees} = head;
      
      const pupilPos = (lm, side = "left") => {
        const eyeOuterCorner = new Kalidokit.Vector(lm[points.eye[side][0]]);
        const eyeInnerCorner = new Kalidokit.Vector(lm[points.eye[side][1]]);
        const eyeWidth = eyeOuterCorner.distance(eyeInnerCorner, 2);
        const midPoint = eyeOuterCorner.lerp(eyeInnerCorner, 0.5);
        const pupil = new Kalidokit.Vector(lm[points.pupil[side][0]]);
        // console.log('got', pupil.x, midPoint.x, eyeWidth, dx/eyeWidth, eyeInnerCorner.x, eyeOuterCorner.x);
        const dx = (midPoint.x - pupil.x) / (eyeWidth / 2);
        //eye center y is slightly above midpoint
        const dy = (midPoint.y - pupil.y) / (eyeWidth / 2);
        
        // console.log('got dx', dx, dy);

        return { x: dx, y: dy };
      };
      const lPupil = pupilPos(facelm, 'left');
      const rPupil = pupilPos(facelm, 'right');
      const pupil = {
        x: -(lPupil.x + rPupil.x) * 0.5,
        y: (lPupil.y + rPupil.y) * 0.5,
      };
      
      avatar.faceTracking = {
        head: new THREE.Vector3()
          .copy(head.degrees)
          .multiplyScalar(Math.PI/180),
        eyes: [1-eye.r, 1-eye.l],
        pupils: [
          [pupil.x, pupil.y],
          [pupil.x, pupil.y],
        ],
        vowels: [A, E, I, O, U],
      };
      // console.log('got', faceRig.pupil.x, faceRig.pupil.y);
    }
    /* avatar.handTracking = [
      rightHandRig ? rightHandRig : null,
      leftHandRig ? leftHandRig : null,
    ]; */
    // if (poseRig) {
      // avatar.inputs.hmd.quaternion.copy(y180Quaternion);
    // }
    avatar.poseTracking = fakeAvatar;
    avatar.handTracking = [
      leftHandRig,
      rightHandRig,
    ];
    if (leftHandRig) {
      avatar.setHandEnabled(1, true);
    }
    if (rightHandRig) {
      avatar.setHandEnabled(0, true);
    }
    
    /* // window.poseRig = poseRig;
    if (rightHandRig) {
      window.rightHandRig = rightHandRig;
    }
    if (leftHandRig) {
      window.leftHandRig = leftHandRig;
    } */
  }
};
const _getImageCapture = async () => {
  const mediaDevices = await navigator.mediaDevices.enumerateDevices();
  const videoDevice = mediaDevices.find(o => o.kind === 'videoinput' && !/virtual/i.test(o.label));
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: {
        ideal: dimensions.width,
      },
      height: {
        ideal: dimensions.height,
      },
      frameRate: {
        ideal: 30,
      },
      facingMode: 'user',
      deviceId: videoDevice.deviceId,
    },
  });
  const videoTrack = stream.getVideoTracks()[0];
  /* videoTrack.onended = () => {
    console.log('video stream track ended');
    debugger;
  }; */
  // window.videoTrack = videoTrack;
  // console.log('original muted', videoTrack.muted);
  /* videoTrack.onmute = e => {
    console.log('muted', e);
    // debugger;
  };
  videoTrack.onunmute = e => {
    console.log('unmuted', e);
    // debugger;
  }; */
  /* Object.defineProperty(videoTrack, 'muted', {
    set(muted) {
      console.log('set muted', muted);
      debugger;
    },
    get() {
      return false;
    },
  }); */
  const imageCapture = new ImageCapture(videoTrack);
  let frame = null;
  let framePromise = null;
  // let animationFrame = null;
  const _recurse = async () => {
    framePromise = imageCapture.grabFrame();
    const newFrame = await framePromise;
    if (frame) {
      frame.close();
    }
    frame = newFrame;
    framePromise = null;
    _recurse();
  };
  _recurse();
  imageCapture.pullFrame = async () => {
    if (!frame) {
      await framePromise;
    }
    const result = frame;
    frame = null;
    return result;
  };
  imageCapture.destroy = () => {
    // cancelAnimationFrame(animationFrame);
    imageCapture.track.stop();
  };
  return imageCapture;
};
function startCamera() {
  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  if (!faceTrackingWorker) {
    faceTrackingWorker = new FaceTrackingWorker();
  }

  (async () => {
    {
      canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      document.body.appendChild(canvas);
      canvas.style.cssText = `\
        position: absolute;
        bottom: 0;
        right: ${displayWidth}px;
        width: ${displayWidth}px;
        z-index: 100;
        transform: rotateY(180deg);
      `;
      document.body.appendChild(canvas);
      // window.canvas2 = canvas;
    }
    const previewRenderer = new THREE.WebGLRenderer({
      canvas,
      // context,
      antialias: true,
      // alpha: true,
    });
    {
      videoEl = document.createElement('video');
      videoEl.width = dimensions.width;
      videoEl.height = dimensions.height;
      document.body.appendChild(videoEl);
      videoEl.style.cssText = `\
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${displayWidth}px;
        height: auto;
        z-index: 100;
        transform: rotateY(180deg);
      `;
    }
    {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = dimensions.width;
      overlayCanvas.height = dimensions.height;
      overlayCtx = overlayCanvas.getContext('2d');
      document.body.appendChild(overlayCanvas);
      
      overlayCanvas.style.cssText = videoEl.style.cssText;
      overlayCanvas.style.backgroundColor = '#FF000020';
      document.body.appendChild(overlayCanvas);
      
      previewCamera = new THREE.PerspectiveCamera(
        60,
        canvas.width / canvas.height,
        0.1,
        1000
      );
    }
    {
      /* const _waitForFaceTrackerResult = () => new Promise((accept, reject) => {
        const onmessage = e => {
          faceTrackingWorker.addEventListener('message', onmessage);
          if (!e.data.error) {
            accept(e.data.result);
          } else {
            reject(e.data.error);
          }
        };
        faceTrackingWorker.addEventListener('message', onmessage);
      }); */
      let imageCapture = null;
      const _pushFrame = async () => {
        stats.begin();

        if (!imageCapture) {
          console.log('create image capture');
          imageCapture = await _getImageCapture();
          imageCapture.track.addEventListener('mute', e => {
            imageCapture.destroy();
            imageCapture = null;
          });
        }
        const imageBitmap = await imageCapture.pullFrame();
        // const imageBitmap = await imageCapture.grabFrame();
        // console.log('push frame', imageBitmap);
        // console.log('post frame', imageBitmap.lol);
        const results = await faceTrackingWorker.processFrame(imageBitmap);
        // console.log('got results', results);
        // window.results = results;
        onResults(results);
        /* faceTrackingWorker.postMessage({
          image: imageBitmap,
        }, [imageBitmap]); */
        // await _waitForFaceTrackerResult();

        stats.end();

        _pushFrame();
      };
      _pushFrame();

      // console.log('got stream', videoTrack);
          
      /* // use Mediapipe's webcam utils to send video to holistic every frame
      const camera = new Camera(videoEl, {
        onFrame: async () => {
          await holistic.send({image: videoEl});
          
          // console.log('send image');
          // await holistic.send({image: videoEl});
          
          if (model && detector && avatar) {
            const [
              faces,
              poses,
            ] = await Promise.all([
              model.estimateFaces({
                input: videoEl,
                // predictIrises: false,
              }),
              detector.estimatePoses(videoEl),
            ]);
            
            avatar.faceTracking = null;
            
            if (faces.length > 0) {
              const faceLandmarks = faces[0].mesh;
              // console.log('got', faces[0].mesh);
              
              let faceRig = Kalidokit.Face.solve(faceLandmarks,{runtime:'tfjs',video:videoEl})
              // let poseRig = Kalidokit.Pose.solve(poselm3D,poselm,{runtime:'mediapipe',video:videoEl})
              // let rightHandRig = Kalidokit.Hand.solve(rightHandlm,"Right")
              // let leftHandRig = Kalidokit.Hand.solve(leftHandlm,"Left")
              
              // window.faceRig = faceRig;
              
              // console.log('got', faceRig, poseRig);
              if (faceRig) {
                const {eye, head, mouth} = faceRig;
                const {
                  shape: {A, E, I, O, U},
                } = mouth;
                const {degrees} = head;
                avatar.faceTracking = {
                  head: new THREE.Vector3()
                    .copy(head.degrees)
                    .multiplyScalar(Math.PI/180),
                  eyes: [1-eye.l, 1-eye.r],
                  pupil: [faceRig.pupil.x, faceRig.pupil.y],
                  vowels: [A, E, I, O, U],
                };
              }
            }
            if (poses.length > 0) {
              window.poses = poses;
              // const pose = poses[0];
              // let poseRig = Kalidokit.Pose.solve(pose,poselm,{runtime:'tfjs',video:videoEl})
            }
          }
        },
        width: canvas.width,
        height: canvas.height,
      });
      camera.start(); */
    }
    {
      const distance = 0.6;
      // const h = avatar.height * 0.85;
      const h = avatar.height * 0.9;
      previewCamera.position.set(0, h, distance);
      // previewCamera.position.set(0, avatar.height, -distance);
      previewCamera.lookAt(new THREE.Vector3(0, h, 0));
      previewCamera.updateMatrixWorld();
      
      world.appManager.addEventListener('frame', e => {
        const {timeDiff} = e.data;
        
        if (avatar) {
          avatar.update(timeDiff);
        }
        
        previewRenderer.clear();
        previewRenderer.render(previewScene, previewCamera);
      });
    }
  })();
}

export {
  waitForLoad,
  startCamera,
};