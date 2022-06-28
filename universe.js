/*
this file contains the universe/meta-world/scenes/multiplayer code.
responsibilities include loading the world on url change.
*/

// import * as THREE from 'three';
import * as Z from 'zjs';
import WSRTC from 'wsrtc/wsrtc.js';
import metaversefile from 'metaversefile';

import sceneNames from './scenes/scenes.json';
import {world} from './world.js';
import physicsManager from './physics-manager.js';
import {loadOverworld} from './overworld.js';
import {parseQuery} from './util.js';
import {getLocalPlayer} from './players.js';
import {initialPosY, playersMapName} from './constants.js';
import {playersManager} from './players-manager.js';
import physx from './physx.js';
import physxWorkerManager from './physx-worker-manager.js';

class Universe extends EventTarget {
  constructor() {
    super();
    this.wsrtc = null;

    this.currentWorld = null;
    this.sceneLoadedPromise = null;
  }

  getWorldsHost() {
    return window.location.protocol + '//' + window.location.hostname + ':' +
      ((window.location.port ? parseInt(window.location.port, 10) : (window.location.protocol === 'https:' ? 443 : 80)) + 1) + '/worlds/';
  }

  async enterWorld(worldSpec) {
    if (this.isConnected) this.disconnectRoom();

    const localPlayer = metaversefile.useLocalPlayer();
    localPlayer.position.set(0, initialPosY, 0);
    localPlayer.characterPhysics.reset();
    localPlayer.updateMatrixWorld();
    // physicsManager.setPhysicsEnabled(true);
    // localPlayer.updatePhysics(0, 0);
    physicsManager.setPhysicsEnabled(false);

    const _doLoad = async () => {
      const promises = [];
      const {src, room} = worldSpec;
      if (!room) {
        const state = new Z.Doc();
        this.connectState(state);

        let match;
        if (src === undefined) {
          promises.push(metaversefile.createAppAsync({
            start_url: './scenes/' + sceneNames[0],
          }));
        } else if (src === '') {
          // nothing
        } else if (match = src.match(/^weba:\/\/(-?[0-9\.]+),(-?[0-9\.]+)(?:\/|$)/i)) {
          const [, x, y] = match;
          const [x1, y1] = [parseFloat(x), parseFloat(y)];
          const p = loadOverworld(x1, y1);
          promises.push(p);
        } else {
          const p = metaversefile.createAppAsync({
            start_url: src,
          });
          promises.push(p);
        }
      } else {
        const p = (async () => {
          const roomUrl = this.getWorldsHost() + room;
          await this.connectRoom(roomUrl);
        })();
        promises.push(p);
      }

      this.sceneLoadedPromise = Promise.all(promises)
        .then(() => {});
      await this.sceneLoadedPromise;
      this.sceneLoadedPromise = null;
    };
    await _doLoad();

    localPlayer.characterPhysics.reset();
    physicsManager.setPhysicsEnabled(true);
    localPlayer.updatePhysics(0, 0);

    this.currentWorld = worldSpec;

    this.dispatchEvent(new MessageEvent('worldload'));
  }

  async reload() {
    await this.enterWorld(this.currentWorld);
  }

  async pushUrl(u) {
    history.pushState({}, '', u);
    window.dispatchEvent(new MessageEvent('pushstate'));
    await this.handleUrlUpdate();
  }

  async handleUrlUpdate() {
    const q = parseQuery(location.search);
    await this.enterWorld(q);
  }

  isSceneLoaded() {
    return !this.sceneLoadedPromise;
  }

  async waitForSceneLoaded() {
    if (this.sceneLoadedPromise) {
      await this.sceneLoadedPromise;
    } else {
      if (this.currentWorld) {
        // nothing
      } else {
        await new Promise((resolve) => {
          this.addEventListener('worldload', e => {
            resolve();
          }, {once: true});
        });
      }
    }
  }

  isConnected() { return !!this.wsrtc; }

  getConnection() { return this.wsrtc; }

  // called by enterWorld() in universe.js
  // This is called in single player mode instead of connectRoom
  connectState(state) {
    this.state = state;
    state.setResolvePriority(1);

    if (playersManager.isBound()) {
      playersManager.unbind();
    }
    playersManager.bindState(state.getArray(playersMapName));

    world.init(state);

    const localPlayer = getLocalPlayer();
    localPlayer.init(state);
  }

  // called by enterWorld() in universe.js
  // This is called when a user joins a multiplayer room
  // either from single player or directly from a link
  async connectRoom(u, state = new Z.Doc()) {
    this.state = state;
    state.setResolvePriority(1);

    // Players cannot be initialized until the physx worker is loaded
    // Otherwise you will receive allocation errors because the module instance is undefined
    await physx.waitForLoad();
    await physxWorkerManager.waitForLoad();

    const localPlayer = getLocalPlayer();

    if (playersManager.isBound()) {
      playersManager.unbind();
    }
    playersManager.bindState(state.getArray(playersMapName));

    // Create a new instance of the websocket rtc client
    // This comes from webaverse/wsrtc/wsrtc.js
    this.wsrtc = new WSRTC(u, {
      localPlayer,
      crdtState: state,
    });

    // This is called when the websocket connection opens, i.e. server is connectedw
    const open = e => {
      this.wsrtc.removeEventListener('open', open);

      // Called by WSRTC when the connection is initialized
      const init = e => {
        this.wsrtc.removeEventListener('init', init);

        world.init(state);
        localPlayer.init(state);

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

  // called by enterWorld() in universe.js, to make sure we aren't already connected
  disconnectRoom() {
    if (this.wsrtc && this.wsrtc.state === 'open') this.wsrtc.close();
    this.wsrtc = null;
  }
}
const universe = new Universe();

export default universe;
