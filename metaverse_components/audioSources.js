import metaversefile from 'metaversefile';

export default (app, component) => {
  const sounds = metaversefile.useSound();
  const soundFiles = sounds.getSoundFiles();
  
  let regex = new RegExp(component.sound, "i");
  const candidateSounds = soundFiles.audioSource.filter(f => regex.test(f.name));
  let candidateSound = null;
  const soundIndex = component.index !== undefined ? component.index : 0; 
  candidateSound = candidateSounds[soundIndex];
  
  let localSound = null;
  app.addEventListener('destroy', () => {
    if(localSound)
      localSound.stop();
  });

  let startPlayTime = 0;
  metaversefile.useFrame(({timestamp}) => {
    const timeSeconds = timestamp / 1000;
    if(timeSeconds - startPlayTime > candidateSound.duration || startPlayTime === 0 ){
      localSound = sounds.playSound(candidateSound, {
        voicer: app, 
        volume: component.volume,
        refDistance:component.refDistance, 
        maxDistance:component.maxDistance, 
        distanceModel: component.distanceModel
      });
      startPlayTime = timeSeconds;
    }
  });

};