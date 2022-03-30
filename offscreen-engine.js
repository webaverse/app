import {getRandomString} from './util.js';
import {inappPreviewHost} from './constants.js';

class OffscreenEngine {
  constructor() {
    const id = getRandomString();

    const iframe = document.createElement('iframe');
    iframe.width = '0px';
    iframe.height = '0px';
    iframe.style.cssText = `\
      border: 0;
    `;
    iframe.src = `${inappPreviewHost}/engine.html#id=${id}`;
    document.body.appendChild(iframe);
    this.iframe = iframe;
    this.port = null;
    this.live = true;

    this.loadPromise = (async () => {
      await new Promise((resolve, reject) => {
        iframe.onload = () => {
          resolve();

          iframe.onload = null;
          iframe.onerror = null;
        };
        iframe.onerror = reject;
      });
      if (!this.live) return;

      const port = await new Promise((resolve, reject) => {
        const message = e => {
          if (e.data?.method === 'engineReady' && e.data.id === id && e.data.port instanceof MessagePort) {
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
              reject(error);
            }
            this.port.removeEventListener('message', message);
          }
        };
        this.port.addEventListener('message', message);
      });
    })();
    
    const self = this;
    async function callRemoteFn() {
      const args = Array.from(arguments);

      await loadPromise;

      const id = getRandomString();
      self.port.postMessage({
        method: 'callHandler',
        id,
        handlerId,
        args,
      });

      const result = await new Promise((accept, reject) => {
        const message = e => {
          const {method, id: localId} = e.data;
          if (method === 'response' && localId === id) {
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
      return result;
    }
    return callRemoteFn;
  }
  destroy() {
    this.live = false;
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