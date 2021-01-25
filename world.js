import * as THREE from './three.module.js';
import storage from './storage.js';
import {XRChannelConnection} from './xrrtc.js';
import Y from './yjs.js';
import {loginManager} from './login.js';
import runtime from './runtime.js';
import {rigManager} from './rig.js';
import physicsManager from './physics-manager.js';
import messages from './messages.js';
import {pointers} from './web-monetization.js';
import {appManager, scene, scene3} from './app-object.js';
import {
  storageHost,
  // worldsHost,
  tokensHost,
} from './constants.js';
import {makePromise, getRandomString} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

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
  static: [],
  dynamic: [],
};
const _getObjects = dynamic => dynamic ? objects.dynamic : objects.static;

// multiplayer
let roomName = null;
let channelConnection = null;
let channelConnectionOpen = null;
const peerConnections = [];

const _getOrCreateTrackedObject = (name, dynamic) => {
  const state = _getState(dynamic);
  const objects = state.getArray('objects');
  const objectsJson = objects.toJSON();
  if (!objectsJson.includes(name)) {
    objects.push([name]);
  }

  return state.getMap('object.' + name);
};

const _bindState = (state, dynamic) => {
  const objects = state.getArray('objects');
  let lastObjects = [];
  objects.observe(() => {
    const nextObjects = objects.toJSON();

    // const addedObjects = [];
    // const removedObjects = [];
    for (const name of nextObjects) {
      if (!lastObjects.includes(name)) {
        // addedObjects.push(name);
        /* this.dispatchEvent(new MessageEvent('trackedobjectadd', {
          data: name,
        })); */
        const trackedObject = _getOrCreateTrackedObject(name, dynamic);
        world.dispatchEvent(new MessageEvent('trackedobjectadd', {
          data: {
            trackedObject,
            dynamic,
          },
        }));
      }
    }
    for (const name of lastObjects) {
      if (!nextObjects.includes(name)) {
        // removedObjects.push(name);
        const trackedObject = state.getMap('object.' + name);
        world.dispatchEvent(new MessageEvent('trackedobjectremove', {
          data: {
            trackedObject,
            dynamic,
          },
        }));
      }
    }

    lastObjects = nextObjects;
  });
};
_bindState(states.static, false);
_bindState(states.dynamic, true);
world.connectRoom = async (roomName, worldURL) => {
  channelConnection = new XRChannelConnection(`wss://${worldURL}`, {roomName});

  channelConnection.addEventListener('open', async e => {
    channelConnectionOpen = true;
    console.log('Channel Open!');

    if (networkMediaStream) {
      channelConnection.setMicrophoneMediaStream(networkMediaStream);
    }
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

      world.dispatchEvent(new MessageEvent('peersupdate', {
        data: Array.from(rigManager.peerRigs.values()),
      }));
    });

    peerConnection.addEventListener('status', e => {
      const {peerId, status: {name, avatarUrl, avatarExt, address}} = e.data;
      const peerRig = rigManager.peerRigs.get(peerId);
      peerRig.address = address;
      peerConnection.address = address;

      let updated = false;

      const currentPeerName = peerRig.textMesh.text;
      if (currentPeerName !== name) {
        rigManager.setPeerAvatarName(name, peerId);
        updated = true;
      }

      const newAvatarUrl = avatarUrl || null;
      const currentAvatarUrl = peerRig.avatarUrl;
      if (currentAvatarUrl !== newAvatarUrl) {
        rigManager.setPeerAvatarUrl(newAvatarUrl, avatarExt, peerId);
        updated = true;
      }

      if (updated) {
        world.dispatchEvent(new MessageEvent('peersupdate', {
          data: Array.from(rigManager.peerRigs.values()),
        }));
      }
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

    let interval;
    if (live) {
      interval = setInterval(() => {
        const name = loginManager.getUsername();
        const avatarSpec = loginManager.getAvatar();
        const avatarUrl = avatarSpec && avatarSpec.url;
        const avatarExt = avatarSpec && avatarSpec.ext;
        const address = loginManager.getAddress();
        channelConnection.send(JSON.stringify({
          method: 'status',
          data: {
            peerId: channelConnection.connectionId,
            status: {
              name,
              avatarUrl,
              avatarExt,
              address
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
    }

    world.dispatchEvent(new MessageEvent('peersupdate', {
      data: Array.from(rigManager.peerRigs.values()),
    }));
  });
  channelConnection.close = (close => function() {
    close.apply(this, arguments);
    const localPeerConnections = peerConnections.slice();
    for (const peerConnection of localPeerConnections) {
      peerConnection.close();
    }
  })(channelConnection.close);

  states.dynamic = channelConnection.state;
  _bindState(states.dynamic, true);
};
world.disconnectRoom = () => {
  if (channelConnection) {
    channelConnection.close();

    const localObjects = objects.dynamic.slice();
    for (const object of localObjects) {
      world.removeObject(object.instanceId);
    }

    states.dynamic = new Y.Doc();
    _bindState(states.dynamic, true);
  }
};

world.initializeIfEmpty = spec => {
  console.log('initialize if empty', spec); // XXX
};

world.getObjects = () => objects.dynamic.slice();
world.getStaticObjects = () => objects.static.slice();
let pendingAddPromise = null;
const _addObject = dynamic => (contentId, parentId = null, position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), options = {}) => {
  const state = _getState(dynamic);
  const instanceId = getRandomString();
  state.transact(() => {
    const trackedObject = _getOrCreateTrackedObject(instanceId, dynamic);
    trackedObject.set('instanceId', instanceId);
    trackedObject.set('parentId', parentId);
    trackedObject.set('contentId', contentId);
    trackedObject.set('position', position.toArray());
    trackedObject.set('quaternion', quaternion.toArray());
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
const _removeObject = dynamic => removeInstanceId => {
  const state = _getState(dynamic);
  state.transact(() => {
    const index = pointers.findIndex(x => x.instanceId === removeInstanceId);
    if (index === -1) pointers.splice(index, 1);

    const objects = state.getArray('objects');
    const objectsJson = objects.toJSON();
    const removeIndex = objectsJson.indexOf(removeInstanceId);
    if (removeIndex !== -1) {
      const childRemoveIndices = (() => {
        const result = [];
        for (let i = 0; i < objectsJson.length; i++) {
          const objectInstanceId = objectsJson[i];
          const object = state.getMap('object.' + objectInstanceId);
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

        const trackedObject = state.getMap('object.' + instanceId);
        const keys = Array.from(trackedObject.keys());
        for (const key in keys) {
          trackedObject.delete(key);
        }
      }
    } else {
      console.warn('invalid remove instance id', objectsJson, removeInstanceId);
    }
  });
};
world.addObject = _addObject(true);
world.removeObject = _removeObject(true);
world.addStaticObject = _addObject(false);
world.removeStaticObject = _removeObject(false);
world.addEventListener('trackedobjectadd', async e => {
  const p = makePromise();
  pendingAddPromise = p;

  try {
    const {trackedObject, dynamic} = e.data;
    const trackedObjectJson = trackedObject.toJSON();
    const {instanceId, parentId, contentId, position, quaternion, options: optionsString} = trackedObjectJson;
    const options = JSON.parse(optionsString);
    let token = null;

    const file = await (async () => {
      if (typeof contentId === 'number') {
        const res = await fetch(`${tokensHost}/${contentId}`);
        token = await res.json();
        const {hash, name, ext} = token.properties;

        const res2 = await fetch(`${storageHost}/${hash}`);
        const file = await res2.blob();
        file.name = `${name}.${ext}`;
        return file;
      } else if (typeof contentId === 'string') {
        let url, name;
        if (/blob:/.test(contentId)) {
          const match = contentId.match(/^(.+)\/([^\/]+)$/);
          if (match) {
            url = match[1];
            name = match[2];
          } else {
            console.warn('blob url not appended with /filename.ext and cannot be interpreted', contentId);
            return null;
          }
        } else {
          url = contentId;
          name = contentId;
        }
        return {
          url,
          name,
        };
      } else {
        console.warn('unknown content id type', contentId);
        return null;
      }
    })();
    let mesh;
    if (file) {
      mesh = await runtime.loadFile(file, {
        instanceId: instanceId,
        physics: options.physics,
        physics_url: options.physics_url,
        autoScale: options.autoScale,
        dynamic,
        monetizationPointer: token ? token.owner.monetizationPointer : "",
        ownerAddress: token ? token.owner.address : ""
      });
      if (mesh) {
        mesh.position.fromArray(position);
        mesh.quaternion.fromArray(quaternion);
        
        // mesh.name = file.name;
        mesh.contentId = contentId;
        mesh.instanceId = instanceId;
        mesh.parentId = parentId;

        if (mesh.renderOrder === -Infinity) {
          scene3.add(mesh);
        } else {
          scene.add(mesh);
        }

        mesh.run && await mesh.run();
        if (mesh.getStaticPhysicsIds) {
          const staticPhysicsIds = mesh.getStaticPhysicsIds();
          for (const physicsId of staticPhysicsIds) {
            physicsManager.setPhysicsTransform(physicsId, mesh.position, mesh.quaternion);
          }
        }
      } else {
        console.warn('failed to load object', file);

        mesh = new THREE.Object3D();
        scene.add(mesh);
      }

      mesh.setPose = (position, quaternion) => {
        trackedObject.set('position', position.toArray());
        trackedObject.set('quaternion', quaternion.toArray());
      };

      const _observe = () => {
        mesh.position.fromArray(trackedObject.get('position'));
        mesh.quaternion.fromArray(trackedObject.get('quaternion'));
      };
      trackedObject.observe(_observe);
      trackedObject.unobserve = trackedObject.unobserve.bind(trackedObject, _observe);

      if (token && token.owner.address && token.owner.monetizationPointer && token.owner.monetizationPointer[0] === "$") {
        const monetizationPointer = token.owner.monetizationPointer;
        const ownerAddress = token.owner.address.toLowerCase();
        pointers.push({ contentId, instanceId, monetizationPointer, ownerAddress });
      }

      const objects = _getObjects(dynamic);
      objects.push(mesh);

      world.dispatchEvent(new MessageEvent('objectadd', {
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
world.addEventListener('trackedobjectremove', async e => {
  const {trackedObject, dynamic} = e.data;
  const instanceId = trackedObject.get('instanceId');
  const objects = _getObjects(dynamic);
  const index = objects.findIndex(object => object.instanceId === instanceId);
  if (index !== -1) {
    const object = objects[index];
    object.destroy && object.destroy();
    object.parent.remove(object);
    objects.splice(index, 1);
    trackedObject.unobserve();

    world.dispatchEvent(new MessageEvent('objectremove', {
      data: object,
    }));
  }
});
world.isObject = object => objects.includes(object);

world.getWorldJson = async q => {
  const _getDefault = () => ({
    default: true,
  });
  const _getSpec = async u => {
    const id = parseInt(u, 10);
    if (!isNaN(id)) {
      const res = await fetch(`${tokensHost}/${id}`);
      const j = await res.json();
      const {hash} = j.properties;
      if (hash) {
        const {name, ext} = j.properties;
        return {
          objects: [
            {
              start_url: `${storageHost}/${hash}/${name}.${ext}`,
            }
          ],
        };
      } else {
        return _getDefault();
      }
    } else {
      return {
        objects: [
          {
            start_url: u,
          }
        ],
      };
    }
  };

  let spec;
  const {u, t} = q;
  if (u) {
    spec = await _getSpec(u);
  } else if (t) {
    spec = await _getSpec(t);
    if (!spec.objects) {
      spec.objects = [];
    }
    for (const object of spec.objects) {
      object.dynamic = true;
    }
    spec.objects.splice(0, 0, {
      start_url: `https://webaverse.github.io/pedestal/index.js`,
    });
    for (const object of spec.objects) {
      object.position = [0, 0, -2];
    }
  } else {
    spec = _getDefault();
  }
  if (q.r) {
    spec.room = q.r;
  }
  return spec;
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
    micButton.classList.add('enabled');

    animationMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    rigManager.localRig.setMicrophoneMediaStream(animationMediaStream);

    _latchMediaStream();
  } else {
    micButton.classList.remove('enabled');

    rigManager.localRig.setMicrophoneMediaStream(null);
    const tracks = animationMediaStream.getTracks();
    for (const track of tracks) {
      track.stop();
    }
    animationMediaStream = null;

    _unlatchMediaStream();
  }
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