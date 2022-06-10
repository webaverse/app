import {LoopOnce, LoopRepeat} from 'three';
import {AnimMixer} from './AnimMixer';

class AnimMotion {
  constructor(mixer, animation) {
    this.isAnimMotion = true;

    this.time = 0;
    this.startTime = 0;

    this.mixer = mixer;
    this.animation = animation;
    this.name = this.animation.name;
    this.weight = 1; // todo: move to AnimNode?
    this.lastWeight = null;
    this.timeBias = 0;
    this.speed = 1;
    this.isFinished = false;

    // default values same as THREE.AnimationAction.
    this.loop = LoopRepeat;
    this.clampWhenFinished = false;

    // always play
    this.mixer.motions.push(this);
  }

  update(spec) {
    const {
      animationTrackName: k,
      isFirstBone,
      isLastBone,
    } = spec;

    if (isFirstBone) {
      this.time = AnimMixer.timeS - this.startTime;
      // if (this === window.avatar?.jumpMotion) console.log(this.time);
      // if (this === window.avatar?.jumpMotion) console.log(this.weight);
    }

    const animation = this.animation;
    const src = animation.interpolants[k];
    let value;
    if (this.loop === LoopOnce) {
      const evaluateTimeS = this.time / this.speed + this.timeBias;
      value = src.evaluate(evaluateTimeS);
      // if (isLastBone && this.weight > 0 && !this.isFinished && evaluateTimeS >= this.animation.duration) {
      //   // console.log('finished', this.name);
      //   this.mixer.dispatchEvent({
      //     type: 'finished',
      //     motion: this,
      //   });

      //   this.isFinished = true;
      // }
    } else {
      value = src.evaluate((AnimMixer.timeS / this.speed + this.timeBias) % animation.duration);
    }

    if (this.lastWeight > 0 && this.weight <= 0) {
      this.mixer.dispatchEvent({
        type: 'stopped',
        motion: this,
      });
    }
    this.lastWeight = this.weight;

    return value;
  }

  play() {
    // // this.mixer.motion = this;
    // this.mixer.motions.push(this);
    this.weight = Math.abs(this.weight);

    this.startTime = AnimMixer.timeS;

    this.isFinished = false;
  }

  stop() {
    // this.mixer.motions.splice(this.mixer.motions.indexOf(this), 1);
    this.weight = -Math.abs(this.weight);
  }
}

export {AnimMotion};
