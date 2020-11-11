import * as THREE from './three.module.js';
import {bindUploadFileButton} from './util.js';
import {loginManager} from './login.js';
// import {world} from './world.js';
// import {getContractSource} from './blockchain.js';
import {getState, setState} from './state.js';
// import {renderer, scene, camera} from './app-object.js';
import {getExt} from './util.js';
import {storageHost, previewExt} from './constants.js';

const inventory = new EventTarget();

inventory.uploadFile = async file => {
  const {id, hash} = await loginManager.uploadFile(file);
  const {name: filename} = file;
  const ext = getExt(filename);
  const preview = `https://preview.exokit.org/${hash.slice(2)}.${ext}/preview.${previewExt}`;
  const fileSpec = {
    id,
    hash,
    filename,
    preview,
  };
  files.push(fileSpec);
  inventory.dispatchEvent(new MessageEvent('ownedfilesupdate', {
    data: files,
  }));
};
inventory.discardFile = async id => {
  const fileIndex = files.findIndex(file => file.id === id);
  if (fileIndex !== -1) {
    files.splice(fileIndex, 1);
    inventory.dispatchEvent(new MessageEvent('ownedfilesupdate', {
      data: files,
    }));

    await loginManager.destroyNft(id);
  } else {
    throw new Error('no such inventory file id');
  }
};

let files = [];
inventory.getOwnedFiles = () => files;
inventory.getFiles = async (start, end) => {
  const res = await fetch(`https://tokens.webaverse.com/${start+1}-${end+1}`);
  const tokens = await res.json();
  /* const contractSource = await getContractSource('getNfts.cdc');

  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      limit: 100,
      script: contractSource
        .replace(/ARG0/g, start)
        .replace(/ARG1/g, end),
      wait: true,
    }),
  });
  const response2 = await res.json();
  const items = response2.encodedData.value.map(value => {
    const {fields} = value.value;
    const id = parseInt(fields.find(field => field.name === 'id').value.value, 10);
    const hash = fields.find(field => field.name === 'hash').value.value;
    const filename = fields.find(field => field.name === 'filename').value.value;
    const ext = getExt(filename);
    const preview = `https://preview.exokit.org/${hash.slice(2)}.${ext}/preview.${previewExt}`;
    return {id, hash, filename, preview};
  }); */
  return tokens;
};
const itemsPerBrowsePage = 21;
inventory.scrollBrowse = async delta => {
  const {menu} = getState();
  menu.browse.page += delta;
  menu.browse.page = Math.max(menu.browse.page, 0);
  const items = await inventory.getFiles(menu.browse.page * itemsPerBrowsePage, (menu.browse.page + 1) * itemsPerBrowsePage);
  menu.browse.items = items;
  setState({menu});
};
inventory.scrollBrowse(0);

loginManager.addEventListener('inventorychange', async e => {
  files = await loginManager.getInventory();
  inventory.dispatchEvent(new MessageEvent('ownedfilesupdate', {
    data: files,
  }));
});

/* bindUploadFileButton(document.getElementById('load-package-input'), inventory.uploadFile);
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

      world.addObject(id, position, quaternion);
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
}); */

export default inventory;