import * as THREE from 'three';
import {alea} from './procgen/procgen.js';
import {getRenderer} from './renderer.js';
import {fullscreenGeometry, fullscreenVertexShader} from './background-fx/common.js';

const localVector2D = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localColor = new THREE.Color();

const glyphFragmentShader = `\
uniform float iTime;
varying vec2 tex_coords;

/*

	draw letter shapes after subdividing uv space randomly

*/

#define PI 3.1415926535

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

vec3 hueRotate( vec3 color, float hueAdjust ){
  const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
  const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
  const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

  const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);
  const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);
  const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);

  float   YPrime  = dot (color, kRGBToYPrime);
  float   I       = dot (color, kRGBToI);
  float   Q       = dot (color, kRGBToQ);
  float   hue     = atan (Q, I);
  float   chroma  = sqrt (I * I + Q * Q);

  hue += hueAdjust;

  Q = chroma * sin (hue);
  I = chroma * cos (hue);

  vec3    yIQ   = vec3 (YPrime, I, Q);

  return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord; // .xy / iResolution.xy;    
    //correct aspect ratio
    // uv.x *= iResolution.x/iResolution.y;

    float t = iTime;
    float scrollSpeed = 0.3;
    float dims = 0.5;
    int maxSubdivisions = 0;
    
    // uv = rotate2D(uv,PI/12.0);
    uv.y -= floor(iTime * scrollSpeed * 4.);
    
    float cellRand;
    vec2 ij;
    
   	for(int i = 0; i <= maxSubdivisions; i++) { 
        ij = getCellIJ(uv, dims);
        cellRand = random2d(ij);
        dims *= 2.0;
        //decide whether to subdivide cells again
        float cellRand2 = random2d(ij + 454.4543);
        if (cellRand2 > 0.3){
        	break; 
        }
    }
   
    //draw letters
    float b = letter(uv, 1.0 / (dims));
    
    fragColor = vec4(vec3(1.-b), b);
    if (b < 0.5) {
      discard;
    }
}

void main() {
  mainImage(gl_FragColor, tex_coords);
}
`;

const glyphSize = 7;

const glyphMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: {
      value: 0,
      needsUpdate: true,
    },
  },
  vertexShader: fullscreenVertexShader,
  fragmentShader: glyphFragmentShader,
});
const glyphMesh = new THREE.Mesh(fullscreenGeometry, glyphMaterial);
glyphMesh.frustumCulled = false;

const glyphScene = new THREE.Scene();
glyphScene.name = 'glyphScene';
glyphScene.autoUpdate = false;

glyphScene.add(glyphMesh);

const glyphCamera = new THREE.OrthographicCamera();

export const generateGlyph = seed => {
  const canvas = document.createElement('canvas');
  canvas.width = glyphSize;
  canvas.height = glyphSize;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const renderer = getRenderer();
  const size = renderer.getSize(localVector2D);
  const pixelRatio = renderer.getPixelRatio();
  const rng = alea(seed);
  glyphMaterial.uniforms.iTime.value = rng();
  glyphMaterial.uniforms.iTime.needsUpdate = true;

  {
    // push old state
    // const oldRenderTarget = renderer.getRenderTarget();
    const oldViewport = renderer.getViewport(localVector4D);
    const oldClearColor = renderer.getClearColor(localColor);
    const oldClearAlpha = renderer.getClearAlpha();

    // render
    renderer.setViewport(0, 0, glyphSize, glyphSize);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(glyphScene, glyphCamera);

    // copy to canvas
    ctx.drawImage(
      renderer.domElement,
      0,
      size.y * pixelRatio - glyphSize * pixelRatio,
      glyphSize * pixelRatio,
      glyphSize * pixelRatio,
      0,
      0,
      glyphSize,
      glyphSize
    );

    // pop old state
    // renderer.setRenderTarget(oldRenderTarget);
    renderer.setViewport(oldViewport);
    renderer.setClearColor(oldClearColor, oldClearAlpha);
  }

  return canvas;
};