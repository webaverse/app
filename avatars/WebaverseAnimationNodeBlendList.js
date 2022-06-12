import {MathUtils} from 'three';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer';
import {WebaverseAnimationNode} from './WebaverseAnimationNode';

class WebaverseAnimationNodeBlendList extends WebaverseAnimationNode {
  constructor(name, mixer) {
    super(name, mixer);
    this.isAnimNodeBlendList = true;

    // this.isCrossFade = false;
    // this.crossFadeDuration = 0;
    // this.crossFadeTargetFactor = 0;
    // this.crossFadeStartTime = 0;
    // this.crossFadeTargetNode = null;
  }

  update(spec) {
    // do blend
    const result = this.doBlendList(spec);
    return result;
  }

  // crossFade(duration, targetFactor, targetNode) { // targetFactor only support 0 | 1 now
  //   this.isCrossFade = true;
  //   this.crossFadeDuration = duration;
  //   this.crossFadeStartTime = WebaverseAnimationMixer.timeS;
  //   this.crossFadeTargetFactor = targetFactor;
  //   this.crossFadeTargetNode = targetNode;
  // }
}

export {WebaverseAnimationNodeBlendList};
