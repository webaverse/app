import {scene} from './renderer.js';
import * as metaverseModules from './metaverse-modules.js';
import metaversefile from 'metaversefile';
// import {OffscreenEngine} from './offscreen-engine.js';

const _makePathApp = () => {
  const app = metaversefile.createApp();
  // console.log('got metaverse modules', metaverseModules.modules, metaverseModules.modules.path);
  app.setComponent('line', [
    [92.5, 0, -33],
    [19.5, -4, 59.5],
  ]);
  app.addModule(metaverseModules.modules.path);
  return app;
};

class Quest {
  constructor(spec) {
    this.name = spec.name;
    this.description = spec.description;
    this.conditions = spec.conditions;
    this.completeActions = spec.completeActions;

    /* {
      "position": [
        0,
        0,
        0
      ],
      "quaternion": [
        0,
        0,
        0,
        1
      ],
      "components": [
        {
          "key": "line",
          "value": [
            [92.5, 0, -33],
            [19.5, -4, 59.5]
          ]
        },
        {
          "key": "bounds",
          "value": [
            [19, -4.5, 57],
            [20, 0, 58]
          ]
        }
      ],
      "start_url": "../metaverse_modules/quest/",
      "dynamic": true
    }, */

    this.pathApp = _makePathApp();
    scene.add(this.pathApp);

    this.conditionsFn = (() => {
      for (const condition of this.conditions) {
        const {key, value} = condition;
        switch (key) {
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
      }
    })();
  }
  update(timestamp, timeDiff) {
    this.conditionsFn && this.conditionsFn();
  }
  destroy() {
    scene.remove(this.pathApp);
    this.pathApp.destroy();
    this.pathApp = null;
  }
}

class QuestManager extends EventTarget {
  constructor() {
    super();

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