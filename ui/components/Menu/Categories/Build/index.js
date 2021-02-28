import m from '../../../../../lib/external/mithril-dev.js';
import {Menu} from '../../../../models/Menu/index.js';
import {Actions} from '../../Actions/index.js';
import {Browser} from '../../Browser/index.js';
import {Details} from '../../Details/index.js';
import {Loadout} from '../../Loadout/index.js';
import model from './model.js';

const style = {
  body: 'main.m-menu_category_viewA',
  split: '.m-menu_category_split',
  split_column: '.m-menu_category_split_column',
};

export function Build() {
  const onclick = () => model.reset();
  Menu.setCurrentItem();

  return {
    onupdate() { Menu.setCurrentItem(model.current, 'build'); },
    oninit() {
      Menu.setActions({Spawn: true});
      model.reset();
    },

    view() {
      return m(
        style.body,
        {onclick},
        [
          m(style.split, [
            m(style.split_column, [
              m(Browser, {model, type: 'build'}),
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
