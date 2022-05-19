// import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useMobManager, useFrame, useCleanup} = metaversefile;

export default () => {
  const app = useApp();
  const mobManager = useMobManager();

  const appUrls = app.getComponent('appUrls') ?? [];

  const mobber = mobManager.createMobber();
  (async () => {
    await Promise.all(appUrls.map(async appUrl => {
      await mobber.addMobModule(appUrl);
    }));
    mobber.compile();
  })();

  app.getPhysicsObjects = () => mobber.getPhysicsObjects();

  useFrame(({timestamp, timeDiff}) => {
    mobber.update(timestamp, timeDiff);
  });

  useCleanup(() => {
    mobber.destroy();
  });

  return app;
};