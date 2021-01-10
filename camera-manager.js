import * as THREE from './three.module.js';
import {renderer, camera/*, orbitControls*/} from './app-object.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import * as notifications from './notifications.js';

const localVector = new THREE.Vector3();

const getFullAvatarHeight = () => rigManager.localRig ? rigManager.localRig.height : 1;
const getAvatarHeight = getFullAvatarHeight; // () => getFullAvatarHeight() * 0.9;
const birdsEyeHeight = 10;
const cameraOffset = new THREE.Vector3();
/* const thirdPersonCameraOffset = new THREE.Vector3(0, 0, -1.5);
const isometricCameraOffset = new THREE.Vector3(0, 0, -2); */

const requestPointerLock = () => new Promise((accept, reject) => {
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
    renderer.domElement.requestPointerLock();
  } else {
    accept();
  }
}).then(() => {
  physicsManager.unlockControls();
});

/* const cameraModes = [
  'firstperson',
  'thirdperson',
  'isometric',
  'birdseye',
];
let selectedTool = cameraModes[0];
const switchCamera = e => {
  const index = cameraModes.indexOf(selectedTool);
  let nextIndex;
  if (!e.shiftKey) {
    nextIndex = (index + 1) % cameraModes.length;
  } else {
    nextIndex = index - 1;
    if (nextIndex <= 0) {
      nextIndex = cameraModes.length - 1;
    }
  }
  if (index === 0 || nextIndex === 0) {
    nextIndex = 1;
  }

  const newSelectedTool = cameraModes[nextIndex];
  selectTool(newSelectedTool);
}; */
// const cameraButton = document.getElementById('key-c');
// cameraButton.addEventListener('click', switchCamera);
/* const selectTool = newSelectedTool => {
  const oldSelectedTool = selectedTool;
  selectedTool = newSelectedTool;

  if (selectedTool !== oldSelectedTool) {
    switch (oldSelectedTool) {
      case 'thirdperson': {
        camera.position.add(localVector.copy(thirdPersonCameraOffset).applyQuaternion(camera.quaternion));
        camera.updateMatrixWorld();
        break;
      }
      case 'isometric': {
        camera.position.add(localVector.copy(isometricCameraOffset).applyQuaternion(camera.quaternion));
        camera.updateMatrixWorld();
        break;
      }
      case 'birdseye': {
        camera.position.y += -birdsEyeHeight + getAvatarHeight();
        camera.updateMatrixWorld();
        break;
      }
    }

    switch (selectedTool) {
      case 'camera': {
        physicsManager.velocity.set(0, 0, 0);
        break;
      }
      case 'firstperson': {
        camera.rotation.x = 0;
        camera.updateMatrixWorld();
        break;
      }
      case 'thirdperson': {
        camera.position.sub(localVector.copy(thirdPersonCameraOffset).applyQuaternion(camera.quaternion));
        camera.updateMatrixWorld();
        break;
      }
      case 'isometric': {
        camera.rotation.x = -Math.PI / 6;
        camera.quaternion.setFromEuler(camera.rotation);
        camera.position.sub(localVector.copy(isometricCameraOffset).applyQuaternion(camera.quaternion));
        camera.updateMatrixWorld();
        break;
      }
      case 'birdseye': {
        camera.rotation.x = -Math.PI / 2;
        camera.quaternion.setFromEuler(camera.rotation);
        camera.position.y -= -birdsEyeHeight + getAvatarHeight();
        camera.updateMatrixWorld();
        break;
      }
    }
  }
}; */
window.addEventListener('wheel', e => {
  camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
  cameraOffset.z = Math.min(cameraOffset.z - e.deltaY * 0.01, 0);
  camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
  camera.updateMatrixWorld();

  physicsManager.unlockControls();
});
const focusCamera = position => {
  camera.lookAt(position);
  camera.updateMatrixWorld();
};

const cameraManager = {
  /* birdsEyeHeight,
  thirdPersonCameraOffset,
  isometricCameraOffset, */
  getFullAvatarHeight,
  getAvatarHeight,
  focusCamera,
  requestPointerLock,
  /* getTool() {
    return selectedTool;
  }, */
  getMode() {
    const f = -cameraOffset.z;
    if (f < 0.5) {
      return 'firstperson';
    } else if (f < 2) {
      return 'thirdperson';
    } else {
      return 'isometric';
    }
  },
  getCameraOffset() {
    return cameraOffset;
  },
  // switchCamera,
  // selectTool,
};
export default cameraManager;