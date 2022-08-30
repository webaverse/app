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
      sounds.playSound(soundFiles.meleewhoosh[e.data.index]);
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