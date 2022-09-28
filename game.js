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
import {downloadFile, snapPosition, getDropUrl, handleDropJsonItem, makeId} from './util.js';
import {maxGrabDistance, throwReleaseTime, throwAnimationDuration, walkSpeed, crouchSpeed, flySpeed} from './constants.js';
import metaversefileApi from './metaversefile-api.js';
import loadoutManager from './loadout-manager.js';
import * as sounds from './sounds.js';
import {playersManager} from './players-manager.js';
import {partyManager} from './party-manager.js';
import physicsManager from './physics-manager.js';
import raycastManager from './raycast-manager.js';
import zTargeting from './z-targeting.js';
import Avatar from './avatars/avatars.js';
import {avatarManager} from './avatar-manager.js';
import npcManager from './npc-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localVector8 = new THREE.Vector3();
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
const hand = 'right';

// const zeroVector = new THREE.Vector3(0, 0, 0);
// const oneVector = new THREE.Vector3(1, 1, 1);
// const cubicBezier = easing(0, 1, 0, 1);
// let redMesh = null;

const _getGrabAction = i => {
  const targetHand = i === 0 ? 'left' : 'right';
  const localPlayer = playersManager.getLocalPlayer();
  const grabAction = localPlayer.findAction(action => action.type === 'grab' && action.hand === targetHand);
  return grabAction;
};
const _getGrabbedObject = i => {
  const grabAction = _getGrabAction(i);
  const grabbedObjectInstanceId = grabAction?.instanceId;
  const result = grabbedObjectInstanceId ? metaversefileApi.getAppByInstanceId(grabbedObjectInstanceId) : null;
  return result;
};

const _unwearAppIfHasSitComponent = player => {
  const wearActions = player.getActionsByType('wear');
  for (const wearAction of wearActions) {
    const instanceId = wearAction.instanceId;
    const app = metaversefileApi.getAppByInstanceId(instanceId);
    const hasSitComponent = app.hasComponent('sit');
    if (hasSitComponent) {
      app.unwear();
    }
  }
};

const getPhysicalPosition = box => {
  return localVector7.set(
    (box.min.x + box.max.x) / 2,
    box.min.y,
    (box.min.z + box.max.z) / 2
  );
}

// returns whether we actually snapped
function updateGrabbedObject(
  o,
  grabMatrix,
  offsetMatrix,
  {collisionEnabled, handSnapEnabled, physx, gridSnap},
) {
  grabMatrix.decompose(localVector, localQuaternion, localVector2);
  offsetMatrix.decompose(localVector3, localQuaternion2, localVector4);
  const offset = localVector3.length();
  localMatrix
    .multiplyMatrices(grabMatrix, offsetMatrix)
    .decompose(localVector5, localQuaternion3, localVector6);

  let physicalOffset = null;
  const physicsObjects = o.getPhysicsObjects();

  // Compute physical local bounding box and it's position offset from app.position.
  // THREE.Box3.getCenter() has a console error, so I calculate manually.
  if(physicsObjects) {
    localBox.makeEmpty();
    for(const physicsObject of physicsObjects) {
      const geometry = physicsObject.physicsMesh.geometry;
      geometry.computeBoundingBox();
      localBox.union(geometry.boundingBox);
    }
    transformIndicators.bb = localBox;
    physicalOffset = getPhysicalPosition(localBox);
  }

  // raycast from localPlayer in direction of camera angle
  const collision = collisionEnabled && physicsScene.raycast(localVector, localQuaternion);

  // raycast from grabbed object down perpendicularly
  localQuaternion2.setFromAxisAngle(localVector2.set(1, 0, 0), -Math.PI * 0.5);
  const downCollision = collisionEnabled && physicsScene.raycast(localVector5, localQuaternion2);

  if (!!collision) {
    const {point} = collision;
    localVector6.fromArray(point);
  }

  if (!!downCollision) {
    const {point} = downCollision;
    localVector4.fromArray(point);
  }

  // if collision point is closer to the player than the grab offset and collisionDown point
  // is below collision point then place the object at collision point
  if (!!downCollision && localVector.distanceTo(localVector6) < offset && localVector4.y < localVector6.y) {
    localVector5.copy(localVector6).sub(physicalOffset);
  }

  // if grabbed object would go below another object then place object at downCollision point
  if (!!downCollision && localVector8.copy(localVector5).add(physicalOffset).y < localVector4.y) {
    localVector5.setY(localVector4.sub(physicalOffset).y);
  }

  o.position.copy(localVector5);

  const handSnap =
    !handSnapEnabled ||
    offset >= maxGrabDistance ||
    !!collision ||
    !!downCollision;
  if (handSnap) {
    snapPosition(o, gridSnap);
    o.quaternion.setFromEuler(o.savedRotation);
  } else {
    o.quaternion.copy(localQuaternion3);
  }

  o.updateMatrixWorld();

  return {
    handSnap,
  };
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
      new THREE.BoxGeometry(0.03, 0.2, 0.03)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.1, 0)),
      new THREE.BoxGeometry(0.03, 0.2, 0.03)
        .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1))))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.1)),
      new THREE.BoxGeometry(0.03, 0.2, 0.03)
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
    ]);// .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, 0));
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
const _makeHighlightPhysicsMesh = material => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
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

const mouseDomEquipmentHoverPhysicsMesh = _makeHighlightPhysicsMesh(hoverEquipmentMaterial);
mouseDomEquipmentHoverPhysicsMesh.visible = false;
sceneLowPriority.add(mouseDomEquipmentHoverPhysicsMesh);
let mouseDomEquipmentHoverObject = null;
let mouseDomEquipmentHoverPhysicsId = 0;

// let selectedLoadoutIndex = -1;

const _delete = () => {
  const grabbedObject = _getGrabbedObject(0);
  if (grabbedObject) {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.ungrab();

    world.appManager.removeTrackedApp(grabbedObject.instanceId);
  } else if (highlightedPhysicsObject) {
    world.appManager.removeTrackedApp(highlightedPhysicsObject.instanceId);
    highlightedPhysicsObject = null;
  } else if (mouseSelectedObject) {
    world.appManager.removeTrackedApp(mouseSelectedObject.instanceId);

    if (mouseHoverObject === mouseSelectedObject) {
      gameManager.setMouseHoverObject(null);
    }
    gameManager.setMouseSelectedObject(null);
  }
};
const _click = e => {
  if (_getGrabbedObject(0)) {
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.ungrab();
  } else {
    if (highlightedPhysicsObject) {
      _grab(highlightedPhysicsObject);
    }
  }
};
let lastUseIndex = 0;
const _getNextUseIndex = animationCombo => {
  if (Array.isArray(animationCombo)) {
    return (lastUseIndex++) % animationCombo.length;
  } else {
    return 0;
  }
};
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

const _grab = object => {
  const localPlayer = playersManager.getLocalPlayer();
  localPlayer.grab(object);

  gameManager.gridSnap = 0;
  gameManager.editMode = false;
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
    new THREE.CylinderGeometry(radius, radius, height),
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
    const {importModule} = metaversefileApi.useDefaultModules();
    const m = await importModule('button');
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
  const renderer = getRenderer();
  const localPlayer = playersManager.getLocalPlayer();

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
    const renderer = getRenderer();
    const _isWear = o => localPlayer.findAction(action => action.type === 'wear' && action.instanceId === o.instanceId);

    grabUseMesh.visible = false;
    if (!gameManager.editMode) {
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

    for (let i = 0; i < 2; i++) {
      const grabAction = _getGrabAction(i);
      const grabbedObject = _getGrabbedObject(i);
      if (grabbedObject && !_isWear(grabbedObject)) {
        let position = null;
        let quaternion = null;
        if (renderer.xr.getSession()) {
          const h = localPlayer[hand === 'left' ? 'leftHand' : 'rightHand'];
          position = h.position;
          quaternion = h.quaternion;
        } else {
          position = localVector2.copy(localPlayer.position);
          quaternion = camera.quaternion;
        }
        localMatrix.compose(position, quaternion, localVector.set(1, 1, 1));

        updateGrabbedObject(grabbedObject, localMatrix, localMatrix3.fromArray(grabAction.matrix), {
          collisionEnabled: true,
          handSnapEnabled: true,
          physx,
          gridSnap: gameManager.getGridSnap(),
        });

        grabUseMesh.setComponent('value', localPlayer.actionInterpolants.activate.getNormalized());
      }
    }
  };
  _updateGrab();

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
  };
  _handlePickUp();

  const _handlePhysicsHighlight = () => {
    highlightedPhysicsObject = null;

    if (gameManager.editMode) {
      const {position, quaternion} = renderer.xr.getSession() ? localPlayer.leftHand : camera;
      const collision = physicsScene.raycast(position, quaternion);
      if (collision) {
        const physicsId = collision.objectId;
        highlightedPhysicsObject = metaversefileApi.getAppByPhysicsId(physicsId);
        highlightedPhysicsId = physicsId;
      }
    }
  };
  _handlePhysicsHighlight();

  const _updatePhysicsHighlight = () => {
    highlightPhysicsMesh.visible = false;

    if (highlightedPhysicsObject) {
      const physicsId = highlightedPhysicsId;

      highlightedPhysicsObject.updateMatrixWorld();

      const physicsObject = metaversefileApi.getPhysicsObjectByPhysicsId(physicsId);
      if (physicsObject) {
        const {physicsMesh} = physicsObject;
        highlightPhysicsMesh.geometry = physicsMesh.geometry;
        highlightPhysicsMesh.matrixWorld.copy(physicsMesh.matrixWorld)
          .decompose(highlightPhysicsMesh.position, highlightPhysicsMesh.quaternion, highlightPhysicsMesh.scale);

        highlightPhysicsMesh.material.uniforms.uTime.value = (now % 1500) / 1500;
        highlightPhysicsMesh.material.uniforms.uTime.needsUpdate = true;
        highlightPhysicsMesh.material.uniforms.uColor.value.setHex(buildMaterial.uniforms.uColor.value.getHex());
        highlightPhysicsMesh.material.uniforms.uColor.needsUpdate = true;
        highlightPhysicsMesh.visible = true;
        highlightPhysicsMesh.updateMatrixWorld();
      }
    }
  };
  _updatePhysicsHighlight();

  const _updateMouseHighlight = () => {
    mouseHighlightPhysicsMesh.visible = false;

    if (gameManager.hoverEnabled) {
      const collision = raycastManager.getCollision();
      if (collision) {
        const {physicsObject/*, physicsId */} = collision;
        const {physicsMesh} = physicsObject;
        mouseHighlightPhysicsMesh.geometry = physicsMesh.geometry;
        localMatrix2.copy(physicsMesh.matrixWorld)
          // .premultiply(localMatrix3.copy(mouseHoverObject.matrixWorld).invert())
          .decompose(mouseHighlightPhysicsMesh.position, mouseHighlightPhysicsMesh.quaternion, mouseHighlightPhysicsMesh.scale);
        mouseHighlightPhysicsMesh.material.uniforms.uTime.value = (now % 1500) / 1500;
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
          mouseSelectPhysicsMesh.material.uniforms.uTime.value = (now % 1500) / 1500;
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
        mouseDomHoverPhysicsMesh.material.uniforms.uTime.value = (now % 1500) / 1500;
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
        mouseDomEquipmentHoverPhysicsMesh.material.uniforms.uTime.value = (now % 1500) / 1500;
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
        if (/* controlsManager.isPossessed() && */ cameraManager.getMode() !== 'firstperson') {
          localPlayer.matrixWorld.decompose(
            localVector,
            localQuaternion,
            localVector2,
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
          if ((!!localPlayer.avatar && /* controlsManager.isPossessed() && */ cameraManager.getMode()) === 'firstperson' /* || gameManager.dragging */) {
            localRay.set(
              camera.position,
              localVector.set(0, 0, -1)
                .applyQuaternion(camera.quaternion),
            );

            const distanceSpecs = apps.map(object => {
              const distance =
                object.position.distanceTo(camera.position) < 8
                  ? localRay.distanceToPoint(object.position)
                  : Infinity;
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
          localVector2,
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

        localPlayer.headTarget.set(-(raycastManager.lastMouseEvent.clientX / size.x - 0.5), (raycastManager.lastMouseEvent.clientY / size.y - 0.5), 1)
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
      !_getGrabbedObject(0);
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

const rotationSnap = Math.PI / 6;

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
      gameManager.editMode = false;
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
    this.gridSnap = 0;
    this.editMode = false;
    // this.dragging = false;
    // this.draggingRight = false;
    this.contextMenu = false;
    this.contextMenuObject = null;
    this.inventoryHack = false;
    this.closestObject = null;
    this.usableObject = null;
    this.hoverEnabled = false;
  }

  setGrabUseMesh(uiMode) {
    if (uiMode === 'normal') {
      this.addGrabUseMesh();
    } else {
      this.removeGrabUseMesh();
    }
  }

  removeGrabUseMesh() {
    sceneLowPriority.remove(grabUseMesh);
  }

  addGrabUseMesh() {
    sceneLowPriority.add(grabUseMesh);
  }

  getMenu() {
    return this.menuOpen;
  }

  setMenu(newOpen) {
    this.menuOpen = newOpen;
  }

  menuVertical(offset) {
  }

  menuHorizontal(offset) {
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
  }

  menuDelete() {
    _delete();
  }

  menuClick(e) {
    _click(e);
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

  menuPaste(s) {
  }

  inputFocused() {
    return !!document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.nodeName);
  }

  canRotate() {
    return !!_getGrabbedObject(0);
    // return !!world.appManager.grabbedObjects[0];
  }

  menuRotate(direction) {
    const object = _getGrabbedObject(0);
    object.savedRotation.y -= direction * rotationSnap;
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

  canPush() {
    return !!_getGrabbedObject(0);
    // return !!world.appManager.grabbedObjects[0] /*|| (editedObject && editedObject.isBuild)*/;
  }

  menuPush(direction) {
    const localPlayer = playersManager.getLocalPlayer();
    const grabAction = localPlayer.findAction(action => action.type === 'grab' && action.hand === 'left');
    if (grabAction) {
      const matrix = localMatrix.fromArray(grabAction.matrix);
      matrix
        .decompose(localVector, localQuaternion, localVector2);
      localVector.z += direction * 0.1;
      matrix
        .compose(localVector, localQuaternion, localVector2)
        .toArray(grabAction.matrix);
    } else {
      console.warn('trying to push with no grab object');
    }
  }

  menuGridSnap() {
    if (this.gridSnap === 0) {
      this.gridSnap = 32;
    } else if (this.gridSnap > 1) {
      this.gridSnap /= 2;
    } else {
      this.gridSnap = 0;
    }
    // gridSnapEl.innerText = this.gridSnap > 0 ? (this.gridSnap + '') : 'off';
  }

  getGridSnap() {
    if (this.gridSnap === 0) {
      return 0;
    } else {
      return 4 / this.gridSnap;
    }
  }

  menuVDown() {
    const localPlayer = playersManager.getLocalPlayer();
    if (_getGrabbedObject(0)) {
      this.menuGridSnap();
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
    const switched = partyManager.switchCharacter();
    if (switched) {
      sounds.playSoundName('menuReady');
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

  toggleCrouch() {
    const localPlayer = playersManager.getLocalPlayer();
    const crouchAction = localPlayer.getAction('crouch');
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
    const localPlayer = playersManager.getLocalPlayer();
    localVector.copy(localPlayer.position);
    if (localPlayer.avatar) {
      localVector.y -= localPlayer.avatar.height;
    }
    const u = await handleDropJsonItem(item);
    return await this.handleDropUrlToPlayer(u, index, localVector);
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
      position,
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

  async toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      if (!cameraManager.pointerLockElement) {
        await cameraManager.requestPointerLock();
      }
      if (this.mouseSelectedObject) {
        this.setMouseSelectedObject(null);
      }
      if (_getGrabbedObject(0)) {
        const localPlayer = playersManager.getLocalPlayer();
        localPlayer.ungrab();
      }
    }
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
        trigger,
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
    return localPlayer.avatar?.direction.z > 0.1; // If check > 0 will cause glitch when move left/right;
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

    const isCrouched = gameManager.isCrouched();
    const isSwimming = gameManager.isSwimming();
    const isFlying = gameManager.isFlying();
    const isRunning = ioManager.keys.shift && !isCrouched;
    const isMovingBackward = gameManager.isMovingBackward();
    if (isCrouched && !isMovingBackward) {
      speed = crouchSpeed;
    } else if (gameManager.isFlying()) {
      speed = flySpeed;
    } else {
      speed = walkSpeed;
    }
    const localPlayer = playersManager.getLocalPlayer();
    const sprintMultiplier = isRunning
      ? (localPlayer.hasAction('narutoRun') ? 20 : 3)
      : ((isSwimming && !isFlying) ? 5 - localPlayer.getAction('swim').swimDamping : 1);
    speed *= sprintMultiplier;

    const backwardMultiplier = isMovingBackward ? (isRunning ? 0.8 : 0.7) : 1;
    speed *= backwardMultiplier;

    return speed;
  }

  getClosestObject() {
    return gameManager.closestObject;
  }

  getUsableObject() {
    return gameManager.usableObject;
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
    const applySettingToApp = app => {
      const player = npcManager.getNpcByApp(app);
      if (player && player.avatar) {
        player.avatar.setQuality(quality);
      } else if (app.appType === 'vrm' && app.avatarRenderer) {
        app.avatarRenderer.setQuality(quality);
      }
    };

    // local player
    const localPlayer = playersManager.getLocalPlayer();
    localPlayer.avatar.setQuality(quality);

    // party members
    for (const app of localPlayer.appManager.apps) {
      applySettingToApp(app);
    }

    // remote players
    for (const remotePlayer in playersManager.getRemotePlayers()) {
      for (const app of remotePlayer.appManager.apps) {
        applySettingToApp(app);
      }
    }

    for (const app of world.appManager.apps) {
      applySettingToApp(app);
    }
  }

  playerDiorama = null;
  bindDioramaCanvas() {
    // await rendererWaitForLoad();

    this.playerDiorama = dioramaManager.createPlayerDiorama({
      // label: true,
      outline: true,
      grassBackground: true,
      // glyphBackground: true,
    });

    const playerSelectedFn = e => {
      const {
        player,
      } = e.data;

      const localPlayer = player;
      this.playerDiorama.setTarget(localPlayer);
      this.playerDiorama.setObjects([
        localPlayer.avatar.avatarRenderer.scene,
      ]);
    };
    playersManager.addEventListener('playerchange', playerSelectedFn);

    avatarManager.addEventListener('avatarchange', e => {
      const localPlayer = playersManager.getLocalPlayer();
      this.playerDiorama.setTarget(localPlayer);
      this.playerDiorama.setObjects([
        e.data.avatar.avatarRenderer.scene,
      ]);
    });
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
    downloadFile(blob, 'scene.scn');
    // console.log('got scene', scene);
  }

  update = _gameUpdate;
  pushAppUpdates = _pushAppUpdates;
  pushPlayerUpdates = _pushPlayerUpdates;
}
const gameManager = new GameManager();
export default gameManager;
