import localforage from './localforage.js';

const iframe = document.createElement('iframe');
iframe.onload = () => {
  console.log('iframe load outer 1');

  const channel = new MessageChannel();
  channel.port1.onmessage = e => {
    console.log('got message outer', e.data);
  };

  /* iframe.contentWindow.onmessage = e => {
    const j = e.data;
    if (j && j._localstorage) {
      window.removeEventListener('message', _message);
      console.log('got json', j);
      j.port.postMessage({lol: zol});
    }
  }; */
  iframe.contentWindow.postMessage({
    _localstorage: true,
    port: channel.port2,
  }, '*', [channel.port2]);

  channel.port1.postMessage({lol: 'zol'});

  console.log('iframe load outer 2');
};
iframe.onerror = err => {
  console.warn('iframe error', err);
};
iframe.src = 'https://localstorage.webaverse.com/';
document.body.appendChild(iframe);

const tempStorage = {};
const storage = {
  async get(k) {
    const s = await localforage.getItem(k);
    return typeof s === 'string' ? JSON.parse(s) : s;
  },
  async getRaw(k) {
    return await localforage.getItem(k);
  },
  async set(k, v) {
    await localforage.setItem(k, JSON.stringify(v));
  },
  async setRaw(k, v) {
    await localforage.setItem(k, v);
  },
  async remove(k) {
    await localforage.removeItem(k);
  },
  async keys() {
    return await localforage.keys();
  },
  async getRawTemp(k) {
    return tempStorage[k];
  },
  async setRawTemp(k, v) {
    tempStorage[k] = v;
  },
};
export default storage;
