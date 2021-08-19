import RoomClient from './client/RoomClient.js';
import Y from './yjs.js';

const roomNumberStartIndex = '0'.charCodeAt(0);
const roomNumberEndIndex = '9'.charCodeAt(0) + 1;
const roomAlphabetStartIndex = 'A'.charCodeAt(0);
const roomAlphabetEndIndex = 'Z'.charCodeAt(0) + 1;
const roomIdLength = 4;

function makeId() {
  let result = '';
  for (let i = 0; i < roomIdLength; i++) {
    result += Math.random() < 0.5 ?
      String.fromCharCode(roomNumberStartIndex + Math.floor(Math.random() * (roomNumberEndIndex - roomNumberStartIndex)))
    :
      String.fromCharCode(roomAlphabetStartIndex + Math.floor(Math.random() * (roomAlphabetEndIndex - roomAlphabetStartIndex)));

  }
  return result;
}

class XRChannelConnection extends EventTarget {
  constructor(url, options = {}) {
    super();

    this.connectionId = makeId();
    this.peerConnections = [];

    const _getPeerConnectionIndex = peerConnectionId => this.peerConnections.findIndex(peerConnection => peerConnection.connectionId === peerConnectionId);
    const _getPeerConnection = peerConnectionId => {
      const index = _getPeerConnectionIndex(peerConnectionId);
      const peerConnection = this.peerConnections[index];
      return peerConnection;
    };
    const _addPeerConnection = peerConnectionId => {
      let peerConnection = _getPeerConnection(peerConnectionId);
      if (!peerConnection) {
        peerConnection = new XRPeerConnection(peerConnectionId, this);
        peerConnection.numStreams = 0;
        this.peerConnections.push(peerConnection);
        this.dispatchEvent(new MessageEvent(peerConnectionId ? 'peerconnection' : 'botconnection', {
          data: peerConnection,
        }));
      }
      peerConnection.numStreams++;
      return peerConnection;
    };

    const {roomName = 'room'} = options;
    const dialogClient = new RoomClient({
      url: `${url}?roomId=${roomName}&peerId=${this.connectionId}`,
    });

    dialogClient.addEventListener('newPeer', e => {
      const {id: peerId} = e.data;

      const peerConnection = _addPeerConnection(peerId);
    });

    dialogClient.addEventListener('peerClosed', e => {
      const {peerId} = e.data;
      const peerConnection = this.peerConnections.find(
        (peerConnection) => peerConnection.connectionId === peerId,
      );

      if (peerConnection) {
        if (--peerConnection.numStreams <= 0) {
          peerConnection.close();
          this.peerConnections.splice(
            this.peerConnections.indexOf(peerConnection),
            1,
          );
        }
      } else {
        console.warn('cannot find peer connection', peerConnection);
      }
    });

    dialogClient.addEventListener('addreceivestream', e => {
      const {
        data: {
          peerId,
          consumer: {id, _track},
        },
      } = e;
      // console.log('add receive stream', peerId, _track);
      const peerConnection = _addPeerConnection(peerId);
      peerConnection.dispatchEvent(
        new MessageEvent('addtrack', {
          data: _track,
        }),
      );
      _track.stop = ((stop) =>
        function() {
          const {readyState} = _track;
          const result = stop.apply(this, arguments);
          if (readyState === 'live') {
            this.dispatchEvent(new MessageEvent('ended'));
          }
          return result;
        })(_track.stop);
      _track.addEventListener('ended', e => {
        // console.warn('receive stream ended', e);

        if (--peerConnection.numStreams <= 0) {
          peerConnection.close();
          this.peerConnections.splice(
            this.peerConnections.indexOf(peerConnection),
            1,
          );
        }
      });
    });

    (async () => {
      await dialogClient.join();
    })();

    this.dialogClient = dialogClient;

    this.state = new Y.Doc();
    dialogClient._protoo._transport._ws.binaryType = 'arraybuffer';
    dialogClient._protoo._transport._ws.addEventListener('open', () => {
      this.dispatchEvent(new MessageEvent('open'));

      dialogClient._protoo._transport._ws.addEventListener('message', (e) => {
        if (e.data instanceof ArrayBuffer) {
          Y.applyUpdate(this.state, new Uint8Array(e.data));
        }
      });

      const _update = (b) => {
        if (dialogClient._protoo._transport._ws.readyState === WebSocket.OPEN) {
          dialogClient._protoo._transport._ws.send(b);
        }
      };
      this.state.on('update', _update);
    });
    ['status', 'pose', 'chat'].forEach((eventType) => {
      dialogClient.addEventListener(eventType, e => {
        const peerConnection =
          _getPeerConnection(e.data.peerId) ||
          _addPeerConnection(e.data.peerId);

        peerConnection.dispatchEvent(
          new MessageEvent(e.type, {
            data: e.data,
          }),
        );
      });
    });
  }

  close() {
    this.dialogClient.close();
  }

  send(s) {
    if (
      this.dialogClient._protoo._transport._ws.readyState === WebSocket.OPEN
    ) {
      this.dialogClient._protoo._transport._ws.send(s);
    }
  }

  async setMicrophoneMediaStream(mediaStream) {
    if (mediaStream) {
      await this.dialogClient.enableMic(mediaStream);
    } else {
      await this.dialogClient.disableMic();
    }
  }
}

class XRPeerConnection extends EventTarget {
  constructor(peerConnectionId, channelConnection) {
    super();

    this.connectionId = peerConnectionId;
    this.channelConnection = channelConnection;
  }

  close() {
    this.dispatchEvent(
      new MessageEvent('close', {
        data: {},
      }),
    );
  }
}

export {makeId, XRChannelConnection, XRPeerConnection};
