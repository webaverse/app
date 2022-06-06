import {AnimMixer} from './AnimMixer';
import {AnimNode} from './AnimNode';

class AnimNodeBlendList extends AnimNode {
  constructor(name) {
    super(name);
    this.isAnimNodeBlendList = true;
  }

  addChild(node) {
    this.children.push(node);
  }

  update(timeS, spec) {
    const result = []; // todo: resultBuffer ( refer to threejs );
    // let result;
    let nodeIndex = 0;
    let currentWeight = 0;
    for (let i = 0; i < this.children.length; i++) {
      const childNode = this.children[i];
      if (childNode.weight > 0) {
        const value = AnimMixer.doBlend(childNode, timeS, spec);
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
}

export {AnimNodeBlendList};
