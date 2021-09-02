import * as THREE from 'three';
// import {CSS3DRenderer} from './CSS3DRenderer.js';
import {addDefaultLights} from './util.js';

let canvas = null, context = null, renderer = null;
function bindCanvas(c) {
  canvas = c;
  context = canvas && canvas.getContext('webgl2', {
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
    xrCompatible: true,
  });
  renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    antialias: true,
    alpha: true,
    // preserveDrawingBuffer: false,
  });
  const container = getContainerElement();
  const rect = (container || canvas).getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.autoClear = false;
  renderer.sortObjects = false;
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.gammaFactor = 2.2;
  // renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = THREE.PCFShadowMap;
  if (!canvas) {
    canvas = renderer.domElement;
  }
  if (!context) {
    context = renderer.getContext();
  }
  context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
  renderer.xr.enabled = true;
  
  renderer.domElement.addEventListener('click', e => {
    scene.dispatchEvent({
      type: 'click',
      event: e,
      // message: 'vroom vroom!',
    });
  });
  renderer.domElement.addEventListener('mousedown', e => {
    scene.dispatchEvent({
      type: 'mousedown',
      event: e,
    });
  });
  /* renderer.domElement.addEventListener('mouseup', e => {
    scene.dispatchEvent({
      type: 'mouseup',
      event: e,
    });
  }); */
  renderer.domElement.addEventListener('contextmenu', e => {
    scene.dispatchEvent({
      type: 'contextmenu',
      event: e,
    });
  });
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

addDefaultLights(scene, {
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
});

/* const renderer2 = new CSS3DRenderer();
renderer2.setSize(window.innerWidth, window.innerHeight);
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.top = 0;
if (canvas.parentNode) {
  document.body.insertBefore(renderer2.domElement, canvas);
} */

const localData = {
  timestamp: 0,
  frame: null,
  timeDiff: 0,
};
const localFrameOpts = {
  data: localData,
};

const iframeContainer = document.getElementById('iframe-container');
const iframeContainer2 = document.getElementById('iframe-container2');
if (iframeContainer && iframeContainer2) {
  iframeContainer.getFov = () => camera.projectionMatrix.elements[ 5 ] * (window.innerHeight / 2);
  iframeContainer.updateSize = function updateSize() {
    const fov = iframeContainer.getFov();
    iframeContainer.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: ${window.innerWidth}px;
      height: ${window.innerHeight}px;
      perspective: ${fov}px;
    `;
    iframeContainer2.style.cssText = `
      /* display: flex;
      justify-content: center;
      align-items: center; */
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      /* transform-style: preserve-3d; */
    `;
  };
  iframeContainer.updateSize();
}

class AppManager extends EventTarget {
  constructor() {
    super();
    
    this.apps = [];
    this.grabbedObjects = [null, null];
    this.equippedObjects = [null, null];
    // this.grabbedObjectOffsets = [0, 0];
    this.grabbedObjectMatrices = [
      new THREE.Matrix4(),
      new THREE.Matrix4(),
    ];
    this.used = false;
    this.aimed = false;
    this.lastAppId = 0;
    this.lastTimestamp = performance.now();
  }
  getNextAppId() {
    return ++this.lastAppId;
  }
  createApp(appId) {
    const app = new App(appId);
    this.apps.push(app);
    return app;
  }
  destroyApp(appId) {
    const appIndex = this.apps.findIndex(app => app.appId === appId);
    if (appIndex !== -1) {
      const app = this.apps[appIndex];
      app.dispatchEvent(new MessageEvent('unload'));
      this.apps.splice(appIndex, 1);
    }
  }
  getApp(appId) {
    return this.apps.find(app => app.appId === appId);
  }
  getGrab(side) {
    return this.grabbedObjects[side === 'left' ? 1 : 0];
  }
  tick(timestamp, frame) {
    // if (this.apps.length > 0) {
      localData.timestamp = timestamp;
      localData.frame = frame;
      localData.timeDiff = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;
      this.dispatchEvent(new MessageEvent('startframe', localFrameOpts));
      this.dispatchEvent(new MessageEvent('frame', localFrameOpts));
      /* for (const app of this.apps) {
        app.dispatchEvent(new MessageEvent('frame', localFrameOpts));
      } */
    // }
  }
}
const appManager = new AppManager();

class App extends THREE.Object3D {
  constructor(appId) {
    super();

    this.appId = appId;
    // this.files = {};
    // this.object = null;
    this.attributes = {};

    // cleanup tracking
    this.physicsIds = [];
    this.popovers = [];
  }
  getAttribute(key) {
    return this.attributes[key];
  }
  setAttribute(key, value = true) {
    this.attributes[key] = value;
    this.dispatchEvent({
      type: 'attributeupdate',
      key,
      value,
    });
  }
  removeAttribute(key) {
    delete this.attributes[key];
    this.dispatchEvent({
      type: 'attributeupdate',
      key,
      value: null,
    });
  }
  addModule(m) {
    throw new Error('method not bound');
  }
}

export {
  App,
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
  iframeContainer,
  iframeContainer2,
  appManager,
};