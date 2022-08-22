// import * as THREE from 'three';
// import metaversefile from 'metaversefile'
import {partyManager} from './party-manager';
import {playersManager} from './players-manager';

class AvatarManager extends EventTarget {
  constructor() {
    super();

    this.cleanup = null;

    const playerSelectedFn = e => {
      const {
        player,
      } = e.data;

      this.bindPlayer(player);
    };

    const playerDeselectedFn = e => {
      const {
        player,
      } = e.data;

      this.unbindPlayer(player);
    };

    partyManager.addEventListener('playerselected', playerSelectedFn);
    partyManager.addEventListener('playerdeselected', playerDeselectedFn);
    this.removeListenerFn = () => {
      partyManager.removeEventListener('playerselected', playerSelectedFn);
      partyManager.removeEventListener('playerdeselected', playerDeselectedFn);
    };

    // this is the initial event for the first player
    const localPlayer = playersManager.getLocalPlayer();
    this.bindPlayer(localPlayer);
  }
  
  bindPlayer(player) {
    this.player = player;
    
    // forward player messages on player change
    const avatarchange = e => {
      this.dispatchEvent(new MessageEvent('avatarchange', {
        data: e,
      }));
    };
    player.addEventListener('avatarchange', avatarchange);
    
    const actionupdate = e => {
      this.dispatchEvent(new MessageEvent('actionupdate', {
        data: e,
      }));
    };
    player.addEventListener('actionadd', actionupdate);
    player.addEventListener('actionremove', actionupdate);

    this.cleanup = () => {
      player.removeEventListener('avatarchange', avatarchange);
      player.removeEventListener('actionadd', actionupdate);
      player.removeEventListener('actionremove', actionupdate);
    };

    this.dispatchEvent(new MessageEvent('playerselected', {
      data: {
        player: player,
      },
    }));
  }

  unbindPlayer(player) {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
  destroy() {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    this.removeListenerFn();
  }
}
const avatarManager = new AvatarManager();
export {
    avatarManager
};
