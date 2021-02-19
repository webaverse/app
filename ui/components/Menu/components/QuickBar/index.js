import m from '../../../../../lib/external/mithril-dev.js';

const style = {
  body: '.m-menu_quickbar',
};

export function QuickBar() {
  return {
    view() {
      return m(
        style.body,
        'QuickBar',
      );
    },
  };
}
