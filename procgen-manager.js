import {murmurhash3} from './procgen/procgen.js';
import {DcWorkerManager} from './dc-worker-manager.js';
import {LodChunkTracker} from './lod.js';
import {defaultChunkSize} from './constants.js';

class ProcGenInstance {
  constructor(instance, {
    chunkSize,
  }) {
    this.chunkSize = chunkSize;

    const seed = typeof instance === 'string' ? murmurhash3(instance) : Math.floor(Math.random() * 0xFFFFFF);
    this.dcWorkerManager = new DcWorkerManager({
      chunkSize,
      seed,
      instance,
    });
    this.trackers = [];
  }
  getChunkTracker({
    numLods = 1,
    trackY = false,
    relod = false,
  } = {}) {
    const {chunkSize} = this;
    const tracker = new LodChunkTracker({
      chunkSize,
      numLods,
      trackY,
      relod,
    });
    this.trackers.push(tracker);
    tracker.addEventListener('destroy', e => {
      this.trackers.splice(this.trackers.indexOf(tracker), 1);
    });
    return tracker;
  }
}

class ProcGenManager {
  constructor({
    chunkSize = defaultChunkSize,
  } = {}) {
    this.instances = new Map();
    this.chunkSize = chunkSize;
  }
  getInstance(key) {
    let instance = this.instances.get(key);
    if (!instance) {
      instance = new ProcGenInstance(key, {
        chunkSize: this.chunkSize,
      });
      this.instances.set(key, instance);
    }
    return instance;
  }
}
const procGenManager = new ProcGenManager();
export default procGenManager;