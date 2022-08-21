import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, usePhysics, useWear, useMeshLodder, useCleanup, useDefaultModules, addTrackedApp} = metaversefile;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const r = () => (-0.5+Math.random())*2;

const _copyTransform = (dst, src) => {
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dst.scale.copy(src.scale);
  dst.matrix.copy(src.matrix);
  dst.matrixWorld.copy(src.matrixWorld);
};

export default () => {
  const app = useApp();
  const physicsManager = usePhysics();
  const meshLodManager = useMeshLodder();
  const {moduleUrls} = useDefaultModules();

  app.name = 'mesh-lod-item';

  const meshLodderId = app.getComponent('meshLodderId');
  const physicsId = app.getComponent('physicsId');
  
  const meshLodder = meshLodManager.getMeshLodder(meshLodderId);

  let itemDiceMesh = null;
  {
    itemDiceMesh = meshLodder.cloneItemDiceMesh(physicsId);
    app.add(itemDiceMesh);
    itemDiceMesh.updateMatrixWorld();
  }

  let itemMesh = null;
  const physicsObjects = [];
  {
    itemMesh = meshLodder.cloneItemMesh(physicsId);
    itemMesh.position.set(0, 0, 0);
    itemMesh.quaternion.identity();
    itemMesh.scale.set(1, 1, 1);

    app.add(itemMesh);
    itemMesh.updateMatrixWorld();
  }
  {
    const physicsObject = meshLodder.clonePhysicsObject(physicsId);
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

  app.addEventListener('die', async () => {
    const numSilks = Math.floor(1 + Math.random() * 6);
    const promises = [];
    for (let i = 0; i < numSilks; i++) {
      const components = [
        {
          key: 'drop',
          value: {
            velocity: new THREE.Vector3(r(), 1+Math.random(), r())
              .normalize()
              .multiplyScalar(5)
              .toArray(),
            angularVelocity: new THREE.Vector3(0, 0.001, 0)
              .toArray(),
          },
        },
      ];

      const p = addTrackedApp(
        moduleUrls.silk,
        localVector.setFromMatrixPosition(itemMesh.matrixWorld),
        localQuaternion.identity(),
        localVector2.set(1, 1, 1),
        components
      );
      promises.push(p);
    }
    await Promise.all(promises);
  });

  useCleanup(() => {
    for (const physicsObject of physicsObjects) {
      physicsManager.removeGeometry(physicsObject);
    }
  });

  app.getPhysicsObjects = () => physicsObjects;

  return app;
};