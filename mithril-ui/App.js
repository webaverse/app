import {Menu} from './menu/Menu.js'
import {appState, menuState} from './store/state.js';

export const App = (initialVnode) => {
  return {
    oninit: (vnode) => {
      console.log("Hello Mithrel", appState)
    },
    onupdate: (vnode) => {
      console.log("App Updated", appState)
    },
    view: (vnode) => {
      return (
        menuState.isOpen && m(Menu)
      )
    }
  };
};