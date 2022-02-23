import {/*HotbarRenderer, */createHotbarRenderer} from './hotbar.js';
// import {getRenderer} from './renderer.js';
import {localPlayer} from './players.js';
import {hotbarSize} from './constants.js';

const numSlots = 8;
class LoadoutManager extends EventTarget {
  constructor() {
    super();

    this.hotbarRenderers = [];
    this.selectedIndex = -1;
  
    localPlayer.addEventListener('wearupdate', e => {
      // console.log('wear update', e);
      const {app, wear} = e;

      this.ensureHotbarRenderers();
      if (wear) {
        const nextIndex = this.getNextFreeIndex();
        if (nextIndex !== -1) {
          const hotbarRenderer = this.hotbarRenderers[nextIndex];
          hotbarRenderer.setApp(app);

          this.setSelectedIndex(nextIndex);
        }
      } else {
        for (let i = 0; i < this.hotbarRenderers.length; i++) {
          const hotbarRenderer = this.hotbarRenderers[i];
          if (hotbarRenderer.app === app) {
            hotbarRenderer.setApp(null);

            const nextIndex = this.getNextUsedIndex();
            this.setSelectedIndex(nextIndex);
            break;
          }
        }
      }
    });
  }
  ensureHotbarRenderers() {
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
  }
  getHotbarRenderer(index) {
    this.ensureHotbarRenderers();
    return this.hotbarRenderers[index];
  }
  getSelectedApp() {
    this.ensureHotbarRenderers();
    
    if (this.selectedIndex !== -1) {
      return this.hotbarRenderers[this.selectedIndex].app;
    } else {
      return null;
    }
  }
  setSelectedIndex(index) {
    this.ensureHotbarRenderers();

    if (index === this.selectedIndex) {
      index = -1;
    }

    if (index === -1 || this.hotbarRenderers[index].app) {
      for (let i = 0; i < this.hotbarRenderers.length; i++) {
        this.hotbarRenderers[i].setSelected(i === index);
      }
      this.selectedIndex = index;
    }
  }
  getNextFreeIndex() {
    this.ensureHotbarRenderers();
    for (let i = 0; i < this.hotbarRenderers.length; i++) {
      if (!this.hotbarRenderers[i].app) {
        return i;
      }
    }
    return -1;
  }
  getNextUsedIndex() {
    this.ensureHotbarRenderers();
    for (let i = 0; i < this.hotbarRenderers.length; i++) {
      if (this.hotbarRenderers[i].app) {
        return i;
      }
    }
    return -1;
  }
  update(timestamp, timeDiff) {
    for (let i = 0; i < this.hotbarRenderers.length; i++) {
      this.hotbarRenderers[i].update(timestamp, timeDiff, i);
    }
  }
}
const loadoutManager = new LoadoutManager();

export default loadoutManager;