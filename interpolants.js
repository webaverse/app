export class Interpolant {
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

export class BiActionInterpolant extends Interpolant {
  constructor(fn, minValue, maxValue) {
    super(fn, minValue, maxValue);
  }
  update(timeDiff) {
    this.value += (this.fn() ? 1 : -1) * timeDiff;
    this.value = Math.min(Math.max(this.value, this.minValue), this.maxValue);
  }
}

export class UniActionInterpolant extends Interpolant {
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

export class InfiniteActionInterpolant extends Interpolant {
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