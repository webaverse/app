import {defaultMaxId} from './constants.js';

export class IdAllocator {
  constructor(maxSize = defaultMaxId) {
    this.usedList = new Uint8Array(maxSize);
  }
  alloc() {
    for (let i = 0; i < this.usedList.length; i++) {
      if (this.usedList[i] === 0) {
        this.usedList[i] = 1;
        return i;
      }
    }
    return -1;
  }
  free(index) {
    this.usedList[index] = 0;
  }
}