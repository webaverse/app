import m from '../lib/external/mithril-dev.js';
import {Main} from './layouts/Main/index.js';

export function mithrilInit() {
  m.mount(document.getElementById('mithril-root'), Main);
}
