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
}
const progress = new Progress();

export {
  progress,
};