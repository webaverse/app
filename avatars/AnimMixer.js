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

  doBlend(node, timeSeconds, spec) {
    const {
      animationTrackName: k,
      dst,
      // isTop,
      isPosition,
    } = spec;

    if (window.isDebugger) debugger

    if (node.isAnimMotion) {
      const motion = node;
      const clip = motion.clip;
      const src = clip.interpolants[k];
      const value = src.evaluate(timeSeconds % clip.duration);
      return value;
    } else if (node.children.length > 0) {
      const result = []; // todo: resultBuffer ( refer to threejs );
      // let result;
      let nodeIndex = 0;
      let currentWeight = 0;
      for (let i = 0; i < node.children.length; i++) {
        const childNode = node.children[i];
        const value = this.doBlend(childNode, timeSeconds, spec);
        if (nodeIndex === 0) {
          // result = value; // todo: will change original data?
          copyArray(result, value);

          nodeIndex++;
          currentWeight = childNode.weight;
        } else if (childNode.weight > 0) { // todo: handle weight < 0 ?
          const t = childNode.weight / (currentWeight + childNode.weight);
          interpolateFlat(result, result, value, t);

          nodeIndex++;
          currentWeight += childNode.weight;
        }
      }
      return result;
    }
  }

  update(timeSeconds, animTree) {
    for (const spec of this.avatar.animationMappings) {
      const {
        animationTrackName: k,
        dst,
        // isTop,
        isPosition,
      } = spec;

      const result = this.doBlend(animTree, timeSeconds, spec);

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

  updateOldBlendList(timeSeconds = performance.now() / 1000) {
    for (const spec of this.avatar.animationMappings) {
      const {
        animationTrackName: k,
        dst,
        // isTop,
        isPosition,
      } = spec;

      const result = [];
      let motionIndex = 0;
      let currentWeight = 0;
      if (window.isDebugger) debugger;
      for (let i = 0; i < this.motions.length; i++) {
        const motion = this.motions[i];
        const clip = motion.clip;
        const src = clip.interpolants[k];
        const value = src.evaluate(timeSeconds % clip.duration);
        if (motionIndex === 0) {
          copyArray(result, value);

          motionIndex++;
          currentWeight = motion.weight;
        } else if (motion.weight > 0) { // todo: handle weight < 0 ?
          const t = motion.weight / (currentWeight + motion.weight);
          interpolateFlat(result, result, value, t);

          motionIndex++;
          currentWeight += motion.weight;
        }
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
