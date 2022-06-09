import {LoopRepeat} from 'three';
import {AnimMixer} from './AnimMixer';

class AnimMotion {
  constructor(mixer, animation) {
    this.isAnimMotion = true;

    this.time = 0;
    this.startTime = 0;

    this.mixer = mixer;
    this.animation = animation;
    this.name = this.animation.name;
    this.weight = 1; // todo: move to AnimNode.
    this.timeBias = 0;
    this.speed = 1;
    this.isFinished = false;

    // default values same as THREE.AnimationAction.
    this.loop = LoopRepeat;
    this.clampWhenFinished = false;

    // always play
    this.mixer.motions.push(this);
  }

  update() {
    this.time = AnimMixer.timeS - this.startTime;
    // if (this === window.avatar?.jumpMotion) console.log(this.time);
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
