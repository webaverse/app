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
    this.fullText = '';
    this.emote = null;
    this.lastTimestamp = 0;

    this.open = false;

    if (this.parent.voicer) {
      this.parent.voicer.start();
    }
  }
  static isHupAction(action) {
    return action.type === 'chat';
  }
  mergeAction(action) {
    const {message, emote} = action;
    if (message) {
      this.fullText += message;
    }
    this.emote = emote ?? null;
    this.lastTimestamp = performance.now();
  
    this.actionIds.push(action.actionId);

    this.dispatchEvent(new MessageEvent('update'));
  }
  setOpen(open) {
    this.open = open;
    this.dispatchEvent(new MessageEvent('open', {
      data: {
        open,
      },
    }));
  }
  destroy() {
    // console.warn('destroy hup', this);
    this.parent.voicer.stop();
  }
}

class CharacterHups extends EventTarget {
  constructor(player) {
    super();
    
    this.player = player;

    this.hups = [];

    this.update();
  }
  update() {
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
        return true;
      } else {
        hup.destroy();
        this.dispatchEvent(new MessageEvent('hupremove', {
          data: {
            hup,
          },
        }));
      }
      return false;
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
  setVoicePack(voices) {
    this.voicer = new Voicer(voices);
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
