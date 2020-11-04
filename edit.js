/* global Web3 */
/* eslint no-unused-vars: 0 */
import * as THREE from './three.module.js';
// import {BufferGeometryUtils} from './BufferGeometryUtils.js';
// import {GLTFLoader} from './GLTFLoader.js';
// import {GLTFExporter} from './GLTFExporter.js';
// import {TransformControls} from './TransformControls.js';
import {tryLogin, loginManager} from './login.js';
import runtime from './runtime.js';
import {parseQuery, downloadFile} from './util.js';
import {rigManager} from './rig.js';
// import {makeRayMesh} from './vr-ui.js';
import {
  THING_SHADER,
  makeDrawMaterial,
} from './shaders.js';
// import {lineMeshes, teleportMeshes} from './teleport.js';
import geometryManager from './geometry-manager.js';
import uiManager from './ui-manager.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {
  SUBPARCEL_SIZE,
} from './constants.js';
import {makePromise} from './util.js';
import {planet} from './planet.js';
// import {Bot} from './bot.js';
import {Sky} from './Sky.js';
import {GuardianMesh} from './land.js';
import {storageHost} from './constants.js';
import {renderer, scene, camera, dolly, orbitControls, appManager} from './app-object.js';
import weaponsManager from './weapons-manager.js';
import cameraManager from './camera-manager.js';
import inventory from './inventory.js';
import {App} from './components/App.js';
import {tryTutorial} from './tutorial.js';
import {getState, setState} from './state.js';

// const zeroVector = new THREE.Vector3(0, 0, 0);
// const pid4 = Math.PI / 4;
const leftHandOffset = new THREE.Vector3(0.2, -0.2, -0.4);
const rightHandOffset = new THREE.Vector3(-0.2, -0.2, -0.4);
// const redColorHex = new THREE.Color(0xef5350).multiplyScalar(2).getHex();

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localTriangle = new THREE.Triangle();

let skybox = null;

function mod(a, b) {
  return ((a % b) + b) % b;
}

(async () => {
  const q = parseQuery(location.search);
  if (q.u) {
    await planet.connect({
      online: true,
      roomName: 'lol',
      url: q.u,
    });
  } else {
    await planet.connect({
      online: false,
      roomName: 'lol',
    });
  }
  // new Bot();
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
/* const _makeFloorMesh = () => {
  const geometry = parcelGeometry;
  const material = new THREE.MeshBasicMaterial({
    color: 0x333333,
    // opacity: 0.9,
    side: THREE.DoubleSide,
    // transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -0.01;
  mesh.frustumCulled = false;
  return mesh;
};
const floorMesh = _makeFloorMesh();
floorMesh.position.y = 0;
scene.add(floorMesh); */

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

(async () => {
  await geometryManager.waitForLoad();

  /* rigManager.addPeerRig(-1);
  rigManager.setPeerAvatarUrl('./npc.vrm', -1);
  rigManager.setPeerAvatarName('Lollercopter', -1);
  // rigManager.setPeerAvatarUrl('./model.glb', -1);
  setInterval(() => {
    rigManager.setPeerAvatarPose([
      [[0, 1, 0], [0, 0, 0, 1]],
      [[0, 0, 0], [0, 0, 0, 1], 0, 0],
      [[0, 0, 0], [0, 0, 0, 1], 0, 0],
      0
    ], -1);
  }, 100); */
  
  {
    const u = 'assets/firest33.glb';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    // console.log('loading file');
    let mesh = await runtime.loadFile(file, {
      optimize: false,
    });
    mesh.updateMatrixWorld();
    mesh = mesh.children[0];
    mesh.frustumCulled = false;
    {
      const {geometry} = mesh;
      const matrix = mesh.matrixWorld.clone().premultiply(new THREE.Matrix4().makeScale(0.5, 0.5, 0.5));
      const positions = new Float32Array(geometry.attributes.position.count * 3);
      for (let i = 0, j = 0; i < positions.length; i += 3, j += geometry.attributes.position.data.stride) {
        localVector
          .fromArray(geometry.attributes.position.data.array, j)
          .applyMatrix4(matrix)
          .toArray(positions, i);
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    }
    mesh.position.set(0, 0, 0);
    mesh.quaternion.set(0, 0, 0, 1);
    mesh.scale.set(1, 1, 1);
    // mesh.geometry.applyMatrix4(new THREE.Matrix4().makeScale(0.5, 0.5, 0.5));
    console.log('loaded file', mesh);
    scene.add(mesh);

    geometryManager.geometryWorker.addGeometryPhysics(geometryManager.physics, mesh);
  }
  
  {
    const mesh = await runtime.loadFile({
      name: 'index.js',
      url: 'https://avaer.github.io/mirror/index.js',
    });
    mesh.run();
    scene.add(mesh);
  }
  
  {
    const u = 'assets/parkour.glb';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    let mesh = await runtime.loadFile(file, {
      optimize: false,
    });
    mesh.traverse(o => {
      if (o.isLight) {
        o.visible = false;
      }
    });
    console.log('loading file parkour', mesh);
    {
      const geometries = [];
      const parcelSize = 100;
      const _getGeometry = p => {
        let g = geometries.find(g => g.boundingBox.containsPoint(p));
        if (!g) {
          g = new THREE.BufferGeometry();
          const positions = new Float32Array(1024 * 1024 * 3);
          g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          const normals = new Float32Array(1024 * 1024 * 3);
          g.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
          const minX = Math.min(p.x/parcelSize)*parcelSize;
          const minZ = Math.min(p.z/parcelSize)*parcelSize;
          g.boundingBox = new THREE.Box3(
            new THREE.Vector3(minX, -Infinity, minX + parcelSize),
            new THREE.Vector3(minZ, -Infinity, minZ + parcelSize),
          );
          let positionIndex = 0;
          g.addPoint = (positionsArray, normalsArray, sourceIndex) => {
            positions.set(positionsArray.toArray(sourceIndex, sourceIndex+9), positionIndex);
            normals.set(normalsArray.toArray(sourceIndex, sourceIndex+9), positionIndex);
            positionIndex += 9;
          };
          geometries.push(g);
        }
        return g;
      };
      const {geometry} = mesh;
      for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
        const center = localTriangle.set(
          localVector.fromArray(geometry.attributes.position.array, i),
          localVector2.fromArray(geometry.attributes.position.array, i+3),
          localVector3.fromArray(geometry.attributes.position.array, i+6),
        ).getCenter(localVector);
        const g = _getGeometry(center);
        g.addPoint(geometry.attributes.position.array, geometry.attributes.normal.array, i);
      }
    }
    scene.add(mesh);
  }
  
  {
    const u = 'assets/sword2.glb';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    let mesh = await runtime.loadFile(file, {
      optimize: false,
    });
    mesh.traverse(o => {
      if (o.isLight) {
        o.visible = false;
      }
    });
    console.log('loading file sword', mesh);
    scene.add(mesh);

    const smg = mesh.getObjectByName('smg');
    window.addEventListener('keydown', e => {
      // console.log('got key', sword, e.keydown);
      if (e.which === 70) {
        appManager.grab('right', smg);
      }
    });
    const shotGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01);
    const shotMaterial = new THREE.MeshBasicMaterial({color: 0xFF0000});
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
    window.addEventListener('mousedown', e => {
      const shotMesh = new THREE.Mesh(shotGeometry, shotMaterial);
      shotMesh.position.copy(smg.position);
      shotMesh.quaternion.copy(smg.quaternion);
      shotMesh.frustumCulled = false;
      const startTime = Date.now();
      const endTime = startTime + 5000;
      const velocity = new THREE.Vector3(0, 0, -10);
      
      const _explode = () => {
        scene.remove(shotMesh);

        const explosionMesh = _makeExplosionMesh();
        explosionMesh.position.copy(shotMesh.position);
        explosionMesh.quaternion.copy(shotMesh.quaternion);
        scene.add(explosionMesh);
        explosionMeshes.push(explosionMesh);
      };
      shotMesh.update = (now, timeDiff) => {
        
        if (now < endTime) {
          localVector.copy(velocity)
            .applyQuaternion(shotMesh.quaternion)
            .multiplyScalar(timeDiff);
          
          const result = geometryManager.geometryWorker.raycastPhysics(geometryManager.physics, shotMesh.position, shotMesh.quaternion);
          if (result) { // world geometry raycast
            result.point = new THREE.Vector3().fromArray(result.point);
            if (result.point.distanceTo(shotMesh.position) < localVector.length()) {
              _explode();
              return false;
            }
            /* raycastChunkSpec.normal = new THREE.Vector3().fromArray(raycastChunkSpec.normal);
            raycastChunkSpec.objectPosition = new THREE.Vector3().fromArray(raycastChunkSpec.objectPosition);
            raycastChunkSpec.objectQuaternion = new THREE.Quaternion().fromArray(raycastChunkSpec.objectQuaternion);
            cubeMesh.position.copy(raycastChunkSpec.point); */
          }
          
          shotMesh.position.add(localVector);
          return true;
        } else {
          _explode();
          return false;
        }
      };
      scene.add(shotMesh);
      shots.push(shotMesh);
    });
  }
  
  {
    const u = 'assets/space.glb';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    let mesh = await runtime.loadFile(file, {
      optimize: false,
    });
    mesh = mesh.children[0].children[0].children[0].children.find(c => c.name === 'laser_orange_04').children[0];
    mesh.position.y = 1;
    mesh.material = new THREE.MeshBasicMaterial({map: mesh.material.emissiveMap});
    const s = 0.1;
    mesh.scale.set(s, s, s);
    console.log('loading file space', mesh);
    scene.add(mesh);
  }

  /* {
    const u = 'lightsaber.wbn';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    // console.log('loading file');
    const mesh = await runtime.loadFile(file);
    mesh.run();
    console.log('loaded file', mesh);
    scene.add(mesh);
  } */
  /* {
    const u = 'comet.wbn';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    // console.log('loading file');
    const mesh = await runtime.loadFile(file);
    scene.run();
    // console.log('loaded file', mesh);
    scene.add(mesh);
  } */
  /* {
    const u = 'shield.wbn';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    // console.log('loading file');
    const mesh = await runtime.loadFile(file);
    mesh.run();
    // console.log('loaded file', mesh);
    scene.add(mesh);
  } */
  /* {
    const u = 'female.glb';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    // console.log('loading file');
    const mesh = await runtime.loadFile(file);
    console.log('loaded file', mesh);
    scene.add(mesh);
  } */
  /* {
    // portal
    const file = new Blob(['https://google.com'], {type: 'text/plain'});
    const u = URL.createObjectURL(file) + '/file.url';
    planet.addObject(u, new THREE.Vector3(0, 1.5, 0), new THREE.Quaternion());
  } */
})();

/* const redBuildMeshMaterial = new THREE.ShaderMaterial({
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
}); */

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

const timeFactor = 60 * 1000;
let lastTimestamp = performance.now();
const startTime = Date.now();
let shots = [];
let explosionMeshes = [];
function animate(timestamp, frame) {
  timestamp = timestamp || performance.now();
  const timeDiff = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  const now = Date.now();
  skybox.position.copy(rigManager.localRig.inputs.hmd.position);
  skybox.update();

  ioManager.update(timeDiff, frame);
  physicsManager.update(timeDiff, frame);
  uiManager.update(timeDiff, frame);

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

    const session = renderer.xr.getSession();
    if (session) {
      let inputSources = Array.from(session.inputSources);
      inputSources = ['right', 'left']
        .map(handedness => inputSources.find(inputSource => inputSource.handedness === handedness));
      let pose;
      if (inputSources[0] && (pose = frame.getPose(inputSources[0].gripSpace, renderer.xr.getReferenceSpace()))) {
        localMatrix.fromArray(pose.transform.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        if (!inputSources[0].profiles.includes('oculus-hand')) {
          localQuaternion2.multiply(localQuaternion3.setFromAxisAngle(localVector3.set(1, 0, 0), -Math.PI*0.5));
        } else {
          localQuaternion2.multiply(localQuaternion3.setFromAxisAngle(localVector3.set(0, 0, 1), Math.PI*0.5)).multiply(localQuaternion3.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.2));
        }
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
      if (inputSources[1] && (pose = frame.getPose(inputSources[1].gripSpace, renderer.xr.getReferenceSpace()))) {
        localMatrix.fromArray(pose.transform.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        if (!inputSources[1].profiles.includes('oculus-hand')) {
          localQuaternion2.multiply(localQuaternion3.setFromAxisAngle(localVector3.set(1, 0, 0), -Math.PI*0.5));
        } else {
          localQuaternion2.multiply(localQuaternion3.setFromAxisAngle(localVector3.set(0, 0, 1), -Math.PI*0.5)).multiply(localQuaternion3.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.2));
        }
        rightGamepadPosition = localVector2.toArray();
        rightGamepadQuaternion = localQuaternion2.toArray();

        const {gamepad} = inputSources[1];
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

  // const {leftGamepad: rightGamepad, rightGamepad: leftGamepad} = rigManager.localRig.inputs;

  orbitControls.enabled = cameraManager.getTool() === 'camera';

  weaponsManager.update(timeDiff, frame);

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

  const geometryEnabled = false;
  if (geometryEnabled) {
    geometryManager.update(timeDiff, frame);
  }
  planet.update();

  shots = shots.filter(shot => shot.update(now, timeDiff));
  explosionMeshes = explosionMeshes.filter(explosionMesh => {
    explosionMesh.material.uniforms.uAnimation.value += timeDiff;
    if (explosionMesh.material.uniforms.uAnimation.value < 1) {
      return true;
    } else {
      scene.remove(explosionMesh);
      return false;
    }
  });

  appManager.tick(timestamp, frame);
  
  ioManager.updatePost(timeDiff);

  const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
  localMatrix.multiplyMatrices(xrCamera.projectionMatrix, localMatrix2.multiplyMatrices(xrCamera.matrixWorldInverse, geometryManager.worldContainer.matrixWorld));
  localMatrix3.copy(xrCamera.matrix)
    .premultiply(dolly.matrix)
    .premultiply(localMatrix2.getInverse(geometryManager.worldContainer.matrixWorld))
    .decompose(localVector, localQuaternion, localVector2);

  if (geometryEnabled) {
    const [landGroups, vegetationGroups, thingGroups] = geometryManager.geometryWorker.tickCull(geometryManager.tracker, localVector, localMatrix);
    geometryManager.currentChunkMesh.geometry.groups = landGroups;
    geometryManager.currentVegetationMesh.geometry.groups = vegetationGroups;
    geometryManager.currentThingMesh.geometry.groups = thingGroups;
  }

  renderer.render(scene, camera);
  // renderer.render(highlightScene, camera);
}
geometryManager.waitForLoad().then(e => {
  setTimeout(() => {
    renderer.setAnimationLoop(animate);
  });
});

/* const loadVsh = `
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
}; */

const _initializeLogin = async () => {
  await tryLogin();
  await tryTutorial();

  const _initializeUserUi = async () => {
    await geometryManager.waitForLoad();

    /* const _listenBlockchainEvents = async () => {
      const address = '0x' + loginManager.getAddress();

      const loadPromise = makePromise();
      loginManager.getBalance()
        .then(balance => {
          const {menu} = getState();
          menu.inventory.balance = balance;
          setState({menu});

          loadPromise.accept();
        });

      const s = new WebSocket('wss://events.exokit.org/');
      s.onopen = () => {
        s.onmessage = async e => {
          const s = e.data;
          const tx = JSON.parse(s);
          await loadPromise;
          if (tx.from && tx.to && tx.amount) {
            const message = uiManager.popupMesh.addMessage(`${tx.from} sent ${tx.to} ${tx.amount}`);
            setTimeout(() => {
              uiManager.popupMesh.removeMessage(message);
            }, 5000);
          }
          if (tx.from === address) {
            const {menu} = getState();
            menu.inventory.balance -= tx.amount;
            setState({menu});
          }
          if (tx.to === address) {
            const {menu} = getState();
            menu.inventory.balance += tx.amount;
            setState({menu});
          }
        };
      };
      s.onerror = err => {
        console.warn('events websocket error', err);
      };
      s.onclose = () => {
        console.warn('events websocket closed');
      };
    };
    _listenBlockchainEvents(); */
  };
  _initializeUserUi();
  const _initializeRigUi = () => {
    const username = loginManager.getUsername() || 'Anonymous';
    rigManager.setLocalAvatarName(username);

    loginManager.addEventListener('usernamechange', e => {
      const username = e.data || 'Anonymous';
      if (username !== rigManager.localRig.textMesh.text) {
        rigManager.setLocalAvatarName(username);

        const {menu} = getState();
        menu.username = username;
        setState({
          menu,
        });
      }
    });

    const avatar = loginManager.getAvatar();
    if (avatar.url) {
      rigManager.setLocalAvatarUrl(avatar.url, avatar.filename);
    }
    loginManager.addEventListener('avatarchange', e => {
      const avatar = e.data;
      const newAvatarUrl = avatar ? avatar.url : null;
      if (newAvatarUrl !== rigManager.localRig.avatarUrl) {
        rigManager.setLocalAvatarUrl(newAvatarUrl, avatar.filename);

        const {menu} = getState();
        menu.avatarUrl = avatar.url;
        menu.avatarFileName = avatar.filename;
        menu.avatarPreview = avatar.preview;
        setState({
          menu,
        });
      }
    });

    const {menu} = getState();
    menu.username = username;
    menu.avatarUrl = avatar.url;
    menu.avatarFileName = avatar.filename;
    menu.avatarPreview = avatar.preview;
    setState({
      menu,
    });
  };
  _initializeRigUi();
};
_initializeLogin();

const _initializeXr = () => {
  let currentSession = null;
  function onSessionStarted(session) {
    session.addEventListener('end', onSessionEnded);
    renderer.xr.setSession(session);
    // renderer.xr.setReferenceSpaceType('local-floor');
    currentSession = session;
    setState({ isXR: true })
  }
  function onSessionEnded() {
    currentSession.removeEventListener('end', onSessionEnded);
    renderer.xr.setSession(null);
    currentSession = null;
    setState({ isXR: false })
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
};
_initializeXr();