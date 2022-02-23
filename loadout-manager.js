import {/*HotbarRenderer, */createHotbarRenderer} from './hotbar.js';
// import {getRenderer} from './renderer.js';
import {localPlayer} from './players.js';
import metaversefileApi from './metaversefile-api.js';
import {hotbarSize} from './constants.js';

const numSlots = 8;
class LoadoutManager extends EventTarget {
  constructor() {
    super();

    this.hotbarRenderers = [];
    this.selectedIndex = 0;
  
    localPlayer.addEventListener('wearupdate', e => {
      // console.log('wear update', e);
      const {app, wear} = e;

      this.ensureHotbarRenderers();
      if (this.selectedIndex !== -1) {
        const hotbarRenderer = this.hotbarRenderers[this.selectedIndex];
        if (wear) {
          hotbarRenderer.setApp(app);
        } else {
          hotbarRenderer.setApp(null);
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
  setSelectedIndex(index) {
    if (index !== this.selectedIndex) {
      this.selectedIndex = index;
    } else {
      this.selectedIndex = -1;
    }

    this.ensureHotbarRenderers();
    for (let i = 0; i < this.hotbarRenderers.length; i++) {
      this.hotbarRenderers[i].setSelected(i === this.selectedIndex);
    }
  }
  update(timestamp, timeDiff) {
    for (const hotbarRenderer of this.hotbarRenderers) {
      hotbarRenderer.update(timestamp, timeDiff);
    }
  }
}
const loadoutManager = new LoadoutManager();

export default loadoutManager;