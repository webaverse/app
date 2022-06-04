import {EventDispatcher, Vector3, Quaternion} from 'three';
import {AnimMotion} from './AnimMotion.js';

const localVector = new Vector3();
const localQuaternion = new Quaternion();

const copyArray = (dst, src) => {
  for (let i = 0; i < src.length; i++) {
    dst[i] = src[i];
  }
}

// todo: Add to our custom three.js build if this PR get merged https://github.com/mrdoob/three.js/pull/23975
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

const interpolateFlat = (dst, src0, src1, t) => {
  if (dst.length === 3) {
    Vector3.lerpFlat(dst, 0, src0, 0, src1, 0, t);
  } else {
    Quaternion.slerpFlat(dst, 0, src0, 0, src1, 0, t);
  }
};
class AnimMixer extends EventDispatcher {
  constructor(avatar) {
    super();
    this.avatar = avatar;
    this.motion = null;
    this.motions = [];
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
          interpolateFlat(result, result, blendee.arr, t);
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

      const result = [];
      let count = 0;
      if (window.isDebugger) debugger;
      for (let i = 0; i < this.motions.length; i++) {
        const motion = this.motions[i];
        const clip = motion.clip;
        const src = clip.interpolants[k];
        const value = src.evaluate(timeSeconds % clip.duration);
        if (count === 0) {
          copyArray(result, value);
        } else {
          const t = 1 / (count + 1);
          interpolateFlat(result, result, value, t);
        }
        count++;
      }

      if (isPosition) { // _clearXZ
        result[0] = 0;
        result[2] = 0;
      }

      dst.fromArray(result);

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
