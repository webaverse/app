import * as THREE from 'three';
import { IDTech } from './idTech.js';


const textureLoader = new THREE.TextureLoader();


const IdtechBasic = new IDTech(512, 64);
IdtechBasic.loadAll('textures/terrain/terrain ');
const IdtechNormal = new IDTech(512, 64);
IdtechNormal.loadAll('textures/terrainnormal/terrain normal ');

const gradientMaps = (function () { 
    const threeTone = textureLoader.load('./textures/threeTone.jpg');
    threeTone.minFilter = THREE.NearestFilter;
    threeTone.magFilter = THREE.NearestFilter;

    const fiveTone = textureLoader.load('./textures/fiveTone.jpg');
    fiveTone.minFilter = THREE.NearestFilter;
    fiveTone.magFilter = THREE.NearestFilter;

    return {
        none: null,
        threeTone: threeTone,
        fiveTone: fiveTone
    };

})();

const noiseTexture = textureLoader.load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/noise.png`)
noiseTexture.wrapS = THREE.RepeatWrapping;
noiseTexture.wrapT = THREE.RepeatWrapping;

export const terrainMaterial = new THREE.MeshToonMaterial({ color: 0xaaccff, gradientMap: gradientMaps.threeTone });;

terrainMaterial.onBeforeCompile = (shader, renderer) => {
    shader.uniforms = shader.uniforms || {};
    terrainMaterial.uniforms = shader.uniforms;
    console.log('onBeforeCompile');
    shader.vertexShader = vertex;
    shader.fragmentShader = fragment;


    shader.defines = shader.defines || {};
    shader.defines['USE_TERRAIN'] = '';

    shader.uniforms.terrainArrayTexture = { value: IdtechBasic.texture };
    shader.uniforms.terrainNormalArrayTexture = { value: IdtechNormal.texture };
    shader.uniforms.noiseTexture = { value: noiseTexture };
}

export const vertex = /* glsl */`
#define TOON

varying vec3 vViewPosition;

#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

#ifdef USE_TERRAIN
    attribute vec3 biome;

    out vec3  vtriCoord;
    out vec3  vtriNormal;
    flat out float vbiome0;
    flat out float vbiome1;
    out float biomeAmount;
    out float fbiome0;
#endif

void main() {

	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>

	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>

	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>

	vViewPosition = - mvPosition.xyz;

	#include <worldpos_vertex>

    #if defined(USE_TERRAIN) 
        vbiome0 = biome.x;
        vbiome1 = biome.y;
        biomeAmount = biome.z;
        fbiome0 = biome.x;
        vec4 triWorldPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
            triWorldPosition = instanceMatrix * triWorldPosition;
        #endif
        triWorldPosition = modelMatrix * triWorldPosition;
        vtriCoord = triWorldPosition.xyz;
        vtriNormal = vec3(normal); 
    #endif

	#include <shadowmap_vertex>
	#include <fog_vertex>

}
`;

export const fragment = /* glsl */`
#define TOON

uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;

#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment> 
#ifdef USE_GRADIENTMAP 
	uniform sampler2D gradientMap; 
#endif

vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) { 
	// dotNL will be from -1.0 to 1.0
	float dotNL = dot( normal, lightDirection ); 
	vec2 coord = vec2( dotNL * 0.57 + 0.43, 0.0 ); 
	#ifdef USE_GRADIENTMAP 
		return texture2D( gradientMap, coord ).rgb; 
	#else 
		return (  .x < 0.7 ) ? vec3( 0.7 ) : vec3( 1.0 ); 
	#endif 
}
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

#ifdef USE_TERRAIN
    precision highp sampler2DArray;
    uniform sampler2DArray terrainArrayTexture;
    uniform sampler2DArray terrainNormalArrayTexture ;
    uniform sampler2D  noiseTexture ;

    flat in float vbiome0;
    flat in float vbiome1;
    in float biomeAmount;
    in float fbiome0;
    in vec3 vtriCoord;
    in vec3 vtriNormal;
 
    float sum( vec4 v ) { return v.x+v.y+v.z; } 
    /**
     * texture random sampler
     */
    vec4 randomTexture(sampler2DArray samp, vec3 uvi)
    {
        vec2 uv = uvi.xy;
        float k = texture( noiseTexture, 0.01 * uv).x; // cheap (cache friendly) lookup

        vec2 duvdx = dFdx( uv );
        vec2 duvdy = dFdx( uv );

        float l = k*8.0;
        float f = fract(l);

        float ia = floor(l+0.5); // suslik's method (see comments)
        float ib = floor(l);
        f = min(f, 1.0-f)*2.0; 

        vec2 offa = sin(vec2(3.0,7.0)*ia); // can replace with any other hash
        vec2 offb = sin(vec2(3.0,7.0)*ib); // can replace with any other hash
    
        vec4 cola = textureGrad( samp, vec3(uv + offa,uvi.z), duvdx, duvdy );
        vec4 colb = textureGrad( samp, vec3(uv + offb,uvi.z), duvdx, duvdy );

        return mix( cola, colb, smoothstep(0.2,0.8,f-0.1*sum(cola-colb)));
    }
    
    vec4 triplanarTexture(vec3 pos, vec3 normal,vec3 blending, float texId, sampler2DArray tex,float scale) {
      vec4 tx = randomTexture(tex, vec3(pos.zy / scale, texId));
      vec4 ty = randomTexture(tex, vec3(pos.xz / scale, texId));
      vec4 tz = randomTexture(tex, vec3(pos.xy / scale, texId)); 
      return tx * blending.x + ty * blending.y + tz * blending.z;
    }
  
    vec3 triplanarNormal(vec3 pos, vec3 normal,vec3 blending, float texId, sampler2DArray tex,float scale) {   
      // Tangent space normal maps
      vec3 tnormalX = randomTexture(tex, vec3(pos.zy/scale, vbiome0)).xyz*2.0-1.0;
      vec3 tnormalY = randomTexture(tex, vec3(pos.xz/scale, vbiome0)).xyz*2.0-1.0;
      vec3 tnormalZ = randomTexture(tex, vec3(pos.xy/scale, vbiome0)).xyz*2.0-1.0;
      vec3 normalX = vec3(0.0, tnormalX.yx);
      vec3 normalY = vec3(tnormalY.x, 0.0, tnormalY.y);
      vec3 normalZ = vec3(tnormalZ.xy, 0.0);  
      vec3 worldNormal =  normalize(normalX * blending.x +normalY * blending.y +normalZ * blending.z+normal);
      return worldNormal;
    } 

    float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
    vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
    vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
    
    float noise(vec3 p){
        vec3 a = floor(p);
        vec3 d = p - a;
        d = d * d * (3.0 - 2.0 * d);
    
        vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
        vec4 k1 = perm(b.xyxy);
        vec4 k2 = perm(k1.xyxy + b.zzww);
    
        vec4 c = k2 + a.zzzz;
        vec4 k3 = perm(c);
        vec4 k4 = perm(c + 1.0);
    
        vec4 o1 = fract(k3 * (1.0 / 41.0));
        vec4 o2 = fract(k4 * (1.0 / 41.0));
    
        vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
        vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
    
        return o4.y * d.y + o4.x * (1.0 - d.y);
    }
    
    #define NUM_OCTAVES 5
    float fbm(vec3 x) { 
        x = x/50.0;
        float v = 0.0;
        float a = 0.5;
        vec3 shift = vec3(1000.0);
        for (int i = 0; i < NUM_OCTAVES; ++i) {
            v += a * noise(x);
            x = x * 2.0 + shift;
            a *= 0.5;
        }
        return  v ;
    }
#endif

void main() {

	#include <clipping_planes_fragment>

	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <logdepthbuf_fragment>
	#include <map_fragment>

    #ifdef USE_TERRAIN 
        vec3 blending = normalize(max(abs(vtriNormal), 0.001)); // Force weights to sum to 1.0
        blending = blending / (blending.x + blending.y + blending.z);  

        vec4 biome0Color= triplanarTexture(vtriCoord, vtriNormal.xyz,blending, vbiome0, terrainArrayTexture,10.0) ; 
        vec4 biome1Color= triplanarTexture(vtriCoord, vtriNormal.xyz,blending, vbiome1, terrainArrayTexture,10.0) ;  

        float ba = fbm(vtriCoord) ;
        vec4 terrainColor = biomeAmount * biome0Color + (1.0 - biomeAmount) * biome1Color;
        if (abs(fbiome0 - vbiome0) > 0.01) {
            terrainColor = 0.5 * biome0Color+0.5* biome1Color;
        }   
        terrainColor *= max(ba*1.75,0.8) ;  
        diffuseColor *= terrainColor; 
    #endif

	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

    #ifdef USE_TERRAIN
        vec3 normal0 = triplanarNormal(vtriCoord,normal,blending, vbiome0, terrainNormalArrayTexture,10.0);
        vec3 normal1 = triplanarNormal(vtriCoord,normal,blending, vbiome1, terrainNormalArrayTexture,10.0);
        
        vec3 normalmix = normalize(biomeAmount * normal0 + (1.0 - biomeAmount) * normal1);
        if (abs(fbiome0 - vbiome0) > 0.01) {
            normalmix =normalize(0.5 * normal0+ 0.5 * normal1) ;
        }   
        normal = normalize(normal + normalmix *0.5);//normalmix;//
    #endif

	#include <emissivemap_fragment>

	// accumulation
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	// modulation
	#include <aomap_fragment>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

}
`;

