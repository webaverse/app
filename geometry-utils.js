const geometryUtils = (() => {
  const scope = {};

  scope.worker = new Worker('./geometry-utils.worker.js', {type: 'module'});

  scope.worker.onmessage = e => {
    if (e.data.message === 'generateTerrain') {
      scope.resolve({
        positionCount: e.data.positionCount,
        indexCount: e.data.indexCount,
        arrays: e.data.arrays,
        buffers: e.data.buffers
      });
    } else if (e.data.message === 'deallocateChunk') {
      scope.resolve({
        arrays: e.data.arrays
      });
    } else if (e.data.message === 'generateAndAllocateChunk') {
      scope.resolve({
        arrays: e.data.arrays,
        slots: e.data.slots
      });
    } else if (e.data.message === 'generateChunk') {
      scope.resolve(e.data.output);
    }
  }

  scope.generateTerrain = async (
    chunkSize, chunkCount, segment, vertexBufferSizeParam, indexBufferSizeParam, arrays
  ) => {
    return new Promise((resolve, reject) => {
      scope.worker.postMessage({
        message: 'generateTerrain',
        params: [chunkSize, chunkCount, segment, vertexBufferSizeParam, indexBufferSizeParam],
        arrays: arrays
      }, arrays.map(a => a.buffer));

      scope.resolve = resolve;
    });
  }

  scope.deallocateChunk = async (
    vertexSlot, indexSlot, totalChunkCount,
    chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer,
    arrays
  ) => {
    return new Promise((resolve, reject) => {
      try {
        scope.worker.postMessage({
          message: 'deallocateChunk',
          params: [
            vertexSlot, indexSlot, totalChunkCount, chunkVertexRangeBuffer,
            vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer
          ],
          arrays: arrays
        }, arrays.map(a => a.buffer));
      } catch (e) {
        // debugger
      }

      scope.resolve = resolve;
    });
  }

  scope.generateAndAllocateChunk = async (
    positionBuffer, normalBuffer, biomeBuffer, indexBuffer,
    chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer,
    x, y, z, chunkSize, segment, totalChunkCount, arrays
  ) => {
    return new Promise((resolve, reject) => {
      scope.worker.postMessage({
        message: 'generateAndAllocateChunk',
        params: [
          positionBuffer, normalBuffer, biomeBuffer, indexBuffer,
          chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer,
          x, y, z, chunkSize, segment, totalChunkCount,
        ],
        arrays: arrays
      }, arrays.map(a => a.buffer));

      scope.resolve = resolve;
    });
  }

  scope.generateChunk = async (x, y, z, chunkSize, segment) => {
    return new Promise((resolve, reject) => {
      scope.worker.postMessage({
        message: 'generateChunk',
        params: [x, y, z, chunkSize, segment]
      });
      scope.resolve = resolve;
    })
  }

  return scope;
})();

export default geometryUtils;
