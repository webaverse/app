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

const numCylinders = 5;
const minRadius = 0.2;
const radiusStep = minRadius;
const maxRadius = minRadius + minRadius * numCylinders;

function createCylindersGeometry(front) {
  const radiusTop = 1;
  const radiusBottom = 1;
  const height = 1.25;
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
  ).translate(0, height/2, 0);

  const geometries = [];
  const _push = i => {
    const radius = minRadius + i * radiusStep;
    const g = baseGeometry.clone();
    g.scale(radius, 1, radius);
    const instances = new Float32Array(g.attributes.position.count).fill(i);
    g.setAttribute('instance', new THREE.BufferAttribute(instances, 1));
    geometries.push(g);
  }
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
};
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
  float distance1 = length(vec2(p.xz));
  float distance2 = distance1 + ${minRadius.toFixed(8)};
  float distance = distance1 * (1.0 - factor) + distance2 * factor;
  p.xz *= distance / distance1;
  
  float distanceFactor = (distance - ${(minRadius).toFixed(8)}) / ${(maxRadius - minRadius).toFixed(8)};
  vDistance = sin(distanceFactor * PI);
  p.y *= vDistance;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  vUv = uv;
  vInstance = instance;
}
`;
const fragmentShader = `\
precision highp float;
precision highp int;

#define PI 3.1415926535897932384626433832795

// uniform vec4 uBoundingBox;
uniform float uTime;
// uniform float uTimeCubic;
varying vec2 vUv;
// varying float vF;
varying float vInstance;
varying float vDistance;
// varying vec3 vNormal;

vec3 hueShift( vec3 color, float hueAdjust ){
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

float rand(float n){return fract(sin(n) * 43758.5453123);}

#define nsin(x) (sin(x) * 0.5 + 0.5)

void draw_auroras(inout vec4 color, vec2 uv) {
    color = vec4(0.0);

    const vec4 aurora_color_a = vec4(0.0, 1.2, 0.5, 1.0);
    const vec4 aurora_color_b = vec4(0.0, 0.4, 0.6, 1.0);
    
    float f = 200.0;
    
    float factor = uTime; // mod(uTime, 1.);
    float t = -1.5 +
      nsin(-factor + uv.x * f) * 0.075 +
      nsin(factor + uv.x * distance(uv.x, 0.5) * f) * 0.3 +
      nsin(factor + uv.x * distance(uv.x, 0.) * f * 0.25 + 100.) * 0.3 +
      nsin(factor + uv.x * distance(uv.x, 1.) * f * 0.25 + 200.) * 0.3 +
      nsin(factor + uv.x * distance(uv.x, 0.5) * f * 2. + 300.) * -0.2;
    // t += uv.y;
    // t = pow(t, 0.5);
    t = 1.0 - smoothstep(1.0 - uv.y - 4.0, 1.0 - uv.y * 2.0, t);
    // t = pow(t, 2.);
    
    vec4 final_color = mix(aurora_color_a, aurora_color_b, clamp(uv.y * t, 0.0, 1.0));
    final_color += final_color * final_color;
    color += final_color * t * (t + 0.5) * 0.75;
}

void main() {
  vec3 c1 = vec3(1., 1., 0.195);
  vec3 c2 = vec3(53./255., 254./255., 52./255.);

  float factor = mod(uTime, 1.);
  float lerpInstance = vInstance + factor;
  float dfa = (1. - lerpInstance/${numCylinders.toFixed(8)});
  float dfb = (1. - lerpInstance/${(numCylinders - 1).toFixed(8)});

  float radiusFactor2 = vInstance - floor(uTime);
  // float radiusFactor = (lerpInstance + 1.) / ${numCylinders.toFixed(8)};
  // vec3 c = mix(c1, c2, radiusFactor);
  
  vec2 uv = vUv;
  // uv.y /= vDistance;
  // uv.y = min(max(uv.y, 0.), 1.);
  uv.x = mod(uv.x + rand(radiusFactor2), 1.);
  draw_auroras(gl_FragColor, uv);
  gl_FragColor.a *= dfa;
  
  /* float c = vUv.y > 0.9 ? 1. : 0.;
  gl_FragColor.r = c;
  gl_FragColor.a = c;
  if (gl_FragColor.a <= 0.05) {
    discard;
  } */

  #include <tonemapping_fragment>
  #include <encodings_fragment>
}
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
      const maxTime = 150;
      const f = (timestamp / maxTime) % 1000;

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
  app.setComponent('renderPriority', 'lowest');

  const mesh = _makeCylindersMesh();
  app.add(mesh);
  mesh.updateMatrixWorld();

  useFrame(({timestamp, timeDiff}) => {
    mesh.update(timestamp, timeDiff);
  });
  
  return app;
};