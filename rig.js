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

class RigManager {
  constructor(scene) {
    this.scene = scene;

    this.localRig = null;
    
    this.lastPosition = new THREE.Vector3();
    this.smoothVelocity = new THREE.Vector3();

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
      
      const _setTransforms = () => {
        let currentPosition, currentQuaternion;
        if (!session) {
          this.localRig.inputs.hmd.position.copy(localPlayer.position);
          this.localRig.inputs.hmd.quaternion.copy(localPlayer.quaternion);
          this.localRig.inputs.leftGamepad.position.copy(localPlayer.leftHand.position);
          this.localRig.inputs.leftGamepad.quaternion.copy(localPlayer.leftHand.quaternion);
          this.localRig.inputs.rightGamepad.position.copy(localPlayer.rightHand.position);
          this.localRig.inputs.rightGamepad.quaternion.copy(localPlayer.rightHand.quaternion);
          
          currentPosition = this.localRig.inputs.hmd.position;
          currentQuaternion = this.localRig.inputs.hmd.quaternion;
        } else {
          currentPosition = localVector.copy(dolly.position).multiplyScalar(4);
          currentQuaternion = this.localRig.inputs.hmd.quaternion;
        }
        const positionDiff = localVector2.copy(this.lastPosition)
          .sub(currentPosition)
          .multiplyScalar(0.1/timeDiffS);
        localEuler.setFromQuaternion(currentQuaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        localEuler.y += Math.PI;
        localEuler2.set(-localEuler.x, -localEuler.y, -localEuler.z, localEuler.order);
        positionDiff.applyEuler(localEuler2);
        this.smoothVelocity.lerp(positionDiff, 0.5);
        this.lastPosition.copy(currentPosition);
        this.localRig.direction.copy(positionDiff).normalize();
        this.localRig.velocity.copy(this.smoothVelocity);
      };
      _setTransforms();
      
      const _setIkModes = () => {
        const aimAction = localPlayer.getAction('aim');
        const aimComponent = (() => {
          for (const action of localPlayer.getActionsState()) {
            if (action.type === 'wear') {
              const app = metaversefile.getAppByInstanceId(action.instanceId);
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
          this.localRig.setHandEnabled(i, !!session || (i === 0 && !!aimAction && !!aimComponent)/* || (useTime === -1 && !!appManager.equippedObjects[i])*/);
        }
        this.localRig.setTopEnabled(
          (!!session && (this.localRig.inputs.leftGamepad.enabled || this.localRig.inputs.rightGamepad.enabled))
        );
        this.localRig.setBottomEnabled(
          (
            this.localRig.getTopEnabled() /* ||
            this.localRig.getHandEnabled(0) ||
            this.localRig.getHandEnabled(1) */
          ) &&
          this.smoothVelocity.length() < 0.001,
        );
      };
      _setIkModes();

      applyPlayerActionsToAvatar(localPlayer, this.localRig);
      
      const _applyChatModifiers = () => {
        const localPlayerChatActions = Array.from(localPlayer.getActionsState()).filter(action => action.type === 'chat');
        const lastMessage = localPlayerChatActions.length > 0 ? localPlayerChatActions[localPlayerChatActions.length - 1] : null;
        const _applyChatEmote = message => {
          const localPlayerEmotion = message?.emotion;
          if (localPlayerEmotion) {
            // ensure new emotion and no others
            let found = false;
            for (let i = 0; i < this.localRig.emotes.length; i++) {
              const emote = this.localRig.emotes[i];
              if (emote.emotion) {
                if (emote.emotion === localPlayerEmotion) {
                  found = true;
                } else {
                  this.localRig.emotes.splice(i, 1);
                  i--;
                }
              }
            }
            if (!found) {
              const emote = {
                emotion: localPlayerEmotion,
                value: 1,
              };
              this.localRig.emotes.push(emote);
            }
          } else {
            // ensure no emotions
            for (let i = 0; i < this.localRig.emotes.length; i++) {
              const emote = this.localRig.emotes[i];
              if (emote.emotion) {
                this.localRig.emotes.splice(i, 1);
                i--;
              }
            }
          }
        };
        _applyChatEmote(lastMessage);
        
        const _applyFakeSpeech = message => {
          this.localRig.fakeSpeechValue = message?.fakeSpeech ? 1 : 0;
        };
        _applyFakeSpeech(lastMessage);
      };
      _applyChatModifiers();

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
