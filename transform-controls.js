import {scene} from './app-object.js';
import TransformGizmo from './TransformGizmo.js';
import {capitalize} from './util.js';

let transformGizmo = null;
const loadPromise = (async () => {
  await TransformGizmo.load();

  transformGizmo = new TransformGizmo();
  // transformGizmo.setTransformMode('Translate');
  scene.add(transformGizmo);
})();

const transformControls = {
  setTransformMode(transformMode) {
    transformGizmo.setTransformMode(capitalize(transformMode));
  },
  getTransformMode() {
    return transformGizmo.transformMode.toLowerCase();
  },
  waitForLoad() {
    return loadPromise;
  },
};
export default transformControls;