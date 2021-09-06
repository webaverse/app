import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import React from 'react';
const {Fragment, useState, useEffect, useRef} = React;
import ReactDOM from 'react-dom';
import ReactThreeFiber from '@react-three/fiber';
import Babel from 'babel-standalone';
import JSZip from 'jszip';
// import {jsx} from 'jsx-tmpl';
import {world} from './world.js';
import transformControls from './transform-controls.js';
import physicsManager from './physics-manager.js';
import weaponsManager from './weapons-manager.js';
import cameraManager from './camera-manager.js';
import {rigManager} from './rig.js';
import controlsManager from './controls-manager.js';
import {downloadFile, getExt, flipGeomeryUvs, updateRaycasterFromMouseEvent, getCameraUiPlane, getUiForwardIntersection} from './util.js';
import App from './app.js';
import {camera, getRenderer} from './app-object.js';
import {CapsuleGeometry} from './CapsuleGeometry.js';
import HtmlRenderer from 'https://html-render.webaverse.com/html-render-api.js';
import {storageHost, tokensHost} from './constants.js';
import runtime from './runtime.js';
import Avatar from './avatars/avatars.js';
import {RigAux} from './rig-aux.js';
import easing from './easing.js';
import ghDownloadDirectory from './gh-download-directory.js';
import Simplex from './simplex-noise.js';
import grass from './grass.js';

weaponsManager.editorHack = true;

const cubicBezier = easing(0, 1, 0, 1);
// const cubicBezier2 = v => cubicBezier(cubicBezier(v));
const ghDownload = ghDownloadDirectory.default;
// window.ghDownload = ghDownload;
const htmlRenderer = new HtmlRenderer();
const gltfLoader = new GLTFLoader();

class MultiSimplex {
  constructor(seed, octaves) {
    const simplexes = Array(octaves);
    for (let i = 0; i < octaves; i++) {
      simplexes[i] = new Simplex(seed + i);
    }
    this.simplexes = simplexes;
  }
  noise2D(x, z) {
    let result = 0;
    for (let i = 0; i < this.simplexes.length; i++) {
      const simplex = this.simplexes[i];
      result += simplex.noise2D(x * (2**i), z * (2**i));
    }
    // result /= this.simplexes.length;
    return result;
  }
}

class GlobalState {
  constructor() {
    this.specs = {};
  }
  useState(key, initialValue) {
    const result = useState(initialValue);
    const [value, setter] = result;
    this.specs[key] = {
      value,
      setter,
    };
    return result;
  }
  get(key) {
    const spec = this.specs[key];
    if (spec) {
      return spec.value;
    } else {
      throw new Error('setting nonexistent state: ' + key);
    }
  }
  set(key, value) {
    const spec = this.specs[key];
    if (spec) {
      spec.setter(value);
    } else {
      throw new Error('setting nonexistent state: ' + key);
    }
  }
}
const globalState = new GlobalState();

const testImgUrl = window.location.protocol + '//' + window.location.host + '/assets/popup3.svg';
const testUserImgUrl = `https://preview.exokit.org/[https://app.webaverse.com/assets/type/robot.glb]/preview.png?width=128&height=128`;

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
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localVector8 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localPlane = new THREE.Plane();
const localBox2D = new THREE.Box2();
const localBox2D2 = new THREE.Box2();
const localRaycaster = new THREE.Raycaster();
const localRay = new THREE.Ray();
const localArray = [];

/* let getSelectedObjectIndex = () => null;
let getErrors = () => null;
let setErrors = () => {}; */

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
const _makeMouseUiMesh = () => {
  const geometry = new THREE.PlaneBufferGeometry(1, 1)
    .applyMatrix4(
      localMatrix.compose(
        localVector.set(1/2, 1/2, 0),
        localQuaternion.set(0, 0, 0, 1),
        localVector2.set(1, 1, 1),
      )
    );
  flipGeomeryUvs(geometry);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    map: new THREE.Texture(),
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.5,
  });
  const model = new THREE.Mesh(geometry, material);
  model.frustumCulled = false;
  
  const m = new THREE.Object3D();
  m.add(model);
  m.target = new THREE.Object3D();
  m.render = async ({
    name,
    tokenId,
    type,
    hash,
    description,
    minterUsername,
    ownerUsername,
    minterAvatarUrl,
    ownerAvatarUrl,
  }) => {
    const result = await htmlRenderer.renderPopup({
      name,
      tokenId,
      type,
      hash,
      description,
      minterUsername,
      ownerUsername,
      imgUrl: testImgUrl,
      minterAvatarUrl,
      ownerAvatarUrl,
    });
    // console.log('got result', result);
    /* const img = await new Promise((accept, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        accept(img);
      };
      img.onerror = reject;
      img.src = `/assets/popup.svg`;
    }); */
    material.map.image = result;
    material.map.minFilter = THREE.THREE.LinearMipmapLinearFilter;
    material.map.magFilter = THREE.LinearFilter;
    material.map.encoding = THREE.sRGBEncoding;
    material.map.anisotropy = 16;
    material.map.needsUpdate = true;
    
    model.scale.set(1, result.height/result.width, 1);
  };
  let animationSpec = null;
  let lastHoverObject = null;
  m.update = () => {
    // model.position.set(model.scale.x/2, model.scale.y/2, 0);
    
    const hoverObject = weaponsManager.getMouseHoverObject();
    
    m.position.copy(m.target.position)
      .add(camera.position);
    m.quaternion.copy(m.target.quaternion);
    m.visible = false; // !!hoverObject;
    
    if (hoverObject !== lastHoverObject) {
      const now = Date.now();
      animationSpec = {
        startTime: now,
        endTime: now + 1000,
      };
      lastHoverObject = hoverObject;
    }
    const _setDefaultScale = () => {
      m.scale.set(1, 1, 1);
    };
    if (animationSpec) {
      const now = Date.now();
      const {startTime, endTime} = animationSpec;
      const f = (now - startTime) / (endTime - startTime);
      if (f >= 0 && f < 1) {
        const fv = cubicBezier(f);
        m.scale.set(1, fv, 1);
        model.material.opacity = fv;
      } else {
        _setDefaultScale();
      }
    } else {
      _setDefaultScale();
    }
  };
  
  const name = 'shiva';
  const tokenId = 42;
  const type = 'vrm';
  let hash = 'Qmej4c9FDJLTeSFhopvjF1f3KBi43xAk2j6v8jrzPQ4iRG';
  hash = hash.slice(0, 6) + '...' + hash.slice(-2);
  const description = 'This is an awesome Synoptic on his first day in Webaverse This is an awesome Synoptic on his first day in Webaverse';
  const minterUsername = 'robo';
  const ownerUsername = 'sacks';
  const minterAvatarUrl = testUserImgUrl;
  const ownerAvatarUrl = testUserImgUrl;
  m.render({
    name,
    tokenId,
    type,
    hash,
    description,
    minterUsername,
    ownerUsername,
    minterAvatarUrl,
    ownerAvatarUrl,
  })
    .then(() => {
      console.log('rendered');
    })
    .catch(err => {
      console.warn(err);
    });
  return m;
};
/* const lineBaseGeometry = new THREE.BoxBufferGeometry(0.005, 0.005, 1);
const lineMaterial = new THREE.MeshBasicMaterial({
  color: 0xFFFFFF,
});
const _makeLineMesh = (object, objectUiMesh, lineLength, lineSubLength) => {
  const start = new THREE.Vector3(0, 0, 0);
  const end = new THREE.Vector3(0, lineLength, 0);
  const geometry = (() => {
    const distance = start.distanceTo(end);
    const geometries = [];
    const v = localVector.copy(start);
    const direction = localVector2.copy(end)
      .sub(start)
      .normalize();
    for (let d = 0; d < distance; d += lineSubLength*2) {
      const intervalStart = v;
      const intervalEnd = localVector3.copy(v)
        .add(
          localVector4.copy(direction)
            .multiplyScalar(lineSubLength*2)
        );
      const intervalMiddle = localVector5.copy(intervalStart)
        .add(intervalEnd)
        .divideScalar(2);      
      
      const g = lineBaseGeometry.clone()
        .applyMatrix4(
          localMatrix.compose(
            intervalMiddle,
            localQuaternion.setFromUnitVectors(
              localVector7.set(0, 0, -1),
              localVector8.copy(intervalEnd)
                .sub(intervalStart)
                .normalize()
            ),
            localVector6.set(1, 1, lineSubLength)
          )
        );
      geometries.push(g);
        
      v.copy(intervalEnd);
    }
    const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    return geometry;
  })();
  const material = lineMaterial;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.update = () => {
    mesh.position.copy(object.position);
    mesh.quaternion.setFromUnitVectors(
      localVector.set(0, 1, 0),
      localVector2.copy(objectUiMesh.position)
        .sub(object.position)
        .normalize()
    );
    mesh.scale.y = object.position
      .distanceTo(objectUiMesh.position) / lineLength;
  };
  mesh.frustumCulled = false;
  return mesh;
}; */
const lineLength = 0;
const lineSubLength = 0.1;
const objectUiMeshGeometry = new THREE.PlaneBufferGeometry(1, 1)
  .applyMatrix4(
    localMatrix.compose(
      localVector.set(1/2, 1/2, 0),
      localQuaternion.set(0, 0, 0, 1),
      localVector2.set(1, 1, 1),
    )
  );
flipGeomeryUvs(objectUiMeshGeometry);
const keySize = 0.3;
const keyRadius = 0.045;
const keyInnerFactor = 0.8;
const keyGeometry = new THREE.PlaneBufferGeometry(keySize, keySize);
const eKeyMaterial = (() => {
  const texture = new THREE.Texture();
  texture.minFilter = THREE.THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 16;
  (async () => {
    const img = await new Promise((accept, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        accept(img);
      };
      img.onerror = reject;
      img.src = './assets/e-key.png';
    });
    texture.image = img;
    texture.needsUpdate = true;
  })();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xFFFFFF,
    depthTest: false,
    transparent: true,
    alphaTest: 0.5,
  });
  return material;
})();
const keyCircleGeometry = createBoxWithRoundedEdges(keySize - keyRadius*2, keySize - keyRadius*2, keyRadius, keyInnerFactor);
const keyCircleMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0x42a5f5),
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
    // uniform vec4 uBoundingBox;
    // varying vec3 vPosition;
    // varying vec3 vNormal;
    varying vec2 vUv;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      vUv = uv;
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;

    #define PI 3.1415926535897932384626433832795

    uniform vec3 uColor;
    uniform float uTime;
    // uniform float uTimeCubic;
    // varying vec3 vPosition;
    // varying vec3 vNormal;
    varying vec2 vUv;

    const float glowDistance = 0.2;
    const float glowIntensity = 0.3;

    void main() {
      vec3 c;
      float angle = mod((atan(vUv.x, vUv.y))/(PI*2.), 1.);
      if (angle <= uTime) {
        c = uColor;
        float angleDiff1 = (1. - min(max(uTime - angle, 0.), glowDistance)/glowDistance)*glowIntensity;
        // float angleDiff2 = min(max(angle - uTime, 0.), glowDistance)/glowDistance;
        // c *= 1. + angleDiff1 + angleDiff2;
        c *= 1. + angleDiff1;
      } else {
        c = vec3(0.2);
      }
      gl_FragColor = vec4(c, 1.);
    }
  `,
  transparent: true,
  depthTest: false,
  // polygonOffset: true,
  // polygonOffsetFactor: -1,
  // polygonOffsetUnits: 1,
});
const _makeObjectUiMesh = object => {
  const model = (() => {
    const geometry = objectUiMeshGeometry;
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      map: new THREE.Texture(),
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      alphaTest: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  })();
  
  const keyMesh = (() => {
    const geometry = keyGeometry;
    const material = eKeyMaterial;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  })();
  keyMesh.position.z = 0.01;
  
  const keyCircleMesh = (() => {
    const geometry = keyCircleGeometry;
    const material = keyCircleMaterial.clone();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  })();
  keyCircleMesh.position.z = 0.01;
  
  const m = new THREE.Object3D();
  m.add(model);
  m.add(keyMesh);
  m.keyMesh = keyMesh;
  m.add(keyCircleMesh);
  m.keyCircleMesh = keyCircleMesh;
  m.object = object;
  m.target = new THREE.Object3D();
  m.render = async ({
    name,
    tokenId,
    type,
    hash,
    description,
    previewUrl,
    minterUsername,
    ownerUsername,
    minterAvatarUrl,
    ownerAvatarUrl,
  }) => {
    const result = await htmlRenderer.renderPopup({
      name,
      tokenId,
      type,
      hash,
      description,
      previewUrl,
      minterUsername,
      ownerUsername,
      imgUrl: testImgUrl,
      minterAvatarUrl,
      ownerAvatarUrl,
    });
    const {map} = model.material;
    map.image = result;
    map.minFilter = THREE.THREE.LinearMipmapLinearFilter;
    map.magFilter = THREE.LinearFilter;
    map.encoding = THREE.sRGBEncoding;
    map.anisotropy = 16;
    map.needsUpdate = true;
    
    model.scale.set(1, result.height/result.width, 1);
  };
  let animationSpec = null;
  m.update = () => {
    const now = Date.now();
    
    const _updateMatrix = () => {
      const renderer = getRenderer();
      const e = {
        clientX: canvas.width / renderer.getPixelRatio() / 2,
        clientY: canvas.height / renderer.getPixelRatio() / 2,
      };
      updateRaycasterFromMouseEvent(renderer, camera, e, localRaycaster);
      const cameraUiPlane = getCameraUiPlane(camera, 5, localPlane);
      // cameraUiPlane.normal.multiplyScalar(-1);
      
      const objectPosition = localVector.copy(object.position)
        .add(localVector2.set(0, lineLength, 0));
      
      localRay.set(
        objectPosition,
        localVector2.copy(camera.position)
          .sub(objectPosition)
          .normalize()
      );
      
      const intersection = localRay.intersectPlane(cameraUiPlane, localVector2);
      if (intersection && localRay.direction.dot(cameraUiPlane.normal) > 0) {
        m.position.copy(intersection);
      } else {
        m.position.copy(objectPosition);
      }
      
      localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      m.quaternion.setFromEuler(localEuler);
    };
    _updateMatrix();
    
    const _handleFadeInAnimation = () => {
      const closestObject = weaponsManager.getClosestObject();
      const visible = closestObject === object;
      if (visible !== m.visible) {
        if (visible) {
          const now = Date.now();
          animationSpec = {
            startTime: now,
            endTime: now + 1000,
          };
        } else {
          animationSpec = null;
        }
      }
      m.visible = visible;
    };
    _handleFadeInAnimation();
    
    const _updateFadeInAnimation = () => {
      const _setDefaultScale = () => {
        m.scale.set(1, 1, 1);
      };
      if (animationSpec) {
        const {startTime, endTime} = animationSpec;
        const f = (now - startTime) / (endTime - startTime);
        if (f >= 0 && f < 1) {
          const fv = cubicBezier(f);
          m.scale.set(fv, fv, 1);
          // model.material.opacity = fv;
        } else {
          _setDefaultScale();
          animationSpec = null;
        }
      } else {
        _setDefaultScale();
        animationSpec = null;
      }
    };
    _updateFadeInAnimation();
  };
  
  (async () => {
    let name = '';
    let tokenId = 0;
    let type = '';
    let hash = '';
    let description = '';
    let previewUrl = '';
    let ownerUsername = '';
    let minterUsername = '';
    let ownerAvatarUrl = '';
    let minterAvatarUrl = '';
    const {contentId} = object;
    if (typeof contentId === 'number') {
      const res = await fetch(`${tokensHost}/${contentId}`);
      const j = await res.json();
      // console.log('got json', j);
      name = j.name;
      hash = j.hash;
      hash = hash.slice(0, 6) + '...' + hash.slice(-2);
      type = j.ext;
      description = j.description;
      previewUrl = j.image;
      minterUsername = j.minter.username;
      minterAvatarUrl = j.minter.avatarPreview;
      ownerUsername = j.owner.username;
      ownerAvatarUrl = j.owner.avatarPreview;
    } else if (typeof contentId === 'string') {
      const match = contentId.match(/([^\/]*)$/);
      const tail = match ? match[1] : contentId;
      type = getExt(tail);
      name = type ? tail.slice(0, tail.length - (type.length + 1)) : tail;
      hash = '<url>';
      description = contentId;
    }
    /* console.log('render name', {
      contentId,
      name,
      type,
      hash,
      description,
    }); */
    await m.render({
      name,
      tokenId,
      type,
      hash,
      description,
      previewUrl,
      minterUsername,
      ownerUsername,
      minterAvatarUrl,
      ownerAvatarUrl,
    })
  })()
    .then(() => {
      // console.log('rendered');
    })
    .catch(err => {
      console.warn(err);
    });
  return m;
};
const contextMenuOptions = [
  'New...',
  null,
  'Select',
  'Possess',
  'Edit',
  'Break',
  null,
  'Remove',
];
const realContextMenuOptions = contextMenuOptions.filter(o => !!o);
const _makeContextMenuGeomery = (y, x) => {
  const geometry = new THREE.PlaneBufferGeometry(1, 1)
    .applyMatrix4(
      localMatrix.compose(
        localVector.set(x/2, y/2, 0),
        localQuaternion.set(0, 0, 0, 1),
        localVector2.set(1, 1, 1),
      )
    );
  flipGeomeryUvs(geometry);
  return geometry;
};
const contextMenuGeometries = {
  'top-left': _makeContextMenuGeomery(1, -1),
  'top-right': _makeContextMenuGeomery(1, 1),
  'bottom-left': _makeContextMenuGeomery(-1, -1),
  'bottom-right': _makeContextMenuGeomery(-1, 1),
};
const _makeContextMenuMesh = mouseUiMesh => {
  const material = new THREE.MeshBasicMaterial({
    // color: 0x808080,
    map: new THREE.Texture(),
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.5,
  });
  const model = new THREE.Mesh(contextMenuGeometries['bottom-right'], material);
  model.frustumCulled = false;
  
  let width = 0;
  let height = 0;
  let anchors = null;
  let optionsTextures = [];
  let blankOptionTexture = null;
  (async () => {
    const _getContextMenuData = (options, selectedOptionIndex) =>
      htmlRenderer.renderContextMenu({
        options,
        selectedOptionIndex,
        width: 512,
        height: 480,
      });
    const _makeContextMenuTexture = spec => {
      const {
        width: newWidth,
        height: newHeight,
        imageBitmap,
        anchors: newAnchors,
      } = spec;
      const map = new THREE.Texture(imageBitmap);
      map.minFilter = THREE.THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.encoding = THREE.sRGBEncoding;
      map.anisotropy = 16;
      map.needsUpdate = true;
      return map;
    };
    let results;
    await Promise.all([
      (async () => {
        results = await Promise.all(contextMenuOptions.map(async (object, i) => {
          if (object) {
            return await _getContextMenuData(contextMenuOptions, i);
          } else {
            return null;
          }
        }));
        optionsTextures = results
          .filter((result, i) => contextMenuOptions[i] !== null)
          .map(_makeContextMenuTexture);
      })(),
      (async () => {
        const blankResult = await _getContextMenuData(contextMenuOptions, -1);
        blankOptionTexture = _makeContextMenuTexture(blankResult);
      })(),
    ]);

    material.map = optionsTextures[0];

    const result = results[0];    
    const {
      width: newWidth,
      height: newHeight,
      imageBitmap,
      anchors: newAnchors,
    } = result;
    model.scale.set(1, newHeight / newWidth, 1);
    
    // console.log('anchors', anchors);
    anchors = newAnchors;
    width = newWidth;
    height = newHeight;
  })();
  
  const m = new THREE.Object3D();
  m.add(model);
  let animationSpec = null;
  let lastContextMenu = false;
  
  /* const redElement = document.createElement('div');
  redElement.style.cssText = `\
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    background: #FF0000;
    opacity: 0.5;
    pointer-events: none;
  `;
  document.body.appendChild(redElement);
  // window.redElement = redElement; */
  
  m.update = () => {
    if (weaponsManager.contextMenu && !lastContextMenu) {
      m.position.copy(mouseUiMesh.position);
      m.updateMatrixWorld();

      const renderer = getRenderer();
      const projectVector = v => {
        const canvas = renderer.domElement; 
        v.project(camera);
        v.x = Math.round((0.5 + v.x / 2) * (canvas.width / renderer.getPixelRatio()));
        v.y = Math.round((0.5 - v.y / 2) * (canvas.height / renderer.getPixelRatio()));
        return v;
      };
      const vector = projectVector(localVector.copy(m.position));
      
      const canvasBox = localBox2D.set(
        localVector.set(0, 0, 0),
        localVector2.set(canvas.width / renderer.getPixelRatio(), canvas.height / renderer.getPixelRatio(), 0),
      );
      // console.log('got ratio', width/height, model.scale.y);
      const boundingBox = localBox2D2.set(
        projectVector(localVector.copy(m.position)),
        projectVector(
          localVector2.copy(m.position)
            .add(
              localVector3.set(1, -height/width, 0)
                .applyQuaternion(m.quaternion)
            )
        ),
      );
      
      // try to fit the context menu on the screen
      let overflowX = false;
      let overflowY = false;
      const bboxWidth = boundingBox.max.x - boundingBox.min.x;
      const bboxHeight = boundingBox.max.y - boundingBox.min.y;
      if (boundingBox.max.y > canvasBox.max.y && boundingBox.min.y - bboxHeight >= canvasBox.min.y) {
        boundingBox.min.y -= bboxHeight;
        boundingBox.max.y -= bboxHeight;
        
        /* const e = {
          clientX: boundingBox.min.x,
          clientY: boundingBox.min.y,
        };
        const intersection = getUiForwardIntersection(renderer, camera, e, localVector);
        if (!intersection) {
          throw new Error('could not intersect in front of the camera; the math went wrong');
        }
        m.position.copy(intersection); */
        
        overflowY = true;
      }
      if (boundingBox.max.x > canvasBox.max.x && boundingBox.min.x - bboxWidth >= canvasBox.min.x) {
        boundingBox.min.x -= bboxWidth;
        boundingBox.max.x -= bboxWidth;

        /* updateRaycasterFromMouseEvent(renderer, camera, {
          clientX: boundingBox.min.x,
          clientY: boundingBox.min.y,
        }, localRaycaster);
        
        const intersection = getUiForwardIntersection(renderer, camera, e, localVector);
        if (!intersection) {
          throw new Error('could not intersect in front of the camera; the math went wrong');
        }
        m.position.copy(intersection); */
        
        overflowX = true;
      }
      /* // abandon hope if we cannot fit
      if (overflowX && overflowY) {
        boundingBox.min.x += bboxWidth;
        boundingBox.max.x += bboxWidth;
        boundingBox.min.y += bboxHeight;
        boundingBox.max.y += bboxHeight;
        
        overflowX = false;
        overflowY = false;
      } */
      
      const geometryKey =
        (overflowY ? 'top' : 'bottom') +
        '-' +
        (overflowX ? 'left' : 'right');
      model.geometry = contextMenuGeometries[geometryKey];
      
      /* redElement.style.top = `${boundingBox.min.y}px`;
      redElement.style.left = `${boundingBox.min.x}px`;
      redElement.style.height = `${boundingBox.max.y - boundingBox.min.y}px`;
      redElement.style.width = `${boundingBox.max.x - boundingBox.min.x}px`; */
      
      const now = Date.now();
      animationSpec = {
        startTime: now,
        endTime: now + 1000,
      };
    }
    m.quaternion.copy(mouseUiMesh.quaternion);
    m.visible = weaponsManager.contextMenu;
    lastContextMenu = weaponsManager.contextMenu;
    
    const _setDefaultScale = () => {
      m.scale.set(1, 1, 1);
    };
    if (animationSpec) {
      const now = Date.now();
      const {startTime, endTime} = animationSpec;
      const f = (now - startTime) / (endTime - startTime);
      if (f >= 0 && f < 1) {
        const fv = cubicBezier(f);
        m.scale.set(fv, fv, 1);
        // model.material.opacity = fv;
      } else {
        _setDefaultScale();
        animationSpec = null;
      }
    } else {
      _setDefaultScale();
      animationSpec = null;
    }
  };
  let highlightedIndex = -1;
  m.getHighlightedIndex = () => highlightedIndex;
  m.intersectUv = uv => {
    highlightedIndex = -1;
    if (uv && anchors && width && height && optionsTextures) {
      const coords = localVector2D.copy(uv)
        .multiply(localVector2D2.set(width, height));
      highlightedIndex = anchors.findIndex(anchor => {
        return (
          (coords.x >= anchor.left && coords.x < anchor.right) &&
          (coords.y >= anchor.top && coords.y < anchor.bottom)
        );
      });
    }
    material.map = highlightedIndex !== -1 ?
      optionsTextures[highlightedIndex]
    :
      blankOptionTexture;
  };
  return m;
};
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
function makeShape(shape, x, y, width, height, radius) {
  shape.absarc( x - width/2, y + height/2, radius, Math.PI, Math.PI / 2, true );
  shape.absarc( x + width/2, y + height/2, radius, Math.PI / 2, 0, true );
  shape.absarc( x + width/2, y - height/2, radius, 0, -Math.PI / 2, true );
  shape.absarc( x - width/2, y - height/2, radius, -Math.PI / 2, -Math.PI, true );
  return shape;
}
function createBoxWithRoundedEdges( width, height, radius, innerFactor) {
  const shape = makeShape(new THREE.Shape(), 0, 0, width, height, radius);
  const hole = makeShape(new THREE.Path(), 0, 0, width * innerFactor, height * innerFactor, radius);
  shape.holes.push(hole);

  const geometry = new THREE.ShapeGeometry(shape);
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
    material.map.encoding = THREE.sRGBEncoding;
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
  material.map.encoding = THREE.sRGBEncoding;
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
const _makeArrowMesh = async () => {
  const geometry = new THREE.PlaneBufferGeometry(0.5, 0.5)
	  .applyMatrix4(
		  new THREE.Matrix4()
			  .makeRotationFromQuaternion(
				  new THREE.Quaternion()
					  .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
			  )
	  );
	
  // console.log('got bounding box', boundingBox);
  
	const u = `./street/_Down Tap Note 16x16.png`;
  const img = await _loadImage(u);
	const tex = new THREE.Texture(img);
	// tex.minFilter = THREE.NearestFilter;
	tex.magFilter = THREE.NearestFilter;
	tex.needsUpdate = true;
	
	const material = new THREE.ShaderMaterial({
    uniforms: {
      tex: {
        type: 't',
        value: tex,
        needsUpdate: true,
      },
			uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      varying vec2 vUv;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
				
				vUv = uv;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      uniform sampler2D tex;
			uniform float uTime;
      varying vec2 vUv;

      void main() {
				float t = floor(uTime * 16. * 16.);
				float x = mod(t, 16.);
				// float y = floor((uTime - x) / 16.);
				float y = 0.;
				vec2 uv = (vUv / 16.0) + vec2(x, y)/16.;
        gl_FragColor = texture2D(tex, uv);
				if (gl_FragColor.a < 0.9) {
				  discard;
				}
      }
    `,
    transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.update = () => {
	  material.uniforms.uTime.value = (Date.now() % 30000) / 30000;
	};
  return mesh;
};
const _makeBlockMesh = async () => {
	const w = 8;
	const h = 0.2;
	const d = 100;
  const geometry = new THREE.BoxBufferGeometry(w, h, d)
	  .applyMatrix4(
	    new THREE.Matrix4().makeTranslation(0, -h/2, 0)
		)
		/* .applyMatrix4(
		  new THREE.Matrix4()
			  .makeRotationFromQuaternion(
				  new THREE.Quaternion()
					  .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
			  )
	  ); */
	
  // console.log('got bounding box', boundingBox);
  
	const u = `./street/street.png`;
  const img = await _loadImage(u);
	const tex = new THREE.Texture(img);
	// tex.minFilter = THREE.NearestFilter;
	tex.magFilter = THREE.NearestFilter;
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.anisotropy = 16;
	tex.needsUpdate = true;
	
	const material = new THREE.ShaderMaterial({
    uniforms: {
      tex: {
        type: 't',
        value: tex,
        needsUpdate: true,
      },
			uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      varying vec2 vUv;
      varying vec3 vNormal;
			varying vec3 vPosition;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
				
				vUv = uv;
				vNormal = normal;
				vPosition = position;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      uniform sampler2D tex;
			uniform float uTime;
      varying vec2 vUv;
			varying vec3 vNormal;

      vec4 sam(sampler2D tex, vec2 uv, float t) {
				vec4 a = texture2D(tex, vec2(uv.x * 1./3., uv.y - t));
				vec4 b = texture2D(tex, vec2(uv.x * 1./3. + 1./3., uv.y + t));
			  return vec4(a.rgb * a.a + b.rgb * b.a, 1.);
			}

			// const vec2 resolution = vec2(1000., 1000.);
			const float size = 1000.;

			float letter(vec2 coord)
			{
					// float size = resolution.x / 25.;
          // const float size = 400.;

					vec2 gp = floor(coord / size * 7.); // global
					vec2 rp = floor(fract(coord / size) * 7.); // repeated

					vec2 odd = fract(rp * 0.5) * 2.;
					float rnd = fract(sin(dot(gp, vec2(12.9898, 78.233))) * 43758.5453);

					float c = max(odd.x, odd.y) * step(0.5, rnd); // random lines
					c += min(odd.x, odd.y); // corder and center points

					c *= rp.x * (6. - rp.x); // cropping
					c *= rp.y * (6. - rp.y);

					return clamp(c, 0., 1.);
			}
			
			vec3 blend(vec4 a, vec4 b) {
			  return a.rgb * a.a + b.rgb * b.a;
			}
			float random2d(vec2 n) { 
				return fract(sin(dot(n, vec2(129.9898, 4.1414))) * 2398.5453);
			}
			vec2 getCellIJ(vec2 uv, float gridDims){
				return floor(uv * gridDims)/ gridDims;
			}
			vec2 rotate2D(vec2 position, float theta)
			{
				mat2 m = mat2( cos(theta), -sin(theta), sin(theta), cos(theta) );
				return m * position;
			}
			float letter2(vec2 coord, float cellRand, float size) {
				vec2 gp = floor(coord / size * 7.); // global
				vec2 rp = floor(fract(coord / size) * 7.); // repeated
				vec2 odd = fract(rp * 0.5) * 2.;
				float rnd = random2d(gp + floor(cellRand * uTime * 10.));
				float c = max(odd.x, odd.y) * step(0.5, rnd); // random lines
				c += min(odd.x, odd.y); // fill corner and center points
				c *= rp.x * (6. - rp.x); // cropping
				c *= rp.y * (6. - rp.y);
				return clamp(c, 0., 1.);
			}
			vec3 pattern(vec2 uv) {
				const vec3 color = vec3(0.1);
				
			  // vec2 uv = fragCoord.xy / iResolution.xy;    
				//correct aspect ratio
				// uv.x *= iResolution.x/iResolution.y;
				uv /= 3.;
				uv.x *= 4.;

				// float t = uTime;
				// float scrollSpeed = 0.3;
				float dims = 2.0;
				int maxSubdivisions = 3;
				
				// uv = rotate2D(uv,PI/12.0);
				// uv.y -= uTime * scrollSpeed;
				
				float cellRand;
				vec2 ij;
				
				for(int i = 0; i <= maxSubdivisions; i++) { 
						ij = getCellIJ(uv, dims);
						cellRand = random2d(ij);
						dims *= 2.0;
						//decide whether to subdivide cells again
						float cellRand2 = random2d(ij + 454.4543);
						if (cellRand2 > 0.3){
							break; 
						}
				}
			 
				//draw letters
				// float showPos = -ij.y + cellRand;
				float b = letter2(uv, cellRand, 1.0 / (dims));
				
				// if (cellRand < 0.1) b = 0.0;
				
				return vec3(1. - (b * color));

				/* vec2 coord = uv * size;
				coord.x *= 5.;

				float c; // MSAA with 2x2 RGSS sampling pattern
				c  = letter(coord + vec2(-3.0 / 8., -1.0 / 8.));
				c += letter(coord + vec2( 1.0 / 8., -3.0 / 8.));
				c += letter(coord + vec2( 3.0 / 8.,  1.0 / 8.));
				c += letter(coord + vec2(-1.0 / 8.,  3.0 / 8.));
				return vec3(1.-c / 4.); */
			}
			
			vec3 hsv2rgb(vec3 c) {
				vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
				vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
				return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
			}

      void main() {
				vec2 uv = vUv;
				if (vNormal.x != 0.) {
					float z = uv.x;
					uv.x = uv.y;
					uv.y = z;
					uv.y *= ${d.toFixed(8)};
					// uv.x *= (${d.toFixed(8)} / 10.);
					// uv.y /= 0.1;
					gl_FragColor = sam(tex, uv, uTime * 2.);
				} else {
					uv.y *= (${d.toFixed(8)} / 10.);
					if (vNormal.y > 0.) {
						uv.y /= 0.2;

						if (uv.x > 0.9) {
							uv.x -= 0.9;
							uv.x /= 0.1;
							uv.y = 1. - uv.y;
							gl_FragColor = sam(tex, uv, uTime);
						} else if (uv.x > 0.8) {
							vec4 t = texture2D(tex, vec2((1. - uv.x) * 1./3. + 2./3., uv.y * 0.25));
							if (t.r < 0.5) { // black
								gl_FragColor = vec4(t.rgb + 0.25, 1.);
							} else {
								gl_FragColor = vec4(pattern(uv), 1.);
							}
					  } else if (
						  (uv.x > 0.75 && uv.x < 0.76) ||
						  (uv.x > 0.24 && uv.x < 0.25)
						) {
						  gl_FragColor = vec4(hsv2rgb(vec3(uv.y * 0.1, 1., 1.)), 1.);
						} else if (uv.x < 0.1) {
							uv.x /= 0.1;
							gl_FragColor = sam(tex, uv, uTime);
						} else if (uv.x < 0.2) {
							vec4 t = texture2D(tex, vec2(uv.x * 1./3. + 2./3., uv.y * 0.25));
							if (t.r < 0.5) { // black
								gl_FragColor = vec4(t.rgb + 0.25, 1.);
							} else {
								gl_FragColor = vec4(pattern(uv), 1.);
							}
						} else {
							gl_FragColor = vec4(pattern(uv), 1.);
						}
					} else if (vNormal.y < 0.) {
						uv.y *= (${d.toFixed(8)} / 10.);
						gl_FragColor = vec4(pattern(uv), 1.);
					} else {
						gl_FragColor = vec4(1., 1., 1., 1.);
					}
		    }
      }
    `,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.update = () => {
	  material.uniforms.uTime.value = (Date.now() % 2000) / 2000;
	};

  const waveMesh = (() => {
		const geometry = new THREE.BufferGeometry();
			/* .applyMatrix4(
				new THREE.Matrix4()
					.makeRotationFromQuaternion(
						new THREE.Quaternion()
							.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
					)
			); */
		const positions = new Float32Array(8 * 1024);
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		let positionIndex = 0;
		
		/* let z = d/2;
		while (z >= -d/2) {
			const numTris = 3 + Math.floor(Math.random() * 5);
		  for (let i = 0; i < numTris; i++) {
			  const l = (0.5 + Math.random() * 0.5);
				const m = l * (0.4 + Math.random() * 0.2);
				
				if (i === 0) {
					const s = (0.2 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1);
					
					localVector.set(0, h/2 + 0.01, z)
						.toArray(positions, positionIndex);
					positionIndex += 3;
					
					localVector.set(s, h/2 + 0.01, z - m)
						.toArray(positions, positionIndex);
					positionIndex += 3;
					
					localVector.set(0, h/2 + 0.01, z - l)
						.toArray(positions, positionIndex);
					positionIndex += 3;
			  } else {
					localRay.set(
					  localVector.fromArray(positions, positionIndex - 3*2),
					  localVector2.fromArray(positions, positionIndex - 3)
						  .sub(localVector)
							.normalize()
					);

					localVector.set(0, h/2 + 0.01, z)
						.toArray(positions, positionIndex);
					positionIndex += 3;
					
					localPlane.setFromNormalAndCoplanarPoint(
					  localVector.set(0, 0, 1),
					  localVector2.set(0, h/2 + 0.01, z - m)
					);
					localRay.intersectPlane(localPlane, localVector);
				  localVector
						.toArray(positions, positionIndex);
					positionIndex += 3;
					
					localVector.set(0, h/2 + 0.01, z - l)
						.toArray(positions, positionIndex);
					positionIndex += 3;
				}
				
				z -= l;
			}
			z -= 2.;
		} */
		
		let z = d/2;
		while (z >= -d/2) {
			const numTris = 3 + Math.floor(Math.random() * 5);
		  for (let i = 0; i < numTris; i++) {
			  const l = (0.2 + Math.random() * 0.8);
				const m = l * (0.2 + Math.random() * 0.8);
				const s = (-1 + Math.random() * 2);
				
				localVector.set(0, 0.01, z)
			    .toArray(positions, positionIndex);
				positionIndex += 3;
				
				localVector.set(s, 0.01, z - m)
			    .toArray(positions, positionIndex);
				positionIndex += 3;
				
				localVector.set(0, 0.01, z - l)
			    .toArray(positions, positionIndex);
				positionIndex += 3;
				
				z -= l;
			}
			z -= 2.;
		}
		
		geometry.setDrawRange(0, positionIndex / 3);
		
		const material = new THREE.MeshBasicMaterial({
		  color: 0x000000,
			side: THREE.DoubleSide,
		});
		/* const material = new THREE.ShaderMaterial({
			uniforms: {
				tex: {
					type: 't',
					value: tex,
					needsUpdate: true,
				},
				uTime: {
					type: 'f',
					value: 0,
					needsUpdate: true,
				},
			},
			vertexShader: `\
				precision highp float;
				precision highp int;

				varying vec2 vUv;
				varying vec3 vNormal;
				varying vec3 vPosition;

				void main() {
					vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
					gl_Position = projectionMatrix * mvPosition;
					
					vUv = uv;
					vNormal = normal;
					vPosition = position;
				}
			`,
			fragmentShader: `\
				precision highp float;
				precision highp int;

				#define PI 3.1415926535897932384626433832795

				uniform sampler2D tex;
				uniform float uTime;
				varying vec2 vUv;
				varying vec3 vNormal;

				vec4 sam(sampler2D tex, vec2 uv) {
					vec4 a = texture2D(tex, vec2(uv.x * 0.5, uv.y));
					vec4 b = texture2D(tex, vec2(uv.x * 0.5 + 0.5, uv.y));
					return vec4(a.rgb * a.a + b.rgb * b.a, 1.);
				}

				void main() {
					vec2 uv = vUv;
					if (vNormal.y > 0.) {
						uv.y /= 0.1;
						uv.y += uTime;
						if (uv.x > 0.9) {
							uv.x -= 0.9;
							uv.x /= 0.1;
							uv.y -= uTime;
							uv.y = 1. - uv.y;
							uv.y += uTime;
							gl_FragColor = sam(tex, uv);
						} else if (uv.x < 0.1) {
							uv.x /= 0.1;
							gl_FragColor = sam(tex, uv);
						} else {
							gl_FragColor = vec4(1., 1., 1., 1.);
						}
					} else if (vNormal.y < 0.) {
						gl_FragColor = vec4(1., 1., 1., 1.);
					} else if (vNormal.x != 0.) {
						float z = uv.x;
						uv.x = uv.y;
						uv.y = z;
						uv.y /= 0.1;
						uv.y += uTime;
						gl_FragColor = sam(tex, uv);
					} else {
						gl_FragColor = vec4(1., 1., 1., 1.);
					}
				}
			`,
		}); */
		const mesh = new THREE.Mesh(geometry, material);
		mesh.frustumCulled = false;
		return mesh;
	})();
	mesh.add(waveMesh);
	
  return mesh;
};
const _makeTattooMesh = () => {
  const geometry = new THREE.PlaneBufferGeometry(1, 1);
	const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: {
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
      // varying vec3 vPosition;
      // varying vec3 vNormal;
			varying vec2 vUv;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
				vUv = uv;
        // vPosition = (position, 1.);
        // vNormal = normal;
      }
    `,
    fragmentShader: `\
		  uniform float uTime;
		  varying vec2 vUv;
		
      /*

				draw letter shapes after subdividing uv space randomly

			*/

			#define PI 3.1415926535

			float random2d(vec2 n) { 
					return fract(sin(dot(n, vec2(129.9898, 4.1414))) * 2398.5453);
			}

			vec2 getCellIJ(vec2 uv, float gridDims){
					return floor(uv * gridDims)/ gridDims;
			}

			vec2 rotate2D(vec2 position, float theta)
			{
					mat2 m = mat2( cos(theta), -sin(theta), sin(theta), cos(theta) );
					return m * position;
			}

			//from https://github.com/keijiro/ShaderSketches/blob/master/Text.glsl
			float letter(vec2 coord, float size)
			{
					vec2 gp = floor(coord / size * 7.); // global
					vec2 rp = floor(fract(coord / size) * 7.); // repeated
					vec2 odd = fract(rp * 0.5) * 2.;
					float rnd = random2d(gp);
					float c = max(odd.x, odd.y) * step(0.5, rnd); // random lines
					c += min(odd.x, odd.y); // fill corner and center points
					c *= rp.x * (6. - rp.x); // cropping
					c *= rp.y * (6. - rp.y);
					return clamp(c, 0., 1.);
			}

			void main() {

					vec2 uv = vUv; // fragCoord.xy / iResolution.xy;    
					//correct aspect ratio
					// uv.x *= iResolution.x/iResolution.y;

					float t = uTime;
					float scrollSpeed = 0.3;
					float dims = 0.5;
					int maxSubdivisions = 0;
					
					// uv = rotate2D(uv,PI/12.0);
					uv.y -= floor(uTime * scrollSpeed * 4.);
					
					float cellRand;
					vec2 ij;
					
					for(int i = 0; i <= maxSubdivisions; i++) { 
							ij = getCellIJ(uv, dims);
							cellRand = random2d(ij);
							dims *= 2.0;
							//decide whether to subdivide cells again
							float cellRand2 = random2d(ij + 454.4543);
							if (cellRand2 > 0.3){
								break; 
							}
					}
				 
					//draw letters    
					float b = letter(uv, 1.0 / (dims));
				
					//fade in
					/* float scrollPos = uTime*scrollSpeed + 0.5;
					float showPos = -ij.y + cellRand;
					float fade = smoothstep(showPos ,showPos + 0.05, scrollPos );
					b *= fade; */
					
					//hide some
					//if (cellRand < 0.1) b = 0.0;
					
					gl_FragColor = vec4(vec3(1.-b), 1.0);
					
		 }
    `,
  });
	const mesh = new THREE.Mesh(geometry, material);
	return mesh;
};
const _makeCorruptionMesh = async () => {
  // const geometry = new THREE.PlaneBufferGeometry(1, 1);

	let o;
  try {
    o = await new Promise((accept, reject) => {
      gltfLoader.load(`https://avaer.github.io/dragon-pet/dragon.glb`, accept, function onprogress() {}, reject);
    });
  } catch(err) {
    console.warn(err);
  }
	const m = o.scene.getObjectByName('Cube');
	// console.log('got o', o, m);
	const {geometry} = m;
	
	const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      uniform float uTime;
      uniform vec4 uBoundingBox;
      // varying vec3 vPosition;
      // varying vec3 vNormal;
			varying vec2 vUv;

      // Simplex 2D noise
			//
			vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

			float snoise(vec2 v){
				const vec4 C = vec4(0.211324865405187, 0.366025403784439,
								 -0.577350269189626, 0.024390243902439);
				vec2 i  = floor(v + dot(v, C.yy) );
				vec2 x0 = v -   i + dot(i, C.xx);
				vec2 i1;
				i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
				vec4 x12 = x0.xyxy + C.xxzz;
				x12.xy -= i1;
				i = mod(i, 289.0);
				vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
				+ i.x + vec3(0.0, i1.x, 1.0 ));
				vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
					dot(x12.zw,x12.zw)), 0.0);
				m = m*m ;
				m = m*m ;
				vec3 x = 2.0 * fract(p * C.www) - 1.0;
				vec3 h = abs(x) - 0.5;
				vec3 ox = floor(x + 0.5);
				vec3 a0 = x - ox;
				m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
				vec3 g;
				g.x  = a0.x  * x0.x  + h.x  * x0.y;
				g.yz = a0.yz * x12.xz + h.yz * x12.yw;
				return 130.0 * dot(m, g);
			}

      void main() {
				vec3 p = position + normal * snoise(position.xy * 0.01 * + uTime) * 0.05;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
				vUv = uv;
        // vPosition = (position, 1.);
        // vNormal = normal;
      }
    `,
    fragmentShader: `\
		  uniform float uTime;
		  varying vec2 vUv;
	
      const vec2 iResolution = vec2(2048., 2048.);
	
		  /*

				Quadtree Truchet
				----------------

					A multiscale, multitile, overlapped, weaved Truchet pattern. However, since
				that description is a little verbose, I figured that a quadtree Truchet was as 
				good a description as any. :) The mild weave effect is provided via the
				"INCLUDE_LINE_TILES" define.

				In order to produce a varied looking Truchet pattern, there are a couple of
				simple things you can try: One is to use more than one tile, and the other is 
				to stitch weaved tiles together to produce a cool under-over effect. There are 
					a few examples on Shadertoy of each, which are easy enough to find -- Just do
				a search for "Truchet" and look for the multitile and weaved examples.

					Lesser known variations include using Truchet tiles that overlap one another, 
					and stitching together multiscaled tiles -- usually on something like a quadtree 
					grid. This example uses elements of all of the aforementioned.

				In the past, I've combined two non-overlapping tile scales, but had never 
					considered taking it beyond that... until I came across Christopher Carlson's
				article, "Multi-Scale Truchet Patterns." If you follow the link below and refer
				to the construction process, you'll see that the idea behind it is almost 
				rudimentary. As a consequence, I figured that it'd take me five minutes to put 
				the ideas into pixel shader form. Unfortunately, they say the dumber you are, 
				the more overconfident you'll be, and to cut a long story short... It took me 
				longer than five minutes. :D

				The code below is somewhat obfuscated and strewn with defines - The defines are
				my fault, since I wanted to provide a few rendering options. However, the 
				remaining complication boils down to the necessity to render overlapping tiles
				on a quadtree grid in an environment that doesn't allow random pixel access. The 
				only example along those lines I could find on here was IQ's hierachical Voronoi 
				demonstration, which is pretty cool, but it contains a lot of nested iterations.
				Rendering tiles in that manner wasn't really sufficient, so I had to write
				things in a way that used fewer iterations, but it was at the cost of legibility.

				Either way, the idea is pretty simple: Construct a grid, randomly render some 
				Truchet tiles, subdivide the remaining squares into four, randomly render some 
					more tiles in reverse color order, then continue ad infinitum. By the way, I
				constructed this on the fly using the best method I could think of at the time.
				However, if anyone out there has a more elegant solution, feel free to post it. :)
				
				Naturally, the idea can be extended to 3D. Three levels with this particular 
				setup might be a little slow. However, two levels using a non overlapping tile
				is definitely doable, so I intend to produce an example along those lines in the 
				near future.


				Based on the following:

				Multi-Scale Truchet Patterns  - Christopher Carlson
				https://christophercarlson.com/portfolio/multi-scale-truchet-patterns/
					Linking paper containing more detail:
					http://archive.bridgesmathart.org/2018/bridges2018-39.pdf

				Quadtree Related:

				// Considers overlap.
				https://www.shadertoy.com/view/Xll3zX
				Voronoi - hierarchical - IQ

					// No overlap, but I really like this one.
					SDF Raymarch Quadtree - Paniq
				https://www.shadertoy.com/view/MlffW8

				// Multilevel, and nice and simple.
				quadtree - 4 - FabriceNeyret2
				https://www.shadertoy.com/view/ltlyRH

				// A really simple non-overlapping quadtree example.
				Random Quadtree - Shane
				https://www.shadertoy.com/view/llcBD7

			*/


			// DEFINES: Feel free to try them out.

			// Default colored setting. Not applicable when using the stacked tiles option.
			// When turned off, the color is white.
			#define SPECTRUM_COLORED

			// Pink -- Less bland than white, and has a velvety feel... Gets overridden by the spectrum 
			// color option, so only works when "SPECTRUM_COLORED" is commented out.
			//#define PINK

			// Showing the different tile layers stacked on top of one another. Aesthetically, I prefer 
			// this more, because it has a raised look about it. However, you can't make out the general 
			// pattern as well, so it's off by default.
			//#define STACKED_TILES

			// This option produces art deco looking patterns, which are probably more interesting, but 
			// I wanted the default pattern to be more simplistic. 
			//#define INCLUDE_LINE_TILES



			// vec2 to vec2 hash.
			vec2 hash22(vec2 p) { 

					// Faster, but doesn't disperse things quite as nicely. However, when framerate
					// is an issue, and it often is, this is a good one to use. Basically, it's a tweaked 
					// amalgamation I put together, based on a couple of other random algorithms I've 
					// seen around... so use it with caution, because I make a tonne of mistakes. :)
					float n = sin(dot(p, vec2(57, 27)));
					
					return fract(vec2(262144, 32768)*n);
					
					/*
					// Animated.
					p = fract(vec2(262144, 32768)*n); 
					// Note the ".35," insted of ".5" that you'd expect to see. .
					return sin(p*6.2831853 + uTime/2.)*.24;
					*/
			}

			// Standard 2D rotation formula.
			mat2 r2(in float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

			/*
			// IQ's 2D unsigned box formula.
			float sBox(vec2 p, vec2 b){ return length(max(abs(p) - b, 0.)); }

			// IQ's 2D signed box formula.
			float sBoxU(vec2 p, vec2 b){

				vec2 d = abs(p) - b;
				return min(max(d.x, d.y), 0.) + length(max(d, 0.));
			}
			*/

			void main() {
			 
					// Screen coordinates.    
					vec2 uv = vUv; // (fragCoord - iResolution.xy*.5)/iResolution.y;

					
					// Scaling, rotation and transalation.
					vec2 oP = uv*5.;    
					// oP *= r2(sin(uTime/8.)*3.14159/8.);    
					// oP -= vec2(cos(uTime/8.)*0., -uTime);
					float t = 0.; // floor(uTime * 2.);
					oP -= vec2(0., -t * 10.);

					// Distance field values -- One for each color. They're "vec4"s to hold the three 
					// layers and an an unused spare. The grid vector holds grid values, strangely enough. :)
					vec4 d = vec4(1e5), d2 = vec4(1e5), grid = vec4(1e5);
					
					// Random constants for each layer. The X values are Truchet flipping threshold
					// values, and the Y values represent the chance that a particular sized tile
					// will render.
					//
					// The final Y entry needs to fill in the remaiming grid spaces, so it must have a 100% 
					// chance of success -- I'd rather not say how long it took me to figure that out. :D
					const vec2 rndTh[3] = vec2[3]( vec2(.5, .35), vec2(.5, .7), vec2(.5, 1));
					
					
					// The scale dimentions. Gets multiplied by two each iteration. 
					float dim = 1.;
					
					
					
					// If you didn't need to worry about overlap, you wouldn't need to consider neighboring
					// cell rendering, which would make this far less complicated - One loop and a break.
					
					// Three tile levels. 
				for(int k=0; k<3; k++){
							
						// Base cell ID.
					vec2 ip = floor(oP*dim);
									 
							// Abje reminded me that for a 2x2 neighbor check, just make the following changes:
							//vec2 ip = floor(oP*dim + .5);
							//for(int j=-1; j<=0; j++){
									//for(int i=-1; i<=0; i++){
							//
							// In this particular case, I'm using a 3x3 sweep because I need the internal field pattern 
							// overlay to be balanced. However, in general, Abje's faster suggestion is the way to go.
									 
							
							for(int j=-1; j<=1; j++){
									for(int i=-1; i<=1; i++){

											// The neighboring cell ID.
											vec2 rndIJ = hash22(ip + vec2(i, j));
											
											// The cell IDs for the previous dimension, or dimensions, as the case may be.
											// Because the tiles overlap, rendering order matters. In this case, the tiles 
											// need to be laid down from largest (k = 0) to smallest (k = 2). If a large tile
											// has taken up the space, you need to check on the next iterations and skip --
											// so as not to lay smaller tiles over the larger ones.
											//
											// So why not just break from the loop? Unfortunately, there are neighboring
											// cells to check, and the IDs need to be calculated from the perspective of 
											// each cell neighbor... Yeah, I'm confused too. You can either take my word
											// for it, or better yet, come up with a more elegant solution. :)
											vec2 rndIJ2 = hash22(floor((ip + vec2(i, j))/2.));
											vec2 rndIJ4 = hash22(floor((ip + vec2(i, j))/4.));
							
											// If the previous large tile has been rendered, continue.
											if(k==1 && rndIJ2.y<rndTh[0].y) continue;
											// If any of the two previous larger tiles have been rendered, continue.
											if(k==2 && (rndIJ2.y<rndTh[1].y || rndIJ4.y<rndTh[0].y)) continue;
										
											
											// If the random cell ID at this particular scale is below a certain threshold, 
											// render the tile. The code block below is a little messy, due to to fact that I
											// wanted to render a few different tile styles without bloating things too much.
											// This meant a bunch of random coordinate flipping, reflecting, etc. As mentioned,
											// I'll provide a much simpler example later.                
							//
											if(rndIJ.y<rndTh[k].y){

													// Local cell coordinates. The following is equivalent to:
													// vec2 p = mod(oP, 1./dim) - .5/dim - vec2(i, j)/dim;
													vec2 p = oP - (ip + .5 + vec2(i, j))/dim;

													
													// The grid square.
													float square = max(abs(p.x), abs(p.y)) - .5/dim; 
										
													// The grid lines.
													const float lwg = .01;
													float gr = abs(square) - lwg/2.;
													grid.x = min(grid.x, gr);

								
													// TILE COLOR ONE.
													
													// Standard Truchet rotation and flipping -- based on a random cell ID.
													if(rndIJ.x<rndTh[k].x) p.xy = p.yx;
													if(fract(rndIJ.x*57.543 + .37)<rndTh[k].x) p.x = -p.x;
													


													// Rotating by 90 degrees, then reflecting across both axes by the correct
													// distance to produce four circles on the midway points of the grid boundary
													// lines... A lot of this stuff is just practice. Do it often enough and 
													// it'll become second nature... sometimes. :)
													vec2 p2 = abs(vec2(p.y - p.x, p.x + p.y)*.7071) - vec2(.5, .5)*.7071/dim;
													float c3 = length(p2) - .5/3./dim;
													
													float c, c2;

													// Truchet arc one.
													c = abs(length(p - vec2(-.5, .5)/dim) - .5/dim) - .5/3./dim;

													// Truchet arc two.
													if(fract(rndIJ.x*157.763 + .49)>.35){
															c2 = abs(length(p - vec2(.5, -.5)/dim) - .5/dim) - .5/3./dim;
													}
													else{  
															// Circles at the mid boundary lines -- instead of an arc.
															// c2 = 1e5; // In some situations, just this would work.
															c2 = length(p -  vec2(.5, 0)/dim) - .5/3./dim;
															c2 = min(c2, length(p -  vec2(0, -.5)/dim) - .5/3./dim);
													}


													// Randomly overiding some arcs with lines.
													#ifdef INCLUDE_LINE_TILES
															if(fract(rndIJ.x*113.467 + .51)<.35){
																c = abs(p.x) - .5/3./dim;
															}
															if(fract(rndIJ.x*123.853 + .49)<.35){ 
																c2 = abs(p.y) - .5/3./dim;
															}
													#endif


								// Truch arcs, lines, or dots -- as the case may be.
													float truchet = min(c, c2);

													// Carving out a mild channel around the line to give a faux weave effect.
													#ifdef INCLUDE_LINE_TILES
														float lne = abs(c - .5/12./4.) - .5/12./4.;
										truchet = max(truchet, -lne);
													#endif

													// Each tile has two colors. This is the first, and it's rendered on top.
													c = min(c3, max(square, truchet));
													d[k] = min(d[k], c); // Tile color one.
					
													
													// TILE COLOR TWO.
													// Repeat trick, to render four circles at the grid vertices.
													p = abs(p) - .5/dim;
													float l = length(p);
													// Four circles at the grid vertices and the square.
													c = min(l - 1./3./dim, square);
													//c = max(c, -truchet);
													//c = max(c, -c3);
													d2[k] = min(d2[k], c); // Tile color two.
													
													// Rendering some circles at the actual grid vertices. Mouse down to see it.
													grid.y = min(grid.y, l - .5/8./sqrt(dim)); //.05/(dim*.35 + .65)
													grid.z = min(grid.z, l);
													grid.w = dim;


											}
											 


									}
							}
							
							// Subdividing. I.e., decrease the tile size by doubling the frequency.
							dim *= 2.;
							
							
					}
					
					
					// The scene color. Initiated to grey.
					vec3 col = vec3(.25);
					
					
					// Just a simple lined pattern.
					float pat3 = clamp(sin((oP.x - oP.y)*6.283*iResolution.y/24.)*1. + .9, 0., 1.)*.25 + .75;
					// Resolution based falloff... Insert "too may different devices these days" rant here. :D
					float fo = 5./iResolution.y;
					
					
					// Tile colors. 
					vec3 pCol2 = vec3(.125);    
					vec3 pCol1 = vec3(1);
					
					//The spectrum color option overides the pink option.
					#ifdef SPECTRUM_COLORED
					pCol1 = vec3(.7, 1.4, .4);
					#else
					// Pink version.
							#ifdef PINK
							pCol1 = mix(vec3(1, .1, .2), vec3(1, .1, .5), uv.y*.5 + .5);;
							pCol2 = vec3(.1, .02, .06); 
							#endif
					#endif
					
					
					
					
				#ifdef STACKED_TILES
							// I provided this as an option becaue I thought it might be useful
							// to see the tile layering process.

							float pw = .02;
							d -= pw/2.;
							d2 -= pw/2.;
					
							// Render each two-colored tile, switching colors on alternating iterations.
						for (int k=0; k<3; k++){

									col = mix(col, vec3(0), (1. - smoothstep(0., fo*5., d2[k]))*.35);
									col = mix(col, vec3(0), 1. - smoothstep(0., fo, d2[k]));
									col = mix(col, pCol2, 1. - smoothstep(0., fo, d2[k] + pw));  

									col = mix(col, vec3(0), (1. - smoothstep(0., fo*5., d[k]))*.35);
									col = mix(col, vec3(0), 1. - smoothstep(0., fo, d[k]));
									col = mix(col, pCol1, 1. - smoothstep(0., fo, d[k] + pw));
									
									vec3 temp = pCol1; pCol1 = pCol2; pCol2 = temp;
							}

							col *= pat3;
					
					#else
				 
							// Combining the tile layers into a continuous surface. I'd like to say that
							// I applied years of topological knowledge to arrive at this, but like most
							// things, I threw a bunch of formulas at the screen in frustration until I 
							// fluked the solution. :D There was a bit of logic applied though. :)
							d.x = max(d2.x, -d.x);
							d.x = min(max(d.x, -d2.y), d.y);
							d.x = max(min(d.x, d2.z), -d.z);

							// A couple of distance field patterns and a shade.
							float pat = clamp(-sin(d.x*6.283*20.) - .0, 0., 1.);
							float pat2 = clamp(sin(d.x*6.283*16.)*1. + .9, 0., 1.)*.3 + .7;
							float sh = clamp(.75 + d.x*2., 0., 1.);

							#ifdef SPECTRUM_COLORED

									col *= pat;

							// Render the combined shape.
									d.x = -(d.x + .03);

									col = mix(col, vec3(0), (1. - smoothstep(0., fo*5., d.x)));
									col = mix(col, vec3(0), 1. - smoothstep(0., fo, d.x));
									col = mix(col, vec3(.8, 1.2, .6), 1. - smoothstep(0., fo*2., d.x + .02));
									col = mix(col, vec3(0), 1. - smoothstep(0., fo*2., d.x + .03));
									col = mix(col, vec3(.7, 1.4, .4)*pat2, 1. - smoothstep(0., fo*2., d.x + .05));

									col *= sh; 

							#else

									//d.x -= .01;
									col = pCol1;

							// Render the combined shape.
									col = mix(col, vec3(0), (1. - smoothstep(0., fo*5., d.x))*.35);
									col = mix(col, vec3(0), 1. - smoothstep(0., fo, d.x));
									col = mix(col, pCol2, 1. - smoothstep(0., fo, d.x + .02));


									col *= pat3; // Line decroation.
							#endif

				#endif
					
				
			 
					// Mild spotlight.
					col *= max(1.15 - length(uv)*.5, 0.);
					
					
					/* // Click the left mouse button to show the underlying quadtree grid structure. It's
					// helpful to see the cell borders to see the random tile constructions.
					if(iMouse.z>0.){
							
							
							vec3 vCol1 = vec3(.8, 1, .7);
							vec3 vCol2 = vec3(1, .7, .4);
							
							#ifdef PINK
							vCol1 = vCol1.zxy;
							vCol2 = vCol2.zyx;
							#endif
							
							// Grid lines.
							vec3 bg = col;
							col = mix(col, vec3(0), (1. - smoothstep(0., .02, grid.x - .02))*.7);
							col = mix(col, vCol1 + bg/2., 1. - smoothstep(0., .01, grid.x));

							// Circles on the grid vertices.
							fo = 10./iResolution.y/sqrt(grid.w);
							col = mix(col, vec3(0), (1. - smoothstep(0., fo*3., grid.y - .02))*.5);
						col = mix(col, vec3(0), 1. - smoothstep(0., fo, grid.y - .02));
							col = mix(col, vCol2, 1. - smoothstep(0., fo, grid.y));
							col = mix(col, vec3(0), 1. - smoothstep(0., fo, grid.z - .02/sqrt(grid.w)));
					} */
					
					/* // Mix the colors, if the spectrum option is chosen.
					#ifdef SPECTRUM_COLORED
					col = mix(col, col.yxz, uv.y*.75 + .5); //.zxy
					col = mix(col, col.zxy, uv.x*.7 + .5); //.zxy
					#endif */
					

					// Rough gamma correction, and output to the screen.
					// if (col.g > 0.1) {
					  gl_FragColor = vec4(sqrt(max(col, 0.)), 1.0);
				  /* } else {
						discard;
					} */
			}
    `,
		// transparent: true,
  });
	const mesh = new THREE.Mesh(geometry, material);
	mesh.update = () => {
		const maxTime = 60000;
    const f = Date.now() % maxTime;
	  material.uniforms.uTime.value = f;
		material.uniforms.uTime.needsUpdate = true;
	};
	return mesh;
};
const _makeInventoryMesh = () => {
  const w = menuWidth + menuRadius*2;
  const h = menuHeight + menuRadius*2;
  const geometry = createBoxWithRoundedEdges(w, h, menuRadius, 0.99);
  const boundingBox = new THREE.Box3().setFromObject(new THREE.Mesh(geometry));
  // console.log('got bounding box', boundingBox);
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
const _makeHeartMesh = () => {
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    new CapsuleGeometry(undefined, undefined, undefined, 0.1, 0.02),
    new CapsuleGeometry(undefined, undefined, undefined, 0.1, 0.02)
      .applyMatrix4(
        new THREE.Matrix4()
          .compose(
            new THREE.Vector3(),
            new THREE.Quaternion()
              .setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2),
            new THREE.Vector3(1, 1, 1)
          )
      ),
    new CapsuleGeometry(undefined, undefined, undefined, 0.1, 0.02)
      .applyMatrix4(
        new THREE.Matrix4()
          .compose(
            new THREE.Vector3(),
            new THREE.Quaternion()
              .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2),
            new THREE.Vector3(1, 1, 1)
          )
      ),
  ]);
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      /* uBoundingBox: {
        type: 'vec4',
        value: new THREE.Vector4(
          boundingBox.min.x,
          boundingBox.min.y,
          boundingBox.max.x - boundingBox.min.x,
          boundingBox.max.y - boundingBox.min.y
        ),
        needsUpdate: true,
      }, */
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
      modelViewMatrixInverse: {
        type: 'm',
        value: new THREE.Matrix4(),
        needsUpdate: true,
      },
      projectionMatrixInverse: {
        type: 'm',
        value: new THREE.Matrix4(),
        needsUpdate: true,
      },
      viewport: {
        type: 'm',
        value: new THREE.Vector4(0, 0, 1, 1),
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      uniform float uTime;
      // uniform vec4 uBoundingBox;
      // varying vec3 vPosition;
      // varying vec3 vNormal;
      // attribute vec3 position2;
      // attribute float time;
      // varying vec3 vPosition2;
      varying vec3 vNormal;
      varying float vF;

      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) * 
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x) 
            + 6. * b - 9. * c + 3. * d) 
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }
      float easing2(float x) {
        return easing(easing(x));
      }
      
      // const float moveDistance = 20.;
      const float q = 0.1;

      void main() {
        float f = uTime < q ?
          easing(uTime/q)
        :
          1. - (uTime - q)/(1. - q);
        vec4 mvPosition = modelViewMatrix * vec4(
          position * (1. + f * 2.),
          1.
        );
        gl_Position = projectionMatrix * mvPosition;
        vNormal = normal;
        vF = f;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      uniform mat4 modelViewMatrixInverse;
      uniform mat4 projectionMatrixInverse;
      uniform vec4 viewport;
      // uniform vec4 uBoundingBox;
      // uniform float uTime;
      // uniform float uTimeCubic;
      // varying vec3 vPosition2;
      varying vec3 vNormal;
      varying float vF;

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
    
      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) * 
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x) 
            + 6. * b - 9. * c + 3. * d) 
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }

      const vec3 c2 = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
      const vec3 c1 = vec3(${new THREE.Color(0xff7043).toArray().join(', ')});
      // const float q = 0.7;
      // const float q2 = 0.9;
      
      void main() {
        vec4 ndcPos;
        ndcPos.xy = ((2.0 * gl_FragCoord.xy) - (2.0 * viewport.xy)) / (viewport.zw) - 1.;
        ndcPos.z = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
            (gl_DepthRange.far - gl_DepthRange.near);
        ndcPos.w = 1.0;

        vec4 clipPos = ndcPos / gl_FragCoord.w;
        vec4 eyePos = projectionMatrixInverse * clipPos;
        
        vec3 p = (modelViewMatrixInverse * eyePos).xyz;
        p /= (1. + vF);
        vec3 p2 = p / 0.1;
        float d = length(p2);
        float cF = (1. - pow(d, 2.) / 5.) * 1.2 * vF;
        
        vec3 c = (c1 * (1. - d/0.1)) + (c2 * d/0.1);
        gl_FragColor = vec4(c * cF, 1.);
      }
    `,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.update = () => {
    mesh.material.uniforms.uTime.value = (Date.now() % 1000) / 1000;
    mesh.material.uniforms.uTime.needsUpdate = true;
    
    mesh.material.uniforms.modelViewMatrixInverse.value
      .copy(camera.matrixWorldInverse)
      .multiply(mesh.matrixWorld)
      .invert();
    mesh.material.uniforms.modelViewMatrixInverse.needsUpdate = true;

    mesh.material.uniforms.projectionMatrixInverse.value
      .copy(camera.projectionMatrix)
      .invert();
    mesh.material.uniforms.projectionMatrixInverse.needsUpdate = true;
  
    const renderer = getRenderer();
    mesh.material.uniforms.viewport.value.set(0, 0, renderer.domElement.width, renderer.domElement.height);
    mesh.material.uniforms.viewport.needsUpdate = true;
  };
  return mesh;
};
const _makeVaccumMesh = () => {
  const size = 0.1;
  const count = 5;
  const crunchFactor = 0.9;
  const innerSize = size * crunchFactor;
  const cubeGeometry = new THREE.BoxBufferGeometry(innerSize, innerSize, innerSize);
  
  let numCubes = 0;
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      for (let z = 0; z < count; z++) {
        if (
          (x === 0 || x === (count - 1)) ||
          (y === 0 || y === (count - 1)) ||
          (z === 0 || z === (count - 1))
        ) {
          numCubes++;
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.position.array.length * numCubes), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.normal.array.length * numCubes), 3));
  geometry.setAttribute('time', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.position.array.length/3 * numCubes), 1));
  geometry.setAttribute('position2', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.position.array.length * numCubes), 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(cubeGeometry.index.array.length * numCubes), 1));
  
  geometry.attributes.time.array.fill(-1);
  
  let positionIndex = 0;
  let normalIndex = 0;
  let indexIndex = 0;
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      for (let z = 0; z < count; z++) {
        if (
          (x === 0 || x === (count - 1)) ||
          (y === 0 || y === (count - 1)) ||
          (z === 0 || z === (count - 1))
        ) {
          /* const g = cubeGeometry.clone()
            .applyMatrix4(
              new THREE.Matrix4()
                .compose(
                  new THREE.Vector3(x * size, y * size, z * size),
                  new THREE.Quaternion(),
                  new THREE.Vector3(1, 1, 1)
                )
            ); */
          // console.log('got g offset', [x * size, y * size, z * size]);
          
          
          
          geometry.attributes.position.array.set(cubeGeometry.attributes.position.array, positionIndex);
          geometry.attributes.normal.array.set(cubeGeometry.attributes.normal.array, normalIndex);
          for (let i = 0; i < cubeGeometry.attributes.position.array.length/3; i++) {
            geometry.attributes.position2.array[positionIndex + i*3] = -(count * size / 2) + x * size;
            geometry.attributes.position2.array[positionIndex + i*3+1] = -(count * size / 2) + y * size;
            geometry.attributes.position2.array[positionIndex + i*3+2] = -(count * size / 2) + z * size;
          }
          for (let i = 0; i < cubeGeometry.index.array.length; i++) {
            geometry.index.array[indexIndex + i] = positionIndex/3 + cubeGeometry.index.array[i];
          }
          
          positionIndex += cubeGeometry.attributes.position.array.length;
          normalIndex += cubeGeometry.attributes.normal.array.length;
          indexIndex += cubeGeometry.index.array.length;
        }
      }
    }
  }
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      /* uBoundingBox: {
        type: 'vec4',
        value: new THREE.Vector4(
          boundingBox.min.x,
          boundingBox.min.y,
          boundingBox.max.x - boundingBox.min.x,
          boundingBox.max.y - boundingBox.min.y
        ),
        needsUpdate: true,
      }, */
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
      // uniform vec4 uBoundingBox;
      // varying vec3 vPosition;
      // varying vec3 vNormal;
      attribute vec3 position2;
      attribute float time;
      varying vec3 vPosition2;
      varying vec3 vNormal;
      varying float vTime;

      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) * 
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x) 
            + 6. * b - 9. * c + 3. * d) 
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }
      float easing2(float x) {
        return easing(easing(x));
      }
      
      const float moveDistance = 20.;
      const float q = 0.7;

      void main() {
        float offsetTime = min(max((time + (1. - q)) / q, 0.), 1.);
        
        vec4 mvPosition = modelViewMatrix * vec4(
          position * offsetTime +
          position2 * (1. + moveDistance * (1. - easing(offsetTime))), 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vPosition2 = position2;
        vNormal = normal;
        vTime = time;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      // uniform vec4 uBoundingBox;
      // uniform float uTime;
      // uniform float uTimeCubic;
      varying vec3 vPosition2;
      varying vec3 vNormal;
      varying float vTime;

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
    
      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) * 
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x) 
            + 6. * b - 9. * c + 3. * d) 
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }

      const float q = 0.7;
      const float q2 = 0.9;
      
      void main() {
        float offsetTime = max(vTime - q, 0.);
        float a = 1. - max((vTime-q2)/(1.-q2), 0.);
        if (a > 0.) {
          gl_FragColor = vec4(
            vNormal * 0.3 +
              vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')}),
            a
          );
          gl_FragColor.rgb *= (0.1 + offsetTime);
        } else {
          discard;
        }
      }
    `,
    transparent: true,
    // depthWrite: false,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  /* mesh.onBeforeRender = () => {
    const renderer = getRenderer();
    const context = renderer.getContext();
    context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);
  };
  mesh.onAfterRender = () => {
    const renderer = getRenderer();
    const context = renderer.getContext();
    context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
  }; */
  
  let dots = [];
  const interval = setInterval(() => {
    const now = Date.now();
    const x = Math.floor(Math.random() * count);
    const y = Math.floor(Math.random() * count);
    const z = Math.floor(Math.random() * count);
    const index = Math.floor(Math.random() * numCubes);
    dots.push({
      x,
      y,
      z,
      index,
      startTime: now,
      endTime: now + 500,
    });
  }, 50);
  
  mesh.update = () => {
    geometry.attributes.time.array.fill(-1);
    
    const now = Date.now();
    dots = dots.filter(dot => {
      const {x, y, z, index, startTime, endTime} = dot;
      const f = (now - startTime) / (endTime - startTime);
      if (f <= 1) {
        const numTimesPerGeometry = cubeGeometry.attributes.position.array.length/3;
        const startIndex = index * numTimesPerGeometry;
        const endIndex = (index + 1) * numTimesPerGeometry;
        /* if (startIndex < 0) {
          debugger;
        }
        if (endIndex > geometry.attributes.time.array.length) {
          debugger;
        } */
        
        for (let i = startIndex; i < endIndex; i++) {
          geometry.attributes.time.array[i] = f;
        }
        return true;
      } else {
        return false;
      }
    });
    geometry.attributes.time.needsUpdate = true;
  };
  return mesh;
};
const _makeFractureMesh = () => {
  const size = 0.1;
  const count = 5;
  const crunchFactor = 0.9;
  const innerSize = size * crunchFactor;
  const cubeGeometry = new THREE.BoxBufferGeometry(innerSize, innerSize, innerSize);
  
  let numCubes = 0;
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      for (let z = 0; z < count; z++) {
        if (
          (x === 0 || x === (count - 1)) ||
          (y === 0 || y === (count - 1)) ||
          (z === 0 || z === (count - 1))
        ) {
          numCubes++;
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.position.array.length * numCubes), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.normal.array.length * numCubes), 3));
  geometry.setAttribute('position2', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.position.array.length * numCubes), 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.position.array.length * numCubes), 3));
  geometry.setAttribute('quaternion', new THREE.BufferAttribute(new Float32Array(cubeGeometry.attributes.position.array.length/3*4 * numCubes), 4));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(cubeGeometry.index.array.length * numCubes), 1));
  
  let positionIndex = 0;
  let quaternionIndex = 0;
  let normalIndex = 0;
  let indexIndex = 0;
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      for (let z = 0; z < count; z++) {
        if (
          (x === 0 || x === (count - 1)) ||
          (y === 0 || y === (count - 1)) ||
          (z === 0 || z === (count - 1))
        ) {
          geometry.attributes.position.array.set(cubeGeometry.attributes.position.array, positionIndex);
          geometry.attributes.normal.array.set(cubeGeometry.attributes.normal.array, normalIndex);
          
          const _getRandomDirection = localVector => 
            localVector
              .set(
                -1 + Math.random() * 2,
                0,
                -1 + Math.random() * 2
              )
              .normalize();
          const _getRandomQuaternion = () =>
            localQuaternion
              .set(
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random()
              )
              .normalize();
          
          const velocity = _getRandomDirection(localVector);
          const quaternion = _getRandomQuaternion(localQuaternion);
          for (let i = 0; i < cubeGeometry.attributes.position.array.length/3; i++) {
            geometry.attributes.position2.array[positionIndex + i*3] = -(count * size / 2) + x * size;
            geometry.attributes.position2.array[positionIndex + i*3+1] = -(count * size / 2) + y * size;
            geometry.attributes.position2.array[positionIndex + i*3+2] = -(count * size / 2) + z * size;
            
            velocity
              .toArray(geometry.attributes.velocity.array, positionIndex + i*3);
            quaternion
              .toArray(geometry.attributes.quaternion.array, quaternionIndex + i*4);
          }
          for (let i = 0; i < cubeGeometry.index.array.length; i++) {
            geometry.index.array[indexIndex + i] = positionIndex/3 + cubeGeometry.index.array[i];
          }
          
          positionIndex += cubeGeometry.attributes.position.array.length;
          quaternionIndex += cubeGeometry.attributes.position.array.length/3*4;
          normalIndex += cubeGeometry.attributes.normal.array.length;
          indexIndex += cubeGeometry.index.array.length;
        }
      }
    }
  }
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      /* uBoundingBox: {
        type: 'vec4',
        value: new THREE.Vector4(
          boundingBox.min.x,
          boundingBox.min.y,
          boundingBox.max.x - boundingBox.min.x,
          boundingBox.max.y - boundingBox.min.y
        ),
        needsUpdate: true,
      }, */
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      uniform float uTime;
      // uniform vec4 uBoundingBox;
      // varying vec3 vPosition;
      varying vec3 vNormal;
      attribute vec3 position2;
      attribute vec3 velocity;
      attribute vec4 quaternion;
      
      vec4 slerp(vec4 p0, vec4 p1, float t) {
        float dotp = dot(normalize(p0), normalize(p1));
        if ((dotp > 0.9999) || (dotp<-0.9999))
        {
          if (t<=0.5)
            return p0;
          return p1;
        }
        float theta = acos(dotp * 3.14159/180.0);
        vec4 P = ((p0*sin((1.-t)*theta) + p1*sin(t*theta)) / sin(theta));
        P.w = 1.;
        return P;
      }

      vec4 quat_conj(vec4 q)
      { 
        return vec4(-q.x, -q.y, -q.z, q.w); 
      }
        
      vec4 quat_mult(vec4 q1, vec4 q2)
      { 
        vec4 qr;
        qr.x = (q1.w * q2.x) + (q1.x * q2.w) + (q1.y * q2.z) - (q1.z * q2.y);
        qr.y = (q1.w * q2.y) - (q1.x * q2.z) + (q1.y * q2.w) + (q1.z * q2.x);
        qr.z = (q1.w * q2.z) + (q1.x * q2.y) - (q1.y * q2.x) + (q1.z * q2.w);
        qr.w = (q1.w * q2.w) - (q1.x * q2.x) - (q1.y * q2.y) - (q1.z * q2.z);
        return qr;
      }

      vec3 applyQuaternion(vec3 position, vec4 qr)
      { 
        // vec4 qr = quat_from_axis_angle(axis, angle);
        vec4 qr_conj = quat_conj(qr);
        vec4 q_pos = vec4(position.x, position.y, position.z, 0);
        
        vec4 q_tmp = quat_mult(qr, q_pos);
        qr = quat_mult(q_tmp, qr_conj);
        
        return vec3(qr.x, qr.y, qr.z);
      }
      
      
      // const float moveDistance = 20.;
      // const float q = 0.7;

      void main() {
        vec4 q = slerp(vec4(0., 0., 0., 1.), quaternion, uTime * 0.2);
        vec4 mvPosition = modelViewMatrix * vec4(
          applyQuaternion(position, q) +
            position2 +
            vec3(0., -9.8 * 0.2 * uTime * uTime, 0.) +
            velocity * uTime * 0.5,
          1.
        );
        gl_Position = projectionMatrix * mvPosition;
        vNormal = normal;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      // uniform vec4 uBoundingBox;
      uniform float uTime;
      // uniform float uTimeCubic;
      // varying vec3 vPosition2;
      varying vec3 vNormal;
      // varying float vTime;

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
    
      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) * 
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x) 
            + 6. * b - 9. * c + 3. * d) 
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }

      // const float q = 0.7;
      // const float q2 = 0.9;
      
      void main() {
        float f = 1. - uTime;
        float a = 1. - uTime*1.2;
        if (a > 0.) {
          gl_FragColor = vec4(
            vNormal * 0.3 +
              vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')}),
            a
          );
          gl_FragColor.rgb *= (0.3 + pow(f, 2.));
        } else {
          discard;
        }
      }
    `,
    transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  
  /* let dots = [];
  const interval = setInterval(() => {
    const now = Date.now();
    const x = Math.floor(Math.random() * count);
    const y = Math.floor(Math.random() * count);
    const z = Math.floor(Math.random() * count);
    const index = Math.floor(Math.random() * numCubes);
    dots.push({
      x,
      y,
      z,
      index,
      startTime: now,
      endTime: now + 500,
    });
  }, 50); */
  
  mesh.update = () => {
    mesh.material.uniforms.uTime.value = (Date.now() % 1000) / 1000;
    mesh.material.uniforms.uTime.needsUpdate = true;
  };
  return mesh;
};
const _makeLoadingBarMesh = basePosition => {
  const o = new THREE.Object3D();

  const geometry1 = BufferGeometryUtils.mergeBufferGeometries([
    new THREE.BoxBufferGeometry(1.04, 0.02, 0.02)
      .applyMatrix4(
        new THREE.Matrix4()
          .compose(
            new THREE.Vector3(0, 0.03, 0),
            new THREE.Quaternion(),
            new THREE.Vector3(1, 1, 1)
          )
      ),
    new THREE.BoxBufferGeometry(1.04, 0.02, 0.02)
      .applyMatrix4(
        new THREE.Matrix4()
          .compose(
            new THREE.Vector3(0, -0.03, 0),
            new THREE.Quaternion(),
            new THREE.Vector3(1, 1, 1)
          )
      ),
    new THREE.BoxBufferGeometry(0.02, 0.13, 0.02)
      .applyMatrix4(
        new THREE.Matrix4()
          .compose(
            new THREE.Vector3(-1/2 - 0.02, 0, 0),
            new THREE.Quaternion(),
            new THREE.Vector3(1, 1, 1)
          )
      ),
    new THREE.BoxBufferGeometry(0.02, 0.13, 0.02)
      .applyMatrix4(
        new THREE.Matrix4()
          .compose(
            new THREE.Vector3(1/2 + 0.02, 0, 0),
            new THREE.Quaternion(),
            new THREE.Vector3(1, 1, 1)
          )
      ),
  ]);
  const material1 = new THREE.MeshBasicMaterial({
    color: 0x000000,
  });
  const outerMesh = new THREE.Mesh(geometry1, material1);
  o.add(outerMesh);

  const geometry2 = new THREE.PlaneBufferGeometry(1, 0.03)
    .applyMatrix4(
      new THREE.Matrix4()
        .compose(
          new THREE.Vector3(1/2, 0, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(1, 1, 1)
        )
    );
  const material2 = new THREE.ShaderMaterial({
    uniforms: {
      /* uBoundingBox: {
        type: 'vec4',
        value: new THREE.Vector4(
          boundingBox.min.x,
          boundingBox.min.y,
          boundingBox.max.x - boundingBox.min.x,
          boundingBox.max.y - boundingBox.min.y
        ),
        needsUpdate: true,
      }, */
      color: {
        type: 'c',
        value: new THREE.Color(),
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      // uniform float uTime;
      // uniform vec4 uBoundingBox;
      // varying vec3 vPosition;
      // varying vec3 vNormal;
      // uniform vec3 color;
      // attribute float time;
      // varying vec3 vPosition2;
      // varying vec3 vNormal;
      // varying float vTime;
      varying vec2 vUv;
      varying vec3 vColor;

      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) * 
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x) 
            + 6. * b - 9. * c + 3. * d) 
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }
      float easing2(float x) {
        return easing(easing(x));
      }
      
      // const float moveDistance = 20.;
      // const float q = 0.7;

      void main() {
        // float offsetTime = min(max((time + (1. - q)) / q, 0.), 1.);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        // vPosition2 = position2;
        // vColor = color;
        // vNormal = normal;
        // vTime = time;
        vUv = uv;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      uniform vec3 color;
      // uniform vec4 uBoundingBox;
      // uniform float uTime;
      // uniform float uTimeCubic;
      // varying vec3 vPosition2;
      varying vec2 vUv;
      // varying vec3 vColor;
      // varying float vTime;

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
    
      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) * 
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x) 
            + 6. * b - 9. * c + 3. * d) 
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }

      // const float q = 0.7;
      // const float q2 = 0.9;
      
      void main() {
        gl_FragColor = vec4(hueShift(color, vUv.x * PI) * 1.5, 1.);
      }
    `,
    // transparent: true,
    side: THREE.DoubleSide,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
  const innerMesh = new THREE.Mesh(geometry2, material2);
  innerMesh.position.x = -1/2;
  innerMesh.update = () => {
    const f = (Date.now() % 1000) / 1000;
    innerMesh.scale.x = f;
    innerMesh.material.uniforms.color.value.setHSL((f * 5) % 5, 0.5, 0.5);
    innerMesh.material.uniforms.color.needsUpdate = true;
  };
  o.add(innerMesh);

  o.update = () => {
    innerMesh.update();
    
    o.position.copy(basePosition)
      .add(
        localVector
          .set(
            -1 + Math.random() * 2,
            -1 + Math.random() * 2,
            -1 + Math.random() * 2
          )
          .normalize()
          .multiplyScalar(0.02)
        );
  };

  return o;
};
const _makeSkyboxMesh = () => {
	const sphereGeometry = new THREE.SphereBufferGeometry(300)
    .applyMatrix4(
      new THREE.Matrix4()
        .makeScale(-1, 1, 1)
    );
  const material = new THREE.ShaderMaterial({
    uniforms: {
      /* uBoundingBox: {
        type: 'vec4',
        value: new THREE.Vector4(
          boundingBox.min.x,
          boundingBox.min.y,
          boundingBox.max.x - boundingBox.min.x,
          boundingBox.max.y - boundingBox.min.y
        ),
        needsUpdate: true,
      }, */
      iTime: {
        // type: 'f',
        value: Date.now(),
        needsUpdate: true,
      },
			iResolution: {
        // type: 'f',
        value: new THREE.Vector2(),
        needsUpdate: true,
      },
			cameraPos: {
        // type: 'f',
        value: new THREE.Vector3(),
        needsUpdate: true,
      },
			cameraQuaternion: {
        // type: 'f',
        value: new THREE.Vector4(),
        needsUpdate: true,
      },
			projectionMatrixInverse: {
			  // type: 'f',
        value: new THREE.Matrix4(),
        needsUpdate: true,
			},
    },
    vertexShader: `\
      precision highp float;
      precision highp int;
			
			uniform vec4 cameraQuaternion;
			varying vec3 fwd;
			varying vec3 up;
			varying vec3 right;
			
			vec3 qtransform(vec4 q, vec3 v) { 
				return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
			}

      void main() {
        // float offsetTime = min(max((time + (1. - q)) / q, 0.), 1.);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        fwd = qtransform(cameraQuaternion, vec3(0, 0, 1));
				up = qtransform(cameraQuaternion, vec3(0, 1, 0));
				right = qtransform(cameraQuaternion, vec3(1, 0, 0));
      }
    `,
    fragmentShader: `
		uniform float iTime;
		uniform vec2 iResolution;
		uniform vec3 cameraPos;
    uniform vec4 cameraQuaternion;
    uniform mat4 projectionMatrixInverse;
		
		varying vec3 fwd;
		varying vec3 up;
		varying vec3 right;
		
		//
		// Volumetric Clouds Experiment
		//
		// A mashup of ideas from different sources:
		// * Magnus Wrenninge - Production Volume Rendering 
		//	 http://magnuswrenninge.com/productionvolumerendering
		// * Andrew Schneider - The Real-time Volumetric Cloudscapes of Horizon: Zero Dawn
		//   http://advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf
		// * Scratchapixel - Simulating the Colors of the Sky
		//   https://www.scratchapixel.com/lessons/procedural-generation-virtual-worlds/simulating-sky
		// * Ian McEwan, Ashima Arts - Array and textureless GLSL 2D/3D/4D simplex 
		//   https://github.com/ashima/webgl-noise
		// * and of course lots of iteration and tweaking
		//   https://github.com/valentingalea/shaderbox
		//	
		#define SHADERTOY

		#ifdef __cplusplus
		#define _in(T) const T &
		#define _inout(T) T &
		#define _out(T) T &
		#define _begin(type) type {
		#define _end }
		#define _mutable(T) T
		#define _constant(T) const T
		#define mul(a, b) (a) * (b)
		#endif

		#if defined(GL_ES) || defined(GL_SHADING_LANGUAGE_VERSION)
		#define _in(T) const in T
		#define _inout(T) inout T
		#define _out(T) out T
		#define _begin(type) type (
		#define _end )
		#define _mutable(T) T
		#define _constant(T) const T
		#define mul(a, b) (a) * (b)
		precision mediump float;
		#endif

		#ifdef HLSL
		#define _in(T) const in T
		#define _inout(T) inout T
		#define _out(T) out T
		#define _begin(type) {
		#define _end }
		#define _mutable(T) static T
		#define _constant(T) static const T
		#define vec2 float2
		#define vec3 float3
		#define vec4 float4
		#define mat2 float2x2
		#define mat3 float3x3
		#define mat4 float4x4
		#define mix lerp
		#define fract frac
		#define mod fmod
		#pragma pack_matrix(row_major)
		#endif

		#ifdef HLSLTOY
		cbuffer uniforms : register(b0) {
			float2 u_res;
			float u_time;
			float2 u_mouse;
		};
		void mainImage(_out(float4) fragColor, _in(float2) fragCoord);
		float4 main(float4 uv : SV_Position) : SV_Target{ float4 col; mainImage(col, uv.xy); return col; }
		#endif

		#if defined(__cplusplus) || defined(SHADERTOY)
		#define u_res iResolution
		#define u_time iTime
		#define u_mouse iMouse
		#endif

		#ifdef GLSLSANDBOX
		uniform float time;
		uniform vec2 mouse;
		uniform vec2 resolution;
		#define u_res resolution
		#define u_time time
		#define u_mouse mouse
		void mainImage(_out(vec4) fragColor, _in(vec2) fragCoord);
		void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
		#endif

		#ifdef UE4
		_constant(vec2) u_res = vec2(0, 0);
		_constant(vec2) u_mouse = vec2(0, 0);
		_mutable(float) u_time = 0;
		#endif

		#define PI 3.14159265359

		struct ray_t {
			vec3 origin;
			vec3 direction;
		};
		#define BIAS 1e-4 // small offset to avoid self-intersections

		struct sphere_t {
			vec3 origin;
			float radius;
			int material;
		};

		struct plane_t {
			vec3 direction;
			float distance;
			int material;
		};

		struct hit_t {
			float t;
			int material_id;
			vec3 normal;
			vec3 origin;
		};
		#define max_dist 1e8
		_constant(hit_t) no_hit = _begin(hit_t)
			float(max_dist + 1e1), // 'infinite' distance
			-1, // material id
			vec3(0., 0., 0.), // normal
			vec3(0., 0., 0.) // origin
		_end;

		// ----------------------------------------------------------------------------
		// Various 3D utilities functions
		// ----------------------------------------------------------------------------

    /* ray_t get_primary_ray(
			_in(vec3) cam_local_point,
			_inout(vec3) cam_origin,
			_inout(vec3) cam_look_at
		){
			vec3 fwd = normalize(cam_look_at - cam_origin);
			vec3 up = vec3(0, 1, 0);
			vec3 right = cross(up, fwd);
			up = cross(fwd, right);

			ray_t r = _begin(ray_t)
				cam_origin,
				normalize(fwd + up * cam_local_point.y + right * cam_local_point.x)
			_end;
			return r;
		} */

		ray_t get_primary_ray(
			_in(vec3) cam_local_point,
			_inout(vec3) cam_origin
		){
			ray_t r = _begin(ray_t)
				cam_origin,
				normalize(fwd * cam_local_point.z + up * cam_local_point.y + right * cam_local_point.x)
			_end;
			return r;
		}

		_constant(mat3) mat3_ident = mat3(1, 0, 0, 0, 1, 0, 0, 0, 1);


		mat2 rotate_2d(
			_in(float) angle_degrees
		){
			float angle = radians(angle_degrees);
			float _sin = sin(angle);
			float _cos = cos(angle);
			return mat2(_cos, -_sin, _sin, _cos);
		}

		mat3 rotate_around_z(
			_in(float) angle_degrees
		){
			float angle = radians(angle_degrees);
			float _sin = sin(angle);
			float _cos = cos(angle);
			return mat3(_cos, -_sin, 0, _sin, _cos, 0, 0, 0, 1);
		}

		mat3 rotate_around_y(
			_in(float) angle_degrees
		){
			float angle = radians(angle_degrees);
			float _sin = sin(angle);
			float _cos = cos(angle);
			return mat3(_cos, 0, _sin, 0, 1, 0, -_sin, 0, _cos);
		}

		mat3 rotate_around_x(
			_in(float) angle_degrees
		){
			float angle = radians(angle_degrees);
			float _sin = sin(angle);
			float _cos = cos(angle);
			return mat3(1, 0, 0, 0, _cos, -_sin, 0, _sin, _cos);
		}

		// http://http.developer.nvidia.com/GPUGems3/gpugems3_ch24.html
		vec3 linear_to_srgb(
			_in(vec3) color
		){
			const float p = 1. / 2.2;
			return vec3(pow(color.r, p), pow(color.g, p), pow(color.b, p));
		}
		vec3 srgb_to_linear(
			_in(vec3) color
		){
			const float p = 2.2;
			return vec3(pow(color.r, p), pow(color.g, p), pow(color.b, p));
		}

		#ifdef __cplusplus
		vec3 faceforward(
			_in(vec3) N,
			_in(vec3) I,
			_in(vec3) Nref
		){
			return dot(Nref, I) < 0 ? N : -N;
		}
		#endif

		float checkboard_pattern(
			_in(vec2) pos,
			_in(float) scale
		){
			vec2 pattern = floor(pos * scale);
			return mod(pattern.x + pattern.y, 2.0);
		}

		float band (
			_in(float) start,
			_in(float) peak,
			_in(float) end,
			_in(float) t
		){
			return
			smoothstep (start, peak, t) *
			(1. - smoothstep (peak, end, t));
		}

		// from https://www.shadertoy.com/view/4sSSW3
		// original http://orbit.dtu.dk/fedora/objects/orbit:113874/datastreams/file_75b66578-222e-4c7d-abdf-f7e255100209/content
		void fast_orthonormal_basis(
			_in(vec3) n,
			_out(vec3) f,
			_out(vec3) r
		){
			float a = 1. / (1. + n.z);
			float b = -n.x*n.y*a;
			f = vec3(1. - n.x*n.x*a, b, -n.x);
			r = vec3(b, 1. - n.y*n.y*a, -n.y);
		}

		// ----------------------------------------------------------------------------
		// Analytical surface-ray intersection routines
		// ----------------------------------------------------------------------------

		// geometrical solution
		// info: http://www.scratchapixel.com/old/lessons/3d-basic-lessons/lesson-7-intersecting-simple-shapes/ray-sphere-intersection/
		void intersect_sphere(
			_in(ray_t) ray,
			_in(sphere_t) sphere,
			_inout(hit_t) hit
		){
			vec3 rc = sphere.origin - ray.origin;
			float radius2 = sphere.radius * sphere.radius;
			float tca = dot(rc, ray.direction);
			if (tca < 0.) return;

			float d2 = dot(rc, rc) - tca * tca;
			if (d2 > radius2) return;

			float thc = sqrt(radius2 - d2);
			float t0 = tca - thc;
			float t1 = tca + thc;

			if (t0 < 0.) t0 = t1;
			if (t0 > hit.t) return;

			vec3 impact = ray.origin + ray.direction * t0;

			hit.t = t0;
			hit.material_id = sphere.material;
			hit.origin = impact;
			hit.normal = (impact - sphere.origin) / sphere.radius;
		}

		// Plane is defined by normal N and distance to origin P0 (which is on the plane itself)
		// a plane eq is: (P - P0) dot N = 0
		// which means that any line on the plane is perpendicular to the plane normal
		// a ray eq: P = O + t*D
		// substitution and solving for t gives:
		// t = ((P0 - O) dot N) / (N dot D)
		void intersect_plane(
			_in(ray_t) ray,
			_in(plane_t) p,
			_inout(hit_t) hit
		){
			float denom = dot(p.direction, ray.direction);
			if (denom < 1e-6) return;

			vec3 P0 = vec3(p.distance, p.distance, p.distance);
			float t = dot(P0 - ray.origin, p.direction) / denom;
			if (t < 0. || t > hit.t) return;
			
			hit.t = t;
			hit.material_id = p.material;
			hit.origin = ray.origin + ray.direction * t;
			hit.normal = faceforward(p.direction, ray.direction, p.direction);
		}

		// ----------------------------------------------------------------------------
		// Volumetric utilities
		// ----------------------------------------------------------------------------

		float isotropic_phase_func(float mu)
		{
			return
								 1.
			/ //-------------------
							4. * PI;
		}

		float rayleigh_phase_func(float mu)
		{
			return
							3. * (1. + mu*mu)
			/ //------------------------
								 (16. * PI);
		}

		float henyey_greenstein_phase_func(float mu)
		{
			// Henyey-Greenstein phase function factor [-1, 1]
			// represents the average cosine of the scattered directions
			// 0 is isotropic scattering
			// > 1 is forward scattering, < 1 is backwards
			const float g = 0.76;

			return
													 (1. - g*g)
			/ //---------------------------------------------
					 ((4. + PI) * pow(1. + g*g - 2.*g*mu, 1.5));
		}

		float schlick_phase_func(float mu)
		{
			// Schlick Phase Function factor
			// Pharr and  Humphreys [2004] equivalence to g from Henyey-Greenstein
			const float g = 0.76;
			const float k = 1.55*g - 0.55 * (g*g*g);

			return
												(1. - k*k)
			/ //-------------------------------------------
					 (4. * PI * (1. + k*mu) * (1. + k*mu));
		}

		struct volume_sampler_t {
			vec3 origin; // start of ray
			vec3 pos; // current pos of acccumulation ray
			float height;

			float coeff_absorb;
			float T; // transmitance

			vec3 C; // color
			float alpha;
		};

		volume_sampler_t begin_volume(
			_in(vec3) origin,
			_in(float) coeff_absorb
		){
			volume_sampler_t v = _begin(volume_sampler_t)
				origin, origin, 0.,
				coeff_absorb, 1.,
				vec3(0., 0., 0.), 0.
			_end;
			return v;
		}

		float illuminate_volume(
			_inout(volume_sampler_t) vol,
			_in(vec3) V,
			_in(vec3) L
		);

		void integrate_volume(
			_inout(volume_sampler_t) vol,
			_in(vec3) V,
			_in(vec3) L,
			_in(float) density,
			_in(float) dt
		){
			// change in transmittance (follows Beer-Lambert law)
			float T_i = exp(-vol.coeff_absorb * density * dt);
			// Update accumulated transmittance
			vol.T *= T_i;
			// integrate output radiance (here essentially color)
			vol.C += vol.T * illuminate_volume(vol, V, L) * density * dt;
			// accumulate opacity
			vol.alpha += (1. - T_i) * (1. - vol.alpha);
		}


		#define cld_march_steps (3)
		#define cld_coverage (.4)
		#define cld_thick (50.)
		#define cld_absorb_coeff (.2)
		#define cld_wind_dir vec3(0, 0, -u_time)
		#define cld_sun_dir normalize(vec3(0, 0/*abs(sin(u_time * .3))*/, -1))
		// _mutable(float) coverage_map;

		// ----------------------------------------------------------------------------
		// Noise function by iq from https://www.shadertoy.com/view/4sfGzS
		// ----------------------------------------------------------------------------

		float hash(
			_in(float) n
		){
			return fract(sin(n)*753.5453123);
		}

		float noise_iq(
			_in(vec3) x
		){
			vec3 p = floor(x);
			vec3 f = fract(x);
			f = f*f*(3.0 - 2.0*f);

		#if 1
				float n = p.x + p.y*157.0 + 113.0*p.z;
				return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
											 mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
									 mix(mix( hash(n+113.0), hash(n+114.0),f.x),
											 mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
		#else
			vec2 uv = (p.xy + vec2(37.0, 17.0)*p.z) + f.xy;
			vec2 rg = textureLod( iChannel0, (uv+.5)/256., 0.).yx;
			return mix(rg.x, rg.y, f.z);
		#endif
		}

		#define gnoise(x) noise_iq(x)

		//
		// Description : Array and textureless GLSL 2D/3D/4D simplex 
		//               noise functions.
		//      Author : Ian McEwan, Ashima Arts.
		//  Maintainer : ijm
		//     Lastmod : 20110822 (ijm)
		//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
		//               Distributed under the MIT License. See LICENSE file.
		//               https://github.com/ashima/webgl-noise
		// 

		vec3 mod289(vec3 x) {
			return x - floor(x * (1.0 / 289.0)) * 289.0;
		}

		vec4 mod289(vec4 x) {
			return x - floor(x * (1.0 / 289.0)) * 289.0;
		}

		vec4 permute(vec4 x) {
				 return mod289(((x*34.0)+1.0)*x);
		}

		vec4 taylorInvSqrt(vec4 r)
		{
			return 1.79284291400159 - 0.85373472095314 * r;
		}

		float snoise(vec3 v)
			{ 
			const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
			const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

		// First corner
			vec3 i  = floor(v + dot(v, C.yyy) );
			vec3 x0 =   v - i + dot(i, C.xxx) ;

		// Other corners
			vec3 g = step(x0.yzx, x0.xyz);
			vec3 l = 1.0 - g;
			vec3 i1 = min( g.xyz, l.zxy );
			vec3 i2 = max( g.xyz, l.zxy );

			//   x0 = x0 - 0.0 + 0.0 * C.xxx;
			//   x1 = x0 - i1  + 1.0 * C.xxx;
			//   x2 = x0 - i2  + 2.0 * C.xxx;
			//   x3 = x0 - 1.0 + 3.0 * C.xxx;
			vec3 x1 = x0 - i1 + C.xxx;
			vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
			vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

		// Permutations
			i = mod289(i); 
			vec4 p = permute( permute( permute( 
								 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
							 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
							 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

		// Gradients: 7x7 points over a square, mapped onto an octahedron.
		// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
			float n_ = 0.142857142857; // 1.0/7.0
			vec3  ns = n_ * D.wyz - D.xzx;

			vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

			vec4 x_ = floor(j * ns.z);
			vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

			vec4 x = x_ *ns.x + ns.yyyy;
			vec4 y = y_ *ns.x + ns.yyyy;
			vec4 h = 1.0 - abs(x) - abs(y);

			vec4 b0 = vec4( x.xy, y.xy );
			vec4 b1 = vec4( x.zw, y.zw );

			//vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
			//vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
			vec4 s0 = floor(b0)*2.0 + 1.0;
			vec4 s1 = floor(b1)*2.0 + 1.0;
			vec4 sh = -step(h, vec4(0, 0, 0, 0));

			vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
			vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

			vec3 p0 = vec3(a0.xy,h.x);
			vec3 p1 = vec3(a0.zw,h.y);
			vec3 p2 = vec3(a1.xy,h.z);
			vec3 p3 = vec3(a1.zw,h.w);

		//Normalise gradients
			vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
			p0 *= norm.x;
			p1 *= norm.y;
			p2 *= norm.z;
			p3 *= norm.w;

		// Mix final noise value
			vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
			m = m * m;
			return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
																		dot(p2,x2), dot(p3,x3) ) );
			}
		#define noise(x) snoise(x)

		// ----------------------------------------------------------------------------
		// Fractional Brownian Motion
		// depends on custom basis function
		// ----------------------------------------------------------------------------

		#define DECL_FBM_FUNC(_name, _octaves, _basis) float _name(_in(vec3) pos, _in(float) lacunarity, _in(float) init_gain, _in(float) gain) { vec3 p = pos; float H = init_gain; float t = 0.; for (int i = 0; i < _octaves; i++) { t += _basis * H; p *= lacunarity; H *= gain; } return t; }

		DECL_FBM_FUNC(fbm, 4, noise(p))
		DECL_FBM_FUNC(fbm_clouds, 5, abs(noise(p)))

		vec3 render_sky_color(
			_in(vec3) eye_dir
		){
			_constant(vec3) sun_color = vec3(1., .7, .55);
			float sun_amount = max(dot(eye_dir, cld_sun_dir), 0.);

			vec3 sky = mix(vec3(.0, .1, .4), vec3(.3, .6, .8), 1.0 - eye_dir.y);
			sky += sun_color * min(pow(sun_amount, 1500.0) * 5.0, 1.0);
			sky += sun_color * min(pow(sun_amount, 10.0) * .6, 1.0);

			return sky;
		}

		float density_func(
			_in(vec3) pos,
			_in(float) h
		){
			vec3 p = pos * .001 + cld_wind_dir;
			float dens = fbm_clouds(p * 2.032, 2.6434, .5, .5);
			
			dens *= smoothstep (cld_coverage, cld_coverage + .035, dens);

			//dens *= band(.2, .3, .5 + coverage_map * .5, h);

			return dens;
		}

		float illuminate_volume(
			_inout(volume_sampler_t) cloud,
			_in(vec3) V,
			_in(vec3) L
		){
			return exp(cloud.height) / 1.95;
		}

		vec4 render_clouds(
			_in(ray_t) eye
		){
			const int steps = cld_march_steps;
			const float march_step = cld_thick / float(steps);

			vec3 projection = eye.direction / eye.direction.y;
			vec3 iter = projection * march_step;

			float cutoff = dot(eye.direction, vec3(0, 1, 0));

			volume_sampler_t cloud = begin_volume(
				vec3(eye.origin.x, 0., eye.origin.z) + projection * 100.,
				// eye.origin + projection * 100.,
				cld_absorb_coeff);

			//coverage_map = gnoise(projection);
			//return vec4(coverage_map, coverage_map, coverage_map, 1);

			for (int i = 0; i < steps; i++) {
				cloud.height = (cloud.pos.y - cloud.origin.y)
					/ cld_thick;
				float dens = density_func(cloud.pos, cloud.height);

				integrate_volume(
					cloud,
					eye.direction, cld_sun_dir,
					dens, march_step);

				cloud.pos += iter;

				if (cloud.alpha > .999) break;
			}

			return vec4(cloud.C, cloud.alpha * smoothstep(.0, .2, cutoff));
		}

		void setup_camera(
			_inout(vec3) eye,
			_inout(vec3) look_at
		){
			eye = vec3(0, 1., 0);
			look_at = vec3(0, 1.6, -1);
		}

		void setup_scene()
		{
		}

		vec3 render(
			_in(ray_t) eye_ray,
			_in(vec3) point_cam
		){
			vec3 sky = render_sky_color(eye_ray.direction);
			if (dot(eye_ray.direction, vec3(0, 1, 0)) < 0.05) return sky;

			vec4 cld = render_clouds(eye_ray);
			vec3 col = mix(sky, cld.rgb, cld.a);

			return col;
		}

		#define FOV (45./60.) // 45 degrees
		// ----------------------------------------------------------------------------
		// Main Rendering function
		// depends on external defines: FOV
		// ----------------------------------------------------------------------------
		
		void main() {
			// assuming screen width is larger than height 
			vec2 aspect_ratio = vec2(u_res.x / u_res.y, 1);

			vec3 color = vec3(0, 0, 0);

			vec3 eye = cameraPos;
			// setup_camera(eye, look_at);

			setup_scene();

			vec4 ndcPos;
			ndcPos.xy = ((2.0 * gl_FragCoord.xy) - (2.0 * 0.)) / (iResolution) - 1.;
			ndcPos.z = (2.0 * gl_FragCoord.z - gl_DepthRange.near - gl_DepthRange.far) /
					(gl_DepthRange.far - gl_DepthRange.near);
			ndcPos.w = 1.0;

			vec4 clipPos = ndcPos / gl_FragCoord.w;
			vec4 eyePos = projectionMatrixInverse * clipPos;
			vec3 point_cam = eyePos.xyz / eyePos.w;

			ray_t ray = get_primary_ray(point_cam, eye);

			color += render(ray, point_cam);

			gl_FragColor = vec4(linear_to_srgb(color), 1);
		}`,
    // transparent: true,
    // side: THREE.DoubleSide,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
	const o = new THREE.Mesh(sphereGeometry, material);
  const startTime = Date.now();
	o.update = () => {
		const now = Date.now();
    material.uniforms.iTime.value = (now - startTime)/100000;
    material.uniforms.iTime.needsUpdate = true;
		
		const renderer = getRenderer();
		renderer.getSize(material.uniforms.iResolution.value);
		material.uniforms.iResolution.value.multiplyScalar(renderer.getPixelRatio());
    material.uniforms.iResolution.needsUpdate = true;
  
	  material.uniforms.cameraPos.value.copy(camera.position);
		material.uniforms.cameraPos.needsUpdate = true;
		
	  material.uniforms.cameraQuaternion.value.x = camera.quaternion.x;
	  material.uniforms.cameraQuaternion.value.y = camera.quaternion.y;
	  material.uniforms.cameraQuaternion.value.z = camera.quaternion.z;
	  material.uniforms.cameraQuaternion.value.w = camera.quaternion.w;
	  material.uniforms.cameraQuaternion.needsUpdate = true;
		
		material.uniforms.projectionMatrixInverse.value.copy(camera.projectionMatrixInverse);
		material.uniforms.projectionMatrixInverse.needsUpdate = true;
	};
  return o;
};
const _makeFieldMesh = () => {
	const size = 300; 
	const res = 4;
	const simplex = new MultiSimplex('lol', 6);
	const geometry = new THREE.PlaneBufferGeometry(size, size, size * res, size * res)
	  .applyMatrix4(
		  new THREE.Matrix4()
			  .makeRotationFromQuaternion(
				  new THREE.Quaternion()
					  .setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
				)
		);
	for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
	  localVector.fromArray(geometry.attributes.position.array, i);
		localVector.y = simplex.noise2D(localVector.x * 0.0005, localVector.z * 0.0005) * 3;
	  localVector.toArray(geometry.attributes.position.array, i);
	}
	geometry.computeVertexNormals();
	const tex = new THREE.Texture();
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.anisotropy = 16;
	(async () => {
	  const img = new Image();
		img.onload = () => {
		  tex.image = img;
			tex.needsUpdate = true;
		};
		img.onerror = err => {
		  console.warn(err);
		};
		img.src = `./assets2/land-textures/Vol_21_3_Base_Color.png`;
	})();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tex: {
				// type: 'f',
        value: tex,
        needsUpdate: true,
			},
			iTime: {
        // type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      varying vec2 vUv;
			varying vec3 vNormal;
      varying vec3 pos;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
				pos = position;
        gl_Position = projectionMatrix * mvPosition;
        vUv = uv * ${(size/10).toFixed(8)};
				vNormal = normal;
      }
    `,
    fragmentShader: `\
			uniform sampler2D tex;
			varying vec2 vUv;
			varying vec3 vNormal;
			varying vec3 pos;

      const vec3 col1 = vec3(${new THREE.Color(0x66bb6a).toArray().map(n => n.toFixed(8)).join(', ')});
			const vec3 col2 = vec3(${new THREE.Color(0x2e7d32).toArray().map(n => n.toFixed(8)).join(', ')});

      const vec3 l = normalize(vec3(1., -2., 3.));

			void main() {
				vec3 col = vec3(0.);
				col = mix(col1, col2, pos.y * 0.1);
				col *= 0.35 + abs(dot(vNormal, l));
				// col += texture(tex, vUv).rgb;
				gl_FragColor = vec4(col, 1.);
			}
		`,
    // transparent: true,
    // side: THREE.DoubleSide,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
	const o = new THREE.Mesh(geometry, material);
  // const startTime = Date.now();
	o.update = () => {
		/* const now = Date.now();
    material.uniforms.iTime.value = (now - startTime)/100000;
    material.uniforms.iTime.needsUpdate = true; */
	};
	
	const VIEW_DEPTH = 2000.0

	const MAX_TIMESTEP = 67 // max 67 ms/frame

	const HEIGHTFIELD_SIZE = 3072.0
	const HEIGHTFIELD_HEIGHT = 180.0
	const WATER_LEVEL = HEIGHTFIELD_HEIGHT * 0.305556 // 55.0
	const BEACH_TRANSITION_LOW = 0.31
	const BEACH_TRANSITION_HIGH = 0.36

	const LIGHT_DIR = new THREE.Vector3(0.0, 1.0, -1.0).normalize();
	// Vec3.normalize(LIGHT_DIR, LIGHT_DIR)

	const FOG_COLOR = new THREE.Color(0.74, 0.77, 0.91)
	const GRASS_COLOR = new THREE.Color(0.45, 0.46, 0.19)

	const WATER_COLOR = new THREE.Color(0.6, 0.7, 0.85)

	const WIND_DEFAULT = 1.5
	const WIND_MAX = 3.0

	const MAX_GLARE = 0.25 // max glare effect amount
	const GLARE_RANGE = 1.1 // angular range of effect
	const GLARE_YAW = Math.PI * 1.5 // yaw angle when looking directly at sun
	const GLARE_PITCH = 0.2 // pitch angle looking at sun
	const GLARE_COLOR = new THREE.Color(1.0, 0.8, 0.4)

	const INTRO_FADE_DUR = 2000

  const numGrassBlades = 256;
	const grassPatchRadius = 16;
	
	const fogDist = grassPatchRadius * 20.0
	const grassFogDist = grassPatchRadius * 2.0

	const grassMesh = grass.createMesh({
		lightDir: LIGHT_DIR,
		numBlades: numGrassBlades,
		radius: grassPatchRadius,
		// texture: assets.textures['grass'],
		// vertScript: assets.text['grass.vert'],
		// fragScript: assets.text['grass.frag'],
		// heightMap: terraMap,
		// heightMapScale,
		fogColor: FOG_COLOR,
		fogFar: fogDist,
		grassFogFar: grassFogDist,
		grassColor: GRASS_COLOR,
		transitionLow: BEACH_TRANSITION_LOW,
		transitionHigh: BEACH_TRANSITION_HIGH,
		windIntensity: WIND_DEFAULT,
	  vertScript: `\
		  // LICENSE: MIT
			// Copyright (c) 2017 by Mike Linkovich

			precision highp float;

			#define PI 3.141592654

			// These define values should be replaced by app before compiled
			#define PATCH_SIZE (%%PATCH_SIZE%%)
			#define BLADE_SEGS (%%BLADE_SEGS%%) // # of blade segments
			#define BLADE_HEIGHT_TALL (%%BLADE_HEIGHT_TALL%%) // height of a tall blade

			#define BLADE_DIVS (BLADE_SEGS + 1.0)  // # of divisions
			#define BLADE_VERTS (BLADE_DIVS * 2.0) // # of vertices (per side, so 1/2 total)

			#define TRANSITION_LOW   (%%TRANSITION_LOW%%)  // elevation of beach-grass transition (start)
			#define TRANSITION_HIGH  (%%TRANSITION_HIGH%%) // (end)
			#define TRANSITION_NOISE 0.06                  // transition noise scale

			const vec3 LIGHT_COLOR = vec3(1.0, 1.0, 0.99);
			const vec3 SPECULAR_COLOR = vec3(1.0, 1.0, 0.0);

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;
			uniform vec3 lightDir;
			uniform vec3 camDir; // direction cam is looking at
			uniform vec2 drawPos; // centre of where we want to draw
			uniform float time;  // used to animate blades
			uniform sampler2D heightMap;
			uniform vec3 heightMapScale;
			uniform vec3 grassColor;
			uniform float windIntensity;

			attribute float vindex; // Which vertex are we drawing - the main thing we need to know
			attribute vec4 offset; // {x:x, y:y, z:z, w:rot} (blade's position & rotation)
			attribute vec4 shape; // {x:width, y:height, z:lean, w:curve} (blade's shape properties)

			varying vec2 vSamplePos;
			varying vec4 vColor;
			varying vec2 vUv;

			// Rotate by an angle
			vec2 rotate (float x, float y, float r) {
				float c = cos(r);
				float s = sin(r);
				return vec2(x * c - y * s, x * s + y * c);
			}

			// Rotate by a vector
			vec2 rotate (float x, float y, vec2 r) {
				return vec2(x * r.x - y * r.y, x * r.y + y * r.x);
			}

			void main() {
				float vi = mod(vindex, BLADE_VERTS); // vertex index for this side of the blade
				float di = floor(vi / 2.0);  // div index (0 .. BLADE_DIVS)
				float hpct = di / BLADE_SEGS;  // percent of height of blade this vertex is at
				float bside = floor(vindex / BLADE_VERTS);  // front/back side of blade
				float bedge = mod(vi, 2.0);  // left/right edge (x=0 or x=1)
				// Vertex position - start with 2D shape, no bend applied
				vec3 vpos = vec3(
					shape.x * (bedge - 0.5) * (1.0 - pow(hpct, 3.0)), // taper blade edges as approach tip
					0.0, // flat y, unbent
					shape.y * di / BLADE_SEGS // height of vtx, unbent
				);

				// Start computing a normal for this vertex
				vec3 normal = vec3(rotate(0.0, bside * 2.0 - 1.0, offset.w), 0.0);

				// Apply blade's natural curve amount
				float curve = shape.w;
				// Then add animated curve amount by time using this blade's
				// unique properties to randomize its oscillation
				curve += shape.w + 0.125 * (sin(time * 4.0 + offset.w * 0.2 * shape.y + offset.x + offset.y));
				// put lean and curve together
				float rot = shape.z + curve * hpct;
				vec2 rotv = vec2(cos(rot), sin(rot));
				vpos.yz = rotate(vpos.y, vpos.z, rotv);
				normal.yz = rotate(normal.y, normal.z, rotv);

				// rotation of this blade as a vector
				rotv = vec2(cos(offset.w), sin(offset.w));
				vpos.xy = rotate(vpos.x, vpos.y, rotv);

				// Based on centre of view cone position, what grid tile should
				// this piece of grass be drawn at?
				vec2 gridOffset = vec2(
					floor((drawPos.x - offset.x) / PATCH_SIZE) * PATCH_SIZE + PATCH_SIZE / 2.0,
					floor((drawPos.y - offset.y) / PATCH_SIZE) * PATCH_SIZE + PATCH_SIZE / 2.0
				);

				// Find the blade mesh world x,y position
				vec2 bladePos = vec2(offset.xy + gridOffset);

				// height/light map sample position
				vSamplePos = bladePos.xy * heightMapScale.xy + vec2(0.5, 0.5);

				// Compute wind effect
				// Using the lighting channel as noise seems make the best looking wind for some reason!
				float wind = texture2D(heightMap, vec2(vSamplePos.x - time / 2500.0, vSamplePos.y - time / 200.0) * 6.0).g;
				//float wind = texture2D(heightMap, vec2(vSamplePos.x - time / 2500.0, vSamplePos.y - time / 100.0) * 6.0).r;
				//float wind = texture2D(heightMap, vec2(vSamplePos.x - time / 2500.0, vSamplePos.y - time / 100.0) * 4.0).b;
				// Apply some exaggeration to wind
				//wind = (clamp(wind, 0.125, 0.875) - 0.125) * (1.0 / 0.75);
				wind = (clamp(wind, 0.25, 1.0) - 0.25) * (1.0 / 0.75);
				wind = wind * wind * windIntensity;
				wind *= hpct; // scale wind by height of blade
				wind = -wind;
				rotv = vec2(cos(wind), sin(wind));
				// Wind blows in axis-aligned direction to make things simpler
				vpos.yz = rotate(vpos.y, vpos.z, rotv);
				normal.yz = rotate(normal.y, normal.z, rotv);

				// Sample the heightfield data texture to get altitude for this blade position
				vec4 hdata = texture2D(heightMap, vSamplePos);
				float altitude = hdata.r;

				// Determine if we want the grass to appear or not
				// Use the noise channel to perturb the altitude grass starts growing at.
				float noisyAltitude = altitude + hdata.b * TRANSITION_NOISE - (TRANSITION_NOISE / 2.0);
				float degenerate = (clamp(noisyAltitude, TRANSITION_LOW, TRANSITION_HIGH) - TRANSITION_LOW)
					* (1.0 / (TRANSITION_HIGH - TRANSITION_LOW));

				// Transition geometry toward degenerate as we approach beach altitude
				vpos *= degenerate;

				// Vertex color must be brighter because it is multiplied with blade texture
				vec3 color = min(vec3(grassColor.r * 1.25, grassColor.g * 1.25, grassColor.b * 0.95), 1.0);
				altitude *= heightMapScale.z;

				// Compute directional (sun) light for this vertex
				float diffuse = abs(dot(normal, lightDir)); // max(-dot(normal, lightDir), 0.0);
				float specMag = max(-dot(normal, lightDir), 0.0) * max(-dot(normal, camDir), 0.0);
				specMag = pow(specMag, 1.5); // * specMag * specMag;
				vec3 specular = specMag * SPECULAR_COLOR * 0.4;
				// Directional plus ambient
				float light = 0.35 * diffuse + 0.65;
				// Ambient occlusion shading - the lower vertex, the darker
				float heightLight = 1.0 - hpct;
				heightLight = heightLight * heightLight;
				light = max(light - heightLight * 0.5, 0.0);
				vColor = vec4(
					// Each blade is randomly colourized a bit by its position
					light * 0.75 + cos(offset.x * 80.0) * 0.1,
					light * 0.95 + sin(offset.y * 140.0) * 0.05,
					light * 0.95 + sin(offset.x * 99.0) * 0.05,
					1.0
				);
				vColor.rgb = vColor.rgb * LIGHT_COLOR * color;
				vColor.rgb = min(vColor.rgb + specular, 1.0);

				// grass texture coordinate for this vertex
				vUv = vec2(bedge, di * 2.0);

				// Translate to world coordinates
				vpos.x += bladePos.x;
				vpos.y += bladePos.y;
				vpos.z += altitude;

				gl_Position = projectionMatrix * modelViewMatrix * vec4(vpos, 1.0);
			}
		`,
		fragScript: `\
		  // LICENSE: MIT
			// Copyright (c) 2017 by Mike Linkovich

			precision highp float;

			// uniform sampler2D map;
			// uniform sampler2D heightMap;
			uniform vec3 fogColor;
			uniform float fogNear;
			uniform float fogFar;
			uniform float grassFogFar;

			varying vec2 vSamplePos;
			varying vec4 vColor;
			varying vec2 vUv;

			void main() {
				vec4 color = vec4(vColor);
				// vec4 hdata = texture2D(heightMap, vSamplePos);

				float depth = gl_FragCoord.z / gl_FragCoord.w;

				// make grass transparent as it approachs outer view distance perimeter
				color.a = 1.0 - smoothstep(grassFogFar * 0.55, grassFogFar * 0.8, depth);

				/* // apply terrain lightmap
				float light = hdata.g;
				color.r *= light;
				color.g *= light;
				color.b *= light; */

				// then apply atmosphere fog
				float fogFactor = smoothstep(fogNear, fogFar, depth);
				color.rgb = mix(color.rgb, fogColor, fogFactor);
				// output
				gl_FragColor = color;
			}
		`,
	});
	grassMesh.y = 5;
	grassMesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2);
	o.add(grassMesh);
	// window.grassMesh = grassMesh;
	
	/* const drawPos = _v
	Vec2.set(drawPos,
		ppos.x + Math.cos(pyaw) * grassPatchRadius,
		ppos.y + Math.sin(pyaw) * grassPatchRadius
	) */
	localVector.set(0, 0, -1)
	  .applyQuaternion(camera.quaternion);
	localVector2.copy(camera.position)
	  .add(
		  localVector3.set(0, 0, -grassPatchRadius/2)
			  .applyQuaternion(camera.quaternion)
	  );
	grass.update(grassMesh, Date.now(), camera.position, localVector, localVector2);
	
  return o;
};
const _makeBubbleMesh = () => {
	const geometry = new THREE.PlaneBufferGeometry(0.2, 0.2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      /* tex: {
				// type: 'f',
        value: tex,
        needsUpdate: true,
			}, */
			iTime: {
        // type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      varying vec2 vUv;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        vUv = uv;
			}
    `,
    fragmentShader: `\
		  uniform float iTime;

		  varying vec2 vUv;
			
			const vec2 iResolution = vec2(2048., 2048.);
			
			// ----------------------------------------------------------------------------
			// Rayleigh and Mie scattering atmosphere system
			//
			// implementation of the techniques described here:
			// http://www.scratchapixel.com/old/lessons/3d-advanced-lessons/simulating-the-colors-of-the-sky/atmospheric-scattering/
			// ----------------------------------------------------------------------------

			#ifdef GL_ES
			#define _in(T) const in T
			#define _inout(T) inout T
			#define _out(T) out T
			#define _begin(type) type (
			#define _end )
			#define mul(a, b) (a) * (b)
			#endif

			#define PI 3.14159265359

			// Shadertoy specific uniforms
			#define u_res iResolution
			#define u_time iTime
			#define u_mouse iMouse

			struct ray_t {
				vec3 origin;
				vec3 direction;
			};
			#define BIAS 1e-4 // small offset to avoid self-intersections

			struct sphere_t {
				vec3 origin;
				float radius;
				int material;
			};

			struct plane_t {
				vec3 direction;
				float distance;
				int material;
			};

			mat3 rotate_around_x(_in(float) angle_degrees)
			{
				float angle = radians(angle_degrees);
				float _sin = sin(angle);
				float _cos = cos(angle);
				return mat3(1, 0, 0, 0, _cos, -_sin, 0, _sin, _cos);
			}


			ray_t get_primary_ray(
				_in(vec3) cam_local_point,
				_inout(vec3) cam_origin,
				_inout(vec3) cam_look_at
			){
				vec3 fwd = normalize(cam_look_at - cam_origin);
				vec3 up = vec3(0, 1, 0);
				vec3 right = cross(up, fwd);
				up = cross(fwd, right);

				ray_t r = _begin(ray_t)
					cam_origin,
					normalize(fwd + up * cam_local_point.y + right * cam_local_point.x)
					_end;
				return r;
			}

			bool isect_sphere(_in(ray_t) ray, _in(sphere_t) sphere, _inout(float) t0, _inout(float) t1)
			{
				vec3 rc = sphere.origin - ray.origin;
				float radius2 = sphere.radius * sphere.radius;
				float tca = dot(rc, ray.direction);
				float d2 = dot(rc, rc) - tca * tca;
				if (d2 > radius2) return false;
				float thc = sqrt(radius2 - d2);
				t0 = tca - thc;
				t1 = tca + thc;

				return true;
			}

			// scattering coefficients at sea level (m)
			const vec3 betaR = vec3(5.5e-6, 13.0e-6, 22.4e-6); // Rayleigh 
			const vec3 betaM = vec3(21e-6); // Mie

			// scale height (m)
			// thickness of the atmosphere if its density were uniform
			const float hR = 7994.0; // Rayleigh
			const float hM = 1200.0; // Mie

			float rayleigh_phase_func(float mu)
			{
				return
						3. * (1. + mu*mu)
				/ //------------------------
							(16. * PI);
			}

			// Henyey-Greenstein phase function factor [-1, 1]
			// represents the average cosine of the scattered directions
			// 0 is isotropic scattering
			// > 1 is forward scattering, < 1 is backwards
			const float g = 0.76;
			float henyey_greenstein_phase_func(float mu)
			{
				return
									(1. - g*g)
				/ //---------------------------------------------
					((4. * PI) * pow(1. + g*g - 2.*g*mu, 1.5));
			}

			// Schlick Phase Function factor
			// Pharr and  Humphreys [2004] equivalence to g above
			const float k = 1.55*g - 0.55 * (g*g*g);
			float schlick_phase_func(float mu)
			{
				return
								(1. - k*k)
				/ //-------------------------------------------
					(4. * PI * (1. + k*mu) * (1. + k*mu));
			}

			const float earth_radius = 6360e3; // (m)
			const float atmosphere_radius = 6420e3; // (m)

			vec3 sun_dir = vec3(0, 1, 0);
			const float sun_power = 20.0;

			const sphere_t atmosphere = _begin(sphere_t)
				vec3(0, 0, 0), atmosphere_radius, 0
			_end;

			const int num_samples = 16;
			const int num_samples_light = 8;

			bool get_sun_light(
				_in(ray_t) ray,
				_inout(float) optical_depthR,
				_inout(float) optical_depthM
			){
				float t0, t1;
				isect_sphere(ray, atmosphere, t0, t1);

				float march_pos = 0.;
				float march_step = t1 / float(num_samples_light);

				for (int i = 0; i < num_samples_light; i++) {
					vec3 s =
						ray.origin +
						ray.direction * (march_pos + 0.5 * march_step);
					float height = length(s) - earth_radius;
					if (height < 0.)
						return false;

					optical_depthR += exp(-height / hR) * march_step;
					optical_depthM += exp(-height / hM) * march_step;

					march_pos += march_step;
				}

				return true;
			}

			vec3 get_incident_light(_in(ray_t) ray)
			{
				// "pierce" the atmosphere with the viewing ray
				float t0, t1;
				if (!isect_sphere(
					ray, atmosphere, t0, t1)) {
					return vec3(0);
				}

				float march_step = t1 / float(num_samples);

				// cosine of angle between view and light directions
				float mu = dot(ray.direction, sun_dir);

				// Rayleigh and Mie phase functions
				// A black box indicating how light is interacting with the material
				// Similar to BRDF except
				// * it usually considers a single angle
				//   (the phase angle between 2 directions)
				// * integrates to 1 over the entire sphere of directions
				float phaseR = rayleigh_phase_func(mu);
				float phaseM =
			#if 1
					henyey_greenstein_phase_func(mu);
			#else
					schlick_phase_func(mu);
			#endif

				// optical depth (or "average density")
				// represents the accumulated extinction coefficients
				// along the path, multiplied by the length of that path
				float optical_depthR = 0.;
				float optical_depthM = 0.;

				vec3 sumR = vec3(0);
				vec3 sumM = vec3(0);
				float march_pos = 0.;

				for (int i = 0; i < num_samples; i++) {
					vec3 s =
						ray.origin +
						ray.direction * (march_pos + 0.5 * march_step);
					float height = length(s) - earth_radius;

					// integrate the height scale
					float hr = exp(-height / hR) * march_step;
					float hm = exp(-height / hM) * march_step;
					optical_depthR += hr;
					optical_depthM += hm;

					// gather the sunlight
					ray_t light_ray = _begin(ray_t)
						s,
						sun_dir
					_end;
					float optical_depth_lightR = 0.;
					float optical_depth_lightM = 0.;
					bool overground = get_sun_light(
						light_ray,
						optical_depth_lightR,
						optical_depth_lightM);

					if (overground) {
						vec3 tau =
							betaR * (optical_depthR + optical_depth_lightR) +
							betaM * 1.1 * (optical_depthM + optical_depth_lightM);
						vec3 attenuation = exp(-tau);

						sumR += hr * attenuation;
						sumM += hm * attenuation;
					}

					march_pos += march_step;
				}

				return
					sun_power *
					(sumR * phaseR * betaR +
					sumM * phaseM * betaM);
			}

			void main() {
				vec2 aspect_ratio = vec2(u_res.x / u_res.y, 1);
				float fov = tan(radians(45.0));
				vec2 point_ndc = gl_FragCoord.xy / u_res.xy;
				vec3 point_cam = vec3((2.0 * point_ndc - 1.0) * aspect_ratio * fov, -1.0);

				vec3 col = vec3(0);

				// sun
				mat3 rot = rotate_around_x(-abs(sin(u_time / 2.)) * 90.);
				sun_dir *= rot;

					/* if (u_mouse.z < 0.1) {
							// sky dome angles
							vec3 p = point_cam;
							float z2 = p.x * p.x + p.y * p.y;
							float phi = atan(p.y, p.x);
							float theta = acos(1.0 - z2);
							vec3 dir = vec3(
									sin(theta) * cos(phi),
									cos(theta),
									sin(theta) * sin(phi));

							ray_t ray = _begin(ray_t)
									vec3(0, earth_radius + 1., 0),
									dir
							_end;

							col = get_incident_light(ray);
					} else { */
							vec3 eye = vec3 (0, earth_radius + 1., 0);
							vec3 look_at = vec3 (0, earth_radius + 1.5, -1);

							ray_t ray = get_primary_ray(point_cam, eye, look_at);

							if (dot(ray.direction, vec3(0, 1, 0)) > .0) {
									col = get_incident_light(ray);
							} else {
									col = vec3 (0.333);
							}
					// }

          gl_FragColor = vec4(col, 1);
			}
		`,
    transparent: true,
    side: THREE.DoubleSide,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });
	const o = new THREE.Mesh(geometry, material);
  const startTime = Date.now();
	o.update = () => {
		const now = Date.now();
    material.uniforms.iTime.value = (now - startTime)/1000;
    material.uniforms.iTime.needsUpdate = true;
	};
	
  return o;
};

const _makeLoaderMesh = () => {
  const o = new THREE.Object3D();
  
  const heartMesh = _makeHeartMesh();
  o.add(heartMesh);
  
  const vaccumMesh = _makeVaccumMesh();
  o.add(vaccumMesh);
  
  const fractureMesh = _makeFractureMesh();
  fractureMesh.position.x = -1;
  o.add(fractureMesh);
  
  const loadingBarMesh = _makeLoadingBarMesh(new THREE.Vector3(0, 0.5, 0));
  o.add(loadingBarMesh);
  
  o.update = () => {
    heartMesh.update();
    vaccumMesh.update();
    fractureMesh.update();
    loadingBarMesh.update();
  };
  
  return o;
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
  const files = globalState.get('files');
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
          const errors = [err].concat(globalState.get('errors'));
          globalState.set('errors', errors);
        }
      },
      'Ctrl-L': async cm => {
        try {
          await mintNft();
        } catch (err) {
          console.warn(err);
          const errors = [err].concat(globalState.get('errors'));
          globalState.set('errors', errors);
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
  
  const jsx = await (async () => {
    const res = await fetch('./editor.jsx');
    const s = await res.text();
    return s;
  })();
  const setCameraMode = cameraMode => {
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
Promise.all([
  app.waitForLoad(),
  htmlRenderer.waitForLoad(),
])
  .then(async () => {
    app.contentLoaded = true;
    app.startLoop();
    
    // hacks
    {
      const scene = app.getScene();
      const sceneLowPriority = app.getSceneLowPriority();
        
      const g = new CameraGeometry();
      const m = new THREE.MeshBasicMaterial({
        color: 0x333333,
      });
      const cameraMesh = new THREE.Mesh(g, m);
      cameraMesh.position.set(0, 10, -8);
      cameraMesh.frustumCulled = false;
      scene.add(cameraMesh);

      const mouseUiMesh = _makeMouseUiMesh();
      scene.add(mouseUiMesh);
      app.addEventListener('frame', () => {
        mouseUiMesh.update();
      });
      renderer.domElement.addEventListener('mousemove', e => {
        const intersection = getUiForwardIntersection(renderer, camera, e, localVector);
        if (!intersection) {
          throw new Error('could not intersect in front of the camera; the math went wrong');
        }
        mouseUiMesh.target.position.copy(intersection)
          .sub(camera.position);
        mouseUiMesh.target.quaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            localVector.set(0, 0, 0),
            localVector2.set(0, 0, -1).applyQuaternion(camera.quaternion),
            localVector3.set(0, 1, 0)
          )
        );
      });
      
      const objectUiMeshes = [];
      world.addEventListener('objectsadd', e => {
        const object = e.data;

        const objectUiMesh = _makeObjectUiMesh(object);
        sceneLowPriority.add(objectUiMesh);
        
        app.addEventListener('frame', () => {
          objectUiMesh.update();
        });
        objectUiMeshes.push(objectUiMesh);
      });
      world.addEventListener('objectsremove', e => {
        const object = e.data;
        const objectUiMeshIndex = objectUiMeshes.findIndex(objectUiMesh => objectUiMesh.object === object);
        if (objectUiMeshIndex !== -1) {
          const objectUiMesh = objectUiMeshes[objectUiMeshIndex];
          objectUiMesh.parent.remove(objectUiMesh);
          objectUiMeshes.splice(objectUiMeshIndex, 1);
        }
      });
      
      // double-click to look at object
      renderer.domElement.addEventListener('dblclick', async e => {
        const hoverObject = weaponsManager.getMouseHoverObject();
        const hoverPhysicsId = weaponsManager.getMouseHoverPhysicsId();
        if (hoverObject) {
          camera.quaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              camera.position,
              hoverObject.position,
              localVector.set(0, 1, 0),
            )
          );
          
          weaponsManager.setMouseSelectedObject(hoverObject, hoverPhysicsId);
        }
      });
      
      const contextMenuMesh = _makeContextMenuMesh(mouseUiMesh);
      scene.add(contextMenuMesh);
      app.addEventListener('frame', () => {
        contextMenuMesh.update();
      });
      renderer.domElement.addEventListener('click', async e => {
        if (contextMenuMesh.visible) {
          const highlightedIndex = contextMenuMesh.getHighlightedIndex();
          const option = realContextMenuOptions[highlightedIndex];
          switch (option) {
            case 'New...': {
              console.log('click new');
              break;
            }
            case 'Select': {
              console.log('click select');
              break;
            }
            case 'Possess': {
              const object = weaponsManager.getContextMenuObject();
              await app.possess(object);
              world.removeObject(object.instanceId);
              break;
            }
            case 'Edit': {
              console.log('click edit');
              break;
            }
            case 'Break': {
              const object = weaponsManager.getContextMenuObject();
              object.hit();
              break;
            }
            case 'Remove': {
              const object = weaponsManager.getContextMenuObject();
              world.removeObject(object.instanceId);
              break;
            }
          }
        }
      });
      renderer.domElement.addEventListener('mousemove', e => {   
        updateRaycasterFromMouseEvent(renderer, camera, e, localRaycaster);
        
        if (contextMenuMesh.visible) {
          localArray.length = 0;
          const intersections = localRaycaster.intersectObject(contextMenuMesh, true, localArray);
          if (intersections.length > 0) {
            contextMenuMesh.intersectUv(intersections[0].uv);
          } else {
            contextMenuMesh.intersectUv(null);
          }
        }
      });

      const inventoryMesh = _makeInventoryMesh();
      inventoryMesh.position.set(2, 1.2, -1);
      inventoryMesh.frustumCulled = false;
      scene.add(inventoryMesh);
      app.addEventListener('frame', () => {
        inventoryMesh.update();
      });
			
			(async () => {
				const arrowMesh = await _makeArrowMesh();
				arrowMesh.position.set(0, 2, -1);
				scene.add(arrowMesh);
				app.addEventListener('frame', () => {
					arrowMesh.update();
				});
			})();

      (async () => {
				const blockMesh = await _makeBlockMesh();
				blockMesh.position.set(0, 0, 0);
				scene.add(blockMesh);
				app.addEventListener('frame', () => {
					blockMesh.update();
				});
			})();
			
			const tattooMesh = _makeTattooMesh();
			tattooMesh.position.set(-2, 1, -1);
			scene.add(tattooMesh);
			
			(async () => {
				const corruptionMesh = await _makeCorruptionMesh();
				corruptionMesh.position.set(0, 4.65, -2.8);
				scene.add(corruptionMesh);
				app.addEventListener('frame', () => {
					corruptionMesh.update();
				});
		  })();

      const loaderMesh = _makeLoaderMesh();
      loaderMesh.position.set(0, 1.2, -1);
      loaderMesh.frustumCulled = false;
      scene.add(loaderMesh);
      app.addEventListener('frame', () => {
        loaderMesh.update();
      });
			
			const skyboxMesh = _makeSkyboxMesh();
			scene.add(skyboxMesh);
			app.addEventListener('frame', () => {
        skyboxMesh.update();
      });
			
			const fieldMesh = _makeFieldMesh();
			scene.add(fieldMesh);
      app.addEventListener('frame', () => {
        fieldMesh.update();
      });
      
			const bubbleMesh = _makeBubbleMesh();
			bubbleMesh.position.y = 5;
			scene.add(bubbleMesh);
      app.addEventListener('frame', () => {
        bubbleMesh.update();
      });
			
      renderer.domElement.addEventListener('select', e => {
        const {object, physicsId} = e.data;
        const objects = globalState.get('objects');
        const index = objects.indexOf(object);
        if (index !== -1) {
          // console.log('got select', objects, object, index);
          globalState.set('selectedObjectIndex', index);
          globalState.set('selectedTab', 'scene');
        }
      });
      
      app.addEventListener('frame', () => {
        const dragRightSpec = weaponsManager.getDragRightSpec();
        if (dragRightSpec) {
          const {cameraStartPosition, clientX, clientY} = dragRightSpec;
          const e = weaponsManager.getLastMouseEvent();
          
          const startMousePosition = getUiForwardIntersection(renderer, camera, {
            clientX,
            clientY,
          }, localVector);
          const endMousePosition = getUiForwardIntersection(renderer, camera, e, localVector2);
          
          camera.position.copy(cameraStartPosition)
            .add(
              localVector3.copy(startMousePosition)
                .sub(endMousePosition)
             );
          camera.updateMatrixWorld();
        }
      });
      app.addEventListener('frame', () => {
        for (const objectUiMesh of objectUiMeshes) {
          objectUiMesh.keyMesh.visible = false;
          objectUiMesh.keyCircleMesh.visible = false;
        }
        
        const usableObject = weaponsManager.getUsableObject();
        if (usableObject) {
          const objectUiMesh = objectUiMeshes.find(objectUiMesh => objectUiMesh.object === usableObject);
          
          const now = Date.now();
          const f = weaponsManager.getUseSpecFactor(now);
          if (f > 0) {
            const s = 1 - f*0.3;
            objectUiMesh.keyMesh.scale.setScalar(s);
            objectUiMesh.keyCircleMesh.scale.setScalar(s);
            
            objectUiMesh.keyCircleMesh.material.uniforms.uTime.value = f;
            objectUiMesh.keyCircleMesh.material.uniforms.uTime.needsUpdate = true;
          } else {
            objectUiMesh.keyMesh.scale.setScalar(1);
            objectUiMesh.keyCircleMesh.scale.setScalar(1);
            
            objectUiMesh.keyCircleMesh.material.uniforms.uTime.value = 0;
            objectUiMesh.keyCircleMesh.material.uniforms.uTime.needsUpdate = true;
          }
          
          objectUiMesh.keyMesh.visible = true;
          objectUiMesh.keyCircleMesh.visible = true;
          
          // lastUseFactor = f;
        }
      });
      renderer.domElement.addEventListener('use', e => {
        console.log('got use event', e);
      });
    }
    // tutorial
    {
      const o = await runtime.loadFile({
        url: `https://webaverse.github.io/assets/
sacks3.vrm`,
        name: 'sacks3.vrm',
      });
      const rig = new Avatar(o.raw, {
        fingers: true,
        hair: true,
        visemes: true,
        debug: false,
      });
      rig.model.isVrm = true;
      rig.aux = new RigAux({
        rig,
        scene,
      });
      rig.aux.rig = rig;
      rig.setTopEnabled(false);
      rig.setBottomEnabled(false);
      rig.inputs.hmd.position.set(0, 1.6, -1);
      rig.inputs.hmd.quaternion.setFromAxisAngle(localVector.set(0, 1, 0), Math.PI);
      rig.update(Date.now(), 0);
      
      // avatar.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      // console.log('got avatar', rig);
      scene.add(rig.model);
      
      const script = [
        { // angry
          startTime: 0,
          sustain: 2,
          release: 3,
          index: 5,
        },
        { // wide eye
          startTime: 0,
          attack: 1,
          sustain: 2,
          release: 1,
          index: 19,
        },
        { // smile
          startTime: 0,
          sustain: 2,
          release: 1,
          index: 32,
        },
        { // eyes closed
          startTime: 2,
          attack: 0.5,
          sustain: 0.1,
          release: 0.5,
          index: 12,
        },
        /* { // ooo
          startTime: 1,
          sustain: 1,
          index: 27,
        }, */
      ].map(o => {
        o.type = 'viseme';
        o.attack = o.attack || 0;
        o.sustain = o.sustain || 0;
        o.release = o.release || 0;

        o.duration = o.attack + o.sustain + o.release;
        o.endTime = o.startTime + o.duration;
        
        return o;
      }).concat([
        {
          startTime: 0,
          duration: 10,
          target: new THREE.Vector3(-1, 1.5, 3),
        },
      ].map(o => {
        o.type = 'look';
        o.endTime = o.startTime + o.duration;
        
        return o;
      }));
      let audio = null;
			let activeViseme = -1;
			const _updateActiveViseme = () => {
				if (activeViseme !== -1) {
					rigManager.localRig.activeVisemes = [
						{
							index: activeViseme,
							value: 1,
						},
					];
			  } else {
					rigManager.localRig.activeVisemes = [];
				}
			};
      window.addEventListener('keydown', async e => {
        if (e.which === 76) { // L
          audio = document.createElement('audio');
          // this.audio.muted = false;
          audio.src = './assets/ghost2.mp3';
          document.body.appendChild(audio);
          await new Promise((accept, reject) => {
            audio.oncanplaythrough = () => {
              accept();
            };
            audio.onerror = reject;
          });
          await rigManager.localRig.setMicrophoneMediaStream(audio, {
            playbackRate: 1,
            // muted: false,
          });
          audio.play();
        } else if (e.which === 35) {
					activeViseme--;
					if (activeViseme < -1) {
					  activeViseme = -1;
					}
					_updateActiveViseme();
				} else if (e.which === 40) {
				  activeViseme++;
					_updateActiveViseme();
				} else if (e.which === 34) {
				  rigManager.localRig.eyeTarget.set(0, 4.65, -10);
					rigManager.localRig.eyeTargetEnabled = true;
				}
      });
      app.addEventListener('frame', e => {
        const _updateAvatarBody = () => {
          const {now, timeDiff} = e.data;
          const timeDiffSeconds = timeDiff/1000;
          
          /* this.smoothVelocity.lerp(positionDiff, 0.5);
          this.lastPosition.copy(currentPosition);

          const useTime = physicsManager.getUseTime();
          for (let i = 0; i < 2; i++) {
            this.localRig.setHandEnabled(i, !!session || (useTime === -1 && !!appManager.equippedObjects[i]));
          } */
          rig.setTopEnabled(false);
          rig.setBottomEnabled(false);
          
          rig.inputs.hmd.position.set(0, 1.6, -1);
          rig.inputs.hmd.quaternion.setFromAxisAngle(localVector.set(0, 1, 0), Math.PI);
          rig.update(now, timeDiffSeconds);
        };
        _updateAvatarBody();
        
        const _updateAvatarFace = () => {
          if (audio) {
            const {currentTime} = audio;
            rig.activeVisemes = script.map(o => {
              if (o.type === 'viseme') {
                if (o.startTime < currentTime && currentTime < o.endTime) {
                  let value;
                  if (currentTime < o.attack) {
                    value = (currentTime - o.startTime) / o.attack;
                  } else if (currentTime < (o.attack + o.sustain)) {
                    value = 1;
                  } else if (currentTime < (o.attack + o.sustain + o.release)) {
                    value = 1 - (currentTime - (o.attack + o.sustain)) / o.release;
                  } else {
                    // can't happen
                    value = 1;
                  }
                  return {
                    index: o.index,
                    value,
                  };
                } else {
                  return null;
                }
              } else {
                return null;
              }
            }).filter(n => n !== null);
            const eyeTarget = script.find(o => o.type === 'look' && currentTime < o.endTime);
            if (eyeTarget) {
              rig.eyeTarget.copy(eyeTarget.target);
              rig.eyeTargetEnabled = true;
            } else {
              rig.eyeTargetEnabled = false;
            }
          }
        };
        _updateAvatarFace();
      });
    }
    
    // load scene
    const defaultScene = [
      {
        position: new THREE.Vector3(),
        quaternion: new THREE.Quaternion(),
        contentId: `https://webaverse.github.io/home/home.glb`,
      },
      {
        position: new THREE.Vector3(-3, 0, -2),
        quaternion: new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, -1),
          new THREE.Vector3(-1, 0, 0),
        ),
        contentId: `https://webaverse.github.io/assets/table.glb`,
      },
      {
        position: new THREE.Vector3(2, 0, -3),
        quaternion: new THREE.Quaternion()/* .setFromUnitVectors(
          new THREE.Vector3(0, 0, -1),
          new THREE.Vector3(-1, 0, 0),
        ) */,
        contentId: `https://avaer.github.io/mirror/index.js`,
      },
      {
        position: new THREE.Vector3(-1, 1.5, -1.5),
        quaternion: new THREE.Quaternion(),
        contentId: `https://silk.webaverse.com/index.t.js`,
      },
      {
        position: new THREE.Vector3(-3, 0, -3.5),
        quaternion: new THREE.Quaternion()
          .setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -Math.PI/2
          ),
        contentId: `./scilly.vrm`,
      },
      {
        position: new THREE.Vector3(-3, 0, -4.5),
        quaternion: new THREE.Quaternion()
          .setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -Math.PI/2
          ),
        contentId: `https://webaverse.github.io/assets/sacks3.vrm`,
      },
      {
        position: new THREE.Vector3(-2, 0, -6),
        quaternion: new THREE.Quaternion(),
        contentId: `https://avaer.github.io/dragon-pet/manifest.json`,
      },
      {
        position: new THREE.Vector3(3, 3, -7),
        quaternion: new THREE.Quaternion()
          .setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2),
        contentId: 188,
      },
      {
        position: new THREE.Vector3(3, 3, -9),
        quaternion: new THREE.Quaternion()
          .setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2),
        contentId: 'https://avaer.github.io/sakura/manifest.json',
      },
      {
        position: new THREE.Vector3(0.5, 3, -13),
        quaternion: new THREE.Quaternion(),
        contentId: 'https://webaverse.com/rainbow-dash.gif',
      },
      /* {
        position: new THREE.Vector3(-3, 1.5, -1),
        quaternion: new THREE.Quaternion(),
        contentId: `https://avaer.github.io/lightsaber/manifest.json`,
      },
      {
        position: new THREE.Vector3(-3, 1.5, -2),
        quaternion: new THREE.Quaternion(),
        contentId: `https://avaer.github.io/hookshot/index.js`,
      }, */
    ];
    for (const e of defaultScene) {
      const {position, quaternion, contentId} = e;
      const loadedObject = await world.addObject(contentId, null, position, quaternion, {
        // physics,
        // physics_url,
        // autoScale,
      });
      const _getName = contentId => {
        if (typeof contentId === 'number') {
          return contentId + '';
        } else {
          return contentId.match(/([^\/]*)$/)[1];
        }
      };
      loadedObject.name = _getName(contentId);
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