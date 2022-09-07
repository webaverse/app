import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import * as sounds from './sounds.js';
import audioManager from './audio-manager.js';

import {
  idleFactorSpeed,
  walkFactorSpeed,
  runFactorSpeed,
  narutoRunTimeFactor,
} from './avatars/constants.js';
import {
  crouchMaxTime,
  eatFrameIndices,
  drinkFrameIndices,
} from './constants.js';
import {
  mod,
  selectVoice,
  // loadJson,
  // loadAudioBuffer,
} from './util.js';

const localVector = new THREE.Vector3();

const freestyleDuration = 1466.6666666666666 / 2;
const freestyleOffset = 900 / 2;
const breaststrokeDuration = 1066.6666666666666;
const breaststrokeOffset = 433.3333333333333;

const aimAnimations = {
  swordSideIdle: 'sword_idle_side.fbx',
  swordSideIdleStatic: 'sword_idle_side_static.fbx',
  swordSideSlash: 'sword_side_slash.fbx',
  swordSideSlashStep: 'sword_side_slash_step.fbx',
  swordTopDownSlash: 'sword_topdown_slash.fbx',
  swordTopDownSlashStep: 'sword_topdown_slash_step.fbx',
  swordUndraw: 'sword_undraw.fbx',
};


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
const _getActionFrameIndex = (f, frameTimes) => {
  let i;
  for (i = 0; i < frameTimes.length; i++) {
    if (f >= frameTimes[i]) {
      continue;
    } else {
      break;
    }
  }
  return i;
};

class Sfx extends EventTarget {
  constructor(player) {
    super();
    this.player = player;
    this.oldGrunt = null;
    this.voiceFiles = null;
    this.soundFiles = sounds.getSoundFiles();
    this.player.addEventListener('voicepackloaded', this.setVoiceFiles.bind(this));
  }
  cleanup() {
    this.player.removeEventListener('voicepackloaded', this.setVoiceFiles.bind(this));
  }
  setVoiceFiles() {
    const actionVoices = this.player.voicePack.actionVoices;
    const emoteVoices = this.player.voicePack.emoteVoices;
    this.voiceFiles = {
      actionVoices: {
        hurt: actionVoices.filter(f => /hurt/i.test(f.name)),
        scream: actionVoices.filter(f => /scream/i.test(f.name)),
        attack: actionVoices.filter(f => /attack/i.test(f.name)),
        angry: actionVoices.filter(f => /angry/i.test(f.name)),
        gasp: actionVoices.filter(f => /gasp/i.test(f.name)),
        jump: actionVoices.filter(f => /jump/i.test(f.name)),
        narutoRun: actionVoices.filter(f => /nr/i.test(f.name))
      },
      emoteVoices: {
        alertSoft: emoteVoices.filter(f => /alert/i.test(f.name)),
        alert: emoteVoices.filter(f => /alert/i.test(f.name)),
        angrySoft: emoteVoices.filter(f => /angry/i.test(f.name)),
        angry: emoteVoices.filter(f => /angry/i.test(f.name)),
        embarrassedSoft: emoteVoices.filter(f => /emba/i.test(f.name)),
        embarrassed: emoteVoices.filter(f => /emba/i.test(f.name)),
        headNodSoft: emoteVoices.filter(f => /nod/i.test(f.name)),
        headNod: emoteVoices.filter(f => /nod/i.test(f.name)),
        headShakeSoft: emoteVoices.filter(f => /shake/i.test(f.name)),
        headShake: emoteVoices.filter(f => /shake/i.test(f.name)),
        sadSoft: emoteVoices.filter(f => /sad/i.test(f.name)),
        sad: emoteVoices.filter(f => /sad/i.test(f.name)),
        surpriseSoft: emoteVoices.filter(f => /surprise/i.test(f.name)),
        surprise: emoteVoices.filter(f => /surprise/i.test(f.name)),
        victorySoft: emoteVoices.filter(f => /victory/i.test(f.name)),
        victory: emoteVoices.filter(f => /victory/i.test(f.name))
      }
    };
  }
  playGrunt(type, index) {
    if (this.voiceFiles) {
      const voiceFiles = this.voiceFiles.actionVoices[type];
      let offset, duration;
      
      if (index === undefined) {
        let voice = selectVoice(voiceFiles);
        duration = voice.duration;
        offset = voice.offset;
      }
      else {
        duration = voiceFiles[index].duration;
        offset = voiceFiles[index].offset;
      } 
      
      const audioContext = audioManager.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = this.player.voicePack.audioBuffer;

      // control mouth movement with audio volume
      if (!this.player.avatar.isAudioEnabled()) {
        this.player.avatar.setAudioEnabled(true);
      }
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());

      // if the oldGrunt are still playing
      if (this.oldGrunt) {
        this.oldGrunt.stop();
        this.oldGrunt = null;
      }

      this.oldGrunt=audioBufferSourceNode;
      // clean the oldGrunt if voice end
      audioBufferSourceNode.addEventListener('ended', () => {
        if (this.oldGrunt === audioBufferSourceNode) {
          this.oldGrunt = null;
        }
      });

      audioBufferSourceNode.start(0, offset, duration);
    }
  }
  playEmote(type, index) {
    if (this.voiceFiles) { // ensure voice pack loaded
      const voiceFiles = this.voiceFiles.emoteVoices[type];
      let offset, duration;
      
      if (index === undefined) {
        let voice = selectVoice(voiceFiles);
        duration = voice.duration;
        offset = voice.offset;
      }
      else {
        duration = voiceFiles[index].duration;
        offset = voiceFiles[index].offset;
      } 
      
      const audioContext = audioManager.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = this.player.voicePack.audioBuffer;

      // control mouth movement with audio volume
      if (!this.player.avatar.isAudioEnabled()) {
        this.player.avatar.setAudioEnabled(true);
      }
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());

      // if the oldGrunt are still playing
      if (this.oldGrunt) {
        this.oldGrunt.stop();
        this.oldGrunt = null;
      }

      this.oldGrunt=audioBufferSourceNode;
      // clean the oldGrunt if voice end
      audioBufferSourceNode.addEventListener('ended', () => {
        if (this.oldGrunt === audioBufferSourceNode) {
          this.oldGrunt = null;
        }
      });

      audioBufferSourceNode.start(0, offset, duration);
    }
  }
}

class JumpSfx extends Sfx {
  constructor(player) {
    super(player);
    this.lastLandState = false;
    this.lastJumpState = false;
  }
  update(timestamp, timeDiffS) {
    if (this.player.avatar.jumpState && !this.lastJumpState) {
      sounds.playSoundName('jump');

      const jumpAction = this.player.getAction('jump');
      if(jumpAction?.trigger === 'jump') {
        this.playGrunt('jump'); 
      }
    }
    if(this.player.avatar.landState && !this.lastLandState){
      sounds.playSoundName('land');
    }
    this.lastLandState = this.player.avatar.landState;
    this.lastJumpState = this.player.avatar.jumpState;
  }
}

class StepSfx extends Sfx {
  constructor(player) {
    super(player);
    this.lastWalkTime = 0;
    this.lastStepped = [false, false];
    this.narutoRunFinishTime = 0;
    this.currentStep = null;
  }
  update(timestamp, timeDiffS) {
    const timeSeconds = timestamp/1000;
    const currentSpeed = localVector.set(this.player.avatar.velocity.x, 0, this.player.avatar.velocity.z).length();
    const idleWalkFactor = Math.min(Math.max((currentSpeed - idleFactorSpeed) / (walkFactorSpeed - idleFactorSpeed), 0), 1);
    const walkRunFactor = Math.min(Math.max((currentSpeed - walkFactorSpeed) / (runFactorSpeed - walkFactorSpeed), 0), 1);
    const crouchFactor = Math.min(Math.max(1 - (this.player.avatar.crouchTime / crouchMaxTime), 0), 1);

    if (
      idleWalkFactor > 0.7 &&
      !this.player.avatar.jumpState &&
      !this.player.avatar.fallLoopState &&
      !this.player.avatar.flyState &&
      !this.player.hasAction("swim") &&
      !this.player.hasAction("sit")
    ) {
      const isRunning = walkRunFactor > 0.5;
      const isCrouching = crouchFactor > 0.5;
      const isNarutoRun = this.player.avatar.narutoRunState;
      const walkRunAnimationName = (() => {
        if (isNarutoRun) {
          return "naruto run.fbx";
        } else {
          const animationAngles = isCrouching
            ? Avatar.getClosest2AnimationAngles(
                "crouch",
                this.player.avatar.getAngle()
              )
            : isRunning
            ? Avatar.getClosest2AnimationAngles(
                "run",
                this.player.avatar.getAngle()
              )
            : Avatar.getClosest2AnimationAngles(
                "walk",
                this.player.avatar.getAngle()
              );
          return animationAngles[0].name;
        }
      })();
      const localSoundFiles = (() => {
        if (isNarutoRun) {
          return this.soundFiles.narutoRun;
        } else if (isCrouching) {
          return this.soundFiles.walk;
        } else if (isRunning) {
          return this.soundFiles.run;
        } else {
          return this.soundFiles.walk;
        }
      })();
      const animations = Avatar.getAnimations();
      const animation = animations.find((a) => a.name === walkRunAnimationName);
      const animationStepIndices = Avatar.getAnimationStepIndices();
      const animationIndices = animationStepIndices.find(
        (i) => i.name === walkRunAnimationName
      );
      const { leftStepIndices, rightStepIndices } = animationIndices;

      const offset = offsets[walkRunAnimationName] ?? 0; // ?? window.lol; // check
      const _getStepIndex = (timeSeconds) => {
        const timeMultiplier =
          walkRunAnimationName === "naruto run.fbx" ? narutoRunTimeFactor : 1;
        const walkTime =
          (timeSeconds * timeMultiplier + offset) % animation.duration;
        const walkFactor = walkTime / animation.duration;
        const stepIndex = Math.floor(
          mod(walkFactor, 1) * leftStepIndices.length
        );
        return stepIndex;
      };

      const startIndex = _getStepIndex(this.lastWalkTime);
      const endIndex = _getStepIndex(timeSeconds);
      for (let i = startIndex; ; i++) {
        i = i % leftStepIndices.length;
        if (i !== endIndex) {
          if (
            leftStepIndices[i] &&
            !this.lastStepped[0] &&
            !this.player.avatar.narutoRunState &&
            timeSeconds - this.narutoRunFinishTime > 0.5
          ) {
            const candidateAudios = localSoundFiles; //.filter(a => a.paused);
            if (candidateAudios.length > 0) {
              this.currentStep = "left";
              const audioSpec =
                candidateAudios[
                  Math.floor(Math.random() * candidateAudios.length)
                ];
              sounds.playSound(audioSpec);
            }
          }
          this.lastStepped[0] = leftStepIndices[i];

          if (
            rightStepIndices[i] &&
            !this.lastStepped[1] &&
            !this.player.avatar.narutoRunState &&
            timeSeconds - this.narutoRunFinishTime > 0.5
          ) {
            const candidateAudios = localSoundFiles; // .filter(a => a.paused);
            if (candidateAudios.length > 0) {
              this.currentStep = "right";
              const audioSpec =
                candidateAudios[
                  Math.floor(Math.random() * candidateAudios.length)
                ];
              sounds.playSound(audioSpec);
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

class SwimSfx extends Sfx {
  constructor(player) {
    super(player);
    this.currentSwimmingHand = null;
    this.setSwimmingHand = true;
  }
  update(timestamp, timeDiffS) {
    const swimAction = this.player.getAction('swim');
    if(swimAction?.animationType === 'breaststroke') {
        if(this.setSwimmingHand && this.player.actionInterpolants.movements.get() % breaststrokeDuration <= breaststrokeOffset){ // check
          this.setSwimmingHand = false;
          this.currentSwimmingHand = null;
        }
        else if(!this.setSwimmingHand && this.player.actionInterpolants.movements.get() % breaststrokeDuration > breaststrokeOffset){
          let regex = new RegExp('^water/swim[0-9]*.wav$');
          const candidateAudios = this.soundFiles.water.filter(f => regex.test(f.name));
          const audioSpec = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
          if(swimAction.onSurface)
            sounds.playSound(audioSpec);

          this.setSwimmingHand = true;
          this.currentSwimmingHand = 'right';
        }
    } else if(swimAction?.animationType === 'freestyle') {
      let regex = new RegExp('^water/swim_fast[0-9]*.wav$');
      const candidateAudios = this.soundFiles.water.filter(f => regex.test(f.name));
      const audioSpec = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];

      if(this.setSwimmingHand && this.player.actionInterpolants.movements.get() % freestyleDuration <= freestyleOffset){
        if(swimAction.onSurface) sounds.playSound(audioSpec);
        this.currentSwimmingHand = 'left';
        this.setSwimmingHand = false;
      }
      else if(!this.setSwimmingHand && this.player.actionInterpolants.movements.get() % freestyleDuration > freestyleOffset){
        if(swimAction.onSurface) sounds.playSound(audioSpec);
        this.currentSwimmingHand = 'right';
        this.setSwimmingHand = true;
      }
    }
  }
}

class NarutoRunSfx extends Sfx {
  constructor(player) {
    super(player);
    this.narutoRunStartTime = 0;
    this.narutoRunFinishTime = 0;
    this.narutoRunTrailSoundStartTime = 0;
    this.narutoRunTurnSoundStartTime = 0;
    this.oldNarutoRunSound = null;
    this.currentQ = new THREE.Quaternion();
    this.preQ = new THREE.Quaternion();
    this.arr = [0, 0, 0, 0];
    this.willGasp = false;
  }
  update(timestamp, timeDiffS) {
    const timeSeconds = timestamp/1000;
    this.currentQ.copy(this.player.quaternion);
    let temp = this.currentQ.angleTo(this.preQ);
    for(let i = 0; i < 4; i++) {
      let temp2 = this.arr[i];
      this.arr[i] = temp;
      temp = temp2;
    }
    if(this.player.avatar.narutoRunState) {
      if(this.narutoRunStartTime===0) {
        this.narutoRunStartTime=timeSeconds; 
        sounds.playSound(this.soundFiles.sonicBoom[0]);
        this.playGrunt('narutoRun'); // check shared
      }
      else {
        if(this.arr.reduce((a, b) => a + b) >= Math.PI / 3) {
          this.arr.fill(0)
          if(timeSeconds - this.narutoRunTurnSoundStartTime > this.soundFiles.sonicBoom[3].duration - 0.9 || this.narutoRunTurnSoundStartTime == 0) {
            sounds.playSound(this.soundFiles.sonicBoom[3]);
            this.narutoRunTurnSoundStartTime = timeSeconds;
          }
        }
        if(timeSeconds - this.narutoRunTrailSoundStartTime > this.soundFiles.sonicBoom[2].duration - 0.2 || this.narutoRunTrailSoundStartTime==0) {
          const localSound = sounds.playSound(this.soundFiles.sonicBoom[2]);
          this.oldNarutoRunSound = localSound;
          localSound.addEventListener('ended', () => {
            if (this.oldNarutoRunSound === localSound) {
              this.oldNarutoRunSound = null;
            }
          });
          this.narutoRunTrailSoundStartTime = timeSeconds;
        }
      }
      // if naruto run play more than 2 sec, set willGasp
      if(timeSeconds - this.narutoRunStartTime > 2){
        this.willGasp = true;
      }
    }
    if(!this.player.avatar.narutoRunState && this.narutoRunStartTime!=0 ) {
      this.narutoRunStartTime = 0;
      this.narutoRunFinishTime = timeSeconds;
      this.narutoRunTrailSoundStartTime = 0;
      this.narutoRunTurnSoundStartTime = 0;
      sounds.playSound(this.soundFiles.sonicBoom[1]);
      if (this.oldNarutoRunSound) {
        !this.oldNarutoRunSound.paused && this.oldNarutoRunSound.stop();
        this.oldNarutoRunSound = null;
      }
    }
    this.preQ.x = this.currentQ.x;
    this.preQ.y = this.currentQ.y;
    this.preQ.z = this.currentQ.z;
    this.preQ.w = this.currentQ.w; // check q.copy?
  }
}

class ComboSfx extends Sfx {
  constructor(player) {
    super(player);
    this.lastSwordComboName = null;
    this.swordComboStartTime = 0;
    this.alreadyPlayComboSound = false;
  }
  update(timestamp, timeDiffS) {
    const timeSeconds = timestamp/1000;
    const useAction = this.player.getAction('use');
    if (useAction?.behavior === 'sword' && useAction?.animationCombo) {
      const comboAnimationName = aimAnimations[useAction.animationCombo[useAction.index]];
      if (comboAnimationName) {
        if (comboAnimationName !== this.lastSwordComboName) {
          this.swordComboStartTime = timeSeconds;
          this.alreadyPlayComboSound = false;
        }
        const animations = Avatar.getAnimations();
        const animation = animations.find(a => a.name === comboAnimationName);
        const animationComboIndices = Avatar.getanimationComboIndices();
        const animationIndices = animationComboIndices.find(i => i.name === comboAnimationName);
        const handDeltas = useAction.boneAttachment === 'leftHand' ? animationIndices.rightHandDeltas : animationIndices.leftHandDeltas;
        const maxDeltaIndex = useAction.boneAttachment === 'leftHand' ? animationIndices.maxRightDeltaIndex : animationIndices.maxLeftDeltaIndex;
        
        const ratio = (timeSeconds - this.swordComboStartTime) / animation.duration;
        if (ratio <= 1 && !this.alreadyPlayComboSound) {
          const index = Math.floor(ratio * handDeltas.length);
          if (index > maxDeltaIndex) {
            this.alreadyPlayComboSound = true;
            this.playGrunt('attack');
            const soundIndex = this.player.avatar.useAnimationIndex;
            this.dispatchEvent(new MessageEvent('meleewhoosh', {
              data: {
                index: soundIndex
              },
            }));
          }
        }
      }
      this.lastSwordComboName = comboAnimationName;
    }
  }
}

class GaspSfx extends Sfx {
  constructor(player) {
    super(player);
    this.startRunningTime = 0;
    this.willGasp = false;
  }
  update(timestamp, timeDiffS) {
    const timeSeconds = timestamp/1000;
    const currentSpeed = localVector.set(this.player.avatar.velocity.x, 0, this.player.avatar.velocity.z).length();
    const isRunning = currentSpeed > 0.5;
      if(isRunning){
        if(this.startRunningTime === 0)
          this.startRunningTime = timeSeconds;
      }
      else{
        if(this.startRunningTime !== 0 && this.willGasp && !this.player.avatar.narutoRunState){
          this.playGrunt('gasp');
        }
        this.willGasp = false;
        this.startRunningTime = 0;
      }
      
      if(timeSeconds - this.startRunningTime > 5 && this.startRunningTime !== 0){
        this.willGasp = true;
      }
  }
}

class FoodSfx extends Sfx {
  constructor(player) {
    super(player);
    this.lastEatFrameIndex = -1;
    this.lastDrinkFrameIndex = -1;
  }
  update(timestamp, timeDiffS) {
    const useAction = this.player.getAction('use');
      if (useAction) {
        const _handleEat = () => {
          const v = this.player.actionInterpolants.use.get();
          const eatFrameIndex = _getActionFrameIndex(v, eatFrameIndices);
          if (eatFrameIndex !== 0 && eatFrameIndex !== this.lastEatFrameIndex) {
            sounds.playSoundName('chomp');
            this.player.characterBehavior.setMouthMoving(0.04, 0.04, 0.1, 0.02);
          }
          this.lastEatFrameIndex = eatFrameIndex;
        };
        const _handleDrink = () => {
          const v = this.player.actionInterpolants.use.get();
          const drinkFrameIndex = _getActionFrameIndex(v, drinkFrameIndices);
          if (drinkFrameIndex !== 0 && drinkFrameIndex !== this.lastDrinkFrameIndex) {
            sounds.playSoundName('gulp');
            this.player.characterBehavior.setMouthMoving(0.1,0.1,0.1,0.1);
          }
          this.lastDrinkFrameIndex = drinkFrameIndex;
        };
        switch (useAction.behavior) {
          case 'eat': {
            _handleEat();
            break;
          }
          case 'drink': {
            _handleDrink();
            break;
          }
          default: {
            break;
          }
        }
      }
  }
}

class EmoteSfx extends Sfx {
  constructor(player) {
    super(player);
    this.lastEmote = null;
  }
  update(timestamp, timeDiffS) {
    if(this.player.avatar.emoteAnimation && this.lastEmote !== this.player.avatar.emoteAnimation){
      this.playEmote(this.player.avatar.emoteAnimation);
    }
    this.lastEmote = this.player.avatar.emoteAnimation;
  }
}


class CharacterSfx extends Sfx {
  constructor(player) {
    super(player);
    
    this.jumpSfx = new JumpSfx(this.player);
    this.stepSfx = new StepSfx(this.player);
    this.swimSfx = new SwimSfx(this.player);
    this.narutoRunSfx = new NarutoRunSfx(this.player);
    this.comboSfx = new ComboSfx(this.player);
    this.gaspSfx = new GaspSfx(this.player);
    this.foodSfx = new FoodSfx(this.player);
    this.emoteSfx = new EmoteSfx(this.player);
  }
  update(timestamp, timeDiffS) {
    if (!this.player.avatar) {
      return;
    }
    this.jumpSfx.update(timestamp, timeDiffS);
    this.stepSfx.update(timestamp, timeDiffS);
    this.swimSfx.update(timestamp, timeDiffS);
    this.narutoRunSfx.update(timestamp, timeDiffS);
    this.comboSfx.update(timestamp, timeDiffS);
    this.gaspSfx.update(timestamp, timeDiffS);
    this.foodSfx.update(timestamp, timeDiffS);
    this.emoteSfx.update(timestamp, timeDiffS);
  }
  
  destroy() {
    this.cleanup && this.cleanup();
  }
}

export {
  CharacterSfx,
};