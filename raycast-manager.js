import * as THREE from 'three';
import {getRenderer, camera} from './renderer.js';
import cameraManager from './camera-manager.js';
import {world} from './world.js';
// import physx from './physx.js';
import physicsManager from './physics-manager.js';
import domRenderer from './dom-renderer.jsx';
import transformControls from './transform-controls.js';

const localVector = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

//

const physicsScene = physicsManager.getScene();

//

class FakeMouseEvent {
  constructor(
    clientX = 0,
    clientY = 0,
    deltaX = 0,
    deltaY = 0,
    inside = false,
  ) {
    this.clientX = clientX;
    this.clientY = clientY;
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.inside = inside;
  }
}
class Collision {
  constructor() {
    this.app = null;
    this.physicsObject = null;
    this.physicsId = null;
    this.point = new THREE.Vector3();
    this.valid = false;
  }

  set(app, physicsObject, physicsId, point) {
    this.app = app;
    this.physicsObject = physicsObject;
    this.physicsId = physicsId;
    point && this.point.copy(point);
    this.valid = !!app;
  }
}

class RaycastManager extends EventTarget {
  constructor() {
    super();

    this.lastMouseEvent = new FakeMouseEvent();
    this.collision = new Collision();
    this.lastDomHover = false;
  }

  getLastMouseEvent() {
    return this.lastMouseEvent;
  }

  setLastMouseEvent(e) {
    if (e) {
      this.lastMouseEvent.clientX = e.clientX;
      this.lastMouseEvent.clientY = e.clientY;
      this.lastMouseEvent.deltaX = e.deltaX;
      this.lastMouseEvent.deltaY = e.deltaY;
      this.lastMouseEvent.inside = true;
    } else {
      this.lastMouseEvent.inside = false;
    }
  }

  getMouseRaycaster = (() => {
    const localVector2D = new THREE.Vector2();
    const localVector2D2 = new THREE.Vector2();
    const localRaycaster = new THREE.Raycaster();

    return function (e = this.lastMouseEvent) {
      const {clientX, clientY} = e;
      const renderer = getRenderer();
      if (renderer) {
        renderer.getSize(localVector2D2);
        localVector2D.set(
          (clientX / localVector2D2.x) * 2 - 1,
          -(clientY / localVector2D2.y) * 2 + 1,
        );
        if (
          localVector2D.x >= -1 &&
          localVector2D.x <= 1 &&
          localVector2D.y >= -1 &&
          localVector2D.y <= 1
        ) {
          /* const result = */ localRaycaster.setFromCamera(
            localVector2D,
            camera,
          );
          // console.log('return raycaster', result);
          return localRaycaster;
        } else {
          // console.log('out of range');
          return null;
        }
      } else {
        // console.log('no renderer');
        return null;
      }
    };
  })();

  getCenterEvent = (() => {
    const fakeCenterEvent = new FakeMouseEvent();
    const localVector2D2 = new THREE.Vector2();

    return function () {
      const renderer = getRenderer();
      if (renderer) {
        const size = renderer.getSize(localVector2D2);
        fakeCenterEvent.clientX = size.width / 2;
        fakeCenterEvent.clientY = size.height / 2;
        return fakeCenterEvent;
      } else {
        return null;
      }
    };
  })();

  getCollision() {
    return this.collision.valid ? this.collision : null;
  }

  update() {
    // console.log('update');

    // try {

    const mouseEvent = cameraManager.pointerLockElement
      ? this.getCenterEvent()
      : this.lastMouseEvent;

    let mouseHoverApp = null;
    let mouseHoverPhysicsObject = null;
    // let mouseSelectedObject = null;
    let mouseHoverPhysicsId = 0;
    // let htmlHover = false;
    let domHover = false;

    domRenderer.onBeforeRaycast();

    const raycaster = this.getMouseRaycaster(mouseEvent);
    let point = null;
    if (raycaster) {
      transformControls.handleMouseMove(raycaster);

      const position = raycaster.ray.origin;
      const quaternion = localQuaternion.setFromUnitVectors(
        localVector.set(0, 0, -1),
        raycaster.ray.direction,
      );

      const result = physicsScene.raycast(position, quaternion);
      if (result) {
        // console.log('raycast', result);

        // check world apps
        const pair = world.appManager.getPairByPhysicsId(result.objectId);
        if (pair) {
          const [app, physicsObject] = pair;
          point = localVector.fromArray(result.point);

          /* if (object.isHtml) {
            htmlHover = true;
          } else { */
          // if (game.hoverEnabled) {
          mouseHoverApp = app;
          mouseHoverPhysicsObject = physicsObject;
          mouseHoverPhysicsId = result.objectId;
          // }
          // }
        } else {
          // check dom renderer
          const object = domRenderer
            .getPhysicsObjects()
            .find(o => o.physicsId === result.objectId);
          if (object) {
            // console.log('got dom renderer object hit', object);
            // XXX
            domHover = true;
          }
        }
      }

      domRenderer.onAfterRaycast();
    } /* else {
      console.log('no result');
    } */
    this.collision.set(
      mouseHoverApp,
      mouseHoverPhysicsObject,
      mouseHoverPhysicsId,
      point,
    );
    /* const renderer = getRenderer();
    if (htmlHover) {
      renderer.domElement.classList.add('hover');
    } else {
      renderer.domElement.classList.remove('hover');
    } */

    // } catch (e) {
    //   debugger;
    // }
    if (domHover !== this.lastDomHover) {
      this.dispatchEvent(
        new MessageEvent('domhoverchange', {
          data: {
            domHover,
          },
        }),
      );
      this.lastDomHover = domHover;
    }
  }
}
const raycastManager = new RaycastManager();
export default raycastManager;
