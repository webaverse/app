/*
this file bootraps the webaverse engine.
it uses the help of various managers and stores, and executes the render loop.
*/

import * as THREE from 'three';
import WSRTC from 'wsrtc/wsrtc.js';
import Avatar from './avatars/avatars.js';
import physx from './physx.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as blockchain from './blockchain.js';
import cameraManager from './camera-manager.js';
import game from './game.js';
import hpManager from './hp-manager.js';
// import equipmentRender from './equipment-render.js';
// import * as characterController from './character-controller.js';
import {playersManager} from './players-manager.js';
import * as postProcessing from './post-processing.js';
import {Stats} from './stats.js';
import {
  getRenderer,
  scene,
  sceneHighPriority,
  sceneLowPriority,
  // rootScene,
  camera,
  dolly,
  bindCanvas,
  getComposer,
  rootScene,
} from './renderer.js';
import transformControls from './transform-controls.js';
import * as metaverseModules from './metaverse-modules.js';
import soundManager from './sound-manager.js';
import dioramaManager from './diorama.js';
import metaversefileApi from 'metaversefile';

// const leftHandOffset = new THREE.Vector3(0.2, -0.2, -0.4);
// const rightHandOffset = new THREE.Vector3(-0.2, -0.2, -0.4);

window.isStart = false;
// const width = 71;
// const height = 71;
const width = 15;
const height = 15;
window.frontiers = []
window.blocks = new THREE.Group();
window.rootScene.add(window.blocks);

const materialIdle = new THREE.MeshStandardMaterial({ color: new THREE.Color('rgb(221,213,213)') });
const materialAct = new THREE.MeshStandardMaterial({ color: new THREE.Color('rgb(204,191,179)') });
const materialFrontier = new THREE.MeshStandardMaterial({ color: new THREE.Color('rgb(92,133,214)') });
const materialStart = new THREE.MeshStandardMaterial({ color: new THREE.Color('rgb(191,64,64)') });
const materialDest = new THREE.MeshStandardMaterial({ color: new THREE.Color('rgb(191,64,170)') });
const materialPath = new THREE.MeshStandardMaterial({ color: new THREE.Color('rgb(149,64,191)') });
const materialObstacle = new THREE.MeshStandardMaterial({ color: new THREE.Color('rgb(134,134,121)') });

const vs = {}
vs.xy_to_serial = function (width, xy) { // :index
  return xy.y * width + xy.x
}

function getBlock(x, y) {
  // if (x === -10) debugger
  x += (width - 1) / 2
  y += (height - 1) / 2
  if (x < 0 || y < 0 || x >= width || y >= height) return null
  return window.blocks.children[vs.xy_to_serial(width, { x, y })]
}

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
// const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
// const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localArray = Array(4);
const localArray2 = Array(4);
const localArray3 = Array(4);
const localArray4 = Array(4);

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

const frameEvent = new MessageEvent('frame', {
  data: {
    now: 0,
    timeDiff: 0,
    // lastTimestamp: 0,
  },
});

var rendererStats = Stats();

export default class Webaverse extends EventTarget {
  constructor() {
    super();

    rendererStats.domElement.style.position = 'absolute';
    rendererStats.domElement.style.left = '0px';
    rendererStats.domElement.style.bottom = '0px';
    // rendererStats.domElement.style.display = 'none';
    document.body.appendChild(rendererStats.domElement);

    {
      const audioContext = WSRTC.getAudioContext();
      Avatar.setAudioContext(audioContext);
    }
    this.loadPromise = (async () => {
      await Promise.all([
        physx.waitForLoad(),
        Avatar.waitForLoad(),
        transformControls.waitForLoad(),
        metaverseModules.waitForLoad(),
      ]);
    })();
    this.contentLoaded = false;
  }

  waitForLoad() {
    return this.loadPromise;
  }

  getRenderer() {
    return getRenderer();
  }

  getScene() {
    return scene;
  }

  getSceneHighPriority() {
    return sceneHighPriority;
  }

  getSceneLowPriority() {
    return sceneLowPriority;
  }

  getCamera() {
    return camera;
  }

  setContentLoaded() {
    this.contentLoaded = true;
  }

  bindInput() {
    ioManager.bindInput();
  }

  bindInterface() {
    ioManager.bindInterface();
    blockchain.bindInterface();
  }

  bindCanvas(c) {
    bindCanvas(c);

    postProcessing.bindCanvas();
  }

  bindPreviewCanvas(canvas) {
    game.bindPreviewCanvas(canvas);
  }

  async isXrSupported() {
    if (navigator.xr) {
      let ok = false;
      try {
        ok = await navigator.xr.isSessionSupported(sessionMode);
      } catch (err) {
        console.warn(err);
      }
      return ok;
    } else {
      return false;
    }
  }

  /* toggleMic() {
    return world.toggleMic();
  } */
  async enterXr() {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    if (session === null) {
      let session = null;
      try {
        session = await navigator.xr.requestSession(sessionMode, sessionOpts);
      } catch (err) {
        try {
          session = await navigator.xr.requestSession(sessionMode);
        } catch (err) {
          console.warn(err);
        }
      }
      if (session) {
        function onSessionEnded(e) {
          session.removeEventListener('end', onSessionEnded);
          renderer.xr.setSession(null);
        }
        session.addEventListener('end', onSessionEnded);
        renderer.xr.setSession(session);
        // renderer.xr.setReferenceSpaceType('local-floor');
      }
    } else {
      await session.end();
    }
  }

  /* injectRigInput() {
    let leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled;
    let rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled;

    const localPlayer = metaversefileApi.useLocalPlayer();
    const renderer = getRenderer();
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
        leftGamepadPosition = localVector2.toArray(localArray);
        leftGamepadQuaternion = localQuaternion2.toArray(localArray2);

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
        rightGamepadPosition = localVector2.toArray(localArray3);
        rightGamepadQuaternion = localQuaternion2.toArray(localArray4);

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
    } else {
      localMatrix.copy(localPlayer.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);
    }

    const handOffsetScale = localPlayer ? localPlayer.avatar.height / 1.5 : 1;
    if (!leftGamepadPosition) {
      leftGamepadPosition = localVector2.copy(localVector)
        .add(localVector3.copy(leftHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
        .toArray();
      leftGamepadQuaternion = localQuaternion.toArray();
      leftGamepadPointer = 0;
      leftGamepadGrip = 0;
      leftGamepadEnabled = false;
    }
    if (!rightGamepadPosition) {
      rightGamepadPosition = localVector2.copy(localVector)
        .add(localVector3.copy(rightHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
        .toArray();
      rightGamepadQuaternion = localQuaternion.toArray();
      rightGamepadPointer = 0;
      rightGamepadGrip = 0;
      rightGamepadEnabled = false;
    }

    rigManager.setLocalAvatarPose([
      [localVector.toArray(), localQuaternion.toArray()],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
    ]);
  } */

  render(timestamp, timeDiff) {
    const renderer = getRenderer();
    frameEvent.data.now = timestamp;
    frameEvent.data.timeDiff = timeDiff;
    this.dispatchEvent(frameEvent);
    // frameEvent.data.lastTimestamp = timestamp;

    // equipment panel render
    // equipmentRender.previewScene.add(world.lights);
    // equipmentRender.render();

    getComposer().render();
    // if(ioManager.debugMode) {
    rendererStats.update(renderer);
    // }
  }

  startLoop() {
    const renderer = getRenderer();
    if (!renderer) {
      throw new Error('must bind canvas first');
    }

    let lastTimestamp = performance.now();

    const animate = (timestamp, frame) => {
      // console.log('animate');
      // window.totalTime = 0
      // window.count = 0

      if (window.isStart && window.blocks) { // mark: generate voxel map
        window.blocks.children.forEach((block, i) => {
          // if (i === 0) debugger;
          if (block._isCollide) {
            // if (block._haveNotCollided || block._isCollide) { // for _haveNotCollided
            // console.log(i);
            // physicsManager.collide(radius, halfHeight, p, q, maxIter)
            block.position.y += 0.1;
            block.updateMatrixWorld();
            block._isCollide = physicsManager.collide(0.5, 1, block.position, localQuaternion.set(0, 0, 0, 1), 1);
            // if (block._isCollide) block._haveNotCollided = false; // for _haveNotCollided
          }
        });
      }

      if (false && window.bodyPhysxs) {
        window.bodyPhysxs.forEach((body, i) => {
          physicsManager.getGlobalPosition(body, window.meshPhysxs[i].position);
          physicsManager.getGlobalQuaternion(body, window.meshPhysxs[i].quaternion);
          window.meshPhysxs[i].updateMatrixWorld();
        });
      }

      timestamp = timestamp ?? performance.now();
      const timeDiff = timestamp - lastTimestamp;
      const timeDiffS = timeDiff / 1000;
      const timeDiffCapped = Math.min(Math.max(timeDiff, 0), 100);
      const timeDiffSCapped = timeDiffCapped / 1000;
      // const timeDiffCapped = timeDiff;

      ioManager.update(timeDiffCapped);
      // this.injectRigInput();

      cameraManager.update(timeDiffCapped);

      const localPlayer = metaversefileApi.useLocalPlayer();
      if (this.contentLoaded) {
        // if(performance.now() - lastTimestamp < 1000/60) return; // There might be a better solution, we need to limit the simulate time otherwise there will be jitter at different FPS
        physicsManager.simulatePhysics(timeDiffCapped);
        localPlayer.updatePhysics(timestamp, timeDiffCapped);
      }

      lastTimestamp = timestamp;

      transformControls.update();
      game.update(timestamp, timeDiffCapped);

      localPlayer.updateAvatar(timestamp, timeDiffCapped);
      playersManager.update(timestamp, timeDiffCapped);

      world.appManager.tick(timestamp, timeDiffCapped, frame);

      hpManager.update(timestamp, timeDiffCapped);

      ioManager.updatePost();

      game.pushAppUpdates();
      game.pushPlayerUpdates();

      soundManager.update(timeDiffCapped);
      dioramaManager.update(timestamp, timeDiffCapped);

      const session = renderer.xr.getSession();
      const xrCamera = session ? renderer.xr.getCamera(camera) : camera;
      localMatrix.multiplyMatrices(xrCamera.projectionMatrix, /* localMatrix2.multiplyMatrices( */xrCamera.matrixWorldInverse/*, physx.worldContainer.matrixWorld) */);
      localMatrix3.copy(xrCamera.matrix)
        .premultiply(dolly.matrix)
        .decompose(localVector, localQuaternion, localVector2);

      if (false && window.isStart && window.body) { // physicsCube follow role
        localVector.subVectors(window.localPlayer.position, window.body.position);
        localVector.y = 0;
        // localVector.normalize();
        localVector.multiplyScalar(0.01);
        window.body.position.add(localVector);
        physicsManager.setTransform(window.body);
      }

      if (false && window.isInitTestPhysxMesh) {
        const speed = 3 * timeDiffSCapped; // todo: Why moveCharacterController's timeDiffSCapped/elapsedTime no effect? Need multiply here?
        const followDistance = 3;
        localVector.subVectors(window.localPlayer.position, window.meshPhysx.position);
        if (localVector.length() <= followDistance) {
          localVector.set(0, 0, 0);
        } else {
          localVector.normalize().multiplyScalar(speed);
        }
        localVector.y += -0.98;
        // localVector.normalize();
        // localVector.multiplyScalar(0.01);
        const minDist = 0;
        const flags = physicsManager.moveCharacterController(
          window.characterController,
          localVector,
          minDist,
          timeDiffSCapped,
          window.meshPhysx.position,
        );
        window.meshPhysx.updateMatrixWorld();
        // const collided = flags !== 0;
        const grounded = !!(flags & 0x1);
      }

      this.render(timestamp, timeDiffCapped);

      // window.domAverageTime.innerText = `${window.count} | ${window.totalTime / window.count}`
    };

    renderer.setAnimationLoop(animate);

    _startHacks();
  }
}

// import {MMDLoader} from 'three/examples/jsm/loaders/MMDLoader.js';
const _startHacks = () => {
  if (1) { // mark: generate voxel map
    window.meshPhysxs = [];
    const geometry = new THREE.BoxGeometry();
    geometry.scale(0.9, 0.9, 0.9);
    // geometry.translate(0, -0.7, 0);
    geometry.translate(0, -1.2, 0);
    // const geometry = new THREE.PlaneGeometry(0.7, 0.7);
    // geometry.rotateX(-Math.PI / 2);
    // geometry.translate(0, -0.5, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 'red',
      // transparent: true,
      // opacity: 0.7,
    });
    for (let z = -(height - 1) / 2; z < height / 2; z++) {
      for (let x = -(width - 1) / 2; x < width / 2; x++) {
        const block = new THREE.Mesh(geometry, materialIdle);
        window.blocks.add(block);
        block.position.set(x, -0.1, z);
        // block.position.set(x, 1.5, z); // for _haveNotCollided
        block.updateMatrixWorld();
        block._isCollide = true;
        // block._haveNotCollided = true; // for _haveNotCollided
        block.position.x = x
        block.position.z = z
        block._x = x
        block._z = z
        block._isAct = false
      }
    }

    // dest
    const dest = new THREE.Vector2(4, 6)
    const destBlock = getBlock(dest.x, dest.y)
    // const destBlock = getBlock(0, 0)
    destBlock._isDest = true
    destBlock.material = materialDest

    // start
    const start = new THREE.Vector2(-7, -5)
    const startBlock = getBlock(start.x, start.y)
    startBlock._isStart = true
    startBlock._isAct = true
    startBlock._priority = start.manhattanDistanceTo(dest)
    startBlock._costSoFar = 0
    window.frontiers.push(startBlock)
    startBlock.material = materialStart
  }

  if (0) {
    window.meshPhysxs = [];
    window.bodyPhysxs = [];
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({color: 'red'});
    for (let z = -10; z <= 10; z++) {
      for (let x = -10; x <= 10; x++) {
        const bodyPhysx = physicsManager.addBoxGeometry(new THREE.Vector3(x, 10, z), new THREE.Quaternion(), new THREE.Vector3(0.5, 0.5, 0.5), true);
        window.bodyPhysxs.push(bodyPhysx);

        const meshPhysx = new THREE.Mesh(geometry, material);
        window.meshPhysxs.push(meshPhysx);
        window.rootScene.add(meshPhysx);
      }
    }
  }
  setTimeout(() => {
    if (false && !window.isInitTestPhysxMesh) {
      window.isInitTestPhysxMesh = true;
      const geometry = new THREE.SphereGeometry(0.5);
      const material = new THREE.MeshStandardMaterial({
        color: 'green',
      });
      window.meshPhysx = new THREE.Mesh(geometry, material);
      rootScene.add(window.meshPhysx);
      // console.log(Math.random());
      // debugger

      window.meshPhysx.position.set(2, 2, 2);
      window.meshPhysx.updateMatrixWorld();

      const physicsMaterial = new THREE.Vector3(0, 0, 0);
      window.characterController = physicsManager.createCharacterController(
        0.5,
        0.01,
        0.1,
        0.5,
        window.meshPhysx.position,
        physicsMaterial,
      );
    }
  }, 3000);

  const localPlayer = metaversefileApi.useLocalPlayer();
  const vpdAnimations = Avatar.getAnimations().filter(animation => animation.name.endsWith('.vpd'));

  let playerDiorama = null;
  let appDiorama = null;
  const lastEmoteKey = {
    key: -1,
    timestamp: 0,
  };
  let emoteIndex = -1;
  let poseAnimationIndex = -1;
  const _emoteKey = key => {
    const timestamp = performance.now();
    if ((timestamp - lastEmoteKey.timestamp) < 1000) {
      const key1 = lastEmoteKey.key;
      const key2 = key;
      emoteIndex = (key1 * 10) + key2;

      lastEmoteKey.key = -1;
      lastEmoteKey.timestamp = 0;
    } else {
      lastEmoteKey.key = key;
      lastEmoteKey.timestamp = timestamp;
    }
  };
  const _updateEmote = () => {
    localPlayer.removeAction('emote');
    if (emoteIndex !== -1) {
      const emoteAction = {
        type: 'emote',
        index: emoteIndex,
      };
      localPlayer.addAction(emoteAction);
    }
  };
  const _updatePoseAnimation = () => {
    localPlayer.removeAction('pose');
    if (poseAnimationIndex !== -1) {
      const animation = vpdAnimations[poseAnimationIndex];
      const poseAction = {
        type: 'pose',
        animation: animation.name,
      };
      localPlayer.addAction(poseAction);
    }
  };
  /* let mikuModel = null;
  let mikuLoaded = false;
  const _ensureMikuModel = () => {
    if (!mikuLoaded) {
      mikuLoaded = true;

      const mmdLoader = new MMDLoader();
      mmdLoader.load(
        // path to PMD/PMX file
        '/avatars/Miku_Hatsune_Ver2.pmd',
        function(mesh) {
          mikuModel = mesh;
          mikuModel.position.set(0, 0, 0);
          mikuModel.scale.setScalar(0.07);
          mikuModel.updateMatrixWorld();
          scene.add(mikuModel);

          _updateMikuModel();
        },
        // called when loading is in progresses
        function (xhr) {
          // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function(error) {
          console.warn('An error happened', error);
        }
      );
    }
  };
  const _updateMikuModel = () => {
    if (mikuModel) {
      const animation = vpdAnimations[poseAnimationIndex];

      const _getBone = name => mikuModel.skeleton.bones.find(b => b.name === name);
      const mmdBones = {
        // Root: _getBone('センター'), // deliberately excluded

        mixamorigHips: _getBone('下半身'),
        // mixamorigSpine: _makeFakeBone(), // not present in mmd
        mixamorigSpine1: _getBone('上半身'),
        // mixamorigSpine2: _makeFakeBone(), // not present in mmd
        mixamorigNeck: _getBone('首'),
        mixamorigHead: _getBone('頭'),
        // Eye_L: _getBone('左目'), // deliberately excluded
        // Eye_R: _getBone('右目'), // deliberately excluded

        mixamorigLeftShoulder: _getBone('左肩'),
        mixamorigLeftArm: _getBone('左腕'),
        mixamorigLeftForeArm: _getBone('左ひじ'),
        mixamorigLeftHand: _getBone('左手首'),
        mixamorigLeftHandThumb2: _getBone('左親指２'),
        mixamorigLeftHandThumb1: _getBone('左親指１'),
        // mixamorigLeftHandThumb0: _makeFakeBone(), // not present in mmd
        mixamorigLeftHandIndex3: _getBone('左人指３'),
        mixamorigLeftHandIndex2: _getBone('左人指２'),
        mixamorigLeftHandIndex1: _getBone('左人指１'),
        mixamorigLeftHandMiddle3: _getBone('左中指３'),
        mixamorigLeftHandMiddle2: _getBone('左中指２'),
        mixamorigLeftHandMiddle1: _getBone('左中指１'),
        mixamorigLeftHandRing3: _getBone('左薬指３'),
        mixamorigLeftHandRing2: _getBone('左薬指２'),
        mixamorigLeftHandRing1: _getBone('左薬指１'),
        mixamorigLeftHandPinky3: _getBone('左小指３'),
        mixamorigLeftHandPinky2: _getBone('左小指２'),
        mixamorigLeftHandPinky1: _getBone('左小指１'),
        mixamorigLeftUpLeg: _getBone('左足'),
        mixamorigLeftLeg: _getBone('左ひざ'),
        mixamorigLeftFoot: _getBone('左足首'),

        mixamorigRightShoulder: _getBone('右肩'),
        mixamorigRightArm: _getBone('右腕'),
        mixamorigRightForeArm: _getBone('右ひじ'),
        mixamorigRightHand: _getBone('右手首'),
        mixamorigRightHandThumb2: _getBone('右親指２'),
        mixamorigRightHandThumb1: _getBone('右親指１'),
        // mixamorigRightHandThumb0: _makeFakeBone(), // not present in mmd
        mixamorigRightHandIndex3: _getBone('右人指３'),
        mixamorigRightHandIndex2: _getBone('右人指２'),
        mixamorigRightHandIndex1: _getBone('右人指１'),
        mixamorigRightHandMiddle3: _getBone('右中指３'),
        mixamorigRightHandMiddle2: _getBone('右中指２'),
        mixamorigRightHandMiddle1: _getBone('右中指１'),
        mixamorigRightHandRing3: _getBone('右薬指３'),
        mixamorigRightHandRing2: _getBone('右薬指２'),
        mixamorigRightHandRing1: _getBone('右薬指１'),
        mixamorigRightHandPinky3: _getBone('右小指３'),
        mixamorigRightHandPinky2: _getBone('右小指２'),
        mixamorigRightHandPinky1: _getBone('右小指１'),
        mixamorigRightUpLeg: _getBone('右足'),
        mixamorigRightLeg: _getBone('右ひざ'),
        mixamorigRightFoot: _getBone('右足首'),
        mixamorigLeftToeBase: _getBone('左つま先'),
        mixamorigRightToeBase: _getBone('右つま先'),
      };

      for (const k in animation.interpolants) {
        const match = k.match(/^([\s\S]+?)\.(position|quaternion)$/);
        const boneName = match[1];
        const isPosition = match[2] === 'position';

        const bone = mmdBones[boneName];
        if (bone) {
          const src = animation.interpolants[k];
          const v = src.evaluate(0);
          if (isPosition) {
            // bone.position.fromArray(v);
          } else {
            bone.quaternion.fromArray(v);
          }
        }
      }
      mikuModel.updateMatrixWorld();
    }
  }; */
  window.addEventListener('keydown', e => {
    if (e.which === 219) { // [
      if (localPlayer.avatar) {
        (async () => {
          const audioUrl = '/sounds/vocals.mp3';
          const audioUrl2 = '/sounds/music.mp3';

          const _loadAudio = u => new Promise((accept, reject) => {
            const audio = new Audio(u);
            audio.addEventListener('canplaythrough', async e => {
              accept(audio);
            }, {once: true});
            audio.addEventListener('error', e => {
              reject(e);
            });
            // audio.play();
            // audioContext.resume();
          });

          const audios = await Promise.all([
            _loadAudio(audioUrl),
            _loadAudio(audioUrl2),
          ]);
          localPlayer.avatar.say(audios[0]);
          await localPlayer.avatar.microphoneWorker.waitForLoad();

          audios[0].play();
          audios[1].play();

          audios[0].addEventListener('ended', e => {
            localPlayer.avatar.setMicrophoneMediaStream(null);
          });
        })();
      }
    } else if (e.which === 221) { // ]
      const localPlayer = metaversefileApi.useLocalPlayer();
      if (localPlayer.avatar) {
        if (!playerDiorama) {
          playerDiorama = dioramaManager.createPlayerDiorama(localPlayer, {
            label: true,
            outline: true,
            lightningBackground: true,
          });
        } else {
          playerDiorama.destroy();
          playerDiorama = null;
        }
      }
    } else if (e.which === 220) { // \\
      const targetApp = (() => {
        const worldApps = world.appManager.getApps();
        const swordApp = worldApps.find(a => /sword/i.test(a.contentId));
        if (swordApp) {
          return swordApp;
        } else {
          const wearAction = localPlayer.getAction('wear');
          if (wearAction) {
            const app = localPlayer.appManager.getAppByInstanceId(wearAction.instanceId);
            return app;
          } else {
            return null;
          }
        }
      })();

      if (!appDiorama) {
        if (targetApp) {
          appDiorama = dioramaManager.createAppDiorama(targetApp, {
            // canvas,
            // label: true,
            outline: true,
            radialBackground: true,
          });
        } else {
          console.warn('no target app');
        }
      } else {
        appDiorama.destroy();
        appDiorama = null;
      }
    } else if (e.which === 46) { // .
      emoteIndex = -1;
      _updateEmote();
    } else if (e.which === 107) { // +
      poseAnimationIndex++;
      poseAnimationIndex = Math.min(Math.max(poseAnimationIndex, -1), vpdAnimations.length - 1);
      _updatePoseAnimation();

      // _ensureMikuModel();
      // _updateMikuModel();
    } else if (e.which === 109) { // -
      poseAnimationIndex--;
      poseAnimationIndex = Math.min(Math.max(poseAnimationIndex, -1), vpdAnimations.length - 1);
      _updatePoseAnimation();

      // _ensureMikuModel();
      // _updateMikuModel();
    } else {
      const match = e.code.match(/^Numpad([0-9])$/);
      if (match) {
        const key = parseInt(match[1], 10);
        _emoteKey(key);
        _updateEmote();
      }
    }
  });
};
