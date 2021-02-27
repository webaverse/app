/* eslint-disable camelcase */
import m from '../../../lib/external/mithril-dev.js';
import {Build} from '../../components/Menu/Categories/Build/index.js';
import {Inventory} from '../../components/Menu/Categories/Inventory/index.js';
import {Prefabs} from '../../components/Menu/Categories/Prefabs/index.js';
import {Scene} from '../../components/Menu/Categories/Scene/index.js';
import {Nav} from '../../components/Menu/Nav/index.js';
import {Menu as M_Menu} from '../../models/Menu.js';

export const style = {
  body: '.m-menu',
  key: 'span.m-menu_key',
};

export function Menu() {
  return {
    view() {
      return m(style.body, [
        m(Nav),
        m(getCategory()),
      ]);
    },
  };
}

function getCategory() {
  switch (M_Menu.currentTab) {
    case M_Menu.tabs.Build: return Build;
    case M_Menu.tabs.Inventory: return Inventory;
    case M_Menu.tabs.Prefabs: return Prefabs;
    case M_Menu.tabs.Scene: return Scene;
    default: return Inventory;
  }
}
