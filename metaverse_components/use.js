import * as THREE from 'three';
import metaversefile from 'metaversefile';



export default (app, component) => {
  const {useUse} = metaversefile;
  const sounds = metaversefile.useSound();
  const soundFiles = sounds.getSoundFiles();
  
  let using = false;
  let player = null;
  
  
  
  useUse((e) => {
    using = e.use;
  });
  const meleewhoosh = (e) =>{
    if(using){
      const index = e.data.index;
      const soundRegex = new RegExp(`^combat/sword_slash${index}-[0-9]*.wav$`);
      const soundCandidate = soundFiles.combat.filter(f => soundRegex.test(f.name));
      const audioSpec = soundCandidate[Math.floor(Math.random() * soundCandidate.length)];
      sounds.playSound(audioSpec);
    }
  }
  const _unwear = () => {
    if (component.behavior === 'sword') {
        player.characterSfx.removeEventListener('meleewhoosh', meleewhoosh);
    }
    player = null;
  };
  app.addEventListener('wearupdate', e => {
    if (e.wear) {
      player = e.player;
      if (component.behavior === 'sword') {
        player.characterSfx.addEventListener('meleewhoosh', meleewhoosh);
      }
    } else {
      _unwear();
    }
  });
  return app;
};