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

const isDebugger = true; // Used for debug only codes.Don’t create new data structures on the avatar, to not add any more gc sweep depth in product codes.

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
const defaultHoldAnimation = 'pick_up_idle';
const defaultEmoteAnimation = 'angry';
// const defaultThrowAnimation = 'throw';
// const defaultCrouchAnimation = 'crouch';
const defaultActivateAnimation = 'grab_forward';
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
    // todo: handle activateAnimations.grab_forward.speedFactor
    // grab_forward: {animation: animations.index['grab_forward.fbx'], speedFactor: 1.2},
    // grab_down: {animation: animations.index['grab_down.fbx'], speedFactor: 1.7},
    // grab_up: {animation: animations.index['grab_up.fbx'], speedFactor: 1.2},
    // grab_left: {animation: animations.index['grab_left.fbx'], speedFactor: 1.2},
    // grab_right: {animation: animations.index['grab_right.fbx'], speedFactor: 1.2},
    // pick_up: {animation: animations.index['pick_up.fbx'], speedFactor: 1},
    grab_forward: animations.index['grab_forward.fbx'],
    grab_down: animations.index['grab_down.fbx'],
    grab_up: animations.index['grab_up.fbx'],
    grab_left: animations.index['grab_left.fbx'],
    grab_right: animations.index['grab_right.fbx'],
    pick_up: animations.index['pick_up.fbx'],
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
      const animationPtr = physx.physxWorker.createAnimation(animation.duration);
      animation.ptr = animationPtr;
      // for (const k in animation.interpolants) { // maybe wrong interpolant index order
      for (const spec of avatar.animationMappings) { // correct interpolant index order
        const {
          animationTrackName: k,
        } = spec;

        const interpolant = animation.interpolants[k];
        physx.physxWorker.createInterpolant( // todo: only need createInterpolant once globally
          animation.index, // todo: use ptr instead of index.
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

  // test ---

  avatar.createMotion = (animation, name) => {
    const motion = physx.physxWorker.createMotion(avatar.mixer, animation);
    if (isDebugger) {
      avatar.motions.push({
        motion,
        name,
        animation,
      });
    }
    return motion; // todo: return object.
  };

  avatar.createNode = (type, name) => {
    const node = physx.physxWorker.createNode(avatar.mixer, type);
    if (isDebugger) {
      avatar.nodes.push({
        node,
        name,
        type,
      });
    }
    return node; // todo: return object.
  };

  if (isDebugger) {
    avatar.motions = [];

    avatar.nodes = [];

    avatar.getMotion = motion => {
      return avatar.motions.filter(n => n.motion === motion)[0];
    };

    avatar.getNode = node => {
      return avatar.nodes.filter(n => n.node === node)[0];
    };

    avatar.logActiveNodes = node => {
      const children = window.physxWorker.getChildren(node);
      let maxWeight = 0;
      let maxIndex = -1;
      children.forEach((child, i) => {
        const weight = window.physxWorker.getWeight(child);
        if (weight === 1) console.log(1);
        if (weight > maxWeight) {
          maxWeight = weight;
          maxIndex = i;
        }
      });
      if (maxIndex >= 0) {
        const maxWeightNode = children[maxIndex];
        const nodeObject = avatar.getNode(maxWeightNode);
        if (nodeObject) {
          console.log(nodeObject, maxWeight);
          avatar.logActiveNodes(maxWeightNode);
        } else {
          const motionObject = avatar.getMotion(maxWeightNode);
          console.log(motionObject, maxWeight);
        }
      }
    };
  }

  // end test ---

  // create motions -------------------------------------------------------------

  avatar.idleMotion = avatar.createMotion(animations.index['idle.fbx'].ptr, 'idleMotion');

  avatar.walkForwardMotion = avatar.createMotion(animations.index['walking.fbx'].ptr, 'walkForwardMotion');
  avatar.walkBackwardMotion = avatar.createMotion(animations.index['walking backwards.fbx'].ptr, 'walkBackwardMotion');
  avatar.walkLeftMotion = avatar.createMotion(animations.index['left strafe walking.fbx'].ptr, 'walkLeftMotion');
  avatar.walkRightMotion = avatar.createMotion(animations.index['right strafe walking.fbx'].ptr, 'walkRightMotion');
  avatar.walkLeftMirrorMotion = avatar.createMotion(animations.index['right strafe walking reverse.fbx'].ptr, 'walkLeftMirrorMotion');
  avatar.walkRightMirrorMotion = avatar.createMotion(animations.index['left strafe walking reverse.fbx'].ptr, 'walkRightMirrorMotion');

  avatar.runForwardMotion = avatar.createMotion(animations.index['Fast Run.fbx'].ptr, 'runForwardMotion');
  avatar.runBackwardMotion = avatar.createMotion(animations.index['running backwards.fbx'].ptr, 'runBackwardMotion');
  avatar.runLeftMotion = avatar.createMotion(animations.index['left strafe.fbx'].ptr, 'runLeftMotion');
  avatar.runRightMotion = avatar.createMotion(animations.index['right strafe.fbx'].ptr, 'runRightMotion');
  avatar.runLeftMirrorMotion = avatar.createMotion(animations.index['right strafe reverse.fbx'].ptr, 'runLeftMirrorMotion');
  avatar.runRightMirrorMotion = avatar.createMotion(animations.index['left strafe reverse.fbx'].ptr, 'runRightMirrorMotion');

  avatar.crouchForwardMotion = avatar.createMotion(animations.index['Sneaking Forward.fbx'].ptr, 'crouchForwardMotion');
  avatar.crouchBackwardMotion = avatar.createMotion(animations.index['Sneaking Forward reverse.fbx'].ptr, 'crouchBackwardMotion');
  avatar.crouchLeftMotion = avatar.createMotion(animations.index['Crouched Sneaking Left.fbx'].ptr, 'crouchLeftMotion');
  avatar.crouchRightMotion = avatar.createMotion(animations.index['Crouched Sneaking Right.fbx'].ptr, 'crouchRightMotion');
  avatar.crouchLeftMirrorMotion = avatar.createMotion(animations.index['Crouched Sneaking Right reverse.fbx'].ptr, 'crouchLeftMirrorMotion');
  avatar.crouchRightMirrorMotion = avatar.createMotion(animations.index['Crouched Sneaking Left reverse.fbx'].ptr, 'crouchRightMirrorMotion');

  avatar.bowForwardMotion = avatar.createMotion(animations.index['Standing Aim Walk Forward.fbx'].ptr, 'bowForwardMotion');
  avatar.bowBackwardMotion = avatar.createMotion(animations.index['Standing Aim Walk Forward reverse.fbx'].ptr, 'bowBackwardMotion');
  avatar.bowLeftMotion = avatar.createMotion(animations.index['Standing Aim Walk Left.fbx'].ptr, 'bowLeftMotion');
  avatar.bowRightMotion = avatar.createMotion(animations.index['Standing Aim Walk Right.fbx'].ptr, 'bowRightMotion');
  avatar.bowLeftMirrorMotion = avatar.createMotion(animations.index['Standing Aim Walk Right reverse.fbx'].ptr, 'bowLeftMirrorMotion');
  avatar.bowRightMirrorMotion = avatar.createMotion(animations.index['Standing Aim Walk Left reverse.fbx'].ptr, 'bowRightMirrorMotion');

  avatar.crouchIdleMotion = avatar.createMotion(animations.index['Crouch Idle.fbx'].ptr, 'crouchIdleMotion');
  avatar.flyMotion = avatar.createMotion(floatAnimation.ptr, 'flyMotion');
  avatar.flyIdleMotion = avatar.createMotion(animations.index['fly_idle.fbx'].ptr, 'flyIdleMotion');
  avatar.flyDodgeForwardMotion = avatar.createMotion(animations.index['fly_dodge_forward.fbx'].ptr, 'flyDodgeForwardMotion');
  avatar.flyDodgeBackwardMotion = avatar.createMotion(animations.index['fly_dodge_backward.fbx'].ptr, 'flyDodgeBackwardMotion');
  avatar.flyDodgeLeftMotion = avatar.createMotion(animations.index['fly_dodge_left.fbx'].ptr, 'flyDodgeLeftMotion');
  avatar.flyDodgeRightMotion = avatar.createMotion(animations.index['fly_dodge_right.fbx'].ptr, 'flyDodgeRightMotion');
  avatar.flyDashMotion = avatar.createMotion(animations.index['fly_dash_forward.fbx'].ptr, 'flyDashMotion');
  avatar.narutoRunMotion = avatar.createMotion(narutoRunAnimations[defaultNarutoRunAnimation].ptr, 'narutoRunMotion');

  avatar.jumpMotion = avatar.createMotion(jumpAnimation.ptr, 'jumpMotion');
  physx.physxWorker.setLoop(avatar.jumpMotion, AnimationLoopType.LoopOnce);
  physx.physxWorker.stop(avatar.jumpMotion);
  physx.physxWorker.setTimeBias(avatar.jumpMotion, 0.7);
  physx.physxWorker.setSpeed(avatar.jumpMotion, 0.6);

  // use
  avatar.useMotiono = {};
  for (const k in useAnimations) {
    const animation = useAnimations[k];
    if (animation) {
      avatar.useMotiono[k] = avatar.createMotion(animation.ptr, k);
      physx.physxWorker.setLoop(avatar.useMotiono[k], AnimationLoopType.LoopOnce);
      physx.physxWorker.stop(avatar.useMotiono[k]);
    }
  }
  physx.physxWorker.setSpeed(avatar.useMotiono.combo, 1.3);
  // sit
  avatar.sitMotiono = {};
  for (const k in sitAnimations) {
    const animation = sitAnimations[k];
    if (animation) {
      avatar.sitMotiono[k] = avatar.createMotion(animation.ptr, k);
      physx.physxWorker.setLoop(avatar.sitMotiono[k], AnimationLoopType.LoopOnce);
      physx.physxWorker.stop(avatar.sitMotiono[k]);
    }
  }
  // emote
  avatar.emoteMotiono = {};
  for (const k in emoteAnimations) {
    const animation = emoteAnimations[k];
    if (animation) {
      avatar.emoteMotiono[k] = avatar.createMotion(animation.ptr, k);
      physx.physxWorker.setLoop(avatar.emoteMotiono[k], AnimationLoopType.LoopOnce);
      physx.physxWorker.stop(avatar.emoteMotiono[k]);
    }
  }
  // dance
  avatar.danceMotiono = {};
  for (const k in danceAnimations) {
    const animation = danceAnimations[k];
    if (animation) {
      avatar.danceMotiono[k] = avatar.createMotion(animation.ptr, k);
    }
  }
  // hold
  avatar.holdMotiono = {};
  for (const k in holdAnimations) {
    const animation = holdAnimations[k];
    if (animation) {
      avatar.holdMotiono[k] = avatar.createMotion(animation.ptr, k);
    }
  }
  // activate
  avatar.activateMotiono = {};
  for (const k in activateAnimations) {
    const animation = activateAnimations[k];
    if (animation) {
      avatar.activateMotiono[k] = avatar.createMotion(animation.ptr, k);
      physx.physxWorker.setLoop(avatar.activateMotiono[k], AnimationLoopType.LoopOnce);
      physx.physxWorker.stop(avatar.activateMotiono[k]);
    }
  }

  // create nodes -------------------------------------------------------------

  avatar._8DirectionsWalkNodeList = avatar.createNode(AnimationNodeType.LIST, '_8DirectionsWalkNodeList');
  physx.physxWorker.addChild(avatar._8DirectionsWalkNodeList, avatar.walkForwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsWalkNodeList, avatar.walkBackwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsWalkNodeList, avatar.walkLeftMotion);
  physx.physxWorker.addChild(avatar._8DirectionsWalkNodeList, avatar.walkRightMotion);
  physx.physxWorker.addChild(avatar._8DirectionsWalkNodeList, avatar.walkLeftMirrorMotion);
  physx.physxWorker.addChild(avatar._8DirectionsWalkNodeList, avatar.walkRightMirrorMotion);

  avatar._8DirectionsRunNodeList = avatar.createNode(AnimationNodeType.LIST, '_8DirectionsRunNodeList');
  physx.physxWorker.addChild(avatar._8DirectionsRunNodeList, avatar.runForwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsRunNodeList, avatar.runBackwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsRunNodeList, avatar.runLeftMotion);
  physx.physxWorker.addChild(avatar._8DirectionsRunNodeList, avatar.runRightMotion);
  physx.physxWorker.addChild(avatar._8DirectionsRunNodeList, avatar.runLeftMirrorMotion);
  physx.physxWorker.addChild(avatar._8DirectionsRunNodeList, avatar.runRightMirrorMotion);

  avatar._8DirectionsCrouchNodeList = avatar.createNode(AnimationNodeType.LIST, '_8DirectionsCrouchNodeList');
  physx.physxWorker.addChild(avatar._8DirectionsCrouchNodeList, avatar.crouchForwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsCrouchNodeList, avatar.crouchBackwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsCrouchNodeList, avatar.crouchLeftMotion);
  physx.physxWorker.addChild(avatar._8DirectionsCrouchNodeList, avatar.crouchRightMotion);
  physx.physxWorker.addChild(avatar._8DirectionsCrouchNodeList, avatar.crouchLeftMirrorMotion);
  physx.physxWorker.addChild(avatar._8DirectionsCrouchNodeList, avatar.crouchRightMirrorMotion);

  avatar._8DirectionsBowNodeList = avatar.createNode(AnimationNodeType.LIST, '_8DirectionsBowNodeList');
  physx.physxWorker.addChild(avatar._8DirectionsBowNodeList, avatar.bowForwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsBowNodeList, avatar.bowBackwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsBowNodeList, avatar.bowLeftMotion);
  physx.physxWorker.addChild(avatar._8DirectionsBowNodeList, avatar.bowRightMotion);
  physx.physxWorker.addChild(avatar._8DirectionsBowNodeList, avatar.bowLeftMirrorMotion);
  physx.physxWorker.addChild(avatar._8DirectionsBowNodeList, avatar.bowRightMirrorMotion);

  avatar._8DirectionsWalkRunNodeTwo = avatar.createNode(AnimationNodeType.TWO, '_8DirectionsWalkRunNodeTwo');
  physx.physxWorker.addChild(avatar._8DirectionsWalkRunNodeTwo, avatar._8DirectionsWalkNodeList);
  physx.physxWorker.addChild(avatar._8DirectionsWalkRunNodeTwo, avatar._8DirectionsRunNodeList);

  avatar.idle8DWalkRunNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'idle8DWalkRunNodeTwo');
  physx.physxWorker.addChild(avatar.idle8DWalkRunNodeTwo, avatar.idleMotion);
  physx.physxWorker.addChild(avatar.idle8DWalkRunNodeTwo, avatar._8DirectionsWalkRunNodeTwo);

  avatar.idle8DCrouchNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'idle8DCrouchNodeTwo');
  physx.physxWorker.addChild(avatar.idle8DCrouchNodeTwo, avatar.crouchIdleMotion);
  physx.physxWorker.addChild(avatar.idle8DCrouchNodeTwo, avatar._8DirectionsCrouchNodeList);

  avatar.flyForwardNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'flyForwardNodeTwo');
  physx.physxWorker.addChild(avatar.flyForwardNodeTwo, avatar.flyDodgeForwardMotion);
  physx.physxWorker.addChild(avatar.flyForwardNodeTwo, avatar.flyDashMotion);

  avatar._8DirectionsFlyNodeList = avatar.createNode(AnimationNodeType.LIST, '_8DirectionsFlyNodeList');
  physx.physxWorker.addChild(avatar._8DirectionsFlyNodeList, avatar.flyForwardNodeTwo);
  physx.physxWorker.addChild(avatar._8DirectionsFlyNodeList, avatar.flyDodgeBackwardMotion);
  physx.physxWorker.addChild(avatar._8DirectionsFlyNodeList, avatar.flyDodgeLeftMotion);
  physx.physxWorker.addChild(avatar._8DirectionsFlyNodeList, avatar.flyDodgeRightMotion);

  avatar.idle8DFlyNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'idle8DFlyNodeTwo');
  physx.physxWorker.addChild(avatar.idle8DFlyNodeTwo, avatar.flyIdleMotion);
  physx.physxWorker.addChild(avatar.idle8DFlyNodeTwo, avatar._8DirectionsFlyNodeList);

  avatar.idle8DBowNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'idle8DBowNodeTwo');
  physx.physxWorker.addChild(avatar.idle8DBowNodeTwo, avatar.useMotiono.bowIdle);
  physx.physxWorker.addChild(avatar.idle8DBowNodeTwo, avatar._8DirectionsBowNodeList);

  avatar.bowDrawLooseNodoeTwo = avatar.createNode(AnimationNodeType.TWO, 'bowDrawLooseNodoeTwo');
  physx.physxWorker.addChild(avatar.bowDrawLooseNodoeTwo, avatar.useMotiono.bowDraw);
  physx.physxWorker.addChild(avatar.bowDrawLooseNodoeTwo, avatar.useMotiono.bowLoose);

  // avatar.bowIdle8DDrawLooseNodeOverwrite = avatar.createNode(WebaverseAnimationNodeOverwrite, 'bowIdleDrawLoose', {filters: ['isTop']}); // js version
  // avatar.bowIdle8DDrawLooseNodeOverwrite = avatar.createNode(AnimationNodeType.TWO); // ~~todo: NodeType.Overwrite~~
  avatar.bowIdle8DDrawLooseNodeOverwrite = avatar.createNode(AnimationNodeType.OVERWRITE, 'bowIdle8DDrawLooseNodeOverwrite'); // todo: Selectable filters.
  physx.physxWorker.addChild(avatar.bowIdle8DDrawLooseNodeOverwrite, avatar.idle8DBowNodeTwo);
  physx.physxWorker.addChild(avatar.bowIdle8DDrawLooseNodeOverwrite, avatar.bowDrawLooseNodoeTwo);

  avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'idle8DWalkRun_BowIdle8DDrawLooseNodeTwo');
  physx.physxWorker.addChild(avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwo, avatar.idle8DWalkRunNodeTwo);
  physx.physxWorker.addChild(avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwo, avatar.bowIdle8DDrawLooseNodeOverwrite);

  avatar.defaultNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'defaultNodeTwo');
  physx.physxWorker.addChild(avatar.defaultNodeTwo, avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwo);
  physx.physxWorker.addChild(avatar.defaultNodeTwo, avatar.idle8DCrouchNodeTwo);

  avatar.holdsNodeUnitary = avatar.createNode(AnimationNodeType.UNITARY, 'holdsNodeUnitary');
  for (const k in avatar.holdMotiono) {
    const motion = avatar.holdMotiono[k];
    physx.physxWorker.addChild(avatar.holdsNodeUnitary, motion);
  }
  avatar.holdNodeFunc = avatar.createNode(AnimationNodeType.FUNC, 'holdNodeFunc');
  physx.physxWorker.addChild(avatar.holdNodeFunc, avatar.defaultNodeTwo);
  physx.physxWorker.addChild(avatar.holdNodeFunc, avatar.holdsNodeUnitary);

  avatar.emotesNodeUnitary = avatar.createNode(AnimationNodeType.UNITARY, 'emotesNodeUnitary');
  for (const k in avatar.emoteMotiono) {
    const motion = avatar.emoteMotiono[k];
    physx.physxWorker.addChild(avatar.emotesNodeUnitary, motion);
  }
  avatar.emoteNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'emoteNodeTwo');
  physx.physxWorker.addChild(avatar.emoteNodeTwo, avatar.holdNodeFunc);
  physx.physxWorker.addChild(avatar.emoteNodeTwo, avatar.emotesNodeUnitary);

  avatar.dancesNodeUnitary = avatar.createNode(AnimationNodeType.UNITARY, 'dancesNodeUnitary');
  for (const k in avatar.danceMotiono) {
    const motion = avatar.danceMotiono[k];
    physx.physxWorker.addChild(avatar.dancesNodeUnitary, motion);
  }
  avatar.danceNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'danceNodeTwo');
  physx.physxWorker.addChild(avatar.danceNodeTwo, avatar.emoteNodeTwo);
  physx.physxWorker.addChild(avatar.danceNodeTwo, avatar.dancesNodeUnitary);

  avatar.narutoRunNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'narutoRunNodeTwo');
  physx.physxWorker.addChild(avatar.narutoRunNodeTwo, avatar.danceNodeTwo);
  physx.physxWorker.addChild(avatar.narutoRunNodeTwo, avatar.narutoRunMotion);

  avatar.sitsNodeUnitary = avatar.createNode(AnimationNodeType.UNITARY, 'sitsNodeUnitary');
  for (const k in avatar.sitMotiono) {
    const motion = avatar.sitMotiono[k];
    physx.physxWorker.addChild(avatar.sitsNodeUnitary, motion);
  }
  avatar.sitNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'sitNodeTwo');
  physx.physxWorker.addChild(avatar.sitNodeTwo, avatar.narutoRunNodeTwo);
  physx.physxWorker.addChild(avatar.sitNodeTwo, avatar.sitsNodeUnitary);

  avatar.jumpNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'jumpNodeTwo');
  physx.physxWorker.addChild(avatar.jumpNodeTwo, avatar.sitNodeTwo);
  physx.physxWorker.addChild(avatar.jumpNodeTwo, avatar.jumpMotion);

  avatar.actionsNodeUnitary = avatar.createNode(AnimationNodeType.UNITARY, 'actionsNodeUnitary');
  physx.physxWorker.addChild(avatar.actionsNodeUnitary, avatar.defaultNodeTwo);

  // use
  for (const k in avatar.useMotiono) {
    if (['bowIdle', 'bowDraw', 'bowLoose'].includes(k)) continue; // these motions already added to parent at above.
    const motion = avatar.useMotiono[k];
    physx.physxWorker.addChild(avatar.actionsNodeUnitary, motion);
  }
  // activate
  for (const k in avatar.activateMotiono) {
    const motion = avatar.activateMotiono[k];
    physx.physxWorker.addChild(avatar.actionsNodeUnitary, motion);
  }

  //

  avatar.groundFlyNodeTwo = avatar.createNode(AnimationNodeType.TWO, 'groundFlyNodeTwo');
  physx.physxWorker.addChild(avatar.groundFlyNodeTwo, avatar.actionsNodeUnitary);
  physx.physxWorker.addChild(avatar.groundFlyNodeTwo, avatar.idle8DFlyNodeTwo);

  //

  // physx.physxWorker.setRootNode(avatar.mixer, avatar.groundFlyNodeTwo);
  physx.physxWorker.setRootNode(avatar.mixer, avatar.jumpNodeTwo);
  // test ------
  // physx.physxWorker.setRootNode(avatar.mixer, avatar.useMotiono.bowDraw);
  // physx.physxWorker.setRootNode(avatar.mixer, avatar.bowDrawLooseNodoeTwo);
  // physx.physxWorker.setRootNode(avatar.mixer, avatar.bowIdle8DDrawLooseNodeOverwrite);
  // physx.physxWorker.setRootNode(avatar.mixer, avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwo);
  // end test ------

  // --------------------------------------------------------------------------

  // avatar.mixer.addEventListener('finished', event => {
  // });
};

export const _updateAnimation = avatar => {
  const timeS = performance.now() / 1000;

  const angle = avatar.getAngle();
  const forwardFactor = 1 - MathUtils.clamp(Math.abs(angle) / (Math.PI / 2), 0, 1);
  const backwardFactor = 1 - MathUtils.clamp((Math.PI - Math.abs(angle)) / (Math.PI / 2), 0, 1);
  const leftFactor = 1 - MathUtils.clamp(Math.abs(angle - Math.PI / 2) / (Math.PI / 2), 0, 1);
  const rightFactor = 1 - MathUtils.clamp(Math.abs(angle - -Math.PI / 2) / (Math.PI / 2), 0, 1);
  const mirrorFactorReverse = 1 - avatar.mirrorFactor;
  const mirrorLeftFactor = avatar.mirrorFactor * leftFactor;
  const mirrorRightFactor = avatar.mirrorFactor * rightFactor;
  const mirrorLeftFactorReverse = mirrorFactorReverse * leftFactor;
  const mirrorRightFactorReverse = mirrorFactorReverse * rightFactor;

  physx.physxWorker.setWeight(avatar.walkForwardMotion, forwardFactor);
  physx.physxWorker.setWeight(avatar.walkBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.walkLeftMotion, mirrorLeftFactorReverse);
  physx.physxWorker.setWeight(avatar.walkLeftMirrorMotion, mirrorLeftFactor);
  physx.physxWorker.setWeight(avatar.walkRightMotion, mirrorRightFactorReverse);
  physx.physxWorker.setWeight(avatar.walkRightMirrorMotion, mirrorRightFactor);

  physx.physxWorker.setWeight(avatar.runForwardMotion, forwardFactor);
  physx.physxWorker.setWeight(avatar.runBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.runLeftMotion, mirrorLeftFactorReverse);
  physx.physxWorker.setWeight(avatar.runLeftMirrorMotion, mirrorLeftFactor);
  physx.physxWorker.setWeight(avatar.runRightMotion, mirrorRightFactorReverse);
  physx.physxWorker.setWeight(avatar.runRightMirrorMotion, mirrorRightFactor);

  physx.physxWorker.setWeight(avatar.crouchForwardMotion, forwardFactor);
  physx.physxWorker.setWeight(avatar.crouchBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.crouchLeftMotion, mirrorLeftFactorReverse);
  physx.physxWorker.setWeight(avatar.crouchLeftMirrorMotion, mirrorLeftFactor);
  physx.physxWorker.setWeight(avatar.crouchRightMotion, mirrorRightFactorReverse);
  physx.physxWorker.setWeight(avatar.crouchRightMirrorMotion, mirrorRightFactor);

  physx.physxWorker.setWeight(avatar.bowForwardMotion, forwardFactor);
  physx.physxWorker.setWeight(avatar.bowBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.bowLeftMotion, mirrorLeftFactorReverse);
  physx.physxWorker.setWeight(avatar.bowLeftMirrorMotion, mirrorLeftFactor);
  physx.physxWorker.setWeight(avatar.bowRightMotion, mirrorRightFactorReverse);
  physx.physxWorker.setWeight(avatar.bowRightMirrorMotion, mirrorRightFactor);

  physx.physxWorker.setFactor(avatar._8DirectionsWalkRunNodeTwo, avatar.moveFactors.walkRunFactor);
  physx.physxWorker.setFactor(avatar.idle8DWalkRunNodeTwo, avatar.moveFactors.idleWalkFactor);
  physx.physxWorker.setFactor(avatar.idle8DCrouchNodeTwo, avatar.moveFactors.idleWalkFactor);
  physx.physxWorker.setFactor(avatar.defaultNodeTwo, avatar.moveFactors.crouchFactor);
  physx.physxWorker.setFactor(avatar.idle8DBowNodeTwo, avatar.moveFactors.idleWalkFactor);

  physx.physxWorker.setWeight(avatar.flyForwardNodeTwo, forwardFactor);
  physx.physxWorker.setWeight(avatar.flyDodgeBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.flyDodgeLeftMotion, leftFactor);
  physx.physxWorker.setWeight(avatar.flyDodgeRightMotion, rightFactor);

  physx.physxWorker.setFactor(avatar.idle8DFlyNodeTwo, avatar.moveFactors.walkRunFactor);
  physx.physxWorker.setFactor(avatar.flyForwardNodeTwo, avatar.flyDashFactor);

  physx.physxWorker.setArg(avatar.holdNodeFunc, avatar.moveFactors.walkRunFactor * 0.7 + avatar.moveFactors.crouchFactor * (1 - avatar.moveFactors.idleWalkFactor) * 0.5);

  // action end event --------------------------------------------

  if (avatar.flyEnd) {
    // physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.defaultNodeTwo);
    physx.physxWorker.crossFadeTwo(avatar.groundFlyNodeTwo, 0.2, 0);
  }
  if (avatar.jumpEnd) {
    physx.physxWorker.crossFadeTwo(avatar.jumpNodeTwo, 0.2, 0);
    // if (avatar.narutoRunState) {
    //   physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.narutoRunMotion);
    // } else {
    //   physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.defaultNodeTwo);
    // }
  }

  if (avatar.narutoRunEnd) {
    physx.physxWorker.crossFadeTwo(avatar.narutoRunNodeTwo, 0.2, 0);
  }

  if (avatar.activateEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.defaultNodeTwo);
  }

  if (avatar.useEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.defaultNodeTwo);
  }

  if (avatar.useComboEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.defaultNodeTwo);
  }

  if (avatar.useEnvelopeEnd) {
    console.log('useEnvelopeEnd');
    physx.physxWorker.play(avatar.useMotiono.bowLoose);
    physx.physxWorker.setFactor(avatar.bowDrawLooseNodoeTwo, 1);
    physx.physxWorker.crossFadeTwo(avatar.bowIdle8DDrawLooseNodeOverwrite, 0.2, 1);
  }

  if (avatar.sitEnd) {
    physx.physxWorker.crossFadeTwo(avatar.sitNodeTwo, 0.2, 0);
  }

  if (avatar.emoteEnd) {
    physx.physxWorker.crossFadeTwo(avatar.emoteNodeTwo, 0.2, 0);
  }

  if (avatar.danceEnd) {
    physx.physxWorker.crossFadeTwo(avatar.danceNodeTwo, 0.2, 0);
  }

  if (avatar.holdEnd) {
    // physx.physxWorker.crossFadeTwo(avatar.holdNodeFunc, 0.2, 0);
    physx.physxWorker.setFactor(avatar.holdNodeFunc, 0);
  }

  // action start event --------------------------------------------

  if (avatar.flyStart) {
    // physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.idle8DFlyNodeTwo);
    physx.physxWorker.crossFadeTwo(avatar.groundFlyNodeTwo, 0.2, 1);
  }

  if (avatar.jumpStart) {
    physx.physxWorker.play(avatar.jumpMotion);
    physx.physxWorker.crossFadeTwo(avatar.jumpNodeTwo, 0.2, 1);
  }

  if (avatar.narutoRunStart) {
    physx.physxWorker.crossFadeTwo(avatar.narutoRunNodeTwo, 0.2, 1);
  }

  // sword
  if (avatar.useStart) {
    let useAnimationName;
    if (avatar.dashAttacking) {
      useAnimationName = 'dashAttack';
    } else {
      useAnimationName = avatar.useAnimation;
    }
    physx.physxWorker.play(avatar.useMotiono[useAnimationName]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.useMotiono[useAnimationName]);
  }

  // silsword
  if (avatar.useComboStart) {
    let useAnimationName;
    if (avatar.dashAttacking) {
      useAnimationName = 'dashAttack';
    } else {
      useAnimationName = avatar.useAnimationCombo[avatar.useAnimationIndex];
    }
    physx.physxWorker.play(avatar.useMotiono[useAnimationName]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.useMotiono[useAnimationName]);
  }

  // bow
  if (avatar.useEnvelopeStart) {
    console.log('useEnvelopeStart');
    physx.physxWorker.play(avatar.useMotiono.bowDraw);
    physx.physxWorker.setFactor(avatar.bowDrawLooseNodoeTwo, 0);
    physx.physxWorker.setFactor(avatar.bowIdle8DDrawLooseNodeOverwrite, 1);
    physx.physxWorker.crossFadeTwo(avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwo, 0.2, 1);
  }

  // sit
  if (avatar.sitStart) {
    const sitMotion = avatar.sitMotiono[avatar.sitAnimation || defaultSitAnimation];
    physx.physxWorker.play(sitMotion);
    physx.physxWorker.crossFadeUnitary(avatar.sitsNodeUnitary, 0, sitMotion);
    physx.physxWorker.crossFadeTwo(avatar.sitNodeTwo, 0.2, 1);
  }

  // emote
  if (avatar.emoteStart) {
    const emoteMotion = avatar.emoteMotiono[avatar.emoteAnimation || defaultEmoteAnimation];
    physx.physxWorker.play(emoteMotion);
    physx.physxWorker.crossFadeUnitary(avatar.emotesNodeUnitary, 0, emoteMotion);
    physx.physxWorker.crossFadeTwo(avatar.emoteNodeTwo, 0.2, 1);
  }

  // dance
  if (avatar.danceStart) {
    const danceMotion = avatar.danceMotiono[avatar.danceAnimation || defaultDanceAnimation];
    physx.physxWorker.play(danceMotion);
    physx.physxWorker.crossFadeUnitary(avatar.dancesNodeUnitary, 0, danceMotion);
    physx.physxWorker.crossFadeTwo(avatar.danceNodeTwo, 0.2, 1);
  }

  // hold
  if (avatar.holdStart) {
    const holdMotion = avatar.holdMotiono[avatar.holdAnimation || defaultHoldAnimation];
    physx.physxWorker.play(holdMotion);
    physx.physxWorker.crossFadeUnitary(avatar.holdsNodeUnitary, 0, holdMotion);
    // physx.physxWorker.crossFadeTwo(avatar.holdNodeFunc, 0.2, 1); // todo: crossFade
    physx.physxWorker.setFactor(avatar.holdNodeFunc, 1);
  }

  // activate
  if (avatar.activateStart) {
    physx.physxWorker.play(avatar.activateMotiono[avatar.activateAnimation || defaultActivateAnimation]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNodeUnitary, 0.2, avatar.activateMotiono[avatar.activateAnimation || defaultActivateAnimation]);
  }

  // do update
  const values = window.physx.physxWorker.updateAnimationMixer(avatar.mixer, timeS);
  // debugger
  let index = 0;
  for (const spec of avatar.animationMappings) {
    const {
      // animationTrackName: k,
      dst,
      // isTop,
      isPosition,
    } = spec;

    const result = values[index];

    if (isPosition) { // _clearXZ
      result[0] = 0;
      result[2] = 0;
    }

    dst.fromArray(result);

    if (isPosition) {
      dst.y *= avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
    }

    index++;
  }

  // finished event
  const finishedFlag = values[53];
  // console.log(finishedFlag)
  if (finishedFlag) {
    // debugger
    const motion = values[54];
    if (isDebugger) console.log('---finished', avatar.getMotion(motion));
    // this.dispatchEvent({
    //   type: 'finished',
    //   motion,
    // });
    // debugger;
    // console.log('finished');

    const handleAnimationEnd = (motion, trigger) => {
      if ([
        avatar.useMotiono.drink,
        avatar.useMotiono.combo,
        avatar.useMotiono.swordSideSlash,
        avatar.useMotiono.swordSideSlashStep,
        avatar.useMotiono.swordTopDownSlash,
        avatar.useMotiono.swordTopDownSlashStep,
        avatar.useMotiono.dashAttack,
      ].includes(motion)) {
        game.handleAnimationEnd();
      }
    };

    handleAnimationEnd(motion, 'finished');

    if (avatar.useEnvelopeState && motion === avatar.useMotiono.bowDraw) {
      physx.physxWorker.crossFadeTwo(avatar.bowIdle8DDrawLooseNodeOverwrite, 0.2, 0);
    }
    if (motion === avatar.useMotiono.bowLoose) {
      physx.physxWorker.crossFadeTwo(avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwo, 0.2, 0);
    }
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
