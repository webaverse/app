import * as THREE from 'three';

class LightsManager extends EventTarget {
  constructor() {
    super();
    
    this.lights = [];
  }

  addLight(light) {
    this.lights.push(light);
  }

  removeLight(light) {
    const removeIndex = this.lights.indexOf(light);
    if (removeIndex !== -1) {
      this.lights.splice(removeIndex, 1);
    }
  }

  clear() {
    this.lights.length = 0;
  }
}

const lightsManager = new LightsManager();
export {
    lightsManager
};
