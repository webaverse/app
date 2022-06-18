import {Vector3, Quaternion, AnimationClip, LoopOnce, MathUtils, LoopRepeat} from 'three';
import metaversefile from 'metaversefile';
import {/* VRMSpringBoneImporter, VRMLookAtApplyer, */ VRMCurveMapper} from '@pixiv/three-vrm/lib/three-vrm.module.js';
// import easing from '../easing.js';
import {easing} from '../math-utils.js';
import loaders from '../loaders.js';
import {zbdecode} from 'zjs/encoding.mjs';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer.js';

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
import {WebaverseAnimationNode} from './WebaverseAnimationNode.js';
import {WebaverseAnimationNodeBlend2} from './WebaverseAnimationNodeBlend2.js';
import {WebaverseAnimationNodeBlendList} from './WebaverseAnimationNodeBlendList.js';
import {WebaverseAnimationNodeUnitary} from './WebaverseAnimationNodeUnitary.js';
import {WebaverseAnimationNodeOverwrite} from './WebaverseAnimationNodeOverwrite.js';
import game from '../game.js';

const localVector = new Vector3();
const localVector2 = new Vector3();
const localVector3 = new Vector3();

const localQuaternion = new Quaternion();
const localQuaternion2 = new Quaternion();
const localQuaternion3 = new Quaternion();
const localQuaternion4 = new Quaternion();
const localQuaternion5 = new Quaternion();
const localQuaternion6 = new Quaternion();

const identityQuaternion = new Quaternion();

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
  window.useAnimations = useAnimations;
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
    pickUpIdleZelda: animations.find(a => a.isPickUpIdleZelda),
    putDownZelda: animations.find(a => a.isPutDownZelda),
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

const animSystem = {};

export const _createAnimation = avatar => {
  animSystem.mixer = new WebaverseAnimationMixer(avatar);

  // WebaverseAnimationMotions ---
  // LoopRepeat
  animSystem.idleMotion = animSystem.mixer.createMotion(animations.index['idle.fbx']);

  animSystem.walkForwardMotion = animSystem.mixer.createMotion(animations.index['walking.fbx']);
  animSystem.walkBackwardMotion = animSystem.mixer.createMotion(animations.index['walking backwards.fbx']);
  animSystem.walkLeftMotion = animSystem.mixer.createMotion(animations.index['left strafe walking.fbx']);
  animSystem.walkRightMotion = animSystem.mixer.createMotion(animations.index['right strafe walking.fbx']);
  animSystem.walkLeftMirrorMotion = animSystem.mixer.createMotion(animations.index['right strafe walking reverse.fbx']);
  animSystem.walkRightMirrorMotion = animSystem.mixer.createMotion(animations.index['left strafe walking reverse.fbx']);

  animSystem.runForwardMotion = animSystem.mixer.createMotion(animations.index['Fast Run.fbx']);
  animSystem.runBackwardMotion = animSystem.mixer.createMotion(animations.index['running backwards.fbx']);
  animSystem.runLeftMotion = animSystem.mixer.createMotion(animations.index['left strafe.fbx']);
  animSystem.runRightMotion = animSystem.mixer.createMotion(animations.index['right strafe.fbx']);
  animSystem.runLeftMirrorMotion = animSystem.mixer.createMotion(animations.index['right strafe reverse.fbx']);
  animSystem.runRightMirrorMotion = animSystem.mixer.createMotion(animations.index['left strafe reverse.fbx']);

  animSystem.crouchForwardMotion = animSystem.mixer.createMotion(animations.index['Sneaking Forward.fbx']);
  animSystem.crouchBackwardMotion = animSystem.mixer.createMotion(animations.index['Sneaking Forward reverse.fbx']);
  animSystem.crouchLeftMotion = animSystem.mixer.createMotion(animations.index['Crouched Sneaking Left.fbx']);
  animSystem.crouchRightMotion = animSystem.mixer.createMotion(animations.index['Crouched Sneaking Right.fbx']);
  animSystem.crouchLeftMirrorMotion = animSystem.mixer.createMotion(animations.index['Crouched Sneaking Right reverse.fbx']);
  animSystem.crouchRightMirrorMotion = animSystem.mixer.createMotion(animations.index['Crouched Sneaking Left reverse.fbx']);

  animSystem.bowForwardMotion = animSystem.mixer.createMotion(animations.index['Standing Aim Walk Forward.fbx']);
  animSystem.bowBackwardMotion = animSystem.mixer.createMotion(animations.index['Standing Aim Walk Forward reverse.fbx']);
  animSystem.bowLeftMotion = animSystem.mixer.createMotion(animations.index['Standing Aim Walk Left.fbx']);
  animSystem.bowRightMotion = animSystem.mixer.createMotion(animations.index['Standing Aim Walk Right.fbx']);
  animSystem.bowLeftMirrorMotion = animSystem.mixer.createMotion(animations.index['Standing Aim Walk Right reverse.fbx']);
  animSystem.bowRightMirrorMotion = animSystem.mixer.createMotion(animations.index['Standing Aim Walk Left reverse.fbx']);

  animSystem.crouchIdleMotion = animSystem.mixer.createMotion(animations.index['Crouch Idle.fbx']);
  // animSystem.flyMotion = animSystem.mixer.createMotion(floatAnimation);
  animSystem.flyIdleMotion = animSystem.mixer.createMotion(animations.index['fly_idle.fbx']);
  animSystem.flyDodgeForwardMotion = animSystem.mixer.createMotion(animations.index['fly_dodge_forward.fbx']);
  animSystem.flyDodgeBackwardMotion = animSystem.mixer.createMotion(animations.index['fly_dodge_backward.fbx']);
  animSystem.flyDodgeLeftMotion = animSystem.mixer.createMotion(animations.index['fly_dodge_left.fbx']);
  animSystem.flyDodgeRightMotion = animSystem.mixer.createMotion(animations.index['fly_dodge_right.fbx']);
  animSystem.flyDashMotion = animSystem.mixer.createMotion(animations.index['fly_dash_forward.fbx']);
  animSystem.narutoRunMotion = animSystem.mixer.createMotion(narutoRunAnimations[defaultNarutoRunAnimation]);

  animSystem.useMotiono = {};
  for (const k in useAnimations) {
    const animation = useAnimations[k];
    if (animation) {
      animSystem.useMotiono[k] = animSystem.mixer.createMotion(animation);
    }
  }
  // animSystem.useMotiono.bowIdle2 = animSystem.mixer.createMotion(animSystem.useMotiono.bowIdle.animation); // duplicate bowIdle motion, used for different parents
  animSystem.useMotiono.drink.loop = LoopOnce; animSystem.useMotiono.drink.stop();
  animSystem.useMotiono.combo.loop = LoopOnce; animSystem.useMotiono.combo.stop();
  // combo
  animSystem.useMotiono.swordSideSlash.loop = LoopOnce; animSystem.useMotiono.swordSideSlash.stop();
  animSystem.useMotiono.swordSideSlashStep.loop = LoopOnce; animSystem.useMotiono.swordSideSlashStep.stop();
  animSystem.useMotiono.swordTopDownSlash.loop = LoopOnce; animSystem.useMotiono.swordTopDownSlash.stop();
  animSystem.useMotiono.swordTopDownSlashStep.loop = LoopOnce; animSystem.useMotiono.swordTopDownSlashStep.stop();
  // envelope
  animSystem.useMotiono.bowDraw.loop = LoopOnce; animSystem.useMotiono.bowDraw.stop();
  // animSystem.useMotiono.bowIdle.loop = LoopOnce; animSystem.useMotiono.bowIdle.stop();
  animSystem.useMotiono.bowLoose.loop = LoopOnce; animSystem.useMotiono.bowLoose.stop();
  // sit
  animSystem.sitMotiono = {};
  for (const k in sitAnimations) {
    const animation = sitAnimations[k];
    if (animation) {
      animSystem.sitMotiono[k] = animSystem.mixer.createMotion(animation);
      animSystem.sitMotiono[k].loop = LoopOnce; animSystem.sitMotiono[k].stop();
    }
  }
  // emote
  animSystem.emoteMotiono = {};
  for (const k in emoteAnimations) {
    const animation = emoteAnimations[k];
    if (animation) {
      animSystem.emoteMotiono[k] = animSystem.mixer.createMotion(animation);
      animSystem.emoteMotiono[k].loop = LoopOnce; animSystem.emoteMotiono[k].stop();
    }
  }
  // dance
  animSystem.danceMotiono = {};
  for (const k in danceAnimations) {
    const animation = danceAnimations[k];
    if (animation) {
      animSystem.danceMotiono[k] = animSystem.mixer.createMotion(animation);
      // animSystem.danceMotiono[k].loop = LoopOnce; animSystem.danceMotiono[k].stop();
    }
  }

  // LoopOnce
  animSystem.jumpMotion = animSystem.mixer.createMotion(jumpAnimation);
  // animSystem.jumpMotion = animSystem.mixer.createMotion(animations.index['t-pose_rot.fbx']);
  animSystem.jumpMotion.loop = LoopOnce;
  animSystem.jumpMotion.stop();
  // animSystem.jumpMotion.weight = 999999; // can't Infinity
  animSystem.jumpMotion.timeBias = 0.7;
  animSystem.jumpMotion.speed = 1 / 0.6;

  animSystem.activateMotion = animSystem.mixer.createMotion(activateAnimations.grab_forward.animation); // todo: handle activateAnimations.grab_forward.speedFactor
  // animSystem.activateMotion = animSystem.mixer.createMotion(animations.index['t-pose_rot.fbx']);
  animSystem.activateMotion.loop = LoopOnce;
  animSystem.activateMotion.stop();

  // animSystem.useComboMotion = animSystem.mixer.createMotion(useAnimations.swordSideSlash);
  // animSystem.useComboMotion.loop = LoopOnce;
  // animSystem.useComboMotion.stop();

  // AnimNodes ---
  // todo: in order to reuse motions, need set children weights in node.
  animSystem.walkNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlendList, 'walk'); // todo: mixer.createNode
  animSystem.walkNode.addChild(animSystem.walkForwardMotion);
  animSystem.walkNode.addChild(animSystem.walkBackwardMotion);
  animSystem.walkNode.addChild(animSystem.walkLeftMotion);
  animSystem.walkNode.addChild(animSystem.walkRightMotion);
  animSystem.walkNode.addChild(animSystem.walkLeftMirrorMotion);
  animSystem.walkNode.addChild(animSystem.walkRightMirrorMotion);

  animSystem.runNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlendList, 'run');
  animSystem.runNode.addChild(animSystem.runForwardMotion);
  animSystem.runNode.addChild(animSystem.runBackwardMotion);
  animSystem.runNode.addChild(animSystem.runLeftMotion);
  animSystem.runNode.addChild(animSystem.runRightMotion);
  animSystem.runNode.addChild(animSystem.runLeftMirrorMotion);
  animSystem.runNode.addChild(animSystem.runRightMirrorMotion);

  animSystem.crouchNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlendList, 'crouch');
  animSystem.crouchNode.addChild(animSystem.crouchForwardMotion);
  animSystem.crouchNode.addChild(animSystem.crouchBackwardMotion);
  animSystem.crouchNode.addChild(animSystem.crouchLeftMotion);
  animSystem.crouchNode.addChild(animSystem.crouchRightMotion);
  animSystem.crouchNode.addChild(animSystem.crouchLeftMirrorMotion);
  animSystem.crouchNode.addChild(animSystem.crouchRightMirrorMotion);

  animSystem.bowNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlendList, 'bow');
  animSystem.bowNode.addChild(animSystem.bowForwardMotion);
  animSystem.bowNode.addChild(animSystem.bowBackwardMotion);
  animSystem.bowNode.addChild(animSystem.bowLeftMotion);
  animSystem.bowNode.addChild(animSystem.bowRightMotion);
  animSystem.bowNode.addChild(animSystem.bowLeftMirrorMotion);
  animSystem.bowNode.addChild(animSystem.bowRightMirrorMotion);

  animSystem.walkRunNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, 'walkRun');
  animSystem.walkRunNode.addChild(animSystem.walkNode);
  animSystem.walkRunNode.addChild(animSystem.runNode);

  animSystem._7wayWalkRunNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayWalkRunNode');
  animSystem._7wayWalkRunNode.addChild(animSystem.idleMotion);
  animSystem._7wayWalkRunNode.addChild(animSystem.walkRunNode);

  animSystem._7wayCrouchNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayCrouchNode');
  animSystem._7wayCrouchNode.addChild(animSystem.crouchIdleMotion);
  animSystem._7wayCrouchNode.addChild(animSystem.crouchNode);

  animSystem._7wayBowNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayBowNode');
  // animSystem._7wayBowNode.addChild(animSystem.useMotiono.bowIdle2);
  animSystem._7wayBowNode.addChild(animSystem.useMotiono.bowIdle);
  animSystem._7wayBowNode.addChild(animSystem.bowNode);

  animSystem.bowDrawLooseNodoe = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, 'bowDrawLoose');
  animSystem.bowDrawLooseNodoe.addChild(animSystem.useMotiono.bowDraw);
  animSystem.bowDrawLooseNodoe.addChild(animSystem.useMotiono.bowLoose);

  animSystem.bowIdleDrawLooseNode = animSystem.mixer.createNode(WebaverseAnimationNodeOverwrite, 'bowIdleDrawLoose', {filters: ['isTop']});
  animSystem.bowIdleDrawLooseNode.addChild(animSystem._7wayBowNode);
  animSystem.bowIdleDrawLooseNode.addChild(animSystem.bowDrawLooseNodoe);

  animSystem._7wayWalkRunBowNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayWalkRunBow');
  animSystem._7wayWalkRunBowNode.addChild(animSystem._7wayWalkRunNode);
  // animSystem._7wayWalkRunBowNode.addChild(animSystem._7wayBowNode);
  animSystem._7wayWalkRunBowNode.addChild(animSystem.bowIdleDrawLooseNode);

  animSystem.defaultNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, 'defaultNode');
  animSystem.defaultNode.addChild(animSystem._7wayWalkRunBowNode);
  animSystem.defaultNode.addChild(animSystem._7wayCrouchNode);

  animSystem.flyForwardNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, 'flyForwardNode');
  animSystem.flyForwardNode.addChild(animSystem.flyDodgeForwardMotion);
  animSystem.flyForwardNode.addChild(animSystem.flyDashMotion);

  animSystem.flyNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlendList, 'flyNode');
  animSystem.flyNode.addChild(animSystem.flyForwardNode);
  animSystem.flyNode.addChild(animSystem.flyDodgeBackwardMotion);
  animSystem.flyNode.addChild(animSystem.flyDodgeLeftMotion);
  animSystem.flyNode.addChild(animSystem.flyDodgeRightMotion);

  animSystem._7wayFlyNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayFlyNode');
  animSystem._7wayFlyNode.addChild(animSystem.flyIdleMotion);
  animSystem._7wayFlyNode.addChild(animSystem.flyNode);

  animSystem.actionsNode = animSystem.mixer.createNode(WebaverseAnimationNodeUnitary, 'actions');
  animSystem.actionsNode.addChild(animSystem.defaultNode);
  animSystem.actionsNode.addChild(animSystem.jumpMotion);
  animSystem.actionsNode.addChild(animSystem._7wayFlyNode);
  animSystem.actionsNode.addChild(animSystem.activateMotion);
  animSystem.actionsNode.addChild(animSystem.narutoRunMotion);
  // useMotiono
  animSystem.actionsNode.addChild(animSystem.useMotiono.drink);
  // sword
  animSystem.actionsNode.addChild(animSystem.useMotiono.combo);
  // silsword combo
  animSystem.actionsNode.addChild(animSystem.useMotiono.swordSideSlash);
  animSystem.actionsNode.addChild(animSystem.useMotiono.swordSideSlashStep);
  animSystem.actionsNode.addChild(animSystem.useMotiono.swordTopDownSlash);
  animSystem.actionsNode.addChild(animSystem.useMotiono.swordTopDownSlashStep);
  // envolope
  // animSystem.actionsNode.addChild(animSystem.useMotiono.bowDraw);
  // animSystem.actionsNode.addChild(animSystem.useMotiono.bowIdle); // ~~todo: bowIdle weight conflict with _7wayBowNode's bowIdle~~
  // animSystem.actionsNode.addChild(animSystem.useMotiono.bowLoose);
  // sit
  for (const k in animSystem.sitMotiono) {
    const motion = animSystem.sitMotiono[k];
    animSystem.actionsNode.addChild(motion);
  }
  // emote
  for (const k in animSystem.emoteMotiono) {
    const motion = animSystem.emoteMotiono[k];
    animSystem.actionsNode.addChild(motion);
  }
  // dance
  for (const k in animSystem.danceMotiono) {
    const motion = animSystem.danceMotiono[k];
    animSystem.actionsNode.addChild(motion);
  }

  // animSystem.jumpNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, 'jump');
  // animSystem.jumpNode.addChild(animSystem.defaultNode);
  // animSystem.jumpNode.addChild(animSystem.jumpMotion);

  // animSystem.flyNode = animSystem.mixer.createNode(WebaverseAnimationNodeBlend2, 'fly');
  // animSystem.flyNode.addChild(animSystem.jumpNode);
  // animSystem.flyNode.addChild(animSystem.flyMotion);

  animSystem.animTree = animSystem.actionsNode; // todo: set whole tree here with separate names.
  // test
  // animSystem.animTree = animSystem.bowNode;
  // animSystem.animTree = animSystem.useMotiono.bowLoose; animSystem.useMotiono.bowLoose.loop = LoopRepeat; animSystem.useMotiono.bowLoose.play();
  // animSystem.animTree = animSystem.useMotiono.bowIdle; animSystem.useMotiono.bowIdle.loop = LoopRepeat; animSystem.useMotiono.bowIdle.play();
  // animSystem.animTree = animSystem.useMotiono.bowDraw; animSystem.useMotiono.bowDraw.loop = LoopRepeat; animSystem.useMotiono.bowDraw.play();
  // animSystem.overwriteNode = animSystem.mixer.createNode(WebaverseAnimationNodeOverwrite, 'overwrite');
  // animSystem.overwriteNode.addChild(animSystem.crouchForwardMotion);
  // animSystem.overwriteNode.addChild(animSystem.runForwardMotion);
  // animSystem.animTree = animSystem.crouchForwardMotion;
  // animSystem.animTree = animSystem.runForwardMotion;
  // animSystem.animTree = animSystem.overwriteNode;
  //

  const handleAnimationEnd = (motion, trigger) => {
    // console.log(motion.name, trigger);
    // if (motion === animSystem.jumpMotion) debugger
    if ([
      animSystem.useMotiono.drink,
      animSystem.useMotiono.combo,
      animSystem.useMotiono.swordSideSlash,
      animSystem.useMotiono.swordSideSlashStep,
      animSystem.useMotiono.swordTopDownSlash,
      animSystem.useMotiono.swordTopDownSlashStep,
    ].includes(motion)) {
      // console.log('animationEnd', event.motion.name);
      game.handleAnimationEnd();
    }
  };

  animSystem.mixer.addEventListener('finished', event => {
    // console.log('finished', event.motion.name, !!animSystem.useEnvelopeState); // todo: why `bow draw.fbx` trigger `finished` event at app init.
    handleAnimationEnd(event.motion, 'finished');
    // if ([
    //   animSystem.useMotiono.combo,
    //   animSystem.useMotiono.swordSideSlash,
    //   animSystem.useMotiono.swordSideSlashStep,
    //   animSystem.useMotiono.swordTopDownSlash,
    //   animSystem.useMotiono.swordTopDownSlashStep,
    // ].includes(event.motion)) {
    //   // console.log('animationEnd', event.motion.name);
    //   game.handleAnimationEnd();
    // }

    if (animSystem.useEnvelopeState && event.motion === animSystem.useMotiono.bowDraw) {
      // animSystem.actionsNode.crossFadeTo(0.2, animSystem.useMotiono.bowIdle);
      // animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
      // animSystem.bowIdleDrawLooseNode.factor = 0;
      animSystem.bowIdleDrawLooseNode.crossFade(0.2, 0);
    }
    if (event.motion === animSystem.useMotiono.bowLoose) {
      // animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
      animSystem._7wayWalkRunBowNode.crossFade(0.2, 0);
    }
  });
  // animSystem.mixer.addEventListener('stopped', event => { // handle situations such as sword attacks stopped by jump
  //   // console.log('stopped', event.motion.name);
  //   // handleAnimationEnd(event);
  // });
  // animSystem.actionsNode.addEventListener('switch', event => { // handle situations such as sword attacks stopped by jump
  //   handleAnimationEnd(event.from, 'switch');
  //   // if (![
  //   //   animSystem.useMotiono.combo,
  //   //   animSystem.useMotiono.swordSideSlash,
  //   //   animSystem.useMotiono.swordSideSlashStep,
  //   //   animSystem.useMotiono.swordTopDownSlash,
  //   //   animSystem.useMotiono.swordTopDownSlashStep,
  //   // ].includes(event.to)) {
  //   //   game.handleAnimationEnd();
  //   // }
  // });
};

export const _updateAnimation = avatar => {
  const timeS = performance.now() / 1000;
  const {mixer} = avatar;

  // test
  // console.log(avatar.actionsNode.activeNode.name);

  const angle = avatar.getAngle();
  const forwardFactor = 1 - MathUtils.clamp(Math.abs(angle) / (Math.PI / 2), 0, 1);
  const backwardFactor = 1 - MathUtils.clamp((Math.PI - Math.abs(angle)) / (Math.PI / 2), 0, 1);
  const leftFactor = 1 - MathUtils.clamp(Math.abs(angle - Math.PI / 2) / (Math.PI / 2), 0, 1);
  const rightFactor = 1 - MathUtils.clamp(Math.abs(angle - -Math.PI / 2) / (Math.PI / 2), 0, 1);
  // const mirror = Math.abs(angle) > (Math.PI / 2 + 0.01); // todo: smooth mirror changing
  const mirrorFactorReverse = 1 - avatar.mirrorFactor;

  animSystem.walkForwardMotion.weight = forwardFactor;
  animSystem.walkBackwardMotion.weight = backwardFactor;
  animSystem.walkLeftMotion.weight = mirrorFactorReverse * leftFactor;
  animSystem.walkLeftMirrorMotion.weight = avatar.mirrorFactor * leftFactor;
  animSystem.walkRightMotion.weight = mirrorFactorReverse * rightFactor;
  animSystem.walkRightMirrorMotion.weight = avatar.mirrorFactor * rightFactor;

  window.domInfo.innerHTML += `<div style="display:;">forward: --- ${window.logNum(animSystem.walkForwardMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">backward: --- ${window.logNum(animSystem.walkBackwardMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">left: --- ${window.logNum(animSystem.walkLeftMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">right: --- ${window.logNum(animSystem.walkRightMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">leftMirror: --- ${window.logNum(animSystem.walkLeftMirrorMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">rightMirror: --- ${window.logNum(animSystem.walkRightMirrorMotion.weight)}</div>`;

  animSystem.runForwardMotion.weight = forwardFactor;
  animSystem.runBackwardMotion.weight = backwardFactor;
  animSystem.runLeftMotion.weight = mirrorFactorReverse * leftFactor;
  animSystem.runLeftMirrorMotion.weight = avatar.mirrorFactor * leftFactor;
  animSystem.runRightMotion.weight = mirrorFactorReverse * rightFactor;
  animSystem.runRightMirrorMotion.weight = avatar.mirrorFactor * rightFactor;

  animSystem.crouchForwardMotion.weight = forwardFactor;
  animSystem.crouchBackwardMotion.weight = backwardFactor;
  animSystem.crouchLeftMotion.weight = mirrorFactorReverse * leftFactor;
  animSystem.crouchLeftMirrorMotion.weight = avatar.mirrorFactor * leftFactor;
  animSystem.crouchRightMotion.weight = mirrorFactorReverse * rightFactor;
  animSystem.crouchRightMirrorMotion.weight = avatar.mirrorFactor * rightFactor;

  animSystem.bowForwardMotion.weight = forwardFactor;
  animSystem.bowBackwardMotion.weight = backwardFactor;
  animSystem.bowLeftMotion.weight = mirrorFactorReverse * leftFactor;
  animSystem.bowLeftMirrorMotion.weight = avatar.mirrorFactor * leftFactor;
  animSystem.bowRightMotion.weight = mirrorFactorReverse * rightFactor;
  animSystem.bowRightMirrorMotion.weight = avatar.mirrorFactor * rightFactor;

  animSystem.flyForwardNode.weight = forwardFactor;
  animSystem.flyDodgeBackwardMotion.weight = backwardFactor;
  animSystem.flyDodgeLeftMotion.weight = leftFactor;
  animSystem.flyDodgeRightMotion.weight = rightFactor;

  // animSystem._7wayWalkRunBowNode.factor = avatar.useEnvelopeState ? 1 : 0;
  // animSystem._7wayWalkRunBowNode.factor = avatar.useEnvelopeFactor;
  // console.log(animSystem._7wayWalkRunBowNode.factor);

  animSystem.walkRunNode.factor = avatar.moveFactors.walkRunFactor;
  animSystem._7wayWalkRunNode.factor = avatar.moveFactors.idleWalkFactor;
  animSystem._7wayCrouchNode.factor = avatar.moveFactors.idleWalkFactor;
  animSystem._7wayBowNode.factor = avatar.moveFactors.idleWalkFactor;
  animSystem._7wayFlyNode.factor = avatar.moveFactors.walkRunFactor;
  animSystem.defaultNode.factor = avatar.moveFactors.crouchFactor;
  animSystem.flyForwardNode.factor = avatar.flyDashFactor;

  // action end event ---

  if (avatar.narutoRunEnd) animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  // if (avatar.jumpEnd) animSystem.jumpMotion.stop();
  // if (avatar.jumpEnd) animSystem.jumpNode.factor = 0;
  if (avatar.jumpEnd) {
    // debugger
    // animSystem.jumpMotion.stop(); // don't need
    if (avatar.narutoRunState) {
      animSystem.actionsNode.crossFadeTo(0.2, animSystem.narutoRunMotion);
    } else {
      animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
    }
  }
  if (avatar.flyEnd) {
    // debugger
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  }
  if (avatar.activateEnd) {
    // animSystem.activateMotion.stop(); // don't need
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  }
  if (avatar.useEnd) {
    console.log('useEnd');
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  }
  if (avatar.useComboEnd) {
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  }
  // if (avatar.useEnvelopeEnd) {
  //   // console.log('useEnvelopeEnd');
  //   // if (animSystem.actionsNode.activeNode === animSystem.useMotiono.bowIdle) { // todo: useAnimationEnvelope[1]
  //   if (animSystem.actionsNode.activeNode === animSystem.defaultNode) {
  //     animSystem.useMotiono.bowLoose.play();
  //     animSystem.actionsNode.crossFadeTo(0, animSystem.useMotiono.bowLoose); // todo: useAnimationEnvelope[2] // todo: 0.2 transition
  //   } else {
  //     animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  //   }
  // }
  if (avatar.useEnvelopeEnd) {
    // console.log('useEnvelopeEnd');
    // if (animSystem.actionsNode.activeNode === animSystem.useMotiono.bowIdle) { // todo: useAnimationEnvelope[1]
    // if (animSystem.actionsNode.activeNode === animSystem.defaultNode) {
    animSystem.useMotiono.bowLoose.play();
    // animSystem.actionsNode.crossFadeTo(0, animSystem.useMotiono.bowLoose); // todo: useAnimationEnvelope[2] // todo: 0.2 transition
    // animSystem.bowDrawLooseNodoe.crossFade(0.2, 1);
    animSystem.bowDrawLooseNodoe.factor = 1;
    animSystem.bowIdleDrawLooseNode.crossFade(0.2, 1);
    // } else {
    //   animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
    // }
  }
  if (avatar.sitEnd) {
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  }
  if (avatar.emoteEnd) {
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  }
  if (avatar.danceEnd) {
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.defaultNode);
  }
  // console.log(avatar.useComboStart, avatar.useComboEnd);

  // action start event ---

  if (avatar.narutoRunStart) animSystem.actionsNode.crossFadeTo(0.2, animSystem.narutoRunMotion);

  // jump
  // animSystem.jumpMotion.time = avatar.jumpTime / 1000;
  // const jumpFactor = MathUtils.clamp(animSystem.jumpMotion.time / 0.2, 0, 1);
  // animSystem.defaultNode.weight = 1 - jumpFactor;
  // animSystem.jumpMotion.weight = jumpFactor;

  // if (avatar.jumpStart) animSystem.jumpMotion.play();

  // if (avatar.jumpStart) animSystem.jumpNode.factor = 1;

  if (avatar.jumpStart) {
    console.log('jumpStart');
    // debugger
    animSystem.jumpMotion.play();
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.jumpMotion);
  }
  // if (avatar === window.avatar) console.log(Math.floor(animSystem.jumpMotion.time));

  if (avatar.flyStart) {
    // debugger
    animSystem.actionsNode.crossFadeTo(0.2, animSystem._7wayFlyNode);
  }

  if (avatar.activateStart) {
    // console.log('activateStart');
    animSystem.activateMotion.play();
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.activateMotion);
  }

  if (avatar.useStart) {
    // console.log('useStart');
    const useAnimationName = avatar.useAnimation;
    animSystem.useMotiono[useAnimationName].play();
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.useMotiono[useAnimationName]);
  }

  if (avatar.useComboStart) {
    // console.log('useComboStart');
    const useAnimationName = animSystem.useAnimationCombo[avatar.useAnimationIndex];
    animSystem.useMotiono[useAnimationName].play();
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.useMotiono[useAnimationName]);
  }

  // animSystem.useMotiono.bowIdle.weight = 0;

  // if (avatar.useEnvelopeStart) {
  //   // console.log('useEnvelopeStart');
  //   const useAnimationName = avatar.useAnimationEnvelope[0];
  //   animSystem.useMotiono[useAnimationName].play();
  //   animSystem.actionsNode.crossFadeTo(0.2, animSystem.useMotiono[useAnimationName]);
  // }

  if (avatar.useEnvelopeStart) {
    // console.log('useEnvelopeStart');
    // const useAnimationName = avatar.useAnimationEnvelope[0];
    animSystem.useMotiono.bowDraw.play();
    animSystem.bowDrawLooseNodoe.factor = 0;
    animSystem.bowIdleDrawLooseNode.factor = 1;
    animSystem._7wayWalkRunBowNode.crossFade(0.2, 1);
  }
  // sit
  if (avatar.sitStart) {
    animSystem.sitMotiono[avatar.sitAnimation || defaultSitAnimation].play();
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.sitMotiono[avatar.sitAnimation || defaultSitAnimation]);
  }
  // emote
  if (avatar.emoteStart) {
    animSystem.emoteMotiono[avatar.emoteAnimation || defaultEmoteAnimation].play();
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.emoteMotiono[avatar.emoteAnimation || defaultEmoteAnimation]);
  }
  // dance
  if (avatar.danceStart) {
    // animSystem.danceMotiono[avatar.danceAnimation || defaultDanceAnimation].play();
    animSystem.actionsNode.crossFadeTo(0.2, animSystem.danceMotiono[avatar.danceAnimation || defaultDanceAnimation]);
  }

  // window.domInfo.innerHTML += `<div style="display:;">useComboStart: --- ${window.logNum(avatar.useComboStart)}</div>`;

  //

  mixer.update(timeS, animSystem.animTree);
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
