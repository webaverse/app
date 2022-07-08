/* global GIF */
import * as THREE from './three.module.js';
import {GLTFExporter} from './GLTFExporter.js';
import GIF from './gif.js';
import screenshot from './screenshot.js';
import {makePromise} from './util.js';

export async function screenshotObject(o) {
  console.log('add o', o);

  const newScene = new THREE.Scene();
  newScene.autoUpdate = false;
  {
    const ambientLight = new THREE.AmbientLight(0x808080);
    newScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(0.5, 1, 0.5).multiplyScalar(100);
    newScene.add(directionalLight);
  }
  newScene.add(o);

  const boundingBox = new THREE.Box3().setFromObject(o);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  const width = 256;
  const height = width;
  const gif = new GIF({
    workers: 2,
    quality: 10,
  });
  for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.05) {
    const position = center.clone()
      .add(new THREE.Vector3(0, size.y / 2, 0))
      .add(new THREE.Vector3(Math.cos(i + Math.PI / 2), 0, Math.sin(i + Math.PI / 2)).multiplyScalar(Math.max(size.x, size.z) * 1.2));
    const canvas = screenshot(newScene, position, center, {
      width,
      height,
    });
    gif.addFrame(canvas, {delay: 50});
  }
  gif.render();

  const blob = await new Promise((resolve, reject) => {
    gif.on('finished', resolve);
  });
  console.log('got gif data', blob);
  return blob;
}
export async function exportObject(o) {
  const dataPromise = makePromise();
  const exporter = new GLTFExporter();
  const exportScene = new THREE.Scene();
  exportScene.autoUpdate = false;
  exportScene.add(o);
  exporter.parse(exportScene, gltf => {
    dataPromise.accept(gltf);
  }, {
    binary: true,
    includeCustomExtensions: true,
  });
  const data = await dataPromise;
  console.log('got gltf data', data);
  return data;
}
export async function screenshotEngine(pe) {
  const center = new THREE.Vector3(0, 0, 0);
  const size = new THREE.Vector3(3, 3, 3);
  const up = new THREE.Vector3(0, 1, 0);

  const gif = new GIF({
    workers: 2,
    quality: 10,
    transparent: 'rgba(0,0,0,0)',
  });
  for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.025) {
    pe.camera.position.copy(center).add(new THREE.Vector3(Math.cos(i) * size.x, size.y / 2, Math.sin(i) * size.z));
    pe.camera.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().lookAt(pe.camera.position, center, up),
    );
    pe.camera.scale.set(1, 1, 1);
    pe.camera.matrix.compose(pe.camera.position, pe.camera.quaternion, pe.camera.scale);
    pe.setCamera(pe.camera);
    pe.tick();

    const canvas = document.createElement('canvas');
    canvas.width = pe.domElement.width;
    canvas.height = pe.domElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(pe.domElement, 0, 0);
    // document.body.appendChild(canvas);

    gif.addFrame(canvas, {delay: 30});
  }
  gif.render();

  const blob = await new Promise((resolve, reject) => {
    gif.on('finished', resolve);
  });
  return blob;
}
