/* this is the fake speech synthesis module.
it is responsible for playing Banjo-Kazooie style character speech. */

import Avatar from './avatars/avatars.js';

function weightedRandom(weights) {
	var totalWeight = 0,
		i, random;

	for (i = 0; i < weights.length; i++) {
		totalWeight += weights[i];
	}

	random = Math.random() * totalWeight;

	for (i = 0; i < weights.length; i++) {
		if (random < weights[i]) {
			return i;
		}

		random -= weights[i];
	}

	return -1;
}

class Voicer {
  constructor(audios, player) {
    this.voices = audios.map(audio => {
      return {
        audio,
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
    return voiceSpec.audio;
  }
  start() {
    clearTimeout(this.timeout);

    this.player.avatar.setAudioEnabled(true);

    const _recurse = async () => {
      const audio = this.selectVoice();
      // console.log('connect', audio);

      const audioContext = Avatar.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = audio;
      /* audioBufferSourceNode.addEventListener('ended', () => {
        audioBufferSourceNode.disconnect();
      }, {once: true}); */

      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
      audioBufferSourceNode.start();
      // console.log('got audio', audio, audio.audioBuffer);
      // const audio = syllableSoundFiles[Math.floor(Math.random() * syllableSoundFiles.length)];
      /* if (audio.silencingInterval) {
        clearInterval(audio.silencingInterval);
        audio.silencingInterval = null;
      } */
      /* audio.currentTime = 0;
      audio.volume = 1;
      audio.paused && audio.play().catch(err => {}); */
      let audioTimeout = audio.duration * 1000;
      audioTimeout *= 0.8 + 0.4 * Math.random();
      this.timeout = setTimeout(async () => {
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
  Voicer,
};