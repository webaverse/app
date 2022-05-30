/*
io manager reads inputs from the browser.
some inputs are implicit, like resize.
the functionality is implemented in other managers.
*/

import * as THREE from 'three';
import metaversefile from 'metaversefile';
import cameraManager from './camera-manager.js';
// import controlsManager from './controls-manager.js';
import game from './game.js';
// import physicsManager from './physics-manager.js';
import {world} from './world.js';
import voiceInput from './voice-input/voice-input.js';
// import * as universe from './universe.js';
// import {toggle as inventoryToggle} from './inventory.js';
import {isInIframe, getVelocityDampingFactor} from './util.js';
import {getRenderer, /*renderer2,*/ scene, camera, dolly, getContainerElement} from './renderer.js';
import physicsManager from './physics-manager.js';
/* import {menuActions} from './mithril-ui/store/actions.js';
import {menuState} from './mithril-ui/store/state.js'; */
import physx from './physx.js';
// import {airFriction, flyFriction} from './constants.js';
import transformControls from './transform-controls.js';
import storyManager from './story.js';
// import domRenderer from './dom-renderer.jsx';
import raycastManager from './raycast-manager.js';

const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localRaycaster = new THREE.Raycaster();
const zeroVector = new THREE.Vector3();

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
ioManager.lastCtrlKey = false;

ioManager.keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  forward: false,
  backward: false,
  shift: false,
  doubleTap: false,
  space: false,
  ctrl: false,
};
const lastKeysDownTime = {
  keyW: 0,
  keyA: 0,
  keyS: 0,
  keyD: 0,
  keyE: 0,
};

const resetKeys = () => {
  for (const k in ioManager.keys) {
    ioManager.keys[k] = false;
  }
};

cameraManager.addEventListener('pointerlockchange', () => {
  resetKeys();
});

const _inputFocused = () => document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.getAttribute('contenteditable') !== null);
ioManager.inputFocused = _inputFocused;

const _updateHorizontal = direction => {
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
};
const _updateVertical = direction => {
  if (ioManager.keys.space) {
    direction.y += 1;
  }
  if (ioManager.keys.ctrl) {
    direction.y -= 1;
  }
};

const keysDirection = new THREE.Vector3();
ioManager.keysDirection = keysDirection;

const _updateIo = timeDiff => {
  const renderer = getRenderer();
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
            !game.isJumping() &&
            !game.isSitting()
          ) {
            game.jump();
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
  } else {
    keysDirection.set(0, 0, 0);
    
    const localPlayer = metaversefile.useLocalPlayer();
    
    _updateHorizontal(keysDirection);
    if (keysDirection.equals(zeroVector)) {
      if (localPlayer.hasAction('narutoRun')) {
        keysDirection.copy(cameraManager.lastNonzeroDirectionVector);
      }
    } else {
      cameraManager.lastNonzeroDirectionVector.copy(keysDirection);
    }
    
    if (localPlayer.hasAction('fly')) {
      keysDirection.applyQuaternion(camera.quaternion);
      _updateVertical(keysDirection);
    } else {
      const cameraEuler = camera.rotation.clone();
      cameraEuler.x = 0;
      cameraEuler.z = 0;
      keysDirection.applyEuler(cameraEuler);
      
      if (ioManager.keys.ctrl && !ioManager.lastCtrlKey) {
        game.toggleCrouch();
        // physicsManager.setCrouchState(!physicsManager.getCrouchState());
      }
      ioManager.lastCtrlKey = ioManager.keys.ctrl;
    }
    if (keysDirection.length() > 0 && physicsManager.getPhysicsEnabled() && movementEnabled) {
      localPlayer.characterPhysics.applyWasd(
        keysDirection.normalize()
          .multiplyScalar(game.getSpeed() * timeDiff)
      );
    }
  }
};
ioManager.update = _updateIo;

let movementEnabled = true;
// ioManager.getMovmentEnabled = () => movementEnabled;
ioManager.setMovementEnabled = newMovementEnabled => {
  movementEnabled = newMovementEnabled;
};

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
/* const _setTransformMode = transformMode => {
  if (transformControls.getTransformMode() !== transformMode) {
    transformControls.setTransformMode(transformMode);
  } else {
    transformControls.setTransformMode('disabled');
  }
}; */
const doubleTapTime = 200;
ioManager.keydown = e => {
  if (_inputFocused() || e.repeat) {
    return;
  }

  if (e.keyCode === 18) { // alt
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // HACK: these keybindings control developer avatar animation offset settings in avatars.js
  /* if (e.which === 74) {
    window.lol -= 0.01;
    console.log(window.lol);
  } else if (e.which === 75) {
    window.lol += 0.01;
    console.log(window.lol);
  } else if (e.which === 78) {
    window.lol2 += 0.01;
    console.log(window.lol2);
  } else if (e.which === 77) {
    window.lol2 += 0.01;
    console.log(window.lol2);
  } */

  switch (e.which) {
    case 9: { // tab
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
      game.selectLoadout(e.which - 49);
      break;
    }
    case 87: { // W
      ioManager.keys.up = true;
      if (!cameraManager.pointerLockElement) {
        game.menuVertical(-1);
      }

      const now = performance.now();
      const timeDiff = now - lastKeysDownTime.keyW;
      if (timeDiff < doubleTapTime && ioManager.keys.shift) {
        ioManager.keys.doubleTap = true;
        game.menuDoubleTap();
      }
      lastKeysDownTime.keyW = now;
      lastKeysDownTime.keyS = 0;
      break;
    }
    case 65: { // A
      ioManager.keys.left = true;
      if (!cameraManager.pointerLockElement) {
        game.menuHorizontal(-1);
      }

      const now = performance.now();
      const timeDiff = now - lastKeysDownTime.keyA;
      if (timeDiff < doubleTapTime && ioManager.keys.shift) {
        ioManager.keys.doubleTap = true;
        game.menuDoubleTap();
      }
      lastKeysDownTime.keyA = now;
      lastKeysDownTime.keyD = 0;
      break;
    }
    case 83: { // S
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();

        game.saveScene();
      } else {
        ioManager.keys.down = true;
        if (!cameraManager.pointerLockElement) {
          if (game.menuOpen) {
            game.menuVertical(1);
          } else {
            // if (!game.dragging) {
              // _setTransformMode('scale');
            // }
          }
        }

        const now = performance.now();
        const timeDiff = now - lastKeysDownTime.keyS;
        if (timeDiff < doubleTapTime && ioManager.keys.shift) {
          ioManager.keys.doubleTap = true;
          game.menuDoubleTap();
        }
        lastKeysDownTime.keyS = now;
        lastKeysDownTime.keyW = 0;
      }
      break;
    }
    case 68: { // D
      ioManager.keys.right = true;
      if (!cameraManager.pointerLockElement) {
        game.menuHorizontal(1);
      }

      const now = performance.now();
      const timeDiff = now - lastKeysDownTime.keyD;
      if (timeDiff < doubleTapTime && ioManager.keys.shift) {
        ioManager.keys.doubleTap = true;
        game.menuDoubleTap();
      }
      lastKeysDownTime.keyD = now;
      lastKeysDownTime.keyA = 0;
      break;
    }
    case 70: { // F
      e.preventDefault();
      e.stopPropagation();
      if (game.canPush()) {
        ioManager.keys.forward = true;
      } else {
        /* if (game.canJumpOff()) {
          game.jumpOff();
        } */
        game.toggleFly();
      }
      break;
    }
    /* case 90: { // Z
      if (!e.ctrlKey) {
        if (game.canStartBuild()) {
          game.startBuild('wall');
        } else if (game.canBuild()) {
          game.setBuildMode('wall');
        }
      }
      break;
    } */
    case 88: { // X
      if (!e.ctrlKey) {
        /* if (game.canStartBuild()) {
          game.startBuild('floor');
        } else if (game.canBuild()) {
          game.setBuildMode('floor');
        } else { */
          game.menuDelete();
        // }
      }
      break;
    }
    case 67: { // C
      // if (!e.ctrlKey) {
        /* if (game.canStartBuild()) {
          game.startBuild('stair');
        } else if (game.canBuild()) {
          game.setBuildMode('stair');
        } else */if (game.canPush()) {
          ioManager.keys.backward = true;
        } else {
          ioManager.keys.ctrl = true;
        }
      // }
      break;
    }
    /* case 73: { // I
      inventoryToggle();
      break;
    } */
    /* case 82: { // R
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('key-r').click(); // equip
      break;
    } */
    case 71: { // G
      // game.menuDrop();
      // game.menuGDown();
      game.menuSwitchCharacter();
      break;
    }
    case 86: { // V
      // if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        game.menuVDown(e);
      // }
      break;
    }
    case 66: { // B
      // if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        game.menuBDown(e);
      // }
      break;
    }
    case 69: { // E
      // if (cameraManager.pointerLockElement) {
      
      const now = performance.now();
      const timeDiff = now - lastKeysDownTime.keyE;
      if (timeDiff < doubleTapTime) {
        game.menuMiddleToggle();
      } else {
        game.menuMiddleUp();

        if (game.canRotate()) {
          game.menuRotate(-1);
        } else {
          game.menuActivateDown();
        }
      }
      lastKeysDownTime.keyE = now;

      // }
      break;
    }
    case 84: { // T
      e.preventDefault();
      e.stopPropagation();
      voiceInput.toggleMic();
      break;
    }
    case 89: { // Y
      e.preventDefault();
      e.stopPropagation();
      voiceInput.toggleSpeech();
      break;
    }
    case 80: { // P
      // game.destroyWorld()
      // game.menuPhysics();
      break;
    }
    case 82: { // R
      if (cameraManager.pointerLockElement) {
        if (game.canRotate()) {
          game.menuRotate(1);
        } else {
          game.dropSelectedApp();
        }
      } else {
        // if (!game.dragging) {
          // _setTransformMode('rotate');
        // }
      }
      break;
    }
    case 16: { // shift
      ioManager.keys.shift = true;
      break;
    }
    case 32: { // space
      ioManager.keys.space = true;
      // if (controlsManager.isPossessed()) {
        if (!game.isJumping()) {
          game.jump('jump');
        } /* else {
          physicsManager.setGlide(!physicsManager.getGlideState() && !game.isFlying());
        } */
      // }
      break;
    }
    /* case 17: { // ctrl
      ioManager.keys.ctrl = true;
      break;
    } */
    case 81: { // Q
      if (e.ctrlKey) {
        if (cameraManager.pointerLockElement) {
          cameraManager.exitPointerLock();
        } else {
          cameraManager.requestPointerLock();
        }
      } else {
        // game.setWeaponWheel(true);
        if (game.canToggleAxis()) {
          game.toggleAxis();
        } else {
          // clear conflicting aim with quick menu
          game.menuUnaim();
        }
      }
      break;
    }
    /* case 13: { // enter
      game.enter();
      break;
    } */
    /* case 77: { // M
      game.toggleMap();
      break;
    } */
    case 74: { // J
      game.inventoryHack = !game.inventoryHack;
      break;
    }
    case 27: { // esc
      game.setContextMenu(false);
      break;
    }
    case 72: { // H
      const debug = metaversefile.useDebug();
      debug.toggle();
      break;
    }
    case 192: { // tilde
      game.toggleEditMode();
      break;
    }
  }
};
ioManager.keypress = e => {
  // nothing
};
ioManager.wheel = e => {
  if (storyManager.handleWheel(e)) {
    // nothing
  } else {
    if (physicsManager.getPhysicsEnabled()) {
      const renderer = getRenderer();
      if (renderer && (e.target === renderer.domElement || e.target.id === 'app')) {
        cameraManager.handleWheelEvent(e);
      }
    }
  }
};
ioManager.keyup = e => {
  if (_inputFocused() || e.repeat) {
    return;
  }

  if (e.keyCode === 18) { // alt
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  switch (e.which) {
    /* case 81: { // Q
      game.setWeaponWheel(false);
      break;
    } */
    case 87: { // W
      ioManager.keys.up = false;
      break;
    }
    case 65: { // A
      ioManager.keys.left = false;
      break;
    }
    case 83: { // S
      ioManager.keys.down = false;
      break;
    }
    case 68: { // D
      ioManager.keys.right = false;
      break;
    }
    case 32: { // space
      ioManager.keys.space = false;
      break;
    }
    /* case 17: { // ctrl
      ioManager.keys.ctrl = false;
      break;
    } */
    case 69: { // E
      if (cameraManager.pointerLockElement) {
        game.menuActivateUp();
      }
      break;
    }
    case 70: { // F
      // if (cameraManager.pointerLockElement) {
        ioManager.keys.forward = false;
      // }
      break;
    }
    case 67: { // C
      // if (cameraManager.pointerLockElement) {
        ioManager.keys.backward = false;
        ioManager.keys.ctrl = false;
      // }
      break;
    }
    /* case 71: { // G
      // if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        game.menuGUp();
      // }
      break;
    } */
    case 86: { // V
      // if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        game.menuVUp();
      // }
      break;
    }
    case 66: { // B
      // if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        game.menuBUp();
      // }
      break;
    }
    case 16: { // shift
      ioManager.keys.shift = false;
      ioManager.keys.doubleTap = false;
      
      game.menuUnDoubleTap();
      break;
    }
    case 46: { // delete
      const object = game.getMouseSelectedObject();
      if (object) {
        game.setMouseHoverObject(null);
        game.setMouseSelectedObject(null);
        world.removeObject(object.instanceId);
      }
      break;
    }
    case 27: {
      // if (game.getMouseSelectedObject()) {
        game.setMouseSelectedObject(null);
      // }
    }
  }
};
ioManager.mousemove = e => {
  /* if (game.weaponWheel) {
    game.updateWeaponWheel(e);
  } else { */
    if (cameraManager.pointerLockElement) {
      cameraManager.handleMouseMove(e);
    } else {
      if (game.dragging) {
        game.menuDrag(e);
        game.menuDragRight(e);
      }
    }
    raycastManager.setLastMouseEvent(e);
  // }
};
ioManager.mouseleave = e => {
  const renderer = getRenderer();
  renderer.domElement.classList.remove('hover');
};
ioManager.click = e => {
  if (cameraManager.pointerLockElement) {
    game.menuClick(e);
  } else {
    // game.setContextMenu(false);
    
    if (!game.hoverEnabled) {
      cameraManager.requestPointerLock();
    }
    
    /* if (controlsManager.isPossessed()) {
      cameraManager.requestPointerLock();
    } else {
      const mouseHoverObject = game.getMouseHoverObject();
      const mouseHoverPhysicsId = game.getMouseHoverPhysicsId();
      if (mouseHoverObject) {
        const mouseSelectedObject = game.getMouseSelectedObject();
        if (mouseHoverObject !== mouseSelectedObject) {
          game.setMouseSelectedObject(mouseHoverObject, mouseHoverPhysicsId);
        } else {
          game.setMouseSelectedObject(null);
        }
      }
    } */
  }
  raycastManager.setLastMouseEvent(e);
};
// let mouseDown = false;
let lastMouseButtons = 0;
ioManager.mousedown = e => {
  const changedButtons = lastMouseButtons ^ e.buttons;
  if (cameraManager.pointerLockElement) {
    if ((changedButtons & 1) && (e.buttons & 1)) { // left
      game.menuMouseDown();
    }
    if ((changedButtons & 2) && (e.buttons & 2)) { // right
      game.menuAim();
    }
  } else {
    if ((changedButtons & 1) && (e.buttons & 1)) { // left
      const raycaster = raycastManager.getMouseRaycaster(e, localRaycaster);
      if (raycaster) {
        transformControls.handleMouseDown(raycaster);
      }
    }
    if ((changedButtons & 1) && (e.buttons & 2)) { // right
      game.menuDragdownRight();
      game.setContextMenu(false);
    }
  }
  if ((changedButtons & 4) && (e.buttons & 4)) { // middle
    e.preventDefault();
    if (!cameraManager.pointerLockElement) {
      cameraManager.requestPointerLock();
    }
    game.menuMiddleDown();
  }
  lastMouseButtons = e.buttons;
  // mouseDown = true;
  raycastManager.setLastMouseEvent(e);
};
ioManager.mouseup = e => {
  const changedButtons = lastMouseButtons ^ e.buttons;
  // if (mouseDown) {
    if (cameraManager.pointerLockElement) {
      if ((changedButtons & 1) && !(e.buttons & 1)) { // left
        game.menuMouseUp();
      }
      if ((changedButtons & 2) && !(e.buttons & 2)) { // right
        game.menuUnaim();
      }
    } else {
      if ((changedButtons & 2) && !(e.buttons & 2)) { // right
        game.menuDragupRight();
      }
    }
    if ((changedButtons & 4) && !(e.buttons & 4)) { // middle
      game.menuMiddleUp();
    }
    // mouseDown = false;
  // }
  lastMouseButtons = e.buttons;
  raycastManager.setLastMouseEvent(e);
};
ioManager.paste = e => {
  if (!window.document.activeElement) {
    const items = Array.from(e.clipboardData.items);
    if (items.length > 0) {
      e.preventDefault();
      console.log('paste items', items);
      /* let s = await new Promise((accept, reject) => {
        items[0].getAsString(accept);
      });
      s = s.replace(/[\n\r]+/g, '').slice(0, 256);
      game.menuPaste(s); */
    }
  }
};
ioManager.bindInput = () => {
  /* window.addEventListener('paste', async e => {
    if (!_inputFocused()) {
      e.preventDefault();
      const items = Array.from(e.clipboardData.items);
      if (items.length > 0) {
        let s = await new Promise((accept, reject) => {
          items[0].getAsString(accept);
        });
        s = s.replace(/[\n\r]+/g, '').slice(0, 256);
        game.menuPaste(s);
      }
    }
  }); */
  /* window.addEventListener('wheel', e => {
    // console.log('target', e.target);
    if (physicsManager.getPhysicsEnabled()) {
      const renderer = getRenderer();
      if (renderer && (e.target === renderer.domElement || e.target.id === 'app')) {
        cameraManager.handleWheelEvent(e);
      }
    }
  }, {
    passive: false,
  }); */
};

export default ioManager;
