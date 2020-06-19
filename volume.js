/* eslint-disable no-throw-literal */
import THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {XRPackageEngine} from 'https://static.xrpackage.org/xrpackage.js';

const voxelWidth = 100;
const pixelRatio = 3;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

function makePromise() {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
}
const wireframeMaterial = new THREE.ShaderMaterial({
  vertexShader: `\
    uniform vec3 uHoverId;
    uniform vec3 uHoverColor;
    uniform vec3 uSelectId;
    uniform vec3 uSelectColor;
    attribute vec3 barycentric;
    attribute vec3 id;
    varying vec3 vPosition;
    varying vec3 vBC;
    varying vec3 vColor;
    vec3 color = vec3(0.984313725490196, 0.5490196078431373, 0.0);
    void main() {
      vBC = barycentric;
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vPosition = modelViewPosition.xyz;
      if (length(id - uSelectId) < 0.0001) {
        vColor = uSelectColor;
      } else if (length(id - uHoverId) < 0.0001) {
        vColor = uHoverColor;
      } else {
        vColor = color;
      }
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  fragmentShader: `\
    uniform sampler2D uCameraTex;
    varying vec3 vPosition;
    varying vec3 vBC;
    varying vec3 vColor;
    vec3 lightDirection = vec3(0.0, 0.0, 1.0);
    float edgeFactor() {
      vec3 d = fwidth(vBC);
      vec3 a3 = smoothstep(vec3(0.0), d*1.5, vBC);
      return min(min(a3.x, a3.y), a3.z);
    }
    void main() {
      float barycentricFactor = (0.2 + (1.0 - edgeFactor()) * 0.8);
      vec3 xTangent = dFdx( vPosition );
      vec3 yTangent = dFdy( vPosition );
      vec3 faceNormal = normalize( cross( xTangent, yTangent ) );
      float lightFactor = dot(faceNormal, lightDirection);
      gl_FragColor = vec4((0.5 + vColor * barycentricFactor) * lightFactor, 0.5 + barycentricFactor * 0.5);
    }
  `,
  side: THREE.DoubleSide,
  /* polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -4, */
  transparent: true,
  opacity: 0.5,
  // depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
  uniforms: {
    uHoverId: {
      type: 'v3',
      value: new THREE.Vector3(1, 1, 1),
    },
    uHoverColor: {
      type: 'v3',
      value: new THREE.Vector3(),
    },
    uSelectId: {
      type: 'v3',
      value: new THREE.Vector3(1, 1, 1),
    },
    uSelectColor: {
      type: 'v3',
      value: new THREE.Vector3(),
    },
  },
  extensions: {
    derivatives: true,
  },
});
const _getFirstMesh = o => {
  let firstMesh = null;
  o.traverse(o => {
    if (firstMesh === null && o.isMesh) {
      firstMesh = o;
    }
  });
  return firstMesh;
};
export function getWireframeMesh(o) {
  const firstMesh = _getFirstMesh(o);
  if (firstMesh) {
    const geometry = firstMesh.geometry.toNonIndexed();
    const barycentrics = (() => {
      const barycentrics = new Float32Array(geometry.attributes.position.array.length);
      for (let i = 0; i < barycentrics.length;) {
        barycentrics[i++] = 1;
        barycentrics[i++] = 0;
        barycentrics[i++] = 0;
        barycentrics[i++] = 0;
        barycentrics[i++] = 1;
        barycentrics[i++] = 0;
        barycentrics[i++] = 0;
        barycentrics[i++] = 0;
        barycentrics[i++] = 1;
      }
      return barycentrics;
    })();
    geometry.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3));
    const mesh = new THREE.Mesh(geometry, wireframeMaterial);
    return mesh;
  } else {
    return o;
  }
}
const idMaterial = new THREE.ShaderMaterial({
  uniforms: {
    /* uNear: {
      type: 'f',
      value: 0,
    },
    uFar: {
      type: 'f',
      value: 0,
    }, */
  },
  vertexShader: `
    attribute vec3 id;
    varying vec3 vId;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      vId = id;
    }
  `,
  fragmentShader: `
    varying vec3 vId;
    void main() {
      gl_FragColor = vec4(vId, 0.0);
    }
  `,
  // transparent: true,
  side: THREE.DoubleSide,
});

export function meshIdToArray(meshId) {
  return [
    ((meshId >> 16) & 0xFF),
    ((meshId >> 8) & 0xFF),
    (meshId & 0xFF),
  ];
}
export function decorateRaycastMesh(o, meshId) {
  const firstMesh = _getFirstMesh(o);
  if (firstMesh) {
    const {geometry} = firstMesh;
    const c = Uint8Array.from(meshIdToArray(meshId));
    const numPositions = geometry.attributes.position.array.length;
    const ids = new Uint8Array(numPositions);
    for (let i = 0; i < numPositions; i += 3) {
      ids.set(c, i);
    }
    geometry.setAttribute('id', new THREE.BufferAttribute(ids, 3, true));
  }
  o.meshId = meshId;
}
export class VolumeRaycaster {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
    });
    this.renderer.setSize(1, 1);
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1);
    this.scene = new THREE.Scene();
    this.scene.overrideMaterial = idMaterial;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.pixels = new Uint8Array(4);
  }

  raycastMeshes(meshes, origin, direction) {
    const oldParents = meshes.map(mesh => mesh.parent);
    for (let i = 0; i < meshes.length; i++) {
      this.scene.add(meshes[i]);
    }

    this.camera.position.copy(origin);
    this.camera.quaternion.setFromUnitVectors(localVector.set(0, 0, -1), direction);
    this.camera.updateMatrixWorld();

    this.renderer.render(this.scene, this.camera);

    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      const oldParent = oldParents[i];
      if (oldParent) {
        oldParent.add(mesh);
      } else {
        mesh.parent.remove(mesh);
      }
    }

    const gl = this.renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    let result;
    if (this.pixels[3] === 0) {
      const meshId = (this.pixels[0] << 16) | (this.pixels[1] << 8) | this.pixels[2];
      result = meshes.find(mesh => mesh.meshId === meshId) || null;
    } else {
      result = null;
    }

    return result;
  }
}

const modulePromise = makePromise();
self.wasmModule = (moduleName, moduleFn) => {
  if (moduleName === 'mc') {
    self.Module = moduleFn({
      print(text) { console.log(text); },
      printErr(text) { console.warn(text); },
      locateFile(path, scriptDirectory) {
        if (path === 'mc.wasm') {
          return 'bin/' + path;
        } else {
          return path;
        }
      },
      onRuntimeInitialized: () => {
        modulePromise.accept();
      },
    });

    // console.log('got module', Module);
  } else {
    console.warn('unknown wasm module', moduleName);
  }
};
import('./bin/mc.js');

class Allocator {
  constructor() {
    this.offsets = [];
  }

  alloc(constructor, size) {
    const offset = self.Module._doMalloc(size * constructor.BYTES_PER_ELEMENT);
    const b = new constructor(self.Module.HEAP8.buffer, self.Module.HEAP8.byteOffset + offset, size);
    b.offset = offset;
    this.offsets.push(offset);
    return b;
  }

  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      self.Module._doFree(this.offsets[i]);
    }
    this.offsets.length = 0;
  }
}

const getDefaultAabb = () => new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(10, 10, 10),
);
const getPreviewMesh = async p => {
  const pe = new XRPackageEngine({
    width: voxelWidth,
    height: voxelWidth,
    devicePixelRatio: pixelRatio,
    autoStart: false,
    autoListen: false,
  });
  await pe.add(p);

  async function marchPotentials(data) {
    const {depthTextures: depthTexturesData, dims: dimsData, shift: shiftData, size: sizeData, pixelRatio, value, nvalue} = data;

    const allocator = new Allocator();

    const depthTextures = allocator.alloc(Float32Array, depthTexturesData.length);
    depthTextures.set(depthTexturesData);

    const positions = allocator.alloc(Float32Array, 1024 * 1024 * Float32Array.BYTES_PER_ELEMENT);
    const indices = allocator.alloc(Uint32Array, 1024 * 1024 * Uint32Array.BYTES_PER_ELEMENT);

    const numPositions = allocator.alloc(Uint32Array, 1);
    numPositions[0] = positions.length;
    const numIndices = allocator.alloc(Uint32Array, 1);
    numIndices[0] = indices.length;

    const dims = allocator.alloc(Int32Array, 3);
    dims.set(Int32Array.from(dimsData));

    const shift = allocator.alloc(Float32Array, 3);
    shift.set(Float32Array.from(shiftData));

    const size = allocator.alloc(Float32Array, 3);
    size.set(Float32Array.from(sizeData));

    self.Module._doMarchPotentials(
      depthTextures.offset,
      dims.offset,
      shift.offset,
      size.offset,
      pixelRatio,
      value,
      nvalue,
      positions.offset,
      indices.offset,
      numPositions.offset,
      numIndices.offset,
    );

    const arrayBuffer2 = new ArrayBuffer(
      Uint32Array.BYTES_PER_ELEMENT +
      numPositions[0] * Float32Array.BYTES_PER_ELEMENT +
      Uint32Array.BYTES_PER_ELEMENT +
      numIndices[0] * Uint32Array.BYTES_PER_ELEMENT,
    );
    let index = 0;

    const outP = new Float32Array(arrayBuffer2, index, numPositions[0]);
    outP.set(new Float32Array(positions.buffer, positions.byteOffset, numPositions[0]));
    index += Float32Array.BYTES_PER_ELEMENT * numPositions[0];

    const outI = new Uint32Array(arrayBuffer2, index, numIndices[0]);
    outI.set(new Uint32Array(indices.buffer, indices.byteOffset, numIndices[0]));
    index += Uint32Array.BYTES_PER_ELEMENT * numIndices[0];

    return {
      // result: {
      positions: outP,
      indices: outI,
      /* },
      cleanup: () => {
        allocator.freeAll();

        this.running = false;
        if (this.queue.length > 0) {
          const fn = this.queue.shift();
          fn();
        }
      }, */
    };
  }

  const camera = new THREE.OrthographicCamera(Math.PI, Math.PI, Math.PI, Math.PI, 0.001, 1000);
  pe.camera = camera;
  const gl = pe.context;

  const xrfb = gl.createFramebuffer();
  const rfb = gl.createFramebuffer();
  const colorRenderbuffer = gl.createRenderbuffer();
  const depthRenderbuffer = gl.createRenderbuffer();
  const tex = gl.createTexture();
  const depthTex = gl.createTexture();

  {
    // save state
    const oldReadFbo = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
    const oldDrawFbo = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);
    const oldRenderbufferBinding = gl.getParameter(gl.RENDERBUFFER_BINDING);
    const oldTextureBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);

    // xrfb
    gl.bindFramebuffer(gl.FRAMEBUFFER, xrfb);

    gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, gl.RGBA8, voxelWidth * pixelRatio, voxelWidth * pixelRatio);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorRenderbuffer);

    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, gl.DEPTH32F_STENCIL8, voxelWidth * pixelRatio, voxelWidth * pixelRatio);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);

    pe.setXrFramebuffer(xrfb);

    // rfb
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, xrfb);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rfb);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, voxelWidth * pixelRatio, voxelWidth * pixelRatio, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    gl.bindTexture(gl.TEXTURE_2D, depthTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH32F_STENCIL8, voxelWidth * pixelRatio, voxelWidth * pixelRatio);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);

    // restore state
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, oldReadFbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, oldDrawFbo);
    gl.bindRenderbuffer(gl.RENDERBUFFER, oldRenderbufferBinding);
    gl.bindTexture(gl.TEXTURE_2D, oldTextureBinding);
  }

  const vsh = `
precision highp float;

// xy = vertex position in normalized device coordinates ([-1,+1] range).
attribute vec2 vertexPositionNDC;

varying vec2 vTexCoords;

const vec2 scale = vec2(0.5, 0.5);

void main() {
  vTexCoords  = vertexPositionNDC * scale + scale; // scale vertex attribute to [0,1] range
  gl_Position = vec4(vertexPositionNDC, 0.0, 1.0);
}
`;
  const fsh = `
precision highp float;

uniform sampler2D colorMap;
varying vec2 vTexCoords;

uniform float uNear;
uniform float uFar;
vec4 encodePixelDepth(float v) {
  float x = fract(v);
  v -= x;
  v /= 255.0;
  float y = fract(v);
  v -= y;
  v /= 255.0;
  float z = fract(v);
  /* v -= y;
  v /= 255.0;
  float w = fract(v);
  float w = 0.0;
  if (x == 0.0 && y == 0.0 && z == 0.0 && w == 0.0) {
    return vec4(0.0, 0.0, 0.0, 1.0);
  } else { */
    return vec4(x, y, z, 0.0);
  // }
}
void main() {
  // gl_FragColor = texture2D(colorMap, vTexCoords);
  float z_b = texture2D(colorMap, vTexCoords).r;
  float z_n = 2.0 * z_b - 1.0;
  float z_e = 2.0 * uNear * uFar / (uFar + uNear - z_n * (uFar - uNear));
  gl_FragColor = encodePixelDepth(z_e);
}`;
  function compileShader(gl, shaderSource, shaderType) {
    // Create the shader object
    const shader = gl.createShader(shaderType);

    // Set the shader source code.
    gl.shaderSource(shader, shaderSource);

    // Compile the shader
    gl.compileShader(shader);

    // Check if it compiled
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      // Something went wrong during compilation; get the error
      throw 'could not compile shader:' + gl.getShaderInfoLog(shader);
    }

    return shader;
  }
  function createProgram(gl, vertexShader, fragmentShader) {
    // create a program.
    const program = gl.createProgram();

    // attach the shaders.
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // link the program.
    gl.linkProgram(program);

    // Check if it linked.
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
      // something went wrong with the link
      throw ('program failed to link:' + gl.getProgramInfoLog(program));
    }

    return program;
  }

  const vShader = compileShader(gl, vsh, gl.VERTEX_SHADER);
  const fShader = compileShader(gl, fsh, gl.FRAGMENT_SHADER);
  const shaderProgram = createProgram(gl, vShader, fShader);
  const vertexAttributes = {
    vertexPositionNDC: gl.getAttribLocation(shaderProgram, 'vertexPositionNDC'),
  };
  const uniforms = {
    colorMap: gl.getUniformLocation(shaderProgram, 'colorMap'),
    uNear: gl.getUniformLocation(shaderProgram, 'uNear'),
    uFar: gl.getUniformLocation(shaderProgram, 'uFar'),
  };

  const screenQuadVBO = (() => {
    // save state
    const oldArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const verts = Float32Array.from([
      // First triangle:
      1.0, 1.0,
      -1.0, 1.0,
      -1.0, -1.0,
      // Second triangle:
      -1.0, -1.0,
      1.0, -1.0,
      1.0, 1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    // restore state
    gl.bindBuffer(gl.ARRAY_BUFFER, oldArrayBuffer);

    return vbo;
  })();

  {
    const updateView = (p, q) => {
      // if (!camera.position.equals(p) || !camera.quaternion.equals(q)) {
      camera.position.copy(p);
      camera.quaternion.copy(q);
      camera.updateMatrixWorld();
      // }
    };
    const updateSize = (uSize, vSize, dSize) => {
      camera.left = uSize / -2;
      camera.right = uSize / 2;
      camera.top = vSize / 2;
      camera.bottom = vSize / -2;
      camera.near = 0.001;
      camera.far = dSize;
      camera.updateProjectionMatrix();
    };
    const renderDepth = () => {
      // render
      pe.tick();

      // save state
      const oldReadFbo = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
      const oldDrawFbo = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);
      const oldProgram = gl.getParameter(gl.CURRENT_PROGRAM);
      const oldActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
      const oldArrayBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
      const oldViewport = gl.getParameter(gl.VIEWPORT);

      // resolve
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, xrfb);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rfb);
      gl.blitFramebuffer(
        0, 0, voxelWidth * pixelRatio, voxelWidth * pixelRatio,
        0, 0, voxelWidth * pixelRatio, voxelWidth * pixelRatio,
        gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT, gl.NEAREST,
      );

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

      // read
      gl.useProgram(shaderProgram);

      gl.activeTexture(gl.TEXTURE0);
      const oldTextureBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
      gl.bindTexture(gl.TEXTURE_2D, depthTex);
      gl.uniform1i(uniforms.colorMap, 0);
      gl.uniform1f(uniforms.uNear, camera.near);
      gl.uniform1f(uniforms.uFar, camera.far);

      gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadVBO);
      gl.enableVertexAttribArray(vertexAttributes.vertexPositionNDC);
      gl.vertexAttribPointer(vertexAttributes.vertexPositionNDC, 2, gl.FLOAT, false, 0, 0);

      gl.viewport(0, 0, voxelWidth * pixelRatio, voxelWidth * pixelRatio);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // restore state
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, oldReadFbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, oldDrawFbo);
      gl.useProgram(oldProgram);
      gl.bindTexture(gl.TEXTURE_2D, oldTextureBinding);
      gl.activeTexture(oldActiveTexture);
      gl.bindBuffer(gl.ARRAY_BUFFER, oldArrayBuffer);
      gl.viewport(oldViewport[0], oldViewport[1], oldViewport[2], oldViewport[3]);
    };
    const getDepthPixels = (depthTextures, i) => {
      // save state
      const oldFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const pixels = new Uint8Array(voxelWidth * pixelRatio * voxelWidth * pixelRatio * 4);
      gl.readPixels(0, 0, voxelWidth * pixelRatio, voxelWidth * pixelRatio, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      const depths = new Float32Array(depthTextures.buffer, depthTextures.byteOffset + i * voxelWidth * pixelRatio * voxelWidth * pixelRatio * Float32Array.BYTES_PER_ELEMENT, voxelWidth * pixelRatio * voxelWidth * pixelRatio);
      let j = 0;
      for (let i = 0; i < depths.length; i++) {
        let v =
          pixels[j++] / 255.0 +
          pixels[j++] +
          pixels[j++] * 255.0 +
          pixels[j++] * 255.0 * 255.0;
        if (v > camera.far) {
          v = Infinity;
        }
        depths[i] = v;
      }

      // restore state
      gl.bindFramebuffer(gl.FRAMEBUFFER, oldFbo);
    };

    let aabb = p.getAabb();
    if (!aabb) {
      aabb = getDefaultAabb();
    }
    const center = aabb.getCenter(new THREE.Vector3());
    const size = aabb.getSize(new THREE.Vector3());

    const voxelResolution = size.clone().divideScalar(voxelWidth);

    const _multiplyLength = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

    const depthTextures = new Float32Array(voxelWidth * pixelRatio * voxelWidth * pixelRatio * 6);
    [
      [center.x, center.y, center.z + size.z / 2, 0, 0, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)],
      [center.x + size.x / 2, center.y, center.z, Math.PI / 2, 0, new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)],
      [center.x, center.y, center.z - size.z / 2, Math.PI / 2 * 2, 0, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)],
      [center.x - size.x / 2, center.y, center.z, Math.PI / 2 * 3, 0, new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)],
      [center.x, center.y + size.y / 2, center.z, 0, -Math.PI / 2, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)],
      [center.x, center.y - size.y / 2, center.z, 0, Math.PI / 2, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)],
    ].forEach(([x, y, z, ry, rx, sx, sy, sz], i) => {
      localVector.set(x, y, z);
      if (ry !== 0) {
        localQuaternion.setFromAxisAngle(localVector2.set(0, 1, 0), ry);
      } else if (rx !== 0) {
        localQuaternion.setFromAxisAngle(localVector2.set(1, 0, 0), rx);
      } else {
        localQuaternion.set(0, 0, 0, 1);
      }
      updateView(localVector, localQuaternion);
      updateSize(_multiplyLength(size, sx), _multiplyLength(size, sy), _multiplyLength(size, sz));
      renderDepth();

      /* const canvas = document.createElement('canvas');
      canvas.width = voxelWidth * pixelRatio;
      canvas.height = voxelWidth * pixelRatio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(pe.domElement, 0, 0);
      document.body.appendChild(canvas); */

      getDepthPixels(depthTextures, i);
    });

    pe.remove(p);

    const res = await marchPotentials({
      depthTextures,
      dims: [voxelWidth, voxelWidth, voxelWidth],
      shift: [voxelResolution.x / 2 + center.x - size.x / 2, voxelResolution.y / 2 + center.y - size.y / 2, voxelResolution.z / 2 + center.z - size.z / 2],
      size: [size.x, size.y, size.z],
      pixelRatio,
      value: 1,
      nvalue: -1,
    });
    console.log('geometry', res);
    return res;
  }
};
export {
  wireframeMaterial,
  getDefaultAabb,
  getPreviewMesh,
};
