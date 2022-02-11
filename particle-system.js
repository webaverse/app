import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
// import metaversefile from 'metaversefile';
// const {useScene} = metaversefile;
// const {useApp, useInternalsuseMaterials, useFrame, useActivate, useLoaders, useScene, usePhysics, useDefaultModules, useCleanup} = metaversefile;
// import {scene} from './renderer.js';
import {WebaverseShaderMaterial} from './materials.js';
import {world} from './world.js';
import loaders from './loaders.js';

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
// const localMatrix = new THREE.Matrix4();

const maxParticles = 256;
const canvasSize = 4096;
const frameSize = 512;
const rowSize = Math.floor(canvasSize/frameSize);
const maxNumFrames = rowSize * rowSize;

const planeGeometryNonInstanced = new THREE.PlaneBufferGeometry(1, 1);
const planeGeometry = new THREE.InstancedBufferGeometry();
for (const k in planeGeometryNonInstanced.attributes) {
  planeGeometry.setAttribute(k, planeGeometryNonInstanced.attributes[k]);
}
planeGeometry.index = planeGeometryNonInstanced.index;

let fileSpecs = [];
const fileSpecsLoadPromise = (async () => {
  const res = await fetch(`/fx-textures/fx-files.json`);
  fileSpecs = await res.json();
})();

const _makeParticleMaterial = name => {
  // console.log('_makeParticleMaterial', texture, numFrames);

  const promise = (async () => {
    await fileSpecsLoadPromise;
    
    const fileSpec = fileSpecs.find(f => f.name === name);
    const {numFrames} = fileSpec;

    const texture = await new Promise((accept, reject) => {
      const {ktx2Loader} = loaders;
      const u = `/fx-textures/${name}-spritesheet.ktx2`;
      ktx2Loader.load(u, accept, function onProgress() {}, reject);
    });
    texture.anisotropy = 16;
    material.uniforms.uTex.value = texture;
    material.uniforms.uTex.needsUpdate = true;
    material.uniforms.uNumFrames.value = numFrames;
    material.uniforms.uNumFrames.needsUpdate = true;
  })();

  const material = new WebaverseShaderMaterial({
    uniforms: {
      uTime: {
        value: 0,
        needsUpdate: true,
      },
      uTex: {
        value: null,
        needsUpdate: false,
      },
      uNumFrames: {
        value: 0,
        needsUpdate: false,
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      uniform float uTime;
      attribute vec3 p;
      attribute vec4 q;
      // varying vec3 vPosition;
      varying vec2 vUv;

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
        pos = rotateVecQuat(pos, q);
        pos += p;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
        vUv = uv;
        // vPosition = position;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      uniform float uTime;
      uniform sampler2D uTex;
      uniform float uNumFrames;
      // varying vec3 vPosition;
      varying vec2 vUv;

      // const vec3 lineColor1 = vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')});
      // const vec3 lineColor2 = vec3(${new THREE.Color(0x0288d1).toArray().join(', ')});
      // const vec3 lineColor3 = vec3(${new THREE.Color(0xec407a).toArray().join(', ')});
      // const vec3 lineColor4 = vec3(${new THREE.Color(0xc2185b).toArray().join(', ')});

      void main() {
        // const float maxNumFrames = ${maxNumFrames.toFixed(8)};
        const float rowSize = ${rowSize.toFixed(8)};

        float f = mod(uTime, 1.);
        float frame = floor(f * uNumFrames);
        float x = mod(frame, rowSize);
        float y = floor(frame / rowSize);

        vec2 uv = vec2(x / rowSize, y / rowSize) + vUv / rowSize;

        vec4 alphaColor = texture2D(uTex, vec2(0.));

        gl_FragColor = texture2D(uTex, uv);
        if (gl_FragColor.a < 0.5) {
          discard;
        }
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    // alphaTest: 0.9,
  });
  material.promise = promise;
  return material;
};

class Particle extends THREE.Object3D {
  constructor(index, parent) {
    super();

    this.index = index;
    this.parent = parent;
  }
}
class ParticleMesh extends THREE.InstancedMesh {
  constructor(name) {
    const geometry = planeGeometry.clone();
    geometry.setAttribute('p', new THREE.InstancedBufferAttribute(new Float32Array(maxParticles * 3), 3));
    geometry.setAttribute('q', new THREE.InstancedBufferAttribute(new Float32Array(maxParticles * 4), 4));
    const material = _makeParticleMaterial(name);
    material.promise.then(() => {
      this.visible = true;
    });
    super(geometry, material, maxParticles);

    this.name = name;
    this.particles = [];
    // this.freeList = new Uint8Array(maxParticles);
    this.count = 0;
    this.frustumCulled = false;
    this.visible = false;
    this.needsUpdate = false;

    this.onBeforeRender = () => {
      if (this.needsUpdate) {
        this.updateGeometry();
        this.needsUpdate = false;
      }
    };
  }
  addParticle() {
    const index = this.particles.length;
    const particle = new Particle(index, this);
    this.particles.push(particle);
    this.needsUpdate = true;
    return particle;
  }
  updateGeometry() {
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      this.geometry.attributes.p.setXYZ(particle.index, particle.position.x, particle.position.y, particle.position.z);
      this.geometry.attributes.q.setXYZW(particle.index, particle.quaternion.x, particle.quaternion.y, particle.quaternion.z, particle.quaternion.w);
    }
    this.geometry.attributes.p.updateRange.count = this.count;
    this.geometry.attributes.p.needsUpdate = true;
    this.geometry.attributes.q.updateRange.count = this.count;
    this.geometry.attributes.q.needsUpdate = true;

    this.count = this.particles.length;
  }
}

export const createParticleSystem = e => {
try {
  // const app = useApp();
  // const {renderer, scene, camera} = useInternals();
  // const scene = useScene();

  const rootParticleMesh = new THREE.Object3D();
  const particleMeshes = [];
  // window.particleMeshes = particleMeshes;
  rootParticleMesh.addParticle = name => {
    let particleMesh = particleMeshes.find(m => m.name === name);
    if (!particleMesh) {
      particleMesh = new ParticleMesh(name);
      rootParticleMesh.add(particleMesh);
      particleMeshes.push(particleMesh);
    }
    const particle = particleMesh.addParticle();
    return particle;
  };

  {
    const particle = rootParticleMesh.addParticle('Elements - Energy 017 Charge Up noCT noRSZ.mov');
    particle.position.set(0, 2, -0.5);
  }

  // const physicsIds = [];
  /* let activateCb = null;
  let frameCb = null;
  useActivate(() => {
    activateCb && activateCb();
  }); */
  world.appManager.addEventListener('frame', e => {
    const {timestamp} = e.data;
    for (const particleMesh of particleMeshes) {
      particleMesh.material.uniforms.uTime.value = timestamp / 1000;
      particleMesh.material.uniforms.uTime.needsUpdate = true;
    }

    // material.uniforms.time.value = (performance.now() / 1000) % 1;
  });

  return rootParticleMesh;
} catch(err) {
  console.warn(err);
}
};