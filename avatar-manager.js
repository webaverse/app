/*
avatar manager forwards avatar related events from local player
this is an utility class, to smoothly support same interface
even when local player is changed on party player switch
*/
import {playersManager} from './players-manager';

class AvatarManager extends EventTarget {
  constructor() {
    super();

    this.cleanup = null;

    const playerSelectedFn = e => {
      const {
        oldplayer,
        player,
      } = e.data;

      if (oldplayer) {
        this.unbindPlayer(oldplayer);
      }
      this.bindPlayer(player);
    };

    playersManager.addEventListener('playerchange', playerSelectedFn);
    this.removeListenerFn = () => {
      playersManager.removeEventListener('playerchange', playerSelectedFn);
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
    const actionadd = e => {
      this.dispatchEvent(new MessageEvent('actionadd', {
        data: e,
      }));
    };
    const actionremove = e => {
      this.dispatchEvent(new MessageEvent('actionremove', {
        data: e,
      }));
    };
    player.addEventListener('actionadd', actionupdate);
    player.addEventListener('actionadd', actionadd);
    player.addEventListener('actionremove', actionupdate);
    player.addEventListener('actionremove', actionremove);

    this.cleanup = () => {
      player.removeEventListener('avatarchange', avatarchange);
      player.removeEventListener('actionadd', actionupdate);
      player.removeEventListener('actionremove', actionupdate);
      player.removeEventListener('actionadd', actionadd);
      player.removeEventListener('actionremove', actionremove);
    };
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
