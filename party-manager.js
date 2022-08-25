import * as THREE from 'three';

import {AppManager} from './app-manager.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import {playersManager} from './players-manager.js';
import {appsMapName} from './constants.js'

const localVector = new THREE.Vector3();

const physicsScene = physicsManager.getScene();

class PartyManager extends EventTarget {
  constructor() {
    super();
    
    this.partyPlayers = [];
    this.removeFns = [];

    this.appManager = new AppManager();
  }

  switchCharacter() {
    // switch to next character
    if (this.partyPlayers.length >= 2) {
      const headPlayer = this.partyPlayers[0];
      const nextPlayer = this.partyPlayers[1];

      headPlayer.isLocalPlayer = false;
      headPlayer.isNpcPlayer = true;

      nextPlayer.isLocalPlayer = true;
      nextPlayer.isNpcPlayer = false;

      
      const transplantToParty = () => {
        // transplant apps to party
        const localPlayer = headPlayer;
        for (let i = 0; i < this.partyPlayers.length; i++) {
          const player = this.partyPlayers[i];
          if (localPlayer.playerId !== player.playerId) {
            this.transplantPartyAppToParty(player.npcApp, localPlayer);
          }
        }
      };
      transplantToParty();
      this.partyPlayers.shift();

      headPlayer.deletePlayerId(headPlayer.playerId);

      playersManager.setLocalPlayer(nextPlayer);

      this.dispatchEvent(new MessageEvent('playerdeselected', {
        data: {
          player: headPlayer,
        }
      }));
      this.dispatchEvent(new MessageEvent('playerselected', {
        data: {
          player: nextPlayer,
        }
      }));

      nextPlayer.updatePhysicsStatus();
      headPlayer.updatePhysicsStatus();

      this.partyPlayers.push(headPlayer);

      // transplant players to local player
      const transplantToPlayer = () => {
        const localPlayer = playersManager.getLocalPlayer();
        for (let i = 0; i < this.partyPlayers.length; i++) {
          const player = this.partyPlayers[i];
          if (localPlayer.playerId !== player.playerId) {
            this.transplantPartyAppToPlayer(player.npcApp, localPlayer);
          }
        }
      };
      transplantToPlayer();

      return true;
    } else {
      return false;
    }
  }

  // add new player to party
  addPlayer(newPlayer) {
    
    if (this.partyPlayers.length < 3) { // 3 max members
      // console.log('addPlayer', newPlayer, this);
      this.partyPlayers.push(newPlayer);

      if (this.partyPlayers.length === 1) {
        this.dispatchEvent(new MessageEvent('playerselected', {
          data: {
            player: newPlayer,
          }
        }));
      }

      const removeFn = () => {
        // console.log('removeFn', player);
        const player = newPlayer;
        const playerIndex = this.partyPlayers.indexOf(player);
        if (playerIndex > 0) {
          this.transplantPartyAppToWorld(player.npcApp);
          this.partyPlayers.splice(playerIndex, 1);
          player.isInParty = false;
          return true;
        }
        return false;
      };

      this.removeFns.push(removeFn);
      
      newPlayer.isInParty = true;

      const activate = () => {
        // console.log('deactivate', newPlayer.name);
        if (removeFn()) {
          const removeIndex = this.removeFns.indexOf(removeFn);
          if (removeIndex !== -1) {
            this.removeFns.splice(removeIndex, 1);
          }
          newPlayer.removeEventListener('activate', activate);
        }
      };
      newPlayer.addEventListener('activate', activate);

      if (this.partyPlayers.length >= 2) {
        const headPlayer = this.partyPlayers[0];
        this.transplantWorldAppToPlayer(newPlayer.npcApp, headPlayer);
      }

      return true;
    }
    return false;
  }

  getTargetPlayer(player) {
    const playerIndex = this.partyPlayers.indexOf(player);
    if (playerIndex > 0) {
      return this.partyPlayers[playerIndex - 1];
    }
    return null;
  }

  bindState(appsMap) {
    appsMap.set(appsMapName, this.appManager.appsArray);
  }

  transplantApp(app, srcAppManager, dstAppManager) {
    if (srcAppManager.hasTrackedApp(app.instanceId)) {
      srcAppManager.transplantApp(app, dstAppManager);
    } else {
      throw new Error('transplant unowned app');
    }
  }

  transplantWorldAppToPlayer(app, headPlayer) {
    this.transplantApp(app, world.appManager, headPlayer.appManager);
  }

  transplantPartyAppToPlayer(app, headPlayer) {
    this.transplantApp(app, this.appManager, headPlayer.appManager);
  }

  transplantPartyAppToWorld(app) {
    const headPlayer = this.partyPlayers[0];
    this.transplantApp(app, headPlayer.appManager, world.appManager);
  }

  transplantPartyAppToParty(app, localPlayer) {
    this.transplantApp(app, localPlayer.appManager, this.appManager);
  }

  clear() {
    // console.log('clear');
    const removedFns = this.removeFns.filter(removeFn => removeFn());
    for (const removedFn of removedFns) {
      const removeIndex = this.removeFns.indexOf(removedFn);
      if (removeIndex !== -1) {
        this.removeFns.splice(removeIndex, 1);
      }
    }
  }
}

const partyManager = new PartyManager();
export {
    partyManager
};