import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import geometryManager from './geometry-manager.js';
import cameraManager from './camera-manager.js';
import uiManager from './ui-manager.js';
import ioManager from './io-manager.js';
import {loginManager} from './login.js';
import physicsManager from './physics-manager.js';
import {world} from './world.js';
import * as universe from './universe.js';
import {rigManager} from './rig.js';
import {buildMaterial} from './shaders.js';
import {makeTextMesh} from './vr-ui.js';
import {teleportMeshes} from './teleport.js';
import {appManager, renderer, scene, orthographicScene, camera, dolly} from './app-object.js';
import buildTool from './build-tool.js';
import * as notifications from './notifications.js';
import * as popovers from './popovers.js';
import messages from './messages.js';
import {getExt, bindUploadFileButton, updateGrabbedObject} from './util.js';
import {maxGrabDistance, storageHost, worldsHost} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localColor = new THREE.Color();
const localBox = new THREE.Box3();

const gltfLoader = new GLTFLoader();

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
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, 1, 0).normalize(), new THREE.Vector3(1, -1, 0).normalize())))
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
const _makeHighlightPhysicsMesh = () => {
  const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
  const material = buildMaterial.clone();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.physicsId = 0;
  return mesh;
};

const highlightMesh = _makeTargetMesh();
highlightMesh.visible = false;
scene.add(highlightMesh);
let highlightedObject = null;

const highlightPhysicsMesh = _makeHighlightPhysicsMesh();
highlightPhysicsMesh.visible = false;
scene.add(highlightPhysicsMesh);
let highlightedPhysicsObject = null;
let highlightedPhysicsId = 0;

const editMesh = _makeTargetMesh();
editMesh.visible = false;
scene.add(editMesh);
let editedObject = null;

const coord = new THREE.Vector3();
const lastCoord = coord.clone();
let highlightedWorld = null;

const moveMesh = _makeTargetMesh();
moveMesh.visible = false;
scene.add(moveMesh);

const deployMesh = _makeTargetMesh();
deployMesh.visible = false;
deployMesh.rotation.order = 'YXZ';
deployMesh.savedRotation = deployMesh.rotation.clone();
scene.add(deployMesh);

let selectedLoadoutIndex = -1;
let selectedLoadoutObject = null;
const _selectLoadout = index => {
  if (index !== selectedLoadoutIndex) {
    selectedLoadoutIndex = index;
  } else {
    selectedLoadoutIndex = -1;
  }
  _updateLoadoutInterface();

  (async () => {
    if (selectedLoadoutObject) {
      if (appManager.grabbedObjects[0] === selectedLoadoutObject) {
        _ungrab();
      }
      
      world.removeObject(selectedLoadoutObject.instanceId);
      selectedLoadoutObject = null;
    }

    const loadout = loginManager.getLoadout();
    const item = loadout[selectedLoadoutIndex];
    if (item) {
      const [contentId] = item;
      let id = parseInt(contentId, 10);
      if (isNaN(id)) {
        id = contentId;
      }
      selectedLoadoutObject = await world.addObject(id, null, new THREE.Vector3(), new THREE.Quaternion());
      const transforms = rigManager.getRigTransforms();
      const {position, quaternion} = transforms[0];
      selectedLoadoutObject.position.copy(position);
      selectedLoadoutObject.quaternion.copy(quaternion);

      _grab(selectedLoadoutObject);

      weaponsManager.setMenu(0);
    }
  })().catch(console.warn);
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
  if (weaponsManager.getMenu() === 3) {
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
    world.addObject(start_url, null, deployMesh.position, deployMesh.quaternion);

    weaponsManager.setMenu(0);
    cameraManager.requestPointerLock();
  } else if (highlightedObject && !editedObject) {
    // ioManager.currentWeaponGrabs[0] = true;
    _grab(highlightedObject);
    highlightedObject = null;
    
    weaponsManager.setMenu(0);
    cameraManager.requestPointerLock();
  } else if (weaponsManager.getMenu() === 1) {
    const itemSpec = itemSpecs1[selectedItemIndex];
    itemSpec.cb();
  } else if (weaponsManager.getMenu() === 2) {
    const inventory = loginManager.getInventory();
    const itemSpec = inventory[selectedItemIndex];

    world.addObject(itemSpec.id, null, deployMesh.position, deployMesh.quaternion);

    weaponsManager.setMenu(0);
    cameraManager.requestPointerLock();
  } else {
    const transforms = rigManager.getRigTransforms();
    const {position} = transforms[0];
    
    const portalObjects = world.getStaticObjects()
      .concat(world.getObjects())
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
  }
};
let useAnimation = null;
const _useHold = () => {
  const now = Date.now();
  useAnimation = {
    start: now,
    end: now + 1000,
  };
};
const _useRelease = () => {
  useAnimation = null;
};
const _delete = () => {
  if (appManager.grabbedObjects[0]) {
    world.removeObject(appManager.grabbedObjects[0].instanceId);

    if (appManager.grabbedObjects[0] === selectedLoadoutObject) {
      _deselectLoadout();
    }

    _ungrab();
  } else if (editedObject) {
    world.removeObject(editedObject.instanceId);
    editedObject = null;

    if (weaponsManager.getMenu() === 4) {
      _selectItemDelta(1);
    } else {
      _updateMenu();
    }
  } else if (highlightedObject) {
    world.removeObject(highlightedObject.instanceId);
    highlightedObject = null;

    if (weaponsManager.getMenu() === 4) {
      _selectItemDelta(1);
    } else {
      _updateMenu();
    }
  }
};
const _click = () => {
  if (weaponsManager.canBuild()) {
    editedObject.place();
  } else if (appManager.grabbedObjects[0]) {
    if (appManager.grabbedObjectOffsets[0] < maxGrabDistance) {
      console.log('use object', appManager.grabbedObjects[0]); // XXX
    } else {
      _ungrab();
    }
  }
};

const _equip = async () => {
  if (highlightedObject) {
    const {contentId} = highlightedObject;
    
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
      await loginManager.setAvatar(contentId);
    } catch(err) {
      console.warn(err);
    } finally {
      notifications.removeNotification(notification);
    }
  }
};

const _handleUpload = async file => {
  const {name, hash} = await loginManager.uploadFile(file);
  console.log('uploaded', {name, hash});
  
  const transforms = rigManager.getRigTransforms();
  let {position, quaternion} = transforms[0];
  position = position.clone()
    .add(localVector2.set(0, 0, -1).applyQuaternion(quaternion));
  quaternion = quaternion.clone();

  const u = `${storageHost}/ipfs/${hash}/${name}`;
  world.addObject(u, null, position, quaternion);
};
const bindUploadFileInput = uploadFileInput => {
  bindUploadFileButton(uploadFileInput, _handleUpload);
};

const _upload = () => {
  const uploadFileInput = document.getElementById('upload-file-input');
  uploadFileInput.click();
};

const _grab = object => {
  const transforms = rigManager.getRigTransforms();
  const {position, quaternion} = transforms[0];

  appManager.grabbedObjects[0] = object;
  weaponsManager.gridSnap = 0;

  object.savedRotation.copy(object.rotation);
  object.startQuaternion.copy(quaternion);

  const distance = object.position.distanceTo(position);
  if (distance < maxGrabDistance) {
    appManager.grabbedObjectOffsets[0] = 0;
  } else {
    appManager.grabbedObjectOffsets[0] = distance;
  }
};
const _ungrab = () => {
  // _snapRotation(appManager.grabbedObjects[0], rotationSnap);
  appManager.grabbedObjects[0] = null;
  editedObject = null
  _updateMenu();
};

const crosshairEl = document.querySelector('.crosshair');
const _updateWeapons = () => {  
  const transforms = rigManager.getRigTransforms();
  const now = Date.now();
  
  for (const wearable of wearables) {
    wearable.update(now);
  }

  const _handleHighlight = () => {
    if (!editedObject) {
      const width = 1;
      const length = 100;    
      localBox.setFromCenterAndSize(
        localVector.set(0, 0, -length/2 - 0.05),
        localVector2.set(width, width, length)
      );

      highlightMesh.visible = false;
      const oldHighlightedObject = highlightedObject;
      highlightedObject = null;

      if (!weaponsManager.getMenu() && !appManager.grabbedObjects[0]) {
        const objects = world.getObjects();
        for (const candidate of objects) {
          const {position, quaternion} = transforms[0];
          localMatrix.compose(candidate.position, candidate.quaternion, candidate.scale)
            .premultiply(
              localMatrix2.compose(position, quaternion, localVector2.set(1, 1, 1))
                .invert()
            )
            .decompose(localVector, localQuaternion, localVector2);
          if (localBox.containsPoint(localVector) && !appManager.grabbedObjects.includes(candidate)) {
            highlightMesh.position.copy(candidate.position);
            highlightMesh.quaternion.copy(candidate.quaternion);
            highlightMesh.visible = true;
            highlightedObject = candidate;
            break;
          }
        }
      } else if (weaponsManager.getMenu() === 4) {
        const itemEl = items4El.childNodes[selectedItemIndex];
        if (itemEl) {
          const instanceId = itemEl.getAttribute('instanceid');
          const object = world.getObjects().find(o => o.instanceId === instanceId);
          if (object) {
            highlightedObject = object;
            highlightMesh.position.copy(object.position);
            highlightMesh.quaternion.copy(object.quaternion);
            highlightMesh.visible = true;
          }
        }
      }
      if (highlightedObject !== oldHighlightedObject) {
        _updateMenu();
      }
    }
  };
  _handleHighlight();

  const _handlePhysicsHighlight = () => {
    highlightedPhysicsObject = null;

    if (weaponsManager.editMode) {
      const {position, quaternion} = transforms[0];
      let collision = geometryManager.geometryWorker.raycastPhysics(geometryManager.physics, position, quaternion);
      if (collision) {
        const objects = world.getObjects().concat(world.getStaticObjects());
        for (const object of objects) {
          if (object.getPhysicsIds) {
            const physicsIds = object.getPhysicsIds();
            if (physicsIds.includes(collision.objectId)) {
              highlightedPhysicsObject = object;
              highlightedPhysicsId = collision.objectId;
              break;
            }
          }
        }
      }
    }
  };
  _handlePhysicsHighlight();

  const _updatePhysicsHighlight = () => {
    highlightPhysicsMesh.visible = false;

    if (highlightedPhysicsObject) {
      if (highlightPhysicsMesh.physicsId !== highlightedPhysicsId) {
        const physics = physicsManager.getGeometry(highlightedPhysicsId);

        if (physics) {
          let geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(physics.positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(physics.indices, 1));
          geometry = geometry.toNonIndexed();
          geometry.computeVertexNormals();

          highlightPhysicsMesh.geometry.dispose();
          highlightPhysicsMesh.geometry = geometry;
          // highlightPhysicsMesh.scale.setScalar(1.05);
          highlightPhysicsMesh.physicsId = highlightedPhysicsId;
        }
      }

      const physicsTransform = physicsManager.getPhysicsTransform(highlightedPhysicsId);

      highlightPhysicsMesh.position.copy(physicsTransform.position);
      highlightPhysicsMesh.quaternion.copy(physicsTransform.quaternion);
      highlightPhysicsMesh.material.uniforms.uTime.value = (Date.now()%1500)/1500;
      highlightPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
      highlightPhysicsMesh.visible = true;
    }
  };
  _updatePhysicsHighlight();

  const _handleEdit = () => {
    editMesh.visible = false;
    
    buildTool.update();

    if (editedObject) {
      editMesh.position.copy(editedObject.position);
      editMesh.quaternion.copy(editedObject.quaternion);
      editMesh.visible = true;

      if (editedObject.isBuild) {
        editedObject.update(transforms[0], weaponsManager.getGridSnap());
      }
    }
  };
  _handleEdit();

  const _handlePush = () => {
    if (ioManager.keys.forward) {
      weaponsManager.menuPush(1);
    } else if (ioManager.keys.backward) {
      weaponsManager.menuPush(-1);
    }
  };
  _handlePush();

  const _handleGrab = () => {
    let changed = false;

    if (ioManager.currentWeaponGrabs[0] && !ioManager.lastWeaponGrabs[0]) {
      if (highlightedObject) {
        _grab(highlightedObject);
        highlightedObject = null;
        changed = true;
      }
    }
    if (!ioManager.currentWeaponGrabs[0] && ioManager.lastWeaponGrabs[0]) {
      appManager.grabbedObjects[0] = null;
      changed = true;
    }
    if (changed) {
      _updateMenu();
    }
  };
  _handleGrab();

  const _updateGrab = () => {
    moveMesh.visible = false;

    for (let i = 0; i < 2; i++) {
      const grabbedObject = appManager.grabbedObjects[i];
      if (grabbedObject) {
        const {handSnap} = updateGrabbedObject(grabbedObject, transforms[0], appManager.grabbedObjectOffsets[i], {
          collisionEnabled: true,
          handSnapEnabled: true,
          geometryManager,
          gridSnap: weaponsManager.getGridSnap(),
        });

        if (handSnap) {
          moveMesh.position.copy(grabbedObject.position);
          moveMesh.quaternion.copy(grabbedObject.quaternion);
          moveMesh.visible = true;
        }
      }
    }
  };
  _updateGrab();

  const _handleDeploy = () => {
    if (deployMesh.visible) {
      updateGrabbedObject(deployMesh, transforms[0], maxGrabDistance, {
        collisionEnabled: true,
        handSnapEnabled: false,
        geometryManager,
        gridSnap: weaponsManager.getGridSnap(),
      });

      localEuler.setFromQuaternion(transforms[0].quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      localEuler.y = Math.floor((localEuler.y + Math.PI/4) / (Math.PI/2)) * (Math.PI/2);
      localQuaternion.setFromEuler(localEuler);
      deployMesh.quaternion.premultiply(localQuaternion);

      deployMesh.material.uniforms.uTime.value = (Date.now()%1000)/1000;
      deployMesh.material.uniforms.uTime.needsUpdate = true;
    }
  };
  _handleDeploy();

  const _handleTeleport = () => {
    const _teleportTo = (position, quaternion) => {
      const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
      // console.log(position, quaternion, pose, avatar)
      /* localMatrix.fromArray(rigManager.localRig.model.matrix)
        .decompose(localVector2, localQuaternion2, localVector3); */

      if (renderer.xr.getSession()) {
        localMatrix.copy(xrCamera.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        dolly.matrix
          .premultiply(localMatrix.makeTranslation(position.x - localVector2.x, position.y - localVector2.y, position.z - localVector2.z))
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
          .premultiply(localMatrix.makeTranslation(0, cameraManager.getFullAvatarHeight(), 0))
          .decompose(dolly.position, dolly.quaternion, dolly.scale);
      } else {
        camera.matrix
          .premultiply(localMatrix.makeTranslation(position.x - camera.position.x, position.y - camera.position.y, position.z - camera.position.z))
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
          .premultiply(localMatrix.makeTranslation(0, cameraManager.getFullAvatarHeight(), 0))
          .decompose(camera.position, camera.quaternion, camera.scale);
      }

      physicsManager.velocity.set(0, 0, 0);
    };

    teleportMeshes[1].update(rigManager.localRig.inputs.leftGamepad.position, rigManager.localRig.inputs.leftGamepad.quaternion, ioManager.currentTeleport, (p, q) => geometryManager.geometryWorker.raycastPhysics(geometryManager.physics, p, q), (position, quaternion) => {
      _teleportTo(position, localQuaternion.set(0, 0, 0, 1));
    });
  };
  _handleTeleport();
  
  const _handleEditAnimation = () => {
    if (editMesh.visible) {
      editMesh.material.uniforms.uHighlight.value = 1-(Date.now()%1000)/1000;
      editMesh.material.uniforms.uHighlight.needsUpdate = true;
    }
  };
  _handleEditAnimation();

  const _handleUseAnimation = () => {
    const progressBars = document.querySelectorAll('.progress');
    if (useAnimation) {
      if (highlightedObject) {
        const now = Date.now();
        const f = (now - useAnimation.start) / (useAnimation.end - useAnimation.start);
        if (f < 1) {
          for (const progressBar of progressBars) {
            progressBar.classList.add('running');
          }
          const progressBarInners = Array.from(document.querySelectorAll('.progress > .bar'));
          for (const progressBarInner of progressBarInners) {
            progressBarInner.style.width = (f * 100) + '%';
          }
          
          highlightMesh.material.uniforms.uTime.value = -(1-f);
          highlightMesh.material.uniforms.uTime.needsUpdate = true;
        } else {
          editedObject = highlightedObject;
          weaponsManager.setMenu(0);
          useAnimation = null;
          
          highlightMesh.material.uniforms.uTime.value = 0;
          highlightMesh.material.uniforms.uTime.needsUpdate = true;
        }
      } else {
        useAnimation = null;
      }
      return;
    }
    
    for (const progressBar of progressBars) {
      progressBar.classList.remove('running');
    }
  };
  _handleUseAnimation();

  crosshairEl.classList.toggle('visible', ['camera', 'firstperson', 'thirdperson'].includes(cameraManager.getMode()) && !appManager.grabbedObjects[0]);
  
  popovers.update();
};

/* renderer.domElement.addEventListener('wheel', e => {
  if (document.pointerLockElement) {
    if (appManager.grabbedObjects[0]) {
      appManager.grabbedObjectOffsets[0] = Math.max(appManager.grabbedObjectOffsets[0] + e.deltaY * 0.01, 0);
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

let selectedItemIndex = 0;
const _selectItem = newSelectedItemIndex => {
  selectedItemIndex = newSelectedItemIndex;
  _updateMenu();
};
const _getItemsEl = () => document.getElementById('items-' + weaponsManager.getMenu());
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
};

let lastSelectedBuild = -1;
let lastCameraFocus = -1;
const _updateMenu = () => {
  const {menuOpen} = weaponsManager;

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
        const object = world.getObjects().find(o => o.instanceId === instanceId);
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

  locationLabel.innerText = `Overworld @${coord.x},${coord.z}`;
};

const _loadItemSpec1 = async u => {
  const p = new Promise((accept, reject) => {
    world.addEventListener('objectadd', async e => {
      accept(e.data);
    }, {once: true});
  });

  world.addObject(u, null, deployMesh.position, deployMesh.quaternion);

  const object = await p;
  editedObject = object;

  weaponsManager.setMenu(0);
  appManager.grabbedObjectOffsets[0] = maxGrabDistance;
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
  weaponsManager.setMenu(newSelectedTabIndex + 1);
};
const _selectTabDelta = offset => {
  let newSelectedTabIndex = (weaponsManager.getMenu() - 1) + offset;
  if (newSelectedTabIndex >= tabs.length) {
    newSelectedTabIndex = 0;
  } else if (newSelectedTabIndex < 0) {
    newSelectedTabIndex = tabs.length - 1;
  }
  _selectTab(newSelectedTabIndex);
};
const bindInterface = () => {
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
          world.removeObject(editedObject.instanceId);
        }

        editedObject = null;
        _updateMenu();
      } else {
        const hasMenu = !!weaponsManager.getMenu();
        if (hasMenu && !document.pointerLockElement) {
          cameraManager.requestPointerLock();
        } else if (!hasMenu && document.pointerLockElement) {
          document.exitPointerLock();
        }

        weaponsManager.setMenu(hasMenu ? 0 : 1);
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
  
  world.addEventListener('trackedobjectadd', async e => {
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
  world.addEventListener('trackedobjectremove', async e => {
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
        weaponsManager.enter();
        break;
      }
    }
  });
};

renderer.domElement.addEventListener('dragover', e => {
  e.preventDefault();
});
renderer.domElement.addEventListener('drop', async e => {
  e.preventDefault();
  
  const files = Array.from(e.dataTransfer.files);
  for (const file of files) {
    await _handleUpload(file);
  }
});

const wearables = [];
const _loadWearable = async () => {
  {
    const srcUrl = 'https://avaer.github.io/cat-in-hat/cat-in-hat.glb';
    let o = await new Promise((accept, reject) => {
      gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
    });
    // const {animations} = o;
    o = o.scene;
    o.scale.multiplyScalar(0.1);
    scene.add(o);

    const update = now => {
      const {localRig} = rigManager;
      const head = localRig.modelBones.Head;
      head.matrixWorld.decompose(o.position, o.quaternion, localVector);
    };
    wearables.push({
      update,
    });
  }
  {
    const srcUrl = 'https://avaer.github.io/sword/sword.glb';
    let o = await new Promise((accept, reject) => {
      gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
    });
    // const {animations} = o;
    o = o.scene;
    // o.scale.multiplyScalar(0.1);
    scene.add(o);

    const update = now => {
      const {localRig} = rigManager;
      const chest = localRig.modelBones.Chest;
      chest.matrixWorld.decompose(o.position, o.quaternion, localVector);
    };
    wearables.push({
      update,
    });
  }
};
_loadWearable();

const weaponsManager = {
  // weapons,
  // cubeMesh,
  /* buildMode: 'wall',
  buildMat: 'wood', */
  menuOpen: 0,
  // weaponWheel: false,
  gridSnap: 0,
  editMode: false,
  /* getWeapon() {
    return selectedWeapon;
  },
  setWeapon(newSelectedWeapon) {
    selectedWeapon = newSelectedWeapon;
  }, */
  /* setWeaponWheel(newOpen) {
    if (newOpen && !weaponsManager.weaponWheel) {
      wheel.style.display = 'flex';
      wheelDotCanvas.style.display = null;
      wheelDotCanvas.style.left = `${window.innerWidth/2}px`;
      wheelDotCanvas.style.top = `${window.innerHeight/2}px`;
      weaponsManager.weaponWheel = true;
    } else if (weaponsManager.weaponWheel && !newOpen) {
      wheel.style.display = 'none';
      wheelDotCanvas.style.display = 'none';
      weaponsManager.weaponWheel = false;
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
  bindInterface,
  bindUploadFileInput,
  getMenu() {
    return this.menuOpen;
  },
  setMenu(newOpen) {
    this.menuOpen = newOpen;
    if (newOpen) {
      _selectItem(0);
    } else {
      _updateMenu();
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
  menuUse() {
    _use();
  },
  menuUseHold() {
    _useHold();
  },
  menuUseRelease() {
    _useRelease();
  },
  menuDelete() {
    _delete();
  },
  menuClick() {
    _click();
  },
  canEquip() {
    return highlightMesh.visible;
  },
  menuEquip() {
    _equip();
  },
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
    return !!highlightedObject && !editedObject;
  },
  canUseHold() {
    return !!highlightedObject && !editedObject;
  },
  canRotate() {
    return !!appManager.grabbedObjects[0];
  },
  menuRotate(direction) {
    const object = appManager.grabbedObjects[0];
    object.savedRotation.y -= direction * rotationSnap;
  },
  canPush() {
    return !!appManager.grabbedObjects[0] || (editedObject && editedObject.isBuild);
  },
  menuPush(direction) {
    appManager.grabbedObjectOffsets[0] = Math.max(appManager.grabbedObjectOffsets[0] + direction * 0.1, 0);
  },
  menuDrop() {
    console.log('menu drop');
  },
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
  /* setWorld(newCoord, newHighlightedWorld) {
    lastCoord.copy(coord);
    coord.copy(newCoord);

    const lastHighlightedWorld = highlightedWorld;
    highlightedWorld = newHighlightedWorld;

    if (!coord.equals(lastCoord) || highlightedWorld !== lastHighlightedWorld) {
      _updateMenu();
    }
  }, */
  async destroyWorld() {
    if (highlightedWorld) {
      const {name} = highlightedWorld;
      const res = await fetch(`${worldsHost}/${name}`, {
        method: 'DELETE',
      });
      await res.blob();
      console.log('deleted', res.status);
    }
  },
  selectLoadout(index) {
    _selectLoadout(index);
  },
  canToggleAxis() {
    return !!appManager.grabbedObjects[0] || (editedObject && editedObject.isBuild);
  },
  toggleAxis() {
    console.log('toggle axis');
  },
  toggleEditMode() {
    this.editMode = !this.editMode;
  },
  /* canUpload() {
    return this.menuOpen === 1;
  }, */
  menuUpload() {
    _upload();
  },
  enter() {
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
  },
  canBuild() {
    return !!editedObject && editedObject.isBuild;
  },
  canStartBuild() {
    return !appManager.grabbedObjects[0] && !highlightedObject;
  },
  async startBuild(mode) {
    const object = await _loadItemSpec1('./assets/type/object.geo');
    object.setMode(mode);
    this.gridSnap = 1;
  },
  setBuildMode(mode) {
    editedObject.setMode(mode);
  },
  update() {
    _updateWeapons();
  },
};
export default weaponsManager;