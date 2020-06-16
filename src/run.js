import * as THREE from './xrpackage/three.module.js';
import {XRPackageEngine, XRPackage} from './xrpackage.js';
import {tryLogin} from './xrpackage/login.js';
import {bindUploadFileButton} from './xrpackage/util.js';
import './selector.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

(async () => {
  await XRPackageEngine.waitForLoad();
  await tryLogin();
})();

let currentSession = null;

const pe = new XRPackageEngine({
  orbitControls: true,
});

/* const canvas = document.createElement('canvas');
const context = canvas.getContext('webgl', {
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: false,
}); */
const renderer = new THREE.WebGLRenderer({
  canvas: pe.domElement,
  context: pe.getContext('webgl'),
  antialias: true,
  alpha: true,
  // preserveDrawingBuffer: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = false;
renderer.sortObjects = false;
renderer.physicallyCorrectLights = true;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.5, 1);

const container = new THREE.Object3D();
scene.add(container);

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
container.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
container.add(directionalLight);
const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 3);
container.add(directionalLight2);

function mod(a, n) {
  return ((a%n)+n)%n;
}
const parcelSize = 10;
const parcelGeometry = (() => {
  const tileGeometry = new THREE.PlaneBufferGeometry(1, 1)
    .applyMatrix4(localMatrix.makeScale(0.95, 0.95, 1))
    .applyMatrix4(localMatrix.makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)))
    .toNonIndexed();
  const numCoords = tileGeometry.attributes.position.array.length;
  const numVerts = numCoords/3;
  const positions = new Float32Array(numCoords*parcelSize*parcelSize);
  const centers = new Float32Array(numCoords*parcelSize*parcelSize);
  const typesx = new Float32Array(numVerts*parcelSize*parcelSize);
  const typesz = new Float32Array(numVerts*parcelSize*parcelSize);
  let i = 0;
  for (let x = -parcelSize/2+0.5; x < parcelSize/2; x++) {
    for (let z = -parcelSize/2+0.5; z < parcelSize/2; z++) {
      const newTileGeometry = tileGeometry.clone()
        .applyMatrix4(localMatrix.makeTranslation(x, 0, z));
      positions.set(newTileGeometry.attributes.position.array, i * newTileGeometry.attributes.position.array.length);
      for (let j = 0; j < newTileGeometry.attributes.position.array.length/3; j++) {
        localVector.set(x, 0, z).toArray(centers, i*newTileGeometry.attributes.position.array.length + j*3);
      }
      let typex = 0;
      if (mod((x + parcelSize/2-0.5), parcelSize) === 0) {
        typex = 1/8;
      } else if (mod((x + parcelSize/2-0.5), parcelSize) === parcelSize-1) {
        typex = 2/8;
      }
      let typez = 0;
      if (mod((z + parcelSize/2-0.5), parcelSize) === 0) {
        typez = 1/8;
      } else if (mod((z + parcelSize/2-0.5), parcelSize) === parcelSize-1) {
        typez = 2/8;
      }
      for (let j = 0; j < numVerts; j++) {
        typesx[i*numVerts + j] = typex;
        typesz[i*numVerts + j] = typez;
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
container.add(floorMesh);

function animate(timestamp, frame) {
  /* const timeFactor = 1000;
  targetMesh.material.uniforms.uTime.value = (Date.now() % timeFactor) / timeFactor; */

  window.dispatchEvent(new MessageEvent('animate', {
    data: {
      timestamp,
      frame,
    },
  }));

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
const proxySession = pe.getProxySession({
  order: 1,
});
renderer.xr.setSession(proxySession);

document.addEventListener('dragover', e => {
  e.preventDefault();
});
document.addEventListener('drop', e => {
  e.preventDefault();

  if (e.dataTransfer.files.length > 0) {
    const [file] = e.dataTransfer.files;
    window.dispatchEvent(new MessageEvent('upload', {
      data: file,
    }));
  }
});
window.addEventListener('upload', async e => {
  const file = e.data;

  const d = await XRPackage.compileFromFile(file);
  const p = new XRPackage(d);
  if (p.type === 'webxr-site@0.0.1') {
    // nothing
  } else {
    const xrCamera = pe.renderer.xr.getCamera(pe.camera);
    localMatrix
      .copy(xrCamera.matrix)
      .premultiply(pe.matrix)
      .decompose(localVector, localQuaternion, localVector2);
    localVector.add(localVector2.set(0, 0, -1.5).applyQuaternion(localQuaternion));
    p.setMatrix(localMatrix.compose(localVector, localQuaternion, localVector2.set(1, 1, 1)));
  }
  await pe.add(p);

  /* if (/\.vrm$/.test(file.name)) {
    p.wearAvatar();
  } */
});

function onSessionStarted(session) {
  session.addEventListener('end', onSessionEnded);
  
  currentSession = session;

  pe.setSession(session);
}
function onSessionEnded() {
  currentSession.removeEventListener('end', onSessionEnded);

  currentSession = null;

  pe.setSession(null);
}
document.getElementById('enter-xr-button').addEventListener('click', e => {
  e.preventDefault();
  e.stopPropagation();
  
  if (currentSession === null) {
    navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: [
        'local-floor',
        'bounded-floor',
      ],
    }).then(onSessionStarted);
  } else {
    currentSession.end();
  }
});

bindUploadFileButton(document.getElementById('load-package-input'), file => {
  window.dispatchEvent(new MessageEvent('upload', {
    data: file,
  }));
});

const getRealSession = () => {
  return currentSession;
};

export {
  pe,
  renderer,
  scene,
  camera,
  container,
  floorMesh,
  bindUploadFileButton,
  proxySession,
  getRealSession,
};