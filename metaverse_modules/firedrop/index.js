import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScene, useParticleSystem, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

// const localVector = new THREE.Vector3();

const numParticles = 128;

const firedropParticleNames = [
  'Elements - Fire 114 Torch Windy loop noCT noRSZ.mov',
  'Elements - Fire 113 Torch Windy loop noCT noRSZ.mov',
  'Elements - Fire 112 Torch Calm loop noCT noRSZ.mov',
  'Elements - Fire 018 Torch Fireball Up Loop noCT noRSZ.mov',
  'Elements - Fire 008 Up Projectile Loop noCT noRSZ.mov',
  // 'Elements - Fire 047 Up Wide loop.mov',
];

export default e => {
  const app = useApp();
  const scene = useScene();
  const particleSystemManager = useParticleSystem();
  
  app.name = 'firedrop';

  // console.log('add fire drop', app.position.toArray().join(','));

  let particleSystem = null;
  const particles = [];
  e.waitUntil((async () => {
    {
      const localParticleSystem = particleSystemManager.createParticleSystem(firedropParticleNames, numParticles);
      await localParticleSystem.waitForLoad();
      scene.add(localParticleSystem);
      particleSystem = localParticleSystem;
    }
    {
      const firedropParticleName = firedropParticleNames[Math.floor(Math.random() * firedropParticleNames.length)];
      const duration = 1000;
      const loop = true;
      const particle = particleSystem.addParticle(firedropParticleName, {
        duration,
        loop,
      });
      particle.position.copy(app.position);
      particle.updateMatrixWorld();
      particles.push(particle);
    }
  })());

  useCleanup(() => {
    scene.remove(particleSystem);
    particleSystem.destroy();
  });
  
  return app;
};