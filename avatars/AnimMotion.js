import {LoopRepeat} from 'three';

class AnimMotion {
  constructor(mixer, clip) {
    this.mixer = mixer;
    this.clip = clip;
    this.name = this.clip.name;
    this.weight = 1; // todo: move to AnimNode.

    // default values same as THREE.AnimationAction.
    this.loop = LoopRepeat;
    this.clampWhenFinished = false;
  }

  play() {
    // this.mixer.motion = this;
    this.mixer.motions.push(this);
  }

  stop() {
    this.mixer.motions.splice(this.mixer.motions.indexOf(this), 1);
  }
}

export {AnimMotion};
