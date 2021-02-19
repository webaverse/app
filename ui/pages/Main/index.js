/* eslint-disable camelcase */
import m from '../../../lib/external/mithril-dev.js';
import {Menu} from '../../components/Menu/index.js';
import {Menu as M_Menu} from '../../models/Menu.js';

export function Main() {
  return {
    view() {
      return M_Menu.isOpen && m(Menu);
    },
  };
}
