// import * as THREE from 'three';
// import hpManager from './hp-manager.js';
import metaversefile from 'metaversefile';
const {useApp, createApp, useHpManager} = metaversefile;

export default () => {
  const app = useApp();
  const hpManager = useHpManager();

  const spawnUrl = app.getComponent('spawnUrl') ?? '';

  const range = app.getComponent('range') ?? 3;
  const r = () => -range + Math.random() * 2 * range;
  const maxMobs = 10;

  let subApps = [];
  (async () => {
    const m = await metaversefile.import(spawnUrl);
    
    const promises = [];
    for (let i = 0; i < maxMobs; i++) {
      promises.push((async () => {
        const subApp = createApp();
        subApp.name = `spawn-${m.name}-${i}`;

        subApp.position.set(
          r(),
          0, // r(),
          r()
        );
        subApp.quaternion.copy(app.quaternion);
        app.add(subApp);
        subApp.updateMatrixWorld();

        await subApp.addModule(m);

        const hitTracker = hpManager.makeHitTracker();
        hitTracker.bind(subApp);
        hitTracker.addEventListener('die', () => {
          hitTracker.unbind(subApp);
          app.remove(subApp);
        });

        return subApp;
      })());
    }
    subApps = await Promise.all(promises);
  })();

  app.getPhysicsObjects = () => {
    const result = [];
    for (const subApp of subApps) {
      result.push.apply(result, subApp.getPhysicsObjects());
    }
    return result;
  };
  app.hit = (damage, opts) => {
    const {physicsObject} = opts;
    for (const subApp of subApps) {
      const physicsObjects = subApp.getPhysicsObjects();
      if (physicsObjects.includes(physicsObject)) {
        subApp.hit(damage, opts);
        break;
      }
    }
  };

  return app;
};