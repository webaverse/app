import * as THREE from 'three';
import {getRenderer, camera, scene} from './renderer.js';
// import * as notifications from './notifications.js';
import metaversefile from 'metaversefile';
import physicsManager from './physics-manager.js';
import {shakeAnimationSpeed} from './constants.js';
import Simplex from './simplex-noise.js';
// import alea from './alea.js';
// import * as sounds from './sounds.js';
import {minFov, maxFov, midFov} from './constants.js';
// import { updateRaycasterFromMouseEvent } from './util.js';
import easing from './easing.js';

const cubicBezier = easing(0, 1, 0, 1);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localVector8 = new THREE.Vector3();
const localVector9 = new THREE.Vector3();
const localVector10 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localQuaternion4 = new THREE.Quaternion();
const localQuaternion5 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localPlane = new THREE.Plane();

/*
Anon: "Hey man, can I get your autograph?"
Drake: "Depends. What's it worth to you?"
Anon: "Your first born child"
Drake: "No thanks. I don't think your child would be worth very much."
*/

const zeroVector = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);

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

/* function getNormal(u, v) {
  return localPlane.setFromCoplanarPoints(zeroVector, u, v).normal;
} */
/* function signedAngleTo(u, v) {
  // Get the signed angle between u and v, in the range [-pi, pi]
  const angle = u.angleTo(v);
  console.log('signed angle to', angle, u.dot(v));
  return (u.dot(v) >= 0 ? 1 : -1) * angle;
} */
/* function signedAngleTo(a, b, v) {
  const s = v.crossVectors(a, b).length();
  // s = length(cross_product(a, b))
  const c = a.dot(b);
  const angle = Math.atan2(s, c);
  console.log('get signed angle', s, c, angle);
  return angle;
} */
const getSideOfY = (() => {
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  const localPlane = new THREE.Plane();

  function getSideOfY(a, b) {
    localQuaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        zeroVector,
        a,
        upVector
      )
    );
    const rightVector = localVector.set(1, 0, 0).applyQuaternion(localQuaternion);
    localPlane.setFromNormalAndCoplanarPoint(rightVector, a);
    const distance = localPlane.distanceToPoint(b, localVector2);
    return distance >= 0 ? 1 : -1;
  }
  return getSideOfY;
})();

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

/* const redMesh = (() => {
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshBasicMaterial({color: 0xff0000});
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  return mesh;
})();
scene.add(redMesh);

const blueMesh = (() => {
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshBasicMaterial({color: 0x0000ff});
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  return mesh;
})();
scene.add(blueMesh); */

class CameraManager extends EventTarget {
  constructor() {
    super();

    this.pointerLockElement = null;
    // this.pointerLockEpoch = 0;
    this.shakes = [];
    this.focus = false;
    this.lastFocusChangeTime = 0;
    this.fovFactor = 0;
    this.lastNonzeroDirectionVector = new THREE.Vector3(0, 0, -1);

    this.lastNonzeroDirectionVector = new THREE.Vector3(0, 0, -1);
    this.fovFactor = 0;

    this.target = null;
    this.target2 = null;
    this.lastTarget = null;
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.targetQuaternion = new THREE.Quaternion();
    this.sourcePosition = new THREE.Vector3();
    this.sourceQuaternion = new THREE.Quaternion();
    this.lerpStartTime = 0;
    this.lastTimestamp = 0;

    document.addEventListener('pointerlockchange', e => {
      let pointerLockElement = document.pointerLockElement;
      const renderer = getRenderer();
      if (pointerLockElement !== null && pointerLockElement !== renderer.domElement) {
        pointerLockElement = null;
      }

      this.pointerLockElement = pointerLockElement;
      this.dispatchEvent(new MessageEvent('pointerlockchange', {
        data: {
          pointerLockElement,
        },
      }));
    });
  }
  focusCamera(position) {
    camera.lookAt(position);
    camera.updateMatrixWorld();
  }
  async requestPointerLock() {
    // const localPointerLockEpoch = ++this.pointerLockEpoch;
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
              // if (localPointerLockEpoch === this.pointerLockEpoch) {
                accept();
              // }
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
    // e.preventDefault();

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
  setFocus(focus) {
    if (focus !== this.focus) {
      this.focus = focus;
      this.lastFocusChangeTime = performance.now();

      this.dispatchEvent(new MessageEvent('focuschange', {
        data: {
          focus,
        },
      }));
    }
  }
  setTarget(target = null, target2 = null) {
    this.target = target;
    this.target2 = target2;
  }
  updatePost(timestamp, timeDiff) {
    // console.log('camera manager update post');

    const localPlayer = metaversefile.useLocalPlayer();
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    const startMode = this.getMode();

    if (this.target) {
      if (this.target !== this.lastTarget) {
        const _setCameraToTarget = () => {
          this.target.matrixWorld.decompose(localVector, localQuaternion, localVector2);
          
          if (this.target2) {
            this.target2.matrixWorld.decompose(localVector3, localQuaternion2, localVector4);

            const faceDirection = localVector5.set(0, 0, 1).applyQuaternion(localQuaternion);
            const lookQuaternion = localQuaternion3.setFromRotationMatrix(
              localMatrix.lookAt(
                localVector,
                localVector3,
                upVector,
              )
            );
            const lookDirection = localVector6.set(0, 0, -1).applyQuaternion(lookQuaternion);

            /* // debug meshes
            redMesh.position.copy(localVector).add(faceDirection);
            redMesh.updateMatrixWorld();
            blueMesh.position.copy(localVector).add(lookDirection);
            blueMesh.updateMatrixWorld(); */

            // const theta = signedAngleTo(faceDirection, lookDirection, localVector7);
            const sideOfY = getSideOfY(faceDirection, lookDirection);

            /* const forwardY = localEuler.setFromQuaternion(localQuaternion, 'YXZ').y;
            const lookY = localEuler.setFromQuaternion(lookQuaternion, 'YXZ').y;
            const theta = forwardY - lookY; */
            
            /* const lookDirection = localVector3.set(0, 0, -1)
              .applyQuaternion(lookQuaternion);
            lookDirection.y = 0;
            lookDirection.normalize();

            const theta = Math.acos(forwardDirection.dot(lookDirection)); */
            
            // console.log('got theta', sideOfY, faceDirection.toArray().join(', '), lookDirection.toArray().join(', '));
            // const side = sideOfY < 0 ? 'left' : 'right';
            // const face = faceDirection.dot(lookDirection) >= 0 ? 'front' : 'back';
            // console.log(`scene to the ${side} and ${face}`);

            const dollyPosition = localVector7.copy(localVector)
              .add(localVector3)
              .multiplyScalar(0.5);

            dollyPosition.add(
              localVector8.set(sideOfY * -0.3, 0, 0).applyQuaternion(lookQuaternion)
            );

            const lookToDollyVector = localVector9.copy(dollyPosition).sub(localVector).normalize();

            this.targetPosition.copy(localVector)
              .add(lookToDollyVector);
            this.targetQuaternion.setFromRotationMatrix(
              localMatrix.lookAt(
                lookToDollyVector,
                zeroVector,
                upVector
              )
            );

            if (!this.lastTarget) {
              this.targetPosition.add(localVector10.set(0, 0, -0.65).applyQuaternion(this.targetQuaternion));
              this.targetQuaternion.multiply(localQuaternion4.setFromAxisAngle(upVector, sideOfY * -Math.PI * 0.87));
              this.targetPosition.add(localVector10.set(0, 0, 0.65).applyQuaternion(this.targetQuaternion));
            }
          } else {
            this.targetPosition.copy(localVector)
              .add(localVector2.set(0, 0, 1).applyQuaternion(localQuaternion));
            this.targetQuaternion.copy(localQuaternion);
          }

          this.sourcePosition.copy(camera.position);
          this.sourceQuaternion.copy(camera.quaternion);
          this.lerpStartTime = timestamp;
          this.lastTimestamp = timestamp;

          cameraOffsetZ = -0.65;
          cameraOffset.z = -0.65;
        };
        _setCameraToTarget();
      }

      const _getLerpDelta = (position, quaternion) => {
        const lerpTime = 2000;
        const lastTimeFactor = Math.min(Math.max(cubicBezier((this.lastTimestamp - this.lerpStartTime) / lerpTime), 0), 1);
        const currentTimeFactor = Math.min(Math.max(cubicBezier((timestamp - this.lerpStartTime) / lerpTime), 0), 1);
        if (lastTimeFactor !== currentTimeFactor) {
          {
            
            const lastLerp = localVector.copy(this.sourcePosition).lerp(this.targetPosition, lastTimeFactor);
            const currentLerp = localVector2.copy(this.sourcePosition).lerp(this.targetPosition, currentTimeFactor);
            position.add(currentLerp).sub(lastLerp);
          }
          {
            const lastLerp = localQuaternion.copy(this.sourceQuaternion).slerp(this.targetQuaternion, lastTimeFactor);
            const currentLerp = localQuaternion2.copy(this.sourceQuaternion).slerp(this.targetQuaternion, currentTimeFactor);
            quaternion.premultiply(lastLerp.invert()).premultiply(currentLerp);
          }
        }

        this.lastTimestamp = timestamp;
      };
      _getLerpDelta(camera.position, camera.quaternion);
      // camera.position.add(localQuaternion3);
      // camera.quaternion.premultiply(lerpDelta.quaternion);
      // camera.position.lerp(this.targetPosition, 0.1);
      // camera.quaternion.slerp(this.targetQuaternion, 0.1);
      // camera.position.copy(this.targetPosition);
      // camera.quaternion.copy(this.targetQuaternion);
      camera.updateMatrixWorld();
    } else {
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

      const _setCameraToAvatar = () => {
        if (!this.focus) {
          const avatarCameraOffset = session ? rayVectorZero : this.getCameraOffset();
          const avatarHeight = localPlayer.avatar ? localPlayer.avatar.height : 0;
          const crouchOffset = avatarHeight * (1 - localPlayer.getCrouchFactor()) * 0.5;
          
          const endMode = this.getMode();
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
        } else {
          cameraOffsetTargetZ = -1;

          const targetPosition = localVector.copy(localPlayer.position)
            .add(localVector2.set(0, 0, -cameraOffsetTargetZ).applyQuaternion(localPlayer.quaternion));
          const targetQuaternion = localPlayer.quaternion;
          camera.position.lerp(targetPosition, 0.2);
          camera.quaternion.slerp(targetQuaternion, 0.2);
          // camera.updateMatrixWorld();
        }
      };
      _setCameraToAvatar();
    };

    const endMode = this.getMode();
    if (endMode !== startMode) {
      this.dispatchEvent(new MessageEvent('modechange', {
        data: {
          mode: endMode,
        },
      }));
    }
      
    const _setCameraFov = () => {
      if (!renderer.xr.getSession()) {
        const focusTime = (timestamp - this.lastFocusChangeTime) / 300;
        if (focusTime < 1) {
          // const fovInTime = 3;
          // const fovOutTime = 0.3;

          this.fovFactor = 0;

          const a = this.focus ? minFov : midFov;
          const b = this.focus ? midFov : minFov;
          camera.fov = a * (1 - focusTime) + focusTime * b;
          camera.updateProjectionMatrix();
        } else if (this.focus) {
          this.fovFactor = 0;

          camera.fov = midFov;
          camera.updateProjectionMatrix();
        } else {
          const fovInTime = 3;
          const fovOutTime = 0.3;
          
          const narutoRun = localPlayer.getAction('narutoRun');
          if (narutoRun) {
            if (this.lastNonzeroDirectionVector.z < 0) {    
              this.fovFactor += timeDiff / 1000 / fovInTime;
            } else {
              this.fovFactor -= timeDiff / 1000 / fovInTime;
            }
          } else {
            this.fovFactor -= timeDiff / 1000 / fovOutTime;
          }
          this.fovFactor = Math.min(Math.max(this.fovFactor, 0), 1);
          
          camera.fov = minFov + Math.pow(this.fovFactor, 0.75) * (maxFov - minFov);
          camera.updateProjectionMatrix();
        }
      }
    };
    _setCameraFov();

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

    this.lastTarget = this.target;
  }
};
const cameraManager = new CameraManager();
export default cameraManager;