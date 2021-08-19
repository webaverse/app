import * as THREE from 'three';
import storage from './storage.js';
import {XRChannelConnection} from './xrrtc.js';
import Y from './yjs.js';
import {loginManager} from './login.js';
import runtime from './runtime.js';
import {rigManager} from './rig.js';
import physicsManager from './physics-manager.js';
import transformControls from './transform-controls.js';
import messages from './messages.js';
import {pointers} from './web-monetization.js';
import {camera, appManager, scene, sceneHighPriority} from './app-object.js';
import {baseUnit} from './constants.js';
import {contentIdToFile, unFrustumCull} from './util.js';
import {
  storageHost,
  // worldsHost,
  tokensHost,
} from './constants.js';
import {makePromise, getRandomString} from './util.js';

// world
export const world = new EventTarget();

// static states are local and non-user editable
// dynamic states are multiplayer and user-editable
const states = {
  static: new Y.Doc(),
  dynamic: new Y.Doc(),
};
const _getState = dynamic => dynamic ? states.dynamic : states.static;
const objects = {
  objects: {
    static: [],
    dynamic: [],
  },
  npcs: {
    static: [],
    dynamic: [],
  },
};
const _getObjects = (arrayName, dynamic) => objects[arrayName][dynamic ? 'dynamic' : 'static'];

// multiplayer
let roomName = null;
let channelConnection = null;
let channelConnectionOpen = null;
const peerConnections = [];

const _getOrCreateTrackedObject = (name, dynamic, arrayName) => {
  const state = _getState(dynamic);
  const objects = state.getArray(arrayName);
  const objectsJson = objects.toJSON();
  if (!objectsJson.includes(name)) {
    objects.push([name]);
  }

  return state.getMap(arrayName + '.' + name);
};

const _bindState = (state, dynamic) => {
  for (const arrayName of ['objects', 'npcs']) {
    const objects = state.getArray(arrayName);
    let lastObjects = [];
    objects.observe(() => {
      const nextObjects = objects.toJSON();

      for (const name of nextObjects) {
        if (!lastObjects.includes(name)) {
          const trackedObject = _getOrCreateTrackedObject(name, dynamic, arrayName);
          world.dispatchEvent(new MessageEvent('tracked' + arrayName + 'add', {
            data: {
              trackedObject,
              dynamic,
            },
          }));
        }
      }
      for (const name of lastObjects) {
        if (!nextObjects.includes(name)) {
          const trackedObject = state.getMap(arrayName + '.' + name);
          world.dispatchEvent(new MessageEvent('tracked' + arrayName + 'remove', {
            data: {
              trackedObject,
              dynamic,
            },
          }));
        }
      }

      lastObjects = nextObjects;
    });
  }
};
_bindState(states.static, false);
_bindState(states.dynamic, true);
world.connectRoom = async (roomName, worldURL) => {
  channelConnection = new XRChannelConnection(`wss://${worldURL}`, {roomName});

  let interval;
  channelConnection.addEventListener('open', async e => {
    channelConnectionOpen = true;
    console.log('Channel Open!');

    if (networkMediaStream) {
      channelConnection.setMicrophoneMediaStream(networkMediaStream);
    }
    

    interval = setInterval(() => {
      const name = loginManager.getUsername();
      const avatarSpec = loginManager.getAvatar();
      const avatarUrl = avatarSpec && avatarSpec.url;
      const avatarExt = avatarSpec && avatarSpec.ext;
      const address = loginManager.getAddress();
      const aux = rigManager.localRig?.aux.getPose();
      channelConnection.send(JSON.stringify({
        request: true,
        id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
        method: 'status',

        data: {
          peerId: channelConnection.connectionId,
          status: {
            name,
            avatarUrl,
            avatarExt,
            address,
            aux,
          },
        },
      }));
      const pose = rigManager.getLocalAvatarPose();
      channelConnection.send(JSON.stringify({
        method: 'pose',
        data: {
          pose,
        },
      }));
    }, 10);
  

    /* world.dispatchEvent(new MessageEvent('peersupdate', {
      data: Array.from(rigManager.peerRigs.values()),
    })); */
  }, {once: true});
  channelConnection.addEventListener('close', e => {
    if (interval) {
      clearInterval(interval);
    }
    channelConnectionOpen = false;
  }, {once: true});
  channelConnection.addEventListener('peerconnection', async e => {
    const peerConnection = e.data;
    console.log('new peer connection', e);

    let microphoneMediaStream = null;
    let live = true;

    rigManager.addPeerRig(peerConnection.connectionId);
    const peerRig = rigManager.peerRigs.get(peerConnection.connectionId);
    peerRig.peerConnection = peerConnection;

    peerConnection.addEventListener('close', async () => {
      console.log('peer connection close');
      peerConnections.splice(peerConnections.indexOf(peerConnection), 1);
      rigManager.removePeerRig(peerConnection.connectionId);
      live = false;

      /* world.dispatchEvent(new MessageEvent('peersupdate', {
        data: Array.from(rigManager.peerRigs.values()),
      })); */
    });

    peerConnection.addEventListener('status', e => {
      const {peerId, status: {name, avatarUrl, avatarExt, address, aux}} = e.data;
      const peerRig = rigManager.peerRigs.get(peerId);
      peerRig.address = address;
      peerConnection.address = address;

      // let updated = false;

      const currentPeerName = peerRig.textMesh.text;
      if (currentPeerName !== name) {
        rigManager.setPeerAvatarName(name, peerId);
        // updated = true;
      }

      const newAvatarUrl = avatarUrl || null;
      const currentAvatarUrl = peerRig.avatarUrl;
      if (currentAvatarUrl !== newAvatarUrl) {
        rigManager.setPeerAvatarUrl(newAvatarUrl, avatarExt, peerId);
        // updated = true;
      }

      if (currentAvatarUrl !== newAvatarUrl) {
        rigManager.setPeerAvatarUrl(newAvatarUrl, avatarExt, peerId);
        // updated = true;
      }
      
      rigManager.setPeerAvatarAux(aux, peerId);

      /* if (updated) {
        world.dispatchEvent(new MessageEvent('peersupdate', {
          data: Array.from(rigManager.peerRigs.values()),
        }));
      } */
    });
    peerConnection.addEventListener('pose', e => {
      // const [head, leftGamepad, rightGamepad, floorHeight] = e.data;
      const {pose} = e.data;
      rigManager.setPeerAvatarPose(pose, peerConnection.connectionId);
    });
    peerConnection.addEventListener('chat', e => {
      const {peerId, username, text} = e.data;
      messages.addMessage(username, text, {
        update: false,
      });
    });
    peerConnection.addEventListener('addtrack', e => {
      const track = e.data;
      microphoneMediaStream = new MediaStream([track]);
      const audio = document.createElement('audio');
      audio.srcObject = microphoneMediaStream;
      const _tryPlay = async () => {
        try {
          await audio.play();
        } catch(err) {
          console.warn('play failed', err);
          setTimeout(_tryPlay, 1000);
        }
      };
      _tryPlay();
      if (peerRig) {
        rigManager.setPeerMicMediaStream(microphoneMediaStream, peerConnection.connectionId);
        track.addEventListener('ended', e => {
          rigManager.setPeerMicMediaStream(null, peerConnection.connectionId);
          audio.srcObject = null;
        });
      }
    });
    peerConnections.push(peerConnection);
  });
  channelConnection.close = (close => function() {
    close.apply(this, arguments);
    
    channelConnection.dispatchEvent(new MessageEvent('close'));
    
    const localPeerConnections = peerConnections.slice();
    for (const peerConnection of localPeerConnections) {
      peerConnection.close();
    }
  })(channelConnection.close);

  states.dynamic = channelConnection.state;
  _bindState(states.dynamic, true);
  
  return channelConnection;
};
world.disconnectRoom = () => {
  if (channelConnection) {
    channelConnection.close();
    channelConnection = null;

    const localObjects = objects.objects.dynamic.slice();
    for (const object of localObjects) {
      world.removeObject(object.instanceId);
    }

    states.dynamic = new Y.Doc();
    _bindState(states.dynamic, true);
  }
  return channelConnection;
};

world.initializeIfEmpty = spec => {
  console.log('initialize if empty', spec); // XXX
};

world.getObjects = () => objects.objects.dynamic.slice();
world.getStaticObjects = () => objects.objects.static.slice();
world.getNpcs = () => objects.npcs.dynamic.slice();
let pendingAddPromise = null;
const _addObject = (dynamic, arrayName) => (contentId, parentId = null, position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), options = {}) => {
  const scale = new THREE.Vector3();
  const state = _getState(dynamic);
  const instanceId = getRandomString();
  state.transact(() => {
    const trackedObject = _getOrCreateTrackedObject(instanceId, dynamic, arrayName);
    trackedObject.set('instanceId', instanceId);
    trackedObject.set('parentId', parentId);
    trackedObject.set('contentId', contentId);
    trackedObject.set('position', position.toArray());
    trackedObject.set('quaternion', quaternion.toArray());
    trackedObject.set('scale', scale.toArray());
    trackedObject.set('options', JSON.stringify(options));
  });
  if (pendingAddPromise) {
    const result = pendingAddPromise;
    pendingAddPromise = null;
    return result;
  } else {
    throw new Error('no pending world add object promise');
  }
};
const _removeObject = (dynamic, arrayName) => removeInstanceId => {
  const state = _getState(dynamic);
  state.transact(() => {
    const index = pointers.findIndex(x => x.instanceId === removeInstanceId);
    if (index === -1) pointers.splice(index, 1);

    const objects = state.getArray(arrayName);
    const objectsJson = objects.toJSON();
    const removeIndex = objectsJson.indexOf(removeInstanceId);
    if (removeIndex !== -1) {
      const childRemoveIndices = (() => {
        const result = [];
        for (let i = 0; i < objectsJson.length; i++) {
          const objectInstanceId = objectsJson[i];
          const object = state.getMap(arrayName + '.' + objectInstanceId);
          const objectJson = object.toJSON();
          if (objectJson.parentId === removeInstanceId) {
            result.push(i);
          }
        }
        return result;
      })();
      const allRemoveIndices = [removeIndex].concat(childRemoveIndices);
      for (const removeIndex of allRemoveIndices) {
        const instanceId = objectsJson[removeIndex];

        objects.delete(removeIndex, 1);

        const trackedObject = state.getMap(arrayName + '.' + instanceId);
        const keys = Array.from(trackedObject.keys());
        for (const key in keys) {
          trackedObject.delete(key);
        }
      }
    } else {
      console.warn('invalid remove instance id', {dynamic, arrayName, removeInstanceId, objectsJson});
    }
  });
};
world.add = (dynamic, arrayName, ...args) => _addObject(dynamic, arrayName)(...args);
world.remove = (dynamic, arrayName, id) => _removeObject(dynamic, arrayName)(id);
world.addObject = _addObject(true, 'objects');
world.removeObject = _removeObject(true, 'objects');
world.addStaticObject = _addObject(false, 'objects');
world.removeStaticObject = _removeObject(false, 'objects');
world.addNpc = _addObject(true, 'npcs');
world.removeNpc = _removeObject(true, 'npcs');
for (const arrayName of [
  'objects',
  'npcs',
]) {
  world.addEventListener('tracked' + arrayName + 'add', async e => {
    const p = makePromise();
    pendingAddPromise = p;

    try {
      const {trackedObject, dynamic} = e.data;
      const trackedObjectJson = trackedObject.toJSON();
      const {instanceId, parentId, contentId, position, quaternion, options: optionsString} = trackedObjectJson;
      const options = JSON.parse(optionsString);

      const file = await contentIdToFile(contentId);
      let mesh;
      if (file) {
        mesh = await runtime.loadFile(file, {
          contentId,
          instanceId: instanceId,
          physics: options.physics,
          physics_url: options.physics_url,
          autoScale: options.autoScale,
          autoRun: options.autoRun,
          dynamic,
          monetizationPointer: file.token ? file.token.owner.monetizationPointer : "",
          ownerAddress: file.token ? file.token.owner.address : ""
        });
        if (mesh) {
          mesh.position.fromArray(position);
          mesh.quaternion.fromArray(quaternion);

          unFrustumCull(mesh);
          
          // mesh.name = file.name;
          mesh.contentId = contentId;
          mesh.instanceId = instanceId;
          mesh.parentId = parentId;

          if (mesh.renderOrder === -Infinity) {
            sceneHighPriority.add(mesh);
          } else {
            scene.add(mesh);
          }

          mesh.run && await mesh.run();
          /* if (mesh.getStaticPhysicsIds) {
            const staticPhysicsIds = mesh.getStaticPhysicsIds();
            for (const physicsId of staticPhysicsIds) {
              physicsManager.setPhysicsTransform(physicsId, mesh.position, mesh.quaternion, mesh.scale);
            }
          } */
          
          mesh.addEventListener('die', () => {
            world.remove(dynamic, arrayName, mesh.instanceId);
          });
        } else {
          console.warn('failed to load object', file);

          mesh = new THREE.Object3D();
          scene.add(mesh);
        }

        mesh.setPose = (position, quaternion, scale) => {
          trackedObject.set('position', position.toArray());
          trackedObject.set('quaternion', quaternion.toArray());
          trackedObject.set('scale', scale.toArray());
        };

        const _observe = () => {
          mesh.position.fromArray(trackedObject.get('position'));
          mesh.quaternion.fromArray(trackedObject.get('quaternion'));
          mesh.scale.fromArray(trackedObject.get('scale'));
        };
        trackedObject.observe(_observe);
        trackedObject.unobserve = trackedObject.unobserve.bind(trackedObject, _observe);

        if (file.token && file.token.owner.address && file.token.owner.monetizationPointer && file.token.owner.monetizationPointer[0] === "$") {
          const monetizationPointer = file.token.owner.monetizationPointer;
          const ownerAddress = file.token.owner.address.toLowerCase();
          pointers.push({ contentId, instanceId, monetizationPointer, ownerAddress });
        }

        const objects = _getObjects(arrayName, dynamic);
        objects.push(mesh);

        world.dispatchEvent(new MessageEvent(arrayName + 'add', {
          data: mesh,
        }));
      } else {
        mesh = null;
      }

      p.accept(mesh);
    } catch (err) {
      p.reject(err);
    }
  });
  world.addEventListener('tracked' + arrayName + 'remove', async e => {
    const {trackedObject, dynamic} = e.data;
    const instanceId = trackedObject.get('instanceId');
    const objects = _getObjects(arrayName, dynamic);
    const index = objects.findIndex(object => object.instanceId === instanceId);
    if (index !== -1) {
      const object = objects[index];
      object.destroy && object.destroy();
      object.parent.remove(object);
      objects.splice(index, 1);
      trackedObject.unobserve();

      /* const binding = transformControls.getBinding();
      if (binding === object) {
        transformControls.bind(null);
      } */

      world.dispatchEvent(new MessageEvent(arrayName + 'remove', {
        data: object,
      }));
    }
  });
}
world.isObject = object => objects.includes(object);

world.getWorldJson = async q => {
  const _getDefaultSpec = () => ({
    default: true,
    objects: [],
  });
  const _getSpecFromUrl = async u => {
    return {
      objects: [
        {
          start_url: u,
        }
      ],
    };
  };
  const _hashExtNameToStartUrl = (hash, ext, name) => {
    let start_url;
    if (ext === 'html') {
      start_url = `${storageHost}/ipfs/${hash}`;
    } else {
      start_url = `${storageHost}/${hash}/${name}.${ext}`;
    }
    return start_url;
  };
  const _fetchSpecFromTokenId = async idString => {
    const id = parseInt(idString, 10);
    if (!isNaN(id)) { // token id
      const res = await fetch(`${tokensHost}/${id}`);
      const j = await res.json();
      const {hash} = j.properties;
      if (hash) {
        const {name, ext} = j.properties;
        const start_url = _hashExtNameToStartUrl(hash, ext, name);
        return {
          objects: [
            {
              start_url,
            }
          ],
        };
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
  const _getSpecFromHashExt = (hash, ext) => {
    const name = 'token';
    const start_url = _hashExtNameToStartUrl(hash, ext, name);
    return {
      objects: [
        {
          start_url,
        }
      ],
    };
  };
  const _dynamicizeSpec = spec => {
    for (const object of spec.objects) {
      object.dynamic = true;
      object.autoScale = false;
      object.autoRun = true;
    }
    spec.objects.splice(0, 0, {
      start_url: `https://webaverse.github.io/pedestal/index.js`,
    });
  };

  let spec;
  const {u, t, h, e} = q;
  if (u) {
    spec = _getSpecFromUrl(u);
  } else if (h && e) {
    spec = _getSpecFromHashExt(h, e);
    _dynamicizeSpec(spec);
    camera.position.set(0, 0, baseUnit);
    // camera.updateMatrixWorld();
  } else if (t) {
    spec = await _fetchSpecFromTokenId(t);
    _dynamicizeSpec(spec);
    camera.position.set(0, 0, baseUnit);
    // camera.updateMatrixWorld();
  } else {
    spec = _getDefaultSpec();
  }
  if (spec) {
    if (q.r) {
      spec.room = q.r;
    }
    return spec;
  } else {
    throw new Error('could not resolve query string to start spec: ' + JSON.stringify(q));
  }
};

world.getObjectFromPhysicsId = physicsId => {
  const objects = world.getObjects().concat(world.getStaticObjects());
  for (const object of objects) {
    if (object.getPhysicsIds) {
      const physicsIds = object.getPhysicsIds();
      if (physicsIds.includes(physicsId)) {
        return object;
      }
    }
  }
  return null;
};
world.getNpcFromPhysicsId = physicsId => {
  const npcs = world.getNpcs();
  for (const npc of npcs) {
    if (npc.getPhysicsIds) {
      const physicsIds = npc.getPhysicsIds();
      if (physicsIds.includes(physicsId)) {
        return npc;
      }
    }
  }
  return null;
};

let animationMediaStream = null
let networkMediaStream = null;
const _latchMediaStream = async () => {
  networkMediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  if (channelConnection) {
    await channelConnection.setMicrophoneMediaStream(networkMediaStream);
  }
};
const _unlatchMediaStream = async () => {
  if (channelConnection) {
    await channelConnection.setMicrophoneMediaStream(null);
  }

  const tracks = networkMediaStream.getTracks();
  for (const track of tracks) {
    track.stop();
  }
  networkMediaStream = null;
};

const micButton = document.getElementById('key-t');
world.toggleMic = async () => {
  if (!animationMediaStream) {
    micButton && micButton.classList.add('enabled');

    animationMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    rigManager.localRig && rigManager.localRig.setMicrophoneMediaStream(animationMediaStream);

    _latchMediaStream();
  } else {
    micButton && micButton.classList.remove('enabled');

    rigManager.localRig && rigManager.localRig.setMicrophoneMediaStream(null);
    const tracks = animationMediaStream.getTracks();
    for (const track of tracks) {
      track.stop();
    }
    animationMediaStream = null;

    _unlatchMediaStream();
  }

  return animationMediaStream;
};
micButton && micButton.addEventListener('click', async e => {
  world.toggleMic()
    .catch(console.warn);
});

messages.addEventListener('messageadd', e => {
  if (channelConnection) {
    const {username, text} = e.data;
    channelConnection.send(JSON.stringify({
      method: 'chat',
      data: {
        peerId: channelConnection.connectionId,
        username,
        text,
      },
    }));
  }
});
