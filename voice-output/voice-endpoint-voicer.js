/* this module is responsible for mapping a remote TTS endpoint to the character. */

import Avatar from '../avatars/avatars.js';
import {makePromise} from '../util.js';

class VoiceEndpoint {
  constructor(url) {
    this.url = new URL(url, import.meta.url);
  }
}
class PreloadMessage {
  constructor(text, parent) {
    this.text = text;
    this.parent = parent;

    this.isPreloadMessage = true;
    this.loadPromise = this.parent.loadAudioBuffer(this.text);
  }
  waitForLoad() {
    return this.loadPromise;
  }
}
class VoiceEndpointVoicer {
  constructor(voiceEndpoint, player) {
    this.voiceEndpoint = voiceEndpoint;
    this.player = player;

    // this.live = true;
    this.running = false;
    this.queue = [];
    this.cancel = null;
    this.endPromise = null;
  }
  preloadMessage(text) {
    return new PreloadMessage(text, this);
  }
  async loadAudioBuffer(text) {
    const u = new URL(this.voiceEndpoint.url.toString());
    u.searchParams.set('s', text);
    const res = await fetch(u/*, {
      mode: 'cors',
    } */);
    const arrayBuffer = await res.arrayBuffer();

    const audioContext = Avatar.getAudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }
  start(text) {
    if (!this.endPromise) {
      this.endPromise = makePromise();
    }

    if (!this.running) {
      this.running = true;

      if (!this.player.avatar.isAudioEnabled()) {
        this.player.avatar.setAudioEnabled(true);
      }

      const _next = () => {
        const {endPromise} = this;
        if (endPromise) {
          this.endPromise = null;
          endPromise.accept();
        }
      };

      let live = true;
      const cancelFns = [
        () => {
          live = false;
          _next();
        },
      ];
      this.cancel = () => {
        for (const cancelFn of cancelFns) {
          cancelFn();
        }
      };

      (async () => {
        const audioBuffer = await (text.isPreloadMessage ? text.waitForLoad() : this.loadAudioBuffer(text));
        if (!live) {
          console.log('bail on audio buffer');
          return;
        }

        const audioContext = Avatar.getAudioContext();
        const audioBufferSourceNode = audioContext.createBufferSource();
        audioBufferSourceNode.buffer = audioBuffer;
        const ended = () => {
          this.cancel = null;
          this.running = false;

          if (this.queue.length > 0) {
            const text = this.queue.shift();
            this.start(text);
          } else {
            _next();
          }
        };
        audioBufferSourceNode.addEventListener('ended', ended, {once: true});
        audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
        audioBufferSourceNode.start();

        cancelFns.push(() => {
          console.log('audio node stop');

          audioBufferSourceNode.removeEventListener('ended', ended);

          audioBufferSourceNode.stop();
          audioBufferSourceNode.disconnect();
        });
      })();
    } else {
      this.queue.push(text);
    }
    return this.endPromise;
  }
  stop() {
    // this.live = false;
    this.queue.length = 0;
    if (this.cancel) {
      this.cancel();
      this.cancel = null;
    }
    this.running = false;
  }
}

export {
  VoiceEndpoint,
  PreloadMessage,
  VoiceEndpointVoicer,
};