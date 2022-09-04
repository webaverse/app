import {createObjectSprite} from './object-spriter.js';
import offscreenEngineManager from './offscreen-engine-manager.js';

class AssetLoader {
  isIdle = true;

  async load(promiseFunc) {
    this.isIdle = false;
    await promiseFunc();
    this.isIdle = true;
  }
}

class AssetLoadManager {
  pushQueue = [];
  pushQueueLock = Promise.resolve();
  getQueue = [];
  getIndex = -1;

  maxLoaderCount = 5;
  loaderPool = [];
  intervalID = 0;

  schedulerInterval = 10;

  constructor() {
    for (let i = 0; i < this.maxLoaderCount; i++) {
      this.loaderPool.push(new AssetLoader())
    }
  }

  poll() {
    this.intervalID = setInterval(() => {
      if (this.getQueue.length > 0) {
        for (let i = 0; i < this.loaderPool.length; i++) {
          if (this.loaderPool[i].isIdle && this.getIndex < this.getQueue.length - 1) {
            this.loaderPool[i].load(this.getQueue[++this.getIndex]);
          }
        }
      } else if (this.pushQueue.length <= 0) {
        clearInterval(this.intervalID);
        this.intervalID = 0;
      }

      if (this.getIndex > -1) {
        this.getQueue.splice(0, this.getIndex + 1);
        this.getIndex = -1;
      }

      const t = this.pushQueue
      this.pushQueue = this.getQueue;
      this.getQueue = t;
    }, this.schedulerInterval);
  }

  putInQueue(promise) {
    this.pushQueueLock = this.pushQueueLock.then(() => {
      this.pushQueue.push(promise);
      if (this.intervalID === 0) {
        this.poll();
      }
    });

    return this.pushQueueLock;
  }
}

class SpritesheetManager {
  constructor() {
    this.loadManager = new AssetLoadManager();
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
    let spritesheet = this.spritesheetCache.get(appUrl);

    if (!spritesheet) {
      spritesheet = await new Promise(async (resolve) => {
        this.loadManager.putInQueue(() => this.getSpriteSheetForAppUrlInternal([ appUrl, opts ]).then(resolve))
      });

      this.spritesheetCache.set(appUrl, spritesheet);
    }

    return spritesheet;
  }
}
const spritesheetManager = new SpritesheetManager();

export default spritesheetManager;