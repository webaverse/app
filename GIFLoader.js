import {makePromise} from './util.js';

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');

const cbs = {};
let nextId = 0;
class GIFLoader {
  constructor() {
    const worker = new Worker('./GIFLoader.worker.js', {
      type: 'module',
    });
    /* window.worker = worker;
    worker.addEventListener('load', e => {
      console.log('gif loader worker started');
      
      this.loadPromise.accept();
    }); */
    worker.addEventListener('error', e => {
      console.warn('worker error', e);
    });
    worker.addEventListener('message', e => {
      const {id, error, result} = e.data;
      const cb = cbs[id];
      if (cb) {
        delete cbs[id];
        cb(error, result);
      } else {
        console.warn('gif worker protocol violation: could not find callback: ', {id, keys: Object.keys(cbs)});
      }
    });
    this.worker = worker;
  }
  async createGif(url) {
    // await this.loadPromise;
    const id = ++nextId;
    // console.log('create gif', id);
    const p = makePromise();
    const cb = (err, result) => {
      if (!err) {
        p.accept(result);
      } else {
        p.reject(err);
      }
    };
    cbs[id] = cb;
    this.worker.postMessage({
      method: 'createGif',
      id,
      args: {
        url,
      },
    }, []);
    return await p;
  }
  async renderFrame(gifId) {
    // await this.loadPromise;
    const id = ++nextId;
    // console.log('create gif', id);
    const p = makePromise();
    const cb = (err, result) => {
      if (!err) {
        p.accept(result);
      } else {
        p.reject(err);
      }
    };
    cbs[id] = cb;
    this.worker.postMessage({
      method: 'renderFrame',
      id,
      args: {
        gifId,
      },
    }, []);
    return await p;
  }
  async renderFrames(gifId) {
    // await this.loadPromise;
    const id = ++nextId;
    // console.log('create gif', id);
    const p = makePromise();
    const cb = (err, result) => {
      if (!err) {
        p.accept(result);
      } else {
        p.reject(err);
      }
    };
    cbs[id] = cb;
    this.worker.postMessage({
      method: 'renderFrames',
      id,
      args: {
        gifId,
      },
    }, []);
    return await p;
  }
  async destroyGif(gifId) {
    // await this.loadPromise;
    const id = ++nextId;
    // console.log('create gif', id);
    const p = makePromise();
    const cb = (err, result) => {
      if (!err) {
        p.accept(result);
      } else {
        p.reject(err);
      }
    };
    cbs[id] = cb;
    this.worker.postMessage({
      method: 'destroyGif',
      id,
      args: {
        gifId,
      },
    }, []);
    return await p;
  }
  destroy() {
    this.worker.terminate();
    this.worker = null;
  }
}
export {
  GIFLoader,
};