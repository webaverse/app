import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useLoaders, usePhysics, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);
const oneVector = new THREE.Vector3(1, 1, 1);

export default () => {
  const app = useApp();
  const physics = usePhysics();

  app.name = 'filter';

  // const w = 16, h = 8, d = 8;
  const dims = new THREE.Vector3(16, 8, 8);
  const exitSpecs = [
    {
      normal: new THREE.Vector3(0, 0, -1),
      position: new THREE.Vector2(0, 0),
      size: new THREE.Vector2(4, 4),
    },
  ];

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
      const localExitSpecs = exitSpecs.filter(exitSpec => exitSpec.normal.equals(wallNormal));
      if (localExitSpecs.length > 0) {
        // const outerWidth = 16;
        // const outerHeight = 8;
        // const boxPosition = new THREE.Vector2(outerWidth / 2, outerHeight / 2);
        // const boxSize = new THREE.Vector2(4, 4);
        /* const innerBox = new THREE.Box2(
          boxPosition.clone().sub(localVector2D.copy(boxSize).divideScalar(2)),
          boxPosition.clone().add(localVector2D.copy(boxSize).divideScalar(2))
        ); */

        const scale = _getScaleFromNormal(wallNormal, localVector);
        const outerWidth = scale.x;
        const outerHeight = scale.y;
        // console.log('got scale', scale.x, scale.y, localExitSpecs);

        const wallShape = new THREE.Shape();

        wallShape.moveTo(-outerWidth / 2, -outerHeight / 2);
        wallShape.lineTo(-outerWidth / 2, outerHeight / 2);
        wallShape.lineTo(outerWidth / 2, outerHeight / 2);
        wallShape.lineTo(outerWidth / 2, -outerHeight / 2);
        wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);

        for (const localExitSpec of localExitSpecs) {
          const {position, size} = localExitSpec;

          wallShape.lineTo(position.x - size.x/2, position.y - size.y/2);
          wallShape.lineTo(position.x + size.x/2, position.y - size.y/2);
          wallShape.lineTo(position.x + size.x/2, position.y + size.y/2);
          wallShape.lineTo(position.x - size.x/2, position.y + size.y/2);
          wallShape.lineTo(position.x - size.x/2, position.y - size.y/2);
          wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);
        }

        /* wallShape.lineTo(-outerWidth / 2 + innerBox.min.x, -outerHeight / 2 + innerBox.min.y);
        wallShape.lineTo(-outerWidth / 2 + innerBox.max.x, -outerHeight / 2 + innerBox.min.y);
        wallShape.lineTo(-outerWidth / 2 + innerBox.max.x, -outerHeight / 2 + innerBox.max.y);
        wallShape.lineTo(-outerWidth / 2 + innerBox.min.x, -outerHeight / 2 +innerBox.max.y);
        wallShape.lineTo(-outerWidth / 2 + innerBox.min.x, -outerHeight / 2 +innerBox.min.y);
        wallShape.lineTo(-outerWidth / 2, -outerHeight / 2); */

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
    app.updateMatrixWorld();
  }

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};
