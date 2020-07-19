import storage from './storage.js';
import {
  PARCEL_SIZE,
  SUBPARCEL_SIZE,
  MAX_NAME_LENGTH,
  PLANET_BUILD_SLOTS,
  PLANET_PACKAGE_SLOTS,
  PLANET_BUILD_SIZE,
  PLANET_PACKAGE_SIZE,
} from './constants.js';
import {XRChannelConnection} from 'https://2.metartc.com/xrrtc.js';

const presenceHost = 'wss://rtc.exokit.org:4443';

// planet

const planet = new EventTarget();
export default planet;

let state = {};
// window.state = state;

const _serializeState = state => {

};
const _deserializeState = state => {

};

class SubparcelObject {
  constructor(data, offset, index) {
    this.data = data;
    this.offset = offset;
    this.index = index;

    this.name = new Uint8Array(this.data, this.offset);
    this.position = new Float32Array(this.data, this.offset + MAX_NAME_LENGTH, 3);
    this.quaternion = new Float32Array(this.data, this.offset + MAX_NAME_LENGTH + Float32Array.BYTES_PER_ELEMENT * 3, 4);
  }
  isValid() {
    return this.name[0] !== 0;
  }
  invalidate() {
    this.name[0] = 0;
  }
  getNameLength() {
    let i;
    for (i = 0; i < this.name.length; i++) {
      if (this.name[i] === 0) {
        break;
      }
    }
    return i;
  }
}
class SubparcelBuild extends SubparcelObject {
  constructor(data, offset, index) {
    super(data, offset, index);
    this.type = '';
  }
  writeMetadata() {
    const b = new TextEncoder().encode(this.type);
    this.name.set(b);
    this.name[b.byteLength] = 0;
  }
  readMetadata() {
    const nameLength = this.getNameLength();
    this.type = new TextDecoder().decode(new Uint8Array(this.name.buffer, this.name.byteOffset, this.name.nameLength));
  }
}
class SubparcelPackage extends SubparcelObject {
  constructor(data, offset, index) {
    super(data, offset, index);
    this.dataHash = '';
  }
  writeMetadata() {
    const b = new TextEncoder().encode(this.dataHash);
    this.name.set(b);
    this.name[b.byteLength] = 0;
  }
  readMetadata() {
    const nameLength = this.getNameLength();
    this.dataHash = new TextDecoder().decode(new Uint8Array(this.name.buffer, this.name.byteOffset, this.name.nameLength));
  }
}

class Subparcel {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.offsets = Subparcel.getOffsets(state.subparcelSize);
    this.data = new ArrayBuffer(this.offsets.length);
    this.potentials = new Float32Array(this.data, Int32Array.BYTES_PER_ELEMENT * 3, state.subparcelSize * state.subparcelSize * state.subparcelSize);
    this.buildsFreeList = new Uint8Array(PLANET_BUILD_SLOTS);
    this.packagesFreeList = new Uint8Array(PLANET_PACKAGE_SLOTS);
    this.builds = [];
    this.packages = [];
  }
  writeMetadata() {
    const dst = new Int32Array(this.data, 0, 3);
    dst[0] = this.x;
    dst[1] = this.y;
    dst[2] = this.z;
  }
  readMetadata() {
    const src = new Int32Array(this.data, 0, 3);
    this.x = dst[0];
    this.y = dst[1];
    this.z = dst[2];
  }
  addBuild(type, position, quaternion) {
    for (let i = 0; i < this.buildsFreeList.length; i++) {
      if (!this.buildsFreeList[i]) {
        this.buildsFreeList[i] = 1;

        const build = new SubparcelBuild(this.data, this.offsets.builds + i*PLANET_BUILD_SIZE, this.offsets, i);
        build.type = type;
        position.toArray(build.position);
        quaternion.toArray(build.quaternion);
        build.writeMetadata();
        this.builds.push(build);
        return build;
      }
    }
    throw new Error('no more slots for build');
  }
  removeBuild(index) {
    this.buildsFreeList[index] = 0;
    const index2 = this.builds.findIndex(b => b.index === index);
    this.builds.splice(index2, 1);
  }
  addPackage(dataHash, position, quaternion) {
    for (let i = 0; i < this.packagesFreeList.length; i++) {
      if (!this.packagesFreeList[i]) {
        this.packagesFreeList[i] = 1;

        const pkg = new SubparcelPackage(this.data, this.offsets.builds + i*PLANET_BUILD_SIZE, this.offsets, i);
        pkg.type = type;
        position.toArray(pkg.position);
        quaternion.toArray(pkg.quaternion);
        pkg.writeMetadata();
        this.packages.push(pkg);
        return pkg;
      }
    }
    throw new Error('no more slots for package');
  }
  removePackage(index) {
    this.packagesFreeList[index] = 0;
    const index2 = this.packages.findIndex(p => p.index === index);
    this.packages.splice(index2, 1);
  }
}
Subparcel.getOffsets = subparcelSize => {
  let index = 0;

  const xyz = index;
  index += Int32Array.BYTES_PER_ELEMENT * 3;
  const potentials = index;
  index += subparcelSize * subparcelSize * subparcelSize * Float32Array.BYTES_PER_ELEMENT;
  const buildsFreeList = index;
  index += Uint8Array.BYTES_PER_ELEMENT * PLANET_BUILD_SLOTS;
  const builds = index;
  index += PLANET_BUILD_SIZE * PLANET_BUILD_SLOTS;
  const packagesFreeList = index;
  index += Uint8Array.BYTES_PER_ELEMENT * PLANET_PACKAGE_SLOTS;
  const packages = index;
  index += PLANET_PACKAGE_SIZE * PLANET_PACKAGE_SLOTS;
  const length = index;

  return {
    xyz,
    potentials,
    buildsFreeList,
    builds,
    packagesFreeList,
    packages,
    length,
  };
};

const _addSubparcel = (x, y, z) => {
  const subparcel = new Subparcel();
  subparcel.x = x;
  subparcel.y = y;
  subparcel.z = z;
  subparcel.writeMetadata();
  state.subparcels.push(subparcel);
  return subparcel;
};
planet.getSubparcel = (x, y, z) => {
  let subparcel = state.subparcels.find(sp => sp.x === x && sp.y === y && sp.z === z);
  if (!subparcel) {
    subparcel = _addSubparcel(x, y, z);
  }
  return subparcel;
};
planet.editSubparcel = async (x, y, z, fn) => {
  let index = state.subparcels.findIndex(sp => sp.x === x && sp.y === y && sp.z === z);
  if (index === -1) {
    _addSubparcel(x, y, z);
    index = state.subparcels.length-1;
  }
  const subparcel = state.subparcels[index];
  await fn(subparcel);

  if (channelConnection) {
    throw new Error('unknown');
  } else {
    await _saveStorage(state.seedString);
  }
};

const _loadLiveState = seedString => {
  planet.dispatchEvent(new MessageEvent('unload'));
  planet.dispatchEvent(new MessageEvent('load', {
    data: state,
  }));
};

const _saveStorage = async roomName => {
  const b = _serializeState(state);
  await storage.setRaw(roomName, b);
};
const _loadStorage = async roomName => {
  const b = await storage.getRaw(roomName);
  if (b) {
    state = _deserializeState(b);
  } else {
    state = {
      seedString: roomName,
      subparcels: [],
      parcelSize: PARCEL_SIZE,
      subparcelSize: SUBPARCEL_SIZE,
    };
  }
};

// multiplayer

let roomName = null;
let channelConnection = null;
let channelConnectionOpen = false;
const peerConnections = [];
let microphoneMediaStream = null;
const _connectRoom = async roomName => {
  channelConnection = new XRChannelConnection(`${presenceHost}/`, {
    roomName,
    // displayName: 'user',
  });
  channelConnection.addEventListener('open', async e => {
    channelConnectionOpen = true;

    const queue = [];
    let index = 0;
    let bufferedAmountLow = true;
    channelConnection.send = (_send => function send(a) {
      // console.log('send', a, this);
      if (bufferedAmountLow) {
        // try {
          bufferedAmountLow = false;
          return _send.apply(this, arguments);
        /* } catch(err) {
          console.log('got error', err);
        } */
      } else {
        queue.push(a);
      }
    })(channelConnection.send);
    channelConnection.dataChannel.addEventListener('bufferedamountlow', e => {
      // console.log('buffered amount low', e);
      bufferedAmountLow = true;
      if (index < queue.length) {
        /* if (channelConnection.dataChannel.bufferedAmount !== 0) {
          console.log('got buffered amount', channelConnection.dataChannel.bufferedAmount, channelConnection.dataChannel.bufferedAmountLowThreshold);
          throw new Error('already buffered!');
        } */
        const entry = queue[index];
        queue[index] = null;
        index++;
        channelConnection.send(entry);
        if (index >= queue.length) {
          queue.length = 0;
          index = 0;
        }
      }
    });

    const _latchMediaStream = async () => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const track = mediaStream.getAudioTracks()[0];
      track.addEventListener('ended', async e => {
        await channelConnection.setMicrophoneMediaStream(null);
        _latchMediaStream();
      });
      await channelConnection.setMicrophoneMediaStream(mediaStream);
    };
    _latchMediaStream();
  }, {once: true});
  channelConnection.addEventListener('close', e => {
    if (interval) {
      clearInterval(interval);
    }
    channelConnectionOpen = false;
  }, {once: true});
  channelConnection.addEventListener('peerconnection', async e => {
    const peerConnection = e.data;

    let modelHash = null;
    let playerRig = null;
    let microphoneMediaStream = null;
    let live = true;
    let loading = false;
    const loadQueue = [];
    let sending = false;
    let sendQueue = [];
    let avatarQueued = null;
    const _loadAvatar = async hash => {
      if (!loading) {
        loading = true;

        if (playerRig) {
          await xrpackage.remove(playerRig);
          scene.remove(playerRig.textMesh);
          playerRig = null;
        }

        const p = await (async () => {
          if (hash) {
            const u = `https://ipfs.exokit.org/ipfs/${hash}.wbn`;
            const res = await fetch(u);
            const ab = await res.arrayBuffer();
            const uint8Array = new Uint8Array(ab);
            return new XRPackage(uint8Array);
          } else {
            return new XRPackage();
          }
        })();
        await p.waitForLoad();
        await p.loadAvatar();
        p.isAvatar = true;
        await xrpackage.add(p);
        const scaler = new THREE.Object3D();
        // scaler.scale.set(10, 10, 10);
        scaler.add(p.context.object);
        xrpackage.engine.scene.add(scaler);
        p.scaler = scaler;
        if (live) {
          playerRig = p;
          playerRig.textMesh = _makeTextMesh('Loading...');
          scene.add(playerRig.textMesh);
          if (microphoneMediaStream) {
            p.context.rig.setMicrophoneMediaStream(microphoneMediaStream);
          }
        } else {
          await xrpackage.remove(p);
        }

        loading = false;

        if (loadQueue.length > 0) {
          const fn = loadQueue.shift();
          fn();
        }
      } else {
        loadQueue.push(() => {
          _loadAvatar(hash);
        });
      }
    };
    _loadAvatar(null);
    
    /* const remoteRig = _makeRig();
    _addRig(remoteRig); */

    peerConnection.getPlayerRig = () => playerRig;
    peerConnection.addEventListener('close', async () => {
      peerConnections.splice(peerConnections.indexOf(peerConnection), 1);
      if (playerRig) {
        await xrpackage.remove(playerRig);
        scene.remove(playerRig.textMesh);
        playerRig = null;
      }
      if (interval) {
        clearInterval(interval);
      }
      _removeRig(remoteRig);
      live = false;
    });
    peerConnection.addEventListener('message', e => {
      const {data} = e;
      if (typeof data === 'string') {
        const j = JSON.parse(data);
        const {method} = j;
        if (method === 'pose') {
          if (playerRig) {
            const {pose} = j;
            const [head, leftGamepad, rightGamepad] = pose;
            
            /* remoteRig.head.position.fromArray(head[0]);
            remoteRig.head.quaternion.fromArray(head[1]);
            remoteRig.leftHand.position.fromArray(leftGamepad[0]);
            remoteRig.leftHand.quaternion.fromArray(leftGamepad[1]);
            remoteRig.rightHand.position.fromArray(rightGamepad[0]);
            remoteRig.rightHand.quaternion.fromArray(rightGamepad[1]); */

            playerRig.setPose(pose);
            playerRig.textMesh.position.fromArray(head[0]);
            playerRig.textMesh.position.y += 0.5;
            playerRig.textMesh.quaternion.fromArray(head[1]);
            localEuler.setFromQuaternion(playerRig.textMesh.quaternion, 'YXZ');
            localEuler.x = 0;
            localEuler.y += Math.PI;
            localEuler.z = 0;
            playerRig.textMesh.quaternion.setFromEuler(localEuler);
          }
        } else if (method === 'name') {
          const {peerId, name} = j;
          if (peerId === peerConnection.connectionId && playerRig && name !== playerRig.textMesh.text) {
            playerRig.textMesh.text = name;
            playerRig.textMesh.sync();
          }
        } else if (method === 'avatar') {
          const {peerId, hash} = j;
          if (peerId === peerConnection.connectionId && hash !== modelHash) {
            modelHash = hash;
            _loadAvatar(hash);
          }
        } else {
          console.warn('unknown method', method);
        }
      } else {
        console.warn('non-string data', data);
        throw new Error('non-string data');
      }
    });
    peerConnection.addEventListener('addtrack', e => {
      const track = e.data;
      microphoneMediaStream = new MediaStream([track]);
      const audio = document.createElement('audio');
      audio.srcObject = microphoneMediaStream;
      audio.play();
      if (playerRig) {
        playerRig.context.rig.setMicrophoneMediaStream(microphoneMediaStream);
        track.addEventListener('ended', e => {
          playerRig.context.rig.setMicrophoneMediaStream(null);
          audio.srcObject = null;
        });
      }
    });
    peerConnections.push(peerConnection);

    let interval;
    if (live) {
      interval = setInterval(() => {
        channelConnection.send(JSON.stringify({
          method: 'name',
          peerId: channelConnection.connectionId,
          name: _getUsername(),
        }));
        channelConnection.send(JSON.stringify({
          method: 'avatar',
          peerId: channelConnection.connectionId,
          hash: _getAvatar(),
        }));
      }, 1000);
    }
  });
  /* channelConnection.addEventListener('botconnection', async e => {
    console.log('got bot connection', e.data);

    setInterval(() => {
      channelConnection.send(JSON.stringify({
        method: 'ping',
      }));
    }, 1000);
  }); */

  channelConnection.addEventListener('initState', async e => {
    const {data} = e;
    console.log('got init state', data);

    _loadLiveState(roomName);
  });
  channelConnection.addEventListener('updateState', async e => {
    const {data} = e;
    const {key, value} = data;
    console.log('got update state', key, value);
    const isSet = value !== undefined;
    if (isSet) {
      state[key] = value;
    } else {
      delete state[key];
    }

    /* const id = parseInt(key, 10);
    let p = xrpackage.children.find(p => p.id === id);
    if (isSet && !p) {
      p = await XRPackage.download(value.hash);
      p.id = id;
      await xrpackage.add(p);
    } else if (!isSet && p) {
      await xrpackage.remove(p);
      p = null;
    }
    if(p) {
      removeMatrixUpdateListener(p);
      p.setMatrix(new THREE.Matrix4().fromArray(value.matrix));
      addMatrixUpdateListener(p);
    } */
  });
};
planet.connect = async (rn, {online = true} = {}) => {
  roomName = rn;

  if (online) {
    await _connectRoom(roomName);
  } else {
    await _loadStorage(roomName);
    await _loadLiveState(roomName);
  }
};