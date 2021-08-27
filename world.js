import * as THREE from 'three';
import storage from './storage.js';
import WSRTC from './wsrtc.js';
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
let wsrtc = null;

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

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const didInteract = new Promise(resolve => window.addEventListener('click', e => {
  resolve(true);
}, {once: true}));

let player;
world.connectRoom = async (roomName, worldURL) => {
  await didInteract;
  await WSRTC.waitForReady();

  wsrtc = new WSRTC(`wss://${worldURL}`);

  let interval;

  const sendUpdate = () => {
    const pose = rigManager.getLocalAvatarPose();
    const [
      [hmdPosition, hmdQuaternion],
      [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
      [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
    ] = pose;

    wsrtc.localUser.setPose(
      Float32Array.from(hmdPosition),
      Float32Array.from(hmdQuaternion),
      Float32Array.from([1, 1, 1]),
      Float32Array.from([
        leftGamepadPosition,
        leftGamepadQuaternion,
        [
          leftGamepadPointer,
          leftGamepadGrip,
          leftGamepadEnabled ? 1 : 0,
        ],
        rightGamepadPosition,
        rightGamepadQuaternion,
        [
          rightGamepadPointer,
          rightGamepadGrip,
          rightGamepadEnabled ? 1 : 0,
        ],
      ]),
    );
  };

  wsrtc.addEventListener('open', async e => {
    console.log('Channel Open!');

    const name = makeid(5);
    wsrtc.localUser.setMetadata({
      name,
    });

    interval = setInterval(sendUpdate, 10);
    wsrtc.enableMic();
  }, {once: true});

  wsrtc.addEventListener('close', e => {
    if (interval) {
      clearInterval(interval);
    }
  }, {once: true});

  wsrtc.addEventListener('join', async e => {
    player = e.data;
    let connected = true;
    player.audioNode.connect(WSRTC.getAudioContext().destination);

    rigManager.addPeerRig(player.id);
    const peerRig = rigManager.peerRigs.get(player.id);
    peerRig.peerConnection = player;

    player.addEventListener('leave', async () => {
      connected = false;
      rigManager.removePeerRig(player.id);
    });

    player.metadata.addEventListener('update', e => {
      const meta = player.metadata.toJSON();
      console.log('meta', meta);
    });

    const update = () => {
      if (!connected) return;

      requestAnimationFrame(update);
      rigManager.setPeerAvatarPose(player);
    };

    update();
  });

  wsrtc.close = (close => function() {
    close.apply(this, arguments);

    wsrtc.dispatchEvent(new MessageEvent('close'));
  })(wsrtc.close);

  // states.dynamic = wsrtc.state;
  // _bindState(states.dynamic, true);

  return wsrtc;
};

world.disconnectRoom = () => {
  if (wsrtc) {
    wsrtc.close();
    wsrtc = null;

    const localObjects = objects.objects.dynamic.slice();
    for (const object of localObjects) {
      world.removeObject(object.instanceId);
    }

    // states.dynamic = new Y.Doc();
    // _bindState(states.dynamic, true);
  }
  return wsrtc;
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

const micButton = document.getElementById('key-t');

world.toggleMic = async () => {
  if (!wsrtc.mediaStream) {
    micButton && micButton.classList.add('enabled');
    wsrtc.enableMic();
  } else {
    micButton && micButton.classList.remove('enabled');
    wsrtc.disableMic();
  }
};

micButton && micButton.addEventListener('click', async e => {
  world.toggleMic()
    .catch(console.warn);
});
