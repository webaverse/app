import {EventDispatcher} from 'three';
import {AnimMotion} from './AnimMotion.js';

class AnimMixer extends EventDispatcher {
  constructor(avatar) {
    super();
    this.avatar = avatar;
    this.motion = null;
  }

  createMotion(applyFn) {
    const motion = new AnimMotion(this, applyFn);
    return motion;
  }

  update() {
  }
}

export {AnimMixer};
