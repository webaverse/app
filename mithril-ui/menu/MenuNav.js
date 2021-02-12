import {menuActions} from '../store/actions.js';
import {menuState} from '../store/state.js';

const navTabs = ["Inventory", "Scene", "Avatar"];

export const MenuNav = (initialVnode) => {
  return {
    view: (vnode) => {
      return m("nav", { class: "MenuNav" }, [
        navTabs.map(tab => {
          return m("span", {
            class: `MenuNav-item ${menuState.activeTab === tab ? "active" : ""}`,
            onclick: () => menuActions.setActiveTab(tab)
          }, tab);
        })
      ]);
    }
  };
};