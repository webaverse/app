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
    this.targetMap = new Map();
    this.onFrameMap = new Map();

    const partychange = () => {
      // queue all party members to follow main player in a line
      const localPlayer = playersManager.getLocalPlayer();
      let headPlayer = localPlayer;
      for(const partyPlayer of this.partyPlayers) {
        this.#setFollowTarget(partyPlayer, headPlayer);
        headPlayer = partyPlayer;
      }
    }

    this.addEventListener('partychange', partychange);

    this.cleanup = () => {
      this.removeEventListener('partychange', partychange);
    }
  }

  destroy() {
    this.cleanup();
    for (const player of this.partyPlayers) {
      this.#removePartyPlayer(player);
    }
  }

  // switch to next character and returns main character
  switchCharacter() {
    const localPlayer = playersManager.getLocalPlayer();
    
    if (this.partyPlayers.length != 0) {
      const nextPlayer = this.partyPlayers.shift();

      localPlayer.isLocalPlayer = false;
      localPlayer.isNpcPlayer = true;

      nextPlayer.isLocalPlayer = true;
      nextPlayer.isNpcPlayer = false;

      nextPlayer.updatePhysicsStatus();
      localPlayer.updatePhysicsStatus();

      this.#setFollowTarget(nextPlayer, null);

      this.partyPlayers.push(localPlayer);

      return nextPlayer;
    }
    return null;
  }

  // add new player to party
  addPartyPlayer(newPlayer) {
    const localPlayer = playersManager.getLocalPlayer();

    if (this.partyPlayers.length < 2) { // 3 max members
      this.#setFollowTarget(newPlayer, localPlayer);
      this.partyPlayers.push(newPlayer);
      newPlayer.isNpcInParty = true;

      let activated = false;
      const activate = () => {
        if(!activated) {
          activated = true;
        }
        else {
          // console.log('deactivate', newPlayer.name);

          this.#removePartyPlayer(newPlayer);
          
          newPlayer.removeEventListener('activate', activate);
          
          this.dispatchEvent(new MessageEvent('partychange'));
        }
      };

      newPlayer.addEventListener('activate', activate);

      return true;
    }
    return false;
  }

  #removePartyPlayer(player) {
    const playerIndex = this.partyPlayers.indexOf(player);
    if (!player.isMainPlayer && playerIndex !== -1) {
      this.#setFollowTarget(player, null);
      this.partyPlayers.splice(playerIndex, 1);
      player.isNpcInParty = false;
      return true;
    }
    return false;
  }

  // player follows target after this call
  // if target is null, it stops following
  #setFollowTarget(newPlayer, targetPlayer) {
    const targetObj = this.targetMap.get(newPlayer.getInstanceId());
    
    if(targetObj) {
      // remove previous target
      this.targetMap.delete(newPlayer.getInstanceId());

      const onFrame = this.onFrameMap.get(newPlayer.getInstanceId());
      world.appManager.removeEventListener('frame', onFrame);
    }

    if (targetPlayer) {
      // console.log(newPlayer.name, '--->', targetPlayer.name);
      this.targetMap.set(newPlayer.getInstanceId(), targetPlayer);

      const slowdownFactor = 0.4;
      const walkSpeed = 0.075 * slowdownFactor;
      const runSpeed = walkSpeed * 8;
      const speedDistanceRate = 0.07;
      const frame = e => {
        if (physicsScene.getPhysicsEnabled()) {
          const {timestamp, timeDiff} = e.data;
          const targetPlayer = this.targetMap.get(newPlayer.getInstanceId());
          
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

      this.onFrameMap.set(newPlayer.getInstanceId(), frame);
      world.appManager.addEventListener('frame', frame);
    }
  }
}

const partyManager = new PartyManager();
export {
    partyManager
};
