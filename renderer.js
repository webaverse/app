/*
this file contains tha main objects we use for rendering.
the purpose of this file is to hold these objects and to make sure they are correctly configured (e.g. handle canvas resize)
*/

import * as THREE from 'three';

let canvas = null, context = null, renderer = null;

function bindCanvas(c) {
  canvas = c;
  
  const rect = canvas.getBoundingClientRect();
  context = canvas && canvas.getContext('webgl2', {
    antialias: true,
    alpha: true,
    // preserveDrawingBuffer: false,
    xrCompatible: true,
  });
  renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    antialias: true,
    alpha: true,
    // preserveDrawingBuffer: false,
  });
  renderer.setSize(rect.width, rect.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClear = false;
  renderer.sortObjects = false;
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.gammaFactor = 2.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (!canvas) {
    canvas = renderer.domElement;
  }
  if (!context) {
    context = renderer.getContext();
  }
  context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
  renderer.xr.enabled = true;
}

function getRenderer() {
  return renderer;
}
function getContainerElement() {
  const canvas = renderer.domElement;
  const container = canvas.parentNode;
  return container;
}

const scene = new THREE.Scene();
const orthographicScene = new THREE.Scene();
const avatarScene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);
camera.rotation.order = 'YXZ';

const avatarCamera = camera.clone();
avatarCamera.near = 0.2;
avatarCamera.updateProjectionMatrix();

const dolly = new THREE.Object3D();
// fixes a bug: avatar glitching when dropped exactly at an axis
const epsilon = 0.000001;
dolly.position.set(epsilon, epsilon, epsilon);
dolly.add(camera);
dolly.add(avatarCamera);
scene.add(dolly);

const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
scene.add(orthographicCamera);

const sceneHighPriority = new THREE.Scene();
const sceneLowPriority = new THREE.Scene();

window.addEventListener('resize', e => {
  const renderer = getRenderer();
  if (renderer.xr.getSession()) {
    renderer.xr.isPresenting = false;
  }

  const containerElement = getContainerElement();
  const rect = containerElement.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);
  // renderer2.setSize(window.innerWidth, window.innerHeight);

  const aspect = rect.width / rect.height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  avatarCamera.aspect = aspect;
  avatarCamera.updateProjectionMatrix();
  
  if (renderer.xr.getSession()) {
    renderer.xr.isPresenting = true;
  }
});

/* addDefaultLights(scene, {
  shadowMap: true,
});
addDefaultLights(sceneHighPriority, {
  shadowMap: false,
});
addDefaultLights(sceneLowPriority, {
  shadowMap: false,
});
addDefaultLights(avatarScene, {
  shadowMap: false,
}); */

/* const renderer2 = new CSS3DRenderer();
renderer2.setSize(window.innerWidth, window.innerHeight);
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.top = 0;
if (canvas.parentNode) {
  document.body.insertBefore(renderer2.domElement, canvas);
} */

export {
  // AppManager,
  bindCanvas,
  getRenderer,
  getContainerElement,
  scene,
  orthographicScene,
  avatarScene,
  camera,
  orthographicCamera,
  avatarCamera,
  dolly,
  /*orbitControls, renderer2,*/
  sceneHighPriority,
  sceneLowPriority,
  // iframeContainer,
  // iframeContainer2,
  // appManager,
};