export default class Blinker {
  constructor() {
    this.mode = 'ready';
    this.waitTime = 0;
    this.lastTimestamp = 0;
  }

  update(now) {
    const _setOpen = () => {
      this.mode = 'open';
      this.waitTime = (0.5 + 0.5 * Math.random()) * 3000;
      this.lastTimestamp = now;
    };

    switch (this.mode) {
      case 'ready': {
        _setOpen();
        return 0;
      }
      case 'open': {
        const timeDiff = now - this.lastTimestamp;
        if (timeDiff > this.waitTime) {
          this.mode = 'closing';
          this.waitTime = 100;
          this.lastTimestamp = now;
        }
        return 0;
      }
      case 'closing': {
        const f = Math.min(
          Math.max((now - this.lastTimestamp) / this.waitTime, 0),
          1,
        );
        if (f < 1) {
          return f;
        } else {
          this.mode = 'opening';
          this.waitTime = 100;
          this.lastTimestamp = now;
          return 1;
        }
      }
      case 'opening': {
        const f = Math.min(
          Math.max((now - this.lastTimestamp) / this.waitTime, 0),
          1,
        );
        if (f < 1) {
          return 1 - f;
        } else {
          _setOpen();
          return 0;
        }
      }
    }
  }
}
