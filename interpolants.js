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

const _makeSnapshots = (Constructor, numFrames) => {
  const result = Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    result[i] = {
      startValue: new Constructor(),
      // endValue: new Constructor(),
      startTime: 0,
      endTime: 0,
    };
  }
  return result;
};
export class VectorInterpolant {
  constructor(fn, timeDelay, numFrames, Constructor, lerpFnName) {
    this.fn = fn;
    this.timeDelay = timeDelay;
    this.numFrames = numFrames;
    this.lerpFnName = lerpFnName;
    
    this.readTime = 0;
    this.writeTime = 0;

    this.snapshots = _makeSnapshots(Constructor, numFrames);
    this.snapshotWriteIndex = 0;

    this.value = new Constructor();
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
      if (snapshot.startTime >= t && t < snapshot.endTime) {
        const f = (t - snapshot.startTime) / (snapshot.endTime - snapshot.startTime);
        const {startValue} = snapshot;
        const nextSnapshot = this.snapshots[mod(index + 1, this.numFrames)];
        const {startValue: endValue} = nextSnapshot;
        this.value.copy(startValue)[this.lerpFnName](endValue, f);
        return;
      }
    }
    console.warn('could not seek to time', t, JSON.parse(JSON.stringify(this.snapshots)));
  }
  snapshot(timeDiff) {
    const value = this.fn();
    // console.log('got value', value.join(','), timeDiff);
    const writeSnapshot = this.snapshots[this.snapshotWriteIndex];
    writeSnapshot.startValue.fromArray(value);
    writeSnapshot.startTime = this.writeTime;
    writeSnapshot.endTime = this.writeTime + timeDiff;
    
    this.snapshotWriteIndex = mod(this.snapshotWriteIndex + 1, this.numFrames);
    this.writeTime += timeDiff;
  }
}

export class PositionInterpolant extends VectorInterpolant {
  constructor(fn, timeDelay, numFrames) {
    super(fn, timeDelay, numFrames, THREE.Vector3, 'lerp');
  }
}

export class QuaternionInterpolant extends VectorInterpolant {
  constructor(fn, timeDelay, numFrames) {
    super(fn, timeDelay, numFrames, THREE.Quaternion, 'slerp');
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