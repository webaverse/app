import * as THREE from 'three';
import {Pass} from 'three/examples/jsm/postprocessing/Pass.js';
import {
  scene,
  sceneHighPriority,
  sceneLowPriority,
  rootScene,
  camera,
} from './renderer.js';

class WebaverseRenderPass extends Pass {
  constructor() {
    super();

    this.needsSwap = true;
    this.clear = true;

    this.internalDepthPass = null;
    this.internalRenderPass = null;
    this.internalXROutputPass = null;
    this.onBeforeRender = null;
    this.onAfterRender = null;
  }
  setSize(width, height) {
    if (this.internalDepthPass) {
      this.internalDepthPass.setSize(width, height);
    }
    if (this.internalRenderPass) {
      this.internalRenderPass.setSize(width,height);
    }

	}
  render(renderer, renderTarget, readBuffer, deltaTime, maskActive) {
    this.onBeforeRender && this.onBeforeRender();

    if (renderer.xr.getSession()) {
      this.internalXROutputPass.render(renderer, renderTarget, readBuffer, deltaTime, maskActive);
    }
    else {
      // render
      if (this.internalDepthPass) {
        this.internalDepthPass.renderToScreen = false;
        this.internalDepthPass.render(renderer, renderTarget, readBuffer, deltaTime, maskActive);
      }
      if (this.internalRenderPass) {
        this.internalRenderPass.renderToScreen = this.renderToScreen;
        this.internalRenderPass.render(renderer, renderTarget, readBuffer, deltaTime, maskActive);
        //console.log("renderPass");
      }
      else {
        //console.log("thirdPass");
        renderer.setRenderTarget(renderTarget);
        //let framebuffer = renderer.properties.get( renderTarget ).__webglFramebuffer;
        //console.log(readBuffer, maskActive ,renderTarget,renderTarget.__webglFramebuffer);        
        renderer.clear();
        renderer.render(rootScene, camera);
      }
    }     
    this.onAfterRender && this.onAfterRender();
  }
}
export {
  WebaverseRenderPass,
};