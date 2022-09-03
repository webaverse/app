import * as THREE from 'three';
import {defaultChunkSize} from './constants.js';
import pg from './pg-binding.js';
import {makePromise} from './util.js';

//

const chunkWorldSize = defaultChunkSize;

//

// const localVector = new THREE.Vector3();
const localVector2D = new THREE.Vector2();

//

const _cloneTerrainMeshData = (meshData) => {
  if (meshData) {
    const sizeRequired = meshData.positions.length * meshData.positions.constructor.BYTES_PER_ELEMENT +
      meshData.normals.length * meshData.normals.constructor.BYTES_PER_ELEMENT +
      // meshData.biomes.length * meshData.biomes.constructor.BYTES_PER_ELEMENT +
      meshData.biomesWeights.length * meshData.biomesWeights.constructor.BYTES_PER_ELEMENT +
      meshData.biomesUvs1.length * meshData.biomesUvs1.constructor.BYTES_PER_ELEMENT +
      meshData.biomesUvs2.length * meshData.biomesUvs2.constructor.BYTES_PER_ELEMENT +
      meshData.indices.length * meshData.indices.constructor.BYTES_PER_ELEMENT // +
      // meshData.skylights.length * meshData.skylights.constructor.BYTES_PER_ELEMENT +
      // meshData.aos.length * meshData.aos.constructor.BYTES_PER_ELEMENT +
      // meshData.peeks.length * meshData.peeks.constructor.BYTES_PER_ELEMENT;

    const arrayBuffer = new ArrayBuffer(sizeRequired);
    let index = 0;

    const positions = new meshData.positions.constructor(arrayBuffer, index, meshData.positions.length);
    positions.set(meshData.positions);
    index += meshData.positions.length * meshData.positions.constructor.BYTES_PER_ELEMENT;
    
    const normals = new meshData.normals.constructor(arrayBuffer, index, meshData.normals.length);
    normals.set(meshData.normals);
    index += meshData.normals.length * meshData.normals.constructor.BYTES_PER_ELEMENT;

    const biomesWeights = new meshData.biomesWeights.constructor(arrayBuffer, index, meshData.biomesWeights.length);
    biomesWeights.set(meshData.biomesWeights);
    index += meshData.biomesWeights.length * meshData.biomesWeights.constructor.BYTES_PER_ELEMENT;
    
    const biomesUvs1 = new meshData.biomesUvs1.constructor(arrayBuffer, index, meshData.biomesUvs1.length);
    biomesUvs1.set(meshData.biomesUvs1);
    index += meshData.biomesUvs1.length * meshData.biomesUvs1.constructor.BYTES_PER_ELEMENT;

    const biomesUvs2 = new meshData.biomesUvs2.constructor(arrayBuffer, index, meshData.biomesUvs2.length);
    biomesUvs2.set(meshData.biomesUvs2);
    index += meshData.biomesUvs2.length * meshData.biomesUvs2.constructor.BYTES_PER_ELEMENT;

    const indices = new meshData.indices.constructor(arrayBuffer, index, meshData.indices.length);
    indices.set(meshData.indices);
    index += meshData.indices.length * meshData.indices.constructor.BYTES_PER_ELEMENT;

    /* const skylights = new meshData.skylights.constructor(arrayBuffer, index, meshData.skylights.length);
    skylights.set(meshData.skylights);
    index += meshData.skylights.length * meshData.skylights.constructor.BYTES_PER_ELEMENT;

    const aos = new meshData.aos.constructor(arrayBuffer, index, meshData.aos.length);
    aos.set(meshData.aos);
    index += meshData.aos.length * meshData.aos.constructor.BYTES_PER_ELEMENT;
    
    const peeks = new meshData.peeks.constructor(arrayBuffer, index, meshData.peeks.length);
    peeks.set(meshData.peeks);
    index += meshData.peeks.length * meshData.peeks.constructor.BYTES_PER_ELEMENT; */

    return {
      // bufferAddress: arrayBuffer.byteOffset,
      arrayBuffer,
      positions,
      normals,
      // biomes,
      biomesWeights,
      biomesUvs1,
      biomesUvs2,
      indices,
      // skylights,
      // aos,
      // peeks
    };
  } else {
    return null;
  }
};
const _cloneLiquidMeshData = (meshData) => {
  if (meshData) {
    const sizeRequired = meshData.positions.length * meshData.positions.constructor.BYTES_PER_ELEMENT +
      meshData.normals.length * meshData.normals.constructor.BYTES_PER_ELEMENT +
      meshData.biomes.length * meshData.biomes.constructor.BYTES_PER_ELEMENT +
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
    
    const indices = new meshData.indices.constructor(arrayBuffer, index, meshData.indices.length);
    indices.set(meshData.indices);
    index += meshData.indices.length * meshData.indices.constructor.BYTES_PER_ELEMENT;

    return {
      // bufferAddress: arrayBuffer.byteOffset,
      arrayBuffer,
      positions,
      normals,
      biomes,
      indices,
    };
  } else {
    return null;
  }
};

const instances = new Map();

const _cloneNode = node => {
  return {
    min: node.min.slice(),
    lod: node.lod,
    lodArray: node.lodArray.slice(),
  };
};
const _cloneTrackerUpdate = trackerUpdate => {
  return {
    leafNodes: trackerUpdate.leafNodes.map(_cloneNode),
    newDataRequests: trackerUpdate.newDataRequests.map(_cloneNode),
    keepDataRequests: trackerUpdate.keepDataRequests.map(_cloneNode),
    cancelDataRequests: trackerUpdate.cancelDataRequests.map(_cloneNode),
  };
};

let loaded = false;
let queue = [];
const _handleMethod = async ({method, args, instance: instanceKey, taskId}) => {
  // const _chunksToResult = chunks => chunks.map(({ position }) => ({ position }));

  switch (method) {
    case 'initialize': {
      const {chunkSize, seed, numThreads} = args;
      return pg.initialize(chunkSize, seed, numThreads);
    }
    case 'ensureInstance': {
      // console.log('ensure instance', args);
      const {instance: instanceKey, seed, chunkSize} = args;
      let instance = instances.get(instanceKey);
      if (!instance) {
        instance = pg.createInstance(seed, chunkSize);
        instances.set(instanceKey, instance);
      }
      return true;
    }
    case 'deleteInstance': {
      const {instance: instanceKey} = args;
      const instance = instances.get(instanceKey);
      if (instance) {
        pg.deleteInstance(instance);
        instances.delete(instanceKey);
        return true;
      } else {
        return false;
      }
    }
    case 'setCamera': {
      const {instance: instanceKey, worldPosition, cameraPosition, cameraQuaternion, projectionMatrix} = args;
      const instance = instances.get(instanceKey);
      pg.setCamera(instance, worldPosition, cameraPosition, cameraQuaternion, projectionMatrix);
      return true;
    }
    case 'setClipRange': {
      const {instance: instanceKey, range} = args;
      const instance = instances.get(instanceKey);
      pg.setClipRange(instance, range);
      return true;
    }
    case 'createTracker': {
      const {instance: instanceKey, lod, lod1Range, trackY} = args;
      const instance = instances.get(instanceKey);
      const tracker = pg.createTracker(instance, lod, lod1Range, trackY);
      const spec = {
        result: tracker,
        transfers: [],
      };
      return spec;
    }
    case 'destroyTracker': {
      const {instance: instanceKey, tracker} = args;
      const instance = instances.get(instanceKey);
      pg.destroyTracker(instance, tracker);
      return true;
    }
    case 'trackerUpdate': {
      const {instance: instanceKey, tracker, position, priority} = args;
      const instance = instances.get(instanceKey);
      const trackerUpdate = await pg.trackerUpdateAsync(instance, taskId, tracker, position, priority);
      const trackerUpdate2 = _cloneTrackerUpdate(trackerUpdate);
      const spec = {
        result: trackerUpdate2,
        transfers: [],
      };
      return spec;
    }
    case 'generateTerrainChunk': {
      const {chunkPosition, lod} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('generateTerrainChunk : instance not found');

      const position = localVector2D.fromArray(chunkPosition)
        .multiplyScalar(chunkWorldSize);
      const meshData = await pg.createTerrainChunkMeshAsync(
        instance,
        taskId,
        position.x,
        position.y,
        lod,
      );
      const meshData2 = _cloneTerrainMeshData(meshData);
      meshData && pg.free(meshData.bufferAddress);

      if (meshData2) {
        const spec = {
          result: meshData2,
          transfers: [
            meshData2.arrayBuffer,
            // meshData2.skylights.buffer,
            // meshData2.aos.buffer,
          ],
        };
        return spec;
      } else {
        return null;
      }
    }
    case 'generateLiquidChunk': {
      const {chunkPosition, lod} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('generateLiquidChunk : instance not found');
      
      const position = localVector2D.fromArray(chunkPosition)
        .multiplyScalar(chunkWorldSize);
      const meshData = await pg.createLiquidChunkMeshAsync(
        instance,
        taskId,
        position.x,
        position.y,
        lod,
      );
      const meshData2 = _cloneLiquidMeshData(meshData);
      meshData && pg.free(meshData.bufferAddress);

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
    case 'createGrassSplat': {
      const {x, z, lod, priority} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('createGrassSplat : instance not found');

      const {
        ps,
        qs,
        instances: instancesResult,
      } = await pg.createGrassSplatAsync(instance, taskId, x, z, lod, priority);

      const spec = {
        result: {
          ps,
          qs,
          instances: instancesResult,
        },
        transfers: [ps.buffer, qs.buffer, instancesResult.buffer],
      };
      return spec;
    }
    case 'createVegetationSplat': {
      const {x, z, lod, priority} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('createVegetationSplat : instance not found');
      
      const {
        ps,
        qs,
        instances: instancesResult,
      } = await pg.createVegetationSplatAsync(instance, taskId, x, z, lod, priority);

      const spec = {
        result: {
          ps,
          qs,
          instances: instancesResult,
        },
        transfers: [ps.buffer, qs.buffer, instancesResult.buffer],
      };
      return spec;
    }
    case 'createMobSplat': {
      const {x, z, lod, priority} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('createMobSplat : instance not found');
      
      const {
        ps,
        qs,
        instances: instancesResult,
      } = await pg.createMobSplatAsync(instance, taskId, x, z, lod, priority);

      const spec = {
        result: {
          ps,
          qs,
          instances: instancesResult,
        },
        transfers: [ps.buffer, qs.buffer, instancesResult.buffer],
      };
      return spec;
    }
    /* case 'drawCubeDamage': {
      const {position, quaternion, scale} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('drawCubeDamage : instance not found');

      // console.log('dc worker draw cube damage', {position, quaternion, scale});
      const chunks = pg.drawCubeDamage(
        instance,
        position[0],
        position[1],
        position[2],
        quaternion[0],
        quaternion[1],
        quaternion[2],
        quaternion[3],
        scale[0],
        scale[1],
        scale[2]
      );
      // console.log('draw cube damage chunks', chunks);

      if (chunks) {
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
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('eraseCubeDamage : instance not found');

      const chunks = pg.drawCubeDamage(
        instance,
        position[0],
        position[1],
        position[2],
        quaternion[0],
        quaternion[1],
        quaternion[2],
        quaternion[3],
        scale[0],
        scale[1],
        scale[2]
      );

      if (chunks) {
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
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('drawSphereDamage : instance not found');

      const chunks = pg.drawSphereDamage(
        instance,
        position[0],
        position[1],
        position[2],
        radius
      );

      if (chunks) {
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
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('eraseSphereDamage : instance not found');
      const chunks = pg.eraseSphereDamage(
        instance,
        position[0],
        position[1],
        position[2],
        radius
      );

      if (chunks) {
        return {
          result: _chunksToResult(chunks),
          transfers: [],
        };
      } else {
        return null;
      }
    } */
    case 'cancelTask': {
      const {taskId} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('cancelTask : instance not found');

      await pg.cancelTask(instance, taskId);
      const spec = {
        result: null,
        transfers: [],
      };
      return spec;
    }
    default: {
      throw new Error(`unknown method: ${method}`);
    }
  }
};
const _handleMessage = async m => {
  const {data, port} = m;
  const {taskId} = data;
  const p = makePromise();
  // try {
    const spec = await _handleMethod(data);
    p.accept(spec);
  // } catch (err) {
  //   p.reject(err);
  // }

  if (taskId) {
    p.then(
      (spec) => {
        const { result = null, transfers = [] } = spec ?? {};
        port.postMessage(
          {
            method: 'response',
            taskId,
            result,
          },
          transfers
        );
      },
      (err) => {
        port.postMessage({
          method: 'response',
          taskId,
          error: err.message,
        });
      }
    );
  }
};
self.onmessage = (e) => {
  const m = {
    data: e.data,
    port: self,
  };
  if (loaded) {
    _handleMessage(m);
  } else {
    queue.push(m);
  }
};

(async () => {
  await pg.waitForLoad();

  loaded = true;
  for (let i = 0; i < queue.length; i++) {
    _handleMessage(queue[i]);
  }
  queue.length = 0;
})();
