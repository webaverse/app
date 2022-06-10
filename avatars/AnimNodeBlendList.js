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
    // // do fade
    // if (this.isCrossFade) {
    //   debugger
    //   let factor = (AnimMixer.timeS - this.crossFadeStartTime) / this.crossFadeDuration;
    //   factor = MathUtils.clamp(factor, 0, 1);
    //   if (this.crossFadeTargetFactor === 0) {
    //     factor = 1 - factor;
    //   }

    //   for (let i = 0; i < this.children.length; i++) {
    //     const childNode = this.children[i];
    //     if (childNode === this.crossFadeTargetNode) {
    //       childNode.weight = factor;
    //     } else if (this.crossFadeTargetFactor === 1) {
    //       childNode.weight = Math.min(childNode.weight, 1 - factor);
    //     }
    //   }

    //   if (factor === this.crossFadeTargetFactor) this.isCrossFade = false;
    // }

    // do blend
    const result = []; // todo: resultBuffer ( refer to threejs );
    // let result;
    let nodeIndex = 0;
    let currentWeight = 0;
    for (let i = 0; i < this.children.length; i++) {
      const childNode = this.children[i];
      const value = this.mixer.doBlend(childNode, spec);
      if (childNode.weight > 0) {
        if (nodeIndex === 0) {
          // result = value; // todo: will change original data?
          AnimMixer.copyArray(result, value);

          nodeIndex++;
          currentWeight = childNode.weight;
        } else {
          const t = childNode.weight / (currentWeight + childNode.weight);
          AnimMixer.interpolateFlat(result, result, value, t);

          nodeIndex++;
          currentWeight += childNode.weight;
        }
      }
    }
    // if (nodeIndex === 0) { // use children[0]'s value, if all weights are zero
    //   const value = this.mixer.doBlend(this.children[0], spec);
    //   AnimMixer.copyArray(result, value);
    // }
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
