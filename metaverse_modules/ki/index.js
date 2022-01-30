import * as THREE from 'three';
// import Simplex from './simplex-noise.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useMaterials} = metaversefile;

// const localVector = new THREE.Vector3();
// const simplex = new Simplex('lol');

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');

const identityQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler(0, 0, 0, 'YXZ');

export default () => {
  const app = useApp();
  const {WebaverseShaderMaterial} = useMaterials();

  const count = 32;
  const _getKiWindGeometry = geometry => {
    const geometry2 = new THREE.BufferGeometry();
    ['position', 'normal', 'uv'].forEach(k => {
      geometry2.setAttribute(k, geometry.attributes[k]);
    });
    geometry2.setIndex(geometry.index);
    
    const positions = new Float32Array(count * 3);
    const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
    geometry2.setAttribute('positions', positionsAttribute);
    const quaternions = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      identityQuaternion.toArray(quaternions, i * 4);
    }
    const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
    geometry2.setAttribute('quaternions', quaternionsAttribute);
    const startTimes = new Float32Array(count);
    const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
    geometry2.setAttribute('startTimes', startTimesAttribute);

    return geometry2;
  };
  const _getKiWindMaterial = material => {
    const now = performance.now();
    const texture = material.emissiveMap;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return new WebaverseShaderMaterial({
      uniforms: {
        uTex: {
          value: texture,
          needsUpdate: true,
        },
        uTime: {
          value: now,
          needsUpdate: true,
        },
      },
      vertexShader: `\
        attribute vec3 positions;
        attribute vec4 quaternions;
        attribute float startTimes;
        varying vec2 vUv;
        varying float vStartTimes;

        void main() {
          vUv = uv; // vec2(uv.x, 1.-uv.y);
          vStartTimes = startTimes;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `\
        uniform sampler2D uTex;
        uniform float uTime;
        varying vec2 vUv;
        
        varying float vStartTimes;

        float offset = 0.;
        const float animationSpeed = 3.;

        void main() {
          if (vStartTimes >= 0.) {
            float t = uTime;
            float timeDiff = t - vStartTimes;

            vec2 uv = vUv;
            // uv.y *= 2.;
            uv.y += timeDiff * animationSpeed;
            // uv.y *= 2.;

            vec4 c = texture2D(uTex, uv);
            c *= min(max(1.-pow(timeDiff*6., 2.), 0.), 1.) * 3.;
            // c.a = min(c.a, f);
            gl_FragColor = c;
          } else {
            discard;
          }
        }
      `,
      side: THREE.DoubleSide,
      depthWrite: false,
      transparent: true,
    });
  };

  let kiGlbApp = null;
  let groundWind = null;
  let capsule = null;
  (async () => {
    kiGlbApp = await metaversefile.load(baseUrl + 'ki.glb');
    app.add(kiGlbApp);

    console.log('load ki app', kiGlbApp);
    window.kiGlbApp = kiGlbApp;

    kiGlbApp.traverse(o => {
      if (o.isMesh) {
        if (o.name === 'GroundWind') {
          groundWind = o;

          // console.log('old ground wind material', groundWind, groundWind.material);
          // _decorateMaterial(groundWind);
        }
        if (o.name === 'Capsule') {
          capsule = o;
          // console.log('old ground wind material', groundWind, groundWind.material);
          // _decorateMaterial(capsule);
          capsule.visible = false;
        }
      }
    });

    {
      const geometry = _getKiWindGeometry(groundWind.geometry);
      const material = _getKiWindMaterial(groundWind.material);
      const {parent} = groundWind;
      parent.remove(groundWind);
      groundWind = new THREE.InstancedMesh(
        geometry,
        material,
        count
      );
      parent.add(groundWind);
    }
  })();

  /* const silkMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.05, 0.1, 10, 10, 10), new THREE.MeshNormalMaterial());
  const defaultScale = new THREE.Vector3(1, 0.3, 1).multiplyScalar(0.5);
  silkMesh.scale.copy(defaultScale);
  app.add(silkMesh); */

  class Particle {
    constructor(position, quaternion, startTime) {
      this.position = position;
      this.quaternion = quaternion;
      this.startTime = startTime;
    }
  }
  let particles = [];
  setInterval(() => {
    const position = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .multiplyScalar(0.05);
    const quaternion = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    const startTime = performance.now()/1000;
    const particle = new Particle(
      position,
      quaternion,
      startTime
    );
    particles.push(particle);
    // console.log('interval', particles.length);
  }, 300);

  // const timeOffset = Math.random() * 10;
  useFrame(({timestamp, timeDiff}) => {
    const localPlayer = useLocalPlayer();
    if (localPlayer.avatar && kiGlbApp) {
      kiGlbApp.position.copy(localPlayer.position);
      kiGlbApp.position.y -= localPlayer.avatar.height;
      localEuler.setFromQuaternion(localPlayer.quaternion);
      localEuler.x = 0;
      localEuler.z = 0;
      kiGlbApp.quaternion.setFromEuler(localEuler);
      kiGlbApp.updateMatrixWorld();
    }
    if (groundWind?.material.uniforms) {
      groundWind.material.uniforms.uTime.value = timestamp/1000;
      groundWind.material.uniforms.uTime.needsUpdate = true;

      // console.log('filter particles 0');
      const startTimesAttribute = groundWind.geometry.attributes.startTimes;
      // console.log('filter particles 1', groundWind.geometry.attributes);
      const startTimes = startTimesAttribute.array;
      // console.log('filter particles 2');
      startTimes.fill(-1);
      const now = performance.now()/1000;
      // console.log('filter particles 3');
      let startTimesIndex = 0;
      particles = particles.filter(particle => {
        const timeDiff = now - particle.startTime;
        // console.log('got time diff', timeDiff);
        if (timeDiff <= 1) {
          startTimes[startTimesIndex++] = particle.startTime;
          return true;
        } else {
          return false;
        }
      });
      window.particles = particles;
      window.startTimes = startTimes;
      startTimesAttribute.needsUpdate = true;
    }
    if (capsule?.material.uniforms) {
      capsule.material.uniforms.uTime.value = timestamp/1000;
      capsule.material.uniforms.uTime.needsUpdate = true;
    }

    /* const time = timeOffset + performance.now() * 0.002;
    const k = 1;
    for (var i = 0; i < silkMesh.geometry.attributes.position.array.length; i += 3) {
      const p = localVector.fromArray(silkMesh.geometry.attributes.position.array, i);
      const f = 0.5 + 0.2 * simplex.noise3D(p.x * k + time, p.y * k, p.z * k);
      p.normalize().multiplyScalar(f);
      p.toArray(silkMesh.geometry.attributes.position.array, i);
    }
    silkMesh.geometry.attributes.position.needsUpdate = true;
    silkMesh.geometry.computeVertexNormals();
    silkMesh.geometry.normalsNeedUpdate = true;
    silkMesh.geometry.verticesNeedUpdate = true; */
  });

  return app;
};