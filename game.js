/*
this file contains the main game logic tying together the managers.
general game logic goes here.
*/

import * as THREE from 'three';
// import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import physx from './physx.js';
import cameraManager from './camera-manager.js';
// import uiManager from './ui-manager.js';
import ioManager from './io-manager.js';
// import {loginManager} from './login.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as universe from './universe.js';
import {rigManager} from './rig.js';
// import {rigAuxManager} from './rig-aux.js';
import {buildMaterial, highlightMaterial, selectMaterial, hoverMaterial} from './shaders.js';
// import {makeTextMesh} from './vr-ui.js';
// import activateManager from './activate-manager.js';
// import dropManager from './drop-manager.js';
import {teleportMeshes} from './teleport.js';
import {getPlayerCrouchFactor} from './character-controller.js';
import {getRenderer, scene, sceneLowPriority, /* orthographicScene, */ camera /*, dolly*/} from './renderer.js';
// import {inventoryAvatarScene, inventoryAvatarCamera, inventoryAvatarRenderer, update as inventoryUpdate} from './inventory.js';
// import controlsManager from './controls-manager.js';
// import buildTool from './build-tool.js';
// import * as notifications from './notifications.js';
// import * as popovers from './popovers.js';
// import messages from './messages.js';
import {/* getExt, bindUploadFileButton, */snapPosition} from './util.js';
// import Avatar from './avatars/avatars.js';
// import hpManager from './hp-manager.js';
import {/* baseUnit, */maxGrabDistance, storageHost /*, worldsHost*/} from './constants.js';
import easing from './easing.js';
// import fx from './fx.js';
// import metaversefile from 'metaversefile';
import metaversefileApi from './metaversefile-api.js';
import metaversefileConstants from 'metaversefile/constants.module.js';
import * as metaverseModules from './metaverse-modules.js';

const {useLocalPlayer} = metaversefileApi;
const {contractNames} = metaversefileConstants;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
const localBox = new THREE.Box3();
const localRay = new THREE.Ray();
const localRaycaster = new THREE.Raycaster();
const oneVector = new THREE.Vector3(1, 1, 1);

/* const equipArmQuaternions = [
  new THREE.Quaternion().setFromAxisAngle(new THREE.Quaternion(1, 0, 0), Math.PI/2)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Quaternion(0, 1, 0), Math.PI/2)),
  new THREE.Quaternion().setFromAxisAngle(new THREE.Quaternion(1, 0, 0), -Math.PI/2)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Quaternion(0, 1, 0), -Math.PI/2)),
]; */
const cubicBezier = easing(0, 1, 0, 1);
const useTotalTime = 1000;

const _getGrabbedObject = i => {
  const localPlayer = useLocalPlayer();
  const grabbedObjectInstanceId = localPlayer.grabs[i]?.instanceId;
  const result = grabbedObjectInstanceId ? metaversefileApi.getAppByInstanceId(grabbedObjectInstanceId) : null;
  return result;
};
// window.getGrabbedObject = _getGrabbedObject;

// returns whether we actually snapped
/* const updateGrabbedObject = (() => {
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localVector3 = new THREE.Vector3();
  const localVector4 = new THREE.Vector3();
  const localVector5 = new THREE.Vector3();
  const localVector6 = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  const localQuaternion2 = new THREE.Quaternion();
  const localQuaternion3 = new THREE.Quaternion();
  const localMatrix = new THREE.Matrix4();
  
  return */function updateGrabbedObject(o, grabMatrix, offsetMatrix, {collisionEnabled, handSnapEnabled, physx, gridSnap}) {
    grabMatrix.decompose(localVector, localQuaternion, localVector2);
    offsetMatrix.decompose(localVector3, localQuaternion2, localVector4);
    const offset = localVector3.length();
    localMatrix.multiplyMatrices(grabMatrix, offsetMatrix)
      .decompose(localVector5, localQuaternion3, localVector6);

    /* const grabbedObject = _getGrabbedObject(0);
    const grabbedPhysicsObjects = grabbedObject ? grabbedObject.getPhysicsObjects() : [];
    for (const physicsObject of grabbedPhysicsObjects) {
      physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
    } */

    let collision = collisionEnabled && physx.physxWorker.raycastPhysics(physx.physics, localVector, localQuaternion);
    if (collision) {
      // console.log('got collision', collision);
      const {point} = collision;
      o.position.fromArray(point)
        // .add(localVector2.set(0, 0.01, 0));

      if (o.position.distanceTo(localVector) > offset) {
        collision = null;
      }
    }
    if (!collision) {
      o.position.copy(localVector5);
    }

    /* for (const physicsObject of grabbedPhysicsObjects) {
      physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
    } */

    const handSnap = !handSnapEnabled || offset >= maxGrabDistance || !!collision;
    if (handSnap) {
      snapPosition(o, gridSnap);
      o.quaternion.setFromEuler(o.savedRotation);
    } else {
      o.quaternion.copy(localQuaternion3);
    }

    return {
      handSnap,
    };
  };
// })();

const items1El = document.getElementById('items-1');
const items2El = document.getElementById('items-2');
const items3El = document.getElementById('items-3');
const items4El = document.getElementById('items-4');
const itemsDetails1El = document.getElementById('items-details-1');
const itemsDetails2El = document.getElementById('items-details-2');
const itemsDetails3El = document.getElementById('items-details-3');
const itemsDetails4El = document.getElementById('items-details-4');
const keyTabEl = document.getElementById('key-tab');
const keyTab1El = document.getElementById('key-tab-1');
const keyTab2El = document.getElementById('key-tab-2');
const keyTab3El = document.getElementById('key-tab-3');
const keyTab4El = document.getElementById('key-tab-4');
const keyTab5El = document.getElementById('key-tab-5');
const loadoutEl = document.getElementById('loadout');
const itemsEls = Array.from(document.querySelectorAll('#loadout .item'));
const menu1El = document.getElementById('menu-1');
const menu2El = document.getElementById('menu-2');
const menu3El = document.getElementById('menu-3');
const menu4El = document.getElementById('menu-4');
const unmenuEl = document.getElementById('unmenu');
const objectMenuEl = document.getElementById('object-menu');
const grabMenuEl = document.getElementById('grab-menu');
const editMenuEl = document.getElementById('edit-menu');
const locationLabel = document.getElementById('location-label');
const profileLabel = document.getElementById('profile-label');
const itemLabel = document.getElementById('item-label');
const grabLabel = document.getElementById('grab-label');
const editLabel = document.getElementById('edit-label');
const locationIcon = document.getElementById('location-icon');
const profileIcon = document.getElementById('profile-icon');
const itemIcon = document.getElementById('item-icon');
const itemMonetizedIcon = document.getElementById('item-monetized-icon');
const grabIcon = document.getElementById('grab-icon');
const editIcon = document.getElementById('edit-icon');
const loadoutItems = Array.from(document.querySelectorAll('.loadout > .item'));
const gridSnapEl = document.getElementById('grid-snap');
const tabs = Array.from(document.querySelectorAll('#profile-icon > .nav'));
const chatEl = document.getElementById('chat');
const chatInputEl = document.getElementById('chat-input');
const chatMessagesEl = document.getElementById('chat-messages');

const _makeTargetMesh = (() => {
  const targetMeshGeometry = (() => {
    const targetGeometry = BufferGeometryUtils.mergeBufferGeometries([
      new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.1, 0)),
      new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.1)),
      new THREE.BoxBufferGeometry(0.03, 0.2, 0.03)
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.1, 0, 0)),
    ]);
    return BufferGeometryUtils.mergeBufferGeometries([
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, 0.5, -0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, -0.5, -0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, 0.5, 0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, 0.5, -0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, -1, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(-0.5, -0.5, 0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0))))
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, -0.5, -0.5)),
      targetGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 1, 0).normalize(), new THREE.Vector3(1, 1, 0).normalize())))
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0).normalize(), new THREE.Vector3(0, 0, -1).normalize())))
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 0, 0).normalize(), new THREE.Vector3(0, 1, 0).normalize())))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0.5, -0.5, 0.5)),
    ])// .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
  })();
  const targetVsh = `
    #define M_PI 3.1415926535897932384626433832795
    uniform float uTime;
    // varying vec2 vUv;
    void main() {
      float f = 1.0 + sign(uTime) * pow(sin(abs(uTime) * M_PI), 0.5) * 0.2;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position * f, 1.);
    }
  `;
  const targetFsh = `
    uniform float uHighlight;
    uniform float uTime;
    
    const vec3 c = vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')});
    
    void main() {
      float f = max(1.0 - sign(uTime) * pow(abs(uTime), 0.5), 0.1);
      gl_FragColor = vec4(vec3(c * f * uHighlight), 1.0);
    }
  `;
  return p => {
    const geometry = targetMeshGeometry;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uHighlight: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
        uTime: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
      },
      vertexShader: targetVsh,
      fragmentShader: targetFsh,
      // transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  };
})();
const _makeHighlightPhysicsMesh = material => {
  const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
  material = material.clone();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.physicsId = 0;
  return mesh;
};

/* const highlightMesh = _makeTargetMesh();
highlightMesh.visible = false;
sceneLowPriority.add(highlightMesh);
let highlightedObject = null; */

const highlightPhysicsMesh = _makeHighlightPhysicsMesh(buildMaterial);
highlightPhysicsMesh.visible = false;
sceneLowPriority.add(highlightPhysicsMesh);
let highlightedPhysicsObject = null;
let highlightedPhysicsId = 0;

const mouseHighlightPhysicsMesh = _makeHighlightPhysicsMesh(highlightMaterial);
mouseHighlightPhysicsMesh.visible = false;
sceneLowPriority.add(mouseHighlightPhysicsMesh);
let mouseHoverObject = null;
let mouseHoverPhysicsId = 0;
let mouseHoverPosition = null;

const mouseSelectPhysicsMesh = _makeHighlightPhysicsMesh(selectMaterial);
mouseSelectPhysicsMesh.visible = false;
sceneLowPriority.add(mouseSelectPhysicsMesh);
let mouseSelectedObject = null;
let mouseSelectedPhysicsId = 0;
let mouseSelectedPosition = null;

const mouseDomHoverPhysicsMesh = _makeHighlightPhysicsMesh(hoverMaterial);
mouseDomHoverPhysicsMesh.visible = false;
sceneLowPriority.add(mouseDomHoverPhysicsMesh);
let mouseDomHoverObject = null;
let mouseDomHoverPhysicsId = 0;

/* const editMesh = _makeTargetMesh();
editMesh.visible = false;
scene.add(editMesh);
let editedObject = null; */

// const coord = new THREE.Vector3();
// const lastCoord = coord.clone();
// let highlightedWorld = null;

/* const moveMesh = _makeTargetMesh();
moveMesh.visible = false;
scene.add(moveMesh); */

/* const deployMesh = _makeTargetMesh();
deployMesh.visible = false;
deployMesh.rotation.order = 'YXZ';
deployMesh.savedRotation = deployMesh.rotation.clone();
scene.add(deployMesh); */

let selectedLoadoutIndex = -1;
let selectedLoadoutObject = null;
const _selectLoadout = index => {
  if (index !== selectedLoadoutIndex) {
    selectedLoadoutIndex = index;
  } else {
    selectedLoadoutIndex = -1;
  }
  // _updateLoadoutInterface();

  /* (async () => {
    if (selectedLoadoutObject) {
      world.appManager.removeTrackedApp(selectedLoadoutObject.instanceId);
      selectedLoadoutObject = null;
    }

    const loadout = loginManager.getLoadout();
    let item = loadout[selectedLoadoutIndex];
    if (gameManager.inventoryHack) {
      if (selectedLoadoutIndex === 1) {
        item = ['https://avaer.github.io/pistol/manifest.json'];
      } else if (selectedLoadoutIndex === 2) {
        item = ['https://avaer.github.io//rifle/manifest.json'];
      } else if (selectedLoadoutIndex === 3) {
        item = ['https://avaer.github.io//pickaxe/manifest.json'];
      } else if (selectedLoadoutIndex === 4) {
        item = ['https://avaer.github.io//lightsaber/manifest.json'];
      } else if (selectedLoadoutIndex === 5) {
        item = ['https://avaer.github.io//hovercraft/manifest.json'];
      } else if (selectedLoadoutIndex === 6) {
        item = ['https://avaer.github.io//hoverboard/manifest.json'];
      } else if (selectedLoadoutIndex === 7) {
        item = ['https://avaer.github.io//dragon-pet/manifest.json'];
      }
    }
    if (item) {
      const [contentId] = item;
      let id = parseInt(contentId, 10);
      if (isNaN(id)) {
        id = contentId;
      }
      selectedLoadoutObject = await world.appManager.addTrackedApp(id);

      if (selectedLoadoutObject.getComponents().some(component => component.type === 'use')) {
        if (selectedLoadoutObject.getPhysicsIds) {
          const physicsIds = selectedLoadoutObject.getPhysicsIds();
          for (const physicsId of physicsIds) {
            physicsManager.disableGeometry(physicsId);
          }
        }
        
        _equip(selectedLoadoutObject);
      } else {
        const {leftHand: {position, quaternion}} = useLocalPlayer();
        selectedLoadoutObject.position.copy(position);
        selectedLoadoutObject.quaternion.copy(quaternion);
        const scale = localVector.set(1, 1, 1);

        if (selectedLoadoutObject.getPhysicsIds) {
          const physicsIds = selectedLoadoutObject.getPhysicsIds();
          for (const physicsId of physicsIds) {
            physicsManager.setPhysicsTransform(physicsId, position, quaternion, scale);
          }
        }

        _grab(selectedLoadoutObject);

        gameManager.setMenu(0);
      }
    }
  })().catch(console.warn); */
};
const _deselectLoadout = () => {
  selectedLoadoutIndex = -1;
  selectedLoadoutObject = null;
  _updateLoadoutInterface();
};
const _updateLoadoutInterface = () => {
  for (let i = 0; i < loadoutItems.length; i++) {
    const itemEl = loadoutItems[i];
    itemEl.classList.toggle('selected', i === selectedLoadoutIndex);
  }
};

const _use = () => {
  if (gameManager.getMenu() === 3) {
    const itemSpec = itemSpecs3[selectedItemIndex];
    let {start_url, filename, content} = itemSpec;

    if (start_url) {
      // start_url = new URL(start_url, srcUrl).href;
      // filename = start_url;
    } else if (filename && content) {
      const blob = new Blob([content], {
        type: 'application/octet-stream',
      });
      start_url = URL.createObjectURL(blob);
      start_url += '/' + filename;
    }
    world.appManager.addTrackedApp(start_url, null, deployMesh.position, deployMesh.quaternion, deployMesh.scale);

    gameManager.setMenu(0);
    cameraManager.requestPointerLock();
  } else if (highlightedObject /* && !editedObject */) {
    // ioManager.currentWeaponGrabs[0] = true;
    _grab(highlightedObject);
    highlightedObject = null;
    
    gameManager.setMenu(0);
    cameraManager.requestPointerLock();
  } else if (gameManager.getMenu() === 1) {
    const itemSpec = itemSpecs1[selectedItemIndex];
    itemSpec.cb();
  } else if (gameManager.getMenu() === 2) {
    const inventory = loginManager.getInventory();
    const itemSpec = inventory[selectedItemIndex];

    world.appManager.addTrackedApp(itemSpec.id, null, deployMesh.position, deployMesh.quaternion, deployMesh.scale);

    gameManager.setMenu(0);
    cameraManager.requestPointerLock();
  } /* else {
    const {leftHand: {position}} = useLocalPlayer();

    const portalObjects = world.getStaticObjects()
      .concat(world.appManager.getObjects())
      .filter(object => {
        const {isPortal, json} = object;
        if (isPortal) {
          return localBox.set(
            localVector.fromArray(json.extents[0]),
            localVector2.fromArray(json.extents[1])
          )
            .applyMatrix4(object.matrixWorld)
            .distanceToPoint(position) === 0;
        } else {
          return false;
        }
      });
    const portalObject = portalObjects.length > 0 ? portalObjects[0] : null;
    if (portalObject && portalObject.json) {
      const u = new URL(location.href);
      if (['string', 'number'].includes(typeof portalObject.json.contentId)) {
        u.searchParams.set('u', portalObject.json.contentId);
      } else {
        u.searchParams.delete('u');
      }
      if (typeof portalObject.json.room === 'string') {
        u.searchParams.set('r', portalObject.json.room);
      } else {
        u.searchParams.delete('r');
      }
      universe.pushUrl(u.href);
    }
  } */
};
const _delete = () => {
  const grabbedObject = _getGrabbedObject(0);
  if (grabbedObject) {
    /* if (grabbedObject === selectedLoadoutObject) {
      _deselectLoadout();
    } */

    const localPlayer = useLocalPlayer();
    localPlayer.ungrab();
    
    world.appManager.removeTrackedApp(grabbedObject.instanceId);
  /* } else if (editedObject) {
    world.appManager.removeTrackedApp(editedObject.instanceId);
    editedObject = null;

    if (gameManager.getMenu() === 4) {
      _selectItemDelta(1);
    } else {
      _updateMenu();
    } */
  } else if (highlightedPhysicsObject) {
    world.appManager.removeTrackedApp(highlightedPhysicsObject.instanceId);
    highlightedPhysicsObject = null;

    /* if (gameManager.getMenu() === 4) {
      _selectItemDelta(1);
    } else {
      // _updateMenu();
    } */
  } else if (mouseSelectedObject) {
    world.appManager.removeTrackedApp(mouseSelectedObject.instanceId);
    
    if (mouseHoverObject === mouseSelectedObject) {
      gameManager.setMouseHoverObject(null);
    }
    gameManager.setMouseSelectedObject(null);
  }
};
const _click = () => {
  if (_getGrabbedObject(0)) {
    _deselectLoadout();

    const localPlayer = useLocalPlayer();
    localPlayer.ungrab();

  } else {
    if (highlightedPhysicsObject) {
      _grab(highlightedPhysicsObject);
    }
  }
};
let lastPistolUseStartTime = -Infinity;
const _startUse = () => {
  const localPlayer = useLocalPlayer();
  const wearApps = localPlayer.wears.map(({instanceId}) => metaversefileApi.getAppByInstanceId(instanceId));
  for (const wearApp of wearApps) {
    const useComponent = wearApp.getComponent('use');
    if (useComponent) {
      let useAction = localPlayer.actions.find(action => action.type === 'use');
      if (!useAction) {
        const {instanceId} = wearApp;
        const {subtype, boneAttachment, animation, position, quaternion, scale} = useComponent;
        useAction = {
          type: 'use',
          subtype,
          time: 0,
          instanceId,
          animation,
          boneAttachment,
          position,
          quaternion,
          scale,
        };
        localPlayer.actions.push(useAction);
        if (useAction && useAction.subtype === 'pistol') {
          lastPistolUseStartTime = performance.now();
        }

        wearApp.use();
      }
      break;
    }
  }
  /* if (appManager.equippedObjects[0]) {
    const o = world.appManager.equippedObjects[0];
    o.triggerAux && o.triggerAux();
  } */
};
const _endUse = () => {
  const localPlayer = useLocalPlayer();
  const useActionIndex = localPlayer.actions.findIndex(action => action.type === 'use');
  if (useActionIndex !== -1) {
    localPlayer.actions.splice(useActionIndex, 1);
  }
  /* if (appManager.equippedObjects[0]) {
    const o = world.appManager.equippedObjects[0];
    o.untriggerAux && o.untriggerAux();
  } */
};
const _mousedown = () => {
  _startUse();
};
const _mouseup = () => {
  _endUse();
};

/* const _try = async () => {
  const o = getGrabbedObject(0);
  if (o) {
    const localPlayer = useLocalPlayer();
    localPlayer.ungrab();

    const used = o.useAux ? o.useAux(rigManager.localRig.aux) : false;
    if (!used) {
      const notification = notifications.addNotification(`\
        <i class="icon fa fa-user-ninja"></i>
        <div class=wrap>
          <div class=label>Getting changed</div>
          <div class=text>
            The system is updating your avatar...
          </div>
          <div class=close-button>✕</div>
        </div>
      `, {
        timeout: Infinity,
      });
      try {
        await loginManager.setAvatar(o.contentId);
      } catch(err) {
        console.warn(err);
      } finally {
        notifications.removeNotification(notification);
      }
    }
  }
}; */

const _uploadFile = async (u, f) => {
  const res = await fetch(u, {
    method: 'POST',
    body: f,
  });
  const j = await res.json();
  const {hash} = j;
  const {name} = f;
  return {
    name,
    hash,
  };
};
const _proxifyUrl = u => {
  const match = u.match(/^([a-z0-9]+):\/\/([a-z0-9\-\.]+)(.+)$/i);
  // console.log('got match', match[1]);
  if (match) {
    return 'https://' + match[1] + '-' + match[2].replace(/\-/g, '--').replace(/\./g, '-') + '.proxy.webaverse.com' + match[3];
  } else {
    return u;
  }
};
const _handleUpload = async (item, transform = null) => {
  console.log('uploading...');
  
  const _uploadObject = async item => {
    let u;
    
    const file = item.getAsFile();
    const entry = item.webkitGetAsEntry();
    
    if (item.kind === 'string') {
      const s = await new Promise((accept, reject) => {
        item.getAsString(accept);
      });
      const j = JSON.parse(s);
      const {token_id, asset_contract} = j;
      const {address} = asset_contract;
      
      if (contractNames[address]) {
        u = `/@proxy/` + encodeURI(`eth://${address}/${token_id}`);
      } else {
        console.log('got j', j);
        const {traits} = j;
        // cryptovoxels wearables
        const voxTrait = traits.find(t => t.trait_type === 'vox'); // XXX move to a loader
        if (voxTrait) {
          const {value} = voxTrait;
          u = _proxifyUrl(value) + '?type=vox';
        } else {
          const {token_metadata} = j;
          // console.log('proxify', token_metadata);
          const res = await fetch(_proxifyUrl(token_metadata), {
            mode: 'cors',
          });
          const j2 = await res.json();
          // console.log('got metadata', j2);
          
          // dcl wearables
          if (j2.id?.startsWith('urn:decentraland:')) {
            // 'urn:decentraland:ethereum:collections-v1:mch_collection:mch_enemy_upper_body'
            const res = await fetch(`https://peer-lb.decentraland.org/lambdas/collections/wearables?wearableId=${j2.id}`, { // XXX move to a loader
              mode: 'cors',
            });
            const j3 = await res.json();
            const {wearables} = j3;
            const wearable = wearables[0];
            const representation = wearable.data.representations[0];
            const {mainFile, contents} = representation;
            const file = contents.find(f => f.key === mainFile);
            const match = mainFile.match(/\.([a-z0-9]+)$/i);
            const type = match && match[1];
            // console.log('got wearable', {mainFile, contents, file, type});
            u = '/@proxy/' + encodeURI(file.url) + (type ? ('?type=' + type) : '');
          } else {
            // avatar
            const {avatar_url, asset} = j2;
            const avatarUrl = avatar_url || asset;
            if (avatarUrl) {
              u = '/@proxy/' + encodeURI(avatarUrl) + '?type=vrm';
            } else {
              // default
              const {image} = j2;
              u = '/@proxy/' + encodeURI(image);
            }
          }
        }
      }
    } else if (entry.isDirectory) {
      const formData = new FormData();
      
      const rootEntry = entry;
      const _recurse = async entry => {
        function getFullPath(entry) {
          return entry.fullPath.slice(rootEntry.fullPath.length);
        }
        const fullPath = getFullPath(entry);
        console.log('directory full path', entry.fullPath, rootEntry.fullPath, fullPath);
        formData.append(
          fullPath,
          new Blob([], {
            type: 'application/x-directory',
          }),
          fullPath
        );
        
        const reader = entry.createReader();
        async function readEntries() {
          const entries = await new Promise((accept, reject) => {
            reader.readEntries(entries => {
              if (entries.length > 0) {
                accept(entries);
              } else {
                accept(null);
              }
            }, reject);
          });
          return entries;
        }
        let entriesArray;
        while (entriesArray = await readEntries()) {
          for (const entry of entriesArray) {
            if (entry.isFile) {
              const file = await new Promise((accept, reject) => {
                entry.file(accept, reject);
              });
              const fullPath = getFullPath(entry);
              console.log('file full path', entry.fullPath, rootEntry.fullPath, fullPath);

              formData.append(fullPath, file, fullPath);
            } else if (entry.isDirectory) {
              await _recurse(entry);
            }
          }
        } 
      };
      await _recurse(rootEntry);

      const uploadFilesRes = await fetch(`https://ipfs.webaverse.com/`, {
        method: 'POST',
        body: formData,
      });
      const hashes = await uploadFilesRes.json();

      const rootDirectory = hashes.find(h => h.name === '');
      const rootDirectoryHash = rootDirectory.hash;
      u = `https://ipfs.webaverse.com/ipfs/${rootDirectoryHash}/`;
      console.log(u);
    } else {
      const {name, hash} = await _uploadFile(`https://ipfs.webaverse.com/`, file);

      u = `${storageHost}/${hash}/${name}`;
    }
    return u;
  };
  const u = await _uploadObject(item);
  
  console.log('upload complete:', u);

  if (!transform) {
    const {leftHand: {position, quaternion}} = useLocalPlayer();
    const position2 = position.clone()
      .add(localVector2.set(0, 0, -1).applyQuaternion(quaternion));
    const quaternion2 = quaternion.clone();
    transform = {
      position: position2,
      quaternion: quaternion2,
    };
  }
  const {position, quaternion} = transform;
  
  world.appManager.addTrackedApp(u, position, quaternion, oneVector);
};
/* const bindUploadFileInput = uploadFileInput => {
  bindUploadFileButton(uploadFileInput, _handleUpload);
}; */

const _upload = () => {
  const uploadFileInput = document.getElementById('upload-file-input');
  uploadFileInput.click();
};

const _grab = object => {
  const localPlayer = useLocalPlayer();
  localPlayer.grab(object);
  
  // console.log('start grab');
  gameManager.gridSnap = 0;
  gameManager.editMode = false;

  /* const distance = object.position.distanceTo(position);
  if (distance < maxGrabDistance) {
    world.appManager.grabbedObjectOffsets[0] = 0;
  } else {
    world.appManager.grabbedObjectOffsets[0] = distance;
  } */
};

/* const _equip = object => {
  world.appManager.equippedObjects[0] = object;
};
const _unequip = () => {
  world.appManager.equippedObjects[0] = null;
}; */

const grabUseMesh = (() => {
  const app = metaversefileApi.createApp();
  (async () => {
    await metaverseModules.waitForLoad();
    const {modules} = metaversefileApi.useDefaultModules();
    const m = modules['button'];
    await app.addModule(m);
  })();
  app.target = null;
  return app;
})();
grabUseMesh.visible = false;
sceneLowPriority.add(grabUseMesh);

const hitboxOffsetDistance = 0.3;
const cylinderMesh = (() => {
  const radius = 1;
  const height = 0.2;
  const halfHeight = height/2;
  const cylinderMesh = new THREE.Mesh(
    new THREE.CylinderBufferGeometry(radius, radius, height),
    new THREE.MeshBasicMaterial({
      color: 0x00FFFF,
    })
  );
  cylinderMesh.radius = radius;
  cylinderMesh.halfHeight = halfHeight;
  return cylinderMesh;
})();

let lastDraggingRight = false;
let dragRightSpec = null;
const _gameUpdate = (timestamp) => {
  const now = timestamp;
  const renderer = getRenderer();
  
  const localPlayer = useLocalPlayer();
  
  const _updateLocalPlayer = () => {
    if (rigManager.localRig) {
      if (lastPistolUseStartTime >= 0) {
        const lastUseTimeDiff = timestamp - lastPistolUseStartTime;
        const kickbackTime = 300;
        const kickbackExponent = 0.05;
        const f = Math.min(Math.max(lastUseTimeDiff / kickbackTime, 0), 1);
        const v = Math.sin(Math.pow(f, kickbackExponent) * Math.PI);
        const fakeArmLength = 0.2;
        localQuaternion.setFromRotationMatrix(
          localMatrix.lookAt(
            localVector.copy(rigManager.localRig.inputs.leftGamepad.position),
            localVector2.copy(rigManager.localRig.inputs.leftGamepad.position)
              .add(
                localVector3.set(0, 1, -1)
                  .applyQuaternion(rigManager.localRig.inputs.leftGamepad.quaternion)
              ),
            localVector3.set(0, 0, 1)
              .applyQuaternion(rigManager.localRig.inputs.leftGamepad.quaternion)
          )
        )// .multiply(rigManager.localRig.inputs.leftGamepad.quaternion);
        
        rigManager.localRig.inputs.leftGamepad.position.sub(
          localVector.set(0, 0, -fakeArmLength)
            .applyQuaternion(rigManager.localRig.inputs.leftGamepad.quaternion)
        );
        
        rigManager.localRig.inputs.leftGamepad.quaternion.slerp(localQuaternion, v);
        
        rigManager.localRig.inputs.leftGamepad.position.add(
          localVector.set(0, 0, -fakeArmLength)
            .applyQuaternion(rigManager.localRig.inputs.leftGamepad.quaternion)
        );
      }
      
      localPlayer.position.copy(rigManager.localRig.inputs.hmd.position);
      localPlayer.quaternion.copy(rigManager.localRig.inputs.hmd.quaternion);
      localPlayer.leftHand.position.copy(rigManager.localRig.inputs.leftGamepad.position);
      localPlayer.leftHand.quaternion.copy(rigManager.localRig.inputs.leftGamepad.quaternion);
      localPlayer.rightHand.position.copy(rigManager.localRig.inputs.rightGamepad.position);
      localPlayer.rightHand.quaternion.copy(rigManager.localRig.inputs.rightGamepad.quaternion);
    } else {
      localPlayer.position.set(0, 0, 0);
      localPlayer.quaternion.set(0, 0, 0, 1);
      localPlayer.leftHand.position.set(0, 0, 0);
      localPlayer.leftHand.quaternion.set(0, 0, 0, 1);
      localPlayer.rightHand.position.set(0, 0, 0);
      localPlayer.rightHand.quaternion.set(0, 0, 0, 1);
    }
    
    lastLocalPlayerPosition.copy(localPlayer.position);
    lastLocalPlayerQuaternion.copy(localPlayer.quaternion);
  };
  _updateLocalPlayer();

  const _handlePush = () => {
    if (gameManager.canPush()) {
      if (ioManager.keys.forward) {
        gameManager.menuPush(-1);
      } else if (ioManager.keys.backward) {
        gameManager.menuPush(1);
      }
    }
  };
  _handlePush();

  const _updateGrab = () => {
    // moveMesh.visible = false;

    const _isWear = o => localPlayer.wears.some(wear => wear.instanceId === o.instanceId);

    grabUseMesh.visible = false;
    for (let i = 0; i < 2; i++) {
      const grabbedObject = _getGrabbedObject(i);
      if (grabbedObject && !_isWear(grabbedObject)) {
        const {position, quaternion} = localPlayer.hands[i];
        localMatrix.compose(position, quaternion, localVector.set(1, 1, 1));
        
        grabbedObject.updateMatrixWorld();
        // const oldMatrix = localMatrix2.copy(grabbedObject.matrixWorld);
        
        /* const {handSnap} = */updateGrabbedObject(grabbedObject, localMatrix, localMatrix3.fromArray(localPlayer.grabs[i].matrix), {
          collisionEnabled: true,
          handSnapEnabled: true,
          physx,
          gridSnap: gameManager.getGridSnap(),
        });

        grabbedObject.updateMatrixWorld();
        
        // const newMatrix = localMatrix4.copy(grabbedObject.matrixWorld);
        /* if (grabbedObject.getPhysicsIds) {
          const physicsIds = grabbedObject.getPhysicsIds();
          for (const physicsId of physicsIds) {
            const physicsTransform = physicsManager.getPhysicsTransform(physicsId);
            
            const oldTransformMatrix = localMatrix5.compose(physicsTransform.position, physicsTransform.quaternion, physicsTransform.scale);
            oldTransformMatrix.clone()
              .premultiply(oldMatrix.invert())
              .premultiply(newMatrix)
              .decompose(localVector, localQuaternion, localVector2);
            physicsManager.setPhysicsTransform(physicsId, localVector, localQuaternion, localVector2);
          }
        } */
        
        grabUseMesh.position.copy(camera.position)
          .add(
            localVector.copy(grabbedObject.position)
              .sub(camera.position)
              .normalize()
              .multiplyScalar(3)
          );
        grabUseMesh.quaternion.copy(camera.quaternion);
        // grabUseMesh.scale.copy(grabbedObject.scale);
        grabUseMesh.visible = true;
        grabUseMesh.target = grabbedObject;
        grabUseMesh.setComponent('value', gameManager.getActivateFactor(now));

        /* if (handSnap) {
          moveMesh.position.copy(grabbedObject.position);
          moveMesh.quaternion.copy(grabbedObject.quaternion);
          moveMesh.visible = true;
        } */
      }
    }
    if (!grabUseMesh.visible && !gameManager.editMode) {
      localVector.copy(localPlayer.position)
        .add(localVector2.set(0, physicsManager.getAvatarHeight() * (1 - getPlayerCrouchFactor(localPlayer)) * 0.5, -0.3).applyQuaternion(localPlayer.quaternion));
        
      const radius = 1;
      const halfHeight = 0.1;
      const collision = physx.physxWorker.collidePhysics(physx.physics, radius, halfHeight, localVector, localPlayer.quaternion, 1);
      if (collision) {
        const physicsId = collision.objectId;
        const object = metaversefileApi.getAppByPhysicsId(physicsId);
        if (object && !_isWear(object)) {
          object.getWorldPosition(grabUseMesh.position);
          grabUseMesh.quaternion.copy(camera.quaternion);
          // grabUseMesh.scale.copy(grabbedObject.scale);
          
          grabUseMesh.visible = true;
          grabUseMesh.target = object;
          grabUseMesh.setComponent('value', gameManager.getActivateFactor(now));
        }
      }
    }
  };
  _updateGrab();

  const _handlePhysicsHighlight = () => {
    highlightedPhysicsObject = null;

    if (gameManager.editMode) {
      /* const grabbedObject = _getGrabbedObject(0);
      const grabbedPhysicsIds = (grabbedObject && grabbedObject.getPhysicsIds) ? grabbedObject.getPhysicsIds() : [];
      for (const physicsId of grabbedPhysicsIds) {
        // physx.physxWorker.disableGeometryPhysics(physx.physics, physicsId);
        physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsId);
      } */

      const {position, quaternion} = renderer.xr.getSession() ? useLocalPlayer().leftHand : camera;
      const collision = physx.physxWorker.raycastPhysics(physx.physics, position, quaternion);
      if (collision) {
        const physicsId = collision.objectId;
        highlightedPhysicsObject = metaversefileApi.getAppByPhysicsId(physicsId);
        highlightedPhysicsId = physicsId;
      }

      /* for (const physicsId of grabbedPhysicsIds) {
        // physx.physxWorker.enableGeometryPhysics(physx.physics, physicsId);
        physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsId);
      } */
    }
  };
  _handlePhysicsHighlight();

  const _updatePhysicsHighlight = () => {
    highlightPhysicsMesh.visible = false;

    if (highlightedPhysicsObject) {
      const physicsId = highlightedPhysicsId;
      /* if (highlightPhysicsMesh.physicsId !== physicsId) {
        const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId);

        if (physicsGeometry) {
          let geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(physicsGeometry.positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(physicsGeometry.indices, 1));
          geometry = geometry.toNonIndexed();
          geometry.computeVertexNormals();

          highlightPhysicsMesh.geometry.dispose();
          highlightPhysicsMesh.geometry = geometry;
          // highlightPhysicsMesh.scale.setScalar(1.05);
          highlightPhysicsMesh.physicsId = physicsId;
        }
      } */

      highlightedPhysicsObject.updateMatrixWorld();

      const physicsObject = /*window.lolPhysicsObject ||*/ physicsManager.getPhysicsObject(physicsId);
      const {physicsMesh} = physicsObject;
      highlightPhysicsMesh.geometry = physicsMesh.geometry;
      // highlightPhysicsMesh.matrix.copy(physicsObject.matrix);
      highlightPhysicsMesh.matrixWorld.copy(physicsMesh.matrixWorld)
        .decompose(highlightPhysicsMesh.position, highlightPhysicsMesh.quaternion, highlightPhysicsMesh.scale);
      // highlightPhysicsMesh.updateMatrixWorld();
      // window.highlightPhysicsMesh = highlightPhysicsMesh;
      highlightPhysicsMesh.material.uniforms.uTime.value = (now%1500)/1500;
      highlightPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
      highlightPhysicsMesh.material.uniforms.uColor.value.setHex(buildMaterial.uniforms.uColor.value.getHex());
      highlightPhysicsMesh.material.uniforms.uColor.needsUpdate = true;
      highlightPhysicsMesh.visible = true;
    }
  };
  _updatePhysicsHighlight();

  const _updateMouseHighlight = () => {
    mouseHighlightPhysicsMesh.visible = false;

    const h = mouseHoverObject;
    if (h && !gameManager.dragging) {
      const physicsId = mouseHoverPhysicsId;
      /* if (mouseHighlightPhysicsMesh.physicsId !== physicsId) {
        const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId);

        if (physicsGeometry) {
          let geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(physicsGeometry.positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(physicsGeometry.indices, 1));
          geometry = geometry.toNonIndexed();
          geometry.computeVertexNormals();

          mouseHighlightPhysicsMesh.geometry.dispose();
          mouseHighlightPhysicsMesh.geometry = geometry;
          // mouseHighlightPhysicsMesh.scale.setScalar(1.05);
          mouseHighlightPhysicsMesh.physicsId = physicsId;
        }
      } */

      const physicsObject = physicsManager.getPhysicsObject(physicsId);
      const {physicsMesh} = physicsObject;
      mouseHighlightPhysicsMesh.geometry = physicsMesh.geometry;
      localMatrix2.copy(physicsMesh.matrixWorld)
        // .premultiply(localMatrix3.copy(mouseHoverObject.matrixWorld).invert())
        .decompose(mouseHighlightPhysicsMesh.position, mouseHighlightPhysicsMesh.quaternion, mouseHighlightPhysicsMesh.scale);
      mouseHighlightPhysicsMesh.material.uniforms.uTime.value = (now%1500)/1500;
      mouseHighlightPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
      mouseHighlightPhysicsMesh.material.uniforms.distanceOffset.value = -mouseHighlightPhysicsMesh.position.distanceTo(camera.position)
      mouseHighlightPhysicsMesh.material.uniforms.distanceOffset.needsUpdate = true;
      mouseHighlightPhysicsMesh.visible = true;
    }
  };
  _updateMouseHighlight();
  
  const _updateMouseSelect = () => {
    mouseSelectPhysicsMesh.visible = false;

    const o = mouseSelectedObject;
    if (o) {
      const physicsId = mouseSelectedPhysicsId;
      if (mouseSelectPhysicsMesh.physicsId !== physicsId) {
        /* const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId);

        if (physicsGeometry) {
          let geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(physicsGeometry.positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(physicsGeometry.indices, 1));
          geometry = geometry.toNonIndexed();
          geometry.computeVertexNormals();

          mouseSelectPhysicsMesh.geometry.dispose();
          mouseSelectPhysicsMesh.geometry = geometry;
          // mouseSelectPhysicsMesh.scale.setScalar(1.05);
          mouseSelectPhysicsMesh.physicsId = physicsId;
        } */
      }

      const physicsObject = physicsManager.getPhysicsObject(physicsId);
      if (physicsObject) {
        const {physicsMesh} = physicsObject;
        mouseSelectPhysicsMesh.geometry = physicsMesh.geometry;
        // window.geometry = mouseSelectPhysicsMesh.geometry;
        
        // update matrix
        {
          localMatrix2.copy(physicsMesh.matrixWorld)
            // .premultiply(localMatrix3.copy(mouseSelectedObject.matrixWorld).invert())
            .decompose(mouseSelectPhysicsMesh.position, mouseSelectPhysicsMesh.quaternion, mouseSelectPhysicsMesh.scale);
          // console.log('decompose', mouseSelectPhysicsMesh.position.toArray().join(','), mouseSelectPhysicsMesh.quaternion.toArray().join(','), mouseSelectPhysicsMesh.scale.toArray().join(','));
          // debugger;
          // mouseSelectPhysicsMesh.position.set(0, 0, 0);
          // mouseSelectPhysicsMesh.quaternion.identity();
          // mouseSelectPhysicsMesh.scale.set(1, 1, 1);
          mouseSelectPhysicsMesh.updateMatrixWorld();
          mouseSelectPhysicsMesh.visible = true;
        }
        // update uniforms
        {
          mouseSelectPhysicsMesh.material.uniforms.uTime.value = (now%1500)/1500;
          mouseSelectPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
          
          mouseSelectPhysicsMesh.material.uniforms.distanceOffset.value = -mouseSelectPhysicsMesh.position.distanceTo(camera.position);
          mouseSelectPhysicsMesh.material.uniforms.distanceOffset.needsUpdate = true;
        }
      } /* else {
        console.warn('no physics transform for object', o, physicsId, physicsTransform);
      } */
    }
  };
  _updateMouseSelect();
  
  const _updateMouseDomHover = () => {
    mouseDomHoverPhysicsMesh.visible = false;

    if (mouseDomHoverObject && !mouseSelectedObject) {
      const physicsId = mouseDomHoverPhysicsId;
      /* if (mouseHighlightPhysicsMesh.physicsId !== physicsId) {
        const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId);

        if (physicsGeometry) {
          let geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(physicsGeometry.positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(physicsGeometry.indices, 1));
          geometry = geometry.toNonIndexed();
          geometry.computeVertexNormals();

          mouseHighlightPhysicsMesh.geometry.dispose();
          mouseHighlightPhysicsMesh.geometry = geometry;
          // mouseHighlightPhysicsMesh.scale.setScalar(1.05);
          mouseHighlightPhysicsMesh.physicsId = physicsId;
        }
      } */

      const physicsObject = physicsManager.getPhysicsObject(physicsId);
      if (physicsObject) {
        const {physicsMesh} = physicsObject;
        mouseDomHoverPhysicsMesh.geometry = physicsMesh.geometry;
        localMatrix2.copy(physicsMesh.matrixWorld)
          // .premultiply(localMatrix3.copy(mouseHoverObject.matrixWorld).invert())
          .decompose(mouseDomHoverPhysicsMesh.position, mouseDomHoverPhysicsMesh.quaternion, mouseDomHoverPhysicsMesh.scale);
        mouseDomHoverPhysicsMesh.material.uniforms.uTime.value = (now%1500)/1500;
        mouseDomHoverPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
        mouseDomHoverPhysicsMesh.material.uniforms.distanceOffset.value = -mouseDomHoverPhysicsMesh.position.distanceTo(camera.position)
        mouseDomHoverPhysicsMesh.material.uniforms.distanceOffset.needsUpdate = true;
        mouseDomHoverPhysicsMesh.visible = true;
      }
    }
  };
  _updateMouseDomHover();

  const _handleTeleport = () => {
    if (rigManager.localRig) {
      teleportMeshes[1].update(rigManager.localRig.inputs.leftGamepad.position, rigManager.localRig.inputs.leftGamepad.quaternion, ioManager.currentTeleport, (p, q) => physx.physxWorker.raycastPhysics(physx.physics, p, q), (position, quaternion) => {
        const localPlayer = useLocalPlayer();
        localPlayer.teleportTo(position, quaternion);
      });
    }
  };
  _handleTeleport();

  const _handleClosestObject = () => {
    const apps = world.appManager.apps;
    if (apps.length > 0) {
      let closestObject;
      
      if (!gameManager.getMouseSelectedObject() && !gameManager.contextMenu) {
        if (/*controlsManager.isPossessed() &&*/ cameraManager.getMode() !== 'firstperson') {
          rigManager.localRigMatrix.decompose(
            localVector,
            localQuaternion,
            localVector2
          );
          localVector.y -= physicsManager.getAvatarHeight() / 2;
          const distanceSpecs = apps.map(object => {
            let distance = object.position.distanceTo(localVector);
            if (distance > 30) {
              distance = Infinity;
            }
            return {
              distance,
              object,
            };
          }).sort((a, b) => a.distance - b.distance);
          const closestDistanceSpec = distanceSpecs[0];
          if (isFinite(closestDistanceSpec.distance)) {
            closestObject = closestDistanceSpec.object;
          }
        } else {
          if ((!!rigManager.localRig && /*controlsManager.isPossessed() &&*/ cameraManager.getMode()) === 'firstperson' || gameManager.dragging) {
            localRay.set(
              camera.position,
              localVector.set(0, 0, -1)
                .applyQuaternion(camera.quaternion)
            );
            
            const distanceSpecs = apps.map(object => {
              const distance =
                object.position.distanceTo(camera.position) < 8 ?
                  localRay.distanceToPoint(object.position)
                :
                  Infinity;
              return {
                distance,
                object,
              };
            }).sort((a, b) => a.distance - b.distance);
            const closestDistanceSpec = distanceSpecs[0];
            if (isFinite(closestDistanceSpec.distance)) {
              closestObject = closestDistanceSpec.object;
            }
          } else {
            closestObject = gameManager.getMouseHoverObject();
          }
        }
      } else {
        closestObject = null;
      }
      
      gameManager.closestObject = closestObject;
    }
  };
  _handleClosestObject();
  
  const _handleUsableObject = () => {
    const apps = world.appManager.apps;
    if (apps.length > 0) {
      let usableObject;
      
      if (
        !gameManager.getMouseSelectedObject() &&
        !gameManager.contextMenu /* &&
        controlsManager.isPossessed() */
      ) {
        rigManager.localRigMatrix.decompose(
          localVector,
          localQuaternion,
          localVector2
        );
        localVector.y -= physicsManager.getAvatarHeight() / 2;
        const distanceSpecs = apps.map(object => {
          let distance = object.position.distanceTo(localVector);
          if (distance > 3) {
            distance = Infinity;
          }
          return {
            distance,
            object,
          };
        }).sort((a, b) => a.distance - b.distance);
        const closestDistanceSpec = distanceSpecs[0];
        if (isFinite(closestDistanceSpec.distance)) {
          usableObject = closestDistanceSpec.object;
        }
      } else {
        usableObject = null;
      }
      
      gameManager.usableObject = usableObject;
    }
  };
  _handleUsableObject();
  
  const _updateDrags = () => {
    const {draggingRight} = gameManager;
    if (draggingRight !== lastDraggingRight) {
      if (draggingRight) {
        const e = gameManager.getLastMouseEvent();
        if (e) {
          const {clientX, clientY} = e;
          const cameraStartPosition = camera.position.clone();
          
          dragRightSpec = {
            clientX,
            clientY,
            cameraStartPosition,
          };
        } else {
          dragRightSpec = null;
        }
      } else {
        dragRightSpec = null;
      }
    }
    lastDraggingRight = draggingRight;
  };
  _updateDrags();
  
  const _updateUses = () => {
    const localPlayer = useLocalPlayer();
    let activateActionIndex = localPlayer.actions.findIndex(action => action.type === 'activate');
    if (activateActionIndex !== -1) {
      const activateAction = localPlayer.actions[activateActionIndex];
      if (activateAction.time >= useTotalTime) {
        if (grabUseMesh.target) {
          grabUseMesh.target.activate();
        }
        localPlayer.actions.splice(activateActionIndex, 1);
      }
    }
  };
  _updateUses();
  
  const _updateHits = () => {
    const localPlayer = useLocalPlayer();
  
    cylinderMesh.position.copy(localPlayer.position)
      .add(localVector.set(0, 0, -hitboxOffsetDistance).applyQuaternion(localPlayer.quaternion));
    cylinderMesh.quaternion.copy(localPlayer.quaternion);
    // cylinderMesh.startPosition.copy(localPlayer.position);
    
    const useAction = localPlayer.actions.find(action => action.type === 'use');
    if (useAction && useAction.animation === 'combo') {
      const collision = physx.physxWorker.collidePhysics(physx.physics, cylinderMesh.radius, cylinderMesh.halfHeight, cylinderMesh.position, cylinderMesh.quaternion, 1);
      if (collision) {
        const collisionId = collision.objectId;
        const object = metaversefileApi.getAppByPhysicsId(collisionId);// || world.getNpcFromPhysicsId(collisionId);
        if (object) {
          // const worldPosition = object.getWorldPosition(localVector);
          const damage = typeof useAction.damage === 'number' ? useAction.damage : 30;
          object.hit(damage, {
            collisionId,
          });
        }
      }
    }
  };
  _updateHits();
  
  const _updateEyes = () => {
    if (rigManager.localRig) {
      if (!document.pointerLockElement && lastMouseEvent) {
        const renderer = getRenderer();
        const size = renderer.getSize(localVector);
        
        rigManager.localRig.eyeTarget.set(-(lastMouseEvent.clientX/size.x-0.5), (lastMouseEvent.clientY/size.y-0.5), 1)
          .unproject(camera);
        rigManager.localRig.eyeTargetEnabled = true;
      } else {
        rigManager.localRig.eyeTargetEnabled = false;
      }
    }
  };
  _updateEyes();

  const crosshairEl = document.getElementById('crosshair');
  if (crosshairEl) {
    const visible = !!document.pointerLockElement &&
      (['camera', 'firstperson', 'thirdperson'].includes(cameraManager.getMode()) || useLocalPlayer().actions.some(action => action.type === 'aim')) &&
      !_getGrabbedObject(0);
    crosshairEl.style.visibility = visible ? null : 'hidden';
  }
};
const _pushWorldAppUpdates = () => {
  world.appManager.setPushingLocalUpdates(true);
  
  for (const object of world.appManager.apps) {
    object.updateMatrixWorld();
    if (!object.matrix.equals(object.lastMatrix)) {
      object.matrix.decompose(localVector, localQuaternion, localVector2);
      world.appManager.setTrackedAppTransform(object.instanceId, localVector, localQuaternion, localVector2);
      
      const physicsObjects = object.getPhysicsObjects();
      for (const physicsObject of physicsObjects) {
        physicsObject.position.copy(object.position);
        physicsObject.quaternion.copy(object.quaternion);
        physicsObject.scale.copy(object.scale);
        physicsObject.updateMatrixWorld();
        
        physicsManager.pushUpdate(physicsObject);
        physicsObject.needsUpdate = false;
      }
      
      object.lastMatrix.copy(object.matrix);
    }
  }

  world.appManager.setPushingLocalUpdates(false);
};
const _pushAppUpdates = () => {
  _pushWorldAppUpdates();
};

/* const cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.01, 0.01, 0.01), new THREE.MeshBasicMaterial({
  color: 0xFF0000,
  side: THREE.DoubleSide,
}));
inventoryAvatarScene.add(cubeMesh); */

/* renderer.domElement.addEventListener('wheel', e => {
  if (document.pointerLockElement) {
    if (world.appManager.grabbedObjects[0]) {
      world.appManager.grabbedObjectOffsets[0] = Math.max(appManager.grabbedObjectOffsets[0] + e.deltaY * 0.01, 0);
    }
  }
}); */

/* const wheel = document.createElement('div');
wheel.style.cssText = `
  display: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: auto !important;
  height: auto !important;
  justify-content: center;
  align-items: center;
`;
document.body.appendChild(wheel);

const size = 400;
const pixelSize = size * window.devicePixelRatio;
const wheelCanvas = document.createElement('canvas');
wheelCanvas.style.cssText = `
  width: ${size}px !important;
  height: ${size}px !important;
`;
wheelCanvas.width = pixelSize;
wheelCanvas.height = pixelSize;
wheelCanvas.ctx = wheelCanvas.getContext('2d');
wheel.appendChild(wheelCanvas);

const wheelDotCanvas = (() => {
  const size = 4;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.style.cssText = `
    display: none;
    position: absolute;
    width: auto !important;
    height: auto !important;
  `;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
})();
document.body.appendChild(wheelDotCanvas); */

/* let wheelReady = false;
Promise.all([
  new FontFaceObserver('Muli').load(null, 10000),
  new FontFaceObserver('Font Awesome 5 Pro').load(weaponIcons.join(''), 10000),
]).then(() => {
  wheelReady = true;
}); */
/* let wheelReady = true;
const _renderWheel = (() => {
  let lastSelectedSlice = 0;
  return selectedSlice => {
    if (selectedSlice !== lastSelectedSlice) {
      const {ctx} = wheelCanvas;

      ctx.clearRect(0, 0, pixelSize, pixelSize);

      const numSlices = weapons.length;
      const interval = Math.PI*0.01;
      for (let i = 0; i < numSlices; i++) {
        ctx.fillStyle = i === selectedSlice ? '#4fc3f7' : '#111';
        ctx.beginPath();
        const startAngle = i*Math.PI*2/numSlices + interval - Math.PI/2;
        const endAngle = (i+1)*Math.PI*2/numSlices - interval - Math.PI/2;
        ctx.arc(pixelSize/2, pixelSize/2, pixelSize/2, startAngle, endAngle, false);
        ctx.arc(pixelSize/2, pixelSize/2, pixelSize/4, endAngle, startAngle, true);
        ctx.fill();

        ctx.font = (pixelSize/20) + 'px \'Font Awesome 5 Pro\'';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const midAngle = (startAngle + endAngle)/2;
        const weapon = weapons[i];
        ctx.fillText(weaponIcons[i], pixelSize/2 + Math.cos(midAngle)*(pixelSize/2+pixelSize/4)/2, pixelSize/2 + Math.sin(midAngle)*(pixelSize/2+pixelSize/4)/2);
        ctx.font = (pixelSize/30) + 'px Muli';
        ctx.fillText(weapon, pixelSize/2 + Math.cos(midAngle)*(pixelSize/2+pixelSize/4)/2, pixelSize/2 + Math.sin(midAngle)*(pixelSize/2+pixelSize/4)/2 + pixelSize/20);
      }

      lastSelectedSlice = selectedSlice;
    }
  };
})(); */

const rotationSnap = Math.PI/6;

/* let selectedItemIndex = 0;
const _selectItem = newSelectedItemIndex => {
  selectedItemIndex = newSelectedItemIndex;
  _updateMenu();
};
const _getItemsEl = () => document.getElementById('items-' + gameManager.getMenu());
const _selectItemDelta = offset => {
  const itemsEl = _getItemsEl();

  let newSelectedItemIndex = selectedItemIndex + offset;
  if (newSelectedItemIndex >= itemsEl.childNodes.length) {
    newSelectedItemIndex = 0;
  } else if (newSelectedItemIndex < 0) {
    newSelectedItemIndex = itemsEl.childNodes.length - 1;
  }
  if (newSelectedItemIndex < 0) {
    console.warn('selecting nonexistent zero item index');
    newSelectedItemIndex = 0;
  }
  _selectItem(newSelectedItemIndex);
}; */

/* let lastSelectedBuild = -1;
let lastCameraFocus = -1;
const _updateMenu = () => {
  if (menu1El && menu2El && menu3El && menu4El) {
    const {menuOpen} = gameManager;

    menu1El.classList.toggle('open', menuOpen === 1);
    menu2El.classList.toggle('open', menuOpen === 2);
    menu3El.classList.toggle('open', menuOpen === 3);
    menu4El.classList.toggle('open', menuOpen === 4);
    unmenuEl.classList.toggle('closed', menuOpen !== 0 || !!appManager.grabbedObjects[0] || !!highlightedObject || !!editedObject);
    objectMenuEl.classList.toggle('open', !!highlightedObject && !appManager.grabbedObjects[0] && !editedObject && menuOpen !== 4);
    grabMenuEl.classList.toggle('open', !!appManager.grabbedObjects[0]);
    editMenuEl.classList.toggle('open', !!editedObject);
    locationIcon.classList.toggle('open', false);
    locationIcon.classList.toggle('highlight', false);
    profileIcon.classList.toggle('open', false);
    itemIcon.classList.toggle('open', false);
    itemMonetizedIcon.classList.toggle('open', false);
    grabIcon.classList.toggle('open', false);
    editIcon.classList.toggle('open', false);

    deployMesh.visible = false;

    const _updateTabs = () => {
      const selectedTabIndex = menuOpen - 1;
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const childNodes = Array.from(tab.querySelectorAll('.img'))
          .concat(Array.from(tab.querySelectorAll('.name')));
        for (const childNode of childNodes) {
          childNode.classList.toggle('disabled', i !== selectedTabIndex);
        }
      }
    };
    _updateTabs();

    const _updateSelectedItem = (itemsEl, selectedItemIndex) => {
      for (const childNode of itemsEl.childNodes) {
        childNode.classList.remove('selected');
      }
      const itemEl = itemsEl.childNodes[selectedItemIndex];
      if (itemEl) {
        itemEl.classList.add('selected');

        const itemsBoundingRect = itemsEl.getBoundingClientRect();
        const itemBoundingRect = itemEl.getBoundingClientRect();
        if (itemBoundingRect.y <= itemsBoundingRect.y || itemBoundingRect.bottom >= itemsBoundingRect.bottom) {
          itemEl.scrollIntoView();
        }
      }
    };

    if (menuOpen === 1) {
      profileIcon.classList.toggle('open', true);

      _updateSelectedItem(items1El, selectedItemIndex);

      deployMesh.visible = true;

      if (lastSelectedBuild !== selectedItemIndex) {
        const itemSpec = itemSpecs1[selectedItemIndex];
        itemsDetails1El.innerHTML = itemSpec.detailsHtml;
        lastSelectedBuild = selectedItemIndex;
      }
      
      lastCameraFocus = -1;
    } else if (menuOpen === 2) {
      profileIcon.classList.toggle('open', true);

      _updateSelectedItem(items2El, selectedItemIndex);
      
      lastSelectedBuild = -1;
      lastCameraFocus = -1;
    } else if (menuOpen === 3) {
      profileIcon.classList.toggle('open', true);

      // profileLabel.innerText = 'parzival';

      _updateSelectedItem(items3El, selectedItemIndex);

      deployMesh.visible = true;
      
      lastSelectedBuild = -1;
      lastCameraFocus = -1;
    } else if (menuOpen === 4) {
      profileIcon.classList.toggle('open', true);

      _updateSelectedItem(items4El, selectedItemIndex);

      if (lastCameraFocus !== selectedItemIndex) {
        const itemEl = items4El.childNodes[selectedItemIndex];
        if (itemEl) {
          const instanceId = itemEl.getAttribute('instanceid');
          const object = world.appManager.getObjects().find(o => o.instanceId === instanceId);
          if (object) {
            cameraManager.focusCamera(object.position);
          }
        }
        lastCameraFocus = selectedItemIndex;
      }

      lastSelectedBuild = -1;
    } else if (appManager.grabbedObjects[0]) {
      grabIcon.classList.toggle('open', true);
      // grabLabel.innerText = 'Grabbing';

      lastSelectedBuild = -1;
      lastCameraFocus = -1;
    } else if (editedObject) {
      editIcon.classList.toggle('open', true);
      // editLabel.innerText = 'Editing';

      lastSelectedBuild = -1;
      lastCameraFocus = -1;
    } else if (highlightedObject) {
      const monetization = document[`monetization${highlightedObject.instanceId}`];
      if (monetization && monetization.state === 'started') {
        itemMonetizedIcon.classList.toggle('open', true);
      }
      itemIcon.classList.toggle('open', true);
      itemLabel.innerText = 'lightsaber';

      lastSelectedBuild = -1;
      lastCameraFocus = -1;
    } else {
      locationIcon.classList.toggle('open', true);

      lastSelectedBuild = -1;
      lastCameraFocus = -1;
    }

    locationLabel.innerText = `Overworld`;
  }
};

const _loadItemSpec1 = async u => {
  const p = new Promise((accept, reject) => {
    world.addEventListener('objectsadd', async e => {
      accept(e.data);
    }, {once: true});
  });

  world.appManager.addTrackedApp(u, null, deployMesh.position, deployMesh.quaternion, deployMesh.scale);

  const object = await p;
  editedObject = object;

  gameManager.setMenu(0);
  // world.appManager.grabbedObjectOffsets[0] = maxGrabDistance;
  cameraManager.requestPointerLock();

  return object;
};
const itemSpecs3 = [
  {
    "name": "home",
    "start_url": "https://avaer.github.io/home/manifest.json"
  },
  {
    "name": "mirror",
    "start_url": "https://avaer.github.io/mirror/index.js"
  },
  {
    "name": "lightsaber",
    "start_url": "https://avaer.github.io/lightsaber/index.js"
  },
  {
    "name": "shield",
    "start_url": "https://avaer.github.io/shield/index.js"
  },
  {
    "name": "physicscube",
    "start_url": "https://avaer.github.io/physicscube/index.js"
  },
  {
    "name": "weapons",
    "start_url": "https://avaer.github.io/weapons/index.js"
  },
  {
    "name": "hookshot",
    "start_url": "https://avaer.github.io/hookshot/index.js"
  },
  {
    "name": "voxels",
    "start_url": "https://avaer.github.io/voxels/index.js"
  },
  {
    "name": "cv",
    "filename": "cv.url",
    "content": "https://cv.webaverse.com/"
  },
  {
    "name": "dcl",
    "filename": "cv.url",
    "content": "https://dcl.webaverse.com/"
  },
  {
    "name": "h",
    "filename": "h.url",
    "content": "https://h.webaverse.com/"
  },
  {
    "name": "land",
    "start_url": "https://avaer.github.io/land/index.js"
  },
  {
    "name": "planet",
    "start_url": "https://avaer.github.io/planet/index.js"
  },
  {
    "name": "camera",
    "start_url": "https://avaer.github.io/camera/index.js"
  },
  {
    "name": "cat-in-hat",
    "start_url": "https://avaer.github.io/cat-in-hat/manifest.json"
  },
  {
    "name": "sword",
    "start_url": "https://avaer.github.io/sword/manifest.json"
  },
  {
    "name": "dragon-pet",
    "start_url": "https://avaer.github.io/dragon-pet/manifest.json"
  },
  {
    "name": "dragon-mount",
    "start_url": "https://avaer.github.io/dragon-mount/manifest.json"
  },
  {
    "name": "dragon-fly",
    "start_url": "https://avaer.github.io/dragon-fly/manifest.json"
  },
  {
    "name": "pistol",
    "start_url": "https://avaer.github.io/pistol/manifest.json"
  },
  {
    "name": "rifle",
    "start_url": "https://avaer.github.io/rifle/manifest.json"
  },
  {
    "name": "pickaxe",
    "start_url": "https://avaer.github.io/pickaxe/manifest.json"
  },
  {
    "name": "hoverboard",
    "start_url": "https://avaer.github.io/hoverboard/manifest.json"
  },
  {
    "name": "hovercraft",
    "start_url": "https://avaer.github.io/hovercraft/manifest.json"
  },
  {
    "name": "cityscape",
    "start_url": "https://raw.githubusercontent.com/metavly/cityscape/master/manifest.json"
  },
];
const itemSpecs1 = [
  {
    name: 'Build',
    icon: 'assets/noun_wall_3213150.svg',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Build</b> lets you build walls, floors, and structures.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/object.geo');
    },
  },
  {
    name: 'Model',
    icon: 'fa-alien-monster',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Model</b> lets you place a 3D model in GLTF format.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/robot.glb');
    },
  },
  {
    name: 'Avatar',
    icon: 'fa-user-ninja',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Avatar</b> lets you place an avatar model in VRM format.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/37023052771851054.vrm');
    },
  },
  {
    name: 'Image',
    icon: 'fa-image',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Image</b> lets you place a simple image billboard.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/Rainbow_Dash.png');
    },
  },
  {
    name: 'Audio',
    icon: 'fa-headphones',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Audio</b> lets you place spatial audio.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/br.mp3');
    },
  },
  {
    name: 'Voxel',
    icon: 'fa-cube',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Voxel</b> lets you place a voxel model in VOX format.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/square_hedge.vox');
    },
  },
  {
    name: 'Link',
    icon: 'fa-portal-enter',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Link</b> lets you create a web link portal.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/dcl.url');
    },
  },
  {
    name: 'Web Frame',
    icon: 'fa-browser',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Web Frame</b> lets you place a web content iframe.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/deviantart.iframe');
    },
  },
  {
    name: 'Media Stream',
    icon: 'fa-signal-stream',
    detailsHtml: `\
      <img class=video src="./assets/screenshot.jpg">
      <div class=wrap>
        <b>Media Stream</b> lets you stream audio, video, and screenshares.
      </div>
    `,
    cb() {
      _loadItemSpec1('./assets/type/object.mediastream');
    },
  },
];
const _selectTab = newSelectedTabIndex => {
  gameManager.setMenu(newSelectedTabIndex + 1);
};
const _selectTabDelta = offset => {
  let newSelectedTabIndex = (gameManager.getMenu() - 1) + offset;
  if (newSelectedTabIndex >= tabs.length) {
    newSelectedTabIndex = 0;
  } else if (newSelectedTabIndex < 0) {
    newSelectedTabIndex = tabs.length - 1;
  }
  _selectTab(newSelectedTabIndex);
};
const bindInterface = () => {
  if (items1El && items2El && items3El && chatInputEl) {
    for (let i = 0; i < itemSpecs3.length; i++) {
      const itemSpec = itemSpecs3[i];
      const div = document.createElement('div');
      div.classList.add('item');
      div.innerHTML = `
        <div class=card>
          <img src="${'https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png'}">
        </div>
        <div class=name>${itemSpec.name}</div>
        <div class="key-helpers">
          <div class="key-helper">
            <div class=key>E</div>
            <div class=label>Spawn</div>
          </div>
        </div>
      `;
      div.addEventListener('click', e => {
        _use();
      });
      div.addEventListener('mouseenter', e => {
        selectedItemIndex = i;
        _updateMenu();
      });
      items3El.appendChild(div);
    }

    for (let i = 0; i < itemSpecs1.length; i++) {
      const itemSpec = itemSpecs1[i];
      const div = document.createElement('div');
      div.classList.add('item');
      div.innerHTML = `\
        <div class=bar></div>
        ${/^fa-/.test(itemSpec.icon) ?
          `<i class="icon fa ${itemSpec.icon}"></i>`
        :
          `<img src="${itemSpec.icon}" class=icon>`
        }
        <div class=name>${itemSpec.name}</div>
        <div class="key-helpers">
          <div class="key-helper">
            <div class=key>E</div>
            <div class=label>Create</div>
          </div>
        </div>
      `;
      div.addEventListener('click', e => {
        _use();
      });
      div.addEventListener('mouseenter', e => {
        selectedItemIndex = i;
        _updateMenu();
      });
      items1El.appendChild(div);
    }

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      tab.addEventListener('click', e => {
        _selectTab(i);
      });
    }

    [keyTabEl, keyTab1El, keyTab2El, keyTab3El, keyTab4El].forEach((el, i) => {
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        if (appManager.grabbedObjects[0]) {
          if (appManager.grabbedObjects[0] === selectedLoadoutObject) {
            _deselectLoadout();
          }

          _ungrab();
        } else if (editedObject) {
          if (editedObject.isBuild && editedObject.getShapes().length === 0) {
            world.appManager.removeTrackedApp(editedObject.instanceId);
          }

          editedObject = null;
          _updateMenu();
        } else {
          const hasMenu = !!gameManager.getMenu();
          if (hasMenu && !document.pointerLockElement) {
            cameraManager.requestPointerLock();
          } else if (!hasMenu && document.pointerLockElement) {
            document.exitPointerLock();
          }

          gameManager.setMenu(hasMenu ? 0 : 1);
        }
      });
    });

    {
      const _stopPropagation = e => {
        e.stopPropagation();
      };
      [
        menu1El,
        menu2El,
        menu3El,
        menu4El,
        unmenuEl,
        objectMenuEl,
      ].forEach(menuEl => {
        menuEl.addEventListener('wheel', _stopPropagation);
      });
    }

    (async () => {
      await loginManager.waitForLoad();

      const inventory = loginManager.getInventory();
      for (let i = 0; i < inventory.length; i++) {
        const itemSpec = inventory[i];
        const div = document.createElement('div');
        div.classList.add('item');
        div.innerHTML = `
          <div class=card>
            <img src="${itemSpec.image}">
          </div>
          <div class=name>${itemSpec.name}</div>
          <div class="key-helpers">
            <div class="key-helper">
              <div class=key>E</div>
              <div class=label>Spawn</div>
            </div>
          </div>
        `;
        div.addEventListener('click', e => {
          _use();
        });
        div.addEventListener('mouseenter', e => {
          selectedItemIndex = i;
          _updateMenu();
        });
        items2El.appendChild(div);
      }
    })();
    (async () => {
      await loginManager.waitForLoad();

      const loadout = loginManager.getLoadout();
      for (let i = 0; i < loadout.length; i++) {
        const item = loadout[i];
        const itemEl = itemsEls[i];

        const boxEl = itemEl.querySelector('.box');
        boxEl.innerHTML = item ? `<img src="${item[3]}">` : '';
      }
    })();
    
    world.addEventListener('trackedobjectsadd', async e => {
      const {trackedObject, dynamic} = e.data;
      if (dynamic) {
        const trackedObjectJson = trackedObject.toJSON();
        const {contentId, instanceId} = trackedObjectJson;

        const div = document.createElement('a');
        div.classList.add('item');
        div.setAttribute('href', contentId);
        div.setAttribute('instanceid', instanceId);
        div.innerHTML = `
          <div class=card>
            <img src="${'https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png'}">
          </div>
          <div class=name></div>
          <div class="key-helpers">
            <div class="key-helper progress">
              <div class=bar></div>
              <div class=key>E</div>
              <div class=label>Grab</div>
            </div>
            <div class="key-helper">
              <div class=key>X</div>
              <div class=label>Delete</div>
            </div>
          </div>
        `;
        const name = div.querySelector('.name');
        name.innerText = contentId;
        div.addEventListener('click', e => {
          _use();
        });
        div.addEventListener('mouseenter', e => {
          const i = Array.from(items4El.childNodes).indexOf(div);
          selectedItemIndex = i;
          _updateMenu();
        });
        items4El.appendChild(div);
      }
    });
    world.addEventListener('trackedobjectsremove', async e => {
      const {trackedObject, dynamic} = e.data;
      if (dynamic) {
        const instanceId = trackedObject.get('instanceId');
        const itemEl = items4El.querySelector(`.item[instanceid="${instanceId}"]`);
        items4El.removeChild(itemEl);
      }
    });

    chatInputEl.addEventListener('keydown', e => {
      switch (e.which) {
        case 13: { // enter
          gameManager.enter();
          break;
        }
      }
    });
    chatInputEl.addEventListener('blur', e => {
      chatInputEl.classList.remove('open');
      chatInputEl.value = '';
    });
  }
}; */

const metaverseUi = {
  makeArrowLoader() {
    const app = metaversefileApi.createApp();
    (async () => {
      await metaverseModules.waitForLoad();
      const {modules} = metaversefileApi.useDefaultModules();
      const m = modules['arrowLoader'];
      await app.addModule(m);
    })();
    return app;
  },
};
window.addEventListener('dragover', e => {
  e.preventDefault();
  // console.log('got drag over', e.dataTransfer);
});
window.addEventListener('drop', async e => {
  e.preventDefault();
  
  const renderer = getRenderer();
  const rect = renderer.domElement.getBoundingClientRect();
  localVector2D.set(
    ( e.clientX / rect.width ) * 2 - 1,
    - ( e.clientY / rect.height ) * 2 + 1
  );
  localRaycaster.setFromCamera(localVector2D, camera);
  const dropZOffset = 2;
  const position = localRaycaster.ray.origin.clone()
    .add(
      localVector2.set(0, 0, -dropZOffset)
        .applyQuaternion(
          localQuaternion
            .setFromRotationMatrix(localMatrix.lookAt(
              localVector3.set(0, 0, 0),
              localRaycaster.ray.direction,
              localVector4.set(0, 1, 0)
            ))
        )
    );
  const quaternion = camera.quaternion.clone();
  
  let arrowLoader = metaverseUi.makeArrowLoader();
  arrowLoader.position.copy(position);
  arrowLoader.quaternion.copy(quaternion);
  scene.add(arrowLoader);
  
  const items = Array.from(e.dataTransfer.items);
  await Promise.all(items.map(async item => {
    await _handleUpload(item, {
      position,
      quaternion,
    });
  }));
  
  if (arrowLoader) {
    scene.remove(arrowLoader);
    arrowLoader.destroy();
  }
});

/* const cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({
  color: 0xFF0000,
}));
scene.add(cubeMesh); */

/* scene.addEventListener('contextmenu', e => {
  const {event} = e;
  event.preventDefault();

  if (
    dragRightSpec &&
    lastMouseEvent.clientX === dragRightSpec.clientX &&
    lastMouseEvent.clientY === dragRightSpec.clientY &&
    mouseHoverObject
  ) {
    gameManager.setContextMenu(true);
    gameManager.setContextMenuObject(mouseHoverObject);
  
    gameManager.setMouseSelectedObject(mouseHoverObject, mouseHoverPhysicsId);
  }
}); */

const _bindPointerLock = () => {
  document.addEventListener('pointerlockchange', () => {
    gameManager.setMouseHoverObject(null);
    if (!document.pointerLockElement) {
      gameManager.editMode = false;
    }
  });
};
_bindPointerLock();

let lastLocalPlayerPosition;
let lastLocalPlayerQuaternion;
const _bindLocalPlayerTeleport = () => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  lastLocalPlayerPosition = localPlayer.position.clone();
  lastLocalPlayerQuaternion = localPlayer.quaternion.clone();
  world.appManager.addEventListener('preframe', e => {
    if (
      !localPlayer.position.equals(lastLocalPlayerPosition) ||
      !localPlayer.quaternion.equals(lastLocalPlayerQuaternion)
    ) {
      localPlayer.teleportTo(localPlayer.position, localPlayer.quaternion, {
        relation: 'head',
      });
    }
  });
};
_bindLocalPlayerTeleport();

let droppedThrow = false;
let lastMouseEvent = null;
const gameManager = {
  // weapons,
  // cubeMesh,
  /* buildMode: 'wall',
  buildMat: 'wood', */
  menuOpen: 0,
  // weaponWheel: false,
  gridSnap: 0,
  editMode: false,
  dragging: false,
  draggingRight: false,
  contextMenu: false,
  contextMenuObject: null,
  inventoryHack: false,
  closestObject: null,
  usableObject: null,
  hoverEnabled: false,
  // sceneLoaded: false,
  /* getWeapon() {
    return selectedWeapon;
  },
  setWeapon(newSelectedWeapon) {
    selectedWeapon = newSelectedWeapon;
  }, */
  /* setWeaponWheel(newOpen) {
    if (newOpen && !gameManager.weaponWheel) {
      wheel.style.display = 'flex';
      wheelDotCanvas.style.display = null;
      wheelDotCanvas.style.left = `${window.innerWidth/2}px`;
      wheelDotCanvas.style.top = `${window.innerHeight/2}px`;
      gameManager.weaponWheel = true;
    } else if (gameManager.weaponWheel && !newOpen) {
      wheel.style.display = 'none';
      wheelDotCanvas.style.display = 'none';
      gameManager.weaponWheel = false;
    }
  },
  updateWeaponWheel(e) {
    if (wheelReady) {
      const {movementX, movementY} = e;

      let left = parseInt(wheelDotCanvas.style.left, 10);
      let top = parseInt(wheelDotCanvas.style.top, 10);
      left += movementX;
      top += movementY;
      wheelDotCanvas.style.left = `${left}px`;
      wheelDotCanvas.style.top = `${top}px`;

      const mousePosition = new THREE.Vector2(left, top);
      const wheelCanvasRect = wheelCanvas.getBoundingClientRect();

      let selectedSlice = 0;
      let selectedSliceDistance = Infinity;
      const numSlices = weapons.length;
      const interval = Math.PI*0.01;
      for (let i = 0; i < numSlices; i++) {
        const startAngle = i*Math.PI*2/numSlices + interval - Math.PI/2;
        const endAngle = (i+1)*Math.PI*2/numSlices - interval - Math.PI/2;
        const midAngle = (startAngle + endAngle)/2;
        const slicePosition = new THREE.Vector2(
          wheelCanvasRect.left + size/2 + Math.cos(midAngle)*(size/2+size/4)/2,
          wheelCanvasRect.top + size/2 + Math.sin(midAngle)*(size/2+size/4)/2
        );
        const distance = mousePosition.distanceTo(slicePosition);
        if (distance < selectedSliceDistance) {
          selectedSlice = i;
          selectedSliceDistance = distance;
        }
      }
      _renderWheel(selectedSlice);
    }
  }, */
  // bindInterface,
  // bindUploadFileInput,
  getMenu() {
    return this.menuOpen;
  },
  setMenu(newOpen) {
    this.menuOpen = newOpen;
    if (newOpen) {
      _selectItem(0);
    } else {
      // _updateMenu();
    }
  },
  menuVertical(offset) {
    if (this.menuOpen) {
      _selectItemDelta(offset);
    }
  },
  menuHorizontal(offset) {
    if (this.menuOpen) {
      _selectTabDelta(offset);
    }
  },
  setContextMenu(contextMenu) {
    this.contextMenu = contextMenu;
  },
  getContextMenuObject() {
    return this.contextMenuObject;
  },
  setContextMenuObject(contextMenuObject) {
    this.contextMenuObject = contextMenuObject;
  },
  menuUse() {
    _use();
  },
  menuDelete() {
    _delete();
  },
  menuClick() {
    _click();
  },
  menuMouseDown() {
    _mousedown();
  },
  menuMouseUp() {
    _mouseup();
  },
  menuAim() {
    const localPlayer = useLocalPlayer();
    if (!localPlayer.actions.some(action => action.type === 'aim')) {
      localPlayer.actions.push({
        type: 'aim',
      });
    }
  },
  menuUnaim() {
    const localPlayer = useLocalPlayer();
    const index = localPlayer.actions.findIndex(action => action.type === 'aim');
    if (index !== -1) {
      localPlayer.actions.splice(index, 1);
    }
  },
  menuDragdown(e) {
    this.dragging = true;
    
    world.appManager.dispatchEvent(new MessageEvent('dragchange', {
      data: {
        dragging: this.dragging,
      },
    }));

    /* if (document.pointerLockElement) {
      document.exitPointerLock();
    } */
    /* if (url) {
      await rigManager.setLocalAvatarUrl(url, ext);
    } */
    // controlsManager.setPossessed(false);
  },
  menuDrag(e) {
    const {movementX, movementY} = e;
    if (Math.abs(movementX) < 100 && Math.abs(movementY) < 100) { // hack around a Chrome bug
      camera.position.add(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));
  
      camera.rotation.y -= movementX * Math.PI * 2 * 0.0005;
      camera.rotation.x -= movementY * Math.PI * 2 * 0.0005;
      camera.rotation.x = Math.min(Math.max(camera.rotation.x, -Math.PI / 2), Math.PI / 2);
      camera.quaternion.setFromEuler(camera.rotation);

      camera.position.sub(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));

      camera.updateMatrixWorld();
    }
  },
  menuDragup() {
    this.dragging = false;
    
    world.appManager.dispatchEvent(new MessageEvent('dragchange', {
      data: {
        dragging: this.dragging,
      },
    }));
  },
  menuDragdownRight(e) {
    this.draggingRight = true;
  },
  menuDragRight(e) {
    // this.draggingRight = true;
  },
  menuDragupRight() {
    this.draggingRight = false;
  },
  /* canTry() {
    return !!world.appManager.grabbedObjects[0];
  },
  menuTry() {
    _try();
  }, */
  menuKey(c) {
    menuMesh.key(c);
  },
  menuSelectAll() {
    menuMesh.selectAll();
  },
  menuPaste(s) {
    menuMesh.paste(s);
  },
  canGrab() {
    return !!highlightedObject /*&& !editedObject*/;
  },
  canRotate() {
    return !!_getGrabbedObject(0);
    // return !!world.appManager.grabbedObjects[0];
  },
  menuRotate(direction) {
    const object = _getGrabbedObject(0);
    object.savedRotation.y -= direction * rotationSnap;
  },
  canPush() {
    return !!_getGrabbedObject(0);
    // return !!world.appManager.grabbedObjects[0] /*|| (editedObject && editedObject.isBuild)*/;
  },
  menuPush(direction) {
    const localPlayer = useLocalPlayer();
    const matrix = localMatrix.fromArray(localPlayer.grabs[0].matrix);
    matrix
      .decompose(localVector, localQuaternion, localVector2);
    localVector.z += direction * 0.1;
    matrix
      .compose(localVector, localQuaternion, localVector2)
      .toArray(localPlayer.grabs[0].matrix);
  },
  /* menuDrop() {
    console.log('menu drop');
  }, */
  /* menuPhysics() {
    const selectedObject = gameManager.getMouseSelectedObject();
    // console.log('menu physics', selectedObject);
    if (selectedObject) {
      const physicsIds = selectedObject.getPhysicsIds ? selectedObject.getPhysicsIds() : [];
      if (physicsIds.length > 0) {
        const physicsId = physicsIds[0];
        const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId);
        if (physicsGeometry) {
          let geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(physicsGeometry.positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(physicsGeometry.indices, 1));
          // geometry = geometry.toNonIndexed();
          // geometry.computeVertexNormals();

          const physicsBuffer = physicsManager.cookConvexGeometry(new THREE.Mesh(geometry));

          const physicsId = physicsManager.addCookedConvexGeometry(physicsBuffer, selectedObject.position, selectedObject.quaternion, selectedObject.scale);
          
          // console.log('got physics id', physicsId);
          
          // physicsIds.push(physicsId);
          // staticPhysicsIds.push(physicsId);
        }
      }
    }
  }, */
  menuGridSnap() {
    if (this.gridSnap === 0) {
      this.gridSnap = 32;
    } else if (this.gridSnap > 1) {
      this.gridSnap /= 2;
    } else {
      this.gridSnap = 0;
    }
    gridSnapEl.innerText = this.gridSnap > 0 ? (this.gridSnap + '') : 'off';
  },
  getGridSnap() {
    if (this.gridSnap === 0) {
      return 0;
    } else {
      return 4/this.gridSnap;
    }
  },
  menuVDown() {
    if (_getGrabbedObject(0)) {
      this.menuGridSnap();
    } else {
      // physicsManager.setDanceState('dansu');
      const localPlayer = useLocalPlayer();
      let action = localPlayer.actions.find(action => action.type === 'dansu');
      if (!action) {
        action = {
          type: 'dansu',
          animation: 'dansu',
          time: 0,
        };
        localPlayer.actions.push(action);
      }
    }
  },
  menuVUp(e) {
    // physicsManager.setDanceState(null);
    const localPlayer = useLocalPlayer();
    const actionIndex = localPlayer.actions.findIndex(action => action.type === 'dansu');
    if (actionIndex !== -1) {
      localPlayer.actions.splice(actionIndex, 1);
    }
  },
  menuBDown(e) {
    if (e.ctrlKey) {
      universe.reload();
    }
    /* if (!world.appManager.grabbedObjects[0]) {
      if (!physicsManager.getThrowState()) {
        physicsManager.setThrowState({});
        droppedThrow = false;
      }
    } */
  },
  menuBUp() {
    // physicsManager.setThrowState(null);
  },
  /* setWorld(newCoord, newHighlightedWorld) {
    lastCoord.copy(coord);
    coord.copy(newCoord);

    const lastHighlightedWorld = highlightedWorld;
    highlightedWorld = newHighlightedWorld;

    if (!coord.equals(lastCoord) || highlightedWorld !== lastHighlightedWorld) {
      _updateMenu();
    }
  }, */
  menuDoubleShift() {
    const localPlayer = useLocalPlayer();
    let narutoRunAction = localPlayer.actions.find(action => action.type === 'narutoRun');
    if (!narutoRunAction) {
      narutoRunAction = {
        type: 'narutoRun',
        time: 0,
      };
      localPlayer.actions.push(narutoRunAction);
    }
  },
  menuUnDoubleShift() {
    const localPlayer = useLocalPlayer();
    const narutoRunActionIndex = localPlayer.actions.findIndex(action => action.type === 'narutoRun');
    if (narutoRunActionIndex !== -1) {
      localPlayer.actions.splice(narutoRunActionIndex, 1);
    }
  },
  isFlying() {
    return useLocalPlayer().actions.some(action => action.type === 'fly');
  },
  toggleFly() {
    const localPlayer = useLocalPlayer();
    const flyActionIndex = localPlayer.actions.findIndex(action => action.type === 'fly');
    if (flyActionIndex !== -1) {
      localPlayer.actions.splice(flyActionIndex, 1);
    } else {
      const flyAction = {
        type: 'fly',
        time: 0,
      };
      localPlayer.actions.push(flyAction);
      
      if (gameManager.isJumping()) {
        const jumpActionIndex = localPlayer.actions.findIndex(action => action.type === 'jump');
        localPlayer.actions.splice(jumpActionIndex, 1);
      }
      if (gameManager.isCrouched()) {
        const crouchActionIndex = localPlayer.actions.findIndex(action => action.type === 'crouch');
        localPlayer.actions.splice(crouchActionIndex, 1);
      }
    }
  },
  isCrouched() {
    return useLocalPlayer().actions.some(action => action.type === 'crouch');
  },
  toggleCrouch() {
    const localPlayer = useLocalPlayer();
    let crouchActionIndex = localPlayer.actions.findIndex(action => action.type === 'crouch');
    if (crouchActionIndex !== -1) {
      const crouchAction = localPlayer.actions[crouchActionIndex];
      crouchAction.direction = crouchAction.direction === 'down' ? 'up' : 'down';
    } else {
      const crouchAction = {
        type: 'crouch',
        direction: 'down',
        time: 0,
      };
      localPlayer.actions.push(crouchAction);
    }
  },
  /* async destroyWorld() {
    if (highlightedWorld) {
      const {name} = highlightedWorld;
      const res = await fetch(`${worldsHost}/${name}`, {
        method: 'DELETE',
      });
      await res.blob();
      console.log('deleted', res.status);
    }
  }, */
  selectLoadout(index) {
    _selectLoadout(index);
  },
  canToggleAxis() {
    return false; // !!world.appManager.grabbedObjects[0]; // || (editedObject && editedObject.isBuild);
  },
  toggleAxis() {
    console.log('toggle axis');
  },
  async toggleEditMode() {
    this.editMode = !this.editMode;
    // console.log('got edit mode', this.editMode);
    if (this.editMode) {
      if (!document.pointerLockElement) {
        await cameraManager.requestPointerLock();
      }
      if (this.mouseSelectedObject) {
        this.setMouseSelectedObject(null);
      }
      if (_getGrabbedObject(0)) {
        const localPlayer = useLocalPlayer();
        localPlayer.ungrab();
      } 
    }
  },
  /* canUpload() {
    return this.menuOpen === 1;
  }, */
  menuUpload: _upload,
  enter() {
    if (chatInputEl) {
      chatInputEl.classList.toggle('open');
      if (chatInputEl.classList.contains('open')) {
        chatInputEl.focus();
      } else {
        const s = chatInputEl.value;
        if (s) {
          const username = loginManager.getUsername();
          messages.addMessage(username, s);
          
          chatInputEl.value = '';
        }
      }
    }
  },
  addLocalEmote(index) {
    if (rigManager.localRig) {
      const timestamp = performance.now();
      const startTimestamp = timestamp;
      const aTimestamp = startTimestamp + 300;
      const bTimestamp = aTimestamp + 1000;
      const endTimestamp = bTimestamp + 300;
      
      const emote = {
        index,
        value: 0,
      };
      rigManager.localRig.emotes.push(emote);
      const _finish = () => {
        rigManager.localRig.emotes.splice(rigManager.localRig.emotes.indexOf(emote), 1);
        world.appManager.removeEventListener('frame', frame);
      };
      const frame = e => {
        const {timestamp} = e.data;
        if (timestamp < aTimestamp) {
          emote.value = cubicBezier((timestamp - startTimestamp) / (aTimestamp - startTimestamp));
        } else if (timestamp < bTimestamp) {
          emote.value = 1;
        } else if (timestamp < endTimestamp) {
          emote.value = 1 - cubicBezier((timestamp - bTimestamp) / (endTimestamp - bTimestamp));
        } else {
          _finish();
        }
      };
      world.appManager.addEventListener('frame', frame);
    }
  },
  /* canBuild() {
    return !!editedObject && editedObject.isBuild;
  },
  canStartBuild() {
    return !world.appManager.grabbedObjects[0] && !highlightedObject;
  },
  async startBuild(mode) {
    const object = await _loadItemSpec1('./assets/type/object.geo');
    object.setMode(mode);
    this.gridSnap = 1;
    this.editMode = false;
  },
  setBuildMode(mode) {
    editedObject.setMode(mode);
  }, */
  isJumping() {
    return useLocalPlayer().actions.some(action => action.type === 'jump');
  },
  ensureJump() {
    const localPlayer = useLocalPlayer();
    let jumpAction = localPlayer.actions.find(action => action.type === 'jump');
    
    const wears = localPlayer.wears.slice();
    for (const {instanceId} of wears) {
      const app = metaversefileApi.getAppByInstanceId(instanceId);
      const sitComponent = app.getComponent('sit');
      if (sitComponent) {
        app.unwear();
      }
    }

    if (!jumpAction) {
      jumpAction = {
        type: 'jump',
        time: 0,
      };
      localPlayer.actions.push(jumpAction);
    }
  },
  jump() {
    this.ensureJump();
    physicsManager.velocity.y += 5;
  },
  isMovingBackward() {
    return physicsManager.direction.z > 0 && this.isAiming();
  },
  /* canJumpOff() {
    return rigManager.localRig ? (
      rigManager.localRig.aux?.sittables.length > 0
    ) : false;
  },
  jumpOff() {
    const auxPose = rigManager.localRig.aux.getPose();
    auxPose.sittables.length = 0;
    rigManager.localRig.aux.setPose(auxPose);
  }, */
  isAiming() {
    return useLocalPlayer().actions.some(action => action.type === 'aim');
  },
  isSitting() {
    return useLocalPlayer().actions.some(action => action.type === 'sit');
  },
  /* setSceneLoaded(sceneLoaded) {
    this.sceneLoaded = sceneLoaded;
  }, */
  getMouseHoverObject() {
    return mouseHoverObject;
  },
  getMouseHoverPhysicsId() {
    return mouseHoverPhysicsId;
  },
  getMouseHoverPosition() {
    return mouseHoverPosition;
  },
  setHoverEnabled(hoverEnabled) {
    this.hoverEnabled = hoverEnabled;
  },
  setMouseHoverObject(o, physicsId, position) {
    mouseHoverObject = o;
    mouseHoverPhysicsId = physicsId;
    if (mouseHoverObject && position) {
      mouseHoverPosition = position.clone();
    } else {
      mouseHoverPosition = null;
    }
    
    // console.log('set mouse hover', !!mouseHoverObject);
    world.appManager.dispatchEvent(new MessageEvent('hoverchange', {
      data: {
        app: mouseHoverObject,
        physicsId: mouseHoverPhysicsId,
        position: mouseHoverPosition,
      },
    }));
  },
  getMouseSelectedObject() {
    return mouseSelectedObject;
  },
  getMouseSelectedPhysicsId() {
    return mouseSelectedPhysicsId;
  },
  getMouseSelectedPosition() {
    return mouseSelectedPosition;
  },
  setMouseSelectedObject(o, physicsId, position) {
    mouseSelectedObject = o;
    mouseSelectedPhysicsId = physicsId;
    if (mouseSelectedObject && position) {
      mouseSelectedPosition = position.clone();
    } else {
      mouseSelectedPosition = null;
    }
    
    world.appManager.dispatchEvent(new MessageEvent('selectchange', {
      data: {
        app: mouseSelectedObject,
        physicsId: mouseSelectedPhysicsId,
        position: mouseSelectedPosition,
      },
    }));
  },
  getMouseDomHoverObject() {
    return mouseDomHoverObject;
  },
  getMouseDomHoverPhysicsId() {
    return mouseDomHoverPhysicsId;
  },
  setMouseDomHoverObject(o, physicsId) {
    mouseDomHoverObject = o;
    mouseDomHoverPhysicsId = physicsId;
    
    /* // console.log('set mouse dom hover', !!mouseHoverObject);
    world.appManager.dispatchEvent(new MessageEvent('hoverchange', {
      data: {
        app: mouseDomHoverObject,
        physicsId: mouseDomHoverPhysicsId,
      },
    })); */
  },
  getSpeed() {
    let speed = 0;
    
    const walkSpeed = 0.1;
    const flySpeed = walkSpeed * 2;
    const defaultCrouchSpeed = walkSpeed * 0.7;
    const isCrouched = gameManager.isCrouched();
    const isMovingBackward = gameManager.isMovingBackward();
    if (isCrouched && !isMovingBackward) {
      speed = defaultCrouchSpeed;
    } else if (gameManager.isFlying()) {
      speed = flySpeed;
    } else {
      speed = walkSpeed;
    }
    
    const sprintMultiplier = (ioManager.keys.shift && !isCrouched) ?
      (ioManager.keys.doubleShift ? 20 : 3)
    :
      1;
    speed *= sprintMultiplier;
    
    const backwardMultiplier = isMovingBackward ? 0.7 : 1;
    speed *= backwardMultiplier;
    
    return speed;
  },
  getClosestObject() {
    return gameManager.closestObject;
  },
  getUsableObject() {
    return gameManager.usableObject;
  },
  getLastMouseEvent() {
    return lastMouseEvent;
  },
  setLastMouseEvent(e) {
    if (!lastMouseEvent) {
      lastMouseEvent = {
        clientX: 0,
        clientY: 0,
        inside: false,
      };
    }
    if (e) {
      lastMouseEvent.clientX = e.clientX;
      lastMouseEvent.clientY = e.clientY;
      lastMouseEvent.inside = true;
    } else {
      lastMouseEvent.inside = false;
    }
  },
  getDragRightSpec() {
    return dragRightSpec;
  },
  getActivateFactor(now) {
    const localPlayer = useLocalPlayer();
    const activateAction = localPlayer.actions.find(action => action.type === 'activate');
    if (activateAction) {
      return Math.min(Math.max(activateAction.time / useTotalTime, 0), 1);
    } else {
      return 0;
    }
  },
  menuActivateDown() {
    if (grabUseMesh.visible) {
      const localPlayer = useLocalPlayer();
      let activateAction = localPlayer.actions.find(action => action.type === 'activate');
      if (!activateAction) {
        activateAction = {
          type: 'activate',
          time: 0,
        };
        localPlayer.actions.push(activateAction);
      }
    }
  },
  menuActivateUp() {
    const localPlayer = useLocalPlayer();
    for (let i = 0; i < localPlayer.actions.length; i++) {
      const action = localPlayer.actions[i];
      if (action.type === 'activate') {
        localPlayer.actions.splice(i, 1);
        i--;
      }
    }
  },
  update: _gameUpdate,
  pushAppUpdates: _pushAppUpdates,
};
export default gameManager;
