import * as THREE from './three.module.js';
// import {OrbitControls} from './OrbitControls.js';
import {CSS3DRenderer} from './CSS3DRenderer.js';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('webgl2', {
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: false,
  xrCompatible: true,
});
const renderer = new THREE.WebGLRenderer({
  canvas,
  context,
  antialias: true,
  alpha: true,
  // preserveDrawingBuffer: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = false;
renderer.sortObjects = false;
// renderer.physicallyCorrectLights = true;
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.xr.enabled = true;

const scene = new THREE.Scene();
const avatarScene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2);
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

const _addDefaultLights = (scene, shadowMap) => {
  const ambientLight = new THREE.AmbientLight(0xFFFFFF);
  scene.add(ambientLight);
  scene.ambientLight = ambientLight;
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF);
  directionalLight.position.set(1, 2, 3);
  scene.add(directionalLight);
  scene.directionalLight = directionalLight;
  /* const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1);
  scene.add(directionalLight2); */
  /* if (shadowMap) {
    const SHADOW_MAP_WIDTH = 1024;
    const SHADOW_MAP_HEIGHT = 1024;

    directionalLight.castShadow = true;

    directionalLight.shadow.camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 50 );
    // directionalLight.shadow.bias = 0.0001;

    directionalLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    directionalLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
  } */
};
_addDefaultLights(scene, true);
_addDefaultLights(avatarScene, false);

/* const orbitControls = new OrbitControls(camera, canvas);
orbitControls.screenSpacePanning = true;
orbitControls.enableMiddleZoom = false;
orbitControls.target.copy(camera.position).add(new THREE.Vector3(0, camera.position.y, -3).applyQuaternion(camera.quaternion));
orbitControls.update(); */

const renderer2 = new CSS3DRenderer();
renderer2.setSize(window.innerWidth, window.innerHeight);
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.top = 0;
document.body.insertBefore(renderer2.domElement, canvas);

const scene2 = new THREE.Scene();
const scene3 = new THREE.Scene();

class AppManager {
  constructor() {
    this.apps = [];
    this.animationLoops = [];
    this.grabbedObjects = [null, null];
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
    this.removeAnimationLoop(appId);
  }
  getApp(appId) {
    return this.apps.find(app => app.appId === appId);
  }
  setAnimationLoop(appId, fn) {
    let animationLoop = this.animationLoops.find(al => al.appId === appId);
    if (!animationLoop) {
      animationLoop = {
        appId,
        fn: null,
      };
      this.animationLoops.push(animationLoop);
    }
    animationLoop.fn = fn;
  }
  removeAnimationLoop(appId) {
    const index = this.animationLoops.findIndex(al => al.appId === appId);
    if (index !== -1) {
      this.animationLoops.splice(index, 1);
    }
  }
  getGrab(side) {
    return this.grabbedObjects[side === 'left' ? 1 : 0];
  }
  /* grab(side, mesh) {
    this.grabs[side === 'left' ? 0 : 1] = mesh;
  }
  release(side) {
    this.grabs[side === 'left' ? 0 : 1] = null;
  } */
  tick() {
    for (const al of this.animationLoops) {
      al.fn.apply(null, arguments);
    }
  }
}
const appManager = new AppManager();

class App extends EventTarget {
  constructor(appId) {
    super();

    this.appId = appId;
    this.files = {};
    this.object = null;
  }
}

export {renderer, scene, avatarScene, camera, avatarCamera, dolly, /*orbitControls,*/ renderer2, scene2, scene3, appManager};