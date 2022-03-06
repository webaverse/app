import * as THREE from 'three';
import {getRenderer, camera} from './renderer.js';
import * as notifications from './notifications.js';
import metaversefile from 'metaversefile';
import physicsManager from './physics-manager.js';
import {shakeAnimationSpeed} from './constants.js';
import Simplex from './simplex-noise.js';
import alea from './alea.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();

const cameraOffset = new THREE.Vector3();
let cameraOffsetTargetZ = cameraOffset.z;

let cameraOffsetZ = cameraOffset.z;
const rayVectorZero = new THREE.Vector3(0,0,0);
const rayVectorUp = new THREE.Vector3(0,1,0);
const rayStartPos = new THREE.Vector3(0,0,0);
const rayDirection = new THREE.Vector3(0,0,0);
const rayOffsetPoint = new THREE.Vector3(0,0,0);
const rayMatrix = new THREE.Matrix4();
const rayQuaternion = new THREE.Quaternion();
const rayOriginArray = [new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0)]; // 6 elements
const rayDirectionArray = [new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion()]; // 6 elements

// const lastCameraQuaternion = new THREE.Quaternion();
// let lastCameraZ = 0;
// let lastCameraValidZ = 0;

const seed = 'camera';
const shakeNoise = new Simplex(seed);

class Shake extends THREE.Object3D {
  constructor(intensity, startTime, radius, decay) {
    super();

    this.intensity = intensity;
    this.startTime = startTime;
    this.radius = radius;
    this.decay = decay;
  }
}

function lerpNum(value1, value2, amount) {
  amount = amount < 0 ? 0 : amount;
  amount = amount > 1 ? 1 : amount;
  return value1 + (value2 - value1) * amount;
}
// Raycast from player to camera corner
function initCameraRayParams(arrayIndex,originPoint) {
  const localPlayer = metaversefile.useLocalPlayer();

  rayDirection.subVectors(localPlayer.position, originPoint).normalize();

  rayMatrix.lookAt(rayDirection,rayVectorZero,rayVectorUp);
  rayQuaternion.setFromRotationMatrix(rayMatrix);

  // Slightly move ray start position towards camera (to avoid hair,hat)
  rayStartPos.copy(localPlayer.position);
  rayStartPos.add( rayDirection.multiplyScalar(0.1) );

  rayOriginArray[arrayIndex].copy(rayStartPos);
  rayDirectionArray[arrayIndex].copy(rayQuaternion);

}
// Raycast from player postition with small offset
function initOffsetRayParams(arrayIndex,originPoint) {
  const localPlayer = metaversefile.useLocalPlayer();

  rayDirection.subVectors(localPlayer.position, camera.position).normalize();

  rayMatrix.lookAt(rayDirection,rayVectorZero,rayVectorUp);
  rayQuaternion.setFromRotationMatrix(rayMatrix);

  rayOriginArray[arrayIndex].copy(originPoint);
  rayDirectionArray[arrayIndex].copy(rayQuaternion);
}

class CameraManager extends EventTarget {
  constructor() {
    super();

    this.pointerLockElement = null;
    this.pointerLockEpoch = 0;
    this.shakes = [];
  }
  wasActivated() {
    return wasActivated;
  }
  focusCamera(position) {
    camera.lookAt(position);
    camera.updateMatrixWorld();
  }
  async requestPointerLock() {
    const localPointerLockEpoch = ++this.pointerLockEpoch;
    for (const options of [
      {
        unadjustedMovement: true,
      },
      undefined
    ]) {
      try {
        await new Promise((accept, reject) => {
          const renderer = getRenderer();
          if (document.pointerLockElement !== renderer.domElement) {
            const _pointerlockchange = e => {
              if (localPointerLockEpoch === this.pointerLockEpoch) {
                if (document.pointerLockElement === renderer.domElement) {
                  accept();

                  this.pointerLockElement = document.pointerLockElement;
                  this.dispatchEvent(new MessageEvent('pointerlockchange', {
                    data: {
                      pointerLockElement: this.pointerLockElement,
                    },
                  }));

                  const _setUpUnlockNotification = () => {
                    const _pointerlockchange2 = e => {
                      if (localPointerLockEpoch === this.pointerLockEpoch) {
                        if (document.pointerLockElement === null) {
                          this.pointerLockElement = document.pointerLockElement;

                          this.dispatchEvent(new MessageEvent('pointerlockchange', {
                            data: {
                              pointerLockElement: null,
                            },
                          }));
                        } else {
                          console.warn('unexpected pointer lock change 1', document.pointerLockElement);
                        }
                      }
                      _cleanup2();
                    };
                    document.addEventListener('pointerlockchange', _pointerlockchange2);
                    const _cleanup2 = () => {
                      document.removeEventListener('pointerlockchange', _pointerlockchange2);
                    };
                  };
                  _setUpUnlockNotification();
                } else {
                  console.warn('unexpected pointer lock change 2', document.pointerLockElement);
                }
              }
              _cleanup();
            };
            document.addEventListener('pointerlockchange', _pointerlockchange);
            const _pointerlockerror = err => {
              reject(err);
              _cleanup();
              
              /* notifications.addNotification(`\
                <i class="icon fa fa-mouse-pointer"></i>
                <div class=wrap>
                  <div class=label>Whoa there!</div>
                  <div class=text>
                    Hold up champ! The browser wants you to slow down.
                  </div>
                  <div class=close-button>✕</div>
                </div>
              `, {
                timeout: 3000,
              }); */
            };
            document.addEventListener('pointerlockerror', _pointerlockerror);
            const _cleanup = () => {
              document.removeEventListener('pointerlockchange', _pointerlockchange);
              document.removeEventListener('pointerlockerror', _pointerlockerror);
            };
            renderer.domElement.requestPointerLock(options)
              .catch(_pointerlockerror);
          } else {
            accept();
          }
        });
        break;
      } catch (err) {
        console.warn(err);
        continue;
      }
    }
  }
  exitPointerLock() {
    document.exitPointerLock();
  }
  getMode() {
    const f = -cameraOffset.z;
    if (f < 0.5) {
      return 'firstperson';
    } else {
      return 'isometric';
    }
  }
  getCameraOffset() {
    return cameraOffset;
  }
  handleWheelEvent(e) {
    e.preventDefault();

    cameraOffsetTargetZ = Math.min(cameraOffsetTargetZ - e.deltaY * 0.01, 0);
  }
  addShake(position, intensity, radius, decay) {
    const startTime = performance.now();
    const shake = new Shake(intensity, startTime, radius, decay);
    shake.position.copy(position);
    this.shakes.push(shake);
    return shake;
  }
  flushShakes() {
    if (this.shakes.length > 0) {
      const now = performance.now();
      this.shakes = this.shakes.filter(shake => now < shake.startTime + shake.decay);
    }
  }
  getShakeFactor() {
    let result = 0;
    if (this.shakes.length > 0) {
      const now = performance.now();
      for (const shake of this.shakes) {
        const distanceFactor = Math.min(Math.max((shake.radius - shake.position.distanceTo(camera.position))/shake.radius, 0), 1);
        const timeFactor = Math.min(Math.max(1 - (now - shake.startTime) / shake.decay, 0), 1);
        // console.log('get shake factor', shake.intensity * distanceFactor * timeFactor, shake.intensity, distanceFactor, timeFactor);
        result += shake.intensity * distanceFactor * timeFactor;
      }
    }
    return result;
  }
  updatePost(timestamp, timeDiff) {
    // console.log('camera manager update post');

    const localPlayer = metaversefile.useLocalPlayer();
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    const startMode = this.getMode();

    const _setCameraOffset = () => {
      let newVal = cameraOffsetTargetZ;
      let hasIntersection = false;

      // Camera - Top left 
      initCameraRayParams(0,rayStartPos.set(-1, 1, ( camera.near + camera.far ) / ( camera.near - camera.far )).unproject( camera ));

      // Camera - Bottom left
      initCameraRayParams(1,rayStartPos.set(-1, -1, ( camera.near + camera.far ) / ( camera.near - camera.far )).unproject( camera ));

      // Camera - Top right
      initCameraRayParams(2,rayStartPos.set(1, 1, ( camera.near + camera.far ) / ( camera.near - camera.far )).unproject( camera ));

      // Camera - Bottom right
      initCameraRayParams(3,rayStartPos.set(1, -1, ( camera.near + camera.far ) / ( camera.near - camera.far )).unproject( camera ));

      // Player postition - offset to left
      rayStartPos.copy(localPlayer.position);
      rayOffsetPoint.set(-1, 0, 0);
      rayOffsetPoint.applyQuaternion(camera.quaternion);
      rayOffsetPoint.normalize();
      rayStartPos.add(rayOffsetPoint);
      initOffsetRayParams(4,rayStartPos);
      
      // Player postition - offset to right
      rayStartPos.copy(localPlayer.position);
      rayOffsetPoint.set(1, 0, 0);
      rayOffsetPoint.applyQuaternion(camera.quaternion);
      rayOffsetPoint.normalize();
      rayStartPos.add(rayOffsetPoint);
      initOffsetRayParams(5,rayStartPos);

      let collisionArray = physicsManager.raycastArray(rayOriginArray, rayDirectionArray, 6);

      // Check collision from player to camera corners
      for(let i=0;i<4;i++) {
        if ((collisionArray.hit[i] === 1) && (collisionArray.distance[i] <= -1 * newVal)) {
          if (newVal < (-1 * (collisionArray.distance[i]-0.15))) {
            newVal = (-1 * (collisionArray.distance[i]-0.15));
            hasIntersection = true;
            //console.log(i + " " + collisionArray.distance[i]+ " " + collisionArray.hit[i]);
          }
        }
      }

      // Check collision from player pos and small offset to left and right - to camera center
      let offsetCollisionCount = 0;
      for(let i=4;i<6;i++) {
        if ((collisionArray.hit[i] === 1) && (collisionArray.distance[i] <= (-1 * cameraOffsetTargetZ))) {
          offsetCollisionCount++;
        }
      }

      // Discard collision with small objects
      if (hasIntersection && (offsetCollisionCount === 0)) {
        hasIntersection = false;
        newVal = cameraOffsetTargetZ;
      }
      
      /* // Remove jitter when there is no movement
      if (lastCameraQuaternion.equals(camera.quaternion) && lastCameraZ === cameraOffsetTargetZ) {
        if (lastCameraValidZ < newVal) {
          lastCameraValidZ = newVal;
        }
        if (newVal < lastCameraValidZ)
          newVal = lastCameraValidZ;
      } else { */
        // lastCameraQuaternion.copy(camera.quaternion);
        // lastCameraZ = cameraOffsetTargetZ;
        // lastCameraValidZ = cameraOffsetTargetZ;
      // }

      // Slow zoom out if there is no intersection
      cameraOffsetZ = lerpNum(cameraOffsetZ,newVal, 0.2);

      // Fast zoom in to the point of intersection
      if (hasIntersection) {
        cameraOffsetZ = newVal;
      }

      const zDiff = Math.abs(cameraOffset.z - cameraOffsetZ);
      if (zDiff === 0) {
        // nothing
      } else {
        // camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
        cameraOffset.z = cameraOffsetZ;
        // camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
        // camera.updateMatrixWorld();
      }
    };
    _setCameraOffset();

    const endMode = this.getMode();
    if (endMode !== startMode) {
      this.dispatchEvent(new MessageEvent('modechange', {
        data: {
          mode: endMode,
        },
      }));
    }

    const _setCameraToAvatar = () => {
      const avatarCameraOffset = session ? zeroVector : this.getCameraOffset();
      const avatarHeight = localPlayer.avatar ? localPlayer.avatar.height : 0;
      const crouchOffset = avatarHeight * (1 - localPlayer.getCrouchFactor()) * 0.5;
      
      switch (endMode) {
        case 'firstperson': {
          if (localPlayer.avatar) {
            const boneNeck = localPlayer.avatar.foundModelBones['Neck'];
            const boneEyeL = localPlayer.avatar.foundModelBones['Eye_L'];
            const boneEyeR = localPlayer.avatar.foundModelBones['Eye_R'];
            const boneHead = localPlayer.avatar.foundModelBones['Head'];

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
            localVector3.copy(localPlayer.position);
          }

          camera.position.copy(localVector3)
            .sub(localVector.copy(avatarCameraOffset).applyQuaternion(camera.quaternion));

          break;
        }
        case 'isometric': {
          camera.position.copy(localPlayer.position)
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
    };
    _setCameraToAvatar();

    const _shakeCamera = () => {
      this.flushShakes();
      const shakeFactor = this.getShakeFactor();
      if (shakeFactor > 0) {
        const baseTime = timestamp/1000 * shakeAnimationSpeed;
        const timeOffset = 1000;
        const ndc = f => (-0.5 + f) * 2;
        let index = 0;
        const randomValue = () => ndc(shakeNoise.noise1D(baseTime + timeOffset * index++));
        localVector.set(
          randomValue(),
          randomValue(),
          randomValue()
        )
          .normalize()
          .multiplyScalar(shakeFactor * randomValue());
        camera.position.add(localVector);
        // camera.updateMatrixWorld();
      }
    };
    _shakeCamera();

    camera.updateMatrixWorld();
  }
};
const cameraManager = new CameraManager();
export default cameraManager;