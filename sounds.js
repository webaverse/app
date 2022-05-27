import * as THREE from 'three';
import {camera} from './renderer.js';
import {world} from './world.js';
import Avatar from './avatars/avatars.js';
import {loadAudioBuffer} from './util.js';
import soundFileSpecs from './public/sounds/sound-files.json';

const _getSoundFiles = regex => soundFileSpecs.filter(f => regex.test(f.name));
const soundFiles = {
  walk: _getSoundFiles(/^walk\//),
  run: _getSoundFiles(/^run\//),
  jump: _getSoundFiles(/^jump\//),
  land: _getSoundFiles(/^land\//),
  narutoRun: _getSoundFiles(/^narutoRun\//),
  sonicBoom: _getSoundFiles(/^sonicBoom\//),
  chomp: _getSoundFiles(/^food\/chomp/),
  combat: _getSoundFiles(/^combat\//),
  gulp: _getSoundFiles(/^food\/gulp/),
  enemyDeath: _getSoundFiles(/ff7_enemy_death/),
  enemyCut: _getSoundFiles(/ff7_cut/),
  // menuOpen: _getSoundFiles(/PauseMenu_Open/),
  // menuOpen: _getSoundFiles(/ff8_save/),
  menuOpen: _getSoundFiles(/ff7_save/),
  // menuOpen: _getSoundFiles(/ff8_menu_open\.wav/),
  // menuClose: _getSoundFiles(/PauseMenu_Close/),
  menuClose: _getSoundFiles(/ff8_menu_back/),
  menuMove: _getSoundFiles(/PauseMenu_Cursor/),
  menuNext: _getSoundFiles(/OOT_Dialogue_Next/),
  menuDone: _getSoundFiles(/OOT_Dialogue_Done/),
  menuClick: _getSoundFiles(/ff8_click/),
  menuOk: _getSoundFiles(/ff8_menu_ok/),
  menuBack: _getSoundFiles(/ff8_menu_back/),
  menuLeft: _getSoundFiles(/PauseMenu_Turn_Left/),
  menuRight: _getSoundFiles(/PauseMenu_Turn_Right/),
  menuReady: _getSoundFiles(/ff7_cursor_ready/),
  itemEquip: _getSoundFiles(/Link_Item\.wav/),
  itemUnequip: _getSoundFiles(/Link_Item_Away/),
  zTargetCenter: _getSoundFiles(/ZTarget_Center/),
  zTargetObject: _getSoundFiles(/ZTarget_Object/),
  zTargetEnemy: _getSoundFiles(/ZTarget_Enemy/),
  zTargetCancel: _getSoundFiles(/ZTarget_Cancel/),
  battleTransition: _getSoundFiles(/ff7_battle_transition/),
  limitBreak: _getSoundFiles(/ff7_limit_break/),
  limitBreakReady: _getSoundFiles(/ff8_limit_ready/),

  audiosource: _getSoundFiles(/^audiosource\//),
};

const audioContext = Avatar.getAudioContext();

let soundFileAudioBuffer;
const loadPromise = (async () => {
  await Avatar.waitForLoad();
  soundFileAudioBuffer = await loadAudioBuffer(audioContext, '/sounds/sounds.mp3');
})();
const waitForLoad = () => loadPromise;

const getSoundFiles = () => soundFiles;
const getSoundFileAudioBuffer = () => soundFileAudioBuffer;

// dry sound
const masterOut = audioContext.createGain();
masterOut.connect(audioContext.destination);

// reverb
const convolver = audioContext.createConvolver();
convolver.buffer = createNoiseBuffer(audioContext, 2);
convolver.connect(masterOut);

// wet sound
const reverbGain = audioContext.createGain();
reverbGain.connect(convolver);


const currentPlayingSound = [];
const playSound = (audioSpec, option) => {
  const {offset, duration} = audioSpec;

  const audioBufferSourceNode = audioContext.createBufferSource();
  audioBufferSourceNode.buffer = soundFileAudioBuffer;
  if (option === undefined) {
    // play the sound globally
    audioBufferSourceNode.connect(masterOut);
  } 
  else {
    // play positional audio
    const pannerNode = audioContext.createPanner();
    pannerNode.panningModel = "HRTF";
    const gainNode = audioContext.createGain();

    audioBufferSourceNode.connect(pannerNode);
    pannerNode.connect(gainNode);
    gainNode.connect(masterOut);

    const refDistance = option.refDistance !== undefined ? option.refDistance : 10;
    const maxDistance = option.maxDistance !== undefined ? option.maxDistance : 50;
    const distanceModel = option.distanceModel !== undefined ? option.distanceModel : 'inverse';
    const volume = option.volume !== undefined ? option.volume : 1;

    pannerNode.refDistance = refDistance;
    pannerNode.maxDistance = maxDistance;
    pannerNode.distanceModel = distanceModel;
    gainNode.gain.value = volume;
    gainNode.inReverbZone = false;

    // handel currentPlayingSound array
    audioBufferSourceNode.info = {soundEmitter: option.soundEmitter, panner: pannerNode, gainNode: gainNode};
    currentPlayingSound.push(audioBufferSourceNode.info);
    // remove audioBufferSourceNode from array when sound end
    audioBufferSourceNode.addEventListener('ended', () => {
      const index = currentPlayingSound.indexOf(audioBufferSourceNode.info);
      if (index > -1) {
        currentPlayingSound.splice(index, 1);
      }
    });
  }
  audioBufferSourceNode.start(0, offset, duration);
  return audioBufferSourceNode;
};
const playSoundName = (name, option) => {
  const snds = soundFiles[name];
  if (snds) {
    const sound = snds[Math.floor(Math.random() * snds.length)];
    playSound(sound, option);
    return true;
  } else {
    return false;
  }
};


function easeOfNoise (x, powNum) {
  return Math.pow(x, powNum);
}
function createNoiseBuffer(audioContext, length) {

  const bufferSize = length * audioContext.sampleRate;
  const lBuffer = new Float32Array(bufferSize);
  const rBuffer = new Float32Array(bufferSize);
  
  for (let i = 0; i < bufferSize; i++) {
    const ratio = (bufferSize - i) / bufferSize; // will be 1 at the start of the loop and 0 at the end
    const fadeAmount = easeOfNoise(ratio, 2);
    lBuffer[i] = (1 - (2 * Math.random())) * fadeAmount;
    rBuffer[i] = (1 - (2 * Math.random())) * fadeAmount;
  }
  
  const buffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
  buffer.copyToChannel(lBuffer,0);
  buffer.copyToChannel(rBuffer,1);

  return buffer;

}
function isCameraInReverbZone() {
  for(const reverbZone of world.reverbZones){
    reverbZonsPos.set(reverbZone[0], reverbZone[1], reverbZone[2]);
    if(camera.position.distanceTo(reverbZonsPos) < reverbZone[3]){
      return true;
    }
  }
}

const upVectore = new THREE.Vector3(0, 1, 0);
let reverbZonsPos = new THREE.Vector3(); 
let cameraDirection = new THREE.Vector3();
let localVector = new THREE.Vector3();
const update = () =>{
  const inReverbZone = isCameraInReverbZone();

  localVector.set(0, 0, -1);
  cameraDirection = localVector.applyQuaternion( camera.quaternion );
  cameraDirection.normalize();
  // update listener 
  audioContext.listener.setOrientation(cameraDirection.x, cameraDirection.y, cameraDirection.z, upVectore.x, upVectore.y, upVectore.z);
  audioContext.listener.setPosition(camera.position.x, camera.position.y, camera.position.z);
  
  
  for(const sound of currentPlayingSound){
    // update panner
    sound.panner.setPosition(sound.soundEmitter.position.x, sound.soundEmitter.position.y, sound.soundEmitter.position.z);
    // handle reverb node
    if(inReverbZone){
      if(!sound.gainNode.inReverbZone){
        sound.gainNode.connect(reverbGain);
        sound.gainNode.inReverbZone = true;
      }
    }
    else{
      if(sound.gainNode.inReverbZone){
        sound.gainNode.disconnect(reverbGain);
        sound.gainNode.inReverbZone = false;
      }
    }
  }
}

export {
  waitForLoad,
  getSoundFiles,
  getSoundFileAudioBuffer,
  playSound,
  playSoundName,
  update,
  audioContext,
  currentPlayingSound
};