import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useScene, usePhysics, useWear, useMeshLodder} = metaversefile;

// const zeroVector = new THREE.Vector3(0, 0, 0);
const localMatrix = new THREE.Matrix4();

export default () => {
  const app = useApp();
  // const scene = useScene();
  // const physicsManager = usePhysics();
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
      itemMesh.matrix.premultiply(localMatrix.copy(itemMesh.parent.matrixWorld).invert())
        .decompose(itemMesh.position, itemMesh.quaternion, itemMesh.scale);
    } else {
      itemMesh.position.set(0, 0, 0);
      itemMesh.quaternion.identity();
      itemMesh.scale.set(1, 1, 1);
      itemMesh.updateMatrixWorld();
    }
    // app.updateMatrixWorld();
  });

  let wearing = false;
  useWear(e => {
    // console.log('use wear', e);
    wearing = e.wear;

    /* if (!wearing) {
      const physicsObject = physicsObjects[0];
      physicsObject.position.copy(app.position);
      physicsObject.quaternion.copy(app.quaternion);
      physicsObject.scale.copy(app.scale);
      physicsObject.matrix.copy(app.matrix);
      physicsObject.matrixWorld.copy(app.matrixWorld);
      // console.log('set position', physicsObject.position.toArray().join(','));
      physicsManager.setTransform(physicsObject, true);
      physicsManager.setVelocity(physicsObject, zeroVector, true);
      physicsManager.setAngularVelocity(physicsObject, zeroVector, true);
    } */
  });

  app.getPhysicsObjects = () => physicsObjects;

  return app;
};