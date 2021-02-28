import m from '../../../../lib/external/mithril-dev.js';
import {Menu} from '../../../models/Menu/index.js';
import {Action} from './components/Action/index.js';

const style = {
  body: '.m-menu_actions',
};

const actions = [
  {name: 'Spawn', key: 'S', callback: () => Menu.spawn()},
  {name: 'Equip', key: 'E', callback: () => Menu.equip()},
  {name: 'Close', key: 'M', callback: () => Menu.close()},
];

export function Actions() {
  return {
    view({attrs: {model}}) {
      return m(
        style.body,
        actions.map(action =>
          m(Action, {action, key: action.name}),
        ),
      );
    },
  };
}
