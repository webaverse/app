import * as THREE from 'three';
import {fullscreenGeometry, fullscreenVertexShader} from './common.js';

const fragmentShader = `\
/*

	draw letter shapes after subdividing uv space randomly

*/

#define PI 3.1415926535

const vec3 mainColor1 = vec3(0.25882352941176473, 0.6470588235294118, 0.9607843137254902);
const vec3 mainColor2 = vec3(0.050980392156862744, 0.27450980392156865, 0.6274509803921569);
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

uniform float iTime;
uniform float aspectRatio;
varying vec2 tex_coords;



// Simplex 2D noise
//
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise2(vec2 v){
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
}





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
    // c += min(odd.x, odd.y); // fill corner and center points
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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec2 originalUv = fragCoord;
    //correct aspect ratio
    // uv.x *= iResolution.x/iResolution.y;
    vec2 mainUv = originalUv;

    // rotate
    mainUv.y = ((mainUv.y-0.3) * (-abs(mainUv.x - 0.5) + 2.)) + 1.;
    mainUv.y *= 0.25;

    /* mainUv.x -= 0.5;
    mainUv.x /= aspectRatio;   
    mainUv.x += 0.5; */
    
    vec3 mainColor = mix(mainColor2, mainColor1, mainUv.y);
    mainColor.gb += mainUv;

    float t = iTime;
    float scrollSpeed = 0.5;
    float alphaTest = 0.;
    float numCols = 14.;
    float offsetSpeed = 0.3 + hash(floor(mainUv.x*numCols)/numCols) * 0.2;
    float yOffset = iTime * offsetSpeed;
    float offsetColor = 1.;
    float shadowFactor = 0.7;
    
    vec3 col = vec3(0.);
    // small
    {
        float dims = numCols;
    
        vec2 uv = mainUv;
        
        // unrotate
        uv *= 2.;
        
        // uv = rotate2D(uv,PI/12.0);
        // uv.y -= floor(iTime * scrollSpeed);
        uv.y += yOffset;
        
        if (uv.y >= 1.25) {
            float cellRand;
            vec2 ij;
            float light = 0.;
            float lastLight = 0.;
            float factor = 1.;

            {
                int i = 0;
                ij = getCellIJ(uv, dims);
                cellRand = random2d(ij);
                // dims *= 2.0;
                //decide whether to subdivide cells again
                float cellRand2 = random2d(ij * floor((iTime)*2.)/2. + 1.);

                uv.y += floor(pow(cellRand2, 3.) * 2.) / 2.;

                if (cellRand2 < 0.1) { // off
                  factor = 0.;
                } else if (cellRand < 0.2) { // blink
                  factor = floor(random2d((ij + 1000. + vec2(0., iTime*0.04))) * 1.1);
                }

                float cellRand3 = snoise2(ij + vec2(0., iTime*0.2));
                if (cellRand3 > 0.7) { // glow
                  light = min((cellRand3 - 0.7) / (1. - 0.7) * 2., 1.);
                }
            }

            //draw letters    
            float b = letter(uv, 1.0 / (dims));


            if (b > alphaTest) {
                col = vec3(0.1);
                col += b * mix(vec3(0.05), mainColor, light*2.) * offsetColor;
            }

            col *= factor;
        }
        
        col *= 0.5 + mod(uv.y*2., 1.) * .5;
    }

    
    // color each column differently
    col *= 0.5 + hash(floor(mainUv.x*numCols)/numCols);
    
    // float distanceToCenter = length(originalUv - 0.5);
    // col += (0.5-distanceToCenter)*2. * 0.5;
    
    fragColor = vec4(col, 1.0);
}
void main() {
  mainImage(gl_FragColor, tex_coords);
  // gl_FragColor = vec4(1., 0., 0., 1.);
  // gl_FragColor = vec4(tex_coords.x, 0., tex_coords.y, 1.);
}
`;

class RainBgFxMesh extends THREE.Mesh {
  constructor() {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: false,
        },
        aspectRatio: {
          value: 1,
          needsUpdate: true,
        },
        /* iFrame: {
          value: 0,
          needsUpdate: false,
        },
        iChannel0: {
          value: textureLoader.load('/textures/pebbles.png'),
        },
        iChannel1: {
          value: textureLoader.load('/textures/noise.png'),
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
      fragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    super(fullscreenGeometry, material);
  }

  update(timestamp, timeDiff) {
    const timestampS = timestamp / 1000;
    this.material.uniforms.iTime.value = timestampS;
    this.material.uniforms.iTime.needsUpdate = true;
  }
}

export {RainBgFxMesh};
