import Avatar from './avatars/avatars.js';
import {loadJson, loadAudioBuffer} from './util.js';

let soundFileAudioBuffer;
const soundFiles = {};
const loadPromise = (async () => {
  await Avatar.waitForLoad();

  const audioContext = Avatar.getAudioContext();
  const [
    soundFileSpecs,
    _soundFileAudioBuffer,
  ] = await Promise.all([
    loadJson(`/sounds/sound-files.json`),
    loadAudioBuffer(audioContext, '/sounds/sounds.mp3'),
  ]);

  soundFiles.walk = soundFileSpecs.filter(f => /^walk\//.test(f.name));
  soundFiles.run = soundFileSpecs.filter(f => /^run\//.test(f.name));
  soundFiles.jump = soundFileSpecs.filter(f => /^jump\//.test(f.name));
  soundFiles.land = soundFileSpecs.filter(f => /^land\//.test(f.name));
  soundFiles.narutoRun = soundFileSpecs.filter(f => /^narutoRun\//.test(f.name));
  soundFiles.chomp = soundFileSpecs.filter(f => /^food\/chomp/.test(f.name));
  soundFiles.gulp = soundFileSpecs.filter(f => /^food\/gulp/.test(f.name));
  soundFiles.enemyDeath = soundFileSpecs.filter(f => /enemyDeath/.test(f.name));
  soundFileAudioBuffer = _soundFileAudioBuffer;

  // console.log('loaded audio', soundFileSpecs, soundFileAudioBuffer);
})();
const waitForLoad = () => loadPromise;

const getSoundFiles = () => soundFiles;
const getSoundFileAudioBuffer = () => soundFileAudioBuffer;
const playSound = audioSpec => {
  const {offset, duration} = audioSpec;

  const audioContext = Avatar.getAudioContext();
  const audioBufferSourceNode = audioContext.createBufferSource();
  audioBufferSourceNode.buffer = soundFileAudioBuffer;
  audioBufferSourceNode.connect(audioContext.destination);
  audioBufferSourceNode.start(0, offset, duration);
};

export {
  waitForLoad,
  getSoundFiles,
  getSoundFileAudioBuffer,
  playSound,
};