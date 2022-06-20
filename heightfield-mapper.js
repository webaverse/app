import * as THREE from 'three';
import {getRenderer, camera} from './renderer.js';
import {WebaverseShaderMaterial} from './materials.js';

//

const maxAnisotropy = 16;
const fullScreenQuadGeometry = new THREE.PlaneBufferGeometry(2, 2);
const fullscreenVertexShader = `\
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0., 1.0);
  }
`;

//

const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();

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

export class HeightfieldMapper {
  constructor({
    chunkSize,
    terrainSize,
    range,
  }) {
    this.chunkSize = chunkSize;
    this.terrainSize = terrainSize;
    this.range = range;

    this.heightfieldRenderTarget = _makeHeightfieldRenderTarget(terrainSize, terrainSize);
    this.heightfieldFourTapRenderTarget = _makeHeightfieldRenderTarget(terrainSize, terrainSize);
    this.heightfieldMinPosition = new THREE.Vector2();

    const heightfieldBase = new THREE.Vector3(-terrainSize / 2, 0, -terrainSize / 2);
    const heightfieldBase2D = new THREE.Vector2(heightfieldBase.x, heightfieldBase.z);
    const blankChunkData = new Float32Array(chunkSize * chunkSize);

    this.heightfieldScene = (() => {
      const chunkPlaneGeometry = new THREE.PlaneBufferGeometry(1, 1)
        .rotateX(-Math.PI / 2)
        .translate(0.5, 0, 0.5)
        .scale(this.chunkSize, 1, this.chunkSize);
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
            value: terrainSize,
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
      scene3.update = (heightfieldLocalWritePosition, heightfield = blankChunkData) => {
        fullscreenQuadMesh3.position.copy(heightfieldLocalWritePosition);
        fullscreenQuadMesh3.updateMatrixWorld();
        
        /* const heightfieldDrawTexture = new THREE.DataTexture(
          new Uint8ClampedArray(this.chunkSize * this.chunkSize),
          this.chunkSize,
          this.chunkSize,
          THREE.RedFormat,
          THREE.UnsignedByteType
        ); */

        heightfieldDrawTexture.image.data.set(heightfield);
        heightfieldDrawTexture.needsUpdate = true;

        // fullscreenMaterial3.uniforms.uHeightfieldDrawTexture.value = heightfieldDrawTexture;
        // fullscreenMaterial3.uniforms.uHeightfieldDrawTexture.needsUpdate = true;

        // console.log('got data', fullscreenQuadMesh3.position.x, fullscreenQuadMesh3.position.z, heightfieldDrawTexture.image.data);

        // console.log('render heightfield', heightfieldLocalWritePosition.x, heightfieldLocalWritePosition.y, heightfield);
      };
      scene3.camera = new THREE.OrthographicCamera(0, terrainSize, 0, -terrainSize, -1000, 1000);
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
          vec2 posDiff = pos2D - (uHeightfieldBase + uHeightfieldMinPosition) / uHeightfieldSize;
          vec2 uvHeightfield = posDiff;
          uvHeightfield = mod(uvHeightfield, 1.);
          gl_FragColor = texture2D(uHeightfield, uvHeightfield);
        }
      `;
      const fourTapFullscreenMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uHeightfield: {
            value: this.heightfieldRenderTarget.texture,
            needsUpdate: true,
          },
          uHeightfieldSize: {
            value: terrainSize,
            needsUpdate: true,
          },
          uHeightfieldBase: {
            value: heightfieldBase2D,
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
    })();

    if (range) {
      this.#setRange(range);
    }
  }
  #setRange = (() => {
    const localVector = new THREE.Vector3();
    return function(range) {
      localVector.copy(range.min)
        .divideScalar(this.chunkSize);
      this.updateCoord(localVector);
    };
  })();
  updateCoord(min2xCoord, target = null) {
    const oldHeightfieldPosition = localVector2D.copy(this.heightfieldMinPosition);
    const newHeightfieldPosition = localVector2D2.set(min2xCoord.x, min2xCoord.z)
      .multiplyScalar(this.chunkSize);

    const delta = target && target.copy(newHeightfieldPosition)
      .sub(oldHeightfieldPosition);

    // update scenes
    this.heightfieldFourTapScene.mesh.material.uniforms.uHeightfieldMinPosition.value.copy(newHeightfieldPosition);
    this.heightfieldFourTapScene.mesh.material.uniforms.uHeightfieldMinPosition.needsUpdate = true;

    this.heightfieldMinPosition.copy(newHeightfieldPosition);

    return delta;
  }
  renderHeightfieldUpdate(worldModPosition, heightfield) {
    const renderer = getRenderer();
    const context = renderer.getContext();
    // const camera = useCamera();

    {
      // update
      this.heightfieldScene.update(worldModPosition, heightfield);
      
      // push state
      const oldRenderTarget = renderer.getRenderTarget();
      context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);

      // render
      renderer.setRenderTarget(this.heightfieldRenderTarget);
      // renderer.clear();
      renderer.render(this.heightfieldScene, this.heightfieldScene.camera);

      // pop state
      renderer.setRenderTarget(oldRenderTarget);
      context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
    }
  }
  clearHeightfieldChunk(worldModPosition) {
    const renderer = getRenderer();
    const context = renderer.getContext();
    // const camera = useCamera();

    {
      // update
      this.heightfieldScene.update(worldModPosition);
      
      // push state
      const oldRenderTarget = renderer.getRenderTarget();
      context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);

      // render
      renderer.setRenderTarget(this.heightfieldRenderTarget);
      // renderer.clear();
      renderer.render(this.heightfieldScene, this.heightfieldScene.camera);

      // pop state
      renderer.setRenderTarget(oldRenderTarget);
      context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
    }
  }
  updateFourTapHeightfield() {
    const renderer = getRenderer();
    const context = renderer.getContext();

    {
      // update
      // heightfieldFourTapScene.update();
      
      // push state
      const oldRenderTarget = renderer.getRenderTarget();
      context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);

      // render
      renderer.setRenderTarget(this.heightfieldFourTapRenderTarget);
      // renderer.clear();
      renderer.render(this.heightfieldFourTapScene, camera);

      // pop state
      renderer.setRenderTarget(oldRenderTarget);
      context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
    }
  }
}