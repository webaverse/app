// import {scene} from './renderer.js';
// import * as metaverseModules from './metaverse-modules.js';
// import metaversefile from 'metaversefile';

class Quest {
  constructor(app) {
    // this.app = app;

    const {name, description, conditions, completeActions} = app.json;

    this.name = name;
    this.description = description;
    this.conditions = conditions;
    this.completeActions = completeActions;

    this.camera = app.camera;

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
          default: {
            return null;
          }
        }
      }
    })();
  }
  update(timestamp, timeDiff) {
    this.conditionsFn && this.conditionsFn();
  }
  destroy() {
    // nothing
  }
}

class QuestManager extends EventTarget {
  constructor() {
    super();

    this.quests = [];
  }
  addQuest(questApp) {
    const quest = new Quest(questApp);
    this.dispatchEvent(new MessageEvent('questadd', {
      data: {
        quest,
      },
    }));
  }
  removeQuest(questApp) {
    const index = this.quests.findIndex(quest => quest.app === questApp);
    if (index !== -1) {
      const quest = this.quests[index];
      this.quests.splice(index, 1);
      quest.destroy();

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
}
const questManager = new QuestManager();

export default questManager;