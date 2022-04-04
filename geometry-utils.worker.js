import Module from './public/bin/geometry.js';

const moduleInstance = Module;
const ELEMENT_BYTES = 4;

onmessage = e => {

    if (e.data.message === 'generateTerrain') {
        const output = generateTerrain(...e.data.params);

        let arrays = e.data.arrays;

        arrays[0].set(output.positions);
        arrays[1].set(output.normals);
        arrays[2].set(output.biomes);
        arrays[3].set(output.indices);
        arrays[4].set(output.vertexRanges);
        arrays[5].set(output.indexRanges);

        postMessage(
            {
                message: 'generateTerrain',
                arrays: arrays,
                buffers: {
                    positionBuffer: output.positionBuffer,
                    normalBuffer: output.normalBuffer,
                    biomeBuffer: output.biomeBuffer,
                    indexBuffer: output.indexBuffer,
                    chunkVertexRangeBuffer: output.chunkVertexRangeBuffer,
                    vertexFreeRangeBuffer: output.vertexFreeRangeBuffer,
                    chunkIndexRangeBuffer: output.chunkIndexRangeBuffer,
                    indexFreeRangeBuffer: output.indexFreeRangeBuffer
                }
            },
            arrays.map(a => a.buffer)
        );

    } else if (e.data.message === 'deallocateChunk') {
        deallocateChunk(...e.data.params);

        const [
            vertexSlot, indexSlot, totalChunkCount, chunkVertexRangeBuffer,
            vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer
        ] = e.data.params;

        let arrays = e.data.arrays;

        const vertexRanges = moduleInstance.HEAP32.subarray(
            chunkVertexRangeBuffer / ELEMENT_BYTES,
            chunkVertexRangeBuffer / ELEMENT_BYTES + totalChunkCount * 2);

        const indexRanges = moduleInstance.HEAP32.subarray(
            chunkIndexRangeBuffer / ELEMENT_BYTES,
            chunkIndexRangeBuffer / ELEMENT_BYTES + totalChunkCount * 2);

        arrays[0].set(vertexRanges);
        arrays[1].set(indexRanges);

        postMessage({
            message: 'deallocateChunk',
            arrays: arrays
        }, arrays.map(a => a.buffer));

    } else if (e.data.message === 'generateChunk') {
        const slots = generateChunk(...e.data.params);

        let [
            positionBuffer, normalBuffer, biomeBuffer, indexBuffer,
            chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer,
            x, y, z, chunkSize, segment, totalChunkCount
        ] = e.data.params;

        let arrays = e.data.arrays;

        // copy data from wasm memory

        const vertexRanges = moduleInstance.HEAP32.subarray(
            chunkVertexRangeBuffer / ELEMENT_BYTES,
            chunkVertexRangeBuffer / ELEMENT_BYTES + totalChunkCount * 2);

        const indexRanges = moduleInstance.HEAP32.subarray(
            chunkIndexRangeBuffer / ELEMENT_BYTES,
            chunkIndexRangeBuffer / ELEMENT_BYTES + totalChunkCount * 2);

        const positions = moduleInstance.HEAPF32.subarray(
            positionBuffer / ELEMENT_BYTES + vertexRanges[2 * slots[0]] * 3,
            positionBuffer / ELEMENT_BYTES + vertexRanges[2 * slots[0]] * 3 + vertexRanges[2 * slots[0] + 1] * 3
        );

        const normals = moduleInstance.HEAPF32.subarray(
            normalBuffer / ELEMENT_BYTES + vertexRanges[2 * slots[0]] * 3,
            normalBuffer / ELEMENT_BYTES + vertexRanges[2 * slots[0]] * 3 + vertexRanges[2 * slots[0] + 1] * 3
        );

        const biomes = moduleInstance.HEAPF32.subarray(
            biomeBuffer / ELEMENT_BYTES + vertexRanges[2 * slots[0]] * 8,
            biomeBuffer / ELEMENT_BYTES + vertexRanges[2 * slots[0]] * 8 + vertexRanges[2 * slots[0] + 1] * 8
        );

        const indices = moduleInstance.HEAPU32.subarray(
            indexBuffer / ELEMENT_BYTES + indexRanges[2 * slots[1]],
            indexBuffer / ELEMENT_BYTES + indexRanges[2 * slots[1]] + indexRanges[2 * slots[1] + 1]
        );

        arrays[0].set(positions, vertexRanges[2 * slots[0]] * 3);
        arrays[1].set(normals, vertexRanges[2 * slots[0]] * 3);
        arrays[2].set(biomes, vertexRanges[2 * slots[0]] * 8);
        arrays[3].set(indices, indexRanges[2 * slots[1]]);
        arrays[4].set(vertexRanges);
        arrays[5].set(indexRanges);

        postMessage({
            message: 'generateChunk',
            slots: slots,
            arrays: arrays
        }, arrays.map(a => a.buffer));
    }
}

function generateTerrain(chunkSize, chunkCount, segment, vertexBufferSizeParam, indexBufferSizeParam) {

    const outputBuffer = moduleInstance._generateTerrain(
            chunkSize, chunkCount, segment, vertexBufferSizeParam, indexBufferSizeParam
        );

    const ELEMENT_BYTES = moduleInstance.HEAP32.BYTES_PER_ELEMENT;

    const head = outputBuffer / ELEMENT_BYTES;

    const totalChunkCount = chunkCount ** 3;

    const positionCount = totalChunkCount * segment * segment * vertexBufferSizeParam;
    const indexCount = totalChunkCount * segment * segment * indexBufferSizeParam;

    const positionBuffer = moduleInstance.HEAP32.subarray(head + 0, head + 1)[0];
    const normalBuffer = moduleInstance.HEAP32.subarray(head + 1, head + 2)[0];
    const biomeBuffer = moduleInstance.HEAP32.subarray(head + 7, head + 8)[0];
    const indexBuffer = moduleInstance.HEAP32.subarray(head + 2, head + 3)[0];
    const chunkVertexRangeBuffer = moduleInstance.HEAP32.subarray(head + 3, head + 4)[0];
    const vertexFreeRangeBuffer = moduleInstance.HEAP32.subarray(head + 4, head + 5)[0];
    const chunkIndexRangeBuffer = moduleInstance.HEAP32.subarray(head + 5, head + 6)[0];
    const indexFreeRangeBuffer = moduleInstance.HEAP32.subarray(head + 6, head + 7)[0];

    const positions = moduleInstance.HEAPF32.subarray(
        positionBuffer / ELEMENT_BYTES, positionBuffer / ELEMENT_BYTES + positionCount * 3);

    const normals = moduleInstance.HEAPF32.subarray(
        normalBuffer / ELEMENT_BYTES, normalBuffer / ELEMENT_BYTES + positionCount * 3);

    const biomes = moduleInstance.HEAPF32.subarray(
        biomeBuffer / ELEMENT_BYTES, biomeBuffer / ELEMENT_BYTES + positionCount * 8);

    const indices = moduleInstance.HEAPU32.subarray(
        indexBuffer / ELEMENT_BYTES, indexBuffer / ELEMENT_BYTES + indexCount);

    const vertexRanges = moduleInstance.HEAP32.subarray(
        chunkVertexRangeBuffer / ELEMENT_BYTES,
        chunkVertexRangeBuffer / ELEMENT_BYTES + totalChunkCount * 2);

    const indexRanges = moduleInstance.HEAP32.subarray(
        chunkIndexRangeBuffer / ELEMENT_BYTES,
        chunkIndexRangeBuffer / ELEMENT_BYTES + totalChunkCount * 2);

    moduleInstance._doFree(outputBuffer);

    return {
        positionCount: positionCount,
        indexCount: indexCount,
        positionBuffer: positionBuffer,
        normalBuffer: normalBuffer,
        biomeBuffer: biomeBuffer,
        indexBuffer: indexBuffer,
        chunkVertexRangeBuffer: chunkVertexRangeBuffer,
        vertexFreeRangeBuffer: vertexFreeRangeBuffer,
        chunkIndexRangeBuffer: chunkIndexRangeBuffer,
        indexFreeRangeBuffer: indexFreeRangeBuffer,
        positions: positions,
        normals: normals,
        biomes: biomes,
        indices: indices,
        vertexRanges: vertexRanges,
        indexRanges: indexRanges
    }
}

function deallocateChunk(
    vertexSlot, indexSlot, totalChunkCount,
    chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer
) {

    moduleInstance._deallocateChunk(
        vertexSlot, indexSlot, totalChunkCount,
        chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer
    );
}

function generateChunk(
    positionBuffer, normalBuffer, biomeBuffer, indexBuffer,
    chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer,
    x, y, z, chunkSize, segment, totalChunkCount
) {

    let slotsPtr = moduleInstance._generateChunk(
        positionBuffer, normalBuffer, biomeBuffer, indexBuffer,
        chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer,
        x, y, z, chunkSize, segment, totalChunkCount
    );

    let slots = moduleInstance.HEAP32.slice(slotsPtr / 4, slotsPtr / 4 + 2);
    moduleInstance._doFree(slotsPtr);

    return slots;
}
