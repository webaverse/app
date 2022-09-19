import offscreenEngineManager from './offscreen-engine-manager.js';
import {SpritesheetMesh} from './object-spriter.js';

let getSpriteSheetForAppUrlInternal = null;
const createAppUrlSpriteSheet = async (appUrl, opts) => {
  if (!getSpriteSheetForAppUrlInternal) {
    getSpriteSheetForAppUrlInternal = offscreenEngineManager.createFunction([
      `\
      import {createObjectSpriteSheet} from './object-spriter.js';
      import metaversefile from './metaversefile-api.js';
      import physx from './physx.js';
      `,
      async function(appUrl, opts) {
        await physx.waitForLoad();
        
        const app = await metaversefile.createAppAsync({
          start_url: appUrl,
          components: [
            {
              key: 'physics',
              value: true,
            },
          ],
        });
        const spritesheet = await createObjectSpriteSheet(app, opts);
        return spritesheet;
      }
    ]);
  }
  const result = await getSpriteSheetForAppUrlInternal([appUrl, opts]);
  return result;
};

export {
  createAppUrlSpriteSheet,
  SpritesheetMesh,
};