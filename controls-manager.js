import * as THREE from 'three';

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