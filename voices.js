import { voicePacksUrl, voiceEndpointsUrl } from './constants.js';

const voicePacks = [];
const voiceEndpoints = [];

const loadPromise = (async () => {
  await Promise.all([
    (async () => {
      const res = await fetch( voicePacksUrl );
      const j = await res.json();
      voicePacks.push(...j);
    })(),
    (async () => {
      const res = await fetch( voiceEndpointsUrl );
      const j = await res.json();
      voiceEndpoints.push(...j);
    })(),
  ]);
})();

const waitForLoad = () => {
  return loadPromise;
};

export {
  waitForLoad,
  voicePacks,
  voiceEndpoints,
}