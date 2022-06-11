import * as Z from 'zjs/z.mjs';
import WSRTC from 'wsrtc/wsrtc.js';

import hpManager from './hp-manager.js';
import {AppManager} from './app-manager.js';
import {scene, sceneHighPriority, sceneLowPriority, sceneLowerPriority, sceneLowestPriority} from './renderer.js';
import {appsMapName, playersMapName} from './constants.js';
import {playersManager} from './players-manager.js';
import {getLocalPlayer} from './players.js';

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

// Handles the world and objects in it
// World has an app manager just like a player
class World {
  constructor() {
    const appManager = new AppManager();
    this.appManager = appManager;
    this.winds = [];
    this.wsrtc = null;
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

  isConnected() { return !!this.wsrtc; }

  getConnection() { return this.wsrtc; }

  connectState(state) {
    state.setResolvePriority(1);

    this.appManager.unbindStateLocal();
    this.appManager.clear();
    this.appManager.bindStateLocal(state.getArray(appsMapName));

    playersManager.unbindState();
    playersManager.bindState(state.getArray(playersMapName));

    const localPlayer = getLocalPlayer();
    localPlayer.bindState(state.getArray(playersMapName));
  }

  async connectRoom(u, state = new Z.Doc()) {
    const localPlayer = getLocalPlayer();

    state.setResolvePriority(1);
    this.wsrtc = new WSRTC(u, {
      localPlayer,
      crdtState: state,
    });

    const open = e => {
      this.wsrtc.removeEventListener('open', open);

      this.appManager.unbindState();
      this.appManager.clear();
      this.appManager.bindState(state.getArray(appsMapName));

      playersManager.unbindState();
      playersManager.bindState(state.getArray(playersMapName));

      const init = e => {
        this.wsrtc.removeEventListener('init', init);
        localPlayer.bindState(state.getArray(playersMapName));

        this.wsrtc.addEventListener('audio', e => {
          const player = playersManager.remotePlayersByInteger.get(e.data.playerId);
          player.processAudioData(e.data);
        });
      };
      this.wsrtc.addEventListener('init', init);
    };
    this.wsrtc.addEventListener('open', open);

    return this.wsrtc;
  }

  disconnectRoom() {
    this.wsrtc = null;
  }

  update(timestamp, timeDiffCapped, frame) {
    this.appManager.tick(timestamp, timeDiffCapped, frame);
    this.appManager.update(timestamp, timeDiffCapped, frame);
  }
}

export const world = new World();
