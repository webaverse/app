/* eslint-disable no-inner-declarations */

import THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {XRPackage, XRPackageEngine} from 'https://static.xrpackage.org/xrpackage.js';
import {GLTFExporter} from 'https://static.xrpackage.org/GLTFExporter.js';
import {OrbitControls} from 'https://static.xrpackage.org/xrpackage/OrbitControls.js';
import {getWireframeMesh, getDefaultAabb, getPreviewMesh} from './volume.js';
import {screenshotEngine} from './screenshot-object.js';

const screenshotWbn = async (srcWbn, dstGif) => {
  const req = await fetch(srcWbn);
  const arrayBuffer = await req.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const pe = new XRPackageEngine({
    width: 256,
    height: 256,
    pixelRatio: 1,
    autoStart: false,
    autoListen: false,
  });

  const p = await (async () => {
    try {
      const p = new XRPackage(uint8Array);
      await pe.add(p);
      await p.waitForLoad();
      return p;
    } catch (err) {
      console.error(err.stack);
      return null;
    }
  })();

  let screenshotBlob;
  if (p) {
    screenshotBlob = await screenshotEngine(pe);
    if (dstGif) {
      const res = await fetch(dstGif, {
        method: 'PUT',
        body: screenshotBlob,
      });
      await res.blob();
    }
  } else {
    screenshotBlob = new Blob([], {type: 'image/gif'});
    if (dstGif) {
      const res = await fetch(dstGif, {
        method: 'PUT',
        body: screenshotBlob,
      });
      await res.blob();
    }
  }

  return {screenshotBlob};
};

const volumeizeWbn = async (srcWbn, dstVolume, dstAabb) => {
  const req = await fetch(srcWbn);
  const arrayBuffer = await req.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const p = await (async () => {
    try {
      const p = new XRPackage(uint8Array);
      await p.waitForLoad();
      return p;
    } catch (err) {
      console.error(err.stack);
      return null;
    }
  })();

  if (!p) throw new Error('no package to volumize');
  const renderer = new THREE.WebGLRenderer({
    // canvas,
    // context,
    // preserveDrawingBuffer: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1, 2);
  camera.rotation.order = 'YXZ';

  const orbitControls = new OrbitControls(camera, renderer.domElement, document);
  orbitControls.screenSpacePanning = true;
  orbitControls.enableMiddleZoom = false;
  orbitControls.update();

  const o = await getPreviewMesh(p);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(o.positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(o.indices, 1));
  const collisionMaterial = new THREE.MeshStandardMaterial({color: 0xFFFFFF});
  const collisionMesh = new THREE.Mesh(geometry, collisionMaterial);
  collisionMesh.frustumCulled = false;

  let aabb = p.getAabb();
  if (!aabb) {
    const {type} = p;
    if (type === 'gltf@0.0.1' || type === 'vrm@0.0.1') {
      const model = await p.getModel();
      aabb = new THREE.Box3().setFromObject(model);
    } else {
      aabb = getDefaultAabb();
    }
  }
  aabb = [aabb.min.toArray(), aabb.max.toArray()];

  const volumeData = await new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    const exportScene = new THREE.Scene();
    exportScene.add(collisionMesh);
    const opts = {
      binary: true,
      includeCustomExtensions: true,
    };
    exporter.parse(exportScene, o => {
      if (o instanceof ArrayBuffer) {
        resolve(o);
      } else {
        const exporter = new GLTFExporter();
        const exportScene = new THREE.Scene();
        exportScene.add(new THREE.Mesh(new THREE.BoxBufferGeometry(0.01, 0.01, 0.01), collisionMaterial));
        exportScene.add(collisionMesh);
        exporter.parse(exportScene, resolve, opts);
      }
    }, opts);
  });
  const volumeBlob = new Blob([volumeData], {type: 'model/gltf-binary'});

  if (dstVolume) {
    const res = await fetch(dstVolume, {
      method: 'PUT',
      body: volumeBlob,
    });
    await res.blob();
  }
  if (dstAabb) {
    const res = await fetch(dstAabb, {
      method: 'PUT',
      body: JSON.stringify(aabb),
    });
    await res.blob();
  }

  let wireframeMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
  }));
  wireframeMesh = getWireframeMesh(wireframeMesh);
  wireframeMesh.frustumCulled = false;

  const pe = new XRPackageEngine({
    width: 512,
    height: 512,
  });
  pe.add(p);
  await p.waitForLoad();
  pe.scene.add(wireframeMesh);

  function animate(timestamp, frame) {
    orbitControls.update();
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);

  return {
    domElement: pe.domElement,
    volumeBlob,
    aabb,
  };
};

export {screenshotWbn, volumeizeWbn};
