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

    this.sun = new THREE.Object3D();
    this.sun.name = 'SunTracker';

    this.moon = new THREE.Object3D();
    this.moon.name = 'MoonTracker';
  }

  getSun() {
    return this.sun;
  }

  getMoon() {
    return this.moon;
  }

  addSunLight(light) {
    const lightTracker = _createSkyLight(light);
    this.sun.add(lightTracker);
  }

  addMoonLight(light) {
    const lightTracker = _createSkyLight(light);
    this.moon.add(lightTracker);
  }

  setSunPosition(position) {
    this.sun.position.copy(position);
    this.sun.updateMatrixWorld();
  }

  setMoonPosition(position) {
    this.moon.position.copy(position);
    this.moon.updateMatrixWorld();
  }
}

const skyManager = new SkyManager();
export { skyManager };
