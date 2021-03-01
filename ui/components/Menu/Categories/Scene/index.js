import m from '../../../../../lib/external/mithril-dev.js';
import {Menu} from '../../../../models/Menu/index.js';
import {Actions} from '../../Actions/index.js';
import {Browser} from '../../Browser/index.js';
import {Details} from '../../Details/index.js';
import {Loadout} from '../../Loadout/index.js';
import Model from '../model.js';

const style = {
  body: 'main.m-menu_category_viewA',
  split: '.m-menu_category_split',
  split_column: '.m-menu_category_split_column',
};

const model = new Model({items: Menu.scene});

export function Scene() {
  const onclick = () => model.reset();
  Menu.setCurrentItem();

  return {
    onupdate() {
      if (model.items.length !== Menu.scene.length) {
        model.setItems(Menu.scene);
        m.redraw();
      }

      Menu.setCurrentItem(model.current, 'scene');
    },

    async oninit() {
      Menu.setActions({Equip: true});
      model.reset();
      model.setItems(Menu.scene);
    },

    view() {
      return m(
        style.body,
        {onclick},
        [
          m(style.split, [
            m(style.split_column, [
              m(Browser, {model, type: 'scene'}),
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
