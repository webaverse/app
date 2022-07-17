// import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

export default e => {
  const app = useApp();

  app.name = 'land';

  const landApps = [
    {
      "start_url": "../../scenes/dual-contouring-terrain/"
    },
    /* {
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
            "../../ghost/",
            "../../silkworm-biter/",
            "../../silkworm-bloater/",
            "../../silkworm-queen/",
            "../../silkworm-runner/",
            "../../silkworm-slasher/"
          ],
        },
      ],
    }, */
  ];
  const passComponents = [];
  const seed = app.getComponent('seed');
  const clipRange = app.getComponent('clipRange');
  const physicsInstance = app.getComponent('physicsInstance');
  const wait = app.getComponent('wait');
  const debug = app.getComponent('debug');

  const renderPosition = app.getComponent('renderPosition');
  if (renderPosition !== undefined) {
    passComponents.push({
      "key": "renderPosition",
      "value": renderPosition,
    });
  }
  const minLodRange = app.getComponent('minLodRange');
  if (minLodRange !== undefined) {
    passComponents.push({
      "key": "minLodRange",
      "value": minLodRange,
    });
  }
  const lods = app.getComponent('lods');
  if (lods !== undefined) {
    passComponents.push({
      "key": "lods",
      "value": lods,
    });
  }
  if (seed !== undefined) {
    passComponents.push({
      "key": "seed",
      "value": seed,
    });
  }
  if (clipRange !== undefined) {
    passComponents.push({
      "key": "clipRange",
      "value": clipRange,
    });
  }
  if (physicsInstance !== undefined) {
    passComponents.push({
      "key": "physicsInstance",
      "value": physicsInstance,
    });
  }
  if (wait !== undefined) {
    passComponents.push({
      "key": "wait",
      "value": wait,
    });
  }
  if (debug !== undefined) {
    passComponents.push({
      "key": "debug",
      "value": debug,
    });
  }

  app.addEventListener('componentsupdate', e => {
    const {keys} = e;
    const components = {};
    for (const key of keys) {
      components[key] = app.getComponent(key);
    }

    for (const subApp of subApps) {
      subApp.setComponents(components);
    }
  });

  const subApps = [];
  const loadPromise = (async () => {
    await Promise.all(landApps.map(async spec => {
      const {start_url, components} = spec;
      const components2 = (components ?? []).concat(passComponents);

      const keys = [];
      const componentsupdate = (e) => {
        keys.push(...e.keys);
      };
      app.addEventListener('componentsupdate', componentsupdate);
      
      const subApp = await metaversefile.createAppAsync({
        start_url,
        parent: app,
        components: components2,
      });
      subApps.push(subApp);

      app.removeEventListener('componentsupdate', componentsupdate);
      for (const key of keys) {
        subApp.setComponent(key, app.getComponent(key));
      }
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
  app.getChunkForPhysicsObject = physicsObject => {
    for (const subApp of subApps) {
      if (subApp.getChunkForPhysicsObject) {
        return subApp.getChunkForPhysicsObject(physicsObject);
      }
    }
    return null;
  }

  useCleanup(() => {
    for (const subApp of subApps) {
      subApp.destroy();
    }
  });

  return app;
};