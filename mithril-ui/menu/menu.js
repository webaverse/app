import { MenuNav } from './MenuNav.js';
import { menuState } from '../store/state.js';
import { Inventory } from './Inventory.js';

const getTabContent = () => {
  switch (menuState.activeTab) {
    case "Inventory":
      return Inventory;
    default:
      return "";
  };
};

export const Menu = (initialVnode) => {
  return {
    view: (vnode) => {
      return m("div", { class: "Menu-container" }, [
        m("div", { class: "Menu-content" }, [
          m(MenuNav),
          m(getTabContent()),
        ]),
      ]);
    }
  };
};