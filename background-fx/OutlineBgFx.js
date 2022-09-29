import * as THREE from 'three';
import {
  fullscreenGeometry,
  gradients,
  fullscreenVertexShader,
} from './common.js';

export const outlineShader = `\
  varying vec4 v_colour;
  varying vec2 tex_coords;

  uniform sampler2D t0;
  uniform float outline_thickness;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float outline_threshold;

  #define pixel gl_FragColor
  #define PI 3.1415926535897932384626433832795

  void main() {
    /* float sum = 0.0;
    int passes = 64;
    float passesFloat = float(passes);
    float step = outline_thickness / passesFloat;
    // top
    for (int i = 0; i < passes; ++i) {
      float n = float(i);
      vec2 uv = tex_coords + vec2(-outline_thickness*0.5 + step * n, outline_thickness);
      sum += texture(t0, uv).a;
    }
    // bottom
    for (int i = 0; i < passes; ++i) {
      float n = float(i);
      vec2 uv = tex_coords + vec2(-outline_thickness*0.5 + step * n, -outline_thickness);
      sum += texture(t0, uv).a;
    }
    // left
    for (int i = 0; i < passes; ++i) {
      float n = float(i);
      vec2 uv = tex_coords + vec2(-outline_thickness, -outline_thickness*0.5 + step * n);
      sum += texture(t0, uv).a;
    }
    // right
    for (int i = 0; i < passes; ++i) {
      float n = float(i);
      vec2 uv = tex_coords + vec2(outline_thickness, -outline_thickness*0.5 + step * n);
      sum += texture(t0, uv).a;
    } */

    float sum = 0.0;
    int passes = 32;
    float passesFloat = float(passes);
    float angleStep = 2.0 * PI / passesFloat;
    for (int i = 0; i < passes; ++i) {
        float n = float(i);
        float angle = angleStep * n;

        vec2 uv = tex_coords + vec2(cos(angle), sin(angle)) * outline_thickness;
        sum += texture(t0, uv).a; // / passesFloat;
    }

    if (sum > 0.) {
      vec3 c = mix(uColor1, uColor2, 1. - tex_coords.y) * 0.35;
      pixel = vec4(c, 1);
    } else {
      discard;
      // pixel = texture(t0, tex_coords);
    }
  }
`;

class OutlineBgFxMesh extends THREE.Mesh {
  constructor() {
    const geometry = fullscreenGeometry;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        t0: {
          value: null,
          needsUpdate: false,
        },
        outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        },
        uColor1: {
          value: new THREE.Color(0x000000),
          needsUpdate: true,
        },
        uColor2: {
          value: new THREE.Color(0xffffff),
          needsUpdate: true,
        },
        outline_threshold: {
          value: 0.5,
          needsUpdate: true,
        },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: outlineShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    });
    super(geometry, material);
    this.frustumCulled = false;
  }

  update(timestamp, timeDiff, width, height, texture) {
    const timestampS = timestamp / 1000;

    const {colors} = gradients[Math.floor(timestampS) % gradients.length];

    this.material.uniforms.t0.value = texture;
    this.material.uniforms.t0.needsUpdate = true;

    this.material.uniforms.uColor1.value.set(colors[0]);
    this.material.uniforms.uColor1.needsUpdate = true;

    this.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
    this.material.uniforms.uColor2.needsUpdate = true;
  }
}

export {OutlineBgFxMesh};
