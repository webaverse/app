import {voicePacksUrl, voiceEndpointsUrl} from './constants.js';
import overrides from './overrides.js';
import {playersManager} from './players-manager.js';

const voicePacks = [];
const voiceEndpoints = [];

const loadPromise = (async () => {
  await Promise.all([
    (async () => {
      const res = await fetch(voicePacksUrl);
      const j = await res.json();
      voicePacks.push(...j);
    })(),
    (async () => {
      const res = await fetch(voiceEndpointsUrl);
      const j = await res.json();
      voiceEndpoints.push(...j);
    })(),
  ]);
})();

['overrideVoicePack', 'userVoicePack'].forEach(key => {
  overrides[key].addEventListener('change', async e => {
    const voicePackName =
      overrides.overrideVoicePack.get() ??
      overrides.userVoicePack.get() ??
      null;
    if (!voicePackName) {
      throw new Error('no voice pack name');
    }
    const voicePack = voicePacks.find(vp => vp.name === voicePackName);

    const {audioPath, indexPath} = voicePack;
    const voicePacksUrlBase = voicePacksUrl.replace(/\/+[^\/]+$/, '');
    const audioUrl = voicePacksUrlBase + audioPath;
    const indexUrl = voicePacksUrlBase + indexPath;

    const localPlayer = playersManager.getLocalPlayer();
    await localPlayer.setVoicePack({
      audioUrl,
      indexUrl,
    });
  });
});
['overrideVoiceEndpoint', 'userVoiceEndpoint'].forEach(key => {
  overrides[key].addEventListener('change', async e => {
    const voiceEndpointName =
      overrides.overrideVoiceEndpoint.get() ??
      overrides.userVoiceEndpoint.get() ??
      null;
    if (!voiceEndpointName) {
      throw new Error('no voice endpoint name');
    }
    const voiceEndpoint = voiceEndpoints.find(
      ve => ve.name === voiceEndpointName,
    );

    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.setVoiceEndpoint(voiceEndpoint.drive_id);
  });
});

const waitForLoad = () => {
  return loadPromise;
};

export {waitForLoad, voicePacks, voiceEndpoints};
