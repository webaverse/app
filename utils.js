import symbols from './symbols.js';

const module = {exports: {}};

const _elementGetter = (self, attribute) => self.listeners(attribute).filter(l => l[symbols.listenerSymbol])[0];
module.exports._elementGetter = _elementGetter;

const _elementSetter = (self, attribute, cb) => {
  const listener = _elementGetter(self, attribute);
  if (listener) {
    self.removeEventListener(attribute, listener);
    listener[symbols.listenerSymbol] = false;
  }
  
  if (typeof cb === 'function') {
    self.addEventListener(attribute, cb);
    cb[symbols.listenerSymbol] = true;
  }
};
module.exports._elementSetter = _elementSetter;

export default module.exports;
