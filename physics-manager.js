/*
physics manager is the interface to the physics engine.
it contains code for character capsules and world simulation.
*/

import * as THREE from 'three';
import uiManager from './ui-manager.js';
import {getRenderer, camera, dolly} from './renderer.js';
import physx from './physx.js';
import cameraManager from './camera-manager.js';
import ioManager from './io-manager.js';
import {getPlayerCrouchFactor} from './character-controller.js';
import metaversefileApi from './metaversefile-api.js';
import {getNextPhysicsId, convertMeshToPhysicsMesh} from './util.js';
import {getVelocityDampingFactor} from './util.js';
import {groundFriction} from './constants.js';
import {CapsuleGeometry} from './CapsuleGeometry.js';

// const leftQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0));

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localObject = new THREE.Object3D();

const zeroVector = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);

const physicsManager = new EventTarget();

const velocity = new THREE.Vector3();
physicsManager.velocity = velocity;

const direction = new THREE.Vector3(0, 0, -1);
physicsManager.direction = direction;

// used for hookshot-style navigation
const offset = new THREE.Vector3();
physicsManager.offset = offset;

/* let jumpState = false;
let jumpTime = -1;
const getJumpState = () => jumpState;
physicsManager.getJumpState = getJumpState;
const getJumpTime = () => jumpTime;
physicsManager.getJumpTime = getJumpTime;
const jump = () => {
  jumpState = true;
  jumpTime = 0;
  sitState = false;
  physicsManager.velocity.y += 5;
};
physicsManager.jump = jump;

let flyState = false;
let flyTime = -1;
const getFlyState = () => flyState;
physicsManager.getFlyState = getFlyState;
const setFlyState = newFlyState => {
  const now = Date.now();
  flyState = newFlyState;
  if (newFlyState) {
    flyTime = 0;
    if (!jumpState) {
      jump();
    }
  } else {
    flyTime = -1;
    jumpTime = 0;
  }
  glideState = false;
};
physicsManager.setFlyState = setFlyState;
const getFlyTime = () => flyTime;
physicsManager.getFlyTime = getFlyTime;

let glideState = false;
const getGlideState = () => glideState;
physicsManager.getGlideState = getGlideState;
const setGlide = newGlideState => {
  glideState = newGlideState;
};
physicsManager.setGlide = setGlide;

let sitState = false;
const getSitState = () => sitState;
physicsManager.getSitState = getSitState;
const setSitState = newSitState => {
  sitState = newSitState;
};
physicsManager.setSitState = setSitState; */

/* let damping;
const setDamping = (newDamping = 0.7) => {
  damping = newDamping;
};
setDamping();
physicsManager.setDamping = setDamping; */

let sitTarget = null;
const getSitTarget = () => sitTarget;
physicsManager.getSitTarget = getSitTarget;
const setSitTarget = newSitTarget => {
  sitTarget = newSitTarget;
};
physicsManager.setSitTarget = setSitTarget;
let _sitOffset = new THREE.Vector3();
const setSitOffset = newSitOffset => {
  _sitOffset.fromArray(newSitOffset);
};
physicsManager.setSitOffset = setSitOffset;

let sitController = null;
const getSitController = () => sitController;
physicsManager.getSitController = getSitController;
const setSitController = newSitController => {
  sitController = newSitController;
};
physicsManager.setSitController = setSitController;

/* let useTime = -1;
const getUseTime = () => useTime;
physicsManager.getUseTime = getUseTime;
const startUse = () => {
  useTime = 0;
};
physicsManager.startUse = startUse;
const stopUse = () => {
  useTime = -1;
};
physicsManager.stopUse = stopUse;

let danceState = null;
let danceTime = 0;
const getDanceState = () => danceState;
physicsManager.getDanceState = getDanceState;
const getDanceTime = () => danceTime;
physicsManager.getDanceTime = getDanceTime;
const setDanceState = newDanceState => {
  danceState = newDanceState;
  if (danceState) {
    danceTime = 0;
  }
};
physicsManager.setDanceState = setDanceState;

let throwState = null;
let throwTime = 0;
const getThrowState = () => throwState;
physicsManager.getThrowState = getThrowState;
const getThrowTime = () => throwTime;
physicsManager.getThrowTime = getThrowTime;
const setThrowState = newThrowState => {
  throwState = newThrowState;
  if (throwState) {
    throwTime = 0;
  }
};
physicsManager.setThrowState = setThrowState;

let crouchState = false;
let crouchTime = 1000;
const getCrouchState = () => crouchState;
physicsManager.getCrouchState = getCrouchState;
const getCrouchTime = () => crouchTime;
physicsManager.getCrouchTime = getCrouchTime;
physicsManager.setCrouchState = newCrouchState => {
  crouchState = newCrouchState;
  crouchTime = 0;
}; */

const physicsObjects = {};
const physicsUpdates = [];
const _makePhysicsObject = (physicsId/*, position, quaternion, scale*/) => {
  const physicsObject = new THREE.Object3D();
  // physicsObject.position.copy(position);
  // physicsObject.quaternion.copy(quaternion);
  // physicsObject.scale.copy(scale);
  // physicsObject.updateMatrixWorld();
  physicsObject.physicsId = physicsId;
  physicsObject.error = new Error().stack;
  // physicsObject.needsUpdate = false;
  return physicsObject;
};
const _extractPhysicsGeometryForId = physicsId => {
  const physicsGeometry = physicsManager.getGeometryForPhysicsId(physicsId);
  let geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(physicsGeometry.positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(physicsGeometry.indices, 1));
  geometry = geometry.toNonIndexed();
  geometry.computeVertexNormals();
  return geometry;
};

physicsManager.addSphereGeometry = (position, quaternion, radius, physicsMaterial, ccdEnabled) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addSphereGeometryPhysics(physx.physics, position, quaternion, radius, physicsId, physicsMaterial, ccdEnabled);
  
  const physicsObject = _makePhysicsObject(physicsId);
  const physicsMesh = new THREE.Mesh(
    new THREE.SphereGeometry( radius, 32, 16 )
  );
  physicsMesh.visible = false;
  // physicsMesh.position.copy(position);
  // physicsMesh.quaternion.copy(quaternion);
  // physicsMesh.scale.copy(size);
  //physicsObject.position.copy(position);
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  physicsObjects[physicsId] = physicsObject;
  physicsObject.velocity = new THREE.Vector3(0,0,0);
  //physicsManager.disablePhysicsObject(physicsObject);
  return physicsObject;
};

physicsManager.addCapsuleGeometry = (position, quaternion, radius, halfHeight, physicsMaterial, ccdEnabled) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addCapsuleGeometryPhysics(physx.physics, position, quaternion, radius, halfHeight, physicsId, physicsMaterial, ccdEnabled);
  
  const physicsObject = _makePhysicsObject(physicsId);
  const physicsMesh = new THREE.Mesh(
    new CapsuleGeometry(radius, radius, halfHeight*2)
  );
  physicsMesh.visible = false;
  // physicsMesh.position.copy(position);
  // physicsMesh.quaternion.copy(quaternion);
  // physicsMesh.scale.copy(size);
  //physicsObject.position.copy(position);
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  physicsObjects[physicsId] = physicsObject;
  physicsObject.velocity = new THREE.Vector3(0,0,0);
  physicsManager.disablePhysicsObject(physicsObject);
  return physicsObject;
};

physicsManager.addBoxGeometry = (position, quaternion, size, dynamic) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addBoxGeometryPhysics(physx.physics, position, quaternion, size, physicsId, dynamic);
  
  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, size);
  const physicsMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2)
  );
  physicsMesh.visible = false;
  // physicsMesh.position.copy(position);
  // physicsMesh.quaternion.copy(quaternion);
  // physicsMesh.scale.copy(size);
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  physicsObjects[physicsId] = physicsObject;
  return physicsObject;
};
physicsManager.addGeometry = mesh => {
  // mesh.updateMatrixWorld();
  const physicsMesh = convertMeshToPhysicsMesh(mesh);
  if (mesh.parent) {
    mesh.parent.matrixWorld.decompose(
      physicsMesh.position,
      physicsMesh.quaternion,
      physicsMesh.scale
    );
    physicsMesh.updateMatrixWorld();
  }
  /* physicsMesh.position.copy(mesh.position);
  physicsMesh.quaternion.copy(mesh.quaternion);
  physicsMesh.scale.copy(mesh.scale);
  physicsMesh.updateMatrixWorld(); */
  
  // mesh.updateMatrixWorld();
  // mesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addGeometryPhysics(physx.physics, physicsMesh, physicsId);
  physicsMesh.geometry = _extractPhysicsGeometryForId(physicsId);
  
  const physicsObject = _makePhysicsObject(physicsId, localVector, localQuaternion, localVector2);
  physicsObject.add(physicsMesh);
  physicsMesh.position.set(0, 0, 0);
  physicsMesh.quaternion.set(0, 0, 0, 1);
  physicsMesh.scale.set(1, 1, 1);
  physicsMesh.updateMatrixWorld();
  physicsObject.physicsMesh = physicsMesh;
  physicsObjects[physicsId] = physicsObject;
  return physicsObject;
};
physicsManager.cookGeometry = mesh => physx.physxWorker.cookGeometryPhysics(physx.physics, mesh);
physicsManager.addCookedGeometry = (buffer, position, quaternion, scale) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addCookedGeometryPhysics(physx.physics, buffer, position, quaternion, scale, physicsId);

  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, scale);
  const physicsMesh = new THREE.Mesh(_extractPhysicsGeometryForId(physicsId));
  physicsMesh.visible = false;
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  physicsObjects[physicsId] = physicsObject;
  return physicsObject;
};

physicsManager.addConvexGeometry = mesh => {
  const physicsMesh = convertMeshToPhysicsMesh(mesh);
  if (mesh.parent) {
    mesh.parent.matrixWorld.decompose(
      physicsMesh.position,
      physicsMesh.quaternion,
      physicsMesh.scale
    );
    physicsMesh.updateMatrixWorld();
  }
  
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addConvexGeometryPhysics(physx.physics, physicsMesh, physicsId);
  physicsMesh.geometry = _extractPhysicsGeometryForId(physicsId);

  const physicsObject = _makePhysicsObject(physicsId, mesh.position, mesh.quaternion, mesh.scale);
  physicsObject.add(physicsMesh);
  physicsMesh.position.set(0, 0, 0);
  physicsMesh.quaternion.set(0, 0, 0, 1);
  physicsMesh.scale.set(1, 1, 1);
  physicsMesh.updateMatrixWorld();
  physicsObject.physicsMesh = physicsMesh;
  physicsObjects[physicsId] = physicsObject;
  return physicsObject;
};
physicsManager.cookConvexGeometry = mesh => physx.physxWorker.cookConvexGeometryPhysics(physx.physics, mesh);
physicsManager.addCookedConvexGeometry = (buffer, position, quaternion, scale) => {
  const physicsId = getNextPhysicsId();
  physx.physxWorker.addCookedConvexGeometryPhysics(physx.physics, buffer, position, quaternion, scale, physicsId);
  
  const physicsObject = _makePhysicsObject(physicsId, position, quaternion, scale);
  const physicsMesh = new THREE.Mesh(_extractPhysicsGeometryForId(physicsId));
  physicsMesh.visible = false;
  physicsObject.add(physicsMesh);
  physicsObject.physicsMesh = physicsMesh;
  physicsObjects[physicsId] = physicsObject;
  return physicsObject;
};

physicsManager.getGeometryForPhysicsId = physicsId => physx.physxWorker.getGeometryPhysics(physx.physics, physicsId);
physicsManager.disablePhysicsObject = physicsObject => {
  physx.physxWorker.disableGeometryPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.enablePhysicsObject = physicsObject => {
  physx.physxWorker.enableGeometryPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.disableGeometryQueries = physicsObject => {
  physx.physxWorker.disableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.enableGeometryQueries = physicsObject => {
  physx.physxWorker.enableGeometryQueriesPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.removeGeometry = physicsObject => {
  physx.physxWorker.removeGeometryPhysics(physx.physics, physicsObject.physicsId);
};
physicsManager.setVelocity = (physicsObject, velocity, t) => {
  physx.physxWorker.setVelocityPhysics(physx.physics, physicsObject.physicsId, velocity);
};
physicsManager.setTransform = (physicsObject) => {
  physx.physxWorker.setTransformPhysics(physx.physics, physicsObject.physicsId, physicsObject.position, physicsObject.quaternion, physicsObject.scale);
};
physicsManager.getTransforms = physicsObjects => {
  const objs = physx.physxWorker.getTransformPhysics(physx.physics, physicsObjects);
  return objs;
};

physicsManager.raycast = (position, quaternion) => physx.physxWorker.raycastPhysics(physx.physics, position, quaternion);
physicsManager.getPhysicsObject = physicsId => physicsObjects[physicsId];
/* physicsManager.pushPhysicsUpdate = physicsId => {
  const physicsObject = physicsObjects[physicsId];
  // physicsObject.updateMatrixWorld();
  physicsObject.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  physicsUpdates.push({
    id: physicsId,
    position: localVector.clone(),
    quaternion: localQuaternion.clone(),
    scale: localVector2.clone(),
  });
}; */
physicsManager.simulatePhysics = timeDiff => {
  const t = timeDiff/1000;
  physx.physxWorker.simulatePhysics(physx.physics, t);
};

physicsManager.physicsPreStep = timeDiff => {
  const t = timeDiff/1000;
  const localPlayer = metaversefileApi.useLocalPlayer();

  if(localPlayer.avatar)
  {
    const phyObj = localPlayer.avatar.app.getPhysicsObjects();
    if(phyObj[0]) {
      physicsManager.setVelocity(phyObj[0], physicsManager.velocity.clone(), t);
      physicsManager.physicsPostStep(phyObj[0], t); // Apply new transforms to physicsObject
    }
  }
}

physicsManager.physicsPostStep = physicsObject => {
  //const t = timeDiff/1000;
  const localPlayer = metaversefileApi.useLocalPlayer();

  physicsUpdates.push({
    id: physicsObject.physicsId,
    position: localVector,
    quaternion: localQuaternion,
    scale: localVector2,
  });

  const newTransform = physicsManager.getTransforms(physicsUpdates);
  physicsUpdates.length = 0;

  for (const updateOut of newTransform)
    {
      const {id, position, quaternion, scale} = updateOut; 
      const phyObj = metaversefileApi.getPhysicsObjectByPhysicsId(id);
      phyObj.position.copy(position);
      phyObj.quaternion.copy(quaternion);
      //physicsObject.scale.copy(scale);
      phyObj.updateMatrixWorld();
      phyObj.needsUpdate = false;

      const localPlayer = metaversefileApi.useLocalPlayer();
      if (localPlayer.avatar.app.getPhysicsObjects().some(o => o.physicsId === phyObj.physicsId))
      {
        const avatarWorldObject = _getAvatarWorldObject(localObject);
        const avatarCameraOffset = _getAvatarCameraOffset();

        const offset = getAvatarHeight() - 0.296;
        phyObj.position.add(new THREE.Vector3(0, offset, 0)); // Height offset: Can't seem to change set it in the vrm.js during capsule creation

        const {cameraBasedOffset, velocityAvatarDirection, updateRig} = _getSelectedTool(); // Get camera & avatar state
        _applyPhysics(phyObj, camera, avatarCameraOffset, cameraBasedOffset, velocityAvatarDirection, updateRig); // update character controller

      }
    }
}

physicsManager.getRigTransforms = () => rigManager.getRigTransforms();

/* const makeAnimal = null;
const animals = [];
physicsManager.animals = animals; */

const gravity = new THREE.Vector3(0, -9.8, 0);
const _applyGravity = timeDiff => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  if (localPlayer.avatar) {
    const isFlying = localPlayer.hasAction('fly');
    if (isFlying) {
      physicsManager.velocity.multiplyScalar(0.9);
    } else {
      localVector.copy(gravity)
        .multiplyScalar(timeDiff);
      physicsManager.velocity.add(localVector);
    }
  }
};
const _applyDamping = timeDiffS => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  if (localPlayer.avatar) {
    const localPlayer = metaversefileApi.useLocalPlayer();
    if (!localPlayer.hasAction('fly') && !localPlayer.hasAction('jump') /*!jumpState || gliding*/) {
      const factor = getVelocityDampingFactor(groundFriction, timeDiffS * 1000);
      physicsManager.velocity.x *= factor;
      physicsManager.velocity.z *= factor;
    }

    /* const terminalVelocity = 50;
    const _clampToTerminalVelocity = v => Math.min(Math.max(v, -terminalVelocity), terminalVelocity);
    physicsManager.velocity.x = _clampToTerminalVelocity(physicsManager.velocity.x);
    physicsManager.velocity.z = _clampToTerminalVelocity(physicsManager.velocity.z);
    physicsManager.velocity.y = _clampToTerminalVelocity(physicsManager.velocity.y); */
  }
};
const _getAvatarWorldObject = o => {
  const renderer = getRenderer();
  const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
  o.matrix.copy(camera.matrixWorld)
    // .premultiply(dolly.matrix)
    .decompose(o.position, o.quaternion, o.scale);
  return o;
};
physicsManager.getAvatarWorldObject = _getAvatarWorldObject;

const getAvatarHeight = () => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  return localPlayer.avatar ? localPlayer.avatar.height : 0;
};
physicsManager.getAvatarHeight = getAvatarHeight;

const _getAvatarCapsule = v => {
  const avatarHeight = getAvatarHeight();
  v.set(0, -avatarHeight * 0.5, 0); // XXX use the proper crouch height
  v.radius = 0.3/1.6 * avatarHeight;
  v.halfHeight = Math.max(avatarHeight * 0.5 - v.radius, 0);
  return v;
};
physicsManager.getAvatarCapsule = _getAvatarCapsule;
const _getAvatarCameraOffset = () => {
  const renderer = getRenderer();
  if (renderer.xr.getSession()) {
    return zeroVector;
  } else {
    return cameraManager.getCameraOffset();
  }
};
physicsManager.getAvatarCameraOffset = _getAvatarCameraOffset;
physicsManager.physicsEnabled = false;
physicsManager.setPhysicsEnabled = physicsEnabled => {
  physicsManager.physicsEnabled = physicsEnabled;
};

const _applyPhysics = (physicsObject, camera, avatarOffset, cameraBasedOffset, velocityAvatarDirection, updateRig) => {

      const localPlayer = metaversefileApi.useLocalPlayer();

      if(physicsObject === localPlayer.avatar.app.physicsObjects[0]) {

        physicsManager.enablePhysicsObject(physicsObject);
        physicsManager.disableGeometryQueries(physicsObject);
        const localPlayer = metaversefileApi.useLocalPlayer();
        const avatarWorldObject = _getAvatarWorldObject(localObject);

        camera.updateMatrixWorld();
        camera.matrixWorld.decompose(localVector, localQuaternion, localVector2);

         localVector4.copy(avatarOffset);
         if (cameraBasedOffset) {
           localVector4.applyQuaternion(localQuaternion);
         }

        const offset = physicsManager.getAvatarCameraOffset();
          camera.position.copy(physicsObject.position)
          .sub(
            localVector3.copy(offset)
            .applyQuaternion(camera.quaternion)
          );

        localVector.add(localVector4);
        
        // avatar facing direction
        if (velocityAvatarDirection) {
          const horizontalVelocity = localVector5.set(physicsManager.velocity.x, 0, physicsManager.velocity.z);
          if (horizontalVelocity.lengthSq() > 0.001) {
            localQuaternion.setFromRotationMatrix(
              localMatrix.lookAt(
                zeroVector,
                horizontalVelocity,
                upVector
              )
            );
          } else {
            localPlayer.matrixWorld.decompose(localVector4, localQuaternion, localVector5);
          }
        }

        const jumpAction = localPlayer.getAction('jump');
        const _ensureJumpAction = () => {
              const newJumpAction = {
                type: 'jump',
                time: 0,
              };
              localPlayer.addAction(newJumpAction);
          };
        const _ensureNoJumpAction = () => {
          localPlayer.removeAction('jump');
        };

        // Necessary until we have physx grounded/restitution check. 
        const collision = _collideCapsule(physicsObject.position, localQuaternion2.set(0, 0, 0, 1));

        if (collision) {
          // const crouchOffset = getAvatarHeight() * (1 - getPlayerCrouchFactor(localPlayer)) * 0.5;
          // const temp = new THREE.Vector3().fromArray(collision.direction);
          // localVector4
          //   .set(0, 0, 0)
          //   .add(localVector5.set(0, -crouchOffset, 0));
          // physicsObject.position.add(localVector4)

          if (collision.grounded) {
            physicsManager.velocity.y = 0;
            _ensureNoJumpAction();
          } else if (!jumpAction) {
            _ensureJumpAction();
          }
           else if (!jumpAction && physicsManager.velocity.y < -4) {
            _ensureJumpAction();
          }
        } else if (!jumpAction && physicsManager.velocity.y < -6) {
          _ensureJumpAction();
        }

        localMatrix.compose(physicsObject.position, localQuaternion, localVector2);
        
        if (updateRig) {
          localPlayer.matrix.copy(localMatrix);
        } else {
          localPlayer.matrix.identity();
        }

        localPlayer.matrix
          .decompose(localPlayer.position, localPlayer.quaternion, localPlayer.scale);

        localPlayer.matrixWorld.copy(localPlayer.matrix);
      } 
};

const _getSelectedTool = () => {

  const localPlayer = metaversefileApi.useLocalPlayer();

  const avatarWorldObject = _getAvatarWorldObject(localObject);
  const avatarCameraOffset = _getAvatarCameraOffset();

  const renderer = getRenderer();
  if (renderer.xr.getSession()) {

    if (ioManager.currentWalked || localPlayer.actions.some(action => action.type === 'jump')) {
      const originalPosition = avatarWorldObject.position.clone();

      dolly.position.add(
        avatarWorldObject.position.clone().sub(originalPosition)
      );

      let cameraBasedOffset = false,
          velocityAvatarDirection = false,
          updateRig = false;

      return { cameraBasedOffset, velocityAvatarDirection, updateRig };

    } else {
      physicsManager.velocity.y = 0;

      return null;
    }
  } else {
    const selectedTool = cameraManager.getMode();
    if (selectedTool === 'firstperson') {
      _copyPQS(camera, avatarWorldObject);
      camera.updateMatrixWorld();

      let cameraBasedOffset = true,
          velocityAvatarDirection = false,
          updateRig = true;

      return { cameraBasedOffset, velocityAvatarDirection, updateRig };

    } else if (localPlayer.hasAction('aim') && !localPlayer.hasAction('narutoRun')) {
      _copyPQS(camera, avatarWorldObject);
      camera.updateMatrixWorld();

      let cameraBasedOffset = true,
          velocityAvatarDirection = false,
          updateRig = true;

      return { cameraBasedOffset, velocityAvatarDirection, updateRig };

    } else if (selectedTool === 'isometric') {
      _copyPQS(camera, avatarWorldObject);
      camera.updateMatrixWorld();

      let cameraBasedOffset = true,
          velocityAvatarDirection = true,
          updateRig = true;

      return { cameraBasedOffset, velocityAvatarDirection, updateRig };

    } else {
      throw new Error('invalid camera mode: ' + selectedTool);

      return null;
    }
  }

};

/*const _applyAvatarPhysics = (avatarWorldObject, avatarOffset, cameraBasedOffset, velocityAvatarDirection, updateRig, timeDiffS) => {
  const localPlayer = metaversefileApi.useLocalPlayer();
  if (physicsManager.physicsEnabled && localPlayer.avatar) {

    // apply offset
    const physicsObject = localPlayer.avatar.app.getPhysicsObjects()
    physicsManager.disableGeometryQueries(physicsObject[0]);
    //avatarWorldObject.position.add(physicsManager.offset);
    //physicsManager.offset.setScalar(0);

    

    // capsule physics
    if (!localPlayer.hasAction('sit')) {

      //applyVelocity(camera.position, physicsManager.velocity, timeDiffS);

      //avatarWorldObject.updateMatrixWorld();
      avatarWorldObject.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      //localVector.copy(physicsObject[0].position);

       localVector4.copy(avatarOffset);
       if (cameraBasedOffset) {
         localVector4.applyQuaternion(localQuaternion);
       }

      const offset = physicsManager.getAvatarCameraOffset();
        avatarWorldObject.position.copy(physicsObject[0].position)
        .sub(
          localVector3.copy(offset)
          .applyQuaternion(avatarWorldObject.quaternion)
        );

      localVector.add(localVector4);
      const collision = _collideCapsule(physicsObject[0].position, localQuaternion2.set(0, 0, 0, 1));
      
      // avatar facing direction
      if (velocityAvatarDirection) {
        const horizontalVelocity = localVector5.set(physicsManager.velocity.x, 0, physicsManager.velocity.z);
        if (horizontalVelocity.lengthSq() > 0.001) {
          localQuaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              zeroVector,
              horizontalVelocity,
              upVector
            )
          );
        } else {
          localPlayer.matrixWorld.decompose(localVector4, localQuaternion, localVector5);
        }
      }

      const jumpAction = localPlayer.getAction('jump');
      const _ensureJumpAction = () => {
        if (!jumpAction) {
          const newJumpAction = {
            type: 'jump',
            time: 0,
          };
          localPlayer.addAction(newJumpAction);
        } else {
          jumpAction.set('time', 0);
        }
      };
      const _ensureNoJumpAction = () => {
        localPlayer.removeAction('jump');
        //physicsManager.setVelocity(physicsObject[0], new THREE.Vector3(0, 100, 0));
      };
      if (collision) {
        const crouchOffset = getAvatarHeight() * (1 - getPlayerCrouchFactor(localPlayer)) * 0.5;
        // localVector4
        //   .fromArray(collision.direction)
        //   .add(localVector5.set(0, -crouchOffset, 0));
        //avatarWorldObject.position.add(localVector4)
        //localVector.add(localVector4);
        
        if (collision.grounded) {
          physicsManager.velocity.y = 0;
          //physicsManager.setVelocity(physicsObject[0], physicsManager.velocity);
          _ensureNoJumpAction();
        } else if (!jumpAction) {
          _ensureJumpAction();
        }
      } else if (!jumpAction && physicsManager.velocity.y < -4) {
        _ensureJumpAction();
      }
    } else {
      // physicsManager.velocity.y = 0;

      // const sitAction = localPlayer.getAction('sit');

      // const objInstanceId = sitAction.controllingId;
      // const controlledApp = metaversefileApi.getAppByInstanceId(objInstanceId);
      // const sitPos = sitAction.controllingBone ? sitAction.controllingBone : controlledApp;

      // const sitComponent = controlledApp.getComponent('sit');
      // const {sitOffset = [0, 0, 0], damping} = sitComponent;

      // physicsManager.setSitOffset(sitOffset);

      // applyVelocity(controlledApp.position, physicsManager.velocity, timeDiffS);
      // if (physicsManager.velocity.lengthSq() > 0) {
      //   controlledApp.quaternion
      //     .setFromUnitVectors(
      //       localVector4.set(0, 0, -1),
      //       localVector5.set(physicsManager.velocity.x, 0, physicsManager.velocity.z).normalize()
      //     )
      //     .premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI));
      // }
      // controlledApp.updateMatrixWorld();

      // localMatrix.copy(sitPos.matrixWorld)
      //   .decompose(localVector, localQuaternion, localVector2);
      
      // localVector.add(_sitOffset);
      // localVector.y += 1;
      // localQuaternion.premultiply(localQuaternion2.setFromAxisAngle(localVector3.set(0, 1, 0), Math.PI));
      
      // const offset = physicsManager.getAvatarCameraOffset();
      // camera.position.copy(localVector)
      //   .sub(
      //     localVector3.copy(offset)
      //       .applyQuaternion(camera.quaternion)
      //   );
    }

    //localVector.add(physicsObject[0].position);
    //camera.position.add(physicsObject[0].position);
    localMatrix.compose(physicsObject[0].position, localQuaternion, localVector2);

    // apply to player
    if (updateRig) {
      localPlayer.matrix.copy(localMatrix);
    } else {
      localPlayer.matrix.identity();
    }
    localPlayer.matrix
      .decompose(localPlayer.position, localPlayer.quaternion, localPlayer.scale);
    localPlayer.matrixWorld.copy(localPlayer.matrix);

    //physicsManager.setVelocity(physicsObject[0], physicsManager.velocity);



    
    if (localPlayer.avatar) {
      if (localPlayer.hasAction('jump')) {
       //localPlayer.avatar.setFloorHeight(-0xFFFFFF);
      } else {
        //localPlayer.avatar.setFloorHeight(localVector.y - getAvatarHeight());
      }
    }
  }
};*/
const _collideCapsule = (() => {
  const localVector = new THREE.Vector3();
  return (p, q) => {
    _getAvatarCapsule(localVector);
    localVector.add(p);
    return physx.physxWorker.collidePhysics(physx.physics, localVector.radius, localVector.halfHeight, localVector, q, 4);
  };
})();
/*const applyVelocity = (() => {
  const localVector = new THREE.Vector3();
  return (position, velocity, timeDiffS) => {
    position.add(localVector.copy(velocity).multiplyScalar(timeDiffS));
  };
})();
physicsManager.applyVelocity = applyVelocity;*/
/* const _collideItems = matrix => {
  matrix.decompose(localVector3, localQuaternion2, localVector4);

  if (uiManager.popupMesh.visible) {
    uiManager.popupMesh.position.lerp(localVector4.copy(localVector3).add(localVector5.set(0, -0.25, -1).applyQuaternion(localQuaternion2)), 0.1);
    uiManager.popupMesh.quaternion.slerp(localQuaternion2, 0.1);
  }

  physx.updatePhysics(localVector3);
}; */
/* const _collideChunk = matrix => {
  matrix.decompose(localVector3, localQuaternion2, localVector4);
  physx.currentChunkMesh.update(localVector3);
}; */

physicsManager.getGravity = () => gravity;
/* physicsManager.setGravity = g => {
  if (g === true) {
    gravity.set(0, -9.8, 0);
  } else if (g === false) {
    gravity.setScalar(0);
  } else {
    gravity.copy(g);
  }
}; */

// physicsManager.convertMeshToPhysicsMesh = convertMeshToPhysicsMesh;


// const unlocked = true;
/* physicsManager.unlockControls = () => {
  debugger;
  unlocked = true;
}; */

/* const _shiftPhysicsObjects = (physicsIds, oldMatrixWorld, newMatrixWorld) => {
  const oldMatrixWorldInverse = localMatrix.copy(oldMatrixWorld)
    .invert();
  for (const physicsId of physicsIds) {
    const physicsObject = physicsObject[physicsId];
    physicsObject.matrix
      .premultiply(newMatrixWorld)
      .premultiply(oldMatrixWorldInverse)
      .decompose(physicsObject.position, physicsObject.quaternion, physicsObject.scale);
  }
};
physicsManager.shiftPhysicsObjects = _shiftPhysicsObjects; */

const _copyPQS = (dst, src) => {
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dst.scale.copy(src.scale);
};
const _updatePhysics = timeDiff => {
  const timeDiffS = timeDiff / 1000;

  _applyGravity(timeDiffS);
  _applyDamping(timeDiffS);
  // const timeDiffS = timeDiff / 1000;
  // const localPlayer = metaversefileApi.useLocalPlayer();

  // const avatarWorldObject = _getAvatarWorldObject(localObject);
  // const avatarCameraOffset = _getAvatarCameraOffset();

  // const renderer = getRenderer();
  // if (renderer.xr.getSession()) {
  //   _applyGravity(timeDiffS);
  //   _applyDamping(timeDiffS);

  //   if (ioManager.currentWalked || localPlayer.actions.some(action => action.type === 'jump')) {
  //     const originalPosition = avatarWorldObject.position.clone();

  //     _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, false, false, false, timeDiffS);

  //     // dolly for weapon shoot direction
  //     dolly.position.add(
  //       avatarWorldObject.position.clone().sub(originalPosition)
  //     );
  //   } else {
  //     physicsManager.velocity.y = 0;
  //   }
  // } else {
  //   const selectedTool = cameraManager.getMode();
  //   if (selectedTool === 'firstperson') {
  //     _applyGravity(timeDiffS);
  //     _applyDamping(timeDiffS);
  //     _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, false, true, timeDiffS);
  //     _copyPQS(camera, avatarWorldObject);
  //     camera.updateMatrixWorld();
  //   } else if (localPlayer.hasAction('aim') && !localPlayer.hasAction('narutoRun')) {
  //     _applyGravity(timeDiffS);
  //     _applyDamping(timeDiffS);
  //     _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, false, true, timeDiffS);
  //     _copyPQS(camera, avatarWorldObject);
  //     camera.updateMatrixWorld();
  //   } else if (selectedTool === 'isometric') {
  //     _applyGravity(timeDiffS);
  //     _applyDamping(timeDiffS);
  //     _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, true, true, true, timeDiffS);
  //     _copyPQS(camera, avatarWorldObject);
  //     camera.updateMatrixWorld();
  //   /* } else if (selectedTool === 'birdseye') {
  //     _applyGravity(timeDiffS);
  //     _applyDamping(timeDiffS);
  //     _applyAvatarPhysics(avatarWorldObject, avatarCameraOffset, false, true, true, timeDiffS);
  //     _copyPQS(camera, avatarWorldObject);
  //     camera.updateMatrixWorld(); */
  //   } else {
  //     throw new Error('invalid camera mode: ' + selectedTool);
  //   }
  // }
};
physicsManager.update = _updatePhysics;

export default physicsManager;
