import {getRandomString} from './util.js';
import {inappPreviewHost} from './constants.js';

class OffscreenEngine {
  constructor() {
    this.id = getRandomString();

    const iframe = document.createElement('iframe');
    iframe.width = '0px';
    iframe.height = '0px';
    iframe.style.cssText = `\
      border: 0;
    `;
    iframe.src = `${inappPreviewHost}/engine.html#id=${this.id}`;
    document.body.appendChild(iframe);
    this.iframe = iframe;
    this.port = null;
    
    this.running = false;
    this.queue = [];

    this.loadPromise = (async () => {
      const contentWindow = await new Promise((resolve, reject) => {
        iframe.onload = () => {
          resolve(iframe.contentWindow);

          iframe.onload = null;
          iframe.onerror = null;
        };
        iframe.onerror = reject;
      });

      const port = await new Promise((resolve, reject) => {
        const message = e => {
          // console.log('got message', e);
          if (e.data?.method === 'engineReady' && e.data.id === this.id && e.data.port instanceof MessagePort) {
            resolve(e.data.port);

            window.removeEventListener('message', message);
          }
        };
        window.addEventListener('message', message);
      });
      port.start();
      this.port = port;
    })();
  }
  waitForLoad() {
    return this.loadPromise;
  }
  async waitForTurn(fn) {
    const _next = () => {
      if (this.queue.length > 0) {
        const fn = this.queue.shift();
        this.waitForTurn(fn);
      }
    };
    
    if (!this.running) {
      this.running = true;

      try {
        const result = await fn();
        return result;
      } catch(err) {
        throw err;
      } finally {
        this.running = false;
        _next();
      }
    } else {
      this.queue.push(fn);
    }
  }
  createFunction(prefix, fn) {
    const id = getRandomString();

    const loadPromise = (async () => {
      // console.log('create function 1');
      await this.waitForLoad();
      // console.log('create function 2');
      await this.waitForTurn(async () => {
        // console.log('create function 3');
        const src = prefix + `
          const _default_export_ = ${fn.toString()};
          export default _default_export_;
        `;
        this.port.postMessage({
          method: 'registerHandler',
          id,
          src,
        });

        await new Promise((accept, reject) => {
          const message = e => {
            const {method, id: localId} = e.data;
            if (method === 'response' && localId === id) {
              const {error, result} = e.data;
              if (!error) {
                accept(result);
              } else {
                reject(error);
              }
              this.port.removeEventListener('message', message);
            }
          };
          this.port.addEventListener('message', message);
        });
      });
      console.log('create function 4');
    })();
    
    const self = this;
    async function callRemoteFn() {
      const args = Array.from(arguments);

      await loadPromise;

      let result;
      let error;
      await self.waitForTurn(async () => {
        self.port.postMessage({
          method: 'callHandler',
          id,
          args,
        });

        try {
          result = await new Promise((accept, reject) => {
            const message = e => {
              const {method} = e.data;
              if (method === 'response') {
                const {error, result} = e.data;
                if (!error) {
                  accept(result);
                } else {
                  reject(error);
                }
                self.port.removeEventListener('message', message);
              }
            };
            self.port.addEventListener('message', message);
          });
        } catch(err) {
          error = err;
        }
      });

      if (!error) {
        return result;
      } else {
        throw error;
      }
    }
    return callRemoteFn;
  }
}

/* const queue = [];
let running = false;
let f;

const next = () => {
  const {url, ext, type, width, height, resolve, reject} = queue.shift();
  generatePreview(url, ext, type, width, height, resolve, reject);
};

export const generatePreview = async (url, ext, type, width, height, resolve, reject) => {
  const previewHost = inappPreviewHost;
  running = true;
  // check for existing iframe
  var iframe = document.querySelector(`iframe[src^="${previewHost}/screenshot.html"]`);

  // else create new iframe
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.width = '0px';
    iframe.height = '0px';
    document.body.appendChild(iframe);
  }

  // check either first param is url or hash
  if (!isValidURL(url)) {
    url = `${storageHost}/${url}/preview.${ext}`;
  }

  // create URL
  var ssUrl = `${previewHost}/screenshot.html?url=${url}&ext=${ext}&type=${type}&width=${width}&height=${height}`;

  // set src attr for iframe
  iframe.src = ssUrl;
  console.log('Preview generation in progress for ', ssUrl);
  // event listener for postMessage from screenshot.js
  const rejection = setTimeout(() => {
    reject('Preview Server Timed Out');
    running = false;
    window.removeEventListener('message', f, false);
    if (queue.length > 0) {
      next();
    }
  }, 30 * 1000);

  f = event => {
    if (event.data.method === 'result') {
      window.removeEventListener('message', f, false);
      let blob;
      if (type === 'webm') {
        blob = new Blob([event.data.result], {
          type: `video/${type}`,
        });
      } else {
        blob = new Blob([event.data.result], {
          type: `image/${type}`,
        });
      }
      clearTimeout(rejection);
      resolve({
        blob: blob,
        url: URL.createObjectURL(blob),
      });
      running = false;
      if (queue.length > 0) {
        next();
      }
    }
  };
  window.addEventListener('message', f);
};

// URL validate function
function isValidURL(string) {
  var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null);
}

export const preview = async (url, ext, type, width, height, priority=10) => {
  return new Promise((resolve, reject) => {
    if (!['png', 'jpg', 'jpeg', 'vox', 'vrm', 'glb', 'webm', 'gif'].includes(ext)) {
      return reject('Undefined Extension');
    }
    if (!running) {
      generatePreview(url, ext, type, width, height, resolve, reject);
    } else {
      queue.push({url, ext, type, width, height, resolve, reject, priority});
      queue.sort((a, b) => a.priority - b.priority)
    }
  });
}; */

export {
  OffscreenEngine,
};