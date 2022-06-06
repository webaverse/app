import Module from './public/bin/dc.js'
import {Allocator} from './geometry-util.js';
import {defaultChunkSize} from './constants.js';

// const localVector = new THREE.Vector3()
// const localVector2 = new THREE.Vector3()
// const localQuaternion = new THREE.Quaternion()
// const capsuleUpQuaternion = new THREE.Quaternion().setFromAxisAngle(
//   new THREE.Vector3(0, 0, 1),
//   Math.PI / 2
// )
// const textEncoder = new TextEncoder();
// const textDecoder = new TextDecoder();

const w = {};

w.waitForLoad = Module.waitForLoad;

/* let loaded = false;
Module.waitForLoad().then(() => {
  loaded = true;
}); */
w.free = address => {
  // console.log('try momdule free', Module, loaded);
  Module._doFree(address);
};

let chunkSize = defaultChunkSize;
w.initialize = (newChunkSize, seed) => {
  Module._initialize(newChunkSize, seed);
  chunkSize = newChunkSize;
};

const cubeDamage = damageFn => (
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
    const gridPoints = chunkSize + 3;
    const damageBufferSize = gridPoints * gridPoints * gridPoints;
    const damageBuffersTypedArray = allocator.alloc(Float32Array, numPositions * gridPoints * gridPoints * gridPoints);

    const drew = damageFn(
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

const sphereDamage = damageFn => (
  x, y, z,
  radius,
) => {
  const allocator = new Allocator(Module);

  try {
    let numPositions = 8;
    const positionsTypedArray = allocator.alloc(Float32Array, numPositions * 3);
    const numPositionsTypedArray = allocator.alloc(Uint32Array, 1);
    numPositionsTypedArray[0] = numPositions;
    const gridPoints = chunkSize + 3;
    const damageBufferSize = gridPoints * gridPoints * gridPoints;
    const damageBuffersTypedArray = allocator.alloc(Float32Array, numPositions * gridPoints * gridPoints * gridPoints);

    const drew = damageFn(
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
w.drawSphereDamage = function() {
  return sphereDamage(Module._drawSphereDamage.bind(Module)).apply(this, arguments);
};
w.eraseSphereDamage = function() {
  return sphereDamage(Module._eraseSphereDamage.bind(Module)).apply(this, arguments);
};

w.injectDamage = function(x, y, z, damageBuffer) {
  const allocator = new Allocator(Module);

  const damageBufferTypedArray = allocator.alloc(Float32Array, damageBuffer.length);
  damageBufferTypedArray.set(damageBuffer);

  try {
    Module._injectDamage(
      x, y, z,
      damageBufferTypedArray.byteOffset,
    );
  } finally {
    allocator.freeAll();
  }
};

w.clearChunkRootDualContouring = (x, y, z) => {
  Module._clearChunkRootDualContouring(x, y, z)
}

w.createChunkMeshDualContouring = (x, y, z, lods) => {
  const allocator = new Allocator(Module);

  const lodArray = allocator.alloc(Int32Array, 8);
  lodArray.set(lods);

  const outputBufferOffset = Module._createChunkMeshDualContouring(
    x, y, z,
    lodArray.byteOffset,
  );

  allocator.freeAll();

  if (outputBufferOffset) {
    const _parseVertexBuffer = (arrayBuffer, bufferAddress) => {
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
    const result = _parseVertexBuffer(
      Module.HEAP8.buffer,
      Module.HEAP8.byteOffset + outputBufferOffset
    );
    return result;
  } else {
    return null;
  }
};

w.getHeightfieldRange = (x, z, w, h, lod) => {
  const allocator = new Allocator(Module);

  const heights = allocator.alloc(Float32Array, w * h);

  try {
    Module._getHeightfieldRange(
      x,
      z,
      w,
      h,
      lod,
      heights.byteOffset
    );
    return heights.slice();
  } finally {
    allocator.freeAll();
  }
};

w.createGrassSplat = (x, z, lod) => {
  const allocator = new Allocator(Module);

  const allocSize = 64 * 1024;
  const ps = allocator.alloc(Float32Array, allocSize * 3);
  const qs = allocator.alloc(Float32Array, allocSize * 4);
  const count = allocator.alloc(Uint32Array, 1);

  try {
    Module._createGrassSplat(
      x,
      z,
      lod,
      ps.byteOffset,
      qs.byteOffset,
      count.byteOffset
    );
    const numElements = count[0];
    return {
      ps: ps.slice(0, numElements * 3),
      qs: qs.slice(0, numElements * 4),
    };
  } finally {
    allocator.freeAll();
  }
};
w.createVegetationSplat = (x, z, lod) => {
  const allocator = new Allocator(Module);

  const allocSize = 64 * 1024;
  const ps = allocator.alloc(Float32Array, allocSize * 3);
  const qs = allocator.alloc(Float32Array, allocSize * 4);
  const count = allocator.alloc(Uint32Array, 1);

  try {
    Module._createVegetationSplat(
      x,
      z,
      lod,
      ps.byteOffset,
      qs.byteOffset,
      count.byteOffset
    );
    const numElements = count[0];
    return {
      ps: ps.slice(0, numElements * 3),
      qs: qs.slice(0, numElements * 4),
    };
  } finally {
    allocator.freeAll();
  }
};
w.createMobSplat = (x, z, lod) => {
  const allocator = new Allocator(Module);

  const allocSize = 64 * 1024;
  const ps = allocator.alloc(Float32Array, allocSize * 3);
  const qs = allocator.alloc(Float32Array, allocSize * 4);
  const count = allocator.alloc(Uint32Array, 1);

  try {
    Module._createMobSplat(
      x,
      z,
      lod,
      ps.byteOffset,
      qs.byteOffset,
      count.byteOffset
    );
    const numElements = count[0];
    return {
      ps: ps.slice(0, numElements * 3),
      qs: qs.slice(0, numElements * 4),
    };
  } finally {
    allocator.freeAll();
  }
};

export default w;