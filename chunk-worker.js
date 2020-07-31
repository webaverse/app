importScripts('./bin/objectize2.js');

const subparcelSize = 10;
const subparcelSizeP1 = subparcelSize+1;
const potentialDefault = -0.5;
const maxNumObjects = 16;

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
const _loadNoise = (seedData, x, y, z, baseHeight, freqsData, octavesData, scalesData, uvsData, ampsData, parcelSize, subparcelSize, potentials, objectPositions, objectQuaternions, objectTypes, numObjects) => {
  freqs.set(Float32Array.from(freqsData));
  octaves.set(Int32Array.from(octavesData));
  scales.set(Float32Array.from(scalesData));
  uvs.set(Float32Array.from(uvsData));
  amps.set(Float32Array.from(ampsData));
  dims.set(Int32Array.from([subparcelSize, subparcelSize, subparcelSize]));
  limits.set(Int32Array.from([parcelSize, parcelSize, parcelSize]));
  shifts.set(Float32Array.from([x*subparcelSize, y*subparcelSize, z*subparcelSize]));

  const wormRate = 2;
  const wormRadiusBase = 2;
  const wormRadiusRate = 2;
  const objectsRate = 3;

  Module._doNoise3(
    seedData,
    baseHeight,
    freqs.offset,
    octaves.offset,
    scales.offset,
    uvs.offset,
    amps.offset,
    dims.offset,
    shifts.offset,
    limits.offset,
    wormRate,
    wormRadiusBase,
    wormRadiusRate,
    objectsRate,
    potentialDefault,
    potentials.offset,
    objectPositions.offset,
    objectQuaternions.offset,
    objectTypes.offset,
    numObjects.offset
  );
};
const _getChunkSpec = (potentials, shiftsData, meshId, subparcelSize) => {
  const subparcelSizeP1 = subparcelSize+1;

  dims.set(Int32Array.from([subparcelSizeP1, subparcelSizeP1, subparcelSizeP1]));
  shifts.set(Float32Array.from(shiftsData));
  scale.set(Float32Array.from([1, 1, 1]));
  numPositions[0] = positions.length;
  numBarycentrics[0] = barycentrics.length;

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
const _meshChunkSlab = (meshId, x, y, z, potentialsData, subparcelSize) => {
  potentials.set(potentialsData);
  const shiftsData = [
    x*subparcelSize,
    y*subparcelSize,
    z*subparcelSize,
  ];
  const {positions, barycentrics, ids, indices, arrayBuffer: arrayBuffer2} = _getChunkSpec(potentials, shiftsData, meshId, subparcelSize);
  return [
    {
      positions,
      barycentrics,
      ids,
      indices,
      x,
      y,
      z,
    },
    arrayBuffer2
  ];
};

const queue = [];
let loaded = false;
const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    case 'loadPotentials': {
      const {seed: seedData, meshId, x, y, z, baseHeight, freqs, octaves, scales, uvs, amps, parcelSize, subparcelSize} = data;

      _loadNoise(seedData, x, y, z, baseHeight, freqs, octaves, scales, uvs, amps, parcelSize, subparcelSize, potentials, objectPositions, objectQuaternions, objectTypes, numObjects);
      /* if (potentials) {
        for (let i = 0; i < potentials.length; i++) {
          slab.data.potentials[i] += potentials[i];
        }
      } */

      /* const {
        potentials,
        objectPositions,
        objectQuaternions,
        objectTypes,
        numObjects,
      } = slab.data; */
      const potentials2 = potentials.slice();
      const objects = Array(numObjects[0]);
      for (let i = 0; i < objects.length; i++) {
        objects[i] = {
          position: objectPositions.slice(i*3, (i+1)*3),
          quaternion: objectQuaternions.slice(i*4, (i+1)*4),
          type: objectTypes[i],
        };
      }
      self.postMessage({
        result: {
          potentials: potentials2,
          objects,
        },
      }, [potentials2.buffer]);
      break;
    }
    case 'marchLand': {
      const {seed: seedData, meshId, x, y, z, potentials, parcelSize, subparcelSize} = data;

      const results = [];
      const transfers = [];
      const [result, transfer] = _meshChunkSlab(meshId, x, y, z, potentials, subparcelSize);
      results.push(result);
      transfers.push(transfer);

      self.postMessage({
        result: results,
      }, transfers);
      break;
    }
    case 'mine': {
      const {meshId, mineSpecs, subparcelSize} = data;

      const results = [];
      const transfers = [];
      for (const mineSpec of mineSpecs) {
        const [result, transfer] = _meshChunkSlab(meshId, mineSpec.x, mineSpec.y, mineSpec.z, mineSpec.potentials, subparcelSize);
        results.push(result);
        transfers.push(transfer);
      }

      self.postMessage({
        result: results,
      }, transfers);
      break;
    }
    case 'getHeight': {
      const {seed, x, y, z, baseHeight, freqs: freqsData, octaves: octavesData, scales: scalesData, uvs: uvsData, amps: ampsData, parcelSize} = data;

      freqs.set(Float32Array.from(freqsData));
      octaves.set(Int32Array.from(octavesData));
      scales.set(Float32Array.from(scalesData));
      uvs.set(Float32Array.from(uvsData));
      amps.set(Float32Array.from(ampsData));
      limits.set(Int32Array.from([parcelSize, parcelSize, parcelSize]));

      const height = Module._doGetHeight(
        seed,
        x,
        y,
        z,
        baseHeight,
        freqs.offset,
        octaves.offset,
        scales.offset,
        uvs.offset,
        amps.offset,
        limits.offset
      );

      self.postMessage({
        result: height,
      });
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

let potentials, objectPositions, objectQuaternions, objectTypes, numObjects, freqs, octaves, scales, uvs, amps, dims, limits, shifts, scale, positions, barycentrics, numPositions, numBarycentrics;
wasmModulePromise.then(() => {
  loaded = true;

  const allocator = new Allocator();
  potentials = allocator.alloc(Float32Array, subparcelSizeP1*subparcelSizeP1*subparcelSizeP1);
  objectPositions = allocator.alloc(Float32Array, maxNumObjects*3);
  objectQuaternions = allocator.alloc(Float32Array, maxNumObjects*4);
  objectTypes = allocator.alloc(Uint32Array, maxNumObjects);
  numObjects = allocator.alloc(Uint32Array, 1);
  freqs = allocator.alloc(Float32Array, 3);
  octaves = allocator.alloc(Int32Array, 3);
  scales = allocator.alloc(Float32Array, 3);
  uvs = allocator.alloc(Float32Array, 3);
  amps = allocator.alloc(Float32Array, 3);
  dims = allocator.alloc(Int32Array, 3);
  limits = allocator.alloc(Int32Array, 3);
  shifts = allocator.alloc(Float32Array, 3);
  scale = allocator.alloc(Float32Array, 3);
  positions = allocator.alloc(Float32Array, 4 * 1024 * 1024);
  barycentrics = allocator.alloc(Float32Array, 4 * 1024 * 1024);
  numPositions = allocator.alloc(Uint32Array, 1);
  numBarycentrics = allocator.alloc(Uint32Array, 1);

  _flushMessages();
}).catch(err => {
  console.warn(err.stack);
});
