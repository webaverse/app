import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, usePhysics, useProcGen, addTrackedApp, useDefaultModules, useCleanup, createMapChunk, createMapChunkMesh} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);
const oneVector = new THREE.Vector3(1, 1, 1);
const worldSize = 2;
const uvRange = 10 * worldSize;

function quantizeGeometry(g, n) {
  const positions = g.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    localVector.fromArray(positions, i);

    localVector.x = Math.round(localVector.x / n) * n;
    localVector.y = Math.round(localVector.y / n) * n;
    localVector.z = Math.round(localVector.z / n) * n;

    localVector.toArray(positions, i);
  }
  g.attributes.position.needsUpdate = true;
  return g;
}
function addPositionUvs(geometry) {
  const positions = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;
  const uvs = geometry.attributes.uv.array;
  for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
    const position = localVector.fromArray(positions, i);
    const normal = localVector2.fromArray(normals, i);
    // const uv = localVector2D.fromArray(uvs, j);

    let x;
    let y;
    if (Math.abs(normal.x) > 0.5) {
      x = Math.floor(position.z / worldSize);
      y = Math.floor(position.y / worldSize);
    } else if (Math.abs(normal.y) > 0.5) {
      x = Math.floor(position.x / worldSize);
      y = Math.floor(position.z / worldSize);
    } else if (Math.abs(normal.z) > 0.5) {
      x = Math.floor(position.x / worldSize);
      y = Math.floor(position.y / worldSize);
    } else {
      console.warn('bad normal', normal.clone());
      throw new Error('bad normal');
    }

    localVector2D.set(x, y)
      .toArray(uvs, j);
  }

  return geometry;
}
/* function addBarycentricAttributes(geometry) {
  geometry = geometry.toNonIndexed();

  const barycentrics = new Float32Array(geometry.attributes.position.array.length);
  let barycentricIndex = 0;
  for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
    barycentrics[barycentricIndex++] = 1;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 1;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 1;
  }
  geometry.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3));

  return geometry;
} */

const funGridMaterial = new THREE.ShaderMaterial({
  uniforms: {
    /* uBeat: {
      type: 'f',
      value: 1,
    },
    uBeat2: {
      type: 'f',
      value: 0,
    }, */
  },
  vertexShader: `\
    ${THREE.ShaderChunk.common}

    attribute float y;
    varying vec2 vUv;
    varying vec3 vPosition;
    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

      ${THREE.ShaderChunk.logdepthbuf_vertex}
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;

    #define PI 3.1415926535897932384626433832795

    varying vec3 vPosition;
    varying vec2 vUv;

    const vec3 lineColor1 = vec3(${new THREE.Color(0x66bb6a).toArray().join(', ')});
    const vec3 lineColor2 = vec3(${new THREE.Color(0x9575cd).toArray().join(', ')});

    ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

    float rand1DBi(float x) {
      return sin(2. * x) + sin(PI * x);
    }
    float rand1D(float x) {
      return 0.5 + rand1DBi(x)/4.;
    }
    float rand(float n){
      return fract(sin(n) * 43758.5453123);
    }
    float edgeFactor(vec3 bary, float width) {
      vec3 d = fwidth(bary);
      vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
      return min(min(a3.x, a3.y), a3.z);
    }

    const float cutSize = 8.;
    const float cutSize2 = cutSize * 0.5;

    void main() {
      vec3 c = mix(lineColor1, lineColor2, vPosition.y / 10.);

      vec2 uv = vUv;
      vec2 oUv = uv;

      vec2 uvGridSeedX = vec2(floor(oUv.x*0.5 * cutSize2 + 0.5), floor(oUv.y * cutSize2 + 0.5));
      vec2 uvGridSeedY = vec2(floor(oUv.x * cutSize2 + 0.5), floor(oUv.y*0.5 * cutSize2 + 0.5));
      vec2 uvGridModX = mod(vec2(oUv.x*0.5 * cutSize2 + 0.5, oUv.y * cutSize2 + 0.5), 1.);
      vec2 uvGridModY = mod(vec2(oUv.x * cutSize2 + 0.5, oUv.y*0.5 * cutSize2 + 0.5), 1.);
      
      const float deltaRange = 0.15;
      float xBottomOffset = (rand(uvGridSeedX.x * 100. + uvGridSeedX.y * 100.)*2.-1.) * deltaRange;
      float xTopOffset = (rand(uvGridSeedX.x * 100. + (uvGridSeedX.y + 1.) * 100.)*2.-1.) * deltaRange;
      float yLeftOffset = (rand(uvGridSeedY.x * 100. + uvGridSeedY.y * 100. + 1000.)*2.-1.) * deltaRange;
      float yRightOffset = (rand((uvGridSeedY.x + 1.) * 100. + uvGridSeedY.y * 100. + 1000.)*2.-1.) * deltaRange;
      
      float xOffset = xBottomOffset * (1. - uvGridModX.y) + xTopOffset * uvGridModX.y;
      float yOffset = yLeftOffset * (1. - uvGridModY.x) + yRightOffset * uvGridModY.x;

      float f = min(
        abs(mod(uv.x + xOffset, 1.)),
        abs(mod(uv.y + yOffset, 1.))
      );
      
      f *= ${uvRange.toFixed(8)};
      float a = max(1. - f, 0.);
      if (a < 0.5) {
        // gl_FragColor.rgb = vec3(0.);
        discard;
      } else {
        gl_FragColor = vec4(c, a);
        //gl_FragColor = sRGBToLinear(gl_FragColor);
      }

      /* gl_FragColor.rb += uvGridModY.xy * 0.1;
      gl_FragColor.a = 1.; */

      ${THREE.ShaderChunk.logdepthbuf_fragment}
    }
  `,
  side: THREE.DoubleSide,
  transparent: true,
});

export default () => {
  const app = useApp();
  const physics = usePhysics();
  const procGen = useProcGen();
  const {
    voxelWorldSize,
    chunkWorldSize,
    createMapChunk,
    createMapChunkMesh,
  } = procGen;

  app.name = 'filter';

  let mapChunkMesh = null;
  const children = [];
  const physicsIds = [];
  const _render = () => {
    const coords = app.getComponent('coords');
    const [x, y] = coords;

    const delta = app.getComponent('delta');
    const [dx, dy] = delta;

    const bounds = app.getComponent('bounds');
    const [min, max] = bounds;
    const [minX, minY, minZ] = min;
    const [maxX, maxY, maxZ] = max;
    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;
    const exits = app.getComponent('exits');

    const dims = new THREE.Vector3(width, height, depth);

    const wallNormals = [
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
    ];
    const _getScaleFromNormal = (normal, target) => {
      if (normal.z !== 0) {
        return target.set(dims.x, dims.y, 1);
      } else if (normal.x !== 0) {
        return target.set(dims.z, dims.y, 1);
      } else if (normal.y !== 0) {
        return target.set(dims.x, dims.z, 1);
      } else {
        throw new Error('invalid normal');
      }
    };

    {
      const geometries = wallNormals.map(wallNormal => {
        let g = null;
        const localNormalExitSpecs = exits.map(exit => {
          const size = new THREE.Vector2(voxelWorldSize, voxelWorldSize);

          localVector.fromArray(exit);
          let normal;
          if (localVector.x === 0) { // XXX blocks should come with an incoming direction so this is well-defined
            normal = localVector2.set(1, 0, 0);
          } else if (localVector.x === (width - voxelWorldSize)) {
            normal = localVector2.set(-1, 0, 0);
          } else if (localVector.z === 0) {
            normal = localVector2.set(0, 0, 1);
          } else if (localVector.z === (depth - voxelWorldSize)) {
            normal = localVector2.set(0, 0, -1);
          } else if (localVector.y === 0) {
            normal = localVector2.set(0, 1, 0);
          } else if (localVector.y === (height - voxelWorldSize)) {
            normal = localVector2.set(0, -1, 0);
          } else {
            console.warn('invalid exit position', exit, width, height, depth);
            throw new Error('invalid exit position');
          }

          if (normal.equals(wallNormal)) {
            const position = new THREE.Vector3(
              -width / 2 +
                (0.5 * -normal.x) +
                localVector.x +
                (normal.x === -1 ? voxelWorldSize : 0) +
                (normal.z * voxelWorldSize / 2),
              voxelWorldSize / 2 +
                localVector.y,
              -depth / 2 +
                (0.5 * -normal.z) +
                localVector.z +
                (normal.z === -1 ? voxelWorldSize : 0) +
                (normal.x * voxelWorldSize / 2),
            );

            const faceQuaternion = new THREE.Quaternion()
              .setFromRotationMatrix(
                new THREE.Matrix4().lookAt(
                  zeroVector,
                  normal.clone().multiplyScalar(-1),
                  upVector,
                ),
              ).invert();
            position.applyQuaternion(faceQuaternion);

            /* if (normal.x === 1) {
              console.log('filter exit', normal.toArray().join(', '), localVector.toArray().join(', '), position.toArray().join(', '));
            } */

            return {
              position,
              normal: normal.clone(),
              size,
            };
          } else {
            return null;
          }
        }).filter(exit => exit !== null);
        if (localNormalExitSpecs.length > 0) {
          const scale = _getScaleFromNormal(wallNormal, localVector);
          const outerWidth = scale.x;
          const outerHeight = scale.y;

          const wallShape = new THREE.Shape();

          wallShape.moveTo(-outerWidth / 2, -outerHeight / 2);
          wallShape.lineTo(-outerWidth / 2, outerHeight / 2);
          wallShape.lineTo(outerWidth / 2, outerHeight / 2);
          wallShape.lineTo(outerWidth / 2, -outerHeight / 2);
          wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);

          for (const localExitSpec of localNormalExitSpecs) {
            const {position, normal, size} = localExitSpec;

            wallShape.lineTo(position.x - size.x / 2, position.y - size.y / 2);
            wallShape.lineTo(position.x + size.x / 2, position.y - size.y / 2);
            wallShape.lineTo(position.x + size.x / 2, position.y + size.y / 2);
            wallShape.lineTo(position.x - size.x / 2, position.y + size.y / 2);
            wallShape.lineTo(position.x - size.x / 2, position.y - size.y / 2);
            wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);
          }

          const offset = localVector.multiplyVectors(dims, wallNormal.clone().multiplyScalar(-1))
            .divideScalar(2);
          const quaternion = localQuaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              wallNormal,
              zeroVector,
              upVector,
            ),
          );

          g = new THREE.ShapeGeometry(wallShape)
            .applyMatrix4(
              localMatrix.compose(offset, quaternion, oneVector),
            );
        } else {
          const offset = localVector.multiplyVectors(dims, wallNormal.clone().multiplyScalar(-1))
            .divideScalar(2);
          const quaternion = localQuaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              wallNormal,
              zeroVector,
              upVector,
            ),
          );
          const scale = _getScaleFromNormal(wallNormal, localVector2);
          g = new THREE.PlaneBufferGeometry(1, 1, 1)
            .applyMatrix4(
              localMatrix.compose(offset, quaternion, scale),
            );
        }
        return quantizeGeometry(g, voxelWorldSize);
      });
      let geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
      geometry = addPositionUvs(geometry);
      // geometry = addBarycentricAttributes(geometry);

      const mesh = new THREE.Mesh(geometry, funGridMaterial);
      mesh.position.set(dx * chunkWorldSize, 0, dy * chunkWorldSize);
      app.add(mesh);
      mesh.updateMatrixWorld();
      children.push(mesh);

      const physicsId = physics.addGeometry(mesh);
      physicsIds.push(physicsId);
    }
    {
      const mapChunk = createMapChunk(undefined, x, y);
      const {blocks} = mapChunk;
      const data = new Uint8Array(blocks.length);
      for (let i = 0; i < blocks.length; i++) {
        data[i] = blocks[i].toUint8();
      }

      const mesh = createMapChunkMesh(x, y, data);
      mesh.position.set(dx * chunkWorldSize, 0, dy * chunkWorldSize);
      app.add(mesh);
      mesh.updateMatrixWorld();
      children.push(mesh);

      mapChunkMesh = mesh;
    }
  };
  _render();

  app.addEventListener('componentsupdate', ({keys}) => {
    if (keys.includes('delta')) {
      _cleanup();
      _render();
    }
  });

  useFrame(e => {
    const {timestamp, timeDiff} = e;
    mapChunkMesh.update(timestamp, timeDiff);
  });

  const _cleanup = () => {
    for (const child of children) {
      app.remove(child);
    }
    children.length = 0;

    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
  };
  useCleanup(() => {
    _cleanup();
  });

  return app;
};
