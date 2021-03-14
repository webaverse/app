import * as THREE from './three.module.js';
import {scene, camera, renderer} from './app-object.js';
import runtime from './runtime.js';

const size = 1024;
const vertexShader = `\
  precision highp float;

  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fakeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
class ShaderToyPass {
  constructor({type, is, code, os, renderTarget}) {
    this.type = type;
    this.is = is;
    this.code = code;
    this.os = os;
    this.renderTarget = renderTarget;
    
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.RawShaderMaterial({
        uniforms: {
          modelViewMatrix: {
            value: new THREE.Matrix4().multiplyMatrices(fakeCamera.matrixWorldInverse, fakeCamera.matrixWorld),
          },
          projectionMatrix: {
            value: fakeCamera.projectionMatrix,
          },
        },
        vertexShader,
        fragmentShader: `
          precision highp float;

          varying vec2 vUv;

          void main() {
            gl_FragColor = vec4(vUv, 0.0, 1.0);
          }
        `,
        depthWrite: false,
        depthTest: false,
      })
    );
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
  }
  update() {
    {
      const [{buffer}] = this.os;
      if (buffer) {
        renderer.setRenderTarget(buffer);
        renderer.clear();
        renderer.render(this.scene, fakeCamera);
        renderer.setRenderTarget(null);
      }
    }

    if (this.type === 'buffer') {
      
    } else if (this.type === 'image') {
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear();
      renderer.render(this.scene, fakeCamera);
      renderer.setRenderTarget(null);
    } else {
      throw new Error('unknown pass type: ' + this.type);
    }
  }
}
class ShadertoyRenderer {
  constructor({shader}) {
    this.shader = shader;

    this.renderTarget = new THREE.WebGLRenderTarget(size, size);
    this.buffers = [];

    const geometry = new THREE.PlaneBufferGeometry(2, 2);
    /* const material = new THREE.ShaderMaterial({
    }); */
    const material = new THREE.MeshBasicMaterial({
      // color: 0xFF0000,
      map: this.renderTarget.texture,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-3, 1, 0);
    scene.add(mesh);
    console.log('add mesh', mesh, this.renderTarget.texture);

    const promises = [];
    this.renderPasses = []
    for (const rp of shader.renderpass) {
      const {type, inputs, outputs, code} = rp;

      const is = [];
      for (const input of inputs) {
        const {type, filepath, channel, sampler} = input;
        if (type === 'texture') {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          const promise = new Promise((accept, reject) => {
            img.addEventListener('load', () => {
              texture.needsUpdate = true;
              accept();
            });
            img.addEventListener('error', reject);
          });
          promises.push(promise);
          img.src = `https://https-shadertoy-com.proxy.exokit.org${filepath}`;
          
          const texture = new THREE.Texture(img);
          texture.channel = channel;
          is.push(texture);
        } else if (type === 'buffer') {
          // console.log('load buffer', input);
          if (!this.buffers[channel]) {
            this.buffers[channel] = new THREE.WebGLRenderTarget(size, size);
            this.buffers[channel].channel = channel;
          }
          const buffer = this.buffers[channel];
          is.push(buffer);
        } else {
          throw new Error('unknown input type: ' + input);
        }
      }
      
      const os = [];
      for (const output of outputs) {
        const {channel} = output;
        if (!this.buffers[channel]) {
          this.buffers[channel] = new THREE.WebGLRenderTarget(size, size);
          this.buffers[channel].channel = channel;
        }
        const buffer = this.buffers[channel];
        const o = {
          channel,
          buffer,
        };
        os.push(o);
      }

      const renderPass = new ShaderToyPass({
        type,
        is,
        code,
        os,
        renderTarget: this.renderTarget,
      });
      this.renderPasses.push(renderPass);
    }
    
    this.loadPromise = Promise.all(promises)
      .then(() => {});
  }
  waitForLoad() {
    return this.loadPromise;
  }
  update() {
    for (const renderPass of this.renderPasses) {
      renderPass.update();
    }
  }
}

const shadertoyRenderers = [];
(async () => {
  const res = await fetch('./shaders.json');
  const shaders = await res.json();
  const shader = shaders.shaders.find(shader => shader.info.name === 'Fork LIC 2D / f avaer 088');
  const shadertoyRenderer = new ShadertoyRenderer({shader});
  await shadertoyRenderer.waitForLoad();
  shadertoyRenderers.push(shadertoyRenderer);
})();

const shaderToy = {
  update() {
    for (const shadertoyRenderer of shadertoyRenderers) {
      shadertoyRenderer.update();
    }
  }
};
export default shaderToy;