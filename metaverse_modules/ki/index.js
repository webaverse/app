import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useInternals, useFrame, useLocalPlayer, useLoaders, useMaterials} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');

// const localVector = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler(0, 0, 0, 'YXZ');

const identityQuaternion = new THREE.Quaternion();

const color1 = new THREE.Color(0x59C173);
const color2 = new THREE.Color(0xa17fe0);

export default e => {
  const app = useApp();
  const {camera} = useInternals();
  const {WebaverseShaderMaterial} = useMaterials();

  const count = 32;
  const animationSpeed = 3;
  // const hideFactor = 1;
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
        color1: {
          value: color1.clone(),
          needsUpdate: true,
        },
        color2: {
          value: color2.clone(),
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
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        
        varying float vStartTimes;

        const float animationSpeed = ${animationSpeed.toFixed(8)};
        // const vec3 color1 = vec3(${color1.toArray().join(', ')});
        // const vec3 color2 = vec3(${color2.toArray().join(', ')});

        vec4 pow4(vec4 v, float n) {
          return vec4(pow(v.x, n), pow(v.y, n), pow(v.z, n), pow(v.w, n));
        }

        // All components are in the range [0…1], including hue.
        vec3 rgb2hsv(vec3 c)
        {
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
        

        // All components are in the range [0…1], including hue.
        vec3 hsv2rgb(vec3 c)
        {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          if (vStartTimes >= 0.) {
            float t = uTime;
            float timeDiff = t - vStartTimes;

            vec2 uv = vUv;
            uv *= 2.;
            uv.y += timeDiff * animationSpeed;

            vec2 sampleUv = uv;
            vec4 c = texture2D(uTex, sampleUv);
            c.rgb *= mix(color1, color2, 1.-vUv.y);
            c *= min(max(1.-pow(timeDiff*${(animationSpeed * 1).toFixed(8)}, 2.), 0.), 1.);
            if (vUv.y < .3) {
              c *= vUv.y/.3;
            }
            c = pow4(c, 5.) * 2.;
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
        color1: {
          value: color1.clone(),
          needsUpdate: true,
        },
        color2: {
          value: color2.clone(),
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
        uniform vec3 color1;
        uniform vec3 color2;
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
            uv.y += timeDiff * animationSpeed;

            // float distanceToMiddle = abs(vUv.y - 0.5);

            vec2 sampleUv = uv;
            vec4 c = texture2D(uTex, sampleUv);
            c.rgb *= mix(color1, color2, sampleUv.y);
            c *= min(max(1.-pow(timeDiff*${(animationSpeed * 1).toFixed(8)}, 2.), 0.), 1.);
            if (vUv.y < .3) {
              c *= pow(vUv.y/.3, 0.5);
            }
            c = pow4(c, 6.) * 2.;
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
  const _getKiAuraMaterial = material => {
    const now = performance.now();
    const texture = material.emissiveMap;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
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
        color1: {
          value: color1.clone(),
          needsUpdate: true,
        },
        color2: {
          value: color2.clone(),
          needsUpdate: true,
        },
      },
      vertexShader: `\
        uniform float uTime;
        uniform vec3 color1;
        uniform vec3 color2;
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
          vec3 p = position;
          p *= vec3(0.9, 1., 0.9);
          p += positions;
          p = qtransform(p, quaternions);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform vec3 color1;
        uniform vec3 color2;
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
            uv.y -= 1.;
            uv.y += timeDiff * animationSpeed;
            // uv.y = 0.2 + pow(uv.y, 0.7);

            // float distanceToMiddle = abs(vUv.y - 0.5);

            vec2 sampleUv = uv;
            vec4 c = texture2D(uTex, sampleUv);
            c.rgb *= mix(color1, color2, sampleUv.y);
            c *= min(max(1.-pow(timeDiff*${(animationSpeed * 1).toFixed(8)}, 2.), 0.), 1.);
            c = pow4(c, 6.) * 2.;
            gl_FragColor = c;

            #include <tonemapping_fragment>
            #include <encodings_fragment>
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

  const object = new THREE.Object3D();
  app.add(object);

  let kiGlbApp = null;
  let groundWind = null;
  let capsule = null;
  let aura = null;
  e.waitUntil((async () => {
    kiGlbApp = await metaversefile.createAppAsync({
      start_url: baseUrl + 'ki.glb',
    });

    kiGlbApp.traverse(o => {
      if (o.isMesh) {
        if (o.name === 'GroundWind') {
          groundWind = o;
        }
        if (o.name === 'Capsule') {
          capsule = o;
        }
        if (o.name === 'Aura') {
          aura = o;
        }
      }
    });

    {
      const geometry = _getKiWindGeometry(groundWind.geometry);
      const material = _getKiGroundWindMaterial(groundWind.material);
      groundWind = new THREE.InstancedMesh(
        geometry,
        material,
        count,
      );
      object.add(groundWind);
    }
    {
      const geometry = _getKiWindGeometry(capsule.geometry);
      const material = _getKiCapsuleMaterial(capsule.material);
      capsule = new THREE.InstancedMesh(
        geometry,
        material,
        count,
      );
      object.add(capsule);
    }
    {
      const geometry = _getKiWindGeometry(aura.geometry);
      const material = _getKiAuraMaterial(aura.material);
      aura = new THREE.InstancedMesh(
        geometry,
        material,
        count,
      );
      object.add(aura);
    }
  })());

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
  // let hairMeshes = null;
  useFrame(({timestamp, timeDiff}) => {
    const localPlayer = useLocalPlayer();
    const now = timestamp;
    const timeS = now / 1000;

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
      if (groundWind) {
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
      }
    };
    const _updateCapsule = () => {
      if (capsule) {
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
      }
    };
    const _updateAura = () => {
      if (aura) {
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
      }
    };

    if (now >= nextGroundWindParticleTime) {
      const position = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .multiplyScalar(0.05);
      const quaternion = new THREE.Quaternion()
        .setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(Math.random() * 2 - 1, 10, Math.random() * 2 - 1).normalize(),
        )
        .premultiply(
          new THREE.Quaternion()
            .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2),
        );
      const startTime = performance.now() / 1000;
      const particle = new Particle(
        position,
        quaternion,
        startTime,
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
          new THREE.Vector3(Math.random() * 2 - 1, 10, Math.random() * 2 - 1).normalize(),
        )
        .premultiply(
          new THREE.Quaternion()
            .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2),
        );
      const startTime = performance.now() / 1000;
      const particle = new Particle(
        position,
        quaternion,
        startTime,
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
          (Math.random() * 2 - 1) * Math.PI * 0.02,
        )
        .multiply(
          new THREE.Quaternion()
            .setFromAxisAngle(
              new THREE.Vector3(0, 1, 0),
              (Math.random() < 0.5 ? 0 : Math.PI),
            ),
        );
      const startTime = performance.now() / 1000;
      const particle = new Particle(
        position,
        quaternion,
        startTime,
      );
      auraParticles.push(particle);
      // console.log('interval', groundWindParticles.length);
      nextAuraParticleTime = now + 100 + Math.random() * 50;

      _updateAura();
    }

    if (localPlayer.avatar) {
      object.position.copy(localPlayer.position);
      object.position.y -= localPlayer.avatar.height;
      object.position.y -= 0.1;
      /* localEuler.setFromQuaternion(localPlayer.quaternion);
      localEuler.x = 0;
      localEuler.z = 0;
      object.quaternion.setFromEuler(localEuler); */
      object.updateMatrixWorld();
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
