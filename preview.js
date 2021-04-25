// import WaveSurfer from './wavesurfer.js';
import extractPeaks from './webaudio-peaks.js';
import {parseQuery} from './util.js';
import {storageHost} from './constants.js';

window.onload = async () => {
  const container = document.getElementById('container');

  const _hashToSrc = hash => `${storageHost}/ipfs/${hash}`;
  const _setContainerContent = el => {
    container.innerHTML = '';
    if (el) {
      container.appendChild(el);
    }
  };
  const handlers = {
    'png': async ({
      hash,
    }) => {
      const img = new Image();
      img.classList.add('content');
      img.classList.add('img');
      _setContainerContent(img);
      const src = _hashToSrc(hash);
      await new Promise((accept, reject) => {
        img.onload = () => {
          accept();
        };
        img.onerror = reject;
        img.src = src;
      });
    },
    'mp4': async ({
      hash,
    }) => {
      const video = document.createElement('video');
      video.classList.add('content');
      video.classList.add('video');
      video.setAttribute('controls', true);
      video.setAttribute('autoplay', true);
      video.setAttribute('muted', true);
      // window.video = video;
      _setContainerContent(video);
      const src = _hashToSrc(hash);
      await new Promise((accept, reject) => {
        video.oncanplaythrough = () => {
          accept();
        };
        video.onerror = reject;
        video.src = src;
      });
    },
    'mp3': async ({
      hash,
    }) => {
      _setContainerContent(null);
      const src = _hashToSrc(hash);
      
      const [
        audioData,
        audio,
      ] = await Promise.all([
        (async () => {
          const res = await fetch(src);
          return await res.arrayBuffer();
        })(),
        (async () => {
          const audio = new Audio();
          audio.classList.add('content');
          audio.classList.add('audio');
          audio.setAttribute('controls', true);
          await new Promise((accept, reject) => {
            audio.oncanplaythrough = () => {
              accept();
            };
            audio.onerror = reject;
            audio.src = src;
          });
          return audio;
        })(),
      ]);
      
      
      const canvas = document.createElement('canvas');
      const width = window.innerWidth;
      const height = window.innerHeight / 2;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.cssText = `width: ${width}px; height: ${height}px;`;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#333';
      _setContainerContent(canvas);
      
      const blocker = document.createElement('div');
      blocker.classList.add('blocker');
      blocker.style.cssText = `position: absolute; top: 0; bottom: 0; left: 0; width: ${window.innerWidth}px; transform-origin: 0 50%;`;
      container.appendChild(blocker);
      
      const _setX = x => {
        blocker.style.transform = `translateX(${x * window.innerWidth}px)`;
      };
      
      canvas.addEventListener('click', e => {
        const boundingBox = canvas.getBoundingClientRect();
        const x = (e.clientX - boundingBox.x) / boundingBox.width;
        const y = (e.clientY - boundingBox.y) / boundingBox.height;
        console.log('got x y', x, y);
        _setX(x);
      });
      
      const audioCtx = new AudioContext();
      //decode an ArrayBuffer into an AudioBuffer
      audioCtx.decodeAudioData(audioData, decodedData => {
        //calculate peaks from an AudioBuffer
        const peaks = extractPeaks(decodedData, 10000, true);
        
        console.log('got peaks', peaks);
        
        const _samplePeakAt = f => {
          const peakIndexTarget = f * peaks.length;
          let peakIndex = Math.floor(peakIndexTarget);
          const peakIndexRemainder = peakIndexTarget - peakIndex;
          
          if (peakIndex === peaks.length - 1) {
            peakIndex--;
          }
          
          const startPeak = peaks.data[0][peakIndex];
          const endPeak = peaks.data[0][peakIndex + 1];
          let v = startPeak * (1 - peakIndexRemainder) + endPeak * peakIndexRemainder;
          v /= 128;
          v = Math.abs(v);
          return v;
        };
        const numBars = 256;
        const barWidth = 2 / canvas.width * numBars;
        const fullBarsWidth = numBars * (barWidth + 2);
        for (let i = 0; i < numBars; i++) {
          const v = _samplePeakAt(i / numBars);
          ctx.fillRect(i * (barWidth + 2) * canvas.width / fullBarsWidth, (1-v) * canvas.height / 2, 2 * canvas.width / fullBarsWidth, v * canvas.height);
        }
      });
      
      /* const wavesurfer = WaveSurfer.create({
        container,
        waveColor: '#A8DBA8',
        progressColor: '#3B8686',
        // backend: 'MediaElement',
      });
      wavesurfer.on('ready', () => {
        console.log('surfer play');
        window.addEventListener('click', e => {
          wavesurfer.play();
        });
      });
      wavesurfer.on('error', err => {
        console.warn(err);
      });
      const result = wavesurfer.load(`${storageHost}/${hash}/preview.mp3`);
      window.wavesurfer = wavesurfer;
      console.log('wave surfer load', result); */
      
      /* const audio = new Audio();
      audio.classList.add('content');
      audio.classList.add('audio');
      audio.setAttribute('controls', true);
      _setContainerContent(audio);
      await new Promise((accept, reject) => {
        audio.oncanplaythrough = () => {
          accept();
        };
        audio.onerror = reject;
        audio.src = src;
      }); */
    },
    'html': async ({
      hash,
    }) => {
      const iframe = document.createElement('iframe');
      iframe.classList.add('content');
      iframe.classList.add('iframe');
      _setContainerContent(iframe);
      const src = _hashToSrc(hash);
      await new Promise((accept, reject) => {
        iframe.onload = () => {
          accept();
        };
        iframe.onerror = reject;
        iframe.src = src;
      });
    },
  };

  const q = parseQuery(window.location.search);
  const {hash, ext} = q;
  
  container.innerHTML = 'Loading preview:<br>' + JSON.stringify(q, null, 2);
  
  const handler = handlers[ext];
  if (handler) {
    await handler({
      hash,
    });
  } else {
    throw new Error('unknown extension: ' + ext);
  }
};