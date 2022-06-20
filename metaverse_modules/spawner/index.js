// import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useProcGenManager, useMobManager, useFrame, useScene, useCleanup} = metaversefile;

export default e => {
  const app = useApp();
  const mobManager = useMobManager();
  const scene = useScene();
  const procGenManager = useProcGenManager();

  const appUrls = app.getComponent('appUrls') ?? [];

  const procGenInstance = procGenManager.getInstance(null);

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