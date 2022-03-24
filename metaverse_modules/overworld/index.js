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
          key: "previewPosition",
          value: [0, 1.5, -150]
        },
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
          value: [0, 1.5, -150]
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
    const {name, type, start_url, components, renderPriority} = spec;
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
      app.renderPriority = renderPriority ?? 0;
      return app;
    } else {
      throw new Error(`unknown object type ${type}`);
    }
  };
  const _sortApps = () => {
    app.children.sort((a, b) => {
      const aPriority = a.renderPriority;
      const bPriority = b.renderPriority;
      const diff = aPriority - bPriority;
      if (diff !== 0) {
        return diff;
      } else {
        const aIndex = initObjects.findIndex(o => o.name === a.name);
        const bIndex = initObjects.findIndex(o => o.name === b.name);
        return aIndex - bIndex;
      }
    });
  };
  e.waitUntil((async () => {
    const promises = initObjects.map(async spec => {
      const o = await _loadObject(spec);
      app.add(o);
      _sortApps();
      objects.set(spec.name, o);
      return o;
    });
    await Promise.all(promises);
  
    const street = objects.get('street');
    const battalion = objects.get('battalion');
    const barrier = objects.get('barrier');
    barrier.addEventListener('collision', e => {
      battalion.renderPriority = 0;
      street.renderPriority = -1;
      _sortApps();
      
      battalion.setFocus(true);
      street.setFocus(false);
    });
  })());

  return app;
};