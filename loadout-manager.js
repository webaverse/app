import {getLocalPlayer} from './players.js';
import {LoadoutRenderer} from './loadout-renderer.js';
import {InfoboxRenderer} from './infobox.js';
import {createObjectSprite} from './object-spriter.js';
import {hotbarSize, infoboxSize} from './constants.js';

const numSlots = 8;

const appSpritesheetCache = new WeakMap();
const _getAppSpritesheet = app => {
  let spritesheet = appSpritesheetCache.get(app);
  if (!spritesheet) {
    spritesheet = createObjectSprite(app);
    appSpritesheetCache.set(app, spritesheet);
  }
  return spritesheet;
};

class LoadoutManager extends EventTarget {
  constructor() {
    super();

    this.apps = Array(numSlots).fill(null);
    this.hotbarRenderers = [];
    this.infoboxRenderer = null;
    this.selectedIndex = -1;
  
    const localPlayer = getLocalPlayer();
    this.addWearUpdateEventListener(localPlayer);
  }
  addWearUpdateEventListener(player) {
    player.addEventListener('wearupdate', e => {
      const {app, wear, loadoutIndex} = e;

      this.ensureRenderers();
      if (wear) {
        this.apps[loadoutIndex] = app;
        this.setSelectedIndex(loadoutIndex);
      } else {
        for (let i = 0; i < this.apps.length; i++) {
          const a = this.apps[i];
          if (a === app) {
            const hotbarRenderer = this.hotbarRenderers[i];
            hotbarRenderer.setSpritesheet(null);

            this.apps[i] = null;

            const nextIndex = this.getNextUsedIndex();
            this.setSelectedIndex(nextIndex);
            break;
          }
        }
      }
    });
  }
  ensureRenderers() {
    if (this.hotbarRenderers.length === 0) {
      const size = hotbarSize * window.devicePixelRatio;

      for (let i = 0; i < numSlots; i++) {
        const selected = i === this.selectedIndex;
        const hotbarRenderer = new LoadoutRenderer(size, size, selected);
        this.hotbarRenderers.push(hotbarRenderer);
      }
    }
    if (!this.infoboxRenderer) {
      this.infoboxRenderer = new InfoboxRenderer(infoboxSize, infoboxSize);
    }
  }
  getHotbarRenderer(index) {
    this.ensureRenderers();
    return this.hotbarRenderers[index];
  }
  getInfoboxRenderer() {
    this.ensureRenderers();
    return this.infoboxRenderer;
  }
  getSelectedApp() {
    this.ensureRenderers();
    
    if (this.selectedIndex !== -1) {
      return this.apps[this.selectedIndex];
    } else {
      return null;
    }
  }
  setSelectedIndex(index) {
    this.ensureRenderers();

    if (index === this.selectedIndex) {
      index = -1;
    }

    if (index === -1 || this.apps[index]) {
      for (let i = 0; i < this.hotbarRenderers.length; i++) {
        this.hotbarRenderers[i].setSelected(i === index);
      }
      this.selectedIndex = index;
    }

    if (this.selectedIndex !== -1) {
      const app = this.apps[this.selectedIndex];
      const spritesheet = _getAppSpritesheet(app);
      
      const hotbarRenderer = this.hotbarRenderers[this.selectedIndex];
      hotbarRenderer.setSpritesheet(spritesheet);
      this.infoboxRenderer.setSpritesheet(spritesheet);
    }

    this.dispatchEvent(new MessageEvent('selectedchange', {
      data: {
        index,
        app: this.apps[index],
      },
    }));
  }
  /* getNextFreeIndex() {
    this.ensureRenderers();
    for (let i = 0; i < this.hotbarRenderers.length; i++) {
      if (!this.apps[i]) {
        return i;
      }
    }
    return -1;
  } */
  getNextUsedIndex() {
    this.ensureRenderers();
    for (let i = 0; i < this.hotbarRenderers.length; i++) {
      if (this.apps[i]) {
        return i;
      }
    }
    return -1;
  }
  update(timestamp, timeDiff) {
    for (let i = 0; i < this.hotbarRenderers.length; i++) {
      this.hotbarRenderers[i].update(timestamp, timeDiff, i);
    }
    if (this.infoboxRenderer !== null) {
      this.infoboxRenderer.update(timestamp, timeDiff);
    }
  }
}

const loadoutManager = new LoadoutManager();

export default loadoutManager;

export class NpcLoadoutManager extends EventTarget {
  constructor(npcPlayer) {
    super();

    this.apps = Array(numSlots).fill(null);
    this.selectedIndex = -1;

    npcPlayer.addEventListener('wearupdate', e => {
      const {app, wear, loadoutIndex} = e;

      if (wear) {
        this.apps[loadoutIndex] = app;
        this.setSelectedIndex(loadoutIndex);
      } else {
        for (let i = 0; i < this.apps.length; i++) {
          const a = this.apps[i];
          if (a === app) {
            this.apps[i] = null;
            const nextIndex = this.getNextUsedIndex();
            this.setSelectedIndex(nextIndex);
            break;
          }
        }
      }
    });
  }
  getSelectedApp() {
    if (this.selectedIndex !== -1) {
      return this.apps[this.selectedIndex];
    } else {
      return null;
    }
  }
  setSelectedIndex(index) {
    if (index === -1 || this.apps[index]) {
      this.selectedIndex = index;
    }
    this.dispatchEvent(new MessageEvent('selectedchange', {
      data: {
        index,
        app: this.apps[index],
      },
    }));
  }
}