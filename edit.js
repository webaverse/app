/* global Web3 */
/* eslint no-unused-vars: 0 */
import * as THREE from './three.module.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import {OrbitControls} from './OrbitControls.js';
import {GLTFLoader} from './GLTFLoader.js';
import {GLTFExporter} from './GLTFExporter.js';
import {BasisTextureLoader} from './BasisTextureLoader.js';
import {TransformControls} from './TransformControls.js';
// import {XRPackage, pe, renderer, scene, camera, parcelMaterial, floorMesh, proxySession, getRealSession, loginManager} from './run.js';
import {tryLogin, loginManager} from './login.js';
import {downloadFile, mergeMeshes} from './util.js';
// import {wireframeMaterial, getWireframeMesh, meshIdToArray, decorateRaycastMesh, VolumeRaycaster} from './volume.js';
// import './gif.js';
import {RigManager} from './rig.js';
import {makeCubeMesh, /*makeUiFullMesh,*/ makeTextMesh, makeToolsMesh, makeDetailsMesh, makeInventoryMesh, makeColorsMesh, makeIconMesh, intersectUi, makeRayMesh} from './vr-ui.js';
import {makeLineMesh, makeTeleportMesh} from './teleport.js';
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
import alea from './alea.js';
import easing from './easing.js';
import {planet} from './planet.js';
import {player} from './player.js';
import {Bot} from './bot.js';
import {Sky} from './Sky.js';
import {GuardianMesh} from './land.js';
import {storageHost} from './constants.js';
import app from './app-object.js';
import inventory from './inventory.js';

const zeroVector = new THREE.Vector3(0, 0, 0);
const capsuleUpQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
const pid4 = Math.PI / 4;
const leftHandOffset = new THREE.Vector3(0.2, -0.2, -0.3);
const rightHandOffset = new THREE.Vector3(-0.2, -0.2, -0.3);
// const redColorHex = new THREE.Color(0xef5350).multiplyScalar(2).getHex();

const baseHeight = PARCEL_SIZE / 2 - 10;
const thingTextureSize = 4096;
const objectTextureSize = 512;

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

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

(async () => {
  await tryLogin();
})(); 

const loadPromise = makePromise();

const scene = new THREE.Scene();
const rigManager = new RigManager(scene);
planet.setBindings(scene, rigManager);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2);
camera.rotation.order = 'YXZ';
// camera.quaternion.set(0, 0, 0, 1);
const dolly = new THREE.Object3D();
dolly.add(camera);
scene.add(dolly);

const canvas = document.getElementById('canvas');
const context = canvas.getContext('webgl2', {
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: false,
});
const renderer = new THREE.WebGLRenderer({
  canvas,
  context,
  antialias: true,
  alpha: true,
  // preserveDrawingBuffer: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = false;
renderer.sortObjects = false;
renderer.physicallyCorrectLights = true;
renderer.xr.enabled = true;

app.renderer = renderer;
app.scene = scene;
app.camera = camera;

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
let skybox2 = null;

/* const _loadGltf = u => new Promise((accept, reject) => {
  new GLTFLoader().load(u, o => {
    o = o.scene;
    accept(o);
  }, xhr => {}, reject);
}); */
const _getStringLength = (uint8Array, offset) => {
  let i;
  for (i = 0; i < uint8Array.length; i++, offset++) {
    if (uint8Array[offset] === 0) {
      break;
    }
  }
  return i;
};
const _makeHitTracker = (onDmg, onPositionUpdate, onColorUpdate, onRemove) => {
  let animation = null;
  return {
    hit(id, position, quaternion, dmg) {
      if (animation) {
        animation.end();
        animation = null;
      }

      if (onDmg(id, dmg)) {
        const startTime = Date.now();
        const endTime = startTime + 500;
        animation = {
          update() {
            const now = Date.now();
            const factor = (now - startTime) / (endTime - startTime);
            if (factor < 1) {
              localVector2.set(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2).multiplyScalar((1 - factor) * 0.2 / 2);
              onPositionUpdate(localVector2);
            } else {
              animation.end();
              animation = null;
            }
          },
          end() {
            onPositionUpdate(localVector2.set(0, 0, 0));
            onColorUpdate(-1);
          },
        };
        onColorUpdate(id);
      } else {
        onRemove(id, position, quaternion);
      }
    },
    update() {
      animation && animation.update();
    },
  };
};
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
const _makeHeightfieldShader = land => ({
  uniforms: {
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    tex: {
      type: 't',
      value: null,
      needsUpdate: true,
    },
    sunIntensity: {
      type: 'f',
      value: 1,
      needsUpdate: true,
    },
    sunDirection: {
      type: 'v3',
      value: new THREE.Vector3(),
      needsUpdate: true,
    },
    uSelectRange: {
      type: 'v4',
      value: new THREE.Vector4().setScalar(NaN),
      needsUpdate: true,
    },
    // "parallaxScale": { value: 0.5 },
    // "parallaxMinLayers": { value: 25 },
    // "parallaxMaxLayers": { value: 30 },
  },
  vertexShader: `\
    precision highp float;
    precision highp int;

    uniform vec4 uSelectRange;

    // attribute vec3 barycentric;
    attribute float ao;
    attribute float skyLight;
    attribute float torchLight;

    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vBarycentric;
    varying float vAo;
    varying float vSkyLight;
    varying float vTorchLight;
    varying vec3 vSelectColor;

    ${land ? '' : `\
    varying vec3 ts_view_pos;
    varying vec3 ts_frag_pos;
    varying vec3 vTang;
    varying vec3 vBitang;
    `}
    varying vec2 vWorldUv;

    /* float transpose(float m) {
      return m;
    }
    mat2 transpose(mat2 m) {
      return mat2(m[0][0], m[1][0],
                  m[0][1], m[1][1]);
    }
    mat3 transpose(mat3 m) {
      return mat3(m[0][0], m[1][0], m[2][0],
                  m[0][1], m[1][1], m[2][1],
                  m[0][2], m[1][2], m[2][2]);
    }
    mat4 transpose(mat4 m) {
      return mat4(m[0][0], m[1][0], m[2][0], m[3][0],
                  m[0][1], m[1][1], m[2][1], m[3][1],
                  m[0][2], m[1][2], m[2][2], m[3][2],
                  m[0][3], m[1][3], m[2][3], m[3][3]);
    } */

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vViewPosition = -mvPosition.xyz;
      vUv = uv;
      // vBarycentric = barycentric;
      float vid = float(gl_VertexID);
      if (mod(vid, 3.) < 0.5) {
        vBarycentric = vec3(1., 0., 0.);
      } else if (mod(vid, 3.) < 1.5) {
        vBarycentric = vec3(0., 1., 0.);
      } else {
        vBarycentric = vec3(0., 0., 1.);
      }
      vAo = ao/27.0;
      vSkyLight = skyLight/8.0;
      vTorchLight = torchLight/8.0;

      vSelectColor = vec3(0.);
      if (
        position.x >= uSelectRange.x &&
        position.z >= uSelectRange.y &&
        position.x < uSelectRange.z &&
        position.z < uSelectRange.w
      ) {
        vSelectColor = vec3(${new THREE.Color(0x4fc3f7).toArray().join(', ')});
      }

      vec3 vert_tang;
      vec3 vert_bitang;
      if (abs(normal.y) < 0.05) {
        if (abs(normal.x) > 0.95) {
          vert_bitang = vec3(0., 1., 0.);
          vert_tang = normalize(cross(vert_bitang, normal));
          vWorldUv = vec2(dot(position, vert_tang), dot(position, vert_bitang));
        } else {
          vert_bitang = vec3(0., 1., 0.);
          vert_tang = normalize(cross(vert_bitang, normal));
          vWorldUv = vec2(dot(position, vert_tang), dot(position, vert_bitang));
        }
      } else {
        vert_tang = vec3(1., 0., 0.);
        vert_bitang = normalize(cross(vert_tang, normal));
        vWorldUv = vec2(dot(position, vert_tang), dot(position, vert_bitang));
      }
      vWorldUv /= 4.0;
      vec3 vert_norm = normal;

      vec3 t = normalize(normalMatrix * vert_tang);
      vec3 b = normalize(normalMatrix * vert_bitang);
      vec3 n = normalize(normalMatrix * vert_norm);
      mat3 tbn = transpose(mat3(t, b, n));

      ${land ? '' : `\
      ts_view_pos = tbn * vec3(0.);
      ts_frag_pos = tbn * vec3(modelViewMatrix * vec4(position, 1.0));
      vTang = vert_tang;
      vBitang = vert_bitang;
      `}
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;

    #define PI 3.1415926535897932384626433832795

    uniform float sunIntensity;
    uniform sampler2D tex;
    uniform float uTime;
    uniform vec3 sunDirection;
    float parallaxScale = 0.3;
    float parallaxMinLayers = 50.;
    float parallaxMaxLayers = 50.;

    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vBarycentric;
    varying float vAo;
    varying float vSkyLight;
    varying float vTorchLight;
    varying vec3 vSelectColor;

    ${land ? '' : `\
    varying vec3 ts_view_pos;
    varying vec3 ts_frag_pos;
    varying vec3 vTang;
    varying vec3 vBitang;
    `}
    varying vec2 vWorldUv;

    float edgeFactor() {
      vec3 d = fwidth(vBarycentric);
      vec3 a3 = smoothstep(vec3(0.0), d, vBarycentric);
      return min(min(a3.x, a3.y), a3.z);
    }

    vec2 tileSize = vec2(16./2048.);
    vec4 fourTapSample(
      vec2 tileOffset,
      vec2 tileUV,
      sampler2D atlas
    ) {
      //Initialize accumulators
      vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
      float totalWeight = 0.0;

      for(int dx=0; dx<2; ++dx)
      for(int dy=0; dy<2; ++dy) {
        //Compute coordinate in 2x2 tile patch
        vec2 tileCoord = 2.0 * fract(0.5 * (tileUV + vec2(dx,dy)));

        //Weight sample based on distance to center
        float w = pow(1.0 - max(abs(tileCoord.x-1.0), abs(tileCoord.y-1.0)), 16.0);

        //Compute atlas coord
        vec2 atlasUV = tileOffset + tileSize * tileCoord;

        //Sample and accumulate
        color += w * texture2D(atlas, atlasUV);
        totalWeight += w;
      }

      //Return weighted color
      return color / totalWeight;
    }
    float fourTapSample1(
      vec2 tileOffset,
      vec2 tileUV,
      sampler2D atlas
    ) {
      //Initialize accumulators
      float color = 0.0;
      float totalWeight = 0.0;

      for(int dx=0; dx<2; ++dx)
      for(int dy=0; dy<2; ++dy) {
        //Compute coordinate in 2x2 tile patch
        vec2 tileCoord = 2.0 * fract(0.5 * (tileUV + vec2(dx,dy)));

        //Weight sample based on distance to center
        float w = pow(1.0 - max(abs(tileCoord.x-1.0), abs(tileCoord.y-1.0)), 16.0);

        //Compute atlas coord
        vec2 atlasUV = tileOffset + tileSize * tileCoord;

        //Sample and accumulate
        color += w * texture2D(atlas, atlasUV).r;
        totalWeight += w;
      }

      //Return weighted color
      return color / totalWeight;
    }
    vec3 fourTapSample3(
      vec2 tileOffset,
      vec2 tileUV,
      sampler2D atlas
    ) {
      //Initialize accumulators
      vec3 color = vec3(0.0, 0.0, 0.0);
      float totalWeight = 0.0;

      for(int dx=0; dx<2; ++dx)
      for(int dy=0; dy<2; ++dy) {
        //Compute coordinate in 2x2 tile patch
        vec2 tileCoord = 2.0 * fract(0.5 * (tileUV + vec2(dx,dy)));

        //Weight sample based on distance to center
        float w = pow(1.0 - max(abs(tileCoord.x-1.0), abs(tileCoord.y-1.0)), 16.0);

        //Compute atlas coord
        vec2 atlasUV = tileOffset + tileSize * tileCoord;

        //Sample and accumulate
        color += w * texture2D(atlas, atlasUV).rgb;
        totalWeight += w;
      }

      //Return weighted color
      return color / totalWeight;
    }

    float sampleHeight(vec2 tileOffset, vec2 uv) {
      tileOffset.x += 16.*2.*2./2048.;
      // return fourTapSample1(tileOffset, uv, tex);
      // vec2 texcoord = tileOffset + uv * tileSize;
      // return texture2DGradEXT(tex, texcoord, dFdx(texcoord), dFdy(texcoord)).r;
      uv = mod(uv, 1.0);
      // uv = floor(uv*16.)/16.;
      /* if (uv.x < 0.5) {
        uv.x += 1.;
      }
      if (uv.y < 0.5) {
        uv.y += 1.;
      } */
      return texture2D(tex, tileOffset + uv * tileSize).r;
    }

${land ? '' : `\
#define USE_STEEP_PARALLAX 1

#ifdef USE_BASIC_PARALLAX
  vec2 parallaxMap( vec2 tileOffset, vec2 vUv, vec3 V ) {
    float initialHeight = sampleHeight( tileOffset, vUv );
    vec2 texCoordOffset = parallaxScale * V.xy * initialHeight;
    return vUv - texCoordOffset;
  }
#else
  vec2 parallaxMap( vec2 tileOffset, vec2 vUv, vec3 V ) {
    float numLayers = mix( parallaxMaxLayers, parallaxMinLayers, abs( dot( vec3( 0.0, 0.0, 1.0 ), V ) ) );
    float layerHeight = 1.0 / numLayers;
    float currentLayerHeight = 0.0;
    vec2 dtex = parallaxScale * V.xy / V.z / numLayers;
    vec2 currentTextureCoords = vUv;
    float heightFromTexture = sampleHeight( tileOffset, currentTextureCoords );

    vec3 pos = floor((vTang * currentTextureCoords.x + vBitang * currentTextureCoords.y) * 16.)/16.;
    heightFromTexture *= 0.3 + (1.0+sin((length(pos) - mod(uTime*30., 1.)) * PI*2.))/2.*0.5;

    for ( int i = 0; i < 50; i += 1 ) {
      if ( heightFromTexture <= currentLayerHeight ) {
        break;
      }
      currentLayerHeight += layerHeight;
      currentTextureCoords -= dtex;
      heightFromTexture = sampleHeight( tileOffset, currentTextureCoords );

      vec3 pos = floor((vTang * currentTextureCoords.x + vBitang * currentTextureCoords.y) * 16.)/16.;
      heightFromTexture *= 0.3 + (1.0+sin((length(pos) - mod(uTime*30., 1.)) * PI*2.))/2.*0.5;
    }
    #ifdef USE_STEEP_PARALLAX
      return currentTextureCoords;
    #elif defined( USE_RELIEF_PARALLAX )
      vec2 deltaTexCoord = dtex / 2.0;
      float deltaHeight = layerHeight / 2.0;
      currentTextureCoords += deltaTexCoord;
      currentLayerHeight -= deltaHeight;
      const int numSearches = 5;
      for ( int i = 0; i < numSearches; i += 1 ) {
        deltaTexCoord /= 2.0;
        deltaHeight /= 2.0;
        heightFromTexture = sampleHeight( tileOffset, currentTextureCoords );
        if( heightFromTexture > currentLayerHeight ) {
          currentTextureCoords -= deltaTexCoord;
          currentLayerHeight += deltaHeight;
        } else {
          currentTextureCoords += deltaTexCoord;
          currentLayerHeight -= deltaHeight;
        }
      }
      return currentTextureCoords;
    #elif defined( USE_OCLUSION_PARALLAX )
      vec2 prevTCoords = currentTextureCoords + dtex;
      float nextH = heightFromTexture - currentLayerHeight;
      float prevH = sampleHeight( tileOffset, prevTCoords ) - currentLayerHeight + layerHeight;
      float weight = nextH / ( nextH - prevH );
      return prevTCoords * weight + currentTextureCoords * ( 1.0 - weight );
    #else
      return vUv;
    #endif
  }
#endif
`}

    void main() {
      vec2 worldUv = vWorldUv;
      /* ${land ? '' : `\
      vec3 view_dir = normalize(ts_view_pos - ts_frag_pos);
      worldUv = parallaxMap(vUv, worldUv, view_dir);
      `} */
      worldUv = mod(worldUv, 1.0);

      vec3 c = fourTapSample3(vUv, worldUv, tex);
      vec3 diffuseColor = c;
      if (edgeFactor() <= 0.99) {
        diffuseColor = mix(diffuseColor, vec3(1.0), max(1.0 - abs(pow(length(vViewPosition) - mod(uTime*60., 1.)*5.0, 3.0)), 0.0)*0.5);
        diffuseColor *= (0.9 + 0.1*min(gl_FragCoord.z/gl_FragCoord.w/10.0, 1.0));
      }
      diffuseColor += vSelectColor;
      float worldFactor = floor((sunIntensity * vSkyLight + vTorchLight) * 4.0 + 1.9) / 4.0 * vAo;
      float cameraFactor = floor(8.0 - length(vViewPosition))/8.;
      diffuseColor *= max(max(worldFactor, cameraFactor), 0.1);
      diffuseColor = mix(diffuseColor, vec3(0.2 + sunIntensity*0.8), gl_FragCoord.z/gl_FragCoord.w/100.0);

      float a = ${land ? '1.0' : '0.9'};
      gl_FragColor = vec4(diffuseColor, a);
    }
  `,
});
const LAND_SHADER = _makeHeightfieldShader(true);
const WATER_SHADER = _makeHeightfieldShader(false);
const VEGETATION_SHADER = {
  uniforms: {
    map: {
      type: 't',
      value: null,
      needsUpdate: true,
    },
    uHitId: {
      type: 'f',
      value: -1,
      needsUpdate: true,
    },
    uHitPosition: {
      type: 'v3',
      value: new THREE.Vector3(),
      needsUpdate: true,
    },
    uSelectId: {
      type: 'f',
      value: -1,
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

    uniform float uHitId;
    uniform vec3 uHitPosition;
    uniform float uSelectId;
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
      vSelectColor = vec3(0.);
      if (uHitId == id) {
        vSelectColor = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
        p += uHitPosition;
      }
      if (uSelectId == id) {
        vSelectColor = vec3(${new THREE.Color(0x4fc3f7).toArray().join(', ')});
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
      gl_FragColor = texture2D(map, vUv);
      gl_FragColor.rgb += vSelectColor;
      float worldFactor = floor((sunIntensity * vSkyLight + vTorchLight) * 4.0 + 1.9) / 4.0;
      float cameraFactor = floor(8.0 - length(vWorldPosition))/8.;
      gl_FragColor.rgb *= max(max(worldFactor, cameraFactor), 0.1);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.2 + sunIntensity*0.8), gl_FragCoord.z/gl_FragCoord.w/100.0);
    }
  `,
};
const THING_SHADER = {
  uniforms: {
    map: {
      type: 't',
      value: null,
      needsUpdate: true,
    },
    /* uHitId: {
      type: 'f',
      value: -1,
      needsUpdate: true,
    },
    uHitPosition: {
      type: 'v3',
      value: new THREE.Vector3(),
      needsUpdate: true,
    },
    uSelectId: {
      type: 'f',
      value: -1,
      needsUpdate: true,
    },
    sunIntensity: {
      type: 'f',
      value: 1,
      needsUpdate: true,
    }, */
  },
  vertexShader: `\
    attribute vec3 color;
    varying vec2 vUv;
    varying vec3 vColor;

    void main() {
      vUv = uv;
      vColor = color;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `\
    uniform sampler2D map;

    varying vec2 vUv;
    varying vec3 vColor;

    void main() {
      vec4 c = vec4(vColor, 1.);
      if (vUv.x >= 0.) {
        c *= texture2D(map, vUv);
      }
      gl_FragColor = c;
    }
  `,
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

// let chunkWorker = null;
// let physxWorker = null;
// let physicsWorker = null;
let geometrySet = null;
let tracker = null;
let landAllocators = null;
let landBufferAttributes = null;
let vegetationAllocators = null;
let vegetationBufferAttributes = null;
let thingAllocators = null;
let thingBufferAttributes = null;
// let culler = null;
const makeAnimal = null;
// let chunkMeshes = [];
const chunkMesh = null;
const worldContainer = new THREE.Object3D();
scene.add(worldContainer);
const chunkMeshContainer = new THREE.Object3D();
worldContainer.add(chunkMeshContainer);
let currentChunkMesh = null;
const currentChunkMeshId = getNextMeshId();
// let capsuleMesh = null;
let currentVegetationMesh = null;
let currentThingMesh = null;
let meshDrawer = null;
const buildMeshes = {
  walls: [null, null, null],
  platforms: [null, null, null],
  ramps: [null, null, null],
};
let woodMesh = null;
let stoneMesh = null;
let metalMesh = null;
const basisLoader = new BasisTextureLoader();
basisLoader.detectSupport(renderer);
const geometryWorker = (() => {
  class Allocator {
    constructor() {
      this.offsets = [];
    }

    alloc(constructor, size) {
      if (size > 0) {
        const offset = moduleInstance._malloc(size * constructor.BYTES_PER_ELEMENT);
        const b = new constructor(moduleInstance.HEAP8.buffer, moduleInstance.HEAP8.byteOffset + offset, size);
        b.offset = offset;
        this.offsets.push(offset);
        return b;
      } else {
        return new constructor(moduleInstance.HEAP8.buffer, 0, 0);
      }
    }

    freeAll() {
      for (let i = 0; i < this.offsets.length; i++) {
        moduleInstance._doFree(this.offsets[i]);
      }
      this.offsets.length = 0;
    }
  }

  const maxNumMessageArgs = 32;
  const messageSize =
    Int32Array.BYTES_PER_ELEMENT + // id
    Int32Array.BYTES_PER_ELEMENT + // method
    Int32Array.BYTES_PER_ELEMENT + // priority
    maxNumMessageArgs*Uint32Array.BYTES_PER_ELEMENT; // args
  const maxNumMessages = 1024;
  const callStackSize = maxNumMessages * messageSize;
  class CallStackMessage {
    constructor(ptr) {
      this.dataView = new DataView(moduleInstance.HEAP8.buffer, ptr, messageSize);
      this.offset = 3*Uint32Array.BYTES_PER_ELEMENT;
    }
    getId() {
      return this.dataView.getInt32(0, true);
    }
    getMethod() {
      return this.dataView.getInt32(Uint32Array.BYTES_PER_ELEMENT, true);
    }
    getPriority() {
      return this.dataView.getInt32(2*Uint32Array.BYTES_PER_ELEMENT, true);
    }
    setId(v) {
      this.dataView.setInt32(0, v, true);
    }
    setMethod(v) {
      this.dataView.setInt32(Uint32Array.BYTES_PER_ELEMENT, v, true);
    }
    setPriority(v) {
      this.dataView.setInt32(2*Uint32Array.BYTES_PER_ELEMENT, v, true);
    }
    pullU8Array(length) {
      const {offset} = this;
      this.offset += length;
      return new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + offset, length);;
    }
    pullF32Array(length) {
      const {offset} = this;
      this.offset += length*Float32Array.BYTES_PER_ELEMENT;
      return new Float32Array(this.dataView.buffer, this.dataView.byteOffset + offset, length);
    }
    pullI32() {
      const {offset} = this;
      this.offset += Int32Array.BYTES_PER_ELEMENT;
      return this.dataView.getInt32(offset, true);;
    }
    pullU32() {
      const {offset} = this;
      this.offset += Uint32Array.BYTES_PER_ELEMENT;
      return this.dataView.getUint32(offset, true);;
    }
    pullF32() {
      const {offset} = this;
      this.offset += Float32Array.BYTES_PER_ELEMENT;
      return this.dataView.getFloat32(offset, true);
    }
    pushU8Array(uint8Array) {
      new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, uint8Array.length).set(uint8Array);
      this.offset += uint8Array.byteLength;
    }
    pushF32Array(float32Array) {
      new Float32Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, float32Array.length).set(float32Array);
      this.offset += float32Array.byteLength;
    }
    pushI32(v) {
      this.dataView.setInt32(this.offset, v, true);
      this.offset += Int32Array.BYTES_PER_ELEMENT;
    }
    pushU32(v) {
      this.dataView.setUint32(this.offset, v, true);
      this.offset += Uint32Array.BYTES_PER_ELEMENT;
    }
    pushF32(v) {
      this.dataView.setFloat32(this.offset, v, true);
      this.offset += Float32Array.BYTES_PER_ELEMENT;
    }
    /* pullU8Array(length) {
      if (this.offset + length <= messageSize) {
        const result = new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, length);
        this.offset += length;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pullF32Array(length) {
      if (this.offset + length*Float32Array.BYTES_PER_ELEMENT <= messageSize) {
        const result = new Float32Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, length);
        this.offset += length*Float32Array.BYTES_PER_ELEMENT;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pullI32() {
      if (this.offset + Int32Array.BYTES_PER_ELEMENT <= messageSize) {
        const result = this.dataView.getInt32(this.offset, true);
        this.offset += Int32Array.BYTES_PER_ELEMENT;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pullU32() {
      if (this.offset + Uint32Array.BYTES_PER_ELEMENT <= messageSize) {
        const result = this.dataView.getUint32(this.offset, true);
        this.offset += Uint32Array.BYTES_PER_ELEMENT;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pullF32() {
      if (this.offset + Float32Array.BYTES_PER_ELEMENT <= messageSize) {
        const result = this.dataView.getFloat32(this.offset, true);
        this.offset += Float32Array.BYTES_PER_ELEMENT;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pushU8Array(uint8Array) {
      if (this.offset + uint8Array.byteLength <= messageSize) {
        new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, uint8Array.length).set(uint8Array);
        this.offset += uint8Array.byteLength;
      } else {
        throw new Error('message overflow');
      }
    }
    pushF32Array(float32Array) {
      if (this.offset + float32Array.byteLength <= messageSize) {
        new Float32Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, float32Array.length).set(float32Array);
        this.offset += float32Array.byteLength;
      } else {
        throw new Error('message overflow');
      }
    }
    pushI32(v) {
      if (this.offset + Int32Array.BYTES_PER_ELEMENT <= messageSize) {
        this.dataView.setInt32(this.offset, v, true);
        this.offset += Int32Array.BYTES_PER_ELEMENT;
      } else {
        throw new Error('message overflow');
      }
    }
    pushU32(v) {
      if (this.offset + Uint32Array.BYTES_PER_ELEMENT <= messageSize) {
        this.dataView.setUint32(this.offset, v, true);
        this.offset += Uint32Array.BYTES_PER_ELEMENT;
      } else {
        throw new Error('message overflow');
      }
    }
    pushF32(v) {
      if (this.offset + Float32Array.BYTES_PER_ELEMENT <= messageSize) {
        this.dataView.setFloat32(this.offset, v, true);
        this.offset += Float32Array.BYTES_PER_ELEMENT;
      } else {
        throw new Error('message overflow');
      }
    } */
  }
  class CallStack {
    constructor() {
      this.ptr = moduleInstance._malloc(callStackSize * 2 + Uint32Array.BYTES_PER_ELEMENT);
      this.dataView = new DataView(moduleInstance.HEAP8.buffer, this.ptr, callStackSize);

      this.outPtr = this.ptr + callStackSize;
      this.outDataView = new DataView(moduleInstance.HEAP8.buffer, this.ptr + callStackSize, callStackSize);

      this.outNumEntriesPtr = this.ptr + callStackSize * 2;
      this.outNumEntriesU32 = new Uint32Array(moduleInstance.HEAP8.buffer, this.outNumEntriesPtr, 1);

      this.numEntries = 0;
      this.nextCbId = 0;
    }

    allocRequest(method, prio, startCb, endCb) {
      const index = this.numEntries++;
      const offset = index * messageSize;
      const startMessage = new CallStackMessage(this.ptr + offset);

      const id = ++this.nextCbId;
      startMessage.setId(id);
      startMessage.setMethod(method);
      startMessage.setPriority(+prio);
      
      startCb(startMessage);
      cbIndex.set(id, endCb);
    }

    reset() {
      this.numEntries = 0;
    }
  }
  class ScratchStack {
    constructor() {
      const size = 1024*1024;
      this.ptr = moduleInstance._malloc(size);

      this.u8 = new Uint8Array(moduleInstance.HEAP8.buffer, this.ptr, size);
      this.u32 = new Uint32Array(moduleInstance.HEAP8.buffer, this.ptr, size/4);
      this.i32 = new Int32Array(moduleInstance.HEAP8.buffer, this.ptr, size/4);
      this.f32 = new Float32Array(moduleInstance.HEAP8.buffer, this.ptr, size/4);
    }
  }
  
  const modulePromise = makePromise();
  /* const INITIAL_INITIAL_MEMORY = 52428800;
  const WASM_PAGE_SIZE = 65536;
  const wasmMemory = new WebAssembly.Memory({
    "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
    "maximum": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
    "shared": true,
  }); */
  let localModuleInstance = null;
  let moduleInstance = null;
  let threadPool;
  let callStack;
  let scratchStack;
  // GeometryModule({
    // ENVIRONMENT_IS_PTHREAD: true,
    // wasmMemory,
    // buffer: wasmMemory.buffer,
    // noInitialRun: true,
    // noExitRuntime: true,
    Module.onRuntimeInitialized = function() {
      localModuleInstance = this;
    };
    Module.postRun = () => {
      moduleInstance = localModuleInstance;
      // moduleInstance._globalInit();
      callStack = new CallStack();
      scratchStack = new ScratchStack();
      threadPool = moduleInstance._makeThreadPool(1);
      // threadPool = moduleInstance._getThreadPool();
      modulePromise.accept();
    };
    if (Module.calledRun) {
      Module.onRuntimeInitialized();
      Module.postRun();
    }
  // });

  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  const localQuaternion2 = new THREE.Quaternion();

  let methodIndex = 0;
  const METHODS = {
    NULL: methodIndex++,
    makeArenaAllocator: methodIndex++,
    arenaAlloc: methodIndex++,
    arenaFree: methodIndex++,
    makeGeometrySet: methodIndex++,
    loadBake: methodIndex++,
    getGeometry: methodIndex++,
    getGeometries: methodIndex++,
    getGeometryKeys: methodIndex++,
    getAnimalGeometry: methodIndex++,
    marchObjects: methodIndex++,
    getHeight: methodIndex++,
    noise: methodIndex++,
    marchingCubes: methodIndex++,
    bakeGeometry: methodIndex++,
    getSubparcel: methodIndex++,
    releaseSubparcel: methodIndex++,
    chunk: methodIndex++,
    mine: methodIndex++,
    releaseMine: methodIndex++,
    light: methodIndex++,
    addObject: methodIndex++,
    removeObject: methodIndex++,
    releaseAddRemoveObject: methodIndex++,
    addThingGeometry: methodIndex++,
    addThing: methodIndex++,
  };
  let messageIndex = 0;
  const MESSAGES = {
    [--messageIndex]: function updateSubparcel(m) {
      const subparcelOffset = m.pullU32();
      const subparcelSize = m.pullU32();

      // const x = moduleInstance.HEAP32[subparcelOffset/Uint32Array.BYTES_PER_ELEMENT];
      // const y = moduleInstance.HEAP32[subparcelOffset/Uint32Array.BYTES_PER_ELEMENT + 1];
      // const z = moduleInstance.HEAP32[subparcelOffset/Uint32Array.BYTES_PER_ELEMENT + 2];
      const index = moduleInstance.HEAP32[subparcelOffset / Uint32Array.BYTES_PER_ELEMENT + 3];
      const uint8Array = moduleInstance.HEAPU8.slice(subparcelOffset, subparcelOffset + subparcelSize);
      storage.setRawTemp(`subparcel:${index}`, uint8Array);
      /* .then(() => {
          console.log('set raw ok', x, y, z, `subparcel:${index}`);
        }); */
    },
    [--messageIndex]: function updateGeometry(m) {
      {
        const positionsFreeEntry = m.pullU32();
        const normalsFreeEntry = m.pullU32();
        const uvsFreeEntry = m.pullU32();
        const aosFreeEntry = m.pullU32();
        const idsFreeEntry = m.pullU32();
        const skyLightsFreeEntry = m.pullU32();
        const torchLightsFreeEntry = m.pullU32();

        const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const normalsStart = moduleInstance.HEAPU32[normalsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const aosStart = moduleInstance.HEAPU32[aosFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

        const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const normalsCount = moduleInstance.HEAPU32[normalsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const aosCount = moduleInstance.HEAPU32[aosFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

        currentChunkMesh.updateGeometry({
          positionsStart,
          normalsStart,
          uvsStart,
          aosStart,
          idsStart,
          skyLightsStart,
          torchLightsStart,

          positionsCount,
          normalsCount,
          uvsCount,
          aosCount,
          idsCount,
          skyLightsCount,
          torchLightsCount,
        });
      }
      {
        const positionsFreeEntry = m.pullU32();
        const uvsFreeEntry = m.pullU32();
        const idsFreeEntry = m.pullU32();
        const indicesFreeEntry = m.pullU32();
        const skyLightsFreeEntry = m.pullU32();
        const torchLightsFreeEntry = m.pullU32();

        const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const indicesStart = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

        const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const indicesCount = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

        currentVegetationMesh.updateGeometry({
          positionsStart,
          uvsStart,
          idsStart,
          indicesStart,
          skyLightsStart,
          torchLightsStart,

          positionsCount,
          uvsCount,
          idsCount,
          indicesCount,
          skyLightsCount,
          torchLightsCount,
        });
      }
      {
        const positionsFreeEntry = m.pullU32();
        const uvsFreeEntry = m.pullU32();
        const atlasUvsFreeEntry = m.pullU32();
        const idsFreeEntry = m.pullU32();
        const indicesFreeEntry = m.pullU32();
        const skyLightsFreeEntry = m.pullU32();
        const torchLightsFreeEntry = m.pullU32();

        const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const atlasUvsStart = moduleInstance.HEAPU32[atlasUvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const indicesStart = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

        const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const atlasUvsCount = moduleInstance.HEAPU32[atlasUvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const indicesCount = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

        currentThingMesh.updateGeometry({
          positionsStart,
          uvsStart,
          atlasUvsStart,
          idsStart,
          indicesStart,
          skyLightsStart,
          torchLightsStart,

          positionsCount,
          uvsCount,
          atlasUvsCount,
          idsCount,
          indicesCount,
          skyLightsCount,
          torchLightsCount,
        });
      }
      {
        const textureOffset = m.pullU32();
        if (textureOffset) {
          // console.log('got texture update', textureOffset);
          const textureData = new Uint8Array(moduleInstance.HEAP8.buffer, textureOffset, thingTextureSize * thingTextureSize * 4);
          currentThingMesh.updateTexture(textureData);
        }
      }
      {
        const subparcelSharedPtr = m.pullU32();
        w.requestReleaseSubparcel(tracker, subparcelSharedPtr);
      }
    },
  };
  const cbIndex = new Map();
  const w = {};
  /* window.earcut = () => {
    const positionsData = Float32Array.from([
      0, 0, 0, 100, 100, 100, 100, 0,
    ]);
    for (let i = 0; i < positionsData.length; i++) {
      positionsData[i] /= 30;
    }
    const positions = w.alloc(Float32Array, positionsData.length);
    positions.set(positionsData);

    const holesData = Float32Array.from([
      75, 25, 75, 75, 25, 75, 25, 25,
    ]);
    for (let i = 0; i < holesData.length; i++) {
      holesData[i] /= 30;
    }
    const holes = w.alloc(Float32Array, holesData.length);
    holes.set(holesData);

    const holeCountsData = Uint32Array.from([
      4,
    ]);
    const holeCounts = w.alloc(Uint32Array, holeCountsData.length);
    holeCounts.set(holeCountsData);

    const pointsData = Float32Array.from([
      10, 10,
    ]);
    for (let i = 0; i < pointsData.length; i++) {
      pointsData[i] /= 30;
    }
    const points = w.alloc(Float32Array, pointsData.length);
    points.set(pointsData);

    const zData = Float32Array.from([
      0, 30, 10, 0,
      -10, -30, -20, -10,
      0,
    ]);
    for (let i = 0; i < zData.length; i++) {
      zData[i] /= 30;
    }
    const zs = w.alloc(Float32Array, zData.length);
    zs.set(zData);

    meshDrawer.drawPolygonize(positions, holes, holeCounts, points, 0.5, zs);
  }; */
  w.waitForLoad = () => modulePromise;
  w.alloc = (constructor, count) => {
    if (count > 0) {
      const size = constructor.BYTES_PER_ELEMENT * count;
      const ptr = moduleInstance._doMalloc(size);
      return new constructor(moduleInstance.HEAP8.buffer, ptr, count);
    } else {
      return new constructor(moduleInstance.HEAP8.buffer, 0, 0);
    }
  };
  w.free = ptr => {
    moduleInstance._doFree(ptr);
  };
  w.makeArenaAllocator = size => {
    const ptr = moduleInstance._makeArenaAllocator(size);
    const offset = moduleInstance.HEAP32[ptr / Uint32Array.BYTES_PER_ELEMENT];
    return {
      ptr,
      getAs(constructor) {
        return new constructor(moduleInstance.HEAP8.buffer, offset, size / constructor.BYTES_PER_ELEMENT);
      },
    };
  };
  w.makeGeometrySet = () => moduleInstance._makeGeometrySet();
  w.requestLoadBake = async (geometrySet, url) => {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();

    await new Promise((accept, reject) => {
      let data;
      callStack.allocRequest(METHODS.loadBake, true, m => {
        m.pushU32(geometrySet);

        data = w.alloc(Uint8Array, arrayBuffer.byteLength);
        data.set(new Uint8Array(arrayBuffer));
        m.pushU32(data.byteOffset);
        m.pushU32(data.byteLength);
      }, m => {
        w.free(data.byteOffset);
        accept();
      });
    });
  };
  w.requestGetGeometry = (geometrySet, name) => new Promise((accept, reject) => {
    let dstNameUint8Array;
    callStack.allocRequest(METHODS.getGeometry, true, m => {
      m.pushU32(geometrySet);

      const srcNameUint8Array = textEncoder.encode(name);
      dstNameUint8Array = w.alloc(Uint8Array, srcNameUint8Array.byteLength);
      dstNameUint8Array.set(srcNameUint8Array);
      m.pushU32(dstNameUint8Array.byteOffset);
      m.pushU32(dstNameUint8Array.byteLength);
    }, m => {
      const positionsOffset = m.pullU32();
      const uvsOffset = m.pullU32();
      // const colorsOffset = m.pullU32();
      const indicesOffset = m.pullU32();
      const numPositions = m.pullU32();
      const numUvs = m.pullU32();
      // const numColors = m.pullU32();
      const numIndices = m.pullU32();
      const aabbOffset = m.pullU32();;
      const boundingBox = new THREE.Box3(
        new THREE.Vector3().fromArray(moduleInstance.HEAPF32.subarray(aabbOffset/Float32Array.BYTES_PER_ELEMENT, aabbOffset/Float32Array.BYTES_PER_ELEMENT + 3)),
        new THREE.Vector3().fromArray(moduleInstance.HEAPF32.subarray(aabbOffset/Float32Array.BYTES_PER_ELEMENT + 3, aabbOffset/Float32Array.BYTES_PER_ELEMENT + 6)),
      );
      /* const height = boundingBox.getSize(new THREE.Vector3()).y;
      boundingBox.min.y += height/2;
      boundingBox.max.y += height/2; */

      const positions = new Float32Array(moduleInstance.HEAP8.buffer, positionsOffset, numPositions);
      const uvs = new Float32Array(moduleInstance.HEAP8.buffer, uvsOffset, numUvs);
      // const colors = new Float32Array(moduleInstance.HEAP8.buffer, colorsOffset, numColors);
      const indices = new Uint32Array(moduleInstance.HEAP8.buffer, indicesOffset, numIndices);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      // geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      renderer.geometries.update(geometry);

      geometry.boundingBox = boundingBox;

      w.free(dstNameUint8Array.byteOffset);

      accept(geometry);
    });
  });
  w.requestGetGeometries = (geometrySet, geometryRequests) => new Promise((accept, reject) => {
    let geometryRequestsOffset;
    callStack.allocRequest(METHODS.getGeometries, true, m => {
      m.pushU32(geometrySet);
      
      const geometryRequestSize = MAX_NAME_LENGTH + 10*Float32Array.BYTES_PER_ELEMENT;
      geometryRequestsOffset = moduleInstance._malloc(geometryRequestSize * geometryRequests.length);
      
      for (let i = 0; i < geometryRequests.length; i++) {
        const geometryRequest = geometryRequests[i];
        const {name, position, quaternion, scale} = geometryRequest;
        const geometryRequestOffset = geometryRequestsOffset + i*geometryRequestSize;

        const srcNameUint8Array = textEncoder.encode(name);
        const dstNameUint8Array = moduleInstance.HEAPU8.subarray(geometryRequestOffset, geometryRequestOffset + MAX_NAME_LENGTH);
        dstNameUint8Array.set(srcNameUint8Array);
        dstNameUint8Array[srcNameUint8Array.length] = 0;

        position.toArray(moduleInstance.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT);
        quaternion.toArray(moduleInstance.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT + 3);
        scale.toArray(moduleInstance.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT + 7);
      }
      
      m.pushU32(geometryRequestsOffset);
      m.pushU32(geometryRequests.length);
    }, m => {
      const positionsOffset = m.pullU32();
      const uvsOffset = m.pullU32();
      // const colorsOffset = m.pullU32();
      const indicesOffset = m.pullU32();
      const numPositions = m.pullU32();
      const numUvs = m.pullU32();
      // const numColors = m.pullU32();
      const numIndices = m.pullU32();

      const positions = new Float32Array(moduleInstance.HEAP8.buffer, positionsOffset, numPositions);
      const uvs = new Float32Array(moduleInstance.HEAP8.buffer, uvsOffset, numUvs);
      // const colors = new Float32Array(moduleInstance.HEAP8.buffer, colorsOffset, numColors);
      const indices = new Uint32Array(moduleInstance.HEAP8.buffer, indicesOffset, numIndices);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      // geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      renderer.geometries.update(geometry);

      w.free(positionsOffset);
      w.free(uvsOffset);
      // w.free(colorsOffset);
      w.free(indicesOffset);

      accept(geometry);
    });
  });
  w.requestGetGeometryKeys = geometrySet => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.getGeometryKeys, true, m => {
      m.pushU32(geometrySet);
    }, m => {
      const namesOffset = m.pullU32();
      const numNames = m.pullU32();
      
      const result = [];
      for (let i = 0; i < numNames; i++) {
        const nameOffset = namesOffset + i*MAX_NAME_LENGTH;
        const nameLength = (() => {
          let j;
          for (j = 0; j < MAX_NAME_LENGTH; j++) {
            if (moduleInstance.HEAPU8[nameOffset+j] === 0) {
              break;
            }
          }
          return j;
        })();
        const name = textDecoder.decode(moduleInstance.HEAPU8.slice(nameOffset, nameOffset + nameLength));
        result.push(name);
      }

      w.free(namesOffset);

      accept(result);
    });
  });
  w.requestAnimalGeometry = hash => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.getAnimalGeometry, false, m => {
      m.pushU32(geometrySet);
      m.pushU32(hash);
    }, m => {
      const positionsOffset = m.pullU32();
      const colorsOffset = m.pullU32();
      const indicesOffset = m.pullU32();
      const headsOffset = m.pullU32();
      const legsOffset = m.pullU32();
      const numPositions = m.pullU32();
      const numColors = m.pullU32();
      const numIndices = m.pullU32();
      const numHeads = m.pullU32();
      const numLegs = m.pullU32();
      const headPivot = m.pullF32Array(3);
      const aabb = m.pullF32Array(6);

      const positions = new Float32Array(moduleInstance.HEAP8.buffer, positionsOffset, numPositions);
      const colors = new Uint8Array(moduleInstance.HEAP8.buffer, colorsOffset, numColors);
      const indices = new Uint32Array(moduleInstance.HEAP8.buffer, indicesOffset, numIndices);
      const heads = new Float32Array(moduleInstance.HEAP8.buffer, headsOffset, numHeads);
      const legs = new Float32Array(moduleInstance.HEAP8.buffer, legsOffset, numLegs);

      accept({
        positions,
        colors,
        indices,
        heads,
        legs,
        headPivot,
        aabb,
      });
    });
  });
  /* w.requestMarchObjects = (x, y, z, geometrySet, subparcel, subparcelSpecs, allocators) => new Promise((accept, reject) => {
    let subparcelObjects;
    callStack.allocRequest(METHODS.marchObjects, false, offset => {
      const numSubparcelObjects = subparcelSpecs.length;
      subparcelObjects = w.alloc(Uint32Array, numSubparcelObjects);
      for (let i = 0; i < subparcelSpecs.length; i++) {
        subparcelObjects[i] = subparcelSpecs[i].offset;
      }

      callStack.u32[offset] = geometrySet;
      callStack.i32[offset + 1] = x;
      callStack.i32[offset + 2] = y;
      callStack.i32[offset + 3] = z;
      callStack.u32[offset + 4] = subparcel.offset;
      callStack.u32[offset + 5] = subparcelObjects.byteOffset;
      callStack.u32[offset + 6] = numSubparcelObjects;
      callStack.u32[offset + 7] = allocators.positions.ptr;
      callStack.u32[offset + 8] = allocators.uvs.ptr;
      callStack.u32[offset + 9] = allocators.ids.ptr;
      callStack.u32[offset + 10] = allocators.indices.ptr;
      callStack.u32[offset + 11] = allocators.skyLights.ptr;
      callStack.u32[offset + 12] = allocators.torchLights.ptr;
    }, offset => {
      const positionsFreeEntry = callStack.ou32[offset + 13];
      const uvsFreeEntry = callStack.ou32[offset + 14];
      const idsFreeEntry = callStack.ou32[offset + 15];
      const indicesFreeEntry = callStack.ou32[offset + 16];
      const skyLightsFreeEntry = callStack.ou32[offset + 17];
      const torchLightsFreeEntry = callStack.ou32[offset + 18];

      const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const idsStart = moduleInstance.HEAPU32[idsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const indicesStart = moduleInstance.HEAPU32[indicesFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];

      const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const idsCount = moduleInstance.HEAPU32[idsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const indicesCount = moduleInstance.HEAPU32[indicesFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];

      w.free(subparcelObjects.byteOffset);

      accept({
        positionsFreeEntry,
        uvsFreeEntry,
        idsFreeEntry,
        indicesFreeEntry,
        skyLightsFreeEntry,
        torchLightsFreeEntry,

        positionsStart,
        uvsStart,
        idsStart,
        indicesStart,
        skyLightsStart,
        torchLightsStart,

        positionsCount,
        uvsCount,
        idsCount,
        indicesCount,
        skyLightsCount,
        torchLightsCount,
      });
    });
  }); */
  w.requestGetHeight = (hash, x, y, z, baseHeight) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.getHeight, true, m => {
      m.pushI32(hash);
      m.pushF32(x);
      m.pushF32(y);
      m.pushF32(z);
      m.pushF32(baseHeight);
    }, m => {
      const height = m.pullF32();
      accept(height);
    });
  });
  /* const wormRate = 2;
  const wormRadiusBase = 2;
  const wormRadiusRate = 2;
  const objectsRate = 3;
  const potentialDefault = -0.5;
  w.requestNoise = (hash, x, y, z, baseHeight, subparcelOffset) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.noise, false, offset => {
      callStack.u32[offset] = hash;

      callStack.f32[offset + 1] = x;
      callStack.f32[offset + 2] = y;
      callStack.f32[offset + 3] = z;
      callStack.f32[offset + 4] = baseHeight;
      callStack.f32[offset + 5] = wormRate;
      callStack.f32[offset + 6] = wormRadiusBase;
      callStack.f32[offset + 7] = wormRadiusRate;
      callStack.f32[offset + 8] = objectsRate;
      callStack.f32[offset + 9] = potentialDefault;

      callStack.u32[offset + 10] = subparcelOffset;
    }, offset => {
      accept();
    });
  });
  w.requestMarchingCubes = (seed, meshId, x, y, z, potentials, biomes, heightfield, lightfield, allocators) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.marchingCubes, false, offset => {
      callStack.f32[offset] = meshId;

      // dims
      callStack.i32[offset + 1] = SUBPARCEL_SIZE;
      callStack.i32[offset + 2] = SUBPARCEL_SIZE;
      callStack.i32[offset + 3] = SUBPARCEL_SIZE;

      callStack.u32[offset + 4] = potentials.byteOffset;
      callStack.u32[offset + 5] = biomes.byteOffset;
      callStack.u32[offset + 6] = heightfield.byteOffset;
      callStack.u32[offset + 7] = lightfield.byteOffset;

      // shift
      callStack.f32[offset + 8] = x*SUBPARCEL_SIZE;
      callStack.f32[offset + 9] = y*SUBPARCEL_SIZE;
      callStack.f32[offset + 10] = z*SUBPARCEL_SIZE;

      // scale
      callStack.f32[offset + 11] = 1;
      callStack.f32[offset + 12] = 1;
      callStack.f32[offset + 13] = 1;

      callStack.u32[offset + 14] = allocators.positions.ptr;
      callStack.u32[offset + 15] = allocators.normals.ptr;
      callStack.u32[offset + 16] = allocators.uvs.ptr;
      // callStack.u32[offset + 17] = allocators.barycentrics.ptr;
      callStack.u32[offset + 17] = allocators.aos.ptr;
      callStack.u32[offset + 18] = allocators.ids.ptr;
      callStack.u32[offset + 19] = allocators.skyLights.ptr;
      callStack.u32[offset + 20] = allocators.torchLights.ptr;
      callStack.u32[offset + 21] = allocators.peeks.ptr;
    }, offset => {
      const positionsFreeEntry = callStack.ou32[offset + 22];
      const normalsFreeEntry = callStack.ou32[offset + 23];
      const uvsFreeEntry = callStack.ou32[offset + 24];
      const barycentricsFreeEntry = callStack.ou32[offset + 25];
      const aosFreeEntry = callStack.ou32[offset + 26];
      const idsFreeEntry = callStack.ou32[offset + 27];
      const skyLightsFreeEntry = callStack.ou32[offset + 28];
      const torchLightsFreeEntry = callStack.ou32[offset + 29];
      const peeksFreeEntry = callStack.ou32[offset + 30];

      const numOpaquePositions = callStack.ou32[offset + 31];
      const numTransparentPositions = callStack.ou32[offset + 32];

      const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const normalsStart = moduleInstance.HEAPU32[normalsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      // const barycentricsStart = moduleInstance.HEAPU32[barycentricsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const aosStart = moduleInstance.HEAPU32[aosFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const idsStart = moduleInstance.HEAPU32[idsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry/Uint32Array.BYTES_PER_ELEMENT];
      const peeksStart = moduleInstance.HEAPU32[peeksFreeEntry/Uint32Array.BYTES_PER_ELEMENT];

      const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const normalsCount = moduleInstance.HEAPU32[normalsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      // const barycentricsCount = moduleInstance.HEAPU32[barycentricsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const aosCount = moduleInstance.HEAPU32[aosFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const idsCount = moduleInstance.HEAPU32[idsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];
      const peeksCount = moduleInstance.HEAPU32[peeksFreeEntry/Uint32Array.BYTES_PER_ELEMENT + 1];

      const _decodeArenaEntry = (allocator, freeEntry, constructor) => {
        const positionsBase = new Uint32Array(moduleInstance.HEAP8.buffer, allocator.ptr, 1)[0];
        const positionsOffset = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry, 1)[0];
        const positionsLength = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry + Uint32Array.BYTES_PER_ELEMENT, 1)[0];
        const positions = new constructor(moduleInstance.HEAP8.buffer, positionsBase + positionsOffset, positionsLength/constructor.BYTES_PER_ELEMENT);
        return positions;
      };
      const positions = _decodeArenaEntry(allocators.positions, positionsFreeEntry, Float32Array);
      const peeks = _decodeArenaEntry(allocators.peeks, peeksFreeEntry, Uint8Array);
      // console.log('loaded positions', positions, peeks);

      accept({
        positionsFreeEntry,
        normalsFreeEntry,
        uvsFreeEntry,
        // barycentricsFreeEntry,
        aosFreeEntry,
        idsFreeEntry,
        skyLightsFreeEntry,
        torchLightsFreeEntry,
        peeksFreeEntry,

        positionsStart,
        normalsStart,
        uvsStart,
        // barycentricsStart,
        aosStart,
        idsStart,
        skyLightsStart,
        torchLightsStart,
        peeksStart,

        positionsCount,
        normalsCount,
        uvsCount,
        // barycentricsCount,
        aosCount,
        idsCount,
        skyLightsCount,
        torchLightsCount,
        peeksCount,

        numOpaquePositions,
        numTransparentPositions,

        x,
        y,
        z,
      });
    });
  }); */
  w.makeTracker = function() {
    return moduleInstance._makeTracker.apply(moduleInstance, arguments);
  };
  /* w.requestBakeGeometry = (positions, indices) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.bakeGeometry, false, offset => {
      callStack.u32[offset] = positions.byteOffset;
      callStack.u32[offset + 1] = indices ? indices.byteOffset : 0;
      callStack.u32[offset + 2] = positions.length;
      callStack.u32[offset + 3] = indices ? indices.length : 0;
    }, offset => {
      const writeStream = callStack.ou32[offset + 4];
      accept(writeStream);
    });
  });
  w.releaseBakedGeometry = writeStream => {
    moduleInstance._releaseBakedGeometry(writeStream);
  };
  w.registerBakedGeometry = (meshId, writeStream, x, y, z) => {
    scratchStack.f32[0] = x*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2;
    scratchStack.f32[1] = y*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2;
    scratchStack.f32[2] = z*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2;

    scratchStack.f32[3] = 0;
    scratchStack.f32[4] = 0;
    scratchStack.f32[5] = 0;
    scratchStack.f32[6] = 1;

    moduleInstance._registerBakedGeometry(
      meshId,
      writeStream,
      scratchStack.f32.byteOffset,
      scratchStack.f32.byteOffset + 3*Float32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + 7*Uint32Array.BYTES_PER_ELEMENT
    );
    return scratchStack.u32[7];
  };
  w.registerBoxGeometry = (meshId, positionData, quaternionData, w, h, d) => {
    positionData.toArray(scratchStack.f32, 0);
    quaternionData.toArray(scratchStack.f32, 3);

    moduleInstance._registerBoxGeometry(
      meshId,
      scratchStack.f32.byteOffset,
      scratchStack.f32.byteOffset + 3*Float32Array.BYTES_PER_ELEMENT,
      w,
      h,
      d,
      scratchStack.u32.byteOffset + 7*Uint32Array.BYTES_PER_ELEMENT
    );
    return scratchStack.u32[7];
  };
  w.registerCapsuleGeometry = (meshId, positionData, quaternionData, radius, halfHeight) => {
    positionData.toArray(scratchStack.f32, 0);
    quaternionData.toArray(scratchStack.f32, 3);

    moduleInstance._registerCapsuleGeometry(
      meshId,
      scratchStack.f32.byteOffset,
      scratchStack.f32.byteOffset + 3*Float32Array.BYTES_PER_ELEMENT,
      radius,
      halfHeight,
      scratchStack.u32.byteOffset + 7*Uint32Array.BYTES_PER_ELEMENT
    );
    return scratchStack.u32[7];
  };
  w.unregisterGeometry = ptr => {
    moduleInstance._unregisterGeometry(ptr);
  }; */
  w.raycast = (tracker, p, q) => {
    p.toArray(scratchStack.f32, 0);
    localVector.set(0, 0, -1)
      .applyQuaternion(q)
      .toArray(scratchStack.f32, 3);
    currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
    localVector.toArray(scratchStack.f32, 6);
    localQuaternion.toArray(scratchStack.f32, 9);

    const originOffset = scratchStack.f32.byteOffset;
    const directionOffset = scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT;
    const meshPositionOffset = scratchStack.f32.byteOffset + 6 * Float32Array.BYTES_PER_ELEMENT;
    const meshQuaternionOffset = scratchStack.f32.byteOffset + 9 * Float32Array.BYTES_PER_ELEMENT;

    const hitOffset = scratchStack.f32.byteOffset + 13 * Float32Array.BYTES_PER_ELEMENT;
    const pointOffset = scratchStack.f32.byteOffset + 14 * Float32Array.BYTES_PER_ELEMENT;
    const normalOffset = scratchStack.f32.byteOffset + 17 * Float32Array.BYTES_PER_ELEMENT;
    const distanceOffset = scratchStack.f32.byteOffset + 20 * Float32Array.BYTES_PER_ELEMENT;
    const objectIdOffset = scratchStack.u32.byteOffset + 21 * Float32Array.BYTES_PER_ELEMENT;
    const faceIndexOffset = scratchStack.u32.byteOffset + 22 * Float32Array.BYTES_PER_ELEMENT;
    const positionOffset = scratchStack.u32.byteOffset + 23 * Float32Array.BYTES_PER_ELEMENT;
    const quaternionOffset = scratchStack.u32.byteOffset + 26 * Float32Array.BYTES_PER_ELEMENT;

    /* const raycastArgs = {
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
    }; */

    moduleInstance._raycast(
      tracker,
      originOffset,
      directionOffset,
      meshPositionOffset,
      meshQuaternionOffset,
      hitOffset,
      pointOffset,
      normalOffset,
      distanceOffset,
      objectIdOffset,
      faceIndexOffset,
      positionOffset,
      quaternionOffset,
    );
    const objectId = scratchStack.u32[21];
    const faceIndex = scratchStack.u32[22];
    const objectPosition = scratchStack.f32.slice(23, 26);
    const objectQuaternion = scratchStack.f32.slice(26, 30);

    return scratchStack.u32[13] ? {
      point: scratchStack.f32.slice(14, 17),
      normal: scratchStack.f32.slice(17, 20),
      distance: scratchStack.f32[20],
      meshId: scratchStack.u32[21],
      objectId,
      faceIndex,
      objectPosition,
      objectQuaternion,
    } : null;
  };
  w.collide = (tracker, radius, halfHeight, p, q, maxIter) => {
    p.toArray(scratchStack.f32, 0);
    localQuaternion.copy(q)
      .premultiply(capsuleUpQuaternion)
      .toArray(scratchStack.f32, 3);
    currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
    localVector.toArray(scratchStack.f32, 7);
    localQuaternion.toArray(scratchStack.f32, 10);

    const positionOffset = scratchStack.f32.byteOffset;
    const quaternionOffset = scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT;
    const meshPositionOffset = scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT;
    const meshQuaternionOffset = scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT;

    const hitOffset = scratchStack.f32.byteOffset + 14 * Float32Array.BYTES_PER_ELEMENT;
    const directionOffset = scratchStack.f32.byteOffset + 15 * Float32Array.BYTES_PER_ELEMENT;
    const groundedOffset = scratchStack.f32.byteOffset + 18 * Float32Array.BYTES_PER_ELEMENT;

    /* const collideArgs = {
      position: allocator.alloc(Float32Array, 3),
      quaternion: allocator.alloc(Float32Array, 4),
      meshPosition: allocator.alloc(Float32Array, 3),
      meshQuaternion: allocator.alloc(Float32Array, 4),
      hit: allocator.alloc(Uint32Array, 1),
      direction: allocator.alloc(Float32Array, 3),
      grounded: allocator.alloc(Uint32Array, 1),
    }; */

    moduleInstance._collide(
      tracker,
      radius,
      halfHeight,
      positionOffset,
      quaternionOffset,
      meshPositionOffset,
      meshQuaternionOffset,
      maxIter,
      hitOffset,
      directionOffset,
      groundedOffset,
    );

    return scratchStack.u32[14] ? {
      direction: scratchStack.f32.slice(15, 18),
      grounded: !!scratchStack.u32[18],
    } : null;
  };
  w.getSubparcelArenaSpec = subparcelOffset => {
    const subparcelArenaSpecOffset = scratchStack.u32.byteOffset;
    moduleInstance._getSubparcelArenaSpec(subparcelOffset, subparcelArenaSpecOffset);
    const subparcelArenaSpecOffset32 = subparcelArenaSpecOffset/Uint32Array.BYTES_PER_ELEMENT;

    let index = 0;
    let landArenaSpec, vegetationArenaSpec, thingArenaSpec;
    {
      const positionsFreeEntry = scratchStack.u32[index++];
      const normalsFreeEntry = scratchStack.u32[index++];
      const uvsFreeEntry = scratchStack.u32[index++];
      const aosFreeEntry = scratchStack.u32[index++];
      const idsFreeEntry = scratchStack.u32[index++];
      const skyLightsFreeEntry = scratchStack.u32[index++];
      const torchLightsFreeEntry = scratchStack.u32[index++];

      landArenaSpec = {
        positionsFreeEntry,
        normalsFreeEntry,
        uvsFreeEntry,
        aosFreeEntry,
        idsFreeEntry,
        skyLightsFreeEntry,
        torchLightsFreeEntry,
      };
    }
    {
      const positionsFreeEntry = scratchStack.u32[index++];
      const uvsFreeEntry = scratchStack.u32[index++];
      const idsFreeEntry = scratchStack.u32[index++];
      const indicesFreeEntry = scratchStack.u32[index++];
      const skyLightsFreeEntry = scratchStack.u32[index++];
      const torchLightsFreeEntry = scratchStack.u32[index++];

      vegetationArenaSpec = {
        positionsFreeEntry,
        uvsFreeEntry,
        idsFreeEntry,
        indicesFreeEntry,
        skyLightsFreeEntry,
        torchLightsFreeEntry,
      };
    }
    {
      const positionsFreeEntry = scratchStack.u32[index++];
      const uvsFreeEntry = scratchStack.u32[index++];
      const atlasUvsFreeEntry = scratchStack.u32[index++];
      const idsFreeEntry = scratchStack.u32[index++];
      const indicesFreeEntry = scratchStack.u32[index++];
      const skyLightsFreeEntry = scratchStack.u32[index++];
      const torchLightsFreeEntry = scratchStack.u32[index++];

      thingArenaSpec = {
        positionsFreeEntry,
        uvsFreeEntry,
        atlasUvsFreeEntry,
        idsFreeEntry,
        indicesFreeEntry,
        skyLightsFreeEntry,
        torchLightsFreeEntry,
      };
    }
    return [landArenaSpec, vegetationArenaSpec, thingArenaSpec];
  };
  /* w.registerGroupSet = (culler, x, y, z, r, peeksData, groupsData) => {
    scratchStack.u8.set(peeksData, 0);
    for (let i = 0; i < groupsData.length; i++) {
      const groupData = groupsData[i];
      scratchStack.u32[16/Uint32Array.BYTES_PER_ELEMENT + i*3] = groupData.start;
      scratchStack.u32[16/Uint32Array.BYTES_PER_ELEMENT + i*3+1] = groupData.count;
      scratchStack.u32[16/Uint32Array.BYTES_PER_ELEMENT + i*3+2] = groupData.materialIndex;
    }

    const peeksOffset = scratchStack.u32.byteOffset;
    const groupsOffset = scratchStack.u32.byteOffset + 16;

    return moduleInstance._registerGroupSet(
      culler,
      x,
      y,
      z,
      r,
      peeksOffset,
      groupsOffset,
      groupsData.length
    );
  };
  w.unregisterGroupSet = (culler, groupSet) => {
    moduleInstance._unregisterGroupSet(culler, groupSet);
  };
  w.cull = (culler, position, matrix, slabRadius) => {
    position.toArray(scratchStack.f32, 0);
    matrix.toArray(scratchStack.f32, 3);

    const positionOffset = scratchStack.f32.byteOffset;
    const matrixOffset = scratchStack.f32.byteOffset + 3*Float32Array.BYTES_PER_ELEMENT;
    const cullResultsOffset = scratchStack.f32.byteOffset + (3 + 16)*Float32Array.BYTES_PER_ELEMENT;
    const numCullResultsOffset = scratchStack.f32.byteOffset + (3 + 16 + 4096)*Float32Array.BYTES_PER_ELEMENT;

    moduleInstance._cull(
      culler,
      positionOffset,
      matrixOffset,
      slabRadius,
      cullResultsOffset,
      numCullResultsOffset
    );

    const numCullResults = scratchStack.u32[3+16+4096];
    const cullResults = Array(numCullResults);
    for (let i = 0; i < cullResults.length; i++) {
      cullResults[i] = {
        start: scratchStack.u32[3+16 + i*3],
        count: scratchStack.u32[3+16 + i*3 + 1],
        materialIndex: scratchStack.u32[3+16 + i*3 + 2],
      };
    }
    return cullResults;
  }; */
  w.tickCull = (tracker, position, matrix) => {
    position.toArray(scratchStack.f32, 0);
    matrix.toArray(scratchStack.f32, 3);

    const positionOffset = scratchStack.f32.byteOffset;
    const matrixOffset = scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT;
    const numLandCullResultsOffset = scratchStack.f32.byteOffset + (3 + 16) * Float32Array.BYTES_PER_ELEMENT;
    const numVegetationCullResultsOffset = scratchStack.f32.byteOffset + (3 + 16 + 1) * Float32Array.BYTES_PER_ELEMENT;
    const numThingCullResultsOffset = scratchStack.f32.byteOffset + (3 + 16 + 2) * Float32Array.BYTES_PER_ELEMENT;
    const landCullResultsOffset = scratchStack.f32.byteOffset + (3 + 16 + 3) * Float32Array.BYTES_PER_ELEMENT;
    const vegetationCullResultsOffset = scratchStack.f32.byteOffset + (3 + 16 + 3 + 4096) * Float32Array.BYTES_PER_ELEMENT;
    const thingCullResultsOffset = scratchStack.f32.byteOffset + (3 + 16 + 3 + 4096 * 2) * Float32Array.BYTES_PER_ELEMENT;

    moduleInstance._tickCull(
      tracker,
      positionOffset,
      matrixOffset,
      landCullResultsOffset,
      numLandCullResultsOffset,
      vegetationCullResultsOffset,
      numVegetationCullResultsOffset,
      thingCullResultsOffset,
      numThingCullResultsOffset,
    );

    const numLandCullResults = scratchStack.u32[3 + 16];
    const landCullResults = Array(numLandCullResults);
    for (let i = 0; i < landCullResults.length; i++) {
      landCullResults[i] = {
        start: scratchStack.u32[3 + 16 + 3 + i * 3],
        count: scratchStack.u32[3 + 16 + 3 + i * 3 + 1],
        materialIndex: scratchStack.u32[3 + 16 + 3 + i * 3 + 2],
      };
    }
    const numVegetationCullResults = scratchStack.u32[3 + 16 + 1];
    const vegetationCullResults = Array(numVegetationCullResults);
    for (let i = 0; i < vegetationCullResults.length; i++) {
      vegetationCullResults[i] = {
        start: scratchStack.u32[3 + 16 + 3 + 4096 + i * 3],
        count: scratchStack.u32[3 + 16 + 3 + 4096 + i * 3 + 1],
        materialIndex: scratchStack.u32[3 + 16 + 3 + 4096 + i * 3 + 2],
      };
    }
    const numThingCullResults = scratchStack.u32[3 + 16 + 1];
    const thingCullResults = Array(numThingCullResults);
    for (let i = 0; i < thingCullResults.length; i++) {
      thingCullResults[i] = {
        start: scratchStack.u32[3 + 16 + 3 + 4096 * 2 + i * 3],
        count: scratchStack.u32[3 + 16 + 3 + 4096 * 2 + i * 3 + 1],
        materialIndex: scratchStack.u32[3 + 16 + 3 + 4096 * 2 + i * 3 + 2],
      };
    }
    return [landCullResults, vegetationCullResults, thingCullResults];
  };
  /* w.getSubparcel = (tracker, x, y, z) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.getSubparcel, true, offset => {
      callStack.u32[offset] = tracker;
      callStack.u32[offset + 1] = x;
      callStack.u32[offset + 2] = y;
      callStack.u32[offset + 3] = z;
    }, offset => {
      const subparcelPtr = callStack.ou32[offset++];
      const subparcelSharedPtr = callStack.ou32[offset++];
      if (subparcelSharedPtr) {
        const numObjects = moduleInstance.HEAPU32[(subparcelPtr + planet.Subparcel.offsets.numObjects)/Uint32Array.BYTES_PER_ELEMENT];
        console.log('got num objects', numObjects);

        w.requestReleaseSubparcel()
          .then(accept, reject);
      } else {
        console.log('no subparcel');
      }
    });
  }); */
  // window.getSubparcel = (x, y, z) => w.getSubparcel(tracker, x, y, z);
  w.requestReleaseSubparcel = (tracker, subparcelSharedPtr) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.releaseSubparcel, true, m => {
      m.pushU32(tracker);
      m.pushU32(subparcelSharedPtr);
    }, m => {
      accept();
    });
  });
  w.requestAddObject = (tracker, geometrySet, name, position, quaternion) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.addObject, true, m => {
      m.pushU32(tracker);
      m.pushU32(geometrySet);

      const srcNameUint8Array = textEncoder.encode(name);
      const srcNameUint8Array2 = new Uint8Array(MAX_NAME_LENGTH);
      srcNameUint8Array2.set(srcNameUint8Array);
      srcNameUint8Array2[srcNameUint8Array.byteLength] = 0;
      m.pushU8Array(srcNameUint8Array2);

      m.pushF32Array(position.toArray(new Float32Array(3)));
      m.pushF32Array(quaternion.toArray(new Float32Array(4)));
    }, m => {
      const objectId = m.pullU32();
      const numSubparcels = m.pullU32();
      // console.log('num subparcels add', numSubparcels);
      for (let i = 0; i < numSubparcels; i++) {
        const subparcelOffset = m.pullU32();
        const [landArenaSpec, vegetationArenaSpec, thingArenaSpec] = geometryWorker.getSubparcelArenaSpec(subparcelOffset);
        const {
          positionsFreeEntry,
          uvsFreeEntry,
          idsFreeEntry,
          indicesFreeEntry,
          skyLightsFreeEntry,
          torchLightsFreeEntry,
        } = vegetationArenaSpec;

        const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const indicesStart = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

        const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const indicesCount = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

        /* const _decodeArenaEntry = (allocator, freeEntry, constructor) => {
          const positionsBase = new Uint32Array(moduleInstance.HEAP8.buffer, allocator.ptr, 1)[0];
          const positionsOffset = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry, 1)[0];
          const positionsLength = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry + Uint32Array.BYTES_PER_ELEMENT, 1)[0];
          const positions = new constructor(moduleInstance.HEAP8.buffer, positionsBase + positionsOffset, positionsLength/constructor.BYTES_PER_ELEMENT);
          return positions;
        };
        const positions = _decodeArenaEntry(vegetationAllocators.positions, positionsFreeEntry, Float32Array);
        const uvs = _decodeArenaEntry(vegetationAllocators.uvs, uvsFreeEntry, Float32Array);
        const ids = _decodeArenaEntry(vegetationAllocators.ids, idsFreeEntry, Float32Array);
        const indices = _decodeArenaEntry(vegetationAllocators.indices, indicesFreeEntry, Uint32Array);
        const skyLights = _decodeArenaEntry(vegetationAllocators.skyLights, skyLightsFreeEntry, Uint8Array);
        const torchLights = _decodeArenaEntry(vegetationAllocators.torchLights, torchLightsFreeEntry, Uint8Array);
        console.log('got positions', {positions, uvs, ids, indices, skyLights, torchLights}); */

        currentVegetationMesh.updateGeometry({
          positionsStart,
          uvsStart,
          idsStart,
          indicesStart,
          skyLightsStart,
          torchLightsStart,

          positionsCount,
          uvsCount,
          idsCount,
          indicesCount,
          skyLightsCount,
          torchLightsCount,
        });
      }
      callStack.allocRequest(METHODS.releaseAddRemoveObject, true, m2 => {
        m2.pushU32(tracker);
        m2.pushU32(numSubparcels);
        for (let i = 0; i < numSubparcels; i++) {
          m2.pushU32(m.pullU32());
        }
      }, m => {
        // console.log('done release', numSubparcels);
        accept({
          objectId,
        });
      });
    });
  });
  w.requestRemoveObject = (tracker, geometrySet, sx, sy, sz, objectId) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.removeObject, true, m => {
      m.pushU32(tracker);
      m.pushU32(geometrySet);
      m.pushI32(sx);
      m.pushI32(sy);
      m.pushI32(sz);
      m.pushU32(objectId);
    }, m => {
      const numSubparcels = m.pullU32();
      for (let i = 0; i < numSubparcels; i++) {
        const subparcelOffset = m.pullU32();
        const [landArenaSpec, vegetationArenaSpec, thingArenaSpec] = geometryWorker.getSubparcelArenaSpec(subparcelOffset);
        const {
          positionsFreeEntry,
          uvsFreeEntry,
          idsFreeEntry,
          indicesFreeEntry,
          skyLightsFreeEntry,
          torchLightsFreeEntry,
        } = vegetationArenaSpec;

        const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const indicesStart = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

        const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const indicesCount = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

        /* const _decodeArenaEntry = (allocator, freeEntry, constructor) => {
          const positionsBase = new Uint32Array(moduleInstance.HEAP8.buffer, allocator.ptr, 1)[0];
          const positionsOffset = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry, 1)[0];
          const positionsLength = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry + Uint32Array.BYTES_PER_ELEMENT, 1)[0];
          const positions = new constructor(moduleInstance.HEAP8.buffer, positionsBase + positionsOffset, positionsLength/constructor.BYTES_PER_ELEMENT);
          return positions;
        };
        const positions = _decodeArenaEntry(vegetationAllocators.positions, positionsFreeEntry, Float32Array);
        const uvs = _decodeArenaEntry(vegetationAllocators.uvs, uvsFreeEntry, Float32Array);
        const ids = _decodeArenaEntry(vegetationAllocators.ids, idsFreeEntry, Float32Array);
        const indices = _decodeArenaEntry(vegetationAllocators.indices, indicesFreeEntry, Uint32Array);
        const skyLights = _decodeArenaEntry(vegetationAllocators.skyLights, skyLightsFreeEntry, Uint8Array);
        const torchLights = _decodeArenaEntry(vegetationAllocators.torchLights, torchLightsFreeEntry, Uint8Array);
        console.log('got positions', {positions, uvs, ids, indices, skyLights, torchLights}); */

        currentVegetationMesh.updateGeometry({
          positionsStart,
          uvsStart,
          idsStart,
          indicesStart,
          skyLightsStart,
          torchLightsStart,

          positionsCount,
          uvsCount,
          idsCount,
          indicesCount,
          skyLightsCount,
          torchLightsCount,
        });
      }
      callStack.allocRequest(METHODS.releaseAddRemoveObject, true, m2 => {
        m2.pushU32(tracker);
        m2.pushU32(numSubparcels);
        for (let i = 0; i < numSubparcels; i++) {
          m2.pushU32(m.pullU32());
        }
      }, m => {
        // console.log('done release', numSubparcels);
        accept();
      });
    });
  });
  w.requestMine = (tracker, p, delta) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.mine, true, m => {
      m.pushU32(tracker);
      m.pushF32Array(p.toArray(new Float32Array(3)));
      m.pushF32(delta);
    }, m => {
      const numSubparcels = m.pullU32();
      for (let i = 0; i < numSubparcels; i++) {
        const subparcelOffset = m.pullU32();
        const [landArenaSpec, vegetationArenaSpec, thingArenaSpec] = geometryWorker.getSubparcelArenaSpec(subparcelOffset);
        const {
          positionsFreeEntry,
          normalsFreeEntry,
          uvsFreeEntry,
          aosFreeEntry,
          idsFreeEntry,
          skyLightsFreeEntry,
          torchLightsFreeEntry,
        } = landArenaSpec;

        const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const normalsStart = moduleInstance.HEAPU32[normalsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const aosStart = moduleInstance.HEAPU32[aosFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

        const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const normalsCount = moduleInstance.HEAPU32[normalsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const aosCount = moduleInstance.HEAPU32[aosFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

        /* const _decodeArenaEntry = (allocator, freeEntry, constructor) => {
          const positionsBase = new Uint32Array(moduleInstance.HEAP8.buffer, allocator.ptr, 1)[0];
          const positionsOffset = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry, 1)[0];
          const positionsLength = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry + Uint32Array.BYTES_PER_ELEMENT, 1)[0];
          const positions = new constructor(moduleInstance.HEAP8.buffer, positionsBase + positionsOffset, positionsLength/constructor.BYTES_PER_ELEMENT);
          return positions;
        };
        const positions = _decodeArenaEntry(landAllocators.positions, positionsFreeEntry, Float32Array);
        const normals = _decodeArenaEntry(landAllocators.normals, normalsFreeEntry, Float32Array);
        const uvs = _decodeArenaEntry(landAllocators.uvs, uvsFreeEntry, Float32Array);
        const aos = _decodeArenaEntry(landAllocators.aos, aosFreeEntry, Uint8Array);
        const skyLights = _decodeArenaEntry(landAllocators.skyLights, skyLightsFreeEntry, Uint8Array);
        const torchLights = _decodeArenaEntry(landAllocators.torchLights, torchLightsFreeEntry, Uint8Array);
        console.log('got positions', {positions, normals, uvs, aos, skyLights, torchLights}); */

        currentChunkMesh.updateGeometry({
          positionsStart,
          normalsStart,
          uvsStart,
          aosStart,
          idsStart,
          skyLightsStart,
          torchLightsStart,

          positionsCount,
          normalsCount,
          uvsCount,
          aosCount,
          idsCount,
          skyLightsCount,
          torchLightsCount,
        });
      }

      callStack.allocRequest(METHODS.releaseAddRemoveObject, true, m2 => {
        m2.pushU32(tracker);
        m2.pushU32(numSubparcels);
        for (let i = 0; i < numSubparcels; i++) {
          m2.pushU32(m.pullU32());
        }
      }, m => {
        // console.log('done release', numSubparcels);
        accept();
      });
    });
  });
  w.requestLight = (tracker, p, delta) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.light, true, m => {
      m.pushU32(tracker);
      m.pushF32Array(p.toArray(new Float32Array(3)));
      m.pushF32(delta);
    }, m => {
      const numSubparcels = m.pullU32();
      for (let i = 0; i < numSubparcels; i++) {
        {
          const positionsFreeEntry = m.pullU32();
          const normalsFreeEntry = m.pullU32();
          const uvsFreeEntry = m.pullU32();
          const aosFreeEntry = m.pullU32();
          const idsFreeEntry = m.pullU32();
          const skyLightsFreeEntry = m.pullU32();
          const torchLightsFreeEntry = m.pullU32();

          const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const normalsStart = moduleInstance.HEAPU32[normalsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const aosStart = moduleInstance.HEAPU32[aosFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

          const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const normalsCount = moduleInstance.HEAPU32[normalsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const aosCount = moduleInstance.HEAPU32[aosFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

          currentChunkMesh.updateGeometry({
            positionsStart,
            normalsStart,
            uvsStart,
            aosStart,
            idsStart,
            skyLightsStart,
            torchLightsStart,

            positionsCount,
            normalsCount,
            uvsCount,
            aosCount,
            idsCount,
            skyLightsCount,
            torchLightsCount,
          });
        }
        {
          const positionsFreeEntry = m.pullU32();
          const uvsFreeEntry = m.pullU32();
          const idsFreeEntry = m.pullU32();
          const indicesFreeEntry = m.pullU32();
          const skyLightsFreeEntry = m.pullU32();
          const torchLightsFreeEntry = m.pullU32();

          const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const indicesStart = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
          const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

          const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const indicesCount = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
          const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

          currentVegetationMesh.updateGeometry({
            positionsStart,
            uvsStart,
            idsStart,
            indicesStart,
            skyLightsStart,
            torchLightsStart,

            positionsCount,
            uvsCount,
            idsCount,
            indicesCount,
            skyLightsCount,
            torchLightsCount,
          });
        }
      }
      callStack.allocRequest(METHODS.releaseAddRemoveObject, true, m2 => {
        m2.pushU32(tracker);
        m2.pushU32(numSubparcels);
        for (let i = 0; i < numSubparcels; i++) {
          m2.pushU32(m.pullU32());
        }
      }, m => {
        // console.log('done release', numSubparcels);
        accept();
      });
    });
  });
  w.requestAddThingGeometry = (tracker, geometrySet, name, positions, uvs, indices, numPositions, numUvs, numIndices, texture) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.addThingGeometry, true, m => {
      m.pushU32(tracker);
      m.pushU32(geometrySet);

      const srcNameUint8Array = textEncoder.encode(name);
      const srcNameUint8Array2 = new Uint8Array(MAX_NAME_LENGTH);
      srcNameUint8Array2.set(srcNameUint8Array);
      srcNameUint8Array2[srcNameUint8Array.byteLength] = 0;
      m.pushU8Array(srcNameUint8Array2);

      m.pushU32(positions);
      m.pushU32(uvs);
      m.pushU32(indices);

      m.pushU32(numPositions);
      m.pushU32(numUvs);
      m.pushU32(numIndices);

      m.pushU32(texture);
    }, m => {
      accept();
    });
  });
  w.requestAddThing = (tracker, geometrySet, name, position, quaternion, scale) => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.addThing, true, offset => {
      m.pushU32(tracker);
      m.pushU32(geometrySet);

      const srcNameUint8Array = textEncoder.encode(name);
      const srcNameUint8Array2 = new Uint8Array(MAX_NAME_LENGTH);
      srcNameUint8Array2.set(srcNameUint8Array);
      srcNameUint8Array2[srcNameUint8Array.byteLength] = 0;
      m.pushU8Array(srcNameUint8Array2);

      m.pushF32Array(position.toArray(new Float32Array(3)));
      m.pushF32Array(quaternion.toArray(new Float32Array(4)));
      m.pushF32Array(scale.toArray(new Float32Array(4)));
    }, m => {
      const objectId = m.pullU32();
      const textureOffset = m.pullU32();
      if (textureOffset) {
        const textureData = new Uint8Array(moduleInstance.HEAP8.buffer, textureOffset, thingTextureSize * thingTextureSize * 4);
        currentThingMesh.updateTexture(textureData);
      }

      const numSubparcels = m.pullU32();
      for (let i = 0; i < numSubparcels; i++) {
        const subparcelOffset = m.pullU32();
        const [landArenaSpec, vegetationArenaSpec, thingArenaSpec] = geometryWorker.getSubparcelArenaSpec(subparcelOffset);
        const {
          positionsFreeEntry,
          uvsFreeEntry,
          atlasUvsFreeEntry,
          idsFreeEntry,
          indicesFreeEntry,
          skyLightsFreeEntry,
          torchLightsFreeEntry,
        } = thingArenaSpec;

        const positionsStart = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const uvsStart = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const atlasUvsStart = moduleInstance.HEAPU32[atlasUvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const idsStart = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const indicesStart = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const skyLightsStart = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];
        const torchLightsStart = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT];

        const positionsCount = moduleInstance.HEAPU32[positionsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const uvsCount = moduleInstance.HEAPU32[uvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const atlasUvsCount = moduleInstance.HEAPU32[atlasUvsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const idsCount = moduleInstance.HEAPU32[idsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const indicesCount = moduleInstance.HEAPU32[indicesFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const skyLightsCount = moduleInstance.HEAPU32[skyLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];
        const torchLightsCount = moduleInstance.HEAPU32[torchLightsFreeEntry / Uint32Array.BYTES_PER_ELEMENT + 1];

        /* const _decodeArenaEntry = (allocator, freeEntry, constructor) => {
          const positionsBase = new Uint32Array(moduleInstance.HEAP8.buffer, allocator.ptr, 1)[0];
          const positionsOffset = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry, 1)[0];
          const positionsLength = new Uint32Array(moduleInstance.HEAP8.buffer, freeEntry + Uint32Array.BYTES_PER_ELEMENT, 1)[0];
          const positions = new constructor(moduleInstance.HEAP8.buffer, positionsBase + positionsOffset, positionsLength/constructor.BYTES_PER_ELEMENT);
          return positions;
        };
        const positions = _decodeArenaEntry(thingAllocators.positions, positionsFreeEntry, Float32Array);
        const uvs = _decodeArenaEntry(thingAllocators.uvs, uvsFreeEntry, Float32Array);
        const atlasUvs = _decodeArenaEntry(thingAllocators.atlasUvs, atlasUvsFreeEntry, Float32Array);
        const ids = _decodeArenaEntry(thingAllocators.ids, idsFreeEntry, Float32Array);
        const indices = _decodeArenaEntry(thingAllocators.indices, indicesFreeEntry, Uint32Array);
        const skyLights = _decodeArenaEntry(thingAllocators.skyLights, skyLightsFreeEntry, Uint8Array);
        const torchLights = _decodeArenaEntry(thingAllocators.torchLights, torchLightsFreeEntry, Uint8Array);
        console.log('got positions', {positions, uvs, atlasUvs, ids, indices, skyLights, torchLights}); */

        currentThingMesh.updateGeometry({
          positionsStart,
          uvsStart,
          atlasUvsStart,
          idsStart,
          indicesStart,
          skyLightsStart,
          torchLightsStart,

          positionsCount,
          uvsCount,
          atlasUvsCount,
          idsCount,
          indicesCount,
          skyLightsCount,
          torchLightsCount,
        });
      }

      callStack.allocRequest(METHODS.releaseAddRemoveObject, true, m2 => {
        m2.pushU32(tracker);
        m2.pushU32(numSubparcels);
        for (let i = 0; i < numSubparcels; i++) {
          m2.pushU32(m.pullU32());
        }
      }, m => {
        // console.log('done release', numSubparcels);
        accept();
      });
    });
  });
  w.convexHull = (positionsData, cameraPosition) => {
    const positions = geometryWorker.alloc(Float32Array, positionsData.length);
    positions.set(positionsData);

    cameraPosition.toArray(scratchStack.f32, 0);
    const convexHullResult = moduleInstance._convexHull(positions.byteOffset, positions.length, scratchStack.f32.byteOffset);

    const pointsOffset = moduleInstance.HEAPU32[convexHullResult / Uint32Array.BYTES_PER_ELEMENT];
    const numPoints = moduleInstance.HEAPU32[convexHullResult / Uint32Array.BYTES_PER_ELEMENT + 1];
    const points = moduleInstance.HEAPF32.slice(pointsOffset / Float32Array.BYTES_PER_ELEMENT, pointsOffset / Float32Array.BYTES_PER_ELEMENT + numPoints);
    const planeNormal = new THREE.Vector3().fromArray(moduleInstance.HEAPF32, convexHullResult / Float32Array.BYTES_PER_ELEMENT + 2);
    const planeConstant = moduleInstance.HEAPF32[convexHullResult / Uint32Array.BYTES_PER_ELEMENT + 5];
    const center = new THREE.Vector3().fromArray(moduleInstance.HEAPF32, convexHullResult / Float32Array.BYTES_PER_ELEMENT + 6);
    const tang = new THREE.Vector3().fromArray(moduleInstance.HEAPF32, convexHullResult / Float32Array.BYTES_PER_ELEMENT + 9);
    const bitang = new THREE.Vector3().fromArray(moduleInstance.HEAPF32, convexHullResult / Float32Array.BYTES_PER_ELEMENT + 12);

    w.free(positions.byteOffset);
    moduleInstance._deleteConvexHullResult(convexHullResult);

    return {
      points,
      planeNormal,
      planeConstant,
      center,
      tang,
      bitang,
    };
  };
  /* w.earcut = (tracker, ps, holes, holeCounts, points, z, zs, objectId, position, quaternion) => {
    const inPs = w.alloc(Float32Array, ps.length);
    inPs.set(ps);
    const inHoles = w.alloc(Float32Array, holes.length);
    inHoles.set(holes);
    const inHoleCounts = w.alloc(Uint32Array, holeCounts.length);
    inHoleCounts.set(holeCounts);
    const inPoints = w.alloc(Float32Array, points.length);
    inPoints.set(points);
    const inZs = w.alloc(Float32Array, zs.length);
    inZs.set(zs);
    position.toArray(scratchStack.f32, 0);
    const positionOffset = scratchStack.f32.byteOffset;
    quaternion.toArray(scratchStack.f32, 3);
    const quaternionOffset = scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT;
    const resultOffset = moduleInstance._earcut(tracker, inPs.byteOffset, inPs.length / 2, inHoles.byteOffset, inHoleCounts.byteOffset, inHoleCounts.length, inPoints.byteOffset, inPoints.length, z, inZs.byteOffset, objectId, positionOffset, quaternionOffset);

    const outPositionsOffset = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT];
    const outNumPositions = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 1];
    const outUvsOffset = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 2];
    const outNumUvs = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 3];
    const outIndicesOffset = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 4];
    const outNumIndices = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 5];
    const trianglePhysicsGeometry = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 6];
    const convexPhysicsGeometry = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 7];

    const positions = moduleInstance.HEAPF32.subarray(outPositionsOffset / Float32Array.BYTES_PER_ELEMENT, outPositionsOffset / Float32Array.BYTES_PER_ELEMENT + outNumPositions);
    const uvs = moduleInstance.HEAPF32.subarray(outUvsOffset / Float32Array.BYTES_PER_ELEMENT, outUvsOffset / Float32Array.BYTES_PER_ELEMENT + outNumUvs);
    const indices = moduleInstance.HEAPU32.subarray(outIndicesOffset / Uint32Array.BYTES_PER_ELEMENT, outIndicesOffset / Uint32Array.BYTES_PER_ELEMENT + outNumIndices);

    w.free(inPs.byteOffset);
    w.free(inHoles.byteOffset);
    w.free(inHoleCounts.byteOffset);
    w.free(inPoints.byteOffset);
    w.free(inZs.byteOffset);

    return {
      resultOffset,

      positions,
      uvs,
      indices,
      trianglePhysicsGeometry,
      convexPhysicsGeometry,

      destroy() {
        moduleInstance._deleteEarcutResult(tracker, resultOffset);
      },
    };
  }; */
  w.update = () => {
    if (moduleInstance) {
      if (currentChunkMesh) {
        const neededCoordsOffset = moduleInstance._updateNeededCoords(
          tracker,
          currentChunkMesh.currentPosition.x,
          currentChunkMesh.currentPosition.y,
          currentChunkMesh.currentPosition.z,
        );
        if (neededCoordsOffset) {
          const addedSubparcelsOffset = moduleInstance.HEAPU32[neededCoordsOffset / Uint32Array.BYTES_PER_ELEMENT];
          const numAddedSubparcels = moduleInstance.HEAPU32[neededCoordsOffset / Uint32Array.BYTES_PER_ELEMENT + 1];

          (async () => {
            for (let i = 0; i < numAddedSubparcels; i++) {
              const subparcelOffset = moduleInstance.HEAP32[addedSubparcelsOffset / Uint32Array.BYTES_PER_ELEMENT + i];
              const index = moduleInstance.HEAP32[subparcelOffset / Uint32Array.BYTES_PER_ELEMENT + 3];
              const uint8Array = await storage.getRawTemp(`subparcel:${index}`);
              moduleInstance._subparcelUpdate(
                tracker,
                threadPool,
                geometrySet,
                neededCoordsOffset,
                subparcelOffset,
                1
              );
            }
          })().then(() => {
            moduleInstance._finishUpdate(
              tracker,
              neededCoordsOffset,
            );
          });
        }
      }

      callStack.outNumEntriesU32[0] = maxNumMessages;
      moduleInstance._tick(
        threadPool,
        callStack.ptr,
        callStack.numEntries,
        callStack.outPtr,
        callStack.outNumEntriesPtr,
      );
      callStack.reset();
      const numMessages = callStack.outNumEntriesU32[0];
      for (let i = 0; i < numMessages; i++) {
        const offset = i*messageSize;
        const endMessage = new CallStackMessage(callStack.outPtr + offset);
        const id = endMessage.getId();
        const method = endMessage.getMethod();

        if (id > 0) {
          const cb = cbIndex.get(id);
          if (cb) {
            cb(endMessage);
            cbIndex.delete(id);
          } else {
            throw new Error('invalid callback id: ' + id);
          }
        } else if (id === -1) {
          const cb = MESSAGES[method];
          if (cb) {
            cb(endMessage);
          } else {
            throw new Error('invalid message method: ' + method);
          }
        } else {
          throw new Error('invalid id: ' + id);
        }
      }
    }
  };
  return w;
})();
(async () => {
  await geometryWorker.waitForLoad();
  {
    const seed = Math.floor(alea('lol')() * 0xFFFFFF);
    const numPositions = 2 * 1024 * 1024;

    landAllocators = {
      positions: geometryWorker.makeArenaAllocator(numPositions * 3 * Float32Array.BYTES_PER_ELEMENT),
      normals: geometryWorker.makeArenaAllocator(numPositions * 3 * Float32Array.BYTES_PER_ELEMENT),
      uvs: geometryWorker.makeArenaAllocator(numPositions * 2 * Float32Array.BYTES_PER_ELEMENT),
      // barycentrics: geometryWorker.makeArenaAllocator(numPositions * 3*Float32Array.BYTES_PER_ELEMENT),
      aos: geometryWorker.makeArenaAllocator(numPositions * Uint8Array.BYTES_PER_ELEMENT),
      ids: geometryWorker.makeArenaAllocator(numPositions * Float32Array.BYTES_PER_ELEMENT),
      skyLights: geometryWorker.makeArenaAllocator(numPositions * Uint8Array.BYTES_PER_ELEMENT),
      torchLights: geometryWorker.makeArenaAllocator(numPositions * Uint8Array.BYTES_PER_ELEMENT),
    };
    vegetationAllocators = {
      positions: geometryWorker.makeArenaAllocator(numPositions * 3 * Float32Array.BYTES_PER_ELEMENT),
      uvs: geometryWorker.makeArenaAllocator(numPositions * 2 * Float32Array.BYTES_PER_ELEMENT),
      ids: geometryWorker.makeArenaAllocator(numPositions * Float32Array.BYTES_PER_ELEMENT),
      indices: geometryWorker.makeArenaAllocator(numPositions * Uint32Array.BYTES_PER_ELEMENT),
      skyLights: geometryWorker.makeArenaAllocator(numPositions * Uint8Array.BYTES_PER_ELEMENT),
      torchLights: geometryWorker.makeArenaAllocator(numPositions * Uint8Array.BYTES_PER_ELEMENT),
    };
    thingAllocators = {
      positions: geometryWorker.makeArenaAllocator(numPositions * 3 * Float32Array.BYTES_PER_ELEMENT),
      uvs: geometryWorker.makeArenaAllocator(numPositions * 2 * Float32Array.BYTES_PER_ELEMENT),
      atlasUvs: geometryWorker.makeArenaAllocator(numPositions * 2 * Float32Array.BYTES_PER_ELEMENT),
      ids: geometryWorker.makeArenaAllocator(numPositions * Float32Array.BYTES_PER_ELEMENT),
      indices: geometryWorker.makeArenaAllocator(numPositions * Uint32Array.BYTES_PER_ELEMENT),
      skyLights: geometryWorker.makeArenaAllocator(numPositions * Uint8Array.BYTES_PER_ELEMENT),
      torchLights: geometryWorker.makeArenaAllocator(numPositions * Uint8Array.BYTES_PER_ELEMENT),
    };

    tracker = geometryWorker.makeTracker(
      seed,
      currentChunkMeshId,
      chunkDistance,

      landAllocators.positions.ptr,
      landAllocators.normals.ptr,
      landAllocators.uvs.ptr,
      // landAllocators.barycentrics.ptr,
      landAllocators.aos.ptr,
      landAllocators.ids.ptr,
      landAllocators.skyLights.ptr,
      landAllocators.torchLights.ptr,

      vegetationAllocators.positions.ptr,
      vegetationAllocators.uvs.ptr,
      vegetationAllocators.ids.ptr,
      vegetationAllocators.indices.ptr,
      vegetationAllocators.skyLights.ptr,
      vegetationAllocators.torchLights.ptr,

      thingAllocators.positions.ptr,
      thingAllocators.uvs.ptr,
      thingAllocators.atlasUvs.ptr,
      thingAllocators.ids.ptr,
      thingAllocators.indices.ptr,
      thingAllocators.skyLights.ptr,
      thingAllocators.torchLights.ptr,
    );

    landBufferAttributes = {
      position: new THREE.BufferAttribute(landAllocators.positions.getAs(Float32Array), 3),
      normal: new THREE.BufferAttribute(landAllocators.normals.getAs(Float32Array), 3),
      uv: new THREE.BufferAttribute(landAllocators.uvs.getAs(Float32Array), 2),
      // barycentric: new THREE.BufferAttribute(landAllocators.barycentrics.getAs(Float32Array), 3),
      ao: new THREE.BufferAttribute(landAllocators.aos.getAs(Uint8Array), 1),
      id: new THREE.BufferAttribute(landAllocators.ids.getAs(Float32Array), 1),
      skyLight: new THREE.BufferAttribute(landAllocators.skyLights.getAs(Uint8Array), 1),
      torchLight: new THREE.BufferAttribute(landAllocators.torchLights.getAs(Uint8Array), 1),
    };
    vegetationBufferAttributes = {
      position: new THREE.BufferAttribute(vegetationAllocators.positions.getAs(Float32Array), 3),
      uv: new THREE.BufferAttribute(vegetationAllocators.uvs.getAs(Float32Array), 2),
      id: new THREE.BufferAttribute(vegetationAllocators.ids.getAs(Float32Array), 1),
      index: new THREE.BufferAttribute(vegetationAllocators.indices.getAs(Uint32Array), 1),
      skyLight: new THREE.BufferAttribute(vegetationAllocators.skyLights.getAs(Uint8Array), 1),
      torchLight: new THREE.BufferAttribute(vegetationAllocators.torchLights.getAs(Uint8Array), 1),
    };
    thingBufferAttributes = {
      position: new THREE.BufferAttribute(thingAllocators.positions.getAs(Float32Array), 3),
      uv: new THREE.BufferAttribute(thingAllocators.uvs.getAs(Float32Array), 2),
      atlasUv: new THREE.BufferAttribute(thingAllocators.atlasUvs.getAs(Float32Array), 2),
      id: new THREE.BufferAttribute(thingAllocators.ids.getAs(Float32Array), 1),
      index: new THREE.BufferAttribute(thingAllocators.indices.getAs(Uint32Array), 1),
      skyLight: new THREE.BufferAttribute(thingAllocators.skyLights.getAs(Uint8Array), 1),
      torchLight: new THREE.BufferAttribute(thingAllocators.torchLights.getAs(Uint8Array), 1),
    };
  }
  // culler = geometryWorker.makeCuller();

  const vegetationMaterial = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(VEGETATION_SHADER.uniforms),
    vertexShader: VEGETATION_SHADER.vertexShader,
    fragmentShader: VEGETATION_SHADER.fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const _makeBakedMesh = g => {
    const mesh = new THREE.Mesh(g, vegetationMaterial);
    mesh.frustumCulled = false;
    return mesh;
  };

  const [
    _meshes,
    texture,
  ] = await Promise.all([
    (async () => {
      geometrySet = geometryWorker.makeGeometrySet();
      await geometryWorker.requestLoadBake(geometrySet, './meshes.bin');

      const geometries = await Promise.all([
        'wood_wall',
        'wood_floor',
        'wood_ramp',
        'stone_wall',
        'stone_floor',
        'stone_ramp',
        'metal_wall',
        'metal_floor',
        'metal_ramp',
        'wood1',
        'stone2',
        'metal1',
        'SM_Prop_Plans_01',
        'SM_Item_Pencil_02',
        'SM_Wep_Pickaxe_01',
        'SM_Tool_Paint_Brush_02',
        'SM_Wep_Rifle_Assault_01',
        'SM_Wep_SubMGun_Lite_01',
        'SM_Wep_Grenade_01',
        'SM_Wep_Crosshair_04',
      ].map(n => geometryWorker.requestGetGeometry(geometrySet, n)));
      let index = 0;
      buildMeshes.walls[0] = _makeBakedMesh(geometries[index++]);
      buildMeshes.walls[0].vegetationType = 'wood_wall';
      buildMeshes.platforms[0] = _makeBakedMesh(geometries[index++]);
      buildMeshes.platforms[0].vegetationType = 'wood_floor';
      buildMeshes.ramps[0] = _makeBakedMesh(geometries[index++]);
      buildMeshes.ramps[0].vegetationType = 'wood_ramp';
      buildMeshes.walls[1] = _makeBakedMesh(geometries[index++]);
      buildMeshes.walls[1].vegetationType = 'stone_ramp';
      buildMeshes.platforms[1] = _makeBakedMesh(geometries[index++]);
      buildMeshes.platforms[1].vegetationType = 'stone_floor';
      buildMeshes.ramps[1] = _makeBakedMesh(geometries[index++]);
      buildMeshes.ramps[1].vegetationType = 'stone_ramp';
      buildMeshes.walls[2] = _makeBakedMesh(geometries[index++]);
      buildMeshes.walls[2].vegetationType = 'metal_wall';
      buildMeshes.platforms[2] = _makeBakedMesh(geometries[index++]);
      buildMeshes.platforms[2].vegetationType = 'metal_floor';
      buildMeshes.ramps[2] = _makeBakedMesh(geometries[index++]);
      buildMeshes.ramps[2].vegetationType = 'metal_ramp';
      woodMesh = _makeBakedMesh(geometries[index++]);
      stoneMesh = _makeBakedMesh(geometries[index++]);
      metalMesh = _makeBakedMesh(geometries[index++]);
      plansMesh = _makeBakedMesh(geometries[index++]);
      pencilMesh = _makeBakedMesh(geometries[index++]);
      pickaxeMesh = _makeBakedMesh(geometries[index++]);
      paintBrushMesh = _makeBakedMesh(geometries[index++]);
      assaultRifleMesh = _makeBakedMesh(geometries[index++]);
      smgMesh = _makeBakedMesh(geometries[index++]);
      grenadeMesh = _makeBakedMesh(geometries[index++]);
      crosshairMesh = _makeBakedMesh(geometries[index++]);

      plansMesh.visible = false;
      scene.add(plansMesh);
      pencilMesh.visible = false;
      scene.add(pencilMesh);
      pickaxeMesh.visible = false;
      scene.add(pickaxeMesh);
      paintBrushMesh.visible = false;
      scene.add(paintBrushMesh);
      assaultRifleMesh.visible = false;
      scene.add(assaultRifleMesh);
      smgMesh.visible = false;
      scene.add(smgMesh);
      grenadeMesh.visible = false;
      scene.add(grenadeMesh);

      {
        crosshairMesh.scale.setScalar(5000);
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
                  .multiplyScalar(1 + (1 - factor));
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
      }
    })(),
    (async () => {
      /* const image = new Image();
      await new Promise((accept, reject) => {
        image.onload = () => {
          accept();
        };
        image.onerror = reject;
        image.src = './texture.png';
      });
      const texture = new THREE.Texture(image);
      texture.flipY = false;
      texture.needsUpdate = true; */

      // console.time('basis texture load');
      const texture = await new Promise((accept, reject) => {
        basisLoader.load('meshes-texture.basis', texture => {
          // console.timeEnd('basis texture load');
          accept(texture);
        }, () => {
          // console.log('onProgress');
        }, err => {
          reject(err);
        });
      });
      return texture;
    })(),
  ]);
  vegetationMaterial.uniforms.map.value = texture;
  vegetationMaterial.uniforms.map.needsUpdate = true;

  const _makeVegetationMesh = () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', vegetationBufferAttributes.position);
    geometry.setAttribute('uv', vegetationBufferAttributes.uv);
    geometry.setAttribute('id', vegetationBufferAttributes.id);
    geometry.setAttribute('skyLight', vegetationBufferAttributes.skyLight);
    geometry.setAttribute('torchLight', vegetationBufferAttributes.torchLight);
    geometry.setIndex(vegetationBufferAttributes.index);
    // geometry.allocators = allocators;
    const mesh = new THREE.Mesh(geometry, [vegetationMaterial]);
    mesh.frustumCulled = false;

    const slabs = {};
    const _getSlabPositionOffset = spec => spec.positionsStart / Float32Array.BYTES_PER_ELEMENT;
    const _getSlabUvOffset = spec => spec.uvsStart / Float32Array.BYTES_PER_ELEMENT;
    const _getSlabIdOffset = spec => spec.idsStart / Float32Array.BYTES_PER_ELEMENT;
    const _getSlabSkyLightOffset = spec => spec.skyLightsStart / Uint8Array.BYTES_PER_ELEMENT;
    const _getSlabTorchLightOffset = spec => spec.torchLightsStart / Uint8Array.BYTES_PER_ELEMENT;
    const _getSlabIndexOffset = spec => spec.indicesStart / Uint32Array.BYTES_PER_ELEMENT;

    mesh.updateGeometry = spec => {
      geometry.attributes.position.updateRange.count = spec.positionsCount / Float32Array.BYTES_PER_ELEMENT;
      if (geometry.attributes.position.updateRange.count > 0) {
        geometry.attributes.position.updateRange.offset = _getSlabPositionOffset(spec);
        geometry.attributes.position.needsUpdate = true;

        geometry.attributes.uv.updateRange.count = spec.uvsCount / Float32Array.BYTES_PER_ELEMENT;
        geometry.attributes.uv.updateRange.offset = _getSlabUvOffset(spec);
        geometry.attributes.uv.needsUpdate = true;

        geometry.attributes.id.updateRange.count = spec.idsCount / Float32Array.BYTES_PER_ELEMENT;
        geometry.attributes.id.updateRange.offset = _getSlabIdOffset(spec);
        geometry.attributes.id.needsUpdate = true;

        geometry.attributes.skyLight.updateRange.count = spec.skyLightsCount / Uint8Array.BYTES_PER_ELEMENT;
        geometry.attributes.skyLight.updateRange.offset = _getSlabSkyLightOffset(spec);
        geometry.attributes.skyLight.needsUpdate = true;

        geometry.attributes.torchLight.updateRange.count = spec.torchLightsCount / Uint8Array.BYTES_PER_ELEMENT;
        geometry.attributes.torchLight.updateRange.offset = _getSlabTorchLightOffset(spec);
        geometry.attributes.torchLight.needsUpdate = true;

        geometry.index.updateRange.count = spec.indicesCount / Uint32Array.BYTES_PER_ELEMENT;
        geometry.index.updateRange.offset = _getSlabIndexOffset(spec);
        geometry.index.needsUpdate = true;

        renderer.geometries.update(geometry);
      }
    };
    mesh.freeSlabIndex = index => {
      const slab = slabs[index];
      if (slab) {
        slab.free();
        geometry.groups.splice(geometry.groups.indexOf(slab.group), 1);
        slabs[index] = null;
      }
    };
    const hps = {};
    mesh.hitTracker = _makeHitTracker((id, dmg) => {
      if (!(id in hps)) {
        hps[id] = 100;
      }
      hps[id] = Math.max(hps[id] - dmg, 0);
      return hps[id] > 0;
    }, (positionOffset) => {
      currentVegetationMesh.material[0].uniforms.uHitPosition.value.copy(positionOffset);
      currentVegetationMesh.material[0].uniforms.uHitPosition.needsUpdate = true;
    }, id => {
      currentVegetationMesh.material[0].uniforms.uHitId.value = id;
      currentVegetationMesh.material[0].uniforms.uHitId.needsUpdate = true;
    }, (id, position, quaternion) => {
      _addItem(position, quaternion);

      const subparcelPosition = new THREE.Vector3(
        Math.floor(position.x / SUBPARCEL_SIZE),
        Math.floor(position.y / SUBPARCEL_SIZE),
        Math.floor(position.z / SUBPARCEL_SIZE),
      );
      geometryWorker.requestRemoveObject(tracker, geometrySet, subparcelPosition.x, subparcelPosition.y, subparcelPosition.z, id);

      /* planet.editSubparcel(subparcelPosition.x, subparcelPosition.y, subparcelPosition.z, subparcel => {
        subparcel.removeVegetation(vegetationId);
      });
      mesh.updateSlab(subparcelPosition.x, subparcelPosition.y, subparcelPosition.z); */
    });

    return mesh;
  };
  currentVegetationMesh = _makeVegetationMesh();
  chunkMeshContainer.add(currentVegetationMesh);
  const context = renderer.getContext();
  currentVegetationMesh.onBeforeRender = () => {
    context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
  };
  currentVegetationMesh.onAfterRender = () => {
    context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);
  };

  const _makeThingMesh = () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', thingBufferAttributes.position);
    geometry.setAttribute('uv', thingBufferAttributes.uv);
    geometry.setAttribute('atlasUv', thingBufferAttributes.atlasUv);
    geometry.setAttribute('id', thingBufferAttributes.id);
    geometry.setAttribute('skyLight', thingBufferAttributes.skyLight);
    geometry.setAttribute('torchLight', thingBufferAttributes.torchLight);
    geometry.setIndex(thingBufferAttributes.index);

    const _getSlabPositionOffset = spec => spec.positionsStart / Float32Array.BYTES_PER_ELEMENT;
    const _getSlabUvOffset = spec => spec.uvsStart / Float32Array.BYTES_PER_ELEMENT;
    const _getSlabAtlasUvOffset = spec => spec.atlasUvsStart / Float32Array.BYTES_PER_ELEMENT;
    const _getSlabIdOffset = spec => spec.idsStart / Float32Array.BYTES_PER_ELEMENT;
    const _getSlabSkyLightOffset = spec => spec.skyLightsStart / Uint8Array.BYTES_PER_ELEMENT;
    const _getSlabTorchLightOffset = spec => spec.torchLightsStart / Uint8Array.BYTES_PER_ELEMENT;
    const _getSlabIndexOffset = spec => spec.indicesStart / Uint32Array.BYTES_PER_ELEMENT;

    const thingTexture = new THREE.DataTexture(
      null,
      thingTextureSize, thingTextureSize, /* ,
      THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter */
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: {
          type: 't',
          value: thingTexture,
          needsUpdate: true,
        },
        uSelectId: {
          type: 'f',
          value: -1,
          needsUpdate: true,
        },
      },
      vertexShader: `\
        precision highp float;
        precision highp int;

        uniform float uSelectId;
        attribute vec2 atlasUv;
        attribute float id;
        // attribute float skyLight;
        // attribute float torchLight;
        varying vec3 vSelectColor;

        varying vec2 vUv;
        // varying float vSkyLight;
        // varying float vTorchLight;

        void main() {
          vUv = (atlasUv + uv) * ${(objectTextureSize / thingTextureSize).toFixed(8)};
          vec3 p = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);

          vSelectColor = vec3(0.);
          if (uSelectId == id) {
            vSelectColor = vec3(${new THREE.Color(0x4fc3f7).toArray().join(', ')});
          }

          // vSkyLight = skyLight/8.0;
          // vTorchLight = torchLight/8.0;
        }
      `,
      fragmentShader: `\
        precision highp float;
        precision highp int;

        uniform sampler2D map;
        varying vec2 vUv;
        // varying float vSkyLight;
        // varying float vTorchLight;
        varying vec3 vSelectColor;

        void main() {
          vec4 diffuseColor = texture2D(map, vUv);
          diffuseColor.rgb += vSelectColor;
          gl_FragColor = diffuseColor;
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, [material]);
    mesh.frustumCulled = false;
    mesh.updateGeometry = spec => {
      geometry.attributes.position.updateRange.count = spec.positionsCount / Float32Array.BYTES_PER_ELEMENT;
      if (geometry.attributes.position.updateRange.count > 0) {
        geometry.attributes.position.updateRange.offset = _getSlabPositionOffset(spec);
        geometry.attributes.position.needsUpdate = true;

        geometry.attributes.uv.updateRange.count = spec.uvsCount / Float32Array.BYTES_PER_ELEMENT;
        geometry.attributes.uv.updateRange.offset = _getSlabUvOffset(spec);
        geometry.attributes.uv.needsUpdate = true;

        geometry.attributes.atlasUv.updateRange.count = spec.atlasUvsCount / Float32Array.BYTES_PER_ELEMENT;
        geometry.attributes.atlasUv.updateRange.offset = _getSlabAtlasUvOffset(spec);
        geometry.attributes.atlasUv.needsUpdate = true;

        geometry.attributes.id.updateRange.count = spec.idsCount / Float32Array.BYTES_PER_ELEMENT;
        geometry.attributes.id.updateRange.offset = _getSlabIdOffset(spec);
        geometry.attributes.id.needsUpdate = true;

        geometry.attributes.skyLight.updateRange.count = spec.skyLightsCount / Uint8Array.BYTES_PER_ELEMENT;
        geometry.attributes.skyLight.updateRange.offset = _getSlabSkyLightOffset(spec);
        geometry.attributes.skyLight.needsUpdate = true;

        geometry.attributes.torchLight.updateRange.count = spec.torchLightsCount / Uint8Array.BYTES_PER_ELEMENT;
        geometry.attributes.torchLight.updateRange.offset = _getSlabTorchLightOffset(spec);
        geometry.attributes.torchLight.needsUpdate = true;

        geometry.index.updateRange.count = spec.indicesCount / Uint32Array.BYTES_PER_ELEMENT;
        geometry.index.updateRange.offset = _getSlabIndexOffset(spec);
        geometry.index.needsUpdate = true;

        renderer.geometries.update(geometry);
      }
    };
    mesh.updateTexture = data => {
      thingTexture.image.data = data;
      thingTexture.needsUpdate = true;
    };
    return mesh;
  };
  currentThingMesh = _makeThingMesh();
  chunkMeshContainer.add(currentThingMesh);

  meshDrawer = new MeshDrawer();
  chunkMeshContainer.add(meshDrawer.mesh);

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

  loadPromise.accept();
})();

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

      const material = _makeDrawMaterial(localColor.setStyle('#' + colors[0]).getHex(), localColor.setStyle('#' + colors[1]).getHex(), 0);
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
    var uniforms = skybox2.material.uniforms;
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
      iTime: {value: 0},
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

const _align4 = n => {
  const d = n % 4;
  return d ? (n + 4 - d) : n;
};
const _makeChunkMesh = async (seedString, parcelSize, subparcelSize) => {
  const rng = alea(seedString);
  const seedNum = Math.floor(rng() * 0xFFFFFF);

  const landMaterial = new THREE.ShaderMaterial({
    uniforms: LAND_SHADER.uniforms,
    vertexShader: LAND_SHADER.vertexShader,
    fragmentShader: LAND_SHADER.fragmentShader,
    extensions: {
      derivatives: true,
    },
  });
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: WATER_SHADER.uniforms,
    vertexShader: WATER_SHADER.vertexShader,
    fragmentShader: WATER_SHADER.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    extensions: {
      derivatives: true,
    },
  });
  (async () => {
    const texture = await new Promise((accept, reject) => {
      const img = new Image();
      img.onload = () => {
        const texture = new THREE.Texture(img);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        // texture.minFilter = THREE.NearestMipmapNearestFilter;
        texture.flipY = false;
        texture.needsUpdate = true;
        accept(texture);
      };
      img.onerror = reject;
      img.src = './ground-texture.png';

      /* basisLoader.load('ground-texture.basis', texture => {
        // console.timeEnd('basis texture load');
        texture.minFilter = THREE.LinearFilter;
        accept(texture);
      }, () => {
        // console.log('onProgress');
      }, err => {
        reject(err);
      }); */
    });
    landMaterial.uniforms.tex.value = texture;
    landMaterial.uniforms.tex.needsUpdate = true;
    waterMaterial.uniforms.tex.value = texture;
    waterMaterial.uniforms.tex.needsUpdate = true;
  })();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', landBufferAttributes.position);
  geometry.setAttribute('normal', landBufferAttributes.normal);
  geometry.setAttribute('uv', landBufferAttributes.uv);
  // geometry.setAttribute('barycentric', landBufferAttributes.barycentric);
  geometry.setAttribute('ao', landBufferAttributes.ao);
  geometry.setAttribute('id', landBufferAttributes.id);
  geometry.setAttribute('skyLight', landBufferAttributes.skyLight);
  geometry.setAttribute('torchLight', landBufferAttributes.torchLight);
  // geometry.allocators = allocators;
  // const {peeks} = bufferAttributes;
  // geometry.peeks = peeks;

  const mesh = new THREE.Mesh(geometry, [landMaterial, waterMaterial]);
  mesh.frustumCulled = false;
  mesh.seedNum = seedNum;
  mesh.meshId = currentChunkMeshId;
  mesh.seedString = seedString;
  mesh.parcelSize = parcelSize;
  mesh.subparcelSize = subparcelSize;
  mesh.isChunkMesh = true;

  const _getSlabPositionOffset = spec => spec.positionsStart / Float32Array.BYTES_PER_ELEMENT;
  const _getSlabNormalOffset = spec => spec.normalsStart / Float32Array.BYTES_PER_ELEMENT;
  const _getSlabUvOffset = spec => spec.uvsStart / Float32Array.BYTES_PER_ELEMENT;
  const _getSlabAoOffset = spec => spec.aosStart / Uint8Array.BYTES_PER_ELEMENT;
  const _getSlabIdOffset = spec => spec.idsStart / Float32Array.BYTES_PER_ELEMENT;
  const _getSlabSkyLightOffset = spec => spec.skyLightsStart / Uint8Array.BYTES_PER_ELEMENT;
  const _getSlabTorchLightOffset = spec => spec.torchLightsStart / Uint8Array.BYTES_PER_ELEMENT;

  mesh.updateGeometry = spec => {
    geometry.attributes.position.updateRange.count = spec.positionsCount / Float32Array.BYTES_PER_ELEMENT;
    if (geometry.attributes.position.updateRange.count > 0) {
      geometry.attributes.position.updateRange.offset = _getSlabPositionOffset(spec);
      geometry.attributes.position.needsUpdate = true;

      geometry.attributes.normal.updateRange.count = spec.normalsCount / Float32Array.BYTES_PER_ELEMENT;
      geometry.attributes.normal.updateRange.offset = _getSlabNormalOffset(spec);
      geometry.attributes.normal.needsUpdate = true;

      geometry.attributes.uv.updateRange.count = spec.uvsCount / Float32Array.BYTES_PER_ELEMENT;
      geometry.attributes.uv.updateRange.offset = _getSlabUvOffset(spec);
      geometry.attributes.uv.needsUpdate = true;

      geometry.attributes.ao.updateRange.count = spec.aosCount / Uint8Array.BYTES_PER_ELEMENT;
      geometry.attributes.ao.needsUpdate = true;
      geometry.attributes.ao.updateRange.offset = _getSlabAoOffset(spec);

      geometry.attributes.id.updateRange.count = spec.idsCount / Float32Array.BYTES_PER_ELEMENT;
      geometry.attributes.id.updateRange.offset = _getSlabIdOffset(spec); // XXX can be removed and moved to uniforms for vegetation via vertexId
      geometry.attributes.id.needsUpdate = true;

      geometry.attributes.skyLight.updateRange.count = spec.skyLightsCount / Uint8Array.BYTES_PER_ELEMENT;
      geometry.attributes.skyLight.updateRange.offset = _getSlabSkyLightOffset(spec);
      geometry.attributes.skyLight.needsUpdate = true;

      geometry.attributes.torchLight.updateRange.count = spec.torchLightsCount / Uint8Array.BYTES_PER_ELEMENT;
      geometry.attributes.torchLight.updateRange.offset = _getSlabTorchLightOffset(spec);
      geometry.attributes.torchLight.needsUpdate = true;

      renderer.geometries.update(geometry);
    }
  };

  const currentPosition = new THREE.Vector3(NaN, NaN, NaN);
  mesh.currentPosition = currentPosition;
  /* window.getCurrentSubparcel = () => {
    localVector.set(
      Math.floor(currentPosition.x/SUBPARCEL_SIZE),
      Math.floor(currentPosition.y/SUBPARCEL_SIZE),
      Math.floor(currentPosition.z/SUBPARCEL_SIZE)
    );
    return window.getSubparcel(localVector.x, localVector.y, localVector.z);
  }; */
  // const animalsTasks = [];
  const _updateCurrentPosition = position => {
    currentPosition.copy(position)
      .applyMatrix4(localMatrix2.getInverse(mesh.matrixWorld));
    // `.log('current position', currentPosition.x);
  };
  /* const _updatePackages = () => {
    const packagesNeedUpdate = false;
    if (packagesNeedUpdate) {
      if (!packagesRunning) {
        (async () => {
          packagesRunning = true;
          packagesNeedUpdate = false;

          for (let i = 0; i < neededCoords.length; i++) {
            const neededCoord = neededCoords[i];
            const {index} = neededCoord;
            const subparcel = planet.peekSubparcelByIndex(index);
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
              const subparcel = planet.peekSubparcelByIndex(index);
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
  }; */
  /* const _killAnimalsTasks = index => {
    const subparcelTasks = animalsTasks[index];
    if (subparcelTasks) {
      for (const task of subparcelTasks) {
        task.cancel();
      }
      subparcelTasks.length = 0;
    }
  };
  const _updateAnimalsRemove = () => {
    if (removedCoords.length > 0) {
      animals = animals.filter(animal => {
        if (removedCoords.some(removedCoord => removedCoord.index === animal.index)) {
          animal.parent.remove(animal);
          animal.destroy();
          return false;
        } else {
          return true;
        }
      });
      for (const removedCoord of removedCoords) {
        _killAnimalsTasks(removedCoord.index);
      }
    }
  };
  const _updateAnimalsAdd = () => {
    for (const addedCoord of addedCoords) {
      const {index} = addedCoord;
      let subparcelTasks = animalsTasks[index];
      if (!subparcelTasks) {
        subparcelTasks = [];
        animalsTasks[index] = subparcelTasks;
      }

      let live = true;
      (async () => {
        const subparcel = planet.peekSubparcelByIndex(index);
        await subparcel.load;
        if (!live) return;

        const spawners = subparcel.vegetations
          .filter(vegetation => vegetation.name === 'spawner')
          .map(vegetation => ({
            position: vegetation.position,
          }));

        for (const spawner of spawners) {
          if (!makeAnimal) {
            makeAnimal = makeAnimalFactory(geometryWorker);
          }

          localVector.fromArray(spawner.position);
          const animal = makeAnimal(localVector, Math.floor(Math.random()*0xFFFFFF), () => {
            animal.parent.remove(animal);
            animal.destroy();
            animals.splice(animals.indexOf(animal), 1);
            _addItem(animal.position, animal.quaternion);
          });
          animal.index = subparcel.index;
          mesh.add(animal);
          animals.push(animal);
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
    }
  };
  const _updateAnimals = () => {
    _updateAnimalsRemove();
    _updateAnimalsAdd();
  }; */
  mesh.update = position => {
    _updateCurrentPosition(position);
    // _updateAnimals();
  };
  return mesh;
};

planet.addEventListener('load', async e => {
  const {data: chunkSpec} = e;

  const chunkMesh = await _makeChunkMesh(chunkSpec.seedString, chunkSpec.parcelSize, chunkSpec.subparcelSize);
  chunkMeshContainer.add(chunkMesh);
  currentChunkMesh = chunkMesh;

  chunkMesh.updateMatrixWorld();

  const p = new THREE.Vector3(0, 0, 0).applyMatrix4(new THREE.Matrix4().getInverse(chunkMesh.matrixWorld));
  const ncx = Math.floor(p.x / SUBPARCEL_SIZE) * SUBPARCEL_SIZE;
  const ncy = Math.floor(p.y / SUBPARCEL_SIZE) * SUBPARCEL_SIZE;
  const ncz = Math.floor(p.z / SUBPARCEL_SIZE) * SUBPARCEL_SIZE;

  const height = await geometryWorker.requestGetHeight(chunkMesh.seedNum, ncx, ncy + SUBPARCEL_SIZE, ncz, baseHeight, PARCEL_SIZE);
  worldContainer.position.y = -height // - _getAvatarHeight();
});
planet.addEventListener('unload', () => {
  const oldChunkMesh = currentChunkMesh;
  if (oldChunkMesh) {
    chunkMeshContainer.remove(oldChunkMesh);
    currentChunkMesh = null;
  }
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

function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

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
      if (geometry.attributes.position.array[i + 1] > 0) {
        geometry.attributes.position.array[i] = Math.sign(geometry.attributes.position.array[i]);
        geometry.attributes.position.array[i + 2] = Math.sign(geometry.attributes.position.array[i + 2]);
      }
    }

    geometry
      .applyMatrix4(new THREE.Matrix4().makeTranslation(position.x, position.y, position.z))
      .applyMatrix4(new THREE.Matrix4().makeScale(scale.x, scale.y, scale.z));

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

const cubeMesh = makeCubeMesh();
scene.add(cubeMesh);

const rayMesh = makeRayMesh();
rayMesh.visible = false;
scene.add(rayMesh);

/* const uiMesh = makeUiFullMesh(cubeMesh);
scene.add(uiMesh); */

const buildsMesh = makeInventoryMesh(cubeMesh, async scrollFactor => {
  await loadPromise;

  if (!buildsMesh.inventoryBuildsMesh) {
    buildsMesh.inventoryBuildsMesh = _makeInventoryBuildsMesh();
    buildsMesh.inventoryBuildsMesh.frustumCulled = false;
    buildsMesh.add(buildsMesh.inventoryBuildsMesh);
  }
});
buildsMesh.visible = false;
buildsMesh.handleIconClick = (i, srcIndex) => {
  // console.log('handle builds click', i, srcIndex);
  // if (srcIndex < buildsMesh.inventoryBuildsMesh.meshes.length) {
    const dx = srcIndex%3;
    const dy = (srcIndex-dx)/3;
    buildMode = ['wall', 'floor', 'stair'][dx];
    buildMat = ['wood', 'stone', 'metal'][dy];
  // }
};
scene.add(buildsMesh);

const thingsMesh = makeInventoryMesh(cubeMesh, async scrollFactor => {
  await loadPromise;
  thingsMesh.queue.clearQueue();
  await thingsMesh.queue.lock();

  if (!thingsMesh.inventoryContentsMesh) {
    thingsMesh.inventoryContentsMesh = _makeInventoryContentsMesh();
    thingsMesh.inventoryContentsMesh.position.set(-0.1/2, 0, 0);
    thingsMesh.inventoryContentsMesh.frustumCulled = false;
    thingsMesh.add(thingsMesh.inventoryContentsMesh);
  }

  const geometryKeys = await geometryWorker.requestGetGeometryKeys(geometrySet);
  const geometryRequests = [];

  const h = 0.1;
  const arrowW = h/10;
  const wrapInnerW = h - 2*arrowW;
  const w = wrapInnerW/3;

  // console.log('scroll', scrollFactor, geometryKeys.length, Math.floor(scrollFactor*geometryKeys.length), Math.floor(scrollFactor*geometryKeys.length/3)*3);
  const startIndex = Math.floor(scrollFactor*(geometryKeys.length-9)/3)*3;
  let i = 0;
  const currentGeometryKeys = [];
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      const srcIndex = startIndex + i;
      if (srcIndex < geometryKeys.length) {
        const name = geometryKeys[srcIndex];
        geometryRequests.push({
          name,
          position: new THREE.Vector3(-h/2 + w/2 + dx*w, h/2 - arrowW - w/2 - dy*w, w/2),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(w, w, w),
        });
        currentGeometryKeys.push(name);
        i++;
      }
    }
  }
  const newGeometry = await geometryWorker.requestGetGeometries(geometrySet, geometryRequests);
  thingsMesh.inventoryContentsMesh.geometry.setAttribute('position', newGeometry.attributes.position);
  thingsMesh.inventoryContentsMesh.geometry.setAttribute('uv', newGeometry.attributes.uv);
  thingsMesh.inventoryContentsMesh.geometry.setIndex(newGeometry.index);

  thingsMesh.geometryKeys = geometryKeys;
  thingsMesh.currentGeometryKeys = currentGeometryKeys;

  thingsMesh.queue.unlock();
});
thingsMesh.visible = false;
thingsMesh.geometryKeys = null;
thingsMesh.currentGeometryKeys = null;
thingsMesh.inventoryContentsMesh = null;
thingsMesh.queue = new WaitQueue();
thingsMesh.handleIconClick = (i, srcIndex) => {
  if (srcIndex < thingsMesh.currentGeometryKeys.length) {
    const geometryKey = thingsMesh.currentGeometryKeys[srcIndex];
    (async () => {
      const geometry = await geometryWorker.requestGetGeometry(geometrySet, geometryKey);
      const material = currentVegetationMesh.material[0];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      meshComposer.setPlaceMesh(i, mesh);
    })();
  }
};
scene.add(thingsMesh);

const shapesMesh = makeInventoryMesh(cubeMesh, async scrollFactor => {
  await loadPromise;

  if (!shapesMesh.inventoryShapesMesh) {
    shapesMesh.inventoryShapesMesh = _makeInventoryShapesMesh();
    shapesMesh.inventoryShapesMesh.frustumCulled = false;
    shapesMesh.add(shapesMesh.inventoryShapesMesh);
  }
});
shapesMesh.visible = false;
shapesMesh.handleIconClick = (i, srcIndex) => {
  // console.log('handle shapes click', srcIndex);
  if (srcIndex < shapesMesh.inventoryShapesMesh.geometries.length) {
    const geometry = shapesMesh.inventoryShapesMesh.geometries[srcIndex];
    const material = shapesMesh.inventoryShapesMesh.material.clone();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    meshComposer.setPlaceMesh(i, mesh);

    /* (async () => {
      const geometry = await geometryWorker.requestGetGeometry(geometrySet, geometryKey);
      const material = currentVegetationMesh.material[0];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      meshComposer.setPlaceMesh(i, mesh);
    })(); */
  }
};
scene.add(shapesMesh);

const inventoryMesh = makeInventoryMesh(cubeMesh, async scrollFactor => {
  await loadPromise;

  if (!inventoryMesh.inventoryItemsMesh) {
    inventoryMesh.inventoryItemsMesh = _makeInventoryItemsMesh();
    inventoryMesh.add(inventoryMesh.inventoryItemsMesh);
  }
});
inventoryMesh.visible = false;
inventoryMesh.handleIconClick = async (i, srcIndex) => {
  const files = inventory.getFiles();
  const file = files[srcIndex];
  const {name, hash} = file;
  const res = await fetch(`${storageHost}/${hash}`);
  const blob = await res.blob();
  blob.name = name;

  const mesh = await inventory.loadFileForWorld(blob);
  mesh.traverse(o => {
    if (o.isMesh) {
      o.frustumCulled = false;
    }
  });
  meshComposer.setPlaceMesh(i, mesh);

  /* const xrCamera = currentSession ? renderer.xr.getCamera(camera) : camera;
  mesh.position.copy(xrCamera.position)
    .add(new THREE.Vector3(0, 0, -1.5).applyQuaternion(xrCamera.quaternion));
  mesh.quaternion.copy(xrCamera.quaternion); */

  /* if (srcIndex < inventoryMesh.currentGeometryKeys.length) {
    const geometryKey = inventoryMesh.currentGeometryKeys[srcIndex];
    (async () => {
      const geometry = await geometryWorker.requestGetGeometry(geometrySet, geometryKey);
      const material = currentVegetationMesh.material[0];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      meshComposer.setPlaceMesh(i, mesh);
    })();
  } */
};
scene.add(inventoryMesh);

const _makeDrawMaterial = (color1, color2, numPoints) => new THREE.ShaderMaterial({
  uniforms: {
    color1: {
      type: 'c',
      value: new THREE.Color(color1),
      needsUpdate: true,
    },
    color2: {
      type: 'c',
      value: new THREE.Color(color2),
      needsUpdate: true,
    },
    numPoints: {
      type: 'f',
      value: numPoints,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `\
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float numPoints;

    varying vec2 vUv;

    void main() {
      vec3 c = mix(color1, color2, vUv.y/numPoints);
      gl_FragColor = vec4(c, 1.);
    }
  `,
  side: THREE.DoubleSide,
});

const _makeInventoryContentsMesh = () => {
  const geometry = new THREE.BufferGeometry();
  const material = currentVegetationMesh.material[0];
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};
const _makeInventoryBuildsMesh = () => {
  const scaleMatrix = new THREE.Matrix4().makeScale(0.1, 0.1, 0.1);
  const meshes = (() => {
    const result = Array(9);
    for (let i = 0; i < buildMeshes.walls.length; i++) {
      result[i*3] = buildMeshes.walls[i];
    }
    for (let i = 0; i < buildMeshes.platforms.length; i++) {
      result[i*3+1] = buildMeshes.platforms[i];
    }
    for (let i = 0; i < buildMeshes.ramps.length; i++) {
      result[i*3+2] = buildMeshes.ramps[i];
    }
    return result;
  })();
  const geometries = meshes.map(m => m.geometry);
  const material = buildMeshes.walls[0].material;

  const h = 0.1;
  const arrowW = h/10;
  const wrapInnerW = h - 2*arrowW;
  const w = wrapInnerW/3;

  const _compileGeometry = () => BufferGeometryUtils.mergeBufferGeometries(geometries.map((geometry, i) => {
    const dx = i%3;
    const dy = (i-dx)/3;
    return geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(w*2 * 0.1, w*2 * 0.1, w*2 * 0.1))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-h + w/2 + dx*w, h/2 - arrowW - w/2 - dy*w, w/4));
  }));
  const geometry = _compileGeometry();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.meshes = meshes;
  return mesh;
};
const _makeInventoryShapesMesh = () => {
  const boxMesh = new THREE.BoxBufferGeometry()
  const coneMesh = new THREE.ConeBufferGeometry();
  const cylinderMesh = new THREE.CylinderBufferGeometry();
  const dodecahedronMesh = new THREE.DodecahedronBufferGeometry();
  const icosahedronMesh = new THREE.IcosahedronBufferGeometry();
  const octahedronMesh = new THREE.OctahedronBufferGeometry();
  const sphereMesh = new THREE.SphereBufferGeometry();
  const tetrahedronMesh = new THREE.TetrahedronBufferGeometry();
  const torusMesh = new THREE.TorusBufferGeometry();
  const geometries = [
    boxMesh,
    coneMesh,
    cylinderMesh,
    dodecahedronMesh,
    icosahedronMesh,
    octahedronMesh,
    sphereMesh,
    tetrahedronMesh,
    torusMesh,
  ];
  const material = _makeDrawMaterial(localColor.setStyle('#' + colors[0]).getHex(), localColor.setStyle('#' + colors[1]).getHex(), 1);
  const scaleMatrix = new THREE.Matrix4().makeScale(0.1, 0.1, 0.1);
  for (const geometry of geometries) {
    geometry.applyMatrix4(scaleMatrix);
    geometry.boundingBox = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
    
    if (!geometry.index) {
      const indices = new Uint16Array(geometry.attributes.position.array.length/3);
      for (let i = 0; i < indices.length; i++) {
        indices[i] = i;
      }
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }
  }

  const h = 0.1;
  const arrowW = h/10;
  const wrapInnerW = h - 2*arrowW;
  const w = wrapInnerW/3;

  const _compileGeometry = () => BufferGeometryUtils.mergeBufferGeometries(geometries.map((geometry, i) => {
    const dx = i%3;
    const dy = (i-dx)/3;
    return geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(w*2, w*2, w*2))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-h + w/2 + dx*w, h/2 - arrowW - w/2 - dy*w, w/4));
  }));
  const geometry = _compileGeometry();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.geometries = geometries;
  mesh.setColors = selectedColors => {
    mesh.material.uniforms.color1.value.setStyle('#' + colors[selectedColors[0]]);
    mesh.material.uniforms.color1.needsUpdate = true;
    mesh.material.uniforms.color2.value.setStyle('#' + colors[selectedColors[1]]);
    mesh.material.uniforms.color2.needsUpdate = true;
  };
  return mesh;
};
const _makeInventoryItemsMesh = () => {
  const h = 0.1;
  const arrowW = h/10;
  const wrapInnerW = h - 2*arrowW;
  const w = wrapInnerW/3;
  
  const object = new THREE.Object3D();
  object.update = async files => {
    for (let i = 0; i < files.length; i++) {
      const {name, hash} = files[i];
      const dx = i%3;
      const dy = (i-dx)/3;

      {
        const res = await fetch(`${storageHost}/${hash}`);
        const blob = await res.blob();
        blob.name = name;
        const mesh = await inventory.loadFileForWorld(blob);

        mesh.position.set(-h + w/2 + dx*w, h/2 - arrowW - w/2 - dy*w, w/4);
        mesh.scale.set(w*2 * 0.1, w*2 * 0.1, w*2 * 0.1);
        object.add(mesh);
      }

      const textMesh = makeTextMesh(name, './Bangers-Regular.ttf', 0.003, 'left', 'bottom');
      textMesh.position.set(-h + 0.004 + dx*w, h/2 - arrowW - w - dy*w, 0.001);
      object.add(textMesh);
    }
  };
  return object;
};

let selectedColors;
const colorsMesh = makeColorsMesh(cubeMesh, colors, newSelectedColors => {
  selectedColors = newSelectedColors;
  shapesMesh.inventoryShapesMesh.setColors(selectedColors);
  meshDrawer.setColors(selectedColors);
});
colorsMesh.visible = false;
scene.add(colorsMesh);

const detailsMesh = makeDetailsMesh(cubeMesh, function onrun(anchorSpec) {
  meshComposer.run();
  /* const mesh = meshComposer.commit();
  scene.add(mesh);
  detailsMesh.visible = false; */
}, async function onadd(anchorSpec) {
  const mesh = meshComposer.commit();
  mesh.material = new THREE.MeshBasicMaterial({
    map: mesh.material.uniforms.map.value,
    side: THREE.DoubleSide,
    vertexColors: true,
    transparent: true,
  });
  mesh.userData.gltfExtensions = {
    EXT_aabb: mesh.geometry.boundingBox.min.toArray()
      .concat(mesh.geometry.boundingBox.max.toArray()),
  };
  const arrayBuffer = await new Promise((accept, reject) => {
    new GLTFExporter().parse(mesh, accept, {
      binary: true,
      includeCustomExtensions: true,
    });
  });
  arrayBuffer.name = 'object.glb';
  await inventory.uploadFile(arrayBuffer);

  detailsMesh.visible = false;
}, function onremove(anchorSpec) {
  // console.log('got remove', anchorSpec);
  meshComposer.cancel();
  detailsMesh.visible = false;
}, function onclose() {
  detailsMesh.visible = false;
});
detailsMesh.visible = false;
scene.add(detailsMesh);

const menuMeshes = [buildsMesh, thingsMesh, shapesMesh, inventoryMesh, colorsMesh];
const uiMeshes = menuMeshes.concat([detailsMesh]);

let selectedWeapon = 'hand';
let lastSelectedWeapon = selectedWeapon;
let currentWeaponDown = false;
let lastWeaponDown = false;
let currentWeaponValue = 0;
let lastWeaponValue = 0;
let currentWeaponGrabs = [false, false];
let lastWeaponGrabs = [false, false];
const weapons = Array.from(document.querySelectorAll('.weapon'));
for (let i = 0; i < weapons.length; i++) {
  const weapon = document.getElementById('weapon-' + (i + 1));
  weapon.addEventListener('click', e => {
    for (let i = 0; i < weapons.length; i++) {
      weapons[i].classList.remove('selected');
    }
    weapon.classList.add('selected');

    selectedWeapon = weapon.getAttribute('weapon');
  });
}
const toolsMesh = makeToolsMesh(weapons.map(weapon => weapon.getAttribute('weapon')), newSelectedWeapon => {
  selectedWeapon = newSelectedWeapon;
});
toolsMesh.visible = false;
scene.add(toolsMesh);

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

  // uiMesh.position.copy(localVector3).add(localVector5.set(-0.3, -0.1, -0.5).applyQuaternion(localQuaternion2));
  // uiMesh.quaternion.copy(localQuaternion2);

  // toolsMesh.position.lerp(localVector4.copy(localVector3).add(localVector5.set(0, -0.25, -0.5).applyQuaternion(localQuaternion2)), 0.1);
  // toolsMesh.quaternion.slerp(localQuaternion2, 0.1);

  // inventoryMesh.position.lerp(localVector4.copy(localVector3).add(localVector5.set(0, 0, -0.2).applyQuaternion(localQuaternion2)), 0.1);
  // inventoryMesh.quaternion.slerp(localQuaternion2, 0.1);

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
  currentChunkMesh && currentChunkMesh.update(localVector3);
};

/* const cubeMesh = (() => {
  const geometry = new THREE.BoxBufferGeometry(0.02, 0.02, 0.02);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00FF00,
  });
  return new THREE.Mesh(geometry, material);
})();
cubeMesh.frustumCulled = false;
scene.add(cubeMesh); */

const velocity = new THREE.Vector3();
// const lastGrabs = [false, false];
const lastAxes = [[0, 0, 0, 0], [0, 0, 0, 0]];
const lastButtons = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];
let currentTeleport = false;
let lastTeleport = false;
let currentSelector = false;
let lastSelector = false;
const timeFactor = 60 * 1000;
let lastTimestamp = performance.now();
// let lastParcel  = new THREE.Vector3(0, 0, 0);
let raycastChunkSpec = null;
const startTime = Date.now();
function animate(timestamp, frame) {
  timestamp = timestamp || performance.now();
  const timeDiff = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  const now = Date.now();
  if (currentChunkMesh && skybox2) {
    for (const material of currentChunkMesh.material) {
      const {uniforms} = material;
      uniforms.uTime.value = (now % timeFactor) / timeFactor;
      uniforms.uTime.needsUpdate = true;
      uniforms.sunIntensity.value = Math.max(skybox2.material.uniforms.sunPosition.value.y, 0);
      uniforms.sunIntensity.needsUpdate = true;
      uniforms.sunDirection.value.copy(skybox2.material.uniforms.sunPosition.value).normalize();
      window.sunDirection = uniforms.sunDirection.value;
      uniforms.sunDirection.needsUpdate = true;
    }
  }
  if (currentVegetationMesh && skybox2) {
    for (const material of currentVegetationMesh.material) {
      const {uniforms} = material;
      uniforms.sunIntensity.value = Math.max(skybox2.material.uniforms.sunPosition.value.y, 0);
      uniforms.sunIntensity.needsUpdate = true;
    }
  }
  if (currentVegetationMesh) {
    currentVegetationMesh.hitTracker.update();
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

  for (const animal of animals) {
    animal.update();
  }
  cometFireMesh.material.uniforms.uAnimation.value = (Date.now() % 2000) / 2000;
  hpMesh.update();
  if (skybox) {
    skybox.material.uniforms.iTime.value = ((Date.now() - startTime) % 3000) / 3000;
  }
  skybox2 && skybox2.update();
  crosshairMesh && crosshairMesh.update();
  // uiMesh && uiMesh.update();
  
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
          currentSelector = (axes[1] > 0.75 || axes[3] > 0.75);

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
    
    if (currentSelector) {
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
    /* const leftInputSource = inputSources.find(inputSource => inputSource.handedness === 'left');
    const pose = leftInputSource && frame.getPose(leftInputSource.targetRaySpace, renderer.xr.getReferenceSpace());
    if (pose) {
      localMatrix2.fromArray(pose.transform.matrix);
      _collideItems(localMatrix2);
    }
    _collideChunk(xrCamera.matrix);

    rigManager.setLocalRigMatrix(null); */
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
      // console.log('got gamepads', gamepads);
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

  const _updateTools = () => {
    orbitControls.enabled = selectedTool === 'camera' && !['pencil', 'paintbrush'].includes(selectedWeapon);

    for (let i = 0; i < 2; i++) {
      anchorSpecs[i] = null;
    }
    raycastChunkSpec = null;
    rayMesh.visible = false;

    const _raycastWeapon = () => {
      if (['build', 'things', 'shapes', 'inventory', 'colors', 'select'].includes(selectedWeapon)) {
        const [{position, quaternion}] = _getRigTransforms();
        raycaster.ray.origin.copy(position);
        raycaster.ray.direction.set(0, 0, -1).applyQuaternion(quaternion);
        anchorSpecs[0] = intersectUi(raycaster, uiMeshes) || meshComposer.intersect(raycaster);

        if (anchorSpecs[0]) {
          rayMesh.position.copy(position);
          rayMesh.quaternion.copy(quaternion);
          rayMesh.scale.set(1, 1, position.distanceTo(anchorSpecs[0].point));
          rayMesh.visible = true;
        }
      }
      if (!anchorSpecs[0]) {
        const result = geometryWorker.raycast(tracker, rigManager.localRig.inputs.leftGamepad.position, rigManager.localRig.inputs.leftGamepad.quaternion);
        raycastChunkSpec = result;
        if (raycastChunkSpec) {
          raycastChunkSpec.point = new THREE.Vector3().fromArray(raycastChunkSpec.point);
          raycastChunkSpec.normal = new THREE.Vector3().fromArray(raycastChunkSpec.normal);
          raycastChunkSpec.objectPosition = new THREE.Vector3().fromArray(raycastChunkSpec.objectPosition);
          raycastChunkSpec.objectQuaternion = new THREE.Quaternion().fromArray(raycastChunkSpec.objectQuaternion);
          cubeMesh.position.copy(raycastChunkSpec.point);
        }
      }
    };
    _raycastWeapon();

    const _selectWeapon = () => {
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
          case 'pickaxe': {
            return pickaxeMesh;
          }
          case 'shovel': {
            return pickaxeMesh;
          }
          case 'build': {
            return [plansMesh, pencilMesh];
          }
          case 'things': {
            return pencilMesh;
          }
          case 'shapes': {
            return pencilMesh;
          }
          case 'light': {
            return paintBrushMesh;
          }
          case 'pencil': {
            return pencilMesh;
          }
          case 'paintbrush': {
            return paintBrushMesh;
          }
          case 'select': {
            return pencilMesh;
          }
          case 'physics': {
            return pencilMesh;
          }
          default: {
            return null;
          }
        }
      })();
      if (selectedWeaponModel) {
        if (!selectedWeaponModel.isMesh) {
          if (Array.isArray(selectedWeaponModel)) {
            // const pose2 = frame.getPose(session.inputSources[0].targetRaySpace, referenceSpace);
            // localMatrix.fromArray(pose.transform.matrix)
            // .decompose(localVector3, localQuaternion2, localVector4);

            selectedWeaponModel.forEach((weaponMesh, i) => {
              if (weaponMesh) {
                if (i === 0) {
                  weaponMesh.position.copy(rightGamepad.position);
                  weaponMesh.quaternion.copy(rightGamepad.quaternion);
                  weaponMesh.visible = true;
                } else if (i === 1) {
                  weaponMesh.position.copy(leftGamepad.position);
                  weaponMesh.quaternion.copy(leftGamepad.quaternion);
                  weaponMesh.visible = true;
                }
              }
            });
          } else {
            const {weapon, crosshair} = selectedWeaponModel;
            if (weapon) {
              weapon.position.copy(rightGamepad.position);
              weapon.quaternion.copy(rightGamepad.quaternion);
              weapon.visible = true;
            }
            if (crosshair) {
              crosshair.visible = true;
            }
          }
        } else {
          selectedWeaponModel.position.copy(rightGamepad.position);
          selectedWeaponModel.quaternion.copy(rightGamepad.quaternion);
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
            crosshairMesh.position.copy(rightGamepad.position)
              .add(localVector2.set(0, 0, -500).applyQuaternion(rightGamepad.quaternion));
            crosshairMesh.quaternion.copy(rightGamepad.quaternion);
            crosshairMesh.visible = true;
          }
          break;
        }
        case 'pickaxe':
        case 'shovel': {
          if (raycastChunkSpec) {
            removeMesh.position.copy(raycastChunkSpec.point);
            removeMesh.quaternion.setFromUnitVectors(localVector2.set(0, 1, 0), raycastChunkSpec.normal);
            removeMesh.visible = true;
          }
          break;
        }
        case 'build': {
          addMesh.position.copy(rightGamepad.position)
            .add(localVector2.set(0, 0, -2).applyQuaternion(rightGamepad.quaternion));
          addMesh.quaternion.copy(rightGamepad.quaternion);
          addMesh.visible = true;
          break;
        }
      }
    };
    _selectWeapon();

    const _handleBuild = () => {
      for (const k in buildMeshes) {
        for (const buildMesh of buildMeshes[k]) {
          buildMesh.parent && buildMesh.parent.remove(buildMesh);
        }
      }
      if (selectedWeapon === 'build') {
        const buildMesh = (() => {
          const buildMatIndex = ['wood', 'stone', 'metal'].indexOf(buildMat);
          switch (buildMode) {
            case 'wall': return buildMeshes.walls[buildMatIndex];
            case 'floor': return buildMeshes.platforms[buildMatIndex];
            case 'stair': return buildMeshes.ramps[buildMatIndex];
            default: return null;
          }
        })();

        buildMesh.position.copy(rightGamepad.position)
          .add(localVector3.set(0, 0, -BUILD_SNAP).applyQuaternion(rightGamepad.quaternion))
          .add(localVector3.set(0, -BUILD_SNAP / 2, 0));
        buildMesh.quaternion.copy(rightGamepad.quaternion);

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
          localVector3,
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
        if (!hasBuildMesh) {
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
    };
    _handleBuild();

    const _handleDown = () => {
      if (currentWeaponDown && !lastWeaponDown) { // XXX make this dual handed
        // place
        for (let i = 0; i < 2; i++) {
          const placeMesh = meshComposer.getPlaceMesh(i);
          if (placeMesh) {
            meshComposer.trigger(i);
            return;
          }
        }
        // else
        const _applyLightfieldDelta = async (position, delta) => {
          localVector2.copy(position)
            .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
          localVector2.x = Math.floor(localVector2.x);
          localVector2.y = Math.floor(localVector2.y);
          localVector2.z = Math.floor(localVector2.z);

          const mineSpecs = _applyMineSpec(localVector2, delta, 'lightfield', SUBPARCEL_SIZE_P1, planet.getFieldIndex, delta);
          await _mine(mineSpecs, null);
        };
        const _applyHit = delta => {
          if (raycastChunkSpec) {
            if (raycastChunkSpec.objectId === 0) {
              localVector2.copy(raycastChunkSpec.point)
                .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));

              geometryWorker.requestMine(tracker, localVector2, delta);
            } else {
              currentVegetationMesh.hitTracker.hit(raycastChunkSpec.objectId, raycastChunkSpec.objectPosition, raycastChunkSpec.objectQuaternion, 30);
            }
          }
        };
        const _hit = () => _applyHit(-0.3);
        const _unhit = () => _applyHit(0.3);
        const _light = () => {
          if (raycastChunkSpec) {
            localVector2.copy(raycastChunkSpec.point)
              .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));

            geometryWorker.requestLight(tracker, localVector2, 4);

            /* if (raycastChunkSpec.mesh.isChunkMesh || raycastChunkSpec.mesh.isVegetationMesh) {
              _applyLightfieldDelta(raycastChunkSpec.point, 4);

              localVector2.copy(raycastChunkSpec.point)
                .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
              localVector2.x = Math.floor(localVector2.x / SUBPARCEL_SIZE);
              localVector2.y = Math.floor(localVector2.y / SUBPARCEL_SIZE);
              localVector2.z = Math.floor(localVector2.z / SUBPARCEL_SIZE);
              currentChunkMesh.updateSlab(localVector2.x, localVector2.y, localVector2.z);
            } */
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
        const _openDetailsMesh = (point, mesh) => {
          detailsMesh.position.copy(point);
          localEuler.setFromQuaternion(localQuaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, -1),
            detailsMesh.position.clone().sub(xrCamera.position).normalize()
          ), 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          detailsMesh.quaternion.setFromEuler(localEuler);
          detailsMesh.visible = true;
        };
        const _triggerAnchor = mesh => {
          for (let i = 0; i < 2; i++) {
            const anchorSpec = anchorSpecs[i];
            if (anchorSpec) {
              let match;
              if (match = anchorSpec.anchor && anchorSpec.anchor.id.match(/^icon-([0-9]+)$/)) { // menu icon
                const srcIndex = parseInt(match[1], 10);
                mesh.handleIconClick(i, srcIndex);
              } else {
                if (anchorSpec.object.click) { // menu non-icon
                  anchorSpec.object.click(anchorSpec);
                } else { // non-menu
                  _openDetailsMesh(anchorSpec.point, anchorSpec.object);
                }
              }
            }
          }
        };
        switch (selectedWeapon) {
          case 'rifle': {
            _hit();
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
              pxMesh.position.copy(localVector2);
              pxMesh.velocity = new THREE.Vector3(0, 0, -10)
                .applyQuaternion(localQuaternion2);
              pxMesh.angularVelocity = new THREE.Vector3((-1 + Math.random() * 2) * Math.PI * 2 * 0.01, (-1 + Math.random() * 2) * Math.PI * 2 * 0.01, (-1 + Math.random() * 2) * Math.PI * 2 * 0.01);
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
          case 'pickaxe': {
            _hit();
            break;
          }
          case 'shovel': {
            _unhit();
            break;
          }
          case 'light': {
            _light();
            break;
          }
          case 'build': {
            if (anchorSpecs[0]) {
              _triggerAnchor(buildsMesh);
            } else {
              const buildMesh = (() => {
                const buildMatIndex = ['wood', 'stone', 'metal'].indexOf(buildMat);
                switch (buildMode) {
                  case 'wall': return buildMeshes.walls[buildMatIndex];
                  case 'floor': return buildMeshes.platforms[buildMatIndex];
                  case 'stair': return buildMeshes.ramps[buildMatIndex];
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
                geometryWorker.requestAddObject(tracker, geometrySet, buildMesh.vegetationType, buildMesh.position, buildMesh.quaternion);
              }
            }
            break;
          }
          case 'things': {
            _triggerAnchor(thingsMesh);
            break;
          }
          case 'shapes': {
            _triggerAnchor(shapesMesh);
            break;
          }
          case 'inventory': {
            _triggerAnchor(inventoryMesh);
            break;
          }
          case 'colors': {
            _triggerAnchor(colorsMesh);
            break;
          }
          case 'select': {
            _triggerAnchor();
            if (!anchorSpecs[0] && raycastChunkSpec) {
              if (raycastChunkSpec.objectId !== 0) {
                _openDetailsMesh(raycastChunkSpec.point, raycastChunkSpec.mesh);
              }
            }
            break;
          }
        }
      }
      if (currentWeaponValue >= 0.01) {
        switch (selectedWeapon) {
          case 'pencil': {
            let value;
            if (currentSession) {
              localVector2.copy(rightGamepad.position);
              localQuaternion2.copy(rightGamepad.quaternion);
              value = currentWeaponValue * 0.1;
            } else {
              localVector2.copy(pencilMesh.position)
                .add(localVector3.set(0, 0, -0.5).applyQuaternion(pencilMesh.quaternion));
              value = 0.1;
            }
            localMatrix2.compose(localVector2, localQuaternion2, localVector3.set(1, 1, 1))
              .premultiply(localMatrix3.getInverse(meshDrawer.mesh.parent.matrixWorld))
              .decompose(localVector2, localQuaternion2, localVector3);

            if (lastWeaponValue < 0.01) {
              meshDrawer.start(localVector2, localQuaternion2, value);
            }
            meshDrawer.update(localVector2, localQuaternion2, value);
            break;
          }
        }
      }
      if (currentWeaponDown) {
        switch (selectedWeapon) {
          case 'paintbrush': {
            console.log('click paintbrush 1');

            if (raycastChunkSpec && raycastChunkSpec.objectId !== 0) {
              const index = meshDrawer.thingSources.findIndex(thingSource => thingSource.objectId === raycastChunkSpec.objectId);
              if (index !== -1) {
                const thingSource = meshDrawer.thingSources[index];
                const thingMesh = meshDrawer.thingMeshes[index];

                const {point, faceIndex} = raycastChunkSpec;
                const {geometryData: {positions, uvs, indices}} = thingSource;
                const ai = indices[faceIndex * 3];
                const bi = indices[faceIndex * 3 + 1];
                const ci = indices[faceIndex * 3 + 2];
                const tri = new THREE.Triangle(
                  new THREE.Vector3().fromArray(positions, ai * 3).applyMatrix4(thingSource.matrixWorld),
                  new THREE.Vector3().fromArray(positions, bi * 3).applyMatrix4(thingSource.matrixWorld),
                  new THREE.Vector3().fromArray(positions, ci * 3).applyMatrix4(thingSource.matrixWorld),
                );
                const uva = new THREE.Vector2().fromArray(uvs, ai * 3);
                const uvb = new THREE.Vector2().fromArray(uvs, bi * 3);
                const uvc = new THREE.Vector2().fromArray(uvs, ci * 3);
                const uv = THREE.Triangle.getUV(point, tri.a, tri.b, tri.c, uva, uvb, uvc, new THREE.Vector2());
                // console.log('painting', currentChunkMesh, raycastChunkSpec, thingSource, tri, point.toArray(), uv.toArray());
                const f = 10;
                const canvas = thingMesh.material.uniforms.tex.value.image;
                canvas.ctx.fillStyle = '#000';
                canvas.ctx.fillRect(uv.x * canvas.width - f / 2, (1 - uv.y) * canvas.height - f / 2, f, f);
                thingMesh.material.uniforms.tex.value.needsUpdate = true;
              }
            }
            break;
          }
          case 'physics': {
            console.log('click physics 1');
            break;
          }
        }
      }
      if (lastWeaponValue >= 0.01 && currentWeaponValue < 0.01) {
        switch (selectedWeapon) {
          case 'pencil': {
            let value;
            if (currentSession) {
              localVector2.copy(rightGamepad.position);
              localQuaternion2.copy(rightGamepad.quaternion);
              value = currentWeaponValue * 0.1;
            } else {
              localVector2.copy(pencilMesh.position)
                .add(localVector3.set(0, 0, -0.5).applyQuaternion(pencilMesh.quaternion));
              value = 0.1;
            }
            localMatrix2.compose(localVector2, localQuaternion2, localVector3.set(1, 1, 1))
              .premultiply(localMatrix3.getInverse(meshDrawer.mesh.parent.matrixWorld))
              .decompose(localVector2, localQuaternion2, localVector3);

            meshDrawer.end(localVector2, localQuaternion2, value);
            break;
          }
        }
      }
      if (lastWeaponDown && !currentWeaponDown) {
        switch (selectedWeapon) {
          case 'paintbrush': {
            console.log('click paintbrush 2');
            break;
          }
          case 'physics': {
            console.log('click physics 2');
            break;
          }
        }
      }
    };
    _handleDown();

    const _handleGrab = () => {
      for (let i = 0; i < 2; i++) {
        if (currentWeaponGrabs[i] && !lastWeaponGrabs[i]) {
          meshComposer.grab(i);
        }
        if (!currentWeaponGrabs[i] && lastWeaponGrabs[i]) {
          meshComposer.ungrab(i);
        }
      }
    };
    _handleGrab();

    // select
    const _handleSelect = () => {
      for (const material of currentChunkMesh.material) {
        material.uniforms.uSelectRange.value.set(NaN, NaN, NaN, NaN);
        material.uniforms.uSelectRange.needsUpdate = true;
      }
      currentVegetationMesh.material[0].uniforms.uSelectId.value = -1;
      currentVegetationMesh.material[0].uniforms.uSelectId.needsUpdate = true;
      currentThingMesh.material[0].uniforms.uSelectId.value = -1;
      currentThingMesh.material[0].uniforms.uSelectId.needsUpdate = true;
      /* for (const drawThingMesh of meshDrawer.thingMeshes) {
        drawThingMesh.material.uniforms.uSelectColor.value.setHex(0xFFFFFF);
        drawThingMesh.material.uniforms.uSelectColor.needsUpdate = true;
      } */
      switch (selectedWeapon) {
        case 'select': {
          if (raycastChunkSpec) {
            if (raycastChunkSpec.objectId === 0) {
              for (const material of currentChunkMesh.material) {
                const minX = Math.floor(raycastChunkSpec.point.x / SUBPARCEL_SIZE);
                const minY = Math.floor(raycastChunkSpec.point.z / SUBPARCEL_SIZE);
                const maxX = minX + 1;
                const maxY = minY + 1;
                material.uniforms.uSelectRange.value.set(minX, minY, maxX, maxY).multiplyScalar(SUBPARCEL_SIZE);
                material.uniforms.uSelectRange.needsUpdate = true;
              }
            } else {
              currentVegetationMesh.material[0].uniforms.uSelectId.value = raycastChunkSpec.objectId;
              currentVegetationMesh.material[0].uniforms.uSelectId.needsUpdate = true;
              currentThingMesh.material[0].uniforms.uSelectId.value = raycastChunkSpec.objectId;
              currentThingMesh.material[0].uniforms.uSelectId.needsUpdate = true;

              /* const index = meshDrawer.thingSources.findIndex(thingSource => thingSource.objectId === raycastChunkSpec.objectId);
              if (index !== -1) {
                const drawThingMesh = meshDrawer.thingMeshes[index];
                drawThingMesh.material.uniforms.uSelectColor.value.setHex(0x29b6f6);
                drawThingMesh.material.uniforms.uSelectColor.needsUpdate = true;
              } */
            }
          }
          break;
        }
      }
    };
    _handleSelect();
    
    const _handleMenu = () => {
      for (const menuMesh of menuMeshes) {
        menuMesh.visible = false;
      }

      const selectedMenuMesh = (() => {
        switch (selectedWeapon) {
          case 'build': return buildsMesh;
          case 'things': return thingsMesh;
          case 'shapes': return shapesMesh;
          case 'inventory': return inventoryMesh;
          case 'colors': return colorsMesh;
          default: return null;
        }
      })();

      if (currentSession) {
        if (selectedMenuMesh) {
          selectedMenuMesh.position.copy(leftGamepad.position)
            .add(localVector.set(0.1, 0.1, 0).applyQuaternion(leftGamepad.quaternion));
          selectedMenuMesh.quaternion.copy(leftGamepad.quaternion);
          selectedMenuMesh.scale.setScalar(1, 1, 1);
          selectedMenuMesh.visible = true;
        }
      } else {
        if (selectedMenuMesh && menuExpanded) {
          if (!lastMenuExpanded || selectedWeapon !== lastSelectedWeapon) {
            localMatrix.copy(rigManager.localRigMatrixEnabled ? rigManager.localRigMatrix : camera.matrixWorld)
              .multiply(localMatrix2.makeTranslation(0, 0, -3))
              .decompose(selectedMenuMesh.position, selectedMenuMesh.quaternion, selectedMenuMesh.scale);
            selectedMenuMesh.scale.setScalar(20);
          }
          selectedMenuMesh.visible = true;
        }
      }
    };
    _handleMenu();

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

    const _handleTeleport = () => {
      const _teleportTo = (position, quaternion) => {
        // console.log(position, quaternion, pose, avatar)
        /* localMatrix.fromArray(rigManager.localRig.model.matrix)
          .decompose(localVector2, localQuaternion2, localVector3); */

        if (currentSession) {
          localMatrix.copy(xrCamera.matrix)
            .premultiply(dolly.matrix)
            .decompose(localVector2, localQuaternion2, localVector3);
          dolly.matrix
            .premultiply(localMatrix.makeTranslation(position.x - localVector2.x, position.y - localVector2.y, position.z - localVector2.z))
            // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
            // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
            .premultiply(localMatrix.makeTranslation(0, _getFullAvatarHeight(), 0))
            .decompose(dolly.position, dolly.quaternion, dolly.scale);
        } else {
          camera.matrix
            .premultiply(localMatrix.makeTranslation(position.x - camera.position.x, position.y - camera.position.y, position.z - camera.position.z))
            // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
            // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
            .premultiply(localMatrix.makeTranslation(0, _getFullAvatarHeight(), 0))
            .decompose(camera.position, camera.quaternion, camera.scale);
        }

        velocity.set(0, 0, 0);
      };

      /* if (currentTeleport && raycastChunkSpec) {
        if (raycastChunkSpec.point) {
          teleportMeshes[1].position.copy(raycastChunkSpec.point);
          teleportMeshes[1].quaternion.setFromUnitVectors(localVector.set(0, 1, 0), raycastChunkSpec.normal);
          teleportMeshes[1].visible = true;
          teleportMeshes[1].lineMesh.visible = false;
        }
      } else if (lastTeleport && !currentTeleport && raycastChunkSpec) {
        teleportMeshes[1].visible = false;
        _teleportTo(teleportMeshes[1].position, teleportMeshes[1].quaternion);
      } else { */
        teleportMeshes[1].update(rigManager.localRig.inputs.leftGamepad.position, rigManager.localRig.inputs.leftGamepad.quaternion, currentTeleport, (p, q) => geometryWorker.raycast(tracker, p, q), (position, quaternion) => {
          _teleportTo(position, localQuaternion.set(0, 0, 0, 1));
        });
      // }
    };
    _handleTeleport();
  };
  if (currentChunkMesh) {
    _updateTools();
  }

  const _updateHands = () => {
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
  _updateHands();

  /* if (planetAnimation) {
    const {startTime, endTime} = planetAnimation;
    const now = Date.now();
    const factor = Math.min((now - startTime) / (endTime - startTime), 1);
    _tickPlanetAnimation(factor);
  } */

  /* if (session) {
    wristMenu.update(frame, session, renderer.xr.getReferenceSpace());
  } */

  if (geometryWorker) {
    pxMeshes = pxMeshes.filter(pxMesh => {
      if (pxMesh.update()) {
        if (!pxMesh.velocity.equals(zeroVector)) {
          localMatrix.copy(pxMesh.matrixWorld)
            .decompose(localVector, localQuaternion, localVector2);
          const collision = geometryWorker.collide(tracker, 0.2, 0, localVector, localQuaternion2.set(0, 0, 0, 1), 1);

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
  lastSelector = currentSelector;
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
renderer.setAnimationLoop(animate);
// renderer.xr.setSession(proxySession);

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
  /* if (document.pointerLockElement || ['physics', 'pencil'].includes(selectedWeapon)) {
    // pe.grabtriggerup('right');
  } */
  currentWeaponDown = false;
  currentWeaponValue = 0;
  currentTeleport = false;
});

/* document.getElementById('reset-scene-button').addEventListener('click', e => {
  pe.reset();
});
document.getElementById('export-scene-button').addEventListener('click', async e => {
  const uint8Array = await pe.exportScene();
  const b = new Blob([uint8Array], {
    type: 'application/webbundle',
  });
  downloadFile(b, 'scene.wbn');
}); */
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

inventory.addEventListener('filesupdate', e => {
  const files = e.data;
  inventoryMesh.inventoryItemsMesh.update(files);
});

const raycaster = new THREE.Raycaster();
let anchorSpecs = [null, null];
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
  // setCamera(camera);
};
renderer.domElement.addEventListener('mousemove', e => {
  if (selectedTool === 'firstperson' || selectedTool === 'thirdperson' || selectedTool === 'isometric' || selectedTool === 'birdseye') {
    _updateMouseMovement(e);
  } /* else if (selectedTool === 'camera' && selectedWeapon === 'select') {
    _updateRaycasterFromMouseEvent(raycaster, e);
  } */
});
renderer.domElement.addEventListener('wheel', e => {
  if (document.pointerLockElement) {
    if (anchorSpecs[0] && [thingsMesh, inventoryMesh].includes(anchorSpecs[0].object)) {
      anchorSpecs[0].object.scrollY(e.deltaY);
    }
    // console.log('got event', e.deltaX, e.deltaY, anchorSpec);
  }
});

/* renderer.domElement.addEventListener('mousedown', e => {
  uiMesh.click();
}); */

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
