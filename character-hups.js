/* this is the character heads up player implementation.
it controls the animated dioramas that happen when players perform actions.
the HTML part of this code lives as part of the React app. */

// import * as THREE from 'three';
import {VoicePack, VoicePackVoicer} from './voice-pack-voicer.js';
import {VoiceEndpoint, VoiceEndpointVoicer} from './voice-endpoint-voicer.js';

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
    this.deadTimeout = null;
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
      if (this.fullText.length > 0) {
        this.fullText += '\n';
      }
      this.fullText += message;
    }
    this.emote = emote ?? null;
  
    this.actionIds.push(action.actionId);

    const _updateVoicer = () => {
      if (this.parent.voicer) {
        this.parent.voicer.start(message);
      }
    };
    _updateVoicer();

    const _clearDeadTimeout = () => {
      if (this.deadTimeout) {
        clearTimeout(this.deadTimeout);
        this.deadTimeout = null;
      }
    };
    _clearDeadTimeout();

    this.dispatchEvent(new MessageEvent('update'));
  }
  unmergeAction(action) {
    const index = this.actionIds.indexOf(action.actionId);
    if (index !== -1) {
      this.actionIds.splice(index, 1);
    }
    if (this.actionIds.length === 0) {
      const _updateVoicer = () => {
        if (this.parent.voicer) {
          this.parent.voicer.stop();
        }
      };
      _updateVoicer();

      this.deadTimeout = setTimeout(() => {
        this.dispatchEvent(new MessageEvent('deadtimeout'));
      }, 2000);
    }
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

    player.addEventListener('actionadd', e => {
      const {action} = e;
      const {type, actionId} = action;
      // console.log('action add', action);

      const oldHup = this.hups.find(hup => hup.type === type);
      // console.log('got old hup', oldHup, actionId, this.hups.map(h => h.actionIds).flat());
      if (oldHup) {
        oldHup.mergeAction(action);
      } else if (Hup.isHupAction(action)) {
        const newHup = new Hup(action.type, this);
        newHup.mergeAction(action);
        newHup.addEventListener('deadtimeout', () => {
          newHup.destroy();

          const index = this.hups.indexOf(newHup);
          this.hups.splice(index, 1);
          
          this.dispatchEvent(new MessageEvent('hupremove', {
            data: {
              hup: newHup,
            },
          }));
        });
        this.hups.push(newHup);
        this.dispatchEvent(new MessageEvent('hupadd', {
          data: {
            hup: newHup,
          },
        }));
      }
    });
    player.addEventListener('actionremove', e => {
      const {action} = e;
      const {actionId} = action;
      console.log('action remove', action);

      const oldHup = this.hups.find(hup => hup.actionIds.includes(actionId));
      if (oldHup) {
        oldHup.unmergeAction(action);
      }
    });
  }
  setVoice(voice) {
    if (voice instanceof VoicePack) {
      const {syllableFiles, audioBuffer} = voice;
      this.voicer = new VoicePackVoicer(syllableFiles, audioBuffer, this.player);
    } else if (voice instanceof VoiceEndpoint) {
      this.voicer = new VoiceEndpointVoicer(voice, this.player);
    } else {
      throw new Error('invalid voice');
    }
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
  update(timestamp) {
    // nothing
  }
  destroy() {
    // nothing
  }
}

export {
  CharacterHups,
};
