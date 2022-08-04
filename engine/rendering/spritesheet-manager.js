import {createObjectSprite} from '@engine/rendering/object-spriter.js';
import offscreenEngineManager from './offscreen-engine-manager.js';

class SpritesheetManager {
  constructor() {
    this.spritesheetCache = new Map();
    this.getSpriteSheetForAppUrlInternal = offscreenEngineManager.createFunction([
      `\
      import {createObjectSpriteAsync} from '@engine/rendering/object-spriter.js';
      import metaversefile from '@engine/metaversefile-api.js';
      import physx from '@engine/physics/physx.js';
      `,
      async function(appUrl, opts) {
        await physx.waitForLoad();
        
        const app = await metaversefile.createAppAsync({
          start_url: appUrl,
        });
        const spritesheet = await createObjectSpriteAsync(app, opts);
        return spritesheet;
      }
    ]);
  }
  getSpriteSheetForApp(app) {
    let spritesheet = this.spritesheetCache.get(app.contentId);
    if (!spritesheet) {
      spritesheet = createObjectSprite(app);
      this.spritesheetCache.set(app.contentId, spritesheet);
    }
    return spritesheet;
  }
  async getSpriteSheetForAppUrlAsync(appUrl, opts) {
    let spritesheet = this.spritesheetCache.get(appUrl);
    if (!spritesheet) {
      spritesheet = await this.getSpriteSheetForAppUrlInternal([appUrl, opts]);
      this.spritesheetCache.set(appUrl, spritesheet);
    }
    return spritesheet;
  }
}
const spritesheetManager = new SpritesheetManager();

export default spritesheetManager;