/*
this file contains the main objects we use for rendering.
the purpose of this file is to hold these objects and to make sure they are correctly configured (e.g. handle canvas resize)
*/

import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {makePromise} from './util.js';
import {minFov} from './constants.js';

// XXX enable this when the code is stable; then, we will have many more places to add missing matrix updates
// THREE.Object3D.DefaultMatrixAutoUpdate = false;

let canvas = null, context = null, renderer = null, composer = null;

let waitPromise = makePromise();
const waitForLoad = () => waitPromise;

function bindCanvas(c) {
  // initialize renderer
  canvas = c;
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
    rendererExtensionFragDepth: true,
    logarithmicDepthBuffer: true,
  });

  const rect = renderer.domElement.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClear = false;
  renderer.sortObjects = false;
  renderer.physicallyCorrectLights = true;
  renderer.info.autoReset = false;
  // renderer.outputEncoding = THREE.sRGBEncoding;
  // renderer.gammaFactor = 2.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (!canvas) {
    canvas = renderer.domElement;
  }
  if (!context) {
    context = renderer.getContext();
  }
  // context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
  renderer.xr.enabled = true;

  // initialize post-processing
  {
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();
    const encoding = THREE.sRGBEncoding;
    const renderTarget = new THREE.WebGLMultisampleRenderTarget(size.x * pixelRatio, size.y * pixelRatio, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      encoding,
    });
    renderTarget.samples = context.MAX_SAMPLES;
    composer = new EffectComposer(renderer, renderTarget);
  }

  waitPromise.accept();
}

function getRenderer() {
  return renderer;
}
function getContainerElement() {
  const canvas = renderer.domElement;
  const container = canvas.parentNode;
  return container;
}

function getComposer() {
  return composer;
}


const scene = new THREE.Object3D();
scene.name = 'scene';
const sceneHighPriority = new THREE.Object3D();
sceneHighPriority.name = 'highPriorioty';
const sceneLowPriority = new THREE.Object3D();
sceneLowPriority.name = 'lowPriorioty';
const rootScene = new THREE.Scene();
rootScene.name = 'root';
rootScene.autoUpdate = false;
const postSceneOrthographic = new THREE.Scene();
postSceneOrthographic.name = 'postOrthographic';
const postScenePerspective = new THREE.Scene();
postScenePerspective.name = 'postPerspective';
rootScene.add(sceneHighPriority);
rootScene.add(scene);
rootScene.add(sceneLowPriority);

// const orthographicScene = new THREE.Scene();
// const avatarScene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(minFov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0);
camera.rotation.order = 'YXZ';
camera.name = 'sceneCamera';
/* const avatarCamera = camera.clone();
avatarCamera.near = 0.2;
avatarCamera.updateProjectionMatrix(); */

const dolly = new THREE.Object3D();
// fixes a bug: avatar glitching when dropped exactly at an axis
const epsilon = 0.000001;
dolly.position.set(epsilon, epsilon, epsilon);
dolly.add(camera);
// dolly.add(avatarCamera);
scene.add(dolly);

const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
// scene.add(orthographicCamera);

window.addEventListener('resize', e => {
  const renderer = getRenderer();
  if (renderer) {
    if (renderer.xr.getSession()) {
      renderer.xr.isPresenting = false;
    }

    const containerElement = getContainerElement();
    const {width, height} = containerElement.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio;
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    // renderer2.setSize(window.innerWidth, window.innerHeight);

    const aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    // avatarCamera.aspect = aspect;
    // avatarCamera.updateProjectionMatrix();
    
    if (renderer.xr.getSession()) {
      renderer.xr.isPresenting = true;
    }

    const composer = getComposer();
    if (composer) {
      composer.setSize(width, height);
      composer.setPixelRatio(pixelRatio);
    }
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
  waitForLoad,
  // AppManager,
  bindCanvas,
  getRenderer,
  getContainerElement,
  getComposer,
  scene,
  rootScene,
  postSceneOrthographic,
  postScenePerspective,
  // avatarScene,
  camera,
  orthographicCamera,
  // avatarCamera,
  dolly,
  /*orbitControls, renderer2,*/
  sceneHighPriority,
  sceneLowPriority,
  // iframeContainer,
  // iframeContainer2,
  // appManager,
};
