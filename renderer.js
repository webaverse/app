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
    // logarithmicDepthBuffer: true,
  });
  
  const {
    width,
    height,
    pixelRatio,
  } = _getCanvasDimensions();
  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);

  renderer.autoClear = false;
  renderer.sortObjects = false;
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.gammaFactor = 2.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;

  // initialize post-processing
  const renderTarget = new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    encoding: THREE.sRGBEncoding,
  });
  renderTarget.name = 'effectComposerRenderTarget';
  renderTarget.samples = context.MAX_SAMPLES; // XXX make this based on the antialiasing settings
  composer = new EffectComposer(renderer, renderTarget);

  // initialize camera
  _setCameraSize(width, height, pixelRatio);

  // resolve promise
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

const scene = new THREE.Scene();
scene.name = 'scene';
const sceneHighPriority = new THREE.Scene();
sceneHighPriority.name = 'highPriorioty';
const sceneLowPriority = new THREE.Scene();
sceneLowPriority.name = 'lowPriorioty';
const sceneLowerPriority = new THREE.Scene();
sceneLowerPriority.name = 'lowerPriorioty';
const sceneLowestPriority = new THREE.Scene();
sceneLowestPriority.name = 'lowestPriorioty';
const rootScene = new THREE.Scene();
rootScene.name = 'root';
rootScene.autoUpdate = false;
// const postSceneOrthographic = new THREE.Scene();
// postSceneOrthographic.name = 'postOrthographic';
// const postScenePerspective = new THREE.Scene();
// postScenePerspective.name = 'postPerspective';
rootScene.add(sceneHighPriority);
rootScene.add(scene);
rootScene.add(sceneLowPriority);
rootScene.add(sceneLowerPriority);
rootScene.add(sceneLowestPriority);

// const orthographicScene = new THREE.Scene();
// const avatarScene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(minFov, 1, 0.1, 10000);
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

// const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
// scene.add(orthographicCamera);

const _getCanvasDimensions = () => {
  let width, height, pixelRatio;
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio = window.devicePixelRatio;
  
  return {
    width,
    height,
    pixelRatio,
  };
};

const _setSizes = () => {
  const {
    width,
    height,
    pixelRatio,
  } = _getCanvasDimensions();
  _setRendererSize(width, height, pixelRatio);
  _setComposerSize(width, height, pixelRatio);
  _setCameraSize(width, height, pixelRatio);
};

const _setRendererSize = (width, height, pixelRatio) => {
  const renderer = getRenderer();
  if (renderer) {
    // pause XR since it gets in the way of resize
    if (renderer.xr.getSession()) {
      renderer.xr.isPresenting = false;
    }

    /* const {
      width,
      height,
      pixelRatio,
    } = _getCanvasDimensions(); */
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);

    // resume XR
    if (renderer.xr.getSession()) {
      renderer.xr.isPresenting = true;
    }
  }
};
const _setComposerSize = (width, height, pixelRatio) => {
  const composer = getComposer();
  if (composer) {
    composer.setSize(width, height);
    composer.setPixelRatio(pixelRatio);
  }
};
const _setCameraSize = (width, height, pixelRatio) => {
  const aspect = width / height;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
};

window.addEventListener('resize', e => {
  _setSizes();
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
  // postSceneOrthographic,
  // postScenePerspective,
  // avatarScene,
  camera,
  // orthographicCamera,
  // avatarCamera,
  dolly,
  /*orbitControls, renderer2,*/
  sceneHighPriority,
  sceneLowPriority,
  sceneLowerPriority,
  sceneLowestPriority,
  // iframeContainer,
  // iframeContainer2,
  // appManager,
};
