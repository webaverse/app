import * as THREE from 'three';
import {
  getRenderer,
  sceneHighPriority,
  scene,
  sceneLowPriority,
} from './renderer.js';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {world} from './world.js';
import metaversefileApi from 'metaversefile';
// import {fitCameraToBoundingBox} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();

const regularScenes = [
  scene,
  sceneHighPriority,
];
const cameraHeight = 50;

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

const _makeMapRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});

const minimapWorldSize = 100;
const pixelRatio = window.devicePixelRatio;

const minimaps = [];
class MiniMap {
  constructor(width, height, worldWidth, worldHeight) {
    this.width = width;
    this.height = height;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.mapRenderTarget = null;
    this.topCamera = new THREE.OrthographicCamera(
      -minimapWorldSize*0.5,
      minimapWorldSize*0.5,
      minimapWorldSize*0.5,
      -minimapWorldSize*0.5,
      0,
      1000
    );

    this.canvases = [];
  }
  resetCanvases() {
    this.canvases.length = 0;
  }
  addCanvas(canvas) {
    const {width, height} = canvas;
    this.width = Math.max(this.width, width);
    this.height = Math.max(this.height, height);

    const ctx = canvas.getContext('2d');
    canvas.ctx = ctx;

    this.canvases.push(canvas);
  }
  update(timestamp, timeDiff) {
    // const timeOffset = timestamp - lastDisabledTime;

    if (!this.mapRenderTarget || (this.mapRenderTarget.width !== this.width * pixelRatio) || (this.mapRenderTarget.height !== this.height * pixelRatio)) {
      this.mapRenderTarget = _makeMapRenderTarget(this.width * pixelRatio, this.height * pixelRatio);
    }

    const localPlayer = metaversefileApi.useLocalPlayer();

    const renderer = getRenderer();
    const size = renderer.getSize(localVector2D);
    // a Vector2 representing the largest power of two less than or equal to the current canvas size
    const sizePowerOfTwo = localVector2D2.set(
      Math.pow(2, Math.floor(Math.log(size.x) / Math.log(2))),
      Math.pow(2, Math.floor(Math.log(size.y) / Math.log(2))),
    );
    if (sizePowerOfTwo.x < this.width || sizePowerOfTwo.y < this.height) {
      console.warn('renderer is too small');
      return;
    }
  
    // push old state
    // const oldParent = app.parent;
    // const oldRenderTarget = renderer.getRenderTarget();
    const oldViewport = renderer.getViewport(localVector4D);
  
    const _render = () => {
      // set up top camera
      this.topCamera.position.copy(localPlayer.position);
      this.topCamera.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          localVector.copy(localPlayer.position)
            .add(localVector3.set(0, cameraHeight, 0)),
          localPlayer.position,
          localVector2.set(0, 0, -1)
            .applyQuaternion(localPlayer.quaternion),
        )
      );
      this.topCamera.updateMatrixWorld();
      
      // render side scene
      // renderer.setRenderTarget(oldRenderTarget);
      renderer.setViewport(0, 0, this.width, this.height);
      renderer.clear();
      for (const scene of regularScenes) {
        renderer.render(scene, this.topCamera);
      }
  
      for (const canvas of this.canvases) {
        const {width, height, ctx} = canvas;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(
          renderer.domElement,
          0,
          size.y * pixelRatio - this.height * pixelRatio,
          this.width * pixelRatio,
          this.height * pixelRatio,
          0,
          0,
          width,
          height
        );
      }
    };
    _render();

    // pop old state
    // renderer.setRenderTarget(oldRenderTarget);
    renderer.setViewport(oldViewport);
  }
  destroy() {
    for (const canvas of canvases) {
      canvas.parentNode.removeChild(canvas);
    }
    minimaps.splice(minimaps.indexOf(this), 1);
  }
}

const minimapManager = {
  createMiniMap(width, height) {
    const minimap = new MiniMap(width, height);
    minimaps.push(minimap);
    return minimap;
  },
  update(timestamp, timeDiff) {
    for (const minimap of minimaps) {
      minimap.update(timestamp, timeDiff);
    }
  }
};

export default minimapManager;