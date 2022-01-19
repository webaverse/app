import * as THREE from 'three';
import metaversefileApi from './metaversefile-api.js';
import {parseQuery, fitCameraToBoundingBox} from './util.js';
import Avatar from './avatars/avatars.js';
import {NpcPlayer} from './character-controller.js';
// import * as icons from './icons.js';
import GIF from './gif.js';
// import App from './webaverse';
// import {defaultRendererUrl} from './constants.js'
import * as WebMWriter from 'webm-writer';

const size = 1024;
const displaySize = 512;
const texSize = 128;
const numSlots = size / texSize;
const numAngles = 64;
const width = size;
const height = size;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();

/* const _makeRenderer = (width, height) => {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);

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

const dataUrlRegex = /^data:([^;,]+)(?:;(charset=utf-8|base64))?,([\s\S]*)$/;
/* const _getType = id => {
  id = id.replace(/^\/@proxy\//, '');

  const o = new URL(id);
  console.log('get type', o);
  let match;
  if (o.href && (match = o.href.match(dataUrlRegex))) {
    const type = match[1] || '';
    if (type === 'text/javascript') {
      type = 'application/javascript';
    }
    let extension;
    let match2;
    if (match2 = type.match(/^application\/(light|rendersettings|group)$/)) {
      extension = match2[1];
    } else {
      extension = mimeTypes.extension(type);
    }
    // console.log('got data extension', {type, extension});
    return extension || '';
  } else if (o.hash && (match = o.hash.match(/^#type=(.+)$/))) {
    return match[1] || '';
  } else if (o.query && o.query.type) {
    return o.query.type;
  } else if (match = o.pathname.match(/\.([^\.\/]+)$/)) {
    return match[1] || '';
  } else {
    return '';
  }
}; */

// console.log('init screenshot.js');

const _timeout = t => new Promise(resolve => {setTimeout(resolve, t);});
const _makeCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = `\
    width: ${displaySize}px;
    height: ${displaySize}px;
  `;
  return canvas;
};
const _render = async ({
  url,
  type,
  dst,
  canvas,
}) => {
  await Avatar.waitForLoad();

  const animations = metaversefileApi.useAvatarAnimations();
  const idleAnimation = animations.find(a => a.name === 'idle.fbx');
  const idleAnimationDuration = idleAnimation.duration;

  const {width, height} = canvas;

  const _renderApp = async (app, type, canvas) => {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    canvas.style.cssText = `\
      width: ${displaySize}px;
      height: ${displaySize}px;
    `;

    const scene = new THREE.Scene();
    // scene.autoUpdate = false;
    const _buildScene = scene => {
      // const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
      // ambientLight.position.set(2, 2, -2);
      // scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
      directionalLight.position.set(2, 2, -2);
      scene.add(directionalLight);
      const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1);
      directionalLight2.position.set(-2, 2, 2);
      scene.add(directionalLight2);
    
      scene.add(app);
    };
    _buildScene(scene);

    await renderer.compileAsync(app, scene);

    const camera = new THREE.PerspectiveCamera(45, canvas.width/canvas.height, 0.1, 1000);
    const _resetCamera = (euler = new THREE.Euler()) => {
      const physicsObjects = app.getPhysicsObjects();
      const physicsObject = physicsObjects.length > 0 ? physicsObjects[0] : app;
      const boundingBox = new THREE.Box3().setFromObject(physicsObject);
      boundingBox.getCenter(camera.position)
        .add(
          localVector.set(0, 0, 1)
            .applyEuler(euler)
        );
      fitCameraToBoundingBox(camera, boundingBox);
    };
    const _renderScene = () => {
      renderer.render(scene, camera);
    };

    switch (type) {
      case 'gif': {
        throw new Error('not implemented');
        break;
      }
      case 'webm': {
        throw new Error('not implemented');
        break;
      }
      case '360-spritesheet': {
        const canvas2 = _makeCanvas(width, height);
        const ctx2 = canvas2.getContext('2d');

        for (let angle = 0, angleIndex = 0; angleIndex < numAngles; angle += Math.PI*2/numAngles, angleIndex++) {
          _resetCamera(new THREE.Euler(0, angle, 0, 'YXZ'));
          _renderScene();

          const x = angleIndex % numSlots;
          const y = (angleIndex - x) / numSlots;
          ctx2.drawImage(
            renderer.domElement,
            0, 0, renderer.domElement.width, renderer.domElement.height,
            x * texSize, y * texSize, texSize, texSize
          );

          // await _timeout(200);
          // await _timeout(0);
        }
        return canvas2;
        break;
      }
      case 'png':
      default: {
        _resetCamera();
        _renderScene();
        break;
      }
    }
  };
  const _renderAvatar = async (app, type, canvas) => {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    canvas.style.cssText = `\
      width: ${displaySize}px;
      height: ${displaySize}px;
    `;

    const scene = new THREE.Scene();
    // scene.autoUpdate = false;
    const _buildScene = scene => {
      // const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
      // ambientLight.position.set(2, 2, -2);
      // scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
      directionalLight.position.set(2, 2, -2);
      scene.add(directionalLight);
      const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1);
      directionalLight2.position.set(-2, 2, 2);
      scene.add(directionalLight2);
    
      scene.add(app);
    };
    _buildScene(scene);

    await renderer.compileAsync(app, scene);

    const camera = new THREE.PerspectiveCamera();
    const _resetCamera = () => {
      camera.position.copy(npcPlayer.position)
        .add(localVector.set(0.3, 0, -0.5).applyQuaternion(npcPlayer.quaternion));
        camera.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          camera.position,
          npcPlayer.position,
          localVector3.set(0, 1, 0)
        )
      );
      camera.updateMatrixWorld();
    };
    
    const newNpcPlayer = new NpcPlayer();
    await newNpcPlayer.setAvatarAppAsync(app);
    const npcPlayer = newNpcPlayer;
    let timestamp = 0;
    const timeDiff = 100;
    const _updateNpcPlayer = () => {
      // const f = timestamp / 5000;
      // const s = Math.sin(f);
      npcPlayer.position.set(0, npcPlayer.avatar.height, 0);
      npcPlayer.updateAvatar(timestamp, timeDiff);

      timestamp += timeDiff;
    };
    const _renderScene = () => {
      renderer.render(scene, camera);
    };

    switch (type) {
      /* case 'gif': {
        throw new Error('not implemented');
        break;
      }
      case 'webm': {
        throw new Error('not implemented');
        break;
      } */
      case '360-spritesheet': {
        const canvas2 = _makeCanvas(width, height);
        const ctx2 = canvas2.getContext('2d');

        for (let angle = 0, angleIndex = 0; angleIndex < numAngles; angle += Math.PI*2/numAngles, angleIndex++) {
          _updateNpcPlayer();
          _resetCamera(new THREE.Euler(0, angle, 0, 'YXZ'));
          _renderScene();

          const x = angleIndex % numSlots;
          const y = (angleIndex - x) / numSlots;
          ctx2.drawImage(
            renderer.domElement,
            0, 0, renderer.domElement.width, renderer.domElement.height,
            x * texSize, y * texSize, texSize, texSize
          );

          // await _timeout(200);
          // await _timeout(0);
        }
        return canvas2;
        break;
      }
      case 'png':
      default: {
        _updateNpcPlayer();
        _resetCamera();
        _renderScene();
        break;
      }
    }
  };
  const _loadApp = async (url) => {
    try {
      const contentId = url;
      const instanceId = null;

      const m = await metaversefileApi.import(url);

      const app = metaversefileApi.createApp({
        name: contentId,
      });

      app.contentId = contentId;
      app.instanceId = instanceId;
      app.setComponent('physics', true);
      const mesh = await app.addModule(m);
      if (!mesh) {
        console.warn('failed to load object for preview', {contentId});
      }

      return app;
    } catch (err) {
      console.warn(err);
    }
  };
  const app = await _loadApp(url);
  // console.log('loaded app', app);
  const result = await ((async () => {
    switch (app.appType) {
      case 'glb':
      case 'vox':
      case 'script': {
        const result = await _renderApp(app, type, canvas);
        // console.log('got result', result);
        return result;
        break;
      }
      case 'vrm': {
        const result = await _renderAvatar(app, type, canvas);
        // console.log('got result', result);
        return result;
        break;
      }
      default: {
        console.warn('cannot render unknown app type', app.appType);
        return null;
        break;
      }
    }
  })());
  return result;





    


  






  // DEAD CODE
  const _oldRender = async () => {
    const appType = o ? o.appType : '';
    const isVrm = appType === 'vrm';
    const isImage = ['png', 'jpg'].includes(appType);
    const isVideo = type === 'webm';

    const _initializeAnimation = () => {
      if (appType === 'vrm') {
        o.avatar.setTopEnabled(false);
        o.avatar.setHandEnabled(0, false);
        o.avatar.setHandEnabled(1, false);
        o.avatar.setBottomEnabled(false);
        o.avatar.inputs.hmd.position.y = o.avatar.height;
        o.avatar.inputs.hmd.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        o.avatar.inputs.hmd.updateMatrixWorld();
        o.avatar.update(1000);
      }
    };
    const _animate = timeDiff => {
      if (appType === 'vrm') {
        o.avatar.update(timeDiff);
      }
    };
    const _lookAt = (camera, boundingBox) => {
      boundingBox.getCenter(camera.position);
      const size = boundingBox.getSize(localVector);

      camera.position.y = size.y;
      if (appType === 'vrm') {
        camera.position.z -= 1;
      } else {
        camera.position.z += 1;
      }

      fitCameraToBoundingBox(camera, boundingBox);
    };

    try {
      if (type === 'png' || type === 'jpg' || type === 'jpeg') {
        const canvas = await (async () => {
          if (['glb', 'vrm', 'vox'].includes(appType)) {
            const {renderer, scene, camera} = _makeRenderer(width, height);

            if (o) {
              scene.add(o);

              const boundingBox = new THREE.Box3().setFromObject(o);

              _initializeAnimation();
              _lookAt(camera, boundingBox);

              renderer.compile(scene, camera);

              if (type === 'jpg' || type === 'jpeg') {
                renderer.setClearColor(0xFFFFFF, 1);
              }
              renderer.render(scene, camera);
              return renderer.domElement;
            } else {
              return null;
            }
          } else if (['gif', 'image'].includes(appType)) {
            const img = await new Promise((accept, reject) => {
              const img = new Image();
              img.onload = () => {
                accept(img);
              };
              img.onerror = reject;
              img.crossOrigin = 'Anonymous';
              img.src = url;
            });
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (img.width > img.height) { // vertical padding needed
              const scaleFactor = img.width/width;
              const dstWidth = img.width/scaleFactor;
              const dstHeight = img.height/scaleFactor;

              const pixelsToAdd = dstWidth - dstHeight;
              const pixelsToAddD2 = pixelsToAdd/2;

              ctx.drawImage(img, 0, pixelsToAddD2, dstWidth, dstHeight);
            } else { // horizontal padding needed
              const scaleFactor = img.height/height;
              const dstWidth = img.width/scaleFactor;
              const dstHeight = img.height/scaleFactor;

              const pixelsToAdd = dstHeight - dstWidth;
              const pixelsToAddD2 = pixelsToAdd/2;

              ctx.drawImage(img, pixelsToAddD2, 0, dstWidth, dstHeight);
            }
            return canvas;
          } else {
            return null;
          }
        })();

        const mimeType = `image/${type === 'png' ? 'png' : 'jpeg'}`;
        const blob = await new Promise((accept, reject) => {
          console.log('canvas to blob', canvas, o);
          canvas.toBlob(accept, mimeType);
        });
        const img = new Image();
        await new Promise((accept, reject) => {
          img.onload = accept;
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });
        img.style.width = `${img.width/window.devicePixelRatio}px`;
        img.style.height = `${img.height/window.devicePixelRatio}px`;
        screenshotResult.appendChild(img);

        const arrayBuffer = await blob.arrayBuffer();

        if (dst) {
          console.log('return to dst');

          fetch(dst, {
            method: 'POST',
            headers: {
              'Content-Type': mimeType,
            },
            body: arrayBuffer,
          }).then(res => res.blob());
        }

        window.parent.postMessage({
          method: 'result',
          result: arrayBuffer,
        }, '*', [arrayBuffer]);
      } else if (type === 'gif' && appType !== 'gif') {
        const {renderer, scene, camera} = _makeRenderer(width, height);

        scene.add(o);

        const boundingBox = new THREE.Box3().setFromObject(o);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        renderer.setClearColor(0xFFFFFF, 1);

        const gif = new GIF({
          workers: 4,
          quality: 10,
        });
        for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.05) {
          camera.position.copy(center)
            .add(
              new THREE.Vector3(Math.cos(i + Math.PI/2), 0, Math.sin(i + Math.PI/2))
                .multiplyScalar(Math.max(size.x/2, size.z/2) * 2.2),
            );
          camera.lookAt(center);
          camera.updateMatrixWorld();
          renderer.render(scene, camera);

          // read
          const writeCanvas = document.createElement('canvas');
          writeCanvas.width = width;
          writeCanvas.height = height;
          // draw
          const writeCtx = writeCanvas.getContext('2d');
          writeCtx.drawImage(renderer.domElement, 0, 0);

          gif.addFrame(writeCanvas, {delay: 50});
        }
        gif.render();

        const blob = await new Promise((resolve, reject) => {
          gif.on('finished', resolve);
        });

        const img = new Image();
        await new Promise((accept, reject) => {
          img.onload = accept;
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
        screenshotResult.appendChild(img);

        const arrayBuffer = await blob.arrayBuffer();

        if (dst) {
          fetch(dst, {
            method: 'POST',
            headers: {
              'Content-Type': 'image/gif',
            },
            body: arrayBuffer,
          }).then(res => res.blob());
        }

        window.parent.postMessage({
          method: 'result',
          result: arrayBuffer,
        }, '*', [arrayBuffer]);
      } else if (type === 'webm') {
        const {renderer, scene, camera} = _makeRenderer(width, height);

        scene.add(o);
        o.updateMatrixWorld();

        if (o) {
          const boundingBox = new THREE.Box3().setFromObject(o);
          const center = boundingBox.getCenter(new THREE.Vector3());
          const size = boundingBox.getSize(new THREE.Vector3());

          const videoWriter = new WebMWriter({
            quality: 1,
            fileWriter: null,
            fd: null,
            frameDuration: null,
            frameRate: FPS,
          });

          _initializeAnimation();
          _lookAt(camera, boundingBox);

          renderer.setClearColor(0xFFFFFF, 1);

          const writeCanvas = document.createElement('canvas');
          writeCanvas.width = width;
          writeCanvas.height = height;
          const writeCtx = writeCanvas.getContext('2d');

          const _pushFrame = () => {
            writeCtx.drawImage(renderer.domElement, 0, 0);
            videoWriter.addFrame(writeCanvas);
          };

          if (isVrm && isVideo) {
            let now = 0;
            const timeDiff = 1000/FPS;
            while (now < idleAnimationDuration*1000) {
              o.avatar.update(timeDiff);

              _lookAt(camera, boundingBox);

              renderer.render(scene, camera);

              _pushFrame();
              now += timeDiff;
            }
          } else if (isImage && isVideo) {
            for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.02) {
              o.quaternion
                .premultiply(
                  new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin((i + Math.PI/2) * 1) * 0.005)
                );
              _lookAt(camera, boundingBox);
              renderer.render(scene, camera);

              _pushFrame();
            }
          } else {
            for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.02) {
              o.quaternion
                .setFromAxisAngle(new THREE.Vector3(0, 1, 0), i);

              _lookAt(camera, boundingBox);
              renderer.render(scene, camera);

              _pushFrame();
            }
          }

          const blob = await videoWriter.complete();
          console.log('got video blob', blob);

          const video = document.createElement('video');
          video.muted = true;
          video.autoplay = true;
          await new Promise((accept, reject) => {
            video.oncanplaythrough = accept;
            video.onerror = reject;
            video.src = URL.createObjectURL(blob);
          });
          video.style.width = `${width/window.devicePixelRatio}px`;
          video.style.height = `${height/window.devicePixelRatio}px`;
          video.loop = true;
          screenshotResult.appendChild(video);

          const arrayBuffer = await blob.arrayBuffer();

          if (dst) {
            fetch(dst, {
              method: 'POST',
              headers: {
                'Content-Type': 'video/webm',
              },
              body: arrayBuffer,
            }).then(res => res.blob());
          }

          window.parent.postMessage({
            method: 'result',
            result: arrayBuffer,
          }, '*', [arrayBuffer]);
        } else {
          throw new Error('cannot capture video of type: ' + appType);
        }
      } else if (type === 'gif' && appType === 'gif') {
        const blob = await fetch(url);
        const img = new Image();
        await new Promise((accept, reject) => {
          img.onload = accept;
          img.onerror = reject;
          img.src = url;
        });
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
        screenshotResult.appendChild(img);

        const arrayBuffer = await blob.arrayBuffer();

        if (dst) {
          fetch(dst, {
            method: 'POST',
            headers: {
              'Content-Type': 'image/gif',
            },
            body: arrayBuffer,
          }).then(res => res.blob());
        }

        window.parent.postMessage({
          method: 'result',
          result: arrayBuffer,
        }, '*', [arrayBuffer]);
      } else {
        throw new Error('unknown output format: ' + type + ' ' + appType);
      }
    } catch (err) {
      console.warn(err.stack);

      if (dst) {
        fetch(dst, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: err.stack,
        }).then(res => res.blob());
      }

      window.parent.postMessage({
        method: 'error',
        error: err.stack,
      }, '*');
    }
  };
};
const _bootstrapInitialRender = async () => {
  const _respond = async (err, result, {
    type = 'application/octet-stream',
  } = {}) => {
    // console.log('respond', {err, result});

    const {dst, respond} = q;
    if (dst) {
      const res = await fetch(dst, {
        method: 'POST',
        headers: {
          'Content-Type': type,
        },
        body: err,
      });
      await res.blob();
    }
    if (respond) {
      if (result instanceof HTMLCanvasElement) {
        result = await createImageBitmap(result);
      } else {
        console.warn('unknown result type', result);
      }

      window.parent.postMessage({
        id: q.respond,
        method: err ? 'error' : 'result',
        error: err,
        result,
      }, '*', result ? [result] : []);
    }
  };

  const q = parseQuery(decodeURIComponent(window.location.search));
  try {
    if (q.url) {
      const canvas = _makeCanvas(q.width ?? size, q.height ?? size);
      document.body.appendChild(canvas);
      q.canvas = canvas;
      const canvas2 = await _render(q);
      if (canvas2) {
        document.body.removeChild(canvas);
        document.body.appendChild(canvas2);

        _respond(null, canvas2);
      } else {
        _respond(null, canvas);
      }
    }
  } catch (err) {
    _respond(err);
  }
};

const formEl = document.getElementById('form');
const inputEl = document.getElementById('url');
const typeEl = document.getElementById('type');
formEl.addEventListener('submit', async event => {
  event.preventDefault();

  const url = inputEl.value;
  if (url) {
    const type = typeEl.value;
    const width = size;
    const height = size;
    const canvas = _makeCanvas(width, height);
    document.body.appendChild(canvas);
    const canvas2 = await _render({
      url,
      type,
      canvas,
    });
    if (canvas2) {
      document.body.removeChild(canvas);
      document.body.appendChild(canvas2);
    }
  }
});
const clearEl = document.getElementById('clear');
clearEl.addEventListener('click', e => {
  const canvases = Array.from(document.querySelectorAll('canvas'));
  for (const canvas of canvases) {
    document.body.removeChild(canvas);
  }
});

_bootstrapInitialRender();