/*
physx lite worker wasm integration.
*/

// import * as THREE from 'three';
import Module from './public/bin/app-wasm-worker.js';

class Allocator {
  constructor() {
    this.offsets = []
  }

  alloc(constructor, size) {
    if (size > 0) {
      const offset = moduleInstance._malloc(
        size * constructor.BYTES_PER_ELEMENT
      )
      const b = new constructor(
        moduleInstance.HEAP8.buffer,
        moduleInstance.HEAP8.byteOffset + offset,
        size
      )
      b.offset = offset
      this.offsets.push(offset)
      return b
    } else {
      return new constructor(moduleInstance.HEAP8.buffer, 0, 0)
    }
  }

  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      moduleInstance._doFree(this.offsets[i])
    }
    this.offsets.length = 0
  }
}
class ScratchStack {
  constructor(size) {
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

const physxLite = {};

let loadPromise = null;
let moduleInstance = null;
let scratchStack = null;
physxLite.waitForLoad = () => {
  if (!loadPromise) {
    loadPromise = (async () => {
      await Module.waitForLoad();
      moduleInstance = Module;
      const scratchStackSize = 1024 * 1024;
      scratchStack = new ScratchStack(scratchStackSize);
      physxLite.base = physxLite.makePhysicsBase();

      // console.log('module called run', Module.calledRun);
      /* if (Module.calledRun) {
        // Module.onRuntimeInitialized()
        Module.postRun()
      } */
    })();
  }
  return loadPromise;
};

/* physxLite.alloc = (constructor, count) => {
  if (count > 0) {
    const size = constructor.BYTES_PER_ELEMENT * count;
    const ptr = moduleInstance._doMalloc(size);
    return new constructor(moduleInstance.HEAP8.buffer, ptr, count);
  } else {
    return new constructor(moduleInstance.HEAP8.buffer, 0, 0);
  }
}; */
physxLite.free = (ptr) => {
  moduleInstance._doFree(ptr)
};
physxLite.makePhysicsBase = () => moduleInstance._makePhysicsBase();
physxLite.cookGeometryPhysics = (base, mesh) => {
  mesh.updateMatrixWorld()
  const { geometry } = mesh

  const allocator = new Allocator()
  const positions = allocator.alloc(
    Float32Array,
    geometry.attributes.position.count * 3
  )
  positions.set(geometry.attributes.position.array)
  const indices = geometry.index
    ? allocator.alloc(Uint32Array, geometry.index.count)
    : null
  indices && indices.set(geometry.index.array)
  moduleInstance._cookGeometryPhysics(
    base,
    positions.byteOffset,
    indices ? indices.byteOffset : 0,
    positions.length,
    indices ? indices.length : 0,
    scratchStack.u32.byteOffset,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2
  )

  const dataPtr = scratchStack.u32[0];
  const dataLength = scratchStack.u32[1];
  const streamPtr = scratchStack.u32[2];

  const result = moduleInstance.HEAPU8.slice(dataPtr, dataPtr + dataLength);
  
  allocator.freeAll();
  Module._deleteMemoryOutputStream(streamPtr);

  return result;
};
physxLite.cookConvexGeometryPhysics = (base, mesh) => {
  mesh.updateMatrixWorld()
  const { geometry } = mesh

  const allocator = new Allocator()
  const positions = allocator.alloc(
    Float32Array,
    geometry.attributes.position.count * 3
  )
  positions.set(geometry.attributes.position.array)
  const indices = geometry.index
    ? allocator.alloc(Uint32Array, geometry.index.count)
    : null
  indices && indices.set(geometry.index.array)
  moduleInstance._cookConvexGeometryPhysics(
    base,
    positions.byteOffset,
    indices ? indices.byteOffset : 0,
    positions.length,
    indices ? indices.length : 0,
    scratchStack.u32.byteOffset,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2
  )

  const dataPtr = scratchStack.u32[0];
  const dataLength = scratchStack.u32[1];
  const streamPtr = scratchStack.u32[2];

  const result = moduleInstance.HEAPU8.slice(dataPtr, dataPtr + dataLength);
  
  allocator.freeAll();
  Module._deleteMemoryOutputStream(streamPtr);

  return result;
};

export default physxLite;