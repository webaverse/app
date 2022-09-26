import * as THREE from 'three';
import {lightsManager} from '../../lights/lights-manager.js';

const DIR_LIGHT_SHADOW_PARAMS = [50, 4096, 0.01, 10000, 0, 0.2];
const _addSkyLightToLightManager = light => {
  lightsManager.addLight(
    light,
    'directional',
    DIR_LIGHT_SHADOW_PARAMS,
    [0, 0, 0],
  );
};

class SkyManager extends EventTarget {
  constructor() {
    super();

    const light = new THREE.DirectionalLight();
    _addSkyLightToLightManager(light);

    this.skyLight = light;
  }

  getSkyLight() {
    return this.skyLight;
  }

  setSkyLightPosition(position) {
    this.skyLight.position.copy(position);
    this.skyLight.updateMatrixWorld();
  }

  setSkyLightColor(color) {
    this.skyLight.color.set(color);
  }

  setSkyLightIntensity(intensity) {
    this.skyLight.intensity = intensity;
  }
}

const skyManager = new SkyManager();
export {skyManager};
