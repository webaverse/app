import m from '../../../../../lib/external/mithril-dev.js';
import {Tile} from './components/Tile/index.js';

const style = {
  body: '.m-menu_browser',
  list: '.m-menu_browser_list',
};

export function Browser() {
  return {
    view({attrs: {model}}) {
      return m(
        style.body,
        [
          // Search/Filter
          m(
            style.list,
            model.items.map((item, index) => m(Tile, {index, item, model})),
          ),
        ],
      );
    },
  };
}
