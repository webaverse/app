import {MathUtils} from 'three';
import {AnimMixer} from './AnimMixer';
import {AnimNode} from './AnimNode';

class AnimNodeUnitary extends AnimNode {
  constructor(name) {
    super(name);
    this.isAnimNodeBlend2 = true;
    this.activeNode = null;

    this.isCrossFade = false;
    this.crossFadeDuration = 0;
    this.crossFadeTargetNode = 0;
    this.crossFadeStartTime = 0;
  }

  addChild(node) {
    this.children.push(node);
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
      let factor = (AnimMixer.timeS - this.crossFadeStartTime) / this.crossFadeDuration;
      factor = MathUtils.clamp(factor, 0, 1);

      this.crossFadeTargetNode.weight = factor;
      this.activeNode.weight = 1 - factor;

      if (factor === 1) {
        this.isCrossFade = false;
        this.activeNode = this.crossFadeTargetNode;
      }
    }

    // do blend
    const result = []; // todo: resultBuffer ( refer to threejs );
    // let result;
    let nodeIndex = 0;
    let currentWeight = 0;
    for (let i = 0; i < this.children.length; i++) {
      const childNode = this.children[i];
      if (childNode.weight > 0) {
        const value = AnimMixer.doBlend(childNode, spec);
        if (nodeIndex === 0) {
          // result = value; // todo: will change original data?
          AnimMixer.copyArray(result, value);

          nodeIndex++;
          currentWeight = childNode.weight;
        } else if (childNode.weight > 0) { // todo: handle weight < 0 ?
          const t = childNode.weight / (currentWeight + childNode.weight);
          AnimMixer.interpolateFlat(result, result, value, t);

          nodeIndex++;
          currentWeight += childNode.weight;
        }
      }
    }
    return result;
  }

  crossFadeTo(duration, targetNode) {
    if (targetNode === this.activeNode) return;
    this.isCrossFade = true;
    this.crossFadeDuration = duration;
    this.crossFadeTargetNode = targetNode;
    this.crossFadeStartTime = AnimMixer.timeS;
  }
}

export {AnimNodeUnitary};
