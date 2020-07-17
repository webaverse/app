importScripts('./bin/objectize2.js');

/* const {
  PARCEL_SIZE,
  SUBPARCEL_SIZE,
  SUBPARCEL_SIZE_P1,
  NUM_PARCELS,
} = globalThis.constants; */
const potentialDefault = -0.5;

class Chunk {
  constructor({meshId, subparcelSize}) {
    this.meshId = meshId;
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
      const allocator = new Allocator();
      const potentials = allocator.alloc(Float32Array, this.subparcelSize * this.subparcelSize * this.subparcelSize);
      potentials.fill(potentialDefault);
      slab = this.setSlab(x, y, z, potentials);
    }
    return slab;
  }
  setSlab(x, y, z, potentials) {
    const slab = {
      potentials,
      x,
      y,
      z,
      slabIndex: this.index,
    };
    this.slabs.push(slab);
    this.index++;
    return slab;
  }
}
const chunks = [];
const _getChunk = (meshId, subparcelSize) => {
  let chunk = chunks.find(chunk => chunk.meshId === meshId);
  if (!chunk) {
    chunk = new Chunk({meshId, subparcelSize});
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
const _makeLandPotentials = (seedData, baseHeight, freqsData, octavesData, scalesData, uvsData, ampsData, shiftsData, parcelSize, subparcelSize) => {
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
  shifts.set(Float32Array.from(shiftsData));

  const wormRate = 2;
  const wormRadiusBase = 2;
  const wormRadiusRate = 2;

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
    potentialDefault,
    potentials.offset
  );

  return {potentials, dims, shifts};
};
/* const _makePlanetPotentials = (seedData, shiftsData) => {
  const allocator = new Allocator();

  const potentials = allocator.alloc(Float32Array, SUBPARCEL_SIZE * SUBPARCEL_SIZE * SUBPARCEL_SIZE);
  const dims = allocator.alloc(Int32Array, 3);
  dims.set(Int32Array.from([SUBPARCEL_SIZE, SUBPARCEL_SIZE, SUBPARCEL_SIZE]));
  const shifts = allocator.alloc(Float32Array, 3);
  shifts.set(Float32Array.from(shiftsData));

  Module._doNoise2(
    seedData,
    0.02,
    4,
    dims.offset,
    shifts.offset,
    potentialDefault,
    potentials.offset
  );

  return {potentials, dims, shifts};
}; */
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
          const {potentials} = localSlab;
          const lx = mod(dx, subparcelSize);
          const ly = mod(dy, subparcelSize)
          const lz = mod(dz, subparcelSize)
          const index = _getPotentialIndex(lx, ly, lz, subparcelSize);
          fullPotentials[fullIndex] = potentials[index];
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

const queue = [];
let loaded = false;
const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    case 'marchLand': {
      const {seed: seedData, meshId, x, y, z, baseHeight, freqs, octaves, scales, uvs, amps, parcelSize, subparcelSize} = data;

      const chunk = _getChunk(meshId, subparcelSize);
      for (let dx = 0; dx <= 1; dx++) {
        const ix = x + dx;
        for (let dy = 0; dy <= 1; dy++) {
          const iy = y + dy;
          for (let dz = 0; dz <= 1; dz++) {
            const iz = z + dz;
            const slab = chunk.getSlab(ix, iy, iz);
            if (!slab) {
              const shiftsData = [ix*subparcelSize, iy*subparcelSize, iz*subparcelSize];
              const {potentials} = _makeLandPotentials(seedData, baseHeight, freqs, octaves, scales, uvs, amps, shiftsData, parcelSize, subparcelSize);
              chunk.setSlab(ix, iy, iz, potentials);
            }
          }
        }
      }

      const results = [];
      const transfers = [];
      const slab = chunk.getSlab(x, y, z);
      const [result, transfer] = _meshChunkSlab(chunk, slab, subparcelSize);
      results.push(result);
      transfers.push(transfer);

      self.postMessage({
        result: results,
      }, transfers);
      break;
    }
    /* case 'marchPlanet': {
      const {seed: seedData, meshId} = data;

      const chunk = _getChunk(meshId);
      for (let ix = 0; ix < NUM_PARCELS; ix++) {
        for (let iy = 0; iy < NUM_PARCELS; iy++) {
          for (let iz = 0; iz < NUM_PARCELS; iz++) {
            const shiftsData = [ix*SUBPARCEL_SIZE, iy*SUBPARCEL_SIZE, iz*SUBPARCEL_SIZE];
            const {potentials} = _makePlanetPotentials(seedData, shiftsData);
            if (ix === 0) {
              for (let dy = 0; dy < SUBPARCEL_SIZE; dy++) {
                for (let dz = 0; dz < SUBPARCEL_SIZE; dz++) {
                  potentials[_getPotentialIndex(0, dy, dz)] = potentialDefault;
                }
              }
            }
            if (iy === 0) {
              for (let dx = 0; dx < SUBPARCEL_SIZE; dx++) {
                for (let dz = 0; dz < SUBPARCEL_SIZE; dz++) {
                  potentials[_getPotentialIndex(dx, 0, dz)] = potentialDefault;
                }
              }
            }
            if (iz === 0) {
              for (let dx = 0; dx < SUBPARCEL_SIZE; dx++) {
                for (let dy = 0; dy < SUBPARCEL_SIZE; dy++) {
                  potentials[_getPotentialIndex(dx, dy, 0)] = potentialDefault;
                }
              }
            }
            if (ix === NUM_PARCELS-1) {
              for (let dy = 0; dy < SUBPARCEL_SIZE; dy++) {
                for (let dz = 0; dz < SUBPARCEL_SIZE; dz++) {
                  potentials[_getPotentialIndex(SUBPARCEL_SIZE-1, dy, dz)] = potentialDefault;
                }
              }
            }
            if (iy === NUM_PARCELS-1) {
              for (let dx = 0; dx < SUBPARCEL_SIZE; dx++) {
                for (let dz = 0; dz < SUBPARCEL_SIZE; dz++) {
                  potentials[_getPotentialIndex(dx, SUBPARCEL_SIZE-1, dz)] = potentialDefault;
                }
              }
            }
            if (iz === NUM_PARCELS-1) {
              for (let dx = 0; dx < SUBPARCEL_SIZE; dx++) {
                for (let dy = 0; dy < SUBPARCEL_SIZE; dy++) {
                  potentials[_getPotentialIndex(dx, dy, SUBPARCEL_SIZE-1)] = potentialDefault;
                }
              }
            }
            chunk.setSlab(ix, iy, iz, potentials);
          }
        }
      }

      const results = [];
      const transfers = [];
      for (let ix = 0; ix < NUM_PARCELS; ix++) {
        for (let iy = 0; iy < NUM_PARCELS; iy++) {
          for (let iz = 0; iz < NUM_PARCELS; iz++) {
            const slab = chunk.getSlab(ix, iy, iz);
            const [result, transfer] = _meshChunkSlab(chunk, slab);
            results.push(result);
            transfers.push(transfer);
          }
        }
      }

      self.postMessage({
        result: results,
      }, transfers);
      break;
    } */
    case 'mine': {
      const {meshId, mineSpecs, subparcelSize} = data;

      const chunk = _getChunk(meshId, subparcelSize);

      for (const mineSpec of mineSpecs) {
        const slab = chunk.getSlab(mineSpec.x, mineSpec.y, mineSpec.z);
        for (const mine of mineSpec.mines) {
          const [potentialIndex, value] = mine;
          slab.potentials[potentialIndex] += value;
        }
      }

      const results = [];
      const transfers = [];
      for (const mineSpec of mineSpecs) {
        const slab = chunk.getSlab(mineSpec.x, mineSpec.y, mineSpec.z);
        const [result, transfer] = _meshChunkSlab(chunk, slab, subparcelSize);
        results.push(result);
        transfers.push(transfer);
      }

      self.postMessage({
        result: results,
      }, transfers);
      break;
    }
    /* case 'uvParameterize': {
      const allocator = new Allocator();

      const {positions: positionsData, normals: normalsData, faces: facesData, arrayBuffer} = data;

      const positions = allocator.alloc(Float32Array, positionsData.length);
      positions.set(positionsData);
      const normals = allocator.alloc(Float32Array, normalsData.length);
      normals.set(normalsData);
      const faces = allocator.alloc(Uint32Array, facesData.length);
      faces.set(facesData);
      const outPositions = allocator.alloc(Float32Array, 300*1024/Float32Array.BYTES_PER_ELEMENT);
      const numOutPositions = allocator.alloc(Uint32Array, 1);
      const outNormals = allocator.alloc(Float32Array, 300*1024/Float32Array.BYTES_PER_ELEMENT);
      const numOutNormals = allocator.alloc(Uint32Array, 1);
      const outFaces = allocator.alloc(Uint32Array, faces.length);
      const uvs = allocator.alloc(Float32Array, 300*1024/Float32Array.BYTES_PER_ELEMENT);
      const numUvs = allocator.alloc(Uint32Array, 1);

      self.Module._doUvParameterize(
        positions.offset,
        positions.length,
        normals.offset,
        normals.length,
        faces.offset,
        faces.length,
        outPositions.offset,
        numOutPositions.offset,
        outNormals.offset,
        numOutNormals.offset,
        outFaces.offset,
        uvs.offset,
        numUvs.offset
      );

      let index = 0;
      const outPositions2 = new Float32Array(arrayBuffer, index, numOutPositions[0]);
      outPositions2.set(outPositions.slice(0, numOutPositions[0]));
      index += numOutPositions[0]*Float32Array.BYTES_PER_ELEMENT;
      const outNormals2 = new Float32Array(arrayBuffer, index, numOutNormals[0]);
      outNormals2.set(outNormals.slice(0, numOutNormals[0]));
      index += numOutNormals[0]*Float32Array.BYTES_PER_ELEMENT;
      const outFaces2 = new Uint32Array(arrayBuffer, index, faces.length);
      outFaces2.set(outFaces.slice(0, faces.length));
      index += faces.length*Uint32Array.BYTES_PER_ELEMENT;
      const outUvs = new Float32Array(arrayBuffer, index, numUvs[0]);
      outUvs.set(uvs.slice(0, numUvs[0]));
      index += numUvs[0]*Float32Array.BYTES_PER_ELEMENT;

      self.postMessage({
        result: {
          positions: outPositions2,
          normals: outNormals2,
          faces: outFaces2,
          uvs: outUvs,
        },
      }, [arrayBuffer]);

      allocator.freeAll();
      break;
    }
    case 'cut': {
      const allocator = new Allocator();

      const {positions: positionsData, faces: facesData, position: positionData, quaternion: quaternionData, scale: scaleData, arrayBuffer} = data;

      const positions = allocator.alloc(Float32Array, positionsData.length);
      positions.set(positionsData);
      const faces = allocator.alloc(Uint32Array, facesData.length);
      faces.set(facesData);
      const position = allocator.alloc(Float32Array, 3);
      position.set(positionData);
      const quaternion = allocator.alloc(Float32Array, 4);
      quaternion.set(quaternionData);
      const scale = allocator.alloc(Float32Array, 3);
      scale.set(scaleData);

      const outPositions = allocator.alloc(Float32Array, 300*1024/Float32Array.BYTES_PER_ELEMENT);
      const numOutPositions = allocator.alloc(Uint32Array, 2);
      const outFaces = allocator.alloc(Uint32Array, 300*1024/Uint32Array.BYTES_PER_ELEMENT);
      const numOutFaces = allocator.alloc(Uint32Array, 2);

      self.Module._doCut(
        positions.offset,
        positions.length,
        faces.offset,
        faces.length,
        position.offset,
        quaternion.offset,
        scale.offset,
        outPositions.offset,
        numOutPositions.offset,
        outFaces.offset,
        numOutFaces.offset
      );

      let index = 0;
      const outPositions2 = new Float32Array(arrayBuffer, index, numOutPositions[0]);
      outPositions2.set(outPositions.slice(0, numOutPositions[0]));
      index += numOutPositions[0]*Float32Array.BYTES_PER_ELEMENT;
      const outFaces2 = new Uint32Array(arrayBuffer, index, numOutFaces[0]);
      outFaces2.set(outFaces.slice(0, numOutFaces[0]));
      index += numOutFaces[0]*Uint32Array.BYTES_PER_ELEMENT;

      const outPositions3 = new Float32Array(arrayBuffer, index, numOutPositions[1]);
      outPositions3.set(outPositions.slice(numOutPositions[0], numOutPositions[0] + numOutPositions[1]));
      index += numOutPositions[1]*Float32Array.BYTES_PER_ELEMENT;
      const outFaces3 = new Uint32Array(arrayBuffer, index, numOutFaces[1]);
      outFaces3.set(outFaces.slice(numOutFaces[0], numOutFaces[0] + numOutFaces[1]));
      index += numOutFaces[1]*Uint32Array.BYTES_PER_ELEMENT;

      // console.log('worker positions', numOutPositions[0], numOutPositions[1], numOutFaces[0], numOutFaces[1], outPositions2, outFaces2, outPositions3, outFaces3);

      self.postMessage({
        result: {
          positions: outPositions2,
          faces: outFaces2,
          positions2: outPositions3,
          faces2: outFaces3,
        },
      }, [arrayBuffer]);

      allocator.freeAll();
      break;
    } */
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
