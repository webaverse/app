import * as THREE from './three.module.js';
import {scene, camera} from './app-object.js';
import physicsManager from './physics-manager.js';
import {epochStartTime} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const size = 2048;
const tileSize = 512;
const numTilesPerRow = size/tileSize;
const numTiles = numTilesPerRow ** 2;
const speed = 500;
const bulletTimeout = 10000;
const bulletSpeed = 0.3;

let effects = [];

const planeGeometry = new THREE.PlaneBufferGeometry(1, 1);
const _makeFxGeometry = () => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(1024*1024);
  const uvs = new Float32Array(1024*1024);
  const epochStartTimes = new Float32Array(1024*1024);
  const speeds = new Float32Array(1024*1024);
  const indices = new Uint32Array(1024*1024);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('epochStartTime', new THREE.BufferAttribute(epochStartTimes, 1));
  geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
};
const hitFxGeometry = _makeFxGeometry();
const bulletFxGeometry = _makeFxGeometry();

const hitFxMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTex: {
      type: 't',
      value: new THREE.Texture(),
      needsUpdate: true,
    },
    uEpochTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uTileSize: {
      type: 'f',
      value: 1/numTilesPerRow,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    precision highp float;
    precision highp int;
    
    attribute float epochStartTime;
    attribute float speed;

    uniform float uEpochTime;
    uniform float uTileSize;

    varying vec2 vUv;

    float numTiles = ${numTiles.toFixed(8)};
    float numTilesPerRow = ${numTilesPerRow.toFixed(8)};

    void main() {
      vUv = uv;
      vUv.x *= uTileSize;
      vUv.y = 1.0 - (1.0 - vUv.y) * uTileSize;

      float time = mod(uEpochTime - epochStartTime, speed) / speed;
      float tile = mod(floor(time * numTiles), numTiles);
      float col = mod(tile, numTilesPerRow);
      float row = floor(tile / numTilesPerRow);
      vUv += vec2(
        col / numTilesPerRow,
        row / numTilesPerRow
      );

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;
    
    uniform sampler2D uTex;
    
    varying vec2 vUv;

    void main() {
      vec4 diffuse = texture2D(uTex, vUv);
      if (diffuse.a > 0.15) {
        gl_FragColor = diffuse;
      } else {
        discard;
      }
    }
  `,
  side: THREE.DoubleSide,
  transparent: true,
});

const bulletFxMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTex: {
      type: 't',
      value: new THREE.Texture(),
      needsUpdate: true,
    },
    uEpochTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uTileSize: {
      type: 'f',
      value: 1/numTilesPerRow,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    precision highp float;
    precision highp int;
    
    attribute float epochStartTime;
    attribute float speed;

    uniform float uEpochTime;
    uniform float uTileSize;

    varying vec2 vUv;

    float numTiles = ${numTiles.toFixed(8)};
    float numTilesPerRow = ${numTilesPerRow.toFixed(8)};

    void main() {
      vUv = uv;
      vUv.x *= uTileSize;
      vUv.y = 1.0 - (1.0 - vUv.y) * uTileSize;

      float time = mod(uEpochTime - epochStartTime, speed) / speed;
      float tile = mod(floor(time * numTiles), numTiles);
      float col = mod(tile, numTilesPerRow);
      float row = floor(tile / numTilesPerRow);
      vUv += vec2(
        col / numTilesPerRow,
        -row / numTilesPerRow
      );

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;
    
    uniform sampler2D uTex;
    
    varying vec2 vUv;

    void main() {
      vec4 diffuse = texture2D(uTex, vUv);
      if (diffuse.a > 0.15) {
        gl_FragColor = diffuse;
      } else {
        discard;
      }
    }
  `,
  side: THREE.DoubleSide,
  transparent: true,
});

let hitMesh, bulletMesh;
const loadPromise = Promise.all([
  `Elements - Sparks 104 Hit Radial noCT noRSZ`,
  `Elements - Energy 023 Projectile Right Loop noCT noRSZ`,
].map(async name => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  /* if (name === `Elements - Energy 023 Projectile Right Loop noCT noRSZ`) {
    document.body.appendChild(canvas);
    canvas.style.position = `absolute`;
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = `${tileSize}px`;
    canvas.style.height = `${tileSize}px`;
    canvas.style.zIndex = `100`;
  } */

  const v = document.createElement('video');
  v.setAttribute('muted', '');
  v.setAttribute('crossorigin', 'Anonymous');
  v.src = `https://webaverse.github.io/assets/fx/${name}.webm`;
  
  // v.currentTime = 0;
  await new Promise((accept, reject) => {
    const loadedmetadata = e => {
      accept();
      v.removeEventListener('loadedmetadata', loadedmetadata);
    };
    v.addEventListener('loadedmetadata', loadedmetadata);
  });
  
  const totalLength = v.duration;
  
  let i = 0;
  // let first = true;
  for (let row = 0; row < numTilesPerRow; row++) {
    for (let col = 0; col < numTilesPerRow; col++) {
      v.currentTime = (i+1)/numTiles * totalLength;
      // v.load();
      
      // console.log('check ready state', v.readyState);
      if (v.readyState < v.HAVE_CURRENT_DATA) {
        await new Promise((accept, reject) => {
          const seeked = e => {
            if (v.readyState >= v.HAVE_CURRENT_DATA) {
              accept();
              v.removeEventListener('seeked', seeked);
            }
          };
          v.addEventListener('seeked', seeked);
        });
      }

      // console.log('ok', v.currentTime/totalLength, v.duration);
      
      ctx.drawImage(v, col * tileSize, row * tileSize, tileSize, tileSize);
      
      i++;
    }
  }
  // console.log('done');

  return canvas;
})).then(([hitCanvas, bulletCanvas]) => {
  hitFxMaterial.uniforms.uTex.value.image = hitCanvas;
  hitFxMaterial.uniforms.uTex.value.needsUpdate = true;
  hitMesh = new THREE.Mesh(hitFxGeometry, hitFxMaterial);
  hitMesh.frustumCulled = false;
  scene.add(hitMesh);

  bulletFxMaterial.uniforms.uTex.value.image = bulletCanvas;
  bulletFxMaterial.uniforms.uTex.value.needsUpdate = true;
  bulletMesh = new THREE.Mesh(bulletFxGeometry, bulletFxMaterial);
  bulletMesh.frustumCulled = false;
  scene.add(bulletMesh);
});

const _updateEffects = () => {
  let numHitFx = 0;
  let numBulletFx = 0;
  if (effects.length > 0) {
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];

      let geometry, index;
      if (effect.fxType === 'bullet') {
        effect.position.add(new THREE.Vector3(0, 0, -bulletSpeed).applyQuaternion(effect.quaternion));
        effect.updateMatrixWorld();
        
        const line = new THREE.Line3(
          effect.position.clone(),
          effect.position.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(effect.quaternion))
        );
        const closestPoint = line.closestPointToPoint(camera.position, false, new THREE.Vector3());
        const normal = camera.position.clone().sub(closestPoint).normalize();
        
        effect.matrixWorld
          .decompose(localVector, localQuaternion, localVector2);
        localMatrix
          .compose(localVector, localQuaternion.set(0, 0, 0, 1), localVector2)
          .multiply(
            localMatrix2.lookAt(
              effect.position,
              effect.position.clone().sub(normal),
              new THREE.Vector3(0, 0, -1).applyQuaternion(effect.quaternion)
                .cross(normal)
            )
          );

        geometry = bulletFxGeometry;
        index = numBulletFx++;
      } else {
        effect.updateMatrixWorld();
        localMatrix.copy(effect.matrixWorld);
        geometry = hitFxGeometry;
        index = numHitFx++;
      }
      const planeGeometryClone = planeGeometry.clone()
        .applyMatrix4(localMatrix);

      geometry.attributes.position.array.set(planeGeometryClone.attributes.position.array, index * planeGeometryClone.attributes.position.array.length);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.uv.array.set(planeGeometryClone.attributes.uv.array, index * planeGeometryClone.attributes.uv.array.length);
      geometry.attributes.uv.needsUpdate = true;
      geometry.attributes.epochStartTime.array.fill(effect.epochStartTime, index * planeGeometryClone.attributes.position.array.length/3, (index+1) * planeGeometryClone.attributes.position.array.length/3);
      geometry.attributes.epochStartTime.needsUpdate = true;
      geometry.attributes.speed.array.fill(effect.speed, index * planeGeometryClone.attributes.position.array.length/3, (index+1) * planeGeometryClone.attributes.position.array.length/3);
      geometry.attributes.speed.needsUpdate = true;
      for (let j = 0; j < planeGeometryClone.index.array.length; j++) {
        geometry.index.array[index*planeGeometryClone.index.array.length + j] = planeGeometryClone.index.array[j] + index*planeGeometryClone.attributes.position.array.length/3;
      }
      geometry.index.needsUpdate = true;
    }
  }
  
  const now = Date.now();

  hitFxGeometry.setDrawRange(0, numHitFx * planeGeometry.index.array.length);
  hitMesh.visible = numHitFx > 0;
  hitMesh.material.uniforms.uEpochTime.value = now - epochStartTime;
  hitMesh.material.uniforms.uEpochTime.needsUpdate = true;

  bulletFxGeometry.setDrawRange(0, numBulletFx * planeGeometry.index.array.length);
  bulletMesh.visible = numBulletFx > 0;
  bulletMesh.material.uniforms.uEpochTime.value = now - epochStartTime;
  bulletMesh.material.uniforms.uEpochTime.needsUpdate = true;
};
const _makeEffect = (fxType, effect) => {
  effect.fxType = fxType;
  const now = Date.now();
  effect.epochStartTime = now - epochStartTime;
  effect.endTime = fxType === 'bullet' ? (now + bulletTimeout) : (now + speed);
  effect.speed = speed;
  return effect;
};
const fx = {
  add(fxType, effect) {
    effect = _makeEffect(fxType, effect);
    effects.push(effect);
  },
  remove(effect) {
    effects.splice(effects.indexOf(effect), 1);
  },
  update() {
    if (hitMesh && bulletMesh) {
      if (effects.length > 0) {
        const now = Date.now();
        const newEffects = [];
        effects = effects.filter(effect => {
          if (now < effect.endTime) {
            if (effect.fxType === 'bullet') {
              let collision = physicsManager.raycast(effect.position, effect.quaternion);
              if (collision && localVector.fromArray(collision.point).distanceTo(effect.position) <= bulletSpeed) {
                let newEffect = new THREE.Object3D();
                newEffect.position.fromArray(collision.point);
                newEffect.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), localVector.fromArray(collision.normal));
                newEffect = _makeEffect('hit', newEffect);
                newEffects.push(newEffect);
                return false;
              } else {
                return true;
              }
            } else {
              return true;
            }
          } else {
            return false;
          }
        });
        effects = effects.concat(newEffects);
      }
      window.effects = effects;
      _updateEffects();
    }
  },
};
export default fx;