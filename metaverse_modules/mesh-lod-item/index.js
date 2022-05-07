import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useScene, usePhysics, useWear, useMeshLodder} = metaversefile;

// const zeroVector = new THREE.Vector3(0, 0, 0);
const localMatrix = new THREE.Matrix4();

const _copyTransform = (dst, src) => {
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dst.scale.copy(src.scale);
  dst.matrix.copy(src.matrix);
  dst.matrixWorld.copy(src.matrixWorld);
};

export default () => {
  const app = useApp();
  const meshLodManager = useMeshLodder();

  app.name = 'mesh-lod-item';

  const meshLodderId = app.getComponent('meshLodderId');
  const physicsId = app.getComponent('physicsId');

  const meshLodder = meshLodManager.getMeshLodder(meshLodderId);
  const item = meshLodder.getItemByPhysicsId(physicsId);

  let itemDiceMesh = null;
  {
    itemDiceMesh = item.cloneItemDiceMesh();
    app.add(itemDiceMesh);
    itemDiceMesh.updateMatrixWorld();
  }

  let itemMesh = null;
  const physicsObjects = [];
  {
    itemMesh = item.cloneItemMesh();
    itemMesh.position.set(0, 0, 0);
    itemMesh.quaternion.identity();
    itemMesh.scale.set(1, 1, 1);

    itemMesh.updateMatrixWorld();
  }
  {
    const physicsObject = item.clonePhysicsObject();
    physicsObjects.push(physicsObject);
  }

  useFrame(() => {
    if (!wearing) {
      const physicsObject = physicsObjects[0];
      itemMesh.position.copy(physicsObject.position);
      itemMesh.quaternion.copy(physicsObject.quaternion);
      itemMesh.scale.copy(physicsObject.scale);
      itemMesh.matrix.copy(physicsObject.matrix);
      itemMesh.matrixWorld.copy(physicsObject.matrixWorld);
      itemMesh.matrix
        .premultiply(
          localMatrix.copy(app.matrixWorld).invert()
        )
        .decompose(itemMesh.position, itemMesh.quaternion, itemMesh.scale);

      _copyTransform(itemDiceMesh, itemMesh);
    } else {
      itemMesh.position.set(0, 0, 0);
      itemMesh.quaternion.identity();
      itemMesh.scale.set(1, 1, 1);
      itemMesh.updateMatrixWorld();

      _copyTransform(itemDiceMesh, itemMesh);
    }
  });

  let wearing = false;
  useWear(e => {
    wearing = e.wear;
  });

  app.getPhysicsObjects = () => physicsObjects;

  return app;
};