import {EventDispatcher, Vector3, Quaternion, LoopOnce} from 'three';
import {AnimMotion} from './AnimMotion.js';

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
class AnimMixer extends EventDispatcher {
  constructor(avatar) {
    super();
    this.avatar = avatar;
    this.motion = null;
    this.motions = [];
    this.yBias = 0;
  }

  createMotion(animation) {
    const motion = new AnimMotion(this, animation);
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

  static doBlend(node, spec) {
    const {
      animationTrackName: k,
    } = spec;

    if (node.isAnimMotion) { // todo: do not evaluate weight <= 0
      const motion = node;
      motion.update(); // todo: now update 57 times!
      const animation = motion.animation;
      const src = animation.interpolants[k];
      let value;
      if (motion.loop === LoopOnce) {
        value = src.evaluate(motion.time / motion.speed + motion.timeBias);
      } else {
        value = src.evaluate((AnimMixer.timeS / motion.speed + motion.timeBias) % animation.duration);
      }
      return value;
    } else if (node.isAnimNode) {
      const result = node.update(spec);
      return result;
    }
  }

  update(timeS, animTree) {
    AnimMixer.timeS = timeS;
    for (const spec of this.avatar.animationMappings) {
      const {
        animationTrackName: k,
        dst,
        // isTop,
        isPosition,
      } = spec;

      const result = AnimMixer.doBlend(animTree, spec);

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
AnimMixer.timeS = 0;

export {AnimMixer};
