import m from '../lib/external/mithril-dev.js';
import {Main} from './pages/Main/index.js';

export function mithrilInit() {
  m.mount(document.getElementById('mithril-root'), Main);
}
