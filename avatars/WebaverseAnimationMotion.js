import {LoopOnce, LoopRepeat} from 'three';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer';
import physx from '../physx.js';

class WebaverseAnimationMotion {
  constructor(mixer, animation) {
    this.isWebaverseAnimationMotion = true;

    this.parents = [];

    this.time = 0;
    this.startTime = 0;

    this.mixer = mixer;
    this.animation = animation;
    this.name = this.animation.name;
    this.weight = 1; // todo: move to WebaverseAnimationNode?
    // this.lastWeight = null;
    this.timeBias = 0;
    this.speed = 1;
    this.isFinished = false;

    // default values same as THREE.AnimationAction.
    this.loop = LoopRepeat;
    this.clampWhenFinished = false;

    // // always play
    // this.mixer.motions.push(this);
  }

  update(spec) {
    const {
      animationTrackName: k,
      isFirstBone,
      isLastBone,
      index,
    } = spec;

    if (window.isDebugger) debugger;
    // if (k === 'mixamorigRightHandThumb1.quaternion') debugger

    if (isFirstBone) {
      this.time = WebaverseAnimationMixer.timeS - this.startTime;
      // if (this === window.avatar?.jumpMotion) console.log(this.time);
      // if (this === window.avatar?.jumpMotion) console.log(this.weight);
    }

    const animation = this.animation;
    // const src = animation.interpolants[k];
    let value;
    if (this.loop === LoopOnce) {
      const evaluateTimeS = this.time / this.speed + this.timeBias;
      // value = src.evaluate(evaluateTimeS);
      value = physx.physxWorker.evaluateAnimationPhysics(physx.physics, this.animation.index, index, evaluateTimeS);
      if (isLastBone && this.weight > 0 && !this.isFinished && evaluateTimeS >= this.animation.duration) {
        // console.log('finished', this.name);
        this.mixer.dispatchEvent({
          type: 'finished',
          motion: this,
        });

        this.isFinished = true;
      }
    } else {
      const evaluateTimeS = (WebaverseAnimationMixer.timeS / this.speed + this.timeBias) % animation.duration;
      // value = src.evaluate(evaluateTimeS);
      // if (k === 'mixamorigHips.position') console.log(this.animation.name, evaluateTimeS); // todo: why walking.fbx & treading water.fbx when avatar.walkFlyNode.factor === 0
      if (k === 'mixamorigHips.position') console.log(this.animation.name); // todo: why walking.fbx & treading water.fbx when avatar.walkFlyNode.factor === 0
      // if (k === 'mixamorigHips.position') debugger; // todo: why walking.fbx & treading water.fbx when avatar.walkFlyNode.factor === 0
      value = physx.physxWorker.evaluateAnimationPhysics(physx.physics, this.animation.index, index, evaluateTimeS);
    }

    // if (this.lastWeight > 0 && this.weight <= 0) {
    //   this.mixer.dispatchEvent({
    //     type: 'stopped',
    //     motion: this,
    //   });
    // }
    // this.lastWeight = this.weight;

    return value;
  }

  play() {
    // // this.mixer.motion = this;
    // this.mixer.motions.push(this);
    this.weight = Math.abs(this.weight);

    this.startTime = WebaverseAnimationMixer.timeS;

    this.isFinished = false;
  }

  stop() {
    // this.mixer.motions.splice(this.mixer.motions.indexOf(this), 1);
    this.weight = -Math.abs(this.weight);
  }
}

export {WebaverseAnimationMotion};
