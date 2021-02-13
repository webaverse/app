import {actionSlotsState, appState, menuState} from './state.js';
import cameraManager from '../../camera-manager.js';

export const appActions = {

};

export const menuActions = {
  setIsOpen: (isOpen) => {
    isOpen ? document.exitPointerLock() : cameraManager.requestPointerLock();
    menuState.isOpen = isOpen;
    m.redraw();
  },
  setActiveTab: (tab) => {
    menuState.activeTab = tab;
    m.redraw();
  },
  setInventory: (items) => {
    menuState.inventory = items;
    m.redraw();
  },
  setSelectedItem: (item) => {
    menuState.selectedItem = item;
    m.redraw();
  },
};

export const actionSlotsActions = {
  setActionSlot: (slot) => {
    const slotIndex = actionSlotsState.slots.findIndex(s => s.id === slot.id);
    actionSlotsState.slots[slotIndex] = slot;
    m.redraw();
  },
}