import {channelCount, sampleRate, bitrate, MESSAGE} from './ws-constants.js';
import {WsEncodedAudioChunk, WsMediaStreamAudioReader, WsAudioEncoder, WsAudioDecoder} from './ws-codec.js';
import {ensureAudioContext, getAudioContext} from './ws-audio-context.js';
import {encodeMessage, encodeAudioMessage, encodePoseMessage, encodeTypedMessage, decodeTypedMessage, getEncodedAudioChunkBuffer, getAudioDataBuffer/*, loadState*/} from './ws-util.js';
import * as Z from 'zjs';

function formatWorldUrl(u, localPlayer) {
  u = u.replace(/^http(s?)/, 'ws$1');
  const url = new URL(u);
  url.searchParams.set('playerId', localPlayer.playerId ?? '');
  return url.toString();
}

class WSRTC extends EventTarget {
  constructor(u = '', {
    localPlayer = null,
    crdtState = new Z.Doc(),
  } = {}) {
    super();
    
    this.state = 'closed';
    this.ws = null;
    this.mediaStream = null;
    this.audioReader = null;
    this.audioEncoder = null;
    
    this.localPlayer = localPlayer;
    this.crdtState = crdtState;
    
    /* this.addEventListener('join', e => {
      const player = e.data;
      console.log('join', player);
    });
    this.addEventListener('leave', e => {
      const player = e.data;
      console.log('leave', player);
    }); */
    const u2 = formatWorldUrl(u, localPlayer);
    const ws = new WebSocket(u2);
    this.ws = ws;
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('open', () => {
      const initialMessage = e => {
        const uint32Array = new Uint32Array(e.data, 0, Math.floor(e.data.byteLength/Uint32Array.BYTES_PER_ELEMENT));
        const method = uint32Array[0];
        // console.log('got data', e.data, 0, Math.floor(e.data.byteLength/Uint32Array.BYTES_PER_ELEMENT), uint32Array, method);

        // console.log('got method', method);

        switch (method) {
          case MESSAGE.INIT: {
            // local user
            // let index = Uint32Array.BYTES_PER_ELEMENT;
            /* const id = uint32Array[index/Uint32Array.BYTES_PER_ELEMENT];
            // this.localUser.id = id;
            index += Uint32Array.BYTES_PER_ELEMENT; */
            
            /* // users
            const usersDataByteLength = uint32Array[index/Uint32Array.BYTES_PER_ELEMENT];
            index += Uint32Array.BYTES_PER_ELEMENT;
            const usersData = new Uint32Array(e.data, index, usersDataByteLength/Uint32Array.BYTES_PER_ELEMENT);
            for (let i = 0; i < usersData.length; i++) {
              const userId = usersData[i];
              const player = new Player({
                playerId: userId,
              });
              this.users.set(userId, player);
              if (userId !== this.localUser.id) {
                this.dispatchEvent(new MessageEvent('join', {
                  data: player,
                }));
              }
            }
            index += usersData.byteLength; */
            
            // finish setup
            ws.removeEventListener('message', initialMessage);
            console.log('bind main message');
            ws.addEventListener('message', mainMessage);
            
            // emit open event
            this.state = 'open';
            this.dispatchEvent(new MessageEvent('open'));
            
            // initial state update
            let index = Uint32Array.BYTES_PER_ELEMENT;
            const roomDataByteLength = uint32Array[index/Uint32Array.BYTES_PER_ELEMENT];
            index += Uint32Array.BYTES_PER_ELEMENT;
            const data = new Uint8Array(e.data, index, roomDataByteLength);
            // console.log('crdt load');
            this.crdtState.transact(() => {
              Z.applyUpdate(this.crdtState, data);
            });
            
            // log
            // console.log('init wsrtc 1', this.crdtState.toJSON());
            this.dispatchEvent(new MessageEvent('init'));
            // console.log('init wsrtc 2', this.crdtState.toJSON());
            
            break;
          }
        }
      };
      /* const _handleJoinMessage = (e, dataView) => {
        // register the user locally
        const id = dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT, true);
        const player = new Player(id);
        this.users.set(id, player);
        player.dispatchEvent(new MessageEvent('join'));
        this.dispatchEvent(new MessageEvent('join', {
          data: player,
        }));
        // update the new user about ourselves
        this.pushUserState();
      };
      const _handleLeaveMessage = (e, dataView) => {
        const id = dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT, true);
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
      };
      const _handlePoseMessage = (e, dataView) => {
        const id = dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT, true);
        const player = this.users.get(id);
        if (player) {
          const poseBuffer = new Uint8Array(e.data, 2 * Uint32Array.BYTES_PER_ELEMENT);
          player.pose.readUpdate(poseBuffer);
        } else {
          console.warn('message for unknown player ' + id);
        }
      }; */
      const _handleStateUpdateMessage = (e, dataView) => {
        const byteLength = dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT, true);
        const data = new Uint8Array(dataView.buffer, dataView.byteOffset + 2 * Uint32Array.BYTES_PER_ELEMENT, byteLength);
        Z.applyUpdate(this.crdtState, data);
      };
      const _handleAudioMessage = (e, dataView) => {
        const id = dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT, true);
        const player = this.users.get(id);
        if (player) {
          const type = dataView.getUint32(2*Uint32Array.BYTES_PER_ELEMENT, true) === 0 ? 'key' : 'delta';
          const timestamp = dataView.getFloat32(3*Uint32Array.BYTES_PER_ELEMENT, true);
          const byteLength = dataView.getUint32(4*Uint32Array.BYTES_PER_ELEMENT, true);
          const data = new Uint8Array(e.data, 5 * Uint32Array.BYTES_PER_ELEMENT, byteLength);
          
          const encodedAudioChunk = new WsEncodedAudioChunk({
            type: 'key', // XXX: hack! when this is 'delta', you get Uncaught DOMException: Failed to execute 'decode' on 'AudioDecoder': A key frame is required after configure() or flush().
            timestamp,
            data,
          });
          player.audioDecoder.decode(encodedAudioChunk);
        } else {
          console.warn('message for unknown player ' + id);
        }
      };
      /* const _handleUserStateMessage = (e, dataView) => {
        const id = dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT, true);
        const player = this.users.get(id);
        if (player) {
          const byteLength = dataView.getUint32(2*Uint32Array.BYTES_PER_ELEMENT, true);
          const data = new Uint8Array(e.data, 3 * Uint32Array.BYTES_PER_ELEMENT, byteLength);
          Z.applyUpdate(player.state, data);
        } else {
          console.warn('message for unknown player ' + id);
        }
      };
      const _handleRoomStateMessage = (e, dataView) => {
        const byteLength = dataView.getUint32(Uint32Array.BYTES_PER_ELEMENT, true);
        const data = new Uint8Array(e.data, 2 * Uint32Array.BYTES_PER_ELEMENT, byteLength);
        Z.applyUpdate(this.room.state, data);
      }; */
      const mainMessage = e => {
        const dataView = new DataView(e.data);
        const method = dataView.getUint32(0, true);
        // console.log('got main message', method);
        switch (method) {
          /* case MESSAGE.JOIN:
            _handleJoinMessage(e, dataView);
            break;
          case MESSAGE.LEAVE:
            _handleLeaveMessage(e, dataView);
            break; */
          case MESSAGE.STATE_UPDATE:
            _handleStateUpdateMessage(e, dataView);
            break;
          case MESSAGE.AUDIO:
            _handleAudioMessage(e, dataView);
            break;
          default:
            console.warn('unknown method id: ' + method);
            break;
        }
      };
      ws.addEventListener('message', initialMessage);
      ws.addEventListener('close', e => {
        this.state = 'closed';
        this.ws = null;
        this.dispatchEvent(new MessageEvent('close'));
        this.crdtState.off('update', handleStateUpdate);
      });
      
      const handleStateUpdate = (encodedUpdate, origin) => {
        this.sendMessage([
          MESSAGE.STATE_UPDATE,
          encodedUpdate,
        ]);
      };
      this.crdtState.on('update', handleStateUpdate);
    });
    ws.addEventListener('error', err => {
      this.dispatchEvent(new MessageEvent('error', {
        data: err,
      }));
    });
    
    this.addEventListener('close', () => {
      // this.users = new Map();
      
      if (this.mediaStream) {
        this.mediaStream = null;
      }
      if (this.audioReader) {
        this.audioReader.cancel();
        this.audioReader = null;;
      }
      if (this.audioEncoder) {
        this.audioEncoder.close();
        this.audioEncoder = null;
      }
      // this.disableMic();
      // console.log('close');
    });
  }
  /* pushUserState() {
    if (this.localUser.id) {
      this.pushUserState(this.localUser.state);
      this.pushUserPose(this.localUser.pose.position, this.localUser.pose.quaternion, this.localUser.pose.scale, this.localUser.pose.extraUint8ArrayFull, this.localUser.pose.extraUint8ArrayByteLength);
    }
  }
  pushUserPose(p, q, s, extraUint8ArrayFull, extraUint8ArrayByteLength) {
    if (this.localUser.id) {
      this.sendPoseMessage(
        MESSAGE.POSE,
        this.localUser.id,
        p,
        q,
        s,
        extraUint8ArrayFull,
        extraUint8ArrayByteLength,
      );
    }
  }
  pushUserState(userState) {
    if (this.localUser.id) {
      const encodedUserState = Z.encodeStateAsUpdate(userState);
      this.sendMessage([
        MESSAGE.USERSTATE,
        this.localUser.id,
        encodedUserState,
      ]);
    }
  } */
  sendMessage(parts) {
    if (this.ws.readyState === WebSocket.OPEN) {
      const encodedMessage = encodeMessage(parts);
      this.ws.send(encodedMessage);
    }
  }
  sendAudioMessage(method, id, type, timestamp, data) { // for performance
    const encodedMessage = encodeAudioMessage(method, id, type, timestamp, data);
    this.ws.send(encodedMessage);
  }
  /* sendPoseMessage(method, id, p, q, s, extraUint8ArrayFull, extraUint8ArrayByteLength) { // for performance
    const encodedMessage = encodePoseMessage(method, id, p, q, s, extraUint8ArrayFull, extraUint8ArrayByteLength);
    this.ws.send(encodedMessage);
  } */
  close() {
    if (this.state === 'open') {
      this.ws.close();
    } else {
      throw new Error('connection not open');
    }
  }
  async enableMic(mediaStream) {
    if (this.mediaStream) {
      throw new Error('mic already enabled');
    }
    if (!mediaStream) {
      mediaStream = await WSRTC.getUserMedia();
    }
    this.mediaStream = mediaStream;

    const audioReader = new WsMediaStreamAudioReader(this.mediaStream);
    this.audioReader = audioReader;
    
    const muxAndSend = encodedChunk => {
      const {type, timestamp} = encodedChunk;
      const data = getEncodedAudioChunkBuffer(encodedChunk);
      this.sendAudioMessage(
        MESSAGE.AUDIO,
        this.localPlayer.playerId,
        type,
        timestamp,
        data,
      );
    };
    function onEncoderError(err) {
      console.warn('encoder error', err);
    }
    const audioEncoder = new WsAudioEncoder({
      output: muxAndSend,
      error: onEncoderError,
    });
    this.audioEncoder = audioEncoder;
    
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
      WSRTC.destroyUserMedia(this.mediaStream);
      this.mediaStream = null;
    }
    if (this.audioReader) {
      this.audioReader.cancel();
      this.audioReader = null;;
    }
    if (this.audioEncoder) {
      this.audioEncoder.close();
      this.audioEncoder = null;
    }
  }
  
  static waitForReady() {
    return ensureAudioContext();
  }
  static getAudioContext() {
    return getAudioContext();
  }
  static getUserMedia() {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount,
        sampleRate,
      },
    });
  }
  static destroyUserMedia(mediaStream) {
    for (const track of mediaStream.getTracks()) {
      track.stop();
    }
  }
}

export default WSRTC;
// globalThis.WSRTC = WSRTC;