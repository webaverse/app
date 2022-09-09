import {createObjectSprite} from './object-spriter.js';
import offscreenEngineManager from './offscreen-engine-manager.js';

class SpritesheetManager {
  constructor() {
    this.spritesheetCache = new Map();
    this.getSpriteSheetForAppUrlInternal = offscreenEngineManager.createFunction([
      `\
      import {createObjectSpriteAsync} from './object-spriter.js';
      import metaversefile from './metaversefile-api.js';
      import physx from './physx.js';
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
      console.log(spritesheet, "spritesheet");
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