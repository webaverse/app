import * as THREE from 'three';
import {
  fullscreenGeometry,
  gradients,
  fullscreenVertexShader,
} from './common.js';
// import {getRenderer} from '../renderer.js';

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

let iChannel0 = null;
class GlyphBgFxMesh extends THREE.Mesh {
  constructor() {
    if (!iChannel0) {
      const textureLoader = new THREE.TextureLoader();
      iChannel0 = textureLoader.load('/textures/lichen.jpg');
    }
    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          // needsUpdate: true,
        },
        iChannel0: {
          value: iChannel0,
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
      vertexShader: fullscreenVertexShader,
      fragmentShader: glyphFragmentShader,
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

export {
  GlyphBgFxMesh,
};
