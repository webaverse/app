/* this is the fake speech synthesis module.
it is responsible for playing Banjo-Kazooie style character speech. */

import Avatar from './avatars/avatars.js';
// import {loadAudio} from './util.js';

class VoiceEndpoint {
  constructor(url) {
    this.url = new URL(url, import.meta.url);
  }
}
class VoiceEndpointVoicer {
  constructor(voiceEndpoint, player) {
    this.voiceEndpoint = voiceEndpoint;
    this.player = player;

    this.live = true;
    this.cancel = null;
  }
  start(text) {
    clearTimeout(this.timeout);

    this.player.avatar.setAudioEnabled(true);

    (async () => {
      const u = new URL(this.voiceEndpoint.url.toString());
      u.searchParams.set('s', text);
      const res = await fetch(u/*, {
        mode: 'cors',
      } */);
      const arrayBuffer = await res.arrayBuffer();

      const audioContext = Avatar.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = audioBuffer;
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
      audioBufferSourceNode.start();
    })();
  }
  stop() {
    this.live = false;
    if (this.cancel) {
      this.cancel();
      this.cancel = null;
    }
  }
}

export {
  VoiceEndpoint,
  VoiceEndpointVoicer,
};