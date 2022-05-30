import * as THREE from 'three';
import {makeId} from './util.js';
import {defaultChunkSize} from './constants.js';
// import metaversefile from 'metaversefile';
// import { terrainVertex, terrainFragment } from './shaders/terrainShader.js';
// import physics from './physics-manager.js';

// const localVector = new THREE.Vector3();

const numWorkers = 4;

class TerrainManager {
  constructor({
    chunkSize = defaultChunkSize,
  } = {}) {
    this.chunkSize = chunkSize;

    // create workers
    const workers = Array(numWorkers);
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker('./dc-worker.js?import', {
        type: 'module',
      });
      const cbs = new Map();
      worker.onmessage = e => {
        const {requestId} = e.data;
        const cb = cbs.get(requestId);
        if (cb) {
          cbs.delete(requestId);
          cb(e.data);
        } else {
          console.warn('worker message without callback', e.data);
        }
      };
      worker.onerror = err => {
        console.log('terrain worker load error', err);
      };
      worker.request = (method, args) => {
        return new Promise((resolve, reject) => {
          const requestId =  makeId(5);
          cbs.set(requestId, data => {
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
            requestId,
          });
        });
      };
      workers[i] = worker;
    }

    // connect ports
    const _makePorts = () => {
      const result = Array(numWorkers);
      for (let i = 0; i < numWorkers; i++) {
        const messageChannel = new MessageChannel();
        result[i] = [
          messageChannel.port1,
          messageChannel.port2,
        ];
      }
      return result;
    };
    for (let i = 0; i < numWorkers; i++) {
      const worker1 = workers[i];
      const ports = _makePorts();
      for (let j = 0; j < numWorkers; j++) {
        if (i !== j) {
          const worker2 = workers[j];
          const [port1, port2] = ports[j];

          worker1.postMessage({
            method: 'port',
            args: {
              port: port1,
            },
          }, [port1]);
          worker2.postMessage({
            method: 'port',
            args: {
              port: port2,
            },
          }, [port2]);
        }
      }
    }

    // initialize
    Promise.all(workers.map(async worker => {
      // set chunk size
      await worker.request('setChunkSize', {
        chunkSize,
      });
    }));

    this.workers = workers;
    this.nextWorker = 0;
  }
  async generateChunk(chunkPosition, lod) {
    const {workers} = this;
    const worker = workers[this.nextWorker];
    this.nextWorker = (this.nextWorker + 1) % workers.length;

    const result = await worker.request('generateChunk', {
      chunkPosition: chunkPosition.toArray(),
      lod,
    });
    return result;
  }
}
const terrainManager = new TerrainManager();
export default terrainManager;