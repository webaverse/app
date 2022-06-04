import * as THREE from 'three';
import {camera} from './renderer.js';
import {WebaverseShaderMaterial} from './materials.js';
import {world} from './world.js';
import loaders from './loaders.js';

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');
const urlPrefix = `https://webaverse.github.io/fx-textures/`;
const particlesJsonUrl = `${urlPrefix}fx-files.json`;

let particlesJson = null;
const loadPromise = (async () => {
  const res = await fetch(particlesJsonUrl);
  particlesJson = await res.json();
})();
const waitForLoad = () => loadPromise;

const _loadParticleTextureByName = async name => {
  await waitForLoad();

  const fileSpec = particlesJson.find(f => f.name === name);
  const {numFrames} = fileSpec;

  const texture = await new Promise((accept, reject) => {
    const {ktx2Loader} = loaders;
    const u = `${urlPrefix}${name}-spritesheet.ktx2`;
    ktx2Loader.load(u, accept, function onProgress() {}, reject);
  });
  texture.name = name;
  texture.anisotropy = 16;
  texture.numFrames = numFrames;
  /* material.uniforms.uTex.value = texture;
  material.uniforms.uTex.needsUpdate = true;
  material.uniforms.uNumFrames.value = numFrames;
  material.uniforms.uNumFrames.needsUpdate = true; */
  return texture;
};

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localVector2D = new THREE.Vector2();
// const localQuaternion = new THREE.Quaternion();
// const localMatrix = new THREE.Matrix4();

const defaultMaxParticles = 256;
const canvasSize = 4096;
const frameSize = 512;
const rowSize = Math.floor(canvasSize/frameSize);
// const maxNumFrames = rowSize * rowSize;
// const maxNumTextures = 8;

const _makePlaneGeometry = () => {
  const planeGeometryNonInstanced = new THREE.PlaneBufferGeometry(1, 1);
  const planeGeometry = new THREE.InstancedBufferGeometry();
  for (const k in planeGeometryNonInstanced.attributes) {
    planeGeometry.setAttribute(k, planeGeometryNonInstanced.attributes[k]);
  }
  planeGeometry.index = planeGeometryNonInstanced.index;
  return planeGeometry;
};
const planeGeometry = _makePlaneGeometry();

const _makeGeometry = maxParticles => {
  const geometry = planeGeometry.clone();
  geometry.setAttribute('p', new THREE.InstancedBufferAttribute(new Float32Array(maxParticles * 3), 3));
  // geometry.setAttribute('q', new THREE.InstancedBufferAttribute(new Float32Array(maxParticles * 4), 4));
  geometry.setAttribute('t', new THREE.InstancedBufferAttribute(new Float32Array(maxParticles * 2), 2));
  geometry.setAttribute('textureIndex', new THREE.InstancedBufferAttribute(new Int32Array(maxParticles), 1));
  return geometry;
};

const vertexShader = `\
precision highp float;
precision highp int;

uniform float uTime;
uniform vec4 cameraBillboardQuaternion;
attribute vec3 p;
attribute vec2 t;
varying vec2 vUv;
varying float vTimeDiff;

in int textureIndex;
flat out int vTextureIndex;

/* float getBezierT(float x, float a, float b, float c, float d) {
  return float(sqrt(3.) *
    sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x)
      + 6. * b - 9. * c + 3. * d)
      / (6. * (b - 2. * c + d));
}
float easing(float x) {
  return getBezierT(x, 0., 1., 0., 1.);
}
float easing2(float x) {
  return easing(easing(x));
} */

vec4 quat_from_axis_angle(vec3 axis, float angle) { 
  vec4 qr;
  float half_angle = (angle * 0.5) * PI;
  qr.x = axis.x * sin(half_angle);
  qr.y = axis.y * sin(half_angle);
  qr.z = axis.z * sin(half_angle);
  qr.w = cos(half_angle);
  return qr;
}
vec3 rotateVecQuat(vec3 position, vec4 q) {
  vec3 v = position.xyz;
  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}
/* vec3 rotate_vertex_position(vec3 position, vec3 axis, float angle) { 
  vec4 q = quat_from_axis_angle(axis, angle);
  return rotateVecQuat(position, q);
} */

void main() {
  vec3 pos = position;
  pos = rotateVecQuat(pos, cameraBillboardQuaternion);
  pos = (modelMatrix * vec4(pos, 1.)).xyz;
  pos += p;
  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.);
  vUv = uv;

  float startTime = t.x;
  float endTime = t.y;
  float timeDiff = (uTime - startTime) / (endTime - startTime);
  vTimeDiff = timeDiff;
  // vPosition = position;

  vTextureIndex = textureIndex;
}
`;
const fragmentShader = `\
precision highp float;
precision highp int;

#define PI 3.1415926535897932384626433832795

uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform sampler2D uTex3;
uniform sampler2D uTex4;
uniform sampler2D uTex5;
uniform sampler2D uTex6;
uniform sampler2D uTex7;
uniform sampler2D uTex8;

uniform float uNumFrames1;
uniform float uNumFrames2;
uniform float uNumFrames3;
uniform float uNumFrames4;
uniform float uNumFrames5;
uniform float uNumFrames6;
uniform float uNumFrames7;
uniform float uNumFrames8;

/* uniform float uAnimationSpeed1;
uniform float uAnimationSpeed2;
uniform float uAnimationSpeed3;
uniform float uAnimationSpeed4;
uniform float uAnimationSpeed5;
uniform float uAnimationSpeed6;
uniform float uAnimationSpeed7;
uniform float uAnimationSpeed8; */

uniform float uTime;
/* uniform float uNumFrames;
uniform float uAnimationSpeed; */
varying vec2 vUv;
varying float vTimeDiff;
flat in int vTextureIndex;

// const vec3 lineColor1 = vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')});
// const vec3 lineColor2 = vec3(${new THREE.Color(0x0288d1).toArray().join(', ')});
// const vec3 lineColor3 = vec3(${new THREE.Color(0xec407a).toArray().join(', ')});
// const vec3 lineColor4 = vec3(${new THREE.Color(0xc2185b).toArray().join(', ')});

vec2 getUv(float numFrames) {
  const float rowSize = ${rowSize.toFixed(8)};
  float f = vTimeDiff;
  float frame = floor(f * numFrames);
  float x = mod(frame, rowSize);
  float y = floor(frame / rowSize);
  vec2 uv = vec2(x / rowSize, y / rowSize) + vUv / rowSize;
  // vec4 alphaColor = texture2D(uTex, vec2(0.));
  return uv;
}

void main() {
  vec4 c = vec4(0.);
  if (vTextureIndex == 0) {
    vec2 uv = getUv(uNumFrames1);
    c = texture2D(uTex1, uv);
  } else if (vTextureIndex == 1) {
    vec2 uv = getUv(uNumFrames2);
    c = texture2D(uTex2, uv);
  } else if (vTextureIndex == 2) {
    vec2 uv = getUv(uNumFrames3);
    c = texture2D(uTex3, uv);
  } else if (vTextureIndex == 3) {
    vec2 uv = getUv(uNumFrames4);
    c = texture2D(uTex4, uv);
  } else if (vTextureIndex == 4) {
    vec2 uv = getUv(uNumFrames5);
    c = texture2D(uTex5, uv);
  } else if (vTextureIndex == 5) {
    vec2 uv = getUv(uNumFrames6);
    c = texture2D(uTex6, uv);
  } else if (vTextureIndex == 6) {
    vec2 uv = getUv(uNumFrames7);
    c = texture2D(uTex7, uv);
  } else if (vTextureIndex == 7) {
    vec2 uv = getUv(uNumFrames8);
    c = texture2D(uTex8, uv);
  }

  gl_FragColor = c;
  if (gl_FragColor.a < 0.5) {
    discard;
  }
  
  // gl_FragColor = vec4(1., 0., 0., 1.);
}
`;
const _makeMaterial = maxNumTextures => {  
  const uniforms = {
    uTime: {
      value: 0,
      needsUpdate: true,
    },
    cameraBillboardQuaternion: {
      value: new THREE.Quaternion(),
      needsUpdate: true,
    },
  };
  for (let i = 1; i <= maxNumTextures; i++) {
    uniforms['uTex' + i] = {
      value: null,
      needsUpdate: false,
    };
    uniforms['uNumFrames' + i] = {
      value: 0,
      needsUpdate: true,
    };
    /* uniforms['uAnimationSpeed' + i] = {
      value: 0,
      needsUpdate: false,
    }; */
  }
  const material = new WebaverseShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    // alphaTest: 0.9,
  });
  material.setTextures = newTextures => {
    // update the uniforms
    for (let i = 0; i < newTextures.length; i++) {
      const newTexture = newTextures[i];
      const index = i + 1;
      
      const uTexUniform = material.uniforms['uTex' + index];
      /* if (!uTexUniform) {
        debugger;
      } */
      uTexUniform.value = newTexture;
      uTexUniform.needsUpdate = true;

      const uNumFramesUniform = material.uniforms['uNumFrames' + index];
      uNumFramesUniform.value = newTexture.numFrames;
      uNumFramesUniform.needsUpdate = true;

      // console.log('set texture', newTexture.name, uTexUniform.value, uNumFramesUniform.value);

      /* const uAnimationSpeedUniform = material.uniforms['uAnimationSpeed' + index];
      uAnimationSpeedUniform.value = 1;
      uAnimationSpeedUniform.needsUpdate = true; */
    }
  };
  return material;
}

class Particle extends THREE.Object3D {
  constructor(index, textureIndex, startTime, endTime, parent) {
    super();

    this.index = index;
    this.textureIndex = textureIndex;
    this.startTime = startTime;
    this.endTime = endTime;
    this.parent = parent;
  }
  update() {
    this.parent.needsUpdate = true;
  }
  destroy() {
    this.parent.removeParticle(this);
  }
}
class ParticleSystem extends THREE.InstancedMesh {
  constructor(particleNames, maxParticles = defaultMaxParticles) {
    const geometry = _makeGeometry(maxParticles);
    const material = _makeMaterial(particleNames.length);
    super(geometry, material, maxParticles);

    this.frustumCulled = false;
    // this.visible = false;
    this.needsUpdate = false;

    this.textures = [];
    this.loadPromise = Promise.all(particleNames.map(async particleName => {
      return await _loadParticleTextureByName(particleName);
    })).then(newTextures => {
      this.textures = newTextures;
      this.material.setTextures(newTextures);
    });
    this.particles = Array(maxParticles).fill(null);
    this.count = 0;
  }
  #getParticleTextureIndex(name) {
    return this.textures.findIndex(t => t.name === name);
  }
  addParticle(name, {
    offsetTime = 0,
    duration = 1000,
  } = {}) {
    const textureIndex = name ? this.#getParticleTextureIndex(name) : -1;
    if (textureIndex !== -1) {
      const startTime = performance.now() + offsetTime;
      const endTime = startTime + duration;

      for (let i = 0; i < this.particles.length; i++) {
        let particle = this.particles[i];
        if (particle === null) {
          particle = new Particle(i, textureIndex, startTime, endTime, this);
          this.particles[i] = particle;
          this.needsUpdate = true;
          return particle;
        }
      }
      console.warn('particles overflow');
      return null;
    } else {
      throw new Error('no such particle texture found: ' + JSON.stringify(name));
    }
  }
  removeParticle(particle) {
    this.particles[particle.index] = null;
    this.needsUpdate = true;
  }
  update(timestamp, timeDiff) {
    if (this.needsUpdate) {
      this.needsUpdate = false;

      this.updateGeometry();
    }

    this.material.uniforms.uTime.value = timestamp;
    this.material.uniforms.uTime.needsUpdate = true;
    this.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
  }
  updateGeometry() {
    let index = 0;
    for (const particle of this.particles) {
      if (particle !== null) {
        this.geometry.attributes.p.array[index*3 + 0] = particle.position.x;
        this.geometry.attributes.p.array[index*3 + 1] = particle.position.y;
        this.geometry.attributes.p.array[index*3 + 2] = particle.position.z;

        this.geometry.attributes.t.array[index*2 + 0] = particle.startTime;
        this.geometry.attributes.t.array[index*2 + 1] = particle.endTime;

        this.geometry.attributes.textureIndex.array[index] = particle.textureIndex;

        index++;
      }
    }

    this.geometry.attributes.p.updateRange.count = index * 3;
    this.geometry.attributes.p.needsUpdate = true;
    
    this.geometry.attributes.t.updateRange.count = index * 2;
    this.geometry.attributes.t.needsUpdate = true;
    
    this.geometry.attributes.textureIndex.updateRange.count = index;
    this.geometry.attributes.textureIndex.needsUpdate = true;
    
    this.count = index;
  }
  waitForLoad() {
    return this.loadPromise;
  }
  destroy() {
    // nothing
  }
}

const particleSystems = [];
const createParticleSystem = (particleNames) => {
  const particleSystem = new ParticleSystem(particleNames);
  particleSystems.push(particleSystem);
  return particleSystem;
};
const destroyParticleSystem = particleSystem => {
  const index = particleSystems.indexOf(particleSystem);
  if (index !== -1) {
    particleSystems.splice(index, 1);
    particleSystem.destroy();
  }
};
const update = (timestamp, timeDiff) => {
  for (const particleSystem of particleSystems) {
    particleSystem.update(timestamp, timeDiff);
  }
};
const particleSystemManager = {
  createParticleSystem,
  destroyParticleSystem,
  waitForLoad,
  update,
};
export default particleSystemManager;