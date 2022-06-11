import {MathUtils} from 'three';
import {WebaverseAnimationMixer} from './WebaverseAnimationMixer';
import {WebaverseAnimationNode} from './WebaverseAnimationNode';

class WebaverseAnimationNodeBlendList extends WebaverseAnimationNode {
  constructor(name, mixer) {
    super(name, mixer);
    this.isAnimNodeBlendList = true;
  }

  addChild(node) {
    this.children.push(node);
  }

  update(spec) {
    // do blend
    const result = this.doBlendList(spec);
    return result;
  }
}

export {WebaverseAnimationNodeBlendList};
