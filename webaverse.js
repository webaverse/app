/*
this file bootstraps the webaverse engine.
it uses the help of various managers and stores, and executes the render loop.
*/

import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import * as sounds from './sounds.js';
import physx from './physx.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as blockchain from './blockchain.js';
import cameraManager from './camera-manager.js';
import game from './game.js';
import hpManager from './hp-manager.js';
import {playersManager} from './players-manager.js';
import minimapManager from './minimap.js';
import postProcessing from './post-processing.js';
import particleSystemManager from './particle-system.js';
import loadoutManager from './loadout-manager.js';
import questManager from './quest-manager.js';
import mobManager from './mob-manager.js';
import {
  getRenderer,
  scene,
  sceneHighPriority,
  sceneLowPriority,
  rootScene,
  camera,
  dolly,
  bindCanvas,
  getComposer,
} from './renderer.js';
import * as audioManager from './audio-manager.js';
import transformControls from './transform-controls.js';
import * as metaverseModules from './metaverse-modules.js';
import dioramaManager from './diorama.js';
import * as voices from './voices.js';
import performanceTracker from './performance-tracker.js';
import renderSettingsManager from './rendersettings-manager.js';
import metaversefileApi from 'metaversefile';
import WebaWallet from './src/components/wallet.js';
import musicManager from './music-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

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

export default class Webaverse extends EventTarget {
  constructor() {
    super();

    this.loadPromise = (async () => {
      await Promise.all([
        physx.waitForLoad(),
        Avatar.waitForLoad(),
        audioManager.waitForLoad(),
        sounds.waitForLoad(),
        particleSystemManager.waitForLoad(),
        transformControls.waitForLoad(),
        metaverseModules.waitForLoad(),
        voices.waitForLoad(),
        musicManager.waitForLoad(),
        WebaWallet.waitForLoad(),
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
    game.bindDioramaCanvas();
    
    postProcessing.bindCanvas();
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
  async enterXr() {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    if (session === null) {
      let session = null;
      try {
        session = await navigator.xr.requestSession(sessionMode, sessionOpts);
      } catch(err) {
        try {
          session = await navigator.xr.requestSession(sessionMode);
        } catch(err) {
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
    // console.log('frame 1');

    const renderer = getRenderer();
    frameEvent.data.now = timestamp;
    frameEvent.data.timeDiff = timeDiff;
    this.dispatchEvent(frameEvent);

    getComposer().render();

    this.dispatchEvent(new MessageEvent('frameend', {
      data: {
        canvas: renderer.domElement,
        context: renderer.getContext(),
      }
    }));

    // console.log('frame 2');
  }
  
  startLoop() {
    const renderer = getRenderer();
    if (!renderer) {
      throw new Error('must bind canvas first');
    }
    
    let lastTimestamp = performance.now();
    const animate = (timestamp, frame) => {
      performanceTracker.startFrame();

      const _frame = () => {
        timestamp = timestamp ?? performance.now();
        const timeDiff = timestamp - lastTimestamp;
        const timeDiffCapped = Math.min(Math.max(timeDiff, 0), 100);

        performanceTracker.setGpuPrefix('pre');
        const _pre = () => {
          ioManager.update(timeDiffCapped);
          // this.injectRigInput();
          
          const localPlayer = metaversefileApi.useLocalPlayer();
          if (this.contentLoaded && physicsManager.getPhysicsEnabled()) {
            physicsManager.simulatePhysics(timeDiffCapped);
            localPlayer.updatePhysics(timestamp, timeDiffCapped);
          }

          transformControls.update();
          game.update(timestamp, timeDiffCapped);
          
          localPlayer.updateAvatar(timestamp, timeDiffCapped);
          playersManager.updateRemotePlayers(timestamp, timeDiffCapped);
          
          world.appManager.tick(timestamp, timeDiffCapped, frame);

          mobManager.update(timestamp, timeDiffCapped);
          hpManager.update(timestamp, timeDiffCapped);
          questManager.update(timestamp, timeDiffCapped);
          particleSystemManager.update(timestamp, timeDiffCapped);

          cameraManager.updatePost(timestamp, timeDiffCapped);
          ioManager.updatePost();

          game.pushAppUpdates();
          game.pushPlayerUpdates();

          const session = renderer.xr.getSession();
          const xrCamera = session ? renderer.xr.getCamera(camera) : camera;
          localMatrix.multiplyMatrices(xrCamera.projectionMatrix, /*localMatrix2.multiplyMatrices(*/xrCamera.matrixWorldInverse/*, physx.worldContainer.matrixWorld)*/);
          localMatrix2.copy(xrCamera.matrix)
            .premultiply(dolly.matrix)
            .decompose(localVector, localQuaternion, localVector2);
          
          lastTimestamp = timestamp;
        };
        _pre();

        // render scenes
        performanceTracker.setGpuPrefix('diorama');
        dioramaManager.update(timestamp, timeDiffCapped);
        performanceTracker.setGpuPrefix('minimap');
        minimapManager.update(timestamp, timeDiffCapped);
        performanceTracker.setGpuPrefix('loadout');
        loadoutManager.update(timestamp, timeDiffCapped);

        {
          const popRenderSettings = renderSettingsManager.push(rootScene, undefined, {
            postProcessing,
          });

          performanceTracker.setGpuPrefix('');
          this.render(timestamp, timeDiffCapped);

          popRenderSettings();
        }
      };
      _frame();

      performanceTracker.endFrame();
    }
    renderer.setAnimationLoop(animate);

    _startHacks(this);
  }
}

// import {MMDLoader} from 'three/examples/jsm/loaders/MMDLoader.js';
const _startHacks = webaverse => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  const vpdAnimations = Avatar.getAnimations().filter(animation => animation.name.endsWith('.vpd'));

  // let playerDiorama = null;
  const lastEmotionKey = {
    key: -1,
    timestamp: 0,
  };
  let emotionIndex = -1;
  let poseAnimationIndex = -1;
  const _emotionKey = key => {
    const timestamp = performance.now();
    if ((timestamp - lastEmotionKey.timestamp) < 1000) {
      const key1 = lastEmotionKey.key;
      const key2 = key;
      emotionIndex = (key1 * 10) + key2;
      
      lastEmotionKey.key = -1;
      lastEmotionKey.timestamp = 0;
    } else {
      lastEmotionKey.key = key;
      lastEmotionKey.timestamp = timestamp;
    }
  };
  const _updateFacePose = () => {
    const oldFacePoseActionIndex = localPlayer.findActionIndex(action => action.type === 'facepose' && /^emotion-/.test(action.emotion));
    if (oldFacePoseActionIndex !== -1) {
      localPlayer.removeActionIndex(oldFacePoseActionIndex);
    }
    if (emotionIndex !== -1) {
      const emoteAction = {
        type: 'facepose',
        emotion: `emotion-${emotionIndex}`,
        value: 1,
      };
      localPlayer.addAction(emoteAction);
    }
  };
  const _updatePose = () => {
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
  webaverse.titleCardHack = false;
  let haloMeshApp = null;
  window.addEventListener('keydown', e => {
    if (e.which === 46) { // .
      emotionIndex = -1;
      _updateFacePose();
    } else if (e.which === 107) { // +
      poseAnimationIndex++;
      poseAnimationIndex = Math.min(Math.max(poseAnimationIndex, -1), vpdAnimations.length - 1);
      _updatePose();
    
      // _ensureMikuModel();
      // _updateMikuModel();
    } else if (e.which === 109) { // -
      poseAnimationIndex--;
      poseAnimationIndex = Math.min(Math.max(poseAnimationIndex, -1), vpdAnimations.length - 1);
      _updatePose();

      // _ensureMikuModel();
      // _updateMikuModel();
    } else if (e.which === 106) { // *
      webaverse.titleCardHack = !webaverse.titleCardHack;
      webaverse.dispatchEvent(new MessageEvent('titlecardhackchange', {
        data: {
          titleCardHack: webaverse.titleCardHack,
        }
      }));
    } else {
      const match = e.code.match(/^Numpad([0-9])$/);
      if (match) {
        const key = parseInt(match[1], 10);
        _emotionKey(key);
        _updateFacePose();
      }
    }
  });
};