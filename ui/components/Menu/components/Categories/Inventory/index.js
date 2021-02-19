import m from '../../../../../../lib/external/mithril-dev.js';
import model from '../Prefabs/model.js';

const style = {
  body: 'main.m-menu_category_viewA',
  split: '.m-menu_category_split',
};

export function Inventory() {
  return {
    oncreate() { model.setIndex(1); },
    view() {
      return m(
        style.body,
        'Inventory',
      );
    },
  };
}
