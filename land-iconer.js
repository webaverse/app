import offscreenEngineManager from './offscreen-engine-manager.js';

const useLandScreenshotter = (() => {
  let getLandImage = null;
  return () => {
    if (!getLandImage) {
      getLandImage = offscreenEngineManager.createFunction([
        `\
        import * as THREE from 'three';
        import metaversefile from './metaversefile-api.js';
        import {screenshotLandApp} from './land-screenshotter.js';
        import physx from './physx.js';
        `,
        async function(seed, renderPosition, lods, minLodRange, clipRange, width, height) {
          await physx.waitForLoad();

          const start_url = '/metaverse_modules/land/';
          const components = [
            {
              key: 'seed',
              value: seed,
            },
            {
              key: 'renderPosition',
              value: renderPosition,
            },
            {
              key: 'lods',
              value: lods,
            },
            {
              key: 'minLodRange',
              value: minLodRange,
            },
            {
              key: 'clipRange',
              value: clipRange,
            },
            {
              key: 'physicsInstance',
              value: false,
            },
            {
              key: 'wait',
              value: true,
            },
          ];
          const app = await metaversefile.createAppAsync({
            start_url,
            components,
          });
          const range = new THREE.Box3(
            new THREE.Vector3().fromArray(clipRange[0]),
            new THREE.Vector3().fromArray(clipRange[1]),
          );
          const landCanvas = await screenshotLandApp({
            app,
            range,
            width,
            height,
          });
          const imageBitmap = await createImageBitmap(landCanvas);

          app.destroy();

          return imageBitmap;
        }
      ]);
    }
    return getLandImage;
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