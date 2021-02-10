import cameraManager from '../../camera-manager.js';

export const MenuUI = {};

MenuUI.isOpen = false; // boolean
MenuUI.parentRef = null; // HTML element

MenuUI.bind = async () => {
  const response = await fetch("/ui/menu/menu.html");
  const html = await response.text();
  const parent = document.createElement("div");
  parent.id = "MenuUI";
  parent.innerHTML = html;
  document.body.appendChild(parent);
  MenuUI.parentRef = document.getElementById(parent.id)
}

MenuUI.toggle = () => {
  MenuUI.isOpen = !MenuUI.isOpen;
  if (MenuUI.isOpen) {
    MenuUI.parentRef.style.display = "flex";
    document.exitPointerLock();
  } else {
    MenuUI.parentRef.style.display = "none";
    cameraManager.requestPointerLock();
  }
}