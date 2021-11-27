/*
io manager reads inputs from the browser.
some inputs are implicit, like resize.
the functionality is implemented in other managers.
*/

import * as THREE from 'three';
import cameraManager from './camera-manager.js';
// import controlsManager from './controls-manager.js';
import game from './game.js';
// import physicsManager from './physics-manager.js';
import {world} from './world.js';
// import * as universe from './universe.js';
// import {toggle as inventoryToggle} from './inventory.js';
import {isInIframe, getVelocityDampingFactor} from './util.js';
import {getRenderer, /*renderer2,*/ scene, camera, dolly, getContainerElement} from './renderer.js';
/* import {menuActions} from './mithril-ui/store/actions.js';
import {menuState} from './mithril-ui/store/state.js'; */
import physx from './physx.js';
// import {airFriction, flyFriction} from './constants.js';
import transformControls from './transform-controls.js';
import {FaceTracker} from './face-tracking.js';
import metaversefile from 'metaversefile';

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

let faceTracker = null;

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
ioManager.debugMode = false;
ioManager.keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  forward: false,
  backward: false,
  shift: false,
  doubleShift: false,
  space: false,
  ctrl: false,
};
let lastShiftDownTime = 0;
ioManager.getLastShiftDownTime = () => lastShiftDownTime;
const resetKeys = () => {
  for (const k in ioManager.keys) {
    ioManager.keys[k] = false;
  }
};

document.addEventListener('pointerlockchange', () => {
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

const lastNonzeroDirectionVector = new THREE.Vector3(0, 0, -1);
ioManager.lastNonzeroDirectionVector = lastNonzeroDirectionVector;
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
        keysDirection.copy(lastNonzeroDirectionVector);
      }
    } else {
      lastNonzeroDirectionVector.copy(keysDirection);
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
    if (keysDirection.length() > 0) {
      localPlayer.characterPhysics.applyWasd(
        keysDirection.normalize()
          .multiplyScalar(game.getSpeed() * timeDiff),
          timeDiff
      );
    }
  }

  faceTracker && faceTracker.update(timeDiff);
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
const _setTransformMode = transformMode => {
  if (transformControls.getTransformMode() !== transformMode) {
    transformControls.setTransformMode(transformMode);
  } else {
    transformControls.setTransformMode('disabled');
  }
};
ioManager.keydown = e => {
  if (_inputFocused() || e.repeat) {
    return;
  }
  switch (e.which) {
    /* case 9: { // tab
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('key-tab').click();
      break;
    } */
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
      if (!document.pointerLockElement) {
        game.menuVertical(-1);
      }
      break;
    }
    case 65: { // A
      ioManager.keys.left = true;
      if (!document.pointerLockElement) {
        game.menuHorizontal(-1);
      }
      break;
    }
    case 83: { // S
      ioManager.keys.down = true;
      if (!document.pointerLockElement) {
        if (game.menuOpen) {
          game.menuVertical(1);
        } else {
          // if (!game.dragging) {
            // _setTransformMode('scale');
          // }
        }
      }
      break;
    }
    case 68: { // D
      ioManager.keys.right = true;
      if (!document.pointerLockElement) {
        game.menuHorizontal(1);
      }
      break;
    }
    case 82: { // R
      if (document.pointerLockElement) {
        if (game.canRotate()) {
          game.menuRotate(1);
        }
      } else {
        // if (!game.dragging) {
          // _setTransformMode('rotate');
        // }
      }
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
    case 71: { // G
      if (document.pointerLockElement) {
        /* if (game.canTry()) {
          game.menuTry();
        } */
      } else {
        // if (!game.dragging) {
          // _setTransformMode('translate');
        // }
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
      game.menuDrop();
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
    /* case 84: { // T
      // if (!_inputFocused()) {
        e.preventDefault();
        e.stopPropagation();
        
        world.toggleMic();
      // }
      break;
    } */
    case 85: { // U
      // if (game.canUpload()) {
        e.preventDefault();
        e.stopPropagation();
        game.menuUpload();
      // }
      break;
    }
    case 80: { // P
      game.destroyWorld()
      game.menuPhysics();
      break;
    }
    case 16: { // shift
      ioManager.keys.shift = true;
      
      const now = Date.now();
      const timeDiff = now - lastShiftDownTime;
      if (timeDiff < 200) {
        ioManager.keys.doubleShift = true;
        game.menuDoubleShift();
      }
      lastShiftDownTime = now;
      break;
    }
    case 32: { // space
      ioManager.keys.space = true;
      // if (controlsManager.isPossessed()) {
        if (!game.isJumping()) {
          game.jump();
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
      // game.setWeaponWheel(true);
      if (game.canToggleAxis()) {
        game.toggleAxis();
      }
      break;
    }
    case 69: { // E
      // if (document.pointerLockElement) {
        if (game.canRotate()) {
          game.menuRotate(-1);
        } else {
          game.menuActivateDown();
        }
      // }
      break;
    }
    case 192: { // tilde
      game.toggleEditMode();
      break;
    }
    case 13: { // enter
      game.enter();
      break;
    }
    /* case 77: { // M
      menuActions.setIsOpen(!menuState.isOpen);
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
      game.toggleDebug(ioManager.debugMode);
      ioManager.debugMode = !ioManager.debugMode;
      break;
    }
  }
};
ioManager.keyup = e => {
  if (_inputFocused() || e.repeat) {
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
      if (document.pointerLockElement) {
        game.menuActivateUp();
      }
      break;
    }
    case 70: { // F
      // if (document.pointerLockElement) {
        ioManager.keys.forward = false;
      // }
      break;
    }
    case 67: { // C
      // if (document.pointerLockElement) {
        ioManager.keys.backward = false;
        ioManager.keys.ctrl = false;
      // }
      break;
    }
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
      ioManager.keys.doubleShift = false;
      
      game.menuUnDoubleShift();
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
// let lastMouseDistance = 0;
const _updateMouseMovement = e => {
  const {movementX, movementY} = e;

  // const mouseDistance = Math.sqrt(movementX*movementX, movementY*movementY);
  // if ((mouseDistance - lastMouseDistance) < 100) { // hack around a Chrome bug
    camera.position.add(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));
  
    camera.rotation.y -= movementX * Math.PI * 2 * 0.0005;
    camera.rotation.x -= movementY * Math.PI * 2 * 0.0005;
    camera.rotation.x = Math.min(Math.max(camera.rotation.x, -Math.PI / 2), Math.PI / 2);
    camera.quaternion.setFromEuler(camera.rotation);

    camera.position.sub(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));

    camera.updateMatrixWorld();
  // }
  // lastMouseDistance = mouseDistance;
};
const _getMouseRaycaster = (e, raycaster) => {
  const {clientX, clientY} = e;
  const renderer = getRenderer();
  renderer.getSize(localVector2D2);
  localVector2D.set(
    (clientX / localVector2D2.x) * 2 - 1,
    -(clientY / localVector2D2.y) * 2 + 1
  );
  if (
    localVector2D.x >= -1 && localVector2D.x <= 1 &&
    localVector2D.y >= -1 && localVector2D.y <= 1
  ) {
    raycaster.setFromCamera(localVector2D, camera);
    return raycaster;
  } else {
    return null;
  }
};
const _updateMouseHover = e => {
  let mouseHoverObject = null;
  let mouseSelectedObject = null;
  let mouseHoverPhysicsId = 0;
  let htmlHover = false;
  
  const raycaster = _getMouseRaycaster(e, localRaycaster);
  let point = null;
  if (raycaster) {
    transformControls.handleMouseMove(raycaster);
    
    const position = raycaster.ray.origin;
    const quaternion = localQuaternion.setFromUnitVectors(
      localVector.set(0, 0, -1),
      raycaster.ray.direction
    );
    
    const result = physx.physxWorker.raycastPhysics(physx.physics, position, quaternion);
    
    if (result) {
      const object = world.appManager.getAppByPhysicsId(result.objectId);
      if (object) {
        point = localVector.fromArray(result.point);
        
        if (object.isHtml) {
          htmlHover = true;
        } else {
          if (game.hoverEnabled) {
            mouseHoverObject = object;
            mouseHoverPhysicsId = result.objectId;
          }
        }
      }
    }
  }
  game.setMouseHoverObject(mouseHoverObject, mouseHoverPhysicsId, point);
  const renderer = getRenderer();
  if (htmlHover) {
    renderer.domElement.classList.add('hover');
  } else {
    renderer.domElement.classList.remove('hover');
  }
};
ioManager.mousemove = e => {
  /* if (game.weaponWheel) {
    game.updateWeaponWheel(e);
  } else { */
    if (document.pointerLockElement) {
      _updateMouseMovement(e);
    } else {
      if (game.dragging) {
        game.menuDrag(e);
        game.menuDragRight(e);
      } else {
        _updateMouseHover(e);
      }
    }
    game.setLastMouseEvent(e);
  // }
};
ioManager.mouseleave = e => {
  const renderer = getRenderer();
  renderer.domElement.classList.remove('hover');
};
ioManager.click = e => {
  if (document.pointerLockElement) {
    game.menuClick();
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
  game.setLastMouseEvent(e);
};
// let mouseDown = false;
let lastMouseButtons = 0;
ioManager.mousedown = e => {
  const changedButtons = lastMouseButtons ^ e.buttons;
  if (document.pointerLockElement) {
    if ((changedButtons & 1) && (e.buttons & 1)) { // left
      game.menuMouseDown();
    }
    if ((changedButtons & 2) && (e.buttons & 2)) { // right
      // if (!ioManager.keys.doubleShift) {
        game.menuAim();
      // }
    }
  } else {
    if ((changedButtons & 1) && (e.buttons & 1)) { // left
      const raycaster = _getMouseRaycaster(e, localRaycaster);
      transformControls.handleMouseDown(raycaster);
    }
    if ((changedButtons & 1) && (e.buttons & 2)) { // right
      game.menuDragdownRight();
      game.setContextMenu(false);
    }
  }
  if ((changedButtons & 4) && (e.buttons & 4)) { // middle
    e.preventDefault();
    game.menuDragdown();
  }
  lastMouseButtons = e.buttons;
  // mouseDown = true;
  game.setLastMouseEvent(e);
};
ioManager.mouseup = e => {
  const changedButtons = lastMouseButtons ^ e.buttons;
  // if (mouseDown) {
    if (document.pointerLockElement) {
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
      game.menuDragup();
    }
    // mouseDown = false;
  // }
  lastMouseButtons = e.buttons;
  game.setLastMouseEvent(e);
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
  window.addEventListener('wheel', e => {
    // console.log('target', e.target);
    const renderer = getRenderer();
    if (renderer && (e.target === renderer.domElement || e.target.id === 'app')) {
      cameraManager.handleWheelEvent(e);
    }
  }, {
    passive: false,
  });
  ioManager.getFaceTracking = () => !!faceTracker;
  ioManager.setFaceTracking = enable => {
    if (enable && !faceTracker) {
      faceTracker = new FaceTracker();
      faceTracker.setAvatar('./avatars/scillia.vrm');
      document.body.appendChild(faceTracker.domElement);
    } else if (!enable && !!faceTracker) {
      faceTracker.destroy();
      document.body.removeChild(faceTracker.domElement);
      faceTracker = null;
    }
  };
};

export default ioManager;
