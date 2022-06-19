// import * as THREE from 'three';
// import {makeId} from './util.js';
import {defaultChunkSize} from './constants.js';
// import metaversefile from 'metaversefile';
// import { terrainVertex, terrainFragment } from './shaders/terrainShader.js';
// import physics from './physics-manager.js';
import {DcWorkerManager} from './dc-worker-manager.js';
// import {GeometryAllocator} from './instancing.js';

// const localVector = new THREE.Vector3();

const numWorkers = 4;

class ProcGenInstance {
  constructor(instance) {
    this.dcWorkerManager = new DcWorkerManager({
      chunkSize: defaultChunkSize,
      seed: Math.floor(Math.random() * 0xFFFFFF),
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