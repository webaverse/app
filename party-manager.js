import * as THREE from 'three';

import physicsManager from './physics-manager.js';
import {world} from './world.js';
import {playersManager} from './players-manager.js';

const localVector = new THREE.Vector3();

const physicsScene = physicsManager.getScene();
const partyPlayers = [];

class PartyManager extends EventTarget {
  constructor() {
    super();

    this.removeFns = [];
  }

  switchCharacter() {
    // switch to next character
    if (partyPlayers.length >= 2) {
      const headPlayer = partyPlayers.shift();
      const nextPlayer = partyPlayers[0];

      headPlayer.isLocalPlayer = false;
      headPlayer.isNpcPlayer = true;

      nextPlayer.isLocalPlayer = true;
      nextPlayer.isNpcPlayer = false;

      nextPlayer.updatePhysicsStatus();
      headPlayer.updatePhysicsStatus();

      partyPlayers.push(headPlayer);

      playersManager.setLocalPlayer(nextPlayer);
    }
  }

  // add new player to party
  addPlayer(newPlayer) {
    // console.log('addPlayer', newPlayer);
    if (newPlayer.isMainPlayer && partyPlayers.length !== 0) {
      console.warn('main player should be single');
      debugger;
    }
    
    if (partyPlayers.length < 3) { // 3 max members
      partyPlayers.push(newPlayer);

      const getTargetPlayer = (player) => {
        const playerIndex = partyPlayers.indexOf(player);
        if (playerIndex > 0) {
          return partyPlayers[playerIndex - 1];
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
          const playerIndex = partyPlayers.indexOf(player);
          if (!player.isMainPlayer && playerIndex !== -1) {
            world.appManager.removeEventListener('frame', frame);
            partyPlayers.splice(playerIndex, 1);
            player.isNpcInParty = false;
            return true;
          }
          return false;
        };
      })(newPlayer);

      this.removeFns.push(removeFn);
      
      if (newPlayer.isNpcPlayer) {
        newPlayer.isNpcInParty = true;
      }

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

      return true;
    }
    return false;
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
