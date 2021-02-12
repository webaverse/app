import {MenuNav} from './MenuNav.js';

export const Menu = (initialVnode) => {
  return {
    view: (vnode) => {
      return m("div", { class: "Menu-container" }, [
        m("div", { class: "Menu-content" }, [
          m(MenuNav),
        ]),
      ]);
    }
  };
};