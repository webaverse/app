import * as THREE from './three.module.js';
import {renderer, camera/*, orbitControls*/} from './app-object.js';
import ioManager from './io-manager.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';

const localVector = new THREE.Vector3();

let selectedTool = 'camera';
const getFullAvatarHeight = () => rigManager.localRig ? rigManager.localRig.height : 1;
const getAvatarHeight = getFullAvatarHeight; // () => getFullAvatarHeight() * 0.9;
/* const _getMinHeight = () => {
  if (rigManager.localRig) {
    const avatarHeight = rigManager.localRig ? getAvatarHeight() : 1;
    const floorHeight = 0;
    const minHeight = floorHeight + avatarHeight;
    return minHeight;
  } else {
    return 1;
  }
}; */
const birdsEyeHeight = 10;
const thirdPersonCameraOffset = new THREE.Vector3(0, 0, -1.5);
const isometricCameraOffset = new THREE.Vector3(0, 0, -2);
const tools = [
  'key-v',
  'key-b',
  'key-n',
  'key-m',
].map(id => document.getElementById(id));

const _requestPointerLock = () => new Promise((accept, reject) => {
  if (!document.pointerLockElement) {
    const _pointerlockchange = e => {
      accept();
      _cleanup();
    };
    document.addEventListener('pointerlockchange', _pointerlockchange);
    const _pointerlockerror = err => {
      reject(err);
      _cleanup();
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
});
for (let i = 0; i < tools.length; i++) {
  const tool = tools[i]
  tool.addEventListener('click', async e => {
    e.preventDefault();
    e.stopPropagation();

    const newSelectedTool = tool.getAttribute('function');
    if (['firstperson', 'thirdperson', 'isometric', 'birdseye'].includes(newSelectedTool)) {
      await _requestPointerLock();
    }

    selectTool(newSelectedTool);
  });
}
const selectTool = newSelectedTool => {
  const oldSelectedTool = selectedTool;
  selectedTool = newSelectedTool;

  if (selectedTool !== oldSelectedTool) {
    // hoverTarget = null;
    // _setSelectTarget(null);

    switch (oldSelectedTool) {
      case 'thirdperson': {
        camera.position.add(localVector.copy(thirdPersonCameraOffset).applyQuaternion(camera.quaternion));
        camera.updateMatrixWorld();
        // setCamera(camera);
        break;
      }
      case 'isometric': {
        camera.position.add(localVector.copy(isometricCameraOffset).applyQuaternion(camera.quaternion));
        camera.updateMatrixWorld();
        // setCamera(camera);
        break;
      }
      case 'birdseye': {
        camera.position.y += -birdsEyeHeight + getAvatarHeight();
        camera.updateMatrixWorld();
        // setCamera(camera);
        break;
      }
    }

    // let decapitate = true;
    switch (selectedTool) {
      case 'camera': {
        // document.exitPointerLock();
        // orbitControls.target.copy(camera.position).add(new THREE.Vector3(0, 0, -3).applyQuaternion(camera.quaternion));
        ioManager.resetKeys();
        physicsManager.velocity.set(0, 0, 0);
        break;
      }
      case 'thirdperson': {
        camera.position.sub(localVector.copy(thirdPersonCameraOffset).applyQuaternion(camera.quaternion));
        camera.updateMatrixWorld();

        // decapitate = false;
        break;
      }
      case 'isometric': {
        camera.rotation.x = -Math.PI / 6;
        camera.quaternion.setFromEuler(camera.rotation);
        camera.position.sub(localVector.copy(isometricCameraOffset).applyQuaternion(camera.quaternion));
        camera.updateMatrixWorld();

        // decapitate = false;
        break;
      }
      case 'birdseye': {
        camera.rotation.x = -Math.PI / 2;
        camera.quaternion.setFromEuler(camera.rotation);
        camera.position.y -= -birdsEyeHeight + getAvatarHeight();
        camera.updateMatrixWorld();

        // decapitate = false;
        break;
      }
    }
    /* if (rigManager.localRig) {
      if (decapitate) {
        rigManager.localRig.decapitate();
      } else {
        rigManager.localRig.undecapitate();
      }
    } */
  }
};

const cameraManager = {
  tools,
  birdsEyeHeight,
  thirdPersonCameraOffset,
  isometricCameraOffset,
  getFullAvatarHeight,
  getAvatarHeight,
  getTool() {
    return selectedTool;
  },
  selectTool,
};
export default cameraManager;