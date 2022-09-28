import * as THREE from 'three';
import {
  fullscreenGeometry,
  gradients,
  fullscreenVertexShader,
} from './common.js';
// import {getRenderer} from '../renderer.js';

const animeLightningFragmentShader = `\
  uniform float iTime;
  uniform int iFrame;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform sampler2D iChannel0;
  uniform sampler2D iChannel1;
  varying vec2 tex_coords;

  // Quick and dirty line experiment to generate electric bolts :)

  // http://extremelearning.com.au/unreasonable-effectiveness-of-quasirandom-sequences/
  float R1seq(int n)
  {
    return fract(float(n) * 0.618033988749894848204586834365641218413556121186522017520);
  }

  vec2 R2seq(int n)
  {
    return fract(vec2(n) * vec2(0.754877666246692760049508896358532874940835564978799543103, 0.569840290998053265911399958119574964216147658520394151385));
  }

  // modified iq's segment: https://www.shadertoy.com/view/ldj3Wh
  vec2 Line(vec2 a, vec2 b, vec2 p, vec2 identity, float sa, float sb)
  {
      vec2 pa = p - a;
      vec2 pb = p - b;
      vec2 ba = b - a;
      float t = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);    
      vec2 pp = a + ba * t;
      vec2 y = vec2(-identity.y, identity.x);
      float cutoff = max(dot(pb, identity), dot(pa, -identity));
      float s = mix(sa, sb, t);
      return vec2(max(cutoff - .005, abs(dot(y, p - pp)) - s), t);
  }

  float Rythm(float x)
  {
    x = x * 6.28318 * 10.0 / 60.0;
    x = smoothstep(-1.0, 1.0, sin(x));
    x = smoothstep(0.0, 1.0, x);
    x = smoothstep(0.0, 1.0, x);
    x = smoothstep(0.0, 1.0, x);
    x = smoothstep(0.0, 1.0, x);
    return x;
  }

  vec3 Background(vec2 uv, vec2 baseDir, float time)
  {
      uv = uv * vec2(.75, .75);
      vec3 result = vec3(0.91, 0.56, 0.02);
      
      vec2 n = vec2(-baseDir.y, baseDir.x);
      
      result = mix(result, vec3(1.0) - result, Rythm(time));
      
      float lines = texture(iChannel0, vec2(uv.x * 0.1, uv.y * 2.) + vec2(time * 1.35, 0.0)).r;
      result += lines * lines * .75 + lines * lines * lines * .35;    
      // result *= smoothstep(.5, .0, abs(dot(uv, n)));
      
      return result;
  }

  vec3 Magic(float leadTime, vec3 baseColor, vec2 uv, vec2 baseDir, float time, float spread, float freq, float intensity)
  {
      int frame = iFrame / 12;
      
      float speed = -1.5 - ((Rythm(time)) * .5 + .5) * 2.0;
      //speed *= .2;
      vec2 dir = normalize(baseDir);
      
      
      uv -= dir * mix(.1, .3, Rythm(time));
      
      vec2 normal = vec2(-dir.y, dir.x);
      
      vec2 baseOffset = dir * speed * floor(float(iFrame) / 24.0);
      
      vec2 p = uv;
      p.y -= 0.4;
      p += dir * speed * (float(iFrame) / 24.0);
      p -= R2seq(int(floor(float(iFrame)/3.0))) * .05;
      p += normal * sin(time * 12.0) * .05;
              
      float ray = 0.0;
      float glow = 0.0;
      
      p += (texture(iChannel1, p * .015 + leadTime * .25).xy * 2.0 - 1.0) * .1;
      
      float leadIntro = mix(.3, .015, smoothstep(10.0, 14.0, time));
      
      float leadingTime = 1.0 - smoothstep(leadTime - .5, leadTime, time);
      float distanceToLead = dot(uv - .5, dir) - leadingTime * 2.0 - leadIntro;
      float leadingMask = smoothstep(-.85, -.0, distanceToLead);
      
      p += leadingMask * (texture(iChannel1, vec2(time * .01 + leadTime * .35)).xy * 2.0 - 1.0) * .35;
      
      float sizeIntro = smoothstep(13.85, 14.15, time);
      spread *= leadingMask * (1.0 - Rythm(time) * .75) * sizeIntro;
      
      for(int i = -12; i < 10; i++)
      {
      float offsetA = R1seq(i+frame) * 2.0 - 1.0;
          float offsetB = R1seq(i+frame+1) * 2.0 - 1.0;
          
          vec2 a = baseOffset + dir * float(i) * freq + normal * offsetA * spread;
          vec2 b = baseOffset + dir * float(i+1) * freq + normal * offsetB * spread;
          
          float sa = mix(.05, 3.0 * intensity, R1seq(frame*7+i-1)) * .005;
          float sb = mix(.05, 3.0 * intensity, R1seq(frame*7+i)) * .005;
          
          vec2 l = Line(a, b, p, dir, sa, sb);
          float d = .025 * leadingMask;
      
          ray += smoothstep(d, d * .75 - .0001, l.x);
          glow += .5 * leadingMask * smoothstep(d * 20.0, d, l.x);
      }

      ray = clamp(ray, 0.0, 1.0);
      return baseColor * (1.0 + glow * (Rythm(time * 16.0) * .05 + .025)) + vec3(ray) * intensity;
  }

  vec3 Background2(vec2 uv, float time) {
    // uv = uv * vec2(.75, .75);
    vec3 result = mix(uColor1, uColor2, 1. - uv.y);
    
    // vec2 n = vec2(-baseDir.y, baseDir.x);
    
    // result = mix(result, vec3(1.0) - result, Rythm(time));
    
    float lines = texture(iChannel0, vec2(uv.x * 0.1, uv.y * 2.) + vec2(time * 1.35, 0.0)).r;
    result += lines * lines * .75 + lines * lines * lines * .35;    
    // result *= smoothstep(.5, .0, abs(dot(uv, n)));
    
    return result;
  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
      float time = -.25 + floor(iTime * 1.1 * 24.0) / 24.0;
      // float intro = 1.; // smoothstep(12.85, 13.15, time);
      // vec2 uv = fragCoord/iResolution.xy;
      vec2 uv = fragCoord;
      
      uv.y -= .075;
      uv.x -= sin(time*4.0) * .2;
      
      vec2 baseDir = vec2(1., 0.);
      
      // vec3 col = Background(uv, baseDir, time);
      vec3 col = Background2(uv, time);
      
      float spread = .35 + (sin(time * 10.0) * .5 + .5);
      float freq = .6 - (sin(time * 4.0) * .5 + .5) * .2;
      
      
      float offset = 1.0 - (smoothstep(5.0, 7.0, time) * smoothstep( 14.0, 13.0, time));
      
      spread *= offset;
      
      col = Magic(.5, col, uv + vec2(.4, .1) * offset, baseDir, time, .2, .35, 1.0);
      col = Magic(3.0, col, uv + vec2(.2, .0) * offset, baseDir, time, .05, .15, .55);
      col = Magic(8.0, col, uv + vec2(.2, -.25) * offset, baseDir, time, .05, .15, .35);
      col = Magic(10.0, col, uv + vec2(-.15, -.35) * offset, baseDir, time, .04, .05, .75);
      col = Magic(11.0, col, uv + vec2(-.3, -.15) * offset, baseDir, time, .04, .05, .75);
      col = Magic(12.0, col, uv, baseDir, time, spread * .75, freq, 1.0);

      fragColor = vec4(col,1.0);
  }

  void main() {
    mainImage(gl_FragColor, tex_coords);
  }
`;

let iChannel0 = null;
let iChannel1 = null;
class LightningBgFxMesh extends THREE.Mesh {
  constructor() {
    if (!iChannel0 || !iChannel1) {
      const textureLoader = new THREE.TextureLoader();
      iChannel0 = textureLoader.load('/textures/pebbles.png');
      iChannel1 = textureLoader.load('/textures/noise.png');
    }
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
        iChannel0: {
          value: iChannel0,
          needsUpdate: true,
        },
        iChannel1: {
          value: iChannel1,
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
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: animeLightningFragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    /* quad.material.onBeforeCompile = shader => {
      console.log('got full screen shader', shader);
    }; */
    material.uniforms.iChannel0.value.wrapS = THREE.RepeatWrapping;
    material.uniforms.iChannel0.value.wrapT = THREE.RepeatWrapping;
    material.uniforms.iChannel1.value.wrapS = THREE.RepeatWrapping;
    material.uniforms.iChannel1.value.wrapT = THREE.RepeatWrapping;
    super(fullscreenGeometry, material);

    this.frustumCulled = false;
  }

  update(timestamp, timeDiff, width, height) {
    const timestampS = timestamp / 1000;

    const {colors} = gradients[Math.floor(timestampS) % gradients.length];

    this.material.uniforms.iTime.value = timestampS;
    this.material.uniforms.iTime.needsUpdate = true;

    this.material.uniforms.iFrame.value = Math.floor(timestampS * 60);
    this.material.uniforms.iFrame.needsUpdate = true;

    this.material.uniforms.uColor1.value.set(colors[0]);
    this.material.uniforms.uColor1.needsUpdate = true;

    this.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
    this.material.uniforms.uColor2.needsUpdate = true;
  }
}

export {LightningBgFxMesh};
