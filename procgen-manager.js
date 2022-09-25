/* this file implements the top-level world procedural generation context.
it starts the workers and routes calls for the procgen system. */

import {murmurhash3} from './procgen/procgen.js';
import {PGWorkerManager} from './pg-worker-manager.js';
import {LodChunkTracker} from './lod.js';
import {defaultChunkSize} from './constants.js';

//

const localArray2D = Array(2);

//

class ProcGenInstance {
  constructor(instance, {
    chunkSize,
  }) {
    this.chunkSize = chunkSize;

    const seed = typeof instance === 'string' ? murmurhash3(instance) : Math.floor(Math.random() * 0xFFFFFF);
    this.pgWorkerManager = new PGWorkerManager({
      chunkSize,
      seed,
      instance,
    });

    // this.lightmapper = null;
    // this.heightfieldMapper = null;
  }
  setCamera(worldPosition, cameraPosition, cameraQuaternion, projectionMatrix) {
    this.pgWorkerManager.setCamera(worldPosition, cameraPosition, cameraQuaternion, projectionMatrix);
  }
  setClipRange() {
    this.pgWorkerManager.setClipRange(range);
  }
  async createLodChunkTracker(opts = {}) {
    await this.pgWorkerManager.waitForLoad();

    const opts2 = structuredClone(opts);
    const {chunkSize} = this;
    opts2.chunkSize = chunkSize;
    // opts2.range = range;
    opts2.pgWorkerManager = this.pgWorkerManager;

    const tracker = new LodChunkTracker(opts2);
    return tracker;
  }
  async generateChunk(position, lod, lodArray, generateFlags, {signal} = {}) {
    await this.pgWorkerManager.waitForLoad();

    position.toArray(localArray2D);
    const result = await this.pgWorkerManager.generateChunk(localArray2D, lod, lodArray, generateFlags, {signal});
    return result;
  }
  async generateVegetation(position, lod, numInstances, {signal} = {}) {
    await this.pgWorkerManager.waitForLoad();

    position.toArray(localArray2D);
    const result = await this.pgWorkerManager.generateVegetation(localArray2D, lod, numInstances, {signal});
    return result;
  }
  async generateGrass(position, lod, numInstances, {signal} = {}) {
    await this.pgWorkerManager.waitForLoad();

    position.toArray(localArray2D);
    const result = await this.pgWorkerManager.generateGrass(localArray2D, lod, numInstances, {signal});
    return result;
  }
  /* async getLightMapper({
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
  async getHeightfieldMapper({
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
      const {chunkSize} = this;
      instance = new ProcGenInstance(key, {
        chunkSize,
      });
      this.instances.set(key, instance);
    }
    return instance;
  }
  getNodeHash(node) {
    return (node.min.x << 16) |
      (node.min.y & 0xFFFF);
  }
}
const procGenManager = new ProcGenManager();
export default procGenManager;