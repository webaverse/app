import {
  zbencode,
  zbdecode,
  zbclone,
} from './encoding.mjs';
import {align4} from './util.mjs';

const MESSAGES = (() => {
  let iota = 0;
  return {
    STATE_RESET: ++iota,
    TRANSACTION: ++iota,
  };
})();

// XXX can use a power-of-two buffer cache for memory

let rng = Math.random;
function setRng(r) {
  rng = r;
}
const _makeId = () => Math.floor(rng() * 0xFFFFFF);
const _jsonify = o => {
  const impl = bindingsMap.get(o);
  if (impl?.isZArray) {
    return o.e.map(_jsonify);
  } else if (Array.isArray(o)) {
    return o.map(_jsonify);
  } else if (
    o instanceof Uint8Array ||
    o instanceof Uint16Array ||
    o instanceof Uint32Array ||
    o instanceof Int8Array ||
    o instanceof Int16Array ||
    o instanceof Int32Array ||
    o instanceof Float32Array ||
    o instanceof Float64Array
  ) {
    return o;
  } else if (o !== null && typeof o === 'object') {
    const result = {};
    for (const k in o) {
      result[k] = _jsonify(o[k]);
    }
    return result;
  } else {
    return o;
  }
};
const _getBindingForValue = e => {
  if (e?.isZMap || e?.isZArray) {
    return e.binding;
  } else {
    return e;
  }
};
const _getBindingForArray = arr => arr.map(_getBindingForValue);

const _makeDataView = uint8Array => new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
const _parseBoundEvent = encodedEventData => {
  const dataView = _makeDataView(encodedEventData);
  
  let index = 0;
  const method = dataView.getUint32(index, true);
  const Cons = ZEVENT_CONSTRUCTORS[method];
  if (Cons) {
    return Cons.deserializeUpdate(encodedEventData);
  } else {
    console.warn('could not parse bound event due to incorrect method', method, ZEVENT_CONSTRUCTORS);
    return null;
  }
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const observersMap = new WeakMap();
const bindingsMap = new WeakMap();
const bindingParentsMap = new WeakMap();

class ZEventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(k, fn) {
    let ls = this.listeners[k];
    if (!ls) {
      ls = [];
      this.listeners[k] = ls;
    }
    ls.push(fn);
  }
  once(k, fn) {
    this.on(k, fn);
    
    const fn2 = () => {
      this.off(k, fn);
      this.off(k, fn2);
    };
    this.on(k, fn2);
  }
  off(k, fn) {
    const ls = this.listeners[k];
    if (ls) {
      for (;;) {
        const index = ls.indexOf(fn);
        if (index !== -1) {
          ls.splice(index, 1);
        } else {
          break;
        }
      }
    }
  }
  dispatchEvent(k, a, b, c, d) {
    const listeners = this.listeners[k];
    if (listeners) {
      for (const fn of listeners) {
        fn(a, b, c, d);
      }
    }
  }
}

const conflictSpec = {
  weAreHighestPriority: false,
};
const _uint8ArrayEquals = (a, b) => {
  if (a === b) {
    return true;
  } else if (a.length === b.length) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};
const _keyPathEquals = _uint8ArrayEquals;
const _uint8ArrayPrefixEquals = (a, b) => {
  if (a === b) {
    return true;
  } else if (a.length < b.length) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
};
const _isKeyPathPrefix = _uint8ArrayPrefixEquals;
const _getHistoryDataView = (historyData, historyOffsets, historyIndex) => {
  return new DataView(
    historyData.buffer,
    historyData.byteOffset + historyOffsets[historyIndex],
  );
};
const _getHistoryMethod = (historyData, historyOffsets, historyIndex) => {
  const dataView = _getHistoryDataView(historyData, historyOffsets, historyIndex);

  let index = 0;
  const eventType = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;

  return eventType;
};
const _getHistoryResolvePriority = (historyData, historyOffsets, historyIndex) => {
  const dataView = _getHistoryDataView(historyData, historyOffsets, historyIndex);

  let index = 0;
  // const eventType = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;

  const resolvePriority = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;

  return resolvePriority;
};
const _getHistoryKeyPathBuffer = (historyData, historyOffsets, historyIndex) => {
  const dataView = _getHistoryDataView(historyData, historyOffsets, historyIndex);

  let index = 0;
  // const eventType = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;

  // const resolvePriority = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;

  const kpjbLength = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const kpjb = new Uint8Array(dataView.buffer, dataView.byteOffset + index, kpjbLength);

  return kpjb;
};
const _parentWasSet = (event, historyStartIndex, historyEndIndex, historyData, historyOffsets) => {
  for (let i = historyStartIndex; i < historyEndIndex; i++) {
    // const e = _parseHistoryBuffer(historyData, historyOffsets, i);

    const historyMethod = _getHistoryMethod(historyData, historyOffsets, i);
    if (historyMethod !== ZNullEvent.METHOD) {
      const historyKeyPathBuffer = _getHistoryKeyPathBuffer(historyData, historyOffsets, i);
      // console.log('check key path', [textDecoder.decode(historyKeyPathBuffer), textDecoder.decode(event.getKeyPathBuffer())]);
      if ( // if this is a parent
        _isKeyPathPrefix(historyKeyPathBuffer, event.getKeyPathBuffer())
      ) {
        // console.log('check prefix yes', historyMethod, [textDecoder.decode(historyKeyPathBuffer), textDecoder.decode(event.getKeyPathBuffer())]);
        if ( // if this is an overwrite type
          historyMethod === ZMapSetEvent.METHOD ||
          historyMethod === ZMapDeleteEvent.METHOD ||
          historyMethod === ZArrayDeleteEvent.METHOD
        ) {
          return true;
        }
      }
    }
  }
  return false;
};
const _getConflicts = (event, historyStartIndex, historyEndIndex, historyData, historyOffsets, resolvePriority, conflictSpec) => {
  let conflictFound = false;
  conflictSpec.weAreHighestPriority = true;
  
  for (let i = historyStartIndex; i < historyEndIndex; i++) {
    // const e = _parseHistoryBuffer(historyData, historyOffsets, i);
    const historyMethod = _getHistoryMethod(historyData, historyOffsets, i);
    if ( // if this is an overwrite type
      historyMethod === ZMapSetEvent.METHOD ||
      historyMethod === ZMapDeleteEvent.METHOD
    ) {
      const historyKeyPathBuffer = _getHistoryKeyPathBuffer(historyData, historyOffsets, i);
      if (_keyPathEquals(historyKeyPathBuffer, event.getKeyPathBuffer())) { // if it is the same keypath
        conflictFound = true;

        const historyResolvePriority = _getHistoryResolvePriority(historyData, historyOffsets, i);
        if (historyResolvePriority > resolvePriority) {
          conflictSpec.weAreHighestPriority = false;
          break;
        }
      }
    }
  }
  
  return conflictFound;
};
const _alreadyDeleted = (event, historyStartIndex, historyEndIndex, historyData, historyOffsets) => {
  for (let i = historyStartIndex; i < historyEndIndex; i++) {
    const historyMethod = _getHistoryMethod(historyData, historyOffsets, i);
    if (historyMethod === ZArrayDeleteEvent.METHOD) {
      const historyKeyPathBuffer = _getHistoryKeyPathBuffer(historyData, historyOffsets, i);
      if (_keyPathEquals(historyKeyPathBuffer, event.getKeyPathBuffer())) {
        return true;
      }
    }
  }
  return false;
};

class TransactionCache {
  constructor(doc = null, origin = undefined, startClock = doc.clock, resolvePriority = doc.resolvePriority, events = [], observerEvents = []) {
    this.doc = doc;
    this.origin = origin;
    this.startClock = startClock;
    this.resolvePriority = resolvePriority;
    this.events = events;
    this.observerEvents = observerEvents;
  }
  pushEvent(event) {
    this.events.push(event);
  }
  pushObserverEvent(impl, e) {
    this.observerEvents.push(impl.triggerObservers.bind(impl, e));
  }
  triggerObserverEvents() {
    for (let i = 0; i < this.observerEvents.length; i++) {
      this.observerEvents[i]();
    }
  }
  rebase() {
    const historyTailLength = this.doc.clock - this.startClock;
    // globalThis.maxHistoryTailLength = Math.max(globalThis.maxHistoryTailLength, historyTailLength);
    const historyStartIndex = this.startClock;
    const historyEndIndex = this.doc.clock;
    const {historyData, historyOffsets}  = this.doc;
    
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      if (event.isZMapSetEvent || event.isZMapDeleteEvent) {
        if (_parentWasSet(event, historyStartIndex, historyEndIndex, historyData, historyOffsets)) {
          // console.log('torpedo self due to parent conflict');
          this.events[i] = nullEvent;
        } else if (_getConflicts(event, historyStartIndex, historyEndIndex, historyData, historyOffsets, this.resolvePriority, conflictSpec)) {
          /* const _isHighestPriority = () => {
            return conflicts.every(([p, e]) => {
              return this.resolvePriority <= p;
            });
          }; */

          if (conflictSpec.weAreHighestPriority) {
            // console.log('survive due to high prio');
          } else {
            // console.log('torpedo self due to low prio');
            this.events[i] = nullEvent;
          }
        } else {
          // console.log('no conflicts');
        }
      } else if (event.isZArrayPushEvent) {
        if (_parentWasSet(event, historyStartIndex, historyEndIndex, historyData, historyOffsets)) {
          this.events[i] = nullEvent;
        } else {
          // console.log('no conflicts');
        }
      } else if (event.isZArrayDeleteEvent) {
        if (
          _parentWasSet(event, historyStartIndex, historyEndIndex, historyData, historyOffsets) ||
          _alreadyDeleted(event, historyStartIndex, historyEndIndex, historyData, historyOffsets)
        ) {
          // console.log('torpedo self due to parent conflict');
          this.events[i] = nullEvent;
        } else {
          // console.log('no conflicts');
        }
      } else if (event.isZNullEvent) {
        // console.log('skip null event');
      } else {
        console.warn('unknown event type', event);
      }
    }
    this.startClock += historyTailLength;
  }
  serializeUpdate() {    
    let totalSize = 0;
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // method
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // clock
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // resolve priority
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // num events
    const updateByteLengths = this.events.map(event => {
      totalSize += Uint32Array.BYTES_PER_ELEMENT; // length
      const updateByteLength = event.computeUpdateByteLength();
      totalSize += updateByteLength;
      return updateByteLength;
    });
    
    const ab = new ArrayBuffer(totalSize);
    const uint8Array = new Uint8Array(ab);
    const dataView = new DataView(ab);
    let index = 0;
    
    dataView.setUint32(index, MESSAGES.TRANSACTION, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    // XXX setBigUint64
    dataView.setUint32(index, this.startClock, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    dataView.setUint32(index, this.resolvePriority, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    dataView.setUint32(index, this.events.length, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const updateByteLength = updateByteLengths[i];
      
      dataView.setUint32(index, updateByteLength, true);
      index += Uint32Array.BYTES_PER_ELEMENT; // length
      
      event.serializeUpdate(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, updateByteLength));
      index += updateByteLength;
    }
    return uint8Array;
  }
  static deserializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    // skip method
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const startClock = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const resolvePriority = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const numEvents = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const events = Array(numEvents);
    for (let i = 0; i < numEvents; i++) {
      const eventLength = dataView.getUint32(index, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      const encodedEventData = new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, eventLength);
      const event = _parseBoundEvent(encodedEventData);
      events[i] = event;
      index += eventLength;
      index = align4(index);
    }
    
    const transactionCache = new TransactionCache(undefined, undefined, startClock, resolvePriority, events);
    return transactionCache;
  }
}

const HISTORY_DATA_SIZE = 1024 * 1024; // 1 MB
const HISTORY_LENGTH = 1024;
class ZDoc extends ZEventEmitter {
  constructor(
    state = {},
    clock = 0,
    historyData = new Uint8Array(HISTORY_DATA_SIZE),
    historyOffsets = new Uint32Array(HISTORY_LENGTH),
 ) {
    super();

    this.state = state;
    this.clock = clock;

    this.historyData = historyData;
    this.historyOffsets = historyOffsets;
    
    this.transactionDepth = 0;
    this.transactionCache = null;
    this.resolvePriority = _makeId();
    this.mirror = false;

    this.isZDoc = true;
    
    bindingsMap.set(this.state, this);
  }
  get(k, Type) {
    let binding = this.state[k];
    if (binding === undefined) {
      binding = Type.nativeConstructor();
      this.state[k] = binding;
    }
    let impl = bindingsMap.get(binding);
    if (!impl) {
      impl = new Type(binding, this);
      bindingsMap.set(binding, impl);
      bindingParentsMap.set(binding, this.state);
    }
    return impl;
  }
  getArray(k) {
    return this.get(k, ZArray);
  }
  getMap(k) {
    return this.get(k, ZMap);
  }
  transact(fn, origin) {
    this.pushTransaction(origin);
    fn();
    this.popTransaction();
  }
  setResolvePriority(resolvePriority) {
    this.resolvePriority = resolvePriority;
  }
  setMirror(mirror) {
    this.mirror = mirror;
  }
  toJSON() {
    return _jsonify(this.state);
  }
  pushHistory(resolvePriority, event) {
    let byteOffset = this.historyOffsets[this.clock % this.historyOffsets.length];
    if (byteOffset >= this.historyData.byteLength / 2) {
      // console.log('truncate history');
      byteOffset = 0;
    }
    const eventTargetBuffer = new Uint8Array(
      this.historyData.buffer,
      this.historyData.byteOffset + byteOffset,
    );
    const eventByteLength = event.serializeHistory(resolvePriority, eventTargetBuffer);

    this.clock++;
    this.historyOffsets[this.clock % this.historyOffsets.length] = byteOffset + eventByteLength;

    // globalThis.maxHistoryLength = Math.max(globalThis.maxHistoryLength, this.clock); // XXX temp
  }
  pushTransaction(origin) {
    if (++this.transactionDepth === 1) {
      this.transactionCache = new TransactionCache(this, origin);
    }
  }
  popTransaction() {
    if (--this.transactionDepth === 0) {
      // trigger observers
      this.transactionCache.triggerObserverEvents();

      // emit update
      const uint8Array = this.transactionCache.serializeUpdate();
      if (uint8Array) {
        this.dispatchEvent('update', uint8Array, this.transactionCache.origin, this, null);
      }

      // push history
      for (const event of this.transactionCache.events) {
        this.pushHistory(this.transactionCache.resolvePriority, event);
      }

      // clear transaction cache
      this.transactionCache = null;
    }
  }
  setClockState(clock, state) {
    const observerEvents = [];

    const _emitDeleteEvents = state => {
      const _recurse = binding => {
        const impl = bindingsMap.get(binding);
        
        if (impl.isZDoc) {
          for (const k in impl.state) {
            _recurse(impl.state[k]);
          }
        } else if (impl.isZArray) {
          if (impl.length > 0) {
            const indexes = [];
            for (let i = 0; i < impl.length; i++) {
              indexes.push(i);
            }

            const e = {
              changes: {
                added: new Set([]),
                deleted: new Set(indexes),
                keys: new Map(indexes.map(index => {
                  let value = impl.binding.e[index];
                  value = bindingsMap.get(value) ?? value;
                  return [
                    index,
                    {
                      action: 'delete',
                      value,
                    },
                  ];
                })),
              },
            };
            observerEvents.push([impl, e]);
          }
          
          for (let i = 0; i < impl.binding.length; i++) {
            _recurse(impl.binding[i]);
          }
        } else if (impl.isZMap) {
          const keys = Array.from(impl.keys());
          if (keys.length > 0) {
            const values = Array.from(impl.values());
            const e = {
              changes: {
                added: new Set([]),
                deleted: new Set(values),
                keys: new Map(keys.map((key, index) => {
                  const value = values[index];
                  return [
                    key,
                    {
                      action: 'delete',
                      value: value.content.type,
                    },
                  ];
                })),
              },
            };
            observerEvents.push([impl, e]);
          }

          for (const k in impl.binding) {
            _recurse(impl.binding[k]);
          }
        } else {
          // nothing
        }
      };
      _recurse(state);
    };
    const _emitAddEvents = state => {
      const _recurse = binding => {
        const impl = bindingsMap.get(binding);
        
        if (impl?.isZDoc) {
          for (const k in impl.state) {
            _recurse(impl.state[k]);
          }
        } else if (impl?.isZArray) {
          if (impl.length > 0) {
            const rawValues = impl.binding.e.map(value => bindingsMap.get(value) ?? value);
            const values = rawValues.map(rawValue => {
              return {
                content: {
                  type: rawValue,
                },
              };
            });

            const e = {
              changes: {
                added: new Set(values),
                deleted: new Set([]),
                keys: new Map(values.map((value, index) => {
                  const rawValue = rawValues[index];
                  return [
                    index,
                    {
                      action: 'add',
                      value: rawValue,
                    },
                  ];
                })),
              },
            };
            observerEvents.push([impl, e]);
          }
          
          for (let i = 0; i < impl.binding.length; i++) {
            _recurse(impl.binding[i]);
          }
        } else if (impl?.isZMap) {
          const keys = Array.from(impl.keys());
          if (keys.length > 0) {
            const rawValues = Array.from(impl.values())//.map(value => bindingsMap.get(value) ?? value);
            const values = rawValues/*.map(rawValue => {
              return {
                content: {
                  type: rawValue,
                },
              };
            }); */

            const e = {
              changes: {
                added: new Set(values),
                deleted: new Set([]),
                keys: new Map(keys.map((key, index) => {
                  const value = values[index];
                  return [
                    key,
                    {
                      action: 'add',
                      value: value.content.type,
                    },
                  ];
                })),
              },
            };
            observerEvents.push([impl, e]);
          }

          for (const k in impl.binding) {
            _recurse(impl.binding[k]);
          }
        } else {
          // nothing
        }
      };
      _recurse(state);
    };
    const _remapState = (oldState, newState) => {
      // remap old impls onto new bindings
      const _lookupKeyPath = (binding, keyPath) => {
        for (let i = 0; i < keyPath.length; i++) {
          const key = keyPath[i];
          if (key in binding) {
            binding = binding[key];
          } else {
            return undefined;
          }
        }
        return binding;
      };
      const _lookupKeyPathParent = (binding, keyPath) => {
        for (let i = 0; i < keyPath.length - 1; i++) {
          const key = keyPath[i];
          if (key in binding) {
            binding = binding[key];
          } else {
            return undefined;
          }
        }
        return binding;
      };
      const _recurseRemapState = (newBinding, keyPath) => {
        const oldBinding = _lookupKeyPath(oldState, keyPath);
        const newParent = keyPath.length > 0 ? _lookupKeyPathParent(newState, keyPath) : null;
        let oldImpl;
        if (oldBinding !== undefined) {
          oldImpl = bindingsMap.get(oldBinding);
          oldImpl.binding = newBinding;
          bindingsMap.set(newBinding, oldImpl);
          if (newParent) {
            bindingParentsMap.set(newBinding, newParent);
          }
        }
        
        if (oldImpl?.isZArray) {
          for (let i = 0; i < newBinding.e.length; i++) {
            const zid = newBinding.i[i];
            const index = oldBinding.i.indexOf(zid);
            _recurseRemapState(newBinding.e[i], keyPath.concat(['e', index]));
          }
        } else if (Array.isArray(newBinding)) {
          for (let i = 0; i < newBinding.length; i++) {
            _recurseRemapState(newBinding[i], keyPath.concat([i]));
          }
        } else if (newBinding !== null && typeof newBinding === 'object') {
          for (const k in newBinding) {
            _recurseRemapState(newBinding[k], keyPath.concat([k]));
          }
        } else {
          // nothing
        }
      };
      _recurseRemapState(newState, []);
    };
    
    _emitDeleteEvents(this.state);
    _remapState(this.state, state);
    _emitAddEvents(state);
    
    this.clock = clock;
    this.state = state;
    // this.historyData = new Uint8Array(HISTORY_DATA_SIZE);
    // this.historyOffsets = new Uint32Array(HISTORY_LENGTH);

    for (const [impl, e] of observerEvents) {
      impl.triggerObservers(e);
    }
  }
  getImplByKeyPathParent(keyPath, keyTypes) {
    let binding = this.state;
    let impl = bindingsMap.get(binding);
    for (let i = 0; i < keyPath.length - 1; i++) {
      const key = keyPath[i];
      const keyType = keyTypes[i];
      
      const child = (() => {
        switch (keyType) {
          case KEY_TYPES.ARRAY: return impl.get(key, ZArray);
          case KEY_TYPES.MAP: return impl.get(key, ZMap);
          case KEY_TYPES.VALUE: return impl.get(key);
          case (KEY_TYPES.ELEMENT|KEY_TYPES.ARRAY): return impl.getId(key, ZArray);
          case (KEY_TYPES.ELEMENT|KEY_TYPES.MAP): return impl.getId(key, ZMap);
          case (KEY_TYPES.ELEMENT|KEY_TYPES.VALUE): return impl.getId(key);
          default: return 'lol';
        }
      })();
``
      /* if (child === 'lol') {
        console.warn(`Key path does not exist`, JSON.stringify([keyType, KEY_TYPES.ARRAY]), keyPath, binding.array);
        throw new Error(`Key path ${keyPath} ${keyType} ${binding.array} does not exist`);
      } */

      if (child) {
        impl = child;
        binding = child.binding;
      } else {
        // console.warn('could not look up key path', [key, type], impl);
        return undefined;
      }
    }
    return impl;
  }
  clone() {
    const oldState = this.state;
    const newState = zbclone(this.state);
    // console.log('old history', this.state, this.history.length, this.history[0]);
    const newDoc = new ZDoc(
      newState,
      this.clock,
      this.historyData,
      this.historyOffsets,
    );

    // remap old impls onto new bindings
    const _recurseDocClone = (oldBinding, newBinding) => {
      const oldImpl = bindingsMap.get(oldBinding);
      if (oldImpl?.isZDoc) {
        for (const k in oldBinding) {
          _recurseDocClone(oldBinding[k], newBinding[k]);
          bindingParentsMap.set(newBinding[k], newBinding);
        }
      } else if (oldImpl?.isZArray) {
        const newImpl = new ZArray(newBinding, newDoc);
        bindingsMap.set(newBinding, newImpl);

        for (let i = 0; i < oldBinding.e.length; i++) {
          _recurseDocClone(oldBinding.e[i], newBinding.e[i]);

          const childImpl = bindingsMap.get(newBinding.e[i]);
          if (childImpl) {
            bindingParentsMap.set(newBinding.e[i], newBinding);
          }
        }
      } else if (oldImpl?.isZMap) {
        const newImpl = new ZMap(newBinding, newDoc);
        bindingsMap.set(newBinding, newImpl);

        for (const k in oldBinding) {
          _recurseDocClone(oldBinding[k], newBinding[k]);

          const childImpl = bindingsMap.get(newBinding[k]);
          if (childImpl) {
            bindingParentsMap.set(newBinding[k], newBinding);
          }
        }
      } else if (Array.isArray(oldBinding)) {
        for (let i = 0; i < oldBinding.length; i++) {
          _recurseDocClone(oldBinding[i], newBinding[i]);
        }
      } else if (oldBinding !== null && typeof oldBinding === 'object') {
        for (const k in oldBinding) {
          _recurseDocClone(oldBinding[k], newBinding[k]);
        }
      } else {
        // nothing
      }
    };
    _recurseDocClone(oldState, newState);

    return newDoc;
  }
}

const KEY_TYPES = {
  NONE: 0,
  ARRAY: 1,
  MAP: 2,
  VALUE: 4,
  ELEMENT: 8,
};
const _getImplKeyType = impl => {
  if (impl?.isZArray) {
    return KEY_TYPES.ARRAY;
  } else if (impl?.isZMap) {
    return KEY_TYPES.MAP;
  } else {
    return KEY_TYPES.NONE;
  }
};
const _getImplConstructorForKeyType = type => {
  if (type & KEY_TYPES.ARRAY) {
    return ZArray;
  } else if (type & KEY_TYPES.MAP) {
    return ZMap;
  } else {
    return null;
  }
};
class ZObservable {
  constructor(binding, doc) {
    this.binding = binding;
    this.doc = doc;
  }
  observe(fn) {
    let observers = observersMap.get(this);
    if (!observers) {
      observers = [];
      observersMap.set(this, observers);
    }
    observers.push(fn);
  }
  unobserve(fn) {
    const observers = observersMap.get(this);
    if (observers) {
      const index = observers.indexOf(fn);
      if (index !== -1) {
        observers.splice(index, 1);
      }
    }
  }
  triggerObservers(e) {
    const observers = observersMap.get(this);
    if (observers) {
      for (const fn of observers) {
        fn(e);
      }
    }
  }
  getKeyPathSpec() {
    const keyPath = [];
    const keyTypes = [];
    for (let binding = this.binding;;) {
      const parentBinding = bindingParentsMap.get(binding);

      if (parentBinding) {
        const parentImpl = bindingsMap.get(parentBinding);
        if (parentImpl) {
          if (parentImpl.isZDoc) {
            let key;
            for (const k in parentBinding) {
              if (parentBinding[k] === binding) {
                key = k;
                break;
              }
            }

            const impl = bindingsMap.get(binding);
            const keyType = _getImplKeyType(impl);

            keyPath.push(key);
            keyTypes.push(keyType);
          } else if (parentImpl.isZArray) {
            const index = parentImpl.binding.e.indexOf(binding);
            const zid = parentImpl.binding.i[index];
            const impl = bindingsMap.get(binding);
            const type = (_getImplKeyType(impl) || KEY_TYPES.VALUE) | KEY_TYPES.ELEMENT;
            keyPath.push(zid);
            keyTypes.push(type);
          } else if (parentImpl.isZMap) {
            let key;
            for (const k in parentBinding) {
              if (parentBinding[k] === binding) {
                key = k;
                break;
              }
            }

            const impl = bindingsMap.get(binding);
            const keyType = _getImplKeyType(impl) || KEY_TYPES.VALUE;

            keyPath.push(key);
            keyTypes.push(keyType);
          } else {
            console.log('failed to find binding getting key path', binding);
          }
        }
        binding = parentBinding;
      } else {
        break;
      }
    }
    return {
      keyPath: keyPath.reverse(),
      keyTypes: keyTypes.reverse(),
    };
  }
  toJSON() {
    return this.binding;
  }
}

const _ensureImplBound = (v, parent) => {
  const isZArray = v?.isZArray;
  const isZMap = v?.isZMap;
  if (isZArray || isZMap) {
    bindingsMap.set(v.binding, v);
    bindingParentsMap.set(v.binding, parent.binding);
    v.doc = parent.doc;

    const _recurseChildren = o => {
      if (o?.isZMap) {
        o.doc = parent.doc;
        for (const k in o.binding) {
          const impl = bindingsMap.get(o.binding[k]);
          if (impl) {
            _recurseChildren(impl);
          }
        }
      }
      if (o?.isZArray) {
        o.doc = parent.doc;
        for (const e of o.binding.e) {
          const impl = bindingsMap.get(e);
          if (impl) {
            _recurseChildren(impl);
          }
        }
      }
    };
    _recurseChildren(v);
  }
};
class ZMap extends ZObservable {
  constructor(binding = ZMap.nativeConstructor(), doc = null) {
    super(binding, doc);
    
    this.isZMap = true;
  }
  static nativeConstructor = () => ({});
  has(k) {
    return k in this.binding;
  }
  get(k, Type) {
    if (Type) {
      let binding = this.binding[k];
      if (binding === undefined) {
        binding = Type.nativeConstructor();
        this.binding[k] = binding;
        // throw new Error('map lookup nonexistent typed element');
        // return undefined;
      }
      let impl = bindingsMap.get(binding);
      if (!impl) {
        impl = new Type(binding, this.doc);
        bindingsMap.set(binding, impl);
        bindingParentsMap.set(binding, this.binding);
      }
      return impl;
    } else {
      const v = this.binding[k];
      return bindingsMap.get(v) ?? v;
    }
  }
  set(k, v) {
    _ensureImplBound(v, this);

    const {keyPath, keyTypes} = this.getKeyPathSpec();
    const keyType = _getImplKeyType(v) || KEY_TYPES.VALUE;
    keyPath.push(k);
    keyTypes.push(keyType);
    const event = new ZMapSetEvent(
      keyPath,
      keyTypes,
      v
    );
    event.bindToImpl(this);
    if (this.doc) {
      this.doc.pushTransaction();
      this.doc.transactionCache.pushEvent(event);
    }
    event.apply();
    const e = event.getObserverEvent();
    if (this.doc) {
      this.doc.transactionCache.pushObserverEvent(event.impl, e);
      this.doc.popTransaction();
    } else {
      this.triggerObservers(e);
    }
  }
  delete(k) {
    delete this.binding[k];
    const {keyPath, keyTypes} = this.getKeyPathSpec();
    keyPath.push(k);
    keyTypes.push(KEY_TYPES.MAP);
    const event = new ZMapDeleteEvent(
      keyPath,
      keyTypes
    );
    event.bindToImpl(this);
    if (this.doc) {
      this.doc.pushTransaction();
      this.doc.transactionCache.pushEvent(event);
    }
    event.apply();
    const e = event.getObserverEvent();
    if (this.doc) {
      this.doc.transactionCache.pushObserverEvent(event.impl, e);
      this.doc.popTransaction();
    } else {
      this.triggerObservers(e);
    }
  }
  get _map() { // match yjs api
    const result = new Map();
    for (const k in this.binding) {
      const rawValue = this.binding[k];
      const value = bindingsMap.get(rawValue) ?? rawValue;
      result.set(k, {
        content: {
          arr: [
            value,
          ],
        },
      });
    }
    return result;
  }
  keys() {
    const keys = Object.keys(this.binding);
    let i = 0;
    const next = () => {
      if (i < keys.length) {
        const key = keys[i++];
        return {
          done: false,
          value: key,
        };
      } else {
        return {
          done: true,
          value: null,
        };
      }
    };
    return {
      next,
      [Symbol.iterator]: () => ({next}),
    };
  }
  values() {
    const keys = Object.keys(this.binding);
    let i = 0;
    const next = () => {
      if (i < keys.length) {
        const key = keys[i++];
        const rawValue = this.get(key);
        const type = bindingsMap.get(rawValue) ?? rawValue;
        const value = {
          content: {
            type,
          },
        };
        return {
          done: false,
          value,
        };
      } else {
        return {
          done: true,
          value: null,
        };
      }
    };
    return {
      next,
      [Symbol.iterator]: () => ({next}),
    };
  }
  entries() {
    const keys = Object.keys(this.binding);
    let i = 0;
    const next = () => {
      if (i < keys.length) {
        const key = keys[i++];
        const rawValue = this.get(key);
        const type = bindingsMap.get(rawValue) ?? rawValue;
        const value = {
          content: {
            type,
          },
        };
        return {
          done: false,
          value: [key, value],
        };
      } else {
        return {
          done: true,
          value: null,
        };
      }
    };
    return {
      next,
      [Symbol.iterator]: () => ({next}),
    };
  }
}

class ZArray extends ZObservable {
  constructor(binding = ZArray.nativeConstructor(), doc = null) {
    super(binding, doc);
    
    this.isZArray = true;
  }
  static nativeConstructor = () => ({
    e: [],
    i: [],
  });
  get length() {
    return this.binding.e.length;
  }
  set length(length) {
    throw new Error('ZArray.length is read-only');
    /* this.binding.e.length = length;
    this.binding.i.length = length; */
  }
  get(index, Type) {
    if (Type) {
      let binding = this.binding.e[index];
      if (binding === undefined) {
        // binding = Type.nativeConstructor();
        // this.state[k] = binding;
        // throw new Error('array lookup nonexistent typed element');
        return undefined;
      }
      let impl = bindingsMap.get(binding);
      if (!impl) {
        impl = new Type(binding, this.doc);
        bindingsMap.set(binding, impl);
        bindingParentsMap.set(binding, this.binding);
      }
      return impl;
    } else {
      const value = this.binding.e[index];
      return bindingsMap.get(value) ?? value;
    }
  }
  getId(zid, Type) {
    const index = this.binding.i.indexOf(zid);
    if (index !== -1) {
      return this.get(index, Type);
    } else {
      return undefined;
    }
  }
  push(arr) {
    if (arr.length !== 1) {
      throw new Error('only length 1 is supported');
    }

    for (const e of arr) {
      _ensureImplBound(e, this);
    }
    
    const zid = _makeId().toString(16);
    
    const {keyPath, keyTypes} = this.getKeyPathSpec();
    const impl = bindingsMap.get(arr[0]) ?? arr[0];
    const keyType = (_getImplKeyType(impl) || KEY_TYPES.VALUE) | KEY_TYPES.ELEMENT;
    keyPath.push(zid);
    keyTypes.push(keyType);
    const event = new ZArrayPushEvent(
      keyPath,
      keyTypes,
      arr
    );
    event.bindToImpl(this);
    if (this.doc) {
      this.doc.pushTransaction();
      this.doc.transactionCache.pushEvent(event);
    }
    event.apply();
    const e = event.getObserverEvent();
    if (this.doc) {
      this.doc.transactionCache.pushObserverEvent(event.impl, e);
      this.doc.popTransaction();
    } else {
      this.triggerObservers(e);
    }
  }
  delete(index, length = 1) {
    if (length !== 1) {
      throw new Error('only length 1 is supported');
    }
    
    const zid = this.binding.i[index];
    
    const {keyPath, keyTypes} = this.getKeyPathSpec();
    keyPath.push(zid);
    keyTypes.push(KEY_TYPES.ELEMENT|KEY_TYPES.VALUE);
    const event = new ZArrayDeleteEvent(
      keyPath,
      keyTypes,
    );
    event.bindToImpl(this);
    if (this.doc) {
      this.doc.pushTransaction();
      this.doc.transactionCache.pushEvent(event);
    }
    event.apply();
    const e = event.getObserverEvent();
    if (this.doc) {
      this.doc.transactionCache.pushObserverEvent(event.impl, e);
      this.doc.popTransaction();
    } else {
      this.triggerObservers(e);
    }
  }
  forEach(callback, thisArg) {
    for (let i = 0; i < this.binding.e.length; i++) {
      callback.call(thisArg, this.get(i), i, this);
    }
  }
  toJSON() {
    return this.binding.e.map(_jsonify);
  }
  [Symbol.iterator] = () => {
    let i = 0;
    return {
      next: () => {
        if (i < this.length) {
          const rawValue = this.get(i++);
          const value = bindingsMap.get(rawValue) ?? rawValue;
          return {
            done: false,
            value,
          };
        } else {
          return {
            done: true,
            value: null,
          };
        }
      },
    };
  }
}

const uint8ArrayBuffer = new Uint8Array(1024); // 1 kb
const _parseKeyPathBuffer = uint8Array => {
  const keyPath = [];
  let index = 0;
  while (index < uint8Array.length) {
    const nextNullIndex = uint8Array.indexOf(0, index);
    const key = textDecoder.decode(uint8Array.subarray(index, nextNullIndex));
    keyPath.push(key);
    index = nextNullIndex + 1;
  }
  return keyPath;
};

let zEventsIota = 0;
class ZEvent {
  constructor(keyPath, keyTypes) {
    this.keyPath = keyPath;
    this.keyTypes = keyTypes;

    this.impl = null;
    this.keyPathBuffer = null;
    this.keyTypesBuffer = null;
  }
  bindToDoc(doc) {
    if (doc) {
      this.impl = doc.getImplByKeyPathParent(this.keyPath, this.keyTypes);
      if (!this.impl) {
        console.warn('cannot bind impl to key path', doc.state, this.keyPath, this.keyTypes);
        throw new Error('cannot bind impl to key path');
      }
    } else {
      this.impl = null;
    }
  }
  bindToImpl(impl) {
    this.impl = impl;
  }
  getObserverEvent() {
    const actionSpec = this.getAction();
    if (actionSpec) {
      const value = bindingsMap.get(actionSpec.value) ?? actionSpec.value;
      const added = new Set(/add|update/.test(actionSpec.action) ? [{
        content: {
          type: value,
        },
      }] : []);
      const deleted = new Set(actionSpec.action === 'delete' ? [{
        content: {
          type: value,
        },
      }] : []);
      return {
        changes: {
          added,
          deleted,
          keys: new Map([[
            actionSpec.key,
            {
              action: actionSpec.action,
              value,
            },
          ]]),
        },
      };
    } else {
      return null;
    }
  }
  getKey() {
    return this.keyPath[this.keyPath.length - 1];
  }
  getKeyPathBuffer() {
    if (this.keyPathBuffer === null) {
      let index = 0;
      for (let i = 0; i < this.keyPath.length; i++) {
        const key = this.keyPath[i];
        const {written} = textEncoder.encodeInto(key, uint8ArrayBuffer.subarray(index));
        index += written;

        uint8ArrayBuffer[index++] = 0; // null separator
      }
      this.keyPathBuffer = uint8ArrayBuffer.slice(0, index);
    }
    return this.keyPathBuffer;
  }
  getKeyTypesBuffer() {
    if (this.keyTypesBuffer === null) {
      this.keyTypesBuffer = new Uint8Array(this.keyTypes.length);
      for (let i = 0; i < this.keyTypes.length; i++) {
        this.keyTypesBuffer[i] = this.keyTypes[i];
      }
    }
    return this.keyTypesBuffer;
  }
  computeUpdateByteLength() {
    throw new Error('not implemented');
  }
  serializeUpdate(uint8Array) {
    throw new Error('not implemented');
  }
  static deserializeUpdate(uint8Array) {
    throw new Error('not implemented');
  }
  serializeHistory(resolvePriority, uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    dataView.setUint32(index, this.constructor.METHOD, true);
    index += Uint32Array.BYTES_PER_ELEMENT;

    dataView.setUint32(index, resolvePriority, true);
    index += Uint32Array.BYTES_PER_ELEMENT;

    const kpjb = this.getKeyPathBuffer();
    dataView.setUint32(index, kpjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(kpjb, index);
    index += kpjb.byteLength;
    index = align4(index);

    return index;
  }
  clone() {
    const event = new this.constructor(...this.getConstructorArgs());
    event.impl = this.impl;
    return event;
  }
}
class ZNullEvent extends ZEvent {
  constructor() {
    super([], []);
    
    this.isZNullEvent = true;
  }
  static METHOD = ++zEventsIota;
  apply() {
    // nothing
  }
  getConstructorArgs() {
    return [];
  }
  getAction() {
    return null;
  }
  computeUpdateByteLength() {
    let totalSize = 0;
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // method
    
    return totalSize;
  }
  serializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    dataView.setUint32(index, this.constructor.METHOD, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
  }
  static deserializeUpdate(uint8Array) {
    return nullEvent;
  }
}
class ZMapEvent extends ZEvent {
  constructor(keyPath, keyTypes) {
    super(keyPath, keyTypes);

    this.key = null;
    this.value = null;
    this.keyBuffer = null;
    this.valueBuffer = null;
    
    this.isZMapEvent = true;
  }
  getKeyBuffer() {
    if (this.keyBuffer === null) {
      this.keyBuffer = textEncoder.encode(this.key);
    }
    return this.keyBuffer;
  }
  getValueBuffer() {
    if (this.valueBuffer === null) {
      this.valueBuffer = zbencode(this.value);
    }
    return this.valueBuffer;
  }
}
class ZArrayEvent extends ZEvent {
  constructor(keyPath, keyTypes) {
    super(keyPath, keyTypes);
    
    this.arr = null;
    this.arrBuffer = null;
    
    this.isZArrayEvent = true;
  }
  getArrBuffer() {
    if (this.arrBuffer === null) {
      this.arrBuffer = zbencode(this.arr);
    }
    return this.arrBuffer;
  }
}
class ZMapSetEvent extends ZMapEvent {
  constructor(keyPath, keyTypes, value) {
    super(keyPath, keyTypes);
    
    this.value = _getBindingForValue(value);
    
    this.isZMapSetEvent = true;
  }
  static METHOD = ++zEventsIota;
  static Type = ZMap;
  apply() {
    const key = this.getKey();
    this.impl.binding[key] = this.value;
  }
  getConstructorArgs() {
    return [this.keyPath, this.keyTypes, this.value];
  }
  getAction() {
    return {
      action: 'update',
      key: this.getKey(),
      value: this.value,
    };
  }
  computeUpdateByteLength() {
    let totalSize = 0;
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // method
    
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key path length
    totalSize += this.getKeyPathBuffer().byteLength; // key path data
    totalSize = align4(totalSize);

    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key types length
    totalSize += this.getKeyTypesBuffer().byteLength; // key types data
    totalSize = align4(totalSize);
    
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // value length
    totalSize += this.getValueBuffer().byteLength; // value data
    totalSize = align4(totalSize);
    
    return totalSize;
  }
  serializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    dataView.setUint32(index, this.constructor.METHOD, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const kpjb = this.getKeyPathBuffer();
    dataView.setUint32(index, kpjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(kpjb, index);
    index += kpjb.byteLength;
    index = align4(index);

    const ktjb = this.getKeyTypesBuffer();
    dataView.setUint32(index, ktjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(ktjb, index);
    index += ktjb.byteLength;
    index = align4(index);
    
    const vb = this.getValueBuffer();
    dataView.setUint32(index, vb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(vb, index);
    index += vb.byteLength;
    index = align4(index);
  }
  static deserializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    // skip method
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const kpjbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const keyPath = _parseKeyPathBuffer(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, kpjbLength));
    index += kpjbLength;
    index = align4(index);

    const ktjbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const keyTypes = Array.from(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, ktjbLength));
    index += ktjbLength;
    index = align4(index);

    const vbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const vb = new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, vbLength);
    const value = zbdecode(vb);
    index += vbLength;
    index = align4(index);

    return new this(
      keyPath,
      keyTypes,
      value
    );
  }
}
class ZMapDeleteEvent extends ZMapEvent {
  constructor(keyPath, keyTypes, oldValue = null) {
    super(keyPath, keyTypes);

    this.oldValue = oldValue;
    
    this.isZMapDeleteEvent = true;
  }
  static METHOD = ++zEventsIota;
  static Type = ZMap;
  apply() {
    const key = this.getKey();
    this.oldValue = this.impl.binding[key];
    delete this.impl.binding[key];
  }
  getConstructorArgs() {
    return [this.keyPath, this.keyTypes, this.oldValue];
  }
  getAction() {
    return {
      action: 'delete',
      key: this.getKey(),
      value: this.oldValue,
    };
  }
  computeUpdateByteLength() {
    let totalSize = 0;
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // method
    
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key path length
    totalSize += this.getKeyPathBuffer().byteLength; // key path data
    totalSize = align4(totalSize);

    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key types length
    totalSize += this.getKeyTypesBuffer().byteLength; // key types data
    totalSize = align4(totalSize);
    
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key length
    totalSize += this.getKeyBuffer().byteLength; // key data
    totalSize = align4(totalSize);
    
    return totalSize;
  }
  serializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    dataView.setUint32(index, this.constructor.METHOD, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const kpjb = this.getKeyPathBuffer();
    dataView.setUint32(index, kpjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(kpjb, index);
    index += kpjb.byteLength;
    index = align4(index);

    const ktjb = this.getKeyTypesBuffer();
    dataView.setUint32(index, ktjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(ktjb, index);
    index += ktjb.byteLength;
    index = align4(index);
    
    const kb = this.getKeyBuffer();
    dataView.setUint32(index, kb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(kb, index);
    index += kb.byteLength;
    index = align4(index);
  }
  static deserializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    // skip method
    index += Uint32Array.BYTES_PER_ELEMENT;

    const kpjbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const keyPath = _parseKeyPathBuffer(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, kpjbLength));
    index += kpjbLength;
    index = align4(index);

    const ktjbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const keyTypes = Array.from(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, ktjbLength));
    index += ktjbLength;
    index = align4(index);

    const kbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const kb = new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, kbLength);
    const key = textDecoder.decode(kb);
    index += kbLength;
    index = align4(index);
    
    return new this(
      keyPath,
      keyTypes,
      key
    );
  }
}
class ZArrayPushEvent extends ZArrayEvent {
  constructor(keyPath, keyTypes, arr) {
    super(keyPath, keyTypes);

    this.arr = _getBindingForArray(arr);
    this.index = -1;
    
    this.isZArrayPushEvent = true;
  }
  static METHOD = ++zEventsIota;
  static Type = ZArray;
  apply() {
    const arrBinding = this.arr;
    this.index = this.impl.binding.e.length;
    this.impl.binding.e.push.apply(this.impl.binding.e, arrBinding);
    const zid = this.keyPath[this.keyPath.length - 1];
    this.impl.binding.i.push(zid);

    const keyType = this.keyTypes[this.keyTypes.length - 1];
    const Type = _getImplConstructorForKeyType(keyType);
    const value = this.arr[0];
    let impl = bindingsMap.get(value);
    if (Type && !(impl instanceof Type)) {
      const binding = value;
      impl = new Type(binding, this.impl.doc);
      bindingsMap.set(binding, impl);
      bindingParentsMap.set(binding, this.impl.binding);
      // console.log('forge array value during apply', binding, impl);
    }
  }
  getConstructorArgs() {
    return [this.keyPath, this.keyTypes, this.arr];
  }
  getAction() {
    const keyType = this.keyTypes[this.keyTypes.length - 1];
    const Type = _getImplConstructorForKeyType(keyType);
    const value = this.arr[0];
    let impl = bindingsMap.get(value);
    if (Type && !(impl instanceof Type)) {
      const binding = value;
      impl = new Type(binding, this.impl.doc);
      bindingsMap.set(binding, impl);
      bindingParentsMap.set(binding, this.impl.binding);
      // console.log('forge array value during change event emit', binding, impl);
    }

    return {
      action: 'add',
      key: this.index,
      value: this.arr[0],
    };
  }
  computeUpdateByteLength() {
    let totalSize = 0;
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // method
    
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key path length
    totalSize += this.getKeyPathBuffer().byteLength; // key path data
    totalSize = align4(totalSize);

    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key types length
    totalSize += this.getKeyTypesBuffer().byteLength; // key types data
    totalSize = align4(totalSize);
    
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // arr length
    totalSize += this.getArrBuffer().byteLength; // arr data
    totalSize = align4(totalSize);
    
    return totalSize;
  }
  serializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    dataView.setUint32(index, this.constructor.METHOD, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const kpjb = this.getKeyPathBuffer();
    dataView.setUint32(index, kpjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(kpjb, index);
    index += kpjb.byteLength;
    index = align4(index);

    const ktjb = this.getKeyTypesBuffer();
    dataView.setUint32(index, ktjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(ktjb, index);
    index += ktjb.byteLength;
    index = align4(index);
    
    const arrb = this.getArrBuffer();
    dataView.setUint32(index, arrb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    uint8Array.set(arrb, index);
    index += arrb.byteLength;
    index = align4(index);
  }
  static deserializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    // skip method
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const kpjbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const keyPath = _parseKeyPathBuffer(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, kpjbLength));
    index += kpjbLength;
    index = align4(index);

    const ktjbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const keyTypes = Array.from(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, ktjbLength));
    index += ktjbLength;
    index = align4(index);

    const arrLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const arrb = new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, arrLength);
    const arr = zbdecode(arrb);
    index += arrLength;
    index = align4(index);
    
    return new this(
      keyPath,
      keyTypes,
      arr
    );
  }
}
class ZArrayDeleteEvent extends ZArrayEvent {
  constructor(keyPath, keyTypes) {
    super(keyPath, keyTypes);

    this.index = -1;
    this.oldValue = null;
    
    this.isZArrayDeleteEvent = true;
  }
  static METHOD = ++zEventsIota;
  static Type = ZArray;
  apply() {
    const zid = this.keyPath[this.keyPath.length - 1];
    this.index = this.impl.binding.i.indexOf(zid);
    this.oldValue = this.impl.binding.e.splice(this.index, 1)[0];
    this.impl.binding.i.splice(this.index, 1);
  }
  getConstructorArgs() {
    return [this.keyPath, this.keyTypes];
  }
  getAction() {
    return {
      action: 'delete',
      key: this.index,
      value: this.oldValue,
    };
  }
  computeUpdateByteLength() {
    let totalSize = 0;
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // method
    
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key path length
    totalSize += this.getKeyPathBuffer().byteLength; // key path data
    totalSize = align4(totalSize);

    totalSize += Uint32Array.BYTES_PER_ELEMENT; // key types length
    totalSize += this.getKeyTypesBuffer().byteLength; // key types data
    totalSize = align4(totalSize);
    
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // op index
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // op length
    
    return totalSize;
  }
  serializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    dataView.setUint32(index, this.constructor.METHOD, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const kpjb = this.getKeyPathBuffer();
    dataView.setUint32(index, kpjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(kpjb, index);
    index += kpjb.byteLength;
    index = align4(index);

    const ktjb = this.getKeyTypesBuffer();
    dataView.setUint32(index, ktjb.byteLength, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    uint8Array.set(ktjb, index);
    index += ktjb.byteLength;
    index = align4(index);
  }
  static deserializeUpdate(uint8Array) {
    const dataView = _makeDataView(uint8Array);
    
    let index = 0;
    // skip method
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const kpjbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const keyPath = _parseKeyPathBuffer(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, kpjbLength));
    index += kpjbLength;
    index = align4(index);

    const ktjbLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    const keyTypes = Array.from(new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, ktjbLength));
    index += ktjbLength;
    index = align4(index);
    
    return new this(
      keyPath,
      keyTypes,
    );
  }
}
const ZEVENT_CONSTRUCTORS = [
  null, // start at 1
  ZNullEvent,
  ZMapSetEvent,
  ZMapDeleteEvent,
  ZArrayPushEvent,
  ZArrayDeleteEvent,
];
const nullEvent = new ZNullEvent();

// globalThis.maxHistoryLength = 0;
// globalThis.maxHistoryTailLength = 0;
function applyUpdate(doc, uint8Array, transactionOrigin, playerId) {
  const dataView = _makeDataView(uint8Array);
  
  let index = 0;
  const method = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  
  const _handleStateMessage = () => {
    const clock = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const encodedData = new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index);
    const state = zbdecode(encodedData);
    doc.setClockState(clock, state);

    if (doc.mirror) {
      // console.log('mirror yes');
      doc.dispatchEvent('update', encodedData, transactionOrigin, this, null);
    } /* else {
      console.log('mirror no');
    } */
  };
  const _handleTransactionMessage = () => {
    let transactionCache = TransactionCache.deserializeUpdate(uint8Array);
    transactionCache.doc = doc;
    transactionCache.origin = transactionOrigin;

    // rebase on top of local history as needed
    if (transactionCache.startClock === doc.clock) {
      // nothing
    } else if (transactionCache.startClock < doc.clock) {
      transactionCache.rebase();
    } else {
      throw new Error('transaction skipped clock ticks; desynced');
    }

    for (const event of transactionCache.events) {
      event.bindToDoc(transactionCache.doc);
      event.apply();
      if (event.impl?.isZArray || event.impl?.isZMap) {
        transactionCache.pushObserverEvent(event.impl, event.getObserverEvent());
      }
    }

    for (const event of transactionCache.events) {
      doc.pushHistory(transactionCache.resolvePriority, event);
    }

    if (doc.mirror) {
      // console.log('mirror yes');
      transactionCache.resolvePriority = doc.resolvePriority;
      const uint8Array = transactionCache.serializeUpdate();
      doc.dispatchEvent('update', uint8Array, transactionOrigin, this, null);
    } /* else {
      console.log('mirror no');
    } */
    transactionCache.triggerObserverEvents();
  };
  switch (method) {
    case MESSAGES.STATE_RESET: {
      _handleStateMessage();
      break;
    }
    case MESSAGES.TRANSACTION: {
      _handleTransactionMessage();
      break;
    }
    default: {
      console.warn('unknown method:', method);
      break;
    }
  }
}

function encodeStateAsUpdate(doc) {
  const encodedData = zbencode(doc.state);
  
  const totalSize =
    Uint32Array.BYTES_PER_ELEMENT +
    Uint32Array.BYTES_PER_ELEMENT +
    encodedData.byteLength;
  const ab = new ArrayBuffer(totalSize);
  const uint8Array = new Uint8Array(ab);
  const dataView = new DataView(ab);
  
  let index = 0;
  dataView.setUint32(index, MESSAGES.STATE_RESET, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  
  dataView.setUint32(index, doc.clock, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  
  uint8Array.set(new Uint8Array(encodedData.buffer, encodedData.byteOffset, encodedData.byteLength), index);
  index += encodedData.byteLength;
  
  return uint8Array;
}

export {
  ZDoc as Doc,
  ZMap as Map,
  ZArray as Array,
  TransactionCache,
  applyUpdate,
  encodeStateAsUpdate,
  setRng,
  zbencode,
  zbdecode,
};

const Z = {
  Doc: ZDoc,
  Map: ZMap,
  Array: ZArray,
  TransactionCache,
  applyUpdate,
  encodeStateAsUpdate,
  setRng,
  zbencode,
  zbdecode,
};
export default Z;
/* globalThis.Z = Z; // XXX testing only

import * as Y from 'yjs'; // XXX testing only
globalThis.Y = Y; */