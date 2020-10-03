import * as THREE from './three.module.js';
import {bindUploadFileButton} from './util.js';
import {loginManager} from './login.js';
import runtime from './runtime.js';
import {renderer, scene, camera} from './app-object.js';
import {storageHost} from './constants.js';

const inventory = new EventTarget();

const _getExt = fileName => {
  const match = fileName.match(/\.(.+)$/);
  return match && match[1];
};
inventory.uploadFile = async file => {
  const {id, hash} = await loginManager.uploadFile(file);
  const {name: filename} = file;
  const match = filename.match(/\.([^\.]+)$/);
  const ext = match ? match[1] : 'bin';
  const preview = `https://preview.exokit.org/${hash}.${ext}/preview.png`;
  const fileSpec = {
    id,
    hash,
    filename,
    preview,
  };
  files.push(fileSpec);
  inventory.dispatchEvent(new MessageEvent('filesupdate', {
    data: files,
  }));
};
bindUploadFileButton(document.getElementById('load-package-input'), inventory.uploadFile);

let files = [];
inventory.getFiles = () => files;

loginManager.addEventListener('inventorychange', async e => {
  files = await loginManager.getInventory();
  inventory.dispatchEvent(new MessageEvent('filesupdate', {
    data: files,
  }));
});

document.addEventListener('dragover', e => {
  e.preventDefault();
});
document.addEventListener('drop', async e => {
  e.preventDefault();

  let jsonFile = Array.from(e.dataTransfer.items).find(item => item.type === 'application/json');
  if (jsonFile) {
    const s = await new Promise((accept, reject) => {
        jsonFile.getAsString(accept);
    });
    const j = JSON.parse(s);
    const {dragid} = j;
    const match = dragid.match(/^inventory-([0-9]+)$/);
    if (match) {
      const id = parseInt(match[1], 10);
      const inventoryFile = files.find(file => file.id === id);
      if (inventoryFile) {
        const {hash, filename} = inventoryFile;
        const res = await fetch(`${storageHost}/${hash}`);
        const file = await res.blob();
        file.name = filename;
        // console.log('loading file');
        const mesh = await runtime.loadFileForWorld(file);
        {
          const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
          mesh.position.copy(xrCamera.position).add(new THREE.Vector3(0, 0, -1).applyQuaternion(xrCamera.quaternion));
          mesh.quaternion.copy(xrCamera.quaternion);
        }
        mesh.run && mesh.run();
        scene.add(mesh);
      }
    }
  } else if (e.dataTransfer.files.length > 0) {
    const [file] = e.dataTransfer.files;
    await inventory.uploadFile(file);
  }
});

export default inventory;