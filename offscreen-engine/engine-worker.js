import {bindCanvas} from '../renderer.js';

import {getEmotionCanvases} from './fns/avatar-iconer-fn.js';
import {createSpriteAvatarMesh, crunchAvatarModel, optimizeAvatarModel} from './fns/avatar-renderer-fns.js';
import {generateObjectUrlCardRemote} from './fns/cards-manager-fn.js';
import {getLandImage} from './fns/land-iconer-fn.js';
import {createAppUrlSpriteSheet} from './fns/spriting-fn.js';
import {getSpriteAnimationForAppUrlInternal} from './fns/sprite-animation-manager-fn.js';

const functionMap = {
  'createSpriteAvatarMesh': createSpriteAvatarMesh,
  'crunchAvatarModel': crunchAvatarModel,
  'optimizeAvatarModel': optimizeAvatarModel,
  'createAppUrlSpriteSheet': createAppUrlSpriteSheet,
  'getEmotionCanvases': getEmotionCanvases,
  'generateObjectUrlCardRemote': generateObjectUrlCardRemote,
  'getLandImage': getLandImage,
  'getSpriteAnimationForAppUrlInternal': getSpriteAnimationForAppUrlInternal,
};

window.addEventListener('message', e => {
  const method = e.data?.method;
  if (method === 'initializeEngine') {
    const {port} = e.data;
    _bindPort(port);
  }
});

const isTransferable = o => {
  const ctor = o?.constructor;
  return ctor === MessagePort ||
    ctor === ImageBitmap ||
    ctor === ImageData ||
    // ctor === AudioData ||
    // ctor === OffscreenCanvas ||
    ctor === ArrayBuffer ||
    ctor === Uint8Array ||
    ctor === Int8Array ||
    ctor === Uint16Array ||
    ctor === Int16Array ||
    ctor === Uint32Array ||
    ctor === Int32Array ||
    ctor === Float32Array ||
    ctor === Float64Array;
};
const getTransferables = o => {
  const result = [];
  const _recurse = o => {
    if (Array.isArray(o)) {
      for (const e of o) {
        _recurse(e);
      }
    } else if (o && typeof o === 'object') {
      if (isTransferable(o)) {
        result.push(o);
      } else {
        for (const k in o) {
          _recurse(o[k]);
        }
      }
    }
  };
  _recurse(o);
  return result;
};

const _bindPort = port => {
  port.addEventListener('message', async e => {
    const {method, id} = e.data;
    const respond = (error = null, result = null, transfers = []) => {
      port.postMessage({
        method: 'response',
        id,
        error,
        result,
      }, transfers);
    };
    if (method) {
      switch (method) {
        case 'callHandler': {
          const {funcName, args} = e.data;
          const fn = functionMap[funcName];
          if (fn) {
            let error;
            let result;
            let transfers;
            try {
              result = await fn.apply(null, args);
              transfers = getTransferables(result);
            } catch(err) {
              error = err?.stack ?? (err + '');
            } finally {
              respond(error, result, transfers);
            }
          } else {
            respond(new Error('no function found: ' + funcName));
          }
          break;
        }
        default: {
          console.warn(`Unknown method: ${method}`);``
          break;
        }
      }
    }
  });
  port.start();
};

const canvas = document.getElementById('canvas');
window.innerWidth = canvas.width;
window.innerHeight = canvas.height;
window.devicePixelRatio = 1;
bindCanvas(canvas);
