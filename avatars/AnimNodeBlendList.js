import {MathUtils} from 'three';
import {AnimMixer} from './AnimMixer';
import {AnimNode} from './AnimNode';

class AnimNodeBlendList extends AnimNode {
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

export {AnimNodeBlendList};
