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
import {scene} from '../app-object.js';
import {downloadFile} from '../util.js';

// import {FBXLoader} from '../FBXLoader.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const upRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI*0.5);
const forwardVector = new THREE.Vector3(0, 0, 1);
const leftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*0.5);
const rightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI*0.5);
const cubicBezier = easing(0, 1, 0, 1);
const defaultSitAnimation = 'chair';
const defaultUseAnimation = 'combo';
const defaultDanceAnimation = 'dansu';
const defaultThrowAnimation = 'throw';
const defaultCrouchAnimation = 'crouch';
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
const animationsSelectMap = {
  crouch: {
    'crouch_idle': new THREE.Vector3(0, 0, 0),
    'sneaking_forward': new THREE.Vector3(0, 0, -crouchMagnitude),
    'sneaking_forward_reverse': new THREE.Vector3(0, 0, crouchMagnitude),
    'crouched_sneaking_left': new THREE.Vector3(-crouchMagnitude, 0, 0),
    'crouched_sneaking_right': new THREE.Vector3(crouchMagnitude, 0, 0),
  },
  stand: {
    'idle': new THREE.Vector3(0, 0, 0),
    'jump': new THREE.Vector3(0, 1, 0),

    'left_strafe_walking': new THREE.Vector3(-0.5, 0, 0),
    'left_strafe': new THREE.Vector3(-1, 0, 0),
    'right_strafe_walking': new THREE.Vector3(0.5, 0, 0),
    'right_strafe': new THREE.Vector3(1, 0, 0),

    'running': new THREE.Vector3(0, 0, -1),
    'walking': new THREE.Vector3(0, 0, -0.5),

    'running_backwards': new THREE.Vector3(0, 0, 1),
    'walking_backwards': new THREE.Vector3(0, 0, 0.5),

    /* 'falling': new THREE.Vector3(0, -1, 0),
    'falling_idle': new THREE.Vector3(0, -0.5, 0),
    'falling_landing': new THREE.Vector3(0, -2, 0), */

    'left_strafe_walking_reverse': new THREE.Vector3(-Infinity, 0, 0),
    'left_strafe_reverse': new THREE.Vector3(-Infinity, 0, 0),
    'right_strafe_walking_reverse': new THREE.Vector3(Infinity, 0, 0),
    'right_strafe_reverse': new THREE.Vector3(Infinity, 0, 0),
  },
};
const animationsDistanceMap = {
  'idle': new THREE.Vector3(0, 0, 0),
  'jump': new THREE.Vector3(0, 1, 0),

  'left_strafe_walking': new THREE.Vector3(-0.5, 0, 0),
  'left_strafe': new THREE.Vector3(-1, 0, 0),
  'right_strafe_walking': new THREE.Vector3(0.5, 0, 0),
  'right_strafe': new THREE.Vector3(1, 0, 0),

  'running': new THREE.Vector3(0, 0, -1),
  'walking': new THREE.Vector3(0, 0, -0.5),

  'running_backwards': new THREE.Vector3(0, 0, 1),
  'walking_backwards': new THREE.Vector3(0, 0, 0.5),

  /* 'falling': new THREE.Vector3(0, -1, 0),
  'falling_idle': new THREE.Vector3(0, -0.5, 0),
  'falling_landing': new THREE.Vector3(0, -2, 0), */

  'left_strafe_walking_reverse': new THREE.Vector3(-1, 0, 1).normalize().multiplyScalar(2),
  'left_strafe_reverse': new THREE.Vector3(-1, 0, 1).normalize().multiplyScalar(3),
  'right_strafe_walking_reverse': new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(2),
  'right_strafe_reverse': new THREE.Vector3(1, 0, 1).normalize().multiplyScalar(3),
  
  'crouch_idle': new THREE.Vector3(0, 0, 0),
  'sneaking_forward': new THREE.Vector3(0, 0, -crouchMagnitude),
  'sneaking_forward_reverse': new THREE.Vector3(0, 0, crouchMagnitude),
  'crouched_sneaking_left': new THREE.Vector3(-crouchMagnitude, 0, 0),
  'crouched_sneaking_left_reverse': new THREE.Vector3(-crouchMagnitude, 0, crouchMagnitude),
  'crouched_sneaking_right': new THREE.Vector3(crouchMagnitude, 0, 0),
  'crouched_sneaking_right_reverse': new THREE.Vector3(crouchMagnitude, 0, crouchMagnitude),
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

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( '../' );
dracoLoader.preload();
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

import {MMDLoader} from '../MMDLoader.js';
import {MMDAnimationHelper} from '../MMDAnimationHelper.js';
const mmdLoader = new MMDLoader();
const mmdAnimationHelper = new MMDAnimationHelper();
let model = null;
let poseData = null;
let animationData = null;
const loadPromise = Promise.all([
  // load animations
  (async () => {
    const animationsModel = await new Promise((accept, reject) => {
      const u = '../animations/animations.glb';
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    /* for (const animation of animationsModel.animations) {
      const {name} = animation;
    } */
    
    animations = animationsModel.animations;
    
    // console.log('got animations', animations);

    const _normalizeAnimationDurations = (animations, baseAnimation) => {
      for (let i = 1; i < animations.length; i++) {
        const animation = animations[i];
        console.log('got duration', animations, animation);
        const oldDuration = animation.duration;
        const newDuration = baseAnimation.duration;
        for (const track of animation.tracks) {
          const {times} = track;
          for (let j = 0; j < times.length; j++) {
            times[j] *= newDuration/oldDuration;
          }
        }
        animation.duration = newDuration;
      }
    };
    console.log('got animations 2');
    const walkingAnimations = [
      `walking`,
      `left_strafe_walking`,
      `right_strafe_walking`,
    ].map(name => animations.find(a => a.name === name));
    _normalizeAnimationDurations(walkingAnimations, walkingAnimations[0]);
    const walkingBackwardAnimations = [
      `walking_backwards`,
      `left_strafe_walking_reverse`,
      `right_strafe_walking_reverse`,
    ].map(name => animations.find(a => a.name === name));
    console.log('walking backwards', walkingBackwardAnimations);
    _normalizeAnimationDurations(walkingBackwardAnimations, walkingBackwardAnimations[0]);
    const runningAnimations = [
      `running`,
      `left_strafe`,
      `right_strafe`,
    ].map(name => animations.find(a => a.name === name));
    _normalizeAnimationDurations(runningAnimations, runningAnimations[0]);
    const runningBackwardAnimations = [
      `running_backwards`,
      `left_strafe_reverse`,
      `right_strafe_reverse`,
    ].map(name => animations.find(a => a.name === name));
    // console.log('running backwards', runningBackwardAnimations);
    _normalizeAnimationDurations(runningBackwardAnimations, runningBackwardAnimations[0]);
    const crouchingForwardAnimations = [
      `sneaking_forward`,
      `crouched_sneaking_left`,
      `crouched_sneaking_right`,
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
      animation.isIdle = /idle/i.test(animation.name);
      animation.isJump = /jump/i.test(animation.name);
      animation.isSitting = /sitting/i.test(animation.name);
      // animation.isFalling  = /falling/i.test(animation.name);
      animation.isFloat  = /treading/i.test(animation.name);
      animation.isPistol  = /pistol_aiming/i.test(animation.name);
      animation.isRifle  = /rifle_aiming/i.test(animation.name);
      // animation.isHit  = /downward/i.test(animation.name);
      animation.isSlash  = /slash/i.test(animation.name);
      // animation.isHit  = /attack/i.test(animation.name);
      animation.isCombo  = /combo/i.test(animation.name);
      // animation.isHit = /sword_and_shield_idle/i.test(animation.name);
      animation.isMagic = /magic/i.test(animation.name);
      animation.isSkateboarding = /skateboarding/i.test(animation.name);
      animation.isThrow = /throw/i.test(animation.name);
      animation.isDancing = /dancing/i.test(animation.name);
      animation.isCrouch = /crouch|sneak/i.test(animation.name);
      animation.isForward = /forward/i.test(animation.name);
      animation.isBackward = /backward/i.test(animation.name) || /sneaking forward_reverse/i.test(animation.name);
      animation.isLeft = /left/i.test(animation.name);
      animation.isRight = /right/i.test(animation.name);
      animation.isRunning = /running|left_strafe(?:_reverse)?|right_strafe(?:_reverse)?/i.test(animation.name);
      animation.isReverse = /reverse/i.test(animation.name);
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
        `Breakdance 1990.fbx`,
        `Dancing Running Man.fbx`,
        `Jazz Dancing.fbx`,
        `Silly Dancing.fbx`,
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
    /* // bake poses
    (async () => {
      model = await new Promise((accept, reject) => {
        mmdLoader.load('./assets2/mmd/TDA hipster Miku 1.2/TDA Hipster Miku.pmx', accept, function onProgress() {}, reject);
      });
      model.scale.multiplyScalar(0.085);
      // scene.add(model);

      console.log('got model 1');

      const poses = [
        `./'Running' by CorruptedDestiny/2.vpd`,
        `./'Running' by CorruptedDestiny/3.vpd`,
        `./'Running' by CorruptedDestiny/4.vpd`,
        `./'Running' by CorruptedDestiny/5.vpd`,
        `./'Running' by CorruptedDestiny/6.vpd`,
        `./'Running' by CorruptedDestiny/First step.vpd`,
        `./'The Random Factor' by CorruptedDestiny/Jump, YEAH.vpd`,
        `./'The Random Factor' by CorruptedDestiny/Peace up dude.vpd`,
        `./'The Random Factor' by CorruptedDestiny/Randomness.vpd`,
        `./'To Lie' by CorruptedDestiny/Fetal Position.vpd`,
        `./'To Lie' by CorruptedDestiny/Semi Fetal Position.vpd`,
        `./'To Lie' by CorruptedDestiny/Sleeping on Back Open.vpd`,
        `./'To Lie' by CorruptedDestiny/Sleeping on Back.vpd`,
        `./'To Lie' by CorruptedDestiny/Sleeping on Stomach.vpd`,
        `./Floating Pose Pack - Snorlaxin/1.vpd`,
        `./Floating Pose Pack - Snorlaxin/10.vpd`,
        `./Floating Pose Pack - Snorlaxin/11.vpd`,
        `./Floating Pose Pack - Snorlaxin/12.vpd`,
        `./Floating Pose Pack - Snorlaxin/2.vpd`,
        `./Floating Pose Pack - Snorlaxin/3.vpd`,
        `./Floating Pose Pack - Snorlaxin/4.vpd`,
        `./Floating Pose Pack - Snorlaxin/5-ver2.vpd`,
        `./Floating Pose Pack - Snorlaxin/5.vpd`,
        `./Floating Pose Pack - Snorlaxin/6.vpd`,
        `./Floating Pose Pack - Snorlaxin/7.vpd`,
        `./Floating Pose Pack - Snorlaxin/8.vpd`,
        `./Floating Pose Pack - Snorlaxin/9.vpd`,
        `./General Poses 1/Casting.vpd`,
        `./General Poses 1/Cross my heart.vpd`,
        `./General Poses 1/Drawing 1.vpd`,
        `./General Poses 1/Drawing 2.vpd`,
        `./General Poses 1/Drawing Pose Reference 1.vpd`,
        `./General Poses 1/Drawing Pose Reference 2.vpd`,
        `./General Poses 1/Element Bending.vpd`,
        `./General Poses 1/Frankenstocking 2-1.vpd`,
        `./General Poses 1/Frankenstocking 2-2.vpd`,
        `./General Poses 1/Heaven knows, I tried.vpd`,
        `./General Poses 1/Here I stand in the light of day.vpd`,
        `./General Poses 1/I'm Devious.vpd`,
        `./General Poses 1/Look Ma No Hands.vpd`,
        `./General Poses 1/Magical Girl.vpd`,
        `./General Poses 1/Monster Girl 2 1.vpd`,
        `./General Poses 1/Monster Girl 2 2.vpd`,
        `./General Poses 1/Monster Girl.vpd`,
        `./General Poses 1/No No 1.vpd`,
        `./General Poses 1/No No 2.vpd`,
        `./General Poses 1/Number 1.vpd`,
        `./General Poses 1/Offer Up 1.vpd`,
        `./General Poses 1/Offer Up 2.vpd`,
        `./General Poses 1/Peace.vpd`,
        `./General Poses 1/Rawr 1.vpd`,
        `./General Poses 1/Rawr 2.vpd`,
        `./General Poses 1/Rawr 3.vpd`,
        `./General Poses 1/Red Purse 1.vpd`,
        `./General Poses 1/Red Purse 2.vpd`,
        `./General Poses 1/Sky's Falling 1.vpd`,
        `./General Poses 1/Sky's Falling 2.vpd`,
        `./General Poses 1/Sneaking Around 1.vpd`,
        `./General Poses 1/Sneaking Around 2.vpd`,
        `./General Poses 1/Sneaking Around 3.vpd`,
        `./General Poses 1/ssppooonn.vpd`,
        `./General Poses 1/Start Somthing 1.vpd`,
        `./General Poses 1/Start Somthing 2.vpd`,
        `./General Poses 1/Start Somthing 3.vpd`,
        `./General Poses 1/Turn away and slam the door.vpd`,
        `./General Poses 1/Witch Brew 1.vpd`,
        `./General Poses 1/Witch Brew 2.vpd`,
        `./General Poses 1/Witch Brew 3.vpd`,
        `./General Poses 1/Witch Brew 4.vpd`,
        `./General Poses 1/Witch Brew 5.vpd`,
        `./General Poses 1/Witch Brew 6.vpd`,
        `./General Poses 1/Witch Brew 7.vpd`,
        `./General Poses 1/Witch Brew 8.vpd`,
        `./General Poses 1/With Wings Pose 1.vpd`,
        `./General Poses 1/With Wings Pose 2.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R1.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R10.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R11.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R12.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R13.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R14.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R15.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R16.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R17.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R18.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R19.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R2.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R20.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R21.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R22.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R23.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R24.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R25.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R26.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R27.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R28.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R29.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R3.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R30.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R31.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R32.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R33.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R34.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R35.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R4.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R5.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R6.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R7.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R8.vpd`,
        `./JuuRenka's Ultimate Pose Pack/R9.vpd`,
        `./Pose Pack 2 by OzzWalcito/1.vpd`,
        `./Pose Pack 2 by OzzWalcito/10.vpd`,
        `./Pose Pack 2 by OzzWalcito/11.vpd`,
        `./Pose Pack 2 by OzzWalcito/12.vpd`,
        `./Pose Pack 2 by OzzWalcito/13.vpd`,
        `./Pose Pack 2 by OzzWalcito/14.vpd`,
        `./Pose Pack 2 by OzzWalcito/15.vpd`,
        `./Pose Pack 2 by OzzWalcito/16.vpd`,
        `./Pose Pack 2 by OzzWalcito/17.vpd`,
        `./Pose Pack 2 by OzzWalcito/18.vpd`,
        `./Pose Pack 2 by OzzWalcito/19.vpd`,
        `./Pose Pack 2 by OzzWalcito/2.vpd`,
        `./Pose Pack 2 by OzzWalcito/20.vpd`,
        `./Pose Pack 2 by OzzWalcito/21.vpd`,
        `./Pose Pack 2 by OzzWalcito/22.vpd`,
        `./Pose Pack 2 by OzzWalcito/23_1.vpd`,
        `./Pose Pack 2 by OzzWalcito/23_2.vpd`,
        `./Pose Pack 2 by OzzWalcito/24.vpd`,
        `./Pose Pack 2 by OzzWalcito/25.vpd`,
        `./Pose Pack 2 by OzzWalcito/26.vpd`,
        `./Pose Pack 2 by OzzWalcito/27.vpd`,
        `./Pose Pack 2 by OzzWalcito/28.vpd`,
        `./Pose Pack 2 by OzzWalcito/29.vpd`,
        `./Pose Pack 2 by OzzWalcito/3.vpd`,
        `./Pose Pack 2 by OzzWalcito/30.vpd`,
        `./Pose Pack 2 by OzzWalcito/4.vpd`,
        `./Pose Pack 2 by OzzWalcito/5.vpd`,
        `./Pose Pack 2 by OzzWalcito/6.vpd`,
        `./Pose Pack 2 by OzzWalcito/7.vpd`,
        `./Pose Pack 2 by OzzWalcito/8.vpd`,
        `./Pose Pack 2 by OzzWalcito/9.vpd`,
        `./Pose Pack 6 - Snorlaxin/1.vpd`,
        `./Pose Pack 6 - Snorlaxin/10.vpd`,
        `./Pose Pack 6 - Snorlaxin/2.vpd`,
        `./Pose Pack 6 - Snorlaxin/3.vpd`,
        `./Pose Pack 6 - Snorlaxin/4.vpd`,
        `./Pose Pack 6 - Snorlaxin/5.vpd`,
        `./Pose Pack 6 - Snorlaxin/6.vpd`,
        `./Pose Pack 6 - Snorlaxin/7.vpd`,
        `./Pose Pack 6 - Snorlaxin/8.vpd`,
        `./Pose Pack 6 - Snorlaxin/9.vpd`,
        `./Resting Pose Pack - Snorlaxin/1.vpd`,
        `./Resting Pose Pack - Snorlaxin/10.vpd`,
        `./Resting Pose Pack - Snorlaxin/11.vpd`,
        `./Resting Pose Pack - Snorlaxin/12.vpd`,
        `./Resting Pose Pack - Snorlaxin/13.vpd`,
        `./Resting Pose Pack - Snorlaxin/14.vpd`,
        `./Resting Pose Pack - Snorlaxin/2.vpd`,
        `./Resting Pose Pack - Snorlaxin/3.vpd`,
        `./Resting Pose Pack - Snorlaxin/4.vpd`,
        `./Resting Pose Pack - Snorlaxin/5.vpd`,
        `./Resting Pose Pack - Snorlaxin/6.vpd`,
        `./Resting Pose Pack - Snorlaxin/7.vpd`,
        `./Resting Pose Pack - Snorlaxin/8.vpd`,
        `./Resting Pose Pack - Snorlaxin/9.vpd`,
        `./Seated Poses/1.vpd`,
        `./Seated Poses/2.vpd`,
        `./Seated Poses/3.vpd`,
        `./Seated Poses/4.vpd`,
        `./ThatOneBun Posepack/1.vpd`,
        `./ThatOneBun Posepack/10.vpd`,
        `./ThatOneBun Posepack/11.vpd`,
        `./ThatOneBun Posepack/12.vpd`,
        `./ThatOneBun Posepack/13.vpd`,
        `./ThatOneBun Posepack/14.vpd`,
        `./ThatOneBun Posepack/15.vpd`,
        `./ThatOneBun Posepack/16.vpd`,
        `./ThatOneBun Posepack/17.vpd`,
        `./ThatOneBun Posepack/18.vpd`,
        `./ThatOneBun Posepack/19.vpd`,
        `./ThatOneBun Posepack/2.vpd`,
        `./ThatOneBun Posepack/20.vpd`,
        `./ThatOneBun Posepack/21.vpd`,
        `./ThatOneBun Posepack/22.vpd`,
        `./ThatOneBun Posepack/23.vpd`,
        `./ThatOneBun Posepack/24.vpd`,
        `./ThatOneBun Posepack/25.vpd`,
        `./ThatOneBun Posepack/26.vpd`,
        `./ThatOneBun Posepack/27.vpd`,
        `./ThatOneBun Posepack/28.vpd`,
        `./ThatOneBun Posepack/29.vpd`,
        `./ThatOneBun Posepack/3.vpd`,
        `./ThatOneBun Posepack/30.vpd`,
        `./ThatOneBun Posepack/31.vpd`,
        `./ThatOneBun Posepack/32.vpd`,
        `./ThatOneBun Posepack/33.vpd`,
        `./ThatOneBun Posepack/34.vpd`,
        `./ThatOneBun Posepack/35.vpd`,
        `./ThatOneBun Posepack/36.vpd`,
        `./ThatOneBun Posepack/37.vpd`,
        `./ThatOneBun Posepack/38.vpd`,
        `./ThatOneBun Posepack/39.vpd`,
        `./ThatOneBun Posepack/4.vpd`,
        `./ThatOneBun Posepack/40.vpd`,
        `./ThatOneBun Posepack/41.vpd`,
        `./ThatOneBun Posepack/42.vpd`,
        `./ThatOneBun Posepack/43.vpd`,
        `./ThatOneBun Posepack/5.vpd`,
        `./ThatOneBun Posepack/6.vpd`,
        `./ThatOneBun Posepack/7.vpd`,
        `./ThatOneBun Posepack/8.vpd`,
        `./ThatOneBun Posepack/9.vpd`,
        `./ThatOneBun Posepack/Scoot's pick/Darinka.vpd`,
        `./ThatOneBun Posepack/Scoot's pick/Frizerka.vpd`,
        `./ThatOneBun Posepack/Scoot's pick/Jebac.vpd`,
        `./ThatOneBun Posepack/Scoot's pick/Snezana.vpd`,
        `./ThatOneBun Posepack/Scoot's pick/Spizdi.vpd`,
        `./ThatOneBun Posepack/Scoot's pick/Strina.vpd`,
        `./ThatOneBun Posepack/Scoot's pick/Vesna.vpd`,
        `./Trust Me Pose Pack/1.vpd`,
        `./Trust Me Pose Pack/10.vpd`,
        `./Trust Me Pose Pack/11 (Boy).vpd`,
        `./Trust Me Pose Pack/12 (Girl).vpd`,
        `./Trust Me Pose Pack/13.vpd`,
        `./Trust Me Pose Pack/14.vpd`,
        `./Trust Me Pose Pack/15 (Final Pose).vpd`,
        `./Trust Me Pose Pack/2.vpd`,
        `./Trust Me Pose Pack/3.vpd`,
        `./Trust Me Pose Pack/4.vpd`,
        `./Trust Me Pose Pack/5.vpd`,
        `./Trust Me Pose Pack/6.vpd`,
        `./Trust Me Pose Pack/7 (Left).vpd`,
        `./Trust Me Pose Pack/8 (Right).vpd`,
        `./Trust Me Pose Pack/9.vpd`,
        `./Twins/Twins.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 1.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 10.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 11.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 12.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 13.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 14.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 15.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 2.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 3.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 4.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 5.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 6.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 7.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 8.vpd`,
        `./Yoga Pose Pack - Snorlaxin/Yoga Pose 9.vpd`,
      ];
      const boneNameMappings = {
        '全ての親': null, // 'spine',
        'センター': null, // 'hips',
        '上半身': null, // 'spine',
        '首': 'neck',
        '頭': 'head',
        '下半身': null, // 'antispine',

        '左肩P': null, // 'rightShoulder',
        '左肩': 'rightShoulder',
        '左腕': 'rightUpperArm',
        '左腕捩': null, // 'rightLowerArm',
        '左ひじ': 'rightLowerArm',
        '左手捩': null, // 'rightLowerArm',
        '左手首': 'rightHand',
        '左親指１': 'leftThumb1',
        '左親指２': 'leftThumb2',
        '左人指１': 'leftIndexFinger1',
        '左人指２': 'leftIndexFinger2',
        '左人指３': 'leftIndexFinger3',
        '左中指１': 'leftMiddleFinger1',
        '左中指２': 'leftMiddleFinger2',
        '左中指３': 'leftMiddleFinger3',
        '左薬指１': 'leftRingFinger1',
        '左薬指２': 'leftRingFinger2',
        '左薬指３': 'leftRingFinger3',
        '左小指１': 'leftLittleFinger1',
        '左小指２': 'leftLittleFinger2',
        '左小指３': 'leftLittleFinger3',

        '右肩P': null, // 'leftShoulder',
        '右肩': 'leftShoulder',
        '右腕': 'leftUpperArm',
        '右腕捩': null, // 'leftLowerArm',
        '右ひじ': 'leftLowerArm',
        '右手捩': null, // 'leftLowerArm',
        '右手首': 'leftHand',
        '右親指１': 'rightThumb1',
        '右親指２': 'rightThumb2',
        '右人指１': 'rightIndexFinger1',
        '右人指２': 'rightIndexFinger2',
        '右人指３': 'rightIndexFinger3',
        '右中指１': 'rightMiddleFinger1',
        '右中指２': 'rightMiddleFinger2',
        '右中指３': 'rightMiddleFinger3',
        '右薬指１': 'rightRingFinger1',
        '右薬指２': 'rightRingFinger2',
        '右薬指３': 'rightRingFinger3',
        '右小指１': 'rightLittleFinger1',
        '右小指２': 'rightLittleFinger2',
        '右小指３': 'rightLittleFinger3',
        
        '左足': 'rightUpperLeg',
        '左ひざ': 'rightLowerLeg',
        '左足首': 'rightFoot',
        '右足': 'leftUpperLeg',
        '右ひざ': 'leftLowerLeg',
        '右足首': 'leftFoot',
        '左つま先': null, // 'Left_toe',
        '右つま先': null, // 'Right_toe',
        '左足ＩＫ': null, // 'leftUpperLeg',
        '右足ＩＫ': null, // 'rightUpperLeg',
        '左つま先ＩＫ': null, // 'Left toe IK',
        '右つま先ＩＫ': null, // 'Right toe IK',
      };
      
      console.log('got model 2');
      
      const _getModelPose = model => {
        const bones = model.skeleton.bones.map(bone => {
          let {name, quaternion} = bone;
          const mappedName = boneNameMappings[bone.name];
          if (mappedName !== undefined) {
            // quaternion = quaternion.clone();
            return {
              // name,
              quaternion: quaternion.toArray(),
              mappedName,
            };
          } else {
            return null;
          }
        }).filter(b => !!b);
        return bones;
      };
      console.log('got model 3');
      animationData = await Promise.all(poses.map(async pose => {
        const u = `./assets2/poses/${pose}`;
        const poseData = await new Promise((accept, reject) => {
          mmdLoader.loadVPD(u, false, accept, function onProgress() {}, reject);
        });
        return poseData;
      }));
      const poseData = animationData.map(a => {
        mmdAnimationHelper.pose(model, a);
        return _getModelPose(model);
      });
      console.log('got model 4');
      const poseDataCborBuffer = CBOR.encode(poseData);
      {
        let poseData2 = CBOR.decode(poseDataCborBuffer);
        console.log('got model 4.5', poseData2);
        poseData2 = poseData2.map(track => {
          return {
            bones: track.map(bone => {
              let {quaternion, mappedName} = bone;
              return {
                mappedName,
                quaternion: new THREE.Quaternion().fromArray(quaternion),
              };
            }),
          };
        });
        console.log('got pose', poseData, poseData2);
      }
      console.log('got model 5');
      downloadFile(new Blob([poseDataCborBuffer], {
        type: 'application/cbor',
      }), 'poses.cbor');
      console.log('got model 6');
    })(); */
  })(),
  // load poses
  (async () => {
    const res = await fetch('../poses/poses.cbor');
    const arrayBuffer = await res.arrayBuffer();
    poseData = CBOR.decode(arrayBuffer);
    poseData = poseData.map(track => {
      return {
        bones: track.map(bone => {
          let {quaternion, mappedName} = bone;
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
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)))
  );
const cubeGeometryPositions = cubeGeometry.attributes.position.array;
const numCubeGeometryPositions = cubeGeometryPositions.length;
const srcCubeGeometries = {};
const _makeDebugMeshes = () => {
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
};

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

const _exportBone = bone => {
  return [bone.name, bone.position.toArray().concat(bone.quaternion.toArray()).concat(bone.scale.toArray()), bone.children.map(b => _exportBone(b))];
};
const _exportSkeleton = skeleton => {
  const hips = _findHips(skeleton);
  const armature = _findArmature(hips);
  return JSON.stringify(_exportBone(armature));
}
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
    // console.log('got skeleton', skinnedMeshes, skeleton, _exportSkeleton(skeleton));
    const poseSkeletonSkinnedMesh = skeleton ? skinnedMeshes.find(o => o.skeleton !== skeleton && o.skeleton.bones.length >= skeleton.bones.length) : null;
    const poseSkeleton = poseSkeletonSkinnedMesh && poseSkeletonSkinnedMesh.skeleton;
    if (poseSkeleton) {
      _copySkeleton(poseSkeleton, skeleton);
      poseSkeletonSkinnedMesh.bind(skeleton);
    }

    if (options.debug) {
      const debugMeshes = _makeDebugMeshes();
      this.model.add(debugMeshes);
      this.debugMeshes = debugMeshes;
    } else {
      this.debugMeshes = null;
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

	  const Eye_L = _findEye(tailBones, true);
	  const Eye_R = _findEye(tailBones, false);
	  const Head = _findHead(tailBones);
	  const Neck = Head.parent;
	  const Chest = Neck.parent;
	  const Hips = _findHips(skeleton);
	  const Spine = _findSpine(Chest, Hips);
	  const Left_shoulder = _findShoulder(tailBones, true);
	  const Left_wrist = _findHand(Left_shoulder);
    const Left_thumb2 = _getOptional(_findFinger(Left_wrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02l|l_thumb3|thumb002l/i));
    const Left_thumb1 = _ensureParent(Left_thumb2);
    const Left_thumb0 = _ensureParent(Left_thumb1, Left_wrist);
    const Left_indexFinger3 = _getOptional(_findFinger(Left_wrist, /index(?:finger)?3|index_distal|index02l|indexfinger3_l|index002l/i));
    const Left_indexFinger2 = _ensureParent(Left_indexFinger3);
    const Left_indexFinger1 = _ensureParent(Left_indexFinger2, Left_wrist);
    const Left_middleFinger3 = _getOptional(_findFinger(Left_wrist, /middle(?:finger)?3|middle_distal|middle02l|middlefinger3_l|middle002l/i));
    const Left_middleFinger2 = _ensureParent(Left_middleFinger3);
    const Left_middleFinger1 = _ensureParent(Left_middleFinger2, Left_wrist);
    const Left_ringFinger3 = _getOptional(_findFinger(Left_wrist, /ring(?:finger)?3|ring_distal|ring02l|ringfinger3_l|ring002l/i));
    const Left_ringFinger2 = _ensureParent(Left_ringFinger3);
    const Left_ringFinger1 = _ensureParent(Left_ringFinger2, Left_wrist);
    const Left_littleFinger3 = _getOptional(_findFinger(Left_wrist, /little(?:finger)?3|pinky3|little_distal|little02l|lifflefinger3_l|little002l/i));
    const Left_littleFinger2 = _ensureParent(Left_littleFinger3);
    const Left_littleFinger1 = _ensureParent(Left_littleFinger2, Left_wrist);
	  const Left_elbow = /^lower_arm(?:l|r)2$/i.test(Left_wrist.parent.name) ? Left_wrist.parent.parent : Left_wrist.parent;
	  const Left_arm = Left_elbow.parent;
	  const Right_shoulder = _findShoulder(tailBones, false);
	  const Right_wrist = _findHand(Right_shoulder);
    const Right_thumb2 = _getOptional(_findFinger(Right_wrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02r|r_thumb3|thumb002r/i));
    const Right_thumb1 = _ensureParent(Right_thumb2);
    const Right_thumb0 = _ensureParent(Right_thumb1, Right_wrist);
    const Right_indexFinger3 = _getOptional(_findFinger(Right_wrist, /index(?:finger)?3|index_distal|index02r|indexfinger3_r|index002r/i));
    const Right_indexFinger2 = _ensureParent(Right_indexFinger3);
    const Right_indexFinger1 = _ensureParent(Right_indexFinger2, Right_wrist);
    const Right_middleFinger3 = _getOptional(_findFinger(Right_wrist, /middle(?:finger)?3|middle_distal|middle02r|middlefinger3_r|middle002r/i));
    const Right_middleFinger2 = _ensureParent(Right_middleFinger3);
    const Right_middleFinger1 = _ensureParent(Right_middleFinger2, Right_wrist);
    const Right_ringFinger3 = _getOptional(_findFinger(Right_wrist, /ring(?:finger)?3|ring_distal|ring02r|ringfinger3_r|ring002r/i));
    const Right_ringFinger2 = _ensureParent(Right_ringFinger3);
    const Right_ringFinger1 = _ensureParent(Right_ringFinger2, Right_wrist);
    const Right_littleFinger3 = _getOptional(_findFinger(Right_wrist, /little(?:finger)?3|pinky3|little_distal|little02r|lifflefinger3_r|little002r/i));
    const Right_littleFinger2 = _ensureParent(Right_littleFinger3);
    const Right_littleFinger1 = _ensureParent(Right_littleFinger2, Right_wrist);
	  const Right_elbow = /^lower_arm(?:l|r)2$/i.test(Right_wrist.parent.name) ? Right_wrist.parent.parent : Right_wrist.parent;
	  const Right_arm = Right_elbow.parent;
	  const Left_ankle = _findFoot(tailBones, true);
	  const Left_knee = Left_ankle.parent;
	  const Left_leg = Left_knee.parent;
	  const Right_ankle = _findFoot(tailBones, false);
	  const Right_knee = Right_ankle.parent;
	  const Right_leg = Right_knee.parent;
    const modelBones = {
	    Hips,
	    Spine,
	    Chest,
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
	  };
	  this.modelBones = modelBones;
    /* for (const k in modelBones) {
      if (!modelBones[k]) {
        console.warn('missing bone', k);
      }
    } */

	  const armature = _findArmature(Hips);

    const _getEyePosition = () => {
      if (Eye_L && Eye_R) {
        return Eye_L.getWorldPosition(new THREE.Vector3())
          .add(Eye_R.getWorldPosition(new THREE.Vector3()))
          .divideScalar(2);
      } else {
        const neckToHeadDiff = Head.getWorldPosition(new THREE.Vector3()).sub(Neck.getWorldPosition(new THREE.Vector3()));
        if (neckToHeadDiff.z < 0) {
          neckToHeadDiff.z *= -1;
        }
        return Head.getWorldPosition(new THREE.Vector3()).add(neckToHeadDiff);
      }
    };
    // const eyeDirection = _getEyePosition().sub(Head.getWorldPosition(new Vector3()));
    const leftArmDirection = Left_wrist.getWorldPosition(new THREE.Vector3()).sub(Head.getWorldPosition(new THREE.Vector3()));
	  const flipZ = leftArmDirection.x < 0;//eyeDirection.z < 0;
    const armatureDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(armature.quaternion);
    const flipY = armatureDirection.z < -0.5;
    const legDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(Left_leg.getWorldQuaternion(new THREE.Quaternion()).premultiply(armature.quaternion.clone().invert()));
    const flipLeg = legDirection.y < 0.5;
	  // console.log('flip', flipZ, flipY, flipLeg);
	  this.flipZ = flipZ;
	  this.flipY = flipY;
    this.flipLeg = flipLeg;

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
    let springBoneManagerPromise = null;
    if (options.hair) {
      new Promise((accept, reject) => {
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
        }

        springBoneManagerPromise = new THREE.VRMSpringBoneImporter().import(object)
          .then(springBoneManager => {
            this.springBoneManager = springBoneManager;
          });
      });
    }

    const _findFingerBone = (r, left) => {
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
    };
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

    const qrArm = flipZ ? Left_arm : Right_arm;
    const qrElbow = flipZ ? Left_elbow : Right_elbow;
    const qrWrist = flipZ ? Left_wrist : Right_wrist;
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
    const qlArm = flipZ ? Right_arm : Left_arm;
    const qlElbow = flipZ ? Right_elbow : Left_elbow;
    const qlWrist = flipZ ? Right_wrist : Left_wrist;
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
    });

    this.height = eyePosition.clone().sub(_averagePoint([modelBones.Left_ankle.getWorldPosition(new THREE.Vector3()), modelBones.Right_ankle.getWorldPosition(new THREE.Vector3())])).y;
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

    this.animationMappings = [
      new AnimationMapping('Hips.quaternion', this.outputs.hips.quaternion, false),
      new AnimationMapping('Spine.quaternion', this.outputs.spine.quaternion, false),
      // new AnimationMapping('Spine1.quaternion', null, false),
      new AnimationMapping('Spine2.quaternion', this.outputs.chest.quaternion, false),
      new AnimationMapping('Neck.quaternion', this.outputs.neck.quaternion, false),
      new AnimationMapping('Head.quaternion', this.outputs.head.quaternion, false),

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
  getTopEnabled() {
    return this.shoulderTransforms.enabled;
  }
  setBottomEnabled(enabled) {
    this.legsManager.enabled = enabled;
  }
  getBottomEnabled() {
    return this.legsManager.enabled;
  }
	update(timeDiff) {
    /* const wasDecapitated = this.decapitated;
    if (this.springBoneManager && wasDecapitated) {
      this.undecapitate();
    } */

    const now = Date.now();

    const _applyAnimation = () => {
      const standKey = this.crouchState ? 'stand' : 'crouch';
      const otherStandKey = standKey === 'stand' ? 'crouch' : 'stand';
      const crouchFactor = Math.min(Math.max(this.crouchTime, 0), crouchMaxTime) / crouchMaxTime;
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
      const selectedOtherAnimations = _selectAnimations(this.velocity, otherStandKey);

      for (const spec of this.animationMappings) {
        const {
          quaternionKey: k,
          quaternion: dst,
          isTop
        } = spec;
        if (dst) {
          // top override
          if (this.jumpState) {
            const t2 = this.jumpTime/1000 * 0.6 + 0.7;
            const src2 = jumpAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          } else if (this.sitState) {
            const sitAnimation = sitAnimations[this.sitAnimation || defaultSitAnimation];
            const src2 = sitAnimation.interpolants[k];
            const v2 = src2.evaluate(1);

            dst.fromArray(v2);
          } else if (this.danceState) {
            const danceAnimation = danceAnimations[this.danceAnimation || defaultDanceAnimation];
            const src2 = danceAnimation.interpolants[k];
            const t2 = (this.danceTime/1000) % danceAnimation.duration;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          } else if (this.throwState) {
            const throwAnimation = throwAnimations[this.throwAnimation || defaultThrowAnimation];
            const src2 = throwAnimation.interpolants[k];
            const t2 = this.throwTime/1000;
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          } else if (this.useTime >= 0 && isTop) {
            const useAnimation = useAnimations[this.useAnimation || defaultUseAnimation];
            const t2 = (this.useTime/useAnimationRate) % useAnimation.duration;
            const src2 = useAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            dst.fromArray(v2);
          } else {
            const _getHorizontalBlend = (selectedAnimations, target) => {
              const distance1 = animationsDistanceMap[selectedAnimations[0].name].distanceTo(this.direction);
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
              }
            };
            _getHorizontalBlend(selectedAnimations, localQuaternion2);
            _getHorizontalBlend(selectedOtherAnimations, localQuaternion3);
            dst.copy(localQuaternion2).slerp(localQuaternion3, crouchFactor);
          }
          // blend
          if (this.flyState || (this.flyTime >= 0 && this.flyTime < 1000)) {
            const t2 = this.flyTime/1000;
            const f = this.flyState ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));
            const src2 = floatAnimation.interpolants[k];
            const v2 = src2.evaluate(t2 % floatAnimation.duration);

            dst.slerp(localQuaternion.fromArray(v2), f);
          }
        }
      }
    };
    _applyAnimation();

    const _applyPose = () => {    
      if (poseData && (poseIndex !== -1 || this.activePoses.length > 0)) {
        for (const k in this.outputs) {
          this.outputs[k].quaternion.set(0, 0, 0, 1);
        }

        this.outputs.leftUpperArm.quaternion.setFromAxisAngle(forwardVector, Math.PI * 0.25)
        // .multiply(localQuaternion.setFromAxisAngle(localVector.set(1, 0, 0), Math.PI * 0.5));
        // .premultiply(localQuaternion.setFromAxisAngle(localVector.set(0, 1, 0), Math.PI * 0.3))
        this.outputs.rightUpperArm.quaternion.setFromAxisAngle(forwardVector, -Math.PI * 0.25);
        // this.outputs.leftUpperLeg.quaternion.setFromAxisAngle(forwardVector, -Math.PI * 0.15);
        // this.outputs.rightUpperLeg.quaternion.setFromAxisAngle(forwardVector, Math.PI * 0.15);

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

        // this.outputs.leftLowerArm.quaternion.premultiply(localQuaternion.setFromAxisAngle(forwardVector, -Math.PI * 0.4));
        // this.outputs.rightLowerArm.quaternion.premultiply(localQuaternion.setFromAxisAngle(forwardVector, Math.PI * 0.4));

        // const antiSpineBone = poseData[poseIndex].bones.find(b => b.mappedName === 'antispine');
        // this.outputs.leftUpperLeg.quaternion.premultiply(antiSpineBone.quaternion);
        // this.outputs.rightUpperLeg.quaternion.premultiply(antiSpineBone.quaternion);

        // mmdAnimationHelper.pose(model, animationData[poseIndex]);
      }
      if (this.headTargetEnabled) {
        this.outputs.neck.quaternion.premultiply(this.headTarget);
      }
    };
    _applyPose();

    if (this.getTopEnabled()) {
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
    if (!this.getTopEnabled() && this.debugMeshes) {
      this.outputs.hips.updateMatrixWorld();
    }

    this.shoulderTransforms.Update();
    this.legsManager.Update();

    if (this.windTargetEnabled && this.springBoneManager) {
      for (const springBoneGroup of this.springBoneManager.springBoneGroupList) {
        for (const bone of springBoneGroup) {
          bone.gravityDir.copy(this.windTarget);
          bone.gravityPower =
            Math.sin((Date.now() % 100)/100 * Math.PI) * 1 +
            Math.cos((Date.now() % 20)/20 * Math.PI) * 1 +
            Math.sin((Date.now() % 5)/5 * Math.PI) * 1;
        }
      }
    }

    for (const k in this.modelBones) {
      const modelBone = this.modelBones[k];
      if (modelBone) { // broken model
        const modelBoneOutput = this.modelBoneOutputs[k];

        if (/hips|thumb|finger/i.test(k)) {
          modelBone.position.copy(modelBoneOutput.position);
        }
        modelBone.quaternion.multiplyQuaternions(modelBoneOutput.quaternion, modelBone.initialQuaternion);

        if (this.getTopEnabled()) {
          if (k === 'Left_wrist') {
            if (this.getHandEnabled(1)) {
              modelBone.quaternion.multiply(leftRotation); // center
            }
          } else if (k === 'Right_wrist') {
            if (this.getHandEnabled(0)) {
              modelBone.quaternion.multiply(rightRotation); // center
            }
          }
        }
        if (this.getBottomEnabled()) {
          if (k === 'Left_ankle' || k === 'Right_ankle') {
            modelBone.quaternion.multiply(upRotation);
          }
        }
        modelBone.updateMatrixWorld();
      }
    }

    if (this.springBoneManager) {
      this.springBoneManager.lateUpdate(timeDiff);
    }
    /* if (this.springBoneManager && wasDecapitated) {
      this.decapitate();
    } */

    if (this.options.visemes) {
      const aValue = Math.min(this.volume * 10, 1);
      /* const emotionValues = {
        angry: 0,
        fun: 0,
        joy: 0,
        sorrow: 0,
      }; */
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

        /* // local vismeses
        for (const influence of visemeMapping) {
          if (emotionValues[influence.name]) {
            morphTargetInfluences[influence.index] = emotionValues[influence.name];
          }
        } */
        
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
    
    if (this.eyeTargetEnabled) {
      for (const eye of [this.modelBones.Eye_L, this.modelBones.Eye_R]) {
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
                  localVector2.set(0, 1, 0)
                )
              )
            );
          if (/^(?:left|right)eye$/i.test(eye.name)) {
            localEuler.setFromQuaternion(localQuaternion, 'YXZ');
            localEuler.x = -localEuler.x;
            eye.quaternion.setFromEuler(localEuler);
          } else {
            localEuler.setFromQuaternion(localQuaternion, 'YXZ');
            localEuler.x = Math.min(Math.max(-localEuler.x, -Math.PI*0.05), Math.PI*0.1);
            localEuler.y = Math.min(Math.max(localEuler.y, -Math.PI*0.1), Math.PI*0.1);
            localEuler.z = 0;
            eye.quaternion.setFromEuler(localEuler);
          }
        }
      }
    }

    if (this.debugMeshes) {
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
    }
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
        this.volume = this.volume*0.8 + e.data*0.2;
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
      if (this.debugMeshes) {
        [this.debugMeshes.attributes.eyes, this.debugMeshes.attributes.head].forEach(attribute => {
          attribute.visible = false;
        });
      }
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
      if (this.debugMeshes) {
        [this.debugMeshes.attributes.eyes, this.debugMeshes.attributes.head].forEach(attribute => {
          attribute.visible = true;
        });
      }
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
    // window.o = window.o || {};
    const _recurse = (a, b) => {
      if (a.isBone) {
        // window.o[b.name] = true;
        // _copySkeleton(a.skeleton, b.skeleton);
        // b.skeleton.bones.forEach((b, i) => {
          // console.log('got', a);
          // debugger;
          b.matrix.copy(a.matrix)
            .decompose(b.position, b.quaternion, b.scale);
          // b.position.copy(a.position);
          // b.quaternion.copy(a.quaternion);
          // b.position.set(-1 + Math.random() * 2, Math.random(), -1);
        // });
      }
      if (a.children) {
        for (let i = 0; i < a.children.length; i++) {
          _recurse(a.children[i], b.children[i]);
        }
      }
    };
    // console.log('copy', model);
    _recurse(this.model, model);
  }

  destroy() {
    this.setMicrophoneMediaStream(null);
  }
}
Avatar.waitForLoad = () => loadPromise;
export default Avatar;
