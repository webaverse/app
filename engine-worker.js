import {
  bindCanvas,
} from './renderer.js';

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

async function import2(s) {
  if (/^(?:ipfs:\/\/|https?:\/\/|weba:\/\/|data:)/.test(s)) {
    const prefix = location.protocol + '//' + location.host + '/@proxy/';
    if (s.startsWith(prefix)) {
      s = s.slice(prefix.length);
    }
    s = `/@proxy/${encodeURI(s)}`;
  }
  try {
    const m = await import(s);
    return m;
  } catch(err) {
    console.warn('error loading', JSON.stringify(s), err.stack);
    return null;
  }
}

const _bindPort = port => {
  const handlers = new Map();
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
        case 'registerHandler': {
          const {handlerId, src} = e.data;

          let error = null;
          let result = null;
          try {
            const u = `data:application/javascript;charset=utf-8,${encodeURIComponent(src)}`;
            const module = await import2(u);
            if (typeof module.default === 'function') {
              const fn = module.default;
              handlers.set(handlerId, fn);
              result = 'ok';
            } else {
              console.warn('engine worker bad module', module);
              throw new Error('engine worker module default export is not a function');
            }
          } catch(err) {
            error = err?.stack ?? (err + '');
          } finally {
            respond(error, result);
          }
          break;
        }
        case 'callHandler': {
          const {handlerId, args} = e.data;
          const handler = handlers.get(handlerId);
          if (handler) {
            let error;
            let result;
            let transfers;
            try {
              result = await handler.apply(null, args);
              transfers = getTransferables(result);
            } catch(err) {
              error = err?.stack ?? (err + '');
            } finally {
              respond(error, result, transfers);
            }
          } else {
            respond(new Error('no handler registered: ' + handlerId));
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

const match = location.hash.match(/^#id=(.+)$/);
const id = match ? match[1] : null;
if (id) {
  // nothing
} else {
  throw new Error('no id in engine worker');
}