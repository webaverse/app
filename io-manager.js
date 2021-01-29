import * as THREE from './three.module.js';
import cameraManager from './camera-manager.js';
import weaponsManager from './weapons-manager.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as universe from './universe.js';
import {isInIframe} from './util.js';
import {renderer, renderer2, camera, avatarCamera, dolly} from './app-object.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();

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
ioManager.currentWalked = false;
ioManager.keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  forward: false,
  backward: false,
  shift: false,
  space: false,
  ctrl: false,
};
const resetKeys = () => {
  for (const k in ioManager.keys) {
    ioManager.keys[k] = false;
  }
};

document.addEventListener('pointerlockchange', () => {
  resetKeys();
});

const _inputFocused = () => document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.getAttribute('contenteditable') !== null);

const _updateIo = timeDiff => {
  const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
  if (renderer.xr.getSession()) {
    ioManager.currentWalked = false;
    const inputSources = Array.from(renderer.xr.getSession().inputSources);
    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];
      const {handedness, gamepad} = inputSource;
      if (gamepad && gamepad.buttons.length >= 2) {
        const index = handedness === 'right' ? 1 : 0;

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
          if (Math.abs(dx) >= 0.01 || Math.abs(dy) >= 0.01) {
            localEuler.setFromQuaternion(xrCamera.quaternion, 'YXZ');
            localEuler.x = 0;
            localEuler.z = 0;
            localVector3.set(dx, 0, dy)
              .applyEuler(localEuler)
              .multiplyScalar(0.05);

            dolly.matrix
              // .premultiply(localMatrix2.makeTranslation(-xrCamera.position.x, -xrCamera.position.y, -xrCamera.position.z))
              .premultiply(localMatrix3.makeTranslation(localVector3.x, localVector3.y, localVector3.z))
              // .premultiply(localMatrix2.copy(localMatrix2).invert())
              .decompose(dolly.position, dolly.quaternion, dolly.scale);
            ioManager.currentWalked = true;
          }
          
          ioManager.currentWeaponGrabs[1] = buttons[1] > 0.5;
        } else if (handedness === 'right') {
          const _applyRotation = r => {
            dolly.matrix
              .premultiply(localMatrix2.makeTranslation(-xrCamera.position.x, -xrCamera.position.y, -xrCamera.position.z))
              .premultiply(localMatrix3.makeRotationFromQuaternion(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), r)))
              .premultiply(localMatrix2.copy(localMatrix2).invert())
              .decompose(dolly.position, dolly.quaternion, dolly.scale);
          };
          if (
            (axes[0] < -0.75 && !(ioManager.lastAxes[index][0] < -0.75)) ||
            (axes[2] < -0.75 && !(ioManager.lastAxes[index][2] < -0.75))
          ) {
            _applyRotation(Math.PI * 0.2);
          } else if (
            (axes[0] > 0.75 && !(ioManager.lastAxes[index][0] > 0.75)) ||
            (axes[2] > 0.75 && !(ioManager.lastAxes[index][2] > 0.75))
          ) {
            _applyRotation(-Math.PI * 0.2);
          }
          ioManager.currentTeleport = (axes[1] < -0.75 || axes[3] < -0.75);
          ioManager.currentMenuDown = (axes[1] > 0.75 || axes[3] > 0.75);

          ioManager.currentWeaponDown = buttonsSrc[0].pressed;
          ioManager.currentWeaponValue = buttons[0];
          ioManager.currentWeaponGrabs[0] = buttonsSrc[1].pressed;

          if (
            buttons[3] >= 0.5 && ioManager.lastButtons[index][3] < 0.5 &&
            !(Math.abs(axes[0]) > 0.5 || Math.abs(axes[1]) > 0.5 || Math.abs(axes[2]) > 0.5 || Math.abs(axes[3]) > 0.5) &&
            !physicsManager.getJumpState() &&
            !physicsManager.getSitState()
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
  } else if (document.pointerLockElement) {
    const speed = 0.1 * (ioManager.keys.shift ? 3 : 1);
    localVector.set(0, 0, 0);
    const direction = new THREE.Vector3(0, 0, 0);
    if (ioManager.keys.left) {
      direction.x -= 1;
    }
    if (ioManager.keys.right) {
      direction.x += 1;
    }
    if (ioManager.keys.up) {
      direction.z -= 1;
    }
    if (ioManager.keys.down) {
      direction.z += 1;
    }
    const flyState = physicsManager.getFlyState();
    if (flyState) {
      direction.applyQuaternion(camera.quaternion);
      
      if (ioManager.keys.space) {
        direction.y += 1;
      }
      if (ioManager.keys.ctrl) {
        direction.y -= 1;
      }
    } else {  
      const cameraEuler = camera.rotation.clone();
      cameraEuler.x = 0;
      cameraEuler.z = 0;
      direction.applyEuler(cameraEuler);
    }
    localVector.add(direction);
    if (localVector.length() > 0) {
      localVector.normalize().multiplyScalar(speed * timeDiff);

      physicsManager.velocity.add(localVector);

      if (physicsManager.getJumpState()) {
        physicsManager.velocity.x *= 0.7;
        physicsManager.velocity.z *= 0.7;
        if (flyState) {
          physicsManager.velocity.y *= 0.7;
        }
      }
    }
  }
};
ioManager.update = _updateIo;

const _updateIoPost = () => {
  ioManager.lastTeleport = ioManager.currentTeleport;
  ioManager.lastMenuDown = ioManager.currentMenuDown;
  ioManager.lastWeaponDown = ioManager.currentWeaponDown;
  ioManager.lastWeaponValue = ioManager.currentWeaponValue;
  ioManager.lastMenuExpanded = ioManager.menuExpanded;
  for (let i = 0; i < 2; i++) {
    ioManager.lastWeaponGrabs[i] = ioManager.currentWeaponGrabs[i];
  }
};
ioManager.updatePost = _updateIoPost;

ioManager.bindInterface = () => {
  const iframed = isInIframe();
  if (!iframed) {
    document.body.classList.remove('no-ui');
  }
};
ioManager.bindInput = () => {
  window.addEventListener('keydown', e => {
    if (_inputFocused() || e.repeat) {
      return;
    }
    switch (e.which) {
      case 9: { // tab
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('key-tab').click();
        break;
      }
      case 49: // 1
      case 50: // 2
      case 51: // 3
      case 52: // 4
      case 53: // 5
      case 54: // 6
      case 55: // 7
      case 56: // 8
      {
        weaponsManager.selectLoadout(e.which - 49);
        break;
      }
      case 87: { // W
        if (document.pointerLockElement) {
          ioManager.keys.up = true;
        } else {
          weaponsManager.menuVertical(-1);
        }
        break;
      }
      case 65: { // A
        if (document.pointerLockElement) {
          ioManager.keys.left = true;
        } else {
          weaponsManager.menuHorizontal(-1);
        }
        break;
      }
      case 83: { // S
        if (document.pointerLockElement) {
          ioManager.keys.down = true;
        } else {
          weaponsManager.menuVertical(1);
        }
        break;
      }
      case 68: { // D
        if (document.pointerLockElement) {
          ioManager.keys.right = true;
        } else {
          weaponsManager.menuHorizontal(1);
        }
        break;
      }
      case 82: { // R
        if (document.pointerLockElement) {
          if (weaponsManager.canTry()) {
            weaponsManager.menuTry();
          } else if (weaponsManager.canRotate()) {
            weaponsManager.menuRotate(1);
          }
          // pe.equip('back');
        /* } else {
          if (selectTarget && selectTarget.control) {
            selectTarget.control.setMode('scale');
          } */
        }
        break;
      }
      case 70: { // F
        e.preventDefault();
        e.stopPropagation();
        if (weaponsManager.canPush()) {
          ioManager.keys.forward = true;
        } else {
          physicsManager.setFlyState(!physicsManager.getFlyState());
        }
        break;
      }
      case 71: { // G
        if (document.pointerLockElement) {
          weaponsManager.menuTry();
        }
        break;
      }
      case 90: { // Z
        if (weaponsManager.canStartBuild()) {
          weaponsManager.startBuild('wall');
        } else if (weaponsManager.canBuild()) {
          weaponsManager.setBuildMode('wall');
        }
        break;
      }
      case 88: { // X
        if (weaponsManager.canStartBuild()) {
          weaponsManager.startBuild('floor');
        } else if (weaponsManager.canBuild()) {
          weaponsManager.setBuildMode('floor');
        } else {
          weaponsManager.menuDelete();
        }
        break;
      }
      case 67: { // C
        if (weaponsManager.canStartBuild()) {
          weaponsManager.startBuild('stair');
        } else if (weaponsManager.canBuild()) {
          weaponsManager.setBuildMode('stair');
        } else if (weaponsManager.canPush()) {
          ioManager.keys.backward = true;
        }
        break;
      }
      /* case 82: { // R
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('key-r').click(); // equip
        break;
      } */
      case 71: { // G
        weaponsManager.menuDrop();
        break;
      }
      case 86: { // V
        // if (!_inputFocused()) {
          e.preventDefault();
          e.stopPropagation();
          weaponsManager.menuGridSnap();
        // }
        break;
      }
      case 84: { // T
        // if (!_inputFocused()) {
          e.preventDefault();
          e.stopPropagation();
          
          world.toggleMic();
        // }
        break;
      }
      case 85: { // U
        // if (weaponsManager.canUpload()) {
          e.preventDefault();
          e.stopPropagation();
          weaponsManager.menuUpload();
        // }
        break;
      }
      case 80: { // P
        if (weaponsManager.destroyWorld()) {
          /* e.preventDefault();
          e.stopPropagation();
          document.getElementById('key-m').click(); */
        }
        break;
      }
      case 16: { // shift
        if (document.pointerLockElement) {
          ioManager.keys.shift = true;
        }
        break;
      }
      case 32: { // space
        if (document.pointerLockElement) {
          ioManager.keys.space = true;
          if (!physicsManager.getJumpState()) {
            if (weaponsManager.canJumpOff()) {
              weaponsManager.jumpOff();
            }
            physicsManager.jump();
          } else {
            physicsManager.setGlide(!physicsManager.getGlideState() && !physicsManager.getFlyState());
          }
        }
        break;
      }
      case 17: { // ctrl
        if (document.pointerLockElement) {
          ioManager.keys.ctrl = true;
        }
        break;
      }
      case 81: { // Q
        // weaponsManager.setWeaponWheel(true);
        if (weaponsManager.canToggleAxis()) {
          weaponsManager.toggleAxis();
        }
        break;
      }
      case 69: { // E
        if (weaponsManager.canUseHold()) {
          weaponsManager.menuUseHold();
        }
        if (weaponsManager.canRotate()) {
          weaponsManager.menuRotate(-1);
        }
        break;
      }
      case 192: { // tilde
        weaponsManager.toggleEditMode();
        break;
      }
      case 13: { // enter
        weaponsManager.enter();
        break;
      }
    }
  });
  window.addEventListener('keyup', e => {
    switch (e.which) {
      /* case 81: { // Q
        weaponsManager.setWeaponWheel(false);
        break;
      } */
      case 87: { // W
        if (document.pointerLockElement) {
          ioManager.keys.up = false;
        }
        break;
      }
      case 65: { // A
        if (document.pointerLockElement) {
          ioManager.keys.left = false;
        }
        break;
      }
      case 83: { // S
        if (document.pointerLockElement) {
          ioManager.keys.down = false;
        }
        break;
      }
      case 68: { // D
        if (document.pointerLockElement) {
          ioManager.keys.right = false;
        }
        break;
      }
      case 32: { // space
        if (document.pointerLockElement) {
          ioManager.keys.space = false;
        }
        break;
      }
      case 17: { // ctrl
        if (document.pointerLockElement) {
          ioManager.keys.ctrl = false;
        }
        break;
      }
      case 69: { // E
        weaponsManager.menuUseRelease();

        if (weaponsManager.canRotate()) {
          // nothing
        } else {
          weaponsManager.menuUse();
        }
        break;
      }
      case 70: { // F
        if (document.pointerLockElement) {
          ioManager.keys.forward = false;
        }
        break;
      }
      case 67: { // C
        if (document.pointerLockElement) {
          ioManager.keys.backward = false;
        }
        break;
      }
      case 16: { // shift
        if (document.pointerLockElement) {
          ioManager.keys.shift = false;
        }
        break;
      }
    }
  });
  const _updateMouseMovement = e => {
    const {movementX, movementY} = e;
    camera.position.add(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));

    camera.rotation.y -= movementX * Math.PI * 2 * 0.001;
    camera.rotation.x -= movementY * Math.PI * 2 * 0.001;
    camera.rotation.x = Math.min(Math.max(camera.rotation.x, -Math.PI / 2), Math.PI / 2);
    camera.quaternion.setFromEuler(camera.rotation);

    camera.position.sub(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));

    camera.updateMatrixWorld();
  };
  renderer.domElement.addEventListener('mousemove', e => {
    if (weaponsManager.weaponWheel) {
      weaponsManager.updateWeaponWheel(e);
    } else {
      if (document.pointerLockElement) {
        _updateMouseMovement(e);
      }
    }
  });
  window.addEventListener('mouseup', e => {
    ioManager.currentWeaponDown = false;
    ioManager.currentWeaponValue = 0;
    ioManager.currentTeleport = false;
  });
  renderer.domElement.addEventListener('click', e => {
    if (document.pointerLockElement && e.buttons === 0) {
      weaponsManager.menuClick();
    }
    if (!document.pointerLockElement && e.buttons === 0) {
      weaponsManager.setMenu(0);
      cameraManager.requestPointerLock();
    }
  });
  window.addEventListener('resize', e => {
    if (renderer.xr.getSession()) {
      renderer.xr.isPresenting = false;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer2.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    avatarCamera.aspect = window.innerWidth / window.innerHeight;
    avatarCamera.updateProjectionMatrix();
    
    if (renderer.xr.getSession()) {
      renderer.xr.isPresenting = true;
    }
  });
  window.addEventListener('paste', async e => {
    if (!_inputFocused()) {
      e.preventDefault();
      const items = Array.from(e.clipboardData.items);
      if (items.length > 0) {
        let s = await new Promise((accept, reject) => {
          items[0].getAsString(accept);
        });
        s = s.replace(/[\n\r]+/g, '').slice(0, 256);
        weaponsManager.menuPaste(s);
      }
    }
  });
};

export default ioManager;