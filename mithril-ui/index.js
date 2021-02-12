import './mithril-dev-2.0.4.js';
import {App} from './App.js';

export function mithrilInit() {
  m.mount(document.getElementById("mithril-root"), App);
};