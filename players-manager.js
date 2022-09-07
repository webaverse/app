/* player manager binds y.js data to player objects
player objects load their own avatar and apps using this binding */

// import * as THREE from 'three';
import * as Z from 'zjs';
import {LocalPlayer, RemotePlayer} from './character-controller.js';
import {makeId} from './util.js';
import {initialPosY, playersMapName} from './constants.js';

class PlayersManager extends EventTarget {
  constructor() {
    super();
    this.playersArray = null;
    this.localPlayer = null;
    this.setLocalPlayer(this.#addLocalPlayer());

    this.remotePlayers = new Map();
    this.remotePlayersByInteger = new Map();
    this.unbindStateFn = null;
    this.removeListenerFn = null;
  }
  #addLocalPlayer() {
    const localPlayerId = makeId(5);
    const localPlayersArray = new Z.Doc().getArray(playersMapName);
    const localPlayer = new LocalPlayer({
      playerId: localPlayerId,
      playersArray: localPlayersArray,
    });
    localPlayer.position.y = initialPosY;
    localPlayer.updateMatrixWorld();

    return localPlayer;
  }
  getLocalPlayer () {
    return this.localPlayer;
  }
  setLocalPlayer(newLocalPlayer) {
    const oldPlayer = this.localPlayer;
    this.localPlayer = newLocalPlayer;
    this.dispatchEvent(new MessageEvent('playerchange', {
      data: {
        oldplayer: oldPlayer,
        player: this.localPlayer,
      }
    }));
  }
  getRemotePlayers(){
    return this.remotePlayers;
  }
  clearRemotePlayers() {
    const lastPlayers = this.playersArray;
    if (lastPlayers) {
      const playerSpecs = lastPlayers.toJSON();
      const nonLocalPlayerSpecs = playerSpecs.filter(p => {
        return p.playerId !== this.getLocalPlayer().playerId;
      });
      for (const nonLocalPlayer of nonLocalPlayerSpecs) {
        const remotePlayer = this.remotePlayers.get(nonLocalPlayer.playerId);
        remotePlayer.destroy();
        this.remotePlayers.delete(nonLocalPlayer.playerId);
        this.remotePlayersByInteger.delete(nonLocalPlayer.playerIdInt);
      }
    }
  }
  getPlayersState() {
    return this.playersArray;
  }
  unbindState() {
    if(this.unbindStateFn != null) {
      this.unbindStateFn();
    }
    if (this.removeListenerFn) {
      this.removeListenerFn();
    }
    this.playersArray = null;
    this.unbindStateFn = null;
    this.removeListenerFn = null;
  }
  bindState(nextPlayersArray) {
    this.unbindState();

    this.playersArray = nextPlayersArray;
    
    if (this.playersArray) {
      const playerSelectedFn = e => {
        const {
          player,
        } = e.data;
        player.bindState(this.playersArray);
      };

      this.addEventListener('playerchange', playerSelectedFn);
      this.removeListenerFn = () => {
        this.removeEventListener('playerchange', playerSelectedFn);
      }
      
      const playersObserveFn = e => {
        const localPlayer = this.localPlayer;
        const {added, deleted, delta, keys} = e.changes;
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
          
          if (playerId !== localPlayer.playerId) {
            // console.log('add player', playerId, this.playersArray.toJSON());
            
            const remotePlayer = new RemotePlayer({
              playerId,
              playersArray: this.playersArray,
            });
            this.remotePlayers.set(playerId, remotePlayer);
            this.remotePlayersByInteger.set(remotePlayer.playerIdInt, remotePlayer);
            this.dispatchEvent(new MessageEvent('playeradded', { data: { player: remotePlayer } }));
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
            this.remotePlayersByInteger.delete(remotePlayer.playerIdInt);
            remotePlayer.destroy();
            this.dispatchEvent(new MessageEvent('playerremoved', { data: { player: remotePlayer } }));
          }
        }
      };
      this.playersArray.observe(playersObserveFn);
      this.unbindStateFn = this.playersArray.unobserve.bind(this.playersArray, playersObserveFn);
    }
  }
  updateRemotePlayers(timestamp, timeDiff) {
    for (const remotePlayer of this.remotePlayers.values()) {
      remotePlayer.update(timestamp, timeDiff);
    }
  }
}
const playersManager = new PlayersManager();

export {
  playersManager,
};
