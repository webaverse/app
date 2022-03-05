import Module from './public/bin/geometry.js';

const geometryUtils = (() => {

    const moduleInstance = Module;
    let scope = {};

    class Allocator {
        constructor() {
            this.offsets = [];
        }

        alloc(constructor, size) {
            if (size > 0) {
                const offset = moduleInstance._malloc(size * constructor.BYTES_PER_ELEMENT);
                const b = new constructor(
                    moduleInstance.HEAP8.buffer, moduleInstance.HEAP8.byteOffset + offset, size
                );
                b.offset = offset;
                this.offsets.push(offset);
                return b;
            } else {
                return new constructor(moduleInstance.HEAP8.buffer, 0, 0);
            }
        }

        freeAll() {
            for (let i = 0; i < this.offsets.length; i++) {
                moduleInstance._doFree(this.offsets[i]);
            }
            this.offsets.length = 0;
        }
    }

    (async () => { await Module.waitForLoad(); })();

    scope.marchingCubes = (dims, potential, shift, scale) => {
        let allocator = new Allocator();

        const dimsTypedArray = allocator.alloc(Int32Array, 3);
        dimsTypedArray.set(dims);

        const potentialTypedArray = allocator.alloc(Float32Array, potential.length);
        potentialTypedArray.set(potential);

        const shiftTypedArray = allocator.alloc(Float32Array, 3);
        shiftTypedArray.set(shift);

        const scaleTypedArray = allocator.alloc(Float32Array, 3);
        scaleTypedArray.set(scale);

        const outputBufferOffset = moduleInstance._doMarchingCubes(
            dimsTypedArray.byteOffset,
            potentialTypedArray.byteOffset,
            shiftTypedArray.byteOffset,
            scaleTypedArray.byteOffset
        );

        allocator.freeAll();

        const head = outputBufferOffset / 4;

        const positionCount = moduleInstance.HEAP32[head];
        const faceCount = moduleInstance.HEAP32[head + 1];
        const positions = moduleInstance.HEAPF32.slice(head + 2, head + 2 + positionCount);
        const faces = moduleInstance.HEAP32.slice(
            head + 2 + positionCount, head + 2 + positionCount + faceCount
        );

        moduleInstance._doFree(outputBufferOffset);

        return {
            positionCount: positionCount,
            faceCount: faceCount,
            positions: positions,
            faces: faces
        }
    }

    scope.generateTerrain = (
        chunkSize, chunkCount, segment, vertexBufferSizeParam, indexBufferSizeParam
    ) => {

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
        const indexBuffer = moduleInstance.HEAP32.subarray(head + 2, head + 3)[0];
        const chunkVertexRangeBuffer = moduleInstance.HEAP32.subarray(head + 3, head + 4)[0];
        const vertexFreeRangeBuffer = moduleInstance.HEAP32.subarray(head + 4, head + 5)[0];
        const chunkIndexRangeBuffer = moduleInstance.HEAP32.subarray(head + 5, head + 6)[0];
        const indexFreeRangeBuffer = moduleInstance.HEAP32.subarray(head + 6, head + 7)[0];

        const positions = moduleInstance.HEAPF32.subarray(
            positionBuffer / ELEMENT_BYTES, positionBuffer / ELEMENT_BYTES + positionCount * 3);

        const normals = moduleInstance.HEAPF32.subarray(
            normalBuffer / ELEMENT_BYTES, normalBuffer / ELEMENT_BYTES + positionCount * 3);

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
            indexBuffer: indexBuffer,
            chunkVertexRangeBuffer: chunkVertexRangeBuffer,
            vertexFreeRangeBuffer: vertexFreeRangeBuffer,
            chunkIndexRangeBuffer: chunkIndexRangeBuffer,
            indexFreeRangeBuffer: indexFreeRangeBuffer,
            positions: positions,
            normals: normals,
            indices: indices,
            vertexRanges: vertexRanges,
            indexRanges: indexRanges
        }
    }

    scope.deallocateChunk = (
        vertexSlot, indexSlot, totalChunkCount,
        chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer
    ) => {

        moduleInstance._deallocateChunk(
            vertexSlot, indexSlot, totalChunkCount,
            chunkVertexRangeBuffer, vertexFreeRangeBuffer,
            chunkIndexRangeBuffer, indexFreeRangeBuffer
        );
    }

    scope.generateChunk = (
        positionBuffer, normalBuffer, indexBuffer,
        chunkVertexRangeBuffer, vertexFreeRangeBuffer, chunkIndexRangeBuffer, indexFreeRangeBuffer,
        x, y, z, chunkSize, segment, totalChunkCount
    ) => {

        let slotsPtr = moduleInstance._generateChunk(
            positionBuffer, normalBuffer, indexBuffer,
            chunkVertexRangeBuffer, vertexFreeRangeBuffer,
            chunkIndexRangeBuffer, indexFreeRangeBuffer,
            x, y, z, chunkSize, segment, totalChunkCount
        );

        let slots = moduleInstance.HEAP32.slice(
            slotsPtr / moduleInstance.HEAP32.BYTES_PER_ELEMENT,
            slotsPtr / moduleInstance.HEAP32.BYTES_PER_ELEMENT + 2
        );

        moduleInstance._doFree(slotsPtr);

        return slots;
    }

    return scope;

})();

export default geometryUtils;
