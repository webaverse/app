import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {VRMSpringBoneImporter} from '@pixiv/three-vrm/lib/three-vrm.module.js';
import {fixSkeletonZForward} from './vrarmik/SkeletonUtils.js';
import PoseManager from './vrarmik/PoseManager.js';
import ShoulderTransforms from './vrarmik/ShoulderTransforms.js';
import LegsManager from './vrarmik/LegsManager.js';
// import {world} from '../world.js';
import MicrophoneWorker from './microphone-worker.js';
// import skeletonString from './skeleton.js';
import {angleDifference, getVelocityDampingFactor} from '../util.js';
// import physicsManager from '../physics-manager.js';
import easing from '../easing.js';
import CBOR from '../cbor.js';
import Simplex from '../simplex-noise.js';
import {crouchMaxTime, useMaxTime, avatarInterpolationFrameRate, avatarInterpolationTimeDelay, avatarInterpolationNumFrames} from '../constants.js';
import {FixedTimeStep} from '../interpolants.js';
import metaversefile from 'metaversefile';
import {
  getSkinnedMeshes,
  getSkeleton,
  getEyePosition,
  getHeight,
  makeBoneMap,
  getTailBones,
  getModelBones,
  // cloneModelBones,
  decorateAnimation,
  // retargetAnimation,
}  from './util.mjs';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localQuaternion4 = new THREE.Quaternion();
const localQuaternion5 = new THREE.Quaternion();
const localQuaternion6 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

// const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const maxEyeTargetTime = 2000;

VRMSpringBoneImporter.prototype._createSpringBone = (_createSpringBone => {
  const localVector = new THREE.Vector3();
  return function(a, b) {
    const bone = _createSpringBone.apply(this, arguments);
    const initialDragForce = bone.dragForce;
    const initialStiffnessForce = bone.stiffnessForce;
    // const initialGravityPower = bone.gravityPower;
    
    const localPlayer = metaversefile.useLocalPlayer();
    Object.defineProperty(bone, 'stiffnessForce', {
      get() {
        localVector.set(localPlayer.characterPhysics.velocity.x, 0, localPlayer.characterPhysics.velocity.z);
        const f = Math.pow(Math.min(Math.max(localVector.length()*2 - Math.abs(localPlayer.characterPhysics.velocity.y)*0.5, 0), 4), 2);
        return initialStiffnessForce * (0.1 + 0.1*f);
      },
      set(v) {},
    });
    Object.defineProperty(bone, 'dragForce', {
      get() {
        return initialDragForce * 0.7;
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

const upVector = new THREE.Vector3(0, 1, 0);
const upRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5);
const downRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.5);
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
const defaultchargeJumpAnimation = 'chargeJump';
const defaultStandChargeAnimation = 'standCharge';


const infinityUpVector = new THREE.Vector3(0, Infinity, 0);
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
let animationsBaseModel;
let jumpAnimation;
let floatAnimation;
let useAnimations;
let sitAnimations;
let danceAnimations;
let throwAnimations;
let crouchAnimations;
let activateAnimations;
let narutoRunAnimations;
let jumpAnimationSegments;
let chargeJump;
let standCharge;
let chargeIdle;
let fallLoop;
let swordSideSlash;
let swordTopDownSlash;
let landing;
const loadPromise = (async () => {
  await Promise.resolve(); // wait for metaversefile to be defined
  
  await Promise.all([
    (async () => {
      const res = await fetch('../animations/animations.cbor');
      const arrayBuffer = await res.arrayBuffer();
      animations = CBOR.decode(arrayBuffer).animations
        .map(a => THREE.AnimationClip.parse(a));
    })(),
    (async () => {
      const srcUrl = '../animations/animations-skeleton.glb';
      
      let o;
      try {
        o = await new Promise((accept, reject) => {
          const {gltfLoader} = metaversefile.useLoaders();
          gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
        });
      } catch(err) {
        console.warn(err);
      }
      if (o) {
        animationsBaseModel = o;
      }
    })(),
  ]);

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
  _normalizeAnimationDurations(crouchingForwardAnimations, crouchingForwardAnimations[0], 0.5);
  const crouchingBackwardAnimations = [
    `Sneaking Forward reverse.fbx`,
    `Crouched Sneaking Left reverse.fbx`,
    `Crouched Sneaking Right reverse.fbx`,
  ].map(name => animations.find(a => a.name === name));
  _normalizeAnimationDurations(crouchingBackwardAnimations, crouchingBackwardAnimations[0], 0.5);
  for (const animation of animations) {
    decorateAnimation(animation);
  }


  jumpAnimationSegments = {
    chargeJump: animations.find(a => a.isChargeJump),
    chargeJumpFall: animations.find(a => a.isChargeJumpFall),
    isFallLoop: animations.find(a => a.isFallLoop),
  }

  chargeJump = animations.find(a => a.isChargeJump);
  standCharge = animations.find(a => a.isStandCharge);
  chargeIdle = animations.find(a => a.isChargeIdle);
  landing = animations.find(a => a.isLanding)
  fallLoop = animations.find(a => a.isFallLoop);
  swordSideSlash = animations.find(a => a.isSwordSideSlash);
  swordTopDownSlash = animations.find(a => a.isSwordTopDownSlash)


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
/* const _traverseChild = (bone, distance) => {
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
}; */
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
  constructor(animationTrackName, boneName, isTop, isPosition) {
    this.animationTrackName = animationTrackName;
    this.boneName = boneName;
    this.isTop = isTop;
    this.isPosition = isPosition;
  }
  clone() {
    return new AnimationMapping(this.animationTrackName, this.boneName, this.isTop, this.isPosition);
  }
}
const _getLerpFn = isPosition => isPosition ? THREE.Vector3.prototype.lerp : THREE.Quaternion.prototype.slerp;
const animationMappingConfig = [
  new AnimationMapping('mixamorigHips.position', 'Hips', false, true),
  new AnimationMapping('mixamorigHips.quaternion', 'Hips', false, false),
  new AnimationMapping('mixamorigSpine.quaternion', 'Spine', false, false),
  new AnimationMapping('mixamorigSpine1.quaternion', 'Chest', false, false),
  new AnimationMapping('mixamorigSpine2.quaternion', 'UpperChest', false, false),
  new AnimationMapping('mixamorigNeck.quaternion', 'Neck', false, false),
  new AnimationMapping('mixamorigHead.quaternion', 'Head', false, false),

  new AnimationMapping('mixamorigLeftShoulder.quaternion', 'Left_shoulder', true, false),
  new AnimationMapping('mixamorigLeftArm.quaternion', 'Left_arm', true, false),
  new AnimationMapping('mixamorigLeftForeArm.quaternion', 'Left_elbow', true, false),
  new AnimationMapping('mixamorigLeftHand.quaternion', 'Left_wrist', true, false),
  new AnimationMapping('mixamorigLeftHandMiddle1.quaternion', 'Left_middleFinger1', true, false),
  new AnimationMapping('mixamorigLeftHandMiddle2.quaternion', 'Left_middleFinger2', true, false),
  new AnimationMapping('mixamorigLeftHandMiddle3.quaternion', 'Left_middleFinger3', true, false),
  new AnimationMapping('mixamorigLeftHandThumb1.quaternion', 'Left_thumb0', true, false),
  new AnimationMapping('mixamorigLeftHandThumb2.quaternion', 'Left_thumb1', true, false),
  new AnimationMapping('mixamorigLeftHandThumb3.quaternion', 'Left_thumb2', true, false),
  new AnimationMapping('mixamorigLeftHandIndex1.quaternion', 'Left_indexFinger1', true, false),
  new AnimationMapping('mixamorigLeftHandIndex2.quaternion', 'Left_indexFinger2', true, false),
  new AnimationMapping('mixamorigLeftHandIndex3.quaternion', 'Left_indexFinger3', true, false),
  new AnimationMapping('mixamorigLeftHandRing1.quaternion', 'Left_ringFinger1', true, false),
  new AnimationMapping('mixamorigLeftHandRing2.quaternion', 'Left_ringFinger2', true, false),
  new AnimationMapping('mixamorigLeftHandRing3.quaternion', 'Left_ringFinger3', true, false),
  new AnimationMapping('mixamorigLeftHandPinky1.quaternion', 'Left_littleFinger1', true, false),
  new AnimationMapping('mixamorigLeftHandPinky2.quaternion', 'Left_littleFinger2', true, false),
  new AnimationMapping('mixamorigLeftHandPinky3.quaternion', 'Left_littleFinger3', true, false),

  new AnimationMapping('mixamorigRightShoulder.quaternion', 'Right_shoulder', true, false),
  new AnimationMapping('mixamorigRightArm.quaternion', 'Right_arm', true, false),
  new AnimationMapping('mixamorigRightForeArm.quaternion', 'Right_elbow', true, false),
  new AnimationMapping('mixamorigRightHand.quaternion', 'Right_wrist', true, false),
  new AnimationMapping('mixamorigRightHandMiddle1.quaternion', 'Right_middleFinger1', true, false),
  new AnimationMapping('mixamorigRightHandMiddle2.quaternion', 'Right_middleFinger2', true, false),
  new AnimationMapping('mixamorigRightHandMiddle3.quaternion', 'Right_middleFinger3', true, false),
  new AnimationMapping('mixamorigRightHandThumb1.quaternion', 'Left_thumb0', true, false),
  new AnimationMapping('mixamorigRightHandThumb2.quaternion', 'Left_thumb1', true, false),
  new AnimationMapping('mixamorigRightHandThumb3.quaternion', 'Left_thumb2', true, false),
  new AnimationMapping('mixamorigRightHandIndex1.quaternion', 'Right_indexFinger1', true, false),
  new AnimationMapping('mixamorigRightHandIndex2.quaternion', 'Right_indexFinger2', true, false),
  new AnimationMapping('mixamorigRightHandIndex3.quaternion', 'Right_indexFinger3', true, false),
  new AnimationMapping('mixamorigRightHandRing1.quaternion', 'Right_ringFinger1', true, false),
  new AnimationMapping('mixamorigRightHandRing2.quaternion', 'Right_ringFinger2', true, false),
  new AnimationMapping('mixamorigRightHandRing3.quaternion', 'Right_ringFinger3', true, false),
  new AnimationMapping('mixamorigRightHandPinky1.quaternion', 'Right_littleFinger1', true, false),
  new AnimationMapping('mixamorigRightHandPinky2.quaternion', 'Right_littleFinger2', true, false),
  new AnimationMapping('mixamorigRightHandPinky3.quaternion', 'Right_littleFinger3', true, false),

  new AnimationMapping('mixamorigRightUpLeg.quaternion', 'Right_leg', false, false),
  new AnimationMapping('mixamorigRightLeg.quaternion', 'Right_knee', false, false),
  new AnimationMapping('mixamorigRightFoot.quaternion', 'Right_ankle', false, false),
  new AnimationMapping('mixamorigRightToeBase.quaternion', 'Right_toe', false, false),

  new AnimationMapping('mixamorigLeftUpLeg.quaternion', 'Left_leg', false, false),
  new AnimationMapping('mixamorigLeftLeg.quaternion', 'Left_knee', false, false),
  new AnimationMapping('mixamorigLeftFoot.quaternion', 'Left_ankle', false, false),
  new AnimationMapping('mixamorigLeftToeBase.quaternion', 'Left_toe', false, false),
];

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
      foundModelBones,
      flipZ,
      flipY,
      flipLeg,
      tailBones,
      armature,
      armatureQuaternion,
      armatureMatrixInverse,
      // retargetedAnimations,
    } = Avatar.bindAvatar(object);
    this.skinnedMeshes = skinnedMeshes;
    this.skeleton = skeleton;
    this.modelBones = modelBones;
    this.foundModelBones = foundModelBones;
    this.flipZ = flipZ;
    this.flipY = flipY;
    this.flipLeg = flipLeg;
    // this.retargetedAnimations = retargetedAnimations;

    /* if (options.debug) {
      const debugMeshes = _makeDebugMeshes();
      this.model.add(debugMeshes);
      this.debugMeshes = debugMeshes;
    } else {
      this.debugMeshes = null;
    } */

    modelBones.Root.traverse(o => {
      o.savedPosition = o.position.clone();
      o.savedMatrixWorld = o.matrixWorld.clone();
    });

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
    this.eyeTargetInverted = false;
    this.eyeTargetEnabled = false;

    this.springBoneManager = null;
    this.springBoneTimeStep = new FixedTimeStep(timeDiff => {
      const timeDiffS = timeDiff / 1000;
      this.springBoneManager.lateUpdate(timeDiffS);
    }, avatarInterpolationFrameRate);
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


    const _getOffset = (bone, parent = bone?.parent) => bone && bone.getWorldPosition(new THREE.Vector3()).sub(parent.getWorldPosition(new THREE.Vector3()));

    this.initializeBonePositions({
      hips: _getOffset(modelBones.Hips),
      spine: _getOffset(modelBones.Spine),
      chest: _getOffset(modelBones.Chest),
      upperChest: _getOffset(modelBones.UpperChest),
      neck: _getOffset(modelBones.Neck),
      head: _getOffset(modelBones.Head),
      // eyes: _getOffset(modelBones.Head), // yes, head
      eyel: _getOffset(modelBones.Eye_L),
      eyer: _getOffset(modelBones.Eye_R),

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
      
      leftToe: _getOffset(modelBones.Left_toe),
      rightToe: _getOffset(modelBones.Right_toe),
    });

    // height is defined as eyes to root
    this.height = getHeight(object);
    this.shoulderWidth = modelBones.Left_arm.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.Right_arm.getWorldPosition(new THREE.Vector3()));
    this.leftArmLength = this.shoulderTransforms.leftArm.armLength;
    this.rightArmLength = this.shoulderTransforms.rightArm.armLength;
    let indexDistance = modelBones.Left_indexFinger1 ? modelBones.Left_indexFinger1.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.Left_wrist.getWorldPosition(new THREE.Vector3())) : 0;
    let handWidth = (modelBones.Left_indexFinger1 && modelBones.Left_littleFinger1)? modelBones.Left_indexFinger1.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.Left_littleFinger1.getWorldPosition(new THREE.Vector3())) : 0;
    this.handOffsetLeft = new THREE.Vector3(handWidth*0.7, -handWidth*0.75, indexDistance*0.5);
    this.handOffsetRight = new THREE.Vector3(-handWidth*0.7, -handWidth*0.75, indexDistance*0.5);
    const eyePosition = getEyePosition(this.modelBones);
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
		/* this.outputs = {
			// eyes: this.shoulderTransforms.eyes,
      eyel: this.shoulderTransforms.eyel,
      eyer: this.shoulderTransforms.eyer,
      head: this.shoulderTransforms.head,
      hips: this.shoulderTransforms.hips,
      root: this.shoulderTransforms.root,
      spine: this.shoulderTransforms.spine,
      chest: this.shoulderTransforms.chest,
      upperChest: this.shoulderTransforms.chest,
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
      leftToe: this.legsManager.leftLeg.toe,
      rightUpperLeg: this.legsManager.rightLeg.upperLeg,
      rightLowerLeg: this.legsManager.rightLeg.lowerLeg,
      rightFoot: this.legsManager.rightLeg.foot,
      rightToe: this.legsManager.rightLeg.toe,
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
		}; */
		this.modelBoneOutputs = {
      Root: this.shoulderTransforms.root,

	    Hips: this.shoulderTransforms.hips,
	    Spine: this.shoulderTransforms.spine,
	    Chest: this.shoulderTransforms.chest,
	    UpperChest: this.shoulderTransforms.upperChest,
	    Neck: this.shoulderTransforms.neck,
	    Head: this.shoulderTransforms.head,
      Eye_L: this.shoulderTransforms.eyel,
      Eye_R: this.shoulderTransforms.eyer,

	    Left_shoulder: this.shoulderTransforms.rightShoulderAnchor,
	    Left_arm: this.shoulderTransforms.rightArm.upperArm,
	    Left_elbow: this.shoulderTransforms.rightArm.lowerArm,
	    Left_wrist: this.shoulderTransforms.rightArm.hand,
      Left_thumb2: this.shoulderTransforms.rightArm.thumb2,
      Left_thumb1: this.shoulderTransforms.rightArm.thumb1,
      Left_thumb0: this.shoulderTransforms.rightArm.thumb0,
      Left_indexFinger3: this.shoulderTransforms.rightArm.indexFinger3,
      Left_indexFinger2: this.shoulderTransforms.rightArm.indexFinger2,
      Left_indexFinger1: this.shoulderTransforms.rightArm.indexFinger1,
      Left_middleFinger3: this.shoulderTransforms.rightArm.middleFinger3,
      Left_middleFinger2: this.shoulderTransforms.rightArm.middleFinger2,
      Left_middleFinger1: this.shoulderTransforms.rightArm.middleFinger1,
      Left_ringFinger3: this.shoulderTransforms.rightArm.ringFinger3,
      Left_ringFinger2: this.shoulderTransforms.rightArm.ringFinger2,
      Left_ringFinger1: this.shoulderTransforms.rightArm.ringFinger1,
      Left_littleFinger3: this.shoulderTransforms.rightArm.littleFinger3,
      Left_littleFinger2: this.shoulderTransforms.rightArm.littleFinger2,
      Left_littleFinger1: this.shoulderTransforms.rightArm.littleFinger1,
	    Left_leg: this.legsManager.rightLeg.upperLeg,
	    Left_knee: this.legsManager.rightLeg.lowerLeg,
	    Left_ankle: this.legsManager.rightLeg.foot,

	    Right_shoulder: this.shoulderTransforms.leftShoulderAnchor,
	    Right_arm: this.shoulderTransforms.leftArm.upperArm,
	    Right_elbow: this.shoulderTransforms.leftArm.lowerArm,
	    Right_wrist: this.shoulderTransforms.leftArm.hand,
      Right_thumb2: this.shoulderTransforms.leftArm.thumb2,
      Right_thumb1: this.shoulderTransforms.leftArm.thumb1,
      Right_thumb0: this.shoulderTransforms.leftArm.thumb0,
      Right_indexFinger3: this.shoulderTransforms.leftArm.indexFinger3,
      Right_indexFinger2: this.shoulderTransforms.leftArm.indexFinger2,
      Right_indexFinger1: this.shoulderTransforms.leftArm.indexFinger1,
      Right_middleFinger3: this.shoulderTransforms.leftArm.middleFinger3,
      Right_middleFinger2: this.shoulderTransforms.leftArm.middleFinger2,
      Right_middleFinger1: this.shoulderTransforms.leftArm.middleFinger1,
      Right_ringFinger3: this.shoulderTransforms.leftArm.ringFinger3,
      Right_ringFinger2: this.shoulderTransforms.leftArm.ringFinger2,
      Right_ringFinger1: this.shoulderTransforms.leftArm.ringFinger1,
      Right_littleFinger3: this.shoulderTransforms.leftArm.littleFinger3,
      Right_littleFinger2: this.shoulderTransforms.leftArm.littleFinger2,
      Right_littleFinger1: this.shoulderTransforms.leftArm.littleFinger1,
	    Right_leg: this.legsManager.leftLeg.upperLeg,
	    Right_knee: this.legsManager.leftLeg.lowerLeg,
	    Right_ankle: this.legsManager.leftLeg.foot,
      Left_toe: this.legsManager.leftLeg.toe,
      Right_toe: this.legsManager.rightLeg.toe,
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
    
    this.now = 0;

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

    this.animationMappings = animationMappingConfig.map(animationMapping => {
      animationMapping = animationMapping.clone();
      const isPosition = /\.position$/.test(animationMapping.animationTrackName);
      animationMapping.dst = this.modelBoneOutputs[animationMapping.boneName][isPosition ? 'position' : 'quaternion'];
      animationMapping.lerpFn = _getLerpFn(isPosition);
      return animationMapping;
    });

    // shared state
    this.direction = new THREE.Vector3();
    this.jumpState = false;
    this.jumpTime = NaN;
    this.flyState = false;
    this.flyTime = NaN;
    this.useTime = NaN;
    this.useAnimation = null;
    this.sitState = false;
    this.sitAnimation = null;
    // this.activateState = false;
    this.activateTime = 0;
    this.danceState = false;
    this.danceTime = 0;
    this.danceAnimation = null;
    this.throwState = null;
    this.throwTime = 0;
    this.crouchTime = crouchMaxTime;
    this.sitTarget = new THREE.Object3D();
    this.fakeSpeechValue = 0;
    this.fakeSpeechSmoothed = 0;
    this.narutoRunState = false;
    this.chargeJumpState = false;
    this.chargeJumpTime = 0;
    this.narutoRunTime = 0;
    this.standChargeState = false;
    this.standChargeTime = 0;
    this.chargeIdleState = false;
    this.chargeIdleTime = 0;
    this.fallLoopState = false;
    this.fallLoopTime = 0;
    this.swordSideSlashState = false;
    this.swordSideSlashTime = 0;
    this.swordTopDownSlashState = false;
    this.swordTopDownSlashTime = 0;
    this.landingState = false;
    this.landingTime = 0;
    this.aimState = false;
    this.aimDirection = new THREE.Vector3();
    
    // internal state
    this.lastPosition = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.lastIsBackward = false;
    this.lastBackwardFactor = 0;
    this.backwardAnimationSpec = null;
    this.startEyeTargetQuaternion = new THREE.Quaternion();
    this.lastNeedsEyeTarget = false;
    this.lastEyeTargetTime = 0;
  }
  static bindAvatar(object) {
    const model = object.scene;
    model.updateMatrixWorld(true);
    
    const skinnedMeshes = getSkinnedMeshes(object);
    const skeleton = getSkeleton(object);
    const boneMap = makeBoneMap(object);
    const tailBones = getTailBones(object);
    const modelBones = getModelBones(object);
    
    /* const retargetedAnimations = animations
      .filter(a => a.name === 'idle.fbx')
      .map(a => retargetAnimation(a, animationsBaseModel, object)); */
    
    const foundModelBones = {};
    for (const k in modelBones) {
      const v = modelBones[k];
      if (v) {
        foundModelBones[k] = v;
      }
    }

	  const armature = _findArmature(modelBones.Root);

    // const eyeDirection = getEyePosition(this.modelBones).sub(Head.getWorldPosition(new Vector3()));
    const leftArmDirection = modelBones.Left_wrist.getWorldPosition(new THREE.Vector3())
      .sub(modelBones.Head.getWorldPosition(new THREE.Vector3()));
	  const flipZ = leftArmDirection.x < 0;//eyeDirection.z < 0;
    const armatureDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(armature.quaternion);
    const flipY = armatureDirection.z < -0.5;
    const legDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
      modelBones.Left_leg.getWorldQuaternion(new THREE.Quaternion())
        .premultiply(armature.quaternion.clone().invert())
      );
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
    
    modelBones.Root.traverse(bone => {
      bone.initialQuaternion = bone.quaternion.clone();
    });
    
    return {
      skinnedMeshes,
      skeleton,
      modelBones,
      foundModelBones,
      flipZ,
      flipY,
      flipLeg,
      tailBones,
      armature,
      armatureQuaternion,
      armatureMatrixInverse,
      // retargetedAnimations,
    };
  }
  static applyModelBoneOutputs(modelBones, modelBoneOutputs, /*topEnabled,*/ bottomEnabled, lHandEnabled, rHandEnabled) {
    for (const k in modelBones) {
      const modelBone = modelBones[k];
      const modelBoneOutput = modelBoneOutputs[k];

      modelBone.position.copy(modelBoneOutput.position);
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
    modelBones.Root.updateMatrixWorld();
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

    leftToe: 'Left_toe',
    rightToe: 'Right_toe'
  }
  initializeBonePositions(setups) {
    this.shoulderTransforms.hips.position.copy(setups.hips);
    this.shoulderTransforms.spine.position.copy(setups.spine);
    this.shoulderTransforms.chest.position.copy(setups.chest);
    if (setups.upperChest) this.shoulderTransforms.upperChest.position.copy(setups.upperChest);
    this.shoulderTransforms.neck.position.copy(setups.neck);
    this.shoulderTransforms.head.position.copy(setups.head);
    // this.shoulderTransforms.eyes.position.copy(setups.eyes);
    if (setups.eyel) this.shoulderTransforms.eyel.position.copy(setups.eyel);
    if (setups.eyer) this.shoulderTransforms.eyer.position.copy(setups.eyer);

    if (setups.leftShoulder) this.shoulderTransforms.leftShoulderAnchor.position.copy(setups.leftShoulder);
    this.shoulderTransforms.leftArm.upperArm.position.copy(setups.leftUpperArm);
    this.shoulderTransforms.leftArm.lowerArm.position.copy(setups.leftLowerArm);
    this.shoulderTransforms.leftArm.hand.position.copy(setups.leftHand);
    if (setups.leftThumb2) this.shoulderTransforms.leftArm.thumb2.position.copy(setups.leftThumb2);
    if (setups.leftThumb1) this.shoulderTransforms.leftArm.thumb1.position.copy(setups.leftThumb1);
    if (setups.leftThumb0) this.shoulderTransforms.leftArm.thumb0.position.copy(setups.leftThumb0);
    if (setups.leftIndexFinger3) this.shoulderTransforms.leftArm.indexFinger3.position.copy(setups.leftIndexFinger3);
    if (setups.leftIndexFinger2) this.shoulderTransforms.leftArm.indexFinger2.position.copy(setups.leftIndexFinger2);
    if (setups.leftIndexFinger1) this.shoulderTransforms.leftArm.indexFinger1.position.copy(setups.leftIndexFinger1);
    if (setups.leftMiddleFinger3) this.shoulderTransforms.leftArm.middleFinger3.position.copy(setups.leftMiddleFinger3);
    if (setups.leftMiddleFinger2) this.shoulderTransforms.leftArm.middleFinger2.position.copy(setups.leftMiddleFinger2);
    if (setups.leftMiddleFinger1) this.shoulderTransforms.leftArm.middleFinger1.position.copy(setups.leftMiddleFinger1);
    if (setups.leftRingFinger3) this.shoulderTransforms.leftArm.ringFinger3.position.copy(setups.leftRingFinger3);
    if (setups.leftRingFinger2) this.shoulderTransforms.leftArm.ringFinger2.position.copy(setups.leftRingFinger2);
    if (setups.leftRingFinger1) this.shoulderTransforms.leftArm.ringFinger1.position.copy(setups.leftRingFinger1);
    if (setups.leftLittleFinger3) this.shoulderTransforms.leftArm.littleFinger3.position.copy(setups.leftLittleFinger3);
    if (setups.leftLittleFinger2) this.shoulderTransforms.leftArm.littleFinger2.position.copy(setups.leftLittleFinger2);
    if (setups.leftLittleFinger1) this.shoulderTransforms.leftArm.littleFinger1.position.copy(setups.leftLittleFinger1);

    if (setups.rightShoulder) this.shoulderTransforms.rightShoulderAnchor.position.copy(setups.rightShoulder);
    this.shoulderTransforms.rightArm.upperArm.position.copy(setups.rightUpperArm);
    this.shoulderTransforms.rightArm.lowerArm.position.copy(setups.rightLowerArm);
    this.shoulderTransforms.rightArm.hand.position.copy(setups.rightHand);
    if (setups.rightThumb2) this.shoulderTransforms.rightArm.thumb2.position.copy(setups.rightThumb2);
    if (setups.rightThumb1) this.shoulderTransforms.rightArm.thumb1.position.copy(setups.rightThumb1);
    if (setups.rightThumb0) this.shoulderTransforms.rightArm.thumb0.position.copy(setups.rightThumb0);
    if (setups.rightIndexFinger3) this.shoulderTransforms.rightArm.indexFinger3.position.copy(setups.rightIndexFinger3);
    if (setups.rightIndexFinger2) this.shoulderTransforms.rightArm.indexFinger2.position.copy(setups.rightIndexFinger2);
    if (setups.rightIndexFinger1) this.shoulderTransforms.rightArm.indexFinger1.position.copy(setups.rightIndexFinger1);
    if (setups.rightMiddleFinger3) this.shoulderTransforms.rightArm.middleFinger3.position.copy(setups.rightMiddleFinger3);
    if (setups.rightMiddleFinger2) this.shoulderTransforms.rightArm.middleFinger2.position.copy(setups.rightMiddleFinger2);
    if (setups.rightMiddleFinger1) this.shoulderTransforms.rightArm.middleFinger1.position.copy(setups.rightMiddleFinger1);
    if (setups.rightRingFinger3) this.shoulderTransforms.rightArm.ringFinger3.position.copy(setups.rightRingFinger3);
    if (setups.rightRingFinger2) this.shoulderTransforms.rightArm.ringFinger2.position.copy(setups.rightRingFinger2);
    if (setups.rightRingFinger1) this.shoulderTransforms.rightArm.ringFinger1.position.copy(setups.rightRingFinger1);
    if (setups.rightLittleFinger3) this.shoulderTransforms.rightArm.littleFinger3.position.copy(setups.rightLittleFinger3);
    if (setups.rightLittleFinger2) this.shoulderTransforms.rightArm.littleFinger2.position.copy(setups.rightLittleFinger2);
    if (setups.rightLittleFinger1) this.shoulderTransforms.rightArm.littleFinger1.position.copy(setups.rightLittleFinger1);

    this.legsManager.leftLeg.upperLeg.position.copy(setups.leftUpperLeg);
    this.legsManager.leftLeg.lowerLeg.position.copy(setups.leftLowerLeg);
    this.legsManager.leftLeg.foot.position.copy(setups.leftFoot);
    if (setups.leftToe) this.legsManager.leftLeg.toe.position.copy(setups.leftToe);

    this.legsManager.rightLeg.upperLeg.position.copy(setups.rightUpperLeg);
    this.legsManager.rightLeg.lowerLeg.position.copy(setups.rightLowerLeg);
    this.legsManager.rightLeg.foot.position.copy(setups.rightFoot);
    if (setups.rightToe) this.legsManager.rightLeg.toe.position.copy(setups.rightToe);

    this.shoulderTransforms.root.updateMatrixWorld();
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
  update(timeDiff) {
    const {now} = this;
    const timeDiffS = timeDiff / 1000;
    const currentSpeed = localVector.set(this.velocity.x, 0, this.velocity.z).length();
    
    // walk = 0.29
    // run = 0.88
    // walk backward = 0.20
    // run backward = 0.61
    const idleSpeed = 0;
    const walkSpeed = 0.25;
    const runSpeed = 0.7;
    const idleWalkFactor = Math.min(Math.max((currentSpeed - idleSpeed) / (walkSpeed - idleSpeed), 0), 1);
    const walkRunFactor = Math.min(Math.max((currentSpeed - walkSpeed) / (runSpeed - walkSpeed), 0), 1);
    // console.log('current speed', currentSpeed, idleWalkFactor, walkRunFactor);

    const _updatePosition = () => {
      const currentPosition = this.inputs.hmd.position;
      const currentQuaternion = this.inputs.hmd.quaternion;
      
      const positionDiff = localVector.copy(this.lastPosition)
        .sub(currentPosition)
        .divideScalar(timeDiffS)
        .multiplyScalar(0.1);
      localEuler.setFromQuaternion(currentQuaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      localEuler.y += Math.PI;
      localEuler2.set(-localEuler.x, -localEuler.y, -localEuler.z, localEuler.order);
      positionDiff.applyEuler(localEuler2);
      this.velocity.copy(positionDiff);
      this.lastPosition.copy(currentPosition);
      this.direction.copy(positionDiff).normalize();
    };
    _updatePosition();
    
    const _applyAnimation = () => {
      const runSpeed = 0.5;
      const angle = this.getAngle();
      const timeSeconds = now/1000;
      
      const _getAnimationKey = crouchState => {
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
      /* const _getIdleAnimation = key => {
        if (key === 'walk' || key === 'run') {
          const name = animationsIdleArrays[key].name;
          return this.retargetedAnimations.find(a => a.name === name);
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
        target
      ) => {
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
          const t3 = timeSeconds % idleAnimation.duration;
          const src3 = idleAnimation.interpolants[k];
          const v3 = src3.evaluate(t3);

          lerpFn
            .call(
              target.fromArray(v3),
              localQuaternion4,
              idleWalkFactor
            );
        }
      };
      
      // stand
      const key = _getAnimationKey(false);
      const keyWalkAnimationAngles = _getClosest2AnimationAngles('walk');
      const keyWalkAnimationAnglesMirror = _getMirrorAnimationAngles(keyWalkAnimationAngles, 'walk');

      const keyRunAnimationAngles = _getClosest2AnimationAngles('run');
      const keyRunAnimationAnglesMirror = _getMirrorAnimationAngles(keyRunAnimationAngles, 'run');
      
      const idleAnimation = _getIdleAnimation('walk');

      // walk sound effect
      {
        const soundManager = metaversefile.useSoundManager();
        const currAniTime = timeSeconds % idleAnimation.duration;

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
      }
      
      // crouch
      // const keyOther = _getAnimationKey(true);
      const keyAnimationAnglesOther = _getClosest2AnimationAngles('crouch');
      const keyAnimationAnglesOtherMirror = _getMirrorAnimationAngles(keyAnimationAnglesOther, 'crouch');
      const idleAnimationOther = _getIdleAnimation('crouch');
      
      const angleToClosestAnimation = Math.abs(angleDifference(angle, keyWalkAnimationAnglesMirror[0].angle));
      const angleBetweenAnimations = Math.abs(angleDifference(keyWalkAnimationAnglesMirror[0].angle, keyWalkAnimationAnglesMirror[1].angle));
      const angleFactor = (angleBetweenAnimations - angleToClosestAnimation) / angleBetweenAnimations;
      const crouchFactor = Math.min(Math.max(1 - (this.crouchTime / crouchMaxTime), 0), 1);
      const isBackward = _getAngleToBackwardAnimation(keyWalkAnimationAnglesMirror) < Math.PI*0.4;
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

      const _getHorizontalBlend = (k, lerpFn, target) => {
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
          localQuaternion
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
          localQuaternion2
        );
        
        //_get5wayBlend(keyAnimationAnglesOther, keyAnimationAnglesOtherMirror, idleAnimationOther, mirrorFactor, angleFactor, speedFactor, k, lerpFn, localQuaternion2);
        
        lerpFn
          .call(
            target.copy(localQuaternion),
            localQuaternion2,
            crouchFactor
          );

      };
      const _getApplyFn = () => {

        if (this.jumpState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;
            // console.log('JumpState', spec)

            const t2 = this.jumpTime/1000 * 0.6 + 0.7;
            const src2 = jumpAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.sitState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;
            
            const sitAnimation = sitAnimations[this.sitAnimation || defaultSitAnimation];
            const src2 = sitAnimation.interpolants[k];
            const v2 = src2.evaluate(1);

            dst.fromArray(v2);
          }
        }
        if (this.activateTime > 0) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;
            const activateAnimation = activateAnimations[defaultActivateAnimation];
            const src2 = activateAnimation.interpolants[k];
            const t2 = Math.pow(this.activateTime/1000*activateAnimation.duration/2, 0.5);
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.narutoRunState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;
            
            const narutoRunAnimation = narutoRunAnimations[defaultNarutoRunAnimation];
            const src2 = narutoRunAnimation.interpolants[k];
            const t2 = (this.narutoRunTime / 1000 * 4) % narutoRunAnimation.duration;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }

        if (this.danceState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;
            

            const danceAnimation = danceAnimations[this.danceAnimation || defaultDanceAnimation];
            const src2 = danceAnimation.interpolants[k];
            const t2 = (this.danceTime/1000) % danceAnimation.duration;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }

         if (this.standChargeState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;

            

            const t2 = (this.standChargeTime/1000) ;
            const src2 = standCharge.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }

        if (this.chargeIdleState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;

            

            const t2 = (this.chargeIdleTime/1000) ;
            const src2 = chargeIdle.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }

        if (this.landingState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;

            const t2 = (this.landingTime/1000) ;
            const src2 = landing.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.swordSideSlashState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;

            const t2 = (this.swordSideSlashTime/1000) ;
            const src2 = swordSideSlash.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.swordTopDownSlashState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;

            const t2 = (this.swordTopDownSlashTime/1000) ;
            const src2 = swordTopDownSlash.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.fallLoopState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;

            const t2 = (this.fallLoopTime/1000) ;
            const src2 = fallLoop.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.chargeJumpState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;

            
            const t2 = (this.chargeJumpTime/1000) ;
            const src2 = chargeJump.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.jumpState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;
            

            const throwAnimation = throwAnimations[this.throwAnimation || defaultThrowAnimation];
            const danceAnimation = danceAnimations[0];
            const src2 = throwAnimation.interpolants[k];
            const t2 = (this.danceTime/1000) ;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          };
        }
        if (this.throwState) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
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
            animationTrackName: k,
            dst,
            isTop,
            lerpFn,
          } = spec;
          
          _getHorizontalBlend(k, lerpFn, dst);
        };
        if (this.useTime >= 0) {
          return spec => {
            const {
              animationTrackName: k,
              dst,
              isTop,
            } = spec;
            
            if (isTop) {
              const useAnimation = (this.useAnimation && useAnimations[this.useAnimation]) //|| useAnimations[defaultUseAnimation];
              if (useAnimation) {
                const t2 = (this.useTime/useMaxTime) % useAnimation.duration;
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
          animationTrackName: k,
          dst,
          isTop,
          lerpFn,
        } = spec;
        
        if (this.flyState || (this.flyTime >= 0 && this.flyTime < 1000)) {
          const t2 = this.flyTime/1000;
          const f = this.flyState ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));
          const src2 = floatAnimation.interpolants[k];
          const v2 = src2.evaluate(t2 % floatAnimation.duration);

          lerpFn
            .call(
              dst,
              localQuaternion.fromArray(v2),
              f
            );
        }
      };
      for (const spec of this.animationMappings) {
        const {
          animationTrackName: k,
          dst,
          isTop,
          isPosition,
        } = spec;
        
        applyFn(spec);
        _blendFly(spec);
        
        // ignore all animation position except y
        if (isPosition) {
          dst.x = 0;
          if (!this.jumpState) {
            // animations position is height-relative
            dst.y *= this.height;
          } else {
            // force height in the jump case to overide the animation
            dst.y = this.height * 0.55;
          }
          dst.z = 0;
        }
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
    // if (!this.getBottomEnabled()) {
      localEuler.setFromQuaternion(this.inputs.hmd.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      localEuler.y += Math.PI;
      this.modelBoneOutputs.Root.quaternion.setFromEuler(localEuler);
      
      this.modelBoneOutputs.Root.position.copy(this.inputs.hmd.position)
        .sub(localVector.set(0, this.height, 0));
    // }
    /* if (!this.getTopEnabled() && this.debugMeshes) {
      this.modelBoneOutputs.Hips.updateMatrixWorld();
    } */

    this.shoulderTransforms.Update();
    this.legsManager.Update();

    const _updateEyeTarget = () => {
      const eyePosition = getEyePosition(this.modelBones);
      const globalQuaternion = localQuaternion2.setFromRotationMatrix(
        this.eyeTargetInverted ?
          localMatrix.lookAt(
            this.eyeTarget,
            eyePosition,
            upVector
          )
        :
          localMatrix.lookAt(
            eyePosition,
            this.eyeTarget,
            upVector
          )
      );
      // this.modelBoneOutputs.Root.updateMatrixWorld();
      this.modelBoneOutputs.Neck.matrixWorld.decompose(localVector, localQuaternion, localVector2);

      const needsEyeTarget = this.eyeTargetEnabled && this.modelBones.Root.quaternion.angleTo(globalQuaternion) < Math.PI*0.4;
      if (needsEyeTarget && !this.lastNeedsEyeTarget) {
        this.startEyeTargetQuaternion.copy(localQuaternion);
        this.lastEyeTargetTime = now;
      } else if (this.lastNeedsEyeTarget && !needsEyeTarget) {
        this.startEyeTargetQuaternion.copy(localQuaternion);
        this.lastEyeTargetTime = now;
      }
      this.lastNeedsEyeTarget = needsEyeTarget;

      const eyeTargetFactor = Math.min(Math.max((now - this.lastEyeTargetTime) / maxEyeTargetTime, 0), 1);
      if (needsEyeTarget) {
        localQuaternion.copy(this.startEyeTargetQuaternion)
          .slerp(globalQuaternion, cubicBezier(eyeTargetFactor));
        this.modelBoneOutputs.Neck.matrixWorld.compose(localVector, localQuaternion, localVector2)
        this.modelBoneOutputs.Neck.matrix.copy(this.modelBoneOutputs.Neck.matrixWorld)
          .premultiply(localMatrix2.copy(this.modelBoneOutputs.Neck.parent.matrixWorld).invert())
          .decompose(this.modelBoneOutputs.Neck.position, this.modelBoneOutputs.Neck.quaternion, localVector2);
      } else {
        localMatrix.compose(localVector.set(0, 0, 0), this.startEyeTargetQuaternion, localVector2.set(1, 1, 1))
          .premultiply(localMatrix2.copy(this.modelBoneOutputs.Neck.parent.matrixWorld).invert())
          .decompose(localVector, localQuaternion, localVector2);
        localQuaternion
          .slerp(localQuaternion2.identity(), cubicBezier(eyeTargetFactor));
        this.modelBoneOutputs.Neck.quaternion.copy(localQuaternion);
      }
      
    };
    _updateEyeTarget();
    this.modelBoneOutputs.Root.updateMatrixWorld();
    
    Avatar.applyModelBoneOutputs(
      this.foundModelBones,
      this.modelBoneOutputs,
      // this.getTopEnabled(),
      this.getBottomEnabled(),
      this.getHandEnabled(0),
      this.getHandEnabled(1),
    );
    // this.modelBones.Root.updateMatrixWorld();

    if (this.springBoneManager) {
      this.springBoneTimeStep.update(timeDiff);
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
        this.getHandEnabled(0) && this.modelBoneOutputs.Left_arm.quaternion.multiply(rightRotation); // center
        this.modelBoneOutputs.Left_arm.updateMatrixWorld();
        this.getHandEnabled(1) && this.modelBoneOutputs.Right_arm.quaternion.multiply(leftRotation); // center
        this.modelBoneOutputs.Right_arm.updateMatrixWorld();
      }

      for (const k in this.debugMeshes.attributes) {
        const attribute = this.debugMeshes.attributes[k];
        if (attribute.visible) {
          const output = this.modelBoneOutputs[k];
          attribute.array.set(attribute.srcGeometry.attributes.position.array);
          attribute.applyMatrix4(localMatrix.multiplyMatrices(this.model.matrixWorld, output.matrixWorld));
        } else {
          attribute.array.fill(0);
        }
      }
      this.debugMeshes.geometry.attributes.position.needsUpdate = true;
    } */
    
    this.now += timeDiff;
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
Avatar.getAnimationMappingConfig = () => animationMappingConfig;
export default Avatar;
