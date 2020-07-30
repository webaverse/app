import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import storage from './storage.js';
import {
  PARCEL_SIZE,
  SUBPARCEL_SIZE,
  SUBPARCEL_SIZE_P1,
  NUM_PARCELS,
  MAX_NAME_LENGTH,
  PLANET_OBJECT_SLOTS,
  PLANET_OBJECT_SIZE,

  getNextMeshId,
} from './constants.js';
import {XRChannelConnection} from 'https://2.metartc.com/xrrtc.js';

const presenceHost = 'wss://rtc.exokit.org:4443';
export const OBJECT_TYPES = {
  VEGETATION: 1,
  PACKAGE: 2,
};

const upVector = new THREE.Vector3(0, 1, 0);

function abs(n) {
  return (n ^ (n >> 31)) - (n >> 31);
}
function sign(n) {
  return -(n >> 31);
}
const _getSubparcelIndex = (x, y, z) => abs(x)|(abs(y)<<9)|(abs(z)<<18)|(sign(x)<<27)|(sign(y)<<28)|(sign(z)<<29);
const _getSubparcelXYZ = index => {
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
};
const _getPotentialIndex = (x, y, z) => x + y*SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1 + z*SUBPARCEL_SIZE_P1;
const potentialDefault = -0.5;

// planet

export const planet = new EventTarget();

let state = null;
let subparcels = {};

planet.getSubparcelIndex = _getSubparcelIndex;

const _getStringLength = s => {
  let i;
  for (i = 0; i < s.length; i++) {
    if (s[i] === 0) {
      break;
    }
  }
  return i;
};
/* const _serializeState = state => {
  const offsets = Subparcel.getOffsets();
  const numSubparcels = Object.keys(subparcels).length;
  const ab = new ArrayBuffer(
    MAX_NAME_LENGTH + // seedString
    Uint32Array.BYTES_PER_ELEMENT + // parcelSize
    Uint32Array.BYTES_PER_ELEMENT + // subparcelSize
    Uint32Array.BYTES_PER_ELEMENT + // subparcels.length
    offsets.length * numSubparcels // subparcels
  );

  let index = 0;
  const seedStringDst = new Uint8Array(ab);
  const seedStringSrc = new TextEncoder().encode(state.seedString);
  seedStringDst.set(seedStringSrc);
  seedStringDst[seedStringSrc.byteLength] = 0;
  index += MAX_NAME_LENGTH;

  new Uint32Array(ab, index)[0] = state.parcelSize;
  index += Uint32Array.BYTES_PER_ELEMENT;

  new Uint32Array(ab, index)[0] = state.subparcelSize;
  index += Uint32Array.BYTES_PER_ELEMENT;

  new Uint32Array(ab, index)[0] = numSubparcels;
  index += Uint32Array.BYTES_PER_ELEMENT;

  for (const index in subparcels) {
    const subparcel = subparcels[index];
    new Uint8Array(ab, index, offsets.length)
      .set(
        new Uint8Array(subparcel.data, subparcel.offset, offsets.length)
      );
    index += offsets.length;
  }

  return ab;
};
const _deserializeState = ab => {
  const offsets = Subparcel.getOffsets();

  let index = 0;
  const seedStringLength = _getStringLength(new Uint8Array(ab));
  const seedString = new TextDecoder().decode(new Uint8Array(ab, 0, seedStringLength));
  index += MAX_NAME_LENGTH;

  const parcelSize = new Uint32Array(ab, index, 1)[0];
  index += Uint32Array.BYTES_PER_ELEMENT;

  const subparcelSize = new Uint32Array(ab, index, 1)[0];
  index += Uint32Array.BYTES_PER_ELEMENT;

  const numSubparcels = new Uint32Array(ab, index, 1)[0];
  index += Uint32Array.BYTES_PER_ELEMENT;

  const subparcels = {};
  for (let i = 0; i < numSubparcels; i++) {
    const subparcel = new Subparcel(ab, index);
    subparcel.readMetadata();
    subparcel.vegetations = _makeVegetations(subparcel.x, subparcel.y, subparcel.z);
    const index = _getSubparcelIndex(subparcel.x, subparcel.y, subparcel.z);
    subparcels[index] = subparcel;
    index += offsets.length;
  }

  return {
    seedString,
    parcelSize,
    subparcelSize,
    subparcels,
  };
}; */

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
      this._id = new Uint8Array(this.data, this.offset + index, 1);
      index += Uint32Array.BYTES_PER_ELEMENT;
      this._type = new Uint8Array(this.data, this.offset + index, 1);
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
    this.name = new TextDecoder().decode(new Uint8Array(this._name.buffer, this._name.byteOffset, nameLength));
  }
}

export class Subparcel {
  constructor(data) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.index = 0;
    this.offsets = Subparcel.getOffsets();
    this.data = null;
    this.potentials = null;
    this._numObjects = null;
    this.vegetations = [];
    this.packages = [];
    this.load = null;
    this.dirty = false;

    this.latchData(data || new ArrayBuffer(this.offsets.initialLength));
    data && this.reload();
  }
  latchData(data) {
    this.data = data;
    this.potentials = new Float32Array(this.data, this.offsets.potentials, SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1);
    this._numObjects = new Uint32Array(this.data, this.offsets.numObjects, 1);
  }
  reload() {
    this.readMetadata();
    this.vegetations.length = 0;
    this.packages.length = 0;
    const numObjects = this._numObjects[0];
    for (let i = 0; i < numObjects; i++) {
      const o = new SubparcelObject(this.data, this.offsets.objects + i*PLANET_OBJECT_SIZE, i, this);
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
    const dst = new Int32Array(this.data, this.offsets.xyz, 3);
    dst[0] = this.x;
    dst[1] = this.y;
    dst[2] = this.z;
  }
  readMetadata() {
    const src = new Int32Array(this.data, this.offsets.xyz, 3);
    this.x = src[0];
    this.y = src[1];
    this.z = src[2];
    this.index = _getSubparcelIndex(this.x, this.y, this.z);
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
    const nextIndex = this._numObjects[0]++;
    if (this.offsets.objects + nextIndex*PLANET_OBJECT_SIZE >= this.data.byteLength) {
      const newData = new ArrayBuffer(this.data.byteLength + PLANET_OBJECT_SLOTS*PLANET_OBJECT_SIZE);
      new Uint8Array(newData).set(new Uint8Array(this.data));
      this.latchData(newData);
      this.reload();
    }

    const vegetation = new SubparcelObject(this.data, this.offsets.objects + nextIndex*PLANET_OBJECT_SIZE, nextIndex, this);
    vegetation.id = Math.floor(Math.random()*0xFFFFFF);
    vegetation.type = OBJECT_TYPES.VEGETATION;
    vegetation.name = type;
    position.toArray(vegetation.position);
    quaternion.toArray(vegetation.quaternion);
    vegetation.writeMetadata();
    this.vegetations.push(vegetation);
    return vegetation;
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
      console.warn('removing nonexistent vegetation', vegetation);
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
    const subparcel = new Subparcel(this.data.slice());
    subparcel.reload();
    return subparcel;
  }
}
Subparcel.getOffsets = () => {
  let index = 0;

  const xyz = index;
  index += Int32Array.BYTES_PER_ELEMENT * 3;
  const potentials = index;
  index += SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * Float32Array.BYTES_PER_ELEMENT;
  const numObjects = index;
  index += Uint32Array.BYTES_PER_ELEMENT;
  const objects = index;
  index += PLANET_OBJECT_SIZE * PLANET_OBJECT_SLOTS;
  const initialLength = index;

  return {
    xyz,
    potentials,
    numObjects,
    objects,
    initialLength,
  };
};

const _addSubparcel = (x, y, z, index) => {
  const subparcel = new Subparcel();
  subparcel.x = x;
  subparcel.y = y;
  subparcel.z = z;
  subparcel.index = index;
  subparcel.writeMetadata();
  // subparcel.vegetations = _makeVegetations(subparcel.x, subparcel.y, subparcel.z);
  subparcels[index] = subparcel;
  return subparcel;
};
planet.getSubparcelByIndex = index => {
  let subparcel = subparcels[index];
  if (!subparcel) {
    const [x, y, z] = _getSubparcelXYZ(index);
    subparcel = _addSubparcel(x, y, z, index);
  }
  return subparcel;
};
planet.getSubparcel = (x, y, z) => {
  const index = _getSubparcelIndex(x, y, z);
  let subparcel = subparcels[index];
  if (!subparcel) {
    subparcel = _addSubparcel(x, y, z, index);
  }
  return subparcel;
};
planet.editSubparcel = (x, y, z, fn) => {
  let index = _getSubparcelIndex(x, y, z);
  if (!subparcels[index]) {
    _addSubparcel(x, y, z, index);
  }
  const subparcel = subparcels[index];
  fn(subparcel);
  subparcel.dirty = true;
};

const _loadLiveState = seedString => {
  planet.dispatchEvent(new MessageEvent('unload'));
  planet.dispatchEvent(new MessageEvent('load', {
    data: state,
  }));
};

const _makeVegetations = (() => {
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
})();
const _saveStorage = async roomName => {
  for (const index in subparcels) {
    const subparcel = subparcels[index];
    if (subparcel.dirty) {
      subparcel.dirty = false;
      await storage.setRaw(`planet/${roomName}/subparcels/${subparcel.x}/${subparcel.y}/${subparcel.z}`, subparcel.data);
    }
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
      const p = storage.getRaw(k)
        .then(ab => {
          const subparcel = new Subparcel(ab);
          subparcel.readMetadata();
          subparcel.load = Promise.resolve();
          // subparcel.vegetations = _makeVegetations(subparcel.x, subparcel.y, subparcel.z);
          return subparcel;
        });
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