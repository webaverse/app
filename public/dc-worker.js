import Module from './bin/dc.js'
import {makePromise} from '../util.js'

const ports = [];

let loaded = false;
let running = false;
let queue = [];
const _handleMethod = ({
  method,
  args,
}) => {
  switch (method) {
    case 'setChunkSize': {
      const {chunkSize} = args;
      return Module._setChunkSize(chunkSize);
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
      let {chunkPosition, lod} = args;
      chunkPosition = new THREE.Vector3().fromArray(chunkPosition);

      const generateChunkMesh = (origin) => {
        physics.generateChunkDataDualContouring(origin.x, origin.y, origin.z);
      };
      const setChunkLod = (origin, lod) => {
        physics.setChunkLodDualContouring(origin.x, origin.y, origin.z, lod);
      };

      const generateChunk = (chunk, lod) => {
        localVector2.copy(chunk).multiplyScalar(chunkWorldSize);
        generateChunkMesh(localVector2, physics);
        setChunkLod(localVector2, 1, physics);
        const meshData = physics.createChunkMeshDualContouring(localVector2.x, localVector2.y, localVector2.z);
      };

      const clearChunkData = (origin) => {
        physics.clearTemporaryChunkDataDualContouring();
        physics.clearChunkRootDualContouring(origin.x, origin.y, origin.z);
      };
    }
    default: {
      throw new Error(`unknown method: ${method}`);
    }
  }
};
const _handleMessage = async ({
  data,
  port,
}) => {
  if (loaded && !running) {
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
    queue.push(e.data);
  }
};
self.onmessage = e => {
  _handleMessage({
    data: e.data,
    port: self,
  });
};

(async () => {
  await Module.waitForLoad();

  loaded = true;
  if (queue.length > 0) {
    _handleMessage(queue.shift());
  }
})();