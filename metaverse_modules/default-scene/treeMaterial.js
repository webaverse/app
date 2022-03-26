import * as THREE from 'three';
const vs = `
// #include <logdepthbuf_pars_vertex>
out vec2 vUv; 
uniform float effectBlend;
vec2 remap(vec2 origin,vec2 oldmin,vec2 oldmax,vec2 min,vec2 max){
    return min + (origin - oldmin) * (max - min) / (oldmax - oldmin) ;
} 
void main() {
    vUv = uv; 

    vec4 finalPos =  projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vec2 vertexOffset = remap(uv,vec2(0.0),vec2(1.0),vec2(-1.0),vec2(1.0)); 
    // vec4 offsetv4 = vec4(vertexOffset,0.0,1.0) * viewMatrix;
    finalPos.xyz += mix(vec3(0.0), vec3(normalize(vertexOffset.xy),0.0),effectBlend);
    
	// #include <logdepthbuf_vertex>
	gl_Position = finalPos;
}
`

const fs = `

uniform sampler2D maskMap;
#include <logdepthbuf_pars_fragment>
in vec2 vUv;
void main() {
	// #include <logdepthbuf_fragment>
    vec4  maskColor = texture2D(maskMap,vUv) ;
    if(maskColor.r<0.5)
        discard;
	gl_FragColor = vec4( maskColor.rgb* vec3(0.1,0.9,0.6), maskColor.a);
     
}
`

const textureLoader = new THREE.TextureLoader();

const maskMap = textureLoader.load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/tree_Opacity-01.png`)
export const treeMaterial = new THREE.ShaderMaterial({
    vertexShader: vs,
    fragmentShader: fs,
    transparent: true, 
    alphaTest:true,

    uniforms: {
        effectBlend: { value: 2.0 },
        maskMap: { value: maskMap }
    }
})

