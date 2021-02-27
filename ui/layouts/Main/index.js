/* eslint-disable camelcase */
import m from '../../../lib/external/mithril-dev.js';
import {Menu as M_Menu} from '../../models/Menu.js';
import {Menu} from '../../pages/Menu/index.js';

const style = {
  body: '.m-menu_main',
};

export function Main() {
  return {
    view() {
      return m(style.body, M_Menu.isOpen && m(Menu));
    },
  };
}
