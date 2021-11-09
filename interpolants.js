import * as THREE from 'three';
import {mod} from './util.js';

export class ScalarInterpolant {
  constructor(fn, minValue, maxValue) {
    this.fn = fn;
    this.value = minValue;
    this.minValue = minValue;
    this.maxValue = maxValue;
  }
  get() {
    return this.value;
  }
  getNormalized() {
    return this.value / (this.maxValue - this.minValue);
  }
  getInverse() {
    return this.maxValue - this.value;
  }
}

export class BiActionInterpolant extends ScalarInterpolant {
  constructor(fn, minValue, maxValue) {
    super(fn, minValue, maxValue);
  }
  update(timeDiff) {
    this.value += (this.fn() ? 1 : -1) * timeDiff;
    this.value = Math.min(Math.max(this.value, this.minValue), this.maxValue);
  }
}

export class UniActionInterpolant extends ScalarInterpolant {
  constructor(fn, minValue, maxValue) {
    super(fn, minValue, maxValue);
  }
  update(timeDiff) {
    if (this.fn()) {
      this.value += timeDiff;
      this.value = Math.min(Math.max(this.value, this.minValue), this.maxValue);
    } else {
      this.value = this.minValue;
    }
  }
}

export class InfiniteActionInterpolant extends ScalarInterpolant {
  constructor(fn, minValue) {
    super(fn, minValue);
  }
  update(timeDiff) {
    if (this.fn()) {
      this.value += timeDiff;
    } else {
      this.value = this.minValue;
    }
  }
}

const _makeSnapshots = (constructor, numFrames) => {
  const result = Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    result[i] = {
      startValue: constructor(),
      // endValue: constructor(),
      startTime: 0,
      endTime: 0,
    };
  }
  return result;
};
export class SnapshotInterpolant {
  constructor(fn, timeDelay, numFrames, constructor, readFn, seekFn) {
    this.fn = fn;
    this.timeDelay = timeDelay;
    this.numFrames = numFrames;
    this.readFn = readFn;
    this.seekFn = seekFn;
    
    this.readTime = 0;
    this.writeTime = 0;

    this.snapshots = _makeSnapshots(constructor, numFrames);
    this.snapshotWriteIndex = 0;

    this.value = constructor();
  }
  update(timeDiff) {
    this.readTime += timeDiff;

    const effectiveReadTime = this.readTime - this.timeDelay;
    this.seekTo(effectiveReadTime);
  }
  seekTo(t) {
    for (let i = -(this.numFrames - 1); i < 0; i++) {
      const index = this.snapshotWriteIndex + i;
      const snapshot = this.snapshots[mod(index, this.numFrames)];
      if (snapshot.startTime >= t && t <= snapshot.endTime) {
        const duration = snapshot.endTime - snapshot.startTime;
        const f = (duration > 0 && duration < Infinity) ? ((t - snapshot.startTime) / duration) : 0;
        const {startValue} = snapshot;
        const nextSnapshot = this.snapshots[mod(index + 1, this.numFrames)];
        const {startValue: endValue} = nextSnapshot;
        this.value = this.seekFn(this.value, startValue, endValue, f);
        return;
      }
    }
    console.warn('could not seek to time', t, JSON.parse(JSON.stringify(this.snapshots)));
  }
  snapshot(timeDiff) {
    const value = this.fn();
    // console.log('got value', value.join(','), timeDiff);
    const writeSnapshot = this.snapshots[this.snapshotWriteIndex];
    writeSnapshot.startValue = this.readFn(writeSnapshot.startValue, value);
    writeSnapshot.startTime = this.writeTime;
    writeSnapshot.endTime = this.writeTime + timeDiff;
    
    this.snapshotWriteIndex = mod(this.snapshotWriteIndex + 1, this.numFrames);
    this.writeTime += timeDiff;
  }
  get() {
    return this.value;
  }
}

export class BinaryInterpolant extends SnapshotInterpolant {
  constructor(fn, timeDelay, numFrames) {
    super(fn, timeDelay, numFrames, () => false, (target, value) => {
      // console.log('read value', value);
      return value;
    }, (target, src, dst, f) => {
      // console.log('seek', target, src, dst, f);
      return src;
    });
  }
  /* snapshot(timeDiff) {
    debugger;
  } */
}

export class PositionInterpolant extends SnapshotInterpolant {
  constructor(fn, timeDelay, numFrames) {
    super(fn, timeDelay, numFrames, () => new THREE.Vector3(), (target, value) => {
      target.fromArray(value);
      if (isNaN(target.x) || isNaN(target.y) || isNaN(target.z)) {
        debugger;
      }
      return target;
    }, (target, src, dst, f) => {
      target.copy(src).lerp(dst, f);
      if (isNaN(target.x) || isNaN(target.y) || isNaN(target.z)) {
        debugger;
      }
      return target;
    });
  }
}

export class QuaternionInterpolant extends SnapshotInterpolant {
  constructor(fn, timeDelay, numFrames) {
    super(fn, timeDelay, numFrames, () => new THREE.Quaternion(), (target, value) => target.fromArray(value), (target, src, dst, f) => target.copy(src).slerp(dst, f));
  }
}

export class FixedTimeStep {
  constructor(fn, frameRate) {
    this.fn = fn;
    this.maxTime = 1000/frameRate;
    this.timeAcc = this.maxTime;
  }
  update(timeDiff) {
    this.timeAcc += timeDiff;
    while (this.timeAcc > this.maxTime) {
      this.fn(this.maxTime);
      this.timeAcc -= this.maxTime;
    }
  }
}