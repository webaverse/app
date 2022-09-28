import * as THREE from 'three';

class WebaverseScene extends THREE.Scene {
  constructor() {
    super();

    // Every scene should have fog to prevent recompiles
    // control intensity when needed so the shader is the same
    // Default fog is zero intensity
    this.fog = new THREE.FogExp2(0x000000, 0);
  }
}
export {WebaverseScene};
