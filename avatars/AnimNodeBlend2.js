import { AnimMixer } from './AnimMixer';
import { AnimNode } from './AnimNode';

class AnimNodeBlend2 extends AnimNode {
  constructor(name) {
    super(name);
    this.isAnimNodeBlend2 = true;
    this.factor = 0;
  }

  addChild(node) {
    this.children.push(node);
  }

  doBlend(timeS, spec) {
    const value0 = AnimMixer.doBlend(this.children[0], timeS, spec);
    const value1 = AnimMixer.doBlend(this.children[1], timeS, spec);
    const result = [];
    AnimMixer.copyArray(result, value0);
    AnimMixer.interpolateFlat(result, result, value1, this.factor);
    return result;
  }

  crossFade(duration) {
    // todo:
  }
}

export {AnimNodeBlend2};
