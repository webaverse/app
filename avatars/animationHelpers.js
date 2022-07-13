import {Vector3, Quaternion, AnimationClip, LoopOnce, MathUtils, LoopRepeat} from 'three';
// import metaversefile from 'metaversefile';
import {/* VRMSpringBoneImporter, VRMLookAtApplyer, */ VRMCurveMapper} from '@pixiv/three-vrm/lib/three-vrm.module.js';
// import easing from '../easing.js';
import {easing} from '../math-utils.js';
import loaders from '../loaders.js';
import {zbdecode} from 'zjs/encoding.mjs';
import physx from '../physx.js';

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
  AnimationNodeType,
  AnimationLoopType,
  // avatarInterpolationFrameRate,
  // avatarInterpolationTimeDelay,
  // avatarInterpolationNumFrames,
} from '../constants.js';
import game from '../game.js';

const localVector = new Vector3();
const localVector2 = new Vector3();

const localQuaternion = new Quaternion();
const localQuaternion2 = new Quaternion();

const identityQuaternion = new Quaternion();

let animations;
let animationStepIndices;
// let animationsBaseModel;
let createdWasmAnimations = false;
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
    dashAttack: animations.find(a => a.isDashAttack),
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
  narutoRunAnimations = {
    narutoRun: animations.find(a => a.isNarutoRun),
  };
  hurtAnimations = {
    pain_back: animations.index['pain_back.fbx'],
    pain_arch: animations.index['pain_arch.fbx'],
  };
  holdAnimations = {
    pick_up_idle: animations.index['pick_up_idle.fbx'],
  };
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
  if (!createdWasmAnimations) {
    for (const spec of avatar.animationMappings) {
      physx.physxWorker.createAnimationMapping(
        spec.isPosition,
        spec.index,
        spec.isFirstBone,
        spec.isLastBone,
        spec.isTop,
        spec.isArm,
      );
    }

    let animationIndex = 0;
    for (const fileName in animations.index) {
      const animation = animations.index[fileName];
      animation.index = animationIndex;
      const animationPointer = physx.physxWorker.createAnimation(animation.duration);
      animation.pointer = animationPointer;
      // for (const k in animation.interpolants) { // maybe wrong interpolant index order
      for (const spec of avatar.animationMappings) { // correct interpolant index order
        const {
          animationTrackName: k,
        } = spec;

        const interpolant = animation.interpolants[k];
        physx.physxWorker.createInterpolant( // todo: only need createInterpolant once globally
          animation.index, // todo: use pointer instead of index.
          interpolant.parameterPositions,
          interpolant.sampleValues,
          interpolant.valueSize,
        );
      }
      animationIndex++;
    }

    //

    createdWasmAnimations = true;
  }

  avatar.mixer = physx.physxWorker.createAnimationMixer();

  // create motions -------------------------------------------------------------
  avatar.idleMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['idle.fbx'].pointer);

  avatar.walkForwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['walking.fbx'].pointer);
  avatar.walkBackwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['walking backwards.fbx'].pointer);
  avatar.walkLeftMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['left strafe walking.fbx'].pointer);
  avatar.walkRightMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['right strafe walking.fbx'].pointer);
  avatar.walkLeftMirrorMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['right strafe walking reverse.fbx'].pointer);
  avatar.walkRightMirrorMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['left strafe walking reverse.fbx'].pointer);

  avatar.runForwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Fast Run.fbx'].pointer);
  avatar.runBackwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['running backwards.fbx'].pointer);
  avatar.runLeftMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['left strafe.fbx'].pointer);
  avatar.runRightMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['right strafe.fbx'].pointer);
  avatar.runLeftMirrorMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['right strafe reverse.fbx'].pointer);
  avatar.runRightMirrorMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['left strafe reverse.fbx'].pointer);

  avatar.crouchForwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Sneaking Forward.fbx'].pointer);
  avatar.crouchBackwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Sneaking Forward reverse.fbx'].pointer);
  avatar.crouchLeftMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Crouched Sneaking Left.fbx'].pointer);
  avatar.crouchRightMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Crouched Sneaking Right.fbx'].pointer);
  avatar.crouchLeftMirrorMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Crouched Sneaking Right reverse.fbx'].pointer);
  avatar.crouchRightMirrorMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Crouched Sneaking Left reverse.fbx'].pointer);

  avatar.bowForwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Standing Aim Walk Forward.fbx'].pointer);
  avatar.bowBackwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Standing Aim Walk Forward reverse.fbx'].pointer);
  avatar.bowLeftMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Standing Aim Walk Left.fbx'].pointer);
  avatar.bowRightMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Standing Aim Walk Right.fbx'].pointer);
  avatar.bowLeftMirrorMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Standing Aim Walk Right reverse.fbx'].pointer);
  avatar.bowRightMirrorMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Standing Aim Walk Left reverse.fbx'].pointer);

  avatar.crouchIdleMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['Crouch Idle.fbx'].pointer);
  avatar.flyMotion = physx.physxWorker.createMotion(avatar.mixer, floatAnimation.pointer);
  avatar.flyIdleMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['fly_idle.fbx'].pointer);
  avatar.flyDodgeForwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['fly_dodge_forward.fbx'].pointer);
  avatar.flyDodgeBackwardMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['fly_dodge_backward.fbx'].pointer);
  avatar.flyDodgeLeftMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['fly_dodge_left.fbx'].pointer);
  avatar.flyDodgeRightMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['fly_dodge_right.fbx'].pointer);
  avatar.flyDashMotion = physx.physxWorker.createMotion(avatar.mixer, animations.index['fly_dash_forward.fbx'].pointer);
  avatar.narutoRunMotion = physx.physxWorker.createMotion(avatar.mixer, narutoRunAnimations[defaultNarutoRunAnimation].pointer);

  avatar.jumpMotion = physx.physxWorker.createMotion(avatar.mixer, jumpAnimation.pointer);
  physx.physxWorker.setLoop(avatar.jumpMotion, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.jumpMotion);
  physx.physxWorker.setTimeBias(avatar.jumpMotion, 0.7);
  physx.physxWorker.setSpeed(avatar.jumpMotion, 1 / 0.6);

  avatar.activateMotion = physx.physxWorker.createMotion(avatar.mixer, activateAnimations.grab_forward.animation.pointer); // todo: handle activateAnimations.grab_forward.speedFactor
  physx.physxWorker.setLoop(avatar.activateMotion, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.activateMotion);

  avatar.useMotiono = {};
  for (const k in useAnimations) {
    const animation = useAnimations[k];
    if (animation) {
      avatar.useMotiono[k] = physx.physxWorker.createMotion(avatar.mixer, animation.pointer);
    }
  }
  physx.physxWorker.setLoop(avatar.useMotiono.drink, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.drink);
  physx.physxWorker.setLoop(avatar.useMotiono.combo, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.combo);
  // combo
  physx.physxWorker.setLoop(avatar.useMotiono.swordSideSlash, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.swordSideSlash);
  physx.physxWorker.setLoop(avatar.useMotiono.swordSideSlashStep, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.swordSideSlashStep);
  physx.physxWorker.setLoop(avatar.useMotiono.swordTopDownSlash, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.swordTopDownSlash);
  physx.physxWorker.setLoop(avatar.useMotiono.swordTopDownSlashStep, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.swordTopDownSlashStep);
  physx.physxWorker.setLoop(avatar.useMotiono.dashAttack, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.dashAttack);
  // envelope
  physx.physxWorker.setLoop(avatar.useMotiono.bowDraw, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.bowDraw);
  physx.physxWorker.setLoop(avatar.useMotiono.bowLoose, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.useMotiono.bowLoose);
  // sit
  avatar.sitMotiono = {};
  for (const k in sitAnimations) {
    const animation = sitAnimations[k];
    if (animation) {
      avatar.sitMotiono[k] = physx.physxWorker.createMotion(avatar.mixer, animation.pointer);
      physx.physxWorker.setLoop(avatar.sitMotiono[k], AnimationLoopType.LoopOnce);
      physx.physxWorker.stop(avatar.sitMotiono[k]);
    }
  }
  let mirrorFactor;
  if (avatar.backwardAnimationSpec) {
    const f = (now - avatar.backwardAnimationSpec.startTime) / (avatar.backwardAnimationSpec.endTime - avatar.backwardAnimationSpec.startTime);
    if (f >= 1) {
      mirrorFactor = avatar.backwardAnimationSpec.endFactor;
      avatar.backwardAnimationSpec = null;
    } else {
      mirrorFactor = avatar.backwardAnimationSpec.startFactor +
        Math.pow(
          f,
          0.5,
        ) * (avatar.backwardAnimationSpec.endFactor - avatar.backwardAnimationSpec.startFactor);
    }
  } else {
    mirrorFactor = isBackward ? 1 : 0;
  }
  // if (avatar === window.localPlayer.avatar) console.log(window.logNum(angleFactor), window.logNum(mirrorFactor));
  avatar.lastBackwardFactor = mirrorFactor;

  if (avatar.emoteAnimation !== avatar.lastEmoteAnimation) {
    avatar.lastEmoteTime = avatar.emoteAnimation ? now : 0;
  }
  avatar.lastEmoteAnimation = avatar.emoteAnimation;

  const _getHorizontalBlend = (k, lerpFn, isPosition, target) => {
    _get7wayBlend(
      keyWalkAnimationAngles,
      keyWalkAnimationAnglesMirror,
      keyRunAnimationAngles,
      keyRunAnimationAnglesMirror,
      idleAnimation,
      // mirrorFactor,
      // angleFactor,
      // walkRunFactor,
      // idleWalkFactor,
      k,
      lerpFn,
      isPosition,
      localQuaternion,
    );
    _get7wayBlend(
      keyAnimationAnglesOther,
      keyAnimationAnglesOtherMirror,
      keyAnimationAnglesOther,
      keyAnimationAnglesOtherMirror,
      idleAnimationOther,
      // mirrorFactor,
      // angleFactor,
      // walkRunFactor,
      // idleWalkFactor,
      k,
      lerpFn,
      isPosition,
      localQuaternion2,
    );

    // _get5wayBlend(keyAnimationAnglesOther, keyAnimationAnglesOtherMirror, idleAnimationOther, mirrorFactor, angleFactor, speedFactor, k, lerpFn, localQuaternion2);

    lerpFn
      .call(
        target.copy(localQuaternion),
        localQuaternion2,
        crouchFactor,
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
    if (avatar.jumpState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
        } = spec;

        const t2 = avatar.jumpTime / 1000 * 0.6 + 0.7;
        const src2 = jumpAnimation.interpolants[k];
        const v2 = src2.evaluate(t2);

        dst.fromArray(v2);
      };
    }
    if (avatar.sitState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
        } = spec;

        const sitAnimation = sitAnimations[avatar.sitAnimation || defaultSitAnimation];
        const src2 = sitAnimation.interpolants[k];
        const v2 = src2.evaluate(1);

        dst.fromArray(v2);
      };
    }
    if (avatar.narutoRunState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          isPosition,
        } = spec;

        const narutoRunAnimation = narutoRunAnimations[defaultNarutoRunAnimation];
        const src2 = narutoRunAnimation.interpolants[k];
        const t2 = (avatar.narutoRunTime / 1000 * narutoRunTimeFactor) % narutoRunAnimation.duration;
        const v2 = src2.evaluate(t2);

        dst.fromArray(v2);

        _clearXZ(dst, isPosition);
      };
    }

    if (avatar.danceFactor > 0) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          lerpFn,
          // isTop,
          isPosition,
        } = spec;

        _handleDefault(spec);

        const danceAnimation = danceAnimations[avatar.danceAnimation || defaultDanceAnimation];
        const src2 = danceAnimation.interpolants[k];
        const t2 = (now / 1000) % danceAnimation.duration;
        const v2 = src2.evaluate(t2);

        const danceFactorS = avatar.danceFactor / crouchMaxTime;
        const f = Math.min(Math.max(danceFactorS, 0), 1);
        lerpFn
          .call(
            dst,
            localQuaternion.fromArray(v2),
            f,
          );

        _clearXZ(dst, isPosition);
      };
    }

    if (avatar.emoteFactor > 0) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          lerpFn,
          // isTop,
          isPosition,
        } = spec;

        _handleDefault(spec);

        const emoteAnimation = emoteAnimations[avatar.emoteAnimation || defaultEmoteAnimation];
        const src2 = emoteAnimation.interpolants[k];
        const emoteTime = now - avatar.lastEmoteTime;
        const t2 = Math.min(emoteTime / 1000, emoteAnimation.duration);
        const v2 = src2.evaluate(t2);

        const emoteFactorS = avatar.emoteFactor / crouchMaxTime;
        const f = Math.min(Math.max(emoteFactorS, 0), 1);
        lerpFn
          .call(
            dst,
            localQuaternion.fromArray(v2),
            f,
          );

        _clearXZ(dst, isPosition);
      };
    }

    /* if (avatar.fallLoopState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
        } = spec;

        const t2 = (avatar.fallLoopTime/1000) ;
        const src2 = fallLoop.interpolants[k];
        const v2 = src2.evaluate(t2);

        dst.fromArray(v2);
      };
    } */
    if (
      avatar.useAnimation ||
      avatar.useAnimationCombo.length > 0 ||
      avatar.useAnimationEnvelope.length > 0
    ) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          isPosition,
        } = spec;

        let useAnimation;
        let t2;
        const useTimeS = avatar.useTime / 1000;
        if (avatar.useAnimation) {
          const useAnimationName = avatar.useAnimation;
          useAnimation = useAnimations[useAnimationName];
          t2 = Math.min(useTimeS, useAnimation.duration);
        } else if (avatar.useAnimationCombo.length > 0) {
          const useAnimationName = avatar.useAnimationCombo[avatar.useAnimationIndex];
          useAnimation = useAnimations[useAnimationName];
          t2 = Math.min(useTimeS, useAnimation.duration);
        } else if (avatar.useAnimationEnvelope.length > 0) {
          let totalTime = 0;
          for (let i = 0; i < avatar.useAnimationEnvelope.length - 1; i++) {
            const animationName = avatar.useAnimationEnvelope[i];
            const animation = useAnimations[animationName];
            totalTime += animation.duration;
          }

          if (totalTime > 0) {
            let animationTimeBase = 0;
            for (let i = 0; i < avatar.useAnimationEnvelope.length - 1; i++) {
              const animationName = avatar.useAnimationEnvelope[i];
              const animation = useAnimations[animationName];
              if (useTimeS < (animationTimeBase + animation.duration)) {
                useAnimation = animation;
                break;
              }
              animationTimeBase += animation.duration;
            }
            if (useAnimation !== undefined) { // first iteration
              t2 = Math.min(useTimeS - animationTimeBase, useAnimation.duration);
            } else { // loop
              const secondLastAnimationName = avatar.useAnimationEnvelope[avatar.useAnimationEnvelope.length - 2];
              useAnimation = useAnimations[secondLastAnimationName];
              t2 = (useTimeS - animationTimeBase) % useAnimation.duration;
            }
          }
        }

        _handleDefault(spec);

        if (useAnimation) {
          if (!isPosition) {
            const src2 = useAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
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
        }
      };
    } else if (avatar.hurtAnimation) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          isPosition,
        } = spec;

        const hurtAnimation = (avatar.hurtAnimation && hurtAnimations[avatar.hurtAnimation]);
        _handleDefault(spec);
        const hurtTimeS = avatar.hurtTime / 1000;
        const t2 = Math.min(hurtTimeS, hurtAnimation.duration);
        // console.log('hurtAnimation', avatar.hurtAnimation, avatar.hurtTime, hurtAnimation.duration, hurtTimeS, t2);
        if (!isPosition) {
          if (hurtAnimation) {
            const src2 = hurtAnimation.interpolants[k];
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
          const src2 = hurtAnimation.interpolants[k];
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
    } else if (avatar.aimAnimation) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          isPosition,
        } = spec;

        const aimAnimation = (avatar.aimAnimation && aimAnimations[avatar.aimAnimation]);
        _handleDefault(spec);
        const t2 = (avatar.aimTime / aimMaxTime) % aimAnimation.duration;
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
    } else if (avatar.unuseAnimation && avatar.unuseTime >= 0) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          lerpFn,
          // isTop,
          isPosition,
        } = spec;

        _handleDefault(spec);

        const unuseTimeS = avatar.unuseTime / 1000;
        const unuseAnimationName = avatar.unuseAnimation;
        const unuseAnimation = useAnimations[unuseAnimationName];
        const t2 = Math.min(unuseTimeS, unuseAnimation.duration);
        const f = Math.min(Math.max(unuseTimeS / unuseAnimation.duration, 0), 1);
        const f2 = Math.pow(1 - f, 2);

        if (!isPosition) {
          const src2 = unuseAnimation.interpolants[k];
          const v2 = src2.evaluate(t2);

  if (avatar.activateStart) {
    physx.physxWorker.play(avatar.activateMotion);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.activateMotion);
  }

  if (avatar.narutoRunStart) physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.narutoRunMotion);

  // sword
  if (avatar.useStart) {
    let useAnimationName;
    if (avatar.dashattacking) {
      useAnimationName = 'dashAttack'
    } else {
      useAnimationName = avatar.useAnimation;
    }
    physx.physxWorker.play(avatar.useMotiono[useAnimationName]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.useMotiono[useAnimationName]);
  }

  // silsword
  if (avatar.useComboStart) {
    let useAnimationName;
    if (avatar.dashattacking) {
      useAnimationName = 'dashAttack'
    } else {
      useAnimationName = avatar.useAnimationCombo[avatar.useAnimationIndex];
    }
    physx.physxWorker.play(avatar.useMotiono[useAnimationName]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.useMotiono[useAnimationName]);
  }

        dst.fromArray(v2);
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

    if (avatar.flyState || (avatar.flyTime >= 0 && avatar.flyTime < 1000)) {
      const t2 = avatar.flyTime / 1000;
      const f = avatar.flyState ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));
      const src2 = floatAnimation.interpolants[k];
      const v2 = src2.evaluate(t2 % floatAnimation.duration);

      lerpFn
        .call(
          dst,
          localQuaternion.fromArray(v2),
          f,
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

    if (avatar.activateTime > 0) {
      const localPlayer = metaversefile.useLocalPlayer();

      let defaultAnimation = 'grab_forward';

      const activateAction = localPlayer.getAction('activate');
      if (activateAction.animationName) {
        defaultAnimation = activateAction.animationName;
      }

      const activateAnimation = activateAnimations[defaultAnimation].animation;
      const src2 = activateAnimation.interpolants[k];
      const t2 = ((avatar.activateTime / 1000) * activateAnimations[defaultAnimation].speedFactor) % activateAnimation.duration;
      const v2 = src2.evaluate(t2);

      const f = avatar.activateTime > 0 ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));

      lerpFn
        .call(
          dst,
          localQuaternion.fromArray(v2),
          f,
        );
    }
  };

  for (const spec of avatar.animationMappings) {
    const {
      // animationTrackName: k,
      dst,
      // isTop,
      isPosition,
    } = spec;

    applyFn(spec);
    _blendFly(spec);
    _blendActivateAction(spec);

    // ignore all animation position except y
    if (isPosition) {
      if (!avatar.jumpState) {
        // animations position is height-relative
        dst.y *= avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
      } else {
        // force height in the jump case to overide the animation
        dst.y = avatar.height * 0.55;
      }
    }
  if (lastF >= 1) {
    game.handleAnimationEnd();
  }
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
