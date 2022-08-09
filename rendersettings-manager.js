import * as THREE from 'three';
import postProcessing from './post-processing.js';
// import {rootScene} from './renderer.js';

const blackColor = new THREE.Color(0x000000);

class RenderSettings {
  constructor(json) {
    this.background = this.#makeBackground(json.background);
    this.fog = this.#makeFog(json.fog);
    const {passes, internalPasses} = postProcessing.makePasses(json);
    this.passes = passes;
    this.internalPasses = internalPasses;
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
  constructor() {
    this.fog = new THREE.FogExp2(0x000000, 0);
    this.extraPasses = [];
  }
  addExtraPass(pass) {
    this.extraPasses.push(pass);
  }
  removeExtraPass(pass) {
    this.extraPasses.splice(this.extraPasses.indexOf(pass), 1);
  }
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
    scene.fog = this.fog;

    if (fog) {
      this.fog.color = fog.color;
      this.fog.density = fog.density;
    } else {
      this.fog.color = blackColor;
      this.fog.density = 0;
    }

    return () => {
      scene.background = oldBackground;
      scene.fog = oldFog;
    };
  }
  push(srcScene, dstScene = srcScene, {
    postProcessing = null,
  } = {}) {
    let renderSettings = this.findRenderSettings(srcScene);
    const renderSettingsCleanup = this.applyRenderSettingsToScene(renderSettings, dstScene);

    if (postProcessing) {
      let {
        passes = postProcessing.defaultPasses,
        internalPasses = postProcessing.defaultInternalPasses,
      } = (renderSettings ?? {});
      if (this.extraPasses.length > 0) {
        passes = passes.slice();
        passes.push(...this.extraPasses);
      }
      postProcessing.setPasses(passes, internalPasses);
    }

    return () => {
      renderSettingsCleanup();
      postProcessing && postProcessing.setPasses(postProcessing.defaultPasses, postProcessing.defaultInternalPasses);
    };
  }
}
const renderSettingsManager = new RenderSettingsManager();
export default renderSettingsManager;