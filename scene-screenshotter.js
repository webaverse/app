import * as THREE from 'three';
import {getRenderer} from './renderer.js';
// import {minFov} from './constants.js';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
const localVector4D = new THREE.Vector4();
// const localTriangle = new THREE.Triangle();
const localColor = new THREE.Color();

export function screenshotScene(scene, position, quaternion, worldResolution, ctx) {
  /* const colorRenderTarget = new THREE.WebGLRenderTarget(
    worldResolution,
    worldResolution,
    {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      // encoding: THREE.sRGBEncoding,
    }
  ); */
  const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 3000);
  camera.position.copy(position);
  camera.quaternion.copy(quaternion);
  camera.updateMatrixWorld();
  // window.camera = camera;
  // window.scene = scene;
  
  const renderer = getRenderer();
      
  // push old state
  // const oldRenderTarget = renderer.getRenderTarget();
  const oldViewport = renderer.getViewport(localVector4D);
  const oldClearColor = renderer.getClearColor(localColor);
  const oldClearAlpha = renderer.getClearAlpha();

  // render
  // renderer.setRenderTarget(colorRenderTarget);
  renderer.setViewport(0, 0, worldResolution, worldResolution);
  renderer.setClearColor(0x0000FF, 1);
  renderer.clear();
  renderer.render(scene, camera);
  // const p = createImageBitmap(renderer.domElement, 0, 0, worldResolution, worldResolution);

  // for (const ctx of contexts) {
    ctx.drawImage(
      renderer.domElement,
      0, renderer.domElement.height - worldResolution,
      worldResolution, worldResolution,
      0, 0,
      worldResolution, worldResolution
    );
  // }

  // pop old state
  // renderer.setRenderTarget(oldRenderTarget);
  renderer.setViewport(oldViewport);
  renderer.setClearColor(oldClearColor, oldClearAlpha);

  // return p;
}