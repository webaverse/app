import m from '../../../../../../lib/external/mithril-dev.js';
import {Menu} from '../../../../../models/Menu/index.js';

const style = {
  icon: '.m-menu_browser_tile_icon',
  name: '.m-menu_browser_tile_name',
  tile: '.m-menu_browser_tile',
  tile__highlight: '.m-menu_browser_tile--highlight',
  tile__lighter: '.m-menu_browser_tile--lighter',
  wrapper: '.m-menu_browser_tile_wrapper',
};

export function Tile({attrs: {index, item, model, type}}) {
  const onclick = e => {
    e.stopPropagation();
    model.select(index);
    // attrs.item.cb();
  };
  const onmouseenter = e => model.setHover(index);
  const onmouseleave = e => model.setHover(-1);

  const ondragstart = e => {
    Menu.setCurrentDragged(item, type);
    model.select(index);
  };

  const ondragend = e => {
    if (e.dataTransfer.dropEffect === 'none') {
      Menu.setCurrentDragged();
    }
  };

  return {
    view({attrs: {item}}) {
      return m(
        style.wrapper,
        {
          draggable: true,
          onclick,
          ondragstart,
          ondragend,
          onmouseenter,
          onmouseleave,
        },
        m(
          `${style.tile}${
            model.currentHover === item
              ? style.tile__highlight
              : model.currentSelected === item
                ? model.currentHover
                  ? style.tile__lighter
                  : style.tile__highlight
                : ''
          }`,
          [
            /^fa-/.test(item.icon)
              ? m(`i.m-icon fa ${item.icon} ${style.icon}`)
              : m(
                `img.m-icon${style.icon}`,
                {src: item.icon || item.image, draggable: false},
              ),

            m(style.name, item.name || item.instanceId),
          ],
        ),
      );
    },
  };
}
