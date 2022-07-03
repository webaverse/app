/* player manager binds y.js data to player objects
player objects load their own avatar and apps using this binding */

import * as Z from 'zjs';
import {RemotePlayer} from './character-controller.js';
import {getLocalPlayer} from './players.js';
class PlayersManager {
  constructor() {
    this.playersArray = null;

    this.remotePlayers = new Map();
    this.remotePlayersByInteger = new Map();

    this.unbindStateFn = null;
  }

  getPlayersState() {
    return this.playersArray;
  }

  unbindState() {
    if (!this.playersArray) return; // console.warn('unbindState function called but playersArray was null');
    const playerSpecs = this.playersArray.toJSON();
    const nonLocalPlayerSpecs = playerSpecs.filter(p => {
      return p.playerId !== getLocalPlayer().playerId;
    });
    for (const nonLocalPlayer of nonLocalPlayerSpecs) {
      const remotePlayer = this.remotePlayers.get(nonLocalPlayer.playerId);
      if (remotePlayer) {
        console.log('Destroying remote player', remotePlayer);
        remotePlayer.destroy();
        this.remotePlayers.delete(nonLocalPlayer.playerId);
        this.remotePlayersByInteger.delete(nonLocalPlayer.playerIdInt);
      } else {
        throw new Error('No remote player to destroy');
      }
    }

    this.unbindStateFn();
    this.playersArray = null;
    this.unbindStateFn = null;
  }

  bindState(nextPlayersArray) {
    this.unbindState();

    this.playersArray = nextPlayersArray;

    if (!this.playersArray) return console.warn('Skipping bindState because playersArray is null');
    const localPlayer = getLocalPlayer();

    const playersObserveFn = e => {
      const {added, deleted} = e.changes;
      for (const item of added.values()) {
        let playerMap = item.content.type;
        if (playerMap.constructor === Object) {
          for (let i = 0; i < this.playersArray.length; i++) {
            const localPlayerMap = this.playersArray.get(i, Z.Map); // force to be a map
            if (localPlayerMap.binding === item.content.type) {
              playerMap = localPlayerMap;
              break;
            }
          }
        }

        const playerId = playerMap.get('playerId');
        const name = playerMap.get('name');

        if (playerId !== localPlayer.playerId) {
          const remotePlayer = new RemotePlayer({
            name,
            playerId,
            playersArray: this.playersArray,
          });
          this.remotePlayers.set(playerId, remotePlayer);
          this.remotePlayersByInteger.set(remotePlayer.playerIdInt, remotePlayer);

          remotePlayer.dispatchEvent({type: 'resetvoicer'});
        }
      }
      for (const item of deleted.values()) {
        const playerMap = item.content.type;
        const playerId = playerMap.get('playerId'); // needed to get the old data

        if (playerId !== localPlayer.playerId) {
          const remotePlayer = this.remotePlayers.get(playerId);
          this.remotePlayers.delete(playerId);
          this.remotePlayersByInteger.delete(remotePlayer.playerIdInt);
          remotePlayer.destroy();
        }
      }
    };
    this.playersArray.observe(playersObserveFn);
    this.unbindStateFn = this.playersArray.unobserve.bind(
      this.playersArray,
      playersObserveFn,
    );
  }
}
const playersManager = new PlayersManager();

export {playersManager};