export class Allocator {
  constructor(moduleInstance) {
    this.moduleInstance = moduleInstance;
    this.offsets = []
  }

  alloc(constructor, size) {
    if (size > 0) {
      const offset = this.moduleInstance._malloc(
        size * constructor.BYTES_PER_ELEMENT
      )
      const b = new constructor(
        this.moduleInstance.HEAP8.buffer,
        this.moduleInstance.HEAP8.byteOffset + offset,
        size
      )
      b.offset = offset
      this.offsets.push(offset)
      return b
    } else {
      return new constructor(this.moduleInstance.HEAP8.buffer, 0, 0)
    }
  }

  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      this.moduleInstance._doFree(this.offsets[i])
    }
    this.offsets.length = 0
  }
}
export class ScratchStack {
  constructor(moduleInstance, size) {
    this.ptr = moduleInstance._malloc(size)

    this.u8 = new Uint8Array(
      moduleInstance.HEAP8.buffer,
      this.ptr,
      size
    )
    this.u32 = new Uint32Array(
      moduleInstance.HEAP8.buffer,
      this.ptr,
      size / 4
    )
    this.i32 = new Int32Array(
      moduleInstance.HEAP8.buffer,
      this.ptr,
      size / 4
    )
    this.f32 = new Float32Array(
      moduleInstance.HEAP8.buffer,
      this.ptr,
      size / 4
    )
  }
}