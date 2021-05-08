import THREE from '../three.module.js';
import {GLTFLoader} from '../GLTFLoader.js';
import {DRACOLoader} from '../DRACOLoader.js';
import './vrarmik/three-vrm.js';
import {BufferGeometryUtils} from '../BufferGeometryUtils.js';
import {fixSkeletonZForward} from './vrarmik/SkeletonUtils.js';
import PoseManager from './vrarmik/PoseManager.js';
import ShoulderTransforms from './vrarmik/ShoulderTransforms.js';
import LegsManager from './vrarmik/LegsManager.js';
import MicrophoneWorker from './microphone-worker.js';
import skeletonString from './skeleton.js';
import easing from '../easing.js';
import CBOR from '../cbor.js';
import {defaultAvatarModelUrl} from '../constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const upRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5);
const forwardVector = new THREE.Vector3(0, 0, 1);
const leftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5);
const rightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5);
const cubicBezier = easing(0, 1, 0, 1);
const defaultSitAnimation = 'chair';
const defaultUseAnimation = 'combo';
const defaultDanceAnimation = 'dansu';
const defaultThrowAnimation = 'throw';
const useAnimationRate = 750;
const crouchMaxTime = 200;
const z180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

let emotionIndex = -1;
let poseIndex = -1;


window.addEventListener('keydown', e => {
  if (poseData) {
    if (e.which === 35) {
      poseIndex = Math.min(Math.max(poseIndex - 1, 0), poseData.length - 1);
      console.log(poseIndex);
    } else if (e.which === 40) {
      poseIndex = Math.min(Math.max(poseIndex + 1, 0), poseData.length - 1);
      console.log(poseIndex);
    } else if (e.which === 37) {
      emotionIndex = Math.min(Math.max(emotionIndex - 1, 0), Infinity);
      console.log(emotionIndex);
    } else if (e.which === 12) {
      emotionIndex = Math.min(Math.max(emotionIndex + 1, 0), Infinity);
      console.log(emotionIndex);
    }
  }
}, true);

const infinityUpVector = new THREE.Vector3(0, Infinity, 0);
const crouchMagnitude = 0.2;

let defaultAvatarModel = null;

const animationsSelectMap = {
  crouch: {
    crouch_idle: new THREE.Vector3(0, 0, 0),
    sneaking_forward: new THREE.Vector3(0, 0, -crouchMagnitude),
    sneaking_forward_reverse: new THREE.Vector3(0, 0, crouchMagnitude),
    crouched_sneaking_left: new THREE.Vector3(-crouchMagnitude, 0, 0),
    crouched_sneaking_right: new THREE.Vector3(crouchMagnitude, 0, 0),
  },
  stand: {
    idle: new THREE.Vector3(0, 0, 0),
    jump: new THREE.Vector3(0, 1, 0),

    left_strafe_walking: new THREE.Vector3(-0.5, 0, 0),
    left_strafe: new THREE.Vector3(-1, 0, 0),
    right_strafe_walking: new THREE.Vector3(0.5, 0, 0),
    right_strafe: new THREE.Vector3(1, 0, 0),

    running: new THREE.Vector3(0, 0, -1),
    walking: new THREE.Vector3(0, 0, -0.5),

    running_backwards: new THREE.Vector3(0, 0, 1),
    walking_backwards: new THREE.Vector3(0, 0, 0.5),

    left_strafe_walking_reverse: new THREE.Vector3(-Infinity, 0, 0),
    left_strafe_reverse: new THREE.Vector3(-Infinity, 0, 0),
    right_strafe_walking_reverse: new THREE.Vector3(Infinity, 0, 0),
    right_strafe_reverse: new THREE.Vector3(Infinity, 0, 0),
  },
  hoverboard: {
    'simple_hoverboard_stand': new THREE.Vector3(0, 0, 0),

    'simple_hoverboard_lean_left': new THREE.Vector3(-1, 0, 0),
    'simple_hoverboard_lean_right': new THREE.Vector3(1, 0, 0),
    'simple_hoverboard_lean_forward': new THREE.Vector3(0, 0, -1),
    'simple_hoverboard_lean_backward': new THREE.Vector3(0, 0, 1),
  },
};
const animationsDistanceMap = {
  idle: new THREE.Vector3(0, 0, 0),
  jump: new THREE.Vector3(0, 1, 0),

  left_strafe_walking: new THREE.Vector3(-0.5, 0, 0),
  left_strafe: new THREE.Vector3(-1, 0, 0),
  right_strafe_walking: new THREE.Vector3(0.5, 0, 0),
  right_strafe: new THREE.Vector3(1, 0, 0),

  running: new THREE.Vector3(0, 0, -1),
  walking: new THREE.Vector3(0, 0, -0.5),

  running_backwards: new THREE.Vector3(0, 0, 1),
  walking_backwards: new THREE.Vector3(0, 0, 0.5),

  left_strafe_walking_reverse: new THREE.Vector3(-1, 0, 1).normalize().multiplyScalar(2),
  left_strafe_reverse: new THREE.Vector3(-1, 0, 1).normalize().multiplyScalar(3),
  right_strafe_walking_reverse: new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(2),
  right_strafe_reverse: new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(3),

  crouch_idle: new THREE.Vector3(0, 0, 0),
  sneaking_forward: new THREE.Vector3(0, 0, -crouchMagnitude),
  sneaking_forward_reverse: new THREE.Vector3(0, 0, crouchMagnitude),
  crouched_sneaking_left: new THREE.Vector3(-crouchMagnitude, 0, 0),
  crouched_sneaking_left_reverse: new THREE.Vector3(-crouchMagnitude, 0, crouchMagnitude),
  crouched_sneaking_right: new THREE.Vector3(crouchMagnitude, 0, 0),
  crouched_sneaking_right_reverse: new THREE.Vector3(crouchMagnitude, 0, crouchMagnitude),

  'simple_hoverboard_stand': new THREE.Vector3(0, 0, 0),
  'simple_hoverboard_lean_left': new THREE.Vector3(-1, 0, 0),
  'simple_hoverboard_lean_right': new THREE.Vector3(1, 0, 0),
  'simple_hoverboard_lean_forward': new THREE.Vector3(0, 0, -1),
  'simple_hoverboard_lean_backward': new THREE.Vector3(0, 0, 1),
};
let animations;
let jumpAnimation;
let floatAnimation;
let useAnimations;
let sitAnimations;
let danceAnimations;
let throwAnimations;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('../');
dracoLoader.preload();
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const _gltfClone = a => {
  const result = {
    scene: a.scene,
  };
  for (const k in a) {
    if (k !== 'scene') {
     result[k] = a[k];
    }
  }
  return result;
};

let poseData = null;
const loadPromise = Promise.all([
  // load default avatar
  (async () => {
    defaultAvatarModel = await new Promise((resolve, reject) => {
      gltfLoader.load(defaultAvatarModelUrl, resolve, () => {}, err => {
        reject(err);
      });
    });
  })(),
  // load animations
  (async () => {
    const animationsModel = await new Promise((resolve, reject) => {
      gltfLoader.load('../animations/animations1.glb', resolve, () => {}, reject);
    });
    animations = animationsModel.animations;
    
    // console.log('got animations', animations.map(a => a.name));
    
    // const akPitch = animations.find(a => a.name === 'ak_pitch');
    // const akYaw = animations.find(a => a.name === 'ak_yaw');
    /* const simpleHoverboardLeanBackward = animations.find(a => a.name === 'simple_hoverboard_lean_backward');
    const simpleHoverboardLeanForward = animations.find(a => a.name === 'simple_hoverboard_lean_forward');
    const simpleHoverboardLeanLeft = animations.find(a => a.name === 'simple_hoverboard_lean_left');
    const simpleHoverboardLeanRight = animations.find(a => a.name === 'simple_hoverboard_lean_right');
    const simpleHoverboardStand = animations.find(a => a.name === 'simple_hoverboard_stand'); */

    const _normalizeAnimationDurations = (animations, baseAnimation) => {
      for (let i = 1; i < animations.length; i++) {
        const animation = animations[i];
        const oldDuration = animation.duration;
        const newDuration = baseAnimation.duration;
        for (const track of animation.tracks) {
          const {times} = track;
          for (let j = 0; j < times.length; j++) {
            times[j] *= newDuration / oldDuration;
          }
        }
        animation.duration = newDuration;
      }
    };
    const walkingAnimations = [
      'walking',
      'left_strafe_walking',
      'right_strafe_walking',
    ].map(name => animations.find(a => a.name === name));
    _normalizeAnimationDurations(walkingAnimations, walkingAnimations[0]);
    const walkingBackwardAnimations = [
      'walking_backwards',
      'left_strafe_walking_reverse',
      'right_strafe_walking_reverse',
    ].map(name => animations.find(a => a.name === name));
    _normalizeAnimationDurations(walkingBackwardAnimations, walkingBackwardAnimations[0]);
    const runningAnimations = [
      'running',
      'left_strafe',
      'right_strafe',
    ].map(name => animations.find(a => a.name === name));
    _normalizeAnimationDurations(runningAnimations, runningAnimations[0]);
    const runningBackwardAnimations = [
      'running_backwards',
      'left_strafe_reverse',
      'right_strafe_reverse',
    ].map(name => animations.find(a => a.name === name));
    _normalizeAnimationDurations(runningBackwardAnimations, runningBackwardAnimations[0]);
    const crouchingForwardAnimations = [
      'sneaking_forward',
      'crouched_sneaking_left',
      'crouched_sneaking_right',
    ].map(name => animations.find(a => a.name === name));
    _normalizeAnimationDurations(crouchingForwardAnimations, crouchingForwardAnimations[0]);
    animations.forEach(animation => {
      animation.direction = (() => {
        switch (animation.name) {
          case 'running':
          case 'walking':
          case 'sneaking_forward':
            return 'forward';
          case 'running_backwards':
          case 'walking_backwards':
            return 'backward';
          case 'left_strafe_walking':
          case 'left_strafe':
          case 'left_strafe_walking_reverse':
          case 'left_strafe_reverse':
          case 'crouched_sneaking_left':
            return 'left';
          case 'right_strafe_walking':
          case 'right_strafe':
          case 'right_strafe_walking_reverse':
          case 'right_strafe_reverse':
          case 'crouched_sneaking_right':
            return 'right';
          case 'jump':
          /* case 'falling':
          case 'falling_idle':
          case 'falling_landing': */
            return 'jump';
          // case 'floating':
          case 'treading_water':
            return 'float';
          default:
            return null;
        }
      })();
      animation.isIdle = /idle\_active|simple\_hoverboard\_stand/i.test(animation.name);
      animation.isJump = /jump/i.test(animation.name);
      animation.isSitting = /sitting/i.test(animation.name);
      // animation.isFalling  = /falling/i.test(animation.name);
      animation.isFloat = /treading/i.test(animation.name);
      animation.isPistol = /pistol_aiming/i.test(animation.name);
      animation.isRifle = /rifle_aiming/i.test(animation.name);
      // animation.isHit  = /downward/i.test(animation.name);
      animation.isSlash = /slash/i.test(animation.name);
      // animation.isHit  = /attack/i.test(animation.name);
      animation.isCombo = /combo/i.test(animation.name);
      // animation.isHit = /sword_and_shield_idle/i.test(animation.name);
      animation.isMagic = /magic/i.test(animation.name);
      // animation.isSkateboarding = /skateboarding/i.test(animation.name);
      animation.isSkateboarding = /simple\_hoverboard/i.test(animation.name);
      animation.isThrow = /throw/i.test(animation.name);
      animation.isDancing = /dancing/i.test(animation.name);
      animation.isCrouch = /crouch|sneak/i.test(animation.name);
      animation.isForward = /forward/i.test(animation.name);
      animation.isBackward = /backward/i.test(animation.name) || /sneaking forward_reverse/i.test(animation.name);
      animation.isLeft = /left/i.test(animation.name);
      animation.isRight = /right/i.test(animation.name);
      animation.isRunning = /running|left_strafe(?:_reverse)?|right_strafe(?:_reverse)?/i.test(animation.name);
      animation.isReverse = /reverse/i.test(animation.name);
      animation.isPitch = /pitch/i.test(animation.name);
      animation.isYaw = /yaw/i.test(animation.name);
      animation.interpolants = {};
      animation.tracks.forEach(track => {
        const i = track.createInterpolant();
        i.name = track.name;
        animation.interpolants[track.name] = i;
        return i;
      });
      /* for (let i = 0; i < animation.interpolants['Hips.position'].sampleValues.length; i++) {
        animation.interpolants['Hips.position'].sampleValues[i] *= 0.01;
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
    };
    sitAnimations = {
      chair: animations.find(a => a.isSitting),
      saddle: animations.find(a => a.isSitting),
      stand: animations.find(a => a.isSkateboarding && a.isIdle),
    };
    danceAnimations = {
      dansu: animations.find(a => a.isDancing),
    };
    throwAnimations = {
      throw: animations.find(a => a.isThrow),
    };
  })(),
  // load poses
  (async () => {
    const res = await fetch('../poses/poses.cbor');
    const arrayBuffer = await res.arrayBuffer();
    poseData = CBOR.decode(arrayBuffer);
    poseData = poseData.map(track => {
      return {
        bones: track.map(bone => {
          const {quaternion, mappedName} = bone;
          return {
            mappedName,
            quaternion: new THREE.Quaternion().fromArray(quaternion),
          };
        }),
      };
    });
  })(),
]).catch(err => {
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

const _copySkeleton = (src, dst) => {
  for (let i = 0; i < src.bones.length; i++) {
    const srcBone = src.bones[i];
    const dstBone = _findBoneDeep(dst.bones, srcBone.name);
    dstBone.matrixWorld.copy(srcBone.matrixWorld);
  }

  const armature = dst.bones[0].parent;
  _localizeMatrixWorld(armature);

  dst.calculateInverses();
};

const cubeGeometry = new THREE.ConeBufferGeometry(0.05, 0.2, 3)
  .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))),
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
      new Float32Array(geometry.attributes.position.array.buffer, geometry.attributes.position.array.byteOffset + index * numCubeGeometryPositions * Float32Array.BYTES_PER_ELEMENT, numCubeGeometryPositions),
      3,
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
  for (; bone; bone = bone.parent) {
    if (pred(bone)) {
      return bone;
    }
  }
  return null;
};
const _findFurthestParentBone = (bone, pred) => {
  let result = null;
  for (; bone; bone = bone.parent) {
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
  };
  return _recurse(bone);
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
};

const _importObject = (b, Cons, ChildCons) => {
  const [name, array, children] = b;
  const bone = new Cons();
  bone.name = name;
  bone.position.fromArray(array, 0);
  bone.quaternion.fromArray(array, 3);
  bone.scale.fromArray(array, 3 + 4);
  for (let i = 0; i < children.length; i++) {
    bone.add(_importObject(children[i], ChildCons, ChildCons));
  }
  return bone;
};
const _importArmature = b => _importObject(b, THREE.Object3D, THREE.Bone);
const _importSkeleton = s => {
  const armature = _importArmature(JSON.parse(s));
  return new THREE.Skeleton(armature.children);
};

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
      object = _gltfClone(defaultAvatarModel);
    }
    this.object = object;
    const model = (() => {
      let o = object;
      if (o && !o.isMesh) {
        o = o.scene;
      }
      if (!o) {
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
      }
      return o;
    })();
    this.model = model;
    this.options = options;
    this.ikEnabled = (this.options.ikEnabled === undefined || this.options.ikEnabled);

    model.updateMatrixWorld(true);
    const skinnedMeshes = [];
    model.traverse(o => {
      if (o.isSkinnedMesh) {
        skinnedMeshes.push(o);
      }
    });
    skinnedMeshes.sort((a, b) => b.skeleton.bones.length - a.skeleton.bones.length);
    this.skinnedMeshes = skinnedMeshes;

    const skeletonSkinnedMesh = skinnedMeshes.find(o => o.skeleton.bones[0].parent) || null;
    const skeleton = skeletonSkinnedMesh && skeletonSkinnedMesh.skeleton;
    const poseSkeletonSkinnedMesh = skeleton ? skinnedMeshes.find(o => o.skeleton !== skeleton && o.skeleton.bones.length >= skeleton.bones.length) : null;
    const poseSkeleton = poseSkeletonSkinnedMesh && poseSkeletonSkinnedMesh.skeleton;
    if (poseSkeleton) {
      _copySkeleton(poseSkeleton, skeleton);
      poseSkeletonSkinnedMesh.bind(skeleton);
    }

    /* if (options.debug) {
      const debugMeshes = _makeDebugMeshes();
      this.model.add(debugMeshes);
      this.debugMeshes = debugMeshes;
    } else {
      this.debugMeshes = null;
    } */

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

    this._rot_y = 0

    const tailBones = _getTailBones(skeleton);

    const EyeL = _findEye(tailBones, true);
    const EyeR = _findEye(tailBones, false);
    const Head = _findHead(tailBones);
    const Neck = Head.parent;
    const Chest = Neck.parent;
    const Hips = _findHips(skeleton);
    const Spine = _findSpine(Chest, Hips);
    const LeftShoulder = _findShoulder(tailBones, true);
    const LeftWrist = _findHand(LeftShoulder);
    const LeftThumb2 = _getOptional(_findFinger(LeftWrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02l|l_thumb3|thumb002l/i));
    const LeftThumb1 = _ensureParent(LeftThumb2);
    const LeftThumb0 = _ensureParent(LeftThumb1, LeftWrist);
    const LeftIndexFinger3 = _getOptional(_findFinger(LeftWrist, /index(?:finger)?3|index_distal|index02l|indexfinger3_l|index002l/i));
    const LeftIndexFinger2 = _ensureParent(LeftIndexFinger3);
    const LeftIndexFinger1 = _ensureParent(LeftIndexFinger2, LeftWrist);
    const LeftMiddleFinger3 = _getOptional(_findFinger(LeftWrist, /middle(?:finger)?3|middle_distal|middle02l|middlefinger3_l|middle002l/i));
    const LeftMiddleFinger2 = _ensureParent(LeftMiddleFinger3);
    const LeftMiddleFinger1 = _ensureParent(LeftMiddleFinger2, LeftWrist);
    const LeftRingFinger3 = _getOptional(_findFinger(LeftWrist, /ring(?:finger)?3|ring_distal|ring02l|ringfinger3_l|ring002l/i));
    const LeftRingFinger2 = _ensureParent(LeftRingFinger3);
    const LeftRingFinger1 = _ensureParent(LeftRingFinger2, LeftWrist);
    const LeftLittleFinger3 = _getOptional(_findFinger(LeftWrist, /little(?:finger)?3|pinky3|little_distal|little02l|lifflefinger3_l|little002l/i));
    const LeftLittleFinger2 = _ensureParent(LeftLittleFinger3);
    const LeftLittleFinger1 = _ensureParent(LeftLittleFinger2, LeftWrist);
    const LeftElbow = /^lower_arm(?:l|r)2$/i.test(LeftWrist.parent.name) ? LeftWrist.parent.parent : LeftWrist.parent;
    const LeftArm = LeftElbow.parent;
    const RightShoulder = _findShoulder(tailBones, false);
    const RightWrist = _findHand(RightShoulder);
    const RightThumb2 = _getOptional(_findFinger(RightWrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02r|r_thumb3|thumb002r/i));
    const RightThumb1 = _ensureParent(RightThumb2);
    const RightThumb0 = _ensureParent(RightThumb1, RightWrist);
    const RightIndexFinger3 = _getOptional(_findFinger(RightWrist, /index(?:finger)?3|index_distal|index02r|indexfinger3_r|index002r/i));
    const RightIndexFinger2 = _ensureParent(RightIndexFinger3);
    const RightIndexFinger1 = _ensureParent(RightIndexFinger2, RightWrist);
    const RightMiddleFinger3 = _getOptional(_findFinger(RightWrist, /middle(?:finger)?3|middle_distal|middle02r|middlefinger3_r|middle002r/i));
    const RightMiddleFinger2 = _ensureParent(RightMiddleFinger3);
    const RightMiddleFinger1 = _ensureParent(RightMiddleFinger2, RightWrist);
    const RightRingFinger3 = _getOptional(_findFinger(RightWrist, /ring(?:finger)?3|ring_distal|ring02r|ringfinger3_r|ring002r/i));
    const RightRingFinger2 = _ensureParent(RightRingFinger3);
    const RightRingFinger1 = _ensureParent(RightRingFinger2, RightWrist);
    const RightLittleFinger3 = _getOptional(_findFinger(RightWrist, /little(?:finger)?3|pinky3|little_distal|little02r|lifflefinger3_r|little002r/i));
    const RightLittleFinger2 = _ensureParent(RightLittleFinger3);
    const RightLittleFinger1 = _ensureParent(RightLittleFinger2, RightWrist);
    const RightElbow = /^lower_arm(?:l|r)2$/i.test(RightWrist.parent.name) ? RightWrist.parent.parent : RightWrist.parent;
    const RightArm = RightElbow.parent;
    const LeftAnkle = _findFoot(tailBones, true);
    const LeftKnee = LeftAnkle.parent;
    const LeftLeg = LeftKnee.parent;
    const RightAnkle = _findFoot(tailBones, false);
    const RightKnee = RightAnkle.parent;
    const RightLeg = RightKnee.parent;
    const modelBones = {
      Hips,
      Spine,
      Chest,
      Neck,
      Head,
      EyeL,
      EyeR,

      LeftShoulder,
      LeftArm,
      LeftElbow,
      LeftWrist,
      LeftThumb2,
      LeftThumb1,
      LeftThumb0,
      LeftIndexFinger3,
      LeftIndexFinger2,
      LeftIndexFinger1,
      LeftMiddleFinger3,
      LeftMiddleFinger2,
      LeftMiddleFinger1,
      LeftRingFinger3,
      LeftRingFinger2,
      LeftRingFinger1,
      LeftLittleFinger3,
      LeftLittleFinger2,
      LeftLittleFinger1,
      LeftLeg,
      LeftKnee,
      LeftAnkle,

      RightShoulder,
      RightArm,
      RightElbow,
      RightWrist,
      RightThumb2,
      RightThumb1,
      RightThumb0,
      RightIndexFinger3,
      RightIndexFinger2,
      RightIndexFinger1,
      RightMiddleFinger3,
      RightMiddleFinger2,
      RightMiddleFinger1,
      RightRingFinger3,
      RightRingFinger2,
      RightRingFinger1,
      RightLittleFinger3,
      RightLittleFinger2,
      RightLittleFinger1,
      RightLeg,
      RightKnee,
      RightAnkle,
    };
    this.modelBones = modelBones;
    const armature = _findArmature(Hips);

    const _getEyePosition = () => {
      if (EyeL && EyeR) {
        return EyeL.getWorldPosition(new THREE.Vector3())
          .add(EyeR.getWorldPosition(new THREE.Vector3()))
          .divideScalar(2);
      } else {
        const neckToHeadDiff = Head.getWorldPosition(new THREE.Vector3()).sub(Neck.getWorldPosition(new THREE.Vector3()));
        if (neckToHeadDiff.z < 0) {
          neckToHeadDiff.z *= -1;
        }
        return Head.getWorldPosition(new THREE.Vector3()).add(neckToHeadDiff);
      }
    };

    const leftArmDirection = LeftWrist.getWorldPosition(new THREE.Vector3()).sub(Head.getWorldPosition(new THREE.Vector3()));
    const flipZ = leftArmDirection.x < 0; // eyeDirection.z < 0;
    const armatureDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(armature.quaternion);
    const flipY = armatureDirection.z < -0.5;
    const legDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(LeftLeg.getWorldQuaternion(new THREE.Quaternion()).premultiply(armature.quaternion.clone().invert()));
    const flipLeg = legDirection.y < 0.5;

    this.flipZ = flipZ;
    this.flipY = flipY;
    this.flipLeg = flipLeg;
    
    this.buttOffset = (() => {
      const eyesPosition = this.modelBones.EyeL.getWorldPosition(new THREE.Vector3())
        .add(this.modelBones.EyeR.getWorldPosition(new THREE.Vector3()))
        .divideScalar(2);
      const legsPosition = this.modelBones.LeftAnkle.getWorldPosition(new THREE.Vector3())
        .add(this.modelBones.RightAnkle.getWorldPosition(new THREE.Vector3()))
        .divideScalar(2);
      const distance = eyesPosition.distanceTo(legsPosition);
      return new THREE.Vector3(0, distance, 0);
    })();

    const armatureQuaternion = armature.quaternion.clone();
    const armatureMatrixInverse = armature.matrixWorld.clone().invert();
    armature.position.set(0, 0, 0);
    armature.quaternion.set(0, 0, 0, 1);
    armature.scale.set(1, 1, 1);
    armature.updateMatrix();

    Head.traverse(o => {
      o.savedPosition = o.position.clone();
      o.savedMatrixWorld = o.matrixWorld.clone();
    });

    const allHairBones = [];
    const _recurseAllHairBones = bones => {
      for (let i = 0; i < bones.length; i++) {
        const bone = bones[i];
        if (/hair/i.test(bone.name)) {
          allHairBones.push(bone);
        }
        _recurseAllHairBones(bone.children);
      }
    };
    _recurseAllHairBones(skeleton.bones);
    const hairBones = tailBones.filter(bone => /hair/i.test(bone.name)).map(bone => {
      for (; bone; bone = bone.parent) {
        if (bone.parent === Head) {
          return bone;
        }
      }
      return null;
    }).filter(bone => bone);
    this.allHairBones = allHairBones;
    this.hairBones = hairBones;

    this.springBoneManager = null;
    if (options.hair) {
      const promiseHair = new Promise((resolve, reject) => {
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
        if (!object.parser.json.extensions) {
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
                    z: 0,
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
        }
        resolve();
      });
      promiseHair.then();
    }

    // NeedsNewFunc: Pre-rotate
    const preRotations = {};
    const _ensurePrerotation = k => {
      const boneName = modelBones[k].name;
      if (!preRotations[boneName]) {
        preRotations[boneName] = new THREE.Quaternion();
      }
      return preRotations[boneName];
    };
    if (flipY) {
      _ensurePrerotation('Hips').premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
    }
    if (flipZ) {
      _ensurePrerotation('Hips').premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    }
    if (flipLeg) {
      ['LeftLeg', 'RightLeg'].forEach(k => {
        _ensurePrerotation(k).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
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
    _recurseBoneAttachments(modelBones.Hips);

    const qrArm = flipZ ? LeftArm : RightArm;
    const qrElbow = flipZ ? LeftElbow : RightElbow;
    const qrWrist = flipZ ? LeftWrist : RightWrist;
    const qr = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2)
      .premultiply(
        new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          qrElbow.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse)
            .sub(qrArm.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse))
            .applyQuaternion(armatureQuaternion),
          new THREE.Vector3(0, 1, 0),
        )),
      );
    const qr2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2)
      .premultiply(
        new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          qrWrist.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse)
            .sub(qrElbow.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse))
            .applyQuaternion(armatureQuaternion),
          new THREE.Vector3(0, 1, 0),
        )),
      );
    const qlArm = flipZ ? RightArm : LeftArm;
    const qlElbow = flipZ ? RightElbow : LeftElbow;
    const qlWrist = flipZ ? RightWrist : LeftWrist;
    const ql = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
      .premultiply(
        new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          qlElbow.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse)
            .sub(qlArm.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse))
            .applyQuaternion(armatureQuaternion),
          new THREE.Vector3(0, 1, 0),
        )),
      );
    const ql2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
      .premultiply(
        new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          qlWrist.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse)
            .sub(qlElbow.getWorldPosition(new THREE.Vector3()).applyMatrix4(armatureMatrixInverse))
            .applyQuaternion(armatureQuaternion),
          new THREE.Vector3(0, 1, 0),
        )),
      );

    _ensurePrerotation('RightArm').multiply(qr.clone().invert());
    _ensurePrerotation('RightElbow').multiply(qr.clone()).premultiply(qr2.clone().invert());
    _ensurePrerotation('LeftArm').multiply(ql.clone().invert());
    _ensurePrerotation('LeftElbow').multiply(ql.clone()).premultiply(ql2.clone().invert());
    _ensurePrerotation('LeftLeg').premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
    _ensurePrerotation('RightLeg').premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));

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
      modelBones.Hips.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
    }
    if (flipZ) {
      modelBones.Hips.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    }
    modelBones.RightArm.quaternion.premultiply(qr.clone().invert());
    modelBones.RightElbow.quaternion.premultiply(qr).premultiply(qr2.clone().invert());
    modelBones.LeftArm.quaternion.premultiply(ql.clone().invert());
    modelBones.LeftElbow.quaternion.premultiply(ql).premultiply(ql2.clone().invert());
    model.updateMatrixWorld(true);
    // End prerotate

    Hips.traverse(bone => {
      if (bone.isBone) {
        bone.initialQuaternion = bone.quaternion.clone();
      }
    });

    const _averagePoint = points => {
      const result = new THREE.Vector3();
      for (let i = 0; i < points.length; i++) {
        result.add(points[i]);
      }
      result.divideScalar(points.length);
      return result;
    };
    const eyePosition = _getEyePosition();

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

    const _getOffset = (bone, parent = bone.parent) => bone.getWorldPosition(new THREE.Vector3()).sub(parent.getWorldPosition(new THREE.Vector3()));
    this.initializeBonePositions({
      spine: _getOffset(modelBones.Spine),
      chest: _getOffset(modelBones.Chest, modelBones.Spine),
      neck: _getOffset(modelBones.Neck),
      head: _getOffset(modelBones.Head),
      eyes: eyePosition.clone().sub(Head.getWorldPosition(new THREE.Vector3())),

      leftShoulder: _getOffset(modelBones.RightShoulder),
      leftUpperArm: _getOffset(modelBones.RightArm),
      leftLowerArm: _getOffset(modelBones.RightElbow),
      leftHand: _getOffset(modelBones.LeftWrist),
      leftThumb2: _getOffset(modelBones.RightThumb2),
      leftThumb1: _getOffset(modelBones.RightThumb1),
      leftThumb0: _getOffset(modelBones.RightThumb0),
      leftIndexFinger1: _getOffset(modelBones.RightIndexFinger1),
      leftIndexFinger2: _getOffset(modelBones.RightIndexFinger2),
      leftIndexFinger3: _getOffset(modelBones.RightIndexFinger3),
      leftMiddleFinger1: _getOffset(modelBones.RightMiddleFinger1),
      leftMiddleFinger2: _getOffset(modelBones.RightMiddleFinger2),
      leftMiddleFinger3: _getOffset(modelBones.RightMiddleFinger3),
      leftRingFinger1: _getOffset(modelBones.RightRingFinger1),
      leftRingFinger2: _getOffset(modelBones.RightRingFinger2),
      leftRingFinger3: _getOffset(modelBones.RightRingFinger3),
      leftLittleFinger1: _getOffset(modelBones.RightLittleFinger1),
      leftLittleFinger2: _getOffset(modelBones.RightLittleFinger2),
      leftLittleFinger3: _getOffset(modelBones.RightLittleFinger3),

      rightShoulder: _getOffset(modelBones.LeftShoulder),
      rightUpperArm: _getOffset(modelBones.LeftArm),
      rightLowerArm: _getOffset(modelBones.LeftElbow),
      rightHand: _getOffset(modelBones.RightWrist),
      rightThumb2: _getOffset(modelBones.LeftThumb2),
      rightThumb1: _getOffset(modelBones.LeftThumb1),
      rightThumb0: _getOffset(modelBones.LeftThumb0),
      rightIndexFinger1: _getOffset(modelBones.LeftIndexFinger1),
      rightIndexFinger2: _getOffset(modelBones.LeftIndexFinger2),
      rightIndexFinger3: _getOffset(modelBones.LeftIndexFinger3),
      rightMiddleFinger1: _getOffset(modelBones.LeftMiddleFinger1),
      rightMiddleFinger2: _getOffset(modelBones.LeftMiddleFinger2),
      rightMiddleFinger3: _getOffset(modelBones.LeftMiddleFinger3),
      rightRingFinger1: _getOffset(modelBones.LeftRingFinger1),
      rightRingFinger2: _getOffset(modelBones.LeftRingFinger2),
      rightRingFinger3: _getOffset(modelBones.LeftRingFinger3),
      rightLittleFinger1: _getOffset(modelBones.LeftLittleFinger1),
      rightLittleFinger2: _getOffset(modelBones.LeftLittleFinger2),
      rightLittleFinger3: _getOffset(modelBones.LeftLittleFinger3),

      leftUpperLeg: _getOffset(modelBones.RightLeg),
      leftLowerLeg: _getOffset(modelBones.RightKnee),
      leftFoot: _getOffset(modelBones.RightAnkle),

      rightUpperLeg: _getOffset(modelBones.LeftLeg),
      rightLowerLeg: _getOffset(modelBones.LeftKnee),
      rightFoot: _getOffset(modelBones.LeftAnkle),
    });

    this.height = eyePosition.clone().sub(_averagePoint([modelBones.LeftAnkle.getWorldPosition(new THREE.Vector3()), modelBones.RightAnkle.getWorldPosition(new THREE.Vector3())])).y;
    this.shoulderWidth = modelBones.LeftArm.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.RightArm.getWorldPosition(new THREE.Vector3()));
    this.leftArmLength = this.shoulderTransforms.leftArm.armLength;
    this.rightArmLength = this.shoulderTransforms.rightArm.armLength;
    const indexDistance = modelBones.LeftIndexFinger1.getWorldPosition(new THREE.Vector3())
      .distanceTo(modelBones.LeftWrist.getWorldPosition(new THREE.Vector3()));
    const handWidth = modelBones.LeftIndexFinger1.getWorldPosition(new THREE.Vector3())
      .distanceTo(modelBones.LeftLittleFinger1.getWorldPosition(new THREE.Vector3()));
    this.handOffsetLeft = new THREE.Vector3(handWidth * 0.7, -handWidth * 0.75, indexDistance * 0.5);
    this.handOffsetRight = new THREE.Vector3(-handWidth * 0.7, -handWidth * 0.75, indexDistance * 0.5);
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
      hips: _makeInput(),
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
      chest: this.shoulderTransforms.transform,
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
    };
    this.modelBoneOutputs = {
      Hips: this.outputs.hips,
      Spine: this.outputs.spine,
      Chest: this.outputs.chest,
      Neck: this.outputs.neck,
      Head: this.outputs.head,
      EyeL: this.outputs.eyel,
      EyeR: this.outputs.eyer,

      LeftShoulder: this.outputs.rightShoulder,
      LeftArm: this.outputs.rightUpperArm,
      LeftElbow: this.outputs.rightLowerArm,
      LeftWrist: this.outputs.leftHand,
      LeftThumb2: this.outputs.leftThumb2,
      LeftThumb1: this.outputs.leftThumb1,
      LeftThumb0: this.outputs.leftThumb0,
      LeftIndexFinger3: this.outputs.leftIndexFinger3,
      LeftIndexFinger2: this.outputs.leftIndexFinger2,
      LeftIndexFinger1: this.outputs.leftIndexFinger1,
      LeftMiddleFinger3: this.outputs.leftMiddleFinger3,
      LeftMiddleFinger2: this.outputs.leftMiddleFinger2,
      LeftMiddleFinger1: this.outputs.leftMiddleFinger1,
      LeftRingFinger3: this.outputs.leftRingFinger3,
      LeftRingFinger2: this.outputs.leftRingFinger2,
      LeftRingFinger1: this.outputs.leftRingFinger1,
      LeftLittleFinger3: this.outputs.leftLittleFinger3,
      LeftLittleFinger2: this.outputs.leftLittleFinger2,
      LeftLittleFinger1: this.outputs.leftLittleFinger1,
      LeftLeg: this.outputs.rightUpperLeg,
      LeftKnee: this.outputs.rightLowerLeg,
      LeftAnkle: this.outputs.rightFoot,

      RightShoulder: this.outputs.leftShoulder,
      RightArm: this.outputs.leftUpperArm,
      RightElbow: this.outputs.leftLowerArm,
      RightWrist: this.outputs.rightHand,
      RightThumb2: this.outputs.rightThumb2,
      RightThumb1: this.outputs.rightThumb1,
      RightThumb0: this.outputs.rightThumb0,
      RightIndexFinger3: this.outputs.rightIndexFinger3,
      RightIndexFinger2: this.outputs.rightIndexFinger2,
      RightIndexFinger1: this.outputs.rightIndexFinger1,
      RightMiddleFinger3: this.outputs.rightMiddleFinger3,
      RightMiddleFinger2: this.outputs.rightMiddleFinger2,
      RightMiddleFinger1: this.outputs.rightMiddleFinger1,
      RightRingFinger3: this.outputs.rightRingFinger3,
      RightRingFinger2: this.outputs.rightRingFinger2,
      RightRingFinger1: this.outputs.rightRingFinger1,
      RightLittleFinger3: this.outputs.rightLittleFinger3,
      RightLittleFinger2: this.outputs.rightLittleFinger2,
      RightLittleFinger1: this.outputs.rightLittleFinger1,
      RightLeg: this.outputs.leftUpperLeg,
      RightKnee: this.outputs.leftLowerLeg,
      RightAnkle: this.outputs.leftFoot,
    };

    if (this.options.visemes) {
      const blendShapeGroups = object?.userData?.gltfExtensions?.VRM?.blendShapeMaster.blendShapeGroups || [];
      // ["Neutral", "A", "I", "U", "E", "O", "Blink", "Blink_L", "Blink_R", "Angry", "Fun", "Joy", "Sorrow", "Surprised"]
      this.skinnedMeshesVisemeMappings = this.skinnedMeshes.map(o => {
        const {morphTargetDictionary, morphTargetInfluences} = o;
        if (morphTargetDictionary && morphTargetInfluences) {
          const result = blendShapeGroups.map(blendShapeGroup => {
            const name = blendShapeGroup.name.toLowerCase();
            let index = blendShapeGroup.binds?.[0]?.index;
            if (typeof index !== 'number') {
              index = -1;
            }
            return {
              name,
              index,
            };
          });
          result.morphTargetInfluences = morphTargetInfluences;
          for (const visemeMapping of result) {
            result[visemeMapping.name] = visemeMapping.index;
          }
          return result;
        } else {
          return null;
        }
      }).filter(m => !!m);
    } else {
      this.skinnedMeshesVisemeMappings = [];
    }
    this.activeVisemes = [];
    this.activePoses = [];

    this.microphoneWorker = null;
    this.volume = 0;
    this.setMicrophoneMediaStream(options.microphoneMediaStream, {
      muted: options.muted,
    });

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

    // from Avaer: animation mappings defines which bones are sourced from animations at all, and under which conditions (it is top half of body or not)
    this.animationMappings = [
      new AnimationMapping('Hips.quaternion', this.outputs.hips.quaternion, false),
      new AnimationMapping('Spine.quaternion', this.outputs.spine.quaternion, true),
      // new AnimationMapping('Spine1.quaternion', null, true),
      new AnimationMapping('Spine2.quaternion', this.outputs.chest.quaternion, true),
      new AnimationMapping('Neck.quaternion', this.outputs.neck.quaternion, true),
      new AnimationMapping('Head.quaternion', this.outputs.head.quaternion, true),

      new AnimationMapping('LeftShoulder.quaternion', this.outputs.rightShoulder.quaternion, true),
      new AnimationMapping('LeftArm.quaternion', this.outputs.rightUpperArm.quaternion, true),
      new AnimationMapping('LeftForeArm.quaternion', this.outputs.rightLowerArm.quaternion, true),
      new AnimationMapping('LeftHand.quaternion', this.outputs.leftHand.quaternion, true),

      new AnimationMapping('LeftHandMiddle1.quaternion', this.outputs.leftMiddleFinger1.quaternion, true),
      new AnimationMapping('LeftHandMiddle2.quaternion', this.outputs.leftMiddleFinger2.quaternion, true),
      new AnimationMapping('LeftHandMiddle3.quaternion', this.outputs.leftMiddleFinger3.quaternion, true),
      new AnimationMapping('LeftHandThumb1.quaternion', this.outputs.leftThumb0.quaternion, true),
      new AnimationMapping('LeftHandThumb2.quaternion', this.outputs.leftThumb1.quaternion, true),
      new AnimationMapping('LeftHandThumb3.quaternion', this.outputs.leftThumb2.quaternion, true),
      new AnimationMapping('LeftHandIndex1.quaternion', this.outputs.leftIndexFinger1.quaternion, true),
      new AnimationMapping('LeftHandIndex2.quaternion', this.outputs.leftIndexFinger2.quaternion, true),
      new AnimationMapping('LeftHandIndex3.quaternion', this.outputs.leftIndexFinger3.quaternion, true),
      new AnimationMapping('LeftHandRing1.quaternion', this.outputs.leftRingFinger1.quaternion, true),
      new AnimationMapping('LeftHandRing2.quaternion', this.outputs.leftRingFinger2.quaternion, true),
      new AnimationMapping('LeftHandRing3.quaternion', this.outputs.leftRingFinger3.quaternion, true),
      new AnimationMapping('LeftHandPinky1.quaternion', this.outputs.leftLittleFinger1.quaternion, true),
      new AnimationMapping('LeftHandPinky2.quaternion', this.outputs.leftLittleFinger2.quaternion, true),
      new AnimationMapping('LeftHandPinky3.quaternion', this.outputs.leftLittleFinger3.quaternion, true),

      new AnimationMapping('RightShoulder.quaternion', this.outputs.leftShoulder.quaternion, true),
      new AnimationMapping('RightArm.quaternion', this.outputs.leftUpperArm.quaternion, true),
      new AnimationMapping('RightForeArm.quaternion', this.outputs.leftLowerArm.quaternion, true),
      new AnimationMapping('RightHand.quaternion', this.outputs.rightHand.quaternion, true),

      new AnimationMapping('RightHandMiddle1.quaternion', this.outputs.rightMiddleFinger1.quaternion, true),
      new AnimationMapping('RightHandMiddle2.quaternion', this.outputs.rightMiddleFinger2.quaternion, true),
      new AnimationMapping('RightHandMiddle3.quaternion', this.outputs.rightMiddleFinger3.quaternion, true),
      new AnimationMapping('RightHandThumb1.quaternion', this.outputs.rightThumb0.quaternion, true),
      new AnimationMapping('RightHandThumb2.quaternion', this.outputs.rightThumb1.quaternion, true),
      new AnimationMapping('RightHandThumb3.quaternion', this.outputs.rightThumb2.quaternion, true),
      new AnimationMapping('RightHandIndex1.quaternion', this.outputs.rightIndexFinger1.quaternion, true),
      new AnimationMapping('RightHandIndex2.quaternion', this.outputs.rightIndexFinger2.quaternion, true),
      new AnimationMapping('RightHandIndex3.quaternion', this.outputs.rightIndexFinger3.quaternion, true),
      new AnimationMapping('RightHandRing1.quaternion', this.outputs.rightRingFinger1.quaternion, true),
      new AnimationMapping('RightHandRing2.quaternion', this.outputs.rightRingFinger2.quaternion, true),
      new AnimationMapping('RightHandRing3.quaternion', this.outputs.rightRingFinger3.quaternion, true),
      new AnimationMapping('RightHandPinky1.quaternion', this.outputs.rightLittleFinger1.quaternion, true),
      new AnimationMapping('RightHandPinky2.quaternion', this.outputs.rightLittleFinger2.quaternion, true),
      new AnimationMapping('RightHandPinky3.quaternion', this.outputs.rightLittleFinger3.quaternion, true),

      new AnimationMapping('RightUpLeg.quaternion', this.outputs.leftUpperLeg.quaternion, false),
      new AnimationMapping('RightLeg.quaternion', this.outputs.leftLowerLeg.quaternion, false),
      new AnimationMapping('RightFoot.quaternion', this.outputs.leftFoot.quaternion, false),
      // new AnimationMapping('RightToeBase.quaternion', null, false),

      new AnimationMapping('LeftUpLeg.quaternion', this.outputs.rightUpperLeg.quaternion, false),
      new AnimationMapping('LeftLeg.quaternion', this.outputs.rightLowerLeg.quaternion, false),
      new AnimationMapping('LeftFoot.quaternion', this.outputs.rightFoot.quaternion, false),
      // new AnimationMapping('LeftToeBase.quaternion', null, false),
    ];

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
    this.danceState = false;
    this.danceTime = 0;
    this.danceAnimation = null;
    this.throwState = null;
    this.throwTime = 0;
    this.crouchState = false;
    this.crouchTime = 0;
    this.sitTarget = new THREE.Object3D();
    this.eyeTarget = new THREE.Vector3();
    this.eyeTargetEnabled = false;
    this.headTarget = new THREE.Quaternion();
    this.headTargetEnabled = false;

    this.windTarget = new THREE.Vector3();
    this.windTargetEnabled = false;
  }

  getIkEnabled() {
    return this.ikEnabled;
  }

  setIkEnabled(ikEnabled) {
    this.ikEnabled = ikEnabled;
  }

  initializeBonePositions(setups) {
    this.shoulderTransforms.spine.position.copy(setups.spine);
    this.shoulderTransforms.transform.position.copy(setups.chest);
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

  getAimed() {
    return this.shoulderTransforms.aimed;
  }
  
  setAimed(aimed) {
    this.shoulderTransforms.aimed = aimed;
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

  _applyAnimation(now) {

    //console.log(this.inputs.hmd.quaternion)
    // const standKey = this.crouchState ? 'stand' : 'crouch';
    // const otherStandKey = standKey === 'stand' ? 'crouch' : 'stand';
    let standKey, otherStandKey;
    if (!this.sitState) {
      if (this.crouchState) {
        standKey = 'stand';
        otherStandKey = 'crouch';
      } else {
        standKey = 'crouch';
        otherStandKey = 'stand';
      }
    } else {
      standKey = 'hoverboard';
      otherStandKey = 'hoverboard';
    }
    
    const crouchFactor = Math.min(Math.max(this.crouchTime, 0), crouchMaxTime) / crouchMaxTime;
    const _selectAnimations = (v, standKey) => {
      const candidateAnimations = animations.filter(a => a.isSkateboarding === this.sitState);
      const selectedAnimations = candidateAnimations.sort((a, b) => {
        const targetPosition1 = animationsSelectMap[standKey][a.name] || infinityUpVector;
        const distance1 = targetPosition1.distanceTo(v);

        const targetPosition2 = animationsSelectMap[standKey][b.name] || infinityUpVector;
        const distance2 = targetPosition2.distanceTo(v);

        return distance1 - distance2;
      }).slice(0, 2);
      // from Avaer: selecting animations for 4-way blend (can be 8-way in the future)
      if (!this.sitState) {
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
      }
      return selectedAnimations;
    };
    const selectedAnimations = _selectAnimations(this.velocity, standKey);
    const selectedOtherAnimations = _selectAnimations(this.velocity, otherStandKey);

    const pitchAnimation = animations.find(a => a.isPitch);
    const yawAnimation = animations.find(a => a.isYaw);
    let x = 0;
    let y = 0;
    if (this.getAimed()) {
      /* const directionQuaternion = localQuaternion2.setFromUnitVectors(
        localVector.set(0, 0, -1),
        localVector2.copy(this.direction).normalize()
      ); */
      {
        const hmdEuler = localEuler.setFromQuaternion(this.inputs.hmd.getWorldQuaternion(localQuaternion3), 'YXZ');
        hmdEuler.y = 0;
        hmdEuler.z = 0;
        localQuaternion2.setFromEuler(hmdEuler);
        const rightGamepadEuler = localEuler2.setFromQuaternion(this.inputs.hips.getWorldQuaternion(localQuaternion3), 'YXZ');
        // console.log('got euler', localQuaternion3.toArray().join(' '));
        rightGamepadEuler.y = 0;
        rightGamepadEuler.z = 0;
        localQuaternion3.setFromEuler(rightGamepadEuler);
        y = rightGamepadEuler.x - hmdEuler.x;
        y /= Math.PI;
        y += 0.5;
      }
      {
        const hmdEuler = localEuler.setFromQuaternion(this.inputs.hmd.getWorldQuaternion(localQuaternion3), 'YXZ');
        hmdEuler.x = 0;
        hmdEuler.z = 0;
        localQuaternion2.setFromEuler(hmdEuler);
        const rightGamepadEuler = localEuler2.setFromQuaternion(this.inputs.hips.getWorldQuaternion(localQuaternion3), 'YXZ');
        rightGamepadEuler.x = 0;
        rightGamepadEuler.z = 0;
        localQuaternion3.setFromEuler(rightGamepadEuler);
        x = rightGamepadEuler.y - hmdEuler.y;
        x /= Math.PI;
        x += 1;
        while (x < -2) {
          x += 2;
        }
        while (x > 2) {
          x -= 2;
        }
        x -= 0.5;
        x = Math.min(Math.max(x, 0), 1);
        x = 1 - x;
      }
    }
    
    // console.log('got blend', this.sitState, this.getAimed());

    /* if (this.getAimed()) {
      console.log('pitch yaw', x, y);
    } */

    for (const spec of this.animationMappings) {
      const {
        quaternionKey: k,
        quaternion: dst,
        isTop,
      } = spec;
      if (dst) {
        // top override
        if (this.jumpState) {
          const t2 = this.jumpTime / 1000 * 0.6 + 0.7;
          const src2 = jumpAnimation.interpolants[k];
          const v2 = src2.evaluate(t2);

          dst.fromArray(v2);
        /* } else if (this.sitState) {
          const sitAnimation = sitAnimations[this.sitAnimation || defaultSitAnimation];
          const src2 = sitAnimation.interpolants[k];
          const v2 = src2.evaluate(1);

          dst.fromArray(v2); */
        } else if (this.danceState) {
          const danceAnimation = danceAnimations[this.danceAnimation || defaultDanceAnimation];
          const src2 = danceAnimation.interpolants[k];
          const t2 = (this.danceTime / 1000) % danceAnimation.duration;
          const v2 = src2.evaluate(t2);

          dst.fromArray(v2);
        } else if (this.throwState) {
          const throwAnimation = throwAnimations[this.throwAnimation || defaultThrowAnimation];
          const src2 = throwAnimation.interpolants[k];
          const t2 = this.throwTime / 1000;
          const v2 = src2.evaluate(t2);

          dst.fromArray(v2);
        } else if (this.useTime >= 0 && isTop) { // from Avaer: checking whether an animation should be blended based on the above declarations
          const useAnimation = useAnimations[this.useAnimation || defaultUseAnimation];
          const t2 = (this.useTime / useAnimationRate) % useAnimation.duration;
          const src2 = useAnimation.interpolants[k];
          const v2 = src2.evaluate(t2);

          dst.fromArray(v2);
        } else if (this.sitState || this.getAimed()) {
          const _getTopBlend = target => {
            /* const y = this.inputs.hmd.getWorldQuaternion(localQuaternion2)
              .angleTo(this.inputs.leftGamepad.quaternion.getWorldQuaternion(localQuaternion3));
            const x = this.inputs.hmd.getWorldQuaternion(localQuaternion2)
              .angleTo(this.inputs.rightGamepad.quaternion.getWorldQuaternion(localQuaternion3)); */

            const src1 = pitchAnimation.interpolants[k];
            const v1 = src1.evaluate(y);

            const src2 = yawAnimation.interpolants[k];
            const v2 = src2.evaluate(x);

            target.fromArray(v1); // this is pitch
            // target.fromArray(v2); // this is yaw
            // .premultiply(localQuaternion2.fromArray(v2));
          };
          // from Avaer: blending the animations that we selected for the 4-way blend, in the last line
          const _getBottomBlend = (selectedAnimations, target) => {
            const nonIdleAnimation = selectedAnimations[0].isIdle ? selectedAnimations[1] : selectedAnimations[0];
            const idleAnimation = selectedAnimations[0].isIdle ? selectedAnimations[0] : selectedAnimations[1];
            const normalizedDirection = this.direction.length() > 1 ? localVector2.copy(this.direction).normalize() : this.direction;
            const distance1 = Math.min(Math.max(1 - animationsDistanceMap[nonIdleAnimation.name].distanceTo(normalizedDirection), 0), 1);
            const distance2 = 1 - distance1; // Math.min(animationsDistanceMap[selectedAnimations[1].name].distanceTo(this.direction), 1);
            // const totalDistance = distance1 + distance2;
            // const distanceFactor = 1 - distance2 / totalDistance;

            // const t1 = (now / 1000) % selectedAnimations[0].duration;
            const src1 = nonIdleAnimation.interpolants[k];
            const v1 = src1.evaluate(distance1);

            // const t2 = (now / 1000) % selectedAnimations[1].duration;
            // const src2 = idleAnimation.interpolants[k];
            // const v2 = src2.evaluate(distance2);

            target.fromArray(v1);
          };
          const _getHorizontalBlend = (selectedAnimations, target) => {
            const distance1 = animationsDistanceMap[selectedAnimations[0].name].distanceTo(this.direction);
            const distance2 = animationsDistanceMap[selectedAnimations[1].name].distanceTo(this.direction);
            const totalDistance = distance1 + distance2;

            const t1 = (now / 1000) % selectedAnimations[0].duration;
            const src1 = selectedAnimations[0].interpolants[k];
            const v1 = src1.evaluate(t1);

            const t2 = (now / 1000) % selectedAnimations[1].duration;
            const src2 = selectedAnimations[1].interpolants[k];
            const v2 = src2.evaluate(t2);

            target.fromArray(v1);
            if (selectedAnimations[0].direction !== selectedAnimations[1].direction) {
              // from Avaer: literally blending animation quaternions (spherical linear interpolation, slerp)
              const distanceFactor = 1 - distance2 / totalDistance;
              target.slerp(localQuaternion.fromArray(v2), distanceFactor);
            }
          };
          if (isTop) {
            _getTopBlend(dst);
          } else {
            // _getBottomBlend(selectedAnimations, dst);

            _getHorizontalBlend(selectedAnimations, localQuaternion2);
            _getHorizontalBlend(selectedOtherAnimations, localQuaternion3);
            dst.copy(localQuaternion2).slerp(localQuaternion3, crouchFactor);
          }
          // dst.copy(localQuaternion2).slerp(localQuaternion3, crouchFactor);
        } else {
          // from Avaer: blending the animations that we selected for the 4-way blend, in the last line
          const _getHorizontalBlend = (selectedAnimations, target) => {
            const distance1 = animationsDistanceMap[selectedAnimations[0].name].distanceTo(this.direction);
            const distance2 = animationsDistanceMap[selectedAnimations[1].name].distanceTo(this.direction);
            const totalDistance = distance1 + distance2;

            const t1 = (now / 1000) % selectedAnimations[0].duration;
            const src1 = selectedAnimations[0].interpolants[k];
            const v1 = src1.evaluate(t1);

            const t2 = (now / 1000) % selectedAnimations[1].duration;
            const src2 = selectedAnimations[1].interpolants[k];
            const v2 = src2.evaluate(t2);

            target.fromArray(v1);
            if (selectedAnimations[0].direction !== selectedAnimations[1].direction) {
              // from Avaer: literally blending animation quaternions (spherical linear interpolation, slerp)
              const distanceFactor = 1 - distance2 / totalDistance;
              target.slerp(localQuaternion.fromArray(v2), distanceFactor);
            }
          };
          _getHorizontalBlend(selectedAnimations, localQuaternion2);
          _getHorizontalBlend(selectedOtherAnimations, localQuaternion3);
          dst.copy(localQuaternion2).slerp(localQuaternion3, crouchFactor);
        }
        // blend
        if (this.flyState || (this.flyTime >= 0 && this.flyTime < 1000)) {
          const t2 = this.flyTime / 1000;
          const f = this.flyState ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));
          const src2 = floatAnimation.interpolants[k];
          const v2 = src2.evaluate(t2 % floatAnimation.duration);

          dst.slerp(localQuaternion.fromArray(v2), f);
        }
      }
    }
  }

  _applyPose() {
    if (poseData && (poseIndex !== -1 || this.activePoses.length > 0)) {
      for (const k in this.outputs) {
        this.outputs[k].quaternion.set(0, 0, 0, 1);
      }

      this.outputs.leftUpperArm.quaternion.setFromAxisAngle(forwardVector, Math.PI * 0.25);
      this.outputs.rightUpperArm.quaternion.setFromAxisAngle(forwardVector, -Math.PI * 0.25);

      if (poseIndex !== -1) {
        for (const bone of poseData[poseIndex].bones) {
          if (bone.mappedName) {
            this.outputs[bone.mappedName].quaternion.premultiply(bone.quaternion);
          }
        }
      }

      for (const activePose of this.activePoses) {
        const {index: poseIndex, value} = activePose;
        for (const bone of poseData[poseIndex].bones) {
          if (bone.mappedName) {
            localQuaternion.copy(this.outputs[bone.mappedName].quaternion);
            localQuaternion2.copy(this.outputs[bone.mappedName].quaternion).premultiply(bone.quaternion);
            this.outputs[bone.mappedName].quaternion.copy(localQuaternion).slerp(localQuaternion2, value);
          }
        }
      }
    }
    if (this.headTargetEnabled) {
      this.outputs.neck.quaternion.premultiply(this.headTarget);
    }
  }

  _applyIk() {
    if (this.getIkEnabled()) {
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
    } else {

      localVector.copy(this.inputs.hmd.position)
                 .add(this.eyeToHipsOffset)
                 .sub(this.outputs.hips.position)

      // position
      this.outputs.hips.position.x = this.outputs.hips.position.x + localVector.x*0.3
      this.outputs.hips.position.y = this.outputs.hips.position.y + localVector.y*0.3
      this.outputs.hips.position.z = this.outputs.hips.position.z + localVector.z*0.3

      // rotation
      // firstperson
      if (this.getTopEnabled()){
        localEuler.setFromQuaternion(this.inputs.hmd.quaternion, 'YXZ')
        this._rot_y = localEuler.y - Math.PI
        this.outputs.hips.quaternion.setFromEuler(localEuler2)
      }else{
        // thirdperson
        const distance = localVector.x*localVector.x + localVector.z*localVector.z
        if (distance>0.001){
          let angle = Math.PI/2 - Math.atan2(localVector.z, localVector.x) 
          if (angle < 0) { 
            angle = angle + 2*Math.PI 
          }
          let delta = angle - this._rot_y
          if (Math.abs(delta)>Math.PI){
            if (this._rot_y<angle){
              this._rot_y = this._rot_y + 2*Math.PI
            }else{
              this._rot_y = this._rot_y - 2*Math.PI
            }
            delta = angle - Math.PI - this._rot_y
          }
          this._rot_y = this._rot_y + delta*0.1
        }
      }

      localEuler2.x = 0
      localEuler2.y = this._rot_y 
      localEuler2.z = 0
      this.outputs.hips.quaternion.setFromEuler(localEuler2)
    }
  }

  _applyWind() {
    if (this.windTargetEnabled && this.springBoneManager) {
      for (const springBoneGroup of this.springBoneManager.springBoneGroupList) {
        for (const bone of springBoneGroup) {
          bone.gravityDir.copy(this.windTarget);
          bone.gravityPower =
            Math.sin((Date.now() % 100) / 100 * Math.PI) * 1 +
            Math.cos((Date.now() % 20) / 20 * Math.PI) * 1 +
            Math.sin((Date.now() % 5) / 5 * Math.PI) * 1;
        }
      }
    }
  }

  _fixIKProblems(k, modelBone) {
    if (this.getTopEnabled()) {
      if (k === 'LeftWrist') {
        if (this.getHandEnabled(1)) {
          modelBone.quaternion.multiply(leftRotation); // center
        }
      } else if (k === 'RightWrist') {
        if (this.getHandEnabled(0)) {
          modelBone.quaternion.multiply(rightRotation); // center
        }
      }
    }
    if (this.getBottomEnabled()) {
      if (k === 'LeftAnkle' || k === 'RightAnkle') {
        modelBone.quaternion.multiply(upRotation);
      }
    }
  }

  _animateVisemes(now) {
    const aValue = Math.min(this.volume * 10, 1);
    const blinkValue = (() => {
      const nowWindow = now % 2000;
      if (nowWindow >= 0 && nowWindow < 100) {
        return nowWindow / 100;
      } else if (nowWindow >= 100 && nowWindow < 200) {
        return 1 - (nowWindow - 100) / 100;
      } else {
        return 0;
      }
    })();
    for (const visemeMapping of this.skinnedMeshesVisemeMappings) {
      // initialize
      const {morphTargetInfluences} = visemeMapping;
      for (let i = 0; i < morphTargetInfluences.length; i++) {
        morphTargetInfluences[i] = 0;
      }

      // ik
      if (visemeMapping.a >= 0) {
        morphTargetInfluences[visemeMapping.a] = aValue;
      }
      if (visemeMapping.blink_l >= 0) {
        morphTargetInfluences[visemeMapping.blink_l] = blinkValue;
      }
      if (visemeMapping.blink_r >= 0) {
        morphTargetInfluences[visemeMapping.blink_r] = blinkValue;
      }

      if (emotionIndex !== -1 && morphTargetInfluences[emotionIndex] !== undefined) {
        morphTargetInfluences[emotionIndex] = 1;
      }

      // ["neutral", "a", "i", "u", "e", "o", "blink", "joy", "angry", "sorrow", "fun", "lookup", "lookdown", "lookleft", "lookright", "blink_l", "blink_r"]
      // animation visemes
      for (const activeViseme of this.activeVisemes) {
        const {index, value} = activeViseme;
        morphTargetInfluences[index] = value;
      }
    }
  }

  _animateFingerBones(left) {
    const fingerBones = left ? this.fingerBoneMap.left : this.fingerBoneMap.right;
    const gamepadInput = left ? this.sdkInputs.leftGamepad : this.sdkInputs.rightGamepad;
    for (const fingerBone of fingerBones) {
      const {bones, finger} = fingerBone;
      let setter;
      if (finger === 'thumb') {
        setter = (q, i) => q.setFromAxisAngle(localVector.set(0, left ? -1 : 1, 0), gamepadInput.grip * Math.PI * (i === 0 ? 0.125 : 0.25));
      } else if (finger === 'index') {
        setter = (q, i) => q.setFromAxisAngle(localVector.set(0, 0, left ? 1 : -1), gamepadInput.pointer * Math.PI * 0.5);
      } else {
        setter = (q, i) => q.setFromAxisAngle(localVector.set(0, 0, left ? 1 : -1), gamepadInput.grip * Math.PI * 0.5);
      }
      for (let i = 0; i < bones.length; i++) {
        setter(bones[i].quaternion, i);
      }
    }
  }

  _animateTop() {
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
      this._animateFingerBones(true);
      this._animateFingerBones(false);
    }
  }

  _animateEyeTarget() {
    for (const eye of [this.modelBones.EyeL, this.modelBones.EyeR]) {
      if (eye) {
        eye.getWorldPosition(localVector);
        eye.parent.getWorldQuaternion(localQuaternion);
        localQuaternion.invert()
          .premultiply(z180Quaternion)
          .multiply(
            localQuaternion2.setFromRotationMatrix(
              localMatrix.lookAt(
                localVector,
                this.eyeTarget,
                localVector2.set(0, 1, 0),
              ),
            ),
          );
        if (/^(?:left|right)eye$/i.test(eye.name)) {
          localEuler.setFromQuaternion(localQuaternion, 'YXZ');
          localEuler.x = -localEuler.x;
          eye.quaternion.setFromEuler(localEuler);
        } else {
          localEuler.setFromQuaternion(localQuaternion, 'YXZ');
          localEuler.x = Math.min(Math.max(-localEuler.x, -Math.PI * 0.05), Math.PI * 0.1);
          localEuler.y = Math.min(Math.max(localEuler.y, -Math.PI * 0.1), Math.PI * 0.1);
          localEuler.z = 0;
          eye.quaternion.setFromEuler(localEuler);
        }
      }
    }
  }

  update(timeDiff) {
    const now = performance.now()

    this._applyAnimation(now);
    this._applyPose();

    if (this.getTopEnabled()) {
      this._animateTop();
    }

    this._applyIk();
    this._applyWind();

    for (const k in this.modelBones) {
      const modelBone = this.modelBones[k];
      if (modelBone) { // broken model
        const modelBoneOutput = this.modelBoneOutputs[k];

        if (/hips|thumb|finger/i.test(k)) {
          modelBone.position.copy(modelBoneOutput.position);
        }

        modelBone.quaternion.multiplyQuaternions(modelBoneOutput.quaternion, modelBone.initialQuaternion);

        // Fix messed up bones if IK is being used
        if (this.getIkEnabled()) {
          this._fixIKProblems(k, modelBone);
        }

        modelBone.updateMatrixWorld();
      }
    }

    if (this.springBoneManager) {
      this.springBoneManager.lateUpdate(timeDiff);
    }

    if (this.options.visemes) {
      this._animateVisemes(now);
    }

    if (this.eyeTargetEnabled) {
      this._animateEyeTarget();
    }

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
      this.volume = 0;
    }
    if (microphoneMediaStream) {
      this.microphoneWorker = new MicrophoneWorker(microphoneMediaStream, options);
      this.microphoneWorker.addEventListener('volume', e => {
        this.volume = this.volume * 0.8 + e.data * 0.2;
      });
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

  copyTo(model) {
    const _recurse = (a, b) => {
      if (a.isBone) {
        b.matrix.copy(a.matrix)
          .decompose(b.position, b.quaternion, b.scale);
      }
      if (a.children) {
        for (let i = 0; i < a.children.length; i++) {
          _recurse(a.children[i], b.children[i]);
        }
      }
    };

    _recurse(this.model, model);
  }

  destroy() {
    this.setMicrophoneMediaStream(null);
  }
}
Avatar.waitForLoad = () => loadPromise;
export default Avatar;
