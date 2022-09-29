import * as THREE from 'three';
import {getEyePosition} from './util.mjs';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localPlane = new THREE.Plane();
export default class Looker {
  constructor(avatar) {
    this.avatar = avatar;

    this.mode = 'ready';
    this.startTarget = new THREE.Vector3();
    this.endTarget = new THREE.Vector3();
    this.waitTime = 0;
    this.lastTimestamp = 0;

    this._target = new THREE.Vector3();
  }

  // returns the world space eye target
  update(now) {
    const _getEndTargetRandom = target => {
      const root = this.avatar.modelBoneOutputs.Root;
      const eyePosition = getEyePosition(this.avatar.modelBones);
      return target
        .copy(eyePosition)
        .add(
          localVector
            .set(0, 0, 1.5 + 3 * Math.random())
            .applyQuaternion(
              localQuaternion.setFromRotationMatrix(root.matrixWorld),
            ),
        )
        .add(
          localVector
            .set(
              -0.5 + Math.random(),
              (-0.5 + Math.random()) * 0.3,
              -0.5 + Math.random(),
            )
            .normalize(),
          // .multiplyScalar(1)
        );
    };
    const _getEndTargetForward = target => {
      const root = this.avatar.modelBoneOutputs.Root;
      const eyePosition = getEyePosition(this.avatar.modelBones);
      return target
        .copy(eyePosition)
        .add(
          localVector
            .set(0, 0, 2)
            .applyQuaternion(
              localQuaternion.setFromRotationMatrix(root.matrixWorld),
            ),
        );
    };
    const _startMove = () => {
      this.mode = 'moving';
      // const head = this.avatar.modelBoneOutputs['Head'];
      // const root = this.avatar.modelBoneOutputs['Root'];
      this.startTarget.copy(this.endTarget);
      _getEndTargetRandom(this.endTarget);
      this.waitTime = 100;
      this.lastTimestamp = now;
    };
    const _startDelay = () => {
      this.mode = 'delay';
      this.waitTime = Math.random() * 2000;
      this.lastTimestamp = now;
    };
    const _startWaiting = () => {
      this.mode = 'waiting';
      this.waitTime = Math.random() * 3000;
      this.lastTimestamp = now;
    };
    const _isSpeedTooFast = () => this.avatar.velocity.length() > 0.5;
    const _isPointTooClose = () => {
      const root = this.avatar.modelBoneOutputs.Root;
      // const head = this.avatar.modelBoneOutputs['Head'];
      localVector
        .set(0, 0, 1)
        .applyQuaternion(
          localQuaternion.setFromRotationMatrix(root.matrixWorld),
        );
      localVector2.setFromMatrixPosition(root.matrixWorld);
      localPlane.setFromNormalAndCoplanarPoint(localVector, localVector2);
      const distance = localPlane.distanceToPoint(this.endTarget);
      return distance < 1;
    };

    // console.log('got mode', this.mode, this.waitTime);

    if (_isSpeedTooFast()) {
      _getEndTargetForward(this.endTarget);
      // this.startTarget.copy(this.endTarget);
      _startDelay();
      return null;
    } else if (_isPointTooClose()) {
      _getEndTargetForward(this.endTarget);
      // this.startTarget.copy(this.endTarget);
      _startDelay();
      return null;
    } else {
      switch (this.mode) {
        case 'ready': {
          _startMove();
          return this.startTarget;
        }
        case 'delay': {
          const timeDiff = now - this.lastTimestamp;
          if (timeDiff > this.waitTime) {
            _startMove();
            return this.startTarget;
          } else {
            return null;
          }
        }
        case 'moving': {
          const timeDiff = now - this.lastTimestamp;
          const f = Math.min(Math.max(timeDiff / this.waitTime, 0), 1);
          // console.log('got time diff', timeDiff, this.waitTime, f);
          const target = this._target
            .copy(this.startTarget)
            .lerp(this.endTarget, f);
          // _setTarget(target);

          if (f >= 1) {
            _startWaiting();
          }

          return target;
        }
        case 'waiting': {
          const f = Math.min(
            Math.max((now - this.lastTimestamp) / this.waitTime, 0),
            1,
          );
          if (f >= 1) {
            _startMove();
            return this.startTarget;
          } else {
            return this.endTarget;
          }
        }
      }
    }
  }
}
