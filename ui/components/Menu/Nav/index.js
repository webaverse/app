import m from '../../../../lib/external/mithril-dev.js';
import {Menu} from '../../../models/Menu/index.js';

const style = {
  nav: {
    body: 'nav.m-menu_nav',
  },

  tab: {
    body: '.m-menu_nav_tab',
    body__active: '.m-menu_nav_tab--active',
    decal: 'svg.m-menu_nav_tab_decal',
    text: '.m-menu_nav_tab_text',
  },
};

export function Nav() {
  return {
    view() {
      return m(style.nav.body, Menu.tabNames.map((t, i) =>
        m(Tab, {key: t, name: t, tab: i}),
      ));
    },
  };
}

function Tab() {
  return {
    view({attrs}) {
      return m(
          `${style.tab.body}${
            Menu.currentTab === attrs.tab
              ? style.tab.body__active
              : ''
          }`,
          {onclick() { Menu.setCurrentTab(attrs.tab); }},
          [
            m(style.tab.text, attrs.name),
            m(
              style.tab.decal,
              m(
                'use',
                {
                  'xlink:href':
                    // Currently there are 5 unique tab decals.
                    `./ui/assets/sprites.svg#tab-decal-${attrs.tab % 5}`,
                },
              ),
            ),
          ],
      );
    },
  };
}
