import {menuActions} from '../store/actions.js';
import {menuState} from '../store/state.js';

export const Menu = (initialVnode) => {
  return {
    view: (vnode) => {
      return m("div", { class: "Menu-container" }, [
        m("div", { class: "Menu-content" }, [
          m("h1", "Menu"),
          m("button", { onclick: () => menuActions.setIsOpen(false) }, "Close Window")
        ]),
      ]);
    }
  };
};