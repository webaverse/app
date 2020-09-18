export function downloadFile(file, filename) {
  const blobURL = URL.createObjectURL(file);
  const tempLink = document.createElement('a');
  tempLink.style.display = 'none';
  tempLink.href = blobURL;
  tempLink.setAttribute('download', filename);

  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
}
export function readFile(file) {
  return new Promise((accept, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      accept(new Uint8Array(fr.result));
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}
export function bindUploadFileButton(inputFileEl, handleUpload) {
  inputFileEl.addEventListener('change', async e => {
    const {files} = e.target;
    if (files.length === 1) {
      const [file] = files;
      handleUpload(file);
    }

    const {parentNode} = inputFileEl;
    parentNode.removeChild(inputFileEl);
    const newInputFileEl = inputFileEl.ownerDocument.createElement('input');
    newInputFileEl.type = 'file';
    // newInputFileEl.id = 'upload-file-button';
    // newInputFileEl.style.display = 'none';
    newInputFileEl.classList.add('hidden');
    parentNode.appendChild(newInputFileEl);
    bindUploadFileButton(newInputFileEl, handleUpload);
  });
}

export function makePromise() {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
}

let nextMeshId = 0;
export const getNextMeshId = () => ++nextMeshId;

export class WaitQueue {
  constructor() {
    this.locked = false;
    this.waiterCbs = [];
  }

  async lock() {
    if (!this.locked) {
      this.locked = true;
    } else {
      const p = makePromise();
      this.waiterCbs.push(p.accept);
      await p;
    }
  }

  async unlock() {
    if (this.waiterCbs.length > 0) {
      this.waiterCbs.pop()();
    } else {
      this.locked = false;
    }
  }

  clearQueue() {
    this.waiterCbs.length = 0;
  }
}