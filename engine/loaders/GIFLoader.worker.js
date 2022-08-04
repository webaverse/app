import * as GifuctJs from './gifuct-js.js';

const _createGif = async ({
  url,
}) => {
  for (let i = 0; i < 10; i++) {
    try {
      const u = url;
      const res = await fetch(u, {
        mode: 'cors',
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > 0) {
          const gif = await GifuctJs.parseGIF(ab);
          const frames = await GifuctJs.decompressFrames(gif, true);
          // console.log('got frames', {ab, frames});
          const {width, height} = frames[0].dims;

          let worldWidth = width;
          let worldHeight = height;
          if (worldWidth >= worldHeight) {
            worldHeight /= worldWidth;
            worldWidth = 1;
          }
          if (worldHeight >= worldWidth) {
            worldWidth /= worldHeight;
            worldHeight = 1;
          }
          /* const geometry = new THREE.PlaneBufferGeometry(worldWidth, worldHeight);
          geometry.boundingBox = new THREE.Box3(
            new THREE.Vector3(-worldWidth/2, -worldHeight/2, -0.1),
            new THREE.Vector3(worldWidth/2, worldHeight/2, 0.1),
          );
          const colors = new Float32Array(geometry.attributes.position.array.length);
          colors.fill(1, 0, colors.length);
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); */

          // user canvas
          const c = new OffscreenCanvas(width, height);
          const ctx = c.getContext('2d');
          
          // gif patch canvas
          const tempCanvas = new OffscreenCanvas(width, height);
          const tempCtx = tempCanvas.getContext('2d');
          // full gif canvas
          const gifCanvas = new OffscreenCanvas(width, height);
          const gifCtx = gifCanvas.getContext('2d');
          
          // let playing = false;
          let bEdgeDetect = false;
          let bInvert = false;
          let bGrayscale = false;
          let pixelPercent = 100;
          let loadedFrames;
          let frameIndex;
          let frameImageData;
          function renderGIF(frames) {
            loadedFrames = frames
            frameIndex = 0

            c.width = frames[0].dims.width
            c.height = frames[0].dims.height

            gifCanvas.width = c.width
            gifCanvas.height = c.height

            /* if (!playing) {
              playpause()
            } */
          }
          function drawPatch(frame) {
            var dims = frame.dims

            if (
              !frameImageData ||
              dims.width != frameImageData.width ||
              dims.height != frameImageData.height
            ) {
              tempCanvas.width = dims.width
              tempCanvas.height = dims.height
              frameImageData = tempCtx.createImageData(dims.width, dims.height)
            }

            // set the patch data as an override
            frameImageData.data.set(frame.patch)

            // draw the patch back over the canvas
            tempCtx.putImageData(frameImageData, 0, 0)

            gifCtx.drawImage(tempCanvas, dims.left, dims.top)
          }
          var edge = function(data, output) {
            var odata = output.data
            var width = gif.lsd.width
            var height = gif.lsd.height

            var conv = [-1, -1, -1, -1, 8, -1, -1, -1, -1]
            var halfside = Math.floor(3 / 2)

            for (var y = 0; y < height; y++) {
              for (var x = 0; x < width; x++) {
                var r = 0,
                  g = 0,
                  b = 0
                for (var cy = 0; cy < 3; cy++) {
                  for (var cx = 0; cx < 3; cx++) {
                    var scy = y - halfside + cy
                    var scx = x - halfside + cx

                    if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
                      var src = (scy * width + scx) * 4
                      var f = cy * 3 + cx
                      r += data[src] * conv[f]
                      g += data[src + 1] * conv[f]
                      b += data[src + 2] * conv[f]
                    }
                  }
                }

                var i = (y * width + x) * 4
                odata[i] = r
                odata[i + 1] = g
                odata[i + 2] = b
                odata[i + 3] = 255
              }
            }

            return output
          }
          var invert = function(data) {
            for (var i = 0; i < data.length; i += 4) {
              data[i] = 255 - data[i] // red
              data[i + 1] = 255 - data[i + 1] // green
              data[i + 2] = 255 - data[i + 2] // blue
              data[i + 3] = 255
            }
          }
          var grayscale = function(data) {
            for (var i = 0; i < data.length; i += 4) {
              var avg = (data[i] + data[i + 1] + data[i + 2]) / 3
              data[i] = avg // red
              data[i + 1] = avg // green
              data[i + 2] = avg // blue
              data[i + 3] = 255
            }
          }
          function manipulate() {
            var imageData = gifCtx.getImageData(0, 0, gifCanvas.width, gifCanvas.height)
            var other = gifCtx.createImageData(gifCanvas.width, gifCanvas.height)

            if (bEdgeDetect) {
              imageData = edge(imageData.data, other)
            }

            if (bInvert) {
              invert(imageData.data)
            }

            if (bGrayscale) {
              grayscale(imageData.data)
            }

            // do pixelation
            var pixelsX = 5 + Math.floor((pixelPercent / 100) * (c.width - 5))
            var pixelsY = (pixelsX * c.height) / c.width

            if (pixelPercent != 100) {
              ctx.mozImageSmoothingEnabled = false
              ctx.webkitImageSmoothingEnabled = false
              ctx.imageSmoothingEnabled = false
            }

            ctx.putImageData(imageData, 0, 0)
            ctx.drawImage(c, 0, 0, c.width, c.height, 0, 0, pixelsX, pixelsY)
            ctx.drawImage(c, 0, 0, pixelsX, pixelsY, 0, 0, c.width, c.height)
          }
          async function renderFrame() {
            // get the frame
            var frame = loadedFrames[frameIndex]

            // var start = new Date().getTime()
            
            if (frame.disposalType ===  2) {
              gifCtx.clearRect(0, 0, c.width, c.height)
            }

            // draw the patch
            drawPatch(frame)

            // perform manipulation
            manipulate()

            // update the frame index
            frameIndex++
            if (frameIndex >= loadedFrames.length) {
              frameIndex = 0
            }
            
            const imageBitmap = await createImageBitmap(c);
            return imageBitmap;

            /* var end = new Date().getTime()
            var diff = end - start

            if (playing) {
              // delay the next gif frame
              setTimeout(function() {
                requestAnimationFrame(renderFrame)
                //renderFrame();
              }, Math.max(0, Math.floor(frame.delay - diff)))
            } */
          }
          async function renderFrames() {
            const results = Array(loadedFrames.length);
            for (let i = 0; i < loadedFrames.length; i++) {
              results[i] = await renderFrame();
            }
            return results;
          }
          renderGIF(frames);
          return {
            renderFrame,
            renderFrames,
          };
        } else {
          throw new Error('failed to load image to to empty data: ' + u);
        }
      } else {
        throw new Error('failed to load image: ' + res.status + ': ' + u);
      }
    } catch (err) {
      console.warn(err.stack);
    }
  }
  throw new Error('failed to load image: ' + res.status + ': ' + u);
};
const gifs = {};
let nextGifId = 0;
const _handleMessage = async message => {
  const {method, args} = message;
  switch (method) {
    case 'createGif': {
      // console.log('worker got create gif');
      const {url} = args;
      const gifId = ++nextGifId;
      const gif = await _createGif({
        url,
      });
      gifs[gifId] = gif;
      return [
        gifId,
        [],
      ];
      break;
    }
    case 'renderFrame': {
      const {gifId} = args;
      const gif = gifs[gifId];
      if (gif) {
        const frame = await gif.renderFrame();
        // console.log('got frame', frame);
        return [
          frame,
          [frame],
        ];
      } else {
        throw new Error('renderFrame called for non-existent gif: ' + gifId);
      }
      // console.log('worker got render frame', {gifId});
      break;
    }
    case 'renderFrames': {
      const {gifId} = args;
      const gif = gifs[gifId];
      if (gif) {
        const frames = await gif.renderFrames();
        // console.log('got frame', frame);
        return [
          frames,
          frames,
        ];
      } else {
        throw new Error('renderFrame called for non-existent gif: ' + gifId);
      }
      // console.log('worker got render frame', {gifId});
      break;
    }
    case 'destroyGif': {
      const {gifId} = args;
      const gif = gifs[gifId];
      if (gif) {
        delete gifs[gifId];
        return [
          null,
          [],
        ];
      } else {
        throw new Error('destroyGif called for non-existent gif: ' + gifId);
      }
      break;
    }
    default: {
      throw new Error('unknown method: ' + method);
      break;
    }
  }
};
const _runAndHandleMessage = async message => {
  running = true;
  const {id} = message;
  let error = null;
  let result = null;
  let transfers;
  try {
    const spec = await _handleMessage(message);
    result = spec[0];
    transfers = spec[1];
  } catch (err) {
    error = err;
  }
  self.postMessage({
    id,
    error,
    result,
  }, []);
  running = false;
  
  if (queue.length > 0) {
    _runAndHandleMessage(queue.shift());
  }
};

const queue = [];
let running = false;
self.addEventListener('message', async e => {
  // console.log('worker got message event', e);
  const message = e.data;
  if (!running) {
    await _runAndHandleMessage(message);
  } else {
    queue.push(message);
  }
});