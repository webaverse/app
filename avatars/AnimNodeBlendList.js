import { AnimNode } from './AnimNode';

class AnimNodeBlendList extends AnimNode {
  constructor(name) {
    super(name);
    this.isAnimNodeBlendList = true;
  }

  addChild(node) {
    this.children.push(node);
  }
  
  update() {

  }
}

export {AnimNodeBlendList};
