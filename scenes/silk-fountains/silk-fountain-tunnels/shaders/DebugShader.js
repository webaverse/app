import * as THREE from 'three';

const DebugShader = {
  
    vertexShader: `
    ${THREE.ShaderChunk.common}
    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        ${THREE.ShaderChunk.logdepthbuf_vertex}
      }


    `,

    fragmentShader: `
    ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

    void main() {
        gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0 ); 
        ${THREE.ShaderChunk.logdepthbuf_fragment}
      }

    `
};  

export default DebugShader;
  
    