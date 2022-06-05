
class AnimNode {
  constructor() {
    this.isAnimNode = true;
    this.type = 'blend2'; // other types: blendList
    this.children = [];
  }

  addChild(node) {
    this.children.push(node);
  }

  crossFade(duration) {
    // todo:
  }
}

export {AnimNode};
