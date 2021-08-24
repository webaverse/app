import {channelCount, sampleRate, bitrate} from './ws-constants.js';

let audioCtx = null;
const _ensureAudioContextInit = async () => {
  if (!audioCtx) {
    audioCtx = new AudioContext({
      latencyHint: 'interactive',
      sampleRate,
    });
    await audioCtx.audioWorklet.addModule('ws-worklet.js');
  }
};

class Player extends EventTarget {
  constructor(id) {
    super();
    
    this.id = id;
    this.lastMessage = null;
    
    const demuxAndPlay = audioData => {
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
      audioWorkletNode.port.postMessage(channelData, [channelData.buffer]);
    };
    function onDecoderError(err) {
      console.warn('decoder error', err);
    }
    const audioDecoder = new AudioDecoder({
      output: demuxAndPlay,
      error: onDecoderError,
    });
    audioDecoder.configure({
      codec: 'opus',
      numberOfChannels: channelCount,
      sampleRate,
    });
    this.audioDecoder = audioDecoder;
    
    const audioWorkletNode = new AudioWorkletNode(audioCtx, 'ws-worklet');
    audioWorkletNode.connect(audioCtx.destination);
    this.addEventListener('leave', () => {
      audioWorkletNode.disconnect();
    });
    
    this.audioNode = audioWorkletNode;
  }
  toJSON() {
    const {id} = this;
    return {
      id,
    };
  }
}
class XRRTC extends EventTarget {
  constructor(u) {
    super();
    
    this.state = 'closed';
    this.ws = null;
    this.users = new Map();
    this.mediaStream = null;
    
    this.addEventListener('close', () => {
      this.users = new Map();
      this.disableMic();
    });

    const ws = new WebSocket(u);
    this.ws = ws;
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('open', () => {
      const initialMessage = e => {
        if (typeof e.data === 'string') {
          const j = JSON.parse(e.data);
          const {method} = j;
          switch (method) {
            case 'init': {
              const {args: {id, users}} = j;
              console.log('init: ' + JSON.stringify({
                id,
                users,
              }, null, 2));
              
              this.state = 'open';
              this.dispatchEvent(new MessageEvent('open'));
              
              for (const userId of users) {
                if (userId !== id) {
                  const player = new Player(userId);
                  this.users.set(userId, player);
                  this.dispatchEvent(new MessageEvent('join', {
                    data: player,
                  }));
                }
              }
              ws.id = id;
              ws.removeEventListener('message', initialMessage);
              ws.addEventListener('message', mainMessage);
              ws.addEventListener('close', e => {
                this.state = 'closed';
                this.ws = null;
                this.dispatchEvent(new MessageEvent('close'));
              });
              
              break;
            }
          }
        }
      };
      const mainMessage = e => {
        // console.log('got message', e);
        if (typeof e.data === 'string') {
          const j = JSON.parse(e.data);
          const {method} = j;
          switch (method) {
            case 'audio': {
              const {id} = j;
              // console.log('got audio prep message', j);
              const player = this.users.get(id);
              if (player) {
                player.lastMessage = j;
              } else {
                console.warn('audio message for unknown player ' + id);
              }
              break;
            }
            case 'join': {
              const {id} = j;
              const player = new Player(id);
              this.users.set(id, player);
              player.dispatchEvent(new MessageEvent('join'));
              this.dispatchEvent(new MessageEvent('join', {
                data: player,
              }));
              break;
            }
            case 'leave': {
              const {id} = j;
              const player = this.users.get(id);
              if (player) {
                this.users.delete(id);
                player.dispatchEvent(new MessageEvent('leave'));
                this.dispatchEvent(new MessageEvent('leave', {
                  data: player,
                }));
              } else {
                console.warn('leave message for unknown user ' + id);
              }
              break;
            }
            default: {
              console.warn('unknown message method: ' + method);
              break;
            }
          }
        } else {
          // console.log('got e', e.data);
          
          const uint32Array = new Uint32Array(e.data, 0, 1);
          const id = uint32Array[0];
          // console.log('got audio data', id);
          const player = this.users.get(id);
          if (player) {
            const j = player.lastMessage;
            if (j && j.method === 'audio') {
              player.lastMessage = null;
              const data = new Uint8Array(e.data, Uint32Array.BYTES_PER_ELEMENT);
              
              const {method} = j;
              switch (method) {
                case 'audio': {
                  const {args: {type, timestamp, duration}} = j;
                  const encodedAudioChunk = new EncodedAudioChunk({
                    type: 'key', // XXX: hack! when this is 'delta', you get Uncaught DOMException: Failed to execute 'decode' on 'AudioDecoder': A key frame is required after configure() or flush().
                    timestamp,
                    duration,
                    data,
                  });
                  player.audioDecoder.decode(encodedAudioChunk);
                  break;
                }
                default: {
                  console.warn('unknown last message method: ' + method);
                  break;
                }
              }
            } else {
              console.warn('throwing away out-of-order binary data for user ' + id);
            }
          } else {
            console.warn('received binary data for unknown user ' + id);
          }
        }
      };
      ws.addEventListener('message', initialMessage);
    });
    ws.addEventListener('error', err => {
      this.dispatchEvent(new MessageEvent('error', {
        data: err,
      }));
    });
  }
  close() {
    if (this.state === 'open') {
      this.ws.disconnect();
    } else {
      throw new Error('connection not open');
    }
  }
  async enableMic() {
    if (this.state !== 'open') {
      throw new Error('connection not open');
    }
    if (this.mediaStream) {
      throw new Error('mic already enabled');
    }
    
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount,
        sampleRate,
      },
    });
    
    const audioTracks = this.mediaStream.getAudioTracks();
    const audioTrack = audioTracks[0];
    // const audioTrackSettings = audioTrack.getSettings();
    const audio = (new MediaStreamTrackProcessor(audioTrack)).readable;
    const audioReader = audio.getReader();
    // console.log('got media', audioTrack, audioTrack.getSettings(), audio);
    
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
    
    function onEncoderError(err) {
      console.warn('encoder error', err);
    }
    async function readAndEncode() {
      const result = await audioReader.read();
      if (!result.done) {
        audioEncoder.encode(result.value);
        readAndEncode();
      }
    }
    
    readAndEncode();
  }
  disableMic() {
    if (this.mediaStream) {
      this.mediaStream.close();
      this.mediaStream = null;
    }
  }
}
XRRTC.waitForReady = async () => {
  await _ensureAudioContextInit();
};
XRRTC.getAudioContext = () => {
  _ensureAudioContextInit();
  return audioCtx;
};

window.addEventListener('click', async e => {
  await XRRTC.waitForReady();
  const xrrtc = new XRRTC('wss://' + window.location.host);
  xrrtc.addEventListener('open', e => {
    xrrtc.enableMic();
  });
  xrrtc.addEventListener('join', e => {
    const player = e.data;
    console.log('join', player);
    player.audioNode.connect(audioCtx.destination);
    player.addEventListener('leave', e => {
      console.log('leave', player);
    });
  });
});