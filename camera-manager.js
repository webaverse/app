import * as THREE from 'three';
import {getRenderer, camera} from './renderer.js';
import * as notifications from './notifications.js';
import metaversefile from 'metaversefile';
import physicsManager from './physics-manager.js';
import { Vector3 } from 'three';
import { Quaternion } from 'three';

const localVector = new THREE.Vector3();

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

const lastCameraQuaternion = new THREE.Quaternion();
let lastCameraZ = 0;
let lastCameraValidZ = 0;


/* const thirdPersonCameraOffset = new THREE.Vector3(0, 0, -1.5);
const isometricCameraOffset = new THREE.Vector3(0, 0, -2); */

const requestPointerLock = async () => {
  for (const options of [
    {
      unadjustedMovement: true,
    },
    undefined
  ]) {
    try {
      await new Promise((accept, reject) => {
        if (!document.pointerLockElement) {
          const _pointerlockchange = e => {
            accept();
            _cleanup();
          };
          document.addEventListener('pointerlockchange', _pointerlockchange);
          const _pointerlockerror = err => {
            reject(err);
            _cleanup();
            
            notifications.addNotification(`\
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
            });
          };
          document.addEventListener('pointerlockerror', _pointerlockerror);
          const _cleanup = () => {
            document.removeEventListener('pointerlockchange', _pointerlockchange);
            document.removeEventListener('pointerlockerror', _pointerlockerror);
          };
          const renderer = getRenderer();
          renderer.domElement.requestPointerLock(options);
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
};
const focusCamera = position => {
  camera.lookAt(position);
  camera.updateMatrixWorld();
};

const cameraManager = {
  wasActivated() {
    return wasActivated;
  },
  focusCamera,
  requestPointerLock,
  getMode() {
    const f = -cameraOffset.z;
    if (f < 0.5) {
      return 'firstperson';
    } else {
      return 'isometric';
    }
  },
  getCameraOffset() {
    return cameraOffset;
  },
  getCameraOffsetTarget() {
    // Prevent position inside head
    if (cameraOffsetTargetZ >= -0.5) {
      return 0;
    } else {
      return cameraOffsetTargetZ;
    }
  },
  handleWheelEvent(e) {
    e.preventDefault();
  
    // if (controlsManager.isPossessed()) {
      camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
      
      camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
      camera.updateMatrixWorld();
      
      cameraOffsetTargetZ = Math.min(cameraOffsetTargetZ - e.deltaY * 0.01, 0);


      // physicsManager.unlockControls();
    /* } else {
      camera.position.add(
        localVector.set(0, 0, e.deltaY * 0.01)
          .applyQuaternion(camera.quaternion)
      );
      camera.updateMatrixWorld();
    } */
  },
  update(timeDiff) {

    function lerpNum(value1, value2, amount) {
      amount = amount < 0 ? 0 : amount;
      amount = amount > 1 ? 1 : amount;
      return value1 + (value2 - value1) * amount;
    }

    // Raycast from player to camera corner
    function initCameraRayParams(arrayIndex,originPoint) {

      rayDirection.subVectors(localPlayer.position, originPoint ).normalize();

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

      rayDirection.subVectors(localPlayer.position,camera.position ).normalize();

      rayMatrix.lookAt(rayDirection,rayVectorZero,rayVectorUp);
      rayQuaternion.setFromRotationMatrix(rayMatrix);

      rayOriginArray[arrayIndex].copy(originPoint);
      rayDirectionArray[arrayIndex].copy(rayQuaternion);

    }


    const localPlayer = metaversefile.useLocalPlayer();

    

    let newVal = this.getCameraOffsetTarget();
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

    // Check collision from player pos and small offset to left and righ - to camera center
    let offsetCollisionCount = 0;
    for(let i=4;i<6;i++) {
      if ((collisionArray.hit[i] === 1) && (collisionArray.distance[i] <= (-1 * cameraOffsetTargetZ))) {
        offsetCollisionCount++;
      }
    }

    // Discard collision with small objects
    if (hasIntersection && (offsetCollisionCount === 0))
    {
      hasIntersection = false;
      newVal = cameraOffsetTargetZ;
    }
    
    // Remove jitter when there is no movement
    if (lastCameraQuaternion.equals(camera.quaternion) && lastCameraZ === cameraOffsetTargetZ) {
      if (lastCameraValidZ < newVal) {
        lastCameraValidZ = newVal;
      }
      if (newVal < lastCameraValidZ)
        newVal = lastCameraValidZ;
    }
    else {
      lastCameraQuaternion.copy(camera.quaternion);
      lastCameraZ = cameraOffsetTargetZ;
      lastCameraValidZ = cameraOffsetTargetZ;
    }

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
      camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
      cameraOffset.z = cameraOffsetZ;
      camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
      camera.updateMatrixWorld();
    }

  },
};
export default cameraManager;
