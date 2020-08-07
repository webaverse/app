importScripts('./three.js', './GLTFLoader.js', './atlaspack.js', './maxrects-packer.js', './draco_encoder.js', './draco_decoder.js');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();

const _loadGltf = u => new Promise((accept, reject) => {
  new THREE.GLTFLoader().load(u, o => {
    o = o.scene;
    accept(o);
  }, xhr => {}, reject);
});
const _resizeImage = (img, scale) => {
  const canvas = new OffscreenCanvas(img.width * scale, img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
};
const _getPotentialIndex = (x, y, z, subparcelSize) => x + y*subparcelSize*subparcelSize + z*subparcelSize;
const _getPotentialFullIndex = (x, y, z, subparcelSizeP1) => x + y*subparcelSizeP1*subparcelSizeP1 + z*subparcelSizeP1;
const _align4 = n => {
  const d = n%4;
  return d ? (n+4-d) : n;
};

const geometryRegistry = {};
const size = 8192;
const canvas = new OffscreenCanvas(size, size);
const ctx = canvas.getContext('2d');
// const atlas = atlaspack(canvas);
// const rects = new Map();
const rects = {};
const packer = new maxRects.MaxRectsPacker(size, size);
let numRects = 0;
const maxTexSize = 4096;
const _mapUvAttribute = (uvs, rect) => {
  const {x, y, width: w, height: h} = rect;
  for (let i = 0; i < uvs.length; i += 2) {
    uvs[i] = x + uvs[i]*w;
    uvs[i+1] = y + uvs[i+1]*h;
  }
};
const _mergeObject = o => {
  const {geometry, material} = o;
  const {map} = material;
  if (!rects[map.image.data.id]) {
    // console.log('got tex', o.name, map.image.data.width, map.image.data.height);
    const resizeFactor = /wood|stone|metal/.test(o.name) ? 1/2 : Math.min(maxTexSize/map.image.data.width, maxTexSize/map.image.data.height);
    if (resizeFactor < 1) {
      map.image.data = _resizeImage(map.image.data, resizeFactor);
    }
    map.image.data.id = 'img-' + numRects++;
    map.image.data.geometry = geometry;
    packer.add(map.image.data);
    rects[map.image.data.id] = true;
    /* atlas.pack(map.image.data);
    rect = atlas.uv()[map.image.data.id];
    rects.set(map.image.data.id, rect); */
  }
  /* const {geometry, material} = o;
  const {map} = material;
  let rect = rects.get(map.image.data.id);
  if (!rect) {
    const resizeFactor = Math.min(4096/map.image.data.width, 4096/map.image.data.height);
    if (resizeFactor < 1) {
      map.image.data = _resizeImage(map.image.data, resizeFactor);
    }
    map.image.data.id = 'img-' + rects.size;
    atlas.pack(map.image.data);
    rect = atlas.uv()[map.image.data.id];
    rects.set(map.image.data.id, rect);
  }
  _mapUvAttribute(geometry.attributes.uv.array, rect); */
};
const _mergeFinish = () => {
  packer.repack(false);
  console.log('got bins', packer.bins);
  for (const bin of packer.bins) {
    for (const rect of bin.rects) {
      const {x, y} = rect;
      ctx.drawImage(rect, x, y);
      _mapUvAttribute(rect.geometry.attributes.uv.array, rect);
    }
  }
};
const _marchObjects = (x, y, z, objects, heightfields, lightfields, subparcelSize) => {
  const geometries = objects.map(o => geometryRegistry[o.type]);

  let numOpaquePositions = 0;
  let numOpaqueUvs = 0;
  let numOpaqueIds = 0;
  let numOpaqueSkyLights = 0;
  let numOpaqueTorchLights = 0;
  let numOpaqueIndices = 0;
  let numTransparentPositions = 0;
  let numTransparentUvs = 0;
  let numTransparentIds = 0;
  let numTransparentSkyLights = 0;
  let numTransparentTorchLights = 0;
  let numTransparentIndices = 0;
  for (const geometrySpecs of geometries) {
    for (const geometry of geometrySpecs) {
      if (!geometry.transparent) {
        numOpaquePositions += geometry.positions.length;
        numOpaqueUvs += geometry.uvs.length;
        numOpaqueIds += geometry.positions.length/3;
        numOpaqueSkyLights += geometry.positions.length/3;
        numOpaqueTorchLights += geometry.positions.length/3;
        numOpaqueIndices += geometry.indices.length;
      } else {
        numTransparentPositions += geometry.positions.length;
        numTransparentUvs += geometry.uvs.length;
        numTransparentIds += geometry.positions.length/3;
        numTransparentSkyLights += geometry.positions.length/3;
        numTransparentTorchLights += geometry.positions.length/3;
        numTransparentIndices += geometry.indices.length;
      }
    }
  }

  const totalSize = (() => {
    let index = 0;
    index += numOpaquePositions * Float32Array.BYTES_PER_ELEMENT;
    index += numOpaqueUvs * Float32Array.BYTES_PER_ELEMENT;
    index += numOpaqueIds * Float32Array.BYTES_PER_ELEMENT;
    index += numOpaqueSkyLights * Uint8Array.BYTES_PER_ELEMENT;
    index += numOpaqueTorchLights * Uint8Array.BYTES_PER_ELEMENT;
    index = _align4(index);
    index += numOpaqueIndices * Uint32Array.BYTES_PER_ELEMENT;
    index += numTransparentPositions * Float32Array.BYTES_PER_ELEMENT;
    index += numTransparentUvs * Float32Array.BYTES_PER_ELEMENT;
    index += numTransparentIds * Float32Array.BYTES_PER_ELEMENT;
    index += numTransparentSkyLights * Uint8Array.BYTES_PER_ELEMENT;
    index += numTransparentTorchLights * Uint8Array.BYTES_PER_ELEMENT;
    index = _align4(index);
    index += numTransparentIndices * Uint32Array.BYTES_PER_ELEMENT;
    return index;
  })();
  const arraybuffer = new ArrayBuffer(totalSize);
  let index = 0;
  const opaque = {};
  opaque.positions = new Float32Array(arraybuffer, index, numOpaquePositions);
  index += numOpaquePositions * Float32Array.BYTES_PER_ELEMENT;
  opaque.uvs = new Float32Array(arraybuffer, index, numOpaqueUvs);
  index += numOpaqueUvs * Float32Array.BYTES_PER_ELEMENT;
  opaque.ids = new Float32Array(arraybuffer, index, numOpaqueIds);
  index += numOpaqueIds * Float32Array.BYTES_PER_ELEMENT;
  opaque.skyLights = new Uint8Array(arraybuffer, index, numOpaqueSkyLights);
  index += numOpaqueSkyLights * Uint8Array.BYTES_PER_ELEMENT;
  opaque.torchLights = new Uint8Array(arraybuffer, index, numOpaqueTorchLights);
  index += numOpaqueTorchLights * Uint8Array.BYTES_PER_ELEMENT;
  index = _align4(index);
  opaque.indices = new Uint32Array(arraybuffer, index, numOpaqueIndices);
  index += numOpaqueIndices * Uint32Array.BYTES_PER_ELEMENT;
  opaque.positionsIndex = 0;
  opaque.uvsIndex = 0;
  opaque.idsIndex = 0;
  opaque.skyLightsIndex = 0;
  opaque.torchLightsIndex = 0;
  opaque.indicesIndex = 0;

  const transparent = {};
  transparent.positions = new Float32Array(arraybuffer, index, numTransparentPositions);
  index += numTransparentPositions * Float32Array.BYTES_PER_ELEMENT;
  transparent.uvs = new Float32Array(arraybuffer, index, numTransparentUvs);
  index += numTransparentUvs * Float32Array.BYTES_PER_ELEMENT;
  transparent.ids = new Float32Array(arraybuffer, index, numTransparentIds);
  index += numTransparentIds * Float32Array.BYTES_PER_ELEMENT;
  transparent.skyLights = new Uint8Array(arraybuffer, index, numTransparentSkyLights);
  index += numTransparentSkyLights * Uint8Array.BYTES_PER_ELEMENT;
  transparent.torchLights = new Uint8Array(arraybuffer, index, numTransparentTorchLights);
  index += numTransparentTorchLights * Uint8Array.BYTES_PER_ELEMENT;
  index = _align4(index);
  transparent.indices = new Uint32Array(arraybuffer, index, numTransparentIndices);
  index += numTransparentIndices * Uint32Array.BYTES_PER_ELEMENT;
  transparent.positionsIndex = 0;
  transparent.uvsIndex = 0;
  transparent.idsIndex = 0;
  transparent.skyLightsIndex = 0;
  transparent.torchLightsIndex = 0;
  transparent.indicesIndex = 0;

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
      const spec = geometry.transparent ? transparent : opaque;

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
        spec.skyLights[spec.skyLightsIndex + jOffset] = heightfields[fieldIndex];
        spec.torchLights[spec.torchLightsIndex + jOffset] = lightfields[fieldIndex];
      }
      spec.positionsIndex += geometry.positions.length;
      spec.skyLightsIndex += geometry.positions.length/3;
      spec.torchLightsIndex += geometry.positions.length/3;

      spec.uvs.set(geometry.uvs, spec.uvsIndex);
      spec.uvsIndex += geometry.uvs.length;

      spec.ids.fill(object.id, spec.idsIndex, spec.idsIndex + geometry.positions.length/3);
      spec.idsIndex += geometry.positions.length/3;
    }
  }

  return [
    {
      opaque,
      transparent,
    },
    arraybuffer,
  ];
};

const queue = [];
let loaded = false;
const _handleMessage = async data => {
  const {method} = data;
  switch (method) {
    case 'registerFile': {
      const {url} = data;
      const gltf = await _loadGltf(url);

      for (const child of gltf.children) {
        _mergeObject(child);
      }
      
      for (const child of gltf.children) {
        const {name, geometry} = child;
        geometryRegistry[name] = [{
          transparent: false,
          positions: geometry.attributes.position.array,
          uvs: geometry.attributes.uv.array,
          indices: geometry.index.array,
        }];
      }

      self.postMessage({
        result: {},
      });
      break;
    }
    case 'getTexture': {
      _mergeFinish();

      const mesh = geometryRegistry['tree1'][0];
      if (mesh) {
        let byteArray;
        {
          const encoder = new encoderModule.Encoder();
          const meshBuilder = new encoderModule.MeshBuilder();
          const dracoMesh = new encoderModule.Mesh();

          console.log('got mesh', mesh);
          const numFaces = mesh.indices.length / 3;
          const numPoints = mesh.positions.length;
          meshBuilder.AddFacesToMesh(dracoMesh, numFaces, mesh.indices);

          meshBuilder.AddFloatAttributeToMesh(dracoMesh, encoderModule.POSITION, numPoints, 3, mesh.positions);
          meshBuilder.AddFloatAttributeToMesh(dracoMesh, encoderModule.TEX_COORD, numPoints, 2, mesh.uvs);
          encoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);
          encoder.SetEncodingMethod(encoderModule.MESH_SEQUENTIAL_ENCODING);

          const encodedData = new encoderModule.DracoInt8Array();
          // Use default encoding setting.
          const encodedLen = encoder.EncodeMeshToDracoBuffer(dracoMesh,
                                                             encodedData);
          byteArray = new Uint8Array(encodedLen);
          for (let i = 0; i < encodedLen; i++) {
            byteArray[i] = encodedData.GetValue(i);
          }
          encoderModule.destroy(dracoMesh);
          encoderModule.destroy(encoder);
          encoderModule.destroy(meshBuilder);
          encoderModule.destroy(encodedData);
        }
        {
          // Create the Draco decoder.
          const buffer = new decoderModule.DecoderBuffer();
          buffer.Init(byteArray, byteArray.length);

          // Create a buffer to hold the encoded data.
          const decoder = new decoderModule.Decoder();
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

          // console.log('go output', tree1, outputGeometry, decoderModule.POSITION, decoder.GetAttributeId(outputGeometry, decoderModule.POSITION), decoder.GetAttributeId(outputGeometry, decoderModule.TEX_COORD));

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
          }
          let index;
          {
            const numFaces = outputGeometry.num_faces();
            const numIndices = numFaces * 3;
            index = new Uint16Array( numIndices );
            const indexArray = new decoderModule.DracoInt32Array();

            for ( var i = 0; i < numFaces; ++ i ) {

              decoder.GetFaceFromMesh( outputGeometry, i, indexArray );

              for ( var j = 0; j < 3; ++ j ) {

                index[ i * 3 + j ] = indexArray.GetValue( j );

              }

            }
          }
          // console.log('got result', mesh, positions, uvs, index);

          // You must explicitly delete objects created from the DracoDecoderModule
          // or Decoder.
          decoderModule.destroy(outputGeometry);
          decoderModule.destroy(decoder);
          decoderModule.destroy(buffer);
        }
      }

      const blob = await canvas.convertToBlob();
      const arraybuffer = await blob.arrayBuffer();

      self.postMessage({
        result: arraybuffer,
      }, [arraybuffer]);
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
};
self.onmessage = e => {
  const {data} = e;
  if (!loaded) {
    queue.push(data);
  } else {
    _handleMessage(data);
  }
};

let encoderModule, decoderModule;
encoderModule = new DracoEncoderModule({
  onModuleLoaded() {
    decoderModule = new DracoDecoderModule({
      onModuleLoaded() {
        loaded = true;
        _flushMessages();
      },
    });
  },
});
