
import {EventDispatcher} from 'three';
import {AnimMixer} from './AnimMixer';

class AnimNode extends EventDispatcher {
  constructor(name, mixer) {
    super();
    this.isAnimNode = true;
    this.mixer = mixer;
    this.type = 'blend2'; // other types: blendList
    this.children = [];
    this.name = name;
    this.weight = 1;

    // blend2
    this.fadeStartTime = 0;
  }

  doBlendList(spec) {
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

  addChild(node) {
    this.children.push(node);
  }

  crossFade(duration) {
    this.fadeStartTime = performance.now(); // todo: use global timeS
    // todo:
  }
}

export {AnimNode};
