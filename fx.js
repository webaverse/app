import * as THREE from './three.module.js';
import {scene, camera} from './app-object.js';
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

let hitMesh, bulletMesh;
const loadPromise = Promise.all([
  `Elements - Sparks 104 Hit Radial noCT noRSZ`,
  `Elements - Fire 004 Projectile Right Loop noCT noRSZ`,
].map(async name => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  /* if (name === `Elements - Sparks 104 Hit Radial noCT noRSZ`) {
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
  v.src = `./rtfx/2. Prerendered animations/FX elements/webm/${name}.webm`;
  
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

  bulletFxMaterial.uniforms.uTex.value.image = hitCanvas;
  bulletFxMaterial.uniforms.uTex.value.needsUpdate = true;
  bulletMesh = new THREE.Mesh(bulletFxGeometry, bulletFxMaterial);
  bulletMesh.frustumCulled = false;
  scene.add(bulletMesh);
});

const _updateEffects = () => {
  if (effects.length > 0) {
    let indexIndex = 0;
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];

      if (effect.fxType === 'bullet') {
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
      } else {
        localMatrix.copy(effect.matrixWorld);
      }
      const planeGeometryClone = planeGeometry.clone()
        .applyMatrix4(localMatrix);

      hitFxGeometry.attributes.position.array.set(planeGeometryClone.attributes.position.array, i * planeGeometryClone.attributes.position.array.length);
      hitFxGeometry.attributes.position.needsUpdate = true;
      hitFxGeometry.attributes.uv.array.set(planeGeometryClone.attributes.uv.array, i * planeGeometryClone.attributes.uv.array.length);
      hitFxGeometry.attributes.uv.needsUpdate = true;
      hitFxGeometry.attributes.epochStartTime.array.fill(effect.epochStartTime, i * planeGeometryClone.attributes.position.array.length/3, (i+1) * planeGeometryClone.attributes.position.array.length/3);
      hitFxGeometry.attributes.epochStartTime.needsUpdate = true;
      hitFxGeometry.attributes.speed.array.fill(effect.speed, i * planeGeometryClone.attributes.position.array.length/3, (i+1) * planeGeometryClone.attributes.position.array.length/3);
      hitFxGeometry.attributes.speed.needsUpdate = true;
      for (let j = 0; j < planeGeometryClone.index.array.length; j++) {
        hitFxGeometry.index.array[indexIndex++] = planeGeometryClone.index.array[j] + i*planeGeometryClone.attributes.position.array.length/3;
      }
      hitFxGeometry.index.needsUpdate = true;
    }
    hitFxGeometry.setDrawRange(0, effects.length * planeGeometry.index.array.length);
  }
};
const fx = {
  add(fxType, effect) {
    effect.updateMatrixWorld();
    effect.fxType = fxType;
    const now = Date.now();
    effect.epochStartTime = now - epochStartTime;
    effect.endTime = now + speed;
    effect.speed = speed;
    effects.push(effect);
    // _updateEffects();
  },
  remove(effect) {
    effects.splice(effects.indexOf(effect), 1);
    // _updateEffects();
  },
  update() {
    if (hitMesh) {
      if (effects.length > 0) {
        const now = Date.now();
        let changed = false;
        effects = effects.filter(effect => {
          if (now < effect.endTime) {
            return true;
          } else {
            changed = true;
            return false;
          }
        });
        _updateEffects();

        hitMesh.material.uniforms.uEpochTime.value = now - epochStartTime;
        hitMesh.material.uniforms.uEpochTime.needsUpdate = true;
        // hitMesh.material.uniforms.uTileOffset.needsUpdate = true;
        hitMesh.visible = true;
      } else {
        hitMesh.visible = false;
      }
    }
  },
};
export default fx;