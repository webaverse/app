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