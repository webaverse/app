/* player manager binds y.js data to player objects
player objects load their own avatar and apps using this binding */

// import * as THREE from 'three';
import * as Z from 'zjs';
import {RemotePlayer} from './character-controller.js';
import metaversefileApi from 'metaversefile';

class PlayersManager {
  constructor() {
    this.playersArray = null;
    this.unbindStateFn = null;
    this.remotePlayers = new Map();
  }

  isBound() {
    return !!this.playersArray;
  }

  getPlayersState() {
    return this.playersArray;
  }

  bindState(nextPlayersArray) {
    if (this.isBound()) throw new Error('Cannot bind player state when already bound');
    this.playersArray = nextPlayersArray;

    const localPlayer = metaversefileApi.useLocalPlayer();

    const playersObserveFn = (e, origin) => {
      if (origin === 'push') return; // ignore data push from local player
      return console.warn("Local player");
      const {added, deleted} = e.changes;
      for (const item of added.values()) {
        const playerMap = item.content.type;

        const playerId = playerMap.get('playerId');

        if (playerId !== localPlayer.playerId) {
          const remotePlayer = new RemotePlayer({
            playerId,
            playersArray: this.playersArray,
          });
          this.remotePlayers.set(playerId, remotePlayer);
        }
      }

      for (const item of deleted.values()) {
        if (item === 0) {
          console.warn('Received init message, ignore');
          continue;
        }
        const playerMap = item.content.type;
        const playerId = playerMap.get('playerId');

        if (playerId !== localPlayer.playerId) {
          const remotePlayer = this.remotePlayers.get(playerId);
          this.remotePlayers.delete(playerId);
          remotePlayer.destroy();
        }
      }
    };
    this.playersArray.observe(playersObserveFn);
    this.unbindStateFn = this.playersArray.unobserve.bind(this.playersArray, playersObserveFn);
  }

  unbindState() {
    if (!this.playersArray) return console.warn('Unbinding player state but not necessary');
    this.unbindStateFn();
    this.playersArray = null;
    this.unbindStateFn = null;
  }
}
const playersManager = new PlayersManager();

export {
  playersManager,
};
