import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

class DoubleSidedPlaneGeometry extends THREE.BufferGeometry {
  constructor(width, height, widthSegments, heightSegments) {
    super();

    const g1 = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    const g2 = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    g2.rotateY(Math.PI);
    // flip the uvs in the second geometry so that the texture is mirrored
    for (let i = 0; i < g2.attributes.uv.array.length; i += 2) {
      g2.attributes.uv.array[i] = 1 - g2.attributes.uv.array[i];
    }
    const g = BufferGeometryUtils.mergeBufferGeometries([g1, g2]);

    // clone the attributes t o the local geometry
    const attributes = g.attributes;
    for (const key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        this.setAttribute(key, attributes[key]);
      }
    }
    // also clone the indices
    this.setIndex(g.index);
  }
}

export {
  DoubleSidedPlaneGeometry,
};
