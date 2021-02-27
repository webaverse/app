import m from '../../../../../../lib/external/mithril-dev.js';
import {Menu} from '../../../../../models/Menu.js';

const style = {
  body: '.m-menu_loadout_slot',
  number: '.m-menu_loadout_slot_number',
};

function ondragover(e) {
  // Allow drop on inventory items.
  if (Menu.currentDraggedType === 'inventory') e.preventDefault();
}

export function Slot({attrs: {index}}) {
  // Item can change without slot being remounted, so we wrap it.
  const ondrop = item => e => {
    e.preventDefault();
    Menu.setLoadoutItem(index);
    // Optimistically set the preview image.
    item[3] = Menu.currentDragged.image;
  };

  return {
    view({attrs: {index, item}}) {
      return m(
        style.body,
        {
          ondragover,
          ondrop: ondrop(item),
          style: `${item ? `background-image: url(${item[3]});` : ''}`,
          title: item[1] || `#${item[0]}`,
        },
        m(style.number, index),
      );
    },
  };
}
