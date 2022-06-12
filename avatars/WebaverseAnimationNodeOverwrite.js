import {MathUtils} from 'three';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer';
import {WebaverseAnimationNode} from './WebaverseAnimationNode';

class WebaverseAnimationNodeOverwrite extends WebaverseAnimationNode {
  constructor(name, mixer) {
    super(name, mixer);
    this.isWebaverseAnimationNodeOverwrite = true;
  }

  update(spec) {
    const {
      animationTrackName: k,
      dst,
      isTop,
      isPosition,
      isFirstBone,
      isLastBone,
    } = spec;

    // debugger

    // do blend
    let value;
    if (isTop) {
      value = this.mixer.doBlend(this.children[1], spec);
    } else {
      value = this.mixer.doBlend(this.children[0], spec);
    }
    const result = []; // todo: use value directly?
    WebaverseAnimationMixer.copyArray(result, value);

    return result;
  }
}

export {WebaverseAnimationNodeOverwrite};
