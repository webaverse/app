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

const geometryRegistry = {};

const _marchObjects = (objects, heightfields, lightfields) => {
  const geometries = objects.map(o => geometryRegistry[o.type]);

  let numOpaquePositions = 0;
  let numOpaqueUvs = 0;
  let numOpaqueIds = 0;
  let numOpaqueIndices = 0;
  let numTransparentPositions = 0;
  let numTransparentUvs = 0;
  let numTransparentIds = 0;
  let numTransparentIndices = 0;
  for (const geometrySpecs of geometries) {
    for (const geometry of geometrySpecs) {
      if (!geometry.transparent) {
        numOpaquePositions += geometry.positions.length;
        numOpaqueUvs += geometry.uvs.length;
        numOpaqueIds += geometry.positions.length/3;
        numOpaqueIndices += geometry.indices.length;
      } else {
        numTransparentPositions += geometry.positions.length;
        numTransparentUvs += geometry.uvs.length;
        numTransparentIds += geometry.positions.length/3;
        numTransparentIndices += geometry.indices.length;
      }
    }
  }

  const arraybuffer = new ArrayBuffer(
    numOpaquePositions * Float32Array.BYTES_PER_ELEMENT +
    numOpaqueUvs * Float32Array.BYTES_PER_ELEMENT +
    numOpaqueIds * Float32Array.BYTES_PER_ELEMENT +
    numOpaqueIndices * Uint32Array.BYTES_PER_ELEMENT +
    numTransparentPositions * Float32Array.BYTES_PER_ELEMENT +
    numTransparentUvs * Float32Array.BYTES_PER_ELEMENT +
    numTransparentIds * Float32Array.BYTES_PER_ELEMENT +
    numTransparentIndices * Uint32Array.BYTES_PER_ELEMENT
  );
  let index = 0;
  const opaque = {};
  opaque.positions = new Float32Array(arraybuffer, index, numOpaquePositions);
  index += numOpaquePositions * Float32Array.BYTES_PER_ELEMENT;
  opaque.uvs = new Float32Array(arraybuffer, index, numOpaqueUvs);
  index += numOpaqueUvs * Float32Array.BYTES_PER_ELEMENT;
  opaque.ids = new Float32Array(arraybuffer, index, numOpaqueIds);
  index += numOpaqueIds * Float32Array.BYTES_PER_ELEMENT;
  opaque.indices = new Uint32Array(arraybuffer, index, numOpaqueIndices);
  index += numOpaqueIndices * Uint32Array.BYTES_PER_ELEMENT;
  opaque.positionsIndex = 0;
  opaque.uvsIndex = 0;
  opaque.idsIndex = 0;
  opaque.indicesIndex = 0;

  const transparent = {};
  transparent.positions = new Float32Array(arraybuffer, index, numTransparentPositions);
  index += numTransparentPositions * Float32Array.BYTES_PER_ELEMENT;
  transparent.uvs = new Float32Array(arraybuffer, index, numTransparentUvs);
  index += numTransparentUvs * Float32Array.BYTES_PER_ELEMENT;
  transparent.ids = new Float32Array(arraybuffer, index, numTransparentIds);
  index += numTransparentIds * Float32Array.BYTES_PER_ELEMENT;
  transparent.indices = new Uint32Array(arraybuffer, index, numTransparentIndices);
  index += numTransparentIndices * Uint32Array.BYTES_PER_ELEMENT;
  transparent.positionsIndex = 0;
  transparent.uvsIndex = 0;
  transparent.idsIndex = 0;
  transparent.indicesIndex = 0;

  for (let i = 0; i < geometries.length; i++) {
    const geometrySpecs = geometries[i];
    const object = objects[i];
    const matrix = localMatrix.fromArray(object.matrix);

    for (const geometry of geometrySpecs) {
      const spec = geometry.transparent ? transparent : opaque;

      const indexOffset2 = spec.positionsIndex/3;
      for (let j = 0; j < geometry.indices.length; j++) {
        spec.indices[spec.indicesIndex + j] = geometry.indices[j] + indexOffset2;
      }
      spec.indicesIndex += geometry.indices.length;

      for (let j = 0; j < geometry.positions.length; j += 3) {
        localVector
          .fromArray(geometry.positions, j)
          .applyMatrix4(matrix)
          .toArray(spec.positions, spec.positionsIndex + j);
      }
      spec.positionsIndex += geometry.positions.length;

      spec.uvs.set(geometry.uvs, spec.uvsIndex);
      spec.uvsIndex += geometry.uvs.length;

      spec.ids.fill(object.id, spec.idsIndex, spec.idsIndex + geometry.positions.length/3);
      spec.idsIndex += geometry.positions.length/3;
    }
  }

  return [
    {
      opaque,
      transparent,
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
      const {type, geometrySpecs} = data;

      geometryRegistry[type] = geometrySpecs;

      self.postMessage({
        result: {},
      });
      break;
    }
    case 'marchObjects': {
      const {objects, heightfields, lightfields} = data;

      const results = [];
      const transfers = [];
      const [result, transfer] = _marchObjects(objects, heightfields, lightfields);
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
