/*
physx lite worker wasm integration.
*/

// import * as THREE from 'three';
import Module from './public/bin/app-wasm-worker.js';
import {Allocator, ScratchStack} from './geometry-util.js';

const physxLite = {};

let loadPromise = null;
let scratchStack = null;
physxLite.waitForLoad = () => {
  if (!loadPromise) {
    loadPromise = (async () => {
      await Module.waitForLoad();

      Module._initialize();

      const scratchStackSize = 1024 * 1024;
      scratchStack = new ScratchStack(Module, scratchStackSize);
      // physxLite.base = physxLite.makePhysicsBase();

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
    const ptr = Module._doMalloc(size);
    return new constructor(Module.HEAP8.buffer, ptr, count);
  } else {
    return new constructor(Module.HEAP8.buffer, 0, 0);
  }
}; */
physxLite.free = (ptr) => {
  Module._doFree(ptr)
};
// physxLite.makePhysicsBase = () => Module._makePhysicsBase();
physxLite.cookGeometryPhysics = (mesh) => {
  mesh.updateMatrixWorld()
  const { geometry } = mesh

  const allocator = new Allocator(Module)
  const positions = allocator.alloc(
    Float32Array,
    geometry.attributes.position.count * 3
  )
  positions.set(geometry.attributes.position.array)
  const indices = geometry.index
    ? allocator.alloc(Uint32Array, geometry.index.count)
    : null
  indices && indices.set(geometry.index.array)
  Module._cookGeometryPhysics(
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

  const result = Module.HEAPU8.slice(dataPtr, dataPtr + dataLength);
  
  allocator.freeAll();
  Module._deleteMemoryOutputStream(streamPtr);

  return result;
};
physxLite.cookConvexGeometryPhysics = (mesh) => {
  mesh.updateMatrixWorld()
  const { geometry } = mesh

  const allocator = new Allocator(Module)
  const positions = allocator.alloc(
    Float32Array,
    geometry.attributes.position.count * 3
  )
  positions.set(geometry.attributes.position.array)
  const indices = geometry.index
    ? allocator.alloc(Uint32Array, geometry.index.count)
    : null
  indices && indices.set(geometry.index.array)
  Module._cookConvexGeometryPhysics(
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

  const result = Module.HEAPU8.slice(dataPtr, dataPtr + dataLength);
  
  allocator.freeAll();
  Module._deleteMemoryOutputStream(streamPtr);

  return result;
};

export default physxLite;