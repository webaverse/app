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

class CharacterSfx {
  constructor(player) {
    this.player = player;

    this.lastJumpState = false;
    this.lastStepped = [false, false];
    this.lastWalkTime = 0;
    this.lastEatFrameIndex = -1;
    this.lastDrinkFrameIndex = -1;

    this.narutoRunStartTime = 0;
    this.narutoRunFinishTime = 0;
    this.narutoRunTrailSoundStartTime = 0;
    this.narutoRunTurnSoundStartTime = 0;
    this.currentQ=new THREE.Quaternion();
    this.preQ=new THREE.Quaternion();
    this.arr = [0, 0, 0, 0];

    this.startRunningTime = 0;
    this.willGasp = false;

    this.oldNarutoRunSound = null;

    this.lastEmote = null;

    const wearupdate = e => {
      sounds.playSoundName(e.wear ? 'itemEquip' : 'itemUnequip');
    };
    player.addEventListener('wearupdate', wearupdate);
    this.cleanup = () => {
      player.removeEventListener('wearupdate', wearupdate);
    };
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
    // const soundFileAudioBuffer = sounds.getSoundFileAudioBuffer();

    // jump
    const _handleJump = () => {
      if (this.player.avatar.jumpState && !this.lastJumpState) {
        sounds.playSoundName('jump');

        // play jump grunt 
        if(this.player.hasAction('jump') && this.player.getAction('jump').trigger === 'jump'){
          this.playGrunt('jump'); 
        }
      } else if (this.lastJumpState && !this.player.avatar.jumpState) {
        sounds.playSoundName('land');
      }
      this.lastJumpState = this.player.avatar.jumpState;
    };
    _handleJump();

    // step
    const _handleStep = () => {
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
            if (leftStepIndices[i] && !this.lastStepped[0] && !this.player.avatar.narutoRunState && timeSeconds-this.narutoRunFinishTime>0.5) {
              const candidateAudios = localSoundFiles//.filter(a => a.paused);
              if (candidateAudios.length > 0) {
                /* for (const a of candidateAudios) {
                  !a.paused && a.pause();
                } */
                
                const audioSpec = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
                sounds.playSound(audioSpec);
              }
            }
            this.lastStepped[0] = leftStepIndices[i];

            if (rightStepIndices[i] && !this.lastStepped[1] && !this.player.avatar.narutoRunState && timeSeconds-this.narutoRunFinishTime>0.5) {
              const candidateAudios = localSoundFiles// .filter(a => a.paused);
              if (candidateAudios.length > 0) {
                /* for (const a of candidateAudios) {
                  !a.paused && a.pause();
                } */

                const audioSpec = candidateAudios[Math.floor(Math.random() * candidateAudios.length)];
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
      
    };
    _handleStep();

    const _handleNarutoRun = () => {
      
      this.currentQ.x=this.player.characterPhysics.player.quaternion.x;
      this.currentQ.y=this.player.characterPhysics.player.quaternion.y;
      this.currentQ.z=this.player.characterPhysics.player.quaternion.z;
      this.currentQ.w=this.player.characterPhysics.player.quaternion.w;
     
      let temp=this.currentQ.angleTo(this.preQ);
      for(let i=0;i<4;i++){
          let temp2=this.arr[i];
          this.arr[i]=temp;
          temp=temp2;
      }
        
      
      
      if(this.player.avatar.narutoRunState){
        if(this.narutoRunStartTime===0){
          this.narutoRunStartTime=timeSeconds; 
          sounds.playSound(soundFiles.sonicBoom[0]);
          this.playGrunt('narutoRun');
        }
        else {
          if(this.arr.reduce((a,b)=>a+b) >= Math.PI/3){

            this.arr.fill(0)
            if(timeSeconds - this.narutoRunTurnSoundStartTime>soundFiles.sonicBoom[3].duration-0.9 || this.narutoRunTurnSoundStartTime==0){
              sounds.playSound(soundFiles.sonicBoom[3]);
              this.narutoRunTurnSoundStartTime = timeSeconds;
            }
              
          }
         
          if(timeSeconds - this.narutoRunTrailSoundStartTime>soundFiles.sonicBoom[2].duration-0.2 || this.narutoRunTrailSoundStartTime==0){
            
            const localSound = sounds.playSound(soundFiles.sonicBoom[2]);
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
      if(!this.player.avatar.narutoRunState && this.narutoRunStartTime!=0 ){
        this.narutoRunStartTime=0;
        this.narutoRunFinishTime=timeSeconds;
        this.narutoRunTrailSoundStartTime=0;
        this.narutoRunTurnSoundStartTime=0;
        sounds.playSound(soundFiles.sonicBoom[1]);
        if (this.oldNarutoRunSound) {
          !this.oldNarutoRunSound.paused && this.oldNarutoRunSound.stop();
          this.oldNarutoRunSound = null;
        }
      }
      this.preQ.x=this.currentQ.x;
      this.preQ.y=this.currentQ.y;
      this.preQ.z=this.currentQ.z;
      this.preQ.w=this.currentQ.w;
  
    };
    _handleNarutoRun();
    

    const _handleGasp = () =>{
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
    _handleGasp();

    const _handleFood = () => {
      const useAction = this.player.getAction('use');
      if (useAction) {
        const _handleEat = () => {
          const v = this.player.actionInterpolants.use.get();
          const eatFrameIndex = _getActionFrameIndex(v, eatFrameIndices);

          // console.log('chomp', v, eatFrameIndex, this.lastEatFrameIndex);
          if (eatFrameIndex !== 0 && eatFrameIndex !== this.lastEatFrameIndex) {
            sounds.playSoundName('chomp');
            // control mouth movement
            this.player.characterBehavior.setMouthMoving(0.04,0.04,0.1,0.02);
          }

          this.lastEatFrameIndex = eatFrameIndex;
        };
        const _handleDrink = () => {
          // console.log('drink action', useAction);

          const v = this.player.actionInterpolants.use.get();
          const drinkFrameIndex = _getActionFrameIndex(v, drinkFrameIndices);

          // console.log('gulp', v, drinkFrameIndex, this.lastDrinkFrameIndex);
          if (drinkFrameIndex !== 0 && drinkFrameIndex !== this.lastDrinkFrameIndex) {
            sounds.playSoundName('gulp');
            // control mouth movement
            this.player.characterBehavior.setMouthMoving(0.1,0.1,0.1,0.1);
          }

          this.lastDrinkFrameIndex = drinkFrameIndex;
        };

        // console.log('got use action', useAction);
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
    };
    _handleFood();

    // emote
    const _handleEmote = () => {
      if(this.player.avatar.emoteAnimation && this.lastEmote !== this.player.avatar.emoteAnimation){
        this.playEmote(this.player.avatar.emoteAnimation);
      }
      this.lastEmote = this.player.avatar.emoteAnimation;
    };
    _handleEmote();
  }
  playGrunt(type, index){
    if (this.player.voicePack) { // ensure voice pack loaded
      let voiceFiles, offset, duration;
      switch (type) {
        case 'pain': {
          voiceFiles = this.player.voicePack.actionVoices.filter(f => /pain/i.test(f.name));
          break;
        }
        case 'scream': {
          voiceFiles = this.player.voicePack.actionVoices.filter(f => /scream/i.test(f.name));
          break;
        }
        case 'attack': {
          voiceFiles = this.player.voicePack.actionVoices.filter(f => /attack/i.test(f.name));
          break;
        }
        case 'angry': {
          voiceFiles = this.player.voicePack.actionVoices.filter(f => /angry/i.test(f.name));
          break;
        }
        case 'gasp': {
          voiceFiles = this.player.voicePack.actionVoices.filter(f => /gasp/i.test(f.name));
          break;
        }
        case 'jump': {
          voiceFiles = this.player.voicePack.actionVoices.filter(f => /jump/i.test(f.name));
          break;
        }
        case 'narutoRun': {
          voiceFiles = this.player.voicePack.actionVoices.filter(f => /nr/i.test(f.name));
          break;
        }
      }
      
      if(index===undefined){
        let voice = selectVoice(voiceFiles);
        duration = voice.duration;
        offset = voice.offset;
      }
      else{
        duration = voiceFiles[index].duration;
        offset = voiceFiles[index].offset;
      } 
      
      const audioContext = Avatar.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = this.player.voicePack.audioBuffer;

      // control mouth movement with audio volume
      if (!this.player.avatar.isAudioEnabled()) {
        this.player.avatar.setAudioEnabled(true);
      }
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());

      // if the oldGrunt are still playing
      if(this.oldGrunt){
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
  playEmote(type, index){
    if (this.player.voicePack) { // ensure voice pack loaded
      let voiceFiles, offset, duration;
      switch (type) {
        case 'alertSoft':
        case 'alert': {
          voiceFiles = this.player.voicePack.emoteVoices.filter(f => /alert/i.test(f.name));
          break;
        }
        case 'angrySoft':
        case 'angry': {
          voiceFiles = this.player.voicePack.emoteVoices.filter(f => /angry/i.test(f.name));
          break;
        }
        case 'embarrassedSoft':
        case 'embarrassed': {
          voiceFiles = this.player.voicePack.emoteVoices.filter(f => /emba/i.test(f.name));
          break;
        }
        case 'headNodSoft':
        case 'headNod': {
          voiceFiles = this.player.voicePack.emoteVoices.filter(f => /nod/i.test(f.name));
          break;
        }
        case 'headShakeSoft':
        case 'headShake': {
          voiceFiles = this.player.voicePack.emoteVoices.filter(f => /shake/i.test(f.name));
          break;
        }
        case 'sadSoft':
        case 'sad': {
          voiceFiles = this.player.voicePack.emoteVoices.filter(f => /sad/i.test(f.name));
          break;
        }
        case 'surpriseSoft':
        case 'surprise': {
          voiceFiles = this.player.voicePack.emoteVoices.filter(f => /surprise/i.test(f.name));
          break;
        }
        case 'victorySoft':
        case 'victory': {
          voiceFiles = this.player.voicePack.emoteVoices.filter(f => /victory/i.test(f.name));
          break;
        }
        default: {
          voiceFiles = this.player.voicePack.emoteVoices;
          break;
        }
      }
      
      if(index===undefined){
        let voice = selectVoice(voiceFiles);
        duration = voice.duration;
        offset = voice.offset;
      }
      else{
        duration = voiceFiles[index].duration;
        offset = voiceFiles[index].offset;
      } 
      
      const audioContext = Avatar.getAudioContext();
      const audioBufferSourceNode = audioContext.createBufferSource();
      audioBufferSourceNode.buffer = this.player.voicePack.audioBuffer;

      // control mouth movement with audio volume
      if (!this.player.avatar.isAudioEnabled()) {
        this.player.avatar.setAudioEnabled(true);
      }
      audioBufferSourceNode.connect(this.player.avatar.getAudioInput());

      // if the oldGrunt are still playing
      if(this.oldGrunt){
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
  destroy() {
    this.cleanup();
  }
}

export {
  CharacterSfx,
};