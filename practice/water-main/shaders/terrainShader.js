import * as THREE from 'three'

const terrainVertex = `
      ${THREE.ShaderChunk.common}
      attribute ivec4 biomes;
      attribute vec4 biomesWeights;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      flat varying ivec4 vBiomes;
      varying vec4 vBiomesWeights;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform sampler2D uTexture;
     
${THREE.ShaderChunk.logdepthbuf_pars_vertex}
void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;
  vBiomes = biomes;
  vBiomesWeights = biomesWeights;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  // gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.);
  gl_Position = projectedPosition;
  ${THREE.ShaderChunk.logdepthbuf_vertex}
}
    `

const terrainFragment = `
  precision highp float;
  precision highp int;
  precision lowp sampler2DArray;
  #define PI 3.1415926535897932384626433832795
  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  uniform mat4 modelMatrix;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  flat varying ivec4 vBiomes;
  varying vec4 vBiomesWeights;
  uniform vec2 uResolution;
  uniform sampler2DArray diffuseMap;
  uniform sampler2DArray normalMap;
  uniform sampler2D uEarthBaseColor;
  uniform sampler2D uGrassBaseColor;
  uniform sampler2D uEarthNormal;
  uniform sampler2D uGrassNormal;
  uniform sampler2D noiseMap;
  uniform float uTime;
  
vec2 hash( vec2 p ) // replace this by something better
{
	p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec2 p )
{
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2  i = floor( p + (p.x+p.y)*K1 );
    vec2  a = p - i + (i.x+i.y)*K2;
    float m = step(a.y,a.x); 
    vec2  o = vec2(m,1.0-m);
    vec2  b = a - o + K2;
	vec2  c = a - 1.0 + 2.0*K2;
    vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return dot( n, vec3(70.0) );
}

float fbm( vec2 p )
{
    float f = 0.0;
    float gat = 0.0;
    
    for (float octave = 0.; octave < 8.; ++octave)
    {
        float la = pow(2.0, octave);
        float ga = pow(0.5, octave + 1.);
        f += ga*noise( la * p ); 
        gat += ga;
    }
    
    f = f/gat;
    
    return f;
}

float warpNoise(vec3 pos)
{
    vec2 p = pos.xz;
    vec2 q = vec2(fbm(p),fbm(p + vec2(5.2, 1.3)));
    // vec2 r = vec2(fbm(p + q * 2.0 + vec2(10.7, 9.2)) , (fbm(p + q*2.0) + vec2(8.3, 2.8)));
    return fbm(p + q); 
}

vec3 getNormalFromHeight(vec3 h){

  return normalize(-vec3(dFdx(h.x), dFdy(h.y),dFdx(h.z)));
} 
  
#define saturate(a) clamp( a, 0.0, 1.0 )
float sum( vec3 v ) { return v.x+v.y+v.z; }
vec3 ACESFilmicToneMapping(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return saturate((x*(a*x+b))/(x*(c*x+d)+e));
}
vec4 calculateLighting(
    vec3 lightDirection, vec3 lightColour, vec3 worldSpaceNormal, vec3 viewDirection) {
  float diffuse = saturate(dot(worldSpaceNormal, lightDirection));
  vec3 H = normalize(lightDirection + viewDirection);
  float NdotH = dot(worldSpaceNormal, H);
  float specular = saturate(pow(NdotH, 8.0));
  return vec4(lightColour * (diffuse + diffuse * specular), 0);
}
vec4 computeLighting(vec3 worldSpaceNormal, vec3 sunDir, vec3 viewDirection) {
  // Hardcoded, whee!
  vec4 lighting;
  
  lighting += calculateLighting(
      sunDir, vec3(1.25, 1.25, 1.25), worldSpaceNormal, viewDirection);
  lighting += calculateLighting(
      -sunDir, vec3(0.75, 0.75, 1.0), worldSpaceNormal, viewDirection);
  lighting += calculateLighting(
      vec3(0, 1, 0), vec3(0.25, 0.25, 0.25), worldSpaceNormal, viewDirection);
  
  return lighting;
}

  vec4 texture_UV(in sampler2DArray srcTexture, in vec3 x) {
    float k = texture(noiseMap, 0.0025*x.xy).x; // cheap (cache friendly) lookup
    float l = k*8.0;
    float f = fract(l);
    
    float ia = floor(l+0.5);
    float ib = floor(l);
    f = min(f, 1.0-f)*2.0;
    vec2 offa = sin(vec2(3.0,7.0)*ia); // can replace with any other hash
    vec2 offb = sin(vec2(3.0,7.0)*ib); // can replace with any other hash
    vec4 cola = texture(srcTexture, vec3(x.xy + offa, x.z));
    vec4 colb = texture(srcTexture, vec3(x.xy + offb, x.z));
    return mix(cola, colb, smoothstep(0.2,0.8,f-0.1*sum(cola.xyz-colb.xyz)));
  }


  vec4 triplanarTexture(sampler2D inputTexture , float scale , float blendSharpness){
    vec2 uvX = vPosition.zy * scale;
    vec2 uvY = vPosition.xz * scale;
    vec2 uvZ = vPosition.xy * scale;
    
    vec4 colX = texture2D(inputTexture , uvX);
    vec4 colY = texture2D(inputTexture , uvY);
    vec4 colZ = texture2D(inputTexture , uvZ);

    vec3 blendWeight = pow(abs(vNormal), vec3(blendSharpness));
    blendWeight /= dot(blendWeight,vec3(1));

    return colX * blendWeight.x + colY * blendWeight.y + colZ * blendWeight.z;
  }

  vec4 triplanarNormal(sampler2D inputTexture , float scale , float blendSharpness) {
    // Tangent Reconstruction
    // Triplanar uvs
    vec2 uvX = vPosition.zy * scale;
    vec2 uvY = vPosition.xz * scale;
    vec2 uvZ = vPosition.xy * scale;
    
    vec4 colX = texture2D(inputTexture , uvX);
    vec4 colY = texture2D(inputTexture , uvY);
    vec4 colZ = texture2D(inputTexture , uvZ);
    // Tangent space normal maps
    vec3 tx = colX.xyz * vec3(2,2,2) - vec3(1,1,1);
    vec3 ty = colY.xyz * vec3(2,2,2) - vec3(1,1,1);
    vec3 tz = colZ.xyz * vec3(2,2,2) - vec3(1,1,1);
    vec3 weights = abs(vNormal.xyz);
    weights = weights / (weights.x + weights.y + weights.z);
    // Get the sign (-1 or 1) of the surface normal
    vec3 axis = sign(vNormal);
    // Construct tangent to world matrices for each axis
    vec3 tangentX = normalize(cross(vNormal, vec3(0.0, axis.x, 0.0)));
    vec3 bitangentX = normalize(cross(tangentX, vNormal)) * axis.x;
    mat3 tbnX = mat3(tangentX, bitangentX, vNormal);
    vec3 tangentY = normalize(cross(vNormal, vec3(0.0, 0.0, axis.y)));
    vec3 bitangentY = normalize(cross(tangentY, vNormal)) * axis.y;
    mat3 tbnY = mat3(tangentY, bitangentY, vNormal);
    vec3 tangentZ = normalize(cross(vNormal, vec3(0.0, -axis.z, 0.0)));
    vec3 bitangentZ = normalize(-cross(tangentZ, vNormal)) * axis.z;
    mat3 tbnZ = mat3(tangentZ, bitangentZ, vNormal);
    // Apply tangent to world matrix and triblend
    // Using clamp() because the cross products may be NANs
    vec3 worldNormal = normalize(
        clamp(tbnX * tx, -1.0, 1.0) * weights.x +
        clamp(tbnY * ty, -1.0, 1.0) * weights.y +
        clamp(tbnZ * tz, -1.0, 1.0) * weights.z
        );
    return vec4(worldNormal, 0.0);
  }

  vec4 terrainBlend(vec4 samples[4], vec4 weights) {
    vec4 a = samples[0];
    vec4 b = samples[1];
    vec4 c = samples[2];
    vec4 d = samples[3];

    float weightSum = weights.x + weights.y + weights.z + weights.w;
    return (a*weights.x + b*weights.y + c*weights.z + d*weights.w) / weightSum;
}

  void setBiome(int biome, out vec4 diffuseSample,out vec4 normalSample){
    if(biome == 4){
      float rockNoise = warpNoise(vPosition/10.0);
      vec4 rockColor = vec4(vec3(0.36 , 0.2 , 0.06)*(.5 + rockNoise) , 1.);
      vec3 rockNormal = getNormalFromHeight(vPosition + vNormal * rockNoise);

      diffuseSample = rockColor;
      normalSample = vec4(rockNormal,1.);
    }else{
      // default color is red
      diffuseSample = vec4(1, 0 , 0, 1.);
      normalSample = vec4(1,1,1,1.);
    }
  
  }

  void main() {
    float time = uTime;
    vec4 diffuseSamples[4];
    vec4 normalSamples[4];

    vec3 worldPosition = (modelMatrix * vec4(vPosition, 1)).xyz;
    vec3 eyeDirection = normalize(worldPosition - cameraPosition);
    vec3 sunDir = normalize(vec3(1, 0, 0));

    setBiome(vBiomes.x, diffuseSamples[0], normalSamples[0]);
    setBiome(vBiomes.y, diffuseSamples[1], normalSamples[1]);
    setBiome(vBiomes.z, diffuseSamples[2], normalSamples[2]);
    setBiome(vBiomes.w, diffuseSamples[3], normalSamples[3]);
 
    vec4 diffuseBlended = terrainBlend(diffuseSamples,vBiomesWeights);
    vec4 normalBlended = terrainBlend(normalSamples,vec4(1));

    vec3 worldSpaceNormal = normalize(normalBlended.xyz);
    vec4 lighting = computeLighting(worldSpaceNormal, sunDir, -eyeDirection);
    vec4 finalColor = diffuseBlended;
    finalColor.rgb *= lighting.xyz;
    gl_FragColor = finalColor;
  ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`

export { terrainVertex, terrainFragment }
