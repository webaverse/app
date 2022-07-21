import * as Z from 'zjs/z.mjs';
import WSRTC from 'wsrtc/wsrtc.js';
import {getLocalPlayer, remotePlayers} from './players.js';

import hpManager from './hp-manager.js';
import {AppManager} from './app-manager.js';
import {scene, sceneHighPriority, sceneLowPriority, sceneLowerPriority, sceneLowestPriority} from './renderer.js';
import {appsMapName, worldMapName, playersMapName} from './constants.js';
import {playersManager} from './players-manager.js';
<<<<<<< HEAD
=======
import {getLocalPlayer} from './players.js';
// import * as metaverseModules from './metaverse-modules.js';
// import {createParticleSystem} from './particle-system.js';
// import * as sounds from './sounds.js';
// import loreAI from './ai/lore/lore-ai.js';

// const localEuler = new THREE.Euler();

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
  
  const localPlayer = getLocalPlayer();
  localPlayer.bindState(state.getArray(playersMapName));
  
  // note: here we should load up the apps in the state since it won't happen automatically.
  // until we implement that, only fresh state is supported...
};
world.isConnected = () => !!wsrtc;
world.connectRoom = async u => {
  // await WSRTC.waitForReady();
  
  const localPlayer = getLocalPlayer();

  world.appManager.unbindState();
  world.appManager.clear();

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
>>>>>>> e868b66c96ac996bc09c2544889aec17395ddc77

import physx from './physx.js';
import physxWorkerManager from './physx-worker-manager.js';

import logger from './logger.js';

const _getBindSceneForRenderPriority = renderPriority => {
  switch (renderPriority) {
    case 'high': {
      return sceneHighPriority;
    }
    case 'low': {
      return sceneLowPriority;
    }
    case 'lower': {
      return sceneLowerPriority;
    }
    case 'lowest': {
      return sceneLowestPriority;
    }
    default: {
      return scene;
    }
  }
};

// Handles the world and objects in it, has an app manager just like a player
export class World {
  constructor() {
    this.appManager = new AppManager();
    this.winds = [];
    this.wsrtc = null;
    // This handles adding apps to the world scene
    this.appManager.addEventListener('appadd', e => {
      const app = e.data;
      const bindScene = _getBindSceneForRenderPriority(app.getComponent('renderPriority'));
      bindScene.add(app);

      const hitTracker = hpManager.makeHitTracker();
      hitTracker.bind(app);
      app.dispatchEvent({type: 'hittrackeradded'});

      const die = () => {
        this.appManager.removeTrackedApp(app.instanceId);
      };
      app.addEventListener('die', die);
    });

    // This handles removal of apps from the scene when we leave the world
    this.appManager.addEventListener('appremove', async e => {
      const app = e.data;
      app.hitTracker.unbind();
      app.parent.remove(app);
    });
  }

  isConnected() { return !!this.wsrtc; }

  getConnection() { return this.wsrtc; }

  // called by enterWorld() in universe.js
  // This is called in single player mode instead of connectRoom
  connectState(state) {
    state.setResolvePriority(1);
    playersManager.bindState(state.getArray(playersMapName));

    this.appManager.unbindState();
    this.appManager.clear();
    const worldMap = state.getMap(worldMapName);
    const appsArray = worldMap.get(appsMapName, Z.Array);

    this.appManager.bindState(appsArray);

    // Handy debug function to see the state
    // Delete this eventually. For now press escape to see world state
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        console.log(state.getArray('world'));
        console.log(state.getArray('players'));
        console.log(scene);
      }
    });

    const localPlayer = getLocalPlayer();
    localPlayer.bindState(state.getArray(playersMapName));
  }

  // called by enterWorld() in universe.js
  // This is called when a user joins a multiplayer room
  // either from single player or directly from a link
  async connectRoom(u, state = new Z.Doc()) {
    // Players cannot be initialized until the physx worker is loaded
    // Otherwise you will receive allocation errors because the module instance is undefined
    await physx.waitForLoad();
    await physxWorkerManager.waitForLoad();
    const localPlayer = getLocalPlayer();

    state.setResolvePriority(1);

    // Create a new instance of the websocket rtc client
    // This comes from webaverse/wsrtc/wsrtc.js
    this.wsrtc = new WSRTC(u, {
      localPlayer,
      crdtState: state,
    });

    // Handy debug function to see the state
    // Delete this eventually. For now press escape to see world state
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        console.log(state.getArray('world'));
        console.log(state.getArray('players'));
        console.log(scene);
      }
    });

    // This is called when the websocket connection opens, i.e. server is connectedw
    const open = e => {
      this.wsrtc.removeEventListener('open', open);
      // Clear the last world state
      const worldMap = state.getMap(worldMapName);
      const appsArray = worldMap.get(appsMapName, Z.Array);
      playersManager.bindState(state.getArray(playersMapName));

      // Unbind the world state to clear existing apps
      this.appManager.unbindState();
      this.appManager.clear();
      // Bind the new state
      this.appManager.bindState(appsArray);

      // Called by WSRTC when the connection is initialized
      const init = e => {
        this.wsrtc.removeEventListener('init', init);
        localPlayer.bindState(state.getArray(playersMapName));

        this.wsrtc.addEventListener('audio', e => {
          const player = playersManager.remotePlayersByInteger.get(e.data.playerId);
          player.processAudioData(e.data);
        });
      };

      this.wsrtc.addEventListener('init', init);
    };

    this.wsrtc.addEventListener('open', open);

    return this.wsrtc;
  }

  // called by enterWorld() in universe.js, to make sure we aren't already connected
  disconnectRoom() {
    if (this.wsrtc && this.wsrtc.state === 'open') this.wsrtc.close();
    this.wsrtc = null;
  }
}

export const world = new World();
