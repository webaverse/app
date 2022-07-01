import {Vector3, Quaternion, AnimationClip, LoopOnce, MathUtils, LoopRepeat} from 'three';
import metaversefile from 'metaversefile';
import {/* VRMSpringBoneImporter, VRMLookAtApplyer, */ VRMCurveMapper} from '@pixiv/three-vrm/lib/three-vrm.module.js';
// import easing from '../easing.js';
import {easing} from '../math-utils.js';
import loaders from '../loaders.js';
import {zbdecode} from 'zjs/encoding.mjs';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer.js';
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

export const _createAnimation = avatar => {
  if (!createdWasmAnimations) {
    for (const spec of avatar.animationMappings) {
      physx.physxWorker.createAnimationMapping(
        spec.isPosition,
        spec.index,
        spec.isFirstBone,
        spec.isLastBone,
      );
    }

    // const walkForwardAnimation = animations.index['walking.fbx'];
    // // let index = 0;
    // physx.physxWorker.createAnimation();
    // for (const k in walkForwardAnimation.interpolants) {
    //   // console.log('idle', k);
    //   const interpolant = walkForwardAnimation.interpolants[k];
    //   // debugger
    //   physx.physxWorker.createInterpolant( // todo: only need createInterpolant once globally
    //     0,
    //     interpolant.parameterPositions,
    //     interpolant.sampleValues,
    //     interpolant.valueSize,
    //   );
    //   // index++;
    // }

    // const flyAnimation = animations.index['treading water.fbx'];
    // // let index = 0;
    // physx.physxWorker.createAnimation();
    // for (const k in flyAnimation.interpolants) {
    //   // debugger
    //   const interpolant = flyAnimation.interpolants[k];
    //   physx.physxWorker.createInterpolant( // todo: only need createInterpolant once globally
    //     1,
    //     interpolant.parameterPositions,
    //     interpolant.sampleValues,
    //     interpolant.valueSize,
    //   );
    //   // index++;
    // }

    // debugger;

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

        // debugger
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

    /* interpolant index order, sample as AnimationMapping.js
      0 mixamorigHips.position
      1 mixamorigHips.quaternion
      2 mixamorigSpine.quaternion
      3 mixamorigSpine1.quaternion
      4 mixamorigSpine2.quaternion
      5 mixamorigNeck.quaternion
      6 mixamorigHead.quaternion
      7 mixamorigLeftShoulder.quaternion
      8 mixamorigLeftArm.quaternion
      9 mixamorigLeftForeArm.quaternion
      10 mixamorigLeftHand.quaternion
      11 mixamorigLeftHandMiddle1.quaternion
      12 mixamorigLeftHandMiddle2.quaternion
      13 mixamorigLeftHandMiddle3.quaternion
      14 mixamorigLeftHandThumb1.quaternion
      15 mixamorigLeftHandThumb2.quaternion
      16 mixamorigLeftHandThumb3.quaternion
      17 mixamorigLeftHandIndex1.quaternion
      18 mixamorigLeftHandIndex2.quaternion
      19 mixamorigLeftHandIndex3.quaternion
      20 mixamorigLeftHandRing1.quaternion
      21 mixamorigLeftHandRing2.quaternion
      22 mixamorigLeftHandRing3.quaternion
      23 mixamorigLeftHandPinky1.quaternion
      24 mixamorigLeftHandPinky2.quaternion
      25 mixamorigLeftHandPinky3.quaternion
      26 mixamorigRightShoulder.quaternion
      27 mixamorigRightArm.quaternion
      28 mixamorigRightForeArm.quaternion
      29 mixamorigRightHand.quaternion
      30 mixamorigRightHandMiddle1.quaternion
      31 mixamorigRightHandMiddle2.quaternion
      32 mixamorigRightHandMiddle3.quaternion
      33 mixamorigRightHandThumb1.quaternion
      34 mixamorigRightHandThumb2.quaternion
      35 mixamorigRightHandThumb3.quaternion
      36 mixamorigRightHandIndex1.quaternion
      37 mixamorigRightHandIndex2.quaternion
      38 mixamorigRightHandIndex3.quaternion
      39 mixamorigRightHandRing1.quaternion
      40 mixamorigRightHandRing2.quaternion
      41 mixamorigRightHandRing3.quaternion
      42 mixamorigRightHandPinky1.quaternion
      43 mixamorigRightHandPinky2.quaternion
      44 mixamorigRightHandPinky3.quaternion
      45 mixamorigRightUpLeg.quaternion
      46 mixamorigRightLeg.quaternion
      47 mixamorigRightFoot.quaternion
      48 mixamorigRightToeBase.quaternion
      49 mixamorigLeftUpLeg.quaternion
      50 mixamorigLeftLeg.quaternion
      51 mixamorigLeftFoot.quaternion
      52 mixamorigLeftToeBase.quaternion
    */

    physx.physxWorker.createAnimationMixer(
      0,
    );

    //

    // const walkFlyNodePointer = physx.physxWorker.createNode();
    // physx.physxWorker.addChild(walkFlyNodePointer, animations.index["walking.fbx"]);
    // physx.physxWorker.addChild(walkFlyNodePointer, animations.index["treading water.fbx"]);

    // const crouchNodePointer = physx.physxWorker.createNode();
    // physx.physxWorker.addChild(crouchNodePointer, walkFlyNodePointer);
    // physx.physxWorker.addChild(crouchNodePointer, animations.index["Crouch Idle.fbx"]);

    // // physx.physxWorker.setAnimTree(crouchNodePointer);
    // physx.physxWorker.setAnimTree(walkFlyNodePointer);
    // debugger

    //

    // debugger
    // window.walkMotion = physx.physxWorker.createMotion(animations.index["walking.fbx"].pointer); // 96
    // window.flyMotion = physx.physxWorker.createMotion(animations.index["treading water.fbx"].pointer); // 92
    // window.crouchMotion = physx.physxWorker.createMotion(animations.index["Crouch Idle.fbx"].pointer); // 9

    // window.walkFlyNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    // physx.physxWorker.addChild(walkFlyNode, walkMotion);
    // physx.physxWorker.addChild(walkFlyNode, flyMotion);

    // // window._8DirectionsCrouchNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    // // physx.physxWorker.addChild(_8DirectionsCrouchNode, walkFlyNode);
    // // physx.physxWorker.addChild(_8DirectionsCrouchNode, crouchMotion);

    // // window.actionsNode = physx.physxWorker.createNode(AnimationNodeType.UNITARY);
    // // physx.physxWorker.addChild(actionsNode, walkMotion);
    // // physx.physxWorker.addChild(actionsNode, flyMotion);
    // // physx.physxWorker.addChild(actionsNode, crouchMotion);

    // physx.physxWorker.setAnimTree(walkFlyNode);

    // create motions -------------------------------------------------------------
    avatar.idleMotion = physx.physxWorker.createMotion(animations.index['idle.fbx'].pointer);

    avatar.walkForwardMotion = physx.physxWorker.createMotion(animations.index['walking.fbx'].pointer);
    avatar.walkBackwardMotion = physx.physxWorker.createMotion(animations.index['walking backwards.fbx'].pointer);
    avatar.walkLeftMotion = physx.physxWorker.createMotion(animations.index['left strafe walking.fbx'].pointer);
    avatar.walkRightMotion = physx.physxWorker.createMotion(animations.index['right strafe walking.fbx'].pointer);
    avatar.walkLeftMirrorMotion = physx.physxWorker.createMotion(animations.index['right strafe walking reverse.fbx'].pointer);
    avatar.walkRightMirrorMotion = physx.physxWorker.createMotion(animations.index['left strafe walking reverse.fbx'].pointer);

    avatar.runForwardMotion = physx.physxWorker.createMotion(animations.index['Fast Run.fbx'].pointer);
    avatar.runBackwardMotion = physx.physxWorker.createMotion(animations.index['running backwards.fbx'].pointer);
    avatar.runLeftMotion = physx.physxWorker.createMotion(animations.index['left strafe.fbx'].pointer);
    avatar.runRightMotion = physx.physxWorker.createMotion(animations.index['right strafe.fbx'].pointer);
    avatar.runLeftMirrorMotion = physx.physxWorker.createMotion(animations.index['right strafe reverse.fbx'].pointer);
    avatar.runRightMirrorMotion = physx.physxWorker.createMotion(animations.index['left strafe reverse.fbx'].pointer);

    avatar.crouchForwardMotion = physx.physxWorker.createMotion(animations.index['Sneaking Forward.fbx'].pointer);
    avatar.crouchBackwardMotion = physx.physxWorker.createMotion(animations.index['Sneaking Forward reverse.fbx'].pointer);
    avatar.crouchLeftMotion = physx.physxWorker.createMotion(animations.index['Crouched Sneaking Left.fbx'].pointer);
    avatar.crouchRightMotion = physx.physxWorker.createMotion(animations.index['Crouched Sneaking Right.fbx'].pointer);
    avatar.crouchLeftMirrorMotion = physx.physxWorker.createMotion(animations.index['Crouched Sneaking Right reverse.fbx'].pointer);
    avatar.crouchRightMirrorMotion = physx.physxWorker.createMotion(animations.index['Crouched Sneaking Left reverse.fbx'].pointer);

    avatar.bowForwardMotion = physx.physxWorker.createMotion(animations.index['Standing Aim Walk Forward.fbx'].pointer);
    avatar.bowBackwardMotion = physx.physxWorker.createMotion(animations.index['Standing Aim Walk Forward reverse.fbx'].pointer);
    avatar.bowLeftMotion = physx.physxWorker.createMotion(animations.index['Standing Aim Walk Left.fbx'].pointer);
    avatar.bowRightMotion = physx.physxWorker.createMotion(animations.index['Standing Aim Walk Right.fbx'].pointer);
    avatar.bowLeftMirrorMotion = physx.physxWorker.createMotion(animations.index['Standing Aim Walk Right reverse.fbx'].pointer);
    avatar.bowRightMirrorMotion = physx.physxWorker.createMotion(animations.index['Standing Aim Walk Left reverse.fbx'].pointer);

    avatar.crouchIdleMotion = physx.physxWorker.createMotion(animations.index['Crouch Idle.fbx'].pointer);
    avatar.flyMotion = physx.physxWorker.createMotion(floatAnimation.pointer);
    avatar.flyIdleMotion = physx.physxWorker.createMotion(animations.index['fly_idle.fbx'].pointer);
    avatar.flyDodgeForwardMotion = physx.physxWorker.createMotion(animations.index['fly_dodge_forward.fbx'].pointer);
    avatar.flyDodgeBackwardMotion = physx.physxWorker.createMotion(animations.index['fly_dodge_backward.fbx'].pointer);
    avatar.flyDodgeLeftMotion = physx.physxWorker.createMotion(animations.index['fly_dodge_left.fbx'].pointer);
    avatar.flyDodgeRightMotion = physx.physxWorker.createMotion(animations.index['fly_dodge_right.fbx'].pointer);
    avatar.flyDashMotion = physx.physxWorker.createMotion(animations.index['fly_dash_forward.fbx'].pointer);
    avatar.narutoRunMotion = physx.physxWorker.createMotion(narutoRunAnimations[defaultNarutoRunAnimation].pointer);

    avatar.jumpMotion = physx.physxWorker.createMotion(jumpAnimation.pointer);
    physx.physxWorker.setLoop(avatar.jumpMotion, AnimationLoopType.LoopOnce);
    physx.physxWorker.stop(avatar.jumpMotion);
    physx.physxWorker.setTimeBias(avatar.jumpMotion, 0.7);
    physx.physxWorker.setSpeed(avatar.jumpMotion, 1 / 0.6);

    avatar.activateMotion = physx.physxWorker.createMotion(activateAnimations.grab_forward.animation.pointer); // todo: handle activateAnimations.grab_forward.speedFactor
    physx.physxWorker.setLoop(avatar.activateMotion, AnimationLoopType.LoopOnce);
    physx.physxWorker.stop(avatar.activateMotion);

    avatar.useMotiono = {};
    for (const k in useAnimations) {
      const animation = useAnimations[k];
      if (animation) {
        avatar.useMotiono[k] = physx.physxWorker.createMotion(animation.pointer);
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
        avatar.sitMotiono[k] = physx.physxWorker.createMotion(animation.pointer);
        physx.physxWorker.setLoop(avatar.sitMotiono[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.sitMotiono[k]);
      }
    }
    // emote
    avatar.emoteMotiono = {};
    for (const k in emoteAnimations) {
      const animation = emoteAnimations[k];
      if (animation) {
        avatar.emoteMotiono[k] = physx.physxWorker.createMotion(animation.pointer);
        physx.physxWorker.setLoop(avatar.emoteMotiono[k], AnimationLoopType.LoopOnce);
        physx.physxWorker.stop(avatar.emoteMotiono[k]);
      }
    }
    // dance
    avatar.danceMotiono = {};
    for (const k in danceAnimations) {
      const animation = danceAnimations[k];
      if (animation) {
        avatar.danceMotiono[k] = physx.physxWorker.createMotion(animation.pointer);
      }
    }

    // create nodes -------------------------------------------------------------

    // avatar._8DirectionsWalkNode = avatar.mixer.createNode(WebaverseAnimationNodeBlendList, 'walk');
    avatar._8DirectionsWalkNode = physx.physxWorker.createNode(AnimationNodeType.LIST);
    physx.physxWorker.addChild(avatar._8DirectionsWalkNode, avatar.walkForwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsWalkNode, avatar.walkBackwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsWalkNode, avatar.walkLeftMotion);
    physx.physxWorker.addChild(avatar._8DirectionsWalkNode, avatar.walkRightMotion);
    physx.physxWorker.addChild(avatar._8DirectionsWalkNode, avatar.walkLeftMirrorMotion);
    physx.physxWorker.addChild(avatar._8DirectionsWalkNode, avatar.walkRightMirrorMotion);

    avatar._8DirectionsRunNode = physx.physxWorker.createNode(AnimationNodeType.LIST);
    physx.physxWorker.addChild(avatar._8DirectionsRunNode, avatar.runForwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsRunNode, avatar.runBackwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsRunNode, avatar.runLeftMotion);
    physx.physxWorker.addChild(avatar._8DirectionsRunNode, avatar.runRightMotion);
    physx.physxWorker.addChild(avatar._8DirectionsRunNode, avatar.runLeftMirrorMotion);
    physx.physxWorker.addChild(avatar._8DirectionsRunNode, avatar.runRightMirrorMotion);

    avatar._8DirectionsCrouchNode = physx.physxWorker.createNode(AnimationNodeType.LIST);
    physx.physxWorker.addChild(avatar._8DirectionsCrouchNode, avatar.crouchForwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsCrouchNode, avatar.crouchBackwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsCrouchNode, avatar.crouchLeftMotion);
    physx.physxWorker.addChild(avatar._8DirectionsCrouchNode, avatar.crouchRightMotion);
    physx.physxWorker.addChild(avatar._8DirectionsCrouchNode, avatar.crouchLeftMirrorMotion);
    physx.physxWorker.addChild(avatar._8DirectionsCrouchNode, avatar.crouchRightMirrorMotion);

    avatar._8DirectionsBowNode = physx.physxWorker.createNode(AnimationNodeType.LIST);
    physx.physxWorker.addChild(avatar._8DirectionsBowNode, avatar.bowForwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsBowNode, avatar.bowBackwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsBowNode, avatar.bowLeftMotion);
    physx.physxWorker.addChild(avatar._8DirectionsBowNode, avatar.bowRightMotion);
    physx.physxWorker.addChild(avatar._8DirectionsBowNode, avatar.bowLeftMirrorMotion);
    physx.physxWorker.addChild(avatar._8DirectionsBowNode, avatar.bowRightMirrorMotion);

    avatar._8DirectionsWalkRunNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar._8DirectionsWalkRunNode, avatar._8DirectionsWalkNode);
    physx.physxWorker.addChild(avatar._8DirectionsWalkRunNode, avatar._8DirectionsRunNode);

    avatar.idle8DWalkRunNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.idle8DWalkRunNode, avatar.idleMotion);
    physx.physxWorker.addChild(avatar.idle8DWalkRunNode, avatar._8DirectionsWalkRunNode);

    avatar.idle8DCrouchNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.idle8DCrouchNode, avatar.crouchIdleMotion);
    physx.physxWorker.addChild(avatar.idle8DCrouchNode, avatar._8DirectionsCrouchNode);

    avatar.flyForwardNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.flyForwardNode, avatar.flyDodgeForwardMotion);
    physx.physxWorker.addChild(avatar.flyForwardNode, avatar.flyDashMotion);

    avatar._8DirectionsFlyNode = physx.physxWorker.createNode(AnimationNodeType.LIST);
    physx.physxWorker.addChild(avatar._8DirectionsFlyNode, avatar.flyForwardNode);
    physx.physxWorker.addChild(avatar._8DirectionsFlyNode, avatar.flyDodgeBackwardMotion);
    physx.physxWorker.addChild(avatar._8DirectionsFlyNode, avatar.flyDodgeLeftMotion);
    physx.physxWorker.addChild(avatar._8DirectionsFlyNode, avatar.flyDodgeRightMotion);

    avatar.idle8DFlyNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.idle8DFlyNode, avatar.flyIdleMotion);
    physx.physxWorker.addChild(avatar.idle8DFlyNode, avatar._8DirectionsFlyNode);

    avatar.idle8DBowNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.idle8DBowNode, avatar.useMotiono.bowIdle);
    physx.physxWorker.addChild(avatar.idle8DBowNode, avatar._8DirectionsBowNode);

    avatar.bowDrawLooseNodoe = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.bowDrawLooseNodoe, avatar.useMotiono.bowDraw);
    physx.physxWorker.addChild(avatar.bowDrawLooseNodoe, avatar.useMotiono.bowLoose);

    // avatar.bowIdle8DDrawLooseNode = avatar.mixer.createNode(WebaverseAnimationNodeOverwrite, 'bowIdleDrawLoose', {filters: ['isTop']});
    avatar.bowIdle8DDrawLooseNode = physx.physxWorker.createNode(AnimationNodeType.TWO); // todo: NodeType.Overwrite
    physx.physxWorker.addChild(avatar.bowIdle8DDrawLooseNode, avatar.idle8DBowNode);
    physx.physxWorker.addChild(avatar.bowIdle8DDrawLooseNode, avatar.bowDrawLooseNodoe);

    avatar.idle8DWalkRun_BowIdle8DDrawLooseNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.idle8DWalkRun_BowIdle8DDrawLooseNode, avatar.idle8DWalkRunNode);
    physx.physxWorker.addChild(avatar.idle8DWalkRun_BowIdle8DDrawLooseNode, avatar.bowIdle8DDrawLooseNode);

    avatar.defaultNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.defaultNode, avatar.idle8DWalkRun_BowIdle8DDrawLooseNode);
    // physx.physxWorker.addChild(avatar.defaultNode, avatar.idle8DWalkRunNode);
    physx.physxWorker.addChild(avatar.defaultNode, avatar.idle8DCrouchNode);

    avatar.actionsNode = physx.physxWorker.createNode(AnimationNodeType.UNITARY);
    physx.physxWorker.addChild(avatar.actionsNode, avatar.defaultNode);
    physx.physxWorker.addChild(avatar.actionsNode, avatar.jumpMotion);
    physx.physxWorker.addChild(avatar.actionsNode, avatar.idle8DFlyNode);
    physx.physxWorker.addChild(avatar.actionsNode, avatar.narutoRunMotion);
    physx.physxWorker.addChild(avatar.actionsNode, avatar.activateMotion);
    // useMotiono
    physx.physxWorker.addChild(avatar.actionsNode, avatar.useMotiono.drink);
    // // sword
    physx.physxWorker.addChild(avatar.actionsNode, avatar.useMotiono.combo);
    // // silsword combo
    physx.physxWorker.addChild(avatar.actionsNode, avatar.useMotiono.swordSideSlash);
    physx.physxWorker.addChild(avatar.actionsNode, avatar.useMotiono.swordSideSlashStep);
    physx.physxWorker.addChild(avatar.actionsNode, avatar.useMotiono.swordTopDownSlash);
    physx.physxWorker.addChild(avatar.actionsNode, avatar.useMotiono.swordTopDownSlashStep);

    // sit
    for (const k in avatar.sitMotiono) {
      const motion = avatar.sitMotiono[k];
      physx.physxWorker.addChild(avatar.actionsNode, motion);
    }
    // emote
    for (const k in avatar.emoteMotiono) {
      const motion = avatar.emoteMotiono[k];
      physx.physxWorker.addChild(avatar.actionsNode, motion);
    }
    // dance
    for (const k in avatar.danceMotiono) {
      const motion = avatar.danceMotiono[k];
      physx.physxWorker.addChild(avatar.actionsNode, motion);
    }

    //

    physx.physxWorker.setAnimTree(avatar.actionsNode);
    // test ------
    // physx.physxWorker.setAnimTree(avatar.useMotiono.bowDraw);
    // physx.physxWorker.setAnimTree(avatar.bowDrawLooseNodoe);
    // physx.physxWorker.setAnimTree(avatar.bowIdle8DDrawLooseNode);
    // physx.physxWorker.setAnimTree(avatar.idle8DWalkRun_BowIdle8DDrawLooseNode);
    // end test ------

    // --------------------------------------------------------------------------

    createdWasmAnimations = true;
  }

  avatar.mixer = new WebaverseAnimationMixer(avatar); // todo: Del

  const handleAnimationEnd = (motion, trigger) => {
    if ([
      avatar.useMotiono.drink,
      avatar.useMotiono.combo,
      avatar.useMotiono.swordSideSlash,
      avatar.useMotiono.swordSideSlashStep,
      avatar.useMotiono.swordTopDownSlash,
      avatar.useMotiono.swordTopDownSlashStep,
    ].includes(motion)) {
      game.handleAnimationEnd();
    }
  };

  avatar.mixer.addEventListener('finished', event => {
    // debugger
    handleAnimationEnd(event.motion, 'finished');

    if (avatar.useEnvelopeState && event.motion === avatar.useMotiono.bowDraw) {
      physx.physxWorker.crossFadeTwo(avatar.bowIdle8DDrawLooseNode, 0.2, 0);
    }
    if (event.motion === avatar.useMotiono.bowLoose) {
      physx.physxWorker.crossFadeTwo(avatar.idle8DWalkRun_BowIdle8DDrawLooseNode, 0.2, 0);
    }
  });
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

  mixer.update(timeS, avatar.animTree); // todo: Del

  physx.physxWorker.setWeight(avatar.walkForwardMotion, forwardFactor);
  physx.physxWorker.setWeight(avatar.walkBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.walkLeftMotion, mirrorFactorReverse * leftFactor);
  physx.physxWorker.setWeight(avatar.walkLeftMirrorMotion, avatar.mirrorFactor * leftFactor);
  physx.physxWorker.setWeight(avatar.walkRightMotion, mirrorFactorReverse * rightFactor);
  physx.physxWorker.setWeight(avatar.walkRightMirrorMotion, avatar.mirrorFactor * rightFactor);

  physx.physxWorker.setWeight(avatar.runForwardMotion, forwardFactor);
  physx.physxWorker.setWeight(avatar.runBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.runLeftMotion, mirrorFactorReverse * leftFactor);
  physx.physxWorker.setWeight(avatar.runLeftMirrorMotion, avatar.mirrorFactor * leftFactor);
  physx.physxWorker.setWeight(avatar.runRightMotion, mirrorFactorReverse * rightFactor);
  physx.physxWorker.setWeight(avatar.runRightMirrorMotion, avatar.mirrorFactor * rightFactor);

  physx.physxWorker.setWeight(avatar.crouchForwardMotion, forwardFactor);
  physx.physxWorker.setWeight(avatar.crouchBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.crouchLeftMotion, mirrorFactorReverse * leftFactor);
  physx.physxWorker.setWeight(avatar.crouchLeftMirrorMotion, avatar.mirrorFactor * leftFactor);
  physx.physxWorker.setWeight(avatar.crouchRightMotion, mirrorFactorReverse * rightFactor);
  physx.physxWorker.setWeight(avatar.crouchRightMirrorMotion, avatar.mirrorFactor * rightFactor);

  physx.physxWorker.setWeight(avatar.bowForwardMotion, forwardFactor);
  physx.physxWorker.setWeight(avatar.bowBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.bowLeftMotion, mirrorFactorReverse * leftFactor);
  physx.physxWorker.setWeight(avatar.bowLeftMirrorMotion, avatar.mirrorFactor * leftFactor);
  physx.physxWorker.setWeight(avatar.bowRightMotion, mirrorFactorReverse * rightFactor);
  physx.physxWorker.setWeight(avatar.bowRightMirrorMotion, avatar.mirrorFactor * rightFactor);

  physx.physxWorker.setFactor(avatar._8DirectionsWalkRunNode, avatar.moveFactors.walkRunFactor);
  physx.physxWorker.setFactor(avatar.idle8DWalkRunNode, avatar.moveFactors.idleWalkFactor);
  physx.physxWorker.setFactor(avatar.idle8DCrouchNode, avatar.moveFactors.idleWalkFactor);
  physx.physxWorker.setFactor(avatar.defaultNode, avatar.moveFactors.crouchFactor);
  physx.physxWorker.setFactor(avatar.idle8DBowNode, avatar.moveFactors.idleWalkFactor);

  physx.physxWorker.setWeight(avatar.flyForwardNode, forwardFactor);
  physx.physxWorker.setWeight(avatar.flyDodgeBackwardMotion, backwardFactor);
  physx.physxWorker.setWeight(avatar.flyDodgeLeftMotion, leftFactor);
  physx.physxWorker.setWeight(avatar.flyDodgeRightMotion, rightFactor);

  physx.physxWorker.setFactor(avatar.idle8DFlyNode, avatar.moveFactors.walkRunFactor);
  physx.physxWorker.setFactor(avatar.flyForwardNode, avatar.flyDashFactor);

  // action end event --------------------------------------------

  if (avatar.flyEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);
  }
  if (avatar.jumpEnd) {
    if (avatar.narutoRunState) {
      physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.narutoRunMotion);
    } else {
      physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);
    }
  }

  if (avatar.narutoRunEnd) physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);

  if (avatar.activateEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);
  }

  if (avatar.useEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);
  }

  if (avatar.useComboEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);
  }

  if (avatar.useEnvelopeEnd) {
    physx.physxWorker.play(avatar.useMotiono.bowLoose);
    physx.physxWorker.setFactor(avatar.bowDrawLooseNodoe, 1);
    physx.physxWorker.crossFadeTwo(avatar.bowIdle8DDrawLooseNode, 0.2, 1);
  }

  if (avatar.sitEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);
  }

  if (avatar.emoteEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);
  }

  if (avatar.danceEnd) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.defaultNode);
  }

  // action start event --------------------------------------------

  if (avatar.flyStart) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.idle8DFlyNode);
  }

  if (avatar.jumpStart) {
    physx.physxWorker.play(avatar.jumpMotion);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.jumpMotion);
  }

  if (avatar.activateStart) {
    physx.physxWorker.play(avatar.activateMotion);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.activateMotion);
  }

  if (avatar.narutoRunStart) physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.narutoRunMotion);

  // sword
  if (avatar.useStart) {
    const useAnimationName = avatar.useAnimation;
    physx.physxWorker.play(avatar.useMotiono[useAnimationName]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.useMotiono[useAnimationName]);
  }

  // silsword
  if (avatar.useComboStart) {
    const useAnimationName = avatar.useAnimationCombo[avatar.useAnimationIndex];
    physx.physxWorker.play(avatar.useMotiono[useAnimationName]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.useMotiono[useAnimationName]);
  }

  // bow
  if (avatar.useEnvelopeStart) {
    console.log('useEnvelopeStart')
    physx.physxWorker.play(avatar.useMotiono.bowDraw);
    physx.physxWorker.setFactor(avatar.bowDrawLooseNodoe, 0);
    physx.physxWorker.setFactor(avatar.bowIdle8DDrawLooseNode, 1);
    physx.physxWorker.crossFadeTwo(avatar.idle8DWalkRun_BowIdle8DDrawLooseNode, 0.2, 1);
  }

  // sit
  if (avatar.sitStart) {
    physx.physxWorker.play(avatar.sitMotiono[avatar.sitAnimation || defaultSitAnimation]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.sitMotiono[avatar.sitAnimation || defaultSitAnimation]);
  }

  // emote
  if (avatar.emoteStart) {
    physx.physxWorker.play(avatar.emoteMotiono[avatar.emoteAnimation || defaultEmoteAnimation]);
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.emoteMotiono[avatar.emoteAnimation || defaultEmoteAnimation]);
  }

  // dance
  if (avatar.danceStart) {
    physx.physxWorker.crossFadeUnitary(avatar.actionsNode, 0.2, avatar.danceMotiono[avatar.danceAnimation || defaultDanceAnimation]);
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
