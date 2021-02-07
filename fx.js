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
document.body.appendChild(canvas);
canvas.style.position = `absolute`;
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.width = `${tileSize}px`;
canvas.style.height = `${tileSize}px`;
canvas.style.zIndex = `100`;

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

    // uniform vec3 uUserPosition;
    
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;
    
    uniform sampler2D uTex;
    uniform float uTileSize;
    uniform vec2 uTileOffset;
    
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      uv.x *= uTileSize;
      uv.y = 1.0 - (1.0 - uv.y) * uTileSize;
      uv += uTileOffset;
      vec4 diffuse = texture2D(uTex, uv);
      gl_FragColor = diffuse;
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

  const geometry = new THREE.PlaneBufferGeometry(1, 1);
  mesh = new THREE.Mesh(geometry, fxMaterial);
  mesh.position.y = 1;
  scene.add(mesh);
  fxMaterial.uniforms.uTex.value.needsUpdate = true;
})();

const fx = {
  update() {
    if (mesh) {
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
    }
  },
};
export default fx;