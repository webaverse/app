import m from '../../../../../../../lib/external/mithril-dev.js';

const style = {
  body: '.m-menu_browser_tile',
  icon: '.m-menu_browser_tile_icon',
  name: '.m-menu_browser_tile_name',
};

export function Tile({attrs}) {
  const onclick = e => { attrs.item.cb(); };
  const onmouseleave = e => { attrs.model.setIndex(-1); };
  const onmouseenter = e => { attrs.model.setIndex(attrs.index); };

  return {
    view({attrs: {item}}) {
      return m(
        style.body,
        {onclick, onmouseleave, onmouseenter},
        [
          /^fa-/.test(item.icon)
            ? m(`i.m-icon fa ${item.icon} ${style.icon}`)
            : m(`img.m-icon ${style.icon}`, {src: item.icon}),

          m(style.name, item.name),
        ],
      );
    },
  };
}
