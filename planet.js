import storage from './storage.js';
import {
  PARCEL_SIZE,
  SUBPARCEL_SIZE,
  SUBPARCEL_SIZE_P1,
  SUBPARCEL_SIZE_P3,
  MAX_NAME_LENGTH,
  PLANET_OBJECT_SLOTS,
  PLANET_OBJECT_SIZE,
} from './constants.js';
import {XRChannelConnection} from './xrrtc.js';
import {loginManager} from './login.js';
import {storageHost, worldsHost} from './constants.js';
import {makePromise} from './util.js';
// import * as THREE from './three.module.js';
// import { makeTextMesh } from './vr-ui.js';

const peerAvatarHashes = new Map();

function abs(n) {
  return (n ^ (n >> 31)) - (n >> 31);
}
function sign(n) {
  return -(n >> 31);
}
const _getSubparcelIndex = (x, y, z) => abs(x) | (abs(y) << 9) | (abs(z) << 18) | (sign(x) << 27) | (sign(y) << 28) | (sign(z) << 29);
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
const _getPotentialIndex = (x, y, z) => (x + 1) + (y + 1) * SUBPARCEL_SIZE_P3 * SUBPARCEL_SIZE_P3 + (z + 1) * SUBPARCEL_SIZE_P3;
const _getFieldIndex = (x, y, z) => x + y * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 + z * SUBPARCEL_SIZE_P1;

// planet
export const planet = new EventTarget();

planet.getSubparcelIndex = _getSubparcelIndex;
planet.getPotentialIndex = _getPotentialIndex;
planet.getFieldIndex = _getFieldIndex;

let scene;
let rigManager;
planet.setBindings = (_scene, _rigManager) => {
  scene = _scene;
  rigManager = _rigManager;
};

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
      index += Uint32Array.BYTES_PER_ELEMENT * 3;
      this.quaternion = new Float32Array(this.data, this.offset + index, 4);
      index += Uint32Array.BYTES_PER_ELEMENT * 4;
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
        new Uint8Array(o.data, o.offset, PLANET_OBJECT_SIZE),
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
  constructor(data = null, offset = 0) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.index = 0;
    this.data = null;
    this.offset = 0;
    this.potentials = null;
    this.biomes = null;
    this.heightfield = null;
    this.lightfield = null;
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
    this.potentials = new Float32Array(this.data, this.offset + Subparcel.offsets.potentials, SUBPARCEL_SIZE_P3 * SUBPARCEL_SIZE_P3 * SUBPARCEL_SIZE_P3);
    this.biomes = new Uint8Array(this.data, this.offset + Subparcel.offsets.biomes, SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1);
    this.heightfield = new Int8Array(this.data, this.offset + Subparcel.offsets.heightfield, SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1);
    this.lightfield = new Uint8Array(this.data, this.offset + Subparcel.offsets.lightfield, SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1);
    this._numObjects = new Uint32Array(this.data, this.offset + Subparcel.offsets.numObjects, 1);
  }

  reload() {
    this.readMetadata();
    this.vegetations.length = 0;
    this.packages.length = 0;
    const numObjects = this._numObjects[0];
    for (let i = 0; i < numObjects; i++) {
      const o = new SubparcelObject(this.data, this.offset + Subparcel.offsets.objects + i * PLANET_OBJECT_SIZE, i, this);
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

      const vegetation = new SubparcelObject(this.data, this.offset + Subparcel.offsets.objects + nextIndex * PLANET_OBJECT_SIZE, nextIndex, this);
      vegetation.id = Math.floor(Math.random() * 0xFFFFFF);
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
      for (let i = index; i < this.vegetations.length - 1; i++) {
        const vegetation = this.vegetations[i];
        vegetation.copy(this.vegetations[i + 1]);
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
const locks = {};
const _lockAll = async keys => {
  keys.sort();
  const promises = edits.map(async ([key, arrayBuffer]) => {
    if (!locks[key]) {
      locks[key] = {locked: false, cbs: []};
    }
    if (!locks[key].locked) {
      locks[key].locked = true;
    } else {
      const p = makePromise();
      locks[key].cbs.push(p.accept);
      await p;
    }
  });
  await Promise.all(promises);
};
const _unlockAll = keys => {
  for (const key of keys) {
    const lock = locks[key];
    if (lock.cbs.length) {
      lock.cbs.pop()();
    } else {
      lock.locked = false;
    }
  }
};
planet.requestRemoteSubparcels = async (keys) => {
  // XXX return array of subparcel data or null if did not exist
  await _lockAll(keys);
  const promises = keys.map(key => storage.getRaw(`chunks/${key}`));
  const result = await Promise.all(promises);
  const parcels = [];
  channelConnection.dialogClient.addEventListener('getFile', e => {
    console.log(e); // requested file
    parcels.push(e.data);
    if (parcels.length === keys.length) {
      _unlockAll(keys);
      channelConnection.dialogClient.removeEventListener('getFile');
      return result;
    }
  });
  keys.forEach(key => {
    channelConnection.getFile(key);
  });
};
planet.writeSubparcels = async edits => {
  const keys = edits.map(([key]) => key);
  await _lockAll(keys);
  const promises = edits.map(async ([key, arrayBuffer]) => storage.setRaw(`chunks/${key}`, arrayBuffer));
  await Promise.all(promises);
  const responses = [];
  channelConnection.dialogClient.addEventListener('edit', e => {
    responses.push(e.data);
    if (responses.length === edits.length) {
      _unlockAll(keys);
      channelConnection.dialogClient.removeEventListener('edit');
    }
  });
  edits.forEach(edit => {
    channelConnection.runCode({script: edit, numArgs: 0});
  });
};
planet.onRemoteSubparcelsEdit = (edits) => {
  // XXX called from the connection when a peer runs an edit g
  for (const key of edits) {
    console.log('got edit', key);
  }
};
planet.makeSubparcel = (x = 0, y = 0, z = 0) => {
  const subparcel = new Subparcel();
  subparcel.x = x;
  subparcel.y = y;
  subparcel.z = z;
  subparcel.index = _getSubparcelIndex(x, y, z);
  const data = new ArrayBuffer(Subparcel.offsets.initialLength);
  subparcel.latchData(data);
  subparcel.writeMetadata();
  return subparcel;
};

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
  // planet.dispatchEvent(new MessageEvent('unload'));
  planet.dispatchEvent(new MessageEvent('load', {
    data: {
      seedString,
    },
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
/* const _saveStorage = async roomName => {
  // if (dirtySubparcels.length > 0) {
    // for (const subparcel of dirtySubparcels) {
      // await storage.setRaw(`planet/${roomName}/subparcels/${subparcel.x}/${subparcel.y}/${subparcel.z}`, subparcel.data);
    // }
    // dirtySubparcels.length = 0;
  // }
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
}; */

// multiplayer
let roomName = null;
let channelConnection = null;
let channelConnectionOpen = null;
const peerConnections = [];
let state = null;

const _connectRoom = async (roomName, worldURL) => {
  channelConnection = new XRChannelConnection(`wss://${worldURL}`, {roomName});

  channelConnection.addEventListener('open', async e => {
    channelConnectionOpen = true;
    console.log('Channel Open!');

    const queue = [];
    let index = 0;
    let bufferedAmountLow = true;
    channelConnection.send = (_send => function send(a) {
      if (bufferedAmountLow) {
        bufferedAmountLow = false;
        return _send.apply(this, arguments);
      } else {
        queue.push(a);
      }
    })(channelConnection.send);

    channelConnection.dataChannel.addEventListener('bufferedamountlow', e => {
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
      });
      await channelConnection.setMicrophoneMediaStream(mediaStream);
    };

    const micButton = document.getElementById('mic-button');
    micButton.addEventListener('click', async e => {
      micButton.classList.toggle('enabled');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (micButton.classList.contains('enabled')) {
        rigManager.localRig.setMicrophoneMediaStream(mediaStream);
        _latchMediaStream();
      } else {
        rigManager.localRig.setMicrophoneMediaStream(null);
        const tracks = mediaStream.getAudioTracks();
        tracks.forEach(t => {
          mediaStream.removeTrack(t);
        })
      }
    });

    channelConnection.dialogClient.addEventListener('peerEdit', e => {
      console.log(e);
      planet.onRemoteSubparcelsEdit(e.data.keys);
    });
  }, {once: true});
  channelConnection.addEventListener('close', e => {
    if (interval) {
      clearInterval(interval);
    }
    channelConnectionOpen = false;
  }, {once: true});
  // window.channelConnection = channelConnection;
  channelConnection.addEventListener('peerconnection', async e => {
    const peerConnection = e.data;
    console.log('New Peer', e);

    let microphoneMediaStream = null;
    let live = true;

    rigManager.addPeerRig(peerConnection.connectionId);
    const peerRig = rigManager.peerRigs.get(peerConnection.connectionId);

    peerConnection.addEventListener('close', async () => {
      peerConnections.splice(peerConnections.indexOf(peerConnection), 1);
      rigManager.removePeerRig(peerConnection.connectionId);
      live = false;
    });

    peerConnection.addEventListener('message', e => {
      const {data} = e;
      if (typeof data === 'string') {
        const j = JSON.parse(data);
        const {method} = j;
        if (method === 'pose') {
          const { pose } = j;
          const [head, leftGamepad, rightGamepad, floorHeight] = pose;
          rigManager.setPeerAvatarPose(pose, peerConnection.connectionId);
          /*
          const localEuler = new THREE.Euler();
          peerRig.textMesh = makeTextMesh();
          peerRig.textMesh.position.fromArray(head[0]);
          peerRig.textMesh.position.y += 0.5;
          peerRig.textMesh.quaternion.fromArray(head[1]);
          localEuler.setFromQuaternion(peerRig.textMesh.quaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.y += Math.PI;
          localEuler.z = 0;
          peerRig.textMesh.quaternion.setFromEuler(localEuler); 
          */
        } else if (method === 'name') {
          /*
          const {peerId, name} = j;
          if (peerRig.textMesh && peerId === peerConnection.connectionId && peerRig && name !== peerRig.textMesh.text) {
            peerRig.textMesh.text = name;
            peerRig.textMesh.sync();
          } 
          */
        } else if (method === 'avatar') {
          const {peerId, hash} = j;
          const currentPeerHash = peerAvatarHashes.get(peerId);
          if (currentPeerHash !== hash && hash) {
            rigManager.setPeerAvatarUrl(`${storageHost}/${hash}`, peerId);
          }
          peerAvatarHashes.set(peerId, hash);
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
      if (peerRig) {
        rigManager.setPeerMicMediaStream(microphoneMediaStream, peerConnection.connectionId);
        track.addEventListener('ended', e => {
          rigManager.setPeerMicMediaStream(null, peerConnection.connectionId);
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
          name: loginManager.getUsername(),
        }));
        channelConnection.send(JSON.stringify({
          method: 'avatar',
          peerId: channelConnection.connectionId,
          hash: loginManager.getAvatar(),
        }));
        const pose = rigManager.getLocalAvatarPose();
        channelConnection.send(JSON.stringify({
          method: 'pose',
          pose,
        }));
      }, 10);
    }
  });

  channelConnection.addEventListener('initState', async e => {
    const {data} = e;
    console.log('got init state', data);

    // _loadLiveState(roomName);
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
  });
};

planet.update = () => {
  // update remote player rigs
  // rigManager.update();
};

const button = document.getElementById('connectButton');
planet.connect = async ({online = true, roomName: rn, url = null} = {}) => {
  roomName = rn;
  if (online) {
    await _connectRoom(roomName, url);
    
    button.innerHTML = `
      <i class="fal fa-wifi-slash"></i>
      <div class=label>Disconnect</div>
    `;
  }
  // await _loadStorage(roomName);
  await _loadLiveState(roomName);
};
/* planet.reload = () => {
  const b = _serializeState(state);
  const s = _deserializeState(b);
  return s;
}; */

document.getElementById('connectButton').addEventListener('click', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (channelConnectionOpen) { // disconnect case
    const res = await fetch(`${worldsHost}/${worldMeta.id}`, {
      method: 'DELETE'
    });
    await res.blob();
    
    location.search = '';
  } else { // connect case
    const response = await fetch(`${worldsHost}/create`, {
      method: 'POST'
    })
    if (response.ok) {
      const json = await response.json();
      // console.log(json);
      location.search = `?w=${json.id}`;
    }
  }
});
