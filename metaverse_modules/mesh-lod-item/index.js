import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useMeshLodder} = metaversefile;

export default () => {
  const app = useApp();
  // const scene = useScene();
  const meshLodManager = useMeshLodder();

  app.name = 'mesh-lod-item';

  // console.log('mesh lod item app', app.components, app.getComponent('meshLodderId'), app.getComponent('physicsId'));

  const meshLodderId = app.getComponent('meshLodderId');
  const physicsId = app.getComponent('physicsId');

  const meshLodder = meshLodManager.getMeshLodder(meshLodderId);
  const item = meshLodder.getItemByPhysicsId(physicsId);

  let itemMesh = null;
  const physicsObjects = [];
  {
    itemMesh = item.cloneItemMesh();
    itemMesh.position.set(0, 0, 0);
    itemMesh.quaternion.identity();
    itemMesh.scale.set(1, 1, 1);
    // itemMesh.matrix.identity();
    // itemMesh.matrixWorld.identity();

    app.add(itemMesh);
    itemMesh.updateMatrixWorld();
    // window.itemMesh = itemMesh;
    // window.app = app;
  }
  {
    const physicsObject = item.clonePhysicsObject();
    physicsObjects.push(physicsObject);
    // console.log('item physics object', physicsObject.physicsId);
  }

  useFrame(() => {
    const physicsObject = physicsObjects[0];
    itemMesh.position.copy(physicsObject.position);
    itemMesh.quaternion.copy(physicsObject.quaternion);
    itemMesh.scale.copy(physicsObject.scale);
    itemMesh.matrix.copy(physicsObject.matrix);
    itemMesh.matrixWorld.copy(physicsObject.matrixWorld);
  });

  app.getPhysicsObjects = () => physicsObjects;

  return app;
};