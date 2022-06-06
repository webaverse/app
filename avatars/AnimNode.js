
class AnimNode {
  constructor(name) {
    this.isAnimNode = true;
    this.type = 'blend2'; // other types: blendList
    this.children = [];
    this.name = name;
    this.weight = 1;
  }

  addChild(node) {
    this.children.push(node);
  }

  crossFade(duration) {
    // todo:
  }
}

export {AnimNode};
