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

    scope.generateChunk = (x, y, z, chunkSize) => {
        const outputBufferOffset = moduleInstance._generateChunk(x, y, z, chunkSize);

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

    return scope;

})();

export default geometryUtils;
