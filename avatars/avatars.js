import * as THREE from 'three';
import {VRMSpringBoneImporter} from '@pixiv/three-vrm/lib/three-vrm.module.js';
import {fixSkeletonZForward} from './vrarmik/SkeletonUtils.js';
import PoseManager from './vrarmik/PoseManager.js';
import ShoulderTransforms from './vrarmik/ShoulderTransforms.js';
import LegsManager from './vrarmik/LegsManager.js';
import {scene, camera} from '../renderer.js';
import MicrophoneWorker from './microphone-worker.js';
import {AudioRecognizer} from '../audio-recognizer.js';
import {
  // angleDifference,
  // getVelocityDampingFactor,
  getNextPhysicsId,
} from '../util.js';
// import Simplex from '../simplex-noise.js';
import {
  crouchMaxTime,
  // useMaxTime,
  aimMaxTime,
  aimTransitionMaxTime,
  // avatarInterpolationFrameRate,
  // avatarInterpolationTimeDelay,
  // avatarInterpolationNumFrames,
} from '../constants.js';
// import {FixedTimeStep} from '../interpolants.js';
import * as avatarCruncher from '../avatar-cruncher.js';
import * as avatarSpriter from '../avatar-spriter.js';
// import * as sceneCruncher from '../scene-cruncher.js';
import {
  idleFactorSpeed,
  walkFactorSpeed,
  runFactorSpeed,
  // narutoRunTimeFactor,
} from './constants.js';
import {
  getSkinnedMeshes,
  getSkeleton,
  getEyePosition,
  getHeight,
  // makeBoneMap,
  getTailBones,
  getModelBones,
  // cloneModelBones,
  // decorateAnimation,
  // retargetAnimation,
  // animationBoneToModelBone,
} from './util.mjs';
import {easing} from '../math-utils.js';
import metaversefile from 'metaversefile';

import { getFirstPersonCurves, getClosest2AnimationAngles, loadPromise, _findArmature, _getLerpFn, _applyAnimation } from './animationHelpers.js'

import { animationMappingConfig } from './AnimationMapping.js';
import Emoter from './Emoter.js'
import Blinker from './Blinker.js'
import Nodder from './Nodder.js'
import Looker from './Looker.js'

import * as wind from './simulation/wind.js';


const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
// const localVector5 = new THREE.Vector3();
// const localVector6 = new THREE.Vector3();     


const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
// const localQuaternion3 = new THREE.Quaternion();
// const localQuaternion4 = new THREE.Quaternion();
// const localQuaternion5 = new THREE.Quaternion();
// const localQuaternion6 = new THREE.Quaternion();
const localEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const localEuler2 = new THREE.Euler(0, 0, 0, 'YXZ');
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
// const localPlane = new THREE.Plane();   

const textEncoder = new TextEncoder();

// const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const maxIdleVelocity = 0.01;
const maxEyeTargetTime = 2000;

/* VRMSpringBoneImporter.prototype._createSpringBone = (_createSpringBone => {
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
})(VRMSpringBoneImporter.prototype._createSpringBone); */

/* const _makeSimplexes = numSimplexes => {
  const result = Array(numSimplexes);
  for (let i = 0; i < numSimplexes; i++) {
    result[i] = new Simplex(i + '');
  }
  return result;
};
const simplexes = _makeSimplexes(5); */

const upRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5);
// const downRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.5);
const leftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5);
const rightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5);

const upVector = new THREE.Vector3(0, 1, 0);

// const infinityUpVector = new THREE.Vector3(0, Infinity, 0);
import {
  animations,
  animationStepIndices,
} from './animationHelpers.js';

const cubicBezier = easing(0, 1, 0, 1);

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const srcCubeGeometries = {};
const debugMeshMaterial = new THREE.MeshNormalMaterial({
  // color: 0xFF0000,
  transparent: true,
  depthTest: false,
});
const _makeDebugMesh = (avatar) => {
  const baseScale = 0.01;
  const fingerScale = 0.5;
  const _makeCubeMesh = (name, scale = 1) => {
    let srcGeometry = srcCubeGeometries[scale];
    if (!srcGeometry) {
      srcGeometry = cubeGeometry.clone()
        .applyMatrix4(localMatrix.makeScale(scale * baseScale, scale * baseScale, 1))
      srcCubeGeometries[scale] = srcGeometry;
    }
    const geometry = srcGeometry//.clone();
    const object = new THREE.Object3D();
    object.name = name;
    object.physicsId = getNextPhysicsId();
    const mesh = new THREE.Mesh(geometry, debugMeshMaterial);
    object.add(mesh);
    object.mesh = mesh;
    return object;
  };
  const attributes = {
    Root: _makeCubeMesh('Root'),
    Head: _makeCubeMesh('Head'),
    Eye_L: _makeCubeMesh('Eye_L'),
    Eye_R: _makeCubeMesh('Eye_R'),
    Neck: _makeCubeMesh('Neck'),
    UpperChest: _makeCubeMesh('UpperChest'),
    Chest: _makeCubeMesh('Chest'),
    Hips: _makeCubeMesh('Hips'),
    Spine: _makeCubeMesh('Spine'),
    Left_shoulder: _makeCubeMesh('Left_shoulder'),
    Left_wrist: _makeCubeMesh('Left_wrist'),
    Left_thumb2: _makeCubeMesh('Left_thumb2', fingerScale),
    Left_thumb1: _makeCubeMesh('Left_thumb1', fingerScale),
    Left_thumb0: _makeCubeMesh('Left_thumb0', fingerScale),
    Left_indexFinger3: _makeCubeMesh('Left_indexFinger3', fingerScale),
    Left_indexFinger2: _makeCubeMesh('Left_indexFinger2', fingerScale),
    Left_indexFinger1: _makeCubeMesh('Left_indexFinger1', fingerScale),
    Left_middleFinger3: _makeCubeMesh('Left_middleFinger3', fingerScale),
    Left_middleFinger2: _makeCubeMesh('Left_middleFinger2', fingerScale),
    Left_middleFinger1: _makeCubeMesh('Left_middleFinger1', fingerScale),
    Left_ringFinger3: _makeCubeMesh('Left_ringFinger3', fingerScale),
    Left_ringFinger2: _makeCubeMesh('Left_ringFinger2', fingerScale),
    Left_ringFinger1: _makeCubeMesh('Left_ringFinger3', fingerScale),
    Left_littleFinger3: _makeCubeMesh('Left_littleFinger3', fingerScale),
    Left_littleFinger2: _makeCubeMesh('Left_littleFinger2', fingerScale),
    Left_littleFinger1: _makeCubeMesh('Left_littleFinger1', fingerScale),
    Left_elbow: _makeCubeMesh('Left_elbow'),
    Left_arm: _makeCubeMesh('Left_arm'),
    Right_shoulder: _makeCubeMesh('Right_shoulder'),
    Right_wrist: _makeCubeMesh('Right_wrist'),
    Right_thumb2: _makeCubeMesh('Right_thumb2', fingerScale),
    Right_thumb1: _makeCubeMesh('Right_thumb1', fingerScale),
    Right_thumb0: _makeCubeMesh('Right_thumb0', fingerScale),
    Right_indexFinger3: _makeCubeMesh('Right_indexFinger3', fingerScale),
    Right_indexFinger2: _makeCubeMesh('Right_indexFinger2', fingerScale),
    Right_indexFinger1: _makeCubeMesh('Right_indexFinger1', fingerScale),
    Right_middleFinger3: _makeCubeMesh('Right_middleFinger3', fingerScale),
    Right_middleFinger2: _makeCubeMesh('Right_middleFinger2', fingerScale),
    Right_middleFinger1: _makeCubeMesh('Right_middleFinger1', fingerScale),
    Right_ringFinger3: _makeCubeMesh('Right_ringFinger3', fingerScale),
    Right_ringFinger2: _makeCubeMesh('Right_ringFinger2', fingerScale),
    Right_ringFinger1: _makeCubeMesh('Right_ringFinger1', fingerScale),
    Right_littleFinger3: _makeCubeMesh('Right_littleFinger3', fingerScale),
    Right_littleFinger2: _makeCubeMesh('Right_littleFinger2', fingerScale),
    Right_littleFinger1: _makeCubeMesh('Right_littleFinger1', fingerScale),
    Right_elbow: _makeCubeMesh('Right_elbow'),
    Right_arm: _makeCubeMesh('Right_arm'),
    Left_ankle: _makeCubeMesh('Left_ankle'),
    Left_knee: _makeCubeMesh('Left_knee'),
    Left_leg: _makeCubeMesh('Left_leg'),
    Left_toe: _makeCubeMesh('Left_toe'),
    Right_ankle: _makeCubeMesh('Right_ankle'),
    Right_knee: _makeCubeMesh('Right_knee'),
    Right_leg: _makeCubeMesh('Right_leg'),
    Right_toe: _makeCubeMesh('Right_toe'),
  };

  // hips
  attributes.Root.add(attributes.Hips);
  attributes.Hips.add(attributes.Spine);
  attributes.Spine.add(attributes.Chest);
  attributes.Chest.add(attributes.UpperChest);

  // head
  attributes.UpperChest.add(attributes.Neck);
  attributes.Neck.add(attributes.Head);
  attributes.Head.add(attributes.Eye_L);
  attributes.Head.add(attributes.Eye_R);

  // shoulders
  attributes.UpperChest.add(attributes.Left_shoulder);
  attributes.UpperChest.add(attributes.Right_shoulder);

  // arms
  attributes.Left_shoulder.add(attributes.Left_arm);
  attributes.Left_arm.add(attributes.Left_elbow);
  attributes.Left_elbow.add(attributes.Left_wrist);
  attributes.Right_shoulder.add(attributes.Right_arm);
  attributes.Right_arm.add(attributes.Right_elbow);
  attributes.Right_elbow.add(attributes.Right_wrist);

  // hands
  attributes.Left_wrist.add(attributes.Left_thumb0);
  attributes.Left_thumb0.add(attributes.Left_thumb1);
  attributes.Left_thumb1.add(attributes.Left_thumb2);
  attributes.Left_wrist.add(attributes.Left_indexFinger1);
  attributes.Left_indexFinger1.add(attributes.Left_indexFinger2);
  attributes.Left_indexFinger2.add(attributes.Left_indexFinger3);
  attributes.Left_wrist.add(attributes.Left_middleFinger1);
  attributes.Left_middleFinger1.add(attributes.Left_middleFinger2);
  attributes.Left_middleFinger2.add(attributes.Left_middleFinger3);
  attributes.Left_wrist.add(attributes.Left_ringFinger1);
  attributes.Left_ringFinger1.add(attributes.Left_ringFinger2);
  attributes.Left_ringFinger2.add(attributes.Left_ringFinger3);
  attributes.Left_wrist.add(attributes.Left_littleFinger1);
  attributes.Left_littleFinger1.add(attributes.Left_littleFinger2);
  attributes.Left_littleFinger2.add(attributes.Left_littleFinger3);

  attributes.Right_wrist.add(attributes.Right_thumb0);
  attributes.Right_thumb0.add(attributes.Right_thumb1);
  attributes.Right_thumb1.add(attributes.Right_thumb2);
  attributes.Right_wrist.add(attributes.Right_indexFinger1);
  attributes.Right_indexFinger1.add(attributes.Right_indexFinger2);
  attributes.Right_indexFinger2.add(attributes.Right_indexFinger3);
  attributes.Right_wrist.add(attributes.Right_middleFinger1);
  attributes.Right_middleFinger1.add(attributes.Right_middleFinger2);
  attributes.Right_middleFinger2.add(attributes.Right_middleFinger3);
  attributes.Right_wrist.add(attributes.Right_ringFinger1);
  attributes.Right_ringFinger1.add(attributes.Right_ringFinger2);
  attributes.Right_ringFinger2.add(attributes.Right_ringFinger3);
  attributes.Right_wrist.add(attributes.Right_littleFinger1);
  attributes.Right_littleFinger1.add(attributes.Right_littleFinger2);
  attributes.Right_littleFinger2.add(attributes.Right_littleFinger3);

  // legs
  attributes.Hips.add(attributes.Left_leg);
  attributes.Left_leg.add(attributes.Left_knee);
  attributes.Left_knee.add(attributes.Left_ankle);
  attributes.Left_ankle.add(attributes.Left_toe);

  attributes.Hips.add(attributes.Right_leg);
  attributes.Right_leg.add(attributes.Right_knee);
  attributes.Right_knee.add(attributes.Right_ankle);
  attributes.Right_ankle.add(attributes.Right_toe);

  const mesh = attributes.Root;
  const modelBoneToMeshBoneMap = new Map();

  mesh.wrapToAvatar = avatar => {
    avatar.modelBoneOutputs.Root.updateMatrixWorld();

    for (const k in avatar.modelBoneOutputs) {
      const modelBone = avatar.modelBoneOutputs[k];
      const meshBone = attributes[k];
      const l = k !== 'Root' ? modelBone.position.length() : 0;
      meshBone.mesh.scale.z = l;
    }

    const modelBoneOutputsArray = Object.keys(avatar.modelBoneOutputs).map(k => avatar.modelBoneOutputs[k]);
    for (const k in avatar.modelBoneOutputs) {
      const modelBone = avatar.modelBoneOutputs[k];
      const meshBone = attributes[k];

      modelBone.forwardQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        localMatrix.lookAt(
          localVector.set(0, 0, 0),
          modelBone.position,
          localVector2.set(0, 1, 0)
        )
      );
      modelBoneToMeshBoneMap.set(modelBone, meshBone);
    }
  };
  mesh.setFromAvatar = avatar => {
    for (const k in avatar.modelBoneOutputs) {
      const modelBone = avatar.modelBoneOutputs[k];
      const meshBone = modelBoneToMeshBoneMap.get(modelBone);

      (modelBone.parent ?
        modelBone.parent.matrixWorld
      :
        localMatrix.identity()
      ).decompose(localVector, localQuaternion, localVector2);

      localVector.add(
        localVector3.set(0, 0, -meshBone.mesh.scale.z*0.5)
          .applyQuaternion(modelBone.forwardQuaternion)
          .applyQuaternion(localQuaternion)
      );

      localQuaternion.multiply(
        modelBone.forwardQuaternion
      );

      meshBone.matrixWorld.compose(localVector, localQuaternion, localVector2);
      meshBone.matrix.copy(meshBone.matrixWorld);
      if (meshBone.parent) {
        meshBone.matrix.premultiply(localMatrix.copy(meshBone.parent.matrixWorld).invert());
      }
      meshBone.matrix.decompose(meshBone.position, meshBone.quaternion, meshBone.scale);
    }
    mesh.updateMatrixWorld();
  };
  mesh.serializeSkeleton = () => {
    const buffers = [];

    const _recurse = meshBone => {
      const idBuffer = Uint32Array.from([meshBone.physicsId]);
      buffers.push(idBuffer);

      const nameBuffer = textEncoder.encode(meshBone.name);
      const nameBufferLengthBuffer = Uint32Array.from([nameBuffer.length]);
      buffers.push(nameBufferLengthBuffer);
      buffers.push(nameBuffer);

      const transformBuffer = new Float32Array(10);
      meshBone.position.toArray(transformBuffer, 0);
      meshBone.quaternion.toArray(transformBuffer, 3);
      meshBone.scale.toArray(transformBuffer, 7);
      buffers.push(transformBuffer);

      const objectChildren = meshBone.children.filter(child => !child.isMesh);
      const numChildrenBuffer = Uint32Array.from([objectChildren.length]);
      buffers.push(numChildrenBuffer);

      for (const child of objectChildren) {
        _recurse(child);
      }
    };
    _recurse(attributes.Root);

    let totalBufferSize = 0;
    for (const buffer of buffers) {
      totalBufferSize += buffer.byteLength;
    }
    const result = new Uint8Array(totalBufferSize);
    let offset = 0;
    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength), offset);
      offset += buffer.byteLength;
    }
    return result;
  };
  return mesh;
};


// const g = new THREE.BoxBufferGeometry(0.05, 0.05, 0.05);
// const m = new THREE.MeshBasicMaterial({ color: 0xFF00FF });
// const testMesh = new THREE.Mesh(g, m);
// scene.add(testMesh);



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
    this.spriteMegaAvatarMesh = null;
    this.crunchedModel = null;
    this.options = options;

    this.vrmExtension = object?.parser?.json?.extensions?.VRM;
    this.firstPersonCurves = getFirstPersonCurves(this.vrmExtension); 

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
    this.vowels = Float32Array.from([1, 0, 0, 0, 0]);
    this.poseAnimation = null;

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
    /* const hairBones = tailBones.filter(bone => /hair/i.test(bone.name)).map(bone => {
      for (; bone; bone = bone.parent) {
        if (bone.parent === modelBones.Head) {
          return bone;
        }
      }
      return null;
    }).filter(bone => bone);
    // this.allHairBones = allHairBones;
    this.hairBones = hairBones; */
    
    this.eyeTarget = new THREE.Vector3();
    this.eyeTargetInverted = false;
    this.eyeTargetEnabled = false;
    this.eyeballTarget = new THREE.Vector3();
    this.eyeballTargetPlane = new THREE.Plane();
    this.eyeballTargetEnabled = false;

    if (options.hair) {
      this.springBoneManager = new VRMSpringBoneImporter().import(object);
    } else {
      this.springBoneManager = null;
    }
    /* this.springBoneTimeStep = new FixedTimeStep(timeDiff => {
      // console.log('update hairs', new Error().stack);
      const timeDiffS = timeDiff / 1000;
      this.springBoneManager && this.springBoneManager.lateUpdate(timeDiffS);
    }, 10); */

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
      Left_thumb0: this.shoulderTransforms.rightArm.thumb0,
      Left_thumb1: this.shoulderTransforms.rightArm.thumb1,
      Left_thumb2: this.shoulderTransforms.rightArm.thumb2,
      Left_indexFinger1: this.shoulderTransforms.rightArm.indexFinger1,
      Left_indexFinger2: this.shoulderTransforms.rightArm.indexFinger2,
      Left_indexFinger3: this.shoulderTransforms.rightArm.indexFinger3,
      Left_middleFinger1: this.shoulderTransforms.rightArm.middleFinger1,
      Left_middleFinger2: this.shoulderTransforms.rightArm.middleFinger2,
      Left_middleFinger3: this.shoulderTransforms.rightArm.middleFinger3,
      Left_ringFinger1: this.shoulderTransforms.rightArm.ringFinger1,
      Left_ringFinger2: this.shoulderTransforms.rightArm.ringFinger2,
      Left_ringFinger3: this.shoulderTransforms.rightArm.ringFinger3,
      Left_littleFinger1: this.shoulderTransforms.rightArm.littleFinger1,
      Left_littleFinger2: this.shoulderTransforms.rightArm.littleFinger2,
      Left_littleFinger3: this.shoulderTransforms.rightArm.littleFinger3,
	    Left_leg: this.legsManager.rightLeg.upperLeg,
	    Left_knee: this.legsManager.rightLeg.lowerLeg,
	    Left_ankle: this.legsManager.rightLeg.foot,

	    Right_shoulder: this.shoulderTransforms.leftShoulderAnchor,
	    Right_arm: this.shoulderTransforms.leftArm.upperArm,
	    Right_elbow: this.shoulderTransforms.leftArm.lowerArm,
	    Right_wrist: this.shoulderTransforms.leftArm.hand,
      Right_thumb0: this.shoulderTransforms.leftArm.thumb0,
      Right_thumb1: this.shoulderTransforms.leftArm.thumb1,
      Right_thumb2: this.shoulderTransforms.leftArm.thumb2,
      Right_indexFinger1: this.shoulderTransforms.leftArm.indexFinger1,
      Right_indexFinger2: this.shoulderTransforms.leftArm.indexFinger2,
      Right_indexFinger3: this.shoulderTransforms.leftArm.indexFinger3,
      Right_middleFinger1: this.shoulderTransforms.leftArm.middleFinger1,
      Right_middleFinger2: this.shoulderTransforms.leftArm.middleFinger2,
      Right_middleFinger3: this.shoulderTransforms.leftArm.middleFinger3,
      Right_ringFinger1: this.shoulderTransforms.leftArm.ringFinger1,
      Right_ringFinger2: this.shoulderTransforms.leftArm.ringFinger2,
      Right_ringFinger3: this.shoulderTransforms.leftArm.ringFinger3,
      Right_littleFinger1: this.shoulderTransforms.leftArm.littleFinger1,
      Right_littleFinger2: this.shoulderTransforms.leftArm.littleFinger2,
      Right_littleFinger3: this.shoulderTransforms.leftArm.littleFinger3,

	    Right_leg: this.legsManager.leftLeg.upperLeg,
	    Right_knee: this.legsManager.leftLeg.lowerLeg,
	    Right_ankle: this.legsManager.leftLeg.foot,
      Left_toe: this.legsManager.leftLeg.toe,
      Right_toe: this.legsManager.rightLeg.toe,
	  };

    this.debugMesh = null;

    this.faceposes = [];
    if (this.options.visemes) {
      // ["Neutral", "A", "I", "U", "E", "O", "Blink", "Blink_L", "Blink_R", "Angry", "Fun", "Joy", "Sorrow", "Surprised"]
      const _getBlendShapeIndexForPresetName = presetName => {
        const blendShapes = this.vrmExtension && this.vrmExtension.blendShapeMaster && this.vrmExtension.blendShapeMaster.blendShapeGroups;
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
      const _getMorphTargetInfluenceIndexForRegex = (morphTargetDictionary, regex) => {
        let index = 0;
        for (const k in morphTargetDictionary) {
          if (regex.test(k)) {
            return index;
          }
          index++;
        }
        return -1;
      };
      /* const _getBlendShapeIndexForName = name => {
        const blendShapes = this.vrmExtension && this.vrmExtension.blendShapeMaster && this.vrmExtension.blendShapeMaster.blendShapeGroups;
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
          const surpriseIndex = _getMorphTargetInfluenceIndexForRegex(morphTargetDictionary, /surprise/i);
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
            surpriseIndex,
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

    this.shoulderTransforms.Start();
    this.legsManager.Start();

    if (options.top !== undefined) {
      this.setTopEnabled(!!options.top);
    }
    if (options.bottom !== undefined) {
      this.setBottomEnabled(!!options.bottom);
    }

    this.animationMappings = animationMappingConfig.map(animationMapping => {
      animationMapping = animationMapping.clone();
      const isPosition = /\.position$/.test(animationMapping.animationTrackName);
      animationMapping.dst = this.modelBoneOutputs[animationMapping.boneName][isPosition ? 'position' : 'quaternion'];
      animationMapping.lerpFn = _getLerpFn(isPosition);
      return animationMapping;
    });

    this.blinker = new Blinker();
    this.nodder = new Nodder();
    this.looker = new Looker(this);
    this.emoter = new Emoter();

    // shared state
    this.direction = new THREE.Vector3();
    this.jumpState = false;
    this.jumpTime = NaN;
    this.flyState = false;
    this.flyTime = NaN;

    this.useTime = NaN;
    this.useAnimation = null;
    this.useAnimationCombo = [];
    this.useAnimationEnvelope = [];
    this.unuseAnimation = null;
    this.unuseTime = -1;
    
    this.sitState = false;
    this.sitAnimation = null;
    // this.activateState = false;
    this.activateTime = 0;
    // this.danceState = false;
    this.danceFactor = 0;
    this.danceAnimation = null;
    this.emoteFactor = 0;
    this.emoteAnimation = null;
    this.poseFactor = 0;
    this.poseAnimation = null;
    this.aimState = false;
    this.aimRightTransitionTime = 0;
    this.aimRightFactor = 0;
    this.aimRightFactorReverse = 1;
    this.aimLeftTransitionTime = 0;
    this.aimLeftFactor = 0;
    this.aimLeftFactorReverse = 1;
    // this.throwState = null;
    // this.throwTime = 0;
    this.crouchTime = crouchMaxTime;
    this.sitTarget = new THREE.Object3D();
    this.fakeSpeechValue = 0;
    this.fakeSpeechSmoothed = 0;
    this.narutoRunState = false;
    this.chargeJumpState = false;
    this.chargeJumpTime = 0;
    this.narutoRunTime = 0;
    // this.standChargeState = false;
    // this.standChargeTime = 0;
    this.fallLoopState = false;
    this.fallLoopTime = 0;
    // this.swordSideSlashState = false;
    // this.swordSideSlashTime = 0;
    // this.swordTopDownSlashState = false;
    // this.swordTopDownSlashTime = 0;
    this.aimTime = NaN;
    this.aimAnimation = null;
    // this.aimDirection = new THREE.Vector3();
    this.hurtTime = NaN;
    this.hurtAnimation = null;

    // internal state
    this.lastPosition = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.lastMoveTime = 0;
    this.lastEmoteTime = 0;
    this.lastEmoteAnimation = 0;
    this.lastIsBackward = false;
    this.lastBackwardFactor = 0;
    this.backwardAnimationSpec = null;
    this.startEyeTargetQuaternion = new THREE.Quaternion();
    this.lastNeedsEyeTarget = false;
    this.lastEyeTargetTime = -Infinity;

    this.manuallySetMouth=false;
  }
  static bindAvatar(object) {
    const model = object.scene;
    model.updateMatrixWorld(true);
    
    const skinnedMeshes = getSkinnedMeshes(object);
    const skeleton = getSkeleton(object);
    // const boneMap = makeBoneMap(object);
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
  static applyModelBoneOutputs(avatar, modelBones, modelBoneOutputs, /*topEnabled,*/ bottomEnabled) {
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
          if (avatar.aimLeftFactor > 0) {
            // modelBone.quaternion.multiply(leftRotation); // center
            localQuaternion.copy(modelBone.quaternion).multiply(leftRotation)
            modelBone.quaternion.slerp(localQuaternion, avatar.aimLeftFactor);
          }
        } else if (k === 'Right_wrist') {
          if (avatar.aimRightFactor > 0) {
            // modelBone.quaternion.multiply(rightRotation); // center
            localQuaternion.copy(modelBone.quaternion).multiply(rightRotation)
            modelBone.quaternion.slerp(localQuaternion, avatar.aimRightFactor);
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
  async setQuality(quality) {

    this.model.visible = false;
    if ( this.crunchedModel ) this.crunchedModel.visible = false;
    if ( this.spriteMegaAvatarMesh ) this.spriteMegaAvatarMesh.visible = false;

    switch (quality) {
      case 1: {
        const skinnedMesh = await this.object.cloneVrm();
        this.spriteMegaAvatarMesh = this.spriteMegaAvatarMesh ?? avatarSpriter.createSpriteMegaMesh( skinnedMesh );
        scene.add( this.spriteMegaAvatarMesh );
        this.spriteMegaAvatarMesh.visible = true;
        break;
      }
      case 2: {
        this.crunchedModel = this.crunchedModel ?? avatarCruncher.crunchAvatarModel( this.model );
        this.crunchedModel.frustumCulled = false;
        scene.add( this.crunchedModel );
        this.crunchedModel.visible = true;
        break;
      }
      case 3: {
        console.log('not implemented'); // XXX
        this.model.visible = true;
        break;
      }
      case 4: {
        console.log('not implemented'); // XXX
        this.model.visible = true;
        break;
      }
      default: {
        throw new Error('unknown avatar quality: ' + quality);
      }
    }
  }
  lerpShoulderTransforms() {
    if (this.shoulderTransforms.handsEnabled[0]) {
      this.shoulderTransforms.nonIKLeftShoulderAnchor.quaternion.copy(this.shoulderTransforms.leftShoulderAnchor.quaternion);
      for (let key in this.shoulderTransforms.leftArm) {
        this.shoulderTransforms.nonIKLeftArm[key].quaternion.copy(this.shoulderTransforms.leftArm[key].quaternion);
      }
    }
    if (this.shoulderTransforms.handsEnabled[1]) {
      this.shoulderTransforms.nonIKRightShoulderAnchor.quaternion.copy(this.shoulderTransforms.rightShoulderAnchor.quaternion);
      for (let key in this.shoulderTransforms.rightArm) {
        this.shoulderTransforms.nonIKRightArm[key].quaternion.copy(this.shoulderTransforms.rightArm[key].quaternion);
      }
    }

    this.shoulderTransforms.Update();

    if (this.shoulderTransforms.handsEnabled[0]) {
      this.shoulderTransforms.lastLeftShoulderAnchor.quaternion.copy(this.shoulderTransforms.leftShoulderAnchor.quaternion);
      for (let key in this.shoulderTransforms.leftArm) {
        this.shoulderTransforms.lastLeftArm[key].quaternion.copy(this.shoulderTransforms.leftArm[key].quaternion);
      }
    }
    if (this.shoulderTransforms.handsEnabled[1]) {
      this.shoulderTransforms.lastRightShoulderAnchor.quaternion.copy(this.shoulderTransforms.rightShoulderAnchor.quaternion);
      for (let key in this.shoulderTransforms.rightArm) {
        this.shoulderTransforms.lastRightArm[key].quaternion.copy(this.shoulderTransforms.rightArm[key].quaternion);
      }
    }

    if (this.aimRightFactor > 0) {
      if (this.aimState) {
        this.shoulderTransforms.leftShoulderAnchor.quaternion.slerp(this.shoulderTransforms.nonIKLeftShoulderAnchor.quaternion, this.aimRightFactorReverse);
        for (let key in this.shoulderTransforms.leftArm) {
          this.shoulderTransforms.leftArm[key].quaternion.slerp(this.shoulderTransforms.nonIKLeftArm[key].quaternion, this.aimRightFactorReverse);
        }
      } else {
        this.shoulderTransforms.leftShoulderAnchor.quaternion.slerp(this.shoulderTransforms.lastLeftShoulderAnchor.quaternion, this.aimRightFactor);
        for (let key in this.shoulderTransforms.leftArm) {
          this.shoulderTransforms.leftArm[key].quaternion.slerp(this.shoulderTransforms.lastLeftArm[key].quaternion, this.aimRightFactor);
        }
      }
    }
    if (this.aimLeftFactor > 0) {
      if (this.aimState) {
        this.shoulderTransforms.rightShoulderAnchor.quaternion.slerp(this.shoulderTransforms.nonIKRightShoulderAnchor.quaternion, this.aimLeftFactorReverse);
        for (let key in this.shoulderTransforms.rightArm) {
          this.shoulderTransforms.rightArm[key].quaternion.slerp(this.shoulderTransforms.nonIKRightArm[key].quaternion, this.aimLeftFactorReverse);
        }
      } else {
        this.shoulderTransforms.rightShoulderAnchor.quaternion.slerp(this.shoulderTransforms.lastRightShoulderAnchor.quaternion, this.aimLeftFactor);
        for (let key in this.shoulderTransforms.rightArm) {
          this.shoulderTransforms.rightArm[key].quaternion.slerp(this.shoulderTransforms.lastRightArm[key].quaternion, this.aimLeftFactor);
        }
      }
    }
  }

  update(timestamp, timeDiff) {
    const now = timestamp;
    const timeDiffS = timeDiff / 1000;

    const currentSpeed = localVector.set(this.velocity.x, 0, this.velocity.z).length();

    const moveFactors = {};
    moveFactors.idleWalkFactor = Math.min(Math.max((currentSpeed - idleFactorSpeed) / (walkFactorSpeed - idleFactorSpeed), 0), 1);
    moveFactors.walkRunFactor = Math.min(Math.max((currentSpeed - walkFactorSpeed) / (runFactorSpeed - walkFactorSpeed), 0), 1);
    moveFactors.crouchFactor = Math.min(Math.max(1 - (this.crouchTime / crouchMaxTime), 0), 1);
    // console.log('current speed', currentSpeed, idleWalkFactor, walkRunFactor);
    this.aimRightFactor = this.aimRightTransitionTime / aimTransitionMaxTime;
    this.aimRightFactorReverse = 1 - this.aimRightFactor;
    this.aimLeftFactor = this.aimLeftTransitionTime / aimTransitionMaxTime;
    this.aimLeftFactorReverse = 1 - this.aimLeftFactor;

    const _updateHmdPosition = () => {
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

      if (this.velocity.length() > maxIdleVelocity) {
        this.lastMoveTime = now;
      }
    };
    
    const _overwritePose = poseName => {
      const poseAnimation = animations.index[poseName];
      // const noiseAnimation = animations.index['t-pose_rot.fbx'];
      // const noiseTime = (now/1000) % noiseAnimation.duration;
      for (const spec of this.animationMappings) {
        const {
          animationTrackName: k,
          dst,
          // isTop,
          isPosition,
        } = spec;

        if (!isPosition) {
          const src = poseAnimation.interpolants[k];
          const v = src.evaluate(0);
          dst.fromArray(v);
        }
      }

      /* this.modelBoneOutputs.Left_arm.quaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          -Math.PI * 0.25
        )
      );
      this.modelBoneOutputs.Right_arm.quaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          Math.PI * 0.25 
        )
      ); */
    };

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

      const needsEyeTarget = this.eyeTargetEnabled && this.modelBones.Root.quaternion.angleTo(globalQuaternion) < Math.PI * 0.4;
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
        if (eyeTargetFactor < 1) {
          localQuaternion2.copy(this.startEyeTargetQuaternion)
            .slerp(localQuaternion, cubicBezier(eyeTargetFactor));
          localMatrix.compose(localVector.set(0, 0, 0), localQuaternion2, localVector2.set(1, 1, 1))
            .premultiply(localMatrix2.copy(this.modelBoneOutputs.Neck.parent.matrixWorld).invert())
            .decompose(localVector, localQuaternion, localVector2);
        }
      }
    };

    const _updateEyeballTarget = () => {
      const leftEye = this.modelBoneOutputs['Eye_L'];
      const rightEye = this.modelBoneOutputs['Eye_R'];

      const lookerEyeballTarget = this.looker.update(now);
      const eyeballTarget = this.eyeballTargetEnabled ? this.eyeballTarget : lookerEyeballTarget;

      if (eyeballTarget && this.firstPersonCurves) {
        const {
          lookAtHorizontalInnerCurve,
          lookAtHorizontalOuterCurve,
          lookAtVerticalDownCurve,
          lookAtVerticalUpCurve,
        } = this.firstPersonCurves;

        function calculateTargetEuler(target, position) {
          const headPosition = eyePosition;

          // Look at direction in world coordinate
          const lookAtDir = localVector2.copy(headPosition).sub(position).normalize();

          // Transform the direction into local coordinate from the first person bone
          lookAtDir.applyQuaternion(
            localQuaternion.setFromRotationMatrix(head.matrixWorld)
              .invert()
          );

          // convert the direction into euler
          target.x = Math.atan2(lookAtDir.y, Math.sqrt(lookAtDir.x * lookAtDir.x + lookAtDir.z * lookAtDir.z));
          target.y = Math.atan2(-lookAtDir.x, -lookAtDir.z);
          target.z = 0;
          target.order = 'YXZ';
        }
        function lookAtEuler(euler) {
          const srcX = euler.x;
          const srcY = euler.y;

          const rotationFactor = Math.PI;
          const rotationRange = Math.PI * 0.1;

          if (leftEye) {
            if (srcX < 0.0) {
              localEuler2.x = -lookAtVerticalDownCurve.map(-srcX);
            } else {
              localEuler2.x = lookAtVerticalUpCurve.map(srcX);
            }

            if (srcY < 0.0) {
              localEuler2.y = -lookAtHorizontalInnerCurve.map(-srcY);
            } else {
              localEuler2.y = lookAtHorizontalOuterCurve.map(srcY);
            }
            localEuler2.x *= rotationFactor;
            localEuler2.y *= rotationFactor;
            localEuler2.y = Math.min(Math.max(localEuler2.y, -rotationRange), rotationRange);

            localEuler2.z = 0;
            localEuler2.order = 'YXZ';

            leftEye.quaternion.setFromEuler(localEuler2);
            leftEye.updateMatrix();
          }

          if (rightEye) {
            if (srcX < 0.0) {
              localEuler2.x = -lookAtVerticalDownCurve.map(-srcX);
            } else {
              localEuler2.x = lookAtVerticalUpCurve.map(srcX);
            }

            if (srcY < 0.0) {
              localEuler2.y = -lookAtHorizontalOuterCurve.map(-srcY);
            } else {
              localEuler2.y = lookAtHorizontalInnerCurve.map(srcY);
            }
            localEuler2.x *= rotationFactor;
            localEuler2.y *= rotationFactor;
            localEuler2.y = Math.min(Math.max(localEuler2.y, -rotationRange), rotationRange);

            localEuler2.z = 0;
            localEuler2.order = 'YXZ';

            rightEye.quaternion.setFromEuler(localEuler2);
            rightEye.updateMatrix();
          }
        }
        function lookAt( position) {
          calculateTargetEuler.call(this, localEuler, position);
          lookAtEuler.call(this, localEuler);
        }

        const head = this.modelBoneOutputs.Head;
        const eyePosition = getEyePosition(this.modelBones);
        lookAt.call(this, eyeballTarget);
      } else {
        if (leftEye) {
          leftEye.quaternion.identity();
          leftEye.updateMatrix();
        }
        if (rightEye) {
          rightEye.quaternion.identity();
          rightEye.updateMatrix();
        }
      }
    };

    const _updateVisemes = () => {
      const volumeValue = this.volume !== -1 ? Math.min(this.volume * 12, 1) : -1;
      // console.log('got volume value', this.volume, volumeValue);
      const blinkValue = this.blinker.update(now);
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
            surpriseIndex,
            // extraIndex,
          ] = visemeMapping;

          // reset
          for (let i = 0; i < morphTargetInfluences.length; i++) {
            morphTargetInfluences[i] = 0;
          }

          // if (volumeValue !== -1) { // real speech
          if (aIndex !== -1) {
            morphTargetInfluences[aIndex] = volumeValue;
          }
          if (eIndex !== -1) {
            morphTargetInfluences[eIndex] = volumeValue * this.vowels[1];
          }
          if (iIndex !== -1) {
            morphTargetInfluences[iIndex] = volumeValue * this.vowels[2];
          }
          if (oIndex !== -1) {
            morphTargetInfluences[oIndex] = volumeValue * this.vowels[3];
          }
          if (uIndex !== -1) {
            morphTargetInfluences[uIndex] = volumeValue * this.vowels[4];
          }
          /* } else { // fake speech
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
          } */

          // face poses
          if (this.faceposes.length > 0) {
            for (const facepose of this.faceposes) {
              let index = -1;
              switch (facepose.emotion) {
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
                case 'surprise': {
                  index = surpriseIndex;
                  break;
                }
                default: {
                  const match = facepose.emotion.match(/^emotion-([0-9]+)$/);
                  if (match) {
                    index = parseInt(match[1], 10);
                  }
                  break;
                }
              }
              if (index !== -1) {
                morphTargetInfluences[index] = facepose.value ?? 1;
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


    const _updateSubAvatars = () => {
      if (this.spriteMegaAvatarMesh) {
        this.spriteMegaAvatarMesh.update(timestamp, timeDiff, {
          playerAvatar: this,
          camera,
        });
      }
    };


    const _motionControls = () => {
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
            const { bones, finger } = fingerBone;
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
            // }
          }
        };
        _processFingerBones(true);
        _processFingerBones(false);
      }
    }
    if (this.getTopEnabled() || this.getHandEnabled(0) || this.getHandEnabled(1)) {
      _motionControls.call(this)
    }
    
    

    _updateHmdPosition();
    _applyAnimation(this, now, moveFactors);

    if (this.poseAnimation) {
      _overwritePose(this.poseAnimation);
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


    this.lerpShoulderTransforms();
    this.legsManager.Update();

    _updateEyeTarget();
    _updateEyeballTarget();

    this.modelBoneOutputs.Root.updateMatrixWorld();
    Avatar.applyModelBoneOutputs(
      this,
      this.foundModelBones,
      this.modelBoneOutputs,
      // this.getTopEnabled(),
      this.getBottomEnabled(),
    );
    // this.modelBones.Root.updateMatrixWorld();


    // this.springBoneTimeStep.update(timeDiff);
    this.springBoneManager && this.springBoneManager.lateUpdate(timeDiffS);

    // update wind in simulation
    const _updateWind = () =>{
      const headPosition = localVector.setFromMatrixPosition(this.modelBoneOutputs.Head.matrixWorld);
      wind.update(timestamp, headPosition, this.springBoneManager)
    }
    _updateWind();

    // XXX hook these up
    this.nodder.update(now);
    this.emoter.update(now);
    
    this.options.visemes && _updateVisemes();
    _updateSubAvatars();

    const debug = metaversefile.useDebug();
    if (debug.enabled && !this.debugMesh) {
      this.debugMesh = _makeDebugMesh();
      this.debugMesh.wrapToAvatar(this);
      this.model.add(this.debugMesh);
    }

    if (this.debugMesh) {
      if (debug.enabled) {
        this.debugMesh.setFromAvatar(this);
      }
      this.debugMesh.visible = debug.enabled;
    }
  }

  isAudioEnabled() {
    return !!this.microphoneWorker;
  }
  setAudioEnabled(enabled) {
    // cleanup
    if (this.microphoneWorker) {
      this.microphoneWorker.close();
      this.microphoneWorker = null;
    }
    if (this.audioRecognizer) {
      this.audioRecognizer.destroy();
      this.audioRecognizer = null;
    }

    // setup
    if (enabled) {
      this.volume = 0;
     
      const audioContext = getAudioContext();
      if (audioContext.state === 'suspended') {
        (async () => {
          await audioContext.resume();
        })();
      }
      this.microphoneWorker = new MicrophoneWorker({
        audioContext,
        muted: false,
        emitVolume: true,
        emitBuffer: true,
      });
      this.microphoneWorker.addEventListener('volume', e => {
        if(!this.manuallySetMouth){
          this.volume = this.volume*0.8 + e.data*0.2;
        }
      });
      this.microphoneWorker.addEventListener('buffer', e => {
        this.audioRecognizer.send(e.data);
      });

      this.audioRecognizer = new AudioRecognizer({
        sampleRate: audioContext.sampleRate,
      });
      this.audioRecognizer.addEventListener('result', e => {
        this.vowels.set(e.data);
      });
    } else {
      this.volume = -1;
    }
  }
  getAudioInput() {
    return this.microphoneWorker && this.microphoneWorker.getInput();
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

  /* say(audio) {
    this.setMicrophoneMediaStream(audio, {
      muted: false,
      // emitVolume: true,
      // emitBuffer: true,
      // audioContext: WSRTC.getAudioContext(),
      // microphoneWorkletUrl: '/avatars/microphone-worklet.js',
    });

    audio.play();
  } */

  destroy() {
    this.setAudioEnabled(false);
  }
}
Avatar.waitForLoad = () => loadPromise;
Avatar.getAnimations = () => animations;
Avatar.getAnimationStepIndices = () => animationStepIndices;
Avatar.getAnimationMappingConfig = () => animationMappingConfig;
let avatarAudioContext = null;
const getAudioContext = () => {
  if (!avatarAudioContext) {
    console.warn('using default audio context; setAudioContext was not called');
    setAudioContext(new AudioContext());
  }
  return avatarAudioContext;
};
Avatar.getAudioContext = getAudioContext;
const setAudioContext = newAvatarAudioContext => {
  avatarAudioContext = newAvatarAudioContext;
};
Avatar.setAudioContext = setAudioContext;
Avatar.getClosest2AnimationAngles = getClosest2AnimationAngles;
export default Avatar;
