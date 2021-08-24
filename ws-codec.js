import {channelCount, sampleRate, bitrate} from './ws-constants.js';

const muxAndSend = encodedChunk => {
  // console.log('got chunk', encodedChunk);
  const {type, timestamp, duration} = encodedChunk;
  const byteLength = encodedChunk.copyTo ?
    encodedChunk.byteLength
  :
    encodedChunk.data.byteLength;
  const data = new Uint8Array(
    Uint32Array.BYTES_PER_ELEMENT +
    byteLength
  );
  const uint32Array = new Uint32Array(data.buffer, data.byteOffset, 1);
  uint32Array[0] = this.ws.id;
  if (encodedChunk.copyTo) { // new api
    encodedChunk.copyTo(new Uint8Array(data.buffer, data.byteOffset + Uint32Array.BYTES_PER_ELEMENT));
  } else { // old api
    data.set(new Uint8Array(encodedChunk.data), Uint32Array.BYTES_PER_ELEMENT);
  }
  this.ws.send(JSON.stringify({
    method: 'audio',
    id: this.ws.id,
    args: {
      type,
      timestamp,
      duration,
    },
  }));
  this.ws.send(data);
};
function onEncoderError(err) {
  console.warn('encoder error', err);
}
const audioEncoder = new AudioEncoder({
  output: muxAndSend,
  error: onEncoderError,
});
audioEncoder.configure({
  codec: 'opus',
  numberOfChannels: channelCount,
  sampleRate,
  bitrate,
});

const _makeAudioDecoder = id => {
  const audioDecoder = new AudioDecoder({
    output: demuxAndPlay,
    error: onDecoderError,
  });
  audioDecoder.configure({
    codec: 'opus',
    numberOfChannels: channelCount,
    sampleRate,
  });
  
  function demuxAndPlay(audioData) {
    // console.log('demux', audioData);
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
    postMessage({
      method: 'decode',
      id,
      args: {
        data: channelData,
      },
    }, [channelData.buffer]);
  }
  function onDecoderError(err) {
    console.warn('decoder error', err);
  }
  
  let timeout = 0;
  audioDecoder.tick = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      audioDecoders.delete(id);
    }, 1000);
  };
  return audioDecoder;
};
const audioDecoders = new Map();

onmessage = e => {
  const {method} = e.data;
  switch (method) {
    case 'decode': {
      const {id, args} = e.data;
      let audioDecoder = audioDecoders.get(id);
      if (!audioDecoder) {
        audioDecoder = _makeAudioDecoder(id);
        audioDecoders.set(id, audioDecoder);
      }
      audioDecoder.tick();
      const encodedAudioChunk = new EncodedAudioChunk(args);
      audioDecoder.decode(encodedAudioChunk);
      break;
    }
  }
};