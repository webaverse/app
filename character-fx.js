import * as THREE from 'three';
/* import Avatar from './avatars/avatars.js';
import {
  idleFactorSpeed,
  walkFactorSpeed,
  runFactorSpeed,
  narutoRunTimeFactor,
} from './avatars/constants.js';
import {
  crouchMaxTime,
} from './constants.js';
import {
  mod,
  loadJson,
  loadAudioBuffer,
} from './util.js'; */
import metaversefile from 'metaversefile';
import * as metaverseModules from './metaverse-modules.js';
import {sceneLowPriority} from './renderer.js';

// const localVector = new THREE.Vector3();

class CharacterFx {
  constructor(player) {
    this.player = player;

    // this.lastJumpState = false;
    // this.lastStepped = [false, false];
    // this.lastWalkTime = 0;

    this.kiMesh = null;
  }
  update(timestamp, timeDiffS) {
    if (!this.player.avatar) {
      return;
    }

    const powerupAction = this.player.getAction('dance');
    const isPowerup = !!powerupAction && powerupAction.animation === 'powerup';
    if (isPowerup && !this.kiMesh) {
      this.kiMesh = metaversefile.createApp();
      (async () => {
        await metaverseModules.waitForLoad();
        const {modules} = metaversefile.useDefaultModules();
        const m = modules['ki'];
        await this.kiMesh.addModule(m);
      })();
      sceneLowPriority.add(this.kiMesh);
    }
    if (this.kiMesh) {
      this.kiMesh.visible = isPowerup;
    }
  }
  destroy() {
    if (this.kiMesh) {
      sceneLowPriority.remove(this.kiMesh);
      this.kiMesh = null;
    }
  }
}

export {
  CharacterFx,
};