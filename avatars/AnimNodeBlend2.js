import {MathUtils} from 'three';
import {AnimMixer} from './AnimMixer';
import {AnimNode} from './AnimNode';

class AnimNodeBlend2 extends AnimNode {
  constructor(name) {
    super(name);
    this.isAnimNodeBlend2 = true;
    this.factor = 0;

    this.isCrossFade = false;
    this.crossFadeDuration = 0;
    this.crossFadeTargetFactor = 0;
    this.crossFadeStartTime = 0;
  }

  addChild(node) {
    this.children.push(node);
  }

  update(spec) {
    // do fade
    if (this.isCrossFade) {
      this.factor = (AnimMixer.timeS - this.crossFadeStartTime) / this.crossFadeDuration;
      this.factor = MathUtils.clamp(this.factor, 0, 1);
      if (this.crossFadeTargetFactor === 0) {
        this.factor = 1 - this.factor;
      }
      if (this.factor === this.crossFadeTargetFactor) this.isCrossFade = false;
    }

    // do blend
    const value0 = AnimMixer.doBlend(this.children[0], spec);
    const value1 = AnimMixer.doBlend(this.children[1], spec);
    const result = [];
    AnimMixer.copyArray(result, value0);
    AnimMixer.interpolateFlat(result, result, value1, this.factor);
    return result;
  }

  crossFade(duration, targetFactor) { // targetFactor only support 0 | 1 now
    this.isCrossFade = true;
    this.crossFadeDuration = duration;
    this.crossFadeTargetFactor = targetFactor;
    this.crossFadeStartTime = AnimMixer.timeS;
  }
}

export {AnimNodeBlend2};
