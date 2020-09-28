import * as THREE from './three.module.js';

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
renderer.physicallyCorrectLights = true;
renderer.xr.enabled = true;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2);
camera.rotation.order = 'YXZ';
// camera.quaternion.set(0, 0, 0, 1);

class AppManager {
	constructor() {
		this.animationLoops = [];
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
		if (inded !== -1) {
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

export {renderer, scene, camera, appManager};