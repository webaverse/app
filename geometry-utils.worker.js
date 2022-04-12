import Module from './public/bin/geometry.js';

const moduleInstance = Module;
const ELEMENT_BYTES = 4;
const VERTEX_BIOME_SIZE = 8; // using 8 values for verterx biomes, 4 biomes and their weights

onmessage = e => {
  if (e.data.message === 'generateChunk') {
    const output = generateChunk(...e.data.params);
    postMessage(
      {workerIndex: e.data.workerIndex, message: 'generateChunk', output: output},
      [output.positions.buffer, output.normals.buffer, output.biomes.buffer, output.indices.buffer]
    );
  }
}

function generateChunk(x, y, z, chunkSize, segment) {
  const outputBuffer = moduleInstance._generateChunk(x, y, z, chunkSize, segment);
  const offset = outputBuffer / ELEMENT_BYTES;
  const vertexCount = moduleInstance.HEAP32.subarray(offset, offset + 1)[0];
  const indexCount = moduleInstance.HEAP32.subarray(offset + 1, offset + 2)[0];
  const positionBuffer = moduleInstance.HEAP32.subarray(offset + 2, offset + 3)[0];
  const normalBuffer = moduleInstance.HEAP32.subarray(offset + 3, offset + 4)[0];
  const biomeBuffer = moduleInstance.HEAP32.subarray(offset + 4, offset + 5)[0];
  const indexBuffer = moduleInstance.HEAP32.subarray(offset + 5, offset + 6)[0];

  const positions = moduleInstance.HEAPF32.slice(positionBuffer / ELEMENT_BYTES, positionBuffer / ELEMENT_BYTES + vertexCount * 3);
  const normals = moduleInstance.HEAPF32.slice(normalBuffer / ELEMENT_BYTES, normalBuffer / ELEMENT_BYTES + vertexCount * 3);
  const biomes = moduleInstance.HEAPF32.slice(biomeBuffer / ELEMENT_BYTES, biomeBuffer / ELEMENT_BYTES + vertexCount * VERTEX_BIOME_SIZE);
  const indices = moduleInstance.HEAPU32.slice(indexBuffer / ELEMENT_BYTES, indexBuffer / ELEMENT_BYTES + indexCount);

  moduleInstance._doFree(positionBuffer);
  moduleInstance._doFree(normalBuffer);
  moduleInstance._doFree(biomeBuffer);
  moduleInstance._doFree(indexBuffer);
  moduleInstance._doFree(outputBuffer);

  return {
    vertexCount: vertexCount,
    indexCount: indexCount,
    positions: positions,
    normals: normals,
    biomes: biomes,
    indices: indices
  };
}
