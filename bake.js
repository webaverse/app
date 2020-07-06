/* eslint-disable no-inner-declarations */

import THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {XRPackage, XRPackageEngine} from 'https://static.xrpackage.org/xrpackage.js';
import {readFile} from 'https://static.xrpackage.org/xrpackage/util.js';
import {GLTFExporter} from 'https://static.xrpackage.org/GLTFExporter.js';
import {OrbitControls} from 'https://static.xrpackage.org/xrpackage/OrbitControls.js';
import {screenshotEngine} from './screenshot-object.js';
import {getWireframeMesh, getDefaultAabb, getPreviewMesh} from './volume.js';

const screenshotHeaderEl = document.getElementById('screenshot-header');
const screenshotResultEl = document.getElementById('screenshot-result');
const volumeHeaderEl = document.getElementById('volume-header');
const volumeResultEl = document.getElementById('volume-result');
const aabbHeaderEl = document.getElementById('aabb-header');
const aabbResultEl = document.getElementById('aabb-result');
const errorTraceEl = document.getElementById('error-trace');

const parseQuery = queryString => {
  const query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
};

const toggleElements = baked => {
  const bakedEl = document.getElementById('baked');
  const bakingEl = document.getElementById('baking');
  const errorEl = document.getElementById('error');

  if (baked === true) {
    bakedEl.style.display = 'block';
    bakingEl.style.display = 'none';
    errorEl.style.display = 'none';
  } else if (baked === false) {
    bakedEl.style.display = 'none';
    bakingEl.style.display = 'block';
    errorEl.style.display = 'none';
  } else {
    bakedEl.style.display = 'none';
    bakingEl.style.display = 'none';
    errorEl.style.display = 'block';
  }
};

const _screenshot = async (srcWbn, dstGif) => {
  screenshotHeaderEl.innerText = 'Screenshotting...';

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

    const img = document.createElement('img');
    img.src = URL.createObjectURL(screenshotBlob);
    img.style.backgroundColor = '#EEE';
    img.style.borderRadius = '10px';
    screenshotResultEl.appendChild(img);
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

  screenshotHeaderEl.innerText = 'Screenshotting done';
  const screenshotArrayBuffer = await readFile(screenshotBlob);
  return {screenshot: screenshotArrayBuffer};
};

const _volume = async (srcWbn, dstVolume, dstAabb) => {
  volumeHeaderEl.innerText = 'Volumizing...';

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

  volumeResultEl.appendChild(pe.domElement);
  pe.domElement.style.backgroundColor = '#EEE';
  pe.domElement.style.borderRadius = '10px';

  aabbHeaderEl.innerText = 'AABB';
  aabbResultEl.innerText = JSON.stringify(aabb, null, 2);

  function animate(timestamp, frame) {
    orbitControls.update();
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);
  volumeHeaderEl.innerText = 'Volumizing done';

  const volumeArrayBuffer = await readFile(volumeBlob);
  return {
    volume: volumeArrayBuffer,
    aabb,
  };
};

(async () => {
  try {
    toggleElements(false);
    const {srcWbn, dstGif, dstVolume, dstAabb} = parseQuery(decodeURIComponent(window.location.search));
    const {screenshot} = await _screenshot(srcWbn, dstGif);
    const {volume, aabb} = await _volume(srcWbn, dstVolume, dstAabb);

    window.parent.postMessage({
      method: 'result',
      result: {screenshot, volume, aabb},
    }, '*', [screenshot.buffer, volume.buffer]);

    toggleElements(true);
  } catch (err) {
    toggleElements(null);
    console.error(err.stack);
    screenshotHeaderEl.innerText = '';
    volumeHeaderEl.innerText = '';
    errorTraceEl.innerText = err.stack;

    window.parent.postMessage({
      method: 'error',
      error: err.stack,
    }, '*');
  }
})();
