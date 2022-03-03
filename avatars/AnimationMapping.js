export default class AnimationMapping {
  constructor(animationTrackName, boneName, isTop, isPosition) {
    this.animationTrackName = animationTrackName;
    this.boneName = boneName;
    this.isTop = isTop;
    this.isPosition = isPosition;
    this.dst = undefined;
    this.lerpFn = undefined;
  }

  clone() {
    return new AnimationMapping(this.animationTrackName, this.boneName, this.isTop, this.isPosition);
  }
}
