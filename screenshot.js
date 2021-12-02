import * as THREE from 'three';
import {getExt, makePromise, parseQuery} from './util.js';
import Avatar from './avatars/avatars.js';
import * as icons from './icons.js';
import GIF from './gif.js';
import App from './webaverse';
import totumApi from './totum-api.js';
import {fitCameraToBox} from './util.js';
// import {defaultRendererUrl} from './constants.js'
import * as WebMWriter from 'webm-writer'
const defaultWidth = 512;
const defaultHeight = 512;
const cameraPosition = new THREE.Vector3(0, 1, 2);
const cameraTarget = new THREE.Vector3(0, 0, 0);
const FPS = 60;

const _makePromise = () => {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
};
const _makeRenderer = (width, height) => {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(width, height);

  const scene = new THREE.Scene();

  /* const cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), new THREE.MeshBasicMaterial({
    color: 0x0000FF,
  }));
  scene.add(cubeMesh); */

  const camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 100);
  // camera.position.copy(cameraPosition);
  // camera.lookAt(cameraTarget);
  // camera.quaternion.copy(cameraQuaternion);
  // camera.lookAt(model.boundingBoxMesh.getWorldPosition(new THREE.Vector3()));
  // const localAabb = model.boundingBoxMesh.scale.clone().applyQuaternion(model.quaternion);
  // const modelHeight = Math.max(model.boundingBoxMesh.scale.x, model.boundingBoxMesh.scale.y, model.boundingBoxMesh.scale.z);
  // camera.fov = 2 * Math.atan( modelHeight/( 2 * dist ) ) * ( 180/Math.PI );
  // camera.updateProjectionMatrix();

  // camera.lookAt(model.boundingBoxMesh.getWorldPosition(new THREE.Vector3()));


  /* const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
  scene.add(ambientLight); */
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
  directionalLight.position.set(2, 2, -2);
  scene.add(directionalLight);
  const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 1);
  directionalLight2.position.set(-2, 2, 2);
  scene.add(directionalLight2);

  return {renderer, scene, camera};
};

/* const _makeUiRenderer = () => {
  const uiSize = 2048;
  const uiWorldSize = 0.2;
  const loadPromise = Promise.all([
    new Promise((accept, reject) => {
      const iframe = document.createElement('iframe');
      iframe.src = defaultRendererUrl;
      iframe.onload = () => {
        accept(iframe);
      };
      iframe.onerror = err => {
        reject(err);
      };
      iframe.setAttribute('frameborder', 0);
      iframe.style.position = 'absolute';
      iframe.style.width = `${uiSize}px`;
      iframe.style.height = `${uiSize}px`;
      iframe.style.top = '-4096px';
      iframe.style.left = '-4096px';
      document.body.appendChild(iframe);
    }),
  ]);

  let renderIds = 0;
  return {
    async render(htmlString, width, height) {
      const [iframe] = await loadPromise;

      const start = Date.now();
      const mc = new MessageChannel();
      iframe.contentWindow.postMessage({
        method: 'render',
        id: ++renderIds,
        htmlString,
        templateData: null,
        width,
        height,
        transparent: true,
        bitmap: true,
        port: mc.port2,
      }, '*', [mc.port2]);
      const result = await new Promise((accept, reject) => {
        mc.port1.onmessage = e => {
          const {data} = e;
          const {error, result} = data;

          if (result) {
            console.log('time taken', Date.now() - start);

            accept(result);
          } else {
            reject(error);
          }
        };
      });
      return result;
    },
  };
}; */
/* const _makeIconString = (hash, ext, w, h) => {
  const icon = {
    'gltf': icons.vrCardboard,
    'glb': icons.vrCardboard,
    'vrm': icons.tShirt,
    'vox': icons.cube,
    'js': icons.code,
  }[ext];
  const _split = s => {
    const splitCount = 32;
    let result = 0;
    for (let i = 0; i < s.length; i += splitCount) {
      if (i !== 0) {
        result += '<br>'
      }
      result += s.slice(i, i + splitCount);
    }
    return result;
  };
  return `\
  <style>
  * {
    box-sizing: border-box;
  }
  .body {
    display: flex;
    width: ${w}px;
    height: ${h}px;
    background-color: #FFF;
    border: ${w/20}px solid #ff7043;
    border-top-width: ${w/5}px;
    font-family: 'Bangers';
  }
  .wrap {
    display: flex;
    overflow: hidden;
  }
  .details {
    display: flex;
    padding: 50px;
    background-color: #FFF;
    flex: 1;
    flex-direction: column;
  }
  h1 {
    margin: 10px 0;
    font-size: 100px;
  }
  p {
    margin: 10px 0;
    font-size: 60px;
  }
  .icon {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
  }
  .hash {
    position: absolute;
    top: ${w/20}px;
    left: ${w/20}px;
    color: #FFF;
    font-size: ${w/16}px;
  }
  .label {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: #000;
    color: #FFF;
    font-size: ${w/5}px;
  }
  </style>
  <div class=body>
    <div class=icon>
      <img ${icon ? `src="${icon}"` : ''} height=${h/2}>
    </div>
    <div class=hash>${_split(hash)}</div>
    <div class=label>${ext.toUpperCase()}</div>
  </div>
  `;
}; */

const dataUrlRegex = /^data:([^;,]+)(?:;(charset=utf-8|base64))?,([\s\S]*)$/;
const _getType = id => {
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
};

(async () => {
  await Avatar.waitForLoad();

  const animations = totumApi.useAvatarAnimations();
  // const walkAnimation = animations.find(a => a.name === 'walking.fbx');
  // const runAnimation = animations.find(a => a.name === 'Fast Run.fbx');
  // const runAnimationDuration = runAnimation.duration * 1.5;
  const idleAnimation = animations.find(a => a.name === 'idle.fbx');
  const idleAnimationDuration = idleAnimation.duration;

  // toggleElements(false);
  const screenshotResult = document.getElementById('screenshot-result');

  let {url, type, width, height, dst} = parseQuery(decodeURIComponent(window.location.search));
  width = parseInt(width, 10);
  if (isNaN(width)) {
    width = defaultWidth;
  }
  height = parseInt(height, 10);
  if (isNaN(height)) {
    height = defaultHeight;
  }
  
  let o;
  try {
    const app = await totumApi.load(url);
    if (app.appType === 'vrm') {
      await app.setSkinning(true);
      const avatar = new Avatar(app.skinnedVrm, {
        fingers: true,
        hair: true,
        visemes: true,
        debug: false,
      });
      app.avatar = avatar;
    }
    o = app;
  } catch (err) {
    console.warn(err);
  }
  const ext = o ? o.appType : '';
  const isVrm = ext === 'vrm';
  const isImage = ['png', 'jpg'].includes(ext);
  const isVideo = type === 'webm';

  const _initializeAnimation = () => {
    if (ext === 'vrm') {
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
    if (ext === 'vrm') {
      o.avatar.update(timeDiff);
    }
  };
  const _lookAt = (camera, boundingBox) => {
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    if (ext === 'vrm') {
      camera.position.x = center.x;
      camera.position.y = center.y;
    } else {
      camera.position.x = center.x/2;
      camera.position.y = center.y/2;
    }
    camera.position.z = size.z / 2;
    fitCameraToBox(camera, boundingBox);
  };

  try {
    if (type === 'png' || type === 'jpg' || type === 'jpeg') {
      const canvas = await (async () => {
        if (['glb', 'vrm', 'vox'].includes(ext)) {
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
        } else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
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

      // console.log('png blob arrayBuffer', blob.size, arrayBuffer.byteLength);

      if (dst) {
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
    } else if (type === 'gif' && ext !== 'gif') {
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
          // .add(new THREE.Vector3(0, size.y/2, 0))
          .add(
            new THREE.Vector3(Math.cos(i + Math.PI/2), 0, Math.sin(i + Math.PI/2))
              .multiplyScalar(Math.max(size.x/2, size.z/2) * 2.2)
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
        /* // flip
        writeCtx.globalCompositeOperation = 'copy';
        writeCtx.scale(1, -1);
        writeCtx.translate(0, -writeCanvas.height);
        writeCtx.drawImage(writeCanvas, 0, 0); */

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
          frameRate: FPS 
        });


        _initializeAnimation();
        _lookAt(camera, boundingBox);

        renderer.setClearColor(0xFFFFFF, 1);

        const writeCanvas = document.createElement('canvas');
        writeCanvas.width = width;
        writeCanvas.height = height;
        const writeCtx = writeCanvas.getContext('2d');

        const _pushFrame = () => {
          // draw  
          writeCtx.drawImage(renderer.domElement, 0, 0);
          videoWriter.addFrame(writeCanvas);
        }

        if (isVrm && isVideo) {
          /* const timeDiff = 1/FPS;
          for (let i = 0; i < 100; i++) {
            o.avatar.update(timeDiff);

            _lookAt(camera, boundingBox);

            renderer.render(scene, camera);

            _pushFrame();
          } */
          
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
            // o.position.y = Math.sin(i + Math.PI/2) * 0.05;
            o.quaternion
              .premultiply(
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin((i + Math.PI/2) * 1) * 0.005)
              );
            /* camera.position.copy(center)
              .add(
                new THREE.Vector3(
                  0,
                  0,
                  Math.max(size.x/2, size.y/2) * 2.2
                )
              );
            camera.lookAt(center);
            camera.updateMatrixWorld(); */
            _lookAt(camera, boundingBox);
            renderer.render(scene, camera);

            _pushFrame();
          }
        } else {
          for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.02) {
            // o.position.copy(center).multiplyScalar(-1);
            o.quaternion
              .setFromAxisAngle(new THREE.Vector3(0, 1, 0), i);

            /* camera.position.copy(center)
              .add(
                new THREE.Vector3(Math.cos(i + Math.PI/2), 0, Math.sin(i + Math.PI/2))
                  .multiplyScalar(Math.max(size.x/2, size.z/2) * 2.2)
              );
            camera.lookAt(center);
            camera.updateMatrixWorld(); */
            _lookAt(camera, boundingBox);
            // console.log(camera.position.toArray(), camera.quaternion.toArray());
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
        throw new Error('cannot capture video of type: ' + ext);
      }
    } else if (type === 'gif' && ext === 'gif') {
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
      throw new Error('unknown output format: ' + type + ' ' + ext);
    }

    // toggleElements(true);
  } catch (err) {
    console.warn(err.stack);

    // toggleElements(null, err);

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
})();
