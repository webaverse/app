throw new Error('dead code')
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {scene} from './app-object.js';
import {rigManager} from './rig.js';
import Simplex from './simplex-noise.js';
import physicsManager from './physics-manager.js';
import {glowMaterial} from './shaders.js';
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
  const [
    cardModel,
    fruitModel,
  ] = await Promise.all([
    (async () => {
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
      return cardModel;
    })(),
    (async () => {
      const u = `https://webaverse.github.io/assets/fruit.glb`;
      let o = await new Promise((accept, reject) => {
        gltfLoader.load(u, accept, function onprogress() {}, reject);
      });
      o = o.scene;
      let fruitModel = null;
      o.traverse(o => {
        if (!fruitModel && o.isMesh) {
          fruitModel = o;
        }
      });
      if (!fruitModel) {
        console.warn('could not load fruit model');
      }
      return fruitModel;
    })(),
  ]);

  const glowHeight = 5;
  const glowGeometry = new THREE.CylinderBufferGeometry(0.01, 0.01, glowHeight)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, glowHeight/2, 0));
  const colors = new Float32Array(glowGeometry.attributes.position.array.length);
  glowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = glowMaterial.clone();

  const gracePickupTime = 1000;
  const addSilk = (p, v, r) => {
    const velocity = v.clone();
    let grounded = false;
    
    const sphere = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.05, 0.1, 10, 10, 10), new THREE.MeshNormalMaterial());
    sphere.position.copy(p);
    const defaultScale = new THREE.Vector3(1, 0.3, 1).multiplyScalar(0.5);
    sphere.scale.copy(defaultScale);
    scene.add(sphere);
    const o = sphere;

    const startTime = Date.now();
    let lastTimestamp = startTime;
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
          const timeSinceStart = now - startTime;
          if (timeSinceStart > gracePickupTime) {
            animation = {
              startPosition: o.position.clone(),
              startTime: now,
              endTime: now + 1000,
            };
          }
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
      for (var i = 0; i < sphere.geometry.attributes.position.array.length; i += 3) {
        const p = localVector.fromArray(sphere.geometry.attributes.position.array, i);
        const f = 0.5 + 0.2 * simplex.noise3D(p.x * k + time, p.y * k, p.z * k);
        p.normalize().multiplyScalar(f);
        p.toArray(sphere.geometry.attributes.position.array, i);
      }
      sphere.geometry.attributes.position.needsUpdate = true;
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
      material
    );
    o.add(glowMesh);
    
    const startTime = Date.now();
    let lastTimestamp = startTime;
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
          const timeSinceStart = now - startTime;
          if (timeSinceStart > gracePickupTime) {
            animation = {
              startPosition: o.position.clone(),
              startTime: now,
              endTime: now + 1200,
            };
          }
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
  const addFruit = (p, v, r) => {
    const velocity = v.clone();
    let grounded = false;
    
    const o = fruitModel.clone();
    o.position.copy(p);
    o.quaternion.set(
      (-1 + Math.random() * 2) * Math.PI*2,
      (-1 + Math.random() * 2) * Math.PI*2,
      (-1 + Math.random() * 2) * Math.PI*2,
      (-1 + Math.random() * 2) * Math.PI*2
    ).normalize();
    const defaultScale = o.scale.clone();
    o.isFruit = true;
    scene.add(o);

    const startTime = Date.now();
    let lastTimestamp = startTime;
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

          o.rotation.x += r.x;
          o.rotation.y += r.y;
          o.rotation.z += r.z;
        }
      }
      
      if (!animation) {
        rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector);
        localVector.y = 0;
        const distance = localVector.distanceTo(o.position);
        if (distance < 1) {
          const timeSinceStart = now - startTime;
          if (timeSinceStart > gracePickupTime) {
            animation = {
              startPosition: o.position.clone(),
              startTime: now,
              endTime: now + 1000,
            };
          }
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
    };
    tickers.push(o);
  };
  
  return {
    addSilk,
    addDrop,
    addFruit,
  };
})().catch(err => console.warn(err));

const getDrops = () => tickers;
const drop = async (o, {type = null, count = 1, velocity = null, angularVelocity = null} = {}) => {
  const {addSilk, addDrop, addFruit} = await loadPromise;
  for (let i = 0; i < count; i++) {
    const v = velocity || new THREE.Vector3(
      count > 1 ? (-1 + Math.random() * 2) : 0,
      0,
      count > 1 ? (-1 + Math.random() * 2) : 0
    ).normalize().multiplyScalar((0.3 + Math.random() * 0.7) * 4).add(new THREE.Vector3(0, (0.5 + Math.random() * 0.5) * 6, 0));
    const r = angularVelocity || new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2).normalize().multiplyScalar(0.03);
    let fn;
    if (type === 'silk') {
      fn = addSilk;
    } else if (type === 'card') {
      fn = addDrop;
    } else if (type === 'fruit') {
      fn = addFruit;
    } else {
      fn = Math.random() < 0.5 ? addSilk : addDrop;
    }
    fn(o.getWorldPosition(new THREE.Vector3()), v, r);
  }
};
const removeDrop = drop => {
  scene.remove(drop);
  tickers.splice(tickers.indexOf(drop), 1);
};
const update = () => {
  const localTickers = tickers.slice();
  for (const ticker of localTickers) {
    ticker.update();
  }
};

const dropManager = {
  getDrops,
  drop,
  removeDrop,
  update,
};
export default dropManager;
