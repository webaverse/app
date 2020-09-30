/* global Web3 */
/* eslint no-unused-vars: 0 */
import * as THREE from './three.module.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import {OrbitControls} from './OrbitControls.js';
import {GLTFLoader} from './GLTFLoader.js';
import {GLTFExporter} from './GLTFExporter.js';
import {TransformControls} from './TransformControls.js';
import {tryLogin, loginManager} from './login.js';
import runtime from './runtime.js';
import {parseQuery, hex2Uint8Array, downloadFile, mergeMeshes} from './util.js';
import {rigManager} from './rig.js';
import {makeCubeMesh, /*makeUiFullMesh,*/ makeTextMesh, makeToolsMesh, makeDetailsMesh, makeInventoryMesh, makeColorsMesh, makeIconMesh, intersectUi/*, makeRayMesh*/} from './vr-ui.js';
import {
  THING_SHADER,
  makeDrawMaterial,
} from './shaders.js';
import {makeLineMesh, makeTeleportMesh} from './teleport.js';
import geometryManager /* {
  geometrySet,
  tracker,
  landAllocators,
  landBufferAttributes,
  vegetationAllocators,
  vegetationBufferAttributes,
  thingAllocators,
  thingBufferAttributes,

  geometryWorker,
  
  chunkMesh,
  worldContainer,
  chunkMeshContainer,
  currentChunkMesh,
  currentVegetationMesh,
  currentThingMesh,
} */ from './geometry-manager.js';
import uiManager from './ui-manager.js';
import {makeAnimalFactory} from './animal.js';
import {
  PARCEL_SIZE,
  SUBPARCEL_SIZE,
  SUBPARCEL_SIZE_P1,
  SUBPARCEL_SIZE_P3,
  NUM_PARCELS,
  MAX_NAME_LENGTH,

  numSlices,
  slabRadius,

  chunkDistance,
  BUILD_SNAP,

  colors,
  
  presenceHost,
} from './constants.js';
import {makePromise, getNextMeshId, WaitQueue} from './util.js';
import storage from './storage.js';
import easing from './easing.js';
import {planet} from './planet.js';
import {player} from './player.js';
import {Bot} from './bot.js';
import {Sky} from './Sky.js';
import {GuardianMesh} from './land.js';
import {storageHost} from './constants.js';
import {CapsuleGeometry} from './CapsuleGeometry.js';
import {renderer, scene, camera, appManager} from './app-object.js';
import weapons from './weapons-manager.js';
import inventory from './inventory.js';

const zeroVector = new THREE.Vector3(0, 0, 0);
const capsuleUpQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
const pid4 = Math.PI / 4;
const leftHandOffset = new THREE.Vector3(0.2, -0.2, -0.3);
const rightHandOffset = new THREE.Vector3(-0.2, -0.2, -0.3);
// const redColorHex = new THREE.Color(0xef5350).multiplyScalar(2).getHex();

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localFrustum = new THREE.Frustum();
const localRaycaster = new THREE.Raycaster();
const localColor = new THREE.Color();
const localObject = new THREE.Object3D();

(async () => {
  await tryLogin();
})(); 

const loadPromise = makePromise();

const dolly = new THREE.Object3D();
dolly.add(camera);
scene.add(dolly);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
directionalLight.position.set(1, 2, 3);
scene.add(directionalLight);
/* const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1);
scene.add(directionalLight2); */

const orbitControls = new OrbitControls(camera, canvas, document);
orbitControls.screenSpacePanning = true;
orbitControls.enableMiddleZoom = false;
orbitControls.target.copy(camera.position).add(new THREE.Vector3(0, camera.position.y, -3).applyQuaternion(camera.quaternion));
orbitControls.update();

loginManager.addEventListener('avatarchange', async (e) => {
  if (e.data) {
    rigManager.setLocalAvatarUrl(`${storageHost}/${e.data}`);
  } else {
    rigManager.addLocalRig(null);
  }
});

const cubicBezier = easing(0, 1, 0, 1);

let skybox = null;

/* const _loadGltf = u => new Promise((accept, reject) => {
  new GLTFLoader().load(u, o => {
    o = o.scene;
    accept(o);
  }, xhr => {}, reject);
}); */
/* const _getStringLength = (uint8Array, offset) => {
  let i;
  for (i = 0; i < uint8Array.length; i++, offset++) {
    if (uint8Array[offset] === 0) {
      break;
    }
  }
  return i;
}; */
const _addItem = (position, quaternion) => {
  const itemMesh = (() => {
    const radius = 0.5;
    const segments = 12;
    const color = 0x66bb6a;
    const opacity = 0.5;

    const object = new THREE.Object3D();

    const matMeshes = [woodMesh, stoneMesh, metalMesh];
    const matIndex = Math.floor(Math.random() * matMeshes.length);
    const matMesh = matMeshes[matIndex];
    const matMeshClone = matMesh.clone();
    matMeshClone.position.y = 0.5;
    matMeshClone.visible = true;
    matMeshClone.isBuildMesh = true;
    object.add(matMeshClone);

    const skirtGeometry = new THREE.CylinderBufferGeometry(radius, radius, radius, segments, 1, true)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, radius / 2, 0));
    const ys = new Float32Array(skirtGeometry.attributes.position.array.length / 3);
    for (let i = 0; i < skirtGeometry.attributes.position.array.length / 3; i++) {
      ys[i] = 1 - skirtGeometry.attributes.position.array[i * 3 + 1] / radius;
    }
    skirtGeometry.setAttribute('y', new THREE.BufferAttribute(ys, 1));
    // skirtGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.5, 0));
    const skirtMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uAnimation: {
          type: 'f',
          value: 0,
        },
      },
      vertexShader: `\
        #define PI 3.1415926535897932384626433832795

        uniform float uAnimation;
        attribute float y;
        attribute vec3 barycentric;
        varying float vY;
        varying float vUv;
        varying float vOpacity;
        void main() {
          vY = y * ${opacity.toFixed(8)};
          vUv = uv.x + uAnimation;
          vOpacity = 0.5 + 0.5 * (sin(uAnimation*20.0*PI*2.0)+1.0)/2.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `\
        #define PI 3.1415926535897932384626433832795

        uniform sampler2D uCameraTex;
        varying float vY;
        varying float vUv;
        varying float vOpacity;

        vec3 c = vec3(${new THREE.Color(color).toArray().join(', ')});

        void main() {
          float a = vY * (0.9 + 0.1 * (sin(vUv*PI*2.0/0.02) + 1.0)/2.0) * vOpacity;
          gl_FragColor = vec4(c, a);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      // blending: THREE.CustomBlending,
    });
    const skirtMesh = new THREE.Mesh(skirtGeometry, skirtMaterial);
    skirtMesh.frustumCulled = false;
    skirtMesh.isBuildMesh = true;
    object.add(skirtMesh);

    let animation = null;
    object.pickUp = () => {
      if (!animation) {
        skirtMesh.visible = false;

        const now = Date.now();
        const startTime = now;
        const endTime = startTime + 1000;
        const startPosition = object.position.clone();
        animation = {
          update(posePosition) {
            const now = Date.now();
            const factor = Math.min((now - startTime) / (endTime - startTime), 1);

            if (factor < 0.5) {
              const localFactor = factor / 0.5;
              object.position.copy(startPosition)
                .lerp(posePosition, cubicBezier(localFactor));
            } else if (factor < 1) {
              const localFactor = (factor - 0.5) / 0.5;
              object.position.copy(posePosition);
            } else {
              object.parent.remove(object);
              itemMeshes.splice(itemMeshes.indexOf(object), 1);
              animation = null;
            }
          },
        };
      }
    };
    object.update = posePosition => {
      if (!animation) {
        const now = Date.now();
        skirtMaterial.uniforms.uAnimation.value = (now % 60000) / 60000;
        matMeshClone.rotation.y = (now % 5000) / 5000 * Math.PI * 2;
      } else {
        animation.update(posePosition);
      }
    };

    return object;
  })();
  itemMesh.position.copy(position).applyMatrix4(currentVegetationMesh.matrixWorld);
  itemMesh.quaternion.copy(quaternion);
  scene.add(itemMesh);
  itemMeshes.push(itemMesh);
};
const _snapBuildPosition = p => {
  p.x = Math.floor(p.x / BUILD_SNAP) * BUILD_SNAP + BUILD_SNAP / 2;
  p.y = Math.floor(p.y / BUILD_SNAP) * BUILD_SNAP + BUILD_SNAP / 2;
  p.z = Math.floor(p.z / BUILD_SNAP) * BUILD_SNAP + BUILD_SNAP / 2;
  return p;
};
const _meshEquals = (a, b) => {
  if (a.position.equals(b.position)) {
    if (a.type === b.vegetationType) {
      if (a.type === 'wood_wall') {
        return Math.floor(a.quaternion.x / pid4) === Math.floor(b.quaternion.x / pid4) &&
          Math.floor(a.quaternion.y / pid4) === Math.floor(b.quaternion.y / pid4) &&
          Math.floor(a.quaternion.z / pid4) === Math.floor(b.quaternion.z / pid4) &&
          Math.floor(a.quaternion.w / pid4) === Math.floor(b.quaternion.w / pid4);
      } else {
        return true;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
};
function mod(a, b) {
  return ((a % b) + b) % b;
}

const animals = [];
const itemMeshes = [];

const makeAnimal = null;
let meshDrawer = null;

(async () => {
  const q = parseQuery(location.search);
  if (q.w) {
    const url = q.w + '.' + presenceHost;
    await planet.connect({
      online: true,
      roomName: 'lol',
      url,
    });
  } else {
    await planet.connect({
      online: false,
      roomName: 'lol',
    });
  }
  new Bot();
})();

const parcelSize = 10;
const parcelGeometry = (() => {
  const tileGeometry = new THREE.PlaneBufferGeometry(1, 1)
    .applyMatrix4(localMatrix.makeScale(0.95, 0.95, 1))
    .applyMatrix4(localMatrix.makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)))
    .toNonIndexed();
  const numCoords = tileGeometry.attributes.position.array.length;
  const numVerts = numCoords / 3;
  const positions = new Float32Array(numCoords * parcelSize * parcelSize);
  const centers = new Float32Array(numCoords * parcelSize * parcelSize);
  const typesx = new Float32Array(numVerts * parcelSize * parcelSize);
  const typesz = new Float32Array(numVerts * parcelSize * parcelSize);
  let i = 0;
  for (let x = -parcelSize / 2 + 0.5; x < parcelSize / 2; x++) {
    for (let z = -parcelSize / 2 + 0.5; z < parcelSize / 2; z++) {
      const newTileGeometry = tileGeometry.clone()
        .applyMatrix4(localMatrix.makeTranslation(x, 0, z));
      positions.set(newTileGeometry.attributes.position.array, i * newTileGeometry.attributes.position.array.length);
      for (let j = 0; j < newTileGeometry.attributes.position.array.length / 3; j++) {
        localVector.set(x, 0, z).toArray(centers, i * newTileGeometry.attributes.position.array.length + j * 3);
      }
      let typex = 0;
      if (mod((x + parcelSize / 2 - 0.5), parcelSize) === 0) {
        typex = 1 / 8;
      } else if (mod((x + parcelSize / 2 - 0.5), parcelSize) === parcelSize - 1) {
        typex = 2 / 8;
      }
      let typez = 0;
      if (mod((z + parcelSize / 2 - 0.5), parcelSize) === 0) {
        typez = 1 / 8;
      } else if (mod((z + parcelSize / 2 - 0.5), parcelSize) === parcelSize - 1) {
        typez = 2 / 8;
      }
      for (let j = 0; j < numVerts; j++) {
        typesx[i * numVerts + j] = typex;
        typesz[i * numVerts + j] = typez;
      }
      i++;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  /* geometry.setAttribute('center', new THREE.BufferAttribute(centers, 3));
  geometry.setAttribute('typex', new THREE.BufferAttribute(typesx, 1));
  geometry.setAttribute('typez', new THREE.BufferAttribute(typesz, 1)); */
  return geometry;
})();
const _makeFloorMesh = () => {
  const geometry = parcelGeometry;
  const material = new THREE.MeshBasicMaterial({
    color: 0x333333,
    // opacity: 0.9,
    side: THREE.DoubleSide,
    // transparent: true,
    /* polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1, */
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -0.01;
  mesh.frustumCulled = false;
  return mesh;
};
const floorMesh = _makeFloorMesh();
floorMesh.position.y = -7;
scene.add(floorMesh);

let numThings = 0;
const meshCubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1).toNonIndexed();
const MeshDrawer = (() => {
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  const localMatrix = new THREE.Matrix4();

  const checkerboardCanvas = (() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#CCC';
    for (let x = 0; x < canvas.width; x += 64) {
      for (let y = 0; y < canvas.height; y += 64) {
        if ((x / 64) % 2 === ((y / 64) % 2)) {
          ctx.fillRect(x, y, 64, 64);
        }
      }
    }
    return canvas;
  })();
  const _makeDrawThingCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = checkerboardCanvas.width;
    canvas.height = checkerboardCanvas.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(checkerboardCanvas, 0, 0);
    canvas.ctx = ctx;
    return canvas;
  };
  return class MeshDrawer {
    constructor() {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 128 * 1024), 3));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(3 * 128 * 1024), 1));
      const uvs = new Float32Array(2 * 128 * 1024);
      for (let i = 0; i < uvs.length; i += 2*4) {
        const index = i/(2*4);
        uvs[i+1] = index;
        uvs[i+3] = index;
        uvs[i+5] = index;
        uvs[i+7] = index;
      }
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geometry.boundingBox = new THREE.Box3(
        new THREE.Vector3(Infinity, Infinity, Infinity),
        new THREE.Vector3(-Infinity, -Infinity, -Infinity),
      );

      const material = makeDrawMaterial(localColor.setStyle('#' + colors[0]).getHex(), localColor.setStyle('#' + colors[1]).getHex(), 0);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      mesh.frustumCulled = false;
      this.mesh = mesh;

      this.lastPosition = new THREE.Vector3();
      this.lastQuaternion = new THREE.Quaternion();
      this.lastValue = 0;
      this.numPositions = 0;
      this.numIndices = 0;
    }

    start(p, q, v) {
      this.lastPosition.copy(p);
      this.lastQuaternion.copy(q);
      this.numPositions = 0;
      this.numIndices = 0;
      this.mesh.geometry.setDrawRange(0, 0);
      this.mesh.geometry.boundingBox.min.set(Infinity, Infinity, Infinity);
      this.mesh.geometry.boundingBox.max.set(-Infinity, -Infinity, -Infinity);
      this.mesh.visible = false;
    }

    end(p, q, v) {
      const geometry = new THREE.BufferGeometry();
      const positions = this.mesh.geometry.attributes.position.array.slice(0, this.numPositions);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const uvs = this.mesh.geometry.attributes.uv.array.slice(0, this.numPositions/3*2);
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      /* const colors = new Float32Array(geometry.attributes.position.array.length);
      for (let i = 0; i < geometry.attributes.uv.array.length; i += 2) {
        const y = geometry.attributes.uv.array[i+1]/this.mesh.material.uniforms.numPoints.value;
        localColor.copy(this.mesh.material.uniforms.color1.value).lerp(this.mesh.material.uniforms.color2.value, y)
          .toArray(colors, i/2*3);
        geometry.attributes.uv.array[i] = -1;
        geometry.attributes.uv.array[i+1] = -1;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); */
      const indices = this.mesh.geometry.index.array.slice(0, this.numIndices);
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      geometry.boundingBox = this.mesh.geometry.boundingBox.clone();
      const center = geometry.boundingBox.getCenter(new THREE.Vector3());
      geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
      // const material = _makeDrawMaterial(this.mesh.material.uniforms.color1.value.getHex(), this.mesh.material.uniforms.color2.value.getHex(), this.mesh.material.uniforms.numPoints.value);
      const mesh = new THREE.Mesh(geometry, this.mesh.material.clone());
      mesh.matrix.copy(this.mesh.matrixWorld)
        .decompose(mesh.position, mesh.quaternion, mesh.scale);
      mesh.position.add(center);
      mesh.frustumCulled = false;
      meshComposer.addMesh(mesh);

      this.mesh.visible = false;
    }

    update(p, q, v) {
      const startPoint = this.lastPosition;
      const endPoint = p;
      const startQuaternion = this.lastQuaternion;
      const endQuaternion = q;
      const startValue = this.lastValue;
      const endValue = v;

      const oldNumPositions = this.numPositions;
      if (this.numPositions === 0) {
        localVector.set(-startValue, 0, 0)
          .applyQuaternion(startQuaternion)
          .add(startPoint)
          .toArray(this.mesh.geometry.attributes.position.array, this.numPositions);
        this.mesh.geometry.boundingBox.expandByPoint(localVector);
        this.numPositions += 3;
        localVector.set(startValue, 0, 0)
          .applyQuaternion(startQuaternion)
          .add(startPoint)
          .toArray(this.mesh.geometry.attributes.position.array, this.numPositions);
        this.mesh.geometry.boundingBox.expandByPoint(localVector);
        this.numPositions += 3;
      }
      localVector.set(-endValue, 0, 0)
        .applyQuaternion(endQuaternion)
        .add(endPoint)
        .toArray(this.mesh.geometry.attributes.position.array, this.numPositions);
      this.mesh.geometry.boundingBox.expandByPoint(localVector);
      this.numPositions += 3;
      localVector.set(endValue, 0, 0)
        .applyQuaternion(endQuaternion)
        .add(endPoint)
        .toArray(this.mesh.geometry.attributes.position.array, this.numPositions);
      this.mesh.geometry.boundingBox.expandByPoint(localVector);
      this.numPositions += 3;

      const oldNumIndices = this.numIndices;
      const a = (this.numPositions - 3*4)/3;
      const b = a+1;
      const c = b+1;
      const d = c+1;
      this.mesh.geometry.index.array[this.numIndices++] = a;
      this.mesh.geometry.index.array[this.numIndices++] = b;
      this.mesh.geometry.index.array[this.numIndices++] = c;
      this.mesh.geometry.index.array[this.numIndices++] = b;
      this.mesh.geometry.index.array[this.numIndices++] = d;
      this.mesh.geometry.index.array[this.numIndices++] = c;

      /* this.mesh.geometry.index.array[this.numIndices++] = a;
      this.mesh.geometry.index.array[this.numIndices++] = c;
      this.mesh.geometry.index.array[this.numIndices++] = b;
      this.mesh.geometry.index.array[this.numIndices++] = b;
      this.mesh.geometry.index.array[this.numIndices++] = c;
      this.mesh.geometry.index.array[this.numIndices++] = d; */

      this.mesh.geometry.attributes.position.updateRange.offset = oldNumPositions;
      this.mesh.geometry.attributes.position.updateRange.count = this.numPositions;
      this.mesh.geometry.attributes.position.needsUpdate = true;

      this.mesh.geometry.index.updateRange.offset = oldNumIndices;
      this.mesh.geometry.index.updateRange.count = this.numIndices;
      this.mesh.geometry.index.needsUpdate = true;

      renderer.geometries.update(this.mesh.geometry);
      this.mesh.geometry.setDrawRange(0, this.numIndices);
      this.mesh.material.uniforms.numPoints.value = this.numIndices/6;
      this.mesh.material.uniforms.numPoints.needsUpdate = true;
      this.mesh.visible = true;

      this.lastPosition.copy(p);
      this.lastQuaternion.copy(q);
      this.lastValue = v;
    }

    setColors(selectedColors) {
      this.mesh.material.uniforms.color1.value.setStyle('#' + colors[selectedColors[0]]);
      this.mesh.material.uniforms.color1.needsUpdate = true;
      this.mesh.material.uniforms.color2.value.setStyle('#' + colors[selectedColors[1]]);
      this.mesh.material.uniforms.color2.needsUpdate = true;
    }
  };
})();
const _makeTargetMesh = (() => {
  const targetMeshGeometry = (() => {
    const targetGeometry = BufferGeometryUtils.mergeBufferGeometries([
      new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.1, 0)),
      new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.1)),
      new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.1, 0, 0)),
    ]);
    return BufferGeometryUtils.mergeBufferGeometries([
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, 0.5, -0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, 0.5, 0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, 0.5, -0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, -0.5, 0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, -0.5, -0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 1, 0).normalize(), new THREE.Vector3(1, -1, 0).normalize())))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, -0.5, 0.5)),
    ])// .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
  })();
  const targetVsh = `
    #define M_PI 3.1415926535897932384626433832795
    uniform float uTime;
    // varying vec2 vUv;
    void main() {
      float f = 1.0 + pow(sin(uTime * M_PI), 0.5) * 0.2;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position * f, 1.);
    }
  `;
  const targetFsh = `
    uniform float uHighlight;
    uniform float uTime;
    void main() {
      float f = max(1.0 - pow(uTime, 0.5), 0.1);
      gl_FragColor = vec4(vec3(f * uHighlight), 1.0);
    }
  `;
  return p => {
    const geometry = targetMeshGeometry;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uHighlight: {
          type: 'f',
          value: 0,
        },
        uTime: {
          type: 'f',
          value: 0,
        },
      },
      vertexShader: targetVsh,
      fragmentShader: targetFsh,
      // transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  };
})();
const _getRigTransforms = () => ([
  {
    position: rigManager.localRig.inputs.leftGamepad.position,
    quaternion: rigManager.localRig.inputs.leftGamepad.quaternion,
  },
  {
    position: rigManager.localRig.inputs.rightGamepad.position,
    quaternion: rigManager.localRig.inputs.rightGamepad.quaternion,
  },
]);
const _otherSideIndex = i => i === 1 ? 0 : 1;
class MeshComposer {
  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(THING_SHADER.uniforms),
      vertexShader: THING_SHADER.vertexShader,
      fragmentShader: THING_SHADER.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this.meshes = [];
    this.placeMeshes = [null, null];
    this.hoveredMeshes = [null, null];
    this.targetMeshes = [_makeTargetMesh(), _makeTargetMesh()];
    for (const targetMesh of this.targetMeshes) {
      targetMesh.visible = false;
      scene.add(targetMesh);
    }

    this.placeMeshStates = [null, null];
    this.scaleState = null;
  }
  getPlaceMesh(index) {
    return this.placeMeshes[index];
  }
  setPlaceMesh(index, mesh) {
    scene.add(mesh);
    this.meshes.push(mesh);
    this.placeMeshes[index] = mesh;
    
    const transforms = _getRigTransforms();
    this.placeMeshStates[index] = {
      startPosition: transforms[index].position.clone(),
      startQuaternion: transforms[index].quaternion.clone(),
      containerStartMatrix: new THREE.Matrix4().compose(transforms[index].position, transforms[index].quaternion, new THREE.Vector3(1, 1, 1)),
    };
  }
  addMesh(mesh) {
    this.meshes.push(mesh);
    scene.add(mesh);
  }
  isLatched(mesh) {
    return this.placeMeshes.includes(mesh); 
  }
  isPinching() {
    return this.placeMeshes[0] !== null && this.placeMeshes[0] === this.placeMeshes[1];
  }
  trigger(index) {
    this.placeMeshes[index] = null;
    this.placeMeshStates[index] = null;
  }
  grab(index) {
    const mesh = this.hoveredMeshes[index];
    if (mesh) {
      const transforms = _getRigTransforms();

      this.placeMeshes[index] = mesh;
      this.placeMeshStates[index] = {
        startPosition: transforms[index].position.clone(),
        startQuaternion: transforms[index].quaternion.clone(),
        containerStartMatrix: mesh.matrix.clone(),
      };

      if (this.isPinching()) {
        this.scaleState = {
          container: mesh,
          startPosition: transforms[0].position.clone()
            .add(transforms[1].position)
            .divideScalar(2),
          startDirection: transforms[0].position.clone()
            .sub(transforms[1].position)
            .normalize(),
          startWorldWidth: transforms[0].position
            .distanceTo(transforms[1].position),
          containerStartPosition: mesh.position.clone(),
          containerStartQuaternion: mesh.quaternion.clone(),
          containerStartScale: mesh.scale.clone(),
          containerStartMatrix: mesh.matrix.clone(),
        };
      }
    }
  }
  ungrab(index) {
    if (this.isPinching()) {
      const transforms = _getRigTransforms();
      const otherSideIndex = _otherSideIndex(index);
      this.placeMeshStates[otherSideIndex] = {
        startPosition: transforms[otherSideIndex].position.clone(),
        startQuaternion: transforms[otherSideIndex].quaternion.clone(),
        containerStartMatrix: this.placeMeshes[otherSideIndex].matrix.clone(),
      };
    }
    this.placeMeshes[index] = null;
    this.placeMeshStates[index] = null;
    this.scaleState = null;
  }
  update() {
    const transforms = _getRigTransforms();
    this.hoveredMeshes = transforms.map((transform, index) => {
      const {position, quaternion} = transform;
      localMatrix.compose(position, quaternion, localVector2.set(1, 1, 1));

      let closestMesh = null;
      let closestMeshDistance = Infinity;
      for (const mesh of this.meshes) {
        localMatrix2.copy(localMatrix)
          .premultiply(localMatrix3.getInverse(mesh.matrixWorld))
          .decompose(localVector, localQuaternion, localVector2);

        if (mesh.geometry.boundingBox.containsPoint(localVector)) {
          const distance = localVector.distanceTo(position);
          if (distance < closestMeshDistance) {
            closestMesh = mesh;
            closestMeshDistance = distance;
          }
        }
      }
      return closestMesh;
    });
    if (this.isPinching()) { // pinch
      const {scaleState} = this;
      const {container} = scaleState;
      const startPosition = scaleState.startPosition.clone()
        // .applyMatrix4(new THREE.Matrix4().getInverse(scaleState.containerStartMatrix));
      const currentPosition = transforms[0].position.clone()
        .add(transforms[1].position)
        .divideScalar(2)
        // .applyMatrix4(new THREE.Matrix4().getInverse(scaleState.containerStartMatrix));
      const currentDirection = transforms[0].position.clone()
        .sub(transforms[1].position)
        .normalize();
      const currentWorldWidth = transforms[0].position
        .distanceTo(transforms[1].position);
      const currentEuler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(scaleState.startDirection, currentDirection), 'YXZ');
      currentEuler.x = 0;
      currentEuler.z = 0;
      const currentQuaternion = new THREE.Quaternion().setFromEuler(currentEuler);
      const scaleFactor = currentWorldWidth/scaleState.startWorldWidth;
      const positionDiff = currentPosition.clone().sub(startPosition);

      container.matrix
        .copy(scaleState.containerStartMatrix)
        .premultiply(localMatrix.makeTranslation(-scaleState.containerStartPosition.x, -scaleState.containerStartPosition.y, -scaleState.containerStartPosition.z))
        .premultiply(localMatrix.makeScale(scaleFactor, scaleFactor, scaleFactor))
        .premultiply(localMatrix.makeRotationFromQuaternion(currentQuaternion))
        .premultiply(localMatrix.makeTranslation(scaleState.containerStartPosition.x, scaleState.containerStartPosition.y, scaleState.containerStartPosition.z))
        .premultiply(localMatrix.makeTranslation(positionDiff.x, positionDiff.y, positionDiff.z))
        .decompose(container.position, container.quaternion, container.scale);
    } else { // move
      for (let i = 0; i < transforms.length; i++) {
        if (this.placeMeshes[i]) {
          const transform = transforms[i];
          const {position, quaternion} = transform;
          const {startPosition, startQuaternion, containerStartMatrix} = this.placeMeshStates[i];

          this.placeMeshes[i].matrix.copy(containerStartMatrix)
            .premultiply(localMatrix.makeTranslation(-startPosition.x, -startPosition.y, -startPosition.z))
            .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion.copy(startQuaternion).inverse()))
            .premultiply(localMatrix.makeRotationFromQuaternion(quaternion))
            .premultiply(localMatrix.makeTranslation(position.x, position.y, position.z))
            .decompose(this.placeMeshes[i].position, this.placeMeshes[i].quaternion, this.placeMeshes[i].scale);
        }
      }
    }
    for (let i = 0; i < transforms.length; i++) {
      this.targetMeshes[i].visible = false;

      if (this.hoveredMeshes[i]) {
        this.targetMeshes[i].position.copy(this.hoveredMeshes[i].position)
          .add(
            this.hoveredMeshes[i].geometry.boundingBox.getCenter(new THREE.Vector3())
              .multiply(this.hoveredMeshes[i].scale)
              .applyQuaternion(this.hoveredMeshes[i].quaternion)
          );
        this.targetMeshes[i].quaternion.copy(this.hoveredMeshes[i].quaternion);
        this.hoveredMeshes[i].geometry.boundingBox.getSize(this.targetMeshes[i].scale)
          .multiply(this.hoveredMeshes[i].scale);
        this.targetMeshes[i].visible = true;
      }
    }
  }
  intersect(raycaster) {
    let closestMesh = null;
    let closestMeshDistance = Infinity;
    for (const mesh of this.meshes) {
      localMatrix.compose(
        raycaster.ray.origin,
        localQuaternion.setFromUnitVectors(
          localVector2.set(0, 0, -1),
          raycaster.ray.direction
        ),
        localVector2.set(1, 1, 1)
      )
        .premultiply(localMatrix2.getInverse(mesh.matrixWorld))
        .decompose(localVector, localQuaternion, localVector2);
      localRaycaster.ray.origin.copy(localVector);
      localRaycaster.ray.direction.set(0, 0, -1).applyQuaternion(localQuaternion);
      if (mesh.geometry.boundingBox) {
        const point = localRaycaster.ray.intersectBox(mesh.geometry.boundingBox, localVector);
        if (point) {
          point.applyMatrix4(mesh.matrixWorld);
          return {
            object: mesh,
            point: point.clone(),
            anchor: null,
            uv: new THREE.Vector2(),
          };
        }
      }
    }
    return null;
  }
  async run() {
    if (this.meshes.length === 1) {
      const [mesh] = this.meshes;
      if (mesh.userData.gltfExtensions.EXT_hash) {
        const u = `${storageHost}/${mesh.userData.gltfExtensions.EXT_hash}`;
        await rigManager.setLocalAvatarUrl(u);
      }
    }
  }
  commit() {
    const {meshes} = this;
    if (meshes.length > 0) {
      const center = new THREE.Vector3();
      for (const mesh of this.meshes) {
        center.add(mesh.position);
      }
      center.divideScalar(meshes.length);
      for (const mesh of this.meshes) {
        mesh.position.sub(center);
        mesh.updateMatrixWorld();
      }

      const geometries = [];
      const textures = [];
      for (const mesh of this.meshes) {
        geometries.push(mesh.geometry);
        if (mesh.material.uniforms.map && mesh.material.uniforms.map.value) {
          textures.push(mesh.material.uniforms.map.value);
        } else {
          textures.push(null);
        }
      }

      const mesh = mergeMeshes(meshes, geometries, textures);
      const material = meshComposer.material.clone();
      material.uniforms.map.value = mesh.material.map;
      material.uniforms.map.needsUpdate = true;
      mesh.material = material;

      for (const mesh of this.meshes) {
        mesh.geometry.dispose();
        scene.remove(mesh);
      }
      this.meshes.length = 0;

      return mesh;
    } else {
      return null;
    }
  }
  cancel() {
    for (const mesh of this.meshes) {
      scene.remove(mesh);
    }
    this.meshes.length = 0;
  }
}
const meshComposer = new MeshComposer();
(() => {
  const effectController = {
    turbidity: 2,
    rayleigh: 3,
    mieCoefficient: 0.2,
    mieDirectionalG: 0.9999,
    inclination: 0, // elevation / inclination
    azimuth: 0, // Facing front,
    // exposure: renderer.toneMappingExposure
  };
  const sun = new THREE.Vector3();
  function update() {
    var uniforms = skybox.material.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.rayleigh.value = effectController.rayleigh;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

    // effectController.azimuth = (0.05 + ((Date.now() / 1000) * 0.1)) % 1;
    effectController.azimuth = 0.25;
    var theta = Math.PI * (effectController.inclination - 0.5);
    var phi = 2 * Math.PI * (effectController.azimuth - 0.5);

    sun.x = Math.cos(phi);
    sun.y = Math.sin(phi) * Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);

    uniforms.sunPosition.value.copy(sun);
  }
  skybox = new Sky();
  skybox.scale.setScalar(1000);
  skybox.update = update;
  skybox.update();
  scene.add(skybox);
})();
(() => {
  const guardianMesh = GuardianMesh([[
    0, 0, SUBPARCEL_SIZE, SUBPARCEL_SIZE,
  ]], 0x42a5f5);
  scene.add(guardianMesh);
})();
/* (async () => {
  const HEIGHTFIELD_SHADER2 = {
    uniforms: {
      map: {
        type: 't',
        value: new THREE.Texture(),
        needsUpdate: true,
      },
      normalMap: {
        type: 't',
        value: new THREE.Texture(),
        needsUpdate: true,
      },
      bumpMap: {
        type: 't',
        value: new THREE.Texture(),
        needsUpdate: true,
      },
      "parallaxScale": { value: 0.5 },
      "parallaxMinLayers": { value: 20 },
      "parallaxMaxLayers": { value: 25 },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      uniform sampler2D normalMap;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      // varying vec3 vNormal;
      varying vec3 eyeVec;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        vViewPosition = -mvPosition.xyz;
        //vNormal = normalize( normalMatrix * normal );
        // vNormal = normalize( normalMatrix * texture2D( normalMap, vUv ).rgb );
        gl_Position = projectionMatrix * mvPosition;
        eyeVec = vViewPosition.xyz;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      uniform sampler2D bumpMap;
      uniform sampler2D map;
      uniform float parallaxScale;
      uniform float parallaxMinLayers;
      uniform float parallaxMaxLayers;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      // varying vec3 vNormal;
      varying vec3 eyeVec;

        vec2 parallaxMap( in vec3 V ) {
          float numLayers = mix( parallaxMaxLayers, parallaxMinLayers, abs( dot( vec3( 0.0, 0.0, 1.0 ), V ) ) );
          float layerHeight = 1.0 / numLayers;
          float currentLayerHeight = 0.0;
          vec2 dtex = parallaxScale * V.xy / V.z / numLayers;
          vec2 currentTextureCoords = vUv;
          float heightFromTexture = texture2D( bumpMap, currentTextureCoords ).r;
          for ( int i = 0; i < 30; i += 1 ) {
            if ( heightFromTexture <= currentLayerHeight ) {
              break;
            }
            currentLayerHeight += layerHeight;
            currentTextureCoords -= dtex;
            heightFromTexture = texture2D( bumpMap, currentTextureCoords ).r;
          }
            vec2 prevTCoords = currentTextureCoords + dtex;
            float nextH = heightFromTexture - currentLayerHeight;
            float prevH = texture2D( bumpMap, prevTCoords ).r - currentLayerHeight + layerHeight;
            float weight = nextH / ( nextH - prevH );
            return prevTCoords * weight + currentTextureCoords * ( 1.0 - weight );
        }
      vec2 perturbUv( vec3 surfPosition, vec3 surfNormal, vec3 viewPosition ) {
        vec2 texDx = dFdx( vUv );
        vec2 texDy = dFdy( vUv );
        vec3 vSigmaX = dFdx( surfPosition );
        vec3 vSigmaY = dFdy( surfPosition );
        vec3 vR1 = cross( vSigmaY, surfNormal );
        vec3 vR2 = cross( surfNormal, vSigmaX );
        float fDet = dot( vSigmaX, vR1 );
        vec2 vProjVscr = ( 1.0 / fDet ) * vec2( dot( vR1, viewPosition ), dot( vR2, viewPosition ) );
        vec3 vProjVtex;
        vProjVtex.xy = texDx * vProjVscr.x + texDy * vProjVscr.y;
        vProjVtex.z = dot( surfNormal, viewPosition );
        return parallaxMap( vProjVtex );
      }
      void main() {
        vec3 vNormal = normalize(cross(dFdx(eyeVec.xyz), dFdy(eyeVec.xyz)));
        vec2 mapUv = perturbUv( -vViewPosition, normalize( vNormal ), normalize( vViewPosition ) );
        gl_FragColor = texture2D( map, mapUv );
      }
    `,
  };
  const geometry = new THREE.SphereBufferGeometry(1, 32, 32);
  const heightfieldMaterial2 = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(HEIGHTFIELD_SHADER2.uniforms),
    vertexShader: HEIGHTFIELD_SHADER2.vertexShader,
    fragmentShader: HEIGHTFIELD_SHADER2.fragmentShader,
    extensions: {
      derivatives: true,
    },
  });
  heightfieldMaterial2.uniforms.map.value.image = await new Promise((accept, reject) => {
    const img = new Image();
    img.onload = () => {
      accept(img);
    };
    img.onerror = reject;
    img.src = `./land-textures/Vol_21_4_Base_Color.png`;
  });
  heightfieldMaterial2.uniforms.map.value.wrapS = THREE.RepeatWrapping;
  heightfieldMaterial2.uniforms.map.value.wrapT = THREE.RepeatWrapping;
  heightfieldMaterial2.uniforms.map.value.needsUpdate = true;
  heightfieldMaterial2.uniforms.bumpMap.value.image = await new Promise((accept, reject) => {
    const img = new Image();
    img.onload = () => {
      accept(img);
    };
    img.onerror = reject;
    img.src = `./land-textures/Vol_21_4_Height.png`;
  });
  heightfieldMaterial2.uniforms.bumpMap.value.wrapS = THREE.RepeatWrapping;
  heightfieldMaterial2.uniforms.bumpMap.value.wrapT = THREE.RepeatWrapping;
  heightfieldMaterial2.uniforms.bumpMap.value.needsUpdate = true;

  const mesh = new THREE.Mesh(geometry, heightfieldMaterial2);
  mesh.position.x = -5;
  scene.add(mesh);
})(); */

const _makeRigCapsule = () => {
  const geometry = new THREE.BufferGeometry().fromGeometry(new CapsuleGeometry());
  const material = new THREE.ShaderMaterial({
    vertexShader: `\
      // uniform float iTime;
      // varying vec2 uvs;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        // uvs = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        vNormal = normal;
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
      }
    `,
    fragmentShader: `\
      #define PI 3.1415926535897932384626433832795

      // uniform float iTime;
      // varying vec2 uvs;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      const vec3 c = vec3(${new THREE.Color(0x1565c0).toArray().join(', ')});

      void main() {
        // vec2 uv = uvs;
        // uv.x *= 1.7320508075688772;
        // uv *= 8.0;

        vec3 direction = vWorldPosition - cameraPosition;
        float d = dot(vNormal, normalize(direction));
        float glow = d < 0.0 ? max(1. + d * 2., 0.) : 0.;

        float a = glow;
        gl_FragColor = vec4(c, a);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
};

// test npc crypto trade trade mesh
(async () => {
  const _loadGltf = u => new Promise((accept, reject) => {
    new GLTFLoader().load(u, o => {
      o = o.scene;
      accept(o);
    }, xhr => {}, reject);
  });
  const gltf = await _loadGltf('./npc.vrm');
  gltf.position.set(0, -6, 0);
  scene.add(gltf);
  const rigCapsule = _makeRigCapsule();
  gltf.add(rigCapsule);
})();

/* const generateModels = await _loadGltf('./generate.glb');
for (let i = 0; i < 30; i++) {
  for (;;) {
    localVector.copy(chunkMesh.position)
      .add(localVector2.set(-10 + rng() * (PARCEL_SIZE+20), -10 + rng() * (PARCEL_SIZE+20), -10 + rng() * (PARCEL_SIZE+20)));
    localQuaternion.set(rng(), rng(), rng(), rng()).normalize();
    pointRaycaster.raycastMeshes(chunkMesh, localVector, localQuaternion);
    const raycastChunkSpec = pointRaycaster.readRaycast(chunkMesh, localVector, localQuaternion);
    if (raycastChunkSpec) {
      const generateModel = generateModels.children[Math.floor(rng() * generateModels.children.length)];
      const generateModelClone = generateModel.clone();
      generateModelClone.position.copy(raycastChunkSpec.point);
      generateModelClone.quaternion.setFromUnitVectors(localVector.set(0, 0, -1), raycastChunkSpec.normal);
      generateModelClone.matrix
        .compose(generateModelClone.position, generateModelClone.quaternion, generateModelClone.scale)
        .premultiply(localMatrix.getInverse(chunkMesh.matrixWorld))
        .decompose(generateModelClone.position, generateModelClone.quaternion, generateModelClone.scale);
      generateModelClone.isBuildMesh = true;
      chunkMesh.add(generateModelClone);
      break;
    }
  }
} */

let buildMode = 'wall';
let buildMat = 'wood';
let plansMesh = null;
let pencilMesh = null;
let pickaxeMesh = null;
let paintBrushMesh = null;
let assaultRifleMesh = null;
let smgMesh = null;
let grenadeMesh = null;
let crosshairMesh = null;

const redBuildMeshMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 1.05, 1.);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(${new THREE.Color(0xff7043).toArray().join(', ')}, 0.5);
    }
  `,
  // side: THREE.DoubleSide,
  transparent: true,
});

/* const jointGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01);
const jointPositions = jointGeometry.attributes.position.array.slice();
const jointNumPositions = jointPositions.length;
const jointMaterial = new THREE.MeshBasicMaterial({
  color: 0xFF0000,
});
const handGeometry = (() => {
  const geometries = Array(25);
  for (let i = 0; i < geometries.length; i++) {
    geometries[i] = jointGeometry;
  }
  return BufferGeometryUtils.mergeBufferGeometries(geometries);
})();
const handMeshes = (() => {
  const result = Array(2);
  for (let i = 0; i < result.length; i++) {
    const mesh = new THREE.Mesh(handGeometry.clone(), jointMaterial);
    mesh.visible = false;
    mesh.frustumCulled = false;
    result[i] = mesh;
  }
  return result;
})();
for (const handMesh of handMeshes) {
  scene.add(handMesh);
} */

const tetrehedronGeometry = (() => {
  const geometry = new THREE.TetrahedronBufferGeometry(0.2, 0);
  const barycentrics = new Float32Array(geometry.attributes.position.array.length);
  let barycentricIndex = 0;
  for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
    barycentrics[barycentricIndex++] = 1;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 1;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 1;
  }
  geometry.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3));
  return geometry;
})();

/* const rayMesh = makeRayMesh();
scene.add(rayMesh);

const highlightScene = new THREE.Scene();
const highlightMesh = makeHighlightMesh();
highlightScene.add(highlightMesh);

const wristMenu = makeWristMenu({scene, ray: rayMesh, highlightMesh, addPackage: _addPackage});
wristMenu.position.y = 1;
scene.add(wristMenu); */

/* window.downloadTargetMesh = async () => {
  const {GLTFExporter} = await import('./GLTFExporter.js');
  const targetMesh = _makeTargetMesh();
  targetMesh.material = new THREE.MeshBasicMaterial({
    color: 0x000000,
  });
  const data = await new Promise((accept, reject) => {
    const exporter = new GLTFExporter();
    const exportScene = new THREE.Scene();
    exportScene.add(targetMesh);
    exporter.parse(exportScene, gltf => {
      accept(gltf);
    }, {
      binary: true,
      includeCustomExtensions: true,
    });
  });
  console.log('got data', data);
  const b = new Blob([data], {
    type: 'application/octet-stream',
  });
  downloadFile(b, 'target.glb');
}; */

/* const _getCurrentParcel = p => new THREE.Vector3(
  Math.floor((p.x+5)/10),
  0,
  Math.floor((p.z+5)/10),
);
let planetAnimation = null;
const _animatePlanet = (startMatrix, pivot, startQuaternion, endQuaternion) => {
  const startTime = Date.now();
  const endTime = startTime + 300;
  planetAnimation = {
    startTime,
    endTime,
    startMatrix,
    pivot,
    startQuaternion,
    endQuaternion,
  };
  planetAuxContainer.matrix
    .copy(startMatrix)
    .premultiply(localMatrix2.makeTranslation(-pivot.x, -pivot.y, -pivot.z))
    .premultiply(localMatrix2.makeRotationFromQuaternion(localQuaternion.copy(startQuaternion).slerp(endQuaternion, 1)))
    .premultiply(localMatrix2.makeTranslation(pivot.x, pivot.y, pivot.z))
    .decompose(planetAuxContainer.position, planetAuxContainer.quaternion, planetAuxContainer.scale)
  planetAuxContainer.updateMatrixWorld();
};
const _tickPlanetAnimation = factor => {
  const {startTime, endTime, startMatrix, pivot, startQuaternion, endQuaternion} = planetAnimation;
  planetContainer.matrix
    .copy(startMatrix)
    .premultiply(localMatrix2.makeTranslation(-pivot.x, -pivot.y, -pivot.z))
    .premultiply(localMatrix2.makeRotationFromQuaternion(localQuaternion.copy(startQuaternion).slerp(endQuaternion, factor)))
    .premultiply(localMatrix2.makeTranslation(pivot.x, pivot.y, pivot.z))
    .decompose(planetContainer.position, planetContainer.quaternion, planetContainer.scale);
  if (factor >= 1) {
    planetAnimation = null;
  }
}; */

const hpMesh = (() => {
  const mesh = new THREE.Object3D();

  let hp = 37;
  let animation = null;
  mesh.damage = dmg => {
    hp -= dmg;
    hp = Math.max(hp, 0);
    textMesh.text = _getText();
    textMesh.sync();
    barMesh.scale.x = _getBar();

    const startTime = Date.now();
    const endTime = startTime + 500;
    animation = {
      update() {
        const now = Date.now();
        const factor = (now - startTime) / (endTime - startTime);
        if (factor < 1) {
          frameMesh.position.set(0, 0, 0)
            .add(localVector2.set(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2).multiplyScalar((1 - factor) * 0.02));
        } else {
          animation.end();
          animation = null;
        }
      },
      end() {
        frameMesh.position.set(0, 0, 0);
        material.color.setHex(0x000000);
      },
    };
    material.color.setHex(0xb71c1c);
  };
  mesh.update = () => {
    animation && animation.update();
  };

  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    new THREE.PlaneBufferGeometry(1, 0.02).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.02, 0)),
    new THREE.PlaneBufferGeometry(1, 0.02).applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.02, 0)),
    new THREE.PlaneBufferGeometry(0.02, 0.04).applyMatrix4(new THREE.Matrix4().makeTranslation(-1 / 2, 0, 0)),
    new THREE.PlaneBufferGeometry(0.02, 0.04).applyMatrix4(new THREE.Matrix4().makeTranslation(1 / 2, 0, 0)),
  ]);
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
  });
  const frameMesh = new THREE.Mesh(geometry, material);
  frameMesh.frustumCulled = false;
  mesh.add(frameMesh);

  const geometry2 = new THREE.PlaneBufferGeometry(1, 0.02).applyMatrix4(new THREE.Matrix4().makeTranslation(1 / 2, 0, 0));
  const material2 = new THREE.MeshBasicMaterial({
    color: 0x81c784,
  });
  const barMesh = new THREE.Mesh(geometry2, material2);
  barMesh.position.x = -1 / 2;
  barMesh.position.z = -0.001;
  const _getBar = () => hp / 100;
  barMesh.scale.x = _getBar();
  barMesh.frustumCulled = false;
  frameMesh.add(barMesh);

  const _getText = () => `HP ${hp}/100`;
  const textMesh = makeTextMesh(_getText(), './Bangers-Regular.ttf', 0.05, 'left', 'bottom');
  textMesh.position.x = -1 / 2;
  textMesh.position.y = 0.05;
  mesh.add(textMesh);

  return mesh;
})();
scene.add(hpMesh);

renderer.domElement.addEventListener('dblclick', e => {
  if (!document.pointerLockElement) {
    tools.find(tool => tool.getAttribute('tool') === 'firstperson').click();
  }
});

const numSmokes = 10;
const numZs = 10;
const explosionCubeGeometry = new THREE.BoxBufferGeometry(0.04, 0.04, 0.04);
const _makeExplosionMesh = () => {
  const numPositions = explosionCubeGeometry.attributes.position.array.length * numSmokes * numZs;
  const numIndices = explosionCubeGeometry.index.array.length * numSmokes * numZs;
  const arrayBuffer = new ArrayBuffer(
    numPositions * Float32Array.BYTES_PER_ELEMENT + // position
    numPositions / 3 * Float32Array.BYTES_PER_ELEMENT + // z
    numPositions / 3 * Float32Array.BYTES_PER_ELEMENT + // maxZ
    numPositions / 3 * 4 * Float32Array.BYTES_PER_ELEMENT + // q
    numPositions / 3 * 4 * Float32Array.BYTES_PER_ELEMENT + // phase
    numPositions / 3 * Float32Array.BYTES_PER_ELEMENT + // scale
    numIndices * Int16Array.BYTES_PER_ELEMENT, // index
  );
  let index = 0;
  const positions = new Float32Array(arrayBuffer, index, numPositions);
  index += numPositions * Float32Array.BYTES_PER_ELEMENT;
  const zs = new Float32Array(arrayBuffer, index, numPositions / 3);
  index += numPositions / 3 * Float32Array.BYTES_PER_ELEMENT;
  const maxZs = new Float32Array(arrayBuffer, index, numPositions / 3);
  index += numPositions / 3 * Float32Array.BYTES_PER_ELEMENT;
  const qs = new Float32Array(arrayBuffer, index, numPositions / 3 * 4);
  index += numPositions / 3 * 4 * Float32Array.BYTES_PER_ELEMENT;
  const phases = new Float32Array(arrayBuffer, index, numPositions / 3 * 4);
  index += numPositions / 3 * 4 * Float32Array.BYTES_PER_ELEMENT;
  const scales = new Float32Array(arrayBuffer, index, numPositions / 3);
  index += numPositions / 3 * Float32Array.BYTES_PER_ELEMENT;
  const indices = new Uint16Array(arrayBuffer, index, numIndices);
  index += numIndices * Uint16Array.BYTES_PER_ELEMENT;

  const numPositionsPerSmoke = numPositions / numSmokes;
  const numPositionsPerZ = numPositionsPerSmoke / numZs;
  const numIndicesPerSmoke = numIndices / numSmokes;
  const numIndicesPerZ = numIndicesPerSmoke / numZs;

  for (let i = 0; i < numSmokes; i++) {
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler((-1 + Math.random() * 2) * Math.PI * 2 * 0.05, (-1 + Math.random() * 2) * Math.PI * 2 * 0.05, (-1 + Math.random() * 2) * Math.PI * 2 * 0.05, 'YXZ'),
    );
    for (let j = 0; j < numPositionsPerSmoke / 3 * 4; j += 4) {
      q.toArray(qs, i * numPositionsPerSmoke / 3 * 4 + j);
    }
    const maxZ = Math.random();
    for (let j = 0; j < numZs; j++) {
      positions.set(explosionCubeGeometry.attributes.position.array, i * numPositionsPerSmoke + j * numPositionsPerZ);
      const indexOffset = i * numPositionsPerSmoke / 3 + j * numPositionsPerZ / 3;
      for (let k = 0; k < numIndicesPerZ; k++) {
        indices[i * numIndicesPerSmoke + j * numIndicesPerZ + k] = explosionCubeGeometry.index.array[k] + indexOffset;
      }

      const z = j / numZs;
      for (let k = 0; k < numPositionsPerZ / 3; k++) {
        zs[i * numPositionsPerSmoke / 3 + j * numPositionsPerZ / 3 + k] = z;
      }
      for (let k = 0; k < numPositionsPerZ / 3; k++) {
        maxZs[i * numPositionsPerSmoke / 3 + j * numPositionsPerZ / 3 + k] = maxZ;
      }
      const phase = new THREE.Vector4(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0.1 + Math.random() * 0.2, 0.1 + Math.random() * 0.2);
      for (let k = 0; k < numPositionsPerZ / 3 * 4; k += 4) {
        phase.toArray(phases, i * numPositionsPerSmoke / 3 * 4 + j * numPositionsPerZ / 3 * 4 + k);
      }
      const scale = 0.9 + Math.random() * 0.2;
      for (let k = 0; k < numPositionsPerZ / 3; k++) {
        scales[i * numPositionsPerSmoke / 3 * 4 + j * numPositionsPerZ / 3 * 4 + k] = scale;
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('z', new THREE.BufferAttribute(zs, 1));
  geometry.setAttribute('maxZ', new THREE.BufferAttribute(maxZs, 1));
  geometry.setAttribute('q', new THREE.BufferAttribute(qs, 4));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 4));
  geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uAnimation: {
        type: 'f',
        value: 0,
      },
    },
    vertexShader: `\
      #define PI 3.1415926535897932384626433832795

      uniform float uAnimation;
      attribute float z;
      attribute float maxZ;
      attribute vec4 q;
      attribute vec4 phase;
      attribute float scale;
      varying float vZ;

      vec3 applyQuaternion(vec3 v, vec4 q) {
        return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
      }
      float easeBezier(float p, vec4 curve) {
        float ip = 1.0 - p;
        return (3.0 * ip * ip * p * curve.xy + 3.0 * ip * p * p * curve.zw + p * p * p).y;
      }
      float ease(float p) {
        return easeBezier(p, vec4(0., 1., 0., 1.));
      }

      void main() {
        vZ = z;
        float forwardFactor = pow(uAnimation, 0.5);
        float upFactor = uAnimation * 0.1;
        vec2 sideFactor = vec2(sin(phase.x + uAnimation*PI*2.*phase.z), sin(phase.y + uAnimation*PI*2.*phase.w));
        vec3 p = applyQuaternion(position * scale * (1.0-uAnimation) + vec3(0., 0., -z*maxZ*forwardFactor), q) +
          vec3(0., 1., 0.) * upFactor +
          vec3(uAnimation * sideFactor.x, uAnimation * sideFactor.y, 0.)*0.1;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `\
      #define PI 3.1415926535897932384626433832795

      uniform float uAnimation;
      varying float vZ;

      vec3 c = vec3(${new THREE.Color(0xff7043).toArray().join(', ')});
      vec3 s = vec3(${new THREE.Color(0x263238).toArray().join(', ')});

      void main() {
        float factor = min(vZ + pow(uAnimation, 0.5), 1.0);
        gl_FragColor = vec4(mix(c, s, factor) * (2.0 - pow(uAnimation, 0.2)), 1.0);
      }
    `,
    // transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.trigger = (position, quaternion) => {
    material.uniform.uAnimation = 0;
  };
  return mesh;
};
let explosionMeshes = [];

let pxMeshes = [];

const _applyGravity = timeDiff => {
  localVector.set(0, -9.8, 0);
  localVector.multiplyScalar(timeDiff);
  velocity.add(localVector);

  const terminalVelocity = 50;
  const _clampToTerminalVelocity = v => Math.min(Math.max(v, -terminalVelocity), terminalVelocity);
  velocity.x = _clampToTerminalVelocity(velocity.x * 0.7);
  velocity.z = _clampToTerminalVelocity(velocity.z * 0.7);
  velocity.y = _clampToTerminalVelocity(velocity.y);
};
const _jump = () => {
  jumpState = true;
  velocity.y += 5;
};
const _applyAvatarPhysics = (camera, avatarOffset, cameraBasedOffset, velocityAvatarDirection, updateRig, timeDiff) => {
  const oldVelocity = localVector3.copy(velocity);

  _applyVelocity(camera.position, velocity, timeDiff);
  camera.updateMatrixWorld();
  camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  if (avatarOffset) {
    localVector4.copy(avatarOffset);
  } else {
    localVector4.set(0, 0, 0);
  }
  if (cameraBasedOffset) {
    localVector4.applyQuaternion(localQuaternion);
  }
  localVector.add(localVector4);
  const collision = _collideCapsule(localVector, localQuaternion2.set(0, 0, 0, 1));
  if (velocityAvatarDirection && oldVelocity.lengthSq() > 0) {
    localQuaternion.setFromUnitVectors(localVector4.set(0, 0, -1), localVector5.set(oldVelocity.x, 0, oldVelocity.z).normalize());
  }

  if (collision) {
    localVector4.fromArray(collision.direction);
    camera.position.add(localVector4);
    localVector.add(localVector4);
    if (collision.grounded) {
      velocity.y = 0;
      jumpState = false;
    } else {
      jumpState = true;
    }
  } else {
    jumpState = true;
  }
  localMatrix.compose(localVector, localQuaternion, localVector2);

  rigManager.setLocalRigMatrix(updateRig ? localMatrix : null);

  if (rigManager.localRig) {
    if (jumpState) {
      rigManager.localRig.setFloorHeight(-0xFFFFFF);
    } else {
      rigManager.localRig.setFloorHeight(localVector.y - _getAvatarHeight());
    }
  }

  _collideItems(localMatrix);
  _collideChunk(localMatrix);
  camera.updateMatrixWorld();
};
const _collideCapsule = (() => {
  const localVector = new THREE.Vector3();
  return (p, q) => {
    localVector.copy(p);
    localVector.y -= 0.3;
    return geometryWorker ? geometryWorker.collide(tracker, 0.5, 0.5, localVector, q, 1) : null;
  };
})();
const _applyVelocity = (() => {
  const localVector = new THREE.Vector3();
  return (position, velocity, timeDiff) => {
    position.add(localVector.copy(velocity).multiplyScalar(timeDiff));
  };
})();
const _collideItems = matrix => {
  matrix.decompose(localVector3, localQuaternion2, localVector4);

  hpMesh.position.lerp(localVector4.copy(localVector3).add(localVector5.set(0, 0.25, -1).applyQuaternion(localQuaternion2)), 0.1);
  hpMesh.quaternion.slerp(localQuaternion2, 0.1);

  localVector4.copy(localVector3).add(localVector5.set(0, -1, 0));
  for (let i = 0; i < itemMeshes.length; i++) {
    const itemMesh = itemMeshes[i];
    if (itemMesh.getWorldPosition(localVector5).distanceTo(localVector4) < 1) {
      itemMesh.pickUp();
    }
    itemMesh.update(localVector3);
  }

  for (const animal of animals) {
    if (!animal.isHeadAnimating()) {
      animal.lookAt(localVector3);
    }
  }
};
const _collideChunk = matrix => {
  matrix.decompose(localVector3, localQuaternion2, localVector4);
  geometryManager.currentChunkMesh.update(localVector3);
};

const velocity = new THREE.Vector3();
// const lastGrabs = [false, false];
const lastAxes = [[0, 0, 0, 0], [0, 0, 0, 0]];
const lastButtons = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];
let currentTeleport = false;
let lastTeleport = false;
let currentMenuDown = false;
let lastMenuDown = false;
const timeFactor = 60 * 1000;
let lastTimestamp = performance.now();
const startTime = Date.now();
function animate(timestamp, frame) {
  timestamp = timestamp || performance.now();
  const timeDiff = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  const now = Date.now();
  if (skybox) {
    for (const material of geometryManager.currentChunkMesh.material) {
      const {uniforms} = material;
      uniforms.uTime.value = (now % timeFactor) / timeFactor;
      uniforms.uTime.needsUpdate = true;
      uniforms.sunIntensity.value = Math.max(skybox.material.uniforms.sunPosition.value.y, 0);
      uniforms.sunIntensity.needsUpdate = true;
      uniforms.sunDirection.value.copy(skybox.material.uniforms.sunPosition.value).normalize();
      window.sunDirection = uniforms.sunDirection.value;
      uniforms.sunDirection.needsUpdate = true;
    }
  }
  if (skybox) {
    for (const material of geometryManager.currentVegetationMesh.material) {
      const {uniforms} = material;
      uniforms.sunIntensity.value = Math.max(skybox.material.uniforms.sunPosition.value.y, 0);
      uniforms.sunIntensity.needsUpdate = true;
    }
  }
  // if (geometryManager.currentVegetationMesh) {
    geometryManager.currentVegetationMesh.hitTracker.update();
  // }
  explosionMeshes = explosionMeshes.filter(explosionMesh => {
    explosionMesh.material.uniforms.uAnimation.value += timeDiff;
    if (explosionMesh.material.uniforms.uAnimation.value < 1) {
      return true;
    } else {
      scene.remove(explosionMesh);
      return false;
    }
  });

  for (const animal of animals) {
    animal.update();
  }
  hpMesh.update();
  skybox.position.copy(rigManager.localRig.inputs.hmd.position);
  skybox.update();
  crosshairMesh && crosshairMesh.update();
  
  const xrCamera = currentSession ? renderer.xr.getCamera(camera) : camera;
  if (currentSession) {
    let walked = false;
    const inputSources = Array.from(currentSession.inputSources);
    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];
      const {handedness, gamepad} = inputSource;
      if (gamepad && gamepad.buttons.length >= 2) {
        const index = handedness === 'right' ? 1 : 0;

        // buttons
        /* const grab = buttons[1].pressed;
        const lastGrab = lastGrabs[index];
        if (!lastGrab && grab) { // grip
          // pe.grabdown(handedness);
        } else if (lastGrab && !grab) {
          // pe.grabup(handedness);
        }
        lastGrabs[index] = grab; */

        // axes
        const {axes: axesSrc, buttons: buttonsSrc} = gamepad;
        const axes = [
          axesSrc[0] || 0,
          axesSrc[1] || 0,
          axesSrc[2] || 0,
          axesSrc[3] || 0,
        ];
        const buttons = [
          buttonsSrc[0] ? buttonsSrc[0].value : 0,
          buttonsSrc[1] ? buttonsSrc[1].value : 0,
          buttonsSrc[2] ? buttonsSrc[2].value : 0,
          buttonsSrc[3] ? buttonsSrc[3].value : 0,
          buttonsSrc[4] ? buttonsSrc[4].value : 0,
          buttonsSrc[5] ? buttonsSrc[4].value : 0,
        ];
        if (handedness === 'left') {
          const dx = axes[0] + axes[2];
          const dy = axes[1] + axes[3];
          if (Math.abs(dx) >= 0.01 || Math.abs(dx) >= 0.01) {
            localEuler.setFromQuaternion(xrCamera.quaternion, 'YXZ');
            localEuler.x = 0;
            localEuler.z = 0;
            localVector3.set(dx, 0, dy)
              .applyEuler(localEuler)
              .multiplyScalar(0.05);

            dolly.matrix
              // .premultiply(localMatrix2.makeTranslation(-xrCamera.position.x, -xrCamera.position.y, -xrCamera.position.z))
              .premultiply(localMatrix3.makeTranslation(localVector3.x, localVector3.y, localVector3.z))
              // .premultiply(localMatrix2.getInverse(localMatrix2))
              .decompose(dolly.position, dolly.quaternion, dolly.scale);
            walked = true;
          }
          
          currentWeaponGrabs[1] = buttons[1] > 0.5;
        } else if (handedness === 'right') {
          const _applyRotation = r => {
            dolly.matrix
              .premultiply(localMatrix2.makeTranslation(-xrCamera.position.x, -xrCamera.position.y, -xrCamera.position.z))
              .premultiply(localMatrix3.makeRotationFromQuaternion(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), r)))
              .premultiply(localMatrix2.getInverse(localMatrix2))
              .decompose(dolly.position, dolly.quaternion, dolly.scale);
          };
          if (
            (axes[0] < -0.75 && !(lastAxes[index][0] < -0.75)) ||
            (axes[2] < -0.75 && !(lastAxes[index][2] < -0.75))
          ) {
            _applyRotation(Math.PI * 0.2);
          } else if (
            (axes[0] > 0.75 && !(lastAxes[index][0] > 0.75)) ||
            (axes[2] > 0.75 && !(lastAxes[index][2] > 0.75))
          ) {
            _applyRotation(-Math.PI * 0.2);
          }
          currentTeleport = (axes[1] < -0.75 || axes[3] < -0.75);
          currentMenuDown = (axes[1] > 0.75 || axes[3] > 0.75);

          currentWeaponDown = buttonsSrc[0].pressed;
          currentWeaponValue = buttons[0];
          currentWeaponGrabs[0] = buttonsSrc[1].pressed;

          if (
            buttons[2] >= 0.5 && lastButtons[index][2] < 0.5 &&
            !(Math.abs(axes[0]) > 0.5 || Math.abs(axes[1]) > 0.5 || Math.abs(axes[2]) > 0.5 || Math.abs(axes[3]) > 0.5) &&
            !jumpState
          ) {
            _jump();
          }
        }

        lastAxes[index][0] = axes[0];
        lastAxes[index][1] = axes[1];
        lastAxes[index][2] = axes[2];
        lastAxes[index][3] = axes[3];
        
        lastButtons[index][0] = buttons[0];
        lastButtons[index][1] = buttons[1];
        lastButtons[index][2] = buttons[2];
        lastButtons[index][3] = buttons[3];
        lastButtons[index][4] = buttons[4];
      }
    }
    
    if (currentMenuDown) {
      const rightInputSource = inputSources.find(inputSource => inputSource.handedness === 'right');
      const pose = rightInputSource && frame.getPose(rightInputSource.targetRaySpace, renderer.xr.getReferenceSpace());
      if (pose) {
        localMatrix2.fromArray(pose.transform.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector, localQuaternion, localVector2);
        if (!lastSelector) {
          toolsMesh.position.copy(localVector);
          localEuler.setFromQuaternion(localQuaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          toolsMesh.quaternion.setFromEuler(localEuler);
        }
        toolsMesh.update(localVector);
        toolsMesh.visible = true;
      } else {
        toolsMesh.visible = false;
      }
    } else {
      toolsMesh.visible = false;
    }
    
    _applyGravity(timeDiff);

    if (walked || jumpState) {
      localObject.matrix.copy(xrCamera.matrix)
        .premultiply(dolly.matrix)
        .decompose(localObject.position, localObject.quaternion, localObject.scale);
      const originalPosition = localObject.position.clone();

      _applyAvatarPhysics(localObject, null, false, false, false, timeDiff);

      dolly.position.add(
        localObject.position.clone().sub(originalPosition)
      );
    } else {
      velocity.y = 0;
      localMatrix.copy(xrCamera.matrix)
        .premultiply(dolly.matrix);
      _collideItems(localMatrix);
      _collideChunk(localMatrix);
      rigManager.setLocalRigMatrix(null);
    }
  } else if (document.pointerLockElement) {
    const speed = 100 * (keys.shift ? 3 : 1);
    const cameraEuler = camera.rotation.clone();
    cameraEuler.x = 0;
    cameraEuler.z = 0;
    localVector.set(0, 0, 0);
    if (keys.left) {
      localVector.add(new THREE.Vector3(-1, 0, 0).applyEuler(cameraEuler));
    }
    if (keys.right) {
      localVector.add(new THREE.Vector3(1, 0, 0).applyEuler(cameraEuler));
    }
    if (keys.up) {
      localVector.add(new THREE.Vector3(0, 0, -1).applyEuler(cameraEuler));
    }
    if (keys.down) {
      localVector.add(new THREE.Vector3(0, 0, 1).applyEuler(cameraEuler));
    }
    if (localVector.length() > 0) {
      localVector.normalize().multiplyScalar(speed);
    }
    localVector.multiplyScalar(timeDiff);
    velocity.add(localVector);

    _applyGravity(timeDiff);

    if (selectedTool === 'firstperson') {
      _applyAvatarPhysics(camera, null, false, false, false, timeDiff);
    } else if (selectedTool === 'thirdperson') {
      _applyAvatarPhysics(camera, avatarCameraOffset, true, true, true, timeDiff);
    } else if (selectedTool === 'isometric') {
      _applyAvatarPhysics(camera, isometricCameraOffset, true, true, true, timeDiff);
    } else if (selectedTool === 'birdseye') {
      _applyAvatarPhysics(camera, new THREE.Vector3(0, -birdsEyeHeight + _getAvatarHeight(), 0), false, true, true, timeDiff);
    } else {
      _collideItems(camera.matrix);
      _collideChunk(camera.matrix);
      rigManager.setLocalRigMatrix(null);
    }
  } else {
    _collideItems(camera.matrix);
    _collideChunk(camera.matrix);
    rigManager.setLocalRigMatrix(null);
  }

  const _updateRig = () => {
    let hmdPosition, hmdQuaternion;
    let leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip;
    let rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip;

    if (rigManager.localRigMatrixEnabled) {
      localMatrix.copy(rigManager.localRigMatrix);
      // .premultiply(localMatrix2.getInverse(this.matrix))
      // .toArray(xrState.poseMatrix);
    } else {
      localMatrix.copy(camera.matrixWorld);
      // .getInverse(localMatrix)
      // .premultiply(localMatrix2.getInverse(this.matrix))
      // .toArray(xrState.poseMatrix);
    }
    localMatrix // .fromArray(this.xrState.poseMatrix)
      .decompose(localVector, localQuaternion, localVector2);
    hmdPosition = localVector.toArray();
    hmdQuaternion = localQuaternion.toArray();

    if (currentSession) {
      let inputSources = Array.from(currentSession.inputSources);
      inputSources = ['right', 'left']
        .map(handedness => inputSources.find(inputSource => inputSource.handedness === handedness));
      let pose;
      if (inputSources[0] && (pose = frame.getPose(inputSources[0].targetRaySpace, renderer.xr.getReferenceSpace()))) {
        localMatrix.fromArray(pose.transform.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        leftGamepadPosition = localVector2.toArray();
        leftGamepadQuaternion = localQuaternion2.toArray();

        const {gamepad} = inputSources[0];
        if (gamepad && gamepad.buttons.length >= 2) {
          const {buttons} = gamepad;
          leftGamepadPointer = buttons[0].value;
          leftGamepadGrip = buttons[1].value;
        } else {
          leftGamepadPointer = 0;
          leftGamepadGrip = 0;
        }
      }
      if (inputSources[1] && (pose = frame.getPose(inputSources[1].targetRaySpace, renderer.xr.getReferenceSpace()))) {
        localMatrix.fromArray(pose.transform.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        rightGamepadPosition = localVector2.toArray();
        rightGamepadQuaternion = localQuaternion2.toArray();

        const {gamepad} = inputSources[0];
        if (gamepad && gamepad.buttons.length >= 2) {
          const {buttons} = gamepad;
          rightGamepadPointer = buttons[0].value;
          rightGamepadGrip = buttons[1].value;
        } else {
          rightGamepadPointer = 0;
          rightGamepadGrip = 0;
        }
      }

      /* const _scaleMatrixPQ = (srcMatrixArray, p, q) => {
        localMatrix.fromArray(srcMatrixArray)
          .decompose(localVector, localQuaternion, localVector2);
        localVector.divideScalar(this.scale);
        localVector.toArray(p);
        localQuaternion.toArray(q);
      };
      const _loadInputSource = i => {
        const inputSource = inputSources[i];
        if (inputSource) {
          let gamepad, pose, hand;
          if (
            (gamepad = inputSource.gamepad || gamepads[i]) &&
            (pose = frame.getPose(inputSource.targetRaySpace, this.referenceSpace))
          ) {
            const xrGamepad = xrState.gamepads[inputSource.handedness === 'right' ? 1 : 0];
            _scaleMatrixPQ(pose.transform.matrix, xrGamepad.position, xrGamepad.orientation);

            for (let j = 0; j < gamepad.buttons.length; j++) {
              const button = gamepad.buttons[j];
              const xrButton = xrGamepad.buttons[j];
              xrButton.pressed[0] = button.pressed;
              xrButton.touched[0] = button.touched;
              xrButton.value[0] = button.value;
            }

            for (let j = 0; j < gamepad.axes.length; j++) {
              xrGamepad.axes[j] = gamepad.axes[j];
            }

            xrGamepad.connected[0] = 1;
          } else if (
            (hand = inputSource.hand)
          ) {
            const xrHand = xrState.hands[inputSource.handedness === 'right' ? 1 : 0];
            for (let i = 0; i < inputSource.hand.length; i++) {
              const joint = inputSource.hand[i];
              const xrHandJoint = xrHand[i];

              const jointPose = joint && frame.getJointPose(joint, this.referenceSpace);
              if (jointPose) {
                _scaleMatrixPQ(jointPose.transform.matrix, xrHandJoint.position, xrHandJoint.orientation);
                xrHandJoint.radius[0] = jointPose.radius;
                xrHandJoint.visible[0] = 1;
              } else {
                xrHandJoint.visible[0] = 0;
              }
            }
            xrHand.visible[0] = 1;
          }
        }
      };
      for (let i = 0; i < xrState.gamepads.length; i++) {
        xrState.gamepads[i].connected[0] = 0;
      }
      for (let i = 0; i < xrState.hands.length; i++) {
        xrState.hands[i].visible[0] = 0;
      }
      for (let i = 0; i < inputSources.length; i++) {
        _loadInputSource(i);
      } */

      /* localMatrix2.getInverse(this.matrix);
      localMatrix3
        .compose(localVector.fromArray(xrState.gamepads[1].position), localQuaternion.fromArray(xrState.gamepads[1].orientation), localVector2.set(1, 1, 1))
        .premultiply(localMatrix2)
        .decompose(localVector2, localQuaternion2, localVector3);
      leftGamepadPosition = localVector2.toArray();
      leftGamepadQuaternion = localQuaternion2.toArray();
      leftGamepadPointer = xrState.gamepads[1].buttons[0].value;
      leftGamepadGrip = xrState.gamepads[1].buttons[1].value;

      localMatrix3
        .compose(localVector.fromArray(xrState.gamepads[0].position), localQuaternion.fromArray(xrState.gamepads[0].orientation), localVector2.set(1, 1, 1))
        .premultiply(localMatrix2)
        .decompose(localVector2, localQuaternion2, localVector3);
      rightGamepadPosition = localVector2.toArray();
      rightGamepadQuaternion = localQuaternion2.toArray();
      rightGamepadPointer = xrState.gamepads[0].buttons[0].value;
      rightGamepadGrip = xrState.gamepads[0].buttons[1].value;

      if (xrState.hands[1].visible[0]) {
        for (let i = 0; i < 25; i++) {
          rig.inputs.leftGamepad.fingers[i].quaternion.fromArray(xrState.hands[1][i].orientation);
        }
      }
      rig.inputs.rightGamepad.pointer = xrState.gamepads[0].buttons[0].value;
      rig.inputs.rightGamepad.grip = xrState.gamepads[0].buttons[1].value;
      if (xrState.hands[0].visible[0]) {
        for (let i = 0; i < 25; i++) {
          rig.inputs.rightGamepad.fingers[i].quaternion.fromArray(xrState.hands[0][i].orientation);
        }
      } */
    }

    const handOffsetScale = rigManager.localRig ? rigManager.localRig.height / 1.5 : 1;
    if (!leftGamepadPosition) {
      leftGamepadPosition = localVector2.copy(localVector).add(localVector3.copy(leftHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion)).toArray();
      // .toArray(xrState.gamepads[1].position);
      leftGamepadQuaternion = localQuaternion.toArray();
      leftGamepadPointer = 0;
      leftGamepadGrip = 0;
    }
    if (!rightGamepadPosition) {
      rightGamepadPosition = localVector2.copy(localVector).add(localVector3.copy(rightHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion)).toArray();
      // .toArray(xrState.gamepads[0].position);
      rightGamepadQuaternion = localQuaternion.toArray();
      rightGamepadPointer = 0;
      rightGamepadGrip = 0;
    }

    /* HANDS.forEach((handedness, i) => {
      const grabuse = this.grabuses[handedness];
      const gamepad = xrState.gamepads[i];
      const button = gamepad.buttons[0];
      if (grabuse) {
        button.touched[0] = 1;
        button.pressed[0] = 1;
        button.value[0] = 1;
      } else {
        button.touched[0] = 0;
        button.pressed[0] = 0;
        button.value[0] = 0;
      }
    }); */

    rigManager.setLocalAvatarPose([
      [localVector.toArray(), localQuaternion.toArray()],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip],
    ]);
    rigManager.update();
  };
  _updateRig();

  const {leftGamepad: rightGamepad, rightGamepad: leftGamepad} = rigManager.localRig.inputs;

  orbitControls.enabled = selectedTool === 'camera';
  weapons.update();

  /* const _updateHands = () => {
    const session = renderer.xr.getSession();
    if (session) {
      const inputSource = session.inputSources[1];
      let pose;
      const referenceSpace = renderer.xr.getReferenceSpace();
      if (inputSource && (pose = frame.getPose(inputSource.targetRaySpace, referenceSpace))) {
        for (const handMesh of handMeshes) {
          handMesh.visible = false;
        }
        for (const inputSource of session.inputSources) {
          if (inputSource && inputSource.hand) {
            const handMesh = handMeshes[inputSource.handedness === 'right' ? 1 : 0];
            const positionAttribute = handMesh.geometry.attributes.position;

            for (let i = 0; i < inputSource.hand.length; i++) {
              const joint = inputSource.hand[i];
              const dstPositions = new Float32Array(positionAttribute.array.buffer, positionAttribute.array.byteOffset + i * jointNumPositions * Float32Array.BYTES_PER_ELEMENT, jointNumPositions);

              const jointPose = joint && frame.getJointPose(joint, referenceSpace);
              if (jointPose) {
                jointGeometry.attributes.position.array.set(jointPositions);
                jointGeometry.applyMatrix4(
                  localMatrix.fromArray(jointPose.transform.matrix),
                );
                dstPositions.set(jointGeometry.attributes.position.array);
              } else {
                dstPositions.fill(0);
              }
            }
            positionAttribute.needsUpdate = true;
            handMesh.visible = true;
          }
        }
      }
    }
  };
  _updateHands(); */

  /* if (planetAnimation) {
    const {startTime, endTime} = planetAnimation;
    const now = Date.now();
    const factor = Math.min((now - startTime) / (endTime - startTime), 1);
    _tickPlanetAnimation(factor);
  } */

  if (geometryWorker) {
    pxMeshes = pxMeshes.filter(pxMesh => {
      if (pxMesh.update()) {
        if (!pxMesh.velocity.equals(zeroVector)) {
          localMatrix.copy(pxMesh.matrixWorld)
            .decompose(localVector, localQuaternion, localVector2);
          const collision = geometryWorker.collide(geometryManager.tracker, 0.2, 0, localVector, localQuaternion2.set(0, 0, 0, 1), 1);

          if (collision) {
            localVector3.fromArray(collision.direction)
              .applyQuaternion(pxMesh.parent.getWorldQuaternion(localQuaternion).inverse());
            pxMesh.position.add(localVector3);
            pxMesh.velocity.copy(zeroVector);
            // pxMesh.angularVelocity.copy(zeroVector);
          } else {
            _applyVelocity(pxMesh.position, pxMesh.velocity, timeDiff);
            pxMesh.velocity.add(localVector.set(0, -9.8 * timeDiff, 0).applyQuaternion(pxMesh.parent.getWorldQuaternion(localQuaternion).inverse()));
            pxMesh.rotation.x += pxMesh.angularVelocity.x;
            pxMesh.rotation.y += pxMesh.angularVelocity.y;
            pxMesh.rotation.z += pxMesh.angularVelocity.z;
          }
        }
        return true;
      } else {
        pxMesh.parent.remove(pxMesh);
        return false;
      }
    });
  }
  lastTeleport = currentTeleport;
  lastMenuDown = currentMenuDown;
  lastSelectedWeapon = selectedWeapon;
  lastWeaponDown = currentWeaponDown;
  lastWeaponValue = currentWeaponValue;
  lastMenuExpanded = menuExpanded;
  for (let i = 0; i < 2; i++) {
    lastWeaponGrabs[i] = currentWeaponGrabs[i];
  }

  meshComposer.update();

  if (selectedTool === 'firstperson') {
    rigManager.localRig.decapitate();
  } else {
    rigManager.localRig.undecapitate();
  }

  geometryWorker.update();
  planet.update();

  appManager.tick(timestamp, frame);

  localMatrix.multiplyMatrices(xrCamera.projectionMatrix, localMatrix2.multiplyMatrices(xrCamera.matrixWorldInverse, worldContainer.matrixWorld));
  if (currentChunkMesh && currentVegetationMesh) {
    localMatrix3.copy(xrCamera.matrix)
      .premultiply(dolly.matrix)
      .premultiply(localMatrix2.getInverse(worldContainer.matrixWorld))
      .decompose(localVector, localQuaternion, localVector2);
    // localVector.x += Math.sin(Date.now()/1000)*15;
    // console.log('cull x', Math.floor(localVector.x/10));

    const [landGroups, vegetationGroups, thingGroups] = geometryWorker.tickCull(tracker, localVector, localMatrix);
    currentChunkMesh.geometry.groups = landGroups;
    currentVegetationMesh.geometry.groups = vegetationGroups;
    currentThingMesh.geometry.groups = thingGroups;
    // window.landGroups = landGroups;
    // window.vegetationGroups = vegetationGroups;
  }

  renderer.render(scene, camera);
  // renderer.render(highlightScene, camera);

  // planet.flush();
}
geometryManager.addEventListener('load', e => {
  meshDrawer = new MeshDrawer();
  geometryManager.chunkMeshContainer.add(meshDrawer.mesh);

  renderer.setAnimationLoop(animate);
});

let selectedTool = 'camera';
const _getFullAvatarHeight = () => rigManager.localRig ? rigManager.localRig.height : 1;
const _getAvatarHeight = () => _getFullAvatarHeight() * 0.9;
/* const _getMinHeight = () => {
  if (rigManager.localRig) {
    const avatarHeight = rigManager.localRig ? _getAvatarHeight() : 1;
    const floorHeight = 0;
    const minHeight = floorHeight + avatarHeight;
    return minHeight;
  } else {
    return 1;
  }
}; */
const birdsEyeHeight = 10;
const avatarCameraOffset = new THREE.Vector3(0, 0, -1);
const isometricCameraOffset = new THREE.Vector3(0, 0, -5);
const tools = Array.from(document.querySelectorAll('.tool'));
const _requestPointerLock = () => new Promise((accept, reject) => {
  if (!document.pointerLockElement) {
    const _pointerlockchange = e => {
      accept();
      _cleanup();
    };
    document.addEventListener('pointerlockchange', _pointerlockchange);
    const _pointerlockerror = err => {
      reject(err);
      _cleanup();
    };
    document.addEventListener('pointerlockerror', _pointerlockerror);
    const _cleanup = () => {
      document.removeEventListener('pointerlockchange', _pointerlockchange);
      document.removeEventListener('pointerlockerror', _pointerlockerror);
    };
    renderer.domElement.requestPointerLock();
  } else {
    accept();
  }
});
document.addEventListener('pointerlockchange', e => {
  if (!document.pointerLockElement) {
    tools.find(tool => tool.getAttribute('tool') === 'camera').click();
    document.dispatchEvent(new MouseEvent('mouseup'));
  }
});
for (let i = 0; i < tools.length; i++) {
  const tool = document.getElementById('tool-' + (i + 1));
  tool.addEventListener('click', async e => {
    const newSelectedTool = tool.getAttribute('tool');
    if (['firstperson', 'thirdperson', 'isometric', 'birdseye'].includes(newSelectedTool)) {
      await _requestPointerLock();
    }

    for (let i = 0; i < tools.length; i++) {
      tools[i].classList.remove('selected');
    }
    tool.classList.add('selected');

    const oldSelectedTool = selectedTool;
    selectedTool = newSelectedTool;

    if (selectedTool !== oldSelectedTool) {
      // hoverTarget = null;
      // _setSelectTarget(null);

      switch (oldSelectedTool) {
        case 'thirdperson': {
          camera.position.add(localVector.copy(avatarCameraOffset).applyQuaternion(camera.quaternion));
          camera.updateMatrixWorld();
          // setCamera(camera);
          break;
        }
        case 'isometric': {
          camera.position.add(localVector.copy(isometricCameraOffset).applyQuaternion(camera.quaternion));
          camera.updateMatrixWorld();
          // setCamera(camera);
          break;
        }
        case 'birdseye': {
          camera.position.y += -birdsEyeHeight + _getAvatarHeight();
          camera.updateMatrixWorld();
          // setCamera(camera);
          break;
        }
      }

      let decapitate = true;
      switch (selectedTool) {
        case 'camera': {
          document.exitPointerLock();
          orbitControls.target.copy(camera.position).add(new THREE.Vector3(0, 0, -3).applyQuaternion(camera.quaternion));
          _resetKeys();
          velocity.set(0, 0, 0);
          break;
        }
        case 'thirdperson': {
          camera.position.sub(localVector.copy(avatarCameraOffset).applyQuaternion(camera.quaternion));
          camera.updateMatrixWorld();

          decapitate = false;
          break;
        }
        case 'isometric': {
          camera.rotation.x = -Math.PI / 6;
          camera.quaternion.setFromEuler(camera.rotation);
          camera.position.sub(localVector.copy(isometricCameraOffset).applyQuaternion(camera.quaternion));
          camera.updateMatrixWorld();

          decapitate = false;
          break;
        }
        case 'birdseye': {
          camera.rotation.x = -Math.PI / 2;
          camera.quaternion.setFromEuler(camera.rotation);
          camera.position.y -= -birdsEyeHeight + _getAvatarHeight();
          camera.updateMatrixWorld();

          decapitate = false;
          break;
        }
      }
      if (rigManager.localRig) {
        if (decapitate) {
          rigManager.localRig.decapitate();
        } else {
          rigManager.localRig.undecapitate();
        }
      }
    }
  });
}

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  shift: false,
};
const _resetKeys = () => {
  for (const k in keys) {
    keys[k] = false;
  }
};
const _inputFocused = () => document.activeElement && document.activeElement.tagName === 'INPUT';
let jumpState = false;
let menuExpanded = false;
let lastMenuExpanded = false;
window.addEventListener('keydown', e => {
  switch (e.which) {
    case 49: { // 1
      let index = weapons.findIndex(weapon => weapon.getAttribute('weapon') === selectedWeapon);
      index--;
      if (index < 0) {
        index = weapons.length - 1;
      }
      weapons[index].click();
      break;
    }
    case 50: { // 2
      let index = weapons.findIndex(weapon => weapon.getAttribute('weapon') === selectedWeapon);
      index++;
      if (index >= weapons.length) {
        index = 0;
      }
      weapons[index].click();
      break;
    }
    case 87: { // W
      if (!document.pointerLockElement) {
        // nothing
      } else {
        keys.up = true;
      }
      break;
    }
    case 65: { // A
      if (!document.pointerLockElement) {
        // uiMesh && uiMesh.rotate(-1);
      } else {
        keys.left = true;
      }
      break;
    }
    case 83: { // S
      if (!document.pointerLockElement) {
        // nothing
      } else {
        keys.down = true;
      }
      break;
    }
    case 68: { // D
      if (!document.pointerLockElement) {
        // uiMesh && uiMesh.rotate(1);
      } else {
        keys.right = true;
      }
      break;
    }
    case 9: { // tab
      e.preventDefault();
      e.stopPropagation();
      menuExpanded = !menuExpanded;
      break;
    }
    case 69: { // E
      if (document.pointerLockElement) {
        // nothing
      /* } else {
        if (selectTarget && selectTarget.control) {
          selectTarget.control.setMode('rotate');
        } */
      }
      break;
    }
    case 82: { // R
      if (document.pointerLockElement) {
        // pe.equip('back');
      /* } else {
        if (selectTarget && selectTarget.control) {
          selectTarget.control.setMode('scale');
        } */
      }
      break;
    }
    case 70: { // F
      // pe.grabdown('right');
      if (document.pointerLockElement) {
        currentWeaponGrabs[0] = true;
      }
      break;
    }
    case 86: { // V
      if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        tools.find(tool => tool.getAttribute('tool') === 'firstperson').click();
      }
      break;
    }
    case 66: { // B
      if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        tools.find(tool => tool.getAttribute('tool') === 'thirdperson').click();
      }
      break;
    }
    case 78: { // N
      if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        tools.find(tool => tool.getAttribute('tool') === 'isometric').click();
      }
      break;
    }
    case 77: { // M
      if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        tools.find(tool => tool.getAttribute('tool') === 'birdseye').click();
      }
      break;
    }
    case 16: { // shift
      if (document.pointerLockElement) {
        keys.shift = true;
      }
      break;
    }
    case 32: { // space
      if (document.pointerLockElement) {
        if (!jumpState) {
          _jump();
        }
      }
      break;
    }
    case 81: { // Q
      if (selectedWeapon !== 'pickaxe') {
        document.querySelector('.weapon[weapon="pickaxe"]').click();
      } else {
        document.querySelector('.weapon[weapon="shovel"]').click();
      }
      break;
    }
    case 90: { // Z
      document.querySelector('.weapon[weapon="build"]').click();
      buildMode = 'wall';
      break;
    }
    case 88: { // X
      document.querySelector('.weapon[weapon="build"]').click();
      buildMode = 'floor';
      break;
    }
    case 67: { // C
      if (!keys.ctrl && document.pointerLockElement) {
        document.querySelector('.weapon[weapon="build"]').click();
        buildMode = 'stair';
      }
      break;
    }
    /* case 80: { // P
      physics.resetObjectMesh(physicalMesh);
      break;
    } */
    case 8: // backspace
    case 46: // del
    {
      /* if (selectedObjectMeshes.length > 0) {
          const oldSelectedObjectMeshes = selectedObjectMeshes;

          _setHoveredObjectMesh(null);
          _setSelectedObjectMesh(null, false);

          const action = createAction('removeObjects', {
            oldObjectMeshes: oldSelectedObjectMeshes,
            container,
            objectMeshes,
          });
          execute(action);
        } */
      break;
    }
  }
});
window.addEventListener('keyup', e => {
  switch (e.which) {
    case 87: { // W
      if (document.pointerLockElement) {
        keys.up = false;
      }
      break;
    }
    case 65: { // A
      if (document.pointerLockElement) {
        keys.left = false;
      }
      break;
    }
    case 83: { // S
      if (document.pointerLockElement) {
        keys.down = false;
      }
      break;
    }
    case 68: { // D
      if (document.pointerLockElement) {
        keys.right = false;
      }
      break;
    }
    case 70: { // F
      // pe.grabup('right');
      if (document.pointerLockElement) {
        currentWeaponGrabs[0] = false;
      }
      break;
    }
    case 16: { // shift
      if (document.pointerLockElement) {
        keys.shift = false;
      }
      break;
    }
  }
});
window.addEventListener('mousedown', e => {
  if (document.pointerLockElement || ['physics', 'pencil'].includes(selectedWeapon)) {
    if (e.button === 0) {
      // pe.grabtriggerdown('right');
      // pe.grabuse('right');
      currentWeaponDown = true;
      currentWeaponValue = 1;
    } else if (e.button === 2) {
      currentTeleport = true;
    }
  }
});
window.addEventListener('mouseup', e => {
  currentWeaponDown = false;
  currentWeaponValue = 0;
  currentTeleport = false;
});

const loadVsh = `
  #define M_PI 3.1415926535897932384626433832795
  uniform float uTime;
  
  mat4 rotationMatrix(vec3 axis, float angle)
  {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }

  void main() {
    // float f = 1.0 + pow(sin(uTime * M_PI), 0.5) * 0.2;
    gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix(vec3(0, 0, 1), -uTime * M_PI * 2.0) * vec4(position, 1.);
  }
`;
const loadFsh = `
  uniform float uHighlight;
  uniform float uTime;
  void main() {
    float f = 1.0 + max(1.0 - uTime, 0.0);
    gl_FragColor = vec4(vec3(${new THREE.Color(0xf4511e).toArray().join(', ')}) * f, 1.0);
  }
`;
const loadMeshMaterial = new THREE.ShaderMaterial({
  uniforms: {
    /* uHighlight: {
      type: 'f',
      value: 0,
    }, */
    uTime: {
      type: 'f',
      value: 0,
    },
  },
  vertexShader: loadVsh,
  fragmentShader: loadFsh,
  side: THREE.DoubleSide,
});
const _makeLoadMesh = (() => {
  const geometry = new THREE.RingBufferGeometry(0.05, 0.08, 128, 0, Math.PI / 2, Math.PI * 2 * 0.9);
  // .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)));
  return () => {
    const mesh = new THREE.Mesh(geometry, loadMeshMaterial);
    // mesh.frustumCulled = false;
    return mesh;
  };
})();
const _ensureLoadMesh = p => {
  if (!p.loadMesh) {
    p.loadMesh = _makeLoadMesh();
    p.loadMesh.matrix.copy(p.matrix).decompose(p.loadMesh.position, p.loadMesh.quaternion, p.loadMesh.scale);
    scene.add(p.loadMesh);

    p.waitForRun()
      .then(() => {
        p.loadMesh.visible = false;
      });
  }
};

geometryManager.addEventListener('load', () => {
  const files = inventory.getFiles();
  uiManager.inventoryMesh.inventoryItemsMesh.update(files);
  
  inventory.addEventListener('filesupdate', e => {
    const files = e.data;
    uiManager.inventoryMesh.inventoryItemsMesh.update(files);
  });
});

const raycaster = new THREE.Raycaster();
/* const _updateRaycasterFromMouseEvent = (raycaster, e) => {
  const mouse = new THREE.Vector2(((e.clientX) / window.innerWidth) * 2 - 1, -((e.clientY) / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  currentAnchor = inventoryMesh.intersect(raycaster) || detailsMesh.intersect(raycaster);
}; */
const _updateMouseMovement = e => {
  const {movementX, movementY} = e;
  if (selectedTool === 'thirdperson') {
    camera.position.add(localVector.copy(avatarCameraOffset).applyQuaternion(camera.quaternion));
  } else if (selectedTool === 'isometric') {
    camera.position.add(localVector.copy(isometricCameraOffset).applyQuaternion(camera.quaternion));
  } else if (selectedTool === 'birdseye') {
    camera.rotation.x = -Math.PI / 2;
    camera.quaternion.setFromEuler(camera.rotation);
  }

  camera.rotation.y -= movementX * Math.PI * 2 * 0.001;
  if (selectedTool !== 'isometric' && selectedTool !== 'birdseye') {
    camera.rotation.x -= movementY * Math.PI * 2 * 0.001;
    camera.rotation.x = Math.min(Math.max(camera.rotation.x, -Math.PI / 2), Math.PI / 2);
    camera.quaternion.setFromEuler(camera.rotation);
  }

  if (selectedTool === 'thirdperson') {
    camera.position.sub(localVector.copy(avatarCameraOffset).applyQuaternion(camera.quaternion));
  } else if (selectedTool === 'isometric') {
    camera.position.sub(localVector.copy(isometricCameraOffset).applyQuaternion(camera.quaternion));
  }
  camera.updateMatrixWorld();
};
renderer.domElement.addEventListener('mousemove', e => {
  if (selectedTool === 'firstperson' || selectedTool === 'thirdperson' || selectedTool === 'isometric' || selectedTool === 'birdseye') {
    _updateMouseMovement(e);
  }
});

window.addEventListener('resize', e => {
  if (!currentSession) {
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
});

let currentSession = null;
function onSessionStarted(session) {
  session.addEventListener('end', onSessionEnded);
  renderer.xr.setSession(session);
  // renderer.xr.setReferenceSpaceType('local-floor');
  currentSession = session;
}
function onSessionEnded() {
  currentSession.removeEventListener('end', onSessionEnded);
  renderer.xr.setSession(null);
  currentSession = null;
}
document.getElementById('enter-xr-button').addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();

  if (currentSession === null) {
    navigator.xr.requestSession('immersive-vr', {
      requiredFeatures: [
        'local-floor',
        // 'bounded-floor',
      ],
      optionalFeatures: [
        'hand-tracking',
      ],
    }).then(onSessionStarted);
  } else {
    currentSession.end();
  }
});
