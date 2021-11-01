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

    this.internalRenderPass = null;
    this.onBeforeRender = null;
    this.onAfterRender = null;
  }
  render(renderer, renderTarget, readBuffer, deltaTime, maskActive) {
    this.onBeforeRender && this.onBeforeRender();
    
    // render
    sceneHighPriority.traverse(o => {
      o.isLowPriority = false;
    });
    scene.traverse(o => {
      o.isLowPriority = false;
    });
    sceneLowPriority.traverse(o => {
      o.isLowPriority = true;
    });
    if (this.internalRenderPass) {
      this.internalRenderPass.renderToScreen = this.renderToScreen;
      this.internalRenderPass.render(renderer, renderTarget, readBuffer, deltaTime, maskActive);
    } else {
      renderer.setRenderTarget(renderTarget);
      renderer.clear();
      renderer.render(rootScene, camera);
    }
    
    this.onAfterRender && this.onAfterRender();
  }
}
export {
  WebaverseRenderPass,
};