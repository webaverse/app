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

    this.shouldExpectLeftStep = false;
    this.shouldExpectRightStep = false;

    this.prevLeftZ = 10;
    this.prevRightZ = 10;
  }

  round2(num) {
    return +(Math.round(num + "e+2")  + "e-2");
  }
  
  updateSteps(now, timeDiffS) {
    
    if (this.player === null || this.player.avatar === null) {
      return;
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

    posLeft = localVector.z;


    boneFootRight.matrix.copy(boneFootRight.matrixWorld).
        premultiply(localMatrix.copy(this.player.avatar.modelBoneOutputs.Root.matrixWorld).invert());

    boneFootRight.matrix.decompose(localVector, localQuaternion, localVector2);

    posRight = localVector.z;
    

    if (posLeft < this.prevLeftZ && posLeft > -0.1 && this.shouldExpectLeftStep) {
      this.shouldExpectLeftStep = false;
      //console.log("LEFT");
      soundManager.play('step1');

    }
    else if (posLeft < -0.1 && !this.shouldExpectLeftStep) {
      this.shouldExpectLeftStep = true;
    }

    if (posRight < this.prevRightZ && posRight > -0.1 && this.shouldExpectRightStep) {
      this.shouldExpectRightStep = false;
      //console.log("RIGHT");
      soundManager.play('step1');
    }
    else if (posRight < -0.1 && !this.shouldExpectRightStep) {
      this.shouldExpectRightStep = true;
    }

    this.prevLeftZ = this.round2(posLeft);
    this.prevRightZ = this.round2(posRight);
  }
  
  update(now, timeDiffS) {
    
    this.updateSteps(timeDiffS);
  }
  
}

export {
  CharacterSfx,
};
