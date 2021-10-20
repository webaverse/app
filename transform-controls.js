import * as THREE from 'three';
import {scene, sceneLowPriority} from './app-object.js';
import weaponsManager from './weapons-manager.js';
import TransformGizmo from './TransformGizmo.js';
import {capitalize} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localPlane = new THREE.Plane();

const TransformAxisConstraints = {
  X: new THREE.Vector3(1, 0, 0),
  Y: new THREE.Vector3(0, 1, 0),
  Z: new THREE.Vector3(0, 0, 1),
  XY: new THREE.Vector3(1, 1, 0),
  YZ: new THREE.Vector3(0, 1, 1),
  XZ: new THREE.Vector3(1, 0, 1),
  XYZ: new THREE.Vector3(1, 1, 1)
};

const loadPromise = (async () => {
  await TransformGizmo.load();

  transformControls.transformGizmo = new TransformGizmo();
  // transformGizmo.setTransformMode('Translate');
  // transformControls.transformGizmo.visible = false;
  sceneLowPriority.add(transformControls.transformGizmo);
  transformControls.setTransformMode('translate');
})();

// let binding = null;
const transformControls = {
  transformGizmo: null,
  planeNormal: new THREE.Vector3(),
  transformPlane: new THREE.Plane(),
  transformAxis: null,
  dragging: false,
  startMatrix: new THREE.Matrix4(),
  startMouseMatrix: new THREE.Matrix4(),
  waitForLoad() {
    return loadPromise;
  },
  setTransformMode(transformMode) {
    this.transformGizmo.setTransformMode(capitalize(transformMode));
  },
  getTransformMode() {
    return this.transformGizmo.transformMode.toLowerCase();
  },
  /* getBinding() {
    return binding;
  },
  bind(o) {
    if (o) {
      this.transformGizmo.position.copy(o.position);
      this.transformGizmo.quaternion.copy(o.quaternion);
      this.transformGizmo.scale.copy(o.scale);
      
    }
    binding = o;
  }, */
  handleMouseDown(raycaster) {
    this.transformAxis = this.transformGizmo.selectAxisWithRaycaster(raycaster);
    if (this.transformAxis) {
      console.log('yes transform axis');
      
      const axisInfo = this.transformGizmo.selectedAxis.axisInfo;
      this.planeNormal
        .copy(axisInfo.planeNormal)
        .applyQuaternion(this.transformGizmo.quaternion)
        .normalize();
      this.transformPlane.setFromNormalAndCoplanarPoint(this.planeNormal, this.transformGizmo.position);
      this.dragging = true;
      
      this.startMatrix.copy(this.transformGizmo.matrix);
      raycaster.ray.intersectPlane(this.transformPlane, localVector);
      this.startMouseMatrix.compose(
        localVector,
        localQuaternion.set(0, 0, 0, 1),
        localVector2.set(1, 1, 1)
      );
    } else {
      // console.log('no transform axis');
    }
  },
  handleMouseUp(raycaster) {
    this.dragging = false;
  },
  handleMouseMove(raycaster) {
    if (this.transformGizmo) {
      if (this.dragging) {
        /* this.transformRay.origin.setFromMatrixPosition(this.camera.matrixWorld);
        this.transformRay.direction
          .set(cursorPosition.x, cursorPosition.y, 0.5)
          .unproject(this.camera)
          .sub(this.transformRay.origin);
        this.transformRay.intersectPlane(this.transformPlane, this.planeIntersection); */

        raycaster.ray.intersectPlane(this.transformPlane, localVector);
        const endPosition = localVector;
        this.startMouseMatrix.decompose(
          localVector2,
          localQuaternion,
          localVector3
        );
        const startPosition = localVector2;
        const diffVector = localVector3.copy(endPosition)
          .sub(startPosition);
      
        this.transformGizmo.matrix.copy(this.startMatrix)
          .premultiply(
            localMatrix.compose(
              diffVector,
              localQuaternion.set(0, 0, 0, 1),
              localVector4.set(1, 1, 1)
            )
          );

        const constraint = TransformAxisConstraints[this.transformAxis];
      } else {
        this.transformGizmo.highlightHoveredAxis(raycaster);
      }
    }
  },
  update() {
    const mouseSelectedObject = weaponsManager.getMouseSelectedObject();
    this.transformGizmo.visible = !!mouseSelectedObject && !weaponsManager.contextMenu;
    if (this.transformGizmo.visible) {
      this.transformGizmo.position.copy(mouseSelectedObject.position);
      this.transformGizmo.quaternion.copy(mouseSelectedObject.quaternion);
      this.transformGizmo.scale.copy(mouseSelectedObject.scale);
    }
  },
};
export default transformControls;