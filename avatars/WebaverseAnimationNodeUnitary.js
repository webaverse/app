import {MathUtils} from 'three';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer';
import {WebaverseAnimationNode} from './WebaverseAnimationNode';

class WebaverseAnimationNodeUnitary extends WebaverseAnimationNode {
  constructor(name, mixer) {
    super(name, mixer);
    this.isAnimNodeBlend2 = true;
    this.activeNode = null;

    this.isCrossFade = false;
    this.crossFadeDuration = 0;
    this.crossFadeStartTime = 0;
  }

  addChild(node) {
    super.addChild(node);

    if (this.children.length === 1) {
      this.activeNode = node;
      node.weight = 1;
    } else {
      node.weight = 0;
    }
  }

  update(spec) {
    // do fade
    if (this.isCrossFade) {
      let factor = (WebaverseAnimationMixer.timeS - this.crossFadeStartTime) / this.crossFadeDuration;
      factor = MathUtils.clamp(factor, 0, 1);
      const factorReverse = 1 - factor;

      for (let i = 0; i < this.children.length; i++) {
        const childNode = this.children[i];
        if (childNode === this.activeNode) {
          childNode.weight = factor;
        // } else if (childNode === this.lastActiveNode) {
        //   childNode.weight = factorReverse;
        } else { // ensure unitary
          childNode.weight = Math.min(childNode.weight, factorReverse);
        }
      }

      if (factor === 1) {
        this.isCrossFade = false;
      }
    }

    // do blend
    const result = this.doBlendList(spec);
    return result;
  }

  crossFadeTo(duration, targetNode) {
    if (targetNode === this.activeNode) return;
    this.isCrossFade = true;
    this.crossFadeDuration = duration;
    this.crossFadeStartTime = WebaverseAnimationMixer.timeS;

    // this.dispatchEvent({
    //   type: 'switch',
    //   from: this.activeNode,
    //   to: this.targetNode,
    // });

    // this.lastActiveNode = this.activeNode;
    this.activeNode = targetNode;
  }
}

export {WebaverseAnimationNodeUnitary};
