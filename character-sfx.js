/* this is the character sfx implementation.
it is used for footsteps sfx etc */

import * as THREE from 'three';
import cameraManager from './camera-manager.js';
import {getPlayerCrouchFactor} from './character-controller.js';
import ioManager from './io-manager.js';
import metaversefile from 'metaversefile';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();



class CharacterSfx {
  constructor(player) {
    this.player = player;
    this.minFootPosition = 0;
    this.timeUntilFootPosReset = 1.0;
  }
  
  updateSteps(now, timeDiffS) {
    
    if (this.player === null || this.player.avatar === null) {
      return;
    }

    // Reset min foot position
    this.timeUntilFootPosReset -= now;
    if (this.timeUntilFootPosReset <= 0) {
      this.timeUntilFootPosReset = 0.3;
      this.minFootPosition = 0.2;
    }

    //debugger;

    const soundManager = metaversefile.useSoundManager();

    const boneFootLeft = this.player.avatar.foundModelBones['Left_ankle'];
    const boneFootRight = this.player.avatar.foundModelBones['Right_ankle'];

    let posLeft = 0;
    let posRight = 0;

    //console.log(boneFootLeft);

    boneFootLeft.matrix.copy(boneFootLeft.matrixWorld).
        premultiply(localMatrix.copy(this.player.avatar.modelBoneOutputs.Root.matrixWorld).invert());

    boneFootLeft.matrix.decompose(localVector, localQuaternion, localVector2);

    posLeft = localVector.y;


    boneFootRight.matrix.copy(boneFootRight.matrixWorld).
        premultiply(localMatrix.copy(this.player.avatar.modelBoneOutputs.Root.matrixWorld).invert());

    boneFootRight.matrix.decompose(localVector, localQuaternion, localVector2);

    posRight = localVector.y;

    //console.log(posLeft.toFixed(2) + " " + posRight.toFixed(2));

    this.minFootPosition = Math.min(posRight, this.minFootPosition);
    this.minFootPosition = Math.min(posLeft, this.minFootPosition);

    if (posLeft <= (this.minFootPosition + 0.02))
    {
      soundManager.playStepSound(1);
    }

    if (posRight <= (this.minFootPosition + 0.02))
    {
      soundManager.playStepSound(2);
    }

    //console.log(this.minFootPosition.toFixed(2));

  }
  
  update(now, timeDiffS) {
    
    this.updateSteps(timeDiffS);
  }
  
}

export {
  CharacterSfx,
};
