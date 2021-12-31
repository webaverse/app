/*
this file contains the main objects we use for rendering.
the purpose of this file is to hold these objects and to make sure they are correctly configured (e.g. handle canvas resize)
*/

import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {minFov} from './constants.js';
import {init, vec3, mat4 } from 'glmw';

window.THREE = THREE;
window.mat4 = mat4

init().then((ready) => {
  // glmw is now ready and can be used anywhere

  // const a = vec3.create();
  // const b = vec3.fromValues(1.0, 2.0, 3.0);
  // vec3.add(a, a, b);
  // console.log(vec3.view(a)); // Float32Array(3) [1, 2, 3]
  
  window.isLogAverageTime = false
  let totalTime = 0
  let averageTime = 0
  let count = 0
  THREE.Matrix4.prototype.multiplyMatrices = (function () {
    // var cachedFunction = THREE.Matrix4.prototype.multiplyMatrices

    const mat4a = mat4.create();
    const mat4b = mat4.create();
    const mat4c = mat4.create();
    const mat4aView = mat4.view(mat4a);
    const mat4bView = mat4.view(mat4b);
    const mat4cView = mat4.view(mat4c);
    let ae;
    let be;
    // let c;

    let startTime;

    return function () {
      // your code
      // if (window.isLogAverageTime) startTime = performance.now()
      // return this

      // var result = cachedFunction.apply(this, arguments) // use .apply() to call it

      // more of your code
      // ae = arguments[0].elements;
      // be = arguments[1].elements;
      mat4aView.set(arguments[0].elements)
      mat4bView.set(arguments[1].elements)

      // poor performance
      // mat4aView[0] = ae[0]
      // mat4aView[1] = ae[1]
      // mat4aView[2] = ae[2]
      // mat4aView[3] = ae[3]
      // mat4aView[4] = ae[4]
      // mat4aView[5] = ae[5]
      // mat4aView[6] = ae[6]
      // mat4aView[7] = ae[7]
      // mat4aView[8] = ae[8]
      // mat4aView[9] = ae[9]
      // mat4aView[10] = ae[10]
      // mat4aView[11] = ae[11]
      // mat4aView[12] = ae[12]
      // mat4aView[13] = ae[13]
      // mat4aView[14] = ae[14]
      // mat4aView[15] = ae[15]

      // mat4bView[0] = be[0]
      // mat4bView[1] = be[1]
      // mat4bView[2] = be[2]
      // mat4bView[3] = be[3]
      // mat4bView[4] = be[4]
      // mat4bView[5] = be[5]
      // mat4bView[6] = be[6]
      // mat4bView[7] = be[7]
      // mat4bView[8] = be[8]
      // mat4bView[9] = be[9]
      // mat4bView[10] = be[10]
      // mat4bView[11] = be[11]
      // mat4bView[12] = be[12]
      // mat4bView[13] = be[13]
      // mat4bView[14] = be[14]
      // mat4bView[15] = be[15]

      mat4.multiply(mat4c, mat4a, mat4b)
      // // c = mat4.multiply(mat4a, mat4a, mat4b)

      // // console.log('result', result.elements)
      // console.log(result.elements)
      // // console.log('mat4a', mat4a)
      // // console.log('mat4a', mat4.view(mat4a))
      // console.log(mat4aView)
      // // console.log('c', c) // same as `a`
      // debugger

      this.elements[0] = mat4cView[0]
      this.elements[1] = mat4cView[1]
      this.elements[2] = mat4cView[2]
      this.elements[3] = mat4cView[3]
      this.elements[4] = mat4cView[4]
      this.elements[5] = mat4cView[5]
      this.elements[6] = mat4cView[6]
      this.elements[7] = mat4cView[7]
      this.elements[8] = mat4cView[8]
      this.elements[9] = mat4cView[9]
      this.elements[10] = mat4cView[10]
      this.elements[11] = mat4cView[11]
      this.elements[12] = mat4cView[12]
      this.elements[13] = mat4cView[13]
      this.elements[14] = mat4cView[14]
      this.elements[15] = mat4cView[15]
      // this.elements = [...mat4cView] // poor perfromance

      // if (window.isLogAverageTime) {
      //   totalTime += performance.now() - startTime
      //   count += 1
      //   averageTime = totalTime / count // todo: calc average in animate()
      //   window.domAverageTime.innerText = averageTime
      // }

      return this
    }
  })()
});

// XXX enable this when the code is stable; then, we will have many more places to add missing matrix updates
// THREE.Object3D.DefaultMatrixAutoUpdate = false;

let canvas = null, context = null, renderer = null, composer = null;

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
  context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
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
const postScene = new THREE.Scene();
postScene.name = 'postScene';
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

// const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
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
  // AppManager,
  bindCanvas,
  getRenderer,
  getContainerElement,
  getComposer,
  scene,
  rootScene,
  postScene,
  // avatarScene,
  camera,
  // orthographicCamera,
  // avatarCamera,
  dolly,
  /*orbitControls, renderer2,*/
  sceneHighPriority,
  sceneLowPriority,
  // iframeContainer,
  // iframeContainer2,
  // appManager,
};