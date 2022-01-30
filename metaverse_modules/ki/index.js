import * as THREE from 'three';
// import Simplex from './simplex-noise.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useMaterials} = metaversefile;

// const localVector = new THREE.Vector3();
// const simplex = new Simplex('lol');

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');


export default () => {
  const app = useApp();
  const {WebaverseShaderMaterial} = useMaterials();

  const _decorateMaterial = o => {
    const now = performance.now();
    const texture = o.material.emissiveMap;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    o.material = new WebaverseShaderMaterial({
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
        varying vec2 vUv;
        void main() {
          vUv = uv; // vec2(uv.x, 1.-uv.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `\
        uniform sampler2D uTex;
        uniform float uTime;
        varying vec2 vUv;

        float offset = 0.;
        const float animationSpeed = 0.004;

        void main() {
          vec2 uv = vUv;
          // uv.y *= 2.;
          uv.y += uTime * animationSpeed;

          int numSamples = 1;
          for (int i = 0; i < numSamples; i++) {
            vec2 uv2 = uv;
            uv2.y += float(i) / float(numSamples);
            // uv2.y /= float(numSamples);
            float f = 1.-min(max(1.-vUv.y, 0.), 1.);
            vec4 c = texture2D(uTex, uv2) * f;
            // c.a = min(c.a, f);
            gl_FragColor += c;
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
          _decorateMaterial(groundWind);
        }
        if (o.name === 'Capsule') {
          capsule = o;
          // console.log('old ground wind material', groundWind, groundWind.material);
          _decorateMaterial(capsule);
        }
      }
    });
  })();

  /* const silkMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.05, 0.1, 10, 10, 10), new THREE.MeshNormalMaterial());
  const defaultScale = new THREE.Vector3(1, 0.3, 1).multiplyScalar(0.5);
  silkMesh.scale.copy(defaultScale);
  app.add(silkMesh); */

  // const timeOffset = Math.random() * 10;
  useFrame(({timestamp, timeDiff}) => {
    const localPlayer = useLocalPlayer();
    if (localPlayer.avatar && kiGlbApp) {
      kiGlbApp.position.copy(localPlayer.position);
      kiGlbApp.position.y -= localPlayer.avatar.height;
      kiGlbApp.quaternion.copy(localPlayer.quaternion);
      kiGlbApp.updateMatrixWorld();
    }
    if (groundWind) {
      groundWind.material.uniforms.uTime.value = timestamp;
      groundWind.material.uniforms.uTime.needsUpdate = true;
    }
    if (capsule) {
      capsule.material.uniforms.uTime.value = timestamp + 500;
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