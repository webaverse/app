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
    const oldBackground = scene.background;
    const oldFog = scene.fog;

    const {
      background = null,
      fog = null,
    } = (renderSettings ?? {});
    scene.background = background;
    scene.fog = fog;

    return () => {
      scene.background = oldBackground;
      scene.fog = oldFog;
    };
  }
  push(srcScene, dstScene = srcScene, {
    postProcessing = null,
  } = {}) {
    const renderSettings = this.findRenderSettings(srcScene);
    const renderSettingsCleanup = this.applyRenderSettingsToScene(renderSettings, dstScene);

    if (postProcessing) {
      const {
        passes = null,
      } = (renderSettings ?? {});
      postProcessing.setPasses(passes);
    }

    return () => {
      renderSettingsCleanup();
      postProcessing && postProcessing.setPasses(null);
    };
  }
  pushFogClear(srcScene, dstScene = srcScene) {
    let fogCleanup = null;
    const oldFog = dstScene.fog;
    if (oldFog) {
      if (oldFog.isFog) {
        const oldNear = oldFog.near;
        const oldFar = oldFog.far;
        oldFog.near = Infinity;
        oldFog.far = Infinity;
        fogCleanup = () => {
          oldFog.near = oldNear;
          oldFog.far = oldFar;
        };
      } else if (oldFog.isFogExp2) {
        const oldDensity = oldFog.density;
        oldFog.density = 0;
        fogCleanup = () => {
          oldFog.density = oldDensity;
        };
      }
    }
    return () => {
      fogCleanup && fogCleanup();
    };
  }
}
const renderSettingsManager = new RenderSettingsManager();
export default renderSettingsManager;