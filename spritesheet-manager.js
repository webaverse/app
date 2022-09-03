import {createObjectSprite} from './object-spriter.js';
import offscreenEngineManager from './offscreen-engine-manager.js';

class SpritesheetManager {
  maxConcurrentLoading = 5;
  currentlyLoading = 0;
  waitQueue = [];

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
      this.spritesheetCache.set(app.contentId, spritesheet);
    }
    return spritesheet;
  }

  async getSpriteSheetForAppUrlAsync(appUrl, opts) {
    const spritesheet = this.spritesheetCache.get(appUrl);

    if (spritesheet) return spritesheet;

    return new Promise((resolve) => {
      this.waitQueue.push({ url: appUrl, opts, resolve });
      this.loadSpriteSheetFromQueue();
    });
  }

  loadSpriteSheetFromQueue() {
    if (this.currentlyLoading >= this.maxConcurrentLoading || this.waitQueue.length <= 0) return;

    const loopCount = Math.min(this.maxConcurrentLoading, this.waitQueue.length);
    for (let i = 0; i < loopCount; i++) {
      this.currentlyLoading++;
      const data = this.waitQueue.splice(0, 1)[0];

      this.getSpriteSheetForAppUrlInternal([ data.url, data.opts ]).then((spritesheet) => {
        this.currentlyLoading--;

        this.spritesheetCache.set(data.url, spritesheet);
        data.resolve(spritesheet);

        this.loadSpriteSheetFromQueue();
      });
    }
  }
}
const spritesheetManager = new SpritesheetManager();

export default spritesheetManager;