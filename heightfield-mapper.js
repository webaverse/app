import * as THREE from 'three';
// import {getRenderer} from './renderer.js';

const maxAnisotropy = 16;

const _makeHeightfieldRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  // minFilter: THREE.NearestFilter,
  // magFilter: THREE.NearestFilter,
  format: THREE.RedFormat,
  type: THREE.FloatType,
  // wrapS: THREE.RepeatWrapping,
  // wrapT: THREE.RepeatWrapping,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping,
  stencilBuffer: false,
  anisotropy: maxAnisotropy,
  // flipY: false,
});

export class HeightfieldMapper {
  constructor({
    chunkSize,
    terrainSize,
  }) {
    this.chunkSize = chunkSize;
    this.terrainSize = terrainSize;

    this.heightfieldRenderTarget = _makeHeightfieldRenderTarget(terrainSize, terrainSize);
    this.heightfieldFourTapRenderTarget = _makeHeightfieldRenderTarget(terrainSize, terrainSize);

    this.heightfieldMinPosition = new THREE.Vector2();
  }
}