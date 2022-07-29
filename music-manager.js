/*
this manager provides music preloading, selection, and playing.
*/

import audioManager from './audio-manager.js';
import {makePromise} from './util.js';
import {defaultMusicVolume} from './constants.js';

class Music {
  constructor({name, urls, url}, audioContext) {
    this.name = name;
    this.urls = urls ?? [url];
    this.audioContext = audioContext;
    this.audioBuffers = Array(this.urls.length).fill(null);
    this.audioBufferIndex = 0; // Math.floor(Math.random() * this.urls.length);

    // this.loadPromise = makePromise();
    /* this.loadPromise = (async () => {
      this.audioBuffers = await Promise.all(this.urls.map(async url => {
        console.log('fetch 1', url);
        const res = await fetch(url);
        console.log('fetch 2', url);
        const arrayBuffer = await res.arrayBuffer();
        return await this.audioContext.decodeAudioData(arrayBuffer);
      }));
    })(); */
  }
  play({
    repeat = false,
  } = {}) {
    const audioBuffer = this.audioBuffers[this.audioBufferIndex];
    this.audioBufferIndex = (this.audioBufferIndex + 1) % this.audioBuffers.length;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = repeat;
    source.start(0);

    const gain = this.audioContext.createGain();
    gain.gain.value = defaultMusicVolume;

    source.connect(gain);
    gain.connect(this.audioContext.gain);

    return {
      source,
      gain,
    };
  }
  /* load() {
    const promises = Promise.all(this.urls.map(async (url, i) => {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const audioData = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffers[i] = audioData;
    }));
    (async () => {
      await promises;
      this.loadPromise.accept();
    })();
    return promises;
  }
  waitForLoad() {
    return this.loadPromise;
  } */
}
const musicSpecs = [
  {
    name: 'battle',
    urls: [
      './sounds/music/battle1.mp3',
      './sounds/music/battle2.mp3',
      './sounds/music/battle3.mp3',
    ],
  },
  {
    name: 'victory',
    urls: [
      './sounds/music/victory1.mp3',
      './sounds/music/victory2.mp3',
      './sounds/music/victory3.mp3',
      './sounds/music/victory4.mp3',
      './sounds/music/victory5.mp3',
    ],
  },
  {
    name: 'gameOver',
    urls: [
      './sounds/music/gameOver1.mp3',
      './sounds/music/gameOver2.mp3',
      './sounds/music/gameOver3.mp3',
    ],
  },
  {
    name: 'overworld',
    urls: [
      './sounds/music/overworld.mp3',
    ],
  },
  {
    name: 'dungeon',
    urls: [
      './sounds/music/dungeon.mp3',
    ],
  },
  {
    name: 'homespace',
    urls: [
      './sounds/music/homespace.mp3',
    ],
  },
];
class MusicManager {
  constructor(audioContext) {
    this.audioContext = audioContext;

    this.musics = new Map();
    this.currentMusic = null;
  }
  async fetchMusic(url, name = url) {
    let music = this.musics.get(url);
    if (!music) {
      music = new Music({
        name,
        url,
      }, this.audioContext);
      this.musics.set(url, music);
    }
    await music.waitForLoad();
    return music;
  }
  getMusicUrl(name) {
    const musicSpec = musicSpecs.find(spec => spec.name === name);
    if (musicSpec) {
      return musicSpec.urls[Math.floor(Math.random() * musicSpec.urls.length)];
    } else {
      return null;
    }
  }
  playCurrentMusic(newMusic, {
    repeat = false,
  } = {}) {
    this.stopCurrentMusic();

    this.currentMusic = newMusic.play({
      repeat,
    });

    const localCurrentMusic = this.currentMusic;
    this.currentMusic.source.addEventListener('ended', () => {
      if (this.currentMusic === localCurrentMusic) {
        this.currentMusic = null;
      }
    });
  }
  async playCurrentMusicName(name, opts) {
    const url = getMusicUrl(name);
    const newMusic = await this.fetchMusic(url, name);
    if (newMusic) {
      this.playCurrentMusic(newMusic, opts);
    }
  }
  stopCurrentMusic() {
    if (this.currentMusic) {
      this.currentMusic.source.stop();
      this.currentMusic.gain.disconnect();
      this.currentMusic = null;
    }
  }
}
const musicManager = new MusicManager(audioManager.getAudioContext());
export default musicManager;