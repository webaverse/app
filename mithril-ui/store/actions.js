import {appState, menuState} from './state.js';
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
  }
};