import offscreenEngineManager from './offscreen-engine/offscreen-engine-manager.js';

const createAppUrlSpriteSheet = async (appUrl, opts) => {
  const result = await offscreenEngineManager.request(
    'createAppUrlSpriteSheet',
    [appUrl, opts],
  );
  return result;
};

export {createAppUrlSpriteSheet};
