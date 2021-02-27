import m from '../../../../lib/external/mithril-dev.js';
import {Tile} from './components/Tile/index.js';

const style = {
  body: '.m-menu_browser',
  decal: 'svg.m-menu_decal',
  list: '.m-menu_browser_list',
  title: '.m-menu_browser_title',
};

export function Browser() {
  return {
    view({attrs: {model, type}}) {
      return m(
        style.body,
        [
          // Search/Filter
          m(style.title, [
            m(
              style.decal,
              m(
                'use',
                {'xlink:href': './ui/assets/sprites.svg#tab-decal-3'},
              ),
            ),
            'Items',
          ]),
          m(
            style.list,
            model.items.map((item, index) =>
              m(Tile, {
                index,
                item,
                model,
                type,
                key: item,
              }),
            ),
          ),
        ],
      );
    },
  };
}
