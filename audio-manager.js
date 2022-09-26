import {getAudioContext} from 'wsrtc/ws-audio-context.js';

class AudioManager {
  constructor() {
    this.setAudioContext(getAudioContext());
    this.audioContext.gain = this.audioContext.createGain();
    this.audioContext.gain.connect(this.audioContext.destination);
    this.audioContext.audioWorklet.addModule('avatars/microphone-worklet.js');
  }

  getAudioContext() {
    return getAudioContext();
  }

  setAudioContext(newAudioContext) {
    this.audioContext = newAudioContext;
  }

  setVolume(volume) {
    this.audioContext.gain.gain.value = volume;
  }

  playBuffer(audioBuffer) {
    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(this.audioContext.destination);
    sourceNode.start();
  }
}
export default new AudioManager();
