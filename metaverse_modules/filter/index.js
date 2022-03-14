import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, usePhysics, useProcGen, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector2D = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);
const oneVector = new THREE.Vector3(1, 1, 1);

export default () => {
  const app = useApp();
  const physics = usePhysics();
  const procGen = useProcGen();
  const {voxelWorldSize} = procGen;

  const bounds = app.getComponent('bounds');
  const [min, max] = bounds;
  const [minX, minY, minZ] = min;
  const [maxX, maxY, maxZ] = max;
  const width = maxX - minX;
  const height = maxY - minY;
  const depth = maxZ - minZ;
  // console.log('got bounds', bounds);
  const exits = app.getComponent('exits');
  // console.log('got bounds exits', bounds, exits, width, height);

  app.name = 'filter';

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

  const physicsIds = [];
  {
    const geometries = wallNormals.map(wallNormal => {
      const localExitSpecs = exits.map(exit => {
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
          const size = new THREE.Vector2(voxelWorldSize, voxelWorldSize);

          let position;
          if (wallNormal.x !== 0) {
            position = new THREE.Vector2((-depth/2 + localVector.z) * -wallNormal.x, 0);
          } else if (wallNormal.z !== 0) {
            position = new THREE.Vector2((-width/2 + localVector.x) * -wallNormal.z, 0);
          } else if (wallNormal.y !== 0) {
            position = new THREE.Vector2(-width/2 + localVector.x + size.x/2, -depth/2 + localVector.z);
          } else {
            console.warn('invalid wall normal', wallNormal.toArray());
            throw new Error('invalid wall normal');
          }

          return {
            position,
            size,
          };
        } else {
          return null;
        }
      }).filter(exit => exit !== null);
      if (localExitSpecs.length > 0) {
        const scale = _getScaleFromNormal(wallNormal, localVector);
        const outerWidth = scale.x;
        const outerHeight = scale.y;

        // XXX this needs to be quantized to voxelWorldSize because path drawing is inaccurate
        const wallShape = new THREE.Shape();

        wallShape.moveTo(-outerWidth / 2, -outerHeight / 2);
        wallShape.lineTo(-outerWidth / 2, outerHeight / 2);
        wallShape.lineTo(outerWidth / 2, outerHeight / 2);
        wallShape.lineTo(outerWidth / 2, -outerHeight / 2);
        wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);

        for (const localExitSpec of localExitSpecs) {
          const {position, size} = localExitSpec;

          wallShape.lineTo(position.x - size.x/2 + size.x, position.y - size.y/2);
          wallShape.lineTo(position.x + size.x/2 + size.x, position.y - size.y/2);
          wallShape.lineTo(position.x + size.x/2 + size.x, position.y + size.y/2);
          wallShape.lineTo(position.x - size.x/2 + size.x, position.y + size.y/2);
          wallShape.lineTo(position.x - size.x/2 + size.x, position.y - size.y/2);
          wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);
        }

        const offset = localVector.multiplyVectors(dims, wallNormal)
          .divideScalar(2);
        const quaternion = localQuaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            zeroVector,
            wallNormal,
            upVector,
          )
        );

        return new THREE.ShapeGeometry(wallShape)
          .applyMatrix4(
            localMatrix.compose(offset, quaternion, oneVector)
          );
      } else {
        const offset = localVector.multiplyVectors(dims, wallNormal)
          .divideScalar(2);
        const quaternion = localQuaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            zeroVector,
            wallNormal,
            upVector,
          )
        );
        const scale = _getScaleFromNormal(wallNormal, localVector2);
        return new THREE.PlaneBufferGeometry(1, 1, 1)
          .applyMatrix4(
            localMatrix.compose(offset, quaternion, scale)
          );
      }
    });
    const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    app.add(mesh);
    mesh.updateMatrixWorld();

    const physicsId = physics.addGeometry(mesh);
    physicsIds.push(physicsId);
  }

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};
