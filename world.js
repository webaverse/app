import * as THREE from 'three';
import storage from './storage.js';
import runtime from './runtime.js';
import WSRTC from 'wsrtc/wsrtc.js';
import Y from './yjs.js';

import {AppManager} from './app-object.js';
import hpManager from './hp-manager.js';
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
const appManager = new AppManager(world);
world.appManager = appManager;

// static states are local and non-user editable
// dynamic states are multiplayer and user-editable
const states = {
  static: null,
  dynamic: null,
};
const _newState = dynamic => {
  const k = dynamic ? 'dynamic' : 'static';
  const newState = new Y.Doc();
  states[k] = newState;
  _bindState(dynamic, newState);
};
const _getState = dynamic => dynamic ? states.dynamic : states.static;
const _setState = (dynamic, newState) => {
  const k = dynamic ? 'dynamic' : 'static';
  states[k] = newState;
  _bindState(dynamic, newState);
};
const _bindState = (dynamic, state) => {
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
            instanceId: name,
            trackedObject,
            dynamic,
          },
        }));
      }
    }

    lastObjects = nextObjects;
  });
};
_newState(true);
// _newState(false);
const objects = {
  static: [],
  dynamic: [],
};
const _getObjects = (dynamic) => objects[dynamic ? 'dynamic' : 'static'];
/* const _swapState = () => {
  {
    const {static: _static, dynamic} = states;
    states.static = dynamic;
    states.dynamic = _static;
  }
  {
    const {static: _static, dynamic} = objects;
    objects.static = dynamic;
    objects.dynamic = _static;
  }
}; */

world.newState = _newState;
world.getState = _getState;
world.setState = _setState;

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

/* const didInteract = new Promise(resolve => window.addEventListener('click', e =>
  resolve(true)
, {once: true})); */

let mediaStream = null;
world.micEnabled = () => !!mediaStream;
world.enableMic = async () => {
  await WSRTC.waitForReady();
  mediaStream = await WSRTC.getUserMedia();
  if (wsrtc) {
    wsrtc.enableMic(mediaStream);
  }
  rigManager.setLocalMicMediaStream(mediaStream, {
    audioContext: WSRTC.getAudioContext(),
  });
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
world.reset = () => {
  const state = _getState(true);
  state.transact(() => {
    const objects = state.getArray('objects');
    const objectsJson = objects.toJSON();
    for (const instanceId of objectsJson) {
      const trackedObject = state.getMap('objects.' + instanceId);
      const originalJsonString = trackedObject.get('originalJson');
      const originalJson = JSON.parse(originalJsonString);
      
      const previousKeys = Array.from(trackedObject.keys());
      for (const key of previousKeys) {
        const value = originalJson[key];
        const oldValue = trackedObject.get(key);
        if (value !== undefined) {
          if (trackedObject.get(key) !== value) {
            trackedObject.set(key, value);
          }
        } else {
          trackedObject.delete(key);
        }
      }
      for (const key in originalJson) {
        if (!previousKeys.includes(key)) {
          const value = originalJson[key];
          if (trackedObject.get(key) !== value) {
            trackedObject.set(key, value);
          }
        }
      }
      trackedObject.set('originalJson', originalJsonString);
    }
  });
};
world.connectRoom = async (worldURL) => {
  // console.log('connect room 1');
  // await didInteract;

  await WSRTC.waitForReady();

  /* // reset the world to initial state
  world.reset();
  // swap out dynamic state to static (locked)
  _swapState(); */
  
  // clear the world
  world.clear();

  // _lockAllObjects();

  wsrtc = new WSRTC(worldURL.replace(/^http(s?)/, 'ws$1'));
  world.setState(true, wsrtc.room.state);
  if (mediaStream) {
    wsrtc.enableMic(mediaStream);
  }

  const sendUpdate = () => {
    const rig = rigManager.localRig;
    if (rig) {
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
    }
  };
  const sendMetadataUpdate = () => {
    if (rigManager.localRig) {
      wsrtc.localUser.setMetadata({
        name,
        avatarUrl: rigManager.localRig.app.contentId,
      });
    }
  };

  const name = makeId(5);
  let interval, intervalMetadata;
  wsrtc.addEventListener('open', async e => {
    console.log('Channel Open!');

    interval = setInterval(sendUpdate, 10);
    intervalMetadata = setInterval(sendMetadataUpdate, 1000);
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
    if (intervalMetadata) {
      clearInterval(intervalMetadata);
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
    
    // remove dynamic objects
    world.clear();
    // swap static objects back in
    // _swapState();

    world.newState(true);

    /* const localObjects = objects.objects.dynamic.slice();
    for (const object of localObjects) {
      world.removeObject(object.instanceId);
    }

    states.dynamic = new Y.Doc();
    _bindState(states.dynamic, true); */
  }
  return wsrtc;
};
world.clear = (predicate = () => false) => {
  /* const staticObjects = world.getStaticObjects();
  for (const object of staticObjects) {
    world.removeStaticObject(object.instanceId);
  } */
  const objects = _getObjects(true)
    .slice();
  for (const object of objects) {
    if (!predicate(object)) {
      world.removeObject(object.instanceId);
    }
  }
  // world.dispatchEvent(new MessageEvent('clear'));
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
  state.transact(function tx() {
    const trackedObject = _getOrCreateTrackedObject(instanceId, dynamic);
    trackedObject.set('instanceId', instanceId);
    trackedObject.set('contentId', contentId);
    trackedObject.set('position', position.toArray());
    trackedObject.set('quaternion', quaternion.toArray());
    trackedObject.set('scale', scale.toArray());
    trackedObject.set('components', JSON.stringify(components));
    const originalJson = trackedObject.toJSON();
    trackedObject.set('originalJson', JSON.stringify(originalJson));
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
    // const index = pointers.findIndex(x => x.instanceId === removeInstanceId);
    // if (index === -1) pointers.splice(index, 1);

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
        for (const key of keys) {
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


  let live = true;
  const clear = () => {
    live = false;
    cleanup();
  };
  const cleanup = () => {
    world.removeEventListener('clear', clear);
  };
  world.addEventListener('clear', clear);
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
    if (!live) return;
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
    app.contentId = contentId;
    app.instanceId = instanceId;
    app.setComponent('physics', true);
    // app.contentId = contentId;
    metaversefile.addApp(app);
    mesh = await app.addModule(m);
    if (!live) {
      metaversefile.removeApp(app);
      app.destroy();
      return;
    }
    if (!mesh) {
      console.warn('failed to load object', {contentId});
    }

    const _bindRender = () => {
      unFrustumCull(app);

      if (app.renderOrder === -Infinity) {
        sceneHighPriority.add(app);
      }
    };
    _bindRender();

    /* mesh.setPose = (position, quaternion, scale) => {
      trackedObject.set('position', position.toArray());
      trackedObject.set('quaternion', quaternion.toArray());
      trackedObject.set('scale', scale.toArray());
    }; */

    const _bindTransforms = () => {
      const _observe = e => {
        if (e.keysChanged.has('position')) {
          app.position.fromArray(trackedObject.get('position'));
        }
        if (e.keysChanged.has('quaternion')) {
          app.quaternion.fromArray(trackedObject.get('quaternion'));
        }
        if (e.keysChanged.has('scale')) {
          app.scale.fromArray(trackedObject.get('scale'));
        }
      };
      trackedObject.observe(_observe);
      trackedObject.unobserve = trackedObject.unobserve.bind(trackedObject, _observe);
    };
    _bindTransforms();
    
    const _bindHitTracker = () => {
      const hitTracker = hpManager.makeHitTracker();
      app.parent.add(hitTracker);
      hitTracker.add(app);
      app.hitTracker = hitTracker;

      const frame = e => {
        const {timeDiff} = e.data;
        hitTracker.update(timeDiff);
      };
      world.appManager.addEventListener('frame', frame);
      app.addEventListener('destroy', () => {
        hitTracker.parent.remove(hitTracker);
        world.appManager.removeEventListener('frame', frame);
      });
      
      app.addEventListener('die', () => {
        metaversefile.removeApp(app);
        app.destroy();
      });
    };
    _bindHitTracker();

    const objects = _getObjects(true);
    objects.push(app);

    const _bindDestroy = () => {
      app.addEventListener('destroy', () => {
        objects.splice(objects.indexOf(app), 1);
        
        const localPlayer = metaversefile.useLocalPlayer();
        const localWearIndex = localPlayer.wears.findIndex(({instanceId}) => instanceId === app.instanceId);
        if (localWearIndex !== -1) {
          localPlayer.wears.splice(localWearIndex, 1);
        }
        
        const remotePlayers = metaversefile.useRemotePlayers();
        for (const remotePlayer of remotePlayers) {
          const remoteWearIndex = remotePlayer.wears.findIndex(({instanceId}) => instanceId === app.instanceId);
          if (remoteWearIndex !== -1) {
            remotePlayer.wears.splice(remoteWearIndex, 1);
          }
        }
      });
    };
    _bindDestroy();

    /* if (file.token && file.token.owner.address && file.token.owner.monetizationPointer && file.token.owner.monetizationPointer[0] === "$") {
      const monetizationPointer = file.token.owner.monetizationPointer;
      const ownerAddress = file.token.owner.address.toLowerCase();
      pointers.push({ contentId, instanceId, monetizationPointer, ownerAddress });
    } */

    world.dispatchEvent(new MessageEvent('objectadd', {
      data: app,
    }));

    p.accept(app);
  } catch (err) {
    p.reject(err);
  } finally {
    cleanup();
  }
});

world.addEventListener('trackedobjectremove', async e => {
  const {instanceId, trackedObject, dynamic} = e.data;
  const objects = _getObjects(dynamic);
  const index = objects.findIndex(object => object.instanceId === instanceId);
  if (index !== -1) {
    const object = objects[index];
    object.destroy && object.destroy();
    metaversefile.removeApp(object);
    // object.parent.remove(object);
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

world.bindInput = () => {
  window.addEventListener('resize', e => {
    const objects = _getObjects(true);
    for (const o of objects) {
      o.resize && o.resize();
    }
  });
};

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
  const objects = _getObjects(true);//.concat(world.getStaticObjects());
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

const _bindLocalPlayerTeleport = () => {
  const localPlayer = metaversefile.useLocalPlayer();
  const lastLocalPlayerPosition = localPlayer.position.clone();
  const lastLocalPlayerQuaternion = localPlayer.quaternion.clone();
  appManager.addEventListener('preframe', e => {
    if (
      !localPlayer.position.equals(lastLocalPlayerPosition) ||
      !localPlayer.quaternion.equals(lastLocalPlayerQuaternion)
    ) {
      metaversefile.teleportTo(localPlayer.position, localPlayer.quaternion, {
        relation: 'head',
      });
    }
  });
  appManager.addEventListener('startframe', e => {
    if (rigManager.localRig) {
      localPlayer.position.copy(rigManager.localRig.inputs.hmd.position);
      localPlayer.quaternion.copy(rigManager.localRig.inputs.hmd.quaternion);
      localPlayer.leftHand.position.copy(rigManager.localRig.inputs.leftGamepad.position);
      localPlayer.leftHand.quaternion.copy(rigManager.localRig.inputs.leftGamepad.quaternion);
      localPlayer.rightHand.position.copy(rigManager.localRig.inputs.rightGamepad.position);
      localPlayer.rightHand.quaternion.copy(rigManager.localRig.inputs.rightGamepad.quaternion);
    } else {
      localPlayer.position.set(0, 0, 0);
      localPlayer.quaternion.set(0, 0, 0, 1);
      localPlayer.leftHand.position.set(0, 0, 0);
      localPlayer.leftHand.quaternion.set(0, 0, 0, 1);
      localPlayer.rightHand.position.set(0, 0, 0);
      localPlayer.rightHand.quaternion.set(0, 0, 0, 1);
    }
    
    lastLocalPlayerPosition.copy(localPlayer.position);
    lastLocalPlayerQuaternion.copy(localPlayer.quaternion);
  });
};
_bindLocalPlayerTeleport();

/* const micButton = document.getElementById('key-t');

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
}); */
