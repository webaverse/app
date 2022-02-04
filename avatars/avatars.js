import * as THREE from 'three';
import {VRMSpringBoneImporter, VRMLookAtApplyer, VRMCurveMapper} from '@pixiv/three-vrm/lib/three-vrm.module.js';
import {fixSkeletonZForward} from './vrarmik/SkeletonUtils.js';
import PoseManager from './vrarmik/PoseManager.js';
import ShoulderTransforms from './vrarmik/ShoulderTransforms.js';
import LegsManager from './vrarmik/LegsManager.js';
import {scene, camera} from '../renderer.js';
import MicrophoneWorker from './microphone-worker.js';
import {AudioRecognizer} from '../audio-recognizer.js';
import {
  angleDifference,
  // getVelocityDampingFactor,
  getNextPhysicsId,
} from '../util.js';
import easing from '../easing.js';
import {zbdecode} from 'zjs/encoding.mjs';
import Simplex from '../simplex-noise.js';
import {
  crouchMaxTime,
  useMaxTime,
  aimMaxTime,
  avatarInterpolationFrameRate,
  avatarInterpolationTimeDelay,
  avatarInterpolationNumFrames,
} from '../constants.js';
import {FixedTimeStep} from '../interpolants.js';
import * as avatarCruncher from '../avatar-cruncher.js';
import * as avatarSpriter from '../avatar-spriter.js';
import game from '../game.js';
import {
  idleFactorSpeed,
  walkFactorSpeed,
  runFactorSpeed,
  narutoRunTimeFactor,
} from './constants.js';
import {
  getSkinnedMeshes,
  getSkeleton,
  getEyePosition,
  getHeight,
  // makeBoneMap,
  getTailBones,
  getModelBones,
  // cloneModelBones,
  decorateAnimation,
  // retargetAnimation,
  // animationBoneToModelBone,
} from './util.mjs';
import metaversefile from 'metaversefile';


const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
// const localVector6 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localQuaternion4 = new THREE.Quaternion();
const localQuaternion5 = new THREE.Quaternion();
const localQuaternion6 = new THREE.Quaternion();
const localEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const localEuler2 = new THREE.Euler(0, 0, 0, 'YXZ');
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localPlane = new THREE.Plane();

const textEncoder = new TextEncoder();

// const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const maxIdleVelocity = 0.01;
const maxEyeTargetTime = 2000;


function getFirstPersonCurves(vrmExtension) {
  if (vrmExtension) {
    const {firstPerson} = vrmExtension;
    const {
      lookAtHorizontalInner,
      lookAtHorizontalOuter,
      lookAtVerticalDown,
      lookAtVerticalUp,
      // lookAtTypeName,
    } = firstPerson;

    const DEG2RAD = Math.PI / 180; // THREE.MathUtils.DEG2RAD;
    function _importCurveMapperBone(map) {
      return new VRMCurveMapper(
        typeof map.xRange === 'number' ? DEG2RAD * map.xRange : undefined,
        typeof map.yRange === 'number' ? DEG2RAD * map.yRange : undefined,
        map.curve,
      );
    }
    const lookAtHorizontalInnerCurve = _importCurveMapperBone(lookAtHorizontalInner);
    const lookAtHorizontalOuterCurve = _importCurveMapperBone(lookAtHorizontalOuter);
    const lookAtVerticalDownCurve = _importCurveMapperBone(lookAtVerticalDown);
    const lookAtVerticalUpCurve = _importCurveMapperBone(lookAtVerticalUp);
    return {
      lookAtHorizontalInnerCurve,
      lookAtHorizontalOuterCurve,
      lookAtVerticalDownCurve,
      lookAtVerticalUpCurve,
    };
  } else {
    return null;
  }
}

const _makeSimplexes = numSimplexes => {
  const result = Array(numSimplexes);
  for (let i = 0; i < numSimplexes; i++) {
    result[i] = new Simplex(i + '');
  }
  return result;
};
const simplexes = _makeSimplexes(5);

const getClosest2AnimationAngles = (key, angle) => {
  const animationAngleArray = animationsAngleArrays[key];
  animationAngleArray.sort((a, b) => {
    const aDistance = Math.abs(angleDifference(angle, a.angle));
    const bDistance = Math.abs(angleDifference(angle, b.angle));
    return aDistance - bDistance;
  });
  const closest2AnimationAngles = animationAngleArray.slice(0, 2);
  return closest2AnimationAngles;
};

const upVector = new THREE.Vector3(0, 1, 0);
const upRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5);
const downRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.5);
const leftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5);
const rightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5);
const cubicBezier = easing(0, 1, 0, 1);
const defaultSitAnimation = 'chair';
const defaultUseAnimation = 'combo';
const defaultDanceAnimation = 'dansu';
const defaultThrowAnimation = 'throw';
// const defaultCrouchAnimation = 'crouch';
const defaultActivateAnimation = 'activate';
const defaultNarutoRunAnimation = 'narutoRun';
const defaultchargeJumpAnimation = 'chargeJump';
const defaultStandChargeAnimation = 'standCharge';

const infinityUpVector = new THREE.Vector3(0, Infinity, 0);

const animationsAngleArrays = {
  walk: [
    {name: 'left strafe walking.fbx', angle: Math.PI/2},
    {name: 'right strafe walking.fbx', angle: -Math.PI/2},

    {name: 'walking.fbx', angle: 0},
    {name: 'walking backwards.fbx', angle: Math.PI},

    // {name: 'left strafe walking reverse.fbx', angle: Math.PI*3/4},
    // {name: 'right strafe walking reverse.fbx', angle: -Math.PI*3/4},
  ],
  run: [
    {name: 'left strafe.fbx', angle: Math.PI/2},
    {name: 'right strafe.fbx', angle: -Math.PI/2},

    {name: 'Fast Run.fbx', angle: 0},
    {name: 'running backwards.fbx', angle: Math.PI},

    // {name: 'left strafe reverse.fbx', angle: Math.PI*3/4},
    // {name: 'right strafe reverse.fbx', angle: -Math.PI*3/4},
  ],
  crouch: [
    {name: 'Crouched Sneaking Left.fbx', angle: Math.PI/2},
    {name: 'Crouched Sneaking Right.fbx', angle: -Math.PI/2},
    
    {name: 'Sneaking Forward.fbx', angle: 0},
    {name: 'Sneaking Forward reverse.fbx', angle: Math.PI},
    
    // {name: 'Crouched Sneaking Left reverse.fbx', angle: Math.PI*3/4},
    // {name: 'Crouched Sneaking Right reverse.fbx', angle: -Math.PI*3/4},
  ],
};
const animationsAngleArraysMirror = {
  walk: [
    {name: 'left strafe walking reverse.fbx', matchAngle: -Math.PI/2, angle: -Math.PI/2},
    {name: 'right strafe walking reverse.fbx', matchAngle: Math.PI/2, angle: Math.PI/2},
  ],
  run: [
    {name: 'left strafe reverse.fbx', matchAngle: -Math.PI/2, angle: -Math.PI/2},
    {name: 'right strafe reverse.fbx', matchAngle: Math.PI/2, angle: Math.PI/2},
  ],
  crouch: [
    {name: 'Crouched Sneaking Left reverse.fbx', matchAngle: -Math.PI/2, angle: -Math.PI/2},
    {name: 'Crouched Sneaking Right reverse.fbx', matchAngle: Math.PI/2, angle: Math.PI/2},
  ],
};
const animationsIdleArrays = {
  reset: {name: 'reset.fbx'},
  walk: {name: 'idle.fbx'},
  run: {name: 'idle.fbx'},
  crouch: {name: 'Crouch Idle.fbx'},
};

let animations;
let animationStepIndices;
let animationsBaseModel;
let jumpAnimation;
let fallAnimation;
let fallToLandAnimation;
let hardLandingAnimation;
let jumpForwardAnimation;
let jumpForwardOtherAnimation;
let floatAnimation;
let useAnimations;
let aimAnimations;
let sitAnimations;
let danceAnimations;
let throwAnimations;
// let crouchAnimations;
let activateAnimations;
let narutoRunAnimations;
// let jumpAnimationSegments;

let fallLoop;
const loadPromise = (async () => {
  await Promise.resolve(); // wait for metaversefile to be defined
  
  await Promise.all([
    (async () => {
      const res = await fetch('/animations/animations.z');
      const arrayBuffer = await res.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const animationsJson = zbdecode(uint8Array);
      animations = animationsJson.animations
        .map(a => THREE.AnimationClip.parse(a));
      animationStepIndices = animationsJson.animationStepIndices;
      animations.index = {};
      for (const animation of animations) {
        animations.index[animation.name] = animation;
      }

    
    })(),
    (async () => {
      const srcUrl = '/animations/animations-skeleton.glb';
      
      let o;
      try {
        o = await new Promise((accept, reject) => {
          const {gltfLoader} = metaversefile.useLoaders();
          gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
        });
      } catch(err) {
        console.warn(err);
      }
      if (o) {
        animationsBaseModel = o;
      }
    })(),
  ]);

  for (const k in animationsAngleArrays) {
    const as = animationsAngleArrays[k];
    for (const a of as) {
      a.animation = animations.index[a.name];
    }
  }
  for (const k in animationsAngleArraysMirror) {
    const as = animationsAngleArraysMirror[k];
    for (const a of as) {
      a.animation = animations.index[a.name];
    }
  }
  for (const k in animationsIdleArrays) {
    animationsIdleArrays[k].animation = animations.index[animationsIdleArrays[k].name];
  }

  const _normalizeAnimationDurations = (animations, baseAnimation, factor = 1) => {
    for (let i = 1; i < animations.length; i++) {
      const animation = animations[i];
      const oldDuration = animation.duration;
      const newDuration = baseAnimation.duration;
      for (const track of animation.tracks) {
        const {times} = track;
        for (let j = 0; j < times.length; j++) {
          times[j] *= newDuration / oldDuration * factor;
        }
      }
      animation.duration = newDuration * factor;
    }
  };
  const walkingAnimations = [
    `walking.fbx`,
    `left strafe walking.fbx`,
    `right strafe walking.fbx`,
  ].map(name => animations.index[name]);
  _normalizeAnimationDurations(walkingAnimations, walkingAnimations[0]);
  const walkingBackwardAnimations = [
    `walking backwards.fbx`,
    `left strafe walking reverse.fbx`,
    `right strafe walking reverse.fbx`,
  ].map(name => animations.index[name]);
  _normalizeAnimationDurations(walkingBackwardAnimations, walkingBackwardAnimations[0]);
  const runningAnimations = [
    `Fast Run.fbx`,
    `left strafe.fbx`,
    `right strafe.fbx`,
  ].map(name => animations.index[name]);
  _normalizeAnimationDurations(runningAnimations, runningAnimations[0]);
  const runningBackwardAnimations = [
    `running backwards.fbx`,
    `left strafe reverse.fbx`,
    `right strafe reverse.fbx`,
  ].map(name => animations.index[name]);
  _normalizeAnimationDurations(runningBackwardAnimations, runningBackwardAnimations[0]);
  const crouchingForwardAnimations = [
    `Sneaking Forward.fbx`,
    `Crouched Sneaking Left.fbx`,
    `Crouched Sneaking Right.fbx`,
  ].map(name => animations.index[name]);
  _normalizeAnimationDurations(crouchingForwardAnimations, crouchingForwardAnimations[0], 0.5);
  const crouchingBackwardAnimations = [
    `Sneaking Forward reverse.fbx`,
    `Crouched Sneaking Left reverse.fbx`,
    `Crouched Sneaking Right reverse.fbx`,
  ].map(name => animations.index[name]);
  _normalizeAnimationDurations(crouchingBackwardAnimations, crouchingBackwardAnimations[0], 0.5);
  for (const animation of animations) {
    decorateAnimation(animation);
  }

  // chargeJump = animations.find(a => a.isChargeJump);
  // standCharge = animations.find(a => a.isStandCharge);
  fallLoop = animations.find(a => a.isFallLoop);
  // swordSideSlash = animations.find(a => a.isSwordSideSlash);
  // swordTopDownSlash = animations.find(a => a.isSwordTopDownSlash)

  function mergeAnimations(a, b) {
    const o = {};
    for (const k in a) {
      o[k] = a[k];
    }
    for (const k in b) {
      o[k] = b[k];
    }
    return o;
  }

  jumpAnimation = animations.find(a => a.isJump);
  fallAnimation = animations.index["falling_loop.fbx"];
  fallToLandAnimation = animations.index["soft_landing5.fbx"];
  hardLandingAnimation = animations.index["hard_landing.fbx"];
  jumpForwardAnimation = animations.index["jump_forward_r.fbx"];
  jumpForwardOtherAnimation = animations.index["jump_forward_r.fbx"];
  // sittingAnimation = animations.find(a => a.isSitting);
  floatAnimation = animations.find(a => a.isFloat);
  // rifleAnimation = animations.find(a => a.isRifle);
  // hitAnimation = animations.find(a => a.isHit);
  aimAnimations = {
    swordSideIdle: animations.index['sword_idle_side.fbx'],
    swordSideIdleStatic: animations.index['sword_idle_side_static.fbx'],
    swordSideSlash: animations.index['sword_side_slash.fbx'],
    swordSideSlashStep: animations.index['sword_side_slash_step.fbx'],
    swordTopDownSlash: animations.index['sword_topdown_slash.fbx'],
    swordTopDownSlashStep: animations.index['sword_topdown_slash_step.fbx'],
    swordUndraw: animations.index['sword_undraw.fbx'],
  };
  useAnimations = mergeAnimations({
    combo: animations.find(a => a.isCombo),
    slash: animations.find(a => a.isSlash),
    rifle: animations.find(a => a.isRifle),
    pistol: animations.find(a => a.isPistol),
    magic: animations.find(a => a.isMagic),
    eat: animations.find(a => a.isEating),
    drink: animations.find(a => a.isDrinking),
  }, aimAnimations);
  sitAnimations = {
    chair: animations.find(a => a.isSitting),
    saddle: animations.find(a => a.isSitting),
    stand: animations.find(a => a.isSkateboarding),
  };
  danceAnimations = {
    dansu: animations.find(a => a.isDancing),
    powerup: animations.find(a => a.isPowerUp),
  };
  throwAnimations = {
    throw: animations.find(a => a.isThrow),
  };
  /* crouchAnimations = {
    crouch: animations.find(a => a.isCrouch),
  }; */
  activateAnimations = {
    grab_forward: {animation:animations.index['grab_forward.fbx'], speedFactor: 1.2},
    grab_down: {animation:animations.index['grab_down.fbx'], speedFactor: 1.7},
    grab_up: {animation:animations.index['grab_up.fbx'], speedFactor: 1.2},
    grab_left: {animation:animations.index['grab_left.fbx'], speedFactor: 1.2},
    grab_right: {animation:animations.index['grab_right.fbx'], speedFactor: 1.2},
  };
  narutoRunAnimations = {
    narutoRun: animations.find(a => a.isNarutoRun),
  };
  {
    const down10QuaternionArray = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.1)
      .toArray();
    [
      'mixamorigSpine1.quaternion',
      'mixamorigSpine2.quaternion',
    ].forEach(k => {
      narutoRunAnimations.narutoRun.interpolants[k].evaluate = t => down10QuaternionArray;
    });
  }
})().catch(err => {
  console.log('load avatar animations error', err);
});

const _localizeMatrixWorld = bone => {
  bone.matrix.copy(bone.matrixWorld);
  if (bone.parent) {
    bone.matrix.premultiply(bone.parent.matrixWorld.clone().invert());
  }
  bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);

  for (let i = 0; i < bone.children.length; i++) {
    _localizeMatrixWorld(bone.children[i]);
  }
};
const _findBoneDeep = (bones, boneName) => {
  for (let i = 0; i < bones.length; i++) {
    const bone = bones[i];
    if (bone.name === boneName) {
      return bone;
    } else {
      const deepBone = _findBoneDeep(bone.children, boneName);
      if (deepBone) {
        return deepBone;
      }
    }
  }
  return null;
};

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const srcCubeGeometries = {};
const debugMeshMaterial = new THREE.MeshNormalMaterial({
  // color: 0xFF0000,
  transparent: true,
  depthTest: false,
});
const _makeDebugMesh = () => {
  const baseScale = 0.01;
  const fingerScale = 0.5;
  const _makeCubeMesh = (name, scale = 1) => {
    let srcGeometry = srcCubeGeometries[scale];
    if (!srcGeometry) {
      srcGeometry = cubeGeometry.clone()
        .applyMatrix4(localMatrix.makeScale(scale * baseScale, scale * baseScale, 1))
      srcCubeGeometries[scale] = srcGeometry;
    }
    const geometry = srcGeometry//.clone();
    const object = new THREE.Object3D();
    object.name = name;
    object.physicsId = getNextPhysicsId();
    const mesh = new THREE.Mesh(geometry, debugMeshMaterial);
    object.add(mesh);
    object.mesh = mesh;
    return object;
  };
  const attributes = {
    Root: _makeCubeMesh('Root'),
    Head: _makeCubeMesh('Head'),
    Eye_L: _makeCubeMesh('Eye_L'),
    Eye_R: _makeCubeMesh('Eye_R'),
    Neck: _makeCubeMesh('Neck'),
    UpperChest: _makeCubeMesh('UpperChest'),
    Chest: _makeCubeMesh('Chest'),
    Hips: _makeCubeMesh('Hips'),
    Spine: _makeCubeMesh('Spine'),
    Left_shoulder: _makeCubeMesh('Left_shoulder'),
    Left_wrist: _makeCubeMesh('Left_wrist'),
    Left_thumb2: _makeCubeMesh('Left_thumb2', fingerScale),
    Left_thumb1: _makeCubeMesh('Left_thumb1', fingerScale),
    Left_thumb0: _makeCubeMesh('Left_thumb0', fingerScale),
    Left_indexFinger3: _makeCubeMesh('Left_indexFinger3', fingerScale),
    Left_indexFinger2: _makeCubeMesh('Left_indexFinger2', fingerScale),
    Left_indexFinger1: _makeCubeMesh('Left_indexFinger1', fingerScale),
    Left_middleFinger3: _makeCubeMesh('Left_middleFinger3', fingerScale),
    Left_middleFinger2: _makeCubeMesh('Left_middleFinger2', fingerScale),
    Left_middleFinger1: _makeCubeMesh('Left_middleFinger1', fingerScale),
    Left_ringFinger3: _makeCubeMesh('Left_ringFinger3', fingerScale),
    Left_ringFinger2: _makeCubeMesh('Left_ringFinger2', fingerScale),
    Left_ringFinger1: _makeCubeMesh('Left_ringFinger3', fingerScale),
    Left_littleFinger3: _makeCubeMesh('Left_littleFinger3', fingerScale),
    Left_littleFinger2: _makeCubeMesh('Left_littleFinger2', fingerScale),
    Left_littleFinger1: _makeCubeMesh('Left_littleFinger1', fingerScale),
    Left_elbow: _makeCubeMesh('Left_elbow'),
    Left_arm: _makeCubeMesh('Left_arm'),
    Right_shoulder: _makeCubeMesh('Right_shoulder'),
    Right_wrist: _makeCubeMesh('Right_wrist'),
    Right_thumb2: _makeCubeMesh('Right_thumb2', fingerScale),
    Right_thumb1: _makeCubeMesh('Right_thumb1', fingerScale),
    Right_thumb0: _makeCubeMesh('Right_thumb0', fingerScale),
    Right_indexFinger3: _makeCubeMesh('Right_indexFinger3', fingerScale),
    Right_indexFinger2: _makeCubeMesh('Right_indexFinger2', fingerScale),
    Right_indexFinger1: _makeCubeMesh('Right_indexFinger1', fingerScale),
    Right_middleFinger3: _makeCubeMesh('Right_middleFinger3', fingerScale),
    Right_middleFinger2: _makeCubeMesh('Right_middleFinger2', fingerScale),
    Right_middleFinger1: _makeCubeMesh('Right_middleFinger1', fingerScale),
    Right_ringFinger3: _makeCubeMesh('Right_ringFinger3', fingerScale),
    Right_ringFinger2: _makeCubeMesh('Right_ringFinger2', fingerScale),
    Right_ringFinger1: _makeCubeMesh('Right_ringFinger1', fingerScale),
    Right_littleFinger3: _makeCubeMesh('Right_littleFinger3', fingerScale),
    Right_littleFinger2: _makeCubeMesh('Right_littleFinger2', fingerScale),
    Right_littleFinger1: _makeCubeMesh('Right_littleFinger1', fingerScale),
    Right_elbow: _makeCubeMesh('Right_elbow'),
    Right_arm: _makeCubeMesh('Right_arm'),
    Left_ankle: _makeCubeMesh('Left_ankle'),
    Left_knee: _makeCubeMesh('Left_knee'),
    Left_leg: _makeCubeMesh('Left_leg'),
    Left_toe: _makeCubeMesh('Left_toe'),
    Right_ankle: _makeCubeMesh('Right_ankle'),
    Right_knee: _makeCubeMesh('Right_knee'),
    Right_leg: _makeCubeMesh('Right_leg'),
    Right_toe: _makeCubeMesh('Right_toe'),
  };

  // hips
  attributes.Root.add(attributes.Hips);
  attributes.Hips.add(attributes.Spine);
  attributes.Spine.add(attributes.Chest);
  attributes.Chest.add(attributes.UpperChest);

  // head
  attributes.UpperChest.add(attributes.Neck);
  attributes.Neck.add(attributes.Head);
  attributes.Head.add(attributes.Eye_L);
  attributes.Head.add(attributes.Eye_R);

  // shoulders
  attributes.UpperChest.add(attributes.Left_shoulder);
  attributes.UpperChest.add(attributes.Right_shoulder);

  // arms
  attributes.Left_shoulder.add(attributes.Left_arm);
  attributes.Left_arm.add(attributes.Left_elbow);
  attributes.Left_elbow.add(attributes.Left_wrist);
  attributes.Right_shoulder.add(attributes.Right_arm);
  attributes.Right_arm.add(attributes.Right_elbow);
  attributes.Right_elbow.add(attributes.Right_wrist);

  // hands
  attributes.Left_wrist.add(attributes.Left_thumb0);
  attributes.Left_thumb0.add(attributes.Left_thumb1);
  attributes.Left_thumb1.add(attributes.Left_thumb2);
  attributes.Left_wrist.add(attributes.Left_indexFinger1);
  attributes.Left_indexFinger1.add(attributes.Left_indexFinger2);
  attributes.Left_indexFinger2.add(attributes.Left_indexFinger3);
  attributes.Left_wrist.add(attributes.Left_middleFinger1);
  attributes.Left_middleFinger1.add(attributes.Left_middleFinger2);
  attributes.Left_middleFinger2.add(attributes.Left_middleFinger3);
  attributes.Left_wrist.add(attributes.Left_ringFinger1);
  attributes.Left_ringFinger1.add(attributes.Left_ringFinger2);
  attributes.Left_ringFinger2.add(attributes.Left_ringFinger3);
  attributes.Left_wrist.add(attributes.Left_littleFinger1);
  attributes.Left_littleFinger1.add(attributes.Left_littleFinger2);
  attributes.Left_littleFinger2.add(attributes.Left_littleFinger3);

  attributes.Right_wrist.add(attributes.Right_thumb0);
  attributes.Right_thumb0.add(attributes.Right_thumb1);
  attributes.Right_thumb1.add(attributes.Right_thumb2);
  attributes.Right_wrist.add(attributes.Right_indexFinger1);
  attributes.Right_indexFinger1.add(attributes.Right_indexFinger2);
  attributes.Right_indexFinger2.add(attributes.Right_indexFinger3);
  attributes.Right_wrist.add(attributes.Right_middleFinger1);
  attributes.Right_middleFinger1.add(attributes.Right_middleFinger2);
  attributes.Right_middleFinger2.add(attributes.Right_middleFinger3);
  attributes.Right_wrist.add(attributes.Right_ringFinger1);
  attributes.Right_ringFinger1.add(attributes.Right_ringFinger2);
  attributes.Right_ringFinger2.add(attributes.Right_ringFinger3);
  attributes.Right_wrist.add(attributes.Right_littleFinger1);
  attributes.Right_littleFinger1.add(attributes.Right_littleFinger2);
  attributes.Right_littleFinger2.add(attributes.Right_littleFinger3);

  // legs
  attributes.Hips.add(attributes.Left_leg);
  attributes.Left_leg.add(attributes.Left_knee);
  attributes.Left_knee.add(attributes.Left_ankle);
  attributes.Left_ankle.add(attributes.Left_toe);

  attributes.Hips.add(attributes.Right_leg);
  attributes.Right_leg.add(attributes.Right_knee);
  attributes.Right_knee.add(attributes.Right_ankle);
  attributes.Right_ankle.add(attributes.Right_toe);

  const mesh = attributes.Root;
  const modelBoneToMeshBoneMap = new Map();

  mesh.wrapToAvatar = avatar => {
    avatar.modelBoneOutputs.Root.updateMatrixWorld();

    for (const k in avatar.modelBoneOutputs) {
      const modelBone = avatar.modelBoneOutputs[k];
      const meshBone = attributes[k];
      const l = k !== 'Root' ? modelBone.position.length() : 0;
      meshBone.mesh.scale.z = l;
    }

    const modelBoneOutputsArray = Object.keys(avatar.modelBoneOutputs).map(k => avatar.modelBoneOutputs[k]);
    for (const k in avatar.modelBoneOutputs) {
      const modelBone = avatar.modelBoneOutputs[k];
      const meshBone = attributes[k];

      modelBone.forwardQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        localMatrix.lookAt(
          localVector.set(0, 0, 0),
          modelBone.position,
          localVector2.set(0, 1, 0)
        )
      );
      modelBoneToMeshBoneMap.set(modelBone, meshBone);
    }
  };
  mesh.setFromAvatar = avatar => {
    for (const k in avatar.modelBoneOutputs) {
      const modelBone = avatar.modelBoneOutputs[k];
      const meshBone = modelBoneToMeshBoneMap.get(modelBone);

      (modelBone.parent ?
        modelBone.parent.matrixWorld
      :
        localMatrix.identity()
      ).decompose(localVector, localQuaternion, localVector2);

      localVector.add(
        localVector3.set(0, 0, -meshBone.mesh.scale.z*0.5)
          .applyQuaternion(modelBone.forwardQuaternion)
          .applyQuaternion(localQuaternion)
      );

      localQuaternion.multiply(
        modelBone.forwardQuaternion
      );

      meshBone.matrixWorld.compose(localVector, localQuaternion, localVector2);
      meshBone.matrix.copy(meshBone.matrixWorld);
      if (meshBone.parent) {
        meshBone.matrix.premultiply(localMatrix.copy(meshBone.parent.matrixWorld).invert());
      }
      meshBone.matrix.decompose(meshBone.position, meshBone.quaternion, meshBone.scale);
    }
    mesh.updateMatrixWorld();
  };
  mesh.serializeSkeleton = () => {
    const buffers = [];

    const _recurse = meshBone => {
      const idBuffer = Uint32Array.from([meshBone.physicsId]);
      buffers.push(idBuffer);

      const nameBuffer = textEncoder.encode(meshBone.name);
      const nameBufferLengthBuffer = Uint32Array.from([nameBuffer.length]);
      buffers.push(nameBufferLengthBuffer);
      buffers.push(nameBuffer);

      const transformBuffer = new Float32Array(10);
      meshBone.position.toArray(transformBuffer, 0);
      meshBone.quaternion.toArray(transformBuffer, 3);
      meshBone.scale.toArray(transformBuffer, 7);
      buffers.push(transformBuffer);

      const objectChildren = meshBone.children.filter(child => !child.isMesh);
      const numChildrenBuffer = Uint32Array.from([objectChildren.length]);
      buffers.push(numChildrenBuffer);

      for (const child of objectChildren) {
        _recurse(child);
      }
    };
    _recurse(attributes.Root);

    let totalBufferSize = 0;
    for (const buffer of buffers) {
      totalBufferSize += buffer.byteLength;
    }
    const result = new Uint8Array(totalBufferSize);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength), offset);
      offset += buffer.byteLength;
    }
    return result;
  };
  return mesh;
};
const _findArmature = bone => {
  for (;; bone = bone.parent) {
    if (!bone.isBone) {
      return bone;
    }
  }
  return null; // can't happen
};
class AnimationMapping {
  constructor(animationTrackName, boneName, isTop, isPosition) {
    this.animationTrackName = animationTrackName;
    this.boneName = boneName;
    this.isTop = isTop;
    this.isPosition = isPosition;
  }
  clone() {
    return new AnimationMapping(this.animationTrackName, this.boneName, this.isTop, this.isPosition);
  }
}
const _getLerpFn = isPosition => isPosition ? THREE.Vector3.prototype.lerp : THREE.Quaternion.prototype.slerp;
const animationMappingConfig = [
  new AnimationMapping('mixamorigHips.position', 'Hips', false, true),
  new AnimationMapping('mixamorigHips.quaternion', 'Hips', false, false),
  new AnimationMapping('mixamorigSpine.quaternion', 'Spine', true, false),
  new AnimationMapping('mixamorigSpine1.quaternion', 'Chest', true, false),
  new AnimationMapping('mixamorigSpine2.quaternion', 'UpperChest', true, false),
  new AnimationMapping('mixamorigNeck.quaternion', 'Neck', true, false),
  new AnimationMapping('mixamorigHead.quaternion', 'Head', true, false),

  new AnimationMapping('mixamorigLeftShoulder.quaternion', 'Left_shoulder', true, false),
  new AnimationMapping('mixamorigLeftArm.quaternion', 'Left_arm', true, false),
  new AnimationMapping('mixamorigLeftForeArm.quaternion', 'Left_elbow', true, false),
  new AnimationMapping('mixamorigLeftHand.quaternion', 'Left_wrist', true, false),
  new AnimationMapping('mixamorigLeftHandMiddle1.quaternion', 'Left_middleFinger1', true, false),
  new AnimationMapping('mixamorigLeftHandMiddle2.quaternion', 'Left_middleFinger2', true, false),
  new AnimationMapping('mixamorigLeftHandMiddle3.quaternion', 'Left_middleFinger3', true, false),
  new AnimationMapping('mixamorigLeftHandThumb1.quaternion', 'Left_thumb0', true, false),
  new AnimationMapping('mixamorigLeftHandThumb2.quaternion', 'Left_thumb1', true, false),
  new AnimationMapping('mixamorigLeftHandThumb3.quaternion', 'Left_thumb2', true, false),
  new AnimationMapping('mixamorigLeftHandIndex1.quaternion', 'Left_indexFinger1', true, false),
  new AnimationMapping('mixamorigLeftHandIndex2.quaternion', 'Left_indexFinger2', true, false),
  new AnimationMapping('mixamorigLeftHandIndex3.quaternion', 'Left_indexFinger3', true, false),
  new AnimationMapping('mixamorigLeftHandRing1.quaternion', 'Left_ringFinger1', true, false),
  new AnimationMapping('mixamorigLeftHandRing2.quaternion', 'Left_ringFinger2', true, false),
  new AnimationMapping('mixamorigLeftHandRing3.quaternion', 'Left_ringFinger3', true, false),
  new AnimationMapping('mixamorigLeftHandPinky1.quaternion', 'Left_littleFinger1', true, false),
  new AnimationMapping('mixamorigLeftHandPinky2.quaternion', 'Left_littleFinger2', true, false),
  new AnimationMapping('mixamorigLeftHandPinky3.quaternion', 'Left_littleFinger3', true, false),

  new AnimationMapping('mixamorigRightShoulder.quaternion', 'Right_shoulder', true, false),
  new AnimationMapping('mixamorigRightArm.quaternion', 'Right_arm', true, false),
  new AnimationMapping('mixamorigRightForeArm.quaternion', 'Right_elbow', true, false),
  new AnimationMapping('mixamorigRightHand.quaternion', 'Right_wrist', true, false),
  new AnimationMapping('mixamorigRightHandMiddle1.quaternion', 'Right_middleFinger1', true, false),
  new AnimationMapping('mixamorigRightHandMiddle2.quaternion', 'Right_middleFinger2', true, false),
  new AnimationMapping('mixamorigRightHandMiddle3.quaternion', 'Right_middleFinger3', true, false),
  new AnimationMapping('mixamorigRightHandThumb1.quaternion', 'Right_thumb0', true, false),
  new AnimationMapping('mixamorigRightHandThumb2.quaternion', 'Right_thumb1', true, false),
  new AnimationMapping('mixamorigRightHandThumb3.quaternion', 'Right_thumb2', true, false),
  new AnimationMapping('mixamorigRightHandIndex1.quaternion', 'Right_indexFinger1', true, false),
  new AnimationMapping('mixamorigRightHandIndex2.quaternion', 'Right_indexFinger2', true, false),
  new AnimationMapping('mixamorigRightHandIndex3.quaternion', 'Right_indexFinger3', true, false),
  new AnimationMapping('mixamorigRightHandRing1.quaternion', 'Right_ringFinger1', true, false),
  new AnimationMapping('mixamorigRightHandRing2.quaternion', 'Right_ringFinger2', true, false),
  new AnimationMapping('mixamorigRightHandRing3.quaternion', 'Right_ringFinger3', true, false),
  new AnimationMapping('mixamorigRightHandPinky1.quaternion', 'Right_littleFinger1', true, false),
  new AnimationMapping('mixamorigRightHandPinky2.quaternion', 'Right_littleFinger2', true, false),
  new AnimationMapping('mixamorigRightHandPinky3.quaternion', 'Right_littleFinger3', true, false),

  new AnimationMapping('mixamorigRightUpLeg.quaternion', 'Right_leg', false, false),
  new AnimationMapping('mixamorigRightLeg.quaternion', 'Right_knee', false, false),
  new AnimationMapping('mixamorigRightFoot.quaternion', 'Right_ankle', false, false),
  new AnimationMapping('mixamorigRightToeBase.quaternion', 'Right_toe', false, false),

  new AnimationMapping('mixamorigLeftUpLeg.quaternion', 'Left_leg', false, false),
  new AnimationMapping('mixamorigLeftLeg.quaternion', 'Left_knee', false, false),
  new AnimationMapping('mixamorigLeftFoot.quaternion', 'Left_ankle', false, false),
  new AnimationMapping('mixamorigLeftToeBase.quaternion', 'Left_toe', false, false),
];
const _clearXZ = (dst, isPosition) => {
  if (isPosition) {
    dst.x = 0;
    dst.z = 0;
  }
};
class Blinker {
  constructor() {
    this.mode = 'ready';
    this.waitTime = 0;
    this.lastTimestamp = 0;
  }
  update(now) {
    const _setOpen = () => {
      this.mode = 'open';
      this.waitTime = (0.5 + 0.5 * Math.random()) * 3000;
      this.lastTimestamp = now;
    };

    switch (this.mode) {
      case 'ready': {
        _setOpen();
        return 0;
      }
      case 'open': {
        const timeDiff = now - this.lastTimestamp;
        if (timeDiff > this.waitTime) {
          this.mode = 'closing';
          this.waitTime = 100;
          this.lastTimestamp = now;
        }
        return 0;
      }
      case 'closing': {
        const f = Math.min(Math.max((now - this.lastTimestamp) / this.waitTime, 0), 1);
        if (f < 1) {
          return f;
        } else {
          this.mode = 'opening';
          this.waitTime = 100;
          this.lastTimestamp = now;
          return 1;
        }
      }
      case 'opening': {
        const f = Math.min(Math.max((now - this.lastTimestamp) / this.waitTime, 0), 1);
        if (f < 1) {
          return 1 - f;
        } else {
          _setOpen();
          return 0;
        }
      }
    }
  }
}
class Nodder {
  constructor() {

  }
  update() {

  }
}
class Looker {
  constructor(avatar) {
    this.avatar = avatar;

    this.mode = 'ready';
    this.startTarget = new THREE.Vector3();
    this.endTarget = new THREE.Vector3();
    this.waitTime = 0;
    this.lastTimestamp = 0;

    this._target = new THREE.Vector3();
  }
  // returns the world space eye target
  update(now) {
    const _getEndTargetRandom = target => {
      const root = this.avatar.modelBoneOutputs['Root'];
      const eyePosition = getEyePosition(this.avatar.modelBones);
      return target.copy(eyePosition)
        .add(
          localVector.set(0, 0, 1.5 + 3 * Math.random())
            .applyQuaternion(localQuaternion.setFromRotationMatrix(root.matrixWorld))
        )
        .add(
          localVector.set(-0.5+Math.random(), (-0.5+Math.random()) * 0.3, -0.5+Math.random())
            .normalize()
            // .multiplyScalar(1)
        );
    };
    const _getEndTargetForward = target => {
      const root = this.avatar.modelBoneOutputs['Root'];
      const eyePosition = getEyePosition(this.avatar.modelBones);
      return target.copy(eyePosition)
        .add(
          localVector.set(0, 0, 2)
            .applyQuaternion(localQuaternion.setFromRotationMatrix(root.matrixWorld))
        );
    };
    const _startMove = () => {
      this.mode = 'moving';
      // const head = this.avatar.modelBoneOutputs['Head'];
      // const root = this.avatar.modelBoneOutputs['Root'];
      this.startTarget.copy(this.endTarget);
      _getEndTargetRandom(this.endTarget);
      this.waitTime = 100;
      this.lastTimestamp = now;
    };
    const _startDelay = () => {
      this.mode = 'delay';
      this.waitTime = Math.random() * 2000;
      this.lastTimestamp = now;
    };
    const _startWaiting = () => {
      this.mode = 'waiting';
      this.waitTime = Math.random() * 3000;
      this.lastTimestamp = now;
    };
    const _isSpeedTooFast = () => this.avatar.velocity.length() > 0.5;
    const _isPointTooClose = () => {
      const root = this.avatar.modelBoneOutputs['Root'];
      // const head = this.avatar.modelBoneOutputs['Head'];
      localVector.set(0, 0, 1)
        .applyQuaternion(localQuaternion.setFromRotationMatrix(root.matrixWorld));
      localVector2.setFromMatrixPosition(root.matrixWorld);
      localPlane.setFromNormalAndCoplanarPoint(
        localVector,
        localVector2
      );
      const distance = localPlane.distanceToPoint(this.endTarget);
      return distance < 1;
    };

    // console.log('got mode', this.mode, this.waitTime);
    
    if (_isSpeedTooFast()) {
      _getEndTargetForward(this.endTarget);
      // this.startTarget.copy(this.endTarget);
      _startDelay();
      return null;
    } else if (_isPointTooClose()) {
      _getEndTargetForward(this.endTarget);
      // this.startTarget.copy(this.endTarget);
      _startDelay();
      return null;
    } else {
      switch (this.mode) {
        case 'ready': {
          _startMove();
          return this.startTarget;
        }
        case 'delay': {
          const timeDiff = now - this.lastTimestamp;
          if (timeDiff > this.waitTime) {
            _startMove();
            return this.startTarget;
          } else {
            return null;
          }
        }
        case 'moving': {
          const timeDiff = now - this.lastTimestamp;
          const f = Math.min(Math.max(timeDiff / this.waitTime, 0), 1);
          // console.log('got time diff', timeDiff, this.waitTime, f);
          const target = this._target.copy(this.startTarget)
            .lerp(this.endTarget, f);
          // _setTarget(target);

          if (f >= 1) {
            _startWaiting();
          }

          return target;
        }
        case 'waiting': {
          const f = Math.min(Math.max((now - this.lastTimestamp) / this.waitTime, 0), 1);
          if (f >= 1) {
            _startMove();
            return this.startTarget;
          } else {
            return this.endTarget;
          }
        }
      }
    }
  }
}
class Emoter {
  constructor() {
    
  }
  update() {
    
  }
}

class Avatar {
	constructor(object, options = {}) {
    if (!object) {
      object = {};
    }
    if (!object.parser) {
      object.parser = {
        json: {
          extensions: {},
        },
      };
    }
    
    this.object = object;
    const model = (() => {
      let o = object;
      if (o && !o.isMesh) {
        o = o.scene;
      }
      return o;
    })();
    this.previousTime = 0;
    this.move = false;
    this.model = model;
    this.options = options;
    
    this.vrmExtension = object?.parser?.json?.extensions?.VRM;
    this.firstPersonCurves = getFirstPersonCurves(this.vrmExtension);

    const {
      skinnedMeshes,
      skeleton,
      modelBones,
      foundModelBones,
      flipZ,
      flipY,
      flipLeg,
      tailBones,
      armature,
      armatureQuaternion,
      armatureMatrixInverse,
      // retargetedAnimations,
    } = Avatar.bindAvatar(object);
    this.skinnedMeshes = skinnedMeshes;
    this.skeleton = skeleton;
    this.modelBones = modelBones;
    this.foundModelBones = foundModelBones;
    this.flipZ = flipZ;
    this.flipY = flipY;
    this.flipLeg = flipLeg;
    // this.retargetedAnimations = retargetedAnimations;
    this.vowels = Float32Array.from([1, 0, 0, 0, 0]);
    this.poseAnimation = null;

    this.spriteMegaAvatarMesh = null;

    modelBones.Root.traverse(o => {
      o.savedPosition = o.position.clone();
      o.savedMatrixWorld = o.matrixWorld.clone();
    });

		this.poseManager = new PoseManager();
		this.shoulderTransforms = new ShoulderTransforms(this);
		this.legsManager = new LegsManager(this);
    
    const fingerBoneMap = {
      left: [
        {
          bones: [this.poseManager.vrTransforms.leftHand.leftThumb0, this.poseManager.vrTransforms.leftHand.leftThumb1, this.poseManager.vrTransforms.leftHand.leftThumb2],
          finger: 'thumb',
        },
        {
          bones: [this.poseManager.vrTransforms.leftHand.leftIndexFinger1, this.poseManager.vrTransforms.leftHand.leftIndexFinger2, this.poseManager.vrTransforms.leftHand.leftIndexFinger3],
          finger: 'index',
        },
        {
          bones: [this.poseManager.vrTransforms.leftHand.leftMiddleFinger1, this.poseManager.vrTransforms.leftHand.leftMiddleFinger2, this.poseManager.vrTransforms.leftHand.leftMiddleFinger3],
          finger: 'middle',
        },
        {
          bones: [this.poseManager.vrTransforms.leftHand.leftRingFinger1, this.poseManager.vrTransforms.leftHand.leftRingFinger2, this.poseManager.vrTransforms.leftHand.leftRingFinger3],
          finger: 'ring',
        },
        {
          bones: [this.poseManager.vrTransforms.leftHand.leftLittleFinger1, this.poseManager.vrTransforms.leftHand.leftLittleFinger2, this.poseManager.vrTransforms.leftHand.leftLittleFinger3],
          finger: 'little',
        },
      ],
      right: [
        {
          bones: [this.poseManager.vrTransforms.rightHand.rightThumb0, this.poseManager.vrTransforms.rightHand.rightThumb1, this.poseManager.vrTransforms.rightHand.rightThumb2],
          finger: 'thumb',
        },
        {
          bones: [this.poseManager.vrTransforms.rightHand.rightIndexFinger1, this.poseManager.vrTransforms.rightHand.rightIndexFinger2, this.poseManager.vrTransforms.rightHand.rightIndexFinger3],
          finger: 'index',
        },
        {
          bones: [this.poseManager.vrTransforms.rightHand.rightMiddleFinger1, this.poseManager.vrTransforms.rightHand.rightMiddleFinger2, this.poseManager.vrTransforms.rightHand.rightMiddleFinger3],
          finger: 'middle',
        },
        {
          bones: [this.poseManager.vrTransforms.rightHand.rightRingFinger1, this.poseManager.vrTransforms.rightHand.rightRingFinger2, this.poseManager.vrTransforms.rightHand.rightRingFinger3],
          finger: 'ring',
        },
        {
          bones: [this.poseManager.vrTransforms.rightHand.rightLittleFinger1, this.poseManager.vrTransforms.rightHand.rightLittleFinger2, this.poseManager.vrTransforms.rightHand.rightLittleFinger3],
          finger: 'little',
        },
      ],
    };
    this.fingerBoneMap = fingerBoneMap;

    
    this.eyeTarget = new THREE.Vector3();
    this.eyeTargetInverted = false;
    this.eyeTargetEnabled = false;
    this.eyeballTarget = new THREE.Vector3();
    this.eyeballTargetPlane = new THREE.Plane();
    this.eyeballTargetEnabled = false;

    this.springBoneManager = null;
    this.springBoneTimeStep = new FixedTimeStep(timeDiff => {
      const timeDiffS = timeDiff / 1000;
      this.springBoneManager.lateUpdate(timeDiffS);
    }, avatarInterpolationFrameRate);
    let springBoneManagerPromise = null;
    if (options.hair) {
      new Promise((accept, reject) => {

        springBoneManagerPromise = new VRMSpringBoneImporter().import(object)
          .then(springBoneManager => {
            this.springBoneManager = springBoneManager;
          });
      });
    }


    const _getOffset = (bone, parent = bone?.parent) => bone && bone.getWorldPosition(new THREE.Vector3()).sub(parent.getWorldPosition(new THREE.Vector3()));

    this.initializeBonePositions({
      hips: _getOffset(modelBones.Hips),
      spine: _getOffset(modelBones.Spine),
      chest: _getOffset(modelBones.Chest),
      upperChest: _getOffset(modelBones.UpperChest),
      neck: _getOffset(modelBones.Neck),
      head: _getOffset(modelBones.Head),
      // eyes: _getOffset(modelBones.Head), // yes, head
      eyel: _getOffset(modelBones.Eye_L),
      eyer: _getOffset(modelBones.Eye_R),

      leftShoulder: _getOffset(modelBones.Right_shoulder),
      leftUpperArm: _getOffset(modelBones.Right_arm),
      leftLowerArm: _getOffset(modelBones.Right_elbow),
      leftHand: _getOffset(modelBones.Right_wrist),
      leftThumb2: _getOffset(modelBones.Right_thumb2),
      leftThumb1: _getOffset(modelBones.Right_thumb1),
      leftThumb0: _getOffset(modelBones.Right_thumb0),
      leftIndexFinger1: _getOffset(modelBones.Right_indexFinger1),
      leftIndexFinger2: _getOffset(modelBones.Right_indexFinger2),
      leftIndexFinger3: _getOffset(modelBones.Right_indexFinger3),
      leftMiddleFinger1: _getOffset(modelBones.Right_middleFinger1),
      leftMiddleFinger2: _getOffset(modelBones.Right_middleFinger2),
      leftMiddleFinger3: _getOffset(modelBones.Right_middleFinger3),
      leftRingFinger1: _getOffset(modelBones.Right_ringFinger1),
      leftRingFinger2: _getOffset(modelBones.Right_ringFinger2),
      leftRingFinger3: _getOffset(modelBones.Right_ringFinger3),
      leftLittleFinger1: _getOffset(modelBones.Right_littleFinger1),
      leftLittleFinger2: _getOffset(modelBones.Right_littleFinger2),
      leftLittleFinger3: _getOffset(modelBones.Right_littleFinger3),

      rightShoulder: _getOffset(modelBones.Left_shoulder),
      rightUpperArm: _getOffset(modelBones.Left_arm),
      rightLowerArm: _getOffset(modelBones.Left_elbow),
      rightHand: _getOffset(modelBones.Left_wrist),
      rightThumb2: _getOffset(modelBones.Left_thumb2),
      rightThumb1: _getOffset(modelBones.Left_thumb1),
      rightThumb0: _getOffset(modelBones.Left_thumb0),
      rightIndexFinger1: _getOffset(modelBones.Left_indexFinger1),
      rightIndexFinger2: _getOffset(modelBones.Left_indexFinger2),
      rightIndexFinger3: _getOffset(modelBones.Left_indexFinger3),
      rightMiddleFinger1: _getOffset(modelBones.Left_middleFinger1),
      rightMiddleFinger2: _getOffset(modelBones.Left_middleFinger2),
      rightMiddleFinger3: _getOffset(modelBones.Left_middleFinger3),
      rightRingFinger1: _getOffset(modelBones.Left_ringFinger1),
      rightRingFinger2: _getOffset(modelBones.Left_ringFinger2),
      rightRingFinger3: _getOffset(modelBones.Left_ringFinger3),
      rightLittleFinger1: _getOffset(modelBones.Left_littleFinger1),
      rightLittleFinger2: _getOffset(modelBones.Left_littleFinger2),
      rightLittleFinger3: _getOffset(modelBones.Left_littleFinger3),

      leftUpperLeg: _getOffset(modelBones.Right_leg),
      leftLowerLeg: _getOffset(modelBones.Right_knee),
      leftFoot: _getOffset(modelBones.Right_ankle),

      rightUpperLeg: _getOffset(modelBones.Left_leg),
      rightLowerLeg: _getOffset(modelBones.Left_knee),
      rightFoot: _getOffset(modelBones.Left_ankle),
      
      leftToe: _getOffset(modelBones.Left_toe),
      rightToe: _getOffset(modelBones.Right_toe),
    });

    // height is defined as eyes to root
    this.height = getHeight(object);
    this.shoulderWidth = modelBones.Left_arm.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.Right_arm.getWorldPosition(new THREE.Vector3()));
    this.leftArmLength = this.shoulderTransforms.leftArm.armLength;
    this.rightArmLength = this.shoulderTransforms.rightArm.armLength;
    let indexDistance = modelBones.Left_indexFinger1 ? modelBones.Left_indexFinger1.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.Left_wrist.getWorldPosition(new THREE.Vector3())) : 0;
    let handWidth = (modelBones.Left_indexFinger1 && modelBones.Left_littleFinger1)? modelBones.Left_indexFinger1.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.Left_littleFinger1.getWorldPosition(new THREE.Vector3())) : 0;
    this.handOffsetLeft = new THREE.Vector3(handWidth*0.7, -handWidth*0.75, indexDistance*0.5);
    this.handOffsetRight = new THREE.Vector3(-handWidth*0.7, -handWidth*0.75, indexDistance*0.5);
    const eyePosition = getEyePosition(this.modelBones);
    this.eyeToHipsOffset = modelBones.Hips.getWorldPosition(new THREE.Vector3()).sub(eyePosition);

    const _makeInput = () => {
      const result = new THREE.Object3D();
      result.pointer = 0;
      result.grip = 0;
      result.enabled = false;
      return result;
    };
		this.inputs = {
      hmd: _makeInput(),
			leftGamepad: _makeInput(),
			rightGamepad: _makeInput(),
		};
    this.sdkInputs = {
      hmd: this.poseManager.vrTransforms.head,
			leftGamepad: this.poseManager.vrTransforms.leftHand,
			rightGamepad: this.poseManager.vrTransforms.rightHand,
    };
    this.sdkInputs.hmd.scaleFactor = 1;
    this.lastModelScaleFactor = 1;
		
		this.modelBoneOutputs = {
      Root: this.shoulderTransforms.root,

	    Hips: this.shoulderTransforms.hips,
	    Spine: this.shoulderTransforms.spine,
	    Chest: this.shoulderTransforms.chest,
	    UpperChest: this.shoulderTransforms.upperChest,
	    Neck: this.shoulderTransforms.neck,
	    Head: this.shoulderTransforms.head,
      Eye_L: this.shoulderTransforms.eyel,
      Eye_R: this.shoulderTransforms.eyer,

	    Left_shoulder: this.shoulderTransforms.rightShoulderAnchor,
	    Left_arm: this.shoulderTransforms.rightArm.upperArm,
	    Left_elbow: this.shoulderTransforms.rightArm.lowerArm,
	    Left_wrist: this.shoulderTransforms.rightArm.hand,
      Left_thumb0: this.shoulderTransforms.rightArm.thumb0,
      Left_thumb1: this.shoulderTransforms.rightArm.thumb1,
      Left_thumb2: this.shoulderTransforms.rightArm.thumb2,
      Left_indexFinger1: this.shoulderTransforms.rightArm.indexFinger1,
      Left_indexFinger2: this.shoulderTransforms.rightArm.indexFinger2,
      Left_indexFinger3: this.shoulderTransforms.rightArm.indexFinger3,
      Left_middleFinger1: this.shoulderTransforms.rightArm.middleFinger1,
      Left_middleFinger2: this.shoulderTransforms.rightArm.middleFinger2,
      Left_middleFinger3: this.shoulderTransforms.rightArm.middleFinger3,
      Left_ringFinger1: this.shoulderTransforms.rightArm.ringFinger1,
      Left_ringFinger2: this.shoulderTransforms.rightArm.ringFinger2,
      Left_ringFinger3: this.shoulderTransforms.rightArm.ringFinger3,
      Left_littleFinger1: this.shoulderTransforms.rightArm.littleFinger1,
      Left_littleFinger2: this.shoulderTransforms.rightArm.littleFinger2,
      Left_littleFinger3: this.shoulderTransforms.rightArm.littleFinger3,
	    Left_leg: this.legsManager.rightLeg.upperLeg,
	    Left_knee: this.legsManager.rightLeg.lowerLeg,
	    Left_ankle: this.legsManager.rightLeg.foot,

	    Right_shoulder: this.shoulderTransforms.leftShoulderAnchor,
	    Right_arm: this.shoulderTransforms.leftArm.upperArm,
	    Right_elbow: this.shoulderTransforms.leftArm.lowerArm,
	    Right_wrist: this.shoulderTransforms.leftArm.hand,
      Right_thumb0: this.shoulderTransforms.leftArm.thumb0,
      Right_thumb1: this.shoulderTransforms.leftArm.thumb1,
      Right_thumb2: this.shoulderTransforms.leftArm.thumb2,
      Right_indexFinger1: this.shoulderTransforms.leftArm.indexFinger1,
      Right_indexFinger2: this.shoulderTransforms.leftArm.indexFinger2,
      Right_indexFinger3: this.shoulderTransforms.leftArm.indexFinger3,
      Right_middleFinger1: this.shoulderTransforms.leftArm.middleFinger1,
      Right_middleFinger2: this.shoulderTransforms.leftArm.middleFinger2,
      Right_middleFinger3: this.shoulderTransforms.leftArm.middleFinger3,
      Right_ringFinger1: this.shoulderTransforms.leftArm.ringFinger1,
      Right_ringFinger2: this.shoulderTransforms.leftArm.ringFinger2,
      Right_ringFinger3: this.shoulderTransforms.leftArm.ringFinger3,
      Right_littleFinger1: this.shoulderTransforms.leftArm.littleFinger1,
      Right_littleFinger2: this.shoulderTransforms.leftArm.littleFinger2,
      Right_littleFinger3: this.shoulderTransforms.leftArm.littleFinger3,

	    Right_leg: this.legsManager.leftLeg.upperLeg,
	    Right_knee: this.legsManager.leftLeg.lowerLeg,
	    Right_ankle: this.legsManager.leftLeg.foot,
      Left_toe: this.legsManager.leftLeg.toe,
      Right_toe: this.legsManager.rightLeg.toe,
	  };

    this.debugMesh = null;

    this.emotes = [];
    if (this.options.visemes) {
      // ["Neutral", "A", "I", "U", "E", "O", "Blink", "Blink_L", "Blink_R", "Angry", "Fun", "Joy", "Sorrow", "Surprised"]
      const _getBlendShapeIndexForPresetName = presetName => {
        const blendShapes = this.vrmExtension && this.vrmExtension.blendShapeMaster && this.vrmExtension.blendShapeMaster.blendShapeGroups;
        if (Array.isArray(blendShapes)) {
          const shape = blendShapes.find(blendShape => blendShape.presetName === presetName);
          if (shape && shape.binds && shape.binds.length > 0 && typeof shape.binds[0].index === 'number') {
            return shape.binds[0].index;
          } else {
            return -1;
          }
        } else {
          return -1;
        }
      };
      
      this.skinnedMeshesVisemeMappings = this.skinnedMeshes.map(o => {
        const {morphTargetDictionary, morphTargetInfluences} = o;
        if (morphTargetDictionary && morphTargetInfluences) {
          const blinkLeftIndex = _getBlendShapeIndexForPresetName('blink_l');
          const blinkRightIndex = _getBlendShapeIndexForPresetName('blink_r');
          const aIndex = _getBlendShapeIndexForPresetName('a');
          const eIndex = _getBlendShapeIndexForPresetName('e');
          const iIndex = _getBlendShapeIndexForPresetName('i');
          const oIndex = _getBlendShapeIndexForPresetName('o');
          const uIndex = _getBlendShapeIndexForPresetName('u');
          const neutralIndex = _getBlendShapeIndexForPresetName('neutral');
          const angryIndex = _getBlendShapeIndexForPresetName('angry');
          const funIndex = _getBlendShapeIndexForPresetName('fun');
          const joyIndex = _getBlendShapeIndexForPresetName('joy');
          const sorrowIndex = _getBlendShapeIndexForPresetName('sorrow');
          // const surprisedIndex = _getBlendShapeIndexForName('surprised');
          // const extraIndex = _getBlendShapeIndexForName('extra');
          return [
            morphTargetInfluences,
            blinkLeftIndex,
            blinkRightIndex,
            aIndex,
            eIndex,
            iIndex,
            oIndex,
            uIndex,
            neutralIndex,
            angryIndex,
            funIndex,
            joyIndex,
            sorrowIndex,
            // surprisedIndex,
            // extraIndex,
          ];
        } else {
          return null;
        }
      });
    } else {
      this.skinnedMeshesVisemeMappings = [];
    }

    this.microphoneWorker = null;
    this.volume = -1;

    this.shoulderTransforms.Start();
    this.legsManager.Start();

    if (options.top !== undefined) {
      this.setTopEnabled(!!options.top);
    }
    if (options.bottom !== undefined) {
      this.setBottomEnabled(!!options.bottom);
    }

    this.animationMappings = animationMappingConfig.map(animationMapping => {
      animationMapping = animationMapping.clone();
      const isPosition = /\.position$/.test(animationMapping.animationTrackName);
      animationMapping.dst = this.modelBoneOutputs[animationMapping.boneName][isPosition ? 'position' : 'quaternion'];
      animationMapping.lerpFn = _getLerpFn(isPosition);
      return animationMapping;
    });

    this.blinker = new Blinker();
    this.nodder = new Nodder();
    this.looker = new Looker(this);
    this.emoter = new Emoter();

    // shared state
    this.direction = new THREE.Vector3();
    this.jumpState = false;
    this.jumpTime = NaN;
    this.flyState = false;
    this.flyTime = NaN;
    this.useTime = NaN;
    this.useAnimation = null;
    this.sitState = false;
    this.sitAnimation = null;
    // this.activateState = false;
    this.activateTime = 0;
    this.danceState = false;
    this.danceTime = 0;
    this.danceAnimation = null;
    this.throwState = null;
    this.throwTime = 0;
    this.crouchTime = crouchMaxTime;
    this.sitTarget = new THREE.Object3D();
    this.fakeSpeechValue = 0;
    this.fakeSpeechSmoothed = 0;
    this.narutoRunState = false;
    this.chargeJumpState = false;
    this.chargeJumpTime = 0;
    this.narutoRunTime = 0;
    // this.standChargeState = false;
    // this.standChargeTime = 0;
    this.fallLoopState = false;
    this.fallLoopTime = 0;
    // this.swordSideSlashState = false;
    // this.swordSideSlashTime = 0;
    // this.swordTopDownSlashState = false;
    // this.swordTopDownSlashTime = 0;
    this.aimTime = NaN;
    this.aimAnimation = null;
    // this.aimDirection = new THREE.Vector3();
    
    // internal state
    this.lastPosition = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.lastMoveTime = 0;
    this.lastIsBackward = false;
    this.lastBackwardFactor = 0;
    this.backwardAnimationSpec = null;
    this.startEyeTargetQuaternion = new THREE.Quaternion();
    this.lastNeedsEyeTarget = false;
    this.lastEyeTargetTime = -Infinity;
  }
  static bindAvatar(object) {
    const model = object.scene;
    model.updateMatrixWorld(true);
    
    const skinnedMeshes = getSkinnedMeshes(object);
    const skeleton = getSkeleton(object);
    // const boneMap = makeBoneMap(object);
    const tailBones = getTailBones(object);
    const modelBones = getModelBones(object);
    
    
    const foundModelBones = {};
    for (const k in modelBones) {
      const v = modelBones[k];
      if (v) {
        foundModelBones[k] = v;
      }
    }

	  const armature = _findArmature(modelBones.Root);

    // const eyeDirection = getEyePosition(this.modelBones).sub(Head.getWorldPosition(new Vector3()));
    const leftArmDirection = modelBones.Left_wrist.getWorldPosition(new THREE.Vector3())
      .sub(modelBones.Head.getWorldPosition(new THREE.Vector3()));
	  const flipZ = leftArmDirection.x < 0;//eyeDirection.z < 0;
    const armatureDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(armature.quaternion);
    const flipY = armatureDirection.z < -0.5;
    const legDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
      modelBones.Left_leg.getWorldQuaternion(new THREE.Quaternion())
        .premultiply(armature.quaternion.clone().invert())
      );
    const flipLeg = legDirection.y < 0.5;
	  // console.log('flip', flipZ, flipY, flipLeg);
	  /* this.flipZ = flipZ;
	  this.flipY = flipY;
    this.flipLeg = flipLeg; */

    const armatureQuaternion = armature.quaternion.clone();
    const armatureMatrixInverse = armature.matrixWorld.clone().invert();
    armature.position.set(0, 0, 0);
    armature.quaternion.set(0, 0, 0, 1);
    armature.scale.set(1, 1, 1);
    armature.updateMatrix();

    const preRotations = {};
    const _ensurePrerotation = k => {
      const boneName = modelBones[k].name;
      if (!preRotations[boneName]) {
        preRotations[boneName] = new THREE.Quaternion();
      }
      return preRotations[boneName];
    };
    if (flipY) {
      _ensurePrerotation('Hips').premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2));
    }
    if (flipZ) {
      _ensurePrerotation('Hips').premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    }
    if (flipLeg) {
      ['Left_leg', 'Right_leg'].forEach(k => {
        _ensurePrerotation(k).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2));
      });
    }

    const _recurseBoneAttachments = o => {
      for (const child of o.children) {
        if (child.isBone) {
          _recurseBoneAttachments(child);
        } else {
          child.matrix
            .premultiply(localMatrix.compose(localVector.set(0, 0, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), localVector2.set(1, 1, 1)))
            .decompose(child.position, child.quaternion, child.scale);
        }
      }
    };
    _recurseBoneAttachments(modelBones['Hips']);

    const qrArm = flipZ ? modelBones.Left_arm : modelBones.Right_arm;
    const qrElbow = flipZ ? modelBones.Left_elbow : modelBones.Right_elbow;
    const qrWrist = flipZ ? modelBones.Left_wrist : modelBones.Right_wrist;
    const qr = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2)
      .premultiply(
        new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          qrElbow.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse)
            .sub(qrArm.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse))
            .applyQuaternion(armatureQuaternion),
          new THREE.Vector3(0, 1, 0),
        ))
      );
    const qr2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2)
      .premultiply(
        new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          qrWrist.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse)
            .sub(qrElbow.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse))
            .applyQuaternion(armatureQuaternion),
          new THREE.Vector3(0, 1, 0),
        ))
      );
    const qlArm = flipZ ? modelBones.Right_arm : modelBones.Left_arm;
    const qlElbow = flipZ ? modelBones.Right_elbow : modelBones.Left_elbow;
    const qlWrist = flipZ ? modelBones.Right_wrist : modelBones.Left_wrist;
    const ql = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2)
      .premultiply(
        new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          qlElbow.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse)
            .sub(qlArm.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse))
            .applyQuaternion(armatureQuaternion),
          new THREE.Vector3(0, 1, 0),
        ))
      );
    const ql2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2)
      .premultiply(
        new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          qlWrist.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse)
            .sub(qlElbow.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse))
            .applyQuaternion(armatureQuaternion),
          new THREE.Vector3(0, 1, 0),
        ))
      );

    _ensurePrerotation('Right_arm')
      .multiply(qr.clone().invert());
    _ensurePrerotation('Right_elbow')
      .multiply(qr.clone())
      .premultiply(qr2.clone().invert());
    _ensurePrerotation('Left_arm')
      .multiply(ql.clone().invert());
    _ensurePrerotation('Left_elbow')
      .multiply(ql.clone())
      .premultiply(ql2.clone().invert());

    _ensurePrerotation('Left_leg').premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0),  -Math.PI/2));
    _ensurePrerotation('Right_leg').premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0),  -Math.PI/2));

    for (const k in preRotations) {
      preRotations[k].invert();
    }
	  fixSkeletonZForward(armature.children[0], {
	    preRotations,
	  });
	  model.traverse(o => {
	    if (o.isSkinnedMesh) {
	      o.bind((o.skeleton.bones.length === skeleton.bones.length && o.skeleton.bones.every((bone, i) => bone === skeleton.bones[i])) ? skeleton : o.skeleton);
	    }
	  });
    if (flipY) {
      modelBones.Hips.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2));
    }
	  if (!flipZ) {
		} else {
		  modelBones.Hips.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
		}
    modelBones.Right_arm.quaternion.premultiply(qr.clone().invert());
    modelBones.Right_elbow.quaternion
      .premultiply(qr)
      .premultiply(qr2.clone().invert());
    modelBones.Left_arm.quaternion.premultiply(ql.clone().invert());
    modelBones.Left_elbow.quaternion
      .premultiply(ql)
      .premultiply(ql2.clone().invert());
	  model.updateMatrixWorld(true);
    
    modelBones.Root.traverse(bone => {
      bone.initialQuaternion = bone.quaternion.clone();
    });
    
    return {
      skinnedMeshes,
      skeleton,
      modelBones,
      foundModelBones,
      flipZ,
      flipY,
      flipLeg,
      tailBones,
      armature,
      armatureQuaternion,
      armatureMatrixInverse,
      // retargetedAnimations,
    };
  }
  static applyModelBoneOutputs(modelBones, modelBoneOutputs, /*topEnabled,*/ bottomEnabled, lHandEnabled, rHandEnabled) {
    for (const k in modelBones) {
      const modelBone = modelBones[k];
      const modelBoneOutput = modelBoneOutputs[k];

      modelBone.position.copy(modelBoneOutput.position);
      modelBone.quaternion.multiplyQuaternions(
        modelBoneOutput.quaternion,
        modelBone.initialQuaternion
      );

      // if (topEnabled) {
        if (k === 'Left_wrist') {
          if (rHandEnabled) {
            modelBone.quaternion.multiply(leftRotation); // center
          }
        } else if (k === 'Right_wrist') {
          if (lHandEnabled) {
            modelBone.quaternion.multiply(rightRotation); // center
          }
        }
      // }
      if (bottomEnabled) {
        if (k === 'Left_ankle' || k === 'Right_ankle') {
          modelBone.quaternion.multiply(upRotation);
        }
      }
    }
    modelBones.Root.updateMatrixWorld();
  }
  static modelBoneRenames = {
    spine: 'Spine',
    chest: 'Chest',
    upperChest: 'UpperChest',
    neck: 'Neck',
    head: 'Head',

    leftShoulder: 'Right_shoulder',
    leftUpperArm: 'Right_arm',
    leftLowerArm: 'Right_elbow',
    leftHand: 'Right_wrist',
    leftThumb2: 'Right_thumb2',
    leftThumb1: 'Right_thumb1',
    leftThumb0: 'Right_thumb0',
    leftIndexFinger1: 'Right_indexFinger1',
    leftIndexFinger2: 'Right_indexFinger2',
    leftIndexFinger3: 'Right_indexFinger3',
    leftMiddleFinger1: 'Right_middleFinger1',
    leftMiddleFinger2: 'Right_middleFinger2',
    leftMiddleFinger3: 'Right_middleFinger3',
    leftRingFinger1: 'Right_ringFinger1',
    leftRingFinger2: 'Right_ringFinger2',
    leftRingFinger3: 'Right_ringFinger3',
    leftLittleFinger1: 'Right_littleFinger1',
    leftLittleFinger2: 'Right_littleFinger2',
    leftLittleFinger3: 'Right_littleFinger3',

    rightShoulder: 'Left_shoulder',
    rightUpperArm: 'Left_arm',
    rightLowerArm: 'Left_elbow',
    rightHand: 'Left_wrist',
    rightThumb2: 'Left_thumb2',
    rightThumb1: 'Left_thumb1',
    rightThumb0: 'Left_thumb0',
    rightIndexFinger1: 'Left_indexFinger1',
    rightIndexFinger2: 'Left_indexFinger2',
    rightIndexFinger3: 'Left_indexFinger3',
    rightMiddleFinger1: 'Left_middleFinger1',
    rightMiddleFinger2: 'Left_middleFinger2',
    rightMiddleFinger3: 'Left_middleFinger3',
    rightRingFinger1: 'Left_ringFinger1',
    rightRingFinger2: 'Left_ringFinger2',
    rightRingFinger3: 'Left_ringFinger3',
    rightLittleFinger1: 'Left_littleFinger1',
    rightLittleFinger2: 'Left_littleFinger2',
    rightLittleFinger3: 'Left_littleFinger3',

    leftUpperLeg: 'Right_leg',
    leftLowerLeg: 'Right_knee',
    leftFoot: 'Right_ankle',

    rightUpperLeg: 'Left_leg',
    rightLowerLeg: 'Left_knee',
    rightFoot: 'Left_ankle',

    leftToe: 'Left_toe',
    rightToe: 'Right_toe'
  }
  initializeBonePositions(setups) {
    this.shoulderTransforms.hips.position.copy(setups.hips);
    this.shoulderTransforms.spine.position.copy(setups.spine);
    this.shoulderTransforms.chest.position.copy(setups.chest);
    if (setups.upperChest) this.shoulderTransforms.upperChest.position.copy(setups.upperChest);
    this.shoulderTransforms.neck.position.copy(setups.neck);
    this.shoulderTransforms.head.position.copy(setups.head);
    // this.shoulderTransforms.eyes.position.copy(setups.eyes);
    if (setups.eyel) this.shoulderTransforms.eyel.position.copy(setups.eyel);
    if (setups.eyer) this.shoulderTransforms.eyer.position.copy(setups.eyer);

    if (setups.leftShoulder) this.shoulderTransforms.leftShoulderAnchor.position.copy(setups.leftShoulder);
    this.shoulderTransforms.leftArm.upperArm.position.copy(setups.leftUpperArm);
    this.shoulderTransforms.leftArm.lowerArm.position.copy(setups.leftLowerArm);
    this.shoulderTransforms.leftArm.hand.position.copy(setups.leftHand);
    if (setups.leftThumb2) this.shoulderTransforms.leftArm.thumb2.position.copy(setups.leftThumb2);
    if (setups.leftThumb1) this.shoulderTransforms.leftArm.thumb1.position.copy(setups.leftThumb1);
    if (setups.leftThumb0) this.shoulderTransforms.leftArm.thumb0.position.copy(setups.leftThumb0);
    if (setups.leftIndexFinger3) this.shoulderTransforms.leftArm.indexFinger3.position.copy(setups.leftIndexFinger3);
    if (setups.leftIndexFinger2) this.shoulderTransforms.leftArm.indexFinger2.position.copy(setups.leftIndexFinger2);
    if (setups.leftIndexFinger1) this.shoulderTransforms.leftArm.indexFinger1.position.copy(setups.leftIndexFinger1);
    if (setups.leftMiddleFinger3) this.shoulderTransforms.leftArm.middleFinger3.position.copy(setups.leftMiddleFinger3);
    if (setups.leftMiddleFinger2) this.shoulderTransforms.leftArm.middleFinger2.position.copy(setups.leftMiddleFinger2);
    if (setups.leftMiddleFinger1) this.shoulderTransforms.leftArm.middleFinger1.position.copy(setups.leftMiddleFinger1);
    if (setups.leftRingFinger3) this.shoulderTransforms.leftArm.ringFinger3.position.copy(setups.leftRingFinger3);
    if (setups.leftRingFinger2) this.shoulderTransforms.leftArm.ringFinger2.position.copy(setups.leftRingFinger2);
    if (setups.leftRingFinger1) this.shoulderTransforms.leftArm.ringFinger1.position.copy(setups.leftRingFinger1);
    if (setups.leftLittleFinger3) this.shoulderTransforms.leftArm.littleFinger3.position.copy(setups.leftLittleFinger3);
    if (setups.leftLittleFinger2) this.shoulderTransforms.leftArm.littleFinger2.position.copy(setups.leftLittleFinger2);
    if (setups.leftLittleFinger1) this.shoulderTransforms.leftArm.littleFinger1.position.copy(setups.leftLittleFinger1);

    if (setups.rightShoulder) this.shoulderTransforms.rightShoulderAnchor.position.copy(setups.rightShoulder);
    this.shoulderTransforms.rightArm.upperArm.position.copy(setups.rightUpperArm);
    this.shoulderTransforms.rightArm.lowerArm.position.copy(setups.rightLowerArm);
    this.shoulderTransforms.rightArm.hand.position.copy(setups.rightHand);
    if (setups.rightThumb2) this.shoulderTransforms.rightArm.thumb2.position.copy(setups.rightThumb2);
    if (setups.rightThumb1) this.shoulderTransforms.rightArm.thumb1.position.copy(setups.rightThumb1);
    if (setups.rightThumb0) this.shoulderTransforms.rightArm.thumb0.position.copy(setups.rightThumb0);
    if (setups.rightIndexFinger3) this.shoulderTransforms.rightArm.indexFinger3.position.copy(setups.rightIndexFinger3);
    if (setups.rightIndexFinger2) this.shoulderTransforms.rightArm.indexFinger2.position.copy(setups.rightIndexFinger2);
    if (setups.rightIndexFinger1) this.shoulderTransforms.rightArm.indexFinger1.position.copy(setups.rightIndexFinger1);
    if (setups.rightMiddleFinger3) this.shoulderTransforms.rightArm.middleFinger3.position.copy(setups.rightMiddleFinger3);
    if (setups.rightMiddleFinger2) this.shoulderTransforms.rightArm.middleFinger2.position.copy(setups.rightMiddleFinger2);
    if (setups.rightMiddleFinger1) this.shoulderTransforms.rightArm.middleFinger1.position.copy(setups.rightMiddleFinger1);
    if (setups.rightRingFinger3) this.shoulderTransforms.rightArm.ringFinger3.position.copy(setups.rightRingFinger3);
    if (setups.rightRingFinger2) this.shoulderTransforms.rightArm.ringFinger2.position.copy(setups.rightRingFinger2);
    if (setups.rightRingFinger1) this.shoulderTransforms.rightArm.ringFinger1.position.copy(setups.rightRingFinger1);
    if (setups.rightLittleFinger3) this.shoulderTransforms.rightArm.littleFinger3.position.copy(setups.rightLittleFinger3);
    if (setups.rightLittleFinger2) this.shoulderTransforms.rightArm.littleFinger2.position.copy(setups.rightLittleFinger2);
    if (setups.rightLittleFinger1) this.shoulderTransforms.rightArm.littleFinger1.position.copy(setups.rightLittleFinger1);

    this.legsManager.leftLeg.upperLeg.position.copy(setups.leftUpperLeg);
    this.legsManager.leftLeg.lowerLeg.position.copy(setups.leftLowerLeg);
    this.legsManager.leftLeg.foot.position.copy(setups.leftFoot);
    if (setups.leftToe) this.legsManager.leftLeg.toe.position.copy(setups.leftToe);

    this.legsManager.rightLeg.upperLeg.position.copy(setups.rightUpperLeg);
    this.legsManager.rightLeg.lowerLeg.position.copy(setups.rightLowerLeg);
    this.legsManager.rightLeg.foot.position.copy(setups.rightFoot);
    if (setups.rightToe) this.legsManager.rightLeg.toe.position.copy(setups.rightToe);

    this.shoulderTransforms.root.updateMatrixWorld();
  }
  setHandEnabled(i, enabled) {
    this.shoulderTransforms.handsEnabled[i] = enabled;
  }
  getHandEnabled(i) {
    return this.shoulderTransforms.handsEnabled[i];
  }
  setTopEnabled(enabled) {
    this.shoulderTransforms.enabled = enabled;
  }
  getTopEnabled() {
    return this.shoulderTransforms.enabled;
  }
  setBottomEnabled(enabled) {
    this.legsManager.enabled = enabled;
  }
  getBottomEnabled() {
    return this.legsManager.enabled;
  }
  getAngle() {
    localEuler.setFromRotationMatrix(
      localMatrix.lookAt(
        localVector.set(0, 0, 0),
        this.direction,
        localVector2.set(0, 1, 0)
      ),
      'YXZ'
    );
    return localEuler.y;
  }
  async setQuality(quality) {
    switch (quality) {
      case 1: {
        const skinnedMesh = await this.object.cloneVrm();
        this.spriteMegaAvatarMesh = avatarSpriter.createSpriteMegaMesh(skinnedMesh);
        scene.add(this.spriteMegaAvatarMesh);
        this.model.visible = false;
        break;
      }
      case 2: {
        const crunchedModel = avatarCruncher.crunchAvatarModel(this.model);
        crunchedModel.frustumCulled = false;
        scene.add(crunchedModel);
        this.model.visible = false;
        break;
      }
      case 3: {
        console.log('not implemented'); // XXX
        break;
      }
      case 4: {
        console.log('not implemented'); // XXX
        break;
      }
      default: {
        throw new Error('unknown avatar quality: ' + quality);
      }
    }
  }
  update(timestamp, timeDiff) {
    const now = timestamp;
    const timeDiffS = timeDiff / 1000;
    const currentSpeed = localVector.set(this.velocity.x, 0, this.velocity.z).length();
    
    const idleWalkFactor = Math.min(Math.max((currentSpeed - idleFactorSpeed) / (walkFactorSpeed - idleFactorSpeed), 0), 1);
    const walkRunFactor = Math.min(Math.max((currentSpeed - walkFactorSpeed) / (runFactorSpeed - walkFactorSpeed), 0), 1);
    const crouchFactor = Math.min(Math.max(1 - (this.crouchTime / crouchMaxTime), 0), 1);
    // console.log('current speed', currentSpeed, idleWalkFactor, walkRunFactor);

    const _updatePosition = () => {
      const currentPosition = this.inputs.hmd.position;
      const currentQuaternion = this.inputs.hmd.quaternion;
      
      const positionDiff = localVector.copy(this.lastPosition)
        .sub(currentPosition)
        .divideScalar(timeDiffS)
        .multiplyScalar(0.1);
      localEuler.setFromQuaternion(currentQuaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      localEuler.y += Math.PI;
      localEuler2.set(-localEuler.x, -localEuler.y, -localEuler.z, localEuler.order);
      positionDiff.applyEuler(localEuler2);
      this.velocity.copy(positionDiff);
      this.lastPosition.copy(currentPosition);
      this.direction.copy(positionDiff).normalize();

      if (this.velocity.length() > maxIdleVelocity) {
        this.lastMoveTime = now;
        this.move = true;
        this.horizontalMove = Math.abs(this.velocity.x) !== 0 || Math.abs(this.velocity.z) !== 0;
        // console.log('move : ', this.move);
        // console.log('horiz move : ', this.horizontalMove);
      } else {
        this.move = false;
        this.horizontalMove = false;
      }
    };
    _updatePosition();
    
    const _applyAnimation = () => {
      // const runSpeed = 0.5;
      const angle = this.getAngle();
      const timeSeconds = now/1000;

      const _getMirrorAnimationAngles = (animationAngles, key) => {
        const animations = animationAngles.map(({animation}) => animation);
        const animationAngleArrayMirror = animationsAngleArraysMirror[key];
        
        const backwardIndex = animations.findIndex(a => a.isBackward);
        if (backwardIndex !== -1) {

            const sideIndex = backwardIndex === 0 ? 1 : 0;
            const wrongAngle = animationAngles[sideIndex].angle;
            const newAnimationAngle = animationAngleArrayMirror.find(animationAngle => animationAngle.matchAngle === wrongAngle);
            animationAngles = animationAngles.slice();
            animationAngles[sideIndex] = newAnimationAngle;
        }
        // return {
          return animationAngles;
      };
      const _getAngleToBackwardAnimation = animationAngles => {
        const animations = animationAngles.map(({animation}) => animation);
        
        const backwardIndex = animations.findIndex(a => a.isBackward);
        if (backwardIndex !== -1) {
          const backwardAnimationAngle = animationAngles[backwardIndex];
          const angleToBackwardAnimation = Math.abs(angleDifference(angle, backwardAnimationAngle.angle));
          return angleToBackwardAnimation;
        } else {
          return Infinity;
        }
      };
      const _getIdleAnimation = key => animationsIdleArrays[key].animation;
      const _get7wayBlend = (
        horizontalWalkAnimationAngles,
        horizontalWalkAnimationAnglesMirror,
        horizontalRunAnimationAngles,
        horizontalRunAnimationAnglesMirror,
        idleAnimation,
        k,
        lerpFn,
        isPosition,
        target
      ) => {
        // WALK
        // normal horizontal walk blend
        {
          const t1 = timeSeconds % horizontalWalkAnimationAngles[0].animation.duration;
          const src1 = horizontalWalkAnimationAngles[0].animation.interpolants[k];
          const v1 = src1.evaluate(t1);

          const t2 = timeSeconds % horizontalWalkAnimationAngles[1].animation.duration;
          const src2 = horizontalWalkAnimationAngles[1].animation.interpolants[k];
          const v2 = src2.evaluate(t2);
          
          lerpFn
            .call(
              localQuaternion3.fromArray(v2),
              localQuaternion4.fromArray(v1),
              angleFactor
            );
        }
          
        // mirror horizontal blend (backwards walk)
        {
          const t1 = timeSeconds % horizontalWalkAnimationAnglesMirror[0].animation.duration;
          const src1 = horizontalWalkAnimationAnglesMirror[0].animation.interpolants[k];
          const v1 = src1.evaluate(t1);

          const t2 = timeSeconds % horizontalWalkAnimationAnglesMirror[1].animation.duration;
          const src2 = horizontalWalkAnimationAnglesMirror[1].animation.interpolants[k];
          const v2 = src2.evaluate(t2);

          lerpFn
            .call(
              localQuaternion4.fromArray(v2),
              localQuaternion5.fromArray(v1),
              angleFactor
            );
        }

        // blend mirrors together to get a smooth walk
        lerpFn
          .call(
            localQuaternion5.copy(localQuaternion3), // Result is in localQuaternion5
            localQuaternion4,
            mirrorFactor
          );

        // RUN
        // normal horizontal run blend
        {
          const t1 = timeSeconds % horizontalRunAnimationAngles[0].animation.duration;
          const src1 = horizontalRunAnimationAngles[0].animation.interpolants[k];
          const v1 = src1.evaluate(t1);

          const t2 = timeSeconds % horizontalRunAnimationAngles[1].animation.duration;
          const src2 = horizontalRunAnimationAngles[1].animation.interpolants[k];
          const v2 = src2.evaluate(t2);
          
          lerpFn
            .call(
              localQuaternion3.fromArray(v2),
              localQuaternion4.fromArray(v1),
              angleFactor
            );
        }
          
        // mirror horizontal blend (backwards run)
        {
          const t1 = timeSeconds % horizontalRunAnimationAnglesMirror[0].animation.duration;
          const src1 = horizontalRunAnimationAnglesMirror[0].animation.interpolants[k];
          const v1 = src1.evaluate(t1);

          const t2 = timeSeconds % horizontalRunAnimationAnglesMirror[1].animation.duration;
          const src2 = horizontalRunAnimationAnglesMirror[1].animation.interpolants[k];
          const v2 = src2.evaluate(t2);

          lerpFn
            .call(
              localQuaternion4.fromArray(v2),
              localQuaternion6.fromArray(v1),
              angleFactor
            );
        }

        // blend mirrors together to get a smooth run
        lerpFn
          .call(
            localQuaternion6.copy(localQuaternion3), // Result is in localQuaternion6
            localQuaternion4,
            mirrorFactor
          );

        // Blend walk/run
        lerpFn
          .call(
            localQuaternion4.copy(localQuaternion5), // Result is in localQuaternion4
            localQuaternion6,
            walkRunFactor
          );

        // blend the smooth walk/run with idle
        {
          const timeSinceLastMove = now - this.lastMoveTime;
          const timeSinceLastMoveSeconds = timeSinceLastMove / 1000;
          const t3 = timeSinceLastMoveSeconds % idleAnimation.duration;
          const src3 = idleAnimation.interpolants[k];
          const v3 = src3.evaluate(t3);

          target.fromArray(v3);
          if (isPosition) {
            // target.x = 0;
            // target.z = 0;

            localQuaternion4.x = 0;
            localQuaternion4.z = 0;
          }

          lerpFn
            .call(
              target,
              localQuaternion4,
              idleWalkFactor
            );
        }
      };
      
      // stand
      // const key = _getAnimationKey(false);
      const keyWalkAnimationAngles = getClosest2AnimationAngles('walk', angle);
      const keyWalkAnimationAnglesMirror = _getMirrorAnimationAngles(keyWalkAnimationAngles, 'walk');

      const keyRunAnimationAngles = getClosest2AnimationAngles('run', angle);
      const keyRunAnimationAnglesMirror = _getMirrorAnimationAngles(keyRunAnimationAngles, 'run');
      
      const idleAnimation = _getIdleAnimation('walk');

      
      // crouch
      // const keyOther = _getAnimationKey(true);
      const keyAnimationAnglesOther = getClosest2AnimationAngles('crouch', angle);
      const keyAnimationAnglesOtherMirror = _getMirrorAnimationAngles(keyAnimationAnglesOther, 'crouch');
      const idleAnimationOther = _getIdleAnimation('crouch');
      
      const angleToClosestAnimation = Math.abs(angleDifference(angle, keyWalkAnimationAnglesMirror[0].angle));
      const angleBetweenAnimations = Math.abs(angleDifference(keyWalkAnimationAnglesMirror[0].angle, keyWalkAnimationAnglesMirror[1].angle));
      const angleFactor = (angleBetweenAnimations - angleToClosestAnimation) / angleBetweenAnimations;
      const isBackward = _getAngleToBackwardAnimation(keyWalkAnimationAnglesMirror) < Math.PI*0.4;
      if (isBackward !== this.lastIsBackward) {
        this.backwardAnimationSpec = {
          startFactor: this.lastBackwardFactor,
          endFactor: isBackward ? 1 : 0,
          startTime: now,
          endTime: now + 150,
        };
        this.lastIsBackward = isBackward;
      }
      let mirrorFactor;
      if (this.backwardAnimationSpec) {
        const f = (now - this.backwardAnimationSpec.startTime) / (this.backwardAnimationSpec.endTime - this.backwardAnimationSpec.startTime);
        if (f >= 1) {
          mirrorFactor = this.backwardAnimationSpec.endFactor;
          this.backwardAnimationSpec = null;
        } else {
          mirrorFactor = this.backwardAnimationSpec.startFactor +
            Math.pow(
              f,
              0.5
            ) * (this.backwardAnimationSpec.endFactor - this.backwardAnimationSpec.startFactor);
        }
      } else {
        mirrorFactor = isBackward ? 1 : 0;
      }
      this.lastBackwardFactor = mirrorFactor;

      const _getHorizontalBlend = (k, lerpFn, isPosition, target) => {
        _get7wayBlend(
          keyWalkAnimationAngles,
          keyWalkAnimationAnglesMirror,
          keyRunAnimationAngles,
          keyRunAnimationAnglesMirror,
          idleAnimation,
          k,
          lerpFn,
          isPosition,
          localQuaternion
        );
        _get7wayBlend(
          keyAnimationAnglesOther,
          keyAnimationAnglesOtherMirror,
          keyAnimationAnglesOther,
          keyAnimationAnglesOtherMirror,
          idleAnimationOther,
          k,
          lerpFn,
          isPosition,
          localQuaternion2
        );
        // console.log(k);
        lerpFn
          .call(
            target.copy(localQuaternion),
            localQuaternion2,
            crouchFactor
          );

      };
      const _handleDefault = spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          lerpFn,
          isPosition,
        } = spec;
        
        _getHorizontalBlend(k, lerpFn, isPosition, dst);
      };
      const _getApplyFn = () => {
        if(this.previousTime > this.jumpTime && this.jumpTime < 100  && !this.landingState ) {
          console.log('LANDED');
          this.landingState = true;
        }
        if(this.previousTime > 500 && this.jumpTime > this.previousTime && !this.landingState) {
          console.log('About to LAND ');
          this.landingState = true;
          this.previousTime = this.jumpTime;
        } else {
          // console.log('Landing');
        }
        if(!this.jumpState && this.previousTime > 0) {
          //enable landing time
          this.landingTime = 0;
          this.targetTime = this.previousTime;
          this.previousTime = 0;
          this.frameTime = 25;
          console.log('target time is ' + this.targetTime);
        }
        if(this.landingTime < this.targetTime) {
       
          console.log('landing anim plays');
          
          this.landingTime += this.frameTime;
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isPosition
              // isTop,
            } = spec;
            _handleDefault(spec);
            // if(!this.horizontalMove) return;
            let t2;
            let src2;
            // console.log('target time ')
            if(this.targetTime > 1500) {
             
              // let isLowerBone =  k.includes("Foot") || k.includes("Leg") || k.includes("Toe");
              // if(isLowerBone) {
              //   return;
              // }
              src2 = hardLandingAnimation.interpolants[k];

              // console.log(src2);
            } 
            else {

              let areArmsMoving = k.includes("Arm") && this.horizontalMove;
              let isLowerBone = k.includes("Foot");
              let isToe = k.includes("Toe");
              let isLeg = k.includes("Leg") ;
              let isUpLegPos = k.includes("UpLeg");
              let hipRot = k.includes("Hips") && !isPosition;
              let hipPos = k.includes("Hips") && isPosition;
              if( hipPos || hipRot || areArmsMoving || isToe || isLowerBone || isLeg) {
                return;
              }
              src2 = fallToLandAnimation.interpolants[k];
            }   
            
            t2 = this.landingTime/1000 * 0.6;
            if(!src2) return;
            const v2 = src2.evaluate(t2);
            dst.fromArray(v2);
          };
        }
        if (this.jumpState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              // isTop,
            } = spec;
            // _handleDefault(spec);
            let randomLeg = 0;
            // if(this.previousTime === 0 ) {
            //   randomLeg = Math.random();
            //   console.log("new jump! ", randomLeg);
            // }
            // console.log('JumpState', spec)
            this.previousTime = this.jumpTime;
            // this.landingState = false;
            let t2;
            let src2;
            if(this.jumpTime > 1000) {
              // console.log('falling');
              src2 = fallAnimation.interpolants[k];
              t2 = this.jumpTime/1000 * 0.8;
            } else {
              // console.log('jumping');
              if(this.move && !this.horizontalMove) {
                src2 = jumpAnimation.interpolants[k];
                t2 = this.jumpTime/1000 * 0.6 + 0.7;
              } 
              if(this.move && this.horizontalMove) {

                // let isLowerBone = k.includes("Leg") || k.includes("Toe") || k.includes("Foot")
                // if(isLowerBone) {
                //   return;
                // }
                src2 = jumpForwardOtherAnimation.interpolants[k];
                t2 = this.jumpTime/1000 * 0.6;
              }
            }
            if(!src2) return;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.sitState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              // isTop,
            } = spec;
            
            const sitAnimation = sitAnimations[this.sitAnimation || defaultSitAnimation];
            const src2 = sitAnimation.interpolants[k];
            const v2 = src2.evaluate(1);

            dst.fromArray(v2);
          }
        }
        if (this.narutoRunState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              // isTop,
              isPosition,
            } = spec;
            
            const narutoRunAnimation = narutoRunAnimations[defaultNarutoRunAnimation];
            const src2 = narutoRunAnimation.interpolants[k];
            const t2 = (this.narutoRunTime / 1000 * narutoRunTimeFactor) % narutoRunAnimation.duration;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);

            _clearXZ(dst, isPosition);
          };
        }
        if (this.danceTime > 0) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              lerpFn,
              // isTop,
              isPosition,
            } = spec;

            _handleDefault(spec);

            const danceAnimation = danceAnimations[this.danceAnimation || defaultDanceAnimation];
            const src2 = danceAnimation.interpolants[k];
            const t2 = (timestamp/1000) % danceAnimation.duration;
            const v2 = src2.evaluate(t2);

            // console.log('dance time', this.danceTime, t2);
            // dst.fromArray(v2);
            const danceTimeS = this.danceTime/crouchMaxTime;
            const f = Math.min(Math.max(danceTimeS, 0), 1);
            lerpFn
              .call(
                dst,
                localQuaternion.fromArray(v2),
                f
              );

            _clearXZ(dst, isPosition);
          };
        }
        if (this.fallLoopState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              // isTop,
            } = spec;

            const t2 = (this.fallLoopTime/1000) ;
            const src2 = fallLoop.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.throwState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              // isTop,
            } = spec;
            
            const throwAnimation = throwAnimations[this.throwAnimation || defaultThrowAnimation];
            const src2 = throwAnimation.interpolants[k];
            const t2 = this.throwTime/1000;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        // console.log('got aim time', this.useAnimation, this.useTime, this.aimAnimation, this.aimTime);
        if (this.useAnimation) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              // isTop,
              isPosition,
            } = spec;
            
            const isCombo = Array.isArray(this.useAnimation);
            const useAnimationName = isCombo ? this.useAnimation[this.useAnimationIndex] : this.useAnimation;
            const useAnimation = (useAnimationName && useAnimations[useAnimationName]);
            _handleDefault(spec);
            const t2 = (() => {
              if (isCombo) {
                return Math.min(this.useTime/1000, useAnimation.duration);
              } else {
                return (this.useTime/1000) % useAnimation.duration;
              }
            })();
            if (!isPosition) {
              if (useAnimation) {
                const src2 = useAnimation.interpolants[k];
                const v2 = src2.evaluate(t2);

                const idleAnimation = _getIdleAnimation('walk');
                const t3 = 0;
                const src3 = idleAnimation.interpolants[k];
                const v3 = src3.evaluate(t3);

                dst
                  .premultiply(localQuaternion2.fromArray(v3).invert())
                  .premultiply(localQuaternion2.fromArray(v2));
              }
            } else {
              const src2 = useAnimation.interpolants[k];
              const v2 = src2.evaluate(t2);
              localVector2.fromArray(v2);
              _clearXZ(localVector2, isPosition);

              const idleAnimation = _getIdleAnimation('walk');
              const t3 = 0;
              const src3 = idleAnimation.interpolants[k];
              const v3 = src3.evaluate(t3);
              localVector3.fromArray(v3);
              
              dst
                .sub(localVector3)
                .add(localVector2);
            }
          };
        } else if (this.aimAnimation) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              // isTop,
              isPosition,
            } = spec;
            
            const aimAnimation = (this.aimAnimation && aimAnimations[this.aimAnimation]);
            _handleDefault(spec);
            const t2 = (this.aimTime/aimMaxTime) % aimAnimation.duration;
            if (!isPosition) {
              if (aimAnimation) {
                const src2 = aimAnimation.interpolants[k];
                const v2 = src2.evaluate(t2);

                const idleAnimation = _getIdleAnimation('walk');
                const t3 = 0;
                const src3 = idleAnimation.interpolants[k];
                const v3 = src3.evaluate(t3);
                
                dst
                  .premultiply(localQuaternion2.fromArray(v3).invert())
                  .premultiply(localQuaternion2.fromArray(v2));
              }
            } else {
              const src2 = aimAnimation.interpolants[k];
              const v2 = src2.evaluate(t2);

              const idleAnimation = _getIdleAnimation('walk');
              const t3 = 0;
              const src3 = idleAnimation.interpolants[k];
              const v3 = src3.evaluate(t3);

              dst
                .sub(localVector2.fromArray(v3))
                .add(localVector2.fromArray(v2));
            }
          };
        }
        return _handleDefault;
      };
      const applyFn = _getApplyFn();
      const _blendFly = spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          lerpFn,
        } = spec;
        
        if (this.flyState || (this.flyTime >= 0 && this.flyTime < 1000)) {
          const t2 = this.flyTime/1000;
          const f = this.flyState ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));
          const src2 = floatAnimation.interpolants[k];
          const v2 = src2.evaluate(t2 % floatAnimation.duration);

          lerpFn
            .call(
              dst,
              localQuaternion.fromArray(v2),
              f
            );
        }
      };

      const _blendActivateAction = spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          lerpFn,
        } = spec;
        
        if (this.activateTime > 0) {
          
            const localPlayer = metaversefile.useLocalPlayer();

            let defaultAnimation = "grab_forward";

            if (localPlayer.getAction('activate').animationName) {
              defaultAnimation = localPlayer.getAction('activate').animationName;
            }

            const activateAnimation = activateAnimations[defaultAnimation].animation;
            const src2 = activateAnimation.interpolants[k];
            const t2 = ((this.activateTime / 1000) * activateAnimations[defaultAnimation].speedFactor) % activateAnimation.duration;
            const v2 = src2.evaluate(t2);

            const f = this.activateTime > 0 ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));

            lerpFn
              .call(
                dst,
                localQuaternion.fromArray(v2),
                f
              );
        }
      };

      for (const spec of this.animationMappings) {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          isPosition,
        } = spec;

        applyFn(spec);
        _blendFly(spec);
        _blendActivateAction(spec);
        // console.log(spec);
        // ignore all animation position except y
        if (isPosition) {
          if (!this.jumpState) {
            // animations position is height-relative
            dst.y *= this.height + 0.1; // XXX this could be made perfect by measuring from foot to hips instead
            // if(spec.boneName.includes("Hips") && spec.isPosition) {
            //   console.log(dst.y);
            //   const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
            //   dst.y = clamp(dst.y, 0.8, 10);
            // }
          } else {
            // force height in the jump case to overide the animation
            dst.y = this.height * 0.55;
          }
        }
      }
    };
    _applyAnimation();
    
    const _overwritePose = poseName => {
      const poseAnimation = animations.index[poseName];
      for (const spec of this.animationMappings) {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          isPosition,
        } = spec;

        if (!isPosition) {
          const src = poseAnimation.interpolants[k];
          const v = src.evaluate(0);
          dst.fromArray(v);
        }
      }
    };
    if (this.poseAnimation) {
      _overwritePose(this.poseAnimation);
    }

    if (this.getTopEnabled() || this.getHandEnabled(0) || this.getHandEnabled(1)) {
      this.sdkInputs.hmd.position.copy(this.inputs.hmd.position);
      this.sdkInputs.hmd.quaternion.copy(this.inputs.hmd.quaternion);
      this.sdkInputs.leftGamepad.position.copy(this.inputs.leftGamepad.position).add(localVector.copy(this.handOffsetLeft).applyQuaternion(this.inputs.leftGamepad.quaternion));
      this.sdkInputs.leftGamepad.quaternion.copy(this.inputs.leftGamepad.quaternion);
      this.sdkInputs.leftGamepad.pointer = this.inputs.leftGamepad.pointer;
      this.sdkInputs.leftGamepad.grip = this.inputs.leftGamepad.grip;
      this.sdkInputs.rightGamepad.position.copy(this.inputs.rightGamepad.position).add(localVector.copy(this.handOffsetRight).applyQuaternion(this.inputs.rightGamepad.quaternion));
      this.sdkInputs.rightGamepad.quaternion.copy(this.inputs.rightGamepad.quaternion);
      this.sdkInputs.rightGamepad.pointer = this.inputs.rightGamepad.pointer;
      this.sdkInputs.rightGamepad.grip = this.inputs.rightGamepad.grip;

      const modelScaleFactor = this.sdkInputs.hmd.scaleFactor;
      if (modelScaleFactor !== this.lastModelScaleFactor) {
        this.model.scale.set(modelScaleFactor, modelScaleFactor, modelScaleFactor);
        this.lastModelScaleFactor = modelScaleFactor;

        this.springBoneManager && this.springBoneManager.springBoneGroupList.forEach(springBoneGroup => {
          springBoneGroup.forEach(springBone => {
            springBone._worldBoneLength = springBone.bone
              .localToWorld(localVector.copy(springBone._initialLocalChildPosition))
              .sub(springBone._worldPosition)
              .length();
          });
        });
      }
      
      if (this.options.fingers) {
        const _traverse = (o, fn) => {
          fn(o);
          for (const child of o.children) {
            _traverse(child, fn);
          }
        };
        const _processFingerBones = left => {
          const fingerBones = left ? this.fingerBoneMap.left : this.fingerBoneMap.right;
          const gamepadInput = left ? this.sdkInputs.leftGamepad : this.sdkInputs.rightGamepad;
          for (const fingerBone of fingerBones) {
            // if (fingerBone) {
              const {bones, finger} = fingerBone;
              let setter;
              if (finger === 'thumb') {
                setter = (q, i) => q.setFromAxisAngle(localVector.set(0, left ? -1 : 1, 0), gamepadInput.grip * Math.PI*(i === 0 ? 0.125 : 0.25));
              } else if (finger === 'index') {
                setter = (q, i) => q.setFromAxisAngle(localVector.set(0, 0, left ? 1 : -1), gamepadInput.pointer * Math.PI*0.5);
              } else {
                setter = (q, i) => q.setFromAxisAngle(localVector.set(0, 0, left ? 1 : -1), gamepadInput.grip * Math.PI*0.5);
              }
              for (let i = 0; i < bones.length; i++) {
                setter(bones[i].quaternion, i);
              }
            // }
          }
        };
        _processFingerBones(true);
        _processFingerBones(false);
      }
    }
      localEuler.setFromQuaternion(this.inputs.hmd.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      localEuler.y += Math.PI;
      this.modelBoneOutputs.Root.quaternion.setFromEuler(localEuler);
      
      this.modelBoneOutputs.Root.position.copy(this.inputs.hmd.position)
        .sub(localVector.set(0, this.height, 0));

    this.shoulderTransforms.Update();
    this.legsManager.Update();

    const _updateEyeTarget = () => {
      const eyePosition = getEyePosition(this.modelBones);
      const globalQuaternion = localQuaternion2.setFromRotationMatrix(
        this.eyeTargetInverted ?
          localMatrix.lookAt(
            this.eyeTarget,
            eyePosition,
            upVector
          )
        :
          localMatrix.lookAt(
            eyePosition,
            this.eyeTarget,
            upVector
          )
      );
      // this.modelBoneOutputs.Root.updateMatrixWorld();
      this.modelBoneOutputs.Neck.matrixWorld.decompose(localVector, localQuaternion, localVector2);

      const needsEyeTarget = this.eyeTargetEnabled && this.modelBones.Root.quaternion.angleTo(globalQuaternion) < Math.PI*0.4;
      if (needsEyeTarget && !this.lastNeedsEyeTarget) {
        this.startEyeTargetQuaternion.copy(localQuaternion);
        this.lastEyeTargetTime = now;
      } else if (this.lastNeedsEyeTarget && !needsEyeTarget) {
        this.startEyeTargetQuaternion.copy(localQuaternion);
        this.lastEyeTargetTime = now;
      }
      this.lastNeedsEyeTarget = needsEyeTarget;

      const eyeTargetFactor = Math.min(Math.max((now - this.lastEyeTargetTime) / maxEyeTargetTime, 0), 1);
      if (needsEyeTarget) {
        localQuaternion.copy(this.startEyeTargetQuaternion)
          .slerp(globalQuaternion, cubicBezier(eyeTargetFactor));
        this.modelBoneOutputs.Neck.matrixWorld.compose(localVector, localQuaternion, localVector2)
        this.modelBoneOutputs.Neck.matrix.copy(this.modelBoneOutputs.Neck.matrixWorld)
          .premultiply(localMatrix2.copy(this.modelBoneOutputs.Neck.parent.matrixWorld).invert())
          .decompose(this.modelBoneOutputs.Neck.position, this.modelBoneOutputs.Neck.quaternion, localVector2);
      } else {
        if (eyeTargetFactor < 1) {
          localQuaternion2.copy(this.startEyeTargetQuaternion)
            .slerp(localQuaternion, cubicBezier(eyeTargetFactor));
          localMatrix.compose(localVector.set(0, 0, 0), localQuaternion2, localVector2.set(1, 1, 1))
            .premultiply(localMatrix2.copy(this.modelBoneOutputs.Neck.parent.matrixWorld).invert())
            .decompose(localVector, localQuaternion, localVector2);
        }
      }
    };
    _updateEyeTarget();

    const _updateEyeballTarget = () => {
      const leftEye = this.modelBoneOutputs['Eye_L'];
      const rightEye = this.modelBoneOutputs['Eye_R'];

      const lookerEyeballTarget = this.looker.update(now);
      const eyeballTarget = this.eyeballTargetEnabled ? this.eyeballTarget : lookerEyeballTarget;

      if (eyeballTarget && this.firstPersonCurves) {
        const {
          lookAtHorizontalInnerCurve,
          lookAtHorizontalOuterCurve,
          lookAtVerticalDownCurve,
          lookAtVerticalUpCurve,
        } = this.firstPersonCurves;

        function calculateTargetEuler(target, position) {
          const headPosition = eyePosition;

          // Look at direction in world coordinate
          const lookAtDir = localVector2.copy(headPosition).sub(position).normalize();
      
          // Transform the direction into local coordinate from the first person bone
          lookAtDir.applyQuaternion(
            localQuaternion.setFromRotationMatrix(head.matrixWorld)
              .invert()
          );
      
          // convert the direction into euler
          target.x = Math.atan2(lookAtDir.y, Math.sqrt(lookAtDir.x * lookAtDir.x + lookAtDir.z * lookAtDir.z));
          target.y = Math.atan2(-lookAtDir.x, -lookAtDir.z);
          target.z = 0;
          target.order = 'YXZ';
        }
        function lookAtEuler(euler) {
          const srcX = euler.x;
          const srcY = euler.y;
      
          const rotationFactor = Math.PI;
          const rotationRange = Math.PI*0.1;

          if (leftEye) {
            if (srcX < 0.0) {
              localEuler2.x = -lookAtVerticalDownCurve.map(-srcX);
            } else {
              localEuler2.x = lookAtVerticalUpCurve.map(srcX);
            }
      
            if (srcY < 0.0) {
              localEuler2.y = -lookAtHorizontalInnerCurve.map(-srcY);
            } else {
              localEuler2.y = lookAtHorizontalOuterCurve.map(srcY);
            }
            localEuler2.x *= rotationFactor;
            localEuler2.y *= rotationFactor;
            localEuler2.y = Math.min(Math.max(localEuler2.y, -rotationRange), rotationRange);

            localEuler2.z = 0;
            localEuler2.order = 'YXZ';
      
            leftEye.quaternion.setFromEuler(localEuler2);
            leftEye.updateMatrix();
          }
      
          if (rightEye) {
            if (srcX < 0.0) {
              localEuler2.x = -lookAtVerticalDownCurve.map(-srcX);
            } else {
              localEuler2.x = lookAtVerticalUpCurve.map(srcX);
            }
      
            if (srcY < 0.0) {
              localEuler2.y = -lookAtHorizontalOuterCurve.map(-srcY);
            } else {
              localEuler2.y = lookAtHorizontalInnerCurve.map(srcY);
            }
            localEuler2.x *= rotationFactor;
            localEuler2.y *= rotationFactor;
            localEuler2.y = Math.min(Math.max(localEuler2.y, -rotationRange), rotationRange);

            localEuler2.z = 0;
            localEuler2.order = 'YXZ';
      
            rightEye.quaternion.setFromEuler(localEuler2);
            rightEye.updateMatrix();
          }
        }
        function lookAt(position) {
          calculateTargetEuler(localEuler, position);
          lookAtEuler(localEuler);
        }

        const head = this.modelBoneOutputs.Head;
        const eyePosition = getEyePosition(this.modelBones);
        lookAt(eyeballTarget);
      } else {
        if (leftEye) {
          leftEye.quaternion.identity();
          leftEye.updateMatrix();
        }
        if (rightEye) {
          rightEye.quaternion.identity();
          rightEye.updateMatrix();
        }
      }
    };
    _updateEyeballTarget();

    this.modelBoneOutputs.Root.updateMatrixWorld();
    
    Avatar.applyModelBoneOutputs(
      this.foundModelBones,
      this.modelBoneOutputs,
      // this.getTopEnabled(),
      this.getBottomEnabled(),
      this.getHandEnabled(0),
      this.getHandEnabled(1),
    );
    // this.modelBones.Root.updateMatrixWorld();

    if (this.springBoneManager) {
      this.springBoneTimeStep.update(timeDiff);
    }

    // XXX hook these up
    this.nodder.update(now);
    this.emoter.update(now);

    const _updateVisemes = () => {
      const volumeValue = this.volume !== -1 ? Math.min(this.volume * 12, 1) : -1;
      // console.log('got volume value', this.volume, volumeValue);
      const blinkValue = this.blinker.update(now);
      for (const visemeMapping of this.skinnedMeshesVisemeMappings) {
        if (visemeMapping) {
          const [
            morphTargetInfluences,
            blinkLeftIndex,
            blinkRightIndex,
            aIndex,
            eIndex,
            iIndex,
            oIndex,
            uIndex,
            neutralIndex,
            angryIndex,
            funIndex,
            joyIndex,
            sorrowIndex,
            // surprisedIndex,
            // extraIndex,
          ] = visemeMapping;
          
          // reset
          for (let i = 0; i < morphTargetInfluences.length; i++) {
            morphTargetInfluences[i] = 0;
          }
          
          if (volumeValue !== -1) { // real speech
            if (aIndex !== -1) {
              morphTargetInfluences[aIndex] = volumeValue;
            }
            if (eIndex !== -1) {
              morphTargetInfluences[eIndex] = volumeValue * this.vowels[1];
            }
            if (iIndex !== -1) {
              morphTargetInfluences[iIndex] = volumeValue * this.vowels[2];
            }
            if (oIndex !== -1) {
              morphTargetInfluences[oIndex] = volumeValue * this.vowels[3];
            }
            if (uIndex !== -1) {
              morphTargetInfluences[uIndex] = volumeValue * this.vowels[4];
            }
          } else { // fake speech
            this.fakeSpeechSmoothed = this.fakeSpeechSmoothed * 0.99 + 0.01 * this.fakeSpeechValue;
            const now2 = now / 1000 * 2;
            let aValue = (simplexes[0].noise2D(now2, now2));
            let eValue = (simplexes[1].noise2D(now2, now2));
            let iValue = (simplexes[2].noise2D(now2, now2));
            let oValue = (simplexes[3].noise2D(now2, now2));
            let uValue = (simplexes[4].noise2D(now2, now2));
            let totalValue = 1.5; // (Math.abs(aValue) + Math.abs(eValue) + Math.abs(iValue) + Math.abs(oValue) + Math.abs(uValue));
            if (aIndex !== -1) {
              morphTargetInfluences[aIndex] = this.fakeSpeechSmoothed * aValue/totalValue;
            }
            if (eIndex !== -1) {
              morphTargetInfluences[eIndex] = this.fakeSpeechSmoothed * eValue/totalValue;
            }
            if (iIndex !== -1) {
              morphTargetInfluences[iIndex] = this.fakeSpeechSmoothed * iValue/totalValue;
            }
            if (oIndex !== -1) {
              morphTargetInfluences[oIndex] = this.fakeSpeechSmoothed * oValue/totalValue;
            }
            if (uIndex !== -1) {
              morphTargetInfluences[uIndex] = this.fakeSpeechSmoothed * uValue/totalValue;
            }
          }
            
          // emotes
          if (this.emotes.length > 0) {
            for (const emote of this.emotes) {
              if (emote.index >= 0 && emote.index < morphTargetInfluences.length) {
                morphTargetInfluences[emote.index] = emote.value;
              } else {
                let index = -1;
                switch (emote.emotion) {
                  case 'neutral': {
                    index = neutralIndex;
                    break;
                  }
                  case 'angry': {
                    index = angryIndex;
                    break;
                  }
                  case 'fun': {
                    index = funIndex;
                    break;
                  }
                  case 'joy': {
                    index = joyIndex;
                    break;
                  }
                  case 'sorrow': {
                    index = sorrowIndex;
                    break;
                  }
                }
                if (index !== -1) {
                  morphTargetInfluences[index] = emote.value;
                }
              }
            }
          }

          // blink
          if (blinkLeftIndex !== -1) {
            morphTargetInfluences[blinkLeftIndex] = blinkValue;
          }
          if (blinkRightIndex !== -1) {
            morphTargetInfluences[blinkRightIndex] = blinkValue;
          }
        }
      }
    };
    this.options.visemes && _updateVisemes();

    const _updateSubAvatars = () => {
      if (this.spriteMegaAvatarMesh) {
        this.spriteMegaAvatarMesh.update(timestamp, timeDiff, {
          playerAvatar: this,
          camera,
        });
      }
    };
    _updateSubAvatars();

    if (game.debugMode && !this.debugMesh) {
      this.debugMesh = _makeDebugMesh();
      this.debugMesh.wrapToAvatar(this);
      this.model.add(this.debugMesh);
    }
    if (this.debugMesh) {
      game.debugMode && this.debugMesh.setFromAvatar(this);
      this.debugMesh.visible = game.debugMode;
    }
	}

  isAudioEnabled() {
    return !!this.microphoneWorker;
  }
  setAudioEnabled(enabled) {
    // cleanup
    if (this.microphoneWorker) {
      this.microphoneWorker.close();
      this.microphoneWorker = null;
    }
    if (this.audioRecognizer) {
      this.audioRecognizer.destroy();
      this.audioRecognizer = null;
    }

    // setup
    if (enabled) {
      this.volume = 0;
     
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        (async () => {
          await audioContext.resume();
        })();
      }
      this.microphoneWorker = new MicrophoneWorker({
        audioContext,
        muted: false,
        emitVolume: true,
        emitBuffer: true,
      });
      this.microphoneWorker.addEventListener('volume', e => {
        this.volume = this.volume*0.8 + e.data*0.2;
      });
      this.microphoneWorker.addEventListener('buffer', e => {
        this.audioRecognizer.send(e.data);
      });

      this.audioRecognizer = new AudioRecognizer({
        sampleRate: audioContext.sampleRate,
      });
      this.audioRecognizer.addEventListener('result', e => {
        this.vowels.set(e.data);
      });
    } else {
      this.volume = -1;
    }
  }
  getAudioInput() {
    return this.microphoneWorker && this.microphoneWorker.getInput();
  }
  decapitate() {
    if (!this.decapitated) {
      this.modelBones.Head.traverse(o => {
        if (o.savedPosition) { // three-vrm adds vrmColliderSphere which will not be saved
          o.savedPosition.copy(o.position);
          o.savedMatrixWorld.copy(o.matrixWorld);
          o.position.set(NaN, NaN, NaN);
          o.matrixWorld.set(NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN);
        }
      });
      this.decapitated = true;
    }
  }
  undecapitate() {
    if (this.decapitated) {
      this.modelBones.Head.traverse(o => {
        if (o.savedPosition) {
          o.position.copy(o.savedPosition);
          o.matrixWorld.copy(o.savedMatrixWorld);
        }
      });
      this.decapitated = false;
    }
  }

  setFloorHeight(floorHeight) {
    this.poseManager.vrTransforms.floorHeight = floorHeight;
  }

  getFloorHeight() {
    return this.poseManager.vrTransforms.floorHeight;
  }

  destroy() {
    this.setAudioEnabled(false);
  }
}
Avatar.waitForLoad = () => loadPromise;
Avatar.getAnimations = () => animations;
Avatar.getAnimationStepIndices = () => animationStepIndices;
Avatar.getAnimationMappingConfig = () => animationMappingConfig;
let avatarAudioContext = null;
const getAudioContext = () => {
  if (!avatarAudioContext) {
    console.warn('using default audio context; setAudioContext was not called');
    setAudioContext(new AudioContext());
  }
  return avatarAudioContext;
};
Avatar.getAudioContext = getAudioContext;
const setAudioContext = newAvatarAudioContext => {
  avatarAudioContext = newAvatarAudioContext;
};
Avatar.setAudioContext = setAudioContext;
Avatar.getClosest2AnimationAngles = getClosest2AnimationAngles;
export default Avatar;
