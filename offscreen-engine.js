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
      await this.waitForLoad();
      await this.waitForTurn(async () => {
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

export {
  OffscreenEngine,
};