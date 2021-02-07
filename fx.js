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



const v = document.createElement('video');
v.setAttribute('muted', '');
// v.setAttribute('loop', '');
v.src = './rtfx/2. Prerendered animations/FX elements/Elements - Electricity 036 Explosion Right MIX noCT noRSZ.webm';
window.v = v;
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
  let i = 0;
  let first = true;
  for (let row = 0; row < numTilesPerRow; row++) {
    for (let col = 0; col < numTilesPerRow; col++) {
      v.currentTime = i/(numTiles-1);
      // v.load();
      
      console.log('check ready state', v.readyState);
      if (v.readyState < v.HAVE_CURRENT_DATA) {
        if (first) {
          await new Promise((accept, reject) => {
            const loadeddata = e => {
              if (v.readyState >= v.HAVE_CURRENT_DATA) {
                accept();
                v.removeEventListener('loadeddata', loadeddata);
              }
            };
            v.addEventListener('loadeddata', loadeddata);
          });
          first = false;
        } else {
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
      }

      console.log('ok', v.currentTime);
      
      i++;
    }
  }
  console.log('done');
})();