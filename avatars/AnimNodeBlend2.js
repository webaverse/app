import { MathUtils } from 'three';
import { AnimMixer } from './AnimMixer';
import { AnimNode } from './AnimNode';

class AnimNodeBlend2 extends AnimNode {
  constructor(name) {
    super(name);
    this.isAnimNodeBlend2 = true;
    this.factor = 0;
    this.timeS = 0;

    this.isCrossFade = false;
    this.crossFadeDuration = 0;
    this.crossFadeTargetFactor = 0;
    this.crossFadeStartTime = 0;
  }

  addChild(node) {
    this.children.push(node);
  }

  update(timeS, spec) {
    this.timeS = timeS;
    // if (spec.isPosition && this === window.avatar?.jumpNode) console.log(this.isCrossFade);
    // if (spec.isPosition && this === window.avatar?.jumpNode) console.log(timeS);
    if (spec.isPosition && this === window.avatar?.jumpNode) console.log(this.factor);

    if (this.isCrossFade) {
      this.factor = (timeS - this.crossFadeStartTime) / this.crossFadeDuration;
      this.factor = MathUtils.clamp(this.factor, 0, 1);
      if (this.crossFadeTargetFactor === 0) {
        this.factor = 1 - this.factor;
      }
      if (this.factor === this.crossFadeTargetFactor) this.isCrossFade = false;
    }

    const value0 = AnimMixer.doBlend(this.children[0], timeS, spec);
    const value1 = AnimMixer.doBlend(this.children[1], timeS, spec);
    const result = [];
    AnimMixer.copyArray(result, value0);
    AnimMixer.interpolateFlat(result, result, value1, this.factor);
    return result;
  }

  crossFade(duration, targetFactor) { // targetFactor only support 0 | 1 now
    this.isCrossFade = true;
    this.crossFadeDuration = duration;
    this.crossFadeTargetFactor = targetFactor;
    this.crossFadeStartTime = this.timeS;
  }
}

export {AnimNodeBlend2};
