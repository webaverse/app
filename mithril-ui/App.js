import {Menu} from './menu/Menu.js'
import {menuState} from './store/state.js';

export const App = (initialVnode) => {
  return {
    view: (vnode) => {
      return (
        menuState.isOpen && m(Menu)
      )
    }
  };
};