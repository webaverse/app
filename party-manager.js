import * as THREE from 'three';

import physicsManager from './physics-manager.js';
import {world} from './world.js';
import {playersManager} from './players-manager.js';

const localVector = new THREE.Vector3();

const physicsScene = physicsManager.getScene();

class PartyManager extends EventTarget {
  constructor() {
    super();
    
    this.partyPlayers = [];
    this.removeFns = [];
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

      
      const transplantToWorld = () => {
        // transplant apps to world
        const localPlayer = headPlayer;
        for (let i = 0; i < this.partyPlayers.length; i++) {
          const player = this.partyPlayers[i];
          if (localPlayer.playerId !== player.playerId) {
            this.transplantAppToWorld(player.npcApp, localPlayer);
          }
        }
      };
      transplantToWorld();
      this.partyPlayers.shift();

      headPlayer.deleteState(headPlayer.playerId);

      playersManager.setLocalPlayer(nextPlayer);

      this.dispatchEvent(new MessageEvent('playerselected', {
        data: {
          player: nextPlayer,
        }
      }));

      nextPlayer.updatePhysicsStatus();
      headPlayer.updatePhysicsStatus();

      this.partyPlayers.push(headPlayer);

      // transplant npc's to player
      const transplantToLocal = () => {
        const localPlayer = playersManager.getLocalPlayer();
        for (let i = 0; i < this.partyPlayers.length; i++) {
          const player = this.partyPlayers[i];
          if (localPlayer.playerId !== player.playerId) {
            this.transplantAppToLocal(player.npcApp, localPlayer);
          }
        }
      };
      transplantToLocal();
    }
  }

  // add new player to party
  addPlayer(newPlayer) {
    
    if (this.partyPlayers.length < 3) { // 3 max members
      // console.log('addPlayer', newPlayer, this);
      this.partyPlayers.push(newPlayer);
      
      const getTargetPlayer = (player) => {
        const playerIndex = this.partyPlayers.indexOf(player);
        if (playerIndex > 0) {
          return this.partyPlayers[playerIndex - 1];
        }
        return null;
      };

      const frame = ((player) => {
        const slowdownFactor = 0.4;
        const walkSpeed = 0.075 * slowdownFactor;
        const runSpeed = walkSpeed * 8;
        const speedDistanceRate = 0.07;
        return (e) => {
          if (physicsScene.getPhysicsEnabled()) {
            const {timestamp, timeDiff} = e.data;
            const targetPlayer = getTargetPlayer(player);
            
            if (targetPlayer) {
              // console.log('    ', player.name, '->', targetPlayer.name);
              const v = localVector.setFromMatrixPosition(targetPlayer.matrixWorld)
                  .sub(player.position);
              v.y = 0;
              const distance = v.length();
              {
                const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
                v.normalize()
                  .multiplyScalar(speed * timeDiff);
                  player.characterPhysics.applyWasd(v);
              }
              player.setTarget(targetPlayer);
            }
    
            player.updatePhysics(timestamp, timeDiff);
            player.updateAvatar(timestamp, timeDiff);
          }
        };
      })(newPlayer);

      const removeFn = ((player) => {
        return () => {
          // console.log('removeFn', player);
          const playerIndex = this.partyPlayers.indexOf(player);
          if (playerIndex > 0) {
            world.appManager.removeEventListener('frame', frame);
            this.transplantAppToWorld(player.npcApp);
            this.partyPlayers.splice(playerIndex, 1);
            player.isInParty = false;
            return true;
          }
          return false;
        };
      })(newPlayer);

      this.removeFns.push(removeFn);
      
      newPlayer.isInParty = true;

      world.appManager.addEventListener('frame', frame);

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
        this.transplantAppToLocal(newPlayer.npcApp, headPlayer);
      }

      return true;
    }
    return false;
  }

  transplantAppToLocal(app, headPlayer) {
    if (world.appManager.hasTrackedApp(app.instanceId)) {
      world.appManager.transplantApp(app, headPlayer.appManager);
    } else {
      console.warn('need to transplant unowned app', app, world.appManager, headPlayer.appManager);
      debugger;
    }
  }

  transplantAppToWorld(app, localPlayer = null) {
    const headPlayer = localPlayer ? localPlayer : this.partyPlayers[0];
    if (headPlayer.appManager.hasTrackedApp(app.instanceId)) {
      headPlayer.appManager.transplantApp(app, world.appManager);
    } else {
      console.warn('need to transplant unowned app', app, world.appManager, headPlayer.appManager);
      debugger;
    }
  }

  clear() {
    // console.log('clear');
    for (const removeFn of this.removeFns) {
      if (removeFn()) {
        const removeIndex = this.removeFns.indexOf(removeFn);
        if (removeIndex !== -1) {
          this.removeFns.splice(removeIndex, 1);
        }
      }
    }
  }
}

const partyManager = new PartyManager();
export {
    partyManager
};
