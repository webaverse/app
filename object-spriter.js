import * as THREE from 'three';
import {getRenderer, scene} from './renderer.js';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {world} from './world.js';
import {fitCameraToBoundingBox} from './util.js';
// import {Text} from 'troika-three-text';
// import {defaultDioramaSize} from './constants.js';
// import postProcessing from './post-processing.js';
// import gradients from './gradients.json';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();

const defaultSize = 2048;
const defaultNumFrames = 128;

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

const _makeSpritesheetRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
const createObjectSprite = async (app, {
  // canvas,
  size = defaultSize,
  numFrames = defaultNumFrames,
} = {}) => {
  // const {devicePixelRatio: pixelRatio} = window;

  // console.log('create object sprite', app, size, numFrames);

  const renderer = getRenderer();
  // const size = renderer.getSize(localVector2D);
  const pixelRatio = renderer.getPixelRatio();

  const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
  const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
  const frameSize = size / numFramesPerRow;

  // create render target
  const renderTarget = _makeSpritesheetRenderTarget(size * pixelRatio, size * pixelRatio);

  // push old state
  const oldRenderTarget = renderer.getRenderTarget();
  const oldViewport = renderer.getViewport(localVector4D);
  
  {
    /* const originalPosition = app.position.clone();
    const originalQuaternion = app.quaternion.clone();
    const originalScale = app.scale.clone();
    const originalMatrix = app.matrix.clone();
    const originalMatrixWorld = app.matrixWorld.clone(); */

    const originalParent = app.parent;
    sideScene.add(app);
    sideScene.updateMatrixWorld();

    for (let i = 0; i < numFrames; i++) {
      const y = Math.floor(i / numFramesPerRow);
      const x = i - y * numFramesPerRow;
    
      // set up side camera
      const angle = (i / numFrames) * Math.PI * 2;
      sideCamera.position.copy(app.position)
        .add(
          localVector.set(Math.cos(angle), 0, Math.sin(angle))
            .applyQuaternion(app.quaternion)
            .multiplyScalar(2)
        );

      const physicsObjects = app.getPhysicsObjects();
      if (physicsObjects.length > 0) {
        const physicsObject = physicsObjects[0];
        const {physicsMesh} = physicsObject;
        fitCameraToBoundingBox(sideCamera, physicsMesh.geometry.boundingBox, 1);
      } else {
        sideCamera.quaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            sideCamera.position,
            app.position,
            localVector2.set(0, 1, 0)
          )
        );
      }
      console.log('render position', sideCamera.position.toArray(), app.position.toArray());
      sideCamera.updateMatrixWorld();
      
      // render side scene
      renderer.setRenderTarget(renderTarget);
      renderer.setViewport(x*frameSize, y*frameSize, frameSize, frameSize);
      // console.log('render', {x, y, frameSize, numFrames, numFramesPerRow});
      // renderer.clear();
      renderer.render(sideScene, sideCamera);
  
      /* for (const canvas of canvases) {
        const {width, height, ctx} = canvas;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(
          renderer.domElement,
          0,
          size.y * pixelRatio - this.height * pixelRatio,
          this.width * pixelRatio,
          this.height * pixelRatio,
          0,
          0,
          width,
          height
        );
      } */
    }

    originalParent && originalParent.add(app);
    /* app.position.copy(originalPosition);
    app.quaternion.copy(originalQuaternion);
    app.scale.copy(originalScale);
    app.matrix.copy(originalMatrix);
    app.matrixWorld.copy(originalMatrixWorld); */
  }

  // pop old state
  renderer.setRenderTarget(oldRenderTarget);
  renderer.setViewport(oldViewport);

  return {
    texture: renderTarget.texture,
    numFrames,
    frameSize,
    numFramesPerRow,
  };
};

export {
  createObjectSprite,
};