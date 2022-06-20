/* this is the fake speech synthesis module.
it is responsible for playing Banjo-Kazooie style character speech. */

import Avatar from '../avatars/avatars.js';
import {loadAudioBuffer, makePromise, selectVoice} from '../util.js';
import {chatTextSpeed} from '../constants.js';


class VoicePack {
  constructor(files, audioBuffer) {
    this.syllableFiles = files.filter(({name}) => /\/[0-9]+\.wav$/.test(name));
    this.actionFiles = files.filter(({name}) => /^actions\//.test(name));
    this.emoteFiles = files.filter(({name}) => /^emotes\//.test(name));
    this.audioBuffer = audioBuffer;
    this.actionVoices = this.actionFiles.map(({name, offset, duration}) => {
      return {
        name,
        offset,
        duration,
        nonce: 0,
      };
    });
    this.emoteVoices = this.emoteFiles.map(({name, offset, duration}) => {
      return {
        name,
        offset,
        duration,
        nonce: 0,
      };
    });
  }
  static async load({
    audioUrl,
    indexUrl,
  }) {
    const audioContext = Avatar.getAudioContext();
    const [
      files,
      audioBuffer,
    ] = await Promise.all([
      (async () => {
        const res = await fetch(indexUrl);
        let j = await res.json();
        return j;
      })(),
      loadAudioBuffer(audioContext, audioUrl),
    ]);
    
    const voicePack = new VoicePack(files, audioBuffer);
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
  clearTimeouts() {
    clearTimeout(this.audioTimeout);
    this.audioTimeout = null;
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

    if (!this.player.avatar.isAudioEnabled()) {
      this.player.avatar.setAudioEnabled(true);
    }

    const p = makePromise();
    const _recurse = async () => {
      const {offset, duration} = selectVoice(this.voices);

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

    // 500ms by default, plus the time it takes to render the text
    const fullTextTime = 500 + this.charactersSinceStart * chatTextSpeed * 2;
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