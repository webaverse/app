/* eslint-disable no-useless-escape */
import {storageHost, inappPreviewHost} from './constants';

const queue = [];
let running = false;
let resolve, reject;
let rejectionTimeout = null;

const next = () => {
  /** Unshift the queue to generate the next preview */
  const {url, type, width, height, resolve, reject} = queue.shift();
  generatePreview(url, type, width, height, resolve, reject);
};

export const generatePreview = async (url, type, width, height, _resolve, _reject) => {
  resolve = _resolve;
  reject = _reject;

  const previewHost = inappPreviewHost;
  running = true;
  // check for existing iframe
  let iframe = document.querySelector(`iframe[src^="${previewHost}/screenshot.html"]`);

  // else create new iframe
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.width = '0px';
    iframe.height = '0px';
    document.body.appendChild(iframe);
  }

  // check either first param is url or hash
  /* if (!isValidURL(url)) {
    throw new Error('Invalid URL: ' + url);
    url = `${storageHost}/${url}/preview.${ext}`;
  } */

  // create URL
  const ssUrl = `${previewHost}/screenshot.html?url=${url}&type=${type}&width=${width}&height=${height}`;

  // set src attr for iframe
  iframe.src = ssUrl;
  console.log('Preview generation in progress for ', ssUrl);

  // event listener for postMessage from screenshot.js
  rejectionTimeout = setTimeout(() => {
    reject('Preview Server Timed Out');
    running = false;
    if (queue.length > 0) {
      next();
    }
  }, 30 * 1000);
};

window.addEventListener('message', event => {
  if (event.data.method === 'result') {
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
      next();
    }
  }
});

// URL validate function
function isValidURL(string) {
  var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null);
}

export const preview = async (url, ext, type, width, height, priority=10) => {
  return new Promise((resolve, reject) => {
    if (!['png', 'jpg', 'jpeg', 'vox', 'vrm', 'glb', 'webm', 'gif'].includes(ext)) {
      return reject('Undefined Extension');
    }
    if (!running) {
      generatePreview(url, type, width, height, resolve, reject);
    } else {
      queue.push({url, type, width, height, resolve, reject, priority});
      queue.sort((a, b) => a.priority - b.priority)
    }
  });
};
