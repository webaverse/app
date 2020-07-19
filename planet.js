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
  }
  get valid() {
    return new Uint8Array(this.data, this.offset)[0] !== 0;
  }
  set valid(valid) {
    if (valid === false) {
      new Uint8Array(this.data, this.offset)[0] = 0;
    }
  }
  get name() {
    return new TextDecoder().decode(new Uint8Array(this.data, this.offset));
  }
  set name(name) {
    const b = new TextEncoder.encode(name);
    if (b.byteLength < MAX_NAME_LENGTH) {
      const dst = new Uint8Array(this.data, this.offset);
      dst.set(b);
      dst[b.byteLength] = 0;
    } else {
      throw new Error('name length overflow: ' + JSON.stringify(name));
    }
  }
  get position() {
    return new Float32Array(this.data, this.offset + MAX_NAME_LENGTH, 3);
  }
  set position(position) {
    new Float32Array(this.data, this.offset + MAX_NAME_LENGTH, 3)
      .set(position);
  }
  get quaternion() {
    return new Float32Array(this.data, this.offset + MAX_NAME_LENGTH + 3 * Float32Array.BYTES_PER_ELEMENT, 4);
  }
  set quaternion(quaternion) {
    const offsets = Subparcel.getOffsets(state.subparcelSize);
    new Float32Array(this.data, this.offset + MAX_NAME_LENGTH + Float32Array.BYTES_PER_ELEMENT*3, 4)
      .set(quaternion);
  }
}
class SubparcelBuild extends SubparcelObject {
  get type() { return this.name; }
  set type(type) { this.name = type; }
}
class SubparcelPackage extends SubparcelObject {
  get dataHash() { return this.name; }
  set dataHash(dataHash) { this.name = dataHash; }
}

class Subparcel {
  constructor(x, y, z) {
    this.offsets = Subparcel.getOffsets(state.subparcelSize);
    this.data = new ArrayBuffer(this.offsets.length);
    this.x = x;
    this.y = y;
    this.z = z;
    this.potentials = new Float32Array(this.data, Int32Array.BYTES_PER_ELEMENT * 3, state.subparcelSize * state.subparcelSize * state.subparcelSize);
  }
  get x() { return new Int32Array(this.data, 0*Int32Array.BYTES_PER_ELEMENT, 1)[0]; }
  set x(x) { new Int32Array(this.data, 0*Int32Array.BYTES_PER_ELEMENT, 1)[0] = x; }
  get y() { return new Int32Array(this.data, 1*Int32Array.BYTES_PER_ELEMENT, 1)[0]; }
  set y(y) { new Int32Array(this.data, 1*Int32Array.BYTES_PER_ELEMENT, 1)[0] = y; }
  get z() { return new Int32Array(this.data, 2*Int32Array.BYTES_PER_ELEMENT, 1)[0]; }
  set z(z) { new Int32Array(this.data, 2*Int32Array.BYTES_PER_ELEMENT, 1)[0] = z; }
  *builds() {
    for (let i = 0; i < PLANET_BUILD_SLOTS; i++) {
      const build = new SubparcelObject(this.data, this.offsets.builds + i*PLANET_BUILD_SIZE, this.offsets, i);
      if (build.valid) {
        yield build;
      }
    }
  }
  addBuild(type, position, quaternion) {
    for (let i = 0; i < PLANET_BUILD_SLOTS; i++) {
      const build = new SubparcelBuild(this.data, this.offsets.builds + i*PLANET_BUILD_SIZE, this.offsets, i);
      if (!build.valid) {
        build.type = type;
        build.position = position.toArray(new Float32Array(3));
        build.quaternion = quaternion.toArray(new Float32Array(4));
        return build;
      }
    }
    throw new Error('no more slots for build');
  }
  removeBuild(index) {
    const build = new SubparcelObject(this.data, this.offsets.builds + index*PLANET_BUILD_SIZE, this.offsets, index);
    build.valid = false;
  }
  *packages() {
    for (let i = 0; i < PLANET_PACKAGE_SLOTS; i++) {
      const pkg = new SubparcelObject(this.data, this.offsets.packages + i*PLANET_PACKAGE_SIZE, this.offsets, i);
      if (pkg.valid) {
        yield pkg;
      }
    }
  }
  addPackage(dataHash, position, quaternion) {
    for (let i = 0; i < PLANET_BUILD_SLOTS; i++) {
      const pkg = new SubparcelPackage(this.data, this.offsets.packages + i*PLANET_PACKAGE_SIZE, this.offsets, i);
      if (!pkg.valid) {
        pkg.dataHash = dataHash;
        pkg.position = position.toArray(new Float32Array(3));
        pkg.quaternion = quaternion.toArray(new Float32Array(4));
        return pkg;
      }
    }
    throw new Error('no more slots for package');
  }
  removePackage(index) {
    const pkg = new SubparcelObject(this.data, this.offsets.packages + index*PLANET_PACKAGE_SIZE, this.offsets, index);
    pkg.valid = false;
  }
}
Subparcel.getOffsets = subparcelSize => {
  let index = 0;

  const xyz = index;
  index += Int32Array.BYTES_PER_ELEMENT * 3;
  const potentials = index;
  index += subparcelSize * subparcelSize * subparcelSize * Float32Array.BYTES_PER_ELEMENT;
  // const buildsLength = index;
  // index += Uint32Array.BYTES_PER_ELEMENT;
  const builds = index;
  index += PLANET_BUILD_SIZE * PLANET_BUILD_SLOTS;
  // const packagesLength = index;
  // index += Uint32Array.BYTES_PER_ELEMENT;
  const packages = index;
  index += PLANET_PACKAGE_SIZE * PLANET_PACKAGE_SLOTS;
  const length = index;

  return {
    xyz,
    potentials,
    // buildsLength,
    builds,
    // packagesLength,
    packages,
    length,
  };
};

const _addSubparcel = (x, y, z) => {
  const subparcel = new Subparcel(x, y, z);
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