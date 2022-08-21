import * as THREE from 'three';
import {
  fullscreenGeometry,
  fullscreenVertexShader,
} from './common.js';
import {getRenderer} from '../renderer.js';

export const smokeFragmentShader = `\
  precision mediump sampler3D;

  uniform float iTime;
  uniform int iFrame;
  uniform vec3 iResolution;
  // uniform vec3 uColor1;
  // uniform vec3 uColor2;
  uniform sampler3D iChannel0;
  // uniform sampler2D iChannel1;
  varying vec2 tex_coords;

  float Speed = .03;
  vec3 Light = vec3(.6,.2,.8) * 0.5;
  float Density = 1.;
  float Clearup = .25;
  float Near = 1.;
  float Far = 0.1;
  float BaseFactor = 0.0;

  // All components are in the range [0…1], including hue.
  vec3 rgb2hsv(vec3 c)
  {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
  // All components are in the range [0…1], including hue.
  vec3 hsv2rgb(vec3 c)
  {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  float Map(vec3 Position)
  {
      vec3 P = Position*0.5;
      // P += texture(iChannel0,Position*2.+iTime*Speed*.2).xyz*.02; // offset position slightly
      
      float C = texture(iChannel0,P).r;
      C *= texture(iChannel0,P*vec3(.5,1,.5)).g;
      C = C*Near+Far*pow(texture(iChannel0,P*5.1).a,1.);
      return max((C-Clearup)*Density,0.);
  }
  void mainImage(out vec4 Color,in vec2 Coord)
  {
      // Coord *= 10.;
      
      vec3 R = vec3((Coord-.5*iResolution.xy)/iResolution.y,1);
      vec3 P = vec3(0,-iTime*Speed*10.,iTime*Speed*5.);
      
      vec4 C = vec4(0);
      for(float I = .2;I<.5;I+=.01)
      {
          float M1 = Map(P+R*I);
          float M2 = Map(P+R*I+Light*.01);
          C += vec4((.6+vec3(.6,.5,.4)*(exp(-M2*10.)-M1)),1)*M1*(1.-C.a);
          if (C.a>.99) break;
      }
      vec3 baseColor = vec3(.5,.7,.9) * BaseFactor;
      baseColor -= R.y*.4;
    Color = C+vec4(baseColor,1)*(1.-C.a);
      
      // if (sin(iTime * 100.) < 0.1) {
        // Color.rgb = 1. - Color.rgb;
      
      
      // } else if (sin(iTime * 100.) < 0.9) {
        Color.rgb *= normalize(vec3(0.35, 0.25, 0.5));
        
        vec3 hsv = rgb2hsv(Color.rgb);
        hsv.r += iTime*Speed*10.;
        Color.rgb = hsv2rgb(hsv);
        // float v = (Color.r + Color.g + Color.b)/3.;
        Color.rb += R.xy * 0.2;
        
        /* if (Color.b > 0.5) {
          // Color.rgb = vec3(0);
        } */
        // Color.rgb *= 1.5;
      // }
  }

  void main() {
    vec2 fragCoord = tex_coords * iResolution.xy;
    mainImage(gl_FragColor, fragCoord);
  }
`;

class SmokeBgFxMesh extends THREE.Mesh {
  constructor() {
    const geometry = fullscreenGeometry;

    const noise3DTexture = new THREE.Data3DTexture(null, 0, 0, 0);
    (async () => {
      const res = await fetch('textures/noise3d.bin');
      const arrayBuffer = await res.arrayBuffer();
      const file = new DataView(arrayBuffer);

      let index = 0;
      const signature = file.getUint32(index, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      const width = file.getUint32(index, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      const height = file.getUint32(index, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      const depth = file.getUint32(index, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      const binNumChannels = file.getUint8(index, true);
      index++;
      const binLayout = file.getUint8(index, true);
      index++;
      const binFormat = file.getUint16(index, true);
      index += Uint16Array.BYTES_PER_ELEMENT;

      const data = new Uint8Array(arrayBuffer, 20);
      const noise3DTexture = new THREE.Data3DTexture(data, width, height, depth);
      noise3DTexture.minFilter = THREE.LinearFilter;
      noise3DTexture.magFilter = THREE.LinearFilter;
      noise3DTexture.wrapS = THREE.RepeatWrapping;
      noise3DTexture.wrapT = THREE.RepeatWrapping;
      noise3DTexture.wrapR = THREE.RepeatWrapping;
      noise3DTexture.needsUpdate = true;

      material.uniforms.iChannel0.value = noise3DTexture;
      material.uniforms.iChannel0.needsUpdate = true;
    })();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: false,
        },
        iFrame: {
          value: 0,
          needsUpdate: false,
        },
        iResolution: {
          value: new THREE.Vector3(),
          needsUpdate: false,
        },
        iChannel0: {
          value: noise3DTexture,
          needsUpdate: true,
        },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: smokeFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    super(geometry, material);
    this.frustumCulled = false;
  }

  update(timestamp, timeDiff, width, height) {
    const timestampS = timestamp / 1000;

    this.material.uniforms.iTime.value = timestampS;
    this.material.uniforms.iTime.needsUpdate = true;

    this.material.uniforms.iFrame.value = Math.floor(timestampS * 60);
    this.material.uniforms.iFrame.needsUpdate = true;

    const renderer = getRenderer();
    const pixelRatio = renderer.getPixelRatio();
    this.material.uniforms.iResolution.value.set(width, height, pixelRatio);
    this.material.uniforms.iResolution.needsUpdate = true;
  }
}

export {
  SmokeBgFxMesh,
};
