/**
 * avatar
 * activeAnimations
 * 
 */
import StateMachine from './States.js';

import { Vector3, Quaternion, AnimationClip } from 'three';
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
// import { loadedAnimations } from './animationHelpers.js';
import { zbdecode } from 'zjs/encoding.mjs';
import {
    idleFactorSpeed,
    walkFactorSpeed,
    runFactorSpeed,
    narutoRunTimeFactor,
} from './constants.js';

import {
    crouchMaxTime,
    aimMaxTime,
    avatarInterpolationFrameRate,
    useMaxTime,
    avatarInterpolationTimeDelay,
    avatarInterpolationNumFrames,
} from '../constants.js'

const defaultSitAnimation = 'chair';
const defaultUseAnimation = 'combo';
const defaultDanceAnimation = 'dansu';
const defaultThrowAnimation = 'throw';
// const defaultCrouchAnimation = 'crouch';
const defaultActivateAnimation = 'activate';
const defaultNarutoRunAnimation = 'narutoRun';
const defaultchargeJumpAnimation = 'chargeJump';
const defaultStandChargeAnimation = 'standCharge';

// let crouchAnimations;
// let jumpAnimationSegments;
// let chargeJump;
// let standCharge;
// let swordSideSlash;
// let swordTopDownSlash;

// const localVector4 = new Vector3();
// const localVector5 = new Vector3();
// const localVector6 = new Vector3();

const localQuaternion3 = new Quaternion();
const localQuaternion4 = new Quaternion();
const localQuaternion5 = new Quaternion();
const localQuaternion6 = new Quaternion();

let loadedAnimations;

export let animationStepIndices;
export const alphaFactors = {
    angleFactor: 0,
    mirrorFactor: null,
    idleWalkFactor: null,
    walkRunFactor: null,
    crouchFactor: null,
    lastBackwardFactor: 0,
    // speedFactor:null,
    // narutoRunTimeFactor: null,
    // eyeTargetFactor:null,
}

export const getClosest2AnimationAngles = (key, angle) => {
    const animationAngleArray = tmpAnimation.animationsAngleArrays[key];
    animationAngleArray.sort((a, b) => {
        const aDistance = Math.abs(angleDifference(angle, a.angle));
        const bDistance = Math.abs(angleDifference(angle, b.angle));
        return aDistance - bDistance;
    });
    const closest2AnimationAngles = animationAngleArray.slice(0, 2);
    return closest2AnimationAngles;
};


export const prepAngles = (angle) => {
    const { _getMirrorAnimationAngles, angles} = tmpAnimation;
    angles.walk.base = getClosest2AnimationAngles('walk', angle);
    angles.walk.mirrored = _getMirrorAnimationAngles(angles.walk.base, 'walk');

    angles.run.base = getClosest2AnimationAngles('run', angle);
    angles.run.mirrored = _getMirrorAnimationAngles(angles.run.base, 'run');

    angles.crouch.base = getClosest2AnimationAngles('crouch', angle);
    angles.crouch.mirrored = _getMirrorAnimationAngles(angles.crouch.base, 'crouch');

    const angleToClosestAnimation = Math.abs(angleDifference(angle, angles.walk.mirrored[0].angle));
    const angleBetweenAnimations = Math.abs(angleDifference(angles.walk.mirrored[0].angle, angles.walk.mirrored[1].angle));
    alphaFactors.angleFactor = (angleBetweenAnimations - angleToClosestAnimation) / angleBetweenAnimations;

}


export async function loadAnimations() {
    const res = await fetch('/animations/animations.z');
    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const animationsJson = zbdecode(uint8Array);
    loadedAnimations = animationsJson.animations
        .map(a => AnimationClip.parse(a));
    animationStepIndices = animationsJson.animationStepIndices;
    loadedAnimations.index = {};
    for (const animation of loadedAnimations) {
        loadedAnimations.index[animation.name] = animation;
    }

    tmpAnimation.prepAnimations();

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


export const getLoadedAnimation = (animation) => {
    if (animation) return loadedAnimations[animation];
    return loadedAnimations;
}

//this will be used from factory and removed from here
export const getActiveAnimation = (animation) => {
    return tmpAnimation.activeAnimations[animation];
}

//this will be used from factory and removed from here
export const _getIdleAnimation = key => tmpAnimation.animationsIdleArrays[key].animation;
/* const _getIdleAnimation = key => {
  if (key === 'walk' || key === 'run') {
    const name = animationsIdleArrays[key].name;
    return avatar.retargetedAnimations.find(a => a.name === name);
  } else {
    return animationsIdleArrays[key].animation;
  }
}; */

export const _getAngleToBackwardAnimation = (angle, animation) => {
    const animationAngles = tmpAnimation.angles[animation].mirrored; //this in particular needs review
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


// used in animations
//this will be used from factory and removed from here
export const _clearXZ = (dst, isPosition) => {
    if (isPosition) {
        dst.x = 0;
        dst.z = 0;
    }
};

// animations, will likely be moved still
// this is probably going to be the root state
export const _handleDefault = (spec, now, avatar) => {
    const {
        animationTrackName: k,
        dst,
        // isTop,
        lerpFn,
        isPosition,
    } = spec;

    // _getHorizontalBlend(k, lerpFn, isPosition, dst, avatar, now);
    tmpAnimation.getHorizontalBlend(k, lerpFn, isPosition, dst, avatar, now);
};


class AnimationFactory{
    constructor(){
        this.angles = {
            walk: {
                base: null,
                mirrored: null
            },
            run: {
                base: null,
                mirrored: null
            },
            crouch: {
                base: null,
                mirrored: null
            },
            // horizontalWalkAnimationAngles: null,
            // horizontalWalkAnimationAnglesMirror: null,
            // horizontalRunAnimationAngles: null,
            // horizontalRunAnimationAnglesMirror: null
        }
        this.animationsIdleArrays = {
            reset: { name: 'reset.fbx' },
            walk: { name: 'idle.fbx' },
            run: { name: 'idle.fbx' },
            crouch: { name: 'Crouch Idle.fbx' },
        };
        this.animationsAngleArrays = {
            walk: [
                { name: 'left strafe walking.fbx', angle: Math.PI / 2 },
                { name: 'right strafe walking.fbx', angle: -Math.PI / 2 },

                { name: 'walking.fbx', angle: 0 },
                { name: 'walking backwards.fbx', angle: Math.PI },

                // {name: 'left strafe walking reverse.fbx', angle: Math.PI*3/4},
                // {name: 'right strafe walking reverse.fbx', angle: -Math.PI*3/4},
            ],
            run: [
                { name: 'left strafe.fbx', angle: Math.PI / 2 },
                { name: 'right strafe.fbx', angle: -Math.PI / 2 },

                { name: 'Fast Run.fbx', angle: 0 },
                { name: 'running backwards.fbx', angle: Math.PI },

                // {name: 'left strafe reverse.fbx', angle: Math.PI*3/4},
                // {name: 'right strafe reverse.fbx', angle: -Math.PI*3/4},
            ],
            crouch: [
                { name: 'Crouched Sneaking Left.fbx', angle: Math.PI / 2 },
                { name: 'Crouched Sneaking Right.fbx', angle: -Math.PI / 2 },

                { name: 'Sneaking Forward.fbx', angle: 0 },
                { name: 'Sneaking Forward reverse.fbx', angle: Math.PI },

                // {name: 'Crouched Sneaking Left reverse.fbx', angle: Math.PI*3/4},
                // {name: 'Crouched Sneaking Right reverse.fbx', angle: -Math.PI*3/4},
            ],
        };
        this.animationsAngleArraysMirror = {
            walk: [
                { name: 'left strafe walking reverse.fbx', matchAngle: -Math.PI / 2, angle: -Math.PI / 2 },
                { name: 'right strafe walking reverse.fbx', matchAngle: Math.PI / 2, angle: Math.PI / 2 },
            ],
            run: [
                { name: 'left strafe reverse.fbx', matchAngle: -Math.PI / 2, angle: -Math.PI / 2 },
                { name: 'right strafe reverse.fbx', matchAngle: Math.PI / 2, angle: Math.PI / 2 },
            ],
            crouch: [
                { name: 'Crouched Sneaking Left reverse.fbx', matchAngle: -Math.PI / 2, angle: -Math.PI / 2 },
                { name: 'Crouched Sneaking Right reverse.fbx', matchAngle: Math.PI / 2, angle: Math.PI / 2 },
            ],
        };
        this.activeAnimations = {};
        this.animations = new Map();
    }

    _get7wayBlend(
        avatar,
        // angles,
        idleAnimation,
        alphaFactors,
        k,
        lerpFn,
        isPosition,
        target,
        now
    ) {
        const timeSeconds = now / 1000;

        const { walk, run, crouch } = this.angles;

        // mirrorFactor,
        // angleFactor,

        // WALK
        // normal horizontal walk blend
        {
            const t1 = timeSeconds % walk.base[0].animation.duration;
            const src1 = walk.base[0].animation.interpolants[k];
            const v1 = src1.evaluate(t1);

            const t2 = timeSeconds % walk.base[1].animation.duration;
            const src2 = walk.base[1].animation.interpolants[k];
            const v2 = src2.evaluate(t2);

            lerpFn
                .call(
                    localQuaternion3.fromArray(v2),
                    localQuaternion4.fromArray(v1),
                    alphaFactors.angleFactor
                );
        }

        // mirror horizontal blend (backwards walk)
        {
            const t1 = timeSeconds % walk.mirrored[0].animation.duration;
            const src1 = walk.mirrored[0].animation.interpolants[k];
            const v1 = src1.evaluate(t1);

            const t2 = timeSeconds % walk.mirrored[1].animation.duration;
            const src2 = walk.mirrored[1].animation.interpolants[k];
            const v2 = src2.evaluate(t2);

            lerpFn
                .call(
                    localQuaternion4.fromArray(v2),
                    localQuaternion5.fromArray(v1),
                    alphaFactors.angleFactor
                );
        }

        // blend mirrors together to get a smooth walk
        lerpFn
            .call(
                localQuaternion5.copy(localQuaternion3), // Result is in localQuaternion5
                localQuaternion4,
                alphaFactors.mirrorFactor
            );

        // RUN
        // normal horizontal run blend
        {
            const t1 = timeSeconds % run.base[0].animation.duration;
            const src1 = run.base[0].animation.interpolants[k];
            const v1 = src1.evaluate(t1);

            const t2 = timeSeconds % run.base[1].animation.duration;
            const src2 = run.base[1].animation.interpolants[k];
            const v2 = src2.evaluate(t2);

            lerpFn
                .call(
                    localQuaternion3.fromArray(v2),
                    localQuaternion4.fromArray(v1),
                    alphaFactors.angleFactor
                );
        }

        // mirror horizontal blend (backwards run)
        {
            const t1 = timeSeconds % run.mirrored[0].animation.duration;
            const src1 = run.mirrored[0].animation.interpolants[k];
            const v1 = src1.evaluate(t1);

            const t2 = timeSeconds % run.mirrored[1].animation.duration;
            const src2 = run.mirrored[1].animation.interpolants[k];
            const v2 = src2.evaluate(t2);

            lerpFn
                .call(
                    localQuaternion4.fromArray(v2),
                    localQuaternion6.fromArray(v1),
                    alphaFactors.angleFactor
                );
        }

        // blend mirrors together to get a smooth run
        lerpFn
            .call(
                localQuaternion6.copy(localQuaternion3), // Result is in localQuaternion6
                localQuaternion4,
                alphaFactors.mirrorFactor
            );

        // Blend walk/run
        lerpFn
            .call(
                localQuaternion4.copy(localQuaternion5), // Result is in localQuaternion4
                localQuaternion6,
                alphaFactors.walkRunFactor
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
                    alphaFactors.idleWalkFactor
                );
        }
    };

    getHorizontalBlend (k, lerpFn, isPosition, target, avatar, now) {
        this._get7wayBlend(
            avatar,
            // this.angles,
            _getIdleAnimation('walk'),
            // mirrorFactor,
            // angleFactor,
            alphaFactors,
            k,
            lerpFn,
            isPosition,
            avatar.localQuaternion,
            now
        );
        this._get7wayBlend(
            avatar,
            // this.angles,
            _getIdleAnimation('crouch'),
            // mirrorFactor,
            // angleFactor,
            alphaFactors,
            k,
            lerpFn,
            isPosition,
            avatar.localQuaternion2,
            now
        );

        //_get5wayBlend(angles.crouch.base, angles.crouch.mirrored, idleAnimationOther, alphaFactors.mirrorFactor, alphaFactors.angleFactor, speedFactor, k, lerpFn, avatar.localQuaternion2);

        lerpFn
            .call(
                target.copy(avatar.localQuaternion),
                avatar.localQuaternion2,
                alphaFactors.crouchFactor
            );

    };

    _getMirrorAnimationAngles = (animationAngles, key) => {
        const animations = animationAngles.map(({ animation }) => animation);
        const animationAngleArrayMirror = this.animationsAngleArraysMirror[key];

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

    mergeAnimations(a, b) {
        const o = {};
        for (const k in a) {
            o[k] = a[k];
        }
        for (const k in b) {
            o[k] = b[k];
        }
        return o;
    }    

    _normalizeAnimationDurations (animations, baseAnimation, factor = 1) {

        // const baseAnimation = animations[baseIndex];

        for (let i = 1; i < animations.length; i++) {
            const animation = animations[i];
            const oldDuration = animation.duration;
            const newDuration = baseAnimation.duration;
            for (const track of animation.tracks) {
                const { times } = track;
                for (let j = 0; j < times.length; j++) {
                    times[j] *= newDuration / oldDuration * factor;
                }
            }
            animation.duration = newDuration * factor;
        }
    };
// export const _normalizeAnimationDurations = (animations, baseIndex = 0, factor = 1) => {

    prepAnimations () {

        // const { mergeAnimations, _normalizeAnimationDurations, animationsAngleArrays, animationsAngleArraysMirror, animationsIdleArrays } = tmpAnimation;
        const { mergeAnimations, _normalizeAnimationDurations, animationsAngleArrays, animationsAngleArraysMirror, animationsIdleArrays } = this;

        for (const k in animationsAngleArrays) {
            const as = animationsAngleArrays[k];
            for (const a of as) {
                a.animation = loadedAnimations.index[a.name];
            }
        }
        for (const k in animationsAngleArraysMirror) {
            const as = animationsAngleArraysMirror[k];
            for (const a of as) {
                a.animation = loadedAnimations.index[a.name];
            }
        }
        for (const k in animationsIdleArrays) {
            animationsIdleArrays[k].animation = loadedAnimations.index[animationsIdleArrays[k].name];
        }

        const walkingAnimations = [
            'walking.fbx',
            'left strafe walking.fbx',
            'right strafe walking.fbx',
        ].map(name => loadedAnimations.index[name]);
        const walkingBackwardAnimations = [
            'walking backwards.fbx',
            'left strafe walking reverse.fbx',
            'right strafe walking reverse.fbx',
        ].map(name => loadedAnimations.index[name]);
        const runningAnimations = [
            'Fast Run.fbx',
            'left strafe.fbx',
            'right strafe.fbx',
        ].map(name => loadedAnimations.index[name]);
        const runningBackwardAnimations = [
            'running backwards.fbx',
            'left strafe reverse.fbx',
            'right strafe reverse.fbx',
        ].map(name => loadedAnimations.index[name]);
        const crouchingForwardAnimations = [
            'Sneaking Forward.fbx',
            'Crouched Sneaking Left.fbx',
            'Crouched Sneaking Right.fbx',
        ].map(name => loadedAnimations.index[name]);
        const crouchingBackwardAnimations = [
            'Sneaking Forward reverse.fbx',
            'Crouched Sneaking Left reverse.fbx',
            'Crouched Sneaking Right reverse.fbx',
        ].map(name => loadedAnimations.index[name]);
        for (const animation of loadedAnimations) {
            decorateAnimation(animation);
        }

        _normalizeAnimationDurations(walkingAnimations, walkingAnimations[0]);
        _normalizeAnimationDurations(walkingBackwardAnimations, walkingBackwardAnimations[0]);
        _normalizeAnimationDurations(runningAnimations, runningAnimations[0]);
        _normalizeAnimationDurations(runningBackwardAnimations, runningBackwardAnimations[0]);
        _normalizeAnimationDurations(crouchingForwardAnimations, crouchingForwardAnimations[0], 0.5);
        _normalizeAnimationDurations(crouchingBackwardAnimations, crouchingBackwardAnimations[0], 0.5);

        const animationGroups = {};  //do we need this?

        /* jumpAnimationSegments = {
         chargeJump: loadedAnimations.find(a => a.isChargeJump),
         chargeJumpFall: loadedAnimations.find(a => a.isChargeJumpFall),
         isFallLoop: loadedAnimations.find(a => a.isFallLoop),
         isLanding: loadedAnimations.find(a => a.isLanding)
       }; */

        // chargeJump = loadedAnimations.find(a => a.isChargeJump);
        // standCharge = loadedAnimations.find(a => a.isStandCharge);
        this.activeAnimations['fallLoop'] = loadedAnimations.find(a => a.isFallLoop);
        // swordSideSlash = loadedAnimations.find(a => a.isSwordSideSlash);
        // swordTopDownSlash = loadedAnimations.find(a => a.isSwordTopDownSlash)
        this.activeAnimations['jump'] = loadedAnimations.find(a => a.isJump);
        // sittingAnimation = loadedAnimations.find(a => a.isSitting);
        this.activeAnimations['float'] = loadedAnimations.find(a => a.isFloat);
        // rifleAnimation = loadedAnimations.find(a => a.isRifle);
        // hitAnimation = loadedAnimations.find(a => a.isHit);
        this.activeAnimations['aim'] = {
            swordSideIdle: loadedAnimations.index['sword_idle_side.fbx'],
            swordSideIdleStatic: loadedAnimations.index['sword_idle_side_static.fbx'],
            swordSideSlash: loadedAnimations.index['sword_side_slash.fbx'],
            swordSideSlashStep: loadedAnimations.index['sword_side_slash_step.fbx'],
            swordTopDownSlash: loadedAnimations.index['sword_topdown_slash.fbx'],
            swordTopDownSlashStep: loadedAnimations.index['sword_topdown_slash_step.fbx'],
            swordUndraw: loadedAnimations.index['sword_undraw.fbx'],
        };
        this.activeAnimations['use'] = mergeAnimations({
            combo: loadedAnimations.find(a => a.isCombo),
            slash: loadedAnimations.find(a => a.isSlash),
            rifle: loadedAnimations.find(a => a.isRifle),
            pistol: loadedAnimations.find(a => a.isPistol),
            magic: loadedAnimations.find(a => a.isMagic),
            eat: loadedAnimations.find(a => a.isEating),
            drink: loadedAnimations.find(a => a.isDrinking),
            throw: loadedAnimations.find(a => a.isThrow),
            bowDraw: loadedAnimations.find(a => a.isBowDraw),
            bowIdle: loadedAnimations.find(a => a.isBowIdle),
            bowLoose: loadedAnimations.find(a => a.isBowLoose),
        }, this.activeAnimations.aim);
        this.activeAnimations['sit'] = {
            chair: loadedAnimations.find(a => a.isSitting),
            saddle: loadedAnimations.find(a => a.isSitting),
            stand: loadedAnimations.find(a => a.isSkateboarding),
        };
        this.activeAnimations['dance'] = {
            dansu: loadedAnimations.find(a => a.isDancing),
            powerup: loadedAnimations.find(a => a.isPowerUp),
        };
        this.activeAnimations['throw'] = {
            throw: loadedAnimations.find(a => a.isThrow),
        };
        /* crouchAnimations = {
          crouch: loadedAnimations.find(a => a.isCrouch),
        }; */
        this.activeAnimations['activate'] = {
            grab_forward: { animation: loadedAnimations.index['grab_forward.fbx'], speedFactor: 1.2 },
            grab_down: { animation: loadedAnimations.index['grab_down.fbx'], speedFactor: 1.7 },
            grab_up: { animation: loadedAnimations.index['grab_up.fbx'], speedFactor: 1.2 },
            grab_left: { animation: loadedAnimations.index['grab_left.fbx'], speedFactor: 1.2 },
            grab_right: { animation: loadedAnimations.index['grab_right.fbx'], speedFactor: 1.2 },
        };
        this.activeAnimations['narutoRun'] = {
            narutoRun: loadedAnimations.find(a => a.isNarutoRun),
        };
        {
            const down10QuaternionArray = new Quaternion()
                .setFromAxisAngle(new Vector3(1, 0, 0), Math.PI * 0.1)
                .toArray();
            [
                'mixamorigSpine1.quaternion',
                'mixamorigSpine2.quaternion',
            ].forEach(k => {
                this.activeAnimations.narutoRun.narutoRun.interpolants[k].evaluate = t => down10QuaternionArray;
            });
        }
    }
    
    addAnimation(tracked, name, func){
        // console.log(avatar, func);
        
        this.animations.set(name, func);

        StateMachine.getTracked(tracked).registerState ({
            name,
            animationFn:func.bind(this)
        }); 
            
            
        // this.animations.set('test', func.apply(this));
        // this.animations.get('test')();
    }


    getActiveAnimation(animation) {
        return this.activeAnimations[animation];
    }

    getIdleAnimation (key) {
        return this.animationsIdleArrays[key].animation
    }
/* const _getIdleAnimation = key => {
      if (key === 'walk' || key === 'run') {
        const name = animationsIdleArrays[key].name;
        return avatar.retargetedAnimations.find(a => a.name === name);
      } else {
        return animationsIdleArrays[key].animation;
      }
    }; */

    _clearXZ (dst, isPosition) {
        if (isPosition) {
            dst.x = 0;
            dst.z = 0;
        }
    };

    // makeAnimation(spec, model){
    //     const out = (now) => {
    //         const {
    //             animationTrackName,
    //             dst,
    //             // isTop,
    //             lerpFn,
    //             isPosition,
    //         } = spec;

    //         this.getHorizontalBlend(animationTrackName, lerpFn, isPosition, dst, model, now);
    //     };
    //     return out;
    // }
}

export const tmpAnimation = new AnimationFactory();
// const test2 = new AnimationFactory(spec, now, avatar);
// const newAni = tmpAnimation.makeAnimation();