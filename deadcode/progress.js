throw new Error('dead code')
import './nanobar.js';

const nanobar = new Nanobar({
  target: document.getElementById('progress-bar'),
});
/* nanobar.go(30);
nanobar.go(76); */

class Progress {
  constructor() {
    this.numerator = 0;
    this.denominator = 1;
    this.trickleTimer = null;
  }

  setNumerator(n) {
    this.numerator = n;
    this.update();
  }

  setDemoninator(d) {
    this.denominator = d;
    this.update();
  }

  setNumeratorDenominator(n, d) {
    this.numerator = n;
    this.denominator = d;
    this.update();
  }

  addNumerator() {
    this.setNumerator(this.numerator + 1);
  }

  update() {
    if (this.numerator < this.denominator) {
      nanobar.go((this.numerator + 1) / (this.denominator + 1) * 100);
    } else {
      nanobar.go(100);
    }
  }

  trickle() {
    // Logic adapted from https://github.com/rstacruz/nprogress/blob/6de3a45c33fe1f142b73935206a6f1e74a230a3f/nprogress.js#L158-L188
    // As per https://github.com/jacoborus/nanobar/issues/36#issuecomment-207096298
    this.trickleTimer = setInterval(() => {
      let amount;
      if (this.numerator >= 0 && this.numerator < 0.25) {
        // Start out between 3 - 6% increments
        amount = (Math.random() * (5 - 3 + 1) + 3) / 100;
      } else if (this.numerator >= 0.25 && this.numerator < 0.65) {
        // increment between 0 - 3%
        amount = (Math.random() * 3) / 100;
      } else if (this.numerator >= 0.65 && this.numerator < 0.9) {
        // increment between 0 - 2%
        amount = (Math.random() * 2) / 100;
      } else if (this.numerator >= 0.9 && this.numerator < 0.99) {
        // finally, increment it .5 %
        amount = 0.005;
      } else {
        // after 99%, don't increment:
        amount = 0;
      }
      this.setNumerator(this.numerator + amount);
      this.update();
    }, 500);
  }

  stopTrickle() {
    if (this.trickleTimer) {
      clearInterval(this.trickleTimer);
    }
    nanobar.go(100);
  }
}
const progress = new Progress();

export {
  progress,
};
