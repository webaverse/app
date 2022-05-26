import {} from 'three';

class AnimMotion {
  constructor(mixer, applyFn) {
    this.mixer = mixer;
    this.applyFn = applyFn;
  }

  play() {
    this.mixer.motion = this;
  }
}

export {AnimMotion};
