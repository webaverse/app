/* global Web3 */
/* eslint no-unused-vars: 0 */
import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {BufferGeometryUtils} from 'https://static.xrpackage.org/BufferGeometryUtils.js';
import {GLTFLoader} from './GLTFLoader.js';
import {TransformControls} from './TransformControls.js';
// import address from 'https://contracts.webaverse.com/address.js';
// import abi from 'https://contracts.webaverse.com/abi.js';
import {XRPackage, pe, renderer, scene, camera, parcelMaterial, floorMesh, proxySession, getRealSession, loginManager} from './run.js';
import {downloadFile, readFile, bindUploadFileButton} from 'https://static.xrpackage.org/xrpackage/util.js';
// import {wireframeMaterial, getWireframeMesh, meshIdToArray, decorateRaycastMesh, VolumeRaycaster} from './volume.js';
import './gif.js';
// import {makeTextMesh, makeWristMenu, makeHighlightMesh, makeRayMesh} from './vr-ui.js';
import {makeTextMesh} from './vr-ui.js';
import {makeLineMesh, makeTeleportMesh} from './teleport.js';
import perlin from './perlin.js';
import alea from './alea.js';
const rng = alea('lol');
perlin.seed(rng());

const apiHost = 'https://ipfs.exokit.org/ipfs';
const presenceEndpoint = 'wss://presence.exokit.org';
const worldsEndpoint = 'https://worlds.exokit.org';
const packagesEndpoint = 'https://packages.exokit.org';
const parcelSize = 11;
const PARCEL_SIZE = 30;
const PARCEL_SIZE_D2 = PARCEL_SIZE/2;
const PARCEL_SIZE_P2 = PARCEL_SIZE+2;

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

const HEIGHTFIELD_SHADER = {
  uniforms: {
    /* fogColor: {
      type: '3f',
      value: new THREE.Color(),
    },
    fogDensity: {
      type: 'f',
      value: 0,
    },
    sunIntensity: {
      type: 'f',
      value: 0,
    }, */
    selectedIndex: {
      type: 'f',
      value: 0,
    },
    isCurrent: {
      type: 'f',
      value: 0,
    },
    uTime: {
      type: 'f',
      value: 0,
    },
    tex: {
      type: 't',
      value: new THREE.Texture(),
    },
    heightColorTex: {
      type: 't',
      value: null,
    },
  },
  vertexShader: `\
    #define LOG2 1.442695
    precision highp float;
    precision highp int;
    uniform float fogDensity;
    // attribute vec3 color;
    attribute vec3 barycentric;
    attribute float index;
    // attribute float skyLightmap;
    // attribute float torchLightmap;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vBarycentric;
    // varying vec3 vViewPosition;
    // varying vec3 vColor;
    varying float vIndex;
    // varying vec3 vNormal;
    // varying float vSkyLightmap;
    // varying float vTorchLightmap;
    // varying float vFog;

    void main() {
      // vColor = color;
      // vNormal = normal;

      vec4 mvPosition = modelViewMatrix * vec4(position.xyz, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vPosition = position.xyz;
      vWorldPosition = mvPosition.xyz;
      vBarycentric = barycentric;
      vIndex = index;
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;
    // uniform vec3 ambientLightColor;
    uniform float sunIntensity;
    uniform vec3 fogColor;
    // uniform vec3 cameraPosition;
    // uniform sampler2D tex;
    uniform sampler2D heightColorTex;
    uniform float selectedIndex;

    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vBarycentric;
    varying float vIndex;
    // varying vec3 vViewPosition;
    // varying vec3 vColor;
    // varying vec3 vNormal;
    // varying float vSkyLightmap;
    // varying float vTorchLightmap;
    // varying float vFog;

    uniform float isCurrent;
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
      vec3 ambientLightColor = vec3(0.5, 0.5, 0.5);
      vec3 xTangent = dFdx( vPosition );
      vec3 yTangent = dFdy( vPosition );
      vec3 faceNormal = normalize( cross( xTangent, yTangent ) );
      float lightColor = 0.5; // dot(faceNormal, lightDirection);

      vec2 uv = vec2(
        mod((vPosition.x) / 4.0, 1.0),
        mod((vPosition.z) / 4.0, 1.0)
      );

      float d = length(vPosition - vec3(${PARCEL_SIZE_D2}, ${PARCEL_SIZE_D2}, ${PARCEL_SIZE_D2}));
      float dMax = length(vec3(${PARCEL_SIZE_D2}, ${PARCEL_SIZE_D2}, ${PARCEL_SIZE_D2}));
      vec2 uv2 = vec2(d / dMax, 0.5);
      vec3 c = texture2D(heightColorTex, uv2).rgb;
      vec3 diffuseColor = c * uv2.x;
      if (edgeFactor() <= 0.99) {
        if (isCurrent != 0.0) {
          diffuseColor = mix(diffuseColor, vec3(1.0), max(1.0 - pow(length(vWorldPosition) - uTime*5.0, 3.0), 0.0)*0.5);
        }
        diffuseColor *= (0.9 + 0.1*min(gl_FragCoord.z/gl_FragCoord.w/10.0, 1.0));
      }

      // diffuseColor *= 0.02 + pow(min(max((vPosition.y - 55.0) / 64.0, 0.0), 1.0), 1.0) * 5.0;

      gl_FragColor = vec4(diffuseColor, 1.0);

      if (vIndex == selectedIndex) {
        gl_FragColor.b = 1.0;
      }
    }
  `
};

class Allocator {
  constructor() {
    this.offsets = [];
  }
  alloc(constructor, size) {
    const offset = self.Module._malloc(size * constructor.BYTES_PER_ELEMENT);
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

const _makePotentials = () => {
  const allocator = new Allocator();

  const seed = Math.floor(rng() * 0xFFFFFF);
  const potentials = allocator.alloc(Float32Array, PARCEL_SIZE_P2 * PARCEL_SIZE_P2 * PARCEL_SIZE_P2);
  const dims = allocator.alloc(Int32Array, 3);
  dims.set(Int32Array.from([PARCEL_SIZE_P2, PARCEL_SIZE_P2, PARCEL_SIZE_P2]));

  Module._doNoise2(
    seed,
    0.02,
    4,
    dims.offset,
    1,
    -0.5,
    potentials.offset
  );

  return {potentials, dims, allocator};
};
const _getChunkSpec = (potentials, dims, meshId) => {
  const allocator = new Allocator();

  const positions = allocator.alloc(Float32Array, 1024 * 1024 * Float32Array.BYTES_PER_ELEMENT);
  const barycentrics = allocator.alloc(Float32Array, 1024 * 1024 * Float32Array.BYTES_PER_ELEMENT);
  // const indices = allocator.alloc(Uint32Array, 1024 * 1024 * Uint32Array.BYTES_PER_ELEMENT);

  const numPositions = allocator.alloc(Uint32Array, 1);
  numPositions[0] = positions.length;
  const numBarycentrics = allocator.alloc(Uint32Array, 1);
  numBarycentrics[0] = barycentrics.length;
  // const numIndices = allocator.alloc(Uint32Array, 1);
  // numIndices[0] = indices.length;

  const shift = allocator.alloc(Float32Array, 3);
  shift.set(Float32Array.from([0, 0, 0]));

  const scale = allocator.alloc(Float32Array, 3);
  scale.set(Float32Array.from([1, 1, 1]));

  self.Module._doMarchingCubes2(
    dims.offset,
    potentials.offset,
    shift.offset,
    scale.offset,
    positions.offset,
    barycentrics.offset,
    // indices.offset,
    numPositions.offset,
    // numIndices.offset,
    numBarycentrics.offset
  );

  const arrayBuffer2 = new ArrayBuffer(
    Uint32Array.BYTES_PER_ELEMENT +
    numPositions[0] * Float32Array.BYTES_PER_ELEMENT +
    Uint32Array.BYTES_PER_ELEMENT +
    numBarycentrics[0] * Float32Array.BYTES_PER_ELEMENT,
    // Uint32Array.BYTES_PER_ELEMENT +
    // numIndices[0] * Uint32Array.BYTES_PER_ELEMENT,
  );
  let index = 0;

  const outP = new Float32Array(arrayBuffer2, index, numPositions[0]);
  outP.set(new Float32Array(positions.buffer, positions.byteOffset, numPositions[0]));
  index += Float32Array.BYTES_PER_ELEMENT * numPositions[0];

  const outB = new Float32Array(arrayBuffer2, index, numBarycentrics[0]);
  outB.set(new Float32Array(barycentrics.buffer, barycentrics.byteOffset, numBarycentrics[0]));
  index += Float32Array.BYTES_PER_ELEMENT * numBarycentrics[0];

  /* const outI = new Uint32Array(arrayBuffer2, index, numIndices[0]);
  outI.set(new Uint32Array(indices.buffer, indices.byteOffset, numIndices[0]));
  index += Uint32Array.BYTES_PER_ELEMENT * numIndices[0]; */

  allocator.freeAll();

  /* const colors = new Float32Array(outP.length);
  const c = new THREE.Color(0xaed581).toArray(new Float32Array(3));
  for (let i = 0; i < colors.length; i += 3) {
    colors.set(c, i);
  } */

  const ids = new Float32Array(numPositions[0]/3);
  const indices = new Float32Array(numPositions[0]/3);
  for (let i = 0; i < numPositions[0]/3/3; i++) {
    ids[i*3] = meshId;
    ids[i*3+1] = meshId;
    ids[i*3+2] = meshId;
    indices[i*3] = i;
    indices[i*3+1] = i;
    indices[i*3+2] = i;
  }

  return {
    // result: {
    positions: outP,
    barycentrics: outB,
    ids,
    indices,
    // colors,
    // indices: outI,
    /* },
    cleanup: () => {
      allocator.freeAll();

      this.running = false;
      if (this.queue.length > 0) {
        const fn = this.queue.shift();
        fn();
      }
    }, */
  };
};
let nextId = 0;
function meshIdToArray(meshId) {
  return [
    ((meshId >> 16) & 0xFF),
    ((meshId >> 8) & 0xFF),
    (meshId & 0xFF),
  ];
}

let remoteChunkMeshes = [];
const chunkMeshContainer = new THREE.Object3D();
scene.add(chunkMeshContainer);
let currentChunkMesh = null;
let physics = null;
let physicalMesh = null;
let capsuleMesh = null;
(async () => {

const [
  objectize,
  colors,
  ammo,
] = await Promise.all([
  (async () => {
    const {promise} = await import('./bin/objectize2.js');
    await promise;
  })(),
  (async () => {
    const res = await fetch('./colors.json');
    return await res.json();
  })(),
  await new Promise((accept, reject) => {
    Ammo()
      .then(ammo => {
        accept(ammo);
      })
      .catch(reject);
  }),
]);

physics = (() => {
  const ammoVector3 = new Ammo.btVector3();
  const ammoQuaternion = new Ammo.btQuaternion();
  const localTransform = new Ammo.btTransform();

  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  const overlappingPairCache = new Ammo.btDbvtBroadphase();
  const solver = new Ammo.btSequentialImpulseConstraintSolver();
  const dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  dynamicsWorld.setGravity(new Ammo.btVector3(0, -9.8, 0));

  // window.dispatcher = dispatcher;
  // window.dynamicsWorld = dynamicsWorld;

  /* const collisionConfiguration2 = new Ammo.btDefaultCollisionConfiguration();
  const dispatcher2 = new Ammo.btCollisionDispatcher(collisionConfiguration2);
  const broadphase = new Ammo.btDbvtBroadphase();
  const collisionWorld = new Ammo.btCollisionWorld(dispatcher2, broadphase, collisionConfiguration2); */

  {
    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(100, 100, 100));

    var groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -100, 0));

    var mass = 0;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
    var rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, groundShape, localInertia);
    var body = new Ammo.btRigidBody(rbInfo);

    dynamicsWorld.addRigidBody(body);
  }

  let lastTimestamp = 0;

  const _makeConvexHullShape = object => {
    const shape = new Ammo.btConvexHullShape();
    // let numPoints = 0;
    object.updateMatrixWorld();
    object.traverse(o => {
      if (o.isMesh) {
        const positions = o.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          localVector.set(positions[i], positions[i+1], positions[i+2])
            // .applyMatrix4(o.matrixWorld);
          // console.log('point', localVector.x, localVector.y, localVector.z);
          ammoVector3.setValue(localVector.x, localVector.y, localVector.z);
          const lastOne = i >= (positions.length - 3);
          shape.addPoint(ammoVector3, lastOne);
          // numPoints++;
        }
      }
    });
    shape.setMargin(0);
    // console.log('sword points', numPoints);
    return shape;
  };
  const _makeTriangleMeshShape = object => {
    const triangle_mesh = new Ammo.btTriangleMesh();
    const _vec3_1 = new Ammo.btVector3(0, 0, 0);
    const _vec3_2 = new Ammo.btVector3(0, 0, 0);
    const _vec3_3 = new Ammo.btVector3(0, 0, 0);

    object.updateMatrixWorld();
    object.traverse(o => {
      if (o.isMesh) {
        const positions = o.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 9) {
          _vec3_1.setX(positions[i]);
          _vec3_1.setY(positions[i+1]);
          _vec3_1.setZ(positions[i+2]);

          _vec3_2.setX(positions[i+3]);
          _vec3_2.setY(positions[i+4]);
          _vec3_2.setZ(positions[i+5]);

          _vec3_3.setX(positions[i+6]);
          _vec3_3.setY(positions[i+7]);
          _vec3_3.setZ(positions[i+8]);

          triangle_mesh.addTriangle(
            _vec3_1,
            _vec3_2,
            _vec3_3,
            true
          );
        }
      }
    });
    
    const shape = new Ammo.btBvhTriangleMeshShape(
      triangle_mesh,
      true,
      true
    );
    return shape;
  };

  return {
    bindCapsuleMeshPhysics(objectMesh) {
      const shape = new Ammo.btCapsuleShape(0.5, 2);

      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(objectMesh.position.x, objectMesh.position.y, objectMesh.position.z));

      const mass = 1;
      const localInertia = new Ammo.btVector3(0, 0, 0);
      shape.calculateLocalInertia(mass, localInertia);

      const myMotionState = new Ammo.btDefaultMotionState(transform);
      const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
      const body = new Ammo.btRigidBody(rbInfo);

      dynamicsWorld.addRigidBody(body);

      objectMesh.body = body;
      objectMesh.originalPosition = objectMesh.position.clone();
      objectMesh.originalQuaternion = objectMesh.quaternion.clone();
      objectMesh.originalScale = objectMesh.scale.clone();
    },
    bindStaticMeshPhysics(objectMesh) {
      const shape = _makeTriangleMeshShape(objectMesh);

      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(objectMesh.position.x, objectMesh.position.y, objectMesh.position.z));

      const mass = 0;
      const localInertia = new Ammo.btVector3(0, 0, 0);
      shape.calculateLocalInertia(mass, localInertia);

      const myMotionState = new Ammo.btDefaultMotionState(transform);
      const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
      const body = new Ammo.btRigidBody(rbInfo);

      dynamicsWorld.addRigidBody(body);

      /* const collisionObject = new Ammo.btCollisionObject();
      collisionObject.setCollisionShape(shape);
      collisionWorld.addCollisionObject(collisionObject); */
    },
    bindMeshPhysics(objectMesh) {
      if (!objectMesh.body) {
        const shape = _makeConvexHullShape(objectMesh);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(objectMesh.position.x, objectMesh.position.y, objectMesh.position.z));

        const mass = 1;
        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const myMotionState = new Ammo.btDefaultMotionState(transform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
        const body = new Ammo.btRigidBody(rbInfo);
        // body.setActivationState(4);
        /* const STATE = {
          ACTIVE : 1,
          ISLAND_SLEEPING : 2,
          WANTS_DEACTIVATION : 3,
          DISABLE_DEACTIVATION : 4,
          DISABLE_SIMULATION : 5
        }; */

        dynamicsWorld.addRigidBody(body);

        objectMesh.body = body;
        objectMesh.ammoObjects = [
          transform,
          localInertia,
          myMotionState,
          rbInfo,
          body,
        ];
        objectMesh.originalPosition = objectMesh.position.clone();
        objectMesh.originalQuaternion = objectMesh.quaternion.clone();
        objectMesh.originalScale = objectMesh.scale.clone();
      }
    },
    unbindMeshPhysics(objectMesh) {
      if (objectMesh.body) {
        dynamicsWorld.removeRigidBody(objectMesh.body);
        objectMesh.body = null;
        objectMesh.ammoObjects.forEach(o => {
          Ammo.destroy(o);
        });
        objectMesh.ammoObjects.length = null;

        objectMesh.position.copy(objectMesh.originalPosition);
        objectMesh.quaternion.copy(objectMesh.originalQuaternion);
        objectMesh.scale.copy(objectMesh.originalScale);
        objectMesh.originalPosition = null;
        objectMesh.originalQuaternion = null;
        objectMesh.originalScale = null;
      }
    },
    simulate() {
      const now = Date.now();
      if (lastTimestamp === 0) {
        lastTimestamp = now;
      }
      const timeDiff = now - lastTimestamp;

      dynamicsWorld.stepSimulation(timeDiff/1000, 2);

      lastTimestamp = now;
    },
    pullObjectMesh(mesh) {
      // if (mesh.body) {
        mesh.body.getMotionState().getWorldTransform(localTransform);
        const origin = localTransform.getOrigin();
        mesh.position.set(origin.x(), origin.y(), origin.z());
        // console.log('mesh pos', mesh.position.toArray());
        const rotation = localTransform.getRotation();
        mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
      // }
    },
    pushObjectMesh(mesh) {
      localTransform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
      localTransform.setRotation(new Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w));
      mesh.body.setWorldTransform(localTransform);
      mesh.body.activate(true);
    },
    resetObjectMesh(mesh) {
      // if (mesh.body) {
        localTransform.setOrigin(new Ammo.btVector3(mesh.originalPosition.x, mesh.originalPosition.y, mesh.originalPosition.z));
        localTransform.setRotation(new Ammo.btQuaternion(mesh.originalQuaternion.x, mesh.originalQuaternion.y, mesh.originalQuaternion.z, mesh.originalQuaternion.w));
        mesh.body.setWorldTransform(localTransform);
        mesh.body.activate(true);

        mesh.position.copy(mesh.originalPosition);
        mesh.quaternion.copy(mesh.originalQuaternion);
        mesh.scale.copy(mesh.originalScale);
      // }
    },
    checkCollisions() {
      const numManifolds = dispatcher.getNumManifolds();
      console.log('num manifolds', numManifolds);

      for (let i = 0; i < numManifolds; i++) {
        const manifold = dispatcher.getManifoldByIndexInternal(i);
        const num_contacts = manifold.getNumContacts();

        const body0 = manifold.getBody0();
        const body1 = manifold.getBody1();
        // window.body0 = body0;
        // window.body1 = body1;

        if (body0.hy === capsuleMesh.body.hy, body1.hy === capsuleMesh.body.hy) {
          console.log('get contacts', num_contacts);
        }

        for (let j = 0; j < num_contacts; j++) {
          const pt = manifold.getContactPoint(j);

          // debugger;
        }
      }
    },
  };
})();

physicalMesh = (() => {
  const geometry = new THREE.TetrahedronBufferGeometry(1, 0);
  const material = new THREE.MeshBasicMaterial({
    color: 0x0000FF,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
})();
physicalMesh.position.set(0, 20, 0);
scene.add(physicalMesh);
physics.bindMeshPhysics(physicalMesh);
// window.physicalMesh = physicalMesh;

capsuleMesh = (() => {
  const geometry = new THREE.SphereBufferGeometry(0.5);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFF0000,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
})();
// scene.add(capsuleMesh);
physics.bindCapsuleMeshPhysics(capsuleMesh);
// window.capsuleMesh = capsuleMesh;

const _makeChunkMesh = () => {
  const {potentials, dims} = _makePotentials();

  const meshId = ++nextId;
  const spec = _getChunkSpec(potentials, dims, meshId);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(spec.positions, 3));
  geometry.setAttribute('barycentric', new THREE.BufferAttribute(spec.barycentrics, 3));
  geometry.setAttribute('id', new THREE.BufferAttribute(spec.ids, 1));
  geometry.setAttribute('index', new THREE.BufferAttribute(spec.indices, 1));

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

  const numStops = 1;// Math.floor(2 + rng() * 5);
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

  const mesh = new THREE.Mesh(geometry, heightfieldMaterial);
  mesh.frustumCulled = false;
  mesh.meshId = meshId;
  mesh.potentials = potentials;
  mesh.dims = dims;
  return mesh;
};

const chunkMesh = _makeChunkMesh();
/* {
  const img = document.createElement('img');
  img.src = 'grass.png';
  img.onload = () => {
    chunkMesh.material.uniforms.tex.value.image = img;
    chunkMesh.material.uniforms.tex.value.needsUpdate = true;
  };
  img.onerror = err => {
    console.warn(err);
  };
} */
chunkMeshContainer.add(chunkMesh);

const numRemoteChunkMeshes = 30;
remoteChunkMeshes = Array(numRemoteChunkMeshes);
for (let i = 0; i < numRemoteChunkMeshes; i++) {
  const remoteChunkMesh = _makeChunkMesh();
  remoteChunkMesh.position.set(-1 + rng()*2, -1 + rng()*2, -1 + rng()*2).multiplyScalar(100);
  chunkMeshContainer.add(remoteChunkMesh);
  remoteChunkMeshes[i] = remoteChunkMesh;
}
remoteChunkMeshes.push(chunkMesh);

physics.bindStaticMeshPhysics(chunkMesh);
/* for (let i = 0; i < remoteChunkMeshes.length; i++) {
  console.time('lol');
  physics.bindStaticMeshPhysics(remoteChunkMeshes[i]);
  console.timeEnd('lol');
} */

})();

let wrenchMesh = null;
let sledgehammerMesh = null;
let paintBrushMesh = null;
(async () => {
  const toolsModels = await new Promise((accept, reject) => {
    new GLTFLoader().load('./tools.glb', o => {
      o = o.scene;
      accept(o);
    }, xhr => {}, reject);
  });
  wrenchMesh = toolsModels.children.find(c => c.name === 'SM_Tool_Pipe_Wrench_01');
  wrenchMesh.visible = false;
  scene.add(wrenchMesh);
  sledgehammerMesh = toolsModels.children.find(c => c.name === 'SM_Tool_Hammer_Sledge');
  sledgehammerMesh.visible = false;
  scene.add(sledgehammerMesh);
  paintBrushMesh = toolsModels.children.find(c => c.name === 'SM_Tool_Paint_Brush_02');
  paintBrushMesh.visible = false;
  scene.add(paintBrushMesh);
})();

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

const _findMeshWithMeshId = (container, meshId) => {
  let result = null;
  container.traverse(o => {
    if (result === null && o.meshId === meshId) {
      result = o;
    }
  });
  return result;
};

const idMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    attribute float id;
    attribute float index;
    varying float vId;
    varying float vIndex;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      vId = id;
      vIndex = index;
    }
  `,
  fragmentShader: `
    varying float vId;
    varying float vIndex;
    void main() {
      gl_FragColor = vec4((vId+1.0)/64000.0, (vIndex+1.0)/64000.0, 0.0, 0.0);
    }
  `,
  // side: THREE.DoubleSide,
});
class PointRaycaster {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
    });
    this.renderer.setSize(1, 1);
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(new THREE.Color(0x000000), 0);
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
    });
    this.renderer.setRenderTarget(renderTarget);
    this.renderTarget = renderTarget;
    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = idMaterial;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.pixels = new Float32Array(4);
  }

  raycastMeshes(container, position, quaternion) {
    const oldParent = container.parent;
    this.scene.add(container);

    this.camera.position.copy(position);
    this.camera.quaternion.copy(quaternion);
    this.camera.updateMatrixWorld();

    this.renderer.render(this.scene, this.camera);

    if (oldParent) {
      oldParent.add(container);
    } else {
      container.parent.remove(container);
    }

    this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, 1, 1, this.pixels);
    let mesh;
    let index;
    let point;
    let normal;
    if (this.pixels[0] !== 0) {
      const meshId = Math.floor(this.pixels[0]*64000)-1; // (Math.floor(this.pixels[0]*255) << 16) | (Math.floor(this.pixels[1]*255) << 8) | Math.floor(this.pixels[2]*255);
      mesh = _findMeshWithMeshId(container, meshId);
      index = Math.floor(this.pixels[1]*64000)-1;

      const triangle = new THREE.Triangle(
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9).applyMatrix4(mesh.matrixWorld),
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+3).applyMatrix4(mesh.matrixWorld),
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+6).applyMatrix4(mesh.matrixWorld)
      );
      normal = triangle.getNormal(new THREE.Vector3());
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, triangle.a);

      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.copy(position);
      raycaster.ray.direction.set(0, 0, -1).applyQuaternion(quaternion);

      point = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    } else {
      mesh = null;
      index = -1;
      point = null;
      normal = null;
    }

    return point ? {mesh, index, point, normal} : null;
  }
}
const pointRaycaster = new PointRaycaster();

const depthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uNear: {
      type: 'f',
      value: 0,
    },
    uFar: {
      type: 'f',
      value: 1,
    },
  },
  vertexShader: `\
    attribute float id;
    attribute float index;
    varying float vId;
    varying float vIndex;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      vId = id;
      vIndex = index;
    }
  `,
  fragmentShader: `\
    // varying vec2 vTexCoords;

    varying float vId;
    varying float vIndex;

    uniform float uNear;
    uniform float uFar;
    /* vec4 encodePixelDepth(float v) {
      float x = fract(v);
      v -= x;
      v /= 255.0;
      float y = fract(v);
      v -= y;
      v /= 255.0;
      float z = fract(v);
      return vec4(x, y, z, 0.0);
    } */
    vec2 encodePixelDepth(float v) {
      float x = fract(v);
      v -= x;
      v /= 255.0;
      float y = fract(v);
      return vec2(x, y);
    }
    void main() {
      /* float z_b = texture2D(colorMap, vTexCoords).r;
      float z_n = 2.0 * z_b - 1.0;
      float z_e = 2.0 * uNear * uFar / (uFar + uNear - z_n * (uFar - uNear)); */

      gl_FragColor = vec4(encodePixelDepth(gl_FragCoord.z/gl_FragCoord.w), (vId+1.0)/64000.0, (vIndex+1.0)/64000.0);
    }
  `,
  // side: THREE.DoubleSide,
});
class CollisionRaycaster {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
    });
    this.renderer.setSize(10, 10);
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(new THREE.Color(0x000000), 0);
    const renderTarget = new THREE.WebGLRenderTarget(10, 10, {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
    });
    this.renderer.setRenderTarget(renderTarget);
    this.renderTarget = renderTarget;
    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = depthMaterial;
    this.camera = new THREE.OrthographicCamera(Math.PI, Math.PI, Math.PI, Math.PI, 0.001, 1000);
    this.pixels = new Float32Array(10*10*4);
    this.depths = new Float32Array(10*10);
    this.normals = (() => {
      const result = Array(10*10);
      for (let i = 0; i < 10*10; i++) {
        result[i] = new THREE.Vector3();
      }
      return result;
    })();
  }

  raycastMeshes(container, position, quaternion, uSize, vSize, dSize) {
    const oldParent = container.parent;
    this.scene.add(container);

    this.camera.position.copy(position);
    this.camera.quaternion.copy(quaternion);
    this.camera.updateMatrixWorld();

    this.camera.left = uSize / -2;
    this.camera.right = uSize / 2;
    this.camera.top = vSize / 2;
    this.camera.bottom = vSize / -2;
    this.camera.near = 0.001;
    this.camera.far = dSize;
    this.camera.updateProjectionMatrix();

    this.scene.overrideMaterial.uniforms.uNear.value = this.camera.near;
    this.scene.overrideMaterial.uniforms.uFar.value = this.camera.far;

    this.renderer.render(this.scene, this.camera);

    if (oldParent) {
      oldParent.add(container);
    } else {
      container.parent.remove(container);
    }

    this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, 10, 10, this.pixels);

    let j = 0;
    for (let i = 0; i < this.depths.length; i++) {
      if (this.pixels[j + 3] !== 0) {
        let v =
          this.pixels[j] +
          this.pixels[j+1] * 255.0;
        this.depths[i] = this.camera.near + v * (this.camera.far - this.camera.near);
        const meshId = Math.floor(this.pixels[j+2]*64000)-1;
        const index = Math.floor(this.pixels[j+3]*64000)-1;

        const mesh = _findMeshWithMeshId(container, meshId);
        const triangle = new THREE.Triangle(
          new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9).applyMatrix4(mesh.matrixWorld),
          new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+3).applyMatrix4(mesh.matrixWorld),
          new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+6).applyMatrix4(mesh.matrixWorld)
        );
        triangle.getNormal(this.normals[i]);
      } else {
        this.depths[i] = Infinity;
      }
      j += 4;
    }

    // console.log('got pixels', this.depths);

    /* let mesh;
    let index;
    let point;
    let normal;
    if (this.pixels[3] !== 1) {
      const meshId = (Math.floor(this.pixels[0]*255) << 16) | (Math.floor(this.pixels[1]*255) << 8) | Math.floor(this.pixels[2]*255);
      // mesh = meshes.find(mesh => mesh.meshId === meshId) || null;
      mesh = _findMeshWithMeshId(meshId);
      index = Math.floor(this.pixels[3]*64000)-1;

      const triangle = new THREE.Triangle(
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9).applyMatrix4(mesh.matrixWorld),
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+3).applyMatrix4(mesh.matrixWorld),
        new THREE.Vector3().fromArray(mesh.geometry.attributes.position.array, index*9+6).applyMatrix4(mesh.matrixWorld)
      );
      normal = triangle.getNormal(new THREE.Vector3());
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, triangle.a);

      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.copy(position);
      raycaster.ray.direction.set(0, 0, -1).applyQuaternion(quaternion);

      point = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    } else {
      mesh = null;
      index = -1;
      point = null;
      normal = null;
    }

    return point ? {mesh, index, point, normal} : null; */
  }
}
const collisionRaycaster = new CollisionRaycaster();

const collisionCubeGeometry = new THREE.BoxBufferGeometry(0.05, 0.05, 0.05);
const sideCollisionCubeMaterial = new THREE.MeshBasicMaterial({
  color: 0xFF0000,
});
const floorCollisionCubeMaterial = new THREE.MeshBasicMaterial({
  color: 0x00FF00,
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

const planetMaterial = (() => {
  const loadVsh = `
    attribute float id;
    varying vec3 vPosition;
    varying float vId;
    void main() {
      vec4 p = modelViewMatrix * vec4(position, 1.);
      vPosition = p.xyz;
      gl_Position = projectionMatrix * p;
      vId = id;
    }
  `;
  const loadFsh = `
    uniform float selectedId;
    varying vec3 vPosition;
    varying float vId;
    vec3 lightDirection = vec3(0.0, 0.0, 1.0);
    void main() {
      vec3 xTangent = dFdx( vPosition );
      vec3 yTangent = dFdy( vPosition );
      vec3 faceNormal = normalize( cross( xTangent, yTangent ) );
      float lightFactor = dot(faceNormal, lightDirection);
      vec3 c = vec3(${new THREE.Color(0x333333).toArray().join(',')});
      gl_FragColor = vec4(
        c * (0.5 + lightFactor * 0.5),
        1.0
      );
      if (selectedId == vId) {
        gl_FragColor.b += 0.5;
      }
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      selectedId: {
        type: 'f',
        value: -1,
      }
    },
    vertexShader: loadVsh,
    fragmentShader: loadFsh,
  });
  return material;
})();
const _makePlanetMesh = (tileScale = 1) => {
  const noiseHeight = 0.5;
  const noiseScale = 0.5;
  const tileGeometry = new THREE.BoxBufferGeometry(tileScale, tileScale, tileScale);
  const parcelGeometry = (() => {
    const numCoords = tileGeometry.attributes.position.array.length;
    const positions = new Float32Array(numCoords * parcelSize * parcelSize);
    const indices = new Uint16Array(numCoords * parcelSize * parcelSize);
    const edges = new Uint16Array(numCoords/3 * parcelSize * parcelSize);
    const ids = new Uint16Array(numCoords/3 * parcelSize * parcelSize);
    let i = 0;
    let indexIndex = 0;
    for (let x = -parcelSize / 2 + 1; x < parcelSize / 2; x++) {
      for (let z = -parcelSize / 2 + 1; z < parcelSize / 2; z++) {
        const newTileGeometry = tileGeometry.clone()
          .applyMatrix4(localMatrix.makeTranslation(x, 0, z));
        positions.set(newTileGeometry.attributes.position.array, i * newTileGeometry.attributes.position.array.length);
        for (let i = 0; i < newTileGeometry.index.array.length; i++) {
          newTileGeometry.index.array[i] += indexIndex;
        }
        indices.set(newTileGeometry.index.array, i * newTileGeometry.index.array.length);
        if (x === (-parcelSize / 2 + 1)) {
          for (let j = 0; j < tileGeometry.attributes.position.array.length; j += 3) {
            localVector.fromArray(tileGeometry.attributes.position.array, j);
            if (localVector.x < 0) {
              edges.fill(1, i * tileGeometry.attributes.position.array.length/3 + j/3, i * tileGeometry.attributes.position.array.length/3 + j/3 + 1);
            }
          }
        }
        if (x === (parcelSize / 2 - 1)) {
          for (let j = 0; j < tileGeometry.attributes.position.array.length; j += 3) {
            localVector.fromArray(tileGeometry.attributes.position.array, j);
            if (localVector.x > 0) {
              edges.fill(1, i * tileGeometry.attributes.position.array.length/3 + j/3, i * tileGeometry.attributes.position.array.length/3 + j/3 + 1);
            }
          }
        }
        if (z === (-parcelSize / 2 + 1)) {
          for (let j = 0; j < tileGeometry.attributes.position.array.length; j += 3) {
            localVector.fromArray(tileGeometry.attributes.position.array, j);
            if (localVector.z < 0) {
              edges.fill(1, i * tileGeometry.attributes.position.array.length/3 + j/3, i * tileGeometry.attributes.position.array.length/3 + j/3 + 1);
            }
          }
        }
        if (z === (parcelSize / 2 - 1)) {
          for (let j = 0; j < tileGeometry.attributes.position.array.length; j += 3) {
            localVector.fromArray(tileGeometry.attributes.position.array, j);
            if (localVector.z > 0) {
              edges.fill(1, i * tileGeometry.attributes.position.array.length/3 + j/3, i * tileGeometry.attributes.position.array.length/3 + j/3 + 1);
            }
          }
        }
        for (let j = 0; j < newTileGeometry.attributes.position.array.length/3; j++) {
          ids[i * newTileGeometry.attributes.position.array.length/3 + j] = i;
        }
        i++;
        indexIndex += newTileGeometry.attributes.position.array.length/3;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.setAttribute('edge', new THREE.BufferAttribute(edges, 1));
    geometry.setAttribute('id', new THREE.BufferAttribute(ids, 1));
    return geometry;
  })();
  const yIndices = [];
  for (let i = 0; i < tileGeometry.attributes.position.array.length; i += 3) {
    localVector.fromArray(tileGeometry.attributes.position.array, i);
    if (localVector.y > 0) {
      yIndices.push(i);
    }
  }
  const geometries = [
    parcelGeometry.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(parcelSize/2, 0, 0), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)), new THREE.Vector3(1, 1, 1))),
    parcelGeometry.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(-parcelSize/2, 0, 0), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0)), new THREE.Vector3(1, 1, 1))),
    parcelGeometry.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, parcelSize/2, 0), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0)), new THREE.Vector3(1, 1, 1))),
    parcelGeometry.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, -parcelSize/2, 0), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)), new THREE.Vector3(1, 1, 1))),
    parcelGeometry.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, 0, parcelSize/2), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)), new THREE.Vector3(1, 1, 1))),
    parcelGeometry.clone().applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, 0, -parcelSize/2), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1)), new THREE.Vector3(1, 1, 1))),
  ];
  const geometry =  BufferGeometryUtils.mergeBufferGeometries(geometries);

  const axes = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];
  for (let i = 0; i < axes.length; i++) {
    for (let j = 0; j < parcelGeometry.attributes.id.array.length; j++) {
      geometry.attributes.id.array[i * parcelGeometry.attributes.id.array.length + j] += i * parcelGeometry.attributes.id.array.length;
    }
  }
  for (let i = 0; i < axes.length; i++) {
    const axis = axes[i];
    const io = i*parcelGeometry.attributes.position.array.length;
    for (let jo = 0; jo < parcelGeometry.attributes.position.array.length; jo += tileGeometry.attributes.position.array.length) {
      for (let k = 0; k < yIndices.length; k++) {
        const ko = yIndices[k];
        const index = io+jo+ko;
        localVector.fromArray(geometry.attributes.position.array, index);
        if (geometry.attributes.edge.array[index/3] === 0) {
          const f = perlin.simplex3(localVector.x*noiseScale, localVector.y*noiseScale, localVector.z*noiseScale);
          localVector.add(localVector2.copy(axis).multiplyScalar(-1 + (1 + f)*noiseHeight));
        } else {
          localVector.add(localVector2.copy(axis).multiplyScalar(-tileScale));
        }
        localVector.toArray(geometry.attributes.position.array, index);
      }
    }
  }
  const mesh = new THREE.Mesh(geometry, planetMaterial);
  mesh.visible = false;
  return mesh;
};
const planetContainer = new THREE.Object3D();
scene.add(planetContainer);

const planetMesh = _makePlanetMesh(0.95);
planetMesh.position.y = -10/2;
planetContainer.add(planetMesh);

const planetAuxContainer = new THREE.Object3D();
const planetAuxMesh = _makePlanetMesh();
planetAuxMesh.position.copy(planetMesh.position);
planetAuxMesh.updateMatrixWorld();
planetAuxContainer.add(planetAuxMesh);

const numRemotePlanetMeshes = 10;
for (let i = 0; i < numRemotePlanetMeshes; i++) {
  const remotePlanetMesh = _makePlanetMesh(0.95);
  remotePlanetMesh.position.set(-1 + rng() * 2, -1 + rng() * 2, -1 + rng() * 2).multiplyScalar(30);

  const textMesh = makeTextMesh('Planet 0', 3, 'center');
  textMesh.position.y = 10;
  remotePlanetMesh.add(textMesh);

  planetContainer.add(remotePlanetMesh);
}

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

const _getCurrentParcel = p => new THREE.Vector3(
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
};

const velocity = new THREE.Vector3();
const lastGrabs = [false, false];
const lastAxes = [[0, 0], [0, 0]];
let currentTeleport = false;
let lastTeleport = false;
const timeFactor = 2000;
let lastTimestamp = performance.now();
let lastParcel  = new THREE.Vector3(0, 0, 0);
function animate(timestamp, frame) {
  const timeDiff = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  if (physics) {
    physics.simulate();
    physics.pullObjectMesh(physicalMesh);
    // physics.checkCollisions();
  }

  // loadMeshMaterial.uniforms.uTime.value = (Date.now() % timeFactor) / timeFactor;
  for (let i = 0; i < remoteChunkMeshes.length; i++) {
    remoteChunkMeshes[i].material.uniforms.uTime.value = (Date.now() % timeFactor) / timeFactor;
  }

  const session = renderer.xr.getSession();
  if (session) {
    const inputSource = session.inputSources[1];
    let pose;
    if (pose = frame.getPose(inputSource.targetRaySpace, renderer.xr.getReferenceSpace())) {
      localMatrix.fromArray(pose.transform.matrix)
        .decompose(localVector, localQuaternion, localVector2);

      if (capsuleMesh) {
        capsuleMesh.position.copy(localVector);
        capsuleMesh.quaternion.copy(localQuaternion);
        physics.pushObjectMesh(capsuleMesh);
        physicalMesh.body.activate(true);
      }

      // cubeMesh.position.copy(localVector).add(localVector2.set(0, 0, -1).applyQuaternion(localQuaternion));

      const raycastChunkSpec = pointRaycaster.raycastMeshes(chunkMeshContainer, localVector, localQuaternion);

      [wrenchMesh, sledgehammerMesh, paintBrushMesh].forEach(weaponMesh => {
        if (weaponMesh) {
          weaponMesh.visible = false;
        }
      });
      const selectedWeaponModel = (() => {
        switch (selectedWeapon) {
          case 'wrench': {
            return wrenchMesh;
          }
          case 'sledgehammer': {
            return sledgehammerMesh;
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
        selectedWeaponModel.position.copy(localVector);
        selectedWeaponModel.quaternion.copy(localQuaternion);
        selectedWeaponModel.visible = true;
      }
      addMesh.visible = false;
      removeMesh.visible = false;
      switch (selectedWeapon) {
        case 'wrench': {
          addMesh.position.copy(localVector)
            .add(new THREE.Vector3(0, 0, -2).applyQuaternion(localQuaternion));
          addMesh.quaternion.copy(localQuaternion);
          addMesh.visible = true;
          break;
        }
        case 'sledgehammer': {
          if (raycastChunkSpec && raycastChunkSpec.mesh === currentChunkMesh) {
            removeMesh.position.copy(raycastChunkSpec.point);
            removeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), raycastChunkSpec.normal);
            removeMesh.visible = true;
          }
          break;
        }
        /* case 'paintbrush': {
          return paintBrushMesh;
        } */
        /* default: {
          return null;
        } */
      }
      if (currentWeaponDown && !lastWeaponDown) {
        const _applyPotentialDelta = (position, delta) => {
          localVector2.copy(position)
            .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
          localVector2.x = Math.floor(localVector2.x);
          localVector2.y = Math.floor(localVector2.y);
          localVector2.z = Math.floor(localVector2.z);
          const maxDistScale = 1;
          const maxDist = Math.sqrt(maxDistScale*maxDistScale + maxDistScale*maxDistScale + maxDistScale*maxDistScale);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ax = localVector2.x + dx;
                const ay = localVector2.y + dy;
                const az = localVector2.z + dz;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                const potentialIndex = ax + ay*PARCEL_SIZE_P2*PARCEL_SIZE_P2 + az*PARCEL_SIZE_P2;
                currentChunkMesh.potentials[potentialIndex] = Math.min(Math.max(currentChunkMesh.potentials[potentialIndex] + (maxDist - dist) * delta, -2), 2);

                const spec = _getChunkSpec(currentChunkMesh.potentials, currentChunkMesh.dims, currentChunkMesh.meshId);
                currentChunkMesh.geometry.setAttribute('position', new THREE.BufferAttribute(spec.positions, 3));
                currentChunkMesh.geometry.setAttribute('barycentric', new THREE.BufferAttribute(spec.barycentrics, 3));
                currentChunkMesh.geometry.setAttribute('id', new THREE.BufferAttribute(spec.ids, 1));
                currentChunkMesh.geometry.setAttribute('index', new THREE.BufferAttribute(spec.indices, 1));
              }
            }
          }
        };
        switch (selectedWeapon) {
          case 'wrench': {
            if (addMesh.visible) {
              _applyPotentialDelta(addMesh.position, 0.2);
            }
            break;
          }
          case 'sledgehammer': {
            if (removeMesh.visible) {
              _applyPotentialDelta(removeMesh.position, -0.2);
            }
            break;
          }
          /* case 'paintbrush': {
            return paintBrushMesh;
          } */
          /* default: {
            return null;
          } */
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

        chunkMeshContainer.matrix
          .premultiply(localMatrix.makeTranslation(-position.x, -position.y, -position.z));

        /* localEuler.setFromQuaternion(localQuaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        localQuaternion3.setFromEuler(localEuler);
        localQuaternion3.inverse(); */

        chunkMeshContainer.matrix
          .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))

        chunkMeshContainer.matrix
          .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z));

        chunkMeshContainer.matrix
          // .premultiply(localMatrix.makeTranslation(0, -localVector2.y, 0));
          .premultiply(localMatrix.makeTranslation(0, -_getMinHeight(), 0));

        chunkMeshContainer.matrix
          .decompose(chunkMeshContainer.position, chunkMeshContainer.quaternion, chunkMeshContainer.scale);

        velocity.set(0, 0, 0);
      };

      const currentTeleportChunkMesh = raycastChunkSpec && raycastChunkSpec.mesh;
      if (currentTeleport && currentTeleportChunkMesh) {
        currentTeleportChunkMesh.material.uniforms.selectedIndex.value = raycastChunkSpec.index;

        if (raycastChunkSpec.point) {
          teleportMeshes[1].position.copy(raycastChunkSpec.point);
          teleportMeshes[1].quaternion.setFromUnitVectors(localVector.set(0, 1, 0), raycastChunkSpec.normal);
          teleportMeshes[1].visible = true;
          teleportMeshes[1].lineMesh.visible = false;
        }
      } else if (lastTeleport && !currentTeleport && currentTeleportChunkMesh) {
        teleportMeshes[1].visible = false;
       _teleportTo(teleportMeshes[1].position, teleportMeshes[1].quaternion);
       if (currentChunkMesh) {
        currentChunkMesh.material.uniforms.isCurrent.value = 0;
        currentChunkMesh = null;
       }
       currentChunkMesh = currentTeleportChunkMesh;
       if (currentChunkMesh) {
         currentChunkMesh.material.uniforms.isCurrent.value = 1;
        }
      } else {
        teleportMeshes[1].update(localVector, localQuaternion, currentTeleport, (position, quaternion) => {
          _teleportTo(position, localQuaternion.set(0, 0, 0, 1));
        });
      }
    }
  }

  if (planetAnimation) {
    const {startTime, endTime} = planetAnimation;
    const now = Date.now();
    const factor = Math.min((now - startTime) / (endTime - startTime), 1);
    _tickPlanetAnimation(factor);
  }

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

    // if (jumpState) {
      localVector.y -= 9.8;
    // }
    localVector.multiplyScalar(timeDiff);
    velocity.add(localVector);

    const _applyVelocity = position => {
      position.add(localVector4.copy(velocity).multiplyScalar(timeDiff));
    };
    const _collideWall = matrix => {
      matrix.decompose(localVector, localQuaternion, localVector2);
      if (velocity.x !== 0 || velocity.y !== 0 || velocity.z !== 0) {
        const width = 0.5;
        const height = 2;
        const depth = 2;
        const bodyWidth = 0.3;
        localQuaternion2.setFromUnitVectors(localVector3.set(0, 0, -1), localVector4.set(velocity.x, 0, velocity.z).normalize());
        localVector3.copy(localVector)
          .add(localVector4.set(0, -0.5, bodyWidth).applyQuaternion(localQuaternion2));
        collisionRaycaster.raycastMeshes(chunkMeshContainer, localVector3, localQuaternion2, width, height, depth);

        {
          let i = 0;
          for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
              const cubeMesh = sideCollisionCubes[i];
              const d = collisionRaycaster.depths[i];
              if (isFinite(d)) {
                const normal = collisionRaycaster.normals[i];

                cubeMesh.position.copy(localVector3)
                  .add(localVector4.set(-width/2 + 0.5/10*width + x/10*width, -height/2 + 0.5/10*height + y/10*height, -d).applyQuaternion(localQuaternion2));
                cubeMesh.quaternion.setFromUnitVectors(localVector5.set(0, 1, 0), normal);
                cubeMesh.visible = true;

                if (d < bodyWidth*2) {
                  localVector4.y = 0;
                  localVector4.normalize();
                  const restitutionMagnitude = velocity.dot(localVector4);
                  if (restitutionMagnitude > 0) {
                    localVector5.copy(localVector4).multiplyScalar(-restitutionMagnitude);
                    velocity.add(localVector5);
                  }
                }
              } else {
                cubeMesh.visible = false;
              }
              i++;
            }
          }
        }

        /* for (let j = 0; j < 10; j++) {
          let minRestitutionMagnitude = 0;
          const restitutionVector = new THREE.Vector3();

          for (let i = 0; i < 10*10; i++) {
            const d = collisionRaycaster.depths[i];
            if (isFinite(d)) {
              const normal = collisionRaycaster.normals[i];
              if (d < 0.2) {
                localVector4.copy(normal);
                localVector4.y = 0;
                localVector4.normalize();
                const restitutionMagnitude = localVector4.dot(velocity);
                if (restitutionMagnitude < minRestitutionMagnitude) {
                  minRestitutionMagnitude = restitutionMagnitude;
                  restitutionVector.copy(localVector4);
                }
              }
            }
          }

          if (minRestitutionMagnitude < 0) {
            velocity.add(restitutionVector);
          } else {
            break;
          }
        } */
      }
    };
    const _collideFloor = matrix => {
      matrix.decompose(localVector, localQuaternion, localVector2);
      localEuler.setFromQuaternion(localQuaternion, 'YXZ');
      localEuler.x = -Math.PI/2;
      localQuaternion2.setFromEuler(localEuler);

      const width = 1;
      const height = 1;
      const depth = 100;

      collisionRaycaster.raycastMeshes(chunkMeshContainer, localVector, localQuaternion2, width, height, depth);

      const minHeight = _getMinHeight();

      let groundedDistance = Infinity;

      let i = 0;
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const cubeMesh = floorCollisionCubes[i];
          const d = collisionRaycaster.depths[i];

          if (isFinite(d)) {
            const normal = collisionRaycaster.normals[i];

            cubeMesh.position.copy(localVector)
              .add(localVector3.set(-width/2 + 0.5/10*width + x/10*width, -height/2 + 0.5/10*height + y/10*height, -d).applyQuaternion(localQuaternion2));
            cubeMesh.quaternion.setFromUnitVectors(localVector5.set(0, 1, 0), normal);
            cubeMesh.visible = true;

            if ((d + velocity.y * 10/1000) < minHeight && d < groundedDistance) {
              groundedDistance = d;
            }
          } else {
            cubeMesh.visible = false;
          }
          i++;
        }
      }

      if (isFinite(groundedDistance)) {
        return -groundedDistance + minHeight;
      } else {
        return 0;
      }
    };

    if (selectedTool === 'firstperson') {
      _collideWall(pe.camera.matrix);
      _applyVelocity(pe.camera.position);
      pe.camera.updateMatrixWorld();
      const offset = _collideFloor(pe.camera.matrix);
      if (offset) {
        pe.camera.position.y += offset;
        velocity.y = 0;
      }
      jumpState = velocity.y !== 0;
      pe.setRigMatrix(null);
    } else if (selectedTool === 'thirdperson') {
      const oldVelocity = velocity.clone();

      pe.camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localVector.add(localVector3.copy(avatarCameraOffset).applyQuaternion(localQuaternion));
      localMatrix.compose(localVector, localQuaternion, localVector2);
      _collideWall(localMatrix);
      _applyVelocity(pe.camera.position);
      pe.camera.updateMatrixWorld();
      pe.camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localVector.add(localVector3.copy(avatarCameraOffset).applyQuaternion(localQuaternion));
      localMatrix.compose(localVector, localQuaternion, localVector2);

      const offset = _collideFloor(localMatrix);
      if (offset) {
        pe.camera.position.y += offset;
        pe.camera.updateMatrixWorld();
        localVector.y += offset;
        velocity.y = 0;
      }
      jumpState = velocity.y !== 0;

      if (oldVelocity.lengthSq() > 0) {
        localQuaternion.setFromUnitVectors(localVector3.set(0, 0, -1), localVector4.set(oldVelocity.x, 0, oldVelocity.z).normalize());
      }
      pe.setRigMatrix(localMatrix.compose(localVector, localQuaternion, localVector2));
    } else if (selectedTool === 'isometric') {
      const oldVelocity = velocity.clone();

      pe.camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localVector.add(localVector3.copy(isometricCameraOffset).applyQuaternion(localQuaternion));
      localMatrix.compose(localVector, localQuaternion, localVector2);
      _collideWall(localMatrix);
      _applyVelocity(pe.camera.position);
      pe.camera.updateMatrixWorld();
      pe.camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localVector.add(localVector3.copy(isometricCameraOffset).applyQuaternion(localQuaternion));
      localMatrix.compose(localVector, localQuaternion, localVector2);

      const offset = _collideFloor(localMatrix);
      if (offset) {
        pe.camera.position.y += offset;
        pe.camera.updateMatrixWorld();
        localVector.y += offset;
        velocity.y = 0;
      }
      jumpState = velocity.y !== 0;

      if (oldVelocity.lengthSq() > 0) {
        localQuaternion.setFromUnitVectors(localVector3.set(0, 0, -1), localVector4.set(oldVelocity.x, 0, oldVelocity.z).normalize());
      }
      pe.setRigMatrix(localMatrix.compose(localVector, localQuaternion, localVector2));
    } else if (selectedTool === 'birdseye') {
      const oldVelocity = velocity.clone();
      const yOffset = -birdsEyeHeight + _getAvatarHeight();

      pe.camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localVector.add(localVector3.set(0, -birdsEyeHeight + _getAvatarHeight(), 0));
      localMatrix.compose(localVector, localQuaternion, localVector2);
      _collideWall(localMatrix);
      _applyVelocity(pe.camera.position);
      pe.camera.updateMatrixWorld();
      pe.camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localVector.add(localVector3.set(0, -birdsEyeHeight + _getAvatarHeight(), 0));
      localMatrix.compose(localVector, localQuaternion, localVector2);

      const offset = _collideFloor(localMatrix);
      if (offset) {
        pe.camera.position.y += offset;
        pe.camera.updateMatrixWorld();
        localVector.y += offset;
        velocity.y = 0;
      }
      jumpState = velocity.y !== 0;

      if (oldVelocity.lengthSq() > 0) {
        localQuaternion.setFromUnitVectors(localVector3.set(0, 0, -1), localVector4.set(oldVelocity.x, 0, oldVelocity.z).normalize());
      }
      pe.setRigMatrix(localMatrix.compose(localVector, localQuaternion, localVector2));
    } else {
      pe.setRigMatrix(null);
    }
  } else {
    pe.setRigMatrix(null);
  }

  const terminalVelocity = 50;
  const _clampToTerminalVelocity = v => Math.min(Math.max(v, -terminalVelocity), terminalVelocity);
  velocity.x = _clampToTerminalVelocity(velocity.x*0.7);
  velocity.z = _clampToTerminalVelocity(velocity.z*0.7);
  velocity.y = _clampToTerminalVelocity(velocity.y);

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

  lastTeleport = currentTeleport;
  lastWeaponDown = currentWeaponDown;

  renderer.render(scene, camera);
  // renderer.render(highlightScene, camera);
}
renderer.setAnimationLoop(animate);
renderer.xr.setSession(proxySession);

bindUploadFileButton(document.getElementById('import-scene-input'), async file => {
  const uint8Array = await readFile(file);
  await pe.importScene(uint8Array);
});

let selectedTool = 'camera';
const _getAvatarHeight = () => (pe.rig ? pe.rig.height : 1) * 0.9;
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
        /* case 'birdseye': {
          pe.camera.position.add(localVector.copy(avatarCameraOffset).applyQuaternion(pe.camera.quaternion));
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera);
          break;
        } */
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
          pe.camera.position.y = _getAvatarHeight();
          pe.camera.updateMatrixWorld();
          pe.setCamera(camera);

          document.dispatchEvent(new MouseEvent('mouseup'));
          pe.orbitControls.enabled = false;
          pe.domElement.requestPointerLock();
          break;
        }
        case 'thirdperson': {
          pe.camera.position.y = _getAvatarHeight();
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
          pe.camera.rotation.x = -Math.PI / 4;
          pe.camera.quaternion.setFromEuler(pe.camera.rotation);
          pe.camera.position.y = _getAvatarHeight();
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
          pe.camera.position.y = birdsEyeHeight;
          pe.camera.rotation.x = -Math.PI / 2;
          pe.camera.quaternion.setFromEuler(pe.camera.rotation);
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
        // nothing
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
        // nothing
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
    case 80: { // P
      physics.resetObjectMesh(physicalMesh);
      break;
    }
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
const _ensureVolumeMesh = async p => {
  if (!p.volumeMesh) {
    p.volumeMesh = await _makeVolumeMesh(p);
    p.volumeMesh = getWireframeMesh(p.volumeMesh);
    decorateRaycastMesh(p.volumeMesh, p.id);
    p.volumeMesh.package = p;
    p.volumeMesh.matrix.copy(p.matrix).decompose(p.volumeMesh.position, p.volumeMesh.quaternion, p.volumeMesh.scale);
    p.volumeMesh.visible = false;
    scene.add(p.volumeMesh);
  }
};
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
  await _ensureVolumeMesh(p);
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
  const candidateMeshes = pe.children
    .map(p => p.volumeMesh)
    .filter(o => !!o);
  // hoverTarget = volumeRaycaster.raycastMeshes(candidateMeshes, raycaster.ray.origin, raycaster.ray.direction);
  const intersects = raycaster.intersectObject(planetMesh);
  if (intersects.length > 0) {
    const [intersect] = intersects;
    const {faceIndex} = intersect;
    const a = planetMesh.geometry.index.array[faceIndex * 3];
    const id = planetMesh.geometry.attributes.id.array[a];
    planetMesh.material.uniforms.selectedId.value = id;
  }
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
    // pe.camera.updateMatrixWorld();
    // pe.setCamera(camera);
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
  } else if (selectedTool === 'select' && !getRealSession()) {
    _updateRaycasterFromMouseEvent(raycaster, e);
  }
});

renderer.domElement.addEventListener('mousedown', e => {
  if (!transformControlsHovered) {
    _setSelectTarget(hoverTarget);
  }
  /* if (document.pointerLockElement) {
    highlightMesh.onmousedown && highlightMesh.onmousedown();
  } */
});
/* renderer.domElement.addEventListener('mouseup', e => {
  if (document.pointerLockElement) {
    highlightMesh.onmouseup && highlightMesh.onmouseup();
  }
}); */

// const runMode = document.getElementById('run-mode');
// const editMode = document.getElementById('edit-mode');

const worldsButton = document.getElementById('worlds-button');
const worldSaveButton = document.getElementById('world-save-button');
const worldRevertButton = document.getElementById('world-revert-button');
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
const worldsSubtabs = Array.from(worldsSubpage.querySelectorAll('.subtab'));
const worldsCloseButton = worldsSubpage.querySelector('.close-button');
const worldsSubtabContents = Array.from(worldsSubpage.querySelectorAll('.subtab-content'));
const packagesCloseButton = packagesSubpage.querySelector('.close-button');
const inventorySubtabs = Array.from(inventorySubpage.querySelectorAll('.subtab'));
const inventoryCloseButton = inventorySubpage.querySelector('.close-button');
const inventorySubtabContent = inventorySubpage.querySelector('.subtab-content');
const avatarCloseButton = avatarSubpage.querySelector('.close-button');
worldsButton.addEventListener('click', e => {
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
});
packagesButton.addEventListener('click', e => {
  packagesButton.classList.add('open');
  packagesSubpage.classList.add('open');

  dropdownButton.classList.remove('open');
  dropdown.classList.remove('open');
  inventoryButton.classList.remove('open');
  inventorySubpage.classList.remove('open');
  worldsButton.classList.remove('open');
  worldsSubpage.classList.remove('open');
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
  worldsButton.classList.remove('open');
  worldsSubpage.classList.remove('open');
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
  worldsButton.classList.remove('open');
  worldsSubpage.classList.remove('open');
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
  worldsSubpage.classList.remove('open');
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
[worldsCloseButton, packagesCloseButton, inventoryCloseButton, avatarCloseButton].forEach(closeButton => {
  closeButton.addEventListener('click', e => {
    dropdownButton.classList.remove('open');
    dropdown.classList.remove('open');
    packagesButton.classList.remove('open');
    packagesSubpage.classList.remove('open');
    worldsButton.classList.remove('open');
    worldsSubpage.classList.remove('open');
    inventoryButton.classList.remove('open');
    inventorySubpage.classList.remove('open');
    avatarButton.classList.remove('open');
    avatarSubpage.classList.remove('open');
  });
});
async function screenshotEngine() {
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
});

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
(async () => {
  const res = await fetch(worldsEndpoint);
  const children = await res.json();
  const ws = await Promise.all(children.map(child =>
    fetch(worldsEndpoint + '/' + child)
      .then(res => res.json()),
  ));
  worlds.innerHTML = ws.map(w => _makeWorldHtml(w)).join('\n');
  Array.from(worlds.querySelectorAll('.world')).forEach((w, i) => _bindWorld(w, ws[i]));
})();
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
      console.log('remove', item);
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
  if (matrix) {
    p.setMatrix(matrix);
  }
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
    await _addPackage(p);
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
        raycaster.ray.origin.clone()
          .add(raycaster.ray.direction.clone().multiplyScalar(2)),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1)
      )

      const p = await XRPackage.download(dataHash);
      await _addPackage(p, localMatrix);
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
const sandboxButton = document.getElementById('sandbox-button');
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
});

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
const _handleUrl = async u => {
  const {search} = new URL(u);
  const q = parseQuery(search);

  if (q.p) { // package
    const metadata = await fetch(packagesEndpoint + '/' + q.p)
      .then(res => res.json())
    const {dataHash} = metadata;

    const arrayBuffer = await fetch(`${apiHost}/${dataHash}.wbn`)
      .then(res => res.arrayBuffer());

    const p = new XRPackage(new Uint8Array(arrayBuffer));
    await _addPackage(p);
  } else if (q.i) { // index
    const metadataHash = await contract.methods.getMetadata(parseInt(q.i, 10), 'hash').call();
    const metadata = await fetch(`${apiHost}/${metadataHash}`)
      .then(res => res.json());
    const {dataHash} = metadata;

    const arrayBuffer = await fetch(`${apiHost}/${dataHash}.wbn`)
      .then(res => res.arrayBuffer());

    const p = new XRPackage(new Uint8Array(arrayBuffer));
    await _addPackage(p);
  } else if (q.u) { // url
    const arrayBuffer = await fetch(q.u)
      .then(res => res.arrayBuffer());

    const p = new XRPackage(new Uint8Array(arrayBuffer));
    await pe.add(p);
  } else if (q.h) { // hash
    const p = await XRPackage.download(q.h);
    await _addPackage(p);
  } else {
    const w = q.w || null;
    _enterWorld(w);
  }
};
window.addEventListener('popstate', e => {
  _handleUrl(window.location.href);
});
_handleUrl(window.location.href);
