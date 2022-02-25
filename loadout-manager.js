import {localPlayer} from './players.js';
import {createHotbarRenderer} from './hotbar.js';
import {createInfoboxRenderer} from './infobox.js';
import {createObjectSprite} from './object-spriter.js';
import {hotbarSize, infoboxSize} from './constants.js';

const numSlots = 8;

class LoadoutManager extends EventTarget {
  constructor() {
    super();

    this.apps = Array(numSlots).fill(null);
    this.hotbarRenderers = [];
    this.infoboxRenderer = null;
    this.selectedIndex = -1;
  
    localPlayer.addEventListener('wearupdate', e => {
      const {app, wear} = e;

      this.ensureRenderers();
      if (wear) {
        const nextIndex = this.getNextFreeIndex();
        if (nextIndex !== -1) {
          const spritesheet = createObjectSprite(app);

          const hotbarRenderer = this.hotbarRenderers[nextIndex];
          hotbarRenderer.setSpritesheet(spritesheet);
          this.infoboxRenderer.setSpritesheet(spritesheet);

          this.apps[nextIndex] = app;

          this.setSelectedIndex(nextIndex);
        }
      } else {
        for (let i = 0; i < this.apps.length; i++) {
          const a = this.apps[i];
          if (a === app) {
            const hotbarRenderer = this.hotbarRenderers[i];
            hotbarRenderer.setSpritesheet(null);
            if (i === this.selectedIndex) {
              this.infoboxRenderer.setSpritesheet(null);
            }

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
      /* const renderer = getRenderer();
      const size = hotbarSize * renderer.getPixelRatio(); */
      const size = hotbarSize * window.devicePixelRatio;

      for (let i = 0; i < numSlots; i++) {
        const selected = i === this.selectedIndex;
        const hotbarRenderer = createHotbarRenderer(size, size, selected);
        this.hotbarRenderers.push(hotbarRenderer);
      }
    }
    if (!this.infoboxRenderer) {
      this.infoboxRenderer = createInfoboxRenderer(infoboxSize, infoboxSize);
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
  }
  getNextFreeIndex() {
    this.ensureRenderers();
    for (let i = 0; i < this.hotbarRenderers.length; i++) {
      if (!this.apps[i]) {
        return i;
      }
    }
    return -1;
  }
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