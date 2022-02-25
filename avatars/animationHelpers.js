import { Vector3, Quaternion, AnimationClip } from 'three';
import metaversefile from 'metaversefile';
import {VRMSpringBoneImporter, VRMLookAtApplyer, VRMCurveMapper} from '@pixiv/three-vrm/lib/three-vrm.module.js';
import { zbdecode } from 'zjs/encoding.mjs';

import {
  angleDifference,
  // getVelocityDampingFactor,
  // getNextPhysicsId,
} from '../util.js';

import {
  // getSkinnedMeshes,
  // getSkeleton,
  // getEyePosition,
  // getHeight,
  // makeBoneMap,
  // getTailBones,
  // getModelBones,
  // cloneModelBones,
  // retargetAnimation,
  // animationBoneToModelBone,
  decorateAnimation,
} from './util.mjs';


// const localVector4 = new Vector3();
// const localVector5 = new Vector3();
// const localVector6 = new Vector3();

const localQuaternion3 = new Quaternion();
const localQuaternion4 = new Quaternion();
const localQuaternion5 = new Quaternion();
const localQuaternion6 = new Quaternion();


let animations;
let animationStepIndices;
let animationsBaseModel;
let jumpAnimation;
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
// let chargeJump;
// let standCharge;
let fallLoop;
// let swordSideSlash;
// let swordTopDownSlash;

const angles = {
  horizontalWalkAnimationAngles: null,
  horizontalWalkAnimationAnglesMirror: null,
  horizontalRunAnimationAngles: null,
  horizontalRunAnimationAnglesMirror: null
}
const anglesOther = {
  horizontalWalkAnimationAngles: null,
  horizontalWalkAnimationAnglesMirror: null,
  horizontalRunAnimationAngles: null,
  horizontalRunAnimationAnglesMirror: null
}

let idleAnimation;
let idleAnimationOther;

let angleFactor = 0;
let mirrorFactor;

let activeAvatar;
let activeMoveFactors;


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


const _clearXZ = (dst, isPosition) => {
  if (isPosition) {
    dst.x = 0;
    dst.z = 0;
  }
};

// export const _normalizeAnimationDurations = (animations, baseIndex = 0, factor = 1) => {
const _normalizeAnimationDurations = (animations, baseAnimation, factor = 1) => {

  // const baseAnimation = animations[baseIndex];
  
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

  /* const animationIndices = animationStepIndices.find(i => i.name === 'Fast Run.fbx');
  for (let i = 0; i < animationIndices.leftFootYDeltas.length; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.02, 0.02, 0.02), new THREE.MeshBasicMaterial({color: 0xff0000}));
    mesh.position.set(-30 + i * 0.1, 10 + animationIndices.leftFootYDeltas[i] * 10, -15);
    mesh.updateMatrixWorld();
    scene.add(mesh);
  }
  for (let i = 0; i < animationIndices.rightFootYDeltas.length; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.02, 0.02, 0.02), new THREE.MeshBasicMaterial({color: 0x0000ff}));
    mesh.position.set(-30 + i * 0.1, 10 + animationIndices.rightFootYDeltas[i] * 10, -15);
    mesh.updateMatrixWorld();
    scene.add(mesh);
  } */
}

async function loadSkeleton() {
  const srcUrl = '/animations/animations-skeleton.glb';

  let o;
  try {
    o = await new Promise((accept, reject) => {
      const { gltfLoader } = metaversefile.useLoaders();
      gltfLoader.load(srcUrl, accept, function onprogress() { }, reject);
    });
  } catch (err) {
    console.warn(err);
  }
  if (o) {
    animationsBaseModel = o;
  }
}

export const loadPromise = (async () => {
  await Promise.resolve(); // wait for metaversefile to be defined
  
  await Promise.all([
    loadAnimations(),
    loadSkeleton()
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
  
  const animationGroups = {};  //do we need this?


  /* jumpAnimationSegments = {
   chargeJump: animations.find(a => a.isChargeJump),
   chargeJumpFall: animations.find(a => a.isChargeJumpFall),
   isFallLoop: animations.find(a => a.isFallLoop),
   isLanding: animations.find(a => a.isLanding)
 }; */

  // chargeJump = animations.find(a => a.isChargeJump);
  // standCharge = animations.find(a => a.isStandCharge);
  fallLoop = animations.find(a => a.isFallLoop);
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
  throwAnimations = {
    throw: animations.find(a => a.isThrow),
  };
  /* crouchAnimations = {
    crouch: animations.find(a => a.isCrouch),
  }; */
  activateAnimations = {
    grab_forward: {animation: animations.index['grab_forward.fbx'], speedFactor: 1.2},
    grab_down: {animation: animations.index['grab_down.fbx'], speedFactor: 1.7},
    grab_up: {animation: animations.index['grab_up.fbx'], speedFactor: 1.2},
    grab_left: {animation: animations.index['grab_left.fbx'], speedFactor: 1.2},
    grab_right: {animation: animations.index['grab_right.fbx'], speedFactor: 1.2},
  };
  narutoRunAnimations = {
    narutoRun: animations.find(a => a.isNarutoRun),
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


const _getMirrorAnimationAngles = (animationAngles, key) => {
  const animations = animationAngles.map(({ animation }) => animation);
  const animationAngleArrayMirror = animationsAngleArraysMirror[key];

  const backwardIndex = animations.findIndex(a => a.isBackward);
  if (backwardIndex !== -1) {
    // const backwardAnimationAngle = animationAngles[backwardIndex];
    // const angleToBackwardAnimation = Math.abs(angleDifference(angle, backwardAnimationAngle.angle));
    // if (angleToBackwardAnimation < Math.PI * 0.3) {
    const sideIndex = backwardIndex === 0 ? 1 : 0;
    const wrongAngle = animationAngles[sideIndex].angle;
    const newAnimationAngle = animationAngleArrayMirror.find(animationAngle => animationAngle.matchAngle === wrongAngle);
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
const _getAngleToBackwardAnimation = (angle, animationAngles) => {
  const animations = animationAngles.map(({ animation }) => animation);

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
/* const _getIdleAnimation = key => {
  if (key === 'walk' || key === 'run') {
    const name = animationsIdleArrays[key].name;
    return avatar.retargetedAnimations.find(a => a.name === name);
  } else {
    return animationsIdleArrays[key].animation;
  }
}; */

const _getHorizontalBlend = (k, lerpFn, isPosition, target, now) => {
  _get7wayBlend(
    activeAvatar,
    angles,
    idleAnimation,
    // mirrorFactor,
    // angleFactor,
    activeMoveFactors,
    k,
    lerpFn,
    isPosition,
    activeAvatar.localQuaternion,
    now
  );
  _get7wayBlend(
    activeAvatar,
    anglesOther,
    idleAnimationOther,
    // mirrorFactor,
    // angleFactor,
    activeMoveFactors,
    k,
    lerpFn,
    isPosition,
    activeAvatar.localQuaternion2,
    now
  );

  //_get5wayBlend(anglesOther.horizontalAnimationAngles, anglesOther.horizontalAnimationAnglesMirror, idleAnimationOther, mirrorFactor, angleFactor, speedFactor, k, lerpFn, avatar.localQuaternion2);

  lerpFn
    .call(
      target.copy(activeAvatar.localQuaternion),
      activeAvatar.localQuaternion2,
      activeMoveFactors.crouchFactor
    );

};

const _get7wayBlend = (
  avatar,
  angles,
  idleAnimation,
  // mirrorFactor,
  // angleFactor,
  moveFactors,
  k,
  lerpFn,
  isPosition,
  target,
  now
) => {
  const timeSeconds = now / 1000;

  const {horizontalWalkAnimationAngles,
    horizontalWalkAnimationAnglesMirror,
    horizontalRunAnimationAngles,
    horizontalRunAnimationAnglesMirror} = angles;
  const {idleWalkFactor, walkRunFactor} = moveFactors;

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

    lerpFn
      .call(
        target,
        localQuaternion4,
        idleWalkFactor
      );
  }
};

const prepAngles = (angle)=>{
  angles.horizontalWalkAnimationAngles = getClosest2AnimationAngles('walk', angle);
  angles.horizontalWalkAnimationAnglesMirror = _getMirrorAnimationAngles(angles.horizontalWalkAnimationAngles, 'walk');

  angles.horizontalRunAnimationAngles = getClosest2AnimationAngles('run', angle);
  angles.horizontalRunAnimationAnglesMirror = _getMirrorAnimationAngles(angles.horizontalRunAnimationAngles, 'run');

  anglesOther.horizontalWalkAnimationAngles = getClosest2AnimationAngles('crouch', angle);
  anglesOther.horizontalWalkAnimationAnglesMirror = _getMirrorAnimationAngles(anglesOther.horizontalWalkAnimationAngles, 'crouch');

  anglesOther.horizontalRunAnimationAngles = getClosest2AnimationAngles('crouch', angle);
  anglesOther.horizontalRunAnimationAnglesMirror = _getMirrorAnimationAngles(anglesOther.horizontalRunAnimationAngles, 'crouch');

  const angleToClosestAnimation = Math.abs(angleDifference(angle, angles.horizontalWalkAnimationAnglesMirror[0].angle));
  const angleBetweenAnimations = Math.abs(angleDifference(angles.horizontalWalkAnimationAnglesMirror[0].angle, angles.horizontalWalkAnimationAnglesMirror[1].angle));
  angleFactor = (angleBetweenAnimations - angleToClosestAnimation) / angleBetweenAnimations;
  
}

const _blendFly = spec => {
  const {
    animationTrackName: k,
    dst,
    // isTop,
    lerpFn,
  } = spec;

  if (activeAvatar.flyState || (activeAvatar.flyTime >= 0 && activeAvatar.flyTime < 1000)) {
    const t2 = activeAvatar.flyTime / 1000;
    const f = activeAvatar.flyState ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));
    const src2 = floatAnimation.interpolants[k];
    const v2 = src2.evaluate(t2 % floatAnimation.duration);

    lerpFn
      .call(
        dst,
        activeAvatar.localQuaternion.fromArray(v2),
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

  if (activeAvatar.activateTime > 0) {

    const localPlayer = metaversefile.useLocalPlayer();

    let defaultAnimation = "grab_forward";

    if (localPlayer.getAction('activate').animationName) {
      defaultAnimation = localPlayer.getAction('activate').animationName;
    }

    const activateAnimation = activateAnimations[defaultAnimation].animation;
    const src2 = activateAnimation.interpolants[k];
    const t2 = ((activeAvatar.activateTime / 1000) * activateAnimations[defaultAnimation].speedFactor) % activateAnimation.duration;
    const v2 = src2.evaluate(t2);

    const f = activeAvatar.activateTime > 0 ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));

    lerpFn
      .call(
        dst,
        activeAvatar.localQuaternion.fromArray(v2),
        f
      );
  }
};

export const _applyAnimation = (avatar, now, moveFactors) => {
  activeMoveFactors = moveFactors;
  // const runSpeed = 0.5;
  activeAvatar = avatar;
  const angle = avatar.getAngle();

  prepAngles(angle);

  // stand
  idleAnimation = _getIdleAnimation('walk');
  // crouch
  idleAnimationOther = _getIdleAnimation('crouch');

  /* // walk sound effect
  playStepSounds();
   */


  const isBackward = _getAngleToBackwardAnimation(angle, angles.horizontalWalkAnimationAnglesMirror) < Math.PI * 0.4;
  if (isBackward !== avatar.lastIsBackward) {
    avatar.backwardAnimationSpec = {
      startFactor: avatar.lastBackwardFactor,
      endFactor: isBackward ? 1 : 0,
      startTime: now,
      endTime: now + 150,
    };
    avatar.lastIsBackward = isBackward;
  }
  if (avatar.backwardAnimationSpec) {
    const f = (now - avatar.backwardAnimationSpec.startTime) / (avatar.backwardAnimationSpec.endTime - avatar.backwardAnimationSpec.startTime);
    if (f >= 1) {
      mirrorFactor = avatar.backwardAnimationSpec.endFactor;
      avatar.backwardAnimationSpec = null;
    } else {
      mirrorFactor = avatar.backwardAnimationSpec.startFactor +
        Math.pow(
          f,
          0.5
        ) * (avatar.backwardAnimationSpec.endFactor - avatar.backwardAnimationSpec.startFactor);
    }
  } else {
    mirrorFactor = isBackward ? 1 : 0;
  }
  avatar.lastBackwardFactor = mirrorFactor;


  const _handleDefault = (spec) => {
    const {
      animationTrackName: k,
      dst,
      // isTop,
      lerpFn,
      isPosition,
    } = spec;

    _getHorizontalBlend(k, lerpFn, isPosition, dst, now);
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
      }
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

    if (avatar.danceTime > 0) {
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
        const t2 = (timestamp / 1000) % danceAnimation.duration;
        const v2 = src2.evaluate(t2);

        const danceTimeS = avatar.danceTime / crouchMaxTime;
        const f = Math.min(Math.max(danceTimeS, 0), 1);
        lerpFn
          .call(
            dst,
            avatar.localQuaternion.fromArray(v2),
            f
          );

        _clearXZ(dst, isPosition);
      };
    }

    if (avatar.fallLoopState) {
      return spec => {
        const {
          animationTrackName: k,
          dst,
          // isTop,
        } = spec;

        const t2 = (avatar.fallLoopTime / 1000);
        const src2 = fallLoop.interpolants[k];
        const v2 = src2.evaluate(t2);

        dst.fromArray(v2);
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
        

        const throwAnimation = throwAnimations[avatar.throwAnimation || defaultThrowAnimation];
        const danceAnimation = danceAnimations[0];
        const src2 = throwAnimation.interpolants[k];
        const v2 = src2.evaluate(t2);

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

            const idleAnimation = _getIdleAnimation('walk');
            const t3 = 0;
            const src3 = idleAnimation.interpolants[k];
            const v3 = src3.evaluate(t3);

            dst
              .premultiply(avatar.localQuaternion2.fromArray(v3).invert())
              .premultiply(avatar.localQuaternion2.fromArray(v2));
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
              .premultiply(avatar.localQuaternion2.fromArray(v3).invert())
              .premultiply(avatar.localQuaternion2.fromArray(v2));
          }
        } else {
          const src2 = aimAnimation.interpolants[k];
          const v2 = src2.evaluate(t2);

          const idleAnimation = _getIdleAnimation('walk');
          const t3 = 0;
          const src3 = idleAnimation.interpolants[k];
          const v3 = src3.evaluate(t3);

          dst
            .sub(avatar.localVector2.fromArray(v3))
            .add(avatar.localVector2.fromArray(v2));
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

          const idleAnimation = _getIdleAnimation('walk');
          const t3 = 0;
          const src3 = idleAnimation.interpolants[k];
          const v3 = src3.evaluate(t3);

          localQuaternion.copy(dst)
            .premultiply(localQuaternion2.fromArray(v3).invert())
            .premultiply(localQuaternion2.fromArray(v2));

          lerpFn
            .call(
              dst,
              localQuaternion,
              f2
            );
        } else {
          const src2 = unuseAnimation.interpolants[k];
          const v2 = src2.evaluate(t2);

          const idleAnimation = _getIdleAnimation('walk');
          const t3 = 0;
          const src3 = idleAnimation.interpolants[k];
          const v3 = src3.evaluate(t3);

          localVector.copy(dst)
            .sub(localVector2.fromArray(v3))
            .add(localVector2.fromArray(v2));

          lerpFn
            .call(
              dst,
              localVector,
              f2
            );
        }

        if (f >= 1) {
          avatar.useAnimation = '';
        }
      };      
    }

    return _handleDefault;
  };

  const applyFn = _getApplyFn();


  for (const spec of avatar.animationMappings) {
    const {
      animationTrackName: k,
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
  }
};

export {
  animations,
  animationStepIndices,
}

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
  return null; // can't happen
};

export const _getLerpFn = isPosition => isPosition ? Vector3.prototype.lerp : Quaternion.prototype.slerp;

export function getFirstPersonCurves(vrmExtension) {
  const DEG2RAD = Math.PI / 180; // THREE.MathUtils.DEG2RAD;
  function _importCurveMapperBone(map) {
    return new VRMCurveMapper(
      typeof map.xRange === 'number' ? DEG2RAD * map.xRange : undefined,
      typeof map.yRange === 'number' ? DEG2RAD * map.yRange : undefined,
      map.curve,
    );
  }
  if (vrmExtension) {
    const { firstPerson } = vrmExtension;
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



// const crouchMagnitude = 0.2;
/* const animationsSelectMap = {
    crouch: {
      'Crouch Idle.fbx': new THREE.Vector3(0, 0, 0),
      'Sneaking Forward.fbx': new THREE.Vector3(0, 0, -crouchMagnitude),
      'Sneaking Forward reverse.fbx': new THREE.Vector3(0, 0, crouchMagnitude),
      'Crouched Sneaking Left.fbx': new THREE.Vector3(-crouchMagnitude, 0, 0),
      'Crouched Sneaking Right.fbx': new THREE.Vector3(crouchMagnitude, 0, 0),
    },
    stand: {
      'idle.fbx': new THREE.Vector3(0, 0, 0),
      'jump.fbx': new THREE.Vector3(0, 1, 0),

      'left strafe walking.fbx': new THREE.Vector3(-0.5, 0, 0),
      'left strafe.fbx': new THREE.Vector3(-1, 0, 0),
      'right strafe walking.fbx': new THREE.Vector3(0.5, 0, 0),
      'right strafe.fbx': new THREE.Vector3(1, 0, 0),

      'Fast Run.fbx': new THREE.Vector3(0, 0, -1),
      'walking.fbx': new THREE.Vector3(0, 0, -0.5),

      'running backwards.fbx': new THREE.Vector3(0, 0, 1),
      'walking backwards.fbx': new THREE.Vector3(0, 0, 0.5),

      'left strafe walking reverse.fbx': new THREE.Vector3(-Infinity, 0, 0),
      'left strafe reverse.fbx': new THREE.Vector3(-Infinity, 0, 0),
      'right strafe walking reverse.fbx': new THREE.Vector3(Infinity, 0, 0),
      'right strafe reverse.fbx': new THREE.Vector3(Infinity, 0, 0),
    },
  };
  const animationsDistanceMap = {
    'idle.fbx': new THREE.Vector3(0, 0, 0),
    'jump.fbx': new THREE.Vector3(0, 1, 0),

    'left strafe walking.fbx': new THREE.Vector3(-0.5, 0, 0),
    'left strafe.fbx': new THREE.Vector3(-1, 0, 0),
    'right strafe walking.fbx': new THREE.Vector3(0.5, 0, 0),
    'right strafe.fbx': new THREE.Vector3(1, 0, 0),

    'Fast Run.fbx': new THREE.Vector3(0, 0, -1),
    'walking.fbx': new THREE.Vector3(0, 0, -0.5),

    'running backwards.fbx': new THREE.Vector3(0, 0, 1),
    'walking backwards.fbx': new THREE.Vector3(0, 0, 0.5),

    'left strafe walking reverse.fbx': new THREE.Vector3(-1, 0, 1).normalize().multiplyScalar(2),
    'left strafe reverse.fbx': new THREE.Vector3(-1, 0, 1).normalize().multiplyScalar(3),
    'right strafe walking reverse.fbx': new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(2),
    'right strafe reverse.fbx': new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(3),

    'Crouch Idle.fbx': new THREE.Vector3(0, 0, 0),
    'Sneaking Forward.fbx': new THREE.Vector3(0, 0, -crouchMagnitude),
    'Sneaking Forward reverse.fbx': new THREE.Vector3(0, 0, crouchMagnitude),
    'Crouched Sneaking Left.fbx': new THREE.Vector3(-crouchMagnitude, 0, 0),
    'Crouched Sneaking Left reverse.fbx': new THREE.Vector3(-crouchMagnitude, 0, crouchMagnitude),
    'Crouched Sneaking Right.fbx': new THREE.Vector3(crouchMagnitude, 0, 0),
    'Crouched Sneaking Right reverse.fbx': new THREE.Vector3(crouchMagnitude, 0, crouchMagnitude),
  }; */

// const _findBoneDeep = (bones, boneName) => {
//   for (let i = 0; i < bones.length; i++) {
//     const bone = bones[i];
//     if (bone.name === boneName) {
//       return bone;
//     } else {
//       const deepBone = _findBoneDeep(bone.children, boneName);
//       if (deepBone) {
//         return deepBone;
//       }
//     }
//   }
//   return null;
// };

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
const _importArmature = b => _importObject(b, THREE.Object3D, THREE.Bone);
const _importSkeleton = s => {
  const armature = _importArmature(JSON.parse(s));
  return new THREE.Skeleton(armature.children);
}; */

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

// const playStepSounds = (now) => {
//     const key = _getAnimationKey(false);

//   const soundManager = metaversefile.useSoundManager();
//   const currAniTime = (now/1000) % idleAnimation.duration;

//   if (currentSpeed > 0.1) {
//     if (key === 'walk') {
//       if (currAniTime > 0.26 && currAniTime < 0.4)
//         soundManager.playStepSound(1);
//       if (currAniTime > 0.76 && currAniTime < 0.9)
//         soundManager.playStepSound(2);
//       if (currAniTime > 1.26 && currAniTime < 1.4)
//         soundManager.playStepSound(3);
//       if (currAniTime > 1.76 && currAniTime < 1.9)
//         soundManager.playStepSound(4);
//       if (currAniTime > 2.26 && currAniTime < 2.5)
//         soundManager.playStepSound(5);
//     }
//     if (key === 'run') {
//       if (currAniTime > 0.16 && currAniTime < 0.3)
//         soundManager.playStepSound(1);
//       if (currAniTime > 0.43 && currAniTime < 0.45)
//         soundManager.playStepSound(2);
//       if (currAniTime > 0.693 && currAniTime < 0.8)
//         soundManager.playStepSound(3);
//       if (currAniTime > 0.963 && currAniTime < 1.1)
//         soundManager.playStepSound(4);
//       if (currAniTime > 1.226 && currAniTime < 1.3)
//         soundManager.playStepSound(5);
//       if (currAniTime > 1.496 && currAniTime < 1.6)
//         soundManager.playStepSound(6);
//       if (currAniTime > 1.759 && currAniTime < 1.9)
//         soundManager.playStepSound(7);
//       if (currAniTime > 2.029 && currAniTime < 2.1)
//         soundManager.playStepSound(8);
//       if (currAniTime > 2.292 && currAniTime < 2.4)
//         soundManager.playStepSound(9);
//     }
//   }
// }