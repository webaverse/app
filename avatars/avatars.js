import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {VRMSpringBoneImporter} from '@pixiv/three-vrm/lib/three-vrm.module.js';
import {fixSkeletonZForward} from './vrarmik/SkeletonUtils.js';
import PoseManager from './vrarmik/PoseManager.js';
import ShoulderTransforms from './vrarmik/ShoulderTransforms.js';
import LegsManager from './vrarmik/LegsManager.js';
// import {world} from '../world.js';
import MicrophoneWorker from './microphone-worker.js';
import skeletonString from './skeleton.js';
import {angleDifference} from '../util.js';
import physicsManager from '../physics-manager.js';
import easing from '../easing.js';
import CBOR from '../cbor.js';
import Simplex from '../simplex-noise.js';

VRMSpringBoneImporter.prototype._createSpringBone = (_createSpringBone => {
  const localVector = new THREE.Vector3();
  return function(a, b) {
    const bone = _createSpringBone.apply(this, arguments);
    const initialDragForce = bone.dragForce;
    const initialStiffnessForce = bone.stiffnessForce;
    // const initialGravityPower = bone.gravityPower;
    
    Object.defineProperty(bone, 'stiffnessForce', {
      get() {
        localVector.set(physicsManager.velocity.x, 0, physicsManager.velocity.z);
        const f = Math.pow(Math.min(Math.max(localVector.length()*2 - Math.abs(physicsManager.velocity.y)*0.5, 0), 4), 2);
        return initialStiffnessForce * (0.05 + 0.1*f);
      },
      set(v) {},
    });
    Object.defineProperty(bone, 'dragForce', {
      get() {
        return initialDragForce * 0.75;
      },
      set(v) {},
    });
    
    return bone;
  };
})(VRMSpringBoneImporter.prototype._createSpringBone);

const _makeSimplexes = numSimplexes => {
  const result = Array(numSimplexes);
  for (let i = 0; i < numSimplexes; i++) {
    result[i] = new Simplex(i + '');
  }
  return result;
};
const simplexes = _makeSimplexes(5);

// import {FBXLoader} from '../FBXLoader.js';
// import {downloadFile} from '../util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localQuaternion4 = new THREE.Quaternion();
const localQuaternion5 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const lastQuaternion = new THREE.Quaternion();
let trackMouseAmount = 0;

const halfPi = Math.PI/2;
const upVector = new THREE.Vector3(0, 1, 0);
const upRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5);
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
const useAnimationRate = 750;
const crouchMaxTime = 200;

const infinityUpVector = new THREE.Vector3(0, Infinity, 0);
const crouchMagnitude = 0.2;
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
  walk: {name: 'idle.fbx'},
  run: {name: 'idle.fbx'},
  crouch: {name: 'Crouch Idle.fbx'},
};
let animations;

// let walkingAnimations;
// let walkingBackwardAnimations;
// let runningAnimations;
// let runningBackwardAnimations;
let jumpAnimation;
// let sittingAnimation;
let floatAnimation;
// let rifleAnimation;
// let hitAnimation;
let useAnimations;
let sitAnimations;
let danceAnimations;
let throwAnimations;
let crouchAnimations;
let activateAnimations;
let narutoRunAnimations;
const loadPromise = (async () => {
  const res = await fetch('../animations/animations.cbor');
  const arrayBuffer = await res.arrayBuffer();
  animations = CBOR.decode(arrayBuffer).animations
    .map(a => THREE.AnimationClip.parse(a));

  for (const k in animationsAngleArrays) {
    const as = animationsAngleArrays[k];
    for (const a of as) {
      a.animation = animations.find(animation => animation.name === a.name);
    }
  }
  for (const k in animationsAngleArraysMirror) {
    const as = animationsAngleArraysMirror[k];
    for (const a of as) {
      a.animation = animations.find(animation => animation.name === a.name);
    }
  }
  for (const k in animationsIdleArrays) {
    animationsIdleArrays[k].animation = animations.find(animation => animation.name === animationsIdleArrays[k].name);
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
  ].map(name => animations.find(a => a.name === name));
  _normalizeAnimationDurations(walkingAnimations, walkingAnimations[0]);
  const walkingBackwardAnimations = [
    `walking backwards.fbx`,
    `left strafe walking reverse.fbx`,
    `right strafe walking reverse.fbx`,
  ].map(name => animations.find(a => a.name === name));
  _normalizeAnimationDurations(walkingBackwardAnimations, walkingBackwardAnimations[0]);
  const runningAnimations = [
    `Fast Run.fbx`,
    `left strafe.fbx`,
    `right strafe.fbx`,
  ].map(name => animations.find(a => a.name === name));
  _normalizeAnimationDurations(runningAnimations, runningAnimations[0]);
  const runningBackwardAnimations = [
    `running backwards.fbx`,
    `left strafe reverse.fbx`,
    `right strafe reverse.fbx`,
  ].map(name => animations.find(a => a.name === name));
  _normalizeAnimationDurations(runningBackwardAnimations, runningBackwardAnimations[0]);
  const crouchingForwardAnimations = [
    `Sneaking Forward.fbx`,
    `Crouched Sneaking Left.fbx`,
    `Crouched Sneaking Right.fbx`,
  ].map(name => animations.find(a => a.name === name));
  _normalizeAnimationDurations(crouchingForwardAnimations, crouchingForwardAnimations[0]);
  animations.forEach(animation => {
    animation.direction = (() => {
      switch (animation.name) {
        case 'Fast Run.fbx':
        case 'walking.fbx':
        case 'Sneaking Forward.fbx':
          return 'forward';
        case 'running backwards.fbx':
        case 'walking backwards.fbx':
          return 'backward';
        case 'left strafe walking.fbx':
        case 'left strafe.fbx':
        case 'left strafe walking reverse.fbx':
        case 'left strafe reverse.fbx':
        case 'Crouched Sneaking Left.fbx':
          return 'left';
        case 'right strafe walking.fbx':
        case 'right strafe.fbx':
        case 'right strafe walking reverse.fbx':
        case 'right strafe reverse.fbx':
        case 'Crouched Sneaking Right.fbx':
          return 'right';
        case 'jump.fbx':
        /* case 'falling.fbx':
        case 'falling idle.fbx':
        case 'falling landing.fbx': */
          return 'jump';
        // case 'floating.fbx':
        case 'treading water.fbx':
          return 'float';
        default:
          return null;
      }
    })();
    animation.isIdle = /idle/i.test(animation.name);
    animation.isJump = /^jump/i.test(animation.name);
    animation.isSitting = /sitting/i.test(animation.name);
    // animation.isFalling  = /falling/i.test(animation.name);
    animation.isFloat  = /treading/i.test(animation.name);
    animation.isPistol  = /pistol aiming/i.test(animation.name);
    animation.isRifle  = /rifle aiming/i.test(animation.name);
    // animation.isHit  = /downward/i.test(animation.name);
    animation.isSlash  = /slash/i.test(animation.name);
    // animation.isHit  = /attack/i.test(animation.name);
    animation.isCombo  = /combo/i.test(animation.name);
    // animation.isHit = /sword and shield idle/i.test(animation.name);
    animation.isMagic = /magic/i.test(animation.name);
    animation.isSkateboarding = /skateboarding/i.test(animation.name);
    animation.isThrow = /throw/i.test(animation.name);
    animation.isDancing = /dancing/i.test(animation.name);
    animation.isDrinking = /drinking/i.test(animation.name);
    animation.isCrouch = /crouch|sneak/i.test(animation.name);
    animation.isForward = /forward/i.test(animation.name);
    animation.isBackward = /backwards/i.test(animation.name) || /sneaking forward reverse/i.test(animation.name);
    animation.isLeft = /left/i.test(animation.name);
    animation.isRight = /right/i.test(animation.name);
    animation.isRunning = /fast run|running|left strafe(?: reverse)?\.|right strafe(?: reverse)?\./i.test(animation.name);
    animation.isActivate = /object/i.test(animation.name);
    animation.isNarutoRun = /naruto run/i.test(animation.name);
    animation.isReverse = /reverse/i.test(animation.name);
    animation.interpolants = {};
    animation.tracks.forEach(track => {
      const i = track.createInterpolant();
      i.name = track.name;
      animation.interpolants[track.name] = i;
      return i;
    });
    /* for (let i = 0; i < animation.interpolants['mixamorigHips.position'].sampleValues.length; i++) {
      animation.interpolants['mixamorigHips.position'].sampleValues[i] *= 0.01;
    } */
  });
  
  jumpAnimation = animations.find(a => a.isJump);
  // sittingAnimation = animations.find(a => a.isSitting);
  floatAnimation = animations.find(a => a.isFloat);
  // rifleAnimation = animations.find(a => a.isRifle);
  // hitAnimation = animations.find(a => a.isHit);
  useAnimations = {
    combo: animations.find(a => a.isCombo),
    slash: animations.find(a => a.isSlash),
    rifle: animations.find(a => a.isRifle),
    pistol: animations.find(a => a.isPistol),
    magic: animations.find(a => a.isMagic),
    drink: animations.find(a => a.isDrinking),
  };
  sitAnimations = {
    chair: animations.find(a => a.isSitting),
    saddle: animations.find(a => a.isSitting),
    stand: animations.find(a => a.isSkateboarding),
  };
  danceAnimations = {
    dansu: animations.find(a => a.isDancing),
  };
  throwAnimations = {
    throw: animations.find(a => a.isThrow),
  };
  crouchAnimations = {
    crouch: animations.find(a => a.isCrouch),
  };
  activateAnimations = {
    activate: animations.find(a => a.isActivate),
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

  /* // bake animations
  (async () => {
    animations = [];
    const fbxLoader = new FBXLoader();
    const animationFileNames = [
      `idle.fbx`,
      `jump.fbx`,
      `left strafe walking.fbx`,
      `left strafe.fbx`,
      // `left turn 90.fbx`,
      // `left turn.fbx`,
      `right strafe walking.fbx`,
      `right strafe.fbx`,
      // `right turn 90.fbx`,
      // `right turn.fbx`,
      `running.fbx`,
      `walking.fbx`,
      // `ybot.fbx`,
      `running backwards.fbx`,
      `walking backwards.fbx`,
      // `falling.fbx`,
      // `falling idle.fbx`,
      // `falling landing.fbx`,
      // `floating.fbx`,
      `treading water.fbx`,
      `sitting idle.fbx`,
      `Pistol Aiming Idle.fbx`,
      `Pistol Idle.fbx`,
      `Rifle Aiming Idle.fbx`,
      `Rifle Idle.fbx`,
      `Standing Torch Idle 01.fbx`,
      `standing melee attack downward.fbx`,
      `sword and shield idle (4).fbx`,
      `sword and shield slash.fbx`,
      `sword and shield attack (4).fbx`,
      `One Hand Sword Combo.fbx`,
      `magic standing idle.fbx`,
      `Skateboarding.fbx`,
      `Throw.fbx`,
      `Hip Hop Dancing.fbx`,
      `Crouch Idle.fbx`,
      `Standing To Crouched.fbx`,
      `Crouched To Standing.fbx`,
      `Sneaking Forward.fbx`,
      `Crouched Sneaking Left.fbx`,
      `Crouched Sneaking Right.fbx`,
    ];
    for (const name of animationFileNames) {
      const u = './animations/' + name;
      let o = await new Promise((accept, reject) => {
        fbxLoader.load(u, accept, function progress() {}, reject);
      });
      o = o.animations[0];
      o.name = name;
      animations.push(o);
    }
    const _reverseAnimation = animation => {
      animation = animation.clone();
      const {tracks} = animation;
      for (const track of tracks) {
        track.times.reverse();
        for (let i = 0; i < track.times.length; i++) {
          track.times[i] = animation.duration - track.times[i];
        }

        const values2 = new track.values.constructor(track.values.length);
        const valueSize = track.getValueSize();
        const numValues = track.values.length / valueSize;
        for (let i = 0; i < numValues; i++) {
          const aIndex = i;
          const bIndex = numValues - 1 - i;
          for (let j = 0; j < valueSize; j++) {
            values2[aIndex * valueSize + j] = track.values[bIndex * valueSize + j];
          }
        }
        track.values = values2;
      }
      return animation;
    };
    const reversibleAnimationNames = [
      `left strafe walking.fbx`,
      `left strafe.fbx`,
      `right strafe walking.fbx`,
      `right strafe.fbx`,
      `Sneaking Forward.fbx`,
      `Crouched Sneaking Left.fbx`,
      `Crouched Sneaking Right.fbx`,
    ];
    for (const name of reversibleAnimationNames) {
      const animation = animations.find(a => a.name === name);
      const reverseAnimation = _reverseAnimation(animation);
      reverseAnimation.name = animation.name.replace(/\.fbx$/, ' reverse.fbx');
      animations.push(reverseAnimation);
    }
    const animationsJson = animations.map(a => a.toJSON());
    const animationsString = JSON.stringify(animationsJson);
    const animationsCborBuffer = CBOR.encode({
      animations: animationsJson,
    });
    console.log('decoding 1', animationsCborBuffer);
    console.log('decoding 2', CBOR.decode(animationsCborBuffer));
    animations = JSON.parse(animationsString).map(a => THREE.AnimationClip.parse(a));
    console.log('exporting', animations);
    downloadFile(new Blob([animationsCborBuffer], {
      type: 'application/cbor',
    }), 'animations.cbor');
  })().catch(err => {
    console.warn(err);
  }); */
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
const copySkeleton = (src, dst) => {
  for (let i = 0; i < src.bones.length; i++) {
    const srcBone = src.bones[i];
    const dstBone = _findBoneDeep(dst.bones, srcBone.name);
    dstBone.matrixWorld.copy(srcBone.matrixWorld);
  }

  // const armature = dst.bones[0].parent;
  // _localizeMatrixWorld(armature);

  dst.calculateInverses();
};

const cubeGeometry = new THREE.ConeBufferGeometry(0.05, 0.2, 3)
  .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)))
  );
const cubeGeometryPositions = cubeGeometry.attributes.position.array;
const numCubeGeometryPositions = cubeGeometryPositions.length;
const srcCubeGeometries = {};
/* const _makeDebugMeshes = () => {
  const geometries = [];
  const _makeCubeMesh = (color, scale = 1) => {
    color = new THREE.Color(color);

    let srcGeometry = srcCubeGeometries[scale];
    if (!srcGeometry) {
      srcGeometry = cubeGeometry.clone()
        .applyMatrix4(localMatrix.makeScale(scale, scale, scale));
      srcCubeGeometries[scale] = srcGeometry;
    }
    const geometry = srcGeometry.clone();
    const colors = new Float32Array(cubeGeometry.attributes.position.array.length);
    for (let i = 0; i < colors.length; i += 3) {
      color.toArray(colors, i);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const index = geometries.length;
    geometries.push(geometry);
    return [index, srcGeometry];
  };
  const fingerScale = 0.25;
  const attributes = {
    eyes: _makeCubeMesh(0xFF0000),
    head: _makeCubeMesh(0xFF8080),

    chest: _makeCubeMesh(0xFFFF00),
    upperChest: _makeCubeMesh(0x808000),
    leftShoulder: _makeCubeMesh(0x00FF00),
    rightShoulder: _makeCubeMesh(0x008000),
    leftUpperArm: _makeCubeMesh(0x00FFFF),
    rightUpperArm: _makeCubeMesh(0x008080),
    leftLowerArm: _makeCubeMesh(0x0000FF),
    rightLowerArm: _makeCubeMesh(0x000080),
    leftHand: _makeCubeMesh(0xFFFFFF),
    rightHand: _makeCubeMesh(0x808080),

    leftThumb2: _makeCubeMesh(0xFF0000, fingerScale),
    leftThumb1: _makeCubeMesh(0x00FF00, fingerScale),
    leftThumb0: _makeCubeMesh(0x0000FF, fingerScale),
    leftIndexFinger3: _makeCubeMesh(0xFF0000, fingerScale),
    leftIndexFinger2: _makeCubeMesh(0x00FF00, fingerScale),
    leftIndexFinger1: _makeCubeMesh(0x0000FF, fingerScale),
    leftMiddleFinger3: _makeCubeMesh(0xFF0000, fingerScale),
    leftMiddleFinger2: _makeCubeMesh(0x00FF00, fingerScale),
    leftMiddleFinger1: _makeCubeMesh(0x0000FF, fingerScale),
    leftRingFinger3: _makeCubeMesh(0xFF0000, fingerScale),
    leftRingFinger2: _makeCubeMesh(0x00FF00, fingerScale),
    leftRingFinger1: _makeCubeMesh(0x0000FF, fingerScale),
    leftLittleFinger3: _makeCubeMesh(0xFF0000, fingerScale),
    leftLittleFinger2: _makeCubeMesh(0x00FF00, fingerScale),
    leftLittleFinger1: _makeCubeMesh(0x0000FF, fingerScale),
    rightThumb2: _makeCubeMesh(0xFF0000, fingerScale),
    rightThumb1: _makeCubeMesh(0x00FF00, fingerScale),
    rightThumb0: _makeCubeMesh(0x0000FF, fingerScale),
    rightIndexFinger3: _makeCubeMesh(0xFF0000, fingerScale),
    rightIndexFinger2: _makeCubeMesh(0x00FF00, fingerScale),
    rightIndexFinger1: _makeCubeMesh(0x0000FF, fingerScale),
    rightMiddleFinger3: _makeCubeMesh(0xFF0000, fingerScale),
    rightMiddleFinger2: _makeCubeMesh(0x00FF00, fingerScale),
    rightMiddleFinger1: _makeCubeMesh(0x0000FF, fingerScale),
    rightRingFinger3: _makeCubeMesh(0xFF0000, fingerScale),
    rightRingFinger2: _makeCubeMesh(0x00FF00, fingerScale),
    rightRingFinger1: _makeCubeMesh(0x0000FF, fingerScale),
    rightLittleFinger3: _makeCubeMesh(0xFF0000, fingerScale),
    rightLittleFinger2: _makeCubeMesh(0x00FF00, fingerScale),
    rightLittleFinger1: _makeCubeMesh(0x0000FF, fingerScale),

    hips: _makeCubeMesh(0xFF0000),
    leftUpperLeg: _makeCubeMesh(0xFFFF00),
    rightUpperLeg: _makeCubeMesh(0x808000),
    leftLowerLeg: _makeCubeMesh(0x00FF00),
    rightLowerLeg: _makeCubeMesh(0x008000),
    leftFoot: _makeCubeMesh(0xFFFFFF),
    rightFoot: _makeCubeMesh(0x808080),
  };
  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  for (const k in attributes) {
    const [index, srcGeometry] = attributes[k];
    const attribute = new THREE.BufferAttribute(
      new Float32Array(geometry.attributes.position.array.buffer, geometry.attributes.position.array.byteOffset + index*numCubeGeometryPositions*Float32Array.BYTES_PER_ELEMENT, numCubeGeometryPositions),
      3
    );
    attribute.srcGeometry = srcGeometry;
    attribute.visible = true;
    attributes[k] = attribute;
  }
  const material = new THREE.MeshPhongMaterial({
    flatShading: true,
    vertexColors: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.attributes = attributes;
  return mesh;
}; */

const _getTailBones = skeleton => {
  const result = [];
  const _recurse = bones => {
    for (let i = 0; i < bones.length; i++) {
      const bone = bones[i];
      if (bone.children.length === 0) {
        if (!result.includes(bone)) {
          result.push(bone);
        }
      } else {
        _recurse(bone.children);
      }
    }
  };
  _recurse(skeleton.bones);
  return result;
};
const _findClosestParentBone = (bone, pred) => {
  for (; bone?.isBone; bone = bone.parent) {
    if (pred(bone)) {
      return bone;
    }
  }
  return null;
};
const _findFurthestParentBone = (bone, pred) => {
  let result = null;
  for (; bone?.isBone; bone = bone.parent) {
    if (pred(bone)) {
      result = bone;
    }
  }
  return result;
};
const _distanceToParentBone = (bone, parentBone) => {
  for (let i = 0; bone; bone = bone.parent, i++) {
    if (bone === parentBone) {
      return i;
    }
  }
  return Infinity;
};
const _findClosestChildBone = (bone, pred) => {
  const _recurse = bone => {
    if (pred(bone)) {
      return bone;
    } else {
      for (let i = 0; i < bone.children.length; i++) {
        const result = _recurse(bone.children[i]);
        if (result) {
          return result;
        }
      }
      return null;
    }
  }
  return _recurse(bone);
};
const _traverseChild = (bone, distance) => {
  if (distance <= 0) {
    return bone;
  } else {
    for (let i = 0; i < bone.children.length; i++) {
      const child = bone.children[i];
      const subchild = _traverseChild(child, distance - 1);
      if (subchild !== null) {
        return subchild;
      }
    }
    return null;
  }
};
const _countCharacters = (name, regex) => {
  let result = 0;
  for (let i = 0; i < name.length; i++) {
    if (regex.test(name[i])) {
      result++;
    }
  }
  return result;
};
const _findHips = skeleton => skeleton.bones.find(bone => /hip|rootx/i.test(bone.name));
const _findHead = tailBones => {
  const headBones = tailBones.map(tailBone => {
    const headBone = _findFurthestParentBone(tailBone, bone => /head/i.test(bone.name));
    if (headBone) {
      return headBone;
    } else {
      return null;
    }
  }).filter(bone => bone);
  const headBone = headBones.length > 0 ? headBones[0] : null;
  if (headBone) {
    return headBone;
  } else {
    return null;
  }
};
const _findEye = (tailBones, left) => {
  const regexp = left ? /l/i : /r/i;
  const eyeBones = tailBones.map(tailBone => {
    const eyeBone = _findClosestParentBone(tailBone, bone => bone.isBone && /eye/i.test(bone.name) && regexp.test(bone.name.replace(/eye/gi, '')));
    if (eyeBone) {
      return eyeBone;
    } else {
      return null;
    }
  }).filter(spec => spec).sort((a, b) => {
    const aName = a.name.replace(/shoulder/gi, '');
    const aLeftBalance = _countCharacters(aName, /l/i) - _countCharacters(aName, /r/i);
    const bName = b.name.replace(/shoulder/gi, '');
    const bLeftBalance = _countCharacters(bName, /l/i) - _countCharacters(bName, /r/i);
    if (!left) {
      return aLeftBalance - bLeftBalance;
    } else {
      return bLeftBalance - aLeftBalance;
    }
  });
  const eyeBone = eyeBones.length > 0 ? eyeBones[0] : null;
  if (eyeBone) {
    return eyeBone;
  } else {
    return null;
  }
};
const _findSpine = (chest, hips) => {
  for (let bone = chest; bone; bone = bone.parent) {
    if (bone.parent === hips) {
      return bone;
    }
  }
  return null;
};
const _findShoulder = (tailBones, left) => {
  const regexp = left ? /l/i : /r/i;
  const shoulderBones = tailBones.map(tailBone => {
    const shoulderBone = _findClosestParentBone(tailBone, bone => /shoulder/i.test(bone.name) && regexp.test(bone.name.replace(/shoulder/gi, '')));
    if (shoulderBone) {
      const distance = _distanceToParentBone(tailBone, shoulderBone);
      if (distance >= 3) {
        return {
          bone: shoulderBone,
          distance,
        };
      } else {
        return null;
      }
    } else {
      return null;
    }
  }).filter(spec => spec).sort((a, b) => {
    const diff = b.distance - a.distance;
    if (diff !== 0) {
      return diff;
    } else {
      const aName = a.bone.name.replace(/shoulder/gi, '');
      const aLeftBalance = _countCharacters(aName, /l/i) - _countCharacters(aName, /r/i);
      const bName = b.bone.name.replace(/shoulder/gi, '');
      const bLeftBalance = _countCharacters(bName, /l/i) - _countCharacters(bName, /r/i);
      if (!left) {
        return aLeftBalance - bLeftBalance;
      } else {
        return bLeftBalance - aLeftBalance;
      }
    }
  });
  const shoulderBone = shoulderBones.length > 0 ? shoulderBones[0].bone : null;
  if (shoulderBone) {
    return shoulderBone;
  } else {
    return null;
  }
};
const _findHand = shoulderBone => _findClosestChildBone(shoulderBone, bone => /hand|wrist/i.test(bone.name));
const _findFinger = (handBone, r) => _findClosestChildBone(handBone, bone => r.test(bone.name));
const _findFoot = (tailBones, left) => {
  const regexp = left ? /l/i : /r/i;
  const legBones = tailBones.map(tailBone => {
    const footBone = _findFurthestParentBone(tailBone, bone => /foot|ankle|leg(?:l|r)4|UpperLegNeck/i.test(bone.name) && regexp.test(bone.name.replace(/foot|ankle|leg(l|r)4|UpperLegNeck/gi, '$1')));
    if (footBone) {
      const legBone = _findFurthestParentBone(footBone, bone => /leg|thigh|legl2|LowerLeg/i.test(bone.name) && regexp.test(bone.name.replace(/leg|thigh|leg(?:l|r)2|LowerLeg/gi, '')));
      if (legBone) {
        const distance = _distanceToParentBone(footBone, legBone);
        if (distance >= 2) {
          return {
            footBone,
            distance,
          };
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }).filter(spec => spec).sort((a, b) => {
    const diff = b.distance - a.distance;
    if (diff !== 0) {
      return diff;
    } else {
      const aName = a.footBone.name.replace(/foot|ankle/gi, '');
      const aLeftBalance = _countCharacters(aName, /l/i) - _countCharacters(aName, /r/i);
      const bName = b.footBone.name.replace(/foot|ankle/gi, '');
      const bLeftBalance = _countCharacters(bName, /l/i) - _countCharacters(bName, /r/i);
      if (!left) {
        return aLeftBalance - bLeftBalance;
      } else {
        return bLeftBalance - aLeftBalance;
      }
    }
  });
  const footBone = legBones.length > 0 ? legBones[0].footBone : null;
  if (footBone) {
    return footBone;
  } else {
    return null;
  }
};
const _findArmature = bone => {
  for (;; bone = bone.parent) {
    if (!bone.isBone) {
      return bone;
    }
  }
  return null; // can't happen
};

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

class AnimationMapping {
  constructor(quaternionKey, quaternion, isTop) {
    this.quaternionKey = quaternionKey;
    this.quaternion = quaternion;
    this.isTop = isTop;
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
      /* if (!o) {
        const scene = new THREE.Scene();

        const skinnedMesh = new THREE.Object3D();
        skinnedMesh.isSkinnedMesh = true;
        skinnedMesh.skeleton = null;
        skinnedMesh.bind = function(skeleton) {
          this.skeleton = skeleton;
        };
        skinnedMesh.bind(_importSkeleton(skeletonString));
        scene.add(skinnedMesh);

        const hips = _findHips(skinnedMesh.skeleton);
        const armature = _findArmature(hips);
        scene.add(armature);

        o = scene;
      } */
      return o;
    })();
    this.model = model;
    this.options = options;
    
    const vrmExtension = object?.parser?.json?.extensions?.VRM;

    const {
      skinnedMeshes,
      skeleton,
      modelBones,
      flipZ,
      flipY,
      flipLeg,
      tailBones,
      armature,
      armatureQuaternion,
      armatureMatrixInverse,
    } = Avatar.bindAvatar(object);
    this.skinnedMeshes = skinnedMeshes;
    this.skeleton = skeleton;
    this.modelBones = modelBones;
    this.flipZ = flipZ;
    this.flipY = flipY;
    this.flipLeg = flipLeg;

    /* if (options.debug) {
      const debugMeshes = _makeDebugMeshes();
      this.model.add(debugMeshes);
      this.debugMeshes = debugMeshes;
    } else {
      this.debugMeshes = null;
    } */

    modelBones.Head.traverse(o => {
      o.savedPosition = o.position.clone();
      o.savedMatrixWorld = o.matrixWorld.clone();
    });

	  const _averagePoint = points => {
      const result = new THREE.Vector3();
      for (let i = 0; i < points.length; i++) {
        result.add(points[i]);
      }
      result.divideScalar(points.length);
      return result;
	  };
    const eyePosition = this.getEyePosition();

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
    
    /* const allHairBones = [];
    const _recurseAllHairBones = bones => {
      for (let i = 0; i < bones.length; i++) {
        const bone = bones[i];
        if (/hair/i.test(bone.name)) {
          allHairBones.push(bone);
        }
        _recurseAllHairBones(bone.children);
      }
    };
    _recurseAllHairBones(skeleton.bones); */
    const hairBones = tailBones.filter(bone => /hair/i.test(bone.name)).map(bone => {
      for (; bone; bone = bone.parent) {
        if (bone.parent === modelBones.Head) {
          return bone;
        }
      }
      return null;
    }).filter(bone => bone);
    // this.allHairBones = allHairBones;
    this.hairBones = hairBones;
    
    this.eyeTarget = new THREE.Vector3();
    this.eyeTargetEnabled = false;

    this.springBoneManager = null;
    let springBoneManagerPromise = null;
    if (options.hair) {
      new Promise((accept, reject) => {
        /* if (!object.parser.json.extensions) {
          object.parser.json.extensions = {};
        }
        if (!object.parser.json.extensions.VRM) {
          object.parser.json.extensions.VRM = {
            secondaryAnimation: {
              boneGroups: this.hairBones.map(hairBone => {
                const boneIndices = [];
                const _recurse = bone => {
                  boneIndices.push(this.allHairBones.indexOf(bone));
                  if (bone.children.length > 0) {
                    _recurse(bone.children[0]);
                  }
                };
                _recurse(hairBone);
                return {
                  comment: hairBone.name,
                  stiffiness: 0.5,
                  gravityPower: 0.2,
                  gravityDir: {
                    x: 0,
                    y: -1,
                    z: 0
                  },
                  dragForce: 0.3,
                  center: -1,
                  hitRadius: 0.02,
                  bones: boneIndices,
                  colliderGroups: [],
                };
              }),
            },
          };
          object.parser.getDependency = async (type, nodeIndex) => {
            if (type === 'node') {
              return this.allHairBones[nodeIndex];
            } else {
              throw new Error('unsupported type');
            }
          };
        } */

        springBoneManagerPromise = new VRMSpringBoneImporter().import(object)
          .then(springBoneManager => {
            this.springBoneManager = springBoneManager;
          });
      });
    }

    const _getOffset = (bone, parent = bone.parent) => bone.getWorldPosition(new THREE.Vector3()).sub(parent.getWorldPosition(new THREE.Vector3()));
    this.initializeBonePositions({
      spine: _getOffset(modelBones.Spine),
      chest: _getOffset(modelBones.Chest),
      upperChest: _getOffset(modelBones.UpperChest),
      neck: _getOffset(modelBones.Neck),
      head: _getOffset(modelBones.Head),
      eyes: eyePosition.clone().sub(modelBones.Head.getWorldPosition(new THREE.Vector3())),

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
      
      // leftToe: _getOffset(modelBones.Left_toe),
      // rightToe: _getOffset(modelBones.Right_toe),
    });

    this.height = eyePosition.clone()
      .sub(_averagePoint([modelBones.Left_ankle.getWorldPosition(new THREE.Vector3()), modelBones.Right_ankle.getWorldPosition(new THREE.Vector3())]))
      .add(new THREE.Vector3(0, 0.1, 0))
      .y;
    this.shoulderWidth = modelBones.Left_arm.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.Right_arm.getWorldPosition(new THREE.Vector3()));
    this.leftArmLength = this.shoulderTransforms.leftArm.armLength;
    this.rightArmLength = this.shoulderTransforms.rightArm.armLength;
    const indexDistance = modelBones.Left_indexFinger1.getWorldPosition(new THREE.Vector3())
      .distanceTo(modelBones.Left_wrist.getWorldPosition(new THREE.Vector3()));
    const handWidth = modelBones.Left_indexFinger1.getWorldPosition(new THREE.Vector3())
      .distanceTo(modelBones.Left_littleFinger1.getWorldPosition(new THREE.Vector3()));
    this.handOffsetLeft = new THREE.Vector3(handWidth*0.7, -handWidth*0.75, indexDistance*0.5);
    this.handOffsetRight = new THREE.Vector3(-handWidth*0.7, -handWidth*0.75, indexDistance*0.5);
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
		this.outputs = {
			eyes: this.shoulderTransforms.eyes,
      eyel: this.shoulderTransforms.eyel,
      eyer: this.shoulderTransforms.eyer,
      head: this.shoulderTransforms.head,
      hips: this.legsManager.hips,
      spine: this.shoulderTransforms.spine,
      chest: this.shoulderTransforms.chest,
      upperChest: this.shoulderTransforms.upperChest,
      neck: this.shoulderTransforms.neck,
      leftShoulder: this.shoulderTransforms.leftShoulderAnchor,
      leftUpperArm: this.shoulderTransforms.leftArm.upperArm,
      leftLowerArm: this.shoulderTransforms.leftArm.lowerArm,
      leftHand: this.shoulderTransforms.leftArm.hand,
      rightShoulder: this.shoulderTransforms.rightShoulderAnchor,
      rightUpperArm: this.shoulderTransforms.rightArm.upperArm,
      rightLowerArm: this.shoulderTransforms.rightArm.lowerArm,
      rightHand: this.shoulderTransforms.rightArm.hand,
      leftUpperLeg: this.legsManager.leftLeg.upperLeg,
      leftLowerLeg: this.legsManager.leftLeg.lowerLeg,
      leftFoot: this.legsManager.leftLeg.foot,
      rightUpperLeg: this.legsManager.rightLeg.upperLeg,
      rightLowerLeg: this.legsManager.rightLeg.lowerLeg,
      rightFoot: this.legsManager.rightLeg.foot,
      leftThumb2: this.shoulderTransforms.rightArm.thumb2,
      leftThumb1: this.shoulderTransforms.rightArm.thumb1,
      leftThumb0: this.shoulderTransforms.rightArm.thumb0,
      leftIndexFinger3: this.shoulderTransforms.rightArm.indexFinger3,
      leftIndexFinger2: this.shoulderTransforms.rightArm.indexFinger2,
      leftIndexFinger1: this.shoulderTransforms.rightArm.indexFinger1,
      leftMiddleFinger3: this.shoulderTransforms.rightArm.middleFinger3,
      leftMiddleFinger2: this.shoulderTransforms.rightArm.middleFinger2,
      leftMiddleFinger1: this.shoulderTransforms.rightArm.middleFinger1,
      leftRingFinger3: this.shoulderTransforms.rightArm.ringFinger3,
      leftRingFinger2: this.shoulderTransforms.rightArm.ringFinger2,
      leftRingFinger1: this.shoulderTransforms.rightArm.ringFinger1,
      leftLittleFinger3: this.shoulderTransforms.rightArm.littleFinger3,
      leftLittleFinger2: this.shoulderTransforms.rightArm.littleFinger2,
      leftLittleFinger1: this.shoulderTransforms.rightArm.littleFinger1,
      rightThumb2: this.shoulderTransforms.leftArm.thumb2,
      rightThumb1: this.shoulderTransforms.leftArm.thumb1,
      rightThumb0: this.shoulderTransforms.leftArm.thumb0,
      rightIndexFinger3: this.shoulderTransforms.leftArm.indexFinger3,
      rightIndexFinger2: this.shoulderTransforms.leftArm.indexFinger2,
      rightIndexFinger1: this.shoulderTransforms.leftArm.indexFinger1,
      rightMiddleFinger3: this.shoulderTransforms.leftArm.middleFinger3,
      rightMiddleFinger2: this.shoulderTransforms.leftArm.middleFinger2,
      rightMiddleFinger1: this.shoulderTransforms.leftArm.middleFinger1,
      rightRingFinger3: this.shoulderTransforms.leftArm.ringFinger3,
      rightRingFinger2: this.shoulderTransforms.leftArm.ringFinger2,
      rightRingFinger1: this.shoulderTransforms.leftArm.ringFinger1,
      rightLittleFinger3: this.shoulderTransforms.leftArm.littleFinger3,
      rightLittleFinger2: this.shoulderTransforms.leftArm.littleFinger2,
      rightLittleFinger1: this.shoulderTransforms.leftArm.littleFinger1,
      // leftToe: this.legsManager.leftToe,
      // rightToe: this.legsManager.rightToe,
		};
		this.modelBoneOutputs = {
	    Hips: this.outputs.hips,
	    Spine: this.outputs.spine,
	    Chest: this.outputs.chest,
	    UpperChest: this.outputs.upperChest,
	    Neck: this.outputs.neck,
	    Head: this.outputs.head,
      Eye_L: this.outputs.eyel,
      Eye_R: this.outputs.eyer,

	    Left_shoulder: this.outputs.rightShoulder,
	    Left_arm: this.outputs.rightUpperArm,
	    Left_elbow: this.outputs.rightLowerArm,
	    Left_wrist: this.outputs.rightHand,
      Left_thumb2: this.outputs.leftThumb2,
      Left_thumb1: this.outputs.leftThumb1,
      Left_thumb0: this.outputs.leftThumb0,
      Left_indexFinger3: this.outputs.leftIndexFinger3,
      Left_indexFinger2: this.outputs.leftIndexFinger2,
      Left_indexFinger1: this.outputs.leftIndexFinger1,
      Left_middleFinger3: this.outputs.leftMiddleFinger3,
      Left_middleFinger2: this.outputs.leftMiddleFinger2,
      Left_middleFinger1: this.outputs.leftMiddleFinger1,
      Left_ringFinger3: this.outputs.leftRingFinger3,
      Left_ringFinger2: this.outputs.leftRingFinger2,
      Left_ringFinger1: this.outputs.leftRingFinger1,
      Left_littleFinger3: this.outputs.leftLittleFinger3,
      Left_littleFinger2: this.outputs.leftLittleFinger2,
      Left_littleFinger1: this.outputs.leftLittleFinger1,
	    Left_leg: this.outputs.rightUpperLeg,
	    Left_knee: this.outputs.rightLowerLeg,
	    Left_ankle: this.outputs.rightFoot,

	    Right_shoulder: this.outputs.leftShoulder,
	    Right_arm: this.outputs.leftUpperArm,
	    Right_elbow: this.outputs.leftLowerArm,
	    Right_wrist: this.outputs.leftHand,
      Right_thumb2: this.outputs.rightThumb2,
      Right_thumb1: this.outputs.rightThumb1,
      Right_thumb0: this.outputs.rightThumb0,
      Right_indexFinger3: this.outputs.rightIndexFinger3,
      Right_indexFinger2: this.outputs.rightIndexFinger2,
      Right_indexFinger1: this.outputs.rightIndexFinger1,
      Right_middleFinger3: this.outputs.rightMiddleFinger3,
      Right_middleFinger2: this.outputs.rightMiddleFinger2,
      Right_middleFinger1: this.outputs.rightMiddleFinger1,
      Right_ringFinger3: this.outputs.rightRingFinger3,
      Right_ringFinger2: this.outputs.rightRingFinger2,
      Right_ringFinger1: this.outputs.rightRingFinger1,
      Right_littleFinger3: this.outputs.rightLittleFinger3,
      Right_littleFinger2: this.outputs.rightLittleFinger2,
      Right_littleFinger1: this.outputs.rightLittleFinger1,
	    Right_leg: this.outputs.leftUpperLeg,
	    Right_knee: this.outputs.leftLowerLeg,
	    Right_ankle: this.outputs.leftFoot,
      // Left_toe: this.outputs.leftToe,
      // Right_toe: this.outputs.rightToe,
	  };

    this.emotes = [];
    if (this.options.visemes) {
      // ["Neutral", "A", "I", "U", "E", "O", "Blink", "Blink_L", "Blink_R", "Angry", "Fun", "Joy", "Sorrow", "Surprised"]
      const _getBlendShapeIndexForPresetName = presetName => {
        const blendShapes = vrmExtension && vrmExtension.blendShapeMaster && vrmExtension.blendShapeMaster.blendShapeGroups;
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
      /* const _getBlendShapeIndexForName = name => {
        const blendShapes = vrmExtension && vrmExtension.blendShapeMaster && vrmExtension.blendShapeMaster.blendShapeGroups;
        if (Array.isArray(blendShapes)) {
          const shape = blendShapes.find(blendShape => blendShape.name.toLowerCase() === name);
          if (shape && shape.binds && shape.binds.length > 0 && typeof shape.binds[0].index === 'number') {
            return shape.binds[0].index;
          } else {
            return null;
          }
        } else {
          return null;
        }
      }; */
      
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

    // this.lastTimestamp = Date.now();

    this.shoulderTransforms.Start();
    this.legsManager.Start();

    if (options.top !== undefined) {
      this.setTopEnabled(!!options.top);
    }
    if (options.bottom !== undefined) {
      this.setBottomEnabled(!!options.bottom);
    }

    /* this.decapitated = false;
    if (options.decapitate) {
      if (springBoneManagerPromise) {
        springBoneManagerPromise.then(() => {
          this.decapitate();
        });
      } else {
        this.decapitate();
      }
    } */

    this.animationMappings = [
      new AnimationMapping('mixamorigHips.quaternion', this.outputs.hips.quaternion, false),
      new AnimationMapping('mixamorigSpine.quaternion', this.outputs.spine.quaternion, false),
      new AnimationMapping('mixamorigSpine1.quaternion', this.outputs.chest.quaternion, false),
      new AnimationMapping('mixamorigSpine2.quaternion', this.outputs.upperChest.quaternion, false),
      new AnimationMapping('mixamorigNeck.quaternion', this.outputs.neck.quaternion, false),
      new AnimationMapping('mixamorigHead.quaternion', this.outputs.head.quaternion, false),

      new AnimationMapping('mixamorigLeftShoulder.quaternion', this.outputs.rightShoulder.quaternion, true),
      new AnimationMapping('mixamorigLeftArm.quaternion', this.outputs.rightUpperArm.quaternion, true),
      new AnimationMapping('mixamorigLeftForeArm.quaternion', this.outputs.rightLowerArm.quaternion, true),
      new AnimationMapping('mixamorigLeftHand.quaternion', this.outputs.rightHand.quaternion, true),
      new AnimationMapping('mixamorigLeftHandMiddle1.quaternion', this.outputs.leftMiddleFinger1.quaternion, true),
      new AnimationMapping('mixamorigLeftHandMiddle2.quaternion', this.outputs.leftMiddleFinger2.quaternion, true),
      new AnimationMapping('mixamorigLeftHandMiddle3.quaternion', this.outputs.leftMiddleFinger3.quaternion, true),
      new AnimationMapping('mixamorigLeftHandThumb1.quaternion', this.outputs.leftThumb0.quaternion, true),
      new AnimationMapping('mixamorigLeftHandThumb2.quaternion', this.outputs.leftThumb1.quaternion, true),
      new AnimationMapping('mixamorigLeftHandThumb3.quaternion', this.outputs.leftThumb2.quaternion, true),
      new AnimationMapping('mixamorigLeftHandIndex1.quaternion', this.outputs.leftIndexFinger1.quaternion, true),
      new AnimationMapping('mixamorigLeftHandIndex2.quaternion', this.outputs.leftIndexFinger2.quaternion, true),
      new AnimationMapping('mixamorigLeftHandIndex3.quaternion', this.outputs.leftIndexFinger3.quaternion, true),
      new AnimationMapping('mixamorigLeftHandRing1.quaternion', this.outputs.leftRingFinger1.quaternion, true),
      new AnimationMapping('mixamorigLeftHandRing2.quaternion', this.outputs.leftRingFinger2.quaternion, true),
      new AnimationMapping('mixamorigLeftHandRing3.quaternion', this.outputs.leftRingFinger3.quaternion, true),
      new AnimationMapping('mixamorigLeftHandPinky1.quaternion', this.outputs.leftLittleFinger1.quaternion, true),
      new AnimationMapping('mixamorigLeftHandPinky2.quaternion', this.outputs.leftLittleFinger2.quaternion, true),
      new AnimationMapping('mixamorigLeftHandPinky3.quaternion', this.outputs.leftLittleFinger3.quaternion, true),

      new AnimationMapping('mixamorigRightShoulder.quaternion', this.outputs.leftShoulder.quaternion, true),
      new AnimationMapping('mixamorigRightArm.quaternion', this.outputs.leftUpperArm.quaternion, true),
      new AnimationMapping('mixamorigRightForeArm.quaternion', this.outputs.leftLowerArm.quaternion, true),
      new AnimationMapping('mixamorigRightHand.quaternion', this.outputs.leftHand.quaternion, true),
      new AnimationMapping('mixamorigRightHandMiddle1.quaternion', this.outputs.rightMiddleFinger1.quaternion, true),
      new AnimationMapping('mixamorigRightHandMiddle2.quaternion', this.outputs.rightMiddleFinger2.quaternion, true),
      new AnimationMapping('mixamorigRightHandMiddle3.quaternion', this.outputs.rightMiddleFinger3.quaternion, true),
      new AnimationMapping('mixamorigRightHandThumb1.quaternion', this.outputs.rightThumb0.quaternion, true),
      new AnimationMapping('mixamorigRightHandThumb2.quaternion', this.outputs.rightThumb1.quaternion, true),
      new AnimationMapping('mixamorigRightHandThumb3.quaternion', this.outputs.rightThumb2.quaternion, true),
      new AnimationMapping('mixamorigRightHandIndex1.quaternion', this.outputs.rightIndexFinger1.quaternion, true),
      new AnimationMapping('mixamorigRightHandIndex2.quaternion', this.outputs.rightIndexFinger2.quaternion, true),
      new AnimationMapping('mixamorigRightHandIndex3.quaternion', this.outputs.rightIndexFinger3.quaternion, true),
      new AnimationMapping('mixamorigRightHandRing1.quaternion', this.outputs.rightRingFinger1.quaternion, true),
      new AnimationMapping('mixamorigRightHandRing2.quaternion', this.outputs.rightRingFinger2.quaternion, true),
      new AnimationMapping('mixamorigRightHandRing3.quaternion', this.outputs.rightRingFinger3.quaternion, true),
      new AnimationMapping('mixamorigRightHandPinky1.quaternion', this.outputs.rightLittleFinger1.quaternion, true),
      new AnimationMapping('mixamorigRightHandPinky2.quaternion', this.outputs.rightLittleFinger2.quaternion, true),
      new AnimationMapping('mixamorigRightHandPinky3.quaternion', this.outputs.rightLittleFinger3.quaternion, true),

      new AnimationMapping('mixamorigRightUpLeg.quaternion', this.outputs.leftUpperLeg.quaternion, false),
      new AnimationMapping('mixamorigRightLeg.quaternion', this.outputs.leftLowerLeg.quaternion, false),
      new AnimationMapping('mixamorigRightFoot.quaternion', this.outputs.leftFoot.quaternion, false),
      // new AnimationMapping('mixamorigRightToeBase.quaternion', null, false),

      new AnimationMapping('mixamorigLeftUpLeg.quaternion', this.outputs.rightUpperLeg.quaternion, false),
      new AnimationMapping('mixamorigLeftLeg.quaternion', this.outputs.rightLowerLeg.quaternion, false),
      new AnimationMapping('mixamorigLeftFoot.quaternion', this.outputs.rightFoot.quaternion, false),
      // new AnimationMapping('mixamorigLeftToeBase.quaternion', null, false),
    ];

    // shared state
    this.direction = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.jumpState = false;
    this.jumpTime = NaN;
    this.flyState = false;
    this.flyTime = NaN;
    this.useTime = NaN;
    this.useAnimation = null;
    this.sitState = false;
    this.sitAnimation = null;
    this.activateState = false;
    this.activateTime = 0;
    this.danceState = false;
    this.danceTime = 0;
    this.danceAnimation = null;
    this.throwState = null;
    this.throwTime = 0;
    this.crouchState = false;
    this.crouchTime = crouchMaxTime;
    this.sitTarget = new THREE.Object3D();
    this.fakeSpeechValue = 0;
    this.fakeSpeechSmoothed = 0;
    this.narutoRunState = false;
    this.narutoRunTime = 0;
    this.aimState = false;
    this.aimDirection = new THREE.Vector3();
    
    // internal state
    this.lastIsBackward = false;
    this.lastBackwardFactor = 0;
    this.backwardAnimationSpec = null;
  }
  static bindAvatar(object) {
    const model = object.scene;
    const vrmExtension = object?.parser?.json?.extensions?.VRM;
    const humanBones = vrmExtension?.humanoid?.humanBones || [];

    model.updateMatrixWorld(true);
    const skinnedMeshes = [];
	  model.traverse(o => {
	    if (o.isSkinnedMesh) {
        skinnedMeshes.push(o);
	    }
	  });
    skinnedMeshes.sort((a, b) => b.skeleton.bones.length - a.skeleton.bones.length);
    // this.skinnedMeshes = skinnedMeshes;

    const skeletonSkinnedMesh = skinnedMeshes.find(o => o.skeleton.bones[0].parent) || null;
    const skeleton = skeletonSkinnedMesh && skeletonSkinnedMesh.skeleton;
    // this.skeleton = skeleton;
    // console.log('got skeleton', skinnedMeshes, skeleton, _exportSkeleton(skeleton));
    const poseSkeletonSkinnedMesh = skeleton ? skinnedMeshes.find(o => o.skeleton !== skeleton && o.skeleton.bones.length >= skeleton.bones.length) : null;
    const poseSkeleton = poseSkeletonSkinnedMesh && poseSkeletonSkinnedMesh.skeleton;
    if (poseSkeleton) {
      copySkeleton(poseSkeleton, skeleton);
      poseSkeletonSkinnedMesh.bind(skeleton);
    }
    
    const boneMap = {};
    for (const {bone, node} of humanBones) {
      const boneSpec = object.parser.json.nodes[node];
      const b = skeleton.bones.find(b => b.userData.name === boneSpec.name);
      boneMap[bone] = b;
      if (!b) {
        console.warn('missing bone:', boneSpec.name);
      }
    }

    const _getOptional = o => o || new THREE.Bone();
    const _ensureParent = (o, parent) => {
      if (!o.parent) {
        if (!parent) {
          parent = new THREE.Bone();
        }
        parent.add(o);
      }
      return o.parent;
    };

	  const tailBones = _getTailBones(skeleton);
    // const tailBones = skeleton.bones.filter(bone => bone.children.length === 0);

    let Eye_L = boneMap.leftEye;
	  let Eye_R = boneMap.rightEye;
	  let Head = boneMap.head;
	  let Neck = boneMap.neck;
	  let UpperChest = boneMap.upperChest;
	  let Chest = boneMap.chest;
	  let Hips = boneMap.hips;
	  let Spine = boneMap.spine;
	  let Left_shoulder = boneMap.leftShoulder;
	  let Left_wrist = boneMap.leftHand;
    let Left_thumb2 = boneMap.leftThumbDistal;
    let Left_thumb1 = boneMap.leftThumbIntermediate;
    let Left_thumb0 = boneMap.leftThumbProximal;
    let Left_indexFinger3 = boneMap.leftIndexDistal;
    let Left_indexFinger2 = boneMap.leftIndexIntermediate;
    let Left_indexFinger1 = boneMap.leftIndexProximal;
    let Left_middleFinger3 = boneMap.leftMiddleDistal;
    let Left_middleFinger2 = boneMap.leftMiddleIntermediate;
    let Left_middleFinger1 = boneMap.leftMiddleProximal;
    let Left_ringFinger3 = boneMap.leftRingDistal;
    let Left_ringFinger2 = boneMap.leftRingIntermediate;
    let Left_ringFinger1 = boneMap.leftRingProximal;
    let Left_littleFinger3 = boneMap.leftLittleDistal;
    let Left_littleFinger2 = boneMap.leftLittleIntermediate;
    let Left_littleFinger1 = boneMap.leftLittleProximal;
	  let Left_elbow = boneMap.leftLowerArm;
	  let Left_arm = boneMap.leftUpperArm;
	  let Right_shoulder = boneMap.rightShoulder;
	  let Right_wrist = boneMap.rightHand;
    let Right_thumb2 = boneMap.rightThumbDistal;
    let Right_thumb1 = boneMap.rightThumbIntermediate;
    let Right_thumb0 = boneMap.rightThumbProximal;
    let Right_indexFinger3 = boneMap.rightIndexDistal;
    let Right_indexFinger2 = boneMap.rightIndexIntermediate;
    let Right_indexFinger1 = boneMap.rightIndexProximal;
    let Right_middleFinger3 = boneMap.rightMiddleDistal;
    let Right_middleFinger2 = boneMap.rightMiddleIntermediate;
    let Right_middleFinger1 = boneMap.rightMiddleProximal;
    let Right_ringFinger3 = boneMap.rightRingDistal;
    let Right_ringFinger2 = boneMap.rightRingIntermediate;
    let Right_ringFinger1 = boneMap.rightRingProximal;
    let Right_littleFinger3 = boneMap.rightLittleDistal;
    let Right_littleFinger2 = boneMap.rightLittleIntermediate;
    let Right_littleFinger1 = boneMap.rightLittleProximal
	  let Right_elbow = boneMap.rightLowerArm;
	  let Right_arm = boneMap.rightUpperArm;
	  let Left_ankle = boneMap.leftFoot;
	  let Left_knee = boneMap.leftLowerLeg;
	  let Left_leg = boneMap.leftUpperLeg;
	  let Right_ankle = boneMap.rightFoot;
	  let Right_knee = boneMap.rightLowerLeg;
	  let Right_leg = boneMap.rightUpperLeg;
    let Left_toe = boneMap.leftToes;
    let Right_toe = boneMap.rightToes;

    if (!Hips) {
      Eye_L = _findEye(tailBones, true);
      Eye_R = _findEye(tailBones, false);
      Head = _findHead(tailBones);
      Neck = Head.parent;
      UpperChest = Neck.parent;
      Chest = UpperChest.parent;
      Hips = _findHips(skeleton);
      Spine = _findSpine(Chest, Hips);
      Left_shoulder = _findShoulder(tailBones, true);
      Left_wrist = _findHand(Left_shoulder);
      Left_thumb2 = _getOptional(_findFinger(Left_wrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02l|l_thumb3|thumb002l/i));
      Left_thumb1 = _ensureParent(Left_thumb2);
      Left_thumb0 = _ensureParent(Left_thumb1, Left_wrist);
      Left_indexFinger3 = _getOptional(_findFinger(Left_wrist, /index(?:finger)?3|index_distal|index02l|indexfinger3_l|index002l/i));
      Left_indexFinger2 = _ensureParent(Left_indexFinger3);
      Left_indexFinger1 = _ensureParent(Left_indexFinger2, Left_wrist);
      Left_middleFinger3 = _getOptional(_findFinger(Left_wrist, /middle(?:finger)?3|middle_distal|middle02l|middlefinger3_l|middle002l/i));
      Left_middleFinger2 = _ensureParent(Left_middleFinger3);
      Left_middleFinger1 = _ensureParent(Left_middleFinger2, Left_wrist);
      Left_ringFinger3 = _getOptional(_findFinger(Left_wrist, /ring(?:finger)?3|ring_distal|ring02l|ringfinger3_l|ring002l/i));
      Left_ringFinger2 = _ensureParent(Left_ringFinger3);
      Left_ringFinger1 = _ensureParent(Left_ringFinger2, Left_wrist);
      Left_littleFinger3 = _getOptional(_findFinger(Left_wrist, /little(?:finger)?3|pinky3|little_distal|little02l|lifflefinger3_l|little002l/i));
      Left_littleFinger2 = _ensureParent(Left_littleFinger3);
      Left_littleFinger1 = _ensureParent(Left_littleFinger2, Left_wrist);
      Left_elbow = /^lower_arm(?:l|r)2$/i.test(Left_wrist.parent.name) ? Left_wrist.parent.parent : Left_wrist.parent;
      Left_arm = Left_elbow.parent;
      Right_shoulder = _findShoulder(tailBones, false);
      Right_wrist = _findHand(Right_shoulder);
      Right_thumb2 = _getOptional(_findFinger(Right_wrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02r|r_thumb3|thumb002r/i));
      Right_thumb1 = _ensureParent(Right_thumb2);
      Right_thumb0 = _ensureParent(Right_thumb1, Right_wrist);
      Right_indexFinger3 = _getOptional(_findFinger(Right_wrist, /index(?:finger)?3|index_distal|index02r|indexfinger3_r|index002r/i));
      Right_indexFinger2 = _ensureParent(Right_indexFinger3);
      Right_indexFinger1 = _ensureParent(Right_indexFinger2, Right_wrist);
      Right_middleFinger3 = _getOptional(_findFinger(Right_wrist, /middle(?:finger)?3|middle_distal|middle02r|middlefinger3_r|middle002r/i));
      Right_middleFinger2 = _ensureParent(Right_middleFinger3);
      Right_middleFinger1 = _ensureParent(Right_middleFinger2, Right_wrist);
      Right_ringFinger3 = _getOptional(_findFinger(Right_wrist, /ring(?:finger)?3|ring_distal|ring02r|ringfinger3_r|ring002r/i));
      Right_ringFinger2 = _ensureParent(Right_ringFinger3);
      Right_ringFinger1 = _ensureParent(Right_ringFinger2, Right_wrist);
      Right_littleFinger3 = _getOptional(_findFinger(Right_wrist, /little(?:finger)?3|pinky3|little_distal|little02r|lifflefinger3_r|little002r/i));
      Right_littleFinger2 = _ensureParent(Right_littleFinger3);
      Right_littleFinger1 = _ensureParent(Right_littleFinger2, Right_wrist);
      Right_elbow = /^lower_arm(?:l|r)2$/i.test(Right_wrist.parent.name) ? Right_wrist.parent.parent : Right_wrist.parent;
      Right_arm = Right_elbow.parent;
      Left_ankle = _findFoot(tailBones, true);
      Left_knee = Left_ankle.parent;
      Left_leg = Left_knee.parent;
      Right_ankle = _findFoot(tailBones, false);
      Right_knee = Right_ankle.parent;
      Right_leg = Right_knee.parent;
    }

    const modelBones = {
	    Hips,
	    Spine,
	    Chest,
      UpperChest,
	    Neck,
	    Head,
	    Eye_L,
	    Eye_R,

	    Left_shoulder,
	    Left_arm,
	    Left_elbow,
	    Left_wrist,
      Left_thumb2,
      Left_thumb1,
      Left_thumb0,
      Left_indexFinger3,
      Left_indexFinger2,
      Left_indexFinger1,
      Left_middleFinger3,
      Left_middleFinger2,
      Left_middleFinger1,
      Left_ringFinger3,
      Left_ringFinger2,
      Left_ringFinger1,
      Left_littleFinger3,
      Left_littleFinger2,
      Left_littleFinger1,
	    Left_leg,
	    Left_knee,
	    Left_ankle,

	    Right_shoulder,
	    Right_arm,
	    Right_elbow,
	    Right_wrist,
      Right_thumb2,
      Right_thumb1,
      Right_thumb0,
      Right_indexFinger3,
      Right_indexFinger2,
      Right_indexFinger1,
      Right_middleFinger3,
      Right_middleFinger2,
      Right_middleFinger1,
      Right_ringFinger3,
      Right_ringFinger2,
      Right_ringFinger1,
      Right_littleFinger3,
      Right_littleFinger2,
      Right_littleFinger1,
	    Right_leg,
	    Right_knee,
	    Right_ankle,
      
      // Left_toe,
      // Right_toe,
	  };
	  // this.modelBones = modelBones;
    /* for (const k in modelBones) {
      if (!modelBones[k]) {
        console.warn('missing bone', k);
      }
    } */

	  const armature = _findArmature(Hips);

    // const eyeDirection = _getEyePosition().sub(Head.getWorldPosition(new Vector3()));
    const leftArmDirection = Left_wrist.getWorldPosition(new THREE.Vector3()).sub(Head.getWorldPosition(new THREE.Vector3()));
	  const flipZ = leftArmDirection.x < 0;//eyeDirection.z < 0;
    const armatureDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(armature.quaternion);
    const flipY = armatureDirection.z < -0.5;
    const legDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(Left_leg.getWorldQuaternion(new THREE.Quaternion()).premultiply(armature.quaternion.clone().invert()));
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

    /* const _findFingerBone = (r, left) => {
      const fingerTipBone = tailBones
        .filter(bone => r.test(bone.name) && _findClosestParentBone(bone, bone => bone === modelBones.Left_wrist || bone === modelBones.Right_wrist))
        .sort((a, b) => {
          const aName = a.name.replace(r, '');
          const aLeftBalance = _countCharacters(aName, /l/i) - _countCharacters(aName, /r/i);
          const bName = b.name.replace(r, '');
          const bLeftBalance = _countCharacters(bName, /l/i) - _countCharacters(bName, /r/i);
          if (!left) {
            return aLeftBalance - bLeftBalance;
          } else {
            return bLeftBalance - aLeftBalance;
          }
        });
      const fingerRootBone = fingerTipBone.length > 0 ? _findFurthestParentBone(fingerTipBone[0], bone => r.test(bone.name)) : null;
      return fingerRootBone;
    }; */
    /* const fingerBones = {
      left: {
        thumb: _findFingerBone(/thumb/gi, true),
        index: _findFingerBone(/index/gi, true),
        middle: _findFingerBone(/middle/gi, true),
        ring: _findFingerBone(/ring/gi, true),
        little: _findFingerBone(/little/gi, true) || _findFingerBone(/pinky/gi, true),
      },
      right: {
        thumb: _findFingerBone(/thumb/gi, false),
        index: _findFingerBone(/index/gi, false),
        middle: _findFingerBone(/middle/gi, false),
        ring: _findFingerBone(/ring/gi, false),
        little: _findFingerBone(/little/gi, false) || _findFingerBone(/pinky/gi, false),
      },
    };
    this.fingerBones = fingerBones; */

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
	    /* ['Left_arm', 'Right_arm'].forEach((name, i) => {
		    const bone = modelBones[name];
		    if (bone) {
		      bone.quaternion.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), (i === 0 ? 1 : -1) * Math.PI*0.25));
		    }
		  }); */
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
    
    modelBones.Hips.traverse(bone => {
      if (bone.isBone) {
        bone.initialQuaternion = bone.quaternion.clone();
      }
    });
    
    return {
      skinnedMeshes,
      skeleton,
      modelBones,
      flipZ,
      flipY,
      flipLeg,
      tailBones,
      armature,
      armatureQuaternion,
      armatureMatrixInverse,
    };
  }
  static applyModelBoneOutputs(modelBones, modelBoneOutputs, /*topEnabled,*/ bottomEnabled, lHandEnabled, rHandEnabled) {
    for (const k in modelBones) {
      const modelBone = modelBones[k];
      const modelBoneOutput = modelBoneOutputs[k];

      if (/hips|thumb|finger/i.test(k)) {
        modelBone.position.copy(modelBoneOutput.position);
      }
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

    // leftToe: 'Left_toe',
    // rightToe: Right_toe',
  }
  getEyePosition = (() => {
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    return function() {
      const {modelBones} = this;
      if (modelBones.Eye_L && modelBones.Eye_R) {
        return modelBones.Eye_L.getWorldPosition(localVector)
          .add(modelBones.Eye_R.getWorldPosition(localVector2))
          .divideScalar(2);
      } else {
        const neckToHeadDiff = modelBones.Head.getWorldPosition(localVector)
          .sub(modelBones.Neck.getWorldPosition(localVector2));
        if (neckToHeadDiff.z < 0) {
          neckToHeadDiff.z *= -1;
        }
        return modelBones.Head.getWorldPosition(localVector)
          .add(neckToHeadDiff);
      }
    }
  })()
  initializeBonePositions(setups) {
    this.shoulderTransforms.spine.position.copy(setups.spine);
    this.shoulderTransforms.chest.position.copy(setups.chest);
    this.shoulderTransforms.upperChest.position.copy(setups.upperChest);
    this.shoulderTransforms.neck.position.copy(setups.neck);
    this.shoulderTransforms.head.position.copy(setups.head);
    this.shoulderTransforms.eyes.position.copy(setups.eyes);

    this.shoulderTransforms.leftShoulderAnchor.position.copy(setups.leftShoulder);
    this.shoulderTransforms.leftArm.upperArm.position.copy(setups.leftUpperArm);
    this.shoulderTransforms.leftArm.lowerArm.position.copy(setups.leftLowerArm);
    this.shoulderTransforms.leftArm.hand.position.copy(setups.leftHand);
    this.shoulderTransforms.leftArm.thumb2.position.copy(setups.leftThumb2);
    this.shoulderTransforms.leftArm.thumb1.position.copy(setups.leftThumb1);
    this.shoulderTransforms.leftArm.thumb0.position.copy(setups.leftThumb0);
    this.shoulderTransforms.leftArm.indexFinger3.position.copy(setups.leftIndexFinger3);
    this.shoulderTransforms.leftArm.indexFinger2.position.copy(setups.leftIndexFinger2);
    this.shoulderTransforms.leftArm.indexFinger1.position.copy(setups.leftIndexFinger1);
    this.shoulderTransforms.leftArm.middleFinger3.position.copy(setups.leftMiddleFinger3);
    this.shoulderTransforms.leftArm.middleFinger2.position.copy(setups.leftMiddleFinger2);
    this.shoulderTransforms.leftArm.middleFinger1.position.copy(setups.leftMiddleFinger1);
    this.shoulderTransforms.leftArm.ringFinger3.position.copy(setups.leftRingFinger3);
    this.shoulderTransforms.leftArm.ringFinger2.position.copy(setups.leftRingFinger2);
    this.shoulderTransforms.leftArm.ringFinger1.position.copy(setups.leftRingFinger1);
    this.shoulderTransforms.leftArm.littleFinger3.position.copy(setups.leftLittleFinger3);
    this.shoulderTransforms.leftArm.littleFinger2.position.copy(setups.leftLittleFinger2);
    this.shoulderTransforms.leftArm.littleFinger1.position.copy(setups.leftLittleFinger1);

    this.shoulderTransforms.rightShoulderAnchor.position.copy(setups.rightShoulder);
    this.shoulderTransforms.rightArm.upperArm.position.copy(setups.rightUpperArm);
    this.shoulderTransforms.rightArm.lowerArm.position.copy(setups.rightLowerArm);
    this.shoulderTransforms.rightArm.hand.position.copy(setups.rightHand);
    this.shoulderTransforms.rightArm.thumb2.position.copy(setups.rightThumb2);
    this.shoulderTransforms.rightArm.thumb1.position.copy(setups.rightThumb1);
    this.shoulderTransforms.rightArm.thumb0.position.copy(setups.rightThumb0);
    this.shoulderTransforms.rightArm.indexFinger3.position.copy(setups.rightIndexFinger3);
    this.shoulderTransforms.rightArm.indexFinger2.position.copy(setups.rightIndexFinger2);
    this.shoulderTransforms.rightArm.indexFinger1.position.copy(setups.rightIndexFinger1);
    this.shoulderTransforms.rightArm.middleFinger3.position.copy(setups.rightMiddleFinger3);
    this.shoulderTransforms.rightArm.middleFinger2.position.copy(setups.rightMiddleFinger2);
    this.shoulderTransforms.rightArm.middleFinger1.position.copy(setups.rightMiddleFinger1);
    this.shoulderTransforms.rightArm.ringFinger3.position.copy(setups.rightRingFinger3);
    this.shoulderTransforms.rightArm.ringFinger2.position.copy(setups.rightRingFinger2);
    this.shoulderTransforms.rightArm.ringFinger1.position.copy(setups.rightRingFinger1);
    this.shoulderTransforms.rightArm.littleFinger3.position.copy(setups.rightLittleFinger3);
    this.shoulderTransforms.rightArm.littleFinger2.position.copy(setups.rightLittleFinger2);
    this.shoulderTransforms.rightArm.littleFinger1.position.copy(setups.rightLittleFinger1);

    this.legsManager.leftLeg.upperLeg.position.copy(setups.leftUpperLeg);
    this.legsManager.leftLeg.lowerLeg.position.copy(setups.leftLowerLeg);
    this.legsManager.leftLeg.foot.position.copy(setups.leftFoot);

    this.legsManager.rightLeg.upperLeg.position.copy(setups.rightUpperLeg);
    this.legsManager.rightLeg.lowerLeg.position.copy(setups.rightLowerLeg);
    this.legsManager.rightLeg.foot.position.copy(setups.rightFoot);

    this.shoulderTransforms.hips.updateMatrixWorld();
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
	update(now, timeDiff) {
    /* const wasDecapitated = this.decapitated;
    if (this.springBoneManager && wasDecapitated) {
      this.undecapitate();
    } */
    
    const _applyAnimation = () => {
      const runSpeed = 0.5;
      const currentSpeed = this.velocity.length();
      const angle = this.getAngle();
      const timeSeconds = now/1000;
      
      const _getAnimationKey = (crouchState, velocity) => {
        if (crouchState) {
          return 'crouch';
        } else {
          if (currentSpeed >= runSpeed) {
            return 'run';
          } else {
            return 'walk';
          }
        }
      };
      const _getClosest2AnimationAngles = key => {
        const animationAngleArray = animationsAngleArrays[key];
        animationAngleArray.sort((a, b) => {
          const aDistance = Math.abs(angleDifference(angle, a.angle));
          const bDistance = Math.abs(angleDifference(angle, b.angle));
          return aDistance - bDistance;
        });
        const closest2AnimationAngles = animationAngleArray.slice(0, 2);
        return closest2AnimationAngles;
      };
      const _getMirrorAnimationAngles = (animationAngles, key) => {
        const animations = animationAngles.map(({animation}) => animation);
        const animationAngleArrayMirror = animationsAngleArraysMirror[key];
        
        const backwardIndex = animations.findIndex(a => a.isBackward);
        if (backwardIndex !== -1) {
          const backwardAnimationAngle = animationAngles[backwardIndex];
          const angleToBackwardAnimation = Math.abs(angleDifference(angle, backwardAnimationAngle.angle));
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
      const _get5wayBlend = (horizontalAnimationAngles, horizontalAnimationAnglesMirror, idleAnimation, mirrorFactor, angleFactor, speedFactor, k, target) => {
        // normal horizontal blend
        {
          const t1 = timeSeconds % horizontalAnimationAngles[0].animation.duration;
          const src1 = horizontalAnimationAngles[0].animation.interpolants[k];
          const v1 = src1.evaluate(t1);

          const t2 = timeSeconds % horizontalAnimationAngles[1].animation.duration;
          const src2 = horizontalAnimationAngles[1].animation.interpolants[k];
          const v2 = src2.evaluate(t2);
          
          localQuaternion3.fromArray(v2)
            .slerp(localQuaternion4.fromArray(v1), angleFactor);
        }
          
        // mirror horizontal blend
        {
          const t1 = timeSeconds % horizontalAnimationAnglesMirror[0].animation.duration;
          const src1 = horizontalAnimationAnglesMirror[0].animation.interpolants[k];
          const v1 = src1.evaluate(t1);

          const t2 = timeSeconds % horizontalAnimationAnglesMirror[1].animation.duration;
          const src2 = horizontalAnimationAnglesMirror[1].animation.interpolants[k];
          const v2 = src2.evaluate(t2);
          
          localQuaternion4.fromArray(v2)
            .slerp(localQuaternion5.fromArray(v1), angleFactor);
        }

        // blend mirrors together
        localQuaternion5.copy(localQuaternion3)
          .slerp(localQuaternion4, mirrorFactor);

        // blend mirrors with idle
        {
          const t3 = timeSeconds % idleAnimation.duration;
          const src3 = idleAnimation.interpolants[k];
          const v3 = src3.evaluate(t3);
          
          target.fromArray(v3)
            .slerp(localQuaternion5, speedFactor);
        }
      };
      
      // current stand/crouch
      const key = _getAnimationKey(
        this.crouchState,
        this.velocity,
      );
      const keyAnimationAngles = _getClosest2AnimationAngles(key);
      const keyAnimationAnglesMirror = _getMirrorAnimationAngles(keyAnimationAngles, key);
      const idleAnimation = _getIdleAnimation(key);
      
      // opposite stand/crouch
      const keyOther = _getAnimationKey(
        !this.crouchState,
        this.velocity,
      );
      const keyAnimationAnglesOther = _getClosest2AnimationAngles(keyOther);
      const keyAnimationAnglesOtherMirror = _getMirrorAnimationAngles(keyAnimationAnglesOther, key);
      const idleAnimationOther = _getIdleAnimation(keyOther);
      
      const angleToClosestAnimation = Math.abs(angleDifference(angle, keyAnimationAnglesMirror[0].angle));
      const angleBetweenAnimations = Math.abs(angleDifference(keyAnimationAnglesMirror[0].angle, keyAnimationAnglesMirror[1].angle));
      const angleFactor = (angleBetweenAnimations - angleToClosestAnimation) / angleBetweenAnimations;
      const speedFactor = Math.min(Math.pow(currentSpeed, 0.5) * 2, 1);
      const crouchFactor = Math.min(Math.max(1 - (this.crouchTime / crouchMaxTime), 0), 1);
      const isBackward = _getAngleToBackwardAnimation(keyAnimationAnglesMirror) < Math.PI*0.4;
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

      const _getHorizontalBlend = (k, target) => {
        _get5wayBlend(keyAnimationAngles, keyAnimationAnglesMirror, idleAnimation, mirrorFactor, angleFactor, speedFactor, k, localQuaternion);
        _get5wayBlend(keyAnimationAnglesOther, keyAnimationAnglesOtherMirror, idleAnimationOther, mirrorFactor, angleFactor, speedFactor, k, localQuaternion2);
        
        target.copy(localQuaternion)
          .slerp(localQuaternion2, crouchFactor);
        /* const distance1 = animationsDistanceMap[selectedAnimations[0].name].distanceTo(this.direction);
        const distance2 = animationsDistanceMap[selectedAnimations[1].name].distanceTo(this.direction);
        const totalDistance = distance1 + distance2;
        // let factor1 = 1 - distance1/totalDistance;
        let distanceFactor = 1 - distance2/totalDistance;
        
        const t1 = (now/1000) % selectedAnimations[0].duration;
        const src1 = selectedAnimations[0].interpolants[k];
        const v1 = src1.evaluate(t1);

        const t2 = (now/1000) % selectedAnimations[1].duration;
        const src2 = selectedAnimations[1].interpolants[k];
        const v2 = src2.evaluate(t2);

        target.fromArray(v1);
        if (selectedAnimations[0].direction !== selectedAnimations[1].direction) {
          target.slerp(localQuaternion.fromArray(v2), distanceFactor);
        } */
      };

      /* const standKey = this.crouchState ? 'stand' : 'crouch';
      const otherStandKey = standKey === 'stand' ? 'crouch' : 'stand';
      const _selectAnimations = (v, standKey) => {
        const selectedAnimations = animations.slice().sort((a, b) => {
          const targetPosition1 = animationsSelectMap[standKey][a.name] || infinityUpVector;
          const distance1 = targetPosition1.distanceTo(v);

          const targetPosition2 = animationsSelectMap[standKey][b.name] || infinityUpVector;
          const distance2 = targetPosition2.distanceTo(v);

          return distance1 - distance2;
        }).slice(0, 2);
        if (selectedAnimations[1].isIdle) {
          selectedAnimations[1] = selectedAnimations[0];
        }
        if (selectedAnimations.some(a => a.isBackward)) {
          if (selectedAnimations.some(a => a.isLeft)) {
            if (selectedAnimations.some(a => a.isRunning)) {
              selectedAnimations[0] = animations.find(a => a.isRight && a.isRunning && a.isReverse);
              selectedAnimations[1] = animations.find(a => a.isBackward && a.isRunning);
            } else if (selectedAnimations.some(a => a.isCrouch)) {
              selectedAnimations[0] = animations.find(a => a.isRight && a.isCrouch && a.isReverse);
              selectedAnimations[1] = animations.find(a => a.isBackward && a.isCrouch);
            } else {
              selectedAnimations[0] = animations.find(a => a.isRight && !a.isRunning && a.isReverse);
              selectedAnimations[1] = animations.find(a => a.isBackward && !a.isRunning);
            }
          } else if (selectedAnimations.some(a => a.isRight)) {
            if (selectedAnimations.some(a => a.isRunning)) {
              selectedAnimations[0] = animations.find(a => a.isLeft && a.isRunning && a.isReverse);
              selectedAnimations[1] = animations.find(a => a.isBackward && a.isRunning);
            } else if (selectedAnimations.some(a => a.isCrouch)) {
              selectedAnimations[0] = animations.find(a => a.isLeft && a.isCrouch && a.isReverse);
              selectedAnimations[1] = animations.find(a => a.isBackward && a.isCrouch);
            } else {
              selectedAnimations[0] = animations.find(a => a.isLeft && !a.isRunning && a.isReverse);
              selectedAnimations[1] = animations.find(a => a.isBackward && !a.isRunning);
            }
          }
        }
        return selectedAnimations;
      };
      const selectedAnimations = _selectAnimations(this.velocity, standKey);
      const selectedOtherAnimations = _selectAnimations(this.velocity, otherStandKey); */

      const _getApplyFn = () => {
        if (this.jumpState) {
          return spec => {
            const {
              quaternionKey: k,
              quaternion: dst,
              isTop,
            } = spec;
            
            const t2 = this.jumpTime/1000 * 0.6 + 0.7;
            const src2 = jumpAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.sitState) {
          return spec => {
            const {
              quaternionKey: k,
              quaternion: dst,
              isTop,
            } = spec;
            
            const sitAnimation = sitAnimations[this.sitAnimation || defaultSitAnimation];
            const src2 = sitAnimation.interpolants[k];
            const v2 = src2.evaluate(1);

            dst.fromArray(v2);
          }
        }
        if (this.activateState) {
          return spec => {
            const {
              quaternionKey: k,
              quaternion: dst,
              isTop,
            } = spec;
            const activateAnimation = activateAnimations[defaultActivateAnimation];
            const src2 = activateAnimation.interpolants[k];
            const t2 = Math.pow(this.activateTime/1000*activateAnimation.duration/2, 0.5);
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.narutoRunState && !this.crouchState) {
          return spec => {
            const {
              quaternionKey: k,
              quaternion: dst,
              isTop,
            } = spec;
            
            const narutoRunAnimation = narutoRunAnimations[defaultNarutoRunAnimation];
            const src2 = narutoRunAnimation.interpolants[k];
            const t2 = (this.narutoRunTime * 4) % narutoRunAnimation.duration;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.danceState) {
          return spec => {
            const {
              quaternionKey: k,
              quaternion: dst,
              isTop,
            } = spec;
            
            const danceAnimation = danceAnimations[this.danceAnimation || defaultDanceAnimation];
            const src2 = danceAnimation.interpolants[k];
            const t2 = (this.danceTime/1000) % danceAnimation.duration;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.throwState) {
          return spec => {
            const {
              quaternionKey: k,
              quaternion: dst,
              isTop,
            } = spec;
            
            const throwAnimation = throwAnimations[this.throwAnimation || defaultThrowAnimation];
            const src2 = throwAnimation.interpolants[k];
            const t2 = this.throwTime/1000;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        const _handleDefault = spec => {
          const {
            quaternionKey: k,
            quaternion: dst,
            isTop,
          } = spec;
          
          _getHorizontalBlend(k, dst);
        };
        if (this.useTime >= 0) {
          return spec => {
            const {
              quaternionKey: k,
              quaternion: dst,
              isTop,
            } = spec;
            
            if (isTop) {
              const useAnimation = (this.useAnimation && useAnimations[this.useAnimation]) //|| useAnimations[defaultUseAnimation];
              if (useAnimation) {
                const t2 = (this.useTime/useAnimationRate) % useAnimation.duration;
                const src2 = useAnimation.interpolants[k];
                const v2 = src2.evaluate(t2);

                dst.fromArray(v2);
              } else {
                _handleDefault(spec);
              }
            } else {
              _handleDefault(spec);
            }
          };
        }
        return _handleDefault;
      };
      const applyFn = _getApplyFn();
      const _blendFly = spec => {
        const {
          quaternionKey: k,
          quaternion: dst,
          isTop,
        } = spec;
        
        if (this.flyState || (this.flyTime >= 0 && this.flyTime < 1000)) {
          const t2 = this.flyTime/1000;
          const f = this.flyState ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));
          const src2 = floatAnimation.interpolants[k];
          const v2 = src2.evaluate(t2 % floatAnimation.duration);

          dst.slerp(localQuaternion.fromArray(v2), f);
        }
      };
      for (const spec of this.animationMappings) {
        applyFn(spec);
        _blendFly(spec);
      }
    };
    _applyAnimation();

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
    if (!this.getBottomEnabled()) {
      this.outputs.hips.position.copy(this.inputs.hmd.position)
        .add(this.eyeToHipsOffset);

      localEuler.setFromQuaternion(this.inputs.hmd.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      localEuler.y += Math.PI;
      this.outputs.hips.quaternion.premultiply(localQuaternion.setFromEuler(localEuler));
    }
    /* if (!this.getTopEnabled() && this.debugMeshes) {
      this.outputs.hips.updateMatrixWorld();
    } */

    this.shoulderTransforms.Update();
    this.legsManager.Update();

    if (this.eyeTargetEnabled) {
      const eyePosition = this.getEyePosition();
      this.modelBoneOutputs.Neck.updateMatrixWorld();
      this.modelBoneOutputs.Neck.matrixWorld.decompose(localVector, localQuaternion, localVector2);

      const globalQuaternion = localQuaternion2.setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          eyePosition,
          this.eyeTarget,
          upVector
        )
      );
      localQuaternion3.copy(globalQuaternion)// .setFromEuler(localEuler)
        .premultiply(
          this.modelBoneOutputs.Hips.getWorldQuaternion(localQuaternion4)
            .invert()
        )

      if (localQuaternion.angleTo(localQuaternion3) < Math.PI*0.4) {

        if(trackMouseAmount < 1) {
          trackMouseAmount += timeDiff*3;
        } else {
          trackMouseAmount = 1;
        }
        
        lastQuaternion.slerpQuaternions(localQuaternion, localQuaternion3, trackMouseAmount);
        this.modelBoneOutputs.Neck.matrixWorld.compose(localVector, lastQuaternion, localVector2);
      } 
      else {
        trackMouseAmount = 0;
        lastQuaternion.slerp(localQuaternion, 0.1);
        this.modelBoneOutputs.Neck.matrixWorld.compose(localVector, lastQuaternion, localVector2);
      }

      this.modelBoneOutputs.Neck.matrix.copy(this.modelBoneOutputs.Neck.matrixWorld)
          .premultiply(localMatrix.copy(this.modelBoneOutputs.Neck.parent.matrixWorld).invert())
          .decompose(this.modelBoneOutputs.Neck.position, this.modelBoneOutputs.Neck.quaternion, this.modelBoneOutputs.Neck.scale);
    } 
    else {
      if (trackMouseAmount > 0) {
        const eyePosition = this.getEyePosition();
        this.modelBoneOutputs.Neck.updateMatrixWorld();
        this.modelBoneOutputs.Neck.matrixWorld.decompose(localVector, localQuaternion, localVector2);

        const globalQuaternion = localQuaternion2.setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            eyePosition,
            this.eyeTarget,
            upVector
          )
        );

        localQuaternion3.copy(globalQuaternion)// .setFromEuler(localEuler)
        .premultiply(
          this.modelBoneOutputs.Hips.getWorldQuaternion(localQuaternion4)
            .invert()
        )

        lastQuaternion.slerp(localQuaternion, 0.1);
        this.modelBoneOutputs.Neck.matrixWorld.compose(localVector, lastQuaternion, localVector2);

        this.modelBoneOutputs.Neck.matrix.copy(this.modelBoneOutputs.Neck.matrixWorld)
          .premultiply(localMatrix.copy(this.modelBoneOutputs.Neck.parent.matrixWorld).invert())
          .decompose(this.modelBoneOutputs.Neck.position, this.modelBoneOutputs.Neck.quaternion, this.modelBoneOutputs.Neck.scale);

        if(trackMouseAmount <= 0) {
          trackMouseAmount = 0;
        } else {
          trackMouseAmount -= timeDiff*3;
        }
      }
    }

    Avatar.applyModelBoneOutputs(
      this.modelBones,
      this.modelBoneOutputs,
      // this.getTopEnabled(),
      this.getBottomEnabled(),
      this.getHandEnabled(0),
      this.getHandEnabled(1),
    );
    this.modelBones.Hips.updateMatrixWorld();

    if (this.springBoneManager) {
      this.springBoneManager.lateUpdate(timeDiff);
    }
    /* if (this.springBoneManager && wasDecapitated) {
      this.decapitate();
    } */

    const _updateVisemes = () => {
      const volumeValue = this.volume !== -1 ? Math.min(this.volume * 10, 1) : -1;
      const blinkValue = (() => {
        const nowWindow = now % 2000;
        if (nowWindow >= 0 && nowWindow < 100) {
          return nowWindow/100;
        } else if (nowWindow >= 100 && nowWindow < 200) {
          return 1 - (nowWindow-100)/100;
        } else {
          return 0;
        }
      })();
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
              morphTargetInfluences[eIndex] = 0;
            }
            if (iIndex !== -1) {
              morphTargetInfluences[iIndex] = 0;
            }
            if (oIndex !== -1) {
              morphTargetInfluences[oIndex] = 0;
            }
            if (uIndex !== -1) {
              morphTargetInfluences[uIndex] = 0;
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

    /* if (this.debugMeshes) {
      if (this.getTopEnabled()) {
        this.getHandEnabled(0) && this.outputs.leftHand.quaternion.multiply(rightRotation); // center
        this.outputs.leftHand.updateMatrixWorld();
        this.getHandEnabled(1) && this.outputs.rightHand.quaternion.multiply(leftRotation); // center
        this.outputs.rightHand.updateMatrixWorld();
      }

      for (const k in this.debugMeshes.attributes) {
        const attribute = this.debugMeshes.attributes[k];
        if (attribute.visible) {
          const output = this.outputs[k];
          attribute.array.set(attribute.srcGeometry.attributes.position.array);
          attribute.applyMatrix4(localMatrix.multiplyMatrices(this.model.matrixWorld, output.matrixWorld));
        } else {
          attribute.array.fill(0);
        }
      }
      this.debugMeshes.geometry.attributes.position.needsUpdate = true;
    } */
	}

  async setMicrophoneMediaStream(microphoneMediaStream, options = {}) {
    if (this.microphoneWorker) {
      this.microphoneWorker.close();
      this.microphoneWorker = null;
    }
    if (microphoneMediaStream) {
      this.microphoneWorker = new MicrophoneWorker(microphoneMediaStream, options);
      this.microphoneWorker.addEventListener('volume', e => {
        this.volume = this.volume*0.8 + e.data*0.2;
      });
      this.volume = 0;
    } else {
      this.volume = -1;
    }
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
      /* if (this.debugMeshes) {
        [this.debugMeshes.attributes.eyes, this.debugMeshes.attributes.head].forEach(attribute => {
          attribute.visible = false;
        });
      } */
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
      /* if (this.debugMeshes) {
        [this.debugMeshes.attributes.eyes, this.debugMeshes.attributes.head].forEach(attribute => {
          attribute.visible = true;
        });
      } */
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
    this.setMicrophoneMediaStream(null);
  }
}
Avatar.waitForLoad = () => loadPromise;
Avatar.getAnimations = () => animations;
export default Avatar;
