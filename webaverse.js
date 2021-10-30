/*
this file bootraps the webaverse engine.
it uses the help of various managers and stores, and executes the render loop.
*/

import * as THREE from 'three';
import {Pass} from 'three/examples/jsm/postprocessing/Pass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {AdaptiveToneMappingPass} from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass.js';
// import {BloomPass} from 'three/examples/jsm/postprocessing/BloomPass.js';
// import {AfterimagePass} from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import {BokehPass} from 'three/examples/jsm/postprocessing/BokehPass.js';
import {SSAOPass} from './SSAOPass.js';
import {rigManager} from './rig.js';
import Avatar from './avatars/avatars.js';
import physx from './physx.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as blockchain from './blockchain.js';
import cameraManager from './camera-manager.js';
import game from './game.js';
import hpManager from './hp-manager.js';
import equipmentRender from './equipment-render.js';
import * as characterController from './character-controller.js';
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
import transformControls from './transform-controls.js';
import * as metaverseModules from './metaverse-modules.js';
import {parseQuery} from './util.js';

const leftHandOffset = new THREE.Vector3(0.2, -0.2, -0.4);
const rightHandOffset = new THREE.Vector3(-0.2, -0.2, -0.4);

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
const hqDefault = parseQuery(window.location.search)['hq'] === '1';

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

class WebaversePass extends Pass {
  constructor(internalRenderPass) {
    super();

    this.needsSwap = true;
    this.clear = true;

    this.internalRenderPass = internalRenderPass;
  }
  render(renderer, renderTarget, readBuffer, deltaTime, maskActive) {
    // ensure lights attached
    scene.add(world.lights);
    
    // decapitate avatar if needed
    const decapitated = /* controlsManager.isPossessed() && */ (/^(?:camera|firstperson)$/.test(cameraManager.getMode()) || !!renderer.xr.getSession());
    if (rigManager.localRig) {
      scene.add(rigManager.localRig.model);
      if (decapitated) {
        rigManager.localRig.decapitate();
        // rigManager.localRig.aux.decapitate();
      } else {
        rigManager.localRig.undecapitate();
        // rigManager.localRig.aux.undecapitate();
      }
    }
    
    // render
    sceneHighPriority.traverse(o => {
      o.isLowPriority = false;
    });
    scene.traverse(o => {
      o.isLowPriority = false;
    });
    sceneLowPriority.traverse(o => {
      o.isLowPriority = true;
    });
    if (this.internalRenderPass) {
      this.internalRenderPass.renderToScreen = this.renderToScreen;
      this.internalRenderPass.render(renderer, renderTarget, readBuffer, deltaTime, maskActive);
    } else {
      renderer.setRenderTarget(renderTarget);
      renderer.clear();
      renderer.render(rootScene, camera);
    }
    
    // undecapitate
    if (rigManager.localRig) {
      if (decapitated) {
        rigManager.localRig.undecapitate();
        // rigManager.localRig.aux.undecapitate();
      }
    }
  }
}

export default class Webaverse extends EventTarget {
  constructor() {
    super();

    this.loadPromise = Promise.all([
      physx.waitForLoad(),
      Avatar.waitForLoad(),
      transformControls.waitForLoad(),
      // WSRTC.waitForReady(),
      metaverseModules.waitForLoad(),
    ])
      /* .then(() => {
        runtime.injectDependencies(physx, physicsManager, world);
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
  bindInput() {
    ioManager.bindInput();
    world.bindInput();
  }
  bindInterface() {
    ioManager.bindInterface();
    blockchain.bindInterface();
  }
  bindCanvas(c) {
    bindCanvas(c);
    
    const renderer = getRenderer();
    const size = renderer.getSize(new THREE.Vector2())
      .multiplyScalar(renderer.getPixelRatio());  

    // const context = renderer.getContext();
    // context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);

    const composer = getComposer();
    const internalRenderPass = new SSAOPass(rootScene, camera, size.x, size.y);
    internalRenderPass.kernelRadius = 16;
    internalRenderPass.minDistance = 0.005;
    internalRenderPass.maxDistance = 0.1;
    // internalRenderPass.output = SSAOPass.OUTPUT.SSAO;
    const webaversePass = new WebaversePass(hqDefault ? internalRenderPass : null);
    composer.addPass(webaversePass);
    
    /* const ssaoPass = new SSAOPass(scene, camera, size.x, size.y);
    ssaoPass.kernelRadius = 16;
    ssaoPass.output = SSAOPass.OUTPUT.Beauty;
    ssaoPass.needsSwap = true;
    ssaoPass.clear = true;
    composer.addPass(ssaoPass); */
    
    const bokehPass = new BokehPass(rootScene, camera, {
      focus: 3.0,
      aperture: 0.00002,
      maxblur: 0.005,
      width: size.x,
      height: size.y,
    });
    bokehPass.needsSwap = true;
    bokehPass.enabled = hqDefault;
    composer.addPass(bokehPass);
    
    /* const afterimagePass = new AfterimagePass();
    afterimagePass.uniforms['damp'].value = 0.6;
    afterimagePass.enabled = false;
    composer.addPass(afterimagePass); */
    
    const adaptToneMappingPass = new AdaptiveToneMappingPass(/*adaptive = */true, /* resolution = */256);
    // adaptToneMappingPass.needsSwap = true;
    adaptToneMappingPass.setAdaptionRate(100);
    adaptToneMappingPass.setMaxLuminance(10);
    adaptToneMappingPass.setMinLuminance(0);
    adaptToneMappingPass.setMiddleGrey(3);
    adaptToneMappingPass.enabled = hqDefault;
    // adaptToneMappingPass.copyUniforms["opacity"].value = 0.5;
    composer.addPass(adaptToneMappingPass);
    
    /* const darkenPass = new ShaderPass({
      uniforms: {
        tDiffuse: {
          value: null,
        },
      },
      vertexShader: `\
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `\
        vec3 pow2(vec3 c, float f) {
          return vec3(c.r*f, c.g*f, c.b*f);
        }
      
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(tDiffuse, vUv);
          // c = LinearTosRGB(c);
          // c = sRGBToLinear(c);
          // c.rgb = pow2(c.rgb, 0.7);
          // c.rgb *= 0.5;
          // c.a = 1.;
          gl_FragColor = c;
        }
      `,
    });
    darkenPass.enabled = false;  
    composer.addPass(darkenPass); */
    
    // const bloomPass = new BloomPass(/*strength = */1, /*kernelSize = */15, /*sigma = */4, /*resolution = */256);
    // adaptToneMappingPass.needsSwap = true;
    // bloomPass.copyUniforms["opacity"].value = 0.5;
    // bloomPass.enabled = false;
    // composer.addPass(bloomPass);
    
    const resolution = size;
    const strength = 0.2;
    const radius = 0.5;
    const threshold = 0.8;
    const unrealBloomPass = new UnrealBloomPass(resolution, strength, radius, threshold);
    // unrealBloomPass.threshold = params.bloomThreshold;
    // unrealBloomPass.strength = params.bloomStrength;
    // unrealBloomPass.radius = params.bloomRadius;
    // unrealBloomPass.copyUniforms['opacity'].value = 0.5;
    unrealBloomPass.enabled = hqDefault;
    composer.addPass(unrealBloomPass);
    
    const colorPass = new ShaderPass({
      uniforms: {
        tDiffuse: {
          value: null,
        },
      },
      vertexShader: `\
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `\
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(tDiffuse, vUv);
          c = LinearTosRGB(c);
          // c = sRGBToLinear(c);
          // c.rgb = pow2(c.rgb, 0.8);
          // c.a = 1.;
          gl_FragColor = c;
        }
      `,
    });
    // colorPass.enabled = false;
    composer.addPass(colorPass);

    document.addEventListener('keydown', (event) => { // XXX move to io manager
      if (event.key === 'h') {
        webaversePass.internalRenderPass = webaversePass.internalRenderPass ? null : internalRenderPass;
      } else if (event.key === 'j') {
        bokehPass.enabled = !bokehPass.enabled;
      } else if (event.key === 'k') {
        adaptToneMappingPass.enabled = !adaptToneMappingPass.enabled;
      } else if (event.key === 'l') {
        unrealBloomPass.enabled = !unrealBloomPass.enabled;
      }
    });
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
  
  injectRigInput() {
    let leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled;
    let rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled;

    if (rigManager.localRigMatrixEnabled) {
      localMatrix.copy(rigManager.localRigMatrix);
    } else {
      localMatrix.copy(camera.matrixWorld);
    }
    localMatrix
      .decompose(localVector, localQuaternion, localVector2);

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
  }
  
  render(timestamp, timeDiff) {
    frameEvent.data.now = timestamp;
    frameEvent.data.timeDiff = timeDiff;
    this.dispatchEvent(frameEvent);
    frameEvent.data.lastTimestamp = timestamp;
    
    // equipment panel render
    equipmentRender.previewScene.add(world.lights);
    equipmentRender.render();

    getComposer().render();
  }
  
  startLoop() {
    const renderer = getRenderer();
    if (!renderer) {
      throw new Error('must bind canvas first');
    }
    
    let lastTimestamp = performance.now();
    const animate = (timestamp, frame) => {      
      timestamp = timestamp || performance.now();
      const timeDiff = timestamp - lastTimestamp;
      const timeDiffCapped = Math.min(Math.max(timeDiff, 0), 100);
      lastTimestamp = timestamp;

      // const now = Date.now();
      
      world.appManager.pretick(timestamp, frame);

      ioManager.update(timeDiffCapped);
      cameraManager.update(timeDiffCapped);
      
      // universe.update();
      if (this.contentLoaded) {
        // if (controlsManager.isPossessed()) {
          physicsManager.update(timeDiffCapped);
        // }
        physicsManager.simulatePhysics(timeDiffCapped);
      }
      
      characterController.update(timeDiffCapped);

      this.injectRigInput();

      transformControls.update();
      game.update(timestamp, timeDiffCapped);
      
      rigManager.update();

      world.appManager.tick(timestamp, frame);
      hpManager.update(timestamp, timeDiffCapped);

      ioManager.updatePost();
      
      game.pushAppUpdates();

      const session = renderer.xr.getSession();
      const xrCamera = session ? renderer.xr.getCamera(camera) : camera;
      localMatrix.multiplyMatrices(xrCamera.projectionMatrix, /*localMatrix2.multiplyMatrices(*/xrCamera.matrixWorldInverse/*, physx.worldContainer.matrixWorld)*/);
      localMatrix3.copy(xrCamera.matrix)
        .premultiply(dolly.matrix)
        .decompose(localVector, localQuaternion, localVector2);

      this.render(timestamp, timeDiffCapped);
    }
    renderer.setAnimationLoop(animate);
  }
}
