import Module from './public/bin/dc.js'

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

w.initialize = (chunkSize, seed) => {
  Module._initialize(chunkSize, seed);
};

w.clearChunkRootDualContouring = (x, y, z) => {
  Module._clearChunkRootDualContouring(x, y, z)
}

w.createChunkMeshDualContouring = (x, y, z, lod) => {
  const outputBufferOffset = Module._createChunkMeshDualContouring(x, y, z, lod);
  // console.log('create xyz', x, y, z, outputBufferOffset);

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

w.drawDamage = (position, radius) => {
  const allocator = new Allocator()

  const numPositions = 256;
  const positionsTypedArray = allocator.alloc(Float32Array, numPositions);
  const numPositionsTypedArray = allocator.alloc(Uint32Array, 1);
  numPositionsTypedArray[0] = numPositions;

  /* console.log('draw damage', {
    x: position.x,
    y: position.y,
    z: position.z,
    radius,
    value,
    positionsTypedArrayOffset: positionsTypedArray.byteOffset,
    numPositionsTypedArrayOffset: numPositionsTypedArray.byteOffset,
  }); */

  const drew = moduleInstance._drawDamage(
    position.x,
    position.y,
    position.z,
    radius,
    value,
    positionsTypedArray.byteOffset,
    numPositionsTypedArray.byteOffset,
  );

  const outNumPositions = numPositionsTypedArray[0];
  const result = Array(outNumPositions / 3);
  for (let i = 0; i < outNumPositions / 3; i++) {
    result[i] = new THREE.Vector3().fromArray(positionsTypedArray, i * 3);
  }

  allocator.freeAll();

  return result;
};

export default w;