import {defaultMaxId} from './constants.js';

export class IdAllocator {
  constructor(maxSize = defaultMaxId) {
    this.stack = new Uint32Array(maxSize);
    for (let i = 0; i < maxSize; i++) {
      this.stack[i] = i + 1;
    }
    this.stackIndex = 0;
  }

  alloc() {
    if (this.stackIndex < this.stack.length) {
      const index = this.stack[this.stackIndex];
      this.stackIndex++;
      return index;
    } else {
      return -1;
    }
  }

  free(index) {
    this.stackIndex--;
    this.stack[this.stackIndex] = index;
  }
}
