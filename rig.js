/*
this file binds logical characters (local player, remote players, npcs) to metaversefile (vrm) avatars.
*/

import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import {makeRigCapsule} from './vr-ui.js';
import {unFrustumCull} from './util.js';
import {getRenderer, scene, camera, dolly} from './renderer.js';
import Avatar from './avatars/avatars.js';
import {chatManager} from './chat-manager.js';
import metaversefile from 'metaversefile';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
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
    this.localRigMatrix = new THREE.Matrix4();
    this.localRigMatrixEnabled = false;
    
    this.lastPosition = new THREE.Vector3();
    this.smoothVelocity = new THREE.Vector3();

    this.peerRigs = new Map();
  }

  setLocalRigMatrix(rm) {
    if (rm) {
      this.localRigMatrix.copy(rm);
      this.localRigMatrixEnabled = true;
    } else {
      this.localRigMatrixEnabled = false;
    }
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

  async addPeerRig(peerId, meta) {
    const contentId = meta.avatarUrl;
    const app = await metaversefile.load(contentId);
    app.contentId = contentId;
    
    const peerRig = await this._switchAvatar(null, app);
    scene.add(peerRig.model);
    
    peerRig.rigCapsule = makeRigCapsule();
    peerRig.rigCapsule.visible = false;
    this.scene.add(peerRig.rigCapsule);

    this.peerRigs.set(peerId, peerRig);
  }

  async removePeerRig(peerId) {
    const peerRig = this.peerRigs.get(peerId);
    if (peerRig) {
      peerRig.model.parent.remove(peerRig.model);
      peerRig.rigCapsule.parent.remove(peerRig.rigCapsule);
      // peerRig.textMesh.parent.remove(peerRig.textMesh);
      // peerRig.aux.destroy();
      this.peerRigs.delete(peerId);
    }
  }
  
  setPeerAvatarUrl(peerId, avatarUrl) {
    const peerRig = this.peerRigs.get(peerId);
    if (peerRig) {
      if (peerRig.app.contentId !== avatarUrl) {
        throw new Error('do not know how to set change avatar url yet');
        // debugger;
      }
    } else {
      console.warn('set peer avatar url for unknown peer:', peerRig);
    }
  }

  async setPeerAvatar(peerId, app) {
    this.peerRigs.set(peerId, _makeRig(app));
  }
  
  setLocalMicMediaStream(mediaStream, options) {
    this.localRig.setMicrophoneMediaStream(mediaStream, options);
  }

  setPeerMicMediaStream(mediaStream, peerId) {
    const peerRig = this.peerRigs.get(peerId);
    peerRig.setMicrophoneMediaStream(mediaStream);
    this.peerRigs.set(peerId, peerRig);
  }

  getLocalAvatarPose() {
    if (this.localRig) {
      const hmdPosition = this.localRig.inputs.hmd.position.toArray();
      const hmdQuaternion = this.localRig.inputs.hmd.quaternion.toArray();

      const leftGamepadPosition = this.localRig.inputs.leftGamepad.position.toArray();
      const leftGamepadQuaternion = this.localRig.inputs.leftGamepad.quaternion.toArray();
      const leftGamepadPointer = this.localRig.inputs.leftGamepad.pointer;
      const leftGamepadGrip = this.localRig.inputs.leftGamepad.grip;
      const leftGamepadEnabled = this.localRig.inputs.leftGamepad.enabled;

      const rightGamepadPosition = this.localRig.inputs.rightGamepad.position.toArray();
      const rightGamepadQuaternion = this.localRig.inputs.rightGamepad.quaternion.toArray();
      const rightGamepadPointer = this.localRig.inputs.rightGamepad.pointer;
      const rightGamepadGrip = this.localRig.inputs.rightGamepad.grip;
      const rightGamepadEnabled = this.localRig.inputs.rightGamepad.enabled;

      const floorHeight = this.localRig.getFloorHeight();
      const handsEnabled = [this.localRig.getHandEnabled(0), this.localRig.getHandEnabled(1)];
      const topEnabled = this.localRig.getTopEnabled();
      const bottomEnabled = this.localRig.getBottomEnabled();
      const direction = this.localRig.direction.toArray();
      const velocity = this.localRig.velocity.toArray();
      const {
        jumpState,
        jumpTime,
        flyState,
        flyTime,
        useTime,
        useAnimation,
        sitState,
        sitAnimation,
        danceState,
        danceTime,
        danceAnimation,
        throwState,
        throwTime,
        crouchState,
        crouchTime,
      } = this.localRig;

      return [
        [hmdPosition, hmdQuaternion],
        [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
        [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
        floorHeight,
        handsEnabled,
        topEnabled,
        bottomEnabled,
        direction,
        velocity,
        jumpState,
        jumpTime,
        flyState,
        flyTime,
        useTime,
        useAnimation,
        sitState,
        sitAnimation,
        danceState,
        danceTime,
        danceAnimation,
        throwState,
        throwTime,
        crouchState,
        crouchTime,
      ];
    } else {
      return null;
    }
  }

  setLocalAvatarPose(poseArray) {
    if (this.localRig) {
      const [
        [hmdPosition, hmdQuaternion],
        [leftGamepadPosition, leftGamepadQuaternion, leftGamepadPointer, leftGamepadGrip, leftGamepadEnabled],
        [rightGamepadPosition, rightGamepadQuaternion, rightGamepadPointer, rightGamepadGrip, rightGamepadEnabled],
      ] = poseArray;

      this.localRig.inputs.hmd.position.fromArray(hmdPosition);
      this.localRig.inputs.hmd.quaternion.fromArray(hmdQuaternion);

      this.localRig.inputs.leftGamepad.position.fromArray(leftGamepadPosition);
      this.localRig.inputs.leftGamepad.quaternion.fromArray(leftGamepadQuaternion);
      this.localRig.inputs.leftGamepad.pointer = leftGamepadPointer;
      this.localRig.inputs.leftGamepad.grip = leftGamepadGrip;
      this.localRig.inputs.leftGamepad.enabled = leftGamepadEnabled;

      this.localRig.inputs.rightGamepad.position.fromArray(rightGamepadPosition);
      this.localRig.inputs.rightGamepad.quaternion.fromArray(rightGamepadQuaternion);
      this.localRig.inputs.rightGamepad.pointer = rightGamepadPointer;
      this.localRig.inputs.rightGamepad.grip = rightGamepadGrip;
      this.localRig.inputs.rightGamepad.enabled = rightGamepadEnabled;

      /* this.localRig.textMesh.position.copy(this.localRig.inputs.hmd.position);
      this.localRig.textMesh.position.y += 0.5;
      this.localRig.textMesh.quaternion.copy(this.localRig.inputs.hmd.quaternion);
      localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
      localEuler.z = 0;
      this.localRig.textMesh.quaternion.setFromEuler(localEuler); */
    }
  }

  setPeerAvatarPose(player) {
    const peerRig = this.peerRigs.get(player.id);
    if (peerRig) { 
      const pose = player.pose;
      const {hmd, leftGamepad, rightGamepad} = peerRig.inputs;

      hmd.position.fromArray(pose.position);
      hmd.quaternion.fromArray(pose.quaternion);

      if (pose.extra.length > 0) {
        leftGamepad.position.fromArray(pose.extra[0]);
        leftGamepad.quaternion.fromArray(pose.extra[1]);
        leftGamepad.pointer = pose.extra[2][0];
        leftGamepad.grip = pose.extra[2][1];
        peerRig.setHandEnabled(0, pose.extra[2][2]);

        rightGamepad.position.fromArray(pose.extra[3]);
        rightGamepad.quaternion.fromArray(pose.extra[4]);
        rightGamepad.pointer = pose.extra[5][0];
        rightGamepad.grip = pose.extra[5][1];
        peerRig.setHandEnabled(0, pose.extra[5][2]);

        peerRig.setFloorHeight(pose.extra[6][0]);

        peerRig.setTopEnabled(pose.extra[6][1]);
        peerRig.setBottomEnabled(pose.extra[6][2]);

        peerRig.direction.fromArray(pose.extra[7]);
        peerRig.velocity.fromArray(pose.extra[8]);

        peerRig.jumpState = pose.extra[9][0];
        peerRig.jumpTime = pose.extra[9][1];
        peerRig.flyState = pose.extra[9][2];
        peerRig.flyTime = pose.extra[9][3];
        peerRig.useTime = pose.extra[9][4];
        peerRig.useAnimation = pose.extra[9][5];
        peerRig.sitState = pose.extra[9][6];
        peerRig.sitAnimation = pose.extra[9][7];
        peerRig.danceState = pose.extra[9][8];
        peerRig.danceTime = pose.extra[9][9];
        peerRig.danceAnimation = pose.extra[9][10];
        peerRig.throwState = pose.extra[9][11];
        peerRig.throwTime = pose.extra[9][12];
        peerRig.crouchState = pose.extra[9][13];
        peerRig.crouchTime = pose.extra[9][14];
      }

      /* peerRig.textMesh.position.copy(peerRig.inputs.hmd.position);
      peerRig.textMesh.position.y += 0.5;
      peerRig.textMesh.quaternion.copy(peerRig.inputs.hmd.quaternion);
      localEuler.setFromQuaternion(peerRig.textMesh.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.y += Math.PI;
      localEuler.z = 0;
      peerRig.textMesh.quaternion.setFromEuler(localEuler); */

      peerRig.rigCapsule.position.copy(peerRig.inputs.hmd.position);
      
      peerRig.volume = player.volume;
    }
  }
  
  getRigTransforms() {
    if (this.localRig) {
      return [
        {
          position: this.localRig.inputs.leftGamepad.position,
          quaternion: this.localRig.inputs.leftGamepad.quaternion,
        },
        {
          position: this.localRig.inputs.rightGamepad.position,
          quaternion: this.localRig.inputs.rightGamepad.quaternion,
        },
      ];
    } else {
      return [
        {
          position: localVector.set(0, 0, 0),
          quaternion: localQuaternion.set(0, 0, 0, 1),
        },
        {
          position: localVector2.set(0, 0, 0),
          quaternion: localQuaternion2.set(0, 0, 0, 1),
        },
      ];
    }
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
          for (const action of localPlayer.getActions()) {
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
        const localPlayerMessages = chatManager.getMessages().filter(m => m.object === this.localRig.modelBones.Head);
        const lastMessage = localPlayerMessages.length > 0 ? localPlayerMessages[localPlayerMessages.length - 1] : null;
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
