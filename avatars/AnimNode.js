
class AnimNode {
  constructor(name, mixer) {
    this.isAnimNode = true;
    this.mixer = mixer;
    this.type = 'blend2'; // other types: blendList
    this.children = [];
    this.name = name;
    this.weight = 1;

    // blend2
    this.fadeStartTime = 0;
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
