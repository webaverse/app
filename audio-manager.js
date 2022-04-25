import Avatar from './avatars/avatars.js';
import WSRTC from 'wsrtc/wsrtc.js';

const loadPromise = (async () => {
  const audioContext = WSRTC.getAudioContext();
  audioContext.gain = audioContext.createGain();
  audioContext.gain.connect(audioContext.destination);
  
  Avatar.setAudioContext(audioContext);
  await audioContext.audioWorklet.addModule('avatars/microphone-worklet.js');
})();
const waitForLoad = () => loadPromise;

export {
  waitForLoad,
};