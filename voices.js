import {voicePacksUrl, voiceEndpointsUrl, defaultVoiceEndpoint, defaultVoicePackName} from './constants.js';
import overrides from './overrides.js';
import {getLocalPlayer} from './players.js';
import * as voices from './voices.js';

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

[
  'overrideVoicePack',
  'userVoicePack',
].forEach(key => {
  overrides[key].addEventListener('change', async e => {
    const voicePackName = overrides.overrideVoicePack.get() ?? overrides.userVoicePack.get() ?? defaultVoicePackName;
    console.log(('voicePackName', voicePackName));
    const voicePack = voices.voicePacks.find(vp => vp.name === voicePackName);
    if (!voicePack) {
      console.error(('voicePack', voicePack));
      return;
    }
    const {audioPath, indexPath} = voicePack;

    const voicePacksUrlBase = voicePacksUrl.replace(/\/+[^\/]+$/, '');
    const audioUrl = voicePacksUrlBase + audioPath;
    const indexUrl = voicePacksUrlBase + indexPath;

    const localPlayer = getLocalPlayer();
    await localPlayer.setVoicePack({
      audioUrl,
      indexUrl,
    });
  });
});
[
  'overrideVoiceEndpoint',
  'userVoiceEndpoint',
].forEach(key => {
  overrides[key].addEventListener('change', async e => {
    const voiceEndpointName = overrides.overrideVoiceEndpoint.get() ?? overrides.userVoiceEndpoint.get() ?? defaultVoiceEndpoint;
    console.log('voiceEndpointName', voiceEndpointName);
    console.log('voices.voiceEndpoints', voices.voiceEndpoints);
    const voiceEndpoint = voices.voiceEndpoints.find(ve => ve.name === voiceEndpointName);
    console.log('voiceEndpoint', voiceEndpoint);

    const localPlayer = getLocalPlayer();
    localPlayer.setVoiceEndpoint(voiceEndpoint.drive_id);
  });
});

const waitForLoad = () => {
  return loadPromise;
};

export {
  waitForLoad,
  voicePacks,
  voiceEndpoints,
};
