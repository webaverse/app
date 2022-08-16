import * as THREE from 'three';
import * as Z from 'zjs';

import physicsManager from './physics-manager.js';
import {world} from './world.js';
import {playersManager} from './players-manager.js';

const localVector = new THREE.Vector3();

const physicsScene = physicsManager.getScene();
const partyPlayers = [];
const targetMap = new Z.Map();
const frameFnMap = new Map();

class PartyManager extends EventTarget {
  constructor() {
    super();

    this.cleanup = () => {
    }
  }

  switchCharacter() {
    // switch to next character
    const localPlayer = playersManager.getLocalPlayer();
  
    if (partyPlayers.length != 0) {
      const nextPlayer = partyPlayers.shift();

      localPlayer.isLocalPlayer = false;
      localPlayer.isNpcPlayer = true;

      nextPlayer.isLocalPlayer = true;
      nextPlayer.isNpcPlayer = false;

      nextPlayer.updatePhysicsStatus();
      localPlayer.updatePhysicsStatus();

      this.#setFollowTarget(nextPlayer, null);

      partyPlayers.push(localPlayer);

      playersManager.setLocalPlayer(nextPlayer);

      this.#queueParty();
    }
  }

  // add new player to party
  addPlayer(newPlayer) {
    // console.log('addPartyPlayer', newPlayer);
    const localPlayer = playersManager.getLocalPlayer();

    if (partyPlayers.length < 2) { // 3 max members
      this.#setFollowTarget(newPlayer, localPlayer);
      partyPlayers.push(newPlayer);
      newPlayer.isNpcInParty = true;

      const activate = () => {
        // console.log('deactivate', newPlayer.name);

        this.#removePlayer(newPlayer);
        
        newPlayer.removeEventListener('activate', activate);
        
        this.#queueParty();
      };

      newPlayer.addEventListener('activate', activate);

      this.#queueParty();

      return true;
    }
    return false;
  }

  #queueParty() {
    // queue all party members to follow main player in a line
    // console.log('queueParty');
    const localPlayer = playersManager.getLocalPlayer();
    let headPlayer = localPlayer;
    for(const partyPlayer of partyPlayers) {
      this.#setFollowTarget(partyPlayer, headPlayer);
      headPlayer = partyPlayer;
    }
  }

  clear() {
    // console.log('clear');
    for (const player of partyPlayers) {
      this.#removePlayer(player);
    }
  }

  destroy() {
    this.cleanup();
  }

  #removePlayer(player) {
    const playerIndex = partyPlayers.indexOf(player);
    if (!player.isMainPlayer && playerIndex !== -1) {
      this.#setFollowTarget(player, null);
      partyPlayers.splice(playerIndex, 1);
      player.isNpcInParty = false;
      return true;
    }
    return false;
  }

  // player follows target after this call
  // if target is null, it stops following
  #setFollowTarget(newPlayer, targetPlayer) {
    const targetObj = targetMap.get(newPlayer.getInstanceId());

    const slowdownFactor = 0.4;
    const walkSpeed = 0.075 * slowdownFactor;
    const runSpeed = walkSpeed * 8;
    const speedDistanceRate = 0.07;
    const frame = e => {
      if (physicsScene.getPhysicsEnabled()) {
        const {timestamp, timeDiff} = e.data;
        const targetPlayer = targetMap.get(newPlayer.getInstanceId());
        
        if (targetPlayer) {
          // console.log('    ', newPlayer.name, '->', targetPlayer.name);
          const v = localVector.setFromMatrixPosition(targetPlayer.matrixWorld)
              .sub(newPlayer.position);
          v.y = 0;
          const distance = v.length();
          {
            const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
            v.normalize()
              .multiplyScalar(speed * timeDiff);
              newPlayer.characterPhysics.applyWasd(v);
          }
          newPlayer.setTarget(targetPlayer);
        }

        newPlayer.updatePhysics(timestamp, timeDiff);
        newPlayer.updateAvatar(timestamp, timeDiff);
      }
    };

    const removeTarget = () => {
      targetMap.delete(newPlayer.getInstanceId());
      const onFrame = frameFnMap.get(newPlayer.getInstanceId());
      world.appManager.removeEventListener('frame', onFrame);
      frameFnMap.delete(newPlayer.getInstanceId());
    };

    const setTarget = () => {
      targetMap.set(newPlayer.getInstanceId(), targetPlayer);
      world.appManager.addEventListener('frame', frame);
      frameFnMap.set(newPlayer.getInstanceId(), frame);
    };
    
    if(targetObj) {
      // remove previous target
      removeTarget();
    }

    if (targetPlayer) {
      // console.log(newPlayer.name, '--->', targetPlayer.name);
      setTarget();
    }
  }
}

const partyManager = new PartyManager();
export {
    partyManager
};
