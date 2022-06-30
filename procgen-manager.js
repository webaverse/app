/* this file implements the top-level world procedural generation context.
it starts the workers and routes calls for the procgen system. */

import {murmurhash3} from './procgen/procgen.js';
import {DcWorkerManager} from './dc-worker-manager.js';
import {LodChunkTracker} from './lod.js';
import {LightMapper} from './light-mapper.js';
import {HeightfieldMapper} from './heightfield-mapper.js';
import {defaultChunkSize} from './constants.js';

const chunkSize = defaultChunkSize;
const terrainWidthInChunks = 4;
const terrainSize = chunkSize * terrainWidthInChunks;

class ProcGenInstance {
  constructor(instance, {
    chunkSize,
    range,
  }) {
    this.chunkSize = chunkSize;

    const seed = typeof instance === 'string' ? murmurhash3(instance) : Math.floor(Math.random() * 0xFFFFFF);
    this.dcWorkerManager = new DcWorkerManager({
      chunkSize,
      seed,
      instance,
    });
    this.range = range;

    this.lightmapper = null;
    this.heightfieldMapper = null;

    if (range) {
      this.dcWorkerManager.setClipRange(range);
    }
  }
  getChunkTracker({
    numLods = 1,
    trackY = false,
    relod = false,
    debug = false,
  } = {}) {
    const {chunkSize, range} = this;
    const tracker = new LodChunkTracker({
      chunkSize,
      numLods,
      trackY,
      relod,
      range,
      debug,
    });
    return tracker;
  }
  getLightMapper() {
    if (!this.lightmapper) {
      const {chunkSize, range} = this;
      this.lightmapper = new LightMapper({
        chunkSize,
        terrainSize,
        range,
      });
    }
    return this.lightmapper;
  }
  getHeightfieldMapper() {
    if (!this.heightfieldMapper) {
      const {chunkSize, range} = this;
      this.heightfieldMapper = new HeightfieldMapper({
        chunkSize,
        terrainSize,
        range,
      });
    }
    return this.heightfieldMapper;
  }
}

class ProcGenManager {
  constructor({
    chunkSize = defaultChunkSize,
  } = {}) {
    this.instances = new Map();
    this.chunkSize = chunkSize;
  }
  getInstance(key, range) {
    let instance = this.instances.get(key);
    if (!instance) {
      const {chunkSize} = this;
      instance = new ProcGenInstance(key, {
        chunkSize,
        range,
      });
      this.instances.set(key, instance);
    }
    return instance;
  }
}
const procGenManager = new ProcGenManager();
export default procGenManager;