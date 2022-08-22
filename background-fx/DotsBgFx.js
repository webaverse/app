import * as THREE from 'three';
import {
  fullscreenGeometry,
  gradients,
  fullscreenVertexShader,
} from './common.js';
// import {getRenderer} from '../renderer.js';

const dotsFragmentShader = `\
uniform float iTime;
uniform sampler2D iChannel0;
uniform vec2 iResolution;
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

float index = 3000.;
float rand(float x) {
  return sin(2. * x) + sin(PI * x);
}
float rand() {
  float n = index;
  index += 100.;
  return fract(sin(n) * 43758.5453123);
}
float randInRange(float min, float max) {
  return min + rand() * (max - min);
}

void mainImage( out vec4 fragColor, in vec2 originalUv )
{
  vec2 uv = originalUv;
  uv.y -= 0.5;
  uv.y *= iResolution.y / iResolution.x;
  uv.y += 0.5;

  const float minX = 0.;
  const float maxX = 1.;

  float aspectExtra = (iResolution.y / iResolution.x);
  float minY = - aspectExtra / 2.;
  float maxY = 1. + aspectExtra / 2.;

  const float maxRadius = 0.15;
  float radiusExtra = maxRadius;
  float extendedMinY = minY - radiusExtra;
  float extendedMaxY = maxY + radiusExtra;
  float modOffsetY = aspectExtra/2. + radiusExtra;
  float modRangeY = extendedMaxY - extendedMinY;

  float modOffsetX = radiusExtra;
  float modRangeX = 1. + radiusExtra*2.;

  vec4 col = vec4(0.0);

  int numCircles = 16;
  for (int i = 0; i < numCircles; i++) {
    vec2 point = vec2(randInRange(minX, maxX), randInRange(minY, maxY));
    float speed = (0.3 + rand() * 0.7);
    point.y += iTime * speed;
    point.y += modOffsetY;
    point.y = mod(point.y, modRangeY);
    point.y -= modOffsetY;

    float swayOffset = rand() * PI*2.;
    float swaySpeed = rand() * 0.2;
    point.x += rand(swayOffset + iTime * swaySpeed) * 0.3;
    point.x += modOffsetX;
    point.x = mod(point.x, modRangeX);
    point.x -= modOffsetX;

    float radius = (0.3 + pow(rand(), 2.) * 0.7) * maxRadius;
    // float radius = maxRadius;
    float brightness = 0.2 + rand() * 0.2;
    float distance = length(uv - point) - radius;
    if (distance < 0.0 && brightness > col.a) {
      col = vec4(vec3(brightness), brightness);
    }
  }

  // col.r += mod(iTime, 1.);
  
  fragColor = col;
}
void main() {
  mainImage(gl_FragColor, tex_coords);
}
`;

// let iChannel0 = null;
class DotsBgFxMesh extends THREE.Mesh {
  constructor() {
    /* if (!iChannel0) {
      const textureLoader = new THREE.TextureLoader();
      iChannel0 = textureLoader.load('/textures/lichen.jpg');
    } */
    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: true,
        },
        iResolution: {
          value: new THREE.Vector2(0, 0),
          needsUpdate: true,
        },
        /* iChannel0: {
          value: iChannel0,
          // needsUpdate: true,
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
      vertexShader: fullscreenVertexShader,
      fragmentShader: dotsFragmentShader,
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

    this.material.uniforms.iResolution.value.set(width, height);
    this.material.uniforms.iResolution.needsUpdate = true;

    this.material.uniforms.uColor1.value.set(colors[0]);
    this.material.uniforms.uColor1.needsUpdate = true;

    this.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
    this.material.uniforms.uColor2.needsUpdate = true;
  }
}

export {
  DotsBgFxMesh,
};