import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useFrame, useMaterials, useLocalPlayer, useMathUtils} = metaversefile;

const upVector = new THREE.Vector3(0, 1, 0);

const radiusTop = 0.005;
const radiusBottom = radiusTop;
const playerCenterRadius = 0.3;
// const height = 1;
const radialSegments = 8;
const heightSegments = 16;
const openEnded = true;
const segmentLength = 0.05;
const verticesPerHeightSegment = radialSegments + 1;
const verticesPerPart = verticesPerHeightSegment * (heightSegments + 1);
const numPointSets = 2;

// const localVector2D = new THREE.Vector2();

let lastPartPositions = Array(numPointSets);
for (let i = 0; i < numPointSets; i++) {
  lastPartPositions[i] = new THREE.Vector3();
}
const _updatePoints = (player, pointSets) => {
  // const leftPartPosition = player.position.clone()
  //   .add(new THREE.Vector3(-playerCenterRadius, 0, 0).applyQuaternion(player.quaternion));
  // const rightPartPosition = player.position.clone()
  //   .add(new THREE.Vector3(playerCenterRadius, 0, 0).applyQuaternion(player.quaternion));
  // const partPositions = [leftPartPosition, rightPartPosition];
  for (let pointSetIndex = 0; pointSetIndex < pointSets.length; pointSetIndex++) {
    const points = pointSets[pointSetIndex];
    const {offset} = points;

    const partPosition = player.position.clone()
      .add(
        offset.clone()
          .applyQuaternion(player.quaternion)
      );
    const lastPartPosition = lastPartPositions[pointSetIndex];
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(lastPartPosition, partPosition, upVector)
    );

    points[0].position.copy(partPosition);
    points[0].quaternion.copy(quaternion);

    for (let i = 1; i <= heightSegments; i++) {
      const point = points[i];
      const nextPoint = points[i - 1];
      const pointQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(point.position, nextPoint.position, upVector)
      );
      point.position.copy(nextPoint.position)
        .add(new THREE.Vector3(0, 0, segmentLength).applyQuaternion(pointQuaternion));
      point.quaternion.copy(pointQuaternion);
    }

    lastPartPositions[pointSetIndex] = partPosition;
  }
};
const _setPoints = (geometry, pointSets) => {
  for (let pointSetIndex = 0; pointSetIndex < pointSets.length; pointSetIndex++) {
    const points = pointSets[pointSetIndex];
    const partVertexOffset = pointSetIndex * verticesPerPart;
    
    for (let heightSegment = 0; heightSegment < points.length; heightSegment++) {
      const {
        position,
        quaternion,
      } = points[heightSegment];
      for (let j = 0; j < verticesPerHeightSegment; j++) {
        position.toArray(geometry.attributes.p.array, heightSegment * verticesPerHeightSegment * 3 + j * 3 + partVertexOffset * 3);
        quaternion.toArray(geometry.attributes.q.array, heightSegment * verticesPerHeightSegment * 4 + j * 4 + partVertexOffset * 4);
      }
    }
    geometry.attributes.p.needsUpdate = true;
    geometry.attributes.q.needsUpdate = true;
  }
};

function createSilksGeometry() {
  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    0, // height,
    radialSegments,
    heightSegments,
    openEnded,
  ).rotateX(-Math.PI / 2);
  /* geometry.setAttribute(
    'offset',
    new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count), 1)
  ); */
  geometry.setAttribute(
    'p',
    new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3)
  );
  geometry.setAttribute(
    'q',
    new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 4), 4)
  );
  return geometry;
};
/* const _incrementUvs = (geometry, duv) => {
  for (let i = 0; i < geometry.attributes.uv.count; i++) {
    localVector2D.fromArray(geometry.attributes.uv.array, i * 2)
      .add(duv)
      .toArray(geometry.attributes.uv.array, i * 2);
  }
}; */
/* const _setOffsets = (geometry, offsetValue) => {
  for (let i = 0; i < geometry.attributes.offset.array.length; i++) {
    geometry.attributes.offset.array[i] = offsetValue;
  }
  geometry.attributes.offset.needsUpdate = true;
}; */
const _makeSilksMesh = () => {
  const {WebaverseShaderMaterial} = useMaterials();

  const geometry1 = createSilksGeometry();
  const geometry2 = createSilksGeometry();
  // _incrementUvs(geometry2, new THREE.Vector2(0, 1));
  // _setOffsets(geometry1, -1);
  // _setOffsets(geometry2, 1);
  const geometry = BufferGeometryUtils.mergeBufferGeometries([geometry1, geometry2]);
  // _setOffsets(geometry, 1);
  
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

      uniform float uTime;
      attribute vec3 p;
      attribute vec4 q;
      varying vec2 vUv;

      const float radius = ${playerCenterRadius.toFixed(8)};

      vec4 quat_from_axis_angle(vec3 axis, float angle) { 
        vec4 qr;
        float half_angle = (angle * 0.5);
        qr.x = axis.x * sin(half_angle);
        qr.y = axis.y * sin(half_angle);
        qr.z = axis.z * sin(half_angle);
        qr.w = cos(half_angle);
        return qr;
      }

      vec3 rotate_vertex_position(vec3 position, vec4 q) { 
        vec3 v = position.xyz;
        return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
      }

      void main() {
        vec3 pos = position;
        
        {
          pos = rotate_vertex_position(pos, q);
          pos += p;
        }        

        /* {
          vec4 qt = quat_from_axis_angle(vec3(0.0, 1.0, 0.0), uTime * PI * 2.);
          pos = rotate_vertex_position(pos, qt);
        } */
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        vUv = uv;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      uniform float uTime;
      varying float vOffset;
      varying vec2 vUv;

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

        gl_FragColor = vec4(hueShift(vec3(1., 0., 0.), vUv.y * PI * 2.), 1.);

        /* bool draw;
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

        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }
    `,
    // side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  const pointsSets = Array(numPointSets);
  for (let i = 0; i < numPointSets; i++) {
    const points = Array(heightSegments + 1);
    for (let j = 0; j < points.length; j++) {
      points[j] = {
        position: new THREE.Vector3(0, 0, j / heightSegments),
        quaternion: new THREE.Quaternion(),
      };
    }
    points.offset = new THREE.Vector3((-1 + i * 2) * playerCenterRadius, 0, 0);
    pointsSets[i] = points;
  }

  mesh.update = (timestamp, timeDiff) => {
    const maxTime = 3000;
    const f = (timestamp % maxTime) / maxTime;

    const localPlayer = useLocalPlayer();
    _updatePoints(localPlayer, pointsSets);
    _setPoints(geometry, pointsSets);

    /* mesh.position.copy(localPlayer.position);
    mesh.quaternion.copy(localPlayer.quaternion);
    mesh.updateMatrixWorld(); */

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