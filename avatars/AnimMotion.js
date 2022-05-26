import {} from 'three';

class AnimMotion {
  constructor(mixer, clip) {
    this.mixer = mixer;
    this.clip = clip;
  }

  play() {
    this.mixer.motion = this;
  }
}

export {AnimMotion};
