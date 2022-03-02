import * as THREE from 'three';
import {getRenderer, scene} from './renderer.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {world} from './world.js';
import {fitCameraToBoundingBox} from './util.js';
import {Text} from 'troika-three-text';
import {defaultDioramaSize} from './constants.js';
import postProcessing from './post-processing.js';
import gradients from './gradients.json';
import {
  fullscreenVertexShader,
  outlineShader,
  animeLightningFragmentShader,
  animeRadialShader,
  grassFragmentShader,
  glyphFragmentShader,
} from './diorama-shaders.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localMatrix = new THREE.Matrix4();

// I like... macaroni and cheese, is that ok?
// we all want unlimited power, don't we?

// this function maps the speed histogram to a position, integrated up to the given timestamp
const mapTime = (speedHistogram = new SpeedHistogram, time = 0) => {
  const {elements} = speedHistogram;
  const totalDistance = speedHistogram.totalDistance();
  // const totalDuration = speedHistogram.totalDuration();
  // const totalDistance = this.totalDistance();
  let currentTime = 0;
  let currentDistance = 0;
  for (let i = 0; i < elements.length; i++) {
    const {speed, duration} = elements[i];
    if (time < currentTime + duration) {
      currentDistance += speed * (time - currentTime);
      break;
    } else {
      currentTime += duration;
      currentDistance += speed * duration;
    }
  }
  return currentDistance / totalDistance;
};
// a container class that stores instantaneous speed changes over time
class SpeedHistogram {
  constructor() {
    this.elements = [];
  }
  add(speed, duration) {
    this.elements.push({speed, duration});
  }
  totalDuration() {
    const {elements} = this;
    let totalDuration = 0;
    for (let i = 0; i < elements.length; i++) {
      totalDuration += elements[i].duration;
    }
    return totalDuration;
  }
  totalDistance() {
    const {elements} = this;
    // const totalDuration = this.totalDuration();
    let totalDistance = 0;
    for (let i = 0; i < elements.length; i++) {
      totalDistance += elements[i].speed * elements[i].duration;
    }
    return totalDistance;
  }
  fromArray(elements) {
    this.elements = elements;
    return this;
  }
  toArray(frameRate = 60, startTime = 0, endTime = this.totalDuration()) {
    // const {elements} = this;
    // const totalDuration = this.totalDuration();
    // const totalDistance = this.totalDistance();
    const startTimeSeconds = startTime / 1000;
    const endTimeSeconds = endTime / 1000;
    // const startPosition = mapTime(this, startTime);
    // const endPosition = mapTime(this, endTime);
    const frameCount = Math.ceil(endTimeSeconds - startTimeSeconds) * frameRate;
    const positions = [];
    for (let i = 0; i < frameCount; i++) {
      const time = startTimeSeconds + i / frameRate;
      const position = mapTime(this, time * 1000);
      // const normalizedPosition = position / totalDistance;
      positions.push(position);
    }
    return positions;
  }
}
const histogram = new SpeedHistogram().fromArray([
  {speed: 10, duration: 100},
  {speed: 0.05, duration: 2000},
  {speed: 10, duration: 100},
]).toArray(60);
const labelAnimationRate = 3;
const labelVertexShader = `\
  uniform float iTime;
  attribute vec3 color;
  varying vec2 tex_coords;
  varying vec3 vColor;

  float frames[${histogram.length}] = float[${histogram.length}](${histogram.map(v => v.toFixed(8)).join(', ')});
  float mapTime(float t) {
    t /= ${labelAnimationRate.toFixed(8)};
    t = mod(t, 1.);

    const float l = ${histogram.length.toFixed(8)};
    float frameIndexFloat = floor(min(t, 0.999) * l);
    //return frameIndexFloat / l;

    int frameIndex = int(frameIndexFloat);
    float leftFrame = frames[frameIndex];
    // return leftFrame;

    float rightFrame = frames[frameIndex + 1];
    float frameStartTime = frameIndexFloat / l;
    float frameDuration = 1. / (l - 1.);
    float factor = (t - frameStartTime) / frameDuration;
    float frame = leftFrame*(1.-factor) + rightFrame*factor;
    return frame;
  }

  void main() {
    tex_coords = uv;
    vColor = color;
    float t = mapTime(iTime);
    gl_Position = vec4(position.xy + vec2(-2. + t * 4., 0.) * position.z, -1., 1.);
  }
`;
const labelFragmentShader = `\
  varying vec2 tex_coords;
  varying vec3 vColor;

  vec2 rotateCCW(vec2 pos, float angle) { 
    float ca = cos(angle),  sa = sin(angle);
    return pos * mat2(ca, sa, -sa, ca);  
  }

  vec2 rotateCCW(vec2 pos, vec2 around, float angle) { 
    pos -= around;
    pos = rotateCCW(pos, angle);
    pos += around;
    return pos;
  }

  // return 1 if v inside the box, return 0 otherwise
  bool insideAABB(vec2 v, vec2 bottomLeft, vec2 topRight) {
      vec2 s = step(bottomLeft, v) - step(topRight, v);
      return s.x * s.y > 0.;   
  }

  bool isPointInTriangle(vec2 point, vec2 a, vec2 b, vec2 c) {
    vec2 v0 = c - a;
    vec2 v1 = b - a;
    vec2 v2 = point - a;

    float dot00 = dot(v0, v0);
    float dot01 = dot(v0, v1);
    float dot02 = dot(v0, v2);
    float dot11 = dot(v1, v1);
    float dot12 = dot(v1, v2);

    float invDenom = 1. / (dot00 * dot11 - dot01 * dot01);
    float u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    float v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0.) && (v >= 0.) && (u + v < 1.);
  }

  void main() {
    vec3 c;
    if (vColor.r > 0.) {
      /* if (tex_coords.x <= 0.025 || tex_coords.x >= 0.975 || tex_coords.y <= 0.05 || tex_coords.y >= 0.95) {
        c = vec3(0.2);
      } else { */
        c = vec3(0.1 + tex_coords.y * 0.1);
      // }
    } else {
      c = vec3(0.);
    }
    gl_FragColor = vec4(c, 1.0);
  }
`;
const textVertexShader = `\
  uniform float uTroikaOutlineOpacity;
  // attribute vec3 color;
  attribute vec3 offset;
  attribute float scale;
  varying vec2 tex_coords;
  // varying vec3 vColor;

  float frames[${histogram.length}] = float[${histogram.length}](${histogram.map(v => v.toFixed(8)).join(', ')});
  float mapTime(float t) {
    t /= ${labelAnimationRate.toFixed(8)};
    t = mod(t, 1.);

    const float l = ${histogram.length.toFixed(8)};
    float frameIndexFloat = floor(min(t, 0.999) * l);
    //return frameIndexFloat / l;

    int frameIndex = int(frameIndexFloat);
    float leftFrame = frames[frameIndex];
    // return leftFrame;

    float rightFrame = frames[frameIndex + 1];
    float frameStartTime = frameIndexFloat / l;
    float frameDuration = 1. / (l - 1.);
    float factor = (t - frameStartTime) / frameDuration;
    float frame = leftFrame*(1.-factor) + rightFrame*factor;
    return frame;
  }

  void main() {
    tex_coords = uv;
    // vColor = color;

    float iTime = uTroikaOutlineOpacity;
    float t = mapTime(iTime);
    gl_Position = vec4(offset.xy + position.xy * scale + vec2(-2. + t * 4., 0.) * position.z, -1., 1.);
  }
`;
const textFragmentShader = `\
  void main() {
    gl_FragColor = vec4(vec3(1.), 1.);
  }
`;
const planeGeometry = new THREE.PlaneGeometry(2, 2);
async function makeTextMesh(
  text = '',
  material = null,
  font = '/fonts/Bangers-Regular.ttf',
  fontSize = 1,
  letterSpacing = 0,
  anchorX = 'left',
  anchorY = 'middle',
  color = 0x000000,
) {
  const textMesh = new Text();
  textMesh.text = text;
  if (material !== null) {
    textMesh.material = material;
  }
  textMesh.font = font;
  textMesh.fontSize = fontSize;
  textMesh.letterSpacing = letterSpacing;
  textMesh.color = color;
  textMesh.anchorX = anchorX;
  textMesh.anchorY = anchorY;
  textMesh.frustumCulled = false;
  await new Promise(accept => {
    textMesh.sync(accept);
  });
  return textMesh;
}
const lightningMesh = (() => {
  const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: false,
        },
        iFrame: {
          value: 0,
          needsUpdate: false,
        },
        iChannel0: {
          value: textureLoader.load('/textures/pebbles.png'),
          // needsUpdate: true,
        },
        iChannel1: {
          value: textureLoader.load('/textures/noise.png'),
          // needsUpdate: true,
        },
        uColor1: {
          value: new THREE.Color(0x000000),
          needsUpdate: true,
        },
        uColor2: {
          value: new THREE.Color(0xFFFFFF),
          needsUpdate: true,
        },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: animeLightningFragmentShader,
      depthWrite: false,
      depthTest: false,
    })
  );
  /* quad.material.onBeforeCompile = shader => {
    console.log('got full screen shader', shader);
  }; */
  quad.material.uniforms.iChannel0.value.wrapS = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel0.value.wrapT = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel1.value.wrapS = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel1.value.wrapT = THREE.RepeatWrapping;
  quad.frustumCulled = false;
  return quad;
})();
const radialMesh = (() => {
  // const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: false,
        },
        iFrame: {
          value: 0,
          needsUpdate: false,
        },
        /* iChannel0: {
          value: textureLoader.load('/textures/pebbles.png'),
          // needsUpdate: true,
        },
        iChannel1: {
          value: textureLoader.load('/textures/noise.png'),
          // needsUpdate: true,
        }, */
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: animeRadialShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    })
  );
  /* quad.material.onBeforeCompile = shader => {
    console.log('got full screen shader', shader);
  }; */
  /* quad.material.uniforms.iChannel0.value.wrapS = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel0.value.wrapT = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel1.value.wrapS = THREE.RepeatWrapping;
  quad.material.uniforms.iChannel1.value.wrapT = THREE.RepeatWrapping; */
  quad.frustumCulled = false;
  return quad;
})();
const outlineMesh = (() => {
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        t0: {
          value: null,
          needsUpdate: false,
        },
        outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        },
        uColor1: {
          value: new THREE.Color(0x000000),
          needsUpdate: true,
        },
        uColor2: {
          value: new THREE.Color(0xFFFFFF),
          needsUpdate: true,
        },
        outline_threshold: {
          value: .5,
          needsUpdate: true,
        },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: outlineShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    })
  );
  /* quad.material.onBeforeCompile = shader => {
    console.log('got full screen shader', shader);
  }; */
  quad.frustumCulled = false;
  return quad;
})();
const s1 = 0.4;
const sk1 = 0.2;
const speed1 = 1;
const aspectRatio1 = 0.3;
const p1 = new THREE.Vector3(0.45, -0.65, 0);
const s2 = 0.5;
const sk2 = 0.1;
const speed2 = 1.5;
const aspectRatio2 = 0.15;
const p2 = new THREE.Vector3(0.35, -0.825, 0);
const labelMesh = (() => {
  const _decorateGeometry = (g, color, z) => {
    const colors = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      color.toArray(colors, i);
      g.attributes.position.array[i + 2] = z;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  };
  const g1 = planeGeometry.clone()
    .applyMatrix4(
      new THREE.Matrix4()
        .makeShear(0, 0, sk1, 0, 0, 0)
    )
    .applyMatrix4(
      new THREE.Matrix4()
        .makeScale(s1, s1 * aspectRatio1, 1)
    )
    .applyMatrix4(
      new THREE.Matrix4()
        .makeTranslation(p1.x, p1.y, p1.z)
    );
  _decorateGeometry(g1, new THREE.Color(0xFFFFFF), speed1);
  const g2 = planeGeometry.clone()
    .applyMatrix4(
      new THREE.Matrix4()
        .makeShear(0, 0, sk2, 0, 0, 0)
    )
    .applyMatrix4(
      new THREE.Matrix4()
        .makeScale(s2, s2 * aspectRatio2, 1)
    )
    .applyMatrix4(
      new THREE.Matrix4()
        .makeTranslation(p2.x, p2.y, p2.z)
    );
  _decorateGeometry(g2, new THREE.Color(0x000000), speed2);
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    g2,
    g1,
  ]);
  const quad = new THREE.Mesh(
    geometry,
    new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: false,
        },
        /* outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        },
        outline_colour: {
          value: new THREE.Color(0, 0, 1),
          needsUpdate: true,
        },
        outline_threshold: {
          value: .5,
          needsUpdate: true,
        }, */
      },
      vertexShader: labelVertexShader,
      fragmentShader: labelFragmentShader,
    })
  );
  quad.frustumCulled = false;
  return quad;
})();
const grassMesh = (() => {
  const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          needsUpdate: false,
        },
        iChannel0: {
          value: textureLoader.load('/textures/pebbles.png'),
          // needsUpdate: true,
        },
        iChannel1: {
          value: textureLoader.load('/textures/noise.png'),
          // needsUpdate: true,
        },
        /* iFrame: {
          value: 0,
          needsUpdate: false,
        }, */
        /* outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        }, */
        uColor1: {
          value: new THREE.Color(0x000000),
          needsUpdate: true,
        },
        uColor2: {
          value: new THREE.Color(0xFFFFFF),
          needsUpdate: true,
        },
        /* outline_threshold: {
          value: .5,
          needsUpdate: true,
        }, */
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: grassFragmentShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    })
  );
  quad.frustumCulled = false;
  return quad;
})();
const glyphMesh = (() => {
  const textureLoader = new THREE.TextureLoader();
  const quad = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
          // needsUpdate: true,
        },
        iChannel0: {
          value: textureLoader.load('/textures/lichen.jpg'),
          // needsUpdate: true,
        },
        /* outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        }, */
        uColor1: {
          value: new THREE.Color(0x000000),
          needsUpdate: true,
        },
        uColor2: {
          value: new THREE.Color(0xFFFFFF),
          needsUpdate: true,
        },
        /* outline_threshold: {
          value: .5,
          needsUpdate: true,
        }, */
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: glyphFragmentShader,
      depthWrite: false,
      depthTest: false,
      alphaToCoverage: true,
    })
  );
  quad.frustumCulled = false;
  return quad;
})();
const textObject = (() => {
  const o = new THREE.Object3D();
  
  const _decorateGeometry = (g, offset, z, scale) => {
    const offsets = new Float32Array(g.attributes.position.array.length);
    const scales = new Float32Array(g.attributes.position.count);
    for (let i = 0; i < g.attributes.position.array.length; i += 3) {
      offset.toArray(offsets, i);
      g.attributes.position.array[i + 2] = z;
      scales[i / 3] = scale;
    }
    g.setAttribute('offset', new THREE.BufferAttribute(offsets, 3));
    g.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
  };
  const textMaterial = new THREE.ShaderMaterial({
    vertexShader: textVertexShader,
    fragmentShader: textFragmentShader,
  });
  (async () => {
    const nameMesh = await makeTextMesh(
      'Scillia',
      textMaterial,
      '/fonts/WinchesterCaps.ttf',
      1.25,
      0.05,
      'center',
      'middle',
      0xFFFFFF,
    );
    _decorateGeometry(nameMesh.geometry, p1, speed1, s1 * aspectRatio1);
    o.add(nameMesh);
  })();
  (async () => {
    const labelMesh = await makeTextMesh(
      'pledged to the lisk',
      textMaterial,
      '/fonts/Plaza Regular.ttf',
      1,
      0.02,
      'center',
      'middle',
      0xFFFFFF,
    );
    _decorateGeometry(labelMesh.geometry, p2, speed2, s2 * aspectRatio2);
    o.add(labelMesh);
  })();
  return o;
})();
const skinnedRedMaterial = (() => {
  let wVertex = THREE.ShaderLib["standard"].vertexShader;
  let wFragment = THREE.ShaderLib["standard"].fragmentShader;
  let wUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib["standard"].uniforms);
  wUniforms.iTime = {
    value: 0,
    needsUpdate: false,
  };
  /* wVertex = `\
    attribute vec3 offset;
    attribute vec4 orientation;

    vec3 applyQuaternionToVector(vec4 q, vec3 v){
      return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
    }

  ` + wVertex;

  wVertex = wVertex.replace(`\
    #include <project_vertex>
    vec3 vPosition = applyQuaternionToVector(orientation, transformed);

    vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
    
  `); */
  wFragment = `\
    void main() {
      gl_FragColor = vec4(1., 0., 0., 1.);
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: wUniforms,
    vertexShader: wVertex,
    fragmentShader: wFragment,
    // lights: true,
    // depthPacking: THREE.RGBADepthPacking,
    // name: "detail-material",
    // fog: true,
    extensions: {
      derivatives: true,
    },
    side: THREE.BackSide,
  });
  return material;
})();

const outlineRenderScene = new THREE.Scene();
outlineRenderScene.name = 'outlineRenderScene';
outlineRenderScene.autoUpdate = false;
outlineRenderScene.overrideMaterial = skinnedRedMaterial;

const sideScene = new THREE.Scene();
sideScene.name = 'sideScene';
sideScene.autoUpdate = false;
sideScene.add(lightningMesh);
sideScene.add(radialMesh);
sideScene.add(grassMesh);
sideScene.add(glyphMesh);
sideScene.add(outlineMesh);
sideScene.add(labelMesh);
sideScene.add(textObject);
const _addPreviewLights = scene => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 2, 3);
  directionalLight.updateMatrixWorld();
  scene.add(directionalLight);
};
_addPreviewLights(sideScene);
/* let sideSceneCompiled = false;
const _ensureSideSceneCompiled = () => {
  if (!sideSceneCompiled) {
    const renderer = getRenderer();
    renderer.compileAsync(sideScene);
    sideSceneCompiled = true;
  }
}; */

const sideCamera = new THREE.PerspectiveCamera();

const _makeCanvas = (w, h) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.cssText = `\
    position: absolute;
    /* width: ${w}px;
    height: ${h}px; */
    top: 0px;
    left: 0px;
  `;
  return canvas;
};
const _makeOutlineRenderTarget = (w, h) => new THREE.WebGLRenderTarget(w, h, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
});
const createPlayerDiorama = (player, {
  canvas,
  label = null,
  outline = false,
  lightningBackground = false,
  radialBackground = false,
  glyphBackground = false,
  grassBackground = false,
} = {}) => {
  // _ensureSideSceneCompiled();

  const {devicePixelRatio: pixelRatio} = window;

  const renderer = getRenderer();
  /* sideCamera.position.set(0, 0, 10);
  sideCamera.quaternion.identity();
  sideCamera.updateMatrixWorld();
  renderer.compile(sideScene, sideCamera); */

  let locallyOwnedCanvas;
  if (canvas) {
    locallyOwnedCanvas = null;
  } else {
    canvas = _makeCanvas(defaultDioramaSize, defaultDioramaSize);
    document.body.appendChild(canvas);
    locallyOwnedCanvas = canvas;
  }
  const canvases = [];
  let outlineRenderTarget = null
  let lastDisabledTime = 0;

  const diorama = {
    width: 0,
    height: 0,
    loaded: false,
    enabled: true,
    addCanvas(canvas) {
      const {width, height} = canvas;
      this.width = Math.max(this.width, width);
      this.height = Math.max(this.height, height);

      const ctx = canvas.getContext('2d');
      canvas.ctx = ctx;

      canvases.push(canvas);
    },
    toggleShader() {
      const oldValues = {lightningBackground, radialBackground, glyphBackground, grassBackground};
      lightningBackground = false;
      radialBackground = false;
      glyphBackground = false;
      grassBackground = false;
      if (oldValues.lightningBackground) {
        radialBackground = true;
      } else if (oldValues.radialBackground) {
        glyphBackground = true;
      } else if (oldValues.glyphBackground) {
        grassBackground = true;
      } else if (oldValues.grassBackground) {
        lightningBackground = true;
      }
    },
    triggerLoad() {
      Promise.all([
        (async () => {
          await renderer.compileAsync(player.avatar.model, outlineRenderScene);
        })(),
        (async () => {
          await renderer.compileAsync(player.avatar.model, sideScene);
        })(),
      ]).then(() => {
        this.loaded = true;
      });
    },
    update(timestamp, timeDiff) {
      if (!this.loaded || !this.enabled) {
        lastDisabledTime = timestamp;
        return;
      }
      const timeOffset = timestamp - lastDisabledTime;

      const renderer = getRenderer();
      const size = renderer.getSize(localVector2D);
      // a Vector2 representing the largest power of two less than or equal to the current canvas size
      const sizePowerOfTwo = localVector2D2.set(
        Math.pow(2, Math.floor(Math.log(size.x) / Math.log(2))),
        Math.pow(2, Math.floor(Math.log(size.y) / Math.log(2))),
      );
      if (sizePowerOfTwo.x < this.width || sizePowerOfTwo.y < this.height) {
        console.warn('renderer is too small');
        return;
      }

      if (!outlineRenderTarget || (outlineRenderTarget.width !== this.width * pixelRatio) || (outlineRenderTarget.height !== this.height * pixelRatio)) {
        outlineRenderTarget = _makeOutlineRenderTarget(this.width * pixelRatio, this.height * pixelRatio);
      }

      if (player.avatar) {
        // push old state
        const oldParent = player.avatar.model.parent;
        const oldRenderTarget = renderer.getRenderTarget();
        const oldViewport = renderer.getViewport(localVector4D);
      
        const _render = () => {
          // set up side camera
          sideCamera.position.copy(player.position)
            .add(localVector.set(0.3, 0, -0.5).applyQuaternion(player.quaternion));
          sideCamera.quaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              sideCamera.position,
              player.position,
              localVector3.set(0, 1, 0)
            )
          );
          sideCamera.updateMatrixWorld();

          // set up side avatar scene
          outlineRenderScene.add(player.avatar.model);
          // outlineRenderScene.add(world.lights);
          // render side avatar scene
          renderer.setRenderTarget(outlineRenderTarget);
          renderer.clear();
          renderer.render(outlineRenderScene, sideCamera);
          
          // set up side scene
          sideScene.add(player.avatar.model);
          // sideScene.add(world.lights);
      
          const {colors} = gradients[Math.floor(lightningMesh.material.uniforms.iTime.value) % gradients.length];
          if (lightningBackground) {
            lightningMesh.material.uniforms.iTime.value = timeOffset / 1000;
            lightningMesh.material.uniforms.iTime.needsUpdate = true;
            lightningMesh.material.uniforms.iFrame.value = Math.floor(timeOffset / 1000 * 60);
            lightningMesh.material.uniforms.iFrame.needsUpdate = true;
            lightningMesh.material.uniforms.uColor1.value.set(colors[0]);
            lightningMesh.material.uniforms.uColor1.needsUpdate = true;
            lightningMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
            lightningMesh.material.uniforms.uColor2.needsUpdate = true;
            lightningMesh.visible = true;
          } else {
            lightningMesh.visible = false;
          }
          if (radialBackground) {
            radialMesh.material.uniforms.iTime.value = timeOffset / 1000;
            radialMesh.material.uniforms.iTime.needsUpdate = true;
            radialMesh.material.uniforms.iFrame.value = Math.floor(timeOffset / 1000 * 60);
            radialMesh.material.uniforms.iFrame.needsUpdate = true;
            radialMesh.visible = true;
          } else {
            radialMesh.visible = false;
          }
          if (grassBackground) {
            grassMesh.material.uniforms.iTime.value = timeOffset / 1000;
            grassMesh.material.uniforms.iTime.needsUpdate = true;
            grassMesh.material.uniforms.uColor1.value.set(colors[0]);
            grassMesh.material.uniforms.uColor1.needsUpdate = true;
            grassMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
            grassMesh.material.uniforms.uColor2.needsUpdate = true;
            grassMesh.visible = true;
          } else {
            grassMesh.visible = false;
          }
          if (glyphBackground) {
            glyphMesh.material.uniforms.iTime.value = timeOffset / 1000;
            glyphMesh.material.uniforms.iTime.needsUpdate = true;
            glyphMesh.material.uniforms.uColor1.value.set(colors[0]);
            glyphMesh.material.uniforms.uColor1.needsUpdate = true;
            glyphMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
            glyphMesh.material.uniforms.uColor2.needsUpdate = true;
            glyphMesh.visible = true;
          } else {
            glyphMesh.visible = false;
          }
          if (outline) {
            outlineMesh.material.uniforms.t0.value = outlineRenderTarget.texture;
            outlineMesh.material.uniforms.t0.needsUpdate = true;
            outlineMesh.material.uniforms.uColor1.value.set(colors[0]);
            outlineMesh.material.uniforms.uColor1.needsUpdate = true;
            outlineMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
            outlineMesh.material.uniforms.uColor2.needsUpdate = true;
            outlineMesh.visible = true;
          } else {
            outlineMesh.visible = false;
          }
          if (label) {
            labelMesh.material.uniforms.iTime.value = timeOffset / 1000;
            labelMesh.material.uniforms.iTime.needsUpdate = true;
            labelMesh.visible = true;
            for (const child of textObject.children) {
              child.material.uniforms.uTroikaOutlineOpacity.value = timeOffset / 1000;
              child.material.uniforms.uTroikaOutlineOpacity.needsUpdate = true;
            }
            textObject.visible = true;
          } else {
            labelMesh.visible = false;
            textObject.visible = false;
          }
          
          // render side scene
          renderer.setRenderTarget(oldRenderTarget);
          renderer.setViewport(0, 0, this.width, this.height);
          renderer.clear();
          renderer.render(sideScene, sideCamera);
      
          for (const canvas of canvases) {
            const {width, height, ctx} = canvas;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(
              renderer.domElement,
              0,
              size.y * pixelRatio - this.height * pixelRatio,
              this.width * pixelRatio,
              this.height * pixelRatio,
              0,
              0,
              width,
              height
            );
          }
        };
        _render();

        // pop old state
        if (oldParent) {
          oldParent.add(player.avatar.model);
        } else {
          player.avatar.model.parent.remove(player.avatar.model);
        }
        /* if (oldWorldLightParent) {
          oldWorldLightParent.add(world.lights);
        } else {
          world.lights.parent.remove(world.lights);
        } */
        renderer.setRenderTarget(oldRenderTarget);
        renderer.setViewport(oldViewport);
      }
    },
    destroy() {
      if (locallyOwnedCanvas) {
        locallyOwnedCanvas.parentNode.removeChild(locallyOwnedCanvas);
      }
      dioramas.splice(dioramas.indexOf(diorama), 1);

      postProcessing.removeEventListener('update', recompile);
    },
  };

  function recompile() {
    diorama.triggerLoad();
  }
  const compile = () => {
    diorama.triggerLoad();
    postProcessing.addEventListener('update', recompile);
  }
  if (player.avatar) {
    compile();
  } else {
    function avatarchange() {
      if (player.avatar) {
        compile();
        player.removeEventListener('avatarchange', avatarchange);
      }
    }
    player.addEventListener('avatarchange', avatarchange);
  }

  diorama.addCanvas(canvas);
  dioramas.push(diorama);
  return diorama;
};

const createAppDiorama = (app, {
  canvas,
  label = null,
  outline = false,
  lightningBackground = false,
  radialBackground = false,
  grassBackground = false,
  glyphBackground = false,
} = {}) => {
  // _ensureSideSceneCompiled();

  const {devicePixelRatio: pixelRatio} = window;

  const renderer = getRenderer();
  /* sideCamera.position.set(0, 0, 10);
  sideCamera.quaternion.identity();
  sideCamera.updateMatrixWorld();
  renderer.compile(sideScene, sideCamera); */

  if (!canvas) {
    canvas = _makeCanvas(defaultDioramaSize, defaultDioramaSize);
    document.body.appendChild(canvas);
  }
  const canvases = [];
  let outlineRenderTarget = null;
  let lastDisabledTime = 0;

  const diorama = {
    width: 0,
    height: 0,
    loaded: false,
    enabled: true,
    addCanvas(canvas) {
      const {width, height} = canvas;
      this.width = Math.max(this.width, width);
      this.height = Math.max(this.height, height);

      const ctx = canvas.getContext('2d');
      canvas.ctx = ctx;

      canvases.push(canvas);
    },
    toggleShader() {
      const oldValues = {lightningBackground, radialBackground, glyphBackground, grassBackground};
      lightningBackground = false;
      radialBackground = false;
      glyphBackground = false;
      grassBackground = false;
      if (oldValues.lightningBackground) {
        radialBackground = true;
      } else if (oldValues.radialBackground) {
        glyphBackground = true;
      } else if (oldValues.glyphBackground) {
        grassBackground = true;
      } else if (oldValues.grassBackground) {
        lightningBackground = true;
      }
    },
    triggerLoad() {
      const oldParent = app.parent;
      Promise.all([
        (async () => {
          outlineRenderScene.add(app);
          await renderer.compileAsync(outlineRenderScene);
        })(),
        (async () => {
          sideScene.add(app);
          await renderer.compileAsync(sideScene);
        })(),
      ]).then(() => {
        this.loaded = true;
      });
      
      if (oldParent) {
        oldParent.add(app);
      } else {
        app.parent.remove(app);
      }
    },
    update(timestamp, timeDiff) {
      if (!this.loaded || !this.enabled) {
        lastDisabledTime = timestamp;
        return;
      }
      const timeOffset = timestamp - lastDisabledTime;

      if (!outlineRenderTarget || (outlineRenderTarget.width !== this.width * pixelRatio) || (outlineRenderTarget.height !== this.height * pixelRatio)) {
        outlineRenderTarget = _makeOutlineRenderTarget(this.width * pixelRatio, this.height * pixelRatio);
      }

      const renderer = getRenderer();
      const size = renderer.getSize(localVector2D);
      // a Vector2 representing the largest power of two less than or equal to the current canvas size
      const sizePowerOfTwo = localVector2D2.set(
        Math.pow(2, Math.floor(Math.log(size.x) / Math.log(2))),
        Math.pow(2, Math.floor(Math.log(size.y) / Math.log(2))),
      );
      if (sizePowerOfTwo.x < this.width || sizePowerOfTwo.y < this.height) {
        console.warn('renderer is too small');
        return;
      }
    
      // push old state
      const oldParent = app.parent;
      const oldRenderTarget = renderer.getRenderTarget();
      const oldViewport = renderer.getViewport(localVector4D);
      // const oldWorldLightParent = world.lights.parent;
    
      const _render = () => {
        // set up side camera
        const angle = ((timeOffset / 3000) % 1) * Math.PI * 2;
        sideCamera.position.copy(app.position)
          .add(
            localVector.set(Math.cos(angle), 0, Math.sin(angle))
              .applyQuaternion(app.quaternion)
              .multiplyScalar(2)
          );

        const physicsObjects = app.getPhysicsObjects();
        if (physicsObjects.length > 0) {
          const physicsObject = physicsObjects[0];
          const {physicsMesh} = physicsObject;
          fitCameraToBoundingBox(sideCamera, physicsMesh.geometry.boundingBox, 1.2);
        } else {
          sideCamera.quaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              sideCamera.position,
              app.position,
              localVector3.set(0, 1, 0)
            )
          );
        }
        sideCamera.updateMatrixWorld();

        // set up side avatar scene
        outlineRenderScene.add(app);
        // outlineRenderScene.add(world.lights);

        // render side avatar scene
        renderer.setRenderTarget(outlineRenderTarget);
        renderer.clear();
        renderer.render(outlineRenderScene, sideCamera);
        
        // set up side scene
        sideScene.add(app);
        // sideScene.add(world.lights);
    
        const {colors} = gradients[Math.floor(lightningMesh.material.uniforms.iTime.value) % gradients.length];
        if (lightningBackground) {
          lightningMesh.material.uniforms.iTime.value = timeOffset / 1000;
          lightningMesh.material.uniforms.iTime.needsUpdate = true;
          lightningMesh.material.uniforms.iFrame.value = Math.floor(timeOffset / 1000 * 60);
          lightningMesh.material.uniforms.iFrame.needsUpdate = true;
          lightningMesh.material.uniforms.uColor1.value.set(colors[0]);
          lightningMesh.material.uniforms.uColor1.needsUpdate = true;
          lightningMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
          lightningMesh.material.uniforms.uColor2.needsUpdate = true;
          lightningMesh.visible = true;
        } else {
          lightningMesh.visible = false;
        }
        if (radialBackground) {
          radialMesh.material.uniforms.iTime.value = timeOffset / 1000;
          radialMesh.material.uniforms.iTime.needsUpdate = true;
          radialMesh.material.uniforms.iFrame.value = Math.floor(timeOffset / 1000 * 60);
          radialMesh.material.uniforms.iFrame.needsUpdate = true;
          radialMesh.visible = true;
        } else {
          radialMesh.visible = false;
        }
        if (grassBackground) {
          grassMesh.material.uniforms.iTime.value = timeOffset / 1000;
          grassMesh.material.uniforms.iTime.needsUpdate = true;
          grassMesh.material.uniforms.uColor1.value.set(colors[0]);
          grassMesh.material.uniforms.uColor1.needsUpdate = true;
          grassMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
          grassMesh.material.uniforms.uColor2.needsUpdate = true;
          grassMesh.visible = true;
        } else {
          grassMesh.visible = false;
        }
        if (glyphBackground) {
          glyphMesh.material.uniforms.iTime.value = timeOffset / 1000;
          glyphMesh.material.uniforms.iTime.needsUpdate = true;
          glyphMesh.material.uniforms.uColor1.value.set(colors[0]);
          glyphMesh.material.uniforms.uColor1.needsUpdate = true;
          glyphMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
          glyphMesh.material.uniforms.uColor2.needsUpdate = true;
          glyphMesh.visible = true;
        } else {
          glyphMesh.visible = false;
        }
        if (outline) {
          outlineMesh.material.uniforms.t0.value = outlineRenderTarget.texture;
          outlineMesh.material.uniforms.t0.needsUpdate = true;
          outlineMesh.material.uniforms.uColor1.value.set(colors[0]);
          outlineMesh.material.uniforms.uColor1.needsUpdate = true;
          outlineMesh.material.uniforms.uColor2.value.set(colors[colors.length - 1]);
          outlineMesh.material.uniforms.uColor2.needsUpdate = true;
          outlineMesh.visible = true;
        } else {
          outlineMesh.visible = false;
        }
        if (label) {
          labelMesh.material.uniforms.iTime.value = timeOffset / 1000;
          labelMesh.material.uniforms.iTime.needsUpdate = true;
          labelMesh.visible = true;
          for (const child of textObject.children) {
            child.material.uniforms.uTroikaOutlineOpacity.value = timeOffset / 1000;
            child.material.uniforms.uTroikaOutlineOpacity.needsUpdate = true;
          }
          textObject.visible = true;
        } else {
          labelMesh.visible = false;
          textObject.visible = false;
        }
        
        // render side scene
        renderer.setRenderTarget(oldRenderTarget);
        renderer.setViewport(0, 0, this.width, this.height);
        renderer.clear();
        renderer.render(sideScene, sideCamera);
    
        for (const canvas of canvases) {
          const {width, height, ctx} = canvas;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(
            renderer.domElement,
            0,
            size.y * pixelRatio - this.height * pixelRatio,
            this.width * pixelRatio,
            this.height * pixelRatio,
            0,
            0,
            width,
            height
          );
        }
      };
      _render();

      // pop old state
      if (oldParent) {
        oldParent.add(app);
      } else {
        app.parent.remove(app);
      }
      /* if (oldWorldLightParent) {
        oldWorldLightParent.add(world.lights);
      } else {
        world.lights.parent.remove(world.lights);
      } */
      renderer.setRenderTarget(oldRenderTarget);
      renderer.setViewport(oldViewport);
    },
    destroy() {
      for (const canvas of canvases) {
        canvas.parentNode.removeChild(canvas);
      }
      dioramas.splice(dioramas.indexOf(diorama), 1);
    },
  };

  diorama.triggerLoad();

  diorama.addCanvas(canvas);
  dioramas.push(diorama);
  return diorama;
};

const dioramas = [];
const dioramaManager = {
  createPlayerDiorama,
  createAppDiorama,
  update(timestamp, timeDiff) {
    for (const diorama of dioramas) {
      diorama.update(timestamp, timeDiff);
    }
  }
};
export default dioramaManager;