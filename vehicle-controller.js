/* this is the vehicle physics implementation. */

import * as THREE from 'three';
import cameraManager from './camera-manager.js';
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

const zeroVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);


class VehicleController {
  constructor(vehicle, driver) {
    this.vehicle = vehicle;
    this.controllingCharacter = driver;
    this.rigidBody = null;
    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3(0,0,0);

    this.yaw = 0;
    this.roll = 0;
    this.pitch = 0;

    this.enginePower = 0;

    this.damping = 5;
    console.log(this.controllingCharacter);
  }
  /* apply the currently held keys to the vehicle */
  applyWasd() {
    //localVector.copy(0, keysDirection.x, 0);
    //this.velocity.add(localVector);
  }
  applyAvatarPhysicsDetail(timeDiffS) {
    if (this.vehicle && physicsManager.physicsEnabled) {

      this.rigidBody = this.vehicle;

      if(!this.rigidBody) return;

      physicsManager.disableGeometryQueries(this.rigidBody);
      physicsManager.enablePhysicsObject(this.rigidBody);

      // vehicle physics
      if (this.vehicle && this.controllingCharacter) {
        const keysDirection = this.controllingCharacter.characterPhysics.keysDirection;
        this.controllingCharacter.avatar.app.visible = false;
        //this.velocity.add(keysDirection);
        //const angularVel = new THREE.Vector3(this.pitch, this.yaw, this.roll);
        //this.angularVelocity.add(angularVel);
      }
    }
  }
  updateVelocity() {
    if(this.vehicle && physicsManager.physicsEnabled) {
      if(this.rigidBody) {
        let enableGravity = false;
        physicsManager.setVelocity(this.rigidBody, this.velocity, this.angularVelocity, enableGravity);
      }
    }
  }
  updateTransform() {
    if(this.rigidBody && physicsManager.physicsEnabled) {
      localArray.push({
        id: this.rigidBody.physicsId,
        position: this.rigidBody.position,
        quaternion: this.rigidBody.quaternion,
        scale: this.rigidBody.scale,
      });
      const newTransform = physicsManager.getTransforms(localArray);
      localArray.length = 0;

      for (const updateOut of newTransform)
        {
          const {id, position, quaternion, scale} = updateOut; 
          if(id === this.rigidBody.physicsId) {
            this.rigidBody.position.copy(position);
            this.rigidBody.quaternion.copy(quaternion);
            this.rigidBody.updateMatrixWorld();
            this.rigidBody.needsUpdate = false;
          }
        }
      }
  }
  updateRigidbody() {
    this.updateVelocity();
    this.updateTransform();
  }
  applyDamping(timeDiffS) {
    const timeDiff = timeDiffS * 1000;
    const factor = getVelocityDampingFactor(groundFriction, timeDiff);
    //this.velocity.x *= factor;
    this.velocity.y *= factor;
    //this.velocity.z *= factor;

    //this.angularVelocity.x *= factor;
    //this.angularVelocity.y *= factor;
    //this.angularVelocity.z *= factor;

    // Angular damping
    this.angularVelocity.x *= 0.97;
    this.angularVelocity.y *= 0.97;
    this.angularVelocity.z *= 0.97;

  }
  updateYaw(timeDiffS) {
    const timeDiff = timeDiffS * 1000;
    const factor = getVelocityDampingFactor(0.999, timeDiff);

    let quat = new THREE.Quaternion(this.vehicle.quaternion.x, this.vehicle.quaternion.y, this.vehicle.quaternion.z, this.vehicle.quaternion.w);
    let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    let globalUp = new THREE.Vector3(0, 1, 0);
    let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);

    if(ioManager.keys.yawLeft) {
      this.angularVelocity.x += up.x * 0.07 * this.enginePower / this.damping;
      this.angularVelocity.y += up.y * 0.07 * this.enginePower / this.damping
      this.angularVelocity.z += up.z * 0.07 * this.enginePower / this.damping;
    }
    if (ioManager.keys.yawRight) {
      this.angularVelocity.x -= up.x * 0.07 * this.enginePower / this.damping;
      this.angularVelocity.y -= up.y * 0.07 * this.enginePower / this.damping;
      this.angularVelocity.z -= up.z * 0.07 * this.enginePower / this.damping;
    }
  }

  updatePitch(timeDiffS) {
    const timeDiff = timeDiffS * 1000;
    const factor = getVelocityDampingFactor(0.999, timeDiff);

    let quat = new THREE.Quaternion(this.vehicle.quaternion.x, this.vehicle.quaternion.y, this.vehicle.quaternion.z, this.vehicle.quaternion.w);
    let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    let globalUp = new THREE.Vector3(0, 1, 0);
    let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);


    if(ioManager.keys.up) {
      this.angularVelocity.x += right.x * 0.07 * this.enginePower/ this.damping;
      this.angularVelocity.y += right.y * 0.07 * this.enginePower/ this.damping;
      this.angularVelocity.z += right.z * 0.07 * this.enginePower/ this.damping;
    }
    if (ioManager.keys.down) {
      this.angularVelocity.x -= right.x * 0.07 * this.enginePower/ this.damping;
      this.angularVelocity.y -= right.y * 0.07 * this.enginePower/ this.damping;
      this.angularVelocity.z -= right.z * 0.07 * this.enginePower/ this.damping;
    }
  }

  updateRoll(timeDiffS) {
    const timeDiff = timeDiffS * 1000;
    const factor = getVelocityDampingFactor(0.999, timeDiff);

    let quat = new THREE.Quaternion(this.vehicle.quaternion.x, this.vehicle.quaternion.y, this.vehicle.quaternion.z, this.vehicle.quaternion.w);
    let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    let globalUp = new THREE.Vector3(0, 1, 0);
    let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);

    if(ioManager.keys.left) {
      this.angularVelocity.x -= forward.x * 0.07 * this.enginePower/ this.damping;
      this.angularVelocity.y -= forward.y * 0.07 * this.enginePower/ this.damping;
      this.angularVelocity.z -= forward.z * 0.07 * this.enginePower/ this.damping;
    }
    if (ioManager.keys.right) {
      this.angularVelocity.x += forward.x * 0.07 * this.enginePower/ this.damping;
      this.angularVelocity.y += forward.y * 0.07 * this.enginePower/ this.damping;
      this.angularVelocity.z += forward.z * 0.07 * this.enginePower/ this.damping;
    }
  }

  updateStablize(timeDiffS) {

    let quat = new THREE.Quaternion(this.vehicle.quaternion.x, this.vehicle.quaternion.y, this.vehicle.quaternion.z, this.vehicle.quaternion.w);
    let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    let globalUp = new THREE.Vector3(0, 1, 0);
    let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);

    let rotStabVelocity = new THREE.Quaternion().setFromUnitVectors(up, globalUp);
    rotStabVelocity.x *= 0.3;
    rotStabVelocity.y *= 0.3;
    rotStabVelocity.z *= 0.3;
    rotStabVelocity.w *= 0.3;
    let rotStabEuler = new THREE.Euler().setFromQuaternion(rotStabVelocity);
    
    this.angularVelocity.x += rotStabEuler.x * this.enginePower / this.damping;
    this.angularVelocity.y += rotStabEuler.y * this.enginePower/ this.damping;
    this.angularVelocity.z += rotStabEuler.z * this.enginePower/ this.damping;
  }

  updateControls(timeDiffS) {

    let quat = new THREE.Quaternion(this.vehicle.quaternion.x, this.vehicle.quaternion.y, this.vehicle.quaternion.z, this.vehicle.quaternion.w);
    let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
    let globalUp = new THREE.Vector3(0, 1, 0);
    let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);

    if(ioManager.keys.shift) {
      if(this.enginePower < 10) {
        this.enginePower += 0.05;
      }
      //this.enginePower = 10;
      this.velocity.x += up.x * 0.15 * this.enginePower;
      this.velocity.y += up.y * 0.5 * this.enginePower;
      this.velocity.z += up.z * 0.15 * this.enginePower;

    }
    if (ioManager.keys.backward) {
      //this.enginePower = 0;
      this.velocity.x -= up.x * 0.15 * this.enginePower;
      this.velocity.y -= up.y * 0.5 * this.enginePower;
      this.velocity.z -= up.z * 0.15 * this.enginePower;
    }

    let gravity = new THREE.Vector3(0, -9.81, 0);
    let gravityCompensation = new THREE.Vector3(-gravity.x, -gravity.y, -gravity.z).length();
    gravityCompensation *= timeDiffS;
    gravityCompensation *= 0.98;
    let dot = globalUp.dot(up);
    gravityCompensation *= Math.sqrt(THREE.MathUtils.clamp(dot, 0, 1));

    let vertDamping = new THREE.Vector3(0, this.velocity.y, 0).multiplyScalar(-0.01);
    let vertStab = up.clone();
    vertStab.multiplyScalar(gravityCompensation);
    vertStab.add(vertDamping);
    vertStab.multiplyScalar(this.enginePower);

    this.velocity.add(vertStab) 

    // Positional damping
    this.velocity.x *= THREE.MathUtils.lerp(1, 0.995, this.enginePower);
    this.velocity.z *= THREE.MathUtils.lerp(1, 0.995, this.enginePower);
    //this.velocity.y *= THREE.MathUtils.lerp(1, 0.995, this.enginePower);
  }

  update(timeDiffS) {
    //this.applyGravity(timeDiffS);
    this.updateControls(timeDiffS);
    this.updateYaw(timeDiffS);
    this.updatePitch(timeDiffS);
    this.updateRoll(timeDiffS);
    this.updateStablize(timeDiffS);
    this.applyDamping(timeDiffS);
    this.updateRigidbody();
    //this.applyAvatarPhysics(timeDiffS);
    this.applyAvatarPhysicsDetail(timeDiffS);
    //this.updateCamera(timeDiffS);
  }
  reset() {
    this.velocity.set(0, 0, 0);
  }
}

export {
  VehicleController,
};