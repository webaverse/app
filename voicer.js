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
  constructor(audios) {
    this.voices = audios.map(audio => {
      return {
        audio,
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
    return voiceSpec.audio;
  }
}

export {
  Voicer,
};