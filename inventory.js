import {bindUploadFileButton} from './util.js';
import {loginManager} from './login.js';
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
      const file = files.find(file => file.id === id);
      if (file) {
        console.log('intantiate file', file);
      }
    }
  } else if (e.dataTransfer.files.length > 0) {
    const [file] = e.dataTransfer.files;
    await inventory.uploadFile(file);
  }
});

export default inventory;