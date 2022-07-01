import * as Z from 'zjs/z.mjs';
import hpManager from './hp-manager.js';
import {AppManager} from './app-manager.js';
import {scene, sceneHighPriority, sceneLowPriority, sceneLowerPriority, sceneLowestPriority} from './renderer.js';
import {appsMapName, worldMapName} from './constants.js';
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
    this.winds = []; // hold list of wind objects, accessed by metaversefile API
    this.appManager = new AppManager(this);
    // This handles adding apps to the world scene
    this.appManager.addEventListener('appadd', e => {
      const app = e.data;
      const bindScene = _getBindSceneForRenderPriority(app.getComponent('renderPriority'));
      bindScene.add(app);

      const hitTracker = hpManager.makeHitTracker();
      hitTracker.bind(app);
      app.dispatchEvent({type: 'hittrackeradded'});

      const die = () => {
        this.appManager.removeTrackedApp(app.instanceId);
      };
      app.addEventListener('die', die);
    });

    // This handles removal of apps from the scene when we leave the world
    this.appManager.addEventListener('appremove', async e => {
      const app = e.data;
      app.hitTracker.unbind();
      app.parent.remove(app);
    });
  }

  async init(state) {
    console.log("state is", state);

    const appsArray = state.get(appsMapName, Z.Array);
    console.log("world is", appsArray);

    this.appManager.bindState(appsArray);
    console.log("appsArray is", appsArray);
    for (let i = 0; i < this.appManager.appsArray.length; i++) {
      const trackedApp = this.appManager.appsArray.get(i, Z.Map);
      const app = await this.appManager.importTrackedApp(trackedApp);

      this.appManager.bindTrackedApp(trackedApp, app);
    }
    // console.log("this.appManager.appsArray is", this.appManager.appsArray)
    // for (let i = 0; i < this.appManager.appsArray.length; i++) {
    //   const trackedApp = this.appManager.appsArray.get(i, Z.Map);
    //   const app = await this.appManager.appManager.importTrackedApp(trackedApp);
    //   this.appManager.bindTrackedApp(trackedApp, app);
    // }
  }
}

export const world = new World();
