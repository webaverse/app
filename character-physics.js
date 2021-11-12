/* this is the character physics implementation.
it sets up and ticks the physics loop for our local character */

import * as THREE from 'three';
import physicsManager from './physics-manager.js';
import {getVelocityDampingFactor} from './util.js';
import {groundFriction} from './constants.js';

const localVector = new THREE.Vector3();

class CharacterPhysics {
  constructor(player) {
    this.player = player;
    this.velocity = new THREE.Vector3();
  }
  applyGravity(timeDiffS) {
    if (this.player.avatar) {
      if (!this.player.hasAction('fly')) {
        localVector.copy(physicsManager.getGravity())
          .multiplyScalar(timeDiffS);
        this.velocity.add(localVector);
      }
    }
  }
  applyDamping(timeDiffS) {
    if (this.player.avatar) {
      if (this.player.hasAction('fly')) {
        const factor = getVelocityDampingFactor(0.8, timeDiffS * 1000);
        this.velocity.multiplyScalar(factor);
      } else if (!this.player.hasAction('jump') /*!jumpState || gliding*/) {
        const factor = getVelocityDampingFactor(groundFriction, timeDiffS * 1000);
        this.velocity.x *= factor;
        this.velocity.z *= factor;
      }
    }
  }
  update(timeDiffS) {
    this.applyGravity(timeDiffS);
    this.applyDamping(timeDiffS);
  }
  reset() {
    this.velocity.set(0, 0, 0);
  }
}

export {
  CharacterPhysics,
};