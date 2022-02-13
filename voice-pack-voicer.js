/* this is the fake speech synthesis module.
it is responsible for playing Banjo-Kazooie style character speech. */

import Avatar from './avatars/avatars.js';
import {loadAudioBuffer, makePromise} from './util.js';
import {chatTextSpeed} from './constants.js';

function weightedRandom(weights) {
	let totalWeight = 0;
	for (let i = 0; i < weights.length; i++) {
		totalWeight += weights[i];
	}

	let random = Math.random() * totalWeight;
	for (let i = 0; i < weights.length; i++) {
		if (random < weights[i]) {
			return i;
		}
		random -= weights[i];
	}

	return -1;
}

class VoicePack {
  constructor(syllableFiles, audioBuffer) {
    this.syllableFiles = syllableFiles;
    this.audioBuffer = audioBuffer;
  }
  static async load({
    audioUrl,
    indexUrl,
  }) {
    const audioContext = Avatar.getAudioContext();
    const [
      syllableFiles,
      audioBuffer,
    ] = await Promise.all([
      (async () => {
        const res = await fetch('https://webaverse.github.io/shishi-voicepack/syllables/syllable-files.json');
        const j = await res.json();
        return j;
      })(),
      loadAudioBuffer(audioContext, 'https://webaverse.github.io/shishi-voicepack/syllables/syllables.mp3'),
    ]);
    const voicePack = new VoicePack(syllableFiles, audioBuffer);
    return voicePack;
  }
}
class VoicePackVoicer {
  constructor(syllableFiles, audioBuffer, player) {
    this.syllableFiles = syllableFiles;
    this.audioBuffer = audioBuffer;
    this.voices = syllableFiles.map(({name, offset, duration}) => {
      return {
        name,
        offset,
        duration,
        nonce: 0,
      };
    });
    this.nonce = 0;
    this.player = player;

    this.startTime = -1;
    this.charactersSinceStart = 0;
    this.audioTimeout = null;
    this.endTimeout = null;
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
    return voiceSpec;
  }
  clearTimeouts() {
    clearTimeout(this.timeout);
    this.timeout = null;
    clearTimeout(this.endTimeout);
    this.endTimeout = null;
  }
  resetStart() {
    this.startTime = -1;
    this.charactersSinceStart = 0;
  }
  preloadMessage(text) {
    // voice pack does not need loading
    return text;
  }
  start(text) {
    this.clearTimeouts();

    const now = performance.now();
    if (this.startTime === -1) {
      this.startTime = now;
    }
    this.charactersSinceStart += text.length;

    this.player.avatar.setAudioEnabled(true);

    const p = makePromise();
    const _recurse = async () => {
      const {offset, duration} = this.selectVoice();

      const audioContext = Avatar.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = this.audioBuffer;
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
      audioBufferSourceNode.start(0, offset, duration);
      let audioTime = duration * 1000;
      audioTime *= 0.9 + 0.2 * Math.random();
      this.audioTimeout = setTimeout(() => {
        _recurse();
      }, audioTime);
    };
    _recurse();

    const fullTextTime = this.charactersSinceStart * chatTextSpeed;
    const remainingTextTime = fullTextTime - (now - this.startTime);
    this.endTimeout = setTimeout(() => {
      this.clearTimeouts();
      this.resetStart();

      p.accept();
    }, remainingTextTime);

    return p;
  }
  stop() {
    this.clearTimeouts();
  }
}

export {
  VoicePack,
  VoicePackVoicer,
};