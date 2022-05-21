import Avatar from './avatars/avatars.js';
import {loadAudioBuffer} from './util.js';
import soundFileSpecs from './public/sounds/sound-files.json';
import metaversefile from 'metaversefile';

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
};

let soundFileAudioBuffer;
const loadPromise = (async () => {
  await Avatar.waitForLoad();

  const audioContext = Avatar.getAudioContext();
  soundFileAudioBuffer = await loadAudioBuffer(audioContext, '/sounds/sounds.mp3');
})();
const waitForLoad = () => loadPromise;

const getSoundFiles = () => soundFiles;
const getSoundFileAudioBuffer = () => soundFileAudioBuffer;


let audios = [];
const playSound = (audioSpec, voicer) => {
  const {offset, duration} = audioSpec;
  const audioContext = Avatar.getAudioContext();
  const audioBufferSourceNode = audioContext.createBufferSource();
  audioBufferSourceNode.buffer = soundFileAudioBuffer;
  
  if(voicer === undefined){
    audioBufferSourceNode.connect(audioContext.gain);
  }
  else{
    const pannerNode = audioContext.createPanner();
    //const gainNode = audioContext.createGain();
    pannerNode.panningModel = "HRTF";

    audioBufferSourceNode.connect(pannerNode);
    pannerNode.connect(audioContext.destination);
    //gainNode.connect(audioContext.destination);
    pannerNode.distanceModel = 'linear';
    pannerNode.maxDistance = 20;
    
    // handel audios array
    audioBufferSourceNode.audioInfo = {context: audioContext, pannerNode: pannerNode, voicer: voicer};
    audios.push(audioBufferSourceNode.audioInfo);
    audioBufferSourceNode.addEventListener('ended', () => {
      const index = audios.indexOf(audioBufferSourceNode.audioInfo);
      if (index > -1) {
        // clean audios array
        audios.splice(index, 1);
      }
    });

  }
  audioBufferSourceNode.start(0, offset, duration);
  return audioBufferSourceNode;
  
};

const playSoundName = (name, voicer) => {
  const snds = soundFiles[name];
  if (snds) {
    const sound = snds[Math.floor(Math.random() * snds.length)];
    playSound(sound, voicer);
    return true;
  } else {
    return false;
  }
};
const updateAudioPosition  = (currentDir, topVector) => {
  const localPlayer = metaversefile.useLocalPlayer();
  for(const audio of audios){
    audio.context.listener.setOrientation(currentDir.x, currentDir.y, currentDir.z, topVector.x, topVector.y, topVector.z);
    audio.context.listener.setPosition(localPlayer.position.x, localPlayer.position.y, localPlayer.position.z);
    audio.pannerNode.setPosition(audio.voicer.position.x, audio.voicer.position.y, audio.voicer.position.z);
    console.log(audio.pannerNode);
  }
}
export {
  waitForLoad,
  getSoundFiles,
  getSoundFileAudioBuffer,
  playSound,
  playSoundName,
  updateAudioPosition
};