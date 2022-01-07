/* this is the character heads up player implementation.
it controls the animated dioramas that happen when players perform actions. */

import * as THREE from 'three';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

// const localOffset = new THREE.Vector3();
const localOffset2 = new THREE.Vector3();

// const localArray = [];
// const localVelocity = new THREE.Vector3();

// const zeroVector = new THREE.Vector3();
// const upVector = new THREE.Vector3(0, 1, 0);

class Vocalizer {
  constructor(voices) {
    this.voices = voices.map(voice => {
      return {
        voice,
        nonce: 0,
      };
    });
    this.nonce = 0;
  }
  selectVoice() {
    // the weight of each voice is proportional to the inverse of the number of times it has been used
    const maxNonce = this.voices.reduce((max, voice) => Math.max(max, voice.nonce), 0);
    const weights = this.voices.map(({nonce}) => {
      return 1 - (nonce / (maxNonce + 1));
    });
    const selectionIndex = weightedRandom(weights);
    const voiceSpec = this.voices[selectionIndex];
    voiceSpec.nonce++;
    while (this.voices.every(voice => voice.nonce > 0)) {
      for (const voiceSpec of this.voices) {
        voiceSpec.nonce--;
      }
    }
    return voiceSpec.voice;
  }
}
window.playVoice = async () => {
  await loadPromise;

  // play a random audio file, wait for it to finish, then recurse to play another
  const _recurse = async () => {
    // XXX this needs to be played by the player object
    const audio = voicer.selectVoice();
    if (audio.silencingInterval) {
      clearInterval(audio.silencingInterval);
      audio.silencingInterval = null;
    }
    audio.currentTime = 0;
    audio.volume = 1;
    if (audio.paused) {
      await audio.play();
    }
    const audioTimeout = audio.duration * 1000;
    setTimeout(async () => {
      // await audio.pause();

      audio.silencingInterval = setInterval(() => {
        audio.volume = Math.max(audio.volume - 0.1, 0);
        if (audio.volume === 0) {
          clearInterval(audio.silencingInterval);
          audio.silencingInterval = null;
        }
      }, 10);

      _recurse();
    }, audioTimeout);
    /* audio.addEventListener('ended', async () => {
      
    }, {once: true}); */
  };
  _recurse();
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
  setVocalizationsPack(voices) {
    this.vocalizer = new Vocalizer(voices);
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
