import * as THREE from 'three';
import {getRenderer, camera} from './renderer.js';
import {WebaverseShaderMaterial} from './materials.js';

//

const maxAnisotropy = 16;
/* const fullScreenQuadGeometry = new THREE.PlaneGeometry(2, 2);
const fullscreenVertexShader = `\
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0., 1.0);
  }
`; */

//

const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localVector2D = new THREE.Vector2();
// const localQuaternion = new THREE.Quaternion();
// const localMatrix = new THREE.Matrix4();

//

const _makeHeightfieldRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  // minFilter: THREE.NearestFilter,
  // magFilter: THREE.NearestFilter,
  format: THREE.RedFormat,
  type: THREE.FloatType,
  // wrapS: THREE.RepeatWrapping,
  // wrapT: THREE.RepeatWrapping,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping,
  stencilBuffer: false,
  anisotropy: maxAnisotropy,
  // flipY: false,
});

export class HeightfieldMapper /* extends EventTarget */ {
  constructor({
    procGenInstance,
    size,
    debug = false,
  }) {
    // super();

    this.procGenInstance = procGenInstance;
    this.size = size;
    // this.debug = debug;

    this.lastUpdateCoord = new THREE.Vector3(NaN, NaN, NaN);
    
    this.queued = false;
    this.queuedPosition = new THREE.Vector3();

    this.heightfieldRenderTarget = _makeHeightfieldRenderTarget(size, size);
    this.heightfieldFourTapRenderTarget = _makeHeightfieldRenderTarget(size, size);
    this.heightfieldTexture = new THREE.DataTexture(
      new Float32Array(size * size),
      size,
      size,
      THREE.RedFormat,
      THREE.FloatType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearFilter,
    );
    this.heightfieldTexture.flipY = true;

    this.heightfieldMinPosition = new THREE.Vector2();

    // this.blankChunkData = new Float32Array(chunkSize * chunkSize);

    /* this.heightfieldScene = (() => {
      const chunkPlaneGeometry = new THREE.PlaneGeometry(1, 1)
        .rotateX(-Math.PI / 2)
        .translate(0.5, 0, 0.5)
        // .scale(this.chunkSize, 1, this.chunkSize);
      const fullscreenMatrixVertexShader = `\
        uniform float uHeightfieldSize;  
        varying vec2 vUv;
      
        void main() {
          vUv = uv;
          vUv.y = 1. - vUv.y;
          // vUv += 0.5 / uHeightfieldSize;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      const fullscreenFragmentShader3 = `\
        uniform sampler2D uHeightfieldDrawTexture;
        uniform float uHeightfieldSize;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          // uv.x += 0.5 / uHeightfieldSize;
          // uv.y -= 0.5 / uHeightfieldSize;
          // uv += 0.5 / uHeightfieldSize;
          float heightValue = texture2D(uHeightfieldDrawTexture, uv).r;
          
          gl_FragColor.rgb = vec3(heightValue);
          gl_FragColor.a = 1.;
        }
      `;
      const heightfieldDrawTexture = new THREE.DataTexture(
        new Float32Array(chunkSize * chunkSize),
        chunkSize,
        chunkSize,
        THREE.RedFormat,
        THREE.FloatType
      );
      heightfieldDrawTexture.minFilter = THREE.LinearFilter;
      heightfieldDrawTexture.magFilter = THREE.LinearFilter;
      const fullscreenMaterial3 = new WebaverseShaderMaterial({
        uniforms: {
          uHeightfieldDrawTexture: {
            value: heightfieldDrawTexture,
            needsUpdate: true,
          },
          uHeightfieldSize: {
            value: size,
            needsUpdate: true,
          },
        },
        vertexShader: fullscreenMatrixVertexShader,
        fragmentShader: fullscreenFragmentShader3,
        // side: THREE.DoubleSide,
      });
      const fullscreenQuadMesh3 = new THREE.Mesh(chunkPlaneGeometry, fullscreenMaterial3);
      fullscreenQuadMesh3.frustumCulled = false;
      const scene3 = new THREE.Scene();
      scene3.add(fullscreenQuadMesh3);
      scene3.update = (heightfieldLocalWritePosition, heightfield) => {
        fullscreenQuadMesh3.position.copy(heightfieldLocalWritePosition);
        fullscreenQuadMesh3.updateMatrixWorld();

        heightfieldDrawTexture.image.data.set(heightfield);
        heightfieldDrawTexture.needsUpdate = true;

        fullscreenMaterial3.uniforms.uHeightfieldDrawTexture.value = heightfieldDrawTexture;
        fullscreenMaterial3.uniforms.uHeightfieldDrawTexture.needsUpdate = true;

        // console.log('got data', fullscreenQuadMesh3.position.x, fullscreenQuadMesh3.position.z, heightfieldDrawTexture.image.data);

        // console.log('render heightfield', heightfieldLocalWritePosition.x, heightfieldLocalWritePosition.y, heightfield);
      };
      scene3.camera = new THREE.OrthographicCamera(0, size, 0, -size, -1000, 1000);
      scene3.camera.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      scene3.camera.updateMatrixWorld();
      return scene3;
    })();
    this.heightfieldFourTapScene = (() => {
      const fullscreenFragmentShader = `\
        uniform sampler2D uHeightfield;
        uniform vec2 uHeightfieldBase;
        uniform vec2 uHeightfieldMinPosition;
        uniform float uHeightfieldSize;
        varying vec2 vUv;

        void main() {
          vec2 pos2D = vUv;
          vec2 posDiff = pos2D - 0.5 - (uHeightfieldMinPosition) / uHeightfieldSize;
          vec2 uvHeightfield = posDiff;
          uvHeightfield = mod(uvHeightfield, 1.);
          gl_FragColor = texture2D(uHeightfield, uvHeightfield);
        }
      `;
      const fourTapFullscreenMaterial = new WebaverseShaderMaterial({
        uniforms: {
          uHeightfield: {
            value: this.heightfieldRenderTarget.texture,
            needsUpdate: true,
          },
          uHeightfieldSize: {
            value: size,
            needsUpdate: true,
          },
          uHeightfieldMinPosition: {
            value: new THREE.Vector2(),
            needsUpdate: true,
          }
        },
        vertexShader: fullscreenVertexShader,
        fragmentShader: fullscreenFragmentShader,
      });
      const fourTapQuadMesh = new THREE.Mesh(fullScreenQuadGeometry, fourTapFullscreenMaterial);
      fourTapQuadMesh.frustumCulled = false;
      const scene = new THREE.Scene();
      scene.add(fourTapQuadMesh);
      scene.mesh = fourTapQuadMesh;
      return scene;
    })(); */

    this.debugMesh = null;
    if (debug) {
      this.debugMesh = (() => {
        const planeGeometry = new THREE.PlaneGeometry(
          size - 1,
          size - 1,
          size - 1,
          size - 1
        )
        .translate(
          -0.5,
          0.5,
          0
        )
        .rotateX(-Math.PI / 2);

        const fullscreenVertexShader = `\
          uniform sampler2D uHeightfield;  
          varying vec2 vUv;

          void main() {
            vUv = uv;
            vec3 p = position;
            float textureHeight = texture2D(uHeightfield, vUv).r;
            p.y += textureHeight;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `;
        const fullscreenFragmentShader = `\
          /* uniform sampler2D uHeightfield;
          uniform vec2 uHeightfieldBase;
          uniform vec2 uHeightfieldMinPosition;
          uniform float uHeightfieldSize; */
          varying vec2 vUv;

          void main() {
            /* vec2 pos2D = vUv;
            vec2 posDiff = pos2D - 0.5 - (uHeightfieldMinPosition) / uHeightfieldSize;
            vec2 uvHeightfield = posDiff;
            uvHeightfield = mod(uvHeightfield, 1.); */

            // gl_FragColor = vec4(vUv.x, 0., vUv.y, 0.5);
            gl_FragColor = vec4(vUv.x, 0., vUv.y, 1.);
          }
        `;
        const debugMaterial = new WebaverseShaderMaterial({
          uniforms: {
            uHeightfield: {
              value: this.heightfieldTexture,
              needsUpdate: true,
            },
          },
          vertexShader: fullscreenVertexShader,
          fragmentShader: fullscreenFragmentShader,
          side: THREE.DoubleSide,
          // transparent: true,
        });
        const debugMesh = new THREE.Mesh(planeGeometry, debugMaterial);
        debugMesh.frustumCulled = false;
        return debugMesh;
      })();
    }
  }
  update(position) {
    if (!this.updating) {
      (async () => {
        this.updating = true;
      
        const coord = localVector.copy(position);
        coord.x = Math.floor(coord.x);
        coord.y = 0;
        coord.z = Math.floor(coord.z);
        if (!this.lastUpdateCoord.equals(coord)) {
          this.lastUpdateCoord.copy(coord);

          if (this.debugMesh) {
            const lod = 1;
            const heightfield = await this.procGenInstance.dcWorkerManager.getHeightfieldRange(
              coord.x - this.size / 2,
              coord.z - this.size / 2,
              this.size,
              this.size,
              lod
            );

            this.heightfieldTexture.image.data.set(heightfield);
            this.heightfieldTexture.needsUpdate = true;

            this.debugMesh.position.copy(coord);
            this.debugMesh.updateMatrixWorld();
          }
        }

        this.updating = false;
        
        if (this.queued) {
          this.queued = false;
          this.update(this.queuedPosition);
        }
      })();
    } else {
      this.queued = true;
      this.queuedPosition.copy(position);
    }
  }
  renderHeightfieldUpdate(worldModPosition, heightfield) {
    const renderer = getRenderer();

    {
      // update
      this.heightfieldScene.update(worldModPosition, heightfield);
      
      // push state
      const oldRenderTarget = renderer.getRenderTarget();

      // render
      renderer.setRenderTarget(this.heightfieldRenderTarget);
      // renderer.clear();
      renderer.render(this.heightfieldScene, this.heightfieldScene.camera);

      // pop state
      renderer.setRenderTarget(oldRenderTarget);
    }
  }
  /* clearHeightfieldChunk(worldModPosition) {
    const renderer = getRenderer();
    // const camera = useCamera();

    {
      // update
      this.heightfieldScene.update(worldModPosition, this.blankChunkData);
      
      // push state
      const oldRenderTarget = renderer.getRenderTarget();

      // render
      renderer.setRenderTarget(this.heightfieldRenderTarget);
      // renderer.clear();
      renderer.render(this.heightfieldScene, this.heightfieldScene.camera);

      // pop state
      renderer.setRenderTarget(oldRenderTarget);
    }
  } */
  /* updateFourTapHeightfield() {
    const renderer = getRenderer();

    {
      // update
      // heightfieldFourTapScene.update();
      
      // push state
      const oldRenderTarget = renderer.getRenderTarget();

      // render
      renderer.setRenderTarget(this.heightfieldFourTapRenderTarget);
      // renderer.clear();
      renderer.render(this.heightfieldFourTapScene, camera);

      // pop state
      renderer.setRenderTarget(oldRenderTarget);
    }
  } */
}