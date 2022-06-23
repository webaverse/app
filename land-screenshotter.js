import * as THREE from 'three';
import {getRenderer} from './renderer.js';

//

const fov = 30;
const zoomFactor = 1.9;

//

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localColor = new THREE.Color();

//

const _addPreviewLights = scene => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 3);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(1, 2, 3);
  directionalLight.updateMatrixWorld();
  scene.add(directionalLight);
};

const sideScene = new THREE.Scene();
sideScene.autoUpdate = false;
_addPreviewLights(sideScene);
const sideCamera = new THREE.PerspectiveCamera(fov);

export const screenshotLandApp = async ({
  app,
  range,
  width = 300,
  height = 300,
  clearColor = 0xFFFFFF,
  clearAlpha = 1,
} = {}) => {
  const renderer = getRenderer();
  const size = renderer.getSize(localVector2D);
  const pixelRatio = renderer.getPixelRatio();

  const writeCanvas = document.createElement('canvas');
  writeCanvas.width = width;
  writeCanvas.height = height;
  const writeCtx = writeCanvas.getContext('2d');

  {
    // push old state
    const oldViewport = renderer.getViewport(localVector4D);
    const oldClearColor = renderer.getClearColor(localColor);
    const oldClearAlpha = renderer.getClearAlpha();

    // push parent
    const originalParent = app.parent;
    sideScene.add(app);
    sideScene.updateMatrixWorld();

    // clear
    renderer.setClearColor(clearColor, clearAlpha);
    renderer.clear();

    // render
    const _render = () => {
      // const angle = (i / numFrames) * Math.PI * 2;
      const rangeSize = range.getSize(localVector);
      sideCamera.position.copy(range.min)
        .add(range.max)
        .divideScalar(2)
        .add(
          localVector2.set(zoomFactor, zoomFactor, zoomFactor)
            .multiply(rangeSize)
        );
      sideCamera.lookAt(
        localVector2.copy(range.min)
          .add(range.max)
          .divideScalar(2)
      );
      // sideCamera.position.y -= zoomFactor * rangeSize.y * 0.07;
      // console.log('got size', localVector2.toArray().join(','));
      // fitCameraToBoundingBox(sideCamera, range, 1.2);
      sideCamera.updateMatrixWorld();
      
      // render side scene
      renderer.setViewport(0, 0, width, height);
      // renderer.clear();
      renderer.render(sideScene, sideCamera);

      // copy to canvas
      writeCtx.clearRect(0, 0, width, height);
      writeCtx.drawImage(
        renderer.domElement,
        0,
        size.y * pixelRatio - height * pixelRatio,
        width * pixelRatio,
        height * pixelRatio,
        0,
        0,
        width,
        height
      );
      // writeCtx.drawImage(renderer.domElement, 0, 0);
    };
    _render();

    // pop parent
    if (originalParent) {
      originalParent.add(app);
    } else {
      sideScene.remove(app);
    }

    // pop old state
    renderer.setViewport(oldViewport);
    renderer.setClearColor(oldClearColor, oldClearAlpha);
  }

  return writeCanvas;
};