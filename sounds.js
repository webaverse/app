import audioManager from './audio-manager.js';
import {loadAudioBuffer} from './util.js';
import soundFileSpecs from './public/sounds/sound-files.json';

const _getSoundFiles = regex => soundFileSpecs.filter(f => regex.test(f.name));
const soundFiles = {
  walk: _getSoundFiles(/^walk\//),
  run: _getSoundFiles(/^run\//),
  jump: _getSoundFiles(/^jump\//),
  doubleJump: _getSoundFiles(/^doubleJump\//),
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
  menuSelect: _getSoundFiles(/PauseMenu_Select/),
  menuBack: _getSoundFiles(/ff8_menu_back/),
  menuLeft: _getSoundFiles(/PauseMenu_Turn_Left/),
  menuRight: _getSoundFiles(/PauseMenu_Turn_Right/),
  menuReady: _getSoundFiles(/ff7_cursor_ready/),
  menuBeep: _getSoundFiles(/beep/),
  menuBoop: _getSoundFiles(/boop/),
  itemEquip: _getSoundFiles(/Link_Item\.wav/),
  itemUnequip: _getSoundFiles(/Link_Item_Away/),
  zTargetCenter: _getSoundFiles(/ZTarget_Center/),
  zTargetObject: _getSoundFiles(/ZTarget_Object/),
  zTargetEnemy: _getSoundFiles(/ZTarget_Enemy/),
  zTargetCancel: _getSoundFiles(/ZTarget_Cancel/),
  battleTransition: _getSoundFiles(/ff7_battle_transition/),
  limitBreak: _getSoundFiles(/ff7_limit_break/),
  limitBreakReady: _getSoundFiles(/ff8_limit_ready/),
  naviHey: _getSoundFiles(/navi_hey/),
  naviWatchout: _getSoundFiles(/navi_watchout/),
  naviFriendly: _getSoundFiles(/navi_friendly/),
  naviItem: _getSoundFiles(/navi_item/),
  naviDanger: _getSoundFiles(/navi_danger/),
  bushCut: _getSoundFiles(/OOT_Bush_Cut/),
  // bushPickup: _getSoundFiles(/OOT_Bush_Pickup/),
  // bushWalk: _getSoundFiles(/OOT_Bush_Walk/),
  hpPickup: _getSoundFiles(/OOT_Get_Heart/),
  mpPickup: _getSoundFiles(/OOT_Get_SmallItem1/),
  refill: _getSoundFiles(/OOT_MagicRefill/),
  explosion: _getSoundFiles(/OOT_Bomb_Blow/),
  swordSlash: _getSoundFiles(/sword_slash/),

  menuBeepLow: _getSoundFiles(/pd_beep1/),
  menuBeepHigh: _getSoundFiles(/pd_beep2/),
  menuSweepIn: _getSoundFiles(/pd_sweep1/),
  menuSweepOut: _getSoundFiles(/pd_sweep2/),

  water: _getSoundFiles(/^water\//),
  biomes: _getSoundFiles(/^biomes\//),
};

let soundFileAudioBuffer;
const loadPromise = (async () => {
  const audioContext = audioManager.getAudioContext();
  soundFileAudioBuffer = await loadAudioBuffer(audioContext, '/sounds/sounds.mp3');
})();
const waitForLoad = () => loadPromise;

const getSoundFiles = () => soundFiles;
const getSoundFileAudioBuffer = () => soundFileAudioBuffer;

const playSound = audioSpec => {
  const {offset, duration} = audioSpec;
  const audioContext = audioManager.getAudioContext();
  const audioBufferSourceNode = audioContext.createBufferSource();
  audioBufferSourceNode.buffer = soundFileAudioBuffer;
  audioBufferSourceNode.connect(audioContext.gain);
  audioBufferSourceNode.start(0, offset, duration);
  return audioBufferSourceNode;
};
const playSoundName = name => {
  const snds = soundFiles[name];
  if (snds) {
    const sound = snds[Math.floor(Math.random() * snds.length)];
    playSound(sound);
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
};
