/* eslint-disable no-useless-escape */
import {storageHost, inappPreviewHost, inappPreviewHostDev} from './constants';
import {makeId} from './util';

const queue = [];
let running = false;
const useDev = false;

export const generatePreview = async (url, ext, type, width, height, resolve, reject) => {
  const previewHost = useDev ? inappPreviewHostDev : inappPreviewHost;
  running = true;
  // check for existing iframe
  var iframe = document.querySelector(`iframe[src^="${previewHost}/screenshot.html"]`);

  // else create new iframe
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.width = '0px';
    iframe.height = '0px';
    document.body.appendChild(iframe);
  }

  // check either first param is url or hash
  if (!isValidURL(url)) {
    url = `${storageHost}/ipfs/${url}`;
  }

  // create URL
  var ssUrl = `${previewHost}/screenshot.html?url=${url}&ext=${ext}&type=${type}&width=${width}&height=${height}`;

  // set src attr for iframe
  iframe.src = ssUrl;
  console.log('Preview generation in progress for ', ssUrl);
  // event listener for postMessage from screenshot.js
  const rejection = setTimeout(() => {
    reject('Preview Server Timed Out');
    running = false;
    if (queue.length > 0) {
      const {url, ext, type, width, height, resolve, reject} = queue.shift();
      generatePreview(url, ext, type, width, height, resolve, reject);
    }
  }, 30 * 1000);

  var f = function(event) {
    if (event.data.method === 'result') {
      console.log('Preview generation result ', event.data.result);
      window.removeEventListener('message', f, false);
      let blob;
      if (type === 'webm') {
        blob = new Blob([event.data.result], {
          type: `video/${type}`,
        });
      } else {
        blob = new Blob([event.data.result], {
          type: `image/${type}`,
        });
      }
      clearTimeout(rejection);
      resolve({
        blob: blob,
        url: URL.createObjectURL(blob),
      });
      running = false;
      if (queue.length > 0) {
        const {url, ext, type, width, height, resolve, reject} = queue.shift();
        generatePreview(url, ext, type, width, height, resolve, reject);
      }
    }
  };
  window.addEventListener('message', f);
};

// URL validate function
function isValidURL(string) {
  var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null);
}

export const preview = async (url, ext, type, width, height) => {
  return new Promise((resolve, reject) => {
    if (!running) {
      generatePreview(url, ext, type, width, height, resolve, reject);
    } else {
      queue.push({url, ext, type, width, height, resolve, reject});
    }
  });
};
