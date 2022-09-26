/* this is the character heads up player implementation.
it controls the animated dioramas that happen when players perform actions.
the HTML part of this code lives as part of the React app. */

// import * as THREE from 'three';
// import metaversefile from 'metaversefile';
import {chatManager} from './chat-manager.js';

const deadTimeoutTime = 2000;

let nextHupId = 0;
class Hup extends EventTarget {
  constructor(type, parent) {
    super();

    this.type = type;
    this.parent = parent;
    this.hupId = ++nextHupId;

    this.actionIds = [];
    this.characterName = '';
    this.fullText = '';
    this.emote = null;
    this.live = false;
    this.deadTimeout = null;
  }

  static isHupAction(action) {
    return action.type === 'chat';
  }

  mergeAction(action) {
    const {characterName, message, emote} = action;
    if (characterName) {
      this.characterName = characterName;
    }

    this.actionIds.push(action.actionId);

    this.clearDeadTimeout();

    // this.dispatchEvent(new MessageEvent('update'));
  }

  async updateVoicer(message, emote) {
    // this.parent.player === metaversefile.useLocalPlayer() && console.log('emit voice start');
    this.dispatchEvent(new MessageEvent('voicequeue', {
      data: {
        message,
      },
    }));
    const preloadedMessage = this.parent.character.voicer.preloadMessage(message);
    await chatManager.waitForVoiceTurn(() => {
      if (message) {
        if (this.fullText.length > 0) {
          this.fullText += '\n';
        }
        this.fullText += message;
      }
      this.emote = emote ?? null;

      this.dispatchEvent(new MessageEvent('voicestart', {
        data: {
          message,
          fullText: this.fullText,
        },
      }));
      return this.parent.character.voicer.start(preloadedMessage);
    });
    // this.parent.player === metaversefile.useLocalPlayer() && console.log('emit voice end');
    this.dispatchEvent(new MessageEvent('voiceend', {
      data: {
        fullText: this.fullText,
      },
    }));
  }

  unmergeAction(action) {
    const index = this.actionIds.indexOf(action.actionId);
    if (index !== -1) {
      this.actionIds.splice(index, 1);
    }
  }

  clearDeadTimeout() {
    if (this.deadTimeout) {
      clearTimeout(this.deadTimeout);
      this.deadTimeout = null;
    }
  }

  startDeadTimeout() {
    this.clearDeadTimeout();
    this.deadTimeout = setTimeout(() => {
      this.dispatchEvent(new MessageEvent('deadtimeout'));
    }, deadTimeoutTime);
  }

  destroy() {
    this.dispatchEvent(new MessageEvent('destroy'));
  }
}
export class CharacterHups extends EventTarget {
  constructor(character) {
    super();

    this.character = character;

    this.hups = [];

    this.character.addEventListener('actionadd', e => {
      const {action} = e;
      const {type, actionId} = action;
      // console.log('action add', action);

      const oldHup = this.hups.find(hup => hup.type === type);
      // console.log('got old hup', oldHup, actionId, this.hups.map(h => h.actionIds).flat());
      if (oldHup) {
        oldHup.mergeAction(action);
        oldHup.updateVoicer(action.message, action.emote);
      } else if (Hup.isHupAction(action)) {
        const newHup = new Hup(action.type, this);
        newHup.mergeAction(action);
        let pendingVoices = 0;
        newHup.addEventListener('voicequeue', () => {
          pendingVoices++;
          newHup.clearDeadTimeout();
        });
        newHup.addEventListener('voiceend', () => {
          if (--pendingVoices === 0) {
            newHup.startDeadTimeout();
          }
        });
        newHup.addEventListener('deadtimeout', () => {
          newHup.destroy();

          const index = this.hups.indexOf(newHup);
          this.hups.splice(index, 1);

          this.dispatchEvent(new MessageEvent('hupremove', {
            data: {
              character,
              hup: newHup,
            },
          }));
        });
        this.hups.push(newHup);
        this.dispatchEvent(new MessageEvent('hupadd', {
          data: {
            character,
            hup: newHup,
          },
        }));
        newHup.updateVoicer(action.message, action.emote);
      }
    });
    this.character.addEventListener('actionremove', e => {
      const {action} = e;
      const {actionId} = action;
      // console.log('action remove', action);

      const oldHup = this.hups.find(hup => hup.actionIds.includes(actionId));
      if (oldHup) {
        oldHup.unmergeAction(action);
      }
    });
  }

  addChatHupAction(text) {
    this.character.addAction({
      type: 'chat',
      text,
    });
  }

  update(timestamp) {
    // nothing
  }

  destroy() {
    // nothing
  }
}
