import * as THREE from 'three';
import {
  fullscreenGeometry,
  fullscreenVertexShader,
} from './common.js';
import {getRenderer} from '../renderer.js';

export const noiseFragmentShader = `\
  //Based on Andrew Baldwin's noise tutorial: http://thndl.com/?15

  //

  uniform float iTime;
  uniform int iFrame;
  uniform vec3 iResolution;
  // uniform vec3 uColor1;
  // uniform vec3 uColor2;
  // uniform sampler2D iChannel0;
  // uniform sampler2D iChannel1;
  varying vec2 tex_coords;

  /* vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  } */

  #define PI 3.1415926535897932384626433832795

  float rand(float x) {
    return sin (2. * x) + sin(PI * x);
  }


  float rand(vec2 p, float timeOffset)
  {
    p += 0.2127*timeOffset + p.x + 0.3713*p.y;
    vec2 r = (123.789)*sin(1.823*(p));
    return fract(r.x*r.y);
  }

  float sn(vec2 p, float timeOffset)
  {
    vec2 i=floor(p-0.5);
    vec2 f=fract(p-0.5);
    f = f*f*f*(f*(f*6.0-15.0)+6.0);
    float rt=mix(rand(i, timeOffset),rand(i+vec2(1.,0.), timeOffset),f.x);
    float rb=mix(rand(i+vec2(0.0,1.0), timeOffset),rand(i+vec2(1.0,1.0), timeOffset),f.x);
    return mix(rt,rb,f.y);
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
    //vec2 r=fract(456.789*sin(789.123*c.xy));
    //f=vec4(r.x*r.y)
    
    //create random noise
    //vec2 r = 123.0*sin(1.823*fragCoord.xy);
    
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 p = fragCoord.xy*vec2(0.012);
      p += vec2(rand(iTime*0.5), rand(iTime*0.5 + 1000.));
      p += vec2(rand(iTime + 2000.), rand(iTime + 3000.));
      p -= 0.5;
      p *= 1. + rand(iTime*0.2 + 4000.) * 0.2;
      p += 0.5;
    
    //fragColor = vec4(vec3(sn(vec2(0.02)*fragCoord.xy)),1.0);
    fragColor = vec4(vec3(
    0.5*sn(p, sin(iTime*0.000025))
    +0.25*sn(2.0*p, sin(iTime*0.0005))
    +0.125*sn(4.0*p, sin(iTime*0.0012))
    +0.0625*sn(8.0*p, sin(iTime*0.0025))
    +0.03125*sn(16.0*p, sin(iTime*0.0032))
    +0.015*sn(32.0*p, sin(iTime*0.0046))
    ),1.);
      
      fragColor = mix(
        vec4(0., 0., 0., 1.),
        mix(
          vec4(0.7019607843137254, 0.615686274509804, 0.8588235294117647, 1.),
          vec4(0.3686274509803922, 0.20784313725490197, 0.6941176470588235, 1.),
          uv.x
        ),
      fragColor.r);
  }

  void main() {
    vec2 fragCoord = tex_coords * iResolution.xy;
    mainImage(gl_FragColor, fragCoord);
    // gl_FragColor vec4(1., 0., 0., 1.);
  }
`;

class NoiseBgFxMesh extends THREE.Mesh {
  constructor() {
    const geometry = fullscreenGeometry;
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
        /* iChannel0: {
          value: textureLoader.load('/textures/pebbles.png'),
          // needsUpdate: true,
        },
        iChannel1: {
          value: textureLoader.load('/textures/noise.png'),
          // needsUpdate: true,
        },
        uColor1: {
          value: new THREE.Color(0x000000),
          needsUpdate: true,
        },
        uColor2: {
          value: new THREE.Color(0xFFFFFF),
          needsUpdate: true,
        }, */
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: noiseFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    /* quad.material.onBeforeCompile = shader => {
      console.log('got full screen shader', shader);
    }; */
    /* quad.material.uniforms.iChannel0.value.wrapS = THREE.RepeatWrapping;
    quad.material.uniforms.iChannel0.value.wrapT = THREE.RepeatWrapping;
    quad.material.uniforms.iChannel1.value.wrapS = THREE.RepeatWrapping;
    quad.material.uniforms.iChannel1.value.wrapT = THREE.RepeatWrapping;
    quad.frustumCulled = false; */
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
    /* renderer.getSize(this.material.uniforms.iResolution.value)
      .multiplyScalar(pixelRatio);
    this.material.uniforms.iResolution.value.z = pixelRatio; */
    this.material.uniforms.iResolution.value.set(width, height, pixelRatio);
    this.material.uniforms.iResolution.needsUpdate = true;

    // console.log('got frame', this.material.uniforms.iFrame.value);
  }
}

export {
  NoiseBgFxMesh,
};