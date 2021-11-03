/*
this file binds logical characters (local player, remote players, npcs) to metaversefile (vrm) avatars.
*/

import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// import {makeRigCapsule} from './vr-ui.js';
import {unFrustumCull} from './util.js';
import {getRenderer, scene, camera, dolly} from './renderer.js';
import Avatar from './avatars/avatars.js';
// import {chatManager} from './chat-manager.js';
import metaversefile from 'metaversefile';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();
// const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();

const _makeRig = app => {
  if (app) {
    const {skinnedVrm} = app;
    if (skinnedVrm) {
      const localRig = new Avatar(skinnedVrm, {
        fingers: true,
        hair: true,
        visemes: true,
        debug: false,
      });
      localRig.app = app;
      
      unFrustumCull(app);
      
      return localRig;
    }
  }
  return null;
};
function applyPlayerActionsToAvatar(player, rig) {
  const jumpAction = player.getAction('jump');
  const flyAction = player.getAction('fly');
  const useAction = player.getAction('use');
  const narutoRunAction = player.getAction('narutoRun');
  const sitAction = player.getAction('sit');
  const sitAnimation = sitAction ? sitAction.animation : '';
  const danceAction = player.getAction('dance');
  const danceAnimation = danceAction ? danceAction.animation : '';
  const throwAction = player.getAction('throw');
  const aimAction = player.getAction('aim');
  const crouchAction = player.getAction('crouch');

  rig.jumpState = !!jumpAction;
  rig.jumpTime = player.actionInterpolants.jump.get();
  rig.flyState = !!flyAction;
  rig.flyTime = flyAction ? player.actionInterpolants.fly.get() : -1;
  rig.activateTime = player.actionInterpolants.activate.get();
  rig.useTime = player.actionInterpolants.use.get();
  rig.useAnimation = (useAction?.animation) || '';
  rig.narutoRunState = !!narutoRunAction && !crouchAction;
  rig.narutoRunTime = player.actionInterpolants.narutoRun.get();
  rig.aimState = !!aimAction;
  rig.aimDirection.set(0, 0, -1);
  aimAction && rig.aimDirection.applyQuaternion(camera.quaternion);
  rig.sitState = !!sitAction;
  rig.sitAnimation = sitAnimation;
  rig.danceState = !!danceAction;
  rig.danceTime = player.actionInterpolants.dance.get();
  rig.danceAnimation = danceAnimation;
  rig.throwState = !!throwAction;
  rig.throwTime = player.actionInterpolants.throw.get();
  rig.crouchTime = player.actionInterpolants.crouch.getInverse();
}
function applyPlayerChatToAvatar(player, rig) {
  const localPlayerChatActions = Array.from(player.getActionsState()).filter(action => action.type === 'chat');
  const lastMessage = localPlayerChatActions.length > 0 ? localPlayerChatActions[localPlayerChatActions.length - 1] : null;
  const _applyChatEmote = message => {
    const localPlayerEmotion = message?.emotion;
    if (localPlayerEmotion) {
      // ensure new emotion and no others
      let found = false;
      for (let i = 0; i < rig.emotes.length; i++) {
        const emote = rig.emotes[i];
        if (emote.emotion) {
          if (emote.emotion === localPlayerEmotion) {
            found = true;
          } else {
            rig.emotes.splice(i, 1);
            i--;
          }
        }
      }
      if (!found) {
        const emote = {
          emotion: localPlayerEmotion,
          value: 1,
        };
        rig.emotes.push(emote);
      }
    } else {
      // ensure no emotions
      for (let i = 0; i < rig.emotes.length; i++) {
        const emote = rig.emotes[i];
        if (emote.emotion) {
          rig.emotes.splice(i, 1);
          i--;
        }
      }
    }
  };
  _applyChatEmote(lastMessage);
  
  const _applyFakeSpeech = message => {
    rig.fakeSpeechValue = message?.fakeSpeech ? 1 : 0;
  };
  _applyFakeSpeech(lastMessage);
}
function applyPlayerTransformsToAvatar(player, session, rig) {
  // let currentPosition, currentQuaternion;
  if (!session) {
    rig.inputs.hmd.position.copy(player.position);
    rig.inputs.hmd.quaternion.copy(player.quaternion);
    rig.inputs.leftGamepad.position.copy(player.leftHand.position);
    rig.inputs.leftGamepad.quaternion.copy(player.leftHand.quaternion);
    rig.inputs.rightGamepad.position.copy(player.rightHand.position);
    rig.inputs.rightGamepad.quaternion.copy(player.rightHand.quaternion);
    
    // currentPosition = rig.inputs.hmd.position;
    // currentQuaternion = rig.inputs.hmd.quaternion;
  } /* else {
    currentPosition = localVector.copy(dolly.position).multiplyScalar(4);
    currentQuaternion = rig.inputs.hmd.quaternion;
  } */
}
function applyPlayerModesToAvatar(player, session, rig) {
  const aimAction = player.getAction('aim');
  const aimComponent = (() => {
    for (const action of player.getActionsState()) {
      if (action.type === 'wear') {
        const app = player.appManager.getAppByInstanceId(action.instanceId);
        for (const {key, value} of app.components) {
          if (key === 'aim') {
            return value;
          }
        }
      }
    }
    return null;
  })();
  for (let i = 0; i < 2; i++) {
    rig.setHandEnabled(i, !!session || (i === 0 && !!aimAction && !!aimComponent)/* || (useTime === -1 && !!appManager.equippedObjects[i])*/);
  }
  rig.setTopEnabled(
    (!!session && (rig.inputs.leftGamepad.enabled || rig.inputs.rightGamepad.enabled))
  );
  rig.setBottomEnabled(
    (
      rig.getTopEnabled() /* ||
      rig.getHandEnabled(0) ||
      rig.getHandEnabled(1) */
    ) &&
    rig.velocity.length() < 0.001,
  );
}

class RigManager {
  constructor(scene) {
    this.scene = scene;

    this.localRig = null;
    this.peerRigs = new Map();
  }

  async _switchAvatar(oldRig, newApp) {
    await newApp.setSkinning(true);
    
    // unwear old rig
    if (oldRig) {
      await oldRig.app.setSkinning(false);
    }
    if (!newApp.rig) {
      newApp.rig = _makeRig(newApp);
    }
    return newApp.rig;
  }

  async setLocalAvatar(app) {
    this.localRig = await this._switchAvatar(this.localRig, app);
  }
  
  setLocalMicMediaStream(mediaStream, options) {
    this.localRig.setMicrophoneMediaStream(mediaStream, options);
  }

  setPeerMicMediaStream(mediaStream, peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.setMicrophoneMediaStream(mediaStream);
    this.peerRigs.set(peerId, peerRig);
  }

  update(timestamp, timeDiff) {
    if (this.localRig) {
      const timeDiffS = timeDiff / 1000;

      const renderer = getRenderer();
      const session = renderer.xr.getSession();
      const localPlayer = metaversefile.useLocalPlayer();
      
      applyPlayerTransformsToAvatar(localPlayer, session, this.localRig);
      applyPlayerModesToAvatar(localPlayer, session, this.localRig);
      applyPlayerActionsToAvatar(localPlayer, this.localRig);
      applyPlayerChatToAvatar(localPlayer, this.localRig);

      this.localRig.update(timestamp, timeDiffS);

      this.peerRigs.forEach(rig => {
        rig.update(timestamp, timeDiffS);
      });
    }
  }
}
const rigManager = new RigManager(scene);

export {
  rigManager,
};
