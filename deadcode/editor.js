import * as THREE from 'three';
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils';
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
// import TransformGizmo from './TransformGizmo.js';
// import transformControls from './transform-controls.js';
import easing from './easing.js';
import ghDownloadDirectory from './gh-download-directory.js';

const cubicBezier = easing(0, 1, 0, 1);
// const cubicBezier2 = v => cubicBezier(cubicBezier(v));
const ghDownload = ghDownloadDirectory.default;
// window.ghDownload = ghDownload;
const htmlRenderer = new HtmlRenderer();

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
  loadedObject = await world.addObject(u);
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
      
      const loaderMesh = _makeLoaderMesh();
      loaderMesh.position.set(0, 1.2, -1);
      loaderMesh.frustumCulled = false;
      scene.add(loaderMesh);
      app.addEventListener('frame', () => {
        loaderMesh.update();
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
    } // end hacks
    
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
        contentId: `https://webaverse.github.io/assets/
shilo.vrm`,
      },
      {
        position: new THREE.Vector3(-3, 0, -4.5),
        quaternion: new THREE.Quaternion()
          .setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            -Math.PI/2
          ),
        contentId: `https://webaverse.github.io/assets/
sacks3.vrm`,
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
      const {position, quaternion, scale, contentId} = e;
      const loadedObject = await world.addObject(contentId, null, position, quaternion, scale);
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