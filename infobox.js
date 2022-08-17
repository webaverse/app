import * as THREE from 'three';
// import {world} from './world.js';
import {getRenderer} from './renderer.js';
import { pushFog } from './util.js';
// import easing from './easing.js';
// import {createObjectSprite} from './object-spriter.js';

// const cubicBezier = easing(0, 1, 0, 1);

const fullscreenVertexShader = `\
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;
const fullscreenFragmentShader = `\
  uniform sampler2D uTex;
  uniform float uTexEnabled;
  uniform float uSelected;
  uniform float uSelectFactor;
  uniform float uTime;
  uniform float numFrames;
  uniform float numFramesPerRow;
  uniform float outline_thickness;
  varying vec2 vUv;

  #define PI 3.1415926535897932384626433832795

  //---------------------------------------------------------------------------
  //1D Perlin noise implementation 
  //---------------------------------------------------------------------------
  #define HASHSCALE 0.1031
  float hash(float p) {
    vec3 p3  = fract(vec3(p) * HASHSCALE);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
  }
  float fade(float t) { return t*t*t*(t*(6.*t-15.)+10.); }
  float grad(float hash, float p) {
    int i = int(1e4*hash);
    return (i & 1) == 0 ? p : -p;
  }
  float perlinNoise1D(float p) {
    float pi = floor(p), pf = p - pi, w = fade(pf);
    return mix(grad(hash(pi), pf), grad(hash(pi + 1.0), pf - 1.0), w) * 2.0;
  }
  float fbm(float pos, int octaves, float persistence) {
    float total = 0., frequency = 1., amplitude = 1., maxValue = 0.;
    for(int i = 0; i < octaves; ++i) {
        total += perlinNoise1D(pos * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2.;
    }
    return total / maxValue;
  }
  
  struct Tri {
    vec2 a;
    vec2 b;
    vec2 c;
  };

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
  bool isPointInTriangle(vec2 point, Tri tri) {
    return isPointInTriangle(point, tri.a, tri.b, tri.c);
  }
  bool isInsideChevron(vec2 point, vec2 center, float width, float height, float skew) {
    point -= center;

    vec2 a = vec2(-width/2., height/2. - skew);
    vec2 b = vec2(-width/2., -height/2. - skew);
    vec2 c = vec2(0., height/2. + skew);
    vec2 d = vec2(0., -height/2. + skew);
    vec2 e = vec2(width/2., height/2. - skew);
    vec2 f = vec2(width/2., -height/2. - skew);
    Tri t1 = Tri(a, b, c);
    Tri t2 = Tri(b, d, c);
    Tri t3 = Tri(e, f, c);
    Tri t4 = Tri(f, d, c);

    return isPointInTriangle(point, t1) ||
      isPointInTriangle(point, t2) ||
      isPointInTriangle(point, t3) ||
      isPointInTriangle(point, t4);
  }

  void main() {
    // compute uv
    float f = mod(uTime / 1000. * 0.5, 1.);
    float frameIndex = floor(f * numFrames);
    float x = mod(frameIndex, numFramesPerRow);
    float y = floor(frameIndex / numFramesPerRow);

    float frameSize = 1. / numFramesPerRow;

    float xOffset = x * frameSize;
    float yOffset = y * frameSize;

    vec2 uv = vUv;
    uv.x = xOffset + uv.x * frameSize;
    uv.y = yOffset + uv.y * frameSize;

    // gl_FragColor.gb = uv;
    // gl_FragColor.a = 1.;

    // sample texture
    vec4 s;
    if (uTexEnabled > 0.) {
      s = texture2D(uTex, uv);
    } else {
      s = vec4(0.);
    }

    // outline
    if (uTexEnabled > 0.) {
      float sum = 0.0;
      int passes = 32;
      float passesFloat = float(passes);
      float angleStep = 2.0 * PI / passesFloat;
      for (int i = 0; i < passes; ++i) {
        float n = float(i);
        float angle = angleStep * n;

        vec2 angleOffset = vec2(cos(angle), sin(angle)) * outline_thickness;
        vec2 targetUv = vUv + angleOffset;
        if (targetUv.x >= 0. && targetUv.x <= 1. && targetUv.y >= 0. && targetUv.y <= 1.) {
          vec2 uv2 = uv + angleOffset / numFramesPerRow;
          sum += texture(uTex, uv2).a;
        }
      }

      if (sum > 0.) {
        s.rgb = mix(
          mix(vec3(0.8), vec3(1.), vUv.y),
          s.rgb,
          s.a
        );
        // s.a = max(s.a, 0.5);
        s.a = 1.;
      }
    }
    
    gl_FragColor = s;

    /* vec3 c = vec3(0.1);
    c = c * (1. - s.a) + s.rgb * s.a;

    float backgroundAlpha = (1. - vUv.y * 2.) * 0.7;
    float a = max(backgroundAlpha, s.a);
    
    // result
    gl_FragColor.rgb = c;
    gl_FragColor.a = backgroundAlpha; */
  }
`;
const localVector2D = new THREE.Vector2();
const localVector4D = new THREE.Vector4();

const _makeInfoboxRendererScene = () => {
  const scene = new THREE.Scene();

  const fullScreenQuadMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: {
        uTex: {
          value: null,
          needsUpdate: false,
        },
        uTexEnabled: {
          value: 0,
          needsUpdate: true,
        },
        uTime: {
          value: 0,
          needsUpdate: true,
        },
        numFrames: {
          value: 0,
          needsUpdate: true,
        },
        numFramesPerRow: {
          value: 0,
          needsUpdate: true,
        },
        outline_thickness: {
          value: 0.02,
          needsUpdate: true,
        },
      },
      vertexShader: fullscreenVertexShader,
      fragmentShader: fullscreenFragmentShader,
      depthTest: false,
      transparent: true,
    }),
  );
  fullScreenQuadMesh.frustumCulled = false;
  scene.add(fullScreenQuadMesh);
  scene.fullScreenQuadMesh = fullScreenQuadMesh;

  return scene;
};

class InfoboxRenderer {
  constructor(width, height, selected) {
    this.width = width;
    this.height = height;

    this.scene = _makeInfoboxRendererScene();
    this.camera = new THREE.OrthographicCamera(
      -1,
      1,
      1,
      -1,
      0,
      1000
    );
    this.canvases = [];
    this.selected = selected;
    this.selectFactor = +selected;
    this.needsUpdate = false;
  }
  addCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.ctx = ctx;

    this.canvases.push(canvas);
    this.needsUpdate = true;
  }
  removeCanvas(canvas) {
    this.canvases.splice(this.canvases.indexOf(canvas), 1);
    this.needsUpdate = true;
  }
  setSpritesheet(spritesheet) {
    if (spritesheet) {
      const {
        result,
        numFrames,
        // frameSize,
        numFramesPerRow,
      } = spritesheet;
      this.scene.fullScreenQuadMesh.material.uniforms.uTex.value = result;
      this.scene.fullScreenQuadMesh.material.uniforms.uTex.needsUpdate = true;
      this.scene.fullScreenQuadMesh.material.uniforms.uTexEnabled.value = 1;
      this.scene.fullScreenQuadMesh.material.uniforms.uTexEnabled.needsUpdate = true;
      this.scene.fullScreenQuadMesh.material.uniforms.numFrames.value = numFrames;
      this.scene.fullScreenQuadMesh.material.uniforms.numFrames.needsUpdate = true;
      this.scene.fullScreenQuadMesh.material.uniforms.numFramesPerRow.value = numFramesPerRow;
      this.scene.fullScreenQuadMesh.material.uniforms.numFramesPerRow.needsUpdate = true;
    } else {
      /* this.scene.fullScreenQuadMesh.material.uniforms.uTex.value = null;
      this.scene.fullScreenQuadMesh.material.uniforms.uTex.needsUpdate = true; */
      this.scene.fullScreenQuadMesh.material.uniforms.uTexEnabled.value = 0;
      this.scene.fullScreenQuadMesh.material.uniforms.uTexEnabled.needsUpdate = true;
      /* this.scene.fullScreenQuadMesh.material.uniforms.numFrames.value = numFrames;
      this.scene.fullScreenQuadMesh.material.uniforms.numFrames.needsUpdate = true;
      this.scene.fullScreenQuadMesh.material.uniforms.numFramesPerRow.value = numFramesPerRow;
      this.scene.fullScreenQuadMesh.material.uniforms.numFramesPerRow.needsUpdate = true; */
    }
  }
  update(timestamp, timeDiff) {
    const renderer = getRenderer();
    const size = renderer.getSize(localVector2D);
    const pixelRatio = renderer.getPixelRatio();

    const _render = () => {
      // push old state
      // const oldRenderTarget = renderer.getRenderTarget();
      const oldViewport = renderer.getViewport(localVector4D);

      {
        // const smoothedSelectFactor = this.selected ? cubicBezier(this.selectFactor) : 1 - cubicBezier(1 - this.selectFactor);

        /* this.scene.fullScreenQuadMesh.material.uniforms.uSelected.value = +this.selected;
        this.scene.fullScreenQuadMesh.material.uniforms.uSelected.needsUpdate = true;
        this.scene.fullScreenQuadMesh.material.uniforms.uSelectFactor.value = smoothedSelectFactor;
        this.scene.fullScreenQuadMesh.material.uniforms.uSelectFactor.needsUpdate = true; */
        this.scene.fullScreenQuadMesh.material.uniforms.uTime.value = timestamp;
        this.scene.fullScreenQuadMesh.material.uniforms.uTime.needsUpdate = true;

        renderer.setViewport(0, 0, this.width, this.height);
        renderer.clear();
        const popFog = pushFog(this.scene);
        renderer.render(this.scene, this.camera);
        popFog();
      }

      // pop old state
      // renderer.setRenderTarget(oldRenderTarget);
      renderer.setViewport(oldViewport);
    };
    _render();

    const _copyToCanvases = () => {
      for (const canvas of this.canvases) {
        const {
          width,
          height,
          ctx
        } = canvas;
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
    _copyToCanvases();
  }
}

export {
  InfoboxRenderer,
};