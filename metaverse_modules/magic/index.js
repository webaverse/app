import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useFrame, useMaterials, useLocalPlayer, useMathUtils} = metaversefile;

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

function createCylindersGeometry() {
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
  for (let i = 0; i < numCylinders; i++) {
    const radius = minRadius + i * radiusStep;
    const g = baseGeometry.clone();
    g.scale(radius, 1, radius);
    const instances = new Float32Array(g.attributes.position.count).fill(i);
    g.setAttribute('instance', new THREE.BufferAttribute(instances, 1));
    geometries.push(g);
  }

  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  return geometry;
};
const _makeCylindersMesh = () => {
  const {WebaverseShaderMaterial} = useMaterials();

  // console.log('make cylinders mesh');

  const geometry = createCylindersGeometry();
  const material = new WebaverseShaderMaterial({
    uniforms: {
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      attribute float instance;
      uniform float uTime;
      // uniform vec4 uBoundingBox;
      varying vec2 vUv;
      varying float vInstance;
      // varying vec3 vNormal;
      // varying float vFactor;

      void main() {
        vec3 p = position;
        float factor = uTime;
        float distance1 = length(vec2(p.xz));
        float distance2 = distance1 + ${minRadius.toFixed(8)};
        float distance = distance1 * (1.0 - factor) + distance2 * factor;
        p.xz *= distance / distance1;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        vUv = uv;
        vInstance = instance;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      // uniform vec4 uBoundingBox;
      uniform float uTime;
      uniform float uTimeCubic;
      varying vec2 vUv;
      // varying float vF;
      varying float vInstance;
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

      void main() {
        vec3 c1 = vec3(1., 1., 0.195);
        vec3 c2 = vec3(53./255., 254./255., 52./255.);

        // float factor = ${minRadius.toFixed(8)} * uTime;
        float lerpInstance = vInstance + uTime;

        float radiusFactor = (lerpInstance + 1.) / ${numCylinders.toFixed(8)};
        vec3 c = mix(c1, c2, radiusFactor);
        float f = (sin(vUv.x * 2. * PI * 200.) + 1.) / 2. * (1. - vUv.y);
        float dfa = (1. - lerpInstance/5.);
        float dfb = (1. - lerpInstance/4.);
        f *= dfa;
        gl_FragColor = vec4(c * dfa, f);
        if (f < 0.1) {
          discard;
        }
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.update = (timestamp, timeDiff) => {
    const maxTime = 500;
    const f = (timestamp % maxTime) / maxTime;

    mesh.visible = false;

    const localPlayer = useLocalPlayer();
    if (localPlayer.avatar) {
      const Root = localPlayer.avatar.modelBones.Root;
      mesh.position.setFromMatrixPosition(Root.matrixWorld);
      // mesh.quaternion.identity();
      mesh.updateMatrixWorld();
      mesh.visible = true;
    }

    material.uniforms.uTime.value = f;
    material.uniforms.uTime.needsUpdate = true;
    // material.uniforms.uTimeCubic.value = cubicBezier(f);
    // material.uniforms.uTimeCubic.needsUpdate = true;
  };
  return mesh;
};
export default () => {
  const mesh = _makeCylindersMesh();

  useFrame(({timestamp, timeDiff}) => {
    mesh.update(timestamp, timeDiff);
  });
  
  return mesh;
};