import * as THREE from 'three';

class LightsManager extends EventTarget {
  constructor() {
    super();
    
    this.lights = [];
  }

  addLight(light) {
    this.lights.push(light);
  }

  clear() {
    this.lights.length = 0;
  }
}

const lightsManager = new LightsManager();
export {
    lightsManager
};
