import {murmurhash3} from './procgen/procgen.js';
import {defaultChunkSize} from './constants.js';
import {DcWorkerManager} from './dc-worker-manager.js';

class ProcGenInstance {
  constructor(instance) { 
    const seed = typeof instance === 'string' ? murmurhash3(instance) : Math.floor(Math.random() * 0xFFFFFF);
    this.dcWorkerManager = new DcWorkerManager({
      chunkSize: defaultChunkSize,
      seed,
      instance,
    });
  }
}

class ProcGenManager {
  constructor() {
    this.instances = new Map();
    this.chunkSize = defaultChunkSize;
  }
  getInstance(key) {
    let instance = this.instances.get(key);
    if (!instance) {
      instance = new ProcGenInstance(key);
      this.instances.set(key, instance);
    }
    return instance;
  }
}
const procGenManager = new ProcGenManager();
export default procGenManager;