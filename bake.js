import {readFile} from 'https://static.xrpackage.org/xrpackage/util.js';

import {screenshotWbn, volumeizeWbn} from './bakeUtils.js';

const screenshotHeaderEl = document.getElementById('screenshot-header');
const screenshotResultEl = document.getElementById('screenshot-result');
const volumeHeaderEl = document.getElementById('volume-header');
const volumeResultEl = document.getElementById('volume-result');
const aabbHeaderEl = document.getElementById('aabb-header');
const aabbResultEl = document.getElementById('aabb-result');
const errorTraceEl = document.getElementById('error-trace');

const parseQuery = queryString => {
  const query = {};
  const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
};

const toggleElements = baked => {
  const bakedEl = document.getElementById('baked');
  const bakingEl = document.getElementById('baking');
  const errorEl = document.getElementById('error');

  if (baked === true) {
    bakedEl.style.display = 'block';
    bakingEl.style.display = 'none';
    errorEl.style.display = 'none';
  } else if (baked === false) {
    bakedEl.style.display = 'none';
    bakingEl.style.display = 'block';
    errorEl.style.display = 'none';
  } else {
    bakedEl.style.display = 'none';
    bakingEl.style.display = 'none';
    errorEl.style.display = 'block';
  }
};

const _screenshot = async (srcWbn, dstGif) => {
  screenshotHeaderEl.innerText = 'Screenshotting...';
  const {screenshotBlob} = await screenshotWbn(srcWbn, dstGif);

  const img = document.createElement('img');
  img.src = URL.createObjectURL(screenshotBlob);
  img.style.backgroundColor = '#EEE';
  img.style.borderRadius = '10px';
  screenshotResultEl.appendChild(img);

  screenshotHeaderEl.innerText = 'Screenshotting done';
  const screenshot = await readFile(screenshotBlob);
  return {screenshot};
};

const _volumize = async (srcWbn, dstVolume, dstAabb) => {
  volumeHeaderEl.innerText = 'Volumizing...';
  const {volumeBlob, aabb, domElement} = await volumeizeWbn(srcWbn, dstVolume, dstAabb);

  volumeResultEl.appendChild(domElement);
  domElement.style.backgroundColor = '#EEE';
  domElement.style.borderRadius = '10px';

  aabbHeaderEl.innerText = 'AABB';
  aabbResultEl.innerText = JSON.stringify(aabb, null, 2);
  volumeHeaderEl.innerText = 'Volumizing done';

  const volume = await readFile(volumeBlob);
  return {volume, aabb};
};

(async () => {
  try {
    toggleElements(false);
    const {srcWbn, dstGif, dstVolume, dstAabb} = parseQuery(decodeURIComponent(window.location.search));
    const {screenshot} = await _screenshot(srcWbn, dstGif);
    const {volume, aabb} = await _volumize(srcWbn, dstVolume, dstAabb);

    window.parent.postMessage({
      method: 'result',
      result: {screenshot, volume, aabb},
    }, '*', [screenshot.buffer, volume.buffer]);

    toggleElements(true);
  } catch (err) {
    toggleElements(null);
    console.error(err.stack);
    screenshotHeaderEl.innerText = '';
    volumeHeaderEl.innerText = '';
    errorTraceEl.innerText = err.stack;

    window.parent.postMessage({
      method: 'error',
      error: err.stack,
    }, '*');
  }
})();
