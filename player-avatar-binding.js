/* utils to bind players to their avatars
set the avatar state from the player state */

import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import {unFrustumCull, enableShadows} from './util.js';
import {
  getEyePosition,
} from './avatars/util.mjs';
import {playersManager} from './players-manager.js';

const appSymbol = 'app'; // Symbol('app');
const avatarSymbol = 'avatar'; // Symbol('avatar');
const maxMirrorDistanace = 3;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localPlane = new THREE.Plane();

export function applyPlayerTransformsToAvatar(player, session, rig) {
  if (!session) {
    rig.inputs.hmd.position.copy(player.avatarBinding.position);
    rig.inputs.hmd.quaternion.copy(player.avatarBinding.quaternion);
    rig.inputs.leftGamepad.position.copy(player.leftHand.position);
    rig.inputs.leftGamepad.quaternion.copy(player.leftHand.quaternion);
    rig.inputs.rightGamepad.position.copy(player.rightHand.position);
    rig.inputs.rightGamepad.quaternion.copy(player.rightHand.quaternion);
  }
}
/* export function applyPlayerMetaTransformsToAvatar(player, session, rig) {
  if (player.characterPhysics && !session) {
    rig.velocity.copy(player.characterPhysics.velocity);
  }
} */
export function applyPlayerModesToAvatar(player, session, rig) {
  for (let i = 0; i < 2; i++) {
    rig.setHandEnabled(i, player.hands[i].enabled);
  }
  rig.setTopEnabled(
    (!!session && (rig.inputs.leftGamepad.enabled || rig.inputs.rightGamepad.enabled)),
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
export function makeAvatar(app) {
  if (app) {
    const {skinnedVrm} = app;

    const _getPlayerByAppInstanceId = instanceId => {
      const remotePlayers = playersManager.getRemotePlayers(); // Might have to be removed too
      const localPlayer = playersManager.getLocalPlayer();
      const result = localPlayer.appManager.getAppByInstanceId(instanceId);
      if (result) {
        return localPlayer;
      } else {
        for (const remotePlayer in remotePlayers) {
          if (remotePlayer.appManager.getAppByInstanceId(instanceId)) {
            return remotePlayer;
          }
        }
      }
    }

    const player = _getPlayerByAppInstanceId(app.instanceId);
    if (skinnedVrm) {
      const avatar = new Avatar(skinnedVrm, {
        isLocalPlayer: player !== undefined && !player.isRemotePlayer,
        fingers: true,
        hair: true,
        visemes: true,
        debug: false,
      });
      avatar[appSymbol] = app;

      unFrustumCull(app);
      enableShadows(app);

      return avatar;
    }
  }
  return null;
}
export function applyPlayerActionsToAvatar(player, rig) {
  const jumpAction = player.getAction('jump');
  const doubleJumpAction = player.getAction('doubleJump');
  const landAction = player.getAction('land');
  const flyAction = player.getAction('fly');
  const swimAction = player.getAction('swim');
  const useAction = player.getAction('use');
  const pickUpAction = player.getAction('pickUp');
  const narutoRunAction = player.getAction('narutoRun');
  const sitAction = player.getAction('sit');
  const sitAnimation = sitAction ? sitAction.animation : '';
  const danceAction = player.getAction('dance');
  const danceAnimation = danceAction ? danceAction.animation : '';
  const emoteAction = player.getAction('emote');
  const emoteAnimation = emoteAction ? emoteAction.animation : '';
  // const throwAction = player.getAction('throw');
  const aimAction = player.getAction('aim');
  const crouchAction = player.getAction('crouch');
  const wearAction = player.getAction('wear');
  // const chargeJump = player.getAction('chargeJump');
  // const chargeJumpAnimation = chargeJump ? chargeJump.animation : '';
  // const standCharge = player.getAction('standCharge');
  // const standChargeAnimation = standCharge ? standCharge.animation : '';
  const fallLoopAction = player.getAction('fallLoop');
  // const fallLoopAnimation = fallLoopAction ? fallLoopAction.animation : '';
  const hurtAction = player.getAction('hurt');
  // const swordSideSlash = player.getAction('swordSideSlash');
  // const swordSideSlashAnimation = swordSideSlash ? swordSideSlash.animation : '';
  // const swordTopDownSlash = player.getAction('swordTopDownSlash');
  // const swordTopDownSlashAnimation = swordTopDownSlash ? swordTopDownSlash.animation : '';

  rig.jumpState = !!jumpAction;
  rig.jumpTime = player.actionInterpolants.jump.get();
  rig.doubleJumpState = !!doubleJumpAction;
  rig.doubleJumpTime = player.actionInterpolants.doubleJump.get();
  rig.landTime = player.actionInterpolants.land.get();
  rig.lastLandStartTime = landAction ? landAction.time : 0;
  rig.landWithMoving = landAction?.isMoving;
  rig.flyState = !!flyAction;
  rig.flyTime = flyAction ? player.actionInterpolants.fly.get() : -1;
  rig.activateTime = player.actionInterpolants.activate.get();
  rig.swimState = !!swimAction;
  rig.swimTime = swimAction ? player.actionInterpolants.swim.get() : -1;
  
  const _handleUse = () => {
    if (useAction?.animation) {
      rig.useAnimation = useAction.animation;
    } else {
      if (rig.useAnimation) {
        rig.useAnimation = '';
      }
    }
    if (useAction?.animationCombo) {
      rig.useAnimationCombo = useAction.animationCombo;
    } else {
      if (rig.useAnimationCombo.length > 0) {
        rig.useAnimationCombo = [];
      }
    }
    if (useAction?.animationEnvelope) {
      rig.useAnimationEnvelope = useAction.animationEnvelope;
    } else {
      if (rig.useAnimationEnvelope.length > 0) {
        rig.useAnimationEnvelope = [];
      }
    }
    rig.useAnimationIndex = useAction?.index;
    rig.useTime = player.actionInterpolants.use.get();
    rig.unuseTime = player.actionInterpolants.unuse.get();
    if (rig.unuseTime === 0) { // this means use is active
      if (useAction?.animationEnvelope) {
        rig.unuseAnimation = rig.useAnimationEnvelope[2]; // the last animation in the triplet is the unuse animation
      } else {
        rig.unuseAnimation = null;
      }
    }
  };
  _handleUse();

  const _handlePickUp = () => {
    rig.pickUpState = !!pickUpAction;
    rig.pickUpTime = player.actionInterpolants.pickUp.get();
  };
  _handlePickUp();

  rig.manuallySetMouth  = player.characterBehavior.manuallySetMouth;
  rig.vowels[1] = player.characterBehavior.manuallySetMouth ? 0 : rig.vowels[1];
  rig.vowels[2] = player.characterBehavior.manuallySetMouth ? 0 : rig.vowels[2];
  rig.vowels[3] = player.characterBehavior.manuallySetMouth ? 0 : rig.vowels[3];
  rig.vowels[4] = player.characterBehavior.manuallySetMouth ? 0 : rig.vowels[4];

  rig.narutoRunState = !!narutoRunAction && !crouchAction;
  rig.narutoRunTime = player.actionInterpolants.narutoRun.get();
  rig.aimState = !!aimAction;
  rig.aimTime = player.actionInterpolants.aim.get();
  rig.aimRightTransitionTime = player.actionInterpolants.aimRightTransition.get();
  rig.aimLeftTransitionTime = player.actionInterpolants.aimLeftTransition.get();
  rig.aimAnimation = (aimAction?.playerAnimation) || '';
  // rig.aimDirection.set(0, 0, -1);
  // aimAction && rig.aimDirection.applyQuaternion(rig.inputs.hmd.quaternion);
  rig.sitState = !!sitAction;
  rig.sitAnimation = sitAnimation;

  // XXX this needs to be based on the current loadout index
  rig.holdState = wearAction?.holdAnimation === 'pick_up_idle';
  if (rig.holdState) rig.unuseAnimation = null;
  // rig.danceState = !!danceAction;
  rig.danceFactor = player.actionInterpolants.dance.get();
  if (danceAction) {
    rig.danceAnimation = danceAnimation;
  }
  rig.emoteFactor = player.actionInterpolants.emote.get();
  rig.emoteAnimation = emoteAnimation;
  // rig.throwState = !!throwAction;
  // rig.throwTime = player.actionInterpolants.throw.get();
  rig.crouchTime = player.actionInterpolants.crouch.getInverse();
  // rig.chargeJumpTime = player.actionInterpolants.chargeJump.get();
  // rig.chargeAnimation = chargeJumpAnimation;
  // rig.chargeJumpState = !!chargeJump;
  // rig.standChargeTime = player.actionInterpolants.standCharge.get();
  // rig.standChargeAnimation = standChargeAnimation;
  // rig.standChargeState = !!standCharge;
  rig.fallLoopTime = player.actionInterpolants.fallLoop.get();
  rig.fallLoopFactor = player.actionInterpolants.fallLoopTransition.getNormalized();
  rig.fallLoopFrom = fallLoopAction ? fallLoopAction.from : '';
  // rig.fallLoopAnimation = fallLoopAnimation;
  rig.fallLoopState = !!fallLoopAction;
  rig.landState = !!landAction;
  // rig.swordSideSlashTime = player.actionInterpolants.swordSideSlash.get();
  // rig.swordSideSlashAnimation = swordSideSlashAnimation;
  // rig.swordSideSlashState = !!swordSideSlash;
  // rig.swordTopDownSlashTime = player.actionInterpolants.swordTopDownSlash.get();
  // rig.swordTopDownSlashAnimation = swordTopDownSlashAnimation;
  // rig.swordTopDownSlashState = !!swordTopDownSlash;
  rig.hurtAnimation = (hurtAction?.animation) || '';
  rig.hurtTime = player.actionInterpolants.hurt.get();
  rig.movementsTime = player.actionInterpolants.movements.get();
  rig.movementsTransitionTime = player.actionInterpolants.movementsTransition.get();
  rig.sprintTime = player.actionInterpolants.sprint.get();
}
// returns whether headTarget were applied
export function applyPlayerHeadTargetToAvatar(player, rig) {
  if (player.headTargetEnabled) {
    rig.headTarget.copy(player.headTarget);
    rig.headTargetInverted = player.headTargetInverted;
    rig.headTargetEnabled = true;
    return true;
  } else {
    rig.headTargetEnabled = false;
    return false;
  }
}
// returns whether eyes(eyeballs) were applied
export function applyPlayerEyesToAvatar(player, rig) {
  if (player.eyeballTargetEnabled) {
    rig.eyeballTarget.copy(player.eyeballTarget);
    rig.eyeballTargetEnabled = true;
    return true;
  } else {
    rig.eyeballTargetEnabled = false;
    return false;
  }
}
export function applyMirrorsToAvatar(player, rig, mirrors) {
  rig.eyeballTargetEnabled = false;

  const closestMirror = mirrors.sort((a, b) => {
    const aDistance = player.position.distanceTo(a.position);
    const bDistance = player.position.distanceTo(b.position);
    return aDistance - bDistance;
  })[0];
  if (closestMirror) {
    // console.log('player bind mirror', closestMirror);
    const mirrorPosition = localVector2.setFromMatrixPosition(closestMirror.matrixWorld);

    if (mirrorPosition.distanceTo(player.position) < maxMirrorDistanace) {
      const eyePosition = getEyePosition(rig.modelBones);
      localPlane
        .setFromNormalAndCoplanarPoint(
          localVector.set(0, 0, 1)
            .applyQuaternion(localQuaternion.setFromRotationMatrix(closestMirror.matrixWorld)),
          mirrorPosition,
        )
        .projectPoint(eyePosition, rig.eyeballTarget);
      rig.eyeballTargetEnabled = true;
    }
  }
}
export function applyFacePoseToAvatar(player, rig) {
  const facePoseActions = player.getActionsArray().filter(a => a.type === 'facepose');
  if (facePoseActions.length > 0) {
    player.avatar.faceposes = facePoseActions;
  } else {
    if (player.avatar.faceposes.length !== 0) {
      player.avatar.faceposes.length = 0;
    }
  }
}
export function applyPlayerPoseToAvatar(player, rig) {
  const poseAction = player.getAction('pose');
  rig.poseAnimation = poseAction?.animation || null;
}
export function applyPlayerToAvatar(player, session, rig, mirrors) {
  applyPlayerTransformsToAvatar(player, session, rig);
  // applyPlayerMetaTransformsToAvatar(player, session, rig);
  
  applyPlayerModesToAvatar(player, session, rig);
  applyPlayerActionsToAvatar(player, rig);
  applyPlayerHeadTargetToAvatar(player, rig);
  applyPlayerEyesToAvatar(player, rig) || applyMirrorsToAvatar(player, rig, mirrors);
  
  applyFacePoseToAvatar(player, rig);
  applyPlayerPoseToAvatar(player, rig);
}

export function switchAvatar(oldAvatar, newApp) {
  let result;

  oldAvatar && oldAvatar[appSymbol].toggleBoneUpdates(true);

  if (newApp) {
    newApp.toggleBoneUpdates(true);
    if (!newApp[avatarSymbol]) {
      newApp[avatarSymbol] = makeAvatar(newApp);
    }
    result = newApp[avatarSymbol];
  } else {
    result = null;
  }
  return result;
}
/* export async function switchAvatar(oldAvatar, newApp) {
  let result;
  const promises = [];
  if (oldAvatar) {
    promises.push((async () => {
      await oldAvatar[appSymbol].setSkinning(false);
    })());
  }
  if (newApp) {
    // promises.push((async () => {
    newApp.toggleBoneUpdates(true);
      if (!newApp[avatarSymbol]) {
        newApp[avatarSymbol] = makeAvatar(newApp);
      }
      result = newApp[avatarSymbol];
    // })());
  } else {
    result = null;
  }
  await Promise.all(promises);
  return result;
} */
