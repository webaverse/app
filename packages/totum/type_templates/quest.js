import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useDefaultModules, useQuests, useCleanup} = metaversefile;

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localQuaterion = new THREE.Quaternion();

export default e => {
  const app = useApp();
  const defaultModules = useDefaultModules();
  const questManager = useQuests();

  const srcUrl = ${this.srcUrl};

  const _makeAreaApp = ({
    size,
  }) => {
    const areaApp = metaversefile.createApp({
      module: defaultModules.modules.area,
      parent: app,
      components: {
        size,
      },
    });
    // console.log('create area app', areaApp);
    return areaApp;
  };
  const _makeCameraPlaceholderApp = ({
    position,
    quaternion,
  }) => {
    const cameraPlaceholderApp = metaversefile.createApp({
      position: new THREE.Vector3().fromArray(position),
      quaternion: new THREE.Quaternion().fromArray(quaternion),
      module: defaultModules.modules.cameraPlaceholder,
      parent: app,
    });
    return cameraPlaceholderApp;
  };
  const _makePathApp = () => {
    const pathApp = metaversefile.createApp({
      module: defaultModules.modules.path,
      parent: app,
      /* components: {
        line: [
          [92.5, 0, -33],
          [19.5, -4, 59.5],
        ],
      }, */
    });
    return pathApp;
  };

  const cameraPositionArray = app.getComponent('cameraPosition') ?? [0, 1.5, 0];
  const cameraQuaternionArray = app.getComponent('cameraQuaternion') ?? [-0.3826834323650898, -0, -0, 0.9238795325112867];
  const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 3000);
  camera.position.fromArray(cameraPositionArray);
  camera.quaternion.fromArray(cameraQuaternionArray);
  app.add(camera);
  app.camera = camera;
  camera.updateMatrixWorld();

  const size = app.getComponent('size') ?? [4, 2, 4];
  const areaApp = _makeAreaApp({
    size,
  });
  const cameraPlaceholderApp = _makeCameraPlaceholderApp({
    position: cameraPositionArray,
    quaternion: cameraQuaternionArray,
  });
  const pathApp = _makePathApp();

  app.json = null;
  const loadPromise = (async () => {
    const res = await fetch(srcUrl);
    app.json = await res.json();
  })();
  e.waitUntil(loadPromise);

  let quest = null;
  const _getPaused = () => app.getComponent('paused') ?? false;
  const _bindQuest = () => {
    quest = questManager.addQuest(app);
  };
  const _unbindQuest = () => {
    questManager.removeQuest(quest);
    quest = null;
  };
  const _checkPaused = async () => {
    await loadPromise;
    
    const paused = _getPaused();
    if (!paused && quest === null) {
      _bindQuest();
    } else if (paused && quest !== null) {
      _unbindQuest();
    }
  };
  _checkPaused();

  app.addEventListener('componentsupdate', e => {
    if (e.keys.includes('paused')) {
      _checkPaused();
    }
  });

  useCleanup(() => {
    quest !== null && _unbindQuest();
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'quest';
export const components = ${this.components};