import m from '../../../../../lib/external/mithril-dev.js';
import {Menu} from '../../../../models/Menu.js';
import {style as mStyle} from '../../index.js';

const style = {
  body: '.m-menu_footer',
  btn: '.m-menu_footer_btn',
  btn__back: '.m-menu_footer_btn--back',
  key: 'span.m-menu_key',
};

export function Footer() {
  const onclick = () => Menu.close();

  return {
    view() {
      return m(
        style.body,
        m(
          `${style.btn} ${style.btn__back}`,
          {onclick},
          [
            m(mStyle.key, 'M'),
            'Back',
          ],
        ),
      );
    },
  };
}
