/* eslint-disable camelcase */
import m from '../../../lib/external/mithril-dev.js';

import {Build} from './components/Categories/Build/index.js';
import {Inventory} from './components/Categories/Inventory/index.js';
import {Prefabs} from './components/Categories/Prefabs/index.js';
import {Scene} from './components/Categories/Scene/index.js';

import {Footer} from './components/Footer/index.js';
import {Nav} from './components/Nav/index.js';

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
        m(Footer),
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
