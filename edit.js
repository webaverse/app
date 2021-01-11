/* global Web3 */
/* eslint no-unused-vars: 0 */
import * as THREE from './three.module.js';
// import {GLTFLoader} from './GLTFLoader.js';
// import {GLTFExporter} from './GLTFExporter.js';
// import {TransformControls} from './TransformControls.js';
// import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import {loginManager} from './login.js';
import {tryTutorial} from './tutorial.js';
import runtime from './runtime.js';
import {parseQuery, downloadFile} from './util.js';
import {rigManager} from './rig.js';
import {makeRayMesh, makeTextMesh, makeHighlightMesh, makeButtonMesh, makeArrowMesh, makeCornersMesh} from './vr-ui.js';
import geometryManager from './geometry-manager.js';
import uiManager from './ui-manager.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {makePromise} from './util.js';
import {world} from './world.js';
import * as universe from './universe.js';
// import {Bot} from './bot.js';
import {GuardianMesh} from './land.js';
import {storageHost} from './constants.js';
import {renderer, scene, orthographicScene, avatarScene, camera, orthographicCamera, avatarCamera, dolly, /*orbitControls,*/ renderer2, scene2, scene3, appManager} from './app-object.js';
import weaponsManager from './weapons-manager.js';
import cameraManager from './camera-manager.js';
import minimap from './minimap.js';

const leftHandOffset = new THREE.Vector3(0.2, -0.2, -0.4);
const rightHandOffset = new THREE.Vector3(-0.2, -0.2, -0.4);
const leftHandGlideOffset = new THREE.Vector3(0.6, -0.2, -0.01);
const rightHandGlideOffset = new THREE.Vector3(-0.6, -0.2, -0.01);
const leftHandGlideQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
const rightHandGlideQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0));

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localRay = new THREE.Ray();
const localTriangle = new THREE.Triangle();

let xrscenetexture = null;
let xrsceneplane = null;
let xrscenecam = null;
let xrscene = null;

const q = parseQuery(location.search);
let loaded = false;
(async () => {
  const [
    loginResult,
    geometryResult,
    worldJson,
  ] = await Promise.all([
    loginManager.waitForLoad()
      .then(() => tryTutorial()),
    geometryManager.waitForLoad(),
    world.getWorldJson(q.u),
  ]);

  runtime.injectDependencies(geometryManager, physicsManager, world);

  try {
    await Promise.all([
      universe.enterWorld(worldJson),
      (async () => {
        if (q.o && !q.u && !q.r) {
          let contentId = parseInt(q.o);
          if (isNaN(contentId)) {
            contentId = q.o;
          }
          await world.addObject(contentId);
        }
      })(),
    ]);
  } catch (err) {
    console.error(err);
  }
  loaded = true;
})();

const itemMeshes = [];
const addItem = async (position, quaternion) => {
  const u = 'assets/mat.glb';
  const res = await fetch('./' + u);
  const file = await res.blob();
  file.name = u;
  let mesh = await runtime.loadFile(file, {
    optimize: false,
  });
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

let lastTimestamp = performance.now();
const startTime = Date.now();
function animate(timestamp, frame) {
  timestamp = timestamp || performance.now();
  const timeDiff = Math.min(Math.max(timestamp - lastTimestamp, 5), 100);
  lastTimestamp = timestamp;

  const session = renderer.xr.getSession();
  const now = Date.now();

  ioManager.update(timeDiff);
  universe.update();
  if (loaded) {
    physicsManager.update(timeDiff);
    physicsManager.simulatePhysics(timeDiff);
  }

  const _updateRig = () => {
    let hmdPosition, hmdQuaternion;
    let leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled;
    let rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled;

    if (rigManager.localRigMatrixEnabled) {
      localMatrix.copy(rigManager.localRigMatrix);
      // .premultiply(localMatrix2.copy(this.matrix).invert())
      // .toArray(xrState.poseMatrix);
    } else {
      localMatrix.copy(camera.matrixWorld);
      // .copy(localMatrix).invert()
      // .premultiply(localMatrix2.copy(this.matrix).invert())
      // .toArray(xrState.poseMatrix);
    }
    localMatrix // .fromArray(this.xrState.poseMatrix)
      .decompose(localVector, localQuaternion, localVector2);
    hmdPosition = localVector.toArray();
    hmdQuaternion = localQuaternion.toArray();

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
        leftGamepadEnabled = true;
      } else {
        leftGamepadEnabled = false;
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
        rightGamepadEnabled = true;
      } else {
        rightGamepadEnabled = false;
      }
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
      leftGamepadEnabled = false;
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
      rightGamepadEnabled = false;
    }

    rigManager.setLocalAvatarPose([
      [localVector.toArray(), localQuaternion.toArray()],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
    ]);
    rigManager.update();
  };
  _updateRig();

  weaponsManager.update();

  appManager.tick(timestamp, frame);
  
  ioManager.updatePost();

  const xrCamera = session ? renderer.xr.getCamera(camera) : camera;
  localMatrix.multiplyMatrices(xrCamera.projectionMatrix, localMatrix2.multiplyMatrices(xrCamera.matrixWorldInverse, geometryManager.worldContainer.matrixWorld));
  localMatrix3.copy(xrCamera.matrix)
    .premultiply(dolly.matrix)
    // .premultiply(localMatrix2.copy(geometryManager.worldContainer.matrixWorld).invert())
    .decompose(localVector, localQuaternion, localVector2);

  // high priority render
  renderer.render(scene3, camera);
  // main render
  scene.add(rigManager.localRig.model);
  rigManager.localRig.model.visible = false;
  renderer.render(scene, camera);
  renderer.render(orthographicScene, orthographicCamera);
  // local avatar render
  {
    rigManager.localRig.model.visible = true;
    avatarScene.add(rigManager.localRig.model);
    if (/^(?:camera|firstperson)$/.test(cameraManager.getMode()) || !!renderer.xr.getSession()) {
      rigManager.localRig.decapitate();
    } else {
      rigManager.localRig.undecapitate();
    }
    renderer.render(avatarScene, camera);
    rigManager.localRig.undecapitate();
  }
  // dom render
  renderer2.render(scene2, camera);
  // highlight render
  // renderer.render(highlightScene, camera);

  minimap.update();

  if (session && document.visibilityState == 'visible') {
    const {baseLayer} = session.renderState;
    if (!xrscenetexture || (xrscenetexture.image.width !== baseLayer.framebufferWidth * renderer.getPixelRatio() / 2) || ((xrscenetexture.image.height !== baseLayer.framebufferHeight * renderer.getPixelRatio()))) {
      xrscenetexture = new THREE.DataTexture(null, baseLayer.framebufferWidth * renderer.getPixelRatio() / 2, baseLayer.framebufferHeight * renderer.getPixelRatio(), THREE.RGBAFormat);
      xrscenetexture.minFilter = THREE.NearestFilter;
      xrscenetexture.magFilter = THREE.NearestFilter;
    }
    if (!xrscene) {
      xrscene = new THREE.Scene();

      xrsceneplane = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), new THREE.MeshBasicMaterial({map: xrscenetexture, /*side: THREE.DoubleSide,*/ color: 0xffffff}));
      xrscene.add(xrsceneplane);

      xrscenecam = new THREE.OrthographicCamera(-1 / 2, 1 / 2, 1 / 2, -1 / 2, -1, 1);
      xrscene.add(xrscenecam);
    }

    renderer.xr.enabled = false;
    renderer.copyFramebufferToTexture(localVector2D.set(0, 0), xrscenetexture);
    renderer.setFramebuffer(null);

    const oldOutputEncoding = renderer.outputEncoding;
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.setViewport(0, 0, canvas.width, canvas.height);
    renderer.render(xrscene, xrscenecam);
    renderer.xr.enabled = true;
    renderer.outputEncoding = oldOutputEncoding;
  }
}
geometryManager.waitForLoad().then(e => {
  setTimeout(() => {
    renderer.setAnimationLoop(animate);
  });
});

const _initializeXr = () => {
  let currentSession = null;
  function onSessionStarted(session) {
    session.addEventListener('end', onSessionEnded);
    renderer.xr.setSession(session);
    // renderer.xr.setReferenceSpaceType('local-floor');
    currentSession = session;
    // setState({ isXR: true })
  }
  function onSessionEnded() {
    currentSession.removeEventListener('end', onSessionEnded);
    renderer.xr.setSession(null);
    currentSession = null;
    // setState({ isXR: false });
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
