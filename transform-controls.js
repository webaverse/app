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

let binding = null;
const transformControls = {
  waitForLoad() {
    return loadPromise;
  },
  setTransformMode(transformMode) {
    transformGizmo.setTransformMode(capitalize(transformMode));
  },
  getTransformMode() {
    return transformGizmo.transformMode.toLowerCase();
  },
  bind(o) {
    if (o) {
      transformGizmo.position.copy(o.position);
      transformGizmo.quaternion.copy(o.quaternion);
      transformGizmo.scale.copy(o.scale);
    }
    binding = o;
  },
  update() {
    if (binding) {
      binding.position.copy(transformGizmo.position);
      binding.quaternion.copy(transformGizmo.quaternion);
      binding.scale.copy(transformGizmo.scale);
    }
  },
};
export default transformControls;