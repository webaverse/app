import Avatar from './avatars/avatars.js';

const loadPromise = (async () => {
  const audioContext = Avatar.getAudioContext();
  audioContext.gain = audioContext.createGain();
  audioContext.gain.connect(audioContext.destination);
  
  Avatar.setAudioContext(audioContext);
  await audioContext.audioWorklet.addModule('avatars/microphone-worklet.js');
})();
export const waitForLoad = () => loadPromise;

export const setVolume = volume => {
  const audioContext = Avatar.getAudioContext();
  audioContext.gain.gain.value = volume;
};