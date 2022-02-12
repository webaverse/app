/* this module is responsible for mapping a remote TTS endpoint to the character. */

import Avatar from './avatars/avatars.js';
import {makePromise} from './util.js';

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

    const p = makePromise();
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
      audioBufferSourceNode.addEventListener('ended', () => {
        this.cancel = null;
        p.accept();
      }, {once: true});
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
      audioBufferSourceNode.start();

      this.cancel = () => {
        audioBufferSourceNode.stop();
        audioBufferSourceNode.disconnect();

        this.cancel = null;
      };
    })();
    return p;
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