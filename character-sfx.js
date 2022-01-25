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

  const audioTimeoutTime = 5 * 1000;
  const _loadSoundFiles = (fileNames, soundType) => Promise.all(fileNames.map(async fileName => {
    const audio = new Audio();
    const p = new Promise((accept, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('audio load timed out'));
      }, audioTimeoutTime);
      const _cleanup = () => {
        clearTimeout(timeout);
      };
      audio.oncanplaythrough = () => {
        _cleanup();
        accept();
      };
      audio.onerror = err => {
        _cleanup();
        reject(err);
      };
    });
    // console.log('got src', `../sounds/${soundType}/${fileName}`);
    audio.src = `/sounds/${soundType}/${fileName}`;
    audio.load();
    await p;
    // document.body.appendChild(audio);
    return audio;
  }));
  await Promise.all([
    _loadSoundFiles(walkSoundFileNames, 'walk').then(as => {
      walkSoundFiles = as;
    }),
    _loadSoundFiles(narutoRunSoundFileNames, 'narutoRun').then(as => {
      narutoRunSoundFiles = as;
    }),
    _loadSoundFiles(runSoundFileNames, 'run').then(as => {
      runSoundFiles = as;
    }),
    _loadSoundFiles(jumpSoundFileNames, 'jump').then(as => {
      jumpSoundFiles = as;
    }),
    _loadSoundFiles(landSoundFileNames, 'land').then(as => {
      landSoundFiles = as;
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
    {
      if (this.player.avatar.jumpState && !this.lastJumpState) {
        const candidateAudios = jumpSoundFiles;
        const audio = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
        audio.currentTime = 0;
        audio.paused && audio.play();
      } else if (this.lastJumpState && !this.player.avatar.jumpState) {
        const candidateAudios = landSoundFiles;
        const audio = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
        audio.currentTime = 0;
        audio.paused && audio.play();
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
        const f = walkRunAnimationName === 'naruto run.fbx' ? narutoRunTimeFactor : 1;
        const t1 = (timeSeconds * f + offset) % animation.duration;
        const walkFactor1 = t1 / animation.duration;
        const stepIndex = Math.floor(mod(walkFactor1, 1) * leftStepIndices.length);
        return stepIndex;
      };
      // const t1 = (timeSeconds + offset) % animationAngles[0].animation.duration;
      // const walkFactor1 = t1 / animationAngles[0].animation.duration;
      // const walkFactor2 = t2 / animationAngles[1].animation.duration;
      // console.log('animation angles', {walkRunAnimationName, animationIndices, isCrouching, keyWalkAnimationAngles, keyAnimationAnglesOther});
      // console.log('got animation name', walkRunAnimationName);

      const startIndex = _getStepIndex(this.lastWalkTime);
      const endIndex = _getStepIndex(timeSeconds);
      for (let i = startIndex;; i++) {
        i = i % leftStepIndices.length;
        // console.log('check', i, startIndex, endIndex);
        if (i !== endIndex) {
          if (leftStepIndices[i] && !this.lastStepped[0]) {
            const candidateAudios = soundFiles//.filter(a => a.paused);
            if (candidateAudios.length > 0) {
              /* for (const a of candidateAudios) {
                !a.paused && a.pause();
              } */
              
              const audio = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
              audio.currentTime = 0;
              audio.paused && audio.play();
              // console.log('left');
            }
          }
          this.lastStepped[0] = leftStepIndices[i];

          if (rightStepIndices[i] && !this.lastStepped[1]) {
            const candidateAudios = soundFiles// .filter(a => a.paused);
            if (candidateAudios.length > 0) {
              /* for (const a of candidateAudios) {
                !a.paused && a.pause();
              } */

              const audio = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
              audio.currentTime = 0;
              audio.paused && audio.play();
              // console.log('right');
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