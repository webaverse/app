/*
this file bootraps the entire webaverse application.
it uses the help of various managers and stores, and executes the render loop.
*/

import * as THREE from 'three';
// import {loginManager} from './login.js';
// import runtime from './runtime.js';
import {parseQuery, downloadFile} from './util.js';
import {rigManager} from './rig.js';
// import {rigAuxManager} from './rig-aux.js';
import Avatar from './avatars/avatars.js';
import geometryManager from './geometry-manager.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as universe from './universe.js';
import * as blockchain from './blockchain.js';
// import minimap from './minimap.js';
import cameraManager from './camera-manager.js';
// import controlsManager from './controls-manager.js';
import game from './game.js';
import hpManager from './hp-manager.js';
// import activateManager from './activate-manager.js';
// import dropManager from './drop-manager.js';
// import npcManager from './npc-manager.js';
import equipmentRender from './equipment-render.js';
// import {bindInterface as inventoryBindInterface} from './inventory.js';
// import fx from './fx.js';
import {getExt} from './util.js';
import {storageHost, tokensHost} from './constants.js';
// import './procgen.js';
import {getRenderer, scene, orthographicScene, avatarScene, camera, orthographicCamera, avatarCamera, dolly, /*orbitControls, renderer2,*/ sceneHighPriority, sceneLowPriority, bindCanvas} from './app-object.js';
// import {mithrilInit} from './mithril-ui/index.js'
// import TransformGizmo from './TransformGizmo.js';
// import WSRTC from 'wsrtc/wsrtc.js';
import transformControls from './transform-controls.js';
import * as metaverseModules from './metaverse-modules.js';

const {appManager} = world;

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

const frameEvent = (() => {
  const now = Date.now();
  return new MessageEvent('frame', {
    data: {
      now,
      timeDiff: 0,
      lastTimestamp: now,
    },
  });
})();

export default class Webaverse extends EventTarget {
  constructor() {
    super();

    this.loadPromise = Promise.all([
      geometryManager.waitForLoad(),
      Avatar.waitForLoad(),
      transformControls.waitForLoad(),
      // WSRTC.waitForReady(),
      metaverseModules.waitForLoad(),
    ])
      /* .then(() => {
        runtime.injectDependencies(geometryManager, physicsManager, world);
      }); */
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
  /* bindLogin() {
    loginManager.bindLogin();
  } */
  bindInput() {
    ioManager.bindInput();
    world.bindInput();
  }
  bindInterface() {
    ioManager.bindInterface();
    blockchain.bindInterface();
    // universe.bindInterface();
    // weaponsManager.bindInterface();
    // inventoryBindInterface();
    // mithrilInit();
  }
  bindPhysics() {
    weaponsManager.bindPhysics();
  }
  /* bindUploadFileInput(uploadFileInput) {
    weaponsManager.bindUploadFileInput(uploadFileInput);
  } */
  /* bindMinimap(mapCanvas) {
    minimap.init(mapCanvas);
  } */
  /* bindXrButton({
    enterXrButton,
    // noXrButton,
    onSupported,
  }) {
    enterXrButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.enterXr();
    });
    (async () => {
      const ok = await this.isXrSupported();
      onSupported(ok);
    })();
  } */
  bindCanvas(c) {
    bindCanvas(c);
  }
  bindPreviewCanvas(previewCanvas) {
    equipmentRender.bindPreviewCanvas(previewCanvas);
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
  
  render() {
    const now = Date.now();
    frameEvent.data.now = now;
    frameEvent.data.timeDiff = now - frameEvent.data.lastTimestamp;
    this.dispatchEvent(frameEvent);
    frameEvent.data.lastTimestamp = now;

    // high priority render
    sceneHighPriority.add(world.lights);
    const renderer = getRenderer();
    renderer.clear();
    renderer.render(sceneHighPriority, camera);

    // main render
    scene.add(world.lights);
    if (rigManager.localRig) {
      scene.add(rigManager.localRig.model);
      rigManager.localRig.model.visible = false;
    }
    renderer.render(scene, camera);

    // orthographic render
    orthographicScene.add(world.lights);
    renderer.render(orthographicScene, orthographicCamera);
    
    // low priority render
    sceneLowPriority.add(world.lights);
    renderer.render(sceneLowPriority, camera);
    
    // equipment panel render
    equipmentRender.previewScene.add(world.lights);
    equipmentRender.render();
    
    // decapitate avatar if needed
    if (rigManager.localRig) {
      rigManager.localRig.model.visible = true;
      avatarScene.add(rigManager.localRig.model);
      const decapitated = /* controlsManager.isPossessed() && */ (/^(?:camera|firstperson)$/.test(cameraManager.getMode()) || !!renderer.xr.getSession());
      if (decapitated) {
        rigManager.localRig.decapitate();
        // rigManager.localRig.aux.decapitate();
      } else {
        rigManager.localRig.undecapitate();
        // rigManager.localRig.aux.undecapitate();
      }
      renderer.render(avatarScene, camera);
      if (decapitated) {
        rigManager.localRig.undecapitate();
        // rigManager.localRig.aux.undecapitate();
      }
    }
    // highlight render
    // renderer.render(highlightScene, camera);
  }
  /* renderMinimap() {
    minimap.update();
  } */
  /* renderDom() {
    // dom render
    renderer2.render(scene2, camera);
  } */

  /* async setAvatarUrl(url, ext) {
    if (url) {
      await rigManager.setLocalAvatarUrl(url, ext);
      const cameraOffset = cameraManager.getCameraOffset();
      cameraOffset.z = 0;
    }
    controlsManager.setPossessed(!!url);
  }
  setPossessed(possessed) {
    controlsManager.setPossessed(possessed);
  }
  async possess(object) {
    await cameraManager.requestPointerLock();

    weaponsManager.setMouseHoverObject(null);
    weaponsManager.setMouseSelectedObject(null);

    const {contentId} = object;
    if (typeof contentId === 'number') {
      const res = await fetch(`${tokensHost}/${contentId}`);
      const j = await res.json();
      const {hash, name, ext} = j;
      const u = `${storageHost}/ipfs/${hash}`;
      await this.setAvatarUrl(u, ext);
    } else if (typeof contentId === 'string') {
      const ext = getExt(contentId);
      await this.setAvatarUrl(contentId, ext);
    }
    const targetVector = localVector.copy(object.position)
      .add(localVector2.set(0, physicsManager.getAvatarHeight()/2, 0));
    camera.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        camera.position,
        targetVector,
        localVector2.set(0, 1, 0)
      )
    );
    const distance = camera.position.distanceTo(targetVector);
    
    const offset = cameraManager.getCameraOffset();
    offset.set(0, 0, -distance);

    camera.position.copy(targetVector)
      .sub(localVector2.copy(offset).applyQuaternion(camera.quaternion));
    camera.updateMatrixWorld();
    
    rigManager.setLocalRigMatrix(
      localMatrix.compose(
        targetVector,
        camera.quaternion,
        localVector2.set(1, 1, 1)
      )
    );
  } */
  
  startLoop() {
    const renderer = getRenderer();
    if (!renderer) {
      throw new Error('must bind canvas first');
    }
    
    let lastTimestamp = performance.now();
    const startTime = Date.now();
    const animate = (timestamp, frame) => {      
      timestamp = timestamp || performance.now();
      const timeDiff = timestamp - lastTimestamp;
      const timeDiffCapped = Math.min(Math.max(timeDiff, 5), 100);
      lastTimestamp = timestamp;

      const session = renderer.xr.getSession();
      const now = Date.now();
      
      appManager.pretick(timestamp, frame);

      ioManager.update(timeDiffCapped);
      // universe.update();
      if (this.contentLoaded) {
        // if (controlsManager.isPossessed()) {
          physicsManager.update(timeDiffCapped);
        // }
        physicsManager.simulatePhysics(timeDiffCapped);
      }

      const _updateRig = () => {
        let leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled;
        let rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled;

        if (rigManager.localRigMatrixEnabled) {
          localMatrix.copy(rigManager.localRigMatrix);
        } else {
          localMatrix.copy(camera.matrixWorld);
        }
        localMatrix
          .decompose(localVector, localQuaternion, localVector2);

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
        }

        const handOffsetScale = rigManager.localRig ? rigManager.localRig.height / 1.5 : 1;
        if (!leftGamepadPosition) {
          // if (!physicsManager.getGlideState()) {
            leftGamepadPosition = localVector2.copy(localVector)
              .add(localVector3.copy(leftHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
              .toArray();
            leftGamepadQuaternion = localQuaternion.toArray();
          /* } else {
            leftGamepadPosition = localVector2.copy(localVector)
              .add(localVector3.copy(leftHandGlideOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
              .toArray();
            leftGamepadQuaternion = localQuaternion2.copy(localQuaternion)
              .premultiply(leftHandGlideQuaternion)
              .toArray();
          } */
          leftGamepadPointer = 0;
          leftGamepadGrip = 0;
          leftGamepadEnabled = false;
        }
        if (!rightGamepadPosition) {
          // if (!physicsManager.getGlideState()) {
            rightGamepadPosition = localVector2.copy(localVector)
              .add(localVector3.copy(rightHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
              .toArray();
            rightGamepadQuaternion = localQuaternion.toArray();
          /* } else {
            rightGamepadPosition = localVector2.copy(localVector)
              .add(localVector3.copy(rightHandGlideOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion))
              .toArray();
            rightGamepadQuaternion = localQuaternion2.copy(localQuaternion)
              .premultiply(rightHandGlideQuaternion)
              .toArray();
          } */
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

      transformControls.update();
      game.update(timestamp);
      hpManager.update(timestamp, timeDiffCapped);

      appManager.tick(timestamp, frame);

      ioManager.updatePost();
      
      game.pushAppUpdates();

      const xrCamera = session ? renderer.xr.getCamera(camera) : camera;
      localMatrix.multiplyMatrices(xrCamera.projectionMatrix, localMatrix2.multiplyMatrices(xrCamera.matrixWorldInverse, geometryManager.worldContainer.matrixWorld));
      localMatrix3.copy(xrCamera.matrix)
        .premultiply(dolly.matrix)
        .decompose(localVector, localQuaternion, localVector2);

      this.render();
      // this.renderMinimap();
      // this.renderDom();
    }
    renderer.setAnimationLoop(animate);
  }
}
