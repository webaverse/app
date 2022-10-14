import * as THREE from 'three';
import {getRenderer, camera, scene, setCameraType} from './renderer.js';
import physicsManager from './physics-manager.js';
import {playersManager} from './players-manager.js';
import { PathFinder } from './npc-utils.js';
import { PointerControls } from './scene2D-utils.js';

const localVector = new THREE.Vector3();

class Scene2DManager {
    constructor() {

      this.modeIs2D = true;
      this.perspective = null;
      this.cameraMode = null;
      this.scrollDirection = null;
      this.cursorPosition = new THREE.Vector2(0, 0);
      this.cursorOffset = new THREE.Vector2(-30, -30);
      this.lastCursorPosition = null;
      this.cursorSensitivity = 0.75;
      this.maxAimDistance = 3;
      this.zoomFactor = 1;
      this.moveTarget = null;
      this.attackTarget = null;
      this.debugCircle = null;
      this.viewSize = 0;
      this.interactTarget = null;

      this.debugMesh = null;
      this.attackMesh = null;

      this.pathFinder = new PathFinder({debugRender: false});
      this.path = null;
      this.pathIndex = 0;

      this.lastAttackTime = 0;
      this.firstAttackTime = null;
      this.inAttackRange = false;

      //Controls
      //this.controlMode = controls;

      //debug

      this.healthMesh = null;

      this.pointerControls = null;

      this.enabled = false;

      // if(this.controlMode === 'click') {
      //   const geometry = new THREE.CircleGeometry(0.5, 32/4);
      //   const material = new THREE.MeshBasicMaterial( { color: 0x0099e6, wireframe: true } );
      //   this.debugCircle = new THREE.Mesh( geometry, material );
      //   this.debugCircle.rotation.x = -Math.PI / 2;
      //   scene.add( this.debugCircle );

      //   const geometry2 = new THREE.CircleGeometry(0.5, 32/4);
      //   const material2 = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
      //   this.attackMesh = new THREE.Mesh( geometry2, material2 );
      //   this.attackMesh.rotation.x = -Math.PI / 2;
      //   scene.add( this.attackMesh );
      //   this.attackMesh.visible = false;
      // }

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
    handleWheelEvent(e) {
            switch (this.perspective) {
                case 'isometric': {
                this.zoomFactor = THREE.MathUtils.clamp(this.zoomFactor += e.deltaY * 0.01, 1, 1.5);
                camera.zoom = this.zoomFactor;
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
    handleMouseMove(e) {
        const {movementX, movementY} = e;

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

        switch (this.perspective) {
            case 'side-scroll': {
            const cursorPosition = this.cursorPosition;
            let lastCursorPosition = this.lastCursorPosition;
            const size = getRenderer().getSize(localVector);
            const sensitivity = this.cursorSensitivity;
            const crosshairEl = document.getElementById('crosshair');
            const maxAimDistance = this.maxAimDistance;


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
            if(!this.pointerControls) {
                break;
            }
            const cursorPosition = this.cursorPosition;
            let lastCursorPosition = this.lastCursorPosition;
            const size = getRenderer().getSize(localVector);
            const sensitivity = this.cursorSensitivity;
            const crosshairEl = document.getElementById('crosshair');
            const maxAimDistance = this.maxAimDistance;

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
    setMode(perspective = "side-scroll", cameraMode = "follow", viewSize, scrollDirection = "both", controls = "default") {
        this.reset();
        this.perspective = perspective;
        this.cameraMode = cameraMode;
        this.scrollDirection = scrollDirection;
        this.viewSize = viewSize;
        //this.controlMode = controls;
        this.enabled = true;
        setCameraType("orthographic", viewSize, perspective);
    }
    reset() {
        this.enabled = false;
        this.pointerControls = null;
        setCameraType("perspective");
    }
    enablePointerControls() {
      this.pointerControls = new PointerControls();
    }
    disablePointerControls() {
      this.pointerControls = null;
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
      let vector = new THREE.Vector3();
      let dir = new THREE.Vector3();
      vector.set( ( this.cursorPosition.x / window.innerWidth ) * 2 - 1, - ( this.cursorPosition.y / window.innerHeight ) * 2 + 1, - 1 );
      vector.unproject( camera );
      dir.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );
      raycaster.set( vector, dir );
      let ray = physicsScene.raycast(vector, camera.quaternion);

      if(ray) {
        return ray;
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
    handleClick() {
        if(this.pointerControls) {
            this.pointerControls.handleCursorClick();
        }
    }
    update(timestamp, timeDiff) {
      const localPlayer = playersManager.getLocalPlayer();

      if(this.pointerControls) {
        this.pointerControls.update(timestamp, timeDiff);
      }

      // if(!this.debugMesh) {
      //   const geometry = new THREE.CircleGeometry(0.5, 32/4);
      //   const material = new THREE.MeshBasicMaterial( { color: 0x1ff03e, wireframe: true } );
      //   this.debugMesh = new THREE.Mesh( geometry, material );
      //   this.debugMesh.rotation.x = -Math.PI / 2;
      //   scene.add(this.debugMesh);
      //   this.debugMesh.visible = false;
      // }

      // if(this.attackTarget) {
      //   if(this.attackTarget.hitTracker.hp <= 0) {

      //     this.attackTarget = null;
      //     this.moveTarget = null;
      //     this.debugMesh.visible = false;
      //     this.lastAttackTime = 0;
      //   }
      // }

      // if(this.attackTarget && localPlayer.avatar && this.inAttackRange) {
      //   this.debugMesh.material.color = new THREE.Color(0xff0000);
      //   this.debugMesh.position.copy(this.attackTarget.npcPlayer.position.clone().sub(new THREE.Vector3(0, this.attackTarget.npcPlayer.avatar.height, 0)));
      //   this.debugMesh.updateMatrixWorld();
      //   // this.debugMesh.visible = true;

      //   const wearApp = loadoutManager.getSelectedApp();
      //   if(!wearApp) {
      //     gameManager.selectLoadout(0);
      //   }

      //   if(wearApp) {
      //     if(!this.firstAttackTime) {
      //       gameManager.attackHack();
      //       this.firstAttackTime = timestamp;
      //       this.lastAttackTime = timestamp;
      //     }
      //     if((timestamp - this.lastAttackTime) > 1000) {
      //       const localPlayer = playersManager.getLocalPlayer();
      //       const useAction = localPlayer.getAction('use');
      //       if (useAction) {
      //         //gameManager.selectLoadout(0);
      //         const app = metaversefile.getAppByInstanceId(useAction.instanceId);
      //         app.dispatchEvent({
      //           type: 'use',
      //           use: false,
      //         });
      //         localPlayer.removeAction('use');
      //       }
      //       else {
      //         //gameManager.selectLoadout(0);
      //         gameManager.attackHack();
      //         this.lastAttackTime = timestamp;
      //       }
      //       //console.log("attack!", this.lastAttackTime);
      //     }
      //   }
      // }
      // else {
      //   const wearApp = loadoutManager.getSelectedApp();
      //   if(wearApp) {
      //     gameManager.selectLoadout(0);
      //   }
      //   this.debugMesh.material.color = new THREE.Color(0x1ff03e);
      //   this.attackMesh.visible = false;
      //   this.lastAttackTime = timestamp;
      //   this.firstAttackTime = null;
      // }

      // if(localPlayer.avatar && this.debugCircle) {
      //   this.debugCircle.position.copy(new THREE.Vector3(localPlayer.position.x, (localPlayer.position.y-localPlayer.avatar.height)+0.05, localPlayer.position.z));
      //   this.debugCircle.rotation.z = localPlayer.rotation.y;
      //   //this.debugCircle.rotateZ(0.1);
      //   this.debugCircle.updateMatrixWorld();
      // }

      // if(this.moveTarget && localPlayer) {
      //   if(!this.path) {
      //     this.path = this.getPath(localPlayer.position, this.moveTarget);
      //     //(this.path, "path");
      //   }
      //   else {
      //     if(this.attackTarget) {
      //       this.moveAndAttackTarget(this.attackTarget.npcPlayer.position, timeDiff);
      //     }
      //     else {
      //       this.traversePath(this.path, timeDiff);
      //     }
      //   }
      // }
    }
}
const scene2DManager = new Scene2DManager();
export default scene2DManager;
