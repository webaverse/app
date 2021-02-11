import './mithril-dev-2.0.4.js';
import {Menu} from './menu/menu.js'

const App = (initialVnode) => {
  return {
    oninit: (vnode) => {
      console.log("Hello Mithrel")
    },
    view: (vnode) => {
      return m("div", { class: "mithril-ui" }, [
        m(Menu)
      ]);
    }
  };
};

export function mithrilInit() {
  m.mount(document.getElementById("mithril-root"), App);
};