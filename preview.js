import WaveSurfer from './wavesurfer.js';
import {parseQuery} from './util.js';

const q = parseQuery(window.location.search);

const container = document.getElementById('container');
container.innerHTML = 'Hello, preview!\n' + JSON.stringify(q, null, 2);

console.log('preview');