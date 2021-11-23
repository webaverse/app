import * as THREE from "three";
import metaversefile from "metaversefile";
import * as Kalidokit from 'kalidokit/src/index.js';
import {Holistic} from '@mediapipe/holistic/holistic';
import {Camera} from '@mediapipe/camera_utils/camera_utils';
// import '@tensorflow/tfjs-backend-webgl';
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// import * as poseDetection from '@tensorflow-models/pose-detection';
// import Avatar from './avatars/avatars.js';
import {world} from './world.js';
// import {fitCameraToBox} from './util.js';
import {/*makeAvatar, */switchAvatar} from './player-avatar-binding.js';

const dimensions = {
  width: 640,
  height: 480,
};
const displayWidth = 640;
const points = {
  eye: {
    left: [130, 133, 160, 159, 158, 144, 145, 153],
    right: [263, 362, 387, 386, 385, 373, 374, 380],
  },
  brow: {
    right: [35, 244, 63, 105, 66, 229, 230, 231],
    left: [265, 464, 293, 334, 296, 449, 450, 451],
  },
  pupil: {
    right: [473, 474, 475, 476, 477],
    left: [468, 469, 470, 471, 472],
  },
};
const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

window.clamp = (v, min, max) => Math.min(Math.max(v, min), max);

let canvas = null;
let overlayCanvas = null;
let overlayCtx = null;
let avatar = null;
let previewScene = null;
let previewCamera = null;
let holistic = null;
let videoEl = null;

/* async function switchAvatar(oldAvatar, newApp) {
  let result;
  const promises = [];
  if (oldAvatar) {
    promises.push((async () => {
      await oldAvatar[appSymbol].setSkinning(false);
    })());
  }
  if (newApp) {
    promises.push((async () => {
      await newApp.setSkinning(true);

      // unwear old rig

      if (!newApp[avatarSymbol]) {
        newApp[avatarSymbol] = makeAvatar(newApp);
      }
      result = newApp[avatarSymbol];
    })());
  } else {
    result = null;
  }
  await Promise.all(promises);
  return result;
} */
/* const _lookAt = (camera, boundingBox) => {
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  camera.position.x = center.x;
  camera.position.y = center.y;
  camera.position.z = size.z / 2;
  fitCameraToBox(camera, boundingBox);
}; */

const loadPromise = Promise.all([
  ((async () => {
    {
      const defaultAvatarUrl = './avatars/scillia.vrm';
      const avatarApp = await metaversefile.load(defaultAvatarUrl);
      avatar = await switchAvatar(null, avatarApp);
      // avatar.inputs.hmd.position.y = avatar.height;
      
      avatar.setTopEnabled(true);
      avatar.setHandEnabled(0, false);
      avatar.setHandEnabled(1, false);
      avatar.setBottomEnabled(false);
      avatar.inputs.hmd.position.y = avatar.height;
      avatar.inputs.hmd.updateMatrixWorld();
      // avatar.update(1000);
    }
    {
      previewScene = new THREE.Scene();
        
      const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
      previewScene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 2);
      directionalLight.position.set(1, 2, 3);
      previewScene.add(directionalLight);

      previewScene.add(avatar.model);
    }
  })()),
  ((async () => {
    holistic = new Holistic({locateFile: (file) => {
      return `/holistic/${file}`;
    }});
    // holistic = new Holistic();
    holistic.setOptions({
      // staticImageMode: true,
      modelComplexity: 2,
      smoothLandmarks: true,
      // enableSegmentation: true,
      // smoothSegmentation: true,
      refineFaceLandmarks: true,
      // minDetectionConfidence: 0.9,
      // minTrackingConfidence: 0.9,
    });
    holistic.onResults(results => {
        // console.log('lol', results);
      
        // do something with prediction results
        // landmark names may change depending on TFJS/Mediapipe model version
        let facelm = results.faceLandmarks;
        let poselm = results.poseLandmarks;
        let poselm3D = results.ea;
        let rightHandlm = results.rightHandLandmarks;
        let leftHandlm = results.leftHandLandmarks;
        
        /* for (const lms of [
          poselm3D,
          rightHandlm,
          leftHandlm
        ]) {
          if (lms) {
            console.log('got lms', lms);
            for (const lm of lms) {
              if (typeof lm.z !== 'number') {
                debugger;
              }
              lm.z *= -1;
            }
          }
        } */

        if (facelm) {
          let faceRig = Kalidokit.Face.solve(facelm,{runtime:'mediapipe',video:videoEl})
          let poseRig = Kalidokit.Pose.solve(poselm3D,poselm,{runtime:'mediapipe',video:videoEl})
          let rightHandRig = rightHandlm ? Kalidokit.Hand.solve(rightHandlm,"Right") : null;
          let leftHandRig = leftHandlm ? Kalidokit.Hand.solve(leftHandlm,"Left") : null;
          
          // window.faceRig = faceRig;
          // window.lm = facelm;

          const _renderOverlay = () => {
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            
            const s = 5;
            const halfS = s/2;
            const _drawLm = (index, style) => {
              overlayCtx.fillStyle = style;
              const point = facelm[index];
              overlayCtx.fillRect(point.x - halfS, point.y - halfS, s, s);
            };
            _drawLm(points.pupil.left[0], '#FF0000');
            _drawLm(points.eye.left[0], '#00FF00');
            _drawLm(points.eye.left[1], '#0000FF');
            
            // _drawLm(points.pupil.right[0], '#FF0000');
            // _drawLm(points.eye.right[0], '#00FF00');
            // _drawLm(points.eye.right[1], '#0000FF');
          };
          _renderOverlay();

          // console.log('got', faceRig, poseRig);
          if (faceRig) {
            const {eye, head, mouth} = faceRig;
            const {
              shape: {A, E, I, O, U},
            } = mouth;
            const {degrees} = head;
            
            const pupilPos = (lm, side = "left") => {
              const eyeOuterCorner = new Kalidokit.Vector(lm[points.eye[side][0]]);
              const eyeInnerCorner = new Kalidokit.Vector(lm[points.eye[side][1]]);
              const eyeWidth = eyeOuterCorner.distance(eyeInnerCorner, 2);
              const midPoint = eyeOuterCorner.lerp(eyeInnerCorner, 0.5);
              const pupil = new Kalidokit.Vector(lm[points.pupil[side][0]]);
              // console.log('got', pupil.x, midPoint.x, eyeWidth, dx/eyeWidth, eyeInnerCorner.x, eyeOuterCorner.x);
              const dx = (midPoint.x - pupil.x) / (eyeWidth / 2);
              //eye center y is slightly above midpoint
              const dy = (midPoint.y - pupil.y) / (eyeWidth / 2);
              
              // console.log('got dx', dx, dy);

              return { x: dx, y: dy };
            };
            const lPupil = pupilPos(facelm, 'left');
            const rPupil = pupilPos(facelm, 'right');
            const pupil = {
              x: -(lPupil.x + rPupil.x) * 0.5,
              y: (lPupil.y + rPupil.y) * 0.5,
            };
            
            avatar.faceTracking = {
              head: new THREE.Vector3()
                .copy(head.degrees)
                .multiplyScalar(Math.PI/180),
              eyes: [1-eye.r, 1-eye.l],
              pupils: [
                [pupil.x, pupil.y],
                [pupil.x, pupil.y],
              ],
              vowels: [A, E, I, O, U],
            };
            // console.log('got', faceRig.pupil.x, faceRig.pupil.y);
          }
          /* avatar.handTracking = [
            rightHandRig ? rightHandRig : null,
            leftHandRig ? leftHandRig : null,
          ]; */
          if (poseRig) {
            avatar.inputs.hmd.quaternion.copy(y180Quaternion);
          }
          avatar.poseTracking = poseRig;
          avatar.handTracking = [
            leftHandRig,
            rightHandRig,
          ];
          if (leftHandRig) {
            avatar.setHandEnabled(1, true);
          }
          if (rightHandRig) {
            avatar.setHandEnabled(0, true);
          }
          
          window.poseRig = poseRig;
          if (rightHandRig) {
            window.rightHandRig = rightHandRig;
          }
          if (leftHandRig) {
            window.leftHandRig = leftHandRig;
          }
        }
    });
    /* model = await faceLandmarksDetection.load(
      faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
      {
        shouldLoadIrisModel: true,
        scoreThreshold: 0.9,
        maxFaces: 1,
      },
    );
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {runtime: 'tfjs'}); */
  })()),
]).then(() => {});
function waitForLoad() {
  return loadPromise;
}
function startCamera() {
  (async () => {
    {
      canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      document.body.appendChild(canvas);
      canvas.style.cssText = `\
        position: absolute;
        bottom: 0;
        right: ${displayWidth}px;
        width: ${displayWidth}px;
        z-index: 100;
        transform: rotateY(180deg);
      `;
      document.body.appendChild(canvas);
      // window.canvas2 = canvas;
    }
    const previewRenderer = new THREE.WebGLRenderer({
      canvas,
      // context,
      antialias: true,
      // alpha: true,
    });
    {
      videoEl = document.createElement('video');
      videoEl.width = dimensions.width;
      videoEl.height = dimensions.height;
      document.body.appendChild(videoEl);
      videoEl.style.cssText = `\
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${displayWidth}px;
        height: auto;
        z-index: 100;
        transform: rotateY(180deg);
      `;
    }
    {
      overlayCanvas = document.createElement('canvas');
      overlayCanvas.width = dimensions.width;
      overlayCanvas.height = dimensions.height;
      overlayCtx = overlayCanvas.getContext('2d');
      document.body.appendChild(overlayCanvas);
      
      overlayCanvas.style.cssText = videoEl.style.cssText;
      overlayCanvas.style.backgroundColor = '#FF000020';
      document.body.appendChild(overlayCanvas);
      
      previewCamera = new THREE.PerspectiveCamera(
        60,
        canvas.width / canvas.height,
        0.1,
        1000
      );
    }
    {
      // use Mediapipe's webcam utils to send video to holistic every frame
      const camera = new Camera(videoEl, {
        onFrame: async () => {
          await holistic.send({image: videoEl});
          
          // console.log('send image');
          // await holistic.send({image: videoEl});
          
          /* if (model && detector && avatar) {
            const [
              faces,
              poses,
            ] = await Promise.all([
              model.estimateFaces({
                input: videoEl,
                // predictIrises: false,
              }),
              detector.estimatePoses(videoEl),
            ]);
            
            avatar.faceTracking = null;
            
            if (faces.length > 0) {
              const faceLandmarks = faces[0].mesh;
              // console.log('got', faces[0].mesh);
              
              let faceRig = Kalidokit.Face.solve(faceLandmarks,{runtime:'tfjs',video:videoEl})
              // let poseRig = Kalidokit.Pose.solve(poselm3D,poselm,{runtime:'mediapipe',video:videoEl})
              // let rightHandRig = Kalidokit.Hand.solve(rightHandlm,"Right")
              // let leftHandRig = Kalidokit.Hand.solve(leftHandlm,"Left")
              
              // window.faceRig = faceRig;
              
              // console.log('got', faceRig, poseRig);
              if (faceRig) {
                const {eye, head, mouth} = faceRig;
                const {
                  shape: {A, E, I, O, U},
                } = mouth;
                const {degrees} = head;
                avatar.faceTracking = {
                  head: new THREE.Vector3()
                    .copy(head.degrees)
                    .multiplyScalar(Math.PI/180),
                  eyes: [1-eye.l, 1-eye.r],
                  pupil: [faceRig.pupil.x, faceRig.pupil.y],
                  vowels: [A, E, I, O, U],
                };
              }
            }
            if (poses.length > 0) {
              window.poses = poses;
              // const pose = poses[0];
              // let poseRig = Kalidokit.Pose.solve(pose,poselm,{runtime:'tfjs',video:videoEl})
            }
          } */
        },
        width: canvas.width,
        height: canvas.height,
      });
      camera.start();
    }
    {
      const distance = 0.7;
      // const h = avatar.height * 0.85;
      const h = avatar.height;
      previewCamera.position.set(0, h, distance);
      // previewCamera.position.set(0, avatar.height, -distance);
      previewCamera.lookAt(new THREE.Vector3(0, h, 0));
      previewCamera.updateMatrixWorld();
      
      world.appManager.addEventListener('frame', e => {
        const {timeDiff} = e.data;
        
        if (avatar) {
          avatar.update(timeDiff);
        }
        
        previewRenderer.clear();
        previewRenderer.render(previewScene, previewCamera);
      });
    }
  })();
}

export {
  waitForLoad,
  startCamera,
};