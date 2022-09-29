import {align, getClosestPowerOf2} from './util.js';

export class Allocator {
  constructor(moduleInstance) {
    this.moduleInstance = moduleInstance;
    this.offsets = [];
  }

  alloc(constructor, size) {
    if (size > 0) {
      const offset = this.moduleInstance._malloc(
        size * constructor.BYTES_PER_ELEMENT,
      );
      const b = new constructor(
        this.moduleInstance.HEAP8.buffer,
        this.moduleInstance.HEAP8.byteOffset + offset,
        size,
      );
      b.offset = offset;
      this.offsets.push(offset);
      return b;
    } else {
      return new constructor(this.moduleInstance.HEAP8.buffer, 0, 0);
    }
  }

  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      this.moduleInstance._doFree(this.offsets[i]);
    }
    this.offsets.length = 0;
  }
}

//

export class ScratchStack {
  constructor(moduleInstance, size) {
    this.ptr = moduleInstance._malloc(size);

    this.u8 = new Uint8Array(moduleInstance.HEAP8.buffer, this.ptr, size);
    this.u32 = new Uint32Array(moduleInstance.HEAP8.buffer, this.ptr, size / 4);
    this.i32 = new Int32Array(moduleInstance.HEAP8.buffer, this.ptr, size / 4);
    this.f32 = new Float32Array(
      moduleInstance.HEAP8.buffer,
      this.ptr,
      size / 4,
    );
  }
}

//

// circular index buffer
const maxSlotEntries = 4096;
export class FreeListArray {
  constructor(slotSize, parent) {
    this.slotSize = slotSize;
    this.parent = parent;

    this.startIndex = 0;
    this.endIndex = 0;
    this.entries = new Int32Array(maxSlotEntries);
    this.allocatedEntries = 0;
  }

  alloc() {
    if (this.allocatedEntries < maxSlotEntries) {
      if (this.startIndex === this.endIndex) {
        this.entries[this.endIndex] = this.parent.allocIndex(this.slotSize);
        this.endIndex = (this.endIndex + 1) % maxSlotEntries;
      }
      const index = this.entries[this.startIndex];
      this.startIndex = (this.startIndex + 1) % maxSlotEntries;
      this.allocatedEntries++;
      return index;
    } else {
      throw new Error('out of slots to allocate');
    }
  }

  free(index) {
    this.entries[this.endIndex] = index;
    this.endIndex = (this.endIndex + 1) % maxSlotEntries;
    this.allocatedEntries--;
  }
}
export class FreeList {
  constructor(size, alignment = 1) {
    this.freeStart = 0;
    this.freeEnd = size;
    this.alignment = alignment;

    this.slots = new Map(); // Map<slotSize, FreeListArray>
    this.slotSizes = new Map(); // Map<index, slotSize>
  }

  allocIndex(slotSize) {
    const allocSize = 1 << slotSize;
    let newFreeStart = this.freeStart + allocSize;
    newFreeStart = align(newFreeStart, this.alignment);
    if (newFreeStart <= this.freeEnd) {
      const index = this.freeStart;
      this.freeStart = newFreeStart;
      return index;
    } else {
      throw new Error('out of memory to allocate to slot');
    }
  }

  alloc(size) {
    const slotSize = getClosestPowerOf2(size);
    let freeListArray = this.slots.get(slotSize);
    if (freeListArray === undefined) {
      freeListArray = new FreeListArray(slotSize, this);
      this.slots.set(slotSize, freeListArray);
    }
    const index = freeListArray.alloc();
    this.slotSizes.set(index, slotSize);
    return index;
  }

  free(index) {
    const slotSize = this.slotSizes.get(index);
    if (slotSize !== undefined) {
      const freeListArray = this.slots.get(slotSize);
      if (freeListArray !== undefined) {
        freeListArray.free(index);
        this.slotSizes.delete(index);
      } else {
        throw new Error('invalid free slot');
      }
    } else {
      throw new Error('invalid free index');
    }
  }
}
