/* eslint-disable no-inner-declarations */

import * as THREE from 'three';
import {GLTFLoader, GLTFExporter, OrbitControls} from 'three';
// import {XRPackage, XRPackageEngine} from 'https://static.xrpackage.org/xrpackage.js';
// import {getWireframeMesh, getDefaultAabb, getPreviewMesh} from './volume.js';
// import {readFile} from './util.js';
// import {screenshotEngine} from './screenshot-object.js';
import {bindUploadFileButton, mergeMeshes} from './util.js';
import {storageHost} from './constants.js';

const screenshotHeaderEl = document.getElementById('screenshot-header');
const screenshotResultEl = document.getElementById('screenshot-result');
const aabbHeaderEl = document.getElementById('aabb-header');
const aabbResultEl = document.getElementById('aabb-result');
const errorTraceEl = document.getElementById('error-trace');

const bake = async (hash, ext, dst) => {
  switch (ext) {
    case 'gltf':
    case 'glb':
    case 'vrm': {
      const u = `${storageHost}/${hash}`;
      // console.log('got u', u);
      let o;
      try {
        o = await new Promise((accept, reject) => {
          new GLTFLoader().load(u, accept, function onprogress() {}, reject);
        });
      } catch(err) {
        console.warn(err);
      } /* finally {
        URL.revokeObjectURL(u);
      } */
      o = o.scene;

      const specs = [];
      o.traverse(o => {
        if (o.isMesh) {
          const mesh = o;
          const {geometry} = o;
          let texture;
          if (o.material.map) {
            texture = o.material.map;
          } else if (o.material.emissiveMap) {
            texture = o.material.emissiveMap;
          } else {
            texture = null;
          }
          specs.push({
            mesh,
            geometry,
            texture,
          });
        }
      });
      specs.sort((a, b) => +a.mesh.material.transparent - +b.mesh.material.transparent);
      const meshes = specs.map(spec => spec.mesh);
      const geometries = specs.map(spec => spec.geometry);
      const textures = specs.map(spec => spec.texture);

      const mesh = mergeMeshes(meshes, geometries, textures);
      mesh.userData.gltfExtensions = {
        EXT_aabb: mesh.geometry.boundingBox.min.toArray()
          .concat(mesh.geometry.boundingBox.max.toArray()),
        EXT_hash: hash,
      };
      const arrayBuffer = await new Promise((accept, reject) => {
        new GLTFExporter().parse(mesh, accept, {
          binary: true,
          includeCustomExtensions: true,
        });
      });
      const bakedFile = new Blob([arrayBuffer], {
        type: 'model/gltf+binary',
      });
      // bakedFile.name = fileName;
      return {
        model: mesh,
        arrayBuffer: arrayBuffer,
        file: bakedFile,
      };
    }
    default: {
      return null;
    }
  }
};

const toggleElements = (baked, err) => {
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
  } else if (err) {
    bakedEl.style.display = 'none';
    bakingEl.style.display = 'none';
    errorEl.style.display = 'block';

    if (screenshotHeaderEl) screenshotHeaderEl.innerText = '';
    errorTraceEl.innerText = err.stack;
  }
};

const screenshot = async (src, type, dst) => {
  screenshotHeaderEl.innerText = 'Screenshotting...';
  const {screenshotBlob} = await _screenshot(srcWbn, dstGif);

  const img = document.createElement('img');
  img.src = URL.createObjectURL(screenshotBlob);
  img.style.backgroundColor = '#EEE';
  img.style.borderRadius = '10px';
  screenshotResultEl.appendChild(img);

  screenshotHeaderEl.innerText = 'Screenshotting done';
  const screenshot = await readFile(screenshotBlob);
  return {screenshot};
};

const _screenshot = async (srcWbn, dstGif) => {
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

export {bake, screenshot, toggleElements};
