import * as THREE from 'three';
import storage from './storage.js';
import runtime from './runtime.js';
import WSRTC from './node_modules/wsrtc/wsrtc.js';
import Y from './yjs.js';

import {rigManager} from './rig.js';

import {pointers} from './web-monetization.js';
import {camera, scene, sceneHighPriority} from './app-object.js';
import {baseUnit} from './constants.js';
import { unFrustumCull} from './util.js';
import {
  storageHost,
  // worldsHost,
  tokensHost,
} from './constants.js';
import {makePromise, getRandomString, makeId} from './util.js';
import metaversefile from 'metaversefile';
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
const _getObjects = (dynamic) => objects[dynamic ? 'dynamic' : 'static'];

// multiplayer
let wsrtc = null;

const _getOrCreateTrackedObject = (name, dynamic) => {
  const state = _getState(dynamic);
  const objects = state.getArray('objects');
  const objectsJson = objects.toJSON();
  if (!objectsJson.includes(name)) {
    objects.push([name]);
  }

  return state.getMap('objects.' + name);
};

const _bindState = (state, dynamic) => {
  const objects = state.getArray('objects');
  let lastObjects = [];
  objects.observe(() => {
    const nextObjects = objects.toJSON();

    for (const name of nextObjects) {
      if (!lastObjects.includes(name)) {
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
        const trackedObject = state.getMap('objects.' + name);
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

// The extra Pose buffers we send along
const extra = {
  leftGamepadPosition: new Float32Array(3),
  leftGamepadQuaternion: new Float32Array(4),
  leftGamepad: new Float32Array(3),
  rightGamepadPosition: new Float32Array(3),
  rightGamepadQuaternion: new Float32Array(4),
  rightGamepad: new Float32Array(3),
  attr: new Float32Array(3),
  direction: new Float32Array(3),
  velocity: new Float32Array(3),
  states: new Float32Array(15),
};

const didInteract = new Promise(resolve => window.addEventListener('click', e =>
  resolve(true)
, {once: true}));

let mediaStream = null;
world.micEnabled = () => !!mediaStream;
world.enableMic = async () => {
  mediaStream = await WSRTC.getUserMedia();
  if (wsrtc) {
    wsrtc.enableMic(mediaStream);
  }
  rigManager.setLocalMicMediaStream(mediaStream);
};
world.disableMic = () => {
  if (mediaStream) {
    if (wsrtc) {
      wsrtc.disableMic();
    } else {
      WSRTC.destroyUserMedia(mediaStream);
    }
    mediaStream = null;
    rigManager.setLocalMicMediaStream(null);
  }
};

world.isConnected = () => !!wsrtc;
world.connectRoom = async (worldURL) => {
  console.log('connect room 1');
  await didInteract;
  console.log('connect room 2');
  await WSRTC.waitForReady();
  
  console.log('connect room 3');

  wsrtc = new WSRTC(worldURL.replace(/^http(s?)/, 'ws$1'));
  if (mediaStream) {
    wsrtc.enableMic(mediaStream);
  }

  let interval;

  const sendUpdate = () => {
    const rig = rigManager.localRig;
    const {hmd, leftGamepad, rightGamepad} = rig.inputs;
    const user = wsrtc.localUser;
    
    hmd.position.toArray(user.pose.position);
    hmd.quaternion.toArray(user.pose.quaternion);
    leftGamepad.position.toArray(extra.leftGamepadPosition);
    leftGamepad.quaternion.toArray(extra.leftGamepadQuaternion);
    extra.leftGamepad[0] = leftGamepad.pointer ? 1 : 0;
    extra.leftGamepad[1] = leftGamepad.grip ? 1 : 0;
    extra.leftGamepad[2] = leftGamepad.enabled ? 1 : 0;
    rightGamepad.position.toArray(extra.rightGamepadPosition);
    rightGamepad.quaternion.toArray(extra.rightGamepadPosition);
    extra.rightGamepad[0] = rightGamepad.pointer ? 1 : 0;
    extra.rightGamepad[1] = rightGamepad.grip ? 1 : 0;
    extra.rightGamepad[2] = rightGamepad.enabled ? 1 : 0;
    extra.attr[0] = rig.getFloorHeight() ? 1 : 0;
    extra.attr[1] = rig.getTopEnabled() ? 1 : 0;
    extra.attr[2] = rig.getBottomEnabled() ? 1 : 0;
    rig.direction.toArray(extra.direction);
    rig.velocity.toArray(extra.velocity);
    extra.states[0] = rig.jumpState,
    extra.states[1] = rig.jumpTime;
    extra.states[2] = rig.flyState;
    extra.states[3] = rig.flyTime;
    extra.states[4] = rig.useTime;
    extra.states[5] = rig.useAnimation;
    extra.states[6] = rig.sitState;
    extra.states[7] = rig.sitAnimation;
    extra.states[8] = rig.danceState;
    extra.states[9] = rig.danceTime;
    extra.states[10] = rig.danceAnimation;
    extra.states[11] = rig.throwState;
    extra.states[12] = rig.throwTime;
    extra.states[13] = rig.crouchState;
    extra.states[14] = rig.crouchTime;

    user.setPose(
      user.pose.position,
      user.pose.quaternion,
      user.pose.scale,
      [
        extra.leftGamepadPosition,
        extra.leftGamepadQuaternion,
        extra.leftGamepad,
        extra.rightGamepadPosition,
        extra.rightGamepadQuaternion,
        extra.rightGamepad,
        extra.attr,
        extra.direction,
        extra.velocity,
        extra.states,
      ],
    );
  };

  wsrtc.addEventListener('open', async e => {
    console.log('Channel Open!');

    const name = makeId(5);
    wsrtc.localUser.setMetadata({
      name,
      avatarUrl: rigManager.localRig.url,
    });

    interval = setInterval(sendUpdate, 10);
    // wsrtc.enableMic();
  }, {once: true});

  wsrtc.addEventListener('close', e => {
    const peerRigIds = rigManager.peerRigs.keys();
    for (const peerRigId of peerRigIds) {
      rigManager.removePeerRig(peerRigId);
    }
    if (interval) {
      clearInterval(interval);
    }
  }, {once: true});

  wsrtc.addEventListener('join', async e => {
    const player = e.data;
  
    player.audioNode.connect(WSRTC.getAudioContext().destination);

    let joined = true;
    player.addEventListener('leave', async () => {
      rigManager.removePeerRig(player.id);
      joined = false;
    });
    let running = false;
    const queue = [];
    const _handleUpdate = async meta => {
      if (!running) {
        running = true;
        if (joined) {
          const peerRig = rigManager.peerRigs.get(player.id);
          if (!peerRig) {
            await rigManager.addPeerRig(player.id, meta);
            const peerRig = rigManager.peerRigs.get(player.id);
            if (joined) {
              peerRig.peerConnection = player;
            } else {
              rigManager.removePeerRig(player.id);
            }
          } else {
            if (typeof meta.name === 'string') {
              // XXX set the name
            }
            if (typeof meta.avatarUrl === 'string') {
              await rigManager.setPeerAvatarUrl(player.id, meta.avatarUrl);
            }
          }
        }
        running = false;
        if (queue.length > 0) {
          _handleUpdate(queue.pop());
        }
      } else {
        queue.push(meta);
      }
    };
    player.metadata.addEventListener('update', e => {
      const meta = player.metadata.toJSON();
      // console.log('meta', meta);
      _handleUpdate(meta);
    });
    player.pose.addEventListener('update', e => {
      rigManager.setPeerAvatarPose(player);
    });
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

    /* const localObjects = objects.objects.dynamic.slice();
    for (const object of localObjects) {
      world.removeObject(object.instanceId);
    }

    states.dynamic = new Y.Doc();
    _bindState(states.dynamic, true); */
  }
  return wsrtc;
};

world.initializeIfEmpty = spec => {
  console.log('initialize if empty', spec); // XXX
};

world.getObjects = () => objects.dynamic.slice();
world.getStaticObjects = () => objects.static.slice();
let pendingAddPromise = null;

const _addObject = (dynamic) => (contentId, position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(1, 1, 1), components = []) => {
  const state = _getState(dynamic);
  const instanceId = getRandomString();
  state.transact(() => {
    const trackedObject = _getOrCreateTrackedObject(instanceId, dynamic);
    trackedObject.set('instanceId', instanceId);
    trackedObject.set('contentId', contentId);
    trackedObject.set('position', position.toArray());
    trackedObject.set('quaternion', quaternion.toArray());
    trackedObject.set('scale', scale.toArray());
    trackedObject.set('components', JSON.stringify(components));
  });
  if (pendingAddPromise) {
    const result = pendingAddPromise;
    result.instanceId = instanceId;
    pendingAddPromise = null;
    return result;
  } else {
    throw new Error('no pending world add object promise');
  }
};
const _removeObject = (dynamic) => removeInstanceId => {
  const state = _getState(dynamic);
  state.transact(() => {
    const index = pointers.findIndex(x => x.instanceId === removeInstanceId);
    if (index === -1) pointers.splice(index, 1);

    const objects = state.getArray('objects');
    const objectsJson = objects.toJSON();
    const removeIndex = objectsJson.indexOf(removeInstanceId);
    if (removeIndex !== -1) {
      const allRemoveIndices = [removeIndex];
      for (const removeIndex of allRemoveIndices) {
        const instanceId = objectsJson[removeIndex];

        objects.delete(removeIndex, 1);

        const trackedObject = state.getMap('objects.' + instanceId);
        const keys = Array.from(trackedObject.keys());
        for (const key in keys) {
          trackedObject.delete(key);
        }
      }
    } else {
      console.warn('invalid remove instance id', {dynamic, removeInstanceId, objectsJson});
    }
  });
};
world.addObject = _addObject(true);
world.removeObject = _removeObject(true);
world.addEventListener('trackedobjectadd', async e => {
  const p = makePromise();
  pendingAddPromise = p;

  try {
    const {trackedObject, dynamic} = e.data;
    const trackedObjectJson = trackedObject.toJSON();
    const {instanceId, contentId, position, quaternion, scale, components: componentsString} = trackedObjectJson;
    const components = JSON.parse(componentsString);
    // const options = JSON.parse(optionsString);
    // const file = await contentIdToFile(contentId);
    /* let mesh = await runtime.loadFile(contentId, { // XXX convert these attributes to components
      contentId,
      instanceId: instanceId,
      physics: options.physics,
      physics_url: options.physics_url,
      autoScale: options.autoScale,
      autoRun: options.autoRun,
      dynamic,
      monetizationPointer: file.token ? file.token.owner.monetizationPointer : "",
      ownerAddress: file.token ? file.token.owner.address : ""
    }); */
    const m = await metaversefile.import(contentId);
    const app = metaversefile.createApp({
      name: contentId,
      type: (() => {
        const match = contentId.match(/\.([a-z0-9]+)$/i);
        if (match) {
          return match[1];
        } else {
          return '';
        }
      })(),
      components,
    });
    app.position.fromArray(position);
    app.quaternion.fromArray(quaternion);
    app.scale.fromArray(scale);
    app.updateMatrixWorld();
    app.setComponent('physics', true);
    app.instanceId = instanceId;
    // app.contentId = contentId;
    metaversefile.addApp(app);
    mesh = await app.addModule(m);
    if (mesh) {
      unFrustumCull(app);

      if (app.renderOrder === -Infinity) {
        sceneHighPriority.add(app);
      }

      // mesh.run && await mesh.run();
      /* if (mesh.getStaticPhysicsIds) {
        const staticPhysicsIds = mesh.getStaticPhysicsIds();
        for (const physicsId of staticPhysicsIds) {
          physicsManager.setPhysicsTransform(physicsId, mesh.position, mesh.quaternion, mesh.scale);
        }
      } */
      
      app.addEventListener('die', () => {
        world.removeObject(dynamic, mesh.instanceId);
      });
    } else {
      console.warn('failed to load object', {contentId});
    }

    /* mesh.setPose = (position, quaternion, scale) => {
      trackedObject.set('position', position.toArray());
      trackedObject.set('quaternion', quaternion.toArray());
      trackedObject.set('scale', scale.toArray());
    }; */

    const _observe = () => {
      app.position.fromArray(trackedObject.get('position'));
      app.quaternion.fromArray(trackedObject.get('quaternion'));
      app.scale.fromArray(trackedObject.get('scale'));
    };
    trackedObject.observe(_observe);
    trackedObject.unobserve = trackedObject.unobserve.bind(trackedObject, _observe);

    /* if (file.token && file.token.owner.address && file.token.owner.monetizationPointer && file.token.owner.monetizationPointer[0] === "$") {
      const monetizationPointer = file.token.owner.monetizationPointer;
      const ownerAddress = file.token.owner.address.toLowerCase();
      pointers.push({ contentId, instanceId, monetizationPointer, ownerAddress });
    } */

    const objects = _getObjects(dynamic);
    objects.push(app);

    world.dispatchEvent(new MessageEvent('objectadd', {
      data: app,
    }));

    p.accept(app);
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
    metaversefile.removeApp(object);
    // object.parent.remove(object);
    objects.splice(index, 1);
    trackedObject.unobserve();

    /* const binding = transformControls.getBinding();
    if (binding === object) {
      transformControls.bind(null);
    } */

    world.dispatchEvent(new MessageEvent('objectremove', {
      data: object,
    }));
  }
});
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

/* world.toggleMic = async () => {
  if (!wsrtc.mediaStream) {
    micButton && micButton.classList.add('enabled');
    wsrtc.enableMic();
  } else {
    micButton && micButton.classList.remove('enabled');
    wsrtc.disableMic();
  }
}; */

micButton && micButton.addEventListener('click', async e => {
  world.toggleMic()
    .catch(console.warn);
});
