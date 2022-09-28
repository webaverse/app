/**
 * localStorage Manager
 * in private browsing mode, localStorage is not supported on all browsers
 * this manager will check if localStorage is supported and use it if it is
 * otherwise it creates a fallback in-memory storage that uses the localStorage API
 */

let _storage = {};

const setItem = (key, value) => {
  _storage[key] = String(value);
};

const getItem = key =>
  Object.prototype.hasOwnProperty.call(_storage, key) ? _storage[key] : null;

const removeItem = key =>
  Object.prototype.hasOwnProperty.call(_storage, key)
    ? delete _storage[key] && undefined
    : undefined;

const clear = () => {
  _storage = {};
};

const _isSupported = () => {
  try {
    return typeof window.localStorage === 'object' && window.localStorage;
  } catch (e) {
    return false;
  }
};

const inMemoryStorage = {setItem, getItem, removeItem, clear};

const localStorageManager = _isSupported() ? localStorage : inMemoryStorage;

window.localStorageManager = localStorageManager;

export default localStorageManager;
