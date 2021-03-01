import {clamp} from '../../../../lib/math.js';

const NONE = -1;

export default class {
  constructor({items}) {
    this.hoverIndex = NONE;
    this.selectedIndex = NONE;
    this.items = items;
  }

  get current() { return this.currentHover || this.currentSelected; }

  get currentSelected() {
    return this.selectedIndex === NONE
      ? null
      : this.items[this.selectedIndex];
  }

  get currentHover() {
    return this.hoverIndex === NONE
      ? null
      : this.items[this.hoverIndex];
  }

  reset() {
    this.hoverIndex = NONE;
    this.selectedIndex = NONE;
  }

  setHover(i) { this.hoverIndex = clamp(i, -1, this.items.length); }
  setItems(items) { this.items = items; }

  select(i) { this.selectedIndex = clamp(i, -1, this.items.length); }
}
