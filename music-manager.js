import WSRTC from 'wsrtc/wsrtc.js';

class Music {
  constructor({name, url}, audioContext) {
    this.name = name;
    this.url = url;
    this.audioContext = audioContext;
    this.audioBuffer = null;

    this.loadPromise = (async () => {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    })();
  }
  play() {
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.connect(this.audioContext.gain);
    source.start(0);
    return source;
  }
  waitForLoad() {
    return this.loadPromise;
  }
}
const musicSpecs = [
  {
    name: 'battle',
    url: './sounds/music/battle.mp3',
  },
];
class MusicManager {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.musics = musicSpecs.map(spec => new Music(spec, audioContext));
    this.loadPromise = Promise.all(this.musics.map(music => music.waitForLoad()))
      .then(() => {});
    this.currentMusic = null;
  }
  getMusic(name) {
    const music = this.musics.find(music => music.name);
    /* if (music) {
      await music.waitForLoad();
    } */
    return music || null;
  }
  playCurrentMusic(name) {
    if (this.currentMusic) {
      if (!this.currentMusic.paused) {
        this.currentMusic.pause();
      }
      this.currentMusic.disconnect();
      this.currentMusic = null;
    }

    const newMusic = this.musics.find(music => music.name);
    if (newMusic) {
      this.currentMusic = newMusic.play();

      const localCurrentMusic = this.currentMusic;
      this.currentMusic.addEventListener('ended', () => {
        if (this.currentMusic === localCurrentMusic) {
          this.currentMusic = null;
        }
      });
    }
  }
  waitForLoad() {
    return this.loadPromise;
  }
}
const musicManager = new MusicManager(WSRTC.getAudioContext());
export default musicManager;