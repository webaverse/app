import Module from './public/dc.module.js'
import {Allocator} from './geometry-util.js';
import {makePromise} from './util.js';
import {defaultChunkSize} from './constants.js';
// import placeNames from './procgen/placeNames.js';

const cbs = new Map();

const w = {};

w.waitForLoad = Module.waitForLoad;

w.free = address => {
  Module._doFree(address);
};

let chunkSize = defaultChunkSize;
w.initialize = (newChunkSize, seed) => {
  Module._initialize(newChunkSize, seed);
  chunkSize = newChunkSize;
};

w.createInstance = () => Module._createInstance();
w.destroyInstance = instance => Module._destroyInstance(instance);

const cubeDamage = damageFn => (
  inst,
  x, y, z,
  qx, qy, qz, qw,
  sx, sy, sz,
) => {
  const allocator = new Allocator(Module);

  try {
    let numPositions = 8;
    const positionsTypedArray = allocator.alloc(Float32Array, numPositions * 3);
    const numPositionsTypedArray = allocator.alloc(Uint32Array, 1);
    numPositionsTypedArray[0] = numPositions;
    const lod = 1;
    const gridPoints = chunkSize + 3 + lod;
    const damageBufferSize = gridPoints * gridPoints * gridPoints;
    const damageBuffersTypedArray = allocator.alloc(Float32Array, numPositions * gridPoints * gridPoints * gridPoints);

    const drew = damageFn(
      inst,
      x, y, z,
      qx, qy, qz, qw,
      sx, sy, sz,
      positionsTypedArray.byteOffset,
      numPositionsTypedArray.byteOffset,
      damageBuffersTypedArray.byteOffset,
    );

    if (drew) {
      numPositions = numPositionsTypedArray[0];
      const chunks = Array(numPositions);
      for (let i = 0; i < numPositions; i++) {
        const position = positionsTypedArray.slice(i * 3, i * 3 + 3);
        const damageBuffer = damageBuffersTypedArray.slice(i * damageBufferSize, i * damageBufferSize + damageBufferSize);
        chunks[i] = {
          position,
          damageBuffer,
        };
      }
      return chunks;
    } else {
      return null;
    }
  } finally {
    allocator.freeAll();
  }
};
w.drawCubeDamage = function() {
  return cubeDamage(Module._drawCubeDamage.bind(Module)).apply(this, arguments);
};
w.eraseCubeDamage = function() {
  return cubeDamage(Module._eraseCubeDamage.bind(Module)).apply(this, arguments);
};

w.setClipRange = function(inst, range) {
  Module._setClipRange(
    inst,
    range[0][0], range[0][1], range[0][2],
    range[1][0], range[1][1], range[1][2]
  );
};

const sphereDamage = damageFn => (
  inst,
  x, y, z,
  radius,
) => {
  const allocator = new Allocator(Module);

  try {
    let numPositions = 8;
    const positionsTypedArray = allocator.alloc(Float32Array, numPositions * 3);
    const numPositionsTypedArray = allocator.alloc(Uint32Array, 1);
    numPositionsTypedArray[0] = numPositions;
    const lod = 1;
    const gridPoints = chunkSize + 3 + lod;
    const damageBufferSize = gridPoints * gridPoints * gridPoints;
    const damageBuffersTypedArray = allocator.alloc(Float32Array, numPositions * gridPoints * gridPoints * gridPoints);

    const drew = damageFn(
      inst,
      x, y, z,
      radius,
      positionsTypedArray.byteOffset,
      numPositionsTypedArray.byteOffset,
      damageBuffersTypedArray.byteOffset,
    );

    if (drew) {
      numPositions = numPositionsTypedArray[0];
      const chunks = Array(numPositions);
      for (let i = 0; i < numPositions; i++) {
        const position = positionsTypedArray.slice(i * 3, (i + 1) * 3);
        const damageBuffer = damageBuffersTypedArray.slice(i * damageBufferSize, (i + 1) * damageBufferSize);
        chunks[i] = {
          position,
          damageBuffer,
        };
      }
      return chunks;
    } else {
      return null;
    }
  } finally {
    allocator.freeAll();
  }
};
w.drawSphereDamage = function() {
  return sphereDamage(Module._drawSphereDamage.bind(Module)).apply(this, arguments);
};
w.eraseSphereDamage = function() {
  return sphereDamage(Module._eraseSphereDamage.bind(Module)).apply(this, arguments);
};

w.injectDamage = function(inst, x, y, z, damageBuffer) {
  const allocator = new Allocator(Module);

  const damageBufferTypedArray = allocator.alloc(Float32Array, damageBuffer.length);
  damageBufferTypedArray.set(damageBuffer);

  try {
    Module._injectDamage(
      inst,
      x, y, z,
      damageBufferTypedArray.byteOffset,
    );
  } finally {
    allocator.freeAll();
  }
};

//

const _parseTerrainVertexBuffer = (arrayBuffer, bufferAddress) => {
  const dataView = new DataView(arrayBuffer, bufferAddress);

  let index = 0;

  // positions
  const numPositions = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const positions = new Float32Array(arrayBuffer, bufferAddress + index, numPositions * 3);
  index += Float32Array.BYTES_PER_ELEMENT * numPositions * 3;

  // normals
  const numNormals = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const normals = new Float32Array(arrayBuffer, bufferAddress + index, numNormals * 3);
  index += Float32Array.BYTES_PER_ELEMENT * numNormals * 3;

  // biomes
  const numBiomes = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const biomes = new Int32Array(arrayBuffer, bufferAddress + index, numBiomes * 4);
  index += Int32Array.BYTES_PER_ELEMENT * numBiomes * 4;

  // biome weights
  const numBiomesWeights = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const biomesWeights = new Float32Array(arrayBuffer, bufferAddress + index, numBiomesWeights * 4);
  index += Float32Array.BYTES_PER_ELEMENT * numBiomesWeights * 4;

  // indices
  const numIndices = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const indices = new Uint32Array(arrayBuffer, bufferAddress + index, numIndices);
  index += Uint32Array.BYTES_PER_ELEMENT * numIndices;

  return {
    bufferAddress,
    positions,
    normals,
    biomes,
    biomesWeights,
    indices,
  };
};
w.createTerrainChunkMeshAsync = async (inst, x, y, z, lods) => {
  const allocator = new Allocator(Module);

  const lodArray = allocator.alloc(Int32Array, 8);
  lodArray.set(lods);

  const taskId = Module._createTerrainChunkMeshAsync(
    inst,
    x, y, z,
    lodArray.byteOffset,
  );
  const p = makePromise();
  cbs.set(taskId, p);

  allocator.freeAll();

  // console.log('got async task id', taskId);
  const outputBufferOffset = await p;
  // console.log('got async task result', taskId, outputBufferOffset);

  /* await new Promise((accept, reject) => {
    // XXX hang
  }); */

  if (outputBufferOffset) {
    const result = _parseTerrainVertexBuffer(
      Module.HEAP8.buffer,
      Module.HEAP8.byteOffset + outputBufferOffset
    );
    return result;
  } else {
    return null;
  }
};

//

const _parseLiquidVertexBuffer = (arrayBuffer, bufferAddress) => {
  const dataView = new DataView(arrayBuffer, bufferAddress);

  let index = 0;

  // positions
  const numPositions = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const positions = new Float32Array(arrayBuffer, bufferAddress + index, numPositions * 3);
  index += Float32Array.BYTES_PER_ELEMENT * numPositions * 3;

  // normals
  const numNormals = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const normals = new Float32Array(arrayBuffer, bufferAddress + index, numNormals * 3);
  index += Float32Array.BYTES_PER_ELEMENT * numNormals * 3;

  // biomes
  const numBiomes = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const biomes = new Int32Array(arrayBuffer, bufferAddress + index, numBiomes);
  index += Int32Array.BYTES_PER_ELEMENT * numBiomes;

  // indices
  const numIndices = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const indices = new Uint32Array(arrayBuffer, bufferAddress + index, numIndices);
  index += Uint32Array.BYTES_PER_ELEMENT * numIndices;

  return {
    bufferAddress,
    positions,
    normals,
    biomes,
    indices,
  };
};
w.createLiquidChunkMeshAsync = async (inst, x, y, z, lods) => {
  const allocator = new Allocator(Module);

  const lodArray = allocator.alloc(Int32Array, 8);
  lodArray.set(lods);

  const taskId = Module._createLiquidChunkMeshAsync(
    inst,
    x, y, z,
    lodArray.byteOffset,
  );

  const p = makePromise();
  cbs.set(taskId, p);
  const outputBufferOffset = await p;

  allocator.freeAll();

  if (outputBufferOffset) {
    const result = _parseLiquidVertexBuffer(
      Module.HEAP8.buffer,
      Module.HEAP8.byteOffset + outputBufferOffset
    );
    return result;
  } else {
    return null;
  }
};

//

w.getChunkHeightfieldAsync = async (inst, x, z, lod) => {
  // const allocator = new Allocator(Module);

  // const heights = allocator.alloc(Float32Array, chunkSize * chunkSize);

  // try {
    const taskId = Module._getChunkHeightfieldAsync(
      inst,
      x, z,
      lod
    );

    const p = makePromise();
    cbs.set(taskId, p);
    const heights = await p;

    const heights2 = new Float32Array(Module.HEAPU8.buffer, heights, chunkSize * chunkSize).slice();
    Module._doFree(heights);
    return heights2;
  /* } finally {
    // allocator.freeAll();
  } */
};
/* w.getHeightfieldRange = (inst, x, z, w, h, lod) => {
  const allocator = new Allocator(Module);

  const heights = allocator.alloc(Float32Array, w * h);

  try {
    Module._getHeightfieldRange(
      inst,
      x, z,
      w, h,
      lod,
      heights.byteOffset
    );
    return heights.slice();
  } finally {
    allocator.freeAll();
  }
}; */
w.getChunkSkylightAsync = async (inst, x, y, z, lod) => {
  // const allocator = new Allocator(Module);

  // const gridPoints = chunkSize + 3 + lod;
  // const skylights = allocator.alloc(Uint8Array, chunkSize * chunkSize * chunkSize);

  // try {
    const taskId = Module._getChunkSkylightAsync(
      inst,
      x, y, z,
      lod
    );

    const p = makePromise();
    cbs.set(taskId, p);
    const skylights = await p;

    const skylights2 = new Uint8Array(Module.HEAPU8.buffer, skylights, chunkSize * chunkSize * chunkSize).slice();
    Module._doFree(skylights);
    return skylights2;
  /* } finally {
    // allocator.freeAll();
  } */
};
w.getChunkAoAsync = async (inst, x, y, z, lod) => {
  // const allocator = new Allocator(Module);

  // const aos = allocator.alloc(Uint8Array, chunkSize * chunkSize * chunkSize);

  // try {
    const taskId = Module._getChunkAoAsync(
      inst,
      x, y, z,
      lod
    );

    const p = makePromise();
    cbs.set(taskId, p);
    const aos = await p;

    const aos2 = new Uint8Array(Module.HEAPU8.buffer, aos, chunkSize * chunkSize * chunkSize).slice();
    Module._doFree(aos);
    return aos2;
  /* } finally {
    // allocator.freeAll();
  } */
};
/* w.getSkylightFieldRange = (inst, x, y, z, w, h, d, lod) => {
  const allocator = new Allocator(Module);

  const skylights = allocator.alloc(Uint8Array, w * h * d);

  try {
    Module._getSkylightFieldRange(
      inst,
      x, y, z,
      w, h, d,
      lod,
      skylights.byteOffset
    );
    return skylights.slice();
  } finally {
    allocator.freeAll();
  }
};
w.getAoFieldRange = (inst, x, y, z, w, h, d, lod) => {
  const allocator = new Allocator(Module);

  const aos = allocator.alloc(Uint8Array, w * h * d);

  try {
    Module._getAoFieldRange(
      inst,
      x, y, z,
      w, h, d,
      lod,
      aos.byteOffset
    );
    return aos.slice();
  } finally {
    allocator.freeAll();
  }
}; */

w.createGrassSplatAsync = async (inst, x, z, lod) => {
  // const allocator = new Allocator(Module);

  // const allocSize = 64 * 1024;
  // const ps = allocator.alloc(Float32Array, allocSize * 3);
  // const qs = allocator.alloc(Float32Array, allocSize * 4);
  // const instances = allocator.alloc(Float32Array, allocSize);
  // const count = allocator.alloc(Uint32Array, 1);

  // try {
    const taskId = Module._createGrassSplatAsync(
      inst,
      x, z,
      lod
    );

    const p = makePromise();
    cbs.set(taskId, p);
    const result = await p;
    const pqi = _parsePQI(result);
    // console.log('got result 1', _parsePQI(result));
    Module._doFree(result);
    return pqi;

    /* const numElements = count[0];
    return {
      ps: ps.slice(0, numElements * 3),
      qs: qs.slice(0, numElements * 4),
      instances: instances.slice(0, numElements),
    }; */
  /* } finally {
    // allocator.freeAll();
  } */
};
w.createVegetationSplatAsync = async (inst, x, z, lod) => {
  // const allocator = new Allocator(Module);

  // const allocSize = 64 * 1024;
  // const ps = allocator.alloc(Float32Array, allocSize * 3);
  // const qs = allocator.alloc(Float32Array, allocSize * 4);
  // const instances = allocator.alloc(Float32Array, allocSize);
  // const count = allocator.alloc(Uint32Array, 1);

  // try {
    const taskId = Module._createVegetationSplatAsync(
      inst,
      x, z,
      lod
    );

    const p = makePromise();
    cbs.set(taskId, p);
    const result = await p;

    const pqi = _parsePQI(result);
    // console.log('got result 2', _parsePQI(result));
    Module._doFree(result);
    return pqi;
    /* const numElements = count[0];
    return {
      ps: ps.slice(0, numElements * 3),
      qs: qs.slice(0, numElements * 4),
      instances: instances.slice(0, numElements),
    }; */
  /* } finally {
    // allocator.freeAll();
  } */
};
w.createMobSplatAsync = async (inst, x, z, lod) => {
  // const allocator = new Allocator(Module);

  /* const allocSize = 64 * 1024;
  const ps = allocator.alloc(Float32Array, allocSize * 3);
  const qs = allocator.alloc(Float32Array, allocSize * 4);
  const instances = allocator.alloc(Float32Array, allocSize);
  const count = allocator.alloc(Uint32Array, 1); */

  // try {
    const taskId = Module._createMobSplatAsync(
      inst,
      x, z,
      lod
    );

    const p = makePromise();
    cbs.set(taskId, p);
    const result = await p;
    const pqi = _parsePQI(result);
    // console.log('got result 3', _parsePQI(result));
    Module._doFree(result);
    return pqi;

    /* const numElements = count[0];
    return {
      ps: ps.slice(0, numElements * 3),
      qs: qs.slice(0, numElements * 4),
      instances: instances.slice(0, numElements),
    }; */
  /* } finally {
    // allocator.freeAll();
  } */
};
// _parsePQI parses ps, qs, instances from a buffer
// the buffer contains 6 entries:
// ps size (uint32_t)
// ps data (float32_t) * size
// qs size (uint32_t)
// qs data (float32_t) * size
// instances size (uint32_t)
// instances data (float32_t) * size
function _parsePQI(addr) {
  const dataView = new DataView(Module.HEAPU8.buffer, addr);

  let index = 0;
  const psSize = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const ps = new Float32Array(dataView.buffer, dataView.byteOffset + index, psSize).slice();
  index += psSize * Float32Array.BYTES_PER_ELEMENT;
  const qsSize = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const qs = new Float32Array(dataView.buffer, dataView.byteOffset + index, qsSize).slice();
  index += qsSize * Float32Array.BYTES_PER_ELEMENT;
  const instancesSize = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const instances = new Float32Array(dataView.buffer, dataView.byteOffset + index, instancesSize).slice();
  index += instancesSize * Float32Array.BYTES_PER_ELEMENT;

  return {
    ps,
    qs,
    instances,
  };
}

globalThis.handleResult = (id, result) => {
  const p = cbs.get(id);
  if (p) {
    cbs.delete(id);
    p.accept(result);
  } else {
    console.warn('failed to find promise for id', e.data);
  }
};

export default w;