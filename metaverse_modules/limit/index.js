import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useMaterials, useLocalPlayer} = metaversefile;

// const cardWidth = 0.063;
// const cardHeight = cardWidth / 2.5 * 3.5;
// const cardHeight = cardWidth;
// const cardsBufferFactor = 1.1;
// const menuWidth = cardWidth * cardsBufferFactor * 4;
// const menuHeight = cardHeight * cardsBufferFactor * 4;
// const menuRadius = 0.025;

/* function mod(a, n) {
  return (a % n + n) % n;
} */

const numCylinders = 3;
const minRadius = 0.4;
const radiusStep = minRadius;
const maxRadius = minRadius + minRadius * numCylinders;

function createCylindersGeometry(front) {
  const radiusTop = 1.5;
  const radiusBottom = 1;
  const height = 2;
  const radialSegments = 8;
  const heightSegments = 1;
  const openEnded = true;
  const baseGeometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    heightSegments,
    openEnded,
  ).translate(0, height / 2, 0);

  const geometries = [];
  const _push = i => {
    const radius = minRadius + i * radiusStep;
    const g = baseGeometry.clone();
    g.scale(radius, 1, radius);
    const instances = new Float32Array(g.attributes.position.count).fill(i);
    g.setAttribute('instance', new THREE.BufferAttribute(instances, 1));
    geometries.push(g);
  };
  if (!front) {
    for (let i = 0; i < numCylinders; i++) {
      _push(i);
    }
  } else {
    for (let i = numCylinders - 1; i >= 0; i--) {
      _push(i);
    }
  }

  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  return geometry;
}
const vertexShader = `\
precision highp float;
precision highp int;

attribute float instance;
uniform float uTime;
// uniform vec4 uBoundingBox;
varying vec2 vUv;
varying float vInstance;
varying float vDistance;
// varying vec3 vNormal;
// varying float vFactor;

// #define PI 3.1415926535897932384626433832795

void main() {
  vec3 p = position;
  float factor = mod(uTime, 1.);
  // float distance1 = length(p.xz);
  float distance1 = ${minRadius.toFixed(8)} + instance * ${minRadius.toFixed(
  8,
)};;
  float distance2 = distance1 + ${minRadius.toFixed(8)};
  float distance = distance1 * (1.0 - factor) + distance2 * factor - ${minRadius.toFixed(
    8,
  )};
  p.xz *= distance / distance1;
  
  float distanceFactor = (distance) / ${(maxRadius - minRadius).toFixed(8)};
  distanceFactor = mod(distanceFactor, 1.);
  vDistance = distanceFactor; // sin(distanceFactor * PI);
  float vDistance2 = sin(distanceFactor * PI * 0.8);
  p.y *= vDistance2;

  /* if (position.y > 1.) {
    p.xz *= 1.5;
  } */

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  vUv = uv;
  vInstance = instance;
}
`;
const fragmentShader = `\
uniform float uTime;
varying vec2 vUv;
varying float vDistance;
varying float vInstance;

#define nsin(x) (sin(x) * 0.5 + 0.5)
#define PI 3.1415926535897932384626433832795

float cnoise(vec2 uv) {
    const vec4 noise = vec4(0.0, 1.2, 0.5, 1.0);
    const vec4 aurora_color_b = vec4(0.0, 0.4, 0.6, 1.0);
    
    float f = 200.0;
    
    float t =
      nsin(-uTime + uv.x * f + vInstance * PI * .2) * 0.075 +
      nsin(uTime + uv.x * distance(uv.x, 0.5) * f + vInstance * PI * .2) * 0.3 +
      nsin(uTime + uv.x * distance(uv.x, 0.) * f * 0.25 + 100. + vInstance * PI * .2) * 0.3 +
      nsin(uTime + uv.x * distance(uv.x, 1.) * f * 0.25 + 200. + vInstance * PI * .2) * 0.3 +
      nsin(uTime + uv.x * distance(uv.x, 0.5) * f * 2. + 300. + vInstance * PI * .2) * -0.2;
    return t;
}


float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float hermite(float t)
{
  return t * t * (3.0 - 2.0 * t);
}

float noise(vec2 co, float frequency)
{
  vec2 v = vec2(co.x * frequency, co.y * frequency);

  float ix1 = floor(v.x);
  float iy1 = floor(v.y);
  float ix2 = floor(v.x + 1.0);
  float iy2 = floor(v.y + 1.0);

  float fx = hermite(fract(v.x));
  float fy = hermite(fract(v.y));

  float fade1 = mix(rand(vec2(ix1, iy1)), rand(vec2(ix2, iy1)), fx);
  float fade2 = mix(rand(vec2(ix1, iy2)), rand(vec2(ix2, iy2)), fx);

  return mix(fade1, fade2, fy);
}

float pnoise(vec2 co, float freq, int steps, float persistence)
{
  float value = 0.0;
  float ampl = 1.0;
  float sum = 0.0;
  for(int i=0 ; i<steps ; i++)
  {
    sum += ampl;
    value += noise(co, freq) * ampl;
    freq *= 2.0;
    ampl *= persistence;
  }
  return value / sum;
}

void mainImage( out vec4 fragColor, in vec2 uv ) {
  // vec2 uv = fragCoord.xy / iResolution.xy;
  float gradient = 1.0 - uv.y;
  float gradientStep = 0.2;
  
  vec2 pos = uv;
  pos.y -= uTime * 0.1;
  
  vec4 brighterColor = vec4(1.0, 0.65, 0.1, 0.25);
  vec4 darkerColor = vec4(1.0, 0.0, 0.15, 0.0625);
  vec4 middleColor = mix(brighterColor, darkerColor, 0.5);

  float noiseTexel = pnoise(pos, 10.0, 5, 0.5);
  
  float firstStep = smoothstep(0.0, noiseTexel, gradient);
  float darkerColorStep = smoothstep(0.0, noiseTexel, gradient - gradientStep);
  float darkerColorPath = firstStep - darkerColorStep;
  vec4 color = mix(brighterColor, darkerColor, darkerColorPath);

  float middleColorStep = smoothstep(0.0, noiseTexel, gradient - 0.2 * 2.0);
  
  color = mix(color, middleColor, darkerColorStep - middleColorStep);
  color = mix(vec4(0.0), color, firstStep);
  // color *= cnoise(uv);
  color *= 1.5;
	fragColor = color;

  fragColor.a *= (1. - vDistance) * 2.;

  #include <tonemapping_fragment>
  #include <encodings_fragment>
}

void main() {
  mainImage(gl_FragColor, vUv);
}

/** SHADERDATA
{
	"title": "Fire shader",
	"description": "Fire shader after @febucci",
	"model": "nothing"
}
*/
`;
const _makeCylindersMesh = () => {
  const {WebaverseShaderMaterial} = useMaterials();
  const localPlayer = useLocalPlayer();

  // console.log('make cylinders mesh');

  const object = new THREE.Object3D();

  const frontGeometry = createCylindersGeometry(true);
  const backGeometry = createCylindersGeometry(false);
  const frontMaterial = new WebaverseShaderMaterial({
    uniforms: {
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    transparent: true,
  });
  const backMaterial = new WebaverseShaderMaterial({
    uniforms: {
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader,
    fragmentShader,
    side: THREE.FrontSide,
    transparent: true,
  });
  const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
  object.add(frontMesh);

  const backMesh = new THREE.Mesh(backGeometry, backMaterial);
  object.add(backMesh);

  object.update = (timestamp, timeDiff) => {
    frontMesh.visible = false;
    backMesh.visible = false;

    if (localPlayer.avatar) {
      const maxTime = 400;
      const f = (timestamp / maxTime) % maxTime;

      const Root = localPlayer.avatar.modelBones.Root;
      object.position.setFromMatrixPosition(Root.matrixWorld);
      object.updateMatrixWorld();

      frontMesh.visible = true;
      backMesh.visible = true;

      frontMaterial.uniforms.uTime.value = f;
      frontMaterial.uniforms.uTime.needsUpdate = true;
      backMaterial.uniforms.uTime.value = f;
      backMaterial.uniforms.uTime.needsUpdate = true;
    }
  };
  return object;
};
export default () => {
  const app = useApp();
  app.setComponent('renderPriority', 'lower');

  const mesh = _makeCylindersMesh();
  app.add(mesh);
  mesh.updateMatrixWorld();

  useFrame(({timestamp, timeDiff}) => {
    mesh.update(timestamp, timeDiff);
  });

  return app;
};
