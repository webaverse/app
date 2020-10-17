import localforage from './localforage.js';
import {makePromise} from './util.js';

let ids = 0;
const loadPromise = new Promise((accept, reject) => {
  const iframe = document.createElement('iframe');
  iframe.onload = () => {
    console.log('iframe load outer 1');

    const channel = new MessageChannel();
    channel.port1.onmessage = e => {
      console.log('got message outer', e.data);
    };

    iframe.contentWindow.postMessage({
      _localstorage: true,
      port: channel.port2,
    }, '*', [channel.port2]);

    /* channel.port1.postMessage({

    }); */
    // window.port = channel.port1;

    console.log('iframe load outer 2');
    accept(channel.port1);
  };
  iframe.onerror = reject;
  iframe.src = 'https://localstorage.webaverse.com/';
  iframe.setAttribute('frameborder', 0);
  iframe.style.position = 'absolute';
  iframe.style.top = '-4096px';
  iframe.style.left = '-4096px';
  document.body.appendChild(iframe);
});

const tempStorage = {};
const storage = {
  get(key) {
    return loadPromise.then(port => new Promise((accept, reject) => {
      const _message = e => {
        const j = e.data;
        if (j.id === id) {
          port.removeEventListener('message', _message);
          accept(j.result);
        }
      };
      port.addEventListener('message', _message);
      const id = ++ids;
      port.postMessage({
        method: 'get',
        id,
        key,
      });
    }));
  },
  set(key, value) {
    return loadPromise.then(port => new Promise((accept, reject) => {
      const _message = e => {
        const j = e.data;
        if (j.id === id) {
          port.removeEventListener('message', _message);
          accept(j.result);
        }
      };
      port.addEventListener('message', _message);
      const id = ++ids;
      port.postMessage({
        method: 'set',
        id,
        key,
        value,
      });
    }));
  },
  remove(key) {
    return loadPromise.then(port => new Promise((accept, reject) => {
      const _message = e => {
        const j = e.data;
        if (j.id === id) {
          port.removeEventListener('message', _message);
          accept(j.result);
        }
      };
      port.addEventListener('message', _message);
      const id = ++ids;
      port.postMessage({
        method: 'remove',
        id,
        key,
      });
    }));
  },
};
export default storage;
