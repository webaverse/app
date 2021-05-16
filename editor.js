import * as THREE from 'three';
import React from 'react';
const {Fragment, useState, useEffect, useRef} = React;
import ReactDOM from 'react-dom';
import ReactThreeFiber from '@react-three/fiber';
import Babel from '@babel/standalone';
import JSZip from 'jszip';
// import {jsx} from 'jsx-tmpl';
import {world} from './world.js';
import transformControls from './transform-controls.js';
import physicsManager from './physics-manager.js';
import {downloadFile} from './util.js';
import App from '/app.js';
import {storageHost} from './constants.js';
// import TransformGizmo from './TransformGizmo.js';
// import transformControls from './transform-controls.js';
import easing from './easing.js';
import Simplex from './simplex-noise.js';
import ghDownloadDirectory from './gh-download-directory.js';

const cubicBezier = easing(0, 1, 0, 1);
// const cubicBezier2 = easing(0, 0.7, 0, 0.7);
const simplex = new Simplex('lol');
const ghDownload = ghDownloadDirectory.default;
// window.ghDownload = ghDownload;

/* import BrowserFS from '/browserfs.js';
BrowserFS.configure({
    fs: "IndexedDB",
    options: {
       storeName : "webaverse-editor",
    }
  }, function(e) {
    if (e) {
      // An error happened!
      throw e;
    }
    // Otherwise, BrowserFS is ready-to-use!
  });
const fs = (() => {
  const exports = {};
  BrowserFS.install(exports);
  const {require} = exports;
  const fs = require('fs');
  return fs;
})();
window.BrowserFS = BrowserFS;
window.fs = fs; */

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();

let getEditor = () => null;
let getFiles = () => null;
let getSelectedFileIndex = () => null;
let getErrors = () => null;
let setErrors = () => {};

function createPointerEvents(store) {
  // const { handlePointer } = createEvents(store)
  const handlePointer = key => e => {
    // const handlers = eventObject.__r3f.handlers;
    // console.log('handle pointer', key, e);
  };
  const names = {
    onClick: 'click',
    onContextMenu: 'contextmenu',
    onDoubleClick: 'dblclick',
    onWheel: 'wheel',
    onPointerDown: 'pointerdown',
    onPointerUp: 'pointerup',
    onPointerLeave: 'pointerleave',
    onPointerMove: 'pointermove',
    onPointerCancel: 'pointercancel',
    onLostPointerCapture: 'lostpointercapture',
  }

  return {
    connected: false,
    handlers: (Object.keys(names).reduce(
      (acc, key) => ({ ...acc, [key]: handlePointer(key) }),
      {},
    )),
    connect: (target) => {
      const { set, events } = store.getState()
      events.disconnect?.()
      set((state) => ({ events: { ...state.events, connected: target } }))
      Object.entries(events?.handlers ?? []).forEach(([name, event]) =>
        target.addEventListener(names[name], event, { passive: true }),
      )
    },
    disconnect: () => {
      const { set, events } = store.getState()
      if (events.connected) {
        Object.entries(events.handlers ?? []).forEach(([name, event]) => {
          if (events && events.connected instanceof HTMLElement) {
            events.connected.removeEventListener(names[name], event)
          }
        })
        set((state) => ({ events: { ...state.events, connected: false } }))
      }
    },
  }
}

class CameraGeometry extends THREE.BufferGeometry {
  constructor() {
    super();
    
    const boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
    const positions = new Float32Array(boxGeometry.attributes.position.array.length * 8);
    const indices = new Uint16Array(boxGeometry.index.array.length * 8);
    
    const _pushBoxGeometry = m => {
      const g = boxGeometry.clone();
      g.applyMatrix4(m);
      positions.set(g.attributes.position.array, positionIndex);
      for (let i = 0; i < g.index.array.length; i++) {
        indices[indexIndex + i] = g.index.array[i] + positionIndex/3;
      }
      positionIndex += g.attributes.position.array.length;
      indexIndex += g.index.array.length;
    };
    
    const topLeft = new THREE.Vector3(-1, 0.5, -2);
    const topRight = new THREE.Vector3(1, 0.5, -2);
    const bottomLeft = new THREE.Vector3(-1, -0.5, -2);
    const bottomRight = new THREE.Vector3(1, -0.5, -2);
    const back = new THREE.Vector3(0, 0, 0);
    
    const _setMatrixBetweenPoints = (m, p1, p2) => {
      const quaternion = localQuaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          p1,
          p2,
          localVector.set(0, 1, 0)
        )
      );
      const position = localVector.copy(p1)
        .add(p2)
        .divideScalar(2)
        // .add(new THREE.Vector3(0, 2, 0));
      const sc = 0.01;
      const scale = localVector2.set(sc, sc, p1.distanceTo(p2));
      m.compose(position, quaternion, scale);
      return m;
    };
    
    let positionIndex = 0;
    let indexIndex = 0;
    [
      [topLeft, back],
      [topRight, back],
      [bottomLeft, back],
      [bottomRight, back],
      [topLeft, topRight],
      [topRight, bottomRight],
      [bottomRight, bottomLeft],
      [bottomLeft, topLeft],
    ].forEach(e => {
      const [p1, p2] = e;
      _pushBoxGeometry(
        _setMatrixBetweenPoints(localMatrix, p1, p2)
      );
    });
    
    this.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.setIndex(new THREE.BufferAttribute(indices, 1));
  }
}
const _makeUiMesh = () => {
  const geometry = new THREE.PlaneBufferGeometry(2, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    map: new THREE.Texture(),
    side: THREE.DoubleSide,
    transparent: true,
  });
  
  (async () => {
    const img = await new Promise((accept, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        accept(img);
      };
      img.onerror = reject;
      img.src = `/assets/popup.svg`;
    });
    material.map.image = img;
    material.map.needsUpdate = true;
    material.map.minFilter = THREE.THREE.LinearMipmapLinearFilter;
    material.map.magFilter = THREE.LinearFilter;
    material.map.anisotropy = 16;
  })();
  
  const m = new THREE.Mesh(geometry, material);
  m.frustumCulled = false;
  return m;
};
const eps = 0.00001;
const cardPreviewHost = `https://card-preview.exokit.org`;

const cardWidth = 0.063;
const cardHeight = cardWidth / 2.5 * 3.5;
const cardsBufferFactor = 1.1;
const menuWidth = cardWidth * cardsBufferFactor * 4;
const menuHeight = cardHeight * cardsBufferFactor * 4;
const menuRadius = 0.0025;
const _loadImage = u => new Promise((accept, reject) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  
  img.src = u;
  img.onload = () => {
    accept(img);
  };
  img.onerror = reject;
});
function makeShape(shape, x, y, width, height, radius, smoothness) {
  shape.absarc( x, y, radius, -Math.PI / 2, -Math.PI, true );
  shape.absarc( x, y + height - radius * 2, radius, Math.PI, Math.PI / 2, true );
  shape.absarc( x + width - radius * 2, y + height -  radius * 2, radius, Math.PI / 2, 0, true );
  shape.absarc( x + width - radius * 2, y, radius, 0, -Math.PI / 2, true );
  return shape;
}
function createBoxWithRoundedEdges( width, height, depth, radius0, smoothness ) {
  const shape = makeShape(new THREE.Shape(), 0, 0, width, height, radius0, smoothness);
  const innerFactor = 0.99;
  const hole = makeShape(new THREE.Path(), radius0/2, radius0/2, width * innerFactor, height * innerFactor, radius0, smoothness);
  shape.holes.push(hole);

  let geometry = new THREE.ExtrudeBufferGeometry( shape, {
    amount: 0,
    bevelEnabled: true,
    bevelSegments: smoothness * 2,
    steps: 1,
    bevelSize: radius0,
    bevelThickness: 0,
    curveSegments: smoothness
  });
  
  geometry.center();
  
  return geometry;
}
const cardFrontGeometry = new THREE.PlaneBufferGeometry(cardWidth, cardHeight);
const cardBackGeometry = cardFrontGeometry.clone()
  .applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(0, 0, -0.001),
      new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
      new THREE.Vector3(1, 1, 1)
    )
  );
const _makeCardBackMaterial = () => {
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    map: new THREE.Texture(),
    transparent: true,
  });
  (async () => {
    const img = await _loadImage('./assets/cardback.png');
    material.map.image = img;
    material.map.minFilter = THREE.LinearMipmapLinearFilter;
    material.map.magFilter = THREE.LinearFilter;
    material.map.anisotropy = 16;
    material.map.needsUpdate = true;
  })();
  return material;
};
const _makeCardMesh = img => {
  const geometry = cardFrontGeometry;
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    map: new THREE.Texture(img),
    side: THREE.DoubleSide,
    transparent: true,
  });
  material.map.minFilter = THREE.LinearMipmapLinearFilter;
  material.map.magFilter = THREE.LinearFilter;
  material.map.anisotropy = 16;
  material.map.needsUpdate = true;
  const mesh = new THREE.Mesh(geometry, material);
  
  {
    const geometry = cardBackGeometry;
    const material = _makeCardBackMaterial();
    const back = new THREE.Mesh(geometry, material);
    mesh.add(back);
    mesh.back = back;
  }
  
  return mesh;
};
const _makeInventoryMesh = () => {
  const w = menuWidth + menuRadius*2;
  const h = menuHeight + menuRadius*2;
  const geometry = createBoxWithRoundedEdges(w, h, 0, menuRadius, 1);
  const boundingBox = new THREE.Box3().setFromObject(new THREE.Mesh(geometry));
  console.log('got bounding box', boundingBox);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uBoundingBox: {
        type: 'vec4',
        value: new THREE.Vector4(
          boundingBox.min.x,
          boundingBox.min.y,
          boundingBox.max.x - boundingBox.min.x,
          boundingBox.max.y - boundingBox.min.y
        ),
        needsUpdate: true,
      },
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
      uTimeCubic: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      // uniform float uTime;
      uniform vec4 uBoundingBox;
      varying vec3 vPosition;
      // varying vec3 vNormal;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        vPosition = (
          position - vec3(uBoundingBox.x, uBoundingBox.y, 0.)
        ) / vec3(uBoundingBox.z, uBoundingBox.w, 1.);
        // vNormal = normal;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      // uniform vec4 uBoundingBox;
      uniform float uTime;
      uniform float uTimeCubic;
      varying vec3 vPosition;
      // varying vec3 vNormal;

      vec3 hueShift( vec3 color, float hueAdjust ){
        const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
        const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
        const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

        const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);
        const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);
        const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);

        float   YPrime  = dot (color, kRGBToYPrime);
        float   I       = dot (color, kRGBToI);
        float   Q       = dot (color, kRGBToQ);
        float   hue     = atan (Q, I);
        float   chroma  = sqrt (I * I + Q * Q);

        hue += hueAdjust;

        Q = chroma * sin (hue);
        I = chroma * cos (hue);

        vec3    yIQ   = vec3 (YPrime, I, Q);

        return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );
    }

      void main() {
        if (
          (1. - vPosition.y) < uTimeCubic &&
          abs(vPosition.x - 0.5) < uTimeCubic
        ) {
          gl_FragColor = vec4(hueShift(vPosition, uTime * PI * 2.), 1.);
        } else {
          discard;
        }
      }
    `,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  
  const cards = [];
  (async () => {
    const cardImgs = [];
    const numCols = 4;
    const numRows = 6;
    const promises = [];
    let i = 0;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const promise = (async () => {
          const index = i;
          const id = ++i;
          const w = 1024;
          const ext = 'png';
          const u = `${cardPreviewHost}/?t=${id}&w=${w}&ext=${ext}`;
          const img = await _loadImage(u);
          
          const cardMesh = _makeCardMesh(img);
          cardMesh.basePosition = new THREE.Vector3(
            menuRadius - menuWidth/2 + cardWidth/2 + col * cardWidth * cardsBufferFactor,
            -menuRadius + menuHeight/2 - cardHeight/2 - row * cardHeight * cardsBufferFactor,
            0
          );
          cardMesh.position.copy(cardMesh.basePosition);
          cardMesh.index = index;
          mesh.add(cardMesh);
          cards.push(cardMesh);
        })();
        promises.push(promise);
      }
    }
    await Promise.all(promises);
  })();

  
  mesh.update = () => {
    const maxTime = 2000;
    const f = (Date.now() % maxTime) / maxTime;
    
    material.uniforms.uTime.value = f;
    material.uniforms.uTime.needsUpdate = true;
    material.uniforms.uTimeCubic.value = cubicBezier(f);
    material.uniforms.uTimeCubic.needsUpdate = true;
    
    // window.cards = cards;
    for (const card of cards) {
      const {index} = card;
      const cardStartTime = index * 0.02;
      const g = cubicBezier(f - cardStartTime);
      const h = 1 - g;
      card.position.copy(card.basePosition)
        .lerp(
          card.basePosition.clone()
            .add(new THREE.Vector3(0, -0.1, 0))
          ,
          h
        );
      card.material.opacity = g;
      card.back.material.opacity = g;
    }
  };
  
  return mesh;
};

const fetchAndCompileBlob = async (file, files) => {
  const res = file;
  const scriptUrl = file.name;
  let s = await file.text();
  
  const urlCache = {};
  const _mapUrl = async (u, scriptUrl) => {
    const cachedContent = urlCache[u];
    if (cachedContent !== undefined) {
      // return u;
      // nothing
    } else {
      const baseUrl = /https?:\/\//.test(scriptUrl) ? scriptUrl : `https://webaverse.com/${scriptUrl}`;
      const pathUrl = new URL(u, baseUrl).pathname.replace(/^\//, '');
      const file = files.find(file => file.name === pathUrl);
      // console.log('got script url', {scriptUrl, baseUrl, pathUrl, file});
      if (file) {
        let importScript = await file.blob.text();
        importScript = await _mapScript(importScript, pathUrl);
        // const p = new URL(fullUrl).pathname.replace(/^\//, '');
        urlCache[pathUrl] = importScript;
      } else {
        // const fullUrl = new URL(u, scriptUrl).href;
        const res = await fetch(u);
        if (res.ok) {
          let importScript = await res.text();
          importScript = await _mapScript(importScript, fullUrl);
          const p = new URL(fullUrl).pathname.replace(/^\//, '');
          urlCache[p] = importScript;
        } else {
          throw new Error('failed to load import url: ' + u);
        }
     }
    }
  };
  const _mapScript = async (script, scriptUrl) => {
    // const r = /^(\s*import[^\n]+from\s*['"])(.+)(['"])/gm;
    // console.log('map script');
    const r = /((?:im|ex)port(?:["'\s]*[\w*{}\n\r\t, ]+from\s*)?["'\s])([@\w_\-\.\/]+)(["'\s].*);?$/gm;
    // console.log('got replacements', script, Array.from(script.matchAll(r)));
    const replacements = await Promise.all(Array.from(script.matchAll(r)).map(async match => {
      let u = match[2];
      // console.log('replacement', u);
      if (/^\.+\//.test(u)) {
        await _mapUrl(u, scriptUrl);
      }
      return u;
    }));
    let index = 0;
    script = script.replace(r, function() {
      return arguments[1] + replacements[index++] + arguments[3];
    });
    const spec = Babel.transform(script, {
      presets: ['react'],
      // compact: false,
    });
    script = spec.code;
    return script;
  };

  s = await _mapScript(s, scriptUrl);
  const o = new URL(scriptUrl, `https://webaverse.com/`);
  const p = o.pathname.replace(/^\//, '');
  urlCache[p] = s;
  return urlCache;
  // return s;
  /* const o = new URL(scriptUrl, `https://webaverse.com/`);
  const p = o.pathname.replace(/^\//, '');
  urlCache[p] = s;

  urlCache['.metaversefile'] = JSON.stringify({
    start_url: p,
  });
  
  const zip = new JSZip();
  for (const p in urlCache) {
    const d = urlCache[p];
    // console.log('add file', p);
    zip.file(p, d);
  }
  const ab = await zip.generateAsync({
    type: 'arraybuffer',
  });
  return new Uint8Array(ab); */
};
const fetchZipFiles = async zipData => {
  const zip = await JSZip.loadAsync(zipData);
  // console.log('load file 4', zip.files);

  const fileNames = [];
  // const localFileNames = {};
  for (const fileName in zip.files) {
    fileNames.push(fileName);
  }
  const files = await Promise.all(fileNames.map(async fileName => {
    const file = zip.file(fileName);
    
    const b = file && await file.async('blob');
    return {
      name: fileName,
      data: b,
    };
  }));
  return files;
};

const isDirectoryName = fileName => /\/$/.test(fileName);
const uploadFiles = async files => {
  const fd = new FormData();
  const directoryMap = {};
  const metaverseFile = files.find(f => f.name === '.metaversefile');
  // console.log('got', metaverseFile);
  const metaverseJson = await (async () => {
    const s = await metaverseFile.data.text();
    const j = JSON.parse(s);
    return j;    
  })();
  const {start_url} = metaverseJson;
  [
    // mainDirectoryName,
    '',
  ].forEach(p => {
    if (!directoryMap[p]) {
      // console.log('add missing main directory', [p]);
      fd.append(
        p,
        new Blob([], {
          type: 'application/x-directory',
        }),
        p
      );
    }
  });

  for (const file of files) {
    const {name} = file;
    const basename = name; // localFileNames[name];
    // console.log('append', basename, name);
    if (isDirectoryName(name)) {
      const p = name.replace(/\/+$/, '');
      console.log('append dir', p);
      fd.append(
        p,
        new Blob([], {
          type: 'application/x-directory',
        }),
        p
      );
      directoryMap[p] = true;
    } else {
      // console.log('append file', name);
      fd.append(name, file.data, basename);
    }
  }

  const uploadFilesRes = await fetch(storageHost, {
    method: 'POST',
    body: fd,
  });
  const hashes = await uploadFilesRes.json();

  const rootDirectory = hashes.find(h => h.name === '');
  console.log('got hashes', {rootDirectory, hashes});
  const rootDirectoryHash = rootDirectory.hash;
  return rootDirectoryHash;
  /* const ipfsUrl = `${storageHost}/ipfs/${rootDirectoryHash}`;
  console.log('got ipfs url', ipfsUrl);
  return ipfsUrl; */
};
/* let rootDiv = null;
// let state = null;
const loadModule = async u => {
  const m = await import(u);
  const fn = m.default;
  // console.log('got fn', fn);

  // window.ReactThreeFiber = ReactThreeFiber;

  if (rootDiv) {
    const roots = ReactThreeFiber._roots;
    const root = roots.get(rootDiv);
    const fiber = root?.fiber
    if (fiber) {
      const state = root?.store.getState()
      if (state) state.internal.active = false
      await new Promise((accept, reject) => {
        ReactThreeFiber.reconciler.updateContainer(null, fiber, null, () => {
          if (state) {
            // setTimeout(() => {
              state.events.disconnect?.()
              // state.gl?.renderLists?.dispose?.()
              // state.gl?.forceContextLoss?.()
              ReactThreeFiber.dispose(state)
              roots.delete(canvas)
              // if (callback) callback(canvas)
            // }, 500)
          }
          accept();
        });
      });
    }
  }

  const sizeVector = renderer.getSize(new THREE.Vector2());
  rootDiv = document.createElement('div');

  await app.waitForLoad();
  app.addEventListener('frame', () => {
    ReactThreeFiber.render(
      React.createElement(fn),
      rootDiv,
      {
        gl: renderer,
        camera,
        size: {
          width: sizeVector.x,
          height: sizeVector.y,
        },
        events: createPointerEvents,
        onCreated: state => {
          // state = newState;
          // scene.add(state.scene);
          console.log('got state', state);
        },
        frameloop: 'demand',
      }
    );
  });
}; */
const downloadZip = async () => {
  const zipData = await collectZip();
  // console.log('got zip data', zipData);
  const blob = new Blob([zipData], {
    type: 'application/zip',
  });
  await downloadFile(blob, 'nft.zip');
};
const collectZip = async () => {
  const zip = new JSZip();
  const files = getFiles();
  const metaversefile = files.find(file => file.name === '.metaversefile');
  const metaversefileJson = JSON.parse(metaversefile.doc.getValue());
  const {start_url} = metaversefileJson;
  // console.log('got start url', start_url);
  const startUrlFile = files.find(file => file.name === start_url);
  if (startUrlFile) {
    if (startUrlFile.doc) {
      startUrlFile.blob = new Blob([startUrlFile.doc.getValue()], {
        type: 'application/javascript',
      });
    }
    startUrlFile.blob.name = start_url;
    const urlCache = await fetchAndCompileBlob(startUrlFile.blob, files);
    for (const name in urlCache) {
      const value = urlCache[name];
      const file = files.find(file => file.name === name);
      if (file) {
        /* if (file.doc) {
          file.doc.setValue(value);
        } */
        file.blob = new Blob([value], {
          type: 'application/javascript',
        });
      } else {
        console.warn('could not find compiled file updat target', {files, name, urlCache});
      }
    }
    // console.log('compiled', startUrlFile.blob, urlCache);
    // startUrlFile.blob = ;
  } else {
    console.warn('could not find start file');
  }
  for (const file of files) {
    zip.file(file.name, file.blob);
  }
  const ab = await zip.generateAsync({
    type: 'arraybuffer',
  });
  // console.log('got b', ab);
  const uint8Array = new Uint8Array(ab);
  return uint8Array;
};
const uploadHash = async () => {
  // console.log('collect zip 1');
  const zipData = await collectZip();
  // console.log('collect zip 2');
  const files = await fetchZipFiles(zipData);
  const hash = await uploadFiles(files);
  // console.log('got hash', hash);
  return hash;
};
const run = async () => {
  const hash = await uploadHash();
  // console.log('load hash', hash);
  // const el = await loadModule(u);
  await loadHash(hash);
};
let loadedObject = null;
const loadHash = async hash => {
  if (loadedObject) {
    await world.removeObject(loadedObject.instanceId);
    loadedObject = null;
  }

  const u = `${storageHost}/ipfs/${hash}/.metaversefile`;
  const position = new THREE.Vector3();
  const quaternion  = new THREE.Quaternion();
  loadedObject = await world.addObject(u, null, position, quaternion, {
    // physics,
    // physics_url,
    // autoScale,
  });
  loadedObject.name = loadedObject.contentId.match(/([^\/]*)$/)[1];
};
const mintNft = async () => {
  const hash = await uploadHash();
  console.log('upload nft', hash);
  window.location.href = `https://webaverse.com/mint?hash=${hash}&ext=metaversefile`;
};

window.onload = async () => {

const bindTextarea = codeEl => {
  const editor = CodeMirror.fromTextArea(codeEl, {
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    lineWrapping: true,
    extraKeys: {
      'Ctrl-S': async cm => {
        try {
          await run();
        } catch (err) {
          console.warn(err);
          const errors = [err].concat(getErrors());
          setErrors(errors);
        }
      },
      'Ctrl-L': async cm => {
        try {
          await mintNft();
        } catch (err) {
          console.warn(err);
          const errors = [err].concat(getErrors());
          setErrors(errors);
        }
      },
    },
  });
  {
    const stopPropagation = e => {
      e.stopPropagation();
    };
    [
      'wheel',
      'keydown',
      'keypress',
      'keyup',
      'paste',
    ].forEach(n => {
      editor.display.wrapper.addEventListener(n, stopPropagation);
    });
  }
  // console.log('got editor', editor);
  editor.setOption('theme', 'material');
  // editor.setOption('theme', 'material-ocean');
  // editor.setOption('theme', 'icecoder');
  /* editor.on('keydown', e => {
    if (e.ctrlKey && e.which === 83) { // ctrl-s
      console.log('got save', e);
      e.preventDefault();
    }
  }); */
  return editor;
};
{
  const container = document.getElementById('container');
  
  const jsx = `
    (() => {
      const width = 50;
      const defaultServers = [
        {
          name: 'magic land',
        },
        {
          name: 'lollercopter landing pad',
        },
      ];
      
      const getDocFromFile = async (blob, name) => {
        let doc;
        if (/\.(?:html|js|metaversefile|rtf.js|t.js|txt|jsx)$/.test(name)) {
          const text = await blob.text();
          doc = new CodeMirror.Doc(text, 'javascript');
        } else {
          doc = null;
        }
        return doc;
      };
      const FileInput = ({
        className,
        file,
        setFile,
        children,
      }) => {
        return (
          <div className={'file-input ' + className}>
            {children}
            <input type="file" placeholder="File" onChange={e => {
              const files = Array.from(e.target.files);
              if (files.length > 0) {
                setFile(files[0]);
              } else {
                setFile(null);
              }
            }} />
          </div>
        );
      };
      const Search = React.memo(({
        q,
        setQ,
        onEnter,
      }) => {
        return (
          <label className="search">
            <img className="search-image" src="/assets/search.svg" />
            <input
              type="text"
              value={q}
              onChange={e => {
                setQ(e.target.value);
              }}
              onKeyDown={e => {
                if (e.which === 13) {
                  onEnter && onEnter(e, {q});
                }
              }}
            />
          </label>
        );
      });
      const User = () => {
        return (
          <div className="user">
            <img src="https://preview.exokit.org/[https://webaverse.github.io/assets/sacks3.vrm]/preview.png" className="img" />
            <div className="name">avaer</div>
          </div>
        );
      };
      const Textarea = React.memo(props => {
        const {setEditor} = props;
        
        const el = useRef();
        useEffect(() => {
          // el.current.innerHTML = s;
          const editor = bindTextarea(el.current);
          setEditor(editor);
        }, []);
        
        return (
          <textarea className="section code" ref={el} id="code"></textarea>
        );
      });
      const Dropdown = ({
        options,
        selectedOption,
        setSelectedOption,
      }) => {
        return (
          <select className="select" name="nfttype" id="nfttype" value={selectedOption} onChange={e => {
            // console.log('got change', e);
            setSelectedOption(e.target.value);
          }}>
            {options.map((o, i) => {
              return (
                <option
                  value={o}
                  key={i}
                >{o}</option>
              );
            })}
          </select> 
        );
      };
      const Editor = React.memo(({open, files, setFiles, selectedTab, selectedFileIndex, setSelectedFileIndex, templateOptions, selectedTemplateOption, setSelectedTemplateOption, setEditor, errors}) => {
        const [fileRenameIndex, setFileRenameIndex] = useState(-1);
        const [fileRenameName, setFileRenameName] = useState('');
        const [file, setFile] = useState(null);
        
        useEffect(async () => {
          if (file) {
            // console.log('got file', file);
            const {name} = file;
            const doc = await getDocFromFile(file, name);
            const files = getFiles();
            const newFiles = files.concat({
              name,
              doc,
            });
            setFiles(newFiles);
            setFile(null);
          }
        }, [file]);
        
        return (
          <Fragment>
            <div className={['editor', 'page', open ? 'open' : '', 'sections'].join(' ')}>
              <div className="left">
                <div className="top">
                  <div className="header">
                    <div className="super">Template</div>
                    <Dropdown
                      options={templateOptions}
                      selectedOption={selectedTemplateOption}
                      setSelectedOption={setSelectedTemplateOption}
                    />
                  </div>
                </div>
                <div className="bottom">
                  <div className="label">Files</div>
                  <div className="files">
                    {files.map((file, i) => {
                      return (fileRenameIndex === i ?
                        <input
                          type="text"
                          className="file-rename"
                          value={fileRenameName}
                          onChange={e => {
                            setFileRenameName(e.target.value);
                          }}
                          onKeyDown={e => {
                            console.log('got which', e.which);
                            if (e.which === 13) {
                              setFileRenameIndex(-1);
                            } else if (e.which === 27) {
                              setFileRenameIndex(-1);
                            }
                          }}
                          key={i}
                        />
                      :
                        <div
                          className={['file', selectedFileIndex === i ? 'selected' : ''].join(' ')}
                          onClick={e => setSelectedFileIndex(i)}
                          tabIndex={-1}
                          onKeyDown={e => {
                            if (e.which === 46) {
                              let newFiles = getFiles();
                              newFiles = newFiles.slice();
                              newFiles.splice(i, 1);
                              setFiles(newFiles);
                            }
                          }}
                          key={i}
                        >
                          <div className="file-inner">
                            <span className="text">{file.name}</span>
                            <nav className="rename-icon" onClick={e => {
                              e.stopPropagation();
                              setFileRenameName(file.name);
                              setFileRenameIndex(i);
                            }}>
                              <img src="/assets/pencil.svg" className="img" />
                            </nav>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="header footer">
                    <button className="button" onClick={e => {
                      const newFiles = files.concat({
                        name: 'untitled',
                        doc: new CodeMirror.Doc('', 'javascript'),
                      });
                      setFiles(newFiles);
                    }}>
                      <img src="/assets/noun_Plus_950.svg" className="icon" />
                      <div className="label">New file</div>
                    </button>
                    <FileInput
                      className="button"
                      file={file}
                      setFile={setFile}
                    >
                      <img src="/assets/upload.svg" className="icon" />
                      <div className="label">Upload...</div>
                    </FileInput>
                  </div>
                </div>
              </div>
              <div className="right">
                <div className="top">
                  <div className="header">
                    <button className="button" onClick={() => run()}>
                      <img src="/assets/comet-spark.svg" className="icon" />
                      <div className="label">Run code</div>
                    </button>
                    <button className="button" onClick={() => mintNft()}>
                      <img src="/assets/mint.svg" className="icon" />
                      <div className="label">Mint NFT</div>
                    </button>
                    <button className="button" onClick={downloadZip}>
                      <img src="/assets/download.svg" className="icon" />
                      <div className="label">Download zip</div>
                    </button>
                  </div>
                </div>
                <div className="bottom">
                  <Textarea
                    setEditor={setEditor}
                  />
                </div>
                <div className="errors">
                  {errors.map((error, i) => {
                    return (
                      <div className="error" key={i}>
                        <nav className="x-icon" onClick={e => {
                          let errors = getErrors();
                          errors = errors.slice();
                          errors.splice(i, 1);
                          setErrors(errors);
                        }}>
                          <img src="/assets/x.svg" className="img" />
                        </nav>
                        <div className="text">{error.stack}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Fragment>
        );
      });
      const MiniCard = React.memo(({
        // url,
        img,
        name,
        hash,
        ext,
      }) => {
        // console.log('render url', {url, img, name});
        return (
          <nav
            className="card"
            onDragStart={e => {
              const j = {
                hash,
                ext,
              };
              e.dataTransfer.setData('application/json', JSON.stringify(j));
              console.log('drag start', e);
            }}
            draggable
          >
            <div className="inner">
              <img src={img} className="img" />
              <div className="name">{name}</div>
            </div>
          </nav>
        );
      });
      const Scene = React.memo(({objects, setObjects, open, selectedObjectIndex, setSelectedObjectIndex, selectedObject}) => {
        const [px, setPX] = useState(0);
        const [py, setPY] = useState(0);
        const [pz, setPZ] = useState(0);
        const [rx, setRX] = useState(0);
        const [ry, setRY] = useState(0);
        const [rz, setRZ] = useState(0);
        const [rw, setRW] = useState(0);
        const [sx, setSX] = useState(1);
        const [sy, setSY] = useState(1);
        const [sz, setSZ] = useState(1);
        const [objectRenameName, setObjectRenameName] = useState('');
        const [objectRenameIndex, setObjectRenameIndex] = useState(-1);
        
        useEffect(() => {
          if (selectedObject) {
            setPX(selectedObject.position.x);
            setPY(selectedObject.position.y);
            setPZ(selectedObject.position.z);
            
            setRX(selectedObject.quaternion.x);
            setRY(selectedObject.quaternion.y);
            setRZ(selectedObject.quaternion.z);
            setRW(selectedObject.quaternion.w);
            
            setSX(selectedObject.scale.x);
            setSY(selectedObject.scale.y);
            setSZ(selectedObject.scale.z);
          }
        }, [selectedObject]);
        
        useEffect(() => {
          // console.log('update selected object', selectedObject);
          
          if (selectedObject) {
            const oldMatrix = localMatrix.copy(selectedObject.matrixWorld);
            
            selectedObject.position.set(px, py, pz);
            selectedObject.quaternion.set(rx, ry, rz, rw);
            selectedObject.scale.set(sx, sy, sz);
            selectedObject.updateMatrixWorld();
            const newMatrix = localMatrix2.copy(selectedObject.matrixWorld);

            if (selectedObject.getPhysicsIds) {
              const physicsIds = selectedObject.getPhysicsIds();
              for (const physicsId of physicsIds) {
                const physicsTransform = physicsManager.getPhysicsTransform(physicsId);

                const oldTransformMatrix = localMatrix3.compose(physicsTransform.position, physicsTransform.quaternion, physicsTransform.scale);
                oldTransformMatrix.clone()
                  .premultiply(oldMatrix.invert())
                  .premultiply(newMatrix)
                  .decompose(localVector, localQuaternion, localVector2);
                physicsManager.setPhysicsTransform(physicsId, localVector, localQuaternion, localVector2);
              }
            }

            selectedObject.setPose(
              localVector.copy(selectedObject.position),
              localQuaternion.copy(selectedObject.quaternion),
              localVector2.copy(selectedObject.scale)
            );
          }
        }, [
          px, py, pz,
          rx, ry, rz, rw,
          sx, sy, sz,
        ]);
        const object = objects[selectedObjectIndex];
        
        return (
          <div className={['scene', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <div className="left">
              <div className="label">Objects</div>
              <div className="objects">
                {objects.map((object, i) => {
                  return (objectRenameIndex === i ?
                    <input
                      type="text"
                      className="object-rename"
                      value={objectRenameName}
                      onChange={e => {
                        setObjectRenameName(e.target.value);
                      }}
                      onKeyDown={e => {
                        if (e.which === 13) {
                          setObjectRenameIndex(-1);
                        } else if (e.which === 27) {
                          setObjectRenameIndex(-1);
                        }
                      }}
                      key={i}
                    />
                  :
                    <div
                      className={['object', selectedObjectIndex === i ? 'selected' : ''].join(' ')}
                      onClick={e => setSelectedObjectIndex(i)}
                      tabIndex={-1}
                      onKeyDown={e => {
                        if (e.which === 46) {
                          if (object) {
                            world.removeObject(object.instanceId);
                          }
                        }
                      }}
                      key={i}
                    >
                      <div className="object-inner">
                        <span className="text">{object.name}</span>
                        <nav className="rename-icon" onClick={e => {
                          e.stopPropagation();
                          setObjectRenameName(object.name);
                          setObjectRenameIndex(i);
                        }}>
                          <img src="/assets/pencil.svg" className="img" />
                        </nav>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="right">
              <div className="details">
                {object ?
                  <Fragment>              
                    <div className="left">
                      <div className="label">Position</div>
                      <label className="row">
                        <span className="sublabel">X</span>
                        <input type="number" className="value" value={px} onChange={e => {
                          setPX(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                      <label className="row">
                        <span className="sublabel">Y</span>
                        <input type="number" className="value" value={py} onChange={e => {
                          setPY(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                      <label className="row">
                        <span className="sublabel">Z</span>
                        <input type="number" className="value" value={pz} onChange={e => {
                          setPZ(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                      
                      <div className="label">Rotation</div>
                      <label className="row">
                        <span className="sublabel">X</span>
                        <input type="number" className="value" value={rx} onChange={e => {
                          setRX(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                      <label className="row">
                        <span className="sublabel">Y</span>
                        <input type="number" className="value" value={ry} onChange={e => {
                          setRY(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                      <label className="row">
                        <span className="sublabel">Z</span>
                        <input type="number" className="value" value={rz} onChange={e => {
                          setRZ(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                      <label className="row">
                        <span className="sublabel">W</span>
                        <input type="number" className="value" value={rw} onChange={e => {
                          setRW(e.target.value);
                          // updateObject();
                       }} />
                      </label>
                      
                      <div className="label">Scale</div>
                      <label className="row">
                        <span className="sublabel">X</span>
                        <input type="number" className="value" value={sx} onChange={e => {
                          setSX(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                      <label className="row">
                        <span className="sublabel">Y</span>
                        <input type="number" className="value" value={sy} onChange={e => {
                          setSY(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                      <label className="row">
                        <span className="sublabel">Z</span>
                        <input type="number" className="value" value={sz} onChange={e => {
                          setSZ(e.target.value);
                          // updateObject();
                        }} />
                      </label>
                    </div>
                    <div className="right" onClick={e => {
                      // console.log('remove', object, selectedObjectIndex);
                      if (object) {
                        world.removeObject(object.instanceId);
                      }
                    }}>
                      <div className="label">Actions</div>
                      <button className="button warning">Remove</button>
                    </div>
                  </Fragment>
                : null}
              </div>
            </div>
          </div>
        );
      });
      const Library = React.memo(({cards, open, q, setQ, setCurrentQ, searchResults, setSearchResults}) => {
        return (
          <div className={['library', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <Search
              q={q}
              setQ={setQ}
              onEnter={(e, {q}) => {
                setCurrentQ(q);
                // console.log('get search', {q});
              }}
            />
            <div className="cards">
              {(searchResults || cards).map((card, i) => {
                const img = "https://card-preview.exokit.org/?w=" + Math.floor(width * window.devicePixelRatio) + "&ext=jpg&t=" + card.id;
                return (
                  <MiniCard
                    img={img}
                    name={card.name}
                    hash={card.hash}
                    ext={card.ext}
                    key={i}
                  />
                );
              })}
            </div>
          </div>
        );
      });
      const Multiplayer = React.memo(({open, servers, selectedServerIndex, setSelectedServerIndex, connectingServerIndex, setConnectingServerIndex}) => {
        return (
          <div className={['multiplayer', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <div className="label">Servers</div>
            <div className="servers">
              {servers.map((server, i) => {
                return (
                  <div
                    className={['server', selectedServerIndex === i ? 'selected' : ''].join(' ')}
                    onClick={e => setSelectedServerIndex(i)}
                    key={i}
                  >
                    <img src="/assets/circuitry.svg" className="icon" />
                    <div className="name">{server.name}</div>
                    {connectingServerIndex !== i ?
                      <button
                        className="button connect"
                        onClick={async e => {
                          setConnectingServerIndex(i);
                          
                          const tryConnect = async server => {
                            const {publicIp, privateIp, port} = server;
                            await world.connectRoom('room', publicIp + ':' + port);
                          };
   
                          const res = await fetch('https://127.0.0.1:1112/');
                          const j = await res.json();
                          const server = j[i];
                          if (server) {
                            console.log('trying to connect...');
                            await tryConnect(server);
                          } else {
                            console.log('creating server...');
                            const res2 = await fetch('https://127.0.0.1:1112/' + i, {
                              method: 'post',
                            });
                            const j = await res2.json();
                          }                            
                        }}
                      >Connect</button>
                    :
                      <button
                        className="button"
                        onClick={e => {
                          setConnectingServerIndex(-1);
                        }}
                      >Connecting...</button>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        );
      });
      const Settings = React.memo(({open}) => {
        return (
          <div className={['settings', 'page', open ? 'open' : '', 'sections'].join(' ')}>
            <label>
              <input type="checkbox" />
              <span className="label">Green screen</span>
            </label>
          </div>
        );
      });
      
      return () => {
        const [open, setOpen] = useState(true);
        const [selectedTab, setSelectedTab] = useState('editor');
        const [cards, setCards] = useState([]);
        const [searchResults, setSearchResults] = useState(null);
        const [objects, setObjects] = useState([]);
        const [selectedFileIndex, setSelectedFileIndex] = useState(0);
        const [selectedObjectIndex, setSelectedObjectIndex] = useState(-1);
        const [q, setQ] = useState('');
        const [currentQ, setCurrentQ] = useState('');
        const [lastQ, setLastQ] = useState('');
        const [templateOptions, setTemplateOptions] = useState([]);
        const [selectedTemplateOption, setSelectedTemplateOption] = useState();
        const [files, setFiles] = useState([]);
        const [editor, setEditor] = useState(null);
        const [errors, localSetErrors] = useState([]);
        const [firstRun, setFirstRun] = useState(false);
        const [secondRun, setSecondRun] = useState(true);
        const [servers, setServers] = useState(defaultServers);
        const [selectedServerIndex, setSelectedServerIndex] = useState(0);
        const [connectingServerIndex, setConnectingServerIndex] = useState(-1);
        const [isXrSupported, setIsXrSuported] = useState(false);
        
        getEditor = () => editor;
        getFiles = () => files;
        getSelectedFileIndex = () => selectedFileIndex;
        getErrors = () => errors;
        setErrors = localSetErrors;
        
        // console.log('set objects', objects);
        
        useEffect(async () => {
          const res = await fetch('https://tokens.webaverse.com/1-100');
          const j = await res.json();
          setCards(j);
        }, []);
        
        useEffect(async () => {
          const objects = world.getObjects();
          setObjects(objects);
          
          const _objectsupdate = e => {
            const objects = world.getObjects();
            setObjects(objects);
          };
          world.addEventListener('objectsadd', _objectsupdate);
          world.addEventListener('objectsremove', _objectsupdate);
          return () => {
            world.removeEventListener('objectsadd', _objectsupdate);
            world.removeEventListener('objectsremove', _objectsupdate);
          };
        }, []);

        useEffect(() => {
          if (currentQ !== lastQ) {
            setLastQ(currentQ);

            if (currentQ) {
              setQ(currentQ);
              (async () => {      
                const res = await fetch('https://tokens.webaverse.com/search?q=' + currentQ);
                const tokens = await res.json();
                setSearchResults(tokens);
              })().catch(err => {
                console.warn(err);
              });
            } else {
              setQ('');
              setSearchResults(null);
            }
          }
        }, [currentQ, lastQ]);
        
        useEffect(async () => {
          const res = await fetch('https://templates.webaverse.com/index.json');
          const j = await res.json();
          const {templates} = j;
          console.log('got templates', templates);
          setTemplateOptions(templates);
          setSelectedTemplateOption(templates[0]);
        }, []);
        
        useEffect(async () => {
          if (editor && selectedTemplateOption) {
            const filesSrc = await ghDownload('https://github.com/webaverse/templates/tree/main/' + selectedTemplateOption);
            
            const files = await Promise.all(filesSrc.map(async file => {
              const {path: name, blob} = file;
              const doc = await getDocFromFile(blob, name);
              return {
                name,
                blob,
                doc,
              };
            }));
            
            setFiles(files);
            setSelectedFileIndex(0);
            if (firstRun) {
              setSecondRun(false);
            }
          }
        }, [editor, selectedTemplateOption]);
        
        useEffect(async () => {
          if (editor) {
            const file = files[selectedFileIndex];
            if (file) {
              if (file.doc) {
                editor.swapDoc(file.doc);
                editor.display.wrapper.style.visibility = null;
              } else {
                editor.display.wrapper.style.visibility = 'hidden';
              }
            } else {
              editor.display.wrapper.style.visibility = 'hidden';
            }
          }
        }, [editor, files, selectedFileIndex]);
        
        useEffect(() => {
          if (!firstRun && editor && files.length > 0) {
            // console.log('run files 1', files.slice());
            setFirstRun(true);
            run();
          }
        }, [firstRun, editor, files]);
        useEffect(() => {
          console.log('run files', secondRun, files.slice());
          if (!secondRun && editor && files.length > 0) {
            setSecondRun(true);
            run();
          }
        }, [secondRun, editor, files]);
        
        useEffect(() => {
          const object = objects[selectedObjectIndex] || null;
          transformControls.bind(object);
          if (object && transformControls.getTransformMode() === 'disabled') {
            transformControls.setTransformMode('translate');
          }
        }, [objects, objects.length, selectedObjectIndex]);
        
        useEffect(async () => {
          const ok = await app.isXrSupported();
          setIsXrSuported(ok);
        }, []);
        
        return <div className="root">
          <div className="left">
            <div className="top">
              <div className="canvas-placeholder">
                <canvas id="canvas" className="canvas" />
              </div>
            </div>
            <div className="bottom"></div>
          </div>
          <div className="right">
            <div className="controls">
              <div className="top">
                {/* <div className="control">
                  <User />
                </div> */}
              </div>
              <div className="bottom">
                {/* <div className="control" onClick={() => reset()}>
                  <img src="/assets/new-shoot.svg" className="icon" />
                  <div className="label">Reset</div>
                </div> */}
                <div className="control" onClick={() => setCameraMode('firstperson')}>
                  {/* <video
                    src="https://preview.exokit.org/[https://webaverse.github.io/assets/sacks3.vrm]/preview.webm"
                    className="video"
                    autoPlay
                    muted
                    loop
                  /> */}
                  <img src="/assets/video-camera.svg" className="icon" />
                  <div className="label">Camera</div>
                </div>
                <div className="control" onClick={() => setCameraMode('avatar')}>
                  <img src="/assets/teleport.svg" className="icon" />
                  <div className="label">Avatar</div>
                </div>
                <div className="control enter-xr-button" disabled={!isXrSupported} onClick={() => {
                  app.enterXr();
                }}>
                  <img src="/assets/protection-glasses.svg" className="icon" />
                  <div className="label">VR</div>
                </div>
              </div>
            </div>
            <div className="right">
              <div className="header">
                <nav className={['tab', selectedTab === 'editor' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('editor')}>
                  <div className="label">Editor</div>
                </nav>
                <nav className={['tab', selectedTab === 'scene' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('scene')}>
                  <div className="label">Scene</div>
                </nav>
                <nav className={['tab', selectedTab === 'library' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('library')}>
                  <div className="label">Library</div>
                </nav>
                <nav className={['tab', selectedTab === 'multiplayer' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('multiplayer')}>
                  <div className="label">Multiplayer</div>
                </nav>
                <nav className={['tab', selectedTab === 'settings' ? 'selected' : ''].join(' ')} onClick={e => setSelectedTab('settings')}>
                  <div className="label">Settings</div>
                </nav>
                <User />
              </div>
              <Editor
                open={selectedTab === 'editor'}
                files={files}
                setFiles={setFiles}
                selectedTab={selectedTab}
                selectedFileIndex={selectedFileIndex}
                setSelectedFileIndex={setSelectedFileIndex}
                templateOptions={templateOptions}
                selectedTemplateOption={selectedTemplateOption}
                setSelectedTemplateOption={setSelectedTemplateOption}
                setEditor={setEditor}
                errors={errors}
              />
              <Scene
                open={selectedTab === 'scene'}
                objects={objects}
                setObjects={setObjects}
                selectedObjectIndex={selectedObjectIndex}
                setSelectedObjectIndex={setSelectedObjectIndex}
                selectedObject={objects[selectedObjectIndex]}
              />
              <Library
                cards={cards}
                open={selectedTab === 'library'}
                objects={objects}
                q={q}
                setQ={setQ}
                setCurrentQ={setCurrentQ}
                searchResults={searchResults}
                setSearchResults={setSearchResults}
              />
              <Multiplayer
                servers={servers}
                open={selectedTab === 'multiplayer'}
                selectedServerIndex={selectedServerIndex}
                setSelectedServerIndex={setSelectedServerIndex}
                connectingServerIndex={connectingServerIndex}
                setConnectingServerIndex={setConnectingServerIndex}
              />
              <Settings
                open={selectedTab === 'settings'}
              />
            </div>
          </div>
        </div>
      };
    })()
  `;
  const reset = () => {
    console.log('reset');
  };
  let cameraMode = 'camera';
  const setCameraMode = newCameraMode => {
    cameraMode = newCameraMode;
    console.log('got new camera mode', {cameraMode});
    if (cameraMode === 'avatar') {
      app.setAvatarUrl(`https://webaverse.github.io/assets/sacks3.vrm`, 'vrm');
    } else {
      app.setAvatarUrl(null);
    }
  };
  const spec = Babel.transform(jsx, {
    presets: ['react'],
    // compact: false,
  });
  const {code} = spec;
  // console.log('got code', code);
  const fn = eval(code);
  // console.log('got fn', fn);
  
  ReactDOM.render(
    React.createElement(fn),
    container
  );
}

const app = new App();
// app.bootstrapFromUrl(location);
app.bindLogin();
app.bindInput();
app.bindInterface();
const canvas = document.getElementById('canvas');
app.bindCanvas(canvas);
/* const uploadFileInput = document.getElementById('upload-file-input');
app.bindUploadFileInput(uploadFileInput);
const mapCanvas = document.getElementById('map-canvas')
app.bindMinimap(mapCanvas);

const enterXrButton = document.getElementById('enter-xr-button');
const noXrButton = document.getElementById('no-xr-button');
app.bindXr({
  enterXrButton,
  noXrButton,
  onSupported(ok) {
    if (ok) {
      enterXrButton.style.display = null;
      noXrButton.style.display = 'none';
    }
  },
}); */
app.waitForLoad()
  .then(async () => {
    app.contentLoaded = true;
    app.startLoop();
    
    // hacks
    const scene = app.getScene();
      
    const g = new CameraGeometry();
    const m = new THREE.MeshBasicMaterial({
      color: 0x333333,
    });
    const cameraMesh = new THREE.Mesh(g, m);
    cameraMesh.position.set(0, 2, -5);
    cameraMesh.frustumCulled = false;
    scene.add(cameraMesh);

    const uiMesh = _makeUiMesh();
    uiMesh.position.set(0, 2, -5);
    uiMesh.frustumCulled = false;
    scene.add(uiMesh);

    const inventoryMesh = _makeInventoryMesh();
    inventoryMesh.position.set(0, 1.2, -1);
    inventoryMesh.frustumCulled = false;
    scene.add(inventoryMesh);
    app.addEventListener('frame', () => {
      inventoryMesh.update();
    });
    
    const _makeSilkMesh = () => {
      // const velocity = v.clone();
      // let grounded = false;
      
      const sphere = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.05, 0.1, 10, 10, 10), new THREE.MeshNormalMaterial());
      // sphere.position.copy(p);
      const defaultScale = new THREE.Vector3(1, 0.3, 1).multiplyScalar(0.5);
      sphere.scale.copy(defaultScale);
      scene.add(sphere);
      const o = sphere;

      const startTime = Date.now();
      let lastTimestamp = startTime;
      let animation = null;
      const timeOffset = Math.random() * 10;
      o.update = () => {
        const now = Date.now();
        const timeDiff = (now - lastTimestamp) / 1000;
        lastTimestamp = now;

        const time = timeOffset + performance.now() * 0.002;
        const k = 1;
        for (var i = 0; i < sphere.geometry.attributes.position.array.length; i += 3) {
          const p = localVector.fromArray(sphere.geometry.attributes.position.array, i);
          const f = 0.5 + 0.2 * simplex.noise3D(p.x * k + time, p.y * k, p.z * k);
          p.normalize().multiplyScalar(f);
          p.toArray(sphere.geometry.attributes.position.array, i);
        }
        sphere.geometry.attributes.position.needsUpdate = true;
        sphere.geometry.computeVertexNormals();
        sphere.geometry.normalsNeedUpdate = true;
        sphere.geometry.verticesNeedUpdate = true;
      };
      return o;
    };
    const silkMesh = _makeSilkMesh();
    silkMesh.position.set(0, 1.2, -2);
    scene.add(silkMesh);
    app.addEventListener('frame', () => {
      silkMesh.update();
    });
    
    const defaultScene = [
      {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        u: `https://avaer.github.io/home/home.glb`,
      },
      {
        position: new THREE.Vector3(-3, 0, -2),
        quaternion: new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, -1),
          new THREE.Vector3(-1, 0, 0),
        ),
        u: `https://webaverse.github.io/assets/table.glb`,
      },
      {
        position: new THREE.Vector3(2, 0, -3),
        quaternion: new THREE.Quaternion()/* .setFromUnitVectors(
          new THREE.Vector3(0, 0, -1),
          new THREE.Vector3(-1, 0, 0),
        ) */,
        u: `https://avaer.github.io/mirror/index.js`,
      },
      /* {
        position: new THREE.Vector3(-3, 1.5, -1),
        quaternion: new THREE.Quaternion(),
        u: `https://avaer.github.io/lightsaber/manifest.json`,
      },
      {
        position: new THREE.Vector3(-3, 1.5, -2),
        quaternion: new THREE.Quaternion(),
        u: `https://avaer.github.io/hookshot/index.js`,
      }, */
    ];
    for (const e of defaultScene) {
      const {position, quaternion, u} = e;
      const loadedObject = await world.addObject(u, null, position, quaternion, {
        // physics,
        // physics_url,
        // autoScale,
      });
      loadedObject.name = u.match(/([^\/]*)$/)[1];
    }
  });

// make sure to update renderer when canvas size changes
const ro = new ResizeObserver(entries => {
  const resizeEvent = new UIEvent('resize');
  window.dispatchEvent(resizeEvent);
});
ro.observe(canvas);

const renderer = app.getRenderer();
const scene = app.getScene();
const camera = app.getCamera();

// console.log('got react three fiber', ReactThreeFiber);

};