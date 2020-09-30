import {renderer, camera} from './app-object.js';
import weaponsManager from './weapons-manager.js';

const ioManager = new EventTarget();

ioManager.lastAxes = [[0, 0, 0, 0], [0, 0, 0, 0]];
ioManager.lastButtons = [[0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]];
ioManager.currentWeaponValue = 0;
ioManager.lastWeaponValue = 0;
ioManager.currentTeleport = false;
ioManager.lastTeleport = false;
ioManager.currentMenuDown = false;
ioManager.lastMenuDown = false;
ioManager.menuExpanded = false;
ioManager.lastMenuExpanded = false;
ioManager.currentWeaponGrabs = [false, false];
ioManager.lastWeaponGrabs = [false, false];
ioManager.keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  shift: false,
};
const _resetKeys = () => {
  for (const k in ioManager.keys) {
    ioManager.keys[k] = false;
  }
};

const _inputFocused = () => document.activeElement && document.activeElement.tagName === 'INPUT';

const _updateIo = () => {
  const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
  if (renderer.xr.getSession()) {
    let walked = false;
    const inputSources = Array.from(currentSession.inputSources);
    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];
      const {handedness, gamepad} = inputSource;
      if (gamepad && gamepad.buttons.length >= 2) {
        const index = handedness === 'right' ? 1 : 0;

        // buttons
        /* const grab = buttons[1].pressed;
        const lastGrab = lastGrabs[index];
        if (!lastGrab && grab) { // grip
          // pe.grabdown(handedness);
        } else if (lastGrab && !grab) {
          // pe.grabup(handedness);
        }
        lastGrabs[index] = grab; */

        // axes
        const {axes: axesSrc, buttons: buttonsSrc} = gamepad;
        const axes = [
          axesSrc[0] || 0,
          axesSrc[1] || 0,
          axesSrc[2] || 0,
          axesSrc[3] || 0,
        ];
        const buttons = [
          buttonsSrc[0] ? buttonsSrc[0].value : 0,
          buttonsSrc[1] ? buttonsSrc[1].value : 0,
          buttonsSrc[2] ? buttonsSrc[2].value : 0,
          buttonsSrc[3] ? buttonsSrc[3].value : 0,
          buttonsSrc[4] ? buttonsSrc[4].value : 0,
          buttonsSrc[5] ? buttonsSrc[4].value : 0,
        ];
        if (handedness === 'left') {
          const dx = axes[0] + axes[2];
          const dy = axes[1] + axes[3];
          if (Math.abs(dx) >= 0.01 || Math.abs(dx) >= 0.01) {
            localEuler.setFromQuaternion(xrCamera.quaternion, 'YXZ');
            localEuler.x = 0;
            localEuler.z = 0;
            localVector3.set(dx, 0, dy)
              .applyEuler(localEuler)
              .multiplyScalar(0.05);

            dolly.matrix
              // .premultiply(localMatrix2.makeTranslation(-xrCamera.position.x, -xrCamera.position.y, -xrCamera.position.z))
              .premultiply(localMatrix3.makeTranslation(localVector3.x, localVector3.y, localVector3.z))
              // .premultiply(localMatrix2.getInverse(localMatrix2))
              .decompose(dolly.position, dolly.quaternion, dolly.scale);
            walked = true;
          }
          
          currentWeaponGrabs[1] = buttons[1] > 0.5;
        } else if (handedness === 'right') {
          const _applyRotation = r => {
            dolly.matrix
              .premultiply(localMatrix2.makeTranslation(-xrCamera.position.x, -xrCamera.position.y, -xrCamera.position.z))
              .premultiply(localMatrix3.makeRotationFromQuaternion(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), r)))
              .premultiply(localMatrix2.getInverse(localMatrix2))
              .decompose(dolly.position, dolly.quaternion, dolly.scale);
          };
          if (
            (axes[0] < -0.75 && !(lastAxes[index][0] < -0.75)) ||
            (axes[2] < -0.75 && !(lastAxes[index][2] < -0.75))
          ) {
            _applyRotation(Math.PI * 0.2);
          } else if (
            (axes[0] > 0.75 && !(lastAxes[index][0] > 0.75)) ||
            (axes[2] > 0.75 && !(lastAxes[index][2] > 0.75))
          ) {
            _applyRotation(-Math.PI * 0.2);
          }
          currentTeleport = (axes[1] < -0.75 || axes[3] < -0.75);
          currentMenuDown = (axes[1] > 0.75 || axes[3] > 0.75);

          ioManager.currentWeaponDown = buttonsSrc[0].pressed;
          ioManager.currentWeaponValue = buttons[0];
          ioManager.currentWeaponGrabs[0] = buttonsSrc[1].pressed;

          if (
            buttons[2] >= 0.5 && lastButtons[index][2] < 0.5 &&
            !(Math.abs(axes[0]) > 0.5 || Math.abs(axes[1]) > 0.5 || Math.abs(axes[2]) > 0.5 || Math.abs(axes[3]) > 0.5) &&
            !jumpState
          ) {
            physicsManager.jump();
          }
        }

        ioManager.lastAxes[index][0] = axes[0];
        ioManager.lastAxes[index][1] = axes[1];
        ioManager.lastAxes[index][2] = axes[2];
        ioManager.lastAxes[index][3] = axes[3];
        
        ioManager.lastButtons[index][0] = buttons[0];
        ioManager.lastButtons[index][1] = buttons[1];
        ioManager.lastButtons[index][2] = buttons[2];
        ioManager.lastButtons[index][3] = buttons[3];
        ioManager.lastButtons[index][4] = buttons[4];
      }
    }
    
    if (currentMenuDown) {
      const rightInputSource = inputSources.find(inputSource => inputSource.handedness === 'right');
      const pose = rightInputSource && frame.getPose(rightInputSource.targetRaySpace, renderer.xr.getReferenceSpace());
      if (pose) {
        localMatrix2.fromArray(pose.transform.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector, localQuaternion, localVector2);
        if (!lastSelector) {
          toolsMesh.position.copy(localVector);
          localEuler.setFromQuaternion(localQuaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          toolsMesh.quaternion.setFromEuler(localEuler);
        }
        toolsMesh.update(localVector);
        toolsMesh.visible = true;
      } else {
        toolsMesh.visible = false;
      }
    } else {
      toolsMesh.visible = false;
    }
    
    _applyGravity(timeDiff);

    if (walked || jumpState) {
      localObject.matrix.copy(xrCamera.matrix)
        .premultiply(dolly.matrix)
        .decompose(localObject.position, localObject.quaternion, localObject.scale);
      const originalPosition = localObject.position.clone();

      _applyAvatarPhysics(localObject, null, false, false, false, timeDiff);

      dolly.position.add(
        localObject.position.clone().sub(originalPosition)
      );
    } else {
      velocity.y = 0;
      localMatrix.copy(xrCamera.matrix)
        .premultiply(dolly.matrix);
      _collideItems(localMatrix);
      _collideChunk(localMatrix);
      rigManager.setLocalRigMatrix(null);
    }
  } else if (document.pointerLockElement) {
    const speed = 100 * (keys.shift ? 3 : 1);
    const cameraEuler = camera.rotation.clone();
    cameraEuler.x = 0;
    cameraEuler.z = 0;
    localVector.set(0, 0, 0);
    if (keys.left) {
      localVector.add(new THREE.Vector3(-1, 0, 0).applyEuler(cameraEuler));
    }
    if (keys.right) {
      localVector.add(new THREE.Vector3(1, 0, 0).applyEuler(cameraEuler));
    }
    if (keys.up) {
      localVector.add(new THREE.Vector3(0, 0, -1).applyEuler(cameraEuler));
    }
    if (keys.down) {
      localVector.add(new THREE.Vector3(0, 0, 1).applyEuler(cameraEuler));
    }
    if (localVector.length() > 0) {
      localVector.normalize().multiplyScalar(speed);
    }
    localVector.multiplyScalar(timeDiff);
    velocity.add(localVector);
  }
  
  ioManager.lastTeleport = ioManager.currentTeleport;
  ioManager.lastMenuDown = ioManager.currentMenuDown;
  ioManager.lastWeaponDown = ioManager.currentWeaponDown;
  ioManager.lastWeaponValue = ioManager.currentWeaponValue;
  ioManager.lastMenuExpanded = ioManager.menuExpanded;
  for (let i = 0; i < 2; i++) {
    ioManager.lastWeaponGrabs[i] = ioManager.currentWeaponGrabs[i];
  }
};
ioManager.update = _updateIo;

window.addEventListener('keydown', e => {
  switch (e.which) {
    case 49: { // 1
      const selectedWeapon = weaponsManager.getWeapon();
      let index = weapons.findIndex(weapon => weapon.getAttribute('weapon') === selectedWeapon);
      index--;
      if (index < 0) {
        index = weapons.length - 1;
      }
      weapons[index].click();
      break;
    }
    case 50: { // 2
      const selectedWeapon = weaponsManager.getWeapon();
      let index = weapons.findIndex(weapon => weapon.getAttribute('weapon') === selectedWeapon);
      index++;
      if (index >= weapons.length) {
        index = 0;
      }
      weapons[index].click();
      break;
    }
    case 87: { // W
      if (!document.pointerLockElement) {
        // nothing
      } else {
        keys.up = true;
      }
      break;
    }
    case 65: { // A
      if (!document.pointerLockElement) {
        // uiMesh && uiMesh.rotate(-1);
      } else {
        keys.left = true;
      }
      break;
    }
    case 83: { // S
      if (!document.pointerLockElement) {
        // nothing
      } else {
        keys.down = true;
      }
      break;
    }
    case 68: { // D
      if (!document.pointerLockElement) {
        // uiMesh && uiMesh.rotate(1);
      } else {
        keys.right = true;
      }
      break;
    }
    case 9: { // tab
      e.preventDefault();
      e.stopPropagation();
      menuExpanded = !menuExpanded;
      break;
    }
    case 69: { // E
      if (document.pointerLockElement) {
        // nothing
      /* } else {
        if (selectTarget && selectTarget.control) {
          selectTarget.control.setMode('rotate');
        } */
      }
      break;
    }
    case 82: { // R
      if (document.pointerLockElement) {
        // pe.equip('back');
      /* } else {
        if (selectTarget && selectTarget.control) {
          selectTarget.control.setMode('scale');
        } */
      }
      break;
    }
    case 70: { // F
      // pe.grabdown('right');
      if (document.pointerLockElement) {
        currentWeaponGrabs[0] = true;
      }
      break;
    }
    case 86: { // V
      if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        tools.find(tool => tool.getAttribute('tool') === 'firstperson').click();
      }
      break;
    }
    case 66: { // B
      if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        tools.find(tool => tool.getAttribute('tool') === 'thirdperson').click();
      }
      break;
    }
    case 78: { // N
      if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        tools.find(tool => tool.getAttribute('tool') === 'isometric').click();
      }
      break;
    }
    case 77: { // M
      if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        tools.find(tool => tool.getAttribute('tool') === 'birdseye').click();
      }
      break;
    }
    case 16: { // shift
      if (document.pointerLockElement) {
        keys.shift = true;
      }
      break;
    }
    case 32: { // space
      if (document.pointerLockElement) {
        if (!jumpState) {
          physicsManager.jump();
        }
      }
      break;
    }
    case 81: { // Q
      const selectedWeapon = weaponsManager.getWeapon();
      if (selectedWeapon !== 'pickaxe') {
        document.querySelector('.weapon[weapon="pickaxe"]').click();
      } else {
        document.querySelector('.weapon[weapon="shovel"]').click();
      }
      break;
    }
    case 90: { // Z
      document.querySelector('.weapon[weapon="build"]').click();
      buildMode = 'wall';
      break;
    }
    case 88: { // X
      document.querySelector('.weapon[weapon="build"]').click();
      buildMode = 'floor';
      break;
    }
    case 67: { // C
      if (!keys.ctrl && document.pointerLockElement) {
        document.querySelector('.weapon[weapon="build"]').click();
        buildMode = 'stair';
      }
      break;
    }
    /* case 80: { // P
      physics.resetObjectMesh(physicalMesh);
      break;
    } */
    case 8: // backspace
    case 46: // del
    {
      /* if (selectedObjectMeshes.length > 0) {
          const oldSelectedObjectMeshes = selectedObjectMeshes;

          _setHoveredObjectMesh(null);
          _setSelectedObjectMesh(null, false);

          const action = createAction('removeObjects', {
            oldObjectMeshes: oldSelectedObjectMeshes,
            container,
            objectMeshes,
          });
          execute(action);
        } */
      break;
    }
  }
});
window.addEventListener('keyup', e => {
  switch (e.which) {
    case 87: { // W
      if (document.pointerLockElement) {
        keys.up = false;
      }
      break;
    }
    case 65: { // A
      if (document.pointerLockElement) {
        keys.left = false;
      }
      break;
    }
    case 83: { // S
      if (document.pointerLockElement) {
        keys.down = false;
      }
      break;
    }
    case 68: { // D
      if (document.pointerLockElement) {
        keys.right = false;
      }
      break;
    }
    case 70: { // F
      // pe.grabup('right');
      if (document.pointerLockElement) {
        currentWeaponGrabs[0] = false;
      }
      break;
    }
    case 16: { // shift
      if (document.pointerLockElement) {
        keys.shift = false;
      }
      break;
    }
  }
});
window.addEventListener('mousedown', e => {
  const selectedWeapon = weaponsManager.getWeapon();
  if (document.pointerLockElement || ['physics', 'pencil'].includes(selectedWeapon)) {
    if (e.button === 0) {
      // pe.grabtriggerdown('right');
      // pe.grabuse('right');
      currentWeaponDown = true;
      currentWeaponValue = 1;
    } else if (e.button === 2) {
      currentTeleport = true;
    }
  }
});
window.addEventListener('mouseup', e => {
  ioManager.currentWeaponDown = false;
  ioManager.currentWeaponValue = 0;
  ioManager.currentTeleport = false;
});

export default ioManager;