/*
this file contains the singleplayer code.
*/

import * as THREE from 'three';
import WSRTC from 'wsrtc/wsrtc.js';
import * as Y from 'yjs';

import hpManager from './hp-manager.js';
import {rigManager} from './rig.js';
import {AppManager} from './app-manager.js';

import {pointers} from './web-monetization.js';
import {camera, scene, sceneHighPriority} from './app-object.js';
import {baseUnit} from './constants.js';
import {unFrustumCull} from './util.js';
/* import {
  storageHost,
  worldsHost,
  tokensHost,
} from './constants.js'; */
import {makePromise, getRandomString, makeId} from './util.js';
import metaversefile from './metaversefile-api.js';

// world
export const world = {};

const appManager = new AppManager();
world.appManager = appManager;

world.lights = new THREE.Object3D();

// multiplayer
let wsrtc = null;

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
/* world.reset = () => {
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
}; */
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
  world.setState(wsrtc.room.state);
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

  return wsrtc;
};
world.disconnectRoom = () => {
  if (wsrtc) {
    wsrtc.close();
    wsrtc = null;

    world.clear();
    world.newState();
  }
  return wsrtc;
};
world.bindInput = () => {
  window.addEventListener('resize', e => {
    appManager.resize(e);
  });
};

/* world.getWorldJson = async q => {
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
}; */
/* world.getNpcFromPhysicsId = physicsId => {
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
}; */

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
