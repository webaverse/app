import {clamp} from '../../../../../lib/math.js';

export default class {
  constructor({items}) {
    this.index = 0;
    this.items = items;
  }

  get currentItem() { return this.items[this.index]; }

  setIndex(i) { this.index = clamp(i, -1, this.items.length); }
}
