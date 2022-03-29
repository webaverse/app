import {createObjectSprite} from './object-spriter.js';
import {OffscreenEngine} from './offscreen-engine.js';

class SpritesheetManager {
  constructor() {
    this.spritesheetCache = new Map();
    this.offscreenEngine = new OffscreenEngine();
    this.getSpriteSheetForAppUrlInternal = this.offscreenEngine.createFunction([
      `\
      import {createObjectSpriteAsync} from './object-spriter.js';
      import metaversefile from './metaversefile-api.js';
      `,
      async function(appUrl, opts) {
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
  async getSpriteSheetForAppUrl(appUrl, opts) {
    // console.log('got spritesheet 1', appUrl, opts);
    const spritesheet = await this.getSpriteSheetForAppUrlInternal(appUrl, opts);
    // console.log('got spritesheet 2', spritesheet);
    // XXX cache this
    return spritesheet;
  }
}
const spritesheetManager = new SpritesheetManager();

export default spritesheetManager;