import * as THREE from 'three';
import { camera, getRenderer, rootScene, scene, sceneLowPriority } from './renderer.js';
import game from './game.js';
import { capitalize } from './util.js';
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
      transformControls.create(camera, getRenderer().domElement, cloneObject3D(gltf.scene));
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
    this.controller._onPointerHover(raycaster)
    this.controller._onPointerMove(raycaster)
  },


  update() {
    const mouseSelectedObject = game.getMouseSelectedObject();
    this.controller.updateMatrixWorld(true);
    if (this.controller.pointerDownHasAxis)
      return

    this.enable = !!mouseSelectedObject && !game.contextMenu && this.controller;
    if (!this.enable)
      return

    if (mouseSelectedObject === this.object)
      return;

    this.controller.attach(mouseSelectedObject);

  },
};
export default transformControls;