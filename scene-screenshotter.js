import * as THREE from 'three';
import {getRenderer} from './renderer.js';
import {minFov} from './constants.js';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
const localVector4D = new THREE.Vector4();
// const localTriangle = new THREE.Triangle();

/* const cameraNear = 0;
const cameraFar = 1000;
const cameraHeight = 30; */

export async function screenshotScene(scene, position, quaternion, worldResolution) {
  const colorRenderTarget = new THREE.WebGLRenderTarget(
    worldResolution,
    worldResolution,
    {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      // encoding: THREE.sRGBEncoding,
    }
  );
  const aspect = 1;
  const camera = new THREE.PerspectiveCamera(minFov, aspect, 0.1, 30000);
  camera.position.copy(position);
  camera.quaternion.copy(quaternion);
  camera.updateMatrixWorld();
  
  const renderer = getRenderer();
      
  // push old state
  const oldRenderTarget = renderer.getRenderTarget();
  const oldViewport = renderer.getViewport(localVector4D);

  // render
  renderer.setRenderTarget(colorRenderTarget);
  renderer.setViewport(0, 0, worldResolution, worldResolution);
  renderer.render(scene, camera);

  // pop old state
  renderer.setRenderTarget(oldRenderTarget);
  renderer.setViewport(oldViewport);

  return renderTarget.texture;
}