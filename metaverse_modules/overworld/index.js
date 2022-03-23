import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp} = metaversefile;

export default e => {
  const app = useApp();

  app.name = 'overworld';

  const initObjects = [
    {
      name: 'street',
      type: 'scene',
      start_url: './scenes/street.scn',
      components: {
        mode: 'detached',
      },
    },
    {
      name: 'barrier',
      type: 'app',
      start_url: '../metaverse_modules/barrier/',
      components: [
        {
          key: 'bounds',
          value: [
            [-150, -150, -450],
            [150, 150, -150]
          ]
        }
      ]
    },
    {
      type: 'app',
      position: [0, 0, -300],
      quaternion: [0, 1, 0, 0],
      start_url: "../metaverse_modules/scene-preview/",
      components: [
        {
          key: "previewPosition",
          value: [0, 0, -150]
        },
        {
            key: "sceneUrl",
            value: "./scenes/battalion.scn"
        },
      ],
    },
  ];

  const objects = new Map();
  const _loadObject = async spec => {
    const {name, type, start_url} = spec;
    if (type === 'scene') {
      const scene = await metaversefile.createAppAsync({
        start_url,
        components: {
          mode: 'detached',
        },
      });
      scene.name = name;
      return scene;
    } else if (type === 'app') {
      const {start_url, position, quaternion, scale, components} = spec;
      const app = metaversefile.createAppAsync({
        start_url,
        position,
        quaternion,
        scale,
        components,
      });
      app.name = name;
      return app;
    } else {
      throw new Error(`unknown object type ${type}`);
    }
  };
  e.waitUntil((async () => {
    const promises = initObjects.map(async spec => {
      const o = await _loadObject(spec);
      app.add(o);
      objects.set(spec.name, o);
      return o;
    });
    await Promise.all(promises);
  })());

  return app;
};