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

const localOffset = new THREE.Vector3();
const localOffset2 = new THREE.Vector3();

const localArray = [];
const localVelocity = new THREE.Vector3();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

class CharacterPhysics {
  constructor(player) {
    this.player = player;
    // this.rigidBody = null;
    this.debugCapsule = null;

    // this.velocity = new THREE.Vector3();
    this.sitOffset = new THREE.Vector3();
  }
  /* apply the currently held keys to the character */
  applyWasd(keysDirection, timeDiff) {
    if (this.player.avatar && physicsManager.physicsEnabled) {
      physicsManager.getVelocity(this.player.capsule, localVelocity);
      localVelocity.add(keysDirection);
      physicsManager.setVelocity(this.player.capsule, localVelocity, true);
    }
  }
  /* applyGravity(timeDiffS) {
    if (this.player) {
      if (this.player.hasAction('jump')) {
        localVector.copy(physicsManager.getGravity())
          .multiplyScalar(timeDiffS);
        this.velocity.add(localVector);
      }
    }
  } */
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
    timeDiffS,
  ) {
    if (this.player.avatar && physicsManager.physicsEnabled) {
      //console.log(physicsId);

      const avatarVrmPhysicsObject = this.player.avatar.app.physicsObjects[0];
      //this.debugCapsule = this.player.avatar.app.debugCapsule;
      physicsManager.disableGeometryQueries(avatarVrmPhysicsObject);
      physicsManager.disablePhysicsObject(avatarVrmPhysicsObject);

      const {capsule} = this.player;
      capsule.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localVector.y += this.player.avatar.height * 0.5;

      // if(!this.rigidBody) return;
      
      // capsule physics
      if (!this.player.hasAction('sit')) {
        //applyVelocity(this.player.position, this.velocity, timeDiffS);

        /* this.rigidBody.updateMatrixWorld();
        this.rigidBody.matrixWorld.decompose(localVector, localQuaternion, localVector2);
        localQuaternion.copy(this.player.quaternion);

        localOffset.set(0, this.player.avatar.height/2, 0); // Capsule offset
        localVector.add(localOffset); */
        // const collision = this.collideCapsule(localVector, localQuaternion2.set(0, 0, 0, 1)); // TODO: Replace with physicsManager.isGrounded restitution check

        // avatar facing direction
        if (velocityAvatarDirection) {
          physicsManager.getVelocity(this.player.capsule, localVector5);
          const horizontalVelocity = localVector5;
          /* const horizontalVelocity = localVector5.set(
            this.velocity.x,
            0,
            this.velocity.z
          ); */
          horizontalVelocity.y = 0;
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

        const {collided, grounded} = capsule;
        // console.log('collided grounded', collided, grounded);
        physicsManager.getVelocity(this.player.capsule, localVector4);
        if (collided) {
          /*localVector.add(
            localVector4
              .fromArray(collision.direction)
          );*/
          
          if (grounded) {
            if(!jumpAction) {
              // this.velocity.y = 0;
              _ensureNoJumpAction();
            }
            else if(jumpAction && localVector4.y <= 0) {
              _ensureNoJumpAction();
            } 
          } else if (!jumpAction) {
            //_ensureJumpAction();
          }
        } else if (!jumpAction && localVector4.y < -4) {
          _ensureJumpAction();
        }
      } else {
        /* //Outdated vehicle code
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
        localVector.y += this.player.avatar.height;
        localQuaternion.premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI)); */
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

      /*if(this.debugCapsule) {
        this.debugCapsule.position.copy(this.rigidBody.position);
        //this.debugCapsule.quaternion.copy(this.rigidBody.quaternion);
      }*/

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
    // const timeDiff = timeDiffS * 1000;
    if (this.player.hasAction('fly')) {
      const factor = getVelocityDampingFactor(flyFriction, timeDiff);
      velocity.multiplyScalar(factor);
    } else {
      const factor = getVelocityDampingFactor(groundFriction, timeDiff);
      velocity.x *= factor;
      velocity.z *= factor;
    }
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
  applyAvatarPhysics(timeDiffS) {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();

    if (session) {
      if (ioManager.currentWalked || this.player.hasAction('jump')) {
        // const originalPosition = avatarWorldObject.position.clone();

        this.applyAvatarPhysicsDetail(false, false, timeDiffS);

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
          this.applyAvatarPhysicsDetail(false, true, timeDiffS);
          break;
        }
        case 'isometric': {
          if (this.player.hasAction('aim') && !this.player.hasAction('narutoRun')) {
            this.applyAvatarPhysicsDetail(false, true, timeDiffS);
          } else {
            this.applyAvatarPhysicsDetail(true, true, timeDiffS);
          }
          break;
        }
        /* case 'birdseye': {
          this.applyAvatarPhysicsDetail(true, true, timeDiffS);
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
  /* updateRigidbody() {
    this.updateVelocity();
    this.updateTransform();
  } */
  updateVelocity(timeDiffS) {
    if (this.player.capsule) {
      physicsManager.getVelocity(this.player.capsule, localVelocity);
      const timeDiff = timeDiffS * 1000;
      this.applyVelocityDamping(localVelocity, timeDiff);
      physicsManager.setVelocity(this.player.capsule, localVelocity, true);
    }
  }
  update(timeDiffS) {
    // this.applyGravity(timeDiffS);
    // this.applyVelocityDamping(timeDiffS);
    // this.updateRigidbody();
    this.updateVelocity(timeDiffS);
    this.applyAvatarPhysics(timeDiffS);
    this.updateCamera(timeDiffS);
  }
  getVelocity(v) {
    physicsManager.getVelocity(this.player.capsule, v);
  }
  reset() {
    if (this.player.avatar && physicsManager.physicsEnabled) {
      physicsManager.setVelocity(this.player.capsule, localVelocity.set(0, 0, 0), true);
    }
  }
}

export {
  CharacterPhysics,
};
