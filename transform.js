import {
  Matrix3,
  Vector2,
  Vector3,
  Spherical,
  Box3,
  Raycaster,
  Sphere,
  Ray,
  Plane,
  Quaternion,
  Math as _Math,
  Layers,
  Object3D,
  Color,
} from 'https://static.xrpackage.org/xrpackage/three.module.js';
import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {GLTFLoader} from './GLTFLoader.js';

export const TransformSpace = {
  World: "World",
  Local: "Local",
  LocalSelection: "LocalSelection" // The local space of the last selected object
  // TODO: Viewport, Cursor?
};

const transformGizmoUrl = './TransformGizmo.glb';
let gizmoGltf = null;

export class TransformGizmo extends Object3D {
  static async load() {
    if (gizmoGltf) {
      return Promise.resolve(gizmoGltf);
    }

    const gltf = await new Promise((accept, reject) => {
      new GLTFLoader().load(transformGizmoUrl, accept, function onProgress() {}, reject);
    });

    gizmoGltf = gltf;

    return gizmoGltf;
  }

  constructor() {
    super();

    this.name = "TransformGizmo";

    if (!gizmoGltf) {
      throw new Error("TransformGizmo must be loaded before it can be used. Await TransformGizmo.load()");
    }

    this.model = gizmoGltf.scene; // cloneObject3D(gizmoGltf.scene);
    this.add(this.model);

    this.selectionColor = new Color().setRGB(1, 1, 1);
    this.previousColor = new Color();
    this.raycasterResults = [];

    this.translateControls = this.model.getObjectByName("TranslateControls");
    this.translateXAxis = this.translateControls.getObjectByName("TranslateXAxis");
    this.translateXAxis.axisInfo = {
      axis: TransformAxis.X,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.translateXAxis.material
    };
    this.translateYAxis = this.translateControls.getObjectByName("TranslateYAxis");
    this.translateYAxis.axisInfo = {
      axis: TransformAxis.Y,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.translateYAxis.material
    };
    this.translateZAxis = this.translateControls.getObjectByName("TranslateZAxis");
    this.translateZAxis.axisInfo = {
      axis: TransformAxis.Z,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.translateZAxis.material
    };
    this.translateXYPlane = this.translateControls.getObjectByName("TranslateXYPlane");
    this.translateXYPlane.axisInfo = {
      axis: TransformAxis.XY,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.translateXYPlane.material
    };
    this.translateYZPlane = this.translateControls.getObjectByName("TranslateYZPlane");
    this.translateYZPlane.axisInfo = {
      axis: TransformAxis.YZ,
      planeNormal: new Vector3(1, 0, 0),
      selectionColorTarget: this.translateYZPlane.material
    };
    this.translateXZPlane = this.translateControls.getObjectByName("TranslateXZPlane");
    this.translateXZPlane.axisInfo = {
      axis: TransformAxis.XZ,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.translateXZPlane.material
    };

    this.rotateControls = this.model.getObjectByName("RotateControls");
    this.rotateXAxis = this.rotateControls.getObjectByName("RotateXAxis");
    const rotateXAxisDisk = this.rotateXAxis.getObjectByName("RotateXAxisDisk");
    const rotateXAxisStart = this.rotateXAxis.getObjectByName("RotateXAxisStart");
    const rotateXAxisEnd = this.rotateXAxis.getObjectByName("RotateXAxisEnd");
    const localRotateXAxisStart = rotateXAxisStart.clone();
    rotateXAxisDisk.axisInfo = {
      axis: TransformAxis.X,
      planeNormal: new Vector3(1, 0, 0),
      rotationTarget: rotateXAxisDisk,
      startMarker: rotateXAxisStart,
      startMarkerLocal: localRotateXAxisStart,
      endMarker: rotateXAxisEnd,
      selectionColorTarget: rotateXAxisDisk.material
    };
    this.rotateYAxis = this.rotateControls.getObjectByName("RotateYAxis");
    const rotateYAxisDisk = this.rotateYAxis.getObjectByName("RotateYAxisDisk");
    const rotateYAxisStart = this.rotateYAxis.getObjectByName("RotateYAxisStart");
    const rotateYAxisEnd = this.rotateYAxis.getObjectByName("RotateYAxisEnd");
    const localRotateYAxisStart = rotateYAxisStart.clone();
    rotateYAxisDisk.axisInfo = {
      axis: TransformAxis.Y,
      planeNormal: new Vector3(0, 1, 0),
      rotationTarget: rotateYAxisDisk,
      startMarker: rotateYAxisStart,
      startMarkerLocal: localRotateYAxisStart,
      endMarker: rotateYAxisEnd,
      selectionColorTarget: rotateYAxisDisk.material
    };
    this.rotateZAxis = this.rotateControls.getObjectByName("RotateZAxis");
    const rotateZAxisDisk = this.rotateZAxis.getObjectByName("RotateZAxisDisk");
    const rotateZAxisStart = this.rotateZAxis.getObjectByName("RotateZAxisStart");
    const rotateZAxisEnd = this.rotateZAxis.getObjectByName("RotateZAxisEnd");
    const localRotateZAxisStart = rotateZAxisStart.clone();
    rotateZAxisDisk.axisInfo = {
      axis: TransformAxis.Z,
      planeNormal: new Vector3(0, 0, 1),
      rotationTarget: rotateZAxisDisk,
      startMarker: rotateZAxisStart,
      startMarkerLocal: localRotateZAxisStart,
      endMarker: rotateZAxisEnd,
      selectionColorTarget: rotateZAxisDisk.material
    };

    this.scaleControls = this.model.getObjectByName("ScaleControls");
    this.scaleXAxis = this.scaleControls.getObjectByName("ScaleXAxis");
    this.scaleXAxis.axisInfo = {
      axis: TransformAxis.X,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.scaleXAxis.material
    };
    this.scaleYAxis = this.scaleControls.getObjectByName("ScaleYAxis");
    this.scaleYAxis.axisInfo = {
      axis: TransformAxis.Y,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.scaleYAxis.material
    };
    this.scaleZAxis = this.scaleControls.getObjectByName("ScaleZAxis");
    this.scaleZAxis.axisInfo = {
      axis: TransformAxis.Z,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.scaleZAxis.material
    };
    this.scaleXYPlane = this.scaleControls.getObjectByName("ScaleXYPlane");
    this.scaleXYPlane.axisInfo = {
      axis: TransformAxis.XY,
      planeNormal: new Vector3(0, 0, 1),
      selectionColorTarget: this.scaleXYPlane.material
    };
    this.scaleYZPlane = this.scaleControls.getObjectByName("ScaleYZPlane");
    this.scaleYZPlane.axisInfo = {
      axis: TransformAxis.YZ,
      planeNormal: new Vector3(1, 0, 0),
      selectionColorTarget: this.scaleYZPlane.material
    };
    this.scaleXZPlane = this.scaleControls.getObjectByName("ScaleXZPlane");
    this.scaleXZPlane.axisInfo = {
      axis: TransformAxis.XZ,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.scaleXZPlane.material
    };
    this.scaleUniformHandle = this.scaleControls.getObjectByName("ScaleUniformHandle");
    this.scaleUniformHandle.axisInfo = {
      axis: TransformAxis.XYZ,
      planeNormal: new Vector3(0, 1, 0),
      selectionColorTarget: this.scaleUniformHandle.material
    };

    rotateXAxisStart.visible = false;
    rotateXAxisEnd.visible = false;
    rotateYAxisStart.visible = false;
    rotateYAxisEnd.visible = false;
    rotateZAxisStart.visible = false;
    rotateZAxisEnd.visible = false;
    this.translateControls.visible = false;
    this.rotateControls.visible = false;
    this.scaleControls.visible = false;

    this.transformMode = TransformMode.Disabled;

    /* this.model.traverse(obj => {
      if (obj.isMesh) {
        obj.layers.set(1);
        obj.material.depthTest = false;
        obj.material.depthWrite = false;
        obj.renderOrder = 100;
      }
    }); */
  }

  setTransformMode(transformMode) {
    this.transformMode = transformMode;

    this.translateControls.visible = false;
    this.rotateControls.visible = false;
    this.scaleControls.visible = false;

    switch (transformMode) {
      case TransformMode.Translate:
        this.translateControls.visible = true;
        this.activeControls = this.translateControls;
        break;
      case TransformMode.Rotate:
        this.rotateControls.visible = true;
        this.activeControls = this.rotateControls;
        break;
      case TransformMode.Scale:
        this.scaleControls.visible = true;
        this.activeControls = this.scaleControls;
        break;
      default:
        this.selectedAxis = undefined;
        this.activeControls = null;
        break;
    }
  }

  setLocalScaleHandlesVisible(visible) {
    this.scaleXAxis.visible = visible;
    this.scaleYAxis.visible = visible;
    this.scaleZAxis.visible = visible;
    this.scaleXYPlane.visible = visible;
    this.scaleYZPlane.visible = visible;
    this.scaleXZPlane.visible = visible;
  }

  selectAxisWithRaycaster(raycaster) {
    this.deselectAxis();

    if (!this.activeControls) {
      return undefined;
    }

    this.raycasterResults.length = 0;
    raycaster.intersectObject(this.activeControls, true, this.raycasterResults);

    const axisResult = this.raycasterResults.find(result => result.object.axisInfo !== undefined);

    if (!axisResult) {
      return undefined;
    }

    this.selectedAxis = axisResult.object;

    const newAxisInfo = this.selectedAxis.axisInfo;

    this.previousColor.copy(newAxisInfo.selectionColorTarget.color);
    newAxisInfo.selectionColorTarget.color.copy(this.selectionColor);

    if (newAxisInfo.rotationStartObject) {
      newAxisInfo.rotationStartObject.visible = true;
    }

    if (newAxisInfo.rotationEndObject) {
      newAxisInfo.rotationEndObject.visible = true;
    }

    return newAxisInfo.axis;
  }

  highlightHoveredAxis(raycaster) {
    if (!this.activeControls) {
      return undefined;
    }

    if (this.hoveredAxis) {
      this.hoveredAxis.axisInfo.selectionColorTarget.opacity = 0.5;
    }

    this.raycasterResults.length = 0;
    raycaster.intersectObject(this.activeControls, true, this.raycasterResults);

    const axisResult = this.raycasterResults.find(result => result.object.axisInfo !== undefined);

    if (!axisResult) {
      return undefined;
    }

    axisResult.object.axisInfo.selectionColorTarget.opacity = 1;
    this.hoveredAxis = axisResult.object;
  }

  deselectAxis() {
    if (this.selectedAxis) {
      const oldAxisInfo = this.selectedAxis.axisInfo;

      oldAxisInfo.selectionColorTarget.color.copy(this.previousColor);

      if (oldAxisInfo.rotationStartObject) {
        oldAxisInfo.rotationStartObject.visible = false;
      }

      if (oldAxisInfo.rotationEndObject) {
        oldAxisInfo.rotationEndObject.visible = false;
      }

      this.selectedAxis = undefined;
    }
  }

  clone() {
    // You can only have one instance of TransformControls so return a dummy object when cloning.
    return new Object3D().copy(this);
  }
}














export const SnapMode = {
  Disabled: "Disabled",
  Grid: "Grid"
};

export const TransformPivot = {
  Selection: "Selection",
  Center: "Center",
  Bottom: "Bottom"
};

export const TransformMode = {
  Disabled: "Disabled",
  Grab: "Grab",
  Placement: "Placement",
  Translate: "Translate",
  Rotate: "Rotate",
  Scale: "Scale"
};

export const TransformAxis = {
  X: "X",
  Y: "Y",
  Z: "Z",
  XY: "XY",
  YZ: "YZ",
  XZ: "XZ",
  XYZ: "XYZ"
};

export const TransformAxisConstraints = {
  X: new Vector3(1, 0, 0),
  Y: new Vector3(0, 1, 0),
  Z: new Vector3(0, 0, 1),
  XY: new Vector3(1, 1, 0),
  YZ: new Vector3(0, 1, 1),
  XZ: new Vector3(1, 0, 1),
  XYZ: new Vector3(1, 1, 1)
};

const viewDirection = new Vector3();

function sortDistance(a, b) {
  return a.distance - b.distance;
}

export class SpokeControls extends EventTarget {
  constructor(camera) {
    super();

    this.camera = camera;
    /* this.editor = editor;
    this.inputManager = inputManager;
    this.flyControls = flyControls; */
    /* this.inputManager = {
      get(k) {
        switch (k) {
          default:
            return null;
        }
      },
    }; */
    this.enabled = false;
    this.normalMatrix = new Matrix3();
    this.vector = new Vector3();
    this.delta = new Vector3();
    this.center = new Vector3();
    this.spherical = new Spherical();
    this.panSpeed = 1;
    this.zoomSpeed = 0.1;
    this.orbitSpeed = 5;
    this.lookSensitivity = 5;
    this.selectSensitivity = 0.001;
    this.boostSpeed = 4;
    this.moveSpeed = 4;
    /* this.initialLookSensitivity = flyControls.lookSensitivity;
    this.initialBoostSpeed = flyControls.boostSpeed;
    this.initialMoveSpeed = flyControls.moveSpeed; */
    this.distance = 0;
    this.maxFocusDistance = 1000;
    this.raycaster = new Raycaster();
    this.raycasterResults = [];
    // this.scene = editor.scene;
    this.box = new Box3();
    this.sphere = new Sphere();
    this.centerViewportPosition = new Vector2();
    this.raycastIgnoreLayers = new Layers();
    this.raycastIgnoreLayers.set(1);
    this.renderableLayers = new Layers();

    this.transformGizmo = new TransformGizmo();
    // this.editor.helperScene.add(this.transformGizmo);

    this.transformMode = TransformMode.Translate;
    this.multiplePlacement = false;
    this.transformModeOnCancel = TransformMode.Translate;
    this.transformSpace = TransformSpace.World;
    this.transformPivot = TransformPivot.Selection;
    this.transformAxis = null;
    this.grabHistoryCheckpoint = null;
    this.placementObjects = [];

    this.snapMode = SnapMode.Grid;
    this.translationSnap = 0.5;
    this.rotationSnap = 90;
    this.scaleSnap = 0.1;
    // this.editor.grid.setSize(this.translationSnap);

    this.selectionBoundingBox = new Box3();
    this.selectStartPosition = new Vector2();
    this.selectEndPosition = new Vector2();

    this.inverseGizmoQuaternion = new Quaternion();
    this.dragOffset = new Vector3();
    this.transformRay = new Ray();
    this.transformPlane = new Plane();
    this.planeIntersection = new Vector3();
    this.planeNormal = new Vector3();
    this.translationVector = new Vector3();
    this.initRotationDragVector = new Vector3();
    this.prevRotationAngle = 0;
    this.curRotationDragVector = new Vector3();
    this.normalizedInitRotationDragVector = new Vector3();
    this.normalizedCurRotationDragVector = new Vector3();

    this.initDragVector = new Vector3();
    this.dragVector = new Vector3();
    this.deltaDragVector = new Vector3();
    this.prevScale = new Vector3();
    this.curScale = new Vector3();
    this.scaleVector = new Vector3();

    this.dragging = false;
    this.selectionChanged = true;
    this.transformPropertyChanged = true;
    this.transformModeChanged = true;
    this.transformPivotChanged = true;
    this.transformSpaceChanged = true;

    this.flyStartTime = 0;
    this.flyModeSensitivity = 0.25;

    /* this.editor.addListener("beforeSelectionChanged", this.onBeforeSelectionChanged);
    this.editor.addListener("selectionChanged", this.onSelectionChanged);
    this.editor.addListener("objectsChanged", this.onObjectsChanged); */
  }

  onSceneSet = scene => {
    this.scene = scene;
  };

  onBeforeSelectionChanged = () => {
    if (this.transformMode === TransformMode.Grab) {
      const checkpoint = this.grabHistoryCheckpoint;
      this.setTransformMode(this.transformModeOnCancel);
      this.editor.revert(checkpoint);
    } else if (this.transformMode === TransformMode.Placement) {
      this.setTransformMode(this.transformModeOnCancel);
      this.editor.removeSelectedObjects();
    }
  };

  onSelectionChanged = () => {
    this.selectionChanged = true;
  };

  onObjectsChanged = (_objects, property) => {
    if (property === "position" || property === "rotation" || property === "scale" || property === "matrix") {
      this.transformPropertyChanged = true;
    }
  };

  enable() {
    this.enabled = true;
    // this.inputManager.enableInputMapping(Spoke, SpokeMapping);
  }

  disable() {
    this.enabled = false;
    // this.inputManager.disableInputMapping(Spoke);
  }

  update(_selectStart, _selectEnd, _cursorPosition, translateSelected, rotateAroundSelected, scaleSelected) {
    if (!this.enabled) return false;

    let mutated = false;

    const input = this.inputManager;

    /* if (input.get(Spoke.enableFlyMode)) {
      this.flyStartTime = performance.now();
      this.distance = this.camera.position.distanceTo(this.center);
    } else if (input.get(Spoke.disableFlyMode)) {
      this.flyControls.disable();
      this.flyControls.lookSensitivity = this.initialLookSensitivity;
      this.flyControls.boostSpeed = this.initialBoostSpeed;
      this.flyControls.moveSpeed = this.initialMoveSpeed;
      this.center.addVectors(
        this.camera.position,
        this.vector.set(0, 0, -this.distance).applyMatrix3(this.normalMatrix.getNormalMatrix(this.camera.matrix))
      );
      this.emit("flyModeChanged");

      if (performance.now() - this.flyStartTime < this.flyModeSensitivity * 1000) {
        this.cancel();
      }
    } */

    const flying = false; // input.get(Spoke.flying);

    /* if (flying && !this.flyControls.enabled && performance.now() - this.flyStartTime > 100) {
      this.flyControls.enable();
      this.initialLookSensitivity = this.flyControls.lookSensitivity;
      this.initialMoveSpeed = this.flyControls.moveSpeed;
      this.initialBoostSpeed = this.flyControls.boostSpeed;
      this.flyControls.lookSensitivity = this.lookSensitivity;
      this.flyControls.moveSpeed = this.moveSpeed;
      this.flyControls.boostSpeed = this.boostSpeed;
      this.emit("flyModeChanged");
    } */

    const shift = false; // input.get(Spoke.shift);

    const selected = null; // this.editor.selected;
    const selectedTransformRoots = null; // this.editor.selectedTransformRoots;

    const modifier = null; // input.get(Spoke.modifier);

    let grabStart = false;

    if (this.transformModeChanged) {
      this.transformGizmo.setTransformMode(this.transformMode);

      if (this.transformMode === TransformMode.Grab || this.transformMode === TransformMode.Placement) {
        grabStart = true;
      }
    }

    const selectStart =
      _selectStart && // input.get(Spoke.selectStart) &&
      !flying &&
      this.transformMode !== TransformMode.Grab &&
      this.transformMode !== TransformMode.Placement;

    /* if (selectedTransformRoots.length > 0 && this.transformMode !== TransformMode.Disabled) {
      const lastSelectedObject = selected[selected.length - 1];

      if (
        this.selectionChanged ||
        this.transformModeChanged ||
        this.transformPivotChanged ||
        this.transformPropertyChanged
      ) {
        if (this.transformPivot === TransformPivot.Selection) {
          lastSelectedObject.getWorldPosition(this.transformGizmo.position);
        } else {
          this.selectionBoundingBox.makeEmpty();

          for (let i = 0; i < selectedTransformRoots.length; i++) {
            this.selectionBoundingBox.expandByObject(selectedTransformRoots[i]);
          }

          if (this.transformPivot === TransformPivot.Center) {
            this.selectionBoundingBox.getCenter(this.transformGizmo.position);
          } else {
            this.transformGizmo.position.x = (this.selectionBoundingBox.max.x + this.selectionBoundingBox.min.x) / 2;
            this.transformGizmo.position.y = this.selectionBoundingBox.min.y;
            this.transformGizmo.position.z = (this.selectionBoundingBox.max.z + this.selectionBoundingBox.min.z) / 2;
          }
        }
      }

      if (
        this.selectionChanged ||
        this.transformModeChanged ||
        this.transformSpaceChanged ||
        this.transformPropertyChanged
      ) {
        if (this.transformSpace === TransformSpace.LocalSelection) {
          lastSelectedObject.getWorldQuaternion(this.transformGizmo.quaternion);
        } else {
          this.transformGizmo.rotation.set(0, 0, 0);
        }

        this.inverseGizmoQuaternion.copy(this.transformGizmo.quaternion).inverse();
      }

      if ((this.transformModeChanged || this.transformSpaceChanged) && this.transformMode === TransformMode.Scale) {
        this.transformGizmo.setLocalScaleHandlesVisible(this.transformSpace !== TransformSpace.World);
      }

      this.transformGizmo.visible = true;
    } else {
      this.transformGizmo.visible = false;
    } */

    this.selectionChanged = false;
    this.transformModeChanged = false;
    this.transformPivotChanged = false;
    this.transformSpaceChanged = false;

    // Set up the transformRay
    const cursorPosition = _cursorPosition; // input.get(Spoke.cursorPosition);

    if (selectStart) {
      const selectStartPosition = _cursorPosition; // input.get(Spoke.selectStartPosition);
      this.selectStartPosition.copy(selectStartPosition);

      this.raycaster.setFromCamera(selectStartPosition, this.camera);

      if (this.transformGizmo.activeControls) {
        this.transformAxis = this.transformGizmo.selectAxisWithRaycaster(this.raycaster);

        if (this.transformAxis) {
          const axisInfo = this.transformGizmo.selectedAxis.axisInfo;
          this.planeNormal
            .copy(axisInfo.planeNormal)
            .applyQuaternion(this.transformGizmo.quaternion)
            .normalize();
          this.transformPlane.setFromNormalAndCoplanarPoint(this.planeNormal, this.transformGizmo.position);
          this.dragging = true;
        } else {
          this.dragging = false;
        }
      }
    } else if (this.transformGizmo.activeControls && !this.dragging) {
      this.raycaster.setFromCamera(cursorPosition, this.camera);
      this.transformGizmo.highlightHoveredAxis(this.raycaster);
    }

    const selectEnd = _selectEnd; // input.get(Spoke.selectEnd) === 1;

    if ((this.dragging || this.transformMode === TransformMode.Grab || this.transformMode === TransformMode.Placement) && cursorPosition) {
      let constraint;

      if (this.transformMode === TransformMode.Grab || this.transformMode === TransformMode.Placement) {
        this.getRaycastPosition(
          flying ? this.centerViewportPosition : cursorPosition,
          this.planeIntersection,
          modifier
        );
        constraint = TransformAxisConstraints.XYZ;
      } else {
        this.transformRay.origin.setFromMatrixPosition(this.camera.matrixWorld);
        this.transformRay.direction
          .set(cursorPosition.x, cursorPosition.y, 0.5)
          .unproject(this.camera)
          .sub(this.transformRay.origin);
        this.transformRay.intersectPlane(this.transformPlane, this.planeIntersection);

        constraint = TransformAxisConstraints[this.transformAxis];
      }

      if (!constraint) {
        console.warn(
          `Axis Constraint is undefined. transformAxis was ${this.transformAxis} transformMode was ${this.transformMode} dragging was ${this.dragging}`
        );
      }

      if (selectStart) {
        this.dragOffset.subVectors(this.transformGizmo.position, this.planeIntersection);
      } else if (grabStart) {
        this.dragOffset.set(0, 0, 0);
      }

      this.planeIntersection.add(this.dragOffset);

      if (
        this.transformMode === TransformMode.Translate ||
        this.transformMode === TransformMode.Grab ||
        this.transformMode === TransformMode.Placement
      ) {
        this.translationVector
          .subVectors(this.planeIntersection, this.transformGizmo.position)
          .applyQuaternion(this.inverseGizmoQuaternion)
        const old = this.translationVector.clone();
        this.translationVector
          .multiply(constraint);
        if (old.distanceTo(this.translationVector) > 1) {
          this.translationVector.set(0, 0, 0);
        }

        this.translationVector.applyQuaternion(this.transformGizmo.quaternion);

        this.transformGizmo.position.add(this.translationVector);

        if (this.shouldSnap(modifier)) {
          const transformPosition = this.transformGizmo.position;

          const prevX = transformPosition.x;
          const prevY = transformPosition.y;
          const prevZ = transformPosition.z;

          const transformedConstraint = new Vector3().copy(constraint).applyQuaternion(this.transformGizmo.quaternion);

          transformPosition.set(
            transformedConstraint.x !== 0
              ? Math.round(transformPosition.x / this.translationSnap) * this.translationSnap
              : transformPosition.x,
            transformedConstraint.y !== 0
              ? Math.round(transformPosition.y / this.translationSnap) * this.translationSnap
              : transformPosition.y,
            transformedConstraint.z !== 0
              ? Math.round(transformPosition.z / this.translationSnap) * this.translationSnap
              : transformPosition.z
          );

          const diffX = transformPosition.x - prevX;
          const diffY = transformPosition.y - prevY;
          const diffZ = transformPosition.z - prevZ;

          this.translationVector.set(
            this.translationVector.x + diffX,
            this.translationVector.y + diffY,
            this.translationVector.z + diffZ
          );
        }

        translateSelected && translateSelected(this.translationVector, this.transformSpace);
        mutated = true;

        if (grabStart && this.transformMode === TransformMode.Grab) {
          this.grabHistoryCheckpoint = cmd.id;
        }
      } else if (this.transformMode === TransformMode.Rotate) {
        if (selectStart) {
          this.initRotationDragVector
            .subVectors(this.planeIntersection, this.dragOffset)
            .sub(this.transformGizmo.position);
          this.prevRotationAngle = 0;
        }

        this.curRotationDragVector
          .subVectors(this.planeIntersection, this.dragOffset)
          .sub(this.transformGizmo.position);
        this.normalizedInitRotationDragVector.copy(this.initRotationDragVector).normalize();
        this.normalizedCurRotationDragVector.copy(this.curRotationDragVector).normalize();

        let rotationAngle = this.curRotationDragVector.angleTo(this.initRotationDragVector);

        rotationAngle *=
          this.normalizedInitRotationDragVector.cross(this.normalizedCurRotationDragVector).dot(this.planeNormal) > 0
            ? 1
            : -1;

        if (this.shouldSnap(modifier)) {
          const rotationSnapAngle = _Math.DEG2RAD * this.rotationSnap;
          rotationAngle = Math.round(rotationAngle / rotationSnapAngle) * rotationSnapAngle;
        }

        const relativeRotationAngle = rotationAngle - this.prevRotationAngle;

        this.prevRotationAngle = rotationAngle;

        rotateAroundSelected && rotateAroundSelected(this.transformGizmo.position, this.planeNormal, relativeRotationAngle);
        mutated = true;

        const selectedAxisInfo = this.transformGizmo.selectedAxis.axisInfo;

        if (selectStart && selectedAxisInfo.startMarker && selectedAxisInfo.endMarker) {
          selectedAxisInfo.startMarker.visible = true;
          selectedAxisInfo.endMarker.visible = true;

          if (this.transformSpace !== TransformSpace.World) {
            const startMarkerLocal = selectedAxisInfo.startMarkerLocal;
            startMarkerLocal.position.copy(this.transformGizmo.position);
            startMarkerLocal.quaternion.copy(this.transformGizmo.quaternion);
            startMarkerLocal.scale.copy(this.transformGizmo.scale);
            this.scene.add(startMarkerLocal);
          }
        }

        if (this.transformSpace === TransformSpace.World) {
          if (!selectedAxisInfo.rotationTarget) {
            return;
            throw new Error(
              `Couldn't rotate object due to an unknown error. The selected axis is ${
                this.transformGizmo.selectedAxis.name
              } The selected axis info is: ${JSON.stringify(selectedAxisInfo)}`
            );
          }

          selectedAxisInfo.rotationTarget.rotateOnAxis(selectedAxisInfo.planeNormal, relativeRotationAngle);
        } else {
          this.transformGizmo.rotateOnAxis(selectedAxisInfo.planeNormal, relativeRotationAngle);
        }

        if (selectEnd) {
          selectedAxisInfo.startMarker.visible = false;
          selectedAxisInfo.endMarker.visible = false;
          selectedAxisInfo.rotationTarget.rotation.set(0, 0, 0);

          if (this.transformSpace !== TransformSpace.World) {
            const startMarkerLocal = selectedAxisInfo.startMarkerLocal;
            this.scene.remove(startMarkerLocal);
          }
        }
      } else if (this.transformMode === TransformMode.Scale) {
        this.dragVector
          .copy(this.planeIntersection)
          .applyQuaternion(this.inverseGizmoQuaternion)
          .multiply(constraint);

        if (selectStart) {
          this.initDragVector.copy(this.dragVector);
          this.prevScale.set(1, 1, 1);
        }

        this.deltaDragVector.subVectors(this.dragVector, this.initDragVector);
        this.deltaDragVector.multiply(constraint);

        let scaleFactor;

        if (this.transformAxis === TransformAxis.XYZ) {
          scaleFactor =
            1 +
            this.camera
              .getWorldDirection(viewDirection)
              .applyQuaternion(this.transformGizmo.quaternion)
              .dot(this.deltaDragVector);
        } else {
          scaleFactor = 1 + constraint.dot(this.deltaDragVector);
        }

        this.curScale.set(
          constraint.x === 0 ? 1 : scaleFactor,
          constraint.y === 0 ? 1 : scaleFactor,
          constraint.z === 0 ? 1 : scaleFactor
        );

        if (this.shouldSnap(modifier)) {
          this.curScale
            .divideScalar(this.scaleSnap)
            .round()
            .multiplyScalar(this.scaleSnap);
        }

        this.curScale.set(
          this.curScale.x <= 0 ? Number.EPSILON : this.curScale.x,
          this.curScale.y <= 0 ? Number.EPSILON : this.curScale.y,
          this.curScale.z <= 0 ? Number.EPSILON : this.curScale.z
        );

        this.scaleVector.copy(this.curScale).divide(this.prevScale);
        this.prevScale.copy(this.curScale);
        scaleSelected && scaleSelected(this.scaleVector, this.transformSpace);
        mutated = true;
      }
    }

    if (selectEnd) {
      if (this.transformMode === TransformMode.Grab || this.transformMode === TransformMode.Placement) {
        if (this.transformMode === TransformMode.Grab) {
          if (shift || input.get(Fly.boost)) {
            this.setTransformMode(TransformMode.Placement);
          } else {
            this.setTransformMode(this.transformModeOnCancel);
          }
        }

        if (this.transformMode === TransformMode.Placement) {
          if (shift || input.get(Fly.boost) || this.multiplePlacement) {
            this.editor.duplicateSelected(undefined, undefined, true, true, false);
          } else {
            this.setTransformMode(this.transformModeOnCancel);
          }
        }
      } else {
        const selectEndPosition = _cursorPosition; // input.get(Spoke.selectEndPosition);

        /* if (this.selectStartPosition.distanceTo(selectEndPosition) < this.selectSensitivity) {
          const result = this.raycastNode(selectEndPosition);

          if (result) {
            if (shift) {
              this.editor.toggleSelection(result.node);
            } else {
              this.editor.setSelection([result.node]);
            }
          } else if (!shift) {
            this.editor.deselectAll();
          }
        } */

        this.transformGizmo.deselectAxis();
        this.dragging = false;
      }
    }

    /* this.transformPropertyChanged = false;

    if (input.get(Spoke.rotateLeft)) {
      this.editor.rotateAroundSelected(
        this.transformGizmo.position,
        new Vector3(0, 1, 0),
        this.rotationSnap * _Math.DEG2RAD
      );
    } else if (input.get(Spoke.rotateRight)) {
      this.editor.rotateAroundSelected(
        this.transformGizmo.position,
        new Vector3(0, 1, 0),
        -this.rotationSnap * _Math.DEG2RAD
      );
    } else if (input.get(Spoke.grab)) {
      if (this.transformMode === TransformMode.Grab || this.transformMode === TransformMode.Placement) {
        this.cancel();
      }

      if (this.editor.selected.length > 0) {
        this.setTransformMode(TransformMode.Grab);
      }
    } else if (input.get(Spoke.cancel)) {
      this.cancel();
    } else if (input.get(Spoke.focusSelection)) {
      this.focus(this.editor.selected);
    } else if (input.get(Spoke.setTranslateMode)) {
      this.setTransformMode(TransformMode.Translate);
    } else if (input.get(Spoke.setRotateMode)) {
      this.setTransformMode(TransformMode.Rotate);
    } else if (input.get(Spoke.setScaleMode)) {
      this.setTransformMode(TransformMode.Scale);
    } else if (input.get(Spoke.toggleSnapMode)) {
      this.toggleSnapMode();
    } else if (input.get(Spoke.toggleTransformPivot)) {
      this.changeTransformPivot();
    } else if (input.get(Spoke.toggleTransformSpace)) {
      this.toggleTransformSpace();
    } else if (input.get(Spoke.incrementGridHeight)) {
      this.editor.incrementGridHeight();
    } else if (input.get(Spoke.decrementGridHeight)) {
      this.editor.decrementGridHeight();
    } else if (input.get(Spoke.undo)) {
      this.editor.undo();
    } else if (input.get(Spoke.redo)) {
      this.editor.redo();
    } else if (input.get(Spoke.duplicateSelected)) {
      this.editor.duplicateSelected();
    } else if (input.get(Spoke.groupSelected)) {
      this.editor.groupSelected();
    } else if (input.get(Spoke.deleteSelected)) {
      this.editor.removeSelectedObjects();
    } else if (input.get(Spoke.saveProject)) {
      // TODO: Move save to Project class
      this.editor.emit("saveProject");
    }

    if (flying) {
      this.updateTransformGizmoScale();
      return;
    }

    const selecting = input.get(Spoke.selecting);

    const orbiting = selecting && !this.dragging;

    const zoomDelta = input.get(Spoke.zoomDelta);

    const cursorDeltaX = input.get(Spoke.cursorDeltaX);
    const cursorDeltaY = input.get(Spoke.cursorDeltaY);

    if (zoomDelta !== 0) {
      const camera = this.camera;
      const delta = this.delta;
      const center = this.center;

      delta.set(0, 0, zoomDelta);

      const distance = camera.position.distanceTo(center);

      delta.multiplyScalar(distance * this.zoomSpeed);

      if (delta.length() > distance) return;

      delta.applyMatrix3(this.normalMatrix.getNormalMatrix(camera.matrix));

      camera.position.add(delta);
    } else if (input.get(Spoke.focus)) {
      const result = this.raycastNode(input.get(Spoke.focusPosition));

      if (result) {
        this.focus([result.node]);
      }
    } else if (input.get(Spoke.panning)) {
      const camera = this.camera;
      const delta = this.delta;
      const center = this.center;

      const distance = camera.position.distanceTo(center);

      delta
        .set(cursorDeltaX, -cursorDeltaY, 0)
        .multiplyScalar(distance * this.panSpeed)
        .applyMatrix3(this.normalMatrix.getNormalMatrix(this.camera.matrix));

      camera.position.add(delta);
      center.add(delta);
    } else if (orbiting) {
      const camera = this.camera;
      const center = this.center;
      const vector = this.vector;
      const spherical = this.spherical;

      vector.copy(camera.position).sub(center);

      spherical.setFromVector3(vector);

      spherical.theta += cursorDeltaX * this.orbitSpeed;
      spherical.phi += cursorDeltaY * this.orbitSpeed;

      spherical.makeSafe();

      vector.setFromSpherical(spherical);

      camera.position.copy(center).add(vector);

      camera.lookAt(center);
    }

    this.updateTransformGizmoScale(); */

    return mutated;
  }

  raycastNode(coords) {
    return null;
    this.raycaster.setFromCamera(coords, this.camera);
    this.raycasterResults.length = 0;
    this.raycaster.intersectObject(this.scene, true, this.raycasterResults);
    return getIntersectingNode(this.raycasterResults, this.scene);
  }

  focus(objects) {
    const box = this.box;
    const center = this.center;
    const delta = this.delta;
    const camera = this.camera;

    let distance = 0;

    if (objects.length === 0) {
      center.set(0, 0, 0);
      distance = 10;
    } else {
      box.makeEmpty();

      for (const object of objects) {
        box.expandByObject(object);
      }

      if (box.isEmpty() === false) {
        box.getCenter(center);
        distance = box.getBoundingSphere(this.sphere).radius;
      } else {
        // Focusing on an Group, AmbientLight, etc
        center.setFromMatrixPosition(objects[0].matrixWorld);
        distance = 0.1;
      }
    }

    delta.set(0, 0, 1);
    delta.applyQuaternion(camera.quaternion);
    delta.multiplyScalar(Math.min(distance, this.maxFocusDistance) * 4);

    camera.position.copy(center).add(delta);
  }

  updateTransformGizmoScale() {
    const eyeDistance = this.transformGizmo.position.distanceTo(this.camera.position);
    this.transformGizmo.scale.set(1, 1, 1).multiplyScalar(eyeDistance / 5);
  }

  _raycastRecursive(object, excludeObjects, excludeLayers) {
    if (
      (excludeObjects && excludeObjects.indexOf(object) !== -1) ||
      (excludeLayers && excludeLayers.test(object.layers)) ||
      (this.editor.renderer.batchManager && this.editor.renderer.batchManager.batches.indexOf(object) !== -1) ||
      !object.visible
    ) {
      return;
    }

    this.raycaster.intersectObject(object, false, this.raycasterResults);

    const children = object.children;

    for (let i = 0; i < children.length; i++) {
      this._raycastRecursive(children[i], excludeObjects, excludeLayers);
    }
  }

  getRaycastPosition(coords, target, modifier) {
    this.raycaster.setFromCamera(coords, this.camera);
    this.raycasterResults.length = 0;
    this._raycastRecursive(this.scene, this.editor.selectedTransformRoots, this.raycastIgnoreLayers);
    this._raycastRecursive(this.editor.grid);
    this.raycasterResults.sort(sortDistance);
    const result = this.raycasterResults[0];

    if (result && result.distance < 100) {
      target.copy(result.point);
    } else {
      this.raycaster.ray.at(10, target);
    }

    if (this.shouldSnap(modifier)) {
      const translationSnap = this.translationSnap;

      target.set(
        Math.round(target.x / translationSnap) * translationSnap,
        Math.round(target.y / translationSnap) * translationSnap,
        Math.round(target.z / translationSnap) * translationSnap
      );
    }
  }

  setTransformMode(mode, multiplePlacement) {
    if (
      (mode === TransformMode.Placement || mode === TransformMode.Grab) &&
      this.editor.selected.some(node => node.disableTransform) // TODO: this doesn't prevent nesting and then grabbing
    ) {
      // Dont allow grabbing / placing objects with transform disabled.
      return;
    }

    if (mode !== TransformMode.Placement && mode !== TransformMode.Grab) {
      this.transformModeOnCancel = mode;
    }

    if (mode === TransformMode.Placement) {
      this.placementObjects = this.editor.selected.slice(0);
    } else {
      this.placementObjects = [];
    }

    this.multiplePlacement = multiplePlacement || false;

    this.grabHistoryCheckpoint = null;
    this.transformMode = mode;
    this.transformModeChanged = true;
    // this.emit("transformModeChanged", mode);
  }

  setTransformSpace(transformSpace) {
    this.transformSpace = transformSpace;
    this.transformSpaceChanged = true;
    // this.emit("transformSpaceChanged");
  }

  toggleTransformSpace() {
    this.setTransformSpace(
      this.transformSpace === TransformSpace.World ? TransformSpace.LocalSelection : TransformSpace.World
    );
  }

  setTransformPivot(pivot) {
    this.transformPivot = pivot;
    this.transformPivotChanged = true;
    this.emit("transformPivotChanged");
  }

  transformPivotModes = [TransformPivot.Selection, TransformPivot.Center, TransformPivot.Bottom];

  changeTransformPivot() {
    const curPivotModeIndex = this.transformPivotModes.indexOf(this.transformPivot);
    const nextPivotModeIndex = (curPivotModeIndex + 1) % this.transformPivotModes.length;
    this.setTransformPivot(this.transformPivotModes[nextPivotModeIndex]);
  }

  setSnapMode(snapMode) {
    this.snapMode = snapMode;
    this.emit("snapSettingsChanged");
  }

  toggleSnapMode() {
    this.setSnapMode(this.snapMode === SnapMode.Disabled ? SnapMode.Grid : SnapMode.Disabled);
  }

  shouldSnap(invertSnap = false) {
    return invertSnap;
    return (this.snapMode === SnapMode.Grid) === !invertSnap;
  }

  setTranslationSnap(value) {
    this.translationSnap = value;
    this.editor.grid.setSize(value);
    this.emit("snapSettingsChanged");
  }

  setScaleSnap(value) {
    this.scaleSnap = value;
    this.emit("snapSettingsChanged");
  }

  setRotationSnap(value) {
    this.rotationSnap = value;
    this.emit("snapSettingsChanged");
  }

  cancel() {
    if (this.transformMode === TransformMode.Grab) {
      const checkpoint = this.grabHistoryCheckpoint;
      this.setTransformMode(this.transformModeOnCancel);
      this.editor.revert(checkpoint);
    } else if (this.transformMode === TransformMode.Placement) {
      this.setTransformMode(this.transformModeOnCancel);
      this.editor.removeSelectedObjects();
    }

    this.editor.deselectAll();
  }
}