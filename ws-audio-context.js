import {channelCount, sampleRate, bitrate} from './ws-constants.js';

let audioCtx = null;
export const ensureAudioContext = async () => {
  if (!audioCtx) {
    audioCtx = new AudioContext({
      latencyHint: 'interactive',
      sampleRate,
    });
    await Promise.all([
      audioCtx.audioWorklet.addModule(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}ws-input-worklet.js`),
      audioCtx.audioWorklet.addModule(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}ws-output-worklet.js`),
    ]);
  }
};
export const getAudioContext = () => {
  ensureAudioContext();
  return audioCtx;
};