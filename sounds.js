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
  soundFiles.food = soundFileSpecs.filter(f => /^food\//.test(f.name));
  soundFileAudioBuffer = _soundFileAudioBuffer;

  // console.log('loaded audio', soundFileSpecs, soundFileAudioBuffer);
})();
const waitForLoad = () => loadPromise;

const getSoundFiles = () => soundFiles;
const getSoundFileAudioBuffer = () => soundFileAudioBuffer;

export {
  waitForLoad,
  getSoundFiles,
  getSoundFileAudioBuffer,
};