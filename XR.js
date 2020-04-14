import * as THREE from './three.module.js';
import GlobalContext from './GlobalContext.js';
import symbols from './symbols.js';
import utils from './utils.js';
const {_elementGetter, _elementSetter} = utils;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

class XR extends EventTarget {
  constructor(/*window*/) {
    super();
    // this._window = window;
    this.init();
  }
  init() {
    this.onrequestpresent = null;

    // needed for JanusWeb
    this.supportsSession = function supportsSession(mode) {
      return this.isSessionSupported(mode);
    };
  }
  isSessionSupported(mode) {
    return Promise.resolve(true);
  }
  /* supportsSessionMode(mode) { // non-standard
    return this.supportsSession(mode);
  } */
  async requestSession(mode, options) {
    if (!this.session) {
      /* const session = this._window[symbols.mrDisplaysSymbol].xrSession;
      session.exclusive = exclusive;
      session.outputContext = outputContext;

      await session.onrequestpresent();
      session.isPresenting = true; */
      
      const {session} = this.onrequestpresent();
      session.addEventListener('end', () => {
        // session.isPresenting = false;
        this.session = null;
      }, {
        once: true,
      });
      this.session = session;
    }
    return Promise.resolve(this.session);
  }
  /* async requestDevice() {
    return new XRDevice(this);
  } */
  get onvrdevicechange() {
    return _elementGetter(this, 'vrdevicechange');
  }
  set onvrdevicechange(onvrdevicechange) {
    _elementSetter(this, 'vrdevicechange', onvrdevicechange);
  }
};

/* class XRDevice { // non-standard
  constructor(xr) {
    this.xr = xr;
  }

  supportsSession(opts) {
    return this.xr.supportsSession(opts);
  }
  requestSession(opts) {
    return this.xr.requestSession();
  }
} */

class XRSession extends EventTarget {
  constructor() {
    super();

    this.environmentBlendMode = 'opaque';
    this.renderState = new XRRenderState();
    this.viewerSpace = new XRSpace();
    // this.isPresenting = false; // non-standard

    this._frame = new XRFrame(this);
    this._referenceSpace = new XRReferenceSpace();
    this._gamepadInputSources = [
      new XRInputSource('left', 'tracked-pointer', GlobalContext.xrState.gamepads[0]),
      new XRInputSource('right', 'tracked-pointer', GlobalContext.xrState.gamepads[1]),
    ];
    this._inputSources = this._gamepadInputSources;
    this._lastPresseds = [false, false];
    this._rafs = [];
    this._layers = [];

    // this.onrequestpresent = null;
    this.onmakeswapchain = null;
    // this.onexitpresent = null;
    this.onrequestanimationframe = null;
    this.oncancelanimationframe = null;
    // this.onlayers = null;
  }
  requestReferenceSpace(type, options = {}) {
    // const {disableStageEmulation = false, stageEmulationHeight  = 0} = options;
    return Promise.resolve(this._referenceSpace);
  }
  /* requestFrameOfReference() { // non-standard
    return this.requestReferenceSpace.apply(this, arguments);
  } */
  get inputSources() {
    return this._inputSources.filter(inputSource => inputSource.connected);
  }
  requestAnimationFrame(fn) {
    if (this.onrequestanimationframe) {
      const animationFrame = this.onrequestanimationframe(timestamp => {
        this._rafs.splice(animationFrame, 1);
        fn(timestamp, this._frame);
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
  /* requestHitTest(origin, direction, coordinateSystem) {
    return new Promise((accept, reject) => {
      if (this.onrequesthittest)  {
        this.onrequesthittest(origin, direction, coordinateSystem)
          .then(accept)
          .catch(reject);
      } else {
        reject(new Error('api not supported'));
      }
    });
  } */
  updateRenderState(newState) {
    this.renderState.update(newState);
  }
  get baseLayer() { // non-standard
    return this.renderState.baseLayer;
  }
  set baseLayer(baseLayer) {
    this.renderState.update({baseLayer});
  }
  async end() {
    await this.onexitpresent();
    this.dispatchEvent(new CustomEvent('end'));
  }
  update() {
    const {inputSources} = this;
    const gamepads = GlobalContext.getGamepads();

    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];
      const gamepad = gamepads[i];

      if (gamepad) {
        const pressed = gamepad.buttons[1].pressed;
        const lastPressed = this._lastPresseds[i];
        if (pressed && !lastPressed) {
          this.dispatchEvent(new XRInputSourceEvent('selectstart', {
            frame: this._frame,
            inputSource,
          }));
          this.dispatchEvent(new XRInputSourceEvent('select', {
            frame: this._frame,
            inputSource,
          }));
        } else if (lastPressed && !pressed) {
          this.dispatchEvent(new XRInputSourceEvent('selectend', {
            frame: this._frame,
            inputSource,
          }));
        }
        this._lastPresseds[i] = pressed;
      }
    }
  }

  /* get layers() {
    return this._layers;
  }
  set layers(layers) {
    this._layers = layers;

    if (this.onlayers) {
      this.onlayers(layers);
    }
  }
  get texture() {
    return {
      id: GlobalContext.xrState.tex[0],
    };
  }
  set texture(texture) {} */

  get onblur() {
    return _elementGetter(this, 'blur');
  }
  set onblur(onblur) {
    _elementSetter(this, 'blur', onblur);
  }
  get onfocus() {
    return _elementGetter(this, 'focus');
  }
  set onfocus(onfocus) {
    _elementSetter(this, 'focus', onfocus);
  }
  get onresetpose() {
    return _elementGetter(this, 'resetpose');
  }
  set onresetpose(onresetpose) {
    _elementSetter(this, 'resetpose', onresetpose);
  }
  get onend() {
    return _elementGetter(this, 'end');
  }
  set onend(onend) {
    _elementSetter(this, 'end', onend);
  }
  get onselect() {
    return _elementGetter(this, 'select');
  }
  set onselect(onselect) {
    _elementSetter(this, 'select', onselect);
  }
  get onselectstart() {
    return _elementGetter(this, 'selectstart');
  }
  set onselectstart(onselectstart) {
    _elementSetter(this, 'selectstart', onselectstart);
  }
  get onselectend() {
    return _elementGetter(this, 'selectend');
  }
  set onselectend(onselectend) {
    _elementSetter(this, 'selectend', onselectend);
  }
}

class XRRenderState {
  constructor() {
    this._inlineVerticalFieldOfView = 90;
    this._baseLayer = null;
    this._outputContext = null;
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
  get inlineVerticalFieldOfView() {
    return this._inlineVerticalFieldOfView;
  }
  set inlineVerticalFieldOfView(inlineVerticalFieldOfView) {
    this._inlineVerticalFieldOfView = inlineVerticalFieldOfView;
  }
  get baseLayer() {
    return this._baseLayer;
  }
  set baseLayer(baseLayer) {
    this._baseLayer = baseLayer;
  }
  /* get outputContext() {
    return this._outputContext;
  }
  set outputContext(outputContext) {
    this._outputContext = outputContext;
  } */

  update(newState) {
    for (const k in newState) {
      this[k] = newState[k];
    }
  }
};

class XRWebGLLayer {
  constructor(session, context, options = {}) {
    this.session = session;
    this.context = context;
    
    const {
      antialias = true,
      depth = false,
      stencil = false,
      alpha = true,
      framebufferScaleFactor = 1,
    } = options;
    this.antialias = antialias;
    this.depth = depth;
    this.stencil = stencil;
    this.alpha = alpha;

    this.session.onmakeswapchain && this.session.onmakeswapchain(context.canvas, context);
    /* const {fbo} = this.session.onmakeswapchain(context);
    
    this.framebuffer = {
      id: fbo,
    }; */
  }
  getViewport(view) {
    return view._viewport;
  }
  requestViewportScaling(viewportScaleFactor) {
    throw new Error('not implemented'); // XXX
  }
  
  get framebuffer() {
    return GlobalContext.xrFramebuffer;
  }
  set framebuffer(framebuffer) {}

  /* get framebufferWidth() {
    return xrState.renderWidth[0]*2;
  }
  set framebufferWidth(framebufferWidth) {}
  
  get framebufferHeight() {
    return xrState.renderHeight[0];
  }
  set framebufferHeight(framebufferHeight) {} */
}

const _applyXrOffsetToPose = (pose, xrOffsetMatrix, inverse, premultiply) => {
  localMatrix.fromArray(pose._realViewMatrix);
  const inverseXrOffsetMatrix = inverse ? localMatrix2.getInverse(xrOffsetMatrix) : xrOffsetMatrix;
  if (premultiply) {
    localMatrix.premultiply(inverseXrOffsetMatrix);
  } else {
    localMatrix.multiply(inverseXrOffsetMatrix);
  }
  localMatrix.toArray(pose._localViewMatrix);
  localMatrix.getInverse(localMatrix).toArray(pose.transform.matrix);
};

class XRFrame {
  constructor(session) {
    this.session = session;

    this._viewerPose = new XRViewerPose(this);
  }
  getViewerPose(coordinateSystem) {
    const xrOffsetMatrix = GlobalContext.getXrOffsetMatrix();
    for (let i = 0; i < this._viewerPose.views.length; i++) {
      _applyXrOffsetToPose(this._viewerPose.views[i], xrOffsetMatrix, false, false);
    }

    return this._viewerPose;
  }
  /* getDevicePose() { // non-standard
    return this.getViewerPose.apply(this, arguments);
  } */
  getPose(sourceSpace, destinationSpace) {
    const xrOffsetMatrix = GlobalContext.getXrOffsetMatrix();
    _applyXrOffsetToPose(sourceSpace._pose, xrOffsetMatrix, true, true);

    return sourceSpace._pose;
  }
  /* getInputPose(inputSource, coordinateSystem) { // non-standard
    const xrOffsetMatrix = GlobalContext.getXrOffsetMatrix();
    _applyXrOffsetToPose(inputSource._inputPose, xrOffsetMatrix, true, true);
    inputSource._inputPose.targetRay.transformMatrix.set(inputSource._inputPose._localViewMatrix);
    inputSource._inputPose.gripTransform.matrix.set(inputSource._inputPose._localViewMatrix);

    return inputSource._inputPose;
  } */
}

class XRView {
  constructor(eye = 'left') {
    this.eye = eye;
    this.transform = new XRRigidTransform(eye);
    this.projectionMatrix = eye === 'left' ? GlobalContext.xrState.leftProjectionMatrix : GlobalContext.xrState.rightProjectionMatrix;

    this._viewport = new XRViewport(eye);
    this._realViewMatrix = this.transform.inverse.matrix;
    this._localViewMatrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.transform.inverse.matrix = this._localViewMatrix;

    // this.viewMatrix = this.transform.inverse.matrix; // non-standard
  }
}

class XRViewport {
  constructor(eye) {
    this.eye = eye;
  }
  get x() {
    if (GlobalContext.xrState.stereo[0]) {
      return this.eye === 'left' ? 0 : GlobalContext.xrState.renderWidth[0];
    } else {
      return this.eye === 'left' ? 0 : GlobalContext.xrState.renderWidth[0] * 2;
    }
  }
  set x(x) {}
  get y() {
    return 0;
  }
  set y(y) {}
  get width() {
    if (GlobalContext.xrState.stereo[0]) {
      return GlobalContext.xrState.renderWidth[0];
    } else {
      if (this.eye === 'left') {
        return GlobalContext.xrState.renderWidth[0] * 2;
      } else {
        return 0;
      }
    }
  }
  set width(width) {}
  get height() {
    return GlobalContext.xrState.renderHeight[0];
  }
  set height(height) {}
}

class XRPose {
  constructor() {
    this.transform = new XRRigidTransform();
    this.emulatedPosition = false;

    this._realViewMatrix = this.transform.inverse.matrix;
    this._localViewMatrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.transform.inverse.matrix = this._localViewMatrix;
  }
}

class XRViewerPose extends XRPose {
  constructor(frame) {
    super();

    this.frame = frame; // non-standard

    this._views = [
      new XRView('left'),
      new XRView('right'),
    ];

    // this.poseModelMatrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); // non-standard
  }
  get views() {
    return this._views;
  }
  set views(views) {}
  /* getViewMatrix(view) { // non-standard
    return localMatrix
      .fromArray(view._realViewMatrix)
      .multiply(
        GlobalContext.getXrOffsetMatrix()
      )
      .toArray(view._localViewMatrix);
  } */
}

class XRInputSource {
  constructor(handedness, targetRayMode, xrStateGamepad) {
    this.handedness = handedness;
    this.targetRayMode = targetRayMode;
    this._xrStateGamepad = xrStateGamepad;

    this.targetRaySpace = new XRSpace();
    this.targetRaySpace._pose.transform.position._buffer = xrStateGamepad.position;
    this.targetRaySpace._pose.transform.orientation._buffer = xrStateGamepad.orientation;
    this.targetRaySpace._pose._realViewMatrix = xrStateGamepad.transformMatrix;
    this.targetRaySpace._pose._localViewMatrix = this.targetRaySpace._pose.transform.inverse.matrix;

    this.gripSpace = new XRSpace();
    this.gripSpace._pose.transform.position._buffer = xrStateGamepad.gripPosition;
    this.gripSpace._pose.transform.orientation._buffer = xrStateGamepad.gripOrientation;
    this.gripSpace._pose._realViewMatrix = xrStateGamepad.gripTransformMatrix;
    this.gripSpace._pose._localViewMatrix = this.gripSpace._pose.transform.inverse.matrix;

    /* this._inputPose = new XRInputPose();
    this._inputPose.targetRay.origin.values = xrStateGamepad.position;
    this._inputPose.targetRay.direction.values = xrStateGamepad.direction;
    this._inputPose._realViewMatrix = xrStateGamepad.transformMatrix;
    this._inputPose._localViewMatrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); */
  }
  get connected() {
    return this._xrStateGamepad.connected[0] !== 0;
  }
  set connected(connected) {
    this._xrStateGamepad.connected[0] = connected ? 1 : 0;
  }
}

class DOMPoint {
  constructor(x, y, z, w) {
    if (typeof x === 'object') {
      this._buffer = x;
    } else {
      if (x === undefined) {
        x = 0;
      }
      if (y === undefined) {
        y = 0;
      }
      if (z === undefined) {
        z = 0;
      }
      if (w === undefined) {
        w = 1;
      }
      this._buffer = Float32Array.from([x, y, z, w]);
    }
  }
  get x() { return this._buffer[0]; }
  set x(x) { this._buffer[0] = x; }
  get y() { return this._buffer[1]; }
  set y(y) { this._buffer[1] = y; }
  get z() { return this._buffer[2]; }
  set z(z) { this._buffer[2] = z; }
  get w() { return this._buffer[3]; }
  set w(w) { this._buffer[3] = w; }
  fromPoint(p) {
    return new DOMPoint(p.x, p.y, p.z, p.w);
  }
}

/* class XRRay { // non-standard
  constructor() {
    this.origin = new DOMPoint();
    this.direction = new DOMPoint(0, 0, -1);
    this.transformMatrix = Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }
}

class XRInputPose { // non-standard
  constructor() {
    this.targetRay = new XRRay();
    this.gripTransform = new XRRigidTransform();
  }
} */

class XRInputSourceEvent extends Event {
  constructor(type, init = {}) {
    super(type);

    this.frame = init.frame !== undefined ? init.frame : null;
    this.inputSource = init.inputSource !== undefined ? init.inputSource : null;
  }
}
GlobalContext.XRInputSourceEvent = XRInputSourceEvent;

class XRRigidTransform extends EventTarget {
  constructor(position, orientation, scale) {
    super();

    if (typeof position == 'object') {
      const inverse = orientation instanceof XRRigidTransform ? orientation : null;

      this.initialize(position, inverse);
    } else if (typeof position === 'string') {
      const eye = position;

      const result = new XRRigidTransform();
      result.inverse.matrix = eye === 'left' ? GlobalContext.xrState.leftViewMatrix : GlobalContext.xrState.rightViewMatrix; // XXX share all other XRRigidTransform properties
      return result;
    } else {
      this.initialize();

      if (!position) {
        position = {x: 0, y: 0, z: 0};
      }
      if (!orientation) {
        orientation = {x: 0, y: 0, z: 0, w: 1};
      }
      if (!scale) {
        scale = {x: 1, y: 1, z: 1};
      }

      this._position._buffer[0] = position.x;
      this._position._buffer[1] = position.y;
      this._position._buffer[2] = position.z;

      this._orientation._buffer[0] = orientation.x;
      this._orientation._buffer[1] = orientation.y;
      this._orientation._buffer[2] = orientation.z;
      this._orientation._buffer[3] = orientation.w;

      this._scale._buffer[0] = scale.x;
      this._scale._buffer[1] = scale.y;
      this._scale._buffer[2] = scale.z;

      localMatrix
        .compose(localVector.fromArray(this._position._buffer), localQuaternion.fromArray(this._orientation._buffer), localVector2.fromArray(this._scale._buffer))
        .toArray(this.matrix);
      localMatrix
        .getInverse(localMatrix)
        .toArray(this.matrixInverse);
      localMatrix
        .decompose(localVector, localQuaternion, localVector2);
      localVector.toArray(this._positionInverse._buffer);
      localQuaternion.toArray(this._orientationInverse._buffer);
      localVector2.toArray(this._scaleInverse._buffer);
    }

    if (!this._inverse) {
      this._inverse = new XRRigidTransform(this._buffer, this);
    }
  }
  
  initialize(_buffer = new ArrayBuffer((3 + 4 + 3 + 16) * 2 * Float32Array.BYTES_PER_ELEMENT), inverse = null) {
    this._buffer = _buffer;
    this._inverse = inverse;

    {
      let index = this._inverse ? ((3 + 4 + 3 + 16) * Float32Array.BYTES_PER_ELEMENT) : 0;

      this._position = new DOMPoint(new Float32Array(this._buffer, index, 3));
      index += 3 * Float32Array.BYTES_PER_ELEMENT;

      this._orientation = new DOMPoint(new Float32Array(this._buffer, index, 4));
      index += 4 * Float32Array.BYTES_PER_ELEMENT;

      this._scale = new DOMPoint(new Float32Array(this._buffer, index, 3));
      index += 3 * Float32Array.BYTES_PER_ELEMENT;

      this.matrix = new Float32Array(this._buffer, index, 16);
      index += 16 * Float32Array.BYTES_PER_ELEMENT;
    }
    {
      let index = this._inverse ? 0 : ((3 + 4 + 3 + 16) * Float32Array.BYTES_PER_ELEMENT);

      this._positionInverse = new DOMPoint(new Float32Array(this._buffer, index, 3));
      index += 3 * Float32Array.BYTES_PER_ELEMENT;

      this._orientationInverse = new DOMPoint(new Float32Array(this._buffer, index, 4));
      index += 4 * Float32Array.BYTES_PER_ELEMENT;

      this._scaleInverse = new DOMPoint(new Float32Array(this._buffer, index, 3));
      index += 3 * Float32Array.BYTES_PER_ELEMENT;

      this.matrixInverse = new Float32Array(this._buffer, index, 16);
      index += 16 * Float32Array.BYTES_PER_ELEMENT;
    }
  }
  
  get inverse() {
    return this._inverse;
  }
  set inverse(inverse) {}

  get position() {
    return this._position;
  }
  set position(position) {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        key: 'position',
        value: position,
      },
    }));
  }
  get orientation() {
    return this._orientation;
  }
  set orientation(orientation) {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        key: 'orientation',
        value: orientation,
      },
    }));
  }
  get scale() {
    return this._scale;
  }
  set scale(scale) {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        key: 'scale',
        value: scale,
      },
    }));
  }

  pushUpdate() {
    localMatrix
      .compose(
        localVector.fromArray(this._position._buffer),
        localQuaternion.fromArray(this._orientation._buffer),
        localVector2.fromArray(this._scale._buffer)
      )
      .toArray(this.matrix);
    localMatrix
      .getInverse(localMatrix)
      .toArray(this.matrixInverse);
    localMatrix
      .decompose(localVector, localQuaternion, localVector2);
    localVector.toArray(this._positionInverse._buffer);
    localQuaternion.toArray(this._orientationInverse._buffer);
    localVector2.toArray(this._scaleInverse._buffer);

    this.flagUpdate();
  }
  flagUpdate() {
    GlobalContext.xrState.offsetEpoch[0]++;
  }
}

class XRSpace extends EventTarget {
  constructor() {
    super();
    
    this._pose = new XRPose();
  }
}

class XRReferenceSpace extends XRSpace {
  getOffsetReferenceSpace(originOffset) {
    return this; // XXX do the offsetting
  }
  get onreset() {
    return _elementGetter(this, 'reset');
  }
  set onreset(onreset) {
    _elementSetter(this, 'reset', onreset);
  }
}

class XRBoundedReferenceSpace extends XRReferenceSpace {
  constructor() {
    super();

    this.boundsGeometry = [
      new DOMPoint(-3, -3),
      new DOMPoint(3, -3),
      new DOMPoint(3, 3),
      new DOMPoint(-3, 3),
    ];
    this.emulatedHeight = 0;
  }
}

export {
  XR,
  // XRDevice,
  XRSession,
  XRRenderState,
  XRWebGLLayer,
  XRFrame,
  XRView,
  XRViewport,
  XRPose,
  XRViewerPose,
  XRInputSource,
  DOMPoint,
  // XRRay,
  // XRInputPose,
  XRInputSourceEvent,
  XRRigidTransform,
  XRSpace,
  XRReferenceSpace,
  XRBoundedReferenceSpace,
};
