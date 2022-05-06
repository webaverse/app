import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScene, useMeshLodder} = metaversefile;

export default () => {
  const app = useApp();
  // const scene = useScene();
  const meshLodManager = useMeshLodder();

  app.name = 'mesh-lod-item';

  // console.log('mesh lod item app', app.components, app.getComponent('meshLodderId'), app.getComponent('physicsId'));

  const meshLodderId = app.getComponent('meshLodderId');
  const physicsId = app.getComponent('physicsId');

  const meshLodder = meshLodManager.getMeshLodder(meshLodderId);
  /* if (!meshLodder) {
    debugger;
  } */
  const item = meshLodder.getItemByPhysicsId(physicsId);
  {
    const itemMesh = item.cloneApp();
    // console.log('got item mesh', itemMesh, itemMesh.position.toArray().join(','));
    // itemMesh.position.y += 3;
    itemMesh.position.set(0, 0, 0);
    itemMesh.quaternion.identity();
    itemMesh.scale.set(1, 1, 1);
    itemMesh.matrix.identity();
    itemMesh.matrixWorld.identity();
    app.add(itemMesh);
  }
  /* {
    const meshLodItemApp = createApp();
    (async () => {
      const {modules} = useDefaultModules();
      const m = modules['meshLodItem'];
      await meshLodItemApp.addModule(m);
    })();
  } */

  return app;
};