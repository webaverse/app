import { 
  alphaFactors,
  prepAngles, 
  _getAngleToBackwardAnimation, 
  _getIdleAnimation,
  _handleDefault,
  getActiveAnimation,
  loadAnimations,
  _clearXZ
} from "./Animations.js";

import { Vector3, Quaternion, AnimationClip } from 'three';
import metaversefile from 'metaversefile';
import {VRMSpringBoneImporter, VRMLookAtApplyer, VRMCurveMapper} from '@pixiv/three-vrm/lib/three-vrm.module.js';
import easing from '../easing.js';

import {
  crouchMaxTime,
  aimMaxTime,
} from '../constants.js'

import {
  idleFactorSpeed,
  walkFactorSpeed,
  runFactorSpeed,
} from './constants.js';


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
  // decorateAnimation,
} from './util.mjs';


const cubicBezier = easing(0, 1, 0, 1);



let animationsBaseModel;

const defaultSitAnimation = 'chair';
const defaultUseAnimation = 'combo';
const defaultDanceAnimation = 'dansu';
const defaultThrowAnimation = 'throw';
// const defaultCrouchAnimation = 'crouch';
const defaultActivateAnimation = 'activate';
const defaultNarutoRunAnimation = 'narutoRun';
const defaultchargeJumpAnimation = 'chargeJump';
const defaultStandChargeAnimation = 'standCharge';

let activeAvatar;


//should this return to avatar?
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


// stand
let idleAnimation = _getIdleAnimation('walk');
// crouch
let idleAnimationOther = _getIdleAnimation('crouch');


//should probably just move this?
export const loadPromise = (async () => {
  await Promise.resolve(); // wait for metaversefile to be defined
  
  await Promise.all([
    loadAnimations(),
    loadSkeleton()
  ]);

  window._localPlayer = metaversefile.useLocalPlayer();
})().catch(err => {
  console.log('load avatar animations error', err);
});

const _blendFly = spec => {
  const {
    animationTrackName: k,
    dst,
    // isTop,
    lerpFn,
  } = spec;

  const flyState = activeAvatar.tracker.getState('fly');
  if (flyState?.active || (flyState?.time >= 0 && flyState?.time < 1000)) {
    const t2 = flyState.time / 1000;
    const f = flyState.active ? Math.min(cubicBezier(t2), 1) : (1 - Math.min(cubicBezier(t2), 1));
    const src2 = getActiveAnimation("float").interpolants[k];
    const v2 = src2.evaluate(t2 % getActiveAnimation("float").duration);

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

    const activateAnimation = getActiveAnimation("activate")[defaultAnimation].animation;
    const src2 = activateAnimation.interpolants[k];
    const t2 = ((activeAvatar.activateTime / 1000) * getActiveAnimation("activate")[defaultAnimation].speedFactor) % activateAnimation.duration;
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

export const _applyAnimation = (avatar, now) => {
  // if (!loaded) return;
  const currentSpeed = avatar.localVector.set(avatar.velocity.x, 0, avatar.velocity.z).length();

  alphaFactors.idleWalkFactor = Math.min(Math.max((currentSpeed - idleFactorSpeed) / (walkFactorSpeed - idleFactorSpeed), 0), 1);
  alphaFactors.walkRunFactor = Math.min(Math.max((currentSpeed - walkFactorSpeed) / (runFactorSpeed - walkFactorSpeed), 0), 1);
  alphaFactors.crouchFactor = Math.min(Math.max(1 - (avatar.crouchTime / crouchMaxTime), 0), 1);

  // const runSpeed = 0.5;
  activeAvatar = avatar;

  prepAngles(avatar.getAngle());

  /* // walk sound effect
  playStepSounds();
   */

  const isBackward = _getAngleToBackwardAnimation(avatar.getAngle(), "walk") < Math.PI * 0.4;
  let backwardAnimationSpec = null;
  if (isBackward !== avatar.lastIsBackward) {
    backwardAnimationSpec = {
      startFactor: alphaFactors.lastBackwardFactor,
      endFactor: isBackward ? 1 : 0,
      startTime: now,
      endTime: now + 150,
    };
    avatar.lastIsBackward = isBackward;
  }
  if (backwardAnimationSpec) {
    const f = (now - backwardAnimationSpec.startTime) / (backwardAnimationSpec.endTime - backwardAnimationSpec.startTime);
    if (f >= 1) {
      alphaFactors.mirrorFactor = backwardAnimationSpec.endFactor;
      backwardAnimationSpec = null;
    } else {
      alphaFactors.mirrorFactor = backwardAnimationSpec.startFactor +
        Math.pow(
          f,
          0.5
        ) * (backwardAnimationSpec.endFactor - backwardAnimationSpec.startFactor);
    }
  } else {
    alphaFactors.mirrorFactor = isBackward ? 1 : 0;
  }
  alphaFactors.lastBackwardFactor = alphaFactors.mirrorFactor;

  const _getApplyFn = () => {

    if (avatar.tracker.getState('jump', true)) {
      return avatar.tracker.getState('jump').animationFn;
    }
    if (avatar.tracker.getState('sit', true)) {
      return avatar.tracker.getState('sit').animationFn;
    }
    if (avatar.tracker.getState('narutoRun', true)) {
      return avatar.tracker.getState('narutoRun').animationFn;
    }

    if (avatar.tracker.getState('dance')?.time > 0) {
      return avatar.tracker.getState('dance').animationFn;      
    }

    if (avatar.tracker.getState('fallLoop', true)) {
      return avatar.tracker.getState('fallLoop').animationFn;      
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
        

        const throwAnimation = getActiveAnimation("throw")[avatar.throwAnimation || defaultThrowAnimation];
        // const danceAnimation = getActiveAnimation("dance")[0];
        const src2 = throwAnimation.interpolants[k];
        const v2 = src2.evaluate(t2);

        let useAnimation;
        let t2;
        const useTimeS = avatar.useTime / 1000;
        if (avatar.useAnimation) {
          const useAnimationName = avatar.useAnimation;
          useAnimation = getActiveAnimation("use")[useAnimationName];
          t2 = Math.min(useTimeS, useAnimation.duration);
        } else if (avatar.useAnimationCombo.length > 0) {
          const useAnimationName = avatar.useAnimationCombo[avatar.useAnimationIndex];
          useAnimation = getActiveAnimation("use")[useAnimationName];
          t2 = Math.min(useTimeS, useAnimation.duration);
        } else if (avatar.useAnimationEnvelope.length > 0) {
          let totalTime = 0;
          for (let i = 0; i < avatar.useAnimationEnvelope.length - 1; i++) {
            const animationName = avatar.useAnimationEnvelope[i];
            const animation = getActiveAnimation("use")[animationName];
            totalTime += animation.duration;
          }

          if (totalTime > 0) {
            let animationTimeBase = 0;
            for (let i = 0; i < avatar.useAnimationEnvelope.length - 1; i++) {
              const animationName = avatar.useAnimationEnvelope[i];
              const animation = getActiveAnimation("use")[animationName];
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
              useAnimation = getActiveAnimation("use")[secondLastAnimationName];
              t2 = (useTimeS - animationTimeBase) % useAnimation.duration;
            }
          }
        }

        _handleDefault(spec, now, avatar);

        if (useAnimation) {
          if (!isPosition) {
            const src2 = useAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            // const idleAnimation = _getIdleAnimation('walk');
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

            // const idleAnimation = _getIdleAnimation('walk');
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

        const aimAnimation = (avatar.aimAnimation && getActiveAnimation("aim")[avatar.aimAnimation]);
        _handleDefault(spec, now, avatar);
        const t2 = (avatar.aimTime / aimMaxTime) % aimAnimation.duration;
        if (!isPosition) {
          if (aimAnimation) {
            const src2 = aimAnimation.interpolants[k];
            const v2 = src2.evaluate(t2);

            // const idleAnimation = _getIdleAnimation('walk');
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

          // const idleAnimation = _getIdleAnimation('walk');
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

        _handleDefault(spec, now, avatar);

        const unuseTimeS = avatar.unuseTime / 1000;
        const unuseAnimationName = avatar.unuseAnimation;
        const unuseAnimation = getActiveAnimation("use")[unuseAnimationName];
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

          avatar.localVector.copy(dst)
            .sub(localVector2.fromArray(v3))
            .add(localVector2.fromArray(v2));

          lerpFn
            .call(
              dst,
              avatar.localVector,
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


    //for each active state...
    // let timeMod = avatar.tracker.getState('jump').time / 1000 * 0.6 + 0.7;
    // _tmplateFunc(spec, state, avatar, timeMod);


    applyFn(spec, now, avatar);
    _blendFly(spec);
    _blendActivateAction(spec);

    // ignore all animation position except y
    if (isPosition) {
      if (!avatar.tracker.getState('jump', true)) {

        // animations position is height-relative
        dst.y *= avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
      } else {
        // force height in the jump case to overide the animation
        dst.y = avatar.height * 0.55;
      }
    }
  }
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


//we aren't currently using this
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