import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import {AvatarRenderer} from './avatars/avatar-renderer.js';
// import npcManager from './npc-manager.js';
// import dioramaManager from './diorama.js';
import {getRenderer} from './renderer.js';
import {fetchArrayBuffer, addDefaultLights} from './util.js';

const localVector = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const upVector = new THREE.Vector3(0, 1, 0);

// const FPS = 60;

/* const _makeLights = () => {
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
  
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
  directionalLight.position.set(-1, 0, -1);
  directionalLight.updateMatrixWorld();

  return [
    ambientLight,
    directionalLight,
  ];
}; */

export const screenshotAvatarUrl = async ({
  start_url,
  width = 300,
  height = 300,
  canvas,
  emotion,
}) => {
  const arrayBuffer = await fetchArrayBuffer(start_url);
  
  const avatarRenderer = new AvatarRenderer({
    arrayBuffer,
    srcUrl,
    quality: maxAvatarQuality,
  });
  await avatarRenderer.waitForLoad();
  
  const avatar = createAvatarForScreenshot(avatarRenderer);

  const result = await screenshotAvatar({
    avatar,
    width,
    height,
    canvas,
    emotion,
  });
  avatar.destroy();
  return result;
};
export const createAvatarForScreenshot = avatarRenderer => {
  const avatar = new Avatar(avatarRenderer, {
    fingers: true,
    hair: true,
    visemes: true,
    debug: false,
  });
  avatar.setTopEnabled(false);
  avatar.setHandEnabled(0, false);
  avatar.setHandEnabled(1, false);
  avatar.setBottomEnabled(false);
  avatar.inputs.hmd.position.y = avatar.height;
  avatar.inputs.hmd.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  avatar.inputs.hmd.updateMatrixWorld();
  return avatar;
}

export const screenshotAvatar = async ({
  avatar,
  width = 300,
  height = 300,
  canvas,
  // cameraOffset,
  emotion,
}) => {
  /* player.position.set(0, 1.5, 0);
  player.quaternion.identity();
  player.scale.set(1, 1, 1);
  player.updateMatrixWorld();
  
  let now = 0;
  const timeDiff = 1000/FPS;

  const _setTransform = () => {
    player.position.y = player.avatar.height;
    player.updateMatrixWorld();
  };
  _setTransform(); */

  const model = avatar.avatarRenderer.scene;

  // initialize scene
  const camera2 = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const scene2 = new THREE.Scene();
  scene2.autoUpdate = false;
  /* const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
  scene2.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
  directionalLight.position.set(1, 2, 3);
  scene2.add(directionalLight); */
  addDefaultLights(scene2);

  // update avatar
  const _updateAvatar = () => {
    // set emotion
    avatar.faceposes.length = 0;  
    if (emotion) {
      avatar.faceposes.push({
        emotion,
        value: 1,
      });
    }

    // update avatar
    avatar.update(0, 0);
  };
  _updateAvatar();

  // initialize canvas
  let writeCanvas;
  if (canvas) {
    writeCanvas = canvas;
  } else {
    writeCanvas = document.createElement('canvas');
    writeCanvas.width = width;
    writeCanvas.height = height;
  }

  // render
  const renderer = getRenderer();
  const pixelRatio = renderer.getPixelRatio();
  const _render = () => {
    // set up scene
    const oldParent = model.parent;
    scene2.add(model);

    // set up camera
    const cameraOffset = new THREE.Vector3(0, 0.05, 0.35);

    avatar.modelBones.Head.matrixWorld
      .decompose(camera2.position, camera2.quaternion, camera2.scale);
    const targetPosition = localVector.copy(camera2.position);
    targetPosition.y += cameraOffset.y
    camera2.position.add(cameraOffset);
    camera2.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        camera2.position,
        targetPosition,
        upVector,
      )
    );

    const rendererSize = renderer.getSize(localVector2D);
    const {width, height} = writeCanvas;
    const ctx = writeCanvas.getContext('2d');
    if (rendererSize.x >= width && rendererSize.y >= height) {
      // push old renderer state
      const oldViewport = renderer.getViewport(localVector4D);
      const oldClearAlpha = renderer.getClearAlpha();
      
      renderer.setViewport(0, 0, width/pixelRatio, height/pixelRatio);
      renderer.setClearAlpha(0);
      renderer.clear();
      renderer.render(scene2, camera2);

      // copy to canvas
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(
        renderer.domElement,
        0,
        rendererSize.y * pixelRatio - height * pixelRatio,
        width * pixelRatio,
        height * pixelRatio,
        0,
        0,
        width,
        height
      );

      // pop old renderer state
      renderer.setViewport(oldViewport);
      renderer.setClearAlpha(oldClearAlpha);
    }

    if (oldParent) {
      oldParent.add(model);
    } else {
      model.parent.remove(model);
    }
  };
  _render();

  return writeCanvas;
};