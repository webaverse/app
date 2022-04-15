import * as THREE from 'three';
import postProcessing from './post-processing.js';
// import {rootScene} from './renderer.js';

class RenderSettings {
  constructor(json) {
    this.background = this.#makeBackground(json.background);
    this.fog = this.#makeFog(json.fog);
    this.passes = postProcessing.makePasses(json);
  }
  #makeBackground(background) {
    if (background) {
      let {color} = background;
      if (Array.isArray(color) && color.length === 3 && color.every(n => typeof n === 'number')) {
        return new THREE.Color(color[0]/255, color[1]/255, color[2]/255);
      }
    }
    return null;
  }
  #makeFog(fog) {
    if (fog) {
      if (fog.fogType === 'linear') {
        const {args = []} = fog;
        return new THREE.Fog(new THREE.Color(args[0][0]/255, args[0][1]/255, args[0][2]/255).getHex(), args[1], args[2]);
      } else if (fog.fogType === 'exp') {
        const {args = []} = fog;
        return new THREE.FogExp2(new THREE.Color(args[0][0]/255, args[0][1]/255, args[0][2]/255).getHex(), args[1]);
      } else {
        console.warn('unknown rendersettings fog type:', fog.fogType);
        return null;
      }
    } else {
      return null;
    }
  }
}

class RenderSettingsManager {
  makeRenderSettings(json) {
    return new RenderSettings(json);
  }
  // traverse the scene to find render settings from a rendersettings app
  findRenderSettings(scene) {
    const _recurse = o => {
      if (o.isApp) {
        return o.getRenderSettings();
      } else {
        for (const child of o.children) {
          const result = _recurse(child);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };
    for (const child of scene.children) {
      const result = _recurse(child);
      if (result) {
        return result;
      }
    }
    return null;
  }
  applyRenderSettingsToScene(renderSettings, scene) {
    const {
      background = null,
      fog = null,
    } = (renderSettings ?? {});
    scene.background = background;
    scene.fog = fog;
  }
  applyRenderSettingsToSceneAndPostProcessing(renderSettings, scene, localPostProcessing) {
    this.applyRenderSettingsToScene(renderSettings, scene);
    
    const {
      passes = null,
    } = (renderSettings ?? {});
    localPostProcessing.setPasses(passes);
  }
  push(srcScene, dstScene = srcScene, {
    fog = false,
  } = {}) {
    const renderSettings = this.findRenderSettings(srcScene);
    this.applyRenderSettingsToScene(renderSettings, dstScene);

    const hideFog = fog === false && !!dstScene.fog;
    let fogCleanup = null;
    if (hideFog) {
      if (dstScene.fog.isFog) {
        const oldNear = dstScene.fog.near;
        const oldFar = dstScene.fog.far;
        dstScene.fog.near = Infinity;
        dstScene.fog.far = Infinity;
        fogCleanup = () => {
          dstScene.fog.near = oldNear;
          dstScene.fog.far = oldFar;
        };
      } else if (dstScene.fog.isFogExp2) {
        const oldDensity = dstScene.fog.density;
        dstScene.fog.density = 0;
        fogCleanup = () => {
          dstScene.fog.density = oldDensity;
        };
      }
    }

    return () => {
      fogCleanup && fogCleanup();
      this.applyRenderSettingsToScene(null, dstScene);
    };
  }
}
const renderSettingsManager = new RenderSettingsManager();
export default renderSettingsManager;