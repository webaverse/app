/* eslint-disable no-useless-escape */
import {makeId} from './util.js';
import {storageHost, inappPreviewHost} from './constants.js';

let iframe = null;
const queue = [];
let running = false;
let resolve, reject;
let expectedRespond = '';
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
  const respond = makeId(5);
  expectedRespond = respond;
  const ssUrl = `${previewHost}/screenshot.html?url=${url}&type=${type}&width=${width}&height=${height}&respond=${respond}`;

  // set src attr for iframe
  iframe.src = ssUrl;
  // console.log('Preview generation in progress for ', ssUrl);

  // event listener for postMessage from screenshot.js
  rejectionTimeout = setTimeout(() => {
    // reject('Preview Server Timed Out');
    running = false;
    if (queue.length > 0) {
      next();
    }
  }, 30 * 1000);
};

window.addEventListener('message', event => {
  // console.log('got message', event.data, event.data?.id, expectedRespond);
  if (event.data?.id === expectedRespond) {
    /* let blob;
    if (type === 'webm') {
      blob = new Blob([event.data.result], {
        type: `video/${type}`,
      });
    } else {
      blob = new Blob([event.data.result], {
        type: `image/${type}`,
      });
    } */

    // console.log('end timeout');
    clearTimeout(rejectionTimeout);
    if (!event.data.error) {
      // console.log('result', event.data.result);
      resolve(event.data.result);
    } else {
      reject(event.data.error);
    }

    running = false;
    if (queue.length > 0) {
      next();
    }
  }
});

// URL validate function
/* function isValidURL(string) {
  var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null);
} */

export const preview = async (url, type, width, height, priority=10) => {
  return new Promise((resolve, reject) => {
    /* if (!['png', 'jpg', 'jpeg', 'vox', 'vrm', 'glb', 'webm', 'gif'].includes(ext)) {
      return reject('Undefined Extension');
    } */
    if (!running) {
      generatePreview(url, type, width, height, resolve, reject);
    } else {
      queue.push({url, type, width, height, resolve, reject, priority});
      queue.sort((a, b) => a.priority - b.priority);
    }
  });
};
