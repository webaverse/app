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
    this.onActivateMap = new Map();
    this.activateMap = new Map();
  }

  destroy() {
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

      this.#queueFollow(nextPlayer);

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

      this.#queueFollow(localPlayer);

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

      const localPlayer = playersManager.getLocalPlayer();
      this.#queueFollow(localPlayer);

      return true;
    }
    return false;
  }

  // queue all party members to follow main player in a line
  #queueFollow(mainPlayer) {
    let headPlayer = mainPlayer;
    for(const partyPlayer of this.partyPlayers) {
      this.#setFollowTarget(partyPlayer, headPlayer);
      headPlayer = partyPlayer;
    }
  }

  // player follows target after this call
  // if target is null, it stops following
  #setFollowTarget(newPlayer, targetPlayer) {
    const targetObj = this.targetMap.get(newPlayer.getInstanceId());
    if(targetObj) {
      this.targetMap.delete(newPlayer.getInstanceId());
      const onFrame = this.onFrameMap.get(newPlayer.getInstanceId());
      const onActivate = this.onActivateMap.get(newPlayer.getInstanceId());
      world.appManager.removeEventListener('frame', onFrame);
      newPlayer.removeEventListener('activate', onActivate);
    }

    if (targetPlayer) {
      {
        const activate = () => {
          if (!this.activateMap.has(newPlayer.getInstanceId())) {
            // ignore first 'activate' event
            this.activateMap.set(newPlayer.getInstanceId(), true);
          } else {
            this.activateMap.delete(newPlayer.getInstanceId());
            
            this.#removePartyPlayer(newPlayer);
          }
        };
        this.onActivateMap.set(newPlayer.getInstanceId(), activate);
        newPlayer.addEventListener('activate', activate);
      }

      {
        this.targetMap.set(newPlayer.getInstanceId(), targetPlayer);
        const slowdownFactor = 0.4;
        const walkSpeed = 0.075 * slowdownFactor;
        const runSpeed = walkSpeed * 8;
        const speedDistanceRate = 0.07;
        const frame = e => {
          if (physicsScene.getPhysicsEnabled()) {
            const {timestamp, timeDiff} = e.data;
  
            const targetObj = this.targetMap.get(newPlayer.getInstanceId());
            if (targetObj) {
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
              newPlayer.setTarget(targetObj);
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
}

const partyManager = new PartyManager();
export {
    partyManager
};
