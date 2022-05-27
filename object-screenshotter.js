import * as THREE from 'three';
import {getRenderer} from './renderer.js';
import metaversefile from 'metaversefile';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {world} from './world.js';
import {fitCameraToBoundingBox} from './util.js';
// import {Text} from 'troika-three-text';
// import {defaultDioramaSize} from './constants.js';
// import postProcessing from './post-processing.js';
// import gradients from './gradients.json';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
// const localVector2D2 = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localColor = new THREE.Color();
const localMatrix = new THREE.Matrix4();

// const defaultSize = 2048;
// const defaultNumFrames = 128;

export const screenshotObjectUrl = async ({
  start_url,
  width = 300,
  height = 300,
  canvas
}) => {
  const app = await metaversefile.createAppAsync({
    start_url,
  });
  return await screenshotObjectApp({
    app,
    width,
    height,
    canvas
  });
};

const _addPreviewLights = scene => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 2, 3);
  directionalLight.updateMatrixWorld();
  scene.add(directionalLight);
};

const sideScene = new THREE.Scene();
sideScene.autoUpdate = false;
_addPreviewLights(sideScene);
const sideCamera = new THREE.PerspectiveCamera();

/* const _makeSpritesheetRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping,
}); */
export const screenshotObjectApp = async ({
  app,
  width,
  height,
  clearColor = 0xFFFFFF,
  clearAlpha = 1,
  canvas
} = {}) => {
  // const {devicePixelRatio: pixelRatio} = window;

  // console.log('create object sprite', app, size, numFrames);

  if (canvas && (width || height)) {

    throw( 'screenshotObjectApp method should receive only "canvas" or "width"/"height" arguments and not both.' );

  }

  if (!canvas && (!width || !height)) {

    throw( 'screenshotObjectApp method should receive at least "canvas" or "width"/"height" arguments.' );

  }

  const renderer = getRenderer();
  const size = renderer.getSize(localVector2D);
  const pixelRatio = renderer.getPixelRatio();

  // const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
  // const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
  // const frameSize = size / numFramesPerRow;

  const writeCanvas = canvas ?? document.createElement('canvas');

  if (!canvas) {

    writeCanvas.width = width ?? 80;
    writeCanvas.height = height ?? 80;

  } else {

    width = writeCanvas.width;
    height = writeCanvas.height;

  }

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
      sideCamera.position.copy(app.position)
        .add(
          localVector.set(0, 0, 1)
            .applyQuaternion(app.quaternion)
            .multiplyScalar(2)
        );

      const physicsObjects = app.getPhysicsObjects();
      if (physicsObjects.length > 0) {
        const physicsObject = physicsObjects[0];
        const {physicsMesh} = physicsObject;
        fitCameraToBoundingBox(sideCamera, physicsMesh.geometry.boundingBox, 1.2);
      } else {
        sideCamera.quaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            sideCamera.position,
            app.position,
            localVector2.set(0, 1, 0)
          )
        );
      }
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
