import * as THREE from './three.module.js';
import {EffectComposer} from './EffectComposer.js';
import {Pass} from './Pass.js';
import cameraManager from './camera-manager.js';
import {renderer, scene, orthographicScene, avatarScene, camera, orthographicCamera, avatarCamera, dolly, /*orbitControls,*/ renderer2, scene2, scene3, copyScene, copySceneCamera, copyScenePlaneGeometry, appManager} from './app-object.js';
import {rigManager} from './rig.js';

class FunctionPass extends Pass {
  constructor(fn, {needsSwap = false} = {}) {
    super();
    this.needsSwap = needsSwap;
    this.fn = fn;
  }
  render(renderer, writeBuffer, readBuffer) {
    this.fn.call(this, renderer, writeBuffer, readBuffer);
  }
}

class FullscreenShader {
  constructor(shader) {
    const {fragmentShader} = shader;
    
    const shaderScene = (() => {
      const mesh = new THREE.Mesh(
        copyScenePlaneGeometry,
        new THREE.ShaderMaterial({
          uniforms: {
            colorTex: {
              value: null,
              // needsUpdate: false,
            },
            depthTex: {
              value: null,
              // needsUpdate: false,
            },
            cameraNear: {
              value: camera.near,
              // needsUpdate: false,
            },
            cameraFar: {
              value: camera.far,
              // needsUpdate: false,
            },
          },
          vertexShader: `\
            out vec2 vUv;

            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `\
            #include <packing>

            uniform sampler2D colorTex;
            uniform sampler2D depthTex;
            uniform float cameraNear;
            uniform float cameraFar;
            in vec2 vUv;
            
            ${fragmentShader}
            
            void main() {
              mainImage(gl_FragColor, vUv, colorTex, depthTex);
            }
          `,
          depthWrite: false,
          depthTest: false,
        })
      );
      const scene = new THREE.Scene();
      scene.add(mesh);
      scene.mesh = mesh;
      return scene;
    })();

    this.pass = new FunctionPass(function(renderer, writeBuffer, readBuffer) {
      shaderScene.mesh.material.uniforms.colorTex.value = compositor.getColorTexture();
      shaderScene.mesh.material.uniforms.depthTex.value = compositor.getDepthTexture();
      shaderScene.mesh.material.uniforms.cameraNear.value = camera.near;
      shaderScene.mesh.material.uniforms.cameraFar.value = camera.far;
      renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
      renderer.clear();
      renderer.render(shaderScene, copySceneCamera);
    }, {
      needsSwap: true,
    });
  }
}

class Compositor {
  constructor() {
    const size = renderer.getSize(new THREE.Vector2());
    const depthTexture = new THREE.DepthTexture(size.x, size.y);
    const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
      encoding: THREE.sRGBEncoding,
      depthTexture,
    });
    
    this.composer = new EffectComposer(renderer, renderTarget);
    this.composer.addPass(new FunctionPass(function(renderer, writeBuffer, readBuffer) {
      // set render target
      renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);

      // clear
      renderer.clear();

      // high priority render
      renderer.render(scene3, camera);
      // main render
      scene.add(rigManager.localRig.model);
      rigManager.localRig.model.visible = false;
      renderer.render(scene, camera);
      renderer.render(orthographicScene, orthographicCamera);
      // local avatar render
      {
        rigManager.localRig.model.visible = true;
        avatarScene.add(rigManager.localRig.model);
        const decapitated = /^(?:camera|firstperson)$/.test(cameraManager.getMode()) || !!renderer.xr.getSession();
        if (decapitated) {
          rigManager.localRig.decapitate();
          rigManager.localRig.aux.decapitate();
        } else {
          rigManager.localRig.undecapitate();
          rigManager.localRig.aux.undecapitate();
        }
        renderer.render(avatarScene, camera);
        if (decapitated) {
          rigManager.localRig.undecapitate();
          rigManager.localRig.aux.undecapitate();
        }
      }
      // highlight render
      // renderer.render(highlightScene, camera);
    }));
    /* this.composer.addPass(new FunctionPass(function(renderer, writeBuffer, readBuffer) {
      copyScene.mesh.material.uniforms.tex.value = readBuffer.texture;
      renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
      renderer.clear();
      renderer.render(copyScene, copySceneCamera);
    }, {
      needsSwap: true,
    })); */
  }
  getColorTexture() {
    return this.composer.readBuffer.texture;
  }
  getDepthTexture() {
    return this.composer.readBuffer.depthTexture;
  }
  add(fullscreenShader) {
    this.composer.addPass(fullscreenShader.pass);
  }
  remove(fullscreenShader) {
    this.composer.removePass(fullscreenShader.pass);
  }
  render() {
    this.composer.render();
  }
}
const compositor = new Compositor();

export {
  FullscreenShader,
  compositor,
};