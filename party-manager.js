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
  }

  destroy() {
    for (const player of this.partyPlayers) {
      this.#removePartyPlayer(player);
    }
  }

  // switch to next character and returns main character
  switchCharacter() {
    const localPlayer = playersManager.getLocalPlayer();
    
    if (this.partyPlayers.length == 0) {
        return null;
    }
    
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

  // add new player to party
  addPartyPlayer(newPlayer) {
    const localPlayer = playersManager.getLocalPlayer();

    if (this.partyPlayers.length == 2) {
      return false;
    }
    this.#setFollowTarget(newPlayer, localPlayer);
    this.partyPlayers.push(newPlayer);
    newPlayer.isNpcInParty = true;

    this.#queueFollow(localPlayer);

    return true;
  }

  #removePartyPlayer(player) {
    if (player.isMainPlayer) {
      return;
    }

    const removeIndex = this.partyPlayers.indexOf(player);
    if (removeIndex !== -1) {
      this.#setFollowTarget(player, null);
      this.partyPlayers.splice(removeIndex, 1);
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

  #getPlayerApp(player) {
    let avatarApp = player.avatar.app;
    if (!player.isMainPlayer) {
      avatarApp = player.npcApp;
    }
    return avatarApp;
  }

  // player follows target after this call
  // if target is null, it stops following
  #setFollowTarget(player, target) {
    let avatarApp = this.#getPlayerApp(player);

    if(player.targetSpec) {
      player.targetSpec = null;
      world.appManager.removeEventListener('frame', player.followFrame);
      avatarApp.removeEventListener('activate', player.activateFunc);
    }

    if (target) {
      {
        const activate = () => {
          this.#removePartyPlayer(player);
        };
        player.activateFunc = activate;
        avatarApp.addEventListener('activate', activate);
      }

      {
        player.targetSpec = {
            type: 'follow',
            object: target,
          };
          const slowdownFactor = 0.4;
          const walkSpeed = 0.075 * slowdownFactor;
          const runSpeed = walkSpeed * 8;
          const speedDistanceRate = 0.07;
          const frame = e => {
            if (physicsScene.getPhysicsEnabled()) {
              const {timestamp, timeDiff} = e.data;
              
              if (player.targetSpec) {
                const target = player.targetSpec.object;
                const v = localVector.setFromMatrixPosition(target.matrixWorld)
                  .sub(player.position);
                v.y = 0;
                const distance = v.length();
                {
                  const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
                  v.normalize()
                    .multiplyScalar(speed * timeDiff);
                    player.characterPhysics.applyWasd(v);
                }
                player.setTarget(target);
              }
    
              player.updatePhysics(timestamp, timeDiff);
              player.updateAvatar(timestamp, timeDiff);
            }
          };
          player.followFrame = frame;
          world.appManager.addEventListener('frame', frame);
      }
    }
  }
}

const partyManager = new PartyManager();
export {
    partyManager
};
