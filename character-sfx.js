import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import * as sounds from './sounds.js';
import {
  idleFactorSpeed,
  walkFactorSpeed,
  runFactorSpeed,
  narutoRunTimeFactor,
} from './avatars/constants.js';
import {
  crouchMaxTime,
} from './constants.js';
import {
  mod,
  // loadJson,
  // loadAudioBuffer,
} from './util.js';

const localVector = new THREE.Vector3();

// HACK: this is used to dynamically control the step offset for a particular animation
// it is useful during development to adjust sync between animations and sound
// the key listener part of this is in io-manager.js
/* if (typeof window.lol !== 'number') {
  window.lol = 0.06;
  window.lol2 = 0.18;
} */
const sneakingOffset = -0.14;
const walkingOffset = 0.13;
const walkingBackwardOffset = 0.18;
const runningBackwardOffset = 0.06;
const strafeWalkingOffset = 0.24;
const offsets = {
  'Sneaking Forward.fbx': sneakingOffset, 
  'walking.fbx': walkingOffset,
  'walking backwards.fbx': walkingBackwardOffset,
  'Fast Run.fbx': 0,
  'left strafe walking.fbx': strafeWalkingOffset,
  'right strafe walking.fbx': strafeWalkingOffset,
  'running backwards.fbx': runningBackwardOffset,
};

class CharacterSfx {
  constructor(player) {
    this.player = player;

    this.lastJumpState = false;
    this.lastStepped = [false, false];
    this.lastWalkTime = 0;
  }
  update(timestamp, timeDiffS) {
    if (!this.player.avatar) {
      return;
    }

    const timeSeconds = timestamp/1000;
    const currentSpeed = localVector.set(this.player.avatar.velocity.x, 0, this.player.avatar.velocity.z).length();
    
    const idleWalkFactor = Math.min(Math.max((currentSpeed - idleFactorSpeed) / (walkFactorSpeed - idleFactorSpeed), 0), 1);
    const walkRunFactor = Math.min(Math.max((currentSpeed - walkFactorSpeed) / (runFactorSpeed - walkFactorSpeed), 0), 1);
    const crouchFactor = Math.min(Math.max(1 - (this.player.avatar.crouchTime / crouchMaxTime), 0), 1);

    const soundFiles = sounds.getSoundFiles();
    const soundFileAudioBuffer = sounds.getSoundFileAudioBuffer();

    // jump
    const _playSound = audioSpec => {
      const {offset, duration} = audioSpec;

      const audioContext = Avatar.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = soundFileAudioBuffer;
      audioBufferSourceNode.connect(audioContext.destination);
      audioBufferSourceNode.start(0, offset, duration);
    };
    {
      if (this.player.avatar.jumpState && !this.lastJumpState) {
        const audioSpec = soundFiles.jump[Math.floor(Math.random() * soundFiles.jump.length)];
        _playSound(audioSpec);
      } else if (this.lastJumpState && !this.player.avatar.jumpState) {
        const audioSpec = soundFiles.land[Math.floor(Math.random() * soundFiles.land.length)];
        _playSound(audioSpec);
      }
      this.lastJumpState = this.player.avatar.jumpState;
    }

    // step
    if (idleWalkFactor > 0.7 && !this.player.avatar.jumpState && !this.player.avatar.flyState) {
      const isRunning = walkRunFactor > 0.5;
      const isCrouching = crouchFactor > 0.5;
      const isNarutoRun = this.player.avatar.narutoRunState;
      const walkRunAnimationName = (() => {
        if (isNarutoRun) {
          return 'naruto run.fbx';
        } else {
          const animationAngles = isCrouching ?
            Avatar.getClosest2AnimationAngles('crouch', this.player.avatar.getAngle())
          :
            (isRunning ?
              Avatar.getClosest2AnimationAngles('run', this.player.avatar.getAngle())
            :
              Avatar.getClosest2AnimationAngles('walk', this.player.avatar.getAngle())
            );
          return animationAngles[0].name;
        }
      })();
      const localSoundFiles = (() => {
        if (isNarutoRun) {
          return soundFiles.narutoRun;
        } else if (isCrouching) {
          return soundFiles.walk;
        } else if (isRunning) {
          return soundFiles.run;
        } else {
          return soundFiles.walk;
        }
      })();
      const animations = Avatar.getAnimations();
      const animation = animations.find(a => a.name === walkRunAnimationName);
      const animationStepIndices = Avatar.getAnimationStepIndices();
      const animationIndices = animationStepIndices.find(i => i.name === walkRunAnimationName);
      const {leftStepIndices, rightStepIndices} = animationIndices;

      const offset = offsets[walkRunAnimationName] ?? 0; // ?? window.lol;
      const _getStepIndex = timeSeconds => {
        const timeMultiplier = walkRunAnimationName === 'naruto run.fbx' ? narutoRunTimeFactor : 1;
        const walkTime = (timeSeconds * timeMultiplier + offset) % animation.duration;
        const walkFactor = walkTime / animation.duration;
        const stepIndex = Math.floor(mod(walkFactor, 1) * leftStepIndices.length);
        return stepIndex;
      };

      const startIndex = _getStepIndex(this.lastWalkTime);
      const endIndex = _getStepIndex(timeSeconds);
      for (let i = startIndex;; i++) {
        i = i % leftStepIndices.length;
        if (i !== endIndex) {
          if (leftStepIndices[i] && !this.lastStepped[0]) {
            const candidateAudios = localSoundFiles//.filter(a => a.paused);
            if (candidateAudios.length > 0) {
              /* for (const a of candidateAudios) {
                !a.paused && a.pause();
              } */
              
              const audioSpec = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
              _playSound(audioSpec);
            }
          }
          this.lastStepped[0] = leftStepIndices[i];

          if (rightStepIndices[i] && !this.lastStepped[1]) {
            const candidateAudios = localSoundFiles// .filter(a => a.paused);
            if (candidateAudios.length > 0) {
              /* for (const a of candidateAudios) {
                !a.paused && a.pause();
              } */

              const audioSpec = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
              _playSound(audioSpec);
            }
          }
          this.lastStepped[1] = rightStepIndices[i];
        } else {
          break;
        }
      }

      this.lastWalkTime = timeSeconds;
    }
  }
  destroy() {
    // nothing
  }
}

export {
  CharacterSfx,
};