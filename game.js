/*
this file contains the main game logic tying together the managers.
general game logic goes here.
usually, code starts here and is migrated to an appropriate manager.
*/

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import physx from './physx.js';
import cameraManager from './camera-manager.js';
import ioManager from './io-manager.js';
import dioramaManager from './diorama.js';
import {world} from './world.js';
import {buildMaterial, highlightMaterial, selectMaterial, hoverMaterial, hoverEquipmentMaterial} from './shaders.js';
import {getRenderer, sceneLowPriority, camera} from './renderer.js';
import {downloadFile, snapPosition, getDropUrl, handleDropJsonItem, makeId, makeHighlightPhysicsMesh} from './util.js';
import {maxGrabDistance, throwReleaseTime, storageHost, minFov, maxFov, throwAnimationDuration} from './constants.js';
import metaversefileApi from './metaversefile-api.js';
import * as metaverseModules from './metaverse-modules.js';
import loadoutManager from './loadout-manager.js';
import * as sounds from './sounds.js';
import {playersManager} from './players-manager.js';
import physicsManager from './physics-manager.js';
import npcManager from './npc-manager.js';
import raycastManager from './raycast-manager.js';
import zTargeting from './z-targeting.js';
import Avatar from './avatars/avatars.js';
import grabManager from './grab-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
// const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();
// const localBox = new THREE.Box3();
const localRay = new THREE.Ray();

//

const physicsScene = physicsManager.getScene();
let isMouseUp = false;

// const zeroVector = new THREE.Vector3(0, 0, 0);
// const oneVector = new THREE.Vector3(1, 1, 1);
// const cubicBezier = easing(0, 1, 0, 1);
// let redMesh = null;

const _unwearAppIfHasSitComponent = (player) => {
  const wearActions = player.getActionsByType('wear');
  for (const wearAction of wearActions) {
    const instanceId = wearAction.instanceId;
    const app = metaversefileApi.getAppByInstanceId(instanceId);
    const hasSitComponent = app.hasComponent('sit');
    if (hasSitComponent) {
      app.unwear();
    }
  }
}

const _getCurrentGrabAnimation = () => {
  let currentAnimation = '';
  const localPlayer = playersManager.getLocalPlayer();

  const wearComponent = grabUseMesh.targetApp.getComponent('wear');
  if (wearComponent && wearComponent.grabAnimation === 'pick_up') {
    currentAnimation = wearComponent.grabAnimation;
  } else {
    const grabUseMeshPosition = grabUseMesh.position;
    let currentDistance = 100;

    // Forward
    {
      localVector.set(0, -0.5, -0.5).applyQuaternion(localPlayer.quaternion)
        .add(localPlayer.position);
      const distance = grabUseMeshPosition.distanceTo(localVector);
      currentDistance = distance;
      currentAnimation = 'grab_forward';
    }

    // Down
    {
      localVector.set(0, -1.2, -0.5).applyQuaternion(localPlayer.quaternion)
        .add(localPlayer.position);
      const distance = grabUseMeshPosition.distanceTo(localVector);
      if (distance < currentDistance) {
        currentDistance = distance;
        currentAnimation = 'grab_down';
      }
    }

    // Up
    {
      localVector.set(0, 0.0, -0.5).applyQuaternion(localPlayer.quaternion)
        .add(localPlayer.position);
      const distance = grabUseMeshPosition.distanceTo(localVector);
      if (distance < currentDistance) {
        currentDistance = distance;
        currentAnimation = 'grab_up';
      }
    }

    // Left
    {
      localVector.set(-0.8, -0.5, -0.5).applyQuaternion(localPlayer.quaternion)
        .add(localPlayer.position);
      const distance = grabUseMeshPosition.distanceTo(localVector);
      if (distance < currentDistance) {
        currentDistance = distance;
        currentAnimation = 'grab_left';
      }
    }
    
    // Right
    {
      localVector.set(0.8, -0.5, -0.5).applyQuaternion(localPlayer.quaternion)
        .add(localPlayer.position);
      const distance = grabUseMeshPosition.distanceTo(localVector);
      if (distance < currentDistance) {
        currentDistance = distance;
        currentAnimation = 'grab_right';
      }
    }
  }

  return currentAnimation;
};

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
          value: 0,
          needsUpdate: true,
        },
        uTime: {
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

/* const highlightMesh = _makeTargetMesh();
highlightMesh.visible = false;
sceneLowPriority.add(highlightMesh);
let highlightedObject = null; */

const mouseHighlightPhysicsMesh = makeHighlightPhysicsMesh(highlightMaterial);
mouseHighlightPhysicsMesh.visible = false;
sceneLowPriority.add(mouseHighlightPhysicsMesh);
let mouseHoverObject = null;
let mouseHoverPhysicsId = 0;
let mouseHoverPosition = null;

const mouseSelectPhysicsMesh = makeHighlightPhysicsMesh(selectMaterial);
mouseSelectPhysicsMesh.visible = false;
sceneLowPriority.add(mouseSelectPhysicsMesh);
let mouseSelectedObject = null;
let mouseSelectedPhysicsId = 0;
let mouseSelectedPosition = null;

const mouseDomHoverPhysicsMesh = makeHighlightPhysicsMesh(hoverMaterial);
mouseDomHoverPhysicsMesh.visible = false;
sceneLowPriority.add(mouseDomHoverPhysicsMesh);
let mouseDomHoverObject = null;
let mouseDomHoverPhysicsId = 0;

const mouseDomEquipmentHoverPhysicsMesh = makeHighlightPhysicsMesh(hoverEquipmentMaterial);
mouseDomEquipmentHoverPhysicsMesh.visible = false;
sceneLowPriority.add(mouseDomEquipmentHoverPhysicsMesh);
let mouseDomEquipmentHoverObject = null;
let mouseDomEquipmentHoverPhysicsId = 0;

// let selectedLoadoutIndex = -1;

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
    grabManager.grab(highlightedObject);
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
  }
};

let lastUseIndex = 0;
const _getNextUseIndex = animationCombo => {
  if (Array.isArray(animationCombo)) {
    return (lastUseIndex++) % animationCombo.length;
  } else {
    return 0;
  }
}
const _startUse = () => {
  const wearApp = loadoutManager.getSelectedApp();
  if (wearApp) {
    const useComponent = wearApp.getComponent('use');
    if (useComponent) {
      const localPlayer = playersManager.getLocalPlayer();
      const useAction = localPlayer.getAction('use');
      if (!useAction) {
        const {instanceId} = wearApp;
        const {boneAttachment, animation, animationCombo, animationEnvelope, ik, behavior, position, quaternion, scale} = useComponent;
        const index = _getNextUseIndex(animationCombo);
        const newUseAction = {
          type: 'use',
          instanceId,
          animation,
          animationCombo,
          animationEnvelope,
          ik,
          behavior,
          boneAttachment,
          index,
          position,
          quaternion,
          scale,
        };
        // console.log('new use action', newUseAction, useComponent, {animation, animationCombo, animationEnvelope});
        localPlayer.addAction(newUseAction);

        wearApp.use();
      }
    }
  }
};
const _endUse = () => {
  const localPlayer = playersManager.getLocalPlayer();
  const useAction = localPlayer.getAction('use');
  if (useAction) {
    const app = metaversefileApi.getAppByInstanceId(useAction.instanceId);
    app.dispatchEvent({
      type: 'use',
      use: false,
    });
    localPlayer.removeAction('use');
  }
};
const _mousedown = () => {
  _startUse();
};
const _mouseup = () => {
  isMouseUp = true;
};

const hitRadius = 1;
const hitHeight = 0.2;
const hitHalfHeight = hitHeight * 0.5;
const hitboxOffsetDistance = 0.3;
/* const cylinderMesh = (() => {
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
})(); */

let grabUseMesh = null;
const _gameInit = () => {
  grabUseMesh = metaversefileApi.createApp();
  (async () => {
    await metaverseModules.waitForLoad();
    const {modules} = metaversefileApi.useDefaultModules();
    const m = modules['button'];
    await grabUseMesh.addModule(m);
  })();
  grabUseMesh.targetApp = null;
  grabUseMesh.targetPhysicsId = -1;
  sceneLowPriority.add(grabUseMesh);
};
Promise.resolve()
  .then(_gameInit);

let lastActivated = false;
let lastThrowing = false;
const _gameUpdate = (timestamp, timeDiff) => {
  const now = timestamp;
  const localPlayer = playersManager.getLocalPlayer();

  const _updateGrabUseMesh = () => {
    const _isWear = o => localPlayer.findAction(action => action.type === 'wear' && action.instanceId === o.instanceId);

    grabUseMesh.visible = false;
    if (!grabManager.editMode) {
      const avatarHeight = localPlayer.avatar ? localPlayer.avatar.height : 0;
      localVector.copy(localPlayer.position)
        .add(localVector2.set(0, avatarHeight * (1 - localPlayer.getCrouchFactor()) * 0.5, -0.3).applyQuaternion(localPlayer.quaternion));
        
      const radius = 1;
      const halfHeight = 0.1;
      const collision = physicsScene.getCollisionObject(radius, halfHeight, localVector, localPlayer.quaternion);
      if (collision) {
        const physicsId = collision.objectId;
        const object = metaversefileApi.getAppByPhysicsId(physicsId);
        // console.log('got collision', physicsId, object);
        const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(physicsId);
        if (object && !_isWear(object) && physicsObject) {
          grabUseMesh.position.setFromMatrixPosition(physicsObject.physicsMesh.matrixWorld);
          grabUseMesh.quaternion.copy(camera.quaternion);
          grabUseMesh.updateMatrixWorld();
          grabUseMesh.targetApp = object;
          grabUseMesh.targetPhysicsId = physicsId;
          grabUseMesh.setComponent('value', localPlayer.actionInterpolants.activate.getNormalized());
          
          grabUseMesh.visible = true;
        }
      }
    }
  };
  _updateGrabUseMesh();

  zTargeting.update(timestamp, timeDiff);

  const _handlePickUp = () => {
    const pickUpAction = localPlayer.getAction('pickUp');
    if (pickUpAction) {
      const {instanceId} = pickUpAction;
      const app = metaversefileApi.getAppByInstanceId(instanceId);

      const _removeApp = () => {
        if (app.parent) {
          app.oldParent = app.parent;
          app.parent.remove(app);
        }
      };
      const _addApp = () => {
        app.oldParent.add(app);
        app.oldParent = null;
      };

      _removeApp();

      const animations = Avatar.getAnimations();
      const pickUpZeldaAnimation = animations.find(a => a.name === 'pick_up_zelda.fbx');
      const pickUpTime = localPlayer.actionInterpolants.pickUp.get();
      const pickUpTimeS = pickUpTime / 1000;
      if (pickUpTimeS < pickUpZeldaAnimation.duration) {
        // still playing the pick up animation
      } else {
        // idling

        _addApp();

        const handsAveragePosition = localVector.setFromMatrixPosition(localPlayer.avatar.modelBones.Left_wrist.matrixWorld)
          .add(localVector2.setFromMatrixPosition(localPlayer.avatar.modelBones.Right_wrist.matrixWorld))
          .divideScalar(2)
          .add(localVector2.set(0, 0.2, 0));
        app.position.copy(handsAveragePosition);
        localEuler.setFromQuaternion(localPlayer.quaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.y += Math.PI;
        localEuler.z = 0;
        app.quaternion.setFromEuler(localEuler);
        app.updateMatrixWorld();

        // console.log('got pickUpTime', pickUpTime, animations);
        // debugger;
      }
    } /* else {

    } */
    ioManager.setMovementEnabled(!pickUpAction);
  }
  _handlePickUp();

  const _updateMouseHighlight = () => {
    mouseHighlightPhysicsMesh.visible = false;

    if (gameManager.hoverEnabled) {
      const collision = raycastManager.getCollision();
      if (collision) {
        const {physicsObject/*, physicsId*/} = collision;
        const {physicsMesh} = physicsObject;
        mouseHighlightPhysicsMesh.geometry = physicsMesh.geometry;
        localMatrix2.copy(physicsMesh.matrixWorld)
          // .premultiply(localMatrix3.copy(mouseHoverObject.matrixWorld).invert())
          .decompose(mouseHighlightPhysicsMesh.position, mouseHighlightPhysicsMesh.quaternion, mouseHighlightPhysicsMesh.scale);
        mouseHighlightPhysicsMesh.material.uniforms.uTime.value = (now%1500)/1500;
        mouseHighlightPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
        mouseHighlightPhysicsMesh.updateMatrixWorld();

        mouseHighlightPhysicsMesh.visible = true;
        gameManager.setMouseHoverObject(collision.app, collision.physicsId, collision.point);
      }
    }
  };
  _updateMouseHighlight();
  
  const _updateMouseSelect = () => {
    mouseSelectPhysicsMesh.visible = false;

    const o = mouseSelectedObject;
    if (o) {
      const physicsId = mouseSelectedPhysicsId;

      const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(physicsId);
      if (physicsObject) {
        const {physicsMesh} = physicsObject;
        mouseSelectPhysicsMesh.geometry = physicsMesh.geometry;
        
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
          mouseSelectPhysicsMesh.visible = true;
          mouseSelectPhysicsMesh.updateMatrixWorld();

        }
        // update uniforms
        {
          mouseSelectPhysicsMesh.material.uniforms.uTime.value = (now%1500)/1500;
          mouseSelectPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
          
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

      const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(physicsId);
      if (physicsObject) {
        const {physicsMesh} = physicsObject;
        mouseDomHoverPhysicsMesh.geometry = physicsMesh.geometry;
        localMatrix2.copy(physicsMesh.matrixWorld)
          // .premultiply(localMatrix3.copy(mouseHoverObject.matrixWorld).invert())
          .decompose(mouseDomHoverPhysicsMesh.position, mouseDomHoverPhysicsMesh.quaternion, mouseDomHoverPhysicsMesh.scale);
        mouseDomHoverPhysicsMesh.material.uniforms.uTime.value = (now%1500)/1500;
        mouseDomHoverPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
        mouseDomHoverPhysicsMesh.visible = true;
        mouseDomHoverPhysicsMesh.updateMatrixWorld();
      }
    }
  };
  _updateMouseDomHover();
  
  const _updateMouseDomEquipmentHover = () => {
    mouseDomEquipmentHoverPhysicsMesh.visible = false;

    if (mouseDomEquipmentHoverObject && !mouseSelectedObject) {
      const physicsId = mouseDomEquipmentHoverPhysicsId;

      const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(physicsId);
      if (physicsObject) {
        const {physicsMesh} = physicsObject;
        mouseDomEquipmentHoverPhysicsMesh.geometry = physicsMesh.geometry;
        localMatrix2.copy(physicsMesh.matrixWorld)
          // .premultiply(localMatrix3.copy(mouseHoverObject.matrixWorld).invert())
          .decompose(mouseDomEquipmentHoverPhysicsMesh.position, mouseDomEquipmentHoverPhysicsMesh.quaternion, mouseDomEquipmentHoverPhysicsMesh.scale);
        mouseDomEquipmentHoverPhysicsMesh.material.uniforms.uTime.value = (now%1500)/1500;
        mouseDomEquipmentHoverPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
        mouseDomEquipmentHoverPhysicsMesh.visible = true;
        mouseDomEquipmentHoverPhysicsMesh.updateMatrixWorld();
      }
    }
  };
  _updateMouseDomEquipmentHover();

  const _handleClosestObject = () => {
    const apps = world.appManager.apps;
    if (apps.length > 0) {
      let closestObject;
      
      if (!gameManager.getMouseSelectedObject() && !gameManager.contextMenu) {
        if (/*controlsManager.isPossessed() &&*/ cameraManager.getMode() !== 'firstperson') {
          localPlayer.matrixWorld.decompose(
            localVector,
            localQuaternion,
            localVector2
          );
          const avatarHeight = localPlayer.avatar ? localPlayer.avatar.height : 0;
          localVector.y -= avatarHeight / 2;
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
          if ((!!localPlayer.avatar && /*controlsManager.isPossessed() &&*/ cameraManager.getMode()) === 'firstperson' /*|| gameManager.dragging*/) {
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
        localPlayer.matrixWorld.decompose(
          localVector,
          localQuaternion,
          localVector2
        );
        const avatarHeight = localPlayer.avatar ? localPlayer.avatar.height : 0;
        localVector.y -= avatarHeight / 2;
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
  
  /* const _updateDrags = () => {
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
  _updateDrags(); */
  
  const _updateActivate = () => {
    const v = localPlayer.actionInterpolants.activate.getNormalized();
    const currentActivated = v >= 1;
    
    if (currentActivated && !lastActivated) {
      if (grabUseMesh.targetApp) {
        grabUseMesh.targetApp.activate({
          physicsId: grabUseMesh.targetPhysicsId,
        });
      }
      localPlayer.removeAction('activate');
    }
    lastActivated = currentActivated;
  };
  _updateActivate();

  const _updateThirdPerson = () => {
    const firstPerson = cameraManager.getMode() === 'firstperson';
    if (firstPerson !== lastFirstPerson) {
      _setFirstPersonAction(firstPerson);
      lastFirstPerson = firstPerson;
    }
  };
  _updateThirdPerson();

  const _updateThrow = () => {
    const useAction = localPlayer.getAction('use');
    if (useAction && useAction.behavior === 'throw') {
      const v = localPlayer.actionInterpolants.use.get() / throwReleaseTime;
      const currentThrowing = v >= 1;

      if (currentThrowing && !lastThrowing) {
        // console.log('got throw action', useAction, localPlayer);

        const app = metaversefileApi.getAppByInstanceId(useAction.instanceId);
        localPlayer.unwear(app, {
          dropStartPosition: localVector.copy(localPlayer.position)
            .add(localVector2.set(0, 0.5, -1).applyQuaternion(localPlayer.quaternion)),
          dropDirection: localVector2.set(0, 0.2, -1).normalize().applyQuaternion(localPlayer.quaternion),
        });
      }
      lastThrowing = currentThrowing;
    }
  };
  _updateThrow();

  const _updateBehavior = () => {
    const useAction = localPlayer.getAction('use');
    if (useAction) {
      const _handleSword = () => {
        localVector.copy(localPlayer.position)
          .add(localVector2.set(0, 0, -hitboxOffsetDistance).applyQuaternion(localPlayer.quaternion));

        localPlayer.characterHitter.attemptHit({
          type: 'sword',
          args: {
            hitRadius,
            hitHalfHeight,
            position: localVector,
            quaternion: localPlayer.quaternion,
          },
          timestamp,
        });
      };

      switch (useAction.behavior) {
        case 'sword': {
          _handleSword();
          break;
        }
        default: {
          break;
        }
      }
    }
  };
  _updateBehavior();
  
  const _updateLook = () => {
    if (localPlayer.avatar) {
      if (mouseSelectedObject && mouseSelectedPosition) {
        // console.log('got', mouseSelectedObject.position.toArray().join(','));
        localPlayer.headTarget.copy(mouseSelectedPosition);
        localPlayer.headTargetInverted = true;
        localPlayer.headTargetEnabled = true;
      } else if (!cameraManager.pointerLockElement && !cameraManager.target && raycastManager.lastMouseEvent) {
        const renderer = getRenderer();
        const size = renderer.getSize(localVector);
        
        localPlayer.headTarget.set(-(raycastManager.lastMouseEvent.clientX/size.x-0.5), (raycastManager.lastMouseEvent.clientY/size.y-0.5), 1)
          .unproject(camera);
        localPlayer.headTargetInverted = false;
        localPlayer.headTargetEnabled = true;
      } else if (zTargeting?.focusTargetReticle?.position) {
        localPlayer.setTarget(zTargeting.focusTargetReticle.position);
      } else {
        localPlayer.setTarget(null);
      }
    }
  };
  _updateLook();

  const crosshairEl = document.getElementById('crosshair');
  if (crosshairEl) {
    const visible = !!cameraManager.pointerLockElement &&
      (['camera', 'firstperson', 'thirdperson'].includes(cameraManager.getMode()) || localPlayer.hasAction('aim')) &&
      !grabManager.getGrabbedObject(0);
    crosshairEl.style.visibility = visible ? null : 'hidden';
  }

  const _updateUse = () => {
    const useAction = localPlayer.getAction('use');
    if (useAction) {
      if (useAction.animation === 'pickUpThrow') {
        const useTime = localPlayer.actionInterpolants.use.get();
        if (useTime / 1000 >= throwAnimationDuration) {
          _endUse();
        }
      } else if (isMouseUp) {
        _endUse();
      }

    }
    isMouseUp = false;
  };
  _updateUse();
};
const _pushAppUpdates = () => {
  world.appManager.pushAppUpdates();
  
  for (const remotePlayer in playersManager.getRemotePlayers()) {
    remotePlayer.appManager.pushAppUpdates();
  }
};
const _pushPlayerUpdates = () => {
  const localPlayer = playersManager.getLocalPlayer();
  localPlayer.pushPlayerUpdates();
};

/* const metaverseUi = {
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
}; */

const _bindPointerLock = () => {
  cameraManager.addEventListener('pointerlockchange', e => {
    const {pointerLockElement} = e.data;

    gameManager.setMouseHoverObject(null);
    if (!pointerLockElement) {
      grabManager.editMode = false;
    }
  });
};
_bindPointerLock();

const _setFirstPersonAction = firstPerson => {
  const localPlayer = playersManager.getLocalPlayer();
  if (firstPerson) {
    if (!localPlayer.hasAction('firstperson')) {
      const aimAction = {
        type: 'firstperson',
      };
      localPlayer.addAction(aimAction);
    }
  } else {
    localPlayer.removeAction('firstperson');
  }
};
let lastFirstPerson = cameraManager.getMode() === 'firstperson';
_setFirstPersonAction(lastFirstPerson);
/* cameraManager.addEventListener('modechange', e => {
  // XXX need to do this in the frame loop instead
  const {mode} = e.data;
  const firstPerson = mode === 'firstperson';
  _setFirstPersonAction(firstPerson);
}); */

class GameManager extends EventTarget {
  constructor() {
    super();

    this.menuOpen = 0;
    // this.dragging = false;
    // this.draggingRight = false;
    this.contextMenu = false;
    this.contextMenuObject = null;
    this.inventoryHack = false;
    this.closestObject = null;
    this.usableObject = null;
    this.hoverEnabled = false;
  }
  getMenu() {
    return this.menuOpen;
  }
  setMenu(newOpen) {
    this.menuOpen = newOpen;
    if (newOpen) {
      _selectItem(0);
    }
  }
  menuVertical(offset) {
    if (this.menuOpen) {
      _selectItemDelta(offset);
    }
  }
  menuHorizontal(offset) {
    if (this.menuOpen) {
      _selectTabDelta(offset);
    }
  }
  setContextMenu(contextMenu) {
    this.contextMenu = contextMenu;
  }
  getContextMenuObject() {
    return this.contextMenuObject;
  }
  setContextMenuObject(contextMenuObject) {
    this.contextMenuObject = contextMenuObject;
  }
  menuUse() {
    _use();
  }
  menuMouseDown() {
    _mousedown();
  }
  menuMouseUp() {
    _mouseup();
  }
  menuAim() {
    const localPlayer = playersManager.getLocalPlayer();
    if (!localPlayer.hasAction('aim')) {
      const wearApp = loadoutManager.getSelectedApp();
      const wearAimApp = (() => {
        if (wearApp) {
          const aimComponent = wearApp.getComponent('aim');
          if (aimComponent) {
            return wearApp;
          }
        }
        return null;
      })();
      const wearAimComponent = wearAimApp?.getComponent('aim');

      const {instanceId} = wearAimApp ?? {};
      const {appAnimation, playerAnimation, boneAttachment, position, quaternion, scale} = wearAimComponent ?? {};
      const aimAction = {
        type: 'aim',
        instanceId,
        appAnimation,
        playerAnimation,
        boneAttachment,
        position,
        quaternion,
        scale,
      };
      localPlayer.addAction(aimAction);
    }
  }
  menuUnaim() {
    const localPlayer = playersManager.getLocalPlayer();
    const aimAction = localPlayer.getAction('aim');
    if (aimAction) {
      localPlayer.removeAction('aim');
    }
  }
  menuMiddleDown() {
    zTargeting.handleDown();

    // zTargetCenter
    // zTargetObject
    // zTargetEnemy
    // zTargetCancel
  }
  menuMiddle() {
    /* const {movementX, movementY} = e;
    if (Math.abs(movementX) < 100 && Math.abs(movementY) < 100) { // hack around a Chrome bug
      camera.position.add(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));
  
      camera.rotation.y -= movementX * Math.PI * 2 * 0.0005;
      camera.rotation.x -= movementY * Math.PI * 2 * 0.0005;
      camera.rotation.x = Math.min(Math.max(camera.rotation.x, -Math.PI / 2), Math.PI / 2);
      camera.quaternion.setFromEuler(camera.rotation);

      camera.position.sub(localVector.copy(cameraManager.getCameraOffset()).applyQuaternion(camera.quaternion));

      camera.updateMatrixWorld();
    } */
  }
  menuMiddleUp() {
    zTargeting.handleUp();

    // this.dragging = false;
    
    /* world.appManager.dispatchEvent(new MessageEvent('dragchange', {
      data: {
        dragging: this.dragging,
      },
    })); */
  }
  menuMiddleToggle() {
    zTargeting.toggle();
  }
  menuDragdownRight(e) {
    // this.draggingRight = true;
  }
  menuDragRight(e) {
    // nothing
  }
  menuDragupRight() {
    // this.draggingRight = false;
  }
  menuKey(c) {
    menuMesh.key(c);
  }
  menuSelectAll() {
    menuMesh.selectAll();
  }
  menuPaste(s) {
    menuMesh.paste(s);
  }
  inputFocused() {
    return !!document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.nodeName);
  }
  dropSelectedApp() {
    const app = loadoutManager.getSelectedApp();
    if (app) {
      const localPlayer = playersManager.getLocalPlayer();
      localPlayer.unwear(app, {
        /* dropStartPosition: localVector.copy(localPlayer.position)
          .add(localVector2.set(0, 0.5, -1).applyQuaternion(localPlayer.quaternion)),
        dropDirection: zeroVector, */
      });
      _endUse();
    }
  }
  deleteSelectedApp() {
    if (this.selectedIndex !== -1) {
      const app = loadoutManager.getSelectedApp();
      if (app) {
        const localPlayer = playersManager.getLocalPlayer();
        localPlayer.unwear(app, {
          destroy: true,
        });
      }
    }
  }
  menuVDown() {
    const localPlayer = playersManager.getLocalPlayer();
    if (grabManager.getGrabbedObject(0)) {
      grabManager.menuGridSnap();
    } else {
      localPlayer.removeAction('dance');

      const newAction = {
        type: 'dance',
        animation: 'dansu',
      };
      localPlayer.addAction(newAction);
    }
  }
  menuVUp() {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.removeAction('dance');
  }

  menuBDown() {
    const localPlayer = playersManager.getLocalPlayer();
    const sssAction = localPlayer.getAction('sss');
    if (!sssAction) {
      const newSssAction = {
        type: 'sss',
      };
      localPlayer.addAction(newSssAction);

      sounds.playSoundName('limitBreak');

      localPlayer.removeAction('dance');
      const newDanceAction = {
        type: 'dance',
        animation: 'powerup',
        // time: 0,
      };
      localPlayer.addAction(newDanceAction);
    } else {
      localPlayer.removeAction('sss');
      localPlayer.removeAction('dance');
    }

    /* if (e.ctrlKey) {
      universe.reload();
    } */
  }
  menuBUp() {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.removeAction('dance');
    
    // physicsManager.setThrowState(null);
  }

  menuDoubleTap() {
    if (!this.isCrouched()) {
      const localPlayer = playersManager.getLocalPlayer();
      const narutoRunAction = localPlayer.getAction('narutoRun');
      if (!narutoRunAction) {
        const newNarutoRunAction = {
          type: 'narutoRun',
          // time: 0,
        };
        localPlayer.addAction(newNarutoRunAction);
      }
    }
  }
  menuUnDoubleTap() {
    const localPlayer = playersManager.getLocalPlayer();
    const narutoRunAction = localPlayer.getAction('narutoRun');
    if (narutoRunAction) {
      localPlayer.removeAction('narutoRun');
    }
  }
  menuSwitchCharacter() {
    sounds.playSoundName('menuReady');

    const npc = npcManager.npcs[0];
    if (npc) {
      // console.log('check npc', npc);
      
      const localPlayer = playersManager.getLocalPlayer();
      localPlayer.isLocalPlayer = false;
      localPlayer.isNpcPlayer = true;

      npc.isLocalPlayer = true;
      npc.isNpcPlayer = false;

      const npcIndex = npcManager.npcs.indexOf(npc);
      npcManager.npcs[npcIndex] = localPlayer;

      playersManager.setLocalPlayer(npc);
    }
  }
  isFlying() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.hasAction('fly');
  }
  toggleFly() {
    const localPlayer = playersManager.getLocalPlayer();
    const flyAction = localPlayer.getAction('fly');
    if (flyAction) {
      localPlayer.removeAction('fly');
      if (!localPlayer.characterPhysics.lastGrounded) {
        localPlayer.setControlAction({type: 'fallLoop'});
      }
    } else {
      const flyAction = {
        type: 'fly',
        time: 0,
      };

      _unwearAppIfHasSitComponent(localPlayer);

      localPlayer.setControlAction(flyAction);
    }
  }
  isCrouched() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.hasAction('crouch');
  }
  isSwimming() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.hasAction('swim');
  }
  isFlying() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.hasAction('fly');
  }
  toggleCrouch() {
    const localPlayer = playersManager.getLocalPlayer();
    let crouchAction = localPlayer.getAction('crouch');
    if (crouchAction) {
      localPlayer.removeAction('crouch');
    } else {
      const crouchAction = {
        type: 'crouch',
      };
      localPlayer.addAction(crouchAction);
    }
  }
  async handleDropJsonItemToPlayer(item, index) {
    const u = await handleDropJsonItem(item);
    return await this.handleDropUrlToPlayer(u, index);
  }
  async handleDropJsonToPlayer(j, index) {
    const localPlayer = playersManager.getLocalPlayer();
    localVector.copy(localPlayer.position);
    if (localPlayer.avatar) {
      localVector.y -= localPlayer.avatar.height;
    }
    const u = getDropUrl(j);
    return await this.handleDropUrlToPlayer(u, index, localVector);
  }
  async handleDropUrlToPlayer(u, index, position) {
    const app = await metaversefileApi.createAppAsync({
      start_url: u,
      position: position
    });
    app.instanceId = makeId(5);
    world.appManager.importApp(app);
    app.activate();
    // XXX set to index
  }
  selectLoadout(index) {
    loadoutManager.setSelectedIndex(index);
  }
  canToggleAxis() {
    return false; // !!world.appManager.grabbedObjects[0]; // || (editedObject && editedObject.isBuild);
  }
  toggleAxis() {
    console.log('toggle axis');
  }
  isJumping() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.hasAction('jump');
  }
  isDoubleJumping() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.hasAction('doubleJump');
  }
  ensureJump(trigger) {
    const localPlayer = playersManager.getLocalPlayer();

    _unwearAppIfHasSitComponent(localPlayer);

    if (!localPlayer.hasAction('jump') && !localPlayer.hasAction('fly') && !localPlayer.hasAction('fallLoop') && !localPlayer.hasAction('swim')) {
      const newJumpAction = {
        type: 'jump',
        trigger:trigger,
        startPositionY: localPlayer.characterPhysics.characterController.position.y,
        // time: 0,
      };
      localPlayer.setControlAction(newJumpAction);
    }
  }
  jump(trigger) {
    // add jump action
    this.ensureJump(trigger);

    // update velocity
    // const localPlayer = playersManager.getLocalPlayer();
    // localPlayer.characterPhysics.velocity.y += 6; // currently using aesthetic jump movement
    
    // play sound
    // soundManager.play('jump');

  }
  doubleJump() {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.addAction({
      type: 'doubleJump',
      startPositionY: localPlayer.characterPhysics.characterController.position.y,
    });
  }
  isMovingBackward() {
    const localPlayer = playersManager.getLocalPlayer();
    // return ioManager.keysDirection.z > 0 && this.isAiming();
    return localPlayer.avatar.direction.z > 0.1; // If check > 0 will cause glitch when move left/right;
    /*
      return localPlayer.avatar.direction.z > 0.1;
      // If check > 0 will cause glitch when move left/right.
      // Has a little lag after release backward key.
    */
  }
  isAiming() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.hasAction('aim');
  }
  isSitting() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.hasAction('sit');
  }
  isGrounded() {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.characterPhysics.lastGrounded;
  }
  getMouseHoverObject() {
    return mouseHoverObject;
  }
  getMouseHoverPhysicsId() {
    return mouseHoverPhysicsId;
  }
  getMouseHoverPosition() {
    return mouseHoverPosition;
  }
  setHoverEnabled(hoverEnabled) {
    this.hoverEnabled = hoverEnabled;
  }
  setMouseHoverObject(o, physicsId, position) { // XXX must be triggered
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
  }
  getMouseSelectedObject() {
    return mouseSelectedObject;
  }
  getMouseSelectedPhysicsId() {
    return mouseSelectedPhysicsId;
  }
  getMouseSelectedPosition() {
    return mouseSelectedPosition;
  }
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
  }
  getMouseDomHoverObject() {
    return mouseDomHoverObject;
  }
  setMouseDomHoverObject(o, physicsId) {
    mouseDomHoverObject = o;
    mouseDomHoverPhysicsId = physicsId;
  }
  getMouseDomEquipmentHoverObject(o, physicsId) {
    return mouseDomEquipmentHoverObject;
  }
  setMouseDomEquipmentHoverObject(o, physicsId) {
    mouseDomEquipmentHoverObject = o;
    mouseDomEquipmentHoverPhysicsId = physicsId;
  }
  getSpeed() {
    let speed = 0;
    
    const walkSpeed = 0.075;
    const flySpeed = walkSpeed * 2;
    const defaultCrouchSpeed = walkSpeed * 0.7;
    const isCrouched = gameManager.isCrouched();
    const isSwimming = gameManager.isSwimming();
    const isFlying = gameManager.isFlying();
    const isMovingBackward = gameManager.isMovingBackward();
    if (isCrouched && !isMovingBackward) {
      speed = defaultCrouchSpeed;
    } else if (gameManager.isFlying()) {
      speed = flySpeed;
    } else {
      speed = walkSpeed;
    }
    const localPlayer = playersManager.getLocalPlayer();
    const sprintMultiplier = (ioManager.keys.shift && !isCrouched) ?
      (localPlayer.hasAction('narutoRun') ? 20 : 3)
    :
    ((isSwimming && !isFlying) ? 5 - localPlayer.getAction('swim').swimDamping : 1);
    speed *= sprintMultiplier;
    
    const backwardMultiplier = isMovingBackward ? 0.7 : 1;
    speed *= backwardMultiplier;
    
    return speed;
  }
  getClosestObject() {
    return gameManager.closestObject;
  }
  getUsableObject() {
    return gameManager.usableObject;
  }
  getDragRightSpec() {
    return dragRightSpec;
  }
  menuActivateDown() {
    if (grabUseMesh.visible) {
      const localPlayer = playersManager.getLocalPlayer();
      const activateAction = localPlayer.getAction('activate');
      if (!activateAction) {
        const animationName = _getCurrentGrabAnimation();
        const newActivateAction = {
          type: 'activate',
          animationName,
        };
        localPlayer.addAction(newActivateAction);
      }
    }
  }
  menuActivateUp() {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.removeAction('activate');
  }
  setAvatarQuality(quality) {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.avatar.setQuality(quality);
  }
  playerDiorama = null;
  bindDioramaCanvas() {
    // await rendererWaitForLoad();

    const localPlayer = playersManager.getLocalPlayer();
    this.playerDiorama = dioramaManager.createPlayerDiorama({
      target: localPlayer,
      // label: true,
      outline: true,
      grassBackground: true,
      // glyphBackground: true,
    });
    localPlayer.addEventListener('avatarchange', e => {
      const localPlayer = playersManager.getLocalPlayer();
      this.playerDiorama.setTarget(localPlayer);
      this.playerDiorama.setObjects([
        e.avatar.model,
      ]);
    })
  }
  async setVoicePack(voicePack) {
    const localPlayer = metaversefileApi.useLocalPlayer();
    return await localPlayer.setVoicePack(voicePack);
  }
  setVoiceEndpoint(voiceId) {
    const localPlayer = playersManager.getLocalPlayer();
    return localPlayer.setVoiceEndpoint(voiceId);
  }
  saveScene() {
    const scene = world.appManager.exportJSON();
    const s = JSON.stringify(scene, null, 2);
    const blob = new Blob([s], {
      type: 'application/json',
    });
    downloadFile(blob, 'scene.json');
    // console.log('got scene', scene);
  }
  update = _gameUpdate;
  pushAppUpdates = _pushAppUpdates;
  pushPlayerUpdates = _pushPlayerUpdates;
}
const gameManager = new GameManager();
export default gameManager;