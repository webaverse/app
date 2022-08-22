import {partyManager} from './party-manager.js';
import {playersManager} from './players-manager.js';
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
    this.removeLastWearUpdateFn = null;

    const playerSelectedFn = e => {
      const {
        player,
      } = e.data;

      this.bindPlayer(player);
    };

    const playerDeselectedFn = e => {
      const {
        player,
      } = e.data;

      this.unbindPlayer(player);
    };

    partyManager.addEventListener('playerselected', playerSelectedFn);
    partyManager.addEventListener('playerdeselected', playerDeselectedFn);
    this.removeListenerFn = () => {
      partyManager.removeEventListener('playerselected', playerSelectedFn);
      partyManager.removeEventListener('playerdeselected', playerDeselectedFn);
    };
    
    // this is the initial event for the first player
    const localPlayer = playersManager.getLocalPlayer();
    this.bindPlayer(localPlayer);
  }
  bindPlayer(player) {
    const localPlayer = player;
    const wearupdate = e => {
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
    };
    localPlayer.addEventListener('wearupdate', wearupdate);
    this.removeLastWearUpdateFn = () => {localPlayer.removeEventListener('wearupdate', wearupdate);};
  }

  unbindPlayer(player) {
    if (this.removeLastWearUpdateFn) {
      this.removeLastWearUpdateFn();
      this.removeLastWearUpdateFn = null;
    }
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