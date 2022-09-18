import {createObjectSpriteAnimation} from './object-spriter.js';
import offscreenEngineManager from './offscreen-engine-manager.js';

class SpriteAnimationManager {
  constructor() {
    this.spriteAnimationCache = new Map();
    this.getSpriteAnimationForAppUrlInternal = offscreenEngineManager.createFunction([
      `\
      import {createObjectSpriteAnimation} from './object-spriter.js';
      import metaversefile from './metaversefile-api.js';
      import physx from './physx.js';
      `,
      async function(appUrl, opts) {
        await physx.waitForLoad();
        
        const app = await metaversefile.createAppAsync({
          start_url: appUrl,
        });
        const spritesheet = await createObjectSpriteAnimation(app, opts, {
          type: 'imageBitmap',
        });
        return spritesheet;
      }
    ]);
  }
  getSpriteAnimationForApp(app) {
    let spritesheet = this.spriteAnimationCache.get(app.contentId);
    if (!spritesheet) {
      spritesheet = createObjectSpriteAnimation(app);
      this.spriteAnimationCache.set(app.contentId, spritesheet);
    }
    return spritesheet;
  }
  async getSpriteAnimationForAppUrlAsync(appUrl, opts) {
    let spritesheet = this.spriteAnimationCache.get(appUrl);
    if (!spritesheet) {
      spritesheet = await this.getSpriteAnimationForAppUrlInternal([appUrl, opts]);
      this.spriteAnimationCache.set(appUrl, spritesheet);
    }
    return spritesheet;
  }
}
const spriteAnimationManager = new SpriteAnimationManager();

export default spriteAnimationManager;