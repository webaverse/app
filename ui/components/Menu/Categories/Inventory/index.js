import m from '../../../../../lib/external/mithril-dev.js';
import {loginManager} from '../../../../../login.js';
import {Actions} from '../../Actions/index.js';
import {Browser} from '../../Browser/index.js';
import {Details} from '../../Details/index.js';
import {Loadout} from '../../Loadout/index.js';
import Model from '../model.js';
import {Menu} from '../../../../models/Menu/index.js';

const style = {
  body: 'main.m-menu_category_viewA',
  split: '.m-menu_category_split',
  split_column: '.m-menu_category_split_column',
};

const model = new Model({items: []});

export function Inventory() {
  const onclick = () => model.reset();
  Menu.setCurrentItem();

  return {
    onupdate() { Menu.setCurrentItem(model.current, 'inventory'); },

    async oninit() {
      Menu.setActions({Equip: true, Spawn: true});
      await loginManager.waitForLoad();
      model.reset();
      model.setItems(loginManager.getInventory());
      m.redraw();
    },

    view() {
      return m(
        style.body,
        {onclick},
        [
          m(style.split, [
            m(style.split_column, [
              m(Browser, {model, type: 'inventory'}),
              m(Loadout, {model}),
            ]),
            m(Details, {model}),
          ]),
          m(Actions),
        ],
      );
    },
  };
}
