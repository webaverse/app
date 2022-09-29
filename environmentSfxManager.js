import * as sounds from './sounds.js';

class EnvironmentSfxManager {
  constructor() {
    this.biome = null;

    this.startPlayRandomTime = 0;
    this.randomDuration = 0;
    this.oldRandomSound = null;

    this.startPlayBaseTime = 0;
    this.baseDuration = 0;
    this.oldBaseSound = null;

    this.lastBiome = null;
  }

  setSfxEnvironment(biome) {
    this.biome = biome;
  }

  update(timestamp, timeDiffCapped) {
    const playEnvironmentSound = () => {
      if (this.lastBiome !== this.biome) {
        if (this.oldBaseSound) {
          !this.oldBaseSound.paused && this.oldBaseSound.stop();
          this.oldBaseSound = null;
        }
        if (this.oldRandomSound) {
          !this.oldRandomSound.paused && this.oldRandomSound.stop();
          this.oldRandomSound = null;
        }
        this.startPlayRandomTime = 0;
        this.randomDuration = 0;
        this.oldRandomSound = null;

        this.startPlayBaseTime = 0;
        this.baseDuration = 0;
        this.oldBaseSound = null;
      }
      const timeSeconds = timestamp / 1000;

      if (this.biome) {
        const soundFiles = sounds.getSoundFiles();

        if (timeSeconds - this.startPlayBaseTime > this.baseDuration) {
          const baseSoundRegex = new RegExp(`^biomes/${this.biome}_base.wav$`);
          const baseSoundcandidate = soundFiles.biomes.filter(f =>
            baseSoundRegex.test(f.name),
          );

          const audioSpec =
            baseSoundcandidate[
              Math.floor(Math.random() * baseSoundcandidate.length)
            ];
          this.startPlayBaseTime = timeSeconds;
          this.baseDuration = audioSpec.duration;

          const localSound = sounds.playSound(audioSpec);
          this.oldBaseSound = localSound;
          localSound.addEventListener('ended', () => {
            if (this.oldBaseSound === localSound) {
              this.oldBaseSound = null;
            }
          });
        }

        if (timeSeconds - this.startPlayRandomTime > this.randomDuration) {
          const randomSoundRegex = new RegExp(
            `^biomes/${this.biome}_random[0-9]*.wav$`,
          );
          const randomSoundcandidate = soundFiles.biomes.filter(f =>
            randomSoundRegex.test(f.name),
          );

          const audioSpec =
            randomSoundcandidate[
              Math.floor(Math.random() * randomSoundcandidate.length)
            ];
          this.startPlayRandomTime = timeSeconds;
          this.randomDuration = audioSpec.duration;
          const localSound = sounds.playSound(audioSpec);
          this.oldRandomSound = localSound;
          localSound.addEventListener('ended', () => {
            if (this.oldRandomSound === localSound) {
              this.oldRandomSound = null;
            }
          });
        }
      }

      this.lastBiome = this.biome;
    };
    playEnvironmentSound();
  }
}

const environmentSfxManager = new EnvironmentSfxManager();

export {environmentSfxManager};
