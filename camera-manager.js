import * as THREE from 'three';
import {getRenderer, camera, scene, setCameraType} from './renderer.js';
// import * as notifications from './notifications.js';
import physicsManager from './physics-manager.js';
import {shakeAnimationSpeed} from './constants.js';
import Simplex from './simplex-noise.js';
import {playersManager} from './players-manager.js';
// import alea from './alea.js';
// import * as sounds from './sounds.js';
import {minFov, maxFov, midFov} from './constants.js';
// import { updateRaycasterFromMouseEvent } from './util.js';
import easing from './easing.js';
import { clamp } from 'three/src/math/MathUtils.js';
import { PathFinder } from './npc-utils.js';

const cubicBezier = easing(0, 1, 0, 1);
const cubicBezier2 = easing(0.5, 0, 0.5, 1);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localVector8 = new THREE.Vector3();
const localVector9 = new THREE.Vector3();
const localVector10 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localQuaternion4 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

/*
Anon: "Hey man, can I get your autograph?"
Drake: "Depends. What's it worth to you?"
Anon: "Your first born child"
Drake: "No thanks. I don't think your child would be worth very much."
*/

const zeroVector = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);
const cameraOffsetDefault = 0.65;
const maxFocusTime = 300;

const cameraOffset = new THREE.Vector3();
let cameraOffsetTargetZ = cameraOffset.z;
let cameraOffsetLimitZ = Infinity;

const physicsScene = physicsManager.getScene();

// let cameraOffsetZ = cameraOffset.z;
const rayVectorZero = new THREE.Vector3(0,0,0);
// const rayVectorUp = new THREE.Vector3(0,1,0);
// const rayStartPos = new THREE.Vector3(0,0,0);
// const rayDirection = new THREE.Vector3(0,0,0);
// const rayOffsetPoint = new THREE.Vector3(0,0,0);
// const rayMatrix = new THREE.Matrix4();
// const rayQuaternion = new THREE.Quaternion();
// const rayOriginArray = [new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0)]; // 6 elements
// const rayDirectionArray = [new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion()]; // 6 elements

/* function getNormal(u, v) {
  return localPlane.setFromCoplanarPoints(zeroVector, u, v).normal;
} */
/* function signedAngleTo(u, v) {
  // Get the signed angle between u and v, in the range [-pi, pi]
  const angle = u.angleTo(v);
  console.log('signed angle to', angle, u.dot(v));
  return (u.dot(v) >= 0 ? 1 : -1) * angle;
} */
/* function signedAngleTo(a, b, v) {
  const s = v.crossVectors(a, b).length();
  // s = length(cross_product(a, b))
  const c = a.dot(b);
  const angle = Math.atan2(s, c);
  console.log('get signed angle', s, c, angle);
  return angle;
} */

const getSideOfY = (() => {
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  const localPlane = new THREE.Plane();

  function getSideOfY(a, b) {
    localQuaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        zeroVector,
        a,
        upVector
      )
    );
    const rightVector = localVector.set(1, 0, 0).applyQuaternion(localQuaternion);
    localPlane.setFromNormalAndCoplanarPoint(rightVector, a);
    const distance = localPlane.distanceToPoint(b, localVector2);
    return distance >= 0 ? 1 : -1;
  }
  return getSideOfY;
})();

// const lastCameraQuaternion = new THREE.Quaternion();
// let lastCameraZ = 0;
// let lastCameraValidZ = 0;

const seed = 'camera';
const shakeNoise = new Simplex(seed);

class Shake extends THREE.Object3D {
  constructor(intensity, startTime, radius, decay) {
    super();

    this.intensity = intensity;
    this.startTime = startTime;
    this.radius = radius;
    this.decay = decay;
  }
}

/* function lerpNum(value1, value2, amount) {
  amount = amount < 0 ? 0 : amount;
  amount = amount > 1 ? 1 : amount;
  return value1 + (value2 - value1) * amount;
}
// Raycast from player to camera corner
function initCameraRayParams(arrayIndex,originPoint) {
  rayDirection.subVectors(localPlayer.position, originPoint).normalize();

  rayMatrix.lookAt(rayDirection,rayVectorZero,rayVectorUp);
  rayQuaternion.setFromRotationMatrix(rayMatrix);

  // Slightly move ray start position towards camera (to avoid hair,hat)
  rayStartPos.copy(localPlayer.position);
  rayStartPos.add( rayDirection.multiplyScalar(0.1) );

  rayOriginArray[arrayIndex].copy(rayStartPos);
  rayDirectionArray[arrayIndex].copy(rayQuaternion);

}
// Raycast from player postition with small offset
function initOffsetRayParams(arrayIndex,originPoint) {
  rayDirection.subVectors(localPlayer.position, camera.position).normalize();

  rayMatrix.lookAt(rayDirection,rayVectorZero,rayVectorUp);
  rayQuaternion.setFromRotationMatrix(rayMatrix);

  rayOriginArray[arrayIndex].copy(originPoint);
  rayDirectionArray[arrayIndex].copy(rayQuaternion);
} */

/* const redMesh = (() => {
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshBasicMaterial({color: 0xff0000});
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  return mesh;
})();
scene.add(redMesh);

const blueMesh = (() => {
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshBasicMaterial({color: 0x0000ff});
  const mesh = new THREE.Mesh(geometry, material);
  // mesh.visible = false;
  return mesh;
})();
scene.add(blueMesh); */

class Scene2D {
  constructor(perspective, cameraMode, scrollDirection) {

    this.modeIs2D = true;
    this.perspective = perspective;
    this.cameraMode = cameraMode;
    this.scrollDirection = scrollDirection;
    this.cursorPosition = new THREE.Vector2(0, 0);
    this.lastCursorPosition = null;
    this.cursorSensitivity = 0.75;
    this.maxAimDistance = 3;
    this.zoomFactor = 1;
    this.moveTarget = null;

    this.debugMesh = null;

    this.pathFinder = new PathFinder({debugRender: true});
    this.path = null;
    this.pathIndex = 0;

    // document.addEventListener('click', (e) => {
    //   if(e.button === 0) { // left click
    //     const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    //     let randomColor = new THREE.Color(0xffffff * Math.random())
    //     const material = new THREE.MeshBasicMaterial( {color: randomColor} );
    //     const cube = new THREE.Mesh( geometry, material );
        
    //     cube.position.copy(this.getCursorPosition());
    //     cube.updateMatrixWorld();
    //     physicsScene.addBoxGeometry(cube.position, cube.quaternion, new THREE.Vector3(0.5, 0.5, 0.5), false);
    //     scene.add( cube );
    //   }
    // });
  }
  getPath(vec1, vec2) {
    return this.pathFinder.getPath(vec1, vec2);
  }
  getCursorPosition() {
    let vector = new THREE.Vector3();
    vector.set(
        (this.cursorPosition.x / window.innerWidth) * 2 - 1,
        - (this.cursorPosition.y / window.innerHeight) * 2 + 1,
        0
    );
    vector.unproject(camera);
    return new THREE.Vector3(vector.x, vector.y, 0);
  }
  getScreenCursorPosition() {
    let vector = new THREE.Vector3();
    vector.set(
        (this.cursorPosition.x / window.innerWidth) * 2 - 1,
        - (this.cursorPosition.y / window.innerHeight) * 2 + 1,
        0
    );
    return new THREE.Vector2(vector.x, vector.y);
  }
  castFromCursor() {
    let pos = this.getScreenCursorPosition();
    //let worldPos = this.getCursorPosition();
    const raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.1;
    const pointer = new THREE.Vector2();

    pointer.x = pos.x;
    pointer.y = pos.y;

    //raycaster.setFromCamera( pointer, camera );

    ////

    let vector = new THREE.Vector3();
    let dir = new THREE.Vector3();

    vector.set( ( this.cursorPosition.x / window.innerWidth ) * 2 - 1, - ( this.cursorPosition.y / window.innerHeight ) * 2 + 1, - 1 ); // z = - 1 important!

    vector.unproject( camera );

    dir.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );

    ////

    raycaster.set( vector, dir );

    const intersects = raycaster.intersectObjects( scene.children );

    if(intersects.length > 0) {
      let result = intersects[0];
      console.log(result, "raycast result");
      const flatSurface = new THREE.Vector3(0,1,0);
      const point = intersects[0].point;
      return point;
    }
  }
  getCursorQuaternionFromOrigin(origin) {
    let cursorPos = this.getCursorPosition();
    let tempObj = new THREE.Object3D;

    tempObj.position.copy(origin);
    tempObj.lookAt(new THREE.Vector3(cursorPos.x, cursorPos.y, cursorPos.z));

    tempObj.rotation.x = -tempObj.rotation.x;
    tempObj.rotation.y = -tempObj.rotation.y;

    return tempObj.quaternion;
  }
  getViewDirection() {
    let viewDir = new THREE.Vector3();
    playersManager.getLocalPlayer().getWorldDirection(viewDir);
    return viewDir.x > 0 ? "left" : "right";
  }
  handleCursorClick() {
    let cursorWorldPos = this.castFromCursor();
    if(cursorWorldPos) {
      //cursorWorldPos.y = 1;
      console.log(cursorWorldPos);
      this.moveTarget = cursorWorldPos;
      this.path = null;
      this.pathIndex = 0;
    }
    else {
      console.log("invalid target")
    }
  }
  traversePath(path, t) {
    const localPlayer = playersManager.getLocalPlayer();
    console.log(this.pathIndex);
    let target = path[this.pathIndex].position;
    let dist = localPlayer.position.distanceTo(target);
    let dir = new THREE.Vector3().subVectors(target, localPlayer.position);

    if(dist > 1) {
      localPlayer.characterPhysics.applyWasd(
        dir.normalize()
          .multiplyScalar(0.15 * t)
      );
      this.debugMesh.visible = true;
      this.debugMesh.position.copy(path[path.length-1].position);
      this.debugMesh.updateMatrixWorld();
    }
    else {
      if(this.pathIndex < path.length-1) {
        this.pathIndex++;
      }
      else {
        this.debugMesh.visible = false;
        this.moveTarget = null;
        this.path = null;
        this.pathIndex = 0;
      }
    }
  }
  moveToTarget(target, t) {
    const localPlayer = playersManager.getLocalPlayer();
    let origin = new THREE.Vector3(localPlayer.position.x, 1, localPlayer.position.z);
    let dist = origin.distanceTo(target);
    let dir = new THREE.Vector3();
    dir.subVectors(target, origin);

    if(dist > 0.1) {
      localPlayer.characterPhysics.applyWasd(
        dir.normalize()
          .multiplyScalar(0.1 * t)
      );
      this.debugMesh.visible = true;
      this.debugMesh.position.copy(target);
      this.debugMesh.updateMatrixWorld();
    }
    else {
      this.moveTarget = null;
      this.path = null;
      console.log("we arrived");
      this.debugMesh.visible = false;
    }

  }
  update(timeDiff) {
    const localPlayer = playersManager.getLocalPlayer();

    if(!this.debugMesh) {
      let geom = new THREE.BoxGeometry(1,1,1);
      let material = new THREE.MeshBasicMaterial({color: 0x00ff00});
      this.debugMesh = new THREE.Mesh(geom, material);
      scene.add(this.debugMesh);
      this.debugMesh.visible = false;
    }
    
    if(this.moveTarget && localPlayer) {
      if(!this.path) {
        this.path = this.getPath(localPlayer.position, this.moveTarget);
        console.log(this.path);
      }
      else {
        this.traversePath(this.path, timeDiff)
      }
    }
  }
}

class CameraManager extends EventTarget {
  constructor() {
    super();

    this.pointerLockElement = null;
    // this.pointerLockEpoch = 0;
    this.shakes = [];
    this.focus = false;
    this.lastFocusChangeTime = 0; // XXX this needs to be removed
    this.fovFactor = 0;
    this.lastNonzeroDirectionVector = new THREE.Vector3(0, 0, -1);

    this.targetType = 'dynamic';
    this.target = null;
    this.target2 = null;
    this.lastTarget = null;
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.targetQuaternion = new THREE.Quaternion();
    this.targetFov = camera.fov;
    this.sourcePosition = new THREE.Vector3();
    this.sourceQuaternion = new THREE.Quaternion();
    this.sourceFov = camera.fov;
    this.lerpStartTime = 0;
    this.lastTimestamp = 0;
    this.cinematicScript = null;
    this.cinematicScriptStartTime = -1;
    this.scene2D = null;
    this.viewFactor = 0;

    document.addEventListener('pointerlockchange', e => {
      let pointerLockElement = document.pointerLockElement;
      const renderer = getRenderer();
      if (pointerLockElement !== null && pointerLockElement !== renderer.domElement) {
        pointerLockElement = null;
      }

      this.pointerLockElement = pointerLockElement;
      this.dispatchEvent(new MessageEvent('pointerlockchange', {
        data: {
          pointerLockElement,
        },
      }));
    });
  }
  focusCamera(position) {
    camera.lookAt(position);
    camera.updateMatrixWorld();
  }
  getViewFactor() {
    return this.viewFactor;
  }
  enable2D(perspective = "side-scroll", mode = "follow", viewSize, scrollDirection = "both") {
    this.targetQuaternion = new THREE.Quaternion();
    this.targetPosition = new THREE.Vector3();
    this.viewFactor = viewSize;

    this.scene2D = new Scene2D(perspective, mode, scrollDirection);
    setCameraType("orthographic", viewSize, perspective);
  }
  disable2D() {
    this.scene2D = null;
    setCameraType("perspective");
  }
  async requestPointerLock() {
    // const localPointerLockEpoch = ++this.pointerLockEpoch;
    for (const options of [
      {
        unadjustedMovement: true,
      },
      undefined
    ]) {
      try {
        await new Promise((accept, reject) => {
          const renderer = getRenderer();
          if (document.pointerLockElement !== renderer.domElement) {
            const _pointerlockchange = e => {
              // if (localPointerLockEpoch === this.pointerLockEpoch) {
                accept();
              // }
              _cleanup();
            };
            document.addEventListener('pointerlockchange', _pointerlockchange);
            const _pointerlockerror = err => {
              reject(err);
              _cleanup();
              
              /* notifications.addNotification(`\
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
              }); */
            };
            document.addEventListener('pointerlockerror', _pointerlockerror);
            const _cleanup = () => {
              document.removeEventListener('pointerlockchange', _pointerlockchange);
              document.removeEventListener('pointerlockerror', _pointerlockerror);
            };
            renderer.domElement.requestPointerLock(options)
              .catch(_pointerlockerror);
          } else {
            accept();
          }
        });
        break;
      } catch (err) {
        console.warn(err);
        continue;
      }
    }
  }
  exitPointerLock() {
    document.exitPointerLock();
  }
  getMode() {
    if (this.target || this.cinematicScript) {
      return 'thirdperson';
    } 
    else if(this.scene2D) {
      return this.scene2D.perspective;
    } 
    else {
      return cameraOffset.z > -0.5 ? 'firstperson' : 'thirdperson';
    }
  }
  getCameraOffset() {
    return cameraOffset;
  }
  getCursorDistanceToPoint(cursor, point) {
    let vector = new THREE.Vector3();
    vector.set(
        (cursor.x / window.innerWidth) * 2 - 1,
        - (cursor.y / window.innerHeight) * 2 + 1,
        0
    );
    vector.unproject(camera);
    return new THREE.Vector3(vector.x, vector.y, 0).distanceTo(new THREE.Vector3(point.x, point.y, 0));
  }
  handleMouseMove(e) {
    const {movementX, movementY} = e;

    if(this.scene2D) {
      switch (this.scene2D.perspective) {
        case 'side-scroll': {
          const cursorPosition = this.scene2D.cursorPosition;
          let lastCursorPosition = this.scene2D.lastCursorPosition;
          const size = getRenderer().getSize(localVector);
          const sensitivity = this.scene2D.cursorSensitivity;
          const crosshairEl = document.getElementById('crosshair');
          const maxAimDistance = this.scene2D.maxAimDistance;

          
          let clampedX = THREE.MathUtils.clamp(cursorPosition.x, 0, size.x);
          let clampedY = THREE.MathUtils.clamp(cursorPosition.y, 0, size.y);
          clampedX += movementX * sensitivity;
          clampedY += movementY * sensitivity;

          cursorPosition.set(clampedX, clampedY);

          crosshairEl.style.left = clampedX + 'px';
          crosshairEl.style.top = clampedY + 'px';

          break;
        }
        case 'isometric': {
          const cursorPosition = this.scene2D.cursorPosition;
          let lastCursorPosition = this.scene2D.lastCursorPosition;
          const size = getRenderer().getSize(localVector);
          const sensitivity = this.scene2D.cursorSensitivity;
          const crosshairEl = document.getElementById('crosshair');
          const maxAimDistance = this.scene2D.maxAimDistance;

          
          let clampedX = THREE.MathUtils.clamp(cursorPosition.x, 0, size.x);
          let clampedY = THREE.MathUtils.clamp(cursorPosition.y, 0, size.y);
          clampedX += movementX * sensitivity;
          clampedY += movementY * sensitivity;

          cursorPosition.set(clampedX, clampedY);

          crosshairEl.style.left = clampedX + 'px';
          crosshairEl.style.top = clampedY + 'px';

          break;
        }
      
        default:
          break;
      }
    }

    // if(this.scene2D && this.scene2D.perspective === "side-scroll") {
    //   const cursorPosition = this.scene2D.cursorPosition;
    //   let lastCursorPosition = this.scene2D.lastCursorPosition;
    //   const size = getRenderer().getSize(localVector);
    //   const sensitivity = this.scene2D.cursorSensitivity;
    //   const crosshairEl = document.getElementById('crosshair');
    //   const maxAimDistance = this.scene2D.maxAimDistance;

      
    //   let clampedX = THREE.MathUtils.clamp(cursorPosition.x, 0, size.x);
    //   let clampedY = THREE.MathUtils.clamp(cursorPosition.y, 0, size.y);
    //   clampedX += movementX * sensitivity;
    //   clampedY += movementY * sensitivity;

    //   cursorPosition.set(clampedX, clampedY);
    //   //const distance = this.getCursorDistanceToPoint(cursorPosition, playersManager.getLocalPlayer().position);
    //   // if(!this.scene2D.lastCursorPosition) {
    //   //   var width = window.innerWidth, height = window.innerHeight;
    //   //   var widthHalf = width / 2, heightHalf = height / 2;

    //   //   var pos = playersManager.getLocalPlayer().position.clone();
    //   //   pos.project(camera);
    //   //   pos.x = ( pos.x * widthHalf ) + widthHalf;
    //   //   pos.y = - ( pos.y * heightHalf ) + heightHalf;

    //   //   crosshairEl.style.left = pos.x + 'px';
    //   //   crosshairEl.style.top = pos.y + 'px';
        
    //   //   this.scene2D.lastCursorPosition = new THREE.Vector2(pos.x, pos.y);
        
    //   //   console.log("still here", this.scene2D.lastCursorPosition);
    //   // }
    //   // if(distance < maxAimDistance) {
    //   //   this.scene2D.lastCursorPosition.set(clampedX, clampedY);
    //   //   crosshairEl.style.left = clampedX + 'px';
    //   //   crosshairEl.style.top = clampedY + 'px';
    //   // }
    //   // else {
    //   //   crosshairEl.style.left = this.scene2D.lastCursorPosition.x + 'px';
    //   //   crosshairEl.style.top = this.scene2D.lastCursorPosition.y + 'px';
    //   // }

    //   if(!this.scene2D.lastCursorPosition) {
    //     var width = window.innerWidth, height = window.innerHeight;
    //     var widthHalf = width / 2, heightHalf = height / 2;

    //     var pos = playersManager.getLocalPlayer().position.clone();
    //     pos.project(camera);
    //     pos.x = ( pos.x * widthHalf ) + widthHalf;
    //     pos.y = - ( pos.y * heightHalf ) + heightHalf;

    //     crosshairEl.style.left = pos.x + 'px';
    //     crosshairEl.style.top = pos.y + 'px';
        
    //     this.scene2D.lastCursorPosition = new THREE.Vector2(pos.x, pos.y);
    //     cursorPosition.set(pos.x, pos.y);
    //   }

    //   crosshairEl.style.left = clampedX + 'px';
    //   crosshairEl.style.top = clampedY + 'px';
    //   //console.log(this.scene2D.getCursorPosition());
    // }
    else {
      camera.position.add(localVector.copy(this.getCameraOffset()).applyQuaternion(camera.quaternion));
  
      camera.rotation.y -= movementX * Math.PI * 2 * 0.0005;
      camera.rotation.x -= movementY * Math.PI * 2 * 0.0005;
      camera.rotation.x = Math.min(Math.max(camera.rotation.x, -Math.PI * 0.35), Math.PI / 2);
      camera.quaternion.setFromEuler(camera.rotation);

      camera.position.sub(localVector.copy(this.getCameraOffset()).applyQuaternion(camera.quaternion));

      camera.updateMatrixWorld();

      if (!this.target) {
        this.targetQuaternion.copy(camera.quaternion);
      }
    }
  }
  handleWheelEvent(e) {
    if (!this.target && !this.scene2D) {
      cameraOffsetTargetZ = Math.min(cameraOffset.z - e.deltaY * 0.01, 0);
    }
    if(this.scene2D && camera.isOrthographicCamera) {
      switch (this.scene2D.perspective) {
        case 'isometric': {
          this.scene2D.zoomFactor = THREE.MathUtils.clamp(this.scene2D.zoomFactor += e.deltaY * 0.01, 1, 1.5);
          camera.zoom = this.scene2D.zoomFactor;
          camera.updateProjectionMatrix();
          break;
        }
        case 'side-scroll': {
          // nothing yet
          break;
        }
        case 'top-down': {
          // nothing yet
          break;
        }        
        default: {
          break;
        }
      }
    }
  }
  addShake(position, intensity, radius, decay) {
    const startTime = performance.now();
    const shake = new Shake(intensity, startTime, radius, decay);
    shake.position.copy(position);
    this.shakes.push(shake);
    return shake;
  }
  flushShakes() {
    if (this.shakes.length > 0) {
      const now = performance.now();
      this.shakes = this.shakes.filter(shake => now < shake.startTime + shake.decay);
    }
  }
  getShakeFactor() {
    let result = 0;
    if (this.shakes.length > 0) {
      const now = performance.now();
      for (const shake of this.shakes) {
        const distanceFactor = Math.min(Math.max((shake.radius - shake.position.distanceTo(camera.position))/shake.radius, 0), 1);
        const timeFactor = Math.min(Math.max(1 - (now - shake.startTime) / shake.decay, 0), 1);
        // console.log('get shake factor', shake.intensity * distanceFactor * timeFactor, shake.intensity, distanceFactor, timeFactor);
        result += shake.intensity * distanceFactor * timeFactor;
      }
    }
    return result;
  }
  setFocus(focus) {
    if (focus !== this.focus) {
      this.focus = focus;
      // this.lastFocusChangeTime = performance.now();

      this.dispatchEvent(new MessageEvent('focuschange', {
        data: {
          focus,
        },
      }));
    }
  }
  setDynamicTarget(target = null, target2 = null) {
    this.targetType = 'dynamic';
    this.target = target;
    this.target2 = target2;

    // console.log('set dynamic target', this.target, this.target2, new Error().stack);

    if (this.target) {
      const _setCameraToDynamicTarget = () => {
        this.target.matrixWorld.decompose(localVector, localQuaternion, localVector2);
        
        if (this.target2) {
          this.target2.matrixWorld.decompose(localVector3, localQuaternion2, localVector4);

          const faceDirection = localVector5.set(0, 0, 1).applyQuaternion(localQuaternion);
          const lookQuaternion = localQuaternion3.setFromRotationMatrix(
            localMatrix.lookAt(
              localVector,
              localVector3,
              upVector,
            )
          );
          const lookDirection = localVector6.set(0, 0, -1).applyQuaternion(lookQuaternion);

          const sideOfY = getSideOfY(faceDirection, lookDirection);
          const face = faceDirection.dot(lookDirection) >= 0 ? 1 : -1;

          const dollyPosition = localVector7.copy(localVector)
            .add(localVector3)
            .multiplyScalar(0.5);

          dollyPosition.add(
            localVector8.set(sideOfY * -0.3, 0, 0).applyQuaternion(lookQuaternion)
          );

          const lookToDollyVector = localVector9.copy(dollyPosition).sub(localVector).normalize();

          this.targetPosition.copy(localVector)
            .add(lookToDollyVector);
          this.targetQuaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              lookToDollyVector,
              zeroVector,
              upVector
            )
          );

          if (face < 0) {
            this.targetPosition.add(localVector10.set(0, 0, -0.8).applyQuaternion(this.targetQuaternion));
            this.targetQuaternion.multiply(localQuaternion4.setFromAxisAngle(upVector, Math.PI));
            this.targetPosition.add(localVector10.set(0, 0, 0.8).applyQuaternion(this.targetQuaternion));
          } else if (!this.lastTarget) {
            this.targetPosition.add(localVector10.set(0, 0, -cameraOffsetDefault).applyQuaternion(this.targetQuaternion));
            this.targetQuaternion.multiply(localQuaternion4.setFromAxisAngle(upVector, sideOfY * -Math.PI * 0.87));
            this.targetPosition.add(localVector10.set(0, 0, cameraOffsetDefault).applyQuaternion(this.targetQuaternion));
          }
        } else {
          this.targetPosition.copy(localVector)
            .add(localVector2.set(0, 0, 1).applyQuaternion(localQuaternion));
          this.targetQuaternion.copy(localQuaternion);
        }

        this.sourceFov = camera.fov;
        this.targetFov = minFov;

        this.sourcePosition.copy(camera.position);
        this.sourceQuaternion.copy(camera.quaternion);
        const timestamp = performance.now();
        this.lerpStartTime = timestamp;
        this.lastTimestamp = timestamp;

        // cameraOffsetZ = -cameraOffsetDefault;
        cameraOffset.z = -cameraOffsetDefault;
      };
      _setCameraToDynamicTarget();
    } else {
      this.setCameraToNullTarget();
    }
  }
  setStaticTarget(target = null, target2 = null) {
    this.targetType = 'static';
    this.target = target;
    this.target2 = target2;

    // console.log('set static target', this.target, this.target2, new Error().stack);

    if (this.target) {
      const _setCameraToStaticTarget = () => {
        // this.target.matrixWorld.decompose(localVector, localQuaternion, localVector2);

        cameraOffsetTargetZ = -1;
        cameraOffset.z = cameraOffsetTargetZ;

        const localPlayer = playersManager.getLocalPlayer();
        const targetPosition = localVector.copy(localPlayer.position)
          .add(localVector2.set(0, 0, -cameraOffsetTargetZ).applyQuaternion(localPlayer.quaternion));
        const targetQuaternion = localPlayer.quaternion;
        // camera.position.lerp(targetPosition, 0.2);
        // camera.quaternion.slerp(targetQuaternion, 0.2);

        this.sourcePosition.copy(camera.position);
        this.sourceQuaternion.copy(camera.quaternion);
        this.sourceFov = camera.fov;
        this.targetPosition.copy(targetPosition);
        this.targetQuaternion.copy(targetQuaternion);
        this.targetFov = midFov;
        const timestamp = performance.now();
        this.lerpStartTime = timestamp;
        this.lastTimestamp = timestamp;

        // cameraOffsetZ = -cameraOffsetDefault;
        // cameraOffset.z = -cameraOffsetDefault;
      };
      _setCameraToStaticTarget();
    } else {
      this.setCameraToNullTarget();
    }
  }
  setCameraToNullTarget() {
    this.sourcePosition.copy(camera.position);
    this.sourceQuaternion.copy(camera.quaternion);
    this.sourceFov = camera.fov;
    // this.targetPosition.copy(camera.position);
    // this.targetQuaternion.copy(camera.quaternion);
    this.targetFov = minFov;
    const timestamp = performance.now();
    this.lerpStartTime = timestamp;
    this.lastTimestamp = timestamp;
  }
  startCinematicScript(cinematicScript) {
    this.cinematicScript = cinematicScript;
    this.cinematicScriptStartTime = performance.now();
  }
  updatePost(timestamp, timeDiff) {
    const renderer = getRenderer();
    const session = renderer.xr.getSession();
    const localPlayer = playersManager.getLocalPlayer();

    if(this.scene2D) {
      this.scene2D.update(timeDiff);
    }

    if (this.target) {
      const _setLerpDelta = (position, quaternion) => {
        const lerpTime = 2000;
        const lastTimeFactor = Math.min(Math.max(cubicBezier((this.lastTimestamp - this.lerpStartTime) / lerpTime), 0), 1);
        const currentTimeFactor = Math.min(Math.max(cubicBezier((timestamp - this.lerpStartTime) / lerpTime), 0), 1);
        if (lastTimeFactor !== currentTimeFactor) {
          {
            const lastLerp = localVector.copy(this.sourcePosition).lerp(this.targetPosition, lastTimeFactor);
            const currentLerp = localVector2.copy(this.sourcePosition).lerp(this.targetPosition, currentTimeFactor);
            position.add(currentLerp).sub(lastLerp);
          }
          {
            const lastLerp = localQuaternion.copy(this.sourceQuaternion).slerp(this.targetQuaternion, lastTimeFactor);
            const currentLerp = localQuaternion2.copy(this.sourceQuaternion).slerp(this.targetQuaternion, currentTimeFactor);
            quaternion.premultiply(lastLerp.invert()).premultiply(currentLerp);
          }
        }

        this.lastTimestamp = timestamp;
      };
      _setLerpDelta(camera.position, camera.quaternion);
      camera.updateMatrixWorld();
    } else if (this.cinematicScript) {
      const timeDiff = timestamp - this.cinematicScriptStartTime;
      // find the line in the script that we are currently on
      let currentDuration = 0;
      const currentLineIndex = (() => {
        let i;
        for (i = 0; i < this.cinematicScript.length; i++) {
          const currentLine = this.cinematicScript[i];
          // const nextLine = this.cinematicScript[i + 1];

          if (currentDuration + currentLine.duration > timeDiff) {
            // return currentLine;
            break;
          } else {
            currentDuration += currentLine.duration;
          }

          // const lineDuration = this.cinematicScript[i].duration;
          // currentDuration += lineDuration;
        }
        return i < this.cinematicScript.length ? i : -1;
      })();

      if (currentLineIndex !== -1) {
        // calculate how far into the line we are, in 0..1
        const currentLine = this.cinematicScript[currentLineIndex];
        const {type} = currentLine;
        switch (type) {
          case 'set': {
            camera.position.copy(currentLine.position);
            camera.quaternion.copy(currentLine.quaternion);
            camera.updateMatrixWorld();
            break;
          }
          case 'move': {
            let factor = Math.min(Math.max((timeDiff - currentDuration) / currentLine.duration, 0), 1);
            if (factor < 1) {
              factor = cubicBezier2(factor);
              const previousLine = this.cinematicScript[currentLineIndex - 1];
              
              camera.position.copy(previousLine.position).lerp(currentLine.position, factor);
              camera.quaternion.copy(previousLine.quaternion).slerp(currentLine.quaternion, factor);
              camera.updateMatrixWorld();

              // console.log('previous line', previousLine, camera.position.toArray().join(','), camera.quaternion.toArray().join(','), factor);
              /* if (isNaN(camera.position.x)) {
                debugger;
              } */
            } else {
              this.cinematicScript = null;
            }
            break;
          }
          default: {
            throw new Error('unknown cinematic script line type: ' + type);
          }
        }
      } else {
        // console.log('no line', timeDiff, this.cinematicScript.slice());
        this.cinematicScript = null;
      }
    } else {
      const _bumpCamera = () => {
        const direction = localVector.set(0, 0, 1)
          .applyQuaternion(camera.quaternion);
        const backOffset = 1;
        // const cameraBackThickness = 0.5;

        const sweepDistance = Math.max(-cameraOffsetTargetZ, 0);

        // console.log('offset', cameraOffsetTargetZ);

        cameraOffsetLimitZ = -Infinity;

        if (sweepDistance > 0) {
          const halfExtents = localVector2.set(0.5, 0.5, 0.1);
          const maxHits = 1;

          const result = physicsScene.sweepBox(
            localVector3.copy(localPlayer.position)
              .add(localVector4.copy(direction).multiplyScalar(backOffset)),
            camera.quaternion,
            halfExtents,
            direction,
            sweepDistance,
            maxHits,
          );
          if (result.length > 0) {
            const distance = result[0].distance;
            cameraOffsetLimitZ = distance < 0.5 ? 0 : -distance;
          }
        }
      };
      _bumpCamera();

      const _lerpCameraOffset = () => {
        const lerpFactor = 0.15;
        let cameraOffsetZ = Math.max(cameraOffsetTargetZ, cameraOffsetLimitZ);
        if (cameraOffsetZ > -0.5) {
          cameraOffsetZ = 0;
        }
        cameraOffset.z = cameraOffset.z * (1-lerpFactor) + cameraOffsetZ*lerpFactor;
      };
      _lerpCameraOffset();

      const _isOutOfView = () => {
        const frustum = new THREE.Frustum()
        const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
        frustum.setFromProjectionMatrix(matrix)
        if (!frustum.containsPoint(localPlayer.position)) {
            return true;
        }
        return false;
      }

      const _setFreeCamera = () => {
        const avatarCameraOffset = session ? rayVectorZero : this.getCameraOffset();
        const avatarHeight = localPlayer.avatar ? localPlayer.avatar.height : 0;
        const crouchOffset = avatarHeight * (1 - localPlayer.getCrouchFactor()) * 0.5;

        switch (this.getMode()) {
          case 'firstperson': {
            if (localPlayer.avatar) {
              const boneNeck = localPlayer.avatar.foundModelBones['Neck'];
              const boneEyeL = localPlayer.avatar.foundModelBones['Eye_L'];
              const boneEyeR = localPlayer.avatar.foundModelBones['Eye_R'];
              const boneHead = localPlayer.avatar.foundModelBones['Head'];

              boneNeck.quaternion.setFromEuler(localEuler.set(Math.min(camera.rotation.x * -0.5, 0.6), 0, 0, 'XYZ'));
              boneNeck.updateMatrixWorld();
        
              if (boneEyeL && boneEyeR) {
                boneEyeL.matrixWorld.decompose(localVector2, localQuaternion, localVector4);
                boneEyeR.matrixWorld.decompose(localVector3, localQuaternion, localVector4);
                localVector4.copy(localVector2.add(localVector3).multiplyScalar(0.5));
              } else {
                boneHead.matrixWorld.decompose(localVector2, localQuaternion, localVector4);
                localVector2.add(localVector3.set(0, 0, 0.1).applyQuaternion(localQuaternion));
                localVector4.copy(localVector2);
              }
            } else {
              localVector4.copy(localPlayer.position);
            }

            this.targetPosition.copy(localVector4)
              .sub(localVector2.copy(avatarCameraOffset).applyQuaternion(this.targetQuaternion));

            break;
          }
          case 'thirdperson': {
            this.targetPosition.copy(localPlayer.position)
              .sub(
                localVector2.copy(avatarCameraOffset)
                  .applyQuaternion(this.targetQuaternion)
              );
            break;
          }
          case 'top-down': {
            this.targetPosition.copy(localPlayer.position)
              .sub(
                localVector2.copy(avatarCameraOffset)
                  .applyQuaternion(this.targetQuaternion)
              );
      
            break;
          }
          case 'side-scroll': {
            if(this.scene2D && this.scene2D.cameraMode === "fixed") {
              if(this.scene2D.scrollDirection === "horizontal") {
                let offset = new THREE.Vector3(localPlayer.position.x, localPlayer.position.y, 0).sub(new THREE.Vector3(camera.position.x, localPlayer.position.y, 0));
                this.targetPosition.copy(new THREE.Vector3(localPlayer.position.x, localPlayer.position.y, 0)).add(new THREE.Vector3(offset.x, offset.y, 0));
                break;
              } 
              else if (this.scene2D.scrollDirection === "vertical") {
                let offset = new THREE.Vector3(localPlayer.position.x, localPlayer.position.y, 0).sub(new THREE.Vector3(camera.position.x, localPlayer.position.y, 0));
                this.targetPosition.copy(new THREE.Vector3(0,localPlayer.position.y, 0)).add(new THREE.Vector3(0, offset.y, 0));
                break;
              } 
            }
            
            this.targetPosition.copy(localPlayer.position)
              .sub(
                localVector2.copy(avatarCameraOffset)
                  .applyQuaternion(this.targetQuaternion)
              );
      
            break;
          }
          case 'isometric': {
            this.targetPosition.copy(localPlayer.position);
            break;
          }
          default: {
            throw new Error('invalid camera mode: ' + cameraMode);
          }
        }

        const factor = Math.min((timestamp - this.lerpStartTime) / maxFocusTime, 1);

        this.targetPosition.y -= crouchOffset;
        camera.position.copy(this.sourcePosition)
          .lerp(this.targetPosition, factor);
        
        localEuler.setFromQuaternion(this.targetQuaternion, 'YXZ');
        localEuler.z = 0;

        if(!this.scene2D) {
          camera.quaternion.copy(this.sourceQuaternion)
            .slerp(localQuaternion.setFromEuler(localEuler), factor);
        }
        else {
          switch (this.scene2D.perspective) {
            case 'isometric': {
              camera.rotation.order = 'YXZ';
              camera.rotation.y = - Math.PI / 4;
              camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );
              break;
            }
            case 'side-scroll': {
              camera.quaternion.copy(this.sourceQuaternion)
                .slerp(localQuaternion.setFromEuler(localEuler), factor);
              break;
            }          
            default: {
              camera.quaternion.copy(this.sourceQuaternion)
                .slerp(localQuaternion.setFromEuler(localEuler), factor);
              break;
            }
          }
        }      
      };
      if(this.scene2D) {
        if(this.scene2D.cameraMode === "follow" || _isOutOfView()) {
          _setFreeCamera();
        }
      } else {
        _setFreeCamera();
      }
      
    };
      
    const _setCameraFov = () => {
      if (!renderer.xr.getSession()) {
        let newFov;

        const focusTime = Math.min((timestamp - this.lerpStartTime) / maxFocusTime, 1);
        if (focusTime < 1) {
          this.fovFactor = 0;

          const a = this.sourceFov;
          const b = this.targetFov;
          newFov = a * (1 - focusTime) + focusTime * b;
        } else if (this.focus) {
          this.fovFactor = 0;

          newFov = midFov;
        } else {
          const fovInTime = 3;
          const fovOutTime = 0.3;
          
          const narutoRun = localPlayer.getAction('narutoRun');
          if (narutoRun) {
            if (this.lastNonzeroDirectionVector.z < 0) {    
              this.fovFactor += timeDiff / 1000 / fovInTime;
            } else {
              this.fovFactor -= timeDiff / 1000 / fovInTime;
            }
          } else {
            this.fovFactor -= timeDiff / 1000 / fovOutTime;
          }
          this.fovFactor = Math.min(Math.max(this.fovFactor, 0), 1);
          
          newFov = minFov + Math.pow(this.fovFactor, 0.75) * (maxFov - minFov);
        }

        if (newFov !== camera.fov) {
          camera.fov = newFov;
          camera.updateProjectionMatrix();

          this.dispatchEvent(new MessageEvent('fovchange', {
            data: {
              fov: newFov,
            },
          }));
        }
      }
    };
    _setCameraFov();

    const _shakeCamera = () => {
      this.flushShakes();
      const shakeFactor = this.getShakeFactor();
      if (shakeFactor > 0) {
        const baseTime = timestamp/1000 * shakeAnimationSpeed;
        const timeOffset = 1000;
        const ndc = f => (-0.5 + f) * 2;
        let index = 0;
        const randomValue = () => ndc(shakeNoise.noise1D(baseTime + timeOffset * index++));
        localVector.set(
          randomValue(),
          randomValue(),
          randomValue()
        )
          .normalize()
          .multiplyScalar(shakeFactor * randomValue());
        camera.position.add(localVector);
      }
    };
    _shakeCamera();

    camera.updateMatrixWorld();

    this.lastTarget = this.target;
  }
};
const cameraManager = new CameraManager();
export default cameraManager;