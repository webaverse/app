import * as THREE from 'three';
import { getExt, makePromise, parseQuery } from './util.js';
import Avatar from './avatars/avatars.js';
import * as icons from './icons.js';
import GIF from './gif.js';
import App from './app.js';
import metaversefileApi from './metaversefile-api.js';
import {defaultRendererUrl} from './constants.js'

const defaultWidth = 512;
const defaultHeight = 512;
const cameraPosition = new THREE.Vector3(0, 1, -2);
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

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.copy(cameraPosition);
  camera.lookAt(cameraTarget);
  // camera.quaternion.copy(cameraQuaternion);
  // camera.lookAt(model.boundingBoxMesh.getWorldPosition(new THREE.Vector3()));
  // const localAabb = model.boundingBoxMesh.scale.clone().applyQuaternion(model.quaternion);
  // const modelHeight = Math.max(model.boundingBoxMesh.scale.x, model.boundingBoxMesh.scale.y, model.boundingBoxMesh.scale.z);
  // camera.fov = 2 * Math.atan( modelHeight / ( 2 * dist ) ) * ( 180 / Math.PI );
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

const _makeUiRenderer = () => {
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
      const [iframe/*, interfaceHtml */] = await loadPromise;

      /* if (renderIds > 0) {
        iframe.contentWindow.postMessage({
          method: 'cancel',
          id: renderIds,
        }, '*');
      } */

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
};
const _makeIconString = (hash, ext, w, h) => {
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
    border: ${w / 20}px solid #ff7043;
    border-top-width: ${w / 5}px;
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
    top: ${w / 20}px;
    left: ${w / 20}px;
    color: #FFF;
    font-size: ${w / 16}px;
  }
  .label {
    position: absolute;
    bottom: 0;
    right: 0;
    /* padding: ${w / 30}px; */
    background-color: #000;
    color: #FFF;
    font-size: ${w / 5}px;
  }
  </style>
  <div class=body>
    <div class=icon>
      <img ${icon ? `src="${icon}"` : ''} height=${h / 2}>
    </div>
    <div class=hash>${_split(hash)}</div>
    <div class=label>${ext.toUpperCase()}</div>
  </div>
  `;
};

(async () => {
  // toggleElements(false);
  const screenshotResult = document.getElementById('screenshot-result');

  let {url, hash, ext, type, width, height, dst} = parseQuery(decodeURIComponent(window.location.search));
  width = parseInt(width, 10);
  if (isNaN(width)) {
    width = defaultWidth;
  }
  height = parseInt(height, 10);
  if (isNaN(height)) {
    height = defaultHeight;
  }
  const isVrm = ext === 'vrm';
  const isImage = ['png', 'jpg'].includes(ext);
  const isVideo = type === 'webm';

  try {
    const _loadGltf = async () => {
      let o;
      try {
        o = await metaversefileApi.load(url);
      } catch (err) {
        console.warn(err);
      } /* finally {
        URL.revokeObjectURL(u);
      } */
      console.log('loaded GLTF', o);
      return o;
    };
    const _loadVrm = async () => {
      let o;
      try {
        o = await metaversefileApi.load(url);
        let waitPromise;

        o.dispatchEvent({
          type: 'wearupdate',
          wear: true,
          waitUntil(p) {
            waitPromise = p;
          },
        })

        if (waitPromise) {
          await waitPromise;
        }
        o.scene = o.skinnedVrm.scene;


      } catch (err) {
        console.warn(err);
      } /* finally {
        URL.revokeObjectURL(u);
      } */

      const rig = new Avatar(o, {
        fingers: true,
        hair: true,
        visemes: true,
        debug: false,
      });
      rig.model.isVrm = true;
      /* rig.aux = oldRig.aux;
      rig.aux.rig = rig; */

      o = o.scene;
      o.rig = rig;

      return o;
    };
    const _loadVox = async () => {
      let o;
      try {
        o = await metaversefileApi.load(url);
      } catch (err) {
        console.warn(err);
      } /* finally {
        URL.revokeObjectURL(u);
      } */
      return o;
    };
    const _loadImage = async () => {
      let o;
      try {
        o = await metaversefileApi.load(url);
        //o.scene = o.children[0];
      } catch (err) {
        console.warn(err);
      } /* finally {
        URL.revokeObjectURL(u);
      } */
      return o;
    };

    if (type === 'png' || type === 'jpg' || type === 'jpeg') {
      const canvas = await (async () => {
        const _renderDefaultCanvas = async () => {
          const uiRenderer = _makeUiRenderer();

          const htmlString = _makeIconString(hash, ext, width, height);
          const result = await uiRenderer.render(htmlString, width, height);
          const {data, anchors} = result;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(data, 0, 0);
          return canvas;
        };

        if (['glb', 'vrm', 'vox'].includes(ext)) {
          const {renderer, scene, camera} = _makeRenderer(width, height);

          let o;
          try {
            switch (ext) {
              case 'glb': {
                o = await _loadGltf();
                break;
              }
              case 'vrm': {
                o = await _loadVrm();
                break;
              }
              case 'vox': {
                o = await _loadVox();
                break;
              }
            }
          } catch (err) {
            console.warn(err);
          }
          if (o) {
            scene.add(o);

            const boundingBox = new THREE.Box3().setFromObject(o);
            const center = boundingBox.getCenter(new THREE.Vector3());
            const size = boundingBox.getSize(new THREE.Vector3());

            camera.position.x = 0;
            camera.position.y = center.y;
            camera.position.z = center.z - Math.max(
              size.y / 2 / Math.tan(Math.PI * camera.fov / 360),
              Math.abs(size.x) / 2,
              Math.abs(size.z) / 2
            ) * 1.2;
            camera.lookAt(center);
            camera.updateMatrixWorld();

            if (ext === 'vrm') {
              const _getTailBones = skeleton => {
                const result = [];
                const _recurse = bones => {
                  for (let i = 0; i < bones.length; i++) {
                    const bone = bones[i];
                    if (bone.children.length === 0) {
                      if (!result.includes(bone)) {
                        result.push(bone);
                      }
                    } else {
                      _recurse(bone.children);
                    }
                  }
                };
                _recurse(skeleton.bones);
                return result;
              };
              const _findFurthestParentBone = (bone, pred) => {
                let result = null;
                for (; bone; bone = bone.parent) {
                  if (pred(bone)) {
                    result = bone;
                  }
                }
                return result;
              };
              const _countCharacters = (name, regex) => {
                let result = 0;
                for (let i = 0; i < name.length; i++) {
                  if (regex.test(name[i])) {
                    result++;
                  }
                }
                return result;
              };
              const _findEye = (tailBones, left) => {
                const regexp = left ? /l/i : /r/i;
                const eyeBones = tailBones.map(tailBone => {
                  const eyeBone = _findFurthestParentBone(tailBone, bone => /eye/i.test(bone.name) && regexp.test(bone.name.replace(/eye/gi, '')));
                  if (eyeBone) {
                    return eyeBone;
                  } else {
                    return null;
                  }
                }).filter(spec => spec).sort((a, b) => {
                  const aName = a.name.replace(/shoulder/gi, '');
                  const aLeftBalance = _countCharacters(aName, /l/i) - _countCharacters(aName, /r/i);
                  const bName = b.name.replace(/shoulder/gi, '');
                  const bLeftBalance = _countCharacters(bName, /l/i) - _countCharacters(bName, /r/i);
                  if (!left) {
                    return aLeftBalance - bLeftBalance;
                  } else {
                    return bLeftBalance - aLeftBalance;
                  }
                });
                const eyeBone = eyeBones.length > 0 ? eyeBones[0] : null;
                if (eyeBone) {
                  return eyeBone;
                } else {
                  return null;
                }
              };

              const skinnedMeshes = [];
              o.traverse(o => {
                if (o.isSkinnedMesh) {
                  skinnedMeshes.push(o);
                }
              });
              skinnedMeshes.sort((a, b) => b.skeleton.bones.length - a.skeleton.bones.length);
              const skeletonSkinnedMesh = skinnedMeshes.find(o => o.skeleton.bones[0].parent) || null;
              const skeleton = skeletonSkinnedMesh && skeletonSkinnedMesh.skeleton;
              const tailBones = _getTailBones(skeleton);
              const eyes = [_findEye(tailBones, true), _findEye(tailBones, false)];
              if (eyes[0] && eyes[1]) {
                const center = eyes[0].getWorldPosition(new THREE.Vector3())
                  .add(eyes[1].getWorldPosition(new THREE.Vector3()))
                  .divideScalar(2);
                camera.position.copy(center)
                  .add(new THREE.Vector3(0, 0, 0.3));
                camera.quaternion.identity();
                camera.fov = 60;
                camera.updateProjectionMatrix();
              }
              console.log('got eyes', eyes);
            }

            if (type === 'jpg' || type === 'jpeg') {
              renderer.setClearColor(0xFFFFFF, 1);
            }
            renderer.render(scene, camera);
            return renderer.domElement;
          } else {
            return await _renderDefaultCanvas();
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
            const scaleFactor = img.width / width;
            const dstWidth = img.width / scaleFactor;
            const dstHeight = img.height / scaleFactor;

            const pixelsToAdd = dstWidth - dstHeight;
            const pixelsToAddD2 = pixelsToAdd / 2;

            ctx.drawImage(img, 0, pixelsToAddD2, dstWidth, dstHeight);
          } else { // horizontal padding needed
            const scaleFactor = img.height / height;
            const dstWidth = img.width / scaleFactor;
            const dstHeight = img.height / scaleFactor;

            const pixelsToAdd = dstHeight - dstWidth;
            const pixelsToAddD2 = pixelsToAdd / 2;

            ctx.drawImage(img, pixelsToAddD2, 0, dstWidth, dstHeight);
          }
          return canvas;
        } else {
          return await _renderDefaultCanvas();
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
      img.style.width = `${img.width / window.devicePixelRatio}px`;
      img.style.height = `${img.height / window.devicePixelRatio}px`;
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

      const o = await (async () => {
        switch (ext) {
          case 'glb':
            return await _loadGltf();
          case 'vrm':
            return await _loadVrm();
          case 'vox':
            return await _loadVox();
          default:
            return null;
        }
      })();
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
          // .add(new THREE.Vector3(0, size.y / 2, 0))
          .add(
            new THREE.Vector3(Math.cos(i + Math.PI / 2), 0, Math.sin(i + Math.PI / 2))
              .multiplyScalar(Math.max(size.x / 2, size.z / 2) * 2.2)
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

      const o = await (async () => {
        switch (ext) {
          case 'glb':
            return await _loadGltf();
          case 'vrm':
            return await _loadVrm();
          case 'vox':
            return await _loadVox();
          case 'png':
          case 'jpg':
            return await _loadImage();
          default:
            return null;
        }
      })();
      scene.add(o);

      if (o) {
        const boundingBox = new THREE.Box3().setFromObject(o);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        renderer.setClearColor(0xFFFFFF, 1);

        const frames = [];
        const _pushFrame = () => {
          const writeCanvas = document.createElement('canvas');
          writeCanvas.width = width;
          writeCanvas.height = height;
          // draw
          const writeCtx = writeCanvas.getContext('2d');
          writeCtx.drawImage(renderer.domElement, 0, 0);

          frames.push(writeCanvas);
        };
        if (isVrm && isVideo) {
          o.rig.setTopEnabled(false);
          o.rig.setHandEnabled(0, false);
          o.rig.setHandEnabled(1, false);
          o.rig.setBottomEnabled(false);
          o.rig.inputs.hmd.position.y = o.rig.height;

          let now = 0;
          const timeDiff = 1 / FPS;
          for (let i = 0; i < 100; i++) {
            o.rig.update(now, timeDiff);
            now += timeDiff * 1000;

            camera.position.set(0, o.rig.height / 2, -1.5);
            camera.lookAt(center);
            camera.updateMatrixWorld();
            renderer.render(scene, camera);

            _pushFrame();
          }
        } else if (isImage && isVideo) {
          for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.02) {
            o.position.y = Math.sin(i + Math.PI / 2) * 0.05;
            o.quaternion
              .premultiply(
                new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin((i + Math.PI / 2) * 1) * 0.005)
              )
            camera.position.copy(center)
              .add(
                new THREE.Vector3(
                  0,
                  0,
                  Math.max(size.x / 2, size.y / 2) * 2.2
                )
              );
            camera.lookAt(center);
            camera.updateMatrixWorld();
            renderer.render(scene, camera);

            _pushFrame();
          }
        } else {
          for (let i = 0; i < Math.PI * 2; i += Math.PI * 0.02) {
            camera.position.copy(center)
              .add(
                new THREE.Vector3(Math.cos(i + Math.PI / 2), 0, Math.sin(i + Math.PI / 2))
                  .multiplyScalar(Math.max(size.x / 2, size.z / 2) * 2.2)
              );
            camera.lookAt(center);
            camera.updateMatrixWorld();
            renderer.render(scene, camera);

            _pushFrame();
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const stream = canvas.captureStream(0);
        const track = stream.getVideoTracks()[0];
        const recordedChunks = [];

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm; codecs=vp9',
          videoBitsPerSecond: 5000000,
        });

        mediaRecorder.ondataavailable = event => {
          // console.log('got data', event.data);
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
            // console.log(recordedChunks);
            // download();
          } else {
            // ...
          }
        };
        const p = _makePromise();
        mediaRecorder.onstop = () => {
          // console.log('stop');
          p.accept();
        };
        mediaRecorder.start();
        for (const frame of frames) {
          ctx.drawImage(frame, 0, 0);
          track.requestFrame();
          await new Promise((accept, reject) => {
            setTimeout(accept, 1000 / FPS);
          });
        }
        mediaRecorder.stop();

        await p;

        const blob = new Blob(recordedChunks, {
          type: 'video/webm',
        });

        console.log('got video blob', blob);

        const video = document.createElement('video');
        video.muted = true;
        video.autoplay = true;
        await new Promise((accept, reject) => {
          video.oncanplaythrough = accept;
          video.onerror = reject;
          video.src = URL.createObjectURL(blob);
        });
        video.style.width = `${width / window.devicePixelRatio}px`;
        video.style.height = `${height / window.devicePixelRatio}px`;
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
