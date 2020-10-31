import * as THREE from './three.module.js';
import {OrbitControls} from './OrbitControls.js';
import {EffectComposer} from './EffectComposer.js';
import {SSAOPass} from './SSAOPass.js';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('webgl2', {
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: false,
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
renderer.xr.enabled = true;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2);
camera.rotation.order = 'YXZ';
// camera.quaternion.set(0, 0, 0, 1);

const dolly = new THREE.Object3D();
dolly.add(camera);
scene.add(dolly);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
directionalLight.position.set(1, 2, 3);
scene.add(directionalLight);
/* const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1);
scene.add(directionalLight2); */

const orbitControls = new OrbitControls(camera, canvas);
orbitControls.screenSpacePanning = true;
orbitControls.enableMiddleZoom = false;
orbitControls.target.copy(camera.position).add(new THREE.Vector3(0, camera.position.y, -3).applyQuaternion(camera.quaternion));
orbitControls.update();

const composer = (() => {
    /* container = document.createElement( 'div' );
    document.body.appendChild( container );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 100, 700 );
    camera.position.z = 500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xaaaaaa );

    scene.add( new THREE.DirectionalLight() );
    scene.add( new THREE.HemisphereLight() );

    group = new THREE.Group();
    scene.add( group );

    const geometry = new THREE.BoxBufferGeometry( 10, 10, 10 );

    for ( let i = 0; i < 100; i ++ ) {

      const material = new THREE.MeshLambertMaterial( {
        color: Math.random() * 0xffffff
      } );

      const mesh = new THREE.Mesh( geometry, material );
      mesh.position.x = Math.random() * 400 - 200;
      mesh.position.y = Math.random() * 400 - 200;
      mesh.position.z = Math.random() * 400 - 200;
      mesh.rotation.x = Math.random();
      mesh.rotation.y = Math.random();
      mesh.rotation.z = Math.random();

      mesh.scale.setScalar( Math.random() * 10 + 2 );
      group.add( mesh );

    }

    stats = new Stats();
    container.appendChild( stats.dom ); */

    const width = window.innerWidth;
    const height = window.innerHeight;

    const composer = new EffectComposer( renderer );

    const ssaoPass = new SSAOPass( scene, camera, width, height );
    ssaoPass.kernelRadius = 16;
    composer.addPass( ssaoPass );

    // Init gui
    /* const gui = new GUI();

    gui.add( ssaoPass, 'output', {
      'Default': SSAOPass.OUTPUT.Default,
      'SSAO Only': SSAOPass.OUTPUT.SSAO,
      'SSAO Only + Blur': SSAOPass.OUTPUT.Blur,
      'Beauty': SSAOPass.OUTPUT.Beauty,
      'Depth': SSAOPass.OUTPUT.Depth,
      'Normal': SSAOPass.OUTPUT.Normal
    } ).onChange( function ( value ) {

      ssaoPass.output = parseInt( value );

    } );
    gui.add( ssaoPass, 'kernelRadius' ).min( 0 ).max( 32 );
    gui.add( ssaoPass, 'minDistance' ).min( 0.001 ).max( 0.02 );
    gui.add( ssaoPass, 'maxDistance' ).min( 0.01 ).max( 0.3 ); */

  return composer;
})();

class AppManager {
  constructor() {
    this.apps = [];
    this.animationLoops = [];
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
      app.dispatchEvent(new MessageEvent('terminate'));
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
  }
}

export {renderer, scene, camera, dolly, orbitControls, composer, appManager};