/* this file implements the top-level world procedural generation context.
it starts the workers and routes calls for the procgen system. */

import {murmurhash3} from '@engine/procgen/procgen.js';
import {DcWorkerManager} from '@engine/procgen/dc-worker-manager.js';
import {LodChunkTracker} from '@engine/geometry/lod.js';
import {LightMapper} from '@engine/rendering/light-mapper.js';
import {HeightfieldMapper} from '@engine/procgen/heightfield-mapper.js';
import {defaultChunkSize} from '@engine/constants.js';

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
  getChunkTracker(opts = {}) {
    const opts2 = structuredClone(opts);
    const {chunkSize, range} = this;
    opts2.chunkSize = chunkSize;
    opts2.range = range;
    opts2.dcWorkerManager = this.dcWorkerManager;

    const tracker = new LodChunkTracker(opts2);
    return tracker;
  }
  getLightMapper({
    size,
    debug = false,
  }) {
    if (!this.lightmapper) {
      // const {chunkSize, range} = this;
      this.lightmapper = new LightMapper({
        // chunkSize,
        // terrainSize,
        // range,
        procGenInstance: this,
        size,
        debug,
      });
    }
    return this.lightmapper;
  }
  getHeightfieldMapper({
    size,
    debug = false,
  } = {}) {
    if (!this.heightfieldMapper) {
      this.heightfieldMapper = new HeightfieldMapper({
        procGenInstance: this,
        size,
        debug,
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