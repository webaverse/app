import * as THREE from './three.module.js';
import storage from './storage.js';
import {XRChannelConnection} from './xrrtc.js';
import Y from './yjs.js';
import {loginManager} from './login.js';
import runtime from './runtime.js';
import {rigManager} from './rig.js';
import physicsManager from './physics-manager.js';
import minimap from './minimap.js';
import {pointers} from './web-monetization.js';
import {appManager, scene, scene3} from './app-object.js';
import {
  storageHost,
  worldsHost,
  tokensHost,
} from './constants.js';
import {makePromise, getRandomString} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localRaycaster = new THREE.Raycaster();

// world
export const world = new EventTarget();

// multiplayer
let roomName = null;
let channelConnection = null;
let channelConnectionOpen = null;
const peerConnections = [];

world.getTrackedObjects = () => {
  const objects = state.getArray('objects');
  const objectsJson = objects.toJSON();
  return objectsJson.map(name => state.getMap('object.' + name));
};
world.getTrackedObject = name => {
  const objects = state.getArray('objects');
  const objectsJson = objects.toJSON();
  if (!objectsJson.includes(name)) {
    objects.push([name]);
  }

  return state.getMap('object.' + name);
};

let state = new Y.Doc();
const _bindState = state => {
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
        const trackedObject = world.getTrackedObject(name);
        world.dispatchEvent(new MessageEvent('trackedobjectadd', {
          data: trackedObject,
        }));
      }
    }
    for (const name of lastObjects) {
      if (!nextObjects.includes(name)) {
        // removedObjects.push(name);
        const trackedObject = state.getMap('object.' + name);
        world.dispatchEvent(new MessageEvent('trackedobjectremove', {
          data: trackedObject,
        }));
      }
    }

    lastObjects = nextObjects;
  });
};
_bindState(state);
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
  // window.channelConnection = channelConnection;
  channelConnection.addEventListener('peerconnection', async e => {
    const peerConnection = e.data;
    console.log('New Peer', e);

    let microphoneMediaStream = null;
    let live = true;

    rigManager.addPeerRig(peerConnection.connectionId);
    const peerRig = rigManager.peerRigs.get(peerConnection.connectionId);
    peerRig.peerConnection = peerConnection;

    peerConnection.addEventListener('close', async () => {
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

  state = channelConnection.state;
  _bindState(state);
};
world.disconnectRoom = () => {
  if (channelConnection) {
    channelConnection.close();

    const localObjects = objects.slice();
    for (const object of localObjects) {
      world.removeObject(object.instanceId);
    }

    state = new Y.Doc();
    _bindState(state);
  }
};

world.initializeIfEmpty = spec => {
  console.log('initialize if empty', spec); // XXX
};

const objects = [];
world.getObjects = () => objects.slice();
let pendingAddPromise = null;
world.addObject = (contentId, parentId = null, position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), options = {}) => {
  const instanceId = getRandomString();
  state.transact(() => {
    const trackedObject = world.getTrackedObject(instanceId);
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
world.removeObject = removeInstanceId => {
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
    }
  });
};
world.addEventListener('trackedobjectadd', async e => {
  const p = makePromise();
  pendingAddPromise = p;

  try {
    const trackedObject = e.data;
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

      // minimap
      const minimapObject = minimap.addObject(mesh);
      mesh.minimapObject = minimapObject;

      if (token && token.owner.address && token.owner.monetizationPointer && token.owner.monetizationPointer[0] === "$") {
        const monetizationPointer = token.owner.monetizationPointer;
        const ownerAddress = token.owner.address.toLowerCase();
        pointers.push({ contentId, instanceId, monetizationPointer, ownerAddress });
      }

      objects.push(mesh);

      world.dispatchEvent(new MessageEvent('objectadd', {
        data: mesh,
      }));
    } else {
      messh = null;
    }

    p.accept(mesh);
  } catch (err) {
    p.reject(err);
  }
});
world.addEventListener('trackedobjectremove', async e => {
  const trackedObject = e.data;
  const instanceId = trackedObject.get('instanceId');
  const index = objects.findIndex(object => object.instanceId === instanceId);
  if (index !== -1) {
    const object = objects[index];
    object.destroy && object.destroy();
    object.parent.remove(object);
    objects.splice(index, 1);
    trackedObject.unobserve();

    // minimap
    minimap.removeObject(object.minimapObject);

    world.dispatchEvent(new MessageEvent('objectremove', {
      data: object,
    }));
  }
});
world.isObject = object => objects.includes(object);
/* world.intersectObjects = raycaster => {
  let closestMesh = null;
  let closestMeshDistance = Infinity;
  for (const mesh of objects) {
    localMatrix.compose(
      raycaster.ray.origin,
      localQuaternion.setFromUnitVectors(
        localVector2.set(0, 0, -1),
        raycaster.ray.direction
      ),
      localVector2.set(1, 1, 1)
    )
      .premultiply(localMatrix2.getInverse(mesh.matrixWorld))
      .decompose(localVector, localQuaternion, localVector2);
    localRaycaster.ray.origin.copy(localVector);
    localRaycaster.ray.direction.set(0, 0, -1).applyQuaternion(localQuaternion);
    if (mesh.geometry.boundingBox) {
      const point = localRaycaster.ray.intersectBox(mesh.geometry.boundingBox, localVector);
      if (point) {
        point.applyMatrix4(mesh.matrixWorld);
        return {
          object: mesh,
          point: point.clone(),
          anchor: null,
          uv: new THREE.Vector2(),
        };
      }
    }
  }
  return false; // XXX
};
world.getClosestObject = (position, maxDistance) => {
  let closestObject = null;
  let closestObjectDistance = Infinity;
  for (const object of objects) {
    const distance = position.distanceTo(object.position);
    if (distance < closestObjectDistance && distance < maxDistance) {
      closestObject = object;
      closestObjectDistance = distance;
    }
  }
  return closestObject;
}; */

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
micButton.addEventListener('click', async e => {
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
});