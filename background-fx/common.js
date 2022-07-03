import * as THREE from 'three';
import gradients from './gradients.json';

export {gradients};

export const fullscreenGeometry = new THREE.PlaneGeometry(2, 2);
export const fullscreenVertexShader = `\
  varying vec2 tex_coords;

  void main() {
    tex_coords = uv;
    gl_Position = vec4(position.xy, 1., 1.);
  }
`;