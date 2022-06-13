import {MathUtils} from 'three';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer';
import {WebaverseAnimationNode} from './WebaverseAnimationNode';

class WebaverseAnimationNodeOverwrite extends WebaverseAnimationNode {
  constructor(name, mixer) {
    super(name, mixer);
    this.isWebaverseAnimationNodeOverwrite = true;

    this.factor = 0;

    this.isCrossFade = false;
    this.crossFadeDuration = 0;
    this.crossFadeTargetFactor = 0;
    this.crossFadeStartTime = 0;
  }

  addChild(node) {
    super.addChild(node);
    node.weight = 1; // in order to trigger `finished` event
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

    // do fade
    if (this.isCrossFade) {
      this.factor = (WebaverseAnimationMixer.timeS - this.crossFadeStartTime) / this.crossFadeDuration;
      this.factor = MathUtils.clamp(this.factor, 0, 1);
      if (this.crossFadeTargetFactor === 0) {
        this.factor = 1 - this.factor;
      }
      if (this.factor === this.crossFadeTargetFactor) this.isCrossFade = false;
    }

    // do blend
    const result = []; // todo: use value directly?
    const value0 = this.mixer.doBlend(this.children[0], spec);
    const value1 = this.mixer.doBlend(this.children[1], spec);
    WebaverseAnimationMixer.copyArray(result, value0);
    if (isTop) {
      WebaverseAnimationMixer.interpolateFlat(result, result, value1, this.factor);
    }

    return result;
  }

  crossFade(duration, targetFactor) { // targetFactor only support 0 | 1 now
    this.isCrossFade = true;
    this.crossFadeDuration = duration;
    this.crossFadeTargetFactor = targetFactor;
    this.crossFadeStartTime = WebaverseAnimationMixer.timeS;
  }
}

export {WebaverseAnimationNodeOverwrite};
