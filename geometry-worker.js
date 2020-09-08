importScripts('./bin/geometry.js');

const SUBPARCEL_SIZE = 10;
const SUBPARCEL_SIZE_P1 = SUBPARCEL_SIZE + 1;
const MAX_NAME_LENGTH = 32;

function abs(n) {
  return (n ^ (n >> 31)) - (n >> 31);
}
function sign(n) {
  return -(n >> 31);
}
const _getSubparcelIndex = (x, y, z) => abs(x) | (abs(y) << 9) | (abs(z) << 18) | (sign(x) << 27) | (sign(y) << 28) | (sign(z) << 29);
const _getFieldIndex = (x, y, z) => x + (z * SUBPARCEL_SIZE_P1) + (y * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1);
const _align4 = n => {
  const d = n % 4;
  return d ? (n + 4 - d) : n;
};

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

const geometryRegistry = {};
const animalGeometries = [];
const _marchObjects = (x, y, z, objects, subparcelSpecs) => {
  const geometries = objects.map(o => geometryRegistry[o.type]);

  const _makeStats = () => ({
    numPositions: 0,
    numUvs: 0,
    numColors: 0,
    numIds: 0,
    numSkyLights: 0,
    numTorchLights: 0,
    numIndices: 0,
  });
  const stats = _makeStats();
  for (const geometrySpecs of geometries) {
    for (const geometry of geometrySpecs) {
      stats.numPositions += geometry.positions.length;
      stats.numUvs += geometry.uvs ? geometry.uvs.length : 0;
      stats.numColors += geometry.colors ? geometry.colors.length : 0;
      stats.numIds += geometry.positions.length / 3;
      stats.numSkyLights += geometry.positions.length / 3;
      stats.numTorchLights += geometry.positions.length / 3;
      stats.numIndices += geometry.indices.length;
    }
  }

  let totalSize = 0;
  totalSize += stats.numPositions * Float32Array.BYTES_PER_ELEMENT;
  totalSize += stats.numUvs * Float32Array.BYTES_PER_ELEMENT;
  totalSize += stats.numColors * Float32Array.BYTES_PER_ELEMENT;
  totalSize += stats.numIds * Float32Array.BYTES_PER_ELEMENT;
  totalSize += stats.numSkyLights * Uint8Array.BYTES_PER_ELEMENT;
  totalSize += stats.numTorchLights * Uint8Array.BYTES_PER_ELEMENT;
  totalSize = _align4(totalSize);
  totalSize += stats.numIndices * Uint32Array.BYTES_PER_ELEMENT;
  const arraybuffer = new ArrayBuffer(totalSize);

  let index = 0;
  const _makeSpec = () => {
    const spec = {};
    spec.positions = new Float32Array(arraybuffer, index, stats.numPositions);
    index += stats.numPositions * Float32Array.BYTES_PER_ELEMENT;
    spec.uvs = new Float32Array(arraybuffer, index, stats.numUvs);
    index += stats.numUvs * Float32Array.BYTES_PER_ELEMENT;
    spec.colors = new Float32Array(arraybuffer, index, stats.numColors);
    index += stats.numColors * Float32Array.BYTES_PER_ELEMENT;
    spec.ids = new Float32Array(arraybuffer, index, stats.numIds);
    index += stats.numIds * Float32Array.BYTES_PER_ELEMENT;
    spec.skyLights = new Uint8Array(arraybuffer, index, stats.numSkyLights);
    index += stats.numSkyLights * Uint8Array.BYTES_PER_ELEMENT;
    spec.torchLights = new Uint8Array(arraybuffer, index, stats.numTorchLights);
    index += stats.numTorchLights * Uint8Array.BYTES_PER_ELEMENT;
    index = _align4(index);
    spec.indices = new Uint32Array(arraybuffer, index, stats.numIndices);
    index += stats.numIndices * Uint32Array.BYTES_PER_ELEMENT;
    spec.positionsIndex = 0;
    spec.uvsIndex = 0;
    spec.colorsIndex = 0;
    spec.idsIndex = 0;
    spec.skyLightsIndex = 0;
    spec.torchLightsIndex = 0;
    spec.indicesIndex = 0;
    return spec;
  };
  const opaque = _makeSpec();

  const subparcelSpecsMap = {};
  for (const subparcel of subparcelSpecs) {
    subparcelSpecsMap[subparcel.index] = subparcel;
  }

  for (let i = 0; i < geometries.length; i++) {
    const geometrySpecs = geometries[i];
    const object = objects[i];
    const matrix = localMatrix.fromArray(object.matrix);

    for (const geometry of geometrySpecs) {
      const spec = opaque;

      const indexOffset2 = spec.positionsIndex / 3;
      for (let j = 0; j < geometry.indices.length; j++) {
        spec.indices[spec.indicesIndex + j] = geometry.indices[j] + indexOffset2;
      }
      spec.indicesIndex += geometry.indices.length;

      let jOffset = 0;
      for (let j = 0; j < geometry.positions.length; j += 3, jOffset++) {
        localVector
          .fromArray(geometry.positions, j)
          .applyMatrix4(matrix)
          .toArray(spec.positions, spec.positionsIndex + j);

        const ax = Math.floor(localVector.x);
        const ay = Math.floor(localVector.y);
        const az = Math.floor(localVector.z);
        const sx = Math.floor(ax / SUBPARCEL_SIZE);
        const sy = Math.floor(ay / SUBPARCEL_SIZE);
        const sz = Math.floor(az / SUBPARCEL_SIZE);
        const subparcelIndex = _getSubparcelIndex(sx, sy, sz);
        const subparcel = subparcelSpecsMap[subparcelIndex];
        if (subparcel) {
          const lx = ax - SUBPARCEL_SIZE * sx;
          const ly = ay - SUBPARCEL_SIZE * sy;
          const lz = az - SUBPARCEL_SIZE * sz;
          const fieldIndex = _getFieldIndex(lx, ly, lz);
          spec.skyLights[spec.skyLightsIndex + jOffset] = subparcel.heightfield[fieldIndex] < 0 ? 0 : subparcel.heightfield[fieldIndex];
          spec.torchLights[spec.torchLightsIndex + jOffset] = subparcel.lightfield[fieldIndex];
        } else {
          spec.skyLights[spec.skyLightsIndex + jOffset] = 0;
          spec.torchLights[spec.torchLightsIndex + jOffset] = 0;
        }
      }
      spec.positionsIndex += geometry.positions.length;
      spec.skyLightsIndex += geometry.positions.length / 3;
      spec.torchLightsIndex += geometry.positions.length / 3;

      if (geometry.uvs) {
        spec.uvs.set(geometry.uvs, spec.uvsIndex);
        spec.uvsIndex += geometry.uvs.length;
      }
      if (geometry.colors) {
        spec.colors.set(geometry.colors, spec.colorsIndex);
        spec.colorsIndex += geometry.colors.length;
      }

      spec.ids.fill(object.id, spec.idsIndex, spec.idsIndex + geometry.positions.length / 3);
      spec.idsIndex += geometry.positions.length / 3;
    }
  }

  return [
    {
      opaque,
    },
    arraybuffer,
  ];
};
/* const _dracoDecode = arrayBuffer => {
  const result = [];

  const decoder = new decoderModule.Decoder();
  const metadataQuerier = new decoderModule.MetadataQuerier();

  for(let index = 0; index < arrayBuffer.byteLength;) {
    const byteLength = new Uint32Array(arrayBuffer, index, 1)[0];
    index += Uint32Array.BYTES_PER_ELEMENT;
    const byteArray = new Uint8Array(arrayBuffer, index, byteLength);
    index += byteLength;
    index = _align4(index);

    // Create the Draco decoder.
    const buffer = new decoderModule.DecoderBuffer();
    buffer.Init(byteArray, byteArray.length);

    // Create a buffer to hold the encoded data.
    const geometryType = decoder.GetEncodedGeometryType(buffer);

    // Decode the encoded geometry.
    let outputGeometry;
    let status;
    if (geometryType == decoderModule.TRIANGULAR_MESH) {
      outputGeometry = new decoderModule.Mesh();
      status = decoder.DecodeBufferToMesh(buffer, outputGeometry);
    } else {
      outputGeometry = new decoderModule.PointCloud();
      status = decoder.DecodeBufferToPointCloud(buffer, outputGeometry);
    }

    const metadata = decoder.GetMetadata(outputGeometry);
    const name = metadataQuerier.GetStringEntry(metadata, 'name');
    const transparent = !!metadataQuerier.GetIntEntry(metadata, 'transparent');
    const vegetation = !!metadataQuerier.GetIntEntry(metadata, 'vegetation');
    const animal = !!metadataQuerier.GetIntEntry(metadata, 'animal');

    let positions;
    {
      const id = decoder.GetAttributeId(outputGeometry, decoderModule.POSITION);
      const attribute = decoder.GetAttribute(outputGeometry, id);
      const numComponents = attribute.num_components();
      const numPoints = outputGeometry.num_points();
      const numValues = numPoints * numComponents;
      const dracoArray = new decoderModule.DracoFloat32Array();
      decoder.GetAttributeFloatForAllPoints( outputGeometry, attribute, dracoArray );
      positions = new Float32Array( numValues );
      for ( var i = 0; i < numValues; i ++ ) {
        positions[ i ] = dracoArray.GetValue( i );
      }
      decoderModule.destroy( dracoArray );
    }
    let uvs;
    {
      const id = decoder.GetAttributeId(outputGeometry, decoderModule.TEX_COORD);
      if (id !== -1) {
        const attribute = decoder.GetAttribute(outputGeometry, id);
        const numComponents = attribute.num_components();
        const numPoints = outputGeometry.num_points();
        const numValues = numPoints * numComponents;
        const dracoArray = new decoderModule.DracoFloat32Array();
        decoder.GetAttributeFloatForAllPoints( outputGeometry, attribute, dracoArray );
        uvs = new Float32Array( numValues );
        for ( var i = 0; i < numValues; i ++ ) {
          uvs[ i ] = dracoArray.GetValue( i );
        }
        decoderModule.destroy( dracoArray );
      } else {
        uvs = null;
      }
    }
    let colors;
    {
      const id = decoder.GetAttributeId(outputGeometry, decoderModule.COLOR);
      if (id !== -1) {
        const attribute = decoder.GetAttribute(outputGeometry, id);
        const numComponents = attribute.num_components();
        const numPoints = outputGeometry.num_points();
        const numValues = numPoints * numComponents;
        const dracoArray = new decoderModule.DracoUInt8Array();
        decoder.GetAttributeUInt8ForAllPoints( outputGeometry, attribute, dracoArray );
        colors = new Uint8Array( numValues );
        for ( var i = 0; i < numValues; i ++ ) {
          colors[ i ] = dracoArray.GetValue( i );
        }
        decoderModule.destroy( dracoArray );
      } else {
        colors = null;
      }
    }
    let indices;
    {
      const numFaces = outputGeometry.num_faces();
      const numIndices = numFaces * 3;
      indices = new Uint16Array( numIndices );
      const indexArray = new decoderModule.DracoInt32Array();

      for ( var i = 0; i < numFaces; ++ i ) {
        decoder.GetFaceFromMesh( outputGeometry, i, indexArray );
        for ( var j = 0; j < 3; ++ j ) {
          indices[ i * 3 + j ] = indexArray.GetValue( j );
        }
      }
    }

    const m = {
      name,
      transparent,
      vegetation,
      animal,
      positions,
      uvs,
      colors,
      indices,
    };
    result.push(m);

    // You must explicitly delete objects created from the DracoDecoderModule
    // or Decoder.
    decoderModule.destroy(outputGeometry);
    decoderModule.destroy(buffer);
  }

  decoderModule.destroy(decoder);
  decoderModule.destroy(metadataQuerier);

  return result;
}; */
/* const MAX_NAME_LENGTH = 128;
const _flatDecode = arrayBuffer => {
  const result = [];

  for (let index = 0; index < arrayBuffer.byteLength;) {
    const nameLength = (() => {
      const uint8Array = new Uint8Array(arrayBuffer, index);
      for (let i = 0; i < MAX_NAME_LENGTH; i++) {
        if (uint8Array[i] === 0) {
          return i;
        }
      }
      return MAX_NAME_LENGTH;
    })();
    const name = new TextDecoder().decode(new Uint8Array(arrayBuffer, index, nameLength));
    index += MAX_NAME_LENGTH;

    const transparent = !!new Uint32Array(arrayBuffer, index, 1)[0];
    index += Uint32Array.BYTES_PER_ELEMENT;

    const [numPositions, numUvs, numIndices] = new Uint32Array(arrayBuffer, index, 3);
    index += Uint32Array.BYTES_PER_ELEMENT * 3;

    const positions = new Float32Array(arrayBuffer, index, numPositions);
    index += numPositions * Float32Array.BYTES_PER_ELEMENT;

    const uvs = new Float32Array(arrayBuffer, index, numUvs);
    index += numUvs * Float32Array.BYTES_PER_ELEMENT;

    const indices = new Uint16Array(arrayBuffer, index, numIndices);
    index += numIndices * Uint16Array.BYTES_PER_ELEMENT;

    index = _align4(index);

    const m = {
      name,
      transparent,
      vegetation,
      positions,
      uvs,
      indices,
    };
    result.push(m);
  }

  return result;
}; */

let geometrySet = null;
const queue = [];
let loaded = false;
const _handleMessage = async data => {
  const {method} = data;
  switch (method) {
    case 'loadBake': {
      if (!geometrySet) {
        geometrySet = Module._makeGeometrySet();
      }

      const {url} = data;

      const allocator = new Allocator();
      let uint8Array;
      {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        uint8Array = allocator.alloc(Uint8Array, arrayBuffer.byteLength);
        uint8Array.set(new Uint8Array(arrayBuffer));
      }

      Module._loadBake(geometrySet, uint8Array.offset, uint8Array.byteLength);

      allocator.freeAll();

      self.postMessage({
        result: null,
      });
      break;
    }
    case 'requestGeometry': {
      const {name} = data;

      const allocator = new Allocator();

      const srcNameUint8Array = new TextEncoder().encode(name);
      const dstNameUint8Array = allocator.alloc(Uint8Array, srcNameUint8Array.byteLength);
      dstNameUint8Array.set(srcNameUint8Array);

      const positions = allocator.alloc(Uint32Array, 1);
      const uvs = allocator.alloc(Uint32Array, 1);
      const indices = allocator.alloc(Uint32Array, 1);
      const numPositions = allocator.alloc(Uint32Array, 1);
      const numUvs = allocator.alloc(Uint32Array, 1);
      const numIndices = allocator.alloc(Uint32Array, 1);

      Module._getGeometry(
        geometrySet,
        dstNameUint8Array.offset,
        dstNameUint8Array.byteLength,
        positions.offset,
        uvs.offset,
        indices.offset,
        numPositions.offset,
        numUvs.offset,
        numIndices.offset,
      );

      const positions2 = new Float32Array(Module.HEAP8.buffer, positions[0], numPositions[0]).slice();
      const uvs2 = new Float32Array(Module.HEAP8.buffer, uvs[0], numUvs[0]).slice();
      const indices2 = new Uint32Array(Module.HEAP8.buffer, indices[0], numIndices[0]).slice();

      allocator.freeAll();

      self.postMessage({
        result: {
          positions: positions2,
          uvs: uvs2,
          indices: indices2,
        },
      }, [positions2.buffer, uvs2.buffer, indices2.buffer]);
      break;
    }
    case 'requestAnimalGeometry': {
      const {hash} = data;

      const allocator = new Allocator();

      const positions = allocator.alloc(Uint32Array, 1);
      const colors = allocator.alloc(Uint32Array, 1);
      const indices = allocator.alloc(Uint32Array, 1);
      const heads = allocator.alloc(Uint32Array, 1);
      const legs = allocator.alloc(Uint32Array, 1);
      const numPositions = allocator.alloc(Uint32Array, 1);
      const numColors = allocator.alloc(Uint32Array, 1);
      const numIndices = allocator.alloc(Uint32Array, 1);
      const numHeads = allocator.alloc(Uint32Array, 1);
      const numLegs = allocator.alloc(Uint32Array, 1);
      const headPivot = allocator.alloc(Float32Array, 3);
      const aabb = allocator.alloc(Float32Array, 6);

      Module._getAnimalGeometry(
        geometrySet,
        hash,
        positions.offset,
        colors.offset,
        indices.offset,
        heads.offset,
        legs.offset,
        numPositions.offset,
        numColors.offset,
        numIndices.offset,
        numHeads.offset,
        numLegs.offset,
        headPivot.offset,
        aabb.offset,
      );

      const positions2 = new Float32Array(Module.HEAP8.buffer, positions[0], numPositions[0]).slice();
      const colors2 = new Uint8Array(Module.HEAP8.buffer, colors[0], numColors[0]).slice();
      const indices2 = new Uint32Array(Module.HEAP8.buffer, indices[0], numIndices[0]).slice();
      const heads2 = new Float32Array(Module.HEAP8.buffer, heads[0], numHeads[0]).slice();
      const legs2 = new Float32Array(Module.HEAP8.buffer, legs[0], numLegs[0]).slice();
      const headPivot2 = headPivot.slice();
      const aabb2 = aabb.slice();

      allocator.freeAll();

      self.postMessage({
        result: {
          positions: positions2,
          colors: colors2,
          indices: indices2,
          heads: heads2,
          legs: legs2,
          headPivot: headPivot2,
          aabb: aabb2,
        },
      }, [positions2.buffer, colors2.buffer, indices2.buffer, heads2.buffer, legs2.buffer, headPivot2.buffer, aabb2.buffer]);
      break;
    }
    case 'marchObjects': {
      const {x, y, z, objects, subparcelSpecs} = data;

      const allocator = new Allocator();

      const marchObjectSize = Uint32Array.BYTES_PER_ELEMENT +
        MAX_NAME_LENGTH * Uint8Array.BYTES_PER_ELEMENT +
        Float32Array.BYTES_PER_ELEMENT * 3 +
        Float32Array.BYTES_PER_ELEMENT * 4;
      const numMarchObjects = objects.length;
      const marchObjects = allocator.alloc(Uint8Array, marchObjectSize * numMarchObjects);
      {
        let index = 0;
        for (const object of objects) {
          new Uint32Array(marchObjects.buffer, marchObjects.offset + index, 1)[0] = object.id;
          index += Uint32Array.BYTES_PER_ELEMENT;
          const nameUint8Array = new TextEncoder().encode(object.name);
          new Uint8Array(marchObjects.buffer, marchObjects.offset + index, MAX_NAME_LENGTH).set(nameUint8Array);
          index += MAX_NAME_LENGTH;
          new Float32Array(marchObjects.buffer, marchObjects.offset + index, 3).set(object.position);
          index += Float32Array.BYTES_PER_ELEMENT * 3;
          new Float32Array(marchObjects.buffer, marchObjects.offset + index, 4).set(object.quaternion);
          index += Float32Array.BYTES_PER_ELEMENT * 4;
        }
      }
      const subparcelObjectSize = Int32Array.BYTES_PER_ELEMENT +
        SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 + 1 +
        SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 + 1;
      const numSubparcelObjects = subparcelSpecs.length;
      const subparcelObjects = allocator.alloc(Uint8Array, subparcelObjectSize * numSubparcelObjects);
      {
        let index = 0;
        for (const subparcelSpec of subparcelSpecs) {
          new Int32Array(subparcelObjects.buffer, subparcelObjects.offset + index, 1)[0] = subparcelSpec.index;
          index += Int32Array.BYTES_PER_ELEMENT;
          new Int8Array(subparcelObjects.buffer, subparcelObjects.offset + index, subparcelSpec.heightfield.length).set(subparcelSpec.heightfield);
          index += subparcelSpec.heightfield.length * Int8Array.BYTES_PER_ELEMENT;
          index += 1; // align
          new Uint8Array(subparcelObjects.buffer, subparcelObjects.offset + index, subparcelSpec.lightfield.length).set(subparcelSpec.lightfield);
          index += subparcelSpec.lightfield.length * Uint8Array.BYTES_PER_ELEMENT;
          index += 1; // align
        }
      }

      const positions = allocator.alloc(Float32Array, 1024 * 1024);
      const uvs = allocator.alloc(Float32Array, 1024 * 1024);
      const ids = allocator.alloc(Float32Array, 1024 * 1024);
      const indices = allocator.alloc(Uint32Array, 1024 * 1024);
      const skyLights = allocator.alloc(Uint8Array, 1024 * 1024);
      const torchLights = allocator.alloc(Uint8Array, 1024 * 1024);
      const numPositions = allocator.alloc(Uint32Array, 1);
      const numUvs = allocator.alloc(Uint32Array, 1);
      const numIds = allocator.alloc(Uint32Array, 1);
      const numIndices = allocator.alloc(Uint32Array, 1);
      const numSkyLights = allocator.alloc(Uint32Array, 1);
      const numTorchLights = allocator.alloc(Uint32Array, 1);

      Module._marchObjects(
        geometrySet,
        x,
        y,
        z,
        marchObjects.offset,
        numMarchObjects,
        subparcelObjects.offset,
        numSubparcelObjects,
        positions.offset,
        uvs.offset,
        ids.offset,
        indices.offset,
        skyLights.offset,
        torchLights.offset,
        numPositions.offset,
        numUvs.offset,
        numIds.offset,
        numIndices.offset,
        numSkyLights.offset,
        numTorchLights.offset,
      );

      const positions2 = positions.slice(0, numPositions[0]);
      const uvs2 = uvs.slice(0, numUvs[0]);
      const ids2 = ids.slice(0, numIds[0]);
      const indices2 = indices.slice(0, numIndices[0]);
      const skyLights2 = skyLights.slice(0, numSkyLights[0]);
      const torchLights2 = torchLights.slice(0, numTorchLights[0]);

      allocator.freeAll();

      self.postMessage({
        result: {
          positions: positions2,
          uvs: uvs2,
          ids: ids2,
          indices: indices2,
          skyLights: skyLights2,
          torchLights: torchLights2,
        },
      }, [positions2.buffer, uvs2.buffer, ids2.buffer, indices2.buffer, skyLights2.buffer, torchLights2.buffer]);
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

wasmModulePromise.then(() => {
  loaded = true;
  _flushMessages();
}).catch(err => {
  console.warn(err.stack);
});
