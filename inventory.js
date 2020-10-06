import * as THREE from './three.module.js';
import {bindUploadFileButton} from './util.js';
import {loginManager} from './login.js';
import {planet} from './planet.js';
import {renderer, scene, camera} from './app-object.js';
import {storageHost} from './constants.js';

const inventory = new EventTarget();

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

inventory.discardFile = async id => {
  const fileIndex = files.findIndex(file => file.id === id);
  if (fileIndex !== -1) {
    files.splice(fileIndex, 1);
    inventory.dispatchEvent(new MessageEvent('filesupdate', {
      data: files,
    }));

    await loginManager.destroyNft(id);
  } else {
    throw new Error('no such inventory file id');
  }
};

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

  const _loadJson = j => {
    const {dragid} = j;
    const match = dragid.match(/^inventory-([0-9]+)$/);
    if (match) {
      const id = parseInt(match[1], 10);

      const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
      const position = xrCamera.position.clone()
        .add(new THREE.Vector3(0, 0, -1).applyQuaternion(xrCamera.quaternion));
      const quaternion = xrCamera.quaternion;

      planet.addObject(id, position, quaternion);
    }
  };
  if (e.data) {
    _loadJson(e.data);
  } else {
    let jsonFile = Array.from(e.dataTransfer.items).find(item => item.type === 'application/json');
    if (jsonFile) {
      const s = await new Promise((accept, reject) => {
        jsonFile.getAsString(accept);
      });
      const j = JSON.parse(s);
      _loadJson(j);
    } else if (e.dataTransfer.files.length > 0) {
      const [file] = e.dataTransfer.files;
      await inventory.uploadFile(file);
    }
  }
});

export default inventory;