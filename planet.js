import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import storage from './storage.js';
import {
  PARCEL_SIZE,
  SUBPARCEL_SIZE,
  SUBPARCEL_SIZE_P1,
  SUBPARCEL_SIZE_P3,
  NUM_PARCELS,
  MAX_NAME_LENGTH,
  PLANET_OBJECT_SLOTS,
  PLANET_OBJECT_SIZE,

  getNextMeshId,
} from './constants.js';
import {XRChannelConnection} from 'https://2.metartc.com/xrrtc.js';

const presenceHost = 'wss://rtc.exokit.org:4443';

// const upVector = new THREE.Vector3(0, 1, 0);

function abs(n) {
  return (n ^ (n >> 31)) - (n >> 31);
}
function sign(n) {
  return -(n >> 31);
}
const _getSubparcelIndex = (x, y, z) => abs(x)|(abs(y)<<9)|(abs(z)<<18)|(sign(x)<<27)|(sign(y)<<28)|(sign(z)<<29);
/* const _getSubparcelXYZ = index => {
  let x = index&0x1FF; // (1<<9)-1
  index >>>= 9;
  let y = index&0x1FF;
  index >>>= 9;
  let z = index&0x1FF;
  index >>>= 9;
  const sx = index&0x1;
  if (sx) { x *= -1; }
  index >>>= 1;
  const sy = index&0x1;
  if (sy) { y *= -1; }
  index >>>= 1;
  const sz = index&0x1;
  if (sz) { z *= -1; }
  return [x, y, z];
}; */
const _getPotentialIndex = (x, y, z) => (x+1) + (y+1)*SUBPARCEL_SIZE_P3*SUBPARCEL_SIZE_P3 + (z+1)*SUBPARCEL_SIZE_P3;
const _getFieldIndex = (x, y, z) => x + y*SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1 + z*SUBPARCEL_SIZE_P1;

// planet

export const planet = new EventTarget();

let state = null;

planet.getSubparcelIndex = _getSubparcelIndex;
planet.getPotentialIndex = _getPotentialIndex;
planet.getFieldIndex = _getFieldIndex;

const _getStringLength = s => {
  let i;
  for (i = 0; i < s.length; i++) {
    if (s[i] === 0) {
      break;
    }
  }
  return i;
};

export const OBJECT_TYPES = {
  VEGETATION: 1,
  PACKAGE: 2,
};
export class SubparcelObject {
  constructor(data, offset, index, subparcel) {
    this.data = data;
    this.offset = offset;
    this.index = index;
    this.subparcel = subparcel;

    this.id = 0;
    this.type = 0;
    this.name = '';

    {
      let index = 0;
      this._id = new Uint32Array(this.data, this.offset + index, 1);
      index += Uint32Array.BYTES_PER_ELEMENT;
      this._type = new Uint32Array(this.data, this.offset + index, 1);
      index += Uint32Array.BYTES_PER_ELEMENT;
      this._name = new Uint8Array(this.data, this.offset + index, MAX_NAME_LENGTH);
      index += MAX_NAME_LENGTH;
      this.position = new Float32Array(this.data, this.offset + index, 3);
      index += Uint32Array.BYTES_PER_ELEMENT*3;
      this.quaternion = new Float32Array(this.data, this.offset + index, 4);
      index += Uint32Array.BYTES_PER_ELEMENT*4;
    }
  }
  equals(bm) {
    return this.id === bm.id &&
      this.subparcel.x === bm.subparcel.x &&
      this.subparcel.y === bm.subparcel.y &&
      this.subparcel.z === bm.subparcel.z;
  }
  getNameLength() {
    return _getStringLength(this._name);
  }
  copy(o) {
    new Uint8Array(this.data, this.offset, PLANET_OBJECT_SIZE)
      .set(
        new Uint8Array(o.data, o.offset, PLANET_OBJECT_SIZE)
      );
    this.readMetadata();
  }
  writeMetadata() {
    this._id[0] = this.id;
    this._type[0] = this.type;
    const b = new TextEncoder().encode(this.name);
    this._name.set(b);
    this._name[b.byteLength] = 0;
  }
  readMetadata() {
    this.id = this._id[0];
    this.type = this._type[0];
    const nameLength = this.getNameLength();
    this.name = new TextDecoder().decode(new Uint8Array(this._name.buffer, this._name.byteOffset, nameLength).slice());
  }
}

export class Subparcel {
  constructor(data, offset) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.index = 0;
    this.data = null;
    this.offset = 0;
    this.potentials = null;
    this.biomes = null;
    this.heightfield = null;
    this.lightfield = null
    this._numObjects = null;
    this.vegetations = [];
    this.packages = [];
    this.load = null;

    if (data) {
      this.latchData(data, offset);
      this.reload();
    }
  }
  latchData(data, offset) {
    this.data = data;
    this.offset = offset;
    this.potentials = new Float32Array(this.data, this.offset + Subparcel.offsets.potentials, SUBPARCEL_SIZE_P3*SUBPARCEL_SIZE_P3*SUBPARCEL_SIZE_P3);
    this.biomes = new Uint8Array(this.data, this.offset + Subparcel.offsets.biomes, SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1);
    this.heightfield = new Int8Array(this.data, this.offset + Subparcel.offsets.heightfield, SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1);
    this.lightfield = new Uint8Array(this.data, this.offset + Subparcel.offsets.lightfield, SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1);
    this._numObjects = new Uint32Array(this.data, this.offset + Subparcel.offsets.numObjects, 1);
  }
  reload() {
    this.readMetadata();
    this.vegetations.length = 0;
    this.packages.length = 0;
    const numObjects = this._numObjects[0];
    for (let i = 0; i < numObjects; i++) {
      const o = new SubparcelObject(this.data, this.offset + Subparcel.offsets.objects + i*PLANET_OBJECT_SIZE, i, this);
      o.readMetadata();
      if (o.type === OBJECT_TYPES.VEGETATION) {
        this.vegetations.push(o);
      } else if (o.type === OBJECT_TYPES.PACKAGE) {
        this.packages.push(o);
      }
    }
  }
  update() {
    planet.dispatchEvent(new MessageEvent('subparcelupdate', {
      data: this,
    }));
  }
  writeMetadata() {
    const dst = new Int32Array(this.data, this.offset + Subparcel.offsets.xyzi, 4);
    dst[0] = this.x;
    dst[1] = this.y;
    dst[2] = this.z;
    dst[3] = this.index;
  }
  readMetadata() {
    const src = new Int32Array(this.data, this.offset + Subparcel.offsets.xyzi, 4);
    this.x = src[0];
    this.y = src[1];
    this.z = src[2];
    this.index = src[3];
  }
  setCube(x, y, z, r, fn) {
    for (let dx = -r; dx <= r; dx++) {
      const ax = x + dx;
      for (let dy = -r; dy <= r; dy++) {
        const ay = y + dy;
        for (let dz = -r; dz <= r; dz++) {
          const az = z + dz;
          const index = _getPotentialIndex(ax, ay, az);
          this.potentials[index] = fn(ax, ay, az);
        }
      }
    }
  }
  clearCube(x, y, z, r) {
    for (let dx = -r; dx <= r; dx++) {
      const ax = x + dx;
      for (let dy = -r; dy <= r; dy++) {
        const ay = y + dy;
        for (let dz = -r; dz <= r; dz++) {
          const az = z + dz;
          const index = _getPotentialIndex(ax, ay, az);
          this.potentials[index] = potentialDefault;
        }
      }
    }
  }
  addVegetation(type, position, quaternion) {
    if (this._numObjects[0] < PLANET_OBJECT_SLOTS) {
      const nextIndex = this._numObjects[0]++;

      const vegetation = new SubparcelObject(this.data, this.offset + Subparcel.offsets.objects + nextIndex*PLANET_OBJECT_SIZE, nextIndex, this);
      vegetation.id = Math.floor(Math.random()*0xFFFFFF);
      vegetation.type = OBJECT_TYPES.VEGETATION;
      vegetation.name = type;
      position.toArray(vegetation.position);
      quaternion.toArray(vegetation.quaternion);
      vegetation.writeMetadata();
      this.vegetations.push(vegetation);
      return vegetation;
    } else {
      throw new Error('cannot allocate vegetation slot');
    }
  }
  removeVegetation(vegetationId) {
    const index = this.vegetations.findIndex(v => v.id === vegetationId);
    if (index !== -1) {
      for (let i = index; i < this.vegetations.length-1; i++) {
        const vegetation = this.vegetations[i];
        vegetation.copy(this.vegetations[i+1]);
        vegetation.readMetadata();
      }
      this.vegetations.length--;
      this._numObjects[0]--;
    } else {
      console.warn('removing nonexistent vegetation', this.vegetations.slice(), vegetationId);
    }
  }
  /* addPackage(dataHash, position, quaternion) {
    for (let i = 0; i < this._freeList.length; i++) {
      if (!this._freeList[i]) {
        this._freeList[i] = 1;

        const pkg = new SubparcelObject(this.data, this.offset + this.offsets.objects + i*PLANET_OBJECT_SIZE, i, this);
        pkg.id = ++this._objectId[0];
        pkg.type = OBJECT_TYPES.PACKAGE;
        pkg.name = type;
        position.toArray(pkg.position);
        quaternion.toArray(pkg.quaternion);
        pkg.writeMetadata();
        this.packages.push(pkg);
        return pkg;
      }
    }
    throw new Error('no more slots for package');
  }
  removePackage(pkg) {
    const index = this.packages.indexOf(pkg);
    if (index !== -1) {
      this._freeList[pkg.index] = 0;
      this.packages.splice(index, 1);
    } else {
      console.warn('removing nonexistent package', pkg);
    }
  } */
  clone() {
    const subparcel = new Subparcel(this.data.slice(), 0);
    subparcel.reload();
    return subparcel;
  }
}
const _align4 = n => {
  const d = n % 4;
  return d ? (n + (4 - d)) : n;
};
Subparcel.offsets = (() => {
  let index = 0;

  const xyzi = index;
  index += Int32Array.BYTES_PER_ELEMENT * 4;
  const potentials = index;
  index += SUBPARCEL_SIZE_P3 * SUBPARCEL_SIZE_P3 * SUBPARCEL_SIZE_P3 * Float32Array.BYTES_PER_ELEMENT;
  const biomes = index;
  index += SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * Uint8Array.BYTES_PER_ELEMENT;
  index += 3; // align
  const heightfield = index;
  index += SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * Int8Array.BYTES_PER_ELEMENT;
  index += 1; // align
  const lightfield = index;
  index += SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * Uint8Array.BYTES_PER_ELEMENT;
  index += 1; // align
  const numObjects = index;
  index += Uint32Array.BYTES_PER_ELEMENT;
  const objects = index;
  index += PLANET_OBJECT_SIZE * PLANET_OBJECT_SLOTS;
  const initialLength = index;

  return {
    xyzi,
    potentials,
    biomes,
    heightfield,
    lightfield,
    numObjects,
    objects,
    initialLength,
  };
})();
planet.Subparcel = Subparcel;

const _loadLiveState = seedString => {
  planet.dispatchEvent(new MessageEvent('unload'));
  planet.dispatchEvent(new MessageEvent('load', {
    data: state,
  }));
};

/* const _makeVegetations = (() => {
  const numVegetations = 2;
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  const localMatrix = new THREE.Matrix4();
  return (x, y, z) => {
    const vegetations = [];
    if (y === NUM_PARCELS-1) {
      for (let i = 0; i < numVegetations; i++) {
        localVector.set(
          x*SUBPARCEL_SIZE + Math.random()*SUBPARCEL_SIZE,
          y*SUBPARCEL_SIZE + SUBPARCEL_SIZE*0.4 - 0.5,
          z*SUBPARCEL_SIZE + Math.random()*SUBPARCEL_SIZE
        );
        localQuaternion.setFromAxisAngle(upVector, Math.random()*Math.PI*2);
        localVector2.set(1, 1, 1);
        localMatrix.compose(localVector, localQuaternion, localVector2);
        vegetations.push({
          type: 'tree',
          id: getNextMeshId(),
          position: localVector.toArray(new Float32Array(3)),
          quaternion: localQuaternion.toArray(new Float32Array(4)),
          scale: localVector2.toArray(new Float32Array(3)),
          matrix: localMatrix.toArray(new Float32Array(16)),
        });
      }

      localVector.set(
        x*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2,
        y*SUBPARCEL_SIZE + SUBPARCEL_SIZE*0.4 - 0.5,
        z*SUBPARCEL_SIZE + SUBPARCEL_SIZE/2
      );
      localQuaternion.set(0, 0, 0, 1);
      // localQuaternion.setFromAxisAngle(upVector, Math.random()*Math.PI*2);
      localVector2.set(1, 1, 1);
      localMatrix.compose(localVector, localQuaternion, localVector2);
      const types = ['wall', 'floor', 'stair'];
      const type = types[Math.floor(Math.random()*types.length)];
      vegetations.push({
        type,
        id: getNextMeshId(),
        position: localVector.toArray(new Float32Array(3)),
        quaternion: localQuaternion.toArray(new Float32Array(4)),
        scale: localVector2.toArray(new Float32Array(3)),
        matrix: localMatrix.toArray(new Float32Array(16)),
      });
    }
    return vegetations;
  };
})(); */
const _saveStorage = async roomName => {
  if (dirtySubparcels.length > 0) {
    for (const subparcel of dirtySubparcels) {
      await storage.setRaw(`planet/${roomName}/subparcels/${subparcel.x}/${subparcel.y}/${subparcel.z}`, subparcel.data);
    }
    dirtySubparcels.length = 0;
  }
  // const b = _serializeState(state);
  // await storage.setRaw(roomName, b);
};
const _loadStorage = async roomName => {
  const [
    seedString,
    parcelSize,
    subparcelSize,
  ] = await Promise.all(['seedString', 'parcelSize', 'subparcelSize'].map(k => storage.get(`planet/${roomName}/${k}`)));
  if ([
    seedString,
    parcelSize,
    subparcelSize,
  ].every(v => v)) {
    state = {
      seedString,
      parcelSize,
      subparcelSize,
    };
  } else {
    state = {
      seedString: roomName,
      parcelSize: PARCEL_SIZE,
      subparcelSize: SUBPARCEL_SIZE,
    };
    await Promise.all(Object.keys(state).map(async k => {
      const v = state[k];
      await storage.set(`planet/${roomName}/${k}`, v);
    }));
  }

  const keys = await storage.keys();
  const prefix = `planet/${roomName}/subparcels/`;
  const promises = [];
  for (const k of keys) {
    if (k.startsWith(prefix)) {
      const match = k.slice(prefix.length).match(/^([-0-9]+)\/([-0-9]+)\/([-0-9]+)/);
      const p = (async () => {
        const ab = await storage.getRaw(k);
        const uint8Array = geometryWorker.alloc(Uint8Array, ab.byteLength);
        uint8Array.set(new Uint8Array(ab));
        const subparcel = new Subparcel(uint8Array);
        subparcel.readMetadata();
        subparcel.load = Promise.resolve();
        // subparcel.vegetations = _makeVegetations(subparcel.x, subparcel.y, subparcel.z);
        return subparcel;
      })();
      promises.push(p);
    }
  }
  const subparcelsArray = await Promise.all(promises);
  subparcels = {};
  for (const subparcel of subparcelsArray) {
    subparcels[subparcel.index] = subparcel;
  }
};

planet.flush = () => {
  if (state) {
    if (channelConnection) {
      throw new Error('unknown');
    } else {
      _saveStorage(state.seedString);
    }
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
/* planet.reload = () => {
  const b = _serializeState(state);
  const s = _deserializeState(b);
  return s;
}; */