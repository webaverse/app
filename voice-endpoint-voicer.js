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

    /* _say = text => {
      const voice = `1jLX0Py6j8uY93Fjf2l0HOZQYXiShfWUO`;
      const a = new Audio();
      a.src = `http://voice.webaverse.com:8080/tts?voice=${encodeURIComponent(voice)}&s=${encodeURIComponent(text)}`;
      a.oncanplaythrough = () => {
        a.play();
      };
      a.onerror = err => {
        console.warn(err);
      };
      // document.body.appendChild(a);
    };
    genLore = (prompt, maxTokens = 25) => {
      if (!prompt) {
        throw new Error('prompt is required');
      }
    
      prompt = `# Scene 1\n\nThe characters are having a conversation.\n\nCharacter 1: ${prompt}\nCharacter 2:`;
      const end = `\n`;
      const es = new EventSource(`https://ai.webaverse.com/lore?p=${encodeURIComponent(prompt)}&e=${encodeURIComponent(end)}&l=${maxTokens}`);
      let fullS = '';
      const _finish = s => {
        // clean up non-latin characters
        s = s.replace(/[^a-zA-Z0-9()*_\-!#$%^&*,."\'\][\s]+/g, '');
        if (/[a-zA-Z0-9]/.test(s)) {
          _say(s);
        } else {
          console.warn('retrying due to empty response');
          prompt += ` ...\nCharacter 2:`;
          genLore(prompt, maxTokens);
        }
        es.close();
      };
      es.addEventListener('message', e => {
        const s = e.data;
        console.log('got s', s);
        if (s !== '[DONE]') {
          const j = JSON.parse(s);
          console.log(j.choices);
          const {choices} = j;
          const {text} = choices[0];
          fullS += text;
    
          const endIndex = fullS.indexOf(end);
          if (endIndex !== -1) {
            _finish(fullS.substring(0, endIndex));
          }
        } else {
          _finish(fullS);
        }
    
        console.log(JSON.stringify(prompt + fullS));
      });
    }; */

    (async () => {
      const u = new URL(this.voiceEndpoint.url.toString());
      u.searchParams.set('s', text);
      const res = await fetch(u, {
        mode: 'cors',
      });
      const arrayBuffer = await res.arrayBuffer();

      const audioContext = Avatar.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = audioBuffer;
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
      audioBufferSourceNode.start();
    })();

    /* const _recurse = async () => {
      const {offset, duration} = this.selectVoice();

      const audioContext = Avatar.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = this.audioBuffer;
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
      audioBufferSourceNode.start(0, offset, duration);
      let audioTimeout = duration * 1000;
      audioTimeout *= 0.9 + 0.2 * Math.random();
      this.timeout = setTimeout(() => {
        _recurse();
      }, audioTimeout);
    };
    _recurse(); */
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