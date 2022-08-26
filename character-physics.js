/* this is the character physics implementation.
it sets up and ticks the physics loop for our local character */

import * as THREE from 'three';
// import cameraManager from './camera-manager.js';
// import {getPlayerCrouchFactor} from './character-controller.js';
import physicsManager from './physics-manager.js';
// import ioManager from './io-manager.js';
import {getVelocityDampingFactor, applyVelocity} from './util.js';
import {groundFriction, flyFriction, airFriction, swimFriction, flatGroundJumpAirTime, jumpHeight} from './constants.js';
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
// const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

// const localOffset = new THREE.Vector3();
// const localOffset2 = new THREE.Vector3();

// const localArray = [];
// const localVelocity = new THREE.Vector3();

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);
const leftHandOffset = new THREE.Vector3(0.2, -0.2, -0.4);
const rightHandOffset = new THREE.Vector3(-0.2, -0.2, -0.4);
const z22Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI/8);
const groundStickOffset = 0.03;

const physicsScene = physicsManager.getScene();

class CharacterPhysics {
  constructor(player) {
    this.player = player;

    this.velocity = new THREE.Vector3();
    this.lastGrounded = null;
    this.lastGroundedTime = 0;
    this.lastCharacterControllerY = null;
    this.sitOffset = new THREE.Vector3();
   
    this.lastPistolUse = false;
    this.lastPistolUseStartTime = -Infinity;
  }
  setPosition(p) {
    localVector.copy(p);
    localVector.y -= this.player.avatar.height * 0.5;
    physicsScene.setCharacterControllerPosition(this.player.characterController, localVector);
  }
  /* apply the currently held keys to the character */
  applyWasd(keysDirection) {
    if (this.player.avatar) {
      this.velocity.add(keysDirection);
    }
  }
  applyGravity(timeDiffS) {
    // if (this.player) {
      if ((this.player.hasAction('jump') || this.player.hasAction('fallLoop')) && !this.player.hasAction('fly') && !this.player.hasAction('swim')) {
        localVector.copy(physicsScene.getGravity())
          .multiplyScalar(timeDiffS);
        this.velocity.add(localVector);
      }
    // }
  }
  updateVelocity(timeDiffS) {
    const timeDiff = timeDiffS * 1000;
    this.applyVelocityDamping(this.velocity, timeDiff);
  }
  applyAvatarPhysicsDetail(
    velocityAvatarDirection,
    updateRig,
    now,
    timeDiffS,
  ) {
    if (this.player.avatar) {
      // console.log('apply avatar physics', this.player);
      // move character controller
      const minDist = 0;
      localVector3.copy(this.velocity)
        .multiplyScalar(timeDiffS);

      const jumpAction = this.player.getAction('jump');
      if (jumpAction?.trigger === 'jump') {
        const doubleJumpAction = this.player.getAction('doubleJump');
        if (doubleJumpAction) {
          const doubleJumpTime = this.player.actionInterpolants.doubleJump.get();
          localVector3.y = Math.sin(doubleJumpTime * (Math.PI / flatGroundJumpAirTime)) * jumpHeight + doubleJumpAction.startPositionY - this.lastCharacterControllerY;
          if (doubleJumpTime >= flatGroundJumpAirTime) {
            this.player.setControlAction({type: 'fallLoop', from: 'jump'});
          }
        } else {
          const jumpTime = this.player.actionInterpolants.jump.get();
          localVector3.y = Math.sin(jumpTime * (Math.PI / flatGroundJumpAirTime)) * jumpHeight + jumpAction.startPositionY - this.lastCharacterControllerY;
          if (jumpTime >= flatGroundJumpAirTime) {
            this.player.setControlAction({type: 'fallLoop', from: 'jump'});
          }
        }
      }
        
      // console.log('got local vector', this.velocity.toArray().join(','), localVector3.toArray().join(','), timeDiffS);
      if(this.player.hasAction('swim') && this.player.getAction('swim').onSurface && !this.player.hasAction('fly')){
        if(this.player.characterPhysics.velocity.y > 0){
          localVector3.y = 0;
        }
      }
      const flags = physicsScene.moveCharacterController(
        this.player.characterController,
        localVector3,
        minDist,
        timeDiffS,
        this.player.characterController.position
      );
      // const collided = flags !== 0;
      let grounded = !!(flags & 0x1); 

      if (!grounded && !this.player.getAction('jump') && !this.player.getAction('fly') && !this.player.hasAction('swim')) { // prevent jump when go down slope
        const oldY = this.player.characterController.position.y;
        const flags = physicsScene.moveCharacterController(
          this.player.characterController,
          localVector3.set(0, -groundStickOffset, 0),
          minDist,
          0,
          localVector4,
        );
        const newGrounded = !!(flags & 0x1); 
        if (newGrounded) {
          grounded = true;
          this.player.characterController.position.copy(localVector4);
        } else {
          this.player.characterController.position.y = oldY;
        }
      }

      this.player.characterController.updateMatrixWorld();
      this.player.characterController.matrixWorld.decompose(localVector, localQuaternion, localVector2);
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

        if (grounded) {
          this.lastGroundedTime = now;
          if (!this.lastGrounded) {
            if (this.player.hasAction('jump') || this.player.hasAction('fallLoop')) {
              this.player.setControlAction({
                type: 'land',
                time: now,
                isMoving: this.player.avatar.idleWalkFactor > 0,
              });
              this.player.removeAction('doubleJump');
            }
          };

          this.velocity.y = -1;
        } else {
          const lastGroundedTimeDiff = now - this.lastGroundedTime;
          if (lastGroundedTimeDiff > 200) {
            if (!this.player.hasAction('fallLoop') && !this.player.hasAction('jump') && !this.player.hasAction('fly') && !this.player.hasAction('swim')) {
              this.player.setControlAction({type: 'fallLoop'});
              this.velocity.y = 0;
            }
          }
        }
      } else {
        //Outdated vehicle code
        this.velocity.y = 0;

        const sitAction = this.player.getAction('sit');

        const objInstanceId = sitAction.controllingId;
        const controlledApp = metaversefileApi.getAppByInstanceId(objInstanceId);

        const sitComponent = controlledApp.getComponent('sit');

        // Patch fix to fix vehicles and mounts for now
        let rideMesh = null;
        controlledApp.glb.scene.traverse(o => {
          if (rideMesh === null && o.isSkinnedMesh) {
            rideMesh = o;
          }
        });

        // NOTE: We had a problem with sending the entire bone in the message buffer, so we're just sending the bone name
        const sitPos = sitComponent.sitBone ? rideMesh.skeleton.bones.find(bone => bone.name === sitComponent.sitBone) : controlledApp;
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

        physicsScene.setCharacterControllerPosition(this.player.characterController, localVector);
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

      // this.player.updateMatrixWorld();

      /* if (this.avatar) {
        if (this.player.hasAction('jump')) {
          this.avatar.setFloorHeight(-0xFFFFFF);
        } else {
          this.avatar.setFloorHeight(localVector.y - this.player.avatar.height);
        }
        this.avatar.updateMatrixWorld();
      } */

      this.lastGrounded = grounded;
      this.lastCharacterControllerY = this.player.characterController.position.y;
    }
  }
  /* dampen the velocity to make physical sense for the current avatar state */
  applyVelocityDamping(velocity, timeDiff) {
    if (this.player.hasAction('fly')) {
      const factor = getVelocityDampingFactor(flyFriction, timeDiff);
      velocity.multiplyScalar(factor);
    } 
    else if(this.player.hasAction('swim')){
      const factor = getVelocityDampingFactor(swimFriction, timeDiff);
      velocity.multiplyScalar(factor);
    }
    else {
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
  applyAvatarActionKinematics(now, timeDiffS) {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    const aimAction = this.player.getAction('aim');
    const aimComponent = (() => {
      for (const action of this.player.getActions()) {
        if (action.type === 'wear') {
          const app = this.player.appManager.getAppByInstanceId(action.instanceId);
          if (!app) {
            return null;
          }
          for (const {key, value} of app.components) {
            if (key === 'aim') {
              return value;
            }
          }
        }
      }
      return null;
    })();
    const useAction = this.player.getAction('use');

    const _updateHandsEnabled = () => {
      const isSession = !!session;
      const isPlayerAiming = !!aimAction && !aimAction.playerAnimation;
      const isObjectAimable = !!aimComponent;
      // const isPlayingEnvelopeIkAnimation = !!useAction && useAction.ik === 'bow';
      const isHandEnabled = (isSession || (isPlayerAiming && isObjectAimable)) /* && !isPlayingEnvelopeIkAnimation */;
      for (let i = 0; i < 2; i++) {
        const isExpectedHandIndex = i === ((aimComponent?.ikHand === 'left') ? 1 : (aimComponent?.ikHand === 'right') ? 0 : null);
        const enabled = isHandEnabled && isExpectedHandIndex;
        this.player.hands[i].enabled = enabled;
      }
    };
    _updateHandsEnabled();

    const _updateFakeHands = () => {
      if (!session) {
        localMatrix.copy(this.player.matrixWorld)
          .decompose(localVector, localQuaternion, localVector2);
  
        const avatarHeight = this.player.avatar ? this.player.avatar.height : 0;
        const handOffsetScale = this.player.avatar ? avatarHeight / 1.5 : 1;
        if (this.player.hands[0].enabled) {
          const leftGamepadPosition = localVector2.copy(localVector)
            .add(localVector3.copy(leftHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion));
          const leftGamepadQuaternion = localQuaternion;
          /* const leftGamepadPointer = 0;
          const leftGamepadGrip = 0;
          const leftGamepadEnabled = false; */
          
          this.player.leftHand.position.copy(leftGamepadPosition);
          this.player.leftHand.quaternion.copy(leftGamepadQuaternion);
        }
        if (this.player.hands[1].enabled) {
          const rightGamepadPosition = localVector2.copy(localVector)
            .add(localVector3.copy(rightHandOffset).multiplyScalar(handOffsetScale).applyQuaternion(localQuaternion));
          const rightGamepadQuaternion = localQuaternion;
          /* const rightGamepadPointer = 0;
          const rightGamepadGrip = 0;
          const rightGamepadEnabled = false; */
  
          this.player.rightHand.position.copy(rightGamepadPosition);
          this.player.rightHand.quaternion.copy(rightGamepadQuaternion);
        }
      }
    };
    _updateFakeHands();

    const _updatePistolIkAnimation = () => {
      const kickbackExponent = 0.05;
      const fakeArmLength = 0.2;
      const smgUse = !!useAction && useAction.ik === 'smg';
      const kickbackTime = smgUse ? 100 : 300;
      const pistolUse = !!useAction && useAction.ik === 'pistol';
      if (!this.lastPistolUse && (pistolUse || smgUse)) {
        this.lastPistolUseStartTime = now;
      }
      if(!(smgUse || pistolUse))
        this.lastPistolUseStartTime = -Infinity;
      this.lastPistolUse = pistolUse || smgUse;
      if (isFinite(this.lastPistolUseStartTime)) {
        const lastUseTimeDiff = now - this.lastPistolUseStartTime;
        const f = Math.min(Math.max(lastUseTimeDiff / kickbackTime, 0), 1);
        const v = Math.sin(Math.pow(f, kickbackExponent) * Math.PI);
        localQuaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            localVector.copy(this.player.leftHand.position),
            localVector2.copy(this.player.leftHand.position)
              .add(
                localVector3.set(0, 1, -1)
                  .applyQuaternion(this.player.leftHand.quaternion)
              ),
            localVector3.set(0, 0, 1)
              .applyQuaternion(this.player.leftHand.quaternion)
          )
        );
        
        this.player.leftHand.position.sub(
          localVector.set(0, 0, -fakeArmLength)
            .applyQuaternion(this.player.leftHand.quaternion)
        );
        
        this.player.leftHand.quaternion.slerp(localQuaternion, v);
        
        this.player.leftHand.position.add(
          localVector.set(0, 0, -fakeArmLength)
            .applyQuaternion(this.player.leftHand.quaternion)
        );

        this.player.leftHand.updateMatrixWorld();

        if (f >= 1) {
          this.lastPistolUseStartTime = smgUse ? now : -Infinity;
        }
      }
    };

    _updatePistolIkAnimation();

    const _updateBowIkAnimation = () => {
      const bowUse = !!useAction && useAction.ik === 'bow';
      // console.log('got use action', !!pistolUse, useAction?.ik);
      if (!this.lastBowUse && bowUse) {
        this.lastBowUseStartTime = now;
      }
      if (!bowUse) {
        this.lastBowUseStartTime = -Infinity;
      }
      this.lastBowUse = bowUse;

      if (isFinite(this.lastBowUseStartTime)) {
        const lastUseTimeDiff = now - this.lastBowUseStartTime;
        // const fakeArmLength = 0.2;

        const v = Math.min(Math.max(lastUseTimeDiff / 300, 0), 1);
        
        const targetPosition = localVector.copy(this.player.rightHand.position).add(
          localVector2.set(-rightHandOffset.x*2, 0, -0.2)
            .applyQuaternion(this.player.rightHand.quaternion)
        );
        const targetQuaternion = localQuaternion.copy(this.player.rightHand.quaternion)
          .multiply(z22Quaternion);

        this.player.rightHand.position.lerp(targetPosition, v);
        this.player.rightHand.quaternion.slerp(targetQuaternion, v);
        
        /* this.player.rightHand.quaternion.slerp(localQuaternion, v);
        this.player.rightHand.position.add(
          localVector.set(0, 0, -fakeArmLength)
            .applyQuaternion(this.player.rightHand.quaternion)
        ); */

        this.player.rightHand.updateMatrixWorld();
      }
    };
    _updateBowIkAnimation();
  }
  update(now, timeDiffS) {
    this.applyGravity(timeDiffS);
    this.updateVelocity(timeDiffS);
    this.applyAvatarPhysics(now, timeDiffS);
    this.applyAvatarActionKinematics(now, timeDiffS);
  }
  reset() {
    if (this.player.avatar) {
      this.velocity.set(0, 0, 0);
    }
  }
  destroy() {
    // nothing
  }
}

export {
  CharacterPhysics,
};
