import * as THREE from './three.module.js';
import {GLTFLoader} from './GLTFLoader.js';
import {scene} from './app-object.js';
import {rigManager} from './rig.js';
import Simplex from './simplex-noise.js';
import physicsManager from './physics-manager.js';
import easing from './easing.js';
import {rarityColors} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

const gltfLoader = new GLTFLoader();
const cubicBezier = easing(0, 1, 0, 1);
const cubicBezier2 = easing(0, 1, 1, 1);
const simplex = new Simplex('lol');
const dropRadius = 0.4;
const rarityColorsArray = Object.keys(rarityColors).map(k => rarityColors[k][0]);

const tickers = [];
const loadPromise = (async () => {
  const u = `https://webaverse.github.io/assets/card-placeholder.glb`;
  let o = await new Promise((accept, reject) => {
    gltfLoader.load(u, accept, function onprogress() {}, reject);
  });
  o = o.scene;
  let cardModel = null;
  o.traverse(o => {
    if (!cardModel && o.isMesh) {
      cardModel = o;
    }
  });
  if (!cardModel) {
    console.warn('could not load card model');
  }
  
  const glowHeight = 5;
  const glowGeometry = new THREE.CylinderBufferGeometry(0.01, 0.01, glowHeight)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, glowHeight/2, 0));
  const colors = new Float32Array(glowGeometry.attributes.position.array.length);
  glowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
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
      
      attribute vec3 color;

      varying vec2 vUv;
      varying vec3 vColor;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        vUv = uv;
        vColor = color;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      uniform float uTime;

      varying vec2 vUv;
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, 1. - vUv.y);
      }
    `,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    // polygonOffsetUnits: 1,
  });

  const addSilk = (p, v, r) => {
    const velocity = v.clone();
    let grounded = false;
    
    const sphere = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.1, 10, 10, 10), new THREE.MeshNormalMaterial());
    sphere.position.copy(p);
    const defaultScale = new THREE.Vector3(1, 0.3, 1).multiplyScalar(0.5);
    sphere.scale.copy(defaultScale);
    scene.add(sphere);
    const o = sphere;

    let lastTimestamp = Date.now();
    let animation = null;
    const timeOffset = Math.random() * 10;
    o.update = () => {
      const now = Date.now();
      const timeDiff = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (!grounded) {
        o.position.add(localVector.copy(velocity).multiplyScalar(timeDiff));
        if (o.position.y < dropRadius) {
          o.position.y = dropRadius;
          grounded = true;
        } else {
          velocity.add(localVector.copy(physicsManager.getGravity()).multiplyScalar(timeDiff));

          // o.rotation.x += r.x;
          o.rotation.y += r.y;
          // o.rotation.z += r.z;
        }
      }
      
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
          tickers.splice(tickers.indexOf(o), 1);
        }
      }

      const time = timeOffset + performance.now() * 0.002;
      const k = 1;
      for (var i = 0; i < sphere.geometry.vertices.length; i++) {
        const p = sphere.geometry.vertices[i];
        const f = 0.5 + 0.2 * simplex.noise3D(p.x * k + time, p.y * k, p.z * k);
        p.normalize().multiplyScalar(f);
      }
      sphere.geometry.computeVertexNormals();
      sphere.geometry.normalsNeedUpdate = true;
      sphere.geometry.verticesNeedUpdate = true;
    };
    tickers.push(o);
  };
  
  const addDrop = (p, v, r) => {
    const o = new THREE.Mesh(cardModel.geometry, cardModel.material);
    
    const velocity = v.clone();
    let grounded = false;
    
    o.position.copy(p);
    o.rotation.order = 'YXZ';
    const s = 0.6;
    const defaultScale = new THREE.Vector3(s, s, s);
    o.scale.copy(defaultScale);
    scene.add(o);
    
    const geometry = glowGeometry.clone();
    const color = new THREE.Color(rarityColorsArray[Math.floor(Math.random() * rarityColorsArray.length)]);
    for (let i = 0; i < geometry.attributes.color.array.length; i += 3) {
      color.toArray(geometry.attributes.color.array, i);
    }
    const glowMesh = new THREE.Mesh(
      geometry,
      glowMaterial
    );
    o.add(glowMesh);
    
    let lastTimestamp = Date.now();
    let animation = null;
    const timeOffset = Math.random() * 10;
    o.update = () => {
      const now = Date.now();
      const timeDiff = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (!grounded) {
        o.position.add(localVector.copy(velocity).multiplyScalar(timeDiff));
        if (o.position.y < dropRadius) {
          o.position.y = dropRadius;
          grounded = true;
        } else {
          velocity.add(localVector.copy(physicsManager.getGravity()).multiplyScalar(timeDiff));
          
          /* o.rotation.x += r.x;
          o.rotation.y += r.y;
          o.rotation.z += r.z; */
        }
      }
      
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
          tickers.splice(tickers.indexOf(o), 1);
        }
      }

      const time = performance.now() * 0.0005;
      o.rotation.y = (timeOffset + time * Math.PI*2) % Math.PI*2;
    };
    tickers.push(o);
  };
  
  return {
    addSilk,
    addDrop,
  };
})().catch(err => console.warn(err));

const drop = async (o, {type = null, count = 1, velocity = null} = {}) => {
  const {addSilk, addDrop} = await loadPromise;
  for (let i = 0; i < count; i++) {
    const v = velocity || new THREE.Vector3(
      count > 1 ? (-1 + Math.random() * 2) : 0,
      0,
      count > 1 ? (-1 + Math.random() * 2) : 0
    ).normalize().multiplyScalar((0.3 + Math.random() * 0.7) * 4).add(new THREE.Vector3(0, (0.5 + Math.random() * 0.5) * 6, 0));
    const r = new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2).normalize().multiplyScalar(0.03);
    let fn;
    if (type === 'silk') {
      fn = addSilk;
    } else if (type === 'card') {
      fn = addDrop;
    } else {
      fn = Math.random() < 0.5 ? addSilk : addDrop;
    }
    fn(o.getWorldPosition(new THREE.Vector3()), v, r);
  }
};
const update = () => {
  const localTickers = tickers.slice();
  for (const ticker of localTickers) {
    ticker.update();
  }
};

const dropManager = {
  drop,
  update,
};
export default dropManager;