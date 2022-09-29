import * as THREE from 'three';
// import metaversefile from 'metaversefile';
import {playersManager} from './players-manager.js';
import {world} from './world.js';
import {scene} from './renderer.js';
import {ScenePreviewer} from './scene-previewer.js';

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();

const range = 30;

const overworldObject = new THREE.Object3D();
overworldObject.name = 'overworld';
scene.add(overworldObject);

class OverworldApp {
  constructor(chunk) {
    let {
      name,
      start_url,
      position,
      quaternion,
      scale,
      size,
      focus,
      chunkPriority,
    } = chunk;
    size = new THREE.Vector3().fromArray(size);

    this.name = name;
    this.size = size;

    const previewer = new ScenePreviewer({
      size,
      enterNormals: [],
    });
    previewer.setFocus(focus);
    const {lodMesh, skyboxMeshes, sceneObject} = previewer;

    position && previewer.position.fromArray(position);
    quaternion && previewer.quaternion.fromArray(quaternion);
    scale && previewer.scale.fromArray(scale);
    previewer.updateMatrixWorld();

    overworldObject.add(lodMesh);
    lodMesh.updateMatrixWorld();

    for (const skyboxMesh of skyboxMeshes) {
      overworldObject.add(skyboxMesh);
      skyboxMesh.updateMatrixWorld();
    }

    overworldObject.add(sceneObject);

    this.position = previewer.position;
    this.quaternion = previewer.quaternion;
    this.scale = previewer.scale;
    this.chunkPriority = chunkPriority;

    this.setFocus = previewer.setFocus.bind(previewer);

    this.loadPromise = previewer.loadScene(start_url).then(() => {});
  }

  waitForLoad() {
    return this.loadPromise;
  }
}

const loadOverworld = async () => {
  const localPlayer = playersManager.getLocalPlayer();
  const chunks = [
    {
      name: 'street',
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1],
      start_url: './scenes/street.scn',
      size: [300, 300, 300],
      focus: false,
      chunkPriority: -1,
    },
    {
      name: 'shadows',
      position: [0, 0, 0],
      quaternion: [0, 1, 0, 0],
      start_url: './scenes/shadows2.scn',
      size: [200, 200, 200],
      focus: false,
      chunkPriority: -1,
    },
  ];
  // const _getChunkComponent = (chunk, key) => chunk.components.find(component => component.key === key);
  // const _getChunkComponentValue = (chunk, key) => _getChunkComponent(chunk, key)?.value;
  const _setChunksLinearPositions = chunks => {
    if (chunks.length > 0) {
      const firstSize = chunks[0].size;
      let z = firstSize[2] / 2;
      for (const chunk of chunks) {
        const size = chunk.size;
        z -= size[2] / 2;
        chunk.position[2] = z;
        z -= size[2] / 2;
      }
    }
  };
  _setChunksLinearPositions(chunks);

  const _setChunkFocus = focusChunk => {
    for (const chunk of chunks) {
      chunk.focus = chunk === focusChunk;
      chunk.chunkPriority = chunk.focus ? 0 : -1;
    }
  };
  const _findChunkByPosition = position => {
    for (const chunk of chunks) {
      const chunkPosition = chunk.position;
      const chunkSize = chunk.size;
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
      const chunkSize = chunk.size;
      if (
        position.x >= chunkPosition[0] - chunkSize[0] / 2 - range &&
        position.x <= chunkPosition[0] + chunkSize[0] / 2 + range &&
        position.z >= chunkPosition[2] - chunkSize[2] / 2 - range &&
        position.z <= chunkPosition[2] + chunkSize[2] / 2 + range
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
      chunkApp.setFocus(focus);
      chunkApp.chunkPriority = focus ? 0 : -1;
    }
  };
  const _findChunkAppByPosition = position => {
    for (const chunkApp of chunkApps) {
      const chunkAppPosition = chunkApp.position;
      const chunkAppSize = chunkApp.size;
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
  /* const _setChunkAppFocusFromPosition = position => {
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
      const chunkAppSize = localVector.fromArray(chunkApp.size);
      if (
        position.x >= chunkAppPosition.x - chunkAppSize.x/2 - range &&
        position.x <= chunkAppPosition.x + chunkAppSize.x/2 + range &&
        position.z >= chunkAppPosition.z - chunkAppSize.z/2 - range &&
        position.z <= chunkAppPosition.z + chunkAppSize.z/2 + range
      ) {
        result.push(chunkApp);
      }
    }
    return result;
  }; */

  //

  const _reifyChunk = chunk => {
    const chunkApp = new OverworldApp(chunk);
    const chunkAppPromise = chunkApp.waitForLoad.bind(chunkApp);
    return [chunkApp, chunkAppPromise];
  };
  const _reifyChunks = chunks => {
    const chunkAppPromises = Array(chunks.length).fill(null);
    const chunkApps = chunks.map((chunk, i) => {
      const [chunkApp, chunkAppPromise] = _reifyChunk(chunk);
      chunkAppPromises[i] = chunkAppPromise;
      return chunkApp;
    });
    return {
      chunkApps,
      chunkAppPromises,
    };
  };

  //

  _setChunkFocusFromPosition(localPlayer.position);
  const currentChunks = _getChunksInRange(localPlayer.position, range);
  const {chunkApps, chunkAppPromises} = _reifyChunks(currentChunks);
  let lastChunkApp = _findChunkAppByPosition(localPlayer.position);

  //

  const _sortApps = () => {
    overworldObject.children.sort((a, b) => {
      const aPriority = a.chunkPriority;
      const bPriority = b.chunkPriority;
      const diff = aPriority - bPriority;
      if (diff !== 0) {
        return diff;
      } else {
        const aIndex = chunks.findIndex(o => o.name === a.name);
        const bIndex = chunks.findIndex(o => o.name === b.name);
        return aIndex - bIndex;
      }
    });
  };
  _sortApps();

  world.appManager.addEventListener('frame', () => {
    const newChunks = _getChunksInRange(localPlayer.position, range);

    for (const newChunk of newChunks) {
      if (!currentChunks.includes(newChunk)) {
        currentChunks.push(newChunk);

        const [chunkApp, chunkAppPromise] = _reifyChunk(newChunk);
        chunkApps.push(chunkApp);
        chunkAppPromises.push(chunkAppPromise);
        _sortApps();
      }
    }

    const currentChunkApp = _findChunkAppByPosition(localPlayer.position);
    if (currentChunkApp !== lastChunkApp) {
      // console.log('chunk app changed', currentChunkApp);
      _setChunkAppFocus(currentChunkApp);
      lastChunkApp = currentChunkApp;
    }
  });

  overworldObject.hasSubApps = true;

  await Promise.all(chunkAppPromises);
};
export {loadOverworld};
