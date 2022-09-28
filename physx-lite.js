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
physxLite.free = ptr => {
  Module._doFree(ptr);
};
// physxLite.makePhysicsBase = () => Module._makePhysicsBase();
physxLite.cookGeometryPhysics = mesh => {
  mesh.updateMatrixWorld();
  const {geometry} = mesh;

  const allocator = new Allocator(Module);
  const positions = allocator.alloc(
    Float32Array,
    geometry.attributes.position.count * 3,
  );
  positions.set(geometry.attributes.position.array);
  const indices = geometry.index
    ? allocator.alloc(Uint32Array, geometry.index.count)
    : null;
  indices && indices.set(geometry.index.array);
  Module._cookGeometryPhysics(
    positions.byteOffset,
    indices ? indices.byteOffset : 0,
    positions.length,
    indices ? indices.length : 0,
    scratchStack.u32.byteOffset,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2,
  );

  const dataPtr = scratchStack.u32[0];
  const dataLength = scratchStack.u32[1];
  const streamPtr = scratchStack.u32[2];

  const result = Module.HEAPU8.slice(dataPtr, dataPtr + dataLength);

  allocator.freeAll();
  Module._deleteMemoryOutputStream(streamPtr);

  return result;
};
physxLite.cookConvexGeometryPhysics = mesh => {
  mesh.updateMatrixWorld();
  const {geometry} = mesh;

  const allocator = new Allocator(Module);
  const positions = allocator.alloc(
    Float32Array,
    geometry.attributes.position.count * 3,
  );
  positions.set(geometry.attributes.position.array);
  const indices = geometry.index
    ? allocator.alloc(Uint32Array, geometry.index.count)
    : null;
  indices && indices.set(geometry.index.array);
  Module._cookConvexGeometryPhysics(
    positions.byteOffset,
    indices ? indices.byteOffset : 0,
    positions.length,
    indices ? indices.length : 0,
    scratchStack.u32.byteOffset,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2,
  );

  const dataPtr = scratchStack.u32[0];
  const dataLength = scratchStack.u32[1];
  const streamPtr = scratchStack.u32[2];

  const result = Module.HEAPU8.slice(dataPtr, dataPtr + dataLength);

  allocator.freeAll();
  Module._deleteMemoryOutputStream(streamPtr);

  return result;
};
physxLite.meshoptSimplify = (mesh, targetRatio, targetError) => {
  /* EMSCRIPTEN_KEEPALIVE unsigned int *meshoptSimplify(
    const unsigned int* indices,
    size_t index_count,
    const float* vertex_positions,
    size_t vertex_count,
    size_t target_index_count,
    float target_error
  ); */
  const {geometry} = mesh;

  const allocator = new Allocator(Module);
  const positions = allocator.alloc(
    Float32Array,
    geometry.attributes.position.count * 3,
  );
  positions.set(geometry.attributes.position.array);
  // const uvs = allocator.alloc(Float32Array, geometry.attributes.uv.count * 2);
  // uvs.set(geometry.attributes.uv.array);
  const indices = allocator.alloc(Uint32Array, geometry.index.count);
  indices.set(geometry.index.array);

  const target_index_count = Math.floor(indices.length * targetRatio);
  const target_error = targetError;

  Module._meshoptSimplify(
    indices.byteOffset,
    indices.length,
    positions.byteOffset,
    geometry.attributes.position.count,
    // uvs.byteOffset,
    target_index_count,
    target_error,
    scratchStack.u32.byteOffset,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
  );

  const dataPtr = scratchStack.u32[0];
  const dataLength = scratchStack.u32[1];

  const dataOffset = dataPtr / Uint32Array.BYTES_PER_ELEMENT;
  const result = Module.HEAPU32.slice(dataOffset, dataOffset + dataLength);

  allocator.freeAll();
  Module._doFree(dataPtr);

  return result;
};
physxLite.meshoptSimplifySloppy = (mesh, targetRatio, targetError) => {
  /* EMSCRIPTEN_KEEPALIVE unsigned int *meshoptSimplifySloppy(
    const unsigned int* indices,
    size_t index_count,
    const float* vertex_positions,
    size_t vertex_count,
    size_t target_index_count,
    float target_error
  ); */
  const {geometry} = mesh;

  const allocator = new Allocator(Module);
  const positions = allocator.alloc(
    Float32Array,
    geometry.attributes.position.count * 3,
  );
  positions.set(geometry.attributes.position.array);
  // const uvs = allocator.alloc(Float32Array, geometry.attributes.uv.count * 2);
  // uvs.set(geometry.attributes.uv.array);
  const indices = allocator.alloc(Uint32Array, geometry.index.count);
  indices.set(geometry.index.array);

  const target_index_count = Math.floor(indices.length * targetRatio);
  const target_error = targetError;

  Module._meshoptSimplifySloppy(
    indices.byteOffset,
    indices.length,
    positions.byteOffset,
    geometry.attributes.position.count,
    // uvs.byteOffset,
    target_index_count,
    target_error,
    scratchStack.u32.byteOffset,
    scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
  );

  const dataPtr = scratchStack.u32[0];
  const dataLength = scratchStack.u32[1];

  const dataOffset = dataPtr / Uint32Array.BYTES_PER_ELEMENT;
  const result = Module.HEAPU32.slice(dataOffset, dataOffset + dataLength);

  allocator.freeAll();
  Module._doFree(dataPtr);

  return result;
};

export default physxLite;
