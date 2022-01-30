import * as THREE from 'three';
// import Simplex from './simplex-noise.js';
import metaversefile from 'metaversefile';
const {useApp, useInternals, useFrame, useLocalPlayer, useLoaders, useMaterials} = metaversefile;

// const localVector = new THREE.Vector3();
// const simplex = new Simplex('lol');

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');

const identityQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler(0, 0, 0, 'YXZ');

export default () => {
  const app = useApp();
  const {camera} = useInternals();
  // const {textureLoader} = useLoaders();
  const {WebaverseShaderMaterial} = useMaterials();

  const textureLoader = new THREE.TextureLoader();

  const count = 32;
  const animationSpeed = 3;
  const hideFactor = 1;
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
  const _getKiGroundWindMaterial = material => {
    const now = performance.now();
    const texture = material.emissiveMap;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    // texture.needsUpdate = true;
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

        vec3 qtransform(vec3 v, vec4 q) { 
          return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
        }

        void main() {
          vUv = uv;
          vStartTimes = startTimes;
          vec3 p = qtransform((position * vec3(1.5, 1., 1.5)) + positions, quaternions);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `\
        uniform sampler2D uTex;
        uniform float uTime;
        varying vec2 vUv;
        
        varying float vStartTimes;

        const float animationSpeed = ${animationSpeed.toFixed(8)};

        void main() {
          if (vStartTimes >= 0.) {
            float t = uTime;
            float timeDiff = t - vStartTimes;

            vec2 uv = vUv;
            // uv.y *= 2.;
            uv.y += timeDiff * animationSpeed;
            // uv.y *= 2.;

            vec4 c = texture2D(uTex, uv);
            c *= min(max(1.-pow(timeDiff*${(animationSpeed * 2).toFixed(8)}, 2.), 0.), 1.) * 3.;
            // c.a = min(c.a, f);
            if (vUv.y < .3) {
              c *= pow(vUv.y/.3, 1.);
            }
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
  const _getKiCapsuleMaterial = material => {
    const now = performance.now();
    const texture = material.emissiveMap;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    // texture.needsUpdate = true;
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

        uniform float uTime;

        vec3 qtransform(vec3 v, vec4 q) { 
          return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
        }

        void main() {
          vUv = uv;
          vStartTimes = startTimes;
          vec3 p = position;
          p *= vec3(0.9, 1., 0.9);
          p += positions;
          p = qtransform(p, quaternions);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `\
        uniform sampler2D uTex;
        uniform float uTime;
        varying vec2 vUv;
        
        varying float vStartTimes;

        const float animationSpeed = ${animationSpeed.toFixed(8)};

        vec4 pow4(vec4 v, float n) {
          return vec4(pow(v.x, n), pow(v.y, n), pow(v.z, n), pow(v.w, n));
        }

        void main() {
          if (vStartTimes >= 0.) {
            float t = uTime;
            float timeDiff = t - vStartTimes;

            vec2 uv = vUv;
            // uv.y *= 2.;
            uv.y += timeDiff * animationSpeed;
            // uv.y *= 2.;
            // uv.y = 0.2 + pow(uv.y, 0.7);

            float distanceToMiddle = abs(vUv.y - 0.5);

            vec4 c = texture2D(uTex, uv);
            c *= min(max(1.-pow(timeDiff*${(animationSpeed * 1).toFixed(8)}, 2.), 0.), 1.);
            if (vUv.y < .3) {
              c *= pow(vUv.y/.3, 0.5);
            }
            // c *= pow(0.5-distanceToMiddle, 3.);
            c = pow4(c, 6.) * 2.;
            // c *= 1.-pow(distanceToMiddle, 2.)*4.;
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
  let aura = null;
  (async () => {
    const texture = textureLoader.load(baseUrl + 'Aura01_noBack.png');
    
    kiGlbApp = await metaversefile.load(baseUrl + 'ki.glb');
    app.add(kiGlbApp);

    console.log('load ki app', kiGlbApp);
    // window.kiGlbApp = kiGlbApp;

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
          // capsule.visible = false;
        }
      }
    });

    {
      const geometry = _getKiWindGeometry(groundWind.geometry);
      const material = _getKiGroundWindMaterial(groundWind.material);
      const {parent} = groundWind;
      parent.remove(groundWind);
      groundWind = new THREE.InstancedMesh(
        geometry,
        material,
        count
      );
      parent.add(groundWind);
    }
    {
      const geometry = _getKiWindGeometry(capsule.geometry);
      const material = _getKiCapsuleMaterial(capsule.material);
      const {parent} = capsule;
      parent.remove(capsule);
      capsule = new THREE.InstancedMesh(
        geometry,
        material,
        count
      );
      parent.add(capsule);
    }

    {
      // await metaversefile.load(baseUrl + 'ki.glb');
      const size = 2;
      let geometry = new THREE.PlaneBufferGeometry(size, size*2)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, size*0.85, 0));
      geometry = _getKiWindGeometry(geometry);
      const now = performance.now();
      const material = new WebaverseShaderMaterial({
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

          uniform float uTime;

          vec3 qtransform(vec3 v, vec4 q) { 
            return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
          }

          void main() {
            vUv = uv;
            vStartTimes = startTimes;
            vec3 p = position;
            // p *= vec3(0.9, 1., 0.9);
            p += positions;
            p = qtransform(p, quaternions);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTex;
          uniform float uTime;
          varying vec2 vUv;
          
          varying float vStartTimes;
          
          const float animationSpeed = ${animationSpeed.toFixed(8)};

          vec4 pow4(vec4 v, float n) {
            return vec4(pow(v.x, n), pow(v.y, n), pow(v.z, n), pow(v.w, n));
          }

          void main() {
            if (vStartTimes >= 0.) {
              float t = uTime;
              float timeDiff = t - vStartTimes;

              vec2 uv = vUv;
              uv.y *= 2.;
              // uv.y *= 2.;
              uv.y -= timeDiff * animationSpeed;
              // uv.y *= 2.;
              // uv.y = 0.2 + pow(uv.y, 0.7);

              float distanceToMiddle = abs(vUv.y - 0.5);

              vec4 c = texture2D(uTex, uv);
              c *= min(max(1.-pow(timeDiff*${(animationSpeed * 1).toFixed(8)}, 2.), 0.), 1.);
              if (vUv.y > .9) {
                c *= pow(1. - (vUv.y - 0.9)/.1, 0.5);
              }
              // c *= pow(0.5-distanceToMiddle, 3.);
              c = pow4(c, 6.) * 2.;
              // c *= 1.-pow(distanceToMiddle, 2.)*4.;
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
      aura = new THREE.InstancedMesh(geometry, material, count);
      kiGlbApp.add(aura);
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
  let groundWindParticles = [];
  let nextGroundWindParticleTime = 0;
  let capsuleParticles = [];
  let auraParticles = [];
  let nextCapsuleParticleTime = 0;
  let nextAuraParticleTime = 0;

  // const timeOffset = Math.random() * 10;
  useFrame(({timestamp, timeDiff}) => {
    const localPlayer = useLocalPlayer();
    const now = timestamp;
    const timeS = now/1000;

    groundWindParticles = groundWindParticles.filter(particle => {
      const timeDiff = timeS - particle.startTime;
      if (timeDiff <= 1) {
        return true;
      } else {
        return false;
      }
    });
    capsuleParticles = capsuleParticles.filter(capsule => {
      const timeDiff = timeS - capsule.startTime;
      if (timeDiff <= 1) {
        return true;
      } else {
        return false;
      }
    });
    auraParticles = auraParticles.filter(particle => {
      const timeDiff = timeS - particle.startTime;
      if (timeDiff <= 1) {
        return true;
      } else {
        return false;
      }
    });
    // window.auraParticles = auraParticles;

    const _updateGroundWind = () => {
      const positionsAttribute = groundWind.geometry.getAttribute('positions');
      const positions = positionsAttribute.array;

      const quaternionsAttribute = groundWind.geometry.getAttribute('quaternions');
      const quaternions = quaternionsAttribute.array;

      const startTimesAttribute = groundWind.geometry.attributes.startTimes;
      const startTimes = startTimesAttribute.array;
      startTimes.fill(-1);
      let startTimesIndex = 0;
      
      for (const particle of groundWindParticles) {
        const index = startTimesIndex++;
        particle.position.toArray(positions, index * 3);
        particle.quaternion.toArray(quaternions, index * 4);
        startTimes[index] = particle.startTime;
      }

      positionsAttribute.needsUpdate = true;
      quaternionsAttribute.needsUpdate = true;
      startTimesAttribute.needsUpdate = true;
      groundWind.count = groundWindParticles.length;
    };
    const _updateCapsule = () => {
      const positionsAttribute = capsule.geometry.getAttribute('positions');
      const positions = positionsAttribute.array;

      const quaternionsAttribute = capsule.geometry.getAttribute('quaternions');
      const quaternions = quaternionsAttribute.array;

      const startTimesAttribute = capsule.geometry.attributes.startTimes;
      const startTimes = startTimesAttribute.array;
      startTimes.fill(-1);
      let startTimesIndex = 0;
      
      for (const particle of capsuleParticles) {
        const index = startTimesIndex++;
        particle.position.toArray(positions, index * 3);
        particle.quaternion.toArray(quaternions, index * 4);
        startTimes[index] = particle.startTime;
      }

      positionsAttribute.needsUpdate = true;
      quaternionsAttribute.needsUpdate = true;
      startTimesAttribute.needsUpdate = true;
      capsule.count = capsuleParticles.length;
    };
    const _updateAura = () => {
      const positionsAttribute = aura.geometry.getAttribute('positions');
      const positions = positionsAttribute.array;

      const quaternionsAttribute = aura.geometry.getAttribute('quaternions');
      const quaternions = quaternionsAttribute.array;

      const startTimesAttribute = aura.geometry.attributes.startTimes;
      const startTimes = startTimesAttribute.array;
      startTimes.fill(-1);
      let startTimesIndex = 0;
      
      for (const particle of auraParticles) {
        const index = startTimesIndex++;
        particle.position.toArray(positions, index * 3);
        particle.quaternion.toArray(quaternions, index * 4);
        startTimes[index] = particle.startTime;
      }

      positionsAttribute.needsUpdate = true;
      quaternionsAttribute.needsUpdate = true;
      startTimesAttribute.needsUpdate = true;
      aura.count = auraParticles.length;
    };

    if (now >= nextGroundWindParticleTime) {
      const position = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .multiplyScalar(0.05);
      const quaternion = new THREE.Quaternion()
        .setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(Math.random() * 2 - 1, 10, Math.random() * 2 - 1).normalize()
        )
        .premultiply(
          new THREE.Quaternion()
            .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2)
        );
      const startTime = performance.now()/1000;
      const particle = new Particle(
        position,
        quaternion,
        startTime
      );
      groundWindParticles.push(particle);
      // console.log('interval', groundWindParticles.length);
      nextGroundWindParticleTime = now + 30 + Math.random() * 100;

      _updateGroundWind();
    }
    if (now >= nextCapsuleParticleTime) {
      const position = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .multiplyScalar(0.05);
      const quaternion = new THREE.Quaternion()
        .setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(Math.random() * 2 - 1, 10, Math.random() * 2 - 1).normalize()
        )
        .premultiply(
          new THREE.Quaternion()
            .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2)
        );
      const startTime = performance.now()/1000;
      const particle = new Particle(
        position,
        quaternion,
        startTime
      );
      capsuleParticles.push(particle);
      // console.log('interval', groundWindParticles.length);
      nextCapsuleParticleTime = now + 120 + Math.random() * 50;

      _updateCapsule();
    }
    if (now >= nextAuraParticleTime) {
      /* const position = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .multiplyScalar(0.05); */
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion()
        .setFromAxisAngle(
          new THREE.Vector3(0, 0, 1),
          (Math.random() * 2 - 1) * Math.PI*0.02
        );
      const startTime = performance.now()/1000;
      const particle = new Particle(
        position,
        quaternion,
        startTime
      );
      auraParticles.push(particle);
      // console.log('interval', groundWindParticles.length);
      nextAuraParticleTime = now + 100 + Math.random() * 50;

      _updateAura();
    }
    
    if (localPlayer.avatar && kiGlbApp) {
      kiGlbApp.position.copy(localPlayer.position);
      kiGlbApp.position.y -= localPlayer.avatar.height;
      kiGlbApp.position.y -= 0.1;
      /* localEuler.setFromQuaternion(localPlayer.quaternion);
      localEuler.x = 0;
      localEuler.z = 0;
      kiGlbApp.quaternion.setFromEuler(localEuler); */
      kiGlbApp.updateMatrixWorld();
    }
    if (groundWind?.material.uniforms) {
      groundWind.material.uniforms.uTime.value = timeS;
      groundWind.material.uniforms.uTime.needsUpdate = true;
    }
    if (capsule?.material.uniforms) {
      capsule.material.uniforms.uTime.value = timeS;
      capsule.material.uniforms.uTime.needsUpdate = true;
    }
    if (aura?.material.uniforms) {
      aura.material.uniforms.uTime.value = timeS;
      aura.material.uniforms.uTime.needsUpdate = true;

      // make the aura face the camera
      localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      aura.quaternion.setFromEuler(localEuler);
      aura.updateMatrixWorld();
    }
  });

  return app;
};