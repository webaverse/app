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
  const wait = app.getComponent('wait') ?? false;
  if (range) {
    range = new THREE.Box3(
      new THREE.Vector3(range[0][0], range[0][1], range[0][2]),
      new THREE.Vector3(range[1][0], range[1][1], range[1][2])
    );
  }

  let mobber = null;
  e.waitUntil((async () => {
    let live = true;
    useCleanup(() => {
      live = false;
    });

    const mobData = await mobManager.loadData(appUrls);
    if (!live) return;

    const procGenInstance = procGenManager.getInstance(seed, range);
    mobber = mobManager.createMobber({
      procGenInstance,
      mobData,
    });

    const chunks = mobber.getChunks();
    app.add(chunks);
    chunks.updateMatrixWorld();

    if (wait) {
      await mobber.waitForUpdate();
    }
  })());

  useFrame(({timestamp, timeDiff}) => {
    mobber && mobber.update(timestamp, timeDiff);
  });

  useCleanup(() => {
    if (mobber) {
      const chunks = mobber.getChunks();
      scene.remove(chunks);
      mobber.destroy();
    }
  });

  return app;
};