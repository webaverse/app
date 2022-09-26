import offscreenEngineManager from './offscreen-engine/offscreen-engine-manager.js';

const useLandScreenshotter = (() => {
  return async args => {
    const result = await offscreenEngineManager.request('getLandImage', args);
    return result;
  };
})();

export const createLandIcon = async ({
  seed,
  renderPosition,
  lods,
  minLodRange,
  clipRange,
  width,
  height,
} = {}) => {
  const getLandImage = useLandScreenshotter();
  const imageBitmap = await getLandImage([seed, renderPosition, lods, minLodRange, clipRange, width, height]);
  return imageBitmap;
};
