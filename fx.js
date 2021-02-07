import * as THREE from './three.module.js';
import {scene} from './app-object.js';

const size = 2048;
const tileSize = 512;
const numTilesPerRow = size/tileSize;
const numTiles = numTilesPerRow ** 2;

const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d');
/* document.body.appendChild(canvas);
canvas.style.position = `absolute`;
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.width = `${tileSize}px`;
canvas.style.height = `${tileSize}px`;
canvas.style.zIndex = `100`; */

const v = document.createElement('video');
v.setAttribute('muted', '');
// v.setAttribute('loop', '');
const name = `Elements - Sparks 104 Hit Radial noCT noRSZ`;
v.src = `./rtfx/2. Prerendered animations/FX elements/webm/${name}.webm`;
// window.v = v;
// v.load();
// v.play();
/* v.addEventListener('seeking', e => {
  console.log('seeking', e);
}); */
/* v.addEventListener('seeked', e => {
  console.log('seeked', e);
});
v.addEventListener('waiting', e => {
  console.log('waiting', e);
}); */

const planeGeometry = new THREE.PlaneBufferGeometry(1, 1);
const fxGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(1024*1024);
const uvs = new Float32Array(1024*1024);
const indices = new Uint32Array(1024*1024);
fxGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
fxGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
fxGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
const effects = [];
const fxMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTex: {
      type: 't',
      value: new THREE.Texture(canvas),
      needsUpdate: true,
    },
    /* uTexSize: {
      type: 'f',
      value: size,
      needsUpdate: true,
    }, */
    uTileSize: {
      type: 'f',
      value: 1/numTilesPerRow,
      needsUpdate: true,
    },
    uTileOffset: {
      type: 'v2',
      value: new THREE.Vector2(0, 0),
      needsUpdate: true,
    },
  },
  vertexShader: `\
    precision highp float;
    precision highp int;

    uniform float uTileSize;
    uniform vec2 uTileOffset;

    varying vec2 vUv;

    void main() {
      vUv = uv;
      vUv.x *= uTileSize;
      vUv.y = 1.0 - (1.0 - vUv.y) * uTileSize;
      vUv += uTileOffset;

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
      if (diffuse.a > 0.1) {
        gl_FragColor = diffuse;
      } else {
        discard;
      }
    }
  `,
  side: THREE.DoubleSide,
  transparent: true,
  // polygonOffset: true,
  // polygonOffsetFactor: -1,
  // polygonOffsetUnits: 1,
});

let mesh = null;
(async () => {
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

  mesh = new THREE.Mesh(fxGeometry, fxMaterial);
  mesh.frustumCulled = false;
  scene.add(mesh);
  fxMaterial.uniforms.uTex.value.needsUpdate = true;
})();

const _updateEffects = () => {
  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    const planeGeometryClone = planeGeometry.clone()
      .applyMatrix4(effect.matrixWorld);

    fxGeometry.attributes.position.array.set(planeGeometryClone.attributes.position.array, i * planeGeometryClone.attributes.position.array.length);
    fxGeometry.attributes.position.needsUpdate = true;
    fxGeometry.attributes.uv.array.set(planeGeometryClone.attributes.uv.array, i * planeGeometryClone.attributes.uv.array.length);
    fxGeometry.attributes.uv.needsUpdate = true;
    fxGeometry.index.array.set(planeGeometryClone.index.array, i * planeGeometryClone.index.array.length);
    fxGeometry.index.needsUpdate = true;
  }
  fxGeometry.setDrawRange(0, planeGeometry.index.array.length);
};
const fx = {
  add(effect) {
    effect.updateMatrixWorld();
    effects.push(effect);
    _updateEffects();
  },
  remove(effect) {
    effects.splice(effects.indexOf(effect), 1);
    _updateEffects();
  },
  update() {
    if (mesh) {
      if (effects.length > 0) {
        const speed = 500;
        const time = (Date.now()%speed)/speed;
        const tile = Math.floor(time*numTiles)%numTiles;
        const col = tile % numTilesPerRow;
        const row = Math.floor(tile / numTilesPerRow);
        // mesh.material.uniforms.uTileSize.value = 1;
        // mesh.material.uniforms.uTileSize.needsUpdate = true;
        // console.log('got col row', time, tile, col, row);
        mesh.material.uniforms.uTileOffset.value.set(
          col / numTilesPerRow,
          row / numTilesPerRow
        );
        mesh.material.uniforms.uTileOffset.needsUpdate = true;
        mesh.visible = true;
      } else {
        mesh.visible = false;
      }
    }
  },
};
export default fx;