import * as THREE from './three.module.js';
import * as XR from './XR.js';
import symbols from './symbols.js';
import GlobalContext from './GlobalContext.js';
import wbn from './wbn.js';
import {GLTFLoader} from './GLTFLoader.js';
import {VOXLoader} from './VOXLoader.js';
import Avatar from './avatars/avatars.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const xrState = (() => {
  const _makeSab = size => {
    const sab = new ArrayBuffer(size);
    let index = 0;
    return (c, n) => {
      const result = new c(sab, index, n);
      index += result.byteLength;
      return result;
    };
  };
  const _makeTypedArray = _makeSab(32*1024);

  const result = {};
  result.isPresenting = _makeTypedArray(Uint32Array, 1);
  result.isPresentingReal = _makeTypedArray(Uint32Array, 1);
  result.renderWidth = _makeTypedArray(Float32Array, 1);
  result.renderWidth[0] = window.innerWidth / 2 * window.devicePixelRatio;
  result.renderHeight = _makeTypedArray(Float32Array, 1);
  result.renderHeight[0] = window.innerHeight * window.devicePixelRatio;
  result.metrics = _makeTypedArray(Uint32Array, 2);
  result.metrics[0] = window.innerWidth;
  result.metrics[1] = window.innerHeight;
  result.devicePixelRatio = _makeTypedArray(Float32Array, 1);
  result.devicePixelRatio[0] = window.devicePixelRatio;
  result.stereo = _makeTypedArray(Uint32Array, 1);
  // result.stereo[0] = 1;
  result.canvasViewport = _makeTypedArray(Float32Array, 4);
  result.canvasViewport.set(Float32Array.from([0, 0, window.innerWidth, window.innerHeight]));
  result.depthNear = _makeTypedArray(Float32Array, 1);
  result.depthNear[0] = 0.1;
  result.depthFar = _makeTypedArray(Float32Array, 1);
  result.depthFar[0] = 2000.0;
  result.position = _makeTypedArray(Float32Array, 3);
  result.orientation = _makeTypedArray(Float32Array, 4);
  result.orientation[3] = 1;
  result.leftViewMatrix = _makeTypedArray(Float32Array, 16);
  result.leftViewMatrix.set(Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
  result.rightViewMatrix = _makeTypedArray(Float32Array, 16);
  result.rightViewMatrix.set(result.leftViewMatrix);
  // new THREE.PerspectiveCamera(110, 2, 0.1, 2000).projectionMatrix.toArray()
  result.leftProjectionMatrix = _makeTypedArray(Float32Array, 16);
  result.leftProjectionMatrix.set(Float32Array.from([0.3501037691048549, 0, 0, 0, 0, 0.7002075382097098, 0, 0, 0, 0, -1.00010000500025, -1, 0, 0, -0.200010000500025, 0]));
  result.rightProjectionMatrix = _makeTypedArray(Float32Array, 16);
  result.rightProjectionMatrix.set(result.leftProjectionMatrix);
  result.leftOffset = _makeTypedArray(Float32Array, 3);
  result.leftOffset.set(Float32Array.from([-0.625/2, 0, 0]));
  result.rightOffset = _makeTypedArray(Float32Array, 3);
  result.leftOffset.set(Float32Array.from([0.625/2, 0, 0]));
  result.leftFov = _makeTypedArray(Float32Array, 4);
  result.leftFov.set(Float32Array.from([45, 45, 45, 45]));
  result.rightFov = _makeTypedArray(Float32Array, 4);
  result.rightFov.set(result.leftFov);
  result.offsetEpoch = _makeTypedArray(Uint32Array, 1);
  const _makeGamepad = () => ({
    connected: _makeTypedArray(Uint32Array, 1),
    position: _makeTypedArray(Float32Array, 3),
    orientation: (() => {
      const result = _makeTypedArray(Float32Array, 4);
      result[3] = 1;
      return result;
    })(),
    direction: (() => { // derived
      const result = _makeTypedArray(Float32Array, 4);
      result[2] = -1;
      return result;
    })(),
    transformMatrix: (() => { // derived
      const result = _makeTypedArray(Float32Array, 16);
      result.set(Float32Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
      return result;
    })(),
    buttons: (() => {
      const result = Array(10);
      for (let i = 0; i < result.length; i++) {
        result[i] = {
          pressed: _makeTypedArray(Uint32Array, 1),
          touched: _makeTypedArray(Uint32Array, 1),
          value: _makeTypedArray(Float32Array, 1),
        };
      }
      return result;
    })(),
    axes: _makeTypedArray(Float32Array, 10),
  });
  result.gamepads = (() => {
    const result = Array(2);
    for (let i = 0; i < result.length; i++) {
      result[i] = _makeGamepad();
    }
    return result;
  })();
  // result.id = _makeTypedArray(Uint32Array, 1);
  // result.hmdType = _makeTypedArray(Uint32Array, 1);
  // result.tex = _makeTypedArray(Uint32Array, 1);
  // result.depthTex = _makeTypedArray(Uint32Array, 1);
  // result.msTex = _makeTypedArray(Uint32Array, 1);
  // result.msDepthTex = _makeTypedArray(Uint32Array, 1);
  // result.aaEnabled = _makeTypedArray(Uint32Array, 1);
  // result.fakeVrDisplayEnabled = _makeTypedArray(Uint32Array, 1);
  // result.blobId = _makeTypedArray(Uint32Array, 1);

  return result;
})();
GlobalContext.xrState = xrState;
const xrOffsetMatrix = new THREE.Matrix4();
GlobalContext.getXrOffsetMatrix = () => xrOffsetMatrix;
GlobalContext.xrFramebuffer = null;

const xrTypeLoaders = {
  'webxr-site@0.0.1': async function(p) {
    const iframe = document.createElement('iframe');
    iframe.src = 'iframe.html';
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    await new Promise((accept, reject) => {
      iframe.addEventListener('load', accept);
      iframe.addEventListener('error', reject);
    });
    p.context.iframe = iframe;
  },
  'gltf@0.0.1': async function(p) {
    const mainPath = '/' + p.main;
    const indexFile = p.files.find(file => new URL(file.url).pathname === mainPath);
    const indexBlob = new Blob([indexFile.response.body]);
    const u = URL.createObjectURL(indexBlob);
    const {scene} = await new Promise((accept, reject) => {
      const loader = new GLTFLoader();
      loader.load(u, accept, function onProgress() {}, reject);
    });
    URL.revokeObjectURL(u);

    p.context.object = scene;
  },
  'vrm@0.0.1': async function(p) {
    const mainPath = '/' + p.main;
    const indexFile = p.files.find(file => new URL(file.url).pathname === mainPath);
    const indexBlob = new Blob([indexFile.response.body]);
    const u = URL.createObjectURL(indexBlob);
    const o = await new Promise((accept, reject) => {
      const loader = new GLTFLoader();
      loader.load(u, accept, function onProgress() {}, reject);
    });
    URL.revokeObjectURL(u);

    p.context.object = o.scene;
    p.context.model = o;
    o.scene.traverse(o => {
      o.frustumCulled = false;
    });
  },
  'vox@0.0.1': async function(p) {
    const mainPath = '/' + p.main;
    const indexFile = p.files.find(file => new URL(file.url).pathname === mainPath);
    const indexBlob = new Blob([indexFile.response.body]);
    const u = URL.createObjectURL(indexBlob);
    const o = await new Promise((accept, reject) => {
      const loader = new VOXLoader();
      loader.load(u, accept, function onProgress() {}, reject);
    });
    URL.revokeObjectURL(u);

    p.context.object = o;
  },
};
const xrTypeAdders = {
  'webxr-site@0.0.1': async function(p) {
    const mainPath = '/' + p.main;
    const indexFile = p.files.find(file => new URL(file.url).pathname === mainPath);
    const indexHtml = indexFile.response.body.toString('utf-8');
    await p.context.iframe.contentWindow.xrpackage.iframeInit({
      engine: this,
      indexHtml,
      canvas: this.domElement,
      context: this.context,
      xrState,
    });

    this.packages.push(p);
  },
  'gltf@0.0.1': async function(p) {
    this.scene.add(p.context.object);

    this.packages.push(p);
  },
  'vrm@0.0.1': async function(p) {
    this.scene.add(p.context.object);

    this.packages.push(p);
  },
  'vox@0.0.1': async function(p) {
    this.scene.add(p.context.object);

    this.packages.push(p);
  },
};

export class XRPackageEngine extends EventTarget {
  constructor() {
    super();

    /* const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      xrCompatible: true,
    }); */

    const renderer = new THREE.WebGLRenderer({
      // canvas: pe.domElement,
      // context: pe.context,
      antialias: true,
      alpha: true,
      // preserveDrawingBuffer: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setClearAlpha(0);
    renderer.autoClear = false;
    renderer.sortObjects = false;
    renderer.physicallyCorrectLights = true;
    renderer.xr.enabled = true;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 1);
    this.camera = camera;

    const ambientLight = new THREE.AmbientLight(0xFFFFFF);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 3);
    scene.add(directionalLight2);

    /* const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      // preserveDrawingBuffer: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.autoClear = false;
    renderer.sortObjects = false;
    renderer.physicallyCorrectLights = true;
    renderer.xr.enabled = true;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 2);
    this.camera = camera;

    const ambientLight = new THREE.AmbientLight(0xFFFFFF);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 3);
    scene.add(directionalLight2);

    const cubeMesh = (() => {
      const geometry = new THREE.BoxBufferGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
      });
      const mesh = new THREE.Mesh(geometry, material);  
      mesh.frustumCulled = false;
      return mesh;
    })();
    cubeMesh.position.set(0, 1.5, 0);
    cubeMesh.rotation.order = 'YXZ';
    scene.add(cubeMesh);
    this.cubeMesh = cubeMesh; */

    this.domElement = this.renderer.domElement;
    this.context = this.renderer.getContext();

    this.fakeSession = new XR.XRSession();
    this.fakeSession.onrequestanimationframe = this.requestAnimationFrame.bind(this);
    this.fakeSession.oncancelanimationframe = this.cancelAnimationFrame.bind(this);

    this.externalCanvas = null;
    this.externalContext = null;
    this.localRenderTarget = null;

    window.OldXR = {
      XR: window.XR,
      XRSession: window.XRSession,
      XRRenderState: window.XRRenderState,
      XRWebGLLayer: window.XRWebGLLayer,
      XRFrame: window.XRFrame,
      XRView: window.XRView,
      XRViewport: window.XRViewport,
      XRPose: window.XRPose,
      XRViewerPose: window.XRViewerPose,
      XRInputSource: window.XRInputSource,
      // XRRay,
      // XRInputPose,
      XRInputSourceEvent: window.XRInputSourceEvent,
      XRSpace: window.XRSpace,
      XRReferenceSpace: window.XRReferenceSpace,
      XRBoundedReferenceSpace: window.XRBoundedReferenceSpace,
    };

    window.XR = XR.XR;
    window.XRSession = XR.XRSession;
    window.XRRenderState = XR.XRRenderState;
    window.XRWebGLLayer = XR.XRWebGLLayer;
    window.XRFrame = XR.XRFrame;
    window.XRView = XR.XRView;
    window.XRViewport = XR.XRViewport;
    window.XRPose = XR.XRPose;
    window.XRViewerPose = XR.XRViewerPose;
    window.XRInputSource = XR.XRInputSource;
    window.XRRay = XR.XRRay;
    // window.XRInputPose = XR.XRInputPose;
    window.XRInputSourceEvent = XR.XRInputSourceEvent;
    window.XRSpace = XR.XRSpace;
    window.XRReferenceSpace = XR.XRReferenceSpace;
    window.XRBoundedReferenceSpace = XR.XRBoundedReferenceSpace;

    renderer.xr.setSession(this.fakeSession);

    this.packages = [];
    this.ids = 0;
    this.rafs = [];
    this.rig = null;
    this.realSession = null;
    this.referenceSpace = null;
    this.loadReferenceSpaceInterval = 0;
    this.cancelFrame = null;
    
    const animate = timestamp => {
      const frameId = window.requestAnimationFrame(animate);
      this.cancelFrame = () => {
        window.cancelAnimationFrame(frameId);
      };
      this.tick(timestamp);
    };
    window.requestAnimationFrame(animate);
  }
  async add(p) {
    if (!p.loaded) {
      await new Promise((accept, reject) => {
        p.addEventListener('load', e => {
          accept();
        }, {once: true});
      });
    }

    const {type} = p;
    const adder = xrTypeAdders[type];
    if (adder) {
      await adder.call(this, p);
      p.parent = this;
    } else {
      throw new Error(`unknown xr_type: ${type}`);
    }
  }
  setExternalCanvas(canvas, context) {
    if (canvas !== this.domElement) {
      this.externalCanvas = canvas;
      this.externalContext = context;
    }
  }
  async setSession(realSession) {
    if (this.loadReferenceSpaceInterval !== 0) {
      clearInterval(this.loadReferenceSpaceInterval);
      this.loadReferenceSpaceInterval = 0;
    }
    if (realSession) {
      this.cancelFrame();
      this.cancelFrame = null;
      
      let referenceSpaceType = '';
      const _loadReferenceSpace = async () => {
        const lastReferenceSpaceType = referenceSpaceType;
        let referenceSpace;
        try {
          referenceSpace = await realSession.requestReferenceSpace('local-floor');
          referenceSpaceType = 'local-floor';
        } catch (err) {
          referenceSpace = await realSession.requestReferenceSpace('local');
          referenceSpaceType = 'local';
        }

        if (referenceSpaceType !== lastReferenceSpaceType) {
          console.log(`referenceSpace changed to ${referenceSpaceType}`);
          this.referenceSpace = referenceSpace;
        }
      };
      await _loadReferenceSpace();
      this.loadReferenceSpaceInterval = setInterval(_loadReferenceSpace, 1000);

      const baseLayer = new window.OldXR.XRWebGLLayer(realSession, this.context);
      realSession.updateRenderState({baseLayer});

      await new Promise((accept, reject) => {
        realSession.requestAnimationFrame((timestamp, frame) => {
          const pose = frame.getViewerPose(this.referenceSpace);
          const viewport = baseLayer.getViewport(pose.views[0]);
          const width = viewport.width;
          const height = viewport.height;
          const fullWidth = (() => {
            let result = 0;
            for (let i = 0; i < pose.views.length; i++) {
              result += baseLayer.getViewport(pose.views[i]).width;
            }
            return result;
          })();

          GlobalContext.xrState.isPresentingReal[0] = 1;
          GlobalContext.xrState.stereo[0] = 1;
          GlobalContext.xrState.renderWidth[0] = width;
          GlobalContext.xrState.renderHeight[0] = height;
          
          GlobalContext.xrFramebuffer = realSession.renderState.baseLayer.framebuffer;

          const animate = (timestamp, frame) => {
            const frameId = realSession.requestAnimationFrame(animate);
            this.cancelFrame = () => {
              realSession.cancelAnimationFrame(frameId);
            };
            this.tick(timestamp, frame);
          };
          realSession.requestAnimationFrame(animate);

          /* win.canvas.width = fullWidth;
          win.canvas.height = height;

          await win.runAsync({
            method: 'enterXr',
          }); */

          accept();

          console.log('XR setup complete');
        });
        // core.setSession(realSession);
        // core.setReferenceSpace(referenceSpace);
      });
    }
    this.realSession = realSession;
    
    this.packages.forEach(p => {
      p.setSession(realSession);
    });
  }
  tick(timestamp, frame) {
    this.renderer.clear(true, true, true);

    // emit event
    this.dispatchEvent(new CustomEvent('tick'));

    // update pose
    const {realSession} = this;
    if (realSession) {
      // console.log('animate session', realSession, frame, referenceSpace);
      // debugger;
      const pose = frame.getViewerPose(this.referenceSpace);
      if (pose) {
        const inputSources = Array.from(realSession.inputSources);
        const gamepads = navigator.getGamepads();

        const _loadHmd = () => {
          const {views} = pose;

          xrState.leftViewMatrix.set(views[0].transform.inverse.matrix);
          xrState.leftProjectionMatrix.set(views[0].projectionMatrix);

          xrState.rightViewMatrix.set(views[1].transform.inverse.matrix);
          xrState.rightProjectionMatrix.set(views[1].projectionMatrix);
          
          // console.log('load hmd', frame, pose, views, xrState.leftViewMatrix);

          localMatrix
            .fromArray(xrState.leftViewMatrix)
            .getInverse(localMatrix)
            .decompose(localVector, localQuaternion, localVector2)
          localVector.toArray(xrState.position);
          localQuaternion.toArray(xrState.orientation);
        };
        _loadHmd();

        const _loadGamepad = i => {
          const inputSource = inputSources[i];
          const xrGamepad = xrState.gamepads[i];

          let pose, gamepad;
          if (inputSource && (pose = frame.getPose(inputSource.targetRaySpace, referenceSpace)) && (gamepad = inputSource.gamepad || gamepads[i])) {
            const {transform} = pose;
            const {position, orientation, matrix} = transform;
            if (position) { // new WebXR api
              xrGamepad.position[0] = position.x;
              xrGamepad.position[1] = position.y;
              xrGamepad.position[2] = position.z;

              xrGamepad.orientation[0] = orientation.x;
              xrGamepad.orientation[1] = orientation.y;
              xrGamepad.orientation[2] = orientation.z;
              xrGamepad.orientation[3] = orientation.w;
            } else if (matrix) { // old WebXR api
              localMatrix
                .fromArray(transform.matrix)
                .decompose(localVector, localQuaternion, localVector2);

              xrGamepad.position[0] = localVector.x;
              xrGamepad.position[1] = localVector.y;
              xrGamepad.position[2] = localVector.z;

              xrGamepad.orientation[0] = localQuaternion.x;
              xrGamepad.orientation[1] = localQuaternion.y;
              xrGamepad.orientation[2] = localQuaternion.z;
              xrGamepad.orientation[3] = localQuaternion.w;
            }
            
            for (let j = 0; j < gamepad.buttons.length; j++) {
              const button = gamepad.buttons[j];
              const xrButton = xrGamepad.buttons[j];
              xrButton.pressed[0] = button.pressed;
              xrButton.touched[0] = button.touched;
              xrButton.value[0] = button.value;
            }
            
            for (let j = 0; j < gamepad.axes.length; j++) {
              xrGamepad.axes[j] = gamepad.axes[j];
            }
            
            xrGamepad.connected[0] = 1;
          } else {
            xrGamepad.connected[0] = 0;
          }
        };
        _loadGamepad(0);
        _loadGamepad(1);
      }
    }

    const _computeDerivedGamepadsData = () => {
      const _deriveGamepadData = gamepad => {
        localQuaternion.fromArray(gamepad.orientation);
        localVector
          .set(0, 0, -1)
          .applyQuaternion(localQuaternion)
          .toArray(gamepad.direction);
        localVector.fromArray(gamepad.position);
        localVector2.set(1, 1, 1);
        localMatrix
          .compose(localVector, localQuaternion, localVector2)
          .toArray(gamepad.transformMatrix);
      };
      for (let i = 0; i < xrState.gamepads.length; i++) {
        _deriveGamepadData(xrState.gamepads[i]);
      }
    };
    _computeDerivedGamepadsData();

    const {rig} = this;
    if (rig) {
      const m = new THREE.Matrix4().fromArray(xrState.leftViewMatrix);
      m.getInverse(m);
      m.decompose(rig.inputs.hmd.position, rig.inputs.hmd.quaternion, new THREE.Vector3(1, 1, 1));
      rig.inputs.leftGamepad.position.copy(rig.inputs.hmd.position).add(localVector.set(0.3, -0.15, -0.5).applyQuaternion(rig.inputs.hmd.quaternion));
      rig.inputs.leftGamepad.quaternion.copy(rig.inputs.hmd.quaternion);
      rig.inputs.rightGamepad.position.copy(rig.inputs.hmd.position).add(localVector.set(-0.3, -0.15, -0.5).applyQuaternion(rig.inputs.hmd.quaternion));
      rig.inputs.rightGamepad.quaternion.copy(rig.inputs.hmd.quaternion);
      rig.update();
    }

    this.renderer.state.reset();
    if (this.externalCanvas) {
      if (!this.renderState) {
        // this.localRenderTarget = new THREE.WebGLRenderTarget(this.renderer.domElement.width, this.renderer.domElement.height);

        const gl = this.externalContext;

        this.renderState = {};

        const oldBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
        const oldTexture2d = gl.getParameter(gl.TEXTURE_BINDING_2D);

        const positions = Float32Array.from([
          // First triangle:
           1.0,  1.0,
          -1.0,  1.0,
          -1.0, -1.0,
          // Second triangle:
          -1.0, -1.0,
           1.0, -1.0,
           1.0,  1.0
        ]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        this.renderState.vertexBuffer = vertexBuffer;

        const vs = gl.createShader(gl.VERTEX_SHADER);
        const vertexShader = `
          attribute vec2 position;
          varying vec2 vUv;
          const vec2 scale = vec2(0.5, 0.5);
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
            vUv = position * scale + scale; // scale vertex attribute to [0,1] range
            vUv.y = 1.0 - vUv.y;
          }
        `;
        gl.shaderSource(vs, vertexShader);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
          throw new Error("could not compile shader: " + gl.getShaderInfoLog(vs));
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        const fragmentShader = `
          precision highp float;

          uniform sampler2D tex;
          varying vec2 vUv;
          void main() {
            gl_FragColor = texture2D(tex, vUv);
          }
        `;
        gl.shaderSource(fs, fragmentShader);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
          throw new Error("could not compile shader: " + gl.getShaderInfoLog(fs));
        }

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error("program failed to link: " + gl.getProgramInfoLog(program));
        }
        this.renderState.program = program;
        gl.deleteShader(vs);
        gl.deleteShader(fs);

        this.renderState.positionLocation = gl.getAttribLocation(program, 'position');
        if (this.renderState.positionLocation === -1) {
          throw new Error('failed to get location: position');
        }
        this.renderState.texLocation = gl.getUniformLocation(program, 'tex');
        if (this.renderState.texLocation === -1) {
          throw new Error('failed to get location: tex');
        }

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.renderState.tex = tex;

        gl.bindBuffer(gl.ARRAY_BUFFER, oldBuffer);
        gl.bindTexture(gl.TEXTURE_2D, oldTexture2d);
      }
      // this.renderer.setRenderTarget(this.localRenderTarget);
    } /* else {
      this.renderer.setRenderTarget(null);
    } */

    // tick rafs
    const _tickRafs = () => {
      const rafs = this.rafs.slice();
      this.rafs.length = 0;
      for (let i = 0; i < rafs.length; i++) {
        rafs[i]();
      }
    };
    _tickRafs();

    this.renderer.render(this.scene, this.camera);

    if (this.externalCanvas) {
      const gl = this.externalContext;

      const oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
      const oldArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
      const oldActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
      // console.log('old active texture', oldActiveTexture);
      const oldTexture2d = gl.getParameter(gl.TEXTURE_BINDING_2D);
      const oldViewport = gl.getParameter(gl.VIEWPORT);
      const oldDepthTest = gl.getParameter(gl.DEPTH_TEST);

      gl.useProgram(this.renderState.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.renderState.vertexBuffer);
      gl.vertexAttribPointer(this.renderState.positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.renderState.positionLocation);
      gl.uniform1i(this.renderState.texLocation, oldActiveTexture - gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.renderState.tex);
      // console.log('tex image 2d', this.localRenderTarget.texture);
      // const tex = this.renderer.properties.get(this.localRenderTarget.texture).__webglTexture;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.renderer.domElement);
      gl.viewport(0, 0, this.externalCanvas.width, this.externalCanvas.height);
      gl.disable(gl.DEPTH_TEST);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.useProgram(oldProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, oldArrayBuffer);
      gl.bindTexture(gl.TEXTURE_2D, oldTexture2d);
      gl.viewport(oldViewport[0], oldViewport[1], oldViewport[2], oldViewport[3]);
      oldDepthTest && gl.enable(gl.DEPTH_TEST);
    }
  }
  requestAnimationFrame(fn) {
    this.rafs.push(fn);

    const id = ++this.ids;
    fn[symbols.rafCbsSymbol] = id;
    return id;
  }
  cancelAnimationFrame(id) {
    const index = this.rafs.findIndex(fn => fn[symbols.rafCbsSymbol].id === id);
    if (index !== -1) {
      this.rafs.splice(index, 1);
    }
  }
  setCamera(camera) {
    camera.matrixWorldInverse.toArray(xrState.leftViewMatrix);
    camera.projectionMatrix.toArray(xrState.leftProjectionMatrix);

    xrState.rightViewMatrix.set(xrState.leftViewMatrix);
    xrState.rightProjectionMatrix.set(xrState.leftProjectionMatrix);
  }
  setLocalAvatar(model) {
    if (this.rig) {
      this.scene.remove(this.rig);
      this.rig.destroy();
      this.rig = null;
    }

    if (model) {
      model.scene.traverse(o => {
        o.frustumCulled = false;
      });
      this.rig = new Avatar(model, {
        fingers: true,
        hair: true,
        visemes: true,
        decapitate: true,
        microphoneMediaStream: null,
        // debug: !newModel,
      });
      this.scene.add(this.rig.model);
    }
  }
}

export class XRPackage extends EventTarget {
  constructor(d) {
    super();

    this.loaded = false;

    const bundle = new wbn.Bundle(d);
    const files = [];
    for (const url of bundle.urls) {
      const response = bundle.getResponse(url);
      files.push({
        url,
        // status: response.status,
        // headers: response.headers,
        response,
        // body: response.body.toString('utf-8')
      });
    }
    this.files = files;
    
    const manifestJsonFile = files.find(file => new URL(file.url).pathname === '/manifest.json');
    if (manifestJsonFile) {
      const s = manifestJsonFile.response.body.toString('utf-8');
      const j = JSON.parse(s);
      if (j && typeof j.xr_type === 'string' && typeof j.xr_main === 'string') {
        const {
          xr_type: xrType,
          xr_main: xrMain,
        } = j;
        const loader = xrTypeLoaders[xrType];
        if (loader) {
          this.type = xrType;
          this.main = xrMain;

          loader(this)
            .then(o => {
              this.loaded = true;
              this.dispatchEvent(new MessageEvent('load', {
                data: {
                  type: this.type,
                  object: o,
                },
              }));
            });
        } else {
          throw new Error(`unknown xr_type: ${xrType}`);
        }
      } else {
        throw new Error('could not find xr_type string in manifest.json');
      }
    } else {
      throw new Error('no manifest.json in pack');
    }

    this.parent = null;
    this.context = {};
  }
  static async compileFromFile(file) {
    const _createFile = async (file, xrType, mimeType) => {
      const fileData = await new Promise((accept, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          accept(new Uint8Array(reader.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
      return this.compileRaw(
        [
          {
            url: '/' + file.name,
            type: mimeType,
            data: fileData,
          },
          {
            url: '/manifest.json',
            type: 'application/json',
            data: JSON.stringify({
              xr_type: xrType,
              xr_main: xrMain,
            }, null, 2),
          }
        ]
      );
    };

    if (/\.gltf$/.test(file.name)) {
      return await _createFile(file, 'gltf@0.0.1', 'model/gltf+json');
    } else if (/\.glb$/.test(file.name)) {
      return await _createFile(file, 'gltf@0.0.1', 'application/octet-stream')
    } else if (/\.vrm$/.test(file.name)) {
      return await _createFile(file, 'vrm@0.0.1', 'application/octet-stream');
    } else if (/\.html$/.test(file.name)) {
      return await _createFile(file, 'webxr-site@0.0.1', 'text/html');
    } else {
      throw new Error(`unknown file type: ${file.type}`);
    }
  }
  static compileRaw(files) {
    const manifestFile = files.find(file => file.url === '/manifest.json');
    const j = JSON.parse(manifestFile.data);
    const {xr_main: xrMain} = j;

    const primaryUrl = `https://xrpackage.org`;
    // const manifestUrl = primaryUrl + '/manifest.json';
    const builder = (new wbn.BundleBuilder(primaryUrl + '/' + xrMain))
      // .setManifestURL(manifestUrl);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const {url, type, data} = file;
      builder.addExchange(primaryUrl + url, 200, {
        'Content-Type': type,
      }, data);
    }
    return builder.createBundle();
  }
  getObject() {
    return this.context.object;
  }
  setMatrix(matrix) {
    this.context.object &&
      this.context.object.matrix
        .copy(matrix)
        .decompose(this.context.object.position, this.context.object.quaternion, this.context.object.scale);
  }
  setSession(session) {
    this.context.iframe && this.context.iframe.contentWindow.rs.setSession(session);
  }
  wearAvatar() {
    if (this.context.model) {
      this.parent.setLocalAvatar(this.context.model);
    }
  }
}