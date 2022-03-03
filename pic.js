import * as THREE from 'three';
import metaversefile from './metaversefile-api.js';
// import {getExt, makePromise, parseQuery, fitCameraToBoundingBox} from './util.js';
import Avatar from './avatars/avatars.js';
import * as audioManager from './audio-manager.js';
import npcManager from './npc-manager.js';
import dioramaManager from './diorama.js';
import {getRenderer, scene} from './renderer.js';

// import GIF from './gif.js';
import * as WebMWriter from 'webm-writer';
// const defaultWidth = 512;
// const defaultHeight = 512;
const FPS = 60;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();

// I can take all of you motherfuckers on at once!

/* const _makeRenderer = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    desynchronized: true,
  });
  const renderer = new THREE.WebGLRenderer({
    // alpha: true,
    // antialias: true,
    canvas,
    context,
  });
  // renderer.setSize(width, height);
  renderer.setClearColor(0xff0000, 1);

  const scene = new THREE.Scene();
  scene.autoUpdate = false;

  const camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 100);

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
  directionalLight.position.set(2, 2, -2);
  scene.add(directionalLight);
  const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1);
  directionalLight2.position.set(-2, 2, 2);
  scene.add(directionalLight2);

  return {renderer, scene, camera};
}; */
const _makeLights = () => {
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 2);
  directionalLight.position.set(2, 2, -2);
  directionalLight.updateMatrixWorld();
  
  const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 2);
  directionalLight2.position.set(-2, 2, -2);
  directionalLight2.updateMatrixWorld();

  return {
    directionalLight,
    directionalLight2,
  }
};

export const genPic = async ({
  url,
  width,
  height,
  canvas,
  video,
}) => {
  await Avatar.waitForLoad();
  await audioManager.waitForLoad();

  console.log('gen pic', {
    url,
    width,
    height,
    canvas,
    video,
  });

  const animations = metaversefile.useAvatarAnimations();
  const idleAnimation = animations.find(a => a.name === 'idle.fbx');
  const idleAnimationDuration = idleAnimation.duration;

  // load app
  const app = await metaversefile.createAppAsync({
    start_url: url,
  });

  const position = new THREE.Vector3(0, 1.5, 0);
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const player = await npcManager.createNpc({
    name: 'npc',
    avatarApp: app,
    position,
    quaternion,
    scale,
  });

  const _setTransform = () => {
    player.position.y = player.avatar.height;
    player.updateMatrixWorld();
  };
  _setTransform();

  const _initializeAnimation = () => {
    player.avatar.setTopEnabled(false);
    player.avatar.setHandEnabled(0, false);
    player.avatar.setHandEnabled(1, false);
    player.avatar.setBottomEnabled(false);
    player.avatar.inputs.hmd.position.y = player.avatar.height;
    player.avatar.inputs.hmd.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    player.avatar.inputs.hmd.updateMatrixWorld();
    player.addAction({
      type: 'emote',
      emotion: 'angry',
    });
  };
  const _animate = (timestamp, timeDiff) => {
    // console.log('got position', player.position.y);
    player.updateAvatar(timestamp, timeDiff);
  };
  const _lookAt = (camera, boundingBox) => {
    /* boundingBox.getCenter(camera.position);
    // const size = boundingBox.getSize(localVector);

    camera.position.y = 0;
    camera.position.z += 1;
    camera.updateMatrixWorld();

    fitCameraToBoundingBox(camera, boundingBox); */
    
    camera.position.copy(player.position)
      .add(localVector.set(0.3, 0, -0.5).applyQuaternion(player.quaternion));
      camera.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        camera.position,
        player.position,
        localVector3.set(0, 1, 0)
      )
    );
    camera.updateMatrixWorld();
  };

  // rendering
  const {
    directionalLight,
    directionalLight2,
  } = _makeLights();
  const objects = [
    directionalLight,
    directionalLight2,
    player.avatar.model,
  ];
  const diorama = dioramaManager.createPlayerDiorama({
    canvas,
    target: player,
    objects,
    // label: true,
    outline: true,
    grassBackground: true,
    // glyphBackground: true,
  });
  // diorama.enabled = false;

  const videoWriter = new WebMWriter({
    quality: 1,
    fileWriter: null,
    fd: null,
    frameDuration: null,
    frameRate: FPS,
  });
  const writeCanvas = canvas;
  writeCanvas.width = width;
  writeCanvas.height = height;
  writeCanvas.style.width = `${width/window.devicePixelRatio}px`;
  writeCanvas.style.height = `${height/window.devicePixelRatio}px`;
  const writeCtx = writeCanvas.getContext('2d');

  const framePromises = [];
  const _pushFrame = async () => {
    writeCtx.drawImage(canvas, 0, 0);

    const p = new Promise((resolve, reject) => {
      writeCanvas.toBlob(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob); 
        reader.onloadend = function() {
          const dataUrl = reader.result;                
          resolve(dataUrl);
        };
      }, 'image/webp', 0.99999);
    });
    framePromises.push(p);
  };
  const _render = async () => {
    const boundingBox = new THREE.Box3().setFromObject(app);

    _initializeAnimation();
    // _lookAt(camera, boundingBox);

    const _renderFrames = async () => {
      let now = 0;
      const timeDiff = 1000/FPS;
      for (let i = 0; i < FPS*2; i++) {
        // _lookAt(camera, boundingBox);
        _animate(now, timeDiff);
        // app.updateMatrixWorld();
      }

      let index = 0;
      const framesPerFrame = FPS;
      while (now < idleAnimationDuration*1000) {
        // _lookAt(camera, boundingBox);
        _animate(now, timeDiff);

        diorama.update(now, timeDiff);
        // renderer.render(scene, camera);
        // renderer.getContext().flush();

        _pushFrame();
        now += timeDiff;

        if ((index % framesPerFrame) === framesPerFrame-1) {
          await new Promise((accept, reject) => {
            requestAnimationFrame(() => {
              accept();
            });
          });
        }
        index++;
      }

      const frameDataUrls = await Promise.all(framePromises);
      framePromises.length = 0;
      let dataUrl;
      while ((dataUrl = frameDataUrls.shift()) !== undefined) {
        videoWriter.addFrame({
          toDataURL() {
            return dataUrl;
          },
        });
      }
    };
    await _renderFrames();
  };
  await _render();

  const blob = await videoWriter.complete();
  await new Promise((accept, reject) => {
    video.oncanplaythrough = accept;
    video.onerror = reject;
    video.src = URL.createObjectURL(blob);
  });
  video.style.width = `${width/window.devicePixelRatio}px`;
  video.style.height = `${height/window.devicePixelRatio}px`;
  video.controls = true;
  video.loop = true;
};