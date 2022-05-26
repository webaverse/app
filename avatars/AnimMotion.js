import {LoopRepeat} from 'three';

class AnimMotion {
  constructor(mixer, clip) {
    this.mixer = mixer;
    this.clip = clip;

    // default values same as THREE.AnimationAction.
    this.loop = LoopRepeat;
    this.clampWhenFinished = false;
  }

  play() {
    this.mixer.motion = this;
  }
}

export {AnimMotion};
