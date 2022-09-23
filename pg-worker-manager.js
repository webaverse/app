// import * as THREE from 'three';
import {abortError} from './lock-manager.js';

//

const localArray3D = Array(3);
const localArray3D2 = Array(3);
const localArray4D = Array(4);
const localArray16D = Array(16);

//

const workerUrl = `./pg-worker.js?import`;
const TASK_PRIORITIES = {
  tracker: -10,
  splat: -1,
};

//

let taskIds = 0;

//

const GenerateFlags = {
  // none: 0,
  terrain: 1 << 0,
  water: 1 << 1,
  barrier: 1 << 2,
  vegetation: 1 << 3,
  grass: 1 << 4,
};
const _generateFlagsToInt = generateFlags => {
  let result = 0;
  generateFlags.terrain && (result |= GenerateFlags.terrain);
  generateFlags.water && (result |= GenerateFlags.water);
  generateFlags.barrier && (result |= GenerateFlags.barrier);
  generateFlags.vegetation && (result |= GenerateFlags.vegetation);
  generateFlags.grass && (result |= GenerateFlags.grass);
  return result;
};

//

export class PGWorkerManager {
  constructor({
    chunkSize,
    seed,
    instance,
  } = {}) {
    this.chunkSize = chunkSize;
    this.seed = seed;
    this.instance = instance;

    this.worker = null;
    this.loadPromise = null;

    // trigger load
    this.waitForLoad();
  }
  waitForLoad() {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const worker = new Worker(workerUrl, {
          type: 'module',
        });
        const cbs = new Map();
        worker.onmessage = (e) => {
          const {taskId} = e.data;
          const cb = cbs.get(taskId);
          if (cb) {
            cbs.delete(taskId);
            cb(e.data);
          } else {
            // console.warn('dropped canceled message', e.data);
            // debugger;
          }
        };
        worker.onerror = (err) => {
          console.log('pg worker load error', err);
        };
        worker.request = (method, args, {signal} = {}) => {
          return new Promise((resolve, reject) => {
            const {instance} = this;
            const taskId = ++taskIds;

            const onabort = e => {
              worker.request('cancelTask', {
                taskId,
              });

              reject(abortError);
              cbs.delete(taskId);
            };
            signal && signal.addEventListener('abort', onabort);

            cbs.set(taskId, (data) => {
              signal && signal.removeEventListener('abort', onabort);

              const {error, result} = data;
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            });
            worker.postMessage({
              method,
              args,
              instance,
              taskId,
            });
          });
        };

        // initialize
        // note: deliberately don't wait for this; let it start in the background
        await Promise.all([
          worker.request('initialize', {
            // chunkSize: this.chunkSize,
            // seed: this.seed,
          }),
          worker.request('ensureInstance', {
            instance: this.instance,
            seed: this.seed,
            chunkSize: this.chunkSize,
          }),
        ]);

        this.worker = worker;
      })();
    }
    return this.loadPromise;
  }
  setCamera(worldPosition, cameraPosition, cameraQuaternion, projectionMatrix) {
    const worldPositionArray = worldPosition.toArray(localArray3D);
    const cameraPositionArray = cameraPosition.toArray(localArray3D2);
    const cameraQuaternionArray = cameraQuaternion.toArray(localArray4D);
    const projectionMatrixArray = projectionMatrix.toArray(localArray16D);

    this.worker.request('setCamera', {
      instance: this.instance,
      worldPosition: worldPositionArray,
      cameraPosition: cameraPositionArray,
      cameraQuaternion: cameraQuaternionArray,
      projectionMatrix: projectionMatrixArray,
    });
  }
  setClipRange(range) {
    const rangeArray = [range.min.toArray(), range.max.toArray()];
    
    this.worker.request('setClipRange', {
      instance: this.instance,
      range: rangeArray,
    });
  }

  async createTracker(lod, lod1Range, {signal} = {}) {
    if (!lod1Range) {
      debugger;
    }
    const result = await this.worker.request('createTracker', {
      instance: this.instance,
      lod,
      lod1Range,
    }, {signal});
    return result;
  }
  async destroyTracker(tracker, {signal} = {}) {
    const result = await this.worker.request('destroyTracker', {
      instance: this.instance,
      tracker,
    }, {signal});
    return result;
  }
  async trackerUpdate(tracker, position, {signal} = {}) {
    const result = await this.worker.request('trackerUpdate', {
      instance: this.instance,
      tracker,
      position: position.toArray(),
      priority: TASK_PRIORITIES.tracker,
    }, {signal});
    return result;
  }

  //

  async generateChunk(chunkPosition, lod, lodArray, generateFlags, {signal} = {}) {
    const generateFlagsInt = _generateFlagsToInt(generateFlags);
    const result = await this.worker.request('generateChunk', {
      instance: this.instance,
      chunkPosition,
      lod,
      lodArray,
      generateFlagsInt,
    }, {signal});
    // signal.throwIfAborted();
    return result;
  }
  async generateGrass(chunkPosition, lod, numGrassInstances, {signal} = {}) {
    const result = await this.worker.request('generateGrass', {
      instance: this.instance,
      chunkPosition,
      lod,
      numGrassInstances,
    }, {signal});
    // signal.throwIfAborted();
    return result;
  }
  async generateVegetation(chunkPosition, lod, numVegetationInstances, {signal} = {}) {
    const result = await this.worker.request('generateVegetation', {
      instance: this.instance,
      chunkPosition,
      lod,
      numVegetationInstances,
    }, {signal});
    // signal.throwIfAborted();
    return result;
  }
  /* async generateLiquidChunk(chunkPosition, lod, lodArray, {signal} = {}) {
    const result = await this.worker.request('generateLiquidChunk', {
      instance: this.instance,
      chunkPosition,
      lod,
      lodArray,
    }, {signal});
    // signal.throwIfAborted();
    return result;
  } */

  //

  /* async getChunkHeightfield(x, z, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('getChunkHeightfield', {
      instance: this.instance,
      x, z,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  } */

  //

  /* async getHeightfieldRange(x, z, w, h, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('getHeightfieldRange', {
      instance: this.instance,
      x, z,
      w, h,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }
  async getLightRange(x, y, z, w, h, d, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('getLightRange', {
      instance: this.instance,
      x, y, z,
      w, h, d,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  } */

  //

  /* async createGrassSplat(x, z, lod, {signal} = {}) {
    const result = await this.worker.request('createGrassSplat', {
      instance: this.instance,
      x,
      z,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }
  async createVegetationSplat(x, z, lod, {signal} = {}) {
    const result = await this.worker.request('createVegetationSplat', {
      instance: this.instance,
      x,
      z,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }
  async createMobSplat(x, z, lod, {signal} = {}) {
    const result = await this.worker.request('createMobSplat', {
      instance: this.instance,
      x,
      z,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  } */
}
