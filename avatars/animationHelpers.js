import {Vector3, Quaternion, AnimationClip, MathUtils} from 'three';
import metaversefile from 'metaversefile';
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

// const localVector = new Vector3();
// const localVector2 = new Vector3();

// const localQuaternion = new Quaternion();
// const localQuaternion2 = new Quaternion();

// const identityQuaternion = new Quaternion();

const isDebugger = true; // Used for debug only codes. Don’t create new data structures on the avatar, to not add any more gc sweep depth in product codes.

let animations;
let animationStepIndices;
// let animationsBaseModel;
let createdWasmAnimations = false;
let jumpAnimation;
let doubleJumpAnimation;
let fallLoopAnimation;
let floatAnimation;
let useAnimations;
let useComboAnimations;
let bowAnimations;
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
  animations = animationsJson.animations; // .map(a => AnimationClip.parse(a));
  animationStepIndices = animationsJson.animationStepIndices;
  animations.index = {};
  for (const animation of animations) {
    animations.index[animation.name] = animation;

    animation.tracks.index = {};
    for (const track of animation.tracks) {
      animation.tracks.index[track.name] = track;
    }
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
  doubleJumpAnimation = animations.find(a => a.isDoubleJump);
  fallLoopAnimation = animations.index['falling.fbx'];
  // sittingAnimation = animations.find(a => a.isSitting);
  floatAnimation = animations.find(a => a.isFloat);
  // rifleAnimation = animations.find(a => a.isRifle);
  // hitAnimation = animations.find(a => a.isHit);
  useComboAnimations = {
    swordSideIdle: animations.index['sword_idle_side.fbx'],
    swordSideIdleStatic: animations.index['sword_idle_side_static.fbx'],
    swordSideSlash: animations.index['sword_side_slash.fbx'],
    swordSideSlashStep: animations.index['sword_side_slash_step.fbx'],
    swordTopDownSlash: animations.index['sword_topdown_slash.fbx'],
    swordTopDownSlashStep: animations.index['sword_topdown_slash_step.fbx'],
    swordUndraw: animations.index['sword_undraw.fbx'],
    dashAttack: animations.find(a => a.isDashAttack),
  };
  window.useComboAnimations = useComboAnimations;
  useAnimations = {
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
  };
  window.useAnimations = useAnimations;
  bowAnimations = {
    bowDraw: animations.find(a => a.isBowDraw),
    bowIdle: animations.find(a => a.isBowIdle),
    bowLoose: animations.find(a => a.isBowLoose),
  };
  window.bowAnimations = bowAnimations;
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
  // debugger
  // const player = metaversefile.getPlayerByAppInstanceId(avatar.app.getComponent('instanceId'));
  // console.log({player});

  if (!createdWasmAnimations) { // note: just need to create wasm animations only once globally.
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
      const animationPtr = physx.physxWorker.createAnimation(animation.name, animation.duration);
      animation.ptr = animationPtr;
      // for (const k in animation.interpolants) { // maybe wrong interpolant index order
      for (const spec of avatar.animationMappings) { // correct interpolant index order
        const {
          animationTrackName: k,
        } = spec;

        const track = animation.tracks.index[k];
        const valueSize = track.type === 'vector' ? 3 : 4;
        physx.physxWorker.createInterpolant(
          // animationIndex, // todo: use ptr instead of index.
          animation.name,
          track.times,
          track.values,
          valueSize,
        );
      }
      animationIndex++;
    }

    //

    createdWasmAnimations = true;
  }

  avatar.mixerPtr = physx.physxWorker.createAnimationMixer();
  physx.physxWorker.initAvatar(avatar.mixerPtr);

  // util ---

  // avatar.createMotion = (animationPtr, name) => {
  //   const motionPtr = physx.physxWorker.createMotion(avatar.mixerPtr, animationPtr);
  //   if (isDebugger) {
  //     avatar.motions.push({
  //       motionPtr,
  //       name,
  //       animationPtr,
  //     });
  //   }
  //   return motionPtr;
  // };

  // avatar.createNode = (type, name, index) => {
  //   const nodePtr = physx.physxWorker.createNode(avatar.mixerPtr, type, index);
  //   if (isDebugger) {
  //     avatar.nodes.push({
  //       nodePtr,
  //       name,
  //       type,
  //       index,
  //     });
  //   }
  //   return nodePtr;
  // };

  if (isDebugger) {
    avatar.motions = [];

    avatar.nodes = [];

    avatar.getMotion = motionPtr => {
      return avatar.motions.filter(motion => motion.motionPtr === motionPtr)[0];
    };

    avatar.getNode = nodePtr => {
      return avatar.nodes.filter(node => node.nodePtr === nodePtr)[0];
    };

    avatar.logActiveNodes = (nodePtr, maxWeight) => {
      const node = avatar.getNode(nodePtr);
      if (node) {
        console.log(node, maxWeight);
      } else {
        const motionObject = avatar.getMotion(nodePtr);
        console.log(motionObject, maxWeight);
      }
      {
        const children = physx.physxWorker.getChildren(nodePtr);
        let maxWeight = 0;
        let maxIndex = -1;
        children.forEach((child, i) => {
          const weight = physx.physxWorker.getWeight(child);
          if (weight === 1) console.log(1);
          if (weight > maxWeight) {
            maxWeight = weight;
            maxIndex = i;
          }
        });
        if (maxIndex >= 0) {
          const maxWeightNode = children[maxIndex];
          const node = avatar.getNode(maxWeightNode);
          if (node) {
            avatar.logActiveNodes(maxWeightNode, maxWeight);
          }
        }
      }
    };
  }

  // end util ---

  const getMotions = () => {
    // avatar.idleMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'idle');

    // avatar.walkForwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'walkForward');
    // avatar.walkBackwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'walkBackward');
    // avatar.walkLeftMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'walkLeft');
    // avatar.walkRightMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'walkRight');
    // avatar.walkLeftMirrorMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'walkLeftMirror');
    // avatar.walkRightMirrorMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'walkRightMirror');

    // avatar.runForwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'runForward');
    // avatar.runBackwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'runBackward');
    // avatar.runLeftMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'runLeft');
    // avatar.runRightMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'runRight');
    // avatar.runLeftMirrorMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'runLeftMirror');
    // avatar.runRightMirrorMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'runRightMirror');

    // avatar.crouchForwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'crouchForward');
    // avatar.crouchBackwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'crouchBackward');
    // avatar.crouchLeftMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'crouchLeft');
    // avatar.crouchRightMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'crouchRight');
    // avatar.crouchLeftMirrorMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'crouchLeftMirror');
    // avatar.crouchRightMirrorMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'crouchRightMirror');

    // avatar.bowForwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'bowForward');
    // avatar.bowBackwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'bowBackward');
    // avatar.bowLeftMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'bowLeft');
    // avatar.bowRightMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'bowRight');
    // avatar.bowLeftMirrorMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'bowLeftMirror');
    // avatar.bowRightMirrorMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'bowRightMirror');

    // avatar.crouchIdleMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'crouchIdle');
    // avatar.flyMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'fly');
    // avatar.flyIdleMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'flyIdle');
    // avatar.flyDodgeForwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'flyDodgeForward');
    avatar.flyDodgeBackwardMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'flyDodgeBackward');
    avatar.flyDodgeLeftMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'flyDodgeLeft');
    avatar.flyDodgeRightMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'flyDodgeRight');
    // avatar.flyDashMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'flyDash');
    avatar.narutoRunMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'narutoRun');

    //

    avatar.jumpMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'jump');
    physx.physxWorker.setLoop(avatar.jumpMotionPtr, AnimationLoopType.LoopOnce);
    physx.physxWorker.stop(avatar.jumpMotionPtr);
    // physx.physxWorker.setTimeBias(avatar.jumpMotionPtr, 0.7);
    // physx.physxWorker.setSpeed(avatar.jumpMotionPtr, 0.6);

    avatar.doubleJumpMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'doubleJump');
    physx.physxWorker.setLoop(avatar.doubleJumpMotionPtr, AnimationLoopType.LoopOnce);
    physx.physxWorker.stop(avatar.doubleJumpMotionPtr);

    avatar.fallLoopMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'fallLoop');

    avatar.landMotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'land');
    physx.physxWorker.setLoop(avatar.landMotionPtr, AnimationLoopType.LoopOnce);
    physx.physxWorker.stop(avatar.landMotionPtr);
    physx.physxWorker.setSpeed(avatar.landMotionPtr, 0.75);
    avatar.land2MotionPtr = physx.physxWorker.getMotion(avatar.mixerPtr, 'land2');
    physx.physxWorker.setLoop(avatar.land2MotionPtr, AnimationLoopType.LoopOnce);
    physx.physxWorker.stop(avatar.land2MotionPtr);
    physx.physxWorker.setSpeed(avatar.land2MotionPtr, 1.7);

    // use
    avatar.useMotionPtro = {};
    for (const k in useAnimations) {
      const animation = useAnimations[k];
      if (animation) {
        avatar.useMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
        physx.physxWorker.setLoop(avatar.useMotionPtro[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.useMotionPtro[k]);
      }
    }
    physx.physxWorker.setSpeed(avatar.useMotionPtro.combo, 1.3);
    // useCombo
    avatar.useComboMotionPtro = {};
    for (const k in useComboAnimations) {
      const animation = useComboAnimations[k];
      if (animation) {
        avatar.useComboMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
        physx.physxWorker.setLoop(avatar.useComboMotionPtro[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.useComboMotionPtro[k]);
      }
    }
    // bow
    avatar.bowMotionPtro = {};
    for (const k in bowAnimations) {
      const animation = bowAnimations[k];
      if (animation) {
        avatar.bowMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
        physx.physxWorker.setLoop(avatar.bowMotionPtro[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.bowMotionPtro[k]);
      }
    }
    // sit
    avatar.sitMotionPtro = {};
    for (const k in sitAnimations) {
      const animation = sitAnimations[k];
      if (animation) {
        avatar.sitMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
        physx.physxWorker.setLoop(avatar.sitMotionPtro[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.sitMotionPtro[k]);
      }
    }
    // hurt
    avatar.hurtMotionPtro = {};
    for (const k in hurtAnimations) {
      const animation = hurtAnimations[k];
      if (animation) {
        avatar.hurtMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
        physx.physxWorker.setLoop(avatar.hurtMotionPtro[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.hurtMotionPtro[k]);
      }
    }
    // emote
    avatar.emoteMotionPtro = {};
    for (const k in emoteAnimations) {
      const animation = emoteAnimations[k];
      if (animation) {
        avatar.emoteMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
        physx.physxWorker.setLoop(avatar.emoteMotionPtro[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.emoteMotionPtro[k]);
      }
    }
    // dance
    avatar.danceMotionPtro = {};
    for (const k in danceAnimations) {
      const animation = danceAnimations[k];
      if (animation) {
        avatar.danceMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
      }
    }
    // hold
    avatar.holdMotionPtro = {};
    for (const k in holdAnimations) {
      const animation = holdAnimations[k];
      if (animation) {
        avatar.holdMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
      }
    }
    // activate
    avatar.activateMotionPtro = {};
    for (const k in activateAnimations) {
      const animationWithSpeedFactor = activateAnimations[k];
      if (animationWithSpeedFactor) {
        avatar.activateMotionPtro[k] = physx.physxWorker.getMotion(avatar.mixerPtr, k);
        physx.physxWorker.setLoop(avatar.activateMotionPtro[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.activateMotionPtro[k]);
        physx.physxWorker.setSpeed(avatar.activateMotionPtro[k], animationWithSpeedFactor.speedFactor);
      }
    }
  };
  getMotions();

  const getNodes = () => {
    avatar._8DirectionsWalkNodeListPtr = physx.physxWorker.getNode(avatar.mixerPtr, '_8DirectionsWalkNodeList');
    avatar._8DirectionsRunNodeListPtr = physx.physxWorker.getNode(avatar.mixerPtr, '_8DirectionsRunNodeList');
    avatar._8DirectionsCrouchNodeListPtr = physx.physxWorker.getNode(avatar.mixerPtr, '_8DirectionsCrouchNodeList');
    avatar._8DirectionsBowNodeListPtr = physx.physxWorker.getNode(avatar.mixerPtr, '_8DirectionsBowNodeList');
    avatar._8DirectionsWalkRunNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, '_8DirectionsWalkRunNodeTwo');
    avatar.idle8DWalkRunNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'idle8DWalkRunNodeTwo');
    avatar.idle8DCrouchNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'idle8DCrouchNodeTwo');
    avatar.flyForwardNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'flyForwardNodeTwo');
    avatar._8DirectionsFlyNodeListPtr = physx.physxWorker.getNode(avatar.mixerPtr, '_8DirectionsFlyNodeList');
    avatar.idle8DFlyNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'idle8DFlyNodeTwo');

    avatar.idle8DBowNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'idle8DBowNodeTwo');
    avatar.bowDrawLooseNodoeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'bowDrawLooseNodoeTwo');
    avatar.bowIdle8DDrawLooseNodeOverwritePtr = physx.physxWorker.getNode(avatar.mixerPtr, 'bowIdle8DDrawLooseNodeOverwrite');
    avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'idle8DWalkRun_BowIdle8DDrawLooseNodeTwo');
    avatar.defaultNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'defaultNodeTwo');

    // hurtAnimations
    avatar.hurtsNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'hurtsNodeSolitary');
    avatar.hurtNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'hurtNodeTwo');

    // useAnimations
    avatar.usesNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'usesNodeSolitary');
    avatar.useNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'useNodeTwo');

    // useComboAnimations
    avatar.useCombosNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'useCombosNodeSolitary');

    // emoteAnimations
    avatar.emotesNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'emotesNodeSolitary');
    avatar.emoteNodeFuncPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'emoteNodeFunc');

    // danceAnimations
    avatar.dancesNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'dancesNodeSolitary');
    avatar.danceNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'danceNodeTwo');

    avatar.narutoRunNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'narutoRunNodeTwo');

    // sitAnimations
    avatar.sitsNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'sitsNodeSolitary');
    avatar.sitNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'sitNodeTwo');

    avatar.jumpNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'jumpNodeTwo');

    avatar.doubleJumpNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'doubleJumpNodeTwo');

    avatar.groundFlyNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'groundFlyNodeTwo');

    avatar.fallLoopNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'fallLoopNodeTwo');

    avatar.landsNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'landsNodeSolitary');
    //
    avatar.landNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'landNodeTwo');

    // activateAnimations
    avatar.activatesNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'activatesNodeSolitary');
    avatar.activateNodeTwoPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'activateNodeTwo');

    // holdAnimations
    avatar.holdsNodeSolitaryPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'holdsNodeSolitary');
    avatar.holdNodeFuncPtr = physx.physxWorker.getNode(avatar.mixerPtr, 'holdNodeFunc');
  };
  getNodes();

  avatar.rootNodePtr = avatar.holdNodeFuncPtr;
  // physx.physxWorker.setRootNode(avatar.mixerPtr, avatar.rootNodePtr);

  // --------------------------------------------------------------------------

  // avatar.mixerPtr.addEventListener('finished', event => {
  // });
};

export const _updateAnimation = avatar => {
  const timeS = performance.now() / 1000;

  const player = metaversefile.getPlayerByAppInstanceId(avatar.app.getComponent('instanceId'));

  const updateValues = () => {
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

    const holdFactor = avatar.walkRunFactor * 0.7 + avatar.crouchFactor * (1 - avatar.idleWalkFactor) * 0.5;

    physx.physxWorker.updateAvatar([
      forwardFactor,
      backwardFactor,
      mirrorLeftFactorReverse,
      mirrorLeftFactor,
      mirrorRightFactorReverse,
      mirrorRightFactor,

      forwardFactor,
      backwardFactor,
      mirrorLeftFactorReverse,
      mirrorLeftFactor,
      mirrorRightFactorReverse,
      mirrorRightFactor,

      forwardFactor,
      backwardFactor,
      mirrorLeftFactorReverse,
      mirrorLeftFactor,
      mirrorRightFactorReverse,
      mirrorRightFactor,

      forwardFactor,
      backwardFactor,
      mirrorLeftFactorReverse,
      mirrorLeftFactor,
      mirrorRightFactorReverse,
      mirrorRightFactor,

      // avatar.walkRunFactor,
      // avatar.idleWalkFactor,
      // avatar.idleWalkFactor,
      // avatar.crouchFactor,
      // avatar.idleWalkFactor,

      // forwardFactor,
      // backwardFactor,
      // leftFactor,
      // rightFactor,

      // avatar.walkRunFactor,
      // avatar.flyDashFactor,

      // holdFactor,
      // avatar.idleWalkFactor,
    ]);

    physx.physxWorker.setFactor(avatar._8DirectionsWalkRunNodeTwoPtr, avatar.walkRunFactor);
    physx.physxWorker.setFactor(avatar.idle8DWalkRunNodeTwoPtr, avatar.idleWalkFactor);
    physx.physxWorker.setFactor(avatar.idle8DCrouchNodeTwoPtr, avatar.idleWalkFactor);
    physx.physxWorker.setFactor(avatar.defaultNodeTwoPtr, avatar.crouchFactor);
    physx.physxWorker.setFactor(avatar.idle8DBowNodeTwoPtr, avatar.idleWalkFactor);

    physx.physxWorker.setWeight(avatar.flyForwardNodeTwoPtr, forwardFactor);
    physx.physxWorker.setWeight(avatar.flyDodgeBackwardMotionPtr, backwardFactor);
    physx.physxWorker.setWeight(avatar.flyDodgeLeftMotionPtr, leftFactor);
    physx.physxWorker.setWeight(avatar.flyDodgeRightMotionPtr, rightFactor);

    physx.physxWorker.setFactor(avatar.idle8DFlyNodeTwoPtr, avatar.walkRunFactor);
    physx.physxWorker.setFactor(avatar.flyForwardNodeTwoPtr, avatar.flyDashFactor);

    physx.physxWorker.setArg(avatar.holdNodeFuncPtr, holdFactor);
    physx.physxWorker.setArg(avatar.emoteNodeFuncPtr, avatar.idleWalkFactor);
  };
  updateValues();

  const handleActionEndEvents = () => {
    if (avatar.landEnd) {
      // if (player === window.localPlayer) console.log('landEnd', avatar.landWithMoving);
      if (!avatar.landWithMoving) {
        physx.physxWorker.crossFadeTwo(avatar.landNodeTwoPtr, 0.05, 0);
      } else {
        physx.physxWorker.crossFadeTwo(avatar.landNodeTwoPtr, 0.15, 0);
      }
    }

    if (avatar.fallLoopEnd) {
      physx.physxWorker.crossFadeTwo(avatar.fallLoopNodeTwoPtr, 0.2, 0);
    }

    if (avatar.flyEnd) {
      physx.physxWorker.crossFadeTwo(avatar.groundFlyNodeTwoPtr, 0.2, 0);
    }

    if (avatar.jumpEnd) {
      physx.physxWorker.crossFadeTwo(avatar.jumpNodeTwoPtr, 0.2, 0);
    }

    if (avatar.doubleJumpEnd) {
      physx.physxWorker.crossFadeTwo(avatar.doubleJumpNodeTwoPtr, 0.2, 0);
    }

    if (avatar.narutoRunEnd) {
      physx.physxWorker.crossFadeTwo(avatar.narutoRunNodeTwoPtr, 0.2, 0);
    }

    if (avatar.activateEnd) {
      physx.physxWorker.crossFadeTwo(avatar.activateNodeTwoPtr, 0.2, 0);
    }

    if (avatar.useEnd) {
      physx.physxWorker.crossFadeTwo(avatar.useNodeTwoPtr, 0.2, 0);
    }

    if (avatar.useComboEnd) {
      physx.physxWorker.crossFadeSolitary(avatar.useCombosNodeSolitaryPtr, 0.2, avatar.useNodeTwoPtr);
    }

    if (avatar.useEnvelopeEnd) {
      console.log('useEnvelopeEnd');
      physx.physxWorker.play(avatar.bowMotionPtro.bowLoose);
      physx.physxWorker.setFactor(avatar.bowDrawLooseNodoeTwoPtr, 1);
      physx.physxWorker.crossFadeTwo(avatar.bowIdle8DDrawLooseNodeOverwritePtr, 0.2, 1);
    }

    if (avatar.sitEnd) {
      physx.physxWorker.crossFadeTwo(avatar.sitNodeTwoPtr, 0.2, 0);
    }

    if (avatar.emoteEnd) {
      physx.physxWorker.crossFadeTwo(avatar.emoteNodeFuncPtr, 0.2, 0);
      // physx.physxWorker.setFactor(avatar.emoteNodeFuncPtr, 0);
    }

    if (avatar.hurtEnd) {
      physx.physxWorker.crossFadeTwo(avatar.hurtNodeTwoPtr, 0.2, 0);
    }

    if (avatar.danceEnd) {
      physx.physxWorker.crossFadeTwo(avatar.danceNodeTwoPtr, 0.2, 0);
    }

    if (avatar.holdEnd) {
      physx.physxWorker.crossFadeTwo(avatar.holdNodeFuncPtr, 0.2, 0);
      // physx.physxWorker.setFactor(avatar.holdNodeFuncPtr, 0);
    }
  };
  handleActionEndEvents();

  const handleActionStartEvents = () => {
    if (avatar.landStart) {
      // if (player === window.localPlayer) console.log('landStart', avatar.landWithMoving);
      if (!avatar.landWithMoving) {
        const landMotionPtr = avatar.landMotionPtr;
        physx.physxWorker.play(landMotionPtr);
        physx.physxWorker.crossFadeSolitary(avatar.landsNodeSolitaryPtr, 0, landMotionPtr);
        physx.physxWorker.crossFadeTwo(avatar.landNodeTwoPtr, 0, 1);
      } else {
        const landMotionPtr = avatar.land2MotionPtr;
        physx.physxWorker.play(landMotionPtr);
        physx.physxWorker.crossFadeSolitary(avatar.landsNodeSolitaryPtr, 0, landMotionPtr);
        physx.physxWorker.crossFadeTwo(avatar.landNodeTwoPtr, 0.1, 1);
      }
    }

    if (avatar.fallLoopStart) {
      physx.physxWorker.crossFadeTwo(avatar.fallLoopNodeTwoPtr, 0.2, 1);
    }

    if (avatar.flyStart) {
      physx.physxWorker.crossFadeTwo(avatar.groundFlyNodeTwoPtr, 0.2, 1);
    }

    if (avatar.jumpStart) {
      physx.physxWorker.play(avatar.jumpMotionPtr);
      physx.physxWorker.crossFadeTwo(avatar.jumpNodeTwoPtr, 0.2, 1);
    }

    if (avatar.doubleJumpStart) {
      physx.physxWorker.play(avatar.doubleJumpMotionPtr);
      physx.physxWorker.crossFadeTwo(avatar.doubleJumpNodeTwoPtr, 0.2, 1);
    }

    if (avatar.narutoRunStart) {
      physx.physxWorker.crossFadeTwo(avatar.narutoRunNodeTwoPtr, 0.2, 1);
    }

    // sword
    if (avatar.useStart) {
      let useAnimationName;
      if (avatar.dashAttacking) {
        useAnimationName = 'dashAttack';
      } else {
        useAnimationName = avatar.useAnimation;
      }
      const useMotion = avatar.useMotionPtro[useAnimationName];
      physx.physxWorker.play(useMotion);
      physx.physxWorker.crossFadeSolitary(avatar.usesNodeSolitaryPtr, 0, useMotion);
      physx.physxWorker.crossFadeTwo(avatar.useNodeTwoPtr, 0.2, 1);
    }

    // silsword
    if (avatar.useComboStart) {
      let useAnimationName;
      if (avatar.dashAttacking) {
        useAnimationName = 'dashAttack';
      } else {
        useAnimationName = avatar.useAnimationCombo[avatar.useAnimationIndex];
      }
      const useMotion = avatar.useComboMotionPtro[useAnimationName];
      physx.physxWorker.play(useMotion);
      physx.physxWorker.crossFadeSolitary(avatar.useCombosNodeSolitaryPtr, 0.2, useMotion);
    }

    // bow
    if (avatar.useEnvelopeStart) {
      console.log('useEnvelopeStart');
      physx.physxWorker.play(avatar.bowMotionPtro.bowDraw);
      physx.physxWorker.setFactor(avatar.bowDrawLooseNodoeTwoPtr, 0);
      physx.physxWorker.setFactor(avatar.bowIdle8DDrawLooseNodeOverwritePtr, 1);
      physx.physxWorker.crossFadeTwo(avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwoPtr, 0.2, 1);
    }

    // sit
    if (avatar.sitStart) {
      const sitMotion = avatar.sitMotionPtro[avatar.sitAnimation || defaultSitAnimation];
      physx.physxWorker.play(sitMotion);
      physx.physxWorker.crossFadeSolitary(avatar.sitsNodeSolitaryPtr, 0, sitMotion);
      physx.physxWorker.crossFadeTwo(avatar.sitNodeTwoPtr, 0.2, 1);
    }

    // emote
    if (avatar.emoteStart) {
      const emoteMotion = avatar.emoteMotionPtro[avatar.emoteAnimation || defaultEmoteAnimation];
      physx.physxWorker.play(emoteMotion);
      physx.physxWorker.crossFadeSolitary(avatar.emotesNodeSolitaryPtr, 0, emoteMotion);
      physx.physxWorker.crossFadeTwo(avatar.emoteNodeFuncPtr, 0.2, 1);
      // physx.physxWorker.setFactor(avatar.emoteNodeFuncPtr, 1);
    }

    // hurt
    if (avatar.hurtStart) {
      const hurtMotion = avatar.hurtMotionPtro[avatar.hurtAnimation];
      physx.physxWorker.play(hurtMotion);
      physx.physxWorker.crossFadeSolitary(avatar.hurtsNodeSolitaryPtr, 0, hurtMotion);
      physx.physxWorker.crossFadeTwo(avatar.hurtNodeTwoPtr, 0.2, 1);
    }

    // dance
    if (avatar.danceStart) {
      const danceMotion = avatar.danceMotionPtro[avatar.danceAnimation || defaultDanceAnimation];
      physx.physxWorker.play(danceMotion);
      physx.physxWorker.crossFadeSolitary(avatar.dancesNodeSolitaryPtr, 0, danceMotion);
      physx.physxWorker.crossFadeTwo(avatar.danceNodeTwoPtr, 0.2, 1);
    }

    // hold
    if (avatar.holdStart) {
      const holdMotion = avatar.holdMotionPtro[avatar.holdAnimation || defaultHoldAnimation];
      physx.physxWorker.play(holdMotion);
      physx.physxWorker.crossFadeSolitary(avatar.holdsNodeSolitaryPtr, 0, holdMotion);
      physx.physxWorker.crossFadeTwo(avatar.holdNodeFuncPtr, 0.2, 1);
      // physx.physxWorker.setFactor(avatar.holdNodeFuncPtr, 1);
    }

    // activate
    if (avatar.activateStart) {
      const activateMotion = avatar.activateMotionPtro[avatar.activateAnimation || defaultActivateAnimation];
      physx.physxWorker.play(activateMotion);
      physx.physxWorker.crossFadeSolitary(avatar.activatesNodeSolitaryPtr, 0, activateMotion);
      physx.physxWorker.crossFadeTwo(avatar.activateNodeTwoPtr, 0.2, 1);
    }
  };
  handleActionStartEvents();

  let resultValues;
  const doUpdate = () => {
    resultValues = physx.physxWorker.updateAnimationMixer(avatar.mixerPtr, timeS);
    let index = 0;
    for (const spec of avatar.animationMappings) {
      const {
        // animationTrackName: k,
        dst,
        // isTop,
        isPosition,
      } = spec;

      const result = resultValues[index];

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
  };
  doUpdate();

  const handleFinishedEvent = () => {
    const finishedFlag = resultValues[53];
    // console.log(finishedFlag)
    if (finishedFlag) {
      const motion = resultValues[54];
      // if (isDebugger) console.log('---finished', avatar.getMotion(motion));

      // this.dispatchEvent({
      //   type: 'finished',
      //   motion,
      // });
      // debugger;
      // console.log('finished');

      const handleAnimationEnd = (motion, trigger) => {
        if ([
          avatar.useMotionPtro.drink,
          avatar.useMotionPtro.combo,
          avatar.useMotionPtro.dashAttack,
          avatar.useComboMotionPtro.swordSideSlash,
          avatar.useComboMotionPtro.swordSideSlashStep,
          avatar.useComboMotionPtro.swordTopDownSlash,
          avatar.useComboMotionPtro.swordTopDownSlashStep,
          avatar.useComboMotionPtro.dashAttack,
        ].includes(motion)) {
          game.handleAnimationEnd();
        }
      };

      handleAnimationEnd(motion, 'finished');

      if (avatar.useEnvelopeState && motion === avatar.bowMotionPtro.bowDraw) {
        physx.physxWorker.crossFadeTwo(avatar.bowIdle8DDrawLooseNodeOverwritePtr, 0.2, 0);
      }
      if (motion === avatar.bowMotionPtro.bowLoose) {
        physx.physxWorker.crossFadeTwo(avatar.idle8DWalkRun_BowIdle8DDrawLooseNodeTwoPtr, 0.2, 0);
      }
      if (motion === avatar.landMotionPtr || motion === avatar.land2MotionPtr) {
        // console.log('land finished', player);
        player?.removeAction('land');
      }
      for (const key in avatar.hurtMotionPtro) {
        const hurtMotion = avatar.hurtMotionPtro[key];
        if (motion === hurtMotion) {
          player?.removeAction('hurt');
          break;
        }
      }
    }
  };
  handleFinishedEvent();
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

/* const _localizeMatrixWorld = bone => {
  bone.matrix.copy(bone.matrixWorld);
  if (bone.parent) {
    bone.matrix.premultiply(bone.parent.matrixWorld.clone().invert());
  }
  bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);

  for (let i = 0; i < bone.children.length; i++) {
    _localizeMatrixWorld(bone.children[i]);
  }
}; */

// const crouchMagnitude = 0.2;
/* const animationsSelectMap = {
  crouch: {
    'Crouch Idle.fbx': new Vector3(0, 0, 0),
    'Sneaking Forward.fbx': new Vector3(0, 0, -crouchMagnitude),
    'Sneaking Forward reverse.fbx': new Vector3(0, 0, crouchMagnitude),
    'Crouched Sneaking Left.fbx': new Vector3(-crouchMagnitude, 0, 0),
    'Crouched Sneaking Right.fbx': new Vector3(crouchMagnitude, 0, 0),
  },
  stand: {
    'idle.fbx': new Vector3(0, 0, 0),
    'jump.fbx': new Vector3(0, 1, 0),

    'left strafe walking.fbx': new Vector3(-0.5, 0, 0),
    'left strafe.fbx': new Vector3(-1, 0, 0),
    'right strafe walking.fbx': new Vector3(0.5, 0, 0),
    'right strafe.fbx': new Vector3(1, 0, 0),

    'Fast Run.fbx': new Vector3(0, 0, -1),
    'walking.fbx': new Vector3(0, 0, -0.5),

    'running backwards.fbx': new Vector3(0, 0, 1),
    'walking backwards.fbx': new Vector3(0, 0, 0.5),

    'left strafe walking reverse.fbx': new Vector3(-Infinity, 0, 0),
    'left strafe reverse.fbx': new Vector3(-Infinity, 0, 0),
    'right strafe walking reverse.fbx': new Vector3(Infinity, 0, 0),
    'right strafe reverse.fbx': new Vector3(Infinity, 0, 0),
  },
};
const animationsDistanceMap = {
  'idle.fbx': new Vector3(0, 0, 0),
  'jump.fbx': new Vector3(0, 1, 0),

  'left strafe walking.fbx': new Vector3(-0.5, 0, 0),
  'left strafe.fbx': new Vector3(-1, 0, 0),
  'right strafe walking.fbx': new Vector3(0.5, 0, 0),
  'right strafe.fbx': new Vector3(1, 0, 0),

  'Fast Run.fbx': new Vector3(0, 0, -1),
  'walking.fbx': new Vector3(0, 0, -0.5),

  'running backwards.fbx': new Vector3(0, 0, 1),
  'walking backwards.fbx': new Vector3(0, 0, 0.5),

  'left strafe walking reverse.fbx': new Vector3(-1, 0, 1).normalize().multiplyScalar(2),
  'left strafe reverse.fbx': new Vector3(-1, 0, 1).normalize().multiplyScalar(3),
  'right strafe walking reverse.fbx': new Vector3(1, 0, 1).normalize().multiplyScalar(2),
  'right strafe reverse.fbx': new Vector3(1, 0, 1).normalize().multiplyScalar(3),

  'Crouch Idle.fbx': new Vector3(0, 0, 0),
  'Sneaking Forward.fbx': new Vector3(0, 0, -crouchMagnitude),
  'Sneaking Forward reverse.fbx': new Vector3(0, 0, crouchMagnitude),
  'Crouched Sneaking Left.fbx': new Vector3(-crouchMagnitude, 0, 0),
  'Crouched Sneaking Left reverse.fbx': new Vector3(-crouchMagnitude, 0, crouchMagnitude),
  'Crouched Sneaking Right.fbx': new Vector3(crouchMagnitude, 0, 0),
  'Crouched Sneaking Right reverse.fbx': new Vector3(crouchMagnitude, 0, crouchMagnitude),
}; */

/* const _findBoneDeep = (bones, boneName) => {
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
}; */

/* const copySkeleton = (src, dst) => {
  for (let i = 0; i < src.bones.length; i++) {
    const srcBone = src.bones[i];
    const dstBone = _findBoneDeep(dst.bones, srcBone.name);
    dstBone.matrixWorld.copy(srcBone.matrixWorld);
  }

  // const armature = dst.bones[0].parent;
  // _localizeMatrixWorld(armature);

  dst.calculateInverses();
}; */

/* const _exportBone = bone => {
  return [bone.name, bone.position.toArray().concat(bone.quaternion.toArray()).concat(bone.scale.toArray()), bone.children.map(b => _exportBone(b))];
};
const _exportSkeleton = skeleton => {
  const hips = _findHips(skeleton);
  const armature = _findArmature(hips);
  return JSON.stringify(_exportBone(armature));
};
const _importObject = (b, Cons, ChildCons) => {
  const [name, array, children] = b;
  const bone = new Cons();
  bone.name = name;
  bone.position.fromArray(array, 0);
  bone.quaternion.fromArray(array, 3);
  bone.scale.fromArray(array, 3+4);
  for (let i = 0; i < children.length; i++) {
    bone.add(_importObject(children[i], ChildCons, ChildCons));
  }
  return bone;
};
const _importArmature = b => _importObject(b, Object3D, Bone);
const _importSkeleton = s => {
  const armature = _importArmature(JSON.parse(s));
  return new Skeleton(armature.children);
}; */
