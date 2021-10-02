import * as THREE from 'three';
// import {CSS3DRenderer} from './CSS3DRenderer.js';
import {addDefaultLights} from './util.js';

let canvas = null, context = null, renderer = null;
function bindCanvas(c) {
  canvas = c;
  
  const rect = canvas.getBoundingClientRect();
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

class AppManager extends EventTarget {
  constructor(world) {
    super();
    
    this.world = world;

    this.apps = [];
    /* this.grabbedObjects = [null, null];
    this.equippedObjects = [null, null];
    // this.grabbedObjectOffsets = [0, 0];
    this.grabbedObjectMatrices = [
      new THREE.Matrix4(),
      new THREE.Matrix4(),
    ];
    this.used = false;
    this.aimed = false; */
    this.lastAppId = 0;
    this.lastTimestamp = performance.now();
  }
  getNextAppId() {
    return ++this.lastAppId;
  }
  createApp(appId) {
    const app = new App(appId, this);
    this.apps.push(app);
    return app;
  }
  destroyApp(appId) {
    const appIndex = this.apps.findIndex(app => app.appId === appId);
    if (appIndex !== -1) {
      const app = this.apps[appIndex];
      app.dispatchEvent({
        type: 'destroy',
      });
      this.apps.splice(appIndex, 1);
    }
  }
  getApp(appId) {
    return this.apps.find(app => app.appId === appId);
  }
  getGrab(side) {
    return this.grabbedObjects[side === 'left' ? 1 : 0];
  }
  pretick(timestamp, frame) {
    localData.timestamp = timestamp;
    localData.frame = frame;
    localData.timeDiff = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.dispatchEvent(new MessageEvent('preframe', localFrameOpts));
  }
  tick(timestamp, frame) {
    this.dispatchEvent(new MessageEvent('startframe', localFrameOpts));
    this.dispatchEvent(new MessageEvent('frame', localFrameOpts));
  }
}

class App extends THREE.Object3D {
  constructor(appId, appManager) {
    super();

    this.appId = appId;
    this.appManager = appManager;
    this.components = [];
    // cleanup tracking
    this.physicsIds = [];
  }
  getComponent(key) {
    const component = this.components.find(component => component.key === key);
    return component ? component.value : null;
  }
  setComponent(key, value = true) {
    let component = this.components.find(component => component.key === key);
    if (!component) {
      component = {key, value};
      this.components.push(component);
    }
    component.key = key;
    component.value = value;
    this.dispatchEvent({
      type: 'componentupdate',
      key,
      value,
    });
  }
  removeComponent(key) {
    const index = this.components.findIndex(component => component.type === key);
    if (index !== -1) {
      this.components.splice(index, 1);
      this.dispatchEvent({
        type: 'componentupdate',
        key,
        value: null,
      });
    }
  }
  get contentId() {
    return this.getComponent('contentId');
  }
  set contentId(contentId) {
    this.setComponent('contentId', contentId);
  }
  get instanceId() {
    return this.getComponent('instanceId');
  }
  set instanceId(instanceId) {
    this.setComponent('instanceId', instanceId);
  }
  addModule(m) {
    throw new Error('method not bound');
  }
  getPhysicsIds() {
    return this.physicsIds;
  }
  activate() {
    this.dispatchEvent({
      type: 'activate',
    });
  }
  /* hit(hp) {
    this.hitTracker.hit(hp);
  } */
  destroy() {
    this.appManager.destroyApp(this.appId);
  }
}

export {
  AppManager,
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
  // iframeContainer,
  // iframeContainer2,
  // appManager,
};