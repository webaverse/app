import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useCleanup} = metaversefile;

export default e => {
  const app = useApp();
  // const scene = useScene();

  app.name = 'land';

  const landApps = [
    {
      "start_url": "../../dual-contouring-terrain/"
    },
    {
      "start_url": "../../silk-grass/"
    },
    {
      "start_url": "../../plants/"
    },
    {
      "start_url": "/metaverse_modules/spawner/",
      "components": [
        {
          "key": "appUrls",
          "value": [
            "../../ghost/",
            "../../silkworm-biter",
            "../../silkworm-bloater",
            "../../silkworm-queen",
            "../../silkworm-runner",
            "../../silkworm-slasher"
          ],
        },
      ],
    },
  ];
  const passComponents = [];
  const seed = app.getComponent('seed');
  const range = app.getComponent('range');
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

  const subApps = [];
  /*e.waitUntil(*/(async () => {
    await Promise.all(landApps.map(async spec => {
      const {start_url, components} = spec;
      const components2 = (components ?? []).concat(passComponents);
      const subApp = await metaversefile.createAppAsync({
        start_url,
        components: components2,
        parent: app,
      });
      subApps.push(subApp);
    }));
  })()//);

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