import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {scene} from './app-object.js';
import {rigManager} from './rig.js';
import Simplex from './simplex-noise.js';
import easing from './easing.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

const gltfLoader = new GLTFLoader();
const cubicBezier = easing(0, 1, 0, 1);
const cubicBezier2 = easing(0, 1, 1, 1);
const tickers = [];

const simplex = new Simplex('lol');
const _addSphere = () => {
  const sphere = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.1, 10, 10, 10), new THREE.MeshNormalMaterial());
  sphere.position.set(1.5, 0.4, 0.5);
  const defaultScale = new THREE.Vector3(1, 0.3, 1).multiplyScalar(0.5);
  sphere.scale.copy(defaultScale);
  scene.add(sphere);
  const o = sphere;

  let animation = null;
  const ticker = {
    update() {
      const now = Date.now(); 
      if (!animation) {
        rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector);
        localVector.y = 0;
        const distance = localVector.distanceTo(o.position);
        if (distance < 1) {
          animation = {
            startPosition: o.position.clone(),
            startTime: now,
            endTime: now + 1000,
          };
        }
      }
      if (animation) {
          const headOffset = 0.5;
          const bodyOffset = -0.3;
          const tailTimeFactorCutoff = 0.8;
          const timeDiff = now - animation.startTime;
          const timeFactor = Math.min(Math.max(timeDiff / (animation.endTime - animation.startTime), 0), 1);
          if (timeFactor < 1) {
            if (timeFactor < tailTimeFactorCutoff) {
              const f = cubicBezier(timeFactor);
              rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                .add(localVector2.set(0, headOffset, 0));
              o.position.copy(animation.startPosition).lerp(localVector, f);
            } else {
              {
                const f = cubicBezier(tailTimeFactorCutoff);
                rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                  .add(localVector2.set(0, headOffset, 0));
                o.position.copy(animation.startPosition).lerp(localVector, f);
              }
              {
                const tailTimeFactor = (timeFactor - tailTimeFactorCutoff) / (1 - tailTimeFactorCutoff);
                const f = cubicBezier2(tailTimeFactor);
                rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                  .add(localVector2.set(0, bodyOffset, 0));
                o.position.lerp(localVector, f);
                o.scale.copy(defaultScale).multiplyScalar(1 - tailTimeFactor);
              }
            }
          } else {
            scene.remove(o);
            tickers.splice(tickers.indexOf(ticker), 1);
          }
        }

      const time = performance.now() * 0.002;
      const k = 1;
      for (var i = 0; i < sphere.geometry.vertices.length; i++) {
        const p = sphere.geometry.vertices[i];
        const f = 0.5 + 0.2 * simplex.noise3D(p.x * k + time, p.y * k, p.z * k);
        p.normalize().multiplyScalar(f);
      }
      sphere.geometry.computeVertexNormals();
      sphere.geometry.normalsNeedUpdate = true;
      sphere.geometry.verticesNeedUpdate = true;
    },
  };
  tickers.push(ticker);
};
_addSphere();
const glowHeight = 5;
const glowGeometry = new THREE.CylinderBufferGeometry(0.01, 0.01, glowHeight)
  .applyMatrix4(new THREE.Matrix4().makeTranslation(0, glowHeight/2, 0));
const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    precision highp float;
    precision highp int;

    varying vec2 vUv;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vUv = uv;
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;

    uniform float uTime;

    varying vec2 vUv;

    void main() {
      vec3 c = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
      gl_FragColor = vec4(c, 1. - vUv.y);
    }
  `,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  // polygonOffsetUnits: 1,
});
(async () => {
  const u = `./card-placeholder.glb`; // `https://webaverse.github.io/assets/card-placeholder.glb`;
  let o = await new Promise((accept, reject) => {
    gltfLoader.load(u, accept, function onprogress() {}, reject);
  });
  o = o.scene;
  
  const glowMesh = new THREE.Mesh(
    glowGeometry,
    glowMaterial
  );
  o.add(glowMesh);
  
  const _addCard = () => {
    o.position.set(-1, 0.4, 0.5);
    o.rotation.order = 'YXZ';
    const s = 0.6;
    const defaultScale = new THREE.Vector3(s, s, s);
    o.scale.copy(defaultScale);
    scene.add(o);
    
    let animation = null;
    const ticker = {
      update() {
        const now = Date.now();
        if (!animation) {
          rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector);
          localVector.y = 0;
          const distance = localVector.distanceTo(o.position);
          if (distance < 1) {
            animation = {
              startPosition: o.position.clone(),
              startTime: now,
              endTime: now + 1200,
            };
          }
        }
        if (animation) {
          const headOffset = 0.5;
          const bodyOffset = -0.3;
          const tailTimeFactorCutoff = 0.8;
          const timeDiff = now - animation.startTime;
          const timeFactor = Math.min(Math.max(timeDiff / (animation.endTime - animation.startTime), 0), 1);
          if (timeFactor < 1) {
            if (timeFactor < tailTimeFactorCutoff) {
              const f = cubicBezier(timeFactor);
              rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                .add(localVector2.set(0, headOffset, 0));
              o.position.copy(animation.startPosition).lerp(localVector, f);
              
              const f2 = cubicBezier(timeFactor / tailTimeFactorCutoff);
              glowMesh.scale.setScalar(1 - f2);
            } else {
              {
                const f = cubicBezier(tailTimeFactorCutoff);
                rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                  .add(localVector2.set(0, headOffset, 0));
                o.position.copy(animation.startPosition).lerp(localVector, f);
              }
              {
                const tailTimeFactor = (timeFactor - tailTimeFactorCutoff) / (1 - tailTimeFactorCutoff);
                const f = cubicBezier2(tailTimeFactor);
                rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                  .add(localVector2.set(0, bodyOffset, 0));
                o.position.lerp(localVector, f);
                o.scale.copy(defaultScale).multiplyScalar(1 - tailTimeFactor);
              }
            }
          } else {
            scene.remove(o);
            tickers.splice(tickers.indexOf(ticker), 1);
          }
        }

        const time = performance.now() * 0.0005;
        o.rotation.y = time * Math.PI*2;
      },
    };
    tickers.push(ticker);
  };
  _addCard();
})();

const drop = o => {
  console.log('drop', o);
};
const update = () => {
  for (const ticker of tickers) {
    ticker.update();
  }
};

const dropManager = {
  drop,
  update,
};
export default dropManager;