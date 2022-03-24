import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp} = metaversefile;

export default e => {
  const app = useApp();

  app.name = 'overworld';

  const initObjects = [
    {
      name: 'street',
      type: 'app',
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      start_url: "../metaverse_modules/scene-preview/",
      components: [
        {
          key: "sceneUrl",
          value: "./scenes/street.scn"
        },
        {
          key: "focus",
          value: true,
        },
      ],
    },
    {
      name: 'battalion',
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
      renderPriority: -1,
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
  ];

  const objects = new Map();
  const _loadObject = async spec => {
    const {name, type, start_url, components} = spec;
    if (type === 'scene') {
      const scene = await metaversefile.createAppAsync({
        start_url,
        components,
      });
      scene.name = name;
      scene.spec = spec;
      return scene;
    } else if (type === 'app') {
      const {position, quaternion, scale} = spec;
      const app = await metaversefile.createAppAsync({
        start_url,
        position,
        quaternion,
        scale,
        components,
      });
      app.name = name;
      app.spec = spec;
      return app;
    } else {
      throw new Error(`unknown object type ${type}`);
    }
  };
  e.waitUntil((async () => {
    const promises = initObjects.map(async spec => {
      const o = await _loadObject(spec);
      app.add(o);
      app.children.sort((a, b) => {
        const aPriority = a.spec.renderPriority ?? 0;
        const bPriority = b.spec.renderPriority ?? 0;
        const diff = aPriority - bPriority;
        if (diff !== 0) {
          return diff;
        } else {
          const aIndex = initObjects.findIndex(o => o.name === a.name);
          const bIndex = initObjects.findIndex(o => o.name === b.name);
          return aIndex - bIndex;
        }
      });
      objects.set(spec.name, o);
      return o;
    });
    await Promise.all(promises);
  
    const street = objects.get('street');
    const battalion = objects.get('battalion');
    const barrier = objects.get('barrier');
    barrier.addEventListener('collision', e => {
      battalion.setFocus(true);
      street.setFocus(false);
    });
  })());

  return app;
};