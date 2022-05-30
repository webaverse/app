import * as THREE from 'three';
import dc from './dual-contouring.js';
import {makePromise} from './util.js'
import {defaultChunkSize} from './constants.js';

const chunkWorldSize = defaultChunkSize;

const localVector = new THREE.Vector3();

const ports = [];

let loaded = false;
let running = false;
let queue = [];
const _handleMethod = ({
  method,
  args,
}) => {
  // console.log('worker handle method', method, args);
  switch (method) {
    case 'setChunkSize': {
      const {chunkSize} = args;
      return dc.setChunkSize(chunkSize);
    }
    case 'port': {
      const {port} = args;
      port.addEventListener('message', e => {
        _handleMessage({
          data: e.data,
          port,
        });
      });
      ports.push(ports);
      return;
    }
    case 'generateChunk': {
      const {chunkPosition, lod} = args;
      const chunk = new THREE.Vector3().fromArray(chunkPosition);
      localVector.copy(chunk).multiplyScalar(chunkWorldSize);
      const meshData = dc.createChunkMeshDualContouring(localVector.x, localVector.y, localVector.z, 1);
      const meshData2 = meshData && {
        positions: meshData.positions.slice(),
        normals: meshData.normals.slice(),
        biomes: meshData.biomes.slice(),
        biomesWeights: meshData.biomesWeights.slice(),
        indices: meshData.indices.slice(),
      };
      meshData && dc.free(meshData.bufferAddress);
      console.log('got mesh data', meshData2);
      dc.clearChunkRootDualContouring(localVector.x, localVector.y, localVector.z);
      return meshData2;
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
        const result = await _handleMethod(data);
        p.accept(result);
      } catch (err) {
        p.reject(err);
      }

      if (requestId) {
        p.then(result => {
          port.postMessage({
            method: 'repsonse',
            requestId,
            result,
          });
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
  console.log('worker waitForLoad 1');
  await dc.waitForLoad();
  console.log('worker waitForLoad 2');

  loaded = true;
  console.log('worker initial messages', queue.slice());
  if (queue.length > 0) {
    _handleMessage(queue.shift());
  }
})();