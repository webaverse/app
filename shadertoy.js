import * as THREE from 'three';
import {scene, camera, getRenderer} from './app-object.js';
import {copyScenePlaneGeometry, copySceneVertexShader, copyScene, copySceneCamera} from './shaders.js';

/* const size = 1024;
const worldSize = 2;
const hackShaderName = 'anime radial'; */

const _makeRenderTarget = (width, height) => new THREE.WebGLRenderTarget(width, height, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  encoding: THREE.sRGBEncoding,
});
class ShaderToyPass {
  constructor({type, is, code, os, renderTarget}, parent) {
    this.type = type;
    this.is = is;
    this.code = code;
    this.os = os;
    this.renderTarget = renderTarget;
    this.parent = parent;

    const uniforms = {
      modelViewMatrix: {
        value: new THREE.Matrix4().multiplyMatrices(copySceneCamera.matrixWorldInverse, copySceneCamera.matrixWorld),
      },
      projectionMatrix: {
        value: copySceneCamera.projectionMatrix,
      },
      iResolution: {
        value: new THREE.Vector3(renderTarget.width, renderTarget.height, 1),
      },
      iTime: {
        value: parent.getITime(),
      },
      iFrame: {
        value: parent.getIFrame(),
      },
      iMouse: {
        value: new THREE.Vector4(0, 0, 0, 0),
      },
      iSampleRate: {
        value: 44100,
      },
    };
    for (const input of is) {
      let {channel, buffer} = input;
      if (!buffer.isTexture) {
        buffer = buffer.texture;
      }
      uniforms['iChannel' + channel] = {
        value: buffer,
      };
      if (!uniforms['iChannelResolution']) {
        uniforms['iChannelResolution'] = {
          value: [],
        };
      }
      uniforms['iChannelResolution'].value[channel] = new THREE.Vector3(buffer.image.width, buffer.image.height, 1);
    }
    this.mesh = new THREE.Mesh(
      copyScenePlaneGeometry,
      new THREE.RawShaderMaterial({
        uniforms,
        vertexShader: copySceneVertexShader,
        fragmentShader: `#version 300 es
          precision highp float;

          uniform vec3      iResolution;           // viewport resolution (in pixels)
          uniform float     iTime;                 // shader playback time (in seconds)
          uniform float     iTimeDelta;            // render time (in seconds)
          uniform int       iFrame;                // shader playback frame
          uniform float     iChannelTime[4];       // channel playback time (in seconds)
          uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
          uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
          uniform sampler2D iChannel0;          // input channel. XX = 2D/Cube
          uniform sampler2D iChannel1;          // input channel. XX = 2D/Cube
          uniform sampler2D iChannel2;          // input channel. XX = 2D/Cube
          uniform sampler2D iChannel3;          // input channel. XX = 2D/Cube
          uniform vec4      iDate;                 // (year, month, day, time in seconds)
          uniform float     iSampleRate;           // sound sample rate (i.e., 44100)
          in vec2 vUv;
          out vec4 fragColor;
          
          ${this.code}

          void main() {
            vec2 fragCoord = vUv * iResolution.xy;
            mainImage(fragColor, fragCoord);
            fragColor.a = 1.;
            // ${this.type === 'image' ? `fragColor.a = 1.;` : ''};
            // fragColor = vec4(vUv, 0.0, 1.0);
          }
        `,
        depthWrite: false,
        depthTest: false,
      })
    );
    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);
    
    this._copyBuffer = _makeRenderTarget(renderTarget.width, renderTarget.height);
  }
  update() {
    this.mesh.material.uniforms.iTime.value = this.parent.getITime();
    this.mesh.material.uniforms.iFrame.value = this.parent.getIFrame();
    
    const renderer = getRenderer();
    {
      const [{buffer} = {}] = this.os;
      if (buffer) {
        const oldRenderTarget = renderer.getRenderTarget();
        if (this.is.some(input => input.buffer === buffer)) {
          renderer.setRenderTarget(this._copyBuffer);
          renderer.clear();
          renderer.render(this.scene, copySceneCamera);

          copyScene.mesh.material.uniforms.tex.value = this._copyBuffer.texture;
          renderer.setRenderTarget(buffer);
          renderer.clear();
          renderer.render(copyScene, copySceneCamera);
        } else {
          renderer.setRenderTarget(buffer);
          renderer.clear();
          renderer.render(this.scene, copySceneCamera);
        }
        
        renderer.setRenderTarget(oldRenderTarget);
      }
    }

    if (this.type === 'buffer') {
      
    } else if (this.type === 'image') {
      const oldRenderTarget = renderer.getRenderTarget();

      renderer.setRenderTarget(this.renderTarget);
      renderer.clear();
      renderer.render(this.scene, copySceneCamera);

      renderer.setRenderTarget(oldRenderTarget);
    } else {
      throw new Error('unknown pass type: ' + this.type);
    }
  }
}
const _makeRenderTargetMesh = (renderTarget, worldWidth, worldHeight) => {
  const geometry = new THREE.PlaneBufferGeometry(worldWidth, worldHeight);
  const material = new THREE.MeshBasicMaterial({
    // color: 0xFF0000,
    map: renderTarget.texture,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.onBeforeRender = () => {
    const renderer = getRenderer();
    const context = renderer.getContext();
    context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);
  };
  mesh.onAfterRender = () => {
    const renderer = getRenderer();
    const context = renderer.getContext();
    context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
  };
  return mesh;
};
/* let numRenderTargetMeshes = 0;
const _addDebugRenderTargetMesh = renderTarget => {
  const mesh = _makeRenderTargetMesh(renderTarget);
  mesh.position.set(-3 + numRenderTargetMeshes * worldSize, worldSize/2, -1);
  scene.add(mesh);
  numRenderTargetMeshes++;
}; */
class ShadertoyRenderer {
  constructor(shader, {size = 1024, worldSize = 1}) {
    // this.shader = shader;

    this.renderTarget = _makeRenderTarget(size, size);
    this.textures = {};
    this.buffers = {};
    this.currentTime = 0;
    this.frame = 0;

    const _ensureInput = input => {
      const {id, type, filepath, sampler} = input;
      if (type === 'texture') {
        if (!this.textures[id]) {
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
          this.textures[id] = texture;
        }
        return this.textures[id];
      } else if (type === 'buffer') {
        if (!this.buffers[id]) {
          this.buffers[id] = _makeRenderTarget(size, size);
        }
        return this.buffers[id];
      } else {
        throw new Error('unknown input type: ' + type);
      }
    };

    const promises = [];
    this.renderPasses = [];
    let renderPassIos = [];
    const _initRenderPassIos = () => {
      renderPassIos = shader.renderpass.map(rp => {
        const {inputs, outputs} = rp;

        const is = [];
        for (const input of inputs) {
          const {channel} = input;
          const buffer = _ensureInput(input);
          const i = {
            channel,
            buffer,
          };
          is.push(i);
        }
        
        const os = [];
        for (const output of outputs) {
          const {id, channel} = output;
          const buffer = _ensureInput({
            id,
            type: 'buffer',
          });
          const o = {
            channel,
            buffer,
          };
          os.push(o);
        }
        
        return {
          is,
          os,
        };
      });
    };
    _initRenderPassIos();

    /* // debugging
    for (const id in this.buffers) {
      _addDebugRenderTargetMesh(this.buffers[id]);
    }
    _addDebugRenderTargetMesh(this.renderTarget); */
    
    const _initRenderPasses = async () => {
      // wait for images to load
      await Promise.all(promises);
      
      for (let i = 0; i < shader.renderpass.length; i++) {
        const {type, code} = shader.renderpass[i];
        const {is, os} = renderPassIos[i];
        const renderPass = new ShaderToyPass({
          type,
          is,
          code,
          os,
          renderTarget: this.renderTarget,
        }, this);
        this.renderPasses.push(renderPass);
      }
    };
    _initRenderPasses();
    
    this.mesh = _makeRenderTargetMesh(this.renderTarget, worldSize, worldSize);

    this.loaded = false;
    this.loadPromise = Promise.all(promises)
      .then(() => {
        this.loaded = true;
      });
  }
  setCurrentTime(currentTime) {
    this.currentTime = currentTime;
  }
  getITime() {
    return this.currentTime;
  }
  getIFrame() {
    return this.frame;
  } 
  waitForLoad() {
    return this.loadPromise;
  }
  update(timeDiff) {
    this.currentTime += timeDiff;
    this.frame++;

    if (this.loaded) {
      // console.log('update start');

      const renderer = getRenderer();
      const context = renderer.getContext();
      context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);

      for (const renderPass of this.renderPasses) {
        renderPass.update();
      }
      
      context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
      
      // console.log('update end');
    }
  }
}

/* const shadertoyRenderers = [];
(async () => {
  const res = await fetch('./assets2/shaders.json');
  const shaders = await res.json();
  const shader = shaders.shaders.find(shader => shader.info.name === hackShaderName);
  const shadertoyRenderer = new ShadertoyRenderer({shader});
  await shadertoyRenderer.waitForLoad();
  shadertoyRenderers.push(shadertoyRenderer);
})(); */

class ShadertoyLoader {
  async load(u, {size = 1024, worldSize = 2} = {}) {
    const res = await fetch(u);
    const shader = await res.json();

    const shadertoyRenderer = new ShadertoyRenderer(
      shader,
      {
        size,
        worldSize,
      }
    );
    await shadertoyRenderer.waitForLoad();
    return shadertoyRenderer;
  }
}

export {
  ShadertoyRenderer,
  ShadertoyLoader,
};