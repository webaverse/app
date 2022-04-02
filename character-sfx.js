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

const jumpGruntIndex={
  'shishi':3,
  'bryce':15,
  'griffin':8,
  'tiffany':10,
  'andrew':11,
}
const gaspGruntIndex={
  'shishi':[0,1],
  'bryce':[0,2,4],
  'griffin':[0],
  'tiffany':[0,7,8],
  'andrew':[0,4,5,8],
}
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

    this.playGasp=false;
    this.runStep=0;
    this.lastRunningTime=0;
    
    this.oldNarutoRunSound = null;
    this.oldGrunt=null;
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
        const audioSpec = soundFiles.jump[Math.floor(Math.random() * soundFiles.jump.length)];
        sounds.playSound(audioSpec);
        if(this.player.voicePack!==null && !this.player.hasAction('fly') && !this.player.hasAction('narutoRun'))
          this.playGrunt('attack',jumpGruntIndex[this.player.voicePack.voicePackName]);
      } else if (this.lastJumpState && !this.player.avatar.jumpState) {
        const audioSpec = soundFiles.land[Math.floor(Math.random() * soundFiles.land.length)];
        sounds.playSound(audioSpec);
      }
      this.lastJumpState = this.player.avatar.jumpState;
    };
    _handleJump();

    // step
    const _handleStep = () => {
      if (idleWalkFactor > 0.7 && !this.player.avatar.jumpState && !this.player.avatar.flyState) {
        this.playGasp=false;
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

        if(isRunning){
          this.lastRunningTime = timeSeconds;
          this.runStep++;
        }
      }
      
      if(idleWalkFactor<=0.1 && this.lastWalkTime>0 && !this.playGasp){
        
        if(timeSeconds-this.lastRunningTime<2 && this.runStep>100 && !this.player.hasAction('narutoRun')){
          const rand = gaspGruntIndex[this.player.voicePack.voicePackName][Math.floor(Math.random()*gaspGruntIndex[this.player.voicePack.voicePackName].length)];
          this.playGrunt('gasp',rand);
          this.playGasp=true;
        }
        this.runStep=0;
        
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
            if(!this.player.getAction('sit')){
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

    const _handleFood = () => {
      const useAction = this.player.getAction('use');
      if (useAction) {
        const _handleEat = () => {
          const v = this.player.actionInterpolants.use.get();
          const eatFrameIndex = _getActionFrameIndex(v, eatFrameIndices);

          // console.log('chomp', v, eatFrameIndex, this.lastEatFrameIndex);
          if (eatFrameIndex !== 0 && eatFrameIndex !== this.lastEatFrameIndex) {
            const audioSpec = soundFiles.chomp[Math.floor(Math.random() * soundFiles.chomp.length)];
            if (!this.player.avatar.isAudioEnabled()) {
              this.player.avatar.setAudioEnabled(true);
            }
            sounds.playSound(audioSpec).connect(this.player.avatar.getAudioInput());
          }

          this.lastEatFrameIndex = eatFrameIndex;
        };
        const _handleDrink = () => {
          // console.log('drink action', useAction);

          const v = this.player.actionInterpolants.use.get();
          const drinkFrameIndex = _getActionFrameIndex(v, drinkFrameIndices);

          // console.log('gulp', v, drinkFrameIndex, this.lastDrinkFrameIndex);
          if (drinkFrameIndex !== 0 && drinkFrameIndex !== this.lastDrinkFrameIndex) {
            const audioSpec = soundFiles.gulp[Math.floor(Math.random() * soundFiles.gulp.length)];
            if (!this.player.avatar.isAudioEnabled()) {
              this.player.avatar.setAudioEnabled(true);
            }
            sounds.playSound(audioSpec).connect(this.player.avatar.getAudioInput());
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
  }
  playGrunt(type, index){
    
    let fileIndex;
    let voiceFiles;
    switch (type) {
      case 'pain': {
        voiceFiles = this.player.voicePack.actionFiles.filter(f => /Pain/.test(f.name));
        break;
      }
      case 'scream': {
        voiceFiles = this.player.voicePack.actionFiles.filter(f => /Scream/.test(f.name));
        break;
      }
      case 'attack': {
        voiceFiles = this.player.voicePack.actionFiles.filter(f => /Attack/.test(f.name));
        break;
      }
      case 'angry': {
        voiceFiles = this.player.voicePack.actionFiles.filter(f => /Angry/.test(f.name));
        break;
      }
      case 'gasp': {
        voiceFiles = this.player.voicePack.actionFiles.filter(f => /Gasp/.test(f.name));
        break;
      }
    }
    

    if(index===undefined)
      fileIndex=Math.floor(Math.random()*voiceFiles.length);
    else 
      fileIndex=index;
    
    const {offset, duration}=voiceFiles[fileIndex];
    
    const audioContext = Avatar.getAudioContext();
    const audioBufferSourceNode = audioContext.createBufferSource();
    audioBufferSourceNode.buffer = this.player.voicePack.audioBuffer;
    if (!this.player.avatar.isAudioEnabled()) {
      this.player.avatar.setAudioEnabled(true);
    }
    audioBufferSourceNode.connect(this.player.avatar.getAudioInput());
    if(this.oldGrunt){
      this.oldGrunt.stop();
    }
    this.oldGrunt=audioBufferSourceNode;
    
    //audioBufferSourceNode.connect(audioContext.destination);
    audioBufferSourceNode.start(0, offset, duration);
  }
  destroy() {
    // nothing
  }
}

export {
  CharacterSfx,
};