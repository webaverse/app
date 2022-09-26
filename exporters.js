import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {memoize} from './util.js';

const _gltfExporter = memoize(() => {
  const gltfExporter = new GLTFExporter();
  return gltfExporter;
});

const exporters = {
  get gltfExporter() {
    return _gltfExporter();
  },
};
export default exporters;
