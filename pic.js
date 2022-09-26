import * as THREE from 'three';
import metaversefile from './metaversefile-api.js';
// import {getExt, makePromise, parseQuery, fitCameraToBoundingBox} from './util.js';
import Avatar from './avatars/avatars.js';
import * as audioManager from './audio-manager.js';
import npcManager from './npc-manager.js';
import dioramaManager from './diorama.js';
// import {getRenderer, scene, camera} from './renderer.js';

// import GIF from './gif.js';
import * as WebMWriter from 'webm-writer';
// const defaultWidth = 512;
// const defaultHeight = 512;
const FPS = 60;
// const videoQuality = 0.99999;
const videoQuality = 0.95;
const narutoRunSpeed = 59;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
// const localEuler = new THREE.Euler();
// const localMatrix = new THREE.Matrix4();

/* function mod(a, n) {
  return ((a % n) + n) % n;
}
function angleDifference(angle1, angle2) {
  let a = angle2 - angle1;
  a = mod(a + Math.PI, Math.PI*2) - Math.PI;
  return a;
} */

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

  const scene = new THREE.Scene();
  scene.matrixWorldAutoUpdate = false;

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
  // const ambientLight = new THREE.AmbientLight(0xFFFFFF, 50);
  // directionalLight.position.set(1, 1.5, -2);
  // directionalLight.updateMatrixWorld();

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5);
  directionalLight.position.set(1, 1.5, -2);
  directionalLight.updateMatrixWorld();

  /* const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1.5);
  directionalLight2.position.set(-1, 1.5, -2);
  directionalLight2.updateMatrixWorld(); */

  return [
    // ambientLight,
    directionalLight,
    // directionalLight2,
  ];
};

export const genPic = async ({
  url,
  width,
  height,
  canvas,
  video,
}) => {
  await Avatar.waitForLoad();

  /* console.log('gen pic', {
    url,
    width,
    height,
    canvas,
    video,
  }); */

  const animations = metaversefile.useAvatarAnimations();
  const idleAnimation = animations.find(a => a.name === 'idle.fbx');
  const idleAnimationDuration = idleAnimation.duration;
  const narutoRunAnimation = animations.find(a => a.isNarutoRun);
  const narutoRunAnimationDuration = narutoRunAnimation.duration;

  // load app
  const app = await metaversefile.createAppAsync({
    start_url: url,
  });

  const position = new THREE.Vector3(0, 1.5, 0);
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const player = npcManager.createNpc({
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
      type: 'facepose',
      emotion: 'angry',
    });
  };
  const _updateTarget = (timestamp, timeDiff) => {
    target.matrixWorld.copy(player.avatar.modelBones.Head.matrixWorld)
      .decompose(target.position, target.quaternion, target.scale);
    target.position.set(player.position.x, target.position.y, player.position.z);
    target.quaternion.copy(player.quaternion);
    target.matrixWorld.compose(target.position, target.quaternion, target.scale);
  };
  const _animate = (timestamp, timeDiff) => {
    // console.log('got position', player.position.y);
    player.updateAvatar(timestamp, timeDiff);
  };
  /* const _lookAt = (camera, boundingBox) => {
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
  }; */

  // rendering
  const localLights = _makeLights();
  const objects = localLights.concat([
    player.avatar.model,
  ]);
  // console.log('got model bones', player.avatar.modelBones);
  // debugger;
  const target = new THREE.Object3D();
  const diorama = dioramaManager.createPlayerDiorama({
    // target: player,
    target,
    objects,
    lights: false,
    // label: true,
    // outline: true,
    // grassBackground: true,
    // glyphBackground: true,
  });
  diorama.addCanvas(canvas);
  diorama.setClearColor(0xFFFFFF, 1);

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
  writeCanvas.style.width = `${width / window.devicePixelRatio}px`;
  writeCanvas.style.height = `${height / window.devicePixelRatio}px`;
  const writeCtx = writeCanvas.getContext('2d');

  const mode = 'idle';
  // const mode = 'narutoRun';
  let update;
  let totalDuration;
  switch (mode) {
    case 'idle': {
      update = () => {};
      totalDuration = idleAnimationDuration * 1000;
      break;
    }
    case 'narutoRun': {
      /* localEuler.setFromRotationMatrix(
        localMatrix.lookAt(
          localVector.set(0, 0, 0),
          localVector2.set(0, 0, -1)
            .applyQuaternion(player.quaternion),
          localVector3.set(0, 1, 0)
        ),
        'YXZ'
      );
      const forwardY = localEuler.y; */
      // const angle = forwardY;

      const spriteSpec = {
        name: 'naruto run',
        duration: narutoRunAnimationDuration,
        init({player}) {
          let positionOffset = 0;
          // let narutoRunTime = 0;
          // const narutoRunIncrementSpeed = 1000 * 4;

          player.addAction({
            type: 'narutoRun',
            // time: 0,
          });

          return {
            update(timestamp, timeDiff) {
              const timeDiffMs = timeDiff / 1000;
              const angle = -Math.PI / 2;
              positionOffset -= narutoRunSpeed / 1000 * timeDiffMs;

              /* const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera.position.set(0, avatar.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera.lookAt(new THREE.Vector3(0, avatar.height*cameraHeightFactor, positionOffset));
              camera.updateMatrixWorld(); */

              diorama.setCameraOffset(
                localVector.set(0, 0, 2)
                  .applyQuaternion(localQuaternion.setFromAxisAngle(localVector2.set(0, 1, 0), -angle)),
              );
              // player.avatar.modelBones.Root.updateMatrixWorld();

              // player.position.set(0, avatar.height, positionOffset);
              // player.updateMatrixWorld();

              // avatar.narutoRunState = true;
              // avatar.narutoRunTime = narutoRunTime;

              // narutoRunTime += timeDiffMs * narutoRunIncrementSpeed;

              // avatar.update(timestamp, timeDiffMs);
            },
            /* cleanup() {
              avatar.narutoRunState = false;
            }, */
          };
        },
      };
      const spriteSpecInstance = spriteSpec.init({
        player,
      });

      update = (timestamp, timeDiff) => {
        spriteSpecInstance.update(timestamp, timeDiff);
      };
      totalDuration = narutoRunAnimationDuration * 2 * 1000;
      break;
    }
    default: {
      throw new Error('unknown mode');
    }
  }

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
      }, 'image/webp', videoQuality);
    });
    framePromises.push(p);
  };
  const _render = async () => {
    _initializeAnimation();

    const _renderFrames = async () => {
      let now = 0;
      const timeDiff = 1000 / FPS;
      for (let i = 0; i < FPS * 2; i++) {
        _animate(now, timeDiff);
      }

      let index = 0;
      const framesPerFrame = FPS;
      while (now < totalDuration) {
        update(now, timeDiff);
        _updateTarget(now, timeDiff);
        _animate(now, timeDiff);

        diorama.update(now, timeDiff);

        _pushFrame();
        now += timeDiff;

        if ((index % framesPerFrame) === framesPerFrame - 1) {
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
  video.style.width = `${width / window.devicePixelRatio}px`;
  video.style.height = `${height / window.devicePixelRatio}px`;
  video.controls = true;
  video.loop = true;
};
