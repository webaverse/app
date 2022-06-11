import {MathUtils} from 'three';
import {AnimMixer} from './AnimMixer';
import {AnimNode} from './AnimNode';

class AnimNodeBlendList extends AnimNode {
  constructor(name, mixer) {
    super(name, mixer);
    this.isAnimNodeBlendList = true;

    // this.isCrossFade = false;
    // this.crossFadeDuration = 0;
    // this.crossFadeTargetFactor = 0;
    // this.crossFadeStartTime = 0;
    // this.crossFadeTargetNode = null;
  }

  addChild(node) {
    this.children.push(node);
  }

  update(spec) {
    // do blend
    const result = this.doBlendList(spec);
    return result;
  }

  // crossFade(duration, targetFactor, targetNode) { // targetFactor only support 0 | 1 now
  //   this.isCrossFade = true;
  //   this.crossFadeDuration = duration;
  //   this.crossFadeStartTime = AnimMixer.timeS;
  //   this.crossFadeTargetFactor = targetFactor;
  //   this.crossFadeTargetNode = targetNode;
  // }
}

export {AnimNodeBlendList};
