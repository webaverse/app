import {murmurhash3} from './procgen/procgen.js';
import {DcWorkerManager} from './dc-worker-manager.js';
import {LodChunkTracker} from './lod.js';
import {LightMapper} from './light-mapper.js';
import {defaultChunkSize} from './constants.js';
// import {getLocalPlayer} from './players.js';

const chunkSize = defaultChunkSize;
const terrainWidthInChunks = 4;
const terrainSize = chunkSize * terrainWidthInChunks;

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
    this.range = null;

    this.lightmapper = null;
  }
  setRange(range) {
    this.dcWorkerManager.setRange(range);
    this.range = range.clone();
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
    if (this.range) {
      tracker.setRange(this.range);
    }
    return tracker;
  }
  getLightMapper() {
    if (!this.lightmapper) {
      const {chunkSize} = this;
      this.lightmapper = new LightMapper({
        chunkSize,
        terrainSize,
      });
    }
    return this.lightmapper;
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
  /* update() {
    for (const instance of this.instances.values()) {
      instance.update();
    }
  } */
}
const procGenManager = new ProcGenManager();
export default procGenManager;