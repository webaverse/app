import {EventDispatcher, Vector3, Quaternion, LoopOnce} from 'three';
import {WebaverseAnimationMotion} from './WebaverseAnimationMotion.js';

// todo: Add to custom three.js build
Vector3.lerpFlat = (dst, dstOffset, src0, srcOffset0, src1, srcOffset1, alpha) => {
  const x0 = src0[srcOffset0 + 0];
  const y0 = src0[srcOffset0 + 1];
  const z0 = src0[srcOffset0 + 2];

  const x1 = src1[srcOffset1 + 0];
  const y1 = src1[srcOffset1 + 1];
  const z1 = src1[srcOffset1 + 2];

  dst[dstOffset + 0] = x0 + (x1 - x0) * alpha;
  dst[dstOffset + 1] = y0 + (y1 - y0) * alpha;
  dst[dstOffset + 2] = z0 + (z1 - z0) * alpha;
};
class WebaverseAnimationMixer extends EventDispatcher {
  constructor(avatar) {
    super();
    this.avatar = avatar;
    this.motion = null;
    this.motions = [];
    this.yBias = 0;
  }

  createMotion(animation) {
    const motion = new WebaverseAnimationMotion(this, animation);
    return motion;
  }

  static copyArray(dst, src) {
    for (let i = 0; i < src.length; i++) {
      dst[i] = src[i];
    }
  }

  static interpolateFlat(dst, src0, src1, t) {
    if (dst.length === 3) {
      Vector3.lerpFlat(dst, 0, src0, 0, src1, 0, t);
    } else {
      Quaternion.slerpFlat(dst, 0, src0, 0, src1, 0, t);
    }
  }

  doBlend(node, spec) {
    // const {
    //   animationTrackName: k,
    //   dst,
    //   // isTop,
    //   isPosition,
    //   isFirstBone,
    //   isLastBone,
    // } = spec;

    // if (window.isDebugger) debugger;

    if (node.isWebaverseAnimationMotion) { // todo: do not evaluate weight <= 0
      const motion = node;
      // if (isPosition && motion === window.avatar?.jumpMotion) debugger;
      // if (isFirstBone) motion.update(spec);
      const value = motion.update(spec);
      // if (isPosition && motion === window.avatar?.activateMotion) console.log(motion.time);
      // if (isPosition && motion === window.avatar?.jumpMotion) console.log(motion.weight);
      // if (isPosition && motion === window.avatar?.activateMotion) console.log(motion.weight);
      return value;
    } else if (node.isAnimNode) {
      const result = node.update(spec);
      return result;
    }
  }

  update(timeS, animTree) {
    WebaverseAnimationMixer.timeS = timeS;
    for (const spec of this.avatar.animationMappings) {
      const {
        animationTrackName: k,
        dst,
        // isTop,
        isPosition,
      } = spec;

      const result = this.doBlend(animTree, spec);

      if (isPosition) { // _clearXZ
        result[0] = 0;
        result[2] = 0;
      }

      dst.fromArray(result);

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
WebaverseAnimationMixer.timeS = 0;

export {WebaverseAnimationMixer};
