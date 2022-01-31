import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useInternals, useFrame, useLocalPlayer, useLoaders, useMaterials} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');

const localVector = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler(0, 0, 0, 'YXZ');

const identityQuaternion = new THREE.Quaternion();

let kiGlbApp = null;
const loadPromise = (async () => {
  kiGlbApp = await metaversefile.load(baseUrl + 'ki.glb');
})();

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
            uv.y -= 1.;
            uv.y += timeDiff * animationSpeed;
            // uv.y = 0.2 + pow(uv.y, 0.7);

            float distanceToMiddle = abs(vUv.y - 0.5);

            vec4 c = texture2D(uTex, uv);
            c *= min(max(1.-pow(timeDiff*${(animationSpeed * 1).toFixed(8)}, 2.), 0.), 1.);
            /* if (vUv.y < 0.1) {
              // c *= pow((vUv.y - 0.9)/.1, 0.5);
              c = vec4(1.,0.,0.,1.);
            } */
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

  const object = new THREE.Object3D();
  app.add(object);
  let groundWind = null;
  let capsule = null;
  let aura = null;
  e.waitUntil((async () => {
    await loadPromise;

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
        count
      );
      object.add(groundWind);
    }
    {
      const geometry = _getKiWindGeometry(capsule.geometry);
      const material = _getKiCapsuleMaterial(capsule.material);
      capsule = new THREE.InstancedMesh(
        geometry,
        material,
        count
      );
      object.add(capsule);
    }
    {
      const geometry = _getKiWindGeometry(aura.geometry);
      const material = _getKiAuraMaterial(aura.material);
      aura = new THREE.InstancedMesh(
        geometry,
        material,
        count
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

  const _makeKiHairMaterial = () => {
    let wVertex = THREE.ShaderLib["standard"].vertexShader;
    let wFragment = THREE.ShaderLib["standard"].fragmentShader;
    // let wUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib["standard"].uniforms);
    let wUniforms = {
      iTime: {
        value: 0,
        needsUpdate: false,
      },
      uHeadCenter: {
        value: new THREE.Vector3(0, 0, 0),
        needsUpdate: false,
      },
      color1: {
        value: new THREE.Color(),
        needsUpdate: false,
      },
      color2: {
        value: new THREE.Color(),
        needsUpdate: false,
      },
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
    /* wFragment = `\
      void main() {
        gl_FragColor = vec4(1., 0., 0., 1.);
      }
    `; */
    // console.log('got vertex', wVertex, wFragment);
    wVertex = wVertex.replace(`#include <clipping_planes_pars_vertex>`, `\
      #include <clipping_planes_pars_vertex>
      varying vec2 vUv;
      varying vec3 vWorldPosition;
    `);
    wVertex = wVertex.replace(`}`, `\
        vUv = uv;
      }
    `);
    wVertex = wVertex.replace(`#include <skinning_vertex>`, `\
      #include <skinning_vertex>
      vWorldPosition = transformed;
    `);

    wFragment = wFragment.replace(`#include <clipping_planes_pars_fragment>`, `\
      #include <clipping_planes_pars_fragment>
      uniform float iTime;
      uniform vec3 uHeadCenter;
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      // #define PI 3.1415926535897932384626433832795
    `);
    wFragment = wFragment.replace(`}`, `\
        // float f = dot(vNormal, normalize(vec3(1.)));
        // vec3 colorX = mix(color1, color2, f);
        // vec3 colorY = mix(color1, color2, vUv.y);
        // gl_FragColor.rgb = colorX * colorY;
        // gl_FragColor.rgb = colorX;
        gl_FragColor.rb = vUv;

        float distanceToCenter = length(vWorldPosition - uHeadCenter);
        float glowRadius = iTime * 0.15;
        float distanceToGlowRadius = abs(distanceToCenter - glowRadius);
        distanceToGlowRadius = mod(distanceToGlowRadius, 0.1);
        gl_FragColor.rgb *= 0.3;
        if (distanceToGlowRadius < 0.01) {
          gl_FragColor.rgb *= 2.;
        }
        float glowFactor = 1. + sin(iTime * PI * 2. * 3.) * 0.5;
        gl_FragColor.rgb *= 0.5 + glowFactor * 0.5;
      }
    `);
    /* const defaultUniforms = ['diffuse', 'emissive', 'roughness', 'metalness', 'opacity', 'ambientLightColor', 'lightProbe', 'directionalLights'];
    for (const defaultUniform of defaultUniforms) {
      wUniforms[defaultUniform] = {
        value: null,
        needsUpdate: false,
      };
    } */

    // console.log('got fragment', wFragment);
    const material = new THREE.ShaderMaterial({
      uniforms: wUniforms,
      /* defines: {
        USE_LOGDEPTHBUF: '1',
      }, */
      vertexShader: wVertex,
      fragmentShader: wFragment,
      // lights: true,
      // depthPacking: THREE.RGBADepthPacking,
      // name: "detail-material",
      // fog: true,
      extensions: {
        derivatives: true,
      },
      // side: THREE.DoubleSide,
    });
    return material;
  };

  // const timeOffset = Math.random() * 10;
  let hairMeshes = null;
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

    if (localPlayer.avatar) {
      // window.avatar = localPlayer.avatar;
      const {object, vrmExtension} = localPlayer.avatar;
      
      /* const {parser} = object;
      const {json} = parser;
      const {nodes} = json;

      const {secondaryAnimation} = vrmExtension;
      const {boneGroups} = secondaryAnimation;
      const {bones} = boneGroups; */

      // const hairBoneBooleans = bones.map(bone => /hair/i.test(bone.name));
      if (!object.kiDecorated) {
        hairMeshes = [];
        object.scene.traverse(o => {
          // console.log(o.name, o.isMesh);
          if (o.isSkinnedMesh) {
            const {geometry, skeleton} = o;
            const {attributes, index: indexAttribute} = geometry;
            const indices = indexAttribute.array;
            const {skinIndex, skinWeight} = attributes;
            const skinIndices = skinIndex.array;
            const skinWeights = skinWeight.array;
            const {itemSize} = skinIndex;
            let done = false;
            for (let i = 0; i < indices.length; i++) {
              const index = indices[i];
              for (let j = 0; j < itemSize; j++) {
                const skinIndex = skinIndices[index * itemSize + j];
                const skinWeight = skinWeights[index * itemSize + j];
                if (skinWeight !== 0 && /hair/i.test(skeleton.bones[skinIndex].name)) {
                  // console.log('got', o.name, {attributes, skinIndices, skinWeights});
                  hairMeshes.push(o);
                  done = true;
                  break;
                }
              }
              if (done) {
                break;
              }
            }
          }
        });
        for (const hairMesh of hairMeshes) {
          hairMesh.kiOriginalMaterial = hairMesh.material;
          const kiHairMaterial = _makeKiHairMaterial(hairMesh.material);
          hairMesh.material = kiHairMaterial;
          
          kiHairMaterial.uniforms.color1.value.setHex(0xfdeb44);
          kiHairMaterial.uniforms.color1.needsUpdate = true;
          kiHairMaterial.uniforms.color2.value.setHex(0xf6b01d);
          kiHairMaterial.uniforms.color2.needsUpdate = true;

          for (const k in kiHairMaterial.uniforms) {
            hairMesh.material.uniforms[k] = kiHairMaterial.uniforms[k];
          }
          hairMesh.material.defines = kiHairMaterial.defines;
          hairMesh.material.vertexShader = kiHairMaterial.vertexShader;
          hairMesh.material.fragmentShader = kiHairMaterial.fragmentShader;
        }
        object.kiDecorated = true;
      }
      for (const hairMesh of hairMeshes) {
        hairMesh.material.uniforms.iTime.value = timestamp/1000;
        hairMesh.material.uniforms.iTime.needsUpdate = true;

        hairMesh.material.uniforms.uHeadCenter.value.setFromMatrixPosition(localPlayer.avatar.modelBoneOutputs.Head.matrixWorld);
        hairMesh.material.uniforms.uHeadCenter.needsUpdate = true;
      }

      if (localPlayer.avatar.springBoneManager) {
        localPlayer.avatar.springBoneManager.springBoneGroupList[0].forEach(o => {
          o.gravityDir.setFromMatrixPosition(o.bone.matrixWorld)
            .sub(localVector.setFromMatrixPosition(localPlayer.avatar.modelBoneOutputs.Head.matrixWorld))
            .normalize()
            .lerp(localVector.set(0, 1, 0), 0.9)
            // .applyQuaternion(localQuaternion.setFromRotationMatrix(o.bone.matrixWorld));
          const octave = Math.sin(timeS * Math.PI * 2 * 4) // +
            // Math.sin(timeS * Math.PI * 2 * 4) +
            // Math.sin(timeS * Math.PI * 2 * 8);
          o.gravityPower = 0.4 + (1 + octave)*0.5 * 0.5;
        });
        localPlayer.avatar.springBoneTimeStep.update(timeDiff);
      }
    }

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
        )
        .multiply(
          new THREE.Quaternion()
            .setFromAxisAngle(
              new THREE.Vector3(0, 1, 0),
              (Math.random() < 0.5 ? 0 : Math.PI)
            )
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