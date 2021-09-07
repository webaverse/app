import * as THREE from './node_modules/three/build/three.module.js';
import {GLTFLoader} from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from './node_modules/three/examples/jsm/exporters/GLTFExporter.js';

const gltfLoader = new GLTFLoader();
const gltfExporter = new GLTFExporter();

window.renderHoodieWhiteA = async () => {
  const shirtObject = await new Promise((accept, reject) => {
    gltfLoader.load('./hoodie-white-a.glb', accept, function onprogress() {}, reject);
  });
  const {scene} = shirtObject;
  const hoodieMesh = scene.children[0];
  // const {material} = hoodieMesh;
  console.log('got', hoodieMesh);

  for (let i = 1; i <= 8000; i++) {
    const src = `./hoodie-white2\/${i}\.png`;
    const img = await (async () => {
      const img = new Image();
      img.src = src;
      await new Promise((accept, reject) => {
        img.onload = accept;
        img.onerror = reject;
      });
      return img;
    })();
    hoodieMesh.material.map.image = img;
    
    const gltf = await new Promise((accept, reject) => {
      gltfExporter.parse(scene, accept, {
        binary: true,
      });
    });
    // console.log('got blob', gltf);
    const blob = new Blob([gltf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoodie-white-a${i}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
};