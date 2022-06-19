import {murmurhash3} from './procgen/procgen.js';
import {DcWorkerManager} from './dc-worker-manager.js';
import {LodChunkTracker} from './lod.js';
import {defaultChunkSize} from './constants.js';
// import {getLocalPlayer} from './players.js';

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
    // this.trackers = [];
  }
  setRange(range) {
    this.dcWorkerManager.setRange(range);
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
    /* this.trackers.push(tracker);
    tracker.addEventListener('destroy', e => {
      this.trackers.splice(this.trackers.indexOf(tracker), 1);
    }); */
    return tracker;
  }
  /* update() {
    const localPlayer = getLocalPlayer();
    for (const tracker of this.trackers) {
      tracker.update(localPlayer.position);
    }
  } */
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
  /* update() {
    for (const instance of this.instances.values()) {
      instance.update();
    }
  } */
}
const procGenManager = new ProcGenManager();
export default procGenManager;