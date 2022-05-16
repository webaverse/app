import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useFrame, useMaterials, useLocalPlayer, useMathUtils} = metaversefile;

function createSilksGeometry() {
  const radiusTop = 0.01;
  const radiusBottom = radiusTop;
  const height = 1;
  const radialSegments = 8;
  const heightSegments = 16;

  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    heightSegments,
  );
  return geometry;
};
const _incrementUvs = (geometry, duv) => {
  for (let i = 0; i < geometry.attributes.uv.count; i++) {
    localVector2D.fromArray(geometry.attributes.uv.array, i * 2)
      .add(duv)
      .toArray(geometry.attributes.uv.array, i * 2);
  }
};
const _makeSilksMesh = () => {
  const {WebaverseShaderMaterial} = useMaterials();

  const geometry1 = createSilksGeometry();
  const geometry2 = geometry1.clone();
  _incrementUvs(geometry2, new THREE.Vector2(0, 1));
  
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
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
      /* uTimeCubic: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      }, */
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      attribute float f;
      // uniform float uTime;
      // uniform vec4 uBoundingBox;
      varying vec3 vColor;
      varying float vF;
      // varying vec3 vNormal;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        const float radius = 0.175;
        vColor = abs(position) / radius;
        // vColor = normalize(vColor);
        vF = f;
        // vNormal = normal;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      // uniform vec4 uBoundingBox;
      uniform float uTime;
      uniform float uTimeCubic;
      varying vec3 vColor;
      varying float vF;
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
        float t = pow(uTime, 0.5)/2. + 0.5;

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
        }
      }
    `,
    // side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.update = (timestamp, timeDiff) => {
    const maxTime = 2000;
    const f = (timestamp % maxTime) / maxTime;

    const localPlayer = useLocalPlayer();
    mesh.position.copy(localPlayer.position);
    mesh.quaternion.copy(localPlayer.quaternion);
    mesh.updateMatrixWorld();

    material.uniforms.uTime.value = f;
    material.uniforms.uTime.needsUpdate = true;
  };
  return mesh;
};
export default () => {
  const mesh = _makeSilksMesh();

  useFrame(({timestamp, timeDiff}) => {
    mesh.update(timestamp, timeDiff);
  });
  
  return mesh;
};