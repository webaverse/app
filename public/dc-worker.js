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