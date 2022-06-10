import {align4} from './util.mjs';

const ADDENDUM_TYPES = (() => {
  let iota = 0;
  const result = new Map();
  result.set(Uint8Array, ++iota);
  result.set(Uint16Array, ++iota);
  result.set(Uint32Array, ++iota);
  result.set(Int8Array, ++iota);
  result.set(Int16Array, ++iota);
  result.set(Int32Array, ++iota);
  result.set(Float32Array, ++iota);
  result.set(Float64Array, ++iota);
  return result;
})();
const ADDENDUM_CONSTRUCTORS = [
  null, // start at 1
  Uint8Array,
  Uint16Array,
  Uint32Array,
  Int8Array,
  Int16Array,
  Int32Array,
  Float32Array,
  Float64Array,
];

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
let textUint8Array = new Uint8Array(1024 * 1024); // 1 MB

const encodableConstructors = [
  Uint8Array,
  Uint16Array,
  Uint32Array,
  Int8Array,
  Int16Array,
  Int32Array,
  Float32Array,
  Float64Array,
];
const _isAddendumEncodable = o =>
  encodableConstructors.includes(
    o?.constructor
  );
const nullUint8Array = textEncoder.encode('null');
function zbencode(o) {
  const addendums = [];
  const addendumIndexes = [];
  const addendumTypes = [];
  const _getSb = () => {
    if (_isAddendumEncodable(o)) { // common fast path
      addendums.push(o);
      addendumIndexes.push(1);
      addendumTypes.push(ADDENDUM_TYPES.get(o.constructor));
      return nullUint8Array;
    } else {
      let recursionIndex = 0;
      const _recurseExtractAddendums = o => {
        recursionIndex++;
        if (_isAddendumEncodable(o)) {
          addendums.push(o);
          addendumIndexes.push(recursionIndex);
          const addendumType = ADDENDUM_TYPES.get(o.constructor);
          addendumTypes.push(addendumType)
          return null;
        } else {
          return o;
        }
      };
      const s = JSON.stringify(o, function(k, v) {
        return _recurseExtractAddendums(v);
      });
      let result;
      for (;;) {
        result = textEncoder.encodeInto(s, textUint8Array);
        if (result.read === s.length) {
          break;
        } else {
          textUint8Array = new Uint8Array(textUint8Array.length * 2);
          console.warn('zjs: resizing buffer');
        }
      }
      return textUint8Array.subarray(0, result.written);
    }
  };
  const sb = _getSb();
    
  let totalSize = 0;
  totalSize += Uint32Array.BYTES_PER_ELEMENT; // length
  totalSize += sb.byteLength; // data
  totalSize = align4(totalSize);
  totalSize += Uint32Array.BYTES_PER_ELEMENT; // count
  for (const addendum of addendums) {
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // index
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // type
    totalSize += Uint32Array.BYTES_PER_ELEMENT; // length
    totalSize += addendum.byteLength; // data
    totalSize = align4(totalSize);
  }
  
  const ab = new ArrayBuffer(totalSize);
  const uint8Array = new Uint8Array(ab);
  const dataView = new DataView(ab);
  {
    let index = 0;
    // sb
    {
      dataView.setUint32(index, sb.byteLength, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      uint8Array.set(sb, index);
      index += sb.byteLength;
      index = align4(index);
    }
    // addendums
    dataView.setUint32(index, addendums.length, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    for (let i = 0; i < addendums.length; i++) {
      const addendum = addendums[i];
      const addendumIndex = addendumIndexes[i];
      const addendumType = addendumTypes[i];
      
      dataView.setUint32(index, addendumIndex, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      dataView.setUint32(index, addendumType, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      dataView.setUint32(index, addendum.byteLength, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      uint8Array.set(new Uint8Array(addendum.buffer, addendum.byteOffset, addendum.byteLength), index);
      index += addendum.byteLength;
      index = align4(index);
    }
  }
  return uint8Array;
}
function zbdecode(uint8Array) {
  const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
  
  let index = 0;
  const sbLength = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  
  const sb = new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index, sbLength);
  index += sbLength;
  index = align4(index);
  const s = textDecoder.decode(sb);
  let j = JSON.parse(s);
  
  const numAddendums = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  
  const addendums = Array(numAddendums);
  const addendumIndexes = Array(numAddendums);
  const addendumTypes = Array(numAddendums);
  for (let i = 0; i < numAddendums; i++) {
    const addendumIndex = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const addendumType = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const addendumLength = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;
    
    const TypedArrayCons = ADDENDUM_CONSTRUCTORS[addendumType];
    /* if (!TypedArrayCons) {
      console.warn('failed to find typed array cons for', addendumType);
    } */
    const addendum = new TypedArrayCons(
      uint8Array.buffer,
      uint8Array.byteOffset + index,
      addendumLength / TypedArrayCons.BYTES_PER_ELEMENT
    );
    index += addendumLength;
    index = align4(index);
    
    addendums[i] = addendum;
    addendumIndexes[i] = addendumIndex;
    addendumTypes[i] = addendumType;
  }
  
  {
    let recursionIndex = 0;
    let currentAddendum = 0;
    const _recurseBindAddendums = o => {
      recursionIndex++;
      
      const addendumIndex = addendumIndexes[currentAddendum];
      if (addendumIndex === recursionIndex) {
        const addendum = addendums[currentAddendum];
        currentAddendum++;
        return addendum;
      } else if (Array.isArray(o)) {
        for (let i = 0; i < o.length; i++) {
          const addendum = _recurseBindAddendums(o[i]);
          if (addendum) {
            o[i] = addendum;
          }
        }
      } else if (typeof o === 'object' && o !== null) {
        for (const k in o) {
          const addendum = _recurseBindAddendums(o[k]);
          if (addendum) {
            o[k] = addendum;
          }
        }
      }
      return null;
    };
    const j2 = _recurseBindAddendums(j);
    if (j2 !== null) {
      j = j2;
    }
    if (currentAddendum !== addendums.length) {
      console.warn('did not bind all addendums', j, currentAddendum, addendums);
    }
    return j;
  }
}

function zbclone(o) {
  return zbdecode(zbencode(o));
}

export {
  zbencode,
  zbdecode,
  zbclone,
};