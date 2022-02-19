import * as THREE from 'three';
import {
  getRenderer,
  sceneHighPriority,
  scene,
  sceneLowPriority,
  camera,
} from './renderer.js';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {world} from './world.js';
import metaversefileApi from 'metaversefile';
// import {fitCameraToBoundingBox} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localVector2D3 = new THREE.Vector2();
const localVector2D4 = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();

const regularScenes = [
  scene,
  sceneHighPriority,
];
const cameraHeight = 50;

const vertexShader = `\
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1., 1.);
  }
`;
const fragmentShader = `\
  uniform float iTime;
  // uniform int iFrame;
  uniform sampler2D uTex;
  varying vec2 vUv;

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec4 c = texture2D(uTex, fragCoord);
    fragColor = c;
    fragColor.a = 1.;
    // fragColor.bg = vUv;
    // fragColor.rgb = vec3(1., 0., 0.);
  }

  void main() {
    mainImage(gl_FragColor, vUv);
  }
`;

const _makeMapRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});

// const minimapWorldSize = 100;
const pixelRatio = window.devicePixelRatio;

const _makeScene = renderTarget => {
  const scene = new THREE.Scene();
  
  // full screen quad mesh
  const mesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    new THREE.ShaderMaterial({
      // map: renderTarget.texture,
      uniforms: {
        uTex: {
          value: renderTarget.texture,
          // needsUpdate: true,
        },
      },
      vertexShader,
      fragmentShader,
      // transparent: true,
      depthTest: false,
      // depthWrite: false,
    }),
  );
  mesh.frustumCulled = false;
  scene.add(mesh);

  return scene;
};

const minimaps = [];
class MiniMap {
  constructor(width, height, worldWidth, worldHeight) {
    this.width = width;
    this.height = height;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.topCamera = new THREE.OrthographicCamera(
      -this.worldWidth*0.5,
      this.worldWidth*0.5,
      this.worldHeight*0.5,
      -this.worldHeight*0.5,
      0,
      1000
    );
    this.mapRenderTarget = _makeMapRenderTarget(this.width * pixelRatio, this.height * pixelRatio);
    this.canvasIndices = new Int32Array(3 * 3 * 2);
    this.canvasIndices.fill(0xffff);
    this.scene = _makeScene(this.mapRenderTarget);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.canvases = [];
  }
  resetCanvases() {
    this.canvases.length = 0;
  }
  addCanvas(canvas) {
    // const {width, height} = canvas;
    // this.width = Math.max(this.width, width);
    // this.height = Math.max(this.height, height);

    const ctx = canvas.getContext('2d');
    canvas.ctx = ctx;

    this.canvases.push(canvas);
  }
  update(timestamp, timeDiff) {
    const localPlayer = metaversefileApi.useLocalPlayer();

    // console.log('update');

    const renderer = getRenderer();
    const size = renderer.getSize(localVector2D);
    // a Vector2 representing the largest power of two less than or equal to the current canvas size
    const sizePowerOfTwo = localVector2D2.set(
      Math.pow(2, Math.floor(Math.log(size.x) / Math.log(2))),
      Math.pow(2, Math.floor(Math.log(size.y) / Math.log(2))),
    );
    if (sizePowerOfTwo.x < this.width || sizePowerOfTwo.y < this.height) {
      console.warn('renderer is too small');
      return;
    }

    // push old state
    // const oldParent = app.parent;
    const oldRenderTarget = renderer.getRenderTarget();
    const oldViewport = renderer.getViewport(localVector4D);
  
    const _render = (dx, dy) => {
      // set up top camera
      this.topCamera.position.copy(localPlayer.position)
        .add(localVector.set(dx * this.worldWidth, cameraHeight, -dy * this.worldHeight));
      this.topCamera.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          localVector.copy(localPlayer.position)
            .add(localVector3.set(0, cameraHeight, 0)),
          localPlayer.position,
          localVector2.set(0, 0, -1)
            // .applyQuaternion(camera.quaternion),
        )
      );
      this.topCamera.updateMatrixWorld();
      
      renderer.setViewport((dx+1) * this.width/3, (dy+1) * this.height/3, this.width/3, this.height/3);
      // renderer.setViewport(0, 0, this.width, this.height);
      for (const scene of regularScenes) {
        renderer.render(scene, this.topCamera);
      }
    };
    const _updateTiles = () => {
      let first = true;

      let index = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ix = Math.floor((localPlayer.position.x + dx * this.worldWidth/2) / this.worldWidth);
          const iy = Math.floor((localPlayer.position.y + dy * this.worldHeight/2) / this.worldHeight);
          const requiredIndex = localVector2D3.set(ix, iy);
          const currentIndex = localVector2D4.fromArray(this.canvasIndices, index * 2);
          // if (!currentIndex.equals(requiredIndex)) {
            if (first) {
              renderer.setRenderTarget(this.mapRenderTarget);
              renderer.setViewport(0, 0, this.width, this.height);
              renderer.clear();
              first = false;
            }
            _render(dx, dy, index);
            requiredIndex.toArray(this.canvasIndices, index * 2);
          // }
          index++;
        }
      }
    };
    _updateTiles();

    const _renderMiniMap = () => {
      renderer.setRenderTarget(oldRenderTarget);
      renderer.setViewport(0, 0, this.width, this.height);
      renderer.clear();
      renderer.render(this.scene, this.camera);
    };
    _renderMiniMap();

    const _copyToCanvases = () => {
      for (const canvas of this.canvases) {
        const {width, height, ctx} = canvas;
        // ctx.fillStyle = '#F00';
        // ctx.fillRect(0, 0, width, height);
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(
          renderer.domElement,
          0,
          size.y * pixelRatio - this.height * pixelRatio,
          this.width * pixelRatio,
          this.height * pixelRatio,
          0,
          0,
          width,
          height
        );
      }
    };
    _copyToCanvases();

    // pop old state
    renderer.setRenderTarget(oldRenderTarget);
    renderer.setViewport(oldViewport);
  }
  destroy() {
    for (const canvas of canvases) {
      canvas.parentNode.removeChild(canvas);
    }
    minimaps.splice(minimaps.indexOf(this), 1);
  }
}

const minimapManager = {
  createMiniMap(width, height, worldWidth, worldHeight) {
    const minimap = new MiniMap(width, height, worldWidth, worldHeight);
    minimaps.push(minimap);
    return minimap;
  },
  update(timestamp, timeDiff) {
    for (const minimap of minimaps) {
      minimap.update(timestamp, timeDiff);
    }
  }
};

export default minimapManager;