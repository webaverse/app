import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useProcGenManager, useMobManager, useFrame, useScene, useCleanup} = metaversefile;

export default e => {
  const app = useApp();
  const mobManager = useMobManager();
  const scene = useScene();
  const procGenManager = useProcGenManager();

  app.name = 'spawner';

  const appUrls = app.getComponent('appUrls') ?? [];

  const seed = app.getComponent('seed') ?? null;
  let range = app.getComponent('range') ?? null;
  if (range) {
    range = new THREE.Box3(
      new THREE.Vector3(range[0][0], range[0][1], range[0][2]),
      new THREE.Vector3(range[1][0], range[1][1], range[1][2])
    );
  }

  const procGenInstance = procGenManager.getInstance(seed, range);

  const mobber = mobManager.createMobber({
    procGenInstance,
    appUrls: appUrls,
  });
  /* (async () => {
    await Promise.all(appUrls.map(async appUrl => {
      await mobber.addMobModule(appUrl);
    }));
    mobber.compile();
  })(); */

  e.waitUntil(mobber.waitForLoad());

  const chunks = mobber.getChunks();
  app.add(chunks);
  chunks.updateMatrixWorld();
  // console.log('spawner add app chunks', {app, chunks});

  useFrame(({timestamp, timeDiff}) => {
    mobber.update(timestamp, timeDiff);
  });

  useCleanup(() => {
    scene.remove(chunks);
    mobber.destroy();
  });

  return app;
};