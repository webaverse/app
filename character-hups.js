/* this is the character heads up player implementation.
it controls the animated dioramas that happen when players perform actions.
the HTML part of this code lives as part of the React app. */

// import * as THREE from 'three';
import {Voicer} from './voicer.js';

let nextHupId = 0;
class Hup extends EventTarget {
  constructor(type, parent) {
    super();
    
    this.type = type;
    this.parent = parent;
    this.hupId = ++nextHupId;

    this.actionIds = [];
    this.playerName = '';
    this.fullText = '';
    this.emote = null;
    this.live = false;
    this.lastTimestamp = 0;
  }
  static isHupAction(action) {
    return action.type === 'chat';
  }
  mergeAction(action) {
    const {playerName, message, emote} = action;
    if (playerName) {
      this.playerName = playerName;
    }
    if (message) {
      this.fullText += message;
    }
    this.emote = emote ?? null;
  
    this.actionIds.push(action.actionId);

    this.dispatchEvent(new MessageEvent('update'));
  }
  setLive(live) {
    if (this.parent.voicer) {
      if (live && !this.live) {
        this.parent.voicer.start();
      } else if (this.live && !live) {
        this.parent.voicer.stop();
      }
    }
    this.live = live;
  }
  destroy() {
    this.dispatchEvent(new MessageEvent('destroy'));
  }
}

class CharacterHups extends EventTarget {
  constructor(player) {
    super();
    
    this.player = player;

    this.hups = [];

    this.update();
  }
  update(timestamp) {
    // let hups = [];
    const player = this.player;
    const actions = player.getActions();

    // remove old hups
    // console.log('hups remove old 1', this.hups.length, actions.length);
    this.hups = this.hups.filter(hup => {
      hup.actionIds = hup.actionIds.filter(actionId => {
        for (const action of actions) {
          if (action.actionId === actionId) {
            return true;
          }
        }
        return false;
      });

      if (hup.actionIds.length > 0) {
        hup.setLive(true);
        hup.lastTimestamp = timestamp;
        return true;
      } else {
        hup.setLive(false);

        const deadTime = timestamp - hup.lastTimestamp;
        // console.log('dead time', deadTime);
        if (deadTime > 1000) {
          hup.destroy();
          this.dispatchEvent(new MessageEvent('hupremove', {
            data: {
              hup,
            },
          }));
          return false;
        } else {
          return true;
        }
      }
    });
    // console.log('hups remove old 2', this.hups.length);

    // add new hups
    for (const action of actions) {
      // console.log('hups update 0', action.actionId);
      const oldHup = this.hups.find(hup => hup.type === action.type);
      if (oldHup) {
        // console.log('hups update 1', action.actionId, this.hups.map(hup => hup.actionId));
        if (!oldHup.actionIds.includes(action.actionId)) {
          oldHup.mergeAction(action);
        }
      } else {
        // console.log('hups update 2', action.actionId, this.hups.map(hup => hup.actionId));
        if (Hup.isHupAction(action)) {
          const newHup = new Hup(action.type, this);
          newHup.mergeAction(action);
          this.hups.push(newHup);
          this.dispatchEvent(new MessageEvent('hupadd', {
            data: {
              hup: newHup,
            },
          }));
        }
      }
    }
  }
  setVoicePack(syllableFiles, audioBuffer) {
    this.voicer = new Voicer(syllableFiles, audioBuffer, this.player);
  }
  addChatHupAction(text) {
    this.player.addAction({
      type: 'chat',
      text,
    });
  }
  addEmoteHupAction(emote) {
    this.player.addAction({
      type: 'emote',
      emote,
    });
  }
}

export {
  CharacterHups,
};
