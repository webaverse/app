const channelCount = 1;
const sampleRate = 48000;
const bitrate = 60000;

let audioCtx = null;
const _ensureInit = async () => {
  if (!audioCtx) {
    audioCtx = new AudioContext({
      latencyHint: 'interactive',
      sampleRate,
    });
    await audioCtx.audioWorklet.addModule('ws-worklet.js');
  }
};

class Player {
  constructor(id) {
    this.id = id;

    this.lastMessage = null;
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
    
    this.users = new Map();
    
    this.addEventListener('close', () => {
      this.users = new Map();
    });

    (async () => {
      await _ensureInit();

      const wsPromise = new Promise((accept, reject) => {
        const ws = new WebSocket(u);
        ws.binaryType = 'arraybuffer';
        ws.addEventListener('open', () => {
          const message = e => {
            if (typeof e.data === 'string') {
              const j = JSON.parse(e.data);
              const {method} = j;
              switch (method) {
                case 'init': {
                  const {args: {id, users}} = j;
                  console.log('joined: ' + JSON.stringify({
                    id,
                    users,
                  }, null, 2));
                  for (const userId of users) {
                    if (userId !== id) {
                      const player = new Player(userId);
                      this.users[userId] = player;
                      this.dispatchEvent(new MessageEvent('join', {
                        data: player,
                      }));
                    }
                  }
                  ws.id = id;
                  ws.removeEventListener('message', message);
                  ws.addEventListener('close', e => {
                    this.dispatchEvent(new MessageEvent('close'));
                  });
                  accept(ws);
                  break;
                }
              }
            }
          };
          ws.addEventListener('message', message);
        });
        ws.addEventListener('error', reject);
      });
      
      const mediaStreamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount,
          sampleRate,
        },
      });
      
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

      const audioDecoder = new AudioDecoder({
        output: demuxAndPlay,
        error: onDecoderError,
      });
      audioDecoder.configure({
        codec: 'opus',
        numberOfChannels: channelCount,
        sampleRate,
      });
      
      const audioWorkletNode = new AudioWorkletNode(audioCtx, 'ws-worklet');
      audioWorkletNode.connect(audioCtx.destination);
      this.addEventListener('close', () => {
        audioWorkletNode.disconnect();
      });
      
      const [
        ws,
        mediaStream,
      ] = await Promise.all([
        wsPromise.then(ws => {
          ws.addEventListener('message', e => {
            // console.log('got message', e);
            if (typeof e.data === 'string') {
              const j = JSON.parse(e.data);
              const {method} = j;
              switch (method) {
                case 'audio': {
                  const {id} = j;
                  // console.log('got audio prep message', j);
                  const player = this.users[id];
                  if (player) {
                    player.lastMessage = j;
                  } else {
                    console.warn('audio message for unknown player ' + id);
                  }
                  break;
                }
                case 'join': {
                  console.log('join message', j);
                  const {id} = j;
                  const player = new Player(id);
                  this.users[id] = player;
                  this.dispatchEvent(new MessageEvent('join', {
                    data: player,
                  }));
                  /* audioEncoder.reset();
                  audioEncoder.configure({
                    codec: 'opus',
                    numberOfChannels: channelCount,
                    sampleRate,
                    bitrate,
                  });
                  audioDecoder.reset();
                  audioDecoder.configure({
                    codec: 'opus',
                    numberOfChannels: channelCount,
                    sampleRate,
                  }); */
                  break;
                }
                case 'leave': {
                  const {id} = j;
                  console.log('leave: ' + id);
                  const player = this.users[id];
                  if (player) {
                    this.users[id] = null;
                    this.dispatchEvent(new MessageEvent('join', {
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
              const player = this.users[id];
              if (player) {
                const j = player.lastMessage;
                if (j) {
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
                      audioDecoder.decode(encodedAudioChunk);
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
          });
          return ws;
        }),
        mediaStreamPromise,
      ]);
      
      const audioTracks = mediaStream.getAudioTracks();
      const audioTrack = audioTracks[0];
      // const audioTrackSettings = audioTrack.getSettings();
      const audio = (new MediaStreamTrackProcessor(audioTrack)).readable;
      const audioReader = audio.getReader();
      // console.log('got media', audioTrack, audioTrack.getSettings(), audio);
      
      function muxAndSend(encodedChunk) {
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
        uint32Array[0] = ws.id;
        if (encodedChunk.copyTo) { // new api
          encodedChunk.copyTo(new Uint8Array(data.buffer, data.byteOffset + Uint32Array.BYTES_PER_ELEMENT));
        } else { // old api
          data.set(new Uint8Array(encodedChunk.data), Uint32Array.BYTES_PER_ELEMENT);
        }
        ws.send(JSON.stringify({
          method: 'audio',
          id: ws.id,
          args: {
            type,
            timestamp,
            duration,
          },
        }));
        ws.send(data);
      }
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

        audioWorkletNode.port.postMessage(channelData, [channelData.buffer]);
      }
      function onDecoderError(err) {
        console.warn('decoder error', err);
      }
      
      readAndEncode();
    })();
  }
}

window.addEventListener('click', async e => {
  const xrrtc = new XRRTC('wss://' + window.location.host);
  xrrtc.addEventListener('join', e => {
    const player = e.data;
    console.log('join', player);
  });
});