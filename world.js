import hpManager from './hp-manager.js';
import {AppManager} from './app-manager.js';
import {scene, sceneHighPriority, sceneLowPriority, sceneLowerPriority, sceneLowestPriority} from './renderer.js';

const _getBindSceneForRenderPriority = renderPriority => {
  switch (renderPriority) {
    case 'high': {
      return sceneHighPriority;
    }
    case 'low': {
      return sceneLowPriority;
    }
    case 'lower': {
      return sceneLowerPriority;
    }
    case 'lowest': {
      return sceneLowestPriority;
    }
    default: {
      return scene;
    }
  }
};

// Handles the world and objects in it, has an app manager just like a player
export class World {
  constructor() {
    this.appManager = new AppManager();
    this.winds = [];
    // This handles adding apps to the world scene
    this.appManager.addEventListener('appadd', e => {
      const app = e.data;
      const bindScene = _getBindSceneForRenderPriority(app.getComponent('renderPriority'));
      bindScene.add(app);

      const hitTracker = hpManager.makeHitTracker();
      hitTracker.bind(app);
      app.dispatchEvent({type: 'hittrackeradded'});

      let boundAppManager = this.appManager;
      const die = () => {
        boundAppManager.removeTrackedApp(app.instanceId);
      };
      app.addEventListener('die', die);

      const migrated = e => {
        const {appManager} = e;
        boundAppManager = appManager;
      };
      app.addEventListener('migrated', migrated);
    });

    // This handles removal of apps from the scene when we leave the world
    this.appManager.addEventListener('appremove', async e => {
      const app = e.data;
      app.hitTracker.unbind();
      app.parent.remove(app);
    });
  }
}

export const world = new World();
