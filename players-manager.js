/* player manager binds y.js data to player objects
player objects load their own avatar and apps using this binding */

// import * as THREE from 'three';
import {RemotePlayer} from './character-controller.js';
// import {getPlayerPrefix} from './util.js';
// import {playersMapName} from './constants.js';
import totumApi from 'totum';

class PlayersManager {
  constructor() {
    this.playersArray = null;
    
    this.remotePlayers = new Map();
    
    this.unbindStateFn = null;
  }
  getPlayersState() {
    return this.playersArray;
  }
  unbindState() {
    const lastPlayers = this.playersArray;
    if (lastPlayers) {
      this.unbindStateFn();
      this.playersArray = null;
      this.unbindStateFn = null;
    }
  }
  bindState(nextPlayersArray) {
    this.unbindState();
    
    this.playersArray = nextPlayersArray;
    
    if (this.playersArray) {
      const localPlayer = totumApi.useLocalPlayer();
      
      const playersObserveFn = e => {
        const {added, deleted, delta, keys} = e.changes;
        for (const item of added.values()) {
          const playerMap = item.content.type;
          const playerId = playerMap.get('playerId');
          
          if (playerId !== localPlayer.playerId) {
            // console.log('add player', playerId, this.playersArray.toJSON());
            
            const remotePlayer = new RemotePlayer({
              playerId,
              playersArray: this.playersArray,
            });
            this.remotePlayers.set(playerId, remotePlayer);
          }
        }
        // console.log('players observe', added, deleted);
        for (const item of deleted.values()) {
          // console.log('player remove 1', item);
          const playerId = item.content.type._map.get('playerId').content.arr[0]; // needed to get the old data
          // console.log('player remove 2', playerId, localPlayer.playerId);

          if (playerId !== localPlayer.playerId) {
            // console.log('remove player', playerId);
            
            const remotePlayer = this.remotePlayers.get(playerId);
            this.remotePlayers.delete(playerId);
            remotePlayer.destroy();
          }
        }
      };
      this.playersArray.observe(playersObserveFn);
      this.unbindStateFn = this.playersArray.unobserve.bind(this.playersArray, playersObserveFn);
    }
  }
  update(timestamp, timeDiff) {
    for (const remotePlayer of this.remotePlayers.values()) {
      remotePlayer.update(timestamp, timeDiff);
    }
  }
}
const playersManager = new PlayersManager();

export {
  playersManager,
};
