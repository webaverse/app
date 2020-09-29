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
  const fileSpec = {
    id,
    hash,
    filename,
  };
  files.push(fileSpec);
  inventory.dispatchEvent(new MessageEvent('filesupdate', {
    data: files,
  }));
};
document.addEventListener('load', () => {
  bindUploadFileButton(document.getElementById('load-package-input'), inventory.uploadFile);
})

let files = [];
inventory.getFiles = () => files;

loginManager.addEventListener('inventorychange', async e => {
  const files = await loginManager.getInventory();
  inventory.dispatchEvent(new MessageEvent('filesupdate', {
    data: files,
  }));
});

document.addEventListener('dragover', e => {
  e.preventDefault();
});
document.addEventListener('drop', async e => {
  e.preventDefault();

  if (e.dataTransfer.files.length > 0) {
    const [file] = e.dataTransfer.files;
    await inventory.uploadFile(file);
  }
});

export default inventory;