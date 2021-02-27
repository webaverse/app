/* eslint-disable camelcase */
import m from '../../lib/external/mithril-dev.js';
import {contracts, runSidechainTransaction} from '../../blockchain.js';
import cameraManager from '../../camera-manager.js';
import {previewExt, previewHost} from '../../constants.js';
import {loginManager} from '../../login.js';
import * as notifications from '../../notifications.js';
import {rigManager} from '../../rig.js';
import storage from '../../storage.js';
import weaponsManager from '../../weapons-manager.js';
import {world} from '../../world.js';

// Tabs enum
const tabs = {
  Build: 0,
  Inventory: 1,
  Prefabs: 2,
  Scene: 3,
};

export const Menu = {
  tabs,
  actions: {
    Close: true,
    Equip: false,
    Spawn: false,
  },
  tabNames: Object.keys(tabs),
  isOpen: false,
  currentItem: null,
  currentItemType: '',
  currentDragged: null,
  currentDraggedType: '',
  currentTab: tabs.Build,
  inventory: [],
  scene: [],
  // selectedItem: {},

  open() {
    this.isOpen = true;
    weaponsManager.clear();
    document.exitPointerLock();
    m.redraw();
    return true;
  },

  close() {
    // Capture pointer and close menu.
    this.isOpen = false;
    cameraManager.requestPointerLock();
    m.redraw();
    return true;
  },

  toggle() {
    return this.isOpen
      ? this.close()
      : this.open();
  },

  addToScene(item) {
    item.image = './assets/logo-flat.png';
    this.scene.push(item);
  },

  fillInventory(inventory) {
    this.inventory = inventory;
  },

  handleKeyDown(e) {
    switch (e.code) {
      case 'KeyE': {
        if (this.actions.Equip) {}
        this.equip();
        break;
      }
      case 'KeyM': {
        this.close();
        break;
      }
      case 'KeyS': {
        this.spawn();
        break;
      }
      case 'Digit0': {
        break;
      }
      case 'Digit1': {
        break;
      }
      case 'Digit2': {
        break;
      }
      case 'Digit3': {
        break;
      }
      case 'Digit4': {
        break;
      }
      case 'Digit5': {
        break;
      }
      case 'Digit6': {
        break;
      }
      case 'Digit7': {
        break;
      }
      case 'Digit8': {
        break;
      }
      case 'Digit9': {
        break;
      }
    }
  },

  handleKeyUp(e) {},

  removeFromScene(instanceID) {
    // TODO: Optimize
    this.scene = this.scene.filter(obj => {
      return obj.instanceId !== instanceID;
    });
  },

  setActions({
    Close = true,
    Equip = false,
    Spawn = false,
  } = {}) {
    Object.assign(this.actions, {Close, Equip, Spawn});
  },

  setCurrentItem(item = null, type = '') {
    if (this.currentItem !== item) {
      this.currentItem = item;
      this.currentItemType = type;
      m.redraw();
    }
  },

  setCurrentDragged(item = null, type = '') {
    if (this.currentDragged !== item) {
      this.currentDragged = item;
      this.currentDraggedType = type;
    }
  },

  setCurrentTab(tab) {
    // Ensure integer index.
    const t = Math.round(tab);

    // Ensure tab exists and assign.
    if (t >= 0 && t < this.tabNames.length) this.currentTab = t;
    m.redraw();
  },

  async setLoadoutItem(index = 0) {
    await loginManager.waitForLoad();
    const address = loginManager.getAddress();
    const loginToken = await storage.get('loginToken');
    const id = this.currentDragged.id;
    const hash = await contracts.back.NFT.methods.getHash(id).call();

    const [
      name,
      ext,
    ] = await Promise.all([
      contracts.back.NFT.methods.getMetadata(hash, 'name').call(),
      contracts.back.NFT.methods.getMetadata(hash, 'ext').call(),
    ]);

    const itemPreview =
      `${previewHost}/${hash}${ext ? ('.' + ext) : ''}/preview.${previewExt}`;

    const loadout = await loginManager.getLoadout(address);

    loadout.splice(index, 1, [
      id + '',
      name,
      ext,
      itemPreview,
    ]);

    await runSidechainTransaction(loginToken.mnemonic)('Account', 'setMetadata', address, 'loadout', JSON.stringify(loadout));

    loginManager.setLoadout(loadout);

    m.redraw();
  },

  spawn() {
    const {currentItem, currentItemType} = this;
    const {deployMesh} = weaponsManager;

    switch (currentItemType) {
      case 'build': {
        try {
          currentItem.cb();
        } catch (e) { console.error(e); }
        return this.close();
      }
      case 'inventory': {
        world.addObject(
          currentItem.id,
          null,
          deployMesh.position,
          deployMesh.quaternion,
        );

        return this.close();
      }
      case 'prefab': {
        let {start_url, filename, content} = currentItem;

        // Create blob URL.
        if (!start_url && filename && content) {
          const blob = new Blob([content], {
            type: 'application/octet-stream',
          });
          start_url = URL.createObjectURL(blob);
          start_url += '/' + filename;
        }

        world.addObject(
          start_url,
          null,
          deployMesh.position,
          deployMesh.quaternion,
        );

        return this.close();
      }
      default: {
        return true;
      }
    }
  },

  async equip() {
    const {currentItemType} = this;

    if (
      currentItemType &&
      currentItemType !== 'build' &&
      currentItemType !== 'prefabs'
    ) {
      const {currentItem} = this;

      // Only equip items not in use.
      const used = currentItem.useAux
        ? currentItem.useAux(rigManager.localRig.aux)
        : false;

      if (!used) {
        const notification = notifications.addNotification(`\
        <i class="icon fa fa-user-ninja"></i>
        <div class=wrap>
          <div class=label>Getting changed</div>
          <div class=text>
            The system is updating your avatar...
          </div>
          <div class=close-button>✕</div>
        </div>
      `, {
          timeout: Infinity,
        });

        try {
          await loginManager.setAvatar(currentItem.contentId);
          this.close();
        } catch (e) {
          console.error(e);
        } finally {
          notifications.removeNotification(notification);
        }
      }
    }
  },
};
