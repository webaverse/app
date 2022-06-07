import {Vector3, Quaternion, AnimationClip, LoopOnce, MathUtils} from 'three';
import metaversefile from 'metaversefile';
import {/* VRMSpringBoneImporter, VRMLookAtApplyer, */ VRMCurveMapper} from '@pixiv/three-vrm/lib/three-vrm.module.js';
// import easing from '../easing.js';
import {easing} from '../math-utils.js';
import loaders from '../loaders.js';
import {zbdecode} from 'zjs/encoding.mjs';
import {AnimMixer} from './AnimMixer.js';

import {
//   getSkinnedMeshes,
//   getSkeleton,
//   getEyePosition,
//   getHeight,
  // makeBoneMap,
//   getTailBones,
//   getModelBones,
  // cloneModelBones,
  decorateAnimation,
  // retargetAnimation,
  // animationBoneToModelBone,
} from './util.mjs';

import {
  angleDifference,
  // getVelocityDampingFactor,
  // getNextPhysicsId,
} from '../util.js';

import {
  // idleFactorSpeed,
  // walkFactorSpeed,
  // runFactorSpeed,
  narutoRunTimeFactor,
} from './constants.js';

import {
  crouchMaxTime,
  // useMaxTime,
  aimMaxTime,
  // avatarInterpolationFrameRate,
  // avatarInterpolationTimeDelay,
  // avatarInterpolationNumFrames,
} from '../constants.js';
import {AnimNode} from './AnimNode.js';
import {AnimNodeBlend2} from './AnimNodeBlend2.js';
import {AnimNodeBlendList} from './AnimNodeBlendList.js';

const localVector = new Vector3();
const localVector2 = new Vector3();
const localVector3 = new Vector3();

const localQuaternion = new Quaternion();
const localQuaternion2 = new Quaternion();
const localQuaternion3 = new Quaternion();
const localQuaternion4 = new Quaternion();
const localQuaternion5 = new Quaternion();
const localQuaternion6 = new Quaternion();

let animations;
let animationStepIndices;
// let animationsBaseModel;
let jumpAnimation;
let floatAnimation;
let useAnimations;
let aimAnimations;
let sitAnimations;
let danceAnimations;
let emoteAnimations;
let pickUpAnimations;
// let throwAnimations;
// let crouchAnimations;
let activateAnimations;
let narutoRunAnimations;
// let jumpAnimationSegments;
// let chargeJump;
// let standCharge;
// let fallLoop;
// let swordSideSlash;
// let swordTopDownSlash;
let hurtAnimations;
let holdAnimations;

const defaultSitAnimation = 'chair';
// const defaultUseAnimation = 'combo';
const defaultDanceAnimation = 'dansu';
const defaultEmoteAnimation = 'angry';
// const defaultThrowAnimation = 'throw';
// const defaultCrouchAnimation = 'crouch';
// const defaultActivateAnimation = 'activate';
const defaultNarutoRunAnimation = 'narutoRun';
// const defaultchargeJumpAnimation = 'chargeJump';
// const defaultStandChargeAnimation = 'standCharge';
// const defaultHurtAnimation = 'pain_back';

const animationsAngleArrays = {
  walk: [
    {name: 'left strafe walking.fbx', angle: Math.PI / 2},
    {name: 'right strafe walking.fbx', angle: -Math.PI / 2},

    {name: 'walking.fbx', angle: 0},
    {name: 'walking backwards.fbx', angle: Math.PI},

    // {name: 'left strafe walking reverse.fbx', angle: Math.PI*3/4},
    // {name: 'right strafe walking reverse.fbx', angle: -Math.PI*3/4},
  ],
  run: [
    {name: 'left strafe.fbx', angle: Math.PI / 2},
    {name: 'right strafe.fbx', angle: -Math.PI / 2},

    {name: 'Fast Run.fbx', angle: 0},
    {name: 'running backwards.fbx', angle: Math.PI},

    // {name: 'left strafe reverse.fbx', angle: Math.PI*3/4},
    // {name: 'right strafe reverse.fbx', angle: -Math.PI*3/4},
  ],
  crouch: [
    {name: 'Crouched Sneaking Left.fbx', angle: Math.PI / 2},
    {name: 'Crouched Sneaking Right.fbx', angle: -Math.PI / 2},

    {name: 'Sneaking Forward.fbx', angle: 0},
    {name: 'Sneaking Forward reverse.fbx', angle: Math.PI},

    // {name: 'Crouched Sneaking Left reverse.fbx', angle: Math.PI*3/4},
    // {name: 'Crouched Sneaking Right reverse.fbx', angle: -Math.PI*3/4},
  ],
};
const animationsAngleArraysMirror = {
  walk: [
    {name: 'left strafe walking reverse.fbx', matchAngle: -Math.PI / 2, angle: -Math.PI / 2},
    {name: 'right strafe walking reverse.fbx', matchAngle: Math.PI / 2, angle: Math.PI / 2},
  ],
  run: [
    {name: 'left strafe reverse.fbx', matchAngle: -Math.PI / 2, angle: -Math.PI / 2},
    {name: 'right strafe reverse.fbx', matchAngle: Math.PI / 2, angle: Math.PI / 2},
  ],
  crouch: [
    {name: 'Crouched Sneaking Left reverse.fbx', matchAngle: -Math.PI / 2, angle: -Math.PI / 2},
    {name: 'Crouched Sneaking Right reverse.fbx', matchAngle: Math.PI / 2, angle: Math.PI / 2},
  ],
};
const animationsIdleArrays = {
  reset: {name: 'reset.fbx'},
  walk: {name: 'idle.fbx'},
  run: {name: 'idle.fbx'},
  crouch: {name: 'Crouch Idle.fbx'},
};

const cubicBezier = easing(0, 1, 0, 1);

const _clearXZ = (dst, isPosition) => {
  if (isPosition) {
    dst.x = 0;
    dst.z = 0;
  }
};

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

async function loadAnimations() {
  const res = await fetch('/animations/animations.z');
  const arrayBuffer = await res.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const animationsJson = zbdecode(uint8Array);
  animations = animationsJson.animations
    .map(a => AnimationClip.parse(a));
  animationStepIndices = animationsJson.animationStepIndices;
  animations.index = {};
  for (const animation of animations) {
    animations.index[animation.name] = animation;
  }
  window.animations = animations;

  /* const animationIndices = animationStepIndices.find(i => i.name === 'Fast Run.fbx');
          for (let i = 0; i < animationIndices.leftFootYDeltas.length; i++) {
            const mesh = new Mesh(new BoxBufferGeometry(0.02, 0.02, 0.02), new MeshBasicMaterial({color: 0xff0000}));
            mesh.position.set(-30 + i * 0.1, 10 + animationIndices.leftFootYDeltas[i] * 10, -15);
            mesh.updateMatrixWorld();
            scene.add(mesh);
          }
          for (let i = 0; i < animationIndices.rightFootYDeltas.length; i++) {
            const mesh = new Mesh(new BoxBufferGeometry(0.02, 0.02, 0.02), new MeshBasicMaterial({color: 0x0000ff}));
            mesh.position.set(-30 + i * 0.1, 10 + animationIndices.rightFootYDeltas[i] * 10, -15);
            mesh.updateMatrixWorld();
            scene.add(mesh);
          } */
}

async function loadSkeleton() {
  const srcUrl = '/animations/animations-skeleton.glb';

  let o;
  try {
    o = await new Promise((resolve, reject) => {
      const {gltfLoader} = loaders;
      gltfLoader.load(srcUrl, () => {
        resolve();
      }, function onprogress() { }, reject);
    });
  } catch (err) {
    console.warn(err);
  }
  if (o) {
    // animationsBaseModel = o;
  }
}

export const loadPromise = (async () => {
  await Promise.resolve(); // wait for metaversefile to be defined

  await Promise.all([
    loadAnimations(),
    loadSkeleton(),
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

  const walkingAnimations = [
    'walking.fbx',
    'left strafe walking.fbx',
    'right strafe walking.fbx',
  ].map(name => animations.index[name]);
  const walkingBackwardAnimations = [
    'walking backwards.fbx',
    'left strafe walking reverse.fbx',
    'right strafe walking reverse.fbx',
  ].map(name => animations.index[name]);
  const runningAnimations = [
    'Fast Run.fbx',
    'left strafe.fbx',
    'right strafe.fbx',
  ].map(name => animations.index[name]);
  const runningBackwardAnimations = [
    'running backwards.fbx',
    'left strafe reverse.fbx',
    'right strafe reverse.fbx',
  ].map(name => animations.index[name]);
  const crouchingForwardAnimations = [
    'Sneaking Forward.fbx',
    'Crouched Sneaking Left.fbx',
    'Crouched Sneaking Right.fbx',
  ].map(name => animations.index[name]);
  const crouchingBackwardAnimations = [
    'Sneaking Forward reverse.fbx',
    'Crouched Sneaking Left reverse.fbx',
    'Crouched Sneaking Right reverse.fbx',
  ].map(name => animations.index[name]);
  for (const animation of animations) {
    decorateAnimation(animation);
  }

  _normalizeAnimationDurations(walkingAnimations, walkingAnimations[0]);
  _normalizeAnimationDurations(walkingBackwardAnimations, walkingBackwardAnimations[0]);
  _normalizeAnimationDurations(runningAnimations, runningAnimations[0]);
  _normalizeAnimationDurations(runningBackwardAnimations, runningBackwardAnimations[0]);
  _normalizeAnimationDurations(crouchingForwardAnimations, crouchingForwardAnimations[0], 0.5);
  _normalizeAnimationDurations(crouchingBackwardAnimations, crouchingBackwardAnimations[0], 0.5);

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
  /* jumpAnimationSegments = {
      chargeJump: animations.find(a => a.isChargeJump),
      chargeJumpFall: animations.find(a => a.isChargeJumpFall),
      isFallLoop: animations.find(a => a.isFallLoop),
      isLanding: animations.find(a => a.isLanding)
    }; */

  // chargeJump = animations.find(a => a.isChargeJump);
  // standCharge = animations.find(a => a.isStandCharge);
  // fallLoop = animations.find(a => a.isFallLoop);
  // swordSideSlash = animations.find(a => a.isSwordSideSlash);
  // swordTopDownSlash = animations.find(a => a.isSwordTopDownSlash)

  jumpAnimation = animations.find(a => a.isJump);
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
    throw: animations.find(a => a.isThrow),
    pickUpThrow: animations.find(a => a.isPickUpThrow),
    bowDraw: animations.find(a => a.isBowDraw),
    bowIdle: animations.find(a => a.isBowIdle),
    bowLoose: animations.find(a => a.isBowLoose),
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
  emoteAnimations = {
    alert: animations.find(a => a.isAlert),
    alertSoft: animations.find(a => a.isAlertSoft),
    angry: animations.find(a => a.isAngry),
    angrySoft: animations.find(a => a.isAngrySoft),
    embarrassed: animations.find(a => a.isEmbarrassed),
    embarrassedSoft: animations.find(a => a.isEmbarrassedSoft),
    headNod: animations.find(a => a.isHeadNod),
    headNodSoft: animations.find(a => a.isHeadNodSingle),
    headShake: animations.find(a => a.isHeadShake),
    headShakeSoft: animations.find(a => a.isHeadShakeSingle),
    sad: animations.find(a => a.isSad),
    sadSoft: animations.find(a => a.isSadSoft),
    surprise: animations.find(a => a.isSurprise),
    surpriseSoft: animations.find(a => a.isSurpriseSoft),
    victory: animations.find(a => a.isVictory),
    victorySoft: animations.find(a => a.isVictorySoft),
  };
  pickUpAnimations = {
    pickUp: animations.find(a => a.isPickUp),
    pickUpIdle: animations.find(a => a.isPickUpIdle),
    pickUpThrow: animations.find(a => a.isPickUpThrow),
    putDown: animations.find(a => a.isPutDown),
    pickUpZelda: animations.find(a => a.isPickUpZelda),
  };
  /* throwAnimations = {
    throw: animations.find(a => a.isThrow),
    pickUpThrow: animations.find(a => a.isPickUpThrow),
  }; */
  /* crouchAnimations = {
      crouch: animations.find(a => a.isCrouch),
    }; */
  activateAnimations = {
    grab_forward: {animation: animations.index['grab_forward.fbx'], speedFactor: 1.2},
    grab_down: {animation: animations.index['grab_down.fbx'], speedFactor: 1.7},
    grab_up: {animation: animations.index['grab_up.fbx'], speedFactor: 1.2},
    grab_left: {animation: animations.index['grab_left.fbx'], speedFactor: 1.2},
    grab_right: {animation: animations.index['grab_right.fbx'], speedFactor: 1.2},
    pick_up: {animation: animations.index['pick_up.fbx'], speedFactor: 1},
  };
  window.activateAnimations = activateAnimations;
  narutoRunAnimations = {
    narutoRun: animations.find(a => a.isNarutoRun),
  };
  window.narutoRunAnimations = narutoRunAnimations;
  hurtAnimations = {
    pain_back: animations.index['pain_back.fbx'],
    pain_arch: animations.index['pain_arch.fbx'],
  };
  window.hurtAnimations = hurtAnimations;
  holdAnimations = {
    pick_up_idle: animations.index['pick_up_idle.fbx'],
  };
  window.holdAnimations = holdAnimations;
  {
    const down10QuaternionArray = new Quaternion()
      .setFromAxisAngle(new Vector3(1, 0, 0), Math.PI * 0.1)
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

export const _createAnimation = avatar => {
  avatar.mixer = new AnimMixer(avatar);

  // AnimMotions ---
  // LoopRepeat
  avatar.idleMotion = avatar.mixer.createMotion(animations.index['idle.fbx']);

  avatar.walkForwardMotion = avatar.mixer.createMotion(animations.index['walking.fbx']);
  avatar.walkBackwardMotion = avatar.mixer.createMotion(animations.index['walking backwards.fbx']);
  avatar.walkLeftMotion = avatar.mixer.createMotion(animations.index['left strafe walking.fbx']);
  avatar.walkRightMotion = avatar.mixer.createMotion(animations.index['right strafe walking.fbx']);
  avatar.walkLeftMirrorMotion = avatar.mixer.createMotion(animations.index['right strafe walking reverse.fbx']);
  avatar.walkRightMirrorMotion = avatar.mixer.createMotion(animations.index['left strafe walking reverse.fbx']);

  avatar.runForwardMotion = avatar.mixer.createMotion(animations.index['Fast Run.fbx']);
  avatar.runBackwardMotion = avatar.mixer.createMotion(animations.index['running backwards.fbx']);
  avatar.runLeftMotion = avatar.mixer.createMotion(animations.index['left strafe.fbx']);
  avatar.runRightMotion = avatar.mixer.createMotion(animations.index['right strafe.fbx']);
  avatar.runLeftMirrorMotion = avatar.mixer.createMotion(animations.index['right strafe reverse.fbx']);
  avatar.runRightMirrorMotion = avatar.mixer.createMotion(animations.index['left strafe reverse.fbx']);

  avatar.crouchForwardMotion = avatar.mixer.createMotion(animations.index['Sneaking Forward.fbx']);
  avatar.crouchBackwardMotion = avatar.mixer.createMotion(animations.index['Sneaking Forward reverse.fbx']);
  avatar.crouchLeftMotion = avatar.mixer.createMotion(animations.index['Crouched Sneaking Left.fbx']);
  avatar.crouchRightMotion = avatar.mixer.createMotion(animations.index['Crouched Sneaking Right.fbx']);
  avatar.crouchLeftMirrorMotion = avatar.mixer.createMotion(animations.index['Crouched Sneaking Right reverse.fbx']);
  avatar.crouchRightMirrorMotion = avatar.mixer.createMotion(animations.index['Crouched Sneaking Left reverse.fbx']);

  avatar.crouchIdleMotion = avatar.mixer.createMotion(animations.index['Crouch Idle.fbx']);

  // LoopOnce
  avatar.jumpMotion = avatar.mixer.createMotion(jumpAnimation);
  // avatar.jumpMotion = avatar.mixer.createMotion(animations.index['t-pose_rot.fbx']);
  avatar.jumpMotion.loop = LoopOnce;
  avatar.jumpMotion.stop();
  // avatar.jumpMotion.weight = 999999; // can't Infinity
  avatar.jumpMotion.timeBias = 0.7;
  avatar.jumpMotion.speed = 1 / 0.6;

  // AnimNodes ---
  avatar.walkNode = new AnimNodeBlendList('walk');
  avatar.walkNode.addChild(avatar.walkForwardMotion);
  avatar.walkNode.addChild(avatar.walkBackwardMotion);
  avatar.walkNode.addChild(avatar.walkLeftMotion);
  avatar.walkNode.addChild(avatar.walkRightMotion);
  avatar.walkNode.addChild(avatar.walkLeftMirrorMotion);
  avatar.walkNode.addChild(avatar.walkRightMirrorMotion);

  avatar.runNode = new AnimNodeBlendList('run');
  avatar.runNode.addChild(avatar.runForwardMotion);
  avatar.runNode.addChild(avatar.runBackwardMotion);
  avatar.runNode.addChild(avatar.runLeftMotion);
  avatar.runNode.addChild(avatar.runRightMotion);
  avatar.runNode.addChild(avatar.runLeftMirrorMotion);
  avatar.runNode.addChild(avatar.runRightMirrorMotion);

  avatar.crouchNode = new AnimNodeBlendList('crouch');
  avatar.crouchNode.addChild(avatar.crouchForwardMotion);
  avatar.crouchNode.addChild(avatar.crouchBackwardMotion);
  avatar.crouchNode.addChild(avatar.crouchLeftMotion);
  avatar.crouchNode.addChild(avatar.crouchRightMotion);
  avatar.crouchNode.addChild(avatar.crouchLeftMirrorMotion);
  avatar.crouchNode.addChild(avatar.crouchRightMirrorMotion);

  avatar.walkRunNode = new AnimNodeBlend2('walkRun');
  avatar.walkRunNode.addChild(avatar.walkNode);
  avatar.walkRunNode.addChild(avatar.runNode);

  avatar._7wayWalkRunNode = new AnimNodeBlend2('_7wayWalkRunNode');
  avatar._7wayWalkRunNode.addChild(avatar.idleMotion);
  avatar._7wayWalkRunNode.addChild(avatar.walkRunNode);

  avatar._7wayCrouchNode = new AnimNodeBlend2('_7wayCrouchNode');
  avatar._7wayCrouchNode.addChild(avatar.crouchIdleMotion);
  avatar._7wayCrouchNode.addChild(avatar.crouchNode);

  avatar.defaultNode = new AnimNodeBlend2('defaultNode');
  avatar.defaultNode.addChild(avatar._7wayWalkRunNode);
  avatar.defaultNode.addChild(avatar._7wayCrouchNode);

  avatar.jumpNode = new AnimNodeBlend2('jump');
  avatar.jumpNode.addChild(avatar.defaultNode);
  avatar.jumpNode.addChild(avatar.jumpMotion);

  avatar.animTree = avatar.jumpNode; // todo: set whole tree here with separate names.
};

export const _updateAnimation = avatar => {
  const timeS = performance.now() / 1000;
  const {mixer} = avatar;

  // LoopRepeat ---

  const angle = avatar.getAngle();
  const forwardFactor = 1 - MathUtils.clamp(Math.abs(angle) / (Math.PI / 2), 0, 1);
  const backwardFactor = 1 - MathUtils.clamp((Math.PI - Math.abs(angle)) / (Math.PI / 2), 0, 1);
  const leftFactor = 1 - MathUtils.clamp(Math.abs(angle - Math.PI / 2) / (Math.PI / 2), 0, 1);
  const rightFactor = 1 - MathUtils.clamp(Math.abs(angle - -Math.PI / 2) / (Math.PI / 2), 0, 1);
  const mirror = Math.abs(angle) > (Math.PI / 2 + 0.01); // todo: smooth mirror changing

  avatar.walkForwardMotion.weight = forwardFactor;
  avatar.walkBackwardMotion.weight = backwardFactor;
  avatar.walkLeftMotion.weight = mirror ? 0 : leftFactor;
  avatar.walkLeftMirrorMotion.weight = mirror ? leftFactor : 0;
  avatar.walkRightMotion.weight = mirror ? 0 : rightFactor;
  avatar.walkRightMirrorMotion.weight = mirror ? rightFactor : 0;

  window.domInfo.innerHTML += `<div style="display:;">forward: --- ${window.logNum(avatar.walkForwardMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">backward: --- ${window.logNum(avatar.walkBackwardMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">left: --- ${window.logNum(avatar.walkLeftMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">right: --- ${window.logNum(avatar.walkRightMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">leftMirror: --- ${window.logNum(avatar.walkLeftMirrorMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">rightMirror: --- ${window.logNum(avatar.walkRightMirrorMotion.weight)}</div>`;

  avatar.runForwardMotion.weight = forwardFactor;
  avatar.runBackwardMotion.weight = backwardFactor;
  avatar.runLeftMotion.weight = mirror ? 0 : leftFactor;
  avatar.runLeftMirrorMotion.weight = mirror ? leftFactor : 0;
  avatar.runRightMotion.weight = mirror ? 0 : rightFactor;
  avatar.runRightMirrorMotion.weight = mirror ? rightFactor : 0;

  avatar.crouchForwardMotion.weight = forwardFactor;
  avatar.crouchBackwardMotion.weight = backwardFactor;
  avatar.crouchLeftMotion.weight = mirror ? 0 : leftFactor;
  avatar.crouchLeftMirrorMotion.weight = mirror ? leftFactor : 0;
  avatar.crouchRightMotion.weight = mirror ? 0 : rightFactor;
  avatar.crouchRightMirrorMotion.weight = mirror ? rightFactor : 0;

  avatar.walkRunNode.factor = avatar.moveFactors.walkRunFactor;
  avatar._7wayWalkRunNode.factor = avatar.moveFactors.idleWalkFactor;
  avatar._7wayCrouchNode.factor = avatar.moveFactors.idleWalkFactor;
  avatar.defaultNode.factor = avatar.moveFactors.crouchFactor;

  // LoopOnce ---

  // jump
  // avatar.jumpMotion.time = avatar.jumpTime / 1000;
  // const jumpFactor = MathUtils.clamp(avatar.jumpMotion.time / 0.2, 0, 1);
  // avatar.defaultNode.weight = 1 - jumpFactor;
  // avatar.jumpMotion.weight = jumpFactor;

  // if (avatar.jumpStart) avatar.jumpMotion.play();
  // if (avatar.jumpEnd) avatar.jumpMotion.stop();

  // if (avatar.jumpStart) avatar.jumpNode.factor = 1;
  // if (avatar.jumpEnd) avatar.jumpNode.factor = 0;

  if (avatar.jumpStart) {
    avatar.jumpMotion.play();
    avatar.jumpNode.crossFade(0.2, 1);
  }
  if (avatar.jumpEnd) avatar.jumpNode.crossFade(0.2, 0);
  // if (avatar === window.avatar) console.log(Math.floor(avatar.jumpMotion.time));

  //

  mixer.update(timeS, avatar.animTree);
};

export {
  animations,
  animationStepIndices,
  emoteAnimations,
  // cubicBezier,
};

export const getClosest2AnimationAngles = (key, angle) => {
  const animationAngleArray = animationsAngleArrays[key];
  animationAngleArray.sort((a, b) => {
    const aDistance = Math.abs(angleDifference(angle, a.angle));
    const bDistance = Math.abs(angleDifference(angle, b.angle));
    return aDistance - bDistance;
  });
  const closest2AnimationAngles = animationAngleArray.slice(0, 2);
  return closest2AnimationAngles;
};

export const _findArmature = bone => {
  for (; ; bone = bone.parent) {
    if (!bone.isBone) {
      return bone;
    }
  }
  // return null; // can't happen
};

export const _getLerpFn = isPosition => isPosition ? Vector3.prototype.lerp : Quaternion.prototype.slerp;

export function getFirstPersonCurves(vrmExtension) {
  const DEG2RAD = Math.PI / 180; // MathUtils.DEG2RAD;
  function _importCurveMapperBone(map) {
    return new VRMCurveMapper(
      typeof map.xRange === 'number' ? DEG2RAD * map.xRange : undefined,
      typeof map.yRange === 'number' ? DEG2RAD * map.yRange : undefined,
      map.curve,
    );
  }
  if (vrmExtension) {
    const {firstPerson} = vrmExtension;
    const {
      lookAtHorizontalInner,
      lookAtHorizontalOuter,
      lookAtVerticalDown,
      lookAtVerticalUp,
      // lookAtTypeName,
    } = firstPerson;

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
