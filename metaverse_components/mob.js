// import * as THREE from 'three';
// import metaversefile from 'metaversefile';
// import Avatar from '../avatars/avatars.js';
// import {world} from '../world.js';
// import physicsManager from '../physics-manager.js';
// import {glowMaterial} from '../shaders.js';
// import easing from '../easing.js';
import mobManager from '../mob-manager.js';
// import {rarityColors} from '../constants.js';

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();

export default (app, component) => {
  mobManager.addMob(app);

  return {
    remove() {
      mobManager.removeMob(app);
    },
  };
};