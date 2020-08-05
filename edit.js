/* global Web3 */
/* eslint no-unused-vars: 0 */
import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {BufferGeometryUtils} from 'https://static.xrpackage.org/BufferGeometryUtils.js';
import {GLTFLoader} from './GLTFLoader.module.js';
import {TransformControls} from './TransformControls.js';
import CapsuleGeometry from './CapsuleGeometry.js';
// import address from 'https://contracts.webaverse.com/address.js';
// import abi from 'https://contracts.webaverse.com/abi.js';
import {XRPackage, pe, renderer, scene, camera, parcelMaterial, floorMesh, proxySession, getRealSession, loginManager} from './run.js';
import {downloadFile, readFile, bindUploadFileButton} from 'https://static.xrpackage.org/xrpackage/util.js';
// import {wireframeMaterial, getWireframeMesh, meshIdToArray, decorateRaycastMesh, VolumeRaycaster} from './volume.js';
import './gif.js';
import {makeUiFullMesh, makeTextMesh} from './vr-ui.js';
import {makeLineMesh, makeTeleportMesh} from './teleport.js';
import {
  PARCEL_SIZE,
  SUBPARCEL_SIZE,
  NUM_PARCELS,

  numSlices,
  slabRadius,

  slabTotalSize,
  slabNumAttributes,
  slabAttributeSize,
  slabSliceTris,
  slabSliceVertices,

  chunkDistance,
  BUILD_SNAP,
  PLANET_OBJECT_SLOTS,

  getNextMeshId,
} from './constants.js';
import alea from './alea.js';
import easing from './easing.js';
import {planet} from './planet.js';
import {player} from './player.js';
import {Bot} from './bot.js';
import './atlaspack.js';
import {Sky} from './Sky.js';
import {GuardianMesh} from './land.js';
import TinyQueue from './tinyqueue.js';

const apiHost = 'https://ipfs.exokit.org/ipfs';
const worldsEndpoint = 'https://worlds.exokit.org';
const packagesEndpoint = 'https://packages.exokit.org';

const zeroVector = new THREE.Vector3(0, 0, 0);
const downQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0));
const capsuleUpQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
const pid4 = Math.PI/4;
const redColorHex = new THREE.Color(0xef5350).multiplyScalar(2).getHex();

const baseHeight = PARCEL_SIZE/2-10;
const freqs = [
  1,
  1,
  1,
];
const octaves = [
  3,
  3,
  3,
];
const scales = [
  0.08,
  0.012,
  0.016,
];
const uvs = [
  0,
  0,
  0,
];
const amps = [
  1,
  1.5,
  4,
];

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localFrustum = new THREE.Frustum();

const cubicBezier = easing(0, 1, 0, 1);
const chunkOffset = new THREE.Vector3(-PARCEL_SIZE/2, -PARCEL_SIZE, -PARCEL_SIZE/2);

let skybox = null;
let skybox2 = null;

const _loadGltf = u => new Promise((accept, reject) => {
  new GLTFLoader().load(u, o => {
    o = o.scene;
    accept(o);
  }, xhr => {}, reject);
});
const HEIGHTFIELD_SHADER = {
  uniforms: {
    /* isCurrent: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    }, */
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    tex: {
      type: 't',
      value: new THREE.Texture(),
      needsUpdate: true,
    },
    heightColorTex: {
      type: 't',
      value: null,
      needsUpdate: true,
    },
    sunIntensity: {
      type: 'f',
      value: 1,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    #define LOG2 1.442695
    precision highp float;
    precision highp int;
    // uniform float fogDensity;
    // attribute vec4 color;
    attribute vec3 barycentric;
    // attribute float index;
    attribute float skyLight;
    attribute float torchLight;
    // attribute float torchLightmap;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vBarycentric;
    // varying vec3 vViewPosition;
    // varying vec4 vColor;
    // varying float vIndex;
    // varying vec3 vNormal;
    varying float vSkyLight;
    varying float vTorchLight;
    // varying float vFog;

    void main() {
      // vColor = color;
      // vNormal = normal;

      vec4 mvPosition = modelViewMatrix * vec4(position.xyz, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vPosition = position.xyz;
      vWorldPosition = mvPosition.xyz;
      vBarycentric = barycentric;
      // vIndex = index;
      vSkyLight = skyLight/8.0;
      vTorchLight = torchLight/8.0;
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;
    // uniform vec3 ambientLightColor;
    uniform float sunIntensity;
    // float sunIntensity = 1.;
    // uniform vec3 fogColor;
    // uniform vec3 cameraPosition;
    uniform sampler2D tex;
    uniform sampler2D heightColorTex;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vBarycentric;
    // varying float vIndex;
    // varying vec3 vViewPosition;
    // varying vec4 vColor;
    // varying vec3 vNormal;
    varying float vSkyLight;
    varying float vTorchLight;
    // varying float vFog;

    // uniform float isCurrent;
    uniform float uTime;

    #define saturate(a) clamp( a, 0.0, 1.0 )

    vec3 lightDirection = normalize(vec3(-1.0, -1.0, -1.0));

    float edgeFactor() {
      vec3 d = fwidth(vBarycentric);
      vec3 a3 = smoothstep(vec3(0.0), d, vBarycentric);
      return min(min(a3.x, a3.y), a3.z);
    }

    void main() {
      /* float lightColor = floor(
        (
          min((vSkyLightmap * sunIntensity) + vTorchLightmap, 1.0)
        ) * 4.0 + 0.5
      ) / 4.0; */
      /* vec3 ambientLightColor = vec3(0.5, 0.5, 0.5);
      vec3 xTangent = dFdx( vPosition );
      vec3 yTangent = dFdy( vPosition );
      vec3 faceNormal = normalize( cross( xTangent, yTangent ) );
      float lightColor = 0.5; // dot(faceNormal, lightDirection); */

      // float d = length(vPosition - vec3(${PARCEL_SIZE/2}, ${PARCEL_SIZE/2}, ${PARCEL_SIZE/2}));
      // float dMax = length(vec3(${PARCEL_SIZE/2}, ${PARCEL_SIZE/2}, ${PARCEL_SIZE/2}));
      // vec2 uv2 = vec2(d / dMax, 0.5);
      vec2 uv = vec2(
        mod((vPosition.x) / 2.0, 1.0),
        mod((vPosition.z) / 2.0, 1.0)
      );
      uv.x *= 1.0/8.0;
      uv.y *= 512.0/4096.0;
      if (vPosition.y < 290.0) {
        uv.x += 3.0/8.0;
      }
      vec2 uv2 = vec2(0.1 + vWorldPosition.y/30.0, 0.5);
      vec3 c = texture2D(heightColorTex, uv2).rgb;
      vec3 diffuseColor = mix(texture2D(tex, uv).rgb, vec3(0.), gl_FragCoord.z/gl_FragCoord.w/30.0);
      if (edgeFactor() <= 0.99) {
        diffuseColor = mix(diffuseColor, vec3(1.0), max(1.0 - abs(pow(length(vWorldPosition) - uTime*5.0, 3.0)), 0.0)*0.5);
        diffuseColor *= (0.9 + 0.1*min(gl_FragCoord.z/gl_FragCoord.w/10.0, 1.0));
      }
      float worldFactor = floor((sunIntensity * vSkyLight + vTorchLight) * 4.0 + 1.9) / 4.0;
      float cameraFactor = floor(8.0 - length(vWorldPosition))/8.;
      diffuseColor *= max(max(worldFactor, cameraFactor), 0.1);

      gl_FragColor = vec4(diffuseColor, 1.0);
    }
  `
};
const _snapBuildPosition = p => {
  p.x = Math.floor(p.x/BUILD_SNAP)*BUILD_SNAP+BUILD_SNAP/2;
  p.y = Math.floor(p.y/BUILD_SNAP)*BUILD_SNAP+BUILD_SNAP/2;
  p.z = Math.floor(p.z/BUILD_SNAP)*BUILD_SNAP+BUILD_SNAP/2;
  return p;
};
const _meshEquals = (a, b) => {
  if (a.position.equals(b.position)) {
    if (a.type === b.buildMeshType) {
      if (a.type === 'wall') {
        return Math.floor(a.quaternion.x/pid4) === Math.floor(b.quaternion.x/pid4) &&
          Math.floor(a.quaternion.y/pid4) === Math.floor(b.quaternion.y/pid4) &&
          Math.floor(a.quaternion.z/pid4) === Math.floor(b.quaternion.z/pid4) &&
          Math.floor(a.quaternion.w/pid4) === Math.floor(b.quaternion.w/pid4);
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
  return ((a%b)+b)%b;
}
const _getPotentialIndex = (x, y, z, subparcelSize) => x + y*subparcelSize*subparcelSize + z*subparcelSize;

const itemMeshes = [];
const npcMeshes = [];
/* const _decorateMeshForRaycast = mesh => {
  mesh.traverse(o => {
    if (o.isMesh) {
      const meshId = getNextMeshId();

      const {geometry} = o;
      const numPositions = geometry.attributes.position.array.length;
      const arrayBuffer2 = new ArrayBuffer(
        numPositions/3 * Float32Array.BYTES_PER_ELEMENT +
        numPositions/3 * Float32Array.BYTES_PER_ELEMENT
      );
      let index = 0;
      const indexOffset = 0;

      const ids = new Float32Array(arrayBuffer2, index, numPositions/3);
      index += numPositions/3 * Float32Array.BYTES_PER_ELEMENT;
      const indices = new Float32Array(arrayBuffer2, index, numPositions/3);
      index += numPositions/3 * Float32Array.BYTES_PER_ELEMENT;
      for (let i = 0; i < numPositions/3/3; i++) {
        ids[i*3] = meshId;
        ids[i*3+1] = meshId;
        ids[i*3+2] = meshId;
        const i2 = i + indexOffset;
        indices[i*3] = i2;
        indices[i*3+1] = i2;
        indices[i*3+2] = i2;
      }

      geometry.setAttribute('id', new THREE.BufferAttribute(ids, 1));
      geometry.setAttribute('index', new THREE.BufferAttribute(indices, 1));

      mesh.meshId = meshId;
    }
  });
}; */

let chunkWorker = null;
let physxWorker = null;
let physicsWorker = null;
let geometryWorker = null;
let chunkMeshes = [];
let chunkMesh = null;
const worldContainer = new THREE.Object3D();
scene.add(worldContainer);
const chunkMeshContainer = new THREE.Object3D();
worldContainer.add(chunkMeshContainer);
let currentChunkMesh = null;
// let capsuleMesh = null;
let currentVegetationMesh = null;
let currentVegetationTransparentMesh = null;
const _getCurrentChunkMesh = () => currentChunkMesh;
const _setCurrentChunkMesh = chunkMesh => {
  /* if (currentChunkMesh) {
    currentChunkMesh.material[0].uniforms.isCurrent.value = 0;
    currentChunkMesh.material[0].uniforms.isCurrent.needsUpdate = true;
    currentChunkMesh = null;
  } */
  currentChunkMesh = chunkMesh;
  /* if (currentChunkMesh) {
    currentChunkMesh.material[0].uniforms.isCurrent.value = 1;
    currentChunkMesh.material[0].uniforms.isCurrent.needsUpdate = true;
  } */
};
let stairsMesh = null;
let platformMesh = null;
let wallMesh = null;
let spikesMesh = null;
let woodMesh = null;
let stoneMesh = null;
let metalMesh = null;
let physicsShapes = null;
(async () => {

const [
  cw,
  px,
  pw,
  colors,
  _buildMeshes,
] = await Promise.all([
  (async () => {
    const cbs = [];
    const w = new Worker('chunk-worker.js');
    w.onmessage = e => {
      const {data} = e;
      const {error, result} = data;
      cbs.shift()(error, result);
    };
    w.onerror = err => {
      console.warn(err);
    };
    w.request = (req, transfers) => new Promise((accept, reject) => {
      w.postMessage(req, transfers);

      cbs.push((err, result) => {
        if (!err) {
          accept(result);
        } else {
          reject(err);
        }
      });
    });
    w.requestLoadPotentials = (seed, meshId, x, y, z, baseHeight, freqs, octaves, scales, uvs, amps, parcelSize, subparcelSize) => {
      return w.request({
        method: 'loadPotentials',
        seed,
        meshId,
        x,
        y,
        z,
        baseHeight,
        freqs,
        octaves,
        scales,
        uvs,
        amps,
        parcelSize,
        subparcelSize
      });
    };
    w.requestMarchLand = (seed, meshId, x, y, z, potentials, heightfield, lightfield, parcelSize, subparcelSize) => {
      return w.request({
        method: 'marchLand',
        seed,
        meshId,
        x,
        y,
        z,
        potentials,
        heightfield,
        lightfield,
        parcelSize,
        subparcelSize
      });
    };
    w.requestMine = (meshId, mineSpecs, subparcelSize) => {
      return w.request({
        method: 'mine',
        meshId,
        mineSpecs,
        subparcelSize,
      });
    };
    w.requestGetHeight = (seed, x, y, z, baseHeight, freqs, octaves, scales, uvs, amps, parcelSize) => {
      return w.request({
        method: 'getHeight',
        seed,
        x,
        y,
        z,
        baseHeight,
        freqs,
        octaves,
        scales,
        uvs,
        amps,
        parcelSize,
      });
    };
    return w;
  })(),
  (async () => {
    await import('./bin/physx2.js');
    await wasmModulePromise;
    Module._initPhysx();

    class Allocator {
      constructor() {
        this.offsets = [];
      }
      alloc(constructor, size) {
        const offset = self.Module._doMalloc(size * constructor.BYTES_PER_ELEMENT);
        const b = new constructor(self.Module.HEAP8.buffer, self.Module.HEAP8.byteOffset + offset, size);
        b.offset = offset;
        this.offsets.push(offset);
        return b;
      }
      freeAll() {
        for (let i = 0; i < this.offsets.length; i++) {
          self.Module._doFree(this.offsets[i]);
        }
        this.offsets.length = 0;
      }
    }

    const allocator = new Allocator();
    const registerBakedGeometryArgs = {
      data: allocator.alloc(Uint8Array, 1024 * 1024),
      meshPosition: allocator.alloc(Float32Array, 3),
      meshQuaternion: allocator.alloc(Float32Array, 4),
      result: allocator.alloc(Uint32Array, 1),
    };
    const registerStaticGeometryArgs = {
      position: allocator.alloc(Float32Array, 3),
      quaternion: allocator.alloc(Float32Array, 4),
      result: allocator.alloc(Uint32Array, 1),
    };
    const raycastArgs = {
      origin: allocator.alloc(Float32Array, 3),
      direction: allocator.alloc(Float32Array, 3),
      meshPosition: allocator.alloc(Float32Array, 3),
      meshQuaternion: allocator.alloc(Float32Array, 4),
      hit: allocator.alloc(Uint32Array, 1),
      point: allocator.alloc(Float32Array, 3),
      normal: allocator.alloc(Float32Array, 3),
      distance: allocator.alloc(Float32Array, 1),
      meshId: allocator.alloc(Uint32Array, 1),
      faceIndex: allocator.alloc(Uint32Array, 1),
    };
    const collideArgs = {
      position: allocator.alloc(Float32Array, 3),
      quaternion: allocator.alloc(Float32Array, 4),
      meshPosition: allocator.alloc(Float32Array, 3),
      meshQuaternion: allocator.alloc(Float32Array, 4),
      hit: allocator.alloc(Uint32Array, 1),
      direction: allocator.alloc(Float32Array, 3),
      grounded: allocator.alloc(Uint32Array, 1),
    };

    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localQuaternion = new THREE.Quaternion();
    const localQuaternion2 = new THREE.Quaternion();

    return {
      registerGeometry(meshId, positionsData, indicesData, x, y, z) {
        const {positions, indices, meshPosition, meshQuaternion, result} = geometryArgs;

        positions.set(positionsData);
        indicesData && indices.set(indicesData);
        localVector.set(x*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2, y*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2, z*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2).toArray(meshPosition);
        localQuaternion.set(0, 0, 0, 1).toArray(meshQuaternion);

        Module._registerGeometry(
          meshId,
          positions.offset,
          indicesData ? indices.offset : 0,
          positionsData.length,
          indicesData ? indicesData.length : 0,
          meshPosition.offset,
          meshQuaternion.offset,
          result.offset
        );
        const ptr = result[0];
        return ptr;
      },
      registerBakedGeometry(meshId, dataData, x, y, z) {
        const {data, meshPosition, meshQuaternion, result} = registerBakedGeometryArgs;

        data.set(dataData);
        localVector.set(x*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2, y*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2, z*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2).toArray(meshPosition);
        localQuaternion.set(0, 0, 0, 1).toArray(meshQuaternion);

        Module._registerBakedGeometry(
          meshId,
          data.offset,
          dataData.length,
          meshPosition.offset,
          meshQuaternion.offset,
          result.offset
        );
        const ptr = result[0];
        return ptr;
      },
      registerBoxGeometry(meshId, positionData, quaternionData, w, h, d) {
        const {position, quaternion, result} = registerStaticGeometryArgs;

        positionData.toArray(position);
        quaternionData.toArray(quaternion);

        Module._registerBoxGeometry(
          meshId,
          position.offset,
          quaternion.offset,
          w,
          h,
          d,
          result.offset
        );
        const ptr = result[0];
        return ptr;
      },
      registerCapsuleGeometry(meshId, positionData, quaternionData, radius, halfHeight) {
        const {position, quaternion, result} = registerStaticGeometryArgs;

        positionData.toArray(position);
        quaternionData.toArray(quaternion);

        Module._registerCapsuleGeometry(
          meshId,
          position.offset,
          quaternion.offset,
          radius,
          halfHeight,
          result.offset
        );
        const ptr = result[0];
        return ptr;
      },
      unregisterGeometry(ptr) {
        Module._unregisterGeometry(ptr);
      },
      raycast(p, q) {
        const {origin, direction, meshPosition, meshQuaternion, hit, point, normal, distance, meshId, faceIndex} = raycastArgs;

        p.toArray(origin);
        localVector.set(0, 0, -1)
          .applyQuaternion(q)
          .toArray(direction);
        currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
        localVector.toArray(meshPosition);
        localQuaternion.toArray(meshQuaternion);

        Module._raycast(
          origin.offset,
          direction.offset,
          meshPosition.offset,
          meshQuaternion.offset,
          hit.offset,
          point.offset,
          normal.offset,
          distance.offset,
          meshId.offset,
          faceIndex.offset
        );
        const result = hit[0] ? {
          point: point.slice(),
          normal: normal.slice(),
          distance: distance[0],
          meshId: meshId[0],
          faceIndex: faceIndex[0],
        } : null;
        return result;
      },
      collide(radius, halfHeight, p, q, maxIter) {
        const {position, quaternion, meshPosition, meshQuaternion, hit, direction, grounded} = collideArgs;

        p.toArray(position);
        localQuaternion.copy(q)
          .premultiply(capsuleUpQuaternion)
          .toArray(quaternion);
        currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
        localVector.toArray(meshPosition);
        localQuaternion.toArray(meshQuaternion);

        Module._collide(
          radius,
          halfHeight,
          position.offset,
          quaternion.offset,
          meshPosition.offset,
          meshQuaternion.offset,
          maxIter,
          hit.offset,
          direction.offset,
          grounded.offset
        );
        const result = hit[0] ? {
          direction: direction.slice(),
          grounded: !!grounded[0],
        } : null;
        return result;
      },
    };
  })(),
  (async () => {
    const cbs = [];
    const w = new Worker('./physics-worker.js');
    w.onmessage = e => {
      const {data} = e;
      const {error, result} = data;
      cbs.shift()(error, result);
    };
    w.onerror = err => {
      console.warn(err);
    };
    w.request = (req, transfers) => new Promise((accept, reject) => {
      w.postMessage(req, transfers);

      cbs.push((err, result) => {
        if (!err) {
          accept(result);
        } else {
          reject(err);
        }
      });
    });
    /* w.requestBakeGeometry = (positions, indices) => {
      return w.request({
        method: 'bakeGeometry',
        positions,
        indices,
      }, [positions.buffer]);
    }; */
    w.requestBakeGeometries = (specs) => {
      return w.request({
        method: 'bakeGeometries',
        specs,
      }, [specs[0].positions.buffer]);
    };
    return w;
  })(),
  (async () => {
    const res = await fetch('./colors.json');
    return await res.json();
  })(),
  (async () => {
    const buildModels = await _loadGltf('./build.glb');

    woodMesh = buildModels.children.find(c => c.name === 'SM_Item_Log_01');
    // woodMesh.visible = false;
    // worldContainer.add(woodMesh);

    stoneMesh = buildModels.children.find(c => c.name === 'SM_Env_Rock_01');
    // stoneMesh.visible = false;
    // worldContainer.add(stoneMesh);

    metalMesh = buildModels.children.find(c => c.name === 'SM_Prop_MetalSheet_01');
    // metalMesh.visible = false;
    // worldContainer.add(metalMesh);
  })(),
  (async () => {
    const structureModels = await _loadGltf('./structure.glb');

    const scale = 0.325;

    const canvas = document.createElement('canvas');
    canvas.width = 8192;
    canvas.height = 8192;
    const texture = new THREE.Texture(canvas);
    // texture.anisotropy = 16;
    texture.flipY = false;
    texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      vertexColors: true,
      // transparent: true,
    });
    const atlas = atlaspack(canvas);
    const rects = new Map();
    const _mapUvAttribute = (uvs, rect) => {
      const [[tx, ty], [rx, ry], [bx, by], [lx, ly]] = rect;
      const x = tx;
      const y = ty;
      const w = rx - lx;
      const h = by - ty;
      for (let i = 0; i < uvs.length; i += 2) {
        if (uvs[i] < 0) {
          uvs[i] = 0.001;
        } else if (uvs[i] > 1) {
          uvs[i] = 1-0.001;
        }
        if (uvs[i+1] < 0) {
          uvs[i+1] = 0.001;
        } else if (uvs[i+1] > 1) {
          uvs[i+1] = 1-0.001;
        }
        uvs[i] = x + uvs[i]*w;
        uvs[i+1] = y + uvs[i+1]*h;
      }
    };
    const _mergeGroup = g => {
      const geometries = [];
      g.traverse(o => {
        if (o.isMesh) {
          const {geometry, material} = o;
          const {map, color} = material;
          const hsl = color.getHSL({});
          if (hsl.s > 0 && hsl.l < 0.2) {
            color.multiplyScalar(3);
          }
          if (map) {
            let rect = rects.get(map.image.id);
            if (!rect) {
              map.image.id = 'img-' + rects.size;
              atlas.pack(map.image);
              rect = atlas.uv()[map.image.id];
              rects.set(map.image.id, rect);
            }
            _mapUvAttribute(geometry.attributes.uv.array, rect);
          } else {
            const uvs = new Float32Array(geometry.attributes.position.array.length/3*2);
            for (let i = 0; i < uvs.length; i += 2) {
              uvs[i] = 1;
              uvs[i+1] = 1;
            }
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
          }

          const colors = new Float32Array(geometry.attributes.position.array.length);
          for (let i = 0; i < colors.length; i += 3) {
            color.toArray(colors, i);
          }
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          geometries.push(geometry);
        }
      });
      const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = g.name;
      geometry.applyMatrix4(new THREE.Matrix4().makeScale(scale, scale, scale));
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
      // geometry.computeVertexNormals();
      return mesh;
    };

    const result = {};
    structureModels.children.forEach((c, index) => {
      const c2 = _mergeGroup(c);
      // c2.position.x = -6 + index*2;
      // scene.add(c2);
      result[c2.name] = c2;
    });
    atlas.context.fillStyle = '#FFF';
    atlas.context.fillRect(canvas.width-1, canvas.height-1, 1, 1);
    // console.log('got result', result);

    const instanceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: {
          type: 't',
          value: texture,
        },
      },
      vertexShader: `\
        precision highp float;
        precision highp int;

        attribute vec3 color;
        attribute vec3 colorOffset;
        attribute vec3 positionOffset;
        attribute vec4 quaternionOffset;
        attribute vec3 scaleOffset;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vColor;
        varying vec3 vColorOffset;

        vec3 applyQuaternion(vec3 v, vec4 q) {
          return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          vColor = color;
          vColorOffset = colorOffset;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(applyQuaternion(position.xyz * scaleOffset, quaternionOffset) + positionOffset, 1.0);
        }
      `,
      fragmentShader: `\
        precision highp float;
        precision highp int;

        uniform sampler2D map;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vColor;
        varying vec3 vColorOffset;

        vec3 l = normalize(vec3(-1.0, -1.0, -1.0));

        void main() {
          vec3 c = texture2D(map, vUv).rgb;
          float dotNL = dot(vNormal, l);
          gl_FragColor = vec4(c * vColor * vColorOffset * (0.5 + 0.5*abs(dotNL)), 1.0);
        }
      `,
      // lights: true,
      /* extensions: {
        derivatives: true,
      }, */
      // side: THREE.DoubleSide,
    });
    const _makeInstancedMesh = mesh => {
      const geometry = new THREE.InstancedBufferGeometry();
      for (const k in mesh.geometry.attributes) {
        geometry.setAttribute(k, mesh.geometry.attributes[k]);
      }
      geometry.setIndex(mesh.geometry.index);
      const positionOffsets = new Float32Array(3*PLANET_OBJECT_SLOTS);
      geometry.setAttribute('positionOffset', new THREE.InstancedBufferAttribute(positionOffsets, 3));
      const quaternionOffsets = new Float32Array(4*PLANET_OBJECT_SLOTS);
      geometry.setAttribute('quaternionOffset', new THREE.InstancedBufferAttribute(quaternionOffsets, 4));
      const scaleOffsets = new Float32Array(3*PLANET_OBJECT_SLOTS);
      geometry.setAttribute('scaleOffset', new THREE.InstancedBufferAttribute(scaleOffsets, 3));
      const colorOffsets = new Float32Array(3*PLANET_OBJECT_SLOTS);
      geometry.setAttribute('colorOffset', new THREE.InstancedBufferAttribute(colorOffsets, 3));
      geometry.instanceCount = 0;

      const instancedMesh = new THREE.Mesh(geometry, instanceMaterial);
      instancedMesh.addInstance = (meshId, position, quaternion, scale) => {
        const o = {
          meshId,
          index: geometry.instanceCount,
          position: position.clone(),
          quaternion: quaternion.clone(),
          scale: scale.clone(),
          matrix: new THREE.Matrix4().compose(position, quaternion, scale),
          color: new THREE.Color(0xFFFFFF),
          updatePosition() {
            o.position.toArray(geometry.attributes.positionOffset.array, o.index*3);
            geometry.attributes.positionOffset.needsUpdate = true;
          },
          updateColor() {
            o.color.toArray(geometry.attributes.colorOffset.array, o.index*3);
            geometry.attributes.colorOffset.needsUpdate = true;
          },
          remove() {
            geometry.instanceCount--;
            if (geometry.instanceCount > 0) {
              const positionOffset = new Float32Array(geometry.attributes.positionOffset.array.buffer, geometry.attributes.positionOffset.array.byteOffset + geometry.instanceCount*3*Float32Array.BYTES_PER_ELEMENT, 3);
              geometry.attributes.positionOffset.array.set(positionOffset, o.index*3);
              geometry.attributes.positionOffset.needsUpdate = true;

              const quaternionOffset = new Float32Array(geometry.attributes.quaternionOffset.array.buffer, geometry.attributes.quaternionOffset.array.byteOffset + geometry.instanceCount*4*Float32Array.BYTES_PER_ELEMENT, 4);
              geometry.attributes.quaternionOffset.array.set(quaternionOffset, o.index*4);
              geometry.attributes.quaternionOffset.needsUpdate = true;

              const scaleOffset = new Float32Array(geometry.attributes.scaleOffset.array.buffer, geometry.attributes.scaleOffset.array.byteOffset + geometry.instanceCount*3*Float32Array.BYTES_PER_ELEMENT, 3);
              geometry.attributes.scaleOffset.array.set(scaleOffset, o.index*3);
              geometry.attributes.scaleOffset.needsUpdate = true;

              const colorOffset = new Float32Array(geometry.attributes.colorOffset.array.buffer, geometry.attributes.colorOffset.array.byteOffset + geometry.instanceCount*3*Float32Array.BYTES_PER_ELEMENT, 3);
              geometry.attributes.colorOffset.array.set(colorOffset, o.index*3);
              geometry.attributes.colorOffset.needsUpdate = true;
            }
          },
        };
        o.position.toArray(geometry.attributes.positionOffset.array, o.index*3);
        geometry.attributes.positionOffset.needsUpdate = true;
        o.quaternion.toArray(geometry.attributes.quaternionOffset.array, o.index*4);
        geometry.attributes.quaternionOffset.needsUpdate = true;
        o.scale.toArray(geometry.attributes.scaleOffset.array, o.index*3);
        geometry.attributes.scaleOffset.needsUpdate = true;
        o.color.toArray(geometry.attributes.colorOffset.array, o.index*3);
        geometry.attributes.colorOffset.needsUpdate = true;

        geometry.instanceCount++;
        return o;
      };
      instancedMesh.frustumCulled = false;
      instancedMesh.mesh = mesh;
      return instancedMesh;
    };

    stairsMesh = result['StairsWood2'].clone();
    stairsMesh.geometry = stairsMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(1, Math.sqrt(2)*0.9, Math.sqrt(2)*0.8))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.005)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2/2 - 0.02, 0));
    stairsMesh.buildMeshType = 'stair';
    stairsMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    stairsMesh.instancedMesh = _makeInstancedMesh(stairsMesh);
    stairsMesh.physicsOffset = {
      position: new THREE.Vector3(0, 1, 0),
      quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/4),
      scale: new THREE.Vector3(2, 2*Math.sqrt(2), 0.1),
    };

    platformMesh = result['FloorWood2'].clone();
    platformMesh.geometry = platformMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(1.05, 1, 1))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.005)))
    platformMesh.buildMeshType = 'floor';
    platformMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    platformMesh.instancedMesh = _makeInstancedMesh(platformMesh);
    platformMesh.physicsOffset = {
      position: new THREE.Vector3(0, 0, 0),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(2, 0.1, 2),
    };

    wallMesh = result['WallWood2'].clone();
    wallMesh.geometry = wallMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeScale(1.2, 1.03, 1))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.005)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2/2, -2/2));
    wallMesh.buildMeshType = 'wall';
    wallMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    wallMesh.instancedMesh = _makeInstancedMesh(wallMesh);
    wallMesh.physicsOffset = {
      position: new THREE.Vector3(0, 1, -1),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(2, 2, 0.1),
    };

    spikesMesh = result['StairsWood2'].clone();
    spikesMesh.geometry = spikesMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(0.01, 0.01, 0.01))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
    spikesMesh.buildMeshType = 'trap';
    spikesMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    spikesMesh.instancedMesh = _makeInstancedMesh(spikesMesh);
    spikesMesh.physicsOffset = {
      position: new THREE.Vector3(0, 0, 0),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(2, 0.1, 2),
    };

    /* stairsMesh = result['StairsBrickFinal'].clone();
    stairsMesh.geometry = stairsMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(1, Math.sqrt(2)*0.9, Math.sqrt(2)*0.8))
      // .applyMatrix4(new THREE.Matrix4().makeScale(1.04, 1, 0.925 * Math.sqrt(2)))
      // .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/4 + 0.005)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2/2, 0));
    stairsMesh.buildMeshType = 'stair';
    stairsMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    stairsMesh.instancedMesh = _makeInstancedMesh(stairsMesh);

    platformMesh = result['FloorBrickFInal'].clone();
    platformMesh.geometry = platformMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(1.03, 1, 1.03))
      // .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.005)))
    platformMesh.buildMeshType = 'floor';
    platformMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    platformMesh.instancedMesh = _makeInstancedMesh(platformMesh);

    wallMesh = result['WallStone'].clone();
    // wallMesh = result['WallBrick'].clone();
    wallMesh.geometry = wallMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(1.03, 1.3, 1))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.005)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2/2, -2/2));
    wallMesh.buildMeshType = 'wall';
    wallMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    wallMesh.instancedMesh = _makeInstancedMesh(wallMesh);

    spikesMesh = result['FloorBrickFInal'].clone();
    spikesMesh.geometry = spikesMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(0.01, 0.01, 0.01))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
    spikesMesh.buildMeshType = 'trap';
    spikesMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    spikesMesh.instancedMesh = _makeInstancedMesh(spikesMesh); */

    /* stairsMesh = result['WallMetal3'].clone();
    stairsMesh.geometry = stairsMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeScale(2.5, 1, 1))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/4 + 0.005)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2/2, 0));
    stairsMesh.buildMeshType = 'stair';
    stairsMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    stairsMesh.instancedMesh = _makeInstancedMesh(stairsMesh);

    platformMesh = result['WallMetal2'].clone();
    platformMesh.geometry = platformMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeScale(0.7, 1, 1.25))
      // .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.005)))
    platformMesh.buildMeshType = 'floor';
    platformMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    platformMesh.instancedMesh = _makeInstancedMesh(platformMesh);

    wallMesh = result['WallMetal1'].clone();
    wallMesh.geometry = wallMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(0.99, 1.3, 1))
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.005)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2/2, -2/2));
    wallMesh.buildMeshType = 'wall';
    wallMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    wallMesh.instancedMesh = _makeInstancedMesh(wallMesh);

    spikesMesh = result['WallMetal3'].clone();
    spikesMesh.geometry = spikesMesh.geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(0.01, 0.01, 0.01))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
    spikesMesh.buildMeshType = 'trap';
    spikesMesh.traverse(o => {
      if (o.isMesh) {
        o.isBuildMesh = true;
      }
    });
    spikesMesh.instancedMesh = _makeInstancedMesh(spikesMesh); */
  })(),
  (async () => {
    geometryWorker = await (async () => {
      const cbs = [];
      const w = new Worker('geometry-worker.js');
      w.onmessage = e => {
        const {data} = e;
        const {error, result} = data;
        cbs.shift()(error, result);
      };
      w.onerror = err => {
        console.warn(err);
      };
      w.request = (req, transfers) => new Promise((accept, reject) => {
        w.postMessage(req, transfers);

        cbs.push((err, result) => {
          if (!err) {
            accept(result);
          } else {
            reject(err);
          }
        });
      });
      w.requestRegisterGeometry = (type, geometrySpecs) => {
        return w.request({
          method: 'registerGeometry',
          type,
          geometrySpecs,
        });
      };
      w.requestMarchObjects = (x, y, z, objects, heightfields, lightfields, subparcelSize) => {
        return w.request({
          method: 'marchObjects',
          x,
          y,
          z,
          objects,
          heightfields,
          lightfields,
          subparcelSize,
        }, [heightfields.buffer]);
      };
      return w;
    })();

    const canvas = document.createElement('canvas');
    canvas.width = 8192;
    canvas.height = 8192;
    const texture = new THREE.Texture(canvas);
    // texture.anisotropy = 16;
    texture.flipY = false;
    texture.needsUpdate = true;

    const atlas = atlaspack(canvas);
    const rects = new Map();
    {
      const _mapUvAttribute = (uvs, rect) => {
        const [[tx, ty], [rx, ry], [bx, by], [lx, ly]] = rect;
        const x = tx;
        const y = ty;
        const w = rx - lx;
        const h = by - ty;
        for (let i = 0; i < uvs.length; i += 2) {
          uvs[i] = x + uvs[i]*w;
          uvs[i+1] = y + uvs[i+1]*h;
        }
      };
      const _mergeGroup = g => {
        const geometries = [];
        g.traverse(o => {
          if (o.isMesh) {
            const {geometry, material} = o;
            const {map} = material;
            if (map) {
              let rect = rects.get(map.image.id);
              if (!rect) {
                map.image.id = 'img-' + rects.size;
                atlas.pack(map.image);
                rect = atlas.uv()[map.image.id];
                rects.set(map.image.id, rect);
              }
              _mapUvAttribute(geometry.attributes.uv.array, rect);
            } else {
              const uvs = new Float32Array(geometry.attributes.position.array.length/3*2);
              for (let i = 0; i < uvs.length; i += 2) {
                uvs[i] = 1;
                uvs[i+1] = 1;
              }
              geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            }

            geometry.applyMatrix4(new THREE.Matrix4().makeScale(o.scale.x, o.scale.y, o.scale.z));
            geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(o.quaternion));
            geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(o.position.x, o.position.y, o.position.z));
            geometries.push(geometry);
          }
        });
        return BufferGeometryUtils.mergeBufferGeometries(geometries);
      };

      const vegetationModelsSrc = await _loadGltf('./vegetation.glb');

      const vegetationSpecs = [
        ['grass1', [['Grass1', true]]],
        ['grass2', [['Grass2', true]]],
        ['grass3', [['Grass3', true]]],
        ['tree', [['Generic_Tree_#1', false], ['Fanta_Leaves_#1', true]]],
        ['tree2', [['Generic_Tree_#3', false], ['Boab_Leaves_#3', true]]],
        ['pinetree', [['Pine_-_Wood_#3', false], ['Pine_Leaves_#3', true]]],
        ['chest', [['Chest_top', false]]],
      ];
      for (const vegetationSpec of vegetationSpecs) {
        const [type, objectSpecs] = vegetationSpec;
        const cs = objectSpecs.map(objectSpec => {
          const [modelName, transparent] = objectSpec;
          const c = vegetationModelsSrc.getObjectByName(modelName);
          const geometry = _mergeGroup(c);
          const positions = geometry.attributes.position.array;
          const uvs = geometry.attributes.uv.array;
          const indices = geometry.index.array;
          return {transparent, positions, uvs, indices};
        });
        geometryWorker.requestRegisterGeometry(type, cs);
      }
    }
    {
      const scale = 0.325;

      const _mapUvAttribute = (uvs, rect) => {
        const [[tx, ty], [rx, ry], [bx, by], [lx, ly]] = rect;
        const x = tx;
        const y = ty;
        const w = rx - lx;
        const h = by - ty;
        for (let i = 0; i < uvs.length; i += 2) {
          if (uvs[i] < 0) {
            uvs[i] = 0.001;
          } else if (uvs[i] > 1) {
            uvs[i] = 1-0.001;
          }
          if (uvs[i+1] < 0) {
            uvs[i+1] = 0.001;
          } else if (uvs[i+1] > 1) {
            uvs[i+1] = 1-0.001;
          }
          uvs[i] = x + uvs[i]*w;
          uvs[i+1] = y + uvs[i+1]*h;
        }
      };
      const _mergeGroup = g => {
        const geometries = [];
        g.traverse(o => {
          if (o.isMesh) {
            const {geometry, material} = o;
            const {map, color} = material;
            const hsl = color.getHSL({});
            if (hsl.s > 0 && hsl.l < 0.2) {
              color.multiplyScalar(3);
            }
            if (map) {
              let rect = rects.get(map.image.id);
              if (!rect) {
                map.image.id = 'img-' + rects.size;
                atlas.pack(map.image);
                rect = atlas.uv()[map.image.id];
                rects.set(map.image.id, rect);
              }
              _mapUvAttribute(geometry.attributes.uv.array, rect);
            } else {
              const uvs = new Float32Array(geometry.attributes.position.array.length/3*2);
              for (let i = 0; i < uvs.length; i += 2) {
                uvs[i] = 1;
                uvs[i+1] = 1;
              }
              geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            }

            /* const colors = new Float32Array(geometry.attributes.position.array.length);
            for (let i = 0; i < colors.length; i += 3) {
              color.toArray(colors, i);
            }
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); */
            geometries.push(geometry);
          }
        });
        const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        mesh.name = g.name;
        geometry.applyMatrix4(new THREE.Matrix4().makeScale(scale, scale, scale));
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
        // geometry.computeVertexNormals();
        return mesh;
      };

      const structureModels = await _loadGltf('./structure.glb');

      {
        const stairsMesh = _mergeGroup(structureModels.getObjectByName('StairsWood2'));
        let {geometry} = stairsMesh;
        geometry = geometry.clone()
          .applyMatrix4(new THREE.Matrix4().makeScale(1, Math.sqrt(2)*0.9, Math.sqrt(2)*0.8))
          .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.005)))
          .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2/2 - 0.02, 0));
        geometryWorker.requestRegisterGeometry('stair', [{
          transparent: false,
          positions: geometry.attributes.position.array,
          uvs: geometry.attributes.uv.array,
          indices: geometry.index.array,
        }]);
      }
      {
        const platformMesh = _mergeGroup(structureModels.getObjectByName('FloorWood2'));
        let {geometry} = platformMesh;
        geometry = geometry.clone()
          .applyMatrix4(new THREE.Matrix4().makeScale(1.05, 1, 1))
          .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.005)));
        geometryWorker.requestRegisterGeometry('floor', [{
          transparent: false,
          positions: geometry.attributes.position.array,
          uvs: geometry.attributes.uv.array,
          indices: geometry.index.array,
        }]);
      }
      {
        const wallMesh = _mergeGroup(structureModels.getObjectByName('WallWood2'));
        let {geometry} = wallMesh;
        geometry = geometry.clone()
          .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2)))
          .applyMatrix4(new THREE.Matrix4().makeScale(1.2, 1.03, 1))
          .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.005)))
          .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2/2, -2/2));
        geometryWorker.requestRegisterGeometry('wall', [{
          transparent: false,
          positions: geometry.attributes.position.array,
          uvs: geometry.attributes.uv.array,
          indices: geometry.index.array,
        }]);
      }

      physicsShapes = {
        stair: {
          position: new THREE.Vector3(0, 1, 0),
          quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/4),
          scale: new THREE.Vector3(2, 2*Math.sqrt(2), 0.1),
        },
        floor: {
          position: new THREE.Vector3(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(2, 0.1, 2),
        },
        wall: {
          position: new THREE.Vector3(0, 1, -1),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(2, 2, 0.1),
        },
      };
    }

    const _makeVegetationMaterial = transparent => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          map: {
            type: 't',
            value: texture,
            needsUpdate: true,
          },
          uSelectId: {
            type: 'f',
            value: -1,
            needsUpdate: true,
          },
          uSelectPosition: {
            type: 'v3',
            value: new THREE.Vector3(),
            needsUpdate: true,
          },
          sunIntensity: {
            type: 'f',
            value: 1,
            needsUpdate: true,
          },
        },
        vertexShader: `\
          precision highp float;
          precision highp int;

          uniform float uSelectId;
          uniform vec3 uSelectPosition;
          attribute float id;
          attribute float skyLight;
          attribute float torchLight;

          varying vec2 vUv;
          varying vec3 vSelectColor;
          varying vec3 vWorldPosition;
          varying float vSkyLight;
          varying float vTorchLight;
          // varying vec3 vNormal;

          void main() {
            vUv = uv;
            vec3 p = position;
            if (uSelectId == id) {
              vSelectColor = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
              p += uSelectPosition;
            } else {
              vSelectColor = vec3(0.);
            }
            // vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            vec4 worldPosition = modelViewMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;
            vSkyLight = skyLight/8.0;
            vTorchLight = torchLight/8.0;
          }
        `,
        fragmentShader: `\
          precision highp float;
          precision highp int;

          uniform sampler2D map;
          uniform float sunIntensity;
          varying vec2 vUv;
          varying vec3 vSelectColor;
          varying vec3 vWorldPosition;
          varying float vSkyLight;
          varying float vTorchLight;
          // varying vec3 vNormal;

          // vec3 l = normalize(vec3(-1.0, -1.0, -1.0));

          void main() {
            gl_FragColor = ${transparent ? `texture2D(map, vUv)` : `vec4(texture2D(map, vUv).rgb, 1.0)`};
            gl_FragColor.rgb += vSelectColor;
            float worldFactor = floor((sunIntensity * vSkyLight + vTorchLight) * 4.0 + 1.9) / 4.0;
            float cameraFactor = floor(8.0 - length(vWorldPosition))/8.;
            gl_FragColor.rgb *= max(max(worldFactor, cameraFactor), 0.1);
            ${transparent ? `if (gl_FragColor.a < 0.8) discard;` : ''}
          }
        `,
      });
      if (transparent) {
        material.side = THREE.DoubleSide;
        material.transparent = true;
      }
      return material;
    };
    const vegetationMaterialOpaque = _makeVegetationMaterial(false);
    const vegetationMaterailTransparent = _makeVegetationMaterial(true);

    const _makeVegetationMesh = transparent => {
      const numPositions = 10 * 1024 * 1024;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(numPositions), 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(numPositions/3*2), 2));
      geometry.setAttribute('id', new THREE.BufferAttribute(new Float32Array(numPositions/3), 1));
      geometry.setAttribute('skyLight', new THREE.BufferAttribute(new Uint8Array(numPositions/3), 1));
      geometry.setAttribute('torchLight', new THREE.BufferAttribute(new Uint8Array(numPositions/3), 1));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(numPositions/3), 1));
      const material = transparent ? vegetationMaterailTransparent : vegetationMaterialOpaque;
      const mesh = new THREE.Mesh(geometry, [material]);
      mesh.frustumCulled = false;

      const slabs = {};
      const freeSlabs = new TinyQueue([], (a, b) => a.size - b.size);
      const _slabFits = (slab, numPositions, numUvs, numIds, numSkyLights, numTorchLights, numIndices) => {
        return slab.position.length >= numPositions &&
          slab.uv.length >= numUvs &&
          slab.id.length >= numIds &&
          slab.skyLight.length >= numSkyLights &&
          slab.torchLight.length >= numTorchLights &&
          slab.indices.length >= numIndices;
      };
      const _findFreeSlab = (numPositions, numUvs, numIds, numSkyLights, numTorchLights, numIndices) => {
        const pulledSlabs = [];
        let slab = null;
        for (let s = freeSlabs.pop(); !!s; s = freeSlabs.pop()) {
          if (_slabFits(s, numPositions, numUvs, numIds, numSkyLights, numTorchLights, numIndices)) {
            slab = s;
            break;
          } else {
            pulledSlabs.push(s);
          }
        }
        return slab;
      };
      const _getSlabPositionOffset = slab => (slab.position.byteOffset - geometry.attributes.position.array.byteOffset)/Float32Array.BYTES_PER_ELEMENT;
      const _getSlabUvOffset = slab => (slab.uv.byteOffset - geometry.attributes.uv.array.byteOffset)/Float32Array.BYTES_PER_ELEMENT;
      const _getSlabIdOffset = slab => (slab.id.byteOffset - geometry.attributes.id.array.byteOffset)/Float32Array.BYTES_PER_ELEMENT;
      const _getSlabSkyLightOffset = slab => (slab.skyLight.byteOffset - geometry.attributes.skyLight.array.byteOffset)/Uint8Array.BYTES_PER_ELEMENT;
      const _getSlabTorchLightOffset = slab => (slab.torchLight.byteOffset - geometry.attributes.torchLight.array.byteOffset)/Uint8Array.BYTES_PER_ELEMENT;
      const _getSlabIndexOffset = slab => (slab.indices.byteOffset - geometry.index.array.byteOffset)/Uint32Array.BYTES_PER_ELEMENT;
      let positionIndex = 0;
      let uvIndex = 0;
      let idIndex = 0;
      let skyLightIndex = 0;
      let torchLightIndex = 0;
      let indexIndex = 0;

      mesh.getSlab = (x, y, z, numPositions, numUvs, numIds, numSkyLights, numTorchLights, numIndices) => {
        const index = planet.getSubparcelIndex(x, y, z);
        let slab = slabs[index];
        if (slab && !_slabFits(slab, numPositions, numUvs, numIds, numSkyLights, numTorchLights, numIndices)) {
          mesh.freeSlabIndex(slab.index);
          slab = null;
        }
        if (!slab) {
          slab = _findFreeSlab(numPositions, numUvs, numIds, numSkyLights, numTorchLights, numIndices);
          if (slab) {
            slab.x = x;
            slab.y = y;
            slab.z = z;
            slab.index = index;
            slabs[index] = slab;
            geometry.addGroup(_getSlabIndexOffset(slab), slab.indices.length, 0);
            const group = geometry.groups[geometry.groups.length-1];
            group.boundingSphere =
              new THREE.Sphere(
                new THREE.Vector3(x*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2, y*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2, z*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2),
                slabRadius
              );
            slab.group = group;
          } else {
            slab = {
              x,
              y,
              z,
              index,
              position: new Float32Array(geometry.attributes.position.array.buffer, geometry.attributes.position.array.byteOffset + positionIndex*Float32Array.BYTES_PER_ELEMENT, numPositions),
              uv: new Float32Array(geometry.attributes.uv.array.buffer, geometry.attributes.uv.array.byteOffset + uvIndex*Float32Array.BYTES_PER_ELEMENT, numUvs),
              id: new Float32Array(geometry.attributes.id.array.buffer, geometry.attributes.id.array.byteOffset + idIndex*Float32Array.BYTES_PER_ELEMENT, numIds),
              skyLight: new Uint8Array(geometry.attributes.skyLight.array.buffer, geometry.attributes.skyLight.array.byteOffset + skyLightIndex*Uint8Array.BYTES_PER_ELEMENT, numSkyLights),
              torchLight: new Uint8Array(geometry.attributes.torchLight.array.buffer, geometry.attributes.torchLight.array.byteOffset + torchLightIndex*Uint8Array.BYTES_PER_ELEMENT, numTorchLights),
              indices: new Uint32Array(geometry.index.array.buffer, geometry.index.array.byteOffset + indexIndex*Uint32Array.BYTES_PER_ELEMENT, numIndices),
              size: numPositions + numUvs + numIds + numSkyLights + numTorchLights + numIndices,
              group: null,
            };
            slabs[index] = slab;
            geometry.addGroup(_getSlabIndexOffset(slab), slab.indices.length, 0);
            const group = geometry.groups[geometry.groups.length-1];
            group.boundingSphere =
              new THREE.Sphere(
                new THREE.Vector3(x*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2, y*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2, z*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2),
                slabRadius
              );
            slab.group = group;

            positionIndex += numPositions;
            uvIndex += numUvs;
            idIndex += numIds;
            skyLightIndex += numSkyLights;
            torchLightIndex += numTorchLights;
            indexIndex += numIndices;
          }
        }
        return slab;
      };
      mesh.updateGeometry = (slab, spec) => {
        geometry.attributes.position.updateRange.offset = _getSlabPositionOffset(slab);
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.uv.updateRange.offset =_getSlabUvOffset(slab);
        geometry.attributes.uv.needsUpdate = true;
        geometry.attributes.id.updateRange.offset = _getSlabIdOffset(slab);
        geometry.attributes.id.needsUpdate = true;
        geometry.attributes.skyLight.updateRange.offset = _getSlabSkyLightOffset(slab);
        geometry.attributes.skyLight.needsUpdate = true;
        geometry.attributes.torchLight.updateRange.offset = _getSlabTorchLightOffset(slab);
        geometry.attributes.torchLight.needsUpdate = true;
        geometry.index.updateRange.offset = _getSlabIndexOffset(slab);
        geometry.index.needsUpdate = true;

        geometry.attributes.position.updateRange.count = spec.positions.length;
        geometry.attributes.uv.updateRange.count = spec.uvs.length;
        geometry.attributes.id.updateRange.count = spec.ids.length;
        geometry.attributes.skyLight.updateRange.count = spec.skyLights.length;
        geometry.attributes.torchLight.updateRange.count = spec.torchLights.length;
        geometry.index.updateRange.count = spec.indices.length;
        renderer.geometries.update(geometry);
      };
      mesh.freeSlabIndex = index => {
        const slab = slabs[index];
        if (slab) {
          geometry.groups.splice(geometry.groups.indexOf(slab.group), 1);
          slab.group = null;
          slabs[index] = null;
          freeSlabs.push(slab);
        }
      };
      mesh.getSlabPositionOffset = _getSlabPositionOffset;
      mesh.getSlabUvOffset = _getSlabUvOffset;
      mesh.getSlabIdOffset = _getSlabIdOffset;
      mesh.getSlabSkyLightOffset = _getSlabSkyLightOffset;
      mesh.getSlabTorchLightOffset = _getSlabTorchLightOffset;
      mesh.getSlabIndexOffset = _getSlabIndexOffset;
      return mesh;
    };
    currentVegetationMesh = _makeVegetationMesh(false);
    currentVegetationMesh.position.copy(chunkOffset);
    chunkMeshContainer.add(currentVegetationMesh);

    currentVegetationTransparentMesh = _makeVegetationMesh(true);
    currentVegetationTransparentMesh.position.copy(chunkOffset);
    chunkMeshContainer.add(currentVegetationTransparentMesh);

    // atlas.context.fillStyle = '#FFF';
    // atlas.context.fillRect(canvas.width-1, canvas.height-1, 1, 1);

    // treeMesh = _makeInstancedMesh(result['Generic_Tree_#1'], 256, false);
    // worldContainer.add(tree1InstanceMesh);
    /* // const leaves1InstanceMesh = _makeInstancedMesh(result['Fanta_Leaves_#1'], 256, true);
    // worldContainer.add(leaves1InstanceMesh);
    for (let i = 0; i < 100; i++) {
      p.set(-1+Math.random()*2 * 30, -12, -1+Math.random()*2 * 30);
      q.setFromAxisAngle(axis, Math.random()*Math.PI*2);
      tree1InstanceMesh.addInstance(p, q, s);
      // leaves1InstanceMesh.addInstance(p, q, s);
    } */

    /* const tree3InstanceMesh = _makeInstancedMesh(result['Generic_Tree_#3'], 256, false);
    worldContainer.add(tree3InstanceMesh);
    const leaves3InstanceMesh = _makeInstancedMesh(result['Boab_Leaves_#3'], 256, true);
    worldContainer.add(leaves3InstanceMesh);
    for (let i = 0; i < 100; i++) {
      p.set(-1+Math.random()*2 * 30, -12, -1+Math.random()*2 * 30);
      q.setFromAxisAngle(axis, Math.random()*Math.PI*2);
      tree3InstanceMesh.addInstance(p, q, s);
      leaves3InstanceMesh.addInstance(p, q, s);
    }

    const pineTreeInstanceMesh = _makeInstancedMesh(result['Pine_-_Wood_#3'], 256, false);
    worldContainer.add(pineTreeInstanceMesh);
    const pineLeavesInstanceMesh = _makeInstancedMesh(result['Pine_Leaves_#3'], 256, true);
    worldContainer.add(pineLeavesInstanceMesh);
    for (let i = 0; i < 100; i++) {
      p.set(-1+Math.random()*2 * 30, -12, -1+Math.random()*2 * 30);
      q.setFromAxisAngle(axis, Math.random()*Math.PI*2);
      pineTreeInstanceMesh.addInstance(p, q, s);
      pineLeavesInstanceMesh.addInstance(p, q, s);
    }

    const chestInstanceMesh = _makeInstancedMesh(result['Chest_top'], 32, true);
    for (let i = 0; i < 10; i++) {
      p.set(-1+Math.random()*2 * 30, -12, -1+Math.random()*2 * 30);
      q.setFromAxisAngle(axis, Math.random()*Math.PI*2);
      chestInstanceMesh.addInstance(p, q, s);
    }
    worldContainer.add(chestInstanceMesh);

    const grass1InstanceMesh = _makeInstancedMesh(result['Grass1'], 2048, true);
    for (let i = 0; i < 1000; i++) {
      p.set(-1+Math.random()*2 * 30, -12, -1+Math.random()*2 * 30);
      q.setFromAxisAngle(axis, Math.random()*Math.PI*2);
      grass1InstanceMesh.addInstance(p, q, s);
    }
    worldContainer.add(grass1InstanceMesh);

    const grass2InstanceMesh = _makeInstancedMesh(result['Grass2'], 2048, true);
    for (let i = 0; i < 1000; i++) {
      p.set(-1+Math.random()*2 * 30, -12, -1+Math.random()*2 * 30);
      q.setFromAxisAngle(axis, Math.random()*Math.PI*2);
      grass2InstanceMesh.addInstance(p, q, s);
    }
    worldContainer.add(grass2InstanceMesh);

    const grass3InstanceMesh = _makeInstancedMesh(result['Grass3'], 2048, true);
    for (let i = 0; i < 1000; i++) {
      p.set(-1+Math.random()*2 * 30, -12, -1+Math.random()*2 * 30);
      q.setFromAxisAngle(axis, Math.random()*Math.PI*2);
      grass3InstanceMesh.addInstance(p, q, s);
    }
    worldContainer.add(grass3InstanceMesh); */
  })(),
]);
chunkWorker = cw;
physxWorker = px;
physicsWorker = pw;

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
    var uniforms = skybox2.material.uniforms;
    uniforms[ "turbidity" ].value = effectController.turbidity;
    uniforms[ "rayleigh" ].value = effectController.rayleigh;
    uniforms[ "mieCoefficient" ].value = effectController.mieCoefficient;
    uniforms[ "mieDirectionalG" ].value = effectController.mieDirectionalG;

    effectController.azimuth = (0.05 + ((Date.now() / 1000) * 0.1)) % 1;
    var theta = Math.PI * ( effectController.inclination - 0.5 );
    var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );

    sun.x = Math.cos( phi );
    sun.y = Math.sin( phi ) * Math.sin( theta );
    sun.z = Math.sin( phi ) * Math.cos( theta );

    uniforms[ "sunPosition" ].value.copy( sun );
  }
  skybox2 = new Sky();
  skybox2.scale.setScalar(1000);
  skybox2.update = update;
  skybox2.update();
  scene.add(skybox2);
})();
(() => {
  const sphere = new THREE.SphereBufferGeometry(10, 32, 32);

  const img = new Image();
  img.src = './hexagon.jpg';
  const texture = new THREE.Texture(img);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  img.onload = () => {
    texture.needsUpdate = true;
  };
  img.onerror = err => {
    console.warn(err.stack);
  };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tex: {type: 't', value: texture},
      iTime: {value: 0}
    },
    vertexShader: `\
      uniform float iTime;
      varying vec2 uvs;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      void main() {
        uvs = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        vNormal = normal;
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
      }
    `,
    fragmentShader: `\
      #define PI 3.1415926535897932384626433832795

      uniform float iTime;
      uniform sampler2D tex;
      varying vec2 uvs;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      const vec3 c = vec3(${new THREE.Color(0x1565c0).toArray().join(', ')});

      void main() {
        vec2 uv = uvs;
        uv.x *= 1.7320508075688772;
        uv *= 8.0;

        vec3 direction = vWorldPosition - cameraPosition;
        float d = dot(vNormal, normalize(direction));
        float glow = d < 0.0 ? max(1. + d * 2., 0.) : 0.;

        float animationFactor = (1.0 + sin((uvs.y*2. + iTime) * PI*2.))/2.;
        float a = glow + (1.0 - texture2D(tex, uv).r) * (0.01 + pow(animationFactor, 10.0) * 0.5);
        gl_FragColor = vec4(c, a);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  skybox = new THREE.Mesh(sphere, material);
  scene.add(skybox);
})();
(() => {
  const guardianMesh = GuardianMesh([[
    0, 0, SUBPARCEL_SIZE, SUBPARCEL_SIZE,
  ]], 0x42a5f5);
  scene.add(guardianMesh);
})();

const _makeChunkMesh = (seedString, parcelSize, subparcelSize) => {
  const rng = alea(seedString);
  const seedNum = Math.floor(rng() * 0xFFFFFF);

  const meshId = getNextMeshId();

  const heightfieldMaterial = new THREE.ShaderMaterial({
    uniforms: (() => {
      const uniforms = Object.assign(
        THREE.UniformsUtils.clone(THREE.UniformsLib.lights),
        THREE.UniformsUtils.clone(HEIGHTFIELD_SHADER.uniforms)
      );
      // uniforms.fogColor.value = scene.fog.color;
      // uniforms.fogDensity.value = scene.fog.density;
      return uniforms;
    })(),
    vertexShader: HEIGHTFIELD_SHADER.vertexShader,
    fragmentShader: HEIGHTFIELD_SHADER.fragmentShader,
    lights: true,
    extensions: {
      derivatives: true,
    },
  });

  const numStops = 1;
  const stops = Array(numStops);
  const colorKeys = Object.keys(colors);
  for (let i = 0; i < numStops; i++) {
    const pos = i === 0 ? 0 : Math.floor(rng() *255);
    const colorIndex = colorKeys[Math.floor(rng() * colorKeys.length)];
    const color = colors[colorIndex];
    const col = parseInt('0x' + color[400].slice(1));
    stops[i] = [pos, col];
  }
  stops.sort((a, b) => a[0] - b[0]);
  heightfieldMaterial.uniforms.heightColorTex.value = new THREE.DataTexture(new Uint8Array(256*3), 256, 1, THREE.RGBFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, 1);
  heightfieldMaterial.uniforms.heightColorTex.needsUpdate = true;

  stops.forEach((stop, i) => {
    const [startIndex, colorValue] = stop;
    const nextStop = stops[i+1] || null;
    const endIndex = nextStop ? nextStop[0] : 256;
    const color = new THREE.Color(colorValue);
    const colorArray = Uint8Array.from([
      color.r*255,
      color.g*255,
      color.b*255,
    ]);
    for (let j = startIndex; j < endIndex; j++) {
      heightfieldMaterial.uniforms.heightColorTex.value.image.data.set(colorArray, j*3);
    }
  });
  heightfieldMaterial.uniforms.heightColorTex.value.needsUpdate = true;

  (async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 4096;
    heightfieldMaterial.uniforms.tex.value.image = canvas;
    heightfieldMaterial.uniforms.tex.value.minFilter = THREE.LinearFilter;
    heightfieldMaterial.uniforms.tex.value.flipY = false;

    const atlas = atlaspack(canvas);
    const rects = new Map();

    for (const u of [
      'Grass_1.png',
      'Grass_2.png',
      'Grass_3.png',
      'Ground_1.png',
      'Ground_2.png',
      'Ground_3.png',
      'Ground_4.png',
      'Ground_5.png',
    ]) {
      await new Promise((accept, reject) => {
        const img = new Image();
        img.onload = () => {
          img.id = 'img-' + rects.size;
          atlas.pack(img);
          const rect = atlas.uv()[img.id];
          rects.set(img.id, rect);

          accept();
        };
        img.onerror = reject;
        img.src = `./textures/${u}`;
      });
    }

    heightfieldMaterial.uniforms.tex.value.needsUpdate = true;
  })();

  const slabArrayBuffer = new ArrayBuffer(slabTotalSize);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 0*slabAttributeSize, slabSliceVertices*numSlices*3), 3));
  geometry.setAttribute('barycentric', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 1*slabAttributeSize, slabSliceVertices*numSlices*3), 3));
  geometry.setAttribute('id', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 2*slabAttributeSize, slabSliceVertices*numSlices), 1));
  geometry.setAttribute('index', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 3*slabAttributeSize, slabSliceVertices*numSlices), 1));
  geometry.setAttribute('skyLight', new THREE.BufferAttribute(new Uint8Array(slabArrayBuffer, 4*slabAttributeSize, slabSliceVertices*numSlices), 1));
  geometry.setAttribute('torchLight', new THREE.BufferAttribute(new Uint8Array(slabArrayBuffer, 5*slabAttributeSize, slabSliceVertices*numSlices), 1));

  const mesh = new THREE.Mesh(geometry, [heightfieldMaterial]);
  mesh.frustumCulled = false;
  mesh.seedNum = seedNum;
  mesh.meshId = meshId;
  mesh.seedString = seedString;
  mesh.parcelSize = parcelSize;
  mesh.subparcelSize = subparcelSize;
  mesh.isChunkMesh = true;
  mesh.buildMeshes = {};
  mesh.vegetationMeshes = {};
  mesh.objects = [];

  const slabs = {};
  const freeSlabs = [];
  let slabIndex = 0;
  mesh.getSlab = (x, y, z) => {
    const index = planet.getSubparcelIndex(x, y, z);
    let slab = slabs[index];
    if (!slab) {
      slab = freeSlabs.pop();
      if (slab) {
        slab.x = x;
        slab.y = y;
        slab.z = z;
        slab.index = index;
        slabs[index] = slab;
        const {slabIndex} = slab;
        geometry.addGroup(slabIndex * slabSliceVertices, slab.position.length/3, 0);
        geometry.groups[geometry.groups.length-1].boundingSphere =
          new THREE.Sphere(
            new THREE.Vector3(x*subparcelSize + subparcelSize/2, y*subparcelSize + subparcelSize/2, z*subparcelSize + subparcelSize/2),
            slabRadius
          );
      } else {
        slab = {
          x,
          y,
          z,
          index,
          slabIndex,
          position: new Float32Array(geometry.attributes.position.array.buffer, geometry.attributes.position.array.byteOffset + slabIndex*slabSliceVertices*3*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices*3),
          barycentric: new Float32Array(geometry.attributes.barycentric.array.buffer, geometry.attributes.barycentric.array.byteOffset + slabIndex*slabSliceVertices*3*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices*3),
          id: new Float32Array(geometry.attributes.id.array.buffer, geometry.attributes.id.array.byteOffset + slabIndex*slabSliceVertices*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices),
          indices: new Float32Array(geometry.attributes.index.array.buffer, geometry.attributes.index.array.byteOffset + slabIndex*slabSliceVertices*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices),
          skyLights: new Uint8Array(geometry.attributes.skyLight.array.buffer, geometry.attributes.skyLight.array.byteOffset + slabIndex*slabSliceVertices*Uint8Array.BYTES_PER_ELEMENT, slabSliceVertices),
          torchLights: new Uint8Array(geometry.attributes.torchLight.array.buffer, geometry.attributes.torchLight.array.byteOffset + slabIndex*slabSliceVertices*Uint8Array.BYTES_PER_ELEMENT, slabSliceVertices),
        };
        slabs[index] = slab;
        geometry.addGroup(slabIndex * slabSliceVertices, slab.position.length/3, 0);
        geometry.groups[geometry.groups.length-1].boundingSphere =
          new THREE.Sphere(
            new THREE.Vector3(x*subparcelSize + subparcelSize/2, y*subparcelSize + subparcelSize/2, z*subparcelSize + subparcelSize/2),
            slabRadius
          );
        slabIndex++;
      }
    }
    return slab;
  };
  mesh.updateGeometry = (slab, spec) => {
    geometry.attributes.position.updateRange.offset = slab.slabIndex*slabSliceVertices*3;
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.barycentric.updateRange.offset = slab.slabIndex*slabSliceVertices*3;
    geometry.attributes.barycentric.needsUpdate = true;
    geometry.attributes.id.updateRange.offset = slab.slabIndex*slabSliceVertices;
    geometry.attributes.id.needsUpdate = true;
    geometry.attributes.index.updateRange.offset = slab.slabIndex*slabSliceVertices;
    geometry.attributes.index.needsUpdate = true;
    geometry.attributes.skyLight.updateRange.offset = slab.slabIndex*slabSliceVertices;
    geometry.attributes.skyLight.needsUpdate = true;
    geometry.attributes.torchLight.updateRange.offset = slab.slabIndex*slabSliceVertices;
    geometry.attributes.torchLight.needsUpdate = true;

    geometry.attributes.position.updateRange.count = spec.positions.length;
    geometry.attributes.barycentric.updateRange.count = spec.barycentrics.length;
    geometry.attributes.id.updateRange.count = spec.ids.length;
    geometry.attributes.index.updateRange.count = spec.indices.length;
    geometry.attributes.skyLight.updateRange.count = spec.skyLights.length;
    geometry.attributes.torchLight.updateRange.count = spec.skyLights.length;
    renderer.geometries.update(geometry);
  };
  const currentCoord = new THREE.Vector3(NaN, NaN, NaN);
  const marchesTasks = [];
  const vegetationsTasks = [];
  let packagesRunning = false;
  mesh.updateSlab = (x, y, z) => {
    const j = numUpdatedCoords++;
    let coord = updatedCoords[j];
    if (!coord) {
      coord = new THREE.Vector3();
      coord.index = 0;
      updatedCoords[j] = coord;
    }
    coord.x = x;
    coord.y = y;
    coord.z = z;
    coord.index = planet.getSubparcelIndex(x, y, z);
  };
  let neededCoords = [];
  let lastNeededCoords = [];
  let neededCoordIndices = {};
  let lastNeededCoordIndices = {};
  const addedCoords = [];
  const removedCoords = [];
  const updatedCoords = [];
  let numUpdatedCoords = 0;
  let coordUpdated = false;
  const _updateCurrentCoord = position => {
    localVector3.copy(position)
      .applyMatrix4(localMatrix2.getInverse(mesh.matrixWorld));
    const ncx = Math.floor(localVector3.x/subparcelSize);
    const ncy = Math.floor(localVector3.y/subparcelSize);
    const ncz = Math.floor(localVector3.z/subparcelSize);

    if (currentCoord.x !== ncx || currentCoord.y !== ncy || currentCoord.z !== ncz) {
      currentCoord.set(ncx, ncy, ncz);
      coordUpdated = true;
    }
  };
  const _updateNeededCoords = () => {
    if (coordUpdated) {
      lastNeededCoords = neededCoords;
      lastNeededCoordIndices = neededCoordIndices;
      neededCoords = [];
      neededCoordIndices = {};

      let i = 0;
      for (let dx = -chunkDistance; dx <= chunkDistance; dx++) {
        const ax = dx + currentCoord.x;
        for (let dy = -chunkDistance; dy <= chunkDistance; dy++) {
          const ay = dy + currentCoord.y;
          for (let dz = -chunkDistance; dz <= chunkDistance; dz++) {
            const az = dz + currentCoord.z;

            const j = i++;
            let neededCoord = neededCoords[j];
            if (!neededCoord) {
              neededCoord = new THREE.Vector3();
              neededCoord.index = 0;
              neededCoords[j] = neededCoord;
            }
            neededCoord.x = ax;
            neededCoord.y = ay;
            neededCoord.z = az;
            const index = planet.getSubparcelIndex(ax, ay, az);
            neededCoord.index = index;
            neededCoordIndices[index] = true;

            if (!lastNeededCoordIndices[index]) {
              addedCoords.push(neededCoord);
            }
          }
        }
      }
      for (const lastNeededCoord of lastNeededCoords) {
        if (!neededCoordIndices[lastNeededCoord.index]) {
          removedCoords.push(lastNeededCoord);
        }
      }
    }
  };
  const _updateLastNeededCoords = () => {
    if (coordUpdated) {
      addedCoords.length = 0;
      removedCoords.length = 0;
      coordUpdated = false;
    }
    numUpdatedCoords = 0;
  };
  const _updateChunksRemove = () => {
    for (const removedCoord of removedCoords) {
      const {index} = removedCoord;
      const slab = slabs[index];
      if (slab) {
        const groupIndex = geometry.groups.findIndex(group => group.start === slab.slabIndex * slabSliceVertices);
        geometry.groups.splice(groupIndex, 1);
        slabs[index] = null;
        freeSlabs.push(slab);
        if (slab.physxGeometry) {
          physxWorker.unregisterGeometry(slab.physxGeometry);
          slab.physxGeometry = 0;
        }
      }

      const subparcelTasks = marchesTasks[index];
      if (subparcelTasks) {
        for (const task of subparcelTasks) {
          task.cancel();
        }
        subparcelTasks.length = 0;
      }
    }
  };
  const _ensureCoord = coord => {
    const {x: ax, y: ay, z: az, index} = coord;

    for (let dx = 0; dx <= 1; dx++) {
      const adx = ax + dx;
      for (let dy = 0; dy <= 1; dy++) {
        const ady = ay + dy;
        for (let dz = 0; dz <= 1; dz++) {
          const adz = az + dz;
          const subparcel = planet.getSubparcel(adx, ady, adz);

          if (!subparcel.load) {
            subparcel.load = chunkWorker.requestLoadPotentials(
              seedNum,
              meshId,
              adx,
              ady,
              adz,
              baseHeight,
              freqs,
              octaves,
              scales,
              uvs,
              amps,
              parcelSize,
              subparcelSize
            ).then(parcelSpec => {
               subparcel.potentials.set(parcelSpec.potentials);
               subparcel.heightfield.set(parcelSpec.heightfield);
               for (const object of parcelSpec.objects) {
                 subparcel.addVegetation('tree', localVector.fromArray(object.position), localQuaternion.fromArray(object.quaternion));
               }
            });
          }
        }
      }
    }
  };
  const _loadCoord = coord => {
    const {x: ax, y: ay, z: az, index} = coord;
    /* if (
      !slabs[index] ||
      subparcelsNeedUpdate.some(([x, y, z]) => x === ax && y === ay && z === az)
    ) { */
    let live = true;
    (async () => {
      const subparcel = planet.getSubparcelByIndex(index);
      await subparcel.load;
      if (!live) return;

      const specs = await chunkWorker.requestMarchLand(
        seedNum,
        meshId,
        ax, ay, az,
        subparcel.potentials,
        subparcel.heightfield,
        subparcel.lightfield,
        parcelSize,
        subparcelSize
      );
      if (!live) return;

      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const {x, y, z} = spec;
        const slab = mesh.getSlab(x, y, z);
        slab.position.set(spec.positions);
        slab.barycentric.set(spec.barycentrics);
        slab.id.set(spec.ids);
        slab.skyLights.set(spec.skyLights);
        slab.torchLights.set(spec.torchLights);
        const indexOffset = slab.slabIndex * slabSliceTris;
        for (let i = 0; i < spec.indices.length; i++) {
          spec.indices[i] += indexOffset;
        }
        slab.indices.set(spec.indices);

        mesh.updateGeometry(slab, spec);

        const group = geometry.groups.find(group => group.start === slab.slabIndex * slabSliceVertices);
        group.count = spec.positions.length/3;
      }
      const bakeSpecs = specs.filter(spec => spec.positions.length > 0).map(spec => {
        const {positions, x, y, z} = spec;
        return positions.length > 0 ? {
          positions,
          x,
          y,
          z,
        } : null;
      });
      if (bakeSpecs.length > 0) {
        const result = await physicsWorker.requestBakeGeometries(bakeSpecs.map(spec => {
          const {positions} = spec;
          return {
            positions,
          };
        }));
        for (let i = 0; i < result.physicsGeometryBuffers.length; i++) {
          const physxGeometry = result.physicsGeometryBuffers[i];
          const {x, y, z} = bakeSpecs[i];
          const slab = currentChunkMesh.getSlab(x, y, z);
          if (slab.physxGeometry) {
            physxWorker.unregisterGeometry(slab.physxGeometry);
            slab.physxGeometry = 0;
          }
          slab.physxGeometry = physxWorker.registerBakedGeometry(currentChunkMesh.meshId, physxGeometry, x, y, z);
        }
      }
    })()
      .finally(() => {
        if (live) {
          subparcelTasks.splice(subparcelTasks.indexOf(task), 1);
        }
      });
    const task = {
      cancel() {
        live = false;
      },
    };
    let subparcelTasks = marchesTasks[index];
    if (!subparcelTasks) {
      subparcelTasks = [];
      marchesTasks[index] = subparcelTasks;
    }
    subparcelTasks.push(task);
    // }
  };
  const _updateChunksAdd = () => {
    for (const addedCoord of addedCoords) {
      _ensureCoord(addedCoord);
    }
    for (const addedCoord of addedCoords) {
      _loadCoord(addedCoord);
    }
    for (let i = 0; i < numUpdatedCoords; i++) {
      _loadCoord(updatedCoords[i]);
    }
  };
  const _updateChunks = () => {
    _updateChunksRemove();
    _updateChunksAdd();
  };
  const _addItem = (position, quaternion) => {
    const itemMesh = (() => {
      const radius = 0.5;
      const segments = 12;
      const color = 0x66bb6a;
      const opacity = 0.5;

      const object = new THREE.Object3D();

      const matMeshes = [woodMesh, stoneMesh, metalMesh];
      const matIndex = Math.floor(Math.random()*matMeshes.length);
      const matMesh = matMeshes[matIndex];
      const matMeshClone = matMesh.clone();
      matMeshClone.position.y = 0.5;
      matMeshClone.visible = true;
      matMeshClone.isBuildMesh = true;
      object.add(matMeshClone);

      const skirtGeometry = new THREE.CylinderBufferGeometry(radius, radius, radius, segments, 1, true)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, radius/2, 0));
      const ys = new Float32Array(skirtGeometry.attributes.position.array.length/3);
      for (let i = 0; i < skirtGeometry.attributes.position.array.length/3; i++) {
        ys[i] = 1-skirtGeometry.attributes.position.array[i*3+1]/radius;
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
                const localFactor = factor/0.5;
                object.position.copy(startPosition)
                  .lerp(posePosition, cubicBezier(localFactor));
              } else if (factor < 1) {
                const localFactor = (factor-0.5)/0.5;
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
          skirtMaterial.uniforms.uAnimation.value = (now%60000)/60000;
          matMeshClone.rotation.y = (now%5000)/5000*Math.PI*2;
        } else {
          animation.update(posePosition);
        }
      };

      return object;
    })();
    itemMesh.position.copy(position);
    itemMesh.quaternion.copy(quaternion);
    mesh.add(itemMesh);
    itemMeshes.push(itemMesh);
  };
  const _makeHitTracker = (position, quaternion, hp, onPositionUpdate, onColorUpdate, onRemove) => {
    const originalPosition = position.clone();
    const originalQuaternion = quaternion.clone();
    let animation = null;
    return {
      hit(dmg) {
        if (animation) {
          animation.end();
          animation = null;
        }

        hp = Math.max(hp - dmg, 0);
        if (hp > 0) {
          const startTime = Date.now();
          const endTime = startTime + 500;
          animation = {
            update() {
              const now = Date.now();
              const factor = (now - startTime) / (endTime - startTime);
              if (factor < 1) {
                localVector2.set(-1+Math.random()*2, -1+Math.random()*2, -1+Math.random()*2).multiplyScalar((1-factor)*0.2/2)
                onPositionUpdate(originalPosition, localVector2);
              } else {
                animation.end();
                animation = null;
              }
            },
            end() {
              onPositionUpdate(originalPosition, localVector2.set(0, 0, 0));
              onColorUpdate(false);
            },
          };
          onColorUpdate(true);
        } else {
          _addItem(originalPosition, originalQuaternion);

          onRemove();
        }
      },
      update() {
        animation && animation.update();
      },
    };
  };
  const _addBuild = build => {
    const buildMesh = (() => {
      switch (build.name) {
        case 'wall': return wallMesh;
        case 'floor': return platformMesh;
        case 'stair': return stairsMesh;
        case 'trap': return spikesMesh;
        default: return null;
      }
    })();
    const meshId = getNextMeshId();
    localMatrix2.compose(
      localVector3.fromArray(build.position),
      localQuaternion3.fromArray(build.quaternion),
      localVector4.copy(buildMesh.scale)
    )
      // .premultiply(mesh.matrix)
      // .decompose(localVector2, localQuaternion2, localVector3);
    const buildMeshClone = buildMesh.instancedMesh.addInstance(meshId, localVector3, localQuaternion3, localVector4);
    buildMeshClone.build = build;
    buildMeshClone.meshId = meshId;
    buildMeshClone.buildMeshType = buildMesh.buildMeshType;
    const hitTracker = _makeHitTracker(buildMeshClone.position, buildMeshClone.quaternion, 100, (originalPosition, positionOffset) => {
      localVector3.copy(originalPosition).add(positionOffset);
      buildMeshClone.position.copy(localVector3);
      buildMeshClone.updatePosition();
    }, color => {
      buildMeshClone.color.setHex(color ? redColorHex : 0xFFFFFF);
      buildMeshClone.updateColor();
    }, () => {
      const subparcelPosition = new THREE.Vector3(
        Math.floor(buildMeshClone.position.x/subparcelSize),
        Math.floor(buildMeshClone.position.y/subparcelSize),
        Math.floor(buildMeshClone.position.z/subparcelSize)
      );
      planet.editSubparcel(subparcelPosition.x, subparcelPosition.y, subparcelPosition.z, subparcel => {
        subparcel.removeVegetation(buildMeshClone.build.id);
      });
      mesh.updateSlab(subparcelPosition.x, subparcelPosition.y, subparcelPosition.z);
    });
    buildMeshClone.hit = hitTracker.hit;
    buildMeshClone.update = hitTracker.update;
    currentChunkMesh.add(buildMesh.instancedMesh);

    const {physicsOffset} = buildMesh;
    localMatrix3
      .compose(physicsOffset.position, physicsOffset.quaternion, localVector4.set(1, 1, 1))
      .premultiply(localMatrix2)
      .decompose(localVector3, localQuaternion3, localVector4);
    buildMeshClone.physxGeometry = physxWorker.registerBoxGeometry(meshId, localVector3, localQuaternion3, physicsOffset.scale.x, physicsOffset.scale.y, physicsOffset.scale.z);

    return buildMeshClone;
  };
  const _removeBuildMesh = buildMeshClone => {
    buildMeshClone.remove();
    buildMeshClone.physxGeometry && physxWorker.unregisterGeometry(buildMeshClone.physxGeometry);
  };
  const _updateBuildsRemove = () => {
    for (const removedCoord of removedCoords) {
      const {index} = removedCoord;
      const subparcelBuildMeshesSpec = mesh.buildMeshes[index];
      for (const mesh of subparcelBuildMeshesSpec.meshes) {
        _removeBuildMesh(mesh);
      }
      mesh.buildMeshes[index] = null;
    }
  };
  const _updateBuildsAdd = () => {
    for (const addedCoord of addedCoords) {
      const {index} = addedCoord;
      const subparcelBuildMeshesSpec = {
        index,
        meshes: [],
      };
      mesh.buildMeshes[index] = subparcelBuildMeshesSpec;
      const subparcel = planet.getSubparcelByIndex(index);
      for (const build of subparcel.builds) {
        const buildMesh = _addBuild(build);
        subparcelBuildMeshesSpec.meshes.push(buildMesh);
      }
    }
  };
  const _updateBuildsUpdate = () => {
    for (let i = 0; i < numUpdatedCoords; i++) {
      const {index} = updatedCoords[i];
      const subparcelBuildMeshesSpec = mesh.buildMeshes[index];
      const subparcel = planet.getSubparcelByIndex(index);
      subparcelBuildMeshesSpec.meshes = subparcelBuildMeshesSpec.meshes.filter(bm => {
        if (!subparcel.builds.some(b => b.id === bm.build.id)) {
          _removeBuildMesh(bm);
          return true;
        } else {
          return false;
        }
      });
      for (const build of subparcel.builds) {
        if (!subparcelBuildMeshesSpec.meshes.some(bm => bm.build.id === build.id)) {
          const buildMesh = _addBuild(build);
          subparcelBuildMeshesSpec.meshes.push(buildMesh);
        }
      }
    }
  };
  const _updateBuildsNeeded = () => {
    for (const neededCoord of neededCoords) {
      const {index} = neededCoord;
      const subparcelBuildMeshesSpec = mesh.buildMeshes[index];
      for (const mesh of subparcelBuildMeshesSpec.meshes) {
        mesh.update();
      }
    }
  };
  const _updateBuilds = () => {
    _updateBuildsRemove();
    _updateBuildsAdd();
    _updateBuildsUpdate();
    _updateBuildsNeeded();
  };
  const _removeVegetationPhysics = index => {
    const subparcelVegetationMeshesSpec = mesh.vegetationMeshes[index];
    if (subparcelVegetationMeshesSpec) {
      for (const mesh of subparcelVegetationMeshesSpec.meshes) {
        if (mesh.physxGeometry) {
          physxWorker.unregisterGeometry(mesh.physxGeometry);
          mesh.physxGeometry = 0;
        }
      }
    }
  };
  const _killVegetationsTasks = index => {
    const subparcelTasks = vegetationsTasks[index];
    if (subparcelTasks) {
      for (const task of subparcelTasks) {
        task.cancel();
      }
      subparcelTasks.length = 0;
    }
  };
  const _updateVegetationsRemove = () => {
    for (const removedCoord of removedCoords) {
      const {index} = removedCoord;
      currentVegetationMesh.freeSlabIndex(index);
      currentVegetationTransparentMesh.freeSlabIndex(index);

      _removeVegetationPhysics(index);
      _killVegetationsTasks(index);
    }
  };
  const _refreshVegetationMesh = (x, y, z, index, refresh) => {
    let subparcelTasks = vegetationsTasks[index];
    if (!subparcelTasks) {
      subparcelTasks = [];
      vegetationsTasks[index] = subparcelTasks;
    }

    if (refresh) {
      _killVegetationsTasks(index);
    }

    let live = true;
    (async () => {
      const subparcel = planet.getSubparcelByIndex(index);
      await subparcel.load;
      if (!live) return;

      const objects = subparcel.vegetations.map(vegetation => ({
        id: vegetation.id,
        type: vegetation.name,
        matrix: localMatrix.compose(localVector.fromArray(vegetation.position), localQuaternion.fromArray(vegetation.quaternion), localVector2.set(1, 1, 1)).toArray(),
      }));

      const subparcelSizeP1 = subparcelSize+1;
      const arraybuffer = new ArrayBuffer(subparcelSizeP1*subparcelSizeP1*subparcelSizeP1*(3**3)*2);
      let arrayBufferIndex = 0;
      const heightfields = new Uint8Array(arraybuffer, arrayBufferIndex, subparcelSizeP1*subparcelSizeP1*subparcelSizeP1*(3**3));
      {
        let heightfieldIndex = 0;
        for (let dz = -1; dz <= 1; dz++) {
          const az = z + dz;
          for (let dy = -1; dy <= 1; dy++) {
            const ay = y + dy;
            for (let dx = -1; dx <= 1; dx++) {
              const ax = x + dx;
              const subparcel = planet.peekSubparcel(ax, ay, az);
              if (subparcel) {
                heightfields.set(subparcel.heightfield, heightfieldIndex*subparcelSizeP1*subparcelSizeP1*subparcelSizeP1);
              }
              heightfieldIndex++;
            }
          }
        }
      }
      arrayBufferIndex += subparcelSizeP1*subparcelSizeP1*subparcelSizeP1*(3**3);
      const lightfields = new Uint8Array(arraybuffer, arrayBufferIndex, subparcelSizeP1*subparcelSizeP1*subparcelSizeP1*(3**3));
      {
        let ligthfieldIndex = 0;
        for (let dz = -1; dz <= 1; dz++) {
          const az = z + dz;
          for (let dy = -1; dy <= 1; dy++) {
            const ay = y + dy;
            for (let dx = -1; dx <= 1; dx++) {
              const ax = x + dx;
              const subparcel = planet.peekSubparcel(ax, ay, az);
              if (subparcel) {
                lightfields.set(subparcel.lightfield, ligthfieldIndex*subparcelSizeP1*subparcelSizeP1*subparcelSizeP1);
              }
              ligthfieldIndex++;
            }
          }
        }
      }
      arrayBufferIndex += subparcelSizeP1*subparcelSizeP1*subparcelSizeP1*(3**3);

      const specs = await geometryWorker.requestMarchObjects(x, y, z, objects, heightfields, lightfields, subparcelSize);
      if (live) {
        const [spec] = specs;
        const {opaque, transparent} = spec;

        const slab = currentVegetationMesh.getSlab(x, y, z, opaque.positions.length, opaque.uvs.length, opaque.ids.length, opaque.skyLights.length, opaque.torchLights.length, opaque.indices.length);
        const transparentSlab = currentVegetationTransparentMesh.getSlab(x, y, z, transparent.positions.length, transparent.uvs.length, transparent.ids.length, transparent.skyLights.length, transparent.torchLights.length, transparent.indices.length);

        slab.position.set(opaque.positions);
        slab.uv.set(opaque.uvs);
        slab.id.set(opaque.ids);
        slab.skyLight.set(opaque.skyLights);
        slab.torchLight.set(opaque.torchLights);
        const opaqueIndexOffset = currentVegetationMesh.getSlabPositionOffset(slab)/3;
        for (let i = 0; i < opaque.indices.length; i++) {
          opaque.indices[i] += opaqueIndexOffset;
        }
        slab.indices.set(opaque.indices);
        currentVegetationMesh.updateGeometry(slab, opaque);
        slab.group.count = opaque.indices.length;

        transparentSlab.position.set(transparent.positions);
        transparentSlab.uv.set(transparent.uvs);
        transparentSlab.id.set(transparent.ids);
        transparentSlab.skyLight.set(transparent.skyLights);
        transparentSlab.torchLight.set(transparent.torchLights);
        const transparentIndexOffset = currentVegetationTransparentMesh.getSlabPositionOffset(transparentSlab)/3;
        for (let i = 0; i < transparent.indices.length; i++) {
          transparent.indices[i] += transparentIndexOffset;
        }
        transparentSlab.indices.set(transparent.indices);
        currentVegetationTransparentMesh.updateGeometry(transparentSlab, transparent);
        transparentSlab.group.count = transparent.indices.length;

        let subparcelVegetationMeshesSpec = mesh.vegetationMeshes[index];
        if (!subparcelVegetationMeshesSpec) {
          subparcelVegetationMeshesSpec = {
            index,
            meshes: [],
          };
          mesh.vegetationMeshes[index] = subparcelVegetationMeshesSpec;
        }
        if (refresh) {
          _removeVegetationPhysics(index);
        }
        subparcelVegetationMeshesSpec.meshes.length = 0;

        for (const vegetation of subparcel.vegetations) {
          const {id: vegetationId, name: vegetationName} = vegetation;
          const vegetationPosition = new THREE.Vector3().fromArray(vegetation.position);
          const vegetationQuaternion = new THREE.Quaternion().fromArray(vegetation.quaternion);

          const physicsOffset = physicsShapes[vegetationName];
          const physxGeometry = physicsOffset ? (() => {
            localMatrix2
              .compose(physicsOffset.position, physicsOffset.quaternion, localVector4.set(1, 1, 1))
              .premultiply(localMatrix3.compose(vegetationPosition, vegetationQuaternion, localVector4.set(1, 1, 1)))
              .decompose(localVector4, localQuaternion3, localVector5);
            return physxWorker.registerBoxGeometry(vegetationId, localVector4, localQuaternion3, physicsOffset.scale.x, physicsOffset.scale.y, physicsOffset.scale.z);
          })() : (() => {
            localVector4.copy(vegetationPosition)
              .add(localVector5.set(0, (2+0.5)/2, 0));
            localQuaternion3.copy(vegetationQuaternion)
              .multiply(capsuleUpQuaternion);
            return physxWorker.registerCapsuleGeometry(vegetationId, localVector4, localQuaternion3, 0.5, 2);
          })();
          const hitTracker = _makeHitTracker(vegetationPosition, vegetationQuaternion, 100, (originalPosition, positionOffset) => {
            [currentVegetationMesh, currentVegetationTransparentMesh].forEach(m => {
              m.material[0].uniforms.uSelectPosition.value.copy(positionOffset);
              m.material[0].uniforms.uSelectPosition.needsUpdate = true;
            });
          }, color => {
            const id = color ? vegetationId : -1;
            [currentVegetationMesh, currentVegetationTransparentMesh].forEach(m => {
              m.material[0].uniforms.uSelectId.value = id;
              m.material[0].uniforms.uSelectId.needsUpdate = true;
            });
          }, () => {
            const subparcelPosition = new THREE.Vector3(
              Math.floor(vegetationPosition.x/subparcelSize),
              Math.floor(vegetationPosition.y/subparcelSize),
              Math.floor(vegetationPosition.z/subparcelSize)
            );
            planet.editSubparcel(subparcelPosition.x, subparcelPosition.y, subparcelPosition.z, subparcel => {
              subparcel.removeVegetation(vegetationId);
            });
            mesh.updateSlab(subparcelPosition.x, subparcelPosition.y, subparcelPosition.z);
          });
          subparcelVegetationMeshesSpec.meshes.push({
            isVegetationMesh: true,
            meshId: vegetationId,
            type: vegetationName,
            position: vegetationPosition,
            quaternion: vegetationQuaternion,
            physxGeometry,
            hit: hitTracker.hit,
            update: hitTracker.update,
          });
        }
      }
    })()
      .finally(() => {
        if (live) {
          subparcelTasks.splice(subparcelTasks.indexOf(task), 1);
        }
      });
    const task = {
      cancel() {
        live = false;
      },
    };
    subparcelTasks.push(task);
  };
  const _updateVegetationsAdd = () => {
    for (const addedCoord of addedCoords) {
      const {x, y, z, index} = addedCoord;
      _refreshVegetationMesh(x, y, z, index, false);
    }
  };
  const _updateVegetationsUpdate = () => {
    for (let i = 0; i < numUpdatedCoords; i++) {
      const {x, y, z, index} = updatedCoords[i];
      _refreshVegetationMesh(x, y, z, index, true);
    }
  };
  const _updateVegetationsNeeded = () => {
    for (const neededCoord of neededCoords) {
      const {index} = neededCoord;
      const subparcelVegetationMeshesSpec = mesh.vegetationMeshes[index];
      if (subparcelVegetationMeshesSpec) {
        for (const mesh of subparcelVegetationMeshesSpec.meshes) {
          mesh.update();
        }
      }
    }
  };
  const _updateVegetations = () => {
    _updateVegetationsRemove();
    _updateVegetationsAdd();
    _updateVegetationsUpdate();
    _updateVegetationsNeeded();
  };
  const _updatePackages = () => {
    const packagesNeedUpdate = false;
    if (packagesNeedUpdate) {
      if (!packagesRunning) {
        (async () => {
          packagesRunning = true;
          packagesNeedUpdate = false;

          for (let i = 0; i < neededCoords.length; i++) {
            const neededCoord = neededCoords[i];
            const {index} = neededCoord;
            const subparcel = planet.getSubparcelByIndex(index);
            for (const pkg of subparcel.packages) {
              if (!mesh.objects.some(object => object.package === pkg)) {
                const p = await XRPackage.download(pkg.dataHash);
                p.setMatrix(
                  new THREE.Matrix4().compose(
                    new THREE.Vector3().fromArray(pkg.position),
                    new THREE.Quaternion().fromArray(pkg.quaternion),
                    new THREE.Vector3(1, 1, 1)
                  ).premultiply(mesh.matrixWorld)
                );
                await pe.add(p);
                p.package = pkg;
                mesh.objects.push(p);
              }
            }
          }
          mesh.objects.slice().forEach(p => {
            const sx = Math.floor(p.package.position[0]/subparcelSize);
            const sy = Math.floor(p.package.position[1]/subparcelSize);
            const sz = Math.floor(p.package.position[2]/subparcelSize);
            const index = planet.getSubparcelIndex(sx, sy, sz);
            if (!neededCoordIndices[index]) {
              pe.remove(p);
              mesh.objects.splice(mesh.objects.indexOf(p), 1);
            } else {
              const subparcel = planet.getSubparcel(sx, sy, sz);
              if (!subparcel.packages.includes(p.package)) {
                pe.remove(p);
                mesh.objects.splice(mesh.objects.indexOf(p), 1);
              }
            }
          });

          packagesRunning = false;
        })();
      }
    }
  };
  mesh.update = position => {
    _updateCurrentCoord(position);
    _updateNeededCoords();
    _updateChunks();
    // _updateBuilds();
    _updateVegetations();
    _updatePackages();
    _updateLastNeededCoords();
  };
  return mesh;
};

planet.addEventListener('load', async e => {
  const {data: chunkSpec} = e;

  const chunkMesh = _makeChunkMesh(chunkSpec.seedString, chunkSpec.parcelSize, chunkSpec.subparcelSize);
  chunkMesh.position.copy(chunkOffset);
  chunkMeshContainer.add(chunkMesh);
  chunkMeshes.push(chunkMesh);
  _setCurrentChunkMesh(chunkMesh);

  chunkMesh.updateMatrixWorld();

  const p = new THREE.Vector3().applyMatrix4(new THREE.Matrix4().getInverse(chunkMesh.matrixWorld));
  const ncx = Math.floor(p.x/SUBPARCEL_SIZE);
  const ncy = Math.floor(p.y/SUBPARCEL_SIZE);
  const ncz = Math.floor(p.z/SUBPARCEL_SIZE);

  const height = await chunkWorker.requestGetHeight(chunkMesh.seedNum, ncx, ncy + SUBPARCEL_SIZE, ncz, baseHeight, freqs, octaves, scales, uvs, amps, PARCEL_SIZE);
  worldContainer.position.y = PARCEL_SIZE/2 - height;

  /* {
    let geometry = new CapsuleGeometry(0.5, 1, 16)
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2)))
      // .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5/2+0.5, 0))
      // .toNonIndexed();
    geometry = new THREE.BufferGeometry().fromGeometry(geometry);
    const material = new THREE.MeshBasicMaterial({
      color: 0x008000,
    });
    capsuleMesh = new THREE.Mesh(geometry, material);
    scene.add(capsuleMesh);
  } */
});
planet.addEventListener('unload', () => {
  const oldChunkMesh = _getCurrentChunkMesh();
  if (oldChunkMesh) {
    chunkMeshContainer.remove(oldChunkMesh);
    chunkMeshes.splice(chunkMeshes.indexOf(oldChunkMesh), 1);
    _setCurrentChunkMesh(null);
  }
});
planet.addEventListener('subparcelupdate', e => {
  const {data: subparcel} = e;
  currentChunkMesh.updateSlab(subparcel.x, subparcel.y, subparcel.z);
});
planet.connect('lol', {
  online: false,
}).then(() => {
  new Bot();
});

const RESOURCES = ['wood', 'stone', 'metal'];
RESOURCES.forEach(resource => {
  /* const resourceEl = document.getElementById(resource);
  const countEl = resourceEl.querySelector('.count');
  countEl.innerText = player.getCount(resource); */
});
player.addEventListener('inventorychange', async e => {
  const {data: {type, count}} = e;
  /* const resourceEl = document.getElementById(resource);
  const countEl = resourceEl.querySelector('.count');
  countEl.innerText = count; */
});

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

/* {
  const npcMesh = await _loadGltf('./npc.vrm');
  npcMesh.position.y = -3;
  npcMesh.position.z = -3;
  npcMesh.traverse(o => {
    if (o.isMesh) {
      o.isBuildMesh = true;
    }
  });
  let animation = null;
  npcMesh.hit = () => {
    if (animation) {
      animation.end();
      animation = null;
    }
    const startTime = Date.now();
    const endTime = startTime + 300;
    const originalPosition = npcMesh.position.clone();
    animation = {
      update() {
        const now = Date.now();
        const factor = (now - startTime) / (endTime - startTime);
        if (factor < 1) {
          npcMesh.position.copy(originalPosition)
            .add(localVector2.set(-1+Math.random()*2, -1+Math.random()*2, -1+Math.random()*2).multiplyScalar((1-factor)*0.2/2));
        } else {
          animation.end();
          animation = null;
        }
      },
      end() {
        npcMesh.position.copy(originalPosition);
        npcMesh.traverse(o => {
          if (o.isMesh) {
            o.material.color.setHex(0xFFFFFF);
          }
        });
      },
    };
    npcMesh.traverse(o => {
      if (o.isMesh) {
        o.material.color.setHex(0xef5350);
      }
    });
  };
  npcMesh.update = () => {
    animation && animation.update();
  };
  npcMesh.updateMatrixWorld();
  npcMesh.matrix.premultiply(localMatrix2.getInverse(currentChunkMesh.matrixWorld))
    .decompose(npcMesh.position, npcMesh.quaternion, npcMesh.scale);
  currentChunkMesh.add(npcMesh);
  npcMeshes.push(npcMesh);

  let geometry = new CapsuleGeometry(0.5, 0.5, 16)
    .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2)))
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5/2+0.5, 0))
    // .toNonIndexed();
  geometry = new THREE.BufferGeometry().fromGeometry(geometry);
  const material = new THREE.MeshBasicMaterial({
    color: 0x008000,
  });
  const capsuleMesh = new THREE.Mesh(geometry, material);
  capsuleMesh.position.copy(npcMesh.position);
  _decorateMeshForRaycast(capsuleMesh);
  capsuleMesh.isNpcHullMesh = true;
  capsuleMesh.npcMesh = npcMesh;
  capsuleMesh.position.copy(npcMesh.position);
  capsuleMesh.quaternion.copy(npcMesh.quaternion);
  capsuleMesh.scale.copy(npcMesh.scale);
  capsuleMesh.visible = false;
  currentChunkMesh.add(capsuleMesh);
} */

})();

// let wrenchMesh = null;
let plansMesh = null;
let pencilMesh = null;
let pickaxeMesh = null;
let paintBrushMesh = null;
(async () => {
  const toolsModels = await _loadGltf('./tools.glb');
  /* wrenchMesh = toolsModels.children.find(c => c.name === 'SM_Tool_Pipe_Wrench_01');
  wrenchMesh.visible = false;
  scene.add(wrenchMesh); */
  plansMesh = toolsModels.children.find(c => c.name === 'SM_Prop_Plans_01');
  plansMesh.visible = false;
  scene.add(plansMesh);
  pencilMesh = toolsModels.children.find(c => c.name === 'SM_Item_Pencil_02');
  pencilMesh.visible = false;
  scene.add(pencilMesh);
  pickaxeMesh = toolsModels.children.find(c => c.name === 'SM_Wep_Pickaxe_01');
  pickaxeMesh.visible = false;
  scene.add(pickaxeMesh);
  paintBrushMesh = toolsModels.children.find(c => c.name === 'SM_Tool_Paint_Brush_02');
  paintBrushMesh.visible = false;
  scene.add(paintBrushMesh);
})();
let buildMode = null;
let assaultRifleMesh = null;
let smgMesh = null;
let grenadeMesh = null;
let crosshairMesh = null;
(async () => {
  const weaponsModels = await _loadGltf('./weapons.glb');

  assaultRifleMesh = weaponsModels.children.find(c => c.name === 'SM_Wep_Rifle_Assault_01');
  assaultRifleMesh.visible = false;
  scene.add(assaultRifleMesh);

  smgMesh = weaponsModels.children.find(c => c.name === 'SM_Wep_SubMGun_Lite_01');
  smgMesh.visible = false;
  scene.add(smgMesh);

  grenadeMesh = weaponsModels.children.find(c => c.name === 'SM_Wep_Grenade_01');
  grenadeMesh.visible = false;
  scene.add(grenadeMesh);

  crosshairMesh = weaponsModels.children.find(c => c.name === 'SM_Wep_Crosshair_04');
  crosshairMesh.scale.set(50, 50, 50);
  crosshairMesh.traverse(o => {
    if (o.isMesh) {
      o.material = new THREE.MeshBasicMaterial({
        color: 0x111111,
        depthTest: false,
        transparent: true,
      });
    }
  });
  crosshairMesh.visible = false;
  let animation = null;
  crosshairMesh.trigger = () => {
    if (animation) {
      animation.end();
      animation = null;
    }
    const startTime = Date.now();
    const endTime = startTime + 300;
    const originalScale = crosshairMesh.scale.clone();
    animation = {
      update() {
        const now = Date.now();
        const factor = (now - startTime) / (endTime - startTime);
        if (factor < 1) {
          crosshairMesh.scale.copy(originalScale)
            .multiplyScalar(1 + (1-factor));
        } else {
          animation.end();
          animation = null;
        }
      },
      end() {
        crosshairMesh.scale.copy(originalScale);
      },
    };
  };
  crosshairMesh.update = () => {
    animation && animation.update();
  };
  scene.add(crosshairMesh);
})();

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

const addMesh = (() => {
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
  ]);
  const material = new THREE.MeshBasicMaterial({
    color: 0x0000FF,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
})();
addMesh.visible = false;
scene.add(addMesh);

const removeMesh = (() => {
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
  ]);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFF0000,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
})();
removeMesh.visible = false;
scene.add(removeMesh);

const _findMeshWithMeshId = meshId => {
  if (meshId === currentChunkMesh.meshId) {
    return currentChunkMesh;
  } else {
    for (const index in currentChunkMesh.vegetationMeshes) {
      const subparcelVegetationMeshesSpec = currentChunkMesh.vegetationMeshes[index];
      if (subparcelVegetationMeshesSpec) {
        for (const vegetationMesh of subparcelVegetationMeshesSpec.meshes) {
          if (vegetationMesh.meshId === meshId) {
            return vegetationMesh;
          }
        }
      }
    }
    return null;
  }
};

const jointGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01);
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
}
/* const sideCollisionCubeMaterial = new THREE.MeshBasicMaterial({
  color: 0xFF0000,
});
const floorCollisionCubeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00FF00,
});
const ceilingCollisionCubeMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000FF,
});
const sideCollisionCubes = (() => {
  const result = Array(10*10);
  for (let i = 0; i < 10*10; i++) {
    const mesh = new THREE.Mesh(collisionCubeGeometry, sideCollisionCubeMaterial);
    mesh.frustumCulled = false;
    mesh.visible = false;
    result[i] = mesh;
  }
  return result;
})();
for (let i = 0; i < sideCollisionCubes.length; i++) {
  scene.add(sideCollisionCubes[i]);
}
const floorCollisionCubes = (() => {
  const result = Array(10*10);
  for (let i = 0; i < 10*10; i++) {
    const mesh = new THREE.Mesh(collisionCubeGeometry, floorCollisionCubeMaterial);
    mesh.frustumCulled = false;
    mesh.visible = false;
    result[i] = mesh;
  }
  return result;
})();
for (let i = 0; i < floorCollisionCubes.length; i++) {
  scene.add(floorCollisionCubes[i]);
}
const ceilingCollisionCubes = (() => {
  const result = Array(10*10);
  for (let i = 0; i < 10*10; i++) {
    const mesh = new THREE.Mesh(collisionCubeGeometry, ceilingCollisionCubeMaterial);
    mesh.frustumCulled = false;
    mesh.visible = false;
    result[i] = mesh;
  }
  return result;
})();
for (let i = 0; i < ceilingCollisionCubes.length; i++) {
  scene.add(ceilingCollisionCubes[i]);
} */

function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

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
  ]);// .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
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
const _makeTargetMesh = p => {
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
const _makeVolumeMesh = async p => {
  const volumeMesh = await p.getVolumeMesh();
  if (volumeMesh) {
    volumeMesh.frustumCulled = false;
    return volumeMesh;
  } else {
    return new THREE.Object3D();
  }
};

const lineMeshes = [
  makeLineMesh(),
  makeLineMesh(),
];
lineMeshes.forEach(lineMesh => {
  scene.add(lineMesh);
});
const teleportMeshes = lineMeshes.map((lineMesh, i) => makeTeleportMesh(lineMesh, i));
teleportMeshes.forEach(teleportMesh => {
  scene.add(teleportMesh);
});

const tetrehedronGeometry = (() => {
  const geometry = new THREE.TetrahedronBufferGeometry(0.2, 0);
  const barycentrics = new Float32Array(geometry.attributes.position.array.length);
  let barycentricIndex = 0;
  for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
    geometry.attributes.position.array
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

const cometFireMesh = (() => {
  const radius = 1;
  const opacity = 0.5;
  const _makeSphereGeometry = (radius, color, position, scale) => {
    const geometry = new THREE.SphereBufferGeometry(radius, 8, 5);
    for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
      if (geometry.attributes.position.array[i+1] > 0) {
        geometry.attributes.position.array[i] = Math.sign(geometry.attributes.position.array[i]);
        geometry.attributes.position.array[i+2] = Math.sign(geometry.attributes.position.array[i+2]);
      }
    }

    geometry
      .applyMatrix4(new THREE.Matrix4().makeTranslation(position.x, position.y, position.z))
      .applyMatrix4(new THREE.Matrix4().makeScale(scale.x, scale.y, scale.z))

    const c = new THREE.Color(color);
    const colors = new Float32Array(geometry.attributes.position.array.length);
    for (let i = 0; i < colors.length; i += 3) {
      c.toArray(colors, i);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  };
  const cometFireGeometry = BufferGeometryUtils.mergeBufferGeometries([
    _makeSphereGeometry(radius, 0x5c6bc0, new THREE.Vector3(0, 0.9, 0), new THREE.Vector3(0.8, 10, 0.8)),
    _makeSphereGeometry(radius, 0xef5350, new THREE.Vector3(0, 0.7, 0), new THREE.Vector3(2, 5, 2)),
    _makeSphereGeometry(radius, 0xffa726, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)),
  ]);
  const cometFireMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uAnimation: {
        type: 'f',
        value: 0,
      },
    },
    vertexShader: `\
      #define PI 3.1415926535897932384626433832795

      uniform float uAnimation;
      attribute vec3 color;
      attribute float y;
      attribute vec3 barycentric;
      // varying float vY;
      varying vec2 vUv;
      // varying float vOpacity;
      varying vec3 vColor;
      void main() {
        // vY = y * ${opacity.toFixed(8)};
        // vUv = uv.x + uAnimation;
        vUv = uv;
        // vOpacity = 0.8 + 0.2 * (sin(uAnimation*5.0*PI*2.0)+1.0)/2.0;
        // vOpacity *= 1.0-(uv.y/0.5);
        // vOpacity = (0.5 + 0.5 * (sin(uv.x*PI*2.0/0.05) + 1.0)/2.0) * (0.3 + 1.0-uv.y/0.5);
        /* vec3 p = position;
        if (p.y > 0.0) {
          p.x = sign(p.x) * 1.0;
          p.z = sign(p.z) * 1.0;
        } */
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vColor = color;
      }
    `,
    fragmentShader: `\
      #define PI 3.1415926535897932384626433832795

      uniform float uAnimation;
      uniform sampler2D uCameraTex;
      // varying float vY;
      varying vec2 vUv;
      // varying float vOpacity;
      varying vec3 vColor;

      void main() {
        vec3 c2 = vColor * (2.0-vUv.y/0.5);
        float a = 0.2 + (0.5 + 0.5 * pow((sin((vUv.x + uAnimation) *PI*2.0/0.1) + 1.0)/2.0, 2.0)) * (1.0-vUv.y/0.5);
        gl_FragColor = vec4(c2, a);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
  });
  const cometFireMesh = new THREE.Mesh(cometFireGeometry, cometFireMaterial);
  cometFireMesh.position.y = 1;
  cometFireMesh.frustumCulled = false;
  return cometFireMesh;
})();
scene.add(cometFireMesh);

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
            .add(localVector2.set(-1+Math.random()*2, -1+Math.random()*2, -1+Math.random()*2).multiplyScalar((1-factor)*0.02));
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
    new THREE.PlaneBufferGeometry(0.02, 0.04).applyMatrix4(new THREE.Matrix4().makeTranslation(-1/2, 0, 0)),
    new THREE.PlaneBufferGeometry(0.02, 0.04).applyMatrix4(new THREE.Matrix4().makeTranslation(1/2, 0, 0)),
  ]);
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
  });
  const frameMesh = new THREE.Mesh(geometry, material);
  frameMesh.frustumCulled = false;
  mesh.add(frameMesh);

  const geometry2 = new THREE.PlaneBufferGeometry(1, 0.02).applyMatrix4(new THREE.Matrix4().makeTranslation(1/2, 0, 0))
  const material2 = new THREE.MeshBasicMaterial({
    color: 0x81c784,
  });
  const barMesh = new THREE.Mesh(geometry2, material2);
  barMesh.position.x = -1/2;
  barMesh.position.z = -0.001;
  const _getBar = () => hp/100;
  barMesh.scale.x = _getBar();
  barMesh.frustumCulled = false;
  frameMesh.add(barMesh);

  const _getText = () => `HP ${hp}/100`;
  const textMesh = makeTextMesh(_getText(), './Bangers-Regular.ttf', 0.05, 'left', 'bottom');
  textMesh.position.x = -1/2;
  textMesh.position.y = 0.05;
  mesh.add(textMesh);

  return mesh;
})();
scene.add(hpMesh);

const uiMesh = makeUiFullMesh();
scene.add(uiMesh);

const numSmokes = 10;
const numZs = 10;
const explosionCubeGeometry = new THREE.BoxBufferGeometry(0.04, 0.04, 0.04);
let raycastRunning = false;
let wallCollisionResult = null;
let floorCollisionResult = null;
let ceilingCollisionResult = null;
const _makeExplosionMesh = () => {
  const numPositions = explosionCubeGeometry.attributes.position.array.length * numSmokes * numZs;
  const numIndices = explosionCubeGeometry.index.array.length * numSmokes * numZs;
  const arrayBuffer = new ArrayBuffer(
    numPositions * Float32Array.BYTES_PER_ELEMENT + // position
    numPositions/3 * Float32Array.BYTES_PER_ELEMENT + // z
    numPositions/3 * Float32Array.BYTES_PER_ELEMENT + // maxZ
    numPositions/3*4 * Float32Array.BYTES_PER_ELEMENT + // q
    numPositions/3*4 * Float32Array.BYTES_PER_ELEMENT + // phase
    numPositions/3 * Float32Array.BYTES_PER_ELEMENT + // scale
    numIndices * Int16Array.BYTES_PER_ELEMENT // index
  );
  let index = 0;
  const positions = new Float32Array(arrayBuffer, index, numPositions);
  index += numPositions*Float32Array.BYTES_PER_ELEMENT;
  const zs = new Float32Array(arrayBuffer, index, numPositions/3);
  index += numPositions/3*Float32Array.BYTES_PER_ELEMENT;
  const maxZs = new Float32Array(arrayBuffer, index, numPositions/3);
  index += numPositions/3*Float32Array.BYTES_PER_ELEMENT;
  const qs = new Float32Array(arrayBuffer, index, numPositions/3*4);
  index += numPositions/3*4*Float32Array.BYTES_PER_ELEMENT;
  const phases = new Float32Array(arrayBuffer, index, numPositions/3*4);
  index += numPositions/3*4*Float32Array.BYTES_PER_ELEMENT;
  const scales = new Float32Array(arrayBuffer, index, numPositions/3);
  index += numPositions/3*Float32Array.BYTES_PER_ELEMENT;
  const indices = new Uint16Array(arrayBuffer, index, numIndices);
  index += numIndices*Uint16Array.BYTES_PER_ELEMENT;

  const numPositionsPerSmoke = numPositions/numSmokes;
  const numPositionsPerZ = numPositionsPerSmoke/numZs;
  const numIndicesPerSmoke = numIndices/numSmokes;
  const numIndicesPerZ = numIndicesPerSmoke/numZs;

  for (let i = 0; i < numSmokes; i++) {
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler((-1+Math.random()*2)*Math.PI*2*0.05, (-1+Math.random()*2)*Math.PI*2*0.05, (-1+Math.random()*2)*Math.PI*2*0.05, 'YXZ')
    );
    for (let j = 0; j < numPositionsPerSmoke/3*4; j += 4) {
      q.toArray(qs, i*numPositionsPerSmoke/3*4 + j);
    }
    const maxZ = Math.random();
    for (let j = 0; j < numZs; j++) {
      positions.set(explosionCubeGeometry.attributes.position.array, i*numPositionsPerSmoke + j*numPositionsPerZ);
      const indexOffset = i*numPositionsPerSmoke/3 + j*numPositionsPerZ/3;
      for (let k = 0; k < numIndicesPerZ; k++) {
        indices[i*numIndicesPerSmoke + j*numIndicesPerZ + k] = explosionCubeGeometry.index.array[k] + indexOffset;
      }

      const z = j/numZs;
      for (let k = 0; k < numPositionsPerZ/3; k++) {
        zs[i*numPositionsPerSmoke/3 + j*numPositionsPerZ/3 + k] = z;
      }
      for (let k = 0; k < numPositionsPerZ/3; k++) {
        maxZs[i*numPositionsPerSmoke/3 + j*numPositionsPerZ/3 + k] = maxZ;
      }
      const phase = new THREE.Vector4(Math.random()*Math.PI*2, Math.random()*Math.PI*2, 0.1+Math.random()*0.2, 0.1+Math.random()*0.2);
      for (let k = 0; k < numPositionsPerZ/3*4; k += 4) {
        phase.toArray(phases, i*numPositionsPerSmoke/3*4 + j*numPositionsPerZ/3*4 + k);
      }
      const scale = 0.9 + Math.random()*0.2;
      for (let k = 0; k < numPositionsPerZ/3; k++) {
        scales[i*numPositionsPerSmoke/3*4 + j*numPositionsPerZ/3*4 + k] = scale;
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

const _applyAvatarPhysics = (avatarOffset, cameraBasedOffset, velocityAvatarDirection, updateRig, timeDiff) => {
  const oldVelocity = localVector3.copy(velocity);

  _applyVelocity(pe.camera.position, velocity, timeDiff);
  pe.camera.updateMatrixWorld();
  pe.camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  if (avatarOffset) {
    localVector4.copy(avatarOffset);
  } else {
    localVector4.set(0, 0, 0);
  }
  if (cameraBasedOffset) {
    localVector4.applyQuaternion(localQuaternion)
  }
  localVector.add(localVector4);
  const collision = _collideCapsule(localVector, localQuaternion2.set(0, 0, 0, 1));
  if (velocityAvatarDirection && oldVelocity.lengthSq() > 0) {
    localQuaternion.setFromUnitVectors(localVector4.set(0, 0, -1), localVector5.set(oldVelocity.x, 0, oldVelocity.z).normalize());
  }

  if (collision) {
    localVector4.fromArray(collision.direction);
    pe.camera.position.add(localVector4);
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

  pe.setRigMatrix(updateRig ? localMatrix : null);

  if (pe.rig) {
    if (jumpState) {
      pe.rig.setFloorHeight(-0xFFFFFF);
    } else {
      pe.rig.setFloorHeight(localVector.y - _getAvatarHeight());
    }
  }

  _collideItems(localMatrix);
  _collideChunk(localMatrix);
};
const _collideCapsule = (() => {
  const localVector = new THREE.Vector3();
  return (p, q) => {
    localVector.copy(p);
    localVector.y -= 0.3;
    return physxWorker ? physxWorker.collide(0.5, 0.5, localVector, q, 1) : null;
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

  uiMesh.position.copy(localVector3).add(localVector5.set(-0.3, -0.1, -0.5).applyQuaternion(localQuaternion2));
  uiMesh.quaternion.copy(localQuaternion2);

  localVector4.copy(localVector3).add(localVector5.set(0, -1, 0));
  for (let i = 0; i < itemMeshes.length; i++) {
    const itemMesh = itemMeshes[i];
    if (itemMesh.getWorldPosition(localVector5).distanceTo(localVector4) < 1) {
      itemMesh.pickUp();
    }
    itemMesh.update(localVector5.copy(localVector3).applyMatrix4(localMatrix2.getInverse(currentChunkMesh.matrixWorld)));
  }
};
const _collideChunk = matrix => {
  matrix.decompose(localVector3, localQuaternion2, localVector4);
  currentChunkMesh && currentChunkMesh.update(localVector3);
};

const velocity = new THREE.Vector3();
const lastGrabs = [false, false];
const lastAxes = [[0, 0], [0, 0]];
let currentTeleport = false;
let lastTeleport = false;
const timeFactor = 1000;
let lastTimestamp = performance.now();
// let lastParcel  = new THREE.Vector3(0, 0, 0);
let raycastChunkSpec = null;
const startTime = Date.now();
function animate(timestamp, frame) {
  const timeDiff = 30/1000;// Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  const now = Date.now();
  if (currentChunkMesh) {
    for (const material of currentChunkMesh.material) {
      const {uniforms} = material;
      uniforms.uTime.value = (now % timeFactor) / timeFactor;
      uniforms.uTime.needsUpdate = true;
      uniforms.sunIntensity.value = Math.max(skybox2.material.uniforms.sunPosition.value.y, 0);
      uniforms.sunIntensity.needsUpdate = true;
    }
  }
  if (currentVegetationMesh) {
    for (const material of currentVegetationMesh.material) {
      const {uniforms} = material;
      uniforms.sunIntensity.value = Math.max(skybox2.material.uniforms.sunPosition.value.y, 0);
      uniforms.sunIntensity.needsUpdate = true;
    }
  }
  if (currentVegetationTransparentMesh) {
    for (const material of currentVegetationTransparentMesh.material) {
      const {uniforms} = material;
      uniforms.sunIntensity.value = Math.max(skybox2.material.uniforms.sunPosition.value.y, 0);
      uniforms.sunIntensity.needsUpdate = true;
    }
  }
  explosionMeshes = explosionMeshes.filter(explosionMesh => {
    explosionMesh.material.uniforms.uAnimation.value += timeDiff;
    if (explosionMesh.material.uniforms.uAnimation.value < 1) {
      return true;
    } else {
      scene.remove(explosionMesh);
      return false;
    }
  });
  cometFireMesh.material.uniforms.uAnimation.value = (Date.now() % 2000) / 2000;
  hpMesh.update();
  /* for (let i = 0; i < npcMeshes.length; i++) {
    npcMeshes[i].update();
  } */
  if (skybox) {
    skybox.material.uniforms.iTime.value = ((Date.now() - startTime)%3000)/3000;
  }
  skybox2 && skybox2.update();
  crosshairMesh && crosshairMesh.update();
  uiMesh && uiMesh.update();

  const session = renderer.xr.getSession();
  if (session) {
    const inputSource = session.inputSources[1];
    let pose;
    const referenceSpace = renderer.xr.getReferenceSpace();
    if (inputSource && (pose = frame.getPose(inputSource.targetRaySpace, referenceSpace))) {
      localMatrix.fromArray(pose.transform.matrix)
        .decompose(localVector, localQuaternion, localVector2);

      if (currentChunkMesh && physxWorker) {
        const result = physxWorker.raycast(localVector, localQuaternion);
        raycastChunkSpec = result;
        if (raycastChunkSpec) {
          raycastChunkSpec.mesh = _findMeshWithMeshId(raycastChunkSpec.meshId);
          raycastChunkSpec.point = new THREE.Vector3().fromArray(raycastChunkSpec.point);
          raycastChunkSpec.normal = new THREE.Vector3().fromArray(raycastChunkSpec.normal);
        }
      }

      [assaultRifleMesh, grenadeMesh, crosshairMesh, plansMesh, pencilMesh, pickaxeMesh, paintBrushMesh].forEach(weaponMesh => {
        if (weaponMesh) {
          weaponMesh.visible = false;
        }
      });
      const selectedWeaponModel = (() => {
        switch (selectedWeapon) {
          case 'rifle': {
            return {
              weapon: assaultRifleMesh,
              crosshair: crosshairMesh,
            };
          }
          case 'grenade': {
            return {
              weapon: grenadeMesh,
              crosshair: crosshairMesh,
            };
          }
          case 'build': {
            return [plansMesh, pencilMesh];
          }
          case 'pickaxe': {
            return pickaxeMesh;
          }
          case 'paintbrush': {
            return paintBrushMesh;
          }
          default: {
            return null;
          }
        }
      })();
      if (selectedWeaponModel) {
        if (!selectedWeaponModel.isMesh) {
          if (Array.isArray(selectedWeaponModel)) {
            const pose2 = frame.getPose(session.inputSources[0].targetRaySpace, referenceSpace);
            localMatrix.fromArray(pose.transform.matrix)
              .decompose(localVector3, localQuaternion2, localVector4);

            selectedWeaponModel.forEach((weaponMesh, i) => {
              if (weaponMesh) {
                if (i === 0) {
                  weaponMesh.position.copy(localVector3);
                  weaponMesh.quaternion.copy(localQuaternion2);
                  weaponMesh.visible = true;
                } else if (i === 1) {
                  weaponMesh.position.copy(localVector);
                  weaponMesh.quaternion.copy(localQuaternion);
                  weaponMesh.visible = true;
                }
              }
            });
          } else {
            const {weapon, crosshair} = selectedWeaponModel;
            if (weapon) {
              weapon.position.copy(localVector);
              weapon.quaternion.copy(localQuaternion);
              weapon.visible = true;
            }
            if (crosshair) {
              crosshair.visible = true;
            }
          }
        } else {
          selectedWeaponModel.position.copy(localVector);
          selectedWeaponModel.quaternion.copy(localQuaternion);
          selectedWeaponModel.visible = true;
        }
      }
      addMesh.visible = false;
      removeMesh.visible = false;
      switch (selectedWeapon) {
        case 'rifle':
        case 'grenade':
        {
          if (crosshairMesh) {
            crosshairMesh.position.copy(localVector)
              .add(localVector2.set(0, 0, -500).applyQuaternion(localQuaternion));
            crosshairMesh.quaternion.copy(localQuaternion);
            crosshairMesh.visible = true;
          }
          break;
        }
        case 'build': {
          addMesh.position.copy(localVector)
            .add(localVector2.set(0, 0, -2).applyQuaternion(localQuaternion));
          addMesh.quaternion.copy(localQuaternion);
          addMesh.visible = true;
          break;
        }
        case 'pickaxe': {
          if (raycastChunkSpec) {
            removeMesh.position.copy(raycastChunkSpec.point);
            removeMesh.quaternion.setFromUnitVectors(localVector2.set(0, 1, 0), raycastChunkSpec.normal);
            removeMesh.visible = true;
          }
          break;
        }
      }
      if (wallMesh && currentChunkMesh) {
        [wallMesh, platformMesh, stairsMesh, spikesMesh].forEach(buildMesh => {
          buildMesh.parent && buildMesh.parent.remove(buildMesh);
        });
        if (buildMode) {
          const buildMesh = (() => {
            switch (buildMode) {
              case 'wall': return wallMesh;
              case 'floor': return platformMesh;
              case 'stair': return stairsMesh;
              case 'trap': return spikesMesh;
              default: return null;
            }
          })();

          buildMesh.position.copy(localVector)
            .add(localVector3.set(0, 0, -BUILD_SNAP).applyQuaternion(localQuaternion))
            .add(localVector3.set(0, -BUILD_SNAP/2, 0));
          buildMesh.quaternion.copy(localQuaternion);

          buildMesh.matrix.compose(buildMesh.position, buildMesh.quaternion, buildMesh.scale)
            .premultiply(localMatrix2.getInverse(currentChunkMesh.matrixWorld))
            .decompose(buildMesh.position, buildMesh.quaternion, buildMesh.scale);
          _snapBuildPosition(buildMesh.position);

          localVector3.set(0, 1, 0).applyQuaternion(buildMesh.quaternion);
          if (Math.abs(localVector3.x) > Math.abs(localVector3.y) && Math.abs(localVector3.x) > Math.abs(localVector3.z)) {
            localVector3.set(Math.sign(localVector3.x), 0, 0);
          } else if (Math.abs(localVector3.y) > Math.abs(localVector3.x) && Math.abs(localVector3.y) > Math.abs(localVector3.z)) {
            localVector3.set(0, Math.sign(localVector3.y), 0);
          } else {
            localVector3.set(0, 0, Math.sign(localVector3.z));
          }
          localVector4.set(0, 0, -1).applyQuaternion(buildMesh.quaternion);
          if (Math.abs(localVector4.x) > Math.abs(localVector4.y) && Math.abs(localVector4.x) > Math.abs(localVector4.z)) {
            localVector4.set(Math.sign(localVector4.x), 0, 0);
          } else if (Math.abs(localVector4.y) > Math.abs(localVector4.x) && Math.abs(localVector4.y) > Math.abs(localVector4.z)) {
            localVector4.set(0, Math.sign(localVector4.y), 0);
          } else {
            localVector4.set(0, 0, Math.sign(localVector4.z));
          }
          buildMesh.quaternion.setFromRotationMatrix(localMatrix2.lookAt(
            localVector2.set(0, 0, 0),
            localVector4,
            localVector3
          ));

          const hasBuildMesh = (() => {
            for (const index in currentChunkMesh.vegetationMeshes) {
              const subparcelBuildMeshesSpec = currentChunkMesh.vegetationMeshes[index];
              if (subparcelBuildMeshesSpec && subparcelBuildMeshesSpec.meshes.some(m => _meshEquals(m, buildMesh))) {
                return true;
              }
            }
            return false;
          })();
          if (hasBuildMesh) {
            buildMesh.traverse(o => {
              if (o.isMesh && o.originalMaterial) {
                o.material = o.originalMaterial;
                o.originalMaterial = null;
              }
            });
          } else {
            buildMesh.traverse(o => {
              if (o.isMesh && !o.originalMaterial) {
                o.originalMaterial = o.material;
                o.material = redBuildMeshMaterial;
              }
            });
          }

          currentChunkMesh.add(buildMesh);
        }
      }
      if (currentWeaponDown && !lastWeaponDown && currentChunkMesh) {
        if (!buildMode) {
          const _mine = async (mineSpecs, explodePosition) => {
            const specs = await chunkWorker.requestMine(
              currentChunkMesh.meshId,
              mineSpecs,
              currentChunkMesh.subparcelSize
            );
            for (let i = 0; i < specs.length; i++) {
              const spec = specs[i];
              const {x, y, z} = spec;
              const slab = currentChunkMesh.getSlab(x, y, z);
              slab.position.set(spec.positions);
              slab.barycentric.set(spec.barycentrics);
              slab.id.set(spec.ids);
              slab.skyLights.set(spec.skyLights);
              slab.torchLights.set(spec.torchLights);
              const indexOffset = slab.slabIndex * slabSliceTris;
              for (let i = 0; i < spec.indices.length; i++) {
                spec.indices[i] += indexOffset;
              }
              slab.indices.set(spec.indices);

              currentChunkMesh.updateGeometry(slab, spec);

              const group = currentChunkMesh.geometry.groups.find(group => group.start === slab.slabIndex * slabSliceVertices);
              group.count = spec.positions.length/3;
            }
            const bakeSpecs = specs.filter(spec => spec.positions.length > 0).map(spec => {
              const {positions, x, y, z} = spec;
              return positions.length > 0 ? {
                positions,
                x,
                y,
                z,
              } : null;
            });
            if (bakeSpecs.length > 0) {
              const result = await physicsWorker.requestBakeGeometries(bakeSpecs.map(spec => {
                const {positions} = spec;
                return {
                  positions,
                };
              }));
              for (let i = 0; i < result.physicsGeometryBuffers.length; i++) {
                const physxGeometry = result.physicsGeometryBuffers[i];
                const {x, y, z} = bakeSpecs[i];
                const slab = currentChunkMesh.getSlab(x, y, z);
                if (slab.physxGeometry) {
                  physxWorker.unregisterGeometry(slab.physxGeometry);
                  slab.physxGeometry = 0;
                }
                slab.physxGeometry = physxWorker.registerBakedGeometry(currentChunkMesh.meshId, physxGeometry, x, y, z);
              }
            }
            if (specs.length > 0 && explodePosition) {
              for (let i = 0; i < 3; i++) {
                const pxMesh = new THREE.Mesh(tetrehedronGeometry, currentChunkMesh.material[0]);
                currentChunkMesh.getWorldQuaternion(localQuaternion2).inverse();
                pxMesh.position.copy(explodePosition)
                  .add(localVector2.set((-1+Math.random()*2)*0.2, 0.2, (-1+Math.random()*2)*0.2).applyQuaternion(localQuaternion2));
                pxMesh.velocity = new THREE.Vector3((-1+Math.random()*2)*0.5, Math.random()*3, (-1+Math.random()*2)*0.5)
                  .applyQuaternion(localQuaternion2);
                pxMesh.angularVelocity = new THREE.Vector3((-1+Math.random()*2)*Math.PI*2*0.01, (-1+Math.random()*2)*Math.PI*2*0.01, (-1+Math.random()*2)*Math.PI*2*0.01);
                pxMesh.isBuildMesh = true;
                const startTime = Date.now();
                const endTime = startTime + 3000;
                pxMesh.update = () => Date.now() < endTime;
                currentChunkMesh.add(pxMesh);
                pxMeshes.push(pxMesh);
              }
            }
          };
          const _applyMineSpec = (p, radius, key, delta) => {
            const mineSpecs = [];
            const _applyRound = (ax, ay, az, value) => {
              const mineSpecsRound = [];
              for (let ddy = -1; ddy <= 0; ddy++) {
                const ady = ay + ddy;
                for (let ddz = -1; ddz <= 0; ddz++) {
                  const adz = az + ddz;
                  for (let ddx = -1; ddx <= 0; ddx++) {
                    const adx = ax + ddx;

                    const sdx = Math.floor(adx/currentChunkMesh.subparcelSize);
                    const sdy = Math.floor(ady/currentChunkMesh.subparcelSize);
                    const sdz = Math.floor(adz/currentChunkMesh.subparcelSize);
                    const index = planet.getSubparcelIndex(sdx, sdy, sdz);

                    if (!mineSpecsRound.some(mineSpec => mineSpec.index === index)) {
                      const lx = ax - sdx*currentChunkMesh.subparcelSize;
                      const ly = ay - sdy*currentChunkMesh.subparcelSize;
                      const lz = az - sdz*currentChunkMesh.subparcelSize;

                      planet.editSubparcel(sdx, sdy, sdz, subparcel => {
                        const potentialIndex = _getPotentialIndex(lx, ly, lz, currentChunkMesh.subparcelSize+1);
                        subparcel[key][potentialIndex] += value;

                        const mineSpec = {
                          x: sdx,
                          y: sdy,
                          z: sdz,
                          index,
                          potentials: subparcel.potentials,
                          heightfield: subparcel.heightfield,
                          lightfield: subparcel.lightfield,
                        };
                        mineSpecsRound.push(mineSpec);
                        if (!mineSpecs.some(mineSpec => mineSpec.index === index)) {
                          mineSpecs.push(mineSpec);
                        }
                      });
                    }
                  }
                }
              }
            };

            const {x, y, z} = p;
            for (let dy = -radius; dy <= radius; dy++) {
              const ay = y + dy;
              for (let dz = -radius; dz <= radius; dz++) {
                const az = z + dz;
                for (let dx = -radius; dx <= radius; dx++) {
                  const ax = x + dx;

                  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                  const maxDistScale = radius;
                  const maxDist = Math.sqrt(maxDistScale*maxDistScale + maxDistScale*maxDistScale + maxDistScale*maxDistScale);
                  const distanceDiff = maxDist - dist;
                  if (distanceDiff > 0) {
                    const value = (1-dist/maxDist)*delta;
                    _applyRound(ax, ay, az, value);
                  }
                }
              }
            }
            return mineSpecs;
          };
          const _applyPotentialDelta = async (position, delta) => {
            localVector2.copy(position)
              .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
            const applyPosition = localVector2.clone();
            localVector2.x = Math.floor(localVector2.x);
            localVector2.y = Math.floor(localVector2.y);
            localVector2.z = Math.floor(localVector2.z);

            const mineSpecs = _applyMineSpec(localVector2, 1, 'potentials', delta);
            await _mine(mineSpecs, delta < 0 ? applyPosition : null);
          };
          const _applyLightfieldDelta = async (position, delta) => {
            localVector2.copy(position)
              .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
            localVector2.x = Math.floor(localVector2.x);
            localVector2.y = Math.floor(localVector2.y);
            localVector2.z = Math.floor(localVector2.z);

            const mineSpecs = _applyMineSpec(localVector2, delta, 'lightfield', delta);
            await _mine(mineSpecs, null);
          };
          const _hit = () => {
            if (raycastChunkSpec) {
              if (raycastChunkSpec.mesh.isChunkMesh) {
                _applyPotentialDelta(raycastChunkSpec.point, -0.3);
              } else if (raycastChunkSpec.mesh.isVegetationMesh) {
                raycastChunkSpec.mesh.hit(30);
              } else if (raycastChunkSpec.mesh.isNpcHullMesh) {
                const {npcMesh} = raycastChunkSpec.mesh;

                npcMesh.hit(30);
              }
            }
          };
          const _paint = () => {
            if (raycastChunkSpec) {
              if (raycastChunkSpec.mesh.isChunkMesh || raycastChunkSpec.mesh.isVegetationMesh) {
                _applyLightfieldDelta(raycastChunkSpec.point, 4);

                localVector2.copy(raycastChunkSpec.point)
                  .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
                localVector2.x = Math.floor(localVector2.x / SUBPARCEL_SIZE);
                localVector2.y = Math.floor(localVector2.y / SUBPARCEL_SIZE);
                localVector2.z = Math.floor(localVector2.z / SUBPARCEL_SIZE);
                currentChunkMesh.updateSlab(localVector2.x, localVector2.y, localVector2.z);
              }
            }
          };
          const _explode = (position, quaternion) => {
            const explosionMesh = _makeExplosionMesh();
            explosionMesh.position.copy(position);
            explosionMesh.quaternion.copy(quaternion);
            scene.add(explosionMesh);
            explosionMeshes.push(explosionMesh);
          };
          const _damage = dmg => {
            hpMesh.damage(dmg);
          };
          switch (selectedWeapon) {
            case 'rifle': {
              _hit()
              localVector2.copy(assaultRifleMesh.position)
                .add(localVector3.set(0, 0.09, -0.7).applyQuaternion(assaultRifleMesh.quaternion));
              _explode(localVector2, assaultRifleMesh.quaternion);
              crosshairMesh.trigger();
              break;
            }
            case 'grenade': {
              if (currentChunkMesh) {
                const pxMesh = grenadeMesh.clone();

                localVector2.copy(grenadeMesh.position)
                  .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
                localQuaternion2.copy(grenadeMesh.quaternion)
                  .premultiply(currentChunkMesh.getWorldQuaternion(localQuaternion3).inverse());
                pxMesh.position.copy(localVector2)
                pxMesh.velocity = new THREE.Vector3(0, 0, -10)
                  .applyQuaternion(localQuaternion2);
                pxMesh.angularVelocity = new THREE.Vector3((-1+Math.random()*2)*Math.PI*2*0.01, (-1+Math.random()*2)*Math.PI*2*0.01, (-1+Math.random()*2)*Math.PI*2*0.01);
                pxMesh.isBuildMesh = true;
                const startTime = Date.now();
                const endTime = startTime + 3000;
                pxMesh.update = () => {
                  if (Date.now() < endTime) {
                    return true;
                  } else {
                    pxMesh.getWorldPosition(localVector2);
                    pxMesh.getWorldQuaternion(localQuaternion2);
                    _explode(localVector2, localQuaternion2);
                    _damage(15);
                    return false;
                  }
                };
                currentChunkMesh.add(pxMesh);
                pxMeshes.push(pxMesh);
              }
              break;
            }
            case 'build': {
              if (addMesh.visible) {
                _applyPotentialDelta(addMesh.position, 0.3);
              }
              break;
            }
            case 'pickaxe': {
              _hit();
              break;
            }
            case 'paintbrush': {
              _paint();
            }
          }
        } else {
          const buildMesh = (() => {
            switch (buildMode) {
              case 'wall': return wallMesh;
              case 'floor': return platformMesh;
              case 'stair': return stairsMesh;
              case 'trap': return spikesMesh;
              default: return null;
            }
          })();
          const hasBuildMesh = (() => {
            for (const index in currentChunkMesh.vegetationMeshes) {
              const subparcelBuildMeshesSpec = currentChunkMesh.vegetationMeshes[index];
              if (subparcelBuildMeshesSpec && subparcelBuildMeshesSpec.meshes.some(m => _meshEquals(m, buildMesh))) {
                return true;
              }
            }
            return false;
          })();
          if (!hasBuildMesh) {
            const subparcelPosition = new THREE.Vector3(
              Math.floor(buildMesh.position.x/currentChunkMesh.subparcelSize),
              Math.floor(buildMesh.position.y/currentChunkMesh.subparcelSize),
              Math.floor(buildMesh.position.z/currentChunkMesh.subparcelSize)
            );
            planet.editSubparcel(subparcelPosition.x, subparcelPosition.y, subparcelPosition.z, subparcel => {
              subparcel.addVegetation(buildMesh.buildMeshType, buildMesh.position, buildMesh.quaternion);
            });
            currentChunkMesh.updateSlab(subparcelPosition.x, subparcelPosition.y, subparcelPosition.z);
          }
        }
      }

      /* const currentParcel = _getCurrentParcel(localVector);
      if (!currentParcel.equals(lastParcel)) {
        if (currentParcel.x !== lastParcel.x) {
          currentParcel.z = lastParcel.z;
        } else if (currentParcel.z !== lastParcel.z) {
          currentParcel.x = lastParcel.x;
        }
        planetAnimation && _tickPlanetAnimation(1);
        const sub = lastParcel.clone().sub(currentParcel);
        const pivot = currentParcel.clone().add(lastParcel).multiplyScalar(10/2);
        _animatePlanet(planetContainer.matrix.clone(), pivot, new THREE.Quaternion(), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), sub));
        lastParcel = currentParcel;
      } */

      const _teleportTo = (position, quaternion) => {
        localMatrix.fromArray(pose.transform.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);

        worldContainer.matrix
          .premultiply(localMatrix.makeTranslation(-position.x, -position.y, -position.z))
          .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
          .premultiply(localMatrix.makeTranslation(0, -_getMinHeight(), 0))
          .decompose(worldContainer.position, worldContainer.quaternion, worldContainer.scale);

        velocity.set(0, 0, 0);
      };

      const currentTeleportChunkMesh = raycastChunkSpec && raycastChunkSpec.mesh;
      if (currentTeleport && currentTeleportChunkMesh) {
        if (raycastChunkSpec.point) {
          teleportMeshes[1].position.copy(raycastChunkSpec.point);
          teleportMeshes[1].quaternion.setFromUnitVectors(localVector.set(0, 1, 0), raycastChunkSpec.normal);
          teleportMeshes[1].visible = true;
          teleportMeshes[1].lineMesh.visible = false;
        }
      } else if (lastTeleport && !currentTeleport && currentTeleportChunkMesh) {
        teleportMeshes[1].visible = false;
        _teleportTo(teleportMeshes[1].position, teleportMeshes[1].quaternion);
        if (currentTeleportChunkMesh.isChunkMesh) {
          _setCurrentChunkMesh(currentTeleportChunkMesh);
        }
      } else {
        teleportMeshes[1].update(localVector, localQuaternion, currentTeleport, (position, quaternion) => {
          _teleportTo(position, localQuaternion.set(0, 0, 0, 1));
        });
      }
    }

    for (const handMesh of handMeshes) {
      handMesh.visible = false;
    }
    for (const inputSource of session.inputSources) {
      if (inputSource && inputSource.hand) {
        const handMesh = handMeshes[inputSource.handedness === 'right' ? 1 : 0];
        const positionAttribute = handMesh.geometry.attributes.position;

        for (let i = 0; i < inputSource.hand.length; i++) {
          const joint = inputSource.hand[i];
          const dstPositions = new Float32Array(positionAttribute.array.buffer, positionAttribute.array.byteOffset + i*jointNumPositions*Float32Array.BYTES_PER_ELEMENT, jointNumPositions);

          const jointPose = joint && frame.getJointPose(joint, referenceSpace);
          if (jointPose) {
            jointGeometry.attributes.position.array.set(jointPositions);
            jointGeometry.applyMatrix4(
              localMatrix.fromArray(jointPose.transform.matrix)
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

  /* if (planetAnimation) {
    const {startTime, endTime} = planetAnimation;
    const now = Date.now();
    const factor = Math.min((now - startTime) / (endTime - startTime), 1);
    _tickPlanetAnimation(factor);
  } */

  const currentSession = getRealSession();
  if (currentSession) {
    const {inputSources} = currentSession;
    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];
      const {handedness, gamepad} = inputSource;
      if (gamepad && gamepad.buttons.length >= 2) {
        const index = handedness === 'right' ? 1 : 0;

        // buttons
        const {buttons} = gamepad;
        const grab = buttons[1].pressed;
        const lastGrab = lastGrabs[index];
        if (!lastGrab && grab) { // grip
          // console.log('gripped', handedness);
          pe.grabdown(handedness);
        } else if (lastGrab && !grab) {
          pe.grabup(handedness);
        }
        lastGrabs[index] = grab;

        // axes
        const {axes: axesSrc} = gamepad;
        const axes = [
          axesSrc[0] || 0,
          axesSrc[1] || 0,
          axesSrc[2] || 0,
          axesSrc[3] || 0,
        ];
        if (handedness === 'left') {
          localVector.set(-(axes[0] + axes[2]), 0, -(axes[1] + axes[3]))
            .multiplyScalar(0.01);
          pe.matrix.decompose(localVector2, localQuaternion, localVector3);
          const xrCamera = renderer.xr.getCamera(pe.camera);
          localQuaternion2.copy(xrCamera.quaternion).premultiply(localQuaternion);
          localEuler.setFromQuaternion(localQuaternion2, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          localVector.applyEuler(localEuler);
          localVector2.add(localVector);
          pe.setMatrix(localMatrix.compose(localVector2, localQuaternion, localVector3));
        } else if (handedness === 'right') {
          const _applyRotation = r => {
            const xrCamera = renderer.xr.getCamera(pe.camera);
            localMatrix
              .copy(xrCamera.matrix)
              .premultiply(pe.matrix)
              .decompose(localVector, localQuaternion, localVector2);
            localQuaternion.premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), r));
            localMatrix
              .compose(localVector, localQuaternion, localVector2)
              .multiply(localMatrix2.getInverse(xrCamera.matrix));
            pe.setMatrix(localMatrix);
          };
          if (
            (axes[0] < -0.5 && !(lastAxes[index][0] < -0.5)) ||
            (axes[2] < -0.5 && !(lastAxes[index][2] < -0.5))
          ) {
            _applyRotation(-Math.PI * 0.2);
          } else if (
            (axes[0] > 0.5 && !(lastAxes[index][0] > 0.5)) ||
            (axes[2] > 0.5 && !(lastAxes[index][2] > 0.5))
          ) {
            _applyRotation(Math.PI * 0.2);
          }
          currentTeleport = (axes[1] < -0.5 || axes[3] < -0.5);
        }
        lastAxes[index][0] = axes[0];
        lastAxes[index][1] = axes[1];
        lastAxes[index][2] = axes[2];
        lastAxes[index][3] = axes[3];
      }
    }

    pe.setRigMatrix(null);
  } else if (document.pointerLockElement) {
    const speed = 30 * (keys.shift ? 3 : 1);
    const cameraEuler = pe.camera.rotation.clone();
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
    localVector.y -= 9.8;
    localVector.multiplyScalar(timeDiff);
    velocity.add(localVector);

    const terminalVelocity = 50;
    const _clampToTerminalVelocity = v => Math.min(Math.max(v, -terminalVelocity), terminalVelocity);
    velocity.x = _clampToTerminalVelocity(velocity.x*0.7);
    velocity.z = _clampToTerminalVelocity(velocity.z*0.7);
    velocity.y = _clampToTerminalVelocity(velocity.y);

    if (selectedTool === 'firstperson') {
      _applyAvatarPhysics(null, false, false, false, timeDiff);
    } else if (selectedTool === 'thirdperson') {
      _applyAvatarPhysics(avatarCameraOffset, true, true, true, timeDiff);
    } else if (selectedTool === 'isometric') {
      _applyAvatarPhysics(isometricCameraOffset, true, true, true, timeDiff);
    } else if (selectedTool === 'birdseye') {
      _applyAvatarPhysics(new THREE.Vector3(0, -birdsEyeHeight + _getAvatarHeight(), 0), false, true, true, timeDiff);
    } else {
      _collideItems(pe.camera.matrix);
      _collideChunk(pe.camera.matrix);
      pe.setRigMatrix(null);
    }
  } else {
    _collideItems(pe.camera.matrix);
    _collideChunk(pe.camera.matrix);
    pe.setRigMatrix(null);
  }

  /* if (session) {
    wristMenu.update(frame, session, renderer.xr.getReferenceSpace());
  } */

  // packages
  const isVisible = shieldLevel === 2;
  const isTarget = shieldLevel === 0 && selectedTool !== 'select';
  const isVolume = shieldLevel === 1 || selectedTool === 'select';
  for (const p of pe.children) {
    p.visible = isVisible;
    if (p.placeholderBox) {
      p.placeholderBox.visible = isTarget;
    }
    if (p.volumeMesh) {
      p.volumeMesh.visible = isVolume;
    }
  }
  /* if (hoverTarget) {
    wireframeMaterial.uniforms.uHoverId.value.fromArray(meshIdToArray(hoverTarget.meshId).map(n => n / 255));
    wireframeMaterial.uniforms.uHoverColor.value.fromArray(new THREE.Color(0x5c6bc0).toArray());
  } else {
    wireframeMaterial.uniforms.uHoverId.value.set(0, 0, 0);
  }
  if (selectTarget) {
    wireframeMaterial.uniforms.uSelectId.value.fromArray(meshIdToArray(selectTarget.meshId).map(n => n / 255));
    wireframeMaterial.uniforms.uSelectColor.value.fromArray(new THREE.Color(0x66bb6a).toArray());
  } else {
    wireframeMaterial.uniforms.uSelectId.value.set(0, 0, 0);
  } */

  if (physxWorker) {
    pxMeshes = pxMeshes.filter(pxMesh => {
      if (pxMesh.update()) {
        if (!pxMesh.velocity.equals(zeroVector)) {
          localMatrix.copy(pxMesh.matrixWorld)
            .decompose(localVector, localQuaternion, localVector2);
          const collision = physxWorker.collide(0.2, 0, localVector, localQuaternion2.set(0, 0, 0, 1), 1);

          if (collision) {
            localVector3.fromArray(collision.direction)
              .applyQuaternion(pxMesh.parent.getWorldQuaternion(localQuaternion).inverse());
            pxMesh.position.add(localVector3);
            pxMesh.velocity.copy(zeroVector);
            // pxMesh.angularVelocity.copy(zeroVector);
          } else {
            _applyVelocity(pxMesh.position, pxMesh.velocity, timeDiff);
            pxMesh.velocity.add(localVector.set(0, -9.8*timeDiff, 0).applyQuaternion(pxMesh.parent.getWorldQuaternion(localQuaternion).inverse()));
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
  /* if (!raycastRunning && physicsWorker) {
    const collisions = [];
    let collisionIndex = 0;
    pxMeshes = pxMeshes.filter(pxMesh => {
      if (pxMesh.update()) {
        if (!pxMesh.velocity.equals(zeroVector)) {
          localVector.copy(pxMesh.position)
            .applyMatrix4(pxMesh.parent.matrixWorld);
          collisions.push([
            localVector.toArray(),
            downQuaternion.toArray(),
          ]);

          pxMesh.collisionIndex = collisionIndex++;
        } else {
          pxMesh.collisionIndex = -1;
        }
        return true;
      } else {
        pxMesh.parent.remove(pxMesh);
        return false;
      }
    });
    physicsWorker.requestPhysicsRaycast(chunkMeshContainer.matrixWorld.toArray(), collisions, 1, 1, 100);
  } */

  /* if (!raycastRunning && physicsWorker) {
    raycastRunning = true;

    physicsWorker.registerGeometry()
      .then(specs => {
        const [raycastResultData, collisionResults, physicsResultData] = specs;

        raycastChunkSpec = raycastResultData;
        if (raycastChunkSpec) {
          raycastChunkSpec.mesh = _findMeshWithMeshId(chunkMeshContainer, raycastChunkSpec.meshId);
          raycastChunkSpec.point = new THREE.Vector3().fromArray(raycastChunkSpec.point);
          raycastChunkSpec.normal = new THREE.Vector3().fromArray(raycastChunkSpec.normal);
        }

        wallCollisionResult = collisionResults[0];
        if (wallCollisionResult) {
          wallCollisionResult.position = new THREE.Vector3().fromArray(wallCollisionResult.position);
          wallCollisionResult.quaternion = new THREE.Quaternion().fromArray(wallCollisionResult.quaternion);
        }

        floorCollisionResult = collisionResults[1];
        if (floorCollisionResult) {
          floorCollisionResult.position = new THREE.Vector3().fromArray(floorCollisionResult.position);
          floorCollisionResult.quaternion = new THREE.Quaternion().fromArray(floorCollisionResult.quaternion);
        }

        ceilingCollisionResult = collisionResults[2];
        if (ceilingCollisionResult) {
          ceilingCollisionResult.position = new THREE.Vector3().fromArray(ceilingCollisionResult.position);
          ceilingCollisionResult.quaternion = new THREE.Quaternion().fromArray(ceilingCollisionResult.quaternion);
        }

        if (physicsResultData) {
          for (let i = 0; i < pxMeshes.length; i++) {
            const pxMesh = pxMeshes[i];
            if (pxMesh.collisionIndex !== -1) {
              if ((physicsResultData.depths[pxMesh.collisionIndex] - 0.2 - pxMesh.velocity.length()*timeDiff) < 0) {
                pxMesh.position.add(
                  pxMesh.velocity
                    .normalize()
                    .multiplyScalar(physicsResultData.depths[pxMesh.collisionIndex] - 0.2)
                  );
                pxMesh.velocity.copy(zeroVector);
              } else {
                _applyVelocity(pxMesh.position, pxMesh.velocity, timeDiff);
                pxMesh.velocity.add(localVector.set(0, -9.8*timeDiff, 0).applyQuaternion(pxMesh.parent.getWorldQuaternion(localQuaternion).inverse()));
                pxMesh.rotation.x += pxMesh.angularVelocity.x;
                pxMesh.rotation.y += pxMesh.angularVelocity.y;
                pxMesh.rotation.z += pxMesh.angularVelocity.z;
              }
            }
          }
        }

        raycastRunning = false;
      });
  } */

  lastTeleport = currentTeleport;
  lastWeaponDown = currentWeaponDown;

  if (currentChunkMesh) {
    localFrustum.setFromProjectionMatrix(
      localMatrix.multiplyMatrices(pe.camera.projectionMatrix, localMatrix2.multiplyMatrices(pe.camera.matrixWorldInverse, currentChunkMesh.matrixWorld))
    );
    currentChunkMesh.geometry.originalGroups = currentChunkMesh.geometry.groups.slice();
    currentChunkMesh.geometry.groups = currentChunkMesh.geometry.groups.filter(group => localFrustum.intersectsSphere(group.boundingSphere));
  }
  if (currentVegetationMesh) {
    localFrustum.setFromProjectionMatrix(
      localMatrix.multiplyMatrices(pe.camera.projectionMatrix, localMatrix2.multiplyMatrices(pe.camera.matrixWorldInverse, currentVegetationMesh.matrixWorld))
    );
    currentVegetationMesh.geometry.originalGroups = currentVegetationMesh.geometry.groups.slice();
    currentVegetationMesh.geometry.groups = currentVegetationMesh.geometry.groups.filter(group => localFrustum.intersectsSphere(group.boundingSphere));

    currentVegetationTransparentMesh.geometry.originalGroups = currentVegetationTransparentMesh.geometry.groups.slice();
    currentVegetationTransparentMesh.geometry.groups = currentVegetationTransparentMesh.geometry.groups.filter(group => localFrustum.intersectsSphere(group.boundingSphere));
  }

  renderer.render(scene, camera);
  // renderer.render(highlightScene, camera);

  if (currentChunkMesh) {
    currentChunkMesh.geometry.groups = currentChunkMesh.geometry.originalGroups;
  }
  if (currentVegetationMesh) {
    currentVegetationMesh.geometry.groups = currentVegetationMesh.geometry.originalGroups;
    currentVegetationTransparentMesh.geometry.groups = currentVegetationTransparentMesh.geometry.originalGroups;
  }

  planet.flush();
}
renderer.setAnimationLoop(animate);
renderer.xr.setSession(proxySession);

bindUploadFileButton(document.getElementById('import-scene-input'), async file => {
  const uint8Array = await readFile(file);
  await pe.importScene(uint8Array);
});

let selectedTool = 'camera';
const _getFullAvatarHeight = () => pe.rig ? pe.rig.height : 1;
const _getAvatarHeight = () => _getFullAvatarHeight() * 0.9;
const _getMinHeight = () => {
  const {rig, rigPackage} = pe;
  if (rig || rigPackage) {
    const avatarHeight = rig ? _getAvatarHeight() : 1;
    const floorHeight = 0;
    const minHeight = floorHeight + avatarHeight;
    return minHeight;
  } else {
    return 1;
  }
};
const birdsEyeHeight = 10;
const avatarCameraOffset = new THREE.Vector3(0, 0, -1);
const isometricCameraOffset = new THREE.Vector3(0, 0, -5);
const tools = Array.from(document.querySelectorAll('.tool'));
for (let i = 0; i < tools.length; i++) {
  const tool = document.getElementById('tool-' + (i + 1));
  tool.addEventListener('click', e => {
    for (let i = 0; i < tools.length; i++) {
      tools[i].classList.remove('selected');
    }
    tool.classList.add('selected');

    const oldSelectedTool = selectedTool;
    selectedTool = tool.getAttribute('tool');

    if (selectedTool !== oldSelectedTool) {
      hoverTarget = null;
      _setSelectTarget(null);

      switch (oldSelectedTool) {
        case 'thirdperson': {
          pe.camera.position.add(localVector.copy(avatarCameraOffset).applyQuaternion(pe.camera.quaternion));
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera);
          break;
        }
        case 'isometric': {
          pe.camera.position.add(localVector.copy(isometricCameraOffset).applyQuaternion(pe.camera.quaternion));
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera);
          break;
        }
        case 'birdseye': {
          pe.camera.position.y += -birdsEyeHeight + _getAvatarHeight();
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera);
          break;
        }
      }

      let decapitate = true;
      switch (selectedTool) {
        case 'camera': {
          document.exitPointerLock();
          pe.orbitControls.enabled = true;
          pe.orbitControls.target.copy(pe.camera.position).add(new THREE.Vector3(0, 0, -3).applyQuaternion(pe.camera.quaternion));
          _resetKeys();
          velocity.set(0, 0, 0);
          break;
        }
        case 'firstperson': {
          /* pe.camera.position.y = _getAvatarHeight();
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera); */

          document.dispatchEvent(new MouseEvent('mouseup'));
          pe.orbitControls.enabled = false;
          pe.domElement.requestPointerLock();
          break;
        }
        case 'thirdperson': {
          /* pe.camera.position.y = _getAvatarHeight();
          pe.camera.position.sub(localVector.copy(avatarCameraOffset).applyQuaternion(pe.camera.quaternion));
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera); */

          pe.camera.position.sub(localVector.copy(avatarCameraOffset).applyQuaternion(pe.camera.quaternion));
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera);

          document.dispatchEvent(new MouseEvent('mouseup'));
          pe.orbitControls.enabled = false;
          pe.domElement.requestPointerLock();
          decapitate = false;
          break;
        }
        case 'isometric': {
          /* pe.camera.rotation.x = -Math.PI / 4;
          pe.camera.quaternion.setFromEuler(pe.camera.rotation);
          pe.camera.position.y = _getAvatarHeight();
          pe.camera.position.sub(localVector.copy(isometricCameraOffset).applyQuaternion(pe.camera.quaternion));
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera); */

          pe.camera.rotation.x = -Math.PI / 6;
          pe.camera.quaternion.setFromEuler(pe.camera.rotation);
          pe.camera.position.sub(localVector.copy(isometricCameraOffset).applyQuaternion(pe.camera.quaternion));
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera);

          document.dispatchEvent(new MouseEvent('mouseup'));
          pe.orbitControls.enabled = false;
          pe.domElement.requestPointerLock();
          decapitate = false;
          break;
        }
        case 'birdseye': {
          /* pe.camera.position.y = birdsEyeHeight;
          pe.camera.rotation.x = -Math.PI / 2;
          pe.camera.quaternion.setFromEuler(pe.camera.rotation);
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera); */

          pe.camera.rotation.x = -Math.PI / 2;
          pe.camera.quaternion.setFromEuler(pe.camera.rotation);
          pe.camera.position.y -= -birdsEyeHeight + _getAvatarHeight();
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera);

          document.dispatchEvent(new MouseEvent('mouseup'));
          pe.orbitControls.enabled = false;
          pe.domElement.requestPointerLock();
          decapitate = false;
          break;
        }
        case 'select': {
          pe.orbitControls.enabled = false;
          _resetKeys();
          velocity.set(0, 0, 0);
          break;
        }
      }
      if (pe.rig) {
        if (decapitate) {
          pe.rig.decapitate();
        } else {
          pe.rig.undecapitate();
        }
      }
    }
  });
}
let selectedWeapon = 'hand';
let currentWeaponDown = false;
let lastWeaponDown = false;
const weapons = Array.from(document.querySelectorAll('.weapon'));
for (let i = 0; i < weapons.length; i++) {
  const weapon = document.getElementById('weapon-' + (i + 1));
  weapon.addEventListener('click', e => {
    for (let i = 0; i < weapons.length; i++) {
      weapons[i].classList.remove('selected');
    }
    weapon.classList.add('selected');

    selectedWeapon = weapon.getAttribute('weapon');
    buildMode = null;
  });
}
document.addEventListener('pointerlockchange', e => {
  if (!document.pointerLockElement) {
    tools.find(tool => tool.matches('.tool[tool=camera]')).click();
  }
});

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
let jumpState = false;
window.addEventListener('keydown', e => {
  switch (e.which) {
    case 49: // 1
    case 50:
    case 51:
    case 52:
    case 53:
    case 54:
    {
      tools[e.which - 49].click();
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
        uiMesh && uiMesh.rotate(-1);
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
        uiMesh && uiMesh.rotate(1);
      } else {
        keys.right = true;
      }
      break;
    }
    case 69: { // E
      if (document.pointerLockElement) {
        // nothing
      } else {
        if (selectTarget && selectTarget.control) {
          selectTarget.control.setMode('rotate');
        }
      }
      break;
    }
    case 82: { // R
      if (document.pointerLockElement) {
        pe.equip('back');
      } else {
        if (selectTarget && selectTarget.control) {
          selectTarget.control.setMode('scale');
        }
      }
      break;
    }
    case 70: { // F
      pe.grabdown('right');
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
          jumpState = true;
          velocity.y += 5;
        }
      }
      break;
    }
    case 81: { // Q
      if (selectedWeapon !== 'build') {
        document.querySelector('.weapon[weapon="build"]').click();
      } else {
        document.querySelector('.weapon[weapon="pickaxe"]').click();
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
      document.querySelector('.weapon[weapon="build"]').click();
      buildMode = 'stair';
      break;
    }
    case 86: { // V
      document.querySelector('.weapon[weapon="build"]').click();
      buildMode = 'trap';
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
      pe.grabup('right');
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
  if (document.pointerLockElement) {
    if (e.button === 0) {
      pe.grabtriggerdown('right');
      pe.grabuse('right');
      currentWeaponDown = true;
    } else if (e.button === 2) {
      currentTeleport = true;
    }
  }
});
window.addEventListener('mouseup', e => {
  if (document.pointerLockElement) {
    pe.grabtriggerup('right');
  }
  currentWeaponDown = false;
  currentTeleport = false;
});

/* document.getElementById('world-name').addEventListener('change', e => {
  pe.name = e.target.value;
}); */
document.getElementById('reset-scene-button').addEventListener('click', e => {
  pe.reset();
});
/* document.getElementById('publish-scene-button').addEventListener('click', async e => {
  const hash = await pe.uploadScene();
  const res = await fetch(scenesEndpoint + '/' + hash, {
    method: 'PUT',
    body: JSON.stringify({
      name: pe.name,
      hash,
    }),
  });
  if (res.ok) {
    // nothing
  } else {
    console.warn('invalid status code: ' + res.status);
  }
}); */
document.getElementById('export-scene-button').addEventListener('click', async e => {
  const uint8Array = await pe.exportScene();
  const b = new Blob([uint8Array], {
    type: 'application/webbundle',
  });
  downloadFile(b, 'scene.wbn');
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
  const geometry = new THREE.RingBufferGeometry(0.05, 0.08, 128, 0, Math.PI/2, Math.PI*2*0.9)
    // .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)));
  return() => {
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
const _ensurePlaceholdMesh = p => {
  if (!p.placeholderBox) {
    p.placeholderBox = _makeTargetMesh();
    p.placeholderBox.package = p;
    p.placeholderBox.matrix.copy(p.matrix).decompose(p.placeholderBox.position, p.placeholderBox.quaternion, p.placeholderBox.scale);
    p.placeholderBox.visible = false;
    scene.add(p.placeholderBox);
  }
};
/* const _ensureVolumeMesh = async p => {
  if (!p.volumeMesh) {
    p.volumeMesh = await _makeVolumeMesh(p);
    p.volumeMesh = getWireframeMesh(p.volumeMesh);
    decorateRaycastMesh(p.volumeMesh, p.id);
    p.volumeMesh.package = p;
    p.volumeMesh.matrix.copy(p.matrix).decompose(p.volumeMesh.position, p.volumeMesh.quaternion, p.volumeMesh.scale);
    p.volumeMesh.visible = false;
    scene.add(p.volumeMesh);
  }
}; */
const shieldSlider = document.getElementById('shield-slider');
let shieldLevel = parseInt(shieldSlider.value, 10);
shieldSlider.addEventListener('change', async e => {
  const newShieldLevel = parseInt(e.target.value, 10);
  const {packages} = pe;
  switch (newShieldLevel) {
    case 0: {
      shieldLevel = newShieldLevel;
      hoverTarget = null;
      _setSelectTarget(null);
      break;
    }
    case 1: {
      shieldLevel = newShieldLevel;
      hoverTarget = null;
      _setSelectTarget(null);
      break;
    }
    case 2: {
      shieldLevel = newShieldLevel;
      hoverTarget = null;
      _setSelectTarget(null);
      break;
    }
  }
});
const scaleSlider = document.getElementById('scale-slider');
scaleSlider.addEventListener('change', async e => {
  const newScale = parseFloat(e.target.value);
  pe.setScale(newScale);
});
document.getElementById('toggle-stage-button').addEventListener('click', e => {
  floorMesh.visible = !floorMesh.visible;
});

let hoverTarget = null;
let selectTarget = null;
const _setSelectTarget = newSelectTarget => {
  if (selectTarget && selectTarget.control) {
    _unbindTransformControls(selectTarget);
  }
  if (newSelectTarget !== selectTarget) {
    selectTarget = newSelectTarget;
    if (selectTarget) {
      if (!dropdownButton.classList.contains('open')) {
        dropdownButton.click();
      }

      _bindTransformControls(selectTarget);
    }
    _renderObjects();
  }
};

const _packageadd = async e => {
  const {
    package: p,
    reason,
  } = e.data;

  _ensureLoadMesh(p);
  _ensurePlaceholdMesh(p);
  // await _ensureVolumeMesh(p);
  _renderObjects();

  _bindObject(p);

  if (!reason) {
    currentWorldChanged = true;
    _updateWorldSaveButton();
  }
};
const _packageremove = e => {
  const {
    package: p,
    reason,
  } = e.data;

  if (p.loadMesh) {
    scene.remove(p.loadMesh);
  }

  if (p.placeholderBox) {
    scene.remove(p.placeholderBox);
  }

  if (selectTarget === p) {
    _setSelectTarget(null);
  } else {
    _renderObjects();
  }

  _unbindObject(p);

  if (!reason) {
    currentWorldChanged = true;
    _updateWorldSaveButton();
  }
};
let currentWorldChanged = false;
const _updateWorldSaveButton = () => {
  if (currentWorldChanged && currentWorldId) {
    worldSaveButton.classList.remove('hidden');
    worldRevertButton.classList.remove('hidden');
  } else {
    worldSaveButton.classList.add('hidden');
    worldRevertButton.classList.add('hidden');
  }
};
function _matrixUpdate(e) {
  const p = this;
  const matrix = e.data;
  p.placeholderBox && p.placeholderBox.matrix.copy(matrix).decompose(p.placeholderBox.position, p.placeholderBox.quaternion, p.placeholderBox.scale);
  p.volumeMesh && p.volumeMesh.matrix.copy(matrix).decompose(p.volumeMesh.position, p.volumeMesh.quaternion, p.volumeMesh.scale);
  _updateObjectDetailsTransform(matrix);
}
const _bindObject = p => {
  p.addEventListener('matrixupdate', _matrixUpdate);
  p.addEventListener('packageadd', _packageadd);
  p.addEventListener('packageremove', _packageremove);
};
const _unbindObject = p => {
  p.removeEventListener('matrixupdate', _matrixUpdate);
  p.removeEventListener('packageadd', _packageadd);
  p.removeEventListener('packageremove', _packageremove);
};
pe.children.forEach(p => {
  _bindObject(p);
});
pe.addEventListener('packageadd', _packageadd);
pe.addEventListener('packageremove', _packageremove);

let transformControlsHovered = false;
const _bindTransformControls = o => {
  const control = new TransformControls(pe.camera, renderer.domElement);
  control.size = 3;
  control.addEventListener('mouseEnter', () => {
    transformControlsHovered = true;
  });
  control.addEventListener('mouseLeave', () => {
    transformControlsHovered = false;
  });
  control.addEventListener('objectChange', e => {
    o.updateMatrixWorld();
    o.package.setMatrix(o.matrix);
  });
  control.attach(o);
  pe.scene.add(control);
  o.control = control;
};
const _unbindTransformControls = o => {
  o.control.parent.remove(o.control);
  o.control.dispose();
  o.control = null;
  transformControlsHovered = false;
};

const raycaster = new THREE.Raycaster();
const _updateRaycasterFromMouseEvent = (raycaster, e) => {
  const mouse = new THREE.Vector2(((e.clientX) / window.innerWidth) * 2 - 1, -((e.clientY) / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(mouse, pe.camera);
  /* const candidateMeshes = pe.children
    .map(p => p.volumeMesh)
    .filter(o => !!o); */
  uiMesh.intersect(raycaster);
};
const _updateMouseMovement = e => {
  const {movementX, movementY} = e;
  if (selectedTool === 'thirdperson') {
    pe.camera.position.add(localVector.copy(avatarCameraOffset).applyQuaternion(pe.camera.quaternion));
  } else if (selectedTool === 'isometric') {
    pe.camera.position.add(localVector.copy(isometricCameraOffset).applyQuaternion(pe.camera.quaternion));
  } else if (selectedTool === 'birdseye') {
    pe.camera.rotation.x = -Math.PI / 2;
    pe.camera.quaternion.setFromEuler(pe.camera.rotation);
  }

  pe.camera.rotation.y -= movementX * Math.PI * 2 * 0.001;
  if (selectedTool !== 'isometric' && selectedTool !== 'birdseye') {
    pe.camera.rotation.x -= movementY * Math.PI * 2 * 0.001;
    pe.camera.rotation.x = Math.min(Math.max(pe.camera.rotation.x, -Math.PI / 2), Math.PI / 2);
    pe.camera.quaternion.setFromEuler(pe.camera.rotation);
  }

  if (selectedTool === 'thirdperson') {
    pe.camera.position.sub(localVector.copy(avatarCameraOffset).applyQuaternion(pe.camera.quaternion));
  } else if (selectedTool === 'isometric') {
    pe.camera.position.sub(localVector.copy(isometricCameraOffset).applyQuaternion(pe.camera.quaternion));
  }
  pe.camera.updateMatrixWorld();
  pe.setCamera(camera);
};
renderer.domElement.addEventListener('mousemove', e => {
  if (selectedTool === 'firstperson' || selectedTool === 'thirdperson' || selectedTool === 'isometric' || selectedTool === 'birdseye') {
    _updateMouseMovement(e);
  } else if (selectedTool === 'camera') {
    _updateRaycasterFromMouseEvent(raycaster, e);
  } /* else if (selectedTool === 'select' && !getRealSession()) {
    _updateRaycasterFromMouseEvent(raycaster, e);
  } */
});

renderer.domElement.addEventListener('mousedown', e => {
  /* if (!transformControlsHovered) {
    _setSelectTarget(hoverTarget);
  } */
  uiMesh.click();
});

/* const worldsButton = document.getElementById('worlds-button');
const worldSaveButton = document.getElementById('world-save-button');
const worldRevertButton = document.getElementById('world-revert-button'); */
const packagesButton = document.getElementById('packages-button');
const inventoryButton = document.getElementById('inventory-button');
const avatarButton = document.getElementById('avatar-button');
const micButton = document.getElementById('mic-button');
const dropdownButton = document.getElementById('dropdown-button');
const dropdown = document.getElementById('dropdown');
const worldsSubpage = document.getElementById('worlds-subpage');
const packagesSubpage = document.getElementById('packages-subpage');
const inventorySubpage = document.getElementById('inventory-subpage');
const avatarSubpage = document.getElementById('avatar-subpage');
const avatarSubpageContent = avatarSubpage.querySelector('.subtab-content');
const tabs = Array.from(dropdown.querySelectorAll('.tab'));
const tabContents = Array.from(dropdown.querySelectorAll('.tab-content'));
/* const worldsSubtabs = Array.from(worldsSubpage.querySelectorAll('.subtab'));
const worldsCloseButton = worldsSubpage.querySelector('.close-button');
const worldsSubtabContents = Array.from(worldsSubpage.querySelectorAll('.subtab-content')); */
const packagesCloseButton = packagesSubpage.querySelector('.close-button');
const inventorySubtabs = Array.from(inventorySubpage.querySelectorAll('.subtab'));
const inventoryCloseButton = inventorySubpage.querySelector('.close-button');
const inventorySubtabContent = inventorySubpage.querySelector('.subtab-content');
const avatarCloseButton = avatarSubpage.querySelector('.close-button');
/* worldsButton.addEventListener('click', e => {
  worldsButton.classList.toggle('open');
  worldsSubpage.classList.toggle('open');

  dropdownButton.classList.remove('open');
  dropdown.classList.remove('open');
  packagesButton.classList.remove('open');
  packagesSubpage.classList.remove('open');
  inventoryButton.classList.remove('open');
  inventorySubpage.classList.remove('open');
  avatarButton.classList.remove('open');
  avatarSubpage.classList.remove('open');
}); */
packagesButton.addEventListener('click', e => {
  packagesButton.classList.add('open');
  packagesSubpage.classList.add('open');

  dropdownButton.classList.remove('open');
  dropdown.classList.remove('open');
  inventoryButton.classList.remove('open');
  inventorySubpage.classList.remove('open');
  /* worldsButton.classList.remove('open');
  worldsSubpage.classList.remove('open'); */
  avatarButton.classList.remove('open');
  avatarSubpage.classList.remove('open');
});
inventoryButton.addEventListener('click', e => {
  inventoryButton.classList.toggle('open');
  inventorySubpage.classList.toggle('open');

  dropdownButton.classList.remove('open');
  dropdown.classList.remove('open');
  packagesButton.classList.remove('open');
  packagesSubpage.classList.remove('open');
  /* worldsButton.classList.remove('open');
  worldsSubpage.classList.remove('open'); */
  avatarButton.classList.remove('open');
  avatarSubpage.classList.remove('open');
});
avatarButton.addEventListener('click', e => {
  avatarButton.classList.toggle('open');
  avatarSubpage.classList.toggle('open');

  dropdownButton.classList.remove('open');
  dropdown.classList.remove('open');
  packagesButton.classList.remove('open');
  packagesSubpage.classList.remove('open');
  /* worldsButton.classList.remove('open');
  worldsSubpage.classList.remove('open'); */
  inventoryButton.classList.remove('open');
  inventorySubpage.classList.remove('open');
});
dropdownButton.addEventListener('click', e => {
  dropdownButton.classList.toggle('open');
  dropdown.classList.toggle('open');

  worldsButton.classList.remove('open');
  packagesButton.classList.remove('open');
  packagesSubpage.classList.remove('open');
  inventoryButton.classList.remove('open');
  inventorySubpage.classList.remove('open');
  // worldsSubpage.classList.remove('open');
  avatarButton.classList.remove('open');
  avatarSubpage.classList.remove('open');
});
micButton.addEventListener('click', async e => {
  micButton.classList.toggle('enabled');
  if (micButton.classList.contains('enabled')) {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pe.setMicrophoneMediaStream(mediaStream);
  } else {
    pe.setMicrophoneMediaStream(null);
  }
});
for (let i = 0; i < tabs.length; i++) {
  const tab = tabs[i];
  const tabContent = tabContents[i];
  tab.addEventListener('click', e => {
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabContent = tabContents[i];
      tab.classList.remove('open');
      tabContent.classList.remove('open');
    }

    tab.classList.add('open');
    tabContent.classList.add('open');

    _setSelectTarget(null);
  });
}
/* for (let i = 0; i < worldsSubtabs.length; i++) {
  const subtab = worldsSubtabs[i];
  const subtabContent = worldsSubtabContents[i];
  subtab.addEventListener('click', e => {
    for (let i = 0; i < worldsSubtabs.length; i++) {
      const subtab = worldsSubtabs[i];
      const subtabContent = worldsSubtabContents[i];
      subtab.classList.remove('open');
      subtabContent.classList.remove('open');
    }

    subtab.classList.add('open');
    subtabContent.classList.add('open');
  });
}
for (let i = 0; i < inventorySubtabs.length; i++) {
  const subtab = inventorySubtabs[i];
  const subtabContent = inventorySubtabContents[i];
  subtab.addEventListener('click', e => {
    for (let i = 0; i < inventorySubtabs.length; i++) {
      const subtab = inventorySubtabs[i];
      const subtabContent = inventorySubtabContents[i];
      subtab.classList.remove('open');
      subtabContent.classList.remove('open');
    }

    subtab.classList.add('open');
    subtabContent.classList.add('open');
  });
} */
[/* worldsCloseButton, */packagesCloseButton, inventoryCloseButton, avatarCloseButton].forEach(closeButton => {
  closeButton.addEventListener('click', e => {
    dropdownButton.classList.remove('open');
    dropdown.classList.remove('open');
    packagesButton.classList.remove('open');
    packagesSubpage.classList.remove('open');
    /* worldsButton.classList.remove('open');
    worldsSubpage.classList.remove('open'); */
    inventoryButton.classList.remove('open');
    inventorySubpage.classList.remove('open');
    avatarButton.classList.remove('open');
    avatarSubpage.classList.remove('open');
  });
});
/* async function screenshotEngine() {
  const center = new THREE.Vector3(0, 0, 0);
  const size = new THREE.Vector3(3, 3, 3);

  const width = 512;
  const height = width;
  const gif = new GIF({
    workers: 2,
    quality: 10,
  });
  const gl = pe.proxyContext;
  const framebuffer = (() => {
    const fbo = gl.createFramebuffer();

    const oldFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const oldTex = gl.getParameter(gl.TEXTURE_BINDING_2D);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const colorTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);

    const depthTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, width, height, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, oldFbo);
    gl.bindTexture(gl.TEXTURE_2D, oldTex);

    return fbo;
  })();
  const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 100);
  for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.05) {
    // render
    camera.position.copy(center)
      .add(new THREE.Vector3(0, size.y / 2, 0))
      .add(new THREE.Vector3(Math.cos(i + Math.PI / 2), 0, Math.sin(i + Math.PI / 2)).multiplyScalar(Math.max(size.x, size.z) * 1.2));
    camera.lookAt(center);
    camera.updateMatrixWorld();
    pe.render(
      null,
      width,
      height,
      camera.matrixWorld.toArray(new Float32Array(16)),
      camera.projectionMatrix.toArray(new Float32Array(16)),
      framebuffer
    );
    // read
    const writeCanvas = document.createElement('canvas');
    writeCanvas.width = width;
    writeCanvas.height = height;
    const writeCtx = writeCanvas.getContext('2d');
    const imageData = writeCtx.createImageData(width, height);
    {
      const oldFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);
      gl.bindFramebuffer(gl.FRAMEBUFFER, oldFbo);
    }
    // draw
    writeCtx.putImageData(imageData, 0, 0);
    // flip
    writeCtx.globalCompositeOperation = 'copy';
    writeCtx.scale(1, -1);
    writeCtx.translate(0, -writeCanvas.height);
    writeCtx.drawImage(writeCanvas, 0, 0);
    // submit
    gif.addFrame(writeCanvas, {delay: 50});
  }
  gif.render();

  const blob = await new Promise((resolve, reject) => {
    gif.on('finished', resolve);
  });
  return blob;
}
worldSaveButton.addEventListener('click', async e => {
  const {name} = pe;
  const hash = await pe.uploadScene();

  const screenshotBlob = await screenshotEngine();
  const {hash: previewIconHash} = await fetch(`${apiHost}/`, {
    method: 'PUT',
    body: screenshotBlob,
  })
    .then(res => res.json());

  const objects = await Promise.all(pe.children.map(async p => {
    const {name, hash} = p;
    const previewIconHash = await (async () => {
      const screenshotImgUrl = await p.getScreenshotImageUrl();
      if (screenshotImgUrl) {
        const screenshotBlob = await fetch(screenshotImgUrl)
          .then(res => res.blob());
        const {hash: previewIconHash} = await fetch(`${apiHost}/`, {
          method: 'PUT',
          body: screenshotBlob,
        })
          .then(res => res.json());
        return previewIconHash;
      } else {
        return null;
      }
    })();
    return {
      name,
      previewIconHash,
    };
  }));
  const w = {
    id: currentWorldId,
    name,
    description: 'This is a world description',
    hash,
    previewIconHash,
    objects,
  };
  const res = await fetch(worldsEndpoint + '/' + currentWorldId, {
    method: 'PUT',
    body: JSON.stringify(w),
  });
  if (res.ok) {
    // nothing
  } else {
    console.warn('invalid status code: ' + res.status);
  }

  currentWorldChanged = false;
  _updateWorldSaveButton();
});
worldRevertButton.addEventListener('click', async e => {
  _enterWorld(currentWorldId);
}); */

const worlds = document.getElementById('worlds');
const _makeWorldHtml = w => `
  <div class="world ${currentWorldId === w.id ? 'open' : ''}" worldId="${w.id}">
    <img src=${w.previewIconHash ? `${apiHost}/${w.previewIconHash}.gif` : 'assets/question.png'}>
    <div class="text">
      <input type=text class=name-input value="${w.name}" disabled>
    </div>
    <div class=background>
      <nav class="button rename-button">Rename</nav>
    </div>
  </div>
`;
// const headerLabel = document.getElementById('header-label');
let currentWorldId = '';
const _enterWorld = async worldId => {
  currentWorldId = worldId;

  /* headerLabel.innerText = name || 'Sandbox';
  runMode.setAttribute('href', 'run.html' + (worldId ? ('?w=' + worldId) : ''));
  editMode.setAttribute('href', 'edit.html' + (worldId ? ('?w=' + worldId) : '')); */

  const worlds = Array.from(document.querySelectorAll('.world'));
  worlds.forEach(world => {
    world.classList.remove('open');
  });
  let world;
  if (worldId) {
    world = worlds.find(w => w.getAttribute('worldId') === worldId);
  } else {
    world = worlds[0];
  }
  world && world.classList.add('open');

  if (worldId) {
    const res = await fetch(worldsEndpoint + '/' + worldId);
    if (res.ok) {
      const j = await res.json();
      const {hash} = j;
      await pe.downloadScene(hash);
    } else {
      console.warn('invalid world status code: ' + worldId + ' ' + res.status);
    }
  } else {
    pe.reset();
  }

  currentWorldChanged = false;
  _updateWorldSaveButton();
};
const _pushWorld = name => {
  history.pushState({}, '', window.location.protocol + '//' + window.location.host + window.location.pathname + (name ? ('?w=' + name) : ''));
  _handleUrl(window.location.href);
};
const _bindWorld = w => {
  w.addEventListener('click', async e => {
    const worldId = w.getAttribute('worldId');
    if (worldId !== currentWorldId) {
      _pushWorld(worldId);
    }
  });
  const nameInput = w.querySelector('.name-input');
  const renameButton = w.querySelector('.rename-button');
  let oldValue = '';
  renameButton.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    w.classList.add('renaming');
    oldValue = nameInput.value;
    nameInput.removeAttribute('disabled');
    nameInput.select();
  });
  nameInput.addEventListener('blur', e => {
    nameInput.value = oldValue;
    nameInput.setAttribute('disabled', '');
    oldValue = '';
  });
  nameInput.addEventListener('keydown', e => {
    if (e.which === 13) { // enter
      pe.name = nameInput.value;
      currentWorldChanged = true;
      _updateWorldSaveButton();

      oldValue = nameInput.value;
      nameInput.blur();
    } else if (e.which === 27) { // esc
      nameInput.blur();
    }
  });
};
/* (async () => {
  const res = await fetch(worldsEndpoint);
  const children = await res.json();
  const ws = await Promise.all(children.map(child =>
    fetch(worldsEndpoint + '/' + child)
      .then(res => res.json()),
  ));
  worlds.innerHTML = ws.map(w => _makeWorldHtml(w)).join('\n');
  Array.from(worlds.querySelectorAll('.world')).forEach((w, i) => _bindWorld(w, ws[i]));
})(); */
/* let worldType = 'singleplayer';
const singleplayerButton = document.getElementById('singleplayer-button');
singleplayerButton.addEventListener('click', e => {
  pe.reset();

  singleplayerButton.classList.add('open');
  multiplayerButton.classList.remove('open');
  Array.from(worlds.querySelectorAll('.world')).forEach(w => {
    w.classList.remove('open');
  });
  worldType = 'singleplayer';
  worldTools.style.visibility = null;
});
const multiplayerButton = document.getElementById('multiplayer-button');
multiplayerButton.addEventListener('click', async e => {
  pe.reset();

  singleplayerButton.classList.remove('open');
  multiplayerButton.classList.add('open');
  Array.from(worlds.querySelectorAll('.world')).forEach(w => {
    w.classList.remove('open');
  });
  worldType = 'multiplayer';
  worldTools.style.visibility = null;
}); */

const dropZones = Array.from(document.querySelectorAll('.drop-zone'));
dropZones.forEach(dropZone => {
  dropZone.addEventListener('dragenter', e => {
    dropZone.classList.add('hover');
  });
  dropZone.addEventListener('dragleave', e => {
    dropZone.classList.remove('hover');
  });
});
window.addEventListener('dragend', e => {
  document.body.classList.remove('dragging-package');
  dropZones.forEach(dropZone => {
    dropZone.classList.remove('hover');
  });
});
document.getElementById('inventory-drop-zone').addEventListener('drop', async e => {
  e.preventDefault();

  const jsonItem = Array.from(e.dataTransfer.items).find(i => i.type === 'application/json+package');
  if (jsonItem) {
    const s = await new Promise((resolve, reject) => {
      jsonItem.getAsString(resolve);
    });
    const j = JSON.parse(s);
    let {name, dataHash, id, iconHash} = j;
    if (!dataHash) {
      const p = pe.children.find(p => p.id === id);
      dataHash = await p.getHash();
    }

    const inventory = loginManager.getInventory();
    inventory.push({
      name,
      dataHash,
      iconHash,
    });
    await loginManager.setInventory(inventory);
  }
});
document.getElementById('avatar-drop-zone').addEventListener('drop', async e => {
  e.preventDefault();

  const jsonItem = Array.from(e.dataTransfer.items).find(i => i.type === 'application/json+package');
  if (jsonItem) {
    const s = await new Promise((resolve, reject) => {
      jsonItem.getAsString(resolve);
    });
    const j = JSON.parse(s);
    let {dataHash, id} = j;
    if (!dataHash) {
      const p = pe.children.find(p => p.id === id);
      dataHash = await p.getHash();
    }

    await loginManager.setAvatar(dataHash);
  }
});
document.getElementById('packages-search').addEventListener('input', e => {
  const searchTerm = e.target.value.toLowerCase();
  const packages = [...document.querySelectorAll('#packages .package')];

  if (searchTerm) {
    packages.forEach(p => {
      if (p.getAttribute('data-name').includes(searchTerm)) {
        p.style.display = 'block';
      } else {
        p.style.display = 'none';
      }
    });
  } else {
    packages.forEach(p => (p.style.display = 'block'));
  }
});

window.addEventListener('avatarchange', e => {
  const p = e.data;

  avatarSubpageContent.innerHTML = `\
    <div class=avatar draggable=true>
      <img class=screenshot style="display: none;">
      <div class=wrap>
        ${p ? `\
          <div class=name>${p.name}</div>
          <div class=hash>${p.hash}</div>
          <nav class="button unwear-button">Unwear</nab>
        ` : `\
          <div class=name>No avatar</div>
        `}
      </div>
    </div>
  `;
  if (p) {
    avatarSubpageContent.addEventListener('dragstart', e => {
      _startPackageDrag(e, {
        name: p.name,
        dataHash: p.hash,
        iconHash: null,
      });
    });
    (async () => {
      const img = avatarSubpageContent.querySelector('.screenshot');
      const u = await p.getScreenshotImageUrl();
      if (u) {
        img.src = u;
        img.onload = () => {
          img.style.display = null;
          URL.revokeObjectURL(u);
        };
        img.onerror = err => {
          console.warn(err);
          URL.revokeObjectURL(u);
        };
      } /* else {
        img.src = 'assets/question.png';
      } */
    })();
    const unwearButton = avatarSubpageContent.querySelector('.unwear-button');
    unwearButton && unwearButton.addEventListener('click', e => {
      loginManager.setAvatar(null);
    });
  }
});

const _changeInventory = inventory => {
  inventorySubtabContent.innerHTML = inventory.map(item => `\
    <div class=item draggable=true>
      <img class=screenshot width=256 height=256>
      <div class=name>${item.name}</div>
      <div class=background>
        <a class="button inspect-button" target="_blank" href="inspect.html?h=${item.dataHash}">Inspect</a>
        <nav class="button wear-button">Wear</nav>
        <nav class="button remove-button">Remove</nav>
      </div>
    </div>
  `).join('\n');
  const is = inventorySubtabContent.querySelectorAll('.item');
  is.forEach((itemEl, i) => {
    const item = inventory[i];
    const {name, dataHash, iconHash} = item;

    itemEl.addEventListener('dragstart', e => {
      _startPackageDrag(e, {
        name,
        dataHash,
        iconHash,
      });
    });

    (async () => {
      const img = itemEl.querySelector('.screenshot');
      /* if (p) {
        const u = await p.getScreenshotImageUrl();
        img.src = u;
        img.onload = () => {
          URL.revokeObjectURL(u);
        };
        img.onerror = err => {
          console.warn(err);
          URL.revokeObjectURL(u);
        };
      } else { */
        img.src = `${apiHost}/${iconHash}.gif`;
      // }
    })();
    const wearButton = itemEl.querySelector('.wear-button');
    wearButton.addEventListener('click', () => {
      loginManager.setAvatar(dataHash);
    });
    const removeButton = itemEl.querySelector('.remove-button');
    removeButton.addEventListener('click', async () => {
      const newInventory = inventory.filter(i => i.dataHash !== item.dataHash);
      await loginManager.setInventory(newInventory);
    });
  });

  // wristMenu.inventorySide.setPackages(inventory);
};
_changeInventory(loginManager.getInventory());
loginManager.addEventListener('inventorychange', async e => {
  const inventory = e.data;
  _changeInventory(inventory);
});

const _makePackageHtml = p => `
  <div class=package draggable=true data-name=${p.name}>
    <!-- <img src="assets/question.png"> -->
    <img src="${apiHost}/${p.icons[0].hash}.gif" width=256 height=256>
    <div class=text>
      <div class=name>${p.name}</div>
    </div>
    <div class=background>
      <nav class="button add-button">Add</nav>
      <nav class="button wear-button">Wear</nav>
      <a class="button inspect-button" target="_blank" href="inspect.html?p=${p.name}">Inspect</a>
    </div>
  </div>
`;
async function _addPackage(p, matrix) {
  p.setMatrix(matrix);
  await pe.add(p);
}
const _startPackageDrag = (e, j) => {
  e.dataTransfer.setData('application/json+package', JSON.stringify(j));
  setTimeout(() => {
    dropdown.classList.remove('open');
    packagesSubpage.classList.remove('open');
    inventorySubpage.classList.remove('open');
    avatarSubpage.classList.remove('open');
    document.body.classList.add('dragging-package');
  });
};
const _bindPackage = (pE, pJ) => {
  const {name, dataHash} = pJ;
  const iconHash = pJ.icons.find(i => i.type === 'image/gif').hash;
  pE.addEventListener('dragstart', e => {
    _startPackageDrag(e, {name, dataHash, iconHash});
  });
  const addButton = pE.querySelector('.add-button');
  addButton.addEventListener('click', async () => {
    const p = await XRPackage.download(dataHash);
    localMatrix.compose(
      pe.camera.position.clone().add(
        new THREE.Vector3(0, 0, -2).applyQuaternion(pe.camera.quaternion)
      ),
      pe.camera.quaternion,
      new THREE.Vector3(1, 1, 1)
    );
    await _addPackage(p, localMatrix);
  });
  const wearButton = pE.querySelector('.wear-button');
  wearButton.addEventListener('click', () => {
    loginManager.setAvatar(dataHash);
  });
  /* const inspectButton = pE.querySelector('.inspect-button');
  inspectButton.addEventListener('click', e => {
    e.preventDefault();
    console.log('open', inspectButton.getAttribute('href'));
    window.open(inspectButton.getAttribute('href'), '_blank');
  }); */
};
const packages = document.getElementById('packages');
(async () => {
let s;
  const res = await fetch(packagesEndpoint);
  s = await res.text();
  const children = JSON.parse(s);
  const ps = await Promise.all(children.map(child =>
    fetch(packagesEndpoint + '/' + child)
      .then(res => res.json())
  ));
  packages.innerHTML = ps.map(p => _makePackageHtml(p)).join('\n');
  Array.from(packages.querySelectorAll('.package')).forEach((pe, i) => _bindPackage(pe, ps[i]));

  // wristMenu.packageSide.setPackages(ps);
})();
const tokens = document.getElementById('tokens');
async function getTokenByIndex(index) {
  const metadataHash = await contract.methods.getMetadata(index, 'hash').call();
  const metadata = await fetch(`${apiHost}/${metadataHash}`).then(res => res.json());
  const {dataHash, screenshotHash, modelHash} = metadata;
  return {
    index: index,
    name: metadata.objectName,
    img: `${apiHost}/${screenshotHash}`,
    metadataHash: metadataHash,
    dataHash: dataHash,
    modelHash: modelHash,
  };
}
pe.domElement.addEventListener('dragover', e => {
  e.preventDefault();
});
pe.domElement.addEventListener('drop', async e => {
  e.preventDefault();

  const jsonItem = Array.from(e.dataTransfer.items).find(i => i.type === 'application/json+package');
  if (jsonItem) {
    const s = await new Promise((resolve, reject) => {
      jsonItem.getAsString(resolve);
    });
    const j = JSON.parse(s);
    const {type, dataHash} = j;
    if (dataHash) {
      _updateRaycasterFromMouseEvent(raycaster, e);
      localMatrix.compose(
        localVector.copy(raycaster.ray.origin)
          .add(localVector2.copy(raycaster.ray.direction).multiplyScalar(2)),
        localQuaternion.set(0, 0, 0, 1),
        localVector2.set(1, 1, 1)
      )
        .premultiply(localMatrix2.getInverse(currentChunkMesh.matrixWorld))
        .decompose(localVector, localQuaternion, localVector2);

      const sx = Math.floor(localVector.x/currentChunkMesh.subparcelSize);
      const sy = Math.floor(localVector.y/currentChunkMesh.subparcelSize);
      const sz = Math.floor(localVector.z/currentChunkMesh.subparcelSize);
      planet.editSubparcel(sx, sy, sz, subparcel => {
        subparcel.packages.push({
          dataHash,
          position: localVector.toArray(),
          quaternion: localQuaternion.toArray(),
        });
      });

      // const p = await XRPackage.download(dataHash);
      // await _addPackage(p, localMatrix);
    }
  }
});
/* const _getTokenHtml = cardData => {
  const {index, name, img, metadataHash, dataHash, modelHash} = cardData;
  return `\
    <div class="token card">
      <a href="/run.html?i=${index}">
        <img src="${img}" width=256 height=256>
      </a>
      <div class=text>
        <div class="name cardTitle">${name}</div>
        <input type=text value="xrpk install ${index}" readonly class="cardCode">
        <nav class="cardAction add-action"><span>Add</span><i class="fa fa-chevron-right"></i></nav>
        <a href="/run.html?i=${index}" target="_blank" class="cardAction"><span>Test</span><i class="fa fa-chevron-right"></i></a>
        <a href="https://cryptopolys.com/create.html?o=${encodeURIComponent(metadataHash)}" class="cardAction"><span>Edit</span><i class="fa fa-chevron-right"></i></a>
        <a href="https://ipfs.exokit.org/ipfs/${dataHash}.wbn" class="cardAction"><span>Download package</span><i class="fa fa-chevron-right"></i></a>
        <a href="https://ipfs.exokit.org/ipfs/${modelHash}.glb" class="cardAction"><span>Download model</span><i class="fa fa-chevron-right"></i></a>
        <a href="https://${network}.opensea.io/assets/${address}/${index}" class="cardAction"><span>Opensea</span><i class="fa fa-chevron-right"></i></a>
      </div>
    </div>
  `;
};
(async () => {
  const totalObjects = await contract.methods.getNonce().call();
  const ts = [];
  for (let i = 1; i <= totalObjects; i++) {
    const t = await getTokenByIndex(i);
    ts.push(t);
    const h = _getTokenHtml(t);
    tokens.innerHTML += h;

    Array.from(tokens.querySelectorAll('.token')).forEach((token, i) => {
      const addAction = token.querySelector('.add-action');
      addAction.addEventListener('click', async e => {
        const t = ts[i];
        const {dataHash} = t;
        const p = await XRPackage.download(dataHash);
        p.hash = dataHash;
        pe.add(p);
      });
      const input = token.querySelector('input');
      input.addEventListener('click', e => {
        input.select();
      });
    });
  }
})(); */
/* const scenes = document.getElementById('scenes');
(async () => {
  const res = await fetch(scenesEndpoint);
  const children = await res.json();
  const ss = await Promise.all(children.map(child =>
    fetch(scenesEndpoint + '/' + child)
      .then(res => res.json())
  ));
  scenes.innerHTML = ss.map(s => `
    <div class=scene>${s.name}</div>
  `).join('\n');
  Array.from(scenes.querySelectorAll('.scene')).forEach((s, i) => {
    s.addEventListener('click', async e => {
      const s = ss[i];
      const {hash} = s;
      pe.downloadScene(hash);
    });
  });
})();
const worldTools = document.getElementById('world-tools');
const publishWorldButton = document.getElementById('publish-world-button');
publishWorldButton.addEventListener('click', async e => {
  let hash;
  if (worldType === 'singleplayer') {
    hash = await pe.uploadScene();
  } else if (worldType === 'multiplayer') {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    hash = Array.prototype.map.call(array, x => ('00' + x.toString(16)).slice(-2)).join('');
  }

  const w = {
    name: 'WebXR world',
    description: 'This is a world description',
    hash,
    type: worldType,
  };
  const res = await fetch(worldsEndpoint + '/' + hash, {
    method: 'PUT',
    body: JSON.stringify(w),
  });
  if (res.ok) {
    worlds.innerHTML += '\n' + _makeWorldHtml(w);
    const ws = Array.from(worlds.querySelectorAll('.world'));
    Array.from(worlds.querySelectorAll('.world')).forEach(w => _bindWorld(w));
    const newW = ws[ws.length - 1];
    newW.click();
  } else {
    console.warn('invalid status code: ' + res.status);
  }
}); */
/* const sandboxButton = document.getElementById('sandbox-button');
sandboxButton.addEventListener('click', e => {
  _pushWorld(null);
});
function makeId(length) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const newWorldButton = document.getElementById('new-world-button');
newWorldButton.addEventListener('click', async e => {
  pe.reset();
  const hash = await pe.uploadScene();

  const screenshotBlob = await screenshotEngine();
  const {hash: previewIconHash} = await fetch(`${apiHost}/`, {
    method: 'PUT',
    body: screenshotBlob,
  })
    .then(res => res.json());

  const worldId = makeId(8);
  const w = {
    id: worldId,
    name: worldId,
    description: 'This is a world description',
    hash,
    previewIconHash,
    objects: [],
  };
  const res = await fetch(worldsEndpoint + '/' + w.name, {
    method: 'PUT',
    body: JSON.stringify(w),
  });
  if (res.ok) {
    worlds.innerHTML += '\n' + _makeWorldHtml(w);
    const ws = Array.from(worlds.querySelectorAll('.world'));
    Array.from(worlds.querySelectorAll('.world')).forEach(w => _bindWorld(w));
    const newW = ws[ws.length - 1];
    newW.click();
  } else {
    console.warn('invalid status code: ' + res.status);
  }
}); */

const objectsEl = document.getElementById('objects');
const _getObjectDetailEls = () => {
  const objectDetail = objectsEl.querySelector('.object-detail');
  if (objectDetail) {
    const positionX = objectDetail.querySelector('.position-x');
    const positionY = objectDetail.querySelector('.position-y');
    const positionZ = objectDetail.querySelector('.position-z');
    const quaternionX = objectDetail.querySelector('.quaternion-x');
    const quaternionY = objectDetail.querySelector('.quaternion-y');
    const quaternionZ = objectDetail.querySelector('.quaternion-z');
    const quaternionW = objectDetail.querySelector('.quaternion-w');
    const scaleX = objectDetail.querySelector('.scale-x');
    const scaleY = objectDetail.querySelector('.scale-y');
    const scaleZ = objectDetail.querySelector('.scale-z');
    return {
      positionX,
      positionY,
      positionZ,
      quaternionX,
      quaternionY,
      quaternionZ,
      quaternionW,
      scaleX,
      scaleY,
      scaleZ,
    };
  } else {
    return null;
  }
};
const _updateObjectDetailsTransform = matrix => {
  matrix.decompose(localVector, localQuaternion, localVector2);
  const details = _getObjectDetailEls();
  if (details) {
    const {
      positionX,
      positionY,
      positionZ,
      quaternionX,
      quaternionY,
      quaternionZ,
      quaternionW,
      scaleX,
      scaleY,
      scaleZ,
    } = details;

    positionX.value = localVector.x;
    positionY.value = localVector.y;
    positionZ.value = localVector.z;
    quaternionX.value = localQuaternion.x;
    quaternionY.value = localQuaternion.y;
    quaternionZ.value = localQuaternion.z;
    quaternionW.value = localQuaternion.w;
    scaleX.value = localVector2.x;
    scaleY.value = localVector2.y;
    scaleZ.value = localVector2.z;
  }
};
const _bindObjectDetails = p => {
  const {
    positionX,
    positionY,
    positionZ,
    quaternionX,
    quaternionY,
    quaternionZ,
    quaternionW,
    scaleX,
    scaleY,
    scaleZ,
  } = _getObjectDetailEls();
  
  const _setPosition = (e, key) => {
    p.matrix.decompose(localVector, localQuaternion, localVector2);
    localVector[key] = parseFloat(e.target.value);
    p.setMatrix(localMatrix.compose(localVector, localQuaternion, localVector2));
  };
  const _setQuaternion = (e, key) => {
    p.matrix.decompose(localVector, localQuaternion, localVector2);
    localQuaternion[key] = e.target.value;
    localQuaternion.normalize();
    ['x', 'y', 'z', 'w'].forEach(k => {
      objectsEl.querySelector('.quaternion-' + k).value = parseFloat(localQuaternion[k]);
    });
    p.setMatrix(localMatrix.compose(localVector, localQuaternion, localVector2));
  };
  const _setScale = (e, key) => {
    p.matrix.decompose(localVector, localQuaternion, localVector2);
    localVector2[key] = parseFloat(e.target.value);
    p.setMatrix(localMatrix.compose(localVector, localQuaternion, localVector2));
  };
  positionX.addEventListener('change', e => {
    _setPosition(e, 'x');
  });
  positionY.addEventListener('change', e => {
    _setPosition(e, 'y');
  });
  positionZ.addEventListener('change', e => {
    _setPosition(e, 'z');
  });
  quaternionX.addEventListener('change', e => {
    _setQuaternion(e, 'x');
  });
  quaternionY.addEventListener('change', e => {
    _setQuaternion(e, 'y');
  });
  quaternionZ.addEventListener('change', e => {
    _setQuaternion(e, 'z');
  });
  quaternionW.addEventListener('change', e => {
    _setQuaternion(e, 'w');
  });
  scaleX.addEventListener('change', e => {
    _setScale(e, 'x');
  });
  scaleY.addEventListener('change', e => {
    _setScale(e, 'y');
  });
  scaleZ.addEventListener('change', e => {
    _setScale(e, 'z');
  });
};
const _renderObjects = () => {
  if (selectTarget) {
    const {package: p} = selectTarget;
    const schemas = Object.keys(p.schema);
    objectsEl.innerHTML = `
      <div class=object-detail>
        <h1><nav class=back-button><i class="fa fa-arrow-left"></i></nav>${p.name}</h1>
        <img class=screenshot draggable=true style="display: none;">
        ${p.hash ? `\
          <nav class="button inspect-button">Inspect</nav>
          <nav class="button wear-button">Wear</nav>
        ` : `\
          <nav class="button upload-button">Upload</nav>
        `}
        <nav class="button remove-button">Remove</nav>
        <b>Position</b>
        <div class=row>
          <label>
            <span>X</span>
            <input type=number class=position-x value=0 step=0.1>
          </label>
          <label>
            <span>Y</span>
            <input type=number class=position-y value=0 step=0.1>
          </label>
          <label>
            <span>Z</span>
            <input type=number class=position-z value=0 step=0.1>
          </label>
        </div>
        <b>Quaternion</b>
        <div class=row>
          <label>
            <span>X</span>
            <input type=number class=quaternion-x value=0 step=0.1>
          </label>
          <label>
            <span>Y</span>
            <input type=number class=quaternion-y value=0 step=0.1>
          </label>
          <label>
            <span>Z</span>
            <input type=number class=quaternion-z value=0 step=0.1>
          </label>
          <label>
            <span>W</span>
            <input type=number class=quaternion-w value=1 step=0.1>
          </label>
        </div>
        <b>Scale</b>
        <div class=row>
          <label>
            <span>X</span>
            <input type=number class=scale-x value=1 step=0.1>
          </label>
          <label>
            <span>Y</span>
            <input type=number class=scale-y value=1 step=0.1>
          </label>
          <label>
            <span>Z</span>
            <input type=number class=scale-z value=1 step=0.1>
          </label>
        </div>
        ${schemas.length > 0 ? `
          <b>Schema</b>
          <div class=row>
            ${schemas.map(name => `
              <label class=schema>
                <span class=name>${name}</span>
                <input class="schema-input" name="${escape(name)}" type=text value="${escape(p.schema[name])}">
              </label>
            `).join('\n')}
          </div>
        ` : ''}
      </div>
    `;
    const backButton = objectsEl.querySelector('.back-button');
    backButton.addEventListener('click', e => {
      _setSelectTarget(null);
    });
    (async () => {
      const img = objectsEl.querySelector('.screenshot');
      const u = await p.getScreenshotImageUrl();
      img.src = u;
      img.onload = () => {
        URL.revokeObjectURL(u);
        img.style.display = null;
      };
      img.onerror = err => {
        console.warn(err);
        URL.revokeObjectURL(u);
      };
      img.addEventListener('dragstart', e => {
        _startPackageDrag(e, {
          name: p.name,
          id: p.id,
        });
      });
    })();
    if (p.hash) {
      const inspectButton = objectsEl.querySelector('.inspect-button');
      inspectButton.addEventListener('click', async e => {
        const b = new Blob([p.data], {
          type: 'application/webbundle',
        });
        const u = URL.createObjectURL(b);
        window.open(`inspect.html?u=${u}`, '_blank');
      });
      const wearButton = objectsEl.querySelector('.wear-button');
      wearButton.addEventListener('click', async e => {
        const dataHash = await p.getHash();
        loginManager.setAvatar(dataHash);
      });
    } else {
      const uploadButton = objectsEl.querySelector('.upload-button');
      uploadButton.addEventListener('click', async e => {
        const {hash} = await fetch(`${apiHost}/`, {
          method: 'PUT',
          body: p.data,
        })
          .then(res => res.json());
        p.hash = hash;
        _renderObjects();
      });
    }
    const removeButton = objectsEl.querySelector('.remove-button');
    removeButton.addEventListener('click', e => {
      pe.remove(p);
    });
 
    _updateObjectDetailsTransform(p.matrix);
    _bindObjectDetails(p);

    Array.from(objectsEl.querySelectorAll('.schema-input')).forEach(schemaInput => {
      const name = schemaInput.getAttribute('name');
      const value = p.schema[name] || '';
      schemaInput.value = value;
      schemaInput.addEventListener('change', e => {
        const value = e.target.value;
        p.setSchema(name, value);
      });
    });
  } else {
    if (pe.children.length > 0) {
      const _renderChildren = (objectsEl, children, depth) => {
        objectsEl.innerHTML = children.map((p, i) => `
          <div class="object depth-${depth}" draggable=true packageid="${p.id}" index="${i}">
            <span class=name>${p.name}</span>
            <nav class=close-button><i class="fa fa-times"></i></nav>
          </div>
          <div class=children></div>
        `).join('\n');
        const packageEls = Array.from(objectsEl.querySelectorAll('.object'));
        const childrenEls = Array.from(objectsEl.querySelectorAll('.children'));
        packageEls.forEach((packageEl, i) => {
          const index = parseInt(packageEl.getAttribute('index'), 10);
          const p = children[i];
          const childrenEl = childrenEls[i];

          packageEl.addEventListener('dragstart', e => {
            e.dataTransfer.setData('application/json+object', JSON.stringify({
              index,
            }));
          });
          packageEl.addEventListener('dragover', e => {
            e.preventDefault();
          });
          packageEl.addEventListener('dragenter', e => {
            packageEl.classList.add('hover');
          });
          packageEl.addEventListener('dragleave', e => {
            packageEl.classList.remove('hover');
          });
          packageEl.addEventListener('drop', async e => {
            e.preventDefault();

            const jsonItem = Array.from(e.dataTransfer.items).find(i => i.type === 'application/json+object');
            if (jsonItem) {
              const s = await new Promise((resolve, reject) => {
                jsonItem.getAsString(resolve);
              });
              const j = JSON.parse(s);
              const {index} = j;
              const cp = pe.children[index];

              localMatrix.copy(cp.matrixWorld)
                .premultiply(localMatrix2.getInverse(p.matrixWorld));
              cp.setMatrix(localMatrix);
              p.add(cp);
            }
          });
          packageEl.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            document.querySelector('.tool[tool="select"]').click();
            _setSelectTarget(p.volumeMesh);
          });
          const closeButton = packageEl.querySelector('.close-button');
          closeButton.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            p.parent.remove(p);
          });

          _renderChildren(childrenEl, p.children, depth + 1);
        });
      };
      _renderChildren(objectsEl, pe.children, 0);
      
      // wristMenu.objectsSide.setObjects(pe.children);
    } else {
      objectsEl.innerHTML = `<h1 class=placeholder>No objects in scene</h1>`;
    }
  }
};
_renderObjects();