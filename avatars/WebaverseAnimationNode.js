
import {EventDispatcher} from 'three';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer';

class WebaverseAnimationNode extends EventDispatcher {
  constructor(name, mixer) {
    super();
    this.isWebaverseAnimationNode = true;
    this.mixer = mixer;
    // this.type = 'blend2'; // other types: blendList
    this.children = [];
    // this.childrenWeights = [];
    this.parents = [];
    this.name = name;
    // this.weight = 1;

    // blend2
    this.fadeStartTime = 0;
  }

  doBlendList(spec) {
    // const {
    //   // animationTrackName: k,
    //   // dst,
    //   // lerpFn,
    //   boneName,
    //   isTop,
    //   // isPosition,
    //   // isArm,
    // } = spec;

    // // do fade
    // if (this.isCrossFade) {
    //   debugger
    //   let factor = (WebaverseAnimationMixer.timeS - this.crossFadeStartTime) / this.crossFadeDuration;
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
    // const result = []; // todo: resultBuffer ( refer to threejs );
    let result;
    // let result;
    let nodeIndex = 0;
    let currentWeight = 0;
    for (let i = 0; i < this.children.length; i++) {
      const childNode = this.children[i];
      const value = this.mixer.doBlend(childNode, spec);
      // if (childNode.weight > 0 && (isTop || boneName === 'Hips')) {
      if (childNode.weight > 0) {
        // if (childNode === window.avatar?.useMotiono?.bowDraw) {
        //   if (!isTop) continue;
        // }
        if (nodeIndex === 0) {
          // result = value; // todo: will change original data?
          // WebaverseAnimationMixer.copyArray(result, value);
          result = value;

          nodeIndex++;
          currentWeight = childNode.weight;
        } else {
          const t = childNode.weight / (currentWeight + childNode.weight);
          WebaverseAnimationMixer.interpolateFlat(result, result, value, t);

          nodeIndex++;
          currentWeight += childNode.weight;
        }
      }
    }
    // if (nodeIndex === 0) { // use children[0]'s value, if all weights are zero
    //   const value = this.mixer.doBlend(this.children[0], spec);
    //   WebaverseAnimationMixer.copyArray(result, value);
    // }
    return result;
  }

  addChild(node) {
    this.children.push(node);
    node.parents.push(this);
  }

  crossFade(duration) {
    this.fadeStartTime = performance.now(); // todo: use global timeS
    // todo:
  }
}

export {WebaverseAnimationNode};
