import {channelCount, sampleRate, bitrate} from './ws-constants.js';

let audioCtx = null;
const interacted = new Promise((resolve) => {
  const _interacted = () => {
    resolve();
    window.removeEventListener("click", _interacted);
  }
  window.addEventListener("click", _interacted);
});

const _ensureAudioContextInit = async () => {
  if (!audioCtx) {
    await interacted;
    audioCtx = new AudioContext({
      latencyHint: 'interactive',
      sampleRate,
    });
    await audioCtx.audioWorklet.addModule('/wsrtc/ws-worklet.js');
  }
};

class Pose extends EventTarget {
  constructor(position = Float32Array.from([0, 0, 0]), quaternion = Float32Array.from([0, 0, 0, 1]), scale = Float32Array.from([1, 1, 1])) {
    super();
    
    this.position = position;
    this.quaternion = quaternion;
    this.scale = scale;
  }
  set(position, quaternion, scale) {
    this.position.set(position);
    this.quaternion.set(quaternion);
    this.scale.set(scale);
  }
  readUpdate(poseBuffer) {
    const position = new Float32Array(poseBuffer.buffer, poseBuffer.byteOffset, 3);
    this.position.set(position);
    const quaternion = new Float32Array(poseBuffer.buffer, poseBuffer.byteOffset + 3*Float32Array.BYTES_PER_ELEMENT, 4);
    this.quaternion.set(quaternion);
    const scale = new Float32Array(poseBuffer.buffer, poseBuffer.byteOffset + (3+4)*Float32Array.BYTES_PER_ELEMENT, 3);
    this.scale.set(scale);
    
    this.dispatchEvent(new MessageEvent('update'));
  }
}
class Metadata extends EventTarget {
  constructor() {
    super();
    
    this.data = {};
  }
  get(k) {
    return this.data[k];
  }
  set(o) {
    for (const key in o) {
      this.data[key] = o[key];
    }
  }
  readUpdate(o) {
    for (const key in o) {
      this.data[key] = o[key];
    }
    
    const keys = Object.keys(o);
    if (keys.length > 0) {
      this.dispatchEvent(new MessageEvent('update', {
        data: {
          keys,
        },
      }));
    }
  }
  toJSON() {
    return this.data;
  }
}
class Volume extends EventTarget {
  constructor() {
    super();
    
    this.value = 0;
  }
  readUpdate(value) {
    this.value = value;
    
    this.dispatchEvent(new MessageEvent('update', {
      data: {
        value,
      },
    }));
  }
}



class Player extends EventTarget {
  constructor(id, parent) {
    super();
    
    this.id = id;
    this.parent = parent;
    this.pose = new Pose(undefined, undefined, undefined);
    this.metadata = new Metadata();
    this.volume = new Volume();
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
    audioWorkletNode.port.onmessage = e => {
      const {method} = e.data;
      switch (method) {
        case 'volume': {
          const {args: {value}} = e.data;
          this.volume.readUpdate(value);
          break;
        }
      }
    };
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

class LocalPlayer extends Player {
  constructor(...args) {
    super(...args);
  }
  setPose(position = this.pose.position, quaternion = this.pose.quaternion, scale = this.pose.scale) {
    this.pose.set(position, quaternion, scale);
    this.pose.dispatchEvent(new MessageEvent('update'));
    
    if (this.id) {
      this.parent.pushUserPose(position, quaternion, scale);
    }
  }
  setMetadata(o) {
    this.metadata.set(o);

    const keys = Object.keys(o);
    if (keys.length > 0) {
      this.metadata.dispatchEvent(new MessageEvent('update', {
        data: {
          keys,
        },
      }));
    }
    
    if (this.id) {
      this.parent.pushUserMetadata(o);
    }
  }
}

class WSRTC extends EventTarget {
  constructor(u) {
    super();
    
    this.state = 'closed';
    this.ws = null;
    this.localUser = new LocalPlayer(0, this);
    this.users = new Map();
    // TODO: remove in favor of users but keeping track of EventTargets
    // for world

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
              this.connectionId = id
              
              for (const userId of users) {
                if (userId !== id) {
                  const player = new Player(userId, null);
                  this.users.set(userId, player);
    
                  this.dispatchEvent(new MessageEvent('join', {
                    data: player,
                  }));
                }
              }
              ws.removeEventListener('message', initialMessage);
              ws.addEventListener('message', mainMessage);
              ws.addEventListener('close', e => {
                this.state = 'closed';
                this.ws = null;
                this.dispatchEvent(new MessageEvent('close'));
              });
              
              // emit open event
              this.state = 'open';
              this.dispatchEvent(new MessageEvent('open'));
              
              // latch local user id
              this.localUser.id = id;
              
              // send initial pose/metadata
              this.pushUserState();
              
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
            case 'pose':
            case 'status': {
              const user = this.users.get(j.id);

              if(!user) {
                return
              }
            
              user.dispatchEvent(new MessageEvent(j.method, {
                data: j.data,
              }));

              break;
            }
            case 'apose':
            case 'audio': {
              const {id} = j;
              const player = this.users.get(id);
              if (player) {
                player.lastMessage = j;
              } else {
                console.warn('muultipart message for unknown player ' + id);
              }
              break;
            }
            case 'metadata': {
              const {id} = j;
              const player = this.users.get(id);
              if (player) {
                const {args} = j;
                player.metadata.readUpdate(args);
              } else {
                console.warn('metadata message for unknown player ' + id);
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
              // update the new user about us
              this.pushUserState();
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
            if (j) {
              player.lastMessage = null;
              const data = new Uint8Array(e.data, Uint32Array.BYTES_PER_ELEMENT);
              
              const {method} = j;
              switch (method) {
                case 'pose': {
                  const poseBuffer = new Float32Array(data.buffer, data.byteOffset);
                  player.pose.readUpdate(poseBuffer);
                  // console.log('got pose buffer', poseBuffer);
                  break;
                }
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
  pushUserState() {
    if (this.localUser.id) {
      this.pushUserPose(this.localUser.pose.position, this.localUser.pose.quaternion, this.localUser.pose.scale);
      this.pushUserMetadata(this.localUser.metadata.data);
    }
  }
  pushUserPose(p, q, s) {
    if (this.localUser.id) {
      const data = new Float32Array(1 + 3 + 4 + 3);
      const uint32Array = new Uint32Array(data.buffer, data.byteOffset, 1);
      uint32Array[0] = this.localUser.id;
      const position = new Float32Array(data.buffer, data.byteOffset + 1*Float32Array.BYTES_PER_ELEMENT, 3);
      position.set(p);
      const quaternion = new Float32Array(data.buffer, data.byteOffset + (1+3)*Float32Array.BYTES_PER_ELEMENT, 4);
      quaternion.set(q);
      const scale = new Float32Array(data.buffer, data.byteOffset + (1+3+4)*Float32Array.BYTES_PER_ELEMENT, 3);
      scale.set(s);
      this.ws.send(JSON.stringify({
        method: 'apose',
        id: this.localUser.id,
      }));
      this.ws.send(data);
    }
  }
  pushUserMetadata(o) {
    if (this.localUser.id) {
      this.ws.send(JSON.stringify({
        method: 'metadata',
        id: this.localUser.id,
        args: o,
      }));
    }
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
      uint32Array[0] = this.localUser.id;
      if (!this.localUser.id) {
        debugger;
      }
      if (encodedChunk.copyTo) { // new api
        encodedChunk.copyTo(new Uint8Array(data.buffer, data.byteOffset + Uint32Array.BYTES_PER_ELEMENT));
      } else { // old api
        data.set(new Uint8Array(encodedChunk.data), Uint32Array.BYTES_PER_ELEMENT);
      }
      this.ws.send(JSON.stringify({
        method: 'audio',
        id: this.localUser.id,
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
      // TODO: not a function on mediaStream?
      // this.mediaStream.close();
      this.mediaStream = null;
    }
  }

  send(data) {
    this.ws.send(data)
  }
}


WSRTC.waitForReady = async () => {
  await _ensureAudioContextInit();
};
WSRTC.getAudioContext = () => {
  _ensureAudioContextInit();
  return audioCtx;
};

export default WSRTC;