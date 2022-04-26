import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useFrame, useMaterials, useLocalPlayer} = metaversefile;

// const cardWidth = 0.063;
// const cardHeight = cardWidth / 2.5 * 3.5;
// const cardHeight = cardWidth;
// const cardsBufferFactor = 1.1;
/* const menuWidth = cardWidth * cardsBufferFactor * 4;
const menuHeight = cardHeight * cardsBufferFactor * 4;
const menuRadius = 0.025; */

const localVector = new THREE.Vector3();
const localVector2D = new THREE.Vector2();

const targetTypes = [
  'object',
  'enemy',
  'friend',
];
const targetTypeColors = {
  object: [
    new THREE.Color(0xffa726),
    new THREE.Color(0xf57c00),
  ],
  enemy: [
    new THREE.Color(0xef5350),
    new THREE.Color(0xd32f2f),
  ],
  friend: [
    new THREE.Color(0x66bb6a),
    new THREE.Color(0x388e3c),
  ],
};
const triangleHalfSize = 0.08;
const triangleSize = triangleHalfSize * 2;
const innerRadius = 0.3;

function createTargetReticleGeometry() {
  const a = new THREE.Vector2(-triangleHalfSize, triangleHalfSize);
  const b = new THREE.Vector2(0, 0);
  const c = new THREE.Vector2(triangleHalfSize, triangleHalfSize);

  const shape = new THREE.Shape();
  shape.moveTo(a.x, a.y);
  shape.lineTo(b.x, b.y);
  shape.lineTo(c.x, c.y);
  shape.lineTo(a.x, a.y);

  const baseGeometry = new THREE.ShapeGeometry(shape);
  
  const _setUvs = g => {
    const positions = g.attributes.position.array;
    const uvs = g.attributes.uv.array;
    for (let i = 0; i < g.attributes.position.count; i++) {
      localVector.fromArray(positions, i * 3);
      localVector2D.set(
        (localVector.x + triangleHalfSize) / triangleSize,
        localVector.y / triangleHalfSize
      ).toArray(uvs, i * 2);
    }
    return g;
  };
  _setUvs(baseGeometry);

  const _setNormal2s = (g, normal2D) => {
    const normal2s = new Float32Array(g.attributes.position.count * 2);
    g.setAttribute('normal2', new THREE.BufferAttribute(normal2s, 2));
    for (let i = 0; i < g.attributes.normal2.count; i++) {
      normal2D.toArray(normal2s, i * 2);
    }
    // console.log('got normnal 2s', normal2s);
    g.attributes.normal2.needsUpdate = true;
    return g;
  };

  const geometries = [
    _setNormal2s(
      baseGeometry.clone()
        .rotateZ(0)
        .translate(0, innerRadius, 0),
      new THREE.Vector2(0, 1)
    ),
    _setNormal2s(
      baseGeometry.clone()
        .rotateZ(Math.PI / 2)
        .translate(-innerRadius, 0, 0),
      new THREE.Vector2(-1, 0)
    ),
    _setNormal2s(
      baseGeometry.clone()
        .rotateZ(Math.PI)
        .translate(0, -innerRadius, 0),
      new THREE.Vector2(0, -1)
    ),
    _setNormal2s(
      baseGeometry.clone()
        .rotateZ(Math.PI * 3 / 2)
        .translate(innerRadius, 0, 0),
      new THREE.Vector2(1, 0)
    ),
  ];
  return BufferGeometryUtils.mergeBufferGeometries(geometries);
};
const _makeTargetReticleMesh = () => {
  const {WebaverseShaderMaterial} = useMaterials();

  const geometry = createTargetReticleGeometry();
  const material = new WebaverseShaderMaterial({
    uniforms: {
      /* uBoundingBox: {
        type: 'vec4',
        value: new THREE.Vector4(
          boundingBox.min.x,
          boundingBox.min.y,
          boundingBox.max.x - boundingBox.min.x,
          boundingBox.max.y - boundingBox.min.y
        ),
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
      uZoom: {
        // type: 'f',
        value: 0,
        needsUpdate: true,
      },
      uTime: {
        // type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      // #define PI 3.1415926535897932384626433832795

      // attribute float f;
      attribute vec2 normal2;
      // uniform vec4 uBoundingBox;
      uniform float uZoom;
      uniform float uTime;
      // varying vec3 vColor;
      // varying float vF;
      varying vec2 vUv;
      // varying vec2 vNormal2;
      // varying vec3 vNormal;

      vec2 rotate2D(vec2 v, float a) {
        return vec2(
          v.x * cos(a) - v.y * sin(a),
          v.x * sin(a) + v.y * cos(a)
        );
      }

      void main() {
        float angle = uTime * PI * 2.;
        // vec2 direction = rotate2D(normal2, angle);
        vec3 p = vec3(rotate2D(position.xy, angle) + rotate2D(normal2 * uZoom * 10., angle), position.z);

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        const float radius = 0.175;
        // vColor = abs(position) / radius;
        // vColor = normalize(vColor);
        // vF = f;
        // vNormal = normal;
        vUv = uv;
        // vNormal2 = normal2;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      // uniform vec4 uBoundingBox;
      uniform float uTime;
      uniform float uColor1;
      uniform float uColor2;
      // uniform float uZoom;
      // uniform float uTimeCubic;
      // varying vec3 vColor;
      // varying float vF;
      varying vec2 vUv;
      // varying vec2 vNormal2;
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

      void main() {
        /* float t = pow(uTime, 0.5)/2. + 0.5;
        bool draw;
        if (vF > 0.5) {
          draw = vF < t;
        } else {
          draw = (1.-vF) < t;
        }
        if (draw) {
          gl_FragColor = vec4(hueShift(vec3(1., 0., 0.), vF * PI * 3.), 1.);
        } else {
          discard;
        } */
        
        gl_FragColor = vec4(vUv.x, vUv.y, 0., 1.);
      }
    `,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.update = (timestamp, timeDiff) => {
    const maxTime = 2000;
    const f = (timestamp % maxTime) / maxTime;

    /* const localPlayer = useLocalPlayer();
    mesh.position.copy(localPlayer.position);
    mesh.quaternion.copy(localPlayer.quaternion);
    mesh.updateMatrixWorld(); */

    const targetType = 'friend';
    // const targetTypeIndex = targetTypes.indexOf(targetType);
    const targetTypeColor = targetTypeColors[targetType];
    material.uniforms.uColor1.value.copy(targetTypeColor[0]);
    material.uniforms.uColor1.needsUpdate = true;
    material.uniforms.uColor2.value.copy(targetTypeColor[1]);
    material.uniforms.uColor2.needsUpdate = true;

    let f2;
    if (f < 1/3) {
      f2 = f * 3;
    } else if (f < 2/3) {
      f2 = 1;
    } else {
      f2 = 1 - ((f - 2/3) * 3);
    }
    material.uniforms.uZoom.value = 1 - f2;
    material.uniforms.uZoom.needsUpdate = true;

    material.uniforms.uTime.value = f;
    material.uniforms.uTime.needsUpdate = true;
  };
  return mesh;
};
export default () => {
  const mesh = _makeTargetReticleMesh();

  useFrame(({timestamp, timeDiff}) => {
    mesh.update(timestamp, timeDiff);
  });
  
  return mesh;
};