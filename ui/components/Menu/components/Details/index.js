import m from '../../../../../lib/external/mithril-dev.js';

const style = {
  body: '.m-menu_details',
  details: '.m-menu_details_details',
  image: 'img.m-menu_details_image',
  name: '.m-menu_details_name',
  name_decal: 'svg.m-menu_details_name_decal',
};

export function Details({attrs: {model}}) {
  return {
    currentItem: model.currentItem,
    onbeforeupdate() { this.currentItem = model.currentItem; },
    view({attrs: {model}}) {
      return m(
        style.body,
        this.currentItem
          ? [
            m(style.image, {src: model.currentItem.image}),
            m(style.name, [
              m(
                style.name_decal,
                m(
                  'use',
                  {'xlink:href': './ui/assets/sprites.svg#tab-decal-4'},
                ),
              ),
              model.currentItem.name,
            ]),
            m(style.details, m.trust(model.currentItem.details)),
          ]
          : 'Avatar Preview',
      );
    },
  };
}
