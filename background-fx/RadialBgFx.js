import * as THREE from 'three';
import {
  fullscreenGeometry,
  gradients,
  fullscreenVertexShader,
} from './common.js';
// import {getRenderer} from '../renderer.js';

const animeRadialShader = `\
  uniform float iTime;
  uniform int iFrame;
  uniform sampler2D iChannel0;
  uniform sampler2D iChannel1;
  varying vec2 tex_coords;

  const float fps = 30.;
  const float intensityFactor = 0.5; // .8;
  const float minRadius = 0.2; // 0.1;
  const float maxRadius = 0.65;

  float hash( vec2 p ) {return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);} //Pseudo-random
  float smoothNoise( in vec2 p) { //Bilinearly interpolated noise (4 samples)
      vec2 i = floor( p ); vec2 f = fract( p );	
    vec2 u = f*f*(3.0-2.0*f);
      float a = hash( i + vec2(0.0,0.0) );
    float b = hash( i + vec2(1.0,0.0) );
    float c = hash( i + vec2(0.0,1.0) );
    float d = hash( i + vec2(1.0,1.0) );
      return float(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y)/4.;
  }
  //Funciton to make the noise continuous while wrapping around angle 
  float rotatedMirror(float t, float r){
      //t : 0->1
      t = fract(t+r);
      return 2.*abs(t-0.5);
  }
  //Some continous radial perlin noise
  const mat2 m2 = mat2(0.90,0.44,-0.44,0.90);
  float radialPerlinNoise(float t, float d){
      const float BUMP_MAP_UV_SCALE = 44.2;
      d = pow(d,0.01); //Impression of speed : stretch noise as the distance increases.
      float dOffset = -floor(iTime*fps)/fps; //Time drift (animation)
      vec2 p = vec2(rotatedMirror(t,0.1),d+dOffset);
      float f1 = smoothNoise(p*BUMP_MAP_UV_SCALE);
      p = 2.1*vec2(rotatedMirror(t,0.4),d+dOffset);
      float f2 = smoothNoise(p*BUMP_MAP_UV_SCALE);
      p = 3.7*vec2(rotatedMirror(t,0.8),d+dOffset);
      float f3 = smoothNoise(p*BUMP_MAP_UV_SCALE);
      p = 5.8*vec2(rotatedMirror(t,0.0),d+dOffset);
      float f4 = smoothNoise(p*BUMP_MAP_UV_SCALE);
      return (f1+0.5*f2+0.25*f3+0.125*f4)*3.;
  }
  //Colorize function (transforms BW Intensity to color)
  vec3 colorize(float f){
      f = clamp(f*.95,0.0,1.0);
      vec3 c = mix(vec3(0,0,1.1), vec3(0,1,1), f); //Red-Yellow Gradient
          c = mix(c, vec3(1,1,1), f*4.-3.0);      //While highlights
      vec3 cAttenuated = mix(vec3(0), c, f+0.1);       //Intensity ramp
      return cAttenuated;
  }
  /*vec3 colorize(float f){
      f = clamp(f,0.0,1.0);
      vec3 c = mix(vec3(1.1,0,0), vec3(1,1,0), f); //Red-Yellow Gradient
          c = mix(c, vec3(1,1,1), f*10.-9.);      //While highlights
      vec3 cAttenuated = mix(vec3(0), c, f);       //Intensity ramp
      return cAttenuated;
  }*/
  //Main image.
  void mainImage( out vec4 fragColor, in vec2 fragCoord ){
      // vec2 uv = 2.2*(fragCoord-0.5*vec2(iResolution.xy))/iResolution.xx;
      vec2 uv = 2.2 * ((fragCoord + vec2(0., 0.)) - 0.5);
      float d = dot(uv,uv); //Squared distance
      float t = 0.5+atan(uv.y,uv.x)/6.28; //Normalized Angle
      float v = radialPerlinNoise(t,d);
      //Saturate and offset values
      v = -2.5+v*4.5;
      //Intersity ramp from center
      v = mix(0.,v,intensityFactor*smoothstep(minRadius, maxRadius,d));
      //Colorize (palette remap )
      fragColor.rgb = colorize(v);
      fragColor.a = v;
  }

  void main() {
    mainImage(gl_FragColor, tex_coords);
  }
`;

class RadialBgFxMesh extends THREE.Mesh {
  constructor() {
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
        /* iChannel0: {
          value: textureLoader.load('/textures/pebbles.png'),
          // needsUpdate: true,
        },
        iChannel1: {
          value: textureLoader.load('/textures/noise.png'),
          // needsUpdate: true,
        }, */
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: animeRadialShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    });
    super(fullscreenGeometry, material);

    this.frustumCulled = false;
  }

  update(timestamp, timeDiff, width, height) {
    const timestampS = timestamp / 1000;

    this.material.uniforms.iTime.value = timestampS;
    this.material.uniforms.iTime.needsUpdate = true;

    this.material.uniforms.iFrame.value = Math.floor(timestampS * 60);
    this.material.uniforms.iFrame.needsUpdate = true;
  }
}

export {RadialBgFxMesh};
