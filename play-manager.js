import * as THREE from './three.module.js';
import {rigManager} from './rig.js';

class PlayScene {
  constructor() {
    this.audio = document.createElement('audio');
    this.audio.src = './ghost.mp3';
    rigManager.localRig.setMicrophoneMediaStream(this.audio, {
      playbackRate: 1,
      muted: false,
    });
    // this.audio.muted = false;
    document.body.appendChild(this.audio);
    this.audio.play();

    this.script = [
      { // angry
        startTime: 0,
        sustain: 2,
        release: 3,
        index: 5,
      },
      { // wide eye
        startTime: 0,
        attack: 1,
        sustain: 2,
        release: 1,
        index: 19,
      },
      { // smile
        startTime: 0,
        sustain: 2,
        release: 1,
        index: 32,
      },
      { // eyes closed
        startTime: 2,
        attack: 0.5,
        sustain: 0.1,
        release: 0.5,
        index: 12,
      },
      /* { // ooo
        startTime: 1,
        sustain: 1,
        index: 27,
      }, */
    ].map(o => {
      o.type = 'viseme';
      o.attack = o.attack || 0;
      o.sustain = o.sustain || 0;
      o.release = o.release || 0;

      o.duration = o.attack + o.sustain + o.release;
      o.endTime = o.startTime + o.duration;
      
      return o;
    }).concat([
      {
        startTime: 0,
        duration: 10,
        target: new THREE.Vector3(0, 1, -2),
      },
    ].map(o => {
      o.type = 'look';
      
      o.endTime = o.startTime + o.duration;
      
      return o;
    }));
  }
  update() {
    const {currentTime} = this.audio;
    rigManager.localRig.activeVisemes = this.script.map(o => {
      if (o.type === 'viseme') {
        if (o.startTime < currentTime && currentTime < o.endTime) {
          let value;
          if (currentTime < o.attack) {
            value = (currentTime - o.startTime) / o.attack;
          } else if (currentTime < (o.attack + o.sustain)) {
            value = 1;
          } else if (currentTime < (o.attack + o.sustain + o.release)) {
            value = 1 - (currentTime - (o.attack + o.sustain)) / o.release;
          } else {
            // can't happen
            value = 1;
          }
          return {
            index: o.index,
            value,
          };
        } else {
          return null;
        }
      } else {
        return null;
      }
    }).filter(n => n !== null);
    rigManager.localRig.activeLook = this.script.map(o => {
      if (o.type === 'viseme' && currentTime < o.endTime) {
        return o.position;
      } else {
        return null;
      }
    })[0] || null;
  }
}
let playScene = null;

const playManager = {
  start() {
    playScene = new PlayScene();
  },
  update() {
    playScene && playScene.update();
  },
};
export default playManager;