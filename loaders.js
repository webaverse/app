/*
this file contains common file format loaders which are re-used throughout the engine and userspace apps.
*/

// import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {getRenderer} from './renderer.js';
import {ShadertoyLoader} from './shadertoy.js';
import {GIFLoader} from './GIFLoader.js';
import {VOXLoader} from './VOXLoader.js';
import {memoize} from './util.js';

class MozLightMapExtension {
  constructor(parser) {
    this.parser = parser;
    this.name = 'MOZ_lightmap';
  }

  // @TODO: Ideally we should use extendMaterialParams hook.
  //        But the current official glTF loader doesn't fire extendMaterialParams
  //        hook for unlit and specular-glossiness materials.
  //        So using loadMaterial hook as workaround so far.
  //        Cons is loadMaterial hook is fired as _invokeOne so
  //        if other plugins defining loadMaterial is registered
  //        there is a chance that this light map extension handler isn't called.
  //        The glTF loader should be updated to remove the limitation.
  loadMaterial(materialIndex) {
    const parser = this.parser;
    const json = parser.json;
    const materialDef = json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return null;
    }

    const extensionDef = materialDef.extensions[this.name];

    const pending = [];

    pending.push(parser.loadMaterial(materialIndex));
    pending.push(parser.getDependency('texture', extensionDef.index));

    return Promise.all(pending).then(results => {
      const material = results[0];
      const lightMap = results[1];
      material.lightMap = lightMap;
      material.lightMapIntensity = extensionDef.intensity !== undefined ? extensionDef.intensity : 1;
      return material;
    });
  }
}

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
const _meshoptDecoder = memoize(() => {
  return MeshoptDecoder;
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
  {
    const meshoptDecoder = _meshoptDecoder();
    gltfLoader.setMeshoptDecoder(meshoptDecoder);
  }

  gltfLoader.register(parser => new MozLightMapExtension(parser));

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
  get meshoptDecoder() {
    return _meshoptDecoder();
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
