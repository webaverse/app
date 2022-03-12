export const fullscreenVertexShader = `\
  varying vec2 tex_coords;

  void main() {
    tex_coords = uv;
    gl_Position = vec4(position.xy, 1., 1.);
  }
`;
export const animeLightningFragmentShader = `\
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
export const animeRadialShader = `\
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
export const grassFragmentShader = `\
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
export const glyphFragmentShader = `\
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