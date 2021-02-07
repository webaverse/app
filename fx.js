import * as THREE from './three.module.js';

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
v.src = `./rtfx/2. Prerendered animations/FX elements/${name}.webm`;
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
  let first = true;
  for (let row = 0; row < numTilesPerRow; row++) {
    for (let col = 0; col < numTilesPerRow; col++) {
      v.currentTime = i/(numTiles-1) * totalLength;
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
})();