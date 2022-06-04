import {EventDispatcher, Vector3, Quaternion} from 'three';
import {AnimMotion} from './AnimMotion.js';

const interpolateFlat = (dst, src0, src1, t, isPosition) => {
  if (!isPosition) {
    Quaternion.slerpFlat(dst, 0, src0, 0, src1, 0, t);
  } else {
    Vector3.lerpFlat(dst, 0, src0, 0, src1, 0, t);
  }
};
class AnimMixer extends EventDispatcher {
  constructor(avatar) {
    super();
    this.avatar = avatar;
    this.motion = null;
    this.yBias = 0;
  }

  createMotion(clip) {
    const motion = new AnimMotion(this, clip);
    return motion;
  }

  _doBlend(blendNode, spec) {
    if (typeof blendNode === 'function') {
      const applyFn = blendNode;
      return applyFn(spec);
    } else if (blendNode.children.length > 0) {
      const {
        isPosition,
      } = spec;
      let blendee = this._doBlend(blendNode.children[0], spec);
      const result = blendee.arr;
      let currentWeight = blendee.weight;
      for (let i = 1; i < blendNode.children.length; i++) {
        if (!blendNode.children[i]) continue;
        blendee = this._doBlend(blendNode.children[i], spec);
        if (blendee.weight > 0) {
          const t = blendee.weight / (currentWeight + blendee.weight);
          interpolateFlat(result, result, blendee.arr, t, isPosition);
          currentWeight += blendee.weight;
        }
      }
      return { // blendee
        arr: result,
        weight: blendNode.weight,
      };
    }
  }

  update(timeSeconds = performance.now() / 1000) {
    for (const spec of this.avatar.animationMappings) {
      const {
        animationTrackName: k,
        dst,
        // isTop,
        isPosition,
      } = spec;

      const clip = this.motion.clip;
      const src = clip.interpolants[k];
      const value = src.evaluate(timeSeconds % clip.duration);

      if (isPosition) { // _clearXZ
        value[0] = 0;
        value[2] = 0;
      }

      dst.fromArray(value);

      // applyFn(spec);
      // _blendFly(spec);
      // _blendActivateAction(spec);

      // ignore all animation position except y
      if (isPosition) {
        if (!this.avatar.jumpState) {
          // animations position is height-relative
          dst.y *= this.avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
        } else {
          // force height in the jump case to overide the animation
          dst.y = this.avatar.height * 0.55;
        }
      }
    }
  }
}

export {AnimMixer};
