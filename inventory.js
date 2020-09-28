import {bindUploadFileButton} from './util.js';
import {loginManager} from './login.js';
import {storageHost} from './constants.js';

const inventory = new EventTarget();

const _getExt = fileName => {
  const match = fileName.match(/\.(.+)$/);
  return match && match[1];
};
inventory.uploadFile = async file => {
  const {hash} = await loginManager.uploadFile(file);
  const {name: filename} = file;
  return {
    filename,
    hash,
  };
};
const _uploadFileToInventory = async file => {
  const fileSpec = await inventory.uploadFile(file);
  files.push(fileSpec);
  inventory.dispatchEvent(new MessageEvent('filesupdate', {
    data: files,
  }));
};
bindUploadFileButton(document.getElementById('load-package-input'), _uploadFileToInventory);

let files = [];
inventory.getFiles = () => files;

loginManager.addEventListener('inventorychange', async e => {
  let files = await loginManager.getInventory();
  files = files.map(entry => {
    const {filename, hash} = entry;
    return {filename, hash};
  });
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
    await _uploadFileToInventory(file);
  }
});

export default inventory;