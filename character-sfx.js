import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
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
  loadAudioBuffer,
} from './util.js';

const localVector = new THREE.Vector3();

const walkSoundFileNames = `\
walk1.wav
walk2.wav
walk3.wav
walk4.wav
walk5.wav
walk6.wav
walk7.wav
walk8.wav
walk9.wav
walk10.wav
walk11.wav
walk12.wav`.split('\n');
const runSoundFileNames = `\
run1.wav
run2.wav
run3.wav
run4.wav
run5.wav
run6.wav
run7.wav
run8.wav
run9.wav
run10.wav
run11.wav
run12.wav`.split('\n');
const narutoRunSoundFileNames = `\
narutoRun1.wav
narutoRun2.wav
narutoRun3.wav
narutoRun4.wav
narutoRun5.wav
narutoRun6.wav
narutoRun7.wav
narutoRun8.wav
narutoRun9.wav
narutoRun10.wav
narutoRun11.wav
narutoRun12.wav`.split('\n');
const jumpSoundFileNames = `\
jump1.wav
jump2.wav
jump3.wav`.split('\n');
const landSoundFileNames = `\
land1.wav
land2.wav
land3.wav`.split('\n');

let walkSoundFiles;
let runSoundFiles;
let jumpSoundFiles;
let landSoundFiles;
let narutoRunSoundFiles;
const loadPromise = (async () => {
  await Avatar.waitForLoad();

  const _loadSoundFiles = getUrlFn => function(fileNames) {
    const audioContext = Avatar.getAudioContext();
    return Promise.all(fileNames.map(fileName => loadAudioBuffer(audioContext, getUrlFn(fileName))));
  };
  const _loadFootstepSoundFiles = (fileNames, soundType) => _loadSoundFiles(fileName => {
    return `/sounds/${soundType}/${fileName}`;
  })(fileNames);
  await Promise.all([
    _loadFootstepSoundFiles(walkSoundFileNames, 'walk').then(as => {
      walkSoundFiles = as;
    }),
    _loadFootstepSoundFiles(runSoundFileNames, 'run').then(as => {
      runSoundFiles = as;
    }),
    _loadFootstepSoundFiles(jumpSoundFileNames, 'jump').then(as => {
      jumpSoundFiles = as;
    }),
    _loadFootstepSoundFiles(landSoundFileNames, 'land').then(as => {
      landSoundFiles = as;
    }),
    _loadFootstepSoundFiles(narutoRunSoundFileNames, 'narutoRun').then(as => {
      narutoRunSoundFiles = as;
    }),
  ]);
})();
const waitForLoad = () => loadPromise;

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

    // jump
    const _playSound = audioBuffer => {
      const audioContext = Avatar.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = audioBuffer;
      audioBufferSourceNode.connect(audioContext.destination);
      audioBufferSourceNode.start();
    };
    {
      if (this.player.avatar.jumpState && !this.lastJumpState) {
        const audioBuffer = jumpSoundFiles[Math.floor(Math.random() * jumpSoundFiles.length)];
        _playSound(audioBuffer);
      } else if (this.lastJumpState && !this.player.avatar.jumpState) {
        const audioBuffer = landSoundFiles[Math.floor(Math.random() * landSoundFiles.length)];
        _playSound(audioBuffer);
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
      const soundFiles = (() => {
        if (isNarutoRun) {
          return narutoRunSoundFiles;
        } else if (isCrouching) {
          return walkSoundFiles;
        } else if (isRunning) {
          return runSoundFiles;
        } else {
          return walkSoundFiles;
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
            const candidateAudios = soundFiles//.filter(a => a.paused);
            if (candidateAudios.length > 0) {
              /* for (const a of candidateAudios) {
                !a.paused && a.pause();
              } */
              
              const audioBuffer = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
              _playSound(audioBuffer);
            }
          }
          this.lastStepped[0] = leftStepIndices[i];

          if (rightStepIndices[i] && !this.lastStepped[1]) {
            const candidateAudios = soundFiles// .filter(a => a.paused);
            if (candidateAudios.length > 0) {
              /* for (const a of candidateAudios) {
                !a.paused && a.pause();
              } */

              const audioBuffer = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
              _playSound(audioBuffer);
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
}

const _updateSound = () => {
  
};

export {
  waitForLoad,
  CharacterSfx,
};