import THREE from './three.module.js';
import {GLTFExporter} from './GLTFExporter.js';
import './gif.js';
import screenshot from './screenshot.js';

function makePromise() {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
}
export async function screenshotObject(o) {
  console.log('add o', o);

  const newScene = new THREE.Scene();
  {
    const ambientLight = new THREE.AmbientLight(0x808080);
    newScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(0.5, 1, 0.5).multiplyScalar(100);
    newScene.add(directionalLight);
  }
  newScene.add(o);

  const width = 256;
  const height = width;
  const center = new THREE.Vector3(0, 0.5, 0);
  const gif = new GIF({
    workers: 2,
    quality: 10,
  });
  for (let i = 0; i < Math.PI*2; i += Math.PI*0.05) {
    const position = new THREE.Vector3(0, 1, 0).add(new THREE.Vector3(Math.cos(i + Math.PI/2), 0, Math.sin(i + Math.PI/2)));
    const canvas = screenshot(newScene, position, center, {
      width,
      height,
    });
    gif.addFrame(canvas, {delay: 50});
  }
  gif.render();

  const blob = await new Promise((accept, reject) => {
    gif.on('finished', accept);
  });
  return blob;
}
export async function exportObject(o) {
  const dataPromise = makePromise();
  const exporter = new GLTFExporter();
  const exportScene = new THREE.Scene();
  exportScene.add(o);
  exporter.parse(exportScene, gltf => {
    dataPromise.accept(gltf);
  }, {
    binary: true,
    includeCustomExtensions: true,
  });
  const data = await dataPromise;
  return data;
}