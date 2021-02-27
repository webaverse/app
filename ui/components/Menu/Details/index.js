import m from '../../../../lib/external/mithril-dev.js';
import {AvatarPreview} from './components/AvatarPreview/index.js';
import {Menu} from '../../../models/Menu.js';

const style = {
  body: '.m-menu_details',
  decal: 'svg.m-menu_decal',
  details: '.m-menu_details_details',
  image: 'img.m-menu_details_image',
  metadata: '.m-menu_details_metadata',
  metadata_contentID: '.m-menu_details_metadata_content-id',
  name: '.m-menu_details_name',
};

export function Details() {
  return {
    view({attrs: {model}}) {
      return m(
        style.body,
        Menu.currentItem
          ? [
            m(style.image, {src: Menu.currentItem.image}),
            m(style.name, [
              m(
                style.decal,
                m(
                  'use',
                  {'xlink:href': './ui/assets/sprites.svg#tab-decal-4'},
                ),
              ),
              Menu.currentItem.name || Menu.currentItem.instanceId,
            ]),
            m(style.details, Menu.currentItem.details ? m.trust(Menu.currentItem.details) : ''),
            m(style.metadata, [
              /* m('div', Menu.currentItem.properties
                ? `Type: ${current.properties.ext}`
                : '',
              ), */
              Menu.currentItem.contentId &&
              m(style.metadata_contentID, `ID: ${Menu.currentItem.contentId}`),
            ]),
          ]
          : m(AvatarPreview),
      );
    },
  };
}
