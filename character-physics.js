/* this is the character physics implementation.
it sets up and ticks the physics loop for our local character */

import * as THREE from 'three';
import cameraManager from './camera-manager.js';
import {getPlayerCrouchFactor} from './character-controller.js';
import physicsManager from './physics-manager.js';
import ioManager from './io-manager.js';
import {getVelocityDampingFactor} from './util.js';
import {groundFriction, flyFriction, airFriction} from './constants.js';
import {applyVelocity} from './util.js';
import {getRenderer, camera} from './renderer.js';
// import physx from './physx.js';
import metaversefileApi from 'metaversefile';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

// const localOffset = new THREE.Vector3();
// const localOffset2 = new THREE.Vector3();

// const localArray = [];
// const localVelocity = new THREE.Vector3();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

class CharacterPhysics {
  constructor(player) {
    this.player = player;

    this.velocity = new THREE.Vector3();
    this.lastGroundedTime = 0;
    this.sitOffset = new THREE.Vector3();
  }
  setPosition(p) {
    localVector.copy(p);
    localVector.y -= this.player.avatar.height * 0.5;
    physicsManager.setCharacterControllerPosition(this.player.characterController, localVector);
  }
  /* apply the currently held keys to the character */
  applyWasd(keysDirection, timeDiff) {
    if (this.player.avatar) {
      this.velocity.add(keysDirection);
    }
  }
  applyGravity(timeDiffS) {
    if (this.player) {
      if (this.player.hasAction('jump') && !this.player.hasAction('fly')) {
        localVector.copy(physicsManager.getGravity())
          .multiplyScalar(timeDiffS);
        this.velocity.add(localVector);
      }
    }
  }
  applyAvatarPhysicsDetail(
    velocityAvatarDirection,
    updateRig,
    now,
    timeDiffS,
  ) {
    if (this.player.avatar) {
      // move character controller
      const minDist = 0;
      localVector3.copy(this.velocity)
        .multiplyScalar(timeDiffS);
      // console.log('got local vector', this.velocity.toArray().join(','), localVector3.toArray().join(','), timeDiffS);
      const flags = physicsManager.moveCharacterController(
        this.player.characterController,
        localVector3,
        minDist,
        timeDiffS,
        this.player.characterControllerObject.position
      );
      // const collided = flags !== 0;
      const grounded = !!(flags & 0x1); 

      this.player.characterControllerObject.updateMatrixWorld();
      this.player.characterControllerObject.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localQuaternion.copy(this.player.quaternion);
      localVector.y += this.player.avatar.height * 0.5;
      
      // capsule physics
      if (!this.player.hasAction('sit')) {
        // avatar facing direction
        if (velocityAvatarDirection) {
          const horizontalVelocity = localVector5.set(
            this.velocity.x,
            0,
            this.velocity.z
          );
          if (horizontalVelocity.lengthSq() > 0.001) {
            localQuaternion.setFromRotationMatrix(
              localMatrix.lookAt(
                zeroVector,
                horizontalVelocity,
                upVector
              )
            );
          }
        } else {
          localQuaternion.copy(camera.quaternion);
        }

        const jumpAction = this.player.getAction('jump');
        const _ensureJumpAction = () => {
          if (!jumpAction) {
            const newJumpAction = {
              type: 'jump',
              time: 0,
            };
            this.player.addAction(newJumpAction);
          } else {
            jumpAction.set('time', 0);
          }
        };
        const _ensureNoJumpAction = () => {
          this.player.removeAction('jump');
        };

        if (grounded) {
          this.lastGroundedTime = now;

          this.velocity.y = -1;
        }

        if (!jumpAction) {
          const lastGroundedTimeDiff = now - this.lastGroundedTime;
          if (lastGroundedTimeDiff <= 100) {
            _ensureNoJumpAction();
          } else {
            _ensureJumpAction();
          
            this.velocity.y = 0;
          }
        } else {
          if (grounded) {
            _ensureNoJumpAction();
          }
        }
      } else {
        //Outdated vehicle code
        this.velocity.y = 0;

        const sitAction = this.player.getAction('sit');

        const objInstanceId = sitAction.controllingId;
        const controlledApp = metaversefileApi.getAppByInstanceId(objInstanceId);
        const sitPos = sitAction.controllingBone ? sitAction.controllingBone : controlledApp;

        const sitComponent = controlledApp.getComponent('sit');
        const {
          sitOffset = [0, 0, 0],
          // damping,
        } = sitComponent;
        this.sitOffset.fromArray(sitOffset);

        applyVelocity(controlledApp.position, this.velocity, timeDiffS);
        if (this.velocity.lengthSq() > 0) {
          controlledApp.quaternion
            .setFromUnitVectors(
              localVector4.set(0, 0, -1),
              localVector5.set(this.velocity.x, 0, this.velocity.z).normalize()
            )
            .premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI));
        }
        controlledApp.updateMatrixWorld();

        localMatrix.copy(sitPos.matrixWorld)
          .decompose(localVector, localQuaternion, localVector2);

        localVector.add(this.sitOffset);
        localVector.y += this.player.avatar.height * 0.5;

        physicsManager.setCharacterControllerPosition(this.player.characterController, localVector);
        localVector.y += this.player.avatar.height * 0.5;

        localQuaternion.premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI));
      }
      // localOffset2.set(0, 0.05, 0); // Feet offset: Or feet will be in ground, only cosmetical, works for all avatars
      // localVector.add(localOffset2);
      localMatrix.compose(localVector, localQuaternion, localVector2);

      // apply to player
      if (updateRig) {
        this.player.matrix.copy(localMatrix);
      } else {
        this.player.matrix.identity();
      }
      this.player.matrix
        .decompose(this.player.position, this.player.quaternion, this.player.scale);
      this.player.matrixWorld.copy(this.player.matrix);

      this.player.updateMatrixWorld();

      if (this.avatar) {
        if (this.player.hasAction('jump')) {
          this.avatar.setFloorHeight(-0xFFFFFF);
        } else {
          this.avatar.setFloorHeight(localVector.y - this.player.avatar.height);
        }
        this.avatar.updateMatrixWorld();
      }
    }
  }
  /* dampen the velocity to make physical sense for the current avatar state */
  applyVelocityDamping(velocity, timeDiff) {
    if (this.player.hasAction('fly')) {
      const factor = getVelocityDampingFactor(flyFriction, timeDiff);
      velocity.multiplyScalar(factor);
    } else {
      const factor = getVelocityDampingFactor(groundFriction, timeDiff);
      velocity.x *= factor;
      velocity.z *= factor;
    }
  }
  applyAvatarPhysics(now, timeDiffS) {
    // const renderer = getRenderer();
    // const session = renderer.xr.getSession();

    /* if (session) {
      if (ioManager.currentWalked || this.player.hasAction('jump')) {
        // const originalPosition = avatarWorldObject.position.clone();

        this.applyAvatarPhysicsDetail(false, false, now, timeDiffS);

        // dolly.position.add(
          // avatarWorldObject.position.clone().sub(originalPosition)
        // );
      } else {
        // this.velocity.y = 0;
      }
    } else { */
      if (this.player.hasAction('firstperson') || (this.player.hasAction('aim') && !this.player.hasAction('narutoRun'))) {
        this.applyAvatarPhysicsDetail(false, true, now, timeDiffS);
      } else {
        this.applyAvatarPhysicsDetail(true, true, now, timeDiffS);
      }
    // }
  }
  /* offset the camera back from the avatar */
  updateCamera(timeDiffS) {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();

    const avatarCameraOffset = session ? zeroVector : cameraManager.getCameraOffset();
    const avatarHeight = this.player.avatar ? this.player.avatar.height : 0;
    const crouchOffset = avatarHeight * (1 - getPlayerCrouchFactor(this.player)) * 0.5;

    const cameraMode = cameraManager.getMode();

    switch (cameraMode) {
      case 'firstperson': {
        if (this.player.avatar) {
          const boneNeck = this.player.avatar.foundModelBones['Neck'];
          const boneEyeL = this.player.avatar.foundModelBones['Eye_L'];
          const boneEyeR = this.player.avatar.foundModelBones['Eye_R'];
          const boneHead = this.player.avatar.foundModelBones['Head'];

          boneNeck.quaternion.setFromEuler(localEuler.set(Math.min(camera.rotation.x * -0.5, 0.6), 0, 0, 'XYZ'));
          boneNeck.updateMatrixWorld();
    
          if (boneEyeL && boneEyeR) {
            boneEyeL.matrixWorld.decompose(localVector, localQuaternion, localVector3);
            boneEyeR.matrixWorld.decompose(localVector2, localQuaternion, localVector3);
            localVector3.copy(localVector.add(localVector2).multiplyScalar(0.5));
          } else {
            boneHead.matrixWorld.decompose(localVector, localQuaternion, localVector3);
            localVector.add(localVector2.set(0, 0, 0.1).applyQuaternion(localQuaternion));
            localVector3.copy(localVector);
          }
        } else {
          localVector3.copy(this.player.position);
        }

        camera.position.copy(localVector3)
          .sub(localVector.copy(avatarCameraOffset).applyQuaternion(camera.quaternion));

        break;
      }
      case 'isometric': {
        camera.position.copy(this.player.position)
        // .add(localVector.set(0, avatarHeight * 0.5, 0))
        .sub(
          localVector.copy(avatarCameraOffset)
            .applyQuaternion(camera.quaternion)
        );
  
        break;
      }
      default: {
        throw new Error('invalid camera mode: ' + cameraMode);
      }
    }

    camera.position.y -= crouchOffset;
    camera.updateMatrixWorld();
  }
  updateVelocity(timeDiffS) {
    const timeDiff = timeDiffS * 1000;
    this.applyVelocityDamping(this.velocity, timeDiff);
  }
  update(now, timeDiffS) {
    this.applyGravity(timeDiffS);
    this.updateVelocity(timeDiffS);
    this.applyAvatarPhysics(now, timeDiffS);
  }
  reset() {
    if (this.player.avatar) {
      this.velocity.set(0, 0, 0);
    }
  }
}

export {
  CharacterPhysics,
};
