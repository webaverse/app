import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useLocalPlayer, useFrame} = metaversefile;

const localVector = new THREE.Vector3();

const range = 30;

export default e => {
  const app = useApp();

  app.name = 'overworld';

  const localPlayer = useLocalPlayer();
  const chunks = [
    {
      name: 'street',
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      start_url: '../metaverse_modules/scene-preview/',
      components: [
        {
          key: 'size',
          value: [300, 150, 300],
        },
        /* {
          key: "previewPosition",
          value: [0, 1.5, -150]
        }, */
        {
          key: 'sceneUrl',
          value: './scenes/street.scn',
        },
        /* {
          key: "focus",
          value: true,
        }, */
      ],
      chunkPriority: -1,
    },
    {
      name: 'shadows',
      position: [0, 0, 0],
      quaternion: [0, 1, 0, 0],
      start_url: '../metaverse_modules/scene-preview/',
      components: [
        {
          key: 'size',
          value: [200, 150, 200],
        },
        /* {
          key: "previewPosition",
          value: [0, 0, 0]
        }, */
        {
          key: 'sceneUrl',
          value: './scenes/shadows.scn',
        },
      ],
      chunkPriority: -1,
    },
  ];
  const _getChunkComponent = (chunk, key) => chunk.components.find(component => component.key === key);
  const _getChunkComponentValue = (chunk, key) => _getChunkComponent(chunk, key)?.value;
  const _setChunksLinearPositions = chunks => {
    if (chunks.length > 0) {
      const firstSize = _getChunkComponentValue(chunks[0], 'size');
      let z = firstSize[2] / 2;
      for (const chunk of chunks) {
        const size = _getChunkComponentValue(chunk, 'size');
        z -= size[2] / 2;
        chunk.position[2] = z;
        z -= size[2] / 2;
      }
    }
  };
  _setChunksLinearPositions(chunks);

  const _setChunkFocus = focusChunk => {
    for (const chunk of chunks) {
      const value = chunk === focusChunk;
      let focusComponent = _getChunkComponent(chunk, 'focus');
      if (!focusComponent) {
        focusComponent = {
          key: 'focus',
          value,
        };
        chunk.components.push(focusComponent);
      }
      focusComponent.value = true;

      chunk.chunkPriority = value ? 0 : -1;
    }
  };
  const _findChunkByPosition = position => {
    for (const chunk of chunks) {
      const chunkPosition = chunk.position;
      const chunkSize = _getChunkComponentValue(chunk, 'size');
      if (
        position.x >= chunkPosition[0] - chunkSize[0] / 2 &&
        position.x <= chunkPosition[0] + chunkSize[0] / 2 &&
        position.z >= chunkPosition[2] - chunkSize[2] / 2 &&
        position.z <= chunkPosition[2] + chunkSize[2] / 2
      ) {
        return chunk;
      }
    }
    return null;
  };
  const _getChunksInRange = (position, range) => {
    const result = [];
    for (const chunk of chunks) {
      const chunkPosition = chunk.position;
      const chunkSize = _getChunkComponentValue(chunk, 'size');
      if (
        position.x >= chunkPosition[0] - chunkSize[0] / 2 + range &&
        position.x <= chunkPosition[0] + chunkSize[0] / 2 - range &&
        position.z >= chunkPosition[2] - chunkSize[2] / 2 + range &&
        position.z <= chunkPosition[2] + chunkSize[2] / 2 - range
      ) {
        result.push(chunk);
      }
    }
    return result;
  };
  const _setChunkFocusFromPosition = position => {
    const chunk = _findChunkByPosition(position);
    _setChunkFocus(chunk);
  };
  const _setChunkAppFocus = focusChunkApp => {
    for (const chunkApp of chunkApps) {
      const focus = chunkApp === focusChunkApp;
      chunkApp.setComponent('focus', focus);
      chunkApp.chunkPriority = focus ? 0 : -1;
    }
  };
  const _findChunkAppByPosition = position => {
    for (const chunkApp of chunkApps) {
      const chunkAppPosition = chunkApp.position;
      const chunkAppSize = localVector.fromArray(_getChunkComponentValue(chunkApp, 'size'));
      if (
        position.x >= chunkAppPosition.x - chunkAppSize.x / 2 &&
        position.x <= chunkAppPosition.x + chunkAppSize.x / 2 &&
        position.z >= chunkAppPosition.z - chunkAppSize.z / 2 &&
        position.z <= chunkAppPosition.z + chunkAppSize.z / 2
      ) {
        return chunkApp;
      }
    }
    return null;
  };
  const _setChunkAppFocusFromPosition = position => {
    const chunkApp = _findChunkAppByPosition(position);
    if (chunkApp !== lastChunkApp) {
      _setChunkAppFocus(chunkApp);
      lastChunkApp = chunkApp;
    }
  };
  const _getChunkAppsInRange = (position, range) => {
    const result = [];
    for (const chunkApp of chunkApps) {
      const chunkAppPosition = chunkApp.position;
      const chunkAppSize = localVector.fromArray(_getChunkComponentValue(chunkApp, 'size'));
      if (
        position.x >= chunkAppPosition.x - chunkAppSize.x / 2 + range &&
        position.x <= chunkAppPosition.x + chunkAppSize.x / 2 - range &&
        position.z >= chunkAppPosition.z - chunkAppSize.z / 2 + range &&
        position.z <= chunkAppPosition.z + chunkAppSize.z / 2 - range
      ) {
        result.push(chunkApp);
      }
    }
    return result;
  };

  //

  const _reifyChunk = chunk => {
    const {name, start_url, components, position, quaternion, scale, chunkPriority} = chunk;
    const [chunkApp, chunkAppPromise] = metaversefile.createAppPair({
      start_url,
      position,
      quaternion,
      scale,
      components,
    });
    chunkApp.name = `overworld-subapp-${name}`;
    chunkApp.chunkPriority = chunkPriority ?? 0;
    return {
      chunkApp,
      chunkAppPromise,
    };
  };
  const _reifyChunks = chunks => {
    const chunkAppPromises = Array(chunks.length).fill(null);
    const chunkApps = chunks.map((chunk, i) => {
      const {
        chunkApp,
        chunkAppPromise,
      } = _reifyChunk(chunk);
      chunkAppPromises[i] = chunkAppPromise;
      return chunkApp;
    });
    return {
      chunkApps,
      chunkAppPromises,
    };
  };

  //

  /* {
    const chunksInRange = _getChunksInRange(localPlayer.position, range);
    if (chunksInRange.length > 0) {
      console.log('chunks in range', chunksInRange.length);
      debugger;
    }
  } */

  _setChunkFocusFromPosition(localPlayer.position);
  const chunksInRange = _getChunksInRange(localPlayer.position, range);
  const {
    chunkApps,
    chunkAppPromises,
  } = _reifyChunks(chunksInRange);
  let lastChunkApp = _findChunkAppByPosition(localPlayer.position);

  for (const chunkApp of chunkApps) {
    app.add(chunkApp);
  }

  // console.log('got chunk apps', chunkApps);
  // window.chunkApps = chunkApps;

  //

  const _sortApps = () => {
    app.children.sort((a, b) => {
      const aPriority = a.chunkPriority;
      const bPriority = b.chunkPriority;
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
  _sortApps();
  e.waitUntil(
    Promise.all(chunkAppPromises)
      .then(() => {
        console.log('all chunk apps loaded');
      }),
  );

  useFrame(() => {
    _getChunkAppsInRange(localPlayer.position, range);
  });

  app.hasSubApps = true;

  return app;
};
