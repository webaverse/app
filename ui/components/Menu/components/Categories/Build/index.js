import m from '../../../../../../lib/external/mithril-dev.js';
import {Browser} from '../../Browser/index.js';
import {Details} from '../../Details/index.js';
import {QuickBar} from '../../QuickBar/index.js';
import model from './model.js';

const style = {
  body: 'main.m-menu_category_viewA',
  split: '.m-menu_category_split',
};

export function Build() {
  return {
    oncreate() { model.setIndex(-1); },
    view() {
      return m(
        style.body,
        m(style.split, [
          m(Details, {model}),
          m('div', [
            m(Browser, {model}),
            m(QuickBar),
          ]),
        ]),
      );
    },
  };
}
