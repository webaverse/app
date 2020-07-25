importScripts('https://static.xrpackage.org/xrpackage/three.js');
const wasmModulePromise = Promise.resolve();

const localVector = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();

const _makeSlabData = (x, y, z, freqsData, octavesData, scalesData, uvsData, ampsData, parcelSize, subparcelSize) => {
  const allocator = new Allocator();

  const potentials = allocator.alloc(Float32Array, subparcelSize * subparcelSize * subparcelSize);
  const freqs = allocator.alloc(Float32Array, freqsData.length);
  freqs.set(Float32Array.from(freqsData));
  const octaves = allocator.alloc(Int32Array, octavesData.length);
  octaves.set(Int32Array.from(octavesData));
  const scales = allocator.alloc(Float32Array, scalesData.length);
  scales.set(Float32Array.from(scalesData));
  const uvs = allocator.alloc(Float32Array, uvsData.length);
  uvs.set(Float32Array.from(uvsData));
  const amps = allocator.alloc(Float32Array, ampsData.length);
  amps.set(Float32Array.from(ampsData));
  const dims = allocator.alloc(Int32Array, 3);
  dims.set(Int32Array.from([subparcelSize, subparcelSize, subparcelSize]));
  const limits = allocator.alloc(Int32Array, 3);
  limits.set(Int32Array.from([parcelSize, parcelSize, parcelSize]));
  const shifts = allocator.alloc(Float32Array, 3);
  shifts.set(Float32Array.from([x*subparcelSize, y*subparcelSize, z*subparcelSize]));

  return {
    potentials,
    freqs,
    octaves,
    scales,
    uvs,
    amps,
    dims,
    limits,
    shifts,
    allocator,
  }
};

const createds = [];
class Chunk {
  constructor(meshId, freqs, octaves, scales, uvs, amps, parcelSize, subparcelSize) {
    this.meshId = meshId;
    this.freqs = freqs;
    this.octaves = octaves;
    this.scales = scales;
    this.uvs = uvs;
    this.amps = amps;
    this.parcelSize = parcelSize;
    this.subparcelSize = subparcelSize;

    this.index = 0;
    this.slabs = [];
  }
  getSlab(x, y, z) {
    return this.slabs.find(slab => slab.x === x && slab.y === y && slab.z === z);
  }
  getOrCreateSlab(x, y, z) {
    let slab = this.getSlab(x, y, z);
    if (!slab) {
      createds.push([x, y, z]);
      const data = _makeSlabData(x, y, z, this.freqs, this.octaves, this.scales, this.uvs, this.amps, this.parcelSize, this.subparcelSize);
      slab = this.setSlab(x, y, z, data);
    }
    return slab;
  }
  setSlab(x, y, z, data) {
    const slab = {
      x,
      y,
      z,
      slabIndex: this.index,
      data,
    };
    this.slabs.push(slab);
    this.index++;
    return slab;
  }
}
const chunks = [];
const _getChunk = (meshId, freqs, octaves, scales, uvs, amps, parcelSize, subparcelSize) => {
  let chunk = chunks.find(chunk => chunk.meshId === meshId);
  if (!chunk) {
    chunk = new Chunk(meshId, freqs, octaves, scales, uvs, amps, parcelSize, subparcelSize);
    chunks.push(chunk);
  }
  return chunk;
}

class Allocator {
  constructor() {
    this.offsets = [];
  }
  alloc(constructor, size) {
    const offset = self.Module._malloc(size * constructor.BYTES_PER_ELEMENT);
    const b = new constructor(self.Module.HEAP8.buffer, self.Module.HEAP8.byteOffset + offset, size);
    b.offset = offset;
    this.offsets.push(offset);
    return b;
  }
  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      self.Module._doFree(this.offsets[i]);
    }
    this.offsets.length = 0;
  }
}

function mod(a, b) {
  return ((a%b)+b)%b;
}
const _getPotentialIndex = (x, y, z, subparcelSize) => x + y*subparcelSize*subparcelSize + z*subparcelSize;
const _getPotentialFullIndex = (x, y, z, subparcelSizeP1) => x + y*subparcelSizeP1*subparcelSizeP1 + z*subparcelSizeP1;
const _getChunkSpec = (potentials, shiftsData, meshId, subparcelSize) => {
  const subparcelSizeP1 = subparcelSize+1;

  const allocator = new Allocator();

  const dims = allocator.alloc(Int32Array, 3);
  dims.set(Int32Array.from([subparcelSizeP1, subparcelSizeP1, subparcelSizeP1]));
  const shifts = allocator.alloc(Float32Array, 3);
  shifts.set(Float32Array.from(shiftsData));
  const positions = allocator.alloc(Float32Array, 4 * 1024 * 1024);
  const barycentrics = allocator.alloc(Float32Array, 4 * 1024 * 1024);

  const numPositions = allocator.alloc(Uint32Array, 1);
  numPositions[0] = positions.length;
  const numBarycentrics = allocator.alloc(Uint32Array, 1);
  numBarycentrics[0] = barycentrics.length;

  const scale = allocator.alloc(Float32Array, 3);
  scale.set(Float32Array.from([1, 1, 1]));

  self.Module._doMarchingCubes2(
    dims.offset,
    potentials.offset,
    shifts.offset,
    scale.offset,
    positions.offset,
    barycentrics.offset,
    numPositions.offset,
    numBarycentrics.offset
  );

  const arrayBuffer2 = new ArrayBuffer(
    numPositions[0] * Float32Array.BYTES_PER_ELEMENT +
    numBarycentrics[0] * Float32Array.BYTES_PER_ELEMENT +
    numPositions[0]/3 * Float32Array.BYTES_PER_ELEMENT +
    numPositions[0]/3 * Float32Array.BYTES_PER_ELEMENT
  );

  let index = 0;

  // const outPotentials = new Float32Array(arrayBuffer2, index, potentials.length);
  // outPotentials.set(potentials);
  // index += Float32Array.BYTES_PER_ELEMENT * potentials.length;

  const outP = new Float32Array(arrayBuffer2, index, numPositions[0]);
  outP.set(new Float32Array(positions.buffer, positions.byteOffset, numPositions[0]));
  index += Float32Array.BYTES_PER_ELEMENT * numPositions[0];

  const outB = new Float32Array(arrayBuffer2, index, numBarycentrics[0]);
  outB.set(new Float32Array(barycentrics.buffer, barycentrics.byteOffset, numBarycentrics[0]));
  index += Float32Array.BYTES_PER_ELEMENT * numBarycentrics[0];

  /* const outI = new Uint32Array(arrayBuffer2, index, numIndices[0]);
  outI.set(new Uint32Array(indices.buffer, indices.byteOffset, numIndices[0]));
  index += Uint32Array.BYTES_PER_ELEMENT * numIndices[0]; */

  allocator.freeAll();

  const ids = new Float32Array(arrayBuffer2, index, numPositions[0]/3);
  index += numPositions[0]/3 * Float32Array.BYTES_PER_ELEMENT;
  const indices = new Float32Array(arrayBuffer2, index, numPositions[0]/3);
  index += numPositions[0]/3 * Float32Array.BYTES_PER_ELEMENT;
  for (let i = 0; i < numPositions[0]/3/3; i++) {
    ids[i*3] = meshId;
    ids[i*3+1] = meshId;
    ids[i*3+2] = meshId;
    indices[i*3] = i;
    indices[i*3+1] = i;
    indices[i*3+2] = i;
  }

  return {
    // result: {
    // potentials: outPotentials,
    positions: outP,
    barycentrics: outB,
    ids,
    indices,
    arrayBuffer: arrayBuffer2,
    // indices: outI,
  };
};
const _meshChunkSlab = (chunk, slab, subparcelSize) => {
  const subparcelSizeP1 = subparcelSize+1;

  const allocator = new Allocator();
  const fullPotentials = allocator.alloc(Float32Array, subparcelSizeP1 * subparcelSizeP1 * subparcelSizeP1);
  for (let dx = 0; dx < subparcelSizeP1; dx++) {
    const lix = slab.x + Math.floor(dx/subparcelSize);
    for (let dy = 0; dy < subparcelSizeP1; dy++) {
      const liy = slab.y + Math.floor(dy/subparcelSize);
      for (let dz = 0; dz < subparcelSizeP1; dz++) {
        const liz = slab.z + Math.floor(dz/subparcelSize);
        const fullIndex = _getPotentialFullIndex(dx, dy, dz, subparcelSizeP1);
        const localSlab = chunk.getSlab(lix, liy, liz);
        if (localSlab) {
          const lx = mod(dx, subparcelSize);
          const ly = mod(dy, subparcelSize)
          const lz = mod(dz, subparcelSize)
          const index = _getPotentialIndex(lx, ly, lz, subparcelSize);
          fullPotentials[fullIndex] = localSlab.data.potentials[index];
        } else {
          fullPotentials[fullIndex] = potentialDefault;
        }
      }
    }
  }
  const shiftsData = [
    slab.x*subparcelSize,
    slab.y*subparcelSize,
    slab.z*subparcelSize,
  ];
  const {positions, barycentrics, ids, indices, arrayBuffer: arrayBuffer2} = _getChunkSpec(fullPotentials, shiftsData, chunk.meshId, subparcelSize);
  allocator.freeAll();
  return [
    {
      positions,
      barycentrics,
      ids,
      indices,
      x: slab.x,
      y: slab.y,
      z: slab.z,
      // arrayBuffer2,
    },
    arrayBuffer2
  ];
};

const geometryRegistry = {};

const _marchObjects = objects => {
  const geometries = objects.map(o => geometryRegistry[o.type]);

  let numPositions = 0;
  let numUvs = 0;
  let numIndices = 0;
  for (const geometry of geometries) {
    numPositions += geometry.positions.length;
    numUvs += geometry.uvs.length;
    numIndices += geometry.indices.length;
  }

  const arraybuffer = new ArrayBuffer(
    numPositions * Float32Array.BYTES_PER_ELEMENT +
    numUvs * Float32Array.BYTES_PER_ELEMENT +
    numIndices * Uint32Array.BYTES_PER_ELEMENT
  );
  let index = 0;
  const positions = new Float32Array(arraybuffer, index, numPositions);
  index += numPositions * Float32Array.BYTES_PER_ELEMENT;
  const uvs = new Float32Array(arraybuffer, index, numUvs);
  index += numUvs * Float32Array.BYTES_PER_ELEMENT;
  const indices = new Uint32Array(arraybuffer, index, numIndices);
  index += numIndices * Uint32Array.BYTES_PER_ELEMENT;

  let positionsIndex = 0;
  let uvsIndex = 0;
  let indicesIndex = 0;
  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    const object = objects[i];
    const matrix = localMatrix.fromArray(object.matrix);

    const indexOffset = positionsIndex/3;
    for (let j = 0; j < geometry.indices.length; j++) {
      indices[indicesIndex + j] = geometry.indices[j] + indexOffset;
    }
    indicesIndex += geometry.indices.length;

    for (let j = 0; j < geometry.positions.length; j += 3) {
      localVector
        .fromArray(geometry.positions, j)
        .applyMatrix4(matrix)
        .toArray(positions, positionsIndex + j);
    }
    positionsIndex += geometry.positions.length;

    uvs.set(geometry.uvs, uvsIndex);
    uvsIndex += geometry.uvs.length;
  }

  return [
    {
      positions,
      uvs,
      indices,
    },
    arraybuffer,
  ];
};

const queue = [];
let loaded = false;
const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    case 'registerGeometry': {
      const {type, positions, uvs, indices} = data;

      geometryRegistry[type] = {
        positions,
        uvs,
        indices,
      };

      self.postMessage({
        result: {},
      });
      break;
    }
    case 'marchObjects': {
      const {objects} = data;

      const results = [];
      const transfers = [];
      const [result, transfer] = _marchObjects(objects);
      results.push(result);
      transfers.push(transfer);

      self.postMessage({
        result: results,
      }, transfers);
      break;
    }
    default: {
      console.warn('unknown method', data.method);
      break;
    }
  }
};
const _flushMessages = () => {
  for (let i = 0; i < queue.length; i++) {
    _handleMessage(queue[i]);
  }
};
self.onmessage = e => {
  const {data} = e;
  if (!loaded) {
    queue.push(data);
  } else {
    _handleMessage(data);
  }
};

wasmModulePromise.then(() => {
  loaded = true;
  _flushMessages();
}).catch(err => {
  console.warn(err.stack);
});
