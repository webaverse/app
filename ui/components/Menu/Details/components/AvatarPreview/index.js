import m from '../../../../../../lib/external/mithril-dev.js';
import {loginManager} from '../../../../../../login.js';

const style = {
  body: '.m-menu_details_avatar-preview',
  decal: 'svg.m-menu_decal',
  image: 'img.m-menu_details_avatar-preview_img',
  name: '.m-menu_details_avatar-preview_name',
};

export function AvatarPreview() {
  let isLoaded = false;

  return {
    async oninit() {
      await loginManager.waitForLoad();
      isLoaded = true;
      m.redraw();
    },

    view() {
      return isLoaded && m(
        style.body,
        [
          m(style.image, {src: loginManager.getAvatarPreview()}),
          m(style.name, [
            m(
              style.decal,
              m(
                'use',
                {'xlink:href': './ui/assets/sprites.svg#tab-decal-2'},
              ),
            ),
            loginManager.getUsername(),
          ]),
        ],
      );
    },
  };
}
