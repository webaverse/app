import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, usePhysics, useProcGen, addTrackedApp, useDefaultModules, useCleanup, createMapChunk, createMapChunkMesh} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector2D = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);
const oneVector = new THREE.Vector3(1, 1, 1);

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
    // console.log('got bounds', width, depth);
    const exits = app.getComponent('exits');
    // console.log('got bounds exits', bounds, exits, width, height);

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
            /* let position;
            if (normal.x !== 0) {
              position = new THREE.Vector2((-depth/2 + localVector.z) * normal.x, size.y/2);
            } else if (normal.z !== 0) {
              position = new THREE.Vector2((-width/2 + localVector.x) * normal.z, size.y/2);
            } else if (normal.y !== 0) {
              position = new THREE.Vector2(-width/2 + size.x/2 + localVector.x, -depth/2 + size.y/2 + localVector.z);
            } else {
              console.warn('invalid wall normal', normal.toArray());
              throw new Error('invalid wall normal');
            } */

            const position = new THREE.Vector3(
              -width/2 +
                (0.5 * -normal.x) +
                localVector.x +
                (normal.x === -1 ? voxelWorldSize : 0) +
                (normal.z * voxelWorldSize/2),
              voxelWorldSize/2 +
                localVector.y,
              -depth/2 +
                (0.5 * -normal.z) +
                localVector.z +
                (normal.z === -1 ? voxelWorldSize : 0) +
                (normal.x * voxelWorldSize/2),
            );

            const faceQuaternion = new THREE.Quaternion()
              .setFromRotationMatrix(
                new THREE.Matrix4().lookAt(
                  zeroVector,
                  normal.clone().multiplyScalar(-1),
                  upVector,
                )
              ).invert();
            position.applyQuaternion(faceQuaternion);

            /* const position = new THREE.Vector3(
              // -width/2 +
                // (0.5 * -normal.x) +
                localVector.x +
                (normal.x === -1 ? voxelWorldSize : 0) +
                (normal.z * voxelWorldSize/2),
              voxelWorldSize/2 +
                localVector.y,
              // -depth/2 +
                // (0.5 * -normal.z) +
                localVector.z +
                (normal.z === -1 ? voxelWorldSize : 0) +
                (normal.x * voxelWorldSize/2),
            ); */

            /* const position = new THREE.Vector3(
              -width/2 + (0.5 * -normal.x) + localVector.x + (normal.x === -1 ? voxelWorldSize : 0),
              voxelWorldSize/2 + localVector.y,
              -depth/2 + (0.5 * -normal.z) + localVector.z + (normal.z === -1 ? voxelWorldSize : 0)
            ); */

            if (normal.x === 1) {
              console.log('filter exit', normal.toArray().join(', '), localVector.toArray().join(', '), position.toArray().join(', '));
            }

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

          /* if (outerWidth !== width) {
            debugger;
          }
          if (outerHeight !== height) {
            debugger;
          } */

          const wallShape = new THREE.Shape();

          wallShape.moveTo(-outerWidth / 2, -outerHeight / 2);
          wallShape.lineTo(-outerWidth / 2, outerHeight / 2);
          wallShape.lineTo(outerWidth / 2, outerHeight / 2);
          wallShape.lineTo(outerWidth / 2, -outerHeight / 2);
          wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);

          for (const localExitSpec of localNormalExitSpecs) {
            const {position, normal, size} = localExitSpec;

            /* const normalQuaternion = new THREE.Quaternion().setFromRotationMatrix(
              localMatrix.lookAt(
                normal,
                localVector.set(0, 0, 0),
                localVector2.set(0, 1, 0),
              )
            );
            const xOffset = new THREE.Vector3(1, 0, 0)
              .applyQuaternion(normalQuaternion);
            const yOffset = new THREE.Vector3(0, 1, 0)
              .applyQuaternion(normalQuaternion); */

            wallShape.lineTo(position.x - size.x/2, position.y - size.y/2);
            wallShape.lineTo(position.x + size.x/2, position.y - size.y/2);
            wallShape.lineTo(position.x + size.x/2, position.y + size.y/2);
            wallShape.lineTo(position.x - size.x/2, position.y + size.y/2);
            wallShape.lineTo(position.x - size.x/2, position.y - size.y/2);
            wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);
          }

          const offset = localVector.multiplyVectors(dims, wallNormal.clone().multiplyScalar(-1))
            .divideScalar(2);
          const quaternion = localQuaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              wallNormal,
              zeroVector,
              upVector,
            )
          );

          g = new THREE.ShapeGeometry(wallShape)
            .applyMatrix4(
              localMatrix.compose(offset, quaternion, oneVector)
            );
        } else {
          const offset = localVector.multiplyVectors(dims, wallNormal.clone().multiplyScalar(-1))
            .divideScalar(2);
          const quaternion = localQuaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              wallNormal,
              zeroVector,
              upVector,
            )
          );
          const scale = _getScaleFromNormal(wallNormal, localVector2);
          g = new THREE.PlaneBufferGeometry(1, 1, 1)
            .applyMatrix4(
              localMatrix.compose(offset, quaternion, scale)
            );
        }
        return quantizeGeometry(g, voxelWorldSize);
      });
      const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

      const material = new THREE.MeshNormalMaterial();
      const mesh = new THREE.Mesh(geometry, material);
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
