const imageSize = [1024, 2048];
const decalSize = 350;
const offset = [Math.floor((imageSize[0] - decalSize)/2), 325];

(async () => {
  const fs = require('fs');
  const stream = require('stream');
  const sharp = require('sharp');
  const {createCanvas, loadImage} = require('canvas');

  const backgroundImage = await loadImage('./shirt.png');

  const s = fs.readFileSync('./loot.json', 'utf8');
  const j = JSON.parse(s);
  const tokenUris = j;
  for (let i = 1; i <= tokenUris.length; i++) {
    const tokenUri = tokenUris[i-1];
    const match = tokenUri.match(/^data:application\/json;base64,(.+)$/);
    if (match) {
      const base64 = match[1];
      const s = Buffer.from(base64, 'base64').toString('utf8');
      const j = JSON.parse(s);
      const {image} = j;
      const match2 = image.match(/^data:image\/svg\+xml;base64,(.+)$/);
      if (match2) {
        const base64 = match2[1];
        let b = Buffer.from(base64, 'base64');
        let s = b.toString('utf8');
        s = s.replace(/^(<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg")/, '$1');
        b = Buffer.from(s);
        console.log('got ' + i + ': ' + s);
        
        const p = `./shirt/${i}.png`;
        {
          const ts = sharp()
            .png();
          ts.on('error', err => {
            console.warn(err.stack);
          });
          const rs = new stream.PassThrough();
          rs.end(b);
          const ws = fs.createWriteStream(p);
          rs
            .pipe(ts)
            .pipe(ws);
          await new Promise((accept, reject) => {
            ws.on('finish', accept);
            ws.on('error', reject);
          });
        }
        const p2 = `./shirt2/${i}.png`;
        const canvas = createCanvas(imageSize[0], imageSize[1]);
        const ctx = canvas.getContext('2d');
        const imageData = await (async () => {
          const img = await loadImage(p);
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, decalSize, decalSize);
          const imageData = ctx.getImageData(0, 0, decalSize, decalSize);
          /* for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i+3] = 255 - imageData.data[i];
          } */
          return imageData;
        })();
        {
          ctx.drawImage(backgroundImage, 0, 0);
          // ctx.putImageData(imageData, 0, 0);
          const canvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
              const a = imageData.data[x * 4 + (y * imageData.width * 4)]/255;
              for (let z = 0; z < 3; z++) {
                canvasImageData.data[(offset[0] + x) * 4 + ((offset[1] + y) * canvas.width * 4) + z] =
                  a*imageData.data[x * 4 + (y * imageData.width * 4) + z] +
                  (1-a)*canvasImageData.data[(offset[0] + x) * 4 + ((offset[1] + y) * canvas.width * 4) + z];
              }
              // canvasImageData.data[(offset[0] + x) * 4 + ((offset[1] + y) * canvas.width * 4) + 3] = 255;
            }
          }
          ctx.putImageData(canvasImageData, 0, 0);
          
          // ctx.putImageData(imageData, );
          const rs = canvas.createPNGStream();
          rs.on('error', err => {
            console.warn(err.stack);
          });
          const ws = fs.createWriteStream(p2);
          // console.log('ok 1');
          rs.pipe(ws);
          await new Promise((accept, reject) => {
            ws.on('finish', accept);
            ws.on('error', err => {
              console.warn(err.stack);
              reject(err);
            });
          });
          // console.log('ok 2');
        }
        
        // const j = JSON.parse(s);
        // const {image} = j;
        /* sharp('input.jpg')
          .rotate()
          .resize(200)
          .jpeg({ mozjpeg: true })
          .toBuffer()
          .then( data => { ... })
          .catch( err => { ... }); */
      } else {
        console.log(image, /^data:image\/svg+xml;base64,(.+)$/.test(image));
        throw new Error('failed to parse');
      }
    } else {
      throw new Error('failed to parse');
    }
  }
})();
