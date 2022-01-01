import * as THREE from 'three';
import {getRenderer} from './renderer.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {world} from './world.js';
import {Text} from 'troika-three-text';
import gradients from './gradients.json';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();

const bgVertexShader = `\
  varying vec2 tex_coords;

  void main() {
    tex_coords = uv;
    gl_Position = vec4(position.xy, 1., 1.);
  }
`;
const bgFragmentShader = `\
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
const emoteFragmentShader = `\
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
const emoteFragmentShader2 = `\
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
const bgMesh1 = (() => {
  const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
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
      fragmentShader: emoteFragmentShader,
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
const bgMesh2 = (() => {
  // const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
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
      fragmentShader: emoteFragmentShader2,
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
const bgMesh3 = (() => {
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
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
      fragmentShader: bgFragmentShader,
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
const bgMesh4 = (() => {
  const planeGeometry = new THREE.PlaneGeometry(2, 2);
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
const bgMesh5 = (() => {
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
const outlineMaterial = (() => {
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
    lights: true,
    // depthPacking: THREE.RGBADepthPacking,
    name: "detail-material",
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

const createPlayerDiorama = player => {
  const mmdCanvases = [];
  const mmdCanvasContexts = [];
  const avatarRenderTargets = [];

  const diorama = {
    update(timestamp, timeDiff) {
      const renderer = getRenderer();
      const size = renderer.getSize(new THREE.Vector2());
      // a Vector2 representing the largest power of two less than or equal to the current canvas size
      const sizePowerOfTwo = new THREE.Vector2(
        Math.pow(2, Math.floor(Math.log(size.x) / Math.log(2))),
        Math.pow(2, Math.floor(Math.log(size.y) / Math.log(2))),
      );
      if (sizePowerOfTwo.x < sideSize || sizePowerOfTwo.y < sideSize) {
        throw new Error('renderer is too small');
      }
    
      // push old state
      const oldParent = player.avatar.model.parent;
      const oldRenderTarget = renderer.getRenderTarget();
      const oldViewport = renderer.getViewport(new THREE.Vector4());
      const oldWorldLightParent = world.lights.parent;
    
      // setup
      const sideAvatarScene = new THREE.Scene();
      sideAvatarScene.overrideMaterial = outlineMaterial;
    
      const sideScene = new THREE.Scene();
      sideScene.add(bgMesh1);
      // sideScene.add(bgMesh2);
      sideScene.add(bgMesh3);
      sideScene.add(bgMesh4);
      sideScene.add(bgMesh5);
    
      const sideCamera = new THREE.PerspectiveCamera();
      /* sideCamera.position.y = 1.2;
      sideCamera.position.z = 2; */
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
    
      // render
      const pixelRatio = renderer.getPixelRatio();
      const numCanvases = 1;
      for (let i = 0; i < numCanvases; i++) {
        const x = i % sideSize;
        const y = Math.floor(i / sideSize);
        const dx = x * sideSize;
        const dy = y * sideSize;
        
        let mmdCanvas = mmdCanvases[i];
        let ctx = mmdCanvasContexts[i];
        if (!mmdCanvas) {
          mmdCanvas = document.createElement('canvas');
          mmdCanvas.width = sideSize;
          mmdCanvas.height = sideSize;
          mmdCanvas.style.cssText = `\
            position: absolute;
            width: ${sideSize}px;
            height: ${sideSize}px;
            top: ${dy.toFixed(8)}px;
            left: ${dx.toFixed(8)}px;
          `;
          ctx = mmdCanvas.getContext('2d');
          mmdCanvases[i] = mmdCanvas;
          mmdCanvasContexts[i] = ctx;
    
          document.body.appendChild(mmdCanvas);
        }
        let avatarRenderTarget = avatarRenderTargets[i];
        if (!avatarRenderTarget) {
          avatarRenderTarget = new THREE.WebGLRenderTarget(sideSize * pixelRatio, sideSize * pixelRatio, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
          });
          avatarRenderTargets[i] = avatarRenderTarget;
        }
        // set up side avatar scene
        sideAvatarScene.add(player.avatar.model);
        sideAvatarScene.add(world.lights);
        // render side avatar scene
        renderer.setRenderTarget(avatarRenderTarget);
        renderer.clear();
        renderer.render(sideAvatarScene, sideCamera);
        
        // set up side scene
        sideScene.add(player.avatar.model);
        sideScene.add(world.lights);
    
        const now = performance.now();
        bgMesh1.material.uniforms.iTime.value = now / 1000;
        bgMesh1.material.uniforms.iTime.needsUpdate = true;
        bgMesh1.material.uniforms.iFrame.value = Math.floor(now / 1000 * 60);
        bgMesh1.material.uniforms.iFrame.needsUpdate = true;
        const {colors} = gradients[Math.floor(bgMesh1.material.uniforms.iTime.value) % gradients.length];
        bgMesh1.material.uniforms.uColor1.value.set(colors[0]);
        bgMesh1.material.uniforms.uColor1.needsUpdate = true;
        bgMesh1.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
        bgMesh1.material.uniforms.uColor2.needsUpdate = true;
    
        bgMesh2.material.uniforms.iTime.value = now / 1000;
        bgMesh2.material.uniforms.iTime.needsUpdate = true;
        bgMesh2.material.uniforms.iFrame.value = Math.floor(now / 1000 * 60);
        bgMesh2.material.uniforms.iFrame.needsUpdate = true;
        
        bgMesh3.material.uniforms.t0.value = avatarRenderTarget.texture;
        bgMesh3.material.uniforms.t0.needsUpdate = true;
        bgMesh3.material.uniforms.uColor1.value.set(colors[0]);
        bgMesh3.material.uniforms.uColor1.needsUpdate = true;
        bgMesh3.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
        bgMesh3.material.uniforms.uColor2.needsUpdate = true;
    
        bgMesh4.material.uniforms.iTime.value = now / 1000;
        bgMesh4.material.uniforms.iTime.needsUpdate = true;
    
        for (const child of bgMesh5.children) {
          // console.log('got child', child);
          child.material.uniforms.uTroikaOutlineOpacity.value = now / 1000;
          child.material.uniforms.uTroikaOutlineOpacity.needsUpdate = true;
        }
        
        // render side scene
        renderer.setRenderTarget(oldRenderTarget);
        renderer.setViewport(0, 0, sideSize, sideSize);
        renderer.clear();
        renderer.render(sideScene, sideCamera);
    
        ctx.clearRect(0, 0, sideSize, sideSize);
        ctx.drawImage(renderer.domElement, 0, size.y * pixelRatio - sideSize * pixelRatio, sideSize * pixelRatio, sideSize * pixelRatio, 0, 0, sideSize, sideSize);
      }
    
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
      // renderer.setRenderTarget(oldRenderTarget);
      renderer.setViewport(oldViewport);
    },
    destroy() {
      for (const mmdCanvas of mmdCanvases) {
        mmdCanvas.parentNode.removeChild(mmdCanvas);
      }
      dioramas.splice(dioramas.indexOf(diorama), 1);
    },
  };
  dioramas.push(diorama);
  return diorama;
};

const dioramas = [];
const dioramaManager = {
  createPlayerDiorama,
  update(timestamp, timeDiff) {
    for (const diorama of dioramas) {
      diorama.update(timestamp, timeDiff);
    }
  }
};
export default dioramaManager;