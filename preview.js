import {storageHost, inappPreviewHost} from './constants';
import {makeId} from './util';

const queue = [];
let running = false;

export const generatePreview = async (url, ext, type, width, height, resolve) => {
  running = true;
  // check for existing iframe
  var iframe = document.querySelector(`iframe[src^="${inappPreviewHost}/screenshot.html"]`);

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
  var ssUrl = `${inappPreviewHost}/screenshot.html?url=${url}&ext=${ext}&type=${type}&width=${width}&height=${height}`;

  // set src attr for iframe
  iframe.src = ssUrl;

  // event listener for postMessage from screenshot.js
  var f = function(event) {
    if (event.data.method === 'result') {
      window.removeEventListener('message', f, false);
      var blob = new Blob([event.data.result], {
        type: `image/${type}`,
      });
      resolve({
        blob: blob,
        url: URL.createObjectURL(blob),
      });
      running = false;
      if (queue.length > 0) {
        generatePreview(...queue.shift());
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
      generatePreview(url, ext, type, width, height, resolve);
    } else {
      queue.push({url, ext, type, width, height, resolve});
    }
  });
};

window.generatePreview = generatePreview;
