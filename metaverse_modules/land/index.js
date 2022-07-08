// import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useProcGenManager, useCleanup} = metaversefile;

export default e => {
  const app = useApp();

  app.name = 'land';

  const landApps = [
    {
      "start_url": "https://webaverse.github.io/dual-contouring-terrain/"
    },
    {
      "start_url": "https://webaverse.github.io/silk-grass/"
    },
    {
      "start_url": "https://webaverse.github.io/plants/"
    },
    {
      "start_url": "/metaverse_modules/spawner/",
      "components": [
        {
          "key": "appUrls",
          "value": [
            "https://webaverse.github.io/ghost/",
            "https://webaverse.github.io/silkworm-biter/",
            "https://webaverse.github.io/silkworm-bloater/",
            "https://webaverse.github.io/silkworm-queen/",
            "https://webaverse.github.io/silkworm-runner/",
            "https://webaverse.github.io/silkworm-slasher/"
          ],
        },
      ],
    },
  ];
  const passComponents = [];
  const seed = app.getComponent('seed');
  const range = app.getComponent('range');
  const wait = app.getComponent('wait') ?? false;
  /* if (range) {
    range = new THREE.Box3(
      new THREE.Vector3(range[0][0], range[0][1], range[0][2]),
      new THREE.Vector3(range[1][0], range[1][1], range[1][2])
    );
  } */
  if (seed !== undefined) {
    passComponents.push({
      "key": "seed",
      "value": seed,
    });
  }
  if (range !== undefined) {
    passComponents.push({
      "key": "range",
      "value": range,
    });
  }
  if (wait) {
    passComponents.push({
      "key": "wait",
      "value": true,
    });
  }

  const subApps = [];
  const loadPromise = (async () => {
    await Promise.all(landApps.map(async spec => {
      const {start_url, components} = spec;
      const components2 = (components ?? []).concat(passComponents);
      const subApp = await metaversefile.createAppAsync({
        start_url,
        parent: app,
        components: components2,
      });
      subApps.push(subApp);
    }));
  })();
  if (wait) {
    e.waitUntil(loadPromise);
  }

  app.getPhysicsObjects = () => {
    const result = [];
    for (const subApp of subApps) {
      const physicsObjects = subApp.getPhysicsObjects();
      result.push(...physicsObjects);
    }
    return result;
  };

  useCleanup(() => {
    for (const subApp of subApps) {
      subApp.destroy();
    }
  });

  return app;
};