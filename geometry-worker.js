importScripts('./three.js', './GLTFLoader.js');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();

const _align4 = n => {
  const d = n%4;
  return d ? (n+4-d) : n;
};

const geometryRegistry = {};
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
const MAX_NAME_LENGTH = 128;
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
      positions,
      uvs,
      indices,
    };
    result.push(m);
  }

  return result;
};

const queue = [];
let loaded = false;
const _handleMessage = async data => {
  const {method} = data;
  switch (method) {
    case 'loadBake': {
      const {url} = data;

      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const meshes = _flatDecode(arrayBuffer);
      for (const mesh of meshes) {
        geometryRegistry[mesh.name] = [mesh];
      }

      self.postMessage({
        result: null,
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
self.onmessage = e => {
  _handleMessage(e.data);
};