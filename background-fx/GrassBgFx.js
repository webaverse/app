import * as THREE from 'three';
import {
  fullscreenGeometry,
  gradients,
  fullscreenVertexShader,
} from './common.js';
// import {getRenderer} from '../renderer.js';

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

let iChannel0 = null;
let iChannel1 = null;
class GrassBgFxMesh extends THREE.Mesh {
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
        iChannel0: {
          value: iChannel0,
          needsUpdate: true,
        },
        iChannel1: {
          value: iChannel1,
          needsUpdate: true,
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
          value: new THREE.Color(0xffffff),
          needsUpdate: true,
        },
        /* outline_threshold: {
          value: .5,
          needsUpdate: true,
        }, */
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: grassFragmentShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    });
    super(fullscreenGeometry, material);

    this.frustumCulled = false;
  }

  update(timestamp, timeDiff, width, height) {
    const timestampS = timestamp / 1000;

    const {colors} = gradients[Math.floor(timestampS) % gradients.length];

    this.material.uniforms.iTime.value = timestampS;
    this.material.uniforms.iTime.needsUpdate = true;

    this.material.uniforms.uColor1.value.set(colors[0]);
    this.material.uniforms.uColor1.needsUpdate = true;

    this.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
    this.material.uniforms.uColor2.needsUpdate = true;
  }
}

export {GrassBgFxMesh};
