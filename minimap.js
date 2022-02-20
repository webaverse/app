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
const localVector4D2 = new THREE.Vector4();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const cameraHeight = 15;

const _waitForFrame = () => new Promise(accept => {
  requestAnimationFrame(() => {
    accept();
  });
});

// XXX TODO:
// add compass border circle
// add compass north
// do not render avatars

const fullscreenVertexShader = `\
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;
const fullscreenFragmentShader = `\
  uniform sampler2D uTex;
  uniform vec4 uUvOffset;
  varying vec2 vUv;

  void main() {
    gl_FragColor = texture2D(uTex, (vUv + 1. +  uUvOffset.xy) * uUvOffset.zw);
  }
`;

const vertexShader = `\
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const floorFragmentShader = `\
  uniform sampler2D uTex;
  varying vec2 vUv;

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec4 c = texture2D(uTex, fragCoord);
    fragColor = c;
    fragColor.a = 1.;
  }

  void main() {
    mainImage(gl_FragColor, vUv);
  }
`;
const reticleFragmentShader = `\
  uniform sampler2D uTex;
  varying vec2 vUv;
  varying vec3 vPosition;

  #define PI 3.1415926535897932384626433832795

  void main() {
    float angle = (PI/4. + atan(vPosition.x, -vPosition.z)) / (PI/2.);
    float l = length(vPosition);
    // angle *= length(vPosition);
    // angle = min(angle, 1. - angle);
    float angleDistanceToEdge = min(angle, 1. - angle);
    angleDistanceToEdge *= l;
    gl_FragColor.a = 1.;
    gl_FragColor.r = angle;
    if (angleDistanceToEdge <= 0.04 || l >= 0.95) {
      gl_FragColor.rgb = vec3(1.);
    }
  }
`;

const _makeMapRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});

const pixelRatio = window.devicePixelRatio;

const _makeCopyScene = () => {
  const scene = new THREE.Scene();
  
  // full screen quad mesh
  const fullScreenQuadMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: {
        uTex: {
          value: null,
          needsUpdate: false,
        },
        uUvOffset: {
          value: new THREE.Vector4(),
          needsUpdate: true,
        }
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: fullscreenFragmentShader,
      depthTest: false,
    }),
  );
  fullScreenQuadMesh.frustumCulled = false;
  scene.add(fullScreenQuadMesh);
  scene.fullScreenQuadMesh = fullScreenQuadMesh;

  return scene;
};
const _makeScene = (renderTarget, worldWidth, worldHeight) => {
  const scene = new THREE.Scene();
  
  // floor map mesh
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(worldWidth, worldHeight)
      .applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)),
    new THREE.ShaderMaterial({
      uniforms: {
        uTex: {
          value: null,
          needsUpdate: false,
        },
      },
      vertexShader,
      fragmentShader: floorFragmentShader,
      depthTest: false,
    }),
  );
  floorMesh.frustumCulled = false;
  scene.add(floorMesh);
  scene.floorMesh = floorMesh;

  // map direction pointer mesh
  const reticleSize = worldWidth/6;
  const reticleMesh = new THREE.Mesh(
    new THREE.CircleGeometry(1, 4, Math.PI/2/2, Math.PI/2)
      .applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)),
    new THREE.ShaderMaterial({
      uniforms: {
        uTex: {
          value: renderTarget.texture,
          needsUpdate: true,
        },
      },
      vertexShader,
      fragmentShader: reticleFragmentShader,
    })
  );
  reticleMesh.scale.setScalar(reticleSize);
  reticleMesh.frustumCulled = false;
  scene.add(reticleMesh);
  scene.reticleMesh = reticleMesh;

  return scene;
};

const minimaps = [];
class MiniMap {
  constructor(width, height, worldWidth, worldHeight) {
    this.width = width;
    this.height = height;
    this.worldWidthD3 = Math.floor(worldWidth / 3);
    this.worldHeightD3 = Math.floor(worldHeight / 3);
    this.worldWidth = this.worldWidthD3 * 3;
    this.worldHeight = this.worldHeightD3 * 3;
    this.enabled = true;

    this.topCamera = new THREE.OrthographicCamera(
      -this.worldWidth/3*0.5,
      this.worldWidth/3*0.5,
      this.worldHeight/3*0.5,
      -this.worldHeight/3*0.5,
      0,
      1000
    );
    this.mapRenderTarget = _makeMapRenderTarget(this.width * pixelRatio, this.height * pixelRatio);
    this.mapRenderTarget2 = _makeMapRenderTarget(this.width * pixelRatio, this.height * pixelRatio);
    this.scene = _makeScene(this.mapRenderTarget, this.worldWidth, this.worldHeight);
    this.camera = new THREE.OrthographicCamera(-this.worldWidth/2, this.worldWidth/2, this.worldHeight/2, -this.worldHeight/2, 0, 1000);

    this.copyScene = _makeCopyScene();

    this.canvases = [];

    this.worldEpoch = 0;
    const worldload = e => {
      this.worldEpoch++;
    }
    universe.addEventListener('worldload', worldload);
    this.cleanup = () => {
      universe.removeEventListener('worldload', worldload);
    };

    this.running = false;
    this.queued = false;
    this.lastBase = new THREE.Vector2(NaN, NaN);
    this.lastWorldEpoch = -1;
  }
  resetCanvases() {
    this.canvases.length = 0;
  }
  addCanvas(canvas) {
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
      renderer.render(rootScene, this.topCamera);
    };
    const _copy = (srcRenderTarget, px, py, dx, dy) => {
      // set up copy scene
      this.copyScene.fullScreenQuadMesh.material.uniforms.uUvOffset.value.set(px, -py, 1/3, 1/3);
      this.copyScene.fullScreenQuadMesh.material.uniforms.uUvOffset.needsUpdate = true;
      this.copyScene.fullScreenQuadMesh.material.uniforms.uTex.value = srcRenderTarget.texture;
      this.copyScene.fullScreenQuadMesh.material.uniforms.uTex.needsUpdate = true;

      renderer.setViewport((dx+1) * this.width/3, (-dy+1) * this.height/3, this.width/3, this.height/3);
      renderer.render(this.copyScene, this.topCamera);
    };
    const _swapBuffers = () => {
      const tempRenderTarget = this.mapRenderTarget;
      this.mapRenderTarget = this.mapRenderTarget2;
      this.mapRenderTarget2 = tempRenderTarget;
    };
    const _updateTiles = () => {
      const baseX = Math.floor(localPlayer.position.x / this.worldWidthD3 + 0.5);
      const baseY = Math.floor(localPlayer.position.z / this.worldHeightD3 + 0.5);

      const _getPreviousOffset = (ax, ay, target) => {
        if (this.worldEpoch === this.lastWorldEpoch) {
          const previousOffset = target.set(ax, ay)
            .sub(this.lastBase);
          if (previousOffset.x >= -1 && previousOffset.x <= 1 && previousOffset.y >= -1 && previousOffset.y <= 1) {
            return target;
          } else {
            return null;
          }
        } else {
          return null;
        }
      };

      if (baseX !== this.lastBase.x || baseY !== this.lastBase.y || this.worldEpoch !== this.lastWorldEpoch) {
        if (!this.running) {
          (async () => {
            this.running = true;

            renderer.setRenderTarget(this.mapRenderTarget2);
            renderer.setViewport(0, 0, this.width, this.height);
            renderer.clear();

            this.scene.floorMesh.material.uniforms.uTex.value = this.mapRenderTarget2.texture;
            this.scene.floorMesh.material.uniforms.uTex.needsUpdate = true;
            this.scene.floorMesh.position.set(baseX * this.worldWidthD3, 0, baseY * this.worldHeightD3);
            this.scene.floorMesh.updateMatrixWorld();
            
            // copies
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ix = baseX + dx;
                const iy = baseY + dy;

                const previousOffset = _getPreviousOffset(ix, iy, localVector2D3);
                if (previousOffset) {
                  _copy(this.mapRenderTarget, previousOffset.x, previousOffset.y, dx, dy);
                }
              }
            }

            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ix = baseX + dx;
                const iy = baseY + dy;

                const previousOffset = _getPreviousOffset(ix, iy, localVector2D3);
                if (!previousOffset) {
                  // const oldRenderTarget = renderer.getRenderTarget();
                  // const oldViewport2 = renderer.getViewport(localVector4D2);
                  
                  renderer.setRenderTarget(this.mapRenderTarget2);
                  _render(baseX, baseY, dx, dy);
                  
                  renderer.setRenderTarget(oldRenderTarget);
                  renderer.setViewport(oldViewport);
                  
                  await _waitForFrame();
                }
              }
            }

            renderer.setRenderTarget(oldRenderTarget);

            _swapBuffers();

            this.lastBase.set(baseX, baseY);
            this.lastWorldEpoch = this.worldEpoch;

            this.running = false;

            if (this.queued) {
              this.queued = false;
              _updateTiles();
            }
          })();
        } else {
          this.queued = true;
        }
      }
    };
    _updateTiles();

    const _renderMiniMap = () => {
      this.scene.reticleMesh.position.set(localPlayer.position.x, cameraHeight - 1, localPlayer.position.z);
      localEuler.setFromQuaternion(localPlayer.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      this.scene.reticleMesh.quaternion.setFromEuler(localEuler);
      this.scene.reticleMesh.updateMatrixWorld();

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
      minimap.enabled && minimap.update(timestamp, timeDiff);
    }
  }
};

export default minimapManager;