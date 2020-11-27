/* global Web3 */
/* eslint no-unused-vars: 0 */
import * as THREE from './three.module.js';
// import {GLTFLoader} from './GLTFLoader.js';
// import {GLTFExporter} from './GLTFExporter.js';
// import {TransformControls} from './TransformControls.js';
import {tryLogin, loginManager} from './login.js';
import runtime from './runtime.js';
import {parseQuery, downloadFile} from './util.js';
import {rigManager} from './rig.js';
import {makeRayMesh, makeTextMesh, makeHighlightMesh, makeButtonMesh, makeArrowMesh, makeCornersMesh} from './vr-ui.js';
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
import {world} from './world.js';
// import {Bot} from './bot.js';
import {Sky} from './Sky.js';
import {GuardianMesh} from './land.js';
import {storageHost} from './constants.js';
import {renderer, scene, camera, dolly, orbitControls, renderer2, scene2, scene3, appManager} from './app-object.js';
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
const leftHandGlideOffset = new THREE.Vector3(0.6, -0.2, -0.01);
const rightHandGlideOffset = new THREE.Vector3(-0.6, -0.2, -0.01);
const leftHandGlideQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
const rightHandGlideQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0));
// const redColorHex = new THREE.Color(0xef5350).multiplyScalar(2).getHex();

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localRay = new THREE.Ray();
const localTriangle = new THREE.Triangle();

let skybox = null;

function mod(a, b) {
  return ((a % b) + b) % b;
}

(async () => {
  const q = parseQuery(location.search);
  if (q.m) { // multiplayer
    await world.connect({
      online: true,
      roomName: 'lol',
      url: q.um,
    });
  } else {
    await world.connect({
      online: false,
      roomName: 'lol',
    });
  }
  if (q.o) { // object
    world.addObject(q.o);
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
import Simplex from './simplex-noise.js';
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
    return result;
  }
}
const highlightMesh = makeHighlightMesh();
highlightMesh.visible = false;
scene.add(highlightMesh);
const anchorMeshes = [];
const rayMesh = makeRayMesh();
scene.add(rayMesh);
(async () => {
  await geometryManager.waitForLoad();

  runtime.injectDependencies(geometryManager, physicsManager, world);

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

  // const floorPhysicsId = physicsManager.addBoxGeometry(new THREE.Vector3(0, -1, 0), new THREE.Quaternion(), new THREE.Vector3(100, 1, 100), false);

  {
    const simplex = new MultiSimplex('lol', 6);
    
    let geometry = new THREE.PlaneBufferGeometry(32, 32, 32, 32);
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0))));
    for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
      let x = geometry.attributes.position.array[i];
      let z = geometry.attributes.position.array[i+2];
      x /= 100;
      z /= 100;
      const y = simplex.noise2D(x, z) * 0.5;
      geometry.attributes.position.array[i+1] = y;
    }
    geometry = geometry.toNonIndexed();
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
    const material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `\
        #define PI 3.1415926535897932384626433832795

        attribute float y;
        attribute vec3 barycentric;
        varying float vUv;
        varying vec3 vBarycentric;
        varying vec3 vPosition;
        void main() {
          vUv = uv.x;
          vBarycentric = barycentric;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `\
        varying vec3 vBarycentric;
        varying vec3 vPosition;
      
        // const float lineWidth = 1.0;
        const vec3 lineColor1 = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
        const vec3 lineColor2 = vec3(${new THREE.Color(0xff7043).toArray().join(', ')});

        float gridFactor (vec3 bary, float width, float feather) {
          float w1 = width - feather * 0.5;
          // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
          vec3 d = fwidth(bary);
          vec3 a3 = smoothstep(d * w1, d * (w1 + feather), bary);
          return min(min(a3.x, a3.y), a3.z);
        }
        float gridFactor (vec3 bary, float width) {
          // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
          vec3 d = fwidth(bary);
          vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
          return min(min(a3.x, a3.y), a3.z);
        }

        void main() {
          vec3 c = mix(lineColor1, lineColor2, 2. + vPosition.y);
          gl_FragColor = vec4(c * (gridFactor(vBarycentric, 0.5) < 0.5 ? 0.9 : 1.0), 1.0);
        }
      `,
    });
    const gridMesh = new THREE.Mesh(geometry, material);
    scene.add(gridMesh);

    physicsManager.addGeometry(gridMesh);

    // const makeTextMesh = (text = '', font = './GeosansLight.ttf', fontSize = 1, anchorX = 'left', anchorY = 'middle') => {
    const textMesh = makeTextMesh(`Hootshot\nThis is the best hookshot you'll find.\n`, undefined, 0.2);
    textMesh.position.y = 2;
    scene.add(textMesh);

    const buttonMesh = makeButtonMesh('Lol');
    buttonMesh.position.y = 1;
    scene.add(buttonMesh);
    anchorMeshes.push(buttonMesh);

    const rightArrowMesh = makeArrowMesh();
    rightArrowMesh.position.x = 0.6;
    rightArrowMesh.position.y = 1;
    scene.add(rightArrowMesh);
    anchorMeshes.push(rightArrowMesh);
    const leftArrowMesh = makeArrowMesh();
    leftArrowMesh.position.x = -0.6;
    leftArrowMesh.position.y = 1;
    leftArrowMesh.rotation.z = Math.PI;
    scene.add(leftArrowMesh);
    anchorMeshes.push(leftArrowMesh);

    const cornersMesh = makeCornersMesh();
    cornersMesh.position.y = 1;
    scene.add(cornersMesh);
    anchorMeshes.push(cornersMesh);
  }

  {
    const mesh = await runtime.loadFile({
      name: 'home.scn',
      url: './home.scn',
    });
    mesh.run();
    scene.add(mesh);
  }

  /* {
    const u = 'assets/case.glb';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    let mesh = await runtime.loadFile(file, {
      optimize: false,
    });
    mesh.position.set(0, 0, 1);
    scene.add(mesh);
  }
  
  {
    const u = 'assets/crate.glb';
    const res = await fetch('./' + u);
    const file = await res.blob();
    file.name = u;
    let mesh = await runtime.loadFile(file, {
      optimize: false,
    });
    mesh.position.set(0, 0, 2);
    scene.add(mesh);
  } */
  
  /* {
    const mesh = await runtime.loadFile({
      name: 'index.js',
      url: 'https://avaer.github.io/mirror/index.js',
    });
    mesh.run();
    scene.add(mesh);
  } */

  /* {
    const mesh = await runtime.loadFile({
      name: 'parkour.scn',
      url: 'https://avaer.github.io/parkour/parkour.scn',
    }, {
      optimize: false,
    });
    const runSpec = { // XXX clean up this dependency
      geometryManager,
    };
    mesh.run(runSpec);
    scene.add(mesh);
  } */

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
    world.addObject(u, null, new THREE.Vector3(0, 1.5, 0), new THREE.Quaternion());
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

/* const tetrehedronGeometry = (() => {
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
})(); */

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

const itemMeshes = [];
const addItem = async (position, quaternion) => {
  const u = 'assets/mat.glb';
  const res = await fetch('./' + u);
  const file = await res.blob();
  file.name = u;
  let mesh = await runtime.loadFile(file, {
    optimize: false,
  });
  // mesh = mesh.children[0]//.children.find(c => c.name === 'laser_orange_04');
  // mesh.position.y = 1;
  for (let i = 0; i < mesh.children.length; i++) {
    const child = mesh.children[i];
    child.position.x = -3 + i;
    child.material = new THREE.MeshBasicMaterial({map: child.material.map});
  }
  const s = 0.1;
  mesh.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0)));
  mesh.scale.set(s, s, s);
  
  const itemMesh = (() => {
    const radius = 0.5;
    const segments = 12;
    const color = 0x66bb6a;
    const opacity = 0.5;

    const object = new THREE.Object3D();

    object.add(mesh);

    /* const matMeshes = [
      geometryManager.woodMesh,
      geometryManager.stoneMesh,
      geometryManager.metalMesh,
    ];
    const matIndex = Math.floor(Math.random() * matMeshes.length);
    const matMesh = matMeshes[matIndex];
    const matMeshClone = matMesh.clone();
    matMeshClone.position.y = 0.5;
    matMeshClone.visible = true;
    matMeshClone.isBuildMesh = true;
    object.add(matMeshClone); */

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
    /* object.pickUp = () => {
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
    }; */
    object.update = posePosition => {
      if (!animation) {
        const now = Date.now();
        mesh.position.y = 1 + Math.sin(now/1000*Math.PI)*0.1;
        mesh.rotation.z = (now % 5000) / 5000 * Math.PI * 2;
        skirtMaterial.uniforms.uAnimation.value = (now % 60000) / 60000;
      } else {
        animation.update(posePosition);
      }
    };

    return object;
  })();
  itemMesh.position.copy(position)//.applyMatrix4(geometryManager.currentVegetationMesh.matrixWorld);
  itemMesh.quaternion.copy(quaternion);
  scene.add(itemMesh);
  itemMeshes.push(itemMesh);
};

{ // XXX
  addItem(new THREE.Vector3(0, 1, 0), new THREE.Quaternion());
}
{
  const file = new Blob(['https://google.com'], {type: 'text/plain'});
  const u = URL.createObjectURL(file) + '/file.url';
  world.addObject(u, null, new THREE.Vector3(), new THREE.Quaternion());
}
{
  const file = new Blob(['http://lol.com'], {type: 'text/plain'});
  const u = URL.createObjectURL(file) + '/file.iframe';
  world.addObject(u, null, new THREE.Vector3(0, 1, -3), new THREE.Quaternion());
}

// const timeFactor = 60 * 1000;
let lastTimestamp = performance.now();
const startTime = Date.now();
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

  for (const itemMesh of itemMeshes) {
    itemMesh.update();
  }
  physicsManager.simulatePhysics(timeDiff);

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
      if (!physicsManager.getGlideState()) {
        leftGamepadPosition = localVector2.copy(localVector)
          .add(localVector3.copy(leftHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
          .toArray();
        leftGamepadQuaternion = localQuaternion.toArray();
      } else {
        leftGamepadPosition = localVector2.copy(localVector)
          .add(localVector3.copy(leftHandGlideOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
          .toArray();
        leftGamepadQuaternion = localQuaternion2.copy(localQuaternion)
          .premultiply(leftHandGlideQuaternion)
          .toArray();
      }
      leftGamepadPointer = 0;
      leftGamepadGrip = 0;
    }
    if (!rightGamepadPosition) {
      if (!physicsManager.getGlideState()) {
        rightGamepadPosition = localVector2.copy(localVector)
          .add(localVector3.copy(rightHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
          .toArray();
        rightGamepadQuaternion = localQuaternion.toArray();
      } else {
        rightGamepadPosition = localVector2.copy(localVector)
          .add(localVector3.copy(rightHandGlideOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
          .toArray();
        rightGamepadQuaternion = localQuaternion2.copy(localQuaternion)
          .premultiply(rightHandGlideQuaternion)
          .toArray();
      }
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
  
  const _updateAnchors = () => {
    const transforms = rigManager.getRigTransforms();
    const {position, quaternion} = transforms[0];
    rayMesh.position.copy(position);
    rayMesh.quaternion.copy(quaternion);
    rayMesh.scale.z = 10;
    
    highlightMesh.visible = false;
    for (const anchorMesh of anchorMeshes) {
      localMatrix.compose(position, quaternion, localVector2.set(1, 1, 1))
        .premultiply(localMatrix2.getInverse(anchorMesh.matrixWorld))
        .decompose(localVector, localQuaternion, localVector2);
      localVector3.set(0, 0, -1)
        .applyQuaternion(localQuaternion);
      localRay.set(localVector, localVector3);
      const intersection = localRay.intersectBox(anchorMesh.geometry.boundingBox, localVector4);
      if (intersection) {
        highlightMesh.position.copy(anchorMesh.position)
          .add(anchorMesh.geometry.boundingBox.getCenter(localVector4).applyQuaternion(anchorMesh.quaternion));
        highlightMesh.quaternion.copy(anchorMesh.quaternion);
        anchorMesh.geometry.boundingBox.getSize(highlightMesh.scale);
        highlightMesh.visible = true;
        break;
      }
    }
  };
  _updateAnchors();

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
  world.update();

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

  renderer.render(scene3, camera);
  renderer.render(scene, camera);
  renderer2.render(scene2, camera);
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
    setState({ isXR: false });
  }
  const sessionMode = 'immersive-vr';
  const sessionOpts = {
    requiredFeatures: [
      'local-floor',
      // 'bounded-floor',
    ],
    optionalFeatures: [
      'hand-tracking',
    ],
  };
  const enterXrButton = document.getElementById('enter-xr-button');
  const noXrButton = document.getElementById('no-xr-button');
  enterXrButton.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    if (currentSession === null) {
      navigator.xr.requestSession(sessionMode, sessionOpts).then(onSessionStarted);
    } else {
      currentSession.end();
    }
  });
  if (navigator.xr) {
    navigator.xr.isSessionSupported(sessionMode).then(ok => {
      if (ok) {
        enterXrButton.style.display = null;
        noXrButton.style.display = 'none';
      }
    }).catch(err => {
      console.warn(err);
    });
  }
};
_initializeXr();