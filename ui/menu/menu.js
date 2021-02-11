import cameraManager from '../../camera-manager.js';
import {inventoryItems} from './exampleInventory.js';

export const MenuUI = {};

MenuUI.parentRef = null; // HTML element
MenuUI.state = {
  isOpen: false,
  selectedPage: 'inventory',
};

MenuUI.bind = async () => {
  const response = await fetch(`/ui/menu/menu-${MenuUI.state.selectedPage}.html`);
  const html = await response.text();
  const parent = document.createElement("div");
  parent.id = "MenuUI";
  parent.innerHTML = html;
  document.body.appendChild(parent);
  MenuUI.parentRef = document.getElementById(parent.id);
  MenuUI.bindListeners();
};

MenuUI.loadInventory = () => {
  const listContainer = document.getElementById("MenuUI-items-list");
  const cardsHTML = inventoryItems.map(item => {
    return `
      <div class="MenuUI-items-list-card">
        <img class="MenuUI-items-list-card-image" src="${item.preview_url}">
      </div>
    `;
  }).join(" ");
  listContainer.innerHTML = cardsHTML;
}

MenuUI.toggle = () => {
  MenuUI.isOpen = !MenuUI.isOpen;
  if (MenuUI.isOpen) {
    MenuUI.parentRef.style.display = "flex";
    document.exitPointerLock();
    MenuUI.loadInventory();
  } else {
    MenuUI.parentRef.style.display = "none";
    cameraManager.requestPointerLock();
  }
};

// UI functions, onClick, onChange, etc.

const handlePageChange = (e) => {
  MenuUI.state.activePage = e.target.attributes["name"].value;
}

MenuUI.bindListeners = () => {
  switch (MenuUI.state.selectedPage) {
    case "inventory":
      const headerItems = document.getElementsByClassName("MenuUI-header-item");
      Array.from(headerItems).forEach(item => {
        item.addEventListener('click', handlePageChange);
      });
      break;
    default:
      break;
  }
};