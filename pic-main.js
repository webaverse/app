import {bindCanvas} from './renderer.js';
import {genPic} from './pic.js';

const defaultUrl = `/avatars/scillia_drophunter_v15_vian.vrm`;
const rendererSize = 2048;
const width = 500;
const height = 500;

const formEl = document.getElementById('form');
const urlEl = document.getElementById('url');
const canvasEl = document.getElementById('canvas');
const videoEl = document.getElementById('video');
formEl.addEventListener('submit', async e => {
  e.preventDefault();

  const url = urlEl.value;

  const _bindRendererCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = rendererSize;
    canvas.height = rendererSize;
    bindCanvas(canvas);
  };
  _bindRendererCanvas();

  const _initLocalCanvas = () => {
    canvasEl.width = width;
    canvasEl.height = height;
  };
  _initLocalCanvas();

  await genPic({
    url,
    width,
    height,
    canvas: canvasEl,
    video: videoEl,
  });
});
urlEl.value = defaultUrl;