importScripts('./bin/objectize2.js');

const subparcelSize = 10;
const subparcelSizeP1 = subparcelSize + 1;
const subparcelSizeP3 = subparcelSize + 3;
const potentialDefault = -0.5;

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

  free(offset) {
    self.Module._doFree(offset);
    this.offsets.splice(this.offsets.indexOf(offset), 1);
  }

  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      self.Module._doFree(this.offsets[i]);
    }
    this.offsets.length = 0;
  }
}
const allocator = new Allocator();

const _align4 = n => {
  const d = n % 4;
  return d ? (n + 4 - d) : n;
};
const _loadNoise = (seedData, x, y, z, baseHeight, subparcelByteOffset) => {
  // dims.set(Int32Array.from([subparcelSize, subparcelSize, subparcelSize]));
  // shifts.set(Float32Array.from([x*subparcelSize, y*subparcelSize, z*subparcelSize]));

  const wormRate = 2;
  const wormRadiusBase = 2;
  const wormRadiusRate = 2;
  const objectsRate = 3;

  Module._doNoise3(
    seedData,
    x, y, z,
    baseHeight,
    // dims.offset,
    // shifts.offset,
    wormRate,
    wormRadiusBase,
    wormRadiusRate,
    objectsRate,
    potentialDefault,
    subparcelByteOffset,
  );
};
const _getChunkSpec = (potentials, biomes, heightfield, lightfield, shiftsData, meshId, position, normal, uv, barycentric, ao, id, skyLight, torchLight, peeks) => {
  dims.set(Int32Array.from([subparcelSize, subparcelSize, subparcelSize]));
  shifts.set(Float32Array.from(shiftsData));
  scale.set(Float32Array.from([1, 1, 1]));
  numPositions[0] = 0;
  numUvs[0] = 0;
  numBarycentrics[0] = 0;
  numAos[0] = 0;

  self.Module._doMarchingCubes2(
    dims.offset,
    potentials.byteOffset,
    biomes.byteOffset,
    heightfield.byteOffset,
    lightfield.byteOffset,
    shifts.offset,
    scale.offset,
    position.byteOffset,
    normal.byteOffset,
    uv.byteOffset,
    barycentric.byteOffset,
    ao.byteOffset,
    numPositions.offset,
    numNormals.offset,
    numUvs.offset,
    numBarycentrics.offset,
    numAos.offset,
    skyLight.byteOffset,
    torchLight.byteOffset,
    numOpaquePositions.offset,
    numTransparentPositions.offset,
    peeks.byteOffset,
  );

  const ids = id.subarray(0, numPositions[0] / 3);
  for (let i = 0; i < numPositions[0] / 3 / 3; i++) {
    ids[i * 3] = meshId;
    ids[i * 3 + 1] = meshId;
    ids[i * 3 + 2] = meshId;
  }

  if (numPositions[0] > position.length) {
    debugger;
  }
  if (numNormals[0] > normal.length) {
    debugger;
  }
  if (numUvs[0] > uv.length) {
    debugger;
  }
  if (numBarycentrics[0] > barycentric.length) {
    debugger;
  }
  if (numAos[0] > ao.length) {
    debugger;
  }

  return {
    positions: position.subarray(0, numPositions[0]),
    normals: normal.subarray(0, numNormals[0]),
    uvs: uv.subarray(0, numUvs[0]),
    barycentrics: barycentric.subarray(0, numBarycentrics[0]),
    aos: ao.subarray(0, numAos[0]),
    ids,
    skyLights: skyLight.subarray(0, numPositions[0] / 3),
    torchLights: torchLight.subarray(0, numPositions[0] / 3),
    peeks,
    numOpaquePositions: numOpaquePositions[0],
    numTransparentPositions: numTransparentPositions[0],
  };
};
const _meshChunkSlab = (meshId, x, y, z, potentials, biomes, heightfield, lightfield, position, normal, uv, barycentric, ao, id, skyLight, torchLight, peeks) => {
  /* potentials.set(potentialsData);
  biomes.set(biomesData);
  heightfield.set(heightfieldData);
  lightfield.set(lightfieldData); */
  const shiftsData = [
    x * subparcelSize,
    y * subparcelSize,
    z * subparcelSize,
  ];
  const spec = _getChunkSpec(potentials, biomes, heightfield, lightfield, shiftsData, meshId, position, normal, uv, barycentric, ao, id, skyLight, torchLight, peeks);
  return {
    ...spec,
    x,
    y,
    z,
  };
};

const queue = [];
let loaded = false;
const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    case 'alloc': {
      const {size} = data;
      const uint8Array = allocator.alloc(Uint8Array, size);
      self.postMessage({
        result: uint8Array,
      });
      break;
    }
    case 'free': {
      const {offset} = data;
      allocator.free(offset);
      self.postMessage({
        result: null,
      });
      break;
    }
    case 'loadPotentials': {
      const {seed: seedData, meshId, x, y, z, baseHeight, subparcelByteOffset} = data;

      // _loadNoise(seedData, x, y, z, baseHeight, potentials, biomes, heightfield, objectPositions, objectQuaternions, objectTypes, numObjects);
      _loadNoise(seedData, x, y, z, baseHeight, subparcelByteOffset);

      /* const potentials2 = potentials.slice();
      const biomes2 = biomes.slice();
      const heightfield2 = heightfield.slice();
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
          biomes: biomes2,
          heightfield: heightfield2,
          objects,
        },
      }, [potentials2.buffer, heightfield2.buffer]); */
      self.postMessage({
        result: null,
      });
      break;
    }
    case 'marchLand': {
      const {seed: seedData, meshId, x, y, z, potentials, biomes, heightfield, lightfield, position, normal, uv, barycentric, ao, id, skyLight, torchLight, peeks} = data;
      const result = _meshChunkSlab(meshId, x, y, z, potentials, biomes, heightfield, lightfield, position, normal, uv, barycentric, ao, id, skyLight, torchLight, peeks);
      self.postMessage({
        result,
      });
      break;
    }
    case 'mine': {
      const {meshId, mineSpecs} = data;

      const results = [];
      for (const mineSpec of mineSpecs) {
        const result = _meshChunkSlab(meshId, mineSpec.x, mineSpec.y, mineSpec.z, mineSpec.potentials, mineSpec.biomes, mineSpec.heightfield, mineSpec.lightfield, mineSpec.position, mineSpec.normal, mineSpec.uv, mineSpec.barycentric, mineSpec.ao, mineSpec.id, mineSpec.skyLight, mineSpec.torchLight, mineSpec.peeks);
        results.push(result);
      }

      self.postMessage({
        result: results,
      });
      break;
    }
    case 'getHeight': {
      const {seed, x, y, z, baseHeight, freqs: freqsData, octaves: octavesData, scales: scalesData, uvs: uvsData, amps: ampsData} = data;

      const height = Module._doGetHeight(
        seed,
        x,
        y,
        z,
        baseHeight,
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
  queue.length = 0;
};
self.onmessage = e => {
  const {data} = e;
  if (!loaded) {
    queue.push(data);
  } else {
    _handleMessage(data);
  }
};

let dims, shifts, scale, numPositions, numBarycentrics, numAos, numOpaquePositions, numTransparentPositions;
wasmModulePromise.then(() => {
  loaded = true;

  /* potentials = allocator.alloc(Float32Array, subparcelSizeP3*subparcelSizeP3*subparcelSizeP3);
  biomes = allocator.alloc(Uint8Array, subparcelSizeP1*subparcelSizeP1);
  objectPositions = allocator.alloc(Float32Array, PLANET_OBJECT_SLOTS*3);
  objectQuaternions = allocator.alloc(Float32Array, PLANET_OBJECT_SLOTS*4);
  objectTypes = allocator.alloc(Uint32Array, PLANET_OBJECT_SLOTS);
  numObjects = allocator.alloc(Uint32Array, 1);
  heightfield = allocator.alloc(Int8Array, subparcelSizeP1*subparcelSizeP1*subparcelSizeP1);
  lightfield = allocator.alloc(Uint8Array, subparcelSizeP1*subparcelSizeP1*subparcelSizeP1); */
  dims = allocator.alloc(Int32Array, 3);
  shifts = allocator.alloc(Float32Array, 3);
  scale = allocator.alloc(Float32Array, 3);
  /* positions = allocator.alloc(Float32Array, 3 * 1024 * 1024);
  normals = allocator.alloc(Float32Array, 3 * 1024 * 1024);
  uvs = allocator.alloc(Float32Array, 3 * 1024 * 1024/3*2);
  barycentrics = allocator.alloc(Float32Array, 3 * 1024 * 1024);
  aos = allocator.alloc(Uint8Array, 1024 * 1024); */
  numPositions = allocator.alloc(Uint32Array, 1);
  numNormals = allocator.alloc(Uint32Array, 1);
  numUvs = allocator.alloc(Uint32Array, 1);
  numBarycentrics = allocator.alloc(Uint32Array, 1);
  numAos = allocator.alloc(Uint32Array, 1);
  /* skyLights = allocator.alloc(Uint8Array, 3 * 1024 * 1024/3);
  torchLights = allocator.alloc(Uint8Array, 3 * 1024 * 1024/3); */
  numOpaquePositions = allocator.alloc(Uint32Array, 1);
  numTransparentPositions = allocator.alloc(Uint32Array, 1);
  // peeks = allocator.alloc(Uint8Array, 15);

  _flushMessages();
}).catch(err => {
  console.warn(err.stack);
});
