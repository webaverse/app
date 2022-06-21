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
        async function(seed, range, width, height) {
          await physx.waitForLoad();

          const start_url = '/metaverse_modules/land/';
          const components = [
            {
              key: 'seed',
              value: seed,
            },
            {
              key: 'range',
              value: range,
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
          const rangeBox = new THREE.Box3(
            new THREE.Vector3(range[0][0], range[0][1], range[0][2]),
            new THREE.Vector3(range[1][0], range[1][1], range[1][2])
          );
          const landCanvas = await screenshotLandApp({
            app,
            range: rangeBox,
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
  range,
  width,
  height,
} = {}) => {
  const getLandImage = useLandScreenshotter();
  const imageBitmap = await getLandImage([seed, range, width, height]);
  return imageBitmap;
};