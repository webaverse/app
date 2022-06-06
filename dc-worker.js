import * as THREE from 'three';
import dc from './dual-contouring.js';
import {makePromise} from './util.js'
import {defaultChunkSize} from './constants.js';

const chunkWorldSize = defaultChunkSize;

const localVector = new THREE.Vector3();

const ports = [];

const _cloneMeshData = (meshData) => {
  if (meshData) {
    /* return {
      arrayBuffer: new ArrayBuffer(1),
      positions: meshData.positions.slice(),
      normals: meshData.normals.slice(),
      biomes: meshData.biomes.slice(),
      biomesWeights: meshData.biomesWeights.slice(),
      indices: meshData.indices.slice(),
    }; */

    const sizeRequired = meshData.positions.length * meshData.positions.constructor.BYTES_PER_ELEMENT +
      meshData.normals.length * meshData.normals.constructor.BYTES_PER_ELEMENT +
      meshData.biomes.length * meshData.biomes.constructor.BYTES_PER_ELEMENT +
      meshData.biomesWeights.length * meshData.biomesWeights.constructor.BYTES_PER_ELEMENT +
      meshData.indices.length * meshData.indices.constructor.BYTES_PER_ELEMENT;
    const arrayBuffer = new ArrayBuffer(sizeRequired);
    let index = 0;

    const positions = new meshData.positions.constructor(arrayBuffer, index, meshData.positions.length);
    positions.set(meshData.positions);
    index += meshData.positions.length * meshData.positions.constructor.BYTES_PER_ELEMENT;
    
    const normals = new meshData.normals.constructor(arrayBuffer, index, meshData.normals.length);
    normals.set(meshData.normals);
    index += meshData.normals.length * meshData.normals.constructor.BYTES_PER_ELEMENT;
    
    const biomes = new meshData.biomes.constructor(arrayBuffer, index, meshData.biomes.length);
    biomes.set(meshData.biomes);
    index += meshData.biomes.length * meshData.biomes.constructor.BYTES_PER_ELEMENT;
    
    const biomesWeights = new meshData.biomesWeights.constructor(arrayBuffer, index, meshData.biomesWeights.length);
    biomesWeights.set(meshData.biomesWeights);
    index += meshData.biomesWeights.length * meshData.biomesWeights.constructor.BYTES_PER_ELEMENT;
    
    const indices = new meshData.indices.constructor(arrayBuffer, index, meshData.indices.length);
    indices.set(meshData.indices);
    index += meshData.indices.length * meshData.indices.constructor.BYTES_PER_ELEMENT;

    return {
      // bufferAddress: arrayBuffer.byteOffset,
      arrayBuffer,
      positions,
      normals,
      biomes,
      biomesWeights,
      indices,
    };
  } else {
    return null;
  }
};

let loaded = false;
let running = false;
let queue = [];
const _handleMethod = ({
  method,
  args,
}) => {
  // console.log('worker handle method', method, args);

  const _injectDamages = chunks => {
    // inject the damage to peer workers
    const method = 'injectDamages';
    const args = {
      chunks,
    };
    for (const port of ports) {
      // console.log('got port', port);
      port.postMessage({
        method,
        args,
      });
    }
  };
  const _chunksToResult = chunks => chunks.map(({position}) => ({position}));

  switch (method) {
    case 'initialize': {
      const {chunkSize, seed} = args;
      return dc.initialize(chunkSize, seed);
    }
    case 'port': {
      const {port} = args;
      port.onmessage = e => {
        _handleMessage({
          data: e.data,
          port,
        });
      };
      ports.push(port);
      return;
    }
    case 'generateChunk': {
      const {chunkPosition, lodArray} = args;
      localVector.fromArray(chunkPosition)
        .multiplyScalar(chunkWorldSize);
      const meshData = dc.createChunkMeshDualContouring(localVector.x, localVector.y, localVector.z, lodArray);
      const meshData2 = _cloneMeshData(meshData);
      meshData && dc.free(meshData.bufferAddress);
      // console.log('got mesh data', meshData2);
      dc.clearChunkRootDualContouring(localVector.x, localVector.y, localVector.z)

      if (meshData2) {
        const spec = {
          result: meshData2,
          transfers: [meshData2.arrayBuffer],
        };
        return spec;
      } else {
        return null;
      }
    }
    case 'getHeightfieldRange': {
      const {x, z, w, h, lod} = args;
      const heights = dc.getHeightfieldRange(x, z, w, h, lod);

      const spec = {
        result: heights,
        transfers: [heights.buffer],
      };
      return spec;
    }
    case 'createGrassSplat': {
      const {x, z, lod} = args;
      const {
        ps,
        qs,
      } = dc.createGrassSplat(x, z, lod);

      const spec = {
        result: {
          ps,
          qs,
        },
        transfers: [ps.buffer, qs.buffer],
      };
      return spec;
    }
    case 'createVegetationSplat': {
      const {x, z, lod} = args;
      const {
        ps,
        qs,
      } = dc.createVegetationSplat(x, z, lod);

      const spec = {
        result: {
          ps,
          qs,
        },
        transfers: [ps.buffer, qs.buffer],
      };
      return spec;
    }
    case 'createMobSplat': {
      const {x, z, lod} = args;
      const {
        ps,
        qs,
      } = dc.createMobSplat(x, z, lod);

      const spec = {
        result: {
          ps,
          qs,
        },
        transfers: [ps.buffer, qs.buffer],
      };
      return spec;
    }
    case 'drawCubeDamage': {
      const {position, quaternion, scale} = args;
      // console.log('dc worker draw cube damage', {position, quaternion, scale});
      const chunks = dc.drawCubeDamage(
        position[0], position[1], position[2],
        quaternion[0], quaternion[1], quaternion[2], quaternion[3],
        scale[0], scale[1], scale[2],
      );
      // console.log('draw cube damage chunks', chunks);

      if (chunks) {
        _injectDamages(chunks);
        return {
          result: _chunksToResult(chunks),
          transfers: [],
        };
      } else {
        return null;
      }
    }
    case 'eraseCubeDamage': {
      const {position, quaternion, scale} = args;
      const chunks = dc.drawCubeDamage(
        position[0], position[1], position[2],
        quaternion[0], quaternion[1], quaternion[2], quaternion[3],
        scale[0], scale[1], scale[2],
      );

      if (chunks) {
        _injectDamages(chunks);
        return {
          result: _chunksToResult(chunks),
          transfers: [],
        };
      } else {
        return null;
      }
    }
    case 'drawSphereDamage': {
      const {position, radius} = args;
      const chunks = dc.drawSphereDamage(
        position[0], position[1], position[2],
        radius,
      );

      if (chunks) {
        _injectDamages(chunks);
        return {
          result: _chunksToResult(chunks),
          transfers: [],
        };
      } else {
        return null;
      }
    }
    case 'eraseSphereDamage': {
      const {position, radius} = args;
      const chunks = dc.eraseSphereDamage(
        position[0], position[1], position[2],
        radius,
      );

      if (chunks) {
        _injectDamages(chunks);
        return {
          result: _chunksToResult(chunks),
          transfers: [],
        };
      } else {
        return null;
      }
    }
    case 'injectDamages': {
      const {chunks} = args;
      for (const chunk of chunks) {
        const {position, damageBuffer} = chunk;
        // console.log('worker inject damage 1', {position, damageBuffer});
        dc.injectDamage(position[0], position[1], position[2], damageBuffer);
        // console.log('worker inject damage 2', {position, damageBuffer});
      }
      return null;
    }
    default: {
      throw new Error(`unknown method: ${method}`);
    }
  }
};
const _handleMessage = async e => {
  if (loaded && !running) {
    const {
      data,
      port,
    } = e;
    
    {
      running = true;

      const {requestId} = data;
      const p = makePromise();
      try {
        const spec = await _handleMethod(data);
        p.accept(spec);
      } catch (err) {
        p.reject(err);
      }

      if (requestId) {
        p.then(spec => {
          const {result = null, transfers = []} = spec ?? {};
          port.postMessage({
            method: 'response',
            requestId,
            result,
          }, transfers);
        }, err => {
          port.postMessage({
            requestId,
            error: err.message,
          });
        });
      }

      running = false;
    }
    // next
    if (queue.length > 0) {
      _handleMessage(queue.shift());
    }
  } else {
    queue.push(e);
  }
};
self.onmessage = e => {
  _handleMessage({
    data: e.data,
    port: self,
  });
};

(async () => {
  // console.log('worker waitForLoad 1');
  await dc.waitForLoad();
  // console.log('worker waitForLoad 2');

  loaded = true;
  // console.log('worker initial messages', queue.slice());
  if (queue.length > 0) {
    _handleMessage(queue.shift());
  }
})();