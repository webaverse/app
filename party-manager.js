import * as THREE from 'three';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import {playersManager} from './players-manager.js';

const localVector = new THREE.Vector3();

const physicsScene = physicsManager.getScene();
const frameFnMap = new Map();

class PartyManager extends EventTarget {
  constructor() {
    super();
    
    this.partyPlayers = [];
    this.targetMap = new Map();

    const partyupdate = () => {
      // queue all party members to follow main player in a line
      // console.log('partyupdate');
      const localPlayer = playersManager.getLocalPlayer();
      let headPlayer = localPlayer;
      for(const partyPlayer of this.partyPlayers) {
        this.#setFollowTarget(partyPlayer, headPlayer);
        headPlayer = partyPlayer;
      }
    };
    this.addEventListener('partyupdate', partyupdate);

    const switchcharacter = () => {
      // switch to next character
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

        playersManager.setLocalPlayer(nextPlayer);

        this.dispatchEvent(new MessageEvent('partyupdate'));
      }
    };
    this.addEventListener('switchcharacter', switchcharacter);

    const addplayer = (e) => {
      const {
        player
      } = e.data;
      this.#addPartyPlayer(player);
    };
    this.addEventListener('addplayer', addplayer);

    const removeplayer = (e) => {
      const {
        player
      } = e.data;
      this.#removePartyPlayer(player);
    };
    this.addEventListener('removeplayer', removeplayer);

    this.cleanup = () => {
      this.removeEventListener('partyupdate', partyupdate);
      this.removeEventListener('switchcharacter', switchcharacter);
      this.removeEventListener('addplayer', addplayer);
      this.removeEventListener('removeplayer', removeplayer);
    }
  }

  clear() {
    // console.log('clear');
    for (const player of this.partyPlayers) {
      this.#removePartyPlayer(player);
    }
  }

  destroy() {
    this.cleanup();
  }

  // add new player to party
  #addPartyPlayer(newPlayer) {
    // console.log('addPartyPlayer', newPlayer);
    const localPlayer = playersManager.getLocalPlayer();

    if (this.partyPlayers.length < 2) { // 3 max members
      this.#setFollowTarget(newPlayer, localPlayer);
      this.partyPlayers.push(newPlayer);
      newPlayer.isNpcInParty = true;

      const activate = () => {
        // console.log('deactivate', newPlayer.name);

        this.dispatchEvent(new MessageEvent('removeplayer', {
          data: {
            player: newPlayer,
          },
        }));
        
        newPlayer.removeEventListener('activate', activate);
        
        this.dispatchEvent(new MessageEvent('partyupdate'));
      };

      newPlayer.addEventListener('activate', activate);

      this.dispatchEvent(new MessageEvent('partyupdate'));

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

    const removeTarget = () => {
      this.targetMap.delete(newPlayer.getInstanceId());
      const onFrame = frameFnMap.get(newPlayer.getInstanceId());
      world.appManager.removeEventListener('frame', onFrame);
      frameFnMap.delete(newPlayer.getInstanceId());
    };

    const setTarget = () => {
      this.targetMap.set(newPlayer.getInstanceId(), targetPlayer);
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
