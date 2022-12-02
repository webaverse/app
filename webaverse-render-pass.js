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
    this.onBeforeRender = null;
    this.onAfterRender = null;

    this.foamInvisibleList = [];
    this.foamDepthMaterial = null;
    this.foamRenderTarget = null;
    this.scene = null;
    this.camera = null;
  }
  renderFoam(renderer){
    if(this.foamDepthMaterial && this.foamRenderTarget){
          renderer.setRenderTarget(this.foamRenderTarget);
          renderer.clear();
          for(const invisibleObject of this.foamInvisibleList){
            invisibleObject.visible = false; 
          }
          this.scene.overrideMaterial = this.foamDepthMaterial;

          renderer.render(this.scene, this.camera);
          renderer.setRenderTarget(null);

          this.scene.overrideMaterial = null;
          for(const invisibleObject of this.foamInvisibleList){
            invisibleObject.visible = true; 
          }
    }
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
    this.renderFoam(renderer);
    this.onBeforeRender && this.onBeforeRender();
    
    // render
    if (this.internalDepthPass) {
      this.internalDepthPass.renderToScreen = false;
      this.internalDepthPass.render(renderer, renderTarget, readBuffer, deltaTime, maskActive);
    }
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