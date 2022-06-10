import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScene, useParticleSystem, useProcGen, useLocalPlayer, useFrame} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();

// const emptyArray = [];
// const fnEmptyArray = () => emptyArray;
const numParticles = 100;

const particleNames = [
  'Elements - Explosion 003 Up noCT noRSZ.mov',
  'Elements - Explosion 004 Radial noCT noRSZ.mov',
  'Elements - Explosion 006 Up noCT noRSZ.mov',
  'Elements - Explosion 007 Up noCT noRSZ.mov',
  'Elements - Explosion 008 Up noCT noRSZ.mov',
  'Elements - Explosion 009 Up MIX noCT noRSZ.mov',
  'Elements - Explosion 010 Hit Radial MIX noCT noRSZ.mov',
  'Elements - Explosion 011 Hit Radial noCT noRSZ.mov',
  'Elements - Explosion 012 Up MIX noCT noRSZ.mov',
  'Elements - Explosion 013 Shot Hit Right MIX noCT noRSZ.mov',
  'Elements - Explosion 013 Up MIX noCT noRSZ.mov',
  'Elements - Explosion 015 Up MIX noCT noRSZ.mov',
  'Elements - Explosion 017 Radial MIX noCT noRSZ.mov',
  'Elements - Explosion 018 Up MIX noCT noRSZ.mov',
];

export default e => {
  const app = useApp();
  const scene = useScene();
  const particleSystemManager = useParticleSystem();
  const procGen = useProcGen();
  const {alea} = procGen;

  app.name = 'flare';

  class ParticlePlayer extends THREE.Object3D {
    constructor(particleSystem) {
      super();

      this.particleSystem = particleSystem;

      this.timeout = null;
      this.particles = [];
      
      const now = performance.now()
      this.lastRoundTimestamp = now;
    }
    update(timestamp) {
      const timeSinceLastRound = timestamp - this.lastRoundTimestamp;
      const roundTime = 3000;

      if (timeSinceLastRound > roundTime) {
        for (const particle of this.particles) {
          particle.destroy();
        }
        this.particles.length = 0;
      }
      if (this.particles.length === 0) {
        const localPlayer = useLocalPlayer();
        // const timeDiff = timestamp - this.lastParticleTimestamp;
        
        const rng = alea('lol');
        const r = n => -n + rng() * n * 2;
        for (let i = 0; i < numParticles; i++) {
          const particleName = particleNames[Math.floor(rng() * particleNames.length)];
          const duration = 2000;
          const particle = this.particleSystem.addParticle(particleName, {
            duration,
            // loop: false,
          });
          particle.position.copy(localPlayer.position)
            .add(localVector.set(r(1), r(1), r(1)));
          this.particles.push(particle);
        }

        this.lastRoundTimestamp = timestamp;
      }
    }
  }

  let particleSystem = null;
  let particlePlayer = null;
  ((async () => {
    particleSystem = particleSystemManager.createParticleSystem({
      particleNames,
      maxParticles: numParticles,
    });
    await particleSystem.waitForLoad();
    
    scene.add(particleSystem);
    particleSystem.updateMatrixWorld();

    particlePlayer = new ParticlePlayer(particleSystem);
  })());

  useFrame(({timestamp, timeDiff}) => {
    particlePlayer && particlePlayer.update(timestamp);
  });
  
  return app;
};