import {getRandomString} from './util.js';
import {inappPreviewHost} from './constants.js';

class OffscreenEngine {
  constructor() {
    this.id = getRandomString();
    this.frame = null;
    this.port = null;

    this.loadPromise = null;
  }
  async waitForLoad() {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const iframe = document.createElement('iframe');
        iframe.width = '0px';
        iframe.height = '0px';
        iframe.style.cssText = `\
          border: 0;
        `;
    
        // this.live = true;
    
        const messageChannel = new MessageChannel();
        const {port1, port2} = messageChannel;
    
        const iframeLoadPromise = new Promise((resolve, reject) => {
          iframe.onload = () => {
            resolve();
            iframe.onload = null;
            iframe.onerror = null;
          };
          iframe.onerror = reject;
        });
  
        iframe.allow = 'cross-origin-isolated';
        // iframe.src = `${inappPreviewHost}/engine.html#id=${this.id}`;
        iframe.src = `https://local.webaverse.com:3000/engine.html#id=${this.id}`;
        document.body.appendChild(iframe);
        this.iframe = iframe;
  
        await iframeLoadPromise;
  
        iframe.contentWindow.postMessage({
          method: 'initializeEngine',
          port: port2,
        }, '*', [port2]);
  
        return port1;
      })();
    }
    const port = await this.loadPromise;
    port.start();
    this.port = port;
    return port;
  }
  createFunction(o) {
    if (!Array.isArray(o)) {
      o = [o];
    }
    const _formatElement = e => {
      if (typeof e === 'string') {
        return e;
      } else if (typeof e === 'function') {
        return `\
const _default_export_ = ${e.toString()};
export default _default_export_;`;
      } else {
        console.warn('invalid element', e);
        throw new Error('invalid element');
      }
    };
    const _formatArray = a => a.map(e => _formatElement(e)).join('\n');

    const id = getRandomString();
    const handlerId = getRandomString();
    const loadPromise = (async () => {
      await this.waitForLoad();
      const src = _formatArray(o);
      this.port.postMessage({
        method: 'registerHandler',
        id,
        handlerId,
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
              console.warn(error);
              reject(error);
            }
            this.port.removeEventListener('message', message);
          }
        };
        this.port.addEventListener('message', message);
      });
    })();
    
    const self = this;
    async function callRemoteFn(args = [], {
      signal = null,
    } = {}) {
      await loadPromise;

      const id = getRandomString();
      const _postMessage = () => {
        try {
          self.port.postMessage({
            method: 'callHandler',
            id,
            handlerId,
            args,
          });
        } catch(err) {
          console.warn('post message error', err);
          throw err;
        }
      };
      _postMessage();
      const result = await new Promise((accept, reject) => {
        const cleanups = [];
        const _cleanup = () => {
          for (const cleanupFn of cleanups) {
            cleanupFn();
          }
        };

        const message = e => {
          const {method, id: localId} = e.data;
          if (method === 'response' && localId === id) {
            const {error, result} = e.data;
            if (!error) {
              accept(result);
            } else {
              reject(error);
            }
            _cleanup();
          }
        };
        self.port.addEventListener('message', message);
        cleanups.push(() => {
          self.port.removeEventListener('message', message);
        });

        if (signal) {
          const abort = () => {
            // XXX we can post the abort to the worker process to make it stop faster
            reject(new Error('abort'));
            _cleanup();
          };
          signal.addEventListener('abort', abort);
          cleanups.push(() => {
            signal.removeEventListener('abort', abort);
          });
        }
      });
      return result;
    }
    return callRemoteFn;
  }
  destroy() {
    // this.live = false;
    
    if (this.iframe) {
      this.iframe.parentElement.removeChild(this.iframe);
      this.iframe = null;
    }
    if (this.port) {
      this.port.close();
      this.port = null;
    }
  }
}

export {
  OffscreenEngine,
};
