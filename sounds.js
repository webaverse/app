import * as THREE from 'three';
import {camera} from './renderer.js';
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

  audioSource: _getSoundFiles(/^audioSource\//),
};
const listener = new THREE.AudioListener();
camera.add( listener );

let soundFileAudioBuffer;
const loadPromise = (async () => {
  await Avatar.waitForLoad();

  const audioContext = Avatar.getAudioContext();
  soundFileAudioBuffer = await loadAudioBuffer(audioContext, '/sounds/sounds.mp3');
})();
const waitForLoad = () => loadPromise;

const getSoundFiles = () => soundFiles;
const getSoundFileAudioBuffer = () => soundFileAudioBuffer;

const sounds = [];
const playSound = (audioSpec, option) => {
  const {offset, duration} = audioSpec;
  
  if(option === undefined || option.soundType === 'background'){
    const audioContext = Avatar.getAudioContext();
    const audioBufferSourceNode = audioContext.createBufferSource();
    audioBufferSourceNode.buffer = soundFileAudioBuffer;
    audioBufferSourceNode.connect(audioContext.gain);
    audioBufferSourceNode.start(0, offset, duration);
    return audioBufferSourceNode;
  }
  else{
    const sound = new THREE.PositionalAudio( listener );
    sound.setBuffer( soundFileAudioBuffer );
    sound.offset = offset; 
    sound.duration = duration;

    const refDistance = option.refDistance !== undefined ? option.refDistance : 10;
    const maxDistance = option.maxDistance !== undefined ? option.maxDistance : 50;
    const distanceModel = option.distanceModel !== undefined ? option.distanceModel : 'inverse';
    const volume = option.volume !== undefined ? option.volume : 1;

    sound.setRefDistance(refDistance);
    sound.setMaxDistance(maxDistance);
    sound.setDistanceModel(distanceModel);
    sound.setVolume( volume );

    option.voicer.add(sound);
    sound.play();
    
    sounds.push(sound);
    sound.source.addEventListener('ended', () => {
      const index = sounds.indexOf(sound);
      if (index > -1) {
        // clean sounds array
        sounds.splice(index, 1);
      }
    });
    
    return sound;
  }
};
const update = () =>{
  for(const sound of sounds){
    sound.updateMatrixWorld();
  }
}
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
export {
  waitForLoad,
  getSoundFiles,
  getSoundFileAudioBuffer,
  playSound,
  playSoundName,
  update,
};