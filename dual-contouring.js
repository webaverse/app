import Module from './public/dc.module.js'
import {Allocator} from './geometry-util.js';
import {makePromise} from './util.js';
import {defaultChunkSize} from './constants.js';

//

const cbs = new Map();

//

const align = (v, N) => {
  const r = v % N;
  return r === 0 ? v : v - r + N;
};
const align4 = v => align(v, 4);

//

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

//

/* std::vector<uint8_t> TrackerTask::getBuffer() const {
  size_t size = 0;
  size += sizeof(vm::ivec3); // min
  size += sizeof(int); // lod
  size += sizeof(int); // isLeaf
  size += sizeof(int[8]); // lodArray

  std::vector<uint8_t> result(size);
  int index = 0;
  std::memcpy(result.data() + index, &maxLodNode->min, sizeof(vm::ivec3));
  index += sizeof(vm::ivec3);
  *((int *)(result.data() + index)) = maxLodNode->size;
  index += sizeof(int);
  *((int *)(result.data() + index)) = (maxLodNode->type == Node_Leaf) ? 1 : 0;
  index += sizeof(int);
  std::memcpy(result.data() + index, &maxLodNode->lodArray, sizeof(int[8]));
  index += sizeof(int[8]);
  return result;
}
uint8_t *TrackerUpdate::getBuffer() const {
  std::vector<std::vector<uint8_t>> oldTaskBuffers;
  for (const auto &task : oldTasks) {
    oldTaskBuffers.push_back(task->getBuffer());
  }

  std::vector<std::vector<uint8_t>> newTaskBuffers;
  for (const auto &task : newTasks) {
    newTaskBuffers.push_back(task->getBuffer());
  }

  size_t size = 0;
  size += sizeof(uint32_t); // numOldTasks
  size += sizeof(uint32_t); // numNewTasks
  for (auto &buffer : oldTaskBuffers) {
    size += buffer.size();
  }
  for (auto &buffer : newTaskBuffers) {
    size += buffer.size();
  }

  uint8_t *ptr = (uint8_t *)malloc(size);
  int index = 0;
  *((uint32_t *)(ptr + index)) = oldTasks.size();
  index += sizeof(uint32_t);
  *((uint32_t *)(ptr + index)) = newTasks.size();
  index += sizeof(uint32_t);
  memcpy(ptr + index, oldTaskBuffers.data(), oldTaskBuffers.size() * sizeof(oldTaskBuffers[0]));
  index += oldTaskBuffers.size() * sizeof(oldTaskBuffers[0]);
  memcpy(ptr + index, newTaskBuffers.data(), newTaskBuffers.size() * sizeof(newTaskBuffers[0]));
  index += newTaskBuffers.size() * sizeof(newTaskBuffers[0]);
  return ptr;
} */

const _parseTrackerUpdate = bufferAddress => {
  const dataView = new DataView(Module.HEAPU8.buffer, bufferAddress);
  let index = 0;
  /* const currentCoord = new Int32Array(Module.HEAPU8.buffer, bufferAddress + index, 3).slice();
  index += Int32Array.BYTES_PER_ELEMENT * 3;
  const numOldTasks = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const numNewTasks = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT; */
  const numLeafNodes = dataView.getInt32(index, true);
  index += Int32Array.BYTES_PER_ELEMENT;

  const _parseNode = () => {
    const min = new Int32Array(Module.HEAPU8.buffer, bufferAddress + index, 3).slice();
    index += Int32Array.BYTES_PER_ELEMENT * 3;
    const size = dataView.getInt32(index, true);
    index += Int32Array.BYTES_PER_ELEMENT;
    const isLeaf = !!dataView.getInt32(index, true);
    index += Int32Array.BYTES_PER_ELEMENT;
    const lodArray = new Int32Array(Module.HEAPU8.buffer, bufferAddress + index, 8).slice();
    index += Int32Array.BYTES_PER_ELEMENT * 8;
    
    return {
      min,
      size,
      isLeaf,
      lodArray,
    };
  };
  /* const _parseTrackerTask = () => {
    const id = dataView.getInt32(index, true);
    index += Int32Array.BYTES_PER_ELEMENT;
    const type = dataView.getInt32(index, true);
    index += Int32Array.BYTES_PER_ELEMENT;
    const min = new Int32Array(Module.HEAPU8.buffer, bufferAddress + index, 3).slice();
    index += Int32Array.BYTES_PER_ELEMENT * 3;
    const size = dataView.getInt32(index, true);
    index += Int32Array.BYTES_PER_ELEMENT;
    const isLeaf = !!dataView.getInt32(index, true);
    index += Int32Array.BYTES_PER_ELEMENT;
    const lodArray = new Int32Array(Module.HEAPU8.buffer, bufferAddress + index, 8).slice();
    index += Int32Array.BYTES_PER_ELEMENT * 8;
    
    const numOldNodes = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const oldNodes = Array(numOldNodes);
    for (let i = 0; i < numOldNodes; i++) {
      oldNodes[i] = _parseNode();
    }

    const numNewNodes = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const newNodes = Array(numNewNodes);
    for (let i = 0; i < numNewNodes; i++) {
      newNodes[i] = _parseNode();
    }

    return {
      id,
      type,
      min,
      size,
      isLeaf,
      lodArray,
      oldNodes,
      newNodes,
    };
  }; */

  // leafNodes
  const leafNodes = Array(numLeafNodes);
  for (let i = 0; i < numLeafNodes; i++) {
    leafNodes[i] = _parseNode();
  }

  return {
    // currentCoord,
    // oldTasks,
    // newTasks,
    leafNodes,
  };
};
w.createTracker = (inst, lod, minLodRange, trackY) => {
  const result = Module._createTracker(inst, lod, minLodRange, trackY);
  return result;
};
w.destroyTracker = (inst, tracker) => Module._destroyTracker(inst, tracker);
w.trackerUpdateAsync = async (inst, taskId, tracker, position, priority) => {
  const allocator = new Allocator(Module);

  const positionArray = allocator.alloc(Float32Array, 3);
  positionArray.set(position);

  Module._trackerUpdateAsync(
    inst,
    taskId,
    tracker,
    positionArray.byteOffset,
    priority
  );
  const p = makePromise();
  cbs.set(taskId, p);

  allocator.freeAll();

  const outputBufferOffset = await p;
  const result = _parseTrackerUpdate(outputBufferOffset);
  return result;
};

//

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
    const drew = damageFn(
      inst,
      x, y, z,
      radius,
      positionsTypedArray.byteOffset,
      numPositionsTypedArray.byteOffset
    );

    if (drew) {      
      numPositions = numPositionsTypedArray[0];
      const chunks = Array(numPositions);
      for (let i = 0; i < numPositions; i++) {
        const position = positionsTypedArray.slice(i * 3, (i + 1) * 3);
        chunks[i] = {
          position,
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

/* w.injectDamage = function(inst, x, y, z, damageBuffer) {
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
}; */

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

  // biomes weights
  const numBiomesWeights = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const biomesWeights = new Float32Array(arrayBuffer, bufferAddress + index, numBiomesWeights * 4);
  index += Float32Array.BYTES_PER_ELEMENT * numBiomesWeights * 4;

  // biomes uvs 1
  const numBiomesUvs1 = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const biomesUvs1 = new Float32Array(arrayBuffer, bufferAddress + index, numBiomesUvs1 * 4);
  index += Float32Array.BYTES_PER_ELEMENT * numBiomesUvs1 * 4;

  // biomes uvs 2
  const numBiomesUvs2 = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const biomesUvs2 = new Float32Array(arrayBuffer, bufferAddress + index, numBiomesUvs2 * 4);
  index += Float32Array.BYTES_PER_ELEMENT * numBiomesUvs2 * 4;

  // indices
  const numIndices = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const indices = new Uint32Array(arrayBuffer, bufferAddress + index, numIndices);
  index += Uint32Array.BYTES_PER_ELEMENT * numIndices;

  // skylights
  const numSkylights = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const skylights = new Uint8Array(arrayBuffer, bufferAddress + index, numSkylights);
  index += Uint8Array.BYTES_PER_ELEMENT * numSkylights;
  index = align4(index);

  // aos
  const numAos = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const aos = new Uint8Array(arrayBuffer, bufferAddress + index, numAos);
  index += Uint8Array.BYTES_PER_ELEMENT * numAos;
  index = align4(index);

  const numPeeks = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const peeks = new Uint8Array(arrayBuffer, bufferAddress + index, numPeeks);
  index += Uint32Array.BYTES_PER_ELEMENT * numPeeks;

  return {
    bufferAddress,
    positions,
    normals,
    biomes,
    biomesWeights,
    biomesUvs1,
    biomesUvs2,
    indices,
    skylights,
    aos,
    peeks
  };
};
w.createTerrainChunkMeshAsync = async (inst, taskId, x, y, z, lods) => {
  const allocator = new Allocator(Module);

  const lodArray = allocator.alloc(Int32Array, 8);
  lodArray.set(lods);

  Module._createTerrainChunkMeshAsync(
    inst,
    taskId,
    x, y, z,
    lodArray.byteOffset,
  );
  const p = makePromise();
  cbs.set(taskId, p);

  allocator.freeAll();

  const outputBufferOffset = await p;

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
w.createLiquidChunkMeshAsync = async (inst, taskId, x, y, z, lods) => {
  const allocator = new Allocator(Module);

  const lodArray = allocator.alloc(Int32Array, 8);
  lodArray.set(lods);

  Module._createLiquidChunkMeshAsync(
    inst,
    taskId,
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

w.getHeightfieldRangeAsync = async (inst, taskId, x, y, w, h, lod, priority) => {
  const allocator = new Allocator(Module);

  try {
    const heights = allocator.alloc(Float32Array, w * h);

    /* console.log('get heightfield range', {
      inst,
      taskId,
      x, y,
      w, h,
      lod,
      byteOffset: heights.byteOffset,
      priority
    }); */

    Module._getHeightfieldRangeAsync(
      inst,
      taskId,
      x, y,
      w, h,
      lod,
      heights.byteOffset,
      priority
    );

    const p = makePromise();
    cbs.set(taskId, p);

    await p;

    return heights.slice();
  /* } catch(err) {
    console.warn(err);
    debugger; */
  } finally {
    allocator.freeAll();
  }
};
w.getLightRangeAsync = async (inst, taskId, x, y, z, w, h, d, lod, priority) => {
  const allocator = new Allocator(Module);

  try {
    const skylightsArray = allocator.alloc(Uint8Array, w * h * d);
    const aosArray = allocator.alloc(Uint8Array, w * h * d);

    Module._getLightRangeAsync(
      inst,
      taskId,
      x, y, z,
      w, h, d,
      lod,
      skylightsArray.byteOffset,
      aosArray.byteOffset,
      priority
    );

    const p = makePromise();
    cbs.set(taskId, p);

    await p;

    return {
      skylights: skylightsArray.slice(),
      aos: aosArray.slice(),
    };
  } finally {
    allocator.freeAll();
  }
};

//

w.getChunkHeightfieldAsync = async (inst, taskId, x, z, lod, priority) => {
  Module._getChunkHeightfieldAsync(
    inst,
    taskId,
    x, z,
    lod,
    priority
  );

  const p = makePromise();
  cbs.set(taskId, p);
  const heights = await p;

  const heights2 = new Float32Array(Module.HEAPU8.buffer, heights, chunkSize * chunkSize).slice();
  Module._doFree(heights);
  return heights2;
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
w.getChunkSkylightAsync = async (inst, taskId, x, y, z, lod) => {
  // const allocator = new Allocator(Module);

  // const gridPoints = chunkSize + 3 + lod;
  // const skylights = allocator.alloc(Uint8Array, chunkSize * chunkSize * chunkSize);

  // try {
    Module._getChunkSkylightAsync(
      inst,
      taskId,
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
w.getChunkAoAsync = async (inst, taskId, x, y, z, lod) => {
  // const allocator = new Allocator(Module);

  // const aos = allocator.alloc(Uint8Array, chunkSize * chunkSize * chunkSize);

  // try {
    Module._getChunkAoAsync(
      inst,
      taskId,
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
w.createGrassSplatAsync = async (inst, taskId, x, z, lod, priority) => {
  // const allocator = new Allocator(Module);

  // const allocSize = 64 * 1024;
  // const ps = allocator.alloc(Float32Array, allocSize * 3);
  // const qs = allocator.alloc(Float32Array, allocSize * 4);
  // const instances = allocator.alloc(Float32Array, allocSize);
  // const count = allocator.alloc(Uint32Array, 1);

  // try {
    Module._createGrassSplatAsync(
      inst,
      taskId,
      x, z,
      lod,
      priority
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
w.createVegetationSplatAsync = async (inst, taskId, x, z, lod, priority) => {
  // const allocator = new Allocator(Module);

  // const allocSize = 64 * 1024;
  // const ps = allocator.alloc(Float32Array, allocSize * 3);
  // const qs = allocator.alloc(Float32Array, allocSize * 4);
  // const instances = allocator.alloc(Float32Array, allocSize);
  // const count = allocator.alloc(Uint32Array, 1);

  // try {
    Module._createVegetationSplatAsync(
      inst,
      taskId,
      x, z,
      lod,
      priority
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
w.createMobSplatAsync = async (inst, taskId, x, z, lod, priority) => {
  // const allocator = new Allocator(Module);

  /* const allocSize = 64 * 1024;
  const ps = allocator.alloc(Float32Array, allocSize * 3);
  const qs = allocator.alloc(Float32Array, allocSize * 4);
  const instances = allocator.alloc(Float32Array, allocSize);
  const count = allocator.alloc(Uint32Array, 1); */

  // try {
    Module._createMobSplatAsync(
      inst,
      taskId,
      x, z,
      lod,
      priority
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

//

w.setCamera = (
  inst,
  worldPosition,
  cameraPosition,
  cameraQuaternion,
  projectionMatrix
) => {
  const allocator = new Allocator(Module);

  const worldPositionArray = allocator.alloc(Float32Array, 3);
  worldPositionArray.set(worldPosition);

  const cameraPositionArray = allocator.alloc(Float32Array, 3);
  cameraPositionArray.set(cameraPosition);

  const cameraQuaternionArray = allocator.alloc(Float32Array, 4);
  cameraQuaternionArray.set(cameraQuaternion);

  const projectionMatrixArray = allocator.alloc(Float32Array, 16);
  projectionMatrixArray.set(projectionMatrix);

  Module._setCamera(
    inst,
    worldPositionArray.byteOffset,
    cameraPositionArray.byteOffset,
    cameraQuaternionArray.byteOffset,
    projectionMatrixArray.byteOffset
  );

  allocator.freeAll();
};

//

w.cancelTask = async (inst, taskId) => {
  // console.log('cancel task', inst, taskId);
  Module._cancelTask(inst, taskId);
};

globalThis.handleResult = (id, result) => {
  const p = cbs.get(id);
  if (p) {
    cbs.delete(id);
    p.accept(result);
  } else {
    console.warn('failed to find promise for id', id, result);
  }
};

export default w;