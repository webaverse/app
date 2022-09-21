import * as THREE from 'three';
import {lightsManager} from './lights-manager';

const dirLightShadowParams = [50, 4096, 0.001, 100000, 0, 0.2];

const _createSkyLight = (light) => {
  const lightTracker = lightsManager.createLightTracker(
    light,
    'directional',
    dirLightShadowParams,
    [0, 0, 0]
  );

  return lightTracker;
};

class SkyManager extends EventTarget {
  constructor() {
    super();

    this.skyLight = new THREE.Object3D();
    this.skyLight.name = 'SkyLightTracker';
  }

  getSkyLight() {
    return this.skyLight;
  }

  addSkyLight(light) {
    const lightTracker = _createSkyLight(light);
    this.skyLight.add(lightTracker);
  }

  setSkyLightPosition(position) {
    this.skyLight.position.copy(position);
    this.skyLight.updateMatrixWorld();
  }

  setSkyLightColor(color) {
    this.skyLight.lightTracker.light.color = color;
  }
}

const skyManager = new SkyManager();
export { skyManager };
