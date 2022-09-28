// import * as THREE from 'three';
import {Pass} from 'three/examples/jsm/postprocessing/Pass.js';
import {
  // scene,
  // sceneHighPriority,
  // sceneLowPriority,
  rootScene,
  camera,
} from './renderer.js';

class WebaverseRenderPass extends Pass {
  constructor() {
    super();

    this.clear = false;
    this.needsSwap = true;

    this.internalDepthPass = null;
    this.internalRenderPass = null;
    this.onBeforeRender = null;
    this.onAfterRender = null;
  }

  setSize(width, height) {
    if (this.internalDepthPass) {
      this.internalDepthPass.setSize(width, height);
    }
    if (this.internalRenderPass) {
      this.internalRenderPass.setSize(width, height);
    }
  }

  render(renderer, renderTarget, readBuffer, deltaTime, maskActive) {
    this.onBeforeRender && this.onBeforeRender();

    // render
    if (this.internalDepthPass) {
      this.internalDepthPass.renderToScreen = false;
      this.internalDepthPass.render(
        renderer,
        renderTarget,
        readBuffer,
        deltaTime,
        maskActive,
      );
    }
    if (this.internalRenderPass) {
      this.internalRenderPass.renderToScreen = this.renderToScreen;
      this.internalRenderPass.render(
        renderer,
        renderTarget,
        readBuffer,
        deltaTime,
        maskActive,
      );
    } else {
      renderer.setRenderTarget(this.renderToScreen ? null : renderTarget);
      renderer.clear();
      renderer.render(rootScene, camera);
    }

    this.onAfterRender && this.onAfterRender();
  }
}
export {WebaverseRenderPass};
