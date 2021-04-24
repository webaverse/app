import WaveSurfer from './wavesurfer.js';
import {parseQuery} from './util.js';
import {storageHost} from './constants.js';

(async () => {
  const container = document.getElementById('container');

  const _setContainerContent = el => {
    container.innerHTML = '';
    container.appendChild(el);
  };
  const handlers = {
    'png': async ({
      hash,
    }) => {
      const img = new Image();
      img.classList.add('img');
      _setContainerContent(img);
      await new Promise((accept, reject) => {
        img.onload = () => {
          accept();
        };
        img.onerror = reject;
        img.src = `${storageHost}/ipfs/${hash}`;
      });
    },
    'html': async ({
      hash,
    }) => {
      const iframe = document.createElement('iframe');
      iframe.classList.add('iframe');
      _setContainerContent(iframe);
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
})();