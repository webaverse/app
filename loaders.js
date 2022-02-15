/*
this file contains common file format loaders which are re-used throughout the engine and userspace apps.
*/

// import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';
import {getRenderer} from './renderer.js';
import {ShadertoyLoader} from './shadertoy.js';
import {GIFLoader} from './GIFLoader.js';
import {VOXLoader} from './VOXLoader.js';
import {memoize} from './util.js';

const _dracoLoader = memoize(() => {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/three/draco/');
  return dracoLoader;
});
const _ktx2Loader = memoize(() => {
  const ktx2Loader = new KTX2Loader();
  ktx2Loader.load = (_load => function load() {
    if (!this.workerConfig) {
      const renderer = getRenderer();
      this.detectSupport(renderer);
    }
    return _load.apply(this, arguments);
  })(ktx2Loader.load);
  ktx2Loader.setTranscoderPath('/three/basis/');
  return ktx2Loader;
});
const _gltfLoader = memoize(() => {
  const gltfLoader = new GLTFLoader();
  {
    const dracoLoader = _dracoLoader();
    gltfLoader.setDRACOLoader(dracoLoader);
  }
  {
    const ktx2Loader = _ktx2Loader();
    gltfLoader.setKTX2Loader(ktx2Loader);
  }
  return gltfLoader;
});
const _shadertoyLoader = memoize(() => new ShadertoyLoader());
const _gifLoader = memoize(() => new GIFLoader());
const _voxLoader = memoize(() => new VOXLoader({
  scale: 0.01,
}));

const loaders = {
  get dracoLoader() {
    return _dracoLoader();
  },
  get ktx2Loader() {
    return _ktx2Loader();
  },
  get gltfLoader() {
    return _gltfLoader();
  },
  get shadertoyLoader() {
    return _shadertoyLoader();
  },
  get gifLoader() {
    return _gifLoader();
  },
  get voxLoader() {
    return _voxLoader();
  },
};
export default loaders;