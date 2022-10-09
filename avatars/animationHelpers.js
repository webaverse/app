import {Vector3, Quaternion, AnimationClip, MathUtils} from 'three';
import metaversefile from 'metaversefile';
import {VRMCurveMapper} from '@pixiv/three-vrm-core';
// import easing from '../easing.js';
import {easing} from '../math-utils.js';
import loaders from '../loaders.js';
import {zbdecode} from 'zjs/encoding.mjs';

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
  defaultActionTransitionTime,
  // useMaxTime,
  aimMaxTime,
  // avatarInterpolationFrameRate,
  // avatarInterpolationTimeDelay,
  // avatarInterpolationNumFrames,
  narutoRunTimeFactor,
} from '../constants.js';

const localVector = new Vector3();
const localVector2 = new Vector3();
const localVector3 = new Vector3();
const localVector4 = new Vector3();

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
let doubleJumpAnimation;
let fallLoopAnimation;
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
let cellphoneDrawAnimation;
let cellphoneUndrawAnimation;

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
    {
      name: 'left strafe walking reverse.fbx',
      matchAngle: -Math.PI / 2,
      angle: -Math.PI / 2,
    },
    {
      name: 'right strafe walking reverse.fbx',
      matchAngle: Math.PI / 2,
      angle: Math.PI / 2,
    },
  ],
  run: [
    {
      name: 'left strafe reverse.fbx',
      matchAngle: -Math.PI / 2,
      angle: -Math.PI / 2,
    },
    {
      name: 'right strafe reverse.fbx',
      matchAngle: Math.PI / 2,
      angle: Math.PI / 2,
    },
  ],
  crouch: [
    {
      name: 'Crouched Sneaking Left reverse.fbx',
      matchAngle: -Math.PI / 2,
      angle: -Math.PI / 2,
    },
    {
      name: 'Crouched Sneaking Right reverse.fbx',
      matchAngle: Math.PI / 2,
      angle: Math.PI / 2,
    },
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

const _normalizeAnimationDurations = (
  animations,
  baseAnimation,
  factor = 1,
) => {
  for (let i = 1; i < animations.length; i++) {
    const animation = animations[i];
    const oldDuration = animation.duration;
    const newDuration = baseAnimation.duration;
    for (const track of animation.tracks) {
      const {times} = track;
      for (let j = 0; j < times.length; j++) {
        times[j] *= (newDuration / oldDuration) * factor;
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
  animations = animationsJson.animations.map(a => AnimationClip.parse(a));
  animationStepIndices = animationsJson.animationStepIndices;
  animations.index = {};
  for (const animation of animations) {
    animations.index[animation.name] = animation;
  }

  /* const animationIndices = animationStepIndices.find(i => i.name === 'Fast Run.fbx');
          for (let i = 0; i < animationIndices.leftFootYDeltas.length; i++) {
            const mesh = new Mesh(new BoxGeometry(0.02, 0.02, 0.02), new MeshBasicMaterial({color: 0xff0000}));
            mesh.position.set(-30 + i * 0.1, 10 + animationIndices.leftFootYDeltas[i] * 10, -15);
            mesh.updateMatrixWorld();
            scene.add(mesh);
          }
          for (let i = 0; i < animationIndices.rightFootYDeltas.length; i++) {
            const mesh = new Mesh(new BoxGeometry(0.02, 0.02, 0.02), new MeshBasicMaterial({color: 0x0000ff}));
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
      gltfLoader.load(
        srcUrl,
        () => {
          resolve();
        },
        function onprogress() {},
        reject,
      );
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

  await Promise.all([loadAnimations(), loadSkeleton()]);

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
    animationsIdleArrays[k].animation =
      animations.index[animationsIdleArrays[k].name];
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
  _normalizeAnimationDurations(
    walkingBackwardAnimations,
    walkingBackwardAnimations[0],
  );
  _normalizeAnimationDurations(runningAnimations, runningAnimations[0]);
  _normalizeAnimationDurations(
    runningBackwardAnimations,
    runningBackwardAnimations[0],
  );
  _normalizeAnimationDurations(
    crouchingForwardAnimations,
    crouchingForwardAnimations[0],
    0.5,
  );
  _normalizeAnimationDurations(
    crouchingBackwardAnimations,
    crouchingBackwardAnimations[0],
    0.5,
  );

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
  cellphoneDrawAnimation = animations.find(a => a.isCellphoneDraw);
  cellphoneUndrawAnimation = animations.find(a => a.isCellphoneUndraw);
  aimAnimations = {
    swordSideIdle: animations.index['sword_idle_side.fbx'],
    swordSideIdleStatic: animations.index['sword_idle_side_static.fbx'],
    swordSideSlash: animations.index['sword_side_slash.fbx'],
    swordSideSlashStep: animations.index['sword_side_slash_step.fbx'],
    swordTopDownSlash: animations.index['sword_topdown_slash.fbx'],
    swordTopDownSlashStep: animations.index['sword_topdown_slash_step.fbx'],
    swordUndraw: animations.index['sword_undraw.fbx'],
  };
  useAnimations = mergeAnimations(
    {
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
      pickaxe: animations.find(a => a.isPickaxe),
    },
    aimAnimations,
  );
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
    grab_forward: {
      animation: animations.index['grab_forward.fbx'],
      speedFactor: 1.2,
    },
    grab_down: {animation: animations.index['grab_down.fbx'], speedFactor: 1.7},
    grab_up: {animation: animations.index['grab_up.fbx'], speedFactor: 1.2},
    grab_left: {animation: animations.index['grab_left.fbx'], speedFactor: 1.2},
    grab_right: {
      animation: animations.index['grab_right.fbx'],
      speedFactor: 1.2,
    },
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
    ['mixamorigSpine1.quaternion', 'mixamorigSpine2.quaternion'].forEach(k => {
      narutoRunAnimations.narutoRun.interpolants[k].evaluate = t =>
        down10QuaternionArray;
    });
  }
})().catch(err => {
  console.log('load avatar animations error', err);
});

export const _applyAnimation = (avatar, now) => {
  // const runSpeed = 0.5;
  const angle = avatar.getAngle();
  const timeSeconds = now / 1000;
  const landTimeSeconds = timeSeconds - avatar.lastLandStartTime / 1000 + 0.8; // in order to align landing 2.fbx with walk/run
  const {idleWalkFactor, walkRunFactor, crouchFactor} = avatar;

  /* const _getAnimationKey = crouchState => {
    if (crouchState) {
      return 'crouch';
    } else {
      if (currentSpeed >= runSpeed) {
        return 'run';
      } else {
        return 'walk';
      }
    }
  }; */
  const _getMirrorAnimationAngles = (animationAngles, key) => {
    const animations = animationAngles.map(({animation}) => animation);
    const animationAngleArrayMirror = animationsAngleArraysMirror[key];

    const backwardIndex = animations.findIndex(a => a.isBackward);
    if (backwardIndex !== -1) {
      // const backwardAnimationAngle = animationAngles[backwardIndex];
      // const angleToBackwardAnimation = Math.abs(angleDifference(angle, backwardAnimationAngle.angle));
      // if (angleToBackwardAnimation < Math.PI * 0.3) {
      const sideIndex = backwardIndex === 0 ? 1 : 0;
      const wrongAngle = animationAngles[sideIndex].angle;
      const newAnimationAngle = animationAngleArrayMirror.find(
        animationAngle => animationAngle.matchAngle === wrongAngle,
      );
      animationAngles = animationAngles.slice();
      animationAngles[sideIndex] = newAnimationAngle;
      // animations[sideIndex] = newAnimationAngle.animation;
      // return {
      // return animationAngles;
      // angleToBackwardAnimation,
      // };
      // }
    }
    // return {
    return animationAngles;
    // angleToBackwardAnimation: Infinity,
    // ;
  };
  const _getAngleToBackwardAnimation = animationAngles => {
    const animations = animationAngles.map(({animation}) => animation);

    const backwardIndex = animations.findIndex(a => a.isBackward);
    if (backwardIndex !== -1) {
      const backwardAnimationAngle = animationAngles[backwardIndex];
      const angleToBackwardAnimation = Math.abs(
        angleDifference(angle, backwardAnimationAngle.angle),
      );
      return angleToBackwardAnimation;
    } else {
      return Infinity;
    }
  };
  const _getIdleAnimation = key => animationsIdleArrays[key].animation;
  /* const _getIdleAnimation = key => {
    if (key === 'walk' || key === 'run') {
      const name = animationsIdleArrays[key].name;
      return avatar.retargetedAnimations.find(a => a.name === name);
    } else {
      return animationsIdleArrays[key].animation;
    }
  }; */
  const _get7wayBlend = (
    horizontalWalkAnimationAngles,
    horizontalWalkAnimationAnglesMirror,
    horizontalRunAnimationAngles,
    horizontalRunAnimationAnglesMirror,
    idleAnimation,
    // mirrorFactor,
    // angleFactor,
    // walkRunFactor,
    // idleWalkFactor,
    k,
    lerpFn,
    isPosition,
    target,
  ) => {
    // WALK
    // normal horizontal walk blend
    {
      const t1 =
        landTimeSeconds % horizontalWalkAnimationAngles[0].animation.duration;
      const src1 = horizontalWalkAnimationAngles[0].animation.interpolants[k];
      const v1 = src1.evaluate(t1);

      const t2 =
        landTimeSeconds % horizontalWalkAnimationAngles[1].animation.duration;
      const src2 = horizontalWalkAnimationAngles[1].animation.interpolants[k];
      const v2 = src2.evaluate(t2);

      lerpFn.call(
        localQuaternion3.fromArray(v2),
        localQuaternion4.fromArray(v1),
        angleFactor,
      );
    }

    // mirror horizontal blend (backwards walk)
    {
      const t1 =
        landTimeSeconds %
        horizontalWalkAnimationAnglesMirror[0].animation.duration;
      const src1 =
        horizontalWalkAnimationAnglesMirror[0].animation.interpolants[k];
      const v1 = src1.evaluate(t1);

      const t2 =
        landTimeSeconds %
        horizontalWalkAnimationAnglesMirror[1].animation.duration;
      const src2 =
        horizontalWalkAnimationAnglesMirror[1].animation.interpolants[k];
      const v2 = src2.evaluate(t2);

      lerpFn.call(
        localQuaternion4.fromArray(v2),
        localQuaternion5.fromArray(v1),
        angleFactor,
      );
    }

    // blend mirrors together to get a smooth walk
    lerpFn.call(
      localQuaternion5.copy(localQuaternion3), // Result is in localQuaternion5
      localQuaternion4,
      mirrorFactor,
    );

    // RUN
    // normal horizontal run blend
    {
      const t1 =
        landTimeSeconds % horizontalRunAnimationAngles[0].animation.duration;
      const src1 = horizontalRunAnimationAngles[0].animation.interpolants[k];
      const v1 = src1.evaluate(t1);

      const t2 =
        landTimeSeconds % horizontalRunAnimationAngles[1].animation.duration;
      const src2 = horizontalRunAnimationAngles[1].animation.interpolants[k];
      const v2 = src2.evaluate(t2);

      lerpFn.call(
        localQuaternion3.fromArray(v2),
        localQuaternion4.fromArray(v1),
        angleFactor,
      );
    }

    // mirror horizontal blend (backwards run)
    {
      const t1 =
        landTimeSeconds %
        horizontalRunAnimationAnglesMirror[0].animation.duration;
      const src1 =
        horizontalRunAnimationAnglesMirror[0].animation.interpolants[k];
      const v1 = src1.evaluate(t1);

      const t2 =
        landTimeSeconds %
        horizontalRunAnimationAnglesMirror[1].animation.duration;
      const src2 =
        horizontalRunAnimationAnglesMirror[1].animation.interpolants[k];
      const v2 = src2.evaluate(t2);

      lerpFn.call(
        localQuaternion4.fromArray(v2),
        localQuaternion6.fromArray(v1),
        angleFactor,
      );
    }

    // blend mirrors together to get a smooth run
    lerpFn.call(
      localQuaternion6.copy(localQuaternion3), // Result is in localQuaternion6
      localQuaternion4,
      mirrorFactor,
    );

    // Blend walk/run
    lerpFn.call(
      localQuaternion4.copy(localQuaternion5), // Result is in localQuaternion4
      localQuaternion6,
      walkRunFactor,
    );

    // blend the smooth walk/run with idle
    {
      const timeSinceLastMove = now - avatar.lastMoveTime;
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

      lerpFn.call(target, localQuaternion4, idleWalkFactor);
    }
  };

  // stand
  // const key = _getAnimationKey(false);
  const keyWalkAnimationAngles = getClosest2AnimationAngles('walk', angle);
  const keyWalkAnimationAnglesMirror = _getMirrorAnimationAngles(
    keyWalkAnimationAngles,
    'walk',
  );

  const keyRunAnimationAngles = getClosest2AnimationAngles('run', angle);
  const keyRunAnimationAnglesMirror = _getMirrorAnimationAngles(
    keyRunAnimationAngles,
    'run',
  );

  const idleAnimation = _getIdleAnimation('walk');

  /* // walk sound effect
    {
      const soundManager = metaversefile.useSoundManager();
      const currAniTime = landTimeSeconds % idleAnimation.duration;

      if (currentSpeed > 0.1) {
        if (key === 'walk') {
          if (currAniTime > 0.26 && currAniTime < 0.4)
            soundManager.playStepSound(1);
          if (currAniTime > 0.76 && currAniTime < 0.9)
            soundManager.playStepSound(2);
          if (currAniTime > 1.26 && currAniTime < 1.4)
            soundManager.playStepSound(3);
          if (currAniTime > 1.76 && currAniTime < 1.9)
            soundManager.playStepSound(4);
          if (currAniTime > 2.26 && currAniTime < 2.5)
            soundManager.playStepSound(5);
        }
        if (key === 'run') {
          if (currAniTime > 0.16 && currAniTime < 0.3)
            soundManager.playStepSound(1);
          if (currAniTime > 0.43 && currAniTime < 0.45)
            soundManager.playStepSound(2);
          if (currAniTime > 0.693 && currAniTime < 0.8)
            soundManager.playStepSound(3);
          if (currAniTime > 0.963 && currAniTime < 1.1)
            soundManager.playStepSound(4);
          if (currAniTime > 1.226 && currAniTime < 1.3)
            soundManager.playStepSound(5);
          if (currAniTime > 1.496 && currAniTime < 1.6)
            soundManager.playStepSound(6);
          if (currAniTime > 1.759 && currAniTime < 1.9)
            soundManager.playStepSound(7);
          if (currAniTime > 2.029 && currAniTime < 2.1)
            soundManager.playStepSound(8);
          if (currAniTime > 2.292 && currAniTime < 2.4)
            soundManager.playStepSound(9);
        }
      }
    } */

  // crouch
  // const keyOther = _getAnimationKey(true);
  const keyAnimationAnglesOther = getClosest2AnimationAngles('crouch', angle);
  const keyAnimationAnglesOtherMirror = _getMirrorAnimationAngles(
    keyAnimationAnglesOther,
    'crouch',
  );
  const idleAnimationOther = _getIdleAnimation('crouch');

  const angleToClosestAnimation = Math.abs(
    angleDifference(angle, keyWalkAnimationAnglesMirror[0].angle),
  );
  const angleBetweenAnimations = Math.abs(
    angleDifference(
      keyWalkAnimationAnglesMirror[0].angle,
      keyWalkAnimationAnglesMirror[1].angle,
    ),
  );
  const angleFactor =
    (angleBetweenAnimations - angleToClosestAnimation) / angleBetweenAnimations;
  const isBackward =
    _getAngleToBackwardAnimation(keyWalkAnimationAnglesMirror) < Math.PI * 0.4;
  if (isBackward !== avatar.lastIsBackward) {
    avatar.backwardAnimationSpec = {
      startFactor: avatar.lastBackwardFactor,
      endFactor: isBackward ? 1 : 0,
      startTime: now,
      endTime: now + 150,
    };
    avatar.lastIsBackward = isBackward;
  }
  let mirrorFactor;
  if (avatar.backwardAnimationSpec) {
    const f =
      (now - avatar.backwardAnimationSpec.startTime) /
      (avatar.backwardAnimationSpec.endTime -
        avatar.backwardAnimationSpec.startTime);
    if (f >= 1) {
      mirrorFactor = avatar.backwardAnimationSpec.endFactor;
      avatar.backwardAnimationSpec = null;
    } else {
      mirrorFactor =
        avatar.backwardAnimationSpec.startFactor +
        Math.pow(f, 0.5) *
          (avatar.backwardAnimationSpec.endFactor -
            avatar.backwardAnimationSpec.startFactor);
    }
  } else {
    mirrorFactor = isBackward ? 1 : 0;
  }
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

    lerpFn.call(target.copy(localQuaternion), localQuaternion2, crouchFactor);
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
    if (avatar.cellphoneDrawState) {
      return spec => {
        const {animationTrackName: k, dst, isPosition, boneName} = spec;

        _handleDefault(spec);
        const t2 = avatar.cellphoneDrawTime / 1000;
        if (!isPosition) {
          if (cellphoneDrawAnimation) {
            const src2 = cellphoneDrawAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            const idleAnimation = _getIdleAnimation('walk');
            const t3 = 0;
            const src3 = idleAnimation.interpolants[k];
            const v3 = src3.evaluate(t3);

            // if(!(

            //   boneName === 'Right_shoulder'
            // )) {

            // }
            dst.premultiply(localQuaternion2.fromArray(v3).invert());
            dst.premultiply(localQuaternion2.fromArray(v2));
          }
        }
      };
    } else if (avatar.cellphoneUndrawState) {
      return spec => {
        const {animationTrackName: k, dst, isPosition, boneName} = spec;

        _handleDefault(spec);
        const t2 = avatar.cellphoneUndrawTime / 1000;
        if (!isPosition) {
          if (cellphoneUndrawAnimation) {
            const src2 = cellphoneUndrawAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            const idleAnimation = _getIdleAnimation('walk');
            const t3 = 0;
            const src3 = idleAnimation.interpolants[k];
            const v3 = src3.evaluate(t3);

            // if(!(
            //   boneName === 'Right_arm' ||
            //   boneName === 'Right_shoulder'
            // )) {

            // }
            dst.premultiply(localQuaternion2.fromArray(v3).invert());
            dst.premultiply(localQuaternion2.fromArray(v2));
          }
        }
      };
    }
    if (avatar.doubleJumpState) {
      return spec => {
        const {animationTrackName: k, dst, isPosition} = spec;

        const t2 = avatar.doubleJumpTime / 1000;
        const src2 = doubleJumpAnimation.interpolants[k];
        const v2 = src2.evaluate(t2);

        dst.fromArray(v2);

        _clearXZ(dst, isPosition);
      };
    }
    if (avatar.jumpState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          isPosition,
          isArm,
        } = spec;

        const t2 = avatar.jumpTime / 1000;
        const src2 = jumpAnimation.interpolants[k];
        const v2 = src2.evaluate(t2);

        dst.fromArray(v2);

        _clearXZ(dst, isPosition);

        if (avatar.holdState && isArm) {
          const holdAnimation = holdAnimations.pick_up_idle;
          const src2 = holdAnimation.interpolants[k];
          const t2 = (now / 1000) % holdAnimation.duration;
          const v2 = src2.evaluate(t2);
          dst.fromArray(v2);
        }
      };
    }

    if (avatar.sitState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
        } = spec;

        const sitAnimation =
          sitAnimations[avatar.sitAnimation || defaultSitAnimation];
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

        const narutoRunAnimation =
          narutoRunAnimations[defaultNarutoRunAnimation];
        const src2 = narutoRunAnimation.interpolants[k];
        const t2 =
          ((avatar.narutoRunTime / 1000) * narutoRunTimeFactor) %
          narutoRunAnimation.duration;
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

        const danceAnimation =
          danceAnimations[avatar.danceAnimation || defaultDanceAnimation];
        const src2 = danceAnimation.interpolants[k];
        const t2 = (now / 1000) % danceAnimation.duration;
        const v2 = src2.evaluate(t2);

        const danceFactorS = avatar.danceFactor / defaultActionTransitionTime;
        const f = Math.min(Math.max(danceFactorS, 0), 1);
        lerpFn.call(dst, localQuaternion.fromArray(v2), f);

        _clearXZ(dst, isPosition);
      };
    }

    if (avatar.emoteFactor > 0) {
      return spec => {
        const {
          animationTrackName: k,
          boneName,
          dst,
          lerpFn,
          isTop,
          isPosition,
        } = spec;

        _handleDefault(spec);

        const emoteAnimation =
          emoteAnimations[avatar.emoteAnimation || defaultEmoteAnimation];
        const src2 = emoteAnimation.interpolants[k];
        const emoteTime = now - avatar.lastEmoteTime;
        const t2 = Math.min(emoteTime / 1000, emoteAnimation.duration);
        const v2 = src2.evaluate(t2);

        const emoteFactorS = avatar.emoteFactor / defaultActionTransitionTime;
        let f = Math.min(Math.max(emoteFactorS, 0), 1);

        if (
          boneName === 'Spine' ||
          boneName === 'Chest' ||
          boneName === 'UpperChest' ||
          boneName === 'Neck' ||
          boneName === 'Head'
        ) {
          if (!isPosition) {
            dst.premultiply(localQuaternion.fromArray(v2));
          } else {
            dst.lerp(localVector.fromArray(v2), f);
          }
        } else {
          if (!isTop) {
            f *= 1 - idleWalkFactor;
          }

          lerpFn.call(dst, localQuaternion.fromArray(v2), f);
        }

        _clearXZ(dst, isPosition);
      };
    }

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
          const useAnimationName =
            avatar.useAnimationCombo[avatar.useAnimationIndex];
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
              if (useTimeS < animationTimeBase + animation.duration) {
                useAnimation = animation;
                break;
              }
              animationTimeBase += animation.duration;
            }
            if (useAnimation !== undefined) {
              // first iteration
              t2 = Math.min(
                useTimeS - animationTimeBase,
                useAnimation.duration,
              );
            } else {
              // loop
              const secondLastAnimationName =
                avatar.useAnimationEnvelope[
                  avatar.useAnimationEnvelope.length - 2
                ];
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

            const idleAnimation = _getIdleAnimation('walk');
            const t3 = 0;
            const src3 = idleAnimation.interpolants[k];
            const v3 = src3.evaluate(t3);

            dst
              .premultiply(localQuaternion2.fromArray(v3).invert())
              .premultiply(localQuaternion2.fromArray(v2));
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

            dst.sub(localVector3).add(localVector2);
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

        const hurtAnimation =
          avatar.hurtAnimation && hurtAnimations[avatar.hurtAnimation];
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

          dst.sub(localVector2.fromArray(v3)).add(localVector2.fromArray(v2));
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

        const aimAnimation =
          avatar.aimAnimation && aimAnimations[avatar.aimAnimation];
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

          dst.sub(localVector2.fromArray(v3)).add(localVector2.fromArray(v2));
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
        const f = Math.min(
          Math.max(unuseTimeS / unuseAnimation.duration, 0),
          1,
        );
        const f2 = Math.pow(1 - f, 2);

        if (!isPosition) {
          const src2 = unuseAnimation.interpolants[k];
          const v2 = src2.evaluate(t2);

          const idleAnimation = _getIdleAnimation('walk');
          const t3 = 0;
          const src3 = idleAnimation.interpolants[k];
          const v3 = src3.evaluate(t3);

          localQuaternion
            .copy(dst)
            .premultiply(localQuaternion2.fromArray(v3).invert())
            .premultiply(localQuaternion2.fromArray(v2));

          lerpFn.call(dst, localQuaternion, f2);
        } else {
          const src2 = unuseAnimation.interpolants[k];
          const v2 = src2.evaluate(t2);

          const idleAnimation = _getIdleAnimation('walk');
          const t3 = 0;
          const src3 = idleAnimation.interpolants[k];
          const v3 = src3.evaluate(t3);

          localVector
            .copy(dst)
            .sub(localVector2.fromArray(v3))
            .add(localVector2.fromArray(v2));

          lerpFn.call(dst, localVector, f2);
        }

        if (f >= 1) {
          avatar.useAnimation = '';
        }
      };
    } else if (avatar.holdState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          lerpFn,
          boneName,
          isTop,
          isPosition,
          isArm,
        } = spec;

        _handleDefault(spec);

        const holdAnimation = holdAnimations.pick_up_idle;
        const src2 = holdAnimation.interpolants[k];
        const t2 = (now / 1000) % holdAnimation.duration;
        const v2 = src2.evaluate(t2);

        if (isTop) {
          if (boneName === 'Left_arm' || boneName === 'Right_arm') {
            dst.fromArray(v2);
          } else {
            if (isArm) {
              dst
                .slerp(
                  identityQuaternion,
                  walkRunFactor * 0.7 +
                    crouchFactor * (1 - idleWalkFactor) * 0.5,
                )
                .premultiply(localQuaternion2.fromArray(v2));
            } else {
              dst.premultiply(localQuaternion2.fromArray(v2));
            }
          }
        }
      };
    } else if (avatar.pickUpState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          /* lerpFn,
          isTop,
          isPosition, */
        } = spec;

        const pickUpAnimation = pickUpAnimations.pickUpZelda;
        const pickUpIdleAnimation = pickUpAnimations.pickUpIdleZelda;

        const t2 = avatar.pickUpTime / 1000;
        if (t2 < pickUpAnimation.duration) {
          const src2 = pickUpAnimation.interpolants[k];
          const v2 = src2.evaluate(t2);

          dst.fromArray(v2);
        } else {
          const t3 =
            (t2 - pickUpAnimation.duration) % pickUpIdleAnimation.duration;
          const src2 = pickUpIdleAnimation.interpolants[k];
          const v2 = src2.evaluate(t3);

          dst.fromArray(v2);
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
      isArm,
      lerpFn,
    } = spec;

    if (avatar.flyState || (avatar.flyTime >= 0 && avatar.flyTime < 1000)) {
      const t2 = avatar.flyTime / 1000;
      const f = avatar.flyState
        ? Math.min(cubicBezier(t2), 1)
        : 1 - Math.min(cubicBezier(t2), 1);
      const src2 = floatAnimation.interpolants[k];
      const v2 = src2.evaluate(t2 % floatAnimation.duration);

      lerpFn.call(dst, localQuaternion.fromArray(v2), f);

      if (avatar.holdState && isArm) {
        const holdAnimation = holdAnimations.pick_up_idle;
        const src2 = holdAnimation.interpolants[k];
        const t2 = (now / 1000) % holdAnimation.duration;
        const v2 = src2.evaluate(t2);
        dst.fromArray(v2);
      }
    }
  };
  const _blendLand = spec => {
    const {
      animationTrackName: k,
      dst,
      // isTop,
      isPosition,
    } = spec;

    if (!avatar.landWithMoving) {
      const animationSpeed = 0.75;
      const landTimeS = avatar.landTime / 1000;
      const landingAnimation = animations.index['landing.fbx'];
      const landingAnimationDuration =
        landingAnimation.duration / animationSpeed;
      const landFactor = landTimeS / landingAnimationDuration;

      if (landFactor > 0 && landFactor <= 1) {
        const t2 = landTimeS * animationSpeed;
        const src2 = landingAnimation.interpolants[k];
        const v2 = src2.evaluate(t2);

        let f = (landingAnimationDuration - landTimeS) / 0.05; // 0.05 = 3 frames
        f = MathUtils.clamp(f, 0, 1);

        if (!isPosition) {
          localQuaternion.fromArray(v2);
          dst.slerp(localQuaternion, f);
        } else {
          localVector.fromArray(v2);
          _clearXZ(localVector, isPosition);
          dst.lerp(localVector, f);
        }
      }
    } else {
      const animationSpeed = 0.95;
      const landTimeS = avatar.landTime / 1000;
      const landingAnimation = animations.index['landing 2.fbx'];
      const landingAnimationDuration =
        landingAnimation.duration / animationSpeed;
      const landFactor = landTimeS / landingAnimationDuration;

      if (landFactor > 0 && landFactor <= 1) {
        const t2 = landTimeS * animationSpeed;
        const src2 = landingAnimation.interpolants[k];
        const v2 = src2.evaluate(t2);

        /* Calculating the time since the player landed on the ground. */
        let f3 = landTimeS / 0.1;
        f3 = MathUtils.clamp(f3, 0, 1);

        /* Calculating the time remaining until the landing animation is complete. */
        let f2 = (landingAnimationDuration - landTimeS) / 0.15;
        f2 = MathUtils.clamp(f2, 0, 1);

        const f = Math.min(f3, f2);

        if (!isPosition) {
          localQuaternion2.fromArray(v2);
          dst.slerp(localQuaternion2, f);
        } else {
          localVector2.fromArray(v2);
          dst.lerp(localVector2, f);
          _clearXZ(dst, isPosition);
        }
      }
    }
  };

  const _blendFallLoop = spec => {
    const {animationTrackName: k, dst, isPosition, lerpFn} = spec;

    if (avatar.fallLoopFactor > 0) {
      const t2 = avatar.fallLoopTime / 1000;
      const src2 = fallLoopAnimation.interpolants[k];
      const v2 = src2.evaluate(t2);
      const f = MathUtils.clamp(t2 / 0.3, 0, 1);

      if (avatar.fallLoopFrom === 'jump') {
        dst.fromArray(v2);
      } else {
        lerpFn.call(dst, localQuaternion.fromArray(v2), f);
      }

      _clearXZ(dst, isPosition);
    }
  };

  const _blendSwim = spec => {
    const {animationTrackName: k, dst, isPosition, boneName} = spec;

    if (avatar.swimState) {
      const swimTimeS = avatar.swimTime / 1000;
      const movementsTimeS = avatar.movementsTime / 1000;

      const src2 = floatAnimation.interpolants[k];
      const v2 = src2.evaluate(swimTimeS % floatAnimation.duration);

      const src3 = animations.index['Swimming.fbx'].interpolants[k];
      const v3 = src3.evaluate(
        (movementsTimeS * 1) % animations.index['Swimming.fbx'].duration,
      );

      const src4 = animations.index['freestyle.fbx'].interpolants[k];
      const v4 = src4.evaluate(
        (movementsTimeS * 2) % animations.index['freestyle.fbx'].duration,
      );

      const f = MathUtils.clamp(swimTimeS / 0.2, 0, 1);
      // if (isPosition) console.log(f);

      if (!isPosition) {
        localQuaternion2.fromArray(v2);
        localQuaternion3.fromArray(v3);
        localQuaternion4.fromArray(v4);
        localQuaternion5.set(0, 0, 0, 1);
        localQuaternion6.set(1, 0, 0, 0);

        if (
          !avatar.swimmingOnSurfaceState ||
          (avatar.swimmingOnSurfaceState &&
            avatar.horizontalMovementsTransitionFactor > 0)
        ) {
          localQuaternion3.slerp(localQuaternion4, avatar.sprintFactor);
          localQuaternion2.slerp(
            localQuaternion3,
            avatar.movementsTransitionFactor,
          );
        }

        if (boneName === 'Hips') {
          if (
            avatar.swimUpFactor > 0 &&
            avatar.horizontalMovementsTransitionFactor === 0
          ) {
            localQuaternion2.slerp(
              localQuaternion5,
              avatar.swimUpFactor * avatar.surfaceFactor,
            );
          } else if (
            avatar.swimDownFactor > 0 &&
            avatar.horizontalMovementsTransitionFactor === 0
          ) {
            localQuaternion2.slerp(localQuaternion6, avatar.swimDownFactor);
          } else {
            const fU =
              (avatar.swimUpFactor /
                (avatar.swimUpFactor +
                  avatar.horizontalMovementsTransitionFactor)) *
                avatar.surfaceFactor || 0;
            const fD =
              (avatar.swimDownFactor /
                (avatar.swimDownFactor +
                  avatar.horizontalMovementsTransitionFactor)) *
                avatar.surfaceFactor || 0;
            localQuaternion2.slerp(localQuaternion5, fU);
            localQuaternion2.slerp(localQuaternion6, fD);
          }
        }
        dst.slerp(localQuaternion2, f);
      } else {
        localVector2.fromArray(v2);
        if (
          !avatar.swimmingOnSurfaceState ||
          (avatar.swimmingOnSurfaceState &&
            avatar.horizontalMovementsTransitionFactor > 0)
        ) {
          const liftSwims = 0.035 * avatar.height; // lift swims height, prevent head sink in water
          localVector3.fromArray(v3);
          localVector3.y += liftSwims;
          localVector4.fromArray(v4);
          localVector4.y += liftSwims;
          localVector3.lerp(localVector4, avatar.sprintFactor);
          localVector2.lerp(localVector3, avatar.movementsTransitionFactor);
        }
        dst.lerp(localVector2, f);
      }
    }
  };
  const _blendActivateAction = spec => {
    const {
      animationTrackName: k,
      boneName,
      dst,
      isTop,
      isPosition,
      lerpFn,
    } = spec;

    if (avatar.activateTime > 0) {
      const player = metaversefile.getPlayerByAppInstanceId(
        avatar.app.getComponent('instanceId'),
      );

      let defaultAnimation = 'grab_forward';

      const activateAction = player && player.getAction('activate');
      // the action can be unset on remote player while this is still happening
      // null check to prevent a frame of empty action at the end of the pickup
      if (activateAction && activateAction.animationName) {
        defaultAnimation = activateAction.animationName;
      }

      const activateAnimation = activateAnimations[defaultAnimation].animation;
      const src2 = activateAnimation.interpolants[k];
      const t2 =
        ((avatar.activateTime / 1000) *
          activateAnimations[defaultAnimation].speedFactor) %
        activateAnimation.duration;
      const v2 = src2.evaluate(t2);

      let f =
        avatar.activateTime > 0
          ? Math.min(cubicBezier(t2), 1)
          : 1 - Math.min(cubicBezier(t2), 1);

      if (
        boneName === 'Spine' ||
        boneName === 'Chest' ||
        boneName === 'UpperChest' ||
        boneName === 'Neck' ||
        boneName === 'Head'
      ) {
        if (!isPosition) {
          dst.premultiply(localQuaternion.fromArray(v2));
        } else {
          dst.lerp(localVector.fromArray(v2), f);
        }
      } else {
        if (!isTop) {
          f *= 1 - idleWalkFactor;
        }

        lerpFn.call(dst, localQuaternion.fromArray(v2), f);
      }
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
    _blendFallLoop(spec);
    _blendLand(spec);
    _blendActivateAction(spec);
    _blendSwim(spec);

    // ignore all animation position except y
    if (isPosition) {
      if (avatar.swimState) {
        // animations position is height-relative
        dst.y *= avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
      } else if (
        avatar.jumpState ||
        avatar.doubleJumpState ||
        avatar.fallLoopState
      ) {
        // force height in the jump case to overide the animation
        dst.y = avatar.height * 0.55;
      } else {
        // animations position is height-relative
        dst.y *= avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
      }
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

export const _getLerpFn = isPosition =>
  isPosition ? Vector3.prototype.lerp : Quaternion.prototype.slerp;

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

    const lookAtHorizontalInnerCurve = _importCurveMapperBone(
      lookAtHorizontalInner,
    );
    const lookAtHorizontalOuterCurve = _importCurveMapperBone(
      lookAtHorizontalOuter,
    );
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
