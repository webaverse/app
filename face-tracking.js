import * as THREE from "three";
import metaversefile from "metaversefile";
import * as Kalidokit from './kalidokit/src/index.js';
// import {calcLegs} from './kalidokit/src/PoseSolver/calcLegs.js';
// import {Holistic} from '@mediapipe/holistic/holistic';
// import {Camera} from '@mediapipe/camera_utils/camera_utils';
// import '@tensorflow/tfjs-backend-webgl';
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// import * as poseDetection from '@tensorflow-models/pose-detection';
// import Avatar from './avatars/avatars.js';
// import {getRenderer, scene} from './renderer.js';
// import {world} from './world.js';
// import {fitCameraToBox} from './util.js';
import {/*makeAvatar, */switchAvatar} from './player-avatar-binding.js';
// import Stats from 'stats.js';

const domDimensions = {
  width: Math.floor(640/1.5),
  height: Math.floor(480/1.5),
};
const internalDimensions = {
  width: domDimensions.width * window.devicePixelRatio,
  height: domDimensions.height * window.devicePixelRatio,
};
const points = {
  eye: {
    left: [130, 133, 160, 159, 158, 144, 145, 153],
    right: [359, 362, 387, 386, 385, 373, 374, 380],
  },
  brow: {
    right: [35, 244, 63, 105, 66, 229, 230, 231],
    left: [265, 464, 293, 334, 296, 449, 450, 451],
  },
  pupil: {
    right: [473, 474, 475, 476, 477],
    left: [468, 469, 470, 471, 472],
  },
  mouth: [61, 291, 164, 118, 13, 14, 50, 280, 200],
};
// const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const slightLeftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.1);
// const rollRightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI*0.5);
// const upRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5);

// window.clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const remap = (val, min, max) => {
  //returns min to max -> 0 to 1
  return (clamp(val, min, max) - min) / (max - min);
};
const eyeLidRatio = (
  eyeOuterCorner,
  eyeInnerCorner,
  eyeOuterUpperLid,
  eyeMidUpperLid,
  eyeInnerUpperLid,
  eyeOuterLowerLid,
  eyeMidLowerLid,
  eyeInnerLowerLid
) => {
  eyeOuterCorner = new THREE.Vector3().copy(eyeOuterCorner);
  eyeInnerCorner = new THREE.Vector3().copy(eyeInnerCorner);

  eyeOuterUpperLid = new THREE.Vector3().copy(eyeOuterUpperLid);
  eyeMidUpperLid = new THREE.Vector3().copy(eyeMidUpperLid);
  eyeInnerUpperLid = new THREE.Vector3().copy(eyeInnerUpperLid);

  eyeOuterLowerLid = new THREE.Vector3().copy(eyeOuterLowerLid);
  eyeMidLowerLid = new THREE.Vector3().copy(eyeMidLowerLid);
  eyeInnerLowerLid = new THREE.Vector3().copy(eyeInnerLowerLid);

  //use 2D Distances instead of 3D for less jitter
  const eyeWidth = eyeOuterCorner.distanceTo(eyeInnerCorner, 2);
  const eyeOuterLidDistance = eyeOuterUpperLid.distanceTo(eyeOuterLowerLid, 2);
  const eyeMidLidDistance = eyeMidUpperLid.distanceTo(eyeMidLowerLid, 2);
  const eyeInnerLidDistance = eyeInnerUpperLid.distanceTo(eyeInnerLowerLid, 2);
  const eyeLidAvg = (eyeOuterLidDistance + eyeMidLidDistance + eyeInnerLidDistance) / 3;
  const ratio = eyeLidAvg / eyeWidth;

  return ratio;
};
const getEyeOpen = (lm, side = "left", { high = 0.85, low = 0.55 } = {}) => {
  let eyePoints = points.eye[side];
  let eyeDistance = eyeLidRatio(
      lm[eyePoints[0]],
      lm[eyePoints[1]],
      lm[eyePoints[2]],
      lm[eyePoints[3]],
      lm[eyePoints[4]],
      lm[eyePoints[5]],
      lm[eyePoints[6]],
      lm[eyePoints[7]]
  );
  // human eye width to height ratio is roughly .3
  let maxRatio = 0.285;
  // compare ratio against max ratio
  let ratio = clamp(eyeDistance / maxRatio, 0, 2);
  return ratio;
  /* // remap eye open and close ratios to increase sensitivity
  let eyeOpenRatio = remap(ratio, low, high);
  return {
      // remapped ratio
      norm: eyeOpenRatio,
      // ummapped ratio
      raw: ratio,
  }; */
};
const getBrowRaise = (lm, side = "left") => {
  let browPoints = points.brow[side];
  let browDistance = eyeLidRatio(
      lm[browPoints[0]],
      lm[browPoints[1]],
      lm[browPoints[2]],
      lm[browPoints[3]],
      lm[browPoints[4]],
      lm[browPoints[5]],
      lm[browPoints[6]],
      lm[browPoints[7]]
  );

  const min = 0.6;
  const max = 1;
  const browRaiseRatio = clamp(((browDistance - min) / (max - min)) * 5, 0, 2);
  // console.log('brow distance', browRaiseRatio);
  return browRaiseRatio;

  /* let maxBrowRatio = 1.15;
  let browHigh = 0.125;
  let browLow = 0.07;
  let browRatio = browDistance / maxBrowRatio - 1;
  let browRaiseRatio = (clamp(browRatio, browLow, browHigh) - browLow) / (browHigh - browLow);
  return browRaiseRatio; */
};
window.THREE = THREE;
window.p0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5)
  .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5))
window.p1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0)
window.p2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5)
window.q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5);
window.q2 = new THREE.Quaternion()
window.b0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.5)
window.b1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5)
  .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI))
  .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5))
window.a0 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5)
  .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5))
window.a1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5)

window.d = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0.5)
  .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5))

window.v = new THREE.Vector3(0, 1, 0);
window.v2 = new THREE.Vector3(0, 0, 1);
window.v3 = new THREE.Vector3(0, 0, 1)
window.qx = new THREE.Quaternion()//.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5);
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
// window.THREE = THREE;
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
    leftKnee: new THREE.Vector3(),
    rightKnee: new THREE.Vector3(),
    leftAnkle: new THREE.Vector3(),
    rightAnkle: new THREE.Vector3(),
    leftHeel: new THREE.Vector3(),
    rightHeel: new THREE.Vector3(),
    leftToe: new THREE.Vector3(),
    rightToe: new THREE.Vector3(),
  };
  window.boneBuffers = boneBuffers;
  /* const debugMeshes = (() => {
    const meshes = {};
    const cubeGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    const cubeRedMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
    });
    const cubeBlueMaterial = new THREE.MeshPhongMaterial({
      color: 0x0000ff,
    });
    const cubeGreenMaterial = new THREE.MeshPhongMaterial({
      color: 0x00FF00,
    });
    const cubeWhiteMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
    });
    for (const k in boneBuffers) {
      let color;
      if (k === 'rightToe' || k === 'leftToe') {
        color = cubeRedMaterial;
      } else if (k === 'rightKnee' || k === 'leftKnee') {
        color = cubeGreenMaterial;
      } else if (k === 'leftHip' || k === 'rightHip') {
        color = cubeWhiteMaterial;
      } else { 
        color = cubeBlueMaterial;
      }
      const mesh = new THREE.Mesh(cubeGeometry, color);
      meshes[k] = mesh;

      const {scene} = metaversefile.useInternals();
      scene.add(mesh);
    }
    return meshes;
  })();
  window.debugMeshes = debugMeshes; */

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
    boneBuffers.leftKnee.copy(lm3d[25]);
    boneBuffers.rightKnee.copy(lm3d[26]);
    boneBuffers.leftAnkle.copy(lm3d[27]);
    boneBuffers.rightAnkle.copy(lm3d[28]);
    boneBuffers.leftHeel.copy(lm3d[29]);
    boneBuffers.rightHeel.copy(lm3d[30]);
    boneBuffers.leftToe.copy(lm3d[31]);
    boneBuffers.rightToe.copy(lm3d[32]);

    for (const k in boneBuffers) {
      // boneBuffers[k].x *= -1;
      boneBuffers[k].y *= -1;
      boneBuffers[k].z *= -1;
    }

    /* const _updateDebugMeshes = () => {
      for (const k in boneBuffers) {
        const boneBuffer = boneBuffers[k];
        const debugMesh = debugMeshes[k];
        debugMesh.position.copy(boneBuffer)
        debugMesh.position.y += 1;
        // debugMesh.quaternion.copy(boneBuffer.quaternion);
        // debugMesh.scale.copy(boneBuffer.scale);
        debugMesh.updateMatrixWorld();
      }
    };
    _updateDebugMeshes(); */

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
    window.leftMiddle = leftMiddle;
    
    const rightMiddle = localVector3.copy(boneBuffers.rightPinky)
      .add(boneBuffers.rightIndex)
      .divideScalar(2);

    let leftWristNormal;
    let leftPointerStart;
    let leftPointerEnd;
    if (leftHandLm) {
      localTriangle.a.copy(leftHandLm[0]);
      localTriangle.b.copy(leftHandLm[5]);
      localTriangle.c.copy(leftHandLm[17]);
      leftPointerStart = new THREE.Vector3().copy(leftHandLm[0]);
      leftPointerEnd = new THREE.Vector3().copy(leftHandLm[5]);
    } else {
      localTriangle.a.copy(boneBuffers.leftIndex);
      localTriangle.b.copy(boneBuffers.leftPinky);
      localTriangle.c.copy(boneBuffers.leftThumb);
      leftPointerStart = boneBuffers.leftHand.clone();
      leftPointerEnd = boneBuffers.leftIndex.clone();
    }
    [
      localTriangle.a,
      localTriangle.b,
      localTriangle.c,
    ].forEach(v => {
      v.x *= -1;
      v.y *= -1;
      v.z *= -1;
    });
    leftWristNormal = localTriangle.getNormal(localVector4);
    [
      leftWristNormal,
      leftPointerStart,
      leftPointerEnd,
    ].forEach(v => {
      v.x *= -1;
      v.y *= -1;
      // v.x *= -1;
      // v.y *= -1;
    });

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

    const fakeQuaternion = (() => {
      const now = performance.now();
      const i = Math.floor(now / 2000) % 3;
      const y = Math.sin(((now % 2000) / 2000) * (Math.PI*2)) * Math.PI;
      
      if (i === 0) {
        return new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, y, 0),
            // leftPointerEnd.clone().sub(leftPointerStart).normalize(),
            new THREE.Vector3(0, 1, 0)
            // leftWristNormal
            /* leftPointerStart,
            leftPointerEnd,
            window.v3 */
          )
        );
      } else if (i === 1) {
        return new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0, y),
            // leftPointerEnd.clone().sub(leftPointerStart).normalize(),
            new THREE.Vector3(0, 1, 0)
            // leftWristNormal
            /* leftPointerStart,
            leftPointerEnd,
            window.v3 */
          )
        );
      } else if (i === 2) {
        return new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0, 0),
            // leftPointerEnd.clone().sub(leftPointerStart).normalize(),
            new THREE.Vector3(0, 1, y)
            // leftWristNormal
            /* leftPointerStart,
            leftPointerEnd,
            window.v3 */
          )
        );
      } else {
        debugger;
      }
    })();

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
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    }
    {
      localTriangle.a.copy(boneBuffers.leftShoulder);
      localTriangle.b.copy(bodyCenter);
      localTriangle.c.copy(boneBuffers.rightShoulder);
      const upperChestDirection = localTriangle.getNormal(localVector8);
      // hipsDirection.x *= -1;
      tempAvatar.UpperChest.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          zeroVector,
          upperChestDirection,
          localVector9.set(0, 1, 0)
        )
      )
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    }
    /* {
      localTriangle.a.copy(boneBuffers.leftShoulder);
      localTriangle.b.copy(bodyCenter);
      localTriangle.c.copy(boneBuffers.rightShoulder);
      const shoulderDirection = localTriangle.getNormal(localVector8);
      // hipsDirection.x *= -1;
      tempAvatar.Left_shoulder.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          zeroVector,
          shoulderDirection,
          localVector9.set(0, 1, 0)
        )
      )
      .premultiply(slightLeftRotation);
      tempAvatar.Right_shoulder.quaternion.copy(tempAvatar.Left_shoulder.quaternion);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    } */
    const y = Math.sin(((performance.now() % 2000) / 2000) * (Math.PI*2)) * Math.PI;
    // console.log(y);
    {
      tempAvatar.Left_arm.quaternion.identity()
        .premultiply(window.p0)
        .premultiply(
          new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(1, 0, 0),
              new THREE.Vector3(0, 1, 0)
            )
          )
        )
      if (window.lol1) {
        tempAvatar.Left_arm.quaternion
          .premultiply(fakeQuaternion)
      }
      tempAvatar.Left_arm.quaternion
        .premultiply(window.p1)
        /*.setFromUnitVectors(
          new THREE.Vector3(1, 0, 0),
          boneBuffers.leftElbow.clone().sub(boneBuffers.leftShoulder).normalize()
        )*/
    }
    {
      tempAvatar.Right_arm.quaternion.identity()/*.setFromUnitVectors(
        new THREE.Vector3(-1, 0, 0),
        boneBuffers.rightElbow.clone().sub(boneBuffers.rightShoulder).normalize()
      ) */
      .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.1))
      // .multiply(avatar.Left_shoulder.initialQuaternion)
      // .premultiply(rollRightRotation)
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
      // window.lol = [boneBuffers.leftShoulder, boneBuffers.leftElbow];
    }
    // window.initialQuaternion = avatar.Left_shoulder.initialQuaternion;
    {
      tempAvatar.Left_elbow.quaternion.identity()
        // .premultiply(window.q2)
        /* .setFromRotationMatrix(
          localMatrix.lookAt(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 1)
          )
        ) */
        .premultiply(window.a0)
        .premultiply(window.d)
      if (window.lol2) {
        tempAvatar.Left_elbow.quaternion
          .premultiply(fakeQuaternion)
      }
      tempAvatar.Left_elbow.quaternion
        .premultiply(window.d.clone().invert())
      tempAvatar.Left_elbow.quaternion
        /*.setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        boneBuffers.leftHand.clone().sub(boneBuffers.leftElbow).normalize() */
        .premultiply(window.a1)
    }
    {
      tempAvatar.Right_elbow.quaternion.identity()/*.setFromUnitVectors(
        new THREE.Vector3(-1, 0, 0),
        boneBuffers.rightHand.clone().sub(boneBuffers.rightElbow).normalize()
      ) */
      .premultiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0)
          .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI*0))
      )
      // .multiply(avatar.Left_wrist.initialQuaternion)
      // .premultiply(slightLeftRotation);
      // console.log('set hips', tempAvatar.Hips.quaternion.toArray().join(','));
    }
    {
      tempAvatar.Left_wrist.quaternion.identity()
        .premultiply(window.b0)
        // .premultiply(fakeQuaternion)
        /*.premultiply(
          new THREE.Quaternion().setFromRotationMatrix(
            localMatrix.lookAt(
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(1, y, 0),
              new THREE.Vector3(0, 0, 1)
            )
          )
        ) */
        .premultiply(window.b1)
    }
    {
      tempAvatar.Right_wrist.quaternion.identity()/*.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.rightHand,
          rightMiddle,
          rightWristNormal
        )
      ) */
      // .premultiply(slightLeftRotation);
      // .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5))
      // .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI))
    }
    /* {
      tempAvatar.Left_leg.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.leftHip,
          boneBuffers.leftKnee,
          new THREE.Vector3(0, 0, 1)
        )
      )
    }
    {
      tempAvatar.Left_knee.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.leftKnee,
          boneBuffers.leftAnkle,
          new THREE.Vector3(0, 0, 1)
        )
      )
    }
    {
      tempAvatar.Left_ankle.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          boneBuffers.leftHeel,
          boneBuffers.leftToe,
          new THREE.Vector3(0, 1, 0)
        )
      )
    } */
    // window.leftLeg = tempAvatar.Left_leg;

    const modelBoneWhiteliest = [
      tempAvatar.Hips,
      tempAvatar.UpperChest,
      // tempAvatar.Left_shoulder,
      // tempAvatar.Right_shoulder,
      tempAvatar.Left_arm,
      tempAvatar.Right_arm,
      tempAvatar.Left_elbow,
      tempAvatar.Right_elbow,
      tempAvatar.Left_wrist,
      tempAvatar.Right_wrist,
      // tempAvatar.Left_leg,
      // tempAvatar.Left_knee,
      // tempAvatar.Left_ankle,
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
    this.open = false;

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
    const port = parseInt(l.port, 10) || 0;
    const u = `${l.protocol}//${l.host.replace(/webaverse\.com$/, 'webaverse.online')}${port ? (':' + port) : ''}/face-tracking/face-tracking.html`;
    // const targetOrigin = `https://localhost.webaverse.com`;
    this.iframe.src = u;
    this.iframe.addEventListener('load', e => {
      this.iframe.contentWindow.postMessage({
        _webaverse: true,
        messagePort: this.messageChannel.port2,
      }, '*', [this.messageChannel.port2]);

      const _handleMessage = e => {
        if (!this.open) {
          this.dispatchEvent(new MessageEvent('open'));
          this.open = true;
        }

        this.dispatchEvent(new MessageEvent('result', {
          data: e.data,
        }));
      };
      this.messagePort.onmessage = _handleMessage;
    }, {once: true});
    document.body.appendChild(this.iframe);
  }
  pushImage(image) {
    this.messagePort.postMessage({
      image,
    }, [image]);
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
class VideoCapture extends EventTarget {
  constructor() {
    super();

    this.frame = null;
    this.framePromise = null;
    this.imageCapture = null;
    this.imageCapturePromise = null;
    this.videoEl = null;
    this.videoCanvas = null;
    this.videoCanvasCtx = null;

    this.imageCapturePromise = (async () => {
      {
        this.videoCanvas = document.createElement('canvas');
        this.videoCanvas.width = internalDimensions.width;
        this.videoCanvas.height = internalDimensions.height;
        this.videoCanvas.style.width = domDimensions.width + 'px';
        this.videoCanvas.style.height = domDimensions.height + 'px';
        // this.videoCanvas.style.cssText = this.videoEl.style.cssText;
        this.videoCanvasCtx = this.videoCanvas.getContext('2d');
      }
      {
        this.videoEl = document.createElement('video');
        this.videoEl.width = internalDimensions.width;
        this.videoEl.height = internalDimensions.height;
        this.videoEl.style.width = domDimensions.width + 'px';
        this.videoEl.style.height = domDimensions.height + 'px';
      }

      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevice = mediaDevices.find(o => o.kind === 'videoinput' && !/virtual/i.test(o.label));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: {
            ideal: internalDimensions.width,
          },
          height: {
            ideal: internalDimensions.height,
          },
          frameRate: {
            ideal: 30,
          },
          facingMode: 'user',
          deviceId: videoDevice.deviceId,
        },
      });
      const videoTrack = stream.getVideoTracks()[0];
      this.videoEl.srcObject = stream;
      this.videoEl.play();

      this.imageCapture = new ImageCapture(videoTrack);
      this.imageCapture.track.addEventListener('mute', e => {
        this.imageCapture.destroy();
        this.imageCapture = null;
      });
      this.imageCapturePromise = null;

      const _recurse = async () => {
        this.ensureFramePromise();
        requestAnimationFrame(_recurse);
      };
      _recurse();

      this.dispatchEvent(new MessageEvent('open'));
    })();
  }
  ensureFramePromise() {
    if (!this.framePromise) {
      this.framePromise = (async () => {
        // console.time('frame');
        this.videoCanvasCtx.drawImage(this.videoEl, 0, 0, internalDimensions.width, internalDimensions.height);
        this.frame && this.frame.close();
        this.frame = await createImageBitmap(this.videoCanvas);
        // console.timeEnd('frame');
        this.framePromise = null;
        return this.frame;
      })();
    }
  }
  async pullFrame() {
    if (this.imageCapturePromise) {
      await this.imageCapturePromise;
    }

    let result = this.frame;
    if (!result) {
      this.ensureFramePromise();
      result = await this.framePromise;
    }
    this.frame = null;
    return result;
  }
  destroy() {
    this.imageCapture.track.stop();
    this.videoEl.remove();
    this.videoCanvas.remove();
  }
}
class FaceTracker extends EventTarget {
  constructor() {
    super();

    window.faceTracker = this;

    this.canvas = null;
    this.avatar = null;
    this.previewRenderer = null;
    this.previewScene = null;
    this.previewCamera = null;
    this.faceTrackingWorker = new FaceTrackingWorker();
    this.videoCapture = new VideoCapture();
    this.domElement = null;
    this.live = true;

    (async () => {
      await Promise.all([
        new Promise((accept, reject) => {
          this.faceTrackingWorker.addEventListener('open', e => {
            accept();
          });
        }),
        new Promise((accept, reject) => {
          this.videoCapture.addEventListener('open', e => {
            accept();
          });
        }),
      ]);
      this.dispatchEvent(new MessageEvent('open'));
    })();

    {
      const canvas = document.createElement('canvas');
      canvas.width = internalDimensions.width;
      canvas.height = internalDimensions.height;
      canvas.style.width = domDimensions.width + 'px';
      canvas.style.height = domDimensions.height + 'px';
      /* canvas.style.cssText = `\
        position: absolute;
        bottom: 0;
        width: ${displayWidth}px;
        height: ${displayWidth}px;
        z-index: 100;
        transform: rotateY(180deg);
      `; */
      // window.canvas2 = canvas;
      this.domElement = canvas;
    }
    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: this.domElement,
      // context,
      antialias: true,
      // alpha: true,
    });
    /* {
      videoEl = document.createElement('video');
      videoEl.width = dimensions.width;
      videoEl.height = dimensions.height;
      videoEl.style.cssText = `\
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${displayWidth}px;
        height: auto;
        z-index: 100;
        transform: rotateY(180deg);
      `;
      // document.body.appendChild(videoEl);
    } */
    /* {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = dimensions.width;
      overlayCanvas.height = dimensions.height;
      overlayCtx = overlayCanvas.getContext('2d');
      
      // overlayCanvas.style.cssText = videoEl.style.cssText;
      // overlayCanvas.style.backgroundColor = '#FF000020';
      // document.body.appendChild(overlayCanvas);
    } */
    {
      this.previewScene = new THREE.Scene();
      this.previewScene.autoUpdate = false;

      const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
      this.previewScene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
      directionalLight.position.set(1, 2, 3);
      this.previewScene.add(directionalLight);
    }
    {
      this.previewCamera = new THREE.PerspectiveCamera(
        60,
        this.domElement.width / this.domElement.height,
        0.1,
        1000
      );
    }

    const _recurseFrame = async () => {
      const imageBitmap = await this.videoCapture.pullFrame();
      if (!this.live) return;
      const results = await this.faceTrackingWorker.processFrame(imageBitmap);
      if (!this.live) return;
      this.onResults(results);

      _recurseFrame();
    };
    _recurseFrame();
  }
  async setAvatar(avatarApp) {
    if (this.avatar) {
      this.previewScene.remove(this.avatar.model);
      this.avatar = null;
    }

    this.avatar = await switchAvatar(null, avatarApp);
    // avatar.inputs.hmd.position.y = avatar.height;
    
    // this.avatar.setTopEnabled(true);
    // this.avatar.setHandEnabled(0, false);
    // this.avatar.setHandEnabled(1, false);
    // this.avatar.setBottomEnabled(false);
    this.avatar.inputs.hmd.position.y = this.avatar.height;
    this.avatar.inputs.hmd.updateMatrixWorld();
    this.avatar.inputs.hmd.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    for (let i = 0; i < 2; i++) {
      this.avatar.setHandEnabled(i, false);
    }
    // avatar.update(1000);

    this.previewScene.add(this.avatar.model);

    {
      const distance = -1;
      // const h = avatar.height * 0.85;
      const h = this.avatar.height * 0.9;
      this.previewCamera.position.set(0, h, -distance);
      // this.previewCamera.position.set(0, avatar.height, -distance);
      this.previewCamera.lookAt(new THREE.Vector3(0, h, 0));
      this.previewCamera.updateMatrixWorld();
    }

    // _copyAvatar(this.avatar, fakeAvatar);
    // fakeAvatar.Root.updateMatrixWorld();
  }
  update(timeDiff) {
    if (this.avatar) {
      this.avatar.update(timeDiff);
    }
    
    this.previewRenderer.clear();
    this.previewRenderer.render(this.previewScene, this.previewCamera);
  }
  onResults(results) {
    if (this.avatar) {
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
        _solvePoseToAvatar(poselm3D, leftHandlm, rightHandlm, fakeAvatar);
        let faceRig = Kalidokit.Face.solve(facelm, {runtime: 'mediapipe', imageSize: internalDimensions});
        // let poseRig = Kalidokit.Pose.solve(poselm3D, poselm, {runtime:'mediapipe', imageSize: internalDimensions, enableLegs: true});
        // window.poselm3D = poselm3D;
        let rightHandRig = rightHandlm ? Kalidokit.Hand.solve(rightHandlm,"Right") : null;
        let leftHandRig = leftHandlm ? Kalidokit.Hand.solve(leftHandlm,"Left") : null;
        // let legsRig = calcLegs(poselm3D);
        // window.poseRig = poseRig;
        // window.legsRig = legsRig;

        /* const _renderOverlay = () => {
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
        _renderOverlay(); */

        // console.log('got', faceRig, poseRig);
        if (faceRig) {
          const {
            /* eye, */
            head,
            mouth: {
              shape: {A, E, I, O, U}
            }
          } = faceRig;
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
          const mouth = (() => {
            const left = new THREE.Vector3().copy(facelm[points.mouth[0]]);
            const right = new THREE.Vector3().copy(facelm[points.mouth[1]]);
            // const top = new THREE.Vector3().copy(facelm[points.mouth[2]]);
            // const bottom = new THREE.Vector3().copy(facelm[points.mouth[3]]);
            const centerTop = new THREE.Vector3().copy(facelm[points.mouth[4]]);
            const centerBottom = new THREE.Vector3().copy(facelm[points.mouth[5]]);
            const cheekLeftOuter = new THREE.Vector3().copy(facelm[points.mouth[6]]);
            const cheekRightOuter = new THREE.Vector3().copy(facelm[points.mouth[7]]);
            const cheekBottom = new THREE.Vector3().copy(facelm[points.mouth[8]]);

            const center = new THREE.Vector3().copy(centerTop).lerp(centerBottom, 0.5);

            const plane = new THREE.Plane().setFromCoplanarPoints(
              cheekLeftOuter,
              cheekRightOuter,
              cheekBottom,
            );

            const leftPlane = plane.projectPoint(left, new THREE.Vector3());
            const rightPlane = plane.projectPoint(right, new THREE.Vector3());
            // const topPlane = plane.projectPoint(top, new THREE.Vector3());
            // const bottomPlane = plane.projectPoint(bottom, new THREE.Vector3());
            const centerPlane = plane.projectPoint(center, new THREE.Vector3());
            const xAxis = rightPlane.clone().sub(leftPlane).normalize();
            const yAxis = xAxis.clone().cross(plane.normal).normalize();
            // const yAxis = topPlane.clone().sub(bottomPlane).normalize();

            /* console.log('plane normal',
              plane.normal.toArray().join(','),
              xAxis.toArray().join(','),
              yAxis.toArray().join(',')
            ); */

            const leftRightLine = new THREE.Line3(leftPlane, rightPlane);

            const centerClosestPoint = leftRightLine.closestPointToPoint(centerPlane, true, new THREE.Vector3());
            const centerOffset = centerClosestPoint.clone().sub(centerPlane);
            const centerY = centerOffset.dot(yAxis);
            if (centerY <= 2) {
              return -clamp(2 - centerY, 0, 1);
            } else {
              return clamp((centerY - 2) / 6, 0, 1);
            }
          })();
          // console.log('got mouth', mouth);
          
          const eyes = [
            getEyeOpen(facelm, 'left'),
            getEyeOpen(facelm, 'right'),
          ];
          const brows = [
            getBrowRaise(facelm, 'left'),
            getBrowRaise(facelm, 'right'),
          ];
          // window.brows = brows;
          this.avatar.arPose = {
            head: new THREE.Vector3()
              .copy(head.degrees)
              .multiplyScalar(Math.PI/180),
            pose: fakeAvatar,
            hands: [
              leftHandRig,
              rightHandRig,
            ],
            face: {
              eyes: [1-eyes[1], 1-eyes[0]],
              brows: [1-brows[1], 1-brows[0]],
              pupils: [
                [pupil.x, pupil.y],
                [pupil.x, pupil.y],
              ],
              mouth,
              vowels: [A, E, I, O, U],
            },
          };
        } else {
          this.avatar.arPose = null;
        }
      }
    }
  }
  setAvatarPose(dstAvatar, srcAvatar = this.avatar) {
    dstAvatar.arPose = srcAvatar?.arPose;
  }
  destroy() {
    this.videoCapture.destroy();
    this.domElement.remove();
    this.live = false;
  }
}

export {
  FaceTracker,
};