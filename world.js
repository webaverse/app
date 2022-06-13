import * as Z from 'zjs/z.mjs';
import WSRTC from 'wsrtc/wsrtc.js';
import {getLocalPlayer, remotePlayers} from './players.js';

import hpManager from './hp-manager.js';
import {AppManager} from './app-manager.js';
import {scene, sceneHighPriority, sceneLowPriority, sceneLowerPriority, sceneLowestPriority} from './renderer.js';
import {appsMapName, worldMapName, playersMapName} from './constants.js';
import {playersManager} from './players-manager.js';

import physx from './physx.js';
import physxWorkerManager from './physx-worker-manager.js';

import logger from './logger.js';

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

    logger.log('World created');
  }

  isConnected() { return !!this.wsrtc; }

  getConnection() { return this.wsrtc; }

  // called by enterWorld() in universe.js
  // This is called in single player mode instead of connectRoom
  connectState(state) {
    logger.log('world.connectState')
    state.setResolvePriority(1);

    this.appManager.unbindStateLocal();
    this.appManager.clear();
    const worldMap = state.getMap(worldMapName);
    const appsArray = worldMap.get(appsMapName, Z.Array);

    this.appManager.bindState(appsArray);

    playersManager.unbindState();
    playersManager.bindState(state.getArray(playersMapName));

    const localPlayer = getLocalPlayer();
    localPlayer.bindState(state.getArray(playersMapName));
  }

  // called by enterWorld() in universe.js
  // This is called when a user joins a multiplayer room
  // either from single player or directly from a link
  async connectRoom(u, state = new Z.Doc()) {
    logger.log('world.connectRoom')
    // Players cannot be initialized until the physx worker is loaded
    // Otherwise you will receive allocation errors because the module instance is undefined
    await physx.waitForLoad();
    await physxWorkerManager.waitForLoad();
    const localPlayer = getLocalPlayer();

    state.setResolvePriority(1);

    // Create a new instance of the websocket rtc client
    // This comes from webaverse/wsrtc/wsrtc.js
    this.wsrtc = new WSRTC(u, {
      localPlayer,
      crdtState: state,
    });

    // Handy debug function to see the state
    // Delete this eventually. For now press escape to see world state
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        console.log(state.getArray('world'));
        console.log(state.getArray('players'));
      }
    });

    // This is called when the websocket connection opens, i.e. server is connectedw
    const open = e => {
      logger.log('wsrtc.open');
      this.wsrtc.removeEventListener('open', open);
      // Clear the last world state
      const worldMap = state.getMap(worldMapName);
      const appsArray = worldMap.get(appsMapName, Z.Array);
      // Bind the new state
      this.appManager.bindState(appsArray);
      // Clear the player state
      playersManager.unbindState();

      const init = e => {
        logger.log('wsrtc.init');
        this.wsrtc.removeEventListener('init', init);
        localPlayer.bindState(state.getArray(playersMapName));
        playersManager.bindState(state.getArray(playersMapName));

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
    logger.log('world.disconnectRoom')
    this.wsrtc?.close();
    this.appManager.unbindState();
    this.appManager.clear();
    this.wsrtc = null;
  }

  update(timestamp, timeDiffCapped, frame) {
    this.appManager.tick(timestamp, timeDiffCapped, frame);
    this.appManager.update(timestamp, timeDiffCapped, frame);
  }
}

export const world = new World();
