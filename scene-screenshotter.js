import * as THREE from 'three';
import {getRenderer} from './renderer.js';
import renderSettingsManager from './rendersettings-manager.js';

const localVector4D = new THREE.Vector4();
const localColor = new THREE.Color();

const sideScene = new THREE.Scene();
sideScene.matrixWorldAutoUpdate = false;

export function screenshotScene(scene, camera, width, height, ctx) {
  const renderer = getRenderer();
      
  // push old state
  // const oldRenderTarget = renderer.getRenderTarget();
  const oldViewport = renderer.getViewport(localVector4D);
  const oldClearColor = renderer.getClearColor(localColor);
  const oldClearAlpha = renderer.getClearAlpha();
  const pixelRatio = renderer.getPixelRatio();

  // render
  // renderer.setRenderTarget(colorRenderTarget);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setViewport(0, 0, width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();

  {
    const oldParent = scene.parent;
    sideScene.add(scene);
    
    const pop = renderSettingsManager.push(scene, sideScene);
    renderer.render(sideScene, camera);
    pop();
    
    if (oldParent) {
      oldParent.add(scene);
    } else {
      sideScene.remove(scene);
    }
    // const p = createImageBitmap(renderer.domElement, 0, 0, worldResolution, worldResolution);
  }

  // for (const ctx of contexts) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      renderer.domElement,
      0, renderer.domElement.height - height * pixelRatio,
      width * pixelRatio, height * pixelRatio,
      0, 0,
      width, height
    );
  // }

  // pop old state
  // renderer.setRenderTarget(oldRenderTarget);
  renderer.setViewport(oldViewport);
  renderer.setClearColor(oldClearColor, oldClearAlpha);

  // return p;
}