import * as THREE from 'three';
import {getRenderer, camera/*, orbitControls*/} from './renderer.js';
import * as notifications from './notifications.js';
import metaversefile from 'metaversefile';
import physicsManager from './physics-manager.js';

const localVector = new THREE.Vector3();

const cameraOffset = new THREE.Vector3();
let cameraOffsetTargetZ = cameraOffset.z;
let cameraOffsetZ = cameraOffset.z;
const rayVectorZero = new THREE.Vector3(0,0,0);
const rayVectorUp = new THREE.Vector3(0,1,0);
const rayStartPos = new THREE.Vector3(0,0,0);
const rayDirection = new THREE.Vector3(0,0,0);
const rayMatrix = new THREE.Matrix4();
const rayQuaternion = new THREE.Quaternion();

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
      // physicsManager.unlockControls();
      break;
    } catch (err) {
      console.warn(err);
      continue;
    }
  }
};

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
const focusCamera = position => {
  camera.lookAt(position);
  camera.updateMatrixWorld();
};

const cameraManager = {
  /* birdsEyeHeight,
  thirdPersonCameraOffset,
  isometricCameraOffset, */
  wasActivated() {
    return wasActivated;
  },
  focusCamera,
  requestPointerLock,
  /* getTool() {
    return selectedTool;
  }, */
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

    // Check for collision with level physic objects

    let newVal = cameraOffsetTargetZ;
    let hasIntersection = false;

    const localPlayer = metaversefile.useLocalPlayer();

    let cornerPoints = [];
    // Top left
    cornerPoints[0] = new THREE.Vector3( -1, 1, ( camera.near + camera.far ) / ( camera.near - camera.far ) );
    cornerPoints[0].unproject( camera );

    // Bottom left
    cornerPoints[1] = new THREE.Vector3( -1, -1, ( camera.near + camera.far ) / ( camera.near - camera.far ) );
    cornerPoints[1].unproject( camera );

    // Top right
    cornerPoints[2] = new THREE.Vector3( 1, 1, ( camera.near + camera.far ) / ( camera.near - camera.far ) );
    cornerPoints[2].unproject( camera );

    // Bottom right
    cornerPoints[3] = new THREE.Vector3( 1, -1, ( camera.near + camera.far ) / ( camera.near - camera.far ) );
    cornerPoints[3].unproject( camera );


    // Raycast from all camera corners
    for(let i=0;i<4;i++) {

      rayDirection.subVectors(localPlayer.position, cornerPoints[i] ).normalize();

      rayMatrix.lookAt(rayDirection,rayVectorZero,rayVectorUp);
      rayQuaternion.setFromRotationMatrix(rayMatrix);

      // Slightly move ray start position towards camera (to avoid hair,hat)
      rayStartPos.copy(localPlayer.position);
      rayStartPos.add( rayDirection.multiplyScalar(0.1) );

      let collision = physicsManager.raycast(rayStartPos, rayQuaternion);
      if (collision) {
        if (collision.distance <= -1 * newVal) {
          if (newVal < (-1 * (collision.distance-0.15))) {
            newVal = (-1 * (collision.distance-0.15));
            hasIntersection = true;
          }
        }
      }
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
  // switchCamera,
  // selectTool,
};
export default cameraManager;
