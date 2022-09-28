/* this is the fake speech synthesis module.
it is responsible for playing character grunts and Banjo-Kazooie style character speech. */

import audioManager from '../audio-manager.js';
import {loadAudioBuffer, makePromise, selectVoice} from '../util.js';
import {chatTextSpeed} from '../constants.js';

class VoicePack {
  constructor(files, audioBuffer) {
    files = files.map(({name, offset, duration}) => {
      return {
        name,
        offset,
        duration,
        nonce: 0,
      };
    });

    this.audioBuffer = audioBuffer;
    this.syllableFiles = files.filter(({name}) => /\/[0-9]+\.wav$/.test(name));
    this.voiceFiles = {
      actionVoices: {
        hurt: files.filter(f => /hurt/i.test(f.name)),
        scream: files.filter(f => /scream/i.test(f.name)),
        attack: files.filter(f => /attack/i.test(f.name)),
        angry: files.filter(f => /angry/i.test(f.name)),
        gasp: files.filter(f => /gasp/i.test(f.name)),
        jump: files.filter(f => /jump/i.test(f.name)),
        narutoRun: files.filter(f => /nr/i.test(f.name)),
      },
      emoteVoices: {
        alertSoft: files.filter(f => /alert/i.test(f.name)),
        alert: files.filter(f => /alert/i.test(f.name)),
        angrySoft: files.filter(f => /angry/i.test(f.name)),
        angry: files.filter(f => /angry/i.test(f.name)),
        embarrassedSoft: files.filter(f => /emba/i.test(f.name)),
        embarrassed: files.filter(f => /emba/i.test(f.name)),
        headNodSoft: files.filter(f => /nod/i.test(f.name)),
        headNod: files.filter(f => /nod/i.test(f.name)),
        headShakeSoft: files.filter(f => /shake/i.test(f.name)),
        headShake: files.filter(f => /shake/i.test(f.name)),
        sadSoft: files.filter(f => /sad/i.test(f.name)),
        sad: files.filter(f => /sad/i.test(f.name)),
        surpriseSoft: files.filter(f => /surprise/i.test(f.name)),
        surprise: files.filter(f => /surprise/i.test(f.name)),
        victorySoft: files.filter(f => /victory/i.test(f.name)),
        victory: files.filter(f => /victory/i.test(f.name)),
      },
    };
  }

  static async load({audioUrl, indexUrl}) {
    const audioContext = audioManager.getAudioContext();
    const [files, audioBuffer] = await Promise.all([
      (async () => {
        const res = await fetch(indexUrl);
        const j = await res.json();
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

      const audioContext = audioManager.getAudioContext();
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

export {VoicePack, VoicePackVoicer};
