import m from '../../lib/external/mithril-dev.js';
import cameraManager from '../../camera-manager.js';
// import {menuState} from '../../mithril-ui_old/store/state.js';

// Tabs enum
const tabs = {
  Build: 0,
  Inventory: 1,
  Prefabs: 2,
  Scene: 3,
};

export const Menu = {
  tabs,
  tabNames: Object.keys(tabs),
  isOpen: true,
  currentTab: tabs.Build,
  inventory: [],
  // selectedItem: {},

  /* Toggle */

  open() {
    // Release pointer and open menu.
    this.isOpen = true;
    document.exitPointerLock();
    m.redraw();
  },

  close() {
    // Capture pointer and close menu.
    this.isOpen = false;
    cameraManager.requestPointerLock();
    m.redraw();
  },

  toggle() {
    this.isOpen
      ? this.close()
      : this.open();
  },

  /* View */

  setCurrentTab(tab) {
    // Ensure integer index.
    const t = Math.round(tab);

    // Ensure tab exists and assign.
    if (t >= 0 && t < this.tabNames.length) this.currentTab = t;
    m.redraw();
  },

  fillInventory(inventory) {
    this.inventory = inventory;
  },

  /* setInventory: (items) => {
    menuState.inventory = items;
    m.redraw();
  },
  setSelectedItem: (item) => {
    menuState.selectedItem = item;
    m.redraw();
  }, */
};
