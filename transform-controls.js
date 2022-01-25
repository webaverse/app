import { camera, getRenderer, rootScene } from './renderer.js';
import game from './game.js';
import { TransformControls } from './TransformControls.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import cloneObject3D from './cloneObject3D.js';

const transformGizmoUrl = './assets/TransformGizmo2.glb';
let gizmoGltf = null;
const gltfLoader = new GLTFLoader();

const loadGizmoModel = async () => {
  if (gizmoGltf) {
    return Promise.resolve(gizmoGltf);
  }

  const gltf = await new Promise((resolve, reject) => {
    gltfLoader.load(transformGizmoUrl, (gltf) => {
      resolve(gltf);
      const model = cloneObject3D(gltf.scene);
      model.traverse(v => {
        if (v.material) {
          v.material.opacity *= 0.5;
        }
      })
      transformControls.create(camera, getRenderer().domElement, model);
      transformControls.controller.setSize(0.5);
    }, function onprogress() { }, reject);
  });

  gizmoGltf = gltf;

  return gizmoGltf;
}

const loadPromise = (async () => {
  await loadGizmoModel();
})();

// let binding = null;
const transformControls = {
  controller: null,
  waitForLoad() {
    return loadPromise;
  },
  create(camera, renderer, model) {
    if (!this.controller) {
      model.updateMatrixWorld(true);
      model.traverse(m => {
        if (m.material) {
          m.material.depthTest = false;
          m.material.depthWrite = false;
          m.material.fog = false;
        }
      });
      this.controller = new TransformControls(camera, renderer, model);
      rootScene.add(this.controller);
    }
  },

  handleMouseDown(raycaster) {
    this.controller._onPointerDown(raycaster)
  },

  handleMouseUp(raycaster) {
    this.controller._onPointerUp(raycaster)
  },

  handleMouseMove(raycaster) {
    if (!this.controller)
      return;

    this.controller._onPointerHover(raycaster)
    this.controller._onPointerMove(raycaster)
  },


  update() {
    this.controller.updateMatrixWorld(true);
    const mouseSelectedObject = game.getMouseSelectedObject();

    if (!mouseSelectedObject)
      this.controller.detach();

    if (this.controller.visible && this.controller.pointerDownHasAxis)
      return;

    this.enable = !!mouseSelectedObject && !game.contextMenu && !!this.controller
    if (!this.enable) {
      this.controller.detach();
      return
    }

    if (mouseSelectedObject === this.controller.object)
      return;

    this.controller.attach(mouseSelectedObject);

  },
};
export default transformControls;