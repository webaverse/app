import * as THREE from 'three';
import {getRenderer, camera} from './renderer.js';
import * as notifications from './notifications.js';

const localVector = new THREE.Vector3();

const cameraOffset = new THREE.Vector3();
let cameraOffsetTargetZ = cameraOffset.z;

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
  handleWheelEvent(e) {
    e.preventDefault();
  
    camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
    
    camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
    camera.updateMatrixWorld();
    
    cameraOffsetTargetZ = Math.min(cameraOffsetTargetZ - e.deltaY * 0.01, 0);
  },
  update(timeDiff) {
    const zDiff = Math.abs(cameraOffset.z - cameraOffsetTargetZ);
    if (zDiff === 0) {
      // nothing
    } else if (zDiff > 0.000001) {
      camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
      cameraOffset.z = cameraOffset.z * 0.8 + 0.2 * cameraOffsetTargetZ;
      camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
      camera.updateMatrixWorld();
    } else {
      camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
      cameraOffset.z = cameraOffsetTargetZ;
      camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
      camera.updateMatrixWorld();
    }
  },
};
export default cameraManager;