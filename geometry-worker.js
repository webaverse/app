importScripts('./three.js', './draco_decoder.js');

const decoderModule = new DracoDecoderModule({
  onModuleLoaded() {
    loaded = true;
    _flushMessages();
  },
});

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();
const localBox = new THREE.Box3();

const fakeMaterial = new THREE.MeshBasicMaterial({
  color: 0xFFFFFF,
});

const _align4 = n => {
  const d = n%4;
  return d ? (n+4-d) : n;
};

const geometryRegistry = {};
const animalGeometries = [];
const _marchObjects = (x, y, z, objects, heightfields, lightfields, subparcelSize) => {
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
      stats.numIds += geometry.positions.length/3;
      stats.numSkyLights += geometry.positions.length/3;
      stats.numTorchLights += geometry.positions.length/3;
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

  const subparcelSizeP1 = subparcelSize+1;
  const subparcelOffset = localVector2.set((x-1)*subparcelSize, (y-1)*subparcelSize, (z-1)*subparcelSize);
  const _getFieldIndex = p => {
    const ax = Math.floor(localVector.x - subparcelOffset.x);
    const ay = Math.floor(localVector.y - subparcelOffset.y);
    const az = Math.floor(localVector.z - subparcelOffset.z);
    const sx = Math.floor(ax/subparcelSize);
    const sy = Math.floor(ay/subparcelSize);
    const sz = Math.floor(az/subparcelSize);
    const fieldsOffset = (sx + sy*3 + sz*3*3) * subparcelSizeP1*subparcelSizeP1*subparcelSizeP1;
    const lx = ax - subparcelSize*sx;
    const ly = ay - subparcelSize*sy;
    const lz = az - subparcelSize*sz;
    const fieldIndex = lx + ly*subparcelSizeP1 + lz*subparcelSizeP1*subparcelSizeP1;
    return fieldsOffset + fieldIndex;
  };

  for (let i = 0; i < geometries.length; i++) {
    const geometrySpecs = geometries[i];
    const object = objects[i];
    const matrix = localMatrix.fromArray(object.matrix);

    for (const geometry of geometrySpecs) {
      const spec = opaque;

      const indexOffset2 = spec.positionsIndex/3;
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
        const fieldIndex = _getFieldIndex(localVector);
        spec.skyLights[spec.skyLightsIndex + jOffset] = heightfields[fieldIndex] < 0 ? 0 : heightfields[fieldIndex];
        spec.torchLights[spec.torchLightsIndex + jOffset] = lightfields[fieldIndex];
      }
      spec.positionsIndex += geometry.positions.length;
      spec.skyLightsIndex += geometry.positions.length/3;
      spec.torchLightsIndex += geometry.positions.length/3;

      if (geometry.uvs) {
        spec.uvs.set(geometry.uvs, spec.uvsIndex);
        spec.uvsIndex += geometry.uvs.length;
      }
      if (geometry.colors) {
        spec.colors.set(geometry.colors, spec.colorsIndex);
        spec.colorsIndex += geometry.colors.length;
      }

      spec.ids.fill(object.id, spec.idsIndex, spec.idsIndex + geometry.positions.length/3);
      spec.idsIndex += geometry.positions.length/3;
    }
  }

  return [
    {
      opaque,
    },
    arraybuffer,
  ];
};
const _dracoDecode = arrayBuffer => {
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
};
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

const queue = [];
let loaded = false;
const _handleMessage = async data => {
  const {method} = data;
  switch (method) {
    case 'loadBake': {
      const {url} = data;

      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const meshes = _dracoDecode(arrayBuffer);
      for (const mesh of meshes) {
        geometryRegistry[mesh.name] = [mesh];
        if (mesh.animal) {
          animalGeometries.push(mesh);
        }
      }

      self.postMessage({
        result: null,
      });
      break;
    }
    case 'requestGeometry': {
      const {name} = data;

      const [geometry] = geometryRegistry[name];

      self.postMessage({
        result: geometry,
      });
      break;
    }
    case 'requestAnimalGeometry': {
      const {hash} = data;

      const {positions, colors, indices} = animalGeometries[Math.floor(hash/0xFFFFFF*animalGeometries.length)];
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      const animal = new THREE.Mesh(geometry, fakeMaterial);

      const aabb = localBox.setFromObject(animal);
      const center = aabb.getCenter(new THREE.Vector3());
      const size = aabb.getSize(new THREE.Vector3());
      const headPivot = center.clone()
        .add(size.clone().multiply(new THREE.Vector3(0, 1/2 * 0.5, -1/2 * 0.5)));
      const legsPivot = center.clone()
        .add(size.clone().multiply(new THREE.Vector3(0, -1/2 + 1/3, 0)));
      const legsSepFactor = 0.5;
      const legsPivotTopLeft = legsPivot.clone()
        .add(size.clone().multiply(new THREE.Vector3(-1/2 * legsSepFactor, 0, -1/2 * legsSepFactor)));
      const legsPivotTopRight = legsPivot.clone()
        .add(size.clone().multiply(new THREE.Vector3(1/2 * legsSepFactor, 0, -1/2 * legsSepFactor)));
      const legsPivotBottomLeft = legsPivot.clone()
        .add(size.clone().multiply(new THREE.Vector3(-1/2 * legsSepFactor, 0, 1/2 * legsSepFactor)));
      const legsPivotBottomRight = legsPivot.clone()
        .add(size.clone().multiply(new THREE.Vector3(1/2 * legsSepFactor, 0, 1/2 * legsSepFactor)));

      const heads = new Float32Array(positions.length);
      const legs = new Float32Array(positions.length/3*4);
      for (let i = 0, j = 0; i < positions.length; i += 3, j += 4) {
        localVector.fromArray(positions, i);
        if (localVector.z < headPivot.z) {
          localVector.sub(headPivot);
        } else {
          localVector.setScalar(0);
        }
        localVector.toArray(heads, i);

        localVector.fromArray(positions, i);
        let xAxis;
        if (localVector.y < legsPivot.y) {
          if (localVector.x >= legsPivot.x) {
            if (localVector.z >= legsPivot.z) {
              localVector.sub(legsPivotBottomRight);
              xAxis = 1;
            } else {
              localVector.sub(legsPivotTopRight);
              xAxis = -1;
            }
          } else {
            if (localVector.z >= legsPivot.z) {
              localVector.sub(legsPivotBottomLeft);
              xAxis = -1;
            } else {
              localVector.sub(legsPivotTopLeft);
              xAxis = 1;
            }
          }
        } else {
          localVector.setScalar(0);
          xAxis = 0;
        }
        localVector.toArray(legs, j);
        legs[j+3] = xAxis;
      }

      self.postMessage({
        result: {
          positions,
          colors,
          indices,
          heads,
          legs,
          headPivot: headPivot.toArray(new Float32Array(3)),
          aabb: {
            center: center.toArray(new Float32Array(3)),
            size: size.toArray(new Float32Array(3))
          },
        },
      });
      break;
    }
    case 'marchObjects': {
      const {x, y, z, objects, heightfields, lightfields, subparcelSize} = data;

      const results = [];
      const transfers = [];
      const [result, transfer] = _marchObjects(x, y, z, objects, heightfields, lightfields, subparcelSize);
      results.push(result);
      transfers.push(transfer);

      self.postMessage({
        result: results,
      }, transfers);
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