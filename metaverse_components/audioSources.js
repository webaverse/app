import * as THREE from 'three';
import metaversefile from 'metaversefile';

export default (app, component) => {
  const sounds = metaversefile.useSound();
  const soundFiles = sounds.getSoundFiles();
  let candidateSound = null;
  let localSound = null;
  

  switch (component.sound) {
    case 'fire': {
      candidateSound = soundFiles.sonicBoom[2];
      break;
    }
    case 'water': {
      candidateSound = soundFiles.sonicBoom[3];
      break;
    }
    default: {
      candidateSound = soundFiles.sonicBoom[0];
      break;
    }
  }
  
  app.addEventListener('destroy', () => {
    if(localSound)
      localSound.stop();
  });

  

  let startPlayTime = 0;
  const frame = metaversefile.useFrame(({timestamp, timeDiff}) => {
    const timeSeconds = timestamp / 1000;
    if(timeSeconds - startPlayTime > candidateSound.duration || startPlayTime === 0 ){
      localSound = sounds.playSound(candidateSound, {voicer: app, refDistance:1, maxDistance:10});
      startPlayTime = timeSeconds;
    }
  });

};