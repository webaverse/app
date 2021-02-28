import m from '../../../../../../lib/external/mithril-dev.js';
import {Menu} from '../../../../../models/Menu/index.js';

const style = {
  body: '.m-menu_actions_action',
  action_decal: '.m-menu_actions_action_decal',
  decal: 'svg.m-menu_decal',
  key: 'span.m-menu_actions_action_key',
  name: 'span.m-menu_actions_action_name',
};

const ondragover = e => e.preventDefault();

export function Action({attrs: {action}}) {
  const ondrop = e => {
    e.preventDefault();
    action.callback();
  };

  return {
    view({attrs: {action}}) {
      return Menu.actions[action.name] && m(
        style.body,
        {
          ondragover,
          ondrop,
          onclick: action.callback,
        },
        [
          m(
            `${style.decal}${style.action_decal}`,
            m(
              'use',
              {'xlink:href': './ui/assets/sprites.svg#tab-decal-3'},
            ),
          ),
          m(style.key, action.key),
          m(style.name, action.name),
        ],
      );
    },
  };
}
