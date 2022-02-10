/* this is the fake speech synthesis module.
it is responsible for playing Banjo-Kazooie style character speech. */

import Avatar from './avatars/avatars.js';
import {loadAudioBuffer} from './util.js';

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

    this.timeout = null;
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
  start() {
    clearTimeout(this.timeout);

    this.player.avatar.setAudioEnabled(true);

    const _recurse = async () => {
      const {offset, duration} = this.selectVoice();

      const audioContext = Avatar.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = this.audioBuffer;
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
      audioBufferSourceNode.start(0, offset, duration);
      // console.log('got audio', audio, audio.audioBuffer);
      // const audio = syllableSoundFiles[Math.floor(Math.random() * syllableSoundFiles.length)];
      /* if (audio.silencingInterval) {
        clearInterval(audio.silencingInterval);
        audio.silencingInterval = null;
      } */
      /* audio.currentTime = 0;
      audio.volume = 1;
      audio.paused && audio.play().catch(err => {}); */
      let audioTimeout = duration * 1000;
      audioTimeout *= 0.9 + 0.2 * Math.random();
      this.timeout = setTimeout(() => {
        // await audio.pause();
  
        /* audio.silencingInterval = setInterval(() => {
          audio.volume = Math.max(audio.volume - 0.1, 0);
          if (audio.volume === 0) {
            clearInterval(audio.silencingInterval);
            audio.silencingInterval = null;
          }
        }, 10); */
  
        _recurse();
      }, audioTimeout);
    };
    _recurse();
  }
  stop() {
    clearTimeout(this.timeout);
  }
}

export {
  VoicePack,
  VoicePackVoicer,
};