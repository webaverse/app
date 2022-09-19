import * as THREE from 'three';
import {getRenderer} from './renderer.js';
import {DoubleSidedPlaneGeometry} from './geometries.js';
import {WebaverseShaderMaterial} from './materials.js';
import {fitCameraToBoundingBox} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4D = new THREE.Vector4();
const localColor = new THREE.Color();
const localMatrix = new THREE.Matrix4();

const defaultSize = 2048;
const defaultNumAnimationFrames = 128;
const defaultNumSpritesheetFrames = 8;

//

class SpritesheetMesh extends THREE.Mesh {
  constructor({
    texture,
    worldSize,
    worldOffset,
    numAngles,
    numSlots,
  }) {
    const geometry = new DoubleSidedPlaneGeometry(worldSize, worldSize)
      .translate(worldOffset[0], worldOffset[1], worldOffset[2]);
    const material = new WebaverseShaderMaterial({
      uniforms: {
        uTex: {
          type: 't',
          value: texture,
          // needsUpdate: true,
        },
        uTime: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
        uY: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
      },
      vertexShader: `\
        precision highp float;
        precision highp int;

        // attribute vec3 barycentric;
        attribute float ao;
        attribute float skyLight;
        attribute float torchLight;

        // varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vBarycentric;
        varying float vAo;
        varying float vSkyLight;
        varying float vTorchLight;
        varying vec3 vSelectColor;
        varying vec2 vWorldUv;
        varying vec3 vPos;
        varying vec3 vNormal;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // vViewPosition = -mvPosition.xyz;
          vUv = uv;
        }
      `,
      fragmentShader: `\
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795

        // uniform float sunIntensity;
        uniform sampler2D uTex;
        // uniform vec3 uColor;
        uniform float uTime;
        uniform float uY;
        // uniform vec3 sunDirection;
        // uniform float distanceOffset;
        float parallaxScale = 0.3;
        float parallaxMinLayers = 50.;
        float parallaxMaxLayers = 50.;

        // varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vBarycentric;
        varying float vAo;
        varying float vSkyLight;
        varying float vTorchLight;
        varying vec3 vSelectColor;
        varying vec2 vWorldUv;
        varying vec3 vPos;
        varying vec3 vNormal;

        void main() {
          float angleIndex = floor(uY * ${numAngles.toFixed(8)});
          float i = angleIndex;
          float x = mod(i, ${numSlots.toFixed(8)});
          float y = (i - x) / ${numSlots.toFixed(8)};

          gl_FragColor = texture(
            uTex,
            vec2(0., 1. - 1./${numSlots.toFixed(8)}) +
              vec2(x, -y)/${numSlots.toFixed(8)} +
              vec2(1.-vUv.x, 1.-vUv.y)/${numSlots.toFixed(8)}
          );

          const float alphaTest = 0.5;
          if (gl_FragColor.a < alphaTest) {
            discard;
          }
          gl_FragColor.a = 1.;
          // gl_FragColor.r += 0.5;
        }
      `,
      transparent: true,
      // depthWrite: false,
      // polygonOffset: true,
      // polygonOffsetFactor: -2,
      // polygonOffsetUnits: 1,
      // side: THREE.DoubleSide,
    });
    super(geometry, material);
    /* this.customPostMaterial = new AvatarSpriteDepthMaterial(undefined, {
      tex,
    }); */

    // this.lastSpriteSpecName = '';
    // this.lastSpriteSpecTimestamp = 0;
  }
}

//

const _addPreviewLights = scene => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 2, 3);
  directionalLight.updateMatrixWorld();
  scene.add(directionalLight);
};

const sideScene = new THREE.Scene();
sideScene.autoUpdate = false;
_addPreviewLights(sideScene);
const sideCamera = new THREE.PerspectiveCamera();

const _makeSpritesheetRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping,
});
const createObjectSpriteAnimation = (app, {
  // canvas,
  size = defaultSize,
  numFrames = defaultNumAnimationFrames,
} = {}, {
  type = 'texture',
} = {}) => {
  // const {devicePixelRatio: pixelRatio} = window;

  // console.log('create object sprite', app, size, numFrames);

  const renderer = getRenderer();
  // const size = renderer.getSize(localVector2D);
  const pixelRatio = renderer.getPixelRatio();

  const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
  const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
  const frameSize = size / numFramesPerRow;

  // create render target
  let renderTarget;
  if (type === 'texture') {
    renderTarget = _makeSpritesheetRenderTarget(size * pixelRatio, size * pixelRatio);
  } else if (type === 'imageBitmap') {
    const requiredWidth = frameSize * numFramesPerRow * pixelRatio;
    const requiredHeight = frameSize * numFramesPerRow * pixelRatio;
    if (requiredWidth > renderer.domElement.width || requiredHeight > renderer.domElement.height) {
      // console.log('resize to', requiredWidth / pixelRatio, requiredHeight / pixelRatio, pixelRatio);
      renderer.setSize(requiredWidth / pixelRatio, requiredHeight / pixelRatio);
      renderer.setPixelRatio(pixelRatio);
    }
  }

  // push old state
  let oldRenderTarget;
  if (type === 'texture') {
    oldRenderTarget = renderer.getRenderTarget();
  }
  const oldViewport = renderer.getViewport(localVector4D);
  const oldClearColor = renderer.getClearColor(localColor);
  const oldClearAlpha = renderer.getClearAlpha();
  
  {
    const originalParent = app.parent;
    sideScene.add(app);
    sideScene.updateMatrixWorld();

    if (type === 'texture') {
      renderer.setRenderTarget(renderTarget);
    }
    renderer.setClearColor(0xffffff, 0);
    renderer.clear();

    const physicsObjects = app.getPhysicsObjects();
    const fitScale = 1.2;
    for (let i = 0; i < numFrames; i++) {
      const y = Math.floor(i / numFramesPerRow);
      const x = i - y * numFramesPerRow;
    
      // set up side camera
      const angle = (i / numFrames) * Math.PI * 2;
      if (physicsObjects.length > 0) {
        const physicsObject = physicsObjects[0];
        const {physicsMesh} = physicsObject;
        sideCamera.position.copy(physicsMesh.geometry.boundingBox.getCenter(localVector3))
          .add(
            localVector.set(Math.cos(angle), 0, Math.sin(angle))
              .applyQuaternion(app.quaternion)
              .multiplyScalar(2)
          );
        fitCameraToBoundingBox(sideCamera, physicsMesh.geometry.boundingBox, fitScale);
      } else {
        sideCamera.position.copy(app.position)
          .add(
            localVector.set(Math.cos(angle), 0, Math.sin(angle))
              .applyQuaternion(app.quaternion)
              .multiplyScalar(2)
          );
        sideCamera.quaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            sideCamera.position,
            app.position,
            localVector2.set(0, 1, 0)
          )
        );
      }
      sideCamera.updateMatrixWorld();
      
      // render side scene
      renderer.setViewport(x*frameSize, y*frameSize, frameSize, frameSize);
      renderer.render(sideScene, sideCamera);
    }

    if (originalParent) {
      originalParent.add(app);
    } else {
      sideScene.remove(app);
    }
  }

  // pop old state
  if (type === 'texture') {
    renderer.setRenderTarget(oldRenderTarget);
  }
  renderer.setViewport(oldViewport);
  renderer.setClearColor(oldClearColor, oldClearAlpha);

  // return result
  if (type === 'texture') {
    return {
      result: renderTarget.texture,
      numFrames,
      frameSize,
      numFramesPerRow,
    };
  } else if (type === 'imageBitmap') {
    return (async () => {
      const imageBitmap = await createImageBitmap(renderer.domElement, 0, 0, size, size, {
        // imageOrientation: 'flipY',
      });
      return {
        result: imageBitmap,
        numFrames,
        frameSize,
        numFramesPerRow,
      }
    })();
  } else {
    throw new Error('Unknown type');
  }
};
const createObjectSpriteSheet = async (app, {
  size = defaultSize,
  numFrames = defaultNumSpritesheetFrames,
} = {}) => {
  const renderer = getRenderer();
  const pixelRatio = renderer.getPixelRatio();

  const numFramesPow2 = Math.pow(2, Math.ceil(Math.log2(numFrames)));
  const numFramesPerRow = Math.ceil(Math.sqrt(numFramesPow2));
  const frameSize = size / numFramesPerRow;

  // create render target
  const requiredWidth = frameSize * numFramesPerRow * pixelRatio;
  const requiredHeight = frameSize * numFramesPerRow * pixelRatio;
  if (requiredWidth > renderer.domElement.width || requiredHeight > renderer.domElement.height) {
    renderer.setSize(requiredWidth / pixelRatio, requiredHeight / pixelRatio);
    renderer.setPixelRatio(pixelRatio);
  }

  // push old state
  const oldViewport = renderer.getViewport(localVector4D);
  const oldClearColor = renderer.getClearColor(localColor);
  const oldClearAlpha = renderer.getClearAlpha();
  
  const originalParent = app.parent;
  sideScene.add(app);
  sideScene.updateMatrixWorld();

  // clear
  renderer.setClearColor(0xffffff, 0);
  renderer.clear();

  // get size
  const fitScale = 1;
  const physicsObjects = app.getPhysicsObjects();
  let worldWidth, worldHeight, worldOffset;
  if (physicsObjects.length > 0) {
    const physicsObject = physicsObjects[0];
    const {physicsMesh} = physicsObject;
    
    const size = physicsMesh.geometry.boundingBox.getSize(localVector);
    worldWidth = Math.max(size.x, size.z);
    worldHeight = size.y;
    
    const center = physicsMesh.geometry.boundingBox.getCenter(localVector);
    worldOffset = center.toArray();
  } else {
    worldWidth = 1;
    worldHeight = 1;
    worldOffset = [0, 0, 0];
  }
  worldWidth *= fitScale;
  worldHeight *= fitScale;

  // render
  for (let i = 0; i < numFrames; i++) {
    const y = Math.floor(i / numFramesPerRow);
    const x = i - y * numFramesPerRow;
  
    // set up side camera
    const angle = (i / numFrames) * Math.PI * 2;
    if (physicsObjects.length > 0) {
      const physicsObject = physicsObjects[0];
      const {physicsMesh} = physicsObject;
      sideCamera.position.copy(physicsMesh.geometry.boundingBox.getCenter(localVector3))
        .add(
          localVector.set(Math.cos(angle), 0, Math.sin(angle))
            .applyQuaternion(app.quaternion)
            .multiplyScalar(2)
        );
      fitCameraToBoundingBox(sideCamera, physicsMesh.geometry.boundingBox, fitScale);
    } else {
      sideCamera.position.copy(app.position)
        .add(
          localVector.set(Math.cos(angle), 0, Math.sin(angle))
            .applyQuaternion(app.quaternion)
            .multiplyScalar(2)
        );
      sideCamera.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          sideCamera.position,
          app.position,
          localVector2.set(0, 1, 0)
        )
      );
    }
    sideCamera.updateMatrixWorld();
    
    // render side scene
    renderer.setViewport(x*frameSize, y*frameSize, frameSize, frameSize);
    renderer.render(sideScene, sideCamera);
  }

  // pop old state
  if (originalParent) {
    originalParent.add(app);
  } else {
    sideScene.remove(app);
  }
  renderer.setViewport(oldViewport);
  renderer.setClearColor(oldClearColor, oldClearAlpha);

  const imageBitmap = await createImageBitmap(renderer.domElement, 0, 0, size, size, {
    // imageOrientation: 'flipY',
  });
  return {
    result: imageBitmap,
    numFrames,
    frameSize,
    numFramesPerRow,
    worldWidth,
    worldHeight,
    worldOffset,
  };
};

export {
  createObjectSpriteAnimation,
  createObjectSpriteSheet,
  SpritesheetMesh,
};