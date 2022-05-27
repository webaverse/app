/*
this file contains the singleplayer code.
*/

import * as THREE from 'three';
// import * as Y from 'yjs';
import * as Z from 'zjs/z.mjs';
import WSRTC from 'wsrtc/wsrtc.js';

import hpManager from './hp-manager.js';
// import {rigManager} from './rig.js';
import {AppManager} from './app-manager.js';
// import {chatManager} from './chat-manager.js';
// import {getState, setState} from './state.js';
// import {makeId} from './util.js';
import {scene, sceneHighPriority, sceneLowPriority} from './renderer.js';
import metaversefileApi from 'metaversefile';
import {appsMapName, playersMapName} from './constants.js';
import {playersManager} from './players-manager.js';
// import * as metaverseModules from './metaverse-modules.js';
// import {createParticleSystem} from './particle-system.js';
// import * as sounds from './sounds.js';

const localEuler = new THREE.Euler();

// world
export const world = {};
world.winds = [];

const appManager = new AppManager({
  appsMap: null,
});
world.appManager = appManager;

// world.particleSystem = createParticleSystem();
// scene.add(world.particleSystem);

// multiplayer
let wsrtc = null;

/* // The extra Pose buffers we send along
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
}; */

world.getConnection = () => wsrtc;

world.connectState = state => {
  state.setResolvePriority(1);

  world.appManager.unbindState();
  world.appManager.clear();
  world.appManager.bindState(state.getArray(appsMapName));
  
  playersManager.bindState(state.getArray(playersMapName));
  
  const localPlayer = metaversefileApi.useLocalPlayer();
  localPlayer.bindState(state.getArray(playersMapName));
  
  // note: here we should load up the apps in the state since it won't happen automatically.
  // until we implement that, only fresh state is supported...
};
world.isConnected = () => !!wsrtc;
world.connectRoom = async u => {
  // await WSRTC.waitForReady();
  
  world.appManager.unbindState();
  world.appManager.clear();

  const localPlayer = metaversefileApi.useLocalPlayer();
  const state = new Z.Doc();
  state.setResolvePriority(1);
  wsrtc = new WSRTC(u, {
    localPlayer,
    crdtState: state,
  });
  const open = e => {
    wsrtc.removeEventListener('open', open);
    
    world.appManager.bindState(state.getArray(appsMapName));
    playersManager.bindState(state.getArray(playersMapName));
    
    const init = e => {
      wsrtc.removeEventListener('init', init);
      
      localPlayer.bindState(state.getArray(playersMapName));
      if (mediaStream) {
        wsrtc.enableMic(mediaStream);
      }
    };
    wsrtc.addEventListener('init', init);
  };
  wsrtc.addEventListener('open', open);

  /* const sendUpdate = () => {
    const rig = localPlayer.avatar;
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
      // extra.states[8] = rig.danceState;
      extra.states[9] = rig.danceFactor;
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
    const localPlayer = metaversefileApi.useLocalPlayer();
    const rig = localPlayer.avatar;
    if (rig) {
      wsrtc.localUser.setMetadata({
        name,
        avatarUrl: rig.app.contentId,
      });
    }
  }; */

  // const name = makeId(5);
  // let interval, intervalMetadata;
  wsrtc.addEventListener('open', async e => {
    console.log('Channel Open!');

    // interval = setInterval(sendUpdate, 10);
    // intervalMetadata = setInterval(sendMetadataUpdate, 1000);
    // wsrtc.enableMic();
  }, {once: true});

  wsrtc.addEventListener('close', e => {
    console.log('Channel Close!');

    /* const peerRigIds = rigManager.peerRigs.keys();
    for (const peerRigId of peerRigIds) {
      rigManager.removePeerRig(peerRigId);
    }
    if (interval) {
      clearInterval(interval);
    }
    if (intervalMetadata) {
      clearInterval(intervalMetadata);
    } */
  }, {once: true});

  /* wsrtc.addEventListener('join', async e => {
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
  }); */

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

    // world.clear();
    // world.newState();
  }
};
/* world.clear = () => {
  appManager.clear();
}; */
/* world.save = () => {
  return world.appManager.state.toJSON();
}; */

const _getBindSceneForRenderPriority = renderPriority => {
  switch (renderPriority) {
    case 'high': {
      return sceneHighPriority;
    }
    case 'low': {
      return sceneLowPriority;
    }
    /* case 'postPerspectiveScene': {
      return postScenePerspective;
    }
    case 'postOrthographicScene': {
      return postSceneOrthographic;
    } */
    default: {
      return scene;
    }
  }
};
const _bindHitTracker = app => {
  const hitTracker = hpManager.makeHitTracker();
  hitTracker.bind(app);
  app.dispatchEvent({type: 'hittrackeradded'});

  const die = () => {
    world.appManager.removeTrackedApp(app.instanceId);
  };
  hitTracker.addEventListener('die', die);
};
appManager.addEventListener('appadd', e => {
  const app = e.data;
  const bindScene = _getBindSceneForRenderPriority(app.getComponent('renderPriority'));
  bindScene.add(app);

  _bindHitTracker(app);
});
appManager.addEventListener('trackedappmigrate', async e => {
  const {app, sourceAppManager, destinationAppManager} = e.data;
  if (this === sourceAppManager) {
    app.hitTracker.unbind();
  } else if (this === destinationAppManager) {
    _bindHitTracker(app);
  }
});
appManager.addEventListener('appremove', async e => {
  const app = e.data;
  app.hitTracker.unbind();
  app.parent.remove(app);
});
