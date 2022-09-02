import {createObjectSprite} from './object-spriter.js';
import offscreenEngineManager from './offscreen-engine-manager.js';

class SpritesheetManager {
  maxConcurrentLoading = 5;
  currentlyLoading = 0;
  isLoaderRunning = false;
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

    if (spritesheet) return spritesheet

    return new Promise((resolve) => {
      this.waitQueue.push({ url: appUrl, opts, resolve })
      if (!this.isLoaderRunning) this.loadSpriteSheetFromQueue()
    })
  }

  async loadSpriteSheetFromQueue() {
    if (this.currentlyLoading >= this.maxConcurrentLoading) return;

    this.isLoaderRunning = true;

    for (let i = 0; i < this.maxConcurrentLoading; i++) {
      this.currentlyLoading++;
      this.loadSpriteSheet((i+1)).then(() => {
        this.currentlyLoading--
        if (this.currentlyLoading === 0) this.isLoaderRunning = false;
      });
    }
  }

  async loadSpriteSheet(num) {
    if (this.waitQueue.length <= 0) return;

    this.isLoaderRunning = true;
    const urlData = this.waitQueue.splice(0, 1)[0];

    const spritesheet = await this.getSpriteSheetForAppUrlInternal([ urlData.url, urlData.opts ]);
    this.spritesheetCache.set(urlData.url, spritesheet);
    urlData.resolve(spritesheet)

    if (this.waitQueue.length > 0) this.loadSpriteSheetFromQueue();
  }
}
const spritesheetManager = new SpritesheetManager();

export default spritesheetManager;