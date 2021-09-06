import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';

const gltfLoader = new GLTFLoader();
const gltfExporter = new GLTFExporter();

window.renderShirt = async () => {
  const shirtObject = await new Promise((accept, reject) => {
    gltfLoader.load('./shirt.glb', accept, function onprogress() {}, reject);
  });
  const {scene} = shirtObject;
  const shirtMesh = scene.children[0];
  // const {material} = shirtMesh;
  console.log('got', shirtMesh);

  for (let i = 1; i <= 8000; i++) {
    const src = `./shirt2\/${i}\.png`;
    const img = await (async () => {
      const img = new Image();
      img.src = src;
      await new Promise((accept, reject) => {
        img.onload = accept;
        img.onerror = reject;
      });
      return img;
    })();
    shirtMesh.material.map.image = img;
    
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
    a.download = `shirt${i}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }
};