/* this module is responsible for mapping a remote TTS endpoint to the character. */

import audioManager from '../audio-manager.js';
import {makePromise} from '../util.js';
import {voiceEndpointBaseUrl} from '../constants.js';

class VoiceEndpoint {
  constructor(url) {
    this.url = new URL(url, import.meta.url);
  }
}
class PreloadMessage {
  constructor(voiceEndpointUrl, text) {
    this.voiceEndpointUrl = voiceEndpointUrl;
    this.text = text;

    this.isPreloadMessage = true;
    this.loadPromise = VoiceEndpointVoicer.loadAudioBuffer(
      this.voiceEndpointUrl,
      this.text,
    );
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

  static preloadMessage(voiceEndpointUrl, text) {
    return new PreloadMessage(voiceEndpointUrl, text);
  }

  preloadMessage(text) {
    return VoiceEndpointVoicer.preloadMessage(
      this.voiceEndpoint.url.toString(),
      text,
    );
  }

  static async loadAudioBuffer(voiceEndpointUrl, text) {
    // console.log('load audio buffer', voiceEndpointUrl, text);
    try {
      const u = new URL(voiceEndpointUrl);
      u.searchParams.set('s', text);
      const res = await fetch(
        u /*, {
        mode: 'cors',
      } */,
      );
      const arrayBuffer = await res.arrayBuffer();

      const audioContext = audioManager.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (err) {
      throw new Error('epic fail', err);
    }
  }

  /* async loadAudioBuffer(text) {
    return VoiceEndpointVoicer.loadAudioBuffer(this.voiceEndpoint.url, text);
  } */
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
        const audioBuffer = await (text.isPreloadMessage
          ? text.waitForLoad()
          : this.loadAudioBuffer(text));
        if (!live) {
          console.log('bail on audio buffer');
          return;
        }

        const audioContext = audioManager.getAudioContext();
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
        if (!this.player.avatar.microphoneWorker) {
          this.player.avatar.setAudioEnabled(true);
        }
        audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
        audioBufferSourceNode.start();

        cancelFns.push(() => {
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
const getVoiceEndpointUrl = voiceId =>
  `${voiceEndpointBaseUrl}?voice=${encodeURIComponent(voiceId)}`;

export {
  VoiceEndpoint,
  PreloadMessage,
  VoiceEndpointVoicer,
  getVoiceEndpointUrl,
};
