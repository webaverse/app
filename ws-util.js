import {TYPE} from './ws-constants.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const encodedMessageUint8Array = new Uint8Array(4096);
const encodedMessageDataView = new DataView(encodedMessageUint8Array.buffer, encodedMessageUint8Array.byteOffset);
export const encodeMessage = parts => {
  let index = 0;
  for (const part of parts) {
    if (typeof part === 'number') {
      encodedMessageDataView.setUint32(index, part, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
    } else if (typeof part === 'string') {
      const {written} = textEncoder.encodeInto(part, new Uint8Array(encodedMessageUint8Array.buffer, encodedMessageUint8Array.byteOffset + index + Uint32Array.BYTES_PER_ELEMENT));
      encodedMessageDataView.setUint32(index, written, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      index += written;
    } else if (part.byteLength >= 0) {
      if (!part.staticSize) {
        encodedMessageDataView.setUint32(index, part.byteLength, true);
        index += Uint32Array.BYTES_PER_ELEMENT;
      }
      encodedMessageUint8Array.set(new Uint8Array(part.buffer, part.byteOffset, part.byteLength), index);
      index += part.byteLength;
    } else {
      throw new Error('unknown part: ' + JSON.stringify(part));
    }
  }
  return new Uint8Array(encodedMessageUint8Array.buffer, encodedMessageUint8Array.byteOffset, index);
};
export const encodeAudioMessage = (method, id, type, timestamp, data) => {
  let index = 0;
  encodedMessageDataView.setUint32(index, method, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  encodedMessageDataView.setUint32(index, id, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  encodedMessageDataView.setUint32(index, type === 'key' ? 0 : 1, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  encodedMessageDataView.setFloat32(index, timestamp, true);
  index += Float32Array.BYTES_PER_ELEMENT;
  encodedMessageDataView.setUint32(index, data.byteLength, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  encodedMessageUint8Array.set(data, index);
  index += data.byteLength;
  return new Uint8Array(encodedMessageUint8Array.buffer, encodedMessageUint8Array.byteOffset, index);
};
export const encodePoseMessage = (method, id, p, q, s, extraUint8ArrayFull, extraUint8ArrayByteLength) => {
  let index = 0;

  encodedMessageDataView.setUint32(index, method, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  encodedMessageDataView.setUint32(index, id, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  
  encodedMessageUint8Array.set(new Uint8Array(p.buffer, p.byteOffset, p.byteLength), index);
  index += p.byteLength;
  encodedMessageUint8Array.set(new Uint8Array(q.buffer, q.byteOffset, q.byteLength), index);
  index += q.byteLength;
  encodedMessageUint8Array.set(new Uint8Array(s.buffer, s.byteOffset, s.byteLength), index);
  index += s.byteLength;
  
  encodedMessageUint8Array.set(new Uint8Array(extraUint8ArrayFull.buffer, extraUint8ArrayFull.byteOffset, extraUint8ArrayByteLength), index);
  index += extraUint8ArrayByteLength;
  
  return new Uint8Array(encodedMessageUint8Array.buffer, encodedMessageUint8Array.byteOffset, index);
};
const _align = (index, n) => index + (n - (index % n));
const _align4 = index => _align(index, 4);
export const encodeTypedMessage = (uint8Array, parts) => {
  const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset);
  
  let index = 0;
  for (const part of parts) {
    if (typeof part === 'number') {
      if (Number.isInteger(part)) {
        dataView.setUint32(index, TYPE.INT, true);
        index += Uint32Array.BYTES_PER_ELEMENT;
        dataView.setUint32(index, part, true)
        index += Uint32Array.BYTES_PER_ELEMENT;
      } else {
        dataView.setUint32(index, TYPE.FLOAT, true);
        index += Uint32Array.BYTES_PER_ELEMENT;
        dataView.setFloat32(index, part, true);
        index += Float32Array.BYTES_PER_ELEMENT;
      }
    } else if (typeof part === 'string') {
      dataView.setUint32(index, TYPE.STRING, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      const {written} = textEncoder.encodeInto(part, new Uint8Array(uint8Array.buffer, uint8Array.byteOffset + index + Uint32Array.BYTES_PER_ELEMENT));
      dataView.setUint32(index, written, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      index += written;
      index = _align4(index);
    } else if (part instanceof Uint32Array) {
      dataView.setUint32(index, TYPE.UINT32ARRAY, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      dataView.setUint32(index, part.length, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      uint8Array.set(new Uint8Array(part.buffer, part.byteOffset, part.byteLength), index);
      index += part.byteLength;
    } else if (part instanceof Float32Array) {
      dataView.setUint32(index, TYPE.FLOAT32ARRAY, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      dataView.setUint32(index, part.length, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      uint8Array.set(new Uint8Array(part.buffer, part.byteOffset, part.byteLength), index);
      index += part.byteLength;
    } else if (part instanceof Uint8Array) {
      dataView.setUint32(index, TYPE.UINT32ARRAY, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      dataView.setUint32(index, part.length, true);
      index += Uint32Array.BYTES_PER_ELEMENT;
      
      uint8Array.set(part, index);
      index += part.byteLength;
      index = _align4(index);
    } else {
      throw new Error('unknown part: ' + JSON.stringify(part));
    }
  }
  return index;
};
export const decodeTypedMessage = (uint8Array, uint8ArrayByteLength, parts) => {
  const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset);
  
  parts.length = 0;
  for (let index = 0; index < uint8ArrayByteLength;) {
    const type = dataView.getUint32(index, true);
    index += Uint32Array.BYTES_PER_ELEMENT;

    switch (type) {
      case TYPE.INT: {
        const part = dataView.getUint32(index, true);
        parts.push(part);
        index += Uint32Array.BYTES_PER_ELEMENT;
        break;
      }
      case TYPE.FLOAT: {
        const part = dataView.getFloat32(index, true);
        parts.push(part);
        index += Float32Array.BYTES_PER_ELEMENT;
        break;
      }
      case TYPE.STRING: {
        const byteLength = dataView.getUint32(index, true);
        index += Uint32Array.BYTES_PER_ELEMENT;
        
        const part = textDecoder.decode(new Uint8Array(uint8Array.buffer, index, byteLength));
        parts.push(part);
        index += byteLength;
        index = _align4(index);
        break;
      }
      case TYPE.UINT32ARRAY: {
        const length = dataView.getUint32(index, true);
        index += Uint32Array.BYTES_PER_ELEMENT;
        
        const part = new Uint32Array(uint8Array.buffer, index, length);
        parts.push(part);
        index += part.byteLength;
        break;
      }
      case TYPE.FLOAT32ARRAY: {
        const length = dataView.getUint32(index, true);
        index += Uint32Array.BYTES_PER_ELEMENT;
        
        const part = new Float32Array(uint8Array.buffer, index, length);
        parts.push(part);
        index += part.byteLength;
        break;
      }
      case TYPE.UINT8ARRAY: {
        const length = dataView.getUint32(index, true);
        index += Uint32Array.BYTES_PER_ELEMENT;
        
        const part = new Uint8Array(uint8Array.buffer, index, length);
        parts.push(part);
        index += part.byteLength;
        index = _align4(index);
        break;
      }
      default: {
        throw new Error('cannot parse message part with type ' + type);
        break;
      }
    }
  }
};
export const getAudioDataBuffer = audioData => {
  let channelData;
  if (audioData.copyTo) { // new api
    channelData = new Float32Array(audioData.numberOfFrames);
    audioData.copyTo(channelData, {
      planeIndex: 0,
      frameCount: audioData.numberOfFrames,
    });
  } else { // old api
    channelData = audioData.buffer.getChannelData(0);
  }
  return channelData;
};
export const getEncodedAudioChunkBuffer = encodedAudioChunk => {
  if (encodedAudioChunk.copyTo) { // new api
    const data = new Uint8Array(encodedAudioChunk.byteLength);
    encodedAudioChunk.copyTo(data);
    return data;
  } else { // old api
    return new Uint8Array(encodedAudioChunk.data);
  }
};