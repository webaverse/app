import {EventDispatcher, Vector3, Quaternion, LoopOnce} from 'three';
import {WebaverseAnimationMotion} from './WebaverseAnimationMotion.js';

const localVector = new Vector3();
const localQuaternion = new Quaternion();

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
class WebaverseAnimationMixer extends EventDispatcher {
  constructor(avatar) {
    super();
    this.isWebaverseAnimationMixer = true;
    this.avatar = avatar;
    this.motion = null;
    this.motions = [];
    this.nodes = [];
    this.yBias = 0;
  }

  createMotion(animation) {
    // if (animation.name === 'bow idle.fbx') debugger;
    const motion = new WebaverseAnimationMotion(this, animation);
    this.motions.push(motion);
    return motion;
  }

  createNode(NodeClass, name, argo) {
    const node = new NodeClass(name, this, argo);
    this.nodes.push(node);
    return node;
  }

  checkParents() {
    this.motions.forEach((motion, i) => {
      if (motion.parents.length > 1) {
        console.log('multi-parents: motion:', motion.name, i);
      }
    });
    this.nodes.forEach((node, i) => {
      if (node.parents.length > 1) {
        console.log('multi-parents: node:', node.name, i);
      }
    });
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
    } else if (node.isWebaverseAnimationNode) {
      const result = node.update(spec);
      return result;
    }
  }

  update(timeS, animTree) {
    // const values = window.physx.physxWorker.getAnimationValues(window.animations.index['walking.fbx'].index, timeS % window.animations.index['walking.fbx'].duration);
    // const t = timeS % window.avatar.flyMotion.animation.duration;
    // console.log(t);
    // console.log(timeS);
    const values = window.physx.physxWorker.updateAnimationMixer(timeS, window.f);
    // debugger
    let index = 0;
    for (const spec of this.avatar.animationMappings) {
      const {
        animationTrackName: k,
        dst,
        // isTop,
        isPosition,
      } = spec;

      const result = values[index];

      if (isPosition) { // _clearXZ
        result[0] = 0;
        result[2] = 0;
      }

      dst.fromArray(result);

      if (isPosition) {
        dst.y *= this.avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
      }

      index++;
    }

    const finishedFlag = values[53];
    if (finishedFlag) {
      const motion = values[54];
      this.dispatchEvent({
        type: 'finished',
        motion,
      });
    }

    return;

    WebaverseAnimationMixer.timeS = timeS;
    for (const spec of this.avatar.animationMappings) {
      const {
        animationTrackName: k,
        dst,
        // isTop,
        isPosition,
      } = spec;

      // debugger

      const result = this.doBlend(animTree, spec);

      if (isPosition) { // _clearXZ
        result[0] = 0;
        result[2] = 0;

        // result[1] = 1; // test
      }

      dst.fromArray(result);

      // applyFn(spec);
      // _blendFly(spec);
      // _blendActivateAction(spec);

      // // ignore all animation position except y
      // if (isPosition) {
      //   if (!this.avatar.jumpState && !this.avatar.flyState) {
      //     // animations position is height-relative
      //     dst.y *= this.avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
      //   } else {
      //     // force height in the jump case to overide the animation
      //     dst.y = this.avatar.height * 0.55;
      //   }
      // }

      if (isPosition) {
        dst.y *= this.avatar.height; // XXX avatar could be made perfect by measuring from foot to hips instead
      }
    }
  }
}
WebaverseAnimationMixer.timeS = 0;

export {WebaverseAnimationMixer};
