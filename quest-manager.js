import {scene} from './renderer.js';
// import {OffscreenEngine} from './offscreen-engine.js';

class Quest {
  constructor(spec) {
    this.name = spec.name;
    this.description = spec.description;
    this.condition = spec.condition;
    this.drops = spec.drops;

    this.pathApp = null;
    this.conditionFn = (() => {
      switch (this.condition) {
        case 'clearMobs': {
          return () => {
            // XXX
          };
        }
        case 'enter': {
          return () => {
            // XXX
          };
        }
        return null;
      }
    })();
  }
  update(timestamp, timeDiff) {
    this.conditionFn && this.conditionFn();
  }
  destroy() {

  }
}

class QuestManager extends EventTarget {
  constructor() {
    super();
    /* this.spritesheetCache = new Map();
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
    ]); */
    this.quests = [];
  }
  addQuest(spec) {
    const quest = new Quest(spec);
    this.quests.push(quest);

    this.dispatchEvent(new MessageEvent('questadd', {
      data: {
        quest,
      },
    }));
  }
  removeQuest(quest) {
    const index = this.quests.indexOf(quest);
    if (index !== -1) {
      this.quests.splice(index, 1);

      this.dispatchEvent(new MessageEvent('questremove', {
        data: {
          quest,
        },
      }));
    }
  }
  update(timestamp, timeDiff) {
    for (const quest of this.quests) {
      quest.update(timestamp, timeDiff);
    }
  }
  /* getSpriteSheetForApp(app) {
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
      spritesheet = await this.getSpriteSheetForAppUrlInternal(appUrl, opts);
      this.spritesheetCache.set(appUrl, spritesheet);
    }
    return spritesheet;
  } */
}
const questManager = new QuestManager();

export default questManager;