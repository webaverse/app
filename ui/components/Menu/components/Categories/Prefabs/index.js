import m from '../../../../../../lib/external/mithril-dev.js';
import model from '../Prefabs/model.js';
import {Browser} from '../../Browser/index.js';
import {Details} from '../../Details/index.js';
import {QuickBar} from '../../QuickBar/index.js';

const style = {
  body: 'main.m-menu_category_viewA',
  split: '.m-menu_category_split',
};

export function Prefabs() {
  return {
    oncreate() { model.setIndex(1); },
    view() {
      return m(
        style.body,
        m(style.split, [
          m(Details, {model}),
          m(Browser, {model}),
          m(QuickBar),
        ]),
      );
    },
  };
}
