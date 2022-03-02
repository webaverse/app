/* import * as THREE from 'three';
import metaversefileApi from './metaversefile-api.js';
import {getExt, makePromise, parseQuery, fitCameraToBoundingBox} from './util.js';
import Avatar from './avatars/avatars.js';
// import * as icons from './icons.js';
import GIF from './gif.js';
// import App from './webaverse';
// import {defaultRendererUrl} from './constants.js'
import * as WebMWriter from 'webm-writer';
const defaultWidth = 512;
const defaultHeight = 512;
// const cameraPosition = new THREE.Vector3(0, 1, 2);
// const cameraTarget = new THREE.Vector3(0, 0, 0);
const FPS = 60; */

import {genPic} from './pic.js';

//

const defaultUrl = `/avatars/scillia_drophunter_v15_vian.vrm`;
const width = 500;
const height = 500;

const formEl = document.getElementById('form');
const urlEl = document.getElementById('url');
const canvasEl = document.getElementById('canvas');
const videoEl = document.getElementById('video');
// const outputsEl = document.getElementById('outputs');

formEl.addEventListener('submit', async e => {
  e.preventDefault();

  const url = urlEl.value;

  await genPic({
    url,
    width,
    height,
    canvas: canvasEl,
    video: videoEl,
  });
});
urlEl.value = defaultUrl;