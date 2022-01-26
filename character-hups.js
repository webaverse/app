/* this is the character heads up player implementation.
it controls the animated dioramas that happen when players perform actions. */

import * as THREE from 'three';
import {Voicer} from './voicer.js';
import Avatar from './avatars/avatars.js';
import {loadAudio} from './util.js';

const syllableSoundFileNames = (() => {
  const numFiles = 362;
  const files = Array(numFiles).fill(0).map((_, i) => `${i + 1}.wav`);
  return files;
})();

let syllableSoundFiles;
const loadPromise = (async () => {
  await Avatar.waitForLoad();

  const _loadSoundFiles = getUrlFn => function(fileNames) {
    return Promise.all(fileNames.map(fileName => loadAudio(getUrlFn(fileName))));
  };
  const _loadSyllableSoundFiles = _loadSoundFiles(fileName => {
    return `https://webaverse.github.io/shishi-voicepack/syllables/${fileName}`;
  });
  await Promise.all([
    _loadSyllableSoundFiles(syllableSoundFileNames).then(as => {
      syllableSoundFiles = as;
    }),
  ]);
})();
const waitForLoad = () => loadPromise;

window.playVoice = async () => {
  await loadPromise;

  const voicer = new Voicer(syllableSoundFiles);
  voicer.start();
  const audioTime = 2000 + 5000 * Math.random();
  setTimeout(() => {
    voicer.stop();
  }, audioTime);
};

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
  }
  static isHupAction(action) {
    return action.type === 'chat';
  }
  mergeAction(action) {
    const {text, emote} = action;
    if (text) {
      this.fullText += text;
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
  }
}

class CharacterHups extends EventTarget {
  constructor(player) {
    super();
    
    this.player = player;

    this.hups = [];
    this.voices = [];

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
  waitForLoad,
  CharacterHups,
};
