// import * as THREE from 'three';
import {chunkMinForPosition, getLockChunkId} from './util.js';
import {abortError} from './lock-manager.js';

//

const defaultNumDcWorkers = 1;
const TASK_PRIORITIES = {
  tracker: -10,
  splat: -1,
};

//

let taskIds = 0;

//

export class DcWorkerManager {
  constructor({
    chunkSize,
    seed,
    instance,
    numWorkers = defaultNumDcWorkers,
  } = {}) {
    this.chunkSize = chunkSize;
    this.seed = seed;
    this.instance = instance;
    this.numWorkers = numWorkers;

    this.workers = [];
    this.nextWorker = 0;
    // this.locks = new LockManager();
    this.loadPromise = null;

    // trigger load
    this.waitForLoad();
  }

  waitForLoad() {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        // create workers
        const workers = Array(this.numWorkers);
        for (let i = 0; i < this.numWorkers; i++) {
          const worker = new Worker('./dc-worker.js?import', {
            type: 'module',
          });
          const cbs = new Map();
          worker.onmessage = e => {
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
          worker.onerror = err => {
            console.log('dc worker load error', err);
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

              cbs.set(taskId, data => {
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
          workers[i] = worker;
        }

        /* // connect ports
        const _makePorts = () => {
          const result = Array(this.numWorkers);
          for (let i = 0; i < this.numWorkers; i++) {
            const messageChannel = new MessageChannel();
            result[i] = [messageChannel.port1, messageChannel.port2];
          }
          return result;
        };
        for (let i = 0; i < this.numWorkers; i++) {
          const worker1 = workers[i];
          const ports = _makePorts();
          for (let j = 0; j < this.numWorkers; j++) {
            if (i !== j) {
              const worker2 = workers[j];
              const [port1, port2] = ports[j];

              worker1.postMessage(
                {
                  method: 'port',
                  args: {
                    port: port1,
                  },
                },
                [port1]
              );
              worker2.postMessage(
                {
                  method: 'port',
                  args: {
                    port: port2,
                  },
                },
                [port2]
              );
            }
          }
        } */

        // initialize
        // note: deliberately don't wait for this; let it start in the background
        Promise.all(
          workers.map(async worker => {
            await Promise.all([
              worker.request('initialize', {
                chunkSize: this.chunkSize,
                seed: this.seed,
              }),
              worker.request('ensureInstance', {
                instance: this.instance,
              }),
            ]);
          }),
        );

        this.workers = workers;
      })();
    }
    return this.loadPromise;
  }

  getNextWorker() {
    const {workers} = this;
    const worker = workers[this.nextWorker];
    this.nextWorker = (this.nextWorker + 1) % workers.length;
    return worker;
  }

  setCamera(worldPosition, cameraPosition, cameraQuaternion, projectionMatrix) {
    /* if (position.x === 0 && position.y === 0 && position.z === 0) {
      debugger;
      return;
    } */

    const worldPositionArray = worldPosition.toArray();
    const cameraPositionArray = cameraPosition.toArray();
    const cameraQuaternionArray = cameraQuaternion.toArray();
    const projectionMatrixArray = projectionMatrix.toArray();

    const worker = this.getNextWorker();
    worker.request('setCamera', {
      instance: this.instance,
      worldPosition: worldPositionArray,
      cameraPosition: cameraPositionArray,
      cameraQuaternion: cameraQuaternionArray,
      projectionMatrix: projectionMatrixArray,
    });
  }

  setClipRange(range) {
    const rangeArray = [range.min.toArray(), range.max.toArray()];

    const worker = this.getNextWorker();
    worker.request('setClipRange', {
      instance: this.instance,
      range: rangeArray,
    });
    /* await Promise.all(
      this.workers.map((worker) => {
        return worker.request('setClipRange', {
          instance: this.instance,
          range: [range.min.toArray(), range.max.toArray()],
        }, {signal});
      })
    ); */
  }

  async createTracker(lod, minLodRange, trackY, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('createTracker', {
      instance: this.instance,
      lod,
      minLodRange,
      trackY,
    }, {signal});
    return result;
  }

  async destroyTracker(tracker, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('destroyTracker', {
      instance: this.instance,
      tracker,
    }, {signal});
    return result;
  }

  async trackerUpdate(tracker, position, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('trackerUpdate', {
      instance: this.instance,
      tracker,
      position: position.toArray(),
      priority: TASK_PRIORITIES.tracker,
    }, {signal});
    return result;
  }

  async generateTerrainChunk(chunkPosition, lodArray, {signal} = {}) {
    // const chunkId = getLockChunkId(chunkPosition);
    // return await this.locks.request(chunkId, async lock => {
    const worker = this.getNextWorker();
    const result = await worker.request('generateTerrainChunk', {
      instance: this.instance,
      chunkPosition: chunkPosition.toArray(),
      lodArray,
    }, {signal});
      // signal.throwIfAborted();
    return result;
    // });
  }

  /* async generateTerrainChunkRenderable(chunkPosition, lodArray, {signal} = {}) {
    // const chunkId = getLockChunkId(chunkPosition);
    // return await this.locks.request(chunkId, {signal}, async lock => {
      const worker = this.getNextWorker();
      const result = await worker.request('generateTerrainChunkRenderable', {
        instance: this.instance,
        chunkPosition: chunkPosition.toArray(),
        lodArray,
      }, {signal});
      // signal.throwIfAborted();
      return result;
    // });
  } */
  async generateLiquidChunk(chunkPosition, lodArray, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('generateLiquidChunk', {
      instance: this.instance,
      chunkPosition: chunkPosition.toArray(),
      lodArray,
    }, {signal});
    // signal.throwIfAborted();
    return result;
  }

  async getChunkHeightfield(x, z, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('getChunkHeightfield', {
      instance: this.instance,
      x,
      z,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }

  async getHeightfieldRange(x, z, w, h, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('getHeightfieldRange', {
      instance: this.instance,
      x,
      z,
      w,
      h,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }

  async getLightRange(x, y, z, w, h, d, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('getLightRange', {
      instance: this.instance,
      x,
      y,
      z,
      w,
      h,
      d,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }

  /* async getHeightfieldRange(x, z, w, h, lod) {
    const worker = this.getNextWorker();
    const result = await worker.request('getHeightfieldRange', {
      instance: this.instance,
      x,
      z,
      w,
      h,
      lod,
    });
    return result;
  }
  async getSkylightFieldRange(x, y, z, w, h, d, lod) {
    const worker = this.getNextWorker();
    const result = await worker.request('getSkylightFieldRange', {
      instance: this.instance,
      x,
      y,
      z,
      w,
      h,
      d,
      lod,
    });
    return result;
  }
  async getAoFieldRange(x, y, z, w, h, d, lod) {
    const worker = this.getNextWorker();
    const result = await worker.request('getAoFieldRange', {
      instance: this.instance,
      x,
      y,
      z,
      w,
      h,
      d,
      lod,
    });
    return result;
  } */
  async createGrassSplat(x, z, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('createGrassSplat', {
      instance: this.instance,
      x,
      z,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }

  async createVegetationSplat(x, z, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('createVegetationSplat', {
      instance: this.instance,
      x,
      z,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }

  async createMobSplat(x, z, lod, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('createMobSplat', {
      instance: this.instance,
      x,
      z,
      lod,
      priority: TASK_PRIORITIES.splat,
    }, {signal});
    return result;
  }

  async drawCubeDamage(position, quaternion, scale, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('drawCubeDamage', {
      instance: this.instance,
      position: position.toArray(),
      quaternion: quaternion.toArray(),
      scale: scale.toArray(),
    }, {signal});
    return result;
  }

  async eraseCubeDamage(position, quaternion, scale, {signal} = {}) {
    const worker = this.getNextWorker();
    const result = await worker.request('eraseCubeDamage', {
      instance: this.instance,
      position: position.toArray(),
      quaternion: quaternion.toArray(),
      scale: scale.toArray(),
    }, {signal});
    return result;
  }

  async drawSphereDamage(position, radius, {signal} = {}) {
    // const chunkPosition = chunkMinForPosition(
    //   position.x,
    //   position.y,
    //   position.z,
    //   this.chunkSize
    // );
    // const chunkId = getLockChunkId(chunkPosition);
    // return await this.locks.request(chunkId, async lock => {
    const worker = this.getNextWorker();
    const result = await worker.request('drawSphereDamage', {
      instance: this.instance,
      position: position.toArray(),
      radius,
    }, {signal});
    return result;
    // });
  }

  async eraseSphereDamage(position, radius, {signal} = {}) {
    const chunkPosition = chunkMinForPosition(
      position.x,
      position.y,
      position.z,
      this.chunkSize,
    );
    const chunkId = getLockChunkId(chunkPosition);
    // return await this.locks.request(chunkId, async lock => {
    const worker = this.getNextWorker();
    const result = await worker.request('eraseSphereDamage', {
      instance: this.instance,
      position: position.toArray(),
      radius,
    }, {signal});
    return result;
    // });
  }
}
