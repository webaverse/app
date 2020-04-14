// import {EventTarget} from './Event.js';
import * as THREE from './three.module.js';
import symbols from './symbols.js';
/* const {
  nativeWindow,
  nativeOculusVR,
  nativeOpenVR,
  nativeOculusMobileVr,
  nativeMl,
} = require('./native-bindings.js'); */
import GlobalContext from './GlobalContext.js';

const xrToVrButtonMappings = [
  1, // trigger
  2, // grip
  0, // pad
  3,
  4,
  5,
  6,
  7,
  8,
  9,
];

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localXrOffsetMatrix = new THREE.Matrix4();
const localXrOffsetMatrix2 = new THREE.Matrix4();

class VRPose {
  constructor() {
    this.position = new Float32Array(3);
    this.orientation = new Float32Array(4);
  }

  /* set(position, orientation) {
    position.toArray(this.position);
    orientation.toArray(this.orientation);
  } */

  /* copy(vrPose) {
    if (this.position) {
      this.position.set(vrPose.position);
    }
    if (this.orientation) {
      this.orientation.set(vrPose.orientation);
    }
  } */
}
class VRFrameData {
  constructor() {
    this.leftProjectionMatrix = new Float32Array(16);
    this.leftViewMatrix = new Float32Array(16);
    this.rightProjectionMatrix = new Float32Array(16);
    this.rightViewMatrix = new Float32Array(16);

    this.pose = new VRPose();
  }
}
class GamepadButton {
  constructor(_value, _pressed, _touched) {
    this._value = _value;
    this._pressed = _pressed;
    this._touched = _touched;
  }

  get value() {
    return this._value[0];
  }
  set value(value) {
    this._value[0] = value;
  }
  get pressed() {
    return this._pressed[0] !== 0;
  }
  set pressed(pressed) {
    this._pressed[0] = pressed ? 1 : 0;
  }
  get touched() {
    return this._touched[0] !== 0;
  }
  set touched(touched) {
    this._touched[0] = touched ? 1 : 0;
  }

  /* copy(button) {
    this.value = button.value;
    this.pressed = button.pressed;
    this.touched = button.touched;
  } */
}
class GamepadPose {
  constructor() {
    this.hasPosition = true;
    this.hasOrientation = true;
    this.position = new Float32Array(3);
    this.linearVelocity = new Float32Array(3);
    this.linearAcceleration = new Float32Array(3);
    this.orientation = Float32Array.from([0, 0, 0, 1]);
    this.angularVelocity = new Float32Array(3);
    this.angularAcceleration = new Float32Array(3);
  }

  /* copy(pose) {
    this.hasPosition = pose.hasPosition;
    this.hasOrientation = pose.hasOrientation;
    this.position.set(pose.position);
    this.linearVelocity.set(pose.linearVelocity);
    this.linearAcceleration.set(pose.linearAcceleration);
    this.orientation.set(pose.orientation);
    this.angularVelocity.set(pose.angularVelocity);
    this.angularAcceleration.set(pose.angularAcceleration);
  } */
}
class GamepadHapticActuator {
  constructor(index) {
    this.index = index;
  }
  get type() {
    return 'vibration';
  }
  set type(type) {}
  pulse(value, duration) {
    self._postMessageUp({
      method: 'emit',
      type: 'hapticPulse',
      event: {
        index: this.index,
        value,
        duration,
      },
    });
  }
}
class Gamepad {
  constructor(index, id, hand, xrGamepad, hapticActuator) {
    this.index = index;
    this.id = id;
    this.hand = hand;
    this._xrGamepad = xrGamepad;

    this.mapping = 'standard';
    this.buttons = (() => {
      const result = Array(xrGamepad.buttons.length);
      for (let i = 0; i < result.length; i++) {
        result[i] = new GamepadButton(xrGamepad.buttons[i].value, xrGamepad.buttons[i].pressed, xrGamepad.buttons[i].touched);
      }
      return result;
    })();
    this.pose = new GamepadPose();
    this.axes = xrGamepad.axes;
    this.hapticActuators = hapticActuator ? [hapticActuator] : [];
    // this.bones = xrGamepad.bones;
  }

  get connected() {
    return this._xrGamepad.connected[0] !== 0;
  }
  set connected(connected) {
    this._xrGamepad.connected[0] = connected ? 1 : 0;
  }

  setVRButtons() {
    const {_xrGamepad: xrGamepad} = this;
    this.buttons = (() => {
      const result = Array(xrGamepad.buttons.length);
      for (let i = 0; i < result.length; i++) {
        result[xrToVrButtonMappings[i]] = new GamepadButton(xrGamepad.buttons[i].value, xrGamepad.buttons[i].pressed, xrGamepad.buttons[i].touched);
      }
      return result;
    })();
  }

  /* copy(gamepad) {
    this.connected = gamepad.connected;
    for (let i = 0; i < this.buttons.length; i++) {
      this.buttons[i].copy(gamepad.buttons[i]);
    }
    this.pose.copy(gamepad.pose);
    this.axes.set(gamepad.axes);
  } */
}
class VRStageParameters {
  constructor() {
    // new THREE.Matrix4().compose(new THREE.Vector3(0, 0, 0), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)).toArray(new Float32Array(16))
    this.sittingToStandingTransform = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /* copy(vrStageParameters) {
    this.sittingToStandingTransform.set(vrStageParameters.sittingToStandingTransform);
  } */
}

let localOffsetEpoch = 0;
const identityMatrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const _isIdentityMatrix = matrix => {
  for (let i = 0; i < 16; i++) {
    if (matrix[i] !== identityMatrix[i]) {
      return false;
    }
  }
  return true;
};
function getXrOffsetMatrix() {
  const offsetEpoch = GlobalContext.xrState.offsetEpoch[0];
  if (localOffsetEpoch !== offsetEpoch) {
    let win = window;
    localXrOffsetMatrix.fromArray(win.document.xrOffset.matrix);
    !_isIdentityMatrix(win.document.parentXrOffset.matrix) && localXrOffsetMatrix.premultiply(localXrOffsetMatrix2.fromArray(win.document.parentXrOffset.matrix));
    for (win = win.parent; win.parent !== win; win = win.parent) {
      !_isIdentityMatrix(win.document.xrOffset.matrix) && localXrOffsetMatrix.premultiply(localXrOffsetMatrix2.fromArray(win.document.xrOffset.matrix));
      !_isIdentityMatrix(win.document.parentXrOffset.matrix) && localXrOffsetMatrix.premultiply(localXrOffsetMatrix2.fromArray(win.document.parentXrOffset.matrix));
    }
    localOffsetEpoch = offsetEpoch;
  }
  return localXrOffsetMatrix;
}
GlobalContext.getXrOffsetMatrix = getXrOffsetMatrix;

class VRDisplay extends EventTarget {
  constructor() {
    super();
    this.init();
  }

  init() {
    this.displayName = 'OpenVR';
    // this.window = window;

    this.isConnected = true;
    this.isPresenting = false;
    this.capabilities = {
      canPresent: true,
      hasExternalDisplay: true,
      hasPosition: true,
      maxLayers: 1,
    };
    this.stageParameters = new VRStageParameters();

    this.onrequestpresent = null;
    this.onmakeswapchain = null;
    this.onexitpresent = null;
    this.onrequestanimationframe = null;
    this.onvrdisplaypresentchange = null;

    // this._frameData = new VRFrameData();
    this._rafs = [];
    this._layers = [];
  }
  getFrameData(frameData) {
    const xrOffsetMatrix = getXrOffsetMatrix();

    // left
    localMatrix
      .fromArray(GlobalContext.xrState.leftViewMatrix)
      .multiply(
        xrOffsetMatrix
      )
      .toArray(frameData.leftViewMatrix);
    // right
    localMatrix
      .fromArray(GlobalContext.xrState.rightViewMatrix)
      .multiply(
        xrOffsetMatrix
      )
      .toArray(frameData.rightViewMatrix);
    // pose
    localMatrix
      .compose(localVector.fromArray(GlobalContext.xrState.position), localQuaternion.fromArray(GlobalContext.xrState.orientation), localVector2.set(1, 1, 1))
      .premultiply(
        localMatrix2.getInverse(xrOffsetMatrix)
      )
      .decompose(localVector, localQuaternion, localVector2);
    localVector.toArray(frameData.pose.position);
    localQuaternion.toArray(frameData.pose.orientation);

    frameData.leftProjectionMatrix.set(GlobalContext.xrState.leftProjectionMatrix);
    frameData.rightProjectionMatrix.set(GlobalContext.xrState.rightProjectionMatrix);

    return true;
  }

  getLayers() {
    return /*GlobalContext.xrState.stereo[0] ? */[
      {
        leftBounds: [0, 0, 0.5, 1],
        rightBounds: [0.5, 0, 0.5, 1],
        source: null,
      },
    ]/* : [
      {
        leftBounds: [0, 0, 1, 1],
        rightBounds: [1, 0, 1, 1],
        source: null,
      },
    ]; */
  }

  getEyeParameters(eye) {
    const leftEye = eye === 'left';
    const _fovArrayToVRFieldOfView = fovArray => ({
      leftDegrees: fovArray[0],
      rightDegrees: fovArray[1],
      upDegrees: fovArray[2],
      downDegrees: fovArray[3],
    });
    /* let renderWidth;
    if (GlobalContext.xrState.stereo[0]) {
      renderWidth = GlobalContext.xrState.renderWidth[0];
    } else {
      if (eye === 'left') {
        renderWidth = GlobalContext.xrState.renderWidth[0] * 2;
      } else {
        renderWidth = 0;
      }
    } */
    return {
      renderWidth: GlobalContext.xrState.renderWidth[0],
      renderHeight:  GlobalContext.xrState.renderHeight[0],
      offset: leftEye ? GlobalContext.xrState.leftOffset : GlobalContext.xrState.rightOffset,
      fieldOfView: _fovArrayToVRFieldOfView(leftEye ? GlobalContext.xrState.leftFov : GlobalContext.xrState.rightFov),
    };
  }

  get depthNear() {
    return GlobalContext.xrState.depthNear[0];
  }
  set depthNear(depthNear) {
    GlobalContext.xrState.depthNear[0] = depthNear;
  }
  get depthFar() {
    return GlobalContext.xrState.depthFar[0];
  }
  set depthFar(depthFar) {
    GlobalContext.xrState.depthFar[0] = depthFar;
  }

  async requestPresent(layers) {
    const [{source}] = layers;
    this.onmakeswapchain(source, source.getContext('webgl2') || source.getContext('webgl'));
    const {canvas, context} = this.onrequestpresent();

    /* const [{source: canvas}] = layers;
    const context = canvas.getContext('webgl');
    this.onmakeswapchain(context); */

    if (!globalGamepads) {
      globalGamepads = _makeGlobalGamepads();
    }
    for (let i = 0; i < globalGamepads.main.length; i++) {
      globalGamepads.main[i].setVRButtons();
    }

    if (!this.isPresenting) {
      this.isPresenting = true;
      Promise.resolve().then(() => {
        window.dispatchEvent(new CustomEvent('vrdisplaypresentchange', {
          detail: {
            display: this,
          },
        }));
      });
    } else {
      this.isPresenting = true;
    }
  }

  async exitPresent() {
    for (let i = 0; i < this._rafs.length; i++) {
      this.cancelAnimationFrame(this._rafs[i]);
    }
    this._rafs.length = 0;

    await this.onexitpresent();

    if (this.isPresenting) {
      this.isPresenting = false;
      Promise.resolve().then(() => {
        window.dispatchEvent(new CustomEvent('vrdisplaypresentchange', {
          detail: {
            display: null,
          },
        }));
      });
    } else {
      this.isPresenting = false;
    }
  }

  requestAnimationFrame(fn) {
    if (this.onrequestanimationframe) {
      const animationFrame = this.onrequestanimationframe(timestamp => {
        this._rafs.splice(this._rafs.indexOf(animationFrame), 1);
        fn(timestamp);
      });
      this._rafs.push(animationFrame);
      return animationFrame;
    }
  }

  cancelAnimationFrame(animationFrame) {
    if (this.oncancelanimationframe) {
      const result = this.oncancelanimationframe(animationFrame);
      const index = this._rafs.indexOf(animationFrame);
      if (index !== -1) {
        this._rafs.splice(index, 1);
      }
      return result;
    }
  }

  submitFrame() {}

  get layers() {
    return this._layers;
  }
  set layers(layers) {
    this._layers = layers;

    if (this.onlayers) {
      this.onlayers(layers);
    }
  }

  destroy() {
    for (let i = 0; i < this._rafs.length; i++) {
      this.cancelAnimationFrame(this._rafs[i]);
    }
  }
}

class FakeXRDisplay {
  constructor() {
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
  }

  pushHmdUpdate(position = this.position, quaternion = this.quaternion) {
    this.position.toArray(GlobalContext.xrState.position);
    this.quaternion.toArray(GlobalContext.xrState.orientation);

    localMatrix.compose(
      this.position,
      this.quaternion,
      localVector2.set(1, 1, 1)
    )
      .getInverse(localMatrix)
      .toArray(GlobalContext.xrState.leftViewMatrix);
    GlobalContext.xrState.rightViewMatrix.set(GlobalContext.xrState.leftViewMatrix);
  }
  pushGamepadsUpdate(position, quaternion) {
    if (!globalGamepads) {
      globalGamepads = _makeGlobalGamepads();
    }

    for (let i = 0; i < globalGamepads.main.length; i++) {
      const xrGamepad = GlobalContext.xrState.gamepads[i];
      /* if (i === 1 && position && quaternion) {
        position.toArray(xrGamepad.position);
        quaternion.toArray(xrGamepad.orientation);
      } else { */
        localVector.copy(this.position)
          .add(
            localVector2.set(-0.3 + i*0.6, -0.3, -0.35)
              .applyQuaternion(this.quaternion)
          ).toArray(xrGamepad.position);
        this.quaternion.toArray(xrGamepad.orientation);
        localMatrix
          .compose(localVector, this.quaternion, localVector2.set(1, 1, 1))
          .toArray(xrGamepad.transformMatrix);
      // }

      /* localMatrix2
        .compose(
          localVector.fromArray(gamepad.pose.position),
          localQuaternion.fromArray(gamepad.pose.orientation),
          localVector2.set(1, 1, 1)
        )
        .toArray(gamepad.pose._localPointerMatrix); */

      xrGamepad.connected[0] = 1;
    }
  }
  pushUpdate() {
    if (!GlobalContext.xrState.isPresentingReal[0]) {
      this.pushHmdUpdate();
      this.pushGamepadsUpdate();
    }
  }

  enable() {
    GlobalContext.xrState.fakeVrDisplayEnabled[0] = 1;
  }
  disable() {
    GlobalContext.xrState.fakeVrDisplayEnabled[0] = 0;
  }

  get width() {
    // if (GlobalContext.xrState.stereo[0]) {
      return GlobalContext.xrState.renderWidth[0];
    /* } else {
      return GlobalContext.xrState.renderWidth[0] * 2;
    } */
  }
  set width(width) {}
  get height() {
    return GlobalContext.xrState.renderHeight[0];
  }
  set height(height) {}
  get projectionMatrix() {
    return GlobalContext.xrState.leftProjectionMatrix;
  }
  set projectionMatrix(projectionMatrix) {}
  get viewMatrix() {
    return GlobalContext.xrState.leftViewMatrix;
  }
  set viewMatrix(viewMatrix) {}
  /* get stereo() {
    return GlobalContext.xrState.stereo[0];
  }
  set stereo(stereo) {
    GlobalContext.xrState.stereo[0] = stereo ? 1 : 0;
  } */
}

const hmdTypes = [
  'fake',
];
const hmdTypeIndexMap = (() => {
  const result = {};
  hmdTypes.forEach((t, i) => {
    result[t] = i;
  });
  return result;
})();
const lookupHMDTypeIndex = s => hmdTypeIndexMap[s];
const hmdTypeStringMap = (() => {
  const result = {};
  hmdTypes.forEach((t, i) => {
    result[i] = t;
  });
  return result;
})();
const lookupHMDTypeString = i => hmdTypeStringMap[i];

const createFakeXRDisplay = () => new FakeXRDisplay();

let globalGamepads = null;
const _makeGlobalGamepads = () => {
  let index = 0;
  return {
    main: [
      new Gamepad(index++, 'gamepad', 'left', GlobalContext.xrState.gamepads[0], new GamepadHapticActuator(0)),
      new Gamepad(index++, 'gamepad', 'right', GlobalContext.xrState.gamepads[1], new GamepadHapticActuator(1)),
    ],
  };
};

const controllerIDs = {
  fake: 'OpenVR Gamepad',
  openvr: 'OpenVR Gamepad',
  openvrTracker: 'OpenVR Tracker',
  indexLeft: 'Valve Index (Left)',
  indexRight: 'Valve Index (Right)',
  oculusLeft: 'Oculus Touch (Left)',
  oculusRight: 'Oculus Touch (Right)',
  // oculusMobile: 'Oculus Go',
  oculusMobileLeft: 'Oculus Touch (Left)',
  oculusMobileRight: 'Oculus Touch (Right)',
  oculusGoLeft: 'Oculus Touch (Left)',
  oculusGoRight: 'Oculus Touch (Right)',
  oculusQuestLeft: 'Oculus Touch (Left)',
  oculusQuestRight: 'Oculus Touch (Right)',
};
function getControllerID(hmdType, hand) {
  return controllerIDs[hmdType] || controllerIDs[hmdType + hand.charAt(0).toUpperCase() + hand.slice(1)];
}
function getGamepads() {
  if (GlobalContext.xrState.isPresenting[0]) {
    const hmdType = 'fake';

    if (!globalGamepads) {
      globalGamepads = _makeGlobalGamepads();
    }
    const gamepads = globalGamepads.main.slice();

    globalGamepads.main[0].id = getControllerID(hmdType, 'left');
    globalGamepads.main[1].id = getControllerID(hmdType, 'right');

    return gamepads;
  } else {
    return [];
  }
};
GlobalContext.getGamepads = getGamepads;
/* function clearGamepads() {
  gamepads = null;
}
GlobalContext.clearGamepads = clearGamepads; */

export {
  VRDisplay,
  VRFrameData,
  VRPose,
  VRStageParameters,
  Gamepad,
  GamepadButton,
  FakeXRDisplay,
  lookupHMDTypeString,
  lookupHMDTypeIndex,
  createFakeXRDisplay,
  getGamepads,
  getXrOffsetMatrix,
};
