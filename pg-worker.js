import * as THREE from 'three';
import {defaultChunkSize} from './constants.js';
import pg from './pg-binding.js';
import {makePromise, align, align4} from './util.js';

//

const chunkWorldSize = defaultChunkSize;

//

// const localVector = new THREE.Vector3();
const localVector2D = new THREE.Vector2();

//

const _cloneChunkResult = chunkResult => {
  const {terrainGeometry, waterGeometry, barrierGeometry} = chunkResult;

  const _getTerrainGeometrySize = () => {
    let size = terrainGeometry.positions.length * terrainGeometry.positions.constructor.BYTES_PER_ELEMENT +
      terrainGeometry.normals.length * terrainGeometry.normals.constructor.BYTES_PER_ELEMENT +
      terrainGeometry.biomesWeights.length * terrainGeometry.biomesWeights.constructor.BYTES_PER_ELEMENT +
      terrainGeometry.biomesUvs1.length * terrainGeometry.biomesUvs1.constructor.BYTES_PER_ELEMENT +
      terrainGeometry.biomesUvs2.length * terrainGeometry.biomesUvs2.constructor.BYTES_PER_ELEMENT +
      terrainGeometry.indices.length * terrainGeometry.indices.constructor.BYTES_PER_ELEMENT;
    return size;
  };
  const _getWaterGeometrySize = () => {
    let size = waterGeometry.positions.length * waterGeometry.positions.constructor.BYTES_PER_ELEMENT +
      waterGeometry.normals.length * waterGeometry.normals.constructor.BYTES_PER_ELEMENT +
      waterGeometry.factors.length * waterGeometry.factors.constructor.BYTES_PER_ELEMENT +
      waterGeometry.indices.length * waterGeometry.indices.constructor.BYTES_PER_ELEMENT;
    return size;
  };
  const _getBarrierGeometrySize = () => {
    let size = barrierGeometry.positions.length * barrierGeometry.positions.constructor.BYTES_PER_ELEMENT +
      barrierGeometry.normals.length * barrierGeometry.normals.constructor.BYTES_PER_ELEMENT +
      barrierGeometry.uvs.length * barrierGeometry.uvs.constructor.BYTES_PER_ELEMENT +
      barrierGeometry.positions2D.length * barrierGeometry.positions2D.constructor.BYTES_PER_ELEMENT +
      barrierGeometry.indices.length * barrierGeometry.indices.constructor.BYTES_PER_ELEMENT;
    return size;
  };

  const terrainGeometrySize = _getTerrainGeometrySize();
  const waterGeometrySize = _getWaterGeometrySize();
  const barrierGeometrySize = _getBarrierGeometrySize();
  const arrayBuffer = new ArrayBuffer(
    terrainGeometrySize +
    waterGeometrySize +
    barrierGeometrySize
  );
  let index = 0;

  const _cloneTerrainGeometry = () => {
    const positions = new terrainGeometry.positions.constructor(arrayBuffer, index, terrainGeometry.positions.length);
    positions.set(terrainGeometry.positions);
    index += terrainGeometry.positions.length * terrainGeometry.positions.constructor.BYTES_PER_ELEMENT;
    
    const normals = new terrainGeometry.normals.constructor(arrayBuffer, index, terrainGeometry.normals.length);
    normals.set(terrainGeometry.normals);
    index += terrainGeometry.normals.length * terrainGeometry.normals.constructor.BYTES_PER_ELEMENT;

    const biomes = new terrainGeometry.biomes.constructor(arrayBuffer, index, terrainGeometry.biomes.length);
    biomes.set(terrainGeometry.biomes);
    index += terrainGeometry.biomes.length * terrainGeometry.biomes.constructor.BYTES_PER_ELEMENT;

    const biomesWeights = new terrainGeometry.biomesWeights.constructor(arrayBuffer, index, terrainGeometry.biomesWeights.length);
    biomesWeights.set(terrainGeometry.biomesWeights);
    index += terrainGeometry.biomesWeights.length * terrainGeometry.biomesWeights.constructor.BYTES_PER_ELEMENT;
    
    const biomesUvs1 = new terrainGeometry.biomesUvs1.constructor(arrayBuffer, index, terrainGeometry.biomesUvs1.length);
    biomesUvs1.set(terrainGeometry.biomesUvs1);
    index += terrainGeometry.biomesUvs1.length * terrainGeometry.biomesUvs1.constructor.BYTES_PER_ELEMENT;

    const biomesUvs2 = new terrainGeometry.biomesUvs2.constructor(arrayBuffer, index, terrainGeometry.biomesUvs2.length);
    biomesUvs2.set(terrainGeometry.biomesUvs2);
    index += terrainGeometry.biomesUvs2.length * terrainGeometry.biomesUvs2.constructor.BYTES_PER_ELEMENT;

    // const seeds = new terrainGeometry.seeds.constructor(arrayBuffer, index, terrainGeometry.seeds.length);
    // seeds.set(terrainGeometry.seeds);
    // index += terrainGeometry.seeds.length * terrainGeometry.seeds.constructor.BYTES_PER_ELEMENT;

    const indices = new terrainGeometry.indices.constructor(arrayBuffer, index, terrainGeometry.indices.length);
    indices.set(terrainGeometry.indices);
    index += terrainGeometry.indices.length * terrainGeometry.indices.constructor.BYTES_PER_ELEMENT;

    /* const skylights = new terrainGeometry.skylights.constructor(arrayBuffer, index, terrainGeometry.skylights.length);
    skylights.set(terrainGeometry.skylights);
    index += terrainGeometry.skylights.length * terrainGeometry.skylights.constructor.BYTES_PER_ELEMENT;

    const aos = new terrainGeometry.aos.constructor(arrayBuffer, index, terrainGeometry.aos.length);
    aos.set(terrainGeometry.aos);
    index += terrainGeometry.aos.length * terrainGeometry.aos.constructor.BYTES_PER_ELEMENT;
    
    const peeks = new terrainGeometry.peeks.constructor(arrayBuffer, index, terrainGeometry.peeks.length);
    peeks.set(terrainGeometry.peeks);
    index += terrainGeometry.peeks.length * terrainGeometry.peeks.constructor.BYTES_PER_ELEMENT; */

    return {
      positions,
      normals,
      biomes,
      biomesWeights,
      biomesUvs1,
      biomesUvs2,
      // seeds,
      indices,
      // skylights,
      // aos,
      // peeks
    };
  };
  const _cloneWaterGeometry = () => {
    const positions = new waterGeometry.positions.constructor(arrayBuffer, index, waterGeometry.positions.length);
    positions.set(waterGeometry.positions);
    index += waterGeometry.positions.length * waterGeometry.positions.constructor.BYTES_PER_ELEMENT;
    
    const normals = new waterGeometry.normals.constructor(arrayBuffer, index, waterGeometry.normals.length);
    normals.set(waterGeometry.normals);
    index += waterGeometry.normals.length * waterGeometry.normals.constructor.BYTES_PER_ELEMENT;

    const factors = new waterGeometry.factors.constructor(arrayBuffer, index, waterGeometry.factors.length);
    factors.set(waterGeometry.factors);
    index += waterGeometry.factors.length * waterGeometry.factors.constructor.BYTES_PER_ELEMENT;

    const indices = new waterGeometry.indices.constructor(arrayBuffer, index, waterGeometry.indices.length);
    indices.set(waterGeometry.indices);
    index += waterGeometry.indices.length * waterGeometry.indices.constructor.BYTES_PER_ELEMENT;

    return {
      positions,
      normals,
      factors,
      indices,
    };
  };
  const _cloneBarrierGeometry = () => {
    const positions = new barrierGeometry.positions.constructor(arrayBuffer, index, barrierGeometry.positions.length);
    positions.set(barrierGeometry.positions);
    index += barrierGeometry.positions.length * barrierGeometry.positions.constructor.BYTES_PER_ELEMENT;
    
    const normals = new barrierGeometry.normals.constructor(arrayBuffer, index, barrierGeometry.normals.length);
    normals.set(barrierGeometry.normals);
    index += barrierGeometry.normals.length * barrierGeometry.normals.constructor.BYTES_PER_ELEMENT;

    const uvs = new barrierGeometry.uvs.constructor(arrayBuffer, index, barrierGeometry.uvs.length);
    uvs.set(barrierGeometry.uvs);
    index += barrierGeometry.uvs.length * barrierGeometry.uvs.constructor.BYTES_PER_ELEMENT;

    const positions2D = new barrierGeometry.positions2D.constructor(arrayBuffer, index, barrierGeometry.positions2D.length);
    positions2D.set(barrierGeometry.positions2D);
    index += barrierGeometry.positions2D.length * barrierGeometry.positions2D.constructor.BYTES_PER_ELEMENT;

    const indices = new barrierGeometry.indices.constructor(arrayBuffer, index, barrierGeometry.indices.length);
    indices.set(barrierGeometry.indices);
    index += barrierGeometry.indices.length * barrierGeometry.indices.constructor.BYTES_PER_ELEMENT;

    return {
      positions,
      normals,
      uvs,
      positions2D,
      indices,
    };
  };

  const terrainGeometry2 = _cloneTerrainGeometry();
  const waterGeometry2 = _cloneWaterGeometry();
  const barrierGeometry2 = _cloneBarrierGeometry();

  return {
    arrayBuffer,
    terrainGeometry: terrainGeometry2,
    waterGeometry: waterGeometry2,
    barrierGeometry: barrierGeometry2,
  };
};
const _cloneInstancesResult = vegetationResult => {
  const {instances} = vegetationResult;

  const _getVegetationGeometrySize = () => {
    let size = 0;
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const {ps, qs} = instance;
      size += ps.length * ps.constructor.BYTES_PER_ELEMENT;
      size += qs.length * qs.constructor.BYTES_PER_ELEMENT;
    }
    return size;
  };
  const size = _getVegetationGeometrySize();

  const arrayBuffer = new ArrayBuffer(size);
  let index = 0;

  const instances2 = Array(instances.length);
  for (let i = 0; i < instances.length; i++) {
    const instance = instances[i];
    const {instanceId, ps, qs} = instance;

    const ps2 = new ps.constructor(arrayBuffer, index, ps.length);
    ps2.set(ps);
    index += ps.length * ps.constructor.BYTES_PER_ELEMENT;

    const qs2 = new qs.constructor(arrayBuffer, index, qs.length);
    qs2.set(qs);
    index += qs.length * qs.constructor.BYTES_PER_ELEMENT;

    instances2[i] = {
      instanceId,
      ps: ps2,
      qs: qs2,
    };
  }

  return {
    arrayBuffer,
    instances: instances2,
  };
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
    chunkMin: trackerUpdate.chunkMin,
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
    case 'generateChunk': {
      const {chunkPosition, lod, lodArray} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('generateChunk : instance not found');

      const position = localVector2D.fromArray(chunkPosition)
        .multiplyScalar(chunkWorldSize);
      const chunkResult = await pg.createChunkMeshAsync(
        instance,
        taskId,
        position.x,
        position.y,
        lod,
        lodArray,
      );
      const chunkResult2 = _cloneChunkResult(chunkResult);

      const _freeChunkResult = chunkResult => {
        pg.free(chunkResult.terrainGeometry.bufferAddress);
        pg.free(chunkResult.waterGeometry.bufferAddress);
        pg.free(chunkResult.barrierGeometry.bufferAddress);
        pg.free(chunkResult.bufferAddress);
      };
      _freeChunkResult(chunkResult);

      return {
        result: chunkResult2,
        transfers: [
          chunkResult2.arrayBuffer,
        ],
      };
    }
    case 'generateGrass': {
      const {chunkPosition, lod, numInstances} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('generateGrass : instance not found');

      const position = localVector2D.fromArray(chunkPosition)
        .multiplyScalar(chunkWorldSize);
      const grassResult = await pg.createChunkGrassAsync(
        instance,
        taskId,
        position.x,
        position.y,
        lod,
        numInstances
      );
      const grassResult2 = _cloneInstancesResult(grassResult);

      const _freeInstancesResult = grassResult => {
        pg.free(grassResult.bufferAddress);
      };
      _freeInstancesResult(grassResult);

      const spec = {
        result: grassResult2,
        transfers: [
          grassResult2.arrayBuffer,
        ],
      };
      return spec;
    }
    case 'generateVegetation': {
      const {chunkPosition, lod, numInstances} = args;
      const instance = instances.get(instanceKey);
      if (!instance) throw new Error('generateVegetation : instance not found');

      const position = localVector2D.fromArray(chunkPosition)
        .multiplyScalar(chunkWorldSize);
      const vegetationResult = await pg.createChunkVegetationAsync(
        instance,
        taskId,
        position.x,
        position.y,
        lod,
        numInstances
      );
      const vegetationResult2 = _cloneInstancesResult(vegetationResult);

      const _freeInstancesResult = vegetationResult => {
        pg.free(vegetationResult.bufferAddress);
      };
      _freeInstancesResult(vegetationResult);

      const spec = {
        result: vegetationResult2,
        transfers: [
          vegetationResult2.arrayBuffer,
        ],
      };
      return spec;
    }
    /* case 'generateLiquidChunk': {
      const {chunkPosition, lod, lodArray} = args;
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
        lodArray,
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
    } */
    /* case 'createGrassSplat': {
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
    } */
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
