import * as THREE from './three.module.js';
import {CSS3DRenderer} from './CSS3DRenderer.js';
import {addDefaultLights} from './util.js';

let canvas = document.getElementById('canvas');
let context = canvas && canvas.getContext('webgl2', {
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: false,
  xrCompatible: true,
});
const renderer = new THREE.WebGLRenderer({
  canvas,
  context,
  antialias: true,
  alpha: false,
  // preserveDrawingBuffer: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
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

const scene = new THREE.Scene();
const orthographicScene = new THREE.Scene();
const avatarScene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
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

addDefaultLights(scene, true);
addDefaultLights(avatarScene, false);

const renderer2 = new CSS3DRenderer();
renderer2.setSize(window.innerWidth, window.innerHeight);
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.top = 0;
if (canvas.parentNode) {
  document.body.insertBefore(renderer2.domElement, canvas);
}

const scene2 = new THREE.Scene();
const scene3 = new THREE.Scene();

const copyScenePlaneGeometry = new THREE.PlaneGeometry(2, 2);
const copySceneVertexShader = `#version 300 es
  precision highp float;

  in vec3 position;
  in vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const copyScene = (() => {
  const mesh = new THREE.Mesh(
    copyScenePlaneGeometry,
    new THREE.RawShaderMaterial({
      uniforms: {
        tex: {
          value: null,
          // needsUpdate: false,
        },
      },
      vertexShader: copySceneVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;

        uniform sampler2D tex;
        in vec2 vUv;
        out vec4 fragColor;
        
        void main() {
          fragColor = texture(tex, vUv);
        }
      `,
      depthWrite: false,
      depthTest: false,
    })
  );
  const scene = new THREE.Scene();
  scene.add(mesh);
  scene.mesh = mesh;
  return scene;
})();
const copySceneCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const localData = {
  timestamp: 0,
  frame: null,
  timeDiff: 0,
};
const localFrameOpts = {
  data: localData,
};

class AppManager {
  constructor() {
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
    this.lastTimestamp = performance.now();
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
    if (this.apps.length > 0) {
      localData.timestamp = timestamp;
      localData.frame = frame;
      localData.timeDiff = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;
      for (const app of this.apps) {
        app.dispatchEvent(new MessageEvent('frame', localFrameOpts));
      }
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

    // cleanup tracking
    this.physicsIds = [];
    this.popovers = [];
  }
}

export {renderer, scene, orthographicScene, avatarScene, camera, orthographicCamera, avatarCamera, dolly, /*orbitControls,*/ renderer2, scene2, scene3, copyScenePlaneGeometry, copySceneVertexShader, copyScene, copySceneCamera, appManager};