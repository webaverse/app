import m from '../../../../lib/external/mithril-dev.js';
import {enumerateValue} from '../../../../lib/array.js';
import {Slot} from './components/Slot/index.js';
import {loginManager} from '../../../../login.js';

const style = {
  body: '.m-menu_loadout',
  container: '.m-menu_loadout_slot_container',
  decal: 'svg.m-menu_decal',
  title: '.m-menu_loadout_title',
};

export function Loadout() {
  let isLoaded = false;
  let loadout = [];

  return {
    async oninit() {
      await loginManager.waitForLoad();
      isLoaded = true;

      loadout = loginManager.getLoadout() || enumerateValue(8, null);
      m.redraw();
    },

    async onupdate() {
      if (isLoaded) loadout = loginManager.getLoadout();
    },

    view({attrs: {model}}) {
      return m(
        style.body,
        [
          m(style.title, [
            m(
              style.decal,
              m(
                'use',
                {'xlink:href': './ui/assets/sprites.svg#tab-decal-2'},
              ),
            ),
            'Loadout',
          ]),
          m(style.container, loadout.map((item, index) =>
            m(Slot, {
              index,
              item,
              model,
            }),
          )),
        ],
      );
    },
  };
}
