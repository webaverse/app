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
    // physx.physxWorker.addChild(walkFlyNodePointer, animations.index["walking.fbx"].pointer);
    // physx.physxWorker.addChild(walkFlyNodePointer, animations.index["treading water.fbx"].pointer);

    // const crouchNodePointer = physx.physxWorker.createNode();
    // physx.physxWorker.addChild(crouchNodePointer, walkFlyNodePointer);
    // physx.physxWorker.addChild(crouchNodePointer, animations.index["Crouch Idle.fbx"].pointer);

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

    // // window.crouchNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    // // physx.physxWorker.addChild(crouchNode, walkFlyNode);
    // // physx.physxWorker.addChild(crouchNode, crouchMotion);

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

    // create nodes -------------------------------------------------------------

    // avatar.walkNode = avatar.mixer.createNode(WebaverseAnimationNodeBlendList, 'walk');
    avatar.walkNode = physx.physxWorker.createNode(AnimationNodeType.LIST);
    physx.physxWorker.addChild(avatar.walkNode, avatar.walkForwardMotion);
    physx.physxWorker.addChild(avatar.walkNode, avatar.walkBackwardMotion);
    physx.physxWorker.addChild(avatar.walkNode, avatar.walkLeftMotion);
    physx.physxWorker.addChild(avatar.walkNode, avatar.walkRightMotion);
    physx.physxWorker.addChild(avatar.walkNode, avatar.walkLeftMirrorMotion);
    physx.physxWorker.addChild(avatar.walkNode, avatar.walkRightMirrorMotion);

    avatar.runNode = physx.physxWorker.createNode(AnimationNodeType.LIST);
    physx.physxWorker.addChild(avatar.runNode, avatar.runForwardMotion);
    physx.physxWorker.addChild(avatar.runNode, avatar.runBackwardMotion);
    physx.physxWorker.addChild(avatar.runNode, avatar.runLeftMotion);
    physx.physxWorker.addChild(avatar.runNode, avatar.runRightMotion);
    physx.physxWorker.addChild(avatar.runNode, avatar.runLeftMirrorMotion);
    physx.physxWorker.addChild(avatar.runNode, avatar.runRightMirrorMotion);

    avatar.walkRunNode = physx.physxWorker.createNode(AnimationNodeType.TWO);
    physx.physxWorker.addChild(avatar.walkRunNode, avatar.walkNode);
    physx.physxWorker.addChild(avatar.walkRunNode, avatar.runNode);

    physx.physxWorker.setAnimTree(avatar.walkRunNode);

    // --------------------------------------------------------------------------

    createdWasmAnimations = true;
  }

  avatar.mixer = new WebaverseAnimationMixer(avatar); // todo: Del

  return;

  // WebaverseAnimationMotions ---
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

  avatar.bowForwardMotion = avatar.mixer.createMotion(animations.index['Standing Aim Walk Forward.fbx']);
  avatar.bowBackwardMotion = avatar.mixer.createMotion(animations.index['Standing Aim Walk Forward reverse.fbx']);
  avatar.bowLeftMotion = avatar.mixer.createMotion(animations.index['Standing Aim Walk Left.fbx']);
  avatar.bowRightMotion = avatar.mixer.createMotion(animations.index['Standing Aim Walk Right.fbx']);
  avatar.bowLeftMirrorMotion = avatar.mixer.createMotion(animations.index['Standing Aim Walk Right reverse.fbx']);
  avatar.bowRightMirrorMotion = avatar.mixer.createMotion(animations.index['Standing Aim Walk Left reverse.fbx']);

  avatar.crouchIdleMotion = avatar.mixer.createMotion(animations.index['Crouch Idle.fbx']);
  avatar.flyMotion = avatar.mixer.createMotion(floatAnimation);
  avatar.flyIdleMotion = avatar.mixer.createMotion(animations.index['fly_idle.fbx']);
  avatar.flyDodgeForwardMotion = avatar.mixer.createMotion(animations.index['fly_dodge_forward.fbx']);
  avatar.flyDodgeBackwardMotion = avatar.mixer.createMotion(animations.index['fly_dodge_backward.fbx']);
  avatar.flyDodgeLeftMotion = avatar.mixer.createMotion(animations.index['fly_dodge_left.fbx']);
  avatar.flyDodgeRightMotion = avatar.mixer.createMotion(animations.index['fly_dodge_right.fbx']);
  avatar.flyDashMotion = avatar.mixer.createMotion(animations.index['fly_dash_forward.fbx']);
  avatar.narutoRunMotion = avatar.mixer.createMotion(narutoRunAnimations[defaultNarutoRunAnimation]);

  avatar.useMotiono = {};
  for (const k in useAnimations) {
    const animation = useAnimations[k];
    if (animation) {
      avatar.useMotiono[k] = avatar.mixer.createMotion(animation);
    }
  }
  // avatar.useMotiono.bowIdle2 = avatar.mixer.createMotion(avatar.useMotiono.bowIdle.animation); // duplicate bowIdle motion, used for different parents
  avatar.useMotiono.drink.loop = LoopOnce; avatar.useMotiono.drink.stop();
  avatar.useMotiono.combo.loop = LoopOnce; avatar.useMotiono.combo.stop();
  // combo
  avatar.useMotiono.swordSideSlash.loop = LoopOnce; avatar.useMotiono.swordSideSlash.stop();
  avatar.useMotiono.swordSideSlashStep.loop = LoopOnce; avatar.useMotiono.swordSideSlashStep.stop();
  avatar.useMotiono.swordTopDownSlash.loop = LoopOnce; avatar.useMotiono.swordTopDownSlash.stop();
  avatar.useMotiono.swordTopDownSlashStep.loop = LoopOnce; avatar.useMotiono.swordTopDownSlashStep.stop();
  // envelope
  avatar.useMotiono.bowDraw.loop = LoopOnce; avatar.useMotiono.bowDraw.stop();
  // avatar.useMotiono.bowIdle.loop = LoopOnce; avatar.useMotiono.bowIdle.stop();
  avatar.useMotiono.bowLoose.loop = LoopOnce; avatar.useMotiono.bowLoose.stop();
  // sit
  avatar.sitMotiono = {};
  for (const k in sitAnimations) {
    const animation = sitAnimations[k];
    if (animation) {
      avatar.sitMotiono[k] = avatar.mixer.createMotion(animation);
      avatar.sitMotiono[k].loop = LoopOnce; avatar.sitMotiono[k].stop();
    }
  }
  // emote
  avatar.emoteMotiono = {};
  for (const k in emoteAnimations) {
    const animation = emoteAnimations[k];
    if (animation) {
      avatar.emoteMotiono[k] = avatar.mixer.createMotion(animation);
      avatar.emoteMotiono[k].loop = LoopOnce; avatar.emoteMotiono[k].stop();
    }
  }
  // dance
  avatar.danceMotiono = {};
  for (const k in danceAnimations) {
    const animation = danceAnimations[k];
    if (animation) {
      avatar.danceMotiono[k] = avatar.mixer.createMotion(animation);
      // avatar.danceMotiono[k].loop = LoopOnce; avatar.danceMotiono[k].stop();
    }
  }

  // LoopOnce
  avatar.jumpMotion = avatar.mixer.createMotion(jumpAnimation);
  // avatar.jumpMotion = avatar.mixer.createMotion(animations.index['t-pose_rot.fbx']);
  avatar.jumpMotion.loop = LoopOnce;
  avatar.jumpMotion.stop();
  // avatar.jumpMotion.weight = 999999; // can't Infinity
  avatar.jumpMotion.timeBias = 0.7;
  avatar.jumpMotion.speed = 1 / 0.6;

  avatar.activateMotion = avatar.mixer.createMotion(activateAnimations.grab_forward.animation); // todo: handle activateAnimations.grab_forward.speedFactor
  // avatar.activateMotion = avatar.mixer.createMotion(animations.index['t-pose_rot.fbx']);
  avatar.activateMotion.loop = LoopOnce;
  avatar.activateMotion.stop();

  // avatar.useComboMotion = avatar.mixer.createMotion(useAnimations.swordSideSlash);
  // avatar.useComboMotion.loop = LoopOnce;
  // avatar.useComboMotion.stop();

  // AnimNodes ---
  // todo: in order to reuse motions, need set children weights in node.
  avatar.walkNode = avatar.mixer.createNode(WebaverseAnimationNodeBlendList, 'walk'); // todo: mixer.createNode
  avatar.walkNode.addChild(avatar.walkForwardMotion);
  avatar.walkNode.addChild(avatar.walkBackwardMotion);
  avatar.walkNode.addChild(avatar.walkLeftMotion);
  avatar.walkNode.addChild(avatar.walkRightMotion);
  avatar.walkNode.addChild(avatar.walkLeftMirrorMotion);
  avatar.walkNode.addChild(avatar.walkRightMirrorMotion);

  avatar.runNode = avatar.mixer.createNode(WebaverseAnimationNodeBlendList, 'run');
  avatar.runNode.addChild(avatar.runForwardMotion);
  avatar.runNode.addChild(avatar.runBackwardMotion);
  avatar.runNode.addChild(avatar.runLeftMotion);
  avatar.runNode.addChild(avatar.runRightMotion);
  avatar.runNode.addChild(avatar.runLeftMirrorMotion);
  avatar.runNode.addChild(avatar.runRightMirrorMotion);

  avatar.crouchNode = avatar.mixer.createNode(WebaverseAnimationNodeBlendList, 'crouch');
  avatar.crouchNode.addChild(avatar.crouchForwardMotion);
  avatar.crouchNode.addChild(avatar.crouchBackwardMotion);
  avatar.crouchNode.addChild(avatar.crouchLeftMotion);
  avatar.crouchNode.addChild(avatar.crouchRightMotion);
  avatar.crouchNode.addChild(avatar.crouchLeftMirrorMotion);
  avatar.crouchNode.addChild(avatar.crouchRightMirrorMotion);

  avatar.bowNode = avatar.mixer.createNode(WebaverseAnimationNodeBlendList, 'bow');
  avatar.bowNode.addChild(avatar.bowForwardMotion);
  avatar.bowNode.addChild(avatar.bowBackwardMotion);
  avatar.bowNode.addChild(avatar.bowLeftMotion);
  avatar.bowNode.addChild(avatar.bowRightMotion);
  avatar.bowNode.addChild(avatar.bowLeftMirrorMotion);
  avatar.bowNode.addChild(avatar.bowRightMirrorMotion);

  avatar.walkRunNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, 'walkRun');
  avatar.walkRunNode.addChild(avatar.walkNode);
  avatar.walkRunNode.addChild(avatar.runNode);

  avatar._7wayWalkRunNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayWalkRunNode');
  avatar._7wayWalkRunNode.addChild(avatar.idleMotion);
  avatar._7wayWalkRunNode.addChild(avatar.walkRunNode);

  avatar._7wayCrouchNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayCrouchNode');
  avatar._7wayCrouchNode.addChild(avatar.crouchIdleMotion);
  avatar._7wayCrouchNode.addChild(avatar.crouchNode);

  avatar._7wayBowNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayBowNode');
  // avatar._7wayBowNode.addChild(avatar.useMotiono.bowIdle2);
  avatar._7wayBowNode.addChild(avatar.useMotiono.bowIdle);
  avatar._7wayBowNode.addChild(avatar.bowNode);

  avatar.bowDrawLooseNodoe = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, 'bowDrawLoose');
  avatar.bowDrawLooseNodoe.addChild(avatar.useMotiono.bowDraw);
  avatar.bowDrawLooseNodoe.addChild(avatar.useMotiono.bowLoose);

  avatar.bowIdleDrawLooseNode = avatar.mixer.createNode(WebaverseAnimationNodeOverwrite, 'bowIdleDrawLoose', {filters: ['isTop']});
  avatar.bowIdleDrawLooseNode.addChild(avatar._7wayBowNode);
  avatar.bowIdleDrawLooseNode.addChild(avatar.bowDrawLooseNodoe);

  avatar._7wayWalkRunBowNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayWalkRunBow');
  avatar._7wayWalkRunBowNode.addChild(avatar._7wayWalkRunNode);
  // avatar._7wayWalkRunBowNode.addChild(avatar._7wayBowNode);
  avatar._7wayWalkRunBowNode.addChild(avatar.bowIdleDrawLooseNode);

  avatar.defaultNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, 'defaultNode');
  avatar.defaultNode.addChild(avatar._7wayWalkRunBowNode);
  avatar.defaultNode.addChild(avatar._7wayCrouchNode);

  avatar.flyForwardNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, 'flyForwardNode');
  avatar.flyForwardNode.addChild(avatar.flyDodgeForwardMotion);
  avatar.flyForwardNode.addChild(avatar.flyDashMotion);

  avatar.flyNode = avatar.mixer.createNode(WebaverseAnimationNodeBlendList, 'flyNode');
  avatar.flyNode.addChild(avatar.flyForwardNode);
  avatar.flyNode.addChild(avatar.flyDodgeBackwardMotion);
  avatar.flyNode.addChild(avatar.flyDodgeLeftMotion);
  avatar.flyNode.addChild(avatar.flyDodgeRightMotion);

  avatar._7wayFlyNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, '_7wayFlyNode');
  avatar._7wayFlyNode.addChild(avatar.flyIdleMotion);
  avatar._7wayFlyNode.addChild(avatar.flyNode);

  avatar.actionsNode = avatar.mixer.createNode(WebaverseAnimationNodeUnitary, 'actions');
  avatar.actionsNode.addChild(avatar.defaultNode);
  avatar.actionsNode.addChild(avatar.jumpMotion);
  avatar.actionsNode.addChild(avatar._7wayFlyNode);
  avatar.actionsNode.addChild(avatar.activateMotion);
  avatar.actionsNode.addChild(avatar.narutoRunMotion);
  // useMotiono
  avatar.actionsNode.addChild(avatar.useMotiono.drink);
  // sword
  avatar.actionsNode.addChild(avatar.useMotiono.combo);
  // silsword combo
  avatar.actionsNode.addChild(avatar.useMotiono.swordSideSlash);
  avatar.actionsNode.addChild(avatar.useMotiono.swordSideSlashStep);
  avatar.actionsNode.addChild(avatar.useMotiono.swordTopDownSlash);
  avatar.actionsNode.addChild(avatar.useMotiono.swordTopDownSlashStep);
  // envolope
  // avatar.actionsNode.addChild(avatar.useMotiono.bowDraw);
  // avatar.actionsNode.addChild(avatar.useMotiono.bowIdle); // ~~todo: bowIdle weight conflict with _7wayBowNode's bowIdle~~
  // avatar.actionsNode.addChild(avatar.useMotiono.bowLoose);
  // sit
  for (const k in avatar.sitMotiono) {
    const motion = avatar.sitMotiono[k];
    avatar.actionsNode.addChild(motion);
  }
  // emote
  for (const k in avatar.emoteMotiono) {
    const motion = avatar.emoteMotiono[k];
    avatar.actionsNode.addChild(motion);
  }
  // dance
  for (const k in avatar.danceMotiono) {
    const motion = avatar.danceMotiono[k];
    avatar.actionsNode.addChild(motion);
  }

  // avatar.jumpNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, 'jump');
  // avatar.jumpNode.addChild(avatar.defaultNode);
  // avatar.jumpNode.addChild(avatar.jumpMotion);

  // avatar.flyNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, 'fly');
  // avatar.flyNode.addChild(avatar.jumpNode);
  // avatar.flyNode.addChild(avatar.flyMotion);

  avatar.animTree = avatar.actionsNode; // todo: set whole tree here with separate names.

  // test ----------------------------------------------------------------------------------------------------------
  // avatar.animTree = avatar.crouchIdleMotion;

  //

  // avatar.walkFlyNode = avatar.mixer.createNode(WebaverseAnimationNodeBlend2, 'walkFlyNode');
  // avatar.walkFlyNode.addChild(avatar.walkForwardMotion);
  // avatar.walkFlyNode.addChild(avatar.flyMotion);

  // avatar.animTree = avatar.walkFlyNode;

  //

  // avatar.animTree = avatar.walkForwardMotion;

  // avatar.animTree = avatar.bowNode;
  // avatar.animTree = avatar.useMotiono.bowLoose; avatar.useMotiono.bowLoose.loop = LoopRepeat; avatar.useMotiono.bowLoose.play();
  // avatar.animTree = avatar.useMotiono.bowIdle; avatar.useMotiono.bowIdle.loop = LoopRepeat; avatar.useMotiono.bowIdle.play();
  // avatar.animTree = avatar.useMotiono.bowDraw; avatar.useMotiono.bowDraw.loop = LoopRepeat; avatar.useMotiono.bowDraw.play();
  // avatar.overwriteNode = avatar.mixer.createNode(WebaverseAnimationNodeOverwrite, 'overwrite');
  // avatar.overwriteNode.addChild(avatar.crouchForwardMotion);
  // avatar.overwriteNode.addChild(avatar.runForwardMotion);
  // avatar.animTree = avatar.crouchForwardMotion;
  // avatar.animTree = avatar.runForwardMotion;
  // avatar.animTree = avatar.overwriteNode;
  //
  // test end ----------------------------------------------------------------------------------------------------------

  const handleAnimationEnd = (motion, trigger) => {
    // console.log(motion.name, trigger);
    // if (motion === avatar.jumpMotion) debugger
    if ([
      avatar.useMotiono.drink,
      avatar.useMotiono.combo,
      avatar.useMotiono.swordSideSlash,
      avatar.useMotiono.swordSideSlashStep,
      avatar.useMotiono.swordTopDownSlash,
      avatar.useMotiono.swordTopDownSlashStep,
    ].includes(motion)) {
      // console.log('animationEnd', event.motion.name);
      game.handleAnimationEnd();
    }
  };

  avatar.mixer.addEventListener('finished', event => {
    // console.log('finished', event.motion.name, !!avatar.useEnvelopeState); // todo: why `bow draw.fbx` trigger `finished` event at app init.
    handleAnimationEnd(event.motion, 'finished');
    // if ([
    //   avatar.useMotiono.combo,
    //   avatar.useMotiono.swordSideSlash,
    //   avatar.useMotiono.swordSideSlashStep,
    //   avatar.useMotiono.swordTopDownSlash,
    //   avatar.useMotiono.swordTopDownSlashStep,
    // ].includes(event.motion)) {
    //   // console.log('animationEnd', event.motion.name);
    //   game.handleAnimationEnd();
    // }

    if (avatar.useEnvelopeState && event.motion === avatar.useMotiono.bowDraw) {
      // avatar.actionsNode.crossFadeTo(0.2, avatar.useMotiono.bowIdle);
      // avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
      // avatar.bowIdleDrawLooseNode.factor = 0;
      avatar.bowIdleDrawLooseNode.crossFade(0.2, 0);
    }
    if (event.motion === avatar.useMotiono.bowLoose) {
      // avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
      avatar._7wayWalkRunBowNode.crossFade(0.2, 0);
    }
  });
  // avatar.mixer.addEventListener('stopped', event => { // handle situations such as sword attacks stopped by jump
  //   // console.log('stopped', event.motion.name);
  //   // handleAnimationEnd(event);
  // });
  // avatar.actionsNode.addEventListener('switch', event => { // handle situations such as sword attacks stopped by jump
  //   handleAnimationEnd(event.from, 'switch');
  //   // if (![
  //   //   avatar.useMotiono.combo,
  //   //   avatar.useMotiono.swordSideSlash,
  //   //   avatar.useMotiono.swordSideSlashStep,
  //   //   avatar.useMotiono.swordTopDownSlash,
  //   //   avatar.useMotiono.swordTopDownSlashStep,
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

  mixer.update(timeS, avatar.animTree); // todo: Del

  physx.physxWorker.changeWeight(avatar.walkForwardMotion, forwardFactor);
  physx.physxWorker.changeWeight(avatar.walkBackwardMotion, backwardFactor);
  physx.physxWorker.changeWeight(avatar.walkLeftMotion, mirrorFactorReverse * leftFactor);
  physx.physxWorker.changeWeight(avatar.walkLeftMirrorMotion, avatar.mirrorFactor * leftFactor);
  physx.physxWorker.changeWeight(avatar.walkRightMotion, mirrorFactorReverse * rightFactor);
  physx.physxWorker.changeWeight(avatar.walkRightMirrorMotion, avatar.mirrorFactor * rightFactor);

  physx.physxWorker.changeWeight(avatar.runForwardMotion, forwardFactor);
  physx.physxWorker.changeWeight(avatar.runBackwardMotion, backwardFactor);
  physx.physxWorker.changeWeight(avatar.runLeftMotion, mirrorFactorReverse * leftFactor);
  physx.physxWorker.changeWeight(avatar.runLeftMirrorMotion, avatar.mirrorFactor * leftFactor);
  physx.physxWorker.changeWeight(avatar.runRightMotion, mirrorFactorReverse * rightFactor);
  physx.physxWorker.changeWeight(avatar.runRightMirrorMotion, avatar.mirrorFactor * rightFactor);

  physx.physxWorker.changeFactor(avatar.walkRunNode, avatar.moveFactors.walkRunFactor);

  return;

  avatar.walkForwardMotion.weight = forwardFactor;
  avatar.walkBackwardMotion.weight = backwardFactor;
  avatar.walkLeftMotion.weight = mirrorFactorReverse * leftFactor;
  avatar.walkLeftMirrorMotion.weight = avatar.mirrorFactor * leftFactor;
  avatar.walkRightMotion.weight = mirrorFactorReverse * rightFactor;
  avatar.walkRightMirrorMotion.weight = avatar.mirrorFactor * rightFactor;

  window.domInfo.innerHTML += `<div style="display:;">forward: --- ${window.logNum(avatar.walkForwardMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">backward: --- ${window.logNum(avatar.walkBackwardMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">left: --- ${window.logNum(avatar.walkLeftMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">right: --- ${window.logNum(avatar.walkRightMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">leftMirror: --- ${window.logNum(avatar.walkLeftMirrorMotion.weight)}</div>`;
  window.domInfo.innerHTML += `<div style="display:;">rightMirror: --- ${window.logNum(avatar.walkRightMirrorMotion.weight)}</div>`;

  avatar.runForwardMotion.weight = forwardFactor;
  avatar.runBackwardMotion.weight = backwardFactor;
  avatar.runLeftMotion.weight = mirrorFactorReverse * leftFactor;
  avatar.runLeftMirrorMotion.weight = avatar.mirrorFactor * leftFactor;
  avatar.runRightMotion.weight = mirrorFactorReverse * rightFactor;
  avatar.runRightMirrorMotion.weight = avatar.mirrorFactor * rightFactor;

  avatar.crouchForwardMotion.weight = forwardFactor;
  avatar.crouchBackwardMotion.weight = backwardFactor;
  avatar.crouchLeftMotion.weight = mirrorFactorReverse * leftFactor;
  avatar.crouchLeftMirrorMotion.weight = avatar.mirrorFactor * leftFactor;
  avatar.crouchRightMotion.weight = mirrorFactorReverse * rightFactor;
  avatar.crouchRightMirrorMotion.weight = avatar.mirrorFactor * rightFactor;

  avatar.bowForwardMotion.weight = forwardFactor;
  avatar.bowBackwardMotion.weight = backwardFactor;
  avatar.bowLeftMotion.weight = mirrorFactorReverse * leftFactor;
  avatar.bowLeftMirrorMotion.weight = avatar.mirrorFactor * leftFactor;
  avatar.bowRightMotion.weight = mirrorFactorReverse * rightFactor;
  avatar.bowRightMirrorMotion.weight = avatar.mirrorFactor * rightFactor;

  avatar.flyForwardNode.weight = forwardFactor;
  avatar.flyDodgeBackwardMotion.weight = backwardFactor;
  avatar.flyDodgeLeftMotion.weight = leftFactor;
  avatar.flyDodgeRightMotion.weight = rightFactor;

  // avatar._7wayWalkRunBowNode.factor = avatar.useEnvelopeState ? 1 : 0;
  // avatar._7wayWalkRunBowNode.factor = avatar.useEnvelopeFactor;
  // console.log(avatar._7wayWalkRunBowNode.factor);

  avatar.walkRunNode.factor = avatar.moveFactors.walkRunFactor;
  avatar._7wayWalkRunNode.factor = avatar.moveFactors.idleWalkFactor;
  avatar._7wayCrouchNode.factor = avatar.moveFactors.idleWalkFactor;
  avatar._7wayBowNode.factor = avatar.moveFactors.idleWalkFactor;
  avatar._7wayFlyNode.factor = avatar.moveFactors.walkRunFactor;
  avatar.defaultNode.factor = avatar.moveFactors.crouchFactor;
  avatar.flyForwardNode.factor = avatar.flyDashFactor;

  // action end event ---

  if (avatar.narutoRunEnd) avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
  // if (avatar.jumpEnd) avatar.jumpMotion.stop();
  // if (avatar.jumpEnd) avatar.jumpNode.factor = 0;
  if (avatar.jumpEnd) {
    // debugger
    // avatar.jumpMotion.stop(); // don't need
    if (avatar.narutoRunState) {
      avatar.actionsNode.crossFadeTo(0.2, avatar.narutoRunMotion);
    } else {
      avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
    }
    // avatar.walkJumpNode.factor = 0;
  }
  if (avatar.flyEnd) {
    // debugger
    avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);

    // avatar.walkFlyNode.factor = 0;
    // avatar.walkFlyNode.crossFade(0.2, 0);
  }
  if (avatar.activateEnd) {
    // avatar.activateMotion.stop(); // don't need
    avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
  }
  if (avatar.useEnd) {
    console.log('useEnd');
    avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
  }
  if (avatar.useComboEnd) {
    avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
  }
  // if (avatar.useEnvelopeEnd) {
  //   // console.log('useEnvelopeEnd');
  //   // if (avatar.actionsNode.activeNode === avatar.useMotiono.bowIdle) { // todo: useAnimationEnvelope[1]
  //   if (avatar.actionsNode.activeNode === avatar.defaultNode) {
  //     avatar.useMotiono.bowLoose.play();
  //     avatar.actionsNode.crossFadeTo(0, avatar.useMotiono.bowLoose); // todo: useAnimationEnvelope[2] // todo: 0.2 transition
  //   } else {
  //     avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
  //   }
  // }
  if (avatar.useEnvelopeEnd) {
    // console.log('useEnvelopeEnd');
    // if (avatar.actionsNode.activeNode === avatar.useMotiono.bowIdle) { // todo: useAnimationEnvelope[1]
    // if (avatar.actionsNode.activeNode === avatar.defaultNode) {
    avatar.useMotiono.bowLoose.play();
    // avatar.actionsNode.crossFadeTo(0, avatar.useMotiono.bowLoose); // todo: useAnimationEnvelope[2] // todo: 0.2 transition
    // avatar.bowDrawLooseNodoe.crossFade(0.2, 1);
    avatar.bowDrawLooseNodoe.factor = 1;
    avatar.bowIdleDrawLooseNode.crossFade(0.2, 1);
    // } else {
    //   avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
    // }
  }
  if (avatar.sitEnd) {
    avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
  }
  if (avatar.emoteEnd) {
    avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
  }
  if (avatar.danceEnd) {
    avatar.actionsNode.crossFadeTo(0.2, avatar.defaultNode);
  }
  // console.log(avatar.useComboStart, avatar.useComboEnd);

  // action start event ---

  if (avatar.narutoRunStart) avatar.actionsNode.crossFadeTo(0.2, avatar.narutoRunMotion);

  // jump
  // avatar.jumpMotion.time = avatar.jumpTime / 1000;
  // const jumpFactor = MathUtils.clamp(avatar.jumpMotion.time / 0.2, 0, 1);
  // avatar.defaultNode.weight = 1 - jumpFactor;
  // avatar.jumpMotion.weight = jumpFactor;

  // if (avatar.jumpStart) avatar.jumpMotion.play();

  // if (avatar.jumpStart) avatar.jumpNode.factor = 1;

  if (avatar.jumpStart) {
    // console.log('jumpStart');
    // debugger
    avatar.jumpMotion.play();
    avatar.actionsNode.crossFadeTo(0.2, avatar.jumpMotion);
    // avatar.walkJumpNode.factor = 1;
  }
  // if (avatar === window.avatar) console.log(Math.floor(avatar.jumpMotion.time));

  if (avatar.flyStart) {
    // debugger
    avatar.actionsNode.crossFadeTo(0.2, avatar._7wayFlyNode);

    // avatar.walkFlyNode.factor = 1;
    // avatar.walkFlyNode.crossFade(0.2, 1);
  }

  if (avatar.activateStart) {
    // console.log('activateStart');
    avatar.activateMotion.play();
    avatar.actionsNode.crossFadeTo(0.2, avatar.activateMotion);
  }

  if (avatar.useStart) {
    // console.log('useStart');
    const useAnimationName = avatar.useAnimation;
    avatar.useMotiono[useAnimationName].play();
    avatar.actionsNode.crossFadeTo(0.2, avatar.useMotiono[useAnimationName]);
  }

  if (avatar.useComboStart) {
    // console.log('useComboStart');
    const useAnimationName = avatar.useAnimationCombo[avatar.useAnimationIndex];
    avatar.useMotiono[useAnimationName].play();
    avatar.actionsNode.crossFadeTo(0.2, avatar.useMotiono[useAnimationName]);
  }

  // avatar.useMotiono.bowIdle.weight = 0;

  // if (avatar.useEnvelopeStart) {
  //   // console.log('useEnvelopeStart');
  //   const useAnimationName = avatar.useAnimationEnvelope[0];
  //   avatar.useMotiono[useAnimationName].play();
  //   avatar.actionsNode.crossFadeTo(0.2, avatar.useMotiono[useAnimationName]);
  // }

  if (avatar.useEnvelopeStart) {
    // console.log('useEnvelopeStart');
    // const useAnimationName = avatar.useAnimationEnvelope[0];
    avatar.useMotiono.bowDraw.play();
    avatar.bowDrawLooseNodoe.factor = 0;
    avatar.bowIdleDrawLooseNode.factor = 1;
    avatar._7wayWalkRunBowNode.crossFade(0.2, 1);
  }
  // sit
  if (avatar.sitStart) {
    avatar.sitMotiono[avatar.sitAnimation || defaultSitAnimation].play();
    avatar.actionsNode.crossFadeTo(0.2, avatar.sitMotiono[avatar.sitAnimation || defaultSitAnimation]);
  }
  // emote
  if (avatar.emoteStart) {
    avatar.emoteMotiono[avatar.emoteAnimation || defaultEmoteAnimation].play();
    avatar.actionsNode.crossFadeTo(0.2, avatar.emoteMotiono[avatar.emoteAnimation || defaultEmoteAnimation]);
  }
  // dance
  if (avatar.danceStart) {
    // avatar.danceMotiono[avatar.danceAnimation || defaultDanceAnimation].play();
    avatar.actionsNode.crossFadeTo(0.2, avatar.danceMotiono[avatar.danceAnimation || defaultDanceAnimation]);
  }

  // window.domInfo.innerHTML += `<div style="display:;">useComboStart: --- ${window.logNum(avatar.useComboStart)}</div>`;

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
