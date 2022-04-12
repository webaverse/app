import Module from './public/bin/geometry.js';

const moduleInstance = Module;
const ELEMENT_BYTES = 4;

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
  const positionCount = moduleInstance.HEAP32.subarray(offset, offset + 1)[0];
  const indexCount = moduleInstance.HEAP32.subarray(offset + 1, offset + 2)[0];
  const positionBuffer = moduleInstance.HEAP32.subarray(offset + 2, offset + 3)[0];
  const normalBuffer = moduleInstance.HEAP32.subarray(offset + 3, offset + 4)[0];
  const biomeBuffer = moduleInstance.HEAP32.subarray(offset + 4, offset + 5)[0];
  const indexBuffer = moduleInstance.HEAP32.subarray(offset + 5, offset + 6)[0];

  const positions = moduleInstance.HEAPF32.slice(positionBuffer / ELEMENT_BYTES, positionBuffer / ELEMENT_BYTES + positionCount * 3);
  const normals = moduleInstance.HEAPF32.slice(normalBuffer / ELEMENT_BYTES, normalBuffer / ELEMENT_BYTES + positionCount * 3);
  const biomes = moduleInstance.HEAPF32.slice(biomeBuffer / ELEMENT_BYTES, biomeBuffer / ELEMENT_BYTES + positionCount * 8);
  const indices = moduleInstance.HEAPU32.slice(indexBuffer / ELEMENT_BYTES, indexBuffer / ELEMENT_BYTES + indexCount);

  moduleInstance._doFree(positionBuffer);
  moduleInstance._doFree(normalBuffer);
  moduleInstance._doFree(biomeBuffer);
  moduleInstance._doFree(indexBuffer);
  moduleInstance._doFree(outputBuffer);

  return {
    positionCount: positionCount,
    indexCount: indexCount,
    positions: positions,
    normals: normals,
    biomes: biomes,
    indices: indices
  };
}
