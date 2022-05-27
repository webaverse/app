import metaversefile from 'metaversefile';

export default (app, component) => {
  const sounds = metaversefile.useSound();
  const soundFiles = sounds.getSoundFiles();
  const soundIndex = component.index !== undefined ? component.index : 1; 
  let regex = new RegExp('^audiosource/' + component.sound + soundIndex + '.wav$');
  const candidateSound = soundFiles.audiosource.filter(f => regex.test(f.name))[0];
  
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
        soundEmitter: app, 
        volume: component.volume,
        refDistance:component.refDistance, 
        maxDistance:component.maxDistance, 
        distanceModel: component.distanceModel
      });
      startPlayTime = timeSeconds;
    }
  });

};