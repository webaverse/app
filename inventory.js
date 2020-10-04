import * as THREE from './three.module.js';
import {getRandomString, bindUploadFileButton} from './util.js';
import {loginManager} from './login.js';
import {planet} from './planet.js';
import {getContractSource} from './blockchain.js';
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

      planet.transactState(() => {
        const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
        const position = xrCamera.position.clone()
          .add(new THREE.Vector3(0, 0, -1).applyQuaternion(xrCamera.quaternion))
          .toArray();
        const quaternion = xrCamera.quaternion.toArray();

        const instanceId = getRandomString();
        const trackedObject = planet.getTrackedObject(instanceId);
        trackedObject.set('instanceId', instanceId);
        trackedObject.set('contentId', id);
        trackedObject.set('position', position);
        trackedObject.set('quaternion', quaternion);
      });
    }
  } else if (e.dataTransfer.files.length > 0) {
    const [file] = e.dataTransfer.files;
    await inventory.uploadFile(file);
  }
});
planet.addEventListener('trackedobjectadd', async e => {
  const trackedObject = e.data;
  const trackedObjectJson = trackedObject.toJSON();
  const {contentId, position, quaternion} = trackedObjectJson;

  {
    const contractSource = await getContractSource('getNft.cdc');

    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        limit: 100,
        script: contractSource
          .replace(/ARG0/g, contentId),
        wait: true,
      }),
    });
    const response2 = await res.json();
    const [hash, filename] = response2.encodedData.value.map(value => value.value && value.value.value);

    const res2 = await fetch(`${storageHost}/${hash}`);
    const file = await res2.blob();
    file.name = filename;
    // console.log('loading file');
    const mesh = await runtime.loadFileForWorld(file);
    mesh.position.fromArray(position);
    mesh.quaternion.fromArray(quaternion);
    
    mesh.run && mesh.run();
    scene.add(mesh);
  }
});

export default inventory;