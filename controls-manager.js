import * as THREE from 'https://lib.webaverse.com/three.js';

let possessed = false;
const controlsManager = {
  setPossessed(newPossessed) {
    possessed = newPossessed;
  },
  isPossessed() {
    return possessed;
  },
  update() {
    // nothing
  },
};
export default controlsManager;