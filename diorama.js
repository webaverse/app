import * as THREE from 'three';
import {getRenderer} from './renderer.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {world} from './world.js';
import {Text} from 'troika-three-text';
import gradients from './gradients.json';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();

const bgVertexShader = `\
  varying vec2 tex_coords;

  void main() {
    tex_coords = uv;
    gl_Position = vec4(position.xy, 1., 1.);
  }
`;
const outlineShader = `\
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
// this function maps the speed histogram to a position, integrated up to the given timestamp
const mapTime = (speedHistogram = new SpeedHistogram, time = 0) => {
  const {elements} = speedHistogram;
  const totalDistance = speedHistogram.totalDistance();
  // const totalDuration = speedHistogram.totalDuration();
  // const totalDistance = this.totalDistance();
  let currentTime = 0;
  let currentDistance = 0;
  for (let i = 0; i < elements.length; i++) {
    const {speed, duration} = elements[i];
    if (time < currentTime + duration) {
      currentDistance += speed * (time - currentTime);
      break;
    } else {
      currentTime += duration;
      currentDistance += speed * duration;
    }
  }
  return currentDistance / totalDistance;
};
// a container class that stores instantaneous speed changes over time
class SpeedHistogram {
  constructor() {
    this.elements = [];
  }
  add(speed, duration) {
    this.elements.push({speed, duration});
  }
  totalDuration() {
    const {elements} = this;
    let totalDuration = 0;
    for (let i = 0; i < elements.length; i++) {
      totalDuration += elements[i].duration;
    }
    return totalDuration;
  }
  totalDistance() {
    const {elements} = this;
    // const totalDuration = this.totalDuration();
    let totalDistance = 0;
    for (let i = 0; i < elements.length; i++) {
      totalDistance += elements[i].speed * elements[i].duration;
    }
    return totalDistance;
  }
  fromArray(elements) {
    this.elements = elements;
    return this;
  }
  toArray(frameRate = 60, startTime = 0, endTime = this.totalDuration()) {
    // const {elements} = this;
    // const totalDuration = this.totalDuration();
    // const totalDistance = this.totalDistance();
    const startTimeSeconds = startTime / 1000;
    const endTimeSeconds = endTime / 1000;
    // const startPosition = mapTime(this, startTime);
    // const endPosition = mapTime(this, endTime);
    const frameCount = Math.ceil(endTimeSeconds - startTimeSeconds) * frameRate;
    const positions = [];
    for (let i = 0; i < frameCount; i++) {
      const time = startTimeSeconds + i / frameRate;
      const position = mapTime(this, time * 1000);
      // const normalizedPosition = position / totalDistance;
      positions.push(position);
    }
    return positions;
  }
}
const histogram = new SpeedHistogram().fromArray([
  {speed: 10, duration: 100},
  {speed: 0.05, duration: 2000},
  {speed: 10, duration: 100},
]).toArray(60);
// window.histogram = histogram;
const labelAnimationRate = 3;
const labelVertexShader = `\
  uniform float iTime;
  attribute vec3 color;
  varying vec2 tex_coords;
  varying vec3 vColor;

  float frames[${histogram.length}] = float[${histogram.length}](${histogram.map(v => v.toFixed(8)).join(', ')});
  float mapTime(float t) {
    t /= ${labelAnimationRate.toFixed(8)};
    t = mod(t, 1.);

    const float l = ${histogram.length.toFixed(8)};
    float frameIndexFloat = floor(min(t, 0.999) * l);
    //return frameIndexFloat / l;

    int frameIndex = int(frameIndexFloat);
    float leftFrame = frames[frameIndex];
    // return leftFrame;

    float rightFrame = frames[frameIndex + 1];
    float frameStartTime = frameIndexFloat / l;
    float frameDuration = 1. / (l - 1.);
    float factor = (t - frameStartTime) / frameDuration;
    float frame = leftFrame*(1.-factor) + rightFrame*factor;
    return frame;
  }

  void main() {
    tex_coords = uv;
    vColor = color;
    float t = mapTime(iTime);
    gl_Position = vec4(position.xy + vec2(-2. + t * 4., 0.) * position.z, -1., 1.);
  }
`;
const labelFragmentShader = `\
  varying vec2 tex_coords;
  varying vec3 vColor;

  vec2 rotateCCW(vec2 pos, float angle) { 
    float ca = cos(angle),  sa = sin(angle);
    return pos * mat2(ca, sa, -sa, ca);  
  }

  vec2 rotateCCW(vec2 pos, vec2 around, float angle) { 
    pos -= around;
    pos = rotateCCW(pos, angle);
    pos += around;
    return pos;
  }

  // return 1 if v inside the box, return 0 otherwise
  bool insideAABB(vec2 v, vec2 bottomLeft, vec2 topRight) {
      vec2 s = step(bottomLeft, v) - step(topRight, v);
      return s.x * s.y > 0.;   
  }

  bool isPointInTriangle(vec2 point, vec2 a, vec2 b, vec2 c) {
    vec2 v0 = c - a;
    vec2 v1 = b - a;
    vec2 v2 = point - a;

    float dot00 = dot(v0, v0);
    float dot01 = dot(v0, v1);
    float dot02 = dot(v0, v2);
    float dot11 = dot(v1, v1);
    float dot12 = dot(v1, v2);

    float invDenom = 1. / (dot00 * dot11 - dot01 * dot01);
    float u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    float v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0.) && (v >= 0.) && (u + v < 1.);
  }

  void main() {
    vec3 c;
    if (vColor.r > 0.) {
      /* if (tex_coords.x <= 0.025 || tex_coords.x >= 0.975 || tex_coords.y <= 0.05 || tex_coords.y >= 0.95) {
        c = vec3(0.2);
      } else { */
        c = vec3(0.1 + tex_coords.y * 0.1);
      // }
    } else {
      c = vec3(0.);
    }
    gl_FragColor = vec4(c, 1.0);
  }
`;
const textVertexShader = `\
  uniform float uTroikaOutlineOpacity;
  // attribute vec3 color;
  attribute vec3 offset;
  attribute float scale;
  varying vec2 tex_coords;
  // varying vec3 vColor;

  float frames[${histogram.length}] = float[${histogram.length}](${histogram.map(v => v.toFixed(8)).join(', ')});
  float mapTime(float t) {
    t /= ${labelAnimationRate.toFixed(8)};
    t = mod(t, 1.);

    const float l = ${histogram.length.toFixed(8)};
    float frameIndexFloat = floor(min(t, 0.999) * l);
    //return frameIndexFloat / l;

    int frameIndex = int(frameIndexFloat);
    float leftFrame = frames[frameIndex];
    // return leftFrame;

    float rightFrame = frames[frameIndex + 1];
    float frameStartTime = frameIndexFloat / l;
    float frameDuration = 1. / (l - 1.);
    float factor = (t - frameStartTime) / frameDuration;
    float frame = leftFrame*(1.-factor) + rightFrame*factor;
    return frame;
  }

  void main() {
    tex_coords = uv;
    // vColor = color;

    float iTime = uTroikaOutlineOpacity;
    float t = mapTime(iTime);
    gl_Position = vec4(offset.xy + position.xy * scale + vec2(-2. + t * 4., 0.) * position.z, -1., 1.);
  }
`;
const textFragmentShader = `\
  void main() {
    gl_FragColor = vec4(vec3(1.), 1.);
  }
`;
const grassFragmentShader = `\
uniform sampler2D iChannel0;
uniform float iTime;
varying vec2 tex_coords;

// Quick and dirty line experiment to generate electric bolts :)

const float PI = 3.1415926535897932384626433832795;

float randStart = 0.;
float rand(float n){
  n = randStart + n*1000.;
  randStart += 1000.;
  return fract(sin(n) * 43758.5453123);
}

float noise(float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

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
	x = smoothstep(-1.0, 1.0, (x));
	x = smoothstep(0.0, 1.0, x);
	x = smoothstep(0.0, 1.0, x);
	x = smoothstep(0.0, 1.0, x);
	x = smoothstep(0.0, 1.0, x);
	return x;
}

const vec3 mainColor = vec3(1.0) - vec3(0.91, 0.56, 0.02);
vec3 Background(vec2 uv, vec2 baseDir, float time)
{
    uv = uv * vec2(.75, .75);
	vec3 result = mainColor;
    
    vec2 n = vec2(-baseDir.y, baseDir.x);
    
    // result = mix(result, vec3(1.0) - result, Rythm(time));
    
    float lines = texture(iChannel0, vec2(uv.y * 0.1, uv.x *  2.) + vec2(time * 1.35, 0.0)).r;
    result += lines * lines * .75 + lines * lines * lines * .35;
    float amount = smoothstep(.75, .0, abs(dot(uv, n)));
    result = mix(mainColor * 0.25, result, amount);
    
    return result;
}

vec2 rotateCCW(vec2 pos, float angle) { 
    float ca = cos(angle),  sa = sin(angle);
    return pos * mat2(ca, sa, -sa, ca);  
  }

  vec2 rotateCCW(vec2 pos, vec2 around, float angle) { 
    pos -= around;
    pos = rotateCCW(pos, angle);
    pos += around;
    return pos;
  }

  // return 1 if v inside the box, return 0 otherwise
  bool insideAABB(vec2 v, vec2 bottomLeft, vec2 topRight) {
      vec2 s = step(bottomLeft, v) - step(topRight, v);
      return s.x * s.y > 0.;   
  }

  bool isPointInTriangle(vec2 point, vec2 a, vec2 b, vec2 c) {
    vec2 v0 = c - a;
    vec2 v1 = b - a;
    vec2 v2 = point - a;

    float dot00 = dot(v0, v0);
    float dot01 = dot(v0, v1);
    float dot02 = dot(v0, v2);
    float dot11 = dot(v1, v1);
    float dot12 = dot(v1, v2);

    float invDenom = 1. / (dot00 * dot11 - dot01 * dot01);
    float u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    float v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0.) && (v >= 0.) && (u + v < 1.);
  }
  
float closestPointToPointParameter(vec2 start, vec2 end, vec2 point, bool clampToLine) {

    vec2 _startP = point - start;
    vec2 _startEnd = end - start;

    float startEnd2 = dot(_startEnd, _startEnd);
    float startEnd_startP = dot(_startEnd, _startP);

    float t = startEnd_startP / startEnd2;

    if (clampToLine) {
        t = clamp(t, 0., 1.);
    }

    return t;

}
vec2 closestPointToPointParameter2(vec2 start, vec2 end, float t) {
  vec2 delta = end - start;
  return delta * t + start;
}
vec2 closestPointToPoint( vec2 start, vec2 end, vec2 point, bool clampToLine ) {
    float t = closestPointToPointParameter(start, end, point, clampToLine);
    return closestPointToPointParameter2(start, end, t);
}

vec2 getOffset(float fi, float fj, float fnumBlades, float fnumSegments) {
    return (vec2(
      (noise(fi/fnumBlades*1000.) + noise(fj/fnumSegments)) * 0.5,
      (noise(fi/fnumBlades) + noise(fj/fnumSegments)) * 0.5
    ) - 0.5) * 2.;
}
vec2 getOffset2(float fi, float fj, float fnumBlades, float fnumSegments) {
    vec2 offset = getOffset(fi, fj, fnumBlades, fnumSegments);
    float timeOffset = (noise(fi) + noise(fj))*0.5;
    float speed = 0.5 + ((noise(fi) + noise(fj))*0.5)*0.5;
    offset = rotateCCW(offset, vec2(0.), sin((timeOffset + iTime * speed) * PI * 2.));
    return offset;
}
void mainImage( out vec4 fragColor, in vec2 mainUv )
{
    float time = iTime; // -.25 + floor(iTime * 1.1 * 24.0) / 24.0;
    float intro = 1.; // smoothstep(12.85, 13.15, time);
    // vec2 mainUv = fragCoord/iResolution.xy;
    
    vec2 uv = mainUv;
    float frameRate = 24.; // floor((3. + sin(time)) * 3. * 10.) / 10.;
    time = max(floor(time * frameRate)/frameRate, 0.01);
    
    uv.y -= .075;
    uv.x -= sin(time*30.0) * .4;
    
    vec2 baseDir = normalize(vec2(1., 0.));
    vec2 baseDir2 = normalize(vec2(0., 1.));
    
    vec3 col = Background(uv, baseDir, time) * intro;
    
    float spread = .35 + (sin(time * 10.0) * .5 + .5);
    float freq = .6 - (sin(time * 4.0) * .5 + .5) * .2;
    
    
    float offset = 1.0 - (smoothstep(5.0, 7.0, time) * smoothstep( 14.0, 13.0, time));
    
    spread *= offset;
    
   	/* col = Magic(.5, col, uv + vec2(.4, .1) * offset, baseDir2, time, .2, .35, 1.0);
    col = Magic(3.0, col, uv + vec2(.2, .0) * offset, baseDir2, time, .05, .15, .55);
    col = Magic(8.0, col, uv + vec2(.2, -.25) * offset, baseDir2, time, .05, .15, .35);
    col = Magic(10.0, col, uv + vec2(-.15, -.35) * offset, baseDir2, time, .04, .05, .75);
    col = Magic(11.0, col, uv + vec2(-.3, -.15) * offset, baseDir2, time, .04, .05, .75);
    col = Magic(12.0, col, uv, baseDir2, time, spread * .75, freq, 1.0); */
    
    const int numBlades = 20;
    const float fnumBlades = float(numBlades);
    const float w = 0.01;    
    for (int i = 0; i < numBlades; i++) {
      float fi = float(i);
      vec2 c = vec2(noise(fi/fnumBlades), 0.);
      float size = (0.5 + noise(fi/fnumBlades)*0.5) * 0.03;
      float segmentLength = 0.1 + noise(fi/fnumBlades)*0.05;
      float lx = c.x - size*0.5;
      float rx = c.x + size*0.5;
      
      float colorFactor = (0.5 + noise(fi)*0.5) * (0.5 + (1.0 - uv.y) * 0.5);
      colorFactor *= 0.8;
      // vec3 localColor = mix(mainColor * colorFactor, mainColor * 2., max(noise(iTime*2.) - 0.9, 0.)/(1. - 0.9));
      vec3 localColor = mainColor * colorFactor;
      // float alpha = 0.5 + noise(fi)*0.5;
      // vec3 mixColor = mix(col, localColor, alpha);
      vec3 mixColor = localColor;
      
      int numSegments = int(3. + noise(fi/fnumBlades) * 5.);
      float fnumSegments = float(numSegments);
      vec2 bladePermOffset = getOffset2(0., -2., fnumBlades, fnumSegments) * 0.1;
      // float bladeLength = fnumSegments * segmentLength;
      vec2 direction = normalize(vec2(0., 1.) + getOffset2(fi, -1., fnumBlades, fnumSegments) * 0.1) + bladePermOffset;
      vec2 nextC = c + direction * segmentLength;
      for (int j = 0; j < numSegments; j++) {
        float fj = float(j);
        
        vec2 delta = nextC - c;
        float deltaLength = length(delta);
        
        float t0 = closestPointToPointParameter(c, nextC, mainUv, true);
        float completeFactor = (fj + t0) / fnumSegments;
        completeFactor = clamp(pow(completeFactor, 5.), 0., 1.);
        float currentW = w * (1. - completeFactor);
        
        vec2 ac = c - delta * currentW;
        vec2 anextC = nextC + delta * currentW;
        
        float tUncapped = closestPointToPointParameter(ac, anextC, mainUv, false);
        float t = clamp(tUncapped, 0., 1.);
        vec2 cp = closestPointToPointParameter2(ac, anextC, t);
        float cpDistance = length(mainUv - cp);
        if (cpDistance < currentW) {
          /* vec2 cpUncapped = closestPointToPointParameter2(ac, anextC, tUncapped);
          float cpUncappedXDistance = mainUv.x - cpUncapped.x;
          if (cpUncappedXDistance >= currentW*0.5) {
              col = mixColor * 1.2;
          } else { */
              col = mixColor;
          // }
        }
        
        vec2 offset = getOffset2(fi, fj, fnumBlades, fnumSegments) * 0.4;
        direction = normalize(direction + offset + bladePermOffset);
        
        c = nextC;
        nextC = c + direction * segmentLength;
      }
      
      /* vec2 normal = vec2(direction.y, -direction.x);
      if (isPointInTriangle(mainUv, c - normal * w, c + normal * w, nextC)) {
        col = mixColor;
      } */
    }
    
    float distanceToCenter = length(vec2(((mainUv.x-0.5)*2.)+0.5, mainUv.y) - 0.5);
    col.rgb += (0.5-distanceToCenter)*0.5;
    
    float light = noise(iTime);
    float lightPower = clamp(pow(1.0 - mainUv.y, 2.), 0., 1.);
    col = col*(1.-light) + col*lightPower*light;

    fragColor = vec4(col,1.0);
}
void main() {
    mainImage(gl_FragColor, tex_coords);
}
`;
const glyphFragmentShader = `\
uniform float iTime;
uniform sampler2D iChannel0;
varying vec2 tex_coords;
/*

	draw letter shapes after subdividing uv space randomly

*/

#define PI 3.1415926535

// const vec3 mainColor = vec3(1.0) - vec3(0.91, 0.56, 0.02);
const vec3 mainColor1 = vec3(0.863,1.,0.741);
const vec3 mainColor2 = vec3(0.8,0.525,0.82);
// "#DCFFBD", "#CC86D1"

#define HorizontalAmplitude		0.30
#define VerticleAmplitude		0.20
#define HorizontalSpeed			0.90
#define VerticleSpeed			1.50
#define ParticleMinSize			1.76
#define ParticleMaxSize			1.61
#define ParticleBreathingSpeed		0.30
#define ParticleColorChangeSpeed	0.70
#define ParticleCount			2.0
#define ParticleColor1			mainColor1
#define ParticleColor2			mainColor2


float hash( float x )
{
    return fract( sin( x ) * 43758.5453 );
}

float noise( vec2 uv )  // Thanks Inigo Quilez
{
    vec3 x = vec3( uv.xy, 0.0 );
    
    vec3 p = floor( x );
    vec3 f = fract( x );
    
    f = f*f*(3.0 - 2.0*f);
    
    float offset = 57.0;
    
    float n = dot( p, vec3(1.0, offset, offset*2.0) );
    
    return mix(	mix(	mix( hash( n + 0.0 ), 		hash( n + 1.0 ), f.x ),
        				mix( hash( n + offset), 	hash( n + offset+1.0), f.x ), f.y ),
				mix(	mix( hash( n + offset*2.0), hash( n + offset*2.0+1.0), f.x),
                    	mix( hash( n + offset*3.0), hash( n + offset*3.0+1.0), f.x), f.y), f.z);
}

float snoise( vec2 uv )
{
    return noise( uv ) * 2.0 - 1.0;
}


float perlinNoise( vec2 uv )
{   
    float n = 		noise( uv * 1.0 ) 	* 128.0 +
        		noise( uv * 2.0 ) 	* 64.0 +
        		noise( uv * 4.0 ) 	* 32.0 +
        		noise( uv * 8.0 ) 	* 16.0 +
        		noise( uv * 16.0 ) 	* 8.0 +
        		noise( uv * 32.0 ) 	* 4.0 +
        		noise( uv * 64.0 ) 	* 2.0 +
        		noise( uv * 128.0 ) * 1.0;
    
    float noiseVal = n / ( 1.0 + 2.0 + 4.0 + 8.0 + 16.0 + 32.0 + 64.0 + 128.0 );
    noiseVal = abs(noiseVal * 2.0 - 1.0);
	
    return 	noiseVal;
}

float fBm( vec2 uv, float lacunarity, float gain )
{
    float sum = 0.0;
    float amp = 10.0;
    
    for( int i = 0; i < 2; ++i )
    {
        sum += ( perlinNoise( uv ) ) * amp;
        amp *= gain;
        uv *= lacunarity;
    }
    
    return sum;
}

vec3 particles( vec2 pos )
{
	
	vec3 c = vec3( 0, 0, 0 );
	
	float noiseFactor = fBm( pos, 0.01, 0.1);
	
	for( float i = 1.0; i < ParticleCount+1.0; ++i )
	{
		float cs = cos( iTime * HorizontalSpeed * (i/ParticleCount) + noiseFactor ) * HorizontalAmplitude;
		float ss = sin( iTime * VerticleSpeed   * (i/ParticleCount) + noiseFactor ) * VerticleAmplitude;
		vec2 origin = vec2( cs , ss );
		
		float t = sin( iTime * ParticleBreathingSpeed * i ) * 0.5 + 0.5;
		float particleSize = mix( ParticleMinSize, ParticleMaxSize, t );
		float d = clamp( sin( length( pos - origin )  + particleSize ), 0.0, particleSize);
		
		float t2 = sin( iTime * ParticleColorChangeSpeed * i ) * 0.5 + 0.5;
		vec3 color = mix( ParticleColor1, ParticleColor2, t2 );
		c += color * pow( d, 10.0 );
	}
	
	return c;
}
vec3 particles2(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  uv.y += 1.;
  uv /= 2.;
  // uv.x *= ( Resolution.x / Resolution.y );
  return particles( sin( abs(uv) ) );
}

float random2d(vec2 n) { 
    return fract(sin(dot(n, vec2(129.9898, 4.1414))) * 2398.5453);
}

vec2 getCellIJ(vec2 uv, float gridDims){
    return floor(uv * gridDims)/ gridDims;
}

vec2 rotate2D(vec2 position, float theta)
{
    mat2 m = mat2( cos(theta), -sin(theta), sin(theta), cos(theta) );
    return m * position;
}

//from https://github.com/keijiro/ShaderSketches/blob/master/Text.glsl
float letter(vec2 coord, float size)
{
    vec2 gp = floor(coord / size * 7.); // global
    vec2 rp = floor(fract(coord / size) * 7.); // repeated
    vec2 odd = fract(rp * 0.5) * 2.;
    float rnd = random2d(gp);
    float c = max(odd.x, odd.y) * step(0.5, rnd); // random lines
    c += min(odd.x, odd.y); // fill corner and center points
    c *= rp.x * (6. - rp.x); // cropping
    c *= rp.y * (6. - rp.y);
    return clamp(c, 0., 1.);
}

/* vec3 sphere(vec2 p) {
    float t = iTime;
    vec2 r = iResolution.xy;

    vec3 c;
    float l,z=t;
    for(int i=0;i<3;i++) {
        vec2 uv;
        p-=.5;
        p.x*=r.x/r.y;
        uv=p;
        l=length(p);
        uv+=p/l*abs(sin(l*7.-z*2.));
        uv *= smoothstep(0.2, 0.1, l);
        c.x=.1/length(uv);
        c.y=.1/length(uv);
        c.z=.1/length(uv);
    }
    return c;
} */

float avg(vec3 c) {
  return (c.r + c.g + c.b) / 3.;
}

void mainImage( out vec4 fragColor, in vec2 originalUv )
{

    // vec2 originalUv = fragCoord.xy / iResolution.xy;    
    //correct aspect ratio
    // uv.x *= iResolution.x/iResolution.y;
    vec2 mainUv = originalUv;
    mainUv.y = ((mainUv.y-0.5) * (0.8 + mainUv.x*0.3)) + 0.5;
    
    vec3 mainColor = mix(mainColor2, mainColor1, mainUv.y);

    float t = iTime;
    float scrollSpeed = 0.5;
    float alphaTest = 0.;
    float offsetSpeed = 0.1 + hash(floor(mainUv.x*6.)/6. * 1000.) * 0.15;
    float yOffset = -iTime * offsetSpeed;
    // float offsetColor = 0.5 + hash(floor(mainUv.x*6.)/6. * 2000.) * 1.;
    float offsetColor = 1.;
    float shadowFactor = 0.7;
    
    vec3 col = vec3(0.);
    // small
    {
        float dims = 3.0;
        int maxSubdivisions = 3;
    
        vec2 uv = mainUv;
        // uv = rotate2D(uv,PI/12.0);
        uv.y -= floor(iTime * scrollSpeed);
        uv.y += yOffset;

        float cellRand;
        vec2 ij;
        float light = 0.;

        for(int i = 0; i <= maxSubdivisions; i++) { 
            ij = getCellIJ(uv, dims);
            cellRand = random2d(ij);
            dims *= 2.0;
            //decide whether to subdivide cells again
            float cellRand2 = random2d(ij * floor(iTime*3.)/3. + 454.4543);
            light = max(cellRand2 - 0.9, 0.)/(1. - 0.9);
            if (cellRand2 > 0.3) {
                break; 
            }
        }

        //draw letters    
        float b = letter(uv, 1.0 / (dims));
        
        float distanceToCenter = length(mainUv - vec2(0.5, 0.));
        b *= (1.-distanceToCenter) * 2.;
        
        if (b > alphaTest) {
            col = vec3(avg(texture(iChannel0, mainUv + vec2(0., yOffset)).rgb) * 0.1);
            col += b * mainColor * (1. + light * 3.) * offsetColor * 0.15;
        }
    }
    // shadow
    {
        int count = 0;
        for (float dx = -1.; dx <= 1.; dx++) {
          for (float dy = -1.; dy <= 1.; dy++) {
            float dims = 0.5;

            vec2 shadowOffset = vec2(0.01) * vec2(-1., 1.);
            vec2 uv = mainUv + vec2(dx, dy)*0.001 + shadowOffset;
            // uv = rotate2D(uv,PI/12.0);
            uv.y -= floor(iTime * scrollSpeed * 4.);

            vec2 ij = getCellIJ(uv, dims);
            dims *= 2.0;

            //draw letters    
            float b = letter(uv, 1.0 / (dims));

            // b *= 0.5 + texture(iChannel0, mainUv * 0.1 + vec2(0., iTime * 4.)).r * 0.5;

            if (b > alphaTest) {
                count++;
            }
          }
        }
        if (count >= 4) {
            col = mainColor * shadowFactor;
        }
    }
    // main
    {
        int count = 0;
        for (float dx = -1.; dx <= 1.; dx++) {
          for (float dy = -1.; dy <= 1.; dy++) {
            float dims = 0.5;

            vec2 uv = mainUv + vec2(dx, dy)*0.001;
            // uv = rotate2D(uv,PI/12.0);
            uv.y -= floor(iTime * scrollSpeed * 4.);

            vec2 ij = getCellIJ(uv, dims);
            dims *= 2.0;

            //draw letters    
            float b = letter(uv, 1.0 / (dims));

            // b *= 0.5 + texture(iChannel0, mainUv * 0.1 + vec2(0., iTime * 4.)).r * 0.5;

            if (b > alphaTest) {
                count++;
            }
          }
        }
        if (count >= 4) {
          col = mainColor;
        }
    }
    
    // col *= sphere(mainUv);
    
    float distanceToCenter = length(mainUv - 0.5);
    col *= 0.9 + (1.-distanceToCenter) * 0.1;
    
    // col += speed_lines(mainUv);
    
    fragColor = vec4(col, 1.0);
}
void main() {
    mainImage(gl_FragColor, tex_coords);
}
`;
const planeGeometry = new THREE.PlaneGeometry(2, 2);
async function makeTextMesh(
  text = '',
  material = null,
  font = '/fonts/Bangers-Regular.ttf',
  fontSize = 1,
  letterSpacing = 0,
  anchorX = 'left',
  anchorY = 'middle',
  color = 0x000000,
) {
  const textMesh = new Text();
  textMesh.text = text;
  if (material !== null) {
    textMesh.material = material;
  }
  textMesh.font = font;
  textMesh.fontSize = fontSize;
  textMesh.letterSpacing = letterSpacing;
  textMesh.color = color;
  textMesh.anchorX = anchorX;
  textMesh.anchorY = anchorY;
  textMesh.frustumCulled = false;
  await new Promise(accept => {
    textMesh.sync(accept);
  });
  return textMesh;
}
const lightningMesh = (() => {
  const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
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
        },
      },
      vertexShader: bgVertexShader,
      fragmentShader: animeLightningFragmentShader,
      depthWrite: false,
      depthTest: false,
    })
  );
  /* quad.material.onBeforeCompile = shader => {
    console.log('got full screen shader', shader);
  }; */
  quad.material.uniforms.iChannel0.value.wrapS = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel0.value.wrapT = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel1.value.wrapS = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel1.value.wrapT = THREE.RepeatWrapping;
  quad.frustumCulled = false;
  return quad;
})();
const radialMesh = (() => {
  // const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
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
      vertexShader: bgVertexShader,
      fragmentShader: animeRadialShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    })
  );
  /* quad.material.onBeforeCompile = shader => {
    console.log('got full screen shader', shader);
  }; */
  /* quad.material.uniforms.iChannel0.value.wrapS = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel0.value.wrapT = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel1.value.wrapS = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel1.value.wrapT = THREE.RepeatWrapping; */
  quad.frustumCulled = false;
  return quad;
})();
const outlineMesh = (() => {
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
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
          value: new THREE.Color(0xFFFFFF),
          needsUpdate: true,
        },
        outline_threshold: {
          value: .5,
          needsUpdate: true,
        },
      },
      vertexShader: bgVertexShader,
      fragmentShader: outlineShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    })
  );
  /* quad.material.onBeforeCompile = shader => {
    console.log('got full screen shader', shader);
  }; */
  quad.frustumCulled = false;
  return quad;
})();
const sideSize = 512;
const s1 = 0.4;
const sk1 = 0.2;
const speed1 = 1;
const aspectRatio1 = 0.3;
const p1 = new THREE.Vector3(0.45, -0.65, 0);
const s2 = 0.5;
const sk2 = 0.1;
const speed2 = 1.5;
const aspectRatio2 = 0.15;
const p2 = new THREE.Vector3(0.35, -0.825, 0);
const labelMesh = (() => {
  const _decorateGeometry = (g, color, z) => {
    const colors = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      color.toArray(colors, i);
      g.attributes.position.array[i + 2] = z;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  };
  const g1 = planeGeometry.clone()
    .applyMatrix4(
      new THREE.Matrix4()
        .makeShear(0, 0, sk1, 0, 0, 0)
    )
    .applyMatrix4(
      new THREE.Matrix4()
        .makeScale(s1, s1 * aspectRatio1, 1)
    )
    .applyMatrix4(
      new THREE.Matrix4()
        .makeTranslation(p1.x, p1.y, p1.z)
    );
  _decorateGeometry(g1, new THREE.Color(0xFFFFFF), speed1);
  const g2 = planeGeometry.clone()
    .applyMatrix4(
      new THREE.Matrix4()
        .makeShear(0, 0, sk2, 0, 0, 0)
    )
    .applyMatrix4(
      new THREE.Matrix4()
        .makeScale(s2, s2 * aspectRatio2, 1)
    )
    .applyMatrix4(
      new THREE.Matrix4()
        .makeTranslation(p2.x, p2.y, p2.z)
    );
  _decorateGeometry(g2, new THREE.Color(0x000000), speed2);
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    g2,
    g1,
  ]);
  const quad = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: false,
        },
        /* outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        },
        outline_colour: {
          value: new THREE.Color(0, 0, 1),
          needsUpdate: true,
        },
        outline_threshold: {
          value: .5,
          needsUpdate: true,
        }, */
      },
      vertexShader: labelVertexShader,
      fragmentShader: labelFragmentShader,
    })
  );
  quad.frustumCulled = false;
  return quad;
})();
const grassMesh = (() => {
  const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: false,
        },
        iChannel0: {
          value: textureLoader.load('/textures/pebbles.png'),
          // needsUpdate: true,
        },
        iChannel1: {
          value: textureLoader.load('/textures/noise.png'),
          // needsUpdate: true,
        },
        /* iFrame: {
          value: 0,
          needsUpdate: false,
        }, */
        /* outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        }, */
        uColor1: {
          value: new THREE.Color(0x000000),
          needsUpdate: true,
        },
        uColor2: {
          value: new THREE.Color(0xFFFFFF),
          needsUpdate: true,
        },
        /* outline_threshold: {
          value: .5,
          needsUpdate: true,
        }, */
      },
      vertexShader: bgVertexShader,
      fragmentShader: grassFragmentShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    })
  );
  quad.frustumCulled = false;
  return quad;
})();
const glyphMesh = (() => {
  const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          // needsUpdate: true,
        },
        iChannel0: {
          value: textureLoader.load('/textures/lichen.jpg'),
          // needsUpdate: true,
        },
        /* outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        }, */
        uColor1: {
          value: new THREE.Color(0x000000),
          needsUpdate: true,
        },
        uColor2: {
          value: new THREE.Color(0xFFFFFF),
          needsUpdate: true,
        },
        /* outline_threshold: {
          value: .5,
          needsUpdate: true,
        }, */
      },
      vertexShader: bgVertexShader,
      fragmentShader: glyphFragmentShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    })
  );
  quad.frustumCulled = false;
  return quad;
})();
const textObject = (() => {
  const o = new THREE.Object3D();
  
  const _decorateGeometry = (g, offset, z, scale) => {
    const offsets = new Float32Array(g.attributes.position.array.length);
    const scales = new Float32Array(g.attributes.position.count);
    for (let i = 0; i < g.attributes.position.array.length; i += 3) {
      offset.toArray(offsets, i);
      g.attributes.position.array[i + 2] = z;
      scales[i / 3] = scale;
    }
    g.setAttribute('offset', new THREE.BufferAttribute(offsets, 3));
    g.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
  };
  const textMaterial = new THREE.ShaderMaterial({
    vertexShader: textVertexShader,
    fragmentShader: textFragmentShader,
  });
  (async () => {
    const nameMesh = await makeTextMesh(
      'Scillia',
      textMaterial,
      '/fonts/WinchesterCaps.ttf',
      1.25,
      0.05,
      'center',
      'middle',
      0xFFFFFF,
    );
    _decorateGeometry(nameMesh.geometry, p1, speed1, s1 * aspectRatio1);
    o.add(nameMesh);
  })();
  (async () => {
    const labelMesh = await makeTextMesh(
      'pledged to the lisk',
      textMaterial,
      '/fonts/Plaza Regular.ttf',
      1,
      0.02,
      'center',
      'middle',
      0xFFFFFF,
    );
    _decorateGeometry(labelMesh.geometry, p2, speed2, s2 * aspectRatio2);
    o.add(labelMesh);
  })();
  return o;
})();
const skinnedRedMaterial = (() => {
  var wVertex = THREE.ShaderLib["standard"].vertexShader;
  var wFragment = THREE.ShaderLib["standard"].fragmentShader;
  var wUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib["standard"].uniforms);
  wUniforms.iTime = {
    value: 0,
    needsUpdate: false,
  };
  wVertex = `\
    attribute vec3 offset;
    attribute vec4 orientation;

    vec3 applyQuaternionToVector(vec4 q, vec3 v){
      return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
    }

  ` + wVertex;

  wVertex = wVertex.replace(`\
    #include <project_vertex>
    vec3 vPosition = applyQuaternionToVector(orientation, transformed);

    vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
    
  `);
  wFragment = `\
    void main() {
      gl_FragColor = vec4(1., 0., 0., 1.);
    }
  `;
  var instanceMaterial = new THREE.ShaderMaterial({
    uniforms: wUniforms,
    vertexShader: wVertex,
    fragmentShader: wFragment,
    // lights: true,
    // depthPacking: THREE.RGBADepthPacking,
    // name: "detail-material",
    // fog: true,
    extensions: {
      derivatives: true,
    },
    side: THREE.BackSide,
  });
  /* instanceMaterial.onBeforeCompile = () => {
    console.log('before compile');
  }; */
  return instanceMaterial;
})();

const sideAvatarScene = new THREE.Scene();
sideAvatarScene.overrideMaterial = skinnedRedMaterial;

const sideScene = new THREE.Scene();
sideScene.add(lightningMesh);
sideScene.add(radialMesh);
sideScene.add(grassMesh);
sideScene.add(glyphMesh);
sideScene.add(outlineMesh);
sideScene.add(labelMesh);
sideScene.add(textObject);

const sideCamera = new THREE.PerspectiveCamera();

const _makeCanvas = (w, h) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.cssText = `\
    position: absolute;
    /* width: ${w}px;
    height: ${h}px; */
    top: 0px;
    left: 0px;
  `;
  return canvas;
};
const _makeOutlineRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
const createPlayerDiorama = (player, {
  canvas,
  label = null,
  outline = false,
  lightningBackground = false,
  radialBackground = false,
  glyphBackground = false,
  grassBackground = false,
} = {}) => {
  const {devicePixelRatio: pixelRatio} = window;

  if (!canvas) {
    canvas = _makeCanvas(sideSize, sideSize);
    document.body.appendChild(canvas);
  }
  const {width, height} = canvas;
  const ctx = canvas.getContext('2d');
  const outlineRenderTarget = _makeOutlineRenderTarget(width * pixelRatio, height * pixelRatio);

  const diorama = {
    enabled: true,
    update(timestamp, timeDiff) {
      const renderer = getRenderer();
      const size = renderer.getSize(localVector2D);
      // a Vector2 representing the largest power of two less than or equal to the current canvas size
      const sizePowerOfTwo = localVector2D2.set(
        Math.pow(2, Math.floor(Math.log(size.x) / Math.log(2))),
        Math.pow(2, Math.floor(Math.log(size.y) / Math.log(2))),
      );
      if (sizePowerOfTwo.x < width || sizePowerOfTwo.y < height) {
        throw new Error('renderer is too small');
      }

      if (player.avatar) {
        // push old state
        const oldParent = player.avatar.model.parent;
        const oldRenderTarget = renderer.getRenderTarget();
        const oldViewport = renderer.getViewport(localVector4D);
        const oldWorldLightParent = world.lights.parent;
      
        const _render = () => {
          // set up side camera
          sideCamera.position.copy(player.position)
            .add(localVector.set(0.3, 0, -0.5).applyQuaternion(player.quaternion));
          sideCamera.quaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              sideCamera.position,
              player.position,
              localVector3.set(0, 1, 0)
            )
          );
          sideCamera.updateMatrixWorld();

          // set up side avatar scene
          sideAvatarScene.add(player.avatar.model);
          sideAvatarScene.add(world.lights);
          // render side avatar scene
          renderer.setRenderTarget(outlineRenderTarget);
          renderer.clear();
          renderer.render(sideAvatarScene, sideCamera);
          
          // set up side scene
          sideScene.add(player.avatar.model);
          sideScene.add(world.lights);
      
          const now = performance.now();
          const {colors} = gradients[Math.floor(lightningMesh.material.uniforms.iTime.value) % gradients.length];
          if (lightningBackground) {
            lightningMesh.material.uniforms.iTime.value = now / 1000;
            lightningMesh.material.uniforms.iTime.needsUpdate = true;
            lightningMesh.material.uniforms.iFrame.value = Math.floor(now / 1000 * 60);
            lightningMesh.material.uniforms.iFrame.needsUpdate = true;
            lightningMesh.material.uniforms.uColor1.value.set(colors[0]);
            lightningMesh.material.uniforms.uColor1.needsUpdate = true;
            lightningMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
            lightningMesh.material.uniforms.uColor2.needsUpdate = true;
            lightningMesh.visible = true;
          } else {
            lightningMesh.visible = false;
          }
          if (radialBackground) {
            radialMesh.material.uniforms.iTime.value = now / 1000;
            radialMesh.material.uniforms.iTime.needsUpdate = true;
            radialMesh.material.uniforms.iFrame.value = Math.floor(now / 1000 * 60);
            radialMesh.material.uniforms.iFrame.needsUpdate = true;
            radialMesh.visible = true;
          } else {
            radialMesh.visible = false;
          }
          if (grassBackground) {
            grassMesh.material.uniforms.iTime.value = now / 1000;
            grassMesh.material.uniforms.iTime.needsUpdate = true;
            grassMesh.material.uniforms.uColor1.value.set(colors[0]);
            grassMesh.material.uniforms.uColor1.needsUpdate = true;
            grassMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
            grassMesh.material.uniforms.uColor2.needsUpdate = true;
            grassMesh.visible = true;
          } else {
            grassMesh.visible = false;
          }
          if (glyphBackground) {
            glyphMesh.material.uniforms.iTime.value = now / 1000;
            glyphMesh.material.uniforms.iTime.needsUpdate = true;
            glyphMesh.material.uniforms.uColor1.value.set(colors[0]);
            glyphMesh.material.uniforms.uColor1.needsUpdate = true;
            glyphMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
            glyphMesh.material.uniforms.uColor2.needsUpdate = true;
            glyphMesh.visible = true;
          } else {
            glyphMesh.visible = false;
          }
          if (outline) {
            outlineMesh.material.uniforms.t0.value = outlineRenderTarget.texture;
            outlineMesh.material.uniforms.t0.needsUpdate = true;
            outlineMesh.material.uniforms.uColor1.value.set(colors[0]);
            outlineMesh.material.uniforms.uColor1.needsUpdate = true;
            outlineMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
            outlineMesh.material.uniforms.uColor2.needsUpdate = true;
            outlineMesh.visible = true;
          } else {
            outlineMesh.visible = false;
          }
          if (label) {
            labelMesh.material.uniforms.iTime.value = now / 1000;
            labelMesh.material.uniforms.iTime.needsUpdate = true;
            labelMesh.visible = true;
            for (const child of textObject.children) {
              child.material.uniforms.uTroikaOutlineOpacity.value = now / 1000;
              child.material.uniforms.uTroikaOutlineOpacity.needsUpdate = true;
            }
            textObject.visible = true;
          } else {
            labelMesh.visible = false;
            textObject.visible = false;
          }
          
          // render side scene
          renderer.setRenderTarget(oldRenderTarget);
          renderer.setViewport(0, 0, width, height);
          renderer.clear();
          renderer.render(sideScene, sideCamera);
      
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(
            renderer.domElement,
            0,
            size.y * pixelRatio - height * pixelRatio,
            width * pixelRatio,
            height * pixelRatio,
            0,
            0,
            width,
            height
          );
        };
        _render();

        // pop old state
        if (oldParent) {
          oldParent.add(player.avatar.model);
        } else {
          player.avatar.model.parent.remove(player.avatar.model);
        }
        if (oldWorldLightParent) {
          oldWorldLightParent.add(world.lights);
        } else {
          world.lights.parent.remove(world.lights);
        }
        renderer.setRenderTarget(oldRenderTarget);
        renderer.setViewport(oldViewport);
      }
    },
    destroy() {
      canvas.parentNode.removeChild(canvas);
      dioramas.splice(dioramas.indexOf(diorama), 1);
    },
  };
  dioramas.push(diorama);
  return diorama;
};
const createAppDiorama = (app, {
  canvas,
  label = null,
  outline = false,
  lightningBackground = false,
  radialBackground = false,
  grassBackground = false,
  glyphBackground = false,
} = {}) => {
  const {devicePixelRatio: pixelRatio} = window;

  if (!canvas) {
    canvas = _makeCanvas(sideSize, sideSize);
    document.body.appendChild(canvas);
  }
  const {width, height} = canvas;
  const ctx = canvas.getContext('2d');
  const outlineRenderTarget = _makeOutlineRenderTarget(width * pixelRatio, height * pixelRatio);

  const diorama = {
    enabled: true,
    update(timestamp, timeDiff) {
      const renderer = getRenderer();
      const size = renderer.getSize(localVector2D);
      // a Vector2 representing the largest power of two less than or equal to the current canvas size
      const sizePowerOfTwo = localVector2D2.set(
        Math.pow(2, Math.floor(Math.log(size.x) / Math.log(2))),
        Math.pow(2, Math.floor(Math.log(size.y) / Math.log(2))),
      );
      if (sizePowerOfTwo.x < width || sizePowerOfTwo.y < height) {
        throw new Error('renderer is too small');
      }
    
      // push old state
      const oldParent = app.parent;
      const oldRenderTarget = renderer.getRenderTarget();
      const oldViewport = renderer.getViewport(localVector4D);
      const oldWorldLightParent = world.lights.parent;
    
      const _render = () => {
        // set up side camera
        const angle = ((timestamp / 3000) % 1) * Math.PI * 2;
        sideCamera.position.copy(app.position)
          .add(
            localVector.set(Math.cos(angle), 0, Math.sin(angle))
              .applyQuaternion(app.quaternion)
              .multiplyScalar(2)
          );
        // console.log('got position', sideCamera.position.toArray().join(','));
        sideCamera.quaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            sideCamera.position,
            app.position,
            localVector3.set(0, 1, 0)
          )
        );
        sideCamera.updateMatrixWorld();

        // set up side avatar scene
        sideAvatarScene.add(app);
        sideAvatarScene.add(world.lights);
        // render side avatar scene
        renderer.setRenderTarget(outlineRenderTarget);
        renderer.clear();
        renderer.render(sideAvatarScene, sideCamera);
        
        // set up side scene
        sideScene.add(app);
        sideScene.add(world.lights);
    
        const now = performance.now();
        const {colors} = gradients[Math.floor(lightningMesh.material.uniforms.iTime.value) % gradients.length];
        if (lightningBackground) {
          lightningMesh.material.uniforms.iTime.value = now / 1000;
          lightningMesh.material.uniforms.iTime.needsUpdate = true;
          lightningMesh.material.uniforms.iFrame.value = Math.floor(now / 1000 * 60);
          lightningMesh.material.uniforms.iFrame.needsUpdate = true;
          lightningMesh.material.uniforms.uColor1.value.set(colors[0]);
          lightningMesh.material.uniforms.uColor1.needsUpdate = true;
          lightningMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
          lightningMesh.material.uniforms.uColor2.needsUpdate = true;
          lightningMesh.visible = true;
        } else {
          lightningMesh.visible = false;
        }
        if (radialBackground) {
          radialMesh.material.uniforms.iTime.value = now / 1000;
          radialMesh.material.uniforms.iTime.needsUpdate = true;
          radialMesh.material.uniforms.iFrame.value = Math.floor(now / 1000 * 60);
          radialMesh.material.uniforms.iFrame.needsUpdate = true;
          radialMesh.visible = true;
        } else {
          radialMesh.visible = false;
        }
        if (grassBackground) {
          grassMesh.material.uniforms.iTime.value = now / 1000;
          grassMesh.material.uniforms.iTime.needsUpdate = true;
          grassMesh.material.uniforms.uColor1.value.set(colors[0]);
          grassMesh.material.uniforms.uColor1.needsUpdate = true;
          grassMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
          grassMesh.material.uniforms.uColor2.needsUpdate = true;
          grassMesh.visible = true;
        } else {
          grassMesh.visible = false;
        }
        if (glyphBackground) {
          glyphMesh.material.uniforms.iTime.value = now / 1000;
          glyphMesh.material.uniforms.iTime.needsUpdate = true;
          glyphMesh.material.uniforms.uColor1.value.set(colors[0]);
          glyphMesh.material.uniforms.uColor1.needsUpdate = true;
          glyphMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
          glyphMesh.material.uniforms.uColor2.needsUpdate = true;
          glyphMesh.visible = true;
        } else {
          glyphMesh.visible = false;
        }
        if (outline) {
          outlineMesh.material.uniforms.t0.value = outlineRenderTarget.texture;
          outlineMesh.material.uniforms.t0.needsUpdate = true;
          outlineMesh.material.uniforms.uColor1.value.set(colors[0]);
          outlineMesh.material.uniforms.uColor1.needsUpdate = true;
          outlineMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
          outlineMesh.material.uniforms.uColor2.needsUpdate = true;
          outlineMesh.visible = true;
        } else {
          outlineMesh.visible = false;
        }
        if (label) {
          labelMesh.material.uniforms.iTime.value = now / 1000;
          labelMesh.material.uniforms.iTime.needsUpdate = true;
          labelMesh.visible = true;
          for (const child of textObject.children) {
            child.material.uniforms.uTroikaOutlineOpacity.value = now / 1000;
            child.material.uniforms.uTroikaOutlineOpacity.needsUpdate = true;
          }
          textObject.visible = true;
        } else {
          labelMesh.visible = false;
          textObject.visible = false;
        }
        
        // render side scene
        renderer.setRenderTarget(oldRenderTarget);
        renderer.setViewport(0, 0, width, height);
        renderer.clear();
        renderer.render(sideScene, sideCamera);
    
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(
          renderer.domElement,
          0,
          size.y * pixelRatio - height * pixelRatio,
          width * pixelRatio,
          height * pixelRatio,
          0,
          0,
          width,
          height
        );
      };
      _render();

      // pop old state
      if (oldParent) {
        oldParent.add(app);
      } else {
        app.parent.remove(app);
      }
      if (oldWorldLightParent) {
        oldWorldLightParent.add(world.lights);
      } else {
        world.lights.parent.remove(world.lights);
      }
      renderer.setRenderTarget(oldRenderTarget);
      renderer.setViewport(oldViewport);
    },
    destroy() {
      canvas.parentNode.removeChild(canvas);
      dioramas.splice(dioramas.indexOf(diorama), 1);
    },
  };
  dioramas.push(diorama);
  return diorama;
};

const dioramas = [];
const dioramaManager = {
  createPlayerDiorama,
  createAppDiorama,
  update(timestamp, timeDiff) {
    for (const diorama of dioramas) {
      if (diorama.enabled) {
        diorama.update(timestamp, timeDiff);
      }
    }
  }
};
export default dioramaManager;