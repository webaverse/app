import * as THREE from 'three'

const cloudVertex = `
    ${THREE.ShaderChunk.common}
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform vec2 uResolution;
    uniform float uTime;
    
    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
    void main() {
      vUv = uv;
      vPosition = position;
      vec3 newPosition = position;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
      ${THREE.ShaderChunk.logdepthbuf_vertex}
    }
    `
    
    const cloudFragment = `
  precision highp float;
  precision highp int;
  precision highp sampler3D;
  #define PI 3.1415926535897932384626433832795
  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  varying vec3 vPosition;
  uniform sampler3D uVolume;
  void main() {
    gl_FragColor = texture(uVolume,vPosition);
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`

export { cloudVertex, cloudFragment }
