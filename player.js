class Player extends EventTarget {
  constructor() {
    super();

    this.items = {};
  }
  addInventory(type, count) {
    if (!this.items[type]) {
      this.items[type] = 0;
    }
    this.items[type] += count;

    this.dispatchEvent(new MessageEvent('inventorychange', {
      data: {
        type,
        count: this.items[type],
      },
    }));
  }
  removeInventory(type, count) {
    if (!this.items[type]) {
      this.items[type] = 0;
    }
    this.items[type] -= count;

    this.dispatchEvent(new MessageEvent('inventorychange', {
      data: {
        type,
        count: this.items[type],
      },
    }));
  }
  getCount(type) {
    return this.items[type] || 0;
  }
}
export const player = new Player();