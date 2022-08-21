import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScene, usePhysics, useParticleSystem, useProcGen, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

// const localVector = new THREE.Vector3();

const size = 1;
const numParticles = 128;
const particleNames = [
  'Elements - Fire 114 Torch Windy loop noCT noRSZ.mov',
  'Elements - Fire 113 Torch Windy loop noCT noRSZ.mov',
  'Elements - Fire 112 Torch Calm loop noCT noRSZ.mov',
  'Elements - Fire 018 Torch Fireball Up Loop noCT noRSZ.mov',
  'Elements - Fire 008 Up Projectile Loop noCT noRSZ.mov',
  // 'Elements - Fire 047 Up Wide loop.mov',
];
const downQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

export default e => {
  const app = useApp();
  const scene = useScene();
  const physicsManager = usePhysics();
  const particleSystemManager = useParticleSystem();
  const procGen = useProcGen();
  const {alea} = procGen;

  app.name = 'firedrop';

  const rng = alea(app.name);
  const r = n => -n + 2 * n * rng();

  let particleSystem = null;
  const particles = [];

  let live = true;
  e.waitUntil((async () => {
    {
      const localParticleSystem = particleSystemManager.createParticleSystem({
        particleNames,
        size,
        maxParticles: numParticles,
      });
      await localParticleSystem.waitForLoad();
      if (live) {
        scene.add(localParticleSystem);
        particleSystem = localParticleSystem;
      }
    }

    const _addParticle = (particleName, position) => {
      const duration = 1000;
      const loop = true;
      const particle = particleSystem.addParticle(particleName, {
        duration,
        loop,
      });
      particle.position.copy(position);
      particle.updateMatrixWorld();
      particles.push(particle);
      return particle;
    };
    if (live) {
      const particleName = particleNames[Math.floor(rng() * particleNames.length)];
      const dropParticle = _addParticle(particleName, app.position);

      const result = physicsManager.raycast(dropParticle.position, downQuaternion);
      if (result) {
        const basePoint = new THREE.Vector3().fromArray(result.point);
        const numExtraParticles = numParticles - 1;
        for (let i = 0; i < numExtraParticles; i++) {
          const particleName = particleNames[Math.floor(rng() * particleNames.length)];
          _addParticle(
            particleName,
            basePoint.clone()
              .add(new THREE.Vector3(r(3), size * 0.25, r(3))),
          );
        }
      }
    }
  })());

  useCleanup(() => {
    live = false;
    if (particleSystem) {
      scene.remove(particleSystem);
      particleSystem.destroy();
    }
  });

  return app;
};
