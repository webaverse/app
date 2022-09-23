import * as THREE from 'three';

const localVector = new THREE.Vector3();

const _removeFromArray = (array, el) => {
  const removeIndex = array.indexOf(el);
  if (removeIndex !== -1) {
    array.splice(removeIndex, 1);
  }
};

const _addShadows = (light, params) => {
  light.castShadow = true;
  if (typeof params[1] === 'number') {
    light.shadow.mapSize.width = params[1];
    light.shadow.mapSize.height = params[1];
  }
  if (typeof params[2] === 'number') {
    light.shadow.camera.near = params[2];
  }
  if (typeof params[3] === 'number') {
    light.shadow.camera.far = params[3];
  }
  if (typeof params[0] === 'number') {
    light.shadow.camera.left = params[0];
    light.shadow.camera.right = -params[0];
    light.shadow.camera.top = params[0];
    light.shadow.camera.bottom = -params[0];
  }
  if (typeof params[4] === 'number') {
    light.shadow.bias = params[4];
  }
  if (typeof params[5] === 'number') {
    light.shadow.normalBias = params[5];
  }

  light.shadow.camera.initialLeft = light.shadow.camera.left;
  light.shadow.camera.initialRight = light.shadow.camera.right;
  light.shadow.camera.initialTop = light.shadow.camera.top;
  light.shadow.camera.initialBottom = light.shadow.camera.bottom;
};

class LightsManager extends EventTarget {
  constructor() {
    super();

    this.lights = [];
  }

  addLight(light, lightType, shadow, position) {
    if (
      lightType === 'directional' ||
      lightType === 'point' ||
      lightType === 'spot'
    ) {
      if (Array.isArray(shadow)) {
        _addShadows(light, shadow);
      }
    }

    if (Array.isArray(position)) {
      localVector.fromArray(position);
    } else {
      localVector.set(0, 0, 0);
    }

    light.lastAppMatrixWorld = new THREE.Matrix4();
    light.plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, -1, 0),
      localVector
    );
    light.position.copy(localVector);

    this.lights.push(light);

    return light;
  }

  removeLight(light) {
    _removeFromArray(this.lights, light);
  }

  clear() {
    this.lights.length = 0;
  }
}

const lightsManager = new LightsManager();
export {lightsManager};
