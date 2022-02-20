import * as THREE from 'three';
import {
  getRenderer,
  rootScene,
  /* sceneHighPriority,
  scene,
  sceneLowPriority, */
  camera,
} from './renderer.js';
import universe from './universe.js';
import metaversefileApi from 'metaversefile';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localVector2D3 = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();

const cameraHeight = 50;

// XXX TODO:
// add center reticle
// add compass border circle
// add compass north
// render at mose once per frame
// do not render avatars
// debug mirrors

const vertexShader = `\
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `\
  // uniform float iTime;
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

const pixelRatio = window.devicePixelRatio;

const _makeScene = (renderTarget, worldWidth, worldHeight) => {
  const scene = new THREE.Scene();
  
  // full screen quad mesh
  const mesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(worldWidth, worldHeight)
      .applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)),
    new THREE.ShaderMaterial({
      uniforms: {
        uTex: {
          value: renderTarget.texture,
          needsUpdate: true,
        },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
    }),
  );
  mesh.frustumCulled = false;
  scene.mesh = mesh;
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
    this.worldWidthD3 = worldWidth / 3;
    this.worldHeightD3 = worldHeight / 3;

    this.topCamera = new THREE.OrthographicCamera(
      -this.worldWidth/3*0.5,
      this.worldWidth/3*0.5,
      this.worldHeight/3*0.5,
      -this.worldHeight/3*0.5,
      0,
      1000
    );
    this.mapRenderTarget = _makeMapRenderTarget(this.width * pixelRatio, this.height * pixelRatio);
    this.canvasIndices = new Int32Array(3 * 3 * 2);
    this.canvasIndices.fill(0xffff);
    this.scene = _makeScene(this.mapRenderTarget, this.worldWidth, this.worldHeight);
    this.camera = new THREE.OrthographicCamera(-this.worldWidth/2, this.worldWidth/2, this.worldHeight/2, -this.worldHeight/2, 0, 1000);

    this.canvases = [];

    this.worldEpoch = 0;
    const worldload = e => {
      this.worldEpoch++;
    }
    universe.addEventListener('worldload', worldload);
    this.cleanup = () => {
      universe.removeEventListener('worldload', worldload);
    };

    this.lastBase = new THREE.Vector2(NaN, NaN);
    this.lastWorldEpoch = -1;
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
    const oldRenderTarget = renderer.getRenderTarget();
    const oldViewport = renderer.getViewport(localVector4D);
  
    const _render = (baseX, baseY, dx, dy) => {
      // set up top camera
      this.topCamera.position.set((baseX + dx) * this.worldWidthD3, cameraHeight, (baseY + dy) * this.worldHeightD3);
      this.topCamera.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          localVector.copy(this.topCamera.position),
          localVector2.set(this.topCamera.position.x, 0, this.topCamera.position.z),
          localVector3.set(0, 0, -1)
        )
      );
      this.topCamera.updateMatrixWorld();
      
      renderer.setViewport((dx+1) * this.width/3, (-dy+1) * this.height/3, this.width/3, this.height/3);
      // renderer.setViewport(0, 0, this.width, this.height);
      // for (const scene of regularScenes) {
        renderer.render(rootScene, this.topCamera);
      // }
    };
    const _updateTiles = () => {
      const baseX = Math.floor(localPlayer.position.x / this.worldWidthD3 + 0.5);
      const baseY = Math.floor(localPlayer.position.z / this.worldHeightD3 + 0.5);

      if (baseX !== this.lastBase.x || baseY !== this.lastBase.y || this.worldEpoch !== this.lastWorldEpoch) {
        renderer.setRenderTarget(this.mapRenderTarget);
        renderer.setViewport(0, 0, this.width, this.height);
        renderer.clear();
        
        let index = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ix = baseX + dx;
            const iy = baseY + dy;
            const requiredIndex = localVector2D3.set(ix, iy);
            _render(baseX, baseY, dx, dy);
            requiredIndex.toArray(this.canvasIndices, index * 2);
            index++;
          }
        }

        this.scene.mesh.position.set(baseX * this.worldWidthD3, 0, baseY * this.worldHeightD3);
        this.scene.mesh.updateMatrixWorld();

        this.lastBase.set(baseX, baseY);
        this.lastWorldEpoch = this.worldEpoch;
      }
    };
    _updateTiles();

    const _renderMiniMap = () => {
      renderer.setRenderTarget(oldRenderTarget);
      renderer.setViewport(0, 0, this.width, this.height);
      renderer.clear();
      this.camera.position.copy(localPlayer.position)
        .add(localVector.set(0, cameraHeight, 0));
      this.camera.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          this.camera.position,
          localPlayer.position,
          localVector2.set(0, 0, -1)
            .applyQuaternion(camera.quaternion),
        )
      );
      this.camera.updateMatrixWorld();
      renderer.render(this.scene, this.camera);
    };
    _renderMiniMap();

    const _copyToCanvases = () => {
      for (const canvas of this.canvases) {
        const {width, height, ctx} = canvas;
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

    renderer.clear();

    // pop old state
    renderer.setRenderTarget(oldRenderTarget);
    renderer.setViewport(oldViewport);
  }
  destroy() {
    for (const canvas of canvases) {
      canvas.parentNode.removeChild(canvas);
    }
    minimaps.splice(minimaps.indexOf(this), 1);
    this.cleanup();
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