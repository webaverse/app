import * as THREE from 'three';
import physxLite from './physx-lite.js';
import {makePromise} from './util.js';
import {defaultChunkSize} from './constants.js';

const chunkWorldSize = defaultChunkSize;

const localVector = new THREE.Vector3();

const fakeMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

let loaded = false;
let running = false;
const queue = [];
const _handleMethod = ({method, args}) => {
  switch (method) {
    case 'cookGeometry': {
      const {positions, indices} = args;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      const mesh = new THREE.Mesh(geometry, fakeMaterial);
      const result = physxLite.cookGeometryPhysics(mesh);
      return {
        result,
        transfers: [result.buffer],
      };
    }
    case 'cookConvexGeometry': {
      const {positions, indices} = args;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      const mesh = new THREE.Mesh(geometry, fakeMaterial);
      const result = physxLite.cookConvexGeometryPhysics(mesh);
      return {
        result,
        transfers: [result.buffer],
      };
    }
    case 'meshoptSimplify': {
      const {positions, /* uvs, */ indices, targetRatio, targetError} = args;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      );
      // geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      const mesh = new THREE.Mesh(geometry, fakeMaterial);
      const result = physxLite.meshoptSimplify(mesh, targetRatio, targetError);
      return {
        result,
        transfers: [result.buffer],
      };
    }
    case 'meshoptSimplifySloppy': {
      const {positions, /* uvs, */ indices, targetRatio, targetError} = args;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      );
      // geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      const mesh = new THREE.Mesh(geometry, fakeMaterial);
      const result = physxLite.meshoptSimplifySloppy(
        mesh,
        targetRatio,
        targetError,
      );
      return {
        result,
        transfers: [result.buffer],
      };
    }
    default: {
      throw new Error(`unknown method: ${method}`);
    }
  }
};
const _handleMessage = async e => {
  if (loaded && !running) {
    const {data, port} = e;

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
        p.then(
          spec => {
            const {result = null, transfers = []} = spec ?? {};
            port.postMessage(
              {
                method: 'response',
                requestId,
                result,
              },
              transfers,
            );
          },
          err => {
            port.postMessage({
              requestId,
              error: err.message,
            });
          },
        );
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
  await physxLite.waitForLoad();

  loaded = true;
  if (queue.length > 0) {
    _handleMessage(queue.shift());
  }
})();
