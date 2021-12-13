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
import physx from './physx.js';
import metaversefileApi from 'metaversefile';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

// const localOffset = new THREE.Vector3();
const localOffset2 = new THREE.Vector3();

// const localArray = [];
const localVelocity = new THREE.Vector3();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

class CharacterPhysics {
  constructor(player) {
    this.player = player;

    this.velocity = new THREE.Vector3();
    this.lastGroundedTime = 0;
    this.sitOffset = new THREE.Vector3();
  }
  /* apply the currently held keys to the character */
  applyWasd(keysDirection, timeDiff) {
    if (this.player.avatar && physicsManager.physicsEnabled) {
      this.velocity.add(keysDirection);
    }
  }
  applyGravity(timeDiffS) {
    if (this.player) {
      if ((this.player.hasAction('jump') || (this.player.hasAction('chargeJump') || (this.player.hasAction('chargeIdle'))) && !this.player.hasAction('fly'))) {
        localVector.copy(physicsManager.getGravity())
          .multiplyScalar(timeDiffS);
        this.velocity.add(localVector);
      }
    }
  }
  /* collideCapsule = (() => {
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    return (p, q) => {
      const avatarHeight = this.player.avatar.height;
      localVector.copy(p)
        .add(localVector2.set(0, -avatarHeight * 0.5, 0));
      const radius = 0.3 / 1.6 * avatarHeight;
      const halfHeight = Math.max(avatarHeight * 0.5 - radius, 0);
      return physx.physxWorker.collidePhysics(physx.physics, radius, halfHeight, localVector, q, 12);
    };
  })() */
  applyAvatarPhysicsDetail(
    velocityAvatarDirection,
    updateRig,
    now,
    timeDiffS,
  ) {
    if (this.player.avatar && physicsManager.physicsEnabled) {
      /* // disable old vrm
      {
        const avatarVrmPhysicsObject = this.player.avatar.app.physicsObjects[0];
        //this.debugCapsule = this.player.avatar.app.debugCapsule;
        physicsManager.disableGeometryQueries(avatarVrmPhysicsObject);
        physicsManager.disablePhysicsObject(avatarVrmPhysicsObject);
      } */

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

        const jumpAction = this.player.getAction('chargeJump');
        const _ensureJumpAction = () => {
          if (!jumpAction) {
            const newJumpAction = {
              type: 'chargeJump',
              time: 0,
            };
            this.player.addAction(newJumpAction);
          } else {
            jumpAction.set('time', 0);
          }
        };
        const _ensureNoJumpAction = () => {
          this.player.removeAction('chargeJump');
        };

        if (grounded) {
          this.lastGroundedTime = now;

          this.velocity.y = -1;

          this.player.removeAction('chargeJump');

            const fallLoopAction = this.player.getAction('fallLoop');
            const chargeAction = this.player.getAction('chargeJump');
            const landingAction = this.player.getAction('landing');
            if (fallLoopAction || chargeAction ) {
            
                const localPlayer = metaversefileApi.useLocalPlayer();
                const isLandingPlaying = localPlayer.avatar.landingState;
                if(!isLandingPlaying )
                {
                const action = localPlayer.getAction('landing');
                if (!action) {
                  const landing = {
                    type: 'landing',
                    animation: 'landing',
                    // time: 0,
                  };
                  localPlayer.addAction(landing);
                  setTimeout(() => {
                    localPlayer.removeAction('landing');
                    localPlayer.removeAction('fallLoop');
                  }, 1100);
                }
              }
          }
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
      localVector.add(localOffset2);
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
        if (this.player.hasAction('chargeJump')) {
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

    /* const {capsule} = this.player;
    const {grounded} = capsule;
    if (this.lastGrounded && !grounded && velocity.y > 0 && !this.player.hasAction('jump')) {
      velocity.y = 0;
    }
    this.lastGrounded = grounded; */
  }
  /* updateVelocity() {
    if(this.player.avatar && physicsManager.physicsEnabled) {
      if(this.rigidBody) {
        let y = 0;
        if(this.velocity.y > 0) {
          y = this.velocity.y;
        }
        //localVector.set(this.velocity.x, this.velocity.y, this.velocity.z);
        let enableGravity = true;
        if(this.player.hasAction('fly') || this.player.hasAction('jump')) {
          enableGravity = false;
        }
        physicsManager.setVelocity(this.rigidBody, this.velocity, enableGravity);
      }
    }
  } */
  updateTransform() {
    /* if (this.rigidBody && physicsManager.physicsEnabled) {
      localArray.push({
        id: this.rigidBody.physicsId,
        position: this.rigidBody.position,
        quaternion: this.rigidBody.quaternion,
        scale: this.rigidBody.scale,
      });
      const newTransform = physicsManager.getTransforms(localArray);
      localArray.length = 0;

      for (const updateOut of newTransform) {
        const {id, position, quaternion, scale} = updateOut; 
        if(id === this.rigidBody.physicsId) {
          this.rigidBody.position.copy(position);
          this.rigidBody.quaternion.copy(quaternion);
          this.rigidBody.updateMatrixWorld();
          this.rigidBody.needsUpdate = false;
        }
      }
    } */
  }
  applyAvatarPhysics(now, timeDiffS) {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();

    if (session) {
      if (ioManager.currentWalked || this.player.hasAction('jump')) {
        // const originalPosition = avatarWorldObject.position.clone();

        this.applyAvatarPhysicsDetail(false, false, now, timeDiffS);

        /* dolly.position.add(
          avatarWorldObject.position.clone().sub(originalPosition)
        ); */
      } else {
        // this.velocity.y = 0;
      }
    } else {
      const cameraMode = cameraManager.getMode();
      switch (cameraMode) {
        case 'firstperson': {
          this.applyAvatarPhysicsDetail(false, true, now, timeDiffS);
          break;
        }
        case 'isometric': {
          if (this.player.hasAction('aim') && !this.player.hasAction('narutoRun')) {
            this.applyAvatarPhysicsDetail(false, true, now, timeDiffS);
          } else {
            this.applyAvatarPhysicsDetail(true, true, now, timeDiffS);
          }
          break;
        }
        /* case 'birdseye': {
          this.applyAvatarPhysicsDetail(true, true, now, timeDiffS);
          break;
        } */
        default: {
          throw new Error('invalid camera mode: ' + cameraMode);
        }
      }
    }
  }
  /* offset the camera back from the avatar */
  updateCamera(timeDiffS) {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();

    const avatarCameraOffset = session ? zeroVector : cameraManager.getCameraOffset();
    const avatarHeight = this.player.avatar ? this.player.avatar.height : 0;
    const crouchOffset = avatarHeight * (1 - getPlayerCrouchFactor(this.player)) * 0.5;
    camera.position.copy(this.player.position)
      // .add(localVector.set(0, avatarHeight * 0.5, 0))
      .sub(
        localVector.copy(avatarCameraOffset)
          .applyQuaternion(camera.quaternion)
      );
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
    this.updateCamera(timeDiffS);
  }
  reset() {
    if (this.player.avatar && physicsManager.physicsEnabled) {
      this.player.characterPhysics.velocity.set(0, 0, 0);
    }
  }
}

export {
  CharacterPhysics,
};
