importScripts('./bin/objectize2.js');

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

const queue = [];
let loaded = false;
const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    case 'march': {
      const {seed: seedData, dims: dimsData, meshId: meshIdData} = data;

      const _makePotentials = (seedData, dimsData) => {
        const allocator = new Allocator();

        // const seed = Math.floor(rng() * 0xFFFFFF);
        const potentials = allocator.alloc(Float32Array, dimsData[0] * dimsData[1] * dimsData[2]);
        const dims = allocator.alloc(Int32Array, 3);
        dims.set(Int32Array.from(dimsData));

        Module._doNoise2(
          seedData,
          0.02,
          4,
          dims.offset,
          1,
          -0.5,
          potentials.offset
        );

        return {potentials, dims, allocator};
      };
      const _getChunkSpec = (potentials, dims, meshId) => {
        const allocator = new Allocator();

        const positions = allocator.alloc(Float32Array, 1024 * 1024 * Float32Array.BYTES_PER_ELEMENT);
        const barycentrics = allocator.alloc(Float32Array, 1024 * 1024 * Float32Array.BYTES_PER_ELEMENT);
        // const indices = allocator.alloc(Uint32Array, 1024 * 1024 * Uint32Array.BYTES_PER_ELEMENT);

        const numPositions = allocator.alloc(Uint32Array, 1);
        numPositions[0] = positions.length;
        const numBarycentrics = allocator.alloc(Uint32Array, 1);
        numBarycentrics[0] = barycentrics.length;
        // const numIndices = allocator.alloc(Uint32Array, 1);
        // numIndices[0] = indices.length;

        const shift = allocator.alloc(Float32Array, 3);
        shift.set(Float32Array.from([0, 0, 0]));

        const scale = allocator.alloc(Float32Array, 3);
        scale.set(Float32Array.from([1, 1, 1]));

        self.Module._doMarchingCubes2(
          dims.offset,
          potentials.offset,
          shift.offset,
          scale.offset,
          positions.offset,
          barycentrics.offset,
          // indices.offset,
          numPositions.offset,
          // numIndices.offset,
          numBarycentrics.offset
        );

        const arrayBuffer2 = new ArrayBuffer(
          // Uint32Array.BYTES_PER_ELEMENT +
          numPositions[0] * Float32Array.BYTES_PER_ELEMENT +
          // Uint32Array.BYTES_PER_ELEMENT +
          numBarycentrics[0] * Float32Array.BYTES_PER_ELEMENT +
          // Uint32Array.BYTES_PER_ELEMENT +
          numPositions[0]/3 * Float32Array.BYTES_PER_ELEMENT +
          // Uint32Array.BYTES_PER_ELEMENT +
          numPositions[0]/3 * Float32Array.BYTES_PER_ELEMENT
        );

        let index = 0;

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

        /* const colors = new Float32Array(outP.length);
        const c = new THREE.Color(0xaed581).toArray(new Float32Array(3));
        for (let i = 0; i < colors.length; i += 3) {
          colors.set(c, i);
        } */

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
          positions: outP,
          barycentrics: outB,
          ids,
          indices,
          arrayBuffer: arrayBuffer2,
          // colors,
          // indices: outI,
          /* },
          cleanup: () => {
            allocator.freeAll();

            this.running = false;
            if (this.queue.length > 0) {
              const fn = this.queue.shift();
              fn();
            }
          }, */
        };
      };
      const {potentials, dims, allocator} = _makePotentials(seedData, dimsData);
      const meshId = meshIdData;
      const {positions, barycentrics, ids, indices, arrayBuffer: arrayBuffer2} = _getChunkSpec(potentials, dims, meshId);

      self.postMessage({
        result: {
          // potentials,
          positions,
          barycentrics,
          ids,
          indices,
          // arrayBuffer2,
        },
      }, [arrayBuffer2]);
      allocator.freeAll();
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
